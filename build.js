#!/usr/bin/env node
/**
 * BUILD — collapse the site into a single self-contained page.
 *
 *   node build.js
 *   → dist/index.html      (one file: no CSS, JS, font or icon requests)
 *   → dist/styleguide.html
 *
 * What it does:
 *   - resolves the @import chain in main.css, preserving the @layer order
 *   - embeds every woff2 the CSS references as a data: URI
 *   - bundles the ES modules into one inline <script type="module">
 *   - embeds the favicon as a data: URI
 *   - strips the now-redundant <link>/<script src> tags
 *
 * No dependencies, no build tooling. The modular source under src/ stays the
 * thing you edit; this is a deployment artifact, so re-run it after changes.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const ASSETS_DIR = path.join(DIST, 'assets');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* ------------------------------------------------------------------ CSS -- */

/**
 * Inline the @import chain depth-first, in source order, so the cascade the
 * layer statement declares is preserved exactly.
 */
function inlineCss(entry, seen = new Set()) {
  const abs = path.normalize(entry);
  if (seen.has(abs)) return ''; // an @import of an already-included file is a no-op
  seen.add(abs);

  const dir = path.dirname(abs);
  return read(abs).replace(
    /@import\s+url\(\s*["']([^"']+)["']\s*\)\s*;/g,
    (_, href) => {
      const target = path.normalize(path.join(dir, href));
      return `\n/* ---- ${target} ---- */\n${inlineCss(target, seen)}`;
    }
  );
}

/** Replace url(../assets/fonts/x.woff2) with the file as a data: URI. */
/* Parse a `unicode-range` value into [lo, hi] pairs. */
function parseRange(value) {
  return value.split(',').map((part) => {
    const t = part.trim().replace(/^u\+/i, '');
    if (t.includes('-')) {
      const [a, b] = t.split('-');
      return [parseInt(a, 16), parseInt(b, 16)];
    }
    if (t.includes('?')) {
      return [parseInt(t.replace(/\?/g, '0'), 16), parseInt(t.replace(/\?/g, 'F'), 16)];
    }
    const n = parseInt(t, 16);
    return [n, n];
  });
}

/**
 * Inline the font faces the document can actually use, and DROP the rest.
 *
 * In the modular source `unicode-range` does this for free: the browser
 * fetches a subset only when a character in its range appears. Inlining
 * defeats that — every face becomes bytes in the document whether or not a
 * single glyph of it is ever drawn. This site ships four latin-ext Poppins
 * faces covering accented European characters that appear NOWHERE in the copy,
 * in either language: 21.3KB of woff2, and about 28KB once base64 has inflated
 * it by a third.
 *
 * So the range is tested against the document's own character set and a face
 * with zero coverage is removed entirely. This is self-correcting: write a
 * word with an accent and the face comes back on the next build.
 */
function embedFonts(css, chars) {
  let count = 0;
  let bytes = 0;
  let dropped = 0;
  let droppedBytes = 0;

  // Split into @font-face blocks so a face can be removed whole.
  const out = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    const url = block.match(/url\(\s*["']?([^"')]+\.woff2)["']?\s*\)/);
    if (!url) return block;
    const file = path.join(ROOT, 'src/assets', url[1].replace(/^(\.\.\/)+assets\//, ''));
    const buf = fs.readFileSync(file);

    const range = block.match(/unicode-range:\s*([^;}]+)/i);
    if (range && chars) {
      const spans = parseRange(range[1]);
      const used = [...chars].some(cp => spans.some(([lo, hi]) => cp >= lo && cp <= hi));
      if (!used) {
        dropped += 1;
        droppedBytes += buf.length;
        return '';
      }
    }

    count += 1;
    bytes += buf.length;
    return block.replace(/url\(\s*["']?[^"')]+\.woff2["']?\s*\)/,
      `url(data:font/woff2;base64,${buf.toString('base64')})`);
  });

  return { css: out, count, bytes, dropped, droppedBytes };
}

