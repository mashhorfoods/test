# 124 — The service inventory, taken before anything was built

**8 September 2026.** The brief is to redesign the service and pricing
*architecture* so the site can later be read by automation, a CRM, a project
management system and eventually an agent that executes the work — not to
restyle anything. It opens with an instruction: **research the codebase first,
build an internal inventory, do not start coding immediately.**

This is that inventory. It is written before a line of the new architecture
exists, and it is deliberately unflattering: the point of counting things is
to find the places where the site already disagrees with itself.

Two of those places turned out to be **live on the published site, in both
languages, on cards a buyer reads before deciding**. They are recorded in §5
and fixed in the work that follows this document.

---

## 1 — What exists, counted

### 1.1 Services

Five. They live in **hand-written markup in `index.html`** (the `c-service`
accordion, §543–800) and nowhere else. There is no `services.json`, no service
record, no id, no schema.

| # | Name as the accordion says it | Arabic | Capabilities listed | Packages |
| --- | --- | --- | --- | --- |
| 01 | Branding & Design | الهوية والتصميم | 6 | 3 |
| 02 | Websites | المواقع الإلكترونية | 6 | 3 |
| 03 | Social Media Management | إدارة وسائل التواصل | 9 | 3 |
| 04 | Digital Marketing & Advertising | التسويق الرقمي والإعلانات | 11 | 3 |
| 05 | Integrated Digital Solutions | الحلول الرقمية المتكاملة | 6 | **0** |

`src/data/pricing.json` holds **four** `categories`, not five. A category is a
pricing grouping; it is not the same object as a service, and the fifth
service has no row in any data file at all. **The site sells five things and
the data knows about four.**

### 1.2 Packages

Twelve, all in `pricing.json`, all rendered by `tools/build-pricing.js` into
both `index.html` and `src/pages/pricing.html` from one source.

| Category | Packages | Floor | Billing | `priceFrom` |
| --- | --- | --- | --- | --- |
| branding | Starter 490 · Professional 990 · Advanced 1990 | 490 | one-time | **yes, all three** |
| websites | Landing Page 250 · Business 650 · Professional 1200 | 250 | one-time | no |
| social | Starter 250 · Growth 400 · Pro 650 | 250 | monthly | no |
| marketing | Ads Starter 250 · Ads Growth 400 · Ads Performance 600 | 250 | monthly | no |

This part of the system is **sound**. One source, generated markup, a summary
line that cannot disagree with the cards above it, a test that asserts it.
Nothing below proposes changing a price.

### 1.3 Features

**110 feature rows across the twelve packages.** Every one of them is this:

```json
{ "carry": false, "en": "Campaign setup", "ar": "إعداد الحملات" }
```

A bilingual display string and a boolean that draws a different tick. That is
the entire feature model. There is **no id, no category, no unit, no
dependency, no pricing rule, no deliverable, no workflow hook** — nothing an
automation could key on and nothing an agent could act from.

This is precisely what the brief calls *"features that currently exist only
visually but have no structured data"*, and it is not a corner of the system:
it is the system.

### 1.4 Add-ons

Eleven, in **five groups**, and they are worse off than the features: they are
**typed by hand directly into `index.html`** (§1721–1911). No data file, no
generator, no validation, hard-coded prices, hand-typed index numbers `01`–`11`
and hand-typed group counts.

| Group | Add-on | Price |
| --- | --- | --- |
| Design | Single social media post design | from 15 |
| Design | Ad design | from 20 |
| Design | Presentation design | from 90 |
| Content | Content writing | from 20 |
| Content | Reel design | from 45 |
| Content | Video editing | from 60 |
| Digital | Additional landing page | from 120 |
| Digital | Additional website page | from 70 |
| Media | Photography | **By project** |
| Media | Videography | **By project** |
| Branding | Company Profile | from 150 |

Consequences of being markup rather than data:

- The admin dashboard **cannot edit them.** It edits `pricing.json` and
  `i18n-ar.json`; the add-ons are in neither.
- Adding a twelfth add-on means renumbering by hand and editing a group count
  in three places (`c-addons__count`, the visually-hidden count, the list).
- **"Company Profile" has no Arabic label at all.** It is the only one of the
  eleven rendered as bare text rather than the `en`/`ar` span pair, so an
  Arabic reader gets an English string with no `lang` attribute on it.
- The two "By project" items already prove the model needs a *pricing type*,
  and the model has no field for one.

### 1.5 Everything else that is markup pretending to be data

- The **43 service capabilities** (`c-service__cap`) — 6 + 6 + 9 + 11 + 6.
- The **six process stages** (Discover · Plan · Create · Build · Launch · Grow).
- The **four orbit labels** in the hero.
- The **five stops** of the Integrated Solutions flow.

Every one is a bilingual string pair written by hand, and every one names a
concept that also appears somewhere else under a different name — which is §3.

---

## 2 — Duplicated features

Same capability, different strings, no way for anything to know they are the
same thing.

