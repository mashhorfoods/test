# P1-1 · The measurable benchmark

`docs/69` P1-1. Written 5 September 2026.

X02's first half: our design tokens held against the published specifications
of the reference set. **This is the half of the benchmark that does not need
the recording.**

---

## 1. Method, and its limitation stated up front

`docs/52` §4 refused to benchmark an *experience* from second-hand summaries,
and that refusal was right. This does something narrower and checkable:
compares **published, numeric specification** — spacing ladders, type ramps,
button sizing, target minimums — against our own **measured** values.

Two different grades of evidence, and they are not mixed:

| | Source | Confidence |
| --- | --- | --- |
| **Ours** | Measured in a browser on the built site at 390 / 768 / 1440, both languages | **First-hand.** Reproducible from this repo |
| **WCAG, Apple HIG, Material** | Published normative standards | **High.** These are the specifications themselves |
| **Linear, Stripe, Vercel** | Design-token aggregators and system write-ups, searched 5 Sep 2026 | **Second-hand.** Consistent across independent sources, but not read off their stylesheets — this environment cannot open them |

The third row is why this document ranks findings by *our own* measurements and
uses the references as corroboration rather than authority. Nothing below
changes because a reference site is 4px out.

## 2. The comparison

| | **Pixora** | Linear | Stripe | Vercel Geist |
| --- | --- | --- | --- | --- |
| Base unit | **4px** | 4px | 4px | 4px |
| Spacing ladder | 4·8·12·16·24·32·40·48·64·80·96·120·160 | 4·8·12·16·24·32, rhythm 8/12/24/96 | 4·8·12·16·20·24·32 | 4·8·12·16·24·32·40·48·64 → 192 |
| Section padding | **64px phone → 136px desktop**, fluid | 80px+ | 64px | up to 192px |
| Body size | **16px** | 16px | 16px / 400 | 16px |
| Display size | **44px phone → 104px desktop**, fluid | 72px | — | — |
| Display tracking | **−0.035em** | tight | — | — |
| Weights in use | **400 · 500 · 600 · 700** | — | 300 display / 400 heads | **400 · 500 · 600, capped** |
| Radius in use | **2 · 4 · 8px** (+50%) | 16px panels | 6 radii | 6 · 12 · 16px |
| Container max | **1320px** | — | — | — |

Standards, which are normative rather than comparative:

| | Requirement | **Pixora, measured** |
| --- | --- | --- |
| WCAG 2.5.8 Target Size (Minimum), **AA** | 24×24 CSS px | ✅ **0 controls below 24px** |
| WCAG 2.5.5 Target Size (Enhanced), **AAA** | 44×44 CSS px | ✅ **0 controls below 44px**, 56 controls checked at 390/768/1440 |
| Apple HIG | 44×44 pt | ✅ Met |
| Material Design | 48×48 dp | ◑ Met by most; the 44px controls sit under it |

## 3. The result that matters: the token layer is not where the gap is

**On every measurable axis, this site is already inside the band the reference
set occupies**, and on two it is ahead of all three:

- **Target sizes.** Not one interactive control on any page at any width is
  under 44px. That is WCAG AAA, and it is unusual — most commercial sites fail
  the 24px AA floor somewhere.
- **Fluid section rhythm.** Our 64→136px is a `clamp()`, so it scales with the
  viewport. Stripe's 64px and Linear's 80px are the fixed numbers we sit
  between. The fluid version is the more considered choice, not a compromise.
- **Spacing ladder.** 4px base, and our first nine steps are Vercel's nine
  steps exactly.

**This is a real finding, not a compliment.** The redesign was framed as
"apply the best of these sites to ours", and the measurable layer says there is
very little to import: the numbers already agree. Where Pixora differs from
Linear or Vercel, a visitor is not seeing a spacing scale — they are seeing
**motion, sequencing and how a section hands over to the next**, which is R5 in
`docs/52` §1 and which needs the recording. That is where the remaining gap
lives, and this document is how we know.

Two deliberate divergences worth naming rather than fixing:

- **Weight 700.** Vercel caps at 600 by policy — "400 read, 500 interact, 600
  announce". We use 700 in 139 places. Ours is a display-led brand with a
  heavier headline voice; this is a house choice and it is coherent.
- **Radius 2/4/8 against Vercel's 6/12/16.** Ours is the sharper language.
  Also a house choice.

