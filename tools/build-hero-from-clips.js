/* =============================================================================
   BUILD-HERO-FROM-CLIPS
   Turns generated clips into the hero loop: graded, joined, seamless, in budget.

   WHY THIS EXISTS.
   A generation tool makes 5 seconds at a time, so a 10-second hero is two
   clips — and two clips cut together are three problems, not one: they do not
   match in colour, the joins between them are visible, and the end has to meet
   the beginning because it plays forever. Doing that by hand once is fine.
   Doing it again for every re-generation is where quality quietly slips, so it
   is a command instead.

   THE GRADE IS NOT TASTE. It pulls generated footage onto the site's own
   ground — the blacks to charcoal, the highlights off pure white, saturation
   down so a single warm accent survives and nothing else creeps in. Footage
   that arrives close to the brief barely moves; footage that arrives bright
   and contrasty is brought to heel rather than rejected.

   Run:  node tools/build-hero-from-clips.js clipA.mp4 clipB.mp4
         node tools/build-hero-from-clips.js clipA.mp4          (single clip)
   Out:  src/assets/showpiece/hero.{webm,mp4} + hero-poster.webp
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src/assets/showpiece');

const SPEC = {
  width: 1280,
  height: 720,
  fps: 25,
  /* The overlap at each join. Long enough to hide a mismatch, short enough
     that neither clip loses a beat it needed. */
  crossfade: 0.6,
  budgetBytes: 2 * 1024 * 1024,
  crf: { mp4: 26, webm: 36 },
};

/* Pulls any footage onto the site's ground. In order: crop to 16:9 from the
   centre, scale, then grade — blacks down toward #0D0F12, contrast eased so
   the film sits behind text rather than in front of it, saturation pulled back
   so the one warm accent is the only colour that survives. */

/* WHICH WAY ROUND THE FILE IS AUTHORED.
   hero-film.css mirrors the film at [dir="rtl"], so the shipped file needs one
   fixed orientation and the page handles the other. The rule is: SHIP IT DARK
   SIDE LEFT. In English the headline is on the left and lands on that dark
   half; in Arabic the layout mirrors, the film mirrors with it, and the dark
   half lands on the right where the Arabic headline now is.

   Get this backwards and the film is correct in exactly one language — which
   is worse than having no film, because it will look considered in whichever
   one you happen to be reviewing. Pass --mirror when the footage arrives with
   its bright side on the left. */
const MIRROR = process.argv.includes('--mirror');

const GRADE = [
  ...(MIRROR ? ['hflip'] : []),
  `crop='min(iw,ih*16/9)':'min(ih,iw*9/16)'`,
  `scale=${SPEC.width}:${SPEC.height}:flags=lanczos`,
  `fps=${SPEC.fps}`,
  `eq=brightness=-0.12:contrast=0.92:saturation=0.80`,
  `colorbalance=rm=0.04:bm=-0.05`,
  /* A scrim, matching the CSS film's: the hero's text must sit on a
     predictable ground whatever instant is on screen. */
  `drawbox=x=0:y=0:w=iw:h=ih:color=#0D0F12@0.22:t=fill`,
  `format=yuv420p`,
].join(',');

function ffmpeg() {
  try {
    return require('ffmpeg-static');
  } catch {
    throw new Error('ffmpeg-static is not installed — npm i -D ffmpeg-static');
  }
}

const run = (args) => execFileSync(ffmpeg(), ['-y', '-loglevel', 'error', ...args]);

