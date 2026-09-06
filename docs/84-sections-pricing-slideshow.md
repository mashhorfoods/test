# The next redesign block: sections, Services & Pricing, and the slideshow question

**6 September 2026.** Four owner questions, answered with what can be measured
here and marked clearly where it cannot.

---

## 0. What this environment can and cannot do — corrected

`docs/80` §4 said no reference site could be reached from this container. That
was right about *fetching* and wrong as a blanket statement, and the difference
matters for a competitive review:

| | |
| --- | --- |
| **WebSearch** | **Works.** Returns titles, URLs and synthesised summaries |
| **Fetching any specific page** | **Blocked.** `influenceflow.io` fails with `EGRESS_BLOCKED` exactly as `pixverse.ai` did — it is the network policy, not one domain |
| **Rendering / measuring a competitor** | **Impossible here.** Playwright cannot reach them either |

So a competitive review can be **sourced** but not **verified**. Anything below
that comes from search is cited as such; anything with a number attached to
*our* site was measured on our own build. The two are never mixed.

---

## 1. The rest of the sections — what actually blocks what

The question was when the non-hero sections get redesigned. The honest answer
is that **most of it is not blocked and can start now**; one specific decision
is, and it is smaller than it looks.

The homepage, in scroll order, carries these blocks after the hero:

> Branding & Design · Websites · Social Media Management · Digital Marketing &
> Paid Advertising · Integrated Solutions · Add-ons · Process · Final CTA ·
> Contact

Split by what each needs:

| Needs | Work | Blocked by |
| --- | --- | --- |
| **Nothing — start now** | How each section opens and closes, its internal hierarchy, its rhythm against its neighbours, one CTA per surface, how one section hands to the next | — |
| **B5 (five buyers)** | Which sections exist, what **order** they run in, and whether they are named for what we *produce* or what the buyer *wants* — `docs/80` §3.1 | Five conversations |
| **B1 numbers** | Whether our type ramp and spacing are *distinctive* rather than merely correct — `docs/70` already showed they sit inside the band | Two console pastes |

**The blocked part is naming and order only.** Everything about how a section is
*built* is available today, and that is the larger half of the work.

One small thing found while listing them: the section comments number
**two different blocks as "05"** (Digital Marketing, and Integrated Solutions).
Cosmetic, in comments only, but it is the kind of drift that makes a later
reader distrust the map.

---

## 2. Services & Pricing against the field

### 2.1 Ours, measured

`/pricing`, on our own build:

| | Desktop | Phone |
| --- | ---: | ---: |
| Page height | 8,500px | 14,960px |
| **Screenfuls to the end** | 11.1 | **17.7** |
| Tiers on the page | 12 | 12 |
| WhatsApp CTAs | 16 | 16 |
| Disclosures | 12 | 12 |
| Open by default | 0 | 0 |
| Recommended badges | 3 | 3 |

**The finding is the phone number.** A buyer on a phone scrolls nearly
**eighteen screens** past twelve packages to reach the end of the page. Four
services × three tiers is a defensible catalogue; presenting all twelve as one
uninterrupted column is what makes it eighteen screens.

### 2.2 What the field does — sourced, not verified

From search rather than measurement, so treated as direction and not as fact:

- **Tiered pricing is the norm**, with three levels the common shape — the same
  shape we use.
- **Stack vertically on phones**; horizontal scrolling of a comparison table
  fails. We already stack.
- **Use a collapsible feature list rather than a wide table.** We already
  collapse, and nothing is open by default — which is the right default.
- **Mark the intended tier** with a badge or accent rather than a louder colour.
  We have three such marks, one per service.
- Whitespace and scannability are repeatedly named as the differentiator.

**We are already doing most of what is recommended.** The gap is not the tier
design — it is that four services' worth of correct tier design sits on one
page with no way to get to the one you want.

### 2.3 The change worth making

