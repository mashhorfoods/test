/* =============================================================================
   TASK-TEST
   Phase 3: task engine, automation and the agent contract, against the real
   catalogue and the real Phase 2 domain layer.

   WHY THE REAL EVERYTHING. The whole claim of this layer is that it invents no
   business rule — stage order comes from the workflow, dependencies from the
   feature's own `requires`, quantity from the order. A test with a fake
   catalogue would prove none of that. So it builds a real order from a real
   builder payload, converts it, and generates tasks from what comes out.

   The only fakes are the clock, the randomness, and a deterministic mock
   executor that stands in for an agent nobody has connected yet. The mock is
   labelled `isMock` and is never on a production path.

   Run:  node tools/task-test.mjs
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOperations, memoryStore, mockExecutor, AGENT_FORBIDDEN, findCycle } from '../src/operations/index.js';
import { createCatalogue } from '../src/operations/catalogue-read.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const CATALOGUE = read('catalogue/catalogue.json');
const CATALOGUE_AT_LOAD = JSON.stringify(CATALOGUE);
const STATUSES = read('src/data/operations/statuses.json');
const EXECUTION = read('src/data/operations/execution.json');
const AUTOMATION = read('src/data/operations/automation.json');
const AGENTS = read('src/data/operations/agents.json');
const CAT = createCatalogue(CATALOGUE);

/** A source file with its comments removed — the code, not the explanation. */
const stripped = (file) => fs.readFileSync(path.join(ROOT, 'src/operations', file), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const fails = [];
let passed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) passed += 1;
  else fails.push(`${label}${detail ? ` — ${detail}` : ''}`);
};
const group = (n) => { if (process.env.VERBOSE) console.log(`\n--- ${n}`); };

function fixtures() {
  let t = Date.parse('2026-09-08T09:00:00Z');
  let seed = 7;
  return {
    now: () => new Date((t += 1000)),
    random: () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; },
  };
}

function ops(extra = {}) {
  return createOperations({
    catalogue: CATALOGUE, statuses: STATUSES, execution: EXECUTION,
    automationRules: structuredClone(AUTOMATION), agentRegistry: structuredClone(AGENTS),
    stores: { clients: memoryStore(), orders: memoryStore(), projects: memoryStore(), tasks: memoryStore(), audit: memoryStore() },
    ...fixtures(), ...extra,
  });
}

/* --- payload fixtures, in the builder's own shape -------------------------- */
function payload(lines, { scope = null, currency = 'USD' } = {}) {
  const byService = new Map();
  let once = 0; let monthly = 0;
  const addons = [];
  for (const line of lines) {
    const f = CAT.feature(line.featureId);
    const p = f.pricing;
    const svc = f.service;
    const qty = line.quantity ?? 1;
    const factor = line.tier ? ((f.tiers.levels.find((l) => l.id === line.tier) || {}).priceFactor || 1) : 1;
    const isPart = Boolean(line.partOf);
    const unit = ['included', 'quote'].includes(p.type) ? 0 : Math.round(p.from * factor);
    const amount = isPart || ['included', 'quote'].includes(p.type) ? 0 : unit * qty;
    const billing = p.period === 'monthly' ? 'monthly' : 'once';
    if (amount > 0) { if (billing === 'monthly') monthly += amount; else once += amount; }
    const e = { featureId: line.featureId, serviceId: svc, quantity: qty, origin: line.origin || (isPart ? 'part' : 'chosen'),
      pricing: { type: isPart ? 'part' : p.type, billing, unitAmount: unit, amount } };
    if (line.tier) e.tier = line.tier;
    if (line.partOf) e.partOf = line.partOf;
    if (f.composedOf) e.composedOf = [...f.composedOf];
    if (f.addonGroup) { e.addonGroup = f.addonGroup; addons.push({ featureId: line.featureId, serviceId: svc, addonGroup: f.addonGroup, quantity: qty, amount }); }
    if (!byService.has(svc)) byService.set(svc, []);
    byService.get(svc).push(e);
  }
  const out = {
    version: '1.0', source: 'pixora.package-builder', currency, language: 'en',
    services: [...byService.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([serviceId, features]) => ({ serviceId, features: features.sort((a, b) => (a.featureId < b.featureId ? -1 : 1)) })),
    addons: addons.sort((a, b) => (a.featureId < b.featureId ? -1 : 1)), packages: [],
    pricing: { currency, subtotal: { oneTime: once, monthly }, discount: { oneTime: 0, monthly: 0 },
      total: { oneTime: once, monthly }, quotedItems: 0, lineItems: lines.filter((l) => !l.partOf).length },
    message: 'Hi Pixora — …',
  };
  if (scope) out.scope = scope;
  return out;
}

const CLIENT = { name: 'Test Co', email: 'test@example.test', phone: '+249900000001' };

/** Order -> project -> tasks, in one call. */
function journey(lines, opts = {}, o = ops()) {
  const { client } = o.resolveClient(CLIENT);
  const made = o.createOrder(payload(lines, opts), { clientId: client.id });
  if (!made.ok) throw new Error(`fixture will not validate: ${JSON.stringify(made.problems)}`);
  o.submitOrder(made.order.id); o.reviewOrder(made.order.id); o.approveOrder(made.order.id);
  const project = o.convertOrderToProject(made.order.id).project;
  const gen = o.generateTasksFromWorkflow(project.id);
  if (!gen.ok) throw new Error(`generation failed: ${JSON.stringify(gen.problems)}`);
  return { o, client, order: o.getOrder(made.order.id), project: o.getProject(project.id), gen };
}


/**
 * Drive one task from wherever it is to completed, as a person would.
 *
 * NOTE THE `approved` STEP IS UNCONDITIONAL. `review -> completed` is not a
 * declared transition for ANY task: every one passes through `approved`, and
 * `approvalRequired` decides only whether a PERSON has to be the one who does
 * it. The first version of this helper skipped the step for tasks that needed
 * no human sign-off and every downstream task then sat pending — the state
 * machine was right and the helper was wrong.
 */
