/* =============================================================================
   BUILD-ICON
   Renders src/assets/brand/logo.svg to the iOS home-screen icon.

   WHY A SEPARATE RASTER AT ALL.
   `<link rel="icon">` ships the SVG and every browser tab is served by it.
   iOS is the exception: Safari has never read SVG for `apple-touch-icon`, so
   without a PNG an iPhone that adds this site to the home screen renders a
   screenshot of the page — a grey rectangle at 60px. This is the last file in
   `src/assets/brand/README.md`'s outstanding table, and P1-8's last item that
   does not need the live host.

   WHY IT IS GENERATED RATHER THAN EXPORTED.
   Same argument as the share card: the mark is `logo.svg`, and an icon
   exported by hand drifts from it the first time the logo changes. Replace
   `logo.svg` and re-run this — one source, both surfaces.

   180x180 is the largest size iOS asks for and the one every smaller surface
   downsamples from. Rendered at 2x and resampled, because the mark is a
   two-stroke X and its diagonals are exactly what a nearest-neighbour scale
   ruins.

   NO TRANSPARENCY, DELIBERATELY. iOS composites a transparent touch icon onto
   black, not onto the wallpaper, so a "transparent" icon is a black icon with
   extra steps. The mark carries its own #202020 ground, which is also the
   site's, and iOS's rounded-corner mask clips well inside the strokes.

   Run:  npm run icon
   Out:  src/assets/brand/apple-touch-icon.png
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/assets/brand/logo.svg');
const OUT = path.join(ROOT, 'src/assets/brand/apple-touch-icon.png');

const SIZE = 180;

(async () => {
  const { chromium } = require('playwright-core');
  const exe = process.env.PLAYWRIGHT_CHROMIUM;
  const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 2 });

  /* The SVG is placed in a page rather than opened directly: a browser asked
     to open an SVG file letterboxes it against its own background, and what
     leaks in at the edges would be white. A page with the mark stretched to
     the full viewport renders exactly the artwork and nothing else. */
  const svg = fs.readFileSync(SRC, 'utf8');
  await page.setContent(
    `<style>html,body{margin:0;background:#202020}svg{display:block;width:${SIZE}px;height:${SIZE}px}</style>${svg}`,
    { waitUntil: 'load' }
  );

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'icon-'));
  const png = path.join(dir, 'icon.png');
  await page.screenshot({ path: png });
  await browser.close();

  const ffmpeg = require('ffmpeg-static');
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', png,
    '-vf', `scale=${SIZE}:${SIZE}:flags=lanczos`, OUT]);
  fs.rmSync(dir, { recursive: true, force: true });

  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`touch icon: ${SIZE}x${SIZE} -> src/assets/brand/apple-touch-icon.png  ${kb}KB`);
})();
