/**
 * THE BRAND CHALLENGE — one question, limited attempts, a weighted reward.
 *
 * WHAT SHIPS WITHOUT THIS FILE. The invitation, the scenario, the question and
 * four real radio inputs in a real fieldset. A visitor with no JavaScript reads
 * the challenge and can think about it; what they lose is the marking and the
 * reward, not the content. That is why the start button ships `hidden` and this
 * file reveals it.
 *
 * HOW THE ANSWER IS CHECKED. Each option carries a short SHA-256 digest of its
 * id, salted with the challenge id, and the section carries the digest of the
 * correct one. Comparing digests keeps the answer out of casual view — no
 * option is marked in the markup — but the bundle is readable and this is
 * obfuscation, not security. It is a marketing device; the code is honoured by
 * a person. docs/97 §7.
 *
 * STATE IS PERSISTED so refreshing neither resets the attempts nor draws a new
 * reward. Storage can throw and every access is wrapped: a visitor who cannot
 * store still gets to play, they simply start fresh next time.
 */

import { t } from './navigation-map.js';

/* NAMES ARE MODULE-SPECIFIC ON PURPOSE. build.js flattens every module into one
   inline script and refuses to bundle two top-level bindings with the same
   name. reward.js already owns MOTION_OK, read and show, and it caught all
   three the moment this file was wired in — which is the check working. */

const CHALLENGE_MOTION_OK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function readState(key) {
  try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}

function saveState(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

/* Same weighted draw the reward pool uses, over the tier elements. */
function drawTier(tiers) {
  const w = tiers.map((el) => Number(el.dataset.challengeWeight) || 1);
  const total = w.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < tiers.length; i += 1) {
    roll -= w[i];
    if (roll <= 0) return tiers[i];
  }
  return tiers[tiers.length - 1];
}

function showPane(root, name) {
  const panes = {
    intro: root.querySelector('[data-challenge-intro]'),
    quiz: root.querySelector('[data-challenge-quiz]'),
    wrong: root.querySelector('[data-challenge-wrong]'),
    spent: root.querySelector('[data-challenge-spent]'),
    won: root.querySelector('[data-challenge-won]'),
  };
  Object.entries(panes).forEach(([key, el]) => { if (el) el.hidden = key !== name; });
  root.dataset.challengeState = name;
  showStep(root, name);
}

/* THE STEP TRACK. Five panes, three steps: the wrong-answer pane is still the
   answer step (you are being sent back to it), and both endings are the reward
   step. `aria-current` is what a screen reader reads, `data-challenge-at` is
   what the stylesheet colours — neither is inferred from the other, because a
   visual state that only exists in CSS is a state a screen reader cannot see. */
const CHALLENGE_STEPS = ['brief', 'answer', 'reward'];
const CHALLENGE_STEP_OF = {
  intro: 'brief', quiz: 'answer', wrong: 'answer', spent: 'reward', won: 'reward',
};

function showStep(root, paneName) {
  const at = CHALLENGE_STEP_OF[paneName] || 'brief';
  const reached = CHALLENGE_STEPS.indexOf(at);
  root.querySelectorAll('[data-challenge-step]').forEach((el) => {
    const i = CHALLENGE_STEPS.indexOf(el.dataset.challengeStep);
    el.dataset.challengeAt = i < reached ? 'done' : i === reached ? 'now' : 'ahead';
    if (i === reached) el.setAttribute('aria-current', 'step');
    else el.removeAttribute('aria-current');
  });
}

function sweep(root) {
  const line = root.querySelector('[data-challenge-sweep]');
  if (!line || !CHALLENGE_MOTION_OK()) return;
  line.classList.add('is-running');
  line.addEventListener('animationend', () => line.classList.remove('is-running'), { once: true });
}

/* --- the won state -------------------------------------------------------- */

function showReward(root, tierId) {
  const tiers = [...root.querySelectorAll('[data-challenge-tier]')];
  const tier = tiers.find((el) => el.dataset.challengeTier === tierId) || tiers[0];
  /* The whole ladder stays; the drawn rung is marked. Hiding the other four
     left the winner with one figure and a footnote, which is the same
     information with none of the sense that anything was drawn at all. */
  tiers.forEach((el) => { el.dataset.challengeDrawn = el === tier ? 'yes' : 'no'; });

  /* The slot has its own attribute name. It first shared data-challenge-code
     with the tier elements, so querySelector found a tier <p> and the code was
     written into it — the reward figure would have been replaced by a code.
     Caught by a probe reading "10% off خصم" where a code belonged. */
  const code = tier.dataset.challengeCode;
  const slot = root.querySelector('[data-challenge-code-slot]');
  if (slot) slot.textContent = code;

  const number = root.dataset.challengeWhatsapp;
  const claim = root.querySelector('[data-challenge-claim]');
  const percent = (tier.querySelector('.c-challenge__percent')?.textContent || '').trim();

  /* The headline figure is written from the drawn rung rather than typed
     twice, so the prize and the ladder can never disagree. */
  const prize = root.querySelector('[data-challenge-prize]');
  if (prize) prize.textContent = percent;
  if (claim && number && code) {
    const say = (lang) => (lang === 'ar'
      ? `مرحبًا بيكسورا — حللت تحدي العلامة وفزت بخصم ${percent}. الرمز: ${code}.`
      : `Hi Pixora — I solved the brand challenge and unlocked ${percent} off. Code: ${code}.`);
    const link = (lang) => `https://wa.me/${number}?text=${encodeURIComponent(say(lang))}`;
    claim.dataset.waEn = link('en');
    claim.dataset.waAr = link('ar');
    claim.setAttribute('data-wa', '');
    claim.setAttribute('target', '_blank');
    claim.setAttribute('rel', 'noopener noreferrer');
    /* For the language showing now; contact.js's observer covers every later
       swap, but this link did not exist when the last one happened. */
    const ar = document.documentElement.lang?.startsWith('ar');
    claim.setAttribute('href', link(ar ? 'ar' : 'en'));
  }

  /* SHARING IS OFFERED, NEVER AUTOMATIC. Revealed only where the browser can
     actually share; a button that does nothing is worse than no button. */
  const share = root.querySelector('[data-challenge-share]');
  if (share && navigator.share) {
    share.hidden = false;
    share.addEventListener('click', (event) => {
      event.preventDefault();
      const ar = document.documentElement.lang?.startsWith('ar');
      navigator.share({
        title: document.title,
        text: ar ? 'حللتُ تحدي العلامة. هل تستطيع؟' : 'I solved the brand challenge. Can you?',
        url: `${location.origin}${location.pathname}#challenge-title`,
      }).catch(() => { /* dismissed, which is a normal outcome */ });
    });
  }

  showPane(root, 'won');
}

