# X05 — the redesign direction, in full

**6 September 2026.** WEBSTART X's X05 asks for five things: *Current →
Desired → Why → What changes → What stays.* One decision inside it was made
early and shipped — the showpiece budget, `docs/53`. This is the rest.

It is written late on purpose. A direction statement written before X03 and
X04 would have been a preference; written after them it is a summary of
decisions already tested against a reference and a build.

---

## 1. Current

Not adjectives — the numbers the site actually has, measured on the 6 September
build with both interactive features in it.

| | Phone (390) | Desktop (1440) |
| --- | ---: | ---: |
| Homepage, before scrolling | **418KB** | 1138KB |
| Full homepage scroll | 745KB¹ | — |
| Homepage length | 25.3 screenfuls | 18.6 |
| Visible calls to action | 17 | 17 |
| WhatsApp links on the homepage | 5 | 5 |
| Horizontal overflow | none | none |

¹ `docs/92` §3.1, measured **before** both interactive features. Every other
number in this table is from the 6 September build with them in it. The
full-scroll figure is therefore a floor, not a current reading — it is left
here because what it bounds (the sixteen lazy images) did not change, and
flagged because a stale number in a table headed *Current* is exactly the kind
of thing this project keeps finding.

Harnesses: `validate` 0 findings, `qa` 0 high / 0 medium / 1 expected low,
`a11y` 0 violations, one argued exemption.

**What is genuinely good.** Both languages are first-class and RTL is real
rather than mirrored. Nothing on the site depends on script to be readable —
`docs/83` measured 132 blocks that would strand if it did, and that is now
guarded. Every visible string exists in both languages, and a guard fails when
one does not. The type ramp, spacing ladder and control sizes sit inside the
reference band and ahead of it on target sizes (`docs/70`).

**What is still weak.** The four service blocks repeat their structure, and
`docs/55` §6 refused to guess between three ways out — that refusal still
holds and it is B5's to answer. Section naming is feature-named where the
reference is outcome-named (`docs/80` §3.1), also B5's. And the measurable
competitive benchmark cannot be finished in this container at all: WebSearch
works, fetching any specific page does not.

---

## 2. Desired

> **The fastest credible agency site in its market, in two languages, that a
> buyer can act on from any screen without being sold to twice.**

Each clause is there because something measured put it there:

- **Fastest** — `docs/52`: a buyer in the Gulf or Egypt on mobile data bounces
  before a heavy hero finishes. Speed is not craft here, it is reach.
- **Credible** — `docs/80`: the reference earns attention with a real first
  step, not with weight.
- **In two languages** — no reference in `docs/70` was bilingual. This is the
  one axis where the market's competitors are the right benchmark and the
  design references are not.
- **Act on from any screen** — P1-2 found a phone visitor with no call to
  action for up to 5.5 screens; P1-5 closed it.
- **Without being sold to twice** — `docs/81`: the four service names appeared
  three times in one screen. Repetition reads as padding, not emphasis.

---

## 3. Why — the one trade that governs the rest

Everything contested on this project reduces to the same trade: **weight
against impression.**

`docs/53` settled it for the hero — one budgeted showpiece, desktop only, a
still frame on the phone. That decision was correct and it holds.

What `docs/53` did not anticipate is that the hero was not the only thing that
would ask for weight. §5 is what happened when something else did.

---

## 4. What changes

| | | Where |
| --- | --- | --- |
| The way into Services & Pricing | 17.7 screenfuls past twelve packages, with no service-level entry, became a service index | `docs/87` |
| Section-level structure | How each section opens, closes and hands off; one CTA per surface | `docs/88` |
| The funnel's ending | The hero routes to `#contact`; `#contact` was the bare part, and the reference's "first real step" was adapted to land there | `docs/82` |
| Motion | A systematic pass, with the reduced-motion promise made true rather than claimed | `docs/83` |
| A slideshow | Scroll-snap, no script required, RTL for free — and never the hero | `docs/86` |
| `/about` | Images, split rows, a scroll language | `docs/93`–`95` |
| Two interactive features | Mystery Reward, The Brand Challenge | `docs/96`, `docs/97` |

