/**
 * SQLITE-STORE — the repository adapter.
 *
 * THE POINT OF PHASE 2 ARRIVING HERE.
 * The domain depends on four methods: get, put, all, find. That contract was
 * written before any database existed, precisely so this file could be added
 * without the domain moving a line. It is a drop-in replacement for
 * `jsonFileStore`, and `operations-test.mjs` — written against the JSON
 * adapter — passes against this one unchanged. That is the test that the
 * abstraction was real rather than decorative.
 *
 * Each row is the domain's own document plus the few fields worth indexing.
 * `find(fn)` takes a JavaScript predicate, so it loads and filters: correct,
 * and O(n) — which is the right trade at an agency's scale and the wrong one at
 * a marketplace's. `findWhere()` is the indexed path, used by the API for
 * scoping, never by the domain.
 */

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

    delete(id) {
      const before = this.size();
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      return this.size() !== before;
    },

    size() {
      return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
    },

    /* --- beyond the contract, for the API only ---------------------------- */

    /**
     * The indexed path. Used where isolation matters — listing a client's own
     * projects must not begin by loading everybody's. The domain never calls
     * this: it would be a second way to ask a question the contract already
     * answers, and the two would drift.
     */
    findWhere(where = {}, { limit = null } = {}) {
      const keys = Object.keys(where);
      const sql = `SELECT doc FROM ${table}${keys.length ? ` WHERE ${keys.map((k) => `${k} = ?`).join(' AND ')}` : ''}`
        + (limit ? ` LIMIT ${Number(limit)}` : '');
      return db.prepare(sql).all(...keys.map((k) => where[k])).map(parse);
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
