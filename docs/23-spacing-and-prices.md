# Stage 23 — Spacing refinement + approved Foundation prices

Two objectives, from a brief that was emphatic about what must NOT change:
improve spacing contextually, and update three approved prices. No redesign,
no identity change, no content rewrite.

---

## 0. One thing about the brief

It is headed **"QUANTUM LINK"** and names components **ARC / LINK / FRAME /
SHIFT**. None of those exist in this repository — no file, no class, no
string. This is the Pixora site.

The price target maps exactly, so there was no real ambiguity: the brief
lists Starter / Professional (Most Requested) / Advanced at 200 / 400 / 650,
and Branding & Design carries precisely those three names, those three
figures, and the "Most Requested" ribbon on Professional. That is what was
updated. The spacing work is site-agnostic and applies as written.

Worth flagging in case the header was pasted from another project's template
and something else was intended.

---

## 1. The approved prices

| Package | Was | Now | Displays as |
|---|---|---|---|
| Starter | 200 | **580** | From 580 SAR · One-time |
| Professional *(Most Requested)* | 400 | **1180** | From 1180 SAR · One-time |
| Advanced | 650 | **2580** | From 2580 SAR · One-time |

**Matched by package identity, never by value.** `400` is also
`marketing/Ads Performance`. A find-and-replace on the figure — the obvious
way to do this — would have silently rewritten an unrelated price in another
service. The update walks `src/data/pricing.json` by package `id`, asserts
each one still holds the figure it is expected to replace, and fails loudly
otherwise. A test now pins all twelve figures and checks marketing's 400
specifically.

**"From" reuses what already existed.** `STRINGS.priceFrom` (`From` /
`يبدأ من`) has been on the page since the add-ons shipped. The three packages
carry a `priceFrom` flag in the source and render the same class shape the
add-ons use, so it translates with everything else, needs no new copy in
either language, and renders with scripting off. The other nine packages did
not get it — they were not approved for it.

Set at `--text-small`, regular weight, muted: subordinate to both the package
name and the figure, so §11's hierarchy holds — **name → purpose → price →
action**, asserted per card.

Currency, billing label, ribbon, card design and card order are untouched.

---

## 2. What the spacing measurements said

Measured at 390, 768 and 1440 before anything changed. Two findings stopped
changes that looked obvious:

- **Mobile line length was already 31–49ch.** Raising the mobile gutter — the
  reflexive "more breathing room on phones" move — would have pushed the
  short end further down. The gutter was left alone.
- **Section gaps were already 132 / 184 / 272px.** The brief warns against
  "oversized empty areas" and "excessive vertical gaps" in the same breath as
  asking for room. Section padding was left alone.

The defects were elsewhere, and they were consistency defects rather than
tightness defects.

### The same relationship, set five different ways

A small uppercase label introducing the block beneath it rendered at **8, 16,
24, 32 and 40px** depending only on which component it happened to live in.

The 8px case put a 12px label almost against a ten-row capability list; the
same label above the add-ons grid got 24. Two of the outliers were
**double-spacing** — a child margin compounding with a container that already
declared a `gap`, which is how 40px happened in the contact form.

Now one token, `--space-label-group`, and one value:

| Relationship | Gap | Why |
|---|---|---|
| eyebrow → headline | 16px | they read as ONE unit ("01 / Branding") |
| label → content group | **24px** | the label names a separate group below |

All **14** group labels now sit at exactly 24px, in both languages, at every
breakpoint. "Elsewhere" keeps its 32px separation *above*, because that is
group separation and a different job.

### A measure cap that was written but never applied

`.c-note__body` already declared `max-inline-size: 62ch`. It is a `<span>`,
and `max-inline-size` on an inline box does nothing — so the advertising-budget
note ran the full container: **136ch at 1440px**, 103ch at 1024. The cap
belongs on the paragraph that establishes the line box, which is what the
62ch was always trying to say.

Longest measure on the page: **136ch → 83ch**.

### Three grids of images, three different rhythms

