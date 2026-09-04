# Phase 06 — Technical Discovery & Data Architecture

WEBSTART Phase 06, closed 4 September 2026 by two owner decisions:

> **C-8 — "I will maintain the content myself, no CMS needed."**
> **C-9 — follows from it:** the site stays static. No backend is bought for
> content, and none is needed for leads now that the conversion runs through
> WhatsApp deep links (`docs/34-p0-build.md`).

Everything below is the consequence of that, written down so the decision is
inspectable rather than assumed.

---

## 1. Platform direction

| | Decision | Why |
| --- | --- | --- |
| Front end | Semantic HTML, token-driven CSS, vanilla ES modules. **No framework, no library, no dependencies** | Already true, already measured: 146KB gzipped, no supply chain to audit. Nothing in Phases 01–05 asked for more |
| CMS | **None** | C-8. One maintainer who edits the files directly |
| Backend | **None** | C-9. No accounts, no server-side forms, no database |
| Auth | **None** | Nothing to sign in to. This removes an entire class of risk rather than deferring it |
| Analytics | Plausible, cookieless | Phase 04's KPIs need it; it is the only third-party request the site makes |
| Hosting | Hostinger, static files | Adequate for the whole architecture above |
| Deployment | `dist/` uploaded as one zip | Manual, and honest about it — see §5 |

---

## 2. The data model

There is no database. There are five files, and each owns exactly one thing:

| File | Owns | Rendered by |
| --- | --- | --- |
| `src/data/pricing.json` | Services, packages, levels, prices, billing, features, notes — and now the WhatsApp message each package produces | `tools/build-pricing.js` |
| `src/data/story.json` | The case study: five chapters, both languages | `tools/build-story.js` |
| `src/data/i18n-ar.json` | Arabic for every non-package string | `tools/build-i18n.js` |
| `src/scripts/navigation-map.js` | Section order, every navigation label, UI strings | Header, drawer and footer at runtime |
| `site.config.json` | Domain, page list, WhatsApp number, analytics provider | `tools/build-deploy.js` |

**The rule that keeps it coherent:** anything structured and repeating gets a
file and a generator; prose stays in the markup as bilingual span pairs, which
is what keeps both languages working with JavaScript disabled. A price exists in
one place, and the card, the summary line, the form's About field and the
WhatsApp message all read it. They cannot disagree.

`src/pages/` holds page content only — no header, no footer, no scripts;
`tools/build-pages.js` reads the shell from `index.html`.

---

## 3. Maintaining it — the runbook

The site now builds with **one command**. `node build.js` runs the content
generators first, then bundles: forgetting a step is no longer possible.

```bash
node build.js      # regenerates markup, builds dist/, writes pixora-site.zip
```

| To change… | Edit | Then |
| --- | --- | --- |
| A price, a package name, a feature line | `src/data/pricing.json` | `node build.js` |
| The case study | `src/data/story.json` | `node build.js` |
| Any Arabic string | `src/data/i18n-ar.json` | `node build.js` |
| A navigation label or the section order | `src/scripts/navigation-map.js` | `node build.js` |
| The privacy page (or a future About / pricing page) | `src/pages/*.html` | `node build.js` |
| Homepage prose | `index.html` — **both** language spans | `node build.js` |
| The WhatsApp number, the domain, analytics | `site.config.json` | `node build.js` |

**To publish:** upload everything in `dist/` to `public_html`, or upload
`pixora-site.zip` and extract it there. `.htaccess` is a dotfile — Hostinger's
File Manager hides it by default, and without it you lose compression, caching
and the 404 route. Full steps: `docs/26-deployment.md`.

**Two rules worth keeping:**

1. Never edit `dist/` — it is generated, and the next build overwrites it.
2. Every price on the page is business data. Change it in `pricing.json`; the
   four places it appears follow.

---

## 4. The admin dashboard — out of scope, by decision

