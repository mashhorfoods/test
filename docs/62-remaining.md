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
held. Every partial is waiting on a named person or a named input; none is
waiting on someone deciding what to do.

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
| X06 | High-Impact Upgrade | 🟡 **Partial.** Phone CTA regression, width parity, homepage proof, section banding and the hero all shipped. Navigation, density and the four-block structural repetition need X03 |
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

| # | Task | Why it is first | Time |
| --- | --- | --- | --- |
| **A1** | **2FA on the registrar, the host and GitHub, plus a registrar transfer lock** | `docs/58` T1. The only item on this whole list whose downside is losing the domain permanently | 20 min |
| **A2** | **A second git remote** (GitLab/Bitbucket/Codeberg), pushed to alongside GitHub | `docs/57` §4. Today, losing the GitHub account loses the project — 29MB of source and every recorded decision. The deployed site survives; the ability to change it does not | 10 min |
| **A3** | **UptimeRobot with a keyword check** on `One Partner` | `docs/57` §5. **The last unmet Gate 03 criterion.** Every failure this site has actually had would have returned HTTP 200 | 5 min |
| **A4** | **Registrar auto-renew ON + a 30-day calendar reminder** | The most expensive failure and the one most often discovered by a customer | 5 min |
| **A5** | **Domain email**, then SPF/DKIM/DMARC published *at the same moment* | `docs/60` §3 and `docs/58` T5. This is the first move on the identity gap, and it is worth more than incorporation | 1 hr |
| **A6** | **Search Console: verify + submit the sitemap** | `docs/27` P1-8's last open item | 15 min |
| **A7** | **Plausible: create the four goals and custom properties** | `docs/45`. Until this exists Phase 20 cannot start and no KPI has a number | 20 min |
| **A8** | **The 15-minute device pass** in `docs/59` §5 | Two real cross-engine defects were fixed blind. Nobody has confirmed the fixes on an actual iPhone | 15 min |
| **A9** | **The four post-upload checks** in `docs/44` §2, after the next upload | `.htaccess` correctness is now checked; `.htaccess` being *served* still is not | 10 min |

### B — Needs a third party

| # | Task | Waiting on |
| --- | --- | --- |
| **B1** | **The PixVerse recording** — or any replacement reference material | You. **Unblocks X02, X03, X04 and X10** |
| **B2** | **Al Mada's result sentence + F1–F3 + their four deliverable images** | Al Mada. `docs/50`. Chapter 05 stays without a number until then, and `docs/57` §2 records the images as the one irreplaceable asset backed up nowhere |
| **B3** | **Native-speaker Arabic review** for register and terminology | An Arabic speaker. The harnesses prove the Arabic *exists*; they cannot tell you it reads like a translation |
| **B4** | **A lawyer's read of the Terms**, especially cancellation | A lawyer |
| **B5** | **Five moderated sessions with real buyers** | Buyers. `docs/33` §9 has the script. The accepted risk from Gate 02 that was never retired |
| **B6** | **A screen-reader pass by a person** | Someone who uses one. `/accessibility` publicly says this has not been done |

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
| **D1** | **X02 Global Benchmark** — analyse the reference material for transferable strengths |
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
| **E3** | Social/ads ladder: `docs/29` §11 found the top tier still sits below the bottom of the market's basic band, so no tier suits a buyer with a real budget. One question, then possibly one field each |
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
3. **A5 → A9, and B2.** The items that turn measurements into numbers and
   claims into confirmations.
4. **D1 → D7**, in order, as B1 allows.
5. ~~**C1a → C1b**, the dashboard conversation.~~ **Done 5 September 2026.**
   Option 0, one editor. §C is closed and nothing in it is outstanding.

**B3, B4, B5 and B6 run in parallel with all of it** and need no code from
anyone. They are also the four that find the class of defect no harness on this
project can — a heading that lies, Arabic that reads like a translation, a term
a lawyer would strike, a page that makes no sense read aloud.
