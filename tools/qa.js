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

   THE CHECKS LIVE IN tools/qa/, one file per section, named by the section
   number the rest of the repository cites: "qa.js §12" is
   tools/qa/12-dead-css.js. This file serves dist/, opens the browser and runs
   them in order. It was one 2,900-line file until September 2026.

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

try { require.resolve('playwright-core'); } catch {
  console.log('qa: playwright-core is not installed — skipping.'); process.exit(0);
}
const { launchChromium } = require('./lib/browser.cjs');

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
  const browser = await launchChromium();

  /* The archive's manifest, not cfg.pages: several checks below are about what
     a VISITOR gets, and styleguide.html is built into dist/ but deliberately
     never shipped. */
  const { SHIP } = require('./build-zip');
  const SHIPPED = SHIP.filter((f) => f.endsWith('.html'));

  /* EACH CHECK IS ITS OWN FILE, tools/qa/NN-*.js, named by the section number
     the rest of the repository cites ("qa.js §12" is tools/qa/12-dead-css.js).
     They run in the order they were written, so the report reads as it always
     has. A check receives what it uses and reports through fail(). */
  const CHECKS = [
    require('./qa/01-pages'),
    require('./qa/02-sitemap-robots'),
    require('./qa/06-states'),
    require('./qa/07-showpiece-budget'),
    require('./qa/09-transfer-budget'),
    require('./qa/10-print'),
    require('./qa/11-server-config'),
    require('./qa/12-dead-css'),
    require('./qa/14-phone-cta-reach'),
    require('./qa/15-control-scale'),
    require('./qa/16-type-floor'),
    require('./qa/17-alt-text'),
    require('./qa/18-ambiguous-controls'),
    require('./qa/13-fonts'),
    require('./qa/19-phone-numbers'),
    require('./qa/20-reveal'),
    require('./qa/21-gallery'),
    require('./qa/22-in-page-links'),
    require('./qa/23-hero-provenance'),
    require('./qa/24-unused-uploads'),
    require('./qa/25-scroll-motion'),
    require('./qa/27-challenge-config'),
    require('./qa/28-focus-ring'),
    require('./qa/29-css-layers'),
    require('./qa/30-undefined-tokens'),
    require('./qa/31-prose-counts'),
    require('./qa/32-focusable-names'),
    require('./qa/33-dashboard-not-live'),
    require('./qa/34-testimonial-source'),
    require('./qa/35-external-links'),
    require('./qa/36-english-in-arabic'),
    require('./qa/37-builder-scopes'),
    require('./qa/38-nothing-internal'),
    require('./qa/39-bilingual-names'),
    require('./qa/41-structured-order'),
    require('./qa/40-service-names'),
  ];
  const shared = { fs, path, http, crypto, ROOT, DIST, cfg, pricing, PAGES, findings, fail, BASE, browser, SHIP, SHIPPED };
  for (const check of CHECKS) await check(shared);

  await browser.close();
  server.close();

  const by = (s) => findings.filter((f) => f.sev === s).length;
  console.log(`\nqa: ${findings.length} finding(s) — ${by('HIGH')} high, ${by('MED')} medium, ${by('LOW')} low`);
  process.exit(by('HIGH') ? 1 : 0);
})();
