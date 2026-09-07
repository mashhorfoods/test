/* =============================================================================
   BUILD-REEL
   Turns a full-size showreel export into the two files the page actually
   ships, inside the budget, without either of them ever being committed
   at full size.

   WHY THIS EXISTS.
   The reel arrives as a 35MB (or 350MB) export from an editor. That file
   cannot go in the repository — GitHub's web uploader refuses anything over
   25MB outright, and even when it fits, a master travelling in git history is
   a cost paid by every clone forever for bytes no visitor ever downloads.
   So the master stays on the machine it was cut on, and only the delivery
   encodes are committed.

   Run:  npm run reel -- ~/Desktop/pixora-reel.mov
   Then: node build.js && npm run check

   Options:
     --seconds N     trim to the first N seconds
     --from  T       start at T (ffmpeg time, e.g. 00:00:04 or 4.5)
     --mute          drop the audio track
     --width  W      force a width instead of letting the budget choose one

   THE BUDGET DECIDES THE PICTURE, NOT THE OTHER WAY AROUND.
   A target bitrate is computed from the budget and the duration, and the
   frame width is chosen to suit that bitrate — a 90-second reel gets a
   smaller picture than a 30-second one, because the alternative is a
   1280-wide picture starved of bits, which looks worse than a smaller one
   that has enough. Both encodes are measured after they are written and
   DELETED if they are over. A budget that only prints a warning is a budget
   that grows (docs/53).

   IT WRITES OVER THE PLACEHOLDER AND KEEPS THE NAMES. reel.webm, reel.mp4
   and reel-still.webp are the three names the markup knows. Nothing in
   index.html changes when the real footage lands.
   ============================================================================= */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src/assets/showpiece');

/* The click-to-play budget, and it is NOT the hero's budget.

   The hero loop is paid for by every desktop visitor whether or not they
   wanted it, so it is capped at 2MB and argued about. The reel is behind
   `preload="none"` and a control: nothing is fetched until somebody presses
   play, and somebody who presses play has asked for the file. Those are two
   different kinds of cost and one number cannot hold both — which is why
   qa.js §7 now weighs them separately.

   6MB across the pair is roughly twenty-five seconds of waiting on a 2Mbps
   connection before playback can start. That is a real cost and the reason
   the number is not larger. */
const BUDGET = 6 * 1024 * 1024;

/* Audio is a fifth of a small video's bytes. Reserved up front so the video
   rate control is given a number it can actually keep to. */
const AUDIO_KBPS = 96;

function ffmpeg() {
  try {
    return require('ffmpeg-static');
  } catch {
    throw new Error('ffmpeg-static is not installed — npm i -D ffmpeg-static');
  }
}

