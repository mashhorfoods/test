# Phase 01 — Discovery & Business Analysis

WEBSTART Phase 01. Run **compressed**: the build already answers many discovery
questions implicitly, so this document's job is to *extract and state* what the
project has been assuming, mark what only the owner can settle, and record the
evidence for each.

**Method.** Every fact in §1 is quoted from the repository and cited to a file.
Nothing is invented — the project's own content rule applies to this document
too. Inferences are labelled **⟨H⟩** (hypothesis, needs validation) and open
decisions **⟨C⟩** (needs owner confirmation). §7 lists them all in one place.

**Status:** 🟡 documented, pending owner confirmation. Phase 01 closes when the
§7 checklist is answered.

---

## 1. What the repository already establishes

### 1.1 Identity and voice

| Fact | Evidence |
| --- | --- |
| Trading name **Pixora**, positioned as a digital agency | `index.html` header, `og:site_name` |
| Locked identity: `#202020` ink, `#FFFFFF`, `#F4D13F` yellow; Poppins (Latin) + Cairo (Arabic) | `src/styles/02-tokens.css`, `docs/00-design-system.md` |
| Dark-only product; confident, plain-spoken voice; no stock-photo language | `index.html`, `docs/18-refinement.md` |
| Two languages at full parity, EN default, AR with true RTL | `src/data/i18n-ar.json` (147 keys), `docs/20-arabic.md` |

### 1.2 Offering map — five services, twelve packages, eleven add-ons

| Service | Package (level) | Price | Billing |
| --- | --- | --- | --- |
| **Branding & Design** | Starter *(Foundation)* | from 580 SAR | one-off |
| | Professional *(System)* — "Most Requested" | from 1,180 SAR | one-off |
| | Advanced *(Ecosystem)* | from 2,580 SAR | one-off |
| **Websites** | Landing Page *(Foundation)* | 175 SAR | one-off |
| | Business Website *(System)* | 450 SAR | one-off |
| | Professional Website *(Ecosystem)* | 700 SAR | one-off |
| **Social Media Management** | Social Starter | 150 SAR | monthly |
| | Social Growth | 250 SAR | monthly |
| | Social Pro | 450 SAR | monthly |
| **Digital Marketing & Ads** | Ads Starter *(Foundation)* | 150 SAR | monthly |
| | Ads Growth *(System)* | 225 SAR | monthly |
| | Ads Performance *(Ecosystem)* | 400 SAR | monthly |
| **Integrated Digital Solutions** | — no packages; it is the combining proposition | — | — |

Source: `src/data/pricing.json`, rendered by `tools/build-pricing.js`. Verified
against the page: 12 tier cards.

**Add-ons (11), sold alongside any package:** single social post design · ad
design · presentation design · content writing · reel design · video editing ·
additional landing page · additional website page · photography · videography ·
company profile. Source: `#add-ons`.

**Two revenue shapes are already designed in:** project fees (branding,
websites) and monthly retainers (social, ads). The commercial thesis of the
site is that a client buys a project and then stays on a retainer.

### 1.3 The published process

Six stages, named on the page: **01 Discover · 02 Plan · 03 Create ·
04 Build · 05 Launch · 06 Grow** — with Discover defined as *"Understand the
business, its goals and the audience it is trying to reach, before anything is
designed."* Source: `#process`.

That is the agency's own promise to its clients, and it is the phase this
project skipped for itself. Closing it is not only methodology — it is
consistency with what the site sells.

### 1.4 Contact channels, as published

WhatsApp `+249 962672192` · phone `+249 119005441` · email
`muhalabsalah@gmail.com` · LinkedIn · Behance · a personal portfolio at
`muhalabsalah.github.io`. Source: `#contact`.

### 1.5 What the site says its difference is

One argument, made in `#integrated` and repeated in `/story.html`: **four
services bought separately means four conversations, four briefs and four
versions of the brand; one partner means one.** It is a real differentiator,
consistently held, and it is the only one the site claims.

---

## 2. Business goals ⟨C⟩

No goal is stated anywhere in the repository. Nothing is measured, so no goal
could be verified even if it were stated. Proposed as the working set until the
owner confirms — KPIs and targets belong to Phase 04, not here:

- **G1 — Generate qualified project enquiries.** The site's entire structure
  (21 "Start Your Project" CTAs, published prices, package comparison) points at
  one outcome: a conversation with a buyer who already knows the price.
- **G2 — Convert project clients into retainer clients.** Half the packages are
  monthly. The site currently does nothing explicit to sell that transition.
- **G3 — Establish credibility for a young agency.** The site asks a stranger
  to spend up to 2,580 SAR and offers no proof at all (§5).

