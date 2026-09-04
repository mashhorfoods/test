/* =============================================================================
   BUILD-SHOWPIECE
   Renders src/showpiece/scene.html to the hero footage, inside the budget.

   WHY A RENDERER AND NOT A VIDEO FILE.
   A video dropped into the repository is a dead end: nobody can change the
   wording, the palette drifts from the tokens, and the only person who can
   edit it is whoever still has the project file. This scene is HTML. It uses
   the brand's own colours and its own typeface, it is diffable, and changing
   the footage is changing markup.

   DETERMINISTIC. The scene exposes __seek(p) and every animation is paused,
   so frames are addressed rather than captured in real time. Same commit,
   same bytes — which is what lets docs/53's budget mean anything.

   THE BUDGET IS ENFORCED HERE TOO, not only in qa.js. qa.js catches a file
   that got into dist/; this refuses to write one in the first place.

   Run:  node tools/build-showpiece.js
   Then: the .mp4 and its poster land in src/assets/showpiece/
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCENE = path.join(ROOT, 'src/showpiece/scene.html');
const OUT = path.join(ROOT, 'src/assets/showpiece');

/* docs/53 §2. Changing a number here is changing the decision — say so in the
   commit message. */
const SPEC = {
  width: 1280,
  height: 720,
  fps: 25,
  seconds: 12,
  budgetBytes: 2 * 1024 * 1024,
  crf: 20, // quality knob: lower is better and heavier. Gradients band above ~24.
};

function chromium() {
  const { chromium: c } = require('playwright-core');
  return c;
}

function ffmpeg() {
  try {
    return require('ffmpeg-static');
  } catch {
    throw new Error('ffmpeg-static is not installed — npm i -D ffmpeg-static');
  }
}

async function frames(dir) {
  const exe = process.env.PLAYWRIGHT_CHROMIUM;
  const browser = await chromium().launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
  const page = await browser.newPage({
    viewport: { width: SPEC.width, height: SPEC.height },
    deviceScaleFactor: 1,
  });
  await page.goto(`file://${SCENE}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const total = SPEC.fps * SPEC.seconds;
  for (let i = 0; i < total; i += 1) {
    /* i/total, never i/(total-1): the last frame must not repeat the first, or
       the loop stutters on every repeat. */
    await page.evaluate((p) => window.__seek(p), i / total);
    await page.screenshot({
      path: path.join(dir, `f${String(i).padStart(4, '0')}.png`),
      animations: 'disabled',
    });
  }
  await browser.close();
  return total;
}

function encode(dir) {
  fs.mkdirSync(OUT, { recursive: true });
  const mp4 = path.join(OUT, 'hero.mp4');
  const webm = path.join(OUT, 'hero.webm');
  const poster = path.join(OUT, 'hero-poster.webp');

  execFileSync(ffmpeg(), [
    '-y', '-loglevel', 'error',
    '-framerate', String(SPEC.fps),
    '-i', path.join(dir, 'f%04d.png'),
    '-an',                              // no audio track: never heard, ~15% of the bytes
    '-c:v', 'libx264',
    '-profile:v', 'high', '-level', '4.0',
    '-preset', 'veryslow',              // build time is free; the visitor's bytes are not
    '-crf', String(SPEC.crf),
    '-pix_fmt', 'yuv420p',              // Safari will not decode yuv444
    '-movflags', '+faststart',          // metadata first, so it can start before it finishes
    mp4,
  ]);

  /* A SECOND ENCODING, not a second video. The browser downloads exactly one:
     Safari and iOS take the MP4, everything else can take either. It is here
     for a duller reason than compatibility — Playwright's Chromium ships
     without proprietary codecs, so H.264 cannot be decoded in the harness, and
     an MP4-only hero would be a feature nothing here could ever verify. A
     showpiece that cannot be tested is a showpiece that quietly breaks. */
  execFileSync(ffmpeg(), [
    '-y', '-loglevel', 'error',
    '-framerate', String(SPEC.fps),
    '-i', path.join(dir, 'f%04d.png'),
    '-an',
    '-c:v', 'libvpx-vp9',
    '-crf', String(SPEC.crf + 12), // VP9's scale is not H.264's; this lands near the same quality
    '-b:v', '0',
    '-row-mt', '1',
    '-pix_fmt', 'yuv420p',
    webm,
  ]);

  /* The poster is not decoration — it is what the phone, reduced-motion, no-JS
     and failed-load visitors all see. It has to stand alone, so it is taken
     from the loop's most composed instant rather than from frame zero. */
  const best = path.join(dir, `f${String(Math.round(SPEC.fps * SPEC.seconds * 0.42)).padStart(4, '0')}.png`);
  execFileSync(ffmpeg(), ['-y', '-loglevel', 'error', '-i', best, '-c:v', 'libwebp', '-quality', '86', poster]);

  return { mp4, webm, poster };
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'showpiece-'));
  try {
    const n = await frames(dir);
    const { mp4, webm, poster } = encode(dir);
    const bytes = fs.statSync(mp4).size;
    const kb = (b) => `${(b / 1024).toFixed(0)}KB`;

    console.log(`showpiece: ${n} frames -> ${SPEC.seconds}s @ ${SPEC.fps}fps, ${SPEC.width}x${SPEC.height}`);
    console.log(`  hero.mp4         ${kb(bytes)}   (budget ${kb(SPEC.budgetBytes)}, ${((bytes / SPEC.budgetBytes) * 100).toFixed(0)}% used)`);
    console.log(`  hero.webm        ${kb(fs.statSync(webm).size)}   (the same loop; each visitor takes one or the other)`);
    console.log(`  hero-poster.webp ${kb(fs.statSync(poster).size)}`);

    if (bytes > SPEC.budgetBytes) {
      fs.unlinkSync(mp4);
      console.error(`\n  ! over budget by ${kb(bytes - SPEC.budgetBytes)} — deleted rather than shipped.`);
      console.error('    Raise SPEC.crf, shorten SPEC.seconds, or drop SPEC.fps. Do not raise the budget silently.');
      process.exit(1);
    }
    console.log('\n  Wired into the hero by index.html + src/scripts/hero-film.js. Desktop only.');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})();
