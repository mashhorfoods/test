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
import { createTaskTemplates } from './task-template.js';
import {
  checkReadiness, transitionGuard, openAttempt, closeAttempt, judgeQa,
  automaticCriteria, explainTask,
} from './task.js';
import { generateTasksForProject, refreshReadiness, findCycle } from './task-generator.js';
import { createAgents, mockExecutor, AGENT_FORBIDDEN } from './agent.js';
import { createAutomation } from './automation.js';
import { createAudit } from './audit.js';

export function createOperations({
  catalogue,
  statuses,
  stores,
  /* Phase 3. Optional: without them the operations layer is exactly Phase 2,
     which is how the Phase 2 suite keeps running untouched. */
  execution = null,
  automationRules = null,
  agentRegistry = null,
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

  const templates = execution ? createTaskTemplates(cat, execution) : null;
  const audit = repo.audit ? createAudit(repo.audit, { now }) : createAudit(memoryStore(), { now });
  const agents = agentRegistry ? createAgents(agentRegistry, { catalogue: cat, execution, now }) : null;

  /* Every state change writes one audit line, from one place, so "who changed
     this" has a single answer rather than one per call site. */
  const logChange = ({ entityType, entity, from, to, action, by, actorType, reason = null, detail = null, agentId = null, ruleId = null }) =>
    audit.write({
      action, actorType, actor: by, entityType, entityId: entity.id,
      projectId: entity.projectId || entity.id, from, to, reason, detail, agentId, ruleId,
      at: clock(),
    });

  const api = {
    catalogue: cat,
    status,
    stores: repo,
    templates,
    agents,
    audit,

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

    /* ---------- tasks: the execution layer ---------------------------------- */

    /*
     * NOTHING BELOW SETS A STATUS DIRECTLY. Every move goes through
     * `_moveTask`, which checks the state machine, then the content guards in
     * task.js, then writes an audit line. A UI, an automation rule and an agent
     * all arrive here, and all three are checked the same way.
     */

    _tasksOf: (projectId) => repo.tasks.find((t) => t.projectId === projectId),
    _taskById: (id) => repo.tasks.get(id),

    _moveTask(task, to, { by, actorType = 'human', reason = null, event = null, agentId = null, ruleId = null }) {
      const from = task.status;
      const byId = (id) => repo.tasks.get(id);
      task._readiness = checkReadiness(task, byId);
      const guard = transitionGuard(task, to, { by, actorType, });
      delete task._readiness;
      if (!guard.ok) return fail([{ path: 'task', message: guard.message }]);
      try { status.transition('task', task, to, { by, at: clock(), reason }); }
      catch (e) { return fail([{ path: 'status', message: e.message }]); }
      if (event) record(task, event, { at: task.updatedAt || clock(), by });
      logChange({ entityType: 'task', entity: task, from, to, action: event || `task.${to}`, by, actorType, reason, agentId, ruleId });
      repo.tasks.put(task);
      /* An event may cause other work to become possible. */
      if (api._automation && event) api._automation.dispatch(event, { task }, { by });
      return done({ task });
    },

    /** WORKFLOW INSTANCES IN, TASK INSTANCES OUT. Idempotent by construction. */
    generateTasksFromWorkflow(projectId, { by = 'operator' } = {}) {
      if (!templates) return fail([{ path: 'execution', message: 'the execution policy was not loaded — this operations instance has no task engine' }]);
      const project = repo.projects.get(projectId);
      if (!project) return fail([{ path: 'projectId', message: `no project ${projectId}` }]);
      let out;
      try {
        out = generateTasksForProject(project, { catalogue: cat, templates, tasks: repo.tasks, status, at: clock(), by });
      } catch (e) {
        return fail([{ path: 'tasks', message: e.message }]);
      }
      for (const t of out.created) {
        logChange({ entityType: 'task', entity: t, from: null, to: t.status, action: EVENTS.TASK_CREATED, by, actorType: 'system' });
      }
      return done(out);
    },

    getTask: (id) => repo.tasks.get(id),
    getTasks(filter = {}) {
      return repo.tasks.find((t) => Object.entries(filter).every(([k, v]) => t[k] === v));
    },
    explainTask(id) {
      const t = repo.tasks.get(id);
      return t ? explainTask(t, (x) => repo.tasks.get(x)) : null;
    },
    checkTaskReadiness(id) {
      const t = repo.tasks.get(id);
      if (!t) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      return done({ readiness: checkReadiness(t, (x) => repo.tasks.get(x)) });
    },
    /** Called by automation after something completes. Deterministic, not a poll. */
    refreshTaskReadiness({ projectId }, { by = 'system' } = {}) {
      const moved = refreshReadiness(projectId, { tasks: repo.tasks, status, at: clock(), by });
      return done({ moved });
    },

    assignTask(id, { assignee, executorType = 'human', by = 'operator', actorType = 'human' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      if (!assignee) return fail([{ path: 'assignee', message: 'a task cannot be assigned to nobody' }]);
      if (!task.allowedExecutorTypes.includes(executorType)) {
        return fail([{ path: 'executorType', message: `${executorType} may not execute this task — it allows ${task.allowedExecutorTypes.join(' or ')}` }]);
      }
      task.assignedTo = assignee;
      task.executorType = executorType;
      return api._moveTask(task, 'assigned', { by, actorType, event: EVENTS.TASK_ASSIGNED });
    },

    unassignTask(id, { by = 'operator' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      task.assignedTo = null; task.executorType = null;
      return api._moveTask(task, 'ready', { by, actorType: 'human' });
    },

    startTask(id, { by = 'operator', actorType = 'human' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      const moved = api._moveTask(task, 'in_progress', { by, actorType, event: EVENTS.TASK_STARTED });
      if (!moved.ok) return moved;
      const t = repo.tasks.get(id);
      t.startedAt = t.startedAt || clock();
      openAttempt(t, { executor: t.assignedTo, executorType: t.executorType, at: clock() });
      repo.tasks.put(t);
      return done({ task: t });
    },

    requestInput(id, { reason, by = 'operator', actorType = 'human' } = {}) {
      if (!reason) return fail([{ path: 'reason', message: 'say what is missing — "waiting for input" with no input named is not actionable' }]);
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      task.blockedReason = reason;
      return api._moveTask(task, 'waiting_for_input', { by, actorType, reason, event: EVENTS.TASK_INPUT_REQUESTED });
    },

    provideInput(id, { key, value, by = 'operator' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      const input = task.inputs.find((i) => i.key === key);
      if (!input) return fail([{ path: 'key', message: `this task has no input "${key}"` }]);
      input.satisfied = true; input.value = value;
      repo.tasks.put(task);
      logChange({ entityType: 'task', entity: task, from: null, to: null, action: 'task.input_provided', by, actorType: 'human', detail: { key } });
      return done({ task });
    },

    blockTask({ taskId, reason }, { by = 'operator', actorType = 'human' } = {}) {
      const task = repo.tasks.get(taskId);
      if (!task) return fail([{ path: 'taskId', message: `no task ${taskId}` }]);
      if (!reason) return fail([{ path: 'reason', message: 'a block must say what is in the way' }]);
      task.blockedAt = clock(); task.blockedReason = reason;
      return api._moveTask(task, 'blocked', { by, actorType, reason, event: EVENTS.TASK_BLOCKED });
    },

    unblockTask(id, { by = 'operator', actorType = 'human' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      const r = checkReadiness(task, (x) => repo.tasks.get(x));
      if (!r.ready) return fail([{ path: 'dependencies', message: r.reason }]);
      task.blockedReason = null;
      return api._moveTask(task, 'ready', { by, actorType, event: EVENTS.TASK_UNBLOCKED });
    },

    /** Record an output. Producing is not completing. */
    recordOutput(id, { key, value, type = null, by = 'operator', actorType = 'human' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      const out = task.outputs.find((o) => o.key === key);
      if (!out) return fail([{ path: 'key', message: `this task does not produce "${key}"` }]);
      out.produced = true; out.value = value; if (type) out.type = type;
      /* A deliverable is an output somebody will be handed. */
      if (out.type === 'deliverable') {
        task.deliverables.push({
          id: `dlv.${task.id}.${key}`.replace(/[^\x20-\x7e]/g, ''),
          taskId: task.id, key, type: out.type, status: 'draft',
          location: typeof value === 'string' ? value : null,
          version: task.deliverables.filter((d) => d.key === key).length + 1,
          createdAt: clock(), approvedAt: null,
        });
      }
      repo.tasks.put(task);
      logChange({ entityType: 'task', entity: task, from: null, to: null, action: 'task.output_recorded', by, actorType, detail: { key } });
      return done({ task });
    },

    submitTaskForReview(id, { by = 'operator', actorType = 'human', agentId = null } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      const moved = api._moveTask(task, 'review', { by, actorType, event: EVENTS.TASK_SUBMITTED, agentId });
      if (!moved.ok) return moved;
      const t = repo.tasks.get(id);
      t.submittedAt = clock();
      closeAttempt(t, { result: 'submitted', at: t.submittedAt });
      /* The checks a machine is allowed to judge, judged now. Everything else
         waits for a person, which is what `validationMode: human` means. */
      for (const c of automaticCriteria(t)) {
        const present = t.outputs.filter((o) => o.required).every((o) => o.produced);
        judgeQa(t, c.id, { result: present ? 'passed' : 'failed', by: 'system', at: clock() });
      }
      repo.tasks.put(t);
      return done({ task: t });
    },

    /** One QA judgement. A human-mode check cannot be signed by the system. */
    judgeQa(id, { criterionId, result, by = 'operator', note = null } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      if (!['passed', 'failed'].includes(result)) return fail([{ path: 'result', message: 'a QA result is passed or failed' }]);
      try { judgeQa(task, criterionId, { result, by, at: clock() , note }); }
      catch (e) { return fail([{ path: 'criterionId', message: e.message }]); }
      repo.tasks.put(task);
      logChange({
        entityType: 'task', entity: task, from: null, to: null,
        action: result === 'passed' ? EVENTS.QA_PASSED : EVENTS.QA_FAILED, by, actorType: 'human',
        detail: { criterionId, note },
      });
      return done({ task });
    },

    /** Pass every QA criterion a person owns, in one call, for one reviewer. */
    passAllQa(id, { by = 'operator' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      for (const c of task.qaCriteria) {
        if (c.result === 'passed') continue;
        judgeQa(task, c.id, { result: 'passed', by, at: clock() });
      }
      repo.tasks.put(task);
      logChange({ entityType: 'task', entity: task, from: null, to: null, action: EVENTS.QA_PASSED, by, actorType: 'human', detail: { all: true } });
      return done({ task });
    },

    rejectTask(id, { reason, failedCriteria = [], by = 'operator', actorType = 'human' } = {}) {
      if (!reason) return fail([{ path: 'reason', message: 'a rejection must say why — it is the only place the reason survives' }]);
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      for (const cid of failedCriteria) {
        try { judgeQa(task, cid, { result: 'failed', by, at: clock() }); } catch { /* an unknown id is reported below */ }
      }
      task.rejectedAt = clock();
      task.rejectionReason = reason;
      closeAttempt(task, { result: 'rejected', failureReason: reason, at: task.rejectedAt });
      return api._moveTask(task, 'rejected', { by, actorType, reason, event: EVENTS.TASK_REJECTED });
    },

    /** The rework path: a rejected task goes back to being worked on, with its
        history intact and its previous output versions kept. */
    reopenForRework({ taskId }, { by = 'system', actorType = 'automation' } = {}) {
      const task = repo.tasks.get(taskId);
      if (!task) return fail([{ path: 'taskId', message: `no task ${taskId}` }]);
      if (task.attemptCount >= task.maxAttempts) {
        return fail([{ path: 'attempts', message: `all ${task.maxAttempts} attempts are used — escalate rather than retry` }]);
      }
      /* Previous outputs are kept as versions, not erased. */
      for (const o of task.outputs) if (o.produced) { o.previous = [...(o.previous || []), o.value]; o.produced = false; }
      for (const c of task.qaCriteria) { c.result = null; c.checkedBy = null; c.checkedAt = null; }
      task.qaResult = null;
      repo.tasks.put(task);
      /* THE MOVE FIRST, THEN THE ATTEMPT. The guard on `in_progress` refuses a
         rejected task that has used every attempt, and it reads the counter —
         so incrementing before the move made the third rework refuse itself
         and the task sat rejected with nothing escalating it. Counting the
         attempt once it has actually started is also the truer reading. */
      const moved = api._moveTask(task, 'in_progress', { by, actorType, event: EVENTS.TASK_STARTED, reason: 'rework' });
      if (!moved.ok) return moved;
      const fresh = repo.tasks.get(taskId);
      openAttempt(fresh, { executor: fresh.assignedTo, executorType: fresh.executorType, at: clock() });
      repo.tasks.put(fresh);
      return done({ task: fresh });
    },

    retryTask(id, { by = 'operator' } = {}) {
      return api.reopenForRework({ taskId: id }, { by, actorType: 'human' });
    },

    approveTask(id, { by, actorType = 'human' } = {}) {
      if (!by) return fail([{ path: 'by', message: 'an approval must name who gave it' }]);
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      const moved = api._moveTask(task, 'approved', { by, actorType, event: EVENTS.TASK_APPROVED });
      if (!moved.ok) return moved;
      const t = repo.tasks.get(id);
      t.approvedBy = by; t.approvedAt = clock();
      for (const d of t.deliverables) { d.status = 'approved'; d.approvedAt = t.approvedAt; }
      repo.tasks.put(t);
      return done({ task: t });
    },

    completeTask(id, { by = 'operator', actorType = 'human' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      const moved = api._moveTask(task, 'completed', { by, actorType, event: EVENTS.TASK_COMPLETED });
      if (!moved.ok) return moved;
      const t = repo.tasks.get(id);
      t.completedAt = clock();
      closeAttempt(t, { result: 'completed', at: t.completedAt });
      repo.tasks.put(t);
      api._syncProgress(t.projectId, { by });
      return done({ task: t });
    },

    cancelTask(id, { reason = null, by = 'operator', actorType = 'human' } = {}) {
      const task = repo.tasks.get(id);
      if (!task) return fail([{ path: 'taskId', message: `no task ${id}` }]);
      task.cancelledAt = clock();
      return api._moveTask(task, 'cancelled', { by, actorType, reason, event: EVENTS.TASK_CANCELLED });
    },

    escalateTask({ taskId, reason }, { by = 'system', actorType = 'automation' } = {}) {
      const task = repo.tasks.get(taskId);
      if (!task) return fail([{ path: 'taskId', message: `no task ${taskId}` }]);
      task.escalation = {
        at: clock(), reason, to: (execution || { limits: {} }).limits.escalateTo || 'role.account_manager',
        raisedBy: by, attempts: task.attemptCount,
      };
      task.blockedReason = `escalated: ${reason}`;
      task.aiEligible = false; // a person owns it now
      task.allowedExecutorTypes = ['human'];
      repo.tasks.put(task);
      logChange({ entityType: 'task', entity: task, from: task.status, to: task.status, action: EVENTS.TASK_ESCALATED, by, actorType, reason });
      record(task, EVENTS.TASK_ESCALATED, { at: task.escalation.at, by });
      repo.tasks.put(task);
      return done({ task });
    },

    /* ---------- progress, derived rather than tracked ----------------------- */

    /**
     * Task completion rolls up. Derived from the tasks themselves, so progress
     * cannot disagree with the work — there is no second counter to drift.
     */
    _syncProgress(projectId, { by = 'system' } = {}) {
      const project = repo.projects.get(projectId);
      if (!project) return null;
      const all = repo.tasks.find((t) => t.projectId === projectId);
      const at = clock();
      const done_ = (list) => list.length > 0 && list.every((t) => ['completed', 'cancelled'].includes(t.status));
      const started = (list) => list.some((t) => t.status !== 'pending' && t.status !== 'ready');

      for (const pipeline of project.pipelines) {
        for (const wi of pipeline.workflows) {
          const mine = all.filter((t) => t.workflowInstanceId === wi.id);
          if (!mine.length) continue;
          const want = done_(mine) ? 'completed' : (started(mine) ? 'in_progress' : wi.status);
          if (want !== wi.status && status.can('workflowInstance', wi.status, want)) {
            status.transition('workflowInstance', wi, want, { by, at });
            if (want === 'in_progress') wi.startedAt = wi.startedAt || at;
            if (want === 'completed') wi.completedAt = at;
          }
        }
        const mine = all.filter((t) => t.pipelineInstanceId === pipeline.id);
        const want = done_(mine) ? 'completed' : (started(mine) ? 'in_progress' : pipeline.status);
        if (mine.length && want !== pipeline.status && status.can('pipelineInstance', pipeline.status, want)) {
          status.transition('pipelineInstance', pipeline, want, { by, at });
          if (want === 'in_progress') pipeline.startedAt = pipeline.startedAt || at;
          if (want === 'completed') pipeline.completedAt = at;
        }
        const next = pipeline.stages.find((s) => {
          const stageTasks = all.filter((t) => t.stageId === s.stageId && t.pipelineInstanceId === pipeline.id);
          return !stageTasks.length || !done_(stageTasks);
        });
        pipeline.currentStageId = next ? next.stageId : null;
      }

      const want = done_(all) ? 'completed' : (started(all) ? 'in_progress' : project.status);
      if (all.length && want !== project.status && status.can('project', project.status, want)) {
        status.transition('project', project, want, { by, at });
      }
      project.updatedAt = at;
      repo.projects.put(project);
      return project;
    },

    /** Counted, never estimated. */
    executionProgress(projectId) {
      const all = repo.tasks.find((t) => t.projectId === projectId);
      const by_ = (k) => all.reduce((m, t) => ({ ...m, [t[k]]: (m[t[k]] || 0) + 1 }), {});
      return {
        tasks: { total: all.length, completed: all.filter((t) => t.status === 'completed').length },
        byStatus: by_('status'),
        blocked: all.filter((t) => t.status === 'blocked').map((t) => ({ id: t.id, reason: t.blockedReason })),
        awaitingApproval: all.filter((t) => t.status === 'review' && t.approvalRequired).map((t) => t.id),
        escalated: all.filter((t) => t.escalation).map((t) => ({ id: t.id, reason: t.escalation.reason })),
      };
    },

    /* ---------- agents ------------------------------------------------------ */

    listAgents: () => (agents ? agents.all() : []),
    getAgent: (id) => (agents ? agents.get(id) : null),
    setAgentStatus(id, agentStatus, { by = 'operator' } = {}) {
      if (!agents) return fail([{ path: 'agents', message: 'no agent registry is loaded' }]);
      try {
        const out = agents.setAgentStatus(id, agentStatus, { by });
        audit.write({ action: EVENTS.AGENT_DISABLED, actorType: 'human', actor: by, entityType: 'agent', entityId: id, to: agentStatus, at: clock() });
        return done(out);
      } catch (e) { return fail([{ path: 'agentId', message: e.message }]); }
    },
    /** The kill switch. One call, and no new work reaches any agent. */
    setKillSwitch(on, { by = 'operator' } = {}) {
      if (!agents) return fail([{ path: 'agents', message: 'no agent registry is loaded' }]);
      const out = agents.setKillSwitch(on, { by });
      audit.write({ action: 'agent.kill_switch', actorType: 'human', actor: by, entityType: 'system', entityId: 'agents', to: String(Boolean(on)), at: clock() });
      return done(out);
    },

    _runningFor: (agentId) => repo.tasks.find((t) => t.executorType === 'ai' && t.assignedTo === agentId
      && ['assigned', 'in_progress'].includes(t.status)).length,

    evaluateAgentEligibility({ taskId, agentId = null }, { by = 'system' } = {}) {
      if (!agents) return fail([{ path: 'agents', message: 'no agent registry is loaded' }]);
      const task = repo.tasks.get(taskId);
      if (!task) return fail([{ path: 'taskId', message: `no task ${taskId}` }]);
      const runningFor = api._runningFor;
      if (agentId) return done({ eligibility: agents.eligibility(task, agentId, { runningFor }) });
      const chosen = agents.select(task, { runningFor });
      return done({ agentId: chosen.agentId, considered: chosen.considered });
    },

    assignTaskToAgent(taskId, { agentId, by = 'operator' } = {}) {
      if (!agents) return fail([{ path: 'agents', message: 'no agent registry is loaded' }]);
      const task = repo.tasks.get(taskId);
      if (!task) return fail([{ path: 'taskId', message: `no task ${taskId}` }]);
      const e = agents.eligibility(task, agentId, { runningFor: api._runningFor });
      if (!e.eligible) return fail(e.reasons.map((r) => ({ path: 'eligibility', message: r })));
      task.assignedTo = agentId;
      task.executorType = 'ai';
      return api._moveTask(task, 'assigned', { by, actorType: 'human', event: EVENTS.TASK_ASSIGNED, agentId });
    },

    /** Hand the agent only what the task needs. */
    getTaskEnvelope(taskId, { agentId }) {
      if (!agents) return null;
      const task = repo.tasks.get(taskId);
      if (!task) return null;
      const project = repo.projects.get(task.projectId);
      const wi = allWorkflows(project).find((w) => w.id === task.workflowInstanceId);
      return agents.envelope(task, { project, workflowInstance: wi, agentId });
    },

    /** Default deny, checked before anything an agent asks for. */
    agentMay: (agentId, operation) => (agents ? agents.may(agentId, operation) : { allowed: false, reason: 'no agent registry' }),

    startAgentExecution(taskId, { agentId, by = null } = {}) {
      if (!agents) return fail([{ path: 'agents', message: 'no agent registry is loaded' }]);
      const permit = agents.may(agentId, 'startAgentExecution');
      if (!permit.allowed) return fail([{ path: 'permission', message: permit.reason }]);
      const task = repo.tasks.get(taskId);
      if (!task) return fail([{ path: 'taskId', message: `no task ${taskId}` }]);
      if (task.assignedTo !== agentId) return fail([{ path: 'assignment', message: `${agentId} is not the executor of this task` }]);
      const moved = api._moveTask(task, 'in_progress', { by: agentId, actorType: 'ai_agent', event: EVENTS.TASK_STARTED, agentId });
      if (!moved.ok) return moved;
      const t = repo.tasks.get(taskId);
      t.startedAt = t.startedAt || clock();
      const attempt = openAttempt(t, { executor: agentId, executorType: 'ai', agentId, at: clock() });
      repo.tasks.put(t);
      audit.write({ action: EVENTS.AGENT_EXECUTION_STARTED, actorType: 'ai_agent', actor: agentId, agentId, entityType: 'task', entityId: t.id, projectId: t.projectId, attemptId: attempt.number, at: clock() });
      return done({ task: t, envelope: api.getTaskEnvelope(taskId, { agentId }) });
    },

    /**
     * The agent hands back what it made. This SUBMITS FOR REVIEW — it does not
     * complete, approve, or pass QA. Output is validated first, and a
     * submission that does not satisfy the task is a failed attempt.
     */
    submitAgentOutput(taskId, { agentId, submission } = {}) {
      if (!agents) return fail([{ path: 'agents', message: 'no agent registry is loaded' }]);
      const permit = agents.may(agentId, 'submitAgentOutput');
      if (!permit.allowed) return fail([{ path: 'permission', message: permit.reason }]);
      const task = repo.tasks.get(taskId);
      if (!task) return fail([{ path: 'taskId', message: `no task ${taskId}` }]);
      if (task.assignedTo !== agentId) return fail([{ path: 'assignment', message: `${agentId} is not the executor of this task` }]);

      const valid = agents.validateOutput(task, submission);
      if (!valid.ok) {
        return api.reportTaskFailure(taskId, { agentId, failure: 'invalid-output', message: valid.problems.map((p) => `${p.path}: ${p.message}`).join('; ') });
      }
      for (const o of submission.outputs) api.recordOutput(taskId, { key: o.key, value: o.value, by: agentId, actorType: 'ai_agent' });
      const out = api.submitTaskForReview(taskId, { by: agentId, actorType: 'ai_agent', agentId });
      if (out.ok) {
        audit.write({ action: EVENTS.AGENT_EXECUTION_COMPLETED, actorType: 'ai_agent', actor: agentId, agentId, entityType: 'task', entityId: taskId, projectId: task.projectId, at: clock() });
      }
      return out;
    },

    reportTaskFailure(taskId, { agentId = null, failure, message } = {}) {
      const task = repo.tasks.get(taskId);
      if (!task) return fail([{ path: 'taskId', message: `no task ${taskId}` }]);
      closeAttempt(task, { result: 'failed', failureReason: `${failure}: ${message}`, at: clock() });
      repo.tasks.put(task);
      audit.write({ action: EVENTS.AGENT_EXECUTION_FAILED, actorType: agentId ? 'ai_agent' : 'system', actor: agentId || 'system', agentId, entityType: 'task', entityId: taskId, projectId: task.projectId, reason: `${failure}: ${message}`, at: clock() });
      record(task, EVENTS.AGENT_EXECUTION_FAILED, { at: clock(), by: agentId || 'system', data: { failure, message } });
      repo.tasks.put(task);
      if (api._automation) api._automation.dispatch(EVENTS.AGENT_EXECUTION_FAILED, { task: repo.tasks.get(taskId) }, { by: 'system' });
      return fail([{ path: 'execution', message: `${failure}: ${message}` }]);
    },

    validateTaskOutput(taskId, submission) {
      if (!agents) return { ok: false, problems: [{ path: 'agents', message: 'no agent registry is loaded' }] };
      const task = repo.tasks.get(taskId);
      if (!task) return { ok: false, problems: [{ path: 'taskId', message: `no task ${taskId}` }] };
      return agents.validateOutput(task, submission);
    },

    /* ---------- automation --------------------------------------------------- */

    triggerAutomation(eventName, context, { by = 'system' } = {}) {
      if (!api._automation) return fail([{ path: 'automation', message: 'no automation rules are loaded' }]);
      return done(api._automation.dispatch(eventName, context, { by }));
    },
    automationRules: () => (api._automation ? api._automation.rules() : []),

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

  /* THE AUTOMATION ENGINE IS WIRED LAST, and only to the domain operations it
     is allowed to call. It receives `api` rather than the stores, so a rule
     physically cannot reach past the validated write path — which is the
     guardrail, not a convention. */
  api._automation = automationRules
    ? createAutomation(automationRules, {
      operations: {
        refreshTaskReadiness: (args, ctx) => api.refreshTaskReadiness(args, ctx),
        reopenForRework: (args, ctx) => api.reopenForRework(args, ctx),
        escalateTask: (args, ctx) => api.escalateTask(args, ctx),
        evaluateAgentEligibility: (args, ctx) => api.evaluateAgentEligibility(args, ctx),
        blockTask: (args, ctx) => api.blockTask(args, ctx),
      },
      audit,
      now,
    })
    : null;

  return api;
}

export { EVENTS };
export { mockExecutor } from './agent.js';
export { AGENT_GRANTABLE, AGENT_FORBIDDEN } from './agent.js';
export { AUTOMATION_ALLOWED_ACTIONS } from './automation.js';
export { findCycle } from './task-generator.js';
export { taskKey, taskId } from './task.js';
export { memoryStore, jsonFileStore, repositories } from './repository.js';
export { createCatalogue } from './catalogue-read.js';
export { createStatus } from './status.js';
export { allWorkflows, workflowFor, pipelineFor } from './project.js';
