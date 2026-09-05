# Phase 04 — Website Strategy & Success Metrics

WEBSTART Phase 04. Positioning, experience principles, goals, conversion
strategy, KPIs and scope boundaries — plus the price-band decision (P0-6), which
the owner settled during this phase and which is **implemented in this commit**.

---

## 1. What the owner settled (3 September 2026)

| # | Decision | Effect |
| --- | --- | --- |
| **C-5** | **An online agency, working with clients remotely. Target market: the Gulf + Egypt.** | The SAR / +249 / domain conflict is resolved: there is no local market to match, so nothing needs to *look* Saudi or Sudanese. It also means no office address will ever exist — the trust strategy must not depend on one |
| **C-4 / P0-6** | **New entrant: price competitively.** Authorised to reprice. | Resolved. §5 sets the architecture and the numbers, now live in `src/data/pricing.json` |
| **C-3 (partial)** | Gulf + Egypt = an Arabic-first region with English as the business language | Bilingual parity moves from "expensive to maintain" to *core infrastructure*. PS-09 is promoted |

Still open, and now the only things standing between here and Gate 01: **C-6**
(legal entity and an agency-owned email), **C-7** (permission to publish any
client work), **C-8** (who maintains content), **C-9** (appetite for a backend).

---

## 2. Positioning

> **Pixora is a remote digital studio for small and mid-sized businesses across
> the Gulf and Egypt — brand, website, content and advertising from one team
> instead of four, at prices a growing business can actually start at.**

Three claims, each defensible today:

1. **One partner instead of four** — the site's existing argument, now the
   central one.
2. **Remote by design** — not an apology. Remote is why one studio can serve
   Riyadh, Dubai and Cairo at the same price, and why that price is what it is.
3. **A price you can start at** — competitive as a new entrant, published in
   full, explained in full.

**What we are not:** not the cheapest freelancer on a marketplace (the old
prices said we were), not a full-service network agency, not a retainer-only
shop, and not a local agency pretending to have an office in every market.

---

## 3. Experience principles

Five rules the site must obey. Each is testable, and each already has a problem
behind it in `docs/30-problem-solution.md`.

| | Principle | Test |
| --- | --- | --- |
| E1 | **Answer the price question before it is asked.** | A visitor can price their project without contacting anyone |
| E2 | **Never make the visitor repeat what they already told us.** | Every enquiry arrives naming the package that produced it (PS-02) |
| E3 | **Claim only what can be verified in one click.** | Every trust claim links to something checkable (PS-01) |
| E4 | **Arabic is not a translation layer.** | Any journey completes in Arabic with no English fallback and no broken RTL (PS-09) |
| E5 | **Speed is the promise we can keep.** | A stated reply window, and a mechanism that keeps it (PS-04) |

---

## 4. Goals

- **G1 — Primary: qualified enquiries.** An enquiry that names a service or
  package and arrives on a channel we can reply to. Everything on the site
  serves this.
- **G2 — Secondary: project → retainer.** Half the offer is monthly; the site
  currently does nothing to sell the transition.
- **G3 — Enabling: verifiable credibility.** Not a vanity goal — at the new
  prices, an unverifiable studio loses to a cheaper one.

---

## 5. Price architecture — the P0-6 decision, implemented

### 5.1 Currency: USD

A remote studio serving several countries cannot publish one national currency.
SAR means nothing to a buyer in Cairo, EGP moves too fast to publish, and the
Gulf spans five currencies. **USD is what remote work in the region is quoted
in**, and it is stable enough to print. Arabic renders it as *دولار*.

### 5.2 The new ladder

*Branding revised 4 September 2026 — see §5.5.*

| Service | Package | Was (SAR) | **Now (USD)** | Billing |
| --- | --- | --- | --- | --- |
| Branding | Starter | 580 | **from 490** | one-off |
| | Professional | 1,180 | **from 990** | one-off |
| | Advanced | 2,580 | **from 1,990** | one-off |
| Websites | Landing Page | 175 | **250** | one-off |
| | Business Website | 450 | **650** | one-off |
| | Professional Website | 700 | **1,200** | one-off |
| Social Media | Starter | 150 | **250** | monthly |
| | Growth | 250 | **400** | monthly |
| | Pro | 450 | **650** | monthly |
| Marketing & Ads | Ads Starter | 150 | **250** | monthly |
| | Ads Growth | 225 | **400** | monthly |
| | Ads Performance | 400 | **600** | monthly |

Add-ons were repriced on the same logic (a social post from $15, an extra
website page from $70, an additional landing page from $120 — half the Landing
Page package, as it should be). The ad-spend exclusion note already published
with the Marketing packages is unchanged and now matters more.

### 5.3 Where that sits in the two markets

