# Stage 22 — Mobile-first

Two requests, done together: remove the Cairo Latin face, and make the phone
experience the one the page is designed around rather than the one it degrades
into.

Everything below was measured on the page before it was changed. Where a
number is quoted, it was read off a real render at that viewport, not
estimated.

---

## 1. The Cairo Latin faces are gone

Cairo shipped three subsets — `arabic`, `latin`, `latin-ext`. The build's
coverage check could not drop the Latin ones, and that was the finding, not a
bug: Arabic copy on this site carries English terms **by design** — `Landing
Page`, `Content Calendar`, `Reels`, `Google Ads` — so Cairo really was drawing
those runs. A second Latin face, setting Latin text, on a page that already
has one.

Removed. `--font-arabic` is `"Cairo", "Poppins", …`, so every Latin run inside
Arabic now falls through to Poppins. One Latin voice in either language.

| | before | after |
|---|---|---|
| `dist/index.html` raw | 452.8 KB | 407.4 KB |
| gzipped | 150.2 KB | 115.9 KB |
| font files shipped | 11 declared / 5 embedded | 9 declared / 5 embedded |

Verified in the browser rather than assumed:

- no `cairo-latin*.woff2` is requested in either language;
- the Arabic page still fetches `cairo-arabic-var.woff2` and still sets Arabic
  in Cairo (173px vs 212px against a system fallback for the same string);
- the **47** Latin runs found inside Arabic copy measure **to the pixel**
  against the same strings rendered in Poppins alone — so nothing quietly fell
  through to a system face.

`src/assets/fonts/README.md` now says not to re-add them, and why.

---

## 2. What the phone actually looked like

Measured at 390×844 and 360×844, English and Arabic, before any change:

```
25,194px = 29.9 screens          zero horizontal overflow
                                 zero touch targets under 44px
.c-tiers          5,833px  23.6%   12 package cards
.c-detail__head   2,204px   8.9%   8 section intros
.c-addons         1,862px   7.5%
.c-pipeline       1,503px   6.1%
.c-track          1,230px   5.0%
```

Two things worth saying plainly.

**The mechanical accessibility was already sound.** No overflow at any width,
no small targets, and the CSS is already authored mobile-first — 65
`min-width` queries against 8 `max-width`. There was no rewrite to do.

**Length is not the defect.** 29 screens carries five services, twelve
packages and eleven add-ons. `.c-tiers` is a quarter of the page and every one
of those cards is a different package. Cutting height for its own sake would
have deleted content the visitor came for. The defects were elsewhere.

---

## 3. What changed

### 3.1 Sixteen identical buttons became four

Measured on a 390px viewport: **16** buttons reading "Start Your Project", all
pointing at `#contact`.

Three buttons under three side-by-side cards are **parallel** — they present a
choice, and the choice is the point of a package grid. Stacked into one column
they stop being parallel and become **consecutive**: the same label, to the
same anchor, three times per service, four services down the page.

So below 48em the card action gives way to one action per service block,
directly under the summary line. Above 48em nothing changed.

| | mobile | desktop |
|---|---|---|
| before | 18 actions to `#contact` | 19 |
| after | **10** | 19 |

Nothing was lost, because every one of those buttons was the same button. The
new action is in the markup — it works with scripting off — and the suite
asserts the two arrangements never coexist and never both vanish, checked at
767px and 768px from either side.

### 3.2 A type floor for a screen held in a hand

95 elements rendered below 13px on a phone. Two were below legibility:

- `.c-brand__tagline` at **9px** — the only place on the page that names what
  the business *is*, sitting next to the wordmark in the header;
- `.c-orbit__label` at **11px** and `.c-orbit__core-label` at **10px** — the
  five service names in the hero diagram, the first thing the page says it
  does.

All three are now larger *on the phone than on the desktop*, which is the
right way round and worth stating because it looks backwards. A 12px eyebrow
is comfortable on a desk display at a fixed distance in controlled light. The
same eyebrow on a phone is read one-handed, often moving, often in daylight.
The larger value goes where reading is harder, and 48em hands it back.

| | phone | ≥48em |
|---|---|---|
| `--text-label` | 13px | 12px |
| `.c-brand__tagline` | 11px (AR 12px) | 9px (AR 10px) |
| `.c-orbit__label` | 12px | 11px / fluid |
| `.c-orbit__core-label` | 12px | 10px |

Elements below 13px: **95 → 8**. Below 11px: **none**. The change costs no
layout — these are short strings already on their own lines — and introduced
no overflow at 360px or 390px in either language.

### 3.3 The menu became a map

This was the real finding. On a phone the header nav collapses into the
drawer, so the drawer is the **only** navigation the page has — and it offered
three destinations for an eleven-section, 29-screen page. A visitor who wanted
Social Media Management had to open Services, find it in the accordion, and
tap through.

The five services now hang off the Services entry, through the `children`
extension point `navigation-map.js` has documented since Stage 01. They come
from `SERVICE_LINKS` — the same array the footer renders — so the menu cannot
drift from the Services section.

- drawer destinations: **3 → 8** (9 links including the contact CTA)
- header on desktop: **unchanged**, still three flat links, no dropdown

That asymmetry is deliberate and now says so in the typedef: a drawer is a
phone's whole map of the page; a desktop header is not, and a dropdown there
would be chrome for its own sake.

**A second defect fell out of the first.** The scroll spy observed only the
top-level `SECTIONS` ids. Standing in Social Media, it marked **Services** as
current — so the new rows would have been links that could never say "you are
here", while their parent actively reported the wrong place. `initScrollSpy`
now flattens children into its target list. Anything reachable from the map is
observed.

---

## 4. Where it landed

| 390px, English | before | after |
|---|---|---|
| page height | 25,194px / 29.9 screens | 24,701px / 29.3 screens |
| actions to `#contact` | 18 | 10 |
| elements under 13px | 95 | 8 |
| elements under 11px | 6 | 0 |
| menu destinations | 3 | 8 |
| horizontal overflow | 0 | 0 |
| targets under 44px | 0 | 0 |

The height drop is a side effect, not the goal — eight card buttons left and
four block buttons arrived.

---

## 5. What is still open

**The twelve images have no reserved space.** Every one is `loading="lazy"`,
hotlinked from `i.ibb.co`, and carries no `width`/`height` attribute, so the
browser cannot reserve a box before the bytes arrive. On a phone — the
connection profile where this hurts most — that is twelve layout shifts.

The collapse floors added earlier (`8rem` on brand panels, `7rem` on device
and module cards) mean nothing *breaks*: a failed image leaves a sane box
rather than a hairline, and the suite asserts it at four viewport/language
combinations. But a floor is not reservation. The fix is `width` and `height`
attributes carrying each image's intrinsic size — with `block-size: auto` the
browser derives the ratio from them, reserves exactly the right box, and still
fits the container with no letterbox, which is what "let the images fit the
container size" asked for.

**It cannot be done from here.** `i.ibb.co` is refused at CONNECT by this
environment's egress policy, so the files cannot be read and their dimensions
cannot be measured. Guessing would reserve the wrong box. Self-hosting them
under `src/assets/` fixes both this and the build's standing warning that
`dist/index.html` is not self-contained — the build would read the files and
inline them. That needs the source images.

**The device trio was left alone deliberately.** At 390px the tablet and
mobile renders sit at 163px wide, which is small. Stacking them full-width
would make each legible and destroy what they are for: the three frames are a
*comparison*, and a comparison needs its terms side by side. The trade was
judged the right way round, not overlooked.
