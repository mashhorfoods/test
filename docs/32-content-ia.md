# Phase 05 — Content & Information Architecture

WEBSTART Phase 05: structure before style. Content inventory, sitemap,
navigation model, page hierarchy, content states, and the two primary user
flows — decided now that the market, the price band and the conversion event
are fixed (`docs/31-strategy-kpis.md`).

---

## 1. Content inventory — what exists today

### 1.1 Pages

| URL | Purpose | Indexed | State |
| --- | --- | --- | --- |
| `/` | The entire sales narrative: nine sections, hero → contact | Yes | Complete, missing proof and scope facts |
| `/story` | Five-chapter scroll narrative — currently the studio's own argument, because no client story is permitted | Yes | Complete as a *format*; its content is a placeholder for a real case study |
| `/styleguide` | Living specimen of every token and component | No (robots-disallowed) | Internal, current |
| `404` | Designed error page | n/a | Complete |

### 1.2 Homepage content, measured

**1,363 words of English copy**, and the same again in Arabic.

| Section | EN words | Images | CTAs | Cards |
| --- | ---: | ---: | ---: | ---: |
| `home` (hero) | 46 | 0 | 3 | — |
| `services` | 197 | 0 | 20 | — |
| `branding` | 157 | 4 | 12 | 3 packages |
| `websites` | 156 | 3 | 12 | 3 packages |
| `social` | 143 | 5 | 12 | 3 packages |
| `marketing` | 194 | 0 | 12 | 3 packages |
| `integrated` | 133 | 0 | 0 | — |
| `add-ons` | 119 | 0 | 3 | 11 add-ons |
| `process` | 134 | 0 | 0 | 6 stages |
| `start` (final CTA) | 18 | 0 | 3 | — |
| `contact` | 66 | 0 | 6 | — |

The CTA counts are the Phase 03 finding in numbers: **83 button instances,
nearly all of them the same generic "Start Your Project"** pointing at the same
blank form.

### 1.3 Sources of truth

| Content | Lives in | Rendered by |
| --- | --- | --- |
| Section order and every nav label | `src/scripts/navigation-map.js` | Header, mobile drawer, footer — all three |
| Packages, prices, features, billing, notes | `src/data/pricing.json` | `tools/build-pricing.js` → static HTML |
| Case-study chapters | `src/data/story.json` | `tools/build-story.js` |
| Arabic for every non-package string | `src/data/i18n-ar.json` (147 keys) | `tools/build-i18n.js` |
| All other prose | `index.html` / `story.html`, as `data-lang-copy` span pairs | — |

**The rule this phase adopts:** every *structured, repeating* content type gets
a JSON source and a generator. Prose stays in the markup as bilingual span
pairs — that is what keeps both languages working with JavaScript disabled, and
it is not worth breaking.

### 1.4 What does not exist

Proof of any kind · scope facts (delivery time, revisions, exclusions,
ownership, payment terms) · a response promise · About · privacy policy ·
terms · any content that could rank in search · a real client case study.

---

## 2. Sitemap — target

```
/                     Homepage — the sales narrative, one page, nine sections
├─ /about             NEW · who we are, how remote works, the named human      P1
├─ /pricing           NEW · what it costs and what changes the price            P2
├─ /story             Case-study format — holds the studio argument until C-7   —
├─ /privacy           NEW · the form, the analytics, the lawful basis           P0
└─ /styleguide        Internal, robots-disallowed                                —
   404                Designed error page                                        —

Deferred, with triggers:
   /work              Portfolio index          ← TRIGGER FIRED (C-7, 4 Sep): in scope
                                                 at two anonymised case studies
   /services/<slug>   Per-service pages        ← trigger: a service's scope
                                                 outgrows its accordion panel
   /terms             Terms of service         ← trigger: first contract dispute
                                                 or a payment provider requiring it
```

**Five public pages, not fifteen.** The homepage stays a single scrolling
narrative — Phase 03 found no problem that splitting it would solve, and
`docs/18-refinement.md` already removed one duplicated section on the same
reasoning.

### 2.1 Why `/pricing` exists when the packages are already on the homepage

Different job, no duplication. The homepage answers *"what do I get for $650?"*
The guide answers *"why is it $650, and what would make it $1,200?"* — the
question buyers type into a search engine before they have heard of us
(`docs/29` §3). It renders its package cards from `pricing.json`, so it cannot
disagree with the homepage, and it carries the scope facts (PS-05) that the
new price band obliges us to publish.

---

## 3. URL and language model

**Routing:** extensionless URLs via the existing rewrite (`/story` serves
`story.html`), HTTPS enforced, one designed 404.

