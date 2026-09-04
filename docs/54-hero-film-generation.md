# Generating the hero film — two 5-second clips

For a generated hero loop replacing the CSS-rendered one. The owner's tool
produces 5 s per generation, so the 10 s loop is two clips joined.

---

## 1. The constraints these prompts are built around

Every one of these comes from a decision already made and enforced elsewhere.
A clip that breaks one is not usable, however good it looks.

| Constraint | Why | Enforced by |
| --- | --- | --- |
| **No text, letterforms or logos** | Baked-in words cannot be translated. The Arabic reader would get a picture of English | `docs/53` §7 |
| **No people, no faces** | The site publishes nothing it cannot stand behind. A stock human in the hero of a studio with one person is a lie in the first screen | `docs/30` PS-01 |
| **No left-to-right sweep** | Direction is meaning. A sweep that reads forward in English reads backwards in Arabic | `docs/52` §3 |
| **Charcoal ground, one warm accent** | The site has exactly one accent. A second hue in the hero breaks the whole palette | `src/styles/02-tokens.css` |
| **Nothing bright in the left third** | The headline lives there. The film is atmosphere, never competition | `hero-film.css` |
| **No concentric rings** | The orbit diagram beside it is already circles. Two ring systems merge and read as neither — this is the mistake version A made | `docs/53` §7 |
| **Loops seamlessly** | It plays forever behind the hero. A visible seam is worse than no film | this document, §4 |
| **≤ 2 MB after encoding** | The budget. Photographic footage is far heavier than the CSS render — see §5 | `tools/qa.js` §7 |

## 2. The shared style block

**Prepend this to both prompts**, unchanged. It is what makes two separate
generations look like one film.

```
Style: cinematic abstract motion graphics, extreme dark background (#0D0F12
near-black charcoal), single warm golden accent (#F4D13F) and nothing else.
Volumetric haze, shallow depth of field, fine film grain. Locked-off camera,
no camera movement, no cuts. Slow, calm, weightless motion. Photoreal light
behaviour, not illustration. 16:9, no text, no letters, no numbers, no logos,
no people, no hands, no faces, no products, no UI, no watermark.
```

## 3. The two prompts

### Clip A — 0 to 5 s · "drift"

```
[paste the shared style block first]

Scene: an endless dark volume. Hundreds of very fine golden particles, like
slow dust in a light shaft, drift gently upward from the bottom of the frame.
They are small, sparse and unevenly spaced. A faint warm glow sits deep in the
centre of the frame and slowly brightens, lighting the haze around it. Far
behind everything, an almost invisible dark grid recedes into depth.

Motion: strictly vertical rise, very slow, no horizontal drift, no swirling,
no rotation. The frame begins almost empty and ends almost empty.

Density: sparse. The left third of the frame stays darkest and emptiest.
```

### Clip B — 5 to 10 s · "gather and release"

```
[paste the shared style block first]

Scene: the same endless dark volume, the same fine golden particles still
rising. The particles slowly converge toward a single soft point of warm light
in the centre-right of the frame. The point brightens gently, blooms once
without flaring, then releases — the particles scatter softly outward and
resume their slow upward drift, and the frame returns to near-darkness.

Motion: vertical rise plus a slow inward gather to centre-right, then a gentle
outward release. No rotation, no swirl, no camera move, no flash, no lens
flare.

Density: sparse at the start, briefly denser at the bloom, sparse again at the
end. The left third of the frame stays darkest and emptiest throughout.
```

### Negative prompt, if the tool takes one

```
text, letters, words, numbers, logo, watermark, signature, subtitles, UI,
interface, people, person, face, hands, product, phone, laptop, city,
landscape, water, fire, smoke plume, lens flare, rainbow colours, blue, red,
green, purple, teal, saturated colours, fast motion, camera shake, zoom,
pan, whip pan, cuts, strobe, flicker, concentric rings, circles, spirals
```

## 4. The join, and why both clips end where A begins

