# 128 — Final architecture hardening

**8 September 2026.** The read-only audit of the same day returned READY WITH
WARNINGS and listed seven. This is what closing each of them changed.

The rule the whole pass ran under: *no redesign, no new features, no new
business decisions, no price changes.* Every locked value in `docs/127` is the
same value it was before this pass, and the site looks the same. What changed is
underneath.

---

## The seven

| | Warning | Closed by |
|---|---|---|
| **W1** | `catalogue.json` held no packages, so the file an automation is told to read could not price anything | Packages are **materialised** into `catalogue.json` at build time from `pricing.json` |
| **W2** | 30 capability strings typed into `index.html`, 22 of which named nothing the system had | `capabilities.json` — every chip declares what executes it |
| **W3** | Two pipeline stages ran nothing and delegated to nothing | Every stage declares a `kind`; intake stages say what they **produce** and which features they **feed** |
| **W4** | Prices were strings; three packages had no level and no purpose | Prices are numbers, currency is declared once, every package has an explicit `rank`, a level and a purpose in both languages |
| **W5** | Deployment could not be sold alone — its `requires` forced the whole landing page | `landing_deploy` requires nothing; the build is an **input**, and `suppliedInputs` says where it may come from |
| **W6** | The builder's only output was prose | A second output: a deterministic JSON payload in `#build-order` |
| **W7** | No stage said who does it or how long it takes | `roles.json`; every workflow stage carries an `owner` and a `duration` |

---

## 1 — One file answers the whole question (W1)

`src/data/pricing.json` is still where packages are **authored**. The admin
dashboard edits it, the cards are generated from it, and nothing about that
changed. What was wrong is that `catalogue/catalogue.json` — the file the
comment at its own top says a CRM or an agent should read — carried services,
features and workflows and no packages at all.

An engineer handed that file could see seventy things the studio does and had no
way to price one of them. They would have gone looking for a second file and
joined it by hand. That hand-join is the split brain.

So packages are now materialised into `catalogue.json` the same way workflows
are: derived on every build, never authored twice, and stale by construction if
the source moves. The shapes are normalised on the way through, because a
consumer of the catalogue should not have to know that `billingMonthly` is an
i18n key in another file:

```json
{ "id": "soc-pro", "service": "svc.social", "rank": 2, "name": "Social Pro",
  "level":   { "en": "System", "ar": "النظام" },
  "purpose": { "en": "Regular publishing with a strategy behind it…", "ar": "…" },
  "price":   { "amount": 400, "currency": "USD", "billing": "monthly", "from": false },
  "limits":  {},
  "features": [ { "ref": "feat.social.post_design", "qty": 12,
                  "workflow": "wf.design_asset::feat.social.post_design",
                  "inherited": false }, … ] }
```

`catalogue.json` also gained `sources` — which file each block was authored in —
so nobody edits the generated copy by mistake, and `index`, which pre-walks the
joins an orchestrator would otherwise walk on every question.

**What did NOT happen:** no runtime dependency on `pricing.json` was introduced.
The browser still reads only `catalogue.public.json`, through the markup.

## 2 — No capability string is unanswered (W2)

Thirty chips sat under the services on the home page. Eight repeated a catalogue
feature's name word for word. Twenty-two named nothing the system had ever heard
of — *Campaign Management*, *Performance Tracking*, *Visual Content*.

A visitor cannot tell those two kinds apart, and neither could an agent. That is
the problem: a string that reads like a capability and resolves to nothing is
worse than no string at all.

Each chip now declares what carries it out:

| type | means | count |
|---|---|---|
| `feature` | one catalogue feature executes it | 15 |
| `group` | several features together are it | 10 |
| `platform` | a platform an existing feature runs on | 5 |
| `marketing` | copy, and nothing executes it — must give a reason | 0 |

All thirty resolved to something real, so `marketing` is unused. It stays
available and validated, because the honest answer to "what executes this?" is
sometimes "nothing", and the point is that the question is always answered.

`tools/build-capabilities.js` renders them into `index.html` between
`CAPS:*:START/END`. **The words on the page are unchanged.** What is new is a
`data-capability` attribute on each chip and a build that refuses a chip whose
declaration points at nothing.

## 3 — Every pipeline stage has a real relationship (W3)

`pipe.branding.discover` and `pipe.websites.plan` ran no features and delegated
to nothing. They read as an oversight. They are not: they are intake stages, and
what was missing was the relationship, not a feature.

Every one of the 29 stages now declares its `kind`:

- **execution** (23) — runs features
- **intake** (2) — produces the inputs the next stage's features consume, and
  says which features those are, in `feeds`
- **delegation** (4) — `svc.integrated` handing off to another pipeline

No unrelated feature was attached to make a warning go away. The build refuses an
execution stage with no features, an intake stage that does not say what it
produces or who owns it, and a delegation that points at no pipeline.

