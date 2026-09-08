-- 003 — login rate limiting (Phase 4D §19).
--
-- The Phase 4 report listed "no login rate limiting" as the one remaining
-- production warning on the authentication path. scrypt at N=16384 makes each
-- guess expensive for the attacker AND for this server, so an unthrottled
-- login endpoint is both a credential-stuffing target and a cheap way to pin a
-- CPU. This table is the throttle.
--
-- WHAT IS AND IS NOT STORED. Never a password, never a token, and not even the
-- address that was tried: the key is a SHA-256 of "scope|value", so a stolen
-- database yields a set of opaque counters. That is deliberate — a table
-- listing every email address anyone ever typed at the login form is a
-- disclosure in its own right, and it is not needed to count failures.
--
-- Durable rather than in-memory, for the same reason the automation ledger is:
-- a counter a restart forgets is a lockout an attacker can clear by waiting
-- for a deploy.

CREATE TABLE IF NOT EXISTS login_attempts (
  bucket_key   TEXT PRIMARY KEY,
  scope        TEXT NOT NULL,
  failures     INTEGER NOT NULL DEFAULT 0,
  lockouts     INTEGER NOT NULL DEFAULT 0,
  first_at     TEXT NOT NULL,
  last_at      TEXT NOT NULL,
  locked_until TEXT
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked ON login_attempts(locked_until);
CREATE INDEX IF NOT EXISTS idx_login_attempts_last ON login_attempts(last_at);