| | Pixora now | Egypt market | Gulf market |
| --- | --- | --- | --- |
| Business website | **$650** | ~$490–1,510 (EGP 25k–77k) | ~$930–3,200 |
| Professional website | **$1,200** | upper half of the Egyptian band | below the Gulf floor |
| Social, monthly | **$250–650** | ~$290–980 (EGP 15k–50k) | ~$400–1,200 |
| Branding | **from $490** | startup basics from ~$490 | logo alone from ~$530 |

**At or just under the Egyptian floor, and clearly under the Gulf band.** That
is the cheapest *credible* position: a new entrant undercutting both markets
while still reading as a studio. The previous list sat below both markets
entirely, in freelance-marketplace territory, where a low price reads as risk
rather than as value.

### 5.5 Branding revised — 4 September 2026

A change request against a Gate 01 decision, recorded rather than absorbed.

**What was wrong was not the number, it was that one row escaped the rule.**
§5.3's own conclusion is *"at or just under the Egyptian floor, and clearly
under the Gulf band"* — and its own table, in the line directly above that
sentence, showed Branding at **$290 against an Egyptian floor of ~$490**. Not
"just under": 41% under. Every other category obeyed the rule the paragraph
stated. Branding did not, and nobody noticed because nobody re-derived it.

`docs/29` §11 found the same thing from the other direction, against 2026
published Gulf rates: websites had moved into their market band, branding was
still discounted about five times harder. Two independent checks, one
conclusion.

**The fix is the rule, applied.** Starter moves to the Egyptian floor it was
supposed to sit at, and the ladder keeps the ×2 rhythm it already had:

| | Was | Now | Step |
| --- | ---: | ---: | ---: |
| Starter | from 290 | **from 490** | — |
| Professional | from 590 | **from 990** | ×2.02 |
| Advanced | from 1,200 | **from 1,990** | ×2.01 |

*(The old ladder stepped ×2.03 and ×2.03. The shape is unchanged; only the
base moved.)*

**The $490 was re-sourced afterwards rather than taken on trust.** It came from
§5.3's Egypt column, which was written in one sitting and never checked. An
independent 2026 Egyptian agency source gives branding "from 25,000 EGP for
startup basics" — $490 at the rate §5.3 used. `docs/29` §12 has the working,
and the warning that came with it: a first search on the same question returned
freelance-marketplace numbers 30–100× lower, which would have argued the
opposite conclusion.

**Checks the new numbers pass:**

- **Advanced now costs more than the Professional Website** ($1,990 vs
  $1,200), which is what the market says: a full identity with guidelines runs
  SAR 10,000–50,000 against SAR 3,500–12,000 for a standard site. The old
  ladder priced them identically, which said the two were the same size of job.
  They are not.
- **Still clearly under the Gulf band.** $1,990 ≈ SAR 7,460 against a published
  full-identity floor of 10,000 — about 25% under, which is the same shape of
  discount the website tiers carry. The new-entrant position is intact; it is
  now even across all four categories, which is what makes it read as a
  position rather than as a gap.
- **Starter stays the funnel entry** and stays below the Business Website
  ($490 vs $650) — a logo package should cost less than a five-page bilingual
  site.

**What this obliges**, on the same logic as §5.4: the proof that justified the
first rise has to hold for this one. It does — the case study, the verification
band and the homepage proof band all shipped after §5.4 was written, and the
branding work is the part of that case study a buyer can see most of.

**One number to watch.** G1 is qualified enquiries. If branding enquiries fall
after this and nothing else changes, the ladder is the cause and `pricing.json`
is one field per package. Phase 20's rulebook already pre-commits what a fall
means; this is exactly the kind of change it exists to read.

### 5.4 What the new prices oblige us to do

A price rise without anything else is just a price rise. Three things must ship
with it, and they were already P0/P1:

1. **Scope facts per package** (PS-05) — delivery time, revisions, what "from"
   depends on, what is excluded, who owns the files. At $1,200 the buyer will
   ask; the page should have answered.
2. **The verification layer** (PS-01) — a named human, a kept response window,
   real work shown, third-party listings. Nobody pays four times more to an
   anonymous site.
3. **The package-aware handoff** (PS-02) — higher prices mean fewer, more
   considered enquiries; each one is now worth more and must arrive qualified.

**Reversal:** one edit to `src/data/pricing.json` and a rerun of
`tools/build-pricing.js`. The previous list is recorded in that file's
`_provenance`.

### 5.5 Two operational questions the repricing raises

- **Payment.** Gulf and Egyptian buyers pay differently, and USD invoicing into
  Egypt has friction. Which methods do we accept, and is a deposit required?
- **VAT / invoicing.** Depends on C-6 (the entity). Both belong to Phase 06,
  not to the site — but they must be answerable before the first $1,200 sale.

---

## 6. Conversion strategy

The funnel, stated so it can be measured:

1. **Arrive** — search (cost guide, PS-08), social, referral, direct.
2. **Self-qualify** — the visitor prices themselves against published packages
   and scope facts. *No contact required, by design.*
3. **Hand off** — the package CTA opens WhatsApp with the package named
   (PS-02). This is the **primary conversion event**.
