# Stage 02 — Hero

The homepage's opening statement and the digital-ecosystem constellation.
Rebuilt to the supplied visual reference. Built from Stage 00 tokens; the
header from Stage 01 is untouched apart from the brand lockup.

| File | Role |
| --- | --- |
| `src/styles/components/hero.css` | Hero layout, copy block, actions, scroll cue |
| `src/styles/components/orbit.css` | The constellation: rings, nodes, core, fragments |
| `index.html` | Hero markup, service icons, interface fragments |
| `src/styles/components/header.css` | `.c-brand` — the PIXORA type lockup |

---

## 1. Where the reference was followed, and where it was not

The reference is the visual blueprint; the existing site is the content source
of truth. Two places where those two disagreed, resolved in favour of content:

**Fabricated statistics — omitted.** The reference's interface fragments read
`+120%` and `+85%`. No verified performance data exists, and inventing figures
is forbidden. The fragments are built — same position, scale, hierarchy and
visual role — carrying a label and an abstract chart, with the slot for a real
number marked in the markup:

```html
<span class="c-orbit__card-label">Performance</span>
<!-- verified figure goes here -->
```

Drop a supplied, verified value in and the card is complete. A regression test
asserts no `+NN%` string exists anywhere in the hero.

**Eyebrow wording — kept.** The reference reads `DIGITAL AGENCY`; the site
reads **"Creative Digital Partner"**. Existing copy wins, so the wording is
unchanged and only the reference's *treatment* was adopted (accent colour, rule
trailing the label rather than leading it).

Everything else — composition, proportions, node placement, ring structure,
button treatment, scroll cue, per-breakpoint recomposition — follows the
reference.

---

## 2. Brand

The reference supplies the identity: **PIXORA**, accent on the `X`, with a
letterspaced `DIGITAL AGENCY` tagline beneath.

It is built as a **type lockup** (`.c-brand`), not an image: a wordmark set in
Poppins stays crisp at any pixel density, costs no request, and can be
restyled per breakpoint — the tagline drops in the compact header and below
360px, where the wordmark alone still identifies the brand.

The favicon is the exception and the one place a file is needed: at 16px a
wordmark is unreadable and the browser cannot use the page's fonts, so
`src/assets/brand/logo.svg` carries the accent letterform drawn as paths. It is
a derivation of the wordmark, not a second identity.

---

## 3. The constellation

Five services orbiting a Growth core, joined by concentric rings and radial
spokes — the reference's central device.

Geometry is authored in one SVG coordinate space (`viewBox 0 0 100 100`,
core at `52,48`). Every node sits on the `r=38` ring, which is why the ring
passes cleanly through all five:

| Node | Position | Distance from core |
| --- | --- | --- |
| Branding & Design | 52, 9 | 39 |
| Websites | 86, 33 | 37.2 |
| E-Commerce | 80, 71 | 36.2 |
| Social Media | 46, 86 | 38.5 |
| Digital Marketing & Ads | 15, 52 | 37.2 |

Icons are inline SVG. The interface fragments are abstract — they imitate no
real product's UI and state no result.

### Centring on a point, direction-safely

Each node is placed with `inset-inline-start`, so the whole constellation
mirrors under RTL for free. Centring it on that point is the subtle part:

```css
inline-size: 28cqw;
margin-inline-start: -14cqw;   /* exactly half, and it flips with the writing mode */
```

The first attempt used a zero-width anchor with `place-items: center`. It
looked right but was not: nodes ended up leading-aligned on their point, up to
7% off, pulling every node off its spoke. A known-width box pulled back by half
its own width is deterministic in both directions. A test asserts each node
centre matches its authored coordinate in LTR, is its exact mirror in RTL, and
falls within its spoke's extent.

The rings SVG is mirrored with `scaleX(-1)` under RTL so the spokes track the
mirrored nodes. It contains no text, so there is nothing to un-mirror.

---

## 4. Three compositions

| Breakpoint | Page | Ecosystem |
| --- | --- | --- |
| Mobile <768px | Single column; visual below the CTAs | **Vertical connected list** — cards on a thread, Growth as a circle at the end |
| Tablet 768–1023px | Single column; full-width stacked CTAs | Radial, centred and reduced |
| Desktop 1024px+ | **5 / 7 asymmetric**, wide container | Radial at full size, with the two interface fragments |

The headline breaks match the reference at each size: four lines on desktop and
mobile, three on tablet where the full page width lets "Your Digital Presence."
set solid. One `<br>` is hidden at the tablet range; the space before it
collapses at a line break and reappears when the break is removed, so the words
never run together.

---

## 5. Layout details worth knowing

**Scroll cue is a grid item, not an overlay.** It occupies its own row beneath
the copy, with the constellation spanning both rows. Absolute positioning put
it on top of the secondary CTA at common viewport heights; a real row makes
that collision structurally impossible. It is hidden below 768px (the reference
has none there) and on desktop windows under 800px tall.

**Actions are default size, not `--lg`.** At `--lg` the pair needed 578px and
wrapped to two rows inside a five-column text block. They are full-width and
stacked below desktop, matching the reference, with the icon at the trailing
edge.

**The hero uses `l-container--wide`.** The reference's composition runs closer
to the viewport edge than the standard 1320px container allows. `--container-max-wide`
is an existing Stage 00 token, so this is the system being used, not extended.

**Headline sizes against its column**, `max(3rem, min(var(--text-hero), 15cqw))`,
so it fits its container at any width in any language. The coefficient is set
by the longest authored line, measured in-browser.

---

## 6. Motion

Load sequence uses the Stage 00 reveal system — eyebrow → headline → lead →
CTAs stagger at 80ms, constellation follows at 260ms.

Two sustained animations, both justified and both stopped by
`prefers-reduced-motion`:

- **Two travelling sparks** on the orbits. This is what makes the system read
  as connected rather than drawn.
- **The scroll-cue wheel.** It exists solely to signal more content, and
  removes itself once the user scrolls.

---

## 7. Verified

Headless Chromium, LTR and RTL:

- No page overflow **and no clipped hero element** at 320/360/375/414/600/768/
  900/1023/1024/1280/1440/1920px × both directions.
- Node centres match authored coordinates in LTR, are exact mirrors in RTL, and
  every node sits on its spoke.
- Single `h1`, heading order unbroken, all decorative SVG hidden from assistive
  tech, services exposed as a real `<ul>`.
- No `+NN%` string anywhere in the hero.
- All hero targets ≥ 44px on a coarse pointer.
- Reduced motion: sparks and cue animation off, all content at full opacity.
- JavaScript disabled: headline, CTAs, all five service names and the brand
  render.
- Header, mobile menu, IA synchronisation and styleguide suites all still pass.

---

## Open items

- **Arabic hero copy.** Untranslated blocks carry `data-i18n-pending`, which
  typesets them as LTR islands — without it, English punctuation reorders in an
  RTL page ("&nbsp;Design &" instead of "& Design"). Remove the attribute from
  each element as its Arabic copy lands.
- **Verified figures** for the two interface fragments, if the business has
  them. The slots are marked.
- **Confirm the service list** against the Services & Pricing document — the
  five names come from the brief and the reference, and that document is still
  outstanding.
- `apple-touch-icon.png` (180×180) and `og-image.png` (1200×630).
