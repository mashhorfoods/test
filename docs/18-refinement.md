# Refinement — clarity, repetition and CTA discipline

A subtractive pass over the finished site. Nothing was redesigned, no colour
moved, no price or service changed. What changed is how much the site says, how
many times it says it, and how many buttons it asks you to consider.

Verified by `scratchpad/refine.js` — 8 groups, both directions, with and
without JavaScript. Every figure below is measured.

> **Followed by a placement change.** The packages were moved again after this
> pass, into the service sections, and the standalone Pricing section was
> removed — see §9 at the end. Everything §1 says about *removing the
> duplication* still holds; where it says the packages live in Pricing, they
> now live in the service section each one belongs to.

| | Before | After |
| --- | --- | --- |
| Page height (1440px) | 25,253px | **18,482px** → 21,303px (see §9) |
| Buttons on the page | 46 | **27** → 24 (see §9) |
| …saying "Start Your Project" | 31 | **19** (14 of them one per package) |
| Package cards | 28 | **14** |
| Feature lines | 240 | **120** |
| Sentences repeated across sections | 97 | **0** |
| Section-level closing CTA blocks | 10 | **0** |
| Sections | 14 | **13** → 12 (see §9) |

---

## 1. The fourteen packages were on the page twice

Every package — name, price, positioning line and full inclusion list — was
published in its service section AND again in Pricing. That single duplication
accounted for about 80 of the 97 repeated strings on the page and most of its
height. Stage 10 built it that way deliberately, generating Pricing *from* the
service sections so the two could not drift; the duplication was safe, but it
was still duplication.

§10 resolves it: *Services should focus on what the service is. Pricing should
focus on what is included.* So the packages live in Pricing, and each service
section ends with one line instead of three cards:

```
────────────────────────────────────────────────────────
Three packages, from 200 SAR  ONE-TIME    Compare what each includes →
```

That answers the only pricing question a visitor has *while reading about a
service* — how many, from how much, billed how — and the link opens that
category in Pricing rather than dumping them on the first tab.

**The direction of truth inverted.** `tools/build-pricing.js` used to scrape
the service sections into `src/data/pricing.json`. There is nothing left to
scrape, so the JSON is now the source and the tool renders both the cards and
the five bands from it. The "from 175 SAR" in a service section therefore
cannot disagree with the cheapest card in Pricing, and a test asserts it.

The parity test got **stronger**, not weaker: it used to compare two renderings
of the same data against each other; it now compares the rendered markup
against `pricing.json` itself, which also catches a generator that was never
re-run.

While inverting it, one piece of hygiene: the JSON held HTML-escaped text
(`Hashtag &amp; Keyword Research`) because it had been scraped out of markup.
Now that it is the file a human edits, it holds `&` and the generator escapes
on output.

## 2. Two sections were making the same argument

Section 06 (Integrated Solutions) and section 09 (Why Us) both argued that the
five services connect into one system rather than five separate projects —
3,146px apart, under near-identical headlines:

> Everything your business needs. **Connected in one system.**
> Everything your digital presence needs. **Connected in one place.**

They are now one section. The ecosystem diagram shows **how** the five services
connect; the arrangement contrast — the same five services as five detached
boxes, then as five rows of one box — shows **what that saves you**. One idea,
established two ways, in one place.

The five value pillars that followed the contrast were removed rather than
reworded. Pillar 04 read *"One brief, one schedule and one point of contact"*
directly beneath a panel reading *"One brief. One schedule. One set of files."*
The two facts the pillars added that the contrast did not — that the identity
from Branding is what everything else is built from, and that add-ons attach to
any package — are both already stated elsewhere on the page.

## 3. Thirty-one "Start Your Project" buttons

Ten sections carried a closing block: a sentence, a primary CTA, and usually a
link back up the page. It was the template §05 names — *eyebrow + headline +
paragraph + CTA + next-section button* — applied whether or not a decision was
available at that point.

All ten are gone. Nineteen remain, and the test now classifies **every button
on the page by job** rather than counting them:

```
{ conversion: 5, "open a service": 6, "package action": 14,
  "custom quote": 1, "submit the form": 1 }
```

Five conversion actions, one per surface: header, mobile drawer, hero, the
final CTA section, footer. Fourteen package actions — one per card, at the
page's only real decision point, where the visitor has a name, a price and an
inclusion list in front of them. Six that open a service. Nothing unclassified.

## 4. Buttons that only meant "scroll down"

- **"Scroll to explore"** in the hero. The page scrolls; Services is in the
  header. Removed, along with its animated mouse graphic, its CSS and the
  IntersectionObserver that dismissed it.
- **"See how we work"** under Why Us, pointing at Process — the section
  immediately below it — beside the sentence *"That is what we offer. Next is
  how the work actually runs."*
- **"See how it connects"** under Services.
- **"Pricing and what each package includes comes next."**
- Five **"Back to all services"** and two **"Back to packages"** links.
- **"Explore our services"** in the final CTA, sending a visitor who had
  reached the conversion moment back up the page.
- **"Explore Our Services"** in the hero, whose only destination was the next
  section.

