# Stage 14 — Final CTA / Conversion Section

Section 11, the last content section before the footer.

---

## 1. Why it is `#start` and not `#contact`

Every CTA on this site — the header, all eleven sections, twenty-plus buttons —
already points at `#contact`, which is still a placeholder awaiting real contact
details.

Making this section *be* `#contact` was the obvious move and it is wrong: its
own primary button would then have nowhere to go, and §32 forbids dead buttons.
There is no approved contact mechanism anywhere in the supplied data — **no
email address, no phone number, no WhatsApp number, no form endpoint** — so
there is nothing honest to point it at except the same destination every other
CTA uses.

So the section keeps its own id, its button points at `#contact` like all the
others, and when the contact details land nothing here has to change.

**This is the one thing blocking a working conversion on the whole site.**
Everything up to the click is built; the click currently scrolls to an empty
placeholder.

---

## 2. Composition

§17 rules out the generic centred card in a rounded box. This is the page's own
editorial language at its largest setting and nothing else: display type at
`--text-display-l`, one rule, and the actions on the trailing side with the
whole leading column left empty. No new device, no new colour, no illustration.

```
———                                    ← arrival marker
11  START

Let's build your
digital presence.                        ← 80px display, accent second line
──────────────────────────────────────
Identity and design, website or …        [ Start Your Project → ]  Explore →
                                    ———  ← departure marker
```

**Two markers carry the journey** (§18/§19) and they are the only decoration:
one sits on the rule the section *arrives* on, at the leading edge, echoing the
fold marker in Process; the other sits on the rule it *departs* on, at the
trailing edge, leading into the footer. Both mean something; neither is
ornament.

### The bug that shipped in the first version

The section carried both `.l-section` **and** its own `padding-block`, stacking
two section-level paddings — 136px + 160px at each end, 1175px of total height
for four lines of content. The wrapper now carries no padding and `.c-final`
owns its spacing, which also puts the arrival rule at the true top of the
section instead of 136px inside it. Height is now 759px, with 160px above and
88px below: **asymmetric on purpose**, so the departure rule sits close to the
footer it is leading into.

A test asserts the wrapper's padding is `0px`, that the block's top padding
falls inside §20's 120–180px, that the bottom is tighter than the top, and that
the whole section stays under 900px.

---

## 3. One action, and it works

One button on the whole section, and it is the primary — a test counts both.
The secondary is a text link, deliberately not a second button.

Verified as **functional, not decorative**:

- every `href` resolves to a real element on the page;
- the primary goes to the site's conversion destination;
- clicking it actually navigates (the test clicks it and reads `location.hash`);
- it has a visible focus ring;
- the arrow moves on hover — inherited from `.c-btn`, which is already
  direction-aware and already respects reduced motion, so nothing was restated
  here. A second mechanism for one behaviour is how the two come to disagree.

On mobile the primary spans the row (§23) at 54px tall. The secondary link
measured 26px — under the 44px floor — and now has a minimum height, the same
fix the pricing jump link needed.

---

## 4. No new claim

The supporting line names only the six approved services and the one-partner
proposition the site already makes. A test asserts it contains every approved
service term and none of a list of services the agency does not offer, greps for
percentages, guarantees, awards, social proof, counts, experience claims and
superlatives, and confirms **the only figure in the entire section is its own
number**.

---

## 5. Verified

Headless Chromium, both directions:

- One `h2`, no other heading level, no skips on the page; section 11, between
  Process and Contact; the eleven detail sections number consecutively 01–11.
- One button, one primary, every link resolving; the CTA navigates on click and
  focuses visibly.
- No invented proof of any kind; the only digit is the section number.
- Wrapper padding `0px`; block padding 160/88; total height 759px.
- **RTL:** both journey markers swap edges correctly, the CTA arrow reverses,
  and the headline starts at the leading edge — all measured, not assumed.
- Mobile: CTA full-width at 54px, every action ≥ 44px.
- **No overflow at 320/375/390/430/480/768/820/912/1024/1280/1366/1440/1536/
  1920 × two directions** — the widths §33 names.
- Reduced motion: the arrow does not animate; nothing hidden by a reveal.
- JavaScript disabled: headline and CTA render, and the CTA still reads
  *Start Your Project*.
- Every earlier suite passes; the single-file build still makes **0 network
  requests**.

---

## 6. Open

- **A contact mechanism.** Email, phone, WhatsApp, or a form endpoint — any one
  of them turns twenty-plus buttons from "scrolls to a placeholder" into a real
  conversion. Nothing else on this site is blocked on a single missing fact the
  way this is.
- **Arabic copy** for the headline, eyebrow, summary and secondary link.
- **Confirm the headline.** *"Let's build your digital presence."* is written to
  echo the hero and the Integrated Solutions hub without repeating either; §09
  offered alternatives and asked for approved copy where it exists.
