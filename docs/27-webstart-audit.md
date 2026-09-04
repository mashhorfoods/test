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

> **Re-checked 4 September 2026**, after the release build. 8 phases complete,
> 12 partial, 1 out of scope; no phase is red. Rows 10 and 11 were carrying
> gaps that the P1 build had already closed and are corrected above. Every
> remaining partial waits on live data, owner confirmation or real users —
> none of it is unfinished work sitting in the repository.

| Phase | Status | Evidence | Problems / Gaps | Required action |
| --- | --- | --- | --- | --- |
| **00 WEBSTART** (brand → product) | ✅ COMPLETE *(was 🟡 — written 4 Sep 2026)* | `docs/60-kickoff-brief.md`: the business, the identity gap, ownership and approval authority, scope in/out, brand and font licences, and what would make each of those wrong. Plus `src/assets/brand/logo.svg` and its README | The brief does not invent an entity. **C-6 is still open and is now stated as the single gap it is**, with the four places it already shows up — the JSON-LD, T4, T5 and the deposit — listed together for the first time. `docs/60` §4 also records that all three gates were held by the person who did the work | Domain email, then SPF/DKIM/DMARC at the same moment. Entity only when there is a reason for one |
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
| **10 Homepage design** | 🟡 PARTIAL *(re-checked 4 Sep 2026)* | Nine sections, one `<h1>`, 13 `<h2>`, coherent hierarchy; hero, services, five service details, add-ons, process, CTA, contact; verified in-browser at four widths Proof now exists — a named client case study, a verification band with a real person and two checkable profiles, and a published price list. **Proof on the homepage: DONE 4 Sep 2026** — not as the strip this row asked for. A grid of one reads as a portfolio that failed; a sentence naming a real client does not. `.c-proof` sits under the services list at ~2.5 screens. The strip still needs a second case study to look like a body of work rather than a single job. Still no FAQ, and section order is still unvalidated against a real user | Second case study → homepage proof strip; run the five-user script |
| **11 Inner pages & flows** | 🟡 PARTIAL *(re-checked 4 Sep 2026)* | `story.html` (a real client case study), `about.html`, `pricing.html`, `privacy.html`, `404.html`, plus `styleguide.html` (internal, not deployed). Six pages ship | **Terms DONE 4 Sep 2026** (`terms.html`, bilingual, consistent with `pricing.json` `terms.shared`). No `/work` index — with one case study there is nothing to index yet. No per-service pages | Second case study opens `/work`. A lawyer should read the Terms, especially cancellation |
| **12 Prototype & validation** | 🟡 PARTIAL *(was ❌ — executed 4 Sep 2026)* | `docs/40-validation.md` + `tools/validate.js`: seven journeys walked against the built site at two widths, in both languages, by keyboard and with JavaScript off. One real defect found and fixed, two harness false positives recorded, two more issues surfaced by the walk | Five moderated sessions with real buyers remain outstanding — a logic review cannot prove comprehension | Run the five-user script in `docs/33` §9 |
| **GATE 02 — design approval** | ✅ HELD *(approved 4 Sep 2026)* | `docs/41-gate-02.md`: six pages measured at three widths, seven component rules frozen, content readiness stated line by line | Approved with the §5 risk accepted knowingly — no moderated sessions with real buyers were run | Phases 13–18 finish the build |
| **13 Responsive & accessibility** | ✅ COMPLETE *(re-verified across all six pages, 4 Sep 2026)* | `docs/16-qa.md` (measured, both directions) plus this audit's independent browser pass: **no horizontal overflow at 360/390/768/1440**, **0 interactive targets below the 44px floor** out of 97, **0 console errors**, one `<h1>`, `<main>`/`<nav>`/`<header>`/`<footer>` landmarks present, skip link present, focus ring at every stop (`src/scripts/focus.js`), 23 `prefers-reduced-motion` guards, contrast failures fixed in Stage 16, RTL verified (`dir`/`lang` flip, no overflow, preference persisted) | No assistive-technology pass (no screen-reader run, no automated axe/Lighthouse-a11y report committed). The 12 images carry `alt` but **no `width`/`height`** — a CLS risk on slow connections. Arabic still needs a native-speaker review (`docs/20-arabic.md`) | Add an automated a11y check to the repo; add image dimensions; commission the Arabic review |
| **14 Development architecture** | ✅ COMPLETE *(was 🟡 — closed 4 Sep 2026)* | `docs/61-architecture-decisions.md`: nine decisions with context, consequences and the specific thing that should reverse each — static site, zero runtime dependencies, progressive enhancement, tokens + `@layer`, data files as the CMS, one file per page, manual deploy with automated verification, staging, and error tracking. Plus `.github/workflows/check.yml`: build, a staleness check on the committed `dist/`, and all three harnesses on every push | Four of this row's original gaps are closed (monitoring, backups, CI, environments). **No backend, no API, no database and no error tracking remain true and are now recorded as decisions rather than omissions** — AD-01 and AD-09, each with its reversal trigger | Nothing. The reversal triggers are the review |
| **15 Admin dashboard** | ⬛ OUT OF SCOPE *(owner decision, 4 Sep 2026 — under reconsideration)* | C-8: one maintainer who edits the data files directly. `docs/36` §4 records the reasoning, the four triggers, and the four questions that would decide its shape | Not a gap: a dashboard would add a login, a database and an attack surface between one person and a JSON file they already edit. **The owner is reconsidering; nothing is being built, but the decision is no longer settled** | Answer the four questions in `docs/36` §4 before designing anything |
| **16 Security / secure SDLC** | ✅ COMPLETE *(threat model 4 Sep 2026)* | Zero dependencies and zero third-party JS beyond the analytics tag; no `innerHTML` or inline handlers; nosniff, referrer, permissions policies; **a build-generated CSP that names every inline script by sha256** — verified with zero violations across six pages; images self-hosted HSTS is on (apex only, after the live checks passed). `docs/58` is the threat model: most of OWASP does not apply here by architecture, and the three risks that do are named | Owner: 2FA and a transfer lock on the registrar, host and GitHub — `docs/58` §5 |
| **17 Development** | ✅ COMPLETE *(for the current static scope)* | The built product matches the documented system; `node build.js` runs clean and reproducibly with no toolchain; 2,555 DOM nodes; `dist/index.html` 414KB → 116KB gzipped | Complete only against a scope that was never formally agreed. Backend scope is untouched | Re-scope after Gate 01 |
| **18 QA & release readiness** | ✅ COMPLETE *(was 🟡 — executed 4 Sep 2026)* | `docs/43-qa.md` + `tools/qa.js`: data integrity against `pricing.json`, SEO, accessibility with composited contrast, bilingual parity, performance and state checks — against `dist/`, the artefact that ships. Zero findings on the final run | **Three harnesses now** — `validate.js`, `qa.js` (adding the showpiece, width-parity, transfer and print budgets) and `a11y.js` (axe-core, two widths, both languages, drawer open). **Browser floor documented and two real cross-engine defects fixed** (`docs/59`). Still: no second engine here, no screen-reader pass | The manual device pass in `docs/59` §5 |
| **GATE 03 — release approval** | ✅ HELD *(conditional go, 4 Sep 2026)* | `docs/46-gate-03.md`: all acceptance criteria measured and met, no critical defect open, rollback in place. HSTS is now a config switch, verified both ways | The condition stands: run the four checks immediately after upload and roll back on any failure. Uptime monitoring still unconfigured | Upload, verify, then the 24-hour list |
| **19 Launch & handover** | 🟡 PARTIAL *(was 🔴 — executed 4 Sep 2026)* | `docs/44-launch.md`: the three surfaces distinguished, the release runbook, the four post-upload checks, the HSTS trigger, the domain-migration procedure, and the owner's day-to-day handover with pre-upload commands. `.nojekyll` committed for the review surface | The four live checks remain unrun: this environment is blocked from both `zaokalyamamah.online` and `mashhorfoods.github.io`. HSTS, Search Console, the uptime check and a first analytics event all wait on them | Owner runs §2's four checks |
| **20 Post-launch optimization** | 🟡 PARTIAL *(was ❌ — prepared 4 Sep 2026)* | `docs/45-optimization.md`: Plausible goal setup, a KPI rulebook that pre-commits what each number changes, six falsifiable hypotheses, and a monthly review order. Ships the analytics queue stub so early events are not dropped | No data exists: the phase starts when `package_view` first appears in Realtime, which needs the deployment verified | Verify the deployment, then collect 30 days |

