# Stage 15 — Footer

The final navigation system, the last action, and the closure. Ends the
homepage.

---

## 1. What is in it, and what is not

| Column | Contents |
| --- | --- |
| Brand | Wordmark, a one-line statement of the offering |
| Quick links | Home · Services · Pricing · Why Us · Process · Contact |
| Services | The six approved categories |
| Start | The primary CTA |

Bottom row: copyright with a live year, and back to top. Between them, an
oversized `PIXORA` as the closure device (§27).

**Nothing was invented.** There is no approved email, phone number, WhatsApp
number, social profile or legal page anywhere in the source, so **none
appears** — §14, §15 and §17 all say to show only what exists. The layout holds
a fourth column and a bottom row that take those the moment they arrive,
without moving anything else. A test greps the rendered footer for an email
pattern, a phone pattern, the named social platforms, the three legal page
names and five families of invented proof.

**No second display CTA.** §05 asks for a conversion moment before the footer
navigation — Stage 14 *is* that moment and sits directly above. A second
display headline and large button a hundred pixels below the last one would be
two climaxes in a row, which §05's own "do not introduce multiple competing
CTAs" forbids. The action is carried forward as the primary button in the
fourth column: prominent within the footer, subordinate to the section above
it. A test asserts the footer contains exactly one button.

---

## 2. The defect this stage found: no navigation without JavaScript

§33 asks for a full navigation QA before finishing, and it turned one up.

Every nav container on the page was **empty in the markup** —
`<ul data-nav-render="nav"></ul>` — with the links injected by
`navigation.js` on boot. With JavaScript disabled the site had **no navigation
at all**: no header nav, no footer links, nothing for a crawler to follow. The
README's claim that the page "remains readable, navigable and complete" without
JavaScript was false for the most important part of it.

The fix is small and keeps the single source intact: the header nav and both
footer lists are now **seeded in the markup** with exactly what the script
would render. On boot, and on every language change, the script replaces them
with identical content. A test loads the page with `javaScriptEnabled: false`
and asserts the header has five links and each footer group has six.

The drawer is deliberately left unseeded — it only opens via a script-driven
button, so seeding it would put six links in the accessibility tree that
nothing can reach.

---

## 3. Synchronisation (§11)

`navigation-map.js` already held `SECTIONS`. Stage 15 adds **`SERVICE_LINKS`**,
the six categories, so the footer's services column renders from data rather
than from a second hand-typed list.

The synchronisation test asserts, in one pass:

- footer quick links are a subsequence of the actual section order;
- the header order agrees with the footer;
- the drawer renders the same order as the header;
- footer services point at the same anchors as the Services section;
- **and use the same names, in the same order.**

That last one caught a real drift: the footer said *Digital Marketing & Ads*
where the Services section says *Digital Marketing & Advertising*. Two names
for one service is exactly what §11 forbids, and it would never have been
noticed by eye — the two are four hundred pixels apart and read as the same
thing. The footer now uses the Services section's name.

---

## 4. Details worth recording

**Footer links rest in secondary, not accent.** `.c-link` is accent by default,
which is right for one link in a section foot and wrong for twelve in a column
— the first version rendered the entire footer yellow. §25 wants the hover to
move *toward* `#F4D13F`, so rest is secondary text and the accent is the
response. The underline `.c-link` already draws on hover carries the state
alongside the colour, so it never depends on hue alone.

**Back to top is an anchor, not a button.** `<a href="#home">` works with
JavaScript disabled, is keyboard-reachable for free, and the smooth scroll is
the document's own `scroll-behavior` — which `01-reset.css` already switches
off under `prefers-reduced-motion`. No script and no second mechanism. Its
chevron points **up**, which is not an inline direction, so it deliberately
carries no `u-flip-rtl` (§23).

**The closure wordmark had a direction bug.** Set with `direction: ltr` to
protect its glyph order, `text-align: start` then resolved against the
element's own direction and parked it on the *left* of an Arabic page while
every other leading-edge element sat on the right. "PIXORA" is all-Latin so its
order was never at risk; removing the pin and keeping `unicode-bidi: isolate`
fixes it. A test measures the wordmark's leading edge against the brand block's
in both directions.

**The year ships correct in the markup and is refreshed by script**, so the
footer is right without JavaScript and does not quietly go stale on 1 January.

---

## 5. Verified

Headless Chromium, both directions:

- Semantic `<footer>`; column headings are `h2`; one button and it is the
  primary; **every link resolves to a real element** — no dead navigation path.
- Six quick links and six services, matching the Services section by anchor
  *and* by name, in order; header, drawer and footer all agree.
- No email, phone, social profile, legal link or invented proof anywhere.
- **JavaScript disabled:** header nav renders (5), both footer groups render
  (6/6), the year is correct, back to top still works.
- Back to top scrolls to the top and takes keyboard focus with a visible ring;
  links rest secondary and move to accent on hover.
- RTL: brand at the leading edge and action at the trailing, closure wordmark
  at the leading edge, quick links in Arabic, the up arrow **not** mirrored.
- 1 / 2 / 4 columns at mobile / tablet / desktop; every footer link ≥ 44px.
- **No overflow at 320/375/390/430/768/820/1024/1280/1440/1600/1920 × two
  directions** — the widths §32 names.
- Reduced motion: smooth scrolling off, arrow static, nothing hidden.
- Every earlier suite passes; the single-file build still makes **0 network
  requests**.

---

## 6. Open

- **Contact details.** Email, phone, WhatsApp — the fourth column and the
  bottom row are built to take them. This is still the single biggest gap in
  the site: every CTA leads to a placeholder.
- **Social profiles.** `SOCIAL_LINKS` is still `[]`; add real ones as
  `{ label, href }` and they render in the mobile menu automatically. A footer
  row for them is a small addition once they exist.
- **Legal pages.** Privacy, Terms, Cookies — the bottom row has space beside
  the copyright; none is linked because none exists.
- **Arabic** for the service names (the quick links are already bilingual from
  `SECTIONS`) and for the brand statement.
