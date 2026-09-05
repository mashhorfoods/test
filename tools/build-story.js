/* =============================================================================
   BUILD-STORY
   Renders the success story from ONE source: src/data/story.json, into
   story.html between the STORY markers.

   WHY A GENERATOR AND NOT HAND-WRITTEN MARKUP.
   The copy in story.json is every line the page says, in both languages, and
   all of it is quoted from the homepage rather than invented. Keeping it in
   one file means the day a real client case study is approved, the chapters
   are replaced there and this page rebuilds around them — the composition,
   the sketches, the thread and the motion do not know or care which story
   they are carrying.

   THE SKETCH LAYER lives here, not in the JSON, because it is presentation
   rather than content: five drawings that evolve

     scatter -> probe -> sequence -> spine -> resolve

   from four unrelated marks to the connected diagram the homepage already
   publishes. Each one is plain inline SVG — no library, no canvas, no images.

   DRAW-ON uses pathLength="1" on every stroke, which normalises the geometry
   so one CSS rule (dasharray 1, dashoffset 1 -> 0) animates a 12px tick and a
   400px arc identically, with no JavaScript measuring anything.

   Run after changing any chapter:  node tools/build-story.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGE = path.join(ROOT, 'story.html');
const DATA = path.join(ROOT, 'src/data/story.json');

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Both languages ship in the markup and CSS hides the inactive one — the same
   pattern the rest of the site uses, so the page still reads with JavaScript
   off and Arabic stays visible to crawlers. */
const pair = (v) =>
  `<span data-lang-copy="en">${esc(v.en)}</span>`
  + `<span data-lang-copy="ar" lang="ar">${esc(v.ar)}</span>`;

/* A close link can now point at a client's live site rather than back into
   this one. Off-site destinations open in a new tab and say so, which is the
   rule every other external link on this site already follows. */
const OFFSITE = (href) => (/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '');

/* --- The sketch layer ------------------------------------------------------
   Hand-drawn is a matter of the LINE, not a filter: paths that do not quite
   close, corners that overshoot, strokes that vary, groups sitting a degree
   or two off square. Every stroke carries pathLength="1" so the draw-on rule
   is geometry-independent, and --d staggers it so the drawing reads as one
   hand working rather than everything appearing at once.

   Colour is the site's own: strokes inherit currentColor (muted), and the
   accent is used only where the story turns — never decoratively (§20). */

let strokeSeq = 0;
/* s() = one drawn stroke. `a` marks it accent; `dash` leaves it a dashed
   exploratory line rather than a committed one. */
const s = (d, { a = false, dash = false, w = 1.6, delay = null } = {}) => {
  const i = delay === null ? strokeSeq++ : delay;
  return `<path d="${d}" pathLength="1" style="--d:${i}"`
    + ` class="c-sketch__ink${a ? ' c-sketch__ink--accent' : ''}${dash ? ' c-sketch__ink--draft' : ''}"`
    + ` stroke-width="${w}" />`;
};
/* A mark that appears rather than draws: dots, fills, small solids. */
const dot = (cx, cy, r, { a = false, delay = null } = {}) => {
  const i = delay === null ? strokeSeq++ : delay;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" style="--d:${i}"`
    + ` class="c-sketch__mark${a ? ' c-sketch__mark--accent' : ''}" />`;
};

/* A rough rectangle: four strokes that overshoot their corners slightly, the
   way a pen does when the hand is moving faster than it is aiming. */
function roughBox(x, y, w, h, tilt = 0, opts = {}) {
  const j = (n) => n + (Math.round(Math.sin(x + y + n) * 10) / 10) * 0.9;
  const b = [
    s(`M${j(x)} ${y - 1} L${x + w + 1.5} ${j(y)}`, opts),
    s(`M${x + w} ${j(y)} L${j(x + w)} ${y + h + 1.5}`, opts),
    s(`M${x + w + 1} ${y + h} L${j(x)} ${j(y + h)}`, opts),
    s(`M${j(x)} ${y + h + 1} L${x} ${j(y) - 1.5}`, opts),
  ].join('');
  return `<g transform="rotate(${tilt} ${x + w / 2} ${y + h / 2})">${b}</g>`;
}

