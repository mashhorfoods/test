# The roadmap to final delivery

Written 5 September 2026, replacing `docs/62` as the working list. `docs/62`
stays as the record of how §A and §C were closed; **this file is what gets
worked from now.**

It exists because of a fair challenge from the owner: the redesign we agreed —
take the best of the reference sites and apply it to our brand, *"best CTA
experience, buttons, padding, mobile experience, category and section sort"* —
had one stage delivered (the hero) and then stalled, and the list said it was
blocked. Most of it is not.

---

## 1. The correction that reorders everything

`docs/52` §4 recorded that the reference sites cannot be opened from this
environment. **Re-tested today: still true.** `linear.app` and `pixverse.ai`
both return `EGRESS_BLOCKED`.

From that, four X-stages were marked blocked and the whole redesign was parked
behind one recording. That was too broad a conclusion, and it cost the project
time. Two things are true that the block does not cover:

**Web search returns measurable specification, not just opinion.** Asked about
Linear's spacing today it returned the actual ladder — a 4px base scale,
8/12/24/96 rhythm, 80px+ between sections, 72px display type with tight
tracking. That is a number you can hold our own tokens against. `docs/52`'s
objection stands for *motion and rhythm over time* — you cannot deconstruct a
scroll animation from a blog post — but it does not stand for spacing scales,
type ramps, button specs or grid behaviour, which are published and verifiable.

**Four of the five things asked for never needed the references at all.** CTA
behaviour, button systems, padding and mobile are all measurable **on our own
site**, against documented practice. Only *category and section sort* needs an
outside answer — and `docs/68` §5 already argues that **five buyers answer that
better than any reference site can.** So the section-order question belongs to
B5, not to B1.

**Consequence: the redesign restarts now, and the recording blocks less than
half of what is left.**

---

## 2. Where the two workflows actually stand

### WEBSTART — the cycle is complete

**All three gates held, and since 5 September none is held on an open
criterion** (A3 closed the last one, `docs/46` §9). Eleven of 21 phases
complete, nine partial, one out of scope. **Every partial is waiting on a
person or on elapsed time — none is waiting on work.** Phase 20 needs thirty
days of analytics that are now running; the review phases need the four people
in §B below.

Every catastrophic failure mode the project identified is controlled: the
domain cannot be silently transferred or lapse, GitHub is no longer the single
copy, and the site cannot go down unnoticed.

**Plainly: the site is deliverable today.** What follows is not rescue work.

### WEBSTART X — one of eleven, and that is the honest number

| | Stage | Status |
| --- | --- | --- |
| X01 | Baseline Audit | ✅ **Done** — `docs/55` |
| X02 | Global Benchmark | 🟡 **Splitting in two.** The *measurable* half runs now (P1 below). The *experience* half needs the recording |
| X03 | Experience Deconstruction | ⛔ Behind X02's second half |
| X04 | Reference-Driven Redesign | ⛔ Behind X03 |
| X05 | Redesign Direction | 🟡 One decision made and shipped — the showpiece budget, `docs/53` |
| X06 | High-Impact Upgrade | 🟡 Phone CTA, width parity, proof band, section banding, hero, Arabic heading leading, package-button alignment all shipped |
| X07 | Interaction & Motion | 🟡 Hero film ships with reduced-motion guards. No systematic pass |
| X08 | Mobile Excellence | 🔓 **Not started — and not blocked.** Starts in P1 |
| X09 | Design System Refinement | 🔓 **Not started — and not blocked.** Starts in P1 |
| X10 | Comparative Validation | ⛔ Needs a baseline to compare against, which is X04 |
| X11 | World-Class Gate | ⛔ Last |

**Two stages were sitting behind a blocker that never applied to them.** X08
and X09 need our own site and a measuring tool, both of which are here.

### The admin dashboard — already delivered, and worth saying so plainly

`docs/63`, decided 5 September on the owner's own answers: **one content
editor, therefore Option 0.** GitHub's web editor *is* the dashboard. Edit
`src/data/*.json` from anything including a phone; CI classifies the push as
data-only, runs all three harnesses, rebuilds and commits `dist/` back, and
attaches the upload archive to the run.

