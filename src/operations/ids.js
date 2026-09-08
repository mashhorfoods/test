/**
 * IDS — stable, sortable, language-neutral identifiers.
 *
 * Every operational record needs an id that a person can read out over the
 * phone, that sorts by age without a separate date field, and that does not
 * depend on a database sequence — because there is no database (see
 * `docs/129`). So: a prefix, the date, and a short random tail.
 *
 *   ord.2026-09-08.k3f9qa
 *
 * The prefix is part of the id rather than a separate `type` column, so a bare
 * id is self-describing wherever it turns up — in a log line, in a WhatsApp
 * message, in a URL. The tail is random rather than sequential because a
 * sequence would need a counter, and a counter is state nobody is holding.
 *
 * `randomness` is injected so tests can be deterministic without the module
 * knowing it is being tested.
 */

export const PREFIXES = {
  client: 'cli',
  order: 'ord',
  project: 'prj',
  pipelineInstance: 'pin',
  workflowInstance: 'win',
  event: 'evt',
};

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // no l/o/0/1 — read aloud

/** A short random tail. Not a security token; collisions are checked by the caller. */
export function tail(length = 6, random = Math.random) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return out;
}

/** `type` must be one of PREFIXES. `now` and `random` are injected for tests. */
export function newId(type, { now = () => new Date(), random = Math.random } = {}) {
  const prefix = PREFIXES[type];
  if (!prefix) throw new Error(`ids: "${type}" is not one of ${Object.keys(PREFIXES).join(', ')}`);
  const day = now().toISOString().slice(0, 10);
  return `${prefix}.${day}.${tail(6, random)}`;
}

/** Does this id belong to that kind of record? Used by the architecture tests. */
export const isId = (type, value) =>
  typeof value === 'string' && new RegExp(`^${PREFIXES[type]}\\.\\d{4}-\\d{2}-\\d{2}\\.[a-z2-9]{6}$`).test(value);

/** The kind of record an id names, or null. */
export const typeOf = (value) => {
  const prefix = String(value || '').split('.')[0];
  return Object.keys(PREFIXES).find((k) => PREFIXES[k] === prefix) || null;
};