4. **Reply inside the stated window** (PS-04) — the differentiator, and the
   moment competitors lose the buyer.
5. **Scope and quote** — the conversation starts from a package, not a blank
   page.
6. **Deliver, then offer the retainer** at handover, when the work is fresh
   (G2).

**Channel hierarchy:** WhatsApp primary · form secondary (same prefilled
context) · email and phone visible for those who prefer them · `mailto:`
retained as a fallback that never silently fails (PS-03).

**Why WhatsApp is the primary and not the form:** it is the dominant channel
across the Gulf and Egypt, it is the one channel a remote studio can answer
instantly from anywhere, and it survives the absence of a backend — the whole
strategy runs on a static site until C-9 says otherwise.

---

## 7. KPIs

Nothing below is measurable today. Analytics (PS-07) is therefore the **gating
task** for this phase, and every baseline reads "unknown until instrumented".
Targets are first targets, to be replaced by real ones after 30 days of data.

| # | KPI | Definition | Source | Baseline | First target |
| --- | --- | --- | --- | --- | --- |
| **K1** | Qualified enquiries / month | Enquiries naming a service or package, on any channel | Analytics event + WhatsApp inbox | Unknown | Establish, then +25% quarter on quarter |
| **K2** | Enquiry rate | Qualified enquiries ÷ unique visitors | Analytics | Unknown | ≥ 2% |
| **K3** | Package-named share | Share of enquiries arriving with a package named | Prefilled-message tagging | ~0% today | ≥ 70% |
| **K4** | Median first response | Enquiry received → first human reply, working hours | WhatsApp Business | Unknown (market ≈ 42 h) | ≤ 15 min |
| **K5** | Enquiry → paid | Qualified enquiries that become paid projects | Manual, monthly | Unknown | ≥ 25% |
| **K6** | Retainer attach | Project clients on a monthly package within 60 days of handover | Manual | Unknown | ≥ 20% |
| **K7** | Arabic share | Arabic sessions, and Arabic share of enquiries | Analytics | Unknown | Report only — it decides how much Arabic content is worth |
| **K8** | Organic entries | Sessions entering on the cost guide | Analytics + Search Console | 0 | Report for two quarters, then target |
| **K9** | Health guardrails | LCP, broken assets, uptime | Field data + build | LCP ~good, 12 assets at third-party risk | LCP < 2.0s · 0 third-party assets · 99.9% |

**Review cadence:** K1–K4 monthly · K5–K6 quarterly · K9 on every deploy.

**One honest warning:** repricing upward will probably *reduce* raw enquiry
volume. That is expected and is not failure — K2 and K5 together, not K1 alone,
decide whether the new band works. Judge it on paid projects per month, at a
higher value each.

---

## 8. Scope boundaries

**In scope, now:** the two existing pages plus About and a privacy policy · the
package-aware conversion · scope facts · the verification layer · analytics ·
self-hosted assets · the cost-and-scope guide.

**Out of scope, explicitly:** e-commerce · a CMS or admin dashboard (Phase 06
defines requirements only) · client portal · booking or online payment ·
a blog programme · per-country pages or per-country pricing · a native app ·
anything that assumes a backend before C-9 is answered.

**Deferred with a trigger:** per-market pricing (trigger: K7 or K5 shows the two
markets behaving differently) · a CMS (trigger: content edits become weekly) ·
a backend lead store (trigger: WhatsApp volume outgrows an inbox).

---

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Higher prices cut enquiry volume before proof exists | Ship §5.4's three obligations *with* the prices, not after; watch K2/K5, not K1 |
| Egypt is more price-sensitive than the Gulf and pays in a weaker currency | Keep the entry tiers genuinely low; revisit per-market pricing only on K7/K5 evidence |
| One price list for two very different markets | Accepted deliberately for simplicity; the deferred trigger above exists for exactly this |
| Remote studio, no office, no clients nameable yet | The verification layer (PS-01) is designed for precisely this constraint |
| The retainer promise (G2) has no mechanism yet | Phase 05 owns the handover moment; K6 measures it |

---

## 10. Gate 01 readiness

| Criterion | State |
| --- | --- |
| Business goals and audience confirmed | ✅ Market and model settled; audience H2 still to be confirmed as primary |
| Competitors benchmarked, "what we do better" stated | ✅ `docs/29` + §2 |
| Problem → insight → solution for each problem | ✅ `docs/30` |
| Goals, conversion strategy, ≥3 instrumentable KPIs | ✅ §4, §6, §7 |
| Content inventory, sitemap, two user flows | ❌ Phase 05 |
| Wireframes for what changed | ❌ Phase 07 |
| Scope boundaries explicit | ✅ §8 |

Two phases remain before the gate.

---

## 11. Next phase

**Phase 05 — Content & Information Architecture.** Content inventory, sitemap,
navigation model, page hierarchy, content states, and the two primary user
flows — now that the price band, the market and the conversion event are fixed.

Deliverable: `docs/32-content-ia.md`.
