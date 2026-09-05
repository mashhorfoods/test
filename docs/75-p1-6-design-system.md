# P1-6 · Design system refinement — X09

`docs/69` P1-6, and **WEBSTART X stage X09**. Written 5 September 2026.

Three questions: is there one type system or two, what are the 91 selectors
that style nothing a visitor sees, and does the documented system match the
shipped one.

---

## 1. One type system, not two

`/styleguide` demos a `.t-*` type scale — `.t-display-xl`, `.t-h1 … .t-h4`,
`.t-body`, `.t-price` — that **no shipped page uses.** The obvious worry is a
second, drifting type system.

It is not one. Both the `.t-*` classes and the component headlines read the
same tokens: `.t-h1` sets `font-size: var(--text-h1)`, and so does
`.c-detail__headline`. **There is one source of truth and it is
`02-tokens.css`.**

What the specimen does not show is that **components tune from the scale**
rather than taking it neat:

| | Specimen | What ships |
| --- | ---: | ---: |
| `.t-h1` vs `.c-detail__headline` | 62.4px | **53.9px** — a container query, `max(2.25rem, min(var(--text-h1), 7.9cqw))` |
| `.t-h2` vs `.c-services__headline` | 46.4px | **62.4px** — it takes `--text-h1`, being a major section head |
| `.t-display-xl` vs `.c-hero__headline` | 104px | **76px** |

That is a legitimate architecture — a scale, then contextual adjustment — but
nothing said so, and a reader would reasonably take the specimen for the site.
It is recorded here and in `docs/00`.

Across the homepage, **22 distinct font sizes render on desktop against an
11-step nominal scale.** Most of the difference is that tuning. Three of them
were not.

## 2. The finding: text below the scale, getting smaller as the screen grows

Three components rendered below the system's smallest declared step
(`--text-label`, 13px phone / 12px desktop), on raw `rem` values that appear
nowhere else in the system. All three shared one shape:

| | Phone | 1024px laptop | 1440px |
| --- | ---: | ---: | ---: |
| `.c-orbit__label` — **the service names** | 12px | **10px** | 11px |
| `.c-brand__tagline` — *"Digital Agency"* | 11px | **9px** | 9px |
| `.c-orbit__card-label` | — | **8px** | 8px |

**They get smaller as the screen gets bigger.** The orbit labels use `cqw`
units and the orbit container stops growing before the viewport does; the
tagline had an explicit `@media (min-width: 48em)` shrinking it.

Two of the three are not decoration:

- **`.c-orbit__label` is the four service names** — *Branding & Design,
  Websites, Social Media, Digital Marketing & Ads* — the most important nouns
  on the site, at 10px on a laptop.
- **`.c-brand__tagline`'s own comment** says it is *"the only place on the page
  that names what the business IS, so on the screen where the visitor is most
  likely to arrive it gets a readable size."* The rule directly beneath that
  paragraph then shrank it to 9px on every screen wider than 48em — **the
  stated intent, honoured on the phone and inverted on the desktop.**

### Why this was safe to change rather than a guess

**Arabic already rendered the orbit labels at 12–13px at every width**, with
zero overlaps, zero escapes from the orbit box and zero clipped text. The
layout had been carrying the larger size in half the site's traffic all along.
English now takes `--text-label` like Arabic does.

| | Before | After |
| --- | --- | --- |
| `.c-orbit__label`, English | 10–12px depending on width | **12px at every width** |
| `.c-brand__tagline` | 11px phone, 9px desktop | **11px everywhere** (12px Arabic) |
| `.c-orbit__card-label` | 8px | **10px** |
| Smallest text on the site | **8px** | **10px** |
| Overlaps / escapes / clipping | 0 | **0**, at 390 / 768 / 1024 / 1440 / 1920 in both languages |

The header still fits at every width with the larger tagline — no sideways
scroll, no collision with the brand or the menu trigger, phone CTA clearance
unchanged.

## 3. The guard

`qa.js` §16, two checks, because the floor alone would have missed the shape:

- **Nothing renders below 10px** — `HIGH`.
- **Nothing is more than a pixel smaller on a desktop than on a phone** —
  `MED`. The one-pixel tolerance is deliberate: `--text-label` is 13px on a
  phone and 12px on a desktop by design, and a check that cannot allow that
  would be turned off within a week.

**Three sampling widths — 390, 1024, 1440 — and the comparison uses the
smallest desktop sample.** The orbit label bottomed out at 1024 and recovered
by 1440; a check looking only at the two ends would have missed it, and the
first version of this one did.

Verified by restoring all three original sizes, each edit asserted rather than
assumed: **2 HIGH and 2 MED**, naming each element and both of its sizes.

**Two false alarms this check produced before it was trusted**, both recorded
because they are the failure mode this project keeps meeting:

1. It first keyed elements on their `class` attribute, which put every
   unclassed `<span>` in one bucket — so a CTA label was compared against an
   orbit label and it reported a shrink that did not exist. It now keys on the
   element plus its nearest classed ancestor.
2. Its first negative test printed *"restored"* unconditionally while one of
   the three edits had silently matched nothing. The rerun asserts each edit.

## 4. The 91 selectors, decided

`qa.js` §12 reports 91 selectors that style nothing a visitor can see. E6 took
the unambiguous half — two whole files with zero live rules — and deferred the
rest **to this stage**. The decision:

| | What it is | Decision |
| --- | ---: | --- |
| **`.t-*` type scale** | 18 rules | **Keep.** It is the specimen of the scale the whole site consumes, and it shares the tokens. Now documented as nominal, with components tuning from it |
| **`.l-grid`, `.l-col`, `.l-stack`, `.l-cluster`, `.l-autogrid` + modifiers** | 30 rules | **Keep, and record the fact.** The site's layout runs entirely on `.l-container` and `.l-section`; **the grid layer carries nothing.** That is worth knowing before X06 changes any structure |
| **`.u-*` utilities** | 17 rules | **Keep.** A utility layer is a menu by nature |
| **`.c-btn--ghost`, `.c-btn--icon`, field variants, `.c-counter`, `table`/`th`** | 26 rules | **Keep in the showroom.** Real components with no markup yet |

Nothing is deleted here. The reasoning is `docs/74` §5's: the whole set is
~1.2KB gzipped per page, and the cost of splitting coherent files by current
usage is paid by every future reader. **What changes is that it is now
decided and written down rather than merely unresolved** — and `qa.js` prints
the number every run, so it cannot drift unnoticed.

## 5. Documentation reconciled

`docs/00-design-system.md` updated where this work made it untrue:

- `--control-height-sm` is **44px**, not 40px (`docs/73`).
- The control scale is **44 / 48 / 56**, and every button renders on it in both
  languages.
- `card.css` and `disclosure.css` load from `showroom.css`, not `main.css`.
- The `.t-*` scale is nominal; components tune from it.
- Type has a floor of 10px, enforced.

## 6. X09, and what it does not close

X09 asked for a refined, coherent, documented system. What it now has: one
token source, one control scale honoured in both languages, a type floor with
a guard, and a written decision on every unused selector.

**What X09 cannot do from here** is the part that needs the reference material:
whether the *scale itself* — the steps, the ratio, the display sizes — is the
right one for this market is an X02/X03 question, and `docs/70` showed the
numbers already sit inside the band Linear, Stripe and Vercel occupy. The
system is coherent; whether it is *distinctive* is B1's to inform.
