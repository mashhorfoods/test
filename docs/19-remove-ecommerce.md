# Removing E-Commerce

The service is no longer offered, so it is gone from the page — not hidden, not
commented out. This records everywhere it reached, because a service woven
through a site for six stages does not live in one place.

Verified by the same twelve suites, both directions, with and without
JavaScript.

| | Before | After |
| --- | --- | --- |
| Services | 5 | **4** |
| Sections | 12 | **11** |
| Package cards | 14 | **12** |
| Feature lines | 120 | **109** |
| Add-on rows | 12 | **11** |
| Buttons | 24 | **21** |
| Page height (1440px) | 21,303px | **18,980px** |

---

## 1. What was removed

**The service itself**

- Section 03 and everything in it — headline, lead, the store-module figure,
  the six-capability list.
- Its two packages, E-Commerce Starter (650) and E-Commerce Professional
  (1,100), from `src/data/pricing.json`. That file is the source, so the cards
  disappeared from the markup on the next generator run.
- The Services accordion entry, and its `SERVICE_LINKS` record — which is what
  removed it from the footer's services column, since that column renders from
  the same array.
- The seeded footer link, so the no-JavaScript path agrees with the rendered
  one.

**Where it appeared as part of something else**

- The **ecosystem node** in Integrated Solutions, and its place in the flow.
- A **body in the hero constellation**, plus the spoke drawn to it.
- Both sides of the **arrangement contrast**, and the counts above them —
  *Separate providers 5* became *4*, and "Five briefs to write" became "Four".
- The **add-on** *"Adding products to the store" / إضافة منتجات للمتجر*. With no
  store service on the page the row referred to work the site no longer offers
  to build. Removed on review, and its category count corrected from 3 to 2.

**Copy that named it**

| Where | Was | Now |
| --- | --- | --- |
| `<meta description>` / `og:description` | "…websites, e-commerce, social media…" | "…websites, social media…" |
| Hero | "brands, websites, online stores and digital experiences" | "brands, websites and digital experiences" |
| Services intro | "Six services." | "Five services." |
| Integrated flow | "Website / Store" | "Website" |
| Integrated lead | "The same five services" | "The same four services" |
| Footer | "Brands, websites, stores, content…" | "Brands, websites, content…" |

Every sequence renumbered with it: section numbers 01–09, accordion indices
01–05, ecosystem markers 01–04, add-on indices 01–11.

## 2. Two compositions had to be rebuilt, not just trimmed

Both were laid out for a fixed count. Removing a member left a hole rather than
a smaller version of the same thing.

**The hero constellation** placed five bodies on a ring at `--x/--y`
percentages, with an SVG spoke drawn to each. Deleting one left four bodies
bunched around an empty lower-right quadrant, and a fifth spoke pointing at
nothing. The four survivors were respread on the same `r=38` ring at 75°/95°/
90°/100° intervals — deliberately uneven, because the constellation is a
controlled asymmetry and a perfect cross would read as a different design — and
the orphaned spoke removed.

**The ecosystem diagram** placed nodes explicitly: children 1–3 in the lead
column, 4–5 in the trail column, over three grid rows. With four nodes that
became **three down one side and one beside a hole**. It is now 2 + 2 over two
rows, and the `-n + 3` / `n + 4` boundaries that decide which way a node's
connector, arrow and hover shift point moved with it, to `-n + 2` / `n + 3`.
Both mirror correctly under RTL.

## 3. A mistake worth recording

The edit that removed the store add-on took **two** rows, not one: *"Additional
website page" / صفحة Website إضافية — 35 ر.س* went with it. That row has nothing
to do with e-commerce, and it is approved price data.

It was caught by `addons.js`, which transcribes the source table independently
and reported two omissions where one was intended. It was restored from git in
its original position, and the indices renumbered. **The suite that knows what
the source says is what stands between a slip in a bulk edit and shipping a
missing price.**

## 4. Left in place deliberately

**`.c-tiers--pair`** — the layout for a two-package category. E-Commerce was the
only one, so the class is currently unused, but `build-pricing.js` still emits
it for any category with two packages. Deleting the rule would silently break
the next one, so it stays, with a comment saying why.

**`docs/06-ecommerce.md`** — kept and marked superseded rather than deleted. If
the service returns, the reasoning behind how the section was built is worth
more than the disk space.

## 5. Open

- **Arabic copy** for the three lines this change rewrote, like the rest of the
  page copy.
- **The Websites split** (`docs/05-websites.md`) was a signed-off inference
  covering Websites and E-Commerce. Only the Websites half is still live.
