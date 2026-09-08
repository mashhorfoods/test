# 126 — Four decisions, encoded

**8 September 2026.** The owner settled the scope questions `docs/124` had
surfaced, and asked for something specific about how:

> Do not merely document these decisions. Encode them into the actual
> service/feature/package configuration and validation rules … so they become
> executable business rules.

So every decision below has a rule behind it, and every rule was proven by
reintroducing the thing it forbids. Together the new rules turned up **thirteen
further defects** nobody had asked about: **six** in the published packages
(§5), **five** packages that cost more than their own contents (§6), and **two**
in the builder's own code (§7).

---

## 0 — The one thing I resolved rather than asked

The instruction described **Growth as a superset of Pro**. The published prices
are **Social Growth 400/month and Social Pro 650/month**, so applying it
literally would have sold more for less on two live cards.

That is not a scope question; it is arithmetic. The *structure* asked for — a
core layer and a deeper layer above it — is applied to the **price ladder**:
Growth carries the core, Pro carries the core plus the deep layer. A rule now
refuses any package that contains less than a cheaper one in its category, so
this cannot silently reverse.

**Which tier is called what remains an open question, and it is in §8.**

---

## 1 — Social research: depth, not a second feature

> *"Where the underlying capability is shared, create one canonical feature and
> differentiate it by scope/depth/tier."*

`content strategy` and `complete content strategy` were two display strings for
one capability. So were `Hashtag Research` and `Hashtag & Keyword Research`.
They are now **one feature each, with levels**:

| Feature | Levels | Starter | Growth | Pro |
| --- | --- | --- | --- | --- |
| `feat.social.content_strategy` | core → complete | — | core | **complete** |
| `feat.social.hashtag_research` | basic → core | basic | core | **core** |

The last cell is the original defect: Pro cost 250/month more than Growth and
listed **no research row at all**. It has one now.

The deep layer above it is three genuinely new capabilities, not restatements:

- `feat.social.audience_research` — who the audience actually is, what the
  accounts around it do, where the room to grow is
- `feat.social.growth_analysis` — what is moving, and which posts moved it
- `feat.social.performance_optimization` — changing what we publish, on evidence

### The rules

- A tiered feature needs **at least two levels** — one level is not a tier, it
  is the feature.
- Levels must **ascend**: a deeper level that costs less is a mistake no eye
  would catch.
- A package row on a tiered feature must **say which level it sells**. Falling
  back to the default would let a new package quietly promise the shallow
  version under the deep version's name — the exact shape of the defect this
  mechanism exists to fix.
- A **dearer package may not sell a shallower level** than a cheaper one.
- **The default level must be the cheapest one.** The row prints
  *From `pricing.from`*, and a fresh selection has to cost that. Two features
  defaulted to a level costing 1.6×, so the builder printed *From 90 USD* on a
  row that added 144 to the estimate the moment it was ticked. **"From" is a
  floor or it is a lie.**

> Proven twice more: defaulting to the dearest level — *"the default must be
> the cheapest level, "basic""* — and, in `qa.js` §37, a row that declares
> three depths and renders two.

> Proven by selling Pro the core strategy and Growth the complete one:
> *"soc-pro (650) sells feat.social.content_strategy at "core" while soc-growth
> (400) sells it at "complete""* — build refused.

---

## 2 — The landing page, split three ways

`Additional landing page` was one monolithic unit. It is now a **composite**
of three features that differ in every way that matters:

| | Workflow | Automation | Depends on |
| --- | --- | --- | --- |
| `landing_design` | `wf.design_concept` | `assist` | — |
| `landing_build` | `wf.build` | `partial` | design |
| `landing_deploy` | `wf.release` | `full` | build |

**A client selecting only design gets only design.** The dependency runs
upward, so build pulls design in and design pulls nothing. The functional test
asserts exactly that.

