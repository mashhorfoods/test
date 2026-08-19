/* =============================================================================
   BUILD-I18N
   Replaces every `data-i18n-pending` element with the bilingual span pair the
   rest of the page already uses, from src/data/i18n-ar.json.

   WHY IN THE MARKUP RATHER THAN AT RUNTIME.
   Both languages ship in the document and CSS hides the inactive one
   (03-base.css). That is the pattern the supplied Arabic already used, and it
   is the only one that satisfies two rules this site has held since Stage 00:
   the page must work with JavaScript disabled, and both languages must be
   readable by a crawler. A runtime string swap fails the first and hides the
   Arabic from the second.

   KEYED BY THE ENGLISH TEXT, normalised to single spaces. A value may be an
   HTML fragment: the headlines carry <br> and an accent <span>, and the Arabic
   has to carry the same structure or the two-tone headline breaks in one
   language.

   ANYTHING MISSING IS REPORTED. A string with no translation keeps its
   `data-i18n-pending` marker — which typesets it as an LTR island so its
   punctuation still renders correctly — and is listed on stdout. Silence
   would let the page ship half-translated without anyone noticing.

   Run after editing the JSON:  node tools/build-i18n.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const DATA = path.join(ROOT, 'src/data/i18n-ar.json');

const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const AR = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_')));

/* Balanced scan: a <span> inside a <span> is real here (the orbit labels), and
   a non-greedy regex closes on the inner tag and truncates the label. */
function* pending(html) {
  const open = /<([a-z0-9]+)((?:[^>"]|"[^"]*")*?)>/g;
  let m;
  while ((m = open.exec(html))) {
    const [, tag, attrs] = m;
    if (!/\bdata-i18n-pending\b/.test(attrs)) continue;
    const step = new RegExp(`<${tag}\\b(?:[^>"]|"[^"]*")*?>|</${tag}>`, 'g');
    step.lastIndex = m.index + m[0].length;
    let depth = 1;
    let s;
    while (depth && (s = step.exec(html))) depth += s[0][1] === '/' ? -1 : 1;
    if (depth) continue;
    yield {
      start: m.index,
      end: step.lastIndex,
      tag,
      attrs,
      inner: html.slice(m.index + m[0].length, step.lastIndex - `</${tag}>`.length),
    };
  }
}

const norm = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

let html = fs.readFileSync(HTML, 'utf8');
const missing = new Set();
let done = 0;

// Right to left, so earlier offsets stay valid as the string is rewritten.
const hits = [...pending(html)].reverse();
for (const el of hits) {
  const key = norm(el.inner);
  if (!key) continue;
  const ar = AR[key];
  if (!ar) { missing.add(key); continue; }

  // `lang` on the Arabic span so a screen reader switches voice, and so the
  // Arabic font stack applies to it in either document direction.
  const en = el.inner.trim();
  const pair = `<span data-lang-copy="en">${en}</span>`
    + `<span data-lang-copy="ar" lang="ar">${ar}</span>`;
  const attrs = el.attrs.replace(/\s*\bdata-i18n-pending\b/, '');
  html = html.slice(0, el.start)
    + `<${el.tag}${attrs}>${pair}</${el.tag}>`
    + html.slice(el.end);
  done += 1;
}

fs.writeFileSync(HTML, html);

console.log(`i18n: ${done} element(s) now carry both languages`);
if (missing.size) {
  console.log(`\n  ! ${missing.size} string(s) have no Arabic and still ship English only:`);
  [...missing].forEach((k) => console.log(`      ${k.slice(0, 96)}`));
  console.log(`\n    Add them to src/data/i18n-ar.json and re-run.`);
} else {
  console.log('  every translatable string on the page has Arabic');
}

const unused = Object.keys(AR).filter((k) => !html.includes(`>${AR[k]}</span>`));
if (unused.length) {
  console.log(`\n  ! ${unused.length} translation(s) in the JSON matched nothing on the page:`);
  unused.forEach((k) => console.log(`      ${k.slice(0, 96)}`));
}
