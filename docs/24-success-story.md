# Stage 24 — Success story

A scroll narrative in five chapters, on its own page at `/story.html`.

---

## 0. Two conflicts in the brief, and how they were resolved

**The brief is written for a different company.** It is headed "QUANTUM LINK"
and §03 — marked CRITICAL — requires preserving Quantum Black `#111111`,
Quantum Paper `#F4F1EA`, Quantum Blue `#2447FF`, Quantum Lime `#C7F36B`, Cool
Gray `#6B6F76`, Manrope, IBM Plex Sans Arabic, and a visual grammar called
ARC / LINK / FRAME / SHIFT.

None of that exists in this repository. This site's locked identity is
`#202020`, `#FFFFFF`, `#F4D13F`, Poppins and Cairo, and has been since Stage
00. Applying the brief's palette literally would have *destroyed* the identity
§03 exists to protect, so the rule was followed rather than the letter: the
story is built in this site's identity, and every value in `story.css` is an
existing token. A test asserts the sketch layer paints in nothing but the
site's own ink.

**There is no case study.** §06 requires Chapter 05 to end with "the actual
approved success / impact information" and forbids inventing metrics, numbers
or client statements. There is no client, project, outcome or metric anywhere
in the supplied source material — and every prior stage explicitly forbade
fabricating them.

So the page tells the one story that can be told truthfully: **the argument
this studio already makes on its own homepage.** Every line of copy in
`src/data/story.json` is quoted from `#integrated` or `#process`, and the file
records the source per chapter. Two chapters are verbatim.

That is not a workaround — §22 asks for exactly this: "This is not only about
the client. It is also a subtle demonstration of methodology… SHOW IT."

**To make it a client case study**, replace the five chapters in
`story.json`. The page, the sketches, the thread and the motion do not change.

---

## 1. The story

| | Chapter | Annotation | Source |
|---|---|---|---|
| 01 | Four services. Four conversations. | problem | `#integrated` — "Separate providers" |
| 02 | The work was never the problem. | insight | `#integrated` lead, **verbatim** |
| 03 | One system, not four purchases. | direction | `#integrated` — the four ecosystem stops, in order |
| 04 | Six stages turn it into work. | system | `#process` — the six published stages |
| 05 | Planned together. Delivered together. | impact | `#integrated` hub note, **verbatim** |

The arc the brief asks for — **rough → connected → defined → systematic →
resolved** — is carried by the drawings, not asserted by the copy:

```
scatter  →  probe  →  sequence  →  spine  →  resolve
```

Four unrelated boxes; then dashed lines searching between them with one
committing; then the boxes in line inside a frame; then a six-stage spine;
then the hub-and-spokes diagram **the homepage already publishes**. The last
drawing is the site's real diagram, so the story resolves into the brand's own
grammar rather than into a picture of one.

---

## 2. The thread (§09, §10)

One line, four appearances, and deliberately not the same line each time. It
leaves Chapter 01 wandering — two changes of mind in a short distance — and
arrives at Chapter 05 straight, confident and in the accent.

| after chapter | wander | |
|---|---|---|
| 01 | 18 units | muted |
| 02 | 11 | muted |
| 03 | 5 | muted |
| 04 | **0 — a straight line** | **accent** |

A reader never has to notice this for it to work; they only have to feel the
story getting surer of itself. A test asserts the last segment is literally
`M30 0 L30 126` and that no two earlier segments repeat.

---

## 3. How the drawing draws

Every stroke carries `pathLength="1"`. That normalises all geometry to one
nominal length, so a single CSS rule — `stroke-dasharray: 1`, `dashoffset:
1 → 0` — animates a 12px tick and a 400px arc identically, and **no JavaScript
measures anything**. `--d` on each path is its position in the drawing order,
so the hand works through the sketch instead of everything arriving at once.

`src/scripts/story.js` is **1.9KB** and does one thing: adds a class when a
chapter enters the viewport, then unobserves it. A chapter cannot redraw
itself on the way back up (§18).

