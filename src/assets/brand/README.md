# Brand assets

The identity is **PIXORA**, accent on the `X`, with a `DIGITAL AGENCY` tagline.

## Where the logo lives

| Surface | Implementation |
| --- | --- |
| Site header | A **type lockup** — `.c-brand` in `index.html`, styled in `src/styles/components/header.css` |
| Browser tab | `logo.svg` — the accent letterform, referenced by `<link rel="icon">` in `index.html` and `styleguide.html` |

The header wordmark is set in Poppins rather than shipped as an image: it stays
crisp at any pixel density, costs no request, and can be restyled per
breakpoint — the tagline drops in the compact header and below 360px, where the
wordmark alone still identifies the brand.

The favicon is the one place a file is needed. At 16px a wordmark is
unreadable, and the browser cannot use the page's fonts, so `logo.svg` carries
the mark alone, drawn as paths so it renders identically everywhere. It is a
derivation of the wordmark, not a second identity.

## Swapping in a designed asset

If a designed logo file exists, it replaces one or both:

- **A brand mark** → replace `logo.svg`. Keep the filename and a square
  `viewBox`; both referencing surfaces follow automatically.
- **A full lockup** (mark plus wordmark as one artwork) → replace the
  `.c-brand` span in `index.html` with an `<img>`, and set `--logo-aspect` on
  it to the artwork's ratio so the header reserves the right width before the
  file loads. Note that a single lockup image must **not** mirror under RTL,
  unlike the two-part type lockup.

### File requirements

- **SVG with a `viewBox`**, no fixed `width`/`height` on the root element.
- Keep the artwork's own fill colours; only use `currentColor` if it is
  genuinely monochrome.
- Must read clearly on `#202020` at **26px tall**, the compact-header size.
- If only a raster exists: PNG with transparency (never JPG — its white box
  will show against the charcoal), at least 3x the display size. Vector is
  strongly preferred.

## The two generated files

Neither is drawn by hand, and neither should be. Both are rendered from source
that already exists, so replacing the artwork updates them by re-running one
command rather than by finding an export.

| File | Size | Made by | From |
| --- | --- | --- | --- |
| `apple-touch-icon.png` | 180x180 | `npm run icon` | `logo.svg` |
| `../share-card.jpg` | 1200x630 | `npm run card` | `src/showpiece/card.html` |

**Why the touch icon exists at all.** `<link rel="icon">` ships `logo.svg` and
every browser tab is served by it. Safari is the exception — it has never read
SVG for `apple-touch-icon` — so without a PNG an iPhone that adds this site to
its home screen renders a screenshot of the page instead of the mark. The build
copies it to `dist/assets/` as a real file rather than inlining it, because
Safari ignores a `data:` URI there and does so silently; `tools/qa.js` asserts
all three failure modes (the link missing on a page, the link inlined, the file
not shipped).

**Why the share card is not "the mark on a background".** It carries the
proposition and the price promise, both of which change. It is markup using the
same tokens and typeface as the site, so the card and the page cannot disagree
for long. See the comment at the top of `tools/build-share-card.js`.

If a designed logo replaces `logo.svg`, run `npm run icon` and commit the PNG
alongside it.
