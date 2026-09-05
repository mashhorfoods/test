# The remaining list

Written 5 September 2026. **This is the working list until the project is
finished.** Everything else in `docs/` is a record of a decision or a
measurement; this is the only file that says what is left.

Rule for this file: an item leaves it by being **done and verified**, or by
being **explicitly cancelled with a reason**. Nothing leaves it by being
forgotten, and nothing is added to it that is not real work.

---

## 1. Where the two workflows actually stand

**WEBSTART — 11 of 21 complete, 9 partial, 1 out of scope.** All three gates
held, and since 5 September **none of them is held on an open criterion**:
A3 closed the uptime monitor, which was the one unmet Gate 03 acceptance
criterion (`docs/46` §9). Every partial is waiting on a named person or a named
input; none is waiting on someone deciding what to do.

**Every catastrophic failure mode this project identified is now controlled.**
A1–A4 shut them in two days: the domain cannot be silently transferred or lapse,
GitHub is no longer the single copy, and the site cannot go down unnoticed.
Nothing remaining on this list is of that kind — which changes what "urgent"
means for everything below.

**WEBSTART X — 1 of 11 complete.** This is the honest number, and it is low for
one reason: X02 needs reference material this environment cannot fetch, and
X03 and X04 sit behind X02.

| | Stage | Status |
| --- | --- | --- |
| X01 | Baseline Audit | ✅ **Done** — `docs/55`. Every item on its own KEEP/IMPROVE/ADD list is now closed or explicitly withdrawn |
| X02 | Global Benchmark | ⛔ **Blocked.** Reference set named (`docs/52` §2), not analysed. Page fetches return `EGRESS_BLOCKED` — re-confirmed twice on 5 Sep |
| X03 | Experience Deconstruction | ⛔ Not started, behind X02 |
| X04 | Reference-Driven Redesign | ⛔ Not started, behind X03 |
| X05 | Redesign Direction | 🟡 **Partial.** The one decision that could be made without references was made and shipped — the showpiece budget, `docs/53`. The full direction statement needs X04 |
| X06 | High-Impact Upgrade | 🟡 **Partial.** Phone CTA regression, width parity, homepage proof, section banding, the hero and **Arabic heading leading** all shipped — the last of those was an RTL rule that had never fired, leaving the Arabic hero CTA below the fold on desktop (`docs/43` §12). Navigation, density and the four-block structural repetition need X03 |
| X07 | Interaction & Motion | 🟡 **Partial.** The hero film ships with reduced-motion guards. No systematic motion pass |
| X08 | Mobile Excellence | ❌ Not started. X01's phrase still holds: mobile is *verified*, not *designed* |
| X09 | Design System Refinement | ❌ Not started |
| X10 | Validation & Comparative Review | ❌ Not started — needs a baseline to compare against, which is X04 |
| X11 | World-Class Gate | ❌ Not started |

**One input unblocks four stages.** The PixVerse recording (or any replacement
reference material) turns X02 → X03 → X04 → X10 from blocked into work. It is
the single highest-leverage thing outstanding on either workflow.

---

## 2. The list

Ordered by what it costs to leave undone, not by effort.

### A — Owner, and nobody else can do these

> **§A is complete.** A1–A9 were done on 4–5 September. **A10 is the only item
> left, and it is deferred on purpose** — the domain email is not published
> until deliverability is proven, which is the owner's call and is recorded
> rather than drifted into.
>
> That has a consequence worth stating plainly: **nothing on this list is
> waiting on me, and nothing left is catastrophic.** What remains is §B — six
> items, every one of which needs a person who is not in this room — and §D,
> which is four WEBSTART X stages behind a single recording.

