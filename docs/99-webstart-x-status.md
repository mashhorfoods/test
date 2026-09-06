# WEBSTART X — where the eleven stages actually stand

**6 September 2026.** `docs/62` still reads *"1 of 11 complete"*. That was true
when it was written and has been wrong for about a week. This is the current
state, each row traced to the document that closed it.

---

## 1. The count

**7 complete · 2 partial · 2 not started.**

| | Stage | Status | Evidence |
| --- | --- | --- | --- |
| **X01** | Baseline Audit | ✅ **Done** | `docs/55` — its own KEEP/IMPROVE/ADD list is closed or explicitly withdrawn |
| **X02** | Global Benchmark | 🟡 **Half** | `docs/70` benchmarked the reference set's published specs: our token layer sits inside the band and ahead on target sizes. **The gap is not in the numbers.** The measurable half against live references needs B1's probe runs |
| **X03** | Experience Deconstruction | ✅ **Done** | `docs/80` §2–§3 — the hero action as a real first step, categories named for the outcome, the dark-side-left rule held. Thin on scroll and rhythm, and says so |
| **X04** | Reference-Driven Redesign | ✅ **Ledger closed** | `docs/82` §7 — one adapted, one held for B5, one rejected with a reason, one already answered. The section-level remainder is B5's |
| **X05** | Redesign Direction | ✅ **Done** | `docs/98` — Current → Desired → Why → What changes → What stays. `docs/53` made the showpiece budget decision inside it, early |
| **X06** | High-Impact Upgrade | 🟡 **Most of it** | `docs/88` (section pass), `docs/87` (the way into Services & Pricing), plus P1's CTA, width, banding and hero work. **Remaining: the four-block repetition and section naming/order — both B5's** |
| **X07** | Interaction & Motion | ✅ **Done** | `docs/83` — the systematic pass, and the reduced-motion promise made true rather than claimed |
| **X08** | Mobile Excellence | ✅ **Done** | `docs/72` — the stage X01 called *verified, not designed*. `/story` went from a CTA in view 6% of the scroll to 99% |
| **X09** | Design System Refinement | ✅ **Done** | `docs/75` — text below 10px and shrinking as the screen grew, including four service names at 10px on a laptop |
| **X10** | Validation & Comparative Review | ⛔ **Blocked** | Needs the reference numbers B1 would produce. A comparison cannot be sourced from here — §3 |
| **X11** | World-Class Gate | ❌ **Not started** | Correctly last. It gates on P4-1, which applies the B3/B4/B5/B6 findings |

---

## 2. What actually moved the number

Not a sprint at the stages. Four of the seven closed as a side effect of work
that was named something else:

| Stage | Closed by | Which was really about |
| --- | --- | --- |
| X08 | P1-5 | A phone visitor with no call to action for up to 5.5 screens |
| X09 | P1-6 | Type below 10px, shrinking as the screen grew |
| X07 | `docs/83` | 132 blocks that strand when the reveal module throws |
| X04 | `docs/82` | The funnel's ending being a claim that was never true |

Worth noting because it is the answer to *"why is this taking so long"*: the
stages closed when a real defect was found in their territory, not when someone
decided to do the stage. `docs/51` §3 predicted this — **"WEBSTART X here would
be refinement, not reversal."**

---

## 3. What remains, and what each thing is waiting for

| | Waiting on | Who |
| --- | --- | --- |
| X02 second half | Two `reference-probe.js` runs on a reference site, plus one Arabic-first site | **Owner** — B1 |
| X06 remainder | Five moderated buyer sessions | **Owner** — B5, `docs/68` |
| X10 | X02's numbers | Follows B1 |
| X11 | B3, B4, B5, B6 findings applied | Follows P4-1 |

**Every remaining stage waits on a person, not on work.** There is no stage
left that this container can advance alone — which is a different situation
from a month ago, when the blocker was a missing capability rather than a
missing observation.

---

## 4. The honest constraint, restated

The egress proxy answers 403 to any page request. **WebSearch works; fetching a
specific page does not** — re-confirmed today against `prismdigital.ae`.

So a competitive review can be *sourced* here and never *verified*. That is why
X02's second half and X10 are marked blocked rather than merely unstarted: what
they need is not analysis, it is **observation**, and observation is the one
thing this environment cannot do. `tools/reference-probe.js` exists precisely
to move that observation to a machine that can.
