# The case study, checked against the deliverables

Written 5 September 2026. The four Al Mada deliverables arrived — `docs/69`
B2b — and this is the first time anything in chapter 05 could be checked
against the work it describes rather than against memory.

**Three claims could not be verified before. Two hold exactly. One does not,
and it is the opening sentence.**

---

## 1. What arrived

| | Deliverable | What it shows |
| --- | --- | --- |
| 1 | **Campaign set** | Five Umrah offer posters — `عروض العمرة`, 13 days, 9 nights Makkah / 4 Madinah, 3200 and 3400 SAR, `احجز الآن`, two phone numbers |
| 2 | **Brand identity sheet** | Logo construction, six-colour palette with hex values, Cairo in bold and regular, six icons, brand elements, brand DNA |
| 3 | **Company profile** | Three-panel brochure, `رحلتك تبدأ مع شريك تثق به`, dated 2026 |
| 4 | **Website** | Desktop, tablet and phone, Arabic RTL, `رحلتك تبدأ بثقة` on the hero |

**They are not lost.** `docs/57` §2 recorded them as *"already lost once… pasted
into chat, never uploaded"*. They exist. What remains is getting them into the
repository — see §4.

## 2. What the deliverables confirm

Chapter 02, *"The flight path draws the letter"*, claims the mark is not an
aeroplane beside a name — that **the flight path forms the M, inside a circle,
"movement inside completeness."**

The brand sheet's own LOGO CONSTRUCTION panel lists, in its own words:

> **Letter M** — Formed by the flight path
> **Circle** — Completeness & Global trust
> **Airplane** — Travel, Movement & Experience
> **Flight Path** — Journey, Flow & Connection

**Confirmed, to the word.** The case study was describing the deliverable
accurately.

Chapter 03, *"Not a logo. A kit that survives the next designer"*, claims **six
colours with their values written down**, from primary blue through deep navy
to the light grey that carries text; **Cairo in bold and regular**; and **six
icons — explore, book…**

The sheet shows exactly six swatches — `#0A4FB7` Primary Blue, `#06357A` Deep
Navy, `#2C7BE5` Bright Blue, `#7CB7FF` Soft Sky Blue, `#20242A` Dark Text,
`#E9EEF5` Light Gray — Cairo in Bold and Regular, and exactly six icons:
Explore, Book, Travel, Destination, Experience, Support.

**Confirmed, including both counts and the order of the colours named.**

Chapter 04's quoted hero promise, **`رحلتك تبدأ بثقة`**, appears on the website
mockup exactly as quoted. **Confirmed.**

## 3. What they contradict — chapter 01's opening sentence

> *"Al Mada Travel & Tourism Agency books Umrah journeys and travel packages
> **for Saudi customers**."*
> `تحجز وكالة المدى للسفر والسياحة رحلات العمرة وبرامج السفر **لعملاء في السعودية**`

**The campaign artwork routes every offer between Port Sudan and Jeddah.**

Each poster carries the same line, in both directions:

> `تذاكر الطيران ذهاباً وإياباً` — **بورتسودان ← جدة** · **جدة ← بورتسودان**

and a second variant priced at 3200 rather than 3400 reads
`تذاكر الباخرة ذهاباً وإياباً` — **the ferry**, not the flight.

So the campaign we designed sells **Umrah packages departing from Sudan**, by
air at 3400 SAR or by sea at 3200, to an agency reachable on Saudi numbers
(`+966`). Whatever the precise customer base is, *"for Saudi customers"* does
not describe it — and `docs/48` F1 named this exact sentence as **"the sentence
the whole chapter's argument rests on."**

**This is not a translation problem.** Both languages say the same wrong thing.

**APPLIED 5 September 2026:** the clause is now removed from both languages —
`"books Umrah journeys and travel packages."` / `تحجز وكالة المدى للسفر
والسياحة رحلات العمرة وبرامج السفر.` — and `F2a` is open for the real answer.

**Removed rather than rewritten, deliberately.** The right sentence depends on a fact only
Al Mada can give: whether these are Sudanese pilgrims travelling from Port
Sudan, Sudanese residents in Saudi Arabia, or both. Guessing a second time
would repeat the error rather than fix it. **It goes into the open message as
`F2a`**, and until it is answered the sentence should be softened rather than
re-specified — *"books Umrah journeys and travel packages"* is true with no
customer claim attached, and costs the chapter nothing.

### And a quotation to re-check — F3

`docs/48` F3 flagged that chapter 04 quotes six section names read **from the
deliverable, not the live site**, and warned: *"The marks are the promise; if
the site now says «عن المدى» the quote is false."*

The website deliverable's navigation reads, right to left:

> `الرئيسية` · `من نحن` · **`لماذا وكالة المدى؟`** · `خدماتنا` · `كيف نعمل` ·
> `رؤيتنا ورسالتنا` · `قيمنا` · `تواصل معنا`

Two differences from what chapter 04 carries:

1. We quote **«لماذا المدى»**; the deliverable reads **«لماذا وكالة المدى؟»** —
   with `وكالة` and a question mark.
2. The deliverable has **eight** items, including `رؤيتنا ورسالتنا`, which our
   six do not mention.

Read off a mockup at small size, so **medium confidence rather than high** —
but it is the second time this quotation has failed a check, and F3 was already
open. **APPLIED:** chapter 04's Arabic now paraphrases — *من هم، ولماذا هم، وماذا
يقدّمون، وكيف يعملون، وما الذي يؤمنون به، وكيف يُتواصل معهم* — as the English
always did. **The hero promise stays in quotation marks**, because it was
verified to the character.

Every remaining quotation on the Arabic story page is now either the brand name
`«المدى»` or that verified promise. F3 is retired by removing the risk rather
than by confirming the fact, which is the better outcome: a quotation nobody
could verify should not have been in quotation marks.

## 4. Getting the files into the repository

I can see these images; I cannot write them. They arrived as pictures in the
conversation, not as files on disk, so **the four originals still exist only
where they were before.**

The route that needs no terminal, from a phone, is the one `docs/63` already
chose as the dashboard:

1. Open the repository on GitHub, `src/assets/images/`.
2. **Add file → Upload files.** Drag the four in.
3. Name them `al-mada-identity.*`, `al-mada-campaign.*`, `al-mada-profile.*`,
   `al-mada-website.*`.
4. Commit to `claude/webstart-project-audit-l7est2`.

CI will classify it, run the three harnesses and rebuild `dist/`. **Any
resolution beats none** — originals are better, but a screenshot is not
nothing, and `docs/57` §2's "backed up nowhere" ends the moment they are in
the repository, which is mirrored to two remotes since A2.

Once they land, placing them is small: `story.json` carries a `sketch` per
chapter, and a photograph beside it is a schema addition rather than a layout
change. **The five SVG sketches stay** — `docs/50` Part 5 argued they are good
and deliberate, and the deliverables sit alongside them as the artefact the
sketches abstract.
