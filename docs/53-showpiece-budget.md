# The showpiece budget — WEBSTART X, X05 decision

**Decided 4 September 2026.** Of the three positions costed in `docs/52` §5,
the owner chose the middle one: **one budgeted showpiece.**

---

## 1. The decision in one line

> The desktop visitor, who is browsing, gets the showpiece. The phone visitor,
> on mobile data in Riyadh or Cairo, gets a fast page and a still frame.

Not a compromise between the other two positions — a different claim. The
reference sites spend their weight on every visitor equally. This spends it
only where bandwidth is cheap and the screen is big enough to deserve it.

## 2. The numbers

> **Section 9 amends this table**, 7 September 2026. The numbers below still
> govern the hero — the thing every desktop visitor is given whether they
> asked for it or not. They were also, until that date, the only numbers, and
> they were being applied to a second video of an entirely different kind.
> Read §9 before quoting any figure here.

| Rule | Limit | Why this number |
| --- | --- | --- |
| Showpieces that ship | **1** | Singular. A second one is a library. *(Amended §9: one AUTOMATIC showpiece. A click-to-play film is a different kind of cost)* |
| Encodings of it | **2** | WebM/VP9 and MP4/H.264. Each visitor downloads exactly one |
| Weight per visitor | **≤ 2.0 MB** | 12 seconds at 720p, no audio. Today: 43 KB WebM, 156 KB MP4 |
| Format | **WebM first, MP4 second** | Everything that can take WebM should — a third of the size. Safari and iOS fall through to the MP4 |
| Audio track | **none** | It is never heard, and it is ~15% of the bytes |
| Dimensions | **≤ 1280×720** | It sits behind or beside text. Nobody inspects it |
| Loop length | **12 s** | Long enough that a visitor does not catch it repeating |
| Phone (≤ 767px) | **0 bytes of video** | The hard rule. The phone gets the poster, and nothing else |
| Desktop requests added | **≤ 2** | Poster, then video. The page itself stays one request |

## 3. The markup rules

Every one of these is enforced by `tools/qa.js` (section 7), so they cannot
quietly stop being true:

- **A still is required** — either a `poster` attribute or an `<img>` painted
  beneath the video. Without one the hero is a blank rectangle until the first
  frame decodes, on the element whose whole job is the first impression. This
  hero uses the `<img>` form, which is the stronger of the two: it renders
  before the video element is parsed and it survives a failed video entirely.
- **`preload="none"`.** Otherwise every visitor pays for the video whether or
  not they scroll to it, which spends the budget on people who never see it.
- **`muted` with any `autoplay`.** An unmuted autoplay is blocked by every
  browser, and deserves to be.
- **`playsinline`.** Without it iOS takes the video fullscreen, hijacking the
  page.
- **No `.mov` ships.** It is an editing format. If one appears in `assets/`,
  someone dragged a file from a timeline into the build.

## 4. How it degrades, deliberately

| Condition | What the visitor gets |
| --- | --- |
| Desktop, fast connection | Poster, then the loop begins |
| **Phone, any connection** | Poster only. No video is requested at all |
| `prefers-reduced-motion` | Poster only, on every width. The 23 existing guards already establish this contract |
| JavaScript disabled | Poster only. The site's progressive-enhancement rule is not suspended for decoration |
| Video fails to load | Poster stays. Nothing about the layout moves |

Every row lands on the poster. **The poster is the design; the video is the
enhancement** — which is the only arrangement where a hero cannot break.

## 5. Arabic

The showpiece is subject to the RTL finding in `docs/52` §3, and this is where
it stops being theoretical:

- If the composition anchors the video to one side, that side **flips** in
  Arabic. Check that the flipped version is still composed, not merely mirrored.
- Motion inside the footage that travels left-to-right reads as *backwards* to
  an Arabic reader. Either shoot it neutral — vertical, radial, or ambient
  motion with no directional sweep — or produce a mirrored cut.

**Neutral footage is the cheaper answer**, and it is one file rather than two,
which the budget above already requires.

## 6. What is still open

**The PixVerse recording**, per `docs/52` §4 — desktop and phone, full scroll.
The budget says what the showpiece may *cost* and section 7 says what was
built; X03 says what it should *be*, and that has still not been analysed. What
ships today is a defensible answer to the brief, not a considered response to
the reference.

**Not open, and worth recording as closed:** the Al Mada footage. Their four
files were never uploaded, and their identity is not ours to reconstruct from a
description. Pixora's own identity is also the better subject — a hero should
say who *we* are, and Al Mada have not yet replied to the mail asking them to
review the page that already carries their name.

## 7. Built — and what the second encoding is really for

Wired into the hero on 4 September 2026: `src/showpiece/scene.html` renders to
`hero.webm` + `hero.mp4`, `src/scripts/hero-film.js` attaches one of them, and
`build.js` carries them into `dist/assets/`. Measured: **43 KB** on the visitor
who takes the WebM, **156 KB** on the one who takes the MP4 — 2% and 8% of the
budget. The still is 7 KB and inlined, so it costs no request at all.

**The MP4 is for Safari. The WebM is for the harness.** Playwright's Chromium
ships without proprietary codecs, so an MP4-only hero could never be played in
any check we run — the first version of this was requested, silently failed to
decode, and looked identical to a working one from the outside. A showpiece
nothing can test is a showpiece that breaks quietly. Now `qa.js` and a
desktop-width check both watch a video that actually plays.

