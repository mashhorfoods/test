# 127 — The three decisions, locked

**8 September 2026.** The owner settled the three questions `docs/126` §8 left
open, and asked for the same treatment: encoded, not documented, then audited.

---

## 0 — One correction, made rather than asked about

The instruction opened:

> The current prices are: **Pro = 400/month, Growth = 650/month.** Keep these
> prices.

`pricing.json` held the reverse — Growth at 400, Pro at 650. But the *end state*
the instruction described is unambiguous, and it repeats it four ways: Growth is
the higher tier; Pro < Growth in price, scope, depth and coverage. So that is
what was built. The published cards now read **Social Pro 400** and **Social
Growth 650**.

**What moved was the price and the contents; the id and the name stayed
together.** The alternative — renaming the packages — would have left the id
`soc-pro` permanently meaning the Growth tier, and every join in this catalogue
misleading every future reader. `soc-pro` is Social Pro, at 400, carrying the
core layer. `soc-growth` is Social Growth, at 650, carrying everything in Pro
plus the deep layer.

The "Most Popular" ribbon moved with the middle tier, and the three packages are
published in price order.

---

## 1 — Social Media: Pro < Growth

| | Price | Research | Strategy | The layer above |
| --- | --- | --- | --- | --- |
| Starter | 250 | hashtag @ **basic** | — | — |
| **Pro** | **400** | hashtag & keyword @ **core** | content strategy @ **core** | — |
| **Growth** | **650** | hashtag & keyword @ **core** | content strategy @ **complete** | audience & market research · growth analysis · performance optimisation · monthly strategy review |

Ten features in Pro, fifteen in Growth. **No feature is defined twice**: where
Pro and Growth buy the same capability at different depths, they reference one
canonical feature and name the level. The ladder rule enforces the direction —
a dearer package may not contain less, fewer, or shallower than a cheaper one.

> Negative-tested by putting Growth back below Pro: *"soc-pro (400) sells
> feat.social.content_strategy at "core" while soc-growth (300) sells it at
> "complete""* — build refused.

---

## 2 — The landing page, in parts and whole

| | Price | Workflow | Automation | Needs |
| --- | --- | --- | --- | --- |
| Landing page design | **50** | `wf.design_concept` | assist | — |
| Landing page development | **50** | `wf.build` | partial | design |
| Landing page deployment | **20** | `wf.release` | full | development |
| **Complete landing page** | **120** | `wf.composite` | partial | — |

**The parts sum exactly to the bundle**, so the complete page is a naming and
workflow convenience rather than a discount. A new rule refuses the one
direction that would be a defect: **a bundle may never cost more than its
parts.**

### No double charging, in both directions

- Choose the **complete page** → its three parts come with it, marked *Included
  in Additional landing page*, charged once at 120.
- Choose **all three parts** → the builder recognises the complete scope, folds
  them into it, and charges 120 once. The scope reads *Additional landing page*
  rather than three fragments that happen to add up.
- Choose **design alone** → design alone. The dependency runs upward, so
  development pulls design in and design pulls nothing.

`wf.composite` generates its stages from the parts, in order, each delegating to
that part's own materialised workflow. **Nothing is written twice**, and the
materialised composite now reports every pipeline stage it spans:
`pipe.websites.design → pipe.websites.build → pipe.websites.launch`.

---

## 3 — Page allowance

| | Pages included |
| --- | --- |
| Landing Page | 1 |
| **Business Website** | **up to 5** |
| **Professional Website** | **up to 10** |

Design and development cover the first page; **every page beyond it is
`feat.websites.extra_page`, the add-on the studio already publishes at 70.** No
new pricing model was invented, because one already existed.

Each package carries `scope.pages` — the machine-readable fact — and an
`extra_page` row that prices the same fact. **A rule refuses a package where the
two disagree**, and refuses a package that builds pages and does not say how
many.

> Negative-tested twice: removing Business's allowance — *"builds pages and does
> not say how many"* — and setting Professional's to 25 while pricing 9 —
> *"includes 25 page(s), so 24 beyond the first, and prices 9"*.

### And the builder stopped pricing a 2-page site like a 10-page one

The package comparison is **quantity-aware and depth-aware** now. A scope with
four additional pages is covered by Business Website; a scope with twenty is
not, and the builder says so by staying silent rather than naming a package that
does not cover it. Both directions are asserted by the functional test.

