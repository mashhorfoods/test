/**
 * ADMIN-OPERATIONS — the read-only Clients / Orders / Projects views.
 *
 * WHY READ-ONLY, AND WHY THAT IS NOT A COMPROMISE.
 * The dashboard writes prices because a price is a sentence and the operator is
 * the author. An order is not a sentence — it is a commercial record, and the
 * thing that makes it worth anything is that it was validated against the
 * catalogue before it existed. Letting somebody type one into a form would
 * route around every rule in src/operations/order.js, which is the one place
 * the rules are.
 *
 * So orders are written by `node tools/ops.mjs`, which calls the domain layer,
 * and this shows what the domain layer produced. When a backend arrives, the
 * same screens point at the same domain functions over HTTP and gain their
 * buttons — the views do not change, because they were never the logic.
 *
 * Everything below is a projection. It joins operational records to the
 * catalogue for labels and holds no copy of either.
 */

/** The files this view reads, in the order it needs them. */
export const OPERATIONS_VIEW = {
  id: 'operations',
  label: { en: 'Clients, orders and projects', ar: 'العملاء والطلبات والمشاريع' },
  readOnly: true,
  files: [
    'operations/clients.json',
    'operations/orders.json',
    'operations/projects.json',
    'catalogue/catalogue.public.json',
    'src/data/operations/statuses.json',
  ],
};

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

const money = (n) => Number(n || 0).toLocaleString('en-US');
const day = (iso) => (iso ? String(iso).slice(0, 10) : '—');

/**
 * Render the three lists.
 * `files` is { path -> parsed data }, exactly what the dashboard already holds.
 */
