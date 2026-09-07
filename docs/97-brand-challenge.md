# Feature 02 — The Brand Challenge

**6 September 2026.** An interactive diagnostic quiz on the homepage:
invitation → question → verdict → reward → WhatsApp.

Feature 01 (`docs/96`) gives a reward for a click. This one gives a reward for
being right, and — more usefully — leaves the visitor knowing how we think.

---

## 1. Where it sits, and why there

**Immediately before the first service section**, roughly a third down the
homepage.

This is the opposite placement to the Mystery Reward, and deliberately so. A
reward has to attach to an offer the visitor has already seen, so it sits late.
A challenge is an *argument* — it demonstrates the judgement the services are
then sold on, so it has to come **before** the offer, not after it. It also
keeps the two interactive blocks apart: Mystery Reward is at ~70% down, and two
reward mechanics side by side would read as a game, not a business.

---

## 2. Architecture — one file defines the challenge

| | |
| --- | --- |
| `src/data/challenge.json` | **The only place the challenge exists.** Question, options, correct answer, attempts, reward tiers, storage key |
| `tools/build-challenge.js` | Renders markup between `<!-- CHALLENGE:START/END -->`, exactly as `build-pricing.js` and `build-rewards.js` do |
| `src/scripts/challenge.js` | Shuffle, grading, attempts, the weighted draw, persistence, copy |
| `src/styles/components/challenge.css` | Presentation only |

Neither the builder nor the runtime contains the question, an option, the
correct answer, or a reward figure. To change the challenge, change the JSON
and rebuild.

---

## 3. The question, and why it has one defensible answer

A clinic arrives with four complaints, **all four true**: a dated logo, a
six-second load, visitors who cannot tell which of five services applies to
them, and expensive ads.

> You can only start with one. Which one, once solved, makes the other three
> easier to solve?

The question deliberately does **not** ask which problem is worst — that is a
matter of opinion and would make a wrong verdict indefensible. It asks which
one is *upstream*, which is a question about dependency and has one answer:

- **Ads** need a proposition to target and a page that converts, so they depend
  on clarity; fixing them first helps nothing else.
- **A logo** changes how a business looks, not what it means.
- **Load time** is real and worth fixing, but a fast page that still confuses
  people converts no better — and it makes nothing else easier.
- **Clarity** unblocks all three at once.

This is also the site's own claim about itself, from `/about`: *"We do not start
designing before we understand the business."* The challenge tests exactly that.

---

## 4. Where the answer lives

Not on the options. Marking the correct one in the markup — `data-correct`, a
class, an ordering — puts the answer one View Source away.

Instead the section carries a salted digest of the correct **id**, and the
runtime hashes the chosen option and compares:

```js
const digest = (id) =>
  crypto.createHash('sha256').update(`${C.id}:${id}`).digest('base64').slice(0, 16);
```

Each radio's `value` is its own digest, so ids never reach the page at all. The
salt is the challenge id, so a digest from a retired promotion cannot be
replayed against a new one.

**This is obfuscation, not security** — the check runs in the browser, and
clearing storage allows another go. That is the correct trade for a marketing
device whose codes are honoured by a person, by hand. §7 sets out what a
backend would have to add.

---

## 5. Order is shuffled

`correct` names an id, never an index, and the options are shuffled at runtime
(Fisher–Yates, re-appending children) so the answer is not always in the same
position. Verified uniform over 4000 draws: 992 / 1009 / 974 / 1025.

---

## 6. What a visitor gets

Two attempts. A wrong first answer says so and invites another go; a wrong
second says the offer stands anyway and routes to WhatsApp. A correct answer
draws a tier from a weighted pool:

| Tier | 10% | 20% | 30% | 50% | 70% |
| --- | --- | --- | --- | --- | --- |
| Weight | 34 | 30 | 22 | 11 | 3 |

The headline promises **"up to 70%"** and never a guaranteed 70%. Over 50
simulated solvers: `{"20%":22, "10%":15, "30%":10, "50%":3}`.

