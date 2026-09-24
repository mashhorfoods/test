/* §13 fonts, whichever way they are carried ------------------------
   `site.config.json` build.fonts chooses between a data URI per face and a
   file in assets/fonts/. The linked mode is worth ~46% of a page's gzipped
   weight and lets unicode-range skip the Arabic face for English visitors
   (docs/43 §15), but it introduces a way to ship a page that references a
   font file the zip does not contain. This closes that. */

module.exports = async function check({ fs, path, DIST, cfg, fail, SHIPPED }) {
  {
    const mode = (cfg.build && cfg.build.fonts) === 'linked' ? 'linked' : 'inline';
    for (const page of SHIPPED) {
      const file = path.join(DIST, page);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      const refs = [...html.matchAll(/url\(\s*["']?(assets\/fonts\/[^"')]+)["']?\s*\)/g)].map((m) => m[1]);
      const inlined = (html.match(/url\(data:font\/woff2/g) || []).length;

      if (mode === 'linked') {
        if (inlined) fail('MED', 'fonts', `${page} still carries ${inlined} inlined font face(s) although build.fonts is "linked"`);
        if (!refs.length) fail('HIGH', 'fonts', `${page} references no font file, but build.fonts is "linked"`);
        for (const ref of new Set(refs)) {
          if (!fs.existsSync(path.join(DIST, ref))) {
            fail('HIGH', 'fonts', `${page} references ${ref}, which is not in dist/ — the page would render in a fallback face`);
          }
        }
      } else if (refs.length) {
        fail('HIGH', 'fonts', `${page} references ${refs.length} font file(s) although build.fonts is "inline" — those requests are not in the budget the mode assumes`);
      }
    }
    /* SHIP_DIRS carries assets/ whole, so the fonts ride along — but only if
       they were written there in the first place. */
    if (mode === 'linked' && !fs.existsSync(path.join(DIST, 'assets', 'fonts'))) {
      fail('HIGH', 'fonts', 'build.fonts is "linked" but dist/assets/fonts/ does not exist — the zip would ship pages with no faces');
    }
  }
};
