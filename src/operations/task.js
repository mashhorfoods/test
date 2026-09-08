/**
 * TASK — the executable unit of work.
 *
 * WHERE THE LINE IS.
 *   A WORKFLOW says what should happen. It is a definition and it belongs to
 *   the catalogue.
 *   A TASK is a thing somebody — or something — actually does, once, for one
 *   client, and it has a status, an executor, attempts, output and a history.
 *
 * A task never redefines the work. Its title, inputs, outputs, QA criteria,
 * owning role and duration all come from the template derived in
 * task-template.js, which comes from the catalogue. What the task adds is
 * everything that is true only of this instance of it.
 *
 * NOTHING MUTATES A TASK EXCEPT THE OPERATIONS IN THIS FILE. Not the UI, not an
 * automation rule, not an agent. Each one validates the transition against the
 * `task` state machine in statuses.json, checks the conditions the brief calls
 * for — dependencies, output, QA, approval, retries, ownership — and writes an
 * audit line. A status assigned directly would skip every one of those.
 */

import { EVENTS, record } from './events.js';

const nowIso = () => new Date().toISOString();

/* ---------- identity -------------------------------------------------------- */

/**
 * A task's identity is its workflow instance and its stage — nothing else.
 * That is what makes generation idempotent: run it twice and the second run
 * computes the same key and finds the task already there.
 *
 * `unitIndex` exists for the day a stage fans out per unit (ten posts, ten
 * tasks). Today every stage produces one task carrying its quantity, which is
 * the least invasive reading of "quantity must survive" — see docs/130 §4.
 */
export const taskKey = (workflowInstanceId, stageId, unitIndex = null) =>
  `${workflowInstanceId}::${stageId}${unitIndex === null ? '' : `#${unitIndex}`}`;

/** `tsk.2026-09-08.k3f9qa.brief` — derived from the key, ASCII, stable. */
export function taskId(workflowInstanceId, stageId, unitIndex = null) {
  const [, day, tail] = workflowInstanceId.split('.');
  const unit = unitIndex === null ? '' : `.${unitIndex}`;
  return `tsk.${day}.${tail}.${stageId}${unit}`;
}

/* ---------- creation -------------------------------------------------------- */

/**
 * Build one task from a template and the instance it belongs to.
 * Everything commercial — quantity, page count, tier, origin — is carried from
 * the ORDER through the workflow instance, never re-read from the catalogue.
 */
export function createTask({
  template, project, pipelineInstance, workflowInstance, unitIndex = null, at = nowIso(), by = 'system',
}) {
  const id = taskId(workflowInstance.id, template.stageId, unitIndex);
  const task = {
    id,
    key: taskKey(workflowInstance.id, template.stageId, unitIndex),
    taskTemplateId: template.id,

    /* WHERE IT CAME FROM. Every one of these is a reference; none is a copy. */
    projectId: project.id,
    clientId: project.clientId,
    orderId: project.orderId,
    pipelineInstanceId: pipelineInstance.id,
    workflowInstanceId: workflowInstance.id,
    serviceId: template.serviceId,
    featureId: template.featureId,
    workflowId: template.workflowId,
    stageId: template.stageId,
    pipelineId: template.pipelineId,
    /* Which pipeline stage this sits under, so a board can group by it. */
    pipelineStageId: (template.pipelineStages || [])[0] || null,

    title: template.title,
    description: template.description,
    order: template.order,

    /* THE COMMERCIAL FACTS, carried through. A task that has forgotten it is
       one of ten posts is a task nobody can size. */
    quantity: workflowInstance.quantity,
    unitIndex,
    origin: workflowInstance.origin,
    tier: workflowInstance.tier || null,
    partOf: workflowInstance.partOf || null,
    pageCount: (project.limits || {}).pages ?? null,

    ownerRole: template.ownerRole,
    assignedTo: null,
    executorType: null,

    status: 'pending',
    priority: template.order,

    duration: template.duration ? { ...template.duration } : null,
    estimatedDuration: template.duration ? { ...template.duration } : null,

    /* Task ids this one waits for. Written by the generator, which is the only
       thing that can see across workflow instances. */
    dependencies: [],
    dependents: [],

    inputs: (template.expectedInputs || []).map((i) => ({ ...i, satisfied: false, value: null })),
    outputs: (template.expectedOutputs || []).map((o) => ({ ...o, produced: false })),
    deliverables: [],

    requiredCapabilities: [...(template.requiredCapabilities || [])],
    allowedExecutorTypes: [...(template.allowedExecutorTypes || ['human'])],

    qaCriteria: (template.qaCriteria || []).map((q) => ({ ...q, result: null, checkedBy: null, checkedAt: null })),
    qaResult: null,
    approvalRequired: Boolean(template.approvalRequired),
    requiresHumanReview: Boolean(template.requiresHumanReview),
    approvedBy: null,

    automationEligible: Boolean(template.automationEligible),
    aiEligible: Boolean(template.aiEligible),

    attempts: [],
    attemptCount: 0,
    maxAttempts: template.maxAttempts,
    executionTimeoutMinutes: template.executionTimeoutMinutes,

    createdAt: at,
    readyAt: null,
    startedAt: null,
    submittedAt: null,
    approvedAt: null,
    completedAt: null,
    blockedAt: null,
    rejectedAt: null,
    cancelledAt: null,

    rejectionReason: null,
    blockedReason: null,
    escalation: null,

    metadata: {},
    history: [],
    events: [],
  };
  record(task, EVENTS.TASK_CREATED, { at, by, data: { workflowInstanceId: workflowInstance.id, stageId: template.stageId } });
  return task;
}

