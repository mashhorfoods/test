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

2. **Clip B sweeps diagonally, upper-right to lower-left.** That is a reading
   direction, and it is the one thing `docs/52` §3 rules out: mirrored for the
   Arabic hero it reverses, and unmirrored it fights the text. Clip B is not
   usable in either language. Clip A is fine — its motion is a vertical rise
   from a centred source, which is exactly what was asked for.

3. **784×470 is below the 720p spec**, and it is not 16:9 (1.67:1). Upscaling
   soft footage behind text is survivable, but it is a real loss of detail on
   the one asset meant to look expensive.

**What would make them usable**

- A **watermark-free export** of both clips — the paid tier, or whatever the
  tool's licence requires. Not something to remove after the fact.
- A **replacement for B** with no directional sweep. Keep A. The brief for B
  stands as written in section 3: gather to centre, bloom once, release.
- **1280×720 or larger, 16:9**, if the tool offers it.

Clip A alone, looped at 5 s, is a legitimate fallback if B proves difficult —
shorter than the 10 s target but it satisfies every rule.
