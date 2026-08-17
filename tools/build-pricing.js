/* =============================================================================
   BUILD-PRICING
   Renders every published package from ONE source: src/data/pricing.json.

   THE DIRECTION OF TRUTH INVERTED IN THE REFINEMENT PASS.
   Stage 10 generated the pricing section BY SCRAPING the detail sections,
   because the fourteen packages were published in both places and the detail
   sections got there first. The refinement pass removed that duplication —
   packages now live in Pricing only — so there is nothing left to scrape.
   `src/data/pricing.json` is the source, and this tool renders from it:

     1. the #pricing section, cards and all;
     2. a one-line packages band in each service section — count, price floor
        and billing model — so a visitor reading about a service still sees
        what it costs without meeting the same fourteen cards twice.

   Because both come from the same array, the "from 175 SAR" in a service
   section cannot disagree with the cheapest card in Pricing. A test asserts
   it, so a stale figure is caught rather than shipped.

   The output is STATIC HTML committed to index.html, not built in the
   browser: pricing has to be crawlable and has to work with JavaScript off.

   Run after changing any package:  node tools/build-pricing.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const DATA = path.join(ROOT, 'src/data/pricing.json');

const START = '<!-- PRICING:GENERATED:START -->';
const END = '<!-- PRICING:GENERATED:END -->';

const data = JSON.parse(fs.readFileSync(DATA, 'utf8')).categories;
const total = data.reduce((n, c) => n + c.packages.length, 0);

/* The JSON holds PLAIN TEXT, not markup. It used to hold HTML-escaped strings
   because it was scraped out of index.html — which meant anyone editing a
   package name had to know to type "&amp;". Now that the file is the source,
   it holds "&" and escaping happens here, once, on the way out. */
const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/* --- Rendering ----------------------------------------------------------- */

const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
  + '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.2" '
  + 'stroke-linecap="round" stroke-linejoin="round" /></svg>';

const MARKS = {
  Foundation: '<path d="M13 3 24 9.5 13 16 2 9.5 13 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />',
  System: '<path d="M13 2 24 8.5 13 15 2 8.5 13 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><path d="M2 15.5 13 22l11-6.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" opacity="0.55" />',
  Ecosystem: '<path d="M13 1.5 24 7.5 13 13.5 2 7.5 13 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /><path d="M2 12.5 13 18.5l11-6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" opacity="0.6" /><path d="M2 17.5 13 23.5l11-6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" opacity="0.32" />',
};

const pair = (v, pending = true) =>
  v.ar
    ? `<span data-lang-copy="en">${esc(v.en)}</span><span data-lang-copy="ar" lang="ar">${esc(v.ar)}</span>`
    : pending
      ? `<span data-i18n-pending>${esc(v.en)}</span>`
      : esc(v.en);

const featureItem = (f) =>
  `                    <li class="c-tier__feature${f.carry ? ' c-tier__feature--carry' : ''}">${CHECK}`
  + `<span>${f.ar ? pair(f) : esc(f.en)}</span></li>`;

function renderCard(pkg, catId, i) {
  const idBase = `price-${catId}-${pkg.id}`;
  const vis = pkg.features.slice(0, 4);
  const more = pkg.features.slice(4);
  const ribbon = pkg.ribbon
    ? `\n            <span class="c-tier__ribbon">${pair(pkg.ribbon, false)}</span>`
    : '';
  const level = pkg.level
    ? `
            <p class="c-tier__level">
              <svg class="c-tier__mark" viewBox="0 0 26 26" aria-hidden="true" focusable="false">${MARKS[pkg.level] || MARKS.Foundation}</svg>
              <span class="c-tier__level-name" data-i18n-pending>${esc(pkg.level)}</span>
            </p>
`
    : '';
  const purpose = pkg.purpose
    ? `\n              <p class="c-tier__purpose" data-i18n-pending>${esc(pkg.purpose)}</p>`
    : '';
  const disclosure = more.length
    ? `
            <div data-expand data-expand-static-above="64em">
              <ul class="c-tier__features">
${vis.map(featureItem).join('\n')}
              </ul>

              <div class="c-tier__more" data-expand-panel>
                <div class="c-tier__more-inner">
                  <ul class="c-tier__more-list">
${more.map(featureItem).join('\n')}
                  </ul>
                </div>
              </div>

              <button class="c-tier__toggle" data-expand-trigger>
                <span data-when="collapsed">Show all ${pkg.features.length} features</span>
                <span data-when="expanded">Show fewer features</span>
                <svg class="c-tier__toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
                </svg>
              </button>
            </div>
`
    : `
            <ul class="c-tier__features">
${pkg.features.map(featureItem).join('\n')}
            </ul>
`;

  /* ONE ACTION PER PACKAGE, AND ONLY HERE. A package card is the page's real
     decision point — the visitor has a name, a price and an inclusion list in
     front of them — so it earns a button. The refinement pass removed the
     section-level "Start Your Project" that used to sit under every section
     whether or not a decision was available there. */
  return `          <article class="c-tier${pkg.featured ? ' c-tier--featured' : ''}" style="--i: ${i}"
            aria-labelledby="${idBase}-name">${ribbon}${level}
            <div>
              <h3 class="c-tier__name" id="${idBase}-name" data-i18n-pending>${esc(pkg.name)}</h3>${purpose}
            </div>

            <p class="c-tier__price-block">
              <span class="c-tier__price">
                <span class="c-tier__amount">${esc(pkg.price)}</span>
                <span class="c-tier__currency" data-i18n="currency">SAR</span>
              </span>
              <span class="c-tier__billing" data-i18n="${pkg.billing}">${pkg.billing === 'billingMonthly' ? 'Monthly' : 'One-time'}</span>
            </p>
${disclosure}
            <a class="c-btn ${pkg.featured ? 'c-btn--primary' : 'c-btn--secondary'} c-tier__cta" href="#contact" data-cta-link
              aria-describedby="${idBase}-name">
              <span data-cta-label>Start Your Project</span>
              <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
              </svg>
            </a>
          </article>`;
}

