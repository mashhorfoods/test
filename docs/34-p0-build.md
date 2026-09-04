# Stage 34 — The P0 build

The three P0 items that need no owner decision, built against the Phase 07
wireframes. What shipped, what is measured, and what is honestly still open.

---

## 1. P0-4 — the visitor's choice now survives the click *(shipped)*

**Was:** sixteen calls to action, all saying "Start Your Project", all pointing
at one blank form. A visitor who had just chosen *Social Growth — 400 USD*
arrived at an empty message box and started again.

**Now:** every package CTA opens WhatsApp with the message already written —

> Hi Pixora — I'm interested in Branding & Design · Starter (from 290 USD, one-time).

and every service CTA does the same one level up. Both are generated from
`src/data/pricing.json` at build time, so **the message cannot quote a price the
card does not show**, and the number lives in `site.config.json` beside the
domain.

| Piece | Where | Note |
| --- | --- | --- |
| Message + link | `tools/build-pricing.js` | EN and AR built from the same package record |
| Number | `site.config.json` → `contact.whatsapp` | Missing number → CTAs fall back to `#contact` rather than rendering `wa.me/undefined` |
| Language swap | `src/scripts/contact.js` | `data-wa-en` / `data-wa-ar`; href ships as English so it works with no JavaScript |
| Remembered choice | `sessionStorage` | One visit's intent, not a preference — it dies with the tab |

**Also in the contact section** (wireframe W3): an **About** field rendered from
the same source, so a visitor who prefers email still does not retype what the
page already knew; a **copy control** on the address, because a `mailto:` that
opens nothing is the silent failure this section is being rebuilt around; and
WhatsApp marked as the **primary** channel rather than the first row of a list.

**A correction to Phase 07.** The wireframe recorded the cards as having *no
action at all*. They had one — a generic CTA pointing at the form — and the
reading came from a truncated look at the markup. The finding stands, since the
choice was still discarded at the click, but the fix is a replacement rather
than an addition. `docs/33-wireframes.md` is corrected.

### Verified

16 links; hrefs and 13 option labels swap with the document language; the
remembered package survives a round trip; no console errors; no horizontal
overflow in either direction.

---

## 2. P0-5 — instrumentation *(shipped)*, provider and policy *(open)*

`src/scripts/analytics.js` collects four events, each one answering a KPI from
`docs/31-strategy-kpis.md` §7 and nothing else:

| Event | Fires when | KPI |
| --- | --- | --- |
| `package_view` | half a card on screen for one second, once per package per visit | which packages actually sell |
| `channel_tap` | WhatsApp, phone, email or copy | K1 — today's real conversions, currently invisible |
| `enquiry_started` | the form is first engaged with | K2 |
| `enquiry_sent` | the mail handoff happens | K1, K3 |

Every event carries `lang` (K7) and, where the page knows it, the package or
service that produced it (K3). **It never carries a name, an email address, a
message or anything typed into a field.** There is no identifier and no cookie:
the only state is a per-visit set that stops one package counting twice.

### It sends nothing yet, deliberately

Choosing who receives a visitor's data is the owner's decision, not a default
inherited from a build script. With no provider named in `site.config.json`,
the module dispatches a DOM event and stops. Naming one turns it on with **no
code change** — `tools/build-deploy.js` then adds that provider's script to the
deployed pages, and says so on every run:

```
deploy files -> dist/  (…, analytics OFF (no provider in site.config.json —
                        events are collected, nothing is sent))
```

**The recommendation is Plausible or Umami** — both cookieless, both sending no
personal data, both about 1KB. That is also the honest cost to state: this
becomes **the only third-party request the site makes**. The zero-request
property is worth spending here and nowhere else, because Phase 20 cannot begin
without measurement and every KPI currently reads "unknown".

### What is still open, and why nothing was faked

The privacy policy has **not** been written, and that is deliberate. It must
name the analytics provider (not chosen) and the legal entity that controls the
data (C-6, unanswered). A privacy policy with blanks in those two places is
worse than none — it is a document that misstates who is accountable. It ships
in the same release as the provider, not before.

The page also needs the T3 content template and a shared page shell: the header
and footer are currently duplicated between `index.html` and `story.html`, and
a third page would make three copies. That is a small build change, worth doing
once rather than three times.

---

## 3. P0-2 — self-hosting the images *(blocked, mitigated)*

Twelve images are still hotlinked from `i.ibb.co`. They cannot be self-hosted
from this environment: the egress policy refuses that host, so the files cannot
be fetched here at all.

What shipped instead, so the risk is smaller while it stands:

- `loading="lazy"` and `decoding="async"` on all twelve — they are all below the
  fold, and they no longer compete with the first screen.
- A surface-coloured ground behind each one, so a third-party outage renders a
  quiet empty panel rather than twelve broken-image glyphs on a page that sells
  design work.

**To finish it:** put the twelve files under `src/assets/`, point `src="./…"` at
them, and run `node build.js` — the build then inlines them, reserved space
returns with real dimensions, and the site's zero-request property comes back.
`build.js` already lists the twelve URLs on every run.

---

## 4. Backlog after this stage

| Item | State |
| --- | --- |
| P0-2 self-host images | 🔴 blocked here — needs the files |
| P0-3 verify the live deployment | 🔴 blocked here — egress policy |
| P0-4 lead path | ✅ shipped |
| P0-5 analytics | 🟡 instrumented; provider and privacy policy open |
| P0-6 price band | ✅ decided and shipped (Phase 04) |
| P0-1 strategic foundation | ✅ Phases 01–05, 07 done; Gate 01 awaiting sign-off |

Nothing in this stage waited on C-6 to C-9. Everything left in P0 now does, or
needs a file this environment cannot reach.
