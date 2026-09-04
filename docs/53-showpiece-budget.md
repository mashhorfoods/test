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
| Video files that ship | **1** | "Showpiece", singular. A second one is a library |
| Total video weight | **≤ 2.0 MB** | About 8 seconds at 720p, H.264, no audio. Two seconds on a slow 4G connection |
| Format | **MP4 / H.264** | One file that plays everywhere beats two files and an extra request |
| Audio track | **none** | It is never heard, and it is ~15% of the bytes |
| Dimensions | **≤ 1280×720** | It sits behind or beside text. Nobody inspects it |
| Loop length | **6–10 s** | Long enough not to feel like a GIF, short enough to stay in budget |
| Phone (≤ 767px) | **0 bytes of video** | The hard rule. The phone gets the poster, and nothing else |
| Desktop requests added | **≤ 2** | Poster, then video. The page itself stays one request |

## 3. The markup rules

Every one of these is enforced by `tools/qa.js` (section 7), so they cannot
quietly stop being true:

- **`poster` is required.** Without it the hero is a blank rectangle until the
  first frame decodes — the worst possible first impression, on the element
  whose whole job is the first impression.
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

## 6. What is still needed before this can be built

1. **The footage.** Nothing in `assets/` is a candidate. Either the owner
   supplies it, or we decide what it shows — the strongest option, and the one
   the reference sites all use, is *the studio's own work moving*: the Al Mada
   identity assembling, the campaign set cycling.
2. **The PixVerse recording**, per `docs/52` §4 — desktop and phone, full
   scroll. The budget says what the showpiece may cost; X03 says what it should
   *be*, and that still has not been analysed.

## 7. Status

Budget decided and enforced. The check passes vacuously today, because no
video ships — which is exactly when a budget should be written, rather than on
the day someone notices the phone build got heavy.
