/* =============================================================================
   BUILD-PRICING — STAGE 10
   Generates the #pricing section from the packages already published in the
   detail sections.

   WHY GENERATE RATHER THAN AUTHOR
   Stage 10 shows the same fourteen packages that Stages 04-08 already show.
   Hand-copying them would create a second source of truth that drifts the
   first time a price changes — the brief's §34 asks for structured data for
   exactly this reason. So the detail sections stay the source, this tool
   lifts them into `src/data/pricing.json`, and the pricing markup is rendered
   from that. Nothing is transcribed by hand at any point.

   The rendered markup is STATIC HTML committed to index.html, not built in
   the browser: pricing has to be crawlable (§33) and has to work with
   JavaScript disabled, which a client-rendered section would not.

   Run after changing any package:  node tools/build-pricing.js
   A test asserts the pricing section and the detail sections still agree, so
   forgetting to re-run this is caught rather than shipped.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const DATA = path.join(ROOT, 'src/data/pricing.json');

const START = '<!-- PRICING:GENERATED:START -->';
const END = '<!-- PRICING:GENERATED:END -->';

/* --- The categories, in the order the brief lists them. Integrated Solutions
   and Additional Services are absent because no package data has been supplied
   for either; they are omitted rather than shown empty. ------------------- */
const CATEGORIES = [
  { id: 'branding', section: 'branding', label: 'Branding & Design' },
  { id: 'websites', section: 'websites', label: 'Websites' },
  { id: 'ecommerce', section: 'ecommerce', label: 'E-Commerce' },
  { id: 'social', section: 'social', label: 'Social Media' },
  { id: 'marketing', section: 'marketing', label: 'Marketing & Ads' },
];

const html = fs.readFileSync(HTML, 'utf8');

/* --- Extraction ---------------------------------------------------------- */

function sectionHtml(id) {
  const open = html.indexOf(`<section id="${id}"`);
  if (open === -1) throw new Error(`section #${id} not found`);
  const close = html.indexOf('</section>', open);
  return html.slice(open, close);
}

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function bilingual(fragment) {
  const en = fragment.match(/<span data-lang-copy="en">([\s\S]*?)<\/span>/);
  const ar = fragment.match(/<span data-lang-copy="ar"[^>]*>([\s\S]*?)<\/span>/);
  if (en && ar) return { en: strip(en[1]), ar: strip(ar[1]) };
  return { en: strip(fragment) };
}

function parseTiers(sectionMarkup) {
  // Split on the article boundary; the first chunk is everything before the
  // first card and is discarded.
  const chunks = sectionMarkup.split(/<article class="c-tier/).slice(1);
  return chunks.map((chunk) => {
    const card = '<article class="c-tier' + chunk;
    const featured = /^<article class="c-tier c-tier--featured/.test(card);

    const level = card.match(/class="c-tier__level-name"[^>]*>([\s\S]*?)<\/span>/);
    const name = card.match(/class="c-tier__name"[^>]*>([\s\S]*?)<\/h3>/);
    const purpose = card.match(/class="c-tier__purpose"[^>]*>([\s\S]*?)<\/p>/);
    const amount = card.match(/class="c-tier__amount">([\s\S]*?)<\/span>/);
    const billing = card.match(/class="c-tier__billing" data-i18n="([a-zA-Z]+)"/);
    const ribbon = card.match(/class="c-tier__ribbon">([\s\S]*?)<\/span>\s*\n/);

    const features = [...card.matchAll(
      /<li class="c-tier__feature([^"]*)">[\s\S]*?<\/svg>([\s\S]*?)<\/li>/g
    )].map((m) => ({
      carry: m[1].includes('--carry'),
      ...bilingual(m[2].replace(/^<span>|<\/span>$/g, '')),
    }));

    if (!name || !amount || !billing) throw new Error('unparsable tier card');

    return {
      id: name[0].match(/id="([^"]+)-name"/)[1],
      level: level ? strip(level[1]) : null,
      name: strip(name[1]),
      purpose: purpose ? strip(purpose[1]) : null,
      price: strip(amount[1]),
      billing: billing[1],
      featured,
      ribbon: ribbon ? bilingual(ribbon[1]) : null,
      features,
    };
  });
}

