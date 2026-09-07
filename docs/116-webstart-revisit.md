# WEBSTART revisited — where this actually stands, from launch

**7 September 2026.** The owner asked for the WEBSTART list to be re-walked
against reality rather than quoted. It was, all 21 phases, and the headline is
not what the documents said:

> **The site launched on 4 September. The WEBSTART cycle is complete — 21 of
> 21 phases, three of three gates, none held on an open criterion.** What
> remains is a wait, four human reviews, and one address.

Eight rows of `docs/27` had gone stale, **every one of them understating where
the project is.** That is worth as much attention as the status itself: a
checklist that is wrong in the pessimistic direction still misdirects work.

---

## 1. The row that mattered

`docs/27` phase **19 Launch & handover** read 🟡 PARTIAL, with:

> *"The four live checks remain unrun: this environment is blocked from both
> `zaokalyamamah.online` and `mashhorfoods.github.io`. HSTS, Search Console,
> the uptime check and a first analytics event all wait on them."*

**They were run on 4 September and they passed.** The proof is not a claim, it
is a build artefact:

```json
"hsts": true
```

`site.config.json`'s own comment states the rule that field lives under —
*"`hsts` STAYS FALSE until check 4 in docs/44-launch.md §2 shows the live site
sending the headers."* HSTS being on is only possible if check 4 passed. Then
`docs/62` A9 records the four checks re-run on 5 September, and A3/A6/A7 record
the three things that were said to be waiting on them closing the same day.

So the project has been describing itself as pre-launch for three days while
shipping post-launch work. **This environment cannot reach the domain, and it
never will** — the egress policy blocks it. That is a permanent condition of
the container, not a pending task, and treating it as one is what kept the row
red.

---

## 2. The 21 phases, as of today

**18 complete · 2 partial-by-design · 1 running on a clock.**

| | Phase | State |
| --- | --- | --- |
| 00 | WEBSTART brand → product | ✅ |
| 01 | Discovery & business analysis | 🟡 **owner** — nine decisions (C-1…C-9) |
| 02 | Competitive intelligence | 🟡 **owner** — re-priced and re-benchmarked; live UI comparison needs B1 |
| 03 | Problem → insight → solution | ✅ *(signed off at Gate 01)* |
| 04 | Strategy & KPIs | ✅ instrumented — the KPIs need Phase 20's data, which is Phase 20's job |
| 05 | Content & IA | ✅ |
| 06 | Technical discovery & data architecture | ✅ |
| 07 | UX wireframes | ✅ |
| 08 | Master prompt | ✅ |
| 09 | Design system | ✅ |
| 10 | Homepage design | ✅ **as a build.** FAQ shipped, hero says who it serves, value proposition at section 2, seven real photographs. The two open items are a second case study and B5 |
| 11 | Inner pages & flows | ✅ **eight public pages**, not the six this row was written against |
| 12 | Prototype & validation | 🟡 **B5** — logic validated four ways; comprehension untested |
| 13 | Responsive & accessibility | ✅ + **B3, B6** |
| 14 | Development architecture | ✅ |
| 15 | Admin dashboard | ✅ **BUILT 7 Sep** — `docs/120`, `docs/121`. This row read "decided, not deferred — Option 0" when written this morning; the owner asked for a dashboard the same afternoon and Option 1 was built, no server, AD-01 intact |
| 16 | Security / secure SDLC | ✅ |
| 17 | Development | ✅ |
| 18 | QA & release readiness | ✅ **five harnesses** — `arabic.js` was added 7 Sep, after this row said four |
| 19 | Launch & handover | ✅ **DONE 4 Sep** — §1 above |
| 20 | Post-launch optimization | 🟡 **RUNNING.** Instrumented 5 Sep; the first monthly review falls due ~5 Oct |

Phases 01 and 02 are partial on **owner answers**, not on work. Phase 12 is
partial on **five buyers**. Phase 20 is partial on **twenty-eight more days**.

### The gates

| | Held | State |
| --- | --- | --- |
| Gate 01 | Structural sign-off | ✅ |
| Gate 02 | Build sign-off | ✅ |
| Gate 03 | Release go/no-go | ✅ **held 4 Sep on a condition; a plain go from 5 Sep** when A3 closed the last unmet criterion (`docs/46` §9) |

---

## 3. What "delivered" means, measured

