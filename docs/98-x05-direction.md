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
§3.1) → **450KB now**. Nearly half as much again, in two days, for two
features.

Neither feature was wrong to build; both were asked for, and both are honest
about what they are. The problem is what was watching, and the first version
of this section got that wrong.

**It is not that nothing measured it.** `qa.js` §9 has measured the phone's
first screen all along, and *printed it on every single run*:

```
·  index.html   phone 829KB · desktop 829KB (first screen 450KB) + 720KB showpiece
```

That line was on screen while the number went from 314KB to 450KB. §9 budgets
`full` at 1MB — a different promise to a different person, the reader who
scrolls rather than the buyer deciding whether to stay — and printed `first`
with no threshold on it at all.

So the failure is worse than an absent measurement and more ordinary: **a
number nobody acts on is not a guard.** The fix is therefore not a new check
but a threshold on the existing one — 480KB, in §9, beside the measurement
that was already there.

Two smaller facts fall out of the same measurement:

- The challenge's CSS is **6.6KB** and the reward's **3.2KB**, and both ship
  inlined into all nine pages — including `/404`, `/privacy` and `/terms`,
  which have neither component. That is the single-file build working as
  designed (one file to upload, `docs/89`), and it is a real cost that the
  design decision has been paying quietly.
- `docs/92` §3.2 verified once that a phone never requests the film. Nothing
  kept it verified, and it is the reason the phone number is affordable at all.

**`qa.js` §9** now fails MED when the homepage's first screen exceeds
**480KB**, and HIGH if a phone requests any of the showpiece — §9 already had
that number too, and it was likewise unread. The budget sits above today's
450KB deliberately: a ratchet against the next unbudgeted feature, not a
demand to undo the last two.

I first wrote this as a new §29 with its own browser pass. That was wrong: it
duplicated a measurement that already existed. §29 is gone; the budget lives
beside the measurement.

### 5.2 The number is noisier than it looks

Removing §29 did not remove the disagreement, which is the more useful
finding. **The same §9 code reports 418KB in this container and 450KB on the
CI runner** — a 32KB spread on identical bytes, while `full` differs by only
3KB.

The obvious explanation was that `first` counted everything fetched by `load`
plus 900ms, making it a measure of machine speed: a lazy image that finished
inside the window counted, the same image on a slower runner did not.

**That explanation was tested and it is wrong.** Throttling the network to a
quarter of its throughput moved the number by 0KB. Replacing the timer with
`document.fonts.ready` fetched the same five files. The first screen turns out
to fetch **no images at all** — it is the HTML plus five font files:

| | |
| --- | ---: |
| `index.html` | 356.8KB |
| four Poppins Latin faces | 30.7KB |
| `cairo-arabic-var.woff2` | 30.2KB |
| **total** | **417.7KB** |

So the gap is not font timing, and it is not a lazy image *in this container*
— nothing below the fold loads here at all inside the window.

But the sizes point somewhere specific. The first two below-fold images are
`B1.webp` at **29.9KB** and `B2.webp` at **31.7KB**, and the gap is 32KB.
Chromium decides how far below the fold to start a lazy image using a distance
threshold that varies by browser version and by effective connection type — so
on the runner, one of those very plausibly begins and finishes inside the
window, and here it never starts.

That was a prediction rather than a conclusion — inferred from two numbers
matching, not reproduced. **The next CI run settled it.**

| | dev container | CI runner |
| --- | ---: | ---: |
| `index.html` | 418KB = html 357 + fonts 61 | 420KB = html 357 + fonts 61 + other 3 |
| `story.html` | 288KB = html 227 + fonts 61 | 291KB = html 227 + fonts 61 + other 3 |
| `about.html` | 382KB = html 207 + fonts 31 + img 145 | 385KB = same + other 3 |

**The 32KB is gone.** It was a below-fold image loading early on the runner and
counting as first-screen; defining `first` by layout excludes it whether or not
it loads. Every category that describes the page — html, fonts, img — now
agrees exactly across both environments.

What was left was **3KB, constant on every page, in `other` on CI only**. I
called it an artefact of the environment. **That was wrong, and the bucket that
names its own URLs said so on the next run:**

```
first screen 420KB = html 357 + fonts 61 + other 3 [script.js]
```

It is `https://plausible.io/js/script.js` — the analytics tag, `defer`, on
every page. It is invisible in the dev container for the same reason the
competitive review is impossible there: **the egress proxy blocks it.** So the
unrepresentative environment was the local one, and every local first-screen
figure in this document under-reports the real cost by 3KB plus a DNS lookup
and a TLS handshake to a third-party origin.

That is a genuine property of the site, not noise: a real visitor pays it, and
it is the only third-party request on the first screen. Whether 3KB of
analytics is worth a cross-origin connection on a page whose whole argument is
weight is a real question — but it is a decision the owner has already made
(`docs/58`), so it is recorded here rather than reopened.

The residual is recorded rather than chased, but the useful number is the one
that changed: **the disagreement went from 32KB to 3KB, and from unexplained to
categorised.**

**Two changes came out of the attempt anyway**, both worth keeping:

- `first` is now defined by **layout** rather than by a clock — an image counts
  if its box overlaps the first viewport and is excluded if it does not, so
  whether a below-fold image happened to load is no longer a question the
  number can be sensitive to. That removes a real class of nondeterminism,
  even though it was not today's.
- The waits are conditions (in-viewport images complete, `document.fonts.ready`)
  rather than fixed timeouts.

**And the number now carries its own composition** — `first screen 418KB =
html 357 + fonts 61` — because a 32KB disagreement that names a font is a
different problem from one that names an image or the document. The next CI
run says which, without anyone having to reproduce anything.

The figure is now **418KB here and 420KB in CI** — one number, within 3KB,
rather than a 32KB range. The budget stays at 480KB: there is no longer a
reason to keep it loose, but moving it down is a separate decision from fixing
the measurement, and doing both in one pass is how a budget change gets
smuggled in as a bug fix.

One thing the breakdown already shows, unrelated to the discrepancy: the
English homepage fetches the **30KB Arabic font** on its first screen. Whether
that is necessary is worth asking — it is 7% of the budget — but it is a
question for a separate pass, not something to change while chasing a
measurement bug.

> The rule, stated so it survives this document: **a budget nobody measures is
> a budget that grows.** That sentence was already written in `qa.js` §7 about
> video. It was true about everything else too.

### 5.1 The guard, negative-tested — and the test that lied twice

| Mutation | Result |
| --- | --- |
| Budget lowered below the real figure | fires — MED, naming the actual first-screen number |
| Viewport widened so the film loads on the "phone" pass | fires — HIGH, naming the showpiece bytes |

The second row also caught a defect in the guard's own reporting: the summary
line printed *"film not requested"* unconditionally, so a run that had just
raised a HIGH about the film still said the film was not requested underneath
it. Fixed — but worth noting that only a negative test could have found it,
because on a passing run the sentence is true.

Both rows were proved against the §29 draft before that draft was withdrawn;
the assertions moved unchanged into §9, which computes the same two quantities
more accurately. The second row took two attempts, and the first attempt is
worth recording because it is the **third** appearance of this project's
signature failure.

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
