# /about gets images and a scroll language — and one guard that had to be proved

**6 September 2026.** All the supplied images used, and the page joins the
motion system the rest of the site already had.

---

## 1. The gap, counted

`data-reveal` attributes per page, before this:

| | |
| --- | ---: |
| `index.html` | **47** |
| `pricing.html` | 14 |
| `story.html` | 2 |
| **`about.html`** | **0** |

So the page had no scroll language at all. Not a style choice — it had simply
never been wired in, which is why it read flat next to everything else.

`privacy`, `terms` and `accessibility` also have none, and **should keep none**:
they are legal documents, and motion on a page someone is reading for their
rights is decoration in the wrong place.

---

## 2. Three images, placed by what each argues

Four files, three pictures — `about2` and `about3` are the same isometric with
different bytes, so it appears once.

| Where | Image | Why there |
| --- | --- | --- |
| After the lead | **about1** — warm, a face | The page's claim is *"you deal with the person doing the work"*. It opens with a person |
| Before *How remote actually works* | **about4** — dark, a figure from behind, a globe | Its subject is distance. It sits above the section about distance |
| Closing the page | **about2** — the isometric core and its five stations | It argues *many parts, one system*, which is the page's summary rather than any one section. A visual full stop |

The two later figures run **wider than the reading measure** (1320px against a
672px prose column), so the page alternates: text width, image width, text
width, image width. That alternation is the rhythm — three images at the same
width would have been a column of pictures.

---

## 3. The motion

**Two layers, both already this site's vocabulary.**

**The reveal.** Every heading and paragraph now carries `data-reveal` — the same
fade-up the homepage uses, one observer per element, so each arrives as you
reach it rather than the whole page firing at once.

**The drift.** Each figure's image is scaled slightly and shifts vertically
within its frame as the page passes it. Pure CSS on a view timeline:

```css
animation: figure-drift linear both;
animation-timeline: view();
animation-range: entry 0% exit 100%;
```

No script, nothing to fail, and no work at all in browsers that do not support
it. The frame clips, so the movement happens **inside** the picture and the
layout never shifts.

---

## 4. The finding: scroll-driven motion escapes the site's reduced-motion guard

`01-reset.css` carries a universal rule that flattens `animation-duration`,
`animation-delay`, `animation-iteration-count` and `transition-duration` with
`!important`. `docs/83` §1 checked it and found it covers everything — the
orbit's infinite animation included.

**It does not cover this.** A scroll-driven animation takes its progress from
the scroll position. There is no duration to flatten.

Tested on a minimal page carrying exactly that guard and nothing else:

```
reduced-motion OFF: transform=matrix(1, 0, 0, 1, 0, 40)   STILL ANIMATING
reduced-motion ON : transform=matrix(1, 0, 0, 1, 0, 40)   STILL ANIMATING
```

Identical. So for this one kind of animation the site's safety net is not
there, and the only protection is declaring it inside
`prefers-reduced-motion: no-preference` — which installs the rule *solely* for
people who have not asked for less motion.

The drift is written that way. **Verified on the real page**, not just the
test: with reduced motion on, all three images compute `transform: none`.

### 4.1 The guard, and the bug in the guard

`qa.js` **§25** fails any `animation-timeline` declared outside a
`no-preference` block, because that failure is silent — it looks correct to
whoever wrote it and ignores the one preference a person can state about motion.

**Its first run flagged `/about`'s own drift, and the CSS was right.**
`@supports (animation-timeline: view())` names the property in its *condition*,
before any guard block has opened, and the scanner counted that as a
declaration. Declarations are never inside parentheses; an `@supports`
condition always is. Fixed by tracking paren depth.

Proved both ways: clean on the correct CSS, and firing when the
`no-preference` wrapper is replaced with `@media all`.

---

## 5. Verified

| | |
| --- | --- |
| Desktop / phone / Arabic | 3 images, all loaded, all drifting, **none upscaled** |
| **Reduced motion** | `transform: none` on all three; all 9 prose blocks visible |
| **JavaScript off** | **9/9** prose blocks visible, and the drift still works — it is CSS |
| RTL | `dir="rtl"`, Arabic alt on every image |
| Weight | page 188KB; images 90 + 58 + 40KB, copied to `assets/` and cached once for the site, not inlined |

`validate.js` **0** · `qa.js` **0 high, 0 medium** · `a11y.js` **0**.

---

## 6. What was left alone

`privacy`, `terms`, `accessibility` — no reveals, deliberately, as above.

And the drift is **restrained on purpose**: a 7% scale and a 1.8% shift. Enough
that the page feels alive as it moves, little enough that nobody reading it has
to think about it. A larger figure would have been easier to notice and worse
to sit with.
