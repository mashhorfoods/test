# X02/X03 — what to capture, and what will be done with it

Written 5 September 2026, while the owner is recording. `docs/62` D1–D2.

This exists for one reason: **a recording that misses something costs a round
trip.** `docs/52` named the reference set and the Arabic gap; it never said what
a usable recording actually contains. This does, and it is deliberately short.

> **UPDATED 5 September 2026, after P1.** Phase 1 of `docs/69` answered the
> measurable half of X02 without any reference material — `docs/70` held our
> spacing ladder, type ramp, control heights and target sizes against the
> published specifications of Linear, Stripe and Vercel and found this site
> already inside the band, ahead on two axes.
>
> **So the recording no longer has to answer any of that.** Do not film for
> spacing, type sizes, button dimensions or colour. Those are measured.
>
> What is left is the half a spec sheet cannot carry: **motion, sequencing,
> and how one section hands over to the next** — R5 in `docs/52` §1, which was
> the actual brief. Everything below is now pointed only at that.
>
> §5's running order has also changed: **X09 is delivered** (`docs/75`) and
> **X08's largest item is done** (`docs/72`).

---

## 1. What to capture — the short version

**Two recordings of `pixverse.ai`, and one still.**

| # | What | Why it is needed |
| --- | --- | --- |
| **1** | **Desktop, full page, top to bottom, scrolled steadily** — one pass, no stopping | X01 measured Pixora's rhythm in *screens per section*. The same measurement off this recording is the only way X03 compares like with like rather than impressions |
| **2** | **Phone, full page, top to bottom** — same steady scroll | `docs/62` X08 is "mobile as designed, not compressed". A desktop-only recording cannot answer it, and it is the stage this project is weakest on |
| **3** | **Ten seconds parked on the hero, not scrolling** | The hero loop's length and whether it restarts, cuts or holds. `docs/53` budgeted our showpiece against a guess about theirs |

**Steadily** is the one instruction that matters. A recording that jumps or
skips cannot be measured for rhythm, which is the single thing X01 identified
as this site's biggest experience gap.

If any of it is easier as screenshots, screenshots are fine — **a full-page
screenshot at each width is worth more than a partial video.**

## 1a. One question P1 added, and it is cheap to capture

`docs/71` measured every call to action on this site and found that on a phone
a visitor scrolled up to 5.5 screens with nothing to press, while the desktop
header carried one at every scroll position. That is fixed (`docs/72`), and it
raised a question the reference can answer better than we can reason about:

> **On the phone recording, is there a call to action permanently in view?**
> A sticky header button, a bottom bar, a floating action — or nothing, and the
> page relies on the visitor scrolling to the next one.

It costs nothing extra: it is visible in recording #2 as long as the scroll is
steady. It matters because this site now uses the header, and a bottom bar is
the alternative it did not choose.

## 2. Worth capturing if it is no trouble

Not required. Each answers a question X03 would otherwise have to leave open.

- **Their pricing or plans page**, if they have one — `docs/29` §3 found Pixora
  is "ahead on disclosure, behind on explanation", and this is the direct
  comparison.
- **Any hover or click that opens something** — how options unfold rather than
  how they sit still.
- **The moment a section enters the viewport**, if motion fires on scroll —
  X07's question is whether motion aids comprehension or decorates.

## 3. The one thing the reference set still lacks

`docs/52` §3 asks for **one Arabic-first site you respect** — even an imperfect
one. It is still missing, and it is the difference between X03 adapting nine
left-to-right experiences to a site half of whose visitors read the other way,
and X03 knowing what good looks like in Arabic.

**A URL is enough.** If a page fetch fails from here I will ask for a
screenshot, but naming it costs you nothing and it is the single most
load-bearing gap in the set.

## 4. What will be measured, so the capture can be judged against it

X01 measured Pixora's own homepage this way (`docs/55` §2). X02 produces the
same table for the reference, and X03 explains the differences:

| Measured | Pixora today | Why the comparison matters |
| --- | --- | --- |
| Screens per section, desktop and phone | 0.79–5.46 desktop; 0.68–5.46 phone | Nine sections shared one ground and identical spacing. Banding fixed the texture; the rhythm question is still open |
| Total page length | 21.7 screens desktop, 37.8 phone | The number X06 exists to argue with |
| Where the price first appears | 61% down | If the reference gets there sooner, that is a structural finding, not a taste one |
| Links per section | 0–8 | `process` has zero. Withdrawn as a defect, kept as a number |
| How many options are shown at once | 4 service blocks, near-identical, half the page | X01's largest unresolved item, and `docs/55` §6 names the three structural options and why guessing between them is forbidden |

**The comparison is not "do what they do".** `docs/52` §5 already rejected the
full reference treatment on performance grounds and chose the middle position;
`docs/51` §3's guardrails require performance to be maintained or improved. So
X04's verdicts are *preserve / borrow as principle / adapt / improve / reject*,
and "reject" is expected to be used — a pattern that costs megabytes on a phone
in this market is one this site has already decided against once.

## 5. What happens when it arrives

In order, and each is a document rather than a change to the site:

1. **X02** — the reference measured, same table as above.
2. **X03** — why each pattern works, and whether it transfers to a bilingual
   RTL page. The Arabic gap in §3 is where this either becomes real or becomes
   recitation.
3. **X04** — preserve / borrow / adapt / improve / reject, against the
   guardrails.
4. **X05** — the direction statement `docs/53` is currently one decision of.
5. **X06 remainder and X07** — the work itself. ~~X08, X09~~ **X09 is
   delivered** (`docs/75`: one control scale honoured in both languages, a
   10px type floor with a guard, and a written decision on every unused
   selector), and **X08's largest item is done** — a phone visitor now has a
   call to action in view for 96–100% of every page (`docs/72`), against
   6% of `/story` before it.
6. **X10** then **X11** — comparative validation, then the gate.

**No site change happens before X04.** That is the framework's rule and it is
also this project's: `docs/55` §6 refused to guess between three structural
options precisely because X03 had not run.
