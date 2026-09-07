# /about, split — image beside the section it belongs to

**6 September 2026.** The images had been running full-measure between blocks of
prose. On a wide screen that put a 672px reading column next to 550px of
nothing, and each image read as an interruption rather than as belonging to
anything.

---

## 1. The layout

**Below 48em:** one column. Each pair stacks image-then-text, the order it reads
in.

**From 48em up** — tablet and desktop — two equal columns, **alternating
sides**:

| Row | Image | Section |
| --- | --- | --- |
| 1 | `about1` — warm, a face | **Who you work with** |
| 2 | `about4` — a figure against a globe | **How remote actually works** |
| 3 | `about2` — a core and five stations | **What we charge, and why it is published** |
| — | *(none)* | **What we will not do** — full measure, closing |

The alternation costs one rule:

```css
.c-split__row:nth-of-type(even) .c-split__figure { grid-column: 2; grid-row: 1; }
```

The text flows into track 1 on its own, and **under RTL the whole thing mirrors
with no second rule** — a grid's inline axis follows the document direction.
Measured: English rows read figure-first, second, first; Arabic rows read
second, first, second. Exactly reversed, from one declaration.

### 1.1 The one pairing that is weaker than the others

`about2` is abstract — a lit core with five stations feeding it. It argues *many
parts, one system*. **"What we charge, and why it is published" argues
transparency.** Those are not the same idea, and the pairing is the loosest of
the three.

It is there because there are four sections and three images, and it is the
least-bad assignment: `about1`'s face belongs beside the section about a person,
and `about4`'s distance belongs beside the section about distance. Both of those
are right. The third is a placement rather than a match.

**Worth naming rather than glossing.** If a fourth image ever arrives, this is
the row to reconsider.

---

## 2. The motion

Two scroll-driven layers, no script.

**The pair passes itself.** As a row crosses the viewport its figure rises
14px and its text sinks 9px, so the two move against each other. Small on
purpose: it should register as the page being alive, not as an effect anyone has
to wait through.

**The image settles inside its frame.** A 6% scale and a 1.4% vertical shift, so
the picture is never pinned to its box. The figure clips, so **nothing here
moves the layout.**

Gated to **48em and up** for the counter-drift: stacked on a phone there is no
pair to counterpoint and the movement would read as jitter. Verified —
`transform: none` on every figure at 390px.

### 2.1 The guard, and two bugs in the guard

`qa.js` §25 fails any `animation-timeline` declared outside
`prefers-reduced-motion: no-preference`, because the universal guard in
`01-reset.css` **cannot stop a scroll-driven animation** — it works by
flattening `animation-duration`, and a scroll timeline has none (`docs/94` §4,
measured).

The check has now found two bugs, both its own:

1. **`@supports (animation-timeline: view())` names the property in its
   condition**, before any guard block opens. Declarations are never inside
   parentheses; an `@supports` condition always is. Fixed by tracking paren
   depth.
2. **It flagged the comment explaining itself.** The line in `page.css` reading
   *"qa.js §25 fails any animation-timeline declared without one"* is prose, and
   the scanner was not skipping comments. The word appears in text describing
   the rule as often as in code breaking it.

Both fixed, and re-proved: clean on the correct CSS, and still catching a real
violation when the `no-preference` clause is removed from the media query.

---

## 3. Verified

| | Layout | Alternation | Drift |
| --- | --- | --- | --- |
| Desktop 1440 EN | side by side, 580 / 580 | fig 1st · 2nd · 1st | moving |
| Desktop 1440 AR | side by side, 580 / 580 | **2nd · 1st · 2nd** | moving |
| Tablet 834 | side by side, 373 / 373 | fig 1st · 2nd · 1st | moving |
| Phone 390 | **stacked** | — | **none** |
| Reduced motion | side by side | — | **none** |

No horizontal overflow at any width, in either language.

`validate.js` **0** · `qa.js` **0 high, 0 medium** · `a11y.js` **0**.
