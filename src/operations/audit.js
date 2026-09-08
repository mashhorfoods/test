/**
 * AUDIT — who did what, to what, when, and from which state to which.
 *
 * Every entity already carries its own `history` and `events`, which answers
 * "what happened to this task". This answers the other question: "what happened
 * at 14:20, and who was it?" — across tasks, agents, automation and people.
 *
 * Deliberately flat and append-only. It is a log, not a model.
 */

export function createAudit(store, { now = () => new Date() } = {}) {
  let seq = 0;
  return {
    write({
      action, actorType = 'system', actor = 'system',
      entityType, entityId, projectId = null,
      from = null, to = null, reason = null, detail = null,
      attemptId = null, ruleId = null, agentId = null, at = null,
    }) {
      seq += 1;
      const entry = {
        id: `aud.${(at || now().toISOString()).slice(0, 10)}.${String(seq).padStart(6, '0')}`,
        at: at || now().toISOString(),
        action,
        actorType,
        actor,
        entityType,
        entityId,
        projectId,
        from,
        to,
        reason,
        detail,
        attemptId,
        ruleId,
        agentId,
      };
      store.put(entry);
      return entry;
    },
    all: () => store.all(),
    forEntity: (entityId) => store.find((e) => e.entityId === entityId),
    forProject: (projectId) => store.find((e) => e.projectId === projectId),
    byActorType: (t) => store.find((e) => e.actorType === t),
  };
}
