/* =============================================================================
   BUILD-CHALLENGE
   Renders the Brand Challenge from src/data/challenge.json into the markers in
   index.html. Same shape as build-pricing.js and build-rewards.js: one JSON
   file is the source and no question, option, answer or percentage is written
   anywhere else.

   WHERE THE ANSWER LIVES. Not on the options. Marking the right one with an
   attribute would put the answer one inspector-click away and make the
   challenge pointless for anyone curious enough to look — which is exactly the
   sort of person this is meant to interest. Instead the section carries a
   short digest of the correct id, and challenge.js hashes the chosen option to
   compare. That is obfuscation, not security, and docs/97 §7 says so plainly:
   a determined visitor can still read the bundle. It costs nothing and it
   keeps the answer out of casual view, which is all a marketing device needs.

   Run: node tools/build-challenge.js   (build.js runs it)
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'src/data/challenge.json');
const CONFIG = path.join(ROOT, 'site.config.json');
const TARGETS = [path.join(ROOT, 'index.html')].filter(fs.existsSync);

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const WHATSAPP = (JSON.parse(fs.readFileSync(CONFIG, 'utf8')).contact || {}).whatsapp || '';
const C = data.challenge;
const Q = data.question;
const R = data.reward;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pair = (v) =>
  `<span data-lang-copy="en">${esc(v.en)}</span><span data-lang-copy="ar" lang="ar">${esc(v.ar)}</span>`;

/* Salted with the challenge id so the digest changes when the challenge does,
   and a digest from an old promotion cannot be replayed against a new one. */
const digest = (id) =>
  crypto.createHash('sha256').update(`${C.id}:${id}`).digest('base64').slice(0, 16);

const TOP_PERCENT = Math.max(...R.tiers.map((t) => Number(t.percent) || 0));

const COPY = {
  start: { en: 'Start the challenge', ar: 'ابدأ التحدي' },
  submit: { en: 'Submit answer', ar: 'أرسل الإجابة' },
  retry: { en: 'Try again', ar: 'حاول مرة أخرى' },
  wrongTitle: { en: 'Not quite.', ar: 'ليست تمامًا.' },
  wrongBody: { en: 'Think about it again — which one do the others depend on?', ar: 'فكّر فيها مرة أخرى — أيّها تعتمد عليه البقية؟' },
  spentTitle: { en: 'That was the last attempt.', ar: 'كانت تلك المحاولة الأخيرة.' },
  spentBody: {
    en: 'The offer stands anyway: tell us about the business and we will give you the answer, and our reading of it.',
    ar: 'العرض قائم على أي حال: حدّثنا عن العمل وسنعطيك الإجابة وقراءتنا لها.',
  },
  wonTitle: { en: 'You got it.', ar: 'أصبتها.' },
  wonBody: { en: 'Excellent. You solved the challenge.', ar: 'ممتاز. لقد حللت التحدي.' },
  why: { en: 'Why this is the answer', ar: 'لماذا هذه هي الإجابة' },
  rewardLabel: { en: 'Your reward', ar: 'مكافأتك' },
  codeLabel: { en: 'Your code', ar: 'رمزك' },
  copy: { en: 'Copy code', ar: 'انسخ الرمز' },
  claim: { en: 'Claim my reward', ar: 'احصل على مكافأتي' },
  packages: { en: 'Explore our packages', ar: 'اطّلع على باقاتنا' },
  share: { en: 'Challenge a friend', ar: 'تحدَّ صديقًا' },
  attemptsLeft: { en: 'Attempts left', ar: 'المحاولات المتبقية' },
  /* Two strings, not one. The claim is a statement and the link is a link;
     wrapping both in an <a> styles the promise as a link and makes a screen
     reader announce the whole sentence as the link's name. The ceiling is
     interpolated from the tiers rather than typed, so it cannot drift from
     what the pool can actually hand out. */
  termsClaim: {
    en: `Up to ${TOP_PERCENT}% off eligible packages.`,
    ar: `خصم يصل إلى ${TOP_PERCENT}% على الباقات المؤهّلة.`,
  },
  termsLink: { en: 'Terms apply.', ar: 'تُطبَّق الشروط.' },
};