| The capability | Written as | Where |
| --- | --- | --- |
| Writing organic copy | `Content writing` · `Copywriting` | soc-starter, soc-growth · soc-pro |
| Writing ad copy | `Ad Copy` · `Copywriting` | ads-starter · ads-growth |
| Designing a post | `Post design` · `Design` · `Graphic Design` | soc-starter · soc-growth · soc-pro |
| Publishing | `Publishing and scheduling` · `Publishing & Scheduling` | soc-starter, soc-growth · soc-pro |
| The monthly report | `Brief monthly report` · `Monthly performance report` · `Monthly Performance Report` · `Monthly report` · `Performance Report` | five packages, five strings |
| Reels | `4 Reels per month` · `8 Reels per month` · `Reels` (capability) · `Reel design` (add-on) | four places |
| Video | `Video Editing` (soc-pro) · `Video editing` (add-on) · `Video Production` (capability) | three places |

Note the collision in row 2: **`Copywriting` is used for two different
things** — organic social copy in `soc-pro`, paid ad copy in `ads-growth`.
The brief warns against blindly merging similar-sounding features, and this is
the case it was warning about. They stay separate, with distinct ids.

Row 5 is the opposite case: five strings for what the studio actually does
once a month. Those merge, with the *scope* of the report carried as data
rather than smuggled into the adjective.

---

## 3 — Inconsistent naming

Each service is called something different depending on which part of the page
you are reading. Nothing enforces agreement because nothing shares a source.

| Service | Accordion | `pricing.json` | Hero orbit | Eco flow | Integrated caps |
| --- | --- | --- | --- | --- | --- |
| 01 | Branding & Design | Branding & Design | Branding & Design | **Identity & Design** | **Branding** |
| 02 | Websites | Websites | Websites | Websites | **Website** |
| 03 | **Social Media Management** | **Social Media** | **Social Media** | Social Media Management | Social Media |
| 04 | **Digital Marketing & Advertising** | **Marketing & Ads** | **Digital Marketing & Ads** | **Digital Marketing** | **Advertising** |

**Service 04 is called four different things in four places on one page.**

Case is inconsistent inside a single package too: `tier-starter` writes
sentence case (`Color selection`, `Font selection`, `Basic final files`) and
`tier-professional`, directly beside it, writes title case (`Typography
System`, `Short Brand Guidelines`, `Business card design` — and that last one
is sentence case again, in the title-case package).

None of this is visible as an error to a reader. All of it is fatal to a
consumer that has to decide whether two rows mean the same thing.

---

## 4 — Missing dependencies

Not one dependency is recorded anywhere. Every one below is real, is currently
enforced only by a human reading the list, and would let a builder assemble a
scope that cannot be executed.

**Websites**
- Website development → requires Website UI/UX design
- Website setup, Testing, Deployment → require Website development
- Required integrations → requires Website development
- Hosting → requires a domain
- Additional website page → requires an existing website
- Additional landing page → requires a website or landing page

**Marketing**
- Campaign optimization, Retargeting, Budget optimization → require Campaign setup
- Retargeting → requires Conversion tracking (there is no pixel without it)
- A/B testing → requires more than one creative or campaign
- Ad creative → requires ad copy, or copy is the client's

**Social**
- Post design, Reels, Stories → require a content calendar or strategy
- Publishing and scheduling → requires something written and something designed
- Community monitoring / management → requires published content
- Hashtag research → belongs to strategy, not to publishing

**Branding**
- Business card, letterhead, profile and cover, ad templates → require a logo
- Brand guidelines → require logo + colour system + typography system
- Presentation template, business profile template → require brand guidelines
- Company Profile (add-on) → requires an identity to profile

**Media**
- Reel design and Video editing → require footage; without it the dependency
  is Videography, which is itself quoted by project

The brief asks that the builder "must not allow logically impossible scopes."
Today there is nothing that could stop one.

---

## 5 — Pricing inconsistencies

### 5.1 Every website package contradicts its own exclusions — LIVE

`tools/build-pricing.js` renders `terms.shared.excludes` under **every** card.
One of the five shared exclusions is *"Domain, hosting and paid third-party
services."* All three website packages list **"Domain registration"** and
**"Hosting"** as included features.

So the published Landing Page card, today, in both languages, reads:

> ✓ Domain registration
> ✓ Hosting
> …
> **What's not included** — Landing Page
> · Domain, hosting and paid third-party services

The buyer cannot tell which half is true, and it is the half that costs money
every year. `terms.shared` is a good idea implemented one level too widely:
these are the *studio's* exclusions and four of the five genuinely are, but
this one is contradicted by a whole category.

### 5.2 Branding's price explanation renders under fixed-price packages — LIVE

`terms.shared.fromDepends` reads *"The number of concepts, how many
applications you need, and whether the identity works in one language or
two."* That is a **branding** sentence, and `priceFrom` is set on the three
branding packages only.

It renders under all twelve. A Landing Page at a flat, non-`from` **250 USD**
tells the reader what its "from" depends on, in terms of identity concepts.
Nine cards carry an explanation of a word they do not use.

