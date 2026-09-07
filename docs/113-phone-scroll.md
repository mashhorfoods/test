# The phone scroll, and the address that has to wait

**7 September 2026.** `docs/112` closed the audit with two items recorded as
not-wins. The owner asked for both. One is now fixed; the other has a
prerequisite only they can supply, and the prerequisite turned out to be
bigger than the fix.

---

## 1. Phone scroll length

**Measured first, on a 393×852 phone:**

```
whole page                23,526px = 27.6 screens
the four service blocks    7,442px =  8.7 screens — a third of it
  #branding .c-brandboard    978px   four identity boards, stacked
  #websites .c-devices       930px   one wide frame plus two halves
  #social   .c-modules       560px
```

A grid that stacks is right on a phone for text. For a set of **pictures** it
is wrong: four full-width images in a column is four screens of scrolling to
see one idea, and nobody scrolls a gallery they did not ask for.

So on phones only, the three visual grids become horizontal snapping scrollers
— the same mechanics as `.c-gallery`, which shipped in `docs/86` and has been
on `/story` and the two showcase sections since. Same snap, same peek, same
visible scrollbar for a mouse. **Nothing is hidden and nothing is removed:** the
same panels, in the same order, on one axis instead of the other. Desktop is
untouched — verified, all three still `display: grid`, `overflow-x: visible`.

| | before | after |
| --- | --- | --- |
| Whole page | 23,526px · **27.6 screens** | 21,973px · **25.8 screens** |
| `#branding` | 1,691px | **935px** |
| `#websites` | 2,294px | **1,878px** |
| `#social` | 1,709px | **1,327px** |

### Four things went wrong on the way, and all four were silent

This is the interesting part, and it is why the section is written up rather
than just done.

**1. Placed above the definitions it overrides.** A media query adds no
specificity, so `.c-brandboard { display: grid }` further down the file simply
won on source order. Measured: 978px before, 978px after.

**2. Placed "at the end of the file", which is not the end of the layer.**
`service-detail.css` closes `@layer components` and then adds one *unlayered*
rule. The block landed inside that rule's declarations, where `.c-brandboard`
reads as a descendant of `.c-brandboard__image` and matches nothing. Measured:
978px before, 978px after — again. **The built stylesheet said so plainly and
the source did not, because the braces still balanced**, which is all `qa` §29
can check. It now sits in its own `@layer components` block at the foot of the
file: last in the layer, inside nothing else.

**3. `.c-modules` collapsed instead of scrolling.** `.c-modules__module` is
`block-size: 100%` — 100% of a grid row whose height the grid decided. With no
grid there is no row, so it resolved to auto, the image (`flex: 1;
min-block-size: 0`) collapsed to nothing, and the scroller came out **112px
tall: the card's 7rem floor and no picture at all.** It measured as a saving
and was a disappearing act. The image has a definite height there now.

**4. The flex sizing hit the wrong element.** `.c-modules` holds
`<li class="c-modules__item">` with the module *inside* it, so sizing the
module left the list items to shrink to their content — five cards 56px wide,
and a scroller with nothing to scroll (`scrollWidth` 345 against a
`clientWidth` of 345). The other two grids put their panel at the top level,
which is why they worked first time.

**Honest accounting:** the first "successful" measurement read 21,907px. The
real figure after fixing the collapse is 21,973px. Sixty-six pixels of that
first number were images that had stopped rendering.

### And one thing axe caught that I had already worried about

`scrollable-region-focusable` — **serious** — on `.c-brandboard` and
`.c-devices`. A region you can scroll with a finger and not with a keyboard is
a region some people cannot read. All three now carry `tabindex="0"`, the same
treatment `.c-gallery` has had since `docs/86`. Re-run: 0 violations.

### A comment defending a rule that was not there

Found while placing the block — an empty `@media (min-width: 48em) { }` under a
comment reading *"This is NOT dead code: build-pricing.js still emits the class
for any category with two packages, so deleting the rule would silently break
the next one."*

Checked before removing it: **`build-pricing.js` emits no such class, and no
stylesheet in this project contains a rule for one.** There was nothing inside
the media query to break and nothing outside it to protect. The comment was the
only thing keeping it alive, and it was describing CSS that had already gone —
the empty block is also what made the file's shape confusing enough to swallow
the new rules twice.

---

## 2. The contact address — why it is still gmail

The owner chose *"I'll register the Pixora domain — use hello@ on it."* That is
the right answer and it cannot be applied yet, for a reason the check turned up:

> **The Pixora domain does not exist.** `site.config.json` publishes
> `https://zaokalyamamah.online` — a Hostinger domain — and `docs/44` §1 lists
> `pixora.net` **"or similar — not yet registered"**.

So `hello@zaokalyamamah.online` would put a business address on a domain with
no relationship to the brand on the page, which trades one trust problem for a
more visible one. And publishing an address before its mailbox exists loses
real enquiries, which is worse than either.

**What is needed, in order:** register the domain → create the mailbox →
confirm it receives → then it is *one field*, `contact.email` in
`site.config.json`, plus `node build.js`. `qa` §19 then names every page that
still disagrees, in both languages, including the prose in Privacy, Terms and
Accessibility. Nothing else in the repository names an address.

The warning already sits in that field's own comment (`docs/109`). Nothing more
should be done here until the mailbox is live.

---

## 3. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | **0 violations** — the two it raised are fixed |
| Phone | 21,973px · **25.8 screens**, down from 27.6 |
| `.c-brandboard` | flex, `x mandatory`, scrollable 345/1112, `tabindex=0`, 222px |
| `.c-devices` | flex, `x mandatory`, scrollable 345/831, `tabindex=0`, 514px |
| `.c-modules` | flex, `x mandatory`, scrollable 345/1393, `tabindex=0`, 178px |
| Scrolling actually works | `scrollLeft` 0 → 281 after a 400px push (snap) |
| Desktop | all three still `grid`, `overflow-x: visible`, heights unchanged |
| Console errors | 0 |
