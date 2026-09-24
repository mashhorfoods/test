/* §28 a focus ring written as the wrong kind of thing ------------------
   --focus-ring is a two-layer *box-shadow* value. Written as
   `outline: var(--focus-ring)` it is not a shorthand the parser accepts, so
   the declaration is dropped in silence and the element keeps whatever ring
   it had. On a normally focusable element that is harmless — the base
   :focus-visible rule already draws one — which is exactly why the mistake
   survives review. On a component whose real control is a visually hidden
   input and whose ring must land on a sibling label, the base rule reaches
   nothing, and the result is a keyboard visitor with no indicator at all.
   That shipped once here. Catch the pattern, not the one instance. */

module.exports = async function check({ fs, path, ROOT, fail }) {
  {
    const cssDir = path.join(ROOT, 'src/styles');
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : e.name.endsWith('.css') ? [full] : [];
    });
    for (const f of walk(cssDir)) {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/^\s*outline\s*:\s*var\(\s*--focus-ring\s*\)/.test(line)) {
          fail('HIGH', 'focus', `${path.relative(ROOT, f)}:${i + 1} writes the ring as an outline; --focus-ring is a box-shadow value, so this declaration is dropped — use box-shadow: var(--focus-ring)`);
        }
      });
    }
  }
};
