# Phase 08 — The Master Prompt

WEBSTART Phase 08: one project-level instruction set. Everything Phases 01–07
established, in the order a decision needs it, so that no later piece of work
has to re-derive the foundation — or quietly contradict it.

**Authority:** this document governs. Where it summarises another, that other is
normative for detail: `docs/00-design-system.md` for token values,
`src/data/pricing.json` for every price, `docs/37-gate-01.md` for what is
frozen. Where it states a rule, the rule is the rule.

---

## 1. What this is

A remote digital studio's website. Its job is to turn a stranger into a
qualified enquiry, on a page that a buyer can price themselves against without
speaking to anyone.

**Positioning.** Pixora is a remote digital studio for small and mid-sized
businesses across the Gulf and Egypt — brand, website, content and advertising
from one team instead of four, at prices a growing business can start at.

**Three claims, each defensible:** one partner instead of four · remote by
design, which is why one studio serves Riyadh, Dubai and Cairo at one price ·
a price you can start at, published in full and explained in full.

**What it is not:** the cheapest freelancer on a marketplace, a full-service
network agency, a retainer-only shop, or a local agency pretending to have an
office in every market.

---

## 2. Who it is for

| | Audience | What they need from the page |
| --- | --- | --- |
| **Primary** | An established small business that looks unprofessional online | Proof that we are real, and a price they can judge |
| Secondary | A new venture buying a first identity | To be told what happens next, and what "from" depends on |
| Secondary | An owner who cannot keep publishing | To see that the monthly packages are a service, not a subscription trap |

They are Arabic-first and English-fluent, they compare vendors, they buy on
WhatsApp, and they will not fill in a form to find out a price.

---

## 3. The problems this site exists to solve

The eleven in `docs/30-problem-solution.md`, in the order they cost money:

1. A stranger cannot verify who they are dealing with.
2. The site learns what the visitor wants, then throws it away. *(fixed)*
3. The only conversion path can fail silently. *(fixed)*
4. Nothing says when they will hear back.
5. Prices are stated but never explained.
6. Identity signals contradict each other.
7. The business cannot see anything it does. *(fixed — Plausible, four events)*
8. Nobody can find the site who does not already know it.
9. The most expensive thing the site has — full bilingual parity — is never claimed.
10. A third party can break the services sections at any time.
11. Personal data is collected with no policy. *(fixed — `/privacy`)*

**No feature enters this site without a problem in that list, or a new one
documented the same way.**

---

## 4. Strategy and measurement

**Goals, in order:** qualified enquiries · project clients becoming retainer
clients · verifiable credibility.

**The conversion:** a package-aware WhatsApp message. Form second with the same
context prefilled, phone and email visible, `mailto:` as a fallback that cannot
fail silently.

**KPIs** (`docs/31-strategy-kpis.md` §7): enquiry rate ≥2% · package named in
≥70% of enquiries · median first reply ≤15 minutes in working hours · enquiry
→ paid ≥25% · retainer attach ≥20%. Nothing is judged before 30 days of data,
and raw enquiry volume is expected to fall after the repricing — paid projects
per month is the number that matters.

**Prices** are USD, sit at or just under the Egyptian floor and clearly under
the Gulf band, and live in `src/data/pricing.json`. Any price shown anywhere —
card, summary, form, WhatsApp message, guide — is read from that file.

---

## 5. Information architecture

```
/            homepage — one scrolling narrative, nine sections
/about       who you work with, how remote works, what we will not do
/pricing     what it costs and what changes the price
/story       one project, five chapters
/privacy     what is collected, and what is not
/work        opens at two anonymised case studies
```

- The homepage stays one page. No problem is solved by splitting it.
- Structured, repeating content gets a data file and a generator. Prose stays in
  the markup as bilingual span pairs, because that is what keeps both languages
  working with JavaScript disabled.
