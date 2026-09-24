/**
 * BROWSER — the one way every harness and render tool starts Chromium.
 *
 * Nine tools each carried the same three lines, and all nine failed the same
 * way on a machine where Playwright's own download was absent but a browser
 * was installed elsewhere: `Executable doesn't exist at …`, before a single
 * check ran. Phase 4D's report listed it as the first thing a fresh container
 * hits (W-4D-4).
 *
 * The order: PLAYWRIGHT_CHROMIUM if set; Playwright's own browser if it is
 * actually on disk; otherwise the newest chromium-NNNN under
 * PLAYWRIGHT_BROWSERS_PATH or /opt/pw-browsers. If none is found, Playwright
 * is left to produce its own error, which names what to install.
 */

const fs = require('fs');
const path = require('path');

const BINARIES = ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe'];

function findChromium(chromium) {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  try {
    const own = chromium.executablePath();
    if (own && fs.existsSync(own)) return undefined;
  } catch { /* no bundled browser registered — look for one below */ }

  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean);
  for (const root of roots) {
    let dirs = [];
    try { dirs = fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)); } catch { continue; }
    dirs.sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const dir of dirs) {
      for (const bin of BINARIES) {
        const candidate = path.join(root, dir, bin);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }
  return undefined;
}

/** Launch Chromium. Options pass straight through to Playwright. */
async function launchChromium({ args = ['--no-sandbox'], ...options } = {}) {
  const { chromium } = require('playwright-core');
  const executablePath = findChromium(chromium);
  return chromium.launch({ ...(executablePath ? { executablePath } : {}), args, ...options });
}

module.exports = { launchChromium, findChromium };
