# X04, first pass — the funnel's own ending, and a claim that was never true

**6 September 2026.** `docs/80` §6 opened X04 with three proposals. This is the
first one worked through, and following it into the code turned up two things
that were not on any list.

---

## 1. The proposal, and where it landed

`docs/80` §2.1 read the reference's hero — a text field beside the button, so
the first thing a visitor can do is the actual first step — and translated it:

> The hero action should be the smallest *real* first step, not a door to one.
> A pre-filled first message is our version of the placeholder.

Checking whether we already did that produced a better finding than the
proposal: **we do, on the deepest page, and not on the main path.**

`/pricing` and the homepage's package blocks carry **sixteen** WhatsApp CTAs,
every one of them built from `pricing.json` with a bilingual, package-specific
opening sentence:

> Hi Pixora — I'm interested in Branding & Design · Starter (from 490 USD,
> one-time).

Meanwhile the primary path — header **Start Your Project**, the hero action,
and the final CTA — all point at `#contact`, and the WhatsApp link waiting
there was bare:

```
href="https://wa.me/249962672192"
```

**The visitor who took the main route got the least help.** Someone who browsed
to a package arrived in WhatsApp with their intent already written; someone who
pressed the biggest button on the site arrived at an empty compose box and had
to start from nothing. That is backwards, and it is the exact gap `docs/80`
§2.1 predicted from the reference — found on our own site rather than argued
from theirs.

### 1.1 The fix, using machinery that already existed

`contact.js` already swaps `[data-wa]` links between `data-wa-en` and
`data-wa-ar` when `<html lang>` changes, and the plain `href` carries the
English form so the link works with JavaScript off. Nothing new was needed —
the contact CTA simply was not using it.

| | |
| --- | --- |
| English | *Hi Pixora — I'd like to start a project.* |
| Arabic | *مرحبًا بيكسورا — أرغب في بدء مشروع.* |

The register matches the sixteen package openers exactly (*"Hi Pixora — "* /
*"مرحبًا بيكسورا — "*), so a visitor who sees both does not meet two different
companies.

It is deliberately one short sentence. A prefill is not a placeholder: the
reference's field holds a *suggestion the visitor replaces*, while this is text
the visitor **sends**. Anything longer or more specific becomes something they
have to delete, which is friction wearing the costume of helpfulness. One true
sentence — they did press *Start Your Project* — and the cursor sits after it.

---

## 2. A safety property that was only ever a comment

Following the contact links into `navigation-map.js` found `CONTACT_CHANNELS`:
a 25-line constant listing all three channels, each with the number to
`display` and the `href` to act on, under this docstring:

> `display` is what the visitor sees and must never be reformatted — the
> numbers are business data. `href` is the action. **Everything that shows a
> channel reads from here, so the visible number and the dialled number cannot
> drift apart.**

**Nothing imported it.** Not one file. The numbers are hand-written in
`index.html`, `accessibility.html`, `privacy.html` and `terms.html`, and the
only thing keeping a displayed number aligned with the number beneath it was
whoever last remembered to edit both.

This is worse than ordinary dead code. Dead code wastes bytes; **this asserted
a guarantee that did not exist**, so anyone reading it would reasonably stop
worrying about the thing it named. The comment was the whole protection.

**Checked before assuming the worst:** every published number on every page was
compared against its own href, and **nothing has drifted.** All four pages
dial what they show. The invariant held — by luck and care, with no mechanism.

---

## 3. The check, replacing the claim

`CONTACT_CHANNELS` is deleted. A constant nobody reads cannot protect anything,
and rewriting the markup to generate from it would be a much larger change than
the risk warrants.

What replaces it is `qa.js` **§19**, which asserts on every *shipped* page:

**(a) Every channel matches the declared truth.** `tel:`, `wa.me` and
`mailto:` links are compared against `site.config.json`. The phone number had
no declared home at all — `contact.whatsapp` and `contact.email` existed,
`contact.phone` did not — so it now has one, and it is checked like the others.

**(b) The number you can read is the number it dials.** Where a link's visible
text contains digits, those digits must match the digits the link acts on.
This is precisely the drift the deleted docstring worried about, now enforced
rather than asserted.

Four details that decide whether the check works:

- **The number is the path, never the query.** A prefill can carry a price —
  *"from 490 USD"* — and counting those digits as the phone number would report
  drift on all sixteen package CTAs. `href.split('?')[0]` first.
- **Both language forms are read**, not just the markup default. An Arabic
  `data-wa-ar` that dialled somewhere else would be invisible to a check that
  only looked at `href`, and it is the form half our visitors get.
- **`innerText`, not `textContent`.** A number hidden from sight is not a
  number a visitor can read, and the `u-visually-hidden` *"(opens in a new
  tab)"* suffixes would otherwise count as visible content.
