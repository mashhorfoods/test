/**
 * EVENTS — the names, and a place to record that one happened.
 *
 * NOT AN EVENT BUS. The brief says to prepare for events without building the
 * infrastructure, and that is exactly the right size: an event bus with one
 * synchronous subscriber is a queue pretending to be architecture.
 *
 * What this gives is the two things that are expensive to add later. First, the
 * NAMES — fixed now, so the automation phase does not have to invent them and
 * then rename half of them. Second, a RECORD: every domain operation appends
 * one line to the record it changed, so "what happened to this order" is
 * answerable from the order itself rather than from a log nobody kept.
 *
 * When a real bus arrives it publishes these same names, and the recorded
 * history becomes its replay log rather than being thrown away.
 */

export const EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_SUBMITTED: 'order.submitted',
  ORDER_APPROVED: 'order.approved',
  ORDER_REJECTED: 'order.rejected',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_CONVERTED: 'order.converted_to_project',
  ORDER_AMENDED: 'order.amended',

  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_REVIEW_REQUIRED: 'client.review_required',

  PROJECT_CREATED: 'project.created',
  PROJECT_STARTED: 'project.started',
  PROJECT_COMPLETED: 'project.completed',

  PIPELINE_STARTED: 'pipeline.started',
  PIPELINE_COMPLETED: 'pipeline.completed',

  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_COMPLETED: 'workflow.completed',

  /* --- Phase 3: execution ------------------------------------------------
     These are the names an automation rule triggers on and an audit line
     records. Fixed now, before anything subscribes to them, because renaming
     an event later means finding every rule that named it. */
  TASK_CREATED: 'task.created',
  TASK_READY: 'task.ready',
  TASK_ASSIGNED: 'task.assigned',
  TASK_STARTED: 'task.started',
  TASK_INPUT_REQUESTED: 'task.input_requested',
  TASK_BLOCKED: 'task.blocked',
  TASK_UNBLOCKED: 'task.unblocked',
  TASK_SUBMITTED: 'task.submitted',
  TASK_REJECTED: 'task.rejected',
  TASK_APPROVED: 'task.approved',
  TASK_COMPLETED: 'task.completed',
  TASK_CANCELLED: 'task.cancelled',
  TASK_ESCALATED: 'task.escalated',

  QA_PASSED: 'qa.passed',
  QA_FAILED: 'qa.failed',

  AUTOMATION_TRIGGERED: 'automation.triggered',
  AUTOMATION_SKIPPED: 'automation.skipped',

  AGENT_EXECUTION_STARTED: 'agent.execution.started',
  AGENT_EXECUTION_COMPLETED: 'agent.execution.completed',
  AGENT_EXECUTION_FAILED: 'agent.execution.failed',
  AGENT_DISABLED: 'agent.disabled',
};

/** The actors a change may be attributed to. Default deny is enforced elsewhere;
    this is the vocabulary the audit trail records. */
export const ACTOR_TYPES = ['human', 'system', 'automation', 'ai_agent'];

const KNOWN = new Set(Object.values(EVENTS));

/**
 * Append an event to a record's own log. Returns the entry so a caller can
 * hand it to a bus later without this function knowing one exists.
 */
export function record(target, name, { at = new Date().toISOString(), by = 'system', data = null } = {}) {
  if (!KNOWN.has(name)) throw new Error(`events: "${name}" is not a declared event`);
  target.events = target.events || [];
  const entry = { event: name, at, by };
  if (data) entry.data = data;
  target.events.push(entry);
  return entry;
}

/** Every event on a record, oldest first. */
export const eventsOf = (target) => [...((target || {}).events || [])];

/** Has this already happened? The cheap half of idempotency. */
export const hasHappened = (target, name) => eventsOf(target).some((e) => e.event === name);
