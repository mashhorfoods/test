/* =============================================================================
   A11Y — the built site, through a real accessibility engine.

   WHY A THIRD HARNESS RATHER THAN A SECTION IN qa.js.
   `validate.js` walks what a buyer does and `qa.js` asserts things we decided.
   Both are OUR opinions about our own work, written by the same person who
   wrote the markup — which is exactly the blind spot an accessibility check
   needs to avoid. This one runs axe-core, an engine nobody here wrote, against
   the pages as deployed. It is separate so that its failures are legible on
   their own rather than buried in another tool's tail.

   WHAT IT DOES NOT DO. Automated testing catches somewhere around a third to a
   half of real accessibility defects. It cannot tell you that alt text is
   wrong, that a heading is a lie, that focus order is confusing, or that the
   page is incomprehensible read aloud. `docs/43` §4 has always said a screen
   reader pass is outstanding; a clean run here does not retire that, and this
   file says so out loud so that nobody quotes a green line as if it did.

   WHAT IT COVERS THAT A SINGLE PASS WOULD MISS:
     - both viewports, because a rule that hides things on phones is exactly
       how eight package CTAs disappeared once already (`docs/55` §3)
     - both languages, because Arabic swaps `dir`, the fonts and every visible
       string, and contrast is computed on what is actually painted
     - the mobile drawer OPEN, because a dialog that traps nothing and labels
       nothing looks perfect while it is shut

   Zero runtime dependencies is untouched: axe is injected into a headless
   browser during the check and never reaches a visitor.

   Run:  npm run a11y      (also part of `npm run check`)
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

let chromium, axeSource;
try {
  ({ chromium } = require('playwright-core'));
  axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
} catch {
  console.log('a11y: playwright-core or axe-core is not installed — skipping.');
  process.exit(0);
}

const { SHIP } = require('./build-zip');
const PAGES = SHIP.filter((f) => f.endsWith('.html') && fs.existsSync(path.join(DIST, f)));

const findings = [];
const fail = (sev, text) => { findings.push({ sev, text }); console.log(`  ${sev}  [a11y] ${text}`); };

/* axe's own severity, kept rather than re-invented. `critical` and `serious`
   are things a real user cannot get past; `moderate` and `minor` are things
   that make the page worse without closing it. Only the first two block. */
const SEV = { critical: 'HIGH', serious: 'HIGH', moderate: 'MED', minor: 'LOW' };

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm' };

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    let file = path.join(DIST, rel);
    if (!fs.existsSync(file) && fs.existsSync(`${file}.html`)) file = `${file}.html`;
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

