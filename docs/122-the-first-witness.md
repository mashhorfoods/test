# The first sentence on this site the studio did not write

**7 September 2026.** Faris Mohammed, Founder & CEO of Al Mada Travel &
Tourism Agency, sent a testimonial. It is published on the homepage under the
four deliverables it is about, and again at the end of the case study.

This is the single item `docs/108`, `docs/112` and `docs/116` all named as the
one thing standing between the site and a *yes*, and it is the only one of
them that no amount of building could have supplied.

---

## 1. What changed, in one line

> `docs/108` §15: *"every single claim on this site comes from the company
> itself… I have no evidence that anyone has ever been happy with it."*

That is no longer true. There is now exactly one piece of third-party
evidence on this site, and it is real.

| | Before | Now |
| --- | --- | --- |
| Testimonial elements on any page | **0** | **2** — homepage, case study |
| Named third party willing to be quoted | none | **1** |
| Claims sourced outside the company | none | one, with a name, a title and a company |

**One.** Not a strip of three, not a rotating carousel with two placeholders
waiting. The component is built to hold one, and the day a second client
agrees it is reused verbatim — which is the whole point of §4.

---

## 2. Where it went, and why not anywhere else

**On the homepage: directly beneath the four Al Mada tiles.** Not in a band of
its own further down, and not near the top.

A quote near the top is an assertion. A quote under the four things it is
about is a **verdict on work the reader has just looked at** — the identity
sheet, the website, the campaign posters and the printed profile are all
above it, and the case-study link is directly below it, so checking is one
click from reading. `docs/108` §16 asked for it *"beside the case study"*.
It is.

**On the case study: after the last chapter, before the closing statement.**
Same reasoning, five chapters deep. Someone who has read the whole thing has
earned the client's own verdict on it before being sent to the client's live
site.

**Nowhere else.** Not `/pricing`, not `/about`, not the footer. One quotation
repeated on eight pages stops reading as a person and starts reading as a
banner.

---

## 3. The Arabic is ours, and the site says so

Faris Mohammed wrote in English. The site is fully bilingual and every string
on it is paired, so an Arabic reader had to be given something — and the only
honest something is a translation that **declares itself**:

> **وصلتنا الشهادة كتابةً بالإنجليزية، والنص العربي ترجمتنا، وتُنشر بإذن صاحبها.**
>
> *Sent to us in writing and published with permission.*

Publishing our Arabic under a named man's name without saying it is a
translation would be **putting words in his mouth in a language he did not
use.** Nobody would have noticed, which is exactly why it is written down.

`/about` publishes the promise that *"there is no invented statistic, client
or testimonial anywhere on this site."* That promise survives this addition —
the testimonial is real — and it would not have survived an undeclared
translation, because the Arabic sentences would then be ours presented as his.

**This is the one judgement in this change that an owner should overrule if
they disagree.** The alternatives were: publish the English in both languages
(honest, and unreadable to half the audience), or ask Faris to supply Arabic
himself (better than both, and it costs a message — worth doing, at which
point the note changes and the guard in §5 catches the drift).

---

## 4. One component, built for one quote

`src/styles/components/testimonial.css`, ~110 lines, no script.

- The opening mark is a pseudo-element, not text, so a screen reader does not
  announce *"left double quotation mark"* before the sentence. It mirrors to
  the Arabic-facing glyph under `[dir="rtl"]`.
- `<figure>` / `<blockquote>` / `<figcaption>` — the attribution is
  structurally attached to the quotation rather than being a paragraph that
  happens to sit under it.
- Nothing is stacked, scrolled or rotated. **There is no mechanism to fill, so
  there is no pressure to invent filler** — which is how testimonial sections
  usually acquire their second and third entries.

The case-study copy is generated: the words live in `src/data/story.json` and
`tools/build-story.js` renders them. The generator treats the block as
**optional** — a `story.json` without one renders exactly the page it rendered
yesterday. A generator that *required* a quotation would be a generator that
invites one to be written when none exists.

---

## 5. The guard: `qa.js` §34, negative-tested four ways

The quote is published twice. Two copies of one sentence, edited
independently, is **a named man quoted saying two different things** — and
nobody would ever do that deliberately. A tidy-up of one copy's wording is all
it takes.

So `src/data/story.json` holds the words, and every rendering of them anywhere
on the site must match it exactly, in both languages, carrying a name, a role
and the translation note.

| Test | Result |
| --- | --- |
| The homepage English quote edited by three words | **2 HIGH** — the mismatch against the source, *and* "quoted differently here than on index.html" |
| The Arabic name deleted from the case study | **HIGH** — attributed to a person in English, to nobody in Arabic |
| The translation note deleted from the homepage | **2 HIGH** — English and Arabic |
| The `testimonial` block removed from `story.json` | **2 HIGH**, one per page — *"words attributed to a named person with nothing behind them"* |
| The shipped site | **clean** |

Both pages appear in the failures, which is the part worth checking: it proves
the guard is reading both renderings and not just the first one it finds.
**A guard that has not been made to fail has not been shown to work** — this
project has produced enough silently-dead rules this week for that to be a
habit rather than a slogan.

---

## 5b. And one thing only a screenshot found

Every measurement said the block was fine: no overflow at 320, 390, 768, 1024
or 1280, targets in range, contrast clean, five harnesses green.

Then the pictures were taken. On desktop the *"Read the case study"* link sat
about **17px under the card's hard bottom border** — `.c-proof__more` carries
`margin: 0`, which is correct against the bento grid it used to follow and
wrong against a bordered box. It read as part of the quote rather than as the
section's closing line. Fixed with one rule, in `proof.css` rather than in the
component, because it is a fact about this context and not about testimonials.

**This is the second time in two days that a screenshot found something no
number reported** — the last was the dashboard's sticky bar sitting on top of
the field it described. Rendering it and looking at it is not a formality.

---

## 6. What this does not do

- **It is not a number.** No traffic, booking or revenue figure has been
  supplied, and `story.json`'s provenance still says chapter 05 gains one when
  one arrives and not before. A testimonial is not a metric and is not being
  counted as one.
- **It does not close `docs/48` F1–F3.** Three statements in the case study
  were written from the deliverables and have still not been checked with the
  client. One message settles all three, and there is now a live conversation
  with Faris in which to send it.
- **It does not make the site's own claims third-party.** Everything else on
  it is still the company's word about the company. One witness is one
  witness.

---

## 7. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low — **34 sections** |
| `responsive` | 0 findings over 48 page/width/language combinations |
| `arabic` | 0 findings — the new Arabic is paired, tagged `lang="ar"`, and carries no untagged Latin |
| `a11y` | 0 axe violations |
| §34 | negative-tested four ways, both pages, both languages |
