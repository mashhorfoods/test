# The four service names, three times in one screen

**6 September 2026.** The owner, reading the Integrated Solutions section:

> I think those two are no needed, no needed for repetition.

They were right, and the count is worse than it looks from the markup.

---

## 1. What was actually on screen

Scrolling that one section, a visitor met the same four service names **three
times without a break**:

| Where | What it showed |
| --- | --- |
| `.c-eco` cards | Branding · Websites · Social Media · Digital Marketing, each with a role line |
| `.c-compare__scatter` | Branding · Websites · Social Media · Marketing & Ads, as four detached boxes |
| `.c-compare__stack` | Branding · Websites · Social Media · Marketing & Ads, as four joined rows |

The ecosystem cards earn their place — they are where the services are
introduced, and each carries a role line and a link. The two lists below them
introduced nothing. They restated the same four nouns twice more so that a
*shape* could make an argument.

---

## 2. What the shape was arguing, and why it stopped working

`value.css` was explicit about the intent:

> THE DEVICE IS A CONTRAST OF ARRANGEMENTS: the same five services, once as
> five detached boxes and once as five rows of one box.

**Five.** The comment says five in three separate places. There are four
services. The list shrank at some point and the layout rule written for five
never followed:

```css
/* The odd one out sits alone on the last row — five things do not divide
   into two columns, and letting that show is the point. */
.c-compare__scatter > li:last-child { grid-column: 1 / -1; }
```

With five items in a two-column grid that rule is a good idea: four pair up,
the fifth sits alone, and the awkwardness *is* the argument. With four items it
is just wrong. Four divide into two columns perfectly — but the rule forces the
fourth full-width anyway, which pushes the third into a half-width box alone on
its own row.

That is exactly what the owner's screenshot shows: **Branding | Websites**,
then **Social Media** stranded in the left column, then **Marketing & Ads**
spanning the full width underneath. It reads as a layout that broke, because it
is one.

So the device was not merely repeating itself. It was repeating itself *and*
arguing a point about awkward division that no longer had the item count to
support it.

---

## 3. What was removed, and what was deliberately kept

**Removed:** both name lists, and the ~60 lines of CSS that styled them
(`.c-compare__scatter`, `.c-compare__stack`, and the continuous accent edge
drawn down the joined list).

**Kept:** the panels, their labels, the `4` / `1` counts, and the three facts
under each:

> **SEPARATE PROVIDERS · 4** — Four briefs to write. Four schedules to align.
> Four sets of files to keep in sync.
>
> **ONE PARTNER · 1** — One brief. One schedule. One set of files.

That contrast repeats nothing. It is also the concrete half of the argument:
the shape said *these are separate*, the facts say *and here is what separate
costs you*. Only the second is information a buyer did not already have from
the cards above.

**What was lost, stated plainly:** the argument is now carried by text rather
than by structure, and the original comment was right that structure mirrors
under RTL for free and needs no colour coding. The facts mirror just as
cleanly — verified below — but the section is one device poorer. That is the
trade, and it is worth making when the device costs eight redundant nouns.

---

## 4. Verified, not assumed

Rendered and read back at 1366×768 and 390×844, in both languages:

- **English desktop** — two panels, 1224×184, equal height, the accent panel
  second.
- **Arabic desktop** — 1224×200 (Arabic leading, expected). The panels mirror:
  *شريك واحد* takes the left with the accent border, *مزوّدون منفصلون* the
  right. The argued-for panel stays second in reading order in both directions,
  which is the thing that had to survive.
- **Phone, both languages** — 342×369, stacked, no overflow.

One thing I got wrong by looking and corrected by measuring: in the rendered
PNG the accent panel's three dashes appeared to be one gold and two grey. They
are not. All three compute to `rgb(244, 209, 63)` at `12px` — a 1px hairline on
a dark ground simply does not survive a downscaled screenshot honestly. **A
screenshot is evidence of layout, not of colour.** Worth remembering; this
project has lost enough rounds to measurements that measured nothing.

