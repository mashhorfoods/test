/**
 * APP — the composition root.
 *
 * The one place where infrastructure and domain meet. Everything above this
 * line is HTTP; everything below it is the domain, which has not changed since
 * Phase 3 and does not know a server exists.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOperations } from '../src/operations/index.js';
import { openDatabase } from './db/database.js';
import { sqliteRepositories } from './db/sqlite-store.js';
import { createAuth } from './auth.js';
import { createLoginLimiter } from './rate-limit.js';
import { createAuthz } from './authz.js';
import { createDurableAutomation } from './automation-runtime.js';
import { createAgentRuntime } from './agent-runtime.js';
import { loadConfig, assertProductionSecrets, redact } from './config.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

export function createApp(overrides = {}) {
  const config = loadConfig(overrides.config || {});
  const problems = assertProductionSecrets(config);
  if (problems.length) throw new Error(`config: ${problems.join('; ')}`);

  const db = overrides.db || openDatabase(config.db.file, {
    createIfMissing: config.db.createIfMissing,
    migrationsDir: path.join(ROOT, 'server/migrations'),
  });

  const auth = createAuth(db, config);
  const authz = createAuthz();
  /* Phase 4D: the login throttle. It lives beside auth rather than inside it —
     counting failures is an edge concern, and `login()` still means exactly
     what it meant in Phase 4. */
  const limiter = createLoginLimiter(db, config);
  auth.bootstrap();

  /* Automation's record of what ran lives on disk. It is created first and
     handed to the domain as a ledger — the domain calls it, never the reverse. */
  const automation = createDurableAutomation(db, config);

  /* THE DOMAIN, UNCHANGED. Same call as the CLI makes, same call the tests
     make — only the stores and the ledger differ, which is the whole claim of
     Phase 2's repository contract. */
  const ops = createOperations({
    catalogue: readJson('catalogue/catalogue.json'),
    statuses: readJson('src/data/operations/statuses.json'),
    execution: readJson('src/data/operations/execution.json'),
    automationRules: readJson('src/data/operations/automation.json'),
    agentRegistry: readJson('src/data/operations/agents.json'),
    stores: sqliteRepositories(db),
    automationLedger: automation.ledger,
  });

  /* Phase 4C: the agent runtime, and the provider behind an adapter. */
  const agentRuntime = createAgentRuntime(db, ops, config);

  /**
   * THE SWEEP. Everything that has to happen on a timer, in one place, so no
   * job is written and then never scheduled — which is what the review found
   * for three of these four. Each job is isolated: one that throws is reported
   * and the others still run.
   */
  const sweep = () => {
    const out = {};
    const jobs = {
      automation: () => automation.recoverStale(),
      agentExecutions: () => agentRuntime.recoverStale(),
      sessions: () => auth.pruneSessions(),
      loginAttempts: () => limiter.prune(),
    };
    for (const [name, job] of Object.entries(jobs)) {
      try { out[name] = job(); } catch (e) { out[name] = { error: e.message }; }
    }
    return out;
  };

  const startSweeper = ({ intervalSeconds = config.automation.sweepIntervalSeconds } = {}) => {
    const timer = setInterval(sweep, intervalSeconds * 1000);
    timer.unref();
    return () => clearInterval(timer);
  };

  return { config, db, auth, authz, limiter, ops, automation, agentRuntime, sweep, startSweeper, info: () => redact(config) };
}