| # | Task | Why it is first | Time |
| --- | --- | --- | --- |
| ~~**A1**~~ | ~~2FA on the registrar, the host and GitHub, plus a registrar transfer lock.~~ **DONE 5 Sep 2026.** `docs/58` T1 updated — it had called this "the single most important unknown in this document" and it is no longer unknown | ✅ |
| ~~**A2**~~ | ~~A second git remote, pushed to alongside GitHub.~~ **DONE 5 Sep 2026.** `docs/57` §3 gap 1 closed | ✅ |
| ~~**A3**~~ | ~~UptimeRobot with a keyword check.~~ **DONE 5 Sep 2026 — and this closed the last unmet Gate 03 criterion.** `docs/46` §9: the gate is now a plain go, and the WEBSTART cycle is complete with no gate held on an open criterion | ✅ |
| ~~**A4**~~ | ~~Registrar auto-renew ON + a 30-day reminder.~~ **DONE 5 Sep 2026** | ✅ |
| ~~**A5**~~ | ~~Domain email, then SPF/DKIM/DMARC at the same moment.~~ **DONE 5 Sep 2026, and done that way round.** `docs/58` T5 and `docs/60` §3 updated | ✅ |
| ~~**A6**~~ | ~~Search Console: verify + submit the sitemap.~~ **DONE 5 Sep 2026 — P1-8 is now fully closed** | ✅ |
| ~~**A7**~~ | ~~Plausible: the four goals and custom properties.~~ **DONE 5 Sep 2026.** Phase 20 moves from *prepared* to *running*: the rulebook in `docs/45` has numbers to read for the first time. What is missing now is thirty days of them, which is a wait rather than a task | ✅ |
| ~~**A8**~~ | ~~The 15-minute device pass.~~ **RUN 5 Sep 2026**, nothing reported wrong — recorded as *run* rather than *verified*, because the rows were not noted individually and `docs/59` exists to stop untested things being quoted as tested. **`docs/59` §5a reduces what is left to two thirty-second checks** — the iPhone header blur and the Firefox focus ring, the two fixes made blind | ✅ |
| ~~**A9**~~ | ~~The four post-upload checks.~~ **RUN 5 Sep 2026**, nothing reported wrong. Same grade: good evidence `.htaccess` is being served, not a recorded pass of check 4. `docs/58` T6 updated, and names the five-minute way to turn the monthly reminder into an alarm | ✅ |
| **A10** | **Publish the domain email in place of the Gmail** — `navigation-map.js` plus the prose of Privacy, Terms and Accessibility in both languages, then `contact.email` in `site.config.json` | **Deliberately deferred 5 Sep 2026, owner's decision:** prove deliverability first. Until it lands, the site publishes a personal address while a protected domain one exists, which is the remaining half of `docs/58` T5 and keeps `docs/60` §3's table literally true. **`qa.js` now fails on a partial swap** — change the declared address and it names every page that still disagrees | 15 min, once you say go |

### B — Needs a third party

| # | Task | Waiting on |
| --- | --- | --- |
| **B1** | **The reference recording** — being recorded 5 Sep 2026. **`docs/64` says what to capture**: a steady full-page scroll at desktop *and* phone, plus ten seconds parked on the hero. Full-page screenshots are an acceptable substitute; a partial video is not. **Still missing and separate: one Arabic-first site you respect** (`docs/52` §3) — a URL is enough, and it is the most load-bearing gap in the set | You. **Unblocks X02, X03, X04 and X10** |
| **B2** | **Al Mada's result sentence + F1–F3 + their four deliverable images** | Al Mada. `docs/50`. Chapter 05 stays without a number until then, and `docs/57` §2 records the images as the one irreplaceable asset backed up nowhere |
| **B3** | **Native-speaker Arabic review.** **`docs/66` is the brief** — one hour, on a phone, in priority order by what a wrong word costs. **It found that `/terms` and `/accessibility` (1,170 Arabic words) were written after both review passes and have never been reviewed by anyone** — and one of them is a contract. For `/terms` the request is meaning-against-the-English, not register | An Arabic speaker. **Now also blocks B4's first question** (`docs/65` §2, which language governs) — that cannot be answered while nobody has checked whether the two versions disagree |
| **B4** | **A lawyer's read of the Terms.** **`docs/65` is the brief** — the questions, ranked, with the intent behind each clause stated so answering is quick rather than open-ended, and an explicit list of what *not* to review. **It found one gap on its own: the Terms exist in two languages with equal standing and nothing says which prevails** — and B3 has not run, so nobody has confirmed the two versions agree | A lawyer. Send them `docs/65` and the live `/terms` in both languages |
| **B5** | **Five moderated sessions with real buyers.** **`docs/68` is the brief.** `docs/33` §9's tasks and pass criteria were already good and are kept verbatim; what had never been written anywhere is **how to moderate one** — and the rule that decides whether it works is *do not help*, because being stuck is the finding. Also names the sixth thing to *watch* rather than ask: whether the four near-identical service blocks orient or exhaust, which is `docs/55` §6's largest unresolved question and one **five buyers can answer better than any reference site can** | Buyers. Two of the five should read Arabic — half the audience reads that way and none of it has been watched |
| **B6** | **A screen-reader pass by a person.** **`docs/67` is the brief.** Preparing it, the accessibility tree was dumped for every interactive element in both languages and read as a listener would hear it — **three defects found and fixed, all of which had passed every automated check** because each element *had* a name and the name was useless: `button "Copy"`, five identical `"See what it covers"` links, and `link "Website"`. The brief covers only what needs ears | Someone who uses one. VoiceOver on iPhone is the most representative for this market |

