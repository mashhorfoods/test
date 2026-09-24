/* §29 a stylesheet that never closes its layer -------------------------
   One duplicated `@layer components {` in page.css left the file with an
   unclosed block. The build concatenates these files, so everything
   imported after it nested INSIDE components — including the whole
   utilities layer, which the cascade contract in main.css puts after it.

   The visible result was a bilingual failure: `html:not([lang|="ar"])
   [data-lang-copy="ar"] { display: none }` became a sub-layer of components
   and lost to `.c-orbit__label span { display: block }`, so the English
   homepage rendered "BRANDING & DESIGN الهوية والتصميم" — both languages at
   once, in the same label. 06-utilities.css already carries a comment
   saying this exact thing happened once before to this exact component.

   Nothing could see it. The bilingual guard counts strings and both were
   present; a11y had no violation to report; the page was valid CSS, because
   an unclosed block is not a syntax error, it is a nesting instruction.

   So the check is on the cause, not the symptom: every stylesheet must
   close what it opens. Comments are stripped first — braces in prose are
   not code. */

module.exports = async function check({ fs, path, ROOT, fail }) {
  {
    const cssDir = path.join(ROOT, 'src/styles');
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : e.name.endsWith('.css') ? [full] : [];
    });
    for (const f of walk(cssDir)) {
      const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      const depth = (src.match(/\{/g) || []).length - (src.match(/\}/g) || []).length;
      if (depth !== 0) {
        const rel = path.relative(ROOT, f);
        fail('HIGH', 'css', `${rel} ${depth > 0 ? `leaves ${depth} block(s) open` : `closes ${-depth} block(s) it never opened`} — the build concatenates these files, so every stylesheet after it nests inside this one and the cascade contract in main.css stops holding`);
      }
    }
  }
};