/* --------------------------------------------------------------- MINIFY -- */

/**
 * Comments are this project's documentation and they stay in the source. They
 * have no business in the artifact a visitor downloads: 88KB of CSS comment
 * and 14KB of JS comment were shipping to every reader.
 *
 * Conservative on purpose. CSS comment-stripping is done AFTER data: URIs are
 * lifted out, because base64 uses `/` and `+` and can therefore contain a
 * literal `/*` that would open a comment and eat the rest of the stylesheet.
 * JS strips block comments only — `//` appears inside `https://` and inside
 * regex literals, and a minifier that has to parse JS properly is a bigger
 * dependency than this build is willing to take.
 */
function minifyCss(css) {
  const blobs = [];
  let s = css.replace(/url\(data:[^)]*\)/g, (m) => `url(__BLOB${blobs.push(m) - 1}__)`);
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n');
  s = s.replace(/\s*([{};,>])\s*/g, '$1');
  s = s.replace(/;\}/g, '}');
  s = s.replace(/:\s+/g, ':');
  s = s.replace(/__BLOB(\d+)__/g, (_, i) => blobs[Number(i)].slice(4, -1));
  return s.trim();
}

function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\n/gm, '')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

/* ------------------------------------------------------------------- JS -- */

/**
 * A minimal ESM bundler for this project's small, known module graph:
 * resolve imports depth-first, strip the import/export syntax, concatenate.
 *
 * It is deliberately strict — a duplicate top-level binding across modules
 * would silently break once they share a scope, so that is a hard error
 * rather than something to discover at runtime.
 */
