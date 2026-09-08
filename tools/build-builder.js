/* =============================================================================
   BUILD-BUILDER
   Renders the two surfaces that read the catalogue:

     1. THE ADD-ONS SECTION on the homepage, between ADDONS:START/END.
        It used to be hand-typed markup — eleven items with hard-coded prices,
        hand-typed index numbers 01–11 and hand-typed group counts, one of
        which (Company Profile) had no Arabic label at all. docs/124 §1.4.

     2. THE PACKAGE BUILDER on /pricing, between BUILDER:START/END.
        Five services, every feature the studio sells, with what it costs, what
        it needs before it can be done, and what it replaces.

   BOTH ARE THE SAME DATA. An add-on is a catalogue feature that carries an
   `addonGroup`; a builder row is the same feature without that being
   interesting. Which is the point: adding a twelfth add-on is one field on one
   feature, and it appears in both places, in both languages, numbered.

   WHAT THIS DELIBERATELY DOES NOT RENDER.
   It reads catalogue/catalogue.public.json, not the catalogue itself. That
   file is a projection built from an ALLOWLIST — so a workflow id, an
   execution step, an automation rating or an effort estimate cannot arrive
   here by being added upstream. The brief is explicit that a visitor sees none
   of it, and the way to keep a rule like that is to make the data unavailable
   rather than to remember not to print it.

   WITH JAVASCRIPT OFF the builder is a complete, readable catalogue: five
   collapsed groups, every feature named and described, every price printed
   beside it. What JavaScript adds is the arithmetic and the dependency
   enforcement — not the information.

   Run:  node tools/build-builder.js   (build.js runs it after build-pricing)
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CATALOGUE = path.join(ROOT, 'catalogue/catalogue.public.json');

if (!fs.existsSync(CATALOGUE)) {
  console.error('build-builder: run tools/build-catalogue.js first.');
  process.exit(1);
}

const C = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const WHATSAPP = (CONFIG.contact || {}).whatsapp || '';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* The site's own bilingual pair. Two spans, both in the markup, so the page
   works with JavaScript off and both languages are crawlable. */
const pair = (v) => `<span data-lang-copy="en">${esc(v.en)}</span>`
  + `<span data-lang-copy="ar" lang="ar">${esc(v.ar)}</span>`;

const byId = new Map(C.features.map((f) => [f.id, f]));
const label = (f) => f.addonName || f.name;

/* A DOM ID, NOT A FEATURE ID. `feat.branding.logo` is a legal HTML id and an
   illegal CSS selector — `#pick-feat.branding.logo` reads as an id plus two
   classes — so anything that reaches an id attribute loses its dots. The
   feature id itself stays intact on `data-feature`, which is what the script
   keys on. */
const domId = (id) => id.replace(/\./g, '-');

/* Indent a generated block to sit correctly inside the markup around it. */
const indent = (block, spaces) => block.split('\n')
  .map((l) => (l.trim() ? ' '.repeat(spaces) + l : l)).join('\n');

/* ========================================================================== */
/* 1 — ADD-ONS                                                                */
/* ========================================================================== */

const addons = C.features.filter((f) => f.addonGroup).sort((a, b) => a.addonOrder - b.addonOrder);

/* "By project" covers both the quote-only rows and the ones scoped per
   project: in each case the figure beside the name would be a guess, and the
   brief says show a custom quote rather than invent one. A `project` row does
   have a floor, so it still prints one; a `quote` row prints no number at
   all. */
function addonPrice(f) {
  if (f.pricing.type === 'quote') {
    return `                <span class="c-addon__quote">${pair({ en: 'By project', ar: 'حسب المشروع' })}</span>`;
  }
  return `                <span class="c-addon__price">
                  <span class="c-addon__from" data-i18n="priceFrom">From</span>
                  <span class="c-addon__figure">
                    <span class="c-addon__amount">${esc(f.pricing.from)}</span>
                    <span class="c-addon__currency" data-i18n="currency">USD</span>
                  </span>
                </span>`;
}

