/**
 * AUTOMATION-RUNTIME — Phase 4B. The ledger moves onto disk.
 *
 * WHAT WAS WRONG WITH PHASE 3, STATED PLAINLY. The rule engine was correct and
 * its idempotency ledger was a Map. That is honest inside one process and
 * useless across a restart: crash between "task.completed" and the action it
 * triggers, and on reboot the system has no idea whether the action ran. Every
 * durable-execution problem the brief lists follows from that one fact.
 *
 * So an execution is now a ROW, written before the action runs:
 *
 *   pending -> running -> completed
 *                      -> failed
 *                      -> timed_out -> escalated
 *
 * The UNIQUE constraint on `idempotency_key` is the whole concurrency control.
 * Two deliveries of the same event race to INSERT; one wins, the other gets a
 * constraint violation and stops. No lock table, no advisory lock, no
 * distributed coordinator — the database already has exactly the primitive
 * needed, and adding another would be a second source of truth about who is
 * running what.
 *
 * TIMEOUTS AND STALE RECOVERY ARE THE SAME MECHANISM. Every running execution
 * carries `timeout_at`. A sweep asks the database which rows are past it —
 * which finds both a genuinely slow action and one whose process died, because
 * from the outside those are indistinguishable and should be treated the same.
 */

import crypto from 'node:crypto';
import { EVENTS } from '../src/operations/events.js';
import { isRetryable } from './errors.js';

const nowIso = () => new Date().toISOString();
const newId = (prefix) => `${prefix}.${nowIso().slice(0, 10)}.${crypto.randomBytes(4).toString('hex')}`;

