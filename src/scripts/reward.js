/**
 * MYSTERY REWARD — the reveal, the pick, and what happens after.
 *
 * WHAT THIS FILE IS ALLOWED TO ASSUME. The markup already contains every
 * reward, in both languages, with the invitation visible. If this module never
 * runs, a visitor sees a complete, honest panel: a reward is waiting, terms
 * apply. They lose the reveal, not the page. That is why the button ships
 * `hidden` and this file unhides it — a control that cannot do anything is
 * worse than no control.
 *
 * THE PICK IS WEIGHTED and happens once. It is written to localStorage with
 * the promotion id, so a refresh shows the same reward and a new promotion
 * starts everyone fresh. Storage can throw — private mode, blocked cookies —
 * and every access here is wrapped, because a visitor who cannot store a
 * reward should still get to see one.
 *
 * IT IS NOT SECURE, AND DOES NOT PRETEND TO BE. The pool is in the page, the
 * pick is in the browser, and clearing storage draws again. The codes are a
 * marketing device; whoever honours one checks it by hand. docs/96 §6.
 */

import { t } from './navigation-map.js';

const MOTION_OK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --- storage, which is allowed to fail ----------------------------------- */

function read(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private mode, or storage denied. The reward still shows for this view;
       it simply will not survive a refresh. That is the right way to fail. */
  }
}

/* --- the pick ------------------------------------------------------------- */

/* Weight is read from the markup so the pool stays in one file. A prize with
   no weight attribute counts as 1 rather than being skipped — a reward that
   silently never appears is the kind of bug nobody reports. */
function choose(prizes) {
  const weights = prizes.map((el) => Number(el.dataset.rewardWeight) || 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < prizes.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return prizes[i];
  }
  return prizes[prizes.length - 1];
}

/* --- showing one ---------------------------------------------------------- */

function show(root, prize, { animate }) {
  const intro = root.querySelector('[data-reward-intro]');
  const result = root.querySelector('[data-reward-result]');
  const sweep = root.querySelector('[data-reward-sweep]');
  const claim = root.querySelector('[data-reward-claim]');

  root.querySelectorAll('[data-reward-prize]').forEach((el) => { el.hidden = el !== prize; });

  /* The claim link carries the code into WhatsApp, the same way every package
     CTA carries its package (docs/82). The visitor sends a message that already
     says what they won, so nobody has to retype a code on a phone. */
  const code = prize.querySelector('[data-reward-code]')?.textContent.trim();
  const number = root.dataset.rewardWhatsapp;
  if (claim && code && number) {
    const say = (lang) => (lang === 'ar'
      ? `مرحبًا بيكسورا — كشفت عن مكافأة: ${code}. أود استخدامها.`
      : `Hi Pixora — I revealed a reward: ${code}. I'd like to use it.`);
    const link = (lang) => `https://wa.me/${number}?text=${encodeURIComponent(say(lang))}`;
    claim.dataset.waEn = link('en');
    claim.dataset.waAr = link('ar');
    claim.setAttribute('data-wa', '');
    claim.setAttribute('target', '_blank');
    claim.setAttribute('rel', 'noopener noreferrer');
    /* Set for the language showing NOW, not always English: this link is built
       after the page has loaded, so it has missed whatever language swap
       already happened. contact.js's observer covers every swap after this
       one — it watches <html lang> and rewrites every [data-wa] — so the only
       moment it cannot cover is this one, and that is what this line is. */
    const ar = document.documentElement.lang?.startsWith('ar');
    claim.setAttribute('href', link(ar ? 'ar' : 'en'));
  }

  const settle = () => {
    intro.hidden = true;
    result.hidden = false;
    root.dataset.rewardState = 'revealed';
  };

  if (!animate) { settle(); return; }

  root.dataset.rewardState = 'revealing';
  if (sweep) {
    sweep.classList.add('is-running');
    sweep.addEventListener('animationend', () => sweep.classList.remove('is-running'), { once: true });
  }
  /* Half of the sweep hides the intro, the other half brings the prize in, so
     the two never overlap and the panel never shows both or neither. */
  window.setTimeout(settle, 560);
}

/* --- copy ----------------------------------------------------------------- */

function initCodeCopy(root) {
  const button = root.querySelector('[data-reward-copy]');
  if (!button) return;
  const label = button.querySelector('span');
  button.addEventListener('click', async () => {
    const code = root.querySelector('[data-reward-prize]:not([hidden]) [data-reward-code]');
    if (!code) return;
    const text = code.textContent.trim();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      /* Same fallback contact.js uses for the email address, for the same
         browsers and the same denied-clipboard contexts. */
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      field.remove();
    }
    /* Says what happened, never what was hoped for. */
    label.textContent = t(ok ? 'copied' : 'copyFailed');
    window.setTimeout(() => { label.textContent = t('rewardCopy'); }, 2400);
  });
}

/* --- boot ----------------------------------------------------------------- */

export function initReward(scope = document) {
  scope.querySelectorAll('[data-reward]').forEach((root) => {
    const prizes = [...root.querySelectorAll('[data-reward-prize]')];
    if (!prizes.length) return;

    const key = root.dataset.rewardStorage || 'pixora:reward';
    const promo = root.dataset.rewardPromo || '';
    const saved = read(key);

    initCodeCopy(root);

    /* ALREADY DRAWN. Same promotion, same reward, no animation — they have
       seen it. A different promotion id means the old one is finished and this
       visitor may draw again. */
    if (saved && saved.promo === promo) {
      const prize = prizes.find((el) => el.dataset.rewardPrize === saved.id);
      if (prize) { show(root, prize, { animate: false }); return; }
    }

    const button = root.querySelector('[data-reward-reveal]');
    if (!button) return;
    button.hidden = false;

    button.addEventListener('click', () => {
      button.disabled = true;
      const prize = choose(prizes);
      write(key, { promo, id: prize.dataset.rewardPrize, at: Date.now() });
      show(root, prize, { animate: MOTION_OK() });
    }, { once: true });
  });
}
