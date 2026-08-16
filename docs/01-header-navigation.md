# Stage 01 — Header & Navigation

The global header and the navigation system every page shares. Built entirely
from Stage 00 tokens and components; no new colour, size, radius or timing was
introduced.

| File | Role |
| --- | --- |
| `src/scripts/navigation-map.js` | Section order, labels, CTA, social links — the source all surfaces render from |
| `src/scripts/navigation.js` | Sticky/compact header, mobile menu, scroll spy, language control |
| `src/styles/components/header.css` | Header shell, brand lockup, language control |
| `src/styles/components/navigation.css` | Desktop nav, menu trigger, mobile menu |
| `index.html` | Homepage shell — header markup plus placeholder sections |
| `scaffold.css` | Temporary styling for the placeholder sections; deleted as stages land |

---

## 1. One source of order

§25 requires the header nav, mobile menu, homepage section order and footer
quick links to stay synchronised. They cannot drift, because all three
navigation surfaces are rendered from `SECTIONS` in `navigation-map.js`:

```
Home → Services → Pricing → Why Us → Process → Contact
```

Reorder that array and every surface follows. Adding a section is one entry.

`Contact` carries `inNav: false`: it is reached through the primary CTA rather
than a sixth nav link, so the header keeps one unambiguous conversion action
(§11, §19). It still appears in the footer quick links.

Verified in-browser: header order === menu order, footer order === homepage
section order, and no navigation link points at a section that does not exist.

---

## 2. Zones and layout

| Zone | Contents |
| --- | --- |
| Left | Logo lockup, links to `#home` |
| Centre | Primary nav (desktop only) |
| Right | Language control, primary CTA, menu trigger |

Below 1024px the header is a two-end flex row, so the trigger reaches the edge.
From 1024px up it becomes `1fr auto 1fr`, which centres the nav against the
**viewport** rather than against whatever space the outer zones leave over.

**Heights** (§06): 72px mobile → 80px tablet → 88px desktop, compacting to
60px. Measured in-browser at 375/768/1024/1440/1920px.

---

## 3. Scroll behaviour

One passive, rAF-throttled scroll listener drives both states (§23) — no layout
work happens inside the listener.

| Position | State |
| --- | --- |
| Top | Transparent, no border — the header reads as the first layer of the hero (§20) |
| Past 24px | `is-scrolled`: 82% charcoal, `backdrop-filter: blur(14px)`, hairline border |
| Scrolling down past 200px | `is-compact`: 88px → 60px, mark 32px → 26px |
| Any upward scroll | Compact clears immediately |

The header never hides — only its height changes — so navigation is never
hunted for (§08). Opening the menu resets the compact state, because the
trigger doubles as the close control and needs the full-height header.

Where `backdrop-filter` is unsupported, an `@supports` fallback paints solid
charcoal at identical contrast.

---

## 4. Navigation states (§09)

The active item is carried by **three** signals, never colour alone:

| State | Treatment |
| --- | --- |
| Default | `--color-text-secondary` |
| Hover | Accent colour + indicator grows to 45% |
| Active | Accent colour + semibold + full-width accent indicator + `aria-current="true"` |
| Focus | The Stage 00 `--focus-ring` |

In the mobile menu the active row also shifts inward — position as a fourth,
non-colour signal.

**Layout stability.** Switching the active item to semibold would normally
re-flow the whole nav row. Each link stacks an invisible semibold copy of its
label (`::before { content: attr(data-label) }`) in the same grid cell as the
visible label, so the link is always as wide as its bold form. Verified: link
widths and positions are byte-identical across every active section.

---

## 5. Mobile menu (§13, §14)

Full-screen surface at `--color-bg`, display-scale rows, numbered `01`–`05`,
CTA held at the foot within thumb reach, then the language control.

Behaviour, all verified in-browser:

- **Scroll lock** — `overflow: hidden` on `<html>`; real wheel and touch input
  are both blocked and scroll position is preserved on close.
  (Note: `window.scrollBy` still works under `overflow: hidden` by spec, so
  scroll-lock must be tested with real input events, not programmatic scrolls.)
- **Focus trap** — the cycle explicitly includes the trigger, which sits
  outside the menu; otherwise the close control would be untabbable. Tab cycles
  `01 Home → … → CTA → EN → AR → trigger → 01 Home`.