/* ---------- readiness ------------------------------------------------------- */

/**
 * Can this task start? Returns the answer AND the reason, because "not ready"
 * without a reason is the thing an operator cannot act on.
 */
export function checkReadiness(task, byId) {
  if (task.status === 'cancelled') return { ready: false, reason: 'the task is cancelled' };
  if (task.status === 'completed') return { ready: false, reason: 'the task is already complete' };

  const missing = [];
  for (const depId of task.dependencies) {
    const dep = byId(depId);
    if (!dep) { missing.push(`${depId} (which does not exist)`); continue; }
    if (dep.status !== 'completed') missing.push(`${depId} (${dep.status})`);
  }
  if (missing.length) {
    return { ready: false, reason: `waiting on ${missing.join(', ')}`, blockedBy: missing };
  }
  return { ready: true, reason: null };
}

/* ---------- guards the state machine cannot express ------------------------- */

/**
 * The conditions that are about the task's CONTENT rather than its state, and
 * so cannot live in statuses.json. Every one is named in §11 of the brief.
 */
export function transitionGuard(task, to, { by, actorType, output = null, qa = null } = {}) {
  const deny = (message) => ({ ok: false, message });

  if (to === 'ready') {
    if (task.dependencies.length && task._readiness && !task._readiness.ready) return deny(task._readiness.reason);
  }

  if (to === 'assigned') {
    if (!task.assignedTo) return deny('a task cannot be assigned to nobody');
    if (!task.allowedExecutorTypes.includes(task.executorType)) {
      return deny(`${task.executorType} may not execute this task — it allows ${task.allowedExecutorTypes.join(' or ')}`);
    }
  }

  if (to === 'in_progress') {
    if (!task.assignedTo) return deny('a task cannot start without an executor');
    if (task.attemptCount >= task.maxAttempts && task.status === 'rejected') {
      return deny(`this task has used all ${task.maxAttempts} attempts — it must be escalated, not retried`);
    }
  }

  if (to === 'review') {
    /* AN AGENT RETURNING A RESPONSE IS NOT A COMPLETED TASK. */
    const required = task.outputs.filter((o) => o.required);
    const produced = task.outputs.filter((o) => o.produced);
    if (required.length && produced.length < required.length) {
      const short = required.filter((o) => !task.outputs.find((x) => x.key === o.key && x.produced)).map((o) => o.key);
      return deny(`the required output is missing: ${short.join(', ')}`);
    }
  }

  if (to === 'approved') {
    /* QA CANNOT BE SKIPPED. */
    const failed = task.qaCriteria.filter((q) => q.required && q.result !== 'passed');
    if (failed.length) return deny(`QA has not passed: ${failed.map((q) => q.id).join(', ')}`);

    /* AN AI AGENT MAY NOT APPROVE ITS OWN WORK — nor anyone's, where a person
       is required. Executor and approver are different roles by construction.
       EVERY attempt counts, not only the most recent: a task that changed hands
       and came back would otherwise let its first executor sign off the work
       they did. Phase 4's security pass found that gap through the API, where a
       reject-and-reassign made it reachable. */
    /* PHASE 4D FOUND THE HOLE IN THIS GUARD. It keyed on `approvalRequired`
       alone — the flag that says a named approval STAGE exists. But a task can
       carry `requiresHumanReview` without being an approval stage, and the
       first task agent.qa-reader is eligible for is exactly that shape: an
       automation-level of "partial", human review required, no approval stage.
       On that task the guard did not run at all, so nothing in the domain
       stopped `approveTask({ actorType: 'ai_agent' })` from succeeding.
       Unreachable in practice — the registry forbids the operation, the agent
       runtime never calls it and the API fixes the approver to the session —
       but a rule that holds only because three other things hold is not the
       rule §15 asks for. Either flag now demands a person. */
    if (task.approvalRequired || task.requiresHumanReview) {
      if (actorType !== 'human') return deny('this task requires human approval and the approver is not a person');
      const executors = new Set((task.attempts || []).map((a) => a.executor).filter(Boolean));
      if (task.assignedTo) executors.add(task.assignedTo);
      if (executors.has(by)) return deny('the person who did the work cannot be the person who approves it');
    }
  }

  if (to === 'completed') {
    if (task.approvalRequired && !task.approvedBy) {
      return deny('this task requires approval and has not been approved');
    }
    const failed = task.qaCriteria.filter((q) => q.required && q.result !== 'passed');
    if (failed.length) return deny(`QA has not passed: ${failed.map((q) => q.id).join(', ')}`);
  }

  return { ok: true };
}

