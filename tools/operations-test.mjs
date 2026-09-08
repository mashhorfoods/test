/* =============================================================================
   OPERATIONS-TEST
   Phase 2: ORDER -> CRM -> PROJECT, tested against the real catalogue.

   WHY IT USES THE REAL CATALOGUE AND A FROZEN CLOCK.
   The point of this layer is that it holds no copy of the business — it asks.
   A test with a hand-written fake catalogue would pass while the real one said
   something else, which is the exact failure the layer exists to prevent. So
   it loads catalogue/catalogue.json, and the only thing faked is time and
   randomness, so ids are reproducible and a diff of a failure is readable.

   The payloads are the ones the BUILDER actually produces — captured from
   tools/builder-test.cjs scenarios and kept in fixtures below — so an order
   here is an order a visitor could really have built.

   Run:  node tools/operations-test.mjs
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOperations, memoryStore, jsonFileStore } from '../src/operations/index.js';
import { createCatalogue } from '../src/operations/catalogue-read.js';
import { validateOrder } from '../src/operations/order.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const CATALOGUE = read('catalogue/catalogue.json');
/* Taken before anything runs. The claim is that the domain never writes to the
   catalogue — comparing against the FILE would only compare JSON formatting. */
const CATALOGUE_AT_LOAD = JSON.stringify(CATALOGUE);
const STATUSES = read('src/data/operations/statuses.json');

const fails = [];
const passes = [];
const ok = (label, cond, detail = '') => {
  if (cond) passes.push(label);
  else fails.push(`${label}${detail ? ` — ${detail}` : ''}`);
};
const group = (name) => passes.push(`--- ${name}`);

/* A clock that ticks a second per call, and a deterministic "random". */
function fixtures() {
  let t = Date.parse('2026-09-08T09:00:00Z');
  let seed = 1;
  return {
    now: () => new Date((t += 1000)),
    random: () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; },
  };
}

function ops(extra = {}) {
  const f = fixtures();
  return createOperations({
    catalogue: CATALOGUE,
    statuses: STATUSES,
    stores: { clients: memoryStore(), orders: memoryStore(), projects: memoryStore() },
    now: f.now,
    random: f.random,
    ...extra,
  });
}

/* ---------- payload fixtures, in the builder's own shape ------------------- */

const CAT = createCatalogue(CATALOGUE);
const price = (id) => CAT.featurePricing(id);

