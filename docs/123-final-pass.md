# The finishing pass — what an independent audit found

**7 September 2026.** The owner asked for the project to be finished rather
than discussed: audit everything, sequence it, execute it, test it, and stop
asking. This is what the audit found and what was done about it.

The headline is uncomfortable and worth putting first:

> **The dashboard could not be typed into.** Every acceptance test passed
> because every acceptance test used Playwright's `fill()`, which sets a value
> and fires one event. A person presses one key at a time. Typing `1234` into
> a price left `1`.

---

## 1. The audit

### A — genuinely finished

Eight public pages, both languages, full RTL. Five harnesses green. Every
interactive control on every page enumerated and pressed: **no dead links, no
`href="#"`, no missing anchor target, no unnamed control, no console error**
beyond the analytics script this container cannot reach. The language toggle,
the mobile drawer (open, Escape, focus return, close-on-navigate), all twelve
disclosures, the Brand Challenge played through to a reward code, and the
contact form's recovery block all behave. SEO is complete: canonical,
description, eleven OG properties and a Twitter card on every indexed page,
one `<h1>` each, no heading-level jumps, and a `404` correctly carrying
`noindex, follow` and no canonical. Reduced motion is honoured globally.

### B — worked but not finished

The dashboard (§2), the new-tab announcement (§3), and `responsive.js`, whose
three sampled widths stepped over a defect on both sides (§4).

### C — requested and not built

Nothing. The referral and Mystery Reward mechanics were **deliberately
removed** — `docs/111` — and replaced by the Brand Challenge, which works.
Leads, enquiries and personal data are out of scope by decision (`docs/85`),
not by omission.

### D — defects

Six, all below, all fixed.

### E — polish

91KB of authoring commentary was being downloaded by every visitor (§5).

---

## 2. The dashboard: four defects, one of them fatal

### 2.1 It could not be typed into

`rerender()` ran on every `input` event and begins with `replaceChildren()`.
The input being typed into was destroyed one character in, focus fell back to
`<body>`, the open category collapsed, and every keystroke after the first
went nowhere.

Nine phases of acceptance tests could not see it, because all of them use
`fill()`. `docs/121` §5b said emulation is not a phone; this is the same
lesson one level down — **a synthetic event is not a person.**

An edit now updates only what an edit can change: the field's own message, its
category's summary, and the action bar. `rerender()` survives for structural
changes only — signing in, switching file, and the moment after a commit.
**P11 types, one key at a time, and asserts four keystrokes produce four
characters with focus and the open category intact.**

### 2.2 It committed to a branch nothing deploys from

`const BRANCH = 'claude/webstart-project-audit-l7est2'` — correct when it was
written, wrong the moment PR #1 merged and `main` became the default. The
owner would have changed a price, watched a green commit appear, and seen the
site not change, with nothing anywhere saying why. **A dashboard that silently
writes to the wrong place is worse than no dashboard.**

`signIn()` already calls `GET /repos/{repo}` to prove the token can see the
repository, and that response carries `default_branch`. The right value was
free, is always current, and cannot go stale again.

### 2.3 A second person's save could be erased without a word

The Contents API refuses a PUT whose `sha` is stale, and the message it
returns is machine-shaped. Two people have write access. Now: if the file is
byte-identical and only its sha moved, the sha is re-read and the save goes
through; if the content genuinely differs, it stops, says so in words, and
**keeps the operator's edits on screen** rather than throwing away work
nobody chose to throw away.

### 2.4 The sticky bar was still covering the message — again

`docs/121` §5b moved the validity message from the bar down to its own field,
because the bar was sitting on top of the price it described. Right, and not
the whole fix: on a 667px screen the field being typed into is usually the
last thing above the bar, so the message that appears under it appeared under
the bar.

Found in a screenshot with every number healthy — 3.6 screens, no overflow,
bar at 27% of the viewport — and the one sentence the operator needs
invisible. Two changes: the page now **reserves the bar's height** so content
can end above it, and a message that has just appeared scrolls itself clear —
only when it is actually obscured, because scrolling the page while somebody
types is its own defect.

**The suite now runs at 390×667, an iPhone SE.** It ran at 420×900, taller
than any phone, where a message hidden behind the bar is comfortably above it.

---

## 3. Every link that leaves the site says so — in the right language

A census of all **98 `target="_blank"` links**:

| | |
| --- | --- |
| Announced it | 76 |
| **Said nothing at all** | **22** |
| Announced it **in English on the Arabic page** | 20 |

The 22 silent ones were every WhatsApp button on the homepage and the pricing
page: the four service CTAs, all sixteen package CTAs, the contact panel and
the form's fallback. **The conversion path, and only the conversion path.**
LinkedIn, Behance, the portfolio, the client's own site and even the WhatsApp
links inside the legal pages' prose had carried the note from the start — so
this was not a missing rule but a rule with a hole in exactly the place it
mattered most.