const SKETCH = {
  /* 01 — SCATTER. Four things, made well, with no relationship to each other.
     Deliberately unresolved: different sizes, different angles, no alignment
     and nothing joining them. */
  scatter: () => roughBox(28, 40, 96, 70, -6)
    + roughBox(196, 22, 78, 58, 5)
    + roughBox(64, 168, 84, 62, 7)
    + roughBox(244, 150, 104, 76, -4)
    // Loose marks: work happening, going nowhere in particular.
    + s('M150 122 l14 -5')
    + s('M188 108 l10 8')
    + s('M120 250 l16 -6')
    + s('M292 66 l8 12'),

  /* 02 — PROBE. The same four boxes, held still, while dashed lines go
     looking for the relationship between them. One arrow commits. */
  probe: () => roughBox(28, 40, 96, 70, -6)
    + roughBox(196, 22, 78, 58, 5)
    + roughBox(64, 168, 84, 62, 7)
    + roughBox(244, 150, 104, 76, -4)
    + s('M126 72 C160 58 172 48 194 50', { dash: true })
    + s('M104 112 C112 148 96 156 108 168', { dash: true })
    + s('M238 82 C258 112 266 128 262 148', { dash: true })
    + s('M150 214 C196 226 224 214 244 198', { dash: true })
    // The line that stops being exploratory.
    + s('M132 104 C176 118 214 120 240 154', { a: true, w: 2 })
    + s('M240 154 l-11 -3 M240 154 l2 -11', { a: true, w: 2 }),

  /* 03 — SEQUENCE. The boxes come into line and take an order. A rough frame
     closes around them: the system is proposed, not yet built. */
  sequence: () => roughBox(26, 108, 72, 62, -2)
    + roughBox(126, 108, 72, 62, 1.5)
    + roughBox(226, 108, 72, 62, -1)
    + roughBox(322, 108, 56, 62, 2)
    + s('M100 139 l22 0 M122 139 l-7 -5 M122 139 l-7 5')
    + s('M200 139 l22 0 M222 139 l-7 -5 M222 139 l-7 5')
    /* The LAST arrow is the accent: this is the chapter where one direction
       stops being one of several and becomes the direction. A whole accent
       frame said the same thing far louder than §20 allows. */
    + s('M300 139 l19 0 M319 139 l-7 -5 M319 139 l-7 5', { a: true, w: 2 })
    // The frame, drawn last and not quite closed — proposed, not yet built.
    + s('M14 92 L388 88')
    + s('M390 92 L388 190')
    + s('M386 188 L16 192')
    + s('M14 190 L14 96'),

  /* 04 — SPINE. Six stages on one line. The hand has stopped searching: the
     strokes are shorter, straighter and evenly spaced, and the drawing starts
     to look like a plan rather than a sketch. */
  spine: () => s('M30 150 L382 150', { w: 2 })
    + [0, 1, 2, 3, 4, 5].map((i) => {
      // Six stages across the line, with the arrowhead kept clear of the
      // last one — before this they overlapped and read as a smudge.
      const x = 52 + i * 56;
      const up = i % 2 === 0;
      const y = up ? 100 : 200;
      return s(`M${x} 150 L${x} ${y}`)
        + s(`M${x - 20} ${y} L${x + 20} ${y + (up ? -2 : 2)}`)
        + dot(x, 150, 3.6, { a: i === 5 });
    }).join('')
    + s('M382 150 l-11 -4 M382 150 l-11 4', { w: 2 })
    + s('M30 150 l0 -9 M30 150 l0 9'),

  /* 05 — RESOLVE. The four marks of the first chapter, in their finished
     arrangement: the hub-and-spokes diagram the homepage already publishes.
     Clean geometry, one accent, nothing left exploratory. */
  resolve: () => {
    const cx = 200; const cy = 150; const r = 96;
    const nodes = [0, 1, 2, 3].map((i) => {
      const t = (-90 + i * 90) * (Math.PI / 180);
      return [Math.round((cx + Math.cos(t) * r) * 10) / 10,
        Math.round((cy + Math.sin(t) * r) * 10) / 10];
    });
    /* A spoke JOINS two things; it does not cross them. Each one now starts
       outside the hub circle and stops at the near edge of its box, which is
       the difference between a diagram and a scribble over one. */
    return nodes.map(([x, y]) => {
      const dx = x - cx; const dy = y - cy;
      const len = Math.hypot(dx, dy);
      const ux = dx / len; const uy = dy / len;
      const from = 38;                       // just clear of the hub circle
      const to = len - (Math.abs(ux) > 0.5 ? 34 : 24); // clear of the box edge
      const r2 = (n) => Math.round(n * 10) / 10;
      return s(`M${r2(cx + ux * from)} ${r2(cy + uy * from)} `
        + `L${r2(cx + ux * to)} ${r2(cy + uy * to)}`, { w: 1.4 });
    }).join('')
      + nodes.map(([x, y]) => roughBox(x - 30, y - 20, 60, 40, 0)).join('')
      + s(`M${cx - 34} ${cy} a34 34 0 0 1 68 0 a34 34 0 0 1 -68 0`, { a: true, w: 2 })
      + dot(cx, cy, 5, { a: true });
  },
};