/* --- copy ----------------------------------------------------------------- */

function initChallengeCopy(root) {
  const button = root.querySelector('[data-challenge-copy]');
  if (!button) return;
  const label = button.querySelector('span');
  button.addEventListener('click', async () => {
    const code = root.querySelector('[data-challenge-code-slot]')?.textContent.trim();
    if (!code) return;
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; }
    catch {
      const field = document.createElement('textarea');
      field.value = code; field.setAttribute('readonly', '');
      field.style.position = 'fixed'; field.style.opacity = '0';
      document.body.append(field); field.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      field.remove();
    }
    label.textContent = t(ok ? 'copied' : 'copyFailed');
    window.setTimeout(() => { label.textContent = t('rewardCopy'); }, 2400);
  });
}

/* --- boot ----------------------------------------------------------------- */

export function initChallenge(scope = document) {
  scope.querySelectorAll('[data-challenge]').forEach((root) => {
    const quiz = root.querySelector('[data-challenge-quiz]');
    const list = root.querySelector('[data-challenge-options]');
    if (!quiz || !list) return;

    const key = root.dataset.challengeStorage || 'pixora:challenge';
    const id = root.dataset.challengeId || '';
    const answer = root.dataset.challengeAnswer || '';
    const max = Number(root.dataset.challengeAttempts) || 2;
    const remainingSlot = root.querySelector('[data-challenge-remaining]');
    const dots = [...root.querySelectorAll('[data-challenge-dot]')];

    initChallengeCopy(root);

    const saved = readState(key);
    let used = saved && saved.id === id ? Number(saved.used) || 0 : 0;

    /* Declared before the early returns below, so a restored 'spent' state
       shows 0 attempts left rather than the initial count. */
    const setRemaining = () => {
      if (remainingSlot) remainingSlot.textContent = String(Math.max(0, max - used));
      /* The dots are aria-hidden and the count beside them is not, so the
         number stays the thing that is announced and the dots are the thing
         that is seen. */
      dots.forEach((dot, i) => { dot.dataset.challengeDot = i < used ? 'spent' : 'left'; });
    };

    /* ALREADY FINISHED. Solved shows the same reward, not a new draw; spent
       stays spent. A different challenge id retires the old state. */
    if (saved && saved.id === id && saved.done === 'won' && saved.tier) {
      showReward(root, saved.tier);
      return;
    }
    if (saved && saved.id === id && used >= max) { setRemaining(); showPane(root, 'spent'); return; }

    setRemaining();
    /* The markup ships on step one, but say so from the script too: the two
       restore paths above return before this line, so reaching it means this
       visitor really is at the beginning. */
    showPane(root, 'intro');

    const start = root.querySelector('[data-challenge-start]');
    if (start) {
      start.hidden = false;
      start.addEventListener('click', () => {
        if (root.dataset.challengeShuffle === 'true') {
          /* Fisher-Yates on the array, then re-append in that order — appending
             an element that is already a child MOVES it, so the list ends up in
             the shuffled order with no clone and no lost event listeners.
             The A/B/C/D markers are rewritten to match their new positions. */
          const items = [...list.children];
          for (let i = items.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
          }
          items.forEach((li, n) => {
            list.append(li);
            const marker = li.querySelector('.c-challenge__marker');
            if (marker) marker.textContent = String.fromCharCode(65 + n);
          });
        }
        showPane(root, 'quiz');
        list.querySelector('input')?.focus();
      });
    }

    root.querySelector('[data-challenge-retry]')?.addEventListener('click', () => {
      showPane(root, 'quiz');
      list.querySelector('input:checked')?.focus();
    });

    quiz.addEventListener('submit', (event) => {
      event.preventDefault();
      const picked = quiz.querySelector('[data-challenge-option]:checked');
      if (!picked) return;

      if (picked.value === answer) {
        const tier = drawTier([...root.querySelectorAll('[data-challenge-tier]')]);
        saveState(key, { id, used, done: 'won', tier: tier.dataset.challengeTier, at: Date.now() });
        sweep(root);
        window.setTimeout(() => showReward(root, tier.dataset.challengeTier), CHALLENGE_MOTION_OK() ? 460 : 0);
        return;
      }

      used += 1;
      setRemaining();
      saveState(key, { id, used, done: used >= max ? 'spent' : null, at: Date.now() });
      quiz.querySelectorAll('[data-challenge-option]').forEach((el) => { el.checked = false; });
      showPane(root, used >= max ? 'spent' : 'wrong');
    });
  });
}
