# Seven real photographs, and a road for the film

**7 September 2026.** The owner uploaded seven images and asked a question
about a video. Both close roadmap items that had been queued since the
redesign began — C1 and C2 in `docs/69` §5.

---

## 1. What arrived

Seven files, `1-1.webp` through `1-7.webp`, dropped into
`src/assets/images/`. Looked at before they were placed, because a caption
written from a filename is a caption that will be wrong:

| Source | What it is |
| --- | --- |
| `1-1` | A gold geometric monogram, embossed on dark textured card |
| `1-2` | Identity on a business card — *Ajwa Flavors* |
| `1-3` | Office signage — *NexTech* |
| `1-4` | A retail interior — *Box Store* |
| `1-5` | An Arabic shopfront sign, wooden, for a bookshop |
| `1-6` | Packaging flat-lay — *Mashhor Foodstuff Trading* |
| `1-7` | A colour palette board — *Teela* |

**All seven are branding work.** Not campaigns, not websites. That decided
where they went: `#work` — *Selected Work* — and not `#campaigns`, which is
a different claim and would have been the easy mistake.

### They went in as derivatives, and the originals stayed

The uploads are 408KB together. Re-encoded at 900px wide, quality 0.72
(`1-6` at 0.50, a busy flat-lay that needed it), they are **204.9KB** — half.
Written as `work-1.webp` … `work-7.webp`; the uploads stay in the repository
untouched, because a derivative you cannot re-derive is a derivative you are
stuck with.

There is no `cwebp`, no ImageMagick and no `sharp` in this container. The
encoding runs through Chromium's canvas — `toDataURL('image/webp', q)` — which
is the same road `docs/86` took.

### Ten placeholders left

`src/assets/placeholders/work-01.svg` … `work-10.svg` are deleted. They were
drawn to hold a shape until there was work to put in it; there is now.

### The gallery went from ten slides to seven

Ten placeholders became **seven real slides**, each with:

- a bilingual `alt` describing what is actually in the photograph
  (`data-alt-en` / `data-alt-ar`, so the swap survives a language change)
- explicit `width`/`height` — no layout shift
- `loading="lazy"`, `decoding="async"`
- a caption numbered `01/07` … `07/07`

**Seven honest slides beat ten with three empty.** Nothing was padded to keep
a round number.

---

## 2. The page budget moved, on purpose

`qa.js` caps a page at what it can weigh. It was 1024KB; the gallery pushed
`index.html` past it.

```js
/* RAISED 7 Sep 2026, 1024KB -> 1200KB, deliberately and in a commit message,
   which is what the note below asks for. … these images ARE the product …
   the first screen stays at ~437KB against its own 480KB budget, untouched. */
const BUDGET = 1200 * 1024;
```

The distinction that made this a raise rather than a leak: **the first-screen
budget did not move.** Nobody waits longer for the page to appear. What got
heavier is a gallery well below the fold, lazy-loaded, and it got heavier
because it stopped being placeholders. Measured after: phone 831KB, desktop
990KB, first screen 444KB of 480KB.

A budget that is raised in a commit message is a decision. A budget that is
raised in a config file nobody reads is a leak. This is the first kind.

---

## 3. The video: 35MB, and why it must not be uploaded

The owner has the reel and asked how to upload it. **It should not be
uploaded**, and there are three separate reasons, any one of which is enough:

1. **GitHub's web uploader refuses anything over 25MB.** A 35MB file cannot
   go through that door at all.
2. **A master in git history is paid for forever.** Git stores every version
   of every file; a 35MB video that is later replaced still costs 35MB on
   every clone, of every developer, for the life of the repository — for
   bytes no visitor ever downloads.
3. **It would not ship anyway.** The site's whole video allowance was 2MB.
   35MB is seventeen times it.

### So the master stays on the machine it was cut on

`tools/build-reel.js` is new, and `npm run reel` is the whole handover:

```
npm run reel -- ~/Desktop/pixora-reel.mov
node build.js && npm run check
```

It writes exactly three files — `reel.webm`, `reel.mp4`, `reel-still.webp` —
into `src/assets/showpiece/`, and **only if they fit the budget**. If they do
not, it deletes both encodes and says what to change. A budget that only
prints a warning is a budget that grows.

Options where the default is not right: `--seconds N` to trim, `--from T` to
start later, `--mute`, `--width W`.

