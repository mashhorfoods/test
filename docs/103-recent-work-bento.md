# Recent Work, redesigned — and the five silent failures found underneath it

**6 September 2026.** Owner request: *"Redesign Recent work section. Do a
complete redesign for the section. Check recent trend UI/UX for the section."*

---

## 1. What the section was

An eyebrow, one paragraph of prose, and a text link. That is all. On a site
whose subject is design, the only piece of client proof on the homepage showed
**no work at all** — you had to read a claim and then leave the page to see
whether it was true.

It was also structurally broken in a way nothing had caught: the `<section>`
carried `aria-labelledby` pointing at the **eyebrow paragraph**. A landmark
labelled by a `<p>` is a landmark with no heading in it, so the document
outline stepped straight from the services list to Branding, and the one piece
of proof on the page was invisible to anyone navigating by headings.

## 2. What the current pattern actually is

Web search, since the reference sites remain unreachable (`docs/52` §4,
re-confirmed against `prismdigital.ae`). Four things recur across 2026 agency
and portfolio work:

| Pattern | What it means here |
| --- | --- |
| **Bento grid** | Case-study previews in unequal tiles, one leading, rather than a row of identical cards |
| **Reveal, don't recolour** | Hover exposes a second layer of information; it does not merely tint the card |
| **Exaggerated rounding** | Large radii on media tiles, edge to edge |
| **Micro-interaction** | A small, fast scale on the image — not the tile, and not the text |

The judgement worth recording: a bento only works if it **closes**. A grid with
a hole in it does not read as deliberate asymmetry, it reads as a layout that
went wrong. This cost two rebuilds (§4).

## 3. What it is now

Four tiles, the four real Al Mada deliverables the copy already names, using
the photography that previously appeared only on `/story`:

```
  +---------------+-------+-------+
  |               |    website    |
  |   identity    +-------+-------+
  |               | camp. | prof. |
  +---------------+-------+-------+
```

- A real `<h2 id="proof-title">` — "One partner delivered all four." — and
  `aria-labelledby` now points at a heading.
- The identity leads at 2×2 because it is what the other three are made of.
  That is the argument the section exists to make.
- Each tile carries an index, the deliverable's name, and a detail line.
- The detail line is **shown by default and hidden only where hovering is
  possible** — `@media (any-hover: hover)`. A touch visitor never hovers, so
  hiding it behind hover on a phone would hide it for good. `:focus-within` is
  on the same rule, so a keyboard visitor gets what a mouse visitor gets.
- Alt text is the existing, accurate bilingual text from `/story`, unchanged.

## 4. Five failures found in the building of it

Each of these was invisible to every existing check, which is why four of the
five now have a guard.

### 4.1 A padding declaration that never applied

```css
padding: var(--space-48) var(--space-20) var(--space-20);
```

**There is no `--space-20`.** The scale goes 16, 24, 32; twenty was a number I
wanted, not a token that exists. An undefined custom property with no fallback
invalidates the whole declaration **at computed-value time** — which is not a
parse error. The rule stays in the stylesheet, the declaration is still visible
in devtools, and the computed value silently becomes the initial one. The tile
shipped with `padding: 0px`: text flush to the crop on all four sides.

Nothing could see it. The CSS was valid. The braces balanced. axe found the
contrast acceptable. The dead-selector check saw a selector that matched.

The same slip had already shipped in **four other places**:

| File | Was | Effect |
| --- | --- | --- |
| `components/index.css` | `padding: var(--space-16) var(--space-20)` | index cards had no padding at all |
| `components/pricing.css` ×2 | `color: var(--color-text)` | fell back to inherit |
| `components/verification.css` | `color: var(--color-text)` | fell back to inherit |
| `components/contact.css` | `color: var(--color-text)` | the copy button's hover never brightened |

**Guard: `qa.js` §30.** Every `var()` in every stylesheet whose name nothing
defines and which has no fallback fails HIGH, naming the file, the line and the
declaration. Fallbacks are the deliberate escape hatch (`var(--text-lg,
1.125rem)`), and properties the markup or script sets (`--i`, `--span`,
`--reveal-delay`) are collected before judging, so what is left is only the
third case: a name spelled wrong or never written. Negative-tested — the bug
was put back and §30 named it at `proof.css:125`.

