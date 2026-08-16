# Stage 03 — Services Overview

An interactive service index: six editorial rows on a connected rail, each
expanding in place to reveal its description, capabilities and a supporting
interface fragment. Built from Stage 00 tokens; the header and hero are
untouched.

| File | Role |
| --- | --- |
| `src/styles/components/services.css` | Section head, rail, rows, panels, fragments |
| `index.html` | Service content and the six interface fragments |
| `src/scripts/disclosure.js` | The Stage 00 accordion, reused unchanged in behaviour |

---

## 1. Content

Capability lists are **verbatim** from the Services & Pricing document as
supplied in the brief. 42 items across six categories:

| # | Service | Items |
| --- | --- | --- |
| 01 | Branding & Design | 6 |
| 02 | Websites | 6 |
| 03 | E-Commerce | 6 |
| 04 | Social Media Management | 9 |
| 05 | Digital Marketing & Advertising | 9 |
| 06 | Integrated Digital Solutions | 6 (a flow, not a list) |

**The one-line descriptions are mine**, written as summaries of the capability
lists directly beneath them. They add no capability, outcome or guarantee —
but they are the only text here not taken from the source, so they should be
reviewed. Replacing them touches one line each in `index.html`.

Nothing else was added. A regression test asserts the section contains **no
currency, no percentage and no guarantee language**.

Integrated Digital Solutions is rendered as an ordered flow rather than a
bulleted list, because that is what the source describes:
`Branding → Website / Store → Content → Social Media → Advertising → Growth`.

---

## 2. One disclosure pattern at every breakpoint

The rows are an accordion from 320px to 1920px. What changes per breakpoint is
the row scale and how the open panel lays out inside — not the interaction.

This was a deliberate choice over the common tabs-on-desktop /
accordion-on-mobile hybrid. That pattern means the **ARIA role of a control
changes with viewport width**, which is fragile to implement and worse to use
with assistive tech. A single disclosure set satisfies §10's requirement that
hover is never required and every service is reachable by touch, and it gives
keyboard users one predictable model everywhere.

Reused from Stage 00 unchanged in behaviour, so it inherits `aria-expanded`,
`aria-controls`, `role="region"` panels, single-open mode, `inert` on collapsed
panels, arrow-key roving and the grid-rows height animation.

**One fix to the shared component:** it selected the accordion item with
`closest('.c-accordion__item')` — a *style class*. The naming convention says
`data-*` attributes are what JavaScript binds to, precisely so restyling cannot
break behaviour. It now uses `closest('[data-accordion-item]')`. Reusing the
component in a second place is what exposed the violation.

---

## 3. Composition

| Breakpoint | Section head | Row | Open panel |
| --- | --- | --- | --- |
| Mobile <768px | Stacked | Compact, 22px name | Single column |
| Tablet 768–1023px | Stacked | Larger, indented to clear the rail | Single column, indented to the name |
| Desktop 1024px+ | Headline 7 cols / supporting text offset to 9 | Full editorial scale, up to 38px | Copy and capabilities lead, interface fragment trails |

The rail — one continuous thread with a node per service, fading from neutral
at the top to accent at the bottom — is the Hero's connector language
continued, so the two sections read as one system (§12). The Integrated
Solutions fragment is a mini constellation that deliberately echoes the Hero's
orbit.

Interface fragments are desktop-only, abstract, and imitate no real product's
interface: a letterform and swatch grid, browser chrome and wireframe blocks,
product tiles and a cart, a post card with engagement bars, a bar series with a
trend line, and the constellation.

---

## 4. Interaction states

| State | Treatment |
| --- | --- |
| Default | Primary text, hollow node, plus indicator |
| Hover | Accent name and index, filled node with a halo ring |
| Expanded | Accent name, filled node, **minus** indicator, panel open |
| Focus | The Stage 00 focus ring |
| Non-selected while another is open | Name steps back to secondary (9.0:1 — still fully readable) |

State never rests on colour alone: the open row also changes the indicator's
*shape* (plus → minus), fills its node, and shows its panel.

The de-emphasis rule is wrapped in `@supports selector(:has(*))`, so where
`:has()` is unsupported the rows simply stay at full strength — a graceful
loss of polish, not a broken state.

---

## 5. Pricing separation

No prices anywhere. Each service's panel ends with **View packages →** linking
to `#pricing`, which is §16's suggested "subtle indication" and is a real,
working link today. The full pricing architecture stays in its own stage.

---

## 6. Anchors and navigation

The header's `Services` link already points at `#services`; nothing in the
navigation changed. Each row carries its own id — `service-branding`,
`service-websites`, `service-ecommerce`, `service-social`, `service-marketing`,
`service-integrated` — so the detailed service stages can link straight to a
row without any structural change here.

I did **not** add per-service entries to the navigation map. `NavSection.children`
remains the documented extension point, and populating it before the dropdown
UI exists would create navigation that points at nothing.

---

## 7. RTL

The rail moves to the trailing edge, indicators to the leading edge, names
align correctly, the flow chevrons reverse, and the CTA chevron mirrors —
all from logical properties, with no mirrored stylesheet.

Two direction-specific details:

- Index numerals are forced LTR and isolated, because figures read
  left-to-right inside Arabic text.
- The flow chevron is drawn with `clip-path` and flipped with `scale: -1 1`
  under RTL, so the arrow points along the reading direction.

Untranslated copy carries `data-i18n-pending`, which typesets it as an LTR
island. Without it the descriptions' full stops jump to the start of the line,
since a full stop is direction-neutral and adopts the paragraph direction.

---

## 8. Verified

Headless Chromium, LTR and RTL:

- Six services, correct ids, capability counts 6/6/6/9/9/6 matching the source.
- No currency, percentage or guarantee language anywhere in the section.
- Accordion: `aria-expanded` tracks, every `aria-controls` resolves, panels are
  labelled regions, single-open holds, collapsed panels are `inert` so no link
  is an invisible tab stop, Arrow/Home/End and Enter all work, focus ring
  present.
- **No overflow at nine widths × two directions with every panel forced open** —
  the state where content is most likely to escape its container.
- All targets ≥ 44px on a coarse pointer.
- JavaScript disabled: all six services and all 42 capability items render,
  every panel open. Nothing is gated behind a script.
- Reduced motion: everything at full opacity, panel transition ~0.
- Header, hero, IA-synchronisation and styleguide suites all still pass.

---

## Open items

- **Review the six one-line descriptions** — the only copy here not from the
  source document.
- **Arabic copy** for the section: headline, descriptions and capability
  labels. Remove `data-i18n-pending` from each element as its translation
  lands.
- The detailed per-service stages link to the row anchors listed above.
