# Stage 06 — E-Commerce

The third detailed service section: a connected commerce module grid, the six
service capabilities, and two packages. Reuses `.c-detail` and `.c-tier`.

---

## 1. Content

| Package | Price |
| --- | --- |
| E-Commerce Starter | 650 SAR one-time |
| E-Commerce Professional | 1,100 SAR one-time |

Capabilities, verbatim and identical to the strings already shown in the
Services index: Online Store Creation · Product Setup · Categories · Shipping
Configuration · Payment Configuration · Required Service Integrations.

**Per-package inclusions were not supplied.** As with Websites, the cards now
carry a **draft split** of the approved capabilities, marked
`data-draft-features`, drawn only from the six above and kept in source order:

| Package | Price | Inclusions in the draft |
| --- | --- | --- |
| E-Commerce Starter | 650 SAR | Online Store Creation · Product Setup · Categories · Shipping Configuration · Payment Configuration (5) |
| E-Commerce Professional | 1,100 SAR | those five · Required Service Integrations (6) |

**This split is weak, and the reason is worth recording.** Six capabilities
across two packages leaves Professional differing from Starter by a single line
while costing 450 SAR more. Payment Configuration is deliberately in Starter: a
store that cannot take payment is not a store, so withholding it to pad the gap
would have described a product that does not exist. There is no honest way to
make these two cards look different from data that does not distinguish them —
this service needs its real inclusions more than any other on the page.

**Still not supplied, and so still not shown:**

- **Positioning statements** — Websites supplied one per package (§13 there);
  this brief does not, so these cards have no purpose line under the name. That
  is the one remaining way they read differently from Branding.
- **A recommended package.** §13 says not to invent one if the source does not
  define it. Branding's document designates *Most Requested*; this one does
  not, so no badge appears. The section's single primary CTA sits in the foot.

A test asserts every feature string is one of the six approved capabilities,
that the two lists are cumulative, that no recommendation badge appears, and
that no guarantee, conversion, revenue, order or percentage language appears
anywhere in the section.

---

## 2. No numbers inside the artwork

§33 forbids fake sales, revenue, conversion rates, order numbers and customer
counts, and permits "decorative neutral values" as an alternative.

I omitted numbers entirely instead. A cart total or an order count still reads
as a claim even when it is decorative — a visitor has no way to know the figure
is meaningless. Every fragment uses bars, blocks and rules where a real
interface would show a value.

A test asserts **no digit appears anywhere inside the section's SVG artwork**.

---

## 3. The commerce grid

Five modules — Storefront, Categories, Cart, Payment, Shipping — in an
asymmetric grid, the storefront anchoring half the field on desktop
(§28: "allow some cards to use asymmetric composition").

Deliberately *not* the hero's radial orbit. Same visual family — modules,
accent markers, micro-labels, abstract UI fragments — expressed as connected
pieces of one system rather than bodies in one field, so the sections read as
the same website without repeating a device.

Hover lifts a module and accents its border. That is emphasis only: every
label and fragment is readable at rest, so nothing is conveyed by hover alone
and nothing is lost on touch.

No third-party platform is imitated.

---

## 4. A CSS ordering bug worth recording

The section headlines were re-wrapping into orphans: `--text-h1` at 62px fits
about seventeen characters in the intro column, and the longest authored line
across these sections measures **12.4em**.

The fix is the container-relative cap the hero already uses. The first attempt
silently did nothing, because I declared it **above** the base
`font-size: var(--text-h1)` rule — same layer, same specificity, so source
order decided and the base rule won. `@layer` does not help here: it orders
layers, not declarations within one.

Moved below the base rule, and now verified rather than assumed: a test
compares the number of **authored** `<br>` segments against the number of
rendered line boxes for every detail headline, at four widths plus RTL. All
three sections hold their authored breaks at 42–54px.

That test also had to change. Deriving the line count from
`height / line-height` reported false failures in RTL, where line boxes pick up
extra leading and the quotient stops being an integer. It now counts distinct
line-box top edges from range rects — a direct measurement rather than a
proxy.

---

## 5. Verified

Headless Chromium, LTR and RTL:

- Both prices and all six capabilities match the source; `1,100` keeps its
  separator in both scripts.
- No invented features, positioning or recommendation; no digits in the
  artwork; no claim language.
- One `h2`, `h3` per package and for the capability heading, packages as
  `<article>`, modules as a real `<ul>`, all decorative SVG hidden, every card
  CTA `aria-describedby` its own package, no heading level skips on the page.
- No overflow at 320/375/430/768/1024/1280/1440/1920 × two directions.
- All targets ≥ 44px; reduced motion leaves everything visible; with
  JavaScript disabled both prices, all six capabilities and all five modules
  render.
- Branding, websites, services, hero, header, IA and styleguide suites all
  still pass.

---

## Open items

- **Per-package inclusions and positioning** for both e-commerce packages.
- Arabic copy for headings, module labels and capability names.
- Stages 07–09 (Social Media, Digital Marketing, Integrated Solutions) reuse
  the same components; those Services rows still point at `#pricing`.
