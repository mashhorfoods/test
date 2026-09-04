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

   The summary is generated from the same array as the cards, so "from 250 USD"
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

const CONFIG = path.join(ROOT, 'site.config.json');

const data = JSON.parse(fs.readFileSync(DATA, 'utf8')).categories;

/* The WhatsApp number lives in site.config.json, next to the domain — one
   place for the facts a build needs and a designer cannot invent. Without it
   the CTAs fall back to the contact section, which is what they did before
   this existed: a missing number must never render `wa.me/undefined`. */
const WHATSAPP = (JSON.parse(fs.readFileSync(CONFIG, 'utf8')).contact || {}).whatsapp || '';

/* PACKAGE-AWARE CONVERSION (Phase 03 PS-02, wireframe W1).
   The card knows which package the visitor chose; the old CTA threw that away
   and opened a blank form. These build the message instead, in both languages,
   from the SAME data the card renders — so the message can never quote a price
   the card does not show. */
const waLink = (text) => (WHATSAPP
  ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
  : '#contact');

const cardMessage = (pkg, c, lang) => (lang === 'ar'
  ? `مرحبًا بيكسورا — أنا مهتم بباقة ${pkg.name} ضمن ${c.labelAr} (${pkg.priceFrom ? 'من ' : ''}${pkg.price} دولار، ${pkg.billing === 'billingMonthly' ? 'شهريًا' : 'لمرة واحدة'}).`
  : `Hi Pixora — I'm interested in ${c.label} · ${pkg.name} (${pkg.priceFrom ? 'from ' : ''}${pkg.price} USD, ${pkg.billing === 'billingMonthly' ? 'monthly' : 'one-time'}).`);

const serviceMessage = (c, lang) => (lang === 'ar'
  ? `مرحبًا بيكسورا — أود التحدث بخصوص ${c.labelAr}.`
  : `Hi Pixora — I'd like to talk about ${c.label}.`);

/* One anchor shape for both. `data-wa-en` / `data-wa-ar` carry the two hrefs;
   the href itself ships as English so the link works with no JavaScript, and
   contact.js swaps it when the language does. `data-about` is the package the
   visitor chose, remembered for the form if they come back. */
const waCta = ({ href, hrefAr, labelEn, labelAr, about, primary, describedBy }) => `
            <a class="c-btn ${primary ? 'c-btn--primary' : 'c-btn--secondary'} c-tier__cta"
              href="${href}" data-wa data-wa-en="${href}" data-wa-ar="${hrefAr}"
              ${about ? `data-about="${about}"` : ''}
              ${WHATSAPP ? 'target="_blank" rel="noopener noreferrer"' : ''}
              aria-describedby="${describedBy}">
              <span><span data-lang-copy="en">${labelEn}</span><span data-lang-copy="ar" lang="ar">${labelAr}</span></span>
              <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
              </svg>
            </a>`;
const total = data.reduce((n, c) => n + c.packages.length, 0);

/* The JSON holds PLAIN TEXT, not markup. It used to hold HTML-escaped strings
   because it was scraped out of index.html — which meant anyone editing a
   package name had to know to type "&amp;". Now that the file is the source,
   it holds "&" and escaping happens here, once, on the way out. */
const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/* A package carrying `priceFrom` is quoted as a STARTING figure, not a fixed
   one, and renders the same "From" prefix the add-ons use — same class shape,
   same STRINGS.priceFrom key, so it translates with everything else and needs
   no new copy in either language. Only the packages the source states this
   way carry the flag; the rest still quote a fixed price. */

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

