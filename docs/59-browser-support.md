# Browser support — the floor, and what happens below it

Written 4 September 2026. This is the last open half of P1-7: the harness has
been committed since Phase 18, but "cross-browser and device matrix" has stayed
outstanding on every status list since.

---

## 1. What this is, and what it is not

**No second engine was run.** This environment has Chromium only, and the
network policy blocks Playwright's browser downloads — `webkit` and `firefox`
were attempted and refused at the proxy. So this document is **a static
analysis of what the built site actually depends on**, plus a short manual pass
for the owner to run on real devices. It is not a test result, and no line
below should be quoted as one.

That is still worth more than the status quo. "Untested in Safari" is a worry.
"Depends on `@layer`, therefore requires Safari 15.4, and here is what a Safari
15.3 user sees" is a decision.

**Method.** Every modern CSS and JavaScript feature in `dist/index.html` — 198KB
of inlined CSS, 42KB of inlined JavaScript — was enumerated by pattern and each
one classified by what happens when it is missing. Two real defects came out of
it, both now fixed (§3, §4).

## 2. The floor

**Chrome/Edge 105 · Safari 16 · Firefox 121.**

Those are the versions at which every feature in use is present. Read the
dates rather than the numbers: Chrome 105 is August 2022, Safari 16 is
September 2022, and Firefox 121 is December 2023 — the newest of the three is
over two and a half years old today.

But a floor is only useful if you know which stone it stands on, because the
three constraints fail completely differently:

| Feature | Needs | If missing |
| --- | --- | --- |
| **`@layer`** | Safari 15.4 · FF 97 · Chrome 99 | **Catastrophic.** Every rule in this project sits inside a layer, so the whole stylesheet is discarded. Unstyled HTML |
| `container-type` / `cqw` | Safari 16 · FF 110 · Chrome 105 | Invisible. One headline size falls back to its non-container value |
| `:has()` | Safari 15.4 · FF 121 · Chrome 105 | Was a real defect — see §4 |
| `text-wrap: pretty` | Safari 17.5 · FF 137 · Chrome 117 | Invisible. Line breaking is slightly worse |
| `dvh` / `svh` | Safari 15.4 · FF 101 · Chrome 108 | Minor. A mobile viewport unit resolves to the older behaviour |
| `inert` (JS) | Safari 15.5 · FF 112 · Chrome 102 | Real: content behind the open drawer stays focusable |
| `backdrop-filter` | see §3 | Was losing the blur on most iPhones — fixed |
| Logical properties, `aspect-ratio`, `:focus-visible`, `clamp()`, `IntersectionObserver`, `CSS.escape`, `?.`, `??` | 2021 or earlier everywhere | Below the floor already |
| `navigator.connection` | Chrome only | Nothing. It is read with `?.` and its absence means the hero film loads, which is the right default |

**`@layer` is the one that matters**, and it had never been written down. It is
not a feature the site uses in one place: `main.css` opens with a layer
statement and every component declares into it, so a browser that does not
understand the at-rule drops the entire cascade. The page is still readable —
semantic HTML, in order, with working links — which is the progressive
enhancement promise holding at its limit. It is not a page anyone should be
sold from.

Safari 15.4 is March 2022, so the exposed cohort is iPhones on iOS 15.3 or
older: devices that stopped taking updates around the iPhone 6s. Small, and not
zero in this market. **The decision is to accept it**, because the alternative
is abandoning the layer architecture that makes the rest of this codebase
predictable — but it is now an accepted risk rather than an unknown one.

## 3. Defect one: the blur was off on most iPhones

`.c-header.is-scrolled` used `backdrop-filter` with an `@supports not`
fallback, which is exactly right — except that **Safari only shipped
`backdrop-filter` unprefixed in version 18.** Every iPhone on Safari 17 or
earlier failed the support test, took the opaque fallback, and lost the effect
entirely.

The site's market is Gulf and Egyptian, which is iPhone-heavy, and Safari 17 is
still a large installed base. So the scrolled header — a detail that was
designed and argued for in `docs/00` §07 — was simply not happening for a large
share of the people it was designed for, and nothing anywhere said so.

Fixed by adding `-webkit-backdrop-filter` alongside, and by testing the
`@supports` against **both** properties: without that, Safari 17 would satisfy
the prefixed rule and then have the opaque fallback painted over it.

## 4. Defect two: a focus ring that only enhanced half of itself

`.c-card` drew its focus ring with `:has()`, and then suppressed the inner
link's own ring so the two would not double up:

```css
.c-card:has(.c-card__link:focus-visible) { box-shadow: var(--focus-ring); }
.c-card__link:focus-visible             { box-shadow: none; }
```

A browser without `:has()` cannot parse the first rule and drops it. It parses
the second perfectly. **The result is a keyboard user with no focus indicator
at all** — WCAG 2.4.7, produced by a progressive enhancement that enhanced one
half of itself and disabled the other.

Firefox shipped `:has()` in 121 (December 2023), so this was real rather than
theoretical, and axe would never have found it: axe runs in Chromium, where the
rule works.

Fixed by moving **both** rules inside `@supports selector(:has(*))`. The
services list already did this correctly, which is what made the pattern
recognisable.

**The general rule, worth keeping:** when a modern selector adds something, the
thing it replaces must be removed *inside the same `@supports` block*. An
enhancement that turns off the old behaviour outside its own guard is not
progressive.

*Still outstanding, deliberately:* `.c-lang:has(…:focus-visible)` sets
`overflow: visible` so the group does not clip the focus ring. Without `:has()`
the ring is clipped rather than absent — degraded, still visible, not worth a
structural change.

## 5. What a person still has to do

Fifteen minutes, on real devices, once. Everything below is something static
analysis cannot answer.

| Where | Look at | Why this specifically |
| --- | --- | --- |
| **iPhone, Safari** | Scroll down — does the header blur? | §3's fix, on the device it was for |
| **iPhone, Safari** | Open the menu, then try to scroll the page behind it | `inert` and scroll locking are the two things most likely to differ |
| **iPhone, Safari** | The hero: a still image, and **no video download** | The film is desktop-only by design |
| **Firefox, desktop** | Tab through the pricing cards | §4's fix. Every card must show a ring |
| **Any, Arabic** | Switch to AR and scroll the whole homepage | Mirroring is the single most engine-sensitive thing here |
| **Any** | Print `/pricing`, backgrounds off | `docs/43` §8 |
| **An older Android** | Does anything render unstyled? | The `@layer` floor, from the other side |

If a page ever renders as unstyled HTML, do not debug the component. Check the
browser version against §2 first — that is the one failure with a single cause.

## 6. When to re-read this

When a CSS feature newer than the floor is added, and at that moment rather
than later: the cost of a new dependency is not the feature, it is the cohort
it excludes, and that number is knowable in advance and unknowable afterwards.

Otherwise, twelve months.
