/**
 * SCENARIO-HELPERS — the fixtures Phase 4D validation is built on.
 *
 * These exist so tools/phase4d-test.mjs and tools/ai-pilot.mjs can build a real
 * order, a real project and a real task WITHOUT copying the walk into two more
 * files, and without editing tools/backend-test.mjs — that suite is the Phase 4
 * regression baseline, and a baseline you edit while validating against it is
 * not one.
 *
 * Everything here goes through the domain operations. There is no shortcut that
 * writes a task straight into the database, because a fixture that bypasses the
 * domain proves the fixture rather than the system.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/app.js';
import { createAgentRuntime } from '../server/agent-runtime.js';
import { fixtureProvider } from '../server/ai/provider.js';
import { loadConfig } from '../server/config.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
export const CATALOGUE = read('catalogue/catalogue.json');

/** A builder payload, priced from the catalogue so the boundary check passes. */
export function payload(lines) {
  const feats = lines.map((l) => ({ ...l, f: CATALOGUE.features.find((x) => x.id === l.featureId) }));
  let once = 0;
  const services = new Map();
  for (const l of feats) {
    const amt = ['included', 'quote'].includes(l.f.pricing.type) ? 0 : l.f.pricing.from * (l.quantity ?? 1);
    if (l.f.pricing.period !== 'monthly') once += amt;
    const e = {
      featureId: l.featureId, serviceId: l.f.service, quantity: l.quantity ?? 1, origin: 'chosen',
      pricing: {
        type: l.f.pricing.type, billing: l.f.pricing.period === 'monthly' ? 'monthly' : 'once',
        unitAmount: ['included', 'quote'].includes(l.f.pricing.type) ? 0 : l.f.pricing.from, amount: amt,
      },
    };
    if (l.f.addonGroup) e.addonGroup = l.f.addonGroup;
    if (!services.has(l.f.service)) services.set(l.f.service, []);
    services.get(l.f.service).push(e);
  }
  return {
    version: '1.0', source: 'pixora.package-builder', currency: 'USD', language: 'en',
    services: [...services.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([serviceId, features]) => ({ serviceId, features: features.sort((a, b) => (a.featureId < b.featureId ? -1 : 1)) })),
    addons: [], packages: [],
    pricing: {
      currency: 'USD', subtotal: { oneTime: once, monthly: 0 }, discount: { oneTime: 0, monthly: 0 },
      total: { oneTime: once, monthly: 0 }, quotedItems: 0, lineItems: lines.length,
    },
    message: 'Phase 4D validation.',
  };
}

/** Take one task all the way to completed, the way a person would. */
export const drive = (ops, id, { by = 'reviewer-1', executor = 'worker-1' } = {}) => {
  let t = ops.getTask(id);
  if (t.status === 'pending' || t.status === 'blocked') ops.refreshTaskReadiness({ projectId: t.projectId });
  if (ops.getTask(id).status === 'ready') ops.assignTask(id, { assignee: executor });
  if (ops.getTask(id).status === 'assigned') ops.startTask(id);
  t = ops.getTask(id);
  if (t.status !== 'in_progress') return t;
  for (const o of t.outputs) if (!o.produced) ops.recordOutput(id, { key: o.key, value: `v-${o.key}` });
  ops.submitTaskForReview(id);
  ops.passAllQa(id, { by });
  ops.approveTask(id, { by });
  ops.completeTask(id);
  return ops.getTask(id);
};

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
  const { client } = app.ops.resolveClient({ name: 'Phase 4D staging', email });
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

/** A well-formed model answer for a given task. */
export const answer = (task, { result = 'pass', status = 'pass', criteria = null, summary = 'A reading.' } = {}) =>
  JSON.stringify({
    result,
    checks: (criteria || task.qaCriteria.map((c) => c.id)).map((id) => ({ criterionId: id, status, evidence: 'seen' })),
    missing: [], warnings: [], confidence: 0.9, summary,
  });
