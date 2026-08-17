# Stage 10 — Pricing Architecture

> **Changed by the clarity pass.** The fourteen packages were published here
> AND in the service sections. They now appear only here, and the direction of
> truth inverted: `src/data/pricing.json` is the source, and
> `tools/build-pricing.js` renders both these cards and a one-line price band
> in each service section from it. See `docs/18-refinement.md` §1.

Fourteen packages from five services, regrouped for comparison. Section 07.

---

## 1. Two categories are missing, on purpose

The brief's §03 lists seven categories. Five are built:

| Category | Packages |
| --- | --- |
| Branding & Design | Starter · Professional · Advanced |
| Websites | Landing Page · Business Website · Professional Website |
| E-Commerce | Starter · Professional |
| Social Media | Social Starter · Social Growth · Social Pro |
| Marketing & Ads | Ads Starter · Ads Growth · Ads Performance |

**Integrated Solutions** (Business Launch, Digital Growth) and **Additional
Services** have never been supplied — no prices, no features, no billing model.
§02 forbids inventing them and §26 says not to estimate. They are therefore
**absent**, not rendered as empty tabs: a tab that opens onto nothing tells the
visitor the agency is disorganised, where no tab tells them nothing at all. The
custom-quote block is the path for anything the five do not cover. A test
asserts neither name appears in the selector and that no panel is empty.

---

## 2. Nothing here was transcribed

Stage 10 shows the same fourteen packages as Stages 04–08. Copying them by hand
would create a second source of truth that drifts the first time a price
changes — which is exactly why §34 asks for structured data.

So the detail sections stay the source. `tools/build-pricing.js` lifts the
packages out of them into `src/data/pricing.json` and renders the pricing
markup from that:

```bash
node tools/build-pricing.js      # after changing any package
```

The output is **static HTML committed to `index.html`**, between
`<!-- PRICING:GENERATED:START/END -->`. Client-side rendering was rejected:
pricing has to be crawlable (§33) and has to work with JavaScript disabled,
and a browser-rendered section is neither.

**The guarantee is a test, not a habit.** The suite reads all fourteen packages
out of the service sections and out of the pricing panels and asserts they are
identical — name, price, billing, recommended flag and every feature line, in
**both languages**. Forgetting to re-run the generator fails the build rather
than shipping two different prices for the same package.

One bug in the tool, worth recording: the first version guarded with
`if (out === html) throw`, meaning a correct **no-op re-run** — the normal case
— threw "markers not found". It now checks for the markers themselves and
reports "already up to date".

---

## 3. The cards are not new

`.c-tier`, unchanged from Branding. A visitor arriving from a service section
meets the same card, so comparing across categories costs no re-learning, and
the section cannot drift into a different visual language (§37). It also means
the three recommended packages — Branding *Professional*, Social *Growth*, Ads
*Growth* — keep the emphasis they already had, each marked four ways.

What is new is the selector, the per-category meta row, and the quote block.

---

## 4. The category selector

The existing WAI-ARIA tablist from `disclosure.js`: `role="tablist"`, roving
tabindex, `aria-controls`/`aria-labelledby` wired both ways, arrow keys
**swapped under RTL** so travel follows the reading direction. A test presses
ArrowRight in both directions and asserts it advances in English and goes back
in Arabic.

**It wraps rather than scrolls.** §17 permits a contained horizontal scroller;
a wrapping row is better here. A scrolling strip hides categories past the edge
with no affordance, at exactly the width where a visitor can least afford to
miss one. Five chips wrap onto four rows at 390px and cost nothing.

**The selected state does not rest on colour.** A 3px marker sits in every
chip's layout permanently and only becomes visible when selected — presence or
absence of a shape survives greyscale and every form of colour blindness, which
an accent border does not. Because it holds its space either way, selecting a
tab never reflows the row under the pointer. Weight is deliberately *not* part
of the state for the same reason.

Each chip carries a package count as a numeral, and the same count as
`u-visually-hidden` text, so a screen reader hears "Branding & Design, 3
packages" rather than a bare digit.

---

## 5. Prices, notes and the quote path

Every price is **Saudi Riyal** — `SAR` in English, `ر.س` in Arabic, from the
existing translation table. A test asserts the section contains no other
currency and that the figures are byte-identical in both languages.

Billing appears twice on purpose: per card, and once per category in the meta
row above the cards ("One-time projects" / "Billed monthly"), so a visitor
comparing categories does not have to read it off an individual card.

**Only one pricing note exists in the source** — the advertising-budget
exclusion — so only that one is shown, scoped to the category it applies to.
§27 lists several other possible notes (hosting excluded, external fees,
assessment for large projects); none has been supplied, and inventing a
commercial term is not a formatting decision. No scarcity language of any kind
appears (§28); a test greps for it.

The **custom-quote block** uses §25's own wording, *Request a Custom Quote*, and
goes to the same `#contact` flow as everything else. It is deliberately not
styled as a card — a fourteenth card implies a fourteenth price. Note that the
pricing document does not mention custom quotes; the wording comes from the
brief, and is worth confirming.

Its CTA is also the one primary button on the page **without** `data-cta-link`.
That attribute syncs a button to the site-wide CTA label, and it silently
overwrote "Request a Custom Quote" with "Start Your Project" — caught by eye in
a screenshot, not by a test.

---

## 6. Verified

Headless Chromium, both directions:

- All fourteen packages in the pricing section are **identical to their service
  sections** — name, price, billing, recommended flag and every feature line —
  in English and in Arabic.
- Five tabs with correct labels, counts and announced counts; one selected; one
  in the tab order; five labelled panels; one visible with JS on.
- Selecting a category swaps the panel and shows the right packages; the
  selected marker is visible and the unselected one is transparent.
- Keyboard: ArrowRight advances in LTR and retreats in RTL; Home jumps to the
  first category. RTL places the first category on the right.
- Saudi Riyal only. No scarcity language. Neither unsupplied category appears.
  One `h2`, fifteen `h3`, no heading skips on the page.
- **JavaScript disabled:** all fourteen packages readable, all fourteen prices
  present, all 120 feature lines rendered open.
- **No overflow at 320/360/375/390/430/768/834/1024/1280/1440/1920 × two
  directions × all five categories** with every disclosure forced open.
- Targets ≥ 44px. Reduced motion: the panel swaps without animating.
- Every earlier suite still passes; the single-file build still makes **0
  network requests**.

Two real defects the tests caught: the jump link was 26px tall on touch, and
the quote CTA's `nowrap` label set a 300px floor that broke the block at 320px.

---

## 7. Open

- **Integrated Solutions and Additional Services.** Send the packages and the
  add-on price list and both drop in — the selector is generated from the
  category list, so each is one entry plus its data.
- **Arabic copy** for the headline, lead, category labels, the quote block and
  the package names. Feature lists for Social and Ads are already bilingual.
- **Confirm the custom-quote wording**, which comes from the brief rather than
  the pricing document.
- **Other pricing notes**, if any exist beyond the advertising-budget one.
