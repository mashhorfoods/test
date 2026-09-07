/* =============================================================================
   RESPONSIVE — every page, at the widths nothing else looks at, in both
   languages.

   WHY THIS EXISTS AND WHAT IT DOES NOT DUPLICATE.
   `validate.js` walks its journeys at 1280 and 390. `qa.js` measures at 390,
   1280 and 1440, and its Arabic pass (§15) looks at buttons on two pages. So
   the widths between and below those — 320, 768, 1024 — were never rendered
   by anything, and no check had ever loaded /privacy, /terms, /404 or
   /accessibility in Arabic at any width at all.

   That gap is not theoretical. `button.css` carries a 22.5em media query
   written because a call to action asked for 232px in a 222px panel at 320,
   and `docs/113` found three grids that overflowed on a phone. Both were
   found by hand. This is the same sweep, run every time.

   THREE THINGS, ON EVERY COMBINATION:
     · the document must not be wider than the viewport
     · no interactive target below the 44px floor
     · Arabic must actually reach dir="rtl"

   THE HARNESS CHECKS ITSELF FIRST. The first version of this sweep clicked
   `[data-lang-toggle]`, which is not a selector this site has ever used. The
   click did nothing, the page stayed in English, and forty "Arabic did not
   set dir=rtl" findings were reported against a site that was fine. So the
   language switch is now a hard failure if the control is missing, and `dir`
   is asserted rather than assumed: a sweep that silently tests English twice
   is worse than no sweep, because it reports a pass.
   ============================================================================= */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4622;

/* The widths validate.js and qa.js never render. 390/1280/1440 are covered
   there and are deliberately not repeated here. */
/* 375 AND 414 ARE HERE BECAUSE A WHOLE BAND WAS UNGUARDED.

   The first list was 320, 768, 1024 — the widths nothing else rendered. It
   was reasoned about as "the gaps between the other harnesses", and the
   reasoning was right about the gaps and wrong about phones: every check on
   this project rendered 320, 360 or 390 and nothing between 391 and 767.

   On 7 September the pricing cards were found hanging off the page across
   361-480 — 25px past the right edge in English, 9px off the LEFT of the
   screen in Arabic — on iPhone SE, mini, XR and Plus, four of the commonest
   phones there are. Clean at 320. Clean at 360. Clean at 768. The sample
   stepped over the defect on both sides.

   So the list now covers the phone band rather than sampling it: 320 (the
   floor), 375 and 414 (the two commonest iPhone widths above 360), then the
   tablet and small-laptop widths as before. */
const WIDTHS = [320, 375, 414, 768, 1024];
const PAGES = ['index.html', 'pricing.html', 'about.html', 'story.html',
  'privacy.html', 'terms.html', 'accessibility.html', '404.html'];

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.webm': 'video/webm', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain',
};

const findings = [];
const fail = (sev, area, msg) => findings.push({ sev, area, msg });

function serve() {
  return http.createServer((q, s) => {
    let u = q.url.split('?')[0];
    if (u === '/') u = '/index.html';
    const f = path.join(DIST, decodeURIComponent(u));
    if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      s.writeHead(404); return s.end('404');
    }
    s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(s);
  });
}

/* OVERFLOW IS MEASURED FROM ELEMENT BOXES, NOT FROM scrollWidth — and the
   first version of this file got that wrong.

   `01-reset.css` sets `overflow-x: clip` on both html and body ("No
   horizontal overflow, ever — rule 09"). Under clip there is no scroll
   container, so `documentElement.scrollWidth` is pinned to the viewport
   whatever the content does. A check written against it can never fire on
   this site: it would have reported a clean pass over a page with a 1400px
   element in it, which is precisely what the negative test showed.

   Clip does not fix overflow, it hides the evidence — the content is cut
   off rather than reachable — so the box geometry is the honest measure and
   it survives clip.

   Two exclusions, both deliberate:
     · `position: fixed` — off-canvas drawers and the like are a pattern,
       not a defect.
     · anything an ancestor already clips or scrolls back inside the
       viewport — see `contained()` below. */
