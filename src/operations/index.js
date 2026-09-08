/**
 * OPERATIONS — the domain API.
 *
 * WHAT THIS FILE IS FOR. Everything above the storage layer and below whatever
 * is calling — an admin screen, a command line, one day an HTTP handler or an
 * agent — goes through these functions. There is one implementation of
 * "approve an order", and four possible callers of it. The alternative is four
 * implementations that agree until they don't.
 *
 * Each function is shaped as though it were already an endpoint: named
 * arguments in, a record or a problem list out, no DOM, no `fs`, no globals.
 * Turning `submitOrder()` into `POST /orders/:id/submit` should be a routing
 * exercise and nothing more.
 *
 * Everything is injected — catalogue, stores, clock, randomness — so the same
 * code runs in a test with a frozen clock and in an operator's terminal with a
 * real one, and neither knows the difference.
 */

import { createCatalogue } from './catalogue-read.js';
import { createStatus } from './status.js';
import { repositories } from './repository.js';
import { EVENTS, record } from './events.js';
import { createClient, resolveClient, updateClient, matchClient, ordersOf, projectsOf } from './client.js';
import { orderFromPayload, validateOrder, effectiveScope, amendOrder, originalScope } from './order.js';
import {
  convertOrderToProject, allWorkflows, workflowFor, pipelineFor, progress, nextStage,
  setWorkflowStatus, setPipelineStatus, setProjectStatus,
} from './project.js';

