# Stage 02 — Hero

The homepage's opening statement and its digital-ecosystem panel. Built from
Stage 00 tokens; the header from Stage 01 is untouched.

| File | Role |
| --- | --- |
| `src/styles/components/hero.css` | Hero layout, ecosystem panel, scroll cue |
| `index.html` | Hero markup and the five abstract fragment illustrations |
| `src/scripts/disclosure.js` | Vertical tablist + opt-in hover activation |
| `src/scripts/motion.js` | Entrance reveals, scroll-cue dismissal |

---

## 1. Content

Every string comes from the brief. Nothing is invented, and there are **no
statistics, client marks, awards, testimonials or claimed results** anywhere in
the section.

| Slot | Content |
| --- | --- |
| Eyebrow | Creative Digital Partner |
| H1 | Your Brand. / Your Digital Presence. / **One Partner.** |
| Lead | We build brands, websites, online stores and digital experiences — then connect them with content, social media and performance marketing to help your business grow. |
| Panel caption | All your digital needs. From one place. |
| Primary CTA | Start Your Project → `#contact` |
| Secondary CTA | Explore Our Services → `#services` |
| Services | Branding & Design · Websites · E-Commerce · Social Media · Digital Marketing & Ads |

The core proposition ("All your digital needs. From one place.") sits on the
ecosystem panel rather than in the H1, so it introduces the visual system
instead of competing with the headline.

`One Partner.` is the only accented phrase — the differentiator, not the whole
headline.

---

## 2. The ecosystem panel

The brief's `BRAND → WEBSITE → CONTENT → SOCIAL → ADS → GROWTH` idea, built as
a system rather than drawn as a flowchart:

- A **stage** showing an abstract fragment for the selected service.
- A **spine** of the five services, joined by one continuous connector line
  that runs from neutral at the top to accent at the bottom, ending in a
  **Growth** marker — the outcome the five add up to, not a sixth service.
- Fragments are pure inline SVG: a swatch grid and letterform (branding),
  browser chrome and wireframe blocks (websites), product tiles and a cart
  row (e-commerce), a post card with engagement bars (social), and a bar
  series with a rising trend line (marketing). **All abstract** — no numbers,
  no labels, no imitation of any real product's interface.

### Interaction

The spine is a **vertical WAI-ARIA tablist**, reusing the tabs component from
Stage 00 rather than inventing a bespoke widget. Selecting a service swaps only
the illustration. Service names are always visible, so the interaction enriches
the story and is never required to read it (§11).

Two extensions were made to the shared component:

- `aria-orientation="vertical"` switches arrow keys to Up/Down (horizontal
  tablists keep Left/Right, still swapped under RTL).
- `data-tabs-hover` opts a tablist into hover activation, gated to
  `(hover: hover) and (pointer: fine)`. Focus is never moved, so a mouse
  passing over the list cannot steal it from a keyboard user.

No auto-cycling: Stage 00 forbids constant movement, and a hero that animates
on a timer is exactly that.

---

## 3. Composition

Three deliberate compositions, not one that scales:

| Breakpoint | Page | Ecosystem panel |
| --- | --- | --- |
| Mobile <768px | Single column: eyebrow → headline → lead → CTAs → visual → (cue hidden) | Stage over spine, 16:10 |
| Tablet 768–1023px | Single column | **Two columns** — stage beside spine, so it stays wide and short instead of a tall block competing with the headline |
| Desktop 1024px+ | **7 / 5 asymmetric** — text left, panel right | Stage over spine, height driven by viewport |

DOM order is text-then-visual, which gives the required mobile order for free
and still places the panel right on desktop.

---

## 4. Height

Desktop `min-block-size: min(90svh, 1000px)` — `svh`, so mobile browser chrome
cannot push the CTAs out of the first screen. Never a forced `100vh`.

The panel is what decides whether the hero fits one screen, so on desktop the
stage height follows the viewport (`clamp(180px, 24svh, 280px)`) rather than
its own aspect ratio. A short laptop window gets a shorter stage instead of a
hero that runs past the fold.

Measured:

