# Phase 20 — Post-Launch Optimization

WEBSTART Phase 20: improve using evidence, not aesthetic preference.

**There is no evidence yet.** Analytics is instrumented and configured, but the
site has not been verified live and no event has ever been received. So this
phase does the only honest thing it can do before data exists: it decides **in
advance** what the numbers will mean, and what each one would change — so that
when they arrive, the response is a decision rather than an opinion.

---

## 1. One fix shipped with this phase

**The analytics queue stub.** The provider's tag is deferred, so it lands after
the document is interactive — but our own events start earlier: a package
counts as read after one second on screen, and a visitor can press a CTA before
the script arrives. Without a stub, `window.plausible` is undefined at that
moment and the event is dropped silently.

The build now injects the standard queue stub ahead of the tag, so early events
queue and flush when the script loads. If the script never loads — a blocker, an
outage — the queue simply grows and nothing else notices, which is the right
behaviour for a metric.

This also moved the CSP to the last step of the deploy build: the policy names
every inline script by hash, so it can only be written once the pages are final.
Writing it first produced a policy that forbade a script the same build had just
added. Verified: three hashes, zero violations, pages still work.

---

## 2. Setting up the measurement — 20 minutes, once

In Plausible, for the site whose domain matches `site.config.json`:

1. **Create four goals**, as custom events, named exactly:
   `package_view` · `channel_tap` · `enquiry_started` · `enquiry_sent`
2. **Enable custom properties** for `about`, `channel` and `lang`. They carry
   which package, which channel, and which language — without them the counts
   are true but useless.
3. **Check the first event.** Load the live homepage, scroll to a package, wait
   two seconds. `package_view` should appear in Realtime. If it does not, the
   tag or the domain is wrong — nothing downstream is worth reading until it is.

---

## 3. The KPI rulebook — decided now, applied later

Each row states what the number means, and **what it changes**. Committing to
this before seeing the data is the point: it is what stops a bad month becoming
an argument about taste.

| KPI | Read as | If it is low | If it is high |
| --- | --- | --- | --- |
| **K2 · enquiry rate** (qualified enquiries ÷ unique visitors), target ≥2% | Whether the page persuades at all | Below 1% with healthy `package_view` → people read and do not act: the missing piece is trust, so ship the second case study before touching layout | Above 4% → the price may be under the market; revisit the band before adding traffic |
| **K3 · package-named share**, target ≥70% | Whether the conversion carries context | Below 50% → buyers are using the generic header CTA instead of the card. Weaken the header CTA before strengthening the cards | Near 100% → the funnel works; spend the next effort on traffic, not on the page |
| **K4 · median first reply**, target ≤15 min | The one advantage a small studio structurally has | Above one hour repeatedly → the promise on the site is a lie. Change the promise, do not hope |
| **K1 · qualified enquiries/month** | Volume | Falling after the repricing is **expected** — judge with K5, never alone | — |
| **K5 · enquiry → paid**, target ≥25% | Whether enquiries are the right ones | Below 15% → the page is attracting the wrong buyer: tighten who the packages say they are for | Above 40% with low K1 → we are under-marketed, not over-priced |
| **K6 · retainer attach**, target ≥20% | Whether project clients stay | Below 10% → the handover moment is not selling the monthly work; that is a process fix, not a page fix |
| **K7 · Arabic share** | Whether bilingual parity is paying for itself | Under 15% of sessions → question the cost of maintaining two languages before adding a third page | Over 40% → introduce `/ar/` URLs for the pricing guide first (IA-4's trigger) |
| **`package_view` distribution** | Which tier people actually read | If the cheapest tier dominates → the ladder is mispriced or the middle is not differentiated | If the top tier dominates → we are under-charging |
| **Homepage section reach** | Where readers stop | Reliable drop before Services → the hero is not doing its job. That is the only finding that would justify touching the hero |

---

## 4. What we believe but have not measured

Recorded as falsifiable hypotheses, so that a month from now nobody can claim
they knew all along.

| # | Hypothesis | How it gets tested | What would falsify it |
| --- | --- | --- | --- |
| H-A | WhatsApp will outperform the form by a wide margin | `channel_tap{channel}` split | Form submissions within 30% of WhatsApp taps |
| H-B | The scope facts reduce "what's included?" questions | Count those questions in the inbox for a month | The question keeps arriving at the same rate |
| H-C | The pricing guide will be an entry point from search | Sessions entering on `/pricing` | Fewer than 5% of sessions after two quarters |
| H-D | Naming Al Mada raises trust enough to matter | Enquiry rate before and after the second case study | No movement when the second one ships |
| H-E | The new price band reads as credible, not cheap | K5 — do enquiries convert to paid? | Enquiries arrive and never convert |
| H-F | Arabic readers convert at least as well as English | K7 crossed with `enquiry_sent{lang}` | Arabic sessions convert materially worse — a language quality problem, not a design one |

---

## 5. The review, monthly

Thirty minutes, in this order, so the cheapest questions come first:

1. **Did anything break?** Uptime, console errors after a deploy, the build's
   own warnings.
2. **K1–K4** against last month, with the rulebook above.
3. **One hypothesis** from §4 — is there enough data to settle it yet?
4. **The inbox** — what did buyers actually ask that the site should have
   answered? That question has produced more of this project's improvements
   than any metric.
5. **Decide one change.** One. Ship it, and let the next review judge it.

---

## 6. The first thing to optimise is not on this list

Chapter 05 of the case study has no result in it, and the second case study does
not exist. No amount of measurement will fix either — but both would move K2
more than any layout change available.

**The data will not tell you to go and ask Al Mada for a sentence. It will only
show, eventually, that you should have.**

---

## 7. Status

| | |
| --- | --- |
| Instrumentation | ✅ four events, verified firing, queue-stubbed, CSP-clean |
| Measurement plan, KPI rulebook, hypothesis backlog, review cadence | ✅ this document |
| Baseline and first review | ❌ needs 30 days of data, which needs a verified deployment |

Phase 20 is **ready to run**, not run. It starts on the day `package_view`
first appears in Realtime.