function renderAddons() {
  const groups = [...C.addonGroups].sort((a, b) => a.order - b.order);
  const blocks = groups.map((g, gi) => {
    const items = addons.filter((f) => f.addonGroup === g.id);
    const count = C.addonCounts[String(items.length)];
    if (!count) throw new Error(`build-builder: no counted noun phrase for ${items.length} add-ons — add one to addon-groups.json`);
    return `            <details class="c-addons__group" data-reveal-group${gi === 0 ? ' open' : ''}>
              <summary class="c-addons__summary">
                <h3 class="t-label c-addons__category">
                <span>${pair(g.label)}</span>
                <span class="c-addons__count" aria-hidden="true">${items.length}</span>
                <span class="u-visually-hidden"><span>${pair(count)}</span></span>
                  <span class="c-addons__mark" aria-hidden="true"></span>
                </h3>
              </summary>
              <ul class="c-addons__grid" role="list">
${items.map((f) => `              <li class="c-addon${f.pricing.type === 'quote' ? ' c-addon--custom' : ''}">
                <span class="c-addon__index" aria-hidden="true">${String(f.addonOrder).padStart(2, '0')}</span>
                <span class="c-addon__name">${pair(label(f))}</span>
${addonPrice(f)}
              </li>`).join('\n')}
              </ul>
            </details>`;
  });

  return `<!-- ADDONS:START -->
          <div class="c-addons">
${blocks.join('\n\n')}
          </div>
          <!-- ADDONS:END -->`;
}

/* ========================================================================== */
/* 2 — THE BUILDER                                                            */
/* ========================================================================== */

const SERVICES = [...C.services].sort((a, b) => a.order - b.order);

/* HOW A PRICE IS SHOWN, and the five kinds the brief asks be distinguishable.
   The word beside a feature is the whole of what a visitor needs to know
   about how it is charged, and it is never a number we do not have. */
const PRICE_KIND = {
  included: { en: 'Included', ar: 'مشمول' },
  fixed: { en: 'From', ar: 'من' },
  unit: { en: 'From', ar: 'من' },
  project: { en: 'From', ar: 'من' },
  quote: { en: 'Custom quote', ar: 'عرض سعر خاص' },
};

const PER_MONTH = { en: 'per month', ar: 'شهريًا' };

function priceCell(f) {
  const p = f.pricing;
  if (p.type === 'included') {
    return `<span class="c-pick__price c-pick__price--included">${pair(PRICE_KIND.included)}</span>`;
  }
  if (p.type === 'quote') {
    return `<span class="c-pick__price c-pick__price--quote">${pair(PRICE_KIND.quote)}</span>`;
  }
  const per = p.type === 'unit'
    ? ` <span class="c-pick__per">${pair({ en: `per ${p.unit.en}`, ar: `لكل ${p.unit.ar}` })}</span>`
    : '';
  const month = p.period === 'monthly'
    ? ` <span class="c-pick__per">${pair(PER_MONTH)}</span>`
    : '';
  return `<span class="c-pick__price">`
    + `<span class="c-pick__from">${pair(PRICE_KIND[p.type])}</span> `
    + `<span class="c-pick__amount">${esc(p.from)}</span> `
    + `<span class="c-pick__currency" data-i18n="currency">USD</span>${per}${month}</span>`;
}

/* The quantity control. `hidden` until a feature is selected, because a
   stepper beside an unchosen thing is a control that does nothing. With no
   JavaScript it stays hidden and the price line still says "per post", which
   is the information the stepper would have carried. */
/* DEPTH, offered as a choice on the row rather than as two rows.
   `content strategy` and `complete content strategy` are one capability at two
   depths, and publishing them as two tickable lines was how the packages ended
   up describing the same work twice. Radios, because the levels are exclusive
   and a native radio group already carries the keyboard behaviour, the grouping
   and the announcement a custom control would have to rebuild. */
function tierCell(f) {
  if (!f.tiers) return '';
  const name = `tier-${domId(f.id)}`;
  return `
                      <span class="c-pick__tiers" hidden role="group" aria-label="${esc(f.name.en)}">
${f.tiers.levels.map((l) => `                        <span class="c-pick__tier">
                          <input class="c-pick__tier-input" type="radio" name="${name}" id="${name}-${l.id}"
                            value="${l.id}" data-tier="${f.id}"${l.id === f.tiers.default ? ' checked' : ''}>
                          <label class="c-pick__tier-label" for="${name}-${l.id}">${pair(l.name)}</label>
                          <span class="c-pick__tier-scope">${pair(l.description)}</span>
                        </span>`).join('\n')}
                      </span>`;
}