function finish(o, taskId, { by = 'operator-1', executor = 'worker-1' } = {}) {
  let t = o.getTask(taskId);
  if (t.status === 'completed') return t;
  if (t.status === 'pending' || t.status === 'blocked') o.refreshTaskReadiness({ projectId: t.projectId });
  t = o.getTask(taskId);
  if (t.status === 'ready') o.assignTask(taskId, { assignee: executor });
  if (o.getTask(taskId).status === 'assigned') o.startTask(taskId);
  t = o.getTask(taskId);
  if (t.status !== 'in_progress') return t;
  for (const out of t.outputs) if (!out.produced) o.recordOutput(taskId, { key: out.key, value: `value for ${out.key}` });
  o.submitTaskForReview(taskId);
  o.passAllQa(taskId, { by });
  o.approveTask(taskId, { by });
  o.completeTask(taskId);
  return o.getTask(taskId);
}

/**
 * Complete everything a task waits on, depth first.
 * Every agent-executable stage sits partway down a chain — that is what a
 * workflow IS — so a test that wants to reach one has to walk there, which
 * exercises the dependency engine on the way.
 */
function clearDependencies(o, taskId, seen = new Set()) {
  const t = o.getTask(taskId);
  for (const dep of t.dependencies) {
    if (seen.has(dep)) continue;
    seen.add(dep);
    clearDependencies(o, dep, seen);
    if (o.getTask(dep).status !== 'completed') finish(o, dep);
  }
  o.refreshTaskReadiness({ projectId: t.projectId });
  return o.getTask(taskId);
}

/** Supply every required input, as an operator or an upstream hand-off would. */
function satisfyInputs(o, taskId, by = 'operator-1') {
  for (const i of o.getTask(taskId).inputs) {
    if (i.required && !i.satisfied) o.provideInput(taskId, { key: i.key, value: `supplied ${i.key}`, by });
  }
  return o.getTask(taskId);
}

/** The first task in a project that a given agent could actually execute. */
function taskForAgent(o, project, agentId) {
  const agent = o.getAgent(agentId);
  return o.getTasks({ projectId: project.id })
    .filter((t) => t.aiEligible && t.requiredCapabilities.length
      && t.requiredCapabilities.every((c) => agent.capabilities.includes(c)))
    .sort((a, b) => a.order - b.order)[0] || null;
}

/* ========================================================================== */
/* A — task generation                                                         */
group('A — generation');
{
  const { o, project, gen } = journey([{ featureId: 'feat.branding.logo' }]);
  const tasks = o.getTasks({ projectId: project.id });
  ok('A: tasks were generated', tasks.length > 0, `${tasks.length}`);
  const wf = CAT.workflow(CAT.workflowFor('feat.branding.logo'));
  ok('A: one per workflow stage', tasks.length === wf.stages.length, `${tasks.length} vs ${wf.stages.length} stages`);
  ok('A: every stage is represented',
    wf.stages.every((s) => tasks.some((t) => t.stageId === s.stage_id)));
  const first = tasks.find((t) => t.stageId === wf.stages[0].stage_id);
  ok('A: a task carries its whole chain', Boolean(first.projectId && first.pipelineInstanceId
    && first.workflowInstanceId && first.serviceId && first.featureId && first.stageId && first.workflowId));
  ok('A: it carries the title from the stage objective', first.title === wf.stages[0].objective);
  ok('A: it carries the owning role', first.ownerRole === wf.stages[0].owner.id);
  ok('A: and the duration', JSON.stringify(first.duration) === JSON.stringify(wf.stages[0].duration));
  ok('A: with capabilities derived from the role', first.requiredCapabilities.length > 0);
  ok('A: expected outputs are structured, not prose',
    first.outputs.every((x) => x.key && x.type && typeof x.required === 'boolean'));
  ok('A: QA criteria are structured', first.qaCriteria.every((q) => q.id && q.validationMode));
  ok('A: the id is ASCII and language-neutral', tasks.every((t) => /^[\x20-\x7e]+$/.test(t.id)));
  ok('A: the id is derived from the workflow instance and stage',
    tasks.every((t) => t.key === `${t.workflowInstanceId}::${t.stageId}`));
  ok('A: a composite generates no tasks of its own — its parts do',
    o.templates.forFeature('feat.websites.extra_landing').length === 0);
  ok('A: the audit recorded every creation',
    o.audit.all().filter((e) => e.action === 'task.created').length === tasks.length);
}

/* B — idempotency                                                             */
group('B — idempotency');
{
  const { o, project } = journey([{ featureId: 'feat.branding.logo' }, { featureId: 'feat.websites.uiux' }]);
  const first = o.getTasks({ projectId: project.id }).length;
  const second = o.generateTasksFromWorkflow(project.id);
  const third = o.generateTasksFromWorkflow(project.id);
  ok('B: the second run creates nothing', second.created.length === 0, `${second.created.length}`);
  ok('B: the third run creates nothing', third.created.length === 0);
  ok('B: the count is unchanged', o.getTasks({ projectId: project.id }).length === first, `${first} then ${o.getTasks({ projectId: project.id }).length}`);
  const ids = o.getTasks({ projectId: project.id }).map((t) => t.id);
  ok('B: no duplicate ids', new Set(ids).size === ids.length);
  const keys = o.getTasks({ projectId: project.id }).map((t) => t.key);
  ok('B: no duplicate keys', new Set(keys).size === keys.length);
}

/* C/D — dependencies                                                          */
group('C/D — dependencies');
{
  const { o, project } = journey([{ featureId: 'feat.branding.logo' }]);
  const tasks = o.getTasks({ projectId: project.id }).sort((a, b) => a.order - b.order);
  const [first, second, third] = tasks;
  ok('C: the first task is ready', first.status === 'ready', first.status);
  ok('C: the second is pending on the first', second.status === 'pending' && second.dependencies.includes(first.id));
  ok('C: its readiness explains why not', /waiting on/.test(o.checkTaskReadiness(second.id).readiness.reason || ''),
    o.checkTaskReadiness(second.id).readiness.reason);
  ok('C: the dependency is recorded both ways', first.dependents.includes(second.id));

  o.assignTask(first.id, { assignee: 'someone' });
  o.startTask(first.id);
  for (const out of first.outputs) o.recordOutput(first.id, { key: out.key, value: 'done' });
  o.submitTaskForReview(first.id);
  o.passAllQa(first.id, { by: 'reviewer' });
  o.approveTask(first.id, { by: 'reviewer' });
  const completed = o.completeTask(first.id);
  ok('D: the first completes', completed.ok, JSON.stringify(completed.problems));
  ok('D: the second is now ready', o.getTask(second.id).status === 'ready', o.getTask(second.id).status);
  ok('D: the third is still pending', o.getTask(third.id).status === 'pending');
  ok('D: automation did the releasing',
    o.audit.all().some((e) => e.action === 'automation.triggered' && e.ruleId === 'auto.unblock-next'));
}

