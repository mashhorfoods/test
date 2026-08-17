/**
 * DISCLOSURE — accordion and tabs.
 *
 * Both are progressive enhancements. Without JavaScript every accordion panel
 * is open and every tab panel is rendered, so no business information is ever
 * unreachable (rule 14). JavaScript adds the collapsing behaviour and the ARIA
 * wiring, it does not create the content.
 */

/* -------------------------------------------------------------------------
   ACCORDION

   Markup contract:
     <div class="c-accordion" data-accordion [data-accordion-single]>
       <div class="c-accordion__item">
         <h3><button class="c-accordion__trigger" data-accordion-trigger>…</button></h3>
         <div class="c-accordion__panel" data-accordion-panel>
           <div class="c-accordion__panel-inner">
             <div class="c-accordion__content">…</div>
           </div>
         </div>
       </div>
     </div>

   Add data-accordion-open to the item that should start expanded.
   ------------------------------------------------------------------------- */

let uid = 0;
const nextId = (prefix) => `${prefix}-${(uid += 1)}`;

function initAccordion(root) {
  const single = root.hasAttribute('data-accordion-single');
  const items = [...root.querySelectorAll('[data-accordion-trigger]')].map((trigger) => {
    // Keyed off the behaviour hook, not a style class: per the naming
    // convention, data-* attributes are what JavaScript binds to, so
    // restyling or renaming a component can never break its behaviour.
    const item = trigger.closest('[data-accordion-item]') ?? trigger.parentElement;
    const panel = item?.querySelector('[data-accordion-panel]');
    return panel ? { trigger, panel, item } : null;
  });

  const pairs = items.filter(Boolean);
  if (pairs.length === 0) return;

  const setExpanded = ({ trigger, panel }, expanded) => {
    trigger.setAttribute('aria-expanded', String(expanded));
    panel.dataset.collapsed = String(!expanded);
    // Keep collapsed content out of the tab order without display:none, so the
    // grid-rows transition still runs.
    if (expanded) panel.removeAttribute('inert');
    else panel.setAttribute('inert', '');
  };

  pairs.forEach((pair) => {
    const { trigger, panel, item } = pair;

    if (!trigger.id) trigger.id = nextId('accordion-trigger');
    if (!panel.id) panel.id = nextId('accordion-panel');
    trigger.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', trigger.id);
    trigger.type = 'button';

    setExpanded(pair, item?.hasAttribute('data-accordion-open') ?? false);

    trigger.addEventListener('click', () => {
      const willExpand = trigger.getAttribute('aria-expanded') !== 'true';

      if (single && willExpand) {
        pairs.forEach((other) => other !== pair && setExpanded(other, false));
      }

      setExpanded(pair, willExpand);
    });
  });

  // Roving arrow-key movement between triggers, per the WAI-ARIA pattern.
  root.addEventListener('keydown', (event) => {
    const index = pairs.findIndex((pair) => pair.trigger === event.target);
    if (index === -1) return;

    const keys = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: pairs.length - 1,
    };

    if (!(event.key in keys)) return;
    event.preventDefault();

    const target = (keys[event.key] + pairs.length) % pairs.length;
    pairs[target].trigger.focus();
  });
}

/* -------------------------------------------------------------------------
   TABS

   Markup contract:
     <div data-tabs>
       <div class="c-tabs__list" role="tablist" aria-label="…">
         <button class="c-tabs__tab" data-tab="key">…</button>
       </div>
       <div class="c-tabs__panel" data-tab-panel="key">…</div>
     </div>
   ------------------------------------------------------------------------- */

function initTabs(root) {
  const tabs = [...root.querySelectorAll('[data-tab]')];
  const panels = [...root.querySelectorAll('[data-tab-panel]')];
  if (tabs.length === 0 || panels.length === 0) return;

  const panelFor = (key) => panels.find((panel) => panel.dataset.tabPanel === key);

  tabs.forEach((tab) => {
    const panel = panelFor(tab.dataset.tab);
    if (!panel) return;

    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    if (!tab.id) tab.id = nextId('tab');
    if (!panel.id) panel.id = nextId('tabpanel');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
  });

  const select = (tab, { moveFocus = true } = {}) => {
    tabs.forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected));
      // Roving tabindex: only the selected tab is in the tab order.
      candidate.tabIndex = selected ? 0 : -1;

      const panel = panelFor(candidate.dataset.tab);
      if (!panel) return;
      panel.hidden = !selected;
      if (selected) {
        panel.dataset.entering = 'true';
        panel.addEventListener(
          'animationend',
          () => delete panel.dataset.entering,
          { once: true }
        );
      }
    });

    if (moveFocus) tab.focus();
  };

  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab]');
    if (tab && tabs.includes(tab)) select(tab, { moveFocus: false });
  });

  const list = root.querySelector('[role="tablist"]');
  const vertical = list?.getAttribute('aria-orientation') === 'vertical';

  root.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(event.target);
    if (index === -1) return;

    // A vertical tablist moves on Up/Down. A horizontal one moves on
    // Left/Right, swapped under RTL so travel follows the reading direction.
    const rtl = getComputedStyle(root).direction === 'rtl';
    const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';

    const keys = {
      [forward]: index + 1,
      [back]: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };

    if (!(event.key in keys)) return;
    event.preventDefault();
    select(tabs[(keys[event.key] + tabs.length) % tabs.length]);
  });

  // Opt-in hover activation for preview-style tablists. Fine pointers only —
  // on touch there is no hover, and tapping already selects. Focus is never
  // moved, so a mouse passing over the list cannot steal it from the keyboard.
  if (root.hasAttribute('data-tabs-hover') && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    tabs.forEach((tab) => {
      tab.addEventListener('pointerenter', () => select(tab, { moveFocus: false }));
    });
  }

  const initial = tabs.find((tab) => tab.hasAttribute('data-tab-selected')) ?? tabs[0];
  select(initial, { moveFocus: false });

  /* DEEP LINK FROM A SERVICE SECTION.
     Each service now carries a one-line packages band whose link points here.
     Landing on #pricing with the wrong category open would make the visitor
     hunt for the packages they just asked to see, so the link names its
     category and this opens it. Focus is NOT moved — the browser is already
     scrolling to the section, and stealing focus mid-scroll fights it.

     Progressive enhancement: with JavaScript off no panel is hidden, so the
     same link lands on a page showing every category. Nothing is lost. */
  document.querySelectorAll('[data-pricing-jump]').forEach((link) => {
    link.addEventListener('click', () => {
      const tab = tabs.find((t) => t.dataset.tab === link.dataset.pricingJump);
      if (tab) select(tab, { moveFocus: false });
    });
  });
}

