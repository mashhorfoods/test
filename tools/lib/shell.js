/* =============================================================================
   THE SHARED SHELL — everything outside <main> — must be the same everywhere.

   Every page is the homepage's header, drawer, verification band and footer
   around its own <main>. build-pages.js produces most of them that way. The
   check exists because two pages were once maintained by a separate tool that
   did not run as part of the build, and one of them — the 404 — quietly lost
   the verification band and kept a stale footer, on the live site, while the
   release audit reported nothing. Nothing compared the pages to each other.

   Comparison is over what a visitor could perceive:
     - HTML comments are dropped (they differ legitimately between pages)
     - whitespace is collapsed
     - a subpage's links to homepage sections are written ./index.html#x;
       on the homepage itself they are #x. Those are the same link.
   Nothing else is normalised, so any real difference is reported.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const normalise = (s) => s
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/href="\.\/index\.html#/g, 'href="#')
  .replace(/\s+/g, ' ')
  .replace(/> </g, '><')
  .trim();

function regions(html) {
  const body = html.indexOf('<body');
  const open = html.indexOf('<main');
  const close = html.indexOf('</main>');
  const end = html.lastIndexOf('</body>');
  if (body < 0 || open < 0 || close < 0 || end < 0) return null;
  return {
    'before <main>': normalise(html.slice(html.indexOf('>', body) + 1, open)),
    'after </main>': normalise(html.slice(close + '</main>'.length, end)),
  };
}

/** First point where two strings diverge, with a little context on each side. */
function divergence(a, b) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const cut = (s) => s.slice(Math.max(0, i - 20), i + 70);
  return { expected: cut(a), found: cut(b) };
}

/**
 * Compare every page's shell to the reference page's.
 * @returns {{page: string, region: string, expected: string, found: string}[]}
 */
function shellDrift(root, pages, reference = 'index.html') {
  const ref = regions(fs.readFileSync(path.join(root, reference), 'utf8'));
  if (!ref) return [{ page: reference, region: 'structure', expected: '<body>…<main>…</main>…</body>', found: 'not found' }];

  const drift = [];
  for (const page of pages) {
    if (page === reference) continue;
    const file = path.join(root, page);
    if (!fs.existsSync(file)) continue;
    const mine = regions(fs.readFileSync(file, 'utf8'));
    if (!mine) {
      drift.push({ page, region: 'structure', expected: '<body>…<main>…</main>…</body>', found: 'not found' });
      continue;
    }
    for (const region of Object.keys(ref)) {
      if (ref[region] !== mine[region]) drift.push({ page, region, ...divergence(ref[region], mine[region]) });
    }
  }
  return drift;
}

module.exports = { shellDrift };
