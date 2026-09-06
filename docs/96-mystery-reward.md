# Feature 01 — Mystery Reward

**6 September 2026.** An interactive promotional component on the homepage:
invitation → reveal → reward → WhatsApp.

---

## 1. Where it sits, and why there

**Between Add-ons and Process**, roughly two-thirds down the homepage.

The brief asked for maximum engagement without competing with the hero. Working
down the page: the hero is out; immediately after it the visitor has not yet
been given a reason to care; and immediately before the final CTA it would sit
next to another conversion block and the two would compete.

After Add-ons, the visitor has seen **the whole offer** — four services, their
price floors, the extras — and has not yet been asked for anything. That is the
moment a reward has something to attach to, and its own CTA points forward
(`/pricing`, WhatsApp) rather than back up the page.

---

## 2. Architecture — one file defines a reward

| | |
| --- | --- |
| `src/data/rewards.json` | **The only place a reward exists.** Name, detail, code, type, weight, validity, promotion id, storage key |
| `tools/build-rewards.js` | Renders markup between `<!-- REWARD:START/END -->`, exactly as `build-pricing.js` does |
| `src/scripts/reward.js` | The reveal, the weighted pick, persistence, copy |
| `src/styles/components/reward.css` | Presentation only — no reward is named in it |

Changing the promotion is editing one JSON file and rebuilding. No CSS, no
JavaScript, no markup.

### 2.1 Every reward ships in the page

All seven are in the DOM from the start, hidden; the script unhides the one it
picked. That costs about 2KB and buys three things this site already requires:

- **no layout shift and no empty state** — the answer is already there;
- **both languages in the markup**, for a crawler and for a translator, like
  every other string here;
- **the visible state is CSS**, so reduced motion and a failed script both land
  somewhere sensible.

It also means a curious visitor can read all seven in the source, which is fine
— see §6.

---

## 3. The three stages

**Invitation.** *A reward is waiting for you.* Reveal your mystery reward and
discover a special offer from us. **Reveal my reward.** Below it, discreetly:
*One reward per visitor. Terms apply* — linked to `/terms#promotions`.

**Reveal.** A 2px accent line sweeps the panel while the invitation fades and
the reward fades in. **~560ms**, on `--duration-slow` and `--ease-out`, the
same tokens every other transition here uses. No flip, no wheel, no confetti.
The line travels with `translateX` inside a container query, so it runs
left-to-right in English and right-to-left in Arabic from one keyframe.

**Reward.** *YOU UNLOCKED IT* · the reward in accent yellow at the price type
size · what it means · the code in a dashed accent box · validity · then
**Copy code** and **Claim it on WhatsApp**, with a quiet *See the packages*
link beneath.

---

## 4. The conversion step is WhatsApp, and it carries the code

The brief said to prioritise WhatsApp if that is already the primary channel.
It is — 27 links across the site — so there is **no new lead form and no
invented backend**.

**Claim it on WhatsApp** opens a message that already says what was won:

> Hi Pixora — I revealed a reward: MYSTERY15. I'd like to use it.

Same device as every package CTA (`docs/82`), so nobody retypes a code on a
phone. It is registered as `[data-wa]`, which means `contact.js`'s existing
observer swaps it on every language change — and because this link is built
*after* load, the one swap that observer cannot cover is the first one, so
`reward.js` sets the href for the language showing at that moment.

---

## 5. Terms

`/terms` gained a **Promotions and reward codes** section, and its first words
are **"Not final terms."** It says plainly that nothing in it has been reviewed
by a lawyer, and that until it is, a code is an invitation to talk about a
discount which is then agreed in the written quote like every other figure.

It lists what the section will cover once written — one per visitor, validity,
applicable services, non-transferability, no cash value, no combining, the right
to end the promotion. **As a placeholder, labelled as one**, which is what the
brief asked for and what `docs/90` has with a lawyer.

---

## 6. What the anti-abuse actually is, stated honestly

The pick is written to `localStorage` with the promotion's id. A refresh shows
the same reward; the reveal button does not come back; a new promotion id lets
everyone draw again. Every storage access is wrapped, because private mode
throws — a visitor who cannot store a reward still sees one, they just lose it
on refresh. That is the right direction to fail.

**It is not security, and the code says so rather than implying otherwise.**
The pool is in the page, the pick is in the browser, and clearing storage draws
again. These codes are a marketing device; whoever honours one checks it by hand
like any other quote.

**What a backend would have to add**, if the promotion ever justifies one: issue
the code server-side against a visitor identifier, store which codes were issued
and redeemed, and refuse a second issue. The component is shaped for that — the
pick is one function reading weights, and the storage read/write are two small
wrapped functions. None of the presentation would change.

---

## 7. Tested

| | |
| --- | --- |
| Initial state | invitation shown, button visible, no reward |
| Reveal | reward shown, code set, WhatsApp link carries the code |
| **Refresh** | **same reward**, reveal button gone |
| Copy | clipboard matches the code exactly |
| **Spread over 60 fresh visitors** | 20 / 15 / 8 / 5 / 5 / 4 / 3 across the seven — weighted, not uniform |
| **No JavaScript** | invitation shown, reward hidden, **button hidden**, terms link works |
| **Reduced motion** | reveals instantly, no sweep |
| Keyboard | focus ring present, **Enter** reveals, tab order Copy → Claim → link |
| Screen reader | `role="status"`, `aria-live="polite"`, announces *"YOU UNLOCKED IT · 10% off · …"* |

**Responsive** — 375 / 768 / 1440, both languages: no horizontal overflow
anywhere; smallest control **48px**, largest **56px**, against a 44px floor.

Two things fixed by looking rather than measuring: the panel filled the full
1192px container and read as a section rather than a card offered to someone —
now held to 44rem and centred; and *See the packages* wrapped onto two lines
because its arrow rendered at its intrinsic 24px, fixed by matching the story
section's link rule exactly.

`validate.js` **0** · `qa.js` **0 high, 0 medium** · `a11y.js` **0**.

### 7.1 The guard

`qa.js` **§26** fails when `rewards.json` and the shipped page disagree — a
reward defined but not rendered (someone edited the JSON and did not rebuild, so
it can never be won), a reward rendered but no longer defined (the page is
stale), a missing code, a missing language, or a weight of zero. Proved on all
three shapes.

The collision the bundler caught is worth noting too: `initCopy` already existed
in `contact.js`, and `build.js` flattens modules, so it refused to bundle. The
build was right and the function is now `initCodeCopy`.

---

## 8. What was not changed

No token, no existing component, no page content, no navigation, no hero. Every
value in `reward.css` is an existing token; the buttons are `.c-btn` untouched;
the panel is the surface, hairline and radius a package tier already uses. The
one new visual is a 2px accent line that sweeps once and is gone.
