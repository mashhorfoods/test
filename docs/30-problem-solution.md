# Phase 03 — Problem → Insight → Solution

WEBSTART Phase 03. Every significant problem found in Phases 01 and 02 gets the
full chain: **evidence → insight → solution concept → feature → UX outcome**.

Two rules govern this document, both from the methodology and both from this
project's own history:

1. **No feature enters the build without a problem behind it.** If a row below
   cannot name the evidence, the feature is deleted rather than argued for.
2. **A problem is not a solution in disguise.** "There is no dashboard" is not a
   problem; "the owner cannot change a price without a developer" is.

Run on the Phase 01 working assumptions (A1–A5) and the Phase 02 findings. One
open decision — the price band, P0-6 — changes two rows, and §6 states exactly
how, so the rest is not held hostage to it.

---

## 1. The problem set, ranked by cost to the business

Eleven problems. Ordered by what they cost at the point of sale, not by how hard
they are to fix.

---

### PS-01 · A stranger cannot verify who they are dealing with

| | |
| --- | --- |
| **Evidence** | No client, result, testimonial, credential, team member, address or legal entity appears anywhere on the site (`docs/28-discovery.md` §5.2). Buyers report they verify agencies through Google reviews, directory profiles and candid references *before* contacting them, and in Saudi Arabia they are trained to look for a Maroof badge tied to a Commercial Registration (`docs/29-competitive-intelligence.md` §3) |
| **Insight** | The trust gap was diagnosed as a content problem — "we have no clients we may name". It is not. **Proof does not have to come from clients.** It can come from third parties, from work that is already public, and from the artefact the buyer is looking at. *(Updated 4 Sep 2026: C-7 answered — client work may be published anonymised, which adds the strongest proof of all on top of these. See `docs/35-case-studies.md`.)* |
| **Solution concept** | A verification layer, assembled entirely from material that needs nobody's permission |
| **Feature** | (a) A named human with a face and a role — a solo studio is credible when it says so, and evasive when it does not; (b) a stated response window, kept; (c) the existing Behance work surfaced *on the site* as work, not as an off-site link; (d) a Google Business Profile and one directory listing; (e) CR + Maroof if the entity is Saudi; (f) the site's own measured numbers as evidence of craft |
| **UX outcome** | A buyer can answer *"who am I dealing with, and can I check?"* within about fifteen seconds, without leaving the page and without taking anyone's word for it |

---

### PS-02 · The site learns what the visitor wants, then throws it away

| | |
| --- | --- |
| **Evidence** | Twenty-one identical "Start Your Project" buttons, all pointing at one blank form (`docs/28-discovery.md` §5.2). A visitor who has just read and chosen *Social Growth — 250 SAR/month* arrives at an empty message box |
| **Insight** | The most valuable qualification signal on the site is generated **for free**, by the visitor, at the exact moment of highest intent — and discarded one click later. Every enquiry therefore starts from zero, and the reply is slower and worse than it needed to be |
| **Solution concept** | Carry the choice through the conversion, on the channel the market actually uses |
| **Feature** | Package-aware conversion: each package's CTA opens WhatsApp with a prefilled message naming the service, package and price (*"I'm interested in Social Growth — 250 SAR/month"*), with the same context prefilled into the form for anyone who prefers email. Renders from `pricing.json`, so it cannot drift from the prices |
| **UX outcome** | The buyer types nothing to start. The enquiry arrives pre-qualified, and the first reply can be about their project rather than about which package they meant |

---

### PS-03 · The only conversion path can fail without anyone knowing

| | |
| --- | --- |
| **Evidence** | The form's action is a `mailto:`. On a device with no configured mail client the message is simply lost, and nothing is stored anywhere (`docs/27-webstart-audit.md` §2) |
| **Insight** | A channel that can fail **silently** is worse than a slower channel that cannot. The current design is honest about not having a backend, but honesty about a failure mode is not the same as removing it |
| **Solution concept** | A primary channel that cannot fail silently, with the honest fallback kept behind it |
| **Feature** | WhatsApp as the primary path (PS-02), a visibly copyable email address as the second, the `mailto:` retained as a last resort, and a status line that reports only what actually happened |
| **UX outcome** | No path exists on which a buyer believes they made contact and did not |

---

### PS-04 · Nothing tells the buyer when they will hear back

| | |
| --- | --- |
| **Evidence** | No response promise anywhere on the site. Across the market, average first response to an inbound enquiry is ~42 hours, and only 7–23% of firms reply within five minutes, while qualification odds fall roughly 21× between five and thirty minutes (`docs/29-competitive-intelligence.md` §3) |
| **Insight** | Speed is the cheapest competitive advantage available to a small studio, and the one a large agency structurally cannot match. Saying nothing about it forfeits the advantage *and* pushes the buyer to enquire elsewhere in parallel while they wait |
| **Solution concept** | Promise a window that can actually be kept, and build the mechanism that keeps it |
| **Feature** | A stated reply window beside every conversion point, with working hours; a WhatsApp Business auto-reply that acknowledges instantly and repeats the window |
| **UX outcome** | The buyer stops waiting in uncertainty — the most common reason a warm enquiry goes cold |