/* -------------------------------------------------------------------------
   TOOLTIP — associates the bubble with its trigger for assistive tech.
   ------------------------------------------------------------------------- */

function initTooltip(root) {
  const trigger = root.querySelector('[data-tooltip-trigger]');
  const bubble = root.querySelector('[data-tooltip-bubble]');
  if (!trigger || !bubble) return;

  if (!bubble.id) bubble.id = nextId('tooltip');
  bubble.setAttribute('role', 'tooltip');
  trigger.setAttribute('aria-describedby', bubble.id);

  // A bubble centred on a trigger near the viewport edge would be clipped.
  // Measure just before it shows and nudge it back inside. The bubble is
  // visibility:hidden rather than display:none, so it always has a box to
  // measure — no reflow thrash and no flash of a mispositioned tooltip.
  const EDGE = 16;

  const position = () => {
    bubble.style.setProperty('--tooltip-shift', '0px');
    const rect = bubble.getBoundingClientRect();
    const overflowStart = EDGE - rect.left;
    const overflowEnd = rect.right - (document.documentElement.clientWidth - EDGE);

    let shift = 0;
    if (overflowStart > 0) shift = overflowStart;
    else if (overflowEnd > 0) shift = -overflowEnd;

    bubble.style.setProperty('--tooltip-shift', `${Math.round(shift)}px`);
  };

  root.addEventListener('pointerenter', position);
  root.addEventListener('focusin', position);
}

/* -------------------------------------------------------------------------
   RESPONSIVE EXPANDABLE

   A disclosure that only *is* a disclosure below a given width. Above it the
   panel is simply part of the page and the trigger disappears.

   This exists because a package's feature list has to behave differently by
   viewport: on desktop the whole comparison should be visible at once, while
   on mobile three full lists bury the prices under a screen of scrolling.

   CSS alone cannot do it. Forcing the panel open with a media query would
   leave the `inert` attribute in place — visible text, hidden from assistive
   tech — and `inert` can only be removed from script. So the breakpoint is
   evaluated here, and re-evaluated whenever it changes.

     <div data-expand data-expand-static-above="64em">
       <button data-expand-trigger>…</button>
       <div data-expand-panel>…</div>
     </div>
   ------------------------------------------------------------------------- */

function initExpandable(root) {
  const trigger = root.querySelector('[data-expand-trigger]');
  const panel = root.querySelector('[data-expand-panel]');
  if (!trigger || !panel) return;

  if (!trigger.id) trigger.id = nextId('expand-trigger');
  if (!panel.id) panel.id = nextId('expand-panel');
  trigger.type = 'button';
  trigger.setAttribute('aria-controls', panel.id);
  panel.setAttribute('aria-labelledby', trigger.id);

  const staticAbove = root.dataset.expandStaticAbove;
  const mq = staticAbove ? window.matchMedia(`(min-width: ${staticAbove})`) : null;

  const setExpanded = (expanded) => {
    trigger.setAttribute('aria-expanded', String(expanded));
    panel.dataset.collapsed = String(!expanded);
    if (expanded) panel.removeAttribute('inert');
    else panel.setAttribute('inert', '');
  };

  const apply = () => {
    // Above the breakpoint the panel is static content: always open, never
    // inert, and the trigger is out of the tree entirely rather than merely
    // hidden — so it cannot be reached by keyboard or screen reader.
    if (mq?.matches) {
      root.dataset.expandStatic = 'true';
      setExpanded(true);
      trigger.hidden = true;
    } else {
      root.dataset.expandStatic = 'false';
      trigger.hidden = false;
      setExpanded(trigger.getAttribute('aria-expanded') === 'true');
    }
  };

  trigger.addEventListener('click', () => {
    setExpanded(trigger.getAttribute('aria-expanded') !== 'true');
  });

  setExpanded(false);
  apply();
  mq?.addEventListener('change', apply);
}

export function initDisclosure(scope = document) {
  scope.querySelectorAll('[data-accordion]').forEach(initAccordion);
  scope.querySelectorAll('[data-tabs]').forEach(initTabs);
  scope.querySelectorAll('[data-tooltip]').forEach(initTooltip);
  scope.querySelectorAll('[data-expand]').forEach(initExpandable);
}
