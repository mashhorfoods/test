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
    const item = trigger.closest('.c-accordion__item') ?? trigger.parentElement;
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

  root.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(event.target);
    if (index === -1) return;

    // Arrow direction follows the writing direction, so RTL feels native.
    const rtl = getComputedStyle(root).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';

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

  const initial = tabs.find((tab) => tab.hasAttribute('data-tab-selected')) ?? tabs[0];
  select(initial, { moveFocus: false });
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

export function initDisclosure(scope = document) {
  scope.querySelectorAll('[data-accordion]').forEach(initAccordion);
  scope.querySelectorAll('[data-tabs]').forEach(initTabs);
  scope.querySelectorAll('[data-tooltip]').forEach(initTooltip);
}
