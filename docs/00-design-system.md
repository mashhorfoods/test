# Stage 00 — Master Global Design System

This document plus `src/styles/` is the contract every later stage builds on.
Nothing here designs a page section. Stage 01 onward extends this system; it
does not replace or work around it.

**Source of truth for content:** the supplied Services & Pricing document.
Nothing in this repository invents, removes, reorders or reinterprets a
service, package, price, statistic, client, testimonial or achievement. The
placeholders in `styleguide.html` are structural only (`Package name`, `0,000`,
`Included item`) and must all be replaced from that document in Stage 01.

---

## 1. Colour tokens

Defined in `src/styles/02-tokens.css`.

Raw palette values are private (`--_charcoal-700`). Product code consumes
**semantic** tokens only, so a palette change never requires a find-and-replace
across sections.

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#202020` | Dominant foundation |
| `--color-bg-deep` | `#141414` | Full-bleed contrast bands |
| `--color-bg-sunken` | `#1a1a1a` | Recessed wells, disabled fields |
| `--color-surface` | `#262626` | Card and control surface |
| `--color-surface-hover` | `#2e2e2e` | Surface hover |
| `--color-surface-active` | `#383838` | Surface pressed |
| `--color-text-primary` | `#FFFFFF` | Headings, key figures |
| `--color-text-secondary` | `rgba(255,255,255,.72)` | Body copy |
| `--color-text-muted` | `rgba(255,255,255,.48)` | Metadata, labels |
| `--color-text-on-accent` | `#202020` | Text on yellow |
| `--color-accent` | `#F4D13F` | Primary accent |
| `--color-accent-hover` | `#F6D85C` | Accent hover |
| `--color-accent-active` | `#D9B62F` | Accent pressed |
| `--color-accent-subtle` | `rgba(244,209,63,.14)` | Accent wash |
| `--color-border` | `rgba(255,255,255,.10)` | Default hairline |
| `--color-border-strong` | `rgba(255,255,255,.20)` | Defined edge |
| `--color-border-accent` | `#F4D13F` | Selected / featured edge |
| `--color-focus` | `#F4D13F` | Focus ring |

Two status hues exist (`--color-success`, `--color-danger`) purely for form
validation and system feedback. They are desaturated to sit inside the
charcoal / white / yellow system. **No other colour may be introduced.**

### Yellow discipline

Yellow is an accent and an interaction language, never a background
replacement. Permitted: primary CTA fill, focus ring, active nav indicator,
hover accents, price figures, large statistics, selected states, featured card
border, section rules, list check marks. Not permitted: section backgrounds,
large fills, body text, decorative flooding.

---

## 2. Typography

**Families.** Latin display and UI: `Space Grotesk` (geometric, characterful)
and `Inter` (neutral, highly legible at small sizes). Arabic: `IBM Plex Sans
Arabic`, chosen because its geometric construction and weight range match the
Latin pair — it is a first-class partner, not a fallback.

**Scale.** Every step is fluid via `clamp()` between roughly 360px and 1440px,
so type never jumps at a breakpoint.

| Token | Range | Role |
| --- | --- | --- |
| `--text-display-xl` | 44 → 104px | Hero display |
| `--text-display-l` | 36 → 80px | Major statements |
| `--text-h1` | 32 → 62px | Page / section headline |
| `--text-h2` | 26 → 46px | Section heading |
| `--text-h3` | 21 → 33px | Card / item title |
| `--text-h4` | 18 → 23px | Sub-title, accordion trigger |
| `--text-body-lg` | 17 → 20px | Lead paragraph |
| `--text-body` | 16px | Body |
| `--text-body-sm` | 15px | Dense body, card copy |
| `--text-small` | 14px | Supporting |
| `--text-label` | 12px | Eyebrow / label (uppercase, tracked) |
| `--text-meta` | 13px | Metadata |
| `--text-price` | 36 → 64px | Package price |
| `--text-price-sm` | 28 → 42px | Price in a card row |
| `--text-stat` | 40 → 76px | Large numerals |

**Semantic level vs visual role are decoupled.** Choose `h1`–`h6` for the
document outline (SEO, screen-reader navigation); choose a `.t-*` class for
appearance. Heading order is never broken to achieve a size.

Prices and statistics use `font-variant-numeric: tabular-nums`, which keeps
columns aligned and stops animated counters from reflowing.

Long-form copy is capped with `.t-measure` (62ch) or `.t-measure-tight` (46ch).

---

## 3. Spacing

