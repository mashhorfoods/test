/**
 * ORDER — what the client selected, frozen at the moment they selected it.
 *
 * THE ONE IDEA THIS FILE IS BUILT AROUND.
 * A catalogue answers "what does a Business Website cost?" — present tense. An
 * order has to answer "what did this client agree to pay in September?" —
 * past tense, forever, including after the catalogue says 800. Those are
 * different questions and only one of them can be answered by a reference.
 *
 * So every order item carries TWO things:
 *
 *   catalogueRef      the ids, so the item can be traced forward to whatever
 *                     the catalogue says today
 *   pricingSnapshot   the numbers, copied, so the item never has to ask
 *
 * The snapshot is not a cache. Nothing refreshes it. An order that has been
 * submitted is a commercial fact, and a commercial fact that changes when a
 * price list is edited was never a fact.
 *
 * WHERE ORDERS COME FROM. From the builder payload and nowhere else. The
 * WhatsApp message the builder writes beside it is prose for a person; this
 * module will not read it, and there is no code path that could. See
 * `docs/128` §6 and `docs/129` §3.
 */

import { newId } from './ids.js';
import { EVENTS, record } from './events.js';

const clone = (v) => (v === undefined ? undefined : structuredClone(v));

/**
 * Turn a builder payload into a draft order.
 *
 * The payload's own shape is preserved rather than reinterpreted: `origin`,
 * `partOf`, `tier`, `options`, `quantity` and `addonGroup` all mean here
 * exactly what they mean in the builder, because a translation layer between
 * two things that agree is a place for them to stop agreeing.
 */
export function orderFromPayload(payload, {
  clientId = null,
  catalogue,
  now = () => new Date(),
  random = Math.random,
  by = 'builder',
  source = 'pixora.package-builder',
} = {}) {
  if (!payload || !Array.isArray(payload.services)) {
    throw new Error('order: that is not a builder payload — it has no services array');
  }
  if (!catalogue) throw new Error('order: a catalogue read model is required');

  const at = now().toISOString();
  const currency = payload.currency || catalogue.currency;

  const items = [];
  for (const svc of payload.services) {
    for (const f of svc.features) {
      const item = {
        /* Stable within the order, so a later amendment can name a line. */
        lineId: `${svc.serviceId}::${f.featureId}`,
        featureId: f.featureId,
        quantity: f.quantity,
        origin: f.origin,

        /* THE TRACE FORWARD. Ids only — never a copy of what they point at. */
        catalogueRef: {
          serviceId: svc.serviceId,
          workflowId: catalogue.workflowFor(f.featureId),
          pipelineId: (catalogue.stagesFor(f.featureId) || {}).pipeline || null,
        },

        /* THE FREEZE. Numbers, copied, never refreshed. */
        pricingSnapshot: {
          type: f.pricing.type,
          billing: f.pricing.billing,
          unitAmount: f.pricing.unitAmount,
          amount: f.pricing.amount,
          currency,
        },
      };
      if (f.tier) item.tier = f.tier;
      if (f.options) item.options = clone(f.options);
      if (f.addonGroup) item.addonGroup = f.addonGroup;
      if (f.partOf) item.partOf = f.partOf;
      if (f.composedOf) item.composedOf = clone(f.composedOf);
      items.push(item);
    }
  }
  items.sort((a, b) => (a.lineId < b.lineId ? -1 : 1));

  const order = {
    id: newId('order', { now, random }),
    version: '1.0',
    source,
    clientId,
    status: 'draft',

    /* WHICH CATALOGUE THIS CAME FROM. Not used to re-price anything — used so a
       reader in two years knows which edition of the price list produced these
       numbers, and so an amendment can say what changed underneath it. */
    catalogueSnapshot: {
      version: catalogue.version,
      takenAt: at,
    },

    scope: {
      services: [...new Set(items.map((i) => i.catalogueRef.serviceId))].sort(),
      /* Packages the builder OFFERED as cheaper cover. Recorded because it is a
         fact about the order — what the client was shown — not because one was
         bought. A package that was actually bought is an item like any other. */
      packagesOffered: (payload.packages || []).map((p) => ({
        packageId: p.packageId,
        serviceId: p.serviceId,
        priceSnapshot: clone(p.price),
        coversEverythingChosen: Boolean(p.coversEverythingChosen),
      })),
      addons: (payload.addons || []).map((a) => ({
        featureId: a.featureId,
        serviceId: a.serviceId,
        addonGroup: a.addonGroup,
        quantity: a.quantity,
        amount: a.amount,
      })),
      /* Allowances and counts the builder worked out from catalogue rules. Kept
         so the project does not have to recompute them from a catalogue that
         may since have moved. */
      limits: clone(payload.scope) || {},
    },

    items,

    pricing: {
      currency,
      subtotal: clone(payload.pricing.subtotal),
      discount: clone(payload.pricing.discount),
      total: clone(payload.pricing.total),
      quotedItems: payload.pricing.quotedItems,
      lineItems: payload.pricing.lineItems,
    },

    /* The prose, kept as an artefact of what the client actually sent. It is
       evidence, not data: nothing reads it back. */
    clientMessage: payload.message || null,
    language: payload.language || 'en',

    projectId: null,
    amendments: [],
    createdAt: at,
    updatedAt: at,
    history: [],
    events: [],
  };

  record(order, EVENTS.ORDER_CREATED, { at, by });
  return order;
}

