/* =============================================================================
   BUILD-PRICING
   Renders every published package from ONE source: src/data/pricing.json,
   into the service section each package belongs to.

   WHERE THE PACKAGES LIVE, AND WHY IT MOVED TWICE.
   Stage 10 published them in BOTH the service sections and a separate Pricing
   section, generating the second from the first. The clarity pass removed that
   duplication by keeping Pricing and cutting the service copies. They now live
   in the service sections instead, and the standalone Pricing section is gone:
   a visitor reading about Websites sees the Websites packages there, without a
   separate section to navigate to and compare across.

   So this tool renders ONE block per service, between that section's
   PACKAGES markers:

     1. the package cards for that service;
     2. its pricing note, if the source states one (only Marketing does);
     3. a summary line — count, price floor, billing model.

   The summary is generated from the same array as the cards, so "from 175 SAR"
   cannot disagree with the cheapest card above it. A test asserts it.

   The output is STATIC HTML committed to index.html, not built in the
   browser: pricing has to be crawlable and has to work with JavaScript off.

   Run after changing any package:  node tools/build-pricing.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const DATA = path.join(ROOT, 'src/data/pricing.json');

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
  /* Bilingual where the data carries both. `pair()` emits the two spans the
     rest of the page uses, so the language toggle switches these with
     everything else — and with no JavaScript the English still renders. */
  const level = pkg.level
    ? `
            <p class="c-tier__level">
              <svg class="c-tier__mark" viewBox="0 0 26 26" aria-hidden="true" focusable="false">${MARKS[pkg.level] || MARKS.Foundation}</svg>
              <span class="c-tier__level-name">${pair({ en: pkg.level, ar: pkg.levelAr })}</span>
            </p>
`
    : '';
  const purpose = pkg.purpose
    ? `\n              <p class="c-tier__purpose">${pair({ en: pkg.purpose, ar: pkg.purposeAr })}</p>`
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
                <span data-when="collapsed">${pair({
                  en: `Show all ${pkg.features.length} features`,
                  ar: `عرض كل الميزات (${pkg.features.length})`,
                })}</span>
                <span data-when="expanded">${pair({
                  en: 'Show fewer features', ar: 'عرض ميزات أقل',
                })}</span>
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
     whether or not a decision was available there.

     ON A PHONE THIS BUTTON IS HIDDEN, and renderBlock's single action takes
     over. Three buttons under three side-by-side cards read as "pick one":
     they are parallel, and the choice is the point. Stacked in one column
     they are not parallel, they are CONSECUTIVE — the same label, to the same
     anchor, three times per service and sixteen times down the page. See the
     .c-detail__action rule in components/service-detail.css. */
  return `          <article class="c-tier${pkg.featured ? ' c-tier--featured' : ''}" style="--i: ${i}"
            aria-labelledby="${idBase}-name">${ribbon}${level}
            <div>
              <h3 class="c-tier__name" id="${idBase}-name" lang="en" dir="ltr">${esc(pkg.name)}</h3>${purpose}
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

/* --- The per-service block ------------------------------------------------
   Cards, then the note, then the summary line. */

const num = (s) => Number(String(s).replace(/,/g, ''));
const COUNT_WORD = { 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five' };
/* The WHOLE noun phrase, not a numeral to glue a plural onto: Arabic counts
   1, 2 and 3-10 differently, so `${n} باقات` is wrong for one and for two.
   Only 3 is in use today; the rest are correct for the day they are. */
const COUNT_AR = { 1: 'باقة واحدة', 2: 'باقتان', 3: 'ثلاث باقات',
                   4: 'أربع باقات', 5: 'خمس باقات' };

function renderBlock(c) {
  const floor = c.packages.reduce((a, p) => (num(p.price) < num(a.price) ? p : a));
  const monthly = c.packages[0].billing === 'billingMonthly';
  const word = COUNT_WORD[c.packages.length] || String(c.packages.length);
  const pairClass = c.packages.length === 2 ? ' c-tiers--pair' : '';

  return `<!-- PACKAGES:${c.id}:START -->
          <div class="c-tiers${pairClass}" data-reveal-group>
${c.packages.map((p, i) => renderCard(p, c.id, i)).join('\n\n')}
          </div>
${renderNote(c)}
          <p class="c-detail__packages" data-reveal id="${c.id}-packages">
            <span class="c-detail__packages-count">${pair({ en: `${word} packages, from`, ar: `${COUNT_AR[c.packages.length] || `${c.packages.length} باقة`}، تبدأ من` })}</span>
            <span class="c-detail__packages-price">
              <span class="c-detail__packages-amount">${esc(floor.price)}</span>
              <span class="c-detail__packages-currency" data-i18n="currency">SAR</span>
            </span>
            <span class="c-detail__packages-billing" data-i18n="${monthly ? 'billingMonthly' : 'billingOnce'}">${monthly ? 'Monthly' : 'One-time'}</span>
          </p>
          <a class="c-btn c-btn--primary c-detail__action" href="#contact" data-cta-link
            data-reveal aria-describedby="${c.id}-packages">
            <span data-cta-label>Start Your Project</span>
            <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
            </svg>
          </a>
          <!-- PACKAGES:${c.id}:END -->`;
}

/* --- Write --------------------------------------------------------------- */

let html = fs.readFileSync(HTML, 'utf8');
const before = html;

data.forEach((c) => {
  const a = `<!-- PACKAGES:${c.id}:START -->`;
  const b = `<!-- PACKAGES:${c.id}:END -->`;
  if (!html.includes(a) || !html.includes(b)) {
    throw new Error(`packages markers not found for #${c.section}`);
  }
  html = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => renderBlock(c));
});

// An unchanged output is the SUCCESS case on a re-run, not a failure.
fs.writeFileSync(HTML, html);
console.log(html === before ? 'markup already up to date' : 'markup updated');
console.log(`pricing: ${data.length} categories, ${total} packages`);
console.log(`  source -> src/data/pricing.json`);
console.log(`  markup -> index.html (${data.length} service sections)`);