`.c-compare__side` is a flex column and `.c-compare__facts` carries
`margin-block-start: auto`, so there was a real risk the facts would bottom-pin
and leave a gap where the lists used to be. Both panels now hold identical
content shapes, so they size to their content and the `auto` margin is inert.
Confirmed by the equal heights above, not by reading the CSS.

`build.js` · `validate.js` **0** · `qa.js` **0 high, 0 medium**. The dead-CSS
count held at 91 — the rules removed were exactly the rules whose markup was
removed, and no new orphan appeared.

---

## 5. If the whole block should go

This removal was the narrow reading of the instruction: the repetition was
named, so the repetition was removed. The panels survive.

The wider reading is available and is one deletion: `.c-eco__hub` immediately
above already says *"One connected digital presence — planned together,
delivered together, and answerable to one team."* If that is judged to cover
the ground, the whole `.c-compare` block can follow the five value pillars that
were deleted from this same section for the same reason. It would cost the four
briefs / one brief contrast, which is the only thing here that quantifies
anything.

Not done, because it was not what was asked.

---

## 6. The wider reading, taken — 6 September 2026

Asked for immediately after section 5 was written: **remove the whole block.**

Done. What went:

| | |
| --- | --- |
| `index.html` | the entire `.c-compare` div — both panels, both labels, both counts, both fact lists |
| `src/styles/components/value.css` | **deleted**, all 131 lines. Every rule in it was `.c-compare*`; nothing else lived there |
| `src/styles/main.css` | its `@import` |
| `src/data/i18n-ar.json` | 9 orphaned translations |

### 6.1 The section is better for it

The ecosystem diagram now runs straight into its own conclusion. Four service
cards, wired to a hub that says *"One connected digital presence — planned
together, delivered together, and answerable to one team."* Then the story
link. That was always the argument; the compare block restated it in a second
grammar and made the reader do the work twice.

Section 3 defended keeping the four-briefs-against-one contrast as the only
thing that quantified anything. That was worth saying and it was overruled on
good grounds: a section that argues its point once, well, beats one that argues
it twice with a number attached.

### 6.2 What the harness caught that I had not

`build-i18n.js` reported one translation matching nothing — **"Marketing &
Ads"** — and it was orphaned by the *previous* commit, not this one. I removed
the two name lists there without re-running the i18n build, so a dead key sat
in the dictionary for one commit.

It needed a second look before deleting, because the string is genuinely still
on `/pricing` — as a heading, and in `pricing.json`. But `build-i18n.js` only
ever scans `index.html`, and `/pricing` carries its Arabic inline and in the
package data. So the key was dead **as dictionary input** while the Arabic it
held survives in two other places. Removed; nothing lost; the harness is silent
again.

**The lesson is the ordering:** `build-i18n.js` is the only thing that knows
whether the dictionary still matches the page, and it has to run *after* markup
is removed, not only after Arabic is added. It was run this time because the
edit touched the JSON. Last time it was not.

One self-inflicted stumble worth recording: the key I removed was the file's
last entry, so deleting its line left a trailing comma and broke the JSON. The
`json.load` assertion caught it on the same run — but only *after* the file had
already been written, so the repo held invalid JSON for one command. **Validate
before writing, not after.**

### 6.3 Verified, not assumed

Rendered at 1366×768 and 390×844 in both languages, and measured with motion
settled rather than mid-flight:

- **The gap the block used to fill is not a hole.** `.c-detail__more` carries
  its own `margin-block-start: 88px`, and the measured hub-to-link distance is
  **88px in both languages** — the element's own margin, nothing collapsed and
  nothing doubled.
- My first measurement said **112px English against 88px Arabic** and that
  difference was not real. It was the reveal animation caught mid-transform in
  one capture and settled in the other. Re-measured under `reducedMotion:
  'reduce'`: identical. **A layout measured during an animation is a
  measurement of the animation.**
- `.c-compare__side` was a flex column whose fact list bottom-pinned with
  `margin-block-start: auto`. That rule is gone with the file, so there is no
  orphaned auto-margin left to strand anything.

`build-i18n` clean · `build.js` · `validate.js` **0** · `qa.js` **0 high, 0
medium** · dead-CSS count **held at 91** — `value.css` never contributed to it,
because every selector in it was live right up until the markup went.
