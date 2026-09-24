/**
 * SERVER-FIXTURES — a running app, an HTTP client, and a task the qa-reader
 * can read. Shared by backend-test, phase4d-test, ai-live-test and ai-pilot.
 *
 * Everything goes through the domain operations. There is no shortcut that
 * writes a task straight into the database: a fixture that bypasses the domain
 * proves the fixture rather than the system.
 */

import { createApp } from '../../server/app.js';
import { createServer } from '../../server/index.js';
import { createAgentRuntime } from '../../server/agent-runtime.js';
import { fixtureProvider } from '../../server/ai/provider.js';
import { loadConfig } from '../../server/config.js';
import { payload, drive } from './fixtures.mjs';

/** An app with AI on and a scripted provider. Refused in production by config. */
export function aiApp(dbPath, script, extra = {}) {
  const app = createApp({
    config: {
      db: { file: dbPath, createIfMissing: true },
      ai: { ...loadConfig().ai, enabled: true, qaReaderEnabled: true, provider: 'fixture', timeoutMs: 500, ...extra },
    },
  });
  app.agentRuntime = createAgentRuntime(app.db, app.ops, app.config, { provider: fixtureProvider(app.config, script) });
  return app;
}

/** Swap the provider on a live app — one line, because everything is behind the adapter. */
export const useProvider = (app, provider) => {
  app.agentRuntime = createAgentRuntime(app.db, app.ops, app.config, { provider });
  return app;
};
export const useScript = (app, script) => useProvider(app, fixtureProvider(app.config, script));

/**
 * A project containing a task agent.qa-reader is genuinely eligible for, with
 * its dependencies completed and its inputs supplied.
 *
 * The target is DISCOVERED, not named: the agent holds cap.quality-review, and
 * which stage of which workflow that lands on is the catalogue's business. A
 * hand-picked task id would test the test.
 */
export function qaScenario(app, { email = 'qa@pixora.test', feature = 'feat.branding.social_posts', quantity = 6 } = {}) {
  const { client } = app.ops.resolveClient({ name: 'Staging client', email });
  const made = app.ops.createOrder(payload([{ featureId: feature, quantity }]), { clientId: client.id });
  if (!made.ok) throw new Error(`scenario: the order would not validate — ${JSON.stringify(made.problems)}`);
  app.ops.submitOrder(made.order.id); app.ops.reviewOrder(made.order.id); app.ops.approveOrder(made.order.id);
  const project = app.ops.convertOrderToProject(made.order.id).project;
  app.ops.generateTasksFromWorkflow(project.id);
  app.ops.setAgentStatus('agent.qa-reader', 'active');

  const agent = app.ops.getAgent('agent.qa-reader');
  const target = app.ops.getTasks({ projectId: project.id })
    .filter((t) => t.aiEligible && t.requiredCapabilities.length
      && t.requiredCapabilities.every((cap) => agent.capabilities.includes(cap)))
    .sort((a, b) => a.order - b.order)[0];
  if (!target) throw new Error('scenario: no task in this project matches the qa-reader');

  const clear = (id, seen = new Set()) => {
    for (const dep of app.ops.getTask(id).dependencies) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      clear(dep, seen);
      if (app.ops.getTask(dep).status !== 'completed') drive(app.ops, dep);
    }
    app.ops.refreshTaskReadiness({ projectId: project.id });
  };
  clear(target.id);
  for (const i of app.ops.getTask(target.id).inputs) {
    app.ops.provideInput(target.id, { key: i.key, value: `supplied ${i.key}` });
  }
  return { app, client, order: made.order, project, task: app.ops.getTask(target.id) };
}

/**
 * The full live round trip: a real project, a deliberately incomplete
 * submission (so a correct reading is `fail`, not a rubber stamp), and
 * whatever provider the app holds. ai-live-test calls it with the real one.
 */
export async function runLiveQaReader(app) {
  const s = qaScenario(app, { email: 'live@pixora.test' });
  if (s.task.outputs.length) {
    app.ops.recordOutput(s.task.id, { key: s.task.outputs[0].key, value: 'Three post designs delivered as PNG. The other three are still outstanding.' });
  }
  return app.agentRuntime.runQaReader(s.task.id, { by: 'live-test' });
}

/** An HTTP client, so the API is exercised over the wire. Headers come back too. */
export function client(base, token = null) {
  const call = async (method, p, body = null, tok = token, headers = {}) => {
    const res = await fetch(base + p, {
      method,
      headers: { 'content-type': 'application/json', ...(tok ? { authorization: `Bearer ${tok}` } : {}), ...headers },
      body: body === null ? undefined : JSON.stringify(body),
    });
    let parsed = null;
    try { parsed = await res.json(); } catch { parsed = null; }
    return { status: res.status, body: parsed, headers: Object.fromEntries(res.headers.entries()) };
  };
  return {
    get: (p, tok, h) => call('GET', p, null, tok, h),
    post: (p, b, tok, h) => call('POST', p, b, tok, h),
    as: (tok) => client(base, tok),
  };
}

/**
 * A real server on a free port against a temp database, closed afterwards.
 *
 * THE `config` KEY IS MERGED, NOT SPREAD OVER. Written the obvious way —
 * `{ config: {…}, ...overrides }` — a trailing spread puts `overrides.config`
 * back whole and drops the temp database, so the case quietly runs against
 * server/data/pixora.db. Both copies of this helper had that shape; one of
 * them was bitten by it.
 */
export async function withServer(file, fn, overrides = {}) {
  const { config: configOverride = {}, ...rest } = overrides;
  const { app, server } = createServer({
    ...rest,
    config: { db: { file, createIfMissing: true }, ...configOverride },
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { return await fn({ app, base, file, api: client(base) }); }
  finally { await new Promise((r) => server.close(r)); app.db.close(); }
}
