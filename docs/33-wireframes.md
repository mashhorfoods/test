# Phase 07 — UX Wireframes

WEBSTART Phase 07: solve layout and flow before visual polish. Low fidelity, in
this project's own terms — the design system already exists, so a wireframe here
decides **structure, hierarchy, order and states**, not colour or type.

**Scope rule: only what Phases 01–05 changed is drawn.** The hero, the services
accordion, the process section, the story page and the footer chrome are built,
measured and validated; re-drawing them would be work with no decision in it.

Seven wireframes. Each states the problem it answers, the layout, the mobile
behaviour, the states, and what would prove it worked.

---

## W1 · The package card — the one that matters

**Answers:** PS-02 (the choice is discarded) and PS-05 (the price is unexplained).

**What is there today**, confirmed from the markup: level mark · name · purpose ·
price · feature list · and a generic "Start Your Project" that points at the
blank contact form. *(Corrected: this document first recorded the card as
having no action at all, from a truncated read of the markup. The finding is
unchanged — the choice is discarded at the click — but the fix is a replacement
rather than an addition.)*

```
DESKTOP — three cards per service, unchanged grid
┌───────────────────────────────┐
│ ◆ FOUNDATION                  │  level mark + level name      (unchanged)
│                               │
│ Starter                       │  package name                 (unchanged)
│ A foundational identity for   │  purpose                      (unchanged)
│ new or small projects.        │
│                               │
│ From 290 USD · One-time       │  price block                  (unchanged)
│                               │
│ ✓ Professional logo design    │
│ ✓ Colour selection            │  features                     (unchanged)
│ ✓ Font selection              │
│ ⌄ Show all 7 features         │
│                               │
├───────────────────────────────┤  ← NEW: hairline, not a new card
│ Delivery      5–7 days        │
│ Revisions     2 rounds        │  NEW · scope facts, 3 always visible
│ You own       Source files    │
│ ⌄ What's not included         │  NEW · disclosure: exclusions, what
│                               │        "from" depends on, payment terms
├───────────────────────────────┤
│ [ Ask about Starter  ⟶ ]      │  NEW · package-aware CTA, primary style
│   opens WhatsApp, pre-written │        on the featured tier only
└───────────────────────────────┘
```

**The CTA carries the choice:** `wa.me/<number>?text=Hi Pixora — I'm interested
in **Branding · Starter** (from 290 USD). ` — rendered from `pricing.json`, so
the message can never quote a price the card does not show.

**Hierarchy decision:** one primary-styled CTA per service (the featured tier),
the other two secondary. Three primaries per service × four services = twelve
shouting buttons, which is how the page got to 83 in the first place.

**Mobile:** cards stack; scope facts stay visible (they are the reason to
believe the price); the exclusions disclosure stays collapsed; the CTA is
full-width and sits inside the card, not floating.

**States:** no WhatsApp on the device → the same button falls back to the
contact section with the package pre-selected in the form · JS disabled → the
CTA is a plain `wa.me` link and still carries the text · RTL → mirrored, arrow
flips.

**Proves it worked:** ≥70% of enquiries arrive naming a package (K3), and the
"how much is it really / what's included?" exchange disappears from the inbox.

---

## W2 · The verification band

**Answers:** PS-01 (nothing is checkable) and PS-04 (no response promise).

Placed **above the footer, below the final CTA** — the last thing read before
leaving, and reachable from the About page and the contact section.

```
┌──────────────────────────────────────────────────────────────────────┐
│  WHO YOU'RE TALKING TO                                               │
│                                                                      │
│  ┌────────┐   Name Surname                    We reply within        │
│  │ photo  │   Founder & lead designer         2 working hours        │
│  │        │   Working remotely with clients   Sun–Thu, 9:00–18:00    │
│  └────────┘   across the Gulf and Egypt       (GMT+3)                │
│                                                                      │
│  Check us:  [ Work on Behance ]  [ Google profile ]  [ Directory ]   │
└──────────────────────────────────────────────────────────────────────┘
```