WEBSTART Phase 15 is not being built. That is a scope decision, not an omission:
there is one maintainer, who edits the files, and a dashboard would be a login
screen and a database standing between that person and a JSON file they can
already edit. It would add authentication, session management, an attack
surface and a hosting bill to solve a problem nobody has.

**Revisit when any of these becomes true** — and not before:

- A second person needs to change content and should not touch the repository.
- Content edits become weekly rather than occasional.
- Enquiry volume outgrows a WhatsApp inbox and needs a record with a status.
- Something on the site becomes genuinely dynamic (bookings, stock, accounts).

Recorded here so a future "we should have a dashboard" has to argue against a
written reason rather than fill a gap.

---

## 5. Environments, backups, monitoring

| | Today | Recommendation |
| --- | --- | --- |
| Environments | One: the live test domain | Adequate now. A `staging.` subdomain serving the same `dist/` is worth it the first time a change needs review before it is public |
| Source of truth | Git, on GitHub | Already a backup: every version of every file, recoverable |
| Site backup | `pixora-site.zip`, regenerated each build | Keep the last two. A rollback is an upload, not a restore |
| Monitoring | None | One free uptime check on the homepage. A static site fails by disappearing, and nothing currently notices |
| CI | None | Not justified at one maintainer. The single build command replaces it |

---

## 6. Security requirements (where Phase 16 begins)

The architecture removes most of the classic risks by having no server, no
accounts and no dependencies. What remains is concrete:

| Requirement | State |
| --- | --- |
| No secrets in the repository | ✅ nothing to keep — no API keys, no tokens |
| Dependency risk | ✅ zero: no npm packages ship, and none are installed to build |
| Injection surface | ✅ no `innerHTML`, no inline handlers, no user input rendered anywhere |
| Transport | 🟡 HTTPS redirect is configured; **HSTS still off** until TLS is confirmed live (P0-3) |
| Headers | ✅ nosniff, referrer policy, permissions policy — **and a CSP, generated by the build** (below) |
| Third-party content | ✅ closed: the twelve images are self-hosted; one third-party origin remains, the analytics script, and the CSP names it explicitly |
| Personal data | ✅ none stored: enquiries live in an inbox, analytics is aggregated, `/privacy` says so |
| Backups | ✅ git + the upload zip |

---

### 6.1 The Content Security Policy

Written by `tools/build-deploy.js` rather than by hand, because it contains
**the sha256 of every inline script**, which changes whenever the JavaScript
does. Each page inlines its own module; the policy names it by hash, so no
`'unsafe-inline'` is needed for scripts and a tampered script simply does not
run.

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self';
form-action 'self' mailto:; img-src 'self' data:; font-src 'self' data:;
style-src 'self' 'unsafe-inline'; script-src 'self' https://plausible.io <hashes>;
connect-src 'self' https://plausible.io
```

Two decisions worth stating:

- **`style-src` keeps `'unsafe-inline'`.** The markup carries style
  *attributes* (`--i: 0` on animated list items), which hashes cannot cover —
  that needs `'unsafe-hashes'`, which buys less than it costs. Scripts are
  where the risk is, and scripts are locked.
- **`form-action` allows `mailto:`**, because the contact form's fallback
  submits to one. Without it the no-JavaScript path would silently fail, which
  is the exact failure mode this project spent PS-03 removing.

Verified by serving `dist/` with the real header and walking all six pages,
switching language and opening a disclosure on each: **zero violations, and
every page still works.**

## 7. What Phase 06 leaves open

Not blockers for Gate 01, and each already has an owner in the backlog:

- **P0-2** the twelve images — needs the files.
- **P0-3** live verification, then HSTS — needs access to the domain from a
  network that can reach it.
- **CSP** — write it once the image hosting is settled, so the policy describes
  the finished set of origins rather than the current one.

---

## 8. Status

Phase 06 is **complete**. With Phases 01–05 and 07 already delivered, every
structural phase now has its output, and **Gate 01 is ready to be held** —
`docs/37-gate-01.md`.
