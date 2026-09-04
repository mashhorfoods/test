# Stage 27 — WEBSTART Audit (takeover assessment)

The project is being brought under the **WEBSTART — Website Design &
Development Workflow v2.0** methodology. This document is the audit that
precedes any further work: what exists, what it is worth, what is missing, and
which phase we execute next.

Nothing in this stage changes the product. It changes what we know about it.

**Audited:** `index.html`, `story.html`, `styleguide.html`, `404.html`,
`src/` (styles, scripts, data, assets), `docs/00`–`docs/26`, `build.js`,
`tools/`, `dist/`, `site.config.json`, `.htaccess`, `robots.txt`,
`sitemap.xml` — plus a live browser pass (Chromium) over the served page at
360 / 390 / 768 / 1440px in both language directions.

**Not audited — blocked:** the live test domain
`https://zaokalyamamah.online`. Outbound requests to that host are refused by
this environment's egress policy (`connect_rejected — host_not_allowed`), so
every statement below about production behaviour is inferred from the artefacts
that were uploaded, never observed. See §6, BLOCKER-1.

---

## 1. Phase-by-phase checklist

| Phase | Status | Evidence | Problems / Gaps | Required action |
| --- | --- | --- | --- | --- |
| **00 WEBSTART** (brand → product) | 🟡 PARTIAL | `src/assets/brand/logo.svg` + brand README; colour, type and voice are settled and consistently applied | No kickoff brief, no confirmed scope document, no statement of who owns the brand or the business entity. Contact details are a personal Gmail and a personal GitHub portfolio, not an agency identity | Write the kickoff brief: entity, owner, scope in/out, approval authority |
| **01 Discovery & business analysis** | 🟡 PARTIAL *(was ❌ — executed 3 Sep 2026)* | `docs/28-discovery.md`: offering map, commercial model, published process, channels, audience hypotheses, constraints, and the site audited as a business instrument | Nine owner decisions remain open (C-1…C-9), the largest being the SAR / +249 / domain market conflict. No analytics or support evidence exists to draw on | Owner answers the §7 checklist; then 01 closes ✅ |
| **02 Competitive intelligence** | 🟡 PARTIAL *(was ❌ — executed 3 Sep 2026)* | `docs/29-competitive-intelligence.md`: 6 direct + 1 price-band peer + 2 aspirational, benchmarked on pricing, trust, channel, content and scope clarity | Provisional until C-5 is answered: the published prices sit 3×–29× below the Saudi market and below the Sudanese one, which contradicts the assumed market. Competitor UX could not be inspected first-hand — egress policy blocks page fetches | Owner answers C-5 + the new P0-6 price-band decision; spot-check the five pages in §7 |
| **03 Problem → insight → solution** | 🟡 PARTIAL *(was ❌ — executed 3 Sep 2026)* | `docs/30-problem-solution.md`: eleven problems, each with evidence → insight → solution → feature → UX outcome, plus an explicit not-building list and full traceability back to Phases 01–02 | Two rows resolve differently depending on P0-6 (§6 states the blast radius). Awaiting owner sign-off at Gate 01 | Owner confirms the problem set and the not-building list |
| **04 Strategy & KPIs** | 🟡 PARTIAL *(was ❌ — executed 3 Sep 2026)* | `docs/31-strategy-kpis.md`: positioning for a remote Gulf + Egypt studio, five experience principles, three goals, a six-step conversion funnel, nine KPIs with definitions and first targets, and explicit scope boundaries. The price band (P0-6) is decided and shipped | No baseline exists for any KPI until analytics ships — PS-07 is the gating task. Audience H2 still to be confirmed as primary | Install analytics; confirm the primary audience |
| **05 Content & IA** | ✅ COMPLETE *(was 🟡 — executed 3 Sep 2026)* | `docs/32-content-ia.md`: measured content inventory (1,363 EN words, 83 CTA instances), a target sitemap of five public pages with two deferred behind triggers, the navigation model, three templates, a content-state matrix, and the two primary user flows with their failure points | Awaiting Gate 01 sign-off with the rest of the structural work. Three of Flow A's seven steps still have no content behind them — that is the build brief, not a gap in this phase | Approve at Gate 01 |
| **06 Technical discovery & CMS/data architecture** | ✅ COMPLETE *(was 🟡 — closed 4 Sep 2026)* | `docs/36-technical-and-data.md`: static direction confirmed, the five-file data model, a one-command build, the maintenance runbook, environments/backups/monitoring, and the security requirements Phase 16 inherits | Nothing outstanding for this phase. CSP and HSTS are build tasks underneath it, tracked in the backlog | Approve at Gate 01 |
| **07 UX wireframes** | ✅ COMPLETE *(was ❌ — executed 4 Sep 2026)* | `docs/33-wireframes.md` + the published wireframe sheet: seven drawings covering the package card, verification band, contact, the T3 content template, About, the pricing guide and navigation — desktop and mobile, with states and a five-user test plan | Deliberately excludes what is already built and validated. Awaiting Gate 01 sign-off | Approve at Gate 01 |
| **GATE 01 — structural approval** | ✅ HELD *(approved 4 Sep 2026)* | `docs/37-gate-01.md`: ten decisions frozen — market, positioning, prices, conversion, KPIs, IA, proof strategy, no-CMS, the wireframes, and what is deliberately not built | The foundation is frozen. Changes to it from here are change requests, recorded rather than absorbed | Phase 08, then the P1 build in wireframe order |
| **08 Master prompt** | ✅ COMPLETE *(was 🟡 — executed 4 Sep 2026)* | `docs/38-master-prompt.md`: positioning, audiences, the eleven problems, strategy and KPIs, IA, visual direction, component rules that carry decisions, eight non-negotiables and nine prohibitions — with `docs/00` normative for token values | None. It governs, and points at the normative source for each kind of detail | — |
| **09 Design system** | ✅ COMPLETE | `src/styles/02-tokens.css` (single source of truth), 21 component stylesheets, `@layer` cascade order fixed in `main.css`, and `styleguide.html` — a living specimen sheet for every token and component | Not a gap: no light theme (`prefers-color-scheme` appears 0 times) — deliberate, the product is dark-only, but it is undocumented as a decision | Keep. Record the dark-only decision explicitly |
| **10 Homepage design** | 🟡 PARTIAL | Nine sections, one `<h1>`, 13 `<h2>`, coherent hierarchy; hero, services, five service details, add-ons, process, CTA, contact; verified in-browser at four widths | **Proof and trust are absent** — no clients, no testimonials, no results, no credentials. For an agency site that is the conversion gap, not a nice-to-have. No FAQ. Section order was never validated against a user flow | Fill the proof/trust gap with real, permissioned material (Phase 03/04 output) |
| **11 Inner pages & flows** | 🟡 PARTIAL | `story.html` — a five-chapter scroll narrative, a genuine case study; `404.html`; `styleguide.html` (internal, robots-disallowed) | No About, no per-service pages, no portfolio index, no privacy policy or terms — while the site collects a name, an email and a message | Decide the page set in Phase 05, then build |
| **12 Prototype & validation** | 🟡 PARTIAL *(was ❌ — executed 4 Sep 2026)* | `docs/40-validation.md` + `tools/validate.js`: seven journeys walked against the built site at two widths, in both languages, by keyboard and with JavaScript off. One real defect found and fixed, two harness false positives recorded, two more issues surfaced by the walk | Five moderated sessions with real buyers remain outstanding — a logic review cannot prove comprehension | Run the five-user script in `docs/33` §9 |
| **GATE 02 — design approval** | ✅ HELD *(approved 4 Sep 2026)* | `docs/41-gate-02.md`: six pages measured at three widths, seven component rules frozen, content readiness stated line by line | Approved with the §5 risk accepted knowingly — no moderated sessions with real buyers were run | Phases 13–18 finish the build |
| **13 Responsive & accessibility** | ✅ COMPLETE *(re-verified across all six pages, 4 Sep 2026)* | `docs/16-qa.md` (measured, both directions) plus this audit's independent browser pass: **no horizontal overflow at 360/390/768/1440**, **0 interactive targets below the 44px floor** out of 97, **0 console errors**, one `<h1>`, `<main>`/`<nav>`/`<header>`/`<footer>` landmarks present, skip link present, focus ring at every stop (`src/scripts/focus.js`), 23 `prefers-reduced-motion` guards, contrast failures fixed in Stage 16, RTL verified (`dir`/`lang` flip, no overflow, preference persisted) | No assistive-technology pass (no screen-reader run, no automated axe/Lighthouse-a11y report committed). The 12 images carry `alt` but **no `width`/`height`** — a CLS risk on slow connections. Arabic still needs a native-speaker review (`docs/20-arabic.md`) | Add an automated a11y check to the repo; add image dimensions; commission the Arabic review |
| **14 Development architecture** | 🟡 PARTIAL | Front-end architecture is real and documented: ES modules, no dependencies, progressive enhancement (page is complete with JS disabled), `build.js` inlines CSS/JS/fonts into one file, `tools/` generators keep data and markup in sync | Front end only. No backend, no API, no database, no environments (dev/staging/prod), no CI, no monitoring, no error tracking, no backup strategy. Deployment is a manual zip upload to Hostinger | Write the architecture decision record; choose staging vs production separation |
| **15 Admin dashboard** | ⬛ OUT OF SCOPE *(owner decision, 4 Sep 2026)* | C-8: one maintainer who edits the data files directly. `docs/36` §4 records the reasoning and four triggers that would reopen it | Not a gap: a dashboard would add a login, a database and an attack surface between one person and a JSON file they already edit | Revisit only on a trigger |
| **16 Security / secure SDLC** | 🟡 PARTIAL *(CSP shipped 4 Sep 2026)* | Zero dependencies and zero third-party JS beyond the analytics tag; no `innerHTML` or inline handlers; nosniff, referrer, permissions policies; **a build-generated CSP that names every inline script by sha256** — verified with zero violations across six pages; images self-hosted | HSTS still off until TLS is confirmed on the live domain (P0-3, blocked here). No threat model document yet | Verify live, then enable HSTS |
| **17 Development** | ✅ COMPLETE *(for the current static scope)* | The built product matches the documented system; `node build.js` runs clean and reproducibly with no toolchain; 2,555 DOM nodes; `dist/index.html` 414KB → 116KB gzipped | Complete only against a scope that was never formally agreed. Backend scope is untouched | Re-scope after Gate 01 |
| **18 QA & release readiness** | ✅ COMPLETE *(was 🟡 — executed 4 Sep 2026)* | `docs/43-qa.md` + `tools/qa.js`: data integrity against `pricing.json`, SEO, accessibility with composited contrast, bilingual parity, performance and state checks — against `dist/`, the artefact that ships. Zero findings on the final run | Browser matrix is Chromium-only in this environment; no screen-reader pass; live behaviour still unverified | Deploy, then Gate 03 |
| **GATE 03 — release approval** | ❌ NOT HELD | The site was deployed to a test domain without a release checklist, backups or monitoring | Deployment happened before the gate | Hold the gate retroactively before promoting to the real domain |
| **19 Launch & handover** | 🟡 PARTIAL *(was 🔴 — executed 4 Sep 2026)* | `docs/44-launch.md`: the three surfaces distinguished, the release runbook, the four post-upload checks, the HSTS trigger, the domain-migration procedure, and the owner's day-to-day handover with pre-upload commands. `.nojekyll` committed for the review surface | The four live checks remain unrun: this environment is blocked from both `zaokalyamamah.online` and `mashhorfoods.github.io`. HSTS, Search Console, the uptime check and a first analytics event all wait on them | Owner runs §2's four checks |
| **20 Post-launch optimization** | 🟡 PARTIAL *(was ❌ — prepared 4 Sep 2026)* | `docs/45-optimization.md`: Plausible goal setup, a KPI rulebook that pre-commits what each number changes, six falsifiable hypotheses, and a monthly review order. Ships the analytics queue stub so early events are not dropped | No data exists: the phase starts when `package_view` first appears in Realtime, which needs the deployment verified | Verify the deployment, then collect 30 days |

