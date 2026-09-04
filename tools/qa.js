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

  await browser.close();
  server.close();

  const by = (s) => findings.filter((f) => f.sev === s).length;
  console.log(`\nqa: ${findings.length} finding(s) — ${by('HIGH')} high, ${by('MED')} medium, ${by('LOW')} low`);
  process.exit(by('HIGH') ? 1 : 0);
})();
