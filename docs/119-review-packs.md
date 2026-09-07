# The four review packs, and what preparing them found

**7 September 2026.** `docs/116` said four human reviews were *"briefed and
waiting."* Two of them were. The other two had no send-ready version at all,
and all four described a site that had changed underneath them.

Preparing them found **three live defects**, one of which was visible on the
homepage in both languages.

---

## 1. What now exists

| | Who | **Send this** | Internal reasoning | State |
| --- | --- | --- | --- | --- |
| **B3** | An Arabic speaker | `docs/91` | `docs/66` | **Re-cut.** §1.3 and §1.4 added; the hour became ninety minutes |
| **B4** | A lawyer | `docs/90` | `docs/65` | **§3.9 added** — a clause that says of itself it is not final |
| **B5** | Five buyers | **`docs/118`** *(new)* | `docs/68` | A moderator's sheet, not an argument |
| **B6** | A screen-reader user | **`docs/117`** *(new)* | `docs/67` | Rewritten for a page that gained six scroll regions and an FAQ |

The internal documents stay as the record of what was known when they were
written. **Nothing in them was edited to look better in hindsight.**

---

## 2. The three defects, found while preparing the packs

### 2.1 The homepage said "Ten pieces" over seven photographs — in both languages

The Selected Work lead read:

> **Ten pieces from recent projects — identity, campaigns and the pages they
> lead to.**
> **عشرة أعمال من مشاريع حديثة — هوية وحملات والصفحات التي تقود إليها.**

Beneath it: **seven photographs.**

`docs/114` replaced ten placeholders with seven real images, renumbered every
caption `01/07`…`07/07`, and left the sentence above them alone. In both
languages. On the live site. The same document contains the line *"seven honest
slides beat ten with three empty"*, which makes it worse rather than better.

The description was wrong twice over: all seven are **branding** work — a
monogram, a business card, signage, a shop interior, a shopfront, packaging, a
palette — so *"campaigns and the pages they lead to"* named things that are not
there. It now reads *"Seven pieces of recent identity work — marks, print,
signage and the spaces they live in."*

**It was found because an Arabic reviewer was about to be sent to read it.**
That is a lucky way to find a thing, and luck is not a process — hence §3.

### 2.2 Three scroll regions with no name at all

`.c-brandboard`, `.c-devices` and `.c-modules` were given `tabindex="0"` by
`docs/113`, to satisfy axe's `scrollable-region-focusable` — a keyboard user
must be able to reach a region they can scroll.

**They were given no name.** So a keyboard or screen-reader visitor tabbed into
an unnamed group, three times on the way down one page, and was told nothing
about what they had entered. axe passes this: it checks reachability, not
whether the thing you reach identifies itself.

Fixing one accessibility rule created a gap in another, and the harness that
demanded the fix could not see it.

### 2.3 Two galleries announcing the same name — because the translation layer overwrote both

`index.html` had written two good, distinct labels:

```html
aria-label="Selected work — scroll for more"    data-i18n-label="galleryScroller"
aria-label="Campaigns — scroll for more"        data-i18n-label="galleryScroller"
```

One key, used twice. The i18n pass reads `data-i18n-label` and writes the
value, so **both were replaced at runtime with a single generic string** —
*"The work delivered — scroll for more"* — and the third gallery on `/story`
made three regions across the site announcing the same name.

The author's own words were destroyed in order to produce a worse name. Nothing
in the markup shows it: the file reads correctly and the page does not.

Six keys now, one per region, in both languages.

**This is `docs/67` §1's own finding recurring** — *"five identical 'See what
it covers' links"* — in a different mechanism. It was fixed by hand there. That
is why it now has a rule.

---

## 3. Two guards, both negative-tested — and the first test was wrong

### §31 — a count written in prose, against the count in the markup

The number in §2.1 lived in a sentence, and prose is not something the other
thirty sections read. So a gallery lead that states a count is now checked
against the gallery it leads, **in English and Arabic**, with number words in
both — because the sentence exists twice and one language being updated without
the other is the more likely failure.

| Test | Result |
| --- | --- |
| English lead says "ten", seven slides | **HIGH** — fires |
| Arabic lead says "عشرة", seven slides | **HIGH** — fires |
| The shipped page | clean |

### §32 — a focusable region with no name, or with somebody else's

Covers §2.2 and §2.3 with one rule: every focusable scrollable region must have
an accessible name, and no two regions on a page may share one.

**The first negative test reported nothing, and the guard was not the problem.**
Stripping the `aria-label` out of `dist/index.html` fired nothing, and so did
duplicating a label. The obvious conclusion — a third dead guard in one day —
was wrong.

