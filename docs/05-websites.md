# Stage 05 — Websites

The second detailed service section: a responsive device composition, the
ten-step delivery pipeline, and three packages. Reuses `.c-detail` and
`.c-tier` from Stage 04 unchanged.

---

## 1. A content gap, stated plainly

The brief supplies **prices and positioning statements but not per-package
inclusions**. §14 says to use the exact approved inclusions; §32 forbids
inventing them. Both cannot be satisfied, so:

- The three cards carry package name, positioning statement, price, billing
  model and CTA — **no feature list**.
- The ten capabilities are presented as what the **service** covers, not as any
  one package's contents. Claiming all ten apply to a 175 SAR Landing Page
  would be an assumption, not a fact from the document.

The tier component already renders features (see Branding); a `--brief`
variant omits the block. **The feature lists return the moment the data does** —
it is one array per package in the markup, nothing structural.

A test asserts no card in this section shows a feature list.

### Verbatim data

| Package | Price |
| --- | --- |
| Landing Page | 175 SAR one-time |
| Business Website | 450 SAR one-time |
| Professional Website | 700 SAR one-time |

Plus the ten capabilities: Domain registration · Hosting · Website UI/UX design
· Website development · Responsive implementation · Website setup · Required
integrations · Testing · Deployment · Delivery ready for use.

**No recommended package.** §15 permits marking one only "if the approved
content identifies one" — this service's data does not, so none is marked. The
section's single primary CTA sits in the foot instead.

---

## 2. Currency is now localised

The Branding brief wrote prices as `200 SAR`; this one writes `175 ر.س`. Those
are the same currency in two notations, and shipping one section in each would
read as an inconsistency.

The **figure is business data and stays in the markup**; the currency symbol
and billing label are chrome and moved into the translation table:

| | Currency | Billing |
| --- | --- | --- |
| EN | `SAR` | One-time |
| AR | `ر.س` | لمرة واحدة |

A test prints every price in both languages and confirms the figures are
byte-identical: 200/400/650/175/450/700 either way. Stage 04's cards were
updated to use the same mechanism.

---

## 3. The device composition

Three frames showing **one layout reflowing**, not three screenshots (§10).
Each carries the same nav bar, accent hero block, body text, outlined CTA and
content row — only the column count changes: three across on desktop, two on
tablet, stacked on mobile. Each is a `<figure>` with a real `<figcaption>`
naming the device and its width.

Abstract throughout. Nothing is presented as a real client project, and no
logos, screenshots or metrics appear.

---

## 4. The delivery pipeline

The ten capabilities as an ordered `<ol>`, each with an accent index. The
**numbering is the progression cue** rather than a row of chevrons: ten wrapping
items with nine chevrons between them reads as clutter, and the numerals stay
legible in both directions while the grid order mirrors naturally.

---

## 5. One RTL bug worth recording

The price group was pinned to `direction: ltr` in Stage 04 to stop "650 SAR"
becoming "SAR 650". That was wrong for Arabic.

Arabic writes the figure first too — and read right-to-left, "first" means
*rightmost*, with `ر.س` to its left. Forcing the group to LTR reversed that and
produced `ر.س 175`. Western digits are strong LTR characters, so `175` renders
correctly without being pinned; the group now keeps the document's direction
and is merely `unicode-bidi: isolate`d from surrounding text.

Verified: in EN the figure sits left of the currency, in AR right of it.

---

## 6. Verified

Headless Chromium, LTR and RTL:

- All three prices and all ten capabilities match the source exactly.
- No invented feature lists, no arbitrary recommended package, no guarantee,
  percentage or "best value" language anywhere in the section.
- Exactly one primary CTA in the section.
- One `h2`, `h3` for the pipeline heading and each package, pipeline as a real
  `<ol>`, devices as `<figure>`/`<figcaption>`, all decorative SVG hidden,
  every card CTA `aria-describedby` its own package. No heading level skips
  anywhere on the page.
- **No overflow at 320/375/430/768/1024/1280/1440/1920 × two directions** —
  the widths §34 names.
- All targets ≥ 44px on a coarse pointer.
- JavaScript disabled: all three prices, all ten capabilities and all three
  device frames render.
- Reduced motion: everything at full opacity.
- Branding, services, hero, header, IA and styleguide suites all still pass.

---

## Open items

- **Per-package inclusions for the three website packages** — the one piece of
  this section's data that was not supplied.
- Arabic copy for headings, positioning statements and capability labels.
- Stage 06 (E-Commerce) reuses `.c-detail` and `.c-tier`; the Services row for
  E-Commerce still points at `#pricing` until it lands.