| Viewport | Hero | Below fold |
| --- | --- | --- |
| 1024×768 | 101vh | nothing |
| 1280×800 | 92vh | nothing |
| 1366×768 | 95vh | nothing |
| 1440×900 | 90vh | nothing |
| 1920×1080 | 90vh | nothing |

1024×768 is the one outlier at 101vh, and the overflow is bottom padding — all
content is inside the first screen. §15's actual requirement (header, headline,
lead, both CTAs and the visual in the first viewport) holds everywhere.

---

## 5. Headline sizing

Poppins is wide: "Your Digital Presence." measures **10.6em**. At the token
maximum that is 808px in a 682px column — it overflowed and was silently
clipped by the page's `overflow-x: clip`.

The headline is therefore sized against **its own column**, not the viewport:

```css
font-size: max(3.5rem, min(var(--text-hero), 9.2cqw));
```

with `container-type: inline-size` on the text column. It fits at any width, in
any language, and `text-wrap: wrap` remains as a final safety net. Verified at
ten viewports × two directions: the widest rendered line never exceeds its
column.

Resulting sizes: 40px mobile, 59–62px tablet, 56–64px desktop — inside the
ranges the brief asks for.

---

## 6. Motion

Load sequence (§10) uses the Stage 00 reveal system, no new machinery:
eyebrow → headline → lead → CTAs stagger at 80ms via `[data-reveal-group]`;
the panel follows at `--reveal-delay: 300ms`; its spine nodes then settle at
70ms intervals.

The scroll cue's travelling accent is **the only looping animation in the
system**. It is justified: the element exists solely to signal that more
content follows, it is small, and it removes itself the moment the user acts
on it. Under `prefers-reduced-motion` it becomes a static accent line.

Everything else is entrance-only or interaction-driven.

---

## 7. Scroll cue and the transition to Services

The cue is a **link to `#services`**, so it is a real affordance rather than
decoration. It is wrapped in `.l-container`, which aligns it to the same edge
as the headline instead of the raw viewport.

It appears only at `(min-width: 64em) and (min-height: 50em)` — on a short
window the composition needs the room more than the page needs a hint that it
scrolls. It fades out via an IntersectionObserver sentinel (no scroll listener)
and drops to `tabindex="-1"` when hidden, so keyboard users are never sent to
an invisible link.

There is no rule between the hero and Services; the cue's line carries the eye
across the boundary (§26).

---

## 8. RTL — interim state

The composition mirrors correctly: text column right, panel left, CTAs and
arrows flipped, spine and connector mirrored.

Hero **copy is not yet translated** — only header chrome and navigation labels
are. Left alone, English sentences inside an RTL page render their trailing
full stop at the *start* of the line (".Your Brand"), because a full stop is a
direction-neutral character that adopts the paragraph direction.

Untranslated blocks are therefore marked `data-i18n-pending`, which typesets
them as LTR islands — correct for what they currently are. **Remove the
attribute from an element the moment its Arabic copy lands.**

---

## 9. Verified

Headless Chromium, LTR and RTL:

- No horizontal overflow at 320/360/375/414/768/900/1023/1024/1280/1440/1920px.
- Headline never exceeds its column at ten viewports × two directions.
- All five fragments stay inside the stage at five breakpoints.
- Single `h1`, in the hero, heading order unbroken; every decorative SVG
  `aria-hidden`; tablist labelled; each fragment carries a visually-hidden
  description.
- Stage height identical across all five services — switching never shifts the
  layout.
- Scroll cue dismisses on scroll, restores at top, leaves the tab order when
  hidden.
- Reduced motion: all content at full opacity, no transforms, cue loop off.
- JavaScript disabled: headline, lead, both CTAs and all five service names
  render.
- No console errors, no failed requests.

---

## Open items

- **Arabic hero copy.** Once supplied, drop `data-i18n-pending` from those
  elements and add the strings to the navigation map's translation table.
- **Confirm the service list against the Services & Pricing document.** The
  five names here come from the brief itself; the source document is still
  outstanding and is the authority.
- Stage 03 replaces the `#services` placeholder. The hero needs no change.