/* WHICH PLATFORMS, not how many. The quantity follows the selection, so a scope
   records Google Ads and Meta Ads rather than "2" — the difference between
   something a quotation can act on and something it has to guess at. */
function optionCell(f) {
  if (!f.options) return '';
  return `
                      <span class="c-pick__options" hidden role="group" aria-label="${esc(f.options.label.en)}">
                        <span class="c-pick__options-label">${pair(f.options.label)}</span>
${f.options.choices.map((c) => `                        <span class="c-pick__option">
                          <input class="c-pick__option-input" type="checkbox" id="opt-${domId(f.id)}-${domId(c.id)}"
                            value="${c.id}" data-option="${f.id}">
                          <label class="c-pick__option-label" for="opt-${domId(f.id)}-${domId(c.id)}">${pair(c.name)}${
  c.covers ? `<span class="c-pick__option-covers">${pair(c.covers)}</span>` : ''}</label>
                        </span>`).join('\n')}
                      </span>`;
}

/* A composite says what it is made of, in the visitor's words. The parts are
   separately selectable rows in the same list; this is the sentence that stops
   "Additional landing page" looking like it competes with them. */
function composedCell(f) {
  if (!f.composedOf) return '';
  const parts = f.composedOf.map((id) => byId.get(id)).filter(Boolean);
  if (!parts.length) return '';
  return `
                      <span class="c-pick__composed">${pair({
    en: `Covers ${parts.map((p) => p.name.en.toLowerCase()).join(', ')}.`,
    ar: `يشمل ${parts.map((p) => p.name.ar).join('، ')}.`,
  })}</span>`;
}

function qtyCell(f) {
  if (f.pricing.type !== 'unit') return '';
  /* No stepper where the options ARE the quantity: two controls for one number
     are two ways to disagree. */
  if (f.options && f.options.drivesQuantity) return '';
  const p = f.pricing;
  return `
                <span class="c-pick__qty" hidden>
                  <label class="u-visually-hidden" for="qty-${domId(f.id)}">${pair({
    en: `How many ${p.unitPlural.en}`, ar: `كم عدد ${p.unitPlural.ar}`,
  })}</label>
                  <input class="c-pick__qty-input" id="qty-${domId(f.id)}" type="number"
                    inputmode="numeric" value="${p.defaultQty}" min="${p.minQty}" max="${p.maxQty}" step="1"
                    data-qty="${f.id}">
                  <span class="c-pick__qty-unit" aria-hidden="true">${pair(p.unitPlural)}</span>
                </span>`;
}

function pickRow(f) {
  const d = f.dependencies;
  const data = [
    `data-feature="${f.id}"`,
    `data-service="${f.service}"`,
    `data-price-type="${f.pricing.type}"`,
    f.pricing.from !== undefined ? `data-price="${f.pricing.from}"` : '',
    f.pricing.period === 'monthly' ? 'data-period="monthly"' : '',
    d.requires.length ? `data-requires="${d.requires.join(' ')}"` : '',
    d.recommends.length ? `data-recommends="${d.recommends.join(' ')}"` : '',
    d.conflicts.length ? `data-conflicts="${d.conflicts.join(' ')}"` : '',
    d.supersedes.length ? `data-supersedes="${d.supersedes.join(' ')}"` : '',
    f.composedOf ? `data-composed-of="${f.composedOf.join(' ')}"` : '',
    f.tiers ? `data-tiers="${f.tiers.levels.map((l) => `${l.id}:${l.priceFactor}`).join(' ')}"` : '',
    f.tiers ? `data-tier-default="${f.tiers.default}"` : '',
    f.options && f.options.drivesQuantity ? 'data-options-drive-qty' : '',
    /* An add-on is a published thing with its own id, and the structured order
       has to be able to say "this line is the Additional website page add-on"
       rather than leaving a consumer to infer it from the price type. */
    f.addonGroup ? `data-addon-group="${f.addonGroup}"` : '',
  ].filter(Boolean).join(' ');

  return `                  <li class="c-pick" ${data}>
                    <label class="c-pick__control">
                      <!-- THE INPUT COVERS THE WHOLE LABEL. A native checkbox
                           is 18px, and 18px is not a tap target: responsive.js
                           failed this page for sixty-four of them at three
                           widths. Stretching the input over the row it labels
                           gives a real 44px+ target without replacing the
                           control — it is still a checkbox, still focusable,
                           still announced as one, and the box beside the name
                           is what you see rather than what you press. -->
                      <input class="c-pick__input" type="checkbox" id="pick-${domId(f.id)}" value="${f.id}" data-pick>
                      <span class="c-pick__box" aria-hidden="true"></span>
                      <span class="c-pick__label">${pair(label(f))}</span>
                    </label>
                    <span class="c-pick__body">
                      <span class="c-pick__desc">${pair(f.description)}</span>
                      ${priceCell(f)}${qtyCell(f)}${composedCell(f)}
                      <span class="c-pick__note" data-pick-note hidden></span>${tierCell(f)}${optionCell(f)}
                    </span>
              </li>`;
}