## 4. Where we diverge from ourselves — the control-height scale

The one finding that is a defect rather than a difference, and it is internal.

`02-tokens.css` declares four control heights:

```
--touch-target-min:  44px   /* "mobile-first, non-negotiable" */
--control-height-sm: 40px
--control-height:    48px
--control-height-lg: 56px
```

**Measured across eight pages at two widths, buttons render at 44, 46, 48, 54
and 56px — and never at 40px.** Two of those five are not in the scale, and one
scale value is unreachable.

The mechanism is the same one that has caught this project repeatedly: a
declaration that looks authoritative and does not bind.

| | What happens | Why |
| --- | --- | --- |
| **`--control-height-sm: 40px` is unreachable** | `.c-btn--sm` renders **46px** everywhere | `min-block-size` is a *floor*. The button's icon is **20px**, taller than its 14px line-height, so 12+12 padding + 20 icon + 2 border = 46. The icon sets the height; the token never applies |
| **`--control-height: 48px` is conditional** | The same class renders **48px on desktop and 56px on phone** | "Request a Custom Quote" wraps to two lines at 390px. The floor governs a one-line label and stops governing a two-line one |
| **`--control-height-lg: 56px` is bypassed** | `.c-final__cta` renders **54px** | It sets its own `padding-block: 16px` and a 20px font instead of taking the token — 32+20+2 = 54. It wants to be the large size and misses it by 2px |

So the scale describes intent and does not govern outcome. A designer reading
the tokens would expect four heights; the site ships five, one of them 2px from
a token it should have used.

**None of this is a live defect** — every height clears 44px, so nothing fails
accessibility and nothing looks broken. It is a system-integrity problem, and
it is exactly what X09 exists to fix.

## 5. What to change, ranked

Ordered by whether it changes what a visitor experiences.

| | Change | Why | Where |
| --- | --- | --- | --- |
| **1** | **`.c-final__cta` takes `--control-height-lg`** instead of its own padding | The site's single most important button is 2px off the large size it is trying to be | P1-3 |
| **2** | **Redefine `--control-height-sm` as 46px, or shrink the icon to 16px** | 40px is unreachable while the icon is 20px. One of the two numbers is wrong and it should be decided rather than left | P1-3 |
| **3** | **State the tokens as minimums, in the token file** | They *are* minimums — `min-block-size` — and a label that wraps will always grow. Naming them `--control-min-*` would stop the next reader expecting a fixed height | P1-6 / X09 |
| **4** | **Decide the 44 vs 48 question once** | 44px meets WCAG AAA and Apple HIG; Material asks 48. Our nav links, language toggle and menu trigger sit at exactly 44. Raising `--touch-target-min` to 48 is a one-token change | P1-5 / X08 |
| **5** | Leave weight 700 and the 2/4/8 radius alone | House voice, coherent, and divergence from Vercel is not error | — |

Nothing here is urgent, and **that is the headline.** The measurable layer is
sound; item 1 is a two-pixel correction to the most important button on the
site, and the rest is hygiene.

## 6. What this does not answer

Stated so it is not mistaken for a complete X02.

- **Motion, and rhythm over time.** Not derivable from a spec sheet. Needs B1.
- **How a section hands over to the next** — R5, the actual brief. Needs B1.
- **How a grid re-thinks itself at 768px** rather than shrinking — R2. Needs B1.
- **Category and section order.** Needs B5, and `docs/68` §5 argues five buyers
  answer it better than any reference site could.

---

**Sources for the second-hand row**, searched 5 September 2026:
DesignMD ([Linear](https://designmd.cc/benchmarks/linear),
[Stripe](https://designmd.cc/benchmarks/stripe),
[Vercel](https://designmd.cc/benchmarks/vercel)),
[925 Studios' Linear breakdown](https://www.925studios.co/blog/linear-design-breakdown-saas-ui-2026),
[Vercel Geist on DesignSystems.one](https://www.designsystems.one/design-systems/vercel-geist),
[design-bites DESIGN.md for vercel.com](https://github.com/educlopez/design-bites/blob/main/design-mds/vercel.com/DESIGN.md).
Standards: [WCAG 2.5.5](https://accessibility.build/wcag/2-5-5),
[WCAG 2.5.8](https://wcag22aa.org/new-criteria/target-size/),
[TetraLogical on target sizes](https://tetralogical.com/blog/2022/12/20/foundations-target-size/).
