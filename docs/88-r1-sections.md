# R1 — the section pass, and the copy of the catalogue nobody had counted

**6 September 2026.** `docs/69` R1: how each section opens and closes, its
internal hierarchy, its rhythm against its neighbours, one CTA per surface, the
hand-off between them. Everything except naming and order, which waits on B5.

---

## 1. The audit found the system sound

Measured, not eyeballed — every top-level section on the homepage at 1366×768
and 390×844:

- **Padding is uniform.** Every `.c-detail` is 134/134 desktop, 66/66 phone.
- **The opening pattern holds.** Eyebrow and lead present on every section that
  should have them.
- **Headings are clean sitewide.** One `h1` per page, and **zero level skips**
  across the homepage's 47 headings, `/pricing`'s 20, `/about`, `/story`.
- **Sections butt directly together** — gap 0 everywhere — so rhythm comes
  entirely from padding, consistently.

**Two things looked like findings and were not.** Both were checked before
being written down:

| Looked wrong | Actually |
| --- | --- |
| The final CTA band has **0/0 padding** while every sibling has 134/134 | Rendered it: internal rules and whitespace carry the spacing, and it reads well. Not a defect |
| One section shows **5 CTAs**, others 3 | The rule (`docs/18` §103) is one *conversion action* per **surface** — header, drawer, hero — not per section. My probe was counting navigation links |

A section pass whose findings are mostly "this is fine" is a good outcome. It
is also why the one real finding is worth the space below.

---

## 2. The finding: the homepage was a copy of /pricing

Not similar. **Byte-for-byte identical:**

| | index.html | pricing.html |
| --- | ---: | ---: |
| Tier cards | **12** | **12** |
| Tier CTAs | **12** | **12** |
| Disclosures | **12** | **12** |
| Feature items | **110** | **110** |
| Tier names | identical set | identical set |

The cost, measured on a phone:

| | |
| --- | --- |
| Homepage | **35.1 screenfuls** |
| The four tier blocks within it | **11.1 screenfuls — 32% of the page** |
| `/pricing`, showing the same twelve | 18.2 screenfuls |

So the site's navigation offered **Pricing** as a destination that showed a
visitor exactly what they had just scrolled past. The information architecture
contradicted itself, and no measurement in the project had ever counted it.

---

## 3. The change, and the promise it had to keep

`/about` says the work is priced *"at prices published in full on this site"*.
That promise decided the shape of the fix.

**The homepage keeps everything that carries the promise:** the service, its
lead, the work samples, the **price floor with its billing period**, and a
conversion action. Only the feature lists and the exclusion disclosures move to
the page built to hold them — which `docs/87` had just given a door.

Each service block gained one quiet text link — *See all Branding & Design
packages* — the same device the story section uses, and the same rule: one
action per surface, plus a route to the detail.

The mechanism was already there. `build-pricing.js`'s own loop said:

> *"the guide and the homepage may diverge in what they include, but never in
> what a package says."*

That divergence had never been used. `renderBlock(c, full)` now uses it: the
guide gets the catalogue, every other target gets the summary and the link.
One source, two depths, and a price still cannot differ between them.

**Result: 35.1 → 23.8 screenfuls on a phone.** Zero tiers on the homepage,
twelve on the guide, four links between.

---

## 4. What broke, and what each break was actually telling me

Four things failed after the change. **None was noise; every one was a check
that had encoded the duplication as if it were the design.**

### 4.1 The buyer journey started on the wrong page

`validate.js` Flow A picks *Social Growth* on the homepage, clicks, and asserts
the contact form remembered it. With the tiers moved, it crashed —
`Cannot read properties of null`.

The journey had not become invalid. **It had become one page longer.** Flow A
now starts on the homepage, follows the service's own link to
`/pricing#social`, and chooses there. That tests strictly more than before: if
the route ever breaks, the journey stops before it starts.

### 4.2 A no-JS check that would now pass an empty page

`if (r.prices < 12)` was applied to **every** page, homepage included. It only
ever passed because the homepage duplicated the guide — and after the change it
would have failed a correct homepage while passing one with no prices at all.

Rewritten so each page is checked for the prices **it** is meant to show: the
guide's twelve tier amounts, the homepage's four service floors, plus its four
routes to the detail. The promise under test is *prices published in full*, and
that promise survived the move — but only because the check was rewritten to
follow it rather than to count to twelve.

### 4.3 §18 caught me twice, on my own code

Both times the same defect, and both times deserved:

1. Four quiet links all announcing **"See the three packages in full"** while
   leading to four different places. Fixed by naming the service; the count is
   already in the summary line directly above.
2. Four **"Ask about this service"** buttons doing the same. These had been
   `display: none` since Stage 20, so `qa.js` had never seen them — the moment
   they became visible, the guard fired on its first look.

### 4.4 A comment that predicted this exact day

`.c-detail__action` was hidden with this note:

> *"Kept in the markup and hidden everywhere, because it is still the right
> answer for a service block that has no packages under it — **and one is
> coming**."*

That block is what section 3 created. Hidden, the four homepage services
offered a desktop visitor no action at all — only a link to another page. The
rule now keys on the absence of the cards rather than on a page or a builder
flag:

```css
.c-detail:not(:has(.c-tiers)) .c-detail__action { display: inline-flex; }
```

So it states its own condition: where a service block has packages, the cards
convert; where it does not, this does.

---

## 5. A negative test that tested nothing

The first run of the new no-JS checks came back **0 of 3 caught**, and the
checks were innocent again.

`qa.js` serves `dist/`. **`validate.js` serves the repository root.** I mutated
`dist/index.html` and validated the root copy, so nothing I changed was ever
read. My "did the edit land?" guard — added yesterday for exactly this class of
mistake — passed, because the files genuinely changed. They were the wrong
files.

Retargeted: **3 of 3 caught**, each naming its own mutation.

| Mutation | |
| --- | --- |
| homepage loses its service prices | **caught** |
| homepage loses its routes to the packages | **caught** |
| guide loses its tier prices | **caught** |

**The lesson is narrower than "check the edit landed":** a mutation harness has
to mutate the artefact *the tool under test actually reads*. Two harnesses in
this project read two different trees, and nothing said so anywhere.

---

## 6. Verified

| | Desktop | Phone |
| --- | ---: | ---: |
| Homepage | 20.0 screenfuls | **23.8** (was 35.1) |
| Service actions visible | 4 | 4 |
| Tier CTAs on the homepage | 0 | 0 |
| Tier CTAs on the guide | 12 | 12 |
| Routes to the packages | 4 | 4 |

`validate.js` **0** · `qa.js` **0 high, 0 medium** · `a11y.js` **0
violations**.

A homepage service block now reads: the service, the work, the price, one
action, one route to the detail. That is the R1 spec, applied.

---

## 7. What R1 leaves for B5

Whether these four services are the right four, in the right order, named for
what the buyer wants rather than what we produce — `docs/80` §3.1. This pass
deliberately changed **how** each section is built and **nothing** about which
sections exist or what they are called.