The page **repairs itself**: `data-i18n-label` is applied at runtime, so the
mutation was undone before the check looked. A probe of what the guard actually
sees showed all five regions with correct names and `overflow-x: auto`, which
is the guard working.

Mutating `data-i18n-label` instead:

| Test | Result |
| --- | --- |
| Brandboard with no name, English | **HIGH** — fires |
| Brandboard with no name, Arabic | **HIGH** — fires |
| Two galleries sharing a name, English | **HIGH** — fires |
| Two galleries sharing a name, Arabic | **HIGH** — fires |

**A negative test that mutates something the page rebuilds is not a negative
test.** Written down because the same trap will be there next time: this site
composes its accessible names at runtime, so anything checking them must be
mutated at the source of the name, not at its output.

---

## 4. What changed in each pack, and why

### B3 — Arabic: the hour became ninety minutes

The pack was written on 6 September and pointed at `/terms` and
`/accessibility`. Measured rather than estimated: **118 distinct Arabic strings
on the homepage alone are new or changed since**, none read by an Arabic
speaker. The FAQ, the whole Brand Challenge, the rewritten hero, seven
photograph descriptions, the contact fallback, six region names.

They are now §1.4 and they are **first**, ahead of everything the original
pointed at, grouped by what a wrong word costs:

1. the six FAQ answers — a hesitating buyer reads these
2. the challenge scenario — narrative Arabic, the hardest register on the site
3. the photograph descriptions — heard by blind visitors, never seen
4. the contact fallback — read by someone already stuck
5. the six region names — the phrase **مرّر للمزيد** is used six times, so a
   better one is worth six fixes
6. the unfinished Terms clause — meaning against the English, not register

§1.3 pulls out the hero's first sentence on its own, because it is above the
fold and it is where a stranger decides whether the studio is for them.

### B4 — legal: a clause that declares itself unfinished

The Terms gained *"Promotions and reward codes"*, which opens **"Not final
terms"** and states in its own body that no lawyer has read it. It is published,
in both languages, on a page clients are asked to accept.

It exists because the homepage quiz issues a discount code. Its operative claim
is that *"a reward code is an invitation to talk about a discount"* — the
binding number being the written quote.

Three ranked questions in §3.9, and one commitment: **if the clause does not
hold, the quiz changes.** It is ours and it is not load-bearing. Better to
change the mechanic than to publish a discount we are obliged to honour on
terms we did not choose.

### B5 — buyers: a sheet to run from, not an argument to read

`docs/68` explains why five sessions are worth an afternoon. That is the wrong
document to hold while moderating. `docs/118` is the tasks verbatim, the pass
criteria, the one rule that decides whether it works (**do not help** — count
to ten), and a note-taking shape.

Re-measured for it: the homepage is **26 screenfuls on a phone** and the first
price is **5.8 screens down** — both moved since the tasks were last revised.

Three things added that nobody has observed: the FAQ *(does anyone ask aloud a
question it already answers? then it is in the wrong place, not missing an
entry)*, the seven photographs *(does anyone ask whose work it is?)*, and the
Brand Challenge *(does anyone play it — and if nobody does, say so)*.

§5 names three decisions these sessions can **overturn**, each with a written
revert. They are not positions being defended.

### B6 — screen reader: written for the page as it is

`docs/67` predates the FAQ, the seven photographs, the contact fallback and
three of the six scroll regions. `docs/117` covers all of it, and §1 lists the
five defects already found and fixed so the reviewer does not spend their time
re-finding them.

The highest-cost item is §2.5: **a visitor who cannot tell whether their
message sent is a lost enquiry.**

---

## 5. The argument these packs make for themselves

Every defect in §2 passed every automated check. Two were found by dumping the
accessibility tree by hand while writing `docs/67`; two more the same way while
writing `docs/117`; one by reading a sentence an Arabic reviewer was about to be
sent.

**Five defects, none of which any harness reported, all found by preparing to
ask a person.** Two of them now have rules so they cannot come back — which is
the right order: a person finds the shape, a machine holds the line.

The four reviews are still the four reviews. **None of them needs anything from
us first**, and the packs are now short enough to send today.

---

## 6. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low — **32 sections now** |
| `responsive` | 0 findings over 48 page/width/language combinations |
| `a11y` | 0 axe violations |
| §31 | negative-tested in English and Arabic |
| §32 | negative-tested for missing and duplicate names, in English and Arabic |
| Six scroll regions | each announces its own name, in both languages |
| Selected Work lead | says seven, and there are seven |
