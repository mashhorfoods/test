/**
 * NAVIGATION
 *
 * Renders every navigation surface from the shared map, then adds four
 * behaviours — all progressive enhancements over markup that already works:
 *
 *   1. Sticky header: separation on scroll, compact on scroll-down.
 *   2. Mobile menu: open/close, focus trap, Escape, scroll lock.
 *   3. Scroll spy: marks the current section in every surface at once.
 *   4. Language control: switches lang/dir and re-renders the chrome.
 *
 * Performance (§23): one passive scroll listener for the whole header,
 * rAF-throttled so no layout work happens in the listener itself. Section
 * tracking uses IntersectionObserver rather than scroll maths.
 */

import {
  SECTIONS,
  SERVICE_LINKS,
  PRIMARY_CTA,
  SOCIAL_LINKS,
  sectionsFor,
  labelFor,
  currentLang,
  t,
} from './navigation-map.js';

const SCROLL_THRESHOLD = 24; // separation appears
const COMPACT_THRESHOLD = 200; // compacting may begin
const SCROLL_DELTA = 6; // ignore sub-pixel jitter
const LANG_KEY = 'site-lang';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/* -------------------------------------------------------------------------
   SURFACE RENDERING
   ------------------------------------------------------------------------- */

function buildNavLink(section) {
  const link = document.createElement('a');
  link.href = destination(section);
  link.className = 'c-nav__link';
  link.dataset.navLink = '';

  const label = document.createElement('span');
  label.className = 'c-nav__label';
  label.textContent = labelFor(section);
  link.append(label);

  // Consumed by ::before to reserve the semibold width — see navigation.css.
  link.dataset.label = label.textContent;
  return link;
}

/**
 * Where a navigation entry points.
 *
 * A section entry is an anchor on the homepage; a page entry (one carrying
 * `href`) is a file. On the homepage the anchor is a bare fragment; on any
 * other page it has to name the homepage explicitly, which is what HOME does.
 */
function destination(entry) {
  return entry.href ?? `${HOME}#${entry.id}`;
}

function buildDrawerLink(section, index) {
  const link = document.createElement('a');
  link.href = destination(section);
  link.className = 'c-drawer__link';
  link.dataset.navLink = '';

  const idx = document.createElement('span');
  idx.className = 'c-drawer__index';
  idx.setAttribute('aria-hidden', 'true');
  idx.textContent = String(index + 1).padStart(2, '0');

  const label = document.createElement('span');
  label.textContent = labelFor(section);

  link.append(idx, label);
  return link;
}

/**
 * A child destination inside the drawer. Deliberately NOT a c-drawer__link:
 * no numeral (the numbering belongs to the top-level sequence) and a quieter
 * size, so the list still reads as one level under its parent rather than
 * eight equal shouts.
 */
function buildDrawerSubLink(entry) {
  const link = document.createElement('a');
  link.href = destination(entry);
  link.className = 'c-drawer__sublink';
  link.dataset.navLink = '';
  link.textContent = labelFor(entry);
  return link;
}

function buildFooterLink(section) {
  const link = document.createElement('a');
  link.href = destination(section);
  link.className = 'c-link';
  link.dataset.navLink = '';
  link.textContent = labelFor(section);
  return link;
}

/**
 * CROSS-PAGE ANCHORS.
 *
 * The header, drawer and footer are one component shared by every page — the
 * markup says so and tools/build-chrome.js enforces it. But their links are
 * page anchors: "#services" is correct on the homepage and dead anywhere else.
 *
 * Rather than teach every link builder which page it is on, this asks the only
 * question that actually matters: does the target exist in THIS document? If
 * it does, the fragment is right and is left alone. If it does not, the link is
 * pointing at a section of the homepage and gets there explicitly.
 *
 * That covers the generated links and the static ones in the same pass, needs
 * no configuration, and self-corrects — move a section between pages and the
 * links follow it.
 */
/**
 * Mark the navigation entry for the page currently being viewed.
 *
 * The scroll spy answers "which section am I in", which a page entry can never
 * satisfy — there is no section to be inside of. This answers the other half:
 * which FILE am I on. Both write the same attribute, so the two surfaces agree.
 */
function markCurrentPage() {
  const here = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const target = (link.getAttribute('href') || '').split('#')[0].split('/').pop();
    if (target && target === here) link.setAttribute('aria-current', 'page');
  });
}

function resolveCrossPageAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (!id || document.getElementById(id)) return;
    link.setAttribute('href', `${HOME}#${id}`);
  });
}

/** Where the page sections live. Empty string on the homepage itself. */
const HOME = document.getElementById('home') ? '' : './index.html';