| | |
| --- | --- |
| Public pages shipped | **8** — home, pricing, about, story, privacy, terms, accessibility, 404 |
| Languages | 2, full RTL, every string paired |
| Upload artefact | `pixora-site.zip`, **3.2MB**, rebuilt by one command |
| Homepage over the wire | 405KB raw · **87KB gzipped** |
| First screen | **444KB of a 480KB budget** |
| Images | **40, none missing width or height** |
| Runtime dependencies | **0** |
| Harnesses, run on every push | **5** — validate · qa (**33** sections) · responsive · **arabic** · a11y |
| Current result | 0 · 0 high 0 medium (1 known low) · 0 over 48 combinations · 0 · 0 axe violations |
| Catastrophic failure modes controlled | **all of them** — transfer lock, auto-renew, second remote, uptime alarm |

**The site is live, monitored, backed up, legally papered and instrumented.**
There is no engineering task standing between the current build and a visitor.

> **Four numbers in this section went stale within nine hours of being
> written** — the harness count, the qa section count, phase 15 and phase 18 —
> because `arabic.js` and the dashboard both landed the same afternoon.
> Corrected above, and noted rather than silently patched: this document's own
> §1 is about a checklist that misdirected work for three days by being stale,
> and it would be a poor advertisement for the point if it were quietly wrong
> about itself.

---

## 4. What is actually left — five things, and only one is ours

### 🔴 One, and it decides the verdict

**A named client willing to be quoted.** `docs/108` graded the site 🟡 MAYBE
for one reason: every claim on it comes from the company itself. `docs/112`
and `docs/114` re-checked and left it there. Seven photographs of our own work
are still our own word about our own work.

This is not a design problem and no amount of building fixes it. **One
sentence from one real client, with their name on it**, moves the site from
*maybe* to *yes*. It is the highest-value outstanding item in the project by a
wide margin, and it costs an email.

### 🟠 Four human reviews, briefed and waiting

Each has a written brief; none needs anything from us first.

**All four now have a send-ready pack — 7 September, `docs/119`.** Send the
right-hand column; the middle column is the internal reasoning and does not go
out.

| | Who | Send this | Internal | Why it matters here |
| --- | --- | --- | --- | --- |
| **B3** | An Arabic speaker | **`docs/91`** | `docs/66` | `/terms` and `/accessibility` were written after both review passes and **have never been read by anyone** — and **118 more Arabic strings** have been added since the pack was first written |
| **B4** | A lawyer | **`docs/90`** | `docs/65` | The Terms exist in two languages with equal standing and **nothing says which prevails** — and one clause now says of itself that it is not final |
| **B5** | Five buyers | **`docs/118`** | `docs/68` | Unblocks Phase 12, X06 and X10. Two of the five should read Arabic |
| **B6** | A screen-reader user | **`docs/117`** | `docs/67` | Preparing the briefs found **five** defects that passed every automated check, two of them on 7 September |

### 🟡 One that is a clock, not a task

**Phase 20.** Instrumented 5 September; the rulebook in `docs/45` is written
and waiting. **~28 days to the first monthly review.** Nothing to do.

### 🟡 One that is blocked on a purchase

**A10 — the business email.** The owner chose `hello@` on the Pixora domain.
**That domain is not registered** (`docs/44` §1 lists `pixora.net` "or
similar — not yet registered"), so the order is: register → create the mailbox
→ confirm it receives → then it is one field in `site.config.json` and a
rebuild. `qa` §19 then names every page that still disagrees.

Publishing an address before its mailbox exists loses real enquiries, which is
why the Gmail is still there and why that is the right call until the domain is
bought.

### ⚪ And the repository housekeeping

PR #1 is green, conflict-free and unmerged. Merge it, make `main` default,
**then** add the ruleset — that order, because a ruleset targeting *Default
branch* guards whatever the default currently is.

---

## 5. WEBSTART X, for completeness

A different workflow and a different count: **7 of 11 complete, 2 partial, 2
blocked** — `docs/99`, re-traced today. All four unfinished stages wait on
B1 (a reference recording and one Arabic-first site) or B5. Twelve documents
landed since that count was taken and **none of them moves it**, which is
recorded there explicitly so the next reader does not have to work it out.

---

## 6. The honest summary

**Delivery is done. The remaining work is other people's.**

- Nothing on the critical path is an engineering task.
- Four reviews are briefed and could all start today.
- One clock is running and needs nothing.
- One purchase unblocks the email.
- **One email to one past client is worth more than everything else on this
  list combined**, because it is the only item that changes what a stranger
  concludes about the business in the first ten seconds.

The thing to guard against now is the failure mode this revisit found: **a
list that goes stale in the pessimistic direction.** Phase 19 sat red for
three days after it was green, and work continued as though launch were
pending. `docs/27` and `docs/44` are amended inline with dates; this document
is the consolidated picture; `docs/99` holds the X count. Three places, each
naming what it owns.
