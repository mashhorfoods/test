#!/usr/bin/env node
/* =============================================================================
   QA — Phase 18, release readiness, against the DEPLOYED artefact.

   validate.js walks the journeys on the source. This one audits what is
   actually uploaded — dist/, with its inlined CSS and JS and its external
   images — because that is the thing a visitor gets, and the two can differ.

   Groups, in the order the phase names them:

     1  DATA INTEGRITY  every price, name and billing in the markup matches
                        pricing.json, everywhere it appears
     2  CONTENT / SEO   title and description per page, canonical, og tags,
                        sitemap against the page list, robots
     3  ACCESSIBILITY   heading order, image alt and dimensions, form labels,
                        contrast against the computed background, off-site
                        links, reduced motion
     4  BILINGUAL       every English copy has an Arabic sibling; no string
                        left pending
     5  PERFORMANCE     bytes and requests per page, and the largest paint
     6  STATES          404, empty form validation, the WhatsApp fallback,
                        the scope-fact disclosure closed and open

   Usage:  node tools/qa.js        (run `node build.js` first)
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const pricing = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pricing.json'), 'utf8'));

let chromium;
try { ({ chromium } = require('playwright-core')); } catch {
  console.log('qa: playwright-core is not installed — skipping.'); process.exit(0);
}

const PAGES = cfg.pages.map((p) => p.file).filter((f) => fs.existsSync(path.join(DIST, f)));
const findings = [];
const fail = (sev, group, text) => { findings.push({ sev, group, text }); console.log(`  ${sev}  [${group}] ${text}`); };

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png' };

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    let file = path.join(DIST, rel);
    // The .htaccess rewrite, reproduced: /pricing serves pricing.html.
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

  /* The archive's manifest, not cfg.pages: several checks below are about what
     a VISITOR gets, and styleguide.html is built into dist/ but deliberately
     never shipped. */
  const { SHIP } = require('./build-zip');
  const SHIPPED = SHIP.filter((f) => f.endsWith('.html'));

  /* ---- 1 data integrity, 3 accessibility, 4 bilingual, 5 performance ---- */
  for (const page of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    let bytes = 0; let requests = 0;
    p.on('response', async (r) => {
      requests += 1;
      const len = Number(r.headers()['content-length'] || 0);
      bytes += len || 0;
    });
    await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
    await p.waitForTimeout(900);

    const r = await p.evaluate(() => {
      /* contrast, computed against the first painted ancestor background */
      const lum = (c) => {
        const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      /* Composite every semi-transparent layer over the one behind it. A tag
         painted as accent-at-14% over a dark ground is not the same colour as
         the accent, and comparing it to the accent reports 1:1 — a harness
         bug that would have buried a real finding. */
      const bgOf = (el) => {
        const layers = [];
        for (let n = el; n; n = n.parentElement) {
          const c = getComputedStyle(n).backgroundColor;
          const m = (c.match(/[\d.]+/g) || []).map(Number);
          if (!m.length) continue;
          const alpha = m.length > 3 ? m[3] : 1;
          if (alpha === 0) continue;
          layers.push({ rgb: m.slice(0, 3), alpha });
          if (alpha === 1) break;
        }
        if (!layers.length) return [0, 0, 0];
        let out = layers[layers.length - 1].alpha === 1 ? layers.pop().rgb : [0, 0, 0];
        for (let i = layers.length - 1; i >= 0; i -= 1) {
          const { rgb, alpha } = layers[i];
          out = out.map((v, k) => rgb[k] * alpha + v * (1 - alpha));
        }
        return out;
      };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

      const lowContrast = [];
      document.querySelectorAll('p,li,a,h1,h2,h3,h4,span,dd,dt,summary,label,button').forEach((el) => {
        if (!el.textContent.trim() || el.children.length) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || !el.getClientRects().length) return;
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
        const got = ratio(parse(cs.color), bgOf(el));
        if (got < (large ? 3 : 4.5)) lowContrast.push(`${el.tagName}.${(el.className || '').toString().split(' ')[0]} ${got.toFixed(2)}:1 "${el.textContent.trim().slice(0, 24)}"`);
      });

      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
      const skips = headings.filter((lv, i) => i && lv - headings[i - 1] > 1).length;

      const imgs = [...document.images];
      const enCopy = document.querySelectorAll('[data-lang-copy="en"]').length;
      const arCopy = document.querySelectorAll('[data-lang-copy="ar"]').length;

      return {
        lowContrast,
        skips,
        /* alt="" is the CORRECT marking for a decorative image, not a missing
           one — it tells a screen reader to skip it rather than read a
           filename. So the rule is: every image declares alt, and an empty one
           is only allowed where the image is genuinely decoration. An image
           with neither alt nor a decorative role is the real defect. */
        imgsNoAlt: imgs.filter((i) => {
          if (i.alt) return false;
          if (!i.hasAttribute('alt')) return true;
          return !(i.closest('[aria-hidden="true"]') || i.getAttribute('role') === 'presentation');
        }).length,
        imgsNoDims: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
        /* A data: URI is already in the document — there is no request to
           defer, and lazy-loading one only delays decoding something the
           browser already holds. The rule is about network cost, so it applies
           to images that cost a request. */
        imgsNoLazy: imgs.filter((i) => i.loading !== 'lazy' && !/^data:/i.test(i.getAttribute('src') || '')).length,
        unlabelled: [...document.querySelectorAll('input,select,textarea')]
          .filter((f) => !f.labels?.length && !f.getAttribute('aria-label') && !f.getAttribute('aria-labelledby')).length,
        blankNoRel: [...document.querySelectorAll('a[target="_blank"]')].filter((a) => !/noopener/.test(a.rel)).length,
        pending: document.querySelectorAll('[data-i18n-pending]').length,
        enCopy, arCopy,
        prices: [...document.querySelectorAll('.c-tier__amount')].map((e) => e.textContent.trim()),
        names: [...document.querySelectorAll('.c-tier__name')].map((e) => e.textContent.trim()),
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content || '',
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
        ogUrl: document.querySelector('meta[property="og:url"]')?.content || '',
        /* TEXT NODES. Two wrong versions preceded this one, and both passed the
           very page they were written to catch:
             1. `innerText` — rendering-aware, so on an English-default page it
                never saw the Arabic half at all, which is `display: none`.
             2. `textContent` on childless elements — but the sentence that
                carried the digits also carried a `<strong>`, so its span had a
                child and was skipped.
           Walking text is what a reader does, and it is the third time on this
           project that has been the answer. */
        arabicIndic: (() => {
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let n = 0;
          for (let t = walk.nextNode(); t; t = walk.nextNode()) {
            if (t.parentElement && t.parentElement.closest('script, style')) continue;
            n += (t.nodeValue.match(/[\u0660-\u0669]/g) || []).length;
          }
          return n;
        })(),
        lcp: performance.getEntriesByType('largest-contentful-paint').slice(-1)[0]?.startTime
          || performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    /* data integrity */
    if (r.prices.length) {
      const expected = pricing.categories.flatMap((c) => c.packages.map((k) => ({ name: k.name, price: k.price })));
      r.names.forEach((name, i) => {
        const want = expected.find((e) => e.name === name);
        if (!want) fail('HIGH', 'data', `${page}: card "${name}" is not in pricing.json`);
        else if (want.price !== r.prices[i]) fail('HIGH', 'data', `${page}: "${name}" shows ${r.prices[i]}, source says ${want.price}`);
      });
    }

    /* accessibility */
    if (r.skips) fail('MED', 'a11y', `${page}: ${r.skips} skipped heading level(s)`);
    if (r.imgsNoAlt) fail('HIGH', 'a11y', `${page}: ${r.imgsNoAlt} image(s) without alt`);
    if (r.imgsNoDims) fail('MED', 'a11y', `${page}: ${r.imgsNoDims} image(s) without width/height`);
    if (r.imgsNoLazy) fail('LOW', 'perf', `${page}: ${r.imgsNoLazy} image(s) not lazy-loaded`);
    if (r.unlabelled) fail('HIGH', 'a11y', `${page}: ${r.unlabelled} form control(s) without a label`);
    if (r.blankNoRel) fail('MED', 'security', `${page}: ${r.blankNoRel} new-tab link(s) without rel=noopener`);
    r.lowContrast.slice(0, 6).forEach((t) => fail('HIGH', 'a11y', `${page}: contrast ${t}`));

    /* bilingual */
    if (r.pending) fail('HIGH', 'i18n', `${page}: ${r.pending} string(s) still pending translation`);
    if (r.enCopy !== r.arCopy) fail('HIGH', 'i18n', `${page}: ${r.enCopy} English copies vs ${r.arCopy} Arabic`);
    /* ONE NUMERAL SYSTEM, SITE-WIDE. `docs/47` §2 and `docs/49` §7 settled this
       deliberately: prices, dates, delivery windows and `خطأ 404` all use 0-9,
       because a page whose prices are Western-numeralled and whose body text is
       not asks a reader to switch systems mid-sentence. It was recorded as
       "confirmed" and nothing kept it confirmed — the accessibility page was
       written months later and arrived with ٤٤ × ٤٤ and ١٫٨٦ in it. String
       parity cannot see this: both languages were present and counted. */
    if (r.arabicIndic) fail('MED', 'i18n', `${page}: ${r.arabicIndic} Arabic-Indic digit(s) — the site uses 0-9 in both languages (docs/47 §2)`);

    /* SEO */
    const meta = cfg.pages.find((x) => x.file === page) || {};
    if (!r.title || r.title.length > 65) fail('MED', 'seo', `${page}: title is ${r.title.length} chars`);
    if (!r.desc || r.desc.length < 50 || r.desc.length > 165) fail('MED', 'seo', `${page}: description is ${r.desc.length} chars`);
    if (meta.index !== false && !r.canonical) fail('HIGH', 'seo', `${page}: no canonical`);
    if (meta.index === false && r.canonical) fail('MED', 'seo', `${page}: noindex page carries a canonical`);
    if (meta.index !== false && !r.ogUrl) fail('MED', 'seo', `${page}: no og:url`);

    /* performance */
    const html = fs.statSync(path.join(DIST, page)).size;
    if (html > 600 * 1024) fail('MED', 'perf', `${page}: ${(html / 1024).toFixed(0)}KB of HTML`);
    if (r.lcp > 2500) fail('MED', 'perf', `${page}: largest paint at ${Math.round(r.lcp)}ms`);
    console.log(`  ·  ${page.padEnd(16)} ${(html / 1024).toFixed(0).padStart(4)}KB  ${String(requests).padStart(2)} req  paint ${Math.round(r.lcp)}ms  imgs ${r.imgsNoAlt === 0 ? 'alt ok' : 'ALT MISSING'}`);
    await ctx.close();
  }

  /* ---- 2 sitemap and robots ---- */
  {
    const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
    const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const { publicPath } = require('./build-deploy');
    const should = cfg.pages.filter((p) => p.index !== false).map((p) => `${cfg.url}/${publicPath(p.file)}`);
    should.filter((u) => !listed.includes(u)).forEach((u) => fail('HIGH', 'seo', `sitemap is missing ${u}`));
    listed.filter((u) => !should.includes(u)).forEach((u) => fail('MED', 'seo', `sitemap lists an unexpected ${u}`));
    /* The share card. A broken og:image is the one defect that is invisible
       everywhere except somebody else's chat window — the site looks perfect
       and the link previews as a grey strip. So the tag must exist on every
       indexed page, be absolute, and point at a file that actually shipped. */
    for (const page of cfg.pages.filter((p) => p.index !== false)) {
      const file = path.join(DIST, page.file);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      const og = html.match(/<meta property="og:image" content="([^"]+)"/);
      if (!og) { fail('MED', 'seo', `${page.file}: no og:image — links to it preview as a grey strip`); continue; }
      if (!/^https?:\/\//.test(og[1])) fail('HIGH', 'seo', `${page.file}: og:image is relative; every scraper ignores it`);
      const asset = path.join(DIST, og[1].replace(cfg.url, '').replace(/^\//, ''));
      if (!fs.existsSync(asset)) fail('HIGH', 'seo', `${page.file}: og:image points at ${og[1]}, which did not ship`);
    }

    /* The touch icon, checked for the same reason and with the same shape of
       failure: nothing on the page looks wrong, and an iPhone that saves the
       site to its home screen shows a screenshot instead of the mark.

       Three separate things go wrong here, so all three are asserted:
       the link must exist on every shipped page (four <head>s are maintained
       by hand and only this catches the one that was forgotten), it must NOT
       be a data: URI (Safari ignores those, silently), and the file must
       actually be in the archive. */
    for (const page of SHIPPED) {
      const file = path.join(DIST, page);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      const link = html.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/);
      if (!link) { fail('MED', 'seo', `${page}: no apple-touch-icon — an iPhone home-screen shortcut shows a screenshot of the page`); continue; }
      if (link[1].startsWith('data:')) { fail('HIGH', 'seo', `${page}: apple-touch-icon is a data: URI, which Safari ignores`); continue; }
      if (!fs.existsSync(path.join(DIST, link[1].replace(/^\.\//, '')))) {
        fail('HIGH', 'seo', `${page}: apple-touch-icon points at ${link[1]}, which did not ship`);
      }
    }

    const robots = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
    if (!robots.includes('Sitemap:')) fail('MED', 'seo', 'robots.txt does not point at the sitemap');
    /* A noindex page needs a Disallow only if it ships. styleguide.html is built
       into dist/ and deliberately kept out of the archive, so robots.txt stays
       silent about it — a Disallow would name a URL that returns 404 and would
       advertise an internal page to anyone reading the file. Its own
       `noindex, nofollow` meta is what protects it if it is ever uploaded. */
    cfg.pages.filter((p) => p.index === false && SHIP.includes(p.file)).forEach((p) => {
      if (!robots.includes(p.file)) fail('MED', 'seo', `robots.txt does not disallow ${p.file}`);
    });
    cfg.pages.filter((p) => p.index === false && !SHIP.includes(p.file)).forEach((p) => {
      const file = path.join(DIST, p.file);
      if (!fs.existsSync(file)) return;
      if (!/<meta name="robots" content="noindex/.test(fs.readFileSync(file, 'utf8'))) {
        fail('MED', 'seo', `${p.file} is not in the deployment and carries no noindex meta — nothing keeps it out of an index if it is ever uploaded`);
      }
    });
  }

  /* ---- 6 states ---- */
  {
    const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const states = await p.evaluate(() => {
      const form = document.querySelector('[data-contact-form]');
      /* Measure the <details>, not its child. While closed, the child keeps a
         bounding box that paints nothing (content-visibility: hidden), so
         asking the child whether it is visible gets a confident wrong answer
         — this check reported a bug that did not exist until it was fixed to
         ask the element that actually reserves space. */
      const closed = document.querySelector('.c-tier__terms');
      const summary = closed?.querySelector('summary');
      const shut = closed ? closed.getBoundingClientRect().height : 0;
      const hiddenWhenClosed = closed
        ? !closed.open && Math.abs(shut - summary.getBoundingClientRect().height) < 2 : null;
      closed?.setAttribute('open', '');
      const shownWhenOpen = closed
        ? closed.getBoundingClientRect().height > shut + 10 : null;
      return {
        formValidates: form ? !form.checkValidity() : null,
        status: (document.querySelector('[data-contact-status]')?.textContent || '').trim(),
        hiddenWhenClosed, shownWhenOpen,
        waFallback: [...document.querySelectorAll('[data-wa]')].every((a) => /^https:\/\/wa\.me\//.test(a.getAttribute('href'))),
      };
    });
    if (states.formValidates !== true) fail('HIGH', 'states', 'the empty contact form does not fail validation');
    if (states.status) fail('MED', 'states', `the status line says something before anything happened: "${states.status}"`);
    if (states.hiddenWhenClosed === false) fail('MED', 'states', 'the scope-fact disclosure shows its body while closed');
    if (states.shownWhenOpen === false) fail('HIGH', 'states', 'the scope-fact disclosure stays empty when opened');
    if (!states.waFallback) fail('HIGH', 'states', 'a package CTA is not a real wa.me link');
    await p.goto(`${BASE}/404.html`, { waitUntil: 'load' }); await p.waitForTimeout(400);
    const e404 = await p.evaluate(() => ({ nav: document.querySelectorAll('.c-header a[href]').length, h1: document.querySelectorAll('h1').length }));
    if (e404.nav < 4 || e404.h1 !== 1) fail('MED', 'states', '404 page has lost its navigation or heading');
    await p.context().close();
  }

  /* ---- 7 the showpiece budget ------------------------------------------
     WEBSTART X, X05: one budgeted showpiece — a video hero on desktop, a
     still on the phone. Written as a check rather than an intention because
     a budget nobody measures is a budget that grows. See docs/53.

     Passes vacuously until a video ships. That is the point: it is here on
     the day the decision was made, not on the day someone notices the phone
     build got heavy. */
  {
    const BUDGET = 2 * 1024 * 1024; // one showpiece, desktop only
    const assets = path.join(DIST, 'assets');
    const vids = fs.existsSync(assets)
      ? fs.readdirSync(assets).filter((f) => /\.(mp4|webm|mov|m4v)$/i.test(f))
      : [];

    let total = 0;
    for (const v of vids) {
      const bytes = fs.statSync(path.join(assets, v)).size;
      total += bytes;
      if (/\.mov$/i.test(v)) fail('HIGH', 'budget', `${v} is a .mov — an editing format, not a delivery one`);
      if (bytes > BUDGET) fail('HIGH', 'budget', `${v} is ${(bytes / 1048576).toFixed(1)}MB, over the ${BUDGET / 1048576}MB showpiece budget`);
    }
    if (total > BUDGET) fail('HIGH', 'budget', `video totals ${(total / 1048576).toFixed(1)}MB across ${vids.length} files — the budget is one showpiece, not a library`);

    /* Markup rules. A video without a poster is a blank rectangle until it
       decodes; one without preload="none" spends the budget on every visitor
       whether or not they ever see it; one with sound autoplays into a room. */
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(DIST, page), 'utf8');
      /* The rule is "a video is never a blank rectangle", not "a video has a
         poster attribute". An <img> painted underneath satisfies it better —
         it renders before the video element is parsed, and it survives a
         failed video entirely — so either form passes. */
      const stillNearby = /<img\b[^>]*class="[^"]*__still/i.test(html);
      for (const tag of html.match(/<video\b[^>]*>/gi) || []) {
        if (!/\bposter=/i.test(tag) && !stillNearby) fail('HIGH', 'budget', `${page}: <video> has no poster and no still beneath it — the hero is blank until it decodes`);
        if (!/preload="none"/i.test(tag)) fail('HIGH', 'budget', `${page}: <video> does not set preload="none"`);
        if (/\bautoplay\b/i.test(tag) && !/\bmuted\b/i.test(tag)) fail('HIGH', 'budget', `${page}: <video autoplay> without muted — it will be blocked, and it should be`);
        if (!/\bplaysinline\b/i.test(tag)) fail('MED', 'budget', `${page}: <video> without playsinline goes fullscreen on iOS`);
      }
    }

    /* The rule most likely to be broken quietly: the phone must not pay for
       the desktop's showpiece. Measured, not assumed. */
    const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    const heavy = [];
    p.on('request', (r) => { if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(r.url())) heavy.push(r.url().split('/').pop()); });
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' });
    await p.waitForTimeout(1200);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(900);
    if (heavy.length) fail('HIGH', 'budget', `the phone requested video (${heavy.join(', ')}) — the still is the phone's version`);

    /* ---- 8 width parity ---------------------------------------------------
       X01 found eight of thirteen package CTAs missing on the phone: a rule
       hid them when they were interchangeable, and stayed after P0-4 made each
       one carry its own package, price and analytics attribute. Nothing
       watched it, because every check counted links on ONE width.

       So this counts the conversion affordances a buyer can actually reach at
       390 and at 1280 and requires them to match. A deliberate difference is
       still allowed — it just has to be argued for here rather than happen. */
    const reach = async (width, isMobile) => {
      const c = await browser.newContext({ viewport: { width, height: 800 }, isMobile, hasTouch: isMobile });
      const pg = await c.newPage();
      await pg.goto(`${BASE}/index.html`, { waitUntil: 'load' });
      await pg.waitForTimeout(700);
      const n = await pg.evaluate(() => [...document.querySelectorAll('main a[href*="wa.me"]')]
        .filter((a) => { const b = a.getBoundingClientRect(); return b.width > 0 && b.height > 0; }).length);
      await c.close();
      return n;
    };
    const wide = await reach(1280, false);
    const narrow = await reach(390, true);
    if (narrow < wide) {
      fail('HIGH', 'parity', `the phone reaches ${narrow} package CTA(s), the desktop ${wide} — the conversion path is not the same on both`);
    }

    await ctx.close();
  }

  /* ---- 9 the transfer budget --------------------------------------------
     WHAT WAS NEVER MEASURED. Section 1 caps the HTML at 600KB and docs/53 caps
     the showpiece at 2MB per visitor. Between those two numbers sat everything
     else — twelve WebP panels, and whatever gets added next — and nothing
     counted it. A site whose whole argument is that it is light should not
     learn its own weight from a client on a hotel connection.

     THE BUDGET IS 1MB PER PAGE, EXCLUDING THE SHOWPIECE. The film has its own
     number in docs/53 §2 and its own check in section 7; counting it here
     would make one file answer to two budgets that could drift apart. The
     homepage measures 918KB today — 510KB of one HTML file (fonts, CSS, JS and
     the inlined poster) plus 408KB of brand-board panels. Roughly 11% of
     headroom is deliberate: it is about one more panel, which is exactly the
     size of decision that should have to be made on purpose.

     TWO NUMBERS, BECAUSE DIFFERENT PEOPLE PAY THEM. `first` is what everyone
     downloads to see the first screen. `full` is what a reader who scrolls the
     whole page pays — on a 30,000px phone page, a committed one.

     AND `full` IS ONLY REACHABLE BY SCROLLING IN STEPS. A single jump to the
     bottom fetches almost nothing: a lazy image loads when it enters the
     viewport, and a page that scrolls past twelve of them in one frame never
     puts any of them there. The first draft of this check did exactly that and
     reported the homepage at 510KB — wrong by 408KB, and confident about it. */
  {
    const BUDGET = 1024 * 1024;
    const weigh = async (page, width, height, scroll) => {
      const c = await browser.newContext({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
      const pg = await c.newPage();
      const seen = [];
      pg.on('response', (r) => seen.push(r.body().then((b) => [r.url(), b.length]).catch(() => null)));
      await pg.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await pg.waitForTimeout(900);
      const settle = async () => (await Promise.all(seen)).filter(Boolean);
      const sum = (rows, film) => rows.filter(([u]) => /hero\.(mp4|webm)$/.test(u) === film)
        .reduce((n, [, b]) => n + b, 0);
      const firstRows = await settle();
      const first = sum(firstRows, false);
      if (scroll) {
        const H = await pg.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < H; y += height) {
          await pg.evaluate((v) => window.scrollTo(0, v), y);
          await pg.waitForTimeout(60);
        }
        await pg.waitForTimeout(1200);
      }
      const rows = await settle();
      const out = { first, full: sum(rows, false), film: sum(rows, true) };
      await c.close();
      return out;
    };

    console.log('');
    for (const page of SHIPPED) {
      /* A page that references nothing under dist/assets/ IS its HTML file:
         nothing about it can change with the viewport or with scrolling, so it
         is weighed once rather than four times. */
      const varies = /src="\.\/assets\//.test(fs.readFileSync(path.join(DIST, page), 'utf8'));
      const phone = await weigh(page, 390, 844, varies);
      const desktop = varies ? await weigh(page, 1440, 900, true) : phone;

      for (const [label, m] of [['phone', phone], ['desktop', desktop]]) {
        if (m.full > BUDGET) {
          fail('MED', 'budget', `${page} @${label}: ${(m.full / 1024).toFixed(0)}KB excluding the showpiece, over the ${BUDGET / 1024}KB budget`);
        }
        if (!varies) break; // one measurement, one verdict
      }

      const line = varies
        ? `phone ${(phone.full / 1024).toFixed(0)}KB · desktop ${(desktop.full / 1024).toFixed(0)}KB` +
          ` (first screen ${(phone.first / 1024).toFixed(0)}KB)` + (desktop.film ? ` + ${(desktop.film / 1024).toFixed(0)}KB showpiece` : '')
        : `${(phone.full / 1024).toFixed(0)}KB, one file`;
      console.log(`  ·  ${page.padEnd(14)} ${line}`);
    }
  }

  /* ---- 10 the printed page ----------------------------------------------
     WHY THIS IS A CHECK AND NOT A ONE-OFF FIX.
     Every browser prints with "background graphics" OFF by default, and this
     is a dark site: with the grounds gone, `--color-text-primary` is white ink
     on white paper. Before `src/styles/07-print.css` existed, /pricing printed
     as a blank sheet carrying one yellow X — the accent letter of the logo,
     the only mark dark enough to survive.

     That is the exact shape of defect this project keeps meeting: nothing on
     screen looks wrong, and the failure only exists somewhere nobody looked.
     The pricing page is the one page a buyer saves to PDF and forwards to
     whoever signs, so it gets a test rather than a fix and a hope.

     HOW IT MEASURES. Print media is emulated, background painting is removed
     the way the print dialog removes it, and every visible text node's
     computed colour is checked against white. Anything the print stylesheet
     hides is skipped — being invisible on paper on purpose is the point of
     half that file. */
  {
    const KILL_BG = '*,*::before,*::after{background-image:none!important;background-color:transparent!important}html,body{background:#fff!important}';
    for (const page of SHIPPED) {
      const c = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
      const pg = await c.newPage();
      await pg.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await pg.waitForTimeout(700);
      await pg.emulateMedia({ media: 'print' });
      await pg.addStyleTag({ content: KILL_BG });
      await pg.waitForTimeout(200);

      const faint = await pg.evaluate(() => {
        const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
        const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
        /* Composited against white, because that is the paper. An alpha of
           0.2 on black is not dark grey, it is nearly nothing. */
        const onWhite = (s) => {
          const m = s.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const [r, g, b, a = 1] = m[1].split(',').map(Number);
          return [r, g, b].map((ch) => ch * a + 255 * (1 - a));
        };
        const out = [];
        for (const el of document.querySelectorAll('main *, footer *')) {
          if (el.children.length) continue;                    // leaf text only
          const text = (el.textContent || '').trim();
          if (text.length < 3) continue;
          const box = el.getBoundingClientRect();
          if (box.width < 1 || box.height < 1) continue;       // hidden in print
          const px = onWhite(getComputedStyle(el).color);
          if (!px) continue;
          const ratio = 1.05 / (lum(px) + 0.05);
          if (ratio < 4.5) out.push({ ratio: Math.round(ratio * 100) / 100, text: text.slice(0, 40), sel: el.className || el.tagName });
        }
        return out;
      });

      const worst = faint.sort((a, b) => a.ratio - b.ratio).slice(0, 3);
      for (const f of worst) {
        fail(f.ratio < 2 ? 'HIGH' : 'MED', 'print',
          `${page}: printed text at ${f.ratio}:1 on paper — "${f.text}" (${f.sel})`);
      }
      if (faint.length > worst.length) {
        fail('MED', 'print', `${page}: ${faint.length - worst.length} further faint element(s) on paper`);
      }
      await c.close();
    }
  }

  /* ---- 11 the server configuration -------------------------------------
     THE ONE ARTIFACT NO OTHER CHECK TOUCHES. `.htaccess` is not exercised by
     anything above: the local server that serves `dist/` sends no headers of
     its own, so every rule in that file is unverified until it is on a real
     host — and `docs/58` T6 already records that the site "looks perfect
     without it".

     THE CATASTROPHIC ONE IS THE CSP. Every page inlines its own module, and
     the policy names each inline script by sha256. Get one hash wrong and that
     page's JavaScript is refused by the browser in production: no accordion,
     no language toggle, no package pre-fill — while locally, with no CSP
     header at all, everything works. There is no partial version of this
     failure and no way to notice it before a visitor does.

     So the hashes are recomputed here from the shipped bytes and matched both
     ways: every inline script must be named, and every name must match a
     script. The second direction matters too — a stale hash is a policy that
     has drifted from the pages, which is how the first direction breaks next.

     A NOTE ON HOW THIS WAS WRITTEN. The first version of this check read the
     policy with /script-src[^;"]*​/ against the whole file and reported that
     all 24 scripts would be blocked. The regex had matched a COMMENT higher up
     that mentions "script-src", so it was reading an empty hash list. The
     policy was correct all along. Anchor on the directive line, not on a word
     that also appears in prose. */
  {
    const ht = fs.readFileSync(path.join(DIST, '.htaccess'), 'utf8');
    const csp = ht.split('\n').find((l) => l.includes('Header set Content-Security-Policy')) || '';
    const listed = new Set([...csp.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map((m) => m[1]));

    const used = new Set();
    for (const page of SHIPPED) {
      const file = path.join(DIST, page);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
        const hash = crypto.createHash('sha256').update(m[1], 'utf8').digest('base64');
        used.add(hash);
        if (!listed.has(hash)) {
          fail('HIGH', 'csp', `${page}: an inline script is not in the policy — it will be blocked in production (sha256-${hash.slice(0, 12)}…)`);
        }
      }
    }
    for (const h of listed) {
      if (!used.has(h)) fail('MED', 'csp', `the policy names sha256-${h.slice(0, 12)}… which no shipped page contains`);
    }
    if (!listed.size) fail('HIGH', 'csp', 'the policy carries no script hashes at all');

    /* Cheap assertions on the rest of the file, each for a rule whose failure
       is only ever visible in production. */
    const err = ht.match(/ErrorDocument\s+404\s+(\S+)/);
    if (!err) fail('MED', 'htaccess', 'no ErrorDocument 404');
    else if (!fs.existsSync(path.join(DIST, err[1].replace(/^\//, '')))) {
      fail('HIGH', 'htaccess', `ErrorDocument 404 points at ${err[1]}, which is not in the build`);
    }
    if (!/RewriteCond %\{REQUEST_FILENAME\}\.html -f/.test(ht)) {
      fail('HIGH', 'htaccess', 'the extensionless-URL rewrite is missing — every clean link in the markup 404s');
    }
    /* HSTS is a config switch and a one-year commitment; the file must agree
       with site.config.json in both directions. */
    const wantsHsts = cfg.hsts === true || cfg.hsts === 'all';
    const hasHsts = /Strict-Transport-Security/.test(ht);
    if (wantsHsts !== hasHsts) {
      fail('HIGH', 'htaccess', `site.config.json says hsts=${JSON.stringify(cfg.hsts)} but the file ${hasHsts ? 'sets' : 'omits'} it`);
    }
    /* THE FOUR-REGISTRATION TRAP. Adding a page needs it in `site.config.json`,
       in `SHIP`, in `build.js`'s list and in the footer. Miss `SHIP` and the
       page is built, indexed, listed in the sitemap and canonical-tagged — and
       simply not in the archive, so the URL the sitemap advertises returns 404
       on the server while looking perfect in `dist/`. Nothing caught that; the
       accessibility page needed all four by hand two days ago. */
    for (const p of cfg.pages.filter((x) => x.index !== false)) {
      if (!SHIP.includes(p.file)) {
        fail('HIGH', 'deploy', `${p.file} is indexed and in the sitemap but not in SHIP — the URL will 404 on the server`);
      }
    }
    for (const f of SHIPPED) {
      if (!fs.existsSync(path.join(DIST, f))) {
        fail('HIGH', 'deploy', `${f} is in SHIP but was not built — the archive will be missing a page`);
      }
    }

    /* ONE PUBLISHED EMAIL ADDRESS, AND IT IS THE DECLARED ONE.
       The address appears in `navigation-map.js` (the contact block and the
       form target) and again in the prose of Privacy, Terms and Accessibility
       in BOTH languages. Five places, no generator — because an address inside
       a bilingual sentence cannot be templated without turning the sentence
       into a template, which is worse.

       So the guard is a check rather than a build step: `site.config.json`
       declares the address, and no shipped page may publish a different one.
       The failure this prevents is specific and is coming — `docs/62` A10 has
       the Gmail being replaced by a domain address once deliverability is
       proven, and a partial swap would leave two live addresses on one site
       with nothing saying so. */
    const declared = cfg.contact && cfg.contact.email;
    if (!declared) {
      fail('MED', 'contact', 'site.config.json declares no contact.email, so nothing checks the address the site publishes');
    } else {
      const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
      for (const page of SHIPPED) {
        const file = path.join(DIST, page);
        if (!fs.existsSync(file)) continue;
        const found = new Set(fs.readFileSync(file, 'utf8').match(EMAIL) || []);
        for (const addr of found) {
          if (addr !== declared) {
            fail('HIGH', 'contact', `${page} publishes ${addr}, but site.config.json declares ${declared}`);
          }
        }
      }
    }

    const wantsAnalytics = !!(cfg.analytics && cfg.analytics.provider);
    if (wantsAnalytics && !csp.includes('plausible.io')) {
      fail('HIGH', 'csp', 'analytics is on but the policy does not allow its origin — the tag will be blocked');
    }
    if (!wantsAnalytics && csp.includes('plausible.io')) {
      fail('MED', 'csp', 'analytics is off but the policy still allows its origin');
    }
  }


  /* ---- 12 CSS that can never apply --------------------------------------
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

  /* ---- 13 fonts, whichever way they are carried ------------------------
     `site.config.json` build.fonts chooses between a data URI per face and a
     file in assets/fonts/. The linked mode is worth ~46% of a page's gzipped
     weight and lets unicode-range skip the Arabic face for English visitors
     (docs/43 §15), but it introduces a way to ship a page that references a
     font file the zip does not contain. This closes that. */
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

  await browser.close();
  server.close();

  const by = (s) => findings.filter((f) => f.sev === s).length;
  console.log(`\nqa: ${findings.length} finding(s) — ${by('HIGH')} high, ${by('MED')} medium, ${by('LOW')} low`);
  process.exit(by('HIGH') ? 1 : 0);
})();