/**
 * Check an order against the catalogue.
 *
 * NOTE WHAT IS NOT HERE. There is no rule about which features may go together,
 * what a package must contain, or what a page allowance should be. All of that
 * is enforced by tools/build-catalogue.js at build time and answered by the
 * catalogue at run time. This function asks; it does not know.
 */
export function validateOrder(order, catalogue, { clients = null } = {}) {
  const problems = [];
  const bad = (path, message) => problems.push({ path, message });

  if (!order || typeof order !== 'object') { bad('order', 'not an order'); return problems; }
  if (!order.id) bad('id', 'an order with no id cannot be stored or traced');
  if (!order.pricing || !order.pricing.currency) bad('pricing.currency', 'an order must say what currency its numbers are in');
  if (!order.items || !order.items.length) bad('items', 'an order with nothing in it is not an order');
  if (!order.catalogueSnapshot || order.catalogueSnapshot.version === undefined) {
    bad('catalogueSnapshot', 'an order must say which catalogue edition produced its numbers');
  }

  if (order.clientId && clients && !clients.get(order.clientId)) {
    bad('clientId', `references client ${order.clientId}, which does not exist`);
  }

  const chosen = new Set((order.items || []).map((i) => i.featureId));

  for (const [n, item] of (order.items || []).entries()) {
    const at = `items[${n}]`;
    const f = catalogue.feature(item.featureId);
    if (!f) { bad(`${at}.featureId`, `${item.featureId} is not a feature in this catalogue`); continue; }

    const owner = catalogue.serviceOf(item.featureId);
    if (item.catalogueRef.serviceId !== owner) {
      bad(`${at}.catalogueRef.serviceId`, `${item.featureId} belongs to ${owner}, and the line says ${item.catalogueRef.serviceId}`);
    }
    if (!catalogue.service(item.catalogueRef.serviceId)) {
      bad(`${at}.catalogueRef.serviceId`, `${item.catalogueRef.serviceId} is not a service`);
    }
    if (item.catalogueRef.workflowId && !catalogue.workflow(item.catalogueRef.workflowId)) {
      bad(`${at}.catalogueRef.workflowId`, `${item.catalogueRef.workflowId} is not a workflow in this catalogue`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      bad(`${at}.quantity`, `quantity is ${JSON.stringify(item.quantity)} — it must be a whole number of at least one`);
    } else {
      const p = f.pricing;
      if (p.type === 'unit') {
        if (p.minQty !== undefined && item.quantity < p.minQty) bad(`${at}.quantity`, `${item.quantity} is below the published minimum of ${p.minQty}`);
        if (p.maxQty !== undefined && item.quantity > p.maxQty) bad(`${at}.quantity`, `${item.quantity} is above the published maximum of ${p.maxQty}`);
      } else if (item.quantity !== 1) {
        bad(`${at}.quantity`, `${item.featureId} is not priced per unit, so a quantity of ${item.quantity} means nothing`);
      }
    }

    const snap = item.pricingSnapshot || {};
    if (!snap.currency) bad(`${at}.pricingSnapshot.currency`, 'a priced line with no currency cannot be read later');
    if (snap.currency && snap.currency !== order.pricing.currency) {
      bad(`${at}.pricingSnapshot.currency`, `is ${snap.currency} and the order totals are in ${order.pricing.currency}`);
    }
    if (typeof snap.amount !== 'number' || snap.amount < 0) bad(`${at}.pricingSnapshot.amount`, `is ${JSON.stringify(snap.amount)}`);
    if (!['once', 'monthly'].includes(snap.billing)) bad(`${at}.pricingSnapshot.billing`, `is ${JSON.stringify(snap.billing)} — it must be once or monthly`);

    if (item.tier) {
      const levels = ((f.tiers || {}).levels || []).map((l) => l.id);
      if (!levels.includes(item.tier)) bad(`${at}.tier`, `${item.featureId} has no level "${item.tier}" (it has ${levels.join(', ') || 'none'})`);
    }
    if (item.options && item.options.length) {
      if (!f.options) bad(`${at}.options`, `${item.featureId} takes no options`);
    }
    if (item.addonGroup && !catalogue.addonGroup(item.addonGroup)) {
      bad(`${at}.addonGroup`, `${item.addonGroup} is not an add-on group`);
    }

    /* A LINE THAT IS PART OF A COMPOSITE MUST NOT BE CHARGED TWICE. */
    if (item.partOf) {
      if (!chosen.has(item.partOf)) bad(`${at}.partOf`, `says it is part of ${item.partOf}, which the order does not contain`);
      if (snap.amount !== 0) bad(`${at}.pricingSnapshot.amount`, `is part of ${item.partOf} and is charged ${snap.amount} on top of it`);
    }

    /* DEPENDENCIES, asked of the catalogue. A required feature that is neither
       ordered nor a free prerequisite is a scope nobody could execute. */
    for (const need of catalogue.requires(item.featureId)) {
      if (chosen.has(need)) continue;
      const nf = catalogue.feature(need);
      if (nf && nf.selectable === false && nf.pricing.type === 'included') continue;
      bad(`${at}.dependencies`, `${item.featureId} requires ${need}, which the order does not contain`);
    }
    for (const clash of catalogue.conflicts(item.featureId)) {
      if (chosen.has(clash)) bad(`${at}.dependencies`, `${item.featureId} conflicts with ${clash}, which the order also contains`);
    }
  }

  /* THE PAGE COUNT, checked against the catalogue's own rule. */
  const rule = catalogue.pageAllowance();
  if (rule && order.scope && order.scope.limits && order.scope.limits.pages !== undefined) {
    const builds = rule.builtBy.some((id) => chosen.has(id));
    if (!builds) {
      bad('scope.limits.pages', 'declares a page count and orders nothing that builds pages');
    } else {
      const extra = (order.items || []).find((i) => i.featureId === rule.beyondFirst);
      const expected = (rule.firstPageIncluded ? 1 : 0) + (extra ? extra.quantity : 0);
      if (order.scope.limits.pages !== expected) {
        bad('scope.limits.pages', `says ${order.scope.limits.pages} pages and prices ${expected}`);
      }
    }
  }

  /* THE TOTALS MUST BE THE SUM OF THE LINES. Recomputed from the snapshot, not
     from the catalogue: this checks the order is internally honest, which is a
     different question from whether it matches today's prices. */
  if (order.items && order.pricing && order.pricing.total) {
    const sum = { once: 0, monthly: 0 };
    for (const i of order.items) {
      const s = i.pricingSnapshot || {};
      if (typeof s.amount !== 'number') continue;
      if (s.billing === 'monthly') sum.monthly += s.amount; else sum.once += s.amount;
    }
    if (sum.once !== order.pricing.total.oneTime) bad('pricing.total.oneTime', `says ${order.pricing.total.oneTime} and its lines add to ${sum.once}`);
    if (sum.monthly !== order.pricing.total.monthly) bad('pricing.total.monthly', `says ${order.pricing.total.monthly} and its lines add to ${sum.monthly}`);
  }

  return problems;
}

/** The effective feature scope, with where each line came from. */
export function effectiveScope(order) {
  return (order.items || []).map((i) => ({
    featureId: i.featureId,
    serviceId: i.catalogueRef.serviceId,
    quantity: i.quantity,
    origin: i.origin,
    tier: i.tier || null,
    options: i.options || null,
    partOf: i.partOf || null,
    addonGroup: i.addonGroup || null,
    charged: (i.pricingSnapshot || {}).amount || 0,
  }));
}

/**
 * Amend a submitted order without touching what it said.
 *
 * The original items and totals are copied into `amendments[]` before anything
 * changes, so "what did they originally agree to" survives every later edit.
 * An order that can be quietly rewritten is not evidence of anything.
 */
export function amendOrder(order, nextItems, { by = 'operator', reason, at = new Date().toISOString(), pricing = null } = {}) {
  if (!reason) throw new Error('order: an amendment must say why');
  order.amendments = order.amendments || [];
  order.amendments.push({
    at, by, reason,
    revision: order.amendments.length + 1,
    replaced: { items: structuredClone(order.items), pricing: structuredClone(order.pricing) },
  });
  order.items = structuredClone(nextItems);
  if (pricing) order.pricing = structuredClone(pricing);
  order.updatedAt = at;
  record(order, EVENTS.ORDER_AMENDED, { at, by, data: { revision: order.amendments.length, reason } });
  return order;
}

/** What the order said before any amendment — the commercial fact. */
export function originalScope(order) {
  const first = (order.amendments || [])[0];
  return first ? first.replaced : { items: order.items, pricing: order.pricing };
}
