/* =============================================================================
   BUILD-IMAGES
   Repoints every product image at a self-hosted file and stamps its real
   intrinsic size into the markup.

   WHY BOTH HALVES MATTER.

   SELF-HOSTING. The twelve images shipped hotlinked from i.ibb.co. That is
   one hotlink policy away from a live site full of empty boxes, and it is why
   build.js reports on every run that dist/ is "no longer self-contained".
   Files under src/assets/images/ are inlined into dist/ like everything else,
   so the built pages need no network at all.

   WIDTH AND HEIGHT. Not decoration — this is the layout-shift fix that has
   been open since the images arrived. With width and height present the
   browser derives an aspect ratio and reserves the exact box BEFORE the bytes
   land; without them, twelve lazy images each snap the page as they load, on
   precisely the connections least able to absorb it. The values cannot be
   guessed, which is why this reads them from the files rather than inventing
   them: `block-size: auto` in the CSS means the real ratio still wins after
   decode, so a correct pair costs nothing and a missing pair costs a reflow.

   Reading PNG/JPEG headers directly, with no dependency — a PNG carries its
   dimensions in the IHDR chunk at a fixed offset, and a JPEG in its SOFn
   marker.

   Drop the files in as B1.png, B2.png, B3.png, B4.png, d01.png, t01.png,
   mo1.png, c01.png … c05.png, then:  node tools/build-images.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'src/assets/images');
const HTML = path.join(ROOT, 'index.html');

/** Intrinsic size, straight from the file header. */
function dimensions(file) {
  const b = fs.readFileSync(file);
  // PNG: \x89PNG, then IHDR — width and height are big-endian at 16 and 20.
  if (b.length > 24 && b.toString('ascii', 1, 4) === 'PNG') {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  // JPEG: walk the markers to the first SOFn, which carries the size.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      // SOF0-SOF3, SOF5-SOF7, SOF9-SOF11, SOF13-SOF15 carry dimensions.
      if (marker >= 0xc0 && marker <= 0xcf
        && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

let html = fs.readFileSync(HTML, 'utf8');
const before = html;

const present = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  : [];

if (present.length === 0) {
  console.log('images: nothing in src/assets/images/ yet — markup left as it is.');
  console.log('  Drop the files in and re-run. Until then the pages keep their');
  console.log('  current sources and build.js will keep reporting them as remote.');
  process.exit(0);
}

let rewritten = 0;
let unsized = 0;
const missing = [];

/* One <img> at a time, matched on its filename so a re-run is idempotent and
   the order of the markup never matters. */
html = html.replace(/<img\b[^>]*>/g, (tag) => {
  const src = (tag.match(/src="([^"]+)"/) || [])[1];
  if (!src) return tag;
  const name = src.split('/').pop().split('?')[0];
  const file = present.find((f) => f === name);
  if (!file) {
    if (/^https?:/.test(src)) missing.push(name);
    return tag;
  }

  const local = `./src/assets/images/${file}`;
  const size = dimensions(path.join(DIR, file));

  let out = tag.replace(/src="[^"]+"/, `src="${local}"`);
  out = out.replace(/\s+(width|height)="[^"]*"/g, '');
  if (size) {
    // Placed right after src, where a reader looks for them.
    out = out.replace(`src="${local}"`, `src="${local}"\n              width="${size.w}"\n              height="${size.h}"`);
  } else {
    unsized++;
  }
  rewritten++;
  return out;
});

fs.writeFileSync(HTML, html);

console.log(html === before ? 'images: markup already up to date' : 'images: markup updated');
console.log(`  ${rewritten} image(s) now self-hosted from src/assets/images/`);
if (unsized) console.log(`  ! ${unsized} had no readable header — no width/height written for those`);
if (missing.length) {
  console.log(`  ! still remote, no local file found: ${[...new Set(missing)].join(', ')}`);
}
