/**
 * AI-LIVE-HELPERS — the full round trip, used only when a real key is present.
 *
 * Kept in its own file so ai-live-test.mjs does not import a project builder it
 * will not use. Everything here goes through the same domain operations and the
 * same agent runtime the API uses; there is no second path for "the live test".
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/** A builder payload for one feature, priced from the catalogue. */
function payload(catalogue, featureId, quantity = 1) {
  const f = catalogue.features.find((x) => x.id === featureId);
  const amount = ['included', 'quote'].includes(f.pricing.type) ? 0 : f.pricing.from * quantity;
  const e = {
    featureId, serviceId: f.service, quantity, origin: 'chosen',
    pricing: { type: f.pricing.type, billing: f.pricing.period === 'monthly' ? 'monthly' : 'once',
      unitAmount: ['included', 'quote'].includes(f.pricing.type) ? 0 : f.pricing.from, amount },
  };
  if (f.addonGroup) e.addonGroup = f.addonGroup;
  const monthly = e.pricing.billing === 'monthly';
  return {
    version: '1.0', source: 'pixora.package-builder', currency: 'USD', language: 'en',
    services: [{ serviceId: f.service, features: [e] }], addons: [], packages: [],
    pricing: {
      currency: 'USD',
      subtotal: { oneTime: monthly ? 0 : amount, monthly: monthly ? amount : 0 },
      discount: { oneTime: 0, monthly: 0 },
      total: { oneTime: monthly ? 0 : amount, monthly: monthly ? amount : 0 },
      quotedItems: 0, lineItems: 1,
    },
    message: 'Live integration check.',
  };
}

const drive = (ops, id, by = 'live-operator') => {
  let t = ops.getTask(id);
  if (t.status === 'pending' || t.status === 'blocked') ops.refreshTaskReadiness({ projectId: t.projectId });
  if (ops.getTask(id).status === 'ready') ops.assignTask(id, { assignee: 'live-worker' });
  if (ops.getTask(id).status === 'assigned') ops.startTask(id);
  t = ops.getTask(id);
  if (t.status !== 'in_progress') return t;
  for (const o of t.outputs) if (!o.produced) ops.recordOutput(id, { key: o.key, value: `value for ${o.key}` });
  ops.submitTaskForReview(id);
  ops.passAllQa(id, { by });
  ops.approveTask(id, { by });
  ops.completeTask(id);
  return ops.getTask(id);
};

/**
 * Build a real project, walk to a task agent.qa-reader is eligible for, give it
 * something to check, and let the real model read it.
 */
export async function runLiveQaReader(app) {
  const catalogue = read('catalogue/catalogue.json');
  const { ops } = app;

  const { client } = ops.resolveClient({ name: 'Live Integration', email: 'live@pixora.test' });
  const made = ops.createOrder(payload(catalogue, 'feat.branding.social_posts', 6), { clientId: client.id });
  if (!made.ok) throw new Error(`live: the order would not validate — ${JSON.stringify(made.problems)}`);
  ops.submitOrder(made.order.id); ops.reviewOrder(made.order.id); ops.approveOrder(made.order.id);
  const project = ops.convertOrderToProject(made.order.id).project;
  ops.generateTasksFromWorkflow(project.id);
  ops.setAgentStatus('agent.qa-reader', 'active');

  const agent = ops.getAgent('agent.qa-reader');
  const target = ops.getTasks({ projectId: project.id })
    .filter((t) => t.aiEligible && t.requiredCapabilities.length
      && t.requiredCapabilities.every((c) => agent.capabilities.includes(c)))
    .sort((a, b) => a.order - b.order)[0];
  if (!target) throw new Error('live: no task in this project matches the qa-reader');

  const clear = (id, seen = new Set()) => {
    for (const dep of ops.getTask(id).dependencies) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      clear(dep, seen);
      if (ops.getTask(dep).status !== 'completed') drive(ops, dep);
    }
    ops.refreshTaskReadiness({ projectId: project.id });
  };
  clear(target.id);
  for (const i of ops.getTask(target.id).inputs) {
    ops.provideInput(target.id, { key: i.key, value: `supplied ${i.key}` });
  }

  /* Something for the reader to actually check: a deliberately incomplete
     submission, so a correct answer is a `fail` rather than a rubber stamp. */
  const task = ops.getTask(target.id);
  if (task.outputs.length) {
    ops.recordOutput(task.id, { key: task.outputs[0].key, value: 'Three post designs delivered as PNG. The other three are still outstanding.' });
  }

  return app.agentRuntime.runQaReader(task.id, { by: 'live-test' });
}
