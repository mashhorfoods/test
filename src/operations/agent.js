/**
 * AGENT — an executor with an allowlist, and nothing more than that.
 *
 * THE POSITION THIS FILE TAKES.
 * An AI agent here is a worker the system hands a task to. It is not the owner
 * of the database, the business rules, the pricing or the project state. It
 * cannot set a status, cannot write to a repository, cannot read another
 * client's work, and cannot approve anything — including its own output.
 * Everything it may do is named on its registry entry, and anything not named
 * is refused. Default deny.
 *
 * WHAT IS NOT HERE, ON PURPOSE. No model call, no API key, no network access.
 * Nothing in this repository executes an agent. What is built is the CONTRACT:
 * eligibility, capability matching, permissions, the envelope handed over, the
 * shape of what must come back, validation of it, retries, timeouts, escalation
 * and a kill switch. A real integration implements `execute(envelope)` and gets
 * all of that for free. The tests drive it with a deterministic mock executor,
 * which is labelled as such and is never mistaken for the real thing.
 */

import { EVENTS } from './events.js';

/**
 * The operations an agent may EVER be granted. A registry entry that names
 * something outside this set is refused at load — so widening an agent's power
 * is a change to this line, in a review, and not a change to a JSON file.
 *
 * Read operations are scoped to the task's own project. Writes are requests:
 * `submitAgentOutput` submits for review, it does not complete anything.
 */
export const AGENT_GRANTABLE = {
  read: new Set(['getTask', 'getTaskEnvelope', 'getWorkflowContext', 'getProjectContext', 'getBrandContext']),
  write: new Set(['startAgentExecution', 'submitAgentOutput', 'reportTaskFailure', 'requestInput']),
};
const ALL_GRANTABLE = new Set([...AGENT_GRANTABLE.read, ...AGENT_GRANTABLE.write]);

/** Operations no agent may ever hold, whatever a registry file says. */
export const AGENT_FORBIDDEN = new Set([
  'approveTask', 'completeTask', 'cancelTask', 'createOrder', 'amendOrder',
  'approveOrder', 'rejectOrder', 'convertOrderToProject', 'setProjectStatus',
  'createClient', 'updateClient', 'assignTask', 'judgeQa',
]);