const run = (args) => execFileSync(ffmpeg(), ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

/** Seconds, read from ffmpeg's own report — there is no ffprobe in ffmpeg-static. */
function duration(file) {
  let out = '';
  try { execFileSync(ffmpeg(), ['-i', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = `${e.stdout || ''}${e.stderr || ''}`; }
  const m = out.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  if (!m) throw new Error(`could not read a duration from ${path.basename(file)} — is it a video?`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** "00:01:04.5", "1:04.5" or "64.5" -> 64.5. ffmpeg accepts all three. */
function seconds_(t) {
  const parts = String(t).split(':').map(Number);
  if (parts.some((n) => !Number.isFinite(n))) throw new Error(`--from ${t} is not a time`);
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function hasAudio(file) {
  let out = '';
  try { execFileSync(ffmpeg(), ['-i', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = `${e.stdout || ''}${e.stderr || ''}`; }
  return /Stream #\d+:\d+.*: Audio:/.test(out);
}

/** The source's own width, or null if it cannot be read. */
function sourceWidth(file) {
  let out = '';
  try { execFileSync(ffmpeg(), ['-i', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = `${e.stdout || ''}${e.stderr || ''}`; }
  const m = out.match(/Stream #\d+:\d+[^\n]*: Video:[^\n]*?, (\d+)x(\d+)/);
  return m ? Number(m[1]) : null;
}

/* Width from bitrate, not from the source. These are the rungs where VP9 at
   this rate still holds detail rather than smearing it; below 300kbps there
   is no width that looks good and 640 is simply the least bad. */
function widthFor(videoKbps) {
  if (videoKbps >= 900) return 1280;
  if (videoKbps >= 500) return 960;
  if (videoKbps >= 300) return 854;
  return 640;
}

const kb = (b) => `${(b / 1024).toFixed(1)}KB`;
const mb = (b) => `${(b / 1048576).toFixed(2)}MB`;

function main() {
  const argv = process.argv.slice(2);
  const flag = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? null : argv[i + 1];
  };

  /* Walked rather than filtered. `argv.find(a => !a.startsWith('--'))` reads
     as "the first thing that is not a flag" and is wrong the moment a flag
     takes a value: `--seconds 60 reel.mov` hands back "60". Values belong to
     the flag before them, so the walk skips them by name. */
  const VALUED = new Set(['--seconds', '--from', '--width']);
  let source = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (VALUED.has(argv[i])) { i += 1; continue; }
    if (argv[i].startsWith('--')) continue;
    source = argv[i];
    break;
  }

  if (!source) {
    console.error(`
  build-reel — encode a showreel master into the two files the page ships.

    npm run reel -- <source video> [--seconds N] [--from T] [--mute] [--width W]

  The source stays where it is. Only src/assets/showpiece/reel.{webm,mp4}
  and reel-still.webp are written, and only if they fit ${mb(BUDGET)}.
`);
    process.exit(1);
  }
  if (!fs.existsSync(source)) throw new Error(`no such file: ${source}`);

  const mute = argv.includes('--mute');
  const seconds = flag('seconds') ? Number(flag('seconds')) : null;
  const from = flag('from');
  const forcedWidth = flag('width') ? Number(flag('width')) : null;

  /* `--from` shortens what is left, and the bitrate is computed from what is
     left. Getting this wrong is the quiet kind: a 90-second master started at
     0:80 would have been rated as 90 seconds of footage and come out at a
     ninth of the bitrate it could have had. */
  const full = duration(source);
  const start = from ? seconds_(from) : 0;
  if (start >= full) throw new Error(`--from ${from} is past the end of a ${full.toFixed(1)}s file`);
  const length = Math.min(seconds || Infinity, full - start);
  if (!(length > 0)) throw new Error('the trim leaves no footage');

  const audio = mute ? false : hasAudio(source);

  /* Two files share the budget, so each gets half. They are not the same
     size at the same quality — VP9 lands smaller than H.264 — but sizing
     both to half means neither can push the pair over on its own. */
  const perFile = BUDGET / 2;
  const totalKbps = (perFile * 8) / 1000 / length;
  const audioKbps = audio ? AUDIO_KBPS : 0;
  /* 6% held back: a container has overhead and rate control lands near the
     target, not on it. Without the margin roughly one encode in three came
     in a hair over and was deleted, which is a slow way to learn. */
  const videoKbps = Math.max(120, Math.floor((totalKbps - audioKbps) * 0.94));
  /* NEVER UPSCALE. The ladder picks a width the bitrate can carry, which on a
     generous budget is 1280 — and `scale=1280:-2` applied to a 640-wide source
     spends real bits inventing pixels that are not in the master. Caught on a
     640x360 test clip that came out 1280 wide and 2.3MB. A forced --width is
     still honoured: if somebody asks for an upscale by name they get one. */
  const srcW = sourceWidth(source);
  const wanted = forcedWidth || widthFor(videoKbps);
  const width = forcedWidth ? wanted : Math.min(wanted, srcW || wanted);
  if (!forcedWidth && srcW && width < wanted) {
    console.log(`  ·  note       source is ${srcW}px wide; not upscaling to ${wanted}`);
  }

  console.log(`\n  build-reel`);
  console.log(`  ·  source     ${path.basename(source)}  ${mb(fs.statSync(source).size)}  ${full.toFixed(1)}s`);
  console.log(`  ·  ships      ${length.toFixed(1)}s${from ? ` from ${from}` : ''}, ${width}px wide, ${audio ? `audio ${audioKbps}k` : 'silent'}`);
  console.log(`  ·  budget     ${mb(BUDGET)} for the pair -> ${videoKbps}kbps of video each\n`);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));
  const trim = [
    ...(from ? ['-ss', String(from)] : []),
    '-i', source,
    ...(seconds ? ['-t', String(length)] : []),
  ];
  const vf = `scale=${width}:-2:flags=lanczos`;
  const webm = path.join(OUT, 'reel.webm');
  const mp4 = path.join(OUT, 'reel.mp4');
  const still = path.join(OUT, 'reel-still.webp');

  /* --- VP9, two passes ---------------------------------------------------
     One pass at a target bitrate lets VP9 spend the budget on whatever comes
     first and starve the end of the reel. Two passes is the difference
     between a number that is a target and a number that is a promise. */
  const pass = path.join(tmp, 'vp9');
  const vp9 = [
    '-vf', vf, '-c:v', 'libvpx-vp9', '-b:v', `${videoKbps}k`,
    '-row-mt', '1', '-pix_fmt', 'yuv420p', '-g', '240', '-deadline', 'good', '-cpu-used', '2',
  ];
  console.log('  ·  vp9 pass 1 …');
  run([...trim, ...vp9, '-pass', '1', '-passlogfile', pass, '-an', '-f', 'null', '-']);
  console.log('  ·  vp9 pass 2 …');
  run([...trim, ...vp9, '-pass', '2', '-passlogfile', pass,
    ...(audio ? ['-c:a', 'libopus', '-b:a', `${audioKbps}k`] : ['-an']), webm]);

  /* --- H.264, for the browsers VP9 does not reach ------------------------
     Constrained quality rather than a hard bitrate: -crf with a -maxrate
     ceiling gives back the bytes an easy shot does not need, instead of
     spending them because the target said so. */
  console.log('  ·  h.264 …');
  run([...trim, '-vf', vf, '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0',
    '-preset', 'veryslow', '-crf', '28', '-maxrate', `${Math.round(videoKbps * 1.3)}k`,
    '-bufsize', `${Math.round(videoKbps * 2.6)}k`, '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    ...(audio ? ['-c:a', 'aac', '-b:a', `${audioKbps}k`] : ['-an']), mp4]);

  /* --- the still ---------------------------------------------------------
     A second in, not frame zero: reels commonly open on black, and a poster
     of black is the blank rectangle the poster exists to prevent.

     ONE SEEK, ADDED UP. This first passed `-ss <from> -ss 1` before `-i`, and
     two `-ss` in the same position do not compose — the later one replaces the
     earlier. So with `--from 00:00:30` the poster came from one second into
     the FILE while the reel started at thirty: a poster of a frame the video
     never shows. Silent, and only visible if you knew both numbers. */
  const stillAt = start + Math.min(1, length / 2);
  console.log('  ·  still …');
  run(['-ss', String(stillAt),
    '-i', source, '-frames:v', '1', '-vf', vf, '-c:v', 'libwebp', '-quality', '80', still]);

  fs.rmSync(tmp, { recursive: true, force: true });

  const sizes = { 'reel.webm': fs.statSync(webm).size, 'reel.mp4': fs.statSync(mp4).size, 'reel-still.webp': fs.statSync(still).size };
  const total = sizes['reel.webm'] + sizes['reel.mp4'];
  console.log('');
  for (const [name, bytes] of Object.entries(sizes)) console.log(`  ·  ${name.padEnd(16)} ${kb(bytes)}`);
  console.log(`  ·  ${'video pair'.padEnd(16)} ${mb(total)} of ${mb(BUDGET)}\n`);

  if (total > BUDGET) {
    fs.rmSync(webm, { force: true });
    fs.rmSync(mp4, { force: true });
    console.error(`  ! over budget by ${kb(total - BUDGET)} — both encodes deleted rather than shipped.`);
    console.error(`    Shorten it (--seconds), drop the audio (--mute), or narrow it (--width 854).`);
    console.error(`    The placeholder is gone too; \`git checkout src/assets/showpiece\` puts it back.\n`);
    process.exit(1);
  }

  /* Signed for the same reason the hero is: two tools write files into this
     directory and at a glance the outputs are hard to tell apart. qa.js §23
     reads the signature. */
  const sha256 = {};
  for (const [name] of Object.entries(sizes)) {
    sha256[name] = crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT, name))).digest('hex');
  }
  fs.writeFileSync(path.join(OUT, 'reel-provenance.json'), `${JSON.stringify({
    generator: 'reel',
    tool: path.basename(__filename),
    at: new Date().toISOString(),
    source: path.basename(source),
    sourceBytes: fs.statSync(source).size,
    seconds: Number(length.toFixed(2)),
    width,
    audio: audio ? `opus/aac ${audioKbps}k` : 'none',
    videoKbps,
    sha256,
    _source: 'The master this was cut from. It is deliberately NOT in the repository — see the header of build-reel.js.',
  }, null, 2)}\n`);

  console.log('  Written. Now: node build.js && npm run check\n');
}

try { main(); } catch (e) { console.error(`\n  ! ${e.message}\n`); process.exit(1); }
