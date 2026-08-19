# Performance — measured, then improved

A full audit of the shipped artifact, the three real problems it found, and
what each fix was worth. Every figure is measured, twice: before and after.

| `dist/index.html` | Before | After |
| --- | --- | --- |
| Raw | 726.2KB | **442.2KB** (−39%) |
| Gzipped | 224.5KB | **145.6KB** (−35%) |
| CSS | 390.7KB | **222.1KB** |
| JavaScript | 37.9KB | **27.0KB** |
| Font faces embedded | 11 (131.7KB) | **6 (93.9KB)** |
| FCP @ 40ms RTT | 796ms | **504ms** (−37%) |
| FCP @ 150ms RTT | 912ms | **612ms** (−33%) |
| `load` @ 150ms RTT | 1,393ms | **917ms** (−34%) |

---

## What the audit found clean

Worth saying first, because two of these were the things I expected to be
wrong:

- **CLS is 0.0002** — and it stays there when measured *while scrolling*,
  which is the honest test for lazily-loaded images. The twelve renders carry
  no intrinsic size, but they do not shift the page: the device and module
  grids have bounded rows, so the box exists before the file arrives, and the
  brand panels have a `min-block-size` floor. The only shift on the page is the
  header navigation hydrating, at 0.0002.
- **No long task worth the name.** `initHeader` is 8% of samples during a
  scroll, which is a rAF-throttled passive scroll handler doing class toggles —
  that is the work, not a defect.
- **DOM: 2,508 nodes** for an eleven-section bilingual page. Both languages
  ship in the markup, which roughly doubles the text nodes and is the price of
  working without JavaScript; it has not made the tree unreasonable.

## 1. Five font faces the page can never render

The biggest single win, and the least obvious.

`unicode-range` is what makes a subsetted font cheap: the browser downloads a
subset **only when a character in its range appears**. Inlining defeats that
entirely — every face becomes bytes in the document whether or not one glyph of
it is ever drawn.

This site ships eleven faces. Five of them — four Poppins latin-ext and one
Cairo latin-ext — cover accented European characters that appear **nowhere in
the copy, in either language**. Checked against every text node in the document
*and* the strings the scripts inject: zero matches. They were 37.8KB of woff2,
about 50KB after base64 inflates it by a third, downloaded by every visitor to
render nothing.

`build.js` now tests each face's `unicode-range` against the document's own
character set and drops the ones with no coverage. **It is self-correcting**:
write a word with an accent and the face comes back on the next build. The
build reports what it dropped rather than doing it silently.

## 2. 103KB of comments shipped to every visitor

This project's comments are its documentation and they earn their place in the
source. They have no business in the artifact a reader downloads: **88.8KB of
CSS comment and 14.4KB of JS comment** were going out with every page.

`build.js` now minifies both. Deliberately conservative:

- **CSS comment-stripping happens after `data:` URIs are lifted out.** base64
  uses `/` and `+`, so a font blob can contain a literal `/*` — strip comments
  naively and it opens one that eats the rest of the stylesheet. This is the
  kind of bug that produces a blank page and no error.
- **JS strips block comments only.** `//` appears inside `https://` and inside
  regex literals; a minifier that handles those has to parse JavaScript
  properly, which is a bigger dependency than this build will take.

**Proving it safe.** Comment-stripping and whitespace-collapsing are textual
operations on a language where whitespace is sometimes significant — selector
combinators, `calc()`, media queries. `scratchpad/minsafe.js` compares 37
computed properties on **all 2,488 elements**, in both languages, between the
source and the minified build. All 2,488 compute identically.

Getting that test right took two attempts. The first reported 23 differences,
all of them animation-clock noise: `opacity: 0.998485` against `0.998486` on a
scroll-reveal sampled microseconds apart, and `letter-spacing: 0.559893px`
against `0.559892px` from an `em` value. It now runs with motion disabled and
rounds floats — because a difference in the sixth significant figure is a
difference in when you looked, not in the stylesheet.

## 3. The `@import` waterfall, unresolved by design

The modular source loads **29 stylesheets**. At 150ms RTT that costs it 1,352ms
to first paint against the built file's 612ms.

This is not a bug and it is not fixed: `@import` is what keeps the source
readable and the `@layer` order explicit, and `dist/index.html` exists precisely
so nobody has to serve it. It is recorded here so the number is known — **serve
the built file, not `src/`**, and the gap disappears.

## What is still open

- **Twelve images carry no intrinsic size.** They cost nothing today, for the
  reasons above, but the guarantee comes from the layout rather than from the
  images. `width`/`height` attributes would make it unconditional — and they
  need the real files, which are hotlinked to a host this environment cannot
  reach.
- **Base64 inflates the fonts by a third.** 93.9KB of woff2 becomes ~125KB in
  the document, and gzip cannot recover it because woff2 is already compressed.
  Serving the fonts as files would be smaller and cacheable, at the cost of the
  single-file property. The trade is the same one the README already records.
- **The Cairo Latin face is 33KB.** Arabic copy on this site contains English
  terms by design, so it renders real characters and was not dropped. Removing
  it would let those runs fall through to Poppins — the brand's Latin face —
  which is arguably better typography as well as 33KB lighter. A design call,
  not a build one.
