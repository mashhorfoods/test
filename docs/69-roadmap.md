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

### P2 — The eight things I cannot do alone

Parallel with P1. Nothing here waits on anything else here.

| # | Who | What | Unblocks |
| --- | --- | --- | --- |
| **B1** | You | **Half done — `docs/80`.** Two PixVerse frames arrived (marketing hero on phone, app home on desktop) and **X03 is deconstructed from them**: the hero action as a real first step, categories named for the *outcome* not the feature, and the dark-side-left rule held against the reference's opposite choice. No recording needed now. What is left is **numbers**, and this container cannot get them — the egress proxy 403s every reference host. So: paste **`tools/reference-probe.js`** into the browser console on `pixverse.ai`, once at a maximised window and once in the device toolbar at iPhone 14 Pro, and paste back the JSON. **Plus one Arabic-first site** — a third probe run, or just a URL | X02's second half → X10 |
| **B5** | Five buyers | Five moderated sessions, `docs/68`. **This is what answers category and section sort** | X06's structural question |
| **B3** | An Arabic speaker | **READY TO SEND — `docs/91`.** One hour, self-contained, replacing `docs/66`. Meaning is done (`docs/77`: 67 pairs, no discrepancy), so this asks only for an ear. **New first section:** the Arabic written this session by a non-native speaker — the service chooser, the gallery, the service buttons, and **the two WhatsApp messages the site now composes for the visitor**, which are the first words a client ever sends us. Extracted by diffing today's commits, not from memory | — |
| **B4** | A lawyer | **READY TO SEND — `docs/90`.** One self-contained brief replacing `docs/65` + `docs/78`, written for an outsider rather than for us, with every fact re-verified against the 6 Sep build (one correction: 27 WhatsApp links, not 28). Ranked by risk so a partial budget still buys the important half, and §4 names what not to review so it is not billed. **New question added this week:** the site now composes the client's opening WhatsApp message naming a package and a price — §1.2 and §3.7 | Legal risk |
| **B6** | Any VoiceOver user | 30–40 minutes, `docs/67` §2. **Tree re-read after today's changes — `docs/79`:** a fourth useless name found and fixed (twelve `<summary>` controls all announcing *"What's not included"*), and `qa.js` §18 now guards the class. §2's six questions are untouched and are the whole of B6 | `/accessibility` stops saying no person has tried |
| **B2a** | Al Mada | **Sent by WhatsApp 5 Sep** to `+966 508531560`, after the 4 Sep email bounced. Recorded as *owner-reported*, not confirmed delivery — `docs/50` Part 9 says why. Now genuinely waiting on them: F1, F2, F2a and the result sentence | Chapter 05 gets its number |
| ~~**B2b**~~ | ~~You~~ | **DONE 5 Sep 2026.** The four deliverables are in the repository — originals at full resolution in `src/assets/originals/` (3.1MB, now on both remotes, closing `docs/57` §2's only irreplaceable-and-unbacked row) and WebP derivatives at 34–85KB shipped. **The case study now shows the work it describes:** the identity sheet in chapter 02, the website in 04, the campaign and profile in 05. The five SVG sketches stay — sketch carries the argument, photograph carries the artefact | ✅ |
| ~~**B7**~~ | ~~You~~ | **CLOSED 6 Sep 2026 — owner decision, `docs/54` §11.** The drawn film was rendered and verified clean (§10); the owner then chose to **ship the generated clips as they are, watermark included**, and that decision is now recorded in `provenance.json` rather than in a commit message. `qa.js` §23 passes an accepted watermark, MEDs an unrecorded one, and HIGHs footage nobody has accepted — the state that actually shipped unnoticed. `npm run film` restores the drawn scene in one command if that ever changes | ✅ |
| **A10** | You | The email swap, when deliverability is proven | `docs/58` T5's second half |

### P3 — The X stages that genuinely need P2

| # | Work | Needs |
| --- | --- | --- |
| **P3-1a** | ~~**X03 Experience Deconstruction**~~ | ✅ **Done 6 Sep — `docs/80`** §2–§3 |
| **P3-1b** | **X02 second half** — the measurable benchmark against the reference | Two `reference-probe.js` runs (B1) |
| **P3-2** | **X04 Reference-Driven Redesign** — preserve / borrow / adapt / improve / reject. **Unblocked, three proposals already tabled** by `docs/80` §6 | ~~P3-1~~ — can start |
| ~~**P3-3**~~ | ~~**X05 direction statement** in full~~ | ✅ **DONE 6 Sep — `docs/98`.** Current → Desired → Why → What changes → What stays. **Found on the way: the phone's first screen went 314KB → 418KB across two features and nothing measured it** — `docs/53` budgeted the video and nothing budgeted anything else. `qa.js` §29 now holds a 460KB first-screen budget and HIGHs a phone that requests the film |
| **P3-4** | **X06 structural remainder** — the four-block question | B5 + P3-2 |
| **P3-5** | **X07 systematic motion pass** | P3-2 |
| **P3-6** | **X10 comparative validation** | P3-2 **+ P3-1b** — comparison needs the numbers |

### P3.5 — The pre-launch pass, run early — `docs/92`

| # | | State |
| --- | --- | --- |
| ~~**L1**~~ | ~~THE DOMAIN~~ | ✅ **CONFIRMED 6 Sep — `zaokalyamamah.online` is correct and stays.** `docs/28` §C-5's open question, answered at last. Canonicals, sitemap, share tags and the Plausible key all already name it, so nothing changes. **The pre-launch pass has no blockers left** |
| ~~L2~~ | ~~Production headers verified~~ | ✅ All nine pages served with the real `.htaccess` headers: **0 CSP violations, 0 page errors**. Never tested before — every harness serves without headers |
| ~~L3~~ | ~~Structure, meta, weight, film behaviour~~ | ✅ 32 page/language/width combinations clean; meta complete; 404 `noindex` and out of the sitemap; phone first screen **314KB**; the film provably desktop-only and reduced-motion-aware |
| **L4** | The four post-upload checks — HTTPS/HSTS, the rewrite, Search Console, uptime. `docs/44` §2 | **Owner — first hour after upload** |

---

### P4 — Delivery

| # | Work |
| --- | --- |
| **P4-1** | Apply every finding from B3, B4, B5, B6 — each closes when *applied*, not when received |
| **P4-2** | **X11 World-Class Gate** |
| **P4-3** | Final handover pass — `docs/56` refreshed against whatever P1–P3 changed |

---

## 5. The dashboard — decided, 6 September 2026

**The trigger fired.** This section used to price three options against a
future decision; the owner has now made it: **a second person will run the
site, with full repository access.**

`docs/85` works it through. The short version:

| | |
| --- | --- |
| **Option chosen** | Option 0 extended — full repo access, **nothing new to build** |
| **AD-01** | **Survives.** No server, no auth of ours, no stored personal data |
| **Leads** | **Not built.** The enquiries already exist in WhatsApp and email — share those accounts rather than becoming the first place this site holds personal data |
| **Blocking prerequisite** | Verified from the API: **two branches, neither protected, and no `main`.** CI reports failures, it cannot prevent them. A default branch, protected, with `check` required — *before* the invitation goes out |

| # | Work | State |
| --- | --- | --- |
| **D1** | **Half done — `docs/85` §6.** `main` created at the verified head `7627b6d`; the old default was a strict ancestor (96 ahead, 0 behind) so nothing was lost, and CI already triggers on `pull_request` so a required check will actually fire. **Found on the way: the default branch was another session's working branch, and the repository has never had a single pull request.** What remains is two repository *settings* no tool here can reach — make `main` default, add the ruleset. `docs/85` §6.3 is the click path, ~3 minutes. **Re-verified 6 Sep evening: still not done** — `git ls-remote --symref` names the old working branch. **`main` was also 13 commits behind**, so protecting it would have guarded a build without either interactive feature; that is now [PR #1](https://github.com/mashhorfoods/test/pull/1), which additionally registers `check` in the status-check list. Sequence in `docs/85` §6.6 | **Owner — merge #1, then the two settings** |
| ~~**D2**~~ | ~~The operator runbook~~ | ✅ **DONE 6 Sep — `docs/89`.** Nine sections: the one bilingual rule, what to edit where, the browser-only data path CI rebuilds for you, what will bite you, how to read the harnesses (and the one LOW that is expected), what not to touch, and what to do when the live site looks wrong |

---

## 5a. The redesign block opened 6 September — `docs/84`

| # | Work | Blocked by |
| --- | --- | --- |
| ~~**R1**~~ | ~~Section-by-section redesign~~ | ✅ **DONE 6 Sep — `docs/88`.** How each section opens and closes, internal hierarchy, rhythm against neighbours, one CTA per surface. **Found on the way: a copy of the catalogue nobody had counted** |
| ~~**R2**~~ | ~~The way into Services & Pricing~~ | ✅ **DONE 6 Sep — `docs/87`.** 17.7 screenfuls past twelve packages with no service-level entry became a service index |
| ~~**R3**~~ | ~~The scroll-snap gallery~~ | ✅ **DONE 6 Sep — `docs/86`.** No JS required, no auto-advance, RTL for free, and never the hero — a carousel is the stranding pattern `docs/83` measured at 132 blocks |
| **R4** | Section **naming and order** — outcome-named vs feature-named, `docs/80` §3.1 | **B5** |
| **R5** | Five **regional** competitors probed — Pro Branding, Infinity Corp, Emirates Graphic, Prism Digital, Upscale Digital. All bilingual, which no reference has covered. `docs/70` benchmarked SaaS products, right for craft and wrong for market | **B1 probe runs** |
| ~~**R6**~~ | ~~What We Do~~ | ✅ **DONE 6 Sep — `docs/101`.** Four of five services said nothing until you clicked them; summaries now show closed. **Found on the way: a duplicated `@layer components {` that renested the utilities layer and put both languages in the orbit labels** — `qa.js` §29 |
| ~~**R7**~~ | ~~Two slideshows and a showreel~~ | ✅ **DONE 6 Sep — `docs/102`.** Ten-image work gallery, eight-image campaign gallery, video placeholder with a player, and the full functions/responsive/padding/UX test around them |
| ~~**R8**~~ | ~~Recent Work~~ | ✅ **DONE 6 Sep — `docs/103`.** Prose and a link became a four-tile bento of the real work, with a real `<h2>`. **Found on the way: five silent failures** — an undefined `--space-20` that voided padding in five places (`qa.js` §30), tiles sized from lazy images that laid out at 2px a row, an override that lost on source order and overflowed its column by 216px, white captions on white paper, and a page 40KB over budget |
| ~~**R9**~~ | ~~The Brand Challenge~~ | ✅ **DONE 6 Sep — `docs/104`.** A three-stage interaction that showed none of its stages: a step track, a two-column question, radio cards, attempt dots and a reward ladder. **Found on the way: the section lost its accessible name the moment the challenge started** — the labelled heading was inside the pane that gets hidden — plus a step track with no current step without JavaScript, and a legend that nearly stopped being the option group's name |
| ~~**R10**~~ | ~~All buttons~~ | ✅ **DONE 6 Sep — `docs/105`.** Control radius 4px → 8px as a token across all five control files, a square icon button, a press that composes with the lift, an unfilled disabled state and a ghost with an affordance. **Found on the way: in Arabic the CTA arrow un-mirrored itself on hover** — the nudge and `.u-flip-rtl` were fighting over `transform`. **And one overreach the guards reverted:** a 40px small button, which `docs/73` had already rejected |
| ~~**R11**~~ | ~~Header and navigation~~ | ✅ **DONE 6 Sep — `docs/106`.** Header CTA removed at the owner's instruction, Contact promoted into the nav, smart sticky (away on the way down, back on the way up), and a phone-only action that appears only where nothing else is pressable. **The removal cost 13 reach HIGHs across every page** — put to the owner, who chose the phone action over a bare header. **And one thing I tried and measurement refused:** a lower nav breakpoint, which overlaps the brand by 44px at 768px in English |
| ~~**R12**~~ | ~~All cards~~ | ✅ **DONE 7 Sep — `docs/107`.** Twenty-three card surfaces, four radii, seven grounds and a `.c-card` component used on no shipped page. One contract in the tokens; radii down to two. **Found on the way: the pricing card was the only card not raised off its own band** — it became a card only on hover, which a phone never gets. Plus a regression I made and caught (raising every tier erased the recommendation's third signal) and one pre-existing (the featured tier's accent border lost to `.c-tier:hover` on specificity) |
| ~~**R13**~~ | ~~Visitor audit + fixes 2-5~~ | ✅ **DONE 7 Sep — `docs/108`, `docs/109`.** First-time-visitor audit of the shipped site (verdict: MAYBE — every claim comes from the company itself), then four of its five fixes: the contact form's silent failure, who the site is for in the hero, the value proposition moved to section 2 plus a softer second CTA, and what happens after you make contact. **Fix 1 — one real client testimonial — is the owner's**, and so are a domain mailbox and a response time |
| ~~**R14**~~ | ~~The rest of the audit~~ | ✅ **DONE 7 Sep — `docs/110`.** Galleries merged, process moved above them, the duplicate closing banner removed, the challenge moved out of section 4, and a six-question FAQ answering what `docs/108` §14 said a buyer still wanted to know — every answer from copy already on the site. **Two left with the owner on purpose:** which prize mechanic to keep (deleting a commissioned feature is not a silent judgement), and which industries you serve (facts only they have) |
| ~~**R15**~~ | ~~Close out the visitor audit~~ | ✅ **DONE 7 Sep — `docs/112`.** Every `docs/108` item checked against the shipped build rather than against memory: 14 of 16 done. **The verdict does not move — it is still MAYBE — because the one item left is the one that decides it:** zero third-party proof. Re-verified on the live page that the five elements resembling social proof are a price-quote block and the word "Integrated". Also recorded honestly: phone scroll length did not improve, 27.5 → 27.6 screens |
| ~~**R16**~~ | ~~The two not-wins from `docs/112`~~ | ✅/🟠 **7 Sep — `docs/113`.** Phone scroll fixed: the three visual grids become horizontal snapping scrollers on phones, 27.6 → **25.8 screens**, desktop untouched. **Four silent failures on the way**, all measured — two placements that did nothing, a grid-height collapse that measured as a saving, and flex sizing on the wrong element — plus an axe `scrollable-region-focusable` and an empty `@media` defended by a comment describing CSS that was already gone. **The email cannot be fixed yet:** the owner chose `hello@` on the Pixora domain, and that domain is not registered (`docs/44` §1) |

**Note on this container:** WebSearch works; fetching any specific page does
not (`EGRESS_BLOCKED`, the network policy, not one domain). A competitive
review can be *sourced* here but never *verified* — `docs/84` §0.

---

## 5c. The competitive pass, and two queued additions — opened 6 September

### R5 extended: ten competitors, section by section, hero excluded

`docs/70` benchmarked SaaS products — right for craft, wrong for market. The
comparison the owner asked for is against **agencies in this market**, and the
hero is deliberately out of scope: it is already settled (`docs/53`,
`docs/80` §2.3) and it is the section where every agency site looks alike.
Everything after it is where the differences are.

The set, search-sourced 6 Sep (see §0 note below):

| | | |
| --- | --- | --- |
| 1 | **RAM** `ram.sa` | Riyadh — strategic branding, corporate identity |
| 2 | **PrezLab** `prezlab.com` | KSA — branding, bilingual by default |
| 3 | **Rabeez** `rabeez.com` | Riyadh — 12 years, enterprise and government |
| 4 | **Teryaq** `teryaq.media` | Jeddah — branding |
| 5 | **SRMG Labs** | Riyadh — backed by the region's largest media group |
| 6 | **Digital Gravity KSA** | Riyadh — web design, UI/UX, e-commerce |
| 7 | **Prism Digital** `prismdigital.ae` | Dubai |
| 8 | **Pro Branding** | Gulf |
| 9 | **Emirates Graphic** | UAE |
| 10 | **Upscale Digital** | Gulf |

**Our own row is measured — `docs/100` §3**, and it already found three things
before any competitor was seen: a section asking ten times in 1.5 screenfuls, the
longest section on the site offering one way out, and a 42-second section with no
call to action at all.

**Blocked on observation, not analysis.** `tools/reference-probe.js` now
reports, per section: order, height in screenfuls, padding rhythm, reading
cost in seconds, CTA count and labels, images, video, whether a slider is
present, and list density. One phone-width run per site produces the row.

> **§0, restated because it keeps mattering.** WebSearch works from this
> container; fetching any specific page returns `EGRESS_BLOCKED` — re-confirmed
> 6 Sep against `prismdigital.ae`. The names above are therefore *sourced* and
> not *verified*: nothing here has seen one of these sites. A comparison
> written without the probe runs would be an assertion wearing a table's
> clothes.

### Two additions, deliberately queued last

The owner asked for a slideshow and a video, **to be placed at the end of the
redesign process** rather than now. Recorded so they are not lost, with what
already exists noted so the ask is not accidentally satisfied twice:

| # | Work | Already on the site | State |
| --- | --- | --- | --- |
| **C1** | A slideshow somewhere new | `docs/86` — scroll-snap gallery, currently on `/story`. No JS required, no auto-advance, RTL for free | **Queued — after the redesign.** The component exists; the open question is *where a second one earns its place*, which the competitive pass should inform |
| **C2** | A video somewhere new | The hero showpiece — one budgeted clip, desktop only, phone gets a still (`docs/53`) | **Queued — after the redesign.** Any second video re-opens the weight question `docs/98` §5 just closed, so it needs a budget line before it needs a player |

**Neither starts before the redesign work above it is done** — that is the
owner's instruction and it is also the right order: both are placement
decisions, and placement is what the section pass and the buyer sessions are
for.

---

## 5b. Interactive marketing features — opened 6 September

Requested as briefs, not as roadmap items, and recorded here so they leave the
same way everything else does.

| # | Work | State |
| --- | --- | --- |
| ~~**F1**~~ | ~~Mystery Reward~~ | ⛔ **RETIRED 7 Sep — `docs/111`.** Built 6 Sep (`docs/96`), removed at the owner's instruction after `docs/108` found two prize mechanics on one page reading as a promo site. Section, script, stylesheet, JSON, generator and `qa.js` §26 all removed; the Brand Challenge is the mechanic that stayed |
| ~~**F2**~~ | ~~The Brand Challenge~~ | ✅ **DONE 6 Sep — `docs/97`.** Diagnostic quiz, two attempts, salted answer digest, weighted reward tiers. Surfaced and fixed a real keyboard-focus failure in three stylesheets; added `qa.js` §27 and §28 |
| **F3+** | Further interactive features | **Held at the owner's instruction** — *"Do not implement any additional interactive marketing features yet."* Nothing starts here without a new brief |

---

## 6. The rule for this file

Same as `docs/62`: an item leaves by being **done and verified** or
**explicitly cancelled with a reason**. Nothing leaves by being forgotten.

And one addition, learned from why this file had to be written:

> **A blocker is scoped to what it actually blocks.** X08 and X09 sat behind a
> recording they never needed. When something is marked blocked, the thing it
> blocks gets named — not the phase it happens to live in.
