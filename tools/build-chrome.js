/* =============================================================================
   BUILD-CHROME
   Copies the header (with its mobile drawer) and the footer FROM index.html
   INTO every other page, between the CHROME markers.

   WHY THIS EXISTS.
   index.html's own header comment has said since Stage 01 that "identical
   markup serves every page; nothing here is hero- or homepage-specific". The
   moment a second page existed, that promise needed something to keep it: a
   hand-copied header is a header that drifts, and this project generates its
   pricing and its translations for exactly that reason.

   index.html stays the single source. This tool never writes to it.

   Run after changing the header or footer:  node tools/build-chrome.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'index.html');
const TARGETS = ['story.html', '404.html'];

const src = fs.readFileSync(SOURCE, 'utf8');

/* Boundaries are matched on markup, not line numbers, so editing the homepage
   above or below the chrome cannot silently shift what gets copied. */
const top = src.match(/(\n {4}<a class="c-skip-link"[\s\S]*?)\n {4}<!-- =+\n {9}PAGE SECTIONS/);
if (!top) throw new Error('could not locate the header block in index.html');

const foot = src.match(/\n {4}<footer class="c-footer">[\s\S]*?\n {4}<\/footer>/);
if (!foot) throw new Error('could not locate the footer block in index.html');

const NOTE = (what) => `
    <!-- ${what} — COPIED FROM index.html by tools/build-chrome.js.
         Do not edit here: edit index.html and re-run the tool, or this file
         will be overwritten and the two pages will disagree. -->`;

let changed = 0;
for (const name of TARGETS) {
  const file = path.join(ROOT, name);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  for (const [key, body, label] of [
    ['TOP', NOTE('HEADER + MOBILE DRAWER') + top[1], 'header'],
    ['FOOT', NOTE('FOOTER') + foot[0], 'footer'],
  ]) {
    const a = `<!-- CHROME:${key}:START -->`;
    const b = `<!-- CHROME:${key}:END -->`;
    if (!html.includes(a) || !html.includes(b)) {
      throw new Error(`${name}: CHROME:${key} markers not found`);
    }
    html = html.replace(
      new RegExp(`${a}[\\s\\S]*?${b}`),
      () => `${a}${body}\n    ${b}`
    );
  }

  fs.writeFileSync(file, html);
  if (html !== before) changed++;
  console.log(`  ${name}  ${html === before ? 'already up to date' : 'updated'}`);
}

console.log(`chrome: header + footer synced from index.html -> ${TARGETS.length} page(s)`);