function renderCard(pkg, category, i) {
  const idBase = `price-${category.id}-${pkg.id}`;
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
              <span class="c-tier__price">${pkg.priceFrom ? `
                <span class="c-tier__from" data-i18n="priceFrom">From</span>` : ''}
                <span class="c-tier__amount">${esc(pkg.price)}</span>
                <span class="c-tier__currency" data-i18n="currency">USD</span>
              </span>
              <span class="c-tier__billing" data-i18n="${pkg.billing}">${pkg.billing === 'billingMonthly' ? 'Monthly' : 'One-time'}</span>
            </p>
${disclosure}
${waCta({
    href: waLink(cardMessage(pkg, category, 'en')),
    hrefAr: waLink(cardMessage(pkg, category, 'ar')),
    labelEn: `Ask about ${esc(pkg.name)}`,
    labelAr: `اسأل عن باقة ${esc(pkg.name)}`,
    about: `${category.id}:${pkg.id}`,
    primary: pkg.featured,
    describedBy: `${idBase}-name`,
  })}
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
${c.packages.map((p, i) => renderCard(p, c, i)).join('\n\n')}
          </div>
${renderNote(c)}
          <p class="c-detail__packages" data-reveal id="${c.id}-packages">
            <span class="c-detail__packages-count">${pair({ en: `${word} packages, from`, ar: `${COUNT_AR[c.packages.length] || `${c.packages.length} باقة`}، تبدأ من` })}</span>
            <span class="c-detail__packages-price">
              <span class="c-detail__packages-amount">${esc(floor.price)}</span>
              <span class="c-detail__packages-currency" data-i18n="currency">USD</span>
            </span>
            <span class="c-detail__packages-billing" data-i18n="${monthly ? 'billingMonthly' : 'billingOnce'}">${monthly ? 'Monthly' : 'One-time'}</span>
          </p>
          <a class="c-btn c-btn--primary c-detail__action"
            href="${waLink(serviceMessage(c, 'en'))}" data-wa
            data-wa-en="${waLink(serviceMessage(c, 'en'))}"
            data-wa-ar="${waLink(serviceMessage(c, 'ar'))}"
            data-about="${c.id}"
            ${WHATSAPP ? 'target="_blank" rel="noopener noreferrer"' : ''}
            data-reveal aria-describedby="${c.id}-packages">
            <span><span data-lang-copy="en">Ask about this service</span><span data-lang-copy="ar" lang="ar">اسأل عن هذه الخدمة</span></span>
            <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
            </svg>
          </a>
          <!-- PACKAGES:${c.id}:END -->`;
}


/* THE FORM'S "ABOUT" FIELD (wireframe W3).
   Same source as the cards, so an option can never name a package or a price
   that the page does not sell. Option text ships in English with the Arabic on
   `data-label-ar`, because <option> cannot hold the two spans the rest of the
   page uses — contact.js swaps the text when the language changes, and with no
   JavaScript the English labels still submit the right value. */
function renderAbout() {
  const groups = data.map((c) => {
    const opts = c.packages.map((p) => {
      const en = `${esc(p.name)} — ${p.priceFrom ? 'from ' : ''}${esc(p.price)} USD`;
      const ar = `${esc(p.name)} — ${p.priceFrom ? 'من ' : ''}${esc(p.price)} دولار`;
      return `                    <option value="${c.id}:${p.id}" data-label-ar="${ar}">${en}</option>`;
    }).join('\n');
    return `                  <optgroup label="${esc(c.label)}" data-label-ar="${esc(c.labelAr)}">\n${opts}\n                  </optgroup>`;
  }).join('\n');

  return `<!-- CONTACT-ABOUT:START -->
                  <option value="" data-label-ar="استفسار عام">General enquiry</option>
${groups}
                  <!-- CONTACT-ABOUT:END -->`;
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

{
  const a = '<!-- CONTACT-ABOUT:START -->';
  const b = '<!-- CONTACT-ABOUT:END -->';
  if (html.includes(a)) {
    html = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => renderAbout());
  }
}

// An unchanged output is the SUCCESS case on a re-run, not a failure.
fs.writeFileSync(HTML, html);
console.log(html === before ? 'markup already up to date' : 'markup updated');
console.log(`pricing: ${data.length} categories, ${total} packages`);
console.log(`  source -> src/data/pricing.json`);
console.log(`  markup -> index.html (${data.length} service sections)`);