Tokens are named by pixel value: `--space-4` … `--space-160`, matching the
scale `4 8 12 16 24 32 48 64 80 96 120 160`. Arbitrary margins are a
governance violation.

### Section spacing rules

| Token | Range | Use |
| --- | --- | --- |
| `--section-space` | 64 → 136px | Default `.l-section` padding-block |
| `--section-space-tight` | 48 → 88px | Dense or paired sections |
| `--section-space-loose` | 88 → 160px | Statement sections |
| `--stack-heading-body` | 16 → 28px | Heading → body gap |
| `--stack-body-cta` | 24 → 44px | Body → CTA gap |

Sections **never** set their own margins. They use `.l-section` (plus
`--tight` / `--loose` / `--flush-top` / `--flush-bottom`) so vertical rhythm is
consistent site-wide. Adjacent sections of the same colour are separated by
`.l-section--divided` (a hairline); a change of ground uses
`.l-section--deep` or `--raised`.

---

## 4. Grid

| Breakpoint | Columns | Gutter | Container padding |
| --- | --- | --- | --- |
| Mobile | 4 | 16px | 24px |
| Tablet ≥768px | 8 | 24px | 32px |
| Desktop ≥1024px | 12 | 32px | 48px |
| Large ≥1440px | 12 | 32px | 64px |

Max content width `--container-max: 1320px` (`--container-max-narrow: 820px`
for reading columns, `--container-max-wide: 1560px` for full compositions).

The grid is **re-authored** per breakpoint, not shrunk. Children declare spans
with custom properties instead of 36 generated classes:

```html
<div class="l-col" style="--span:4; --span-md:8; --span-lg:6">…</div>
```

`--span` applies from 320px, `--span-md` from 768px, `--span-lg` from 1024px;
each falls back to the next smallest. `.l-col` sets `min-inline-size: 0` so a
long word or wide table can never push the grid wider than its container.

Other primitives: `.l-autogrid` (auto-fit card collections), `.l-stack`,
`.l-cluster`, `.l-split` (asymmetric two-part composition), `.l-sticky`,
`.l-media`.

---

## 5. Breakpoints

| Name | Range | Media query |
| --- | --- | --- |
| Mobile | 320–767px | (base — mobile-first) |
| Tablet | 768–1023px | `@media (min-width: 48em)` |
| Desktop | 1024–1439px | `@media (min-width: 64em)` |
| Large desktop | 1440px+ | `@media (min-width: 90em)` |

`em` units are used so the layout respects a user's browser font-size setting.
These five values are the only breakpoints in the system.

---

## 6. Buttons and CTA hierarchy

`.c-btn` with variants `--primary`, `--secondary`, `--ghost`, `--icon`; sizes
`--sm`, default, `--lg`; plus `--block` (full width — the default primary
treatment on mobile).

| Level | Variant | Rule |
| --- | --- | --- |
| Primary | `.c-btn--primary` (yellow fill) | Exactly **one** per visual area |
| Secondary | `.c-btn--secondary` (outlined) | Supports the primary |
| Tertiary | `.c-btn--ghost` / `.c-link` | Inline and low-emphasis actions |

Two primary CTAs must never compete within the same viewport region. Where a
section needs a second action it is secondary or a text link.

Every variant defines hover, active, focus-visible and disabled. Disabled state
recolours (surface + `--color-text-disabled`) rather than relying on opacity
alone, and sets `pointer-events: none` with `aria-disabled` support.

---

## 7. Cards

One base (`.c-card`) and four roles:

- `.c-card--service` — index numeral, title, description; an accent rule that
  extends on hover. Pair with `.c-card--interactive` and `.c-card__link` for a
  fully clickable surface (the `::after` overlay keeps text selectable, and
  focus draws the ring on the card via `:has()`).
- `.c-card--pricing` — name → audience → price block → feature list → footer
  CTA. `.c-card--featured` marks the recommended package with a raised surface,
  accent border and `.c-card__ribbon`.
- `.c-card--feature` — borderless, top-rule only, for capability grids.
- `.c-card--content` — media + copy, with a restrained image scale on hover.

`.c-card__footer` uses `margin-block-start: auto` so CTAs align across a row of
cards of differing heights.

---

## 8. Borders

`--border-width: 1px`, `--border-width-strong: 2px`.

Composites: `--border-hairline` (10% white, the default), `--border-defined`
(20% white, for a deliberate edge), `--border-accent` (yellow, for selected and
featured states only). `--color-border-subtle` (6%) is for internal table and
list separation.

Borders — not shadows — are the primary tool for separating surfaces.

---

## 9. Radius