/* E — state transitions                                                       */
group('E — transitions');
{
  const { o, project } = journey([{ featureId: 'feat.branding.logo' }]);
  const t = o.getTasks({ projectId: project.id }).find((x) => x.status === 'ready');
  ok('E: cannot start without an executor', o.startTask(t.id).ok === false);
  ok('E: cannot be assigned to nobody', o.assignTask(t.id, { assignee: null }).ok === false);
  ok('E: an executor type the task forbids is refused',
    o.assignTask(t.id, { assignee: 'x', executorType: 'robot' }).ok === false);
  ok('E: assignment works', o.assignTask(t.id, { assignee: 'designer-1' }).ok);
  ok('E: start works', o.startTask(t.id).ok);
  ok('E: cannot jump straight to completed', o.completeTask(t.id).ok === false);
  ok('E: cannot submit for review with no output', o.submitTaskForReview(t.id).ok === false,
    JSON.stringify(o.submitTaskForReview(t.id).problems));
  ok('E: an undeclared move is refused', o.approveTask(t.id, { by: 'someone' }).ok === false);
  ok('E: a cancelled task does not come back', (() => {
    const c = o.cancelTask(t.id, { reason: 'no longer needed' });
    return c.ok && o.startTask(t.id).ok === false;
  })());
}

/* F/G — approval and rejection                                                */
group('F/G — approval and rework');
{
  const { o, project } = journey([{ featureId: 'feat.branding.logo' }]);
  const t = o.getTasks({ projectId: project.id }).sort((a, b) => a.order - b.order)[0];
  ok('F: this task requires approval', t.approvalRequired === true);
  o.assignTask(t.id, { assignee: 'designer-1' });
  o.startTask(t.id);
  for (const out of t.outputs) o.recordOutput(t.id, { key: out.key, value: 'v1' });
  o.submitTaskForReview(t.id);
  ok('F: QA must pass before approval', o.approveTask(t.id, { by: 'director' }).ok === false);
  o.passAllQa(t.id, { by: 'director' });
  ok('F: an approver who is not a person is refused',
    o.approveTask(t.id, { by: 'agent.x', actorType: 'ai_agent' }).ok === false);
  ok('F: the executor cannot approve their own work',
    o.approveTask(t.id, { by: 'designer-1' }).ok === false);
  ok('F: a different person can', o.approveTask(t.id, { by: 'director' }).ok);
  ok('F: approval is recorded', o.getTask(t.id).approvedBy === 'director' && Boolean(o.getTask(t.id).approvedAt));
  ok('F: and only then can it complete', o.completeTask(t.id).ok);

  /* rejection and rework */
  const t2 = o.getTasks({ projectId: project.id }).find((x) => x.status === 'ready');
  o.assignTask(t2.id, { assignee: 'designer-1' });
  o.startTask(t2.id);
  for (const out of t2.outputs) o.recordOutput(t2.id, { key: out.key, value: 'v1' });
  o.submitTaskForReview(t2.id);
  ok('G: a rejection must say why', o.rejectTask(t2.id, {}).ok === false);
  const rej = o.rejectTask(t2.id, { reason: 'the concepts are three colours of one idea', failedCriteria: [t2.qaCriteria[0].id] });
  ok('G: rejection works', rej.ok, JSON.stringify(rej.problems));
  const after = o.getTask(t2.id);
  ok('G: automation put it back to work', after.status === 'in_progress', after.status);
  ok('G: the reason survived', after.rejectionReason === 'the concepts are three colours of one idea');
  ok('G: the failed attempt is on the record',
    after.attempts.some((a) => a.result === 'rejected' && a.failureReason));
  ok('G: the previous output was kept as a version',
    after.outputs.some((o2) => (o2.previous || []).includes('v1')));
  ok('G: QA was reset for the new attempt', after.qaCriteria.every((c) => c.result === null));
}

/* H/L — quantity and page count                                               */
group('H/L — quantity and pages');
{
  const { o, project } = journey([
    { featureId: 'feat.social.post_design', quantity: 10 },
  ]);
  const tasks = o.getTasks({ projectId: project.id });
  ok('H: every task knows the purchased quantity', tasks.every((t) => t.quantity === 10),
    JSON.stringify(tasks.map((t) => t.quantity)));
  ok('H: quantity is a number, not a boolean', tasks.every((t) => typeof t.quantity === 'number'));

  const site = journey([
    { featureId: 'feat.websites.uiux' }, { featureId: 'feat.websites.development' },
    { featureId: 'feat.websites.extra_page', quantity: 9 },
  ], { scope: { pages: 10 } });
  const siteTasks = site.o.getTasks({ projectId: site.project.id });
  ok('L: the page count survives into every task', siteTasks.every((t) => t.pageCount === 10),
    JSON.stringify([...new Set(siteTasks.map((t) => t.pageCount))]));
  ok('L: the extra-page tasks carry the quantity',
    siteTasks.filter((t) => t.featureId === 'feat.websites.extra_page').every((t) => t.quantity === 9));
  ok('L: nothing hardcodes a page number', !stripped('task-generator.js').match(/\b(5|10)\s*(pages|;)/));
}

/* I — multi-service                                                           */
group('I — multi-service');
{
  const { o, project } = journey([
    { featureId: 'feat.branding.logo' }, { featureId: 'feat.websites.uiux' }, { featureId: 'feat.social.reels', quantity: 4 },
  ]);
  const tasks = o.getTasks({ projectId: project.id });
  const services = new Set(tasks.map((t) => t.serviceId));
  ok('I: tasks span all three services', services.size === 3, [...services].join());
  ok('I: each task names the right pipeline instance',
    tasks.every((t) => project.pipelines.some((p) => p.id === t.pipelineInstanceId && p.serviceId === t.serviceId)));
  ok('I: one project, three pipelines', project.pipelines.length === 3);
  ok('I: every service has at least one ready task',
    [...services].every((s) => tasks.some((t) => t.serviceId === s && t.status === 'ready')));
}

