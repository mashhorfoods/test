/* =============================================================================
   LOADING THE BROWSER — and refusing to pretend when it cannot.

   validate.js and qa.js used to print "skipping" and exit 0 when
   playwright-core was missing. Their reasoning was fair as far as it went — a
   missing test tool is not a failing site — but it is not a passing check
   either, and the README names these two commands as the gate before every
   upload. A gate that reports success without having looked is worse than no
   gate: it is the thing that makes a stale page look reviewed.

   So a missing browser is now a failure, with its own exit code so a script
   can tell "could not run" (2) from "ran and found a HIGH issue" (1).
   Skipping is still possible, but only on purpose, and it says so.

   Both packages are tried: `playwright` bundles `playwright-core`, and either
   one being installed is enough.
   ============================================================================= */

function loadChromium(tool) {
  for (const mod of ['playwright-core', 'playwright']) {
    try {
      return require(mod).chromium;
    } catch {
      // Try the next one.
    }
  }

  if (process.env.SKIP_BROWSER_CHECKS === '1') {
    console.log(`${tool}: SKIPPED on request (SKIP_BROWSER_CHECKS=1). Nothing in the browser was checked.`);
    return null;
  }

  console.error(`\n${tool}: CANNOT RUN — no browser automation package is installed.`);
  console.error('  The browser checks did not run, so this is a failure, not a pass.');
  console.error('  Fix:            npm i -D playwright-core');
  console.error(`  Skip on purpose: SKIP_BROWSER_CHECKS=1 node tools/${tool}.js`);
  process.exit(2);
}

module.exports = { loadChromium };