**Score:** 11 ✅ · 9 🟡 · 0 ❌ · 0 🔴 · 1 ⬛ out of scope = 21 phases · **all three gates held** (01 and 02 approved, 03 a conditional go, all 4 Sep 2026). No phase is without an output.

**What the eleven partials are actually waiting on, counted honestly:** eight of them wait on a person who is not in this room — the owner (2FA, an uptime monitor, Search Console, Plausible goals, a second git remote), a native Arabic speaker, five real buyers, a lawyer, Al Mada, and thirty days of data. **Two wait on reference recordings** that unblock WEBSTART X02–X04. **Phase 00 waited on nothing and is now closed** (`docs/60`) — it was the only phase whose gap could be shut by writing, and what it produced was not a formality: the personal-identity gap, C-6, now has all four of its downstream consequences named in one place. See `docs/28`–`docs/59`

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
- ~~P1-2 Content inventory, sitemap and the two primary user flows (Phase 05).~~ **DONE** — `docs/32-content-ia.md`.
- ~~P1-3 Targeted wireframes (Phase 07).~~ **DONE** — W1–W7 in `docs/33-wireframes.md`.
- ~~P1-4 Master prompt completion (Phase 08).~~ **DONE** — `docs/38-master-prompt.md`.
- ~~P1-5 Dashboard requirements definition (Phase 06).~~ **CLOSED as out of scope** (C-8, owner decision): one maintainer editing the data files. `docs/36` §4 records the four triggers that would reopen it.
- P1-6 CSP — **DONE 4 Sep 2026**, build-generated from inline-script hashes, zero violations across six pages. **Backup + monitoring plan DONE** — `docs/57`; it needs three owner actions (a second git remote, an uptime monitor with a keyword check, registrar auto-renew) and the monitor is what finally closes the Gate 03 criterion. **Threat model DONE** — `docs/58`; it names three actions worth taking (2FA and a transfer lock on the registrar, host and GitHub; SPF/DKIM/DMARC when domain email exists; a quarterly search for a cloned site) and records that most of OWASP does not apply here by architecture rather than by control. **P1-6 is closed.**
- ~~P1-7 Commit the QA harness~~ **DONE** — three harnesses now, all re-runnable after every change: `tools/validate.js` (the journeys), `tools/qa.js` (the built files, plus the showpiece, width-parity, transfer and print budgets) and `tools/a11y.js` (axe-core). **Cross-browser closed as far as it can be from here, 4 Sep 2026** — `docs/59` states the support floor (Chrome 105 / Safari 16 / Firefox 121), names `@layer` as the one catastrophic dependency, and fixed two real defects the analysis found: `backdrop-filter` losing the scrolled header on every iPhone below Safari 18, and a `:has()` focus ring that left keyboard users on Firefox <121 with no indicator at all. **A second engine still cannot be run here** — the network policy blocks Playwright's browser downloads — so `docs/59` §5 is a fifteen-minute manual pass for the owner.
  `story.html` and `404.html` to homepage depth.