**Two things about the footage changed when it met the hero.** It had carried
the PIXORA wordmark and four service cards; both came out. The headline already
says the name and the sections already name the services, so the film was
repeating the page — and baked-in English labels cannot be translated, which
would have handed the Arabic reader a picture of the other language. Type in a
hero belongs in the DOM: selectable, translatable, readable aloud. The film
carries atmosphere only, and that is a rule, not a preference.


---

## 8. Current footage: the generated clips, watermark and all — 4 September 2026

The hero now plays **the owner's own clips**, A and B, joined by
`tools/build-hero-from-clips.js`. 878 KB MP4, 720 KB WebM, 43% of budget.

**The watermark is on screen, deliberately.** On a free tier it is the licence
condition, so leaving it visible is honouring the terms rather than working
around them — which was the only objection to using this footage. It sits
top-left, faintly, behind the headline. Watermark-free exports replace it with
one command and nothing else changes:

```
node tools/build-hero-from-clips.js clipA.mp4 clipB.mp4
```

**Not mirrored, and that was a correction.** `--mirror` was passed on the first
attempt on the assumption the footage was bright-left. It is not: clip B's beam
already runs to the right, so mirroring put the brightest part of the frame
straight through the headline and the lead paragraph, and flipped the watermark
into mirror-writing on the way. The originals are already dark-left. The rule
still stands — ship it dark side left — it was the reading of *this* footage
that was wrong, not the rule.

**The drawn scene is not deleted.** `src/showpiece/scene.html` and
`tools/build-showpiece.js` remain, and `node tools/build-showpiece.js` puts the
three-act canvas film back. Two hero films, one command apart, and the choice
stays open.

---

## 9. The budget was one number doing two jobs — 7 September 2026

**Amends §2.** `docs/114`, and the finding is worth stating plainly because
the check had been passing the whole time.

`qa.js` §7 capped **every video file in `assets/`** at 2 MB together. That
number was written for the hero and it is the right number for the hero:
`hero-film.js` attaches the loop on every wide screen, so every desktop
visitor pays for it whether or not they wanted it. Nothing about that has
changed.

**The showreel is not that.** It sits behind `preload="none"` inside a
`<video controls>`. Not one byte is fetched until somebody presses play, and
somebody who presses play has asked for the file. Weighed against the hero's
number, its whole allowance was what the hero left over — the hero pair is
1.6 MB, so **≈350 KB**. Sixty seconds in 350 KB is about 47 kbps. That is not
a reel; it is a warning that something is wrong.

The comment in `index.html` stated the constraint plainly and had done for a
day: *"a replacement reel has roughly 400KB before the check fails."* It read
as a budget. It was a category error — two different kinds of cost held by one
number.

### Two budgets

| | Limit | Who pays it |
| --- | --- | --- |
| **Automatic** — `AUTO_BUDGET` | **2 MB** | Every desktop visitor, unasked. The hero loop. Unchanged |
| **Click-to-play** — `CLICK_BUDGET` | **6 MB** | Only someone who pressed play. The showreel pair |

6 MB is roughly twenty-five seconds of waiting on a 2 Mbps connection before
playback can start. That is a real cost, and it is why the number is not
larger.

### Which pool a file is in is read from the markup, not from its name

A file is click-to-play **only if every `<video>` that references it carries
both `controls` and `preload="none"`**. Anything else — attached by script,
autoplaying, or referenced nowhere the parse can see — counts against the
hero. The conservative default is the point: a reel that quietly loses its
`controls` attribute becomes a 6 MB autoplay, and this is what notices.

Negative-tested in both directions, because a guard nobody tested is a comment:

| Test | Expected | Got |
| --- | --- | --- |
| 3 MB `reel.webm` (click-to-play) | passes | passes |
| 3 MB `hero.webm` (automatic) | **fails** | `hero.webm is 3.0MB, over the 2MB showpiece budget` |
| 7 MB `reel.webm` (click-to-play) | **fails** | `reel.webm is 7.0MB, over the 6MB click-to-play budget` |

### Three §2 rules do not apply to the click-to-play pool

- **"Audio track: none."** Right for a hero that plays itself; wrong for a
  film somebody chose to watch. `build-reel.js` keeps audio by default and
  reserves 96 kbps for it. `--mute` is there for when it is not wanted.
- **"Showpieces that ship: 1."** Two now ship. They are not two of the same
  thing: one is given, one is asked for.
- **"Dimensions ≤ 1280×720"** still holds, but is now a ceiling rather than a
  target — the width is chosen from the bitrate the budget affords, and never
  exceeds the source's own.

### The master never enters the repository

`tools/build-reel.js` — `npm run reel -- <master>` — encodes any export into
`reel.webm`, `reel.mp4` and `reel-still.webp`, and **refuses to write if the
pair does not fit**, deleting both encodes rather than shipping one over. The
budget decides the picture: bitrate from budget and duration, width chosen to
suit the bitrate.

A 35 MB master must not be uploaded, for three separate reasons, any one
sufficient: GitHub's web uploader refuses anything over 25 MB; a master in git
history is paid for on every clone forever for bytes no visitor downloads; and
it is seventeen times a budget it could never meet.

### The file names are stable now

`reel-placeholder.webm` and `reel-still.svg` became lies the moment real
footage landed, and replacing them would have needed a markup edit. The three
names are **`reel.webm`, `reel.mp4`, `reel-still.webp`**, a placeholder of
each ships today so the `<source>` pair is real from the start, and
`index.html` never changes again.
