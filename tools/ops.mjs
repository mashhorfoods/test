/* =============================================================================
   OPS — the operator's command line for orders, clients and projects.

   WHY A COMMAND LINE AND NOT A FORM.
   There is no backend (`docs/129` §1). A visitor's browser cannot write to this
   repository, and giving it credentials so it could would be the worst idea in
   the project. So the write path is the one that already exists for prices: a
   person, with a token, committing a file.

   This is that person's tool. It calls exactly the same domain functions an
   HTTP handler would — `createOperations()` from src/operations — so when a
   backend does arrive, the API implements the same eleven calls and this file
   keeps working or gets deleted, without the business logic moving.

   Everything it writes lands in operations/*.json, which is committed. `git log`
   is the audit trail nobody had to build.

     node tools/ops.mjs client add --name "Al Mada" --email ops@almada.example
     node tools/ops.mjs order create --payload scope.json --client cli.…
     node tools/ops.mjs order submit  ord.…
     node tools/ops.mjs order approve ord.…
     node tools/ops.mjs order convert ord.…
     node tools/ops.mjs project show  prj.…
     node tools/ops.mjs list orders
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOperations, jsonFileStore } from '../src/operations/index.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPS = path.join(ROOT, 'operations');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const ops = createOperations({
  catalogue: read('catalogue/catalogue.json'),
  statuses: read('src/data/operations/statuses.json'),
  /* Phase 3. The execution policy, the automation rules and the agent registry
     are data; without them this is exactly the Phase 2 tool. */
  execution: read('src/data/operations/execution.json'),
  automationRules: read('src/data/operations/automation.json'),
  agentRegistry: read('src/data/operations/agents.json'),
  stores: {
    clients: jsonFileStore(path.join(OPS, 'clients.json'), fs),
    orders: jsonFileStore(path.join(OPS, 'orders.json'), fs),
    projects: jsonFileStore(path.join(OPS, 'projects.json'), fs),
    tasks: jsonFileStore(path.join(OPS, 'tasks.json'), fs),
    audit: jsonFileStore(path.join(OPS, 'audit.json'), fs),
  },
});

/* ---------- arguments ------------------------------------------------------ */

const argv = process.argv.slice(2);
const [group, action, ...rest] = argv;
const positional = rest.filter((a) => !a.startsWith('--'));
const flags = {};
for (let i = 0; i < rest.length; i += 1) {
  if (!rest[i].startsWith('--')) continue;
  const key = rest[i].slice(2);
  const next = rest[i + 1];
  flags[key] = next && !next.startsWith('--') ? next : true;
}

const out = (v) => console.log(JSON.stringify(v, null, 2));
const die = (msg, code = 1) => { console.error(msg); process.exit(code); };
const problems = (r) => die(`\nrefused:\n${r.problems.map((p) => `  ${p.path}: ${p.message}`).join('\n')}\n`);

const USAGE = `
ops — orders, clients and projects

  client add        --name X [--email] [--phone] [--company] [--lang en|ar] [--source]
  client find       [--email] [--phone] [--name]
  client show       <clientId>
  client dossier    <clientId>

  order  create     --payload <file.json> [--client <clientId>]
  order  assign     <orderId> <clientId>
  order  submit     <orderId>
  order  review     <orderId>
  order  approve    <orderId>
  order  reject     <orderId> --reason "..."
  order  cancel     <orderId> [--reason "..."]
  order  convert    <orderId>          (idempotent)
  order  show       <orderId>
  order  summary    <orderId> [--lang en|ar]

  project show      <projectId>
  project pipelines <projectId>
  project progress  <projectId>
  project status    <projectId> <state> [--reason "..."]
  project tasks     <projectId>          (generate — idempotent)

  task   list       [--project <id>] [--status <s>] [--service <id>]
  task   show       <taskId>
  task   why        <taskId>             (why it exists, what is in its way)
  task   assign     <taskId> <assignee> [--type human|ai]
  task   start      <taskId>
  task   input      <taskId> --key K --value V
  task   need       <taskId> --reason "..."
  task   output     <taskId> --key K --value V
  task   submit     <taskId>
  task   qa         <taskId> --criterion ID --result passed|failed [--by X]
  task   qa-all     <taskId> [--by X]
  task   approve    <taskId> --by X
  task   complete   <taskId>
  task   reject     <taskId> --reason "..."
  task   retry      <taskId>
  task   block      <taskId> --reason "..."
  task   unblock    <taskId>
  task   cancel     <taskId> [--reason "..."]

  agent  list
  agent  status     <agentId> active|paused|disabled
  agent  eligible   <taskId> [--agent <agentId>]
  agent  kill       on|off

  audit  list       [--project <id>] [--entity <id>] [--actor human|system|automation|ai_agent]
  rules  list

  list   clients | orders | projects
  states order | project | pipelineInstance | workflowInstance
`;