⟨C-1⟩ Confirm, reorder or replace these. Everything downstream — proof
content, page set, lead capture, KPIs — is derived from this ordering.

---

## 3. Audiences ⟨H⟩

No audience is defined anywhere. These are hypotheses read from the packages'
own stated purposes, and each is testable in Phase 12.

**H1 — The new or small venture buying a first identity.** Evidence: the
Starter package's own purpose line, *"A foundational identity for new or small
projects."* Buys branding first; is price-sensitive; needs to be told what
happens next.

**H2 — The established small business that looks unprofessional online.**
Evidence: the Professional tier is flagged "Most Requested"; the Business
Website package sits at the centre of the websites ladder. Buys identity plus
site together; compares vendors; wants proof more than anything else on the
page.

**H3 — The owner who cannot keep publishing.** Evidence: three monthly social
packages and three monthly ads packages, priced to be affordable
(150–450 SAR/month). Buys a retainer, often after a project. This is the
recurring-revenue audience and the site speaks to it least.

⟨C-2⟩ Which of these is primary? The homepage currently addresses all three
equally, which is why it opens with a general "one partner" claim rather than a
problem any one of them would recognise as theirs.

⟨C-3⟩ Language split. The site is fully bilingual, which is expensive to
maintain. Is Arabic the primary market, or an equal second?

---

## 4. Constraints (hard, observed)

| Constraint | Consequence |
| --- | --- |
| **No client proof exists or is permitted.** Every stage doc records this; `story.json` says so explicitly and tells the truth instead | The trust gap is a content-permission problem, not a design problem. Design cannot fix it |
| **No backend.** Static hosting (Hostinger), manual zip upload, no database, no server-side code | Lead capture, CRM, and any dashboard require a decision to add infrastructure |
| **One maintainer, no CMS.** Content lives in HTML and three JSON files; changes need a build and an upload | Every price change is a developer task. Bounds how much content the site can carry |
| **No analytics, no support inbox history, no CRM** | Discovery has no behavioural evidence to draw on, and Phase 20 cannot start (see §6) |
| **Market signals conflict** (§5.3) | Cannot finalise audience, currency, or trust content until settled |

---

## 5. The current site, audited as a business instrument

Not code — this is what the site does to a buyer. (The code audit is
`docs/27-webstart-audit.md`.)

### 5.1 What it already does better than most agency sites

- **It publishes prices.** Twelve packages, every feature listed, comparable
  side by side. Most competitors hide behind "request a quote"; this site lets a
  buyer qualify themselves before making contact.
- **It explains the process** in six named stages, so a first-time buyer can see
  what they are agreeing to.
- **It claims nothing it cannot support.** No invented clients, no fake
  statistics, no "500+ projects delivered". That honesty is an asset — and it is
  also why the page has no proof at all.
- **It is fully bilingual with real RTL**, which is rare and directly widens the
  addressable market.

### 5.2 Where it loses the sale

1. **No proof of any kind.** No client, no result, no testimonial, no
   credential, no "who we are". A stranger is asked for up to 2,580 SAR on the
   strength of an argument alone.
2. **One undifferentiated CTA, twenty-one times.** Every "Start Your Project"
   goes to the same form. A visitor who has just chosen *Social Growth* arrives
   at a blank message box, and the enquiry lands with no idea which package
   moved them. The single most valuable qualification signal on the site is
   discarded at the moment of conversion.
3. **The conversion can fail silently.** The form is a `mailto:` — honest, but a
   mobile visitor with no configured mail client loses the message entirely, and
   nothing is stored anywhere.
4. **Personal identity undermines an agency purchase.** A Gmail address, two
   personal phone numbers, and a "Website" link to a personal GitHub portfolio.
   A buyer comparing vendors reads this as one freelancer, which changes what
   they are willing to pay.
5. **No response promise.** Nothing says whether a reply takes an hour or a
   week — the cheapest trust element available, and it is absent.
6. **No answer to "who are you?"** There is no About, no team, no location, no
   founding story, no legal entity.
7. **Price architecture invites a question the page never answers.** Branding
   starts at 580 SAR "from"; a complete Professional Website is 700 SAR flat.
   Identity therefore reads as more expensive than the website it is for, and
   only branding carries "from". Whether that is deliberate positioning or a
   legacy of how the list was written is ⟨C-4⟩ — and either way the page should
   explain what "from" depends on.

### 5.3 The market signal conflict ⟨C-5⟩

Three signals point at three different places:

- Prices are in **SAR** (Saudi Arabia), in both languages.
- Both phone numbers are **+249** (Sudan).
- The live test domain is **`zaokalyamamah.online`** — unrelated to the Pixora
  name in either language.

