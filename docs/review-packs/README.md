# The four review pages — source

The briefs each reviewer is sent are **published pages**, not markdown files,
because a markdown file is not a thing you can send to a lawyer. This folder is
their source. It was written into the repository on 8 September 2026, after a
container reclaim would have left the published pages as the only copy.

| | Reviewer | Source | Page |
| --- | --- | --- | --- |
| **B3** | An Arabic speaker | `b3-body.html` | [Does the Arabic Sound Right](https://claude.ai/code/artifact/9ff29617-95eb-44f5-90f5-d3c09909d8a2) |
| **B4** | A lawyer | `b4-body.html` | [Pixora Terms Review](https://claude.ai/code/artifact/73fcd882-7995-4c55-8c05-f2e174bbaa58) |
| **B5** | The moderator | `b5-body.html` | [Five Buyer Sessions](https://claude.ai/code/artifact/39267b95-0bcc-4fd5-93b8-c6eef64f2cd1) |
| **B6** | A screen-reader user | `b6-body.html` | [Forty Minutes with VoiceOver](https://claude.ai/code/artifact/a12d0fb9-a405-4b60-88d2-56dbf5bd9eed) |

**Four pages, not one.** Sending a lawyer a link that also contains the buyer
sessions is the wrong document; each person sees only their own brief.

---

## Editing one

```
node docs/review-packs/assemble.js
```

That inlines `_base.css` and the font links into each `bN-body.html` and writes
`bN.html` beside it. Then republish that file to **the same artifact URL** —
publishing without the URL creates a second page and the reviewer's link goes
stale.

`bN.html` is derived and is deliberately **not** committed, on the same split
the site itself uses: the thing you edit is the source, the thing you ship is
built from it.

---

## Two things this folder is not

**It is not part of the site.** No build reads `docs/`. `build.js`,
`build-pages.js` and `build-zip.js` all work from `index.html` and `src/`, and
`qa.js`'s stylesheet scan is rooted at `src/styles` — so nothing here can reach
`dist/`, the upload archive, or a visitor.

**It is not the working brief.** `docs/90`, `docs/91`, `docs/117` and
`docs/118` remain the source of the questions, and they keep the internal
reasoning and the provenance appendices that were deliberately stripped from
the pages. **The two are not linked**: change a question in the doc, change it
here, and republish, or you have a brief that disagrees with itself.

---

## Why they look the way they do

One system across all four, because they come from one studio: Archivo for
display, IBM Plex Sans for reading, IBM Plex Mono for the labels, and **IBM
Plex Sans Arabic** — the sibling of the body face — for the Arabic strings
under review, each wrapped in `<bdi dir="rtl">` so a right-to-left phrase
quoted mid-English-sentence renders the way it does on the site rather than the
way a text editor guesses.

The structural device is the priority chip in the left rail, and it encodes
something true: every one of these briefs ranks its own sections by
cost-if-wrong and says so — *work down from section 02*, *read this one first*,
*one participant is enough to make this a defect*.

Three-column tables carry `class="stack"` and a `data-label` on every cell.
Below 34em the rows become blocks and each cell states its own column name,
because at 375px a three-column table gave the five-task sheet six lines per
column — on the one page that is read mid-session with a participant waiting.