/* J/K — landing page                                                          */
group('J/K — landing page');
{
  const parts = CAT.partsOf('feat.websites.extra_landing');
  const { o, order, project } = journey([
    { featureId: 'feat.websites.extra_landing' },
    ...parts.map((p) => ({ featureId: p, partOf: 'feat.websites.extra_landing', origin: 'part' })),
  ]);
  ok('J: still charged once', order.pricing.total.oneTime === 120, JSON.stringify(order.pricing.total));
  const tasks = o.getTasks({ projectId: project.id });
  const byFeature = (f) => tasks.filter((t) => t.featureId === f).sort((a, b) => a.order - b.order);
  ok('J: all three parts have tasks', parts.every((p) => byFeature(p).length > 0),
    parts.map((p) => `${p}:${byFeature(p).length}`).join(' '));
  ok('J: the composite itself has none', byFeature('feat.websites.extra_landing').length === 0);
  const design = byFeature('feat.websites.landing_design');
  const build = byFeature('feat.websites.landing_build');
  const deploy = byFeature('feat.websites.landing_deploy');
  ok('J: development waits for design',
    build[0].dependencies.includes(design[design.length - 1].id), JSON.stringify(build[0].dependencies));
  ok('J: deployment waits for development',
    deploy[0].dependencies.includes(build[build.length - 1].id), JSON.stringify(deploy[0].dependencies));
  ok('J: only the design is ready at the start',
    tasks.filter((t) => t.status === 'ready').every((t) => t.featureId === 'feat.websites.landing_design'));

  /* K — deployment only */
  const only = journey([{ featureId: 'feat.websites.landing_deploy' }]);
  const onlyTasks = only.o.getTasks({ projectId: only.project.id });
  ok('K: deployment-only generates tasks', onlyTasks.length > 0);
  ok('K: and only for the deployment',
    new Set(onlyTasks.map((t) => t.featureId)).size === 1 && onlyTasks[0].featureId === 'feat.websites.landing_deploy');
  ok('K: no design task was invented', !onlyTasks.some((t) => t.featureId === 'feat.websites.landing_design'));
  ok('K: no development task was invented', !onlyTasks.some((t) => t.featureId === 'feat.websites.landing_build'));
  ok('K: its first task is ready with nothing to wait for',
    onlyTasks.sort((a, b) => a.order - b.order)[0].status === 'ready');
  ok('K: it still costs 20', only.order.pricing.total.oneTime === 20);
}

/* W — cross-workflow dependency                                               */
group('W — cross-workflow');
{
  const { o, project } = journey([{ featureId: 'feat.websites.uiux' }, { featureId: 'feat.websites.development' }]);
  const tasks = o.getTasks({ projectId: project.id });
  const dev = tasks.filter((t) => t.featureId === 'feat.websites.development').sort((a, b) => a.order - b.order);
  const design = tasks.filter((t) => t.featureId === 'feat.websites.uiux').sort((a, b) => a.order - b.order);
  ok('W: the catalogue says development requires the design',
    CAT.requires('feat.websites.development').includes('feat.websites.uiux'));
  ok('W: so the first development task waits for the last design task',
    dev[0].dependencies.includes(design[design.length - 1].id), JSON.stringify(dev[0].dependencies));
  ok('W: it is not ready yet', dev[0].status === 'pending');
  /* The comments in that file NAME the landing page, because explaining a rule
     means naming the case it came from. The CODE must not. */
  ok('W: the relationship is not hardcoded in the code',
    !stripped('task-generator.js').includes('feat.websites'));
}

/* M/N — automation                                                            */
group('M/N — automation');
{
  const { o, project } = journey([{ featureId: 'feat.branding.logo' }]);
  const t = o.getTasks({ projectId: project.id }).sort((a, b) => a.order - b.order)[0];
  const next = o.getTasks({ projectId: project.id }).sort((a, b) => a.order - b.order)[1];

  ok('M: rules are declared as data', o.automationRules().length === AUTOMATION.rules.length);
  ok('M: every rule names an allowed action',
    o.automationRules().every((r) => r.actions.every((a) => ['refreshTaskReadiness', 'reopenForRework', 'escalateTask', 'evaluateAgentEligibility', 'blockTask'].includes(a.operation))));

  o.assignTask(t.id, { assignee: 'designer-1' }); o.startTask(t.id);
  for (const out of t.outputs) o.recordOutput(t.id, { key: out.key, value: 'x' });
  o.submitTaskForReview(t.id); o.passAllQa(t.id, { by: 'director' });
  o.approveTask(t.id, { by: 'director' });
  o.completeTask(t.id);
  ok('M: completing fired the rule that releases the next task', o.getTask(next.id).status === 'ready');
  const fires = o.audit.all().filter((e) => e.action === 'automation.triggered' && e.ruleId === 'auto.unblock-next').length;

  /* N — the same event delivered again */
  const again = o.triggerAutomation('task.completed', { task: o.getTask(t.id) });
  ok('N: the redelivered event ran nothing', again.ok && again.fired.length === 0, JSON.stringify(again.fired));
  ok('N: it was skipped for the idempotency key',
    again.skipped.some((s) => s.rule === 'auto.unblock-next' && /already ran/.test(s.reason)));
  const after = o.audit.all().filter((e) => e.action === 'automation.triggered' && e.ruleId === 'auto.unblock-next').length;
  ok('N: and the audit did not double-count', after === fires, `${fires} then ${after}`);
  ok('N: the skip was itself recorded',
    o.audit.all().some((e) => e.action === 'automation.skipped'));
  ok('N: no task was duplicated', new Set(o.getTasks({ projectId: project.id }).map((x) => x.id)).size === o.getTasks({ projectId: project.id }).length);
  ok('N: automation cannot call anything outside its allowlist', (() => {
    try {
      createOperations({
        catalogue: CATALOGUE, statuses: STATUSES, execution: EXECUTION,
        automationRules: { version: 1, rules: [{ id: 'bad', enabled: true, trigger: { event: 'task.ready', entityType: 'task' },
          conditions: [], actions: [{ operation: 'completeTask', args: {} }], idempotencyKey: 'x', maxRuns: 1 }] },
        stores: { clients: memoryStore(), orders: memoryStore(), projects: memoryStore(), tasks: memoryStore(), audit: memoryStore() },
      });
      return false;
    } catch (e) { return /may not do/.test(e.message); }
  })());
}