export function createAgents(registry, { catalogue, execution, now = () => new Date() }) {
  const capabilityIds = new Set(execution.capabilities.map((c) => c.id));

  for (const a of registry.agents) {
    for (const c of a.capabilities) {
      if (!capabilityIds.has(c)) throw new Error(`agent: ${a.id} claims capability ${c}, which is not declared`);
    }
    for (const op of a.allowedOperations) {
      if (AGENT_FORBIDDEN.has(op)) throw new Error(`agent: ${a.id} is granted "${op}", which no agent may ever hold`);
      if (!ALL_GRANTABLE.has(op)) throw new Error(`agent: ${a.id} is granted "${op}", which is not a grantable operation`);
    }
    if (!['active', 'paused', 'disabled'].includes(a.status)) {
      throw new Error(`agent: ${a.id} has status "${a.status}"`);
    }
  }

  const byId = new Map(registry.agents.map((a) => [a.id, structuredClone(a)]));
  /* The kill switch and per-agent status are runtime state, held here rather
     than written back to the registry file: turning an agent off in an
     emergency must not require a commit. */
  let killSwitch = Boolean(registry.globalKillSwitch);

  const api = {
    all: () => [...byId.values()],
    get: (id) => (byId.has(id) ? structuredClone(byId.get(id)) : null),

    killSwitchOn: () => killSwitch,
    setKillSwitch(on, { by = 'operator' } = {}) { killSwitch = Boolean(on); return { killSwitch, by }; },
    setAgentStatus(id, status, { by = 'operator' } = {}) {
      const a = byId.get(id);
      if (!a) throw new Error(`agent: no agent ${id}`);
      if (!['active', 'paused', 'disabled'].includes(status)) throw new Error(`agent: "${status}" is not an agent status`);
      a.status = status;
      return { agent: structuredClone(a), by };
    },

    /** May this agent call this operation? Default deny. */
    may(agentId, operation) {
      const a = byId.get(agentId);
      if (!a) return { allowed: false, reason: `no agent ${agentId}` };
      if (AGENT_FORBIDDEN.has(operation)) return { allowed: false, reason: `"${operation}" is forbidden to every agent` };
      if (!a.allowedOperations.includes(operation)) return { allowed: false, reason: `${agentId} is not granted "${operation}"` };
      return { allowed: true };
    },

    /**
     * Everything that must be true before a task reaches an agent, checked in
     * one place and reported in full — a rejection that names only the first
     * failure sends an operator round the loop once per reason.
     */
    eligibility(task, agentId, { runningFor = () => 0 } = {}) {
      const reasons = [];
      const a = byId.get(agentId);

      if (killSwitch) reasons.push('AI execution is switched off globally');
      if (!a) reasons.push(`no agent ${agentId}`);
      else {
        if (a.status !== 'active') reasons.push(`${agentId} is ${a.status}`);
        const missing = task.requiredCapabilities.filter((c) => !a.capabilities.includes(c));
        if (missing.length) reasons.push(`${agentId} lacks ${missing.join(', ')}`);
        if (runningFor(agentId) >= a.maxConcurrentTasks) {
          reasons.push(`${agentId} is at its limit of ${a.maxConcurrentTasks} concurrent task(s)`);
        }
        for (const op of ['startAgentExecution', 'submitAgentOutput']) {
          if (!a.allowedOperations.includes(op)) reasons.push(`${agentId} is not granted "${op}"`);
        }
      }

      if (!task.aiEligible) reasons.push('the task is not AI-eligible — its feature says so');
      if (!task.allowedExecutorTypes.includes('ai')) reasons.push('the task does not allow an AI executor');
      if (task.status !== 'ready') reasons.push(`the task is "${task.status}", not ready`);
      if (task.attemptCount >= task.maxAttempts) reasons.push(`the task has used all ${task.maxAttempts} attempts`);
      const missingInputs = task.inputs.filter((i) => i.required && !i.satisfied);
      if (missingInputs.length) reasons.push(`${missingInputs.length} required input(s) are missing`);

      return { eligible: reasons.length === 0, agentId, reasons };
    },

    /** The best-matching active agent for a task, or nothing and why. */
    select(task, { runningFor } = {}) {
      const considered = [];
      for (const a of byId.values()) {
        const e = api.eligibility(task, a.id, { runningFor });
        considered.push(e);
        if (e.eligible) return { agentId: a.id, considered };
      }
      return { agentId: null, considered };
    },

    /**
     * THE ENVELOPE. Only what the task needs — the brief is explicit that an
     * agent must not receive unrestricted project data, and a client's other
     * projects are not this task's business.
     *
     * Note what is absent: no price, no order total, no client contact details,
     * no other task, no other client. An agent cannot leak what it was never
     * given.
     */
    envelope(task, { project, workflowInstance, agentId }) {
      const a = byId.get(agentId);
      const feature = catalogue.feature(task.featureId);
      const workflow = catalogue.workflow(task.workflowId);
      const stage = (workflow.stages || []).find((s) => s.stage_id === task.stageId) || {};
      return {
        envelopeVersion: '1.0',
        issuedAt: now().toISOString(),
        agentId,

        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          quantity: task.quantity,
          pageCount: task.pageCount,
          inputs: task.inputs.map((i) => ({ key: i.key, description: i.description, required: i.required, satisfied: i.satisfied })),
          expectedOutputs: task.outputs.map((o) => ({ key: o.key, type: o.type, description: o.description, required: o.required })),
          qaCriteria: task.qaCriteria.map((q) => ({ id: q.id, description: q.description, required: q.required, validationMode: q.validationMode })),
          approvalRequired: task.approvalRequired,
          attempt: task.attemptCount + 1,
          maxAttempts: task.maxAttempts,
        },

        /* An id, so output can be filed. Not the client, not the order, not the
           money. */
        project: { id: project.id },

        workflow: {
          id: task.workflowId,
          purpose: workflow.trigger || null,
          stage: task.stageId,
          objective: stage.objective || null,
          actions: stage.actions || [],
          tools: stage.tools || [],
        },

        context: {
          serviceName: (catalogue.nameOf(task.serviceId) || {}).en || null,
          featureName: (feature ? feature.name : {}).en || null,
          tier: task.tier,
        },

        capabilitiesRequired: [...task.requiredCapabilities],
        allowedOperations: a ? [...a.allowedOperations] : [],

        constraints: [
          'Produce only the outputs listed. Anything else is discarded.',
          'You are the executor, not the approver. Submitting is a request for review.',
          'If a required input is missing, report it — do not invent it.',
          `Stop after ${task.executionTimeoutMinutes} minutes and report a timeout.`,
        ],

        completionCriteria: task.qaCriteria.filter((q) => q.required).map((q) => q.description),
        outputRequirements: task.outputs.filter((o) => o.required).map((o) => ({ key: o.key, type: o.type })),

        escalationPolicy: {
          maxAttempts: task.maxAttempts,
          onExhaustion: 'escalate to a person',
          escalateTo: execution.limits.escalateTo,
        },
      };
    },

    /**
     * WHAT CAME BACK IS NOT AUTOMATICALLY WHAT WAS ASKED FOR.
     * An agent returning a response does not mean the task is done: the outputs
     * must be present, declared, of the right key, and the required quantity
     * must be satisfied.
     */
    validateOutput(task, submission) {
      const problems = [];
      if (!submission || typeof submission !== 'object') return { ok: false, problems: [{ path: 'output', message: 'nothing was returned' }] };

      const outputs = Array.isArray(submission.outputs) ? submission.outputs : null;
      if (!outputs) problems.push({ path: 'outputs', message: 'the submission has no outputs array' });

      const declared = new Map(task.outputs.map((o) => [o.key, o]));
      for (const o of outputs || []) {
        if (!o || !o.key) { problems.push({ path: 'outputs[]', message: 'an output with no key' }); continue; }
        const want = declared.get(o.key);
        if (!want) { problems.push({ path: `outputs.${o.key}`, message: 'not an output this task asked for' }); continue; }
        if (o.type && want.type && o.type !== want.type) {
          problems.push({ path: `outputs.${o.key}`, message: `is "${o.type}" and the task asked for "${want.type}"` });
        }
        if (o.value === undefined || o.value === null || o.value === '') {
          problems.push({ path: `outputs.${o.key}`, message: 'is empty' });
        }
      }
      for (const [key, want] of declared) {
        if (!want.required) continue;
        if (!(outputs || []).some((o) => o.key === key)) problems.push({ path: `outputs.${key}`, message: 'required and not returned' });
      }

      /* QUANTITY. Ten posts means ten, and a submission that says otherwise is
         not the work that was bought. Checked only where the submission itself
         claims a count, so a single-artefact stage is not forced to. */
      if (submission.unitsProduced !== undefined && submission.unitsProduced !== task.quantity) {
        problems.push({ path: 'unitsProduced', message: `says ${submission.unitsProduced} and the task is for ${task.quantity}` });
      }

      return { ok: problems.length === 0, problems };
    },
  };

  return api;
}

