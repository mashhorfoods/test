/**
 * MOTION — scroll reveals and number transitions.
 *
 * Rule 13: motion is intentional and never delays access to content.
 *   - Content is visible by default; the hidden state only applies once the
 *     `js` class is on <html> (see 05-motion.css).
 *   - Elements reveal once and are then unobserved — no permanent listeners.
 *   - prefers-reduced-motion short-circuits everything to the final state.
 */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -------------------------------------------------------------------------
   SCROLL REVEAL

   <div data-reveal>…</div>                  single element
   <div data-reveal-group>…children…</div>   staggered children
   ------------------------------------------------------------------------- */

function initReveal() {
  const targets = [...document.querySelectorAll('[data-reveal], [data-reveal-group]')];
  if (targets.length === 0) return;

  const revealAll = () => targets.forEach((el) => el.classList.add('is-revealed'));

  // No IntersectionObserver, or motion is unwanted: show everything now.
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      });
    },
    // Fire slightly before the element reaches the fold so the transition has
    // finished by the time it is properly in view.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
  );

  targets.forEach((target) => observer.observe(target));

  // If the preference changes mid-session, stop animating and settle.
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', (event) => {
      if (event.matches) {
        observer.disconnect();
        revealAll();
      }
    });
}

/* -------------------------------------------------------------------------
   COUNTER

   <span class="c-counter" data-count-to="120" data-count-decimals="0">120</span>

   The element's markup already contains the final value, so it is correct
   before, during and after the animation — and correct without JavaScript.
   ------------------------------------------------------------------------- */

const DURATION = 1400;
const easeOut = (t) => 1 - (1 - t) ** 3;

function animateCount(el) {
  const target = Number(el.dataset.countTo);
  if (!Number.isFinite(target)) return;

  const decimals = Number(el.dataset.countDecimals ?? 0);
  const locale = document.documentElement.lang || 'en';
  const format = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / DURATION, 1);
    el.textContent = format.format(target * easeOut(progress));
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function initCounters() {
  const counters = [...document.querySelectorAll('[data-count-to]')];
  if (counters.length === 0) return;

  if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

export function initMotion() {
  initReveal();
  initCounters();
}
