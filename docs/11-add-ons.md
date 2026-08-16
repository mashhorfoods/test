# Stage 11 — Add-Ons & Extra Services

The twelve optional services, grouped for scanning. Section 08, directly after
Pricing.

This is the **Additional Services** data that Stage 10 §26 asked for and did
not have. It now exists, as its own section rather than as a table inside
Pricing — twelve rows of a different shape do not belong inside a package
comparison, and the conversion journey reads better as *choose a package →
add what you need → start*.

---

## 1. The data, and the §31 checklist

All twelve rows, verbatim. Arabic is the source text; the English column is a
translation.

| # | Service | Price |
| --- | --- | --- |
| 01 | تصميم منشور منفرد | 10 ر.س |
| 02 | تصميم إعلان | 12 ر.س |
| 03 | تصميم Presentation | 50 ر.س |
| 04 | كتابة محتوى | 12 ر.س |
| 05 | تصميم Reel | 25 ر.س |
| 06 | مونتاج فيديو | 30 ر.س |
| 07 | Landing Page إضافية | 60 ر.س |
| 08 | صفحة Website إضافية | 35 ر.س |
| 09 | إضافة منتجات للمتجر | حسب العدد |
| 10 | تصوير فوتوغرافي | حسب المشروع |
| 11 | تصوير فيديو | حسب المشروع |
| 12 | Company Profile | 125 ر.س |

The test transcribes §31's table independently and compares as a **set**: every
source row present exactly once, nothing extra, no duplicates. Set comparison
rather than index-by-index because the page order is grouped, not the table's
order — that difference is presentation, and the test should not care.

**Grouping is a UX treatment only (§09).** Design / Content / Digital / Media /
Branding. No service moved price band, was merged, split, renamed or dropped; a
test asserts the five group sizes are 3/3/3/2/1 and that they total twelve.

---

## 2. Three price states, kept unconfusable

§12 is the rule this section exists to get right. There are three states:

| State | Rendered | Count |
| --- | --- | --- |
| Starting price | *From* **10** SAR / *يبدأ من* **10** ر.س | 9 |
| By quantity | حسب العدد | 1 |
| By project | حسب المشروع | 2 |

**Every figure is prefixed.** The source table's own heading is *Starting
Price*, so no number here is a final price, and none is shown as one. A test
asserts all nine carry the prefix in both languages.

**The two variable states contain no numeral at all.** They are set as words in
a bordered chip at body size, not as a figure at price scale. That is a
structural difference rather than a colour one: nothing without a digit can be
misread as a fixed price, whatever the reader can or cannot see. A test asserts
no digit appears in either.

The figure is `unicode-bidi: isolate`d but **not** pinned to `ltr` — Arabic
writes the figure before the currency too, and pinning reversed it into
`ر.س 10` back in Stage 05. A test measures the two boxes and asserts the figure
sits right of the currency in Arabic.

---

## 3. Modules, not cards, and not buttons

**Not `.c-tier`.** A tier card is a package you buy; an add-on is a module you
attach to one. Giving them the same card would say they are the same kind of
thing, and would put twelve more full-weight cards on a page already carrying
fourteen. These are smaller, denser units — a component tray (§34).

**Not interactive.** There is no cart and no selection system, so §27 and §14
both apply: the modules are `<li>`s with hover emphasis, not buttons. Twelve
focus stops that do nothing would be worse than none, and twelve per-card CTAs
would compete with the section's one (§26). A test asserts no module contains a
link, button or input, and that the section has exactly one primary CTA.

Hover marks a module three ways — accent border, accent index, accent figure —
and every name and price is fully legible at rest, so nothing is behind hover
(§16). On touch, where hover never fires, nothing is lost.

Layout: 1 column below 768px, 2 to 1024px, 3 above. Asserted at all three by
counting the most modules sharing a row, not by dividing items by rows — three
items in two columns wrap 2+1, which a ratio reports as "1.5 columns".

---

## 4. Verified

Headless Chromium, both directions:

- All twelve source rows present exactly once, none invented, none duplicated,
  every Arabic string and every figure verbatim.
- Nine starting prices all prefixed, in both languages; three quoted services
  with no numeral; Saudi Riyal throughout.
- Five categories with the right membership and counts, each an `h3` over a
  `<ul>`, each count both shown and announced ("3 add-ons").
- Continuous numbering 01–12. One `h2`, five `h3`, nothing deeper — service
  names are list items, not sections. No heading skips on the page.
- No module contains a control; one primary CTA; no cart, checkout, payment,
  discount or scarcity language anywhere.
- Section 08, directly after Pricing; the eight detail sections number
  consecutively 01–08.
- RTL: modules mirror, the index stays on the leading edge, the price reads
  figure-then-currency, and the quoted-price chip hugs the leading edge instead
  of stretching across its cell.
- **No overflow or clipping at 320/360/390/430/767/768/820/912/1024/1280/1440/
  1600/1920 × two directions** — the widths §32 names.
- 1 / 2 / 3 columns at mobile / tablet / desktop. Targets ≥ 44px.
- Reduced motion: transitions instant, hover still marks the module, nothing
  hidden by a reveal.
- JavaScript disabled: all twelve modules and all nine figures render.
- Every earlier suite passes; the single-file build still makes **0 network
  requests**.

Three of the four defects this run surfaced were in the *tests*, not the page:
a clipping check that flagged tight display leading as truncation, a column
count that divided instead of grouping, and an RTL measurement taken against
the wrong box. The fourth was real — a redundant reduced-motion block in this
component, restating what `02-tokens.css` already does globally. Two mechanisms
for one behaviour is exactly how they come to disagree, so it was removed.

---

## 5. Open

- **Arabic copy** for the section chrome — headline, lead, the five category
  labels, the foot line. The service names and both variable price states are
  already bilingual.
- **Review the English service names.** All twelve are my translations of the
  Arabic; *Company Profile* is the only one that was already English.
- Stage 10's pricing selector still has no **Integrated Solutions** category —
  that data is still outstanding. Additional Services is now covered here.
