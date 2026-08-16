# Stage 04 — Branding & Design

The first detailed service section: an identity board followed by three
package tiers. Built from Stage 00 tokens; header, hero and services overview
are untouched.

| File | Role |
| --- | --- |
| `src/styles/components/service-detail.css` | Section shell, identity board, tier cards |
| `index.html` | Package content and the board artwork |
| `src/scripts/disclosure.js` | `initExpandable` — the breakpoint-aware disclosure |

`.c-detail` and `.c-tier` are written to be reused by the remaining service
stages; only the board is Branding-specific.

---

## 1. Content integrity

Package names, prices, billing models and **all 26 feature strings** are
verbatim from the Services & Pricing document, including its own inconsistent
capitalisation ("Color selection" beside "Typography System") — that is the
document's wording, not a typo to fix.

| Package | Price | Features |
| --- | --- | --- |
| Starter | 200 SAR one-time | 7 |
| Professional | 400 SAR one-time — **Most Requested** | 10 |
| Advanced | 650 SAR one-time | 9 |

A regression test holds an independent transcription of the document and
compares every string, index by index. Nothing was added, removed, reordered
or reworded.

The only copy not from the source is the section heading ("Build a brand people
recognize.") and the supporting line, both written from §07's stated direction.

---

## 2. Not a pricing table

The section opens with an **identity board** — four abstract panels showing
construction (a mark on its grid with guides), a type specimen, a palette, and
application fragments. These demonstrate the craft. None of it is presented as
client work, and no fictional logos appear.

The tiers then carry a **Foundation → System → Ecosystem** progression, drawn
as a tier mark of one, two, then three stacked planes. That is §18's "represent
the progression through visual density" expressed without touching the package
contents.

---

## 3. The recommended package

Professional is marked **four ways**, so the recommendation never rests on
colour alone (§24): a *Most Requested* text ribbon, an accent border, a raised
surface, and the only primary-filled CTA. Its price figure is the only one in
accent — pricing is not turned into three yellow blocks (§10).

It is not made larger than its neighbours.

---

## 4. Progressive disclosure, and why it needed script

Feature lists are 7/10/9 items. On desktop the whole comparison should be
visible; on mobile three full lists bury the prices under a screen of
scrolling. So below 1024px each card shows four features and a *Show all N
features* control, with price, package name, tier, description, ribbon and CTA
always visible (§13).

CSS alone cannot express this. Forcing the panel open with a media query would
leave the `inert` attribute in place — visible text, hidden from assistive tech
— and `inert` is only removable from script. `initExpandable` therefore
evaluates the breakpoint, and re-evaluates on change:

- Below 1024px: a real disclosure, panel `inert` when collapsed.
- At and above: panel open and not inert, and the trigger is `hidden`, so it is
  out of the tree entirely rather than merely invisible.

Verified across a live mobile→desktop resize: all seven features return and
nothing is left `inert`.

---

## 5. Three fixes found by rendering, not by assertion

- **The disclosed features were indented 40px.** The reset only clears list
  padding for `ul[role="list"]`, so the UA's default `padding-inline-start`
  applied and offset them from the four features above.
- **The card overflowed its container at 320px.** `.c-btn` sets
  `white-space: nowrap`, so the CTA's min-content width became the card's
  floor — 302px inside a 272px column. Card and CTA padding tighten below
  480px rather than letting the label wrap and lose its shape.
- **SVG `<text>` flew off its viewBox in RTL.** SVG text honours `direction`,
  so under RTL an x-positioned label treats its x as the run's *end*. The board
  artwork is decorative and its specimen is Latin, so it is pinned to LTR.

---

## 6. RTL

Cards reverse, check marks take the leading edge, the ribbon mirrors, and
prices stay LTR and isolated so "650 SAR" reads correctly inside Arabic.

Two bidi problems surfaced here and were fixed system-wide:

- **Leading numerals reordered**: "3 social media designs" rendered as
  "social media designs 3". A leading digit in an LTR run inside an RTL
  paragraph is direction-neutral and adopts the paragraph direction. Each
  label is now isolated as an LTR run, while the row itself stays RTL so the
  check keeps its leading position.
- **`data-i18n-pending` was left-aligning English inside right-aligned cards.**
  The rule now aligns untranslated blocks to the *trailing* edge, so they line
  up with the Arabic around them. Left alignment is more correct for English in
  isolation but reads as broken in a card. This also improved the hero.

---

## 7. Navigation

`#branding` is a **detail section, not a nav item**. Adding it — and eventually
five siblings — would take the header from five items to eleven, which Stage 01
§03 warns against. The Services row's *View packages* CTA now points here
instead of at `#pricing`.

Scroll spy keeps **Services** highlighted throughout the Branding section,
which is correct: it is part of the services story. Verified by scrolling
through home → services → branding → pricing → why-us.

The IA regression test was corrected accordingly: the contract is that each
nav order is a **subsequence** of the page's section order, not equal to it.
Equality was only ever true while the page had no detail sections.

---

## 8. Verified

Headless Chromium, LTR and RTL:

- Every package name, price, billing model and feature string matches an
  independent transcription of the source, index by index.
- One `h2` for the section, `h3` per package, features as real `<ul>`s, prices
  as real text, all decorative SVG hidden, every CTA `aria-describedby` its own
  package so "Start Your Project" is never ambiguous out of context.
- **No overflow at ten widths × two directions with every disclosure forced
  open.**
- All targets ≥ 44px on a coarse pointer.
- JavaScript disabled: all 26 features and all three prices render.
- Reduced motion: everything at full opacity, panel transition ~0.
- Hero, services, header, IA-synchronisation and styleguide suites all pass.

---

## Open items

- **Arabic copy** for headings, package purposes and feature strings. Remove
  `data-i18n-pending` per element as each lands.
- The remaining service stages reuse `.c-detail` and `.c-tier`; each supplies
  its own showcase in the board's slot.
