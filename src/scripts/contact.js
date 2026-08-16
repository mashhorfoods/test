/**
 * CONTACT FORM — Stage 17
 *
 * The form already works without this file: its action is a real
 * `mailto:` to the approved address, which every browser can submit.
 *
 * What this adds is a properly encoded message. A native mailto POST sends
 * the fields as `name=…&email=…` in whatever encoding the browser picks, and
 * several mail clients render that badly or drop it. Building the URL here
 * gives a clean subject line and a readable body in every client.
 *
 * There is no backend and nothing here pretends otherwise: no fetch, no fake
 * success state, and a status line that says only what actually happened —
 * the mail app was opened with the message ready.
 */

import { t } from './navigation-map.js';

export function initContact(scope = document) {
  scope.querySelectorAll('[data-contact-form]').forEach((form) => {
    const status = form.querySelector('[data-contact-status]');
    const to = form.dataset.contactForm;

    form.addEventListener('submit', (event) => {
      // Let the browser run native validation first; if it fails, this
      // handler never sees the event.
      event.preventDefault();

      const data = new FormData(form);
      const name = String(data.get('name') ?? '').trim();
      const email = String(data.get('email') ?? '').trim();
      const message = String(data.get('message') ?? '').trim();

      const subject = name ? `Project enquiry — ${name}` : 'Project enquiry';
      const body = [message, '', `— ${name}`, email].filter(Boolean).join('\n');

      // encodeURIComponent, not the raw strings: an apostrophe or a line break
      // in the message would otherwise truncate the URL.
      const href = `mailto:${to}?subject=${encodeURIComponent(subject)}`
        + `&body=${encodeURIComponent(body)}`;

      window.location.href = href;

      if (status) status.textContent = t('formNote');
    });
  });
}
