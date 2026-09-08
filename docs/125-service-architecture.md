# 125 — The service architecture

**8 September 2026.** `docs/124` counted what was there and found a site that
sells five services, holds data for four, describes 164 capabilities in strings
nothing can join on, and contradicts itself on two published cards. This is
what was built in answer.

The brief that commissioned it asked for two things at once, and they pull
against each other:

> enough structure that an automation, a CRM, a quotation generator or
> eventually an agent could take a selected scope and know what to do with it

> a visitor who never meets a workflow id, an internal status, a technical
> schema or a word of agent terminology

Almost every decision below follows from holding both.

---

## 1 — The shape

```
src/data/catalogue/              AUTHORED. The whole truth. Never shipped whole.
  services.json                  5 services, each with its execution pipeline
  features.branding.json         24 features
  features.websites.json         12
  features.social.json           15
  features.marketing.json        17
  addon-groups.json              the 5 headings add-ons publish under
  workflows.json                 16 workflow templates
        │
        │  tools/build-catalogue.js — validates, then emits two things
        │
        ├──→ catalogue/catalogue.json          GENERATED. Services, pipelines,
        │                                      68 features, and 68 MATERIALISED
        │                                      workflows. The machine-readable
        │                                      export. No build reads
        │                                      catalogue/, so nothing here can
        │                                      reach dist/ or a visitor.
        │
        └──→ catalogue/catalogue.public.json   GENERATED. The projection a
                                               visitor may see: labels,
                                               descriptions, pricing,
                                               dependencies. Built by ALLOWLIST.
                                                    │
                    tools/build-builder.js ─────────┘
                      ├──→ index.html          the add-ons section
                      └──→ src/pages/pricing.html   the package builder
```

`src/data/pricing.json` keeps its four categories, twelve packages and twelve
prices exactly as they were. It gained one field — a `ref` per feature row —
and lost nothing. The markup it generates was byte-for-byte identical after
the change; a test confirmed it before anything else was touched.

---

## 2 — Part 01: the custom package builder

Lives at **`/pricing#build`**, under the twelve packages it is an alternative
to, reachable from the service index at the top of that page and from a text
link under the add-ons on the homepage.

**Not a new page.** A sixth page would have meant a navigation entry, a
sitemap row, a `.htaccess` rewrite, four harness page lists and a footer link —
six places to get wrong, for a thing whose whole argument is *"none of these
twelve fit you."* That argument only lands where the twelve are.

### What a visitor does

Five services, disclosed. Open one and every feature it is made of is there:
what it is, what it is for, and what it costs. Tick what you need. The scope
panel beside you keeps a running estimate — **one-time and monthly kept apart,
because adding them together would be a number that means nothing** — and
anything that cannot honestly be priced is counted, not guessed at.

The five ways a thing can be charged are distinguishable on sight, because the
brief asked they be:

| | What it means | Example |
| --- | --- | --- |
| **Included** | Part of the service, no separate charge | Testing, deployment, handover |
| **From … USD** | A fixed starting price | Logo design, from 250 |
| **From … per unit** | Priced per item, with a stepper | Post design, from 15 per post |
| **From … per month** | Recurring | Community management, from 120 |
| **Custom quote** | Cannot be priced without talking | Photography, videography |

A quote-priced row prints **no figure at all**. That is the brief's own
instruction and it is enforced twice: `build-catalogue.js` fails the build if a
`quote` feature carries a price, and `qa.js` §37 fails the site if one reaches
a page still printing a digit.

### It cannot assemble a scope nobody could execute

Four relationships, all data, all on the row in the markup — **63 `requires`
edges, 48 `recommends`, 8 `supersedes` and, today, 0 `conflicts`**:

- **requires** — pulled in automatically, transitively, and the row says why:
  *"Added — Website development needs it."* Dropping the requirement drops
  what needed it, so you cannot keep "Deployment" after removing the site it
  would deploy.
- **supersedes** — one-directional. Complete brand guidelines do not clash
  with the short ones; they **replace** them. The superseded row is disabled
  and says *"Replaced by Complete brand guidelines"* rather than vanishing —
  a row that disappears as you tick is a row you cannot find again.
- **conflicts** — symmetric, and validated to be symmetric. A one-sided
  conflict is a rule that fires when you pick A then B and stays silent when
  you pick B then A. **There are none in the catalogue today.** The field and
  its checks stay, because the day someone adds a pair that genuinely cannot
  be sold together, the rule that stops them will already exist and already be
  tested.
