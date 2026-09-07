# One image on /about, and the three that were not used

**6 September 2026.** Four files supplied, three distinct images, one used.

---

## 1. What arrived

| File | What it is |
| --- | --- |
| `about1.webp` 88KB | **Light, warm** — a man at a laptop, a visible face, team panels and a globe around him |
| `about2.webp` 39KB | Isometric — a glowing core on a platform, five workstations linked by light |
| `about3.webp` 39KB | **The same isometric.** Different bytes, same picture |
| `about4.webp` 57KB | **Dark** — a figure seen from behind, headphones, the same globe-and-panels device |

All four are 1672×940. Mapped by rendering them, not by the order they were
sent — the filenames did not follow it.

**One thing checked before it became a finding.** `about1` has an **X** on the
laptop lid, the mug and a card. On any other week that would be another
company's mark on our page, the same problem as the hero watermark. It is not:
`src/assets/brand/logo.svg` describes itself as *"the accent letterform from the
PIXORA wordmark"*, and the header sets **PI·X·ORA** with the X in accent yellow.
**The X is ours.**

---

## 2. What was used, and why that one

**`about1`, once, between the lead and the first heading.**

The page had no visual at all — a title, a lead, four prose sections. Its job is
to make a studio run by one person feel like a person you can deal with; the
page says so directly:

> *"You deal with the person doing the work, not an account manager relaying
> messages to someone you never meet."*

**So the picture that helps is one with a face in it.** `about4` matches the
site's palette better and is the handsomer image, but its subject is seen from
behind, faceless, in the dark — atmospheric, and the precise opposite of what
this page claims. `about1` is the warmer and the less on-palette choice, and it
is the one that argues the page's own point.

Placed **before** the prose rather than inside it, so it sets the tone and then
gets out of the way. One image on a 4.6-screenful page of considered text; three
would have made it a slideshow with captions.

### 2.1 What the isometric is for, and it is not this

`about2` argues *systems* — a core, five stations, light between them. That is
the homepage's Integrated Solutions idea, not About's. And the homepage already
draws that argument with the ecosystem diagram, which is native, bilingual and
weighs nothing.

**Left unused rather than placed somewhere it half-fits.** It is in the
repository if a portfolio or a services page ever wants it.

---

## 3. Said plainly

These are **illustrations, not photographs of the studio.** They show the idea
of working across distance; they do not show Muhalab. That is a real difference
on a page whose argument is *you are dealing with this specific person* — a
portrait would still do more than any illustration can, and the offer stands.

`about1` earns its place because a human face, even an illustrated one, does
more for that argument than an empty page does. It is not the strongest version
of it.

---

## 4. Verified

| | Desktop | Phone |
| --- | --- | --- |
| Displayed | 1224×689 | 342×193 |
| Natural | 1672×940 | 1672×940 |
| **Upscaled** | **no** | **no** |

Never displayed above its natural width — stretching a 1672px source past
itself is how the Al Mada campaign sheet came out soft (`docs/76`), and
`max-inline-size: min(100%, 1672px)` stops it.

- **Bilingual alt**, swapped at runtime like every other image on the site.
  Arabic confirmed on the `dir="rtl"` render.
- `width`/`height` on the tag, so the space is reserved before the bytes land
  and the text below does not jump.
- 88KB — over the 12KB inline limit, so it is **copied to `dist/assets` and
  cached once for the site** rather than inlined into the page. Confirmed
  present at 90,226 bytes and referenced as `./assets/about1.webp`.
- A hairline border and the surface colour beneath it, because the image
  carries its own light ground and an unbordered edge reads as a hole cut in a
  dark page — the same treatment `.c-work__image` and `.c-gallery__image` take.

`validate.js` **0** · `qa.js` **0 high, 0 medium** · `a11y.js` **0**.
