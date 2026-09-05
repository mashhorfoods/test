# P1-4 · Padding and rhythm

`docs/69` P1-4. Written 5 September 2026.

`docs/70` established that the spacing *tokens* match the reference set. This
asks the question that caught the buttons: **does the site actually use its own
scale, or does it drift the way the control heights did?**

**It does not drift.** That is the result, and the evidence is below rather
than the assertion alone.

---

## 1. Every spacing value the site renders

Every non-zero `padding`, `margin` and `gap` on every visible element, across
eight pages, at two widths.

| | Phone 390 | Desktop 1440 |
| --- | ---: | ---: |
| Non-zero spacing values | 3,689 | 3,306 |
| Distinct values | 19 | 27 |
| **On the 4px ladder** | **86%** | **85%** |

The 14–15% off the ladder is the part worth reading, because in the button
audit the equivalent number *was* the defect. Here every one traces to a
deliberate mechanism:

| Value | Uses | What it is |
| --- | ---: | --- |
| `1.8px` | 218 | `margin-block-start: 0.12em` on the tick icon in a feature row — **em-based optical alignment**, which by definition cannot sit on a px ladder |
| `-1px` | 172 | The `.u-visually-hidden` clip. The standard technique |
| `49.16 / 65.7 / 88 / 90.9 / 136px` | 92 | **The fluid section `clamp()`** resolving at these widths. `docs/70` called this the more considered choice than Stripe's fixed 64 or Linear's 80 |
| `33.8 … 252.39px` | 14 | `margin-block-start: auto` on the package button, resolving to whatever bottom-aligns it in its card — the rule restored in `docs/43` §13 |
| `72px` | 8 | `--header-height`. The drawer's top padding clearing the fixed header |
| `16.27 / 28px` | 4 | The hero's fluid gap |
| `5.6px` | 4 | em-derived |
| `-75px` | 1 | `.c-orbit__core`, a deliberate overlap |

**One value is genuinely arbitrary:** `gap: 2px` between the logo and the
wordmark in `.c-brand`, 32 uses. It is an optical nudge in a lockup rather than
layout spacing, and changing it to `--space-4` would visibly alter the brand
mark — so it is recorded here rather than changed.

Nothing else is unaccounted for. **There is no equivalent of the
`--control-height-sm: 40px` problem in the spacing system.**

## 2. Both languages get identical spacing

Worth checking explicitly, because `docs/73` found every *button* was a
different size in Arabic. Section padding is **66/66 phone and 136/136 desktop
in both languages**, identical, and the boundary rhythm below is identical to
the pixel. The Arabic divergence was a line-height problem in text-bearing
controls, not a spacing-system problem.

## 3. The rhythm is coherent

Boundary rhythm — one section's bottom padding, plus the gap, plus the next
section's top padding — across the homepage's 12 top-level sections:

| | Desktop | Phone |
| --- | ---: | ---: |
| **Dominant** — 6 of 11 boundaries | **272px** | **132px** |
| `c-hero → c-services` | 200px | 130px |
| `c-services → c-proof` | 136px | 66px |
| `c-proof → c-detail` | 224px | 115px |
| `c-detail → c-detail` ×2 | 136px | 66px |

Four distinct values, and **each deviation is a deliberate special case**, not
drift:

- the **hero** ends on 64px rather than a full section pad, because its film
  runs to the edge;
- the **proof band** opens with zero top padding so it sits tight under the
  services it proves, and closes on `--section-space-tight`;
- the **CTA band** carries no padding of its own at all.

The dominant value is exactly double the section padding — consecutive sections
each contribute their own, and the gap between them is zero everywhere. That is
a system doing what it says.

## 4. What the measurement *does* say, and it is for B5

The four service sections, the ecosystem section and the add-ons section —
**six consecutive major sections** — share:

- the same **272px** boundary rhythm (132px on phone),
- the same **136/136** internal padding,
- the same internal structure: heading, four images, three price cards.

`docs/55` §6 named this "the largest unresolved question on the site" and
**refused to guess between the three structural fixes.** That refusal stands
and nothing here overrides it.

What this adds is a number instead of an impression. `docs/68` §5 asks five
buyers *"does the repetition orient them or exhaust them?"* — and the thing
being asked about is now specified: **six sections in a row that give the
reader an identical spatial signal.**

The rhythm is not inconsistent. It may be **consistent to a fault** — Linear
and Vercel vary section spacing to signal hierarchy, where this page applies
one value six times running. But whether that reads as calm or as monotonous is
exactly what a measurement cannot answer, and five people can.

## 5. No guard, and why

The other P1 items ended in a `qa.js` check. This one does not, deliberately.

A ladder check would have to tell a **fluid** value from a **fixed** one at
runtime — 65.7px from a clamp is correct, 65.7px hard-coded would be drift, and
the computed style is identical. It would also have to allow `auto` margins and
em-derived optical nudges. Every version of that check either fails on correct
code or passes everything, and **a guard that cannot fail correctly is worse
than none** — this project has now found six checks that measured nothing
(`docs/43` §12).

The spacing system is checked by the thing that actually protects it: it is
declared in one file, used through custom properties, and any drift shows up in
`git diff` as a literal where a token should be.