function bundleJs(entry, seen = new Set(), bindings = new Map()) {
  const abs = path.normalize(entry);
  if (seen.has(abs)) return '';
  seen.add(abs);

  let src = read(abs);
  const dir = path.dirname(abs);
  const deps = [];

  // Pull in dependencies first, then drop the import statements.
  src = src.replace(
    /^\s*import\s+[^;]*?from\s+["']([^"']+)["']\s*;?\s*$/gm,
    (_, spec) => {
      if (spec.startsWith('.')) deps.push(path.normalize(path.join(dir, spec)));
      return '';
    }
  );

  // `export function x` / `export const x` -> plain declarations.
  src = src.replace(/^\s*export\s+(?=(async\s+)?(function|const|let|class))/gm, '');
  // Bare `export { ... };` re-export lists have no meaning once flattened.
  src = src.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');

  for (const name of src.matchAll(
    /^(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm
  )) {
    const [, id] = name;
    if (bindings.has(id) && bindings.get(id) !== abs) {
      throw new Error(
        `Duplicate top-level binding "${id}" in ${abs} and ${bindings.get(id)}. ` +
          `Flattening the modules would collide — rename one before bundling.`
      );
    }
    bindings.set(id, abs);
  }

  const head = deps.map((d) => bundleJs(d, seen, bindings)).join('\n');
  return `${head}\n/* ---- ${abs} ---- */\n${src.trim()}\n`;
}

/* ----------------------------------------------------------------- HTML -- */

function buildPage(file) {
  let html = read(file);
  const stats = { css: 0, fonts: 0, fontBytes: 0, js: 0,
    images: 0, imageBytes: 0, imagesMissing: [], imagesRemote: [],
    imagesCopied: [], imageCopiedBytes: 0 };

  /* Every code point the document can render, in either language — the input
     to the font-coverage test below. Script and style are excluded: a base64
     blob is not text anyone reads. */
  const chars = new Set(
    [...html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ')]
      .map(c => c.codePointAt(0))
  );
  // Strings the scripts inject are rendered too, so they count.
  for (const c of read('src/scripts/navigation-map.js')) chars.add(c.codePointAt(0));

  // --- stylesheets -> one inline <style>, in document order ---------------
  const sheets = [...html.matchAll(/[ \t]*<link rel="stylesheet" href="\.\/([^"]+)"[^>]*>\n?/g)];
  if (sheets.length) {
    let css = '';
    for (const [, href] of sheets) css += `\n/* ===== ${href} ===== */\n` + inlineCss(href);
    const embedded = embedFonts(css, chars);
    stats.fonts = embedded.count;
    stats.fontBytes = embedded.bytes;
    stats.fontsDropped = embedded.dropped;
    stats.fontBytesDropped = embedded.droppedBytes;
    const min = minifyCss(embedded.css);
    stats.cssRaw = embedded.css.length;
    stats.css = min.length;
    html = html.replace(sheets[0][0], `    <style>${min}</style>\n`);
    for (const [tag] of sheets.slice(1)) html = html.replace(tag, '');
  }

  // --- font preloads are pointless once the bytes are in the document -----
  html = html.replace(/[ \t]*<link\s+rel="preload"[\s\S]*?\/>\n?/g, '');

  /* --- favicon -> data: URI -----------------------------------------------
     ANY local rel="icon", not one hardcoded path. The first version matched
     exactly src/assets/brand/logo.svg, so when two later pages were authored
     against a filename that did not exist, their links passed through
     untouched and shipped — a build that only handles the path it was written
     against is a build that hides mistakes. */
  html = html.replace(/rel="icon"([^>]*?)href="\.\/([^"]+)"/g, (whole, mid, p) => {
    if (!fs.existsSync(path.join(ROOT, p))) {
      faviconMissing.push(p);
      return whole;
    }
    const svg = read(p);
    return `rel="icon"${mid}href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"`;
  });

  /* --- apple-touch-icon -> a REAL FILE in dist/assets/ ---------------------
     The one link that must NOT be inlined. Safari ignores a data: URI in
     rel="apple-touch-icon" entirely — it does not fail loudly, it just falls
     back to a screenshot of the page — and Safari is the only reader this
     link exists for. So it is copied, whatever its size, and the size budget
     that governs <img> deliberately does not apply.

     Matched on the rel, not on a path, for the same reason the favicon rule
     is: a build that only handles the filename it was written against is a
     build that hides a page authored against a different one. */
  html = html.replace(/rel="apple-touch-icon"([^>]*?)href="\.\/([^"]+)"/g, (whole, mid, p) => {
    const abs = path.join(ROOT, p);
    if (!fs.existsSync(abs)) { touchIconMissing.push(p); return whole; }
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    const name = path.basename(abs);
    fs.copyFileSync(abs, path.join(ASSETS_DIR, name));
    return `rel="apple-touch-icon"${mid}href="./assets/${name}"`;
  });

  // --- <img> -> data: URI, when the file is ours ---------------------------
  // A LOCAL image becomes bytes in the document like everything else. A REMOTE
  // one cannot: this build has no business fetching third-party hosts, and a
  // hotlink would still be a hotlink after inlining. So it is left alone AND
  // reported, because the whole promise of this file is that it opens from
  // disk with no network — a silently remote <img> would break that promise
  // without anyone noticing.
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
                 gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' };

  /* A SIZE BUDGET, not a rule about origin.
     Inlining is worth it for the assets that would otherwise cost a round trip
     for a few kilobytes — the favicon, a diagram. It is NOT worth it for
     photographic work: twelve panels inlined as base64 would add megabytes to
     EVERY page, on a site whose whole argument is that it is light. Above the
     limit an image is copied into dist/assets/ instead and referenced from
     there: same origin, cached separately, downloaded once for the whole site
     rather than re-sent with every page. */
  const INLINE_LIMIT = 12 * 1024;
  const ASSETS = ASSETS_DIR;

  html = html.replace(/src="(\.\/[^"]+\.(?:png|jpe?g|gif|svg|webp))"/gi, (m, rel) => {
    const abs = path.join(ROOT, rel.slice(2));
    if (!fs.existsSync(abs)) { stats.imagesMissing.push(rel); return m; }
    const buf = fs.readFileSync(abs);
    const ext = rel.split('.').pop().toLowerCase();

    if (buf.length > INLINE_LIMIT) {
      fs.mkdirSync(ASSETS, { recursive: true });
      const name = path.basename(abs);
      fs.writeFileSync(path.join(ASSETS, name), buf);
      stats.imagesCopied.push(name);
      stats.imageCopiedBytes += buf.length;
      return `src="./assets/${name}"`;
    }

    stats.images += 1;
    stats.imageBytes += buf.length;
    return `src="data:${MIME[ext] || 'application/octet-stream'};base64,${buf.toString('base64')}"`;
  });
  stats.imagesRemote = [...html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/gi)].map(m => m[1]);

  // --- module graph -> one inline module ----------------------------------
  html = html.replace(
    /[ \t]*<script type="module" src="\.\/([^"]+)"><\/script>/,
    (_, src) => {
      // A literal `</script>` anywhere in the source — even inside a comment,
      // as main.js has in its usage note — ends the inline <script> element
      // as far as the HTML parser is concerned, silently truncating the
      // bundle. Escaping the slash keeps it inert while reading the same.
      const js = minifyJs(bundleJs(src)).replace(/<\/script/gi, '<\\/script');
      stats.js = js.length;
      // Wrapped so the flattened top-level bindings never touch globals.
      return `    <script type="module">\n(() => {\n${js}\n})();\n    </script>`;
    }
  );

  return { html, stats };
}