/* FEATURES THAT ARE NOT CHOICES. Responsive implementation, testing,
   deployment and handover are not things a buyer picks; they are things that
   happen because something else was picked. Showing them as unticked
   checkboxes would invite a visitor to build a website that is never tested.
   They are listed, so nothing is hidden, and they are not selectable. */
function includedRow(f) {
  return `                  <li class="c-pick c-pick--fixed" data-feature="${f.id}" data-service="${f.service}"
                        data-price-type="included"${f.dependencies.requires.length ? ` data-requires="${f.dependencies.requires.join(' ')}"` : ''}>
                    <span class="c-pick__control"><span class="c-pick__tick" aria-hidden="true"></span>
                      <span class="c-pick__label">${pair(label(f))}</span></span>
                    <span class="c-pick__body">
                      <span class="c-pick__desc">${pair(f.description)}</span>
                      <span class="c-pick__price c-pick__price--included">${pair(PRICE_KIND.included)}</span>
                    </span>
              </li>`;
}

function serviceBlock(s) {
  const mine = C.features.filter((f) => f.service === s.id);
  const choices = mine.filter((f) => f.selectable !== false);
  const fixed = mine.filter((f) => f.selectable === false);

  /* The composed service sells no feature of its own: it is the other four,
     run together, and its price is whatever the chosen scope is. So it offers
     the four rather than a fifth list — and says so. */
  if (!mine.length && s.composes) {
    return `            <details class="c-build__service c-build__service--composed" data-build-service="${s.id}">
              <summary class="c-build__summary">
                <span class="c-build__name">${pair(s.name)}</span>
                <span class="c-build__meta">${pair({ en: 'Custom quote', ar: 'عرض سعر خاص' })}</span>
                <span class="c-build__mark" aria-hidden="true"></span>
              </summary>
              <div class="c-build__panel">
                <p class="c-build__desc">${pair(s.description)}</p>
                <p class="c-build__composed">${pair({
    en: 'Choose from any of the four above and we will run them as one project rather than four.',
    ar: 'اختر من الخدمات الأربع أعلاه وسنُدير ما تختاره كمشروع واحد لا كأربعة مشاريع.',
  })}</p>
              </div>
            </details>`;
  }

  /* ALL FIVE SHIP CLOSED, and that is a measurement rather than a taste.
     The add-ons section opens its first group so a visitor lands on real
     prices rather than five shut doors, and the same instinct opened Branding
     here — which is twenty-four features, four screenfuls on a phone, in
     front of the other four services. The builder ran 6.2 screens closed at
     390px and 1.6 with everything shut.

     The point of this surface is choosing a SERVICE first; burying four of
     them under the first one's feature list is the same mistake /pricing
     itself was built to fix (docs/84 §2.1). The scope panel carries the
     instruction instead. */
  return `            <details class="c-build__service" data-build-service="${s.id}">
              <summary class="c-build__summary">
                <span class="c-build__name">${pair(s.name)}</span>
                <span class="c-build__meta">
                  <!-- NOT "${'${n}'} options". Arabic agrees a counted noun with its
                       number three different ways, so a numeral with a noun
                       glued on is wrong for most values of the numeral — the
                       same trap build-pricing.js hit with package counts. This
                       phrase carries no counted noun at all, and the chosen
                       indicator beside it is a label and a figure. -->
                  <span class="c-build__count">${pair({
    en: 'Choose what you need', ar: 'اختر ما تحتاجه',
  })}</span>
                  <span class="c-build__chosen" data-build-chosen hidden></span>
                </span>
                <span class="c-build__mark" aria-hidden="true"></span>
              </summary>
              <div class="c-build__panel">
                <p class="c-build__desc">${pair(s.description)}</p>
${s.note ? `                <p class="c-build__note">${pair(s.note)}</p>\n` : ''}                <ul class="c-build__list" role="list">
${choices.map(pickRow).join('\n')}
                </ul>
${fixed.length ? `                <p class="t-label c-build__included-title">${pair({
    en: 'Included when you take this service', ar: 'مشمول عند اختيار هذه الخدمة',
  })}</p>
                <ul class="c-build__list c-build__list--fixed" role="list">
${fixed.map(includedRow).join('\n')}
                </ul>\n` : ''}              </div>
            </details>`;
}