`--radius-none: 0`, `--radius-xs: 2px`, `--radius-sm: 4px` (buttons, inputs),
`--radius-md: 8px` (cards), `--radius-lg: 12px`, `--radius-pill` (tags and
segmented toggles only), `--radius-circle` (radio, avatar).

Restrained by intent: the product should read sharp, modern and confident, not
soft SaaS. Radius is applied where it aids grouping or usability, not as
decoration.

---

## 10. Surfaces and elevation

Depth is expressed through **contrast, border, spacing and typography**. The
shadow tokens are deliberately minimal:

- `--shadow-none` — the default for all cards and surfaces.
- `--shadow-overlay` — genuinely floating layers only (drawer, modal).
- `--shadow-accent-glow` — reserved for a single high-emphasis moment; use
  requires justification.

Surface ladder, darkest to lightest — the order is honest, so "up the ladder"
always means more prominent:

`--color-bg-deep` → `--color-bg-sunken` → `--color-bg` → `--color-surface` →
`--color-surface-hover` → `--color-surface-active`

The featured pricing card is emphasised by moving one step up this ladder plus
an accent border and ribbon — never by a shadow.

---

## 11. Motion

| Token | Value | Use |
| --- | --- | --- |
| `--duration-instant` | 100ms | Micro feedback |
| `--duration-fast` | 180ms | Hover, focus, press |
| `--duration-base` | 300ms | Accordion, tabs, nav indicator |
| `--duration-slow` | 500ms | Scroll reveals, drawer |
| `--ease-standard` | `cubic-bezier(.2,.6,.2,1)` | State and colour changes |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | Entrances |
| `--ease-in` | `cubic-bezier(.7,0,.84,0)` | Exits |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | Two-way transitions |

Principles: motion confirms an interaction or reveals structure; it is never
decoration. No bounce, no parallax, no looping ambient movement, nothing that
delays reading.

`prefers-reduced-motion: reduce` collapses every duration **at the token
level**, so a component physically cannot forget to honour it. A blanket
override in the reset catches anything untokenised, and `motion.js` reveals all
content immediately rather than animating it — including when the preference
changes mid-session.

---

## 12. Interaction states

Every interactive element defines all five:

| State | Treatment |
| --- | --- |
| Default | Secondary text or outlined surface |
| Hover | Colour shift to accent or raised surface; 1px lift on buttons |
| Active | Darker accent / `--color-surface-active`; lift removed |
| Focus-visible | `--focus-ring` — a double box-shadow (background halo + 2px yellow) that stays visible on charcoal, on surfaces and on yellow |
| Disabled | Recoloured surface + `--color-text-disabled`, `pointer-events: none` |

Selected/current states use `aria-current`, `aria-selected` or
`aria-pressed` — the styling hangs off the ARIA attribute, so the visual and
the accessible state cannot diverge.

Under `forced-colors: active` the token ring is replaced by a system outline.

---

## 13. Responsive rules

- Mobile is designed, not derived. The drawer uses `--text-h3` links with 64px
  rows; it is not a shrunken desktop nav.
- Minimum touch target `--touch-target-min: 44px`, applied to every control
  including icon buttons, nav links and checkbox rows. Compact controls
  (`.c-btn--sm`, `.c-segmented__option`) keep their 40px density on a fine
  pointer and grow to 44px under `@media (pointer: coarse)`.
  Two targets are smaller by design and are covered by the WCAG inline
  exception: `.c-link` inside prose (≈26px, above the 24px floor of SC 2.5.8),
  and the raw `.c-choice__input` / `.c-card__link` boxes — their real hit areas
  are the 44px `.c-choice` label and the full card surface respectively.
- **No horizontal page scroll at any width.** `overflow-x: clip` on
  `html`/`body`, `min-inline-size: 0` on grid children, and wide content
  (tables, tab lists) scrolls inside its own container.
- Pricing never becomes a horizontally scrolling table on mobile: packages
  stack as cards.
- `scroll-padding-block-start` clears the fixed header for every anchor jump.

---

## 14. Accessibility rules

- Contrast is verified, not assumed (WCAG 2.1 against `#202020`):
  white 16.3:1 · secondary 8.9:1 · muted 4.8:1 · accent 10.9:1 ·
  `#202020` on accent 10.9:1. All pass AA; all but muted pass AAA.
- Muted text (4.8:1, AA) is restricted to metadata and labels — never pricing,
  package contents, billing models, or anything a purchase decision depends on.
  It is also only valid on `--color-bg` and `--color-surface`; on the lighter
  `--color-surface-hover` it falls to 4.4:1, so use `--color-text-secondary`
  there.