/* ---------- attempts and QA -------------------------------------------------- */

export function openAttempt(task, { executor, executorType, at = nowIso(), agentId = null }) {
  task.attemptCount += 1;
  const attempt = {
    number: task.attemptCount,
    executor,
    executorType,
    agentId,
    startedAt: at,
    completedAt: null,
    result: null,
    failureReason: null,
    outputRef: null,
  };
  task.attempts.push(attempt);
  return attempt;
}

export function closeAttempt(task, { result, failureReason = null, outputRef = null, at = nowIso() }) {
  const attempt = task.attempts[task.attempts.length - 1];
  if (!attempt) return null;
  attempt.completedAt = at;
  attempt.result = result;
  attempt.failureReason = failureReason;
  attempt.outputRef = outputRef;
  return attempt;
}

/** Record one QA judgement. `automatic` checks may be judged by the system. */
export function judgeQa(task, criterionId, { result, by, at = nowIso(), note = null }) {
  const c = task.qaCriteria.find((x) => x.id === criterionId);
  if (!c) throw new Error(`task: no QA criterion ${criterionId}`);
  if (c.validationMode === 'human' && by === 'system') {
    throw new Error(`task: ${criterionId} is judged by a person, and "system" is not one`);
  }
  c.result = result;
  c.checkedBy = by;
  c.checkedAt = at;
  c.note = note;
  const required = task.qaCriteria.filter((x) => x.required);
  task.qaResult = required.every((x) => x.result === 'passed') ? 'passed'
    : (required.some((x) => x.result === 'failed') ? 'failed' : null);
  return c;
}

/** Which QA criteria a machine is allowed to judge. */
export const automaticCriteria = (task) => task.qaCriteria.filter((q) => q.validationMode === 'automatic');

/** Everything that is still in the way, in words. */
export function explainTask(task, byId) {
  const readiness = checkReadiness(task, byId);
  return {
    id: task.id,
    why: `stage "${task.stageId}" of ${task.workflowId}, created for ${task.featureId} in project ${task.projectId}`,
    status: task.status,
    ready: readiness.ready,
    blockedBecause: task.blockedReason || (readiness.ready ? null : readiness.reason),
    needs: task.inputs.filter((i) => i.required && !i.satisfied).map((i) => i.description),
    owner: { role: task.ownerRole, assignedTo: task.assignedTo, executorType: task.executorType },
    produced: task.outputs.filter((o) => o.produced).map((o) => o.key),
    stillOwed: task.outputs.filter((o) => o.required && !o.produced).map((o) => o.key),
    qa: { result: task.qaResult, criteria: task.qaCriteria.map((q) => ({ id: q.id, required: q.required, mode: q.validationMode, result: q.result })) },
    approval: { required: task.approvalRequired, approvedBy: task.approvedBy, at: task.approvedAt },
    attempts: task.attempts.map((a) => ({ n: a.number, executor: a.executor, type: a.executorType, result: a.result, failure: a.failureReason })),
    escalation: task.escalation,
    history: task.history,
  };
}
