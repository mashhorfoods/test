/**
 * AUTHZ — what are you allowed to do, and to which records.
 *
 * TWO QUESTIONS, NOT ONE. "May this role call this operation?" is a matrix.
 * "May this user see this project?" is a scope. Systems that answer only the
 * first are the ones where changing an id in a URL returns somebody else's
 * order — the insecure direct object reference §13 names. Every handler that
 * touches a record therefore calls `assertCanSee`, and there is no path to a
 * record that does not.
 *
 * The matrix is data. Adding a role is an edit here, in a review, rather than a
 * new branch in fifteen handlers.
 */

import { fail } from './errors.js';

/**
 * Operation groups, so the matrix reads as intent rather than as a list.
 *
 * EVERY NAME HERE IS AN OPERATION SOME ROUTE CHECKS, and a test enforces it
 * (phase4d-test §21). The table used to grant 23 operations no route exposed —
 * amendOrder, cancelTask, getTaskEnvelope and the rest — which read as
 * permissions but guarded nothing. A route that needs one adds it here.
 */
const GROUPS = {
  read: ['getClient', 'listClients', 'clientDossier', 'getOrder', 'listOrders', 'orderSummary',
    'getProject', 'listProjects', 'getProjectPipelines', 'projectProgress',
    'getTask', 'getTasks', 'explainTask', 'listAgents', 'automationRules', 'auditFor'],
  crm: ['createClient', 'assignOrderToClient'],
  ordering: ['createOrder', 'submitOrder'],
  commercial: ['reviewOrder', 'approveOrder', 'rejectOrder', 'convertOrderToProject'],
  planning: ['generateTasksFromWorkflow', 'setProjectStatus'],
  execution: ['assignTask', 'startTask', 'provideInput', 'recordOutput', 'submitTaskForReview', 'blockTask'],
  review: ['judgeQa', 'rejectTask', 'approveTask', 'completeTask'],
  admin: ['setAgentStatus', 'setKillSwitch', 'createUser', 'listUsers', 'setUserStatus', 'recoverStaleExecutions'],
  /* Starting and checking agent runs — held by staff, not by an agent. */
  agent: ['evaluateAgentEligibility', 'assignTaskToAgent'],
};

/**
 * Role -> groups. These are PEOPLE's roles. Note what `client` cannot do: a
 * client may look at their own work and nothing else.
 *
 * There is no `agent` or `system` login. The qa-reader runs inside the server
 * process and never holds a session; its authority is the agent registry's
 * allowlist, not this table. An `agent` account existed here with nothing to
 * use it — except that it could start paid model runs through /qa-reader.
 * When an agent runs out of process, it gets a role then, with a reason.
 */
const MATRIX = {
  admin: ['read', 'crm', 'ordering', 'commercial', 'planning', 'execution', 'review', 'admin', 'agent'],
  operations: ['read', 'crm', 'ordering', 'commercial', 'planning', 'execution', 'agent'],
  reviewer: ['read', 'review'],
  executor: ['read', 'execution'],
  client: [],
};

/** The roles the system knows — the matrix's own keys, so a role cannot exist
    in one place and not the other. auth.js refuses anything else at creation. */
export const ROLES = Object.keys(MATRIX);

const ALLOWED = Object.fromEntries(
  Object.entries(MATRIX).map(([role, groups]) => [role, new Set(groups.flatMap((g) => GROUPS[g] || []))]),
);

/* A client may call these, and only against their own records. */
const CLIENT_READS = new Set(['getOrder', 'orderSummary', 'getProject', 'projectProgress', 'listOrders', 'listProjects']);

export function createAuthz() {
  return {
    may(user, operation) {
      if (!user) return { allowed: false, reason: 'not signed in' };
      if (user.role === 'client') {
        return CLIENT_READS.has(operation)
          ? { allowed: true }
          : { allowed: false, reason: `a client account may not call "${operation}"` };
      }
      const set = ALLOWED[user.role];
      if (!set) return { allowed: false, reason: `unknown role "${user.role}"` };
      return set.has(operation)
        ? { allowed: true }
        : { allowed: false, reason: `the ${user.role} role may not call "${operation}"` };
    },

    assertMay(user, operation) {
      const v = this.may(user, operation);
      if (!v.allowed) throw fail('AUTHORIZATION_ERROR', v.reason);
      return true;
    },

    /**
     * THE SCOPE CHECK. Staff see everything; a client user sees only records
     * carrying their own clientId. A record that does not name a client is
     * staff-only by construction rather than by omission.
     *
     * It throws NOT_FOUND rather than AUTHORIZATION_ERROR on purpose: telling
     * somebody that a project they may not see exists is itself a disclosure.
     */
    assertCanSee(user, record, { kind = 'record' } = {}) {
      if (!user) throw fail('AUTHENTICATION_ERROR', 'not signed in');
      if (!record) throw fail('NOT_FOUND', `no such ${kind}`);
      if (user.role !== 'client') return record;
      const owner = record.clientId || (record.client && record.client.id) || null;
      if (!owner || owner !== user.clientId) throw fail('NOT_FOUND', `no such ${kind}`);
      return record;
    },

    /** The filter a listing must apply before it returns anything. */
    scope(user) {
      if (!user) throw fail('AUTHENTICATION_ERROR', 'not signed in');
      return user.role === 'client' ? { clientId: user.clientId } : {};
    },
  };
}
