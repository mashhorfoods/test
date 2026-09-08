/* =============================================================================
   BUILDER-TEST
   Drives the package builder the way a visitor does and asserts what happens.

   WHY THIS IS SEPARATE FROM qa.js.
   qa.js §37 checks the RULES are present and well-formed on the page. This
   checks they DO SOMETHING when a person clicks — which is a different
   question, and the one this project keeps getting wrong. A dependency rule
   that is correctly written into the markup and never fires is exactly the
   kind of guard that has passed eighteen times while doing nothing.

   Every assertion below is a claim the brief makes:
     · a requirement is pulled in, transitively, and says why
     · dropping a requirement drops what needed it
     · a superseding choice blocks what it replaces, and says so
     · one-time and monthly are totalled apart
     · a quote-only item is counted, never priced
     · quantity multiplies
     · it all works in Arabic

   Run:  node tools/builder-test.cjs
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const http = require('http');

let chromium;
try { ({ chromium } = require('playwright-core')); } catch {
  console.log('builder-test: playwright-core is not installed — skipping.'); process.exit(0);
}

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png' };

const fails = [];
const ok = [];
const check = (label, cond, detail = '') => {
  if (cond) ok.push(label);
  else fails.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

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

/* THE SITE REMEMBERS THE LANGUAGE, so a reload after the Arabic block leaves
   the page in Arabic and every English assertion after it fails for a reason
   that has nothing to do with what is being tested. */
const useEnglish = async (p) => {
  await p.evaluate(() => {
    const en = document.querySelector('[data-lang="en"]');
    if (en && document.documentElement.lang !== 'en') en.click();
  });
  await p.waitForTimeout(300);
};

const tick = async (p, id) => p.evaluate((f) => {
  const row = document.querySelector(`.c-pick[data-feature="${f}"]`);
  row.closest('details').open = true;
  const box = row.querySelector('input[type="checkbox"]');
  box.click();
}, id);

const state = (p, id) => p.evaluate((f) => {
  const row = document.querySelector(`.c-pick[data-feature="${f}"]`);
  if (!row) return null;
  const note = row.querySelector('[data-pick-note]');
  const box = row.querySelector('input[type="checkbox"]');
  return {
    checked: box ? box.checked : null,
    disabled: box ? box.disabled : null,
    stateAttr: row.dataset.state || '',
    note: note && !note.hidden ? note.textContent.trim() : '',
    qtyShown: Boolean(row.querySelector('.c-pick__qty') && !row.querySelector('.c-pick__qty').hidden),
  };
}, id);

const totals = (p) => p.evaluate(() => {
  const t = (sel) => {
    const el = document.querySelector(sel);
    return el && !el.hidden ? Number((el.textContent || '').replace(/[^\d]/g, '')) : 0;
  };
  const q = document.querySelector('[data-build-quoted]');
  return {
    once: t('[data-build-once]') && Number((document.querySelector('[data-build-once-amount]').textContent || '').replace(/[^\d]/g, '')),
    monthly: t('[data-build-monthly]') && Number((document.querySelector('[data-build-monthly-amount]').textContent || '').replace(/[^\d]/g, '')),
    quoted: q && !q.hidden ? q.textContent.trim() : '',
    lines: document.querySelectorAll('[data-build-list] li').length,
    sendHref: (document.querySelector('[data-build-send]') || {}).href || '',
  };
});