**Score:** 7 ✅ · 10 🟡 · 2 ❌ · 1 🔴 · 1 ⬛ out of scope = 21 phases (**Gate 01 HELD 4 Sep 2026**; Gates 02–03 unheld) — updated after Phases 01–07 ran; see `docs/28`–`docs/37`

---

## 2. Current project assessment

### Strong

- **The design system is the best asset here.** Tokens are a real single source
  of truth, the cascade is deliberate (`@layer`), and `styleguide.html` proves
  every component in isolation. This is Phase 09 done properly.
- **Craft discipline.** No invented client, statistic or testimonial anywhere —
  rare, and exactly right. `docs/18-refinement.md` deleted duplicated content
  (25,253px → 21,303px, 46 buttons → 24) rather than adding more.
- **Accessibility and responsiveness are measured, not asserted**, and this
  audit reproduced the key results independently.
- **Progressive enhancement is real.** With JavaScript off the page stays
  readable, navigable and complete.
- **Zero dependencies.** No framework, no library, no supply chain. Almost no
  static site of this size can say that.
- **Bilingual EN/AR with true RTL**, both copies in the markup so the language
  switch works without a round trip and without JavaScript-only content.

### Weak

- **No strategy layer at all.** Phases 01–04 and 07 do not exist. The site is a
  well-built answer to a question nobody wrote down.
