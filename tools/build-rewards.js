/* =============================================================================
   BUILD-REWARDS
   Renders the Mystery Reward component from src/data/rewards.json into the
   markers in index.html. Same shape as build-pricing.js: one JSON file is the
   source, the markup is generated, and nothing about a reward is written twice.

   WHY EVERY REWARD SHIPS IN THE MARKUP.
   The reveal is a state change, not a fetch. All seven rewards are in the page
   from the start, hidden, and the script reveals the one it picked. That costs
   about 2KB and buys three things this site already insists on:

     - it works with the reward chosen before any script runs, so there is no
       flash of empty space and no layout shift when the answer arrives;
     - every reward's text is in the DOM for a crawler and for a translator,
       in both languages, like every other string here;
     - the visible state is CSS, so `prefers-reduced-motion` and a failed
       script both land somewhere sensible rather than nowhere.

   It also means a curious visitor can read all seven in the source. That is
   fine, and section 8 of the brief is answered honestly rather than pretended
   at: this is a marketing device, not a security control (docs/96 §6).

   Run: node tools/build-rewards.js   (build.js runs it)
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'src/data/rewards.json');
const CONFIG = path.join(ROOT, 'site.config.json');
/* One number for the whole site, same source build-pricing.js reads. */
const WHATSAPP = (JSON.parse(fs.readFileSync(CONFIG, 'utf8')).contact || {}).whatsapp || '';
const TARGETS = [path.join(ROOT, 'index.html')].filter(fs.existsSync);

const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const PROMO = raw.promotion;
const REWARDS = raw.rewards;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* The bilingual span pair the whole site uses. Nothing here may ship in one
   language only — that is the rule docs/89 §1 puts first. */
const pair = (v) =>
  `<span data-lang-copy="en">${esc(v.en)}</span><span data-lang-copy="ar" lang="ar">${esc(v.ar)}</span>`;

const COPY = {
  eyebrow: { en: 'A reward is waiting', ar: 'مكافأة بانتظارك' },
  title: { en: 'A reward is waiting for you.', ar: 'مكافأة بانتظارك.' },
  lead: {
    en: 'Reveal your mystery reward and discover a special offer from us.',
    ar: 'اكشف مكافأتك واحصل على عرض خاص منا.',
  },
  cta: { en: 'Reveal my reward', ar: 'اكشف مكافأتي' },
  terms: { en: 'One reward per visitor. Terms apply.', ar: 'مكافأة واحدة لكل زائر. تُطبَّق الشروط.' },
  unlocked: { en: 'You unlocked it', ar: 'لقد فزت بها' },
  codeLabel: { en: 'Your code', ar: 'رمزك' },
  copy: { en: 'Copy code', ar: 'انسخ الرمز' },
  claim: { en: 'Claim it on WhatsApp', ar: 'احصل عليها عبر واتساب' },
  packages: { en: 'See the packages', ar: 'اطّلع على الباقات' },
  /* Revealing is not the end of the funnel; this line points at the next step. */
  next: {
    en: 'Send us the code and we will apply it to your quote.',
    ar: 'أرسل لنا الرمز وسنطبّقه على عرض السعر.',
  },
};

function rewardPanel(r) {
  const validity = { en: `Valid for ${PROMO.validityDays} days.`, ar: `صالحة لمدة ${PROMO.validityDays} يومًا.` };
  return `              <div class="c-reward__prize" data-reward-prize="${esc(r.id)}" data-reward-weight="${r.weight}" hidden>
                <p class="t-label c-reward__won">${pair(COPY.unlocked)}</p>
                <p class="c-reward__name">${pair(r.name)}</p>
                <p class="c-reward__detail">${pair(r.detail)}</p>
                <p class="c-reward__code-label t-label">${pair(COPY.codeLabel)}</p>
                <p class="c-reward__code"><code data-reward-code>${esc(r.code)}</code></p>
                <p class="c-reward__validity">${pair(validity)}</p>
              </div>`;
}

function render() {
  return `<!-- REWARD:START -->
        <section class="l-section c-reward" aria-labelledby="reward-title" data-reward
          data-reward-storage="${esc(PROMO.storageKey)}"
          data-reward-promo="${esc(PROMO.id)}"
          data-reward-days="${PROMO.validityDays}"
          data-reward-whatsapp="${esc(WHATSAPP)}">
          <div class="l-container">
            <div class="c-reward__panel" data-reveal>

              <!-- STAGE 1 — the invitation. This is what a visitor with no
                   JavaScript sees, and it is complete on its own: it says what
                   is on offer and how to ask for it. The button below is only
                   revealed once the script is running, because a button that
                   cannot do anything is worse than no button. -->
              <div class="c-reward__intro" data-reward-intro>
                <p class="t-label c-reward__eyebrow">${pair(COPY.eyebrow)}</p>
                <h2 class="c-reward__title" id="reward-title">${pair(COPY.title)}</h2>
                <p class="c-reward__lead">${pair(COPY.lead)}</p>
                <button class="c-btn c-btn--primary c-reward__cta" type="button" data-reward-reveal hidden>
                  <span>${pair(COPY.cta)}</span>
                  <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
                  </svg>
                </button>
                <p class="c-reward__terms"><a class="c-link" href="./terms#promotions">${pair(COPY.terms)}</a></p>
              </div>

              <!-- STAGE 3 — the reward. Every prize is here and hidden; the
                   script unhides one. aria-live so a screen reader is told what
                   happened without the focus being stolen. -->
              <div class="c-reward__result" data-reward-result hidden
                role="status" aria-live="polite">
${REWARDS.map(rewardPanel).join('\n')}
                <p class="c-reward__next">${pair(COPY.next)}</p>
                <div class="c-reward__actions">
                  <button class="c-btn c-btn--secondary c-reward__copy" type="button" data-reward-copy>
                    <span>${pair(COPY.copy)}</span>
                  </button>
                  <a class="c-btn c-btn--primary c-reward__claim" data-reward-claim href="#contact">
                    <span>${pair(COPY.claim)}</span>
                  </a>
                </div>
                <p class="c-reward__more">
                  <a class="c-link" href="./pricing">${pair(COPY.packages)}
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="u-flip-rtl">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none" />
                    </svg>
                  </a>
                </p>
              </div>

              <!-- STAGE 2 lives between them: a line that sweeps the panel while
                   the intro fades out and the prize fades in. It is decoration
                   and carries no text, so it is hidden from assistive tech. -->
              <span class="c-reward__sweep" aria-hidden="true" data-reward-sweep></span>
            </div>
          </div>
        </section>
        <!-- REWARD:END -->`;
}

let touched = 0;
TARGETS.forEach((file) => {
  let html = fs.readFileSync(file, 'utf8');
  const a = '<!-- REWARD:START -->';
  const b = '<!-- REWARD:END -->';
  if (!html.includes(a) || !html.includes(b)) return;
  const next = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => render());
  if (next !== html) fs.writeFileSync(file, next);
  touched += 1;
});

const total = REWARDS.reduce((n, r) => n + r.weight, 0);
console.log(`rewards: ${REWARDS.length} in the pool, ${touched} page(s) rendered`);
REWARDS.forEach((r) => {
  console.log(`  ${String(r.id).padEnd(9)} ${String(Math.round((r.weight / total) * 100) + '%').padStart(4)}  ${r.code}`);
});
if (!PROMO.active) console.log('  ! promotion.active is false — the component still renders; reward.js declines to run');