The two clips become one loop: **A → B → A → B**, forever. So there are two
seams, not one, and both must be invisible:

- **A ends → B begins.** Both are "sparse particles rising in near-darkness".
- **B ends → A begins.** B's release returns to that same sparse near-darkness.

That is why both prompts say *begins almost empty, ends almost empty*. The rest
state is the glue. Generate for that rest state above all — a clip that ends
mid-bloom cannot be used no matter how good the middle is.

**Generate 2–3 takes of each** and send them all. Picking the pair that meets
cleanly matters more than picking the two best clips individually.

## 5. What happens after they arrive — and the honest warning

Send the files as they come out of the tool, unedited, un-trimmed, no audio
needed. Then:

1. Colour-matched to the site's charcoal and accent, so the two clips agree.
2. Joined, with a short cross-dissolve at each seam if the rest states do not
   already meet cleanly.
3. Encoded to WebM/VP9 and MP4/H.264, then measured against the budget.
4. A poster frame chosen from the calmest instant — remember every phone,
   reduced-motion and no-JS visitor sees **only** that frame.

**The warning: photographic footage is far heavier than the current render.**
The CSS film is 35 KB because it is flat colour and hard edges. Ten seconds of
grainy volumetric haze at 720p will not be. Expect 800 KB – 2 MB, and possibly
over — grain and haze are the two things video codecs handle worst.

If it does not fit, the options in order of preference: raise CRF until it
does, drop to 20 fps (the motion is slow, nobody will see it), shorten the loop
back to 8 s, or reduce to 960×540 — it sits behind text at low opacity, and
nobody inspects it. **The budget does not move.** That was the decision.

---

## 6. Review of the first generation — 4 September 2026

Two clips arrived, `vida.mp4` and `vidb.mp4`: 5.03 s each, **784×470**, 30 fps.
Graded and composited behind the hero to judge them (test render only, not
committed).

**The direction is right.** Warm dust in a dark volume, lit from a single
source, reads as considerably richer than the CSS film — premium rather than
decorative. Encoded weight is not a problem either: the graded 5 s test came to
251 KB at 720p, so a 10 s loop lands near 500 KB, well inside the 2 MB budget.
The earlier warning about photographic footage was too pessimistic for material
this dark.

**Three things block using them as they are.**

1. **A "Pika" watermark, top-left, on both clips.** Two separate problems in
   one mark. It is another company's logo on our hero — and it is *text*, which
   section 1 rules out because it cannot be translated. It also sits exactly
   where the headline sits. Removing it is not ours to decide: on a free tier
   the watermark is usually the price of the export, so stripping it is a
   licence question, not an editing one. The test render blurred it with
   `delogo` purely to judge the footage, and **the smudge is visible in the
   result** — a grey patch beside "Your Brand". Even if it were permitted, it
   would not look clean.

2. ~~**Clip B sweeps diagonally and is unusable.**~~ **Withdrawn — B is
   usable.** I read the rule as "footage must have no direction", which would
   have thrown away half the material for nothing. The rule's actual purpose is
   that motion must not fight the reading direction, and the page already
   solves that: the whole layout mirrors at `[dir="rtl"]`, so the film mirrors
   with it. `hero-film.css` now flips both the still and the loop, which costs
   nothing — no second file, no extra bytes, one `scaleX(-1)`.

   It only works because the footage carries no text; mirrored words are the
   one thing that cannot be un-read. So the no-text rule is what makes the
   direction rule solvable, rather than a second restriction on top of it.

   **Which way round to author the file:** ship it **dark side left**. In
   English the headline is on the left and lands on that dark half; in Arabic
   both layout and film mirror, and the dark half lands on the right where the
   Arabic headline now is. `--mirror` flips footage that arrives the wrong way
   round. Get this backwards and the film is right in exactly one language,
   which is worse than no film — it will look considered in whichever one you
   happen to be reviewing.

3. **784×470 is below the 720p spec**, and it is not 16:9 (1.67:1). Upscaling
   soft footage behind text is survivable, but it is a real loss of detail on
   the one asset meant to look expensive.

