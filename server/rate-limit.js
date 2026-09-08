/**
 * RATE-LIMIT — the throttle in front of the login endpoint.
 *
 * THE POLICY, IN ONE PARAGRAPH. Failures are counted in two buckets: one for
 * the address being tried and one for the calling IP. Five failures against
 * one address inside fifteen minutes locks that address for fifteen minutes;
 * fifty failures from one IP inside the same window locks the IP for five.
 * Each subsequent lockout on the same bucket doubles, to a ceiling of an hour.
 * A successful sign-in clears both buckets. Nothing else about authentication
 * changes: the same credentials that worked yesterday work today, and the
 * failure message is still the one message.
 *
 * WHY TWO BUCKETS. The per-address bucket is the real defence — credential
 * stuffing distributes across IPs, so an IP limit alone stops nothing. The per
 * IP bucket is the load shed: scrypt at N=16384 costs this server real CPU per
 * guess, and an unthrottled endpoint is a denial of service you pay for.
 * The IP threshold is deliberately loose, because an office behind one NAT is
 * a normal thing and locking it out is a self-inflicted outage.
 *
 * IT MUST NOT ANSWER "DOES THIS ACCOUNT EXIST". Every bucket is keyed on what
 * the caller TYPED, before anyone looks it up, so an unknown address throttles
 * exactly like a known one, and the 429 is byte-identical either way. That is
 * the property §19 asks for, and it is a property of the design rather than of
 * remembering to write the same message twice.
 *
 * WHAT IS STORED: a SHA-256 of "scope|value", a count, and two timestamps. Not
 * the address, not the password, not the attempt. See migration 003.
 */

import crypto from 'node:crypto';

const nowIso = () => new Date().toISOString();
const keyOf = (scope, value) =>
  crypto.createHash('sha256').update(`${scope}|${String(value || '').trim().toLowerCase()}`).digest('hex');
const seconds = (from, to) => Math.max(0, Math.ceil((Date.parse(to) - Date.parse(from)) / 1000));

export function createLoginLimiter(db, config) {
  const policy = config.auth.rateLimit;

  const load = (bucketKey) => db.prepare('SELECT * FROM login_attempts WHERE bucket_key = ?').get(bucketKey) || null;

  const buckets = ({ ip = null, email = null }) => {
    const out = [];
    if (email) out.push({ scope: 'account', key: keyOf('account', email), limit: policy.accountFailures, lockSeconds: policy.accountLockSeconds });
    if (ip) out.push({ scope: 'ip', key: keyOf('ip', ip), limit: policy.ipFailures, lockSeconds: policy.ipLockSeconds });
    return out;
  };

  /* A window that has elapsed is a window that no longer counts — but a
     LOCKOUT that has elapsed still happened. Failures reset; the lockout count
     does not, or an attacker who waits out one lock gets the short lock again
     for ever and "progressive" means nothing. The count decays by `prune()`
     deleting a bucket nobody has touched, which is the right decay: quiet for a
     window and you start clean. */
  const live = (row, at) => {
    if (!row) return { failures: 0, lockouts: 0, firstAt: at, lockedUntil: null };
    const lockedUntil = row.locked_until && row.locked_until > at ? row.locked_until : null;
    /* A lock that has been served resets the failure count as surely as an
       elapsed window does: somebody who waited out fifteen minutes and then
       mistypes once should not be locked out again on that single mistake. */
    const served = Boolean(row.locked_until) && !lockedUntil;
    const stale = served || (!lockedUntil && seconds(row.first_at, at) > policy.windowSeconds);
    return {
      failures: stale ? 0 : row.failures,
      lockouts: row.lockouts,
      firstAt: stale ? at : row.first_at,
      lockedUntil,
    };
  };

  const api = {
    policy: () => ({ ...policy }),
    enabled: () => policy.enabled,

    /**
     * May this attempt proceed? Answered before any password work is done —
     * shedding the load is most of the point.
     */
    check({ ip = null, email = null, at = nowIso() } = {}) {
      if (!policy.enabled) return { allowed: true };
      let retryAfter = 0;
      let scope = null;
      for (const b of buckets({ ip, email })) {
        const row = load(b.key);
        if (row && row.locked_until && row.locked_until > at) {
          const wait = seconds(at, row.locked_until);
          if (wait > retryAfter) { retryAfter = wait; scope = b.scope; }
        }
      }
      return retryAfter > 0
        ? { allowed: false, retryAfterSeconds: Math.max(1, retryAfter), scope }
        : { allowed: true };
    },

    /** One more failure against both buckets, locking whichever crosses. */
    recordFailure({ ip = null, email = null, at = nowIso() } = {}) {
      if (!policy.enabled) return [];
      const states = [];
      for (const b of buckets({ ip, email })) {
        const state = live(load(b.key), at);
        const failures = state.failures + 1;
        const { lockouts, firstAt } = state;

        let { lockedUntil } = state;
        let nextLockouts = lockouts;
        if (!lockedUntil && failures >= b.limit) {
          /* PROGRESSIVE. The second lockout on the same bucket is twice the
             first, and so on to the ceiling — an attacker who waits out one
             lock waits longer for the next, while a person who mistyped once
             is inconvenienced for the base interval and no more. */
          const span = Math.min(b.lockSeconds * (2 ** lockouts), policy.maxLockSeconds);
          lockedUntil = new Date(Date.parse(at) + span * 1000).toISOString();
          nextLockouts = lockouts + 1;
        }

        db.prepare(`INSERT INTO login_attempts (bucket_key, scope, failures, lockouts, first_at, last_at, locked_until)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(bucket_key) DO UPDATE SET
                      failures = excluded.failures, lockouts = excluded.lockouts,
                      first_at = excluded.first_at, last_at = excluded.last_at,
                      locked_until = excluded.locked_until`)
          .run(b.key, b.scope, failures, nextLockouts, firstAt, at, lockedUntil);

        states.push({ scope: b.scope, failures, locked: Boolean(lockedUntil), lockedUntil });
      }
      return states;
    },

    /**
     * A sign-in that worked clears the counters. Including the IP one: an
     * office behind a NAT should not accumulate a lockout from one colleague's
     * bad morning, and an attacker who already holds valid credentials for one
     * account has no use for the IP counter — the account bucket for every
     * OTHER address still locks at five.
     */
    recordSuccess({ ip = null, email = null } = {}) {
      if (!policy.enabled) return 0;
      let cleared = 0;
      for (const b of buckets({ ip, email })) {
        cleared += db.prepare('DELETE FROM login_attempts WHERE bucket_key = ?').run(b.key).changes;
      }
      return cleared;
    },

    /** Housekeeping: an elapsed window that is not a live lock is not evidence. */
    prune({ at = nowIso() } = {}) {
      const cutoff = new Date(Date.parse(at) - policy.windowSeconds * 1000).toISOString();
      return db.prepare('DELETE FROM login_attempts WHERE last_at < ? AND (locked_until IS NULL OR locked_until < ?)')
        .run(cutoff, at).changes;
    },

    /** For operations: how many buckets are locked right now, and nothing more. */
    state({ at = nowIso() } = {}) {
      const rows = db.prepare('SELECT scope, COUNT(*) AS n FROM login_attempts WHERE locked_until > ? GROUP BY scope').all(at);
      return { locked: Object.fromEntries(rows.map((r) => [r.scope, r.n])) };
    },
  };

  return api;
}
