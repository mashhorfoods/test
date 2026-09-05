# P1-5 · Reach — a call to action on the phone

`docs/69` P1-5, taken first at the owner's direction. Written 5 September 2026.

`docs/71` found that a phone visitor scrolls most of this site with nothing to
press, while a desktop visitor always has a button in the fixed header. This
closes it.

---

## 1. What was wrong, and it was written down as a decision

`header.css` said so plainly:

> *"HEADER CTA — Desktop only. Below 1024px the header is logo + menu trigger
> and the CTA lives at the foot of the menu instead."*

That is a defensible decision about **chrome**. What was never measured is what
it costs in **reach** — and the answer is that on a phone the site's call to
action moved from zero taps to two, on every page, for the entire scroll.

**Measured by actually scrolling**, in half-screen steps, asking at each stop
whether any button is in the viewport. Phone 390×844, English:

| Page | Longest stretch with no CTA | Share of the page | A CTA was in view for |
| --- | ---: | ---: | ---: |
| **/story** | **6,400px** | 95% | **6% of the scroll** |
| /terms | 5,500px | 94% | 7% |
| /accessibility | 4,200px | 91% | 11% |
| /privacy | 3,400px | 89% | 13% |
| /about | 2,700px | 88% | 13% |
| **/ homepage** | **4,700px = 5.5 screens** | 15% | 54% |
| /pricing | 1,700px | 12% | 73% |
| /404 | 300px | 29% | 73% |

**`docs/71` under-reported this**, and the difference is method. That document
computed gaps from static element positions without scrolling, and returned 80%
for `/story`. Scrolling gives 95%, and the sharper number: **a phone visitor
reading his own story had a way to act for 6% of it.**

On the homepage the 5.5 screens fall on *"Everything your business needs.
Connected in one system."* and the add-ons — the two sections written to raise
intent.

## 2. The fix

**The header CTA now appears on a phone once the page's own first call to
action has scrolled out of view.**

Not on scroll — that would double the hero, which already has a button 480px
down. `initReach()` observes the page's own first CTA and sets `is-cta-away` on
the header when it leaves the viewport, so the header stays logo + trigger for
exactly as long as the page is offering something else to press, and takes over
the moment it stops. Pages with no hero CTA at all — `/story`, `/terms` — get
the class immediately and `.is-scrolled` alone gates it.

Two details the measurements forced:

- **The arrow icon is dropped at this width.** The label is what has to
  survive; a filled accent button already reads as an action without it.
- **`line-height: 1`, and on the descendant.** The Arabic face's taller metrics
  inflated the same button to **52px against English's 44px**. Setting it on
  the button alone changed nothing — 52px before, 52px after — because the
  label is a span and the span is what carries `lang="ar"`, so `:lang(ar)`
  gives it body leading regardless. Same trap as the Arabic heading rule in
  `docs/43` §12, recognised this time from the shape of it.

## 3. What it produced

Phone 390×844, measured the same way, both languages:

| Page | Before | After |
| --- | ---: | ---: |
| / homepage | 4,700px | **0px** — a CTA in view for 100% of the scroll |
| /story | 6,400px | **100px** — 99% |
| /terms | 5,500px | **100px** — 98% |
| /accessibility | 4,200px | **100px** — 98% |
| /privacy | 3,400px | **100px** — 97% |
| /about | 2,700px | **100px** — 97% |
| /pricing | 1,700px | **100px** — 99% |
| /404 | 300px | **0px** — 100% |

The residual 100px is one sample step: the handover between the hero's own
button leaving and the header's arriving. Arabic is within a point of English
throughout.

Checked, because a header is the most-seen element on the site:

- **No collision at 320, 344, 360, 390 or 430px, in either direction.** At the
  worst case — 320px Arabic — the CTA spans 78–189 with the trigger at 24–66
  and the brand at 205–296. No page scrolls sideways at any width.
- **The first version of that collision test reported a clash in Arabic on
  every width.** It compared left and right edges assuming the brand sits left
  of the trigger, which is true only in LTR. The layout was right and the test
  was wrong.
- **Desktop is untouched** — same 48px CTA, same document height. The rule sits
  inside `max-width: 63.999em`.
- **Both languages render the button at 44px** at every phone width, on the
  token scale, meeting WCAG 2.5.5 AAA like every other control (`docs/70`).

`validate: 0 · qa: 0 high · a11y: 0`.

## 4. The guard

**This is the second time this project has shipped a conversion path that
worked on desktop and not on the device its market uses.** The first was eight
package buttons at `display: none` below 48em, found 4 September. Neither was
visible to any check here, because in both cases every page was complete,
accessible and correct at every width. What was missing was reach, and **reach
is only observable by scrolling.**

`qa.js` §14 now scrolls every shipped page at 390×844 in both languages and
fails the build if any goes more than two screens with no button in view.
Verified by putting the old behaviour back: **12 HIGH findings across 7 pages,
naming the page, the language, the distance and where it starts.** With the fix
in place, zero.

## 5. What this does not close

- **Whether a buyer feels the difference.** 5.5 screens was a measurement, and
  so is 0px. `docs/68` task 1 is what tells us whether a real person stalls.
- **`.c-final__cta` is still 54px** where the large token is 56, and the
  **desktop Arabic header CTA is 52px against English's 48px** — pre-existing,
  present in the build before this change, and P1-3's to fix.
- **Whether the two high-intent sections should carry their own CTA.**
  `docs/71` recommended it as item 2. The header now covers those screens, so
  it is no longer a gap — it is a question about emphasis, and it belongs with
  the structural work B5 answers.
