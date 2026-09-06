# The buttons, redesigned — and the two guards that stopped me undoing `docs/73`

**6 September 2026.** Owner request: *"Redesign all buttons design in the
website. Do a complete redesign for the buttons. Check recent UI/UX trends for
the buttons."*

One component, four variants, three sizes, **90 instances across the shipped
pages**. Everything below was measured before it was changed.

---

## 1. What current practice says, and what of it applies

| Finding | Verdict here |
| --- | --- |
| **Radius 8–12px** is the 2026 band; 4px reads as 2018 | **Adopted.** Controls moved 4px → 8px |
| **Pill (999px)** for approachability, especially mobile CTAs | **Rejected.** The panels, tiles and cards on this site are 8–12px rectangles; pill buttons on rectangular surfaces read as borrowed from another design |
| **Micro-interactions confirm the action** rather than decorate it | **Adopted, and it exposed a bug** — §3.3 |
| **Bold gradients and duotone fills** replace flat colour | **Rejected**, and not on taste: `02-tokens.css` §07 states the rule this site works to — *"Depth is expressed through contrast, border and spacing. Shadow is a last resort and exists only for genuinely floating layers."* A gradient primary would be the first thing on the site to break it |
| **Sound cues** | Out of scope for a static marketing site |

## 2. The radius, and why it is a token

`--radius-sm` (4px) was not an oversight. The system splits deliberately:
**surfaces round at 8px and 12px, controls at 4px** — a control is tighter
than the panel it sits on. Five files carried that decision: `button`, `field`,
`header`, `navigation`, `disclosure`.

So the change is the decision, not the value:

```css
--radius-control: var(--radius-md);   /* 8px */
```

All five now read the token. **This is wider than "buttons" and deliberately
so**: a form with 8px buttons and 4px inputs beside them looks broken in a way
neither value is on its own. It is one line to move, and one line to move back.

## 3. Four defects, all measured

### 3.1 The icon button was not square

```css
.c-btn--icon {
  inline-size: var(--control-height);      /* 48 */
  min-block-size: var(--touch-target-min);  /* 44 */
}
```

Measured **48×44**. The one control whose entire meaning is its shape shipped
as a rectangle, because the width took the control height and the height was
left to the touch floor. Both axes now take the control height, with the floor
kept underneath as a floor rather than as the value.

### 3.2 A primary CTA overflowed its column at 320px

At 320px the reward panel gives its call to action 222px and *"Reveal my
reward"* asked for **232**. `white-space: nowrap` means a button cannot answer
that by wrapping, and 32px of padding either side of a 16-character label is
most of the difference. Padding now gives way below 22.5em; the label is the
part that has to survive.

### 3.3 In Arabic, the arrow un-mirrored itself exactly when you aimed at it

The prize. `[dir="rtl"] .u-flip-rtl { transform: scaleX(-1) }` mirrors
directional glyphs. The hover nudge was `transform: translateX(-3px)` on a more
specific selector — **same property** — so hovering replaced the mirror instead
of adding to it. Measured on the shipped build:

```
OLD hover:  transform = matrix(1, 0, 0, 1, -3, 0)     ← scaleX(-1) is gone
NEW hover:  transform = matrix(-1, 0, 0, 1, 0, 0)  translate = -3px
```

An Arabic visitor putting the pointer on the primary CTA watched the arrow flip
to point the wrong way. Nothing could see it: the rule was valid, the mirror
was correct at rest, and the defect existed only in the hovered state of one
language.

Moving hover to `translate` and the press to `scale` fixes it as a side effect
of the real reason for individual properties: **`transform` cannot hold a lift
and a press at once.** Hover lifted 1px and the press set it back to zero,
which is the whole of what a press could say while both shared one property.
It can now drop back to the line *and* shrink to 0.97 — and a button that gives
no feedback when pressed is a button people press twice.

### 3.4 Disabled was the second-heaviest thing on the row

Recolouring explicitly instead of dropping opacity was right and stays. What
was wrong was the colour it was recoloured *to*: a filled grey box, heavier
than the Secondary beside it, which you can actually press. Weight is read
first, so the unavailable action was reading as the more important one. It is
now unfilled — a hairline and disabled text, below every live variant.

Also: `.c-btn--ghost` had no ground, no edge and no shape until a pointer
crossed it — and a touch visitor has no pointer. Lowest emphasis is not the
same as no affordance; it keeps a sunken ground and a hairline.

## 4. The one I got wrong, and how it was caught

I changed the small button from 44px to 40px, reasoning that it renders 44px
with a mouse and 44px with a finger, so the `@media (pointer: coarse)` rule
below it raises nothing and the first step of the ladder is not a step.

Every word of that is true. It is also **exactly the change `docs/73` §3 had
already made in the opposite direction**: `--control-height-sm: 40px` was found
to be a size this site cannot render, and the token was moved *to* 44 on
purpose — *"the small size IS the touch minimum: a real step below the 48px
default, and an honest one."*

Both guards caught it inside one run:

```
validate  HIGH  index.html @1440: 5 target(s) under 44px —
                a.c-btn 187x42.0 "See what it covers…"
qa        MED   .c-btn--sm.c-service__cta renders 42px at 1440px in en —
                not one of the declared control heights 44/48/56 (docs/73)
```

Reverted in full, including the `--control-height-xs` token it needed. The
coarse-pointer rule is **not** dead code and the comment now says so: it is the
floor holding if the token ever moves again. The size ladder steps on the width
axis instead — padding 24/32/40 — where nothing is contracted.

Worth recording plainly: the guard was right and I was not, and the reason I
was wrong is that I re-derived a decision instead of reading the file that made
it. `validate`'s finding named the class and the height because that check was
taught to name things three commits ago; had it still said *"5 targets under
44px"* and nothing else, this would have cost an hour.

## 5. One regression the redesign surfaced

The language toggle clips its segments with `overflow: hidden` to make square
children look round — except when one takes focus, where a rule un-clips the
group so the focus ring is not cut off. At 4px the escaping corners were a
four-pixel discrepancy nobody saw. At 8px it is the first thing you see.

Shape should not depend on clipping. The end segments now carry their own
radius, one border-width tighter so the curves nest, using logical corner
properties so Arabic mirrors for free.

## 6. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | 0 violations |
| Radius | every control 8px: buttons, fields, header, nav, disclosure |
| Sizes | 44 / 48 / 56 — the declared scale, unchanged |
| Icon button | 48×48 |
| Hover / press | `translate: 0 -2px` then `scale: 0.97`, composing rather than clobbering |
| Arabic arrow | mirror survives hover; nudge runs with the reading direction |
| `prefers-reduced-motion` | no lift, no press-scale; the press answers in border colour |
| Disabled | no lift, no scale, no icon nudge |
| 320px | no button wider than its column |
| Focus | the two-layer ring intact on yellow, on surfaces and on charcoal |
| EN/AR heights | identical, all classes — `docs/73`'s result holds |
