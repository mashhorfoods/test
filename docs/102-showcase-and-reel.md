# Two slideshows and a showreel — and a full test around them

**6 September 2026.** Owner request: run a full test on functions, responsive,
padding and user experience; add two slideshows with world-class motion in the
places that serve marketing and What We Do; and add a video placeholder with a
player.

---

## 1. The full test

### Functions

| | |
| --- | --- |
| Services accordion | opens, closes, single-open honoured |
| The Brand Challenge | 4 options, grades, exactly one pane visible at a time |
| Mystery Reward | reveals and issues a code |
| Language toggle | switches to `lang="ar" dir="rtl"`, copy follows |
| JavaScript errors | **0** |

### Responsive — 360, 390, 430, 768, 1024, 1440

No horizontal overflow at any width. No control under 44px.

### Padding

Fourteen sections, four distinct vertical values: **49.29, 64, 65.91, 120**.
The two odd-looking numbers are not drift — `--section-space` is
`clamp(4rem, 2.4rem + 7vw, 8.5rem)`, which is 65.91px at 393px, and
`--section-space-tight` is 49.29px at the same width. Both asymmetric sections
are deliberate: the hero opens at 120 and closes at 64, and one band closes a
run with no top padding.

### User experience

| | |
| --- | --- |
| Page length | 24 screenfuls on a phone (26.1 with the new sections) |
| Longest run with no call to action in view | **0px** |
| Headings | 41, exactly one `h1`, no skipped levels |

### One finding worth a decision

**On a phone, the language switch is below the fold of the open menu.** It
lives in the drawer's foot at y≈1096 in an 852px viewport, so an Arabic-first
visitor landing on the English page must open the menu *and scroll it* to find
EN/AR. It works — a direct click flips the page to `dir="rtl"` correctly — but
on a bilingual site whose market reads Arabic first, the language control being
two interactions and a scroll deep is worth questioning. Not changed here:
where it belongs is a navigation decision, not a bug fix.

### Two failures that were mine, not the site's

The first run reported the language toggle broken. It is not: there are **two**
toggles — a desktop one hidden at phone width and a drawer one — and
`querySelector` returns the first. The second run reported nothing wrong.

The same shape as the reference-probe bug fixed earlier today: *the first match
is not the visible one.*

---

## 2. Where the slideshows went, and why

| | | |
| --- | --- | --- |
| **Selected Work** — ~~10~~ **7 pieces** *(`docs/114`, 7 Sep)* | after the five service detail sections, before Add-ons | The visitor has just read what we do; this is the evidence for it. The search-sourced pattern for agency sites in 2026 puts the work *before* the list; section order is R4's and waits on B5, so the work goes as close to the list as the ordering allows without moving anything |
| **Campaigns, as they ran** — 8 pieces | after Process, before the final call to action | Serves marketing: the last thing before "let's build yours" is proof that campaigns ran |

Both reuse `.c-gallery` (`docs/86`) unchanged: **no script required, no
auto-advance, no dot navigation**, and RTL for free because it scrolls on the
inline axis. Neither is ever the hero — `docs/83` measured 132 blocks stranded
when script-hidden content loses its script, and a carousel is that pattern by
design.

### The motion, and the eight failures it caused

Each slide's image settles as it enters, on a scroll-driven `view(inline)`
timeline, so it runs on the compositor with no script at all — and the
reduced-motion preference is honoured explicitly, because scroll-driven
animations are a separate axis from transitions and `qa.js` §25 exists
precisely because that was missed once.

The first version animated **the whole slide** from `opacity: 0.35`. axe found
**eight contrast violations** immediately: every caption and count outside the
animation's entry range was rendering at 35% opacity, and text at 35% meets no
contrast threshold against anything.

Motion may make a picture arrive. It may not make words unreadable while it
does. The image carries the movement now; the caption stays at full opacity.

---

## 3. The showreel

A real `<video>`, with the browser's own controls — no custom control surface,
because a hand-rolled one is a keyboard trap and a screen-reader problem
waiting to be written, and the native one is neither.

