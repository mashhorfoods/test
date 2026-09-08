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
    'operations/tasks.json',
    'operations/audit.json',
    'catalogue/catalogue.public.json',
    'src/data/operations/statuses.json',
    'src/data/operations/agents.json',
    'src/data/operations/automation.json',
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

  const nothingYet = !clients.length && !orders.length && !projects.length;
  if (nothingYet) {
    const empty = el('div', 'a-card');
    empty.append(el('h4', 'a-card__title', 'No clients, orders or projects yet'));
    empty.append(el('p', 'a-note',
      'Orders are created from a builder payload with "node tools/ops.mjs order create --payload <file>", '
      + 'then submitted, approved and converted; a project then generates its tasks. This screen shows what '
      + 'that produced. It is deliberately read-only: an order or a task typed into a form would skip the '
      + 'validation that makes it worth keeping.'));
    root.append(empty);
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
  if (!nothingYet) {
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
  if (!nothingYet) {
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
  if (!nothingYet) {
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

  /* --- execution: tasks, agents, automation, audit ------------------------ */
  renderExecution(root, files, { section, row, stateLabel, serviceName, clientName });


  const note = el('p', 'a-note',
    'Read-only. Orders, projects and tasks are created and moved with "node tools/ops.mjs", which validates '
    + 'every change against the catalogue and the state machines before writing. See docs/129 and docs/130.');
  root.append(note);
}

/**
 * THE EXECUTION VIEW — §56 and §68.
 *
 * What an operator has to be able to answer about any task: why it exists,
 * what created it, what it needs, who owns it, why it is blocked, what has
 * happened, what it produced, whether QA passed, whether a person must sign
 * it, and who approved or rejected it. All of that is on the record already;
 * this puts it on one screen.
 */
function renderExecution(root, files, helpers) {
  const { section, row, stateLabel } = helpers;
  const tasks = (files['operations/tasks.json'] || {}).records || [];
  const audit = (files['operations/audit.json'] || {}).records || [];
  const agents = (files['src/data/operations/agents.json'] || {}).agents || [];
  const rules = (files['src/data/operations/automation.json'] || {}).rules || [];

  /* --- tasks -------------------------------------------------------------- */
  {
    const s = section('Tasks', tasks.length);
    if (!tasks.length) {
      const c = el('div', 'a-card');
      c.append(el('h4', 'a-card__title', 'No tasks yet'));
      c.append(el('p', 'a-note', 'A project generates its tasks with "node tools/ops.mjs project tasks <projectId>". '
        + 'Running it twice creates nothing the second time.'));
      s.append(c);
    }

    /* The three an operator needs first: what is stuck, what needs a person,
       and what an agent could pick up. */
    const blocked = tasks.filter((t) => t.status === 'blocked' || t.blockedReason);
    const awaiting = tasks.filter((t) => t.status === 'review');
    const escalated = tasks.filter((t) => t.escalation);
    if (blocked.length || awaiting.length || escalated.length) {
      const c = el('div', 'a-card');
      c.append(el('h4', 'a-card__title', 'Needs attention'));
      c.append(row('Blocked', blocked.length ? blocked.map((t) => `${t.id} — ${t.blockedReason || 'waiting on a dependency'}`).join(' · ') : 'none'));
      c.append(row('In review', awaiting.length ? awaiting.map((t) => t.id).join(', ') : 'none'));
      c.append(row('Escalated', escalated.length ? escalated.map((t) => `${t.id} — ${t.escalation.reason}`).join(' · ') : 'none'));
      s.append(c);
    }

    for (const t of [...tasks].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', `${t.title || t.stageId} — ${stateLabel('task', t.status)}`));
      card.append(row('Reference', t.id));
      card.append(row('Why it exists', `stage "${t.stageId}" of ${t.workflowId}`));
      card.append(row('For', `${t.featureId}${t.quantity > 1 ? ` × ${t.quantity}` : ''}${t.pageCount ? ` · ${t.pageCount} pages` : ''}`));
      card.append(row('Project', `${t.projectId} · ${t.serviceId}`));
      card.append(row('Owner', `${t.ownerRole}${t.assignedTo ? ` → ${t.assignedTo} (${t.executorType})` : ' — unassigned'}`));
      if (t.dependencies.length) card.append(row('Waiting on', t.dependencies.join(', ')));
      if (t.blockedReason) card.append(row('Blocked', t.blockedReason));
      card.append(row('Needs', t.inputs.filter((i) => i.required && !i.satisfied).map((i) => i.description).join(' · ') || 'nothing outstanding'));
      card.append(row('Owes', t.outputs.filter((o) => o.required && !o.produced).map((o) => o.key).join(', ') || 'nothing — all produced'));
      card.append(row('QA', t.qaResult ? `${t.qaResult} (${t.qaCriteria.length} criteria)` : `not judged (${t.qaCriteria.length} criteria)`));
      card.append(row('Approval', t.approvalRequired ? (t.approvedBy ? `approved by ${t.approvedBy}` : 'required, not yet given') : 'not required'));
      card.append(row('Attempts', `${t.attemptCount} of ${t.maxAttempts}`));
      if (t.rejectionReason) card.append(row('Last rejection', t.rejectionReason));
      if (t.escalation) card.append(row('Escalated', `${t.escalation.reason} → ${t.escalation.to}`));
      card.append(row('Executable by', `${t.allowedExecutorTypes.join(' or ')}${t.aiEligible ? '' : ' (no agent)'}`));
      if (t.attempts.length) {
        const list = el('ul', 'a-list');
        for (const a of t.attempts) {
          const li = el('li', 'a-list__item a-list__item--sub');
          li.textContent = `attempt ${a.number} — ${a.executorType || '?'} ${a.executor || ''} — ${a.result || 'open'}${a.failureReason ? `: ${a.failureReason}` : ''}`;
          list.append(li);
        }
        card.append(list);
      }
      s.append(card);
    }
    root.append(s);
  }

  /* --- agents -------------------------------------------------------------- */
  {
    const s = section('AI agents', agents.length);
    const kill = (files['src/data/operations/agents.json'] || {}).globalKillSwitch;
    const head = el('div', 'a-card');
    head.append(el('h4', 'a-card__title', `Kill switch: ${kill ? 'ON — no agent can be assigned' : 'off'}`));
    head.append(el('p', 'a-note', 'Every agent below ships paused and no model is connected to any of them. '
      + 'What exists is the contract: capabilities, an allowlist, an envelope, output validation, retries and escalation.'));
    s.append(head);
    for (const a of agents) {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', `${a.name.en} — ${a.status}`));
      card.append(row('Reference', a.id));
      card.append(row('Can do', a.capabilities.join(', ')));
      card.append(row('May call', a.allowedOperations.join(', ')));
      card.append(row('At once', String(a.maxConcurrentTasks)));
      card.append(row('Integration', (a.metadata || {}).integration || 'none'));
      const mine = tasks.filter((t) => t.assignedTo === a.id);
      card.append(row('Assigned', mine.length ? mine.map((t) => t.id).join(', ') : 'none'));
      s.append(card);
    }
    root.append(s);
  }

  /* --- automation ---------------------------------------------------------- */
  {
    const s = section('Automation rules', rules.length);
    for (const r of rules) {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', `${r.name.en} — ${r.enabled ? 'enabled' : 'disabled'}`));
      card.append(row('Reference', r.id));
      card.append(row('When', r.trigger.event));
      card.append(row('It does', r.actions.map((a) => a.operation).join(', ')));
      card.append(row('At most', `${r.maxRuns} time(s) per ${r.idempotencyKey}`));
      const fired = audit.filter((e) => e.ruleId === r.id);
      card.append(row('Has run', `${fired.filter((e) => e.action === 'automation.triggered').length} time(s), skipped ${fired.filter((e) => e.action === 'automation.skipped').length}`));
      s.append(card);
    }
    root.append(s);
  }

  /* --- audit --------------------------------------------------------------- */
  {
    const recent = [...audit].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 60);
    const s = section('Audit trail', audit.length);
    if (recent.length) {
      const card = el('div', 'a-card');
      card.append(el('h4', 'a-card__title', `Most recent ${recent.length} of ${audit.length}`));
      const list = el('ul', 'a-list');
      for (const e of recent) {
        const li = el('li', 'a-list__item');
        li.textContent = `${e.at.slice(0, 19).replace('T', ' ')} · ${e.actorType}:${e.actor} · ${e.action}`
          + ` · ${e.entityId}${e.from || e.to ? ` (${e.from || '—'} → ${e.to || '—'})` : ''}${e.reason ? ` · ${e.reason}` : ''}`;
        list.append(li);
      }
      card.append(list);
      s.append(card);
    }
    root.append(s);
  }
}