---

### PS-05 · The prices are stated but never explained

| | |
| --- | --- |
| **Evidence** | Twelve exact prices, no ranges and no scope drivers; "from" appears on branding only, with nothing saying what it depends on (`docs/28-discovery.md` §5.2). The market's strongest performers publish ranges tied to scope and rank for the cost questions buyers type (`docs/29-competitive-intelligence.md` §3–4) |
| **Insight** | An unexplained price makes the buyer guess what is missing — and at a price far below the market, the guess is unflattering. **The disclosure is an asset that is currently working against itself** |
| **Solution concept** | Answer in public what a sales call would answer |
| **Feature** | Per-package scope facts: delivery time, revision count, what "from" depends on, what is explicitly not included, who owns the files, what happens after launch, payment terms. Data lives in `pricing.json` beside the prices it explains |
| **UX outcome** | A buyer can qualify or disqualify themselves without contacting anyone — which raises enquiry quality and cuts the "how much is it really?" exchange entirely |

---

### PS-06 · The identity signals contradict each other

| | |
| --- | --- |
| **Evidence** | Prices in SAR, both phone numbers +249, a personal Gmail address, a "Website" link to a personal GitHub portfolio, and a test domain matching neither the brand nor either market (`docs/28-discovery.md` §5.3) |
| **Insight** | Each signal is defensible alone. Together they force the buyer into risk arithmetic at precisely the moment the site is asking for trust. The problem is not that the studio is small — Designjoy holds ~USD 6k/month as one person — it is that the signals do not agree on **what** it is |
| **Solution concept** | One coherent identity, stated deliberately |
| **Feature** | A single decision — *solo studio, proudly* or *agency, with the entity to match* — then applied across contact block, About, footer and metadata: one primary number in the market being served, an address at the domain, and the portfolio link presented as the founder's work rather than as a stray "Website" |
| **UX outcome** | Nothing on the page contradicts anything else, so the buyer spends their attention on the offer instead of on the discrepancy |

---

### PS-07 · The business cannot see anything it does

| | |
| --- | --- |
| **Evidence** | No analytics, no event tracking, no CRM, no enquiry record (`docs/28-discovery.md` §6). Outbound WhatsApp and phone taps — today's most likely conversions — are entirely invisible |
| **Insight** | Every improvement after this point is a matter of taste until something is measured. This is also the phase gate the methodology puts on Phase 20 |
| **Solution concept** | The smallest instrumentation that makes decisions possible, with a lawful basis stated |
| **Feature** | Four events — enquiry started, enquiry sent, outbound channel tap (WhatsApp/phone/email), package viewed — plus language split and homepage section reach; a privacy policy covering the form and the analytics; consent handled to match the market chosen in PS-06 |
| **UX outcome** | Invisible to the buyer, decisive for the business: which package sells, which language converts, and where readers stop |

---

### PS-08 · Nobody can find the site who does not already know it

| | |
| --- | --- |
| **Evidence** | Two public pages, no category content, no organic surface (`docs/28-discovery.md` §5.4). Competitors capture the buyer at the "how much does a website cost" moment with cost guides that rank (`docs/29-competitive-intelligence.md` §3) |
| **Insight** | The buyer's first search is a **price** question, and this project has the rarest possible asset for answering it: real, published, itemised prices in a structured file |
| **Solution concept** | Turn the pricing data into the entry point |
| **Feature** | A cost-and-scope guide generated from `pricing.json` by the existing `tools/build-pricing.js` pattern — so it can never contradict the packages — in both languages, doing PS-05's explaining job at the same time |
| **UX outcome** | An entry point that arrives already trusted, because it answered the question before asking for anything |

---

### PS-09 · The most expensive thing the site has is never claimed

| | |
| --- | --- |
| **Evidence** | Full EN/AR parity with true RTL and no-JS switching — 147 translated keys, every string in both languages (`docs/28-discovery.md` §1.1). Nowhere does the site say so. Most competitors are Arabic-first or English-first with a thin counterpart |
| **Insight** | Parity was expensive to build and is invisible as a benefit. For a buyer who serves both audiences, *"your site will work as well in Arabic as in English, because ours does"* is a demonstrable claim — the demo is one click |
| **Solution concept** | State the capability and let the site prove it |
| **Feature** | A short claim in the services/value area, with the language switch presented as the evidence |
| **UX outcome** | An Arabic-first buyer sees themselves served rather than translated, and a bilingual buyer sees a capability nobody else in the band is demonstrating |

---

### PS-10 · A third party can break the services sections at any time

| | |
| --- | --- |
| **Evidence** | Twelve images hotlinked from `i.ibb.co`; `build.js` warns on every run (`docs/27-webstart-audit.md` §2) |
| **Insight** | This is a **trust** problem before it is a technical one: if those images stop loading, the five service sections show empty frames, and a site selling design credibility looks broken — at no notice and with no fix available in the moment |
| **Solution concept** | Own every asset the page depends on |
| **Feature** | Self-host the twelve images under `src/assets/`, with `width`/`height`, `loading` and modern formats; the build's zero-request property returns as a side effect |
| **UX outcome** | Nothing a stranger controls can change what the buyer sees |