/* O/P/U — agents: eligibility, permissions, kill switch                       */
group('O/P/U — agents');
{
  /* A copywriting agent matches a stage owned by role.copywriter. Those sit
     partway down a workflow, because that is where writing happens — so the
     order carries what the guidelines require and the test walks there. */
  const { o, project } = journey([
    { featureId: 'feat.branding.logo' },
    { featureId: 'feat.branding.color_system' },
    { featureId: 'feat.branding.type_system' },
    { featureId: 'feat.branding.guidelines_short' },
  ]);
  const t0 = taskForAgent(o, project, 'agent.draft-copywriter');
  ok('O: the project contains a task this agent could do', Boolean(t0), 'nothing required only cap.copywriting');
  clearDependencies(o, t0.id);
  const t = o.getTask(t0.id);
  ok('O: and the walk through its dependencies made it ready', t.status === 'ready', t.status);

  ok('O: agents ship paused, so nothing is assignable by default',
    AGENTS.agents.every((a) => a.status !== 'active'));
  const before = o.evaluateAgentEligibility({ taskId: t.id });
  ok('O: with everything paused, no agent is selected', before.agentId === null);
  ok('O: and every refusal says why', before.considered.every((c) => c.reasons.length > 0));

  o.setAgentStatus('agent.draft-copywriter', 'active');
  /* AN AGENT DOES NOT GET A TASK WHOSE INPUTS DO NOT EXIST. It would have
     nothing to work from and would invent something, which is the failure this
     check exists to prevent. */
  const short = o.evaluateAgentEligibility({ taskId: t.id, agentId: 'agent.draft-copywriter' });
  ok('O: an agent is refused while required inputs are missing', short.eligibility.eligible === false);
  ok('O: and the reason says so', short.eligibility.reasons.some((r) => /input/.test(r)), JSON.stringify(short.eligibility.reasons));
  satisfyInputs(o, t.id);

  const e = o.evaluateAgentEligibility({ taskId: t.id, agentId: 'agent.draft-copywriter' });
  ok('O: with its inputs present, an agent with the right capability qualifies', e.eligibility.eligible, JSON.stringify(e.eligibility.reasons));

  o.setAgentStatus('agent.reporting', 'active');
  const wrong = o.evaluateAgentEligibility({ taskId: t.id, agentId: 'agent.reporting' });
  ok('O: an agent without the capability does not', wrong.eligibility.eligible === false);
  ok('O: and the reason names the missing capability',
    wrong.eligibility.reasons.some((r) => /lacks cap\./.test(r)), JSON.stringify(wrong.eligibility.reasons));
  ok('O: selection picks the qualifying one',
    o.evaluateAgentEligibility({ taskId: t.id }).agentId === 'agent.draft-copywriter');

  ok('P: an operation not on the allowlist is denied',
    o.agentMay('agent.draft-copywriter', 'approveTask').allowed === false);
  ok('P: every forbidden operation is denied',
    [...AGENT_FORBIDDEN].every((op) => o.agentMay('agent.draft-copywriter', op).allowed === false));
  ok('P: a granted operation is allowed', o.agentMay('agent.draft-copywriter', 'submitAgentOutput').allowed);
  ok('P: an unknown agent is denied everything', o.agentMay('agent.nobody', 'getTask').allowed === false);
  ok('P: a registry granting a forbidden operation is refused at load', (() => {
    const bad = structuredClone(AGENTS);
    bad.agents[0].allowedOperations.push('approveTask');
    try {
      createOperations({ catalogue: CATALOGUE, statuses: STATUSES, execution: EXECUTION, agentRegistry: bad,
        stores: { clients: memoryStore(), orders: memoryStore(), projects: memoryStore(), tasks: memoryStore(), audit: memoryStore() } });
      return false;
    } catch (err) { return /may ever hold/.test(err.message); }
  })());
  ok('P: a registry claiming an undeclared capability is refused at load', (() => {
    const bad = structuredClone(AGENTS);
    bad.agents[0].capabilities.push('cap.telepathy');
    try {
      createOperations({ catalogue: CATALOGUE, statuses: STATUSES, execution: EXECUTION, agentRegistry: bad,
        stores: { clients: memoryStore(), orders: memoryStore(), projects: memoryStore(), tasks: memoryStore(), audit: memoryStore() } });
      return false;
    } catch (err) { return /not declared/.test(err.message); }
  })());

  o.setKillSwitch(true);
  const killed = o.evaluateAgentEligibility({ taskId: t.id, agentId: 'agent.draft-copywriter' });
  ok('U: the kill switch stops every agent', killed.eligibility.eligible === false);
  ok('U: and says so', killed.eligibility.reasons.some((r) => /switched off globally/.test(r)));
  ok('U: assignment is refused while it is on',
    o.assignTaskToAgent(t.id, { agentId: 'agent.draft-copywriter' }).ok === false);
  o.setKillSwitch(false);
  o.setAgentStatus('agent.draft-copywriter', 'disabled');
  ok('U: a disabled agent cannot be assigned',
    o.assignTaskToAgent(t.id, { agentId: 'agent.draft-copywriter' }).ok === false);
  ok('U: turning it off is on the record', o.audit.all().some((x) => x.entityType === 'agent'));
  ok('U: no history was deleted', o.audit.all().length > 0 && o.getTasks({ projectId: project.id }).length > 0);
}