/** Seconds, read from ffmpeg's own report — no ffprobe in ffmpeg-static. */
function seconds(file) {
  let text = '';
  try { execFileSync(ffmpeg(), ['-i', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { text = `${e.stderr || ''}`; }
  const m = text.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  if (!m) throw new Error(`${path.basename(file)}: could not read a duration`);
  return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
}

/**
 * Join the clips into a loop.
 *
 * THE SECOND SEAM IS THE ONE PEOPLE FORGET. A→B is a cut you can see coming;
 * B→A happens on every repeat, forever, and is the one that makes a hero look
 * cheap. So the tail of the last clip is cross-faded onto the head of the
 * first, and that overlap is trimmed from the total — the file itself loops.
 */
function assemble(clips, dir) {
  const graded = clips.map((c, i) => {
    const out = path.join(dir, `g${i}.mp4`);
    run(['-i', c, '-vf', GRADE, '-an', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', out]);
    return out;
  });

  const x = SPEC.crossfade;
  let joined;

  if (graded.length === 1) {
    joined = graded[0];
  } else {
    joined = path.join(dir, 'joined.mp4');
    const a = seconds(graded[0]);
    /* xfade's offset is where the transition STARTS in the first input. */
    run([
      '-i', graded[0], '-i', graded[1],
      '-filter_complex', `[0:v][1:v]xfade=transition=fade:duration=${x}:offset=${(a - x).toFixed(3)},format=yuv420p[v]`,
      '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', joined,
    ]);
  }

  /* CLOSE THE LOOP: the tail is faded onto the HEAD, not onto the middle.
     That distinction is the whole trick and it is easy to get backwards. The
     result is [tail blended over head] + [middle], so the last frame runs into
     the first: the end of the middle is the frame the tail began on, and the
     end of the blend is the frame the middle begins on. Both joins are
     continuous, so the file loops rather than jumping.

     fps= after every setpts because trim hands on a stream with no declared
     frame rate, and xfade and concat both refuse to work with one. */
  const total = seconds(joined);
  const looped = path.join(dir, 'looped.mp4');
  const t = (n) => n.toFixed(3);
  run([
    '-i', joined,
    '-filter_complex',
    `[0:v]split=3[s0][s1][s2];`
    + `[s0]trim=0:${t(x)},setpts=PTS-STARTPTS,fps=${SPEC.fps}[head];`
    + `[s1]trim=${t(x)}:${t(total - x)},setpts=PTS-STARTPTS,fps=${SPEC.fps}[mid];`
    + `[s2]trim=${t(total - x)}:${t(total)},setpts=PTS-STARTPTS,fps=${SPEC.fps}[tail];`
    + `[tail][head]xfade=transition=fade:duration=${t(x)}:offset=0,fps=${SPEC.fps}[blend];`
    + `[blend][mid]concat=n=2:v=1:a=0,format=yuv420p[v]`,
    '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', looped,
  ]);

  return looped;
}

function encode(master) {
  fs.mkdirSync(OUT, { recursive: true });
  const mp4 = path.join(OUT, 'hero.mp4');
  const webm = path.join(OUT, 'hero.webm');
  const poster = path.join(OUT, 'hero-poster.webp');

  run(['-i', master, '-an', '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0',
    '-preset', 'veryslow', '-crf', String(SPEC.crf.mp4), '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', mp4]);

  run(['-i', master, '-an', '-c:v', 'libvpx-vp9', '-crf', String(SPEC.crf.webm),
    '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p', webm]);

  /* The poster is what every phone, reduced-motion and no-JS visitor sees, so
     it is taken from the calmest instant rather than frame zero — a quarter in,
     past any opening ramp, before whatever the middle builds to.

     Quality 72, not 86: under 12KB the build inlines it into the page and the
     phone makes no request at all, which is worth more than the difference
     between the two on a dark, soft frame nobody inspects. */
  run(['-ss', (seconds(master) * 0.25).toFixed(2), '-i', master, '-frames:v', '1',
    '-c:v', 'libwebp', '-quality', '72', poster]);

  return { mp4, webm, poster };
}

const clips = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!clips.length) {
  console.error('usage: node tools/build-hero-from-clips.js [--mirror] clipA.mp4 [clipB.mp4]');
  process.exit(2);
}
for (const c of clips) {
  if (!fs.existsSync(c)) { console.error(`not found: ${c}`); process.exit(2); }
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hero-clips-'));
try {
  const master = assemble(clips, dir);
  const { mp4, webm, poster } = encode(master);
  const kb = (b) => `${(b / 1024).toFixed(0)}KB`;
  const bytes = Math.max(fs.statSync(mp4).size, fs.statSync(webm).size);

  console.log(`hero: ${clips.length} clip(s) -> ${seconds(master).toFixed(2)}s loop @ ${SPEC.fps}fps, ${SPEC.width}x${SPEC.height}`);
  console.log(`  hero.mp4         ${kb(fs.statSync(mp4).size)}`);
  console.log(`  hero.webm        ${kb(fs.statSync(webm).size)}`);
  console.log(`  hero-poster.webp ${kb(fs.statSync(poster).size)}`);
  console.log(`  worst case per visitor: ${kb(bytes)} of ${kb(SPEC.budgetBytes)} (${((bytes / SPEC.budgetBytes) * 100).toFixed(0)}%)`);

  if (bytes > SPEC.budgetBytes) {
    fs.unlinkSync(mp4); fs.unlinkSync(webm);
    console.error(`\n  ! over budget — deleted rather than shipped. Raise SPEC.crf or shorten the clips.`);
    process.exit(1);
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