const data = CATEGORIES.map((c) => ({
  ...c,
  packages: parseTiers(sectionHtml(c.section)),
}));

const total = data.reduce((n, c) => n + c.packages.length, 0);
fs.mkdirSync(path.dirname(DATA), { recursive: true });
fs.writeFileSync(DATA, JSON.stringify({ categories: data }, null, 2) + '\n');

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
    ? `<span data-lang-copy="en">${v.en}</span><span data-lang-copy="ar" lang="ar">${v.ar}</span>`
    : pending
      ? `<span data-i18n-pending>${v.en}</span>`
      : v.en;

const featureItem = (f) =>
  `                    <li class="c-tier__feature${f.carry ? ' c-tier__feature--carry' : ''}">${CHECK}`
  + `<span>${f.ar ? pair(f) : f.en}</span></li>`;

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
              <span class="c-tier__level-name" data-i18n-pending>${pkg.level}</span>
            </p>
`
    : '';
  const purpose = pkg.purpose
    ? `\n              <p class="c-tier__purpose" data-i18n-pending>${pkg.purpose}</p>`
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

  return `          <article class="c-tier${pkg.featured ? ' c-tier--featured' : ''}" style="--i: ${i}"
            aria-labelledby="${idBase}-name">${ribbon}${level}
            <div>
              <h3 class="c-tier__name" id="${idBase}-name" data-i18n-pending>${pkg.name}</h3>${purpose}
            </div>

            <p class="c-tier__price-block">
              <span class="c-tier__price">
                <span class="c-tier__amount">${pkg.price}</span>
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

const tabs = data.map((c, i) => `            <button class="c-pricing__tab" data-tab="${c.id}"
              aria-selected="${i === 0 ? 'true' : 'false'}">
              <span class="c-pricing__tab-label" data-i18n-pending>${c.label}</span>
              <span class="c-pricing__tab-count" aria-hidden="true">${c.packages.length}</span>
              <span class="u-visually-hidden">${c.packages.length} packages</span>
            </button>`).join('\n');

const panels = data.map((c) => {
  const billing = c.packages[0].billing === 'billingMonthly' ? 'billingMonthly' : 'billingOnce';
  const pair2 = c.packages.length === 2 ? ' c-tiers--pair' : '';
  return `          <div class="c-pricing__panel" data-tab-panel="${c.id}">
            <p class="c-pricing__meta">
              <a class="c-link c-pricing__jump" href="#${c.section}">
                <span data-i18n-pending>See what ${c.label} covers</span>
                <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
                </svg>
              </a>
              <span class="c-pricing__billing-note" data-i18n="${billing === 'billingMonthly' ? 'billingAllMonthly' : 'billingAllOnce'}">${billing === 'billingMonthly' ? 'Billed monthly' : 'One-time projects'}</span>
            </p>

            <div class="c-tiers${pair2}">
${c.packages.map((p, i) => renderCard(p, c.id, i)).join('\n\n')}
            </div>
          </div>`;
}).join('\n\n');

const generated = `${START}
          <div class="c-pricing" data-tabs>
            <div class="c-pricing__tabs" role="tablist" aria-label="Pricing categories">
${tabs}
            </div>

${panels}
          </div>
          ${END}`;

if (!html.includes(START) || !html.includes(END)) {
  throw new Error('generated markers not found in index.html');
}

const out = html.replace(
  new RegExp(`${START}[\\s\\S]*?${END}`),
  () => generated
);

// An unchanged output is the SUCCESS case on a re-run, not a failure — the
// first version of this guard compared strings and threw on every no-op run.
fs.writeFileSync(HTML, out);
console.log(out === html ? 'markup already up to date' : 'markup updated');

console.log(`pricing: ${data.length} categories, ${total} packages`);
console.log(`  data   -> src/data/pricing.json`);
console.log(`  markup -> index.html (#pricing)`);