if (!group) die(USAGE, 0);

/* ---------- commands -------------------------------------------------------- */

const commands = {
  client: {
    add() {
      const r = ops.createClient({
        name: flags.name, email: flags.email, phone: flags.phone,
        company: flags.company, preferredLanguage: flags.lang, source: flags.source,
      });
      return r.ok ? out(r.client) : problems(r);
    },
    find() { out(ops.matchClient({ email: flags.email, phone: flags.phone, name: flags.name })); },
    show() { out(ops.getClient(positional[0]) || die(`no client ${positional[0]}`)); },
    dossier() { out(ops.clientDossier(positional[0]) || die(`no client ${positional[0]}`)); },
  },

  order: {
    create() {
      if (!flags.payload) die('order create needs --payload <file.json> — the builder payload, not a message');
      const payload = JSON.parse(fs.readFileSync(flags.payload, 'utf8'));
      const r = ops.createOrder(payload, { clientId: flags.client || null });
      return r.ok ? out(r.order) : problems(r);
    },
    assign() { const r = ops.assignOrderToClient(positional[0], positional[1]); return r.ok ? out(r.order) : problems(r); },
    submit() { const r = ops.submitOrder(positional[0], { by: 'operator' }); return r.ok ? out(r.order) : problems(r); },
    review() { const r = ops.reviewOrder(positional[0]); return r.ok ? out(r.order) : problems(r); },
    approve() { const r = ops.approveOrder(positional[0]); return r.ok ? out(r.order) : problems(r); },
    reject() { const r = ops.rejectOrder(positional[0], { reason: flags.reason }); return r.ok ? out(r.order) : problems(r); },
    cancel() { const r = ops.cancelOrder(positional[0], { reason: flags.reason || null }); return r.ok ? out(r.order) : problems(r); },
    convert() {
      const r = ops.convertOrderToProject(positional[0]);
      if (!r.ok) return problems(r);
      console.error(r.created ? 'project created' : `no change — ${r.reason}`);
      return out(r.project);
    },
    show() { out(ops.getOrder(positional[0]) || die(`no order ${positional[0]}`)); },
    summary() { out(ops.orderSummary(positional[0], flags.lang === 'ar' ? 'ar' : 'en') || die(`no order ${positional[0]}`)); },
  },

  project: {
    show() { out(ops.getProject(positional[0]) || die(`no project ${positional[0]}`)); },
    tasks() {
      const r = ops.generateTasksFromWorkflow(positional[0]);
      if (!r.ok) return problems(r);
      console.error(`${r.created.length} created, ${r.existing} already existed`);
      return out(r.tasks.map((t) => ({ id: t.id, feature: t.featureId, stage: t.stageId, status: t.status, deps: t.dependencies.length })));
    },
    pipelines() { out(ops.getProjectPipelines(positional[0]) || die(`no project ${positional[0]}`)); },
    progress() { out(ops.projectProgress(positional[0]) || die(`no project ${positional[0]}`)); },
    status() {
      const r = ops.setProjectStatus(positional[0], positional[1], { reason: flags.reason || null });
      return r.ok ? out(r.project) : problems(r);
    },
  },

  task: {
    list() {
      const filter = {};
      if (flags.project) filter.projectId = flags.project;
      if (flags.status) filter.status = flags.status;
      if (flags.service) filter.serviceId = flags.service;
      out(ops.getTasks(filter).map((t) => ({
        id: t.id, status: t.status, feature: t.featureId, stage: t.stageId,
        owner: t.ownerRole, assignedTo: t.assignedTo, executor: t.executorType,
        quantity: t.quantity, approval: t.approvalRequired, ai: t.aiEligible,
        blocked: t.blockedReason, waitingOn: t.dependencies.length,
      })));
    },
    show() { out(ops.getTask(positional[0]) || die(`no task ${positional[0]}`)); },
    why() { out(ops.explainTask(positional[0]) || die(`no task ${positional[0]}`)); },
    assign() {
      const r = ops.assignTask(positional[0], { assignee: positional[1], executorType: flags.type || 'human' });
      return r.ok ? out(r.task) : problems(r);
    },
    start() { const r = ops.startTask(positional[0]); return r.ok ? out(r.task) : problems(r); },
    input() { const r = ops.provideInput(positional[0], { key: flags.key, value: flags.value }); return r.ok ? out(r.task) : problems(r); },
    need() { const r = ops.requestInput(positional[0], { reason: flags.reason }); return r.ok ? out(r.task) : problems(r); },
    output() { const r = ops.recordOutput(positional[0], { key: flags.key, value: flags.value }); return r.ok ? out(r.task) : problems(r); },
    submit() { const r = ops.submitTaskForReview(positional[0]); return r.ok ? out(r.task) : problems(r); },
    qa() {
      const r = ops.judgeQa(positional[0], { criterionId: flags.criterion, result: flags.result, by: flags.by || 'operator' });
      return r.ok ? out(r.task.qaCriteria) : problems(r);
    },
    'qa-all'() { const r = ops.passAllQa(positional[0], { by: flags.by || 'operator' }); return r.ok ? out(r.task.qaCriteria) : problems(r); },
    approve() {
      if (!flags.by) die('approve needs --by "who" — an approval nobody signed is not one');
      const r = ops.approveTask(positional[0], { by: flags.by });
      return r.ok ? out(r.task) : problems(r);
    },
    complete() { const r = ops.completeTask(positional[0]); return r.ok ? out(r.task) : problems(r); },
    reject() { const r = ops.rejectTask(positional[0], { reason: flags.reason }); return r.ok ? out(r.task) : problems(r); },
    retry() { const r = ops.retryTask(positional[0]); return r.ok ? out(r.task) : problems(r); },
    block() { const r = ops.blockTask({ taskId: positional[0], reason: flags.reason }); return r.ok ? out(r.task) : problems(r); },
    unblock() { const r = ops.unblockTask(positional[0]); return r.ok ? out(r.task) : problems(r); },
    cancel() { const r = ops.cancelTask(positional[0], { reason: flags.reason || null }); return r.ok ? out(r.task) : problems(r); },
  },

  agent: {
    list() {
      out(ops.listAgents().map((a) => ({
        id: a.id, name: a.name.en, status: a.status, capabilities: a.capabilities,
        allowedOperations: a.allowedOperations, maxConcurrent: a.maxConcurrentTasks,
        integration: (a.metadata || {}).integration,
      })));
    },
    status() { const r = ops.setAgentStatus(positional[0], positional[1]); return r.ok ? out(r.agent) : problems(r); },
    eligible() { const r = ops.evaluateAgentEligibility({ taskId: positional[0], agentId: flags.agent || null }); return r.ok ? out(r) : problems(r); },
    kill() { const r = ops.setKillSwitch(positional[0] === 'on'); return r.ok ? out(r) : problems(r); },
  },

  audit: {
    list() {
      let rows = ops.audit.all();
      if (flags.project) rows = rows.filter((e) => e.projectId === flags.project);
      if (flags.entity) rows = rows.filter((e) => e.entityId === flags.entity);
      if (flags.actor) rows = rows.filter((e) => e.actorType === flags.actor);
      out(rows.map((e) => ({ at: e.at, actor: `${e.actorType}:${e.actor}`, action: e.action, entity: e.entityId, from: e.from, to: e.to, reason: e.reason, rule: e.ruleId })));
    },
  },

  rules: {
    list() {
      out(ops.automationRules().map((r) => ({
        id: r.id, name: r.name.en, enabled: r.enabled, on: r.trigger.event,
        does: r.actions.map((a) => a.operation), maxRuns: r.maxRuns,
      })));
    },
  },

  list: {
    clients() { out(ops.listClients().map((c) => ({ id: c.id, name: c.name, email: c.email, createdAt: c.createdAt }))); },
    orders() {
      out(ops.listOrders().map((o) => ({
        id: o.id, status: o.status, client: o.clientId, project: o.projectId,
        total: o.pricing.total, currency: o.pricing.currency, services: o.scope.services, createdAt: o.createdAt,
      })));
    },
    projects() {
      out(ops.listProjects().map((p) => ({
        id: p.id, name: p.name, status: p.status, order: p.orderId, client: p.clientId,
        services: p.services, progress: ops.projectProgress(p.id), execution: ops.executionProgress(p.id),
      })));
    },
    tasks() { commands.task.list(); },
  },

  states: {
    _default(name) {
      out(ops.status.states(name).map((s) => ({
        state: s, label: ops.status.label(name, s), terminal: ops.status.isTerminal(name, s),
      })));
    },
  },
};

if (group === 'states') {
  const name = action || 'order';
  try { commands.states._default(name); } catch (e) { die(e.message); }
} else {
  const g = commands[group];
  if (!g) die(`unknown group "${group}"\n${USAGE}`);
  const fn = g[action];
  if (!fn) die(`unknown command "${group} ${action}"\n${USAGE}`);
  try { fn(); } catch (e) { die(`\n${e.message}\n`); }
}
