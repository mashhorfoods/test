/**
 * AUTOMATION-RUNTIME — the automation ledger, on disk.
 *
 * The rule engine (src/operations/automation.js) decides WHICH rules fire and
 * claims each one through a ledger before its actions run. In one process that
 * ledger is a Map. Here it is a ROW per run, so "has this rule already run for
 * this subject" survives a restart:
 *
 *   running -> completed
 *           -> failed
 *           -> escalated   (the sweeper found it past its timeout)
 *
 * The UNIQUE constraint on `idempotency_key` is the whole concurrency control.
 * Two deliveries of the same event race to INSERT; one wins, the other gets a
 * constraint violation and stops. No lock table, no advisory lock — the
 * database already has exactly the primitive needed.
 *
 * WHY THE CLAIM IS NOT TAKEN HERE. Phase 4B wrapped the engine's `dispatch`
 * and claimed a key for every rule matching the event BEFORE the engine had
 * evaluated the rule's conditions. A rule whose conditions were not yet true
 * therefore burned its key, and when they became true the rule was skipped as
 * "already done" — the server never escalated a task whose agent had used
 * every attempt. The engine now calls this ledger itself, after the conditions
 * pass, so only a rule that actually runs leaves a row.
 *
 * A STALE ROW ESCALATES. Actions are synchronous calls inside this process,
 * so a row still `running` past its timeout means the process died part-way
 * through an action. Re-running a half-applied action is not safe, and nothing
 * here can know how far it got — so it goes to a person, never back to pending.
 */

import { EVENTS } from '../src/operations/events.js';
import { newId } from '../src/operations/ids.js';

const nowIso = () => new Date().toISOString();

export function createDurableAutomation(db, config) {
  const timeoutSeconds = config.automation.timeoutSeconds;

  const recordEvent = ({ type, entityType, entityId, projectId = null, actor = 'system', actorType = 'system', payload = null }) => {
    const id = newId('event');
    db.prepare(`INSERT INTO events (id, type, entity_type, entity_id, project_id, actor, actor_type, payload, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, type, entityType, entityId, projectId, actor, actorType, payload ? JSON.stringify(payload) : null, nowIso());
    return id;
  };

  const row = (id) => db.prepare('SELECT * FROM automation_executions WHERE id = ?').get(id);

  /**
   * Take the right to run this rule for this key, or learn that somebody
   * already has. The INSERT is the claim; there is no check-then-act window.
   * `maxRuns` above 1 is honoured with numbered slots (`key`, `key#2`, …),
   * each one its own UNIQUE row.
   */
  const claim = ({ ruleId, eventId = null, idempotencyKey, maxRuns = 1 }) => {
    const timeoutAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString();
    let last = null;
    for (let n = 1; n <= maxRuns; n += 1) {
      const key = n === 1 ? idempotencyKey : `${idempotencyKey}#${n}`;
      const id = newId('automationExecution');
      try {
        db.prepare(`INSERT INTO automation_executions
          (id, rule_id, event_id, idempotency_key, status, attempt_count, max_attempts, started_at, timeout_at, created_at)
          VALUES (?, ?, ?, ?, 'running', 1, 1, ?, ?, ?)`)
          .run(id, ruleId, eventId, key, nowIso(), timeoutAt, nowIso());
        return { claimed: true, id, timeoutAt };
      } catch (e) {
        if (!/UNIQUE|constraint/i.test(String(e.message))) throw e;
        last = db.prepare('SELECT * FROM automation_executions WHERE idempotency_key = ?').get(key);
      }
    }
    return { claimed: false, id: last ? last.id : null, existing: last, reason: `already ${last ? last.status : 'claimed'} for this key` };
  };

  const finish = (id, { status, result = null, error = null }) => {
    if (!id) return null;
    db.prepare(`UPDATE automation_executions
                SET status = ?, completed_at = ?, result = ?, error_code = ?, error_message = ?
                WHERE id = ?`)
      .run(status, nowIso(), result ? JSON.stringify(result).slice(0, 4000) : null,
        error ? (error.code || 'INTERNAL_ERROR') : null, error ? String(error.message).slice(0, 500) : null, id);
    return row(id);
  };

  const api = {
    /** The ledger the rule engine is given. See createOperations({ automationLedger }). */
    ledger: {
      event(eventName, context, { by = 'system', actorType = 'automation' } = {}) {
        const subject = context.task || context.project || context.order || {};
        return recordEvent({
          type: eventName,
          entityType: context.task ? 'task' : (context.project ? 'project' : 'order'),
          entityId: subject.id || null,
          projectId: subject.projectId || subject.id || null,
          actor: by,
          actorType,
        });
      },
      claim: ({ ruleId, key, maxRuns, eventId }) => claim({ ruleId, eventId, idempotencyKey: key, maxRuns }),
      finish,
    },

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

    claim,
    finish,

    /** Run one action under a claim. The same claim and finish the engine uses. */
    run({ ruleId, eventId = null, idempotencyKey, maxRuns = 1, action }) {
      const c = claim({ ruleId, eventId, idempotencyKey, maxRuns });
      if (!c.claimed) return { ran: false, reason: c.reason, executionId: c.id };
      try {
        const result = action();
        finish(c.id, { status: 'completed', result });
        return { ran: true, executionId: c.id, result };
      } catch (e) {
        finish(c.id, { status: 'failed', error: e });
        return { ran: true, executionId: c.id, failed: true, error: e.message };
      }
    },

    /** Anything still running past its timeout goes to a person. Nothing stays running. */
    recoverStale({ by = 'system', at = nowIso() } = {}) {
      const stale = db.prepare("SELECT * FROM automation_executions WHERE status = 'running' AND timeout_at IS NOT NULL AND timeout_at < ?").all(at);
      for (const r of stale) {
        db.prepare(`UPDATE automation_executions SET status = 'escalated', completed_at = ?,
                    error_code = 'TIMEOUT', error_message = 'still running past its timeout — the process died mid-action' WHERE id = ?`)
          .run(at, r.id);
        recordEvent({
          type: EVENTS.TASK_ESCALATED, entityType: 'automation_execution', entityId: r.id,
          actor: by, actorType: 'system', payload: { ruleId: r.rule_id, reason: 'timeout' },
        });
      }
      return { checked: stale.length, recovered: stale.map((r) => ({ id: r.id, ruleId: r.rule_id, outcome: 'escalated' })) };
    },
  };

  return api;
}
