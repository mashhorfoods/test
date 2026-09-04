/**
 * ANALYTICS — four events, no cookies, no personal data, no vendor yet.
 *
 * Phase 04 (docs/31-strategy-kpis.md §7) set nine KPIs and none of them has a
 * baseline, because nothing on this site has ever been measured. Phase 03
 * (PS-07) made instrumentation the gating task. This file is that
 * instrumentation.
 *
 * WHAT IT SENDS. Four events and two properties, chosen because each one
 * answers a KPI and nothing else:
 *
 *   package_view     which packages get read              → what actually sells
 *   channel_tap      whatsapp | phone | email | copy      → today's real
 *                                                           conversions, which
 *                                                           are invisible now
 *   enquiry_started  the form was engaged with
 *   enquiry_sent     the mail handoff happened            → K1, K2, K3
 *
 * Every event carries `lang` (K7) and, where the page knows it, the package or
 * service that produced it (K3). It never carries a name, an email address, a
 * message, or anything typed into a field. There is no identifier and no
 * cookie: the only state is a per-visit Set that stops one package counting
 * twice, and it dies with the tab.
 *
 * WHAT IT DOES NOT DO. It sends nothing anywhere until a provider is named in
 * site.config.json. Choosing who receives a visitor's data is the owner's
 * decision, not a default someone inherits from a build script, so with no
 * provider configured this file dispatches a DOM event and stops. Setting
 * `analytics.provider` turns it on with no code change; `tools/build-deploy.js`
 * adds the provider's script to the deployed pages and says so on every run.
 *
 * The provider call is deliberately duck-typed rather than imported: whichever
 * cookieless tool is chosen, it exposes a global function, and this file wants
 * no dependency on which one it is.
 */

const seen = new Set();

function lang() {
  return document.documentElement.lang?.startsWith('ar') ? 'ar' : 'en';
}

/**
 * Report one event. Safe to call before, during or after a provider exists.
 * Never throws: a measurement must not be able to break a page.
 */
export function track(name, props = {}) {
  const detail = { ...props, lang: lang() };
  try {
    document.dispatchEvent(new CustomEvent('pixora:event', { detail: { name, ...detail } }));
    // Plausible, Umami, Fathom and Simple Analytics all expose a global with
    // this shape. If none is present, the event stays local — which is the
    // state until a provider is chosen.
    if (typeof window.plausible === 'function') window.plausible(name, { props: detail });
    else if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, detail);
  } catch { /* never break the page for a metric */ }
}

/* --- wiring -------------------------------------------------------------- */

export function initAnalytics(scope = document) {
  // Conversions. `data-about` is the package or service the CTA carries, which
  // is the same value the WhatsApp message quotes.
  scope.querySelectorAll('[data-wa]').forEach((link) => {
    link.addEventListener('click', () => {
      track('channel_tap', { channel: 'whatsapp', about: link.dataset.about || 'general' });
    });
  });

  scope.querySelectorAll('.c-channel[href^="tel:"]').forEach((link) => {
    link.addEventListener('click', () => track('channel_tap', { channel: 'phone' }));
  });
  scope.querySelectorAll('.c-channel[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => track('channel_tap', { channel: 'email' }));
  });
  scope.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => track('channel_tap', { channel: 'copy' }));
  });

  // The form. `once` on the start event: engagement is a single fact, not a
  // count of keystrokes.
  scope.querySelectorAll('[data-contact-form]').forEach((form) => {
    form.addEventListener('focusin', () => {
      track('enquiry_started', { about: form.querySelector('[data-contact-about]')?.value || 'general' });
    }, { once: true });

    form.addEventListener('submit', () => {
      track('enquiry_sent', { about: form.querySelector('[data-contact-about]')?.value || 'general' });
    });
  });

  observePackages(scope);
}

/* A package counts as read when half its card has been on screen for a second.
   Scroll-past does not count, and each package counts once per visit. */
function observePackages(scope) {
  const cards = [...scope.querySelectorAll('.c-tier')];
  if (!cards.length || !('IntersectionObserver' in window)) return;

  const timers = new WeakMap();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const card = entry.target;
      const id = card.querySelector('[data-about]')?.dataset.about
        || card.querySelector('.c-tier__name')?.textContent.trim();
      if (!id || seen.has(id)) { observer.unobserve(card); return; }

      if (entry.isIntersecting) {
        timers.set(card, window.setTimeout(() => {
          seen.add(id);
          track('package_view', { about: id });
          observer.unobserve(card);
        }, 1000));
      } else {
        window.clearTimeout(timers.get(card));
      }
    });
  }, { threshold: 0.5 });

  cards.forEach((card) => observer.observe(card));
}
