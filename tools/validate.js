#!/usr/bin/env node
/* =============================================================================
   VALIDATE — the Phase 12 walkthroughs, as a command.

   Stage 16 measured this site once and the scripts lived in an untracked
   scratchpad, so nothing could be re-run and the claims rotted quietly. This
   file is the fix: the journeys Phase 05 defined, checked against the built
   site, on demand.

   It walks what a buyer actually does, not what the markup contains:

     1  every internal link and anchor on every page resolves
     2  FLOW A — price-led: a package CTA carries its package, its price and
        its billing into WhatsApp, the card answers what the price buys, and
        the choice survives a round trip to the form
     3  FLOW B — verification-led: the band names a person and offers
        something a stranger can check
     4  the chosen language survives navigation between pages, with no
        horizontal overflow in Arabic
     5  the site still works with JavaScript disabled — navigation, prices,
        WhatsApp links, the scope-fact disclosure
     6  a keyboard reaches a package CTA and the disclosure, painting a ring
     7  the drawer — a phone's only map of the site — offers every destination

   Usage:  node tools/validate.js
   Needs:  playwright-core and a Chromium. Set PLAYWRIGHT_CHROMIUM to the
           binary if it is not where Playwright usually puts it. Without them
           the command says so and exits 0, because a missing test tool is not
           a failing site.
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index.html', 'pricing.html', 'about.html', 'story.html', 'privacy.html', '404.html'];

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  console.log('validate: playwright-core is not installed — skipping.');
  console.log('          npm i -D playwright-core, then re-run.');
  process.exit(0);
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.png': 'image/png' };

/* Its own server, so the command has no setup step. The site is static; this
   is the smallest thing that can serve it. */
function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const findings = [];
const fail = (sev, flow, text) => { findings.push({ sev, flow, text }); console.log(`  ${sev}  [${flow}] ${text}`); };

