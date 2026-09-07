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

const SOURCE = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const data = SOURCE.categories;
const TERMS = (SOURCE.terms || {}).shared || {};

/* SCOPE FACTS (wireframe W1, PS-05). A published price that is never explained
   makes the buyer guess what is missing, and at this band the guess is
   unflattering. These render ONLY from values that exist: an empty field
   renders nothing at all, rather than a label with a blank beside it. */
const has = (v) => Boolean(v && (v.en || '').trim());

function renderFacts(pkg) {
  const rows = [
    ['Delivery', 'التسليم', pkg.facts?.delivery],
    ['Revisions', 'التعديلات', pkg.facts?.revisions],
    ['You own', 'ملكيتك', TERMS.ownership],
  ].filter(([, , v]) => has(v));

  const excludes = (TERMS.excludes || []).filter(has);
  const extras = [
    ['What "from" depends on', 'ما الذي يحدد السعر', TERMS.fromDepends],
    ['Payment', 'الدفع', TERMS.payment],
  ].filter(([, , v]) => has(v));

  if (!rows.length && !excludes.length && !extras.length) return '';

  const facts = rows.length ? `
            <dl class="c-tier__facts">
${rows.map(([en, ar, v]) => `              <dt>${pair({ en, ar })}</dt>
              <dd>${pair(v)}</dd>`).join('\n')}
            </dl>` : '';

  /* <details>, not the site's accordion: it needs no JavaScript, no ARIA of
     our own and no id wiring, and it is the one disclosure on the page whose
     content a search engine should still see when closed.

     THE SUMMARY CARRIES ITS PACKAGE'S NAME, hidden. Twelve of these render on
     the homepage and twelve on /pricing, and until 5 September 2026 every one
     of them announced the identical string "What's not included" — so a
     screen-reader user reaching the eighth had no way to know which package it
     belonged to.

     That is the same defect `docs/67` §1 found and fixed for the five
     "See what it covers" links. It survived that pass because the pass looked
     at links and buttons, and this is a <summary>. The fix is the same
     mechanism, and it is safe here for the same reason it was there: the label
     is a `pair()` of spans, not `data-i18n`, so nothing overwrites its
     children at runtime.

     The suffix is a DASH AND THE NAME, not "in Starter", and that wording is
     deliberate. All twelve bodies render from `terms.shared` and are byte-for
     -byte identical — the exclusions are the studio's, not the package's. "What
     is not included in Starter" would be true and would still imply a
     specificity that does not exist. "What's not included — Starter" names the
     card without claiming the content belongs to it. */
  const more = (excludes.length || extras.length) ? `
            <details class="c-tier__terms">
              <summary>${pair({ en: "What's not included", ar: 'ما لا تشمله الباقة' })}<span class="u-visually-hidden">${pair({ en: ` — ${pkg.name}`, ar: ` — ${pkg.name}` })}</span></summary>
              <div class="c-tier__terms-body">
${excludes.length ? `                <ul>
${excludes.map((v) => `                  <li>${pair(v)}</li>`).join('\n')}
                </ul>` : ''}
${extras.map(([en, ar, v]) => `                <p><span class="c-tier__terms-label">${pair({ en, ar })}:</span> ${pair(v)}</p>`).join('\n')}
              </div>
            </details>` : '';

  return `${facts}${more}`;
}

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

/* EVERY LINK THAT LEAVES THE SITE SAYS SO.

   These anchors open WhatsApp in a new tab, and until 7 September they were
   the only new-tab links on the site that did not announce it — 22 of them,
   and they are the conversion path: the four service buttons and every
   package CTA. The rest of the site (LinkedIn, Behance, the portfolio, the
   client's own site, and the WhatsApp links in the legal pages' prose) has
   carried the note from the start, so this was not a missing rule but a rule
   with a hole in exactly the place it mattered most.

   Conditional on WHATSAPP for the same reason target="_blank" is: with no
   number configured these are not off-site links at all, and a note about a
   new tab that does not open would be a lie in the accessible name.

   Bilingual, because the note is a string a screen reader reads out and this
   site does not read one language's words in the other's voice. */