**It was tested end to end on the live branch, not reasoned about** — a price
edited and pushed with no local build, then reverted; both pushes produced a
correct bot rebuild.

So there is **no dashboard phase still coming** under the decision that was
made. C2 and C3 are moot. If what was pictured was a screen with a login and
form fields, that is Option 1 or Option 2 in `docs/63` §Q4, it is a **reopened
decision rather than pending work**, and §5 below prices it.

---

## 3. The two finish lines

Naming both, because "finished" has meant different things in different
conversations.

| | What it means | Where we are |
| --- | --- | --- |
| **Finish line A — the site is done and safe** | Live, verified, backed up, monitored, legally papered, nothing catastrophic uncontrolled | **Reached.** A10 is the only open item and it is deferred on purpose |
| **Finish line B — the redesign and the reviews are complete** | WEBSTART X through X11, and the four human reviews applied | **This roadmap.** P1–P4 below |

---

## 4. The plan

Four phases. **P1 starts immediately and needs nothing from anyone.**

### P1 — The redesign work that was never actually blocked

> **✅ COMPLETE, 5 September 2026.** All six, each with measured before/after
> numbers and a guard where a guard could fail correctly.
>
> | | | Outcome |
> | --- | --- | --- |
> | P1-1 | `docs/70` | The token layer already sits inside the reference band, and is ahead on target sizes and fluid rhythm. **The gap is not in the numbers** |
> | P1-2 | `docs/71` | A phone visitor had no call to action for up to 5.5 screens; 12 of 23 CTAs open WhatsApp and none says so |
> | P1-3 | `docs/73` | **Every button on the site was a different size in Arabic.** Rendered heights 5 → 3, all on scale, both languages identical |
> | P1-4 | `docs/74` | No spacing drift — 85% on the ladder and every exception traced. Six consecutive sections share one rhythm: a number for B5 |
> | P1-5 | `docs/72` | The phone CTA gap closed: `/story` went from a CTA in view 6% of the scroll to 99% |
> | P1-6 | `docs/75` | **X09 delivered.** Text below 10px, shrinking as the screen grew — including the four service names at 10px on a laptop |
>
> Four new `qa.js` sections came out of it — reach, control scale, type floor,
> and CSS that can never apply — each verified by reintroducing the defect it
> was written for.

Mine. In order. Each ends in measured before/after numbers and a commit, the
way §12–§15 of `docs/43` did.

| # | Work | What it produces |
| --- | --- | --- |
| **P1-1** | **The measurable benchmark (X02, first half).** Our design tokens against the published specs of the reference set — spacing ladder, type ramp, button sizing, touch targets, grid breakpoints. Search-sourced and cited, with the limitation stated on its face | A comparison table and a ranked list of specific, costed changes |
| **P1-2** | **Best CTA experience.** Every call to action on the site inventoried and measured: label, size, touch target, contrast, position in the scroll, repetition, and the hierarchy between primary and secondary. Both languages, both widths | The CTA system as it is, against what it should be |
| **P1-3** | **The button system.** Sizes, every state (rest, hover, focus, active, disabled), RTL behaviour, and the WhatsApp buttons' "this leaves the site" problem `docs/67` §2.4 raised | One documented button spec, and the diffs to reach it |
| **P1-4** | **Padding and rhythm (X06 remainder, the measurable part).** Our spacing scale against the ladder, section padding at every breakpoint, and the vertical rhythm from `docs/55` §6 that banding punctuated but did not solve | A spacing audit and the changes that follow |
| **P1-5** | **Mobile experience (X08).** The stage X01 said was *verified, not designed*. Phone-first at 360/390/430: thumb reach, tap targets, scroll length per section, what a one-handed buyer can actually reach, the sticky-CTA question | X08 delivered |
| **P1-6** | **Design system refinement (X09).** The 91 selectors `qa.js` reports as styling nothing a visitor sees, the `.l-*`/`.u-*` vocabulary held back from E6 for exactly this stage, and one documented token set | X09 delivered, and E6's remainder resolved |

**What P1 cannot decide, and will not pretend to:** the four service blocks'
structural repetition. `docs/55` §6 refused to guess between the three
structural options and that refusal still holds. It is P2's B5.