- One URL serves both languages until Arabic demand is measured.
- Contact is a labelled destination, not only a button.

---

## 6. Visual direction

Normative values: `docs/00-design-system.md`. The direction in one paragraph:

Dark by commitment, not by fashion — `#202020` ground, white text, a single
yellow (`#F4D13F`) that means *action* and is never decoration. Poppins for
Latin, Cairo for Arabic, both self-hosted and subset. Generous space, one
12-column grid, hairline rules instead of boxes wherever a divider will do.
Motion is a reveal, not a performance, and every animation has a
`prefers-reduced-motion` answer. The page should read as engineered rather than
decorated: the craft *is* the portfolio, and a buyer who inspects it should find
it holds up.

**Component rules that carry decisions, not taste:**

- **One primary CTA per view.** Yellow is the action colour; three yellow
  buttons in a row means none of them is the action. On package cards, only the
  featured tier is primary.
- **Every CTA carries its context.** A button that reaches WhatsApp names the
  service and the package it came from.
- **Cards are objects, not decoration.** Border, fill and radius mean "separate
  thing"; they are not applied to every block.
- **Prices are typeset, not shouted:** figure, currency, billing, in that order,
  with the currency and billing quieter than the number.
- **Proof is linked, never asserted.** Any trust claim links to something a
  stranger can check, or it is cut.

---

## 7. Non-negotiable rules

1. **Nothing is invented.** No client, statistic, testimonial, achievement,
   delivery time or outcome appears unless it came from the owner. Anonymised
   client work follows `docs/35-case-studies.md`; anonymity removes identity, it
   does not license approximation.
2. **Both languages, always.** A string that exists in English exists in Arabic
   before it ships. RTL is a mirror, not a stylesheet afterthought.
3. **It works without JavaScript.** Every script enhances markup that is already
   complete: navigation seeded, panels open, prices rendered, links real.
4. **Accessibility is a floor, not a goal.** AA contrast, 44px targets, a
   visible focus ring at every stop, landmarks, one `h1`, reduced-motion
   honoured. A change that breaks one of these is not shipped.
5. **One source per fact.** Prices in `pricing.json`, section order in
   `navigation-map.js`, Arabic in `i18n-ar.json`, domain and number in
   `site.config.json`. Duplicating a fact is a bug.
6. **Performance is a budget, not an aspiration.** No framework, no library, no
   dependency that has not earned its bytes. One third-party request exists —
   Plausible — and it was a deliberate purchase.
7. **No dark patterns.** No popups, no exit-intent, no fake urgency, no
   countdowns, no consent theatre. The site has no cookies to consent to.
8. **Say only what happened.** A status line reports the actual outcome; a
   button that cannot do something does not pretend to.

---

## 8. Prohibitions

Recorded so they cannot re-enter as someone's good idea:

- A floating chat bubble or sticky action bar.
- Testimonial or logo slots with nothing truthful to fill them.
- A pricing comparison table duplicating the cards.
- A multi-step form wizard for three fields.
- Newsletter modals, exit-intent, cookie banners.
- Stock photography of people who are not us, or of offices we do not have.
- Any number without a source.
- A CMS, a dashboard, or a login — until one of the four triggers in
  `docs/36-technical-and-data.md` §4 fires.
- Per-country pages, e-commerce, bookings, a blog programme.

---

## 9. How to use this document

**Before building anything:** the change must trace to a problem in §3 and obey
§7. If it does not, it is not built — or §3 gains a documented problem first.

**When something conflicts:** the frozen decisions in `docs/37-gate-01.md` §2
win. Changing one is a change request, recorded, not absorbed.

**When content is missing:** ship the mechanism inert rather than filling it
with a plausible guess. An empty component that renders nothing is honest; a
filled one that invents is not.

---

## 10. Status

Phase 08 complete. The P1 build follows in wireframe order — scope facts, the
verification band, About, the pricing guide — each gated on the content only the
owner can supply.
