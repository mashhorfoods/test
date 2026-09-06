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

### Three things this says about our own page, before any competitor is seen

**§1 asks ten times in one and a half screens.** Sixty-six seconds of reading
and ten calls to action in 1.54 screenfuls is the densest ask on the page, and
it arrives before the visitor has been given a reason. `docs/81` already
removed one repetition here; the count says the section is still doing too much
at once.

**§9 is the longest section on the site and offers one way out.** 3.22
screenfuls, fifty seconds of reading, a single CTA. Add-ons are the least
committed thing a buyer reads and they are given the most page.

**§11 asks for nothing at all.** Forty-two seconds explaining the process, zero
calls to action, no images. `docs/71` found a phone visitor with no CTA for up
to 5.5 screens and P1-5 closed it; this is the same shape at section scale and
it survived that pass.

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
