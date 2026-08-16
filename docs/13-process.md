# Stage 13 — Process / How We Work

Section 10, between Why Us and Contact.

---

## 1. Where the six stages come from — read this first

**The Services & Pricing document contains no agency-wide workflow.** The only
sequence anywhere on the site is the *service* flow in the Integrated Solutions
row (Branding → Website/Store → Content → Social Media → Advertising → Growth),
and that describes what the agency offers, not how it works.

§02 covers exactly this case: *"If the exact process wording is not yet
finalized, build the visual and interaction architecture using neutral approved
labels/placeholders, without inventing unsupported business information."*

So the six names are the **brief's own** (§07): Discover, Plan, Create, Build,
Launch, Grow. They are placeholders in the sense that matters — the
architecture is real, the labels are the client's, and **nothing beneath them
was invented**.

Every description and every note is anchored to a capability already published
on the page:

| | Stage | Note | Traceable to |
| --- | --- | --- | --- |
| 01 | Discover | Audience Research | Ads Growth feature, verbatim |
| 02 | Plan | Packages & Add-Ons | Stage 10 and Stage 11 |
| 03 | Create | Identity & Design | the Branding service |
| 04 | Build | Development & Integrations | *Website development*, *Required integrations* |
| 05 | Launch | Testing & Deployment | *Testing*, *Deployment*, *Delivery ready for use* |
| 06 | Grow | Monthly Management & Reporting | the monthly Social and Ads packages |

A test splits every note into words and asserts each one **already appears
elsewhere on the page** — the notes name approved capabilities, they do not
coin new ones. A second test greps the section for turnaround times,
guarantees, percentages, certifications, awards, testimonials and client counts,
and asserts the only numerals present are the section number and the six
indices.

**Nothing here states how long anything takes.** That is the single most
tempting thing to invent in a process section and the single most damaging if
wrong.

---

## 2. The composition: a track that folds

§04 forbids the generic `01 → 02 → 03` corporate timeline, and the page already
carries three ordered `.c-pipeline` strips and two gapped card grids — a
seventh variation of either would read as the same component again.

This is a **gapless divided track**: one continuous rule runs across each row,
cells are separated by hairlines rather than by space, and the numerals sit on
the rule as markers. It reads as a path with divisions rather than as six
objects.

**The fold is the point.** Six steps in one row is a timeline; folding after
three gives the sequence a shape and lets each step keep a readable measure. The
placement is **explicit grid placement, not CSS `order`**, so the DOM stays
01–06 and the reading order is never scrambled for keyboard or screen-reader
users — a test asserts both the DOM order and that `order` is `0` on every step.

Under RTL the columns mirror, so the path starts at the trailing edge and folds
the other way with no extra rules. A test measures the actual x-positions in
both directions and asserts row 1 ascends and row 2 descends in English, and
the reverse in Arabic. That is §22 checked geometrically rather than assumed.

The fold itself is marked with a short accent segment at the turn — the one
place the reading direction changes, and the only place the track needs to say
so.

**Three compositions:** 3-column serpentine at 1024+, 2-column straight at
768–1023 (a fold every row is a zig-zag, and zig-zags read as decoration), and
a single column below that.

---

## 3. No interaction, on purpose

Every step's name, description and note is rendered at rest, so there is nothing
to open and nothing to activate. Hover emphasises — accent numeral, brighter
body, accent note rule — and that is all. Six focus stops that do nothing would
be worse than none, and §13's rule that essential content must not sit behind
hover is satisfied by there being nothing behind hover at all.

There is **no JavaScript in this section**, which also settles §17: a test
scrolls 600px through it and asserts the page moves normally and nothing snaps
back.

---

## 4. Verified

Headless Chromium, both directions:

- Six stages in an `<ol>`, numbered 01–06, each an `h3` with a description and
  a note; no control inside any step.
- Every word in every note already appears elsewhere on the page.
- No turnaround times, guarantees, percentages, certifications, awards,
  testimonials or client counts. The only figures are the section number and
  the indices.
- **The serpentine measured, not assumed**: two rows of three, DOM order
  unchanged, no CSS `order`, row 1 ascending and row 2 descending in LTR and
  the reverse in RTL, fold marked in both.
- 1 / 2 / 3 columns at mobile / tablet / desktop.
- Page scrolls normally through the section and does not snap back.
- **No overflow at 320/375/390/430/480/768/820/912/1024/1280/1366/1440/1536/
  1920 × two directions** — the widths §29 names.
- One `h2`, six `h3`, nothing deeper, no heading skips; one primary CTA;
  section 10 directly after Why Us; the ten detail sections number
  consecutively 01–10.
- Targets ≥ 44px; every description visible on mobile without tapping.
- Reduced motion: transitions instant, hover still marks the step.
- JavaScript disabled: all six stages render.
- Every earlier suite passes; the single-file build still makes **0 network
  requests**.

One bug, caught by eye rather than by test: the desktop dividers were placed by
DOM position rather than by column, which drew a stray border down the track's
outer edge and left the 06|05 boundary undivided. Dividing by column fixes both.

---

## 5. Open

- **The real process.** These six names are the brief's, not the agency's. If
  there is an actual internal workflow — different stages, different names,
  more or fewer of them — send it and the labels swap; the architecture holds
  any count that divides sensibly.
- **Turnaround times**, if you want them shown. Deliberately absent, because
  none is stated anywhere in the source.
- **Arabic copy** for the whole section.