/**
 * A DETERMINISTIC MOCK EXECUTOR — FOR TESTS ONLY.
 *
 * This is not an AI agent and is not a stand-in for one. It exists so the
 * contract above can be exercised end to end without a network, and it is
 * exported under a name nobody could mistake for production. Anything real
 * implements the same `execute(envelope) -> submission` signature.
 */
export function mockExecutor({ behaviour = 'complete' } = {}) {
  return {
    isMock: true,
    execute(envelope) {
      if (behaviour === 'timeout') return { ok: false, failure: 'timeout', message: 'the mock executor was told to time out' };
      if (behaviour === 'malformed') return { ok: true, outputs: [{ key: 'not-a-real-output', value: 'x' }] };
      if (behaviour === 'empty') return { ok: true, outputs: [] };
      if (behaviour === 'wrong-quantity') {
        return { ok: true, unitsProduced: (envelope.task.quantity || 1) + 1, outputs: envelope.task.expectedOutputs.map((o) => ({ key: o.key, type: o.type, value: `mock ${o.key}` })) };
      }
      return {
        ok: true,
        unitsProduced: envelope.task.quantity,
        outputs: envelope.task.expectedOutputs.map((o) => ({ key: o.key, type: o.type, value: `mock output for ${o.key}` })),
        notes: 'produced by the deterministic mock executor — not a real agent',
      };
    },
  };
}