---

## 7. What a backend would have to add

Nothing here survives a determined visitor, and nothing needs to. If codes were
ever redeemed automatically rather than by hand, three things would have to
move server-side: grading the answer, drawing the tier, and issuing a
single-use code bound to an identity. Until then the honest description is the
one in the JSON's own `_readme`: a marketing device, not a security control.

---

## 8. Two defects this feature surfaced in existing code

**The focus ring was written as the wrong kind of thing.** `--focus-ring` is a
two-layer *box-shadow* value. Written as `outline: var(--focus-ring)` it is not
a shorthand the parser accepts, so the declaration is dropped in silence.

On a normally focusable element that is harmless — the base `:focus-visible`
rule already draws a ring — which is exactly why the mistake survived review in
`index.css` and `gallery.css`. But this component's real control is a visually
hidden radio whose ring must land on a **sibling label**, where no base rule
reaches. The result was a keyboard visitor moving through four options seeing
nothing at all. Measured, not assumed: the label reported
`outline: none, boxShadow: none`, while the ring sat on a 1×1px
`clip-path: inset(50%)` input.

Fixed in all three files, and `qa.js` §28 now fails on the pattern rather than
the instance.

**The explanation was hidden behind something that did not look clickable.**
`display: flex` on a `<summary>` removes the native disclosure triangle, so
"Why" rendered as a plain heading — and the explanation is the entire point of
the feature. It now carries the same plus/minus indicator the accordion uses,
driven by `[open]`, and reads "Why this is the answer".

---

## 9. Two smaller corrections

- The promotional claim was inside the terms `<a>`, so a screen reader
  announced *"Up to 70% off eligible packages. Terms apply."* as the link's
  name and the promise was styled as a link. The claim is now plain text and
  only "Terms apply." is the link.
- `70%` was typed into the builder's copy — a second source of truth for the
  ceiling. It is now interpolated from the tiers.

---

## 10. Guards added

**`qa.js` §27 — the challenge config and the page must agree.** Same drift as
§26, higher stakes: this component hands out a discount code, and a wrong
answer key hands it to everyone while nothing on screen looks wrong. Checks the
shipped digest against the configured answer, that the answer is one of the
options, that options and copy exist in both languages, that every tier has a
code and a positive weight and percent, that the headline's ceiling matches the
best tier, and that the rendered options are exactly the configured ones in
both directions.

**`qa.js` §28 — a focus ring written as the wrong kind of thing.** §8 above.

Both were negative-tested — a guard that has never been watched to fail is not
a guard:

| Mutation | Result |
| --- | --- |
| `correct: clarity → ads`, no rebuild | fires — answer key mismatch |
| a tier loses its code | fires — nothing for a winner to quote |
| headline claims 90%, best tier 70% | fires — promise and pool disagree |
| `outline: var(--focus-ring)` added to `card.css` | fires — names file and line |

The first attempt at that table produced four silent passes. The cause was the
test harness, not the guards: `cmp -s` returns non-zero when files *differ*, so
`changed && run` short-circuited and the qa run never executed. Worth recording
because it is the same failure this project keeps meeting — **a measurement
that succeeds while measuring nothing**.

---

## 11. States, verified

| | |
| --- | --- |
| initial | intro, 2 attempts |
| started | quiz shown |
| wrong | wrong state, 1 attempt left |
| correct | won, tier drawn, code shown, WhatsApp claim carries it |
| refresh | identical state restored |
| copy | clipboard matches the code |
| attempts gone | spent state, 0 remaining |
| spent + refresh | still spent |
| no JS | intro visible, start button hidden, four real radios, terms link |

Responsive and RTL, measured rather than eyeballed: panel 327px on mobile,
704px tablet, 768px desktop; smallest touch target 48px; no horizontal
overflow at any width; `dir="rtl"` correct in Arabic with numerals isolated.
Keyboard: arrow keys move between options and the ring is now visible on the
label. Reduced motion: the reveal sweep does not run.