---

### PS-11 · The site collects personal data and answers no questions about itself

| | |
| --- | --- |
| **Evidence** | The form collects name, email and message. There is no privacy policy, no terms, and no About page (`docs/28-discovery.md` §5.2) |
| **Insight** | Two different needs, one root: the site asks for commitment before offering any account of itself |
| **Solution concept** | The minimum pages a business site owes a visitor |
| **Feature** | About (who, where, how the work is done — feeding PS-01 and PS-06) and a privacy policy covering the form and the analytics of PS-07 |
| **UX outcome** | The buyer can find out who they are giving their details to before they give them |

---

## 2. What follows from this, and what does not

Features that earned their place, grouped by what they cost:

| Priority | Feature | From | Backend needed |
| --- | --- | --- | --- |
| P0 | Package-aware WhatsApp + form prefill | PS-02, PS-03 | No |
| P0 | Self-hosted images | PS-10 | No |
| P0 | Analytics (4 events) + privacy policy | PS-07, PS-11 | No |
| P0 | Price-band decision applied | PS-05, PS-06 | No |
| P1 | Verification layer — named human, response promise, Behance work, directory listings | PS-01, PS-04 | No |
| P1 | Per-package scope facts | PS-05 | No |
| P1 | About page | PS-11, PS-06 | No |
| P1 | Bilingual parity claim | PS-09 | No |
| P2 | Cost-and-scope guide generated from `pricing.json` | PS-08, PS-05 | No |

**Every P0 and P1 above ships without a backend**, which keeps assumption A5
intact and means none of this waits on infrastructure.

### Explicitly not being built

Each was considered and rejected here so it cannot re-enter later as an
assumption:

- **A live chat widget** — nobody is staffing it; an unanswered chat is worse
  than no chat, and PS-02/PS-04 cover the same need on a channel the market
  prefers.
- **A testimonials section** — there is nothing truthful to put in it (A4).
  Building the empty component invites filling it dishonestly later.
- **A CMS or admin dashboard** — no problem above names one. The editing pain
  is real but belongs to Phase 06's requirements work, not to a build now.
- **A blog** — PS-08 needs *one* guide that answers the price question, not a
  publishing commitment nobody has committed to.
- **An AI chatbot, popups, exit-intent offers, animated counters of invented
  numbers** — no evidence, and each would spend the trust the site has.

---

## 3. Problems deliberately left open

- **The editing bottleneck** (a price change needs a developer, a build and an
  upload) is real and is *not* solved here. It is Phase 06's to specify, and it
  becomes urgent only if content changes turn out to be frequent — which PS-07's
  instrumentation will show.
- **The retainer transition** (project client → monthly client) is a business
  design problem, not a page problem, and belongs to Phase 04's conversion
  strategy.

---

## 4. Traceability

Every feature above traces back to evidence in a prior phase. Nothing here
originates in this document, and nothing in the backlog now lacks a problem:

| Backlog item | Problem it answers |
| --- | --- |
| P0-2 self-host images | PS-10 |
| P0-4 lead path | PS-02, PS-03 |
| P0-5 analytics + privacy | PS-07, PS-11 |
| P0-6 price band | PS-05, PS-06 |
| P1 proof/trust | PS-01, PS-04 |
| P1 About/legal | PS-11 |
| P2 category content | PS-08 |

`docs/27-webstart-audit.md` P1-1 ("proof and trust: clients, results,
testimonials — real and permissioned") is **narrowed** by PS-01: it no longer
waits on client permission. That is the single largest unblocking in this phase.

---

## 5. What Phase 04 must now decide

Handed forward, not decided here: the primary conversion event and its
definition · the KPI set and a baseline (impossible until PS-07 ships) ·
positioning wording once the price band is settled · the retainer strategy ·
scope boundaries and out-of-scope items.

---

## 6. The one open decision, and its exact blast radius

**P0-6 — the price band (C-4 + C-5).** Only two rows change:

- **If the prices move up to the market band:** PS-05's scope facts become
  *justification* work (what the buyer gets for 8,000 SAR that they do not get
  for 700), and PS-01's verification layer becomes load-bearing rather than
  merely valuable — nobody pays market rate on an unverifiable promise.
- **If the low band is deliberate:** PS-05 becomes *productization* work — fixed
  scope, published limits, a queue, no meetings — and PS-02's WhatsApp handoff
  becomes the whole sales process rather than its first step.

Everything else in this document holds either way, which is why Phase 04 is not
blocked and the P0 build items are not blocked.

---

## 7. Next phase

**Phase 04 — Website Strategy & Success Metrics.** Positioning, experience
principles, primary and secondary goals, conversion strategy, KPIs, and scope
boundaries — with the price band answered or explicitly carried as a branch.

Deliverable: `docs/31-strategy-kpis.md`.