### C — The admin dashboard

**Back on the list by the owner's instruction, 5 September 2026.** It is
currently WEBSTART Phase 15 ⬛ and P1-5 CLOSED, both marked *under
reconsideration* since 4 September. It is not forgotten and it is not started.

**It is a decision before it is work,** and `docs/36` §4 already holds the four
questions that decide its shape. They have never been answered:

| # | Task |
| --- | --- |
| ~~**C1**~~ | ~~Answer the four questions in `docs/36` §4.~~ **DONE 5 Sep 2026 — `docs/63`.** Three answered from evidence, one needs you. Headline: **6 of 121 commits in this project's history were data-only, and all six were on one day.** The recommendation is Option 0 — GitHub's own editor is already a working dashboard, at zero cost and zero new attack surface — plus ~10 lines of CI |
| ~~**C1a**~~ | ~~Q1: is a second content editor coming?~~ **ANSWERED 5 Sep 2026: no — one person only.** |
| ~~**C1b**~~ | ~~Confirm or reject the recommendation.~~ **ANSWERED: Option 0.** GitHub's own editor is the dashboard. No login, no server, no new attack surface, AD-01 intact |
| ~~**C2**~~ | ~~Price the cheap version against the real one.~~ **Not needed** — C1b chose Option 0, which is cheaper than the cheap version because there is nothing to build |
| ~~**C3**~~ | ~~Scope a real dashboard.~~ **Not needed** under Option 0. `docs/36` §4's four triggers are still the route back, and `docs/63` maps each to the option it would move to |
| ~~**C4**~~ | ~~CI must build *and commit* `dist/` for data-only commits.~~ **DONE 5 Sep 2026** — and tested end to end on the live branch, not reasoned about: a price edited and pushed with no local build, CI classified it data-only, ran all three harnesses, rebuilt and committed `dist/` back, then did it again on the revert. `pixora-site.zip` is now attached to every run so the archive is reachable without a terminal |

**§C is closed.** The admin dashboard exists: it is GitHub's editor plus this
workflow. What would reopen it is unchanged and written down — `docs/36` §4's
four triggers, each mapped in `docs/63` to the option it would move to.

**What it costs, stated plainly so the decision is made with it in view.** A
real dashboard ends AD-01, the zero-backend decision that most of this
project's security posture rests on:

- `docs/58` §3 — a table of attack surfaces that do not exist *because* there
  is no server — stops being true. §7 says to rewrite the threat model that
  day, and means it.
- `docs/57` §8 says the same about the backup plan.
- AD-01 and AD-09 in `docs/61` each name this as their reversal trigger.
- Static hosting cannot run it. This is the item that starts a hosting bill.

