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

## 5b. The second pass, as five readers

`§27` of the brief asks for an independent second review once everything
looks done. It found three more, and all three were the same shape as §3 —
and a sharper version of it:

> **Not a missing translation. A translation that was decided, written into
> the repository, and then not wired up.** That is harder to see than an
> absent one, because the Arabic is sitting right there in the source.

### The first focusable element on the site was in English

`<a class="c-skip-link" href="#main">Skip to content</a>` — a bare string in
the shell every page is built from. **The very first thing a keyboard or
screen-reader visitor reaches, on eight pages, in the wrong language.** Found
by tabbing the homepage in Arabic rather than by any rule.

### The brand tagline said one thing and announced another

The header and footer show **`Digital Agency`** in English on the Arabic page.
The same element's accessible name is `data-i18n-label="brandHome"` and says
**`بيكسورا، وكالة رقمية — الصفحة الرئيسية`**, so a screen reader and an eye on
the same page got different words — and the site had already decided the
Arabic.

It is not a brand decision that the tagline stays Latin, and the stylesheet
proves it: `header.css` carries a `[dir="rtl"] .c-brand__tagline` block,
written because *"Arabic has no letter case and its joins break under heavy
tracking"*. **A rule written for Arabic that has never had Arabic to style.**
Six taglines, header and footer, on every page.

### The footer link had an Arabic label that nothing read

`SOCIAL_LINKS` in `navigation-map.js` has carried
`labelAr: 'أعمال المؤسس'` since the entry was written — the comment beside it
argues carefully about what the link should promise — and `renderSocial()`
took `label` unconditionally. **The Arabic footer said "Founder's portfolio"
in English.**

`404.html` was worse. Its static copy of that list still said **`Website`** —
the label `navigation-map.js` explicitly records as replaced, because *"as
'Website' it read as the agency's own site, sitting in a list beside it"*. A
decision made, written down, and left in place on one page.

### And the guard for all three could not see one of them

`qa.js` §36 was written to ask one question — *can an Arabic visitor reach a
control whose name is English prose?* — and its first version read the
accessible name. Reverting the skip link fired. Reverting the footer label
fired. **Reverting the tagline reported nothing**, because the brand link's
accessible name is Arabic and always was: the entire defect lives in the gap
between what a screen reader is told and what a person sees.

A check that stops at the accessible name sees a healthy control and a
visitor sees an English page. §36 reads both. **Written down because the
negative test found the guard, not the site** — which is now the fourth time
this week.

### One thing that looked like a defect and was not

Tabbing the homepage reported the reel `<video>` with no focus indicator, and
a `video:focus-visible` outline was written for it. Measuring before keeping
it showed the site's standard `--focus-ring` box-shadow was already there:
the two flagged stops are inside the video's own control shadow tree, where
`:focus-visible` does not match the host. **The rule was removed** — it styled
nothing that was not already styled, which is the exact thing `qa`'s one
standing low finding counts.

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
| `qa` | 0 high, 0 medium, 1 pre-existing low — **36 sections** |
| `responsive` | 0 findings over **80** page/width/language combinations |
| `arabic` | 0 findings |
| `a11y` | 0 axe violations |
| `admin:test` | all checks passed |
| `admin:ui` | all checks passed, at 390×667, **17 assertions** |
| Interaction sweep | 8 pages × 2 languages: 0 dead controls, 0 broken links |
| New-tab census | 98 links, 0 silent, 0 in the wrong language, 0 doubled |
| Keyboard journey | 90 tab stops, both languages: every stop has a visible focus ring |
| JavaScript off | 8 pages: all content, headings, navigation, prices and images present |
| Alt text | 38 images read in Arabic on the Arabic page, 0 in English |
| Reduced motion | global, plus the dashboard's one JavaScript scroll |

### Every guard made to fail

| Guard | Negative-tested by |
| --- | --- |
| `qa.js` §35 | a note removed (fires), left in one language (fires), and present in both at once (fires) |
| `qa.js` §36 | each of the three strings reverted to English one at a time. **The tagline test reported nothing while the other two fired** — §36 read only the accessible name, and the tagline's whole defect is that the accessible name was already Arabic. It reads the visible text as well now |
| `responsive.js` at 375/414 | removing **both halves** of the pricing fix from the built page — 1 HIGH at 375 Arabic, silent when restored |
| `build.js` comment stripper | the assertion stopped the first build it ran on |
| Dashboard P11 | typing, one key at a time, rather than `fill()` |
| Dashboard P6b/c/d | the branch in the PUT body, an armed 409 that is benign, and one that is real |
| Dashboard P10b | measured against the bar at 390×667, where it fails without the fix |