/* ------------------------------------------------------- CONTENT FIRST -- */
/* The generators that own the markup, run before it is read.

   They used to be four separate commands to remember after editing a data
   file, and forgetting one shipped a page that disagreed with its own source:
   a price in pricing.json that the cards did not show. The owner maintains
   this site personally (docs/36-technical-and-data.md), so the number of
   commands to remember is now ONE. Each is idempotent and says whether it
   changed anything.

   Order matters: pricing and i18n write index.html, story writes story.html,
   and pages reads the finished index.html as its shell. */
console.log('— content —');
require('./tools/build-pricing.js');
require('./tools/build-i18n.js');
require('./tools/build-story.js');
require('./tools/build-pages.js');
console.log('');

/* ------------------------------------------------------------------ run -- */

fs.mkdirSync(DIST, { recursive: true });

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

let remote = [];
const faviconMissing = [];
const touchIconMissing = [];
let missing = [];
for (const page of ['index.html', 'styleguide.html', 'story.html', 'about.html', 'pricing.html', 'privacy.html', 'terms.html', '404.html']) {
  const { html, stats } = buildPage(page);
  const out = path.join(DIST, page);
  fs.writeFileSync(out, html);
  remote = remote.concat(stats.imagesRemote);
  missing = missing.concat(stats.imagesMissing);
  console.log(
    `${page.padEnd(16)} -> dist/${page}  ${kb(Buffer.byteLength(html))}  ` +
      `(css ${kb(stats.css)}, js ${kb(stats.js)}, ${stats.fonts} fonts ${kb(stats.fontBytes)}` +
      `${stats.images ? `, ${stats.images} images ${kb(stats.imageBytes)}` : ''})` +
      `${stats.fontsDropped ? `\n${' '.repeat(18)}${stats.fontsDropped} font face(s) dropped — ` +
        `${kb(stats.fontBytesDropped)} of glyphs this page never renders` : ''}`
  );
}