`.c-devices` and `.c-modules` stepped 16 → 24 with the viewport at different
breakpoints; `.c-brandboard` sat at 16 at every width. Scrolling Branding →
Websites → Social changed the spacing of three visually identical grids in
three consecutive sections. All three now step together at 48em.

### Room where a wide screen has room

| | 390 | 768 | 1440 |
|---|---|---|---|
| package card padding | 24 | 32 | **40** |
| pipeline row gap | **8** | **8** | **12** |
| media grid gap | 16 | **24** | 24 |

The package card is the page's decision point and the widest card frame —
32px reads as adequate on a 340px phone card and tight on a 376px desktop one
carrying a level mark, name, purpose, price block, feature list and action.
The capability lists shipped a **4px** row gap at every width, which made a
ten-step list read as one block of text.

`--space-40` was added: the scale jumped 32 → 48, a 50% step too coarse for
card padding. It is the missing rung on the same 8px grid, not a new system.

---

## 3. Proof that nothing else moved

The brief's central claim — spacing refinement, not redesign — is a claim
about what did **not** change, so it is checked that way. The build from
before this task and the build after are rendered side by side and compared
element by element.

**2,515 elements, at 390 / 768 / 1440, in both languages:**

- **zero** differences in colour, background, border, radius, font family,
  size, weight, letter-spacing, line-height, text-transform, display,
  position, box-shadow, opacity, background-image, or grid track *count*
- palette identical (11–14 colours in use)
- font stacks identical (2)
- type scale identical (17–21 sizes)
- section order identical
- every visible string identical once the three approved figures are masked
- spacing **did** change — in exactly eight components, all of them ones this
  work set out to touch

Two things that check found in my own measurement rather than the page: a
positional element key that mis-matched every sibling after the new "From"
span, and a comparison of grid track *widths* — which necessarily move when a
gap does. Both were the test, not the site.

### Performance (§14)

| | before | after |
|---|---|---|
| `dist/index.html` | 411,440 B | 412,215 B (+775) |
| gzipped | 116,369 B | 116,490 B (+121) |
| mobile page height | 24,701px | 24,805px (+0.4%) |

No JavaScript added, no animation added, no effects added.

---

## 4. Two things left alone, deliberately

**The section lead paragraph is 31ch at 1024px.** `.c-detail__head` places the
lead in 4 of 12 columns, which is 288px at 1024 and wraps the intro to 4–6
lines — genuinely compressed, and the most-read text in each section. Fixing
it means changing a column span or moving a breakpoint. §03 says maintain the
grid and §15 says the page must look like the same page, so this is reported
rather than changed. **It is a real readability issue at 1024–1200px and worth
a decision.** The one-line fix, if you want it, is widening the lead from
`span 4` to `span 5` at 64em and restoring `span 4` at 90em.

**Marketing's six-step flow is three columns at tablet.** Its longest label —
"Campaign setup, Campaign Monitoring and Optimisation" — wraps to six lines in
a 205px column. That grid is explicitly composed: its own comment says
"1 / 2 / 3 columns divides six evenly at every width". I widened the generic
pipeline's minimum track to fix this, discovered it does not govern the
`--flow` variant, and that it had instead changed the Websites and Social
pipelines — which had **no measured problem**. Reverted. A change without a
cause is not a refinement.

---

## 5. Checklist

| | |
|---|---|
| Visual identity, logo, colours, typography | unchanged — proven element by element |
| Content, section order, grid | unchanged — proven |
| Components | unchanged; no component gained or lost a rule that changes how it looks |
| Whitespace / section / card / mobile / tablet / desktop spacing | improved, contextually |
| Starter / Professional / Advanced | From 580 / 1180 / 2580 |
| "Most Requested" | preserved, both languages |
| 200 / 650 retired; 400 kept where it belongs | verified |
| Currency format | preserved |
| Unrelated prices | untouched — all nine asserted against source |
| Animations added | none |
| Performance | +775 bytes raw, +121 gzipped |
