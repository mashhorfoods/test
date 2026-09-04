/**
 * CONTACT — the form, the channels, and the package a visitor already chose.
 *
 * The form works without this file: its action is a real `mailto:` to the
 * approved address, which every browser can submit. What this adds is an
 * encoded message, and three things the wireframes asked for.
 *
 * 1. PACKAGE-AWARE CONVERSION (PS-02, W1). Every package CTA is a WhatsApp
 *    link carrying the package it belongs to, built at build time from
 *    pricing.json. This file remembers which one was pressed, so a visitor who
 *    comes back to the form finds it already filled in — the choice survives
 *    the round trip instead of being retyped.
 * 2. LANGUAGE. Those links exist in both languages, and `<option>` cannot hold
 *    the two spans the rest of the page uses. Both are swapped here when the
 *    document language changes, watched rather than wired, so nothing else has
 *    to know this file exists.
 * 3. A COPY CONTROL on the email address (W3). A `mailto:` that opens nothing
 *    is the silent failure the whole contact section is being rebuilt around;
 *    an address you can copy has no such state.
 *
 * There is still no backend and nothing here pretends otherwise: no fetch, no
 * fake success, and a status line that says only what actually happened.
 */

import { t } from './navigation-map.js';

const REMEMBERED = 'pixora:about';

/* --- the form ------------------------------------------------------------ */

export function initContact(scope = document) {
  scope.querySelectorAll('[data-contact-form]').forEach((form) => {
    const status = form.querySelector('[data-contact-status]');
    const about = form.querySelector('[data-contact-about]');
    const to = form.dataset.contactForm;

    restoreAbout(about);

    form.addEventListener('submit', (event) => {
      // Let the browser run native validation first; if it fails, this
      // handler never sees the event.
      event.preventDefault();

      const data = new FormData(form);
      const name = String(data.get('name') ?? '').trim();
      const email = String(data.get('email') ?? '').trim();
      const message = String(data.get('message') ?? '').trim();
      // The visible label, not the id: the person reading the mail wants
      // "Social Growth — 400 USD", not "social:soc-growth".
      const chosen = about?.selectedOptions?.[0]?.value
        ? about.selectedOptions[0].textContent.trim()
        : '';

      const subject = [
        chosen || 'Project enquiry',
        name ? `— ${name}` : '',
      ].filter(Boolean).join(' ');

      const body = [
        chosen ? `About: ${chosen}` : '',
        chosen ? '' : null,
        message,
        '',
        `— ${name}`,
        email,
      ].filter((line) => line !== null && line !== '').join('\n');

      // encodeURIComponent, not the raw strings: an apostrophe or a line break
      // in the message would otherwise truncate the URL.
      const href = `mailto:${to}?subject=${encodeURIComponent(subject)}`
        + `&body=${encodeURIComponent(body)}`;

      window.location.href = href;

      if (status) status.textContent = t('formNote');
    });
  });

  initRemember(scope);
  initCopy(scope);
  watchLanguage(scope);
}

/* --- carrying the choice ------------------------------------------------- */

/* Pressing a package CTA leaves the site for WhatsApp. Store what it was, so
   that if the visitor returns and scrolls to the form, the form already knows.
   sessionStorage, not localStorage: this is one visit's intent, not a
   preference, and it should not greet them a week later. */
function initRemember(scope) {
  scope.querySelectorAll('[data-wa][data-about]').forEach((link) => {
    link.addEventListener('click', () => {
      try {
        sessionStorage.setItem(REMEMBERED, link.dataset.about);
      } catch { /* private mode: the link still works, which is the point */ }
    });
  });
}

function restoreAbout(select) {
  if (!select) return;
  let value = '';
  try {
    value = sessionStorage.getItem(REMEMBERED) ?? '';
  } catch { return; }
  if (!value) return;
  // A service-level CTA stores "branding"; the select holds "branding:tier-…".
  // Match the exact option, or the first one in that service's group.
  const exact = select.querySelector(`option[value="${CSS.escape(value)}"]`);
  const first = select.querySelector(`option[value^="${CSS.escape(value)}:"]`);
  const option = exact || first;
  if (option) select.value = option.value;
}

/* --- copy the address ---------------------------------------------------- */

function initCopy(scope) {
  scope.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      let copied = false;
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        // Older browsers, and any context where the clipboard is denied.
        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        try { copied = document.execCommand('copy'); } catch { copied = false; }
        field.remove();
      }
      // Say what happened, never what was hoped for.
      button.textContent = t(copied ? 'copied' : 'copyFailed');
      button.dataset.i18n = copied ? 'copied' : 'copyFailed';
      window.setTimeout(() => {
        button.textContent = t('copyEmail');
        button.dataset.i18n = 'copyEmail';
      }, 2400);
    });
  });
}

/* --- language ------------------------------------------------------------ */

/* The two things on this page that cannot use the site's `data-lang-copy`
   span pair: an href, and the text inside <option>. Both carry their Arabic
   on a data attribute and are swapped when <html lang> changes. */
function applyLanguage(scope) {
  const ar = document.documentElement.lang?.startsWith('ar');

  scope.querySelectorAll('[data-wa]').forEach((link) => {
    const next = ar ? link.dataset.waAr : link.dataset.waEn;
    if (next) link.setAttribute('href', next);
  });

  scope.querySelectorAll('option[data-label-ar], optgroup[data-label-ar]').forEach((el) => {
    if (!el.dataset.labelEn) {
      el.dataset.labelEn = el.tagName === 'OPTGROUP' ? el.label : el.textContent;
    }
    const value = ar ? el.dataset.labelAr : el.dataset.labelEn;
    if (el.tagName === 'OPTGROUP') el.label = value;
    else el.textContent = value;
  });
}

function watchLanguage(scope) {
  applyLanguage(scope);
  new MutationObserver(() => applyLanguage(scope))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