- **No proof, no trust content.** For an agency selling credibility, the
  section that would convert is missing.
- **Leads leak.** The contact form is a `mailto:` — it opens a mail client and
  claims nothing more (honest), but on mobile a visitor without a configured
  mail app simply loses the message, and nothing is captured, stored, or
  followed up. The published address is a personal Gmail, and the "Website"
  link in Contact points at a personal GitHub portfolio, not at Pixora.
- **Nothing is measurable.** No analytics means Phase 20 can never start.
- **Nothing is editable.** A price change is a developer task.

### Technically risky

1. **Twelve hotlinked images on `i.ibb.co`** (`build.js` warns on every run).
   Third-party control over what renders inside our page, visitor IPs leaked to
   a free host, no cache control, no dimensions, and the build's zero-request
   property lost. This is the highest-severity technical finding.
2. **The live domain cannot be verified from here** — and a canonical,
   `og:url`, sitemap and HTTPS redirect are all now committed to a specific
   host. If any of it is wrong on the live server, it is wrong publicly.
3. **HSTS still off** on a domain that is now serving.
4. **The QA harness is not in the repository** — the quality claims cannot be
   re-run and will silently rot.
5. **Manual zip-upload deployment** with no staging, no rollback and no backup.

---

## 3. KEEP / IMPROVE / REBUILD / REMOVE / ADD