/* The advertising-budget exclusion is the only pricing note in the source. It
   qualifies a PRICE, so the refinement pass moved it here, next to the prices
   it qualifies, instead of leaving it beside a service description. */
const renderNote = (c) => (c.note
  ? `
            <aside class="c-note" data-reveal aria-labelledby="${c.id}-note-label">
              <svg class="c-note__mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.6" />
                <path d="M12 7.4v5.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <circle cx="12" cy="16.4" r="1.1" fill="currentColor" />
              </svg>
              <p>
                <span class="c-note__label" id="${c.id}-note-label">
                  <span data-lang-copy="en">Note</span><span data-lang-copy="ar" lang="ar">ملاحظة</span>
                </span>
                <span class="c-note__body">
                  <span data-lang-copy="en">${esc(c.note.en)}</span>
                  <span data-lang-copy="ar" lang="ar">${esc(c.note.ar)}</span>
                </span>
              </p>
            </aside>
`
  : '');

const tabs = data.map((c, i) => `            <button class="c-pricing__tab" data-tab="${c.id}"
              aria-selected="${i === 0 ? 'true' : 'false'}">
              <span class="c-pricing__tab-label" data-i18n-pending>${esc(c.label)}</span>
              <span class="c-pricing__tab-count" aria-hidden="true">${c.packages.length}</span>
              <span class="u-visually-hidden">${c.packages.length} packages</span>
            </button>`).join('\n');

const panels = data.map((c) => {
  const monthly = c.packages[0].billing === 'billingMonthly';
  const pair2 = c.packages.length === 2 ? ' c-tiers--pair' : '';
  /* The jump link back to the service section is gone. It paired with a
     "View packages" link pointing the other way, so the two sections linked
     to each other in a loop; the service band now links here and here only. */
  return `          <div class="c-pricing__panel" data-tab-panel="${c.id}">
            <p class="c-pricing__meta">
              <span class="c-pricing__billing-note" data-i18n="${monthly ? 'billingAllMonthly' : 'billingAllOnce'}">${monthly ? 'Billed monthly' : 'One-time projects'}</span>
            </p>

            <div class="c-tiers${pair2}">
${c.packages.map((p, i) => renderCard(p, c.id, i)).join('\n\n')}
            </div>
${renderNote(c)}          </div>`;
}).join('\n\n');

const generated = `${START}
          <div class="c-pricing" data-tabs>
            <div class="c-pricing__tabs" role="tablist" aria-label="Pricing categories">
${tabs}
            </div>

${panels}
          </div>
          ${END}`;

/* --- The per-service packages band --------------------------------------- */

const num = (s) => Number(String(s).replace(/,/g, ''));
const COUNT_WORD = { 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five' };

function renderBand(c) {
  const floor = c.packages.reduce((a, p) => (num(p.price) < num(a.price) ? p : a));
  const monthly = c.packages[0].billing === 'billingMonthly';
  const word = COUNT_WORD[c.packages.length] || String(c.packages.length);
  return `<!-- PACKAGES:${c.id}:START -->
          <p class="c-detail__packages" data-reveal>
            <span class="c-detail__packages-count" data-i18n-pending>${word} packages, from</span>
            <span class="c-detail__packages-price">
              <span class="c-detail__packages-amount">${esc(floor.price)}</span>
              <span class="c-detail__packages-currency" data-i18n="currency">SAR</span>
            </span>
            <span class="c-detail__packages-billing" data-i18n="${monthly ? 'billingMonthly' : 'billingOnce'}">${monthly ? 'Monthly' : 'One-time'}</span>
            <a class="c-link c-detail__packages-link" href="#pricing" data-pricing-jump="${c.id}">
              <span data-i18n="comparePackages">Compare what each includes</span>
              <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
              </svg>
            </a>
          </p>
          <!-- PACKAGES:${c.id}:END -->`;
}

/* --- Write --------------------------------------------------------------- */

let html = fs.readFileSync(HTML, 'utf8');
const before = html;

if (!html.includes(START) || !html.includes(END)) {
  throw new Error('pricing markers not found in index.html');
}
html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => generated);

data.forEach((c) => {
  const a = `<!-- PACKAGES:${c.id}:START -->`;
  const b = `<!-- PACKAGES:${c.id}:END -->`;
  if (!html.includes(a) || !html.includes(b)) {
    throw new Error(`packages markers not found for #${c.section}`);
  }
  html = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => renderBand(c));
});

// An unchanged output is the SUCCESS case on a re-run, not a failure.
fs.writeFileSync(HTML, html);
console.log(html === before ? 'markup already up to date' : 'markup updated');
console.log(`pricing: ${data.length} categories, ${total} packages`);
console.log(`  source -> src/data/pricing.json`);
console.log(`  markup -> index.html (#pricing + ${data.length} service bands)`);
