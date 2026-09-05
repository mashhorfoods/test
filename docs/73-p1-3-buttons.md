# P1-3 · The button system

`docs/69` P1-3. Written 5 September 2026.

Every variant, every state, both directions, both languages — and the three
items `docs/70` and `docs/72` left open.

---

## 1. The states layer was already right

Measured in a browser by actually hovering, focusing and pressing, rather than
read off the stylesheet:

| | rest | hover | focus | active |
| --- | ---: | ---: | ---: | ---: |
| **Primary** contrast | 10.89:1 | 11.47:1 | 11.56:1 | 8.47:1 |
| **Secondary** contrast | — (transparent) | 10.27:1 | 10.12:1 | 7.96:1 |

- **Every state produces a visible change.** No state is a no-op.
- **Every measurable state clears 7:1**, which is WCAG AAA for text; the
  requirement is 4.5:1.
- **The focus ring is two layers** — `0 0 0 2px` in the page ink, then
  `0 0 0 4px` in the accent. That is the technique that survives *both* a dark
  and a light surface, which a single-colour ring does not. It is applied
  globally to `:focus-visible`, with an OS ring substituted under
  `forced-colors`.
- **The RTL icon genuinely flips** — `matrix(-1, 0, 0, 1, 0, 0)` — and moves
  from right-of-centre to left-of-centre with the direction.
- **The disabled state recolours rather than fading.** The stylesheet says why:
  *"opacity alone is not a state — recolour explicitly."*

Nothing in this section needed changing.

## 2. The finding: every button on the site was a different size in Arabic

`docs/70` §4 found that the control scale declared 40/44/48/56 while the site
rendered 44/46/48/54/56. Looking for the cause found something larger.

**Seven button classes of seven were taller in Arabic than in English on
desktop; six of seven on phone.**

| | English | Arabic | |
| --- | ---: | ---: | ---: |
| `.c-final__cta` | 54px | **69px** | **+15** |
| `.c-btn--primary` | 48px | 52px | +4 |
| `.c-hero__action` | 48px | 52px | +4 |
| `.c-tier__cta` (both variants) | 48px | 52px | +4 |
| `.c-header__cta` | 48px | 52px | +4 |
| `.c-service__cta` (small) | 46px | 51px | +5 |

The cause, and it is the third time this project has met it:

> `.c-btn` sets `line-height: 1`. **The label is a `<span>`, and the span is
> what carries `lang="ar"`** — so the generic `:lang(ar)` rule gives the span
> body leading, and the button's own line-height never reaches the text.

`docs/43` §12 was the Arabic headings. `docs/72` §2 was the phone header CTA,
where the local fix was applied. This is the component root, so there is not a
fourth.

**Nothing looked broken**, which is why it survived every check and every
review: each button was internally consistent, cleared 44px, and had correct
contrast. The buttons were simply **a different size in half the site's
language** — including its most important one, by fifteen pixels.

## 3. The two smaller ones, both from `docs/70` §5

**`--control-height-sm: 40px` was a size this site cannot render.** A small
button carried `--icon-md` at 20px against a 14px label, so the icon was taller
than the text and set the height itself: 12+12 padding + 20 icon + 2 border =
46px, and the token never applied. Small buttons now carry `--icon-sm` (16px)
so the icon fits inside the line, and **the token is 44px** — the touch floor
the same file calls non-negotiable. The small size *is* the touch minimum: a
real step below the 48px default, and an honest one.

**`.c-final__cta` was reaching for the large size through its own padding** and
landing on 54px, two short of the 56px token. It now names
`--control-height-lg`.

## 4. What it produced

| | Before | After |
| --- | --- | --- |
| Distinct rendered heights | **5** — 44, 46, 48, 54, 56 | **3** — 44, 48, 56 |
| Heights not in the token scale | 2 | **0** |
| Declared sizes that never render | 1 (`40px`) | **0** |
| Button classes differing between languages | **7 of 7** desktop, 6 of 7 phone | **0 of 7**, both widths |

Measured across eight pages × two widths × two languages: every button renders
at a size the system declares, and at the same size in both languages.

**Layout moved only where it should.** English: `+2px` on the homepage, the
one page with `.c-final__cta`, and nothing else on any page. Arabic: the
homepage `−34px`, `/pricing` `−17px`, `/404` `−4px` — the pages shortening as
their buttons stop being oversized. Everything else identical.

States re-verified after the change: contrast 10.89 / 11.46 / 11.56 / 8.47 on
primary, the ring intact, the RTL flip intact.

`validate: 0 · qa: 0 high · a11y: 0`.

## 5. The guard

`qa.js` §15 measures every button on `/` and `/pricing` at 390 and 1440 in both
languages, and fails on either of:

- a height that is not one of **44 / 48 / 56** — `MED`, because it is a system
  drift rather than a defect a visitor suffers;
- **the same button rendering at different sizes in the two languages** —
  `HIGH`, because that is what happened here and no other check on this project
  could see it.

Verified by deleting the one rule that fixes it: **12 findings across 6 button
classes**, each naming the class, the width, the language and both heights.

## 6. What is left

- **Whether package buttons should say WhatsApp.** Twelve of 23 open it and
  none says so (`docs/71` §4). Still B5's and B6's to answer, not mine to
  guess.
- **The `.c-btn--ghost` and `.c-btn--icon` variants are styled and unused** —
  part of the 91 selectors in `qa.js` §12's inventory, and X09's to resolve.
