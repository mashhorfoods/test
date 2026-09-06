# The Brand Challenge, redesigned — a three-stage interaction that showed none of its stages

**6 September 2026.** Owner request: *"Redesign The Brand Challenge (marketing
feature). Do a complete redesign for the section. Check recent trend UI/UX for
the section."*

Feature 02 shipped this morning (`docs/97`) and works: real radios, a salted
answer digest, two attempts, a weighted reward pool. Nothing below is about
whether it works. It is about what it looked like while working.

---

## 1. What was wrong

The component has **three stages and five panes** and communicated none of
that. You pressed a button, the panel became a different panel, and nothing
said how many more of those there were or which one you were in.

| | |
| --- | --- |
| **No progress of any kind** | The single strongest 2026 pattern for a multi-step flow, and the one thing that stops people abandoning something they have already started, was absent |
| **Four identical bars** | Four options, one column, a muted grey letter each. Card-based radios — the modern default for plans, onboarding and quizzes — read as a set of choices; a stack of bars reads as a form |
| **The case material looked like scenery** | The clinic's four complaints are the facts you need to answer at all. They were one grey paragraph, indistinguishable from the lead above them, and on a phone they scrolled off the top before you reached the options |
| **The panel jolted on every transition** | The five panes measured 406, 651, 232, 232 and 674 pixels tall. Every change moved the whole page below the panel by the difference |
| **The reward apologised for itself** | A winner saw one figure — "10%" — over a line reading "up to 70% off". The pool it came out of was invisible, so the number read as a shortfall rather than a draw |
| **"Attempts left 2"** | A numeral a visitor reads once and stops seeing |

## 2. What current practice actually says

Searched, since the reference sites remain unreachable from this container
(`docs/52` §4). Four findings, all of which the old component failed:

- **Progress indicators** are the defining pattern for multi-step interactive
  flows in 2026 — they say how far in you are and how much is left, and they
  are what reduces the uncertainty that ends a half-finished interaction.
- **Interactive quizzes and finders** raise conversion because the first easy
  step creates a drive to finish; that only holds if finishing looks close.
- **Radio cards** are the default for this shape of choice: the whole card is
  the label, the container carries the state, and hover gets a real shift
  rather than a colour tweak.
- **A radio group is the unit** — `fieldset` + `legend`, one tab stop, arrows
  within. That part the original already had right, and it is kept intact.

## 3. What it is now

**A persistent header.** The eyebrow, the title and a three-step track sit
outside the panes and never move. Stage one is *Brief*, stage two is *Answer*,
stage three is *Reward*; the wrong-answer pane is still stage two, because you
are being sent back to it, and both endings are stage three.

**The two-column question.** From 64em the brief sits beside the answers
rather than above them, so the four facts stay in view while the answer is
chosen. The panel widens from 48rem to 62rem to hold it. The brief itself is
now marked as case material — an accent rule, a label, its own ground.

**Answer cards, two across from 40em.** Bigger markers, a hover lift where
there is a pointer to lift under, and **four** selection signals rather than
three: accent border, tinted ground, filled marker, and a tick. The tick
occupies its space whether drawn or not, so selecting does not reflow the card.

**Attempt dots that empty.** Two filled dots go hollow one at a time. The
numeral stays beside them, unhidden, because that is what a screen reader
announces; the dots are `aria-hidden` and are what a sighted visitor watches.

**A reward ladder.** The five tiers now all ship and stay on the page, and the
script marks the one that was drawn. The figure itself moved out to its own
line above the ladder, written from the drawn rung by the script so the two
cannot disagree. The odds are deliberately not printed: they are in
`challenge.json` and in `docs/97`, and a rung labelled "3%" turns a reward
into a lottery ticket — every solver wins something, which is not a lottery.

**A floor under the panel** (30rem from 48em) with the panes centred inside
it, so a short pane neither jolts the page nor leaves 150px of visible nothing.

**A pane entrance,** finally wired. An entrance animation used to sit in this
file keyed on an attribute nothing set; it was removed rather than wired up,
because adding motion to a shipped component under cover of a cleanup is not a
cleanup. This is the redesign it was waiting for, so it goes in on purpose and
is keyed on `hidden` — the thing that actually changes — with nothing to fall
out of sync with the script.

## 4. Three defects found in the building of it

### 4.1 The section lost its accessible name for the whole of the challenge

`aria-labelledby="challenge-title"` pointed at an `<h2>` **inside the intro
pane**. The moment a visitor pressed *Start*, that pane was hidden — so from
the question onward the landmark was named by a hidden element. The heading is
now in the persistent header, which fixes the naming and anchors the
composition in the same move.

### 4.2 The step track had no current step without JavaScript

The stylesheet colours the current step from `data-challenge-at`, which only
the script set. So until JavaScript ran — and for a visitor without it, never —
the track drew three identical grey steps while `aria-current` said step one:
the announcement and the drawing disagreeing about the same fact. The initial
state now ships in the markup.

### 4.3 The legend was about to stop being the group's name

The first version of the two-column layout put the brief before the `<legend>`
and the legend inside the answers column. A `<legend>` anywhere but the
`<fieldset>`'s first child is neither valid nor announced, which would have
cost the option group the name that is read with every option — to gain a
layout. The grid moved to an inner wrapper instead and the legend stayed put.

## 5. Two guards, and one honest exemption

- **`qa` caught the new lists.** Both `<ol>`s drop their markers, and a list
  without a marker stops being announced as a list in Safari and VoiceOver
  unless it carries `role="list"`. Neither did. Fixed.
- **`qa` then reported five selectors that style nothing.** Rather than guess
  which — the failure mode this session has hit repeatedly — the check was
  instrumented to name them. All five were **runtime states**: a completed
  step, a spent attempt dot, a drawn reward chip. None can match shipped
  markup and none ever will. They now carry the check's own documented
  `qa:allow-dead` marker with the reason written next to it, so the count
  stays a signal rather than drifting upward with every interactive component.

## 6. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | 0 violations |
| Keyboard | Start moves focus into the group; arrows move and select; the ring lands on the label as a `box-shadow`; the tick follows |
| Group semantics | `<legend>` is the fieldset's first child; the labelled heading is visible in every stage |
| Wrong → wrong → spent | states `wrong` then `spent`, dots `spent,spent`, count 0, track `done done now` |
| Persistence | spent survives a reload; a won 20% draw restores as the same 20%, one marked rung |
| Phone (393px) | step track one row, reward ladder one row, cards stack |
| Arabic | track mirrors right to left, brief's accent rule and radius swap sides, submit and attempts swap ends |
| `prefers-reduced-motion` | no hover lift, no tick scale, no pane entrance |
| Console errors | 0 |