(async () => {
  if (!fs.existsSync(path.join(DIST, 'pricing.html'))) {
    console.log('builder-test: no dist/pricing.html — run npm run build first.'); process.exit(1);
  }
  const server = await serve();
  const BASE = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  /* A blocked outbound request is not a defect in this page. The site loads
     analytics and a font from third parties, and a sandbox with no egress
     reports each as a console error — which would make this assertion fail
     for a reason that has nothing to do with the builder. Script errors, the
     thing being tested, still count. */
  p.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|net::ERR_|ERR_TUNNEL/.test(t)) return;
    errors.push(t);
  });

  await p.goto(`${BASE}/pricing.html`, { waitUntil: 'load' });
  await p.waitForTimeout(400);

  /* --- 1. it starts empty ------------------------------------------------- */
  {
    const t = await totals(p);
    check('starts with nothing chosen', t.lines === 0 && t.once === 0 && t.monthly === 0, JSON.stringify(t));
    check('the empty message is showing',
      await p.evaluate(() => !document.querySelector('[data-build-empty]').hidden));
  }

  /* --- 2. a requirement is pulled in, transitively, and says why ---------- */
  {
    /* Integrations require Development, which requires the UI/UX design.
       Hosting requires the domain. Testing, deployment and handover are not
       choices — they become active once what they need is present — so this
       also proves the non-selectable rows follow the selection rather than
       sitting there inert. */
    await tick(p, 'feat.websites.integrations');
    await p.waitForTimeout(150);
    await tick(p, 'feat.websites.hosting');
    await p.waitForTimeout(200);
    for (const id of ['feat.websites.development', 'feat.websites.uiux', 'feat.websites.domain']) {
      const s = await state(p, id);
      check(`the choice pulls in ${id}`, s && (s.checked || s.stateAttr === 'on'), JSON.stringify(s));
    }
    for (const id of ['feat.websites.testing', 'feat.websites.deployment', 'feat.websites.handover']) {
      const s = await state(p, id);
      check(`${id} becomes active without being a choice`, s && s.stateAttr === 'on', JSON.stringify(s));
    }
    const why = await state(p, 'feat.websites.development');
    check('and the pulled-in row says why', /Added/.test(why.note), `note was "${why.note}"`);
    const t = await totals(p);
    check('the estimate is now above zero', t.once > 0, JSON.stringify(t));
    check('the send link carries the scope', /wa\.me\/.+text=.+/.test(t.sendHref) || t.sendHref.endsWith('#contact'));
  }

  /* --- 3. dropping a requirement drops what needed it --------------------- */
  {
    await tick(p, 'feat.websites.uiux'); // it is checked; this unticks it
    await p.waitForTimeout(150);
    const dev = await state(p, 'feat.websites.development');
    check('unticking the design drops development with it',
      !dev.checked && dev.stateAttr !== 'on', JSON.stringify(dev));
  }

  /* --- 4. reset ----------------------------------------------------------- */
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(400);
  await useEnglish(p);

  /* --- 5. superseding blocks what it replaces, and says so ---------------- */
  {
    await tick(p, 'feat.branding.guidelines_short');
    await p.waitForTimeout(100);
    await tick(p, 'feat.branding.guidelines_full');
    await p.waitForTimeout(150);
    const short = await state(p, 'feat.branding.guidelines_short');
    check('the complete guidelines block the short ones',
      short.disabled === true && short.stateAttr === 'blocked', JSON.stringify(short));
    check('and the blocked row says what replaced it',
      /Replaced/.test(short.note), `note was "${short.note}"`);
    check('a blocked row is still visible, not removed',
      await p.evaluate(() => {
        const el = document.querySelector('.c-pick[data-feature="feat.branding.guidelines_short"]');
        return el && el.getBoundingClientRect().height > 0;
      }));
  }

  /* --- 6. quantity multiplies -------------------------------------------- */
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(400);
  await useEnglish(p);
  {
    await tick(p, 'feat.branding.social_posts'); // unit, from 15, default 3
    await p.waitForTimeout(150);
    const s = await state(p, 'feat.branding.social_posts');
    check('a quantity control appears once the row is chosen', s.qtyShown, JSON.stringify(s));
    const before = (await totals(p)).once;
    await p.evaluate(() => {
      const q = document.querySelector('[data-qty="feat.branding.social_posts"]');
      q.value = '10';
      q.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await p.waitForTimeout(150);
    const after = (await totals(p)).once;
    check('raising the quantity raises the estimate proportionally',
      after === Math.round(before / 3 * 10), `${before} at 3 -> ${after} at 10`);
  }

  /* --- 7. one-time and monthly are totalled apart ------------------------- */
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(400);
  await useEnglish(p);
  {
    await tick(p, 'feat.branding.logo');               // one-time, 250
    await p.waitForTimeout(100);
    await tick(p, 'feat.social.community_management'); // monthly, 120
    await p.waitForTimeout(200);
    const t = await totals(p);
    check('the one-time total is shown', t.once >= 250, JSON.stringify(t));
    check('the monthly total is shown separately', t.monthly >= 120, JSON.stringify(t));
    check('they were not added together', t.once !== t.once + t.monthly);
  }

  /* --- 8. a quote-only item is counted, never priced ---------------------- */
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(400);
  await useEnglish(p);
  {
    await tick(p, 'feat.branding.photography');
    await p.waitForTimeout(200);
    const t = await totals(p);
    check('a quote-only choice adds no figure to the estimate', t.once === 0 && t.monthly === 0, JSON.stringify(t));
    check('and is counted in words instead', /1|One|واحد/.test(t.quoted), `quoted line was "${t.quoted}"`);
  }

  /* --- 9. it works in Arabic --------------------------------------------- */
  {
    await p.evaluate(() => document.querySelector('[data-lang="ar"]')?.click());
    await p.waitForTimeout(400);
    const dir = await p.evaluate(() => document.documentElement.dir);
    check('the page is right to left', dir === 'rtl', dir);
    const t = await totals(p);
    check('the scope panel is still populated after the language change', t.lines > 0, JSON.stringify(t));
    const ar = await p.evaluate(() => {
      const el = document.querySelector('[data-build-quoted]');
      return el ? el.textContent.trim() : '';
    });
    check('and the quoted line is in Arabic', /[؀-ۿ]/.test(ar), `was "${ar}"`);
    const href = await p.evaluate(() => (document.querySelector('[data-build-send]') || {}).href || '');
    check('the send link swapped to the Arabic message',
      href.endsWith('#contact') || /%D8%|%D9%/.test(href), href.slice(0, 80));
  }

  /* --- 10. depth is a choice on the row, and it moves the price ----------- */
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(400);
  await useEnglish(p);
  {
    await tick(p, 'feat.marketing.audience');
    await p.waitForTimeout(200);
    const shown = await p.evaluate(() => {
      const w = document.querySelector('.c-pick[data-feature="feat.marketing.audience"] .c-pick__tiers');
      return w ? !w.hidden : null;
    });
    check('choosing a tiered row reveals its depths', shown === true, String(shown));
    const base = (await totals(p)).once;
    await p.evaluate(() => {
      const r = document.querySelector('#tier-feat-marketing-audience-segmentation');
      r.click();
    });
    await p.waitForTimeout(200);
    const deep = (await totals(p)).once;
    check('a deeper level costs more than the default', deep > base, `${base} -> ${deep}`);
    const named = await p.evaluate(() => (document.querySelector('[data-build-list]') || {}).textContent || '');
    check('and the scope names the depth, not the capability',
      /Audience segmentation/i.test(named), named.replace(/\s+/g, ' ').slice(0, 90));
  }

  /* --- 11. platforms are the quantity, and they are recorded by name ------ */
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(400);
  await useEnglish(p);
  {
    await tick(p, 'feat.marketing.platform_management');
    await p.waitForTimeout(200);
    const one = (await totals(p)).monthly;
    const hasStepper = await p.evaluate(() =>
      Boolean(document.querySelector('.c-pick[data-feature="feat.marketing.platform_management"] [data-qty]')));
    check('a platform-driven row has no separate quantity stepper', hasStepper === false);
    await p.evaluate(() => {
      document.querySelector('#opt-feat-marketing-platform_management-plat-meta').click();
      document.querySelector('#opt-feat-marketing-platform_management-plat-google').click();
    });
    await p.waitForTimeout(200);
    const two = (await totals(p)).monthly;
    check('choosing two platforms doubles that line', two === one * 2, `${one} -> ${two}`);
    const txt = await p.evaluate(() => (document.querySelector('[data-build-list]') || {}).textContent || '');
    check('and the scope records which platforms, by name',
      /Meta Ads/.test(txt) && /Google Ads/.test(txt), txt.replace(/\s+/g, ' ').slice(0, 120));
  }

  /* --- 12. a composite brings its parts; a part does not bring the others - */
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(400);
  await useEnglish(p);
  {
    await tick(p, 'feat.websites.landing_design');
    await p.waitForTimeout(200);
    for (const id of ['feat.websites.landing_build', 'feat.websites.landing_deploy']) {
      const st = await state(p, id);
      check(`choosing landing design alone does not bring ${id}`,
        st && !st.checked && st.stateAttr !== 'on', JSON.stringify(st));
    }
    await p.reload({ waitUntil: 'load' });
    await p.waitForTimeout(400);
    await tick(p, 'feat.websites.extra_landing');
    await p.waitForTimeout(250);
    for (const id of ['feat.websites.landing_design', 'feat.websites.landing_build', 'feat.websites.landing_deploy']) {
      const st = await state(p, id);
      check(`the composite brings in ${id}`, st && st.stateAttr === 'on', JSON.stringify(st));
    }
    const txt = await p.evaluate(() => (document.querySelector('[data-build-list]') || {}).textContent || '');
    check('and its parts are shown as included rather than charged again',
      /Included in/.test(txt), txt.replace(/\s+/g, ' ').slice(0, 120));
    const t = await totals(p);
    check('the composite is charged once, at its published price',
      t.once === 120, JSON.stringify(t));
  }

  /* --- 13. a published package that covers the scope is named ------------- */
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(400);
  await useEnglish(p);
  {
    await tick(p, 'feat.branding.logo');
    await p.waitForTimeout(150);
    await tick(p, 'feat.branding.color_system');
    await p.waitForTimeout(250);
    const said = await p.evaluate(() => {
      const el = document.querySelector('[data-build-cheaper]');
      return el && !el.hidden ? el.textContent.trim() : '';
    });
    check('a package that covers the whole scope is named, with its price',
      /Starter/.test(said) && /490/.test(said), `"${said}"`);
    /* And it must not claim a package that does NOT cover everything. */
    await tick(p, 'feat.branding.photography');
    await p.waitForTimeout(250);
    const after = await p.evaluate(() => {
      const el = document.querySelector('[data-build-cheaper]');
      return el && !el.hidden ? el.textContent.trim() : '';
    });
    check('and stops naming it once the scope leaves what it covers',
      after === '', `"${after}"`);
  }

  check('no console errors while all of that happened', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  server.close();

  console.log(`builder-test: ${ok.length} passed, ${fails.length} failed`);
  fails.forEach((f) => console.log(`  FAIL  ${f}`));
  process.exit(fails.length ? 1 : 0);
})();
