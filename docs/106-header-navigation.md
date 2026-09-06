# The header and navigation — the CTA out, the reach kept

**6 September 2026.** Owner request, two parts: *"Remove CTA from header"* and
*"Redesign the header and navigation next. Check recent UI/UX trends."*

---

## 1. The CTA, and what it was holding up

Removed from every page. `.c-header__cta` is gone from the shell, from
`story.html` and `404.html` (the two pages `build-pages.js` does not generate),
and the five generated pages were rebuilt from the shell. With it went its
desktop rule, its phone `.is-cta-away` rule, and **`initReach()`** — an
IntersectionObserver whose only remaining job was toggling a class nothing
read.

Recorded plainly because the decision reverses a measured one. `docs/71` §3:
with a bare phone header, the homepage ran **4,660px — five and a half screens
— with nothing to press**, and `/story` 80% of its length. `qa`'s `reach` check
exists so that cannot ship twice, and the moment the CTA came out it reported
**13 HIGH failures**, every page in both languages:

```
index.html    (en)  4.0 screens with no call to action in view
story.html    (en)  9.0 screens   ← the whole page
terms.html    (en)  7.5 screens
about · pricing · privacy · accessibility · and the Arabic of each
```

That is a real consequence of a real instruction, so it went to the owner
rather than being papered over. **Their answer: keep the header clear at every
width, and give the phone its own action somewhere else.**

## 2. The phone action

A separate component at the foot of the phone viewport, not a button folded
back into the header. It appears **only when nothing else on the page is
pressable** — one IntersectionObserver over every `.c-btn` in the main content
and the footer, a `Set` of the ones on screen, and `is-on` when that set is
empty. It is not a second call to action; it is the one that appears where the
page has run out of its own, which is precisely the gap `reach` measures.

Two details worth keeping:

**`display: none`, not `visibility: hidden`.** A `visibility: hidden` element
still has a box, and the reach check counts any `.c-btn` whose rect overlaps
the viewport. Hiding it that way would have satisfied the check at every scroll
position on every page whether or not a visitor could see or press anything —
a guard reporting green off an element nobody can reach. `display: none` gives
it a zero rect, so the check measures what is actually on screen. The cost is
that the entrance needs `@starting-style`, which is the cheaper half.

**A `Set`, not a counter.** An IntersectionObserver may report the same target
more than once; a counter drifts negative and puts the bar over a visible
button.

It hides while the drawer is open, never renders from 64em up, and is dropped
in print.

## 3. Smart sticky — away on the way down, back on the way up

The pattern current practice settled on for 2026, and it fits better now than
it did this morning, because the header no longer carries anything that had to
stay in view.

It forced a correction underneath. `is-compact` was **direction**-driven — set
scrolling down, cleared scrolling up — while `is-scrolled` was
**position**-driven, so the header's height depended on which way you last
moved. Add hide-on-scroll-down and that becomes untenable: a header that is off
screen while you scroll down can never be *seen* compact, so the compact height
would have become a state nothing renders. They now split by what they answer:

| class | answers | set when |
| --- | --- | --- |
| `is-scrolled` | where am I | past the scroll threshold |
| `is-compact` | where am I | past the compact threshold |
| `is-hidden` | which way am I going | scrolling down; cleared by any upward movement |

Three things stop it becoming a trap: `:focus-within` cancels the hide, so a
keyboard visitor never tabs into something off the top of the screen;
`prefers-reduced-motion` turns the whole behaviour off rather than merely
slowing it, because the behaviour *is* a moving bar; and `reset()` clears it
when the menu opens, since the drawer's close control lives in the header.

## 4. Contact is a navigation item now

It was in the map as `inNav: false, inMenu: true` — the desktop nav never
carried it, because the CTA did. With the CTA gone that left the desktop with
no path to contact at all. It is now `inNav: true`, so the nav reads **Home ·
Services · Pricing · Story · About · Contact** — six items, inside the 5–7 that
current practice puts as the limit before scannability collapses.

## 5. The breakpoint I tried to move, and the measurement that stopped me

The nav appears at 1024px; below that it is a hamburger. With the CTA gone the
bar holds a brand, six links and a language control, so tablets in portrait —
768, 810, 820 — looked like they should get real navigation instead of a menu.

They cannot. Measuring the three zones' **real boxes**:

| width | gap between brand and centred nav (en) | (ar) |
| --- | --- | --- |
| 768 | **−44px** — they overlap | −2px |
| 800 | −28px | +14px |
| 820 | −18px | +23px |
| 900 | +22px | +61px |
| 1024 | +68px | +103px |

The first width that clears in English is about 880, and a breakpoint that
works in one language is not a breakpoint. So the constraint was never the CTA;
it is six English labels against a brand lockup. Reverted — all five CSS gates
and the `matchMedia` in `navigation.js`, which have to move together, because a
script that disagrees with the stylesheet about where desktop starts leaves an
open menu with no visible way to close it.

**My first measurement said it fitted with 95px to spare.** It summed the
zones' intrinsic widths while the header is a `1fr auto 1fr` grid, so the brand
box it read was the stretched column, not the lockup. A sum of the wrong boxes
is not a fit test — the same shape of error as the tile that measured 584 while
its link measured 800, two commits ago.

## 6. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low — **13 reach HIGHs cleared** |
| `a11y` | 0 violations |
| Header CTA | absent from all 9 pages |
| Nav | Home · Services · Pricing · Story · About · Contact |
| Scroll down | `is-hidden`, `translate: 0 -100%` |
| Scroll up | hidden cleared, compact kept, header 60px |
| Focus while hidden | `translate: 0`, header top at 0 — on screen |
| `prefers-reduced-motion` | class set, `translate: none` — the header stays |
| Menu open | `is-hidden` cleared, trigger on screen at 8px |
| Phone action, nothing else on screen | `display: flex`, 393×72 |
| Phone action, footer CTA on screen | `display: none`, rect 0×0 |
| Phone action, menu open | `display: none` |
| Phone action, desktop | never rendered |
| Arabic | label and href follow the map — "ابدأ مشروعك" → `#contact` |
| Console errors | 0 |
