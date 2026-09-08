/**
 * REPOSITORY — the seam between the domain and wherever records are kept.
 *
 * WHY THIS EXISTS AT ALL, given there is no database.
 * There is no backend (`docs/129` §1). The records live in JSON files in this
 * repository, written by an operator through the same GitHub Contents API the
 * admin dashboard already uses for prices. That is a real, auditable store —
 * git gives history for free — but it is not the store this will always have.
 *
 * So nothing above this line knows how a record is saved. `createOrder` calls
 * `orders.put(record)`. Whether that lands in memory, in `operations/*.json`,
 * or one day in an API, is a decision made once, at the edge, by choosing an
 * adapter. Scatter `fs.writeFileSync` through the domain and that choice is
 * made a hundred times and cannot be changed.
 *
 * A store is four methods. That is the whole contract:
 *
 *   get(id)      -> record | null
 *   put(record)  -> record            (insert or replace, by record.id)
 *   all()        -> record[]
 *   find(fn)     -> record[]
 *
 * Deliberately synchronous. The two adapters here are, the tests are, and
 * pretending otherwise would put `await` through every call site to buy
 * nothing today. An async adapter wraps this interface rather than replacing
 * it — see `docs/129` §6.
 */

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
    delete: (id) => rows.delete(id),
    size: () => rows.size,
  };
}

/**
 * Records in one JSON file, read and written whole.
 *
 * Whole-file writes are correct here and would be wrong at scale: this is an
 * agency with an operator, not a marketplace, and the file is committed to git
 * where a partial write would be a merge conflict rather than a corruption.
 * `io` is injected so this module still imports cleanly in a browser, which
 * has no `fs`.
 */
export function jsonFileStore(file, io) {
  if (!io || !io.readFileSync) throw new Error('repository: jsonFileStore needs an io with readFileSync/writeFileSync/existsSync');
  const load = () => {
    if (!io.existsSync(file)) return { version: 1, records: [] };
    const parsed = JSON.parse(io.readFileSync(file, 'utf8'));
    return { version: parsed.version || 1, records: parsed.records || [] };
  };
  const save = (doc) => io.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);

  return {
    kind: 'json-file',
    file,
    get(id) { return load().records.find((r) => r.id === id) || null; },
    put(record) {
      if (!record || !record.id) throw new Error('repository: a record with no id cannot be stored');
      const doc = load();
      const i = doc.records.findIndex((r) => r.id === record.id);
      if (i === -1) doc.records.push(record); else doc.records[i] = record;
      /* Newest last, so a git diff on this file reads as an append in the
         common case rather than a reshuffle of everything. */
      save(doc);
      return record;
    },
    all() { return load().records; },
    find(fn) { return this.all().filter(fn); },
    delete(id) {
      const doc = load();
      const before = doc.records.length;
      doc.records = doc.records.filter((r) => r.id !== id);
      save(doc);
      return doc.records.length !== before;
    },
    size() { return load().records.length; },
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
  return { clients, orders, projects, tasks: tasks || memoryStore(), audit: audit || memoryStore() };
}