- **recommends** — never enforced. One line in the scope panel:
  *"Often taken with …"*.

`supersedes` exists because modelling those pairs as conflicts was wrong, and
the validator proved it: the Advanced branding package legitimately contains
both the short guidelines it carries from Professional and the complete ones
that replace them, and a symmetric conflict called that an impossible scope.
The distinction is now in the data, and the same check that found the mistake
now guards it.

### All five services ship closed, and that is a measurement

The add-ons section opens its first group so a visitor lands on real prices
rather than five shut doors, and the same instinct opened Branding here. That
is twenty-four features — **four screenfuls on a phone, in front of the other
four services.**

Measured at 390px: the builder ran **6.2 screens** with Branding open and
**1.4** with everything closed, and `/pricing` as a whole went from 24.9
screens to 20.1. The point of this surface is choosing a *service* first;
burying four of them under the first one's feature list is the same mistake
`/pricing` itself was built to fix (`docs/84` §2.1). The scope panel carries
the instruction instead, and on a phone it sits above the list rather than
below it — a running estimate a visitor cannot see while they tick is not a
running estimate.

### It works with JavaScript off

The page carries every service, every feature, every description and every
price in the markup, in both languages, disclosed behind native `<details>`.
JavaScript adds three things and nothing else: the arithmetic, the dependency
enforcement, and the message. With `builder.js` absent the page is still a
complete, readable, crawlable price list, and a `<noscript>` says so.

### And it does not overengineer the visitor's side

No workflow id, no stage, no execution step, no tool list, no quality check, no
effort estimate, no automation rating and no internal status appears anywhere
in the shipped bytes. `qa.js` §38 checks the built pages for ten such tokens
and fails on any of them.

Feature ids **do** ship, on `data-feature`. That is deliberate: an id is the
join a CRM or an agent needs, it is invisible on the page, and it says nothing
about how the work is done. A workflow id says how; that is the line.

---

## 3 — Part 02: every service as an operating system

### Pipelines

Each service has an ordered pipeline, and every feature belongs to exactly one
stage of it — validated, because a feature in no stage is one nothing can
schedule and a feature in two is one two people will each assume the other did.

| Service | Pipeline |
| --- | --- |
| Branding & Design | Discover → Core identity → System → Apply → Capture → Handover |
| Websites | Plan → Infrastructure → Design → Build → Verify → Launch |
| Social Media Management | Onboard *(once)* → Plan → Produce → Publish → Engage → Report **↺** |
| Digital Marketing | Access *(once)* → Strategy → Produce → Instrument → Launch → Optimise → Report **↺** |
| Integrated Digital Solutions | delegates to the four above, in dependency order |

Social and Marketing are **loops, not lines**: the report closes the month and
its decisions open the next one. Integrated has no pipeline of its own and does
not pretend to — a composition with a hidden sixth workflow would be a fifth
service wearing a bundle's clothes.

### Features

Sixty-eight, each carrying the schema the brief specified: `id`, `service`,
`name`, `description`, `purpose`, `category`, `inputs`, `dependencies`,
`workflow`, `executionSteps`, `tools`, `outputs`, `deliverables`,
`qualityChecks`, `completionCriteria`, `revisionRules`, `automationPotential`,
`humanApprovalRequired`, `estimatedEffort`, `pricing`, `status`.

`automationPotential` is an honest four-point scale rather than an aspiration:

| | Meaning | Count |
| --- | --- | --- |
| `none` | Judgement or craft. An agent would produce something worse. | 5 |
| `assist` | An agent prepares, a person decides. | 21 |
| `partial` | An agent does most of it, a person approves before it ships. | 38 |
| `full` | An agent can complete it unattended once the inputs are present. | 4 |

### Workflows — sixteen templates, sixty-eight workflows

The brief asks that every feature have a workflow. It also asks, twice, that
this not become a huge amount of duplicated code. Both are satisfied the same
way the site's own components are: **the shape of the work is shared and the
substance of the work is not.**

A logo, a business card and an ad design move through the same five stages —
brief, make, check ourselves, check with the client, release — and differ
entirely in what is made, with what, and what makes it good. So the stages live
in `workflows.json` once, and the specifics live on the feature.
`build-catalogue.js` **materialises** the two into one full workflow object per
feature, with a real `workflow_id`, resolving `$feature.*` tokens — and fails
the build if any token is left unresolved, because a workflow handing an agent
the literal string `$feature.tools` is worse than no workflow.

