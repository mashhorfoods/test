# B1 — the reference, deconstructed from what actually arrived

**6 September 2026.** Two frames: `pixverse.ai` hero on a phone, and
`app.pixverse.ai` home on a desktop. Not the recording `docs/64` asked for, and
the two are not even the same product — one is the marketing site, the other is
the signed-out application. Both are still worth reading, and one of them
answers the category question better than the recording would have.

This is **X03 Experience Deconstruction**, which is about the decisions a
reference made. It is *not* X02's second half, which is about measured values.
Section 4 says why that half is still open, and section 5 hands over the tool
that closes it.

---

## 1. The rule I am holding myself to here

**No invented numbers.** I can look at these frames; I cannot measure them. I
do not know their true pixel dimensions, their device pixel ratio, or the
window width they were taken at, and a screenshot rescaled for a chat window
will produce a confident, wrong figure for every one of those.

So everything below is stated as a **relationship or a decision** — "the
headline is the loudest thing in the frame by a wide margin", never "the
headline is 44px". Where a number matters, section 5 is how we get a real one.

This is the same discipline `docs/72` needed when my first CTA gap measurement
excluded the fixed header, and `docs/75` needed when a shrink was reported
between two elements that never sit together. A measurement that measures
nothing has cost this project seven-plus rounds already.

---

## 2. Frame one — the marketing hero, on a phone

What is in the first screen, in order: logo · language · one CTA · eyebrow ·
headline · one paragraph · action row. **Seven things.** Nothing else.

### 2.1 The action is an input, not a button

The hero's action row is two controls: a bordered pill **text field**, showing
a real placeholder mid-sentence, and beside it a gradient pill **button**. The
field is the smaller of the two and it comes first.

The decision: **the first thing a visitor can do is the actual first step of
the product**, not a label promising one. Typing a prompt *is* using PixVerse.
There is no click between wanting and starting.

**What transfers, and what does not.** We sell a conversation, not a
generation, so a prompt box would be theatre. But the principle survives the
translation and it is the sharpest thing in either frame:

> The hero action should be the smallest *real* first step, not a door to one.

Our hero currently offers a WhatsApp button and a link to the work. The
WhatsApp button is genuinely a first step. The question X04 has to answer is
whether we can make it carry the visitor's actual opening sentence — the way
the field carries the prompt — instead of dropping them into an empty thread
where they have to compose from nothing. **A pre-filled first message is our
version of the placeholder.** That is a concrete, testable change and it goes
into X04 as a proposal, not into the site today.

### 2.2 Two CTAs in the first screen, near-identical labels

The header says **"Try PixVerse"**. The hero says **"Try PixVerse AI →"**.
Same destination, one screen apart.

`qa.js` §18 flags duplicate accessible names — so does the reference violate
our own rule? **No, and this is a useful confirmation.** §18 only fires at
three or more controls sharing a name, and only when they *disagree* about
destination. These two agree. The rule as built would pass this page, which is
the right answer: repeating your one CTA is emphasis, and only becomes a defect
when the repeated name points somewhere different each time.

A rule that survives contact with a site we respect is a rule worth keeping.

### 2.3 The headline sits on the brightest part of the image

White type is placed directly over a large soft glowing orb. It reads, because
the glow is diffuse and the weight is heavy.

**We do the opposite on purpose and should keep doing it.** `docs/54` §8 put
the light at 62% across so the left third stays darkest for the English
headline, and mirrored it at `[dir="rtl"]` so the Arabic one gets the same
clean ground on the right. PixVerse can centre on the bright spot because they
have one language and one text direction. **A bright region cannot be mirrored
into safety; a dark region can.** Bilingual is the constraint that decides
this, and it decides it our way.

### 2.4 The header is a logo and two controls

Logo, a globe for language, one CTA pill. That is the entire phone header —
no menu trigger visible in the frame.

Ours carries more. Whether that is right is a real question for X04 and I am
not answering it from one frame: their navigation may be behind a scroll, and
an agency site with six destinations is not a single-product site with one.
What the frame does establish is that **a phone header with three elements is a
choice a serious product makes**, not an oversight.

### 2.5 The quiet decisions

- **Centred.** Eyebrow, headline, paragraph and actions all centre on phone.
- **The eyebrow is tiny, wide-tracked and muted** — it labels without competing.
- **The paragraph steps down in colour, not only in size.** Two devices, one
  direction. Ours mostly steps down in size alone.
- **A small human silhouette stands at the bottom of the scene.** It costs
  nothing and it gives the image a scale it would not otherwise have.

---

## 3. Frame two — the application home, on a desktop

A tool, not a landing page, so most of it does not transfer. Two things do, and
the first is the best thing in either frame.

### 3.1 The categories are named for the outcome, not the feature

The content is sorted twice. A tab row — **Video · Template · Challenge** —
then a chip row:

> **All** · Ad Magic · Cinematic Narrative · Stylistic Art · Viral Case ·
> Animal Theatre · Effects Rendering · Avatar · Education & Learning