### 4.2 The tile's height came from a picture that had not loaded

The link was `block-size: 100%` and the **image** carried the `aspect-ratio`.
The images are `loading="lazy"` and the section is well below the fold, so
until one arrives there is nothing to size to. `validate` measured the bento at
**two pixels a row at 1440** and reported four targets under the 44px floor.

It looks fine in a screenshot, because by then the images have landed. The cost
is paid before that: a layout jump the height of the section, and a run of
sub-floor targets for anyone reaching it with a keyboard first.

The ratio now lives on the **link**, which knows its width without loading
anything, and at 64em the grid rows carry an absolute height
(`grid-auto-rows: clamp(15rem, 20vw, 22rem)`) for the same reason.

### 4.3 The override that lost on source order

Moving the ratio onto the link introduced its own bug within the hour. The
64em override —

```css
.c-bento__link { aspect-ratio: auto; block-size: 100%; }
```

— was written inside the media block that establishes the columns, which sits
**above** the base `.c-bento__link` rule. Same specificity, so source order
decides, and it lost. The link kept `4 / 3` while `block-size: 100%` gave it a
definite height, so the 584px lead tile computed an **800px width** and
overflowed its own column. The screenshot hid it: the overflow ran underneath
the neighbouring tiles.

Measuring the `<li>` said 584 and looked correct. Measuring the `<a>` said 800.
The lesson is the session's recurring one — a measurement that measures the
wrong box is not a measurement.

### 4.4 White ink on white paper

`qa`'s print check: *"printed text at 1:1 on paper — Identity"*. The caption is
white on a scrim, and printers drop background images, so the scrim vanishes
and the caption disappears. `07-print.css` now takes the caption **off** the
picture — `position: static`, no gradient, black ink, under its own image —
rather than forcing a page of solid black per tile. The same block also
retires `.c-proof__inner`, a print rule for an element that no longer exists.

### 4.5 The page went over its weight budget

Four full-size case-study images pushed `index.html` to **1064KB**, over the
1024KB budget. The four are 900–1400px wide because `/story` shows them large;
the bento's widest box is 584 CSS px.

No image tooling exists in this environment — no `cwebp`, no ImageMagick, no
`sharp`, and no egress to fetch one. Chromium, however, encodes WebP: the
tiles were re-encoded through a canvas in the browser that is already installed
for the test harness. Four `-tile.webp` derivatives at 1.5× their largest box:

| | Full | Tile |
| --- | --- | --- |
| identity | 1400×934, 64KB | 900×600, 33KB |
| website | 1200×674, 34KB | 900×506, 20KB |
| campaign | 900×1276, 85KB | 560×794, 42KB |
| profile | 1200×670, 46KB | 560×313, 13KB |

234KB → 107KB, and `index.html` lands at **942KB**. `/story` keeps the full
files. The `width`/`height` attributes were wrong as well — all four said
`900×675` while one of the images is portrait — and now carry true dimensions.

## 5. Two guards improved

- **`qa.js` §30** — undefined custom properties (§4.1).
- **`validate.js` §8** — the touch-target check said *"4 target(s) under
  44px"* and nothing else. It now names each one with its selector, its
  measured size and its first few words of text. A finding that does not say
  what it found costs a debugging session every time it fires.

## 6. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | 0 violations |
| Hover, 1440 | detail 0→20.3px, opacity 0→1, image `scale: 1.03` |
| Keyboard focus, 1440 | same reveal; focus ring present as `box-shadow` |
| Touch, 393 | `any-hover: hover` false, detail shown outright at opacity 1 |
| `prefers-reduced-motion` | image `scale: none`, detail still revealed |
| Arabic | `dir="rtl"`, grid mirrors, index stays LTR-isolated |
| Grid closes | 393 stacked · 820 a 2×2 · 1440 the 4-column bento, no empty cell |
| Page weight | 942KB, under the 1024KB budget |
