/**
 * ROUTES — HTTP in, domain operations out.
 *
 * NO HANDLER IMPLEMENTS A BUSINESS RULE. Each one does exactly four things:
 * check the caller may perform the operation, check they may see the record,
 * hand validated arguments to a domain operation, and shape the reply. Whether
 * a task may move from review to approved is not decided here and could not be
 * — the domain owns that, and this file has no other way to change a record.
 *
 * WHAT THE SERVER NEVER TRUSTS: a status, an owner, a price, a snapshot, an
 * agent identity, a completion claim. Those come from the domain or from the
 * session, never from the body. §15 names them; this file simply never reads
 * them off the request.
 */

import { fail } from './errors.js';
import { verifyPayloadPrices } from './order-verification.js';

const json = (status, body) => ({ status, body });
const ok = (body) => json(200, body);
const created = (body) => json(201, body);

/** Domain results are {ok, ...} or {ok:false, problems}. Translate, do not reinterpret. */
function fromDomain(result, { status = 200 } = {}) {
  if (result && result.ok === false) {
    throw fail('VALIDATION_ERROR', result.problems.map((p) => `${p.path}: ${p.message}`).join('; '), result.problems);
  }
  const { ok: _ignored, ...rest } = result || {};
  return json(status, rest);
}

const need = (body, ...keys) => {
  for (const k of keys) {
    if (body[k] === undefined || body[k] === null || body[k] === '') {
      throw fail('VALIDATION_ERROR', `"${k}" is required`);
    }
  }
  return body;
};

