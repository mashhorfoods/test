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

| Rule | Limit | Why this number |
| --- | --- | --- |
| Showpieces that ship | **1** | Singular. A second one is a library |
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