**Language:** one URL serves both languages. Both copies ship in the markup and
CSS shows one; the choice persists in `localStorage`.

| | Single URL (today) | `/ar/` paths |
| --- | --- | --- |
| No-JS parity | ✅ works | ✅ works |
| Maintenance | One page to edit | Two trees to keep in sync |
| Arabic in search | ⚠️ weak — the inactive language is `display:none`, and hidden text is discounted | ✅ properly indexable, with real hreflang |
| Sharing an Arabic link | ✗ opens in the reader's stored language | ✅ deterministic |

**Decision: keep the single-URL model for now.** It is what makes bilingual
parity affordable for a two-person operation, and Phase 04 recorded that Arabic
demand is unmeasured. **Trigger to revisit:** KPI K7 shows meaningful Arabic
traffic or Arabic enquiries, or the `/pricing` guide fails to rank in Arabic —
at which point `/ar/` is introduced **for the guide first**, not for the whole
site.

This is an explicit trade: we are choosing maintainability now and buying the
option to change later, rather than pretending the SEO cost is zero.

---

## 4. Navigation model

| Surface | Today | Target |
| --- | --- | --- |
| Header | Home · Services · Story · Process + language + CTA | Home · Services · Pricing · Story · About + language + CTA |
| Mobile drawer | Same, with the five services nested under Services | Same, plus Contact as a labelled destination |
| Footer | Quick links + services column, both generated | Adds About · Pricing · Privacy, and the verification block (PS-01) |
| In-page | Scroll spy on the homepage sections | Unchanged |

Two decisions:

1. **Contact gets a label, not just a button.** Today the only route to
   `#contact` is the yellow CTA. A returning visitor looking for a phone number
   has nothing to scan for. It goes into the drawer and the footer; the header
   stays lean.
2. **Everything still renders from `navigation-map.js`.** New destinations are
   entries in that array, so the three surfaces cannot drift.

---

## 5. Page hierarchy and templates

Three templates cover every page above:

| Template | Used by | Status |
| --- | --- | --- |
| **T1 — Long-form sales page** | `/` | Exists |
| **T2 — Narrative page** | `/story` | Exists |
| **T3 — Content page** (heading, body prose, optional table, optional aside) | `/about`, `/pricing`, `/privacy` | **Missing — must be added** |

T3 is the only new design work Phase 05 identifies, and it is small: heading
scale, measure, list and table styles already exist as tokens. It goes into the
design system rather than into three one-off pages, so the fourth content page
costs nothing.

---

## 6. Content states

Every state below must be designed before build, not discovered during it.

| Element | Default | Empty | Error | No JS | RTL |
| --- | --- | --- | --- | --- | --- |
| Contact form | Idle | — | Native validation message, in the field's language | Submits via `mailto:` | Mirrored, labels right-aligned |
| WhatsApp handoff | Opens with the package prefilled | — | **Device has no WhatsApp → visible fallback: copyable number + email** | Plain `wa.me` link still works | Same |
| Package cards | Rendered from JSON | A category with no packages renders nothing, not an empty grid | — | Fully rendered (static HTML) | Mirrored |
| Service accordion | First panel open | — | — | All panels open | Mirrored, chevrons flipped |
| Images | Self-hosted, dimensioned | **Reserved box at the correct aspect ratio, alt text visible** | Same as empty | Same | Same |
| Language switch | EN default; stored choice wins | — | — | Both copies present; EN shown | — |
| Analytics | Silent | — | Fails silently, never blocks the page | Absent | — |
| 404 | Designed page, nav intact | — | — | Works | Works |

The image row is a direct consequence of PS-10: while twelve assets are
hotlinked, a third-party outage renders five service sections as blank frames.
A reserved, labelled box is the difference between "loading" and "broken".

---

## 7. Primary user flows

### Flow A — the price-led buyer (primary; audience H2)

*Entry → homepage → service → package → scope facts → WhatsApp with the package
named → reply within the window → scoped quote.*

| Step | What the site must do | Failure today |
| --- | --- | --- |
| 1. Arrive | Load fast, state the offer in one screen | ✅ works |
| 2. Find their service | Five services, openable in place | ✅ works |
| 3. Compare packages | Three tiers, features listed, price visible | ✅ works |
| 4. **Understand what the price includes** | Delivery time, revisions, exclusions, ownership | ❌ **missing** (PS-05) |
| 5. **Convert** | CTA carries the package into WhatsApp | ❌ **discarded** (PS-02) |
| 6. Know what happens next | Stated reply window | ❌ **missing** (PS-04) |
| 7. Be replied to | ≤15 min in working hours | No mechanism |