### KEEP (meets the standard — do not touch)

- `src/styles/` — the whole token and component system, and `styleguide.html`.
- `src/scripts/` — the ES-module architecture and its progressive-enhancement
  contract, including `navigation-map.js` as the IA source of truth.
- The build pipeline: `build.js`, `tools/*`, `site.config.json` and its refusal
  to emit a canonical it cannot justify.
- The bilingual EN/AR implementation and RTL handling.
- `docs/00-design-system.md` as the base of the master prompt.
- The "no invented content" rule.
- The `story.html` case-study format — extend it, don't replace it.

### IMPROVE

- `docs/00` → full master prompt (add brand DNA, audience, problems, strategy,
  IA, prohibitions).
- Homepage: add proof/trust; re-validate section order against a real flow.
- Contact: keep the honest no-backend `mailto:` fallback, add a real capture
  path in front of it.
- SEO: `og:image`, `apple-touch-icon`, Organization JSON-LD, hreflang
  verification.
- Images: self-host, add `width`/`height`, `loading`/`decoding`, modern formats.
- `.htaccess`: add CSP; enable HSTS once TLS is confirmed.
- QA: move the audit scripts into the repo and run them on every build.

### REBUILD

- Nothing in the front end. The build quality does not justify a rebuild.
- **The process**, not the code: phases 01–04 and 07 must be executed
  retroactively, and Gate 01 held, before any further product decisions.

### REMOVE

- The `i.ibb.co` dependency (replace with self-hosted assets).
- The personal-portfolio "Website" link in Contact, unless it is deliberately
  the agency's own reference (a decision for Phase 01).