- **Escape** closes and returns focus to the trigger.
- **Closed state** is `inert`, so no link becomes an invisible tab stop.
- **Link click** closes without stealing focus back, letting the anchor land.
- **Crossing to desktop** while open closes cleanly, releasing lock and trap.

`--z-header` (400) is deliberately above `--z-drawer` (300) so the trigger stays
visible and clickable as the ✕ close control.

Entrance sequence (§16): container fades, rows stagger at 50ms intervals, CTA
block last. Under `prefers-reduced-motion` everything appears at once, fully
visible.

---

## 6. Logo (§03)

The logo is **single-sourced**: `src/assets/brand/logo.svg` is referenced by
the header and by the favicon on both pages. It is referenced, never inlined —
an inlined SVG becomes a copy per page that has to be kept in sync by hand,
while a referenced file cannot drift. Swapping that one file updates every
surface at once.

In the header it is an `<img>` with `alt=""`, because the wrapping link already
carries the accessible name; giving the image its own alt would announce the
brand twice.

**Sizing.** Height drives and width follows the artwork's ratio
(`block-size: 32px; inline-size: auto; aspect-ratio: var(--logo-aspect)`), so
the logo can never be stretched whatever shape it is. `--logo-aspect` reserves
the correct width *before* the file loads, which is what keeps the header from
shifting as it arrives — an SVG with no intrinsic dimensions reports
`naturalWidth: 0`, so without it the browser has nothing to reserve.

Verified: the lockup holds a 1.000 ratio across both the full and compact
header, and a simulated 3.2 wide lockup still clears the nav by 156px.

Clear space is enforced by `--logo-clear-space` padding. The wordmark hides
below 360px; the mark alone still identifies the brand.

Swap procedure and file requirements: `src/assets/brand/README.md`. Note that
the mark/wordmark order mirrors under RTL, which is correct for a two-part
lockup but **wrong for a single fixed brand image** — if the real logo contains
its own wordmark, drop the `.c-header__wordmark` span so there is nothing to
mirror.

**Current state: still a placeholder.** See the open items below.

---

## 7. Language control

Two explicit options (`EN` / `AR`) rather than a toggle, so the active and the
available language are both visible. Switching sets `lang` and `dir` on
`<html>`, re-renders navigation labels and header chrome, and persists the
choice to `localStorage`.

The selected option is **not** accent-filled: the CTA sits directly beside it,
and two yellow blocks in one zone would compete (Stage 00 §17). Selection is
carried by brightness, weight, surface and `aria-pressed`.

**Scope:** header chrome and navigation labels are translated. Page copy is
translated when content is finalised — the mechanism is in place and the RTL
layout is fully exercised.

---

## 8. Extending the Services item (§17)

No mega-menu is built, and none is stubbed — dead UI is worse than none. What
exists is the architecture it needs:

- `NavSection.children` is defined in the map's type and is currently unset on
  every entry, so each renders as a plain anchor.
- `.c-header` sets `overflow: visible`, so a panel can escape the header box.
- The renderer is a single function; branching on `children` to emit a
  disclosure button plus a panel changes no other part of the header.

Anchor navigation, a dropdown or a full mega-menu can therefore be added
without touching the shell, its spacing or its scroll behaviour.

---

## 9. Verified

Headless Chromium, LTR and RTL:

- **No horizontal overflow** at 320/360/375/414/768/1023/1024/1280/1440/1920px
  in both directions.
- **All header and menu targets ≥ 44×44px** on a coarse pointer.
- **Focus ring on every interactive element**; desktop tab order is
  skip-link → brand → 5 nav links → EN → AR → CTA.
- **No JavaScript errors.**
- **Reduced motion**: menu opens fully visible, no transforms, durations at 1ms.

---

## Open items

- **Real logo asset.** Still a placeholder. The file supplied via the ibb.co
  link could not be retrieved — this environment's network policy blocks that
  host (the gateway returns 403 for `i.ibb.co`; only GitHub domains are
  reachable). Commit the file to the repository, or paste it somewhere on
  github.com, and the swap is a one-file drop per
  `src/assets/brand/README.md`.
- Final Arabic labels reviewed by a native speaker — the current set is a
  standard IA translation, not reviewed copy.
- Social profiles: `SOCIAL_LINKS` is empty and the menu block stays hidden
  until real accounts are added. None are invented.
- The `#home … #contact` placeholder sections and `scaffold.css` are replaced
  stage by stage; the header needs no change when they are.
