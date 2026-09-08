/**
 * DATABASE — SQLite, through Node's own built-in driver.
 *
 * WHY SQLITE AND WHY node:sqlite.
 * This project has had zero runtime dependencies since its first commit, and
 * that has been worth more than any single library. Node 22 ships a SQLite
 * driver in core, so persistence costs nothing in supply chain: no package, no
 * native build, no version to keep patched. It is a real database with real
 * transactions and real indexes, and for an agency's order book it is not a
 * compromise — it is the right size.
 *
 * MIGRATIONS ARE FORWARD-ONLY AND VERSIONED. Each file in server/migrations is
 * applied once, in filename order, inside a transaction, and recorded. Nothing
 * drops a table, nothing runs on a schedule, and production never resets. A
 * migration that fails rolls back and stops the boot, because a half-migrated
 * database is worse than one that will not start.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function openDatabase(file, { createIfMissing = true, migrationsDir = null } = {}) {
  const dir = path.dirname(file);
  if (file !== ':memory:') {
    if (!fs.existsSync(file) && !createIfMissing) {
      throw new Error(`database: ${file} does not exist and this environment will not create one — check the volume is mounted`);
    }
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(file);
  /* WAL for concurrent readers alongside a writer; FULL synchronous so a crash
     cannot lose an acknowledged write, which is the whole reason this exists. */
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = FULL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');

  db.exec(`CREATE TABLE IF NOT EXISTS migrations (
    version    TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL,
    checksum   TEXT NOT NULL
  )`);

  if (migrationsDir) migrate(db, migrationsDir);
  return db;
}

/** Apply every migration not yet recorded, in order, each in its own transaction. */
export function migrate(db, migrationsDir) {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const applied = new Map(
    db.prepare('SELECT version, checksum FROM migrations').all().map((r) => [r.version, r.checksum]),
  );
  const done = [];

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const checksum = simpleChecksum(sql);

    if (applied.has(version)) {
      /* A MIGRATION THAT CHANGED AFTER BEING APPLIED is a schema nobody can
         reason about: two deployments would have different tables under the
         same version number. Refuse rather than guess. */
      if (applied.get(version) !== checksum) {
        throw new Error(`database: migration ${version} has changed since it was applied — write a new migration instead of editing an old one`);
      }
      continue;
    }

    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO migrations (version, applied_at, checksum) VALUES (?, ?, ?)')
        .run(version, new Date().toISOString(), checksum);
      db.exec('COMMIT');
      done.push(version);
    } catch (e) {
      db.exec('ROLLBACK');
      throw new Error(`database: migration ${version} failed and was rolled back — ${e.message}`);
    }
  }
  return done;
}

/** Enough to notice an edited migration. Not a security control. */
function simpleChecksum(text) {
  let h1 = 0x811c9dc5; let h2 = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    h1 = Math.imul(h1 ^ text.charCodeAt(i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 + text.charCodeAt(i), 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16)}${h2.toString(16)}`;
}

export const appliedMigrations = (db) =>
  db.prepare('SELECT version, applied_at FROM migrations ORDER BY version').all();
