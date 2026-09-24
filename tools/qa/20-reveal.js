/* §20 the reveal cannot strand content --------------------------------
   WHAT RULE 13 PROMISED AND HALF-DELIVERED. 05-motion.css hides every
   [data-reveal] the moment the `js` class is on <html>, and only motion.js
   takes that back. The class is set by an INLINE script, which always
   arrives; motion.js is a module, which can fail. So the comment's promise —
   "if JavaScript fails or is disabled, everything is already visible" — held
   for DISABLED and not for FAILS. Measured with the module throwing:
   132 blocks of content across four pages, invisible permanently.

   The failsafe is inline too: it arms a timer and drops the `js` class
   unless motion.js reports for duty. What this checks is that every shipped
   page actually carries BOTH halves — because the bootstrap is authored
   four separate times (index, story, styleguide, 404 each own a <head>),
   and the first version of this fix reached one of the four. A duplicated
   safety net is only as good as its least-updated copy. */

module.exports = async function check({ fs, path, DIST, fail, SHIPPED }) {
  {
    for (const page of SHIPPED) {
      const raw = fs.readFileSync(path.join(DIST, page), 'utf8');
      const hides = /\bdata-reveal\b/.test(raw);
      if (!hides) continue;
      if (!/classList\.add\('js'\)/.test(raw)) continue;

      if (!/hasAttribute\('data-motion-ready'\)/.test(raw) || !/classList\.remove\('js'\)/.test(raw)) {
        fail('HIGH', 'motion', `${page} hides content behind the js class but carries no failsafe — if the module throws, that content never comes back`);
      }
      if (!/setAttribute\('data-motion-ready'/.test(raw)) {
        fail('HIGH', 'motion', `${page} arms the motion failsafe but ships nothing that disarms it — the reveal would be dropped on every load`);
      }
    }
  }
};
