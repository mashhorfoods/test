# The section-by-section pass — our row, and the ten that are missing

**6 September 2026.** The owner asked how our design compares to the best ten
competitors, **section by section, hero excluded**. This is the honest state of
that: the instrument is built, our own row is measured, and the ten competitor
rows cannot be produced from this container.

---

## 1. Why the hero is excluded, and why that is the right call

It is the one section already settled — `docs/53` budgeted it, `docs/80` §2.3
held the dark-side-left rule against the reference's opposite choice — and it
is the section where every agency site in this market looks the same. The
differences live in what comes after.

---

## 2. What the probe now reports per section

`tools/reference-probe.js` already carried order, height in screenfuls,
padding rhythm and headings. Added for this pass: **reading cost in seconds,
CTA count and labels, image count, video count, whether a slider is present,
and list density.** One phone-width run per site produces one row.

Those fields were chosen because they answer *what is this section doing*
rather than *what does it look like* — a comparison of looks needs eyes and a
screenshot; a comparison of behaviour needs numbers, and numbers survive being
pasted into a chat.

---

## 3. Our row — homepage, 393×852, measured

**25.09 screenfuls.** Hero first, excluded from the comparison but shown for
completeness.

| # | Section | sf | read | CTAs | imgs | slider |
| --- | --- | ---: | ---: | ---: | ---: | :-: |
| — | *Hero* | 1.26 | 17s | 1 | 10 | no |
| 1 | Everything Digital. Built to Work Together. | 1.54 | **66s** | **10** | 10 | no |
| 2 | *(service index)* | 0.45 | 16s | 1 | 1 | no |
| 3 | Think you can solve it? | 0.60 | 9s | 2 | 2 | no |
| 4 | Build a brand people recognize. | 1.98 | 13s | 2 | 6 | no |
| 5 | Build a digital experience that works. | 2.69 | 22s | 2 | 5 | no |
| 6 | Stay active, consistent and connected. | 2.01 | 15s | 2 | 7 | no |
| 7 | Reach the right people. At the right moment. | 2.05 | 41s | 2 | 2 | no |
| 8 | Everything your business needs. Connected. | 1.77 | 29s | 5 | 6 | no |
| 9 | Need something extra? | **3.22** | **50s** | **1** | 1 | no |
| 10 | A reward is waiting for you. | 0.56 | 9s | 2 | 2 | no |
| 11 | A clear process. From idea to launch. | 1.95 | 42s | **0** | 0 | no |
| 12 | Let's build your digital presence. | 0.62 | 7s | 1 | 1 | no |
| 13 | Let's talk. Let's build it. | 2.08 | 43s | 8 | 7 | no |

### Three things this said about our own page — and only one survived

The first version of this section listed three findings. Acting on them meant
looking at each one properly, and **two did not survive that.** Both are left
here rather than deleted, because the way they failed is the useful part.

**RETRACTED — "§1 asks ten times in one and a half screens."** It does not. The
services section is a five-item accordion, and the ten controls counted were
five disclosure triggers plus five "See what it covers" links, **four of them
inside collapsed panels a visitor cannot see or press.** At rest the section
offers exactly one ask, the same as most others on the page.

The fault was in the probe: a control inside a collapsed panel keeps a
perfectly good bounding rect, because the panel clips it with `overflow` and a
zero track rather than removing it. `vis()` asked the element about itself and
never asked whether anything above it was hiding it. **That would have
overcounted every competitor using an accordion or tabs**, which is most of
them, so it is fixed before the rows are collected rather than after.

The probe now also separates **asks** from **controls**: a disclosure trigger
opens something on the page it is already on, and counting the two together
makes a five-item accordion look like a page begging.

**WITHDRAWN — "§11 asks for nothing at all."** True as a count, not true as a
problem. The process section carries no CTA, but it is 1.95 screenfuls and is
followed immediately by a dedicated CTA band, and P1-5 added a scroll-triggered
header CTA above it. `qa.js` §14 measures reach by actually scrolling and
passes with no findings. A visitor is never stranded, which is the thing that
mattered in `docs/71` — the count was real and the inference from it was not.

**STANDS — §9 was the longest section on the site and offered one way out.**
3.22 screenfuls and fifty seconds of reading, against services that top out at
2.69. The least committed content on the page was taking the most of it — while
the actual offer above it was already collapsed behind an accordion whose lead
reads *"Five services. Open any one to see what it covers."*

Fixed by giving add-ons the same treatment, as native `<details>` so it needs
no script at all. Measured, same probe, same width:

| | before | after |
| --- | ---: | ---: |
| Add-ons section | 3.22 sf | **2.03 sf** |
| Reading cost | 50s | **36s** |
| Whole homepage | 25.09 sf | **23.89 sf** |

Nothing was removed — 9 prices and 12 names before and after — and the first
category ships open, so a visitor still lands on real prices rather than five
shut doors. Verified with JavaScript disabled: one group open on arrival,
clicking a second opens it, six prices visible without a line of script.

**And no slider anywhere on the homepage** — `docs/86`'s gallery lives only on
`/story`. That is the honest starting point for the queued C1 question of where
a second one earns its place.

---

## 4. What is missing, and it is not analysis

Ten rows. The set is named in `docs/69` §5c — RAM, PrezLab, Rabeez, Teryaq,
SRMG Labs, Digital Gravity KSA, Prism Digital, Pro Branding, Emirates Graphic,
Upscale Digital — sourced by search on 6 September.

**Nothing in this container has seen any of them.** WebSearch works; fetching a
page returns `EGRESS_BLOCKED`, re-confirmed today against `prismdigital.ae`.
A section-by-section comparison written from search snippets would be an
assertion wearing a table's clothes, and this project has a rule against that.

**To finish it:** open each site on a phone-width window, paste
`tools/reference-probe.js` into the console, paste back the JSON. Ten runs.
Each one adds a row to the table above, and the comparison writes itself from
numbers rather than from impressions.

Until then §3 stands on its own — it is a measured critique of our own page,
which is worth having whether or not the other ten ever arrive.

---

## 5. One thing measuring from here hides

The same egress block that stops the competitor rows also hides part of our own
page. CI's first-screen breakdown names a 3KB `script.js` this container never
sees: the Plausible tag, on every page, the only third-party request on the
first screen (`docs/98` §5.2).

Worth carrying into the comparison: **when the ten rows arrive from a real
browser, they will include third-party weight that our local numbers do not.**
Compare CI's figures with theirs, not this container's.