/* The hero film. It is deliberately NOT in the markup as a src — hero-film.js
   attaches it at runtime so a phone never requests it — which also means the
   image pass above cannot see it. Copied explicitly, and rewritten to the
   deployed path in the same breath so the two cannot disagree. */
{
  const assets = path.join(DIST, 'assets');
  const page = path.join(DIST, 'index.html');
  const shipped = [];

  /* The share card travels with them for the same reason: og:image is a meta
     content attribute, not a src, so the image pass above never sees it. A
     missing card is invisible on the site and only shows up as a grey preview
     in somebody else's chat window. */
  const shareCard = path.join(ROOT, 'src/assets/share-card.jpg');
  if (fs.existsSync(shareCard)) {
    fs.mkdirSync(assets, { recursive: true });
    fs.copyFileSync(shareCard, path.join(assets, 'share-card.jpg'));
  } else {
    console.log('\n  ! no share card — run node tools/build-share-card.js');
  }

  for (const name of ['hero.webm', 'hero.mp4']) {
    const film = path.join(ROOT, 'src/assets/showpiece', name);
    if (!fs.existsSync(film)) continue;
    fs.mkdirSync(assets, { recursive: true });
    fs.copyFileSync(film, path.join(assets, name));
    fs.writeFileSync(
      page,
      fs.readFileSync(page, 'utf8').replace(`./src/assets/showpiece/${name}`, `./assets/${name}`),
    );
    shipped.push(`${name} ${kb(fs.statSync(film).size)}`);
  }

  if (shipped.length) {
    console.log(`\nhero film       -> dist/assets/  ${shipped.join(', ')}  (desktop only, one of the two, attached at runtime)`);
  } else {
    console.log('\n  ! no hero film on disk — run node tools/build-showpiece.js');
  }
}

if (missing.length) {
  console.log(`\n  ! ${missing.length} image(s) referenced but not on disk:`);
  [...new Set(missing)].forEach((u) => console.log(`      ${u}`));
}

if (faviconMissing.length) {
  console.log('\n  ! favicon file(s) referenced but NOT on disk. The link shipped');
  console.log('    unchanged and will 404 for every visitor to that page:');
  [...new Set(faviconMissing)].forEach((u) => console.log(`      ./${u}`));
}

if (touchIconMissing.length) {
  console.log('\n  ! apple-touch-icon referenced but NOT on disk. Run `npm run icon`:');
  [...new Set(touchIconMissing)].forEach((u) => console.log(`      ./${u}`));
}
const assetsDir = path.join(DIST, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const bytes = files.reduce((n, f) => n + fs.statSync(path.join(assetsDir, f)).size, 0);
  console.log(`\n  ${files.length} image(s) in dist/assets/, ${kb(bytes)} — copied, not inlined.`);
  console.log('    Above the inline budget: base64 in every page would cost far more than');
  console.log('    one cached download for the whole site. They ship inside the zip.');
}


if (remote.length) {
  const hosts = [...new Set(remote.map((u) => new URL(u).host))];
  console.log(
    `\n  ! ${remote.length} image(s) load from ${hosts.join(', ')} and CANNOT be inlined.` +
    `\n    dist/index.html is no longer self-contained: it needs the network for` +
    `\n    these, and it breaks if that host goes away or blocks hotlinking.` +
    `\n    Save them under src/assets/ and point src="./…" at them to fix it.`
  );
  [...new Set(remote)].forEach((u) => console.log(`      ${u}`));
} else {
  console.log('\nEach page carries its own CSS, JavaScript and fonts. The only separate\n  files are dist/assets/ — the images, cached once for the whole site.');
}

/* -----------------------------------------------------------------------------
   SERVER FILES
   The pages are only half of a deployment. .htaccess, robots.txt and — once a
   domain is configured — sitemap.xml are generated here so the bundle in dist/
   is the whole thing to upload, not the part a browser happens to render.
   ----------------------------------------------------------------------------- */
const deploy = require('./tools/build-deploy.js');
console.log('');
deploy.run(new Date().toISOString().slice(0, 10));

/* The upload package. See tools/build-zip.js for why this exists rather than
   downloading the files one at a time. */
require('./tools/build-zip.js').run();
