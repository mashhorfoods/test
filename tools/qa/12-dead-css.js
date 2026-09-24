/* §12 CSS that can never apply --------------------------------------
   On 5 September a rule in 03-base.css was found to have never fired: it
   set Arabic heading leading and keyed on `.t-h1 … .t-h4`, classes that
   appear nowhere in the markup. Every Arabic heading took body leading
   instead, and the Arabic hero CTA sat below the fold on desktop. Three
   harnesses passed, because a headline being too tall violates nothing
   any of them measures. `docs/43` §12.

   The distinction this check turns on:

     `.t-small { font-size: … }`     a DEFINITION. Nobody used it. Inert.
     `:lang(ar) .t-h1 { … }`         an ASSERTION — "under this condition,
                                     change that thing". If it matches
                                     nothing, the condition it was written
                                     for is silently unhandled.

   So a dead selector carrying context — a combinator, an attribute, a
   functional pseudo-class — is HIGH and fails the build. A dead bare class
   is one LOW line, because a design system is allowed to offer more than
   the site currently orders.

   Runtime states are neutralised before a selector is called dead:
   `.c-drawer.is-open` is tested as `.c-drawer`, so a class the scripts add
   is not mistaken for one that cannot exist. ---------------------------- */

module.exports = async function check({ fs, path, ROOT, DIST, PAGES, fail, BASE, browser, SHIPPED }) {
  {
    /* The stylesheets a VISITOR actually gets, found by walking the @import
       chain from the entry the shipped pages link — not by globbing
       src/styles. showroom.css and the components it carries are linked only
       by /styleguide, and reporting them here would be reporting CSS nobody
       downloads. */
    const cssFiles = [];
    (function follow(file) {
      const abs = path.resolve(file);
      if (cssFiles.includes(abs) || !fs.existsSync(abs)) return;
      cssFiles.push(abs);
      const dir = path.dirname(abs);
      for (const m of fs.readFileSync(abs, 'utf8').matchAll(/@import\s+url\(\s*["']([^"']+)["']\s*\)/g)) {
        follow(path.join(dir, m[1]));
      }
    })(path.join(ROOT, 'src/styles/main.css'));

    /* Blank comments in place so reported line numbers stay true. */
    const decomment = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

    /* Split a selector list on top-level commas only, so `:is(a, b)` survives. */
    function splitList(list) {
      const out = [];
      let depth = 0, buf = '';
      for (const c of list) {
        if (c === '(' || c === '[') depth++;
        else if (c === ')' || c === ']') depth--;
        else if (c === ',' && depth === 0) { out.push(buf); buf = ''; continue; }
        buf += c;
      }
      out.push(buf);
      return out.map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
    }

    /* Walk the braces. At-rule preludes (@layer, @media, @supports) are not
       selectors; keyframe bodies (`from`, `50%`) are not either. */
    function rulesOf(file) {
      const raw = fs.readFileSync(file, 'utf8');
      /* decomment() blanks comments character-for-character, so an offset into
         `src` is the same offset in `raw` and the opt-out below can be read. */
      const src = decomment(raw);
      const rel = path.relative(ROOT, file);
      const out = [];
      const stack = [];
      const inRule = () => stack[stack.length - 1] === 'rule' || stack.includes('keyframes');
      let buf = '', start = 0;
      for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (c === '{') {
          const prelude = buf.trim();
          if (inRule()) stack.push(stack.includes('keyframes') ? 'keyframes' : 'rule');
          else if (prelude.startsWith('@')) stack.push(/^@keyframes/i.test(prelude) ? 'keyframes' : 'at');
          else {
            const line = src.slice(0, start).split('\n').length;
            /* `qa:allow-dead` in the comment above a rule exempts it, and the
               comment is where the reason has to be written. */
            const allowed = raw.slice(Math.max(0, start - 500), start).includes('qa:allow-dead');
            for (const sel of splitList(prelude)) out.push({ sel, file: rel, line, allowed });
            stack.push('rule');
          }
          buf = '';
          continue;
        }
        if (c === '}') { stack.pop(); buf = ''; start = i + 1; continue; }
        if (inRule()) continue;
        if (!buf && /\s/.test(c)) { start = i + 1; continue; }
        buf += c;
      }
      return out;
    }

    /* Remove a functional pseudo-class and its balanced argument. */
    function dropFn(sel, names) {
      const re = new RegExp(`::?(${names})\\(`, 'i');
      let m;
      while ((m = re.exec(sel))) {
        let depth = 0, i = m.index + m[0].length - 1;
        for (; i < sel.length; i++) {
          if (sel[i] === '(') depth++;
          else if (sel[i] === ')') { depth--; if (depth === 0) break; }
        }
        sel = sel.slice(0, m.index) + sel.slice(i + 1);
      }
      return sel;
    }

    /* What a selector looks like once every state the runtime supplies is
       assumed present. What is left is the structure that must exist in the
       markup for the rule to have any chance at all. */
    function neutralise(sel) {
      let s = sel;
      s = dropFn(s, 'not|nth-child|nth-of-type|nth-last-child|part|slotted|host');
      s = s.replace(/::[a-z-]+/gi, '');
      s = s.replace(/:(focus-visible|focus-within|focus|hover|active|visited|target|checked|indeterminate|disabled|enabled|default|valid|invalid|required|optional|read-only|read-write|placeholder-shown|autofill|user-invalid|open|popover-open|modal|fullscreen|first-child|last-child|only-child|first-of-type|last-of-type|empty|defined)\b/gi, '');
      s = s.replace(/\.is-[\w-]+/g, '');
      s = s.replace(/\[(aria-[\w-]+|open|hidden|data-collapsed|data-i18n-pending|data-state|data-active)(=[^\]]*)?\]/gi, '');
      /* Stripping a state out of `:has([aria-expanded])` leaves `:has()`,
         which is invalid and would be reported as unevaluable rather than
         tested. Drop any functional pseudo left holding nothing. */
      for (let prev = null; prev !== s; ) { prev = s; s = s.replace(/::?[a-z-]+\(\s*\)/gi, ''); }
      s = s.replace(/\s+/g, ' ').trim();
      s = s.replace(/[>+~]\s*$/, '').trim();          // trailing combinator
      s = s.replace(/^\s*[>+~]/, '').trim();          // leading combinator
      return s;
    }

    /* Everything before the last top-level combinator: the CONDITION a rule
       is asserting. `:lang(ar) :is(h1, .t-h1)` has the condition `:lang(ar)`
       and the target `:is(h1, .t-h1)`. */
    function splitContext(sel) {
      let depth = 0, cut = -1;
      for (let i = 0; i < sel.length; i++) {
        const c = sel[i];
        if (c === '(' || c === '[') depth++;
        else if (c === ')' || c === ']') depth--;
        else if (depth === 0 && /[ >+~]/.test(c)) cut = i;
      }
      if (cut === -1) return { context: '', target: sel };
      return { context: sel.slice(0, cut).replace(/[>+~\s]+$/, '').trim(), target: sel.slice(cut + 1).trim() };
    }
    const classesIn = (sel) => [...sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);

    /* COMMENT TERMINATORS, checked before anything else.
       This section was written to find rules that never fire, and the first
       thing it found was worse: a comment in service-detail.css closed early,
       twelve lines of prose became an invalid selector prelude, and the
       browser swallowed the rule that followed it — `.c-tier__cta`, whose
       `margin-block-start: auto` bottom-aligns the package buttons. Measured
       on the homepage before the fix: the three buttons in one grid sat up to
       252px apart. A stylesheet cannot be trusted while its comments are
       unbalanced, so this runs first and reports the line. */
    for (const f of cssFiles) {
      const raw = fs.readFileSync(f, 'utf8');
      const rel = path.relative(ROOT, f);
      const lineAt = (i) => raw.slice(0, i).split('\n').length;
      let at = 0;
      for (;;) {
        const open = raw.indexOf('/*', at);
        const close = raw.indexOf('*/', at);
        if (close !== -1 && (open === -1 || close < open)) {
          fail('HIGH', 'css', `${rel}:${lineAt(close)} — a \`*/\` closes no comment. Everything between the previous \`*/\` and this one is being parsed as CSS, and the rule after it is discarded (docs/43 §12)`);
          break;
        }
        if (open === -1) break;
        const end = raw.indexOf('*/', open + 2);
        if (end === -1) { fail('HIGH', 'css', `${rel}:${lineAt(open)} — a comment is never closed; the rest of the file is inert`); break; }
        at = end + 2;
      }
    }

    const seen = new Map();
    for (const f of cssFiles) {
      for (const r of rulesOf(f)) if (!seen.has(r.sel)) seen.set(r.sel, r);
    }
    const probe = [...seen.values()]
      .map((r) => {
        const test = neutralise(r.sel);
        return { ...r, test, ...splitContext(test) };
      })
      .filter((r) => r.test && r.test !== '*');

    const alive = new Set();
    const unparseable = new Set();
    const liveContext = new Set();
    const markupClasses = new Set();
    const unroledLists = new Set();
    /* Two page sets, and the difference is the whole point.

       ALIVENESS is judged on the SHIPPED pages only. /styleguide is built
       into dist/ and deployed to nobody, and it demos the type scale with
       Arabic samples — so `:lang(ar) .t-h3` matches there and nowhere else.
       Judged across both sets, the Arabic heading rule this section exists to
       catch reads as live. A rule that applies only on a page no visitor can
       open has, for every visitor, never applied.

       VOCABULARY — which class names exist at all — is gathered from both,
       because a class demoed on /styleguide is a real class, and a rule
       targeting it is a broken assertion rather than absent scaffolding. */
    const CSS_PAGES = SHIPPED.filter((f) => fs.existsSync(path.join(DIST, f)));
    const VOCAB_ONLY = [...new Set(PAGES)]
      .filter((f) => !CSS_PAGES.includes(f) && fs.existsSync(path.join(DIST, f)));
    for (const page of [...CSS_PAGES, ...VOCAB_ONLY]) {
      const vocabOnly = VOCAB_ONLY.includes(page);
      const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      for (const lang of ['en', 'ar']) {
        if (lang === 'ar') {
          const toggled = await p.evaluate(() => {
            const el = document.querySelector('[data-lang="ar"]');
            if (!el) return false;
            el.click();
            return true;
          });
          if (!toggled) continue;
          await p.waitForTimeout(150);
        }
        const res = await p.evaluate((rows) => {
          const hit = [], bad = [], ctx = [], classes = [];
          for (const r of rows) {
            try { if (document.querySelector(r.test)) hit.push(r.sel); }
            catch { bad.push(r.sel); }
            if (r.context) { try { if (document.querySelector(r.context)) ctx.push(r.sel); } catch { /* judged unknowable below */ } }
          }
          for (const el of document.querySelectorAll('*')) el.classList.forEach((c) => classes.push(c));
          /* A list whose marker CSS removes also loses its list semantics in
             Safari/VoiceOver — it stops being announced as "list, 4 items".
             `01-reset.css` carries the opt-in idiom `ul[role="list"]` for
             exactly this, and for a long time no list in the markup opted in.
             Every list that strips its marker must carry the role. */
          const unroled = [];
          for (const el of document.querySelectorAll('ul, ol')) {
            if (getComputedStyle(el).listStyleType !== 'none') continue;
            if (el.getAttribute('role') === 'list') continue;
            unroled.push(el.getAttribute('class') || `<${el.tagName.toLowerCase()}> with no class`);
          }
          return { hit, bad, ctx, classes, unroled };
        }, probe);
        res.classes.forEach((c) => markupClasses.add(c));
        if (!vocabOnly) for (const cls of res.unroled) unroledLists.add(`${page} (${lang}): ${cls}`);
        if (vocabOnly) continue;
        res.hit.forEach((s) => alive.add(s));
        res.bad.forEach((s) => unparseable.add(s));
        res.ctx.forEach((s) => liveContext.add(s));
      }
      await p.close();
    }

    /* A dead selector is a BROKEN ASSERTION — not merely unused — when both
       halves of it exist and only the combination does not: the condition
       matches something, and every class it targets appears in the markup
       somewhere else. That is the exact shape of the Arabic heading rule:
       `:lang(ar)` matched, `.t-h1` existed on /styleguide, and no heading on
       the site ever carried both.

       If the condition itself matches nothing, or the target class exists
       nowhere at all, the whole branch is scaffolding the site has not used —
       inert, and reported as one line rather than fifteen. */
    const dead = probe.filter((r) => !alive.has(r.sel) && !unparseable.has(r.sel) && !r.allowed);
    const isBroken = (r) => r.context && liveContext.has(r.sel)
      && classesIn(r.target).length > 0
      && classesIn(r.target).every((c) => markupClasses.has(c));
    const broken = dead.filter(isBroken);
    const inert = dead.filter((r) => !isBroken(r));

    for (const r of broken) {
      fail('HIGH', 'css', `${r.file}:${r.line} — \`${r.sel}\` matches nothing on any page in either language, so the rule has never applied (docs/43 §12)`);
    }
    /* Reported as a count per file rather than 163 names on one line. These
       are not defects — /styleguide demos a design system larger than the
       site has ordered — but they are bytes, and the single-file build inlines
       every one of them into every page a visitor downloads. Whether to prune
       is an owner's call; the number is here so it is a choice. */
    if (inert.length) {
      const perFile = {};
      for (const r of inert) perFile[r.file] = (perFile[r.file] || 0) + 1;
      const summary = Object.entries(perFile)
        .sort((a, b) => b[1] - a[1])
        .map(([f, n]) => `${path.basename(f)} ${n}`)
        .join(', ');
      fail('LOW', 'css', `${inert.length} selector(s) style nothing any visitor can see — demoed on /styleguide or left behind, and inlined into every shipped page regardless: ${summary}`);
    }
    if (unroledLists.size) {
      const shown = [...unroledLists].slice(0, 6).join(' · ');
      fail('HIGH', 'a11y', `${unroledLists.size} list(s) remove their marker without \`role="list"\`, so Safari and VoiceOver stop announcing them as lists: ${shown}${unroledLists.size > 6 ? ' …' : ''} (docs/43 §14)`);
    }
    if (unparseable.size) {
      fail('LOW', 'css', `${unparseable.size} selector(s) this check could not evaluate: ${[...unparseable].slice(0, 4).join(' | ')}`);
    }
  }
};