/**
 * Rebuild every [data-nav-render] container from the shared map. Called on
 * boot and again whenever the language changes.
 */
function renderSurfaces() {
  document.querySelectorAll('[data-nav-render]').forEach((container) => {
    const kind = container.dataset.navRender;

    // The services column renders from its own array rather than from
    // SECTIONS — the six categories are not page-level navigation, but they
    // are still a single source, so the footer cannot drift from the Services
    // section.
    if (kind === 'services') {
      container.replaceChildren(
        ...SERVICE_LINKS.map((service) => {
          const item = document.createElement('li');
          item.append(buildFooterLink(service));
          return item;
        })
      );
      return;
    }

    const surface = kind === 'footer' ? 'footer' : 'nav';
    const style = container.dataset.navStyle ?? surface;
    const sections = sectionsFor(surface);

    container.replaceChildren(
      ...sections.map((section, index) => {
        const item = document.createElement('li');
        if (style === 'drawer') {
          item.className = 'c-drawer__item';
          item.style.setProperty('--i', String(index));
          item.append(buildDrawerLink(section, index));

          // Children render as an indented list under their parent. The
          // parent link still works — tapping "Services" goes to the section,
          // tapping a child goes straight to that service.
          if (section.children?.length) {
            const list = document.createElement('ul');
            list.className = 'c-drawer__sub';
            list.append(...section.children.map((child) => {
              const row = document.createElement('li');
              row.append(buildDrawerSubLink(child));
              return row;
            }));
            item.append(list);
          }
        } else if (style === 'footer') {
          item.append(buildFooterLink(section));
        } else {
          item.append(buildNavLink(section));
        }
        return item;
      })
    );
  });

  resolveCrossPageAnchors();
  markCurrentPage();

  // Social links render only if real profiles exist — none are invented.
  document.querySelectorAll('[data-social-render]').forEach((container) => {
    const block = container.closest('[data-social-block]') ?? container;
    block.hidden = SOCIAL_LINKS.length === 0;

    container.replaceChildren(
      ...SOCIAL_LINKS.map(({ label, href }) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        // These are the only off-site destinations on the site. They leave it,
        // so they open in a new tab, say so to a screen reader, and carry the
        // rel that stops the opened page reaching back through window.opener.
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        const note = document.createElement('span');
        note.className = 'u-visually-hidden';
        note.textContent = ` ${t('opensNewTab')}`;
        link.append(note);
        item.append(link);
        return item;
      })
    );
  });
}

/** Apply chrome strings and CTA labels for the current language. */
function renderStrings() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  });

  document.querySelectorAll('[data-cta-label]').forEach((el) => {
    el.textContent = labelFor(PRIMARY_CTA);
  });

  document.querySelectorAll('[data-cta-link]').forEach((el) => {
    // HOME is '' on the homepage, so this stays a plain fragment there and
    // becomes a real cross-page link everywhere else. Set here rather than
    // patched afterwards, because renderStrings() runs after renderSurfaces()
    // and would otherwise put the dead fragment back.
    el.setAttribute('href', `${HOME}#${PRIMARY_CTA.target}`);
  });
}

/* -------------------------------------------------------------------------
   HEADER — sticky separation + compact on scroll-down
   ------------------------------------------------------------------------- */

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  let lastY = window.scrollY;
  let compact = false;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;

    header.classList.toggle('is-scrolled', y > SCROLL_THRESHOLD);

    const delta = y - lastY;

    if (Math.abs(delta) > SCROLL_DELTA) {
      // Down past the threshold compacts; any upward movement restores the
      // full header immediately, so navigation is never hunted for (§08).
      if (delta > 0 && y > COMPACT_THRESHOLD) compact = true;
      else if (delta < 0) compact = false;
      lastY = y;
    }

    if (y <= COMPACT_THRESHOLD) compact = false;

    header.classList.toggle('is-compact', compact);
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();

  return {
    /** Menu open/close must not leave the header stuck in a compact state. */
    reset() {
      compact = false;
      lastY = window.scrollY;
      header.classList.remove('is-compact');
    },
  };
}

/* -------------------------------------------------------------------------
   MOBILE MENU
   ------------------------------------------------------------------------- */

