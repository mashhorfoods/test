# Stage 25 — Keyboard navigation

The request was "smooth keyboard navigation". The audit came first, and it
changed what the work turned out to be.

---

## What was already right

Tabbing through the built page and recording every stop:

| | index.html | story.html |
|---|---|---|
| focus stops reachable by Tab | 61 | 26 |
| **stops with no visible focus ring** | **0** | **0** |
| **stops scrolled off screen** | **0** | **0** |

The mechanics were sound before this stage: a token focus ring on everything,
a forced-colours fallback, `scroll-padding-block-start` and `scroll-margin` set
against the sticky header, a working skip link, a drawer focus trap with
Escape, and roving arrow keys in the services accordion.

So the problem was not *reaching* things. It was what happened **after acting**.

---

## The defect: focus was lost on every in-page jump

Activating any same-page link — the skip link, a header nav item, a drawer
item, a footer quick link, any "Start Your Project" — scrolled correctly and
left `document.activeElement` on `<body>`.

```
skip link  → Enter → BODY — focus was lost
nav "Process" → Enter → BODY — focus was lost   (scrolled to 14229 ✓)
```

Three consequences, all bad:

1. the focus ring vanishes, so a sighted keyboard user loses their place;
2. a screen reader is **never taken to the destination** — nothing moved, so
   nothing is announced;
3. the next Tab resumes from wherever the browser decides, which is not
   specified and differs between engines.

The scroll was never the issue. The **focus** was. The drawer even carried a
comment saying *"focus goes to the section, not back to the trigger"* — the
intent was right and the code to do it did not exist.

### The fix

`src/scripts/focus.js`, 1.6KB, one delegated listener. When a same-document
link is followed, focus moves to what it points at.

- Sections here carry `aria-labelledby`, so focusing one makes a screen reader
  announce the section by name — the same confirmation a sighted user gets from
  watching the page scroll.
- `tabindex="-1"` is added **on demand** and removed on blur, so the document
  is not littered with focus targets and the DOM is left as authored. `-1`
  never adds a Tab stop.
- `focus({ preventScroll: true })` matters: without it the browser jumps to
  reveal the element, fighting the smooth scroll the anchor already started.
- `hashchange` is handled too, for back/forward and for a URL pasted with a
  fragment already on it.

---

## The second defect: opening the mobile menu left focus on the trigger

`open()` ended with `drawer.querySelector(FOCUSABLE)?.focus()` — and it did
nothing. Silently. A keyboard user opened the menu and stayed on the trigger
with no indication anything had happened.

The cause is a chain, and it took four attempts to get right. Recorded because
three plausible fixes do **not** work:

| attempt | why it failed |
|---|---|
| focus synchronously after adding `.is-open` | the drawer is `visibility: hidden` until the style recalculates, and **a hidden element cannot take focus** |
| `requestAnimationFrame` | rAF callbacks run **before** the style recalculation for their own frame |
| force a reflow with `offsetHeight` | settles the drawer, not its children |
| `setTimeout(0)` | can still land before the style pass |

The children were the real surprise. The reduced-motion safety net sets
`transition-duration: 0.01ms !important` on `*`, and an element that names no
`transition-property` defaults to **`all`** — so every descendant briefly
transitions its *inherited* `visibility` and reads `hidden` for that instant.

Rather than predict when the element becomes focusable, `open()` now asks
whether it **did**, and retries on the next frame if not. It stops the moment
it succeeds — usually the first attempt — and gives up after five frames
instead of looping.

Two CSS fixes came out of the same investigation and stand on their own merits:

- **`.c-drawer.is-open` names `opacity` as its only transitioned property.**
  `visibility` is transitioned on the *close* path only, and only so the panel
  stays visible while it fades out. On the way in it must apply immediately.
- **The reduced-motion block now zeroes `transition-delay` and
  `animation-delay`, not just durations.** Killing the duration and leaving the
  delay leaves the user waiting anyway — latency without the animation that
  explained it.

---

## After

```
skip link      → Enter → main#main
nav "Process"  → Enter → section#process  "07 How We Work"
menu open      → a.c-drawer__link  "01 Home"
menu Tab       → a.c-drawer__link  "02 Services"
menu Escape    → button.c-menu-trigger
menu → link    → section#services, menu closed
```

Verified in **both** motion modes, because reduced motion was where the drawer
bug lived and it is exactly the setting the affected users are most likely to
have on.

---

## One thing that is not a defect

The audit first reported the skip link as "hidden under the sticky header". It
is not: `--z-skip-link: 600` sits above `--z-header: 400`, and a screenshot
confirms it renders over the header with its focus ring intact.

The check was comparing rectangles, which answers the wrong question. It now
hit-tests the element's own centre with `elementFromPoint` — overlapping the
header is not the same as being hidden behind it.

---

## Deliberately not changed

**The language toggle does not respond to arrow keys.** It is a `role="group"`
of buttons carrying `aria-pressed`, which is a valid toggle-button pattern and
is fully operable by Tab and Enter/Space. Arrow-key navigation belongs to
`radiogroup` semantics; adopting it would mean changing the roles, which is a
semantics change rather than a keyboard fix and was not what was asked for.
Worth doing deliberately, if you want it.

---

## Checked

`kb.js` asserts, in both motion modes:

- the first Tab reaches the skip link, and activating it lands on `#main`
- `#services`, `#process` and `#contact` each receive focus when their nav link
  is followed — not merely scroll to
- the destination takes focus via `tabindex="-1"` and **has it removed again on
  blur**
- the menu moves focus inside on open, keeps Tab within it, returns to the
  trigger on Escape, and lands on the destination section when an item is
  followed
- across both pages: every focus stop has a ring, none is scrolled off screen,
  and nothing focused is painted over

21 suites pass.
