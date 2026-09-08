/**
 * CLIENT — who asked, and nothing more than that.
 *
 * The brief is explicit that this is not a sales CRM, and the shape reflects
 * it: a name, a way to reach them, the language they read in. No lead score,
 * no pipeline stage, no last-touched-by. Those are a different product.
 *
 * WHAT IS DELIBERATELY ABSENT. No password, no payment details, no identity
 * document, no address. The public site asks for none of those and neither
 * does this: a field that exists gets filled, and a field that gets filled has
 * to be protected. There is no backend here (`docs/129` §1), so the safest
 * store for sensitive data is the one that does not hold it.
 *
 * MATCHING. Deterministic, and it stops rather than guesses. A normalised
 * email match is an identity; a similar name is a coincidence, and merging on a
 * coincidence merges two people's projects. Where it is unsure it says so and
 * leaves the decision to an operator.
 */

import { newId } from './ids.js';
import { EVENTS, record } from './events.js';

/** Lower-cased and trimmed. Nothing cleverer: `a.b@x.com` and `ab@x.com` are
    the same mailbox at Gmail and different mailboxes almost everywhere else,
    and guessing which is how you send an invoice to a stranger. */
export const normaliseEmail = (v) => String(v || '').trim().toLowerCase() || null;

/** Digits only, so +249 96 267 2192 and +249962672192 are one number. */
export const normalisePhone = (v) => {
  const digits = String(v || '').replace(/[^\d]/g, '');
  return digits ? digits.replace(/^0+/, '') : null;
};

export function createClient(input, { now = () => new Date(), random = Math.random, by = 'operator' } = {}) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('client: a client must have a name');
  const at = now().toISOString();

  const client = {
    id: newId('client', { now, random }),
    name,
    email: normaliseEmail(input.email),
    phone: normalisePhone(input.phone),
    company: String(input.company || '').trim() || null,
    preferredLanguage: input.preferredLanguage === 'ar' ? 'ar' : 'en',
    /* How they reached us. The site offers WhatsApp and email; this records
       which, so nobody replies down a channel the client never used. */
    source: input.source || null,
    notes: [],
    createdAt: at,
    updatedAt: at,
    events: [],
  };
  record(client, EVENTS.CLIENT_CREATED, { at, by });
  return client;
}

/**
 * Find who this is, or say that you cannot.
 *
 * Returns { match, confidence, candidates }:
 *   'id'     an explicit clientId was given and resolves        — certain
 *   'email'  one client has that exact normalised email         — certain
 *   'phone'  one client has that exact normalised phone         — certain
 *   'review' more than one candidate, or a name-only near miss  — a person decides
 *   null     nobody                                             — create one
 *
 * There is no fuzzy name matching, on purpose. Two clients called "Al Mada"
 * may be one company or two, and the system cannot tell. `review` is the
 * honest answer and costs an operator ten seconds; a wrong merge costs a
 * client's project history.
 */
export function matchClient(input, clients) {
  const all = clients.all();

  if (input.clientId) {
    const byId = clients.get(input.clientId);
    if (byId) return { match: byId, confidence: 'id', candidates: [byId] };
    return { match: null, confidence: 'review', candidates: [], reason: `clientId ${input.clientId} does not exist` };
  }

  const email = normaliseEmail(input.email);
  if (email) {
    const hits = all.filter((c) => c.email === email);
    if (hits.length === 1) return { match: hits[0], confidence: 'email', candidates: hits };
    if (hits.length > 1) return { match: null, confidence: 'review', candidates: hits, reason: `${hits.length} clients share the email ${email}` };
  }

  const phone = normalisePhone(input.phone);
  if (phone) {
    const hits = all.filter((c) => c.phone === phone);
    if (hits.length === 1) return { match: hits[0], confidence: 'phone', candidates: hits };
    if (hits.length > 1) return { match: null, confidence: 'review', candidates: hits, reason: `${hits.length} clients share the phone ${phone}` };
  }

  /* A name we have seen before, with no contact detail to confirm it. Not a
     match — a question. */
  const name = String(input.name || '').trim().toLowerCase();
  if (name) {
    const sameName = all.filter((c) => c.name.trim().toLowerCase() === name);
    if (sameName.length) {
      return {
        match: null,
        confidence: 'review',
        candidates: sameName,
        reason: `${sameName.length} existing client(s) are also called "${input.name}" — a name is not an identity`,
      };
    }
  }

  return { match: null, confidence: null, candidates: [] };
}

/**
 * Find them or make them. Returns the client and how it was decided, so a
 * caller can surface a review rather than discovering the merge later.
 */
export function resolveClient(input, clients, opts = {}) {
  const found = matchClient(input, clients);
  if (found.match) return { client: found.match, created: false, confidence: found.confidence };
  if (found.confidence === 'review') {
    const created = clients.put(createClient(input, opts));
    record(created, EVENTS.CLIENT_REVIEW_REQUIRED, {
      at: created.createdAt,
      by: opts.by || 'operator',
      data: { reason: found.reason, candidates: found.candidates.map((c) => c.id) },
    });
    clients.put(created);
    return { client: created, created: true, confidence: 'review', reason: found.reason, candidates: found.candidates.map((c) => c.id) };
  }
  const created = clients.put(createClient(input, opts));
  return { client: created, created: true, confidence: 'new' };
}

/** Update the contactable facts. Identity fields are replaced, never merged. */
export function updateClient(client, patch, { now = () => new Date(), by = 'operator' } = {}) {
  const at = now().toISOString();
  const next = { ...client };
  if (patch.name !== undefined) next.name = String(patch.name).trim();
  if (patch.email !== undefined) next.email = normaliseEmail(patch.email);
  if (patch.phone !== undefined) next.phone = normalisePhone(patch.phone);
  if (patch.company !== undefined) next.company = String(patch.company || '').trim() || null;
  if (patch.preferredLanguage !== undefined) next.preferredLanguage = patch.preferredLanguage === 'ar' ? 'ar' : 'en';
  next.updatedAt = at;
  record(next, EVENTS.CLIENT_UPDATED, { at, by, data: { fields: Object.keys(patch) } });
  return next;
}

/** Everything this client has asked for, newest first. */
export const ordersOf = (clientId, orders) =>
  orders.find((o) => o.clientId === clientId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

/** Everything being built for them. */
export const projectsOf = (clientId, projects) =>
  projects.find((p) => p.clientId === clientId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
