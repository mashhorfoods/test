# Stage 05 — Websites

> **The three device frames are renders now, not drawings.** Each card holds a
> supplied image; the captions (Desktop 1440px / Tablet 768px / Mobile 375px)
> stay, because unlike the brand panels' labels they say *which viewport you
> are looking at* — which is the whole point of the composition.
>
> **`object-fit: cover` from the top — the opposite of the brand panels' rule,
> deliberately.** The brand panels take their height from the image, because a
> board is a finished composition and cropping loses work. These cards cannot:
> the desktop card **spans two grid rows** by design, so it is as tall as the
> tablet and mobile cards stacked beside it. Sizing it to its own image left a
> **622px void** underneath at 1440px. Filling instead, and taking the crop
> from the bottom, is also just right for the content: a website render is a
> scrolling page, and showing the masthead while the fold runs off is how a
> device preview reads.
>
> **The rows are bounded** (`repeat(2, minmax(0, 15rem))` from 48em, plus a
> `30rem` ceiling on the image for the single-column layout). Without that, one
> full-length phone render — several times taller than a desktop one at the
> same width — decided how tall the whole section was: the grid measured
> 1,133px with a tall stand-in and 504px once bounded. It is now 504px at every
> desktop width regardless of what the files measure.
>
> A `min-block-size` floor on the card stops a failed load collapsing it to its
> caption. Measured at nine widths in both directions; images fill their cards
> with only the card's own padding left over.
>
> **One render per device.** Desktop briefly shared the tablet's file
> (`t01.png`); `01.png` replaced it, so the three cards are now `01` / `t01` /
> `m01` — desktop, tablet, mobile. The suite asserts all three are distinct, so
> a device silently borrowing another's file cannot come back.
>
> Hotlinked from `i.ibb.co`, which the build environment cannot reach: the
> images could not be inlined or looked at. `node build.js` reports it.

> **Note.** The signed-off split described here now covers Websites only —
> E-Commerce was removed as a service. See `docs/19-remove-ecommerce.md`.

The second detailed service section: a responsive device composition, the
ten-step delivery pipeline, and three packages. Reuses `.c-detail` and
`.c-tier` from Stage 04 unchanged.

---

## 1. A content gap, and the draft that now fills it

The brief supplies **prices and positioning statements but not per-package
inclusions**. §14 says to use the exact approved inclusions; §32 forbids
inventing them. Both cannot be satisfied.

The section originally resolved this by showing no feature list at all (a
`--brief` tier variant) and presenting the ten capabilities as what the
*service* covers. The client subsequently asked for every card to carry its own
inclusions, in the same form as Branding, and chose the "draft a split for
review" option over supplying the real data first.

So the cards now show a split, under these limits:

- **Every line is one of the ten approved capabilities**, spelled exactly as the
  document spells it, in the document's own order. No new capability, wording or
  quantity was introduced.
- **Which tier each capability lands in is an inference, not source data.** That
  is the whole of what was added, and it is the whole of what needs approving.
- Each card carries `data-draft-features`, so every inferred split on the page
  can be found — and replaced — in one pass when the real inclusions arrive.

| Package | Price | Inclusions in the draft |
| --- | --- | --- |
| Landing Page | 175 SAR | Domain registration · Hosting · Website UI/UX design · Responsive implementation · Delivery ready for use (5) |
| Business Website | 450 SAR | the five above · Website development · Website setup · Testing (8) |
| Professional Website | 700 SAR | all ten |

Lists are **spelled out rather than abbreviated to "Everything in …"**. Branding
uses the carry-forward line because its source document writes it; here nothing
is quoted, and a cumulative shorthand would have made each card *shorter* than
the one below it — the list would shrink as the price rose. Spelled out, length
tracks price: 5 → 8 → 10.

Two lines in the split are worth a second look before it is approved:

- **Landing Page has "Delivery ready for use" but not "Testing".** Reasonable if
  the tier is a light hand-off; wrong if every delivery is tested.
- **Landing Page has no "Website development".** Only correct if landing pages
  are built from a template rather than developed.

A test asserts every feature string is an approved capability, that no card
repeats a line, that each card follows the source's capability order, that the
lists are strictly cumulative and strictly growing, and that the disclosure
toggle's count matches the list it reveals.

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
- Every card's feature list draws only on those ten, in source order, with no
  duplicates; the lists are cumulative (5 ⊂ 8 ⊂ 10).
- No arbitrary recommended package, no guarantee, percentage or "best value"
  language anywhere in the section.
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