A buyer who notices any two of these together will hesitate. This is the single
most consequential open question in Discovery: it determines the target market,
the currency, the trust content, the domain, and whether local payment and
call-back expectations need designing for.

### 5.4 Structural observations

- **Contact is not in the navigation** — only the yellow CTA button reaches it.
  Defensible, but it means a returning visitor looking for a phone number has no
  labelled route.
- **The Story page is the only inner page**, and it currently tells the agency's
  own argument rather than a client's, because no client story exists.
- **`README.md` is stale** in two places: it lists fourteen packages where the
  page renders twelve, and its doc index stops at `docs/21` although
  `docs/22`–`26` exist. Minor, but it is the file a new collaborator reads first.

---

## 6. Analytics and support evidence

**None exists.** No analytics property, no tag, no event tracking, no server
logs available to this project, no CRM, and no record of enquiries received.

Consequence for the methodology: Discovery has no behavioural evidence, Phase 04
cannot set a baseline, and Phase 20 is impossible by construction. This is why
"install analytics with one defined conversion event" is P0-5 in the backlog and
runs in parallel with the strategy phases rather than after them.

Minimum instrumentation needed before any later phase can claim a result:

1. One conversion event (enquiry started / enquiry sent), with the package or
   service that preceded it.
2. Language split (EN vs AR sessions).
3. Section reach on the homepage — how far down the page buyers actually get.
4. Outbound channel clicks (WhatsApp, phone, email) — today's real conversions
   are almost certainly happening on WhatsApp and are entirely invisible.

---

## 7. Open questions — the Phase 01 exit checklist

Nothing here is a preference question; each one changes work downstream.

| # | Question | What it blocks |
| --- | --- | --- |
| C-1 | Are G1–G3 the right goals, in that order? | Phase 04 KPIs; what the homepage optimises for |
| C-2 | Which audience is primary — H1, H2 or H3? | Homepage opening; proof selection; Phase 07 wireframes |
| C-3 | Is Arabic the primary market or an equal second? | Content cost, IA, hreflang, which competitors matter |
| C-4 | Is the branding-vs-website price relationship deliberate? What does "from" depend on? | Pricing presentation; the qualification question in the lead form |
| C-5 | **Which market: Saudi, Sudan, or both?** And is `zaokalyamamah.online` a staging host or the permanent domain? | Currency, phone numbers, trust content, domain, competitor set |
| C-6 | Is there a legal entity, an agency-owned email and phone, and a business address? | About page, Organization JSON-LD, contact block, buyer trust |
| ~~C-7~~ **ANSWERED** | Client work may be published **anonymised** (4 Sep 2026). Rules, format and the facts needed: `docs/35-case-studies.md` | The proof/trust gap is now open for want of facts, not permission |
| C-8 | Who maintains content, and must they edit without a developer? | Whether a CMS/dashboard is ever in scope (Phase 06/15) |
| C-9 | Appetite for a backend (lead capture, CRM, analytics) vs staying fully static? | Phase 06 technical direction, P0-4 lead path |

### Working assumptions if these go unanswered

So Phase 02 is not blocked, competitive intelligence will proceed on:
**A1** primary audience H2 (established small business, buying identity + site);
**A2** market = Saudi Arabia, because the prices are the strongest published
signal and appear in both languages; **A3** primary goal G1 (qualified
enquiries); **A4** no client proof is publishable, so trust must be built from
process, guarantees, response promise and named ownership; **A5** the site stays
static until a lead-capture decision is made.

Every assumption is marked in the Phase 02 output and is cheap to reverse before
Gate 01 — but not after.

---

## 8. What Discovery changes about the existing plan

- The trust gap moves from "content to write" to **"permission to obtain"**
  (C-7). It should be the first question asked of the owner.
- The **market conflict (C-5) is promoted to a P0 decision**. It sits underneath
  audience, competitor set, currency and domain — Phase 02 cannot select
  competitors without it, and A2 is only a placeholder.
- **Package-aware CTAs** are added to the Phase 03 problem list: the site
  already knows what the visitor chose and throws that away.
- A **response-time promise** and a **named owner** are the two cheapest trust
  elements available and need no client permission at all.

---

## 9. Next phase

**Phase 02 — Competitive Intelligence.** Benchmark 5–7 direct and 2–3
aspirational agencies across UX, IA, hero, CTA strategy, services presentation,
pricing transparency, trust, mobile, performance and content strategy; extract
what they do best and where this project can be stronger. Competitor selection
depends on C-5 — under A2 the set is Saudi-market agencies serving small
businesses, with regional and international aspirational picks.

Deliverable: `docs/29-competitive-intelligence.md`.
