# Pixora — Digital Agency Website

Built in stages on a token-driven design system. Every stage builds on the
system rather than working around it.

## What is here

```
docs/00-design-system.md    The system, documented — read this first
docs/01-header-navigation.md  Header & navigation, documented
docs/02-hero.md             Hero section, documented
docs/03-services.md         Services overview, documented
docs/04-branding.md         Branding & Design, documented
docs/05-websites.md         Websites, documented
docs/06-ecommerce.md        E-Commerce, documented
docs/07-social.md           Social Media Management, documented
docs/08-marketing.md        Digital Marketing & Ads, documented
docs/09-integrated.md       Integrated Solutions, documented
docs/10-pricing.md          Pricing architecture, documented
docs/11-add-ons.md          Add-ons & extra services, documented
docs/12-why-us.md           Why us / value proposition, documented
docs/13-process.md          Process / how we work, documented
docs/14-final-cta.md        Final CTA / conversion, documented
docs/15-footer.md           Footer, documented
index.html                  The homepage — eleven sections, header and footer
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
                            orbit · services · service-detail ·
                            campaign · pricing · addons · value ·
                            process · cta · footer · ecosystem ·
                            disclosure · field
src/data/pricing.json       Generated package data (see tools/)
tools/build-pricing.js      Regenerates the pricing section from the
                            service sections — run after any package change
src/scripts/                Vanilla ES modules, no dependencies
  main.js                   Entry point
  navigation-map.js         Single source of section order and labels
  navigation.js             Sticky header, mobile menu, scroll spy, language
  disclosure.js             Accordion, tabs, tooltip, responsive disclosure
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
| 03 | Services overview | Done |
| 04 | Branding & Design | Done |
| 05 | Websites | Done |
| 06 | E-Commerce | Done |
| 07 | Social Media Management | Done |
| 08 | Digital Marketing & Advertising | Done |
| 09 | Integrated Solutions | Done |
| 10 | Pricing architecture | Done — 5 of 6 package categories |
| 11 | Add-ons & extra services | Done |
| 12 | Why us / value proposition | Done |
| 13 | Process / how we work | Done — labels are placeholders, see below |
| 14 | Final CTA / conversion | Done — needs a contact mechanism |
| 15 | Footer | Done |
| — | Contact | Placeholder — awaiting contact details |

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
hero height, the ecosystem wiring, and the mobile menu.

| | Requests | Size |
| --- | --- | --- |
| Modular source | 36 | — |
| `dist/index.html` | **0** | 700KB (132KB of it fonts) |

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
disabled the page remains readable, navigable and complete: the header nav and
both footer link groups are seeded in the markup, accordion panels render open,
tab panels render, and counters show their final value. A test loads the page
with scripting off and asserts the navigation is there.

## Content rule

The supplied Services & Pricing document is the source of truth. No service,
package, price, statistic, client, testimonial or achievement is invented
anywhere in this repository. The placeholders in `styleguide.html`
(`Package name`, `0,000`, `Included item`) are structural specimens and are
replaced from that document in Stage 01.

## Outstanding

Each stage's doc ends with its own open items. Across the project:

- **Arabic copy.** Untranslated blocks carry `data-i18n-pending`, which
  typesets them as LTR islands so their punctuation and numerals render
  correctly. Remove the attribute from an element as its translation lands.
  Where a string ships in both languages, it uses `data-lang-copy` instead and
  needs nothing further.
- **Websites and E-Commerce inclusions are a signed-off split, not source
  data.** The original document gave prices but no per-package inclusions; the
  split was drafted from each service's own approved capabilities and approved
  on review. Every line is approved wording — only the assignment of a line to
  a package came later. `docs/05-websites.md` records the two lines worth
  re-checking.
- **One pricing category is unbuilt for want of data** — Integrated Solutions
  (Business Launch, Digital Growth). It is omitted from the pricing selector
  rather than shown as an empty tab; send the packages and it is one entry plus
  its data. Additional Services arrived in Stage 11 and is now section 08.
- **E-Commerce has no positioning statements**, so those two cards have no
  purpose line.
- **A contact mechanism — the single biggest gap.** No email address, phone
  number, WhatsApp number or form endpoint exists anywhere in the supplied
  data, so `#contact` is still a placeholder and every CTA on the site scrolls
  to it. One approved contact detail turns twenty-plus buttons into a working
  conversion.
- **The real working process.** Stage 13's six stage names (Discover, Plan,
  Create, Build, Launch, Grow) come from the brief, not from the agency — no
  workflow exists in the source. Every description under them is anchored to a
  published capability, and no turnaround time is stated anywhere. Send the
  actual process and the labels swap.
- **Any substantiable proof** — a client count, a completed-project figure, a
  named reference. Why Us argues entirely from the delivery model because no
  such fact exists in the source; real proof would strengthen it considerably.
- `apple-touch-icon.png`, `og-image.png`, and the page's OG/canonical values.