/* The connector between two chapters. §10 asks that a chapter end in the mark
   the next one starts from, so this is a real drawn line rather than a rule:
   it leaves the chapter above, changes its mind once, and arrives pointing at
   the chapter below. */
/* THE THREAD (§09, §10).
   One line, four appearances, and it is not the same line each time. It
   leaves Chapter 01 wandering — two changes of mind in a short distance —
   and arrives at Chapter 05 straight, certain and in the accent. The reader
   does not have to notice this for it to work; they only have to feel that
   the story is getting surer of itself.

   `wander` is how far the line strays from true, in viewBox units. It goes
   18 -> 11 -> 5 -> 0. */
const THREAD = [
  { wander: 18, accent: false },
  { wander: 11, accent: false },
  { wander: 5, accent: false },
  { wander: 0, accent: true },
];

function connector(i) {
  const t = THREAD[i] || THREAD[THREAD.length - 1];
  const w = t.wander;
  const cls = t.accent ? ' c-sketch__ink--accent' : '';
  const width = t.accent ? 2 : 1.6;
  /* Straight when wander is 0 — a bezier with no deflection is a line, but
     writing it as one keeps the final stroke honestly simple. */
  const path = w === 0
    ? 'M30 0 L30 126'
    : `M30 0 C30 30 ${30 - w} 40 ${30 - w} 62 C${30 - w} 88 ${30 + w * 0.8} 96 30 126`;
  return `<svg class="c-chapter__thread${t.accent ? ' c-chapter__thread--resolved' : ''}"
        viewBox="0 0 60 136" fill="none" aria-hidden="true" focusable="false"
        preserveAspectRatio="xMidYMid meet">
        <path d="${path}" pathLength="1" class="c-sketch__ink${cls}"
          stroke-width="${width}" style="--d:0" />
        <path d="M30 126 l-6 -9 M30 126 l7 -8" pathLength="1"
          class="c-sketch__ink${cls}" stroke-width="${width}" style="--d:1" />
      </svg>`;
}

/* --- Chapters -------------------------------------------------------------- */

const NUM = (i) => String(i + 1).padStart(2, '0');

/* The sketch is never the only carrier of meaning (§25). Each figure gets a
   description that says what the drawing SHOWS, so the story survives with
   images off, in a screen reader, and under reduced motion. */
const FIGURE_ALT = {
  scatter: {
    en: 'Four separate boxes, tilted at different angles with nothing joining them.',
    ar: 'أربعة مربعات منفصلة، مائلة بزوايا مختلفة ولا شيء يربط بينها.',
  },
  probe: {
    en: 'The same four boxes, with dashed lines searching between them and one solid arrow connecting two of them.',
    ar: 'المربعات الأربعة نفسها، وخطوط متقطعة تبحث بينها، وسهم واحد متصل يربط اثنين منها.',
  },
  sequence: {
    en: 'The four boxes aligned in a row, joined by arrows, with a frame drawn around the whole set.',
    ar: 'المربعات الأربعة مصطفّة في سطر واحد، تربطها أسهم، ويحيط بها إطار مرسوم.',
  },
  spine: {
    en: 'A single horizontal line carrying six evenly spaced markers, alternating above and below it.',
    ar: 'خط أفقي واحد يحمل ست علامات متساوية التباعد، تتناوب فوقه وتحته.',
  },
  resolve: {
    en: 'Four boxes arranged around a central hub, each joined to it by a spoke.',
    ar: 'أربعة مربعات مرتّبة حول مركز واحد، يصل كلٌّ منها به خط.',
  },
};

/* THE WORK ITSELF, beside the drawing of it.

   Until 5 September 2026 this page carried five schematic sketches and no
   photograph of anything delivered — a case study about visual identity work
   showing none of it (`docs/50` Part 5). The four deliverables are now in the
   repository, and each sits in the chapter that describes it.

   The sketches STAY. They are not placeholders that the photographs replace:
   the sketch carries the argument (four boxes searching for each other, then
   aligned) and the photograph carries the artefact. They answer different
   questions and `docs/50` Part 5 argued for keeping both.

   Alt text is written per image in `story.json`, in both languages, and
   describes what is in the picture rather than naming it — a screen reader
   user should learn what the mark looks like, not that a mark exists. */
