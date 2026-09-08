/**
 * PACKAGE BUILDER
 *
 * Enhances the catalogue that /pricing already renders in HTML into something
 * a visitor can assemble a scope with.
 *
 * WHAT IT ADDS, AND WHAT IT DOES NOT.
 * The page carries every service, every feature, every description and every
 * price in the markup, in both languages, with no script at all. This file
 * adds three things and nothing else:
 *
 *   1. arithmetic — a running estimate, split into one-time and monthly,
 *      with anything that cannot be priced counted separately rather than
 *      guessed at;
 *   2. dependency enforcement — you cannot assemble a scope nobody could
 *      execute, and when a choice pulls another one in, the row says so;
 *   3. a message — the chosen scope, written out, in the language showing.
 *
 * If this file fails to load, the page is still a complete price list.
 *
 * EVERYTHING IT KNOWS COMES FROM THE MARKUP. There is no catalogue object
 * shipped beside it: `data-requires`, `data-supersedes`, `data-price` and the
 * rest are written into the rows by tools/build-builder.js from the same
 * source the page was generated from. So the rules the visitor meets cannot
 * disagree with the page they are standing on.
 */

const SEL = '[data-build]';

/* ---------- reading the page --------------------------------------------- */

const list = (el, sel) => Array.from(el.querySelectorAll(sel));
const ids = (el, attr) => (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean);

/** The label in the language currently showing. */
function textIn(el, ar) {
  if (!el) return '';
  const want = el.querySelector(`[data-lang-copy="${ar ? 'ar' : 'en'}"]`);
  return (want || el).textContent.trim();
}

function readRows(root) {
  const rows = new Map();
  for (const li of list(root, '.c-pick[data-feature]')) {
    const id = li.dataset.feature;
    rows.set(id, {
      id,
      el: li,
      service: li.dataset.service,
      input: li.querySelector('[data-pick]'),
      qtyWrap: li.querySelector('.c-pick__qty'),
      qtyInput: li.querySelector('[data-qty]'),
      note: li.querySelector('[data-pick-note]'),
      label: li.querySelector('.c-pick__label'),
      priceType: li.dataset.priceType,
      price: li.dataset.price ? Number(li.dataset.price) : 0,
      monthly: li.dataset.period === 'monthly',
      composedOf: ids(li, 'data-composed-of'),
      optionsDriveQty: li.hasAttribute('data-options-drive-qty'),
      tierInputs: Array.from(li.querySelectorAll('[data-tier]')),
      tierWrap: li.querySelector('.c-pick__tiers'),
      tierFactors: new Map((li.getAttribute('data-tiers') || '').split(/\s+/).filter(Boolean)
        .map((pair) => { const [id, f] = pair.split(':'); return [id, Number(f)]; })),
      optionInputs: Array.from(li.querySelectorAll('[data-option]')),
      optionWrap: li.querySelector('.c-pick__options'),
      requires: ids(li, 'data-requires'),
      recommends: ids(li, 'data-recommends'),
      conflicts: ids(li, 'data-conflicts'),
      supersedes: ids(li, 'data-supersedes'),
      selectable: Boolean(li.querySelector('[data-pick]')),
    });
  }
  return rows;
}

/* ---------- the words ----------------------------------------------------- */

/* Every string the script writes exists in both languages here, for the same
   reason the markup carries two spans: this site does not read one language's
   words in the other's voice. */
