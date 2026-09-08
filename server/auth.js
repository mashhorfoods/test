/**
 * AUTH — who are you.
 *
 * PASSWORDS ARE NEVER STORED, AND NEITHER ARE SESSION TOKENS.
 * A password becomes a scrypt hash with a per-user salt. A session token is 32
 * random bytes handed to the client once and stored only as a SHA-256 hash, so
 * a leaked database yields neither a password nor a live session. Comparisons
 * are timing-safe.
 *
 * There is no third-party identity provider here, and adding one would be a
 * dependency and an outage this project does not need. What is here is small
 * enough to read in one sitting, which is its own security property.
 */

import crypto from 'node:crypto';
import { fail } from './errors.js';

const now = () => new Date().toISOString();
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** The roles the system knows. Anything else is refused at creation. */
export const ROLES = ['admin', 'operations', 'reviewer', 'executor', 'client', 'agent', 'system'];

export function createAuth(db, config) {
  const { scrypt } = config.auth;

  const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
    salt,
    hash: crypto.scryptSync(password, salt, scrypt.keylen, { N: scrypt.N, r: scrypt.r, p: scrypt.p }).toString('hex'),
  });

  const verifyPassword = (password, salt, expected) => {
    const got = crypto.scryptSync(password, salt, scrypt.keylen, { N: scrypt.N, r: scrypt.r, p: scrypt.p });
    const want = Buffer.from(expected, 'hex');
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  };

  const api = {
    /** Create a user. `clientId` scopes a client user to their own records. */
    createUser({ email, name, password, role = 'operations', clientId = null }) {
      const address = String(email || '').trim().toLowerCase();
      if (!address || !address.includes('@')) throw fail('VALIDATION_ERROR', 'a user needs an email address');
      if (!name) throw fail('VALIDATION_ERROR', 'a user needs a name');
      if (!ROLES.includes(role)) throw fail('VALIDATION_ERROR', `"${role}" is not a role — try ${ROLES.join(', ')}`);
      if (!password || String(password).length < 12) {
        throw fail('VALIDATION_ERROR', 'a password must be at least 12 characters — this is the only thing between an order book and the internet');
      }
      if (role === 'client' && !clientId) throw fail('VALIDATION_ERROR', 'a client user must be scoped to a client');
      if (db.prepare('SELECT id FROM users WHERE email = ?').get(address)) {
        throw fail('CONFLICT', 'that email address already has an account');
      }

      const { salt, hash } = hashPassword(String(password));
      const id = `usr.${now().slice(0, 10)}.${crypto.randomBytes(4).toString('hex')}`;
      db.prepare(`INSERT INTO users (id, email, name, role, client_id, password_hash, password_salt, status, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`)
        .run(id, address, name, role, clientId, hash, salt, now(), now());
      return api.getUser(id);
    },

    getUser(id) {
      const r = db.prepare('SELECT id, email, name, role, client_id, status, created_at FROM users WHERE id = ?').get(id);
      return r ? { id: r.id, email: r.email, name: r.name, role: r.role, clientId: r.client_id, status: r.status, createdAt: r.created_at } : null;
    },

    listUsers: () => db.prepare('SELECT id, email, name, role, client_id, status FROM users ORDER BY created_at')
      .all().map((r) => ({ id: r.id, email: r.email, name: r.name, role: r.role, clientId: r.client_id, status: r.status })),

    /**
     * Sign in. The failure message is identical whether the address is unknown
     * or the password is wrong, and the work is done either way — an endpoint
     * that answers faster for an unknown address is an endpoint that enumerates
     * your users.
     */
    login(email, password, { userAgent = null } = {}) {
      const address = String(email || '').trim().toLowerCase();
      const row = db.prepare('SELECT * FROM users WHERE email = ?').get(address);
      const decoy = hashPassword('not-the-password-but-the-same-work');
      const ok = row
        ? row.status === 'active' && verifyPassword(String(password || ''), row.password_salt, row.password_hash)
        : verifyPassword(String(password || ''), decoy.salt, decoy.hash) && false;
      if (!ok) throw fail('AUTHENTICATION_ERROR', 'that email address and password do not match an active account');

      const token = crypto.randomBytes(32).toString('base64url');
      const expires = new Date(Date.now() + config.auth.sessionHours * 3600 * 1000).toISOString();
      db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)')
        .run(hashToken(token), row.id, now(), expires, userAgent);
      return { token, expiresAt: expires, user: api.getUser(row.id) };
    },

    /** Resolve a bearer token to a user, or refuse. */
    authenticate(token) {
      if (!token) throw fail('AUTHENTICATION_ERROR', 'this endpoint needs a bearer token');
      const s = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(hashToken(token));
      if (!s) throw fail('AUTHENTICATION_ERROR', 'that session does not exist');
      if (s.revoked_at) throw fail('AUTHENTICATION_ERROR', 'that session was signed out');
      if (s.expires_at <= now()) throw fail('AUTHENTICATION_ERROR', 'that session has expired');
      const user = api.getUser(s.user_id);
      if (!user || user.status !== 'active') throw fail('AUTHENTICATION_ERROR', 'that account is not active');
      return user;
    },

    logout(token) {
      if (!token) return false;
      const r = db.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
        .run(now(), hashToken(token));
      return r.changes > 0;
    },

    /** Sign a user out everywhere — the control you want during an incident. */
    revokeAllSessions(userId) {
      return db.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
        .run(now(), userId).changes;
    },

    setUserStatus(userId, status) {
      if (!['active', 'suspended'].includes(status)) throw fail('VALIDATION_ERROR', 'a user is active or suspended');
      db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), userId);
      if (status === 'suspended') api.revokeAllSessions(userId);
      return api.getUser(userId);
    },

    /** Seed the first administrator, once, on an empty database. */
    bootstrap() {
      const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
      if (count > 0) return null;
      const { bootstrapEmail, bootstrapPassword } = config.auth;
      if (!bootstrapEmail || !bootstrapPassword) return null;
      return api.createUser({ email: bootstrapEmail, name: 'Administrator', password: bootstrapPassword, role: 'admin' });
    },

    /** Housekeeping. Expired sessions are not evidence of anything. */
    pruneSessions() {
      return db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now()).changes;
    },
  };

  return api;
}