const waHref = (text) => (WHATSAPP
  ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
  : '#contact');

const NEW_TAB = WHATSAPP
  ? '<span class="u-visually-hidden"><span data-lang-copy="en"> (opens in a new tab)</span>'
    + '<span data-lang-copy="ar" lang="ar"> (يفتح في نافذة جديدة)</span></span>'
  : '';

function renderBuilder() {
  /* WHAT THE PACKAGES CONTAIN, for the comparison above. A JSON island rather
     than attributes on twelve invisible elements: it is data, it is not
     executed, it is crawlable, and it is the one thing on this page the script
     cannot read off the rows it is standing on. */
  const packageData = JSON.stringify(C.packages.map((cat) => ({
    service: cat.service,
    name: cat.name,
    tiers: cat.tiers.map((t) => ({
      id: t.id, name: t.name, price: t.price, from: t.priceFrom, billing: t.billing, contents: t.contents,
    })),
  }))).replace(/</g, '\\u003c');

  /* THE RULES THE PAYLOAD NEEDS THAT ARE NOT ON A ROW. The page allowance is a
     business rule authored in services.json; it is written here rather than
     re-derived in the script, so the browser and the validator read the same
     sentence. */
  const allowance = JSON.stringify((C.services.find((s) => s.pageAllowance) || {}).pageAllowance || null)
    .replace(/</g, '\\u003c');

  return `<!-- BUILDER:START -->
          <script type="application/json" id="build-packages">${packageData}</script>
          <form class="c-build" id="build-form" novalidate data-build
            data-currency="${esc(C.currency || 'USD')}" data-page-allowance='${allowance}'>
            <div class="c-build__grid">
              <div class="c-build__services">
${indent(SERVICES.map(serviceBlock).join('\n\n'), 4)}
              </div>

              <aside class="c-build__scope" aria-labelledby="build-scope-title">
                <h3 class="t-label c-build__scope-title" id="build-scope-title">${pair({
    en: 'Your scope', ar: 'نطاق مشروعك',
  })}</h3>

                <!-- THE ONLY LIVE REGION HERE, and polite. The list below it
                     changes on every tick; announcing each change as it
                     happened would talk over someone still choosing. -->
                <p class="c-build__empty" data-build-empty>${pair({
    en: 'Nothing chosen yet. Tick what you need and it appears here with a running estimate.',
    ar: 'لم تختر شيئًا بعد. حدّد ما تحتاجه وسيظهر هنا مع تقدير متغيّر.',
  })}</p>

                <ul class="c-build__chosen-list" role="list" data-build-list hidden></ul>

                <div class="c-build__totals" data-build-totals hidden>
                  <p class="c-build__total" data-build-once hidden>
                    <span class="c-build__total-label">${pair({ en: 'One-time, from', ar: 'مرة واحدة، من' })}</span>
                    <span class="c-build__total-figure"><span data-build-once-amount>0</span>
                      <span data-i18n="currency">USD</span></span>
                  </p>
                  <p class="c-build__total" data-build-monthly hidden>
                    <span class="c-build__total-label">${pair({ en: 'Monthly, from', ar: 'شهريًا، من' })}</span>
                    <span class="c-build__total-figure"><span data-build-monthly-amount>0</span>
                      <span data-i18n="currency">USD</span></span>
                  </p>
                  <p class="c-build__quoted" data-build-quoted hidden></p>
                </div>

                <!-- WHEN A PUBLISHED PACKAGE COVERS THE SCOPE FOR LESS, SAY SO.
                     Every package here is cheaper than buying its own contents
                     one at a time — by between 1.13x and 2.52x, measured on
                     every build. A builder that knows that and stays quiet is
                     quoting somebody 1,636 a month for something the card above
                     sells at 650. -->
                <p class="c-build__cheaper" data-build-cheaper hidden></p>

                <!-- THE SAME SCOPE, FOR A MACHINE.
                     Everything above this line is written for a person: labels
                     in the language showing, prices formatted, a WhatsApp
                     message. None of it can be read back reliably — the
                     message is prose, and prose is where an order goes to
                     die. This island holds the same selection as ids,
                     quantities and amounts, rewritten by the script on every
                     change. It is the source of truth for what was chosen;
                     the message beside it is the presentation of it.

                     It ships empty and stays empty with the script off, which
                     is correct: nothing has been chosen. -->
                <script type="application/json" id="build-order" data-build-payload>{}</script>

                <p class="c-build__caveat">${pair({
    en: 'An estimate, not a quotation. Every figure is a starting price; the final one depends on the scope we agree together.',
    ar: 'هذا تقدير وليس عرض سعر. كل رقم هو سعر بداية، والسعر النهائي يعتمد على النطاق الذي نتفق عليه.',
  })}</p>

                <a class="c-btn c-btn--primary c-build__send" data-build-send
                  href="${waHref('Hi Pixora — I built a scope on your site and would like to talk about it.')}"
                  data-wa
                  data-wa-en="${waHref('Hi Pixora — I built a scope on your site and would like to talk about it.')}"
                  data-wa-ar="${waHref('مرحبًا بيكسورا — كوّنت نطاق عمل على موقعكم وأود التحدث بشأنه.')}"
                  ${WHATSAPP ? 'target="_blank" rel="noopener noreferrer"' : ''}
                  aria-describedby="build-scope-title">
                  <span>${pair({ en: 'Send this scope', ar: 'أرسل هذا النطاق' })}</span>${NEW_TAB}
                  <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
                  </svg>
                </a>

                <noscript>
                  <p class="c-build__noscript">${pair({
    en: 'The running total needs JavaScript. Every price is printed beside its item above, so nothing is missing — write down what you need and send it with the button.',
    ar: 'المجموع المتغيّر يحتاج جافاسكربت. كل سعر مكتوب بجانب بنده أعلاه، فلا ينقصك شيء — دوّن ما تحتاجه وأرسله عبر الزر.',
  })}</p>
                </noscript>
              </aside>
            </div>
          </form>
          <!-- BUILDER:END -->`;
}

/* ========================================================================== */
/* Write                                                                      */
/* ========================================================================== */

function replaceBlock(file, name, produce) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return null;
  const before = fs.readFileSync(p, 'utf8');
  const a = `<!-- ${name}:START -->`;
  const b = `<!-- ${name}:END -->`;
  if (!before.includes(a) || !before.includes(b)) return null;
  const after = before.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => produce());
  fs.writeFileSync(p, after);
  return after === before ? 'already up to date' : 'updated';
}

const results = [
  ['index.html', 'ADDONS', renderAddons],
  ['src/pages/pricing.html', 'BUILDER', renderBuilder],
];

console.log(`builder: ${addons.length} add-ons in ${C.addonGroups.length} groups, ${C.features.length} features across ${SERVICES.length} services`);
for (const [file, name, produce] of results) {
  const r = replaceBlock(file, name, produce);
  console.log(`  ${file} [${name}]: ${r || 'no markers — skipped'}`);
}