/* Natural size, read off the file. Two things depend on it: the browser can
   reserve the right box before the bytes arrive (no layout shift), and the
   image can be stopped from being displayed LARGER than it is. The campaign
   sheet is 900px wide and the desktop column is 1192 — without this it was
   upscaled 1.32x and went soft. */
function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = b.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
  if (fourcc === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (fourcc === 'VP8L') {
    const n = b.readUInt32LE(21);
    return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function deliverables(c) {
  if (!Array.isArray(c.deliverable) || c.deliverable.length === 0) return '';
  return `          <div class="c-chapter__work">
${c.deliverable.map((d) => {
    const size = webpSize(path.join(ROOT, d.src.replace(/^\.\//, '')));
    const dims = size ? ` width="${size.w}" height="${size.h}"` : '';
    const cap = size ? ` style="max-inline-size:min(100%, ${size.w}px)"` : '';
    return `            <figure class="c-work">
              <img class="c-work__image" src="${esc(d.src)}" alt="${esc(d.alt.en)}"
                data-alt-en="${esc(d.alt.en)}" data-alt-ar="${esc(d.alt.ar)}"${dims}${cap}
                loading="lazy" decoding="async" />
            </figure>`;
  }).join('\n')}
          </div>`;
}


function renderChapter(c, i, last) {

  strokeSeq = 0; // restart the stagger for each drawing
  const art = SKETCH[c.sketch]();
  return `        <article class="c-chapter" id="story-${c.id}"
          aria-labelledby="ch-${c.id}-title" data-chapter="${NUM(i)}">
          <div class="c-chapter__text">
            <p class="c-chapter__meta">
              <span class="c-chapter__num" aria-hidden="true">${NUM(i)}</span>
              <span class="c-chapter__annotation">${pair(c.annotation)}</span>
            </p>
            <h2 class="c-chapter__title" id="ch-${c.id}-title">${pair(c.title)}</h2>
            <p class="c-chapter__lead">${pair(c.lead)}</p>
            <p class="c-chapter__aside">${pair(c.aside)}</p>
          </div>

          <figure class="c-chapter__figure">
            <svg class="c-sketch" viewBox="0 0 400 300" fill="none"
              role="img" aria-labelledby="ch-${c.id}-alt"
              preserveAspectRatio="xMidYMid meet">
              <title id="ch-${c.id}-alt">${esc(FIGURE_ALT[c.sketch].en)}</title>
              ${art}
            </svg>
            <figcaption class="u-visually-hidden">${pair(FIGURE_ALT[c.sketch])}</figcaption>
          </figure>
${deliverables(c)}
        </article>
${last ? '' : `
        <div class="c-chapter__joint" aria-hidden="true">
          ${connector(i)}
        </div>
`}`;
}

const block = `<!-- STORY:START -->
      <header class="c-story__head">
        <p class="t-label c-story__eyebrow">${pair(data.eyebrow)}</p>
        <h1 class="c-story__title">${pair(data.title)}</h1>
        <p class="c-story__standfirst t-body-lg">${pair(data.standfirst)}</p>
      </header>

      <div class="c-story__chapters">
${data.chapters.map((c, i) => renderChapter(c, i, i === data.chapters.length - 1)).join('\n')}
      </div>

      <footer class="c-story__close">
        <p class="c-story__statement">${pair(data.close.statement)}</p>
        <a class="c-link c-story__link" href="${esc(data.close.href)}"${OFFSITE(data.close.href)}>
          ${pair(data.close.link)}${OFFSITE(data.close.href) ? '<span class="u-visually-hidden"> (opens in a new tab)</span>' : ''}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="u-flip-rtl">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2"
              stroke-linecap="square" fill="none" />
          </svg>
        </a>
      </footer>
      <!-- STORY:END -->`;

let html = fs.readFileSync(PAGE, 'utf8');
const before = html;
if (!html.includes('<!-- STORY:START -->') || !html.includes('<!-- STORY:END -->')) {
  throw new Error('story markers not found in story.html');
}
html = html.replace(/<!-- STORY:START -->[\s\S]*?<!-- STORY:END -->/, () => block);
fs.writeFileSync(PAGE, html);

console.log(html === before ? 'story markup already up to date' : 'story markup updated');
console.log(`  ${data.chapters.length} chapters, ${data.chapters.length - 1} connectors`);
console.log(`  source -> src/data/story.json`);
