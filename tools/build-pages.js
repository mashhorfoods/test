/* =============================================================================
   BUILD-PAGES
   Builds every standalone content page from ONE shell: index.html.

   WHY THIS EXISTS.
   The header, the footer, the head and the script tags were duplicated by hand
   into story.html. A third copy for the privacy policy — and a fourth for
   About, and a fifth for the pricing guide — is four places to forget when the
   navigation changes. So the shell is not copied: it is READ from index.html
   at build time, and only the <main> is swapped.

   A content file under src/pages/ therefore holds nothing but the page: no
   <html>, no header, no footer, no scripts. It opens with a JSON block naming
   the title and description in both languages.

   Cross-page links: the seeded navigation in the shell points at #fragments
   that only exist on the homepage. On a subpage they are rewritten to ./#…
   so they work with JavaScript disabled — navigation.js does the same thing at
   runtime, and now the markup agrees with it before boot. Fragments that DO
   resolve on the page being built are left alone; see absolutise().

   Run after editing a page:  node tools/build-pages.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHELL = path.join(ROOT, 'index.html');
const PAGES = path.join(ROOT, 'src/pages');

const shell = fs.readFileSync(SHELL, 'utf8');

const mainOpen = shell.indexOf('<main id="main">');
const mainClose = shell.indexOf('</main>');
if (mainOpen < 0 || mainClose < 0) throw new Error('shell: <main id="main"> not found in index.html');

const head = shell.slice(0, mainOpen);
const tail = shell.slice(mainClose + '</main>'.length);

/* The seeded fragment links, made absolute for a subpage. Only hrefs that are
   a bare fragment are touched; anything already pointing somewhere is left
   exactly as it is.

   EXCEPT the ones that resolve on this page. The shell carries the skip link
   (#main) and the header's home link, and a subpage has a <main id="main"> of
   its own — so rewriting #main to ./#main sends the first thing a keyboard
   user presses to the homepage instead of past this page's navigation. Any
   fragment whose id exists in the page being built stays local; only the ones
   that live on the homepage are made absolute. */
const absolutise = (html, localIds) => html.replace(
  /href="#([a-z0-9-]+)"/gi,
  (whole, id) => (localIds.has(id.toLowerCase()) ? whole : `href="./#${id}"`),
);

const idsIn = (html) => new Set(
  [...html.matchAll(/\sid="([^"]+)"/gi)].map((m) => m[1].toLowerCase()),
);

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function build(file) {
  const raw = fs.readFileSync(path.join(PAGES, file), 'utf8');
  const meta = raw.match(/^<!--PAGE([\s\S]*?)-->/);
  if (!meta) throw new Error(`${file}: missing <!--PAGE { … } --> block`);
  const cfg = JSON.parse(meta[1]);
  const body = raw.slice(meta[0].length).trim();

  /* main is added below; the body carries the rest of this page's ids. */
  const localIds = idsIn(body).add('main');

  let out = absolutise(head, localIds)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(cfg.title)}</title>`)
    .replace(/(<meta\s+name="description"[\s\S]*?content=")[\s\S]*?(")/,
      `$1${esc(cfg.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(cfg.title)}$2`)
    .replace(/(<meta property="og:description"[\s\S]*?content=")[\s\S]*?(")/,
      `$1${esc(cfg.description)}$2`);

  out += `<main id="main">\n${body}\n    </main>`;
  out += absolutise(tail, localIds);

  const target = path.join(ROOT, cfg.file);
  const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  fs.writeFileSync(target, out);
  return { file: cfg.file, changed: out !== before };
}

const built = fs.readdirSync(PAGES).filter((f) => f.endsWith('.html')).map(build);

console.log(`pages: ${built.length} built from the index.html shell`);
built.forEach((b) => console.log(`  ${b.file}${b.changed ? '' : '  (already up to date)'}`));
