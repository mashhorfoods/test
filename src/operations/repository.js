/**
 * REPOSITORY — the seam between the domain and wherever records are kept.
 *
 * The store of record is the server's SQLite database
 * (server/db/sqlite-store.js). Nothing above this line knows that.
 * `createOrder` calls `orders.put(record)`; whether that lands in memory or in
 * a database row is decided once, at the edge, by choosing an adapter. Scatter
 * writes through the domain and that choice is made a hundred times and
 * cannot be changed.
 *
 * (Until September 2026 there was also a JSON-file adapter writing committed
 * files under operations/, from before a server existed. The server never read
 * them, so there were two stores of record that could not see each other. It
 * is gone; SQLite is the one store.)
 *
 * A store is four methods. That is the whole contract:
 *
 *   get(id)      -> record | null
 *   put(record)  -> record            (insert or replace, by record.id)
 *   all()        -> record[]
 *   find(fn)     -> record[]
 *
 * and one optional fifth, which `repositories()` supplies if a store lacks it:
 *
 *   where({ field: value, … }) -> record[]
 *
 * Equality on each field; an array value means "any of these". It exists
 * because `find(fn)` hands the store an opaque function, so a database can do
 * nothing with it but load every row and let JavaScript decide. `where` says
 * WHAT is wanted, so the SQLite store can answer it with an indexed WHERE and
 * parse only the rows that match. The domain uses `where` for every lookup
 * that is plain equality and keeps `find` for the ones that are not.
 *
 * Deliberately synchronous. Both adapters are (node:sqlite is synchronous),
 * the tests are, and pretending otherwise would put `await` through every
 * call site to buy nothing today.
 */

/** Does a record match a `where` filter? The one definition of it. */
export const matches = (fields) => {
  const entries = Object.entries(fields);
  return (record) => entries.every(([k, v]) => (Array.isArray(v) ? v.includes(record[k]) : record[k] === v));
};

/** Records in memory. The tests use this; nothing is persisted. */
export function memoryStore(seed = []) {
  const rows = new Map(seed.map((r) => [r.id, structuredClone(r)]));
  return {
    kind: 'memory',
    get: (id) => (rows.has(id) ? structuredClone(rows.get(id)) : null),
    put(record) {
      if (!record || !record.id) throw new Error('repository: a record with no id cannot be stored');
      rows.set(record.id, structuredClone(record));
      return structuredClone(record);
    },
    all: () => [...rows.values()].map((r) => structuredClone(r)),
    find(fn) { return this.all().filter(fn); },
    where(fields) { return this.all().filter(matches(fields)); },
  };
}

/**
 * The stores the domain needs, named so a caller cannot mix them up.
 *
 * `tasks` and `audit` arrived with Phase 3 and are OPTIONAL: an operations
 * instance built without them is exactly Phase 2, which is how the Phase 2
 * suite goes on running untouched while the execution layer exists.
 */
export function repositories({ clients, orders, projects, tasks = null, audit = null }) {
  const required = { clients, orders, projects };
  const optional = {};
  if (tasks) optional.tasks = tasks;
  if (audit) optional.audit = audit;
  for (const [name, store] of Object.entries({ ...required, ...optional })) {
    for (const m of ['get', 'put', 'all', 'find']) {
      if (typeof (store || {})[m] !== 'function') {
        throw new Error(`repository: the "${name}" store has no ${m}() — it does not satisfy the contract`);
      }
    }
  }
  /* A store written before `where` existed still works: it gets the slow,
     correct version on top of find(). */
  const withWhere = (store) => (typeof store.where === 'function'
    ? store
    : Object.assign(Object.create(store), { where: (fields) => store.find(matches(fields)) }));
  return {
    clients: withWhere(clients),
    orders: withWhere(orders),
    projects: withWhere(projects),
    tasks: withWhere(tasks || memoryStore()),
    audit: withWhere(audit || memoryStore()),
  };
}
