/* §25 scroll-driven motion escapes the universal guard ----------------
   PROVED, NOT ASSUMED. 01-reset.css carries a universal reduced-motion rule
   that flattens animation-duration, animation-delay, iteration-count and
   transition-duration with !important. It covers every animation on this
   site — except one kind.

   A scroll-driven animation (`animation-timeline: view()`) takes its
   progress from the scroll position, not from a clock. It has no duration to
   flatten. Tested on a minimal page carrying exactly that guard: the element
   moved identically with reduced motion ON and OFF.

   So for this one kind of animation the guard is not a safety net, and the
   only protection is declaring it inside `prefers-reduced-motion:
   no-preference` — which installs the rule solely for people who have not
   asked for less motion. /about's figure drift is written that way (docs/94).

   This fails any scroll-driven animation that is not, because the failure is
   silent: it looks correct to whoever wrote it and it ignores the one
   preference a person can state about motion. */

module.exports = async function check({ fs, path, ROOT, fail }) {
  {
    const files = [];
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.css')) files.push(full);
    });
    walk(path.join(ROOT, 'src', 'styles'));

    for (const file of files) {
      const css = fs.readFileSync(file, 'utf8');
      if (!css.includes('animation-timeline')) continue;

      /* Walk the file tracking brace depth, and remember the depth at which a
         no-preference block opened. A declaration is safe only while such a
         block is still open around it. */
      /* Paren depth matters: `@supports (animation-timeline: view())` names the
         property inside its CONDITION, before any guard block has opened. The
         first run of this check flagged /about's own drift for exactly that —
         the CSS was correct and the scanner was not. A declaration is never
         inside parentheses; an @supports condition always is. */
      let depth = 0; let paren = 0; const guards = [];
      for (let i = 0; i < css.length; i += 1) {
        /* Skip comments. The first version did not, and flagged the comment in
           page.css that explains this very rule — the word appears in prose
           describing the check as often as in code breaking it. */
        if (css.startsWith('/*', i)) {
          const close = css.indexOf('*/', i + 2);
          i = close === -1 ? css.length : close + 1;
          continue;
        }
        if (css[i] === '(') paren += 1;
        else if (css[i] === ')') paren = Math.max(0, paren - 1);
        if (css[i] === '{') {
          const head = css.slice(Math.max(0, i - 160), i);
          if (/@media[^{}]*prefers-reduced-motion\s*:\s*no-preference[^{}]*$/.test(head)) guards.push(depth);
          depth += 1;
        } else if (css[i] === '}') {
          depth -= 1;
          while (guards.length && guards[guards.length - 1] >= depth) guards.pop();
        } else if (!paren && css.startsWith('animation-timeline', i) && !guards.length) {
          const line = css.slice(0, i).split('\n').length;
          fail('HIGH', 'motion', `${path.relative(ROOT, file)}:${line} sets animation-timeline outside a prefers-reduced-motion: no-preference block — the universal guard in 01-reset.css cannot stop a scroll-driven animation, so this one runs for people who asked for less motion`);
          i += 18;
        }
      }
    }
  }
};
