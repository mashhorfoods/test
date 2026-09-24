/* §30 a var() that names a token nobody defines ----------------------
   `.c-bento__body { padding: var(--space-48) var(--space-20) var(--space-20) }`
   There is no --space-20. The scale goes 16, 24, 32 — twenty was a number I
   wanted, not a token that exists. An undefined custom property with no
   fallback makes the whole declaration invalid AT COMPUTED-VALUE TIME,
   which is not a parse error: the rule stays in the stylesheet, the
   declaration survives in devtools, and the computed value silently becomes
   the initial one. So the tile shipped with `padding: 0px`, text flush to
   the crop on all four sides, and every other check passed — the CSS was
   valid, the brace count balanced, axe found the contrast acceptable, and
   the dead-selector check saw a selector that matched.

   The same slip had already shipped in four more places: `var(--color-text)`
   where the token is --color-text-primary, in pricing, verification and
   contact; and the same --space-20 padding on .c-index__item, which is why
   the index cards had none.

   A fallback is the escape hatch — `var(--text-lg, 1.125rem)` is a
   deliberate default, not a typo — and so are the properties the markup or
   the script sets (--i, --span, --reveal-delay). Both are collected before
   judging, so what is left is only the third case: a name that is spelled
   wrong or was never written. */

module.exports = async function check({ fs, path, ROOT, fail }) {
  {
    const cssDir = path.join(ROOT, 'src/styles');
    const walkCss = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walkCss(full) : e.name.endsWith('.css') ? [full] : [];
    });
    const sheets = walkCss(cssDir);
    const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');

    const defined = new Set();
    for (const f of sheets) {
      for (const m of strip(fs.readFileSync(f, 'utf8')).matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
    }
    /* Properties handed in from outside the stylesheets count as defined.

       `docs` is skipped, and the reason is that this list decides what counts
       as DEFINED: anything it reads makes the check below more permissive. The
       four reviewer briefs live in docs/review-packs and carry a whole
       stylesheet of their own inlined into each assembled page — `--paper`,
       `--ink`, `--accent` and the rest. None of it is the site's, none of it
       reaches a visitor, and a token that exists only there must not silence a
       typo in `src/styles`. Skipping it makes the guard stricter, not looser. */
    const walkAny = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      if (['node_modules', '.git', 'dist', 'docs'].includes(e.name)) return [];
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walkAny(full) : /\.(html|js|mjs|json)$/.test(e.name) ? [full] : [];
    });
    for (const f of walkAny(ROOT)) {
      const t = fs.readFileSync(f, 'utf8');
      for (const m of t.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
      for (const m of t.matchAll(/setProperty\(\s*['"](--[\w-]+)/g)) defined.add(m[1]);
    }

    for (const f of sheets) {
      const rel = path.relative(ROOT, f);
      strip(fs.readFileSync(f, 'utf8')).split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
          if (m[2] === ',' || defined.has(m[1])) continue;
          fail('HIGH', 'css', `${rel}:${i + 1} reads ${m[1]}, which nothing defines and which has no fallback — the whole declaration is invalid at computed-value time and falls back to the initial value: \`${line.trim().slice(0, 80)}\``);
        }
      });
    }
  }
};