The sixteen: `design_concept`, `design_system`, `design_asset`, `document`,
`production`, `provision`, `build`, `verify`, `release`, `handover`, `plan`,
`content`, `recurring_service`, `campaign`, `optimise`, `report`.

They materialise into **68 workflows, 277 stages and 96 decision points**, from
16 authored templates and 68 authored features. Written out by hand that would
have been the same content sixty-eight times over, and the day someone improved
a stage it would have been improved in one of them.

Each carries `trigger`, `prerequisites`, `stages`, `decision_points`, `inputs`,
`outputs`, `validation`, `approval_points`, `failure_conditions` and
`completion_condition`; each stage carries `stage_id`, `objective`, `inputs`,
`actions`, `tools`, `output`, `validation` and `next_stage`.

The `decision_points` are where the real knowledge is, and they are written as
instructions to whoever executes rather than as abstractions:

> *at `preflight`* — **Is tracking unverified?** Do not launch. A campaign with
> no measurement is a donation.

> *at `read`* — **Is the sample below the platform's learning threshold?**
> Change nothing. Most optimisation is reading noise confidently.

> *at `prepare`* — **Is any input still a placeholder?** Do not build on it.
> Placeholder content is how a live site ships with lorem ipsum.

---

## 4 — What the validator refuses to build

`tools/build-catalogue.js` runs first in `npm run build`. It stops the build on
any of these, so a broken architecture never reaches a renderer:

- a duplicate, non-language-neutral or malformed feature id
- a name, description, purpose, unit or quote-reason that is not bilingual —
  including an Arabic field holding the English string, which is the one a
  proof-reader misses on row fifty. A Latin product name (Reels) must
  **declare** itself with `latinName`, so the exception cannot be satisfied by
  an oversight that happens to look like one
- an unresolvable dependency, a self-dependency, a **cycle** in `requires`
- an asymmetric `conflicts`, a mutual `supersedes`, a feature that both
  requires and conflicts with the same thing, or requires two things that
  conflict with each other
- a feature in no pipeline stage, or in two
- a published package row whose `ref` resolves to nothing, or to a feature
  belonging to another service
- a package that lists two features that conflict
- a `quote` feature carrying a price, or an `included` feature carrying one
- a `unit` feature whose default quantity is outside its own minimum and
  maximum
- an add-on with no order, a duplicated order, a gap in the numbering, or a
  numbering that disagrees with the group order
- an unresolved `$feature.*` token after materialisation

It also prints **advisories** — findings that are true and are not the code's
to decide. There are fifteen, and they are the honest output of joining the
packages to the catalogue for the first time. Three examples:

> `websites/web-landing`: `feat.websites.handover` requires
> `feat.websites.deployment`, which the package does not list.

> `social/soc-pro`: `feat.social.platform_management` requires
> `feat.social.account_setup`, which the package does not list.

> `marketing/ads-performance`: `feat.marketing.audience_segmentation` requires
> `feat.marketing.audience_research`, which the package does not list.

Each is a statement about what the studio sells — *included but not itemised*,
most likely — and each is the owner's to settle, not a build's. They are
`docs/124` F8–F10, now produced by a machine rather than by reading.

---

## 5 — The two contradictions, fixed

Both were live, in both languages, on cards a buyer decides from.

**Domain and hosting.** Every website package listed "Domain registration" and
"Hosting" as included features while the shared exclusions on the same card
said domain and hosting were not included. The truth is in between and is now
written down in the catalogue as `thirdPartyCost`: **we arrange both, in your
name; you pay the registrar and the host.** An exclusion may now carry
`notFor`, and the websites category states the accurate line itself. A shared
exclusion with no `notFor` still applies everywhere, so the mechanism cannot
quietly widen.

**"What 'from' depends on."** Branding's sentence — concepts, applications, one
language or two — rendered under all twelve packages, including nine that quote
a fixed price and never print the word *from*. It now lives under the category
that wrote it and renders only where `priceFrom` is actually set.

---

## 6 — Naming, declared rather than settled

Service 04 was called four different things in four places on one page. Each
service now has **one canonical name**, and — where the price surfaces use a
shorter form — **one declared short form beside it**. `aliases` records what
each has also been called, so the drift is documented rather than deleted.

| | Canonical `name` | `shortName` (price surfaces) | Also seen as |
| --- | --- | --- | --- |
| 01 | Branding & Design | Branding & Design | Identity & Design · Branding |
| 02 | Websites | Websites | Website |
| 03 | Social Media Management | **Social Media** | — |
| 04 | Digital Marketing & Advertising | **Marketing & Ads** | Digital Marketing & Ads · Digital Marketing · Advertising |