| | |
| --- | --- |
| `preload="none"` | nothing downloads until the visitor presses play — measured: the phone's first screen does not fetch it |
| `playsinline` | iOS does not seize the screen |
| no `autoplay` | nothing plays into a room |
| poster | painted before anything decodes, so the block is never a black rectangle |

Placed at the head of Selected Work: the reel introduces the work, the gallery
shows the pieces.

**Budget.** ~~`docs/53` allows 2MB of video across the site and `qa.js` §7
enforces it. The hero pair is 1.6MB; the placeholder reel is 10KB, leaving
roughly **400KB for the real one** before the check fails.~~

**That paragraph was wrong, and `docs/114` §4 explains why.** It was not a
budget, it was a category error: one number holding two different kinds of
cost. The hero loop is given to every desktop visitor unasked; the reel is
behind `preload="none"` and a control, and fetches nothing until somebody
presses play. Sixty seconds in 400KB is 47kbps — not a reel, a warning.

`qa.js` §7 now weighs them separately: **2MB automatic, 6MB click-to-play**,
with the pool read from the markup rather than the filename (`docs/53` §9).
The number to hand whoever cuts it is **6MB for the pair** — and they do not
need to work it out, because `npm run reel -- <master>` encodes to it and
refuses to write if it cannot fit.

---

## 4. Every image here is a placeholder — *half of this is now false*

**Superseded in part on 7 September by `docs/114`.** Selected Work carries
real photographs of real branding work now. The rest still stands.

The egress proxy blocks this container from downloading stock photography, so
what remains placeholder is **generated locally** at the right dimensions and
says so on its face.

| | | State |
| --- | --- | --- |
| ~~`src/assets/placeholders/work-01..10.svg`~~ | 1200×800 | 🟢 **Replaced and deleted.** Seven owner photographs, `src/assets/images/work-1..7.webp` |
| `src/assets/placeholders/campaign-01..08.svg` | 1080×1350 | ⚪ still placeholder |
| ~~`src/assets/showpiece/reel-placeholder.webm`~~ | 10KB, 6s | 🟡 renamed `reel.webm`; still placeholder footage |
| ~~`src/assets/showpiece/reel-still.svg`~~ | the poster | 🟡 now `reel-still.webp`; the `.svg` remains as its editable source |
| `src/assets/showpiece/reel.mp4` | 10KB | 🟡 added, so the `<source>` pair is real from the start |

**To replace the campaign slides:** overwrite the files, keep the names,
update the `alt` text in both languages.

**To replace the reel: do not overwrite anything by hand.** Run
`npm run reel -- /path/to/the-master.mov`. It writes all three reel names
inside the budget and refuses to write at all if it cannot fit. The master
stays off the repository — see `docs/53` §9.

---

## 5. A build rule that came out of it

The build inlines images under 12KB as base64 and copies larger ones. Eighteen
placeholder SVGs at ~4KB each were therefore inlined — **+34KB on the
homepage**, for pictures nobody had scrolled to.

The limit asks *"is this small?"*. The question that matters as much is *"does
the visitor need it to see the first screen?"* — and the markup already answers
that, on every image, with `loading="lazy"`. Inlining a lazy image is
self-defeating: `lazy` means do not fetch this until it is near the viewport,
and base64 in the HTML means every visitor downloads it before the page renders.

**A lazy image is now always copied, whatever its size.** No existing image
changed behaviour — all 24 were already above the limit — so the rule cost
nothing and closed the hole.

---

## 6. Where the numbers landed

| | before | after |
| --- | ---: | ---: |
| Homepage first screen, phone | 389KB | **414KB** |
| Budget | 480KB | 480KB — **66KB of headroom** |
| Video total | 1.60MB | 1.61MB of 2MB *(the pools were split 7 Sep — the hero pair is 1.61MB of 2MB automatic, the reel 20KB of 6MB click-to-play)* |
| Homepage length | 23.9 screenfuls | **26.1** |

`validate` 0 findings · `qa` 0 high, 0 medium, 1 expected LOW · `a11y` 0
violations.