Four claims, each verifiable in one click, none needing a client's permission.
The photo is not decoration: at $1,200 from a remote studio, a face is evidence.

**Mobile:** stacks to photo + name, then promise, then a two-column link grid.

**States:** any "check us" link without a live destination is **omitted, not
greyed** — an empty proof slot is worse than none. Response promise renders from
one string so it cannot disagree between here, the contact section and the
package CTA.

**Proves it worked:** median first response ≤15 minutes in working hours (K4),
and Flow B stops dead-ending.

---

## W3 · Contact, re-ordered by channel

**Answers:** PS-03 (silent failure) and PS-06 (mixed identity signals).

Same section, same components, different order and one new element.

```
┌───────────────────────────┬──────────────────────────────────────────┐
│ TALK TO US                │  SEND A BRIEF                            │
│                           │                                          │
│ [ WhatsApp  ⟶ ]  primary  │  About    [ Branding · Starter      ⌄ ]  │  NEW
│  +xxx xxx xxxx            │           ← pre-selected when arriving   │
│                           │             from a package CTA           │
│ Phone   +xxx xxx xxxx     │  Name     [                           ]  │
│ Email   hello@domain      │  Email    [                           ]  │
│         [copy]      NEW   │  Brief    [                           ]  │
│                           │           [                           ]  │
│ We reply within 2 working │                                          │
│ hours, Sun–Thu 9–18 GMT+3 │  [ Send ]   Opens your mail app.         │
│                           │             Prefer WhatsApp? ⟶           │
│ Elsewhere                 │                                          │
│ [Behance] [LinkedIn]      │                                          │
└───────────────────────────┴──────────────────────────────────────────┘
```

**Changes:** WhatsApp becomes the primary action, not a line of text · the email
gets a copy control, because a `mailto:` that opens nothing is the failure mode
· the form gains an "About" select, pre-filled from the package the visitor came
from · the status line says only what happened · the stray "Website" link to a
personal portfolio is either relabelled as the founder's work (W2) or removed.

**Mobile:** channels first, form second. A buyer on a phone should not scroll
past a form to find WhatsApp.

**Proves it worked:** no enquiry path can complete believing it sent something
that did not send.

---

## W4 · T3 — the content page template

**Answers:** IA-6. One template, three pages, and the fourth costs nothing.

```
┌──────────────────────────────────────────────────────────────┐
│ header (existing, unchanged)                                 │
├──────────────────────────────────────────────────────────────┤
│   EYEBROW                                                    │
│   Page title                                    ~65ch measure│
│   Standfirst, one or two lines.                              │
│                                                              │
│   ── body ────────────────────────────┐  ┌── aside ────────┐ │
│   H2, prose, lists, tables            │  │ On this page    │ │
│   (tokens already exist for all)      │  │ · Section       │ │
│                                       │  │ · Section       │ │
│                                       │  │                 │ │
│                                       │  │ Related         │ │
│                                       │  └─────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ [ CTA band — reuses the existing #start section ]            │
│ verification band (W2) · footer (existing)                   │
└──────────────────────────────────────────────────────────────┘
```

**Mobile:** the aside moves above the body as a collapsed "On this page", or is
dropped entirely on pages under ~600 words.

---

## W5 · About

**Answers:** PS-11 and Flow B step 2. One screen of substance, no padding.

```
EYEBROW  ABOUT
H1       A remote studio for the Gulf and Egypt
Stand    One team for brand, website, content and ads — working with
         clients wherever they are.

H2  Who you work with        → the named human, role, background      (W2 photo)
H2  How remote actually works → the six published stages, restated as
                                what a client experiences; how files,
                                approvals and calls happen
H2  What we charge, and why   → two lines + link to /pricing
H2  What we will not do       → the honest limits. This is a trust
                                device, not a disclaimer
[ CTA band ] [ verification band ]
```

