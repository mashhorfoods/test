# The pre-launch pass

**6 September 2026.** X11's gate criteria, applied early — everything that can
be checked before the site is on a real server. One finding, and it is a
question rather than a defect.

---

## 1. The finding: the site is about to publish under a domain that is not ours

Every indexable page carries:

```
<link rel="canonical" href="https://zaokalyamamah.online/…">
```

The sitemap lists seven URLs on that host, the social share tags point at it,
and Plausible analytics is keyed to `data-domain="zaokalyamamah.online"`.

**This is not new, and it was asked before.** `docs/28` §C-5, from discovery:

> *"Is `zaokalyamamah.online` a staging host or the permanent domain?"*

and line 198 of the same document records it as *"unrelated to the Pixora
brand"*. **The question was never answered**, and publishing is the moment it
stops being theoretical: canonical tags pointing at a host you do not intend to
keep are among the more irritating things to unwind afterwards, because search
engines believe them.

**It is one field.** `site.config.json` → `url`, which the handover already
describes as *"one field moves the whole site to a new domain"* — plus
`analytics.domain` beside it. Nothing else needs touching.

**This is the only thing in this pass that should stop an upload.**

---

## 2. What had never actually been tested: the production headers

Every harness in this project serves `dist/` over a plain local server that
sends **none** of the headers `.htaccess` sets. So the Content-Security-Policy —
which the build regenerates on every build, carrying a `sha256` for each inline
script — had never been exercised against the pages it governs.

That matters because of the *shape* of the failure: a stale or missing hash
breaks the live site completely while every local check stays green.

**Served all nine pages with the real headers applied** — `Content-Security-
Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Cache-Control`:

| | |
| --- | --- |
| CSP violations | **0**, across all nine |
| Page errors | **0** |
| `js` class set, motion reporting ready | **every page** |
| Reveals fired | 46 on the homepage, 11 on `/pricing`, 1 elsewhere |

The policy itself reads correctly: `default-src 'self'`, `object-src 'none'`,
`frame-ancestors 'self'` (which supersedes `X-Frame-Options`), `form-action
'self' mailto:` — which is exactly what the contact form needs and nothing
more — and `plausible.io` allowed in `script-src` and `connect-src` only.

### 2.1 A duplicate I wrote and removed

I then added a `qa.js` section to check the CSP hashes permanently — and it was
already there, at line 602, doing the same job and two more besides (unused
hashes, and whether the analytics origin matches the analytics setting).

Removed. **I should have grepped before building**, and the cost of not doing
so is a harness with two checks that disagree the day one of them changes. The
runtime verification above is the part that was genuinely new; it is recorded
here rather than re-implemented.

---

## 3. Everything else, checked and clean

| | |
| --- | --- |
| **Meta** | `title`, `description`, `canonical`, Open Graph, Twitter, `lang` — complete on all seven indexable pages. Titles 14–43 chars, descriptions 72–143 |
| **404** | Correctly `noindex, follow`, and correctly **absent** from the sitemap |
| **Sitemap / robots** | Seven URLs, no 404, no styleguide. `robots.txt` names the sitemap |
| **Structure** | **32 combinations** — 8 pages × 2 languages × 2 widths — no horizontal overflow, no empty headings |
| **Headings** | One `h1` per page, **zero level skips** across 47 homepage headings and 20 on `/pricing` |
| **Images** | All 16 referenced; **no orphans** in source, none in `dist/assets` |
| **Contact details** | Consistent across every page and `site.config.json` — guarded by `qa.js` §19 |

### 3.1 Weight, measured on a phone

| Page | Requests | After a full scroll |
| --- | ---: | ---: |
| Homepage | 18 | 745KB |
| `/story` | 11 | 495KB |
| `/pricing` | 6 | 352KB |
| Everything else | 5–6 | 197–219KB |

The homepage's 745KB is **after scrolling past all sixteen images**. What a
phone actually pays to see the first screen is **314KB**.

### 3.2 The film does what it claims

A documented decision, never verified until now:

| | Film requested? |
| --- | --- |
| Phone, motion allowed | **no** |
| Phone, reduced motion | **no** |
| Desktop, motion allowed | yes — `hero.webm` |
| Desktop, **reduced motion** | **no** |

So the 720KB film is desktop-only *and* respects the motion preference, and a
phone visitor never pays for it. First screen is 314KB in every case where the
film does not load.

---

## 4. What this pass cannot cover

Four things need the site to be on the real server, and they are `docs/44` §2's
post-upload checks:

- **HTTPS and the certificate**, then HSTS once every subdomain serves TLS.
  The header is already set at `max-age=31536000` — one year — so it should be
  confirmed working *before* anyone relies on it.
- **The `.htaccess` rewrite** — `/pricing` serving `pricing.html`. The harnesses
  reproduce this rule; only the real server proves it.
- **Search Console**, and a first analytics event actually arriving.
- **An uptime check.**

None of them can be done from here, and none of them is a reason to delay the
upload — they are the first hour after it.

---

## 5. Verdict

**One blocker, and it is a decision rather than a repair: the domain.**

Everything else is green. `validate.js` 0 · `qa.js` 0 high, 0 medium · `a11y.js`
0 violations · every page clean under the production CSP · `dist/` contains no
file that no page references.
