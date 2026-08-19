# Stage 07 — Social Media Management

> **The five modules are renders now, not drawings, and they carry no labels.**
> Content calendar, Post, Reels, Stories and Insights are supplied images; the
> step numerals (01–05) and the caption above each went with the drawings, on
> request. The card is the artwork.
>
> **`object-fit: cover` from the top**, the same rule as the Websites device
> cards and for the same reason: the lead module **spans two grid rows** by
> design, so sizing it to its own image leaves a void beside the two stacked
> next to it. `top` keeps the head of a post, a Reel or a Story — the part that
> carries the design — and lets the tail run off.
>
> **The rows are bounded** — `grid-auto-rows: minmax(0, 11rem)`, and `13rem`
> from 64em. With `auto` rows the lead took its height from its own image and
> left a **507px void** beside it at 1024px and up. Measured at eight widths in
> both directions: every image fills its card, the only space left is the 1px
> border, and the grid is a steady 440px on desktop.
>
> A `min-block-size` floor stops a failed load collapsing a card — these are
> hotlinked from `i.ibb.co`, which the build environment cannot reach, so the
> images could not be inlined or looked at.

Three packages with complete feature lists, a content-operations module grid
and the service workflow. Reuses `.c-detail`, `.c-tier` and the module grid.

---

## 1. The first bilingual source

This is the first section whose document supplies features **in both
languages**: some strings arrive already in English (`Content Calendar`,
`Stories`, `Copywriting`, `Monthly Strategy Review`…), the rest in Arabic.

Both ship in the markup and CSS shows the one matching the document language:

```html
<span data-lang-copy="en">Content writing</span>
<span data-lang-copy="ar" lang="ar">كتابة المحتوى</span>
```

No script is involved, so the correct language renders before hydration and
with JavaScript disabled. `lang` on the element is what tells a screen reader
which voice to use; the data attribute is the styling hook, kept separate so
the two concerns cannot collide — and so it never clashes with the language
toggle's own `data-lang`.

This is distinct from `data-i18n-pending`, which marks copy that has **no**
translation yet. A string with both variants needs neither that attribute nor
its LTR-island treatment.

**Arabic is reproduced character-for-character.** A test holds an independent
transcription of all 31 feature strings and compares them index by index.
English translates only the Arabic-only items; strings already English in the
source are identical in both columns.

### One legitimate divergence

Arabic writes "two platforms" with the **dual form** — `إدارة منصتين` — which
carries no numeral, where English needs "2 platforms". So Starter has one more
digit in English than in Arabic. Every other quantity matches digit for digit
(3/12/4, 5/16/8), which a test verifies.

---

## 2. Content

| Package | Price | Features |
| --- | --- | --- |
| Social Starter | 150 SAR monthly | 8 |
| Social Growth | 250 SAR monthly — **الأكثر طلبًا / Most Popular** | 11 |
| Social Pro | 450 SAR monthly | 12 |

Billing is **monthly** here, unlike every earlier service; `billingMonthly` was
added to the translation table alongside `billingOnce`.

Social Growth is the recommendation the source designates, marked the same four
ways as Branding's: a text ribbon (bilingual), accent border, raised surface and
the only primary CTA.

Note that Branding's document says *Most Requested* and this one says
*الأكثر طلبًا / Most Popular*. Those are two documents' wordings and both are
reproduced as given rather than unified.

---

## 3. No platforms named

The packages specify platform **counts** — two, up to three, up to five — and
never which platforms. Naming or drawing Instagram, TikTok, Snapchat or
Facebook would add data the document does not contain, and §07 warns against
implying affiliation. The module artwork uses abstract tiles instead.

No follower count, reach figure or engagement rate appears anywhere, and a test
asserts no digit exists inside the section's SVG.

---

## 4. Package order on mobile

§15 suggests promoting Social Growth above Starter on mobile. I kept the
source order (Starter → Growth → Pro) at every width.

Reordering visually with CSS `order` leaves the DOM sequence unchanged, so
keyboard and screen-reader users would meet the packages in a different order
from sighted users — a documented WCAG failure (meaningful sequence). The
alternative, duplicating the markup, ships the packages twice.

Growth is already unmistakable through its ribbon, border, surface and primary
CTA, which is what §15's promotion was for. §15 itself says not to remove the
logical order unless the design requires it, and it does not.

---

## 5. Two false positives in my own tests

Both flagged, both investigated, neither a page defect:

- **"Fake social proof found"** — the regex matched `Review`, from the source
  feature *Monthly Strategy Review*. Tightened to match the plural and the
  phrases that actually claim.
- **"Quantities diverged"** — the Arabic dual form described above. The check
  now records it as a known, explained difference rather than a failure.

Worth stating plainly: a test that fails for the wrong reason is as much a
defect as one that passes for the wrong reason.

---

## 6. Component rename

The Stage 06 module grid was `.c-commerce*`, which named it for one service.
Reusing it here made that wrong, so it is now `.c-modules*`. Stage 06's markup
and its full suite were re-run after the rename.

---

## 7. Verified

Headless Chromium, LTR and RTL:

- All 31 Arabic feature strings and all three prices match an independent
  transcription of the source, index by index.
- Exactly one language's copy is visible at a time (49 spans each way).
- No platform names, no social proof, no digits in artwork, one primary CTA.
- One `h2` inside a real `<header>`, `h3` per package, packages as
  `<article>`, every Arabic span carries `lang="ar"`, the ribbon has text so
  the recommendation never rests on colour, no heading level skips.
- **No overflow at all eleven widths §35 names × two directions, with every
  disclosure forced open.**
- All targets ≥ 44px; with JavaScript disabled all prices and features render
  in the document language.
- Branding, Websites, E-Commerce, Services, Hero, Header, IA and styleguide
  suites all still pass.

---

## Open items

- Review the English column: it is a translation of the supplied Arabic, not
  approved English copy.
- Stages 08–09 (Digital Marketing, Integrated Solutions) reuse these
  components; those Services rows still point at `#pricing`.
- Earlier sections' Arabic copy can now use `data-lang-copy` as it arrives,
  retiring their `data-i18n-pending` markers.