function initDrawer(header) {
  const trigger = document.querySelector('[data-menu-trigger]');
  const drawer = document.querySelector('[data-drawer]');
  if (!trigger || !drawer) return;

  let lastFocused = null;

  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

  const setTriggerLabel = () => {
    trigger.setAttribute('aria-label', t(isOpen() ? 'closeMenu' : 'openMenu'));
  };

  const open = () => {
    lastFocused = document.activeElement;
    trigger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('is-open');
    drawer.removeAttribute('inert');
    document.documentElement.classList.add('is-scroll-locked');
    // The trigger doubles as the close control, so the full-height header
    // must be showing while the menu is open.
    header?.reset();
    setTriggerLabel();

    drawer.querySelector(FOCUSABLE)?.focus();
  };

  const close = ({ restoreFocus = true } = {}) => {
    trigger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('is-open');
    drawer.setAttribute('inert', '');
    document.documentElement.classList.remove('is-scroll-locked');
    setTriggerLabel();
    if (restoreFocus) {
      (lastFocused instanceof HTMLElement ? lastFocused : trigger).focus();
    }
  };

  trigger.addEventListener('click', () => (isOpen() ? close() : open()));

  // Following a link closes the menu; focus goes to the section, not back to
  // the trigger.
  drawer.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) close({ restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab') return;

    // The trigger sits outside the drawer but is part of the menu, so it is
    // included in the cycle — otherwise the close control is untabbable.
    const focusable = [
      trigger,
      ...drawer.querySelectorAll(FOCUSABLE),
    ].filter((el) => el.offsetParent !== null || el === trigger);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Crossing to desktop must not strand the scroll lock or the focus trap.
  window.matchMedia('(min-width: 64em)').addEventListener('change', (event) => {
    if (event.matches && isOpen()) close({ restoreFocus: false });
  });

  close({ restoreFocus: false });

  return { close, refreshLabel: setTriggerLabel };
}

/* -------------------------------------------------------------------------
   SCROLL SPY
   ------------------------------------------------------------------------- */

function initScrollSpy() {
  /* CHILDREN ARE OBSERVED TOO. The drawer now offers the five services as
     destinations, and a destination the spy does not watch is a row that can
     never say "you are here" — worse, its parent stays lit, so the menu
     actively reports the wrong place. Flattened rather than special-cased:
     anything reachable from the map is a target. */
  const targets = SECTIONS
    .flatMap((section) => [section, ...(section.children ?? [])])
    // A page entry has no section in this document; getElementById returns
    // null and it drops out here, which is the right answer for it.
    .map((section) => document.getElementById(section.id))
    .filter(Boolean);

  if (targets.length === 0) return;

  const setCurrent = (id) => {
    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      const isCurrent = link.getAttribute('href') === `#${id}`;
      if (isCurrent) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const visible = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.set(entry.target.id, entry.intersectionRatio);
        } else {
          visible.delete(entry.target.id);
        }
      });

      if (visible.size === 0) return;

      // Whichever section occupies most of the reading band wins.
      const [topId] = [...visible.entries()].sort((a, b) => b[1] - a[1])[0];
      setCurrent(topId);
    },
    {
      // A band beneath the header — the section being read, not merely the one
      // touching the viewport edge.
      rootMargin: '-20% 0px -60% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  targets.forEach((target) => observer.observe(target));
}

/* -------------------------------------------------------------------------
   LANGUAGE
   Switches document language and direction. Only header chrome and navigation
   labels are translated at this stage; page copy follows when it is finalised.
   ------------------------------------------------------------------------- */

function initLanguage(onChange) {
  const options = [...document.querySelectorAll('[data-lang]')];
  if (options.length === 0) return;

  const apply = (lang, { persist = true } = {}) => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';

    options.forEach((option) => {
      option.setAttribute('aria-pressed', String(option.dataset.lang === lang));
    });

    if (persist) {
      try {
        localStorage.setItem(LANG_KEY, lang);
      } catch {
        // Private browsing or storage disabled — the choice simply does not
        // persist across page loads.
      }
    }

    renderSurfaces();
    renderStrings();
    onChange?.();
  };

  options.forEach((option) => {
    option.addEventListener('click', () => apply(option.dataset.lang));
  });

  let stored = null;
  try {
    stored = localStorage.getItem(LANG_KEY);
  } catch {
    stored = null;
  }

  apply(stored === 'ar' || stored === 'en' ? stored : currentLang(), {
    persist: false,
  });
}

/* ------------------------------------------------------------------------- */

/**
 * Keep the copyright year current.
 *
 * The markup ships the correct year, so this changes nothing today and the
 * footer is right with JavaScript disabled. It exists so the year does not
 * quietly go stale on 1 January — the one piece of the footer that has an
 * expiry date.
 */
function initYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((el) => {
    if (el.textContent.trim() !== year) el.textContent = year;
  });
}

export function initNavigation() {
  renderSurfaces();
  renderStrings();
  initYear();

  const header = initHeader();
  const drawer = initDrawer(header);

  initLanguage(() => drawer?.refreshLabel());
  initScrollSpy();
}
