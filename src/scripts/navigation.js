/**
 * NAVIGATION
 *
 * Three behaviours, all progressive enhancements over working markup:
 *   1. Header condenses once the page scrolls past the fold threshold.
 *   2. Mobile drawer: open/close, focus trap, Escape, background scroll lock.
 *   3. Scroll spy: marks the current section in every nav surface at once.
 *
 * Rule 14 — the user must always know where they are, what is clickable and
 * how to get back.
 */

import { sectionsFor, labelFor } from './navigation-map.js';

const SCROLL_THRESHOLD = 24;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/* -------------------------------------------------------------------------
   HEADER
   ------------------------------------------------------------------------- */

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  let ticking = false;

  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
    ticking = false;
  };

  // rAF-throttled: the listener itself never does layout work.
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
}

/* -------------------------------------------------------------------------
   MOBILE DRAWER
   ------------------------------------------------------------------------- */

function initDrawer() {
  const trigger = document.querySelector('[data-menu-trigger]');
  const drawer = document.querySelector('[data-drawer]');
  if (!trigger || !drawer) return;

  let lastFocused = null;

  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

  const open = () => {
    lastFocused = document.activeElement;
    trigger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('is-open');
    drawer.removeAttribute('inert');
    document.documentElement.classList.add('is-scroll-locked');

    // Move focus into the drawer so keyboard and screen-reader users land
    // where the visual focus went.
    const first = drawer.querySelector(FOCUSABLE);
    first?.focus();
  };

  const close = ({ restoreFocus = true } = {}) => {
    trigger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('is-open');
    drawer.setAttribute('inert', '');
    document.documentElement.classList.remove('is-scroll-locked');
    if (restoreFocus) (lastFocused instanceof HTMLElement ? lastFocused : trigger).focus();
  };

  trigger.addEventListener('click', () => (isOpen() ? close() : open()));

  // Any in-drawer navigation closes it; focus follows the anchor target.
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

    // Focus trap — Tab cycles within the drawer while it owns the screen.
    const focusable = [...drawer.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null
    );
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

  // Crossing into desktop must not leave a hidden drawer holding the scroll
  // lock or the focus trap.
  const desktop = window.matchMedia('(min-width: 64em)');
  desktop.addEventListener('change', (event) => {
    if (event.matches && isOpen()) close({ restoreFocus: false });
  });

  close({ restoreFocus: false });
}

/* -------------------------------------------------------------------------
   SCROLL SPY
   Marks the section currently occupying the reading position. Every nav
   surface is updated together, so header, drawer and footer never disagree.
   ------------------------------------------------------------------------- */

function initScrollSpy() {
  const links = [...document.querySelectorAll('[data-nav-link]')];
  if (links.length === 0) return;

  const targets = sectionsFor('nav')
    .map((section) => document.getElementById(section.id))
    .filter(Boolean);

  if (targets.length === 0) return;

  const setCurrent = (id) => {
    links.forEach((link) => {
      const isCurrent = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const visible = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
        else visible.delete(entry.target.id);
      });

      if (visible.size === 0) return;

      // The section occupying most of the reading band wins.
      const [topId] = [...visible.entries()].sort((a, b) => b[1] - a[1])[0];
      setCurrent(topId);
    },
    {
      // A band just under the header — the section being *read*, not merely
      // touching the viewport edge.
      rootMargin: '-20% 0px -60% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  targets.forEach((target) => observer.observe(target));
}

/* -------------------------------------------------------------------------
   SURFACE RENDERING
   Builds a nav surface from the shared SECTIONS array so header, drawer and
   footer cannot drift apart. Containers opt in with [data-nav-render].
   ------------------------------------------------------------------------- */

function renderSurfaces() {
  document.querySelectorAll('[data-nav-render]').forEach((container) => {
    const surface = container.dataset.navRender === 'footer' ? 'footer' : 'nav';
    const style = container.dataset.navStyle ?? surface;
    const sections = sectionsFor(surface).filter((section) => !section.isCta);

    container.replaceChildren(
      ...sections.map((section, index) => {
        const item = document.createElement('li');
        if (style === 'drawer') {
          item.className = 'c-drawer__item';
          item.style.setProperty('--i', String(index));
        }

        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.textContent = labelFor(section);
        link.dataset.navLink = '';
        link.className =
          style === 'drawer' ? 'c-drawer__link' : style === 'footer' ? 'c-link' : 'c-nav__link';

        if (style === 'drawer') {
          const idx = document.createElement('span');
          idx.className = 'c-drawer__index';
          idx.setAttribute('aria-hidden', 'true');
          idx.textContent = String(index + 1).padStart(2, '0');
          link.append(idx);
        }

        item.append(link);
        return item;
      })
    );
  });
}

export function initNavigation() {
  renderSurfaces();
  initHeader();
  initDrawer();
  initScrollSpy();
}