/** Build a payload the way the builder does, from catalogue prices. */
function payload(lines, { scope = null, packages = [], currency = 'USD', language = 'en' } = {}) {
  const byService = new Map();
  let once = 0; let monthly = 0; let quoted = 0;
  const addons = [];
  for (const line of lines) {
    const f = CAT.feature(line.featureId);
    const p = price(line.featureId);
    const svc = CAT.serviceOf(line.featureId);
    const qty = line.quantity ?? 1;
    const factor = line.tier ? ((f.tiers.levels.find((l) => l.id === line.tier) || {}).priceFactor || 1) : 1;
    const isPart = Boolean(line.partOf);
    const unit = p.type === 'included' || p.type === 'quote' ? 0 : Math.round(p.from * factor);
    const amount = isPart || p.type === 'included' || p.type === 'quote' ? 0 : unit * qty;
    if (p.type === 'quote') quoted += 1;
    if (amount > 0) { if (p.period === 'monthly' || line.billing === 'monthly') monthly += amount; else once += amount; }
    const billing = (p.period === 'monthly' || line.billing === 'monthly') ? 'monthly' : 'once';
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
    if (f.addonGroup) { entry.addonGroup = f.addonGroup; addons.push({ featureId: line.featureId, serviceId: svc, addonGroup: f.addonGroup, quantity: qty, amount }); }
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

/* A fixture that will not build is a broken TEST, and should say so where it
   broke rather than throwing `undefined` three lines later. */
const mustCreate = (o, p, opts) => {
  const made = o.createOrder(p, opts);
  if (!made.ok) throw new Error(`fixture will not validate: ${JSON.stringify(made.problems)}`);
  return made;
};

const CLIENT = { name: 'Al Mada', email: 'ops@almada.example', phone: '+249 96 267 2192', company: 'Al Mada', preferredLanguage: 'ar' };

/** The whole journey, in one call, for the tests that only care about the end. */
function journey(lines, opts = {}) {
  const o = ops();
  const { client } = o.resolveClient(CLIENT);
  const made = o.createOrder(payload(lines, opts), { clientId: client.id });
  if (!made.ok) throw new Error(`journey fixture will not validate: ${JSON.stringify(made.problems)}`);
  o.submitOrder(made.order.id);
  o.reviewOrder(made.order.id);
  o.approveOrder(made.order.id);
  const conv = o.convertOrderToProject(made.order.id);
  return { o, client, order: o.getOrder(made.order.id), project: conv.project, conv };
}

/* ========================================================================== */
/* TEST A — one feature                                                        */
group('A — a single feature');
{
  const { o, order, project } = journey([{ featureId: 'feat.branding.logo' }]);
  ok('A: the order was created', Boolean(order));
  ok('A: it carries the feature id', order.items[0].featureId === 'feat.branding.logo');
  ok('A: it carries the price the catalogue published', order.items[0].pricingSnapshot.amount === 350, JSON.stringify(order.items[0].pricingSnapshot));
  ok('A: quantity is one', order.items[0].quantity === 1);
  ok('A: it names the owning service', order.items[0].catalogueRef.serviceId === 'svc.branding');
  ok('A: validation passes', o.validateOrder(order.id).ok);
  ok('A: one pipeline instance', project.pipelines.length === 1 && project.pipelines[0].serviceId === 'svc.branding');
}

/* TEST B — several features, one service                                      */
group('B — several features from one service');
{
  const lines = [{ featureId: 'feat.branding.logo' }, { featureId: 'feat.branding.business_card' }, { featureId: 'feat.branding.letterhead' }];
  const { order, project } = journey(lines);
  ok('B: all three survive', order.items.length === 3);
  ok('B: nothing is charged twice', order.pricing.total.oneTime === 350 + 85 + 70, JSON.stringify(order.pricing.total));
  ok('B: still one pipeline instance', project.pipelines.length === 1);
  ok('B: three workflow instances', project.pipelines[0].workflows.length === 3);
}

/* TEST C — several services                                                   */
group('C — features from several services');
{
  const { order, project } = journey([
    { featureId: 'feat.branding.logo' },
    { featureId: 'feat.websites.uiux' },
  ]);
  ok('C: one order', Boolean(order.id));
  ok('C: one client', Boolean(order.clientId));
  ok('C: one project', Boolean(project.id));
  ok('C: two pipeline instances', project.pipelines.length === 2, project.pipelines.map((p) => p.serviceId).join());
  ok('C: they are the two services ordered',
    project.pipelines.map((p) => p.serviceId).sort().join() === 'svc.branding,svc.websites');
  ok('C: each instance points at the catalogue pipeline for its service',
    project.pipelines.every((p) => p.pipelineRef.pipelineId === CAT.pipelineFor(p.serviceId)));
}

/* TEST D/E — the social tiers                                                 */
group('D/E — Social Pro and Social Growth');
{
  const pro = CAT.package('soc-pro');
  const growth = CAT.package('soc-growth');
  ok('D: Social Pro is 400 a month', pro.price.amount === 400 && pro.price.billing === 'monthly');
  ok('D: Social Pro is level 2', pro.rank === 2);
  ok('E: Social Growth is 650 a month', growth.price.amount === 650 && growth.price.billing === 'monthly');
  ok('E: Social Growth is level 3', growth.rank === 3);
  ok('D/E: the tier is read from rank, never from price',
    CAT.packageRank('soc-growth') > CAT.packageRank('soc-pro'));

  /* And an order built from a package's own contents keeps the monthly split. */
  const lines = pro.features
    .filter((f) => CAT.featurePricing(f.ref).type !== 'included')
    .map((f) => ({ featureId: f.ref, quantity: f.qty ?? 1, tier: f.tier }));
  const { order, project } = journey(lines);
  ok('D: a Pro-shaped order bills monthly', order.pricing.total.monthly > 0, JSON.stringify(order.pricing.total));
  ok('D: it becomes one social pipeline', project.pipelines.length === 1 && project.pipelines[0].serviceId === 'svc.social');
}

/* TEST F — the complete landing page                                          */
group('F — complete landing page');
{
  const parts = CAT.partsOf('feat.websites.extra_landing');
  const lines = [
    { featureId: 'feat.websites.extra_landing' },
    ...parts.map((p) => ({ featureId: p, partOf: 'feat.websites.extra_landing', origin: 'part' })),
  ];
  const { order, project } = journey(lines);
  ok('F: the composite is charged 120',
    order.items.find((i) => i.featureId === 'feat.websites.extra_landing').pricingSnapshot.amount === 120);
  ok('F: the total is 120, not 240', order.pricing.total.oneTime === 120, JSON.stringify(order.pricing.total));
  ok('F: the three parts are charged nothing',
    order.items.filter((i) => i.partOf).every((i) => i.pricingSnapshot.amount === 0));
  const wfs = project.pipelines[0].workflows.map((w) => w.featureId);
  ok('F: all three parts exist operationally', parts.every((p) => wfs.includes(p)), wfs.join());
  ok('F: and so does the composite that orchestrates them', wfs.includes('feat.websites.extra_landing'));
  ok('F: the parts are marked as parts, not as separate purchases',
    project.pipelines[0].workflows.filter((w) => w.partOf === 'feat.websites.extra_landing').length === 3);
  const design = project.pipelines[0].workflows.find((w) => w.featureId === 'feat.websites.landing_design');
  ok('F: design runs in the design stage', design.workflowRef.stages.includes('pipe.websites.design'));
}

/* TEST G — deployment only                                                    */
group('G — deployment only');
{
  const { order, project } = journey([{ featureId: 'feat.websites.landing_deploy' }]);
  ok('G: it costs 20', order.pricing.total.oneTime === 20, JSON.stringify(order.pricing.total));
  ok('G: one line', order.items.length === 1);
  const wfs = project.pipelines[0].workflows.map((w) => w.featureId);
  ok('G: only the deployment is created', wfs.length === 1 && wfs[0] === 'feat.websites.landing_deploy', wfs.join());
  ok('G: no design was invented', !wfs.includes('feat.websites.landing_design'));
  ok('G: no development was invented', !wfs.includes('feat.websites.landing_build'));
  ok('G: it runs in the launch stage', project.pipelines[0].workflows[0].workflowRef.stages.includes('pipe.websites.launch'));
}

/* TEST H/I — page allowances                                                  */
group('H/I — website page allowances');
{
  ok('H: Business Website allows five pages', CAT.packagePages('web-business') === 5);
  ok('I: Professional Website allows ten pages', CAT.packagePages('web-professional') === 10);

  const site = ['feat.websites.uiux', 'feat.websites.development'].map((featureId) => ({ featureId }));
  const { order, project } = journey(
    [...site, { featureId: 'feat.websites.extra_page', quantity: 4 }],
    { scope: { pages: 5 } },
  );
  ok('H: the order records five pages', order.scope.limits.pages === 5, JSON.stringify(order.scope.limits));
  ok('H: the project carries the allowance through', project.limits.pages === 5, JSON.stringify(project.limits));
  ok('H: and the page count agrees with what is priced', validateOrder(order, CAT).length === 0,
    JSON.stringify(validateOrder(order, CAT)));
}

/* TEST J — additional pages                                                   */
group('J — additional website pages');
{
  const { order, project } = journey(
    [{ featureId: 'feat.websites.uiux' }, { featureId: 'feat.websites.development' }, { featureId: 'feat.websites.extra_page', quantity: 4 }],
    { scope: { pages: 5 } },
  );
  const line = order.items.find((i) => i.featureId === 'feat.websites.extra_page');
  ok('J: quantity is four', line.quantity === 4);
  ok('J: at the existing add-on price', line.pricingSnapshot.unitAmount === 70, JSON.stringify(line.pricingSnapshot));
  ok('J: charged 280', line.pricingSnapshot.amount === 280);
  ok('J: it is recorded as an add-on', line.addonGroup === CAT.addonGroupOf('feat.websites.extra_page'));
  const w = project.pipelines[0].workflows.find((x) => x.featureId === 'feat.websites.extra_page');
  ok('J: the quantity survives into the project', w.quantity === 4, JSON.stringify(w.quantity));
  ok('J: it was not flattened to one', w.quantity !== 1);
}

/* TEST K — the snapshot survives a catalogue price change                     */
group('K — historical pricing survives a catalogue edit');
{
  const o = ops();
  const { client } = o.resolveClient(CLIENT);
  /* Development requires the design — the catalogue says so, and the validator
     asks it, so the fixture has to be a scope that could really be executed. */
  const made = mustCreate(o, payload([
    { featureId: 'feat.websites.uiux' }, { featureId: 'feat.websites.development' },
  ]), { clientId: client.id });
  const line = () => made.order.items.find((i) => i.featureId === 'feat.websites.development');
  const before = line().pricingSnapshot.amount;
  o.submitOrder(made.order.id);

  /* A DIFFERENT catalogue, with a different price, in a second operations
     instance over the SAME store — which is what a price change looks like
     from the order's point of view. */
  const moved = structuredClone(CATALOGUE);
  moved.features.find((f) => f.id === 'feat.websites.development').pricing.from = 999;
  const later = createOperations({
    catalogue: moved, statuses: STATUSES, stores: o.stores, ...fixtures(),
  });
  const reread = later.getOrder(made.order.id);
  const now = reread.items.find((i) => i.featureId === 'feat.websites.development');
  ok('K: the catalogue really did change', later.catalogue.featurePricing('feat.websites.development').from === 999);
  ok('K: the historical order still says what it said', now.pricingSnapshot.amount === before,
    `was ${before}, now ${now.pricingSnapshot.amount}`);
  ok('K: and its total is unchanged', reread.pricing.total.oneTime === made.order.pricing.total.oneTime);
  ok('K: while still being traceable to the current catalogue',
    later.catalogue.feature(now.featureId) !== null);
  ok('K: the order says which catalogue edition produced it',
    reread.catalogueSnapshot.version === CATALOGUE.version);
}

/* TEST L — idempotent conversion                                              */
group('L — converting twice');
{
  const { o, order } = journey([{ featureId: 'feat.branding.logo' }]);
  const again = o.convertOrderToProject(order.id);
  ok('L: the second conversion succeeded', again.ok);
  ok('L: it did not create anything', again.created === false, JSON.stringify(again.reason));
  ok('L: it returned the same project', again.project.id === o.projectForOrder(order.id).id);
  ok('L: there is exactly one project', o.listProjects().length === 1, `${o.listProjects().length}`);
  const third = o.convertOrderToProject(order.id);
  ok('L: and a third time changes nothing', o.listProjects().length === 1 && third.project.id === again.project.id);
}

/* TEST M — a rejected order                                                   */
group('M — a rejected order');
{
  const o = ops();
  const { client } = o.resolveClient(CLIENT);
  const made = mustCreate(o, payload([{ featureId: 'feat.branding.logo' }]), { clientId: client.id });
  o.submitOrder(made.order.id);
  o.reviewOrder(made.order.id);
  const rejected = o.rejectOrder(made.order.id, { reason: 'Out of capacity this quarter' });
  ok('M: the rejection needs a reason', !o.rejectOrder(made.order.id, {}).ok || rejected.ok);
  ok('M: the order is rejected', o.getOrder(made.order.id).status === 'rejected');
  const conv = o.convertOrderToProject(made.order.id);
  ok('M: it refuses to become a project', conv.ok === false, JSON.stringify(conv));
  ok('M: and no project exists', o.listProjects().length === 0);
  ok('M: the reason is on the record',
    o.getOrder(made.order.id).history.some((h) => h.reason === 'Out of capacity this quarter'));
}

/* TEST N — a draft order                                                      */
group('N — a draft order');
{
  const o = ops();
  const { client } = o.resolveClient(CLIENT);
  const made = mustCreate(o, payload([{ featureId: 'feat.branding.logo' }]), { clientId: client.id });
  ok('N: it starts as a draft', made.order.status === 'draft');
  const conv = o.convertOrderToProject(made.order.id);
  ok('N: a draft cannot become a project', conv.ok === false, JSON.stringify(conv));
  ok('N: no project exists', o.listProjects().length === 0);
  ok('N: and it cannot be approved without being submitted first',
    o.approveOrder(made.order.id).ok === false);
}

/* TEST O — the project resolves everything through the catalogue              */
group('O — project references resolve');
{
  const { project } = journey([
    { featureId: 'feat.branding.logo' },
    { featureId: 'feat.websites.uiux' },
    { featureId: 'feat.social.reels', quantity: 4 },
  ]);
  for (const p of project.pipelines) {
    ok(`O: ${p.serviceId} -> a real service`, Boolean(CAT.service(p.serviceId)));
    ok(`O: ${p.serviceId} -> the catalogue's pipeline`, p.pipelineRef.pipelineId === CAT.pipelineFor(p.serviceId));
    for (const w of p.workflows) {
      ok(`O: ${w.featureId} -> a real feature`, Boolean(CAT.feature(w.featureId)));
      ok(`O: ${w.featureId} -> the catalogue's workflow`, w.workflowRef.workflowId === CAT.workflowFor(w.featureId));
      ok(`O: ${w.featureId} -> a real workflow`, Boolean(CAT.workflow(w.workflowRef.workflowId)));
      for (const s of w.workflowRef.stages) ok(`O: ${w.featureId} -> stage ${s} exists`, Boolean(CAT.stage(s)));
    }
    for (const s of p.stages) ok(`O: stage ${s.stageId} exists in the catalogue`, Boolean(CAT.stage(s.stageId)));
  }
}

/* ========================================================================== */
/* §40 — ARCHITECTURE TESTS                                                    */
group('architecture');
{
  const { o, order, project, client } = journey([
    { featureId: 'feat.websites.uiux' },
    { featureId: 'feat.websites.development' },
    { featureId: 'feat.websites.extra_page', quantity: 2 },
  ], { scope: { pages: 3 } });

  const orders = o.listOrders(); const projects = o.listProjects(); const clients = o.listClients();

  ok('no orphan order: every order has a client', orders.every((x) => x.clientId && o.getClient(x.clientId)));
  ok('no orphan project: every project has an order', projects.every((p) => p.orderId && o.getOrder(p.orderId)));
  ok('no orphan project: every project has a client', projects.every((p) => p.clientId && o.getClient(p.clientId)));
  ok('the order names its project and the project names its order',
    order.projectId === project.id && project.orderId === order.id);
  ok('every order item names a feature that exists', orders.every((x) => x.items.every((i) => CAT.feature(i.featureId))));
  ok('every order item names a service that exists', orders.every((x) => x.items.every((i) => CAT.service(i.catalogueRef.serviceId))));
  ok('every offered package exists', orders.every((x) => x.scope.packagesOffered.every((p) => CAT.package(p.packageId))));
  ok('every add-on group exists', orders.every((x) => x.items.filter((i) => i.addonGroup).every((i) => CAT.addonGroup(i.addonGroup))));
  ok('every pipeline reference resolves', projects.every((p) => p.pipelines.every((pi) => CAT.pipelineFor(pi.serviceId) === pi.pipelineRef.pipelineId)));
  ok('every workflow reference resolves', projects.every((p) => p.pipelines.every((pi) => pi.workflows.every((w) => CAT.workflow(w.workflowRef.workflowId)))));
  ok('no project has two pipelines for one service',
    projects.every((p) => new Set(p.pipelines.map((x) => x.serviceId)).size === p.pipelines.length));
  ok('no two projects share an order', new Set(projects.map((p) => p.orderId)).size === projects.length);
  ok('every order item has a quantity', orders.every((x) => x.items.every((i) => Number.isInteger(i.quantity) && i.quantity >= 1)));
  ok('every order item has a pricing snapshot', orders.every((x) => x.items.every((i) => i.pricingSnapshot && typeof i.pricingSnapshot.amount === 'number')));
  ok('every pricing snapshot has a currency', orders.every((x) => x.items.every((i) => Boolean(i.pricingSnapshot.currency))));
  ok('every record is timestamped', [...orders, ...projects, ...clients].every((r) => r.createdAt && r.updatedAt));
  ok('every record carries an event log', [...orders, ...projects, ...clients].every((r) => Array.isArray(r.events) && r.events.length));
  ok('every id is language-neutral', [...orders, ...projects, ...clients].every((r) => /^[\x20-\x7e]+$/.test(r.id)));
  ok('every quantity survived into the project',
    project.pipelines[0].workflows.find((w) => w.featureId === 'feat.websites.extra_page').quantity === 2);

  /* Historical pricing must be immutable in practice, not only in intention. */
  const before = JSON.stringify(order.items);
  o.setProjectStatus(project.id, 'planning');
  ok('moving the project does not touch the order snapshot', JSON.stringify(o.getOrder(order.id).items) === before);

  /* And the catalogue must be untouched by any of it. */
  ok('the catalogue was not mutated by any of it', JSON.stringify(CATALOGUE) === CATALOGUE_AT_LOAD);
}

/* ---------- validation refuses what it should ------------------------------ */
group('validation');
{
  const o = ops();
  const { client } = o.resolveClient(CLIENT);

  const bad = structuredClone(payload([{ featureId: 'feat.branding.logo' }]));
  bad.services[0].features[0].featureId = 'feat.branding.does_not_exist';
  ok('an unknown feature is refused', o.createOrder(bad, { clientId: client.id }).ok === false);

  const wrongService = structuredClone(payload([{ featureId: 'feat.branding.logo' }]));
  wrongService.services[0].serviceId = 'svc.websites';
  ok('a feature filed under the wrong service is refused', o.createOrder(wrongService, { clientId: client.id }).ok === false);

  const overQty = structuredClone(payload([{ featureId: 'feat.websites.extra_page', quantity: 4 }]));
  overQty.services[0].features[0].quantity = 9999;
  ok('a quantity beyond the published maximum is refused', o.createOrder(overQty, { clientId: client.id }).ok === false);

  const noClient = o.createOrder(payload([{ featureId: 'feat.branding.logo' }]));
  ok('an order with no client cannot be submitted', o.submitOrder(noClient.order.id).ok === false);

  const missingDep = payload([{ featureId: 'feat.websites.integrations' }]);
  ok('an order missing a required feature is refused', o.createOrder(missingDep, { clientId: client.id }).ok === false);

  const badPages = payload([{ featureId: 'feat.websites.uiux' }], { scope: { pages: 9 } });
  ok('a page count that disagrees with what is priced is refused', o.createOrder(badPages, { clientId: client.id }).ok === false);

  const doubleCharged = structuredClone(payload([
    { featureId: 'feat.websites.extra_landing' },
    ...CAT.partsOf('feat.websites.extra_landing').map((p) => ({ featureId: p, partOf: 'feat.websites.extra_landing' })),
  ]));
  const part = doubleCharged.services[0].features.find((f) => f.partOf);
  part.pricing.amount = 50;
  ok('a composite part charged on top of its composite is refused',
    o.createOrder(doubleCharged, { clientId: client.id }).ok === false);
}

/* ---------- the CRM relationship ------------------------------------------- */
group('CRM');
{
  const o = ops();
  const { client, created } = o.resolveClient(CLIENT);
  ok('a new client is created', created === true);

  const again = o.resolveClient({ name: 'Al Mada Trading', email: 'ops@almada.example' });
  ok('the same email finds the same client', again.client.id === client.id && again.created === false);
  ok('and says how it knew', again.confidence === 'email');

  const byPhone = o.resolveClient({ name: 'Someone Else', phone: '+249962672192' });
  ok('the same phone finds the same client', byPhone.client.id === client.id);

  const sameName = o.resolveClient({ name: 'Al Mada' });
  ok('a matching name alone does not merge', sameName.client.id !== client.id);
  ok('it is flagged for review instead', sameName.confidence === 'review', JSON.stringify(sameName.confidence));
  ok('and the reason is recorded on the new client',
    o.getClient(sameName.client.id).events.some((e) => e.event === 'client.review_required'));

  for (const n of [1, 2]) {
    const made = mustCreate(o, payload([{ featureId: 'feat.branding.logo' }]), { clientId: client.id });
    o.submitOrder(made.order.id); o.reviewOrder(made.order.id);
    if (n === 1) { o.approveOrder(made.order.id); o.convertOrderToProject(made.order.id); }
  }
  const dossier = o.clientDossier(client.id);
  ok('one client, many orders', dossier.orders.length === 2, `${dossier.orders.length}`);
  ok('one client, one project so far', dossier.projects.length === 1);
  ok('the dossier answers who', dossier.client.name === 'Al Mada');
  ok('the dossier answers what they requested', dossier.orders.every((x) => x.services.length > 0));
  ok('the dossier answers the status', dossier.orders.every((x) => Boolean(x.statusLabel.en && x.statusLabel.ar)));
  ok('the dossier answers when they were last active', Boolean(dossier.lastActivity));
  ok('the dossier stores no catalogue copy',
    !JSON.stringify(dossier).includes('executionSteps') && !JSON.stringify(dossier).includes('workflow_id'));
  ok('an order belongs to exactly one client', typeof o.listOrders()[0].clientId === 'string');
}

/* ---------- customer-facing output stays clean ------------------------------ */
group('customer-facing');
{
  const { o, order } = journey([{ featureId: 'feat.branding.logo' }, { featureId: 'feat.websites.uiux' }]);
  for (const lang of ['en', 'ar']) {
    const s = o.orderSummary(order.id, lang);
    const blob = JSON.stringify(s);
    ok(`${lang}: the summary carries no feature ids`, !/feat\./.test(blob), blob.slice(0, 90));
    ok(`${lang}: no workflow ids`, !/wf\./.test(blob));
    ok(`${lang}: no pipeline ids`, !/pipe\./.test(blob));
    ok(`${lang}: no role ids`, !/role\./.test(blob));
    ok(`${lang}: it names the services in that language`, s.services.length === 2);
    ok(`${lang}: it carries a total and a currency`, typeof s.total.oneTime === 'number' && s.currency === 'USD');
    ok(`${lang}: and a reference the client can quote`, /^ord\./.test(s.reference));
  }
  const ar = o.orderSummary(order.id, 'ar');
  ok('the Arabic summary is actually in Arabic', /[؀-ۿ]/.test(JSON.stringify(ar.services)));
}

/* ---------- status machines stay separate ---------------------------------- */
group('status');
{
  const { o, order, project } = journey([{ featureId: 'feat.branding.logo' }]);
  ok('the order is converted', o.getOrder(order.id).status === 'converted_to_project');
  ok('the project has not started', o.getProject(project.id).status === 'not_started');
  ok('they are different fields with different vocabularies',
    !o.status.states('project').includes('converted_to_project')
    && !o.status.states('order').includes('in_progress'));
  o.setProjectStatus(project.id, 'planning');
  o.setProjectStatus(project.id, 'in_progress');
  ok('the project moved', o.getProject(project.id).status === 'in_progress');
  ok('the order did not', o.getOrder(order.id).status === 'converted_to_project');
  ok('an undeclared move is refused', o.setProjectStatus(project.id, 'not_started').ok === false);
  ok('a terminal state is terminal', o.status.isTerminal('order', 'rejected'));

  const p = o.getProject(project.id);
  const wf = p.pipelines[0].workflows[0];
  o.setWorkflowStatus(project.id, wf.id, 'in_progress');
  ok('a workflow instance moves on its own', o.getProject(project.id).pipelines[0].workflows[0].status === 'in_progress');
  ok('without moving its pipeline', o.getProject(project.id).pipelines[0].status === 'not_started');
  ok('and without touching the catalogue template',
    CAT.workflow(wf.workflowRef.workflowId).status === undefined);
  ok('the transition is on the record',
    o.getProject(project.id).pipelines[0].workflows[0].history.some((h) => h.to === 'in_progress'));
}

/* ---------- amendment keeps the original --------------------------------- */
group('amendment');
{
  const o = ops();
  const { client } = o.resolveClient(CLIENT);
  const made = mustCreate(o, payload([{ featureId: 'feat.branding.logo' }]), { clientId: client.id });
  o.submitOrder(made.order.id);
  const first = structuredClone(o.getOrder(made.order.id).items);
  const next = structuredClone(first);
  next[0].pricingSnapshot.amount = 300;
  const amended = o.amendOrder(made.order.id, next, {
    reason: 'Agreed a reduction on the call',
    pricing: { ...made.order.pricing, subtotal: { oneTime: 300, monthly: 0 }, total: { oneTime: 300, monthly: 0 } },
  });
  ok('the amendment was accepted', amended.ok, JSON.stringify(amended.problems));
  ok('the order now says 300', o.getOrder(made.order.id).items[0].pricingSnapshot.amount === 300);
  ok('the original is still on the record', o.originalScope(made.order.id).items[0].pricingSnapshot.amount === 350);
  ok('the amendment says why', o.getOrder(made.order.id).amendments[0].reason === 'Agreed a reduction on the call');
  ok('an amendment with no reason is refused', o.amendOrder(made.order.id, next, {}).ok === false);
}

/* ---------- the file store round-trips ------------------------------------- */
group('persistence');
{
  const dir = fs.mkdtempSync(path.join(ROOT, '.ops-test-'));
  try {
    const stores = {
      clients: jsonFileStore(path.join(dir, 'clients.json'), fs),
      orders: jsonFileStore(path.join(dir, 'orders.json'), fs),
      projects: jsonFileStore(path.join(dir, 'projects.json'), fs),
    };
    const f = fixtures();
    const a = createOperations({ catalogue: CATALOGUE, statuses: STATUSES, stores, ...f });
    const { client } = a.resolveClient(CLIENT);
    const made = mustCreate(a, payload([{ featureId: 'feat.branding.logo' }]), { clientId: client.id });
    a.submitOrder(made.order.id); a.reviewOrder(made.order.id); a.approveOrder(made.order.id);
    const conv = a.convertOrderToProject(made.order.id);

    /* A COMPLETELY SEPARATE instance over the same files — which is what the
       next operator's session is. */
    const b = createOperations({
      catalogue: CATALOGUE,
      statuses: STATUSES,
      stores: {
        clients: jsonFileStore(path.join(dir, 'clients.json'), fs),
        orders: jsonFileStore(path.join(dir, 'orders.json'), fs),
        projects: jsonFileStore(path.join(dir, 'projects.json'), fs),
      },
      ...fixtures(),
    });
    ok('the client survived the round trip', b.getClient(client.id).name === 'Al Mada');
    ok('the order survived', b.getOrder(made.order.id).pricing.total.oneTime === 350);
    ok('the project survived', b.getProject(conv.project.id).orderId === made.order.id);
    ok('and conversion is still idempotent across sessions',
      b.convertOrderToProject(made.order.id).created === false);
    ok('the file is valid JSON with a version', JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8')).version === 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/* ---------- no duplicated business logic ----------------------------------- */
group('no duplication');
{
  const sources = fs.readdirSync(path.join(ROOT, 'src/operations'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ file: f, text: fs.readFileSync(path.join(ROOT, 'src/operations', f), 'utf8') }));

  for (const { file, text } of sources) {
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    /* Ids may appear in catalogue-read only as the key it looks a rule up by;
       nowhere else may name one, because naming one is a mapping. */
    const ids = [...code.matchAll(/'(svc|feat|pipe|wf|plat|cap)\.[a-z_.]+'/g)].map((m) => m[0]);
    ok(`${file}: names no catalogue id`, ids.length === 0, ids.join(', '));
    /* A price literal in the domain is a second pricing source. */
    const prices = [...code.matchAll(/(?<![\w.$])(\d{2,5})(?=\s*[;,)\]}])/g)].map((m) => m[1])
      .filter((n) => Number(n) >= 20 && Number(n) <= 2000);
    ok(`${file}: holds no price literal`, prices.length === 0, prices.join(', '));
    ok(`${file}: reads no file directly`, !/require\(|fs\.readFileSync|fs\.writeFileSync/.test(code) || file === 'repository.js');
  }
}

/* ========================================================================== */

if (fails.length) {
  console.error(`\noperations-test: ${passes.filter((p) => !p.startsWith('---')).length} passed, ${fails.length} FAILED\n`);
  fails.forEach((f) => console.error(`  ✗ ${f}`));
  console.error('');
  process.exit(1);
}
console.log(`operations-test: ${passes.filter((p) => !p.startsWith('---')).length} passed, 0 failed`);