**The client-facing naming stayed simple**, as instructed: the add-ons section
still shows one line at the published *from 120*. The composite carries that
price; its parts are marked *Included in Additional landing page* rather than
charged again.

Taken **alone**, each part is `quote`. The studio has never published a price
for design-only, and the brief's own rule is to show a custom quote rather than
invent one. §8 asks whether you want to publish three.

### The rules

- A composite needs **at least two parts**, must use `wf.composite`, and must
  **not declare its own `requires`** — the ordering lives on its parts.
- A composite is **not staged in a pipeline**; its parts are. Staging both would
  put the same work on a board twice.
- `wf.composite` **generates its stages from the parts**, in order, each
  delegating to that part's own materialised workflow. Writing them out would
  be a second copy that drifts the first time a part changes.

> Proven by staging the composite instead of its parts: *"pipe.websites.build:
> feat.websites.extra_landing is a composite — stage its parts, not the whole"*.

---

## 3 — Platforms: which, not how many

Both platform-management features were priced per platform, and the only record
of **which** platforms was a display string: *"Meta Ads management"*,
*"Facebook + Instagram"*, *"Meta + Google Ads"*. A count you can read and a
scope you cannot are not the same thing.

`src/data/catalogue/platforms.json` holds two extensible sets — **5 advertising
platforms, 7 social channels**. A feature declares `options` pointing at a set;
the builder renders the choices and **derives the quantity from them**, so
there is no stepper to disagree with the selection. The scope, the summary and
the WhatsApp message all name the platforms.

Adding a platform is **one entry in that file**. Nothing in the builder, the
styles or the scripts names a platform.

**The workflow does not change because the platform changed** — the stages, the
approvals and the failure conditions are the same — so every entry's
`executionSteps` is deliberately empty rather than inventing a difference. When
a genuine platform-specific step exists it goes there, and
`build-catalogue.js` appends it to the materialised workflow of every feature
scoped to that platform. **The schema is ready; the content is honest about not
existing yet.**

### The rules

- `options.set` must resolve; `drivesQuantity` requires unit pricing; `maxQty`
  may not exceed the size of the set it draws from.
- A package row naming platforms must name **ids that exist in that feature's
  set**, and its count must equal its quantity.

---

## 4 — One name per service, everywhere

The full names now, on every client-facing surface: **Social Media Management**
and **Digital Marketing & Advertising**. The `shortName` field that lived here
for one commit is gone — a declared abbreviation is still an abbreviation.

**The ids did not move.** `svc.social` is still `svc.social`, the category is
still `social`, the packages are still `soc-starter` / `soc-growth` / `soc-pro`.
Renaming an id to follow a word on a page would break every join in the
catalogue.

### The rules

- **`build-catalogue.js`**: a pricing category's label, in both languages, must
  be exactly its service's own name, and may not be one of its retired
  `aliases`.
- **`qa.js` §40**: every *built page* element whose entire text is a service
  name must carry a canonical one. This is the half that matters, because the
  two diagrams that drifted — the hero orbit and the ecosystem flow — are fed
  by no data file at all. Both said the old names until today.

> Proven by putting "Marketing & Ads" back: two failures, one naming the
> service's own name and one naming the retired alias.

---

## 5 — What the new rules found on their own

**The ladder rule fired six times on the first run**, on packages nobody had
asked me to look at:

| Found | Fixed by |
| --- | --- |
| Professional dropped Starter's identity card | short guidelines **supersede** the one-sheet card — they contain it and keep going |
| Ads Growth dropped Starter's audience targeting | three audience ids were **one capability at three depths** |
| Ads Performance dropped Growth's audience research | same merge |
| Ads Growth dropped Starter's campaign monitoring | monitoring is a **prerequisite, not a choice** — nobody running ads declines to watch them |
| Ads Performance dropped Growth's campaign optimisation | four optimisation ids were **one capability at three depths** |
| Ads Performance listed no ad copy and no ad creative | rows added — a 600/month package cannot run campaigns without ads |