**One defect worth recording.** The exploratory dashed lines in Chapter 02
rendered solid: `stroke-dasharray: 1` (needed for the normalisation above)
overwrote the dash pattern that made a draft line *look* like a draft — and
that distinction is what Chapter 02 is built on. Draft strokes now fade in
instead of drawing, keeping their dash. That is also the truer gesture: a line
you are still thinking about does not get drawn with conviction.

### Reduced motion (§19)

The animated state exists *only* inside `prefers-reduced-motion:
no-preference`. Under `reduce` there is nothing to undo — the finished drawing
is simply what renders. The same property makes the page independent of
JavaScript: with scripting off, all 109 strokes are already at their final
position. Both are asserted.

---

## 4. Composition

**Desktop (§13):** a 12-column editorial grid — text in five columns, drawing
in six, a full column of air between, sides swapping every chapter. Placement
is explicit, never `order`, so the reading order in the markup is the reading
order for a screen reader and a keyboard whichever side the drawing is on.

**Mobile (§14):** not a stacked desktop. Number and annotation, title, text,
aside, then the drawing at full width — the reader knows what they are looking
at before they look at it. No horizontal galleries, no swipe, no hover
dependency.

---

## 5. Why its own page

The homepage is ~29 screens on a phone and Stage 22 spent its whole budget
making that length navigable. Five more chapters would have undone it. A
narrative that asks to be read start-to-finish also wants a page it owns.

That created a second problem worth naming: the header has claimed since Stage
01 that "identical markup serves every page", and the moment a second page
existed, that promise needed something keeping it. A hand-copied header drifts.

- **`tools/build-chrome.js`** copies the header, drawer and footer *from*
  `index.html` into every other page, matched on markup rather than line
  numbers. `index.html` stays the single source and is never written to.
- **Cross-page anchors** resolve themselves. `#services` is correct on the
  homepage and dead anywhere else, so rather than teach every link builder
  which page it is on, `resolveCrossPageAnchors()` asks the only question that
  matters: *does this target exist in this document?* If not, it points at the
  homepage. That covers generated and static links in one pass and
  self-corrects if a section ever moves.

---

## 6. Performance (§24)

| | |
|---|---|
| `dist/story.html` | 261 KB raw, **98.8 KB gzipped** — smaller than the homepage |
| new JavaScript | 1.9 KB (`story.js`) |
| new CSS | 14.1 KB (`story.css`) |
| images | **none** — every drawing is inline SVG |
| canvas / WebGL / video / animation library | none |
| `requestAnimationFrame` / `setInterval` | none |
| continuous animation | none — each chapter draws once and stops |

---

## 7. Checked, not assumed

Twenty suites pass. `story.js` (the suite) covers, in both languages:

- five chapters, four connectors, one `h1` with five `h2`s under it and no
  level skipped
- **every rendered line matches `story.json` verbatim** — nothing drifts into
  the markup
- **no percentage, multiplier, ROI, conversion rate, award, guarantee or
  client statement** appears anywhere in the story
- every sketch is `role="img"` with a described `<title>` and a bilingual
  caption; the decorative connectors are `aria-hidden`
- reduced motion: all 109 strokes finished, no text waiting on an animation
- no JavaScript: five chapters, five titles, full narrative in the markup
- drawn once on entry; scrolling back up replays nothing
- desktop alternates sides; mobile stacks full width with no horizontal scroll
- the sketch paints in the site's ink only, in the brand faces, on the brand
  background, inside the shared header and footer
- one link in from `#integrated`, no dead anchors out

**Two real defects the suites caught**, both fixed: the new homepage link and
the story's closing link were 26px tall against the 44px touch-target minimum
— found by the existing accessibility suites, not by this stage's own.

---

## 8. Still open

`story.json` carries the studio's own argument because that is what is
verified. The moment a real project — with a client's permission, real
artefacts and real outcomes — is approved, it replaces those five chapters and
§21's "sketch → real design → application → final result" becomes possible:
the sketch layer is already built to sit *beside* real work rather than stand
in for it. That needs the project, not more code.