(async () => {
  const server = await serve();
  const BASE = `http://127.0.0.1:${server.address().port}`;
  const exe = process.env.PLAYWRIGHT_CHROMIUM;
  const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });

  /* WCAG 2.0 and 2.1, levels A and AA. Not `best-practice`: those are axe's
     house style rather than the standard, and a harness that reports opinions
     alongside failures teaches people to skim it. */
  const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

  /* Seen once, reported once. The same footer link on seven pages is one
     defect with seven addresses, and printing it seven times hides the six
     other things in the list. Keyed by rule AND node, because axe returns one
     violation object carrying every node that broke that rule — filtering or
     counting a violation whole would hide a second, real failure behind an
     exception granted to the first. */
  const seen = new Map();
  const exempted = new Set();

  /* THE ONE NAMED EXCEPTION.
     `.c-footer__mark` is the 176px "PIXORA" watermark at the foot of every
     page: #434343 on #141414, a ratio of 1.86 where AA wants 3. It is kept,
     and this is the argument.

     WCAG 1.4.3 exempts text that is pure decoration. This is that: the brand
     name is already in the footer twice as real text — the logo lockup and the
     copyright line — and once more in the header, so a reader who cannot make
     out the watermark loses nothing. Raising it to 3:1 would turn a texture
     into a headline and make the footer shout the name a fourth time, loudest.

     THE EXCEPTION IS CONDITIONAL, and the condition is re-checked on every
     run: the element must still be `aria-hidden`, and the footer must still
     carry the brand name as text that is not. The day the watermark becomes
     the only place the name appears, it stops being decoration and this
     exception lapses on its own rather than outliving its reason. */
  const EXEMPT = { rule: 'color-contrast', target: '.c-footer__mark' };
  const stillDecorative = async (p) => p.evaluate((sel) => {
    const mark = document.querySelector(sel);
    if (!mark || mark.getAttribute('aria-hidden') !== 'true') return false;
    const footer = mark.closest('footer') || document.body;

    /* Text nodes, not elements. The copyright line reads "© 2026 Pixora." out
       of three nodes — a literal, a <span> holding the year, and another
       literal — so an element-level test finds the name nowhere and revokes
       the exception for a page that is perfectly fine. The first version of
       this guard did exactly that. Walking text is what the reader does. */
    const walk = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
    let text = '';
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (n.parentElement && n.parentElement.closest('[aria-hidden="true"]')) continue;
      text += n.nodeValue;
    }
    return /pixora/i.test(text);
  }, EXEMPT.target);

  const scan = async (page, { width, height, lang, label, before }) => {
    const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
    await p.waitForTimeout(500);

    if (lang === 'ar') {
      await p.click('.c-lang__option[data-lang="ar"]');
      await p.waitForTimeout(500);
    }
    if (before) await before(p);

    await p.addScriptTag({ content: axeSource });
    const res = await p.evaluate((tags) => window.axe.run(document, {
      runOnly: { type: 'tag', values: tags },
      resultTypes: ['violations'],
    }), TAGS);

    const decorative = await stillDecorative(p);
    const where = `${page} @${width} ${lang}${label ? ` ${label}` : ''}`;

    for (const v of res.violations) {
      for (const node of v.nodes) {
        const target = node.target.join(' ');
        if (v.id === EXEMPT.rule && target === EXEMPT.target) {
          if (decorative) { exempted.add(where); continue; }
          /* The guard failed: the watermark is no longer decoration, so the
             exception does not apply and this is an ordinary failure. */
        }
        const key = `${v.id}::${target}`;
        if (seen.has(key)) { seen.get(key).where.push(where); continue; }
        seen.set(key, { v, node, target, where: [where] });
      }
    }
    await ctx.close();
  };

  for (const page of PAGES) {
    await scan(page, { width: 390, height: 844, lang: 'en' });
    await scan(page, { width: 1440, height: 900, lang: 'en' });
    await scan(page, { width: 1440, height: 900, lang: 'ar' });
  }

  /* The drawer, open. Nothing above ever sees it: it is shut on load, and a
     dialog is at its most dangerous when it is the thing on screen. */
  await scan('index.html', {
    width: 390, height: 844, lang: 'en', label: 'drawer open',
    before: async (p) => {
      await p.click('[data-menu-trigger]');
      await p.waitForTimeout(700);
      /* Assert it actually opened. A scan of a drawer that silently stayed
         shut is a clean result about nothing, which is the failure mode this
         whole file exists to avoid. */
      const open = await p.$eval('[data-drawer]', (el) => el.getAttribute('aria-hidden') !== 'true' && el.getBoundingClientRect().width > 0);
      if (!open) fail('MED', 'the drawer did not open for its scan — that view was never tested');
    },
  });

  for (const { v, target, where } of seen.values()) {
    const sev = SEV[v.impact] || 'MED';
    const at = where.length > 3 ? `${where.slice(0, 3).join(', ')} +${where.length - 3} more` : where.join(', ');
    fail(sev, `${v.id} (${v.impact}) — ${v.help}\n         ${target}\n         ${at}`);
  }

  await browser.close();
  server.close();

  const by = (s) => findings.filter((f) => f.sev === s).length;
  console.log(`\na11y: ${findings.length} axe violation(s) — ${by('HIGH')} high, ${by('MED')} medium, ${by('LOW')} low`);
  if (exempted.size) {
    console.log(`      1 exempted: ${EXEMPT.rule} on ${EXEMPT.target}, on ${exempted.size} view(s).`);
    console.log('      Decorative, argued for in this file. Re-verified as decorative on every run.');
  }
  console.log('      Automated rules catch roughly a third of real defects. A screen-reader');
  console.log('      pass is still outstanding — see docs/43 §4.');
  process.exit(by('HIGH') ? 1 : 0);
})();