**Still to change, and honestly blocked:** the four-block repetition (B5), the
outcome-vs-feature naming (B5), the measurable benchmark and the regional
competitor review (B1's two probe runs).

---

## 5. The budget that did not exist — and now does

This is the finding this document was worth writing for.

`docs/53` budgeted the video, and `qa.js` §7 enforces it: file format, total
bytes, `poster`, `preload="none"`. It is a good guard and it has held.

It budgets **video**. Nothing budgeted anything else.

| | Homepage HTML |
| --- | ---: |
| Before Feature 01 | 307KB |
| After Feature 01 — Mystery Reward | 327KB |
| After Feature 02 — The Brand Challenge | 356KB |

And what a phone pays before it scrolls: **314KB on 6 September** (`docs/92`
§3.1) → **418KB now**. A third more, in two days, for two features.

Neither feature was wrong to build; both were asked for, and both are honest
about what they are. The problem is that **the number the entire positioning
rests on moved 33% and nothing said a word.** The per-page check that exists
is a 600KB *ceiling* measured on a 1280px context — the desktop path — so it
would not have noticed the homepage doubling.

Two smaller facts fall out of the same measurement:

- The challenge's CSS is **6.6KB** and the reward's **3.2KB**, and both ship
  inlined into all nine pages — including `/404`, `/privacy` and `/terms`,
  which have neither component. That is the single-file build working as
  designed (one file to upload, `docs/89`), and it is a real cost that the
  design decision has been paying quietly.
- `docs/92` §3.2 verified once that a phone never requests the film. Nothing
  kept it verified, and it is the reason the phone number is affordable at all.

**`qa.js` §29** now measures the homepage at 390px with no scroll, budgets it
at **460KB**, and fails HIGH if a phone ever requests the film. The budget sits
above today's 418KB deliberately: it is a ratchet against the next unbudgeted
feature, not a demand to undo the last two.

> The rule, stated so it survives this document: **a budget nobody measures is
> a budget that grows.** That sentence was already written in `qa.js` §7 about
> video. It was true about everything else too.

### 5.1 The guard, negative-tested — and the test that lied twice

| Mutation | Result |
| --- | --- |
| Budget lowered to 300KB | fires — MED, names the real 418KB |
| §29's viewport widened to 1440 so the film loads | fires — HIGH, names `hero.webm`; bytes jump to 1138KB |

The second row also caught a defect in the guard's own reporting: the summary
line printed *"film not requested"* unconditionally, so a run that had just
raised a HIGH about the film still said the film was not requested underneath
it. Fixed — but worth noting that only a negative test could have found it,
because on a passing run the sentence is true.

The second row took two attempts, and the first attempt is worth recording
because it is the **third** appearance of this project's signature failure.

I widened the viewport with a string replacement limited to the first match.
Three lines in `qa.js` set a 390px viewport, and the one I meant was the
*third*. The mutation changed §14's context instead, §29 ran unaltered, and the
output was a clean pass — byte-identical to the unmutated run, which was the
only thing that gave it away.

So: `docs/97` §10 recorded a test harness that short-circuited and never ran
the thing it was testing. This is the same shape one layer down — the run
happened, but on code that had not been changed. Both produce the same
artefact: **a green result that proves nothing.** The tell in both cases was a
number that did not move when it should have. That, not the pass itself, is
what to read.

---

## 6. What stays

Not by default — each of these was re-examined and kept.

| | Why it stays |
| --- | --- |
| **Zero runtime dependencies** | Every dependency is a supply chain and a weight. Nothing has needed one yet |
| **Readable without script** | `docs/83` measured what the alternative costs: 132 stranded blocks. This is the site's strongest structural property |
| **The single-file build** | §5 prices it honestly. One file to upload is what makes a non-technical second operator possible at all (`docs/85`, `docs/89`) — that is worth 9.8KB a page |
| **Both languages, always** | Not a feature. A guard fails when a string exists in one |
| **One showpiece, desktop only** | `docs/53`. Re-affirmed, and now joined by a second budget rather than replaced |
| **Dark side left** | `docs/80` §2.3 — held against the reference's opposite choice, because bilingual decides it and a bright region cannot be mirrored into safety |
| **The token layer** | `docs/70` — inside the reference band, ahead on target sizes. The gap was never in the numbers |
| **No carousel in the hero** | `docs/86`. A scroll-snap gallery is script-optional; a carousel is the stranding pattern by design |

---

## 7. What this does not decide

Named so it is not mistaken for complete:

- **The four service blocks' structure** — B5. `docs/55` §6 refused to guess
  between three options and X05 does not overrule that refusal.
- **Section naming and order** — B5, `docs/80` §3.1.
- **The measurable competitive benchmark** — B1's two probe runs. This
  container can source a comparison but never verify one.

X05 is complete for everything that does not wait on a person.