const probe = (vw) => {
  const de = document.documentElement;
  const name = (e) => {
    const cls = e.className && e.className.baseVal !== undefined
      ? e.className.baseVal : String(e.className || '');
    return `${e.tagName.toLowerCase()}${cls ? `.${cls.split(' ').filter(Boolean)[0]}` : ''}`;
  };
  /* CONTAINED, NOT MERELY WIDE. An element wider than the viewport is only a
     defect if nothing between it and the body puts it back inside one.

     Three real patterns are contained and must not be reported:
       · a horizontal scroller (`docs/113`'s phone grids, every `.c-gallery`)
       · `.u-visually-hidden`, a 1px clipping box holding screen-reader text —
         its inner spans are `nowrap` and measure their full natural width,
         which is how a 879px caption appeared to overflow a 320px phone
       · any other `overflow: hidden` box sitting inside the viewport

     So the rule is one rule: walk up, and if an ancestor clips or scrolls on
     the inline axis AND its own box is inside the viewport, the content is
     contained. Only what survives that walk is really cut off. */
  /* THE WALK STOPS BEFORE <body>, and that bound is the whole check.

     `01-reset.css` puts `overflow-x: clip` on html AND body. Walk as far as
     body and every element on the page has a clipping ancestor whose box is
     inside the viewport — so `contained()` returns true for everything and
     the sweep reports a confident zero. It did exactly that: 0 findings over
     48 combinations, moments after a negative test had proved the same code
     could see a 1400px div.

     Body's clip is the thing being tested, not a thing that excuses. Only
     containers BETWEEN the element and body count. */
  const contained = (e) => {
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') {
        const nb = n.getBoundingClientRect();
        if (nb.right <= vw + 1 && nb.left >= -1) return true;
      }
    }
    return false;
  };
  const wide = [...document.querySelectorAll('body *')].filter((e) => {
    const b = e.getBoundingClientRect();
    if (!(b.width > 0) || (b.right <= vw + 1 && b.left >= -1)) return false;
    if (getComputedStyle(e).position === 'fixed') return false;
    return !contained(e);
  }).slice(0, 4).map((e) => {
    const b = e.getBoundingClientRect();
    return `${name(e)} ${Math.round(b.width)}px at ${Math.round(b.left)}..${Math.round(b.right)}`;
  });
  const small = [...document.querySelectorAll('a,button,summary,input,select,textarea,[tabindex="0"]')]
    .filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && (b.height < 43.9 || b.width < 43.9);
    })
    .slice(0, 5).map((e) => {
      const b = e.getBoundingClientRect();
      return `${name(e)} ${Math.round(b.width)}x${b.height.toFixed(1)} "${(e.textContent || '').trim().slice(0, 22)}"`;
    });
  return { docW: de.scrollWidth, dir: de.dir, wide, small };
};

(async () => {
  if (!fs.existsSync(DIST)) {
    console.error('\n  ! no dist/ — run node build.js first\n');
    process.exit(1);
  }
  const srv = serve();
  await new Promise((r) => srv.listen(PORT, r));
  const BASE = `http://localhost:${PORT}`;
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });

  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width, height: 800 },
      isMobile: width <= 430, hasTouch: width <= 430,
    });
    const p = await ctx.newPage();
    for (const page of PAGES) {
      if (!fs.existsSync(path.join(DIST, page))) continue;
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await p.waitForTimeout(350);

      for (const lang of ['en', 'ar']) {
        if (lang === 'ar') {
          const clicked = await p.evaluate(() => {
            const el = document.querySelector('[data-lang="ar"]');
            if (!el) return false;
            el.click();
            return true;
          });
          if (!clicked) {
            fail('HIGH', 'harness', `${page} @${width}: no [data-lang="ar"] control — the Arabic half of this sweep tested nothing`);
            continue;
          }
          await p.waitForTimeout(500);
        }
        const r = await p.evaluate(probe, width);
        if (lang === 'ar' && r.dir !== 'rtl') {
          fail('HIGH', 'rtl', `${page} @${width}: Arabic did not reach dir="rtl" (got "${r.dir}")`);
        }
        if (r.wide.length) {
          fail('HIGH', 'overflow', `${page} @${width} ${lang}: ${r.wide.length} element(s) reach past a ${width}px viewport — ${r.wide.join(' | ')}`);
        }
        /* Kept as a second signal rather than the primary one. It stays
           silent while `overflow-x: clip` holds; if that rule is ever
           relaxed, this is what notices the page became scrollable. */
        if (r.docW > width + 1) {
          fail('MED', 'overflow', `${page} @${width} ${lang}: the document itself scrolls to ${r.docW}px in a ${width}px viewport`);
        }
        if (r.small.length) {
          fail('MED', 'target', `${page} @${width} ${lang}: ${r.small.length} target(s) under the 44px floor — ${r.small.join(' | ')}`);
        }
      }
      /* Back to English before the next page, so a page is never loaded into
         a language the sweep did not choose. */
      await p.evaluate(() => document.querySelector('[data-lang="en"]')?.click());
      await p.waitForTimeout(300);
    }
    await ctx.close();
  }

  await browser.close();
  srv.close();

  const n = { HIGH: 0, MED: 0, LOW: 0 };
  for (const f of findings) n[f.sev] += 1;
  console.log('');
  for (const f of findings) console.log(`  ${f.sev.padEnd(4)} [${f.area}] ${f.msg}`);
  const combos = WIDTHS.length * PAGES.filter((p) => fs.existsSync(path.join(DIST, p))).length * 2;
  console.log(`\nresponsive: ${findings.length} finding(s) — ${n.HIGH} high, ${n.MED} medium, over ${combos} page/width/language combinations\n`);
  process.exit(n.HIGH > 0 ? 1 : 0);
})();