const NEW_TAB = WHATSAPP
  ? '<span class="u-visually-hidden"><span data-lang-copy="en"> (opens in a new tab)</span>'
    + '<span data-lang-copy="ar" lang="ar"> (يفتح في نافذة جديدة)</span></span>'
  : '';

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
              <span><span data-lang-copy="en">${labelEn}</span><span data-lang-copy="ar" lang="ar">${labelAr}</span></span>${NEW_TAB}
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
              <ul class="c-tier__features" role="list">
${vis.map(featureItem).join('\n')}
              </ul>

              <div class="c-tier__more" data-expand-panel>
                <div class="c-tier__more-inner">
                  <ul class="c-tier__more-list" role="list">
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
            <ul class="c-tier__features" role="list">
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
${renderFacts(pkg)}${waCta({
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

/* THE SERVICE INDEX — the way INTO the packages.
   docs/84 §2.1 measured the problem rather than assuming it: /pricing runs to
   17.7 screenfuls on a phone, and a buyer who came for a website scrolls past
   three branding tiers and three disclosures to reach one. The tiers were
   never the problem — four services' worth of correct tier design on one page
   with no entry point was.

   Four anchors, so it works with no JavaScript, in both directions, with no
   new machinery: :target in 01-reset.css already offsets for the fixed header.

   It carries the price floor and the package count because a chooser that only
   names things makes you visit all four to compare them — which is the scroll
   it exists to save. Same vocabulary as the per-service summary below each
   block, from the same fields, so the two can never disagree. */
function renderIndex(data) {
  return `<!-- PACKAGES:index:START -->
          <nav class="c-index" aria-labelledby="service-index-title" data-reveal-group>
            <h2 class="t-label c-index__title" id="service-index-title">${pair({ en: 'Choose a service', ar: 'اختر الخدمة' })}</h2>
            <ul class="c-index__list" role="list">
${data.map((c) => {
    const floor = c.packages.reduce((a, p) => (num(p.price) < num(a.price) ? p : a));
    const monthly = c.packages[0].billing === 'billingMonthly';
    const word = COUNT_WORD[c.packages.length] || String(c.packages.length);
    return `              <li class="c-index__item">
                <a class="c-index__link" href="#${c.id}">
                  <span class="c-index__name">${pair({ en: c.label, ar: c.labelAr })}</span>
                  <span class="c-index__meta">
                    <span class="c-index__count">${pair({ en: `${word} packages, from`, ar: `${COUNT_AR[c.packages.length] || `${c.packages.length} باقة`}، تبدأ من` })}</span>
                    <span class="c-index__price">
                      <span class="c-index__amount">${esc(floor.price)}</span>
                      <span class="c-index__currency" data-i18n="currency">USD</span>
                      <span class="c-index__billing" data-i18n="${monthly ? 'billingMonthly' : 'billingOnce'}">${monthly ? 'Monthly' : 'One-time'}</span>
                    </span>
                  </span>
                  <svg class="c-index__go u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none" />
                  </svg>
                </a>
              </li>`;
  }).join('\n')}
            </ul>
          </nav>
          <!-- PACKAGES:index:END -->`;
}


/* `full` DECIDES WHETHER THE TIERS THEMSELVES ARE EMITTED.
   The loop below already said "the guide and the homepage may diverge in what
   they include, but never in what a package says" — this is that divergence,
   finally used.

   THE HOMEPAGE WAS CARRYING A BYTE-FOR-BYTE COPY OF /pricing: 12 tiers, 12
   CTAs, 12 disclosures, 110 feature items, identical names. Measured at 11.1
   screenfuls on a phone, 32% of the homepage — and /pricing, the destination
   the nav offers, showed a visitor exactly what they had just scrolled past.

   What the homepage keeps is everything that carries the promise: the service,
   its lead, the price floor with its billing period, and the WhatsApp action.
   "Prices published in full on this site" survives intact — only the feature
   lists and the exclusion disclosures move to the page built to hold them,
   which docs/87 just gave a door. */
function renderBlock(c, full = true) {
  const floor = c.packages.reduce((a, p) => (num(p.price) < num(a.price) ? p : a));
  const monthly = c.packages[0].billing === 'billingMonthly';
  const word = COUNT_WORD[c.packages.length] || String(c.packages.length);
  const pairClass = c.packages.length === 2 ? ' c-tiers--pair' : '';

  const tiers = full
    ? `          <div class="c-tiers${pairClass}" data-reveal-group>
${c.packages.map((p, i) => renderCard(p, c, i)).join('\n\n')}
          </div>
${renderNote(c)}`
    : '';

  return `<!-- PACKAGES:${c.id}:START -->
${tiers}
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
            <!-- NAMES THE SERVICE. These four were display:none until docs/88
                 gave them a block with no cards, so qa.js §18 had never seen
                 them: four controls announcing "Ask about this service" and
                 opening four different conversations. The WhatsApp message
                 always named the service; the button a screen reader reads
                 did not. -->
            <span><span data-lang-copy="en">Ask about ${esc(c.label)}</span><span data-lang-copy="ar" lang="ar">اسأل عن ${esc(c.labelAr)}</span></span>${NEW_TAB}
            <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
            </svg>
          </a>
${full ? '' : `
          <!-- One quiet text link, not a second CTA — the same device the story
               section uses, and §11 of the CTA hierarchy allows one action per
               surface. The action above is the conversion; this is a route to
               the detail that used to sit here. -->
          <p class="c-detail__more" data-reveal>
            <a class="c-link" href="./pricing#${c.id}">
              <!-- NAMES ITS SERVICE. The first version said "See the three
                   packages in full" on all four links, and qa.js §18 failed the
                   build: four controls announcing an identical name and leading
                   to four different places is what a screen-reader user cannot
                   tell apart. The count is already in the summary line directly
                   above, so the service name is the half worth keeping. -->
              <span data-lang-copy="en">See all ${esc(c.label)} packages</span><span data-lang-copy="ar" lang="ar">اطّلع على باقات ${esc(c.labelAr)}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="u-flip-rtl">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none" />
              </svg>
            </a>
          </p>`}
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

/* The same blocks now feed two documents: the homepage, where a service
   section carries its own packages, and the pricing guide, which explains what
   moves a price and shows the same cards underneath. Rendering both from here
   is the only way the guide cannot drift from the page it explains — which is
   exactly what went wrong with the standalone Pricing section this project
   removed in an earlier stage. */
const TARGETS = [HTML, path.join(ROOT, 'src/pages/pricing.html')].filter(fs.existsSync);

TARGETS.forEach((file) => {
/* The guide is the page that holds the catalogue; every other target gets the
   summary and a link to it. */
const isGuide = path.basename(file) === 'pricing.html';
let html = fs.readFileSync(file, 'utf8');
const before = html;

{
  const a = '<!-- PACKAGES:index:START -->';
  const b = '<!-- PACKAGES:index:END -->';
  if (html.includes(a) && html.includes(b)) {
    html = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => renderIndex(data));
  }
}

data.forEach((c) => {
  const a = `<!-- PACKAGES:${c.id}:START -->`;
  const b = `<!-- PACKAGES:${c.id}:END -->`;
  // A target that does not carry this service's markers simply does not want
  // this block — the guide and the homepage may diverge in what they include,
  // but never in what a package says.
  if (!html.includes(a) || !html.includes(b)) return;
  html = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => renderBlock(c, isGuide));
});

{
  const a = '<!-- CONTACT-ABOUT:START -->';
  const b = '<!-- CONTACT-ABOUT:END -->';
  if (html.includes(a)) {
    html = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => renderAbout());
  }
}

// An unchanged output is the SUCCESS case on a re-run, not a failure.
fs.writeFileSync(file, html);
console.log(`${path.relative(ROOT, file)}: ${html === before ? 'already up to date' : 'updated'}`);
});
console.log(`pricing: ${data.length} categories, ${total} packages`);
console.log(`  source -> src/data/pricing.json`);
console.log(`  markup -> index.html (${data.length} service sections)`);
