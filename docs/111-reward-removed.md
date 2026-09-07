# The Mystery Reward, removed

**7 September 2026.** Owner instruction: *"keep the challenge, remove the
reward."*

`docs/108` §5 found two prize mechanics on one homepage and said pick one:
either alone is a legitimate lead magnet, but both together read as a promo
site rather than a studio arguing for craft — and the audit's §14 recorded the
buyer's reaction to that directly: *"Is the discount game a real discount, or
the real price? Two prize mechanics make a buyer suspect the list price is
padded."* `docs/110` moved them apart rather than deleting one, because
removing a feature commissioned two days earlier was not a judgement to make
silently. This is the answer to that question.

**Why this one.** The Brand Challenge earns its discount by making the visitor
think about the thing this studio sells — which of four true problems is
upstream of the others. The Mystery Reward asked them to press a button. On a
site whose case for itself is judgement, only one of those is on-message.

---

## Removed in full, not just hidden

| | |
| --- | --- |
| The section | `<!-- REWARD:START … END -->` in `index.html`, 11,644 bytes |
| The script | `src/scripts/reward.js` |
| The stylesheet | `src/styles/components/reward.css`, and its `@import` |
| The data | `src/data/rewards.json` |
| The generator | `tools/build-rewards.js`, and its `require` in `build.js` |
| The boot call | `initReward()` and its import in `main.js` |
| The guard | `qa.js` §26 |

**On the guard.** §26 checked `rewards.json` against the rendered pool. It is
wrapped in `fs.existsSync`, so deleting the JSON would have left it passing
quietly for the rest of the project's life — a check whose subject no longer
exists passes for the wrong reason, which is worse than no check at all. It is
retired with a note in its place, and **the number is left as a gap rather than
reused**: §27 and §28 are referenced by number from commit messages and docs,
and renumbering would silently invalidate every one of those references.

## What deliberately stayed

- **`rewardCopy`** in `navigation-map.js`. The Brand Challenge's copy button
  uses it; only its comment was wrong. The key name is still accurate — the
  challenge does hand out a reward code.
- **`terms.html#promotions`.** The challenge links there, so the section is
  still load-bearing. Its wording named "the mystery reward on the homepage" in
  both languages; it now names the Brand Challenge. Still a labelled
  placeholder awaiting the legal review (roadmap item 10) — that has not
  changed.
- **The prefixed names in `challenge.js`** (`CHALLENGE_MOTION_OK`, and the
  rest). They exist because `build.js` refuses to flatten two top-level
  bindings with the same name, and `reward.js` owned `MOTION_OK`, `read` and
  `show`. That collision is gone with the file, but the prefixes cost nothing
  and the next module to want a name like `show` should not be able to take
  this one's.
- **`docs/96-mystery-reward.md`.** Kept as written. The feature existed, was
  built to a standard, and was removed by a decision — deleting the record
  would hide the decision along with it.

## The page after it

Fifteen sections, down from sixteen; **19,970px, down from 20,583**. The
sequence is unchanged otherwise:

```
hero · services · proof · branding · websites · social · marketing ·
integrated · add-ons · process · work · campaigns · challenge · faq · contact
```

The one visible consequence: the homepage now has exactly one promotional
mechanic, and it sits at section 13 — after the whole portfolio, where a
visitor has already seen what the studio can do.

## Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | 0 violations |
| Reward section | absent — `[data-reward]` returns nothing |
| Reward files | all four deleted; no live reference in `src/`, `tools/` or `build.js` |
| Challenge end to end | starts, grades, wins — state `won`, prize drawn at 20%, code issued |
| Challenge copy button | label intact in both languages |
| `terms#promotions` link | still resolves |
| Section numbering | 01–09, unbroken |
| Console errors | 0 |