/* Q/R — AI execution and output validation                                    */
group('Q/R — AI execution');
{
  const { o, project } = journey([
    { featureId: 'feat.branding.logo' },
    { featureId: 'feat.branding.color_system' },
    { featureId: 'feat.branding.type_system' },
    { featureId: 'feat.branding.guidelines_short' },
  ]);
  o.setAgentStatus('agent.draft-copywriter', 'active');
  const found = taskForAgent(o, project, 'agent.draft-copywriter');
  clearDependencies(o, found.id);
  satisfyInputs(o, found.id);
  const t = o.getTask(found.id);

  const assigned = o.assignTaskToAgent(t.id, { agentId: 'agent.draft-copywriter' });
  ok('Q: an eligible agent can be assigned', assigned.ok, JSON.stringify(assigned.problems));
  ok('Q: the executor type is recorded as ai', o.getTask(t.id).executorType === 'ai');
  const started = o.startAgentExecution(t.id, { agentId: 'agent.draft-copywriter' });
  ok('Q: execution starts and returns an envelope', started.ok && Boolean(started.envelope), JSON.stringify(started.problems));
  ok('Q: an agent that is not the executor cannot start it',
    o.startAgentExecution(t.id, { agentId: 'agent.reporting' }).ok === false);

  const env = started.envelope;
  ok('Q: the envelope carries the task, quantity and expected outputs',
    env.task.id === t.id && env.task.quantity === t.quantity && env.task.expectedOutputs.length > 0);
  ok('Q: it carries the QA criteria and the approval requirement',
    Array.isArray(env.task.qaCriteria) && typeof env.task.approvalRequired === 'boolean');
  ok('Q: it carries the allowed operations', env.allowedOperations.length > 0);
  ok('Q: it carries constraints and an escalation policy',
    env.constraints.length > 0 && Boolean(env.escalationPolicy.maxAttempts));
  const blob = JSON.stringify(env);
  ok('Q: it exposes no price', !/"amount"|"currency"|pricingSnapshot/.test(blob));
  ok('Q: it exposes no client identity', !/@|clientId|"Test Co"/.test(blob));
  ok('Q: it exposes no other task', (blob.match(/tsk\./g) || []).length === 1, `${(blob.match(/tsk\./g) || []).length}`);
  ok('Q: it exposes no other project', (blob.match(/prj\./g) || []).length === 1);

  const badSubmission = mockExecutor({ behaviour: 'malformed' }).execute(env);
  ok('Q: validation catches an output the task never asked for',
    o.validateTaskOutput(t.id, badSubmission).ok === false);
  ok('Q: and the submission is refused',
    o.submitAgentOutput(t.id, { agentId: 'agent.draft-copywriter', submission: badSubmission }).ok === false);
  ok('Q: the task did not move to review', o.getTask(t.id).status === 'in_progress', o.getTask(t.id).status);
  ok('Q: the failure is on the record', o.audit.all().some((x) => x.action === 'agent.execution.failed'));
  ok('Q: an empty submission is refused',
    o.submitAgentOutput(t.id, { agentId: 'agent.draft-copywriter', submission: mockExecutor({ behaviour: 'empty' }).execute(env) }).ok === false);
  ok('Q: a submission for the wrong number of units is refused',
    o.submitAgentOutput(t.id, { agentId: 'agent.draft-copywriter', submission: mockExecutor({ behaviour: 'wrong-quantity' }).execute(env) }).ok === false);
  ok('Q: an agent that is not the executor cannot submit',
    o.submitAgentOutput(t.id, { agentId: 'agent.reporting', submission: mockExecutor().execute(env) }).ok === false);

  const good = o.submitAgentOutput(t.id, { agentId: 'agent.draft-copywriter', submission: mockExecutor().execute(env) });
  ok('Q: a valid submission is accepted', good.ok, JSON.stringify(good.problems));
  ok('Q: it goes to REVIEW, not to completed', o.getTask(t.id).status === 'review', o.getTask(t.id).status);
  ok('Q: the mock is clearly labelled a mock', mockExecutor().isMock === true);

  o.passAllQa(t.id, { by: 'editor' });
  const task = o.getTask(t.id);
  if (task.approvalRequired) {
    ok('R: the agent cannot approve it',
      o.approveTask(t.id, { by: 'agent.draft-copywriter', actorType: 'ai_agent' }).ok === false);
    ok('R: nor can it complete it directly', o.completeTask(t.id).ok === false);
    ok('R: a person can approve it', o.approveTask(t.id, { by: 'editor' }).ok);
    ok('R: the approver is recorded', o.getTask(t.id).approvedBy === 'editor');
    ok('R: then it completes', o.completeTask(t.id).ok);
  } else {
    ok('R: with no approval required, QA still gates it', o.getTask(t.id).qaResult === 'passed');
    ok('R: it completes only after review', o.approveTask(t.id, { by: 'editor' }).ok && o.completeTask(t.id).ok);
  }
  ok('R: an agent may never call approveTask at all',
    o.agentMay('agent.draft-copywriter', 'approveTask').allowed === false);
}

/* S/T — retries and escalation                                                */
group('S/T — retry and escalation');
{
  const { o, project } = journey([{ featureId: 'feat.social.copywriting', quantity: 2 }]);
  const t = o.getTasks({ projectId: project.id }).find((x) => x.status === 'ready');
  const max = t.maxAttempts;
  ok('S: a maximum number of attempts is set', max >= 1);

  let escalated = false;
  const trace = [];
  for (let i = 0; i < max + 2; i += 1) {
    const cur = o.getTask(t.id);
    trace.push(`${i}:${cur.status}/${cur.attemptCount}${cur.escalation ? '/ESC' : ''}`);
    if (cur.escalation) { escalated = true; break; }
    if (cur.status === 'ready') o.assignTask(t.id, { assignee: 'writer-1' });
    if (o.getTask(t.id).status === 'assigned') o.startTask(t.id);
    if (o.getTask(t.id).status !== 'in_progress') break;
    for (const out of o.getTask(t.id).outputs) if (!out.produced) o.recordOutput(t.id, { key: out.key, value: `v${i}` });
    o.submitTaskForReview(t.id);
    o.rejectTask(t.id, { reason: `not good enough, round ${i + 1}` });
  }
  const end = o.getTask(t.id);
  ok('S: attempts were counted', end.attemptCount >= max, `${end.attemptCount} of ${max}`);
  ok('S: a task past its attempt limit cannot simply be retried',
    end.attemptCount >= max ? o.retryTask(t.id).ok === false : true);
  ok('T: it was escalated instead', Boolean(end.escalation) || escalated, `${JSON.stringify(end.escalation)} trace=${trace.join(' ')}`);
  ok('T: the escalation names a role to escalate to', Boolean((end.escalation || {}).to));
  ok('T: and an AI can no longer take it', end.aiEligible === false && !end.allowedExecutorTypes.includes('ai'));
  ok('T: the escalation is in the audit',
    o.audit.all().some((x) => x.action === 'task.escalated'));
  ok('T: every attempt is on the record with its reason',
    end.attempts.length >= max && end.attempts.filter((a) => a.result === 'rejected').every((a) => a.failureReason));
}

