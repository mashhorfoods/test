# Architecture decisions

Written 4 September 2026. WEBSTART Phase 14's stated required action —
*"write the architecture decision record; choose staging vs production
separation"* — which has been outstanding since the audit.

---

## 0. What this is for

Every decision below was already made and is already working. None of them is
written down anywhere as a *decision* — they exist as code that behaves a
certain way, and code cannot tell you what it rejected.

That is the whole point of this file. The next person to touch this project —
including the same person in a year — will meet each of these as a constraint
and will be tempted to remove it. Each entry says what it costs, what it buys,
and **the specific thing that should make you reverse it**, so that reversing
it is a decision rather than an accident.

Format: context → decision → consequences → when to revisit. Short, because a
long ADR does not get read and an unread ADR is worse than none.

---

## AD-01 · Static site, no server

**Context.** A five-page marketing site for a studio that converts through
WhatsApp. No accounts, no user content, nothing to store.

**Decision.** Plain HTML/CSS/JS, built to files, served by a host. No backend,
no API, no database.

**Consequences.** Most of the OWASP list does not apply — `docs/58` §3 is a
table of attack surfaces that do not exist *because of this line*. Recovery is
"upload the zip again". Hosting is interchangeable. In exchange there is no
server-side anything: no form handling, no scheduled jobs, no personalisation.

**Revisit when** a booking flow, a login, a payment page or a CMS is genuinely
needed. `docs/58` §7 and `docs/57` §8 both say to rewrite themselves that day,
and they mean it: this line is what makes them true.

## AD-02 · Zero runtime dependencies

**Context.** A framework would have been faster to start and is the default
answer.

**Decision.** No framework, no library, nothing from npm reaches the browser.
Vanilla ES modules. Three build-time dependencies (`playwright-core`,
`ffmpeg-static`, `axe-core`), none of which ships.

**Consequences.** No dependency upgrade treadmill, no CVE that applies to
visitors, and a page that is mostly the site's own bytes. The cost is real:
every behaviour is hand-written, and there is no ecosystem to borrow from.

**Revisit when** a feature genuinely needs a library a person cannot write in a
week. Note that "would be easier with" is not that.

## AD-03 · Progressive enhancement, not a JavaScript application

**Context.** The site's job is to be read and to start a conversation.

**Decision.** Every page is complete and every link works with JavaScript
disabled. JavaScript adds the accordion, the language toggle, the pre-filled
WhatsApp message and the hero film — and nothing that carries meaning.

**Consequences.** A script error degrades the page instead of blanking it, and
`validate.js` walks the site with scripting off on every run to keep it true.
The cost is that some interactions are more work to build this way.

**Revisit when** — preferably never. This one is load-bearing for AD-01's
security argument and for the `@layer` floor in `docs/59` §2.

## AD-04 · Design tokens plus `@layer`, with the layer order declared once

**Context.** Specificity wars are the normal failure mode of a growing
stylesheet.

**Decision.** One token file is the source of every colour, size and duration.
`main.css` opens with `@layer reset, tokens, base, layout, components, motion,
utilities, print;` and every file declares into that order.

**Consequences.** A later layer always wins, so `!important` is nearly absent
and specificity is not an argument anyone has to have. Two things fell out of
this that would not have otherwise: **the print stylesheet is nine token
overrides rather than a second stylesheet** (`docs/43` §8), and dark/light is
a palette swap rather than a rewrite.

**The cost is stated plainly in `docs/59` §2 and is the largest single risk in
the codebase:** a browser that does not support `@layer` discards *the entire
stylesheet*. That is Safari below 15.4. Accepted knowingly.

**Revisit when** the exposed cohort matters commercially — measurable in
Plausible once it has data.

## AD-05 · Data files are the CMS

**Context.** Prices, packages, features and the case study all change, and all
of them appear in several places at once.

**Decision.** `src/data/*.json` is the source; `tools/build-*.js` generate the
markup. A price exists in exactly one place and lands on a card, a page, a
WhatsApp message and the sitemap.

**Consequences.** One edit propagates; `qa.js` asserts every rendered price
against `pricing.json`, so drift is a build failure rather than a discovery.
The cost is that changing content means running a build.

**Revisit when** somebody who cannot run a build needs to edit content. That is
C-8 and `docs/36` §4 — currently one maintainer, currently under owner
reconsideration.

## AD-06 · One file per page, assets separate above 12KB

**Context.** CSS, JS and fonts as separate files cost round trips on the mobile
connections this market actually uses.

**Decision.** `build.js` inlines CSS, JS and fonts into each page. Images under
12KB inline as data URIs; above it they are copied to `dist/assets/` and cached
once for the whole site.

**Consequences.** One request paints a page. The cost is that each page carries
its own copy of the CSS and fonts — 251–401KB per page, no cross-page cache
for them. `qa.js` §9 holds the total to 1MB per page so this cannot quietly
become expensive.

**One exception, and it is not arbitrary:** `apple-touch-icon.png` is copied
even though it is 5KB, because Safari ignores a `data:` URI in that link and
ignores it silently.

**Revisit when** repeat-visit traffic matters more than first paint — the
split-bundle option in `docs/27` P2.

