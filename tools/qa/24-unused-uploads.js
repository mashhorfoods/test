/* §24 bytes uploaded for nobody ---------------------------------------
   build-zip.js ships SHIP_DIRS = ['assets'] WHOLE, so anything sitting in
   that directory reaches the server whether or not a page asks for it. Until
   today build.js never emptied dist/, and a 14.2KB hero-poster.webp had been
   uploaded ever since the poster dropped under the 12KB inline limit and the
   build switched from copying it to inlining it. Nothing referenced it and
   nothing would ever have removed it.

   build.js now clears dist/ first, which fixes the cause. This checks the
   effect, because the cause can come back: any build step that writes an
   unreferenced file into assets/ is shipping bytes to people who will never
   download them, on a site whose whole argument is that it is light.

   Fonts are exempt: they are named inside @font-face in the inlined CSS, and
   subsetting means a face may legitimately be present for one page only. */

module.exports = async function check({ fs, path, DIST, fail, SHIPPED }) {
  {
    const dir = path.join(DIST, 'assets');
    if (fs.existsSync(dir)) {
      const pages = SHIPPED.map((f) => fs.readFileSync(path.join(DIST, f), 'utf8')).join('\n');
      for (const name of fs.readdirSync(dir)) {
        const file = path.join(dir, name);
        if (!fs.statSync(file).isFile()) continue;
        if (pages.includes(name)) continue;
        const kb = (fs.statSync(file).size / 1024).toFixed(1);
        fail('MED', 'weight', `dist/assets/${name} (${kb}KB) is referenced by no shipped page, and build-zip ships assets/ whole — it uploads and nobody downloads it`);
      }
    }
  }
};
