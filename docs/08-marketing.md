# Stage 08 — Digital Marketing & Paid Advertising

The fifth detailed service section, inserted between Social Media and
Integrated Solutions. Reuses `.c-tier` and `.c-pipeline`; adds the platform
strip, the campaign flow and the budget note.

---

## 1. Content

| Package | Price | Features |
| --- | --- | --- |
| Ads Starter | 150 ر.س / شهريًا | 8 |
| Ads Growth | 225 ر.س / شهريًا | 10 |
| Ads Performance | 400 ر.س / شهريًا | 11 |

All 29 feature strings are reproduced from the source. Arabic is
character-for-character; the English column translates the Arabic-only items
with **every quantity carried across unchanged** — *تصميم حتى 2 إعلان* → "Up to
2 ad designs", *حتى 4 حملات* → "Up to 4 campaigns", *إدارة منصة إعلانية واحدة* →
"One advertising platform managed". Strings already English in the source are
identical in both columns. A test transcribes all of them independently and
compares index by index, in both languages.

**Ads Growth is marked recommended.** The pricing document does not designate
one — unlike Branding's *MOST REQUESTED* and Social's *الأكثر طلبًا* — but the
brief's §11 names Growth as the recommended solution and §13 permits the
emphasis. Marked four ways (ribbon, accent border, raised surface, primary
CTA), so it never rests on colour. The ribbon reads *Recommended* / *موصى به*;
**the Arabic is my translation**, not a supplied string.

Positioning lines — "Entry-level solution.", "Balanced solution.", "Advanced,
performance-focused solution." — are the brief's own characterisations of the
three tiers (§11), not lines from the pricing document. They carry
`data-i18n-pending`.

---

## 2. The budget note is not a footnote

> ميزانية الإعلانات نفسها غير مشمولة في رسوم الإدارة.

This is the commercially load-bearing sentence in the section: the management
fee and the client's advertising spend are different money, and a visitor who
misses it has misread the price. §14 says it must not be buried.

It is an `<aside>` at **body size** — a test asserts the note is at least as
large as body text — in a bordered block with a 3px accent edge on the inline
start. It is the only element in the section with an accent edge, which is what
makes it read as a caveat rather than as more marketing copy. The Arabic ships
verbatim; the English expands it into two sentences because the distinction is
what matters, not the brevity.

---

## 3. No performance data, anywhere

§35 is absolute, and it is the rule this section was most at risk of breaking:
a performance-marketing section wants to show numbers. There are none. No ROAS,
reach, impressions, conversion rate, client count or multiplier — not even a
"decorative" one, because a visitor cannot tell a decorative figure from a
claim.

The only digits in the section are the section number, the six stage indices,
the three prices, and the two quantities the document itself states. A test
greps the rendered text for percentage, ROAS, `NNM`/`NNK`, "impressions",
"conversion rate", "clients served" and multiplier patterns.

The section still reads as data-aware — through structure, indices, the flow
and the connected marks — rather than through invented results.

---

## 4. The campaign flow describes itself in approved words

Six stages, from the brief's §04: Strategy → Audience → Creative → Campaign →
Optimization → Measurement. Each carries a second line of context, and **every
one of those lines is assembled only from approved feature names**:

| Stage | Context |
| --- | --- |
| Strategy | Campaign Strategy |
| Audience | Audience Targeting, Research and Segmentation |
| Creative | Ad Creative, Ad Copy and Copywriting |
| Campaign | Campaign setup, Campaign Monitoring and Retargeting |
| Optimization | Campaign, Creative and Budget Optimization |
| Measurement | Conversion Tracking, A/B Testing and Performance Report |

A test splits every context line on commas and "and" and checks each fragment
against the set of approved feature strings, so the diagram cannot drift away
from what the packages actually contain. It caught one drift already:
"monthly reporting" was a paraphrase, and became *Performance Report*.

**The stages are not focusable.** Every name and every line of context is
rendered at rest and hover only emphasises, so there is nothing to activate;
making inert text tab-stoppable would add six empty stops to the keyboard path
and promise an interaction that does not exist. Emphasis is a colour change
*and* a size change on the tap mark above each stage, and reduced motion keeps
the colour while dropping the growth.

**Six divides evenly at every width** — 1, 2 or 3 columns, declared rather than
left to `auto-fit`, which resolved to five at 1440px and left "Measurement"
stranded on its own row like an afterthought. A test asserts every row of the
flow has the same number of stages at 390 / 640 / 834 / 1440.

---

## 5. Platforms, without implying they are all included

Facebook · Instagram · TikTok · Snapchat · Google Ads, set as type rather than
as a wall of logos (§10) — nothing reproduces a trademark and nothing depends
on an external asset.

A bare row of five names implies all five, in every package, which the data
contradicts: Starter manages **one** platform (unnamed), Growth manages Meta,
Performance manages Meta and Google. TikTok and Snapchat appear in the
service's platform list and in no package. So the strip carries a scope line
saying exactly that. It is not a disclaimer bolted on — it is the only honest
way to show the list.

---

## 6. Verified

Headless Chromium, both directions:

- Three packages at 150 / 225 / 400 SAR monthly; all 29 feature strings match
  an independent transcription index by index, in Arabic and in English.
- Exactly one language visible at a time (12 bilingual strings, both columns
  present); figures byte-identical across languages; the Arabic price reads
  figure-then-currency, verified by measuring positions.
- One package emphasised, four ways. The budget note verbatim in Arabic and at
  least body size. Five platforms with the scope caveat.
- Every flow context line built only from approved feature names.
- No fabricated performance data of any kind.
- One `h2`, five `h3`, flow an `<ol>`, platforms a `<ul>`, note an `<aside>`,
  all decorative SVG hidden, no heading skips on the page.
- IA: the Services row and the Stage 09 ecosystem node both point here; the
  section sits between Social and Integrated; detail sections renumber
  consecutively 01–06.
- **No overflow at 320/360/375/390/430/768/834/1024/1280/1440/1920 × two
  directions with every disclosure forced open.** Targets ≥ 44px.
- Reduced motion: the tap does not grow but still highlights; nothing hidden.
- JavaScript disabled: all 8/10/11 features, the note, six stages and all three
  prices render.
- Every earlier suite still passes; the single-file build still makes **0
  network requests**.

---

## 7. Open

- **Arabic copy for the section chrome.** The features and the budget note are
  bilingual; the headline, lead, stage names, platform scope line and
  positioning lines are still `data-i18n-pending`.
- **Review the English feature translations and the Arabic ribbon** — seven
  translated feature strings and *موصى به* are mine, not supplied.
- **Stage 10 — Pricing Architecture** was issued and then interrupted in favour
  of this stage. Its §03 needs Integrated Solutions packages (Business Launch,
  Digital Growth) and the Additional Services list, neither of which has been
  supplied yet.