**AMENDED 5 September 2026.** That trigger asks the wrong question, and
measuring it showed why. `@font-face` data is **46% of every gzipped page**,
and inlining it defeats the `unicode-range` written into `00-fonts.css`: a data
URI is not a download, so there is nothing for the browser to skip, and every
English visitor pays for the 30.9KB Arabic face on every page.

`site.config.json` `build.fonts` now offers `linked`, which copies the faces to
`assets/fonts/`, **and it is the default.** It is not a repeat-visit trade: a
first-time English visitor reading one page sends 106,577 bytes instead of
139,946, 24% less, with no cache involved. Later pages cost 57–62% less.

The premise that separate files hurt first paint is **inverted here**, because
the inlined font bytes were themselves render-blocking. On a simulated
1.6Mbps / 150ms connection, first contentful paint is **440ms linked against
648ms inline** on the homepage. The fallback-flash cost is answered by the
preload tags `index.html` has carried all along and the build used to strip.
`inline` remains available and tested. Numbers in `docs/43` §15.

## AD-07 · Manual deployment, automated verification

**Context.** One person, one host, a control-panel file manager.

**Decision.** Deployment stays a deliberate manual zip upload (`docs/44`). CI
does **not** deploy. What CI owns is whether the thing being uploaded is sound:
`.github/workflows/check.yml` builds and runs all three harnesses on every push.

**Consequences.** The moment the live site changes is a moment a person chose,
which at this size is a feature — there is no pipeline that can surprise
anyone. And the four harnesses stop being a habit: **before this, every quality
control on the project ran only when someone remembered**, which means their
value was exactly zero on the day it mattered most.

CI also asserts something nothing else did: **the committed `dist/` must match
a fresh build.** `dist/` is committed and is what the zip is made from, so
editing `src/` without rebuilding produces a repository whose source and whose
deployable disagree — silently, with the stale one being what reaches visitors.

**Revisit when** more than one person can deploy, or when uploads become
frequent enough that the manual step is the error source rather than the guard.

**One correction this made possible.** CI originally excluded `dist/sitemap.xml`
from the staleness check because its `lastmod` was the build date and therefore
differed on any day after the last commit. That exclusion was a symptom, not a
workaround: the sitemap was telling crawlers that all seven pages changed on
every rebuild, including the many rebuilds that changed nothing — and a
`lastmod` that always says "today" is discounted by search engines, so the
field was spending exactly the credibility it exists to earn. `lastmod` now
comes from a hash of each page's built bytes (`src/data/lastmod.json`), the
whole of `dist/` is deterministic, and **the exclusion is gone** — a stale
sitemap is now caught like anything else.

## AD-08 · Staging — the decision Phase 14 asked for

**Context.** Phase 14's required action was "choose staging vs production
separation". There has never been a staging environment.

**Decision.** **No separate staging host, deliberately.** Three surfaces
already exist and they cover what staging is for:

| Surface | What it is | What it catches |
| --- | --- | --- |
| **Local** | `npm run release` against `dist/` | Everything the three harnesses test, before anything leaves the machine |
| **The review surface** | GitHub Pages from the repository | What the built site looks like to someone else, on a real host, at a real URL |
| **Production** | The zip on Hostinger | Only what depends on that host: `.htaccess`, the headers, clean URLs, the 404 |

**Consequences.** A third host to pay for and keep in sync would duplicate what
the first two already do. The residual risk is honest and small: *host-specific*
behaviour is only ever seen in production. That is precisely why `docs/44` §2
defines four post-upload checks and why they are run every time — they are the
staging step, executed against production immediately after upload, with a
rollback that is the previous zip.

**Revisit when** a change is risky enough that finding out in production is
unacceptable — a domain migration, a hosting move, or anything touching
`.htaccess` structurally. At that point the cheap answer is a subdomain serving
the same zip, not a permanent environment.

## AD-09 · No error tracking

**Context.** Listed as a gap in the Phase 14 row.

**Decision.** None, and this is a decision rather than an omission. There is no
server to error. A client-side reporter would be a third-party script on a site
whose CSP currently permits exactly one, and `docs/58` T3 explains what that
costs.

**Consequences.** A JavaScript exception on a visitor's browser is invisible to
us. Mitigated by AD-03 — an exception degrades rather than blanks — and by
`validate.js`, which fails the build on any console error at three widths.

**Revisit when** the site does something a visitor can *lose* by failing. Right
now the worst case is an accordion that does not open on a page that still
reads.

---

## What has changed since the Phase 14 row was written

Four of the gaps that row listed are now closed, and it is worth being precise
about which, because the row is quoted elsewhere:

| Phase 14 said | Now |
| --- | --- |
| No monitoring | `docs/57` §5 — four monitors defined, one is the last open Gate 03 criterion, and it needs an owner account rather than a decision |
| No backup strategy | `docs/57` — written, including the finding that the three irreplaceable things are none of them in the repository |
| No CI | `.github/workflows/check.yml` — build, staleness, three harnesses, every push |
| No environments | AD-08 — decided, not deferred |

**Still true and still deliberate:** no backend, no API, no database, no
error tracking. Those are AD-01 and AD-09, and each says what would reverse it.

## Review

Re-read this when any single line above stops describing the code — not on a
schedule. An ADR that is edited to match reality is a record; one that is
reviewed on a calendar becomes a ritual.
