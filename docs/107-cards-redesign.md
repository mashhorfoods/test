# The cards — twenty-three surfaces and no card

**7 September 2026.** Owner request: *"Redesign all cards design in the website
(shadow, borders, appearance, presence, act… etc). Check online for recent
UI/UX trends for the section."*

(The request also repeated *"do a complete redesign for the buttons"*, which
was the previous pass and shipped as `docs/105` / `a7a7ffd`. Read as a
carry-over line; the buttons were not touched again.)

---

## 1. What was measured before anything was changed

Every element on `index`, `pricing`, `story` and `about` with a radius, a
ground and a box larger than 120×60 — 23 surfaces:

| | |
| --- | --- |
| Distinct radii | **4** — 4px, 8px, 12px, 50% |
| Distinct grounds | **7** |
| Shadows | **0 of 23** |
| Interactive | 8 of 23, no shared treatment |
| `.c-card`, the design system's card component | **28 uses, all on /styleguide. Zero on any shipped page** |

The last line is the cause of the other four. The site has a card component
that gets radius, ground, hover and lift exactly right, and every real card on
the site was built without it.

## 2. What current practice says about the first word in the request

**Shadow.** Two findings, and they point the same way.

A drop shadow is a dark smudge, and this interface is already dark: over
`#202020` it is close to invisible. Dark-mode depth is carried by **ground** —
a raised element gets a lighter background than what it sits on. Separately,
Linear, Vercel, Stripe and Anthropic all moved to hairline borders and away
from soft shadows through 2025–26, to the point that shadow-heavy cards now
read as legacy in the way skeuomorphic buttons did by 2014.

`02-tokens.css` §07 already said the same thing in its own words — *"depth is
expressed through contrast, border and spacing; shadow is a last resort"* — so
the answer to "add shadows" is that this interface cannot spend them and the
field has stopped asking. **What it was missing is the thing shadows are for.**

**Radius.** 12px for a card carrying an image, 8px for a compact one carrying
text. The site had both values and a stray 4px.

## 3. The contract

Named once in the tokens, with the ladder written down:

```
a band              #141414 / #1a1a1a / #202020
a card at rest      #262626   — lighter than every band above it
a card under the    #2e2e2e   — one more step, a brighter edge, a 4px lift
  pointer
```

`--card-surface`, `--card-surface-hover`, `--card-border`,
`--card-border-hover`, `--card-radius`, `--card-radius-media`, `--card-lift`.
Every card now reads from these rather than choosing again.

## 4. Three defects the measurement found

### 4.1 The pricing card was the one card that was not raised

Twenty-two surfaces sat **+6 to +18** lighter than the band behind them.
`.c-tier` sat at **+0.0** — the same `#202020` as its own band. It was an
outline drawn on the page, not a card resting on it.

Its `:hover` *did* step to `#262626`. So the pricing card became a card only
when you pointed at it — and a phone visitor, who never points at anything,
never saw it happen. That is the surface where the money decision is made.
`.c-device` was flat for the same reason.

### 4.2 Raising every tier nearly killed the recommendation

A regression I introduced and caught in the same pass. The recommended package
is *"marked four ways — a text label, an accent border, a raised surface and a
primary CTA"*. "Raised surface" meant `#262626` while ordinary tiers sat at
`#202020`. Raising the ordinary ones to the card ground put them at `#262626`
too, and the recommendation quietly dropped to three signals — at rest **and**
on hover, since both then landed on the same two values.

The featured tier moves up a rung instead of sharing one:

| | rest | hover |
| --- | --- | --- |
| ordinary | `#262626` | `#2e2e2e` |
| recommended | `#2e2e2e` | `#383838` |

Four values, one ladder, and the step between ordinary and recommended is the
same at either end.

### 4.3 The accent border did not survive the pointer

Pre-existing, and visible only because this pass measured the ladder rung by
rung. `.c-tier:hover` is a class plus a pseudo-class; `.c-tier--featured` is a
class. The hover rule is therefore **more specific whatever the source order**,
so pointing at the recommended package replaced its yellow edge with the
ordinary white one:

```
featured border at REST     rgb(244, 209, 63)
featured border HOVERED     rgba(255, 255, 255, 0.2)     ← the signal, gone
```

The recommendation lost a signal at the exact moment a visitor was engaging
with it. Now held on hover.

## 5. What was deliberately left alone

Not every bordered box is a card, and flattening the ones that are not would
have been the easy mistake:

| | why |
| --- | --- |
| `.c-orbit__card` (−12), `.c-service__visual` (−6) | recessed wells. A well is *supposed* to sit below its ground |
| `.c-orbit__node`, `.c-orbit__core` (+0) | overlay parts of a diagram, not cards |
| `.c-contact__form` (+12) | a panel containing `.c-field__control` at `#262626`. Raising the panel to the card ground would have made its own inputs vanish into it |
| `--radius-sm` on chips, ribbons, code blocks and the ladder chips | small chrome is allowed to be tighter than a card. That split is deliberate; only the four card-sized 4px surfaces moved |

## 6. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | 0 violations — the lighter grounds cost no contrast |
| Distinct card radii | **4 → 2** (8px, 12px; plus the orbit core, which is a circle) |
| `.c-tier` elevation | +0.0 → **+6.0** |
| `.c-device` elevation | +0.0 → **+6.0** |
| Tier ladder | 38 → 46 rest/hover; featured 46 → 56 |
| Featured accent border | held at rest **and** on hover |
| Interactive cards | one contract: ground step, border step, 4px lift under `any-hover` only |
