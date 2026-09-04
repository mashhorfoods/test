# Phase 19 — Launch & Handover

WEBSTART Phase 19: release safely, and hand over something the owner can run.

Three surfaces now exist, and they are not equivalent. Most of this document is
about telling them apart, because a check that passes on the wrong one proves
nothing.

---

## 1. The three surfaces

| | URL | What it is | Serves |
| --- | --- | --- | --- |
| **Review** | `mashhorfoods.github.io/test/` | GitHub Pages, straight from the repository | The **modular source** — `index.html` and `src/` |
| **Live** | `zaokalyamamah.online` | Hostinger, the real deployment | The **built bundle** — `dist/`, uploaded |
| **Future** | `pixora.net` or similar | Not yet registered | Will serve the same `dist/` |

### What the review surface cannot tell you

GitHub Pages ignores `.htaccess`. Everything that file does is therefore
**absent** there:

- **No security headers** — no CSP, no `nosniff`, no referrer or permissions
  policy. Do not judge security from Pages.
- **No rewrite rules** — `/story` will 404; only `/story.html` resolves. On the
  live host both work.
- **No custom 404 route** — GitHub serves its own.
- **No canonical host redirect.**

What Pages *is* good for: reading the pages, checking copy in both languages,
looking at layout on a real phone, and sharing a link for review. That is the
job it has, and it does it without an upload.

**One deliberate consequence:** the pages carry a canonical pointing at
`zaokalyamamah.online`. On Pages that is a cross-domain canonical, and it is
correct — it tells search engines the review copy is not the original, so the
two do not compete.

**Analytics:** the tag is injected into `dist/` only, so the source pages on
GitHub Pages report nothing. Review there and the numbers stay clean. If you
ever open `/test/dist/index.html`, you are generating live analytics events
from a review surface — don't.

`.nojekyll` is committed so Pages serves the files as they are rather than
running them through Jekyll.

---

## 2. Releasing to the live host

Everything needed is in `pixora-site.zip`, rebuilt on every `node build.js`.

```bash
node build.js          # content, pages, dist/, then the zip
```

**Upload** the zip to `public_html` and extract it there. Nine files plus
`assets/`:

```
index.html  pricing.html  about.html  story.html  privacy.html  404.html
.htaccess   robots.txt    sitemap.xml   assets/ (12 images)
```

`.htaccess` is a dotfile — Hostinger's File Manager hides dotfiles by default.
Turn on "Show hidden files" before uploading, or you lose compression, caching,
the security headers, the CSP and the 404 route in one silent step.

**Enable SSL first** (hPanel → Security → SSL). `.htaccess` redirects http to
https; without a working certificate that redirect sends visitors somewhere the
server cannot answer.

### The four checks, in order

```bash
# 1  the site loads and the header shows five items
open https://zaokalyamamah.online/

# 2  the rewrite is live — no .html, and it resolves
open https://zaokalyamamah.online/story
open https://zaokalyamamah.online/pricing

# 3  our 404, not the host's
open https://zaokalyamamah.online/nothing-here

# 4  compression, headers and the policy are actually being sent
curl -sI -H 'Accept-Encoding: gzip' https://zaokalyamamah.online/ \
  | grep -iE 'content-encoding|content-security-policy|x-content-type|referrer'
```

Check 4 is the one that catches a missing `.htaccess`: no `content-encoding`
and no `content-security-policy` means the dotfile did not upload.

### Then, and only then

1. **HSTS.** Once check 4 shows the site is genuinely serving TLS:
   set `"hsts": true` in `site.config.json`, run `node build.js`, upload again.
   One field — the header survives every future build, and nobody has to
   remember to re-add it to a hand-edited server file. Not before: it is cached
   by browsers for a year, so switching it on early locks visitors out of a
   site that cannot answer.
2. **Plausible** — confirm the site is created there with the domain exactly as
   `site.config.json` has it, then load a page and watch one event arrive.
3. **Search Console** — add the property, submit `sitemap.xml`.
4. **An uptime check** on the homepage. A static site fails by disappearing,
   and nothing currently notices.

---

## 3. Moving to the real domain later

The domain lives in one field. Changing it regenerates every derived thing —
canonical, `og:url`, `sitemap.xml`, the `Sitemap:` line in `robots.txt`, and
the analytics domain.

```bash
# 1  edit site.config.json  →  "url": "https://pixora.net"
# 2  rebuild
node build.js
# 3  upload the new zip to the new host
# 4  keep the old host alive and 301 it at the new one, if you can
# 5  rename the site in Plausible to the new domain, or create it and accept
#    the history split
# 6  add the new property in Search Console and use Change of Address
```

Nothing else in the repository names a domain. That is why it is one line.

---

## 4. Handover — what the owner runs

Day to day, three things:

| To… | Do | Then |
| --- | --- | --- |
| Change a price, a package, a feature | Edit `src/data/pricing.json` | `node build.js`, upload |
| Change any other Arabic string | Edit `src/data/i18n-ar.json` | `node build.js`, upload |
| Change a page's words | Edit `src/pages/*.html` or `index.html` — **both language spans** | `node build.js`, upload |

Before every upload:

```bash
node build.js          # regenerates content, pages, dist/ and the zip
node tools/validate.js # the seven journeys still walk
node tools/qa.js       # the deployed artefact still passes
```

Both harnesses exit non-zero on a serious finding, so "it printed nothing bad"
is a real answer.

**Never edit `dist/`** — it is generated, and the next build overwrites it.
**Never edit a price in the markup** — four surfaces read it from the data file.

**If a release goes wrong:** the previous `pixora-site.zip` is a complete
rollback. Keep the last two. The repository is the deeper backup: every version
of every file, recoverable.

---

## 5. What is verified, and what is not

| | State |
| --- | --- |
| The bundle builds reproducibly, one command | ✅ |
| The artefact passes QA and the journey walks | ✅ zero findings, both harnesses |
| CSP correct and violation-free | ✅ verified by serving `dist/` with the real header |
| Deployment package complete, dotfile included | ✅ nine files + `assets/` |
| **Live TLS, redirect, compression, rewrite, 404 route** | 🔴 **unverified — this environment cannot reach either domain** (`EGRESS_BLOCKED` for both) |
| HSTS | ❌ deliberately off until the above is checked |
| Analytics receiving events | ❌ needs one live page load |
| Search Console, uptime monitor | ❌ not set up |

**Phase 19 is complete on everything that can be done from here.** The four
checks in §2 are the last step, and they need someone on a network that can
reach the domain.

---

## 6. Gate 03

`docs/46-gate-03.md` will be a go/no-go decision, and it needs exactly one
input that does not exist yet: the output of the four checks. Paste them and
the gate closes.