- Any remaining stale `TODO` comments in `index.html` whose blockers have since
  been resolved by `site.config.json` (canonical and `og:url` are now generated;
  the source comments still say they are blocked).

### ADD

- Discovery, competitive intelligence, problem→solution, strategy + KPIs,
  content inventory + IA, targeted wireframes.
- Proof/trust content; About; privacy policy and terms.
- Analytics with a defined conversion event, and consent handling.
- Lead capture that does not depend on the visitor's mail client.
- Dashboard **requirements** (not the dashboard).
- A threat model, a backup plan, and a monitoring/uptime check.
- A committed QA harness and a browser/device matrix.
- An owner handover document.

---

## 4. Priority backlog

### P0 — Critical (before anything else continues)

| # | Item | Why it is P0 |
| --- | --- | --- |
| P0-1 | Execute the missing strategic foundation: phases 01 → 02 → 03 → 04, then hold **Gate 01** | Every remaining decision (proof content, page set, lead capture, dashboard, KPIs) depends on it. Continuing without it repeats the defect that produced this audit |
| ~~P0-2~~ **DONE** | Self-hosted 4 Sep 2026: the owner supplied the twelve files, converted to WebP (4.0MB → 436KB), given real `width`/`height`, and served from `dist/assets/`. No third party can change what renders inside the page any more | Third-party control of in-page content + visitor IP leakage + a live break the moment that host changes policy |
| P0-3 | Verify the live deployment (TLS, HTTPS redirect, gzip/br, `.htaccess`, extensionless routes, 404), then enable HSTS | The canonical and sitemap now point at a specific host; unverified production behaviour is a public risk. **Blocked here — see BLOCKER-1** |
| ~~P0-4~~ **DONE** | ~~Fix the lead path~~ — shipped 4 Sep 2026: every package and service CTA opens WhatsApp with the choice already written, the form gains an About field from the same source, and the address gains a copy control. See `docs/34-p0-build.md`. *(An agency-owned address still waits on C-6.)* | Lost enquiries are lost revenue; the site's only conversion currently has a silent failure mode |
| ~~P0-5~~ **DONE** | Four events instrumented and verified; **Plausible** configured and injected into the indexed pages only; `/privacy` written and shipped in both languages, naming what the site actually does — no cookies, so no banner | Without it Phase 20 is impossible and the contact form collects personal data with no stated basis |
| ~~P0-6~~ **DONE** | ~~Decide the price band and the market as one decision~~ — settled 3 Sep 2026: remote studio serving the Gulf + Egypt, priced as a new entrant in USD; new ladder live in `pricing.json`, rationale in `docs/31-strategy-kpis.md` §5 | Phase 02 finding: the published prices sit 3×–29× below the Saudi market and below the Sudanese one, in the freelance-marketplace band. That silently redefines the competitor set and contradicts the site's own craft signals. Positioning, proof strategy, conversion design and KPIs all sit downstream |

### P1 — Important (required to meet the WEBSTART standard)

- P1-1 Proof and trust — **client work may now be published anonymised (C-7, 4 Sep 2026; see `docs/35-case-studies.md`).** Also, per Phase 03 (PS-01), the rest of it never needed permission: Named human, kept response promise, the existing Behance work surfaced on the site, a Google Business Profile and one directory listing, CR/Maroof if the entity is Saudi.
- P1-2 Content inventory, sitemap and the two primary user flows (Phase 05).
- P1-3 Targeted wireframes for whatever 01–04 changes (Phase 07).
- P1-4 Master prompt completion (Phase 08).
- P1-5 Dashboard requirements definition (Phase 06) — requirements only.
- P1-6 CSP in `.htaccess`; threat model; backup + monitoring plan.
- ~~P1-7 Commit the QA harness~~ **DONE** — `tools/validate.js`, re-runnable after every change. Cross-browser and device matrix still outstanding.
  `story.html` and `404.html` to homepage depth.
- P1-8 SEO completion: `og:image`, `apple-touch-icon`, Organization JSON-LD,
  hreflang verification, Search Console.
