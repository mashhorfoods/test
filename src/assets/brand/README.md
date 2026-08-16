# Brand assets

`logo.svg` is the **single source of truth** for the logo. Everything that
shows it points at this one file:

| Surface | Reference |
| --- | --- |
| Site header | `index.html` → `<img class="c-header__mark" src="./src/assets/brand/logo.svg">` |
| Browser tab | `index.html` and `styleguide.html` → `<link rel="icon">` |
| Any future page | Copy the same two lines — no new copy of the artwork |

The logo is **referenced, never inlined**. Inlining the SVG into each page
would create a copy per page that has to be kept in sync by hand; a single
referenced file cannot drift.

---

## Swapping in the real logo

1. Replace `logo.svg` with the real artwork. **Keep the filename.**
2. Check the requirements below.
3. If the artwork is not square, set `--logo-aspect` on `.c-header__mark` in
   `src/styles/components/header.css` to its ratio, e.g. `--logo-aspect: 3.2`
   for a 320×100 lockup. This reserves the right width before the file loads,
   so the header does not shift as it arrives.
4. If the artwork already contains the wordmark, delete the
   `.c-header__wordmark` span in `index.html`. Nothing else changes.

Nothing else in the codebase needs editing.

### Requirements for the file

- **SVG with a `viewBox`.** The viewBox is what lets it scale to any size
  without distorting. Height drives the header lockup and width follows the
  artwork's own ratio, so it can never be stretched.
- **No fixed `width`/`height`** on the root `<svg>` element.
- **Keep the artwork's own fill colours.** Only use `currentColor` if the logo
  is genuinely monochrome and meant to follow the surrounding text colour.
- Must read clearly on the `#202020` charcoal background at **26px tall**, the
  compact-header size. Test that first — a mark with fine detail or a light
  outline can disappear at that size.

### If you only have a raster (PNG/JPG)

A PNG works, but it will look soft on high-density screens and cannot serve as
a crisp favicon. If SVG is not available:

- Supply at least **3× the display size** (≥ 96px tall for the header).
- Use PNG with transparency, never JPG — a JPG's white box will show against
  the charcoal.
- Update the `src` and the `rel="icon"` `type` attribute to match the format.

Vector is strongly preferred.

---

## Still outstanding

These need raster exports of the **final** logo and are referenced as TODOs in
`index.html`:

| File | Size | Purpose |
| --- | --- | --- |
| `apple-touch-icon.png` | 180×180 | iOS home-screen icon |
| `og-image.png` | 1200×630 | Link preview card for social and messaging |

The OG image is not just the logo on a background — it is a designed card, so
it belongs with the final brand assets rather than being generated from the
mark.

---

## Current state

`logo.svg` is a **placeholder**: a square outline with an accent slash, plus an
`AGENCY` wordmark rendered as text beside it. It is deliberately generic — it
identifies the slot without inventing a brand identity — and must be replaced
before launch.
