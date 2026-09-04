/* =============================================================================
   BUILD-ZIP
   Packs dist/ into pixora-site.zip, ready to upload and extract.

   WHY A ZIP AND NOT SIX DOWNLOADS.
   Downloading the files individually is what broke the first deployment, in two
   ways that were both silent:

     .htaccess   lost its leading dot and arrived as "htaccess" — a plain text
                 file the server ignores, so no compression, no 404 page and no
                 extensionless URLs, with nothing to indicate anything was wrong.

     index.html  arrived as "index - 2026-08-22T201547.231.html", because the
                 browser renames a file that collides with an existing download.
                 The server then fell through to the host's placeholder page.

   Inside an archive the names are data, not filenames the browser gets to
   rewrite. Extracting on the server reproduces them exactly.

   Run as part of:  node build.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'pixora-site.zip');

/* Only what belongs on the server. styleguide.html is the internal design
   reference — noindex and robots-disallowed — so it is not part of a
   deployment and is left out rather than uploaded and then hidden. */
const SHIP = ['index.html', 'story.html', 'about.html', 'pricing.html', 'privacy.html', 'terms.html', 'accessibility.html', '404.html', '.htaccess', 'robots.txt', 'sitemap.xml'];

/* Directories that ship whole. assets/ holds the images the build no longer
   inlines — above the size budget they are copied here and referenced from
   the pages, so they must travel with them or every service section renders
   an empty panel on the server. */
const SHIP_DIRS = ['assets'];

function run() {
  const present = SHIP.filter((f) => fs.existsSync(path.join(DIST, f)));
  const missing = SHIP.filter((f) => !present.includes(f));
  const dirs = SHIP_DIRS.filter((d) => fs.existsSync(path.join(DIST, d)));

  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);

  try {
    // -X drops extra file attributes; -j would flatten, which we do NOT want
    // here because every file is already at the archive root.
    execFileSync('zip', ['-qXr', OUT, ...present, ...dirs], { cwd: DIST });
  } catch (err) {
    console.log(`  ! could not create the archive: ${err.message}`);
    return;
  }

  const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
  console.log(`\npixora-site.zip  ${kb(fs.statSync(OUT).size)}  (${present.length} files)`);
  present.forEach((f) => console.log(`  ${f.padEnd(14)} ${kb(fs.statSync(path.join(DIST, f)).size)}`));
  dirs.forEach((d) => {
    const files = fs.readdirSync(path.join(DIST, d));
    const bytes = files.reduce((n, f) => n + fs.statSync(path.join(DIST, d, f)).size, 0);
    console.log(`  ${`${d}/`.padEnd(14)} ${kb(bytes)}  (${files.length} files)`);
  });
  if (missing.length) {
    console.log(`  ! not built, so not packed: ${missing.join(', ')}`);
  }
  console.log('  Upload this to public_html and Extract. The names survive the trip.');
}

module.exports = { run, SHIP, SHIP_DIRS };
