# The gallery — a slideshow that works before any script does

**6 September 2026.** `docs/84` §3 argued for a scroll-snap gallery over a
carousel and named where it belongs. This builds it.

---

## 1. Why not a carousel, in one measurement

`docs/83` measured what happens on this site when content is hidden behind
JavaScript and the script fails: **132 blocks across four pages, invisible
permanently.**

A carousel is that pattern deliberately. Every slide but one is hidden, and
only script brings the rest back. Adding one would have re-created, on purpose,
the defect we spent this morning removing.

A scroll-snap track hides nothing. It is a row that overflows and comes to rest
on each item. **With no JavaScript at all it is still a usable gallery**, so
there is nothing for a failure to strand.

Three things it inherits rather than re-solving:

| | |
| --- | --- |
| **RTL** | Logical properties and the document's own direction reverse the track. No second implementation, no arrow whose meaning flips |
| **Reduced motion** | Nothing moves on its own, so there is no auto-advance to stop. The universal guard in `01-reset.css` covers the rest |
| **One CTA per surface** | Survives, because the gallery carries no CTA |

---

## 2. Where it is used, and where it is not

`build-story.js` now chooses by count:

| Deliverables in a chapter | What renders |
| --- | --- |
| 0 | nothing |
| **1** | the plain figure it always had |
| **2 or more** | the gallery |

**A one-slide slideshow is a picture wearing controls**, and worse than the
picture. Today that means `insight` and `transformation` keep their single
figures and only `impact` becomes a gallery — the campaign set and the company
profile.

**Said plainly: this changes one place on the site today.** The component was
built properly anyway because the portfolio is what it is really for, and a
portfolio is the most obvious thing an agency site selling design is currently
missing. The cost of building it now, while the reasoning is fresh, is one
file.

---

## 3. Two defects found by rendering it and looking

### 3.1 Slides at wildly different heights

First render, with `block-size: auto`: the campaign sheet is portrait, the
company profile is landscape, so at a shared 736px width they came out roughly
**1035px and 400px tall**. Side by side that is not a gallery, it is two
pictures that fell over — and their captions landed some 600px apart.

Fixed with one height for every slide and **`object-fit: contain`, never
`cover`**. These are *deliverables*: cropping to fill a uniform box would cut
the work being shown, which is the one thing the component exists to display.
So the box is uniform, the artwork is whole, and the leftover is the page's own
surface.

This is only findable by rendering and looking. No harness would have called it
a failure.

### 3.2 An unnamed control for anyone without JavaScript

The scroller is focusable, so it needs an accessible name. The first version
used `data-i18n-label`, which `navigation.js` swaps from `STRINGS` on every
language change — correct for Arabic, and **script**.

Measured with JavaScript off: `aria-label: null`. A focusable scroll region
with no name at all, on the one component whose entire argument is that it
works without script.

Fixed the same way `docs/82` fixed the WhatsApp href: **the English name ships
in the markup, and the swap improves it.** Verified in all four modes:

```
desktop / en / js on   "The work delivered — scroll for more"
desktop / ar / js on   "الأعمال المسلَّمة — مرّر للمزيد"
phone   / en / js on   "The work delivered — scroll for more"
desktop / en / js OFF  "The work delivered — scroll for more"
```

### 3.3 One smaller thing

The caption originally printed the `alt` text. `alt` is a *description* written
for screen readers — 300 characters of it — and as a visible caption it would
both fill the page and be read twice, once as the image and once as the
caption. **A caption is a label**, so `story.json` gained short bilingual
labels (*The campaign set*, *The company profile*), and a deliverable without
one gets no caption rather than a bad one.

---

## 4. The guard

`qa.js` **§21**. The promise — *it hides nothing* — is one CSS declaration away
from being false: `overflow: hidden` instead of `auto`, or a later rule giving
a slide `display: none`, turns it back into a carousel with no script to
operate it. Every item after the first becomes unreachable, silently.

So, **with JavaScript off**, which is the state the component was chosen for:
every item must be visible, and the track must actually scroll. A gallery
rendered with fewer than two items is a MEDIUM, because that is the builder
failing to degrade.

Proved by breaking it:

| Mutation | |
| --- | --- |
| clip the track instead of scrolling it | **caught** |
| hide a slide | **caught** |

**2 of 2.** The first attempt reported MISSED, and the check was innocent: the
mutation targeted `overflow-x: auto` with a space, while the shipped CSS is
minified to `overflow-x:auto`. The regex matched, the replacement changed
nothing, and the harness dutifully reported a pass for a file it had not
altered.

That is the same false pass as `docs/82` §5.2, one day later and by a different
route. **The harness now asserts the mutated file differs from the original
before it runs anything.** A test that cannot prove it changed something cannot
prove anything.

---

## 5. Verified

Rendered and read back at 1366×768 and 390×844, English and Arabic, JavaScript
on and off:

- **Both items visible in every mode**, including with scripts disabled.
- **RTL reverses with no extra code** — item 1 rests on the right, item 2 peeks
  from the left, captions right-aligned.
- Track scrolls: 1488px of content in a 1192px box on desktop, 700px in 342px
  on a phone.
- Uniform slide height, captions aligned, nothing cropped.
- **Print**: the track becomes a stack. A horizontal scroller on paper shows
  one slide and drops the rest, which is the same stranding in another medium.

`build.js` · `validate.js` **0** · `qa.js` **0 high, 0 medium** · `a11y.js`
**0 violations**.

---

## 6. What it is ready for

The component is generic — `c-gallery`, `c-gallery__item`, `c-gallery__image`,
`c-gallery__caption`. Nothing in it knows about case studies. A portfolio
section is markup plus content, not more CSS, and `docs/84` §3.2 is where that
argument sits.
