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

  /* THE DOMAIN, UNCHANGED. Same call as the CLI makes, same call the tests
     make — only the stores differ, which is the whole claim of Phase 2's
     repository contract. */
  const ops = createOperations({
    catalogue: readJson('catalogue/catalogue.json'),
    statuses: readJson('src/data/operations/statuses.json'),
    execution: readJson('src/data/operations/execution.json'),
    automationRules: readJson('src/data/operations/automation.json'),
    agentRegistry: readJson('src/data/operations/agents.json'),
    stores: sqliteRepositories(db),
  });

  /* Phase 4B: automation state moves onto disk. The in-process engine stays as
     the rule evaluator; what becomes durable is the record of what ran. */
  const automation = createDurableAutomation(db, ops, config);
  ops._durable = automation;

  /* Phase 4C: the agent runtime, and the provider behind an adapter. */
  const agentRuntime = createAgentRuntime(db, ops, config);

  return { config, db, auth, authz, limiter, ops, automation, agentRuntime, info: () => redact(config) };
}