export function createOperations({
  catalogue,
  statuses,
  stores,
  now = () => new Date(),
  random = Math.random,
}) {
  const cat = createCatalogue(catalogue);
  const status = createStatus(statuses);
  const repo = repositories(stores);
  const clock = () => now().toISOString();

  /** A problem list is returned, never thrown — a caller decides what to show. */
  const fail = (problems) => ({ ok: false, problems });
  const done = (value) => ({ ok: true, ...value });

  const api = {
    catalogue: cat,
    status,
    stores: repo,

    /* ---------- clients ---------------------------------------------------- */

    createClient(input, { by = 'operator' } = {}) {
      if (!String(input.name || '').trim()) return fail([{ path: 'name', message: 'a client must have a name' }]);
      const client = repo.clients.put(createClient(input, { now, random, by }));
      return done({ client });
    },

    getClient: (id) => repo.clients.get(id),
    listClients: () => repo.clients.all(),

    /** Find them or make them, and say which — never a silent merge. */
    resolveClient(input, { by = 'operator' } = {}) {
      const out = resolveClient(input, repo.clients, { now, random, by });
      return done(out);
    },

    matchClient: (input) => matchClient(input, repo.clients),

    updateClient(id, patch, { by = 'operator' } = {}) {
      const client = repo.clients.get(id);
      if (!client) return fail([{ path: 'clientId', message: `no client ${id}` }]);
      return done({ client: repo.clients.put(updateClient(client, patch, { now, by })) });
    },

    /* ---------- orders ------------------------------------------------------ */

    /**
     * The only way an order is born: from the builder payload.
     * There is no `createOrderFromMessage`, and there will not be one.
     */
    createOrder(payload, { clientId = null, by = 'builder', source } = {}) {
      let order;
      try {
        order = orderFromPayload(payload, { clientId, catalogue: cat, now, random, by, source });
      } catch (e) {
        return fail([{ path: 'payload', message: e.message }]);
      }
      const problems = validateOrder(order, cat, { clients: repo.clients });
      if (problems.length) return fail(problems);
      return done({ order: repo.orders.put(order) });
    },

    getOrder: (id) => repo.orders.get(id),
    listOrders: () => repo.orders.all(),

    validateOrder(id) {
      const order = repo.orders.get(id);
      if (!order) return fail([{ path: 'orderId', message: `no order ${id}` }]);
      const problems = validateOrder(order, cat, { clients: repo.clients });
      return problems.length ? fail(problems) : done({ order });
    },

    /** Attach an order to a client. Refuses once the scope is frozen. */
    assignOrderToClient(orderId, clientId, { by = 'operator' } = {}) {
      const order = repo.orders.get(orderId);
      if (!order) return fail([{ path: 'orderId', message: `no order ${orderId}` }]);
      if (!repo.clients.get(clientId)) return fail([{ path: 'clientId', message: `no client ${clientId}` }]);
      if (order.status !== 'draft') {
        return fail([{ path: 'status', message: `order ${orderId} is "${order.status}" — a client is attached before it is submitted` }]);
      }
      order.clientId = clientId;
      order.updatedAt = clock();
      return done({ order: repo.orders.put(order) });
    },

    /**
     * Submit. This is the moment the commercial scope freezes, so it is also
     * the last moment validation is cheap — hence the full check here.
     */
    submitOrder(id, { by = 'client' } = {}) {
      const order = repo.orders.get(id);
      if (!order) return fail([{ path: 'orderId', message: `no order ${id}` }]);
      if (!order.clientId) return fail([{ path: 'clientId', message: 'an order cannot be submitted without a client — we would not know whose it is' }]);
      const problems = validateOrder(order, cat, { clients: repo.clients });
      if (problems.length) return fail(problems);
      try { status.transition('order', order, 'submitted', { by, at: clock() }); }
      catch (e) { return fail([{ path: 'status', message: e.message }]); }
      record(order, EVENTS.ORDER_SUBMITTED, { at: order.updatedAt, by });
      return done({ order: repo.orders.put(order) });
    },

    reviewOrder(id, { by = 'operator' } = {}) {
      return api._move(id, 'under_review', null, by);
    },

    approveOrder(id, { by = 'operator', reason = null } = {}) {
      const order = repo.orders.get(id);
      if (!order) return fail([{ path: 'orderId', message: `no order ${id}` }]);
      const problems = validateOrder(order, cat, { clients: repo.clients });
      if (problems.length) return fail(problems);
      return api._move(id, 'approved', reason, by, EVENTS.ORDER_APPROVED);
    },

    rejectOrder(id, { by = 'operator', reason } = {}) {
      if (!reason) return fail([{ path: 'reason', message: 'a rejection must say why — the record is the only place it will be remembered' }]);
      return api._move(id, 'rejected', reason, by, EVENTS.ORDER_REJECTED);
    },

    cancelOrder(id, { by = 'operator', reason = null } = {}) {
      return api._move(id, 'cancelled', reason, by, EVENTS.ORDER_CANCELLED);
    },

    _move(id, to, reason, by, event = null) {
      const order = repo.orders.get(id);
      if (!order) return fail([{ path: 'orderId', message: `no order ${id}` }]);
      try { status.transition('order', order, to, { by, at: clock(), reason }); }
      catch (e) { return fail([{ path: 'status', message: e.message }]); }
      if (event) record(order, event, { at: order.updatedAt, by, data: reason ? { reason } : null });
      return done({ order: repo.orders.put(order) });
    },

    /** Change a submitted order without erasing what it said. */
    amendOrder(id, items, { by = 'operator', reason, pricing = null } = {}) {
      const order = repo.orders.get(id);
      if (!order) return fail([{ path: 'orderId', message: `no order ${id}` }]);
      if (!reason) return fail([{ path: 'reason', message: 'an amendment must say why' }]);
      const next = amendOrder(order, items, { by, reason, at: clock(), pricing });
      const problems = validateOrder(next, cat, { clients: repo.clients });
      if (problems.length) return fail(problems);
      return done({ order: repo.orders.put(next) });
    },

    /** What the order said before anything was amended. */
    originalScope: (id) => {
      const order = repo.orders.get(id);
      return order ? originalScope(order) : null;
    },

    effectiveScope: (id) => {
      const order = repo.orders.get(id);
      return order ? effectiveScope(order) : null;
    },

    /* ---------- projects ---------------------------------------------------- */

    /** Idempotent. Run it twice and you get the same project, not two. */
    convertOrderToProject(orderId, { by = 'operator', name = null } = {}) {
      const order = repo.orders.get(orderId);
      if (!order) return fail([{ path: 'orderId', message: `no order ${orderId}` }]);
      let out;
      try {
        out = convertOrderToProject(order, { catalogue: cat, projects: repo.projects, status, now, random, by, name });
      } catch (e) {
        return fail([{ path: 'order', message: e.message }]);
      }
      if (out.created) {
        order.projectId = out.project.id;
        order.updatedAt = clock();
        try { status.transition('order', order, 'converted_to_project', { by, at: order.updatedAt }); }
        catch (e) { return fail([{ path: 'status', message: e.message }]); }
        record(order, EVENTS.ORDER_CONVERTED, { at: order.updatedAt, by, data: { projectId: out.project.id } });
        repo.orders.put(order);
      }
      return done(out);
    },

    getProject: (id) => repo.projects.get(id),
    listProjects: () => repo.projects.all(),
    projectForOrder: (orderId) => repo.projects.find((p) => p.orderId === orderId)[0] || null,

    getProjectPipelines: (id) => {
      const p = repo.projects.get(id);
      return p ? p.pipelines : null;
    },

    projectProgress: (id) => {
      const p = repo.projects.get(id);
      return p ? progress(p, status) : null;
    },

    nextStage: (id, serviceId) => {
      const p = repo.projects.get(id);
      return p ? nextStage(p, serviceId) : null;
    },

    setProjectStatus(id, to, { by = 'operator', reason = null } = {}) {
      const p = repo.projects.get(id);
      if (!p) return fail([{ path: 'projectId', message: `no project ${id}` }]);
      try { setProjectStatus(p, to, status, { by, at: clock(), reason }); }
      catch (e) { return fail([{ path: 'status', message: e.message }]); }
      return done({ project: repo.projects.put(p) });
    },

    setPipelineStatus(id, pipelineInstanceId, to, { by = 'operator', reason = null } = {}) {
      const p = repo.projects.get(id);
      if (!p) return fail([{ path: 'projectId', message: `no project ${id}` }]);
      try { setPipelineStatus(p, pipelineInstanceId, to, status, { by, at: clock(), reason }); }
      catch (e) { return fail([{ path: 'status', message: e.message }]); }
      return done({ project: repo.projects.put(p) });
    },

    setWorkflowStatus(id, workflowInstanceId, to, { by = 'operator', reason = null } = {}) {
      const p = repo.projects.get(id);
      if (!p) return fail([{ path: 'projectId', message: `no project ${id}` }]);
      try { setWorkflowStatus(p, workflowInstanceId, to, status, { by, at: clock(), reason }); }
      catch (e) { return fail([{ path: 'status', message: e.message }]); }
      return done({ project: repo.projects.put(p) });
    },

    /* ---------- the CRM view ------------------------------------------------ */

    /**
     * Everything about one client, assembled from references. Nothing here is
     * stored: it is the join, done on demand, so a CRM screen can never show a
     * stale copy of a catalogue name or an order total.
     */
    clientDossier(clientId) {
      const client = repo.clients.get(clientId);
      if (!client) return null;
      const orders = ordersOf(clientId, repo.orders);
      const projects = projectsOf(clientId, repo.projects);
      const lastActivity = [client.updatedAt, ...orders.map((o) => o.updatedAt), ...projects.map((p) => p.updatedAt)]
        .filter(Boolean).sort().pop();
      return {
        client,
        orders: orders.map((o) => ({
          id: o.id,
          status: o.status,
          statusLabel: status.label('order', o.status),
          total: o.pricing.total,
          currency: o.pricing.currency,
          services: o.scope.services,
          lineItems: o.items.length,
          projectId: o.projectId,
          createdAt: o.createdAt,
        })),
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          orderId: p.orderId,
          status: p.status,
          statusLabel: status.label('project', p.status),
          services: p.services,
          progress: progress(p, status),
          createdAt: p.createdAt,
        })),
        lastActivity,
      };
    },

    /** A customer-facing summary, in their language, with no internal ids. */
    orderSummary(orderId, lang = 'en') {
      const order = repo.orders.get(orderId);
      if (!order) return null;
      const label = (id) => (cat.nameOf(id) || { en: id, ar: id })[lang] || id;
      return {
        reference: order.id,
        status: (status.label('order', order.status) || {})[lang] || order.status,
        services: order.scope.services.map(label),
        lines: order.items
          .filter((i) => (i.pricingSnapshot || {}).amount > 0)
          .map((i) => ({
            name: label(i.featureId) + (i.quantity > 1 ? ` × ${i.quantity}` : ''),
            amount: i.pricingSnapshot.amount,
            billing: i.pricingSnapshot.billing,
          })),
        total: order.pricing.total,
        currency: order.pricing.currency,
      };
    },
  };

  return api;
}

export { EVENTS };
export { memoryStore, jsonFileStore, repositories } from './repository.js';
export { createCatalogue } from './catalogue-read.js';
export { createStatus } from './status.js';
export { allWorkflows, workflowFor, pipelineFor } from './project.js';