export function renderOperations(root, files) {
  const clients = (files['operations/clients.json'] || {}).records || [];
  const orders = (files['operations/orders.json'] || {}).records || [];
  const projects = (files['operations/projects.json'] || {}).records || [];
  const cat = files['catalogue/catalogue.public.json'] || { services: [], features: [] };
  const statuses = (files['src/data/operations/statuses.json'] || {}).machines || {};

  const serviceName = (id) => {
    const s = (cat.services || []).find((x) => x.id === id);
    return s ? s.name.en : id;
  };
  const stateLabel = (machine, value) => {
    const s = ((statuses[machine] || {}).states || {})[value];
    return s ? s.label.en : value;
  };
  const clientName = (id) => (clients.find((c) => c.id === id) || {}).name || '—';

  /* --- the shape of the whole thing, in one line ------------------------- */
  const summary = el('p', 'a-note',
    `${clients.length} client${clients.length === 1 ? '' : 's'} · `
    + `${orders.length} order${orders.length === 1 ? '' : 's'} · `
    + `${projects.length} project${projects.length === 1 ? '' : 's'}`);
  root.append(summary);

  if (!clients.length && !orders.length && !projects.length) {
    const empty = el('div', 'a-card');
    empty.append(el('h4', 'a-card__title', 'Nothing here yet'));
    empty.append(el('p', 'a-note',
      'Orders are created from a builder payload with "node tools/ops.mjs order create --payload <file>", '
      + 'then submitted, approved and converted. This screen shows what that produced. '
      + 'It is deliberately read-only: an order typed into a form would skip the validation that makes it worth keeping.'));
    root.append(empty);
    return;
  }

  const section = (title, count) => {
    const s = el('details', 'a-group');
    s.open = count > 0;
    const sum = el('summary', 'a-group__title');
    sum.append(el('span', null, title));
    const n = el('span', 'a-group__count', String(count));
    n.dataset.n = String(count);
    sum.append(n);
    s.append(sum);
    return s;
  };

  const row = (label, value) => {
    const p = el('p', 'a-kv');
    p.append(el('span', 'a-kv__k', label));
    p.append(el('span', 'a-kv__v', value));
    return p;
  };

  /* --- clients ------------------------------------------------------------ */
  {
    const s = section('Clients', clients.length);
    for (const c of clients) {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', c.name));
      card.append(row('Reference', c.id));
      if (c.company) card.append(row('Company', c.company));
      if (c.email) card.append(row('Email', c.email));
      if (c.phone) card.append(row('Phone', c.phone));
      card.append(row('Reads', c.preferredLanguage === 'ar' ? 'Arabic' : 'English'));
      const mine = orders.filter((o) => o.clientId === c.id);
      const theirs = projects.filter((p) => p.clientId === c.id);
      card.append(row('Orders', mine.length ? mine.map((o) => o.id).join(', ') : 'none'));
      card.append(row('Projects', theirs.length ? theirs.map((p) => p.id).join(', ') : 'none'));
      card.append(row('Added', day(c.createdAt)));
      /* A client the system was unsure about is worth an operator's eye. */
      if ((c.events || []).some((e) => e.event === 'client.review_required')) {
        card.append(el('p', 'a-field__error',
          'This may be the same person as an existing client — the system would not merge them on a name alone.'));
      }
      s.append(card);
    }
    root.append(s);
  }

  /* --- orders -------------------------------------------------------------- */
  {
    const s = section('Orders', orders.length);
    for (const o of [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))) {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', `${o.id} — ${stateLabel('order', o.status)}`));
      card.append(row('Client', `${clientName(o.clientId)}${o.clientId ? ` (${o.clientId})` : ''}`));
      card.append(row('Services', (o.scope.services || []).map(serviceName).join(', ') || '—'));
      const t = o.pricing.total || {};
      const parts = [];
      if (t.oneTime) parts.push(`${money(t.oneTime)} ${o.pricing.currency} one-time`);
      if (t.monthly) parts.push(`${money(t.monthly)} ${o.pricing.currency} monthly`);
      card.append(row('Total', parts.join(' + ') || '—'));
      card.append(row('Lines', String((o.items || []).length)));

      /* The scope, as bought: what was chosen, what came included, what is an
         add-on, and what is part of something already paid for. */
      const list = el('ul', 'a-list');
      for (const i of o.items || []) {
        const li = el('li', 'a-list__item');
        const qty = i.quantity > 1 ? ` × ${i.quantity}` : '';
        const price = i.partOf
          ? `included in ${i.partOf}`
          : (i.pricingSnapshot.amount
            ? `${money(i.pricingSnapshot.amount)} ${i.pricingSnapshot.currency}${i.pricingSnapshot.billing === 'monthly' ? '/month' : ''}`
            : 'included');
        li.textContent = `${i.featureId}${qty} — ${price} · ${i.origin}${i.tier ? ` · ${i.tier}` : ''}`;
        list.append(li);
      }
      card.append(list);

      if (o.scope.limits && o.scope.limits.pages !== undefined) card.append(row('Pages', String(o.scope.limits.pages)));
      if ((o.amendments || []).length) card.append(row('Amendments', String(o.amendments.length)));
      card.append(row('Project', o.projectId || 'not converted'));
      card.append(row('Created', day(o.createdAt)));
      s.append(card);
    }
    root.append(s);
  }

  /* --- projects ------------------------------------------------------------ */
  {
    const s = section('Projects', projects.length);
    for (const p of [...projects].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))) {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', `${p.name} — ${stateLabel('project', p.status)}`));
      card.append(row('Reference', p.id));
      card.append(row('Client', `${clientName(p.clientId)} (${p.clientId})`));
      card.append(row('From order', p.orderId));
      const wf = p.pipelines.flatMap((x) => x.workflows);
      const done = wf.filter((w) => w.status === 'completed').length;
      card.append(row('Progress', `${done} of ${wf.length} pieces of work complete`));
      if (p.limits && p.limits.pages !== undefined) card.append(row('Pages', String(p.limits.pages)));

      const list = el('ul', 'a-list');
      for (const pl of p.pipelines) {
        const head = el('li', 'a-list__item');
        head.textContent = `${serviceName(pl.serviceId)} — ${stateLabel('pipelineInstance', pl.status)}`
          + ` · ${pl.workflows.length} workflow${pl.workflows.length === 1 ? '' : 's'}`
          + ` · now at ${pl.currentStageId || '—'}`;
        list.append(head);
        for (const w of pl.workflows) {
          const li = el('li', 'a-list__item a-list__item--sub');
          li.textContent = `${w.featureId}${w.quantity > 1 ? ` × ${w.quantity}` : ''}`
            + ` — ${stateLabel('workflowInstance', w.status)} · ${w.origin}`
            + (w.expected && w.expected.duration ? ` · ~${w.expected.duration.value} ${w.expected.duration.unit}` : '');
          list.append(li);
        }
      }
      card.append(list);
      card.append(row('Created', day(p.createdAt)));
      s.append(card);
    }
    root.append(s);
  }

  const note = el('p', 'a-note',
    'Read-only. Orders are created and moved with "node tools/ops.mjs", which validates every line against '
    + 'the catalogue before writing. See docs/129.');
  root.append(note);
}