- Semantic HTML first: real `<button>`, `<a href>`, `<ul>`, `<table>`,
  `<label>`; landmarks and one `h1` per page; heading order never skipped.
- Skip link to `#main` as the first focusable element.
- Focus is never removed — only restyled. `:focus:not(:focus-visible)` hides the
  ring for mouse users while keyboard users always see it.
- The drawer traps focus, closes on Escape, restores focus to its trigger, and
  locks background scroll. Collapsed accordion panels and the closed drawer are
  marked `inert` so they contain no invisible tab stops.
- Tabs implement the WAI-ARIA pattern: roving tabindex, Home/End, and arrow
  keys that follow the writing direction.
- Tooltips open on hover **and** focus and are wired with `aria-describedby`.
- Decorative SVG is `aria-hidden`; icon-only buttons carry an accessible name.
- Images require descriptive `alt`; decorative images take `alt=""`.

---

## 15. RTL / LTR rules

- Layout mirrors automatically: every rule uses logical properties
  (`margin-inline`, `padding-block`, `inset-inline-start`, `border-block-end`,
  `text-align: start`). There is no mirrored stylesheet to maintain.
- Per script, four things change — typeface (`--font-arabic`), letter-spacing
  reset to `0` (tracking breaks Arabic letter joins), `text-transform: none`
  (Arabic has no letter case, so uppercase labels become semibold instead), and
  a taller line-height for diacritics.
- Numerals, prices and currency stay LTR inside Arabic text; wrap mixed runs in
  `.u-bidi-isolate` where needed.
- Directional glyphs (arrows, chevrons) take `.u-flip-rtl`. Brand marks and
  logos never do.
- Interaction follows direction too: tab arrow keys and the button icon nudge
  both invert under `[dir="rtl"]`.
- Set `lang` and `dir` on `<html>`; components need no further configuration.

---

## 16. Naming convention

| Prefix | Meaning |
| --- | --- |
| `l-` | Layout primitive (`l-container`, `l-grid`, `l-section`) |
| `c-` | Component, BEM `block__element--modifier` (`c-card__title`) |
| `t-` | Typography role (`t-h2`, `t-price`) |
| `u-` | Utility, single purpose (`u-text-accent`) |
| `is-` / `has-` | Transient state set by JavaScript (`is-open`, `is-revealed`) |
| `data-*` | Behaviour hook — never styled |
| `--_name` | Private custom property, internal to one file |
| `sg-` | Styleguide chrome — documentation only, never shipped |

Behaviour hooks are kept separate from style classes so refactoring CSS can
never break JavaScript, and vice versa.

---

## 17. Cascade architecture

`main.css` opens with a single layer statement that fixes the order:

```css
@layer reset, tokens, base, layout, components, motion, utilities;
```

A later layer always wins regardless of selector specificity or import order,
so specificity wars are structurally impossible. New CSS goes into the layer
matching its role — never into a new layer, and never with `!important`.

---

## 18. Governance

Every subsequent stage follows this system.

**Not permitted:** new colours, ad-hoc font sizes, arbitrary spacing values,
one-off button or card styles, uncontrolled radii, decorative shadows,
inconsistent animation timings, or a component styled in isolation.

**Required when something new is needed:** extend the system. Add a variant to
the existing component, or add a token here first and document it. If a
utility gets used more than twice, it becomes a component.

**Definition of done for any later stage:**

1. Uses only documented tokens.
2. Semantic HTML with unbroken heading order.
3. All five interaction states present.
4. No horizontal scroll at 320, 375, 768, 1024, 1440 and 1920px.
5. Keyboard-operable end to end; visible focus throughout.
6. Verified in both `dir="ltr"` and `dir="rtl"`.
7. Legible and correct with `prefers-reduced-motion: reduce`.
8. Usable with JavaScript disabled — no business information gated by a script.
9. Every figure traceable to the Services & Pricing document.

---

## Open items for Stage 01

These need the approved content before they can be finalised:

- Final navigation labels and their Arabic equivalents in
  `src/scripts/navigation-map.js` (the array already fixes the order for
  header, drawer and footer).
- Final CTA wording (§17 of the brief lists candidates; the system only fixes
  the hierarchy, not the copy).
- Real services, packages, prices, billing models and inclusions — all from the
  supplied document, replacing every placeholder in `styleguide.html`.
- `og:url`, `og:image`, `og:site_name`, canonical, `hreflang` alternates for
  `ar`/`en`, and Organization JSON-LD.
- Self-hosted font files to remove the third-party round trip.
