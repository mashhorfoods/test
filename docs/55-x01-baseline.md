# WEBSTART X · X01 — Baseline Audit

The current site, frozen and measured **4 September 2026**. Not a completeness
audit — `docs/27` already does that and says the site is built. This asks the
other question: **is it good?**

Everything below is measured in a browser at 1440×900 and 390×780, not
asserted. The harness is `scratchpad/x01.js`; the numbers reproduce.

---

## 1. The shape of the homepage

| | Desktop 1440 | Phone 390 |
| --- | --- | --- |
| Page height | 19,553 px | 29,486 px |
| **In screens** | **21.7** | **37.8** |
| Interactive targets | 120 | 120 |
| First price appears | 3.5 screens in | 5.0 screens in |
| First WhatsApp link | 4.3 screens in | 7.8 screens in |

**Thirty-eight screens on a phone.** That is the single largest fact about this
site and no phase has ever named it. For comparison, the entire Al Mada case
study — five chapters, a scroll narrative built to be long — is a fraction of
it.

The price arriving at 3.5 screens is genuinely good and was not luck: it came
out of the Phase 03 work. **The problem is not where the page starts. It is
that it does not stop.**

## 2. Where the length is

| Section | Desktop | Phone | Words | Links |
| --- | --- | --- | --- | --- |
| home | 0.92 | 1.30 | 49 | 1 |
| services | 1.56 | 1.69 | 202 | 10 |
| **branding** | **2.20** | **4.91** | 212 | 7 |
| **websites** | **3.00** | **5.77** | 224 | 7 |
| **social** | **2.75** | **4.65** | 231 | 7 |
| **marketing** | **2.89** | **5.46** | 324 | 7 |
| integrated | 1.65 | 3.00 | 140 | 5 |
| add-ons | 2.19 | 3.52 | 165 | 1 |
| process | 1.12 | 2.13 | 141 | **0** |
| start | 0.79 | 0.68 | 22 | 1 |
| contact | 1.37 | 2.27 | 143 | 8 |

**The four service sections are 50% of the desktop page and 55% of the phone
page.** Four blocks of near-identical structure, 212–324 words each, seven
links each. A buyer who has decided they want a website reads three sections
that are not about websites, or learns to scroll past a rhythm that repeats
four times.

**Every section costs roughly twice as many screens on the phone.** Branding
goes 2.20 → 4.91, websites 3.00 → 5.77. That is the arithmetic of stacking a
multi-column layout into one column, and it is the measured form of a claim
made in `docs/27`: mobile here is *verified*, not *designed*. Nothing overflows
and every target clears 44 px — and the phone visitor still pays double for the
same content.

**`process` has zero links.** 141 words, 1.12 screens on desktop and 2.13 on
the phone, and no way out of it except scrolling. It sits at 79% down the page,
directly before the closing CTA — the last thing a buyer reads before being
asked to act, and it is a dead end.

## 3. The finding that matters most

**Eight of the thirteen package CTAs do not exist on a phone.**

Measured: 17 `wa.me` links in the page, 13 laid out on desktop, **5 on the
phone**. In each of the four service sections, three `.c-tier__cta` buttons are
`display: none` below 48em and one `.c-detail__action` stands in for them.

That is a deliberate rule, and `service-detail.css` explains itself:

> *Three buttons under three side-by-side cards are PARALLEL … Stacked into one
> column they stop being parallel and become CONSECUTIVE — the same label, to
> the same anchor, three times per service … Nothing is lost: every one of
> these buttons was the same button.*

**It was right when it was written, and P0-4 made it wrong.** Those buttons are
no longer the same button — not in label, not in destination:

| | Desktop tier CTA | Phone stand-in |
| --- | --- | --- |
| Label | "Ask about **Starter**" / "**Professional**" / "**Advanced**" | "Ask about this service" ×4 |
| Message | `I'm interested in Branding & Design · Professional (from 590 USD, one-time)` | `I'd like to talk about Branding & Design.` |
| `data-about` | `branding:tier-professional` | **absent** |

Three consequences, in order of cost:

1. **The phone buyer cannot say which package they want.** The package-aware
   WhatsApp link — the whole of P0-4, the fix for the site's only conversion
   path — reaches desktop only.
2. **Analytics is blind on the phone.** `data-about` is what carries the
   package into `enquiry_started`. Phase 04's KPIs and the Phase 20 baseline
   about to be built on them are **systematically desktop-skewed**, in a market
   reached mostly on phones. We would have drawn conclusions from that.
3. **The About field never pre-fills.** `contact.js` reads the same attribute
   into `sessionStorage`; on a phone the form asks a question the buyer already
   answered by tapping.

Nobody introduced a bug. A rule stopped being true and no check watched it —
`qa.js` counts wa.me links but never compared the count *between widths*.

## 4. KEEP / IMPROVE / REBUILD / REMOVE / ADD

**KEEP** — do not touch these in X06:

- The price at 3.5 screens, and prices published at all.
- The hero: one screen, a real proposition, now with a film behind it.
- Bilingual parity and true RTL. It survives every measurement.
- One request, ~100 ms paint. The reference sites cannot say this.
- The verification band — real name, checkable profiles, a reply promise.

**IMPROVE**

- **Section rhythm.** Four service blocks at 50–55% of the page, each a near
  copy of the last. This is the single largest experience gap.
- **The phone is stacked, not designed.** 2× the screens for the same content.
- **`add-ons`**: 2.19 screens, 165 words, **one** link. Long for what it does.
- **Motion**: 79 transitions, 62 reveals, 3 keyframes, 23 reduced-motion
  guards. Hover and reveal are covered; nothing marks *state change* or
  *progress*, which is where motion earns its place.

**REBUILD**

- **The phone package CTA.** Not a redesign — a regression to close (§3).

**REMOVE**

- Nothing. There is no dead weight here, only length.

**ADD**

- **A way out of `process`.** Zero links at 79% down the page.
- **Proof on the homepage.** One case study exists and the homepage does not
  show it.
- **A width-parity check in `qa.js`** — the same interactive affordances must
  exist at 390 as at 1440, or the difference must be deliberate and named.

## 5. What this changes about what comes next

X06's list was going to start with navigation and hero. It should not.

1. **Close the phone CTA regression.** Conversion and measurement, on the
   majority device.
2. **Add the width-parity check**, so it cannot recur silently.
3. **Then** section rhythm — the biggest experience gap, and the one that most
   needs the reference analysis X03 has not been able to run.

The hero was worth building. It was not the most valuable thing on this page,
and X01 is how that becomes knowable rather than arguable.