What stayed is navigation that opens a specific destination — the six service
links. §04 permits exactly that, and they were relabelled to say where they go:
*"View packages"* became **"See what it covers"**, because the packages had
moved. (The band's own link into Pricing went too, in §9.)

## 5. Six ways of saying the same sentence

The offering — *everything digital, connected, from one partner* — was stated
in the hero, the Services intro, the Integrated headline, the Integrated hub
note, the final CTA and the footer. Three were cut:

| | Was | Now |
| --- | --- | --- |
| Services | "Everything your business needs to build, launch and grow its digital presence — from one place." | "Six services. Open any one to see what it covers." |
| Final CTA | "Identity and design, website or online store, content, social media and advertising — from one team, as one connected system." | "Tell us what you are building. We will take it from there." |
| Footer | "Brands, websites, online stores and digital experiences — connected with content, social media and marketing, from one partner." | "Brands, websites, stores, content and advertising — from one partner." |

The hero keeps the full statement, because that is where a first-time visitor
needs it, and Integrated keeps it because it is that section's subject.

Services is a **navigation** section, so its intro now orients rather than
re-pitches. The final CTA's job is to say what to do next, not to re-list the
offering for the sixth time.

## 6. Marketing filler

One phrase on the entire site: *"Ready to get started?"*, above the Process
section's CTA. Both are gone. The prose written across Stages 00–17 was already
specific — no *passionate*, *cutting-edge*, *end-to-end*, *results-driven* or
*digital transformation* anywhere — and the test now keeps it that way with a
26-term denylist.

## 7. The mobile pass

§21 asks for a dedicated mobile audit, and it found something the desktop view
hid. The "What the service covers" list stacked its numeral above the name, so
ten two-word capabilities took two lines and ~100px each — a phone screen and a
half for a short list. On narrow screens the numeral now sits inline in its own
column; the stacked composition returns from 30em, where there is width for it.

Fixing it introduced two defects that the suite caught:

- The numeral column was `auto`, and each `<li>` is its own grid — so the
  column sized against each row's own content and the names landed on a **4px
  ragged edge** (102–106px). A fixed track gives every row the same column.
- The Marketing pipeline's steps carry a **third** child, a detail line. With
  two tracks declared it fell into an implicit row at column 1 — 1.75rem wide —
  and overflowed at every width below 30em.

## 8. One bug found along the way

Pricing carried **two copies of the advertising-budget note**: its own
section-level one from Stage 10, and the one this pass moved in from the
Marketing service section. The section-level copy showed on every tab,
including Branding, where it qualified nothing. The surviving copy sits inside
the Marketing panel, next to the prices it qualifies.

---

## What was deliberately kept

**Fourteen identical "Start Your Project" labels in Pricing.** §11 asks a
package card to carry *package · price · key difference · what's included ·
action*, and only one panel is open at a time, so a visitor sees two or three.
Each is bound to its card by `aria-describedby`, so a screen reader hears
"Start Your Project, Professional".

**The cards in the ecosystem diagram and the contrast panels.** §13 warns
against card overuse, but each of these is a meaningful grouping — a distinct
service, or one of two arrangements being compared. No card is nested two
levels inside another card anywhere on the page; the test asserts it.

**The section eyebrow-and-number system.** It is orientation, not decoration:
it tells a visitor where they are in a thirteen-section page. The numbers
resequenced 01–11 after the merge.

## Open

- **The Arabic copy** for everything this pass rewrote — the Services intro,
  the final CTA line and the footer statement — is still `data-i18n-pending`,
  like the rest of the page copy.
- **`docs/12-why-us.md` describes a section that no longer exists** as its own
  entity. Its argument survives inside `docs/09-integrated.md`'s section.
- Everything already listed in `README.md` under Outstanding.


---

## 9. Where the packages ended up

After this pass shipped, the packages moved once more — into the service
sections, with the standalone Pricing section removed entirely.

So each service section now runs: what the service is → what it covers → **its
package cards** → a summary line. The line is what §1 introduced, minus its
link:

```
────────────────────────────────────────────────────────
Three packages, from 200 SAR  ONE-TIME
```

**What this pass achieved is unchanged.** The fourteen packages still appear
**once**, not twice — the duplication §1 removed has not come back. What
changed is which of the two places they kept. `tools/build-pricing.js` still
renders everything from `src/data/pricing.json`, and the parity test still
compares the rendered markup against that file.

What went with the Pricing section:

- **The category tablist and its five panels.** With each service carrying its
  own cards there is nothing to select between. `pricing.css` lost 4,802 bytes;
  what remains is the custom-quote block, so the file is retitled.
- **The `data-pricing-jump` deep link** and its handler in `disclosure.js`. It
  existed to open the right tab; there are no tabs.
- **"Compare what each includes"** — removed from all five summary lines, and
  the `comparePackages` string with it. The cards are directly above the line
  now, so there is nothing to compare *to*.
- **"Pricing" in the navigation**, from `SECTIONS` and from the seeded header
  and footer markup. It would have pointed at a section that no longer exists.
- **`billingAllOnce` / `billingAllMonthly`**, the per-panel billing summaries.

What was **kept** rather than deleted with it:

- **The custom-quote block** (*"Something more specific?"* → Request a Custom
  Quote) was the only thing in the Pricing section that was not pricing. It is
  the path for work no package covers, so it moved to the end of **Add-Ons** —
  the section about extra and unlisted work, exactly where a visitor who has
  just failed to find what they need will be. The bare line the clarity pass
  had put there (*"Anything not listed is scoped on request."*) was replaced by
  it rather than kept alongside.
- **The advertising-budget note** moved back to the Marketing section with the
  packages it qualifies. Still exactly one copy.

The sections renumbered again: Add-Ons 07, Process 08, Start 09, Contact 10.
Twelve sections, three header links.

### A measurement bug, not a page bug

The five summary lines all read `opacity: 0` on first inspection. They were
fine: the test helper jumped to the bottom of the page with `scrollTo`, and an
IntersectionObserver never fires for an element you scroll straight past — so
every reveal it was meant to trigger stayed hidden and every measurement taken
afterwards was meaningless. The helpers now step down the page the way a reader
does. Worth remembering: **a scroll jump is not a scroll.**