/* V/Y/X — audit, isolation, commercial protection                             */
group('V/Y/X — audit, isolation, commercial');
{
  const { o, order, project } = journey([{ featureId: 'feat.branding.logo' }]);
  const t = o.getTasks({ projectId: project.id }).sort((a, b) => a.order - b.order)[0];
  const orderBefore = JSON.stringify(o.getOrder(order.id));

  o.assignTask(t.id, { assignee: 'designer-1' });
  o.startTask(t.id);
  for (const out of t.outputs) o.recordOutput(t.id, { key: out.key, value: 'x' });
  o.submitTaskForReview(t.id);
  o.passAllQa(t.id, { by: 'director' });
  o.approveTask(t.id, { by: 'director' });
  o.completeTask(t.id);

  const trail = o.audit.forEntity(t.id);
  ok('V: the state changes are all in the audit', trail.length >= 5, `${trail.length} entries`);
  ok('V: each entry says who and what type of actor',
    trail.every((e) => e.actor && ['human', 'system', 'automation', 'ai_agent'].includes(e.actorType)));
  ok('V: each says from what and to what', trail.filter((e) => e.to).every((e) => e.entityId === t.id));
  ok('V: each is timestamped', trail.every((e) => /^\d{4}-\d{2}-\d{2}T/.test(e.at)));
  ok('V: and the project it belongs to', trail.every((e) => e.projectId === project.id));

  /* X — commercial data is untouched by execution */
  ok('X: the order snapshot is byte-identical after all of that',
    JSON.stringify(o.getOrder(order.id)) === orderBefore);
  ok('X: the catalogue is byte-identical', JSON.stringify(CATALOGUE) === CATALOGUE_AT_LOAD);
  ok('X: no domain operation can write to an order from the task layer',
    typeof o.setTaskOrderPrice !== 'function' && typeof o.updateOrderSnapshot !== 'function');

  /* Y — client isolation */
  const other = journey([{ featureId: 'feat.branding.logo' }], {}, o);
  const mine = o.getTasks({ projectId: project.id }).map((x) => x.id);
  const theirs = o.getTasks({ projectId: other.project.id }).map((x) => x.id);
  ok('Y: two projects have entirely separate tasks', mine.every((id) => !theirs.includes(id)));
  ok('Y: a filter by project returns only that project',
    o.getTasks({ projectId: other.project.id }).every((x) => x.projectId === other.project.id));
  ok('Y: an envelope names only its own project',
    (() => {
      o.setAgentStatus('agent.draft-copywriter', 'active');
      const env = o.getTaskEnvelope(theirs[0], { agentId: 'agent.draft-copywriter' });
      return env.project.id === other.project.id && !JSON.stringify(env).includes(project.id);
    })());
}

/* Progress rolls up                                                           */
group('progress');
{
  const { o, project } = journey([{ featureId: 'feat.websites.landing_deploy' }]);
  const tasks = o.getTasks({ projectId: project.id }).sort((a, b) => a.order - b.order);
  ok('progress: the project has not started', o.getProject(project.id).status === 'not_started');
  for (const t of tasks) {
    if (o.getTask(t.id).status !== 'ready') o.refreshTaskReadiness({ projectId: project.id });
    o.assignTask(t.id, { assignee: 'dev-1' });
    o.startTask(t.id);
    for (const out of o.getTask(t.id).outputs) o.recordOutput(t.id, { key: out.key, value: 'x' });
    o.submitTaskForReview(t.id);
    o.passAllQa(t.id, { by: 'lead' });
    o.approveTask(t.id, { by: 'lead' });
    o.completeTask(t.id);
  }
  const done_ = o.getProject(project.id);
  ok('progress: every task completed', o.getTasks({ projectId: project.id }).every((t) => t.status === 'completed'));
  ok('progress: the workflow instance completed', done_.pipelines[0].workflows.every((w) => w.status === 'completed'));
  ok('progress: the pipeline instance completed', done_.pipelines[0].status === 'completed');
  ok('progress: and so did the project', done_.status === 'completed', done_.status);
  const p = o.executionProgress(project.id);
  ok('progress: it is counted, not estimated', p.tasks.completed === p.tasks.total && p.tasks.total > 0);
}