**What would make them usable — one thing, not three**

- A **watermark-free export** of both clips. The paid tier, or whatever the
  licence requires. Not something to remove after the fact.
- 1280×720 or larger would be better, but is **not** a blocker.

That is the whole list now. B is usable, and the pair has been assembled end to
end as a test to prove it.

## 7. The assembly, proved on the watermarked clips

`tools/build-hero-from-clips.js` takes the clips and produces the shipped
files. Run on A and B (watermark blurred, test only, not committed):

```
hero: 2 clip(s) -> 8.88s loop @ 25fps, 1280x720
  hero.mp4         871KB
  hero.webm        713KB
  worst case per visitor: 871KB of 2048KB (43%)
```

**Both seams are invisible.** A→B is one cross-fade; the loop point is the
harder one, and it is the one that makes a hero look cheap when it is wrong —
it happens on every repeat, forever. The tool closes it by fading the tail onto
the **head** and dropping the overlap, so the file's last frame runs into its
own first. Checked frame by frame: end and start are indistinguishable.

10.08 s of source becomes an **8.88 s loop** — two 0.6 s overlaps are spent on
the two joins. That is the cost of seamlessness, and it is worth it.

**One caveat on the grade.** The tool pulls the footage onto the site's ground:
blacks toward `#0D0F12`, contrast eased, saturation down so only the warm
accent survives, plus the same scrim the CSS film has baked in. Generated
footage that arrives close to the brief barely moves; this pair arrived bright,
so it moves a long way. That is recoverable, but footage generated darker to
begin with will always look better than footage darkened afterwards.

---

## 8. Drawn instead — the decision, 4 September 2026

The generated clips are not being used. Not because they were bad: **the look
was right, and this scene is a deliberate reconstruction of it** — a light
shaft in a dark volume, warm dust suspended in the beam, a pool where it lands.

The watermark is why. On a free tier it is the licence condition, so removing
it — blur, patch, or a crop framed to exclude it — is circumventing that, and
that is the owner's decision to make with their account rather than an editing
step. And it failed on its own terms too: `delogo` left a grey smudge beside
the headline, a patch reads as a dead rectangle on a moving grainy plate, and
cropping it out costs 37% of the width or 30% of the height of footage already
below 720p.

**Drawing it removes the question rather than answering it.**

| | Generated | Drawn |
| --- | --- | --- |
| Licence | A watermark, or a subscription | None. It is ours |
| Resolution | 784×470, upscaled | Any size, sharp, re-renders at 4K if wanted |
| Weight | 871 KB worst case | **657 KB MP4 / 211 KB WebM** |
| Changing it | Re-generate, re-download, hope | Edit a number, re-run one command |
| Seam | Two cross-fades hide two joins | No seam exists — see below |

**Seamless by construction rather than by cross-fade.** Every motion is
periodic with exactly the loop length: each particle rises a whole number of
times per loop, every sway and pulse is a sine of an integer multiple of
`t / LOOP`. There is nothing to hide, because the last frame is the frame
before the first. That is strictly better than fading a tail onto a head, which
is a repair.

**Deterministic more strictly than the CSS version was.** Every particle's
position is a function of time — nothing accumulates, no frame depends on the
one before it — and the only randomness is a seeded generator. `Math.random()`
would have made every build a different film and the budget check meaningless.

**Dark side left, and now proved.** The light sits at 62% across, so the left
third stays darkest for the English headline; `hero-film.css` mirrors it at
`[dir="rtl"]` and the dark half lands on the right for the Arabic one.
Verified in both: `transform: matrix(-1, 0, 0, 1, 0, 0)` on the Arabic view,
with the bright half behind the orbit and the headline on clean ground.

**What the generated clips were still worth.** They set the direction — this
scene would not exist without them — and `tools/build-hero-from-clips.js`
remains, working and proven. If a watermark-free export ever arrives, it is one
command, and the two approaches can be compared honestly.
