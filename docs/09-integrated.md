# Stage 09 — Integrated Solutions

> **Extended by the clarity pass.** This section absorbed Stage 12's "Why Us":
> the ecosystem below shows HOW the five services connect, and the arrangement
> contrast that now follows it shows WHAT that connection saves you. The two
> were arguing the same point under near-identical headlines three sections
> apart. See `docs/18-refinement.md` §2.

The strategic close of the service ecosystem. Every earlier section answers
*what do you do*; this one answers *why one partner*.

---

## 1. Content, and what was left out

The six members of the approved ecosystem, and nothing else:

| | Node | Role | Links to |
| --- | --- | --- | --- |
| 01 | Identity & Design | Build the foundation. | `#branding` |
| 02 | Websites | Create the digital presence. | `#websites` |
| 03 | E-Commerce | Enable online transactions. | `#ecommerce` |
| 04 | Social Media Management | Build ongoing engagement. | `#social` |
| 05 | Digital Marketing | Reach the right audience. | `#pricing` |

The sixth — **Integrated Digital Solutions** — is not a sixth node. It is what
the other five add up to, so it is the hub they all point at, carrying the
document's own line: *"Connecting these services into one complete digital
presence."*

**Each node carries a name and one line, and no capability list.** The brief's
§10 asks for "a very short supporting descriptor"; §24 forbids repeating the
Services section. Listing Domain · Hosting · Design again under Websites would
have made this the Services accordion with different chrome. A test asserts no
capability string from `#services` appears anywhere in this section.

**No figure appears anywhere.** The only digits in the section are the section
number and the five node indices — a test asserts exactly that string. §23
forbids fabricated percentages, ROI, revenue and client counts; rather than
supply "decorative" ones, there are none to misread.

### One asymmetry that is the document's, not mine

Digital Marketing's approved data names its platforms (Facebook, Instagram,
TikTok, Snapchat, Google Ads); Social Media Management's specifies platform
*counts* and never names one. Stage 07 therefore named no platform, and this
section keeps that rule. If the two ever look inconsistent, the inconsistency
is in the source and should be resolved there.

---

## 2. The composition: an armature, not another orbit

§05 asks for a centre with services connected to it, and §24 forbids repeating
an earlier device. The hero already uses a radial constellation and Stage 06 a
connected module grid, so a third ring would have read as the same trick.

This is an **armature**: orthogonal, indexed, wired. Nodes sit on a strict
grid, each carries a number, and each is joined to the hub by a drawn line.
Same visual family — accent markers, hairline rules, abstract structure — read
as engineering rather than astronomy.

### Three compositions, not one scaled down (§16)

| Width | Composition |
| --- | --- |
| ≥ 64em | Three columns: nodes 01–03, hub, nodes 04–05. Every node taps the hub with a stub across the gutter. |
| 48–64em | Hub leads full width; a spine drops from it, runs horizontally, and feeds a rail down each of two node columns. |
| < 48em | A vertical journey: one rail, five numbered stops, the hub as terminus. |

**No SVG coordinate maths.** Every connection is a box positioned against the
grid it belongs to, so the wiring reflows with the layout and mirrors under RTL
through logical properties alone. Nothing has to be recomputed on resize, and
there is no JavaScript in the drawing at all.

An earlier version also ran vertical rails down the desktop gutters to join the
stubs into a bus. It was removed: those rails had to meet across grid rows
whose heights come from their content, so any two nodes of different heights
left a visible break. **A connection diagram with gaps in it argues the
opposite of the point.**

---

## 3. Interaction (§11–12)

Hover or focus a node and it lifts toward the hub, its connection turns accent,
its marker grows and brightens, the arrow appears, and the other nodes drop to
`0.62` opacity — reduced in emphasis, still above 4.5:1, still readable.

Two things make this safe:

- **It is CSS only.** `:has()` does the work, so it survives a failed script
  load and costs no JavaScript.
- **It is never required.** At rest every node is fully opaque and every label
  and role is rendered. A visitor who does nothing sees the whole proposition;
  a test asserts that at rest state directly.

Every state is doubled — colour *and* weight, colour *and* scale, colour *and*
an affordance — so none of it depends on seeing the accent (§27). On a coarse
pointer, where hover never happens, the arrow is shown permanently.

### The nodes are links

Each node is an `<a>` to that service's own section, so the composition is
navigation rather than decoration: keyboard users tab 01 → 05 in journey order
with a visible ring, and the diagram is a way through the page. Digital
Marketing has no section yet and points at `#pricing`, matching its Services
row. The Services row for Integrated Solutions now points here.

---

## 4. Two bugs worth recording

**`grid-row: 1 / -1` silently stopped spanning.** The hub is placed across all
three node rows so that every stub lands on it. `-1` counts *explicit* grid
lines, and the grid declared only columns — so in an implicit row grid `-1`
resolves back to line 1 and the hub quietly occupied one row. The lower stubs
then ran into empty space. Fixed by declaring `grid-template-rows: repeat(3,
auto)`: the sizing is unchanged, but the line now exists to be counted.

**Reduced motion lost a specificity fight.** The hover shift is direction- and
column-specific, so the winning selector is
`[dir="rtl"] .c-eco__stop:nth-child(-n+3) .c-eco__node:hover` — five components.
A `@media (prefers-reduced-motion: reduce)` block overriding `.c-eco__node:hover`
never applied, and the test caught movement that the CSS claimed to have
disabled. The amounts now live in `--eco-shift` and `--eco-pop`, which
reduced-motion zeroes on one selector. Custom properties do not compete on
specificity, which is the point.

A third, smaller one: a grid item will not shrink below its longest word, so at
1024px the narrowest column was four pixels short of "Management" and the node
overflowed its own card. `min-inline-size: 0` on the text cell plus
`overflow-wrap: break-word`.

---

## 5. Verified

Headless Chromium, both directions:

- All five node names, roles, indices and link targets match the approved data;
  every target resolves to a real section.
- No capability list repeated from `#services`; no ROI, revenue, conversion,
  percentage or award language; the only digits are the indices.
- One `h2`, no deeper headings (node names are link labels, not sections), one
  primary CTA, the journey a real `<ol>`, every SVG hidden from assistive tech.
- Hover: the active connection turns `#F4D13F`, others stay neutral, siblings
  drop to 0.62 and no further. Keyboard: focus ring visible, tab order 01 → 05.
- Desktop two columns with **every stub terminating on the hub**; tablet hub
  first; mobile single column with the hub last. Asserted geometrically, not by
  eye.
- RTL: nodes 01–03 move to the *right* of the hub and 04–05 to the left — the
  composition mirrors, not just the text — and every stub still lands.
- **No overflow at 320/360/375/390/430/768/834/1024/1280/1440/1920 × two
  directions.** Targets ≥ 44px on a coarse pointer.
- Reduced motion: no movement or scaling, connection still highlights, nothing
  left hidden by a reveal.
- JavaScript disabled: all five nodes and the hub render.
- Websites, E-Commerce, Branding, Services, Social, header and IA suites all
  still pass; the single-file build still makes **0 network requests**.

---

## 6. Open

- **Arabic copy.** The whole section is `data-i18n-pending`; the RTL
  composition is built and tested, it just needs the words.
- **Digital Marketing has no section.** Node 05 points at `#pricing` until it
  does. The brief's §03 lists its platforms but no packages or prices.
- **Stage 08** was never issued; this section was built directly after Stage 07.
  Nothing here depends on it.