/* ========================================================================== */
/* §62 — ARCHITECTURE AUDIT                                                    */
group('architecture audit');
{
  const { o, order, project } = journey([
    { featureId: 'feat.branding.logo' },
    { featureId: 'feat.websites.uiux' },
    { featureId: 'feat.websites.development' },
    { featureId: 'feat.websites.extra_page', quantity: 4 },
    { featureId: 'feat.social.post_design', quantity: 12 },
  ], { scope: { pages: 5 } });
  const tasks = o.getTasks({ projectId: project.id });
  const byId = new Map(tasks.map((t) => [t.id, t]));

  ok('audit: no orphan task — every one names a project that exists', tasks.every((t) => o.getProject(t.projectId)));
  ok('audit: every task names a pipeline instance that exists',
    tasks.every((t) => project.pipelines.some((p) => p.id === t.pipelineInstanceId)));
  ok('audit: every task names a workflow instance that exists',
    tasks.every((t) => project.pipelines.some((p) => p.workflows.some((w) => w.id === t.workflowInstanceId))));
  ok('audit: every task names a real feature', tasks.every((t) => CAT.feature(t.featureId)));
  ok('audit: every task names a real workflow', tasks.every((t) => CAT.workflow(t.workflowId)));
  ok('audit: every task names a stage its workflow actually has',
    tasks.every((t) => (CAT.workflow(t.workflowId).stages || []).some((s) => s.stage_id === t.stageId)));
  ok('audit: every task names a real pipeline stage', tasks.every((t) => !t.pipelineStageId || CAT.stage(t.pipelineStageId)));
  ok('audit: every task names an order that exists', tasks.every((t) => o.getOrder(t.orderId)));
  ok('audit: every task names a client that exists', tasks.every((t) => o.getClient(t.clientId)));
  ok('audit: no duplicate task ids', new Set(tasks.map((t) => t.id)).size === tasks.length);
  ok('audit: no duplicate task keys', new Set(tasks.map((t) => t.key)).size === tasks.length);
  ok('audit: every dependency points at a task in the same project',
    tasks.every((t) => t.dependencies.every((d) => byId.has(d))));
  ok('audit: no circular dependency', findCycle(tasks) === null, JSON.stringify(findCycle(tasks)));
  ok('audit: every task is in a declared state',
    tasks.every((t) => o.status.states('task').includes(t.status)));
  ok('audit: every task has an owning role', tasks.every((t) => t.ownerRole));
  ok('audit: every task has a duration', tasks.every((t) => t.duration && t.duration.value > 0));
  ok('audit: every task has at least one QA criterion', tasks.every((t) => t.qaCriteria.length > 0));
  ok('audit: every task says whether approval is required',
    tasks.every((t) => typeof t.approvalRequired === 'boolean'));
  ok('audit: every task declares at least one output', tasks.every((t) => t.outputs.length > 0));
  ok('audit: every task declares its inputs', tasks.every((t) => Array.isArray(t.inputs)));
  ok('audit: every task carries the purchased quantity', tasks.every((t) => Number.isInteger(t.quantity) && t.quantity >= 1));
  ok('audit: the page count survived', tasks.every((t) => t.pageCount === 5));
  ok('audit: every id is ASCII and language-neutral', tasks.every((t) => /^[\x20-\x7e]+$/.test(t.id)));
  ok('audit: no id was derived from display text',
    tasks.every((t) => !/[؀-ۿ]/.test(t.id) && !t.id.includes(' ')));
  ok('audit: no agent holds a forbidden operation',
    o.listAgents().every((a) => [...AGENT_FORBIDDEN].every((op) => !a.allowedOperations.includes(op))));
  ok('audit: every automation rule has an idempotency key',
    o.automationRules().every((r) => Boolean(r.idempotencyKey)));
  ok('audit: every automation rule has a run cap',
    o.automationRules().every((r) => Number.isInteger(r.maxRuns) && r.maxRuns >= 1));
  ok('audit: the order snapshot was not mutated by generation',
    o.getOrder(order.id).items.every((i) => typeof i.pricingSnapshot.amount === 'number'));
  ok('audit: the catalogue was not mutated', JSON.stringify(CATALOGUE) === CATALOGUE_AT_LOAD);
  ok('audit: state changes produced audit events', o.audit.all().length > 0);
  ok('audit: every audit entry names an actor type',
    o.audit.all().every((e) => ['human', 'system', 'automation', 'ai_agent'].includes(e.actorType)));

  /* Bilingual: internal ids stay neutral, customer-facing labels stay paired. */
  ok('audit: every task status has both languages',
    o.status.states('task').every((s) => {
      const l = o.status.label('task', s);
      return l && l.en && l.ar && /[؀-ۿ]/.test(l.ar);
    }));
  ok('audit: every capability is named in both languages',
    EXECUTION.capabilities.every((c) => c.name.en && c.name.ar && /[؀-ۿ]/.test(c.name.ar)));
  ok('audit: every agent is described in both languages',
    AGENTS.agents.every((a) => a.name.en && a.name.ar && a.description.en && a.description.ar));
  ok('audit: every automation rule is named in both languages',
    AUTOMATION.rules.every((r) => r.name.en && r.name.ar && /[؀-ۿ]/.test(r.name.ar)));

  /* No duplicated business logic, checked the same way Phase 2 checks it. */
  for (const file of ['task.js', 'task-generator.js', 'task-template.js', 'agent.js', 'automation.js', 'audit.js']) {
    const code = fs.readFileSync(path.join(ROOT, 'src/operations', file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const ids = [...code.matchAll(/'(svc|feat|pipe|wf|plat|cap)\.[a-z_.]+'/g)].map((m) => m[0]);
    ok(`audit: ${file} names no catalogue id`, ids.length === 0, ids.join(', '));
    const prices = [...code.matchAll(/(?<![\w.$])(\d{2,5})(?=\s*[;,)\]}])/g)].map((m) => m[1])
      .filter((n) => Number(n) >= 20 && Number(n) <= 2000);
    ok(`audit: ${file} holds no price literal`, prices.length === 0, prices.join(', '));
  }

  /* A cycle must be detected rather than shipped. */
  const cyclic = [
    { id: 'a', dependencies: ['c'] }, { id: 'b', dependencies: ['a'] }, { id: 'c', dependencies: ['b'] },
  ];
  const found = findCycle(cyclic);
  ok('audit: a cycle is detected', Array.isArray(found) && found.length >= 3, JSON.stringify(found));
  ok('audit: and it names the cycle rather than saying "there is one"', found.includes('a') && found.includes('b') && found.includes('c'));
}

/* Observability — §68                                                         */
group('observability');
{
  const { o, project } = journey([{ featureId: 'feat.branding.logo' }]);
  const tasks = o.getTasks({ projectId: project.id }).sort((a, b) => a.order - b.order);
  const e = o.explainTask(tasks[1].id);
  ok('why: it says which workflow and stage created it', /stage "/.test(e.why) && e.why.includes(tasks[1].workflowId));
  ok('why: it says whether it is ready', typeof e.ready === 'boolean');
  ok('why: it says what is in the way', Boolean(e.blockedBecause), e.blockedBecause);
  ok('why: it says who owns it', Boolean(e.owner.role));
  ok('why: it says what it still owes', Array.isArray(e.stillOwed));
  ok('why: it says whether QA passed', 'result' in e.qa);
  ok('why: it says whether a person must approve', typeof e.approval.required === 'boolean');
  ok('why: it lists the attempts', Array.isArray(e.attempts));
  ok('why: it carries the history', Array.isArray(e.history));
}

/* ========================================================================== */

if (fails.length) {
  console.error(`\ntask-test: ${passed} passed, ${fails.length} FAILED\n`);
  fails.forEach((f) => console.error(`  ✗ ${f}`));
  console.error('');
  process.exit(1);
}
console.log(`task-test: ${passed} passed, 0 failed`);
