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

   Four optional keys cover the pages that are not plain content pages:

     mainClass   a class on <main> — the story and the 404 are styled from it
     ogType      og:type, where the page is not a "website" (the story is an
                 article)
     robots      a robots meta — the 404 is noindex
     base        a <base href> — only the 404 needs one; see below

   Every page on the site is built this way, including the story and the 404.
   They used to be kept in step by a separate copy tool that was not part of
   the build, and the 404 drifted: it lost the verification band and kept a
   stale footer, on the live site, with the release audit reporting nothing.
   One tool, run every build, is what stops that; tools/lib/shell.js checks it.

   Cross-page links: the seeded navigation in the shell points at #fragments
   that only exist on the homepage. On a subpage they are rewritten to
   ./index.html#… so they work with JavaScript disabled — navigation.js does
   the same thing at runtime, and now the markup agrees with it before boot.

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
   exactly as it is. */
const absolutise = (html) => html.replace(/href="#([a-z0-9-]+)"/gi, 'href="./index.html#$1"');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function build(file) {
  const raw = fs.readFileSync(path.join(PAGES, file), 'utf8');
  const meta = raw.match(/^<!--PAGE([\s\S]*?)-->/);
  if (!meta) throw new Error(`${file}: missing <!--PAGE { … } --> block`);
  const cfg = JSON.parse(meta[1]);
  const body = raw.slice(meta[0].length).trim();

  let out = absolutise(head)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(cfg.title)}</title>`)
    .replace(/(<meta\s+name="description"[\s\S]*?content=")[\s\S]*?(")/,
      `$1${esc(cfg.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(cfg.title)}$2`)
    /* \s+ after <meta, not a literal space. The shell writes this tag across
       three lines, so a pattern expecting '<meta property=' on one line never
       matched — silently — and every page built here shipped the HOMEPAGE's
       og:description. A link to About shared on WhatsApp previewed as the
       homepage. The assertion below is what stops that recurring. */
    .replace(/(<meta\s+property="og:description"[\s\S]*?content=")[\s\S]*?(")/,
      `$1${esc(cfg.description)}$2`);

  if (cfg.ogType) {
    out = out.replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${esc(cfg.ogType)}$2`);
  }
  if (cfg.robots) {
    out = out.replace(/(<\/title>)/, `$1\n    <meta name="robots" content="${esc(cfg.robots)}" />`);
  }
  /* <base> exists for the 404 alone. A 404 is served AT THE REQUESTED URL,
     whatever depth that is, so every relative URL on it — including the ones
     the shared header and footer bring — would otherwise resolve against a
     path that does not exist. It goes straight after the viewport meta, ahead
     of every URL it has to govern. */
  if (cfg.base) {
    out = out.replace(/(<meta name="viewport"[^>]*>)/, `$1\n    <base href="${esc(cfg.base)}" />`);
  }

  const mainAttrs = cfg.mainClass ? ` class="${esc(cfg.mainClass)}"` : '';
  out += `<main id="main"${mainAttrs}>\n${body}\n    </main>`;
  out += absolutise(tail);

  // A replacement that matches nothing leaves the HOMEPAGE's value in place,
  // with no error. Check each one landed.
  const want = (label, re) => {
    const got = (out.match(re) || [])[1];
    if (got !== undefined && got.replace(/\s+/g, ' ') === esc(cfg[label === 'title' ? 'title' : 'description']).replace(/\s+/g, ' ')) return;
    throw new Error(`${file}: ${label} was not applied (found "${(got || '').slice(0, 60)}")`);
  };
  want('title', /<title>([\s\S]*?)<\/title>/);
  want('description', /<meta\s+name="description"[\s\S]*?content="([^"]*)"/);
  want('og:description', /<meta\s+property="og:description"[\s\S]*?content="([^"]*)"/);

  // An option that silently fails to apply is how a page drifts — say so.
  if (cfg.base && !out.includes(`<base href="${esc(cfg.base)}"`)) throw new Error(`${file}: could not place <base>`);
  if (cfg.robots && !out.includes('name="robots"')) throw new Error(`${file}: could not place robots meta`);
  if (cfg.ogType && !out.includes(`og:type" content="${esc(cfg.ogType)}"`)) throw new Error(`${file}: could not set og:type`);

  const target = path.join(ROOT, cfg.file);
  const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  fs.writeFileSync(target, out);
  return { file: cfg.file, changed: out !== before };
}

const built = fs.readdirSync(PAGES).filter((f) => f.endsWith('.html')).map(build);

console.log(`pages: ${built.length} built from the index.html shell`);
built.forEach((b) => console.log(`  ${b.file}${b.changed ? '' : '  (already up to date)'}`));