**The budget decides the picture, not the other way around.** A target
bitrate is computed from the budget and the duration, and the frame width is
chosen to suit that bitrate — a ninety-second reel gets a smaller picture than
a thirty-second one, because a 1280-wide picture starved of bits looks worse
than a smaller one with enough. Verified end to end on a synthetic 40s /
108MB master:

```
·  ships      20.0s, 1280px wide, audio 96k
·  budget     6.00MB for the pair -> 1092kbps of video each
·  reel.webm        2957.8KB
·  reel.mp4         1629.1KB
·  reel-still.webp  26.2KB
·  video pair       4.48MB of 6.00MB
```

---

## 4. The video budget was one number doing two jobs

This is the finding, and it was hiding in a check that had never fired.

`qa.js` §7 capped **every video file in `assets/`** at 2MB together. That
number was written for the hero: a loop `hero-film.js` attaches on every wide
screen, which every desktop visitor pays for whether or not they wanted it.
2MB is right for that, and it has not moved.

The showreel is not that. It sits behind `preload="none"` inside a
`<video controls>`: **not one byte is fetched until somebody presses play**,
and somebody who presses play has asked for the file. Weighed against the
hero's number, the reel's allowance was what the hero left over — the hero
pair is 1.6MB, so **350KB**. Sixty seconds in 350KB is about 47kbps. That is
not a reel; it is a warning that something is wrong.

The comment in `index.html` said so plainly and had said so for a day:
*"a replacement reel has roughly 400KB before the check fails."* It read as a
constraint. It was a category error.

### Split, and the pool is read from the markup

```js
const AUTO_BUDGET  = 2 * 1024 * 1024;  // paid by every desktop visitor
const CLICK_BUDGET = 6 * 1024 * 1024;  // paid only by someone who pressed play
```

A file is click-to-play **only if every `<video>` that references it carries
both `controls` and `preload="none"`**. Anything else — attached by script,
autoplaying, or referenced nowhere the parse can see — counts against the
hero. The conservative default is the point: a reel that quietly loses its
`controls` attribute becomes a 6MB autoplay, and this is what notices.

6MB is roughly twenty-five seconds of waiting on a 2Mbps connection. That is
a real cost, and it is why the number is not larger.

### Negative-tested in both directions, because a guard nobody tested is a comment

| Test | Expected | Got |
| --- | --- | --- |
| 3MB `reel.webm` (click-to-play) | passes | passes |
| 3MB `hero.webm` (auto) | **fails** | `hero.webm is 3.0MB, over the 2MB showpiece budget` |
| 7MB `reel.webm` (click-to-play) | **fails** | `reel.webm is 7.0MB, over the 6MB click-to-play budget` |

This project has now shipped a rule that silently did nothing at least ten
separate times. Three minutes of negative testing is the cheapest thing in
the repository.

---

## 5. Two smaller things fixed on the way

**The names are stable now.** The reel was `reel-placeholder.webm` and
`reel-still.svg` — names that become lies the moment real footage lands, and
that would have needed a markup edit to replace. They are `reel.webm`,
`reel.mp4` and `reel-still.webp`; `build-reel.js` overwrites those three and
`index.html` never changes again. A placeholder `.mp4` and `.webp` ship today
so the pair of `<source>` tags is real from the start rather than added later
by someone who has to remember.

**`build.js` was doing `.replace()`, not `.replaceAll()`.** One reference per
showpiece file was true while the reel had a single `<source>`. It now has two
encodes and a poster; a name appearing twice would have had its **second**
reference left pointing into `src/` — a 404 in the built page and nowhere
else. Found by reading the line that was about to be relied on, not by a test.

---

## 6. Where this leaves C1 and C2

| # | Ask | State |
| --- | --- | --- |
| **C1** | A slideshow with real imagery | ✅ **Done.** Seven photographs of real branding work in `#work`, bilingual alt text, captions numbered honestly |
| **C2** | The video | 🟡 **Road built, footage outstanding.** `npm run reel` and a 6MB budget argued for and enforced. The placeholder ships until the owner runs one command |

The verdict in `docs/112` does not move. It is 🟡 MAYBE for one reason and
one only: **no third-party proof.** Seven photographs of the studio's own
work are the studio's own word about the studio's own work. A named client
who says the thing is still the missing piece, and it is still the owner's
to supply.
