# WEBSTART X — where the eleven stages actually stand

**6 September 2026, re-traced 7 September.** `docs/62` read *"1 of 11 complete"* until this document replaced it. That was true
when it was written on 5 September and was out of date within a day. This is the current
state, each row traced to the document that closed it.

> **7 September re-trace.** Twelve documents landed after this one — `docs/103`
> through `docs/115`. **None of them moves a stage count**, and that is worth
> saying rather than leaving to be inferred: they were component redesigns
> (`103`–`107`), a visitor audit and its fixes (`108`–`112`), the phone scroll
> (`113`), the owner's photographs and the reel road (`114`), and a full test
> that found a 320px defect and added a fourth harness (`115`).
>
> The two partial stages and the two blocked ones are blocked on the same four
> people-shaped things they were blocked on yesterday — §3 is unchanged and was
> re-confirmed today. **Nothing in this container can advance them.**

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
| **X06** | High-Impact Upgrade | 🟡 **Most of it** | `docs/88` (section pass), `docs/87` (the way into Services & Pricing), plus P1's CTA, width, banding and hero work — and since 6 Sep the button, card, header and Recent Work redesigns (`docs/103`–`107`) and the sixteen-item visitor audit (`docs/108`–`112`). **Remaining is unchanged: the four-block repetition and section naming/order — both B5's**, because both are judgements about what a buyer does, not about what the code does |
| **X07** | Interaction & Motion | ✅ **Done** | `docs/83` — the systematic pass, and the reduced-motion promise made true rather than claimed |
| **X08** | Mobile Excellence | ✅ **Done**, and twice re-opened by measurement | `docs/72` — the stage X01 called *verified, not designed*. `/story` went from a CTA in view 6% of the scroll to 99%. Since: `docs/113` took the phone homepage 27.6 → **25.8 screens** by turning three stacked image grids into snapping scrollers, and `docs/115` found **nine pricing cards laying out 352px wide in a 272px column at 320px**, clipped in silence. A stage marked done is not a stage that stops being measured |
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

**Re-confirmed 7 September**, after twelve further documents and a second full
test. The table above is unchanged, and it is unchanged for the right reason:
each of the four rows needs an observation only a person can make — a live
competitor page the egress proxy will not fetch, five buyers in a room, an
Arabic reader, a screen-reader user. None of them is a piece of work being put
off.

There is also one item that is neither a stage nor blocked: **the site's
verdict.** `docs/108` graded it 🟡 MAYBE for one reason — every claim on the
page comes from the company itself — and `docs/112` and `docs/114` both
re-checked it and left it there. Seven photographs of the studio's own work
are still the studio's own word. **One named client willing to be quoted is
the single thing that moves it**, and it is owner-supplied.

---

## 4. The honest constraint, restated

The egress proxy answers 403 to any page request. **WebSearch works; fetching a
specific page does not** — re-confirmed today against `prismdigital.ae`.

So a competitive review can be *sourced* here and never *verified*. That is why
X02's second half and X10 are marked blocked rather than merely unstarted: what
they need is not analysis, it is **observation**, and observation is the one
thing this environment cannot do. `tools/reference-probe.js` exists precisely
to move that observation to a machine that can.
