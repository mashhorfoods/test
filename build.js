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
function embedFonts(css) {
  let count = 0;
  let bytes = 0;
  const out = css.replace(/url\(\s*["']?([^"')]+\.woff2)["']?\s*\)/g, (_, href) => {
    const file = path.join(ROOT, 'src/assets', href.replace(/^(\.\.\/)+assets\//, ''));
    const buf = fs.readFileSync(file);
    count += 1;
    bytes += buf.length;
    return `url(data:font/woff2;base64,${buf.toString('base64')})`;
  });
  return { css: out, count, bytes };
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
  const stats = { css: 0, fonts: 0, fontBytes: 0, js: 0 };

  // --- stylesheets -> one inline <style>, in document order ---------------
  const sheets = [...html.matchAll(/[ \t]*<link rel="stylesheet" href="\.\/([^"]+)"[^>]*>\n?/g)];
  if (sheets.length) {
    let css = '';
    for (const [, href] of sheets) css += `\n/* ===== ${href} ===== */\n` + inlineCss(href);
    const embedded = embedFonts(css);
    stats.fonts = embedded.count;
    stats.fontBytes = embedded.bytes;
    stats.css = embedded.css.length;
    html = html.replace(sheets[0][0], `    <style>\n${embedded.css}\n    </style>\n`);
    for (const [tag] of sheets.slice(1)) html = html.replace(tag, '');
  }

  // --- font preloads are pointless once the bytes are in the document -----
  html = html.replace(/[ \t]*<link\s+rel="preload"[\s\S]*?\/>\n?/g, '');

  // --- favicon -> data: URI -----------------------------------------------
  html = html.replace(/href="\.\/(src\/assets\/brand\/logo\.svg)"/g, (_, p) => {
    const svg = read(p);
    return `href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"`;
  });

  // --- module graph -> one inline module ----------------------------------
  html = html.replace(
    /[ \t]*<script type="module" src="\.\/([^"]+)"><\/script>/,
    (_, src) => {
      // A literal `</script>` anywhere in the source — even inside a comment,
      // as main.js has in its usage note — ends the inline <script> element
      // as far as the HTML parser is concerned, silently truncating the
      // bundle. Escaping the slash keeps it inert while reading the same.
      const js = bundleJs(src).replace(/<\/script/gi, '<\\/script');
      stats.js = js.length;
      // Wrapped so the flattened top-level bindings never touch globals.
      return `    <script type="module">\n(() => {\n${js}\n})();\n    </script>`;
    }
  );

  return { html, stats };
}

/* ------------------------------------------------------------------ run -- */

fs.mkdirSync(DIST, { recursive: true });

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

for (const page of ['index.html', 'styleguide.html']) {
  const { html, stats } = buildPage(page);
  const out = path.join(DIST, page);
  fs.writeFileSync(out, html);
  console.log(
    `${page.padEnd(16)} -> dist/${page}  ${kb(Buffer.byteLength(html))}  ` +
      `(css ${kb(stats.css)}, js ${kb(stats.js)}, ${stats.fonts} fonts ${kb(stats.fontBytes)})`
  );
}

console.log('\nEach file is self-contained: open it directly, or drop it on any host.');