---

## 4 — What the audit found this time

**A stale journey.** `validate.js` flow A carried `400 USD` as a literal and
failed the moment the hierarchy changed — **the site was right and the test was
wrong**, the fourth time on this project. It reads the package it walks to from
`pricing.json` now, so it cannot go stale on the day it most needs to be right.

**Twenty-three features whose approval flag contradicted their own workflow.**
The agent-readiness review asked, of nine things the studio sells, *what
requires human approval?* — and got one answer from the feature and a different
one from its workflow, in twenty-three places. Nineteen features gained the flag
their workflow already implied; two lost a flag their workflow never supported;
and the two monthly reviews — which genuinely are approvals the `wf.report`
template does not model — **declare an approval point** rather than asserting one
through a flag alone. A rule now refuses any disagreement.

**A workflow that could not say when it runs.** An agent holding one had to
search five pipelines to place it. Every materialised workflow now carries its
`pipeline` and `pipeline_stages`.

---

## 5 — The audit, item by item

| Checked | |
| --- | --- |
| Pro = 400 | ✅ |
| Growth = 650 | ✅ |
| Growth > Pro in price and scope | ✅ 10 features vs 15, enforced by the ladder rule |
| Research in Pro | ✅ hashtag & keyword @ core |
| Growth's deeper research, strategy, optimisation | ✅ four capabilities above Pro |
| Landing page design 50 · development 50 · deployment 20 | ✅ |
| Complete landing page 120 | ✅ and ≤ the sum of its parts, by rule |
| Business ≤ 5 pages · Professional ≤ 10 | ✅ `scope.pages`, cross-checked against what is priced |
| Additional Website Page remains the add-on | ✅ unchanged at 70 |
| No double charging | ✅ both directions, asserted by `builder-test.cjs` |
| No duplicated feature definitions | ✅ 70 features; four tiered rather than eleven separate |
| Dependencies respected | ✅ 67 requires, 8 supersedes, acyclic, symmetric conflicts |
| Builder reflects the rules | ✅ 54 assertions |
| EN/AR synchronised | ✅ `arabic.js` 0, `qa.js` §39 0 |
| Pricing centralised | ✅ `pricing.json` for what is sold, catalogue for what it is made of |
| Internal ids stable | ✅ no id changed |

---

## 6 — The agent review, item by item

For each of the nine, answered from `catalogue/catalogue.json` **alone** — no
page, no prose, no human:

| | Included | Inputs | Workflow | Deps | Deliverables | QA | Approval | Completion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Social Media Pro | 10 features | 25 | `pipe.social`, 39 stages | 3 | 14 | 32 | 8 features | ✅ |
| Social Media Growth | 15 features | 40 | `pipe.social`, 58 stages | 5 | 23 | 48 | 12 features | ✅ |
| Landing Page Design | itself | 4 | `wf.design_concept`, 5 stages | — | 2 | 4 | yes | ✅ |
| Landing Page Development | itself | 4 | `wf.build`, 4 stages | design | 2 | 5 | yes | ✅ |
| Landing Page Deployment | itself | 3 | `wf.release`, 3 stages | development | 3 | 4 | yes | ✅ |
| Complete Landing Page | its 3 parts | 11 | `wf.composite`, 3 delegating stages | — | 7 | 13 | yes | ✅ |
| Business Website | 9 features, 5 pages | 24 | `pipe.websites`, 36 stages | 4 | 20 | 33 | 9 features | ✅ |
| Professional Website | 11 features, 10 pages | 30 | `pipe.websites`, 43 stages | 6 | 23 | 40 | 11 features | ✅ |
| Additional Website Page | itself | 3 | `wf.build`, 4 stages | development | 1 | 3 | yes | ✅ |

**No gaps.** Every one of the ten questions — what was purchased, what is
included, what is optional, what inputs are required, what workflow to execute,
what dependencies exist, what deliverables are expected, what QA is required,
what requires human approval, what constitutes completion — is answerable from
the file.

What the file still cannot supply is the client's material, the studio's
accounts, and judgement. That is what `automationPotential: none` is for, and
five features carry it.

---

## 7 — Nothing outstanding

There is no question in this document waiting on an answer. The three the owner
settled are closed; `docs/126` §8 is answered in full.
