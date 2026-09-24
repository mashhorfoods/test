/**
 * SQLITE-STORE — the repository adapter.
 *
 * THE STORE OF RECORD. The domain depends on four methods: get, put, all,
 * find. That contract was written before any database existed, precisely so
 * this file could be added without the domain moving a line — and the Phase 2
 * suite's persistence section now runs against this adapter, two separate
 * connections over one file.
 *
 * Each row is the domain's own document plus the few fields worth indexing.
 * `find(fn)` takes a JavaScript predicate, so all it can do is load every row
 * and filter. `where({ field: value })` is the indexed path: every field that
 * has a real column becomes part of the SQL WHERE, so only matching rows are
 * read and parsed, and the full filter is then re-applied to what came back,
 * so a field without a column is still honoured, just not by the index.
 */

import { matches } from '../../src/operations/repository.js';

/* Which document fields have a real column, and what it is called. The same
   facts as COLUMNS below, the other way round — kept next to it so the two
   cannot drift apart unnoticed (backend-test checks that they agree). */
export const FIELD_COLUMNS = {
  clients: { email: 'email', phone: 'phone' },
  orders: { clientId: 'client_id', projectId: 'project_id', status: 'status' },
  projects: { clientId: 'client_id', orderId: 'order_id', status: 'status' },
  tasks: { key: 'task_key', projectId: 'project_id', clientId: 'client_id', status: 'status', assignedTo: 'assigned_to' },
  audit: { projectId: 'project_id', entityId: 'entity_id', entityType: 'entity_type', actorType: 'actor_type', action: 'action' },
};

const COLUMNS = {
  clients: (r) => ({ email: r.email || null, phone: r.phone || null }),
  orders: (r) => ({ client_id: r.clientId || null, project_id: r.projectId || null, status: r.status }),
  projects: (r) => ({ client_id: r.clientId || null, order_id: r.orderId || null, status: r.status }),
  tasks: (r) => ({
    task_key: r.key, project_id: r.projectId, client_id: r.clientId || null,
    status: r.status, assigned_to: r.assignedTo || null,
  }),
  audit: (r) => ({
    project_id: r.projectId || null, entity_id: r.entityId || null,
    entity_type: r.entityType || null, actor_type: r.actorType || null, action: r.action || null,
  }),
};

export function sqliteStore(db, table) {
  const derive = COLUMNS[table];
  if (!derive) throw new Error(`sqlite-store: no column mapping for "${table}"`);
  const hasUpdatedAt = table !== 'audit';

  const cols = (record) => derive(record);
  const parse = (row) => (row ? JSON.parse(row.doc) : null);

  return {
    kind: 'sqlite',
    table,

    get(id) {
      return parse(db.prepare(`SELECT doc FROM ${table} WHERE id = ?`).get(id));
    },

    put(record) {
      if (!record || !record.id) throw new Error('sqlite-store: a record with no id cannot be stored');
      const extra = cols(record);
      const keys = Object.keys(extra);
      const now = new Date().toISOString();
      const created = record.createdAt || record.at || now;
      const updated = record.updatedAt || created;

      const names = ['id', ...keys, 'doc', 'created_at', ...(hasUpdatedAt ? ['updated_at'] : [])];
      const values = [record.id, ...keys.map((k) => extra[k]), JSON.stringify(record), created,
        ...(hasUpdatedAt ? [updated] : [])];
      const setters = names.slice(1).map((n) => `${n} = excluded.${n}`).join(', ');

      db.prepare(
        `INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})
         ON CONFLICT(id) DO UPDATE SET ${setters}`,
      ).run(...values);
      return record;
    },

    all() {
      return db.prepare(`SELECT doc FROM ${table}`).all().map(parse);
    },

    find(fn) {
      return this.all().filter(fn);
    },

    /**
     * Equality lookup through the indexes. `lastQuery` records the SQL of the
     * most recent call, so a test can assert the index was actually used
     * rather than trusting that it was.
     */
    where(fields = {}) {
      const indexed = FIELD_COLUMNS[table];
      const clauses = []; const args = [];
      for (const [field, value] of Object.entries(fields)) {
        const column = indexed[field];
        if (!column || value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          if (!value.length) return [];
          clauses.push(`${column} IN (${value.map(() => '?').join(', ')})`);
          args.push(...value);
        } else {
          clauses.push(`${column} = ?`);
          args.push(value);
        }
      }
      const sql = `SELECT doc FROM ${table}${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''}`;
      this.lastQuery = sql;
      return db.prepare(sql).all(...args).map(parse).filter(matches(fields));
    },
  };
}

/** The five stores the domain expects, all backed by one database. */
export const sqliteRepositories = (db) => ({
  clients: sqliteStore(db, 'clients'),
  orders: sqliteStore(db, 'orders'),
  projects: sqliteStore(db, 'projects'),
  tasks: sqliteStore(db, 'tasks'),
  audit: sqliteStore(db, 'audit'),
});