Not a redesign of the tiers. **A way into them.** A buyer arriving for a
website should not scroll past branding to find it. That is a navigation
problem inside the page — service-level entry, then the three tiers — and it is
the single change that would move the phone number most.

Sizing it, and choosing between an in-page service switcher and four separate
service pages, is X04 work and it is **not blocked**.

### 2.4 Five named regional competitors to probe

`docs/70` benchmarked against Linear, Stripe and Vercel — correct for craft,
wrong for market: they are SaaS products, not agencies selling to the Gulf and
Egypt. Search surfaced five agencies in our actual market:

**Pro Branding** (Cairo, serving UAE/KSA/Egypt) · **Infinity Corp** (Riyadh) ·
**Emirates Graphic** (UAE) · **Prism Digital** (Dubai) · **Upscale Digital**
(Dubai/KSA)

All five are bilingual Arabic/English, which is the axis no reference has
covered yet. `tools/reference-probe.js` run on any of their services or pricing
pages returns what this container cannot fetch — and an Arabic-first run
finally closes `docs/80` §4's last gap.

---

## 3. The slideshow — where it belongs, and where it must not go

The idea is worth taking seriously and the answer is **a qualified yes, in two
specific places, built one specific way.**

### 3.1 Why not a hero carousel

Today's own measurements make this argument better than any general advice
could. `docs/83` showed that when content is hidden behind JavaScript and the
script fails, **132 blocks across four pages stayed invisible permanently.** A
carousel is that pattern by design: every slide but one is hidden, and only
script brings the rest back.

Add what this site specifically is:

- **Bilingual with true RTL.** Slide order, swipe direction and arrow meaning
  all invert. It is the most common place carousels break.
- **`prefers-reduced-motion` is honoured globally** (`docs/83` §1). Auto-advance
  would have to stop for those visitors — leaving them a control that shows one
  slide and hides the rest with no obvious way through.
- **One CTA per surface** is a rule this site holds (`docs/82` §7). Rotating
  CTAs breaks it quietly.

A hero carousel would also undo the work of the last two days: `qa.js` §14
measures how much of the scroll has a CTA in view, and §20 now guarantees no
content is stranded. A carousel argues with both.

### 3.2 Where it genuinely earns its place

**The Al Mada deliverables.** Four real artefacts — identity sheet, website,
campaign, profile — already in the repository at full resolution
(`docs/76`). Here the images *are* the evidence, and a gallery lets someone
look at the work properly instead of at thumbnails in a column.

**A future portfolio.** The same component, once there is more than one case
study. This is the piece the site is most obviously missing for an agency that
sells design.

### 3.3 How to build it here

Not a library, and not a JS carousel. **CSS scroll-snap**, which is a slideshow
that already works before any script runs:

- The slides are a scrolling row; each snaps into place. **With JavaScript off
  it is still a usable, scrollable gallery** — nothing is hidden, so nothing
  can be stranded.
- **No auto-advance ever.** It moves when the visitor moves it. That removes
  the reduced-motion problem instead of special-casing it.
- Logical properties (`inline-size`, `scroll-padding-inline`) mean **RTL works
  without a second implementation**, the way the rest of this codebase does.
- Keyboard and screen-reader behaviour come from it being a real scroll
  container with real links, not a widget pretending to be one.
- Zero dependencies, which is the rule this project has never broken.

Progressive enhancement on top — arrows, a position indicator, keyboard
paging — is then genuinely optional, because losing it costs nothing.

**Recommendation: build it for the case-study deliverables first**, where there
is real content to justify it, and reuse it for the portfolio when that exists.
Not on the hero. Not with auto-advance.

---

## 4. What this changes in the plan

| | |
| --- | --- |
| Section redesign | **Starts now.** Only naming and order wait on B5 |
| Services & Pricing | **The tiers are right.** The way *into* them is the change, and it is unblocked |
| Competitive reference | Five named regional agencies, probe-able by the owner; search can source, this container cannot verify |
| Slideshow | **Yes**, scroll-snap, case-study deliverables first, never the hero, never auto-advancing |