**The published copy is unchanged, and that is deliberate.** The short forms
are the names these packages have been sold under, and an index card or a
WhatsApp button cannot carry "Digital Marketing & Advertising" without
wrapping — the same constraint that produced twelve buttons at two different
heights on 8 September. Rewriting what the studio calls its own services is
the owner's decision, not a refactor's.

What has changed is that **a variant is now a decision somebody made rather
than a drift nobody saw.** `build-catalogue.js` compares every pricing
category's label, in both languages, against the service's declared
`shortName` and fails the build if they disagree. Changing what a surface says
is one field in `services.json` and a rebuild.

> Negative-tested by renaming the social category to "Social" in
> `pricing.json`: *"svc.social: pricing.json calls this category "Social" but
> the service declares its short form as "Social Media""* — build refused.

Two collisions were deliberately **not** merged. `Copywriting` named both
organic social copy and paid ad copy — different work, different approval
paths, so `feat.social.copywriting` and `feat.marketing.ad_copy` stay separate.
`Audience Targeting` / `Research` / `Segmentation` looked like three names for
one thing and are a ladder: apply what is known, find out what is not, then
split it.

Five strings for the monthly report *did* merge.

---

## 7 — Add-ons stopped being markup

Eleven hand-typed items with hard-coded prices, hand-typed index numbers 01–11
and hand-typed group counts, one of which — Company Profile — had no Arabic
label at all.

They are ordinary catalogue features now, distinguished only by carrying an
`addonGroup`: **where they are published, not what they are.** So
`feat.marketing.ad_creative` is a package inclusion and a purchasable add-on
without being written twice, and adding a twelfth is one field on one feature.

The generated section is byte-for-byte the hand-typed one it replaced, except
for the one defect it fixes. That was checked with a diff before anything else
was changed.

---

## 8 — Three new guards, each negative-tested

Written to the rule this project has now hit eighteen times: **a guard that has
never failed is not a guard.**

| | Asks | Was proven by |
| --- | --- | --- |
| `qa.js` §37 | Do the builder's dependency rules survive onto the page? Is every price kind one the builder can total? Does a quote-only row print no figure? | Pointing a `data-requires` at a feature not on the page, and giving a quote row a price |
| `qa.js` §38 | Does any internal catalogue vocabulary reach a shipped page? | Adding a workflow id to the public projection's allowlist |
| `qa.js` §39 | Does every generated name say itself in both languages, and in neither by accident? | Removing the Arabic from Company Profile — the original defect |
| `build-catalogue.js` | Does a pricing category's label agree with the service's declared short form? | Renaming the social category to "Social" |
| `builder-test.cjs` | Do the dependency rules do anything when a person clicks? | It failed on its first run, on a rule that was doing nothing |

§37 is deliberately not a copy of the build-time check. `build-catalogue.js`
asks whether the references resolve **in the source**; §37 asks whether they
survived **the journey onto the page**. A reference that resolves in the source
and points at a row the page does not carry is a rule that silently does
nothing.

---

## 9 — What this does not do

- **It does not change a single price**, or add, remove or re-tier a package.
- **It does not answer `docs/124` F8–F10.** Whether `soc-pro` really drops the
  research row, whether a landing page is deployed, how many platforms
  `ads-growth` covers — those are statements about what the studio sells. They
  are surfaced as advisories on every build and left to the owner.
- **It does not improve published copy.** Two Arabic add-on labels mix scripts
  (`تصميم Presentation`, `Landing Page إضافية`). They are preserved exactly,
  because keeping them is what makes this change provably display-neutral. They
  are worth revisiting; that is a copy decision, not this one.
- **It does not build the automation.** It builds the thing an automation would
  read. `catalogue/catalogue.json` is that file.

---

## 10 — The question the brief ends on

> *If an AI agent received this service and selected features, would the data
> be sufficient for it to understand what to do?*

For a scope of selected features, an agent reading `catalogue/catalogue.json`
can answer: which service each belongs to; which pipeline stage each sits in
and therefore what order they run in; what must exist before each can start;
what inputs to demand and from whom; what steps to take; what to produce; what
"finished" means; what to check before saying so; where a person must approve;
and how much of it is its own to do.

What it cannot get from this file is the client's material, the studio's
accounts, and judgement — which is what `automationPotential: none` is for, and
why four features carry it.
