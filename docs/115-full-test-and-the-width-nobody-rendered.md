# The full test, and the width nobody had ever rendered

**7 September 2026.** A second full pass over the shipped build, and then the
remaining task plan. The pass found one real defect, on a page and a width no
harness in this repository had ever loaded — and it found it only after the
test itself had been wrong three times.

---

## 1. The suite, first

`validate` 0 · `qa` 0 high, 0 medium, 1 expected LOW · `a11y` 0 violations,
1 argued exemption. Unchanged from `bb1a066`.

That was never going to be the interesting part. The three harnesses are good
at what they already look at; the question was what they do not look at.

---

## 2. The sweep reported 42 findings and 40 of them were its own

A widened sweep — 8 pages × 5 widths × both languages, checking horizontal
overflow, target size and RTL — came back with **42 findings**, forty of them
some variant of *"Arabic did not set dir=rtl"*.

None was real. Three separate bugs, all in the test:

| | What I wrote | What it did |
| --- | --- | --- |
| 1 | clicked `[data-lang-toggle]` | **A selector this site has never used.** The click hit nothing, the page stayed in English, and forty combinations reported an RTL failure against a site that was fine |
| 2 | `document.querySelector('.c-contact form, form')` | A selector list returns the first match **in document order**, not by which selector matched — so it took the *challenge quiz* form and reported the contact form as failing to validate |
| 3 | filtered console errors on `/plausible/` | The message is `Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED` — **the URL is not in the text.** The blocked analytics tag read as a site defect |

Corrected, the same sweep returned **0 findings**. Forty-two to zero, with the
site untouched.

The lesson is not "be careful with selectors". It is that **a test which
silently tests the wrong thing reports a result either way** — 42 findings
here, and it could just as easily have been a clean pass. So the harness now
fails loudly if the language control is missing, rather than carrying on in
English and reporting on it.

---

## 3. Then the guard could not fire at all — twice

The corrected sweep still found nothing, so it got a negative test: a 1400px
`<div>` injected into the built page. It should have screamed.

**It did not.** `01-reset.css` sets `overflow-x: clip` on both `html` and
`body` — *"No horizontal overflow, ever — rule 09."* Under clip there is no
scroll container, so `documentElement.scrollWidth` is pinned to the viewport
no matter what the content does. A check written against `scrollWidth` **can
never fire on this site.** It would have shipped as a confident zero over a
page with a 1400px element in it.

Clip does not fix overflow; it hides the evidence. So the measure moved to
element bounding boxes, which survive clip — with an exclusion for content an
ancestor legitimately contains (the phone scrollers from `docs/113`, every
`.c-gallery`, and `.u-visually-hidden`, whose `nowrap` inner spans measure
their full natural width and produced an 879px "overflow" on a 320px phone).

**That exclusion then zeroed the check out a second time.** The ancestor walk
was bounded at `document.documentElement`, so it reached `body` — which
carries the same `overflow-x: clip`. Every element on every page had a
clipping ancestor inside the viewport, `contained()` returned true for all of
them, and the sweep reported **0 findings over 48 combinations** moments after
a negative test had proved the same code could see a 1400px div.

Body's clip is the thing being tested, not a thing that excuses. The walk
stops before `body`, and only containers *between* an element and body count.

Three attempts at one check, two of which produced a clean pass that meant
nothing. Same shape as `docs/113` §1 and §2 and the three false passes in
`docs/99` — and it is now, by my count, at least the twelfth time in this
project.

---

## 4. The real find: nine pricing cards, cut off at 320px

With the check finally able to fire, `/pricing` at 320px:

```
9 of 12 tiers laid out between 324px and 352px wide
in a 272px column. Nothing scrolled. Nothing looked broken.
```

Because the root clips, the right-hand edge of nine cards was simply **not on
the screen** — no scrollbar, no visual cue, and every existing harness passed,
because none of them had ever rendered this page below 390px.

### The cause

`.c-btn` carries `white-space: nowrap`. A grid item's `min-inline-size` is
`auto`, so **the button's min-content became the floor of the card holding
it** — and *"Ask about Ads Performance"* is twenty-five characters.

Proved rather than assumed, by relaxing that one property in the live page:

| | before | after relaxing `nowrap` |
| --- | --- | --- |
| 320px | **9 of 12** over, widest 352px | **0** over, widest 272px |
| 360px | **3 of 12** over, widest 352px | **0** over, widest 312px |
| 390px | 0 over | 0 over — unchanged |