- P1-9 Native-speaker Arabic review.
- P1-10 Image `width`/`height`, `loading`, `decoding`, modern formats.
- P1-11 About page; privacy policy; terms.
- P1-12 Prototype validation with 5 real users (Phase 12), then Gate 02.
- P1-13 Owner handover document.

### P2 — Enhancement

- Per-service inner pages once the IA justifies them.
- A second and third case study in the `story.html` format.
- FAQ section, if discovery shows the sales conversation repeats questions.
- Staging environment + scripted deploy (replace the manual zip upload).
- Automated Lighthouse/axe budget on every build.
- Split-bundle option for repeat-visit caching, alongside the single file.
- An accessibility statement.

### P3 — Future (do not let this affect current scope)

- CMS / admin dashboard implementation (only after P1-5 and a real content
  model).
- Client portal, booking or checkout flows.
- A/B testing infrastructure.
- Blog / resources section and its content operation.
- Multi-currency or multi-region expansion beyond EN/AR.

---

## 5. Recommended starting phase

> **Start at Phase 01 — Discovery & Business Analysis**, run compressed, and
> proceed 01 → 02 → 03 → 04 → 05 → 07 → **Gate 01**.

**Why not Phase 01 by default, but by evidence:** phases 01, 02, 03, 04 and 07
have *no* output in this repository, and 05 has only an implicit one. Phase 01
is therefore the earliest incomplete phase that blocks everything after it — it
is not a restart, it is the missing floor under work that is already good.

**Why not start with the UI:** the UI is not the problem. Phases 09, 10, 13 and
17 are the strongest parts of this project. Redesigning them before knowing the
audience, the competitor set and the conversion goal would destroy value.

**Compressed, not ceremonial:** the build already answers many discovery
questions implicitly (services, packages, positioning, languages, tone). Phase
01 mostly *documents and confirms* what is already decided, and asks only the
questions the repository cannot answer — audience, goals, market and
constraints.

**Run in parallel (does not depend on strategy):** P0-2 (self-host images),
P0-3 (verify the live deployment), P0-5 (analytics + privacy policy). These are
technical integrity items and holding them behind a gate helps nobody.

### Deliverables for the next phase

1. `docs/28-discovery.md` — business goals, audience segments, offering map,
   differentiators, constraints, and an audit of the current site *as a
   business instrument* rather than as code.
2. A written answer to the open questions in §6.

### Approval criteria for Gate 01

- Business goals and audience segments are written and confirmed by the owner.
- 5–7 direct + 2–3 aspirational competitors benchmarked, with a stated
  "what we do better".
- Every significant problem carries Problem → Insight → Solution → Feature →
  UX Outcome.
- Primary and secondary goals, conversion strategy and at least three KPIs are
  defined and instrumentable.
- Content inventory and sitemap approved; two primary user flows approved.
- Wireframes exist for anything 01–04 changed.
- Scope boundaries and out-of-scope items are explicit.

---

## 6. Blockers and open questions

**BLOCKER-1 — the live test domain cannot be reached from this environment.**
`https://zaokalyamamah.online` is refused by the egress policy
(`host_not_allowed`). Options: allowlist the host for this session, or paste the
output of the four checks in `docs/26-deployment.md` §"After uploading".
Until then, Phase 19 stays 🔴 and the P0-3 verification cannot be closed.

**Open questions for the owner (they gate Phase 01):**

1. Who is the legal/business entity behind Pixora, and is `zaokalyamamah.online`
   the permanent domain or a staging host?
2. Who are the target customers — segment, size, market, language split?
3. What is the primary conversion: a WhatsApp message, a call, a form, or a
   booked meeting? What does a "good month" look like in numbers?
4. Do we have permission to publish real client names, work or results?
5. Who will maintain the site day to day, and do they need to edit content
   without a developer? (This decides whether a dashboard is ever in scope.)
6. Is there an agency-owned email address and phone number to replace the
   personal ones?
7. Budget and appetite for a backend (lead capture, CRM, analytics) versus
   staying fully static.

---

## 7. Method note

Phases were scored against WEBSTART's own definition of a completed phase: a
concrete output that meets the standard. Existing code was never accepted as
evidence for a phase it does not produce — a finished homepage is evidence for
Phase 10, and for nothing before it.