- **Ends-with, not equals.** A label may legitimately show a number without its
  country code. Requiring equality would fail on correct markup, and a check
  that cries wolf gets switched off.

---

## 4. Proved by breaking it

A check that passes on a clean tree has proved nothing — this project has lost
enough rounds to measurements that measured nothing. So §19 was run against
four deliberate mutations of `dist/index.html`, each one a mistake a person
could actually make:

| Mutation | |
| --- | --- |
| the `wa.me` number in the href | |
| the `tel:` number | |
| the number a visitor **reads**, leaving the href correct | |
| the **Arabic** swap target only, leaving English correct | |

The last two are the ones that matter: they are the failures no previous check
in this file could see, and they are the failures the deleted docstring named.

The harness asserts each mutation actually matched something before running —
an earlier negative test in this project reported success while one of its
three edits silently matched nothing, and a test that skips is worse than no
test because it reports a pass.

Results are recorded in §6 below.

---

## 5. What breaking it actually found — and a false pass I caused

The first negative run came back **3 of 4**, and both halves of that number
were wrong.

### 5.1 The genuine miss: §19 could not see the no-JS link

Mutating the `wa.me` number in the markup did **not** fail the check. Rather
than guess, the hypothesis was tested directly — load the mutated page twice
and count how many anchors still carry the bad number:

```
in the file : bad number PRESENT
JS on       : 0 anchor(s) still carry the bad number in the DOM
JS off      : 1 anchor(s) still carry the bad number in the DOM
```

`contact.js` rewrites every `[data-wa]` href from `data-wa-en` on load. A wrong
number in the markup is **repaired by our own script before a DOM check can
see it** — and repaired only for visitors running JavaScript. With scripts off,
which this site has promised to support since Stage 00, the wrong number is
exactly what the visitor follows.

So the check was reading the one path that could not be broken. §19 now reads
the **served file** as well as the DOM: the markup pass is the no-JS truth, the
DOM pass is the runtime truth, and the two together cover both visitors.

**This is the whole argument for negative tests in one example.** §19 passed on
a clean tree, passed on a mutated tree, and was blind to the failure it was
written to catch. Nothing but breaking it would have shown that.

### 5.2 The false pass, which was mine

The fourth case reported CAUGHT while printing the *third* case's message. It
was not a pass. I had started the negative test in the background and then run
a second, manual reproduction against the same `dist/index.html` while it was
still running — so my snapshot-and-restore wrote one case's mutation back over
another's, and the run reported a finding that belonged to a different case.

Two lessons, both cheap and both mine:

1. **A test that owns a file owns it exclusively.** Nothing else may touch
   `dist/` while a mutation harness is mid-run.
2. **A pass whose evidence does not name the thing being tested is not a
   pass.** The message said *"shows +249 962670000"* under a case that changed
   an Arabic href. The mismatch was visible in the output and is what exposed
   the race.

The suite was rebuilt clean and re-run serially, with a fifth case added:

| Mutation | |
| --- | --- |
| the `wa.me` number in the href | **caught** |
| the `tel:` number | **caught** |
| the number a visitor **reads**, href left correct | **caught** |
| the **Arabic** swap target only | **caught** |
| the `mailto:` address | **caught** |

**5 of 5**, each message naming its own mutation, and `qa` back to 0 high after
restore. The `mailto:` case is caught by the email guard that already existed
rather than by §19 — the two agree instead of duplicating, which is the right
outcome.

---

## 6. Verified

The opener a visitor actually receives, read off the live `href` on three
paths:

```
JS on  / en: Hi Pixora — I'd like to start a project.
JS on  / ar: مرحبًا بيكسورا — أرغب في بدء مشروع.
JS off / en: Hi Pixora — I'd like to start a project.
```

The no-JS path matters most here: it is the one the markup alone has to get
right, and it is the one §5.1 proved nothing was watching.

`build-i18n` clean · `build.js` · `validate.js` **0** · `qa.js` **0 high, 0
medium** · `a11y.js` **0** · dead-CSS held at **91**.

---

## 7. X04's ledger so far

| Reference decision | Verdict | |
| --- | --- | --- |
| Hero action is the first real step | **Adapt** | Done, at the point the funnel actually ends — `docs/80` §2.1 asked for it in the hero; the site's hero already routes to `#contact`, and `#contact` was the bare part |
| Categories named for the outcome | **Borrow, pending B5** | `docs/80` §3.1. Reframes what the buyer sessions ask; not a change to make from one screenshot |
| Headline over the brightest region | **Reject** | `docs/80` §2.3. A bright region cannot be mirrored into safety; bilingual decides it |
| A permanently docked action bar | **Preserve ours** | `docs/80` §3.2. P1-5's scroll-triggered header CTA already banked the value at the right weight for a page you read |

One proposal implemented, one held for the buyer sessions, one rejected with a
reason, one already answered. The remaining X04 work is the section-level
structure, and that genuinely waits on B5.