And the 76 that passed were hard-coded English. Three mechanisms were in play
— a hard-coded span, a runtime-translated one in the footer, and the story
generator's — which is why no single place looked wrong enough to notice.

**A fourth defect, found the same way:** five `aria-label`s were English on
both languages, three of them the direct-contact channels (WhatsApp, phone,
email), and two of those carried a second copy of the phone number. Those
labels are **gone** — the visible content already names the channel in both
languages, and `qa` §19 still owns the number. The two that hold no data took
a key.

`qa.js` §35 now checks what a screen reader is actually handed: for the
language showing, every off-site link announces the new tab exactly once, in
that language.

---

## 4. Pricing cards hanging off the page, 361px to 480px

The Websites package cards were **352px wide inside a 327px column** at 375px
— 25px past the right edge in English and, because RTL aligns from the other
edge, **9px off the left of the screen in Arabic.**

`.c-tiers` is a grid with no explicit template, so its single track is `auto`
— as wide as its widest item's min-content — and `.c-tier` defaults to
`min-width: auto`. The package CTA is `white-space: nowrap` with a 302px
min-content, so the card set the width of the column that was supposed to be
constraining it.

Clean at 320. Clean at 360. Clean at 768. **`responsive.js` sampled
320/768/1024 and stepped over the band on both sides** — a band containing
the iPhone SE, mini, XR and Plus.

This is the same shape `docs/115` found at 320px and fixed at the button.
Fixing it at the button again would leave the coupling for the next label, so
the track is now `minmax(0, 1fr)`: a track that cannot be widened by its own
contents cannot produce this at any width, in any language, for any label.
The button's permission to wrap moved to the same breakpoint as the padding
that was already being tightened for it — the two halves had been at 22.5em
and 30em, leaving 361–480px where the label could neither fit nor wrap.

**`responsive.js` now runs 320, 375, 414, 768, 1024** — 80 combinations
rather than 48.

---

## 5. 91KB of reasoning nobody can read

This project's HTML comments are its best asset in the source and dead weight
in the artefact: 96 comments and 40KB on the homepage alone.

They now come out in `build.js`, where `dist/` is already a derived artefact
nobody edits, and stay untouched in the files people read and change.

| | Before | After |
| --- | --- | --- |
| `dist/index.html` | 411.7KB | **371.3KB** |
| Homepage over the wire (gzip) | 89.4KB | **75.7KB** |
| First screen against a 480KB budget | 450KB | **411KB** |

**The stripper must not touch script or style**, and the guard for that is not
a comment — it is an assertion that runs on every build and stops it. It
earned its place immediately: the first version collapsed blank lines across
the whole document, including the inlined JavaScript, and the build refused to
ship. Fixed rather than excused.

CSS comments were already stripped by the build. **JavaScript comments are
deliberately left**: stripping them safely needs a real tokenizer for regex
literals and template strings, the gzip saving is a few KB, and this project
does not add a dependency for that.

---

## 6. What was checked and found sound

Not everything looked at was broken, and the ones that were not are worth
recording so the next pass does not re-audit them:

- **Reduced motion** — a global `prefers-reduced-motion: reduce` rule in
  `01-reset.css` kills every animation and delay. The six components without
  a local block do not need one. The dashboard's JavaScript scroll now asks
  the same question, because a JS smooth scroll ignores CSS media queries.
- **SEO** — complete. The homepage title is short (`Pixora — Digital Agency`,
  23 characters), which is a marketing judgement rather than a defect:
  "Digital Agency" is the brand tagline in five places including the brand
  lockup, so changing the title alone would break a deliberate consistency.
  **Recorded as a recommendation, not changed.**
- **Eight unreferenced images** — the seven original photographs and one
  unused studio shot. They are not shipped (`dist/assets/` has neither), they
  are the only copies of what the owner uploaded, and a re-encode is not
  reversible. `src/assets/images/README.md` now says so, which was the actual
  problem: a file called `1-1.webp` explains nothing.
- **No dead scripts, no unimported stylesheets, no duplicate components.**

---

## 7. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low — **35 sections** |
| `responsive` | 0 findings over **80** page/width/language combinations |
| `arabic` | 0 findings |
| `a11y` | 0 axe violations |
| `admin:test` | all checks passed |
| `admin:ui` | all checks passed, at 390×667, **17 assertions** |
| Interaction sweep | 8 pages × 2 languages: 0 dead controls, 0 broken links |
| New-tab census | 98 links, 0 silent, 0 in the wrong language, 0 doubled |
