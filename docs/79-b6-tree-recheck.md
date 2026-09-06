# B6 — the tree, re-read after a day of changes

`docs/69` P2 B6. Written 5 September 2026.

**B6 needs a person with a screen reader and this is not one.** `docs/67` §2's
six questions — does the page make sense read in order, do the alt texts tell
you anything, should a WhatsApp button warn that it leaves the site, does the
Arabic voice actually switch — are untouched by this document and still need
ears.

What this is: `docs/67` §1's accessibility-tree pass was run **before** a day
that added a phone header CTA, four photographs, bilingual alt text and a
reworked button system. **The tree was re-read against the site as it is now**,
and it found one defect of exactly the kind that pass was written to catch.

---

## 1. The finding: twelve controls with one name

| | |
| --- | --- |
| Controls announcing **"What's not included"** | **12 on `/`, 12 on `/pricing`** |
| Distinct destinations | **12** — one per package card |
| Distinct names | **1** |

A screen-reader user tabbing the pricing grid met twelve controls that
introduced themselves identically, in a page where each belongs to a different
package.

**This is the same defect `docs/67` §1 found and fixed**, in the same session,
on the same page — five identical *"See what it covers"* links, one per
service. It survived that pass because **the pass looked at links and buttons,
and this is a `<summary>`.**

And like the three before it, **axe reports zero violations** either way. The
element had a name. The name was just the same as eleven others.

### The fix, and a correction to it

Each summary now carries its package name, hidden, using the mechanism the
earlier fix established — safe here for the same reason it was there: the label
is a `pair()` of spans, not `data-i18n`, so nothing overwrites its children at
runtime.

**The first version of the fix said "What's not included in Starter", and that
was wrong.** All twelve disclosure bodies render from `terms.shared` and are
**byte-for-byte identical** — the exclusions are the studio's, not the
package's. *"…in Starter"* is true and still implies a specificity that does
not exist. It now reads **"What's not included — Starter"**: it names the card
without claiming the content belongs to it.

## 2. The structural fact underneath, which is B5's

Worth stating plainly because the fix makes it easy to stop noticing:

> **The same content is disclosed twelve times on one page.** Twelve
> `<details>`, twelve identical bodies, one per package card.

That is not an accessibility defect and it is not fixed here. It is the same
class of observation as `docs/74` §4 — six consecutive sections sharing one
rhythm — and it belongs with `docs/55` §6's structural question, which
`docs/69` assigns to **B5**. Five buyers can say whether twelve identical
disclosures read as thorough or as noise; a measurement cannot.

## 3. What else the re-read checked, and cleared

| | Result |
| --- | --- |
| Headings, `/`, `/story`, `/pricing`, both languages | **One `h1` each, no skipped levels** — 53, 10 and 23 headings |
| Controls with no accessible name | **0**, after a false alarm — see below |
| The three fixes from `docs/67` §1 | Still hold: `button "Copy the email address"`, five distinct *"See what it covers in …"*, `link "Founder's portfolio"` |
| The 12 package CTAs | Already distinct — *"Ask about Landing Page"*, *"Ask about Social Growth"* — because package names are unique |
| The four new deliverable images | Announce their full written descriptions, and switch language with the page |
| Names repeating **with one destination** | *"Start Your Project"* ×4 → all `#contact`; navigation ×2 → header and drawer. Deliberate, and `docs/30` §11 argued for it |

**The false alarm is worth recording**, because it is the pattern this project
keeps meeting from the other side. The first pass reported **three form inputs
with no accessible name**. They have proper names — *"Your name"*, *"Your
email"*, *"What are you looking to build?"* — from their `<label for>`
elements, which my name calculation did not read. **The browser was asked
before the finding was written down**, and it said the markup was fine.

## 4. The guard

`qa.js` §18. The rule, stated so it does not over-fire:

> **Three or more controls sharing an accessible name is fine only if they all
> go to the same place.**

Four *"Start Your Project"* buttons all pointing at `#contact` pass — that is a
deliberate repetition. Five links to five anchors do not. A `<summary>` has no
destination, so its card's own heading stands in for one.

Verified by removing the package-name suffix: **2 HIGH, naming both pages, the
count and the number of destinations.** With the fix, zero.

## 5. What B6 still needs, unchanged

`docs/67` §2 in full — whether the page reads sensibly in order, whether the
headings work as a table of contents, whether alt text describing brand
artwork conveys anything, whether *"Ask about Starter"* should warn that it
opens WhatsApp, whether the menu traps focus properly by ear, and whether an
Arabic voice actually engages.

**A tree dump proves a name exists. It cannot tell you the name is wrong**, and
three of the four defects found this way were names that existed and were
useless.
