/* =============================================================================
   BUILD-SHARE-CARD
   Renders src/showpiece/card.html to the og:image.

   WHY IT IS RENDERED RATHER THAN EXPORTED FROM A DESIGN FILE.
   The card carries the proposition and the price promise, and both of those
   change. A PNG exported once drifts from the site the first time a line is
   edited, and the person who can fix it is whoever still has the source file.
   This is markup using the same tokens and the same typeface, so the card and
   the page cannot disagree for long.

   JPEG, not WebP or PNG. WhatsApp is the channel this business converts on and
   its preview fetcher is the least forgiving of the three: JPEG is the format
   every scraper handles, and at quality 88 a dark card lands near 90KB, well
   inside the ~300KB most previewers will fetch.

   Run:  node tools/build-share-card.js
   Out:  src/assets/share-card.jpg
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CARD = path.join(ROOT, 'src/showpiece/card.html');
const OUT = path.join(ROOT, 'src/assets/share-card.jpg');

/* 1200x630 is what every platform crops from. Twitter takes 2:1, LinkedIn
   1.91:1, WhatsApp squares the thumbnail — so the card is composed for the
   intersection and nothing that matters sits near an edge. */
const W = 1200, H = 630, QUALITY = 88;

(async () => {
  const { chromium } = require('playwright-core');
  const exe = process.env.PLAYWRIGHT_CHROMIUM;
  const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.goto(`file://${CARD}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'card-'));
  const png = path.join(dir, 'card.png');
  /* Rendered at 2x and downsampled: type in a share card is small by the time
     a phone shows it, and the resample is what keeps the edges clean. */
  await page.screenshot({ path: png });
  await browser.close();

  const ffmpeg = require('ffmpeg-static');
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', png,
    '-vf', `scale=${W}:${H}:flags=lanczos`, '-q:v', String(Math.round((100 - QUALITY) / 3)), OUT]);
  fs.rmSync(dir, { recursive: true, force: true });

  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`share card: ${W}x${H} -> src/assets/share-card.jpg  ${kb}KB`);
  if (fs.statSync(OUT).size > 300 * 1024) {
    console.error('  ! over 300KB — some preview fetchers will skip it. Lower QUALITY.');
    process.exit(1);
  }
})();
