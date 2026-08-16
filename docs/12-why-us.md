# Stage 12 — Why Us / Value Proposition

Section 09, between Add-Ons and Process.

---

## 1. The hardest constraint was §04

A "Why Us" section is where agency websites put their proof, and this one has
none to put there. No client count, no years in business, no awards, no case
studies, no testimonials, no performance figures — none of it exists in the
Services & Pricing document, and §04 forbids inventing any of it.

So the section makes its argument **from the delivery model itself**, which is
the one thing the document does establish: five services, one agency.

A test greps the rendered section for nine families of fabricated proof —
client/project counts, years of experience, percentages, awards, guarantees,
market-leadership language, testimonials, social proof and performance claims —
and asserts the only numerals in the whole section are the section number, the
two panel counts and the five pillar indices.

---

## 2. Not another ecosystem diagram

§07 describes a connected-services visual, and Stage 09 already builds one: the
armature of five nodes wired to a hub. Building it again here would be **the
same picture captioned twice**, which §31 warns against and which would leave
the site with two sections making one point.

Stage 09 answers *what connects to what*. Stage 12 has to answer *why that
matters to me*. Different question, different device.

### The device: a contrast of arrangements

The same five approved services, shown twice:

| Separate providers | One partner |
| --- | --- |
| five detached boxes, five briefs to write | five rows of one box, one brief |
| five schedules to align | one schedule |
| five sets of files to keep in sync | one set of files |

The argument is carried by **structure** — detached boxes against a single box
with a continuous accent edge — so it needs no arrows, no colour coding, and no
claim about anyone's work. The five names are identical and in the same order
on both sides; only the arrangement differs, and a test asserts exactly that.

**Every line under the panels is a fact about arrangement, not about quality.**
"Five briefs to write" is true by definition of engaging five providers. Nothing
says the other arrangement produces worse work, because nothing in the source
supports that and it is not the point being made.

Both lists are **exposed to assistive tech** rather than hidden as decoration.
Read aloud, the section becomes: *Separate providers — Branding, Websites,
E-Commerce, Social Media, Marketing & Ads — five briefs to write, five schedules
to align, five sets of files to keep in sync… One partner — the same five —
one brief, one schedule, one set of files.* The repetition **is** the argument,
so hiding it would remove the point for exactly the users who cannot see the
boxes. A test asserts neither list carries `aria-hidden`.

---

## 3. The pillars are rows, not a card wall

§10 forbids the generic three-icon card wall. Five equal boxes would also
flatten a hierarchy the section depends on, so the pillars are **editorial rows**
— large numeral, name, supporting line, hairline rule the full measure. A test
asserts no pricing card component appears in the section.

Each pillar is traceable to something the site already shows:

| | Pillar | Traceable to |
| --- | --- | --- |
| 01 | One partner | the five service sections |
| 02 | Connected services | Stage 09, Integrated Digital Solutions |
| 03 | Consistent brand | Branding & Design's outputs feeding the rest |
| 04 | Simpler management | the arrangement contrast above it |
| 05 | Built to grow | packages plus the add-ons that attach to any of them |

None of them promises an outcome.

---

## 4. One bug worth recording

The pillar rows bled their hover surface 16px past each edge with negative
inline margins, so the background extended a little beyond the text. It looked
marginally better and made `.c-pillars` overflow its container **at every
desktop width** — the page never scrolled, because an ancestor absorbed it, so
nothing was visible and only the width assertion caught it. The bleed is gone;
the hover surface now spans exactly the row box, which is where the rules run
anyway.

The accent spine had a related problem caught by eye rather than by test: drawn
as a segment on each row, the dividers interrupted it and it rendered as five
separate bars — arguing the opposite of "one thing with five parts". It is now
one absolutely-positioned edge on the list.

---

## 5. Verified

Headless Chromium, both directions:

- No client counts, years, percentages, awards, guarantees, leadership claims,
  testimonials, social proof or performance claims. Only nine figures in the
  section, all of them structural.
- Both panels list the same five services in the same order; three symmetric
  facts each; both lists exposed to assistive tech; each panel a labelled
  `<section>`.
- The detached boxes are measurably detached; the joined rows measurably share
  edges; one continuous accent spine.
- Five pillars in an `<ol>`, each an `h3` with a supporting line. One `h2`,
  seven `h3`, nothing deeper, no heading skips on the page.
- **None of the Stage 09 ecosystem components appear here**, and no line is
  reused from it — asserted, not assumed.
- Section 09, between Add-Ons and Process, with a link into Process (§28). The
  nine detail sections number consecutively 01–09.
- **No overflow at 320/375/390/430/480/768/820/912/1024/1280/1366/1440/1536/
  1920 × two directions** — the widths §29 names.
- RTL: the first panel moves to the right, the pillar numeral stays on the
  leading edge, the accent spine follows.
- Targets ≥ 44px; the panels stack on mobile rather than squeezing side by
  side. Reduced motion: transitions instant, nothing hidden.
- JavaScript disabled: both panels and all five pillars render.
- Every earlier suite passes; the single-file build still makes **0 network
  requests**.

---

## 6. Open

- **Arabic copy** for the whole section — headline, lead, both panel labels,
  the six facts, the five pillar names and bodies, the foot line. The service
  names inside the panels are the same short strings used elsewhere.
- **If real proof ever exists** — a client count, a completed-project figure, a
  named reference — this is the section it belongs in, and it would strengthen
  the argument considerably. Send anything you can substantiate.
