# X07 — the motion pass, and the promise that was half true

**6 September 2026.** `docs/69` P3-5. Motion is the one thing `docs/80` could
not read from a screenshot, and the owner answered it in a sentence —
*sections fade up* — which is what this site already does. So this pass is not
about adding motion. It is about whether the motion already here can hurt
anyone.

It can. One finding, and it is a bad one.

---

## 1. What the audit cleared

Two static sweeps, both of which found nothing once checked properly:

**Reduced motion is honoured globally.** Eight component files carry
`animation:` or `transition:` with no `prefers-reduced-motion` block of their
own, and that first read as eight gaps. It is not: `01-reset.css` line 134
carries a universal guard with `!important` on duration, delay **and**
`animation-iteration-count`. Everything is covered, including the orbit's
`26s linear infinite` — iteration count 1 stops it dead. **A finding that
survives only until you look one file further is not a finding**, and this
project has published enough of those.

**Nothing animates a layout property carelessly.** Six transitions name
`inline-size`, `block-size` or `padding-inline-start`. All six are hover or
scroll affordances on single elements, not list-wide effects, and the header's
`block-size` is the one that runs during scroll. Worth knowing; not worth
changing without a measured jank problem, and there is not one.

---

## 2. The finding: content that never comes back

`05-motion.css` opens with this:

> Rule 13: motion must never delay access to content — **if JavaScript fails
> or is disabled, everything is already visible.**

The mechanism is a class. `.js [data-reveal]` sets `opacity: 0`, and the class
is added by an **inline** script in `<head>`. The code that undoes it —
`initReveal()` adding `is-revealed` — lives in **motion.js, a module**.

Those two halves have different failure modes. The inline script cannot fail
to arrive. The module can: a throw anywhere in the import graph, a browser that
chokes on newer syntax, a CSP that blocks it. And when it does, the class is
already set, nothing ever adds `is-revealed`, and the content stays at opacity
zero **for the rest of the visit**.

Measured, with `IntersectionObserver` made to throw on access — a realistic
mid-module failure:

| | |
| --- | --- |
| JavaScript **disabled** | 0 blocks stranded |
| JavaScript **on**, all well | 0 blocks stranded |
| Reduced motion | 0 blocks stranded |
| JavaScript on, module **throws** | **132 blocks stranded, across four pages** |

The homepage hero eyebrow. The whole opening of `/about`. The pricing tiers.
Permanently blank, on a page that looks like it loaded.

**The comment was true about "disabled" and false about "fails", and it is the
same species of defect as `CONTACT_CHANNELS` in `docs/82`:** a durable claim of
safety with no mechanism under it. Two in one day suggests the pattern to watch
for is not bad code, it is confident comments.

---

## 3. The failsafe

The fix keeps the existing gate and adds one inline timer, in the same script
that sets the class — so it cannot fail to arrive either:

```js
setTimeout(function () {
  if (!document.documentElement.hasAttribute('data-motion-ready')) {
    document.documentElement.classList.remove('js');
  }
}, 4000);
```

Dropping the class un-hides everything, because `.js` gates **nothing else**.
That was checked before relying on it: every other `.js` match in the
stylesheets is a filename inside a comment (`navigation.js`, `disclosure.js`).
The class has exactly one job, so revoking it has exactly one effect.

Four seconds is later than any real boot, so a slow connection is never
punished — and if the module arrives afterwards it only adds `is-revealed` to
things already visible, which changes nothing. **The failure mode of the
failsafe is that content is visible and unanimated.** That is the correct
direction to fail in.

---

## 4. Two mistakes on the way, both instructive

### 4.1 The flag that meant "started" instead of "finished"

The first version set `data-motion-ready` on the **first line** of
`initReveal()`, reasoning that every path below it left content visible anyway.
That reasoning was wrong: `new IntersectionObserver` throws on the line after,
so the flag announced ready while the observer never existed — and the failsafe
stood down for precisely the failure it was written for.

132 became **29**, not 0. A partial improvement is the most dangerous test
result there is, because it looks like progress. What gave it away was that the
remainder was the *footer* on every page — a single repeated element, which is
the signature of a mechanism failing, not of content being missed.

The flag now lives in `initMotion()`, **after** `initReveal()` returns. It
means the reveal completed, not that it started.

### 4.2 The safety net with four copies

29 became **4** — one per page, the same footer block. The failsafe had been
written into `index.html`, and `build.js` wraps `src/pages/*` in that shell, so
About, Pricing, Privacy, Terms and Accessibility inherited it.

`story.html`, `styleguide.html` and `404.html` do not. They are root-level
pages that **each author their own `<head>`**. The bootstrap exists four times,
with no single source, and a fix applied to one silently missed three.

That is the same shape as `build-i18n.js` only scanning `index.html`
(`docs/81` §6.2). **Where this project has more than one copy of something, it
has no mechanism to keep them equal** — and the copies are always discovered by
a failure, never by a check.

So this one gets a check.

---

## 5. The guard

`qa.js` **§20**: any shipped page that hides content behind the `js` class must
carry both halves of the failsafe — the timer that drops the class, and the
`setAttribute` that disarms it. Either alone is worse than neither: a timer
with nothing to disarm it would drop the reveal on every single load.

Proved by breaking it, on the two failure shapes that actually occurred:

| Mutation | |
| --- | --- |
| strip the timer from `story.html` — the page that was really missed | **caught** |
| strip the `setAttribute` — a failsafe that can never stand down | **caught** |

**2 of 2**, each naming its own mutation, `qa` back to 0 high after restore.

---

## 6. Verified

Re-run after the fix, all four pages, all four modes:

```
OK  JS off                 0 stranded
OK  JS on, all well        0 stranded
OK  reduced motion         0 stranded
OK  module throws mid-run  0 stranded
```

The last row is the one that read 132 when this document opened.

`validate.js` **0** · `qa.js` **0 high, 0 medium** · `a11y.js` **0** ·
dead-CSS held at **91**.

---

## 7. What X07 does not close

The systematic pass asked two questions and this answers one. **Whether the
motion is right** — the 4-second reveal ladder at 80ms steps, the distance, the
easing, whether *fade up* is the correct gesture for this brand rather than
merely the reference's — is an X04 question that needs the reference numbers
`docs/80` §4 is still waiting on. What is settled is that the motion **cannot
hurt anyone**: it never delays content, never strands it, and stops completely
for anyone who asks it to.