So `audience_targeting` / `audience_research` / `audience_segmentation` became
**`feat.marketing.audience`** at three levels, and `optimization` /
`creative_optimization` / `budget_optimization` became
**`feat.marketing.optimization`** at three. `docs/125` argued these were a
ladder rather than duplicates. They were a ladder — **of one capability** — and
the rule the owner's decisions produced said so out loud.

**Marketing went from seventeen features to thirteen.** The catalogue as a
whole went from sixty-eight to seventy, because the landing page became three
and the social deep layer added three more — fewer ids where they were
duplicates, more where they were genuinely different work.

---

## 6 — A package must be a discount

Costing each package out of its own parts caught something no reading would
have. Before:

| | branding | websites | social | marketing |
| --- | --- | --- | --- | --- |
| ratio (parts ÷ package) | 1.17 · **0.95** · **0.81** | **0.80** · **0.82** · **0.54** | 2.00 · 2.58 · 2.34 | 1.60 · 2.10 · 1.50 |

**Every website package and two of three branding packages cost more than
building the same list piece by piece.** The builder was quoting a Professional
Website at 650 next to a card asking 1200 for the same contents — an argument
against the studio's own packages, made by the studio's own site.

After re-pricing the twenty features involved (**the eleven published add-on
prices untouched** — those are what the studio actually sells):

| | branding | websites | social | marketing |
| --- | --- | --- | --- | --- |
| ratio | 1.62 · 1.30 · 1.78 | 1.68 · 1.71 · 1.13 | 1.47 · 2.23 · 2.52 | 1.60 · 1.95 · 1.52 |

**The rule**: a package whose parts cost less than it does **fails the build**
(floor 1.10); a gap above 2.75× raises an advisory, because a discount that
large makes the individual prices look punitive.

### And the builder now says so

Where a published package's contents are a **superset** of what the visitor
chose, the scope panel names it and its price. Only a superset — a package that
covers four of five things is not an answer, and saying otherwise would be the
near-enough claim this site does not make.

---

## 7 — Two more bugs, found by clicking

`builder-test.cjs` grew from 27 assertions to 42 and **failed twice on the
first run of the new ones**:

1. **Every part of a landing page reported "Custom quote"** underneath a
   composite that had just charged 120 for them. The `quote` branch sat above
   the `partOf` branch; the order of two lines was the whole defect.
2. **The package suggestion rendered `undefined دولار undefined`.** The copy
   helper took one argument and was being handed three.

Neither is visible in a data file, a schema or a review. Both are visible the
moment something clicks.

**And once more the check was the thing that was wrong.** `qa.js` §37 failed
both platform rows — *"priced per unit with no quantity control"* — because it
did not yet know a quantity can come from a set of choices rather than a
stepper. The fifth time on this project that a guard fired at the site and was
itself the defect. §37 learned the rule instead: a unit row needs a stepper
**or** options that drive the count, never both, and never neither.

---

## 8 — What still needed you, and what you said

All three were settled the same afternoon. **`docs/127` is the record**; this is
the summary.

**8.1 — Which tier is "Pro" and which is "Growth"?** Growth is the higher tier.
Pro is 400 and the core layer; Growth is 650 and everything in Pro plus the
deep one. The structure §0 above applied to the price ladder was right; the
names needed to follow it, not the other way round.

**8.2 — Sell the landing page in parts?** Yes: design 50, development 50,
deployment 20, against the published 120 for the whole. The parts sum exactly
to the bundle.

**8.3 — How many pages?** Business up to 5, Professional up to 10, with every
page beyond the first priced through the `Additional Website Page` add-on that
already existed at 70.

**And the one that was answered but worth seeing:** `soc-growth` is now a 2.52×
discount on its own parts, the widest on the site, because it bundles eight
reels and sixteen pieces of copy at rates published as one-off add-on prices.
That is what a retainer is for, and it is visible on every build.