## 4 — Prices are numbers, hierarchy is declared (W4)

`"price": "400"` became `"price": 400`. The currency is declared once at the top
of `pricing.json` rather than repeated twelve times. The admin dashboard's
validator was rewritten to enforce the numeric contract — it previously enforced
the opposite, on the argument that a value rendered verbatim should be stored the
way it renders. That argument put formatting and business data in one field.

Every package also gained an explicit `rank`. **Hierarchy is not read off the
price** — that is how Pro and Growth swapped places twice. The build checks that
rank and price *agree*, which is a different and weaker claim than deriving one
from the other, and the right one.

The three Social packages gained the `level` and `purpose` the other nine always
had. They now render a positioning line like every other card. Nothing else about
them moved.

## 5 — Deployment stands on its own (W5)

`feat.websites.landing_deploy` required `landing_build`, which required
`landing_design`. So the cheapest scope containing a deployment was the whole
120 landing page, and the published 20 was unreachable. A client who already has
a page and wants it live had nowhere to go.

The build is an **input**, not a prerequisite feature. `requires` is now empty,
and a new `suppliedInputs` block says where the input may come from instead:

```json
"suppliedInputs": [{
  "input": { "en": "A built landing page", "ar": "صفحة هبوط مبنية" },
  "insteadOf": "feat.websites.landing_build",
  "verification": "Run the supplied build outside the machine it was made on…",
  "ifUnusable": "Say so before deploying, in writing, with what is wrong." }]
```

`wf.release` gained an `intake` stage — take delivery of the build, run it
somewhere else first, get the version named in writing, confirm the access
exists — and a decision point: *did this come from the client rather than from
us?* If yes, check it ourselves. What goes live is ours to answer for.

**Ordering inside a complete landing page is not lost.** The composite runs its
parts in the order it lists them, and the release workflow now opens by
identifying whatever it was handed. Selecting all three parts is still 120, and
the parts are still charged at zero underneath it.

No credentials are requested or stored anywhere in the catalogue. The intake
stage confirms that access *exists*; holding it is the operational layer's
problem, and not this repository's.

## 6 — The builder speaks to machines too (W6)

The builder's only output was a WhatsApp message: translated labels, formatted
prices, prose. An order created from that would have to be parsed back out of a
sentence.

There are two outputs now. The message is unchanged. Beside it,
`<script type="application/json" id="build-order">` carries the same scope as
ids and amounts, rewritten on every change, and `pixora:scope` is dispatched so
a future order form can listen rather than poll.

It is **deterministic**: services and features are sorted by id, so the same
selection produces byte-identical JSON however it was arrived at. The browser
test proves it by building the same scope in English and Arabic, in a different
order each time, and comparing.

It ships as `{}` and stays `{}` with the script off, which is the correct answer
to "what did they order?" before anything has been chosen.

**The payload is the record. The message is the presentation of it.**

## 7 — Every stage says who, and how long (W7)

`roles.json` holds ten roles, not one person. `role.client` is one of them and
is marked `external: true`, because approval is a stage somebody has to do and
pretending the studio owns it would let a scheduler promise a duration it cannot
control.

All 64 template stages carry an `owner` and a `duration`. Nine of the seventeen
templates are shared between services — a monthly report is written by whoever
runs that channel — so those stages say `$service.defaultRole` and each service
names its own. That is one token and one line of resolution, rather than nine
templates copied per service.

A composite's stages own nothing: `{ "type": "delegated", "to": "wf.build::…" }`
and a null duration, because the part's own workflow already says. Each workflow
reports an `estimated_duration` summed from its own stages (hours at eight to a
working day); a composite sums what it delegates to. A recurring stage is
reported as a cycle rather than added into the run-up.

This is **schema readiness, not automation**. Nothing here claims a stage is
automated. It claims the schema can carry an assignment, an escalation and an
SLA when something exists to act on them.

---

## What this does not do

No CRM. No order storage. No authentication, database, workflow engine, task
board or agent runtime. The payload is the bridge to those and stops there.

---

## Where things live now

| Question | File |
|---|---|
| What do we sell, and what does it cost? | `src/data/pricing.json` |
| What is each thing, and how is it done? | `src/data/catalogue/features.*.json` |
| What shape does the work take? | `src/data/catalogue/workflows.json` |
| What is the lifecycle of a service? | `src/data/catalogue/services.json` |
| Who does the work? | `src/data/catalogue/roles.json` |
| What do the home-page chips mean? | `src/data/catalogue/capabilities.json` |
| **All of it, joined, for a machine** | `catalogue/catalogue.json` (generated) |
| The subset a visitor may see | `catalogue/catalogue.public.json` (generated) |

`npm run check` now starts with `tools/architecture-test.js`: 1,463 assertions
over the data, no browser, about a second. Shape rules stay in the build; the
locked business facts live there. A price that moves fails in a second rather
than in a browser.