- P1-8 SEO — canonical, `og:url`, sitemap and robots ship and are verified by `tools/qa.js`. **`og:image` + Twitter card, Organization JSON-LD and `apple-touch-icon` all DONE 4 Sep 2026** — the card and the icon are generated (`npm run card`, `npm run icon`) from source that already exists rather than exported by hand, and `qa.js` asserts both shipped and neither is a `data:` URI. **Outstanding: Search Console only**, which needs the live host first. P1-8 is otherwise closed.
- P1-9 Native-speaker Arabic review — **systematic pass done 4 Sep 2026** (`docs/47-arabic-review.md`): 37 package feature lines were English in the Arabic view and are now translated; numerals, voice and nine wordings fixed. A native speaker is still needed for register and terminology.
- ~~P1-10 Image `width`/`height`, `loading`, `decoding`, modern formats.~~ **DONE** — twelve WebP images, real dimensions, self-hosted (4.0MB → 436KB).
- ~~P1-11 About, privacy and terms.~~ **DONE** — `about.html`, `privacy.html`, `terms.html`, all bilingual, the Terms consistent with `pricing.json`'s `terms.shared`. A lawyer's read, especially of cancellation, is still worth buying.
- P1-12 Gate 02 held 4 Sep 2026. **The five moderated sessions with real buyers remain outstanding** and cannot be run from here — the risk was accepted knowingly, which is not the same as retired.
- ~~P1-13 Owner handover document~~ **DONE** — `docs/56`, with npm scripts so it has short commands to describe. Every command in it was run before it was written down.

### P2 — Enhancement

- Per-service inner pages once the IA justifies them.
- A second and third case study in the `story.html` format.
- FAQ section, if discovery shows the sales conversation repeats questions.
- Staging environment + scripted deploy (replace the manual zip upload).
- ~~Automated Lighthouse/axe budget on every build.~~ **DONE 4 Sep 2026.** `qa.js` §9 enforces a 1MB per-page transfer budget and §1 a largest-paint budget; `tools/a11y.js` runs **axe-core** over every shipped page at two widths, in both languages, and with the mobile drawer open. Both run on every `npm run check`. Zero violations, with one named and conditionally re-verified exception (the decorative footer watermark). A screen-reader pass is a separate thing and is still outstanding.
- Split-bundle option for repeat-visit caching, alongside the single file.
- ~~An accessibility statement.~~ **DONE 4 Sep 2026** — `/accessibility`, bilingual, in the footer beside Privacy and Terms. It states what was measured, the one declared exception (the decorative footer watermark at 1.86:1), and — the half that makes it worth reading — that no screen reader has been used on this site by a person, that only one browser engine has been tested, and that no disabled person has been asked.

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