**Rule:** no invented history, no "founded in", no team of stock faces. Every
line is checkable or it is cut.

---

## W6 · `/pricing` — the guide

**Answers:** PS-08 (invisible in search) and PS-05, in one page.

```
EYEBROW  PRICING
H1       What a project costs, and what changes the price
Stand    Every package and price we publish, plus the things that move
         a quote up or down.

┌ What changes a price ────────────────────────────────────────┐
│ Scale · Content readiness · Languages · Integrations ·        │
│ Turnaround. One short paragraph each — this is the part       │
│ competitors leave out and buyers search for.                  │
└───────────────────────────────────────────────────────────────┘

For each service (4 blocks):
   H2  Branding & Design          Range: from 290 USD
   ├ the three package cards      ← generated from pricing.json (W1)
   ├ scope facts                  ← same source, same fields
   └ "Which one is right?" — three sentences, one per tier

┌ How we bill ─────────────────────────────────────────────────┐
│ Deposit · milestones · what monthly packages include ·        │
│ ad spend is separate · currency and payment methods           │
└───────────────────────────────────────────────────────────────┘
[ CTA band ] [ verification band ]
```

**Generated, not typed.** Cards and facts render from `pricing.json` through the
existing generator, so the guide cannot drift from the homepage — the failure
mode that killed the old separate Pricing section.

---

## W7 · Navigation

```
HEADER   Pixora   Home  Services  Pricing  Story  About      EN|AR  [ CTA ]
                                  ↑NEW           ↑NEW
DRAWER   Home / Services (5 children) / Pricing / Story / About / Contact
                                                                    ↑NEW label
FOOTER   Quick links (+About +Pricing) · Services · Legal (+Privacy) ·
         verification block (W2, compact)
```

All three surfaces still render from `navigation-map.js`. Header stays at five
items; Contact is a labelled destination in the drawer and footer, not only a
button (IA-5).

---

## 8. Patterns considered and rejected

| Pattern | Why not |
| --- | --- |
| Floating WhatsApp bubble | Every competitor has one, and it covers content on mobile. W1's per-card CTA converts at the moment of decision instead of following the reader around |
| Sticky mobile action bar | Same reasoning; revisit only if K3 shows package CTAs are being missed |
| Pricing comparison table | The cards already compare. A table would duplicate them and break the "one source, one place" rule |
| Testimonial slots left empty for later | An empty proof slot invites filling it dishonestly |
| Multi-step form wizard | Three fields do not need steps, and every step is a place to drop out |
| Exit-intent or newsletter modal | Spends the trust the page is trying to build |

---

## 9. What each wireframe must prove (Phase 12 test plan)

| Wireframe | Test with 5 users | Pass |
| --- | --- | --- |
| W1 | "Find the package you'd choose and start a conversation about it" | Reaches WhatsApp with the package named, no backtracking |
| W1 facts | "What would you get, and what would you not get, for this price?" | Answers both without asking us |
| W2 | "Who would you be hiring, and how would you check?" | Names the person and opens one proof link |
| W3 | "Send us a brief" | No user believes they sent something that did not send |
| W6 | "Roughly what would your project cost?" | Lands within one tier of the right answer |

---

## 10. Handover to Gate 01

Structural work is complete: strategy, competitor set, problem chain, IA and
these wireframes. Gate 01 is now an approval decision, not a work item —
`docs/34-gate-01.md` will carry the checklist.

**Still open, and they belong to the gate, not to the drawings:** C-6 (entity and
an agency-owned email — W2 and W3 both display it), C-7 (client work — decides
whether `/work` leaves the deferred list), C-8 and C-9 (Phase 06's remaining
half).

---

## 11. Next

**GATE 01 — structural approval.** Then Phase 08 extends the master prompt, and
the P0 build items — self-hosted images, the package-aware handoff, analytics
and the privacy policy — can start.