Three of seven steps have no content behind them. That is Flow A's brief.

### Flow B — the verification-led buyer

*Entry → hero → "who are these people?" → About → work → channels → contact.*

| Step | What the site must do | Failure today |
| --- | --- | --- |
| 1. Arrive, read the claim | Credible hero | ✅ works |
| 2. **Ask who we are** | A named human, a location model, how remote works | ❌ no About |
| 3. **Check the work** | Real work, on the site | ❌ Behance is an off-site link, never framed as proof |
| 4. **Check someone else vouches** | Third-party listing or profile | ❌ none |
| 5. Choose a channel | WhatsApp, phone, email, form | ✅ present, but personal-identity signals undercut it (PS-06) |

Flow B is the one the new price band makes decisive: at $1,200 the buyer
verifies before they enquire, and today there is nothing to verify against.

### Flow C — project client → retainer (secondary, G2)

Deferred to Phase 11 with a note: the moment is *handover*, not the website.
The site's only job is to make the monthly packages legible to someone who
already bought a project — which the current IA does adequately.

---

## 8. Content requirements

New copy needed, in **both languages**. Volume matters: the homepage is 1,363
English words today, so this roughly doubles the site's written content and
doubles it again in Arabic.

| Content | Scope | ~EN words | Source | Owner |
| --- | --- | ---: | --- | --- |
| Scope facts | 12 packages × 6 fields | 600 | `pricing.json` (new fields) | Owner + studio |
| Response promise | One line + working hours | 30 | `navigation-map.js` strings | Owner |
| Verification block | Named human, role, how remote works, listings | 200 | Markup | Owner |
| About page | Who, how, where, why remote | 350 | Markup (T3) | Owner |
| Privacy policy | Form fields, analytics, retention, contact | 700 | Markup (T3) | Owner + review |
| Pricing guide | What changes a price, per service | 1,200 | JSON + markup | Studio |
| Arabic for all of the above | — | ≈3,000 | `i18n-ar.json` + span pairs | Native reviewer |

**The Arabic row is the schedule risk.** `docs/20-arabic.md` already flags that
the existing Arabic needs a native-speaker review; this adds ~3,000 words to
that review. Phase 04's language decision means it cannot be skipped.

---

## 9. Decisions recorded

| # | Decision | Rationale |
| --- | --- | --- |
| IA-1 | Homepage stays one page | No problem in `docs/30` is solved by splitting it |
| IA-2 | Five public pages, three of them new | Each answers a step in Flow A or B that has no home |
| IA-3 | `/pricing` is an explainer, not a second price list | Rendered from the same source; different question |
| IA-4 | Single URL for both languages, for now | Affordable parity; revisit on K7 evidence, guide first |
| IA-5 | Contact becomes a labelled destination | A button is not a way-finding target |
| IA-6 | New template T3 goes into the design system | The fourth content page must cost nothing |
| IA-7 | Structured content gets JSON + a generator; prose stays in markup | Preserves the no-JS bilingual contract |
| IA-8 | `/work` and per-service pages are deferred **with triggers**, not planned | Avoids building an empty portfolio (C-7) |

---

## 10. Gate 01 readiness

| Criterion | State |
| --- | --- |
| Goals and audience confirmed | ✅ (H2 primary still to be confirmed) |
| Competitors benchmarked | ✅ `docs/29` |
| Problem → solution chain | ✅ `docs/30` |
| Strategy, conversion model, KPIs | ✅ `docs/31` |
| **Content inventory, sitemap, user flows** | ✅ **this document** |
| Wireframes for what changed | ❌ Phase 07 — the last item |
| Scope boundaries explicit | ✅ `docs/31` §8 |

One phase from the gate.

---

## 11. Next phase

**A note on Phase 06.** Technical & data discovery is already 🟡 partial
(`docs/27` §1): the front-end direction and the data files exist, but the data
model, CMS decision, environments and dashboard *requirements* do not — and
those depend on C-8 (who maintains content) and C-9 (appetite for a backend).
None of it blocks wireframing, because everything Phases 01–05 added ships on
the static stack. Phase 06 is therefore carried alongside, not skipped: it
closes when C-8 and C-9 are answered.

**Phase 07 — UX Wireframes.** Low-fidelity, and only for what Phases 01–05
changed: the package card with scope facts and a package-aware CTA, the
verification block, the T3 content page, the About page, the `/pricing` guide,
and the mobile behaviour of each. Everything else is already built and validated
and will not be re-drawn.

Deliverable: `docs/33-wireframes.md`.
