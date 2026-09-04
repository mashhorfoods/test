# Phase 12 — Prototype & Validation

WEBSTART Phase 12: test the experience before development hardens it. Find
friction, ambiguity and missing states, and fix them.

**The prototype is the built site.** A clickable mock-up would have been a
lower-fidelity copy of something that already exists and already works without
JavaScript — so the journeys were walked against the real thing, at two widths,
in both languages, with a keyboard, and with scripting off.

---

## 1. What was walked

The two flows Phase 05 defined (`docs/32-content-ia.md` §7), plus the states
that carry them:

| # | Journey | Checked |
| --- | --- | --- |
| 1 | Every internal link and anchor, on all six pages | Dead anchors, missing page targets |
| 2 | **Flow A — price-led** | The CTA carries package, price and billing into WhatsApp · the card answers what the price buys · the choice survives a round trip to the form · at 1280 and 390 |
| 3 | **Flow B — verification-led** | The band names a person and offers links a stranger can check, all off-site |
| 4 | Language | The chosen language survives navigation between pages; no horizontal overflow in Arabic |
| 5 | No JavaScript | Navigation, prices, WhatsApp links and the scope-fact disclosure still work |
| 6 | Keyboard | A package CTA and the disclosure are reachable, and focus paints a ring |
| 7 | The drawer | A phone's only map of the site offers every destination |

It is a command now — `node tools/validate.js` — which is the other half of the
finding this phase was meant to close. Stage 16 measured the site once from an
untracked scratchpad, so nothing could be re-run and the claims rotted quietly.
These can be re-run after every change.

---

## 2. What it found

**Three findings on the first pass. One was real.**

### F-1 · The drawer was missing two destinations — *fixed*

A phone's drawer is the only map of this site, and it offered neither
**Process** nor **Contact**. The cause was structural rather than an oversight:
the header and the drawer shared one flag, so an entry was either in both
surfaces or in neither, and both had been excluded from the header for good
reasons — Contact because the header keeps one unambiguous conversion action,
Process because Gate 01 froze the header at five items.

`sectionsFor()` now knows three surfaces instead of two. `inMenu` defaults to
whatever `inNav` says, so every existing entry behaves exactly as before, and
the two that needed to differ now can.

### F-2, F-3 · False positives from the harness, not the site

The first version of the check looked for the drawer under selectors this site
does not use, and reported Pricing and About missing when both were present.
The harness was wrong, not the page. Recorded rather than quietly deleted,
because a test that lies about a pass is worse than no test.

### Two things the walk surfaced that no check had asked about

- **The header had grown to six items** — one more than Gate 01 froze, and one
  more than wireframe W7 draws. Process moved to the drawer and the footer,
  restoring *Home · Services · Pricing · Story · About*, in W7's order.
- **"Website" in the Elsewhere list** pointed at the founder's personal
  portfolio while sitting in a list beside the agency's own profiles — the
  identity mismatch PS-06 flagged, still live. It is now labelled
  **Founder's portfolio**. The destination did not change; the promise it makes
  did.

**Second pass: zero findings.** Every journey walks cleanly.

---

## 3. What this phase cannot do

**Five moderated sessions with real buyers remain outstanding.** Everything
above is a logic and flow review: it proves the site does what it claims,
in every state, on every surface. It cannot prove that a buyer *understands*
it — whether the price bands read as reasonable, whether "Ask about Starter"
sounds like a commitment, whether the Arabic reads naturally to someone who
speaks it, or whether anyone notices that chapter 05 of the case study has no
result in it.

The script is written and waiting in `docs/33-wireframes.md` §9: five people,
five tasks, pass criteria for each. It needs five people and about two hours —
and it is the last thing Gate 02 should wait for.

---

## 4. Status

| | |
| --- | --- |
| Phase 12 — logic and flow validation | ✅ complete, and re-runnable |
| Phase 12 — moderated sessions | ❌ outstanding: needs five buyers |
| P1-7 — a committed QA harness | ✅ closed by `tools/validate.js` |
| Gate 02 | Ready when the five sessions are done, or when the owner accepts the risk of skipping them |