### 5.3 Structural gaps

- **`web-landing` promises "Delivery ready for use" with no deployment step,**
  while `web-professional` lists Deployment explicitly. Either the landing page
  is deployed and the feature list omits it, or it is not and the promise is
  wrong. The feature model cannot express "included but not itemised".
- **`soc-pro` drops a feature `soc-growth` has.** Growth lists *Hashtag &
  Keyword Research*; Pro, which costs 250 USD more, lists no research row at
  all. Whether it is included and unlisted or genuinely absent, the top tier
  reads as offering less than the middle one.
- **The `social` packages have `level: null` and `purpose: null`** — the only
  category with neither the level mark nor the purpose line the other nine
  cards carry. Not wrong, but it means "level" is a branding/websites/ads
  concept masquerading as a package field.
- **`ads-growth` may not be a step up in platform count.** Starter says "One
  advertising platform managed"; Growth says "Meta Ads management / Facebook +
  Instagram", which is one platform with two placements. Nothing in the data
  says how many platforms a package covers, so nothing can check the ladder.
- **Quantities live inside display strings**: `3 social media designs`,
  `8 posts per month`, `Up to 5 platforms`, `Up to 2 ad designs`. The number is
  the thing that scales the price and it is trapped in a sentence, in two
  languages, with `Up to` and `per month` glued on.

---

## 6 — What can be reused, and what that implies

The count that matters: **110 package feature rows + 11 add-ons + 43
capabilities = 164 authored strings describing perhaps 70 distinct
capabilities, in two languages, with no shared source.**

That ratio is the whole argument for the new layer:

1. **One feature catalogue, keyed by language-neutral ids.** Every label and
   description exists once, in both languages. `pricing.json` package rows
   become references into it and stop carrying their own copy of the words.
2. **Add-ons are features**, distinguished by a pricing type, not by living in
   a different file — the Media pair already needs `quote` and the Design trio
   already needs `unit`.
3. **Quantity is a field, not a sentence.** `posts_per_month: 8` renders
   "8 posts per month" and "8 منشورات شهريًا" from one number, and the builder
   can price it.
4. **Services get a record**, so the accordion, the orbit, the eco flow, the
   pricing index and the builder all render from one name per service and the
   four-names-for-service-04 problem cannot recur.
5. **Dependencies are data**, so "impossible scope" becomes a thing a
   validator can fail a build on rather than a thing a reader has to notice.
6. **The execution knowledge — pipelines, workflows, stages, QA, automation
   potential — is the same catalogue, one level deeper.** It must never reach
   the browser: the brief is explicit that a visitor sees none of it. So the
   catalogue is authored in full and a **public projection** is generated from
   it, carrying only what the builder UI needs.

---

## 7 — The shape this points to

```
src/data/catalogue/            the internal truth, never shipped whole
  services.json                5 services, pipelines
  features.json                every feature, full schema
  addons.json                  add-ons as features, with pricing type
  workflows.json               a workflow per feature, with stages
        │
        ├── tools/build-catalogue.js
        │      validates: refs resolve · deps acyclic · every feature
        │      bilingual · every package row maps · every feature has a
        │      workflow · no orphan
        │
        └──→ src/data/catalogue.public.json     what the builder may see
                 labels, descriptions, pricing, dependencies
                 NO workflow ids, NO stages, NO automation fields,
                 NO internal status
```

`pricing.json` keeps its twelve packages and its twelve prices exactly as they
are. It gains a `ref` per feature row and loses nothing.

---

## 8 — The list this document hands to the work that follows

| | Finding | Disposition |
| --- | --- | --- |
| F1 | Domain/hosting included and excluded on the same card | **Fix** — scope exclusions per category |
| F2 | Branding's "from" explanation under nine fixed-price cards | **Fix** — scope `fromDepends` to the packages that use "from" |
| F3 | Service 04 named four ways | **Fix** — one canonical name per service, rendered |
| F4 | 164 strings for ~70 capabilities | **Fix** — the catalogue |
| F5 | Add-ons are markup, uneditable and one of them monolingual | **Fix** — add-ons become data, Arabic supplied |
| F6 | No dependencies anywhere | **Fix** — dependencies are data, validated acyclic |
| F7 | Quantities trapped in display strings | **Fix** — quantity is a field |
| F8 | `soc-pro` appears to drop Growth's research row | **Owner** — a scope question, not a code question |
| F9 | `web-landing` promises delivery with no deployment row | **Owner** — same |
| F10 | `ads-growth` platform count ambiguous | **Owner** — same |

F8, F9 and F10 are **not invented away.** They are statements about what the
studio sells, and this document's job is to surface them, not to decide them.
Where the catalogue must carry a value for them it carries the conservative
one and says so in a `_note`.

---

**What was built from this: `docs/125`.** F1–F7 are done. F8, F9 and F10 are
now printed as advisories on every build, so they cannot go quiet while they
wait for an answer.