### P2 — The five things only other people can do

Parallel with P1. Nothing here waits on anything else here.

| # | Who | What | Unblocks |
| --- | --- | --- | --- |
| **B1** | You | The reference recording — full-page scroll at desktop *and* phone, plus ten seconds on the hero. `docs/64` says exactly what to capture. **Plus one Arabic-first site you respect** — a URL is enough | X02's second half → X03 → X04 → X10 |
| **B5** | Five buyers | Five moderated sessions, `docs/68`. **This is what answers category and section sort** | X06's structural question |
| **B3** | An Arabic speaker | One hour, `docs/66`. `/terms` first — 670 Arabic words in a contract nobody has reviewed | B4's first question |
| **B4** | A lawyer | `docs/65`. The governing-language gap is the headline | Legal risk |
| **B6** | Any VoiceOver user | 30–40 minutes, `docs/67` | `/accessibility` stops saying no person has tried |
| **B2a** | **You, then Al Mada** | **BLOCKED ON AN ADDRESS, not on them.** The 4 Sep message bounced — `550 5.1.1 … does not exist` for `madatravel@gmail.com` — so Al Mada never received it and has never been waiting. **A working address or a WhatsApp number is needed.** The posters carry `+966 508531560` marked WhatsApp and `+966 0580790186`. The message is written and ready in `docs/50` Part 7, covering F1, F2, F2a and the result sentence | Chapter 05 gets its number |
| ~~**B2b**~~ | ~~You~~ | **DONE 5 Sep 2026.** The four deliverables are in the repository — originals at full resolution in `src/assets/originals/` (3.1MB, now on both remotes, closing `docs/57` §2's only irreplaceable-and-unbacked row) and WebP derivatives at 34–85KB shipped. **The case study now shows the work it describes:** the identity sheet in chapter 02, the website in 04, the campaign and profile in 05. The five SVG sketches stay — sketch carries the argument, photograph carries the artefact | ✅ |
| **A10** | You | The email swap, when deliverability is proven | `docs/58` T5's second half |

### P3 — The X stages that genuinely need P2

| # | Work | Needs |
| --- | --- | --- |
| **P3-1** | X02 second half + **X03 Experience Deconstruction** | B1 |
| **P3-2** | **X04 Reference-Driven Redesign** — preserve / borrow / adapt / improve / reject | P3-1 |
| **P3-3** | **X05 direction statement** in full | P3-2 |
| **P3-4** | **X06 structural remainder** — the four-block question | B5 + P3-2 |
| **P3-5** | **X07 systematic motion pass** | P3-2 |
| **P3-6** | **X10 comparative validation** | P3-2 |

### P4 — Delivery

| # | Work |
| --- | --- |
| **P4-1** | Apply every finding from B3, B4, B5, B6 — each closes when *applied*, not when received |
| **P4-2** | **X11 World-Class Gate** |
| **P4-3** | Final handover pass — `docs/56` refreshed against whatever P1–P3 changed |

---

## 5. If the dashboard should be a real screen after all

Not on the plan, because Option 0 was chosen on the owner's own answer. Priced
here so reopening it is a decision rather than a surprise.

| | What it is | Cost | What changes |
| --- | --- | ---: | --- |
| **Option 0** *(current)* | GitHub's web editor + CI | built | Nothing |
| **Option 1** | A git-backed CMS — a real form UI, commits to the repo, still no server | ~a weekend | A third-party dependency and an auth surface. AD-01 survives |
| **Option 2** | A dashboard with its own auth and storage | a scoping engagement | The threat model and backup plan are rewritten. AD-01 ends |

The four triggers in `docs/36` §4 remain the route back, and `docs/63` maps
each to the option it would move to. **A second content editor is the one that
matters** — it was the answer to Q1 that decided this.

---

## 6. The rule for this file

Same as `docs/62`: an item leaves by being **done and verified** or
**explicitly cancelled with a reason**. Nothing leaves by being forgotten.

And one addition, learned from why this file had to be written:

> **A blocker is scoped to what it actually blocks.** X08 and X09 sat behind a
> recording they never needed. When something is marked blocked, the thing it
> blocks gets named — not the phase it happens to live in.
