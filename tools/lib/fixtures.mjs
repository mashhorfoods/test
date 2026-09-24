/**
 * FIXTURES — builder payloads and task walks, shared by every node test suite.
 *
 * There were five copies of `payload()`. The Phase 2 one understood tiers,
 * composite parts, add-on groups, quoted lines and packages; the Phase 4 ones
 * priced every line as `from × quantity` and would have produced a wrong total
 * the first time a test ordered a tiered or composite feature. This is the
 * complete one, and the only one.
 *
 * Pure: no server, no database. Suites that need a running app also import
 * ./server-fixtures.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalogue } from '../../src/operations/catalogue-read.js';
import { linePrice } from '../../src/operations/line-price.js';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
export const CATALOGUE = read('catalogue/catalogue.json');
const CAT = createCatalogue(CATALOGUE);

/**
 * A payload the way the builder writes one, priced from the catalogue.
 * `lines` are `{ featureId, quantity?, tier?, partOf?, options?, origin?, billing? }`.
 */
export function payload(lines, { scope = null, packages = [], currency = 'USD', language = 'en' } = {}) {
  const byService = new Map();
  let once = 0; let monthly = 0; let quoted = 0;
  const addons = [];
  for (const line of lines) {
    const f = CAT.feature(line.featureId);
    if (!f) throw new Error(`fixtures: ${line.featureId} is not in the catalogue`);
    const p = CAT.featurePricing(line.featureId);
    const svc = CAT.serviceOf(line.featureId);
    const qty = line.quantity ?? 1;
    const factor = line.tier ? ((f.tiers.levels.find((l) => l.id === line.tier) || {}).priceFactor || 1) : 1;
    const isPart = Boolean(line.partOf);
    const { unitAmount: unit, amount } = linePrice({ type: p.type, from: p.from, factor, quantity: qty, isPart });
    if (p.type === 'quote') quoted += 1;
    const billing = (p.period === 'monthly' || line.billing === 'monthly') ? 'monthly' : 'once';
    if (amount > 0) { if (billing === 'monthly') monthly += amount; else once += amount; }
    const entry = {
      featureId: line.featureId,
      serviceId: svc,
      quantity: qty,
      origin: line.origin || (isPart ? 'part' : 'chosen'),
      pricing: { type: isPart ? 'part' : p.type, billing, unitAmount: unit, amount },
    };
    if (line.tier) entry.tier = line.tier;
    if (line.options) entry.options = line.options;
    if (line.partOf) entry.partOf = line.partOf;
    if (f.composedOf) entry.composedOf = [...f.composedOf];
    if (f.addonGroup) {
      entry.addonGroup = f.addonGroup;
      addons.push({ featureId: line.featureId, serviceId: svc, addonGroup: f.addonGroup, quantity: qty, amount });
    }
    if (!byService.has(svc)) byService.set(svc, []);
    byService.get(svc).push(entry);
  }
  const out = {
    version: '1.0',
    source: 'pixora.package-builder',
    currency,
    language,
    services: [...byService.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([serviceId, features]) => ({ serviceId, features: features.sort((a, b) => (a.featureId < b.featureId ? -1 : 1)) })),
    addons: addons.sort((a, b) => (a.featureId < b.featureId ? -1 : 1)),
    packages,
    pricing: {
      currency,
      subtotal: { oneTime: once, monthly },
      discount: { oneTime: 0, monthly: 0 },
      total: { oneTime: once, monthly },
      quotedItems: quoted,
      lineItems: lines.filter((l) => !l.partOf).length,
    },
    message: 'Hi Pixora — I built this scope on your site: …',
  };
  if (scope) out.scope = scope;
  return out;
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

/** A well-formed qa-reader answer for a task. `extra` overrides any field. */
export const answer = (task, { result = 'pass', status = 'pass', criteria = null, summary = 'A reading.', extra = {} } = {}) =>
  JSON.stringify({
    result,
    checks: (criteria || task.qaCriteria.map((c) => c.id)).map((id) => ({ criterionId: id, status, evidence: 'seen' })),
    missing: [], warnings: [], confidence: 0.9, summary,
    ...extra,
  });