Read those chips again. Not one of them names a capability. Every one names
**the thing the visitor is trying to end up with**. "Ad Magic" is not a
feature; it is a person who needs an advert. "Viral Case" is a person who wants
reach. "Education & Learning" is a person with something to teach.

**This is the answer to "category and section sort", and it arrived without the
recording.** The user's question in the roadmap was how to order and name our
categories. The reference's answer is that the axis is wrong before the order
is: sort by *what the buyer wants to walk away with*, not by *what we produce*.

Our services are named the way agencies name services. `docs/69` P3-4 holds the
four-block structural question behind B5's buyer sessions, and it should stay
there — five buyers will say what they came for far better than I can infer it.
But **this reframes the question B5 asks.** It is no longer "which order should
these four blocks go in", it is "do these four blocks name what buyers want, or
what we do". That is a better question and it costs the same five sessions.

Recorded as a proposal for X04 and an input to `docs/68`. Not a change today.

### 3.2 The primary action is docked, and never leaves

The prompt composer floats over the content at the bottom of the viewport,
above the grid, permanently. Whatever you scroll to, the thing you came to do
is one glance away.

**We shipped the lighter version of exactly this in P1-5.** The header CTA
appears on scroll once the hero action leaves the viewport (`is-cta-away`,
`initReach()`), which closed the gap where `/story` had a CTA in view for 6% of
its scroll. The reference commits harder — a permanent docked bar rather than a
conditional header pill.

Ours is the right weight for a page you read, theirs for a page you work in. I
do not think we should adopt the docked bar, and P1-5 already banked the value.
**Worth noting that the reference validates the direction we chose**, which is
the most either of us can claim from a still.

### 3.3 One smaller note

Commerce lives at the **bottom of the persistent rail** — an affiliate card,
social icons, terms and copyright — not in a page footer. On a tool you never
scroll to the bottom of, a footer has nowhere to live. Not our problem; our
pages end.

---

## 4. What these frames cannot tell us, and why I could not get it myself

**Everything measurable, and everything about scroll.**

| Still open | Why it needs the live site |
| --- | --- |
| Type ramp | Computed `font-size` and `line-height` — a screenshot gives neither |
| Control sizing and touch targets | Whether their CTA clears 44px is a number, not a look |
| Spacing ladder | Section padding at each breakpoint |
| Section order and rhythm | The frames show one screen each; the page has many |
| Scroll cost | How many screenfuls the page runs to |
| Motion | The user's answer — **"sections fade up"** — is recorded and is all we have |

**I tried to measure it myself and could not.** This container's egress proxy
answers `403` to `CONNECT pixverse.ai:443`; Playwright reports
`ERR_TUNNEL_CONNECTION_FAILED` and WebFetch reports `EGRESS_BLOCKED` for the
same host. The network policy permits the package registries and GitHub and
little else. This is not a bug to route around — it is the environment working
as configured, and it means **no reference site can ever be measured from
inside this project.**

Also still entirely open: **an Arabic-first reference.** Nothing here is
bilingual, nothing here is RTL, and the two hardest problems on our site —
mirroring a lit scene and holding one type ramp across two scripts — have no
reference at all. A URL remains enough.

---

## 5. The probe that closes section 4 without a recording

`tools/reference-probe.js` is the measuring script I wrote to run here, turned
into something that runs in a browser console instead. Paste it into the
developer console on any reference site and it returns, as JSON:

- the full computed **type ramp**, every distinct size/leading/weight in use,
  sorted large to small, with a text sample of each
- every **control** — height, width, padding, radius, fill, and whether the box
  clears **44px in both directions**
- where each control sits **as a percentage of the scroll**, which is the
  measurement that decides CTA reach
- **section order**, each one's height in **screenfuls**, its vertical padding
  and its background
- page height, total screenfuls, `lang`, `dir`, and whether reduced motion was
  on during the run

It scrolls to the bottom and back before reading, so "sections fade up" does
not hide from it, then copies the result to the clipboard.

It reads only what is already rendered. No network, no writes, no storage.

**Two runs finish B1's measurable half:** one at a maximised window, one in the
device toolbar at iPhone 14 Pro. A third run on any Arabic-first site closes
the other gap. That is a few minutes at a keyboard and it replaces the
recording entirely — better, because it returns numbers rather than pictures of
numbers.

---

## 6. What this unblocks, and what it does not

| | State |
| --- | --- |
| **X03 Experience Deconstruction** | **Done for the hero and the category system** — sections 2 and 3. Thin on scroll and rhythm, and it says so |
| **X02 second half** (measurable benchmark) | **Still blocked.** One probe run each way opens it |
| **X04 Reference-Driven Redesign** | **Can start.** Three proposals are already on the table: the pre-filled first message (§2.1), the outcome-named categories (§3.1), and holding the dark-side-left rule against the reference's opposite choice (§2.3) |
| **X10 comparative validation** | Blocked — comparison needs the numbers |

Three findings survive from two frames the brief did not ask for. The recording
would have added scroll and rhythm; the probe adds everything else and more
precisely.