const option = (o, i) => `                  <li class="c-challenge__option">
                    <input class="c-challenge__radio u-visually-hidden" type="radio"
                      name="challenge-answer" id="challenge-${esc(o.id)}"
                      value="${esc(digest(o.id))}" data-challenge-option />
                    <label class="c-challenge__label" for="challenge-${esc(o.id)}">
                      <span class="c-challenge__marker" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
                      <span class="c-challenge__option-text">${pair(o.label)}</span>
                    </label>
                  </li>`;

const tier = (t) => `                <p class="c-challenge__tier" data-challenge-tier="${esc(t.id)}"
                  data-challenge-weight="${t.weight}" data-challenge-code="${esc(t.code)}" hidden>
                  <span class="c-challenge__percent">${t.percent}%</span>
                  <span class="c-challenge__percent-word">${pair({ en: 'off', ar: 'خصم' })}</span>
                </p>`;

function render() {
  return `<!-- CHALLENGE:START -->
        <section class="l-section c-challenge" aria-labelledby="challenge-title" data-challenge
          data-challenge-id="${esc(C.id)}"
          data-challenge-storage="${esc(C.storageKey)}"
          data-challenge-attempts="${C.maxAttempts}"
          data-challenge-answer="${esc(digest(Q.correct))}"
          data-challenge-shuffle="${C.shuffle ? 'true' : 'false'}"
          data-challenge-days="${R.validityDays}"
          data-challenge-whatsapp="${esc(WHATSAPP)}">
          <div class="l-container">
            <div class="c-challenge__panel" data-reveal>

              <!-- STAGE 1 — the invitation. Complete without JavaScript: it says
                   what is on offer and what it is for. The start button is
                   revealed by the script, because a button that cannot start
                   anything is worse than no button. -->
              <div class="c-challenge__intro" data-challenge-intro>
                <p class="t-label c-challenge__eyebrow">${pair(Q.eyebrow)}</p>
                <h2 class="c-challenge__title" id="challenge-title">${pair(Q.title)}</h2>
                <p class="c-challenge__lead">${pair(Q.lead)}</p>
                <button class="c-btn c-btn--primary c-challenge__start" type="button" data-challenge-start hidden>
                  <span>${pair(COPY.start)}</span>
                  <svg class="c-btn__icon u-flip-rtl" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
                  </svg>
                </button>
                <p class="c-challenge__terms">${pair(COPY.termsClaim)} <a class="c-link" href="./terms#promotions">${pair(COPY.termsLink)}</a></p>
              </div>

              <!-- STAGE 2 — the question. A real fieldset of real radios, so it
                   is keyboard-operable and screen-reader-legible before any
                   script touches it. -->
              <form class="c-challenge__quiz" data-challenge-quiz hidden>
                <fieldset class="c-challenge__fieldset">
                  <legend class="c-challenge__ask">${pair(Q.ask)}</legend>
                  <p class="c-challenge__scenario">${pair(Q.scenario)}</p>
                  <ul class="c-challenge__options" role="list" data-challenge-options>
${Q.options.map(option).join('\n')}
                  </ul>
                </fieldset>
                <p class="c-challenge__attempts" data-challenge-attempts-line>
                  <span class="t-label">${pair(COPY.attemptsLeft)}</span>
                  <span class="c-challenge__attempts-count" data-challenge-remaining>${C.maxAttempts}</span>
                </p>
                <button class="c-btn c-btn--primary c-challenge__submit" type="submit" data-challenge-submit>
                  <span>${pair(COPY.submit)}</span>
                </button>
              </form>

              <!-- The wrong-answer state. It never names the correct option:
                   the visitor gets another go, and being told the answer would
                   end the thinking the challenge exists to provoke. -->
              <div class="c-challenge__wrong" data-challenge-wrong hidden role="status" aria-live="polite">
                <p class="t-label c-challenge__wrong-title">${pair(COPY.wrongTitle)}</p>
                <p class="c-challenge__wrong-body" data-challenge-wrong-body>${pair(COPY.wrongBody)}</p>
                <button class="c-btn c-btn--secondary" type="button" data-challenge-retry>
                  <span>${pair(COPY.retry)}</span>
                </button>
              </div>

              <!-- Attempts spent. Not a punishment and not a dead end — it
                   turns into the same conversation the rest of the site offers. -->
              <div class="c-challenge__spent" data-challenge-spent hidden role="status" aria-live="polite">
                <p class="t-label c-challenge__wrong-title">${pair(COPY.spentTitle)}</p>
                <p class="c-challenge__wrong-body">${pair(COPY.spentBody)}</p>
                <a class="c-btn c-btn--primary" data-challenge-talk href="#contact">
                  <span>${pair({ en: 'Tell us about it', ar: 'حدّثنا عنه' })}</span>
                </a>
              </div>

              <!-- STAGE 3 — solved. -->
              <div class="c-challenge__won" data-challenge-won hidden role="status" aria-live="polite">
                <p class="t-label c-challenge__won-eyebrow">${pair(COPY.wonTitle)}</p>
                <p class="c-challenge__won-body">${pair(COPY.wonBody)}</p>

                <p class="t-label c-challenge__reward-label">${pair(COPY.rewardLabel)}</p>
${R.tiers.map(tier).join('\n')}
                <p class="c-challenge__cap">${pair(R.headline)}</p>

                <p class="c-challenge__code-label t-label">${pair(COPY.codeLabel)}</p>
                <p class="c-challenge__code"><code data-challenge-code-slot></code></p>
                <p class="c-challenge__validity">${pair({ en: `Valid for ${R.validityDays} days.`, ar: `صالحة لمدة ${R.validityDays} يومًا.` })}</p>

                <!-- The explanation is the point of the whole thing: the
                     visitor should leave knowing how we think, not only that
                     they won something. -->
                <details class="c-challenge__why">
                  <summary>
                    <span class="c-challenge__why-mark" aria-hidden="true"></span>
                    <span>${pair(COPY.why)}</span>
                  </summary>
                  <p>${pair(Q.explanation)}</p>
                </details>

                <div class="c-challenge__actions">
                  <button class="c-btn c-btn--secondary" type="button" data-challenge-copy>
                    <span>${pair(COPY.copy)}</span>
                  </button>
                  <a class="c-btn c-btn--primary" data-challenge-claim href="#contact">
                    <span>${pair(COPY.claim)}</span>
                  </a>
                </div>
                <p class="c-challenge__more">
                  <a class="c-link" href="./pricing">${pair(COPY.packages)}
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="u-flip-rtl">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none" />
                    </svg>
                  </a>
                  <a class="c-link c-challenge__share" data-challenge-share href="#" hidden>${pair(COPY.share)}</a>
                </p>
              </div>

              <span class="c-challenge__sweep" aria-hidden="true" data-challenge-sweep></span>
            </div>
          </div>
        </section>
        <!-- CHALLENGE:END -->`;
}

let touched = 0;
TARGETS.forEach((file) => {
  let html = fs.readFileSync(file, 'utf8');
  const a = '<!-- CHALLENGE:START -->';
  const b = '<!-- CHALLENGE:END -->';
  if (!html.includes(a) || !html.includes(b)) return;
  const next = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => render());
  if (next !== html) fs.writeFileSync(file, next);
  touched += 1;
});

console.log(`challenge: ${Q.options.length} options, ${C.maxAttempts} attempt(s), ${R.tiers.length} reward tier(s), ${touched} page(s) rendered`);
console.log(`  answer digest ships as data-challenge-answer; no option carries a marker`);
