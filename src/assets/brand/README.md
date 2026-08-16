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

## Still outstanding

Both need the final artwork and are marked as TODOs in `index.html`:

| File | Size | Purpose |
| --- | --- | --- |
| `apple-touch-icon.png` | 180x180 | iOS home-screen icon |
| `og-image.png` | 1200x630 | Link preview card |

The OG image is a designed card rather than the mark on a background, so it
belongs with the final brand assets.
