# Digital Agency Website — Stage 00

The master global design system. Every later stage builds on this and does not
work around it.

## What is here

```
docs/00-design-system.md    The system, documented — read this first
docs/01-header-navigation.md  Header & navigation, documented
docs/02-hero.md             Hero section, documented
index.html                  Homepage shell — header + placeholder sections
scaffold.css                Temporary placeholder-section styles (not shipped)
styleguide.html             Living specimen sheet for every token and component
styleguide.css              Chrome for the specimen page (documentation only)
src/styles/                 The product stylesheet
  main.css                  Entry point; fixes the @layer cascade order
  00-fonts.css              Self-hosted Poppins + Cairo @font-face rules
  01-reset.css              Minimal, accessibility-preserving reset
  02-tokens.css             All design tokens — the single source of truth
  03-base.css               Document defaults, type roles, focus, RTL
  04-layout.css             Container, 12-column grid, section rhythm
  05-motion.css             Scroll reveal and counter styles
  06-utilities.css          A deliberately small utility set
  components/               button · card · header · navigation · hero ·
                            orbit · disclosure · field
src/scripts/                Vanilla ES modules, no dependencies
  main.js                   Entry point
  navigation-map.js         Single source of section order and labels
  navigation.js             Sticky header, mobile menu, scroll spy, language
  disclosure.js             Accordion, tabs, tooltip
  motion.js                 Scroll reveal, animated counters
src/assets/brand/           Favicon mark + brand documentation
src/assets/fonts/           Self-hosted woff2 subsets (156KB total)
```

## Stages

| Stage | Scope | State |
| --- | --- | --- |
| 00 | Master global design system | Done |
| 01 | Header & navigation | Done |
| 02 | Hero | Done |
| 03+ | Services, Pricing, Why Us, Process, Contact, Footer | Placeholders |

## Single-file build

`dist/index.html` is the whole site in **one self-contained file** — no CSS,
JavaScript, font or icon requests. Open it directly from disk, e-mail it, or
drop it on any host.

```bash
node build.js
```

It resolves the `@import` chain (preserving the `@layer` order), embeds all
eleven woff2 faces and the favicon as `data:` URIs, and flattens the ES module
graph into one inline module. No dependencies, no toolchain.

Verified with every other host blocked: **0 network requests**, no errors, and
identical to the modular source on every measured property — fonts, headline
size, brand, navigation counts, constellation geometry in both directions,
hero height, and the mobile menu.

| | Requests | Size |
| --- | --- | --- |
| Modular source | 26 | — |
| `dist/index.html` | **0** | 337KB (132KB of it fonts) |

**Trade-offs of one file**, worth knowing before choosing it over the modular
source in production:

- CSS, JS and fonts cannot be cached separately across pages — every page
  re-sends everything.
- `unicode-range` can no longer defer a subset: the Arabic faces are in the
  document whether or not the visitor reads Arabic. (Five faces activate
  instead of four.)
- The source under `src/` stays the thing you edit. Re-run `node build.js`
  after any change, or the built file goes stale.

## Working on the source

ES modules need a server; opening `index.html` directly will not work (the
built file has no such restriction).

```bash
python3 -m http.server 8000
# homepage shell:  http://localhost:8000/index.html
# design system:   http://localhost:8000/styleguide.html
```

## Stack

Semantic HTML, token-driven CSS and a small amount of vanilla JavaScript. No
framework and no CSS library — every dependency would have to earn its cost
against the performance rules, and none does at this stage.

Everything is a progressive enhancement over working markup. With JavaScript
disabled the page remains readable, navigable and complete: accordion panels
render open, tab panels render, counters show their final value.

## Content rule

The supplied Services & Pricing document is the source of truth. No service,
package, price, statistic, client, testimonial or achievement is invented
anywhere in this repository. The placeholders in `styleguide.html`
(`Package name`, `0,000`, `Included item`) are structural specimens and are
replaced from that document in Stage 01.

## Scope of this stage

Tokens, primitives, components, motion, accessibility and RTL rules only. The
header, hero, services, pricing and footer are **not** designed here — see the
open items at the end of `docs/00-design-system.md`.
