/**
 * AUTOMATION — event, condition, action. Nothing more.
 *
 * WHY IT IS THIS SMALL. The brief asks for automation that is deterministic,
 * inspectable, auditable and idempotent, and warns against starting with a
 * complex event bus. A bus would buy queueing and retries that nothing here
 * needs; what is actually needed is that when a task completes, whatever was
 * waiting on it gets released, and that this happens exactly once however many
 * times the event arrives.
 *
 * So: rules live in `src/data/operations/automation.json`, are evaluated
 * synchronously when a domain operation emits an event, and every action calls
 * a DOMAIN OPERATION by name from an allowlist. An automation rule cannot write
 * to a repository, cannot set a status field, and cannot call anything the
 * allowlist does not name. It has strictly fewer powers than an operator.
 *
 * THREE GUARDS AGAINST THE THING THAT GOES WRONG:
 *   idempotency  a rendered key per rule per subject; a repeat is a no-op
 *   maxRuns      a cap per key, so a mistake stops rather than accumulates
 *   cascadeDepth an action that causes an event that fires a rule stops at a
 *                declared depth instead of spiralling
 */

import { EVENTS } from './events.js';

/** The only operations a rule may name. Anything else is refused at load. */
export const AUTOMATION_ALLOWED_ACTIONS = new Set([
  'refreshTaskReadiness',
  'reopenForRework',
  'escalateTask',
  'evaluateAgentEligibility',
  'blockTask',
]);

const KNOWN_EVENTS = new Set(Object.values(EVENTS));

/** `{{task.projectId}}` -> the value. No expressions, on purpose. */
const renderTemplate = (value, context) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, path) => {
    const got = readPath(context, path);
    return got === undefined || got === null ? '' : String(got);
  });
};

function readPath(root, path) {
  return path.split('.').reduce((o, k) => {
    if (o === null || o === undefined) return undefined;
    if (k === 'length' && Array.isArray(o)) return o.length;
    return o[k];
  }, root);
}

const OPERATORS = {
  eq: (a, b) => a === b,
  ne: (a, b) => a !== b,
  gt: (a, b) => Number(a) > Number(b),
  gte: (a, b) => Number(a) >= Number(b),
  lt: (a, b) => Number(a) < Number(b),
  lte: (a, b) => Number(a) <= Number(b),
  in: (a, b) => Array.isArray(b) && b.includes(a),
  exists: (a) => a !== undefined && a !== null,
};

export function createAutomation(config, { operations, audit, now = () => new Date() }) {
  /* --- validate the rules once, at load ---------------------------------- */
  for (const rule of config.rules) {
    if (!KNOWN_EVENTS.has(rule.trigger.event)) {
      throw new Error(`automation: rule ${rule.id} triggers on "${rule.trigger.event}", which is not a declared event`);
    }
    for (const action of rule.actions) {
      if (!AUTOMATION_ALLOWED_ACTIONS.has(action.operation)) {
        throw new Error(`automation: rule ${rule.id} calls "${action.operation}", which automation may not do`);
      }
      if (typeof operations[action.operation] !== 'function') {
        throw new Error(`automation: rule ${rule.id} calls "${action.operation}", which is not a domain operation`);
      }
    }
    if (!rule.idempotencyKey) throw new Error(`automation: rule ${rule.id} has no idempotency key — a redelivered event would run it twice`);
  }

  /* Runs already made, by rendered key. In memory: this is a single-process
     operator tool, and the durable record of what a rule did is the audit
     trail, not this map. */
  const runs = new Map();
  const cascadeLimit = config.cascadeDepth ?? 4;
  let depth = 0;

  const evaluate = (conditions, context) => {
    for (const c of conditions || []) {
      const left = readPath(context, c.path);
      const right = c.path2 !== undefined ? readPath(context, c.path2) : c.value;
      const op = OPERATORS[c.operator];
      if (!op) throw new Error(`automation: unknown operator "${c.operator}"`);
      if (!op(left, right)) return false;
    }
    return true;
  };

  return {
    rules: () => config.rules.map((r) => ({ ...r })),
    runCount: (key) => runs.get(key) || 0,

    /**
     * An event happened. Fire whatever matches, once each.
     * Returns what ran and what was skipped, with the reason — an automation
     * that silently does nothing is one nobody can debug.
     */
    dispatch(eventName, context, { by = 'automation' } = {}) {
      const fired = [];
      const skipped = [];

      if (depth >= cascadeLimit) {
        skipped.push({ rule: '*', reason: `cascade depth ${cascadeLimit} reached — refusing to go deeper` });
        return { fired, skipped };
      }

      for (const rule of config.rules) {
        if (!rule.enabled) { skipped.push({ rule: rule.id, reason: 'disabled' }); continue; }
        if (rule.trigger.event !== eventName) continue;

        if (!evaluate(rule.conditions, context)) {
          skipped.push({ rule: rule.id, reason: 'conditions not met' });
          continue;
        }

        const key = renderTemplate(rule.idempotencyKey, context);
        const already = runs.get(key) || 0;
        if (already >= (rule.maxRuns ?? 1)) {
          skipped.push({ rule: rule.id, key, reason: `already ran ${already} time(s) for this key` });
          audit.write({
            action: EVENTS.AUTOMATION_SKIPPED, actorType: 'automation', actor: rule.id,
            entityType: rule.trigger.entityType, entityId: readPath(context, `${rule.trigger.entityType}.id`),
            projectId: readPath(context, `${rule.trigger.entityType}.projectId`),
            reason: 'idempotency key already used', ruleId: rule.id, at: now().toISOString(),
          });
          continue;
        }
        runs.set(key, already + 1);

        depth += 1;
        try {
          for (const action of rule.actions) {
            const args = {};
            for (const [k, v] of Object.entries(action.args || {})) args[k] = renderTemplate(v, context);
            const result = operations[action.operation](args, { by: rule.id, actorType: 'automation' });
            fired.push({ rule: rule.id, action: action.operation, key, result });
            audit.write({
              action: EVENTS.AUTOMATION_TRIGGERED, actorType: 'automation', actor: rule.id,
              entityType: rule.trigger.entityType, entityId: readPath(context, `${rule.trigger.entityType}.id`),
              projectId: readPath(context, `${rule.trigger.entityType}.projectId`),
              detail: { operation: action.operation, args }, ruleId: rule.id, at: now().toISOString(),
            });
          }
        } finally {
          depth -= 1;
        }
      }
      return { fired, skipped };
    },
  };
}