export function createDurableAutomation(db, ops, config) {
  const timeoutSeconds = config.automation.timeoutSeconds;

  const recordEvent = ({ type, entityType, entityId, projectId = null, actor = 'system', actorType = 'system', payload = null }) => {
    const id = newId('evt');
    db.prepare(`INSERT INTO events (id, type, entity_type, entity_id, project_id, actor, actor_type, payload, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, type, entityType, entityId, projectId, actor, actorType, payload ? JSON.stringify(payload) : null, nowIso());
    return id;
  };

  const api = {
    /** Every domain event worth replaying, on disk. */
    recordEvent,
    events: ({ type = null, entityId = null, limit = 200 } = {}) => {
      const where = []; const args = [];
      if (type) { where.push('type = ?'); args.push(type); }
      if (entityId) { where.push('entity_id = ?'); args.push(entityId); }
      return db.prepare(`SELECT * FROM events ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ?`)
        .all(...args, limit);
    },

    executions: ({ status = null, ruleId = null, limit = 200 } = {}) => {
      const where = []; const args = [];
      if (status) { where.push('status = ?'); args.push(status); }
      if (ruleId) { where.push('rule_id = ?'); args.push(ruleId); }
      return db.prepare(`SELECT * FROM automation_executions ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ?`)
        .all(...args, limit);
    },

    /**
     * Claim the right to run this rule for this subject, or discover somebody
     * already has. The INSERT is the claim; there is no check-then-act window
     * for two callers to slip through.
     */
    claim({ ruleId, eventId, idempotencyKey, maxAttempts = 3 }) {
      const id = newId('aex');
      const timeoutAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString();
      try {
        db.prepare(`INSERT INTO automation_executions
          (id, rule_id, event_id, idempotency_key, status, attempt_count, max_attempts, started_at, timeout_at, created_at)
          VALUES (?, ?, ?, ?, 'running', 1, ?, ?, ?, ?)`)
          .run(id, ruleId, eventId, idempotencyKey, maxAttempts, nowIso(), timeoutAt, nowIso());
        return { claimed: true, id, timeoutAt };
      } catch (e) {
        if (!/UNIQUE|constraint/i.test(String(e.message))) throw e;
        const existing = db.prepare('SELECT * FROM automation_executions WHERE idempotency_key = ?').get(idempotencyKey);
        return { claimed: false, id: existing ? existing.id : null, existing, reason: `already ${existing ? existing.status : 'claimed'} for this key` };
      }
    },

    finish(id, { status, result = null, errorCode = null, errorMessage = null }) {
      db.prepare(`UPDATE automation_executions
                  SET status = ?, completed_at = ?, result = ?, error_code = ?, error_message = ?
                  WHERE id = ?`)
        .run(status, nowIso(), result ? JSON.stringify(result).slice(0, 4000) : null, errorCode, errorMessage, id);
      return db.prepare('SELECT * FROM automation_executions WHERE id = ?').get(id);
    },

    /**
     * Run one rule's action durably. The claim is taken first, so a crash
     * anywhere after it leaves a `running` row for the sweeper to find rather
     * than a silent gap.
     */
    run({ ruleId, eventId, idempotencyKey, maxAttempts, action }) {
      const claim = api.claim({ ruleId, eventId, idempotencyKey, maxAttempts });
      if (!claim.claimed) return { ran: false, reason: claim.reason, executionId: claim.id };
      try {
        const result = action();
        api.finish(claim.id, { status: 'completed', result });
        return { ran: true, executionId: claim.id, result };
      } catch (e) {
        const code = e.code && isRetryable(e.code) ? e.code : 'INTERNAL_ERROR';
        api.finish(claim.id, { status: 'failed', errorCode: code, errorMessage: String(e.message).slice(0, 500) });
        return { ran: true, executionId: claim.id, failed: true, error: e.message };
      }
    },

    /**
     * Anything still running past its timeout is dead — a slow action and a
     * crashed process look identical from here, and both need the same answer.
     * Retryable failures go back to pending within their attempt budget;
     * everything else escalates. Nothing is left in `running` for ever, which
     * is the property §23 asks for.
     */
    recoverStale({ by = 'system', at = nowIso() } = {}) {
      const stale = db.prepare("SELECT * FROM automation_executions WHERE status = 'running' AND timeout_at IS NOT NULL AND timeout_at < ?").all(at);
      const recovered = [];
      for (const row of stale) {
        const canRetry = row.attempt_count < row.max_attempts;
        if (canRetry) {
          const timeoutAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString();
          db.prepare(`UPDATE automation_executions SET status = 'pending', attempt_count = attempt_count + 1,
                      timeout_at = ?, error_code = 'TIMEOUT', error_message = 'no result before the timeout — retrying' WHERE id = ?`)
            .run(timeoutAt, row.id);
          recovered.push({ id: row.id, ruleId: row.rule_id, outcome: 'retry', attempt: row.attempt_count + 1 });
        } else {
          db.prepare(`UPDATE automation_executions SET status = 'escalated', completed_at = ?,
                      error_code = 'TIMEOUT', error_message = 'every attempt timed out' WHERE id = ?`)
            .run(at, row.id);
          recovered.push({ id: row.id, ruleId: row.rule_id, outcome: 'escalated' });
        }
        recordEvent({
          type: canRetry ? EVENTS.AUTOMATION_SKIPPED : EVENTS.TASK_ESCALATED,
          entityType: 'automation_execution', entityId: row.id, actor: by, actorType: 'system',
          payload: { ruleId: row.rule_id, reason: 'timeout' },
        });
      }
      return { checked: stale.length, recovered };
    },

    /** Anything left `pending` after a recovery pass is work waiting to be redriven. */
    pending: () => db.prepare("SELECT * FROM automation_executions WHERE status = 'pending' ORDER BY created_at").all(),

    /** The sweeper. Started by the server; a plain interval, not a scheduler. */
    startSweeper({ intervalSeconds = config.automation.sweepIntervalSeconds } = {}) {
      const timer = setInterval(() => {
        try { api.recoverStale(); } catch { /* a sweep that throws must not take the server with it */ }
      }, intervalSeconds * 1000);
      timer.unref();
      return () => clearInterval(timer);
    },
  };

  /* --- wrap the Phase 3 engine so its rules become durable ----------------- */

  /* The in-process engine still decides WHICH rules match — that logic is
     tested and unchanged. What changes is that firing one now goes through a
     claimed row. `dispatch` is replaced rather than reimplemented, so there is
     still one rule evaluator. */
  const inner = ops._automation;
  if (inner) {
    const innerDispatch = inner.dispatch.bind(inner);
    inner.dispatch = (eventName, context, opts = {}) => {
      const subject = context.task || context.project || context.order || {};
      const eventId = recordEvent({
        type: eventName,
        entityType: context.task ? 'task' : (context.project ? 'project' : 'order'),
        entityId: subject.id || null,
        projectId: subject.projectId || subject.id || null,
        actor: opts.by || 'system',
        actorType: opts.actorType || 'automation',
      });

      /* Ask the engine what would fire, then claim each one durably before it
         does. A rule already run for this key never reaches its action. */
      const fired = []; const skipped = [];
      for (const rule of inner.rules()) {
        if (!rule.enabled || rule.trigger.event !== eventName) continue;
        const key = renderKey(rule.idempotencyKey, context);
        const existing = db.prepare('SELECT status FROM automation_executions WHERE idempotency_key = ?').get(key);
        if (existing) { skipped.push({ rule: rule.id, key, reason: `already ${existing.status} for this key` }); continue; }
        const out = api.run({
          ruleId: rule.id, eventId, idempotencyKey: key, maxAttempts: rule.maxRuns ?? 1,
          action: () => innerDispatch(eventName, context, opts),
        });
        if (out.ran && !out.failed) fired.push({ rule: rule.id, key, executionId: out.executionId });
        else if (out.failed) skipped.push({ rule: rule.id, key, reason: out.error });
        else skipped.push({ rule: rule.id, key, reason: out.reason });
      }
      return { fired, skipped, eventId };
    };
  }

  return api;
}

/** `{{task.id}}` -> the value. The same renderer the in-process engine uses. */
function renderKey(template, context) {
  return String(template).replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, path) => {
    const got = path.split('.').reduce((o, k) => {
      if (o === null || o === undefined) return undefined;
      if (k === 'length' && Array.isArray(o)) return o.length;
      return o[k];
    }, context);
    return got === undefined || got === null ? '' : String(got);
  });
}