(async () => {
  const server = await serve();
  const BASE = `http://127.0.0.1:${server.address().port}`;
  const exe = process.env.PLAYWRIGHT_CHROMIUM;
  const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });

  /* 1 — links */ {
    const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    for (const page of PAGES) {
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' }); await p.waitForTimeout(400);
      const { links, ids } = await p.evaluate(() => ({
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        ids: [...document.querySelectorAll('[id]')].map((e) => e.id),
      }));
      for (const href of new Set(links)) {
        if (href.startsWith('#') && href !== '#' && !ids.includes(href.slice(1))) fail('HIGH', 'links', `${page}: dead anchor ${href}`);
        if (href.startsWith('./') && href.endsWith('.html') && !fs.existsSync(path.join(ROOT, href.slice(2)))) fail('HIGH', 'links', `${page}: missing target ${href}`);
      }
    }
    await p.context().close();
  }

  /* 2 — Flow A, both widths */
  for (const [width, label] of [[1280, 'desktop'], [390, 'mobile']]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(600);
    const cta = await p.evaluate(() => {
      const a = document.querySelector('[data-about="social:soc-growth"]');
      return a ? decodeURIComponent(a.getAttribute('href')) : null;
    });
    if (!cta) fail('HIGH', 'A', `${label}: no CTA carries social:soc-growth`);
    else {
      if (!/Social Growth/.test(cta)) fail('HIGH', 'A', `${label}: the message does not name the package`);
      if (!/400 USD/.test(cta)) fail('HIGH', 'A', `${label}: the message does not carry the price`);
      if (!/monthly/i.test(cta)) fail('MED', 'A', `${label}: the message omits the billing period`);
    }
    const facts = await p.evaluate(() => {
      const card = document.querySelector('[data-about="social:soc-growth"]')?.closest('.c-tier');
      return card ? card.querySelectorAll('.c-tier__facts dd').length : 0;
    });
    if (facts < 3) fail('MED', 'A', `${label}: the card shows ${facts} scope facts, expected 3`);
    await p.evaluate(() => { const a = document.querySelector('[data-about="social:soc-growth"]'); a.addEventListener('click', (e) => e.preventDefault(), { capture: true }); a.click(); });
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(600);
    const pre = await p.evaluate(() => document.querySelector('[data-contact-about]')?.value);
    if (pre !== 'social:soc-growth') fail('HIGH', 'A', `${label}: the form forgot the package (got "${pre}")`);
    await ctx.close();
  }

  /* 3 — Flow B */ {
    const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const band = await p.evaluate(() => {
      const v = document.querySelector('.c-verify');
      return v && { name: v.querySelector('.c-verify__name')?.textContent.trim(), links: [...v.querySelectorAll('a')].map((a) => a.href) };
    });
    if (!band) fail('HIGH', 'B', 'no verification band');
    else {
      if (!band.name) fail('HIGH', 'B', 'the band names nobody');
      if (!band.links.length) fail('HIGH', 'B', 'the band offers nothing to check');
      band.links.filter((l) => !/^https?:/.test(l)).forEach((l) => fail('MED', 'B', `proof link is not off-site: ${l}`));
    }
    await p.context().close();
  }

  /* 4 — language persistence */ {
    const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.evaluate(() => { const b = [...document.querySelectorAll('button,a')].filter((x) => /^\s*AR\s*$/i.test(x.textContent)); b[0]?.click(); });
    await p.waitForTimeout(500);
    for (const page of ['pricing.html', 'about.html', 'story.html']) {
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' }); await p.waitForTimeout(500);
      const r = await p.evaluate(() => ({ lang: document.documentElement.lang, over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }));
      if (!r.lang.startsWith('ar')) fail('HIGH', 'lang', `${page}: language did not persist (${r.lang})`);
      if (r.over) fail('HIGH', 'lang', `${page}: horizontal overflow in Arabic`);
    }
    await p.context().close();
  }

  /* 5 — no JavaScript */ {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
    const p = await ctx.newPage();
    for (const page of ['index.html', 'pricing.html']) {
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' }); await p.waitForTimeout(200);
      const r = await p.evaluate(() => ({
        nav: document.querySelectorAll('.c-header a[href]').length,
        prices: document.querySelectorAll('.c-tier__amount').length,
        wa: [...document.querySelectorAll('[data-wa]')].filter((a) => /^https:\/\/wa\.me/.test(a.getAttribute('href'))).length,
        details: document.querySelectorAll('.c-tier__terms').length,
      }));
      if (r.nav < 4) fail('HIGH', 'nojs', `${page}: navigation missing (${r.nav} links)`);
      if (r.prices < 12) fail('HIGH', 'nojs', `${page}: prices missing`);
      if (r.wa < 1) fail('HIGH', 'nojs', `${page}: WhatsApp CTAs are not real links`);
      if (r.details < 1) fail('MED', 'nojs', `${page}: the scope-fact disclosure is missing`);
    }
    await ctx.close();
  }

  /* 6 — keyboard */ {
    const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p.goto(`${BASE}/pricing.html`, { waitUntil: 'load' }); await p.waitForTimeout(500);
    let cta = false; let summary = false; let ringless = 0;
    for (let i = 0; i < 120; i += 1) {
      await p.keyboard.press('Tab');
      const el = await p.evaluate(() => {
        const a = document.activeElement; if (!a) return null;
        const cs = getComputedStyle(a);
        return { wa: a.hasAttribute('data-wa'), summary: a.tagName === 'SUMMARY', ring: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' };
      });
      if (!el) break;
      if (el.wa) cta = true;
      if (el.summary) summary = true;
      if (!el.ring) ringless += 1;
    }
    if (!cta) fail('HIGH', 'keyboard', 'no package CTA is reachable by keyboard on /pricing');
    if (!summary) fail('MED', 'keyboard', 'the scope-fact disclosure is not reachable by keyboard');
    if (ringless > 3) fail('MED', 'keyboard', `${ringless} focus stops painted no visible ring`);
    await p.context().close();
  }

  /* 7 — the drawer */ {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(600);
    const items = await p.evaluate(async () => {
      document.querySelector('[data-menu-trigger]')?.click();
      await new Promise((r) => setTimeout(r, 400));
      const m = document.getElementById('site-menu');
      return m ? [...m.querySelectorAll('a')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()) : null;
    });
    if (!items) fail('MED', 'drawer', 'the menu did not open');
    else ['Home', 'Services', 'Pricing', 'Story', 'Process', 'About', 'Contact']
      .filter((want) => !items.some((t) => t.includes(want)))
      .forEach((want) => fail('MED', 'drawer', `the drawer does not offer ${want}`));
    await ctx.close();
  }

  await browser.close();
  server.close();

  const high = findings.filter((f) => f.sev === 'HIGH').length;
  console.log(`\nvalidate: ${findings.length} finding(s)${findings.length ? '' : ' — every journey walked cleanly'}`);
  process.exit(high ? 1 : 0);
})();