const COPY = {
  addedFor: {
    en: (name) => `Added — ${name} needs it`,
    ar: (name) => `أُضيف — ${name} يحتاجه`,
  },
  replacedBy: {
    en: (name) => `Replaced by ${name}`,
    ar: (name) => `استُبدل بـ ${name}`,
  },
  notWith: {
    en: (name) => `Not available with ${name}`,
    ar: (name) => `غير متاح مع ${name}`,
  },
  chosen: { en: (n) => `Chosen: ${n}`, ar: (n) => `المختار: ${n}` },
  included: { en: 'Included', ar: 'مشمول' },
  /* THE CURRENCY IS A WORD, and on this site it is a translated one: the
     package cards say "من 250 دولار". The first version of the scope panel
     wrote a literal "USD" into every line, so the panel said USD while the
     row it was summarising, three inches away, said دولار. The markup's own
     totals were right, because they use the site's `data-i18n="currency"`;
     only the lines this file writes were wrong. */
  currency: { en: 'USD', ar: 'دولار' },
  partOf: { en: (name) => `Included in ${name}`, ar: (name) => `مشمول ضمن ${name}` },
  covers: {
    en: (pkg, price, period) => `${pkg} covers everything you chose here — ${price} USD ${period}.`,
    ar: (pkg, price, period) => `باقة ${pkg} تغطي كل ما اخترته هنا — ${price} دولار ${period}.`,
  },
  once: { en: 'one-time', ar: 'لمرة واحدة' },
  monthlyWord: { en: 'monthly', ar: 'شهريًا' },
  quoted: { en: 'Quoted', ar: 'يُسعَّر لاحقًا' },
  quotedCount: {
    en: (n) => `${n === 1 ? 'One item' : `${n} items`} priced after we talk — nothing here is guessed at.`,
    ar: (n) => `${n === 1 ? 'بند واحد' : `${n} بنود`} تُسعَّر بعد الحديث معك — لا شيء هنا مُقدَّر بالتخمين.`,
  },
  consider: { en: 'Often taken with', ar: 'غالبًا ما يُؤخذ معه' },
  perMonth: { en: '/month', ar: 'شهريًا' },
  msgHead: {
    en: 'Hi Pixora — I built this scope on your site:',
    ar: 'مرحبًا بيكسورا — كوّنت نطاق العمل هذا على موقعكم:',
  },
  msgOnce: { en: 'One-time, from', ar: 'مرة واحدة، من' },
  msgMonthly: { en: 'Monthly, from', ar: 'شهريًا، من' },
  msgQuote: { en: 'Plus items to be quoted', ar: 'إضافة إلى بنود تُسعَّر لاحقًا' },
  msgMore: { en: (n) => `…and ${n} more`, ar: (n) => `…و${n} غيرها` },
  msgEstimate: {
    en: 'An estimate from your site, not a quotation.',
    ar: 'تقدير من موقعكم، وليس عرض سعر.',
  },
};

const say = (key, ar, ...args) => {
  const v = COPY[key][ar ? 'ar' : 'en'];
  return typeof v === 'function' ? v(...args) : v;
};

/* ---------- the machine --------------------------------------------------- */