export function createRoutes(app) {
  const { ops, auth, authz, agentRuntime, automation } = app;

  /** Every guarded call goes through here: permission, then scope, then domain. */
  const guard = (user, operation) => { authz.assertMay(user, operation); return user; };

  const seeProject = (user, id) => authz.assertCanSee(user, ops.getProject(id), { kind: 'project' });
  const seeOrder = (user, id) => authz.assertCanSee(user, ops.getOrder(id), { kind: 'order' });
  const seeTask = (user, id) => {
    const task = ops.getTask(id);
    if (!task) throw fail('NOT_FOUND', 'no such task');
    /* A task belongs to a project; the scope check is the project's. */
    authz.assertCanSee(user, ops.getProject(task.projectId), { kind: 'task' });
    return task;
  };

  return [
    /* --- open ------------------------------------------------------------- */
    ['GET', '/health', null, () => ok({ status: 'ok', ...app.info() })],

    ['POST', '/auth/login', null, (ctx) => {
      const b = need(ctx.body, 'email', 'password');
      return ok(auth.login(b.email, b.password, { userAgent: ctx.headers['user-agent'] || null }));
    }],

    /* --- session ---------------------------------------------------------- */
    ['POST', '/auth/logout', 'auth', (ctx) => ok({ signedOut: auth.logout(ctx.token) })],
    ['GET', '/auth/me', 'auth', (ctx) => ok({ user: ctx.user })],

    /* --- users ------------------------------------------------------------ */
    ['GET', '/users', 'auth', (ctx) => { guard(ctx.user, 'listUsers'); return ok({ users: auth.listUsers() }); }],
    ['POST', '/users', 'auth', (ctx) => {
      guard(ctx.user, 'createUser');
      const b = need(ctx.body, 'email', 'name', 'password');
      return created({ user: auth.createUser(b) });
    }],
    ['POST', '/users/:id/status', 'auth', (ctx) => {
      guard(ctx.user, 'setUserStatus');
      return ok({ user: auth.setUserStatus(ctx.params.id, need(ctx.body, 'status').status) });
    }],

    /* --- clients ---------------------------------------------------------- */
    ['GET', '/clients', 'auth', (ctx) => {
      guard(ctx.user, 'listClients');
      return ok({ clients: ops.listClients() });
    }],
    ['POST', '/clients', 'auth', (ctx) => {
      guard(ctx.user, 'createClient');
      return fromDomain(ops.createClient(need(ctx.body, 'name'), { by: ctx.user.id }), { status: 201 });
    }],
    ['GET', '/clients/:id', 'auth', (ctx) => {
      guard(ctx.user, 'getClient');
      const client = ops.getClient(ctx.params.id);
      authz.assertCanSee(ctx.user, client ? { ...client, clientId: client.id } : null, { kind: 'client' });
      return ok({ client });
    }],
    ['GET', '/clients/:id/dossier', 'auth', (ctx) => {
      guard(ctx.user, 'clientDossier');
      const d = ops.clientDossier(ctx.params.id);
      authz.assertCanSee(ctx.user, d ? { ...d, clientId: ctx.params.id } : null, { kind: 'client' });
      return ok(d);
    }],

    /* --- orders ------------------------------------------------------------ */
    ['GET', '/orders', 'auth', (ctx) => {
      guard(ctx.user, 'listOrders');
      /* THE SCOPE IS APPLIED IN THE QUERY, not filtered afterwards — a listing
         that loads everything and then hides most of it has already read it. */
      const scope = authz.scope(ctx.user);
      const orders = Object.keys(scope).length
        ? ops.stores.orders.findWhere(scope)
        : ops.listOrders();
      return ok({ orders });
    }],
    ['POST', '/orders', 'auth', (ctx) => {
      guard(ctx.user, 'createOrder');
      const b = need(ctx.body, 'payload');
      /* EVERY PRICE IS RECOMPUTED FROM THE CATALOGUE BEFORE IT BECOMES A
         SNAPSHOT. The domain checks an order is internally consistent, which a
         payload claiming a logo costs one dollar also is. See
         order-verification.js for why the check belongs here and not there. */
      const wrong = verifyPayloadPrices(b.payload, ops.catalogue);
      if (wrong.length) {
        throw fail('VALIDATION_ERROR', `the payload disagrees with the catalogue: ${wrong.map((p) => `${p.path} ${p.message}`).join('; ')}`, wrong);
      }
      /* The CLIENT is whoever the body names and the domain validates. Nothing
         else in the body is read — a status or a projectId arriving here is
         simply never looked at. */
      return fromDomain(ops.createOrder(b.payload, { clientId: b.clientId || null, by: ctx.user.id }), { status: 201 });
    }],
    ['GET', '/orders/:id', 'auth', (ctx) => {
      guard(ctx.user, 'getOrder');
      return ok({ order: seeOrder(ctx.user, ctx.params.id) });
    }],
    ['GET', '/orders/:id/summary', 'auth', (ctx) => {
      guard(ctx.user, 'orderSummary');
      seeOrder(ctx.user, ctx.params.id);
      return ok(ops.orderSummary(ctx.params.id, ctx.query.lang === 'ar' ? 'ar' : 'en'));
    }],
    ['POST', '/orders/:id/client', 'auth', (ctx) => {
      guard(ctx.user, 'assignOrderToClient');
      /* THE SECURITY AUDIT FOUND THIS ONE. Every other handler taking an :id
         scoped it; this took an order id, never looked at whose it was, and
         attached it to a client of the caller's choosing. The permission check
         alone was not enough — that is exactly the insecure direct object
         reference §13 names. */
      seeOrder(ctx.user, ctx.params.id);
      return fromDomain(ops.assignOrderToClient(ctx.params.id, need(ctx.body, 'clientId').clientId, { by: ctx.user.id }));
    }],
    ['POST', '/orders/:id/submit', 'auth', (ctx) => {
      guard(ctx.user, 'submitOrder'); seeOrder(ctx.user, ctx.params.id);
      return fromDomain(ops.submitOrder(ctx.params.id, { by: ctx.user.id }));
    }],
    ['POST', '/orders/:id/review', 'auth', (ctx) => {
      guard(ctx.user, 'reviewOrder'); seeOrder(ctx.user, ctx.params.id);
      return fromDomain(ops.reviewOrder(ctx.params.id, { by: ctx.user.id }));
    }],
    ['POST', '/orders/:id/approve', 'auth', (ctx) => {
      guard(ctx.user, 'approveOrder'); seeOrder(ctx.user, ctx.params.id);
      return fromDomain(ops.approveOrder(ctx.params.id, { by: ctx.user.id }));
    }],
    ['POST', '/orders/:id/reject', 'auth', (ctx) => {
      guard(ctx.user, 'rejectOrder'); seeOrder(ctx.user, ctx.params.id);
      return fromDomain(ops.rejectOrder(ctx.params.id, { by: ctx.user.id, reason: need(ctx.body, 'reason').reason }));
    }],
    ['POST', '/orders/:id/convert', 'auth', (ctx) => {
      guard(ctx.user, 'convertOrderToProject'); seeOrder(ctx.user, ctx.params.id);
      return fromDomain(ops.convertOrderToProject(ctx.params.id, { by: ctx.user.id }), { status: 201 });
    }],

    /* --- projects ----------------------------------------------------------- */
    ['GET', '/projects', 'auth', (ctx) => {
      guard(ctx.user, 'listProjects');
      const scope = authz.scope(ctx.user);
      const projects = Object.keys(scope).length ? ops.stores.projects.findWhere(scope) : ops.listProjects();
      return ok({ projects });
    }],
    ['GET', '/projects/:id', 'auth', (ctx) => {
      guard(ctx.user, 'getProject');
      return ok({ project: seeProject(ctx.user, ctx.params.id) });
    }],
    ['GET', '/projects/:id/pipelines', 'auth', (ctx) => {
      guard(ctx.user, 'getProjectPipelines'); seeProject(ctx.user, ctx.params.id);
      return ok({ pipelines: ops.getProjectPipelines(ctx.params.id) });
    }],
    ['GET', '/projects/:id/progress', 'auth', (ctx) => {
      guard(ctx.user, 'projectProgress'); seeProject(ctx.user, ctx.params.id);
      return ok({ progress: ops.projectProgress(ctx.params.id), execution: ops.executionProgress(ctx.params.id) });
    }],
    ['POST', '/projects/:id/tasks', 'auth', (ctx) => {
      guard(ctx.user, 'generateTasksFromWorkflow'); seeProject(ctx.user, ctx.params.id);
      return fromDomain(ops.generateTasksFromWorkflow(ctx.params.id, { by: ctx.user.id }), { status: 201 });
    }],
    ['GET', '/projects/:id/tasks', 'auth', (ctx) => {
      guard(ctx.user, 'getTasks'); seeProject(ctx.user, ctx.params.id);
      return ok({ tasks: ops.getTasks({ projectId: ctx.params.id }) });
    }],
    ['POST', '/projects/:id/status', 'auth', (ctx) => {
      guard(ctx.user, 'setProjectStatus'); seeProject(ctx.user, ctx.params.id);
      return fromDomain(ops.setProjectStatus(ctx.params.id, need(ctx.body, 'status').status, { by: ctx.user.id, reason: ctx.body.reason || null }));
    }],

    /* --- tasks -------------------------------------------------------------- */
    ['GET', '/tasks/:id', 'auth', (ctx) => {
      guard(ctx.user, 'getTask');
      return ok({ task: seeTask(ctx.user, ctx.params.id) });
    }],
    ['GET', '/tasks/:id/why', 'auth', (ctx) => {
      guard(ctx.user, 'explainTask'); seeTask(ctx.user, ctx.params.id);
      return ok(ops.explainTask(ctx.params.id));
    }],
    ['POST', '/tasks/:id/assign', 'auth', (ctx) => {
      guard(ctx.user, 'assignTask'); seeTask(ctx.user, ctx.params.id);
      const b = need(ctx.body, 'assignee');
      return fromDomain(ops.assignTask(ctx.params.id, { assignee: b.assignee, executorType: b.executorType || 'human', by: ctx.user.id }));
    }],
    ['POST', '/tasks/:id/start', 'auth', (ctx) => {
      guard(ctx.user, 'startTask'); seeTask(ctx.user, ctx.params.id);
      return fromDomain(ops.startTask(ctx.params.id, { by: ctx.user.id }));
    }],
    ['POST', '/tasks/:id/input', 'auth', (ctx) => {
      guard(ctx.user, 'provideInput'); seeTask(ctx.user, ctx.params.id);
      const b = need(ctx.body, 'key');
      return fromDomain(ops.provideInput(ctx.params.id, { key: b.key, value: b.value, by: ctx.user.id }));
    }],
    ['POST', '/tasks/:id/output', 'auth', (ctx) => {
      guard(ctx.user, 'recordOutput'); seeTask(ctx.user, ctx.params.id);
      const b = need(ctx.body, 'key');
      return fromDomain(ops.recordOutput(ctx.params.id, { key: b.key, value: b.value, by: ctx.user.id }));
    }],
    ['POST', '/tasks/:id/review', 'auth', (ctx) => {
      guard(ctx.user, 'submitTaskForReview'); seeTask(ctx.user, ctx.params.id);
      return fromDomain(ops.submitTaskForReview(ctx.params.id, { by: ctx.user.id }));
    }],
    ['POST', '/tasks/:id/qa', 'auth', (ctx) => {
      guard(ctx.user, 'judgeQa'); seeTask(ctx.user, ctx.params.id);
      const b = ctx.body;
      if (b.all === true) return fromDomain(ops.passAllQa(ctx.params.id, { by: ctx.user.id }));
      need(b, 'criterionId', 'result');
      return fromDomain(ops.judgeQa(ctx.params.id, { criterionId: b.criterionId, result: b.result, by: ctx.user.id, note: b.note || null }));
    }],
    ['POST', '/tasks/:id/approve', 'auth', (ctx) => {
      guard(ctx.user, 'approveTask'); seeTask(ctx.user, ctx.params.id);
      /* THE APPROVER IS THE SESSION, NOT THE BODY. A request that names its own
         approver is a request that approves its own work. */
      return fromDomain(ops.approveTask(ctx.params.id, { by: ctx.user.id, actorType: 'human' }));
    }],
    ['POST', '/tasks/:id/reject', 'auth', (ctx) => {
      guard(ctx.user, 'rejectTask'); seeTask(ctx.user, ctx.params.id);
      return fromDomain(ops.rejectTask(ctx.params.id, {
        reason: need(ctx.body, 'reason').reason,
        failedCriteria: Array.isArray(ctx.body.failedCriteria) ? ctx.body.failedCriteria : [],
        by: ctx.user.id,
      }));
    }],
    ['POST', '/tasks/:id/complete', 'auth', (ctx) => {
      guard(ctx.user, 'completeTask'); seeTask(ctx.user, ctx.params.id);
      return fromDomain(ops.completeTask(ctx.params.id, { by: ctx.user.id }));
    }],
    ['POST', '/tasks/:id/block', 'auth', (ctx) => {
      guard(ctx.user, 'blockTask'); seeTask(ctx.user, ctx.params.id);
      return fromDomain(ops.blockTask({ taskId: ctx.params.id, reason: need(ctx.body, 'reason').reason }, { by: ctx.user.id }));
    }],

    /* --- agents ------------------------------------------------------------- */
    ['GET', '/agents', 'auth', (ctx) => { guard(ctx.user, 'listAgents'); return ok({ agents: ops.listAgents(), ai: app.info().ai }); }],
    ['POST', '/agents/:id/status', 'auth', (ctx) => {
      guard(ctx.user, 'setAgentStatus');
      return fromDomain(ops.setAgentStatus(ctx.params.id, need(ctx.body, 'status').status, { by: ctx.user.id }));
    }],
    ['POST', '/agents/kill-switch', 'auth', (ctx) => {
      guard(ctx.user, 'setKillSwitch');
      return fromDomain(ops.setKillSwitch(Boolean(ctx.body.on), { by: ctx.user.id }));
    }],
    ['GET', '/tasks/:id/eligibility', 'auth', (ctx) => {
      guard(ctx.user, 'evaluateAgentEligibility'); seeTask(ctx.user, ctx.params.id);
      return fromDomain(ops.evaluateAgentEligibility({ taskId: ctx.params.id, agentId: ctx.query.agentId || null }));
    }],
    /* THE REAL AI RUN. Server-side, always: the key never leaves this process. */
    ['POST', '/tasks/:id/qa-reader', 'auth', async (ctx) => {
      guard(ctx.user, 'assignTaskToAgent'); seeTask(ctx.user, ctx.params.id);
      const result = await agentRuntime.runQaReader(ctx.params.id, { by: ctx.user.id });
      return result.ok === false ? fromDomain(result) : ok(result);
    }],
    ['GET', '/agent-executions', 'auth', (ctx) => {
      guard(ctx.user, 'listAgents');
      return ok({ executions: agentRuntime.executions({ taskId: ctx.query.taskId || null }) });
    }],

    /* --- automation and audit ------------------------------------------------ */
    ['GET', '/automation/rules', 'auth', (ctx) => { guard(ctx.user, 'automationRules'); return ok({ rules: ops.automationRules() }); }],
    ['GET', '/automation/executions', 'auth', (ctx) => {
      guard(ctx.user, 'automationRules');
      return ok({ executions: automation.executions({ status: ctx.query.status || null }) });
    }],
    ['POST', '/automation/recover', 'auth', (ctx) => {
      guard(ctx.user, 'recoverStaleExecutions');
      return ok(automation.recoverStale({ by: ctx.user.id }));
    }],
    ['GET', '/projects/:id/audit', 'auth', (ctx) => {
      guard(ctx.user, 'auditFor'); seeProject(ctx.user, ctx.params.id);
      return ok({ audit: ops.audit.forProject(ctx.params.id) });
    }],
  ];
}