### The fix, and what it corrects

`button.css` already had a `@media (max-width: 22.5em)` block, written when
*"Reveal my reward"* asked for 232px in a 222px panel. Its reasoning:

> `white-space: nowrap` means a button cannot answer that by wrapping, and
> 32px of padding either side of a 16-character label is most of the
> difference. The padding gives way first; the label is the part that has to
> survive.

**That was right for sixteen characters and wrong as a rule.** At twenty-five,
no amount of padding covers the difference. So on the narrowest phones the
label wraps: a button on two lines at 320px is ordinary, a card with its edge
cut off is not. `nowrap` still holds everywhere else, which is where it was
earning its keep — this is the width at which it stopped.

### One trap avoided on the way

The first draft of that rule also set `block-size: auto`, to "let the button
grow". It does not need it — `.c-btn` has `min-block-size`, not a fixed
height. What the line *would* have done is out-rank
`.c-btn--icon { block-size: var(--control-height) }` on source order at equal
specificity, turning the one control whose shape carries all of its meaning
back into a rectangle below 360px. Removed before it shipped, and the reason
is written into the rule.

Verified after: 0 overflow at 320 and 360, **unchanged at 390 and 1440**, and
icon buttons still square.

---

## 5. `tools/responsive.js`, and why it earns its run time

The sweep is now a harness in the repository, wired into `npm run check`
between `qa` and `a11y`.

It renders **the widths nothing else looks at** — 320, 768, 1024 — across all
eight pages in both languages, 48 combinations, and checks three things:
nothing reaches past the viewport, no target under the 44px floor, and Arabic
actually reaches `dir="rtl"`.

390, 1280 and 1440 are covered by `validate` and `qa` and are deliberately not
repeated. Before this, **no check had ever loaded `/privacy`, `/terms`, `/404`
or `/accessibility` in Arabic at any width at all.**

`docs/69` §5d now tables what each harness actually renders, with the rule that
the table changes whenever a harness does — a gap nobody has written down is a
gap nobody will look for.

It is negative-tested, which given §3 is not a formality: an injected 1400px
element fires HIGH, an injected 20px link fires MED, and a missing
`[data-lang="ar"]` control fires as a harness failure rather than passing
quietly in English.

---

## 6. Two bugs in `build-reel.js`, found by reading it again

Shipped yesterday in `bb1a066`, before it had ever been run with these flags.

**`--from` was ignored for the poster.** The still was extracted with
`-ss <from> -ss 1` before `-i`. Two `-ss` in the same position do not compose —
the later one replaces the earlier — so with `--from 00:00:30` the poster came
from one second into the *file* while the reel started at thirty: a poster of a
frame the video never shows. One seek now, added up. Verified against a test
pattern with the timecode burned into the picture: `--from 6 --seconds 2`
produces a poster reading **00:00:07.000**.

**It upscaled.** The width ladder picks what the bitrate can carry, which on a
generous budget is 1280 — and `scale=1280:-2` on a 640-wide source spends real
bits inventing pixels that are not in the master. Caught on a 640×360 clip that
came out 1280 wide and 2.3MB. The chosen width is now capped at the source's
own, and says so; a forced `--width` is still honoured, because somebody asking
for an upscale by name should get one.

---

## 7. The task plan, honestly

Everything else on the list waits on a person, not on work.

| # | Item | Waiting on |
| --- | --- | --- |
| 4 | Keep PR #1 green | Ongoing — green and mergeable |
| 5 | Merge PR #1, make `main` default, add the ruleset | **Owner** |
| 6 | `reference-probe.js` on ten competitor sites | **Owner** — the egress proxy answers 403 to any page fetch |
| 7 | Ten competitor rows, X02's second half, X10 | Follows 6 |
| 8 | Five moderated buyer sessions (B5) | **Owner** |
| 9 | X06 remainder — four-block structure, section naming | Follows 8. `docs/99` §3 |
| 10 | B3 Arabic review, B4 legal, B6 VoiceOver | **Owner** |
| 11 | Apply B3/B4/B5/B6, run the X11 gate | Follows 10 |
| 12 | The showreel footage | **Owner** — `npm run reel -- <master>` |

I have not invented work to fill that list. The one thing genuinely open and
in scope was the phone scroll, and `docs/113` closed it: 27.6 → 25.8 screens,
re-measured today at **25.8**.

The verdict does not move, and it moves for one reason only: **zero
third-party proof.** Still owner-blocked, still the thing that decides it.
