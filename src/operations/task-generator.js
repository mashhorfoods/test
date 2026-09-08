/**
 * TASK-GENERATOR — workflow instances in, task instances out.
 *
 * DETERMINISTIC AND IDEMPOTENT, which are two claims and not one.
 *
 * Deterministic: the same project and the same catalogue produce the same
 * tasks, with the same ids, in the same order — because a task's identity is
 * `workflowInstanceId::stageId` and its content is derived, never invented.
 *
 * Idempotent: running it again finds every one of those keys already present
 * and creates nothing. That is the property that matters when an automation
 * rule, a retried webhook or an agent calls it twice, which they will.
 *
 * WHAT IT REFUSES TO DECIDE. It invents no business rule. Stage order comes
 * from the workflow's own `next_stage` chain. Cross-workflow dependencies come
 * from the feature's own `requires` edges and a composite's own `composedOf`
 * order. Quantity, page count, tier and origin come from the ORDER by way of
 * the workflow instance. If a relationship is not in the data, it is not here.
 */

import { createTask, taskKey, checkReadiness } from './task.js';
import { EVENTS, record } from './events.js';

/**
 * Generate the tasks for one project.
 *
 * Returns { created, existing, tasks } — `created` is what this run added, so a
 * caller can tell "nothing to do" from "did nothing".
 */
export function generateTasksForProject(project, {
  catalogue, templates, tasks, status, at = new Date().toISOString(), by = 'system',
}) {
  if (!project) throw new Error('task-generator: no project');

  const existingForProject = tasks.find((t) => t.projectId === project.id);
  const byKey = new Map(existingForProject.map((t) => [t.key, t]));

  const created = [];
  /* workflowInstanceId -> the tasks it produced, in stage order. Used to wire
     both the within-workflow chain and the cross-workflow edges below. */
  const perWorkflow = new Map();

  for (const pipeline of project.pipelines) {
    for (const wi of pipeline.workflows) {
      const list = templates.forFeature(wi.featureId);
      const mine = [];
      for (const template of list) {
        const key = taskKey(wi.id, template.stageId);
        const already = byKey.get(key);
        if (already) { mine.push(already); continue; }
        const task = createTask({ template, project, pipelineInstance: pipeline, workflowInstance: wi, at, by });
        byKey.set(key, task);
        created.push(task);
        mine.push(task);
      }
      if (mine.length) perWorkflow.set(wi.id, mine);
    }
  }

  /* --- dependencies ------------------------------------------------------- */

  /* 1. WITHIN A WORKFLOW: the stage chain, read from the template. */
  for (const [, list] of perWorkflow) {
    for (let i = 1; i < list.length; i += 1) {
      addDependency(list[i], list[i - 1]);
    }
  }

  /* 2. ACROSS WORKFLOWS: a feature that REQUIRES another cannot start before
        that one is finished. The edge is the catalogue's; this only follows it.
        A composite's `composedOf` order does the same job for a landing page —
        design, then development, then deployment — without anyone naming those
        three anywhere in this file. */
  const wiByFeature = new Map();
  for (const p of project.pipelines) for (const wi of p.workflows) wiByFeature.set(wi.featureId, wi);

  const lastOf = (featureId) => {
    const wi = wiByFeature.get(featureId);
    const list = wi ? perWorkflow.get(wi.id) : null;
    return list && list.length ? list[list.length - 1] : null;
  };
  const firstOf = (featureId) => {
    const wi = wiByFeature.get(featureId);
    const list = wi ? perWorkflow.get(wi.id) : null;
    return list && list.length ? list[0] : null;
  };

  for (const [featureId] of wiByFeature) {
    /* A COMPOSITE ORCHESTRATES ITS PARTS IN ORDER, and generates no tasks of
       its own — it is a commercial wrapper. So this runs BEFORE the guard
       below: an earlier version put it after, and the composite's own lack of
       tasks skipped the very ordering it exists to express. Deployment then
       started at the same moment as design, which is not a landing page.

       Note what is not written here: no feature id, no notion of what a
       landing page is. The order comes from the composite's own `composedOf`. */
    const parts = catalogue.partsOf(featureId);
    for (let i = 1; i < parts.length; i += 1) {
      const next = firstOf(parts[i]);
      const prev = lastOf(parts[i - 1]);
      if (next && prev) addDependency(next, prev);
    }

    const first = firstOf(featureId);
    if (!first) continue;

    /* A feature that REQUIRES another cannot start before that one is done.
       The edge is the catalogue's; this only follows it. */
    for (const upstream of catalogue.requires(featureId)) {
      const end = lastOf(upstream);
      if (end) addDependency(first, end);
    }
  }

  /* --- a cycle is a project nobody could ever finish ---------------------- */
  const all = [...byKey.values()];
  const cycle = findCycle(all);
  if (cycle) {
    throw new Error(`task-generator: the dependencies form a cycle — ${cycle.join(' -> ')}. Nothing in it could ever start.`);
  }

  /* --- readiness ----------------------------------------------------------- */
  const byId = (id) => all.find((t) => t.id === id) || null;
  for (const task of all) {
    if (task.status !== 'pending') continue;
    const r = checkReadiness(task, byId);
    if (r.ready) {
      task._readiness = r;
      status.transition('task', task, 'ready', { by, at });
      task.readyAt = at;
      record(task, EVENTS.TASK_READY, { at, by });
      delete task._readiness;
    }
  }

  for (const task of all) tasks.put(task);
  return { created, existing: all.length - created.length, tasks: all };
}

/** One direction only, and never twice. */
function addDependency(task, upstream) {
  if (!task || !upstream || task.id === upstream.id) return;
  if (!task.dependencies.includes(upstream.id)) task.dependencies.push(upstream.id);
  if (!upstream.dependents.includes(task.id)) upstream.dependents.push(task.id);
}

/**
 * Depth-first, returning the cycle itself rather than a boolean — an error that
 * says "there is a cycle" and not which one is an error nobody can fix.
 */
export function findCycle(list) {
  const byId = new Map(list.map((t) => [t.id, t]));
  const state = new Map();
  const stack = [];

  const walk = (id) => {
    if (state.get(id) === 'done') return null;
    if (state.get(id) === 'open') return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, 'open');
    stack.push(id);
    for (const dep of (byId.get(id) || { dependencies: [] }).dependencies) {
      if (!byId.has(dep)) continue;
      const found = walk(dep);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 'done');
    return null;
  };

  for (const t of list) {
    const found = walk(t.id);
    if (found) return found;
  }
  return null;
}

/**
 * Re-evaluate readiness across a project after something completed.
 * Deterministic and cheap: it reads state rather than polling for it.
 */
export function refreshReadiness(projectId, { tasks, status, at = new Date().toISOString(), by = 'system' }) {
  const list = tasks.find((t) => t.projectId === projectId);
  const byId = (id) => list.find((t) => t.id === id) || null;
  const moved = [];
  for (const task of list) {
    if (task.status !== 'pending' && task.status !== 'blocked') continue;
    const r = checkReadiness(task, byId);
    if (!r.ready) continue;
    task._readiness = r;
    try {
      status.transition('task', task, 'ready', { by, at });
      task.readyAt = task.readyAt || at;
      task.blockedReason = null;
      record(task, EVENTS.TASK_READY, { at, by });
      moved.push(task.id);
      tasks.put(task);
    } catch { /* a state that cannot reach ready is not an error here */ }
    delete task._readiness;
  }
  return moved;
}
