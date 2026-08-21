/**
 * KEYBOARD CONTINUITY — focus follows the jump.
 *
 * THE PROBLEM, MEASURED. Activating any in-page link — the skip link, a header
 * nav item, a drawer item, a footer quick link, any "Start Your Project" —
 * scrolled the page correctly and then left `document.activeElement` on
 * `<body>`. Three things follow from that, all bad:
 *
 *   1. the focus ring vanishes, so a sighted keyboard user loses their place;
 *   2. a screen reader is never taken to the destination — it announces
 *      nothing, because nothing moved;
 *   3. the next Tab continues from wherever the browser decides, which is not
 *      specified and differs between engines.
 *
 * The scroll was never the issue. The FOCUS was. The drawer even carried a
 * comment saying "focus goes to the section, not back to the trigger" — the
 * intent was right and the code to do it did not exist.
 *
 * THE FIX. When a same-document link is followed, move focus to what it points
 * at. Sections here carry `aria-labelledby`, so focusing one makes a screen
 * reader announce the section by name — which is exactly the confirmation a
 * sighted user gets from seeing the page scroll.
 *
 * `tabindex="-1"` is added ON DEMAND rather than authored into the markup, so
 * the document is not littered with focus targets, and removed again on blur.
 * It never adds a Tab stop: -1 means "focusable by script, skipped by Tab".
 *
 * `preventScroll: true` matters. Without it the browser jumps to the element
 * instantly to reveal it, fighting the smooth scroll the anchor already
 * started and landing the page in the wrong place. Focus is set; the scroll
 * belongs to the anchor.
 */

/** Elements that already take focus need no help and no cleanup. */
const NATURALLY_FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

function focusTarget(id) {
  if (!id) return;
  let target;
  try {
    target = document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`);
  } catch {
    return;
  }
  if (!target) return;

  const borrowed = !target.matches(NATURALLY_FOCUSABLE);
  if (borrowed) {
    target.setAttribute('tabindex', '-1');
    // Hand it back, so the DOM looks the way it was authored.
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }

  target.focus({ preventScroll: true });
}

export function initFocus() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const href = link.getAttribute('href') || '';
    // Same document only. A link to another page takes its own focus with it.
    if (!href.startsWith('#') || href === '#') return;

    /* Next frame, not now: the browser applies the anchor — updating the hash
       and starting the scroll — after this handler returns. Focusing first
       would simply be undone. */
    requestAnimationFrame(() => focusTarget(decodeURIComponent(href.slice(1))));
  });

  /* Back, forward, and a URL pasted with a fragment already on it. The click
     path above never runs for these, and they need the same treatment. */
  window.addEventListener('hashchange', () => {
    focusTarget(decodeURIComponent(window.location.hash.slice(1)));
  });
}