None of that is an argument against it. It is the price, and C1–C3 exist so
the price is paid knowingly rather than discovered afterwards.

### D — Mine, once B1 arrives

| # | Task |
| --- | --- |
| **D1** | **X02 Global Benchmark** — analyse the reference material for transferable strengths. **Method and measurements defined in advance: `docs/64`.** The same table X01 produced for Pixora, produced for the reference, so X03 compares like with like rather than impressions |
| **D2** | **X03 Experience Deconstruction** — why each reference works, and what transfers to a bilingual RTL site. `docs/52` §3 already names the gap: no reference in the set is Arabic |
| **D3** | **X04 Reference-Driven Redesign** — preserve / borrow / adapt / improve / reject, against the guardrails |
| **D4** | **X05 direction statement** — Current → Desired → Why → What changes → What stays |
| **D5** | **X06 remainder** — navigation, density, and the four-service-block structural repetition. `docs/55` §6 names the three real options and why guessing between them is forbidden |
| **D6** | **X07 motion pass**, **X08 mobile-as-designed**, **X09 design-system refinement** |
| **D7** | **X10 comparative validation**, then **X11 World-Class Gate** |

### E — Mine, not blocked, but genuinely optional

Listed so they are choices rather than surprises. **None of these is worth
doing before A1–A4.**

| # | Task |
| --- | --- |
| **E1** | A second case study — opens `/work`, and turns the homepage's one proof sentence into a list. `docs/56` §5 calls it the outstanding item most worth paying for |
| **E2** | Per-service inner pages, once the IA justifies them |
| ~~**E3**~~ | ~~Social/ads ladder — the top tier sits below the market floor.~~ **CHECKED 5 Sep 2026, no change needed — `docs/29` §13.** §11 had compared against one band while the same source published a tiered ladder; against that, and against Egypt (which neither benchmark had), all three social tiers land inside published bands in both markets. §11 corrected in place. **What survives is a product question, not a price one:** there is nothing above $650/month, so the Saudi standard band and the top of the Egyptian one have no Pixora product. Optional, and not urgent — a tier nobody has asked for is a worse use of a week than anything in §A |
| **E4** | Split-bundle option for repeat visits, alongside the single file (`docs/61` AD-06's revisit trigger) |
| **E5** | An FAQ section, if the sales conversation turns out to repeat questions |

---

## 3. What is deliberately NOT on this list

- **A staging environment.** Decided against, with reasons — `docs/61` AD-08.
- **Error tracking.** Decided against — `docs/61` AD-09.
- **A CMS, a client portal, bookings, checkout, A/B infrastructure, a blog.**
  `docs/27` P3. Each would be a new engagement, not a remaining task.
- **Cross-engine automated testing.** Not possible here — the network policy
  refuses Playwright's WebKit and Firefox downloads. A8 is the answer instead.

---

## 4. The shortest path to "finished"

If the goal is to close both workflows rather than to keep improving:

1. **A1 → A4.** Forty minutes, and it removes every catastrophic failure mode
   the project has. Do these before anything else on any list.
2. **B1.** One recording. It converts four X-stages from blocked to workable
   and is the only thing standing between this project and a complete
   WEBSTART X.
3. ~~**A5 → A7.**~~ **Done 5 Sep 2026.** Remaining in §A: **A8** (the device
   pass), **A9** (the post-upload checks, next time you upload) and **A10** (the
   email swap, when deliverability is proven). Plus **B2** — Al Mada, still the
   only irreplaceable asset backed up nowhere.
4. **D1 → D7**, in order, as B1 allows.
5. ~~**C1a → C1b**, the dashboard conversation.~~ **Done 5 September 2026.**
   Option 0, one editor. §C is closed and nothing in it is outstanding.

**B3, B4, B5 and B6 run in parallel with all of it** and need no code from
anyone. They are also the four that find the class of defect no harness on this
project can — a heading that lies, Arabic that reads like a translation, a term
a lawyer would strike, a page that makes no sense read aloud.
