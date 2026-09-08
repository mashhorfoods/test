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

/** Operation groups, so the matrix reads as intent rather than as a list. */
const GROUPS = {
  read: ['getClient', 'listClients', 'clientDossier', 'getOrder', 'listOrders', 'orderSummary',
    'getProject', 'listProjects', 'getProjectPipelines', 'projectProgress', 'executionProgress',
    'getTask', 'getTasks', 'explainTask', 'checkTaskReadiness', 'listAgents', 'getAgent',
    'automationRules', 'auditFor'],
  crm: ['createClient', 'updateClient', 'resolveClient', 'matchClient', 'assignOrderToClient'],
  ordering: ['createOrder', 'submitOrder', 'validateOrder'],
  commercial: ['reviewOrder', 'approveOrder', 'rejectOrder', 'cancelOrder', 'amendOrder', 'convertOrderToProject'],
  planning: ['generateTasksFromWorkflow', 'setProjectStatus', 'setPipelineStatus', 'setWorkflowStatus',
    'refreshTaskReadiness'],
  execution: ['assignTask', 'unassignTask', 'startTask', 'requestInput', 'provideInput',
    'recordOutput', 'submitTaskForReview', 'blockTask', 'unblockTask', 'retryTask'],
  review: ['judgeQa', 'passAllQa', 'rejectTask', 'approveTask', 'completeTask'],
  admin: ['cancelTask', 'escalateTask', 'setAgentStatus', 'setKillSwitch', 'createUser',
    'listUsers', 'setUserStatus', 'recoverStaleExecutions'],
  agent: ['getTaskEnvelope', 'startAgentExecution', 'submitAgentOutput', 'reportTaskFailure',
    'evaluateAgentEligibility', 'assignTaskToAgent'],
};

/**
 * Role -> groups. Note what `client` cannot do: a client may look at their own
 * work and nothing else. Note what `agent` cannot do: it has no read group, no
 * review group, and no execution group — its entire authority is the four
 * operations Phase 3 already allowlists, and approval is not among them.
 */
const MATRIX = {
  admin: ['read', 'crm', 'ordering', 'commercial', 'planning', 'execution', 'review', 'admin', 'agent'],
  operations: ['read', 'crm', 'ordering', 'commercial', 'planning', 'execution', 'agent'],
  reviewer: ['read', 'review'],
  executor: ['read', 'execution'],
  client: [],
  agent: ['agent'],
  system: ['read', 'planning'],
};

const ALLOWED = Object.fromEntries(
  Object.entries(MATRIX).map(([role, groups]) => [role, new Set(groups.flatMap((g) => GROUPS[g] || []))]),
);

/* A client may call these, and only against their own records. */
const CLIENT_READS = new Set(['getOrder', 'orderSummary', 'getProject', 'projectProgress', 'listOrders', 'listProjects']);

export function createAuthz() {
  return {
    groups: () => GROUPS,
    matrix: () => MATRIX,

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
      return user.role === 'client' ? { client_id: user.clientId } : {};
    },
  };
}