export function initBuilder(scope = document) {
  const root = scope.querySelector(SEL);
  if (!root) return; // Every page but /pricing.

  const rows = readRows(root);
  if (!rows.size) return;

  /* WHAT THE VISITOR ACTUALLY DECIDED. Everything else on screen is derived
     from this set, every time, rather than patched as things change. A rule
     applied incrementally is a rule that is right until the order of clicks is
     unusual, and this project has spent enough time on rules that are only
     half present. */
  const manual = new Set();

  const isAr = () => (document.documentElement.lang || '').startsWith('ar');
  const nameOf = (id) => textIn(rows.get(id)?.label, isAr());

  /* A choice and everything it needs, transitively. The dependency graph is
     proven acyclic at build time; the visited set is here anyway, because
     "proven elsewhere" is how an infinite loop ships. */
  function closure(seed) {
    const out = new Set();
    const stack = [...seed];
    while (stack.length) {
      const id = stack.pop();
      if (out.has(id) || !rows.has(id)) continue;
      out.add(id);
      for (const q of rows.get(id).requires) if (rows.get(q)?.selectable) stack.push(q);
    }
    return out;
  }

  function derive() {
    const selected = closure(manual);

    /* What the selection puts out of reach. `supersedes` is one-directional —
       complete brand guidelines do not clash with the short ones, they replace
       them — so the replaced row is disabled and says why rather than
       disappearing. A row that vanishes as you tick is a row you cannot find
       again. */
    const blocked = new Map();
    for (const id of selected) {
      const r = rows.get(id);
      if (!r) continue;
      for (const sup of r.supersedes) blocked.set(sup, { reason: 'replacedBy', by: id });
      for (const c of r.conflicts) blocked.set(c, { reason: 'notWith', by: id });
    }
    /* A requirement outranks a block: if something in the selection genuinely
       needs it, it is not out of reach. build-catalogue.js refuses a catalogue
       where that could happen, so this is a safety net rather than a rule —
       and it is a net that reveals rather than hides, because the row stays
       visibly on. */
    for (const id of selected) blocked.delete(id);

    /* Why a row is on when the visitor did not tick it. Each choice's closure
       is worked out once and reused, rather than recomputed per row. */
    const pulled = new Map();
    const reach = new Map([...manual].map((m) => [m, closure([m])]));
    for (const id of selected) {
      if (manual.has(id)) continue;
      for (const [m, set] of reach) if (set.has(id)) { pulled.set(id, m); break; }
    }

    /* AND THE OTHER WAY ROUND: ALL THE PARTS ARE THE WHOLE.
       Design, development and deployment together are a complete landing page,
       so the builder says so rather than billing three lines that happen to add
       up to the same number. The owner priced the parts at 50, 50 and 20
       against a bundled 120 — identical totals, and a scope that reads
       "Additional landing page" instead of three fragments is the one a
       quotation, a project board and an agent can all act on. */
    for (const r of rows.values()) {
      if (!r.composedOf.length || selected.has(r.id)) continue;
      if (r.composedOf.every((part) => selected.has(part))) selected.add(r.id);
    }

    /* A COMPOSITE IS ITS PARTS. Choosing "Additional landing page" brings the
       design, the development and the deployment with it, at no extra charge —
       the composite already carries the published price. Choosing a part on its
       own does NOT bring the others: the dependency runs upward, so design
       alone is design alone, which is the whole reason the three exist. */
    const partOf = new Map();
    for (const id of selected) {
      for (const part of rows.get(id)?.composedOf || []) {
        if (rows.has(part)) partOf.set(part, id);
      }
    }
    for (const part of partOf.keys()) selected.add(part);

    /* Rows that are not choices — testing, deployment, handover — become
       active once everything they need is present. They cost nothing, and
       showing them active is how a visitor sees that the website they
       configured will in fact be tested and launched. */
    const active = new Set(selected);
    let grew = true;
    let guard = 0;
    while (grew && guard < 12) {
      grew = false; guard += 1;
      for (const r of rows.values()) {
        if (r.selectable || active.has(r.id)) continue;
        const serviceOn = [...active].some((id) => rows.get(id)?.service === r.service);
        if (serviceOn && r.requires.every((q) => active.has(q))) { active.add(r.id); grew = true; }
      }
    }

    return { blocked, needed: pulled, active, partOf };
  }

  function chosenOptions(r) {
    return r.optionInputs.filter((i) => i.checked).map((i) => i.value);
  }

  function tierOf(r) {
    if (!r.tierInputs.length) return null;
    const on = r.tierInputs.find((i) => i.checked);
    return on ? on.value : r.el.dataset.tierDefault || null;
  }

  function qtyOf(r) {
    /* WHERE THE PLATFORMS ARE THE QUANTITY, they are the quantity. A stepper
       beside them would be a second number saying something different. */
    if (r.optionsDriveQty) return Math.max(1, chosenOptions(r).length);
    if (!r.qtyInput) return 1;
    const n = Math.round(Number(r.qtyInput.value));
    const min = Number(r.qtyInput.min) || 1;
    const max = Number(r.qtyInput.max) || min;
    return Math.min(Math.max(Number.isFinite(n) ? n : min, min), max);
  }

  /* ---------- rendering --------------------------------------------------- */

  const scopeList = root.querySelector('[data-build-list]');
  const empty = root.querySelector('[data-build-empty]');
  const totals = root.querySelector('[data-build-totals]');
  const onceRow = root.querySelector('[data-build-once]');
  const onceAmt = root.querySelector('[data-build-once-amount]');
  const monthRow = root.querySelector('[data-build-monthly]');
  const monthAmt = root.querySelector('[data-build-monthly-amount]');
  const quoted = root.querySelector('[data-build-quoted]');
  const send = root.querySelector('[data-build-send]');
  const cheaper = root.querySelector('[data-build-cheaper]');

  /* THE PUBLISHED PACKAGES. Read once, from the JSON island beside the form.
     Every package in this catalogue is cheaper than buying its own contents one
     at a time — the build measures it on every run — so a builder that never
     mentions them is quoting a visitor a number the card above already beats. */
  let PACKAGES = [];
  try {
    const el = document.getElementById('build-packages');
    if (el) PACKAGES = JSON.parse(el.textContent || '[]');
  } catch { PACKAGES = []; }

  /* Latin numerals in both languages, because that is what the rest of the
     site prints: the package cards say 490 in Arabic too. A figure that
     changed digits with the language would not match the card beside it. */
  const money = (n) => n.toLocaleString('en-US');

  function render() {
    const ar = isAr();
    const { blocked, needed, active, partOf } = derive();

    /* --- rows --- */
    for (const r of rows.values()) {
      const b = blocked.get(r.id);
      const pulled = needed.get(r.id);

      if (r.input) {
        r.input.checked = active.has(r.id) && !b;
        r.input.disabled = Boolean(b);
      }
      r.el.dataset.state = b ? 'blocked' : (r.input?.checked || active.has(r.id) ? 'on' : '');

      let note = '';
      if (b) note = say(b.reason, ar, nameOf(b.by));
      else if (pulled) note = say('addedFor', ar, nameOf(pulled));
      if (r.note) {
        r.note.textContent = note;
        r.note.hidden = !note;
      }

      const on = Boolean(r.input && r.input.checked && !b);
      if (r.qtyWrap) r.qtyWrap.hidden = !on;
      if (r.tierWrap) r.tierWrap.hidden = !on;
      if (r.optionWrap) r.optionWrap.hidden = !on;
    }

    /* --- per-service count --- */
    for (const details of list(root, '[data-build-service]')) {
      const svc = details.dataset.buildService;
      const n = [...active].filter((id) => rows.get(id)?.service === svc && rows.get(id)?.selectable).length;
      const badge = details.querySelector('[data-build-chosen]');
      if (badge) {
        badge.textContent = n ? say('chosen', ar, n) : '';
        badge.hidden = !n;
      }
    }

    /* --- the scope --- */
    const picked = [...active].map((id) => rows.get(id)).filter(Boolean);

    let once = 0; let month = 0; let quotes = 0;
    const perService = new Map();
    const lines = [];
    const services = [...new Set(picked.map((r) => r.service))];

    for (const svc of services) {
      const details = root.querySelector(`[data-build-service="${svc}"]`);
      const svcName = textIn(details?.querySelector('.c-build__name'), ar);
      const mine = picked.filter((r) => r.service === svc);
      if (!mine.length) continue;
      lines.push({ heading: svcName });
      for (const r of mine) {
        const q = qtyOf(r);
        const tier = tierOf(r);
        let price;
        /* A PART OF A COMPOSITE IS ALREADY PAID FOR, whatever its own pricing
           says. This branch used to sit below the quote branch, so all three
           parts of a landing page reported "Custom quote" underneath the
           composite that had just charged 120 for them. */
        if (partOf.has(r.id)) {
          price = say('partOf', ar, textIn(rows.get(partOf.get(r.id))?.label, ar));
        } else if (r.priceType === 'included') price = say('included', ar);
        else if (r.priceType === 'quote') { price = say('quoted', ar); quotes += 1; }
        else {
          const factor = tier ? (r.tierFactors.get(tier) || 1) : 1;
          const counted = (r.qtyInput || r.optionsDriveQty) ? q : 1;
          const sum = Math.round(r.price * factor * counted);
          if (r.monthly) month += sum; else once += sum;
          perService.set(r.service, (perService.get(r.service) || 0) + sum);
          price = `${money(sum)} ${say('currency', ar)}${r.monthly ? ` ${say('perMonth', ar)}` : ''}`;
        }
        /* The row's name says which depth and which platforms, because a scope
           that says "Audience definition" without saying "segmentation" is a
           scope somebody has to come back and ask about. */
        const level = tier && r.tierInputs.length
          ? textIn(r.tierInputs.find((i) => i.value === tier)?.closest('.c-pick__tier')
            ?.querySelector('.c-pick__tier-label'), ar)
          : '';
        const opts = r.optionInputs.length
          ? chosenOptions(r).map((id) => textIn(
            r.optionInputs.find((i) => i.value === id)?.closest('.c-pick__option')
              ?.querySelector('.c-pick__option-label'), ar)).filter(Boolean)
          : [];
        let name = level || textIn(r.label, ar);
        if (opts.length) name += ` — ${opts.join(ar ? '، ' : ', ')}`;
        else if ((r.qtyInput || r.optionsDriveQty) && q > 1) name += ` × ${q}`;
        lines.push({ name, price });
      }
    }

    /* --- worth considering --- */
    const suggestions = [...new Set(
      [...manual].flatMap((id) => rows.get(id)?.recommends || [])
        .filter((id) => rows.has(id) && !active.has(id) && !blocked.has(id)),
    )].slice(0, 4);

    if (scopeList) {
      scopeList.textContent = '';
      for (const line of lines) {
        const li = document.createElement('li');
        if (line.heading) {
          li.className = 'c-build__chosen-head';
          const h = document.createElement('span');
          h.className = 'c-build__chosen-service';
          h.textContent = line.heading;
          li.append(h);
        } else {
          const n = document.createElement('span');
          n.textContent = line.name;
          const p = document.createElement('span');
          p.className = 'c-build__chosen-price';
          p.textContent = line.price;
          li.append(n, p);
        }
        scopeList.append(li);
      }
      if (suggestions.length) {
        const li = document.createElement('li');
        li.className = 'c-build__chosen-head';
        const h = document.createElement('span');
        h.className = 'c-build__chosen-service';
        h.textContent = say('consider', ar);
        const body = document.createElement('span');
        body.textContent = suggestions.map(nameOf).join(ar ? '، ' : ', ');
        li.append(h, body);
        scopeList.append(li);
      }
      scopeList.hidden = !lines.length;
    }

    if (empty) empty.hidden = lines.length > 0;
    if (totals) totals.hidden = !lines.length;
    if (onceRow) { onceRow.hidden = once <= 0; if (onceAmt) onceAmt.textContent = money(once); }
    if (monthRow) { monthRow.hidden = month <= 0; if (monthAmt) monthAmt.textContent = money(month); }
    if (quoted) {
      quoted.textContent = quotes ? say('quotedCount', ar, quotes) : '';
      quoted.hidden = !quotes;
    }

    /* --- does a published package already cover this? ---
       Only when the package's own contents are a SUPERSET of what was chosen
       for that service. A package that covers four of five things is not an
       answer, and saying so would be the kind of near-enough claim this site
       does not make. */
    if (cheaper) {
      const suggestions = [];
      for (const cat of PACKAGES) {
        const wanted = [...active].filter((id) => rows.get(id)?.service === cat.service
          && rows.get(id)?.selectable && !partOf.has(id));
        if (!wanted.length) continue;
        const fits = cat.tiers.filter((t) => {
          const has = new Map(t.contents.map((c) => [c.ref, c]));
          return wanted.every((id) => {
            const c = has.get(id);
            if (!c) return false;
            const r = rows.get(id);
            /* COVERING A THING IS NOT COVERING ENOUGH OF IT. A Business Website
               includes five pages; a scope with twelve is not covered by it,
               and saying otherwise would be the "prices a 2-page and a 10-page
               site identically" defect wearing a different hat. */
            const mine = qtyOf(r);
            const theirs = c.qty ?? mine;
            if (mine > theirs) return false;
            /* Nor is a shallower depth the same capability. */
            const tier = tierOf(r);
            if (tier && r.tierFactors.size) {
              const order = [...r.tierFactors.keys()];
              if (order.indexOf(c.tier) < order.indexOf(tier)) return false;
            }
            return true;
          });
        });
        if (!fits.length) continue;
        const best = fits.reduce((a, b) => (Number(a.price) <= Number(b.price) ? a : b));
        const period = say(best.billing === 'billingMonthly' ? 'monthlyWord' : 'once', ar);
        suggestions.push(say('covers', ar, best.name, money(Number(best.price)), period));
      }
      cheaper.textContent = suggestions.join(' ');
      cheaper.hidden = !suggestions.length;
    }

    /* --- the message ---
       Written in both languages and left on the data attributes contact.js
       already swaps on a language change, so this link behaves exactly like
       every other WhatsApp link on the site. */
    if (send) {
      const build = (lang) => {
        const a = lang === 'ar';
        const out = [say('msgHead', a)];
        let shown = 0;
        for (const line of lines) {
          if (line.heading) { out.push(`\n${line.heading}`); continue; }
          if (shown >= 25) continue;
          out.push(`• ${line.name} — ${line.price}`);
          shown += 1;
        }
        const hidden = lines.filter((l) => !l.heading).length - shown;
        if (hidden > 0) out.push(say('msgMore', a, hidden));
        out.push('');
        if (once > 0) out.push(`${say('msgOnce', a)} ${money(once)} ${say('currency', a)}`);
        if (month > 0) out.push(`${say('msgMonthly', a)} ${money(month)} ${say('currency', a)}`);
        if (quotes > 0) out.push(`${say('msgQuote', a)}: ${quotes}`);
        out.push(say('msgEstimate', a));
        return out.join('\n');
      };

      const base = send.dataset.waEn || '';
      const wa = /^https:\/\/wa\.me\/(\d+)/.exec(base);
      if (wa && lines.length) {
        send.dataset.waEn = `https://wa.me/${wa[1]}?text=${encodeURIComponent(build('en'))}`;
        send.dataset.waAr = `https://wa.me/${wa[1]}?text=${encodeURIComponent(build('ar'))}`;
        send.href = ar ? send.dataset.waAr : send.dataset.waEn;
      }
    }
  }

  /* ---------- events ------------------------------------------------------ */

  root.addEventListener('change', (e) => {
    const box = e.target.closest('[data-pick]');
    if (box) {
      const id = box.value;
      if (box.checked) {
        /* Choosing something drops what it replaces. Without this the short
           brand guidelines and the complete ones both stayed on and the rule
           that replaces one with the other fired on nobody — written, present
           on the page, and doing nothing. The builder's own functional test
           caught it on its first run. */
        for (const gone of [...rows.get(id).supersedes, ...rows.get(id).conflicts]) manual.delete(gone);
        manual.add(id);
      } else {
        /* Dropping something drops whatever needed it. Otherwise a visitor can
           untick "Website development" and keep the integrations that cannot
           exist without it — a scope nobody could execute, which is the exact
           thing the brief asks the builder to make impossible. */
        manual.delete(id);
        for (const m of [...manual]) if (closure([m]).has(id)) manual.delete(m);
      }
      render();
      return;
    }
    /* Depth and platform choices change the estimate without changing what is
       selected, so they only need a redraw. */
    if (e.target.closest('[data-tier]') || e.target.closest('[data-option]')) { render(); return; }

    const qty = e.target.closest('[data-qty]');
    if (qty) {
      /* CLAMP THE FIELD, not just the sum. `qtyOf` already keeps the estimate
         inside the feature's own minimum and maximum, but leaving 999 visible
         in a box whose maximum is 60 shows a visitor one number and charges
         them for another. */
      const row = rows.get(qty.dataset.qty);
      if (row) qty.value = String(qtyOf(row));
      render();
    }
  });

  /* A form on a page whose only submit action is a link. Enter in the number
     field would otherwise reload /pricing and lose the scope. */
  root.addEventListener('submit', (e) => e.preventDefault());

  /* The language can change without the page reloading, and every string this
     file writes is one of the two it holds. */
  if (typeof MutationObserver === 'function') {
    new MutationObserver(() => render())
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  render();
}
