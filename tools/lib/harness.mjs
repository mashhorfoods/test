/**
 * HARNESS — the pass/fail bookkeeping every node test suite shares.
 *
 * Five suites each carried their own copy of these ten lines. They agreed, so
 * nothing was wrong; but a change to how failures print had to be made five
 * times, and one suite had already drifted to a different counter.
 */

export function createHarness(name) {
  const fails = [];
  let passed = 0;

  return {
    /** One assertion. `detail` is printed only when it fails. */
    ok(label, cond, detail = '') {
      if (cond) passed += 1;
      else fails.push(`${label}${detail ? ` — ${detail}` : ''}`);
    },

    /** A heading, printed only with VERBOSE=1. */
    section(title) {
      if (process.env.VERBOSE) console.log(`\n--- ${title}`);
    },

    get passed() { return passed; },
    get failed() { return fails.length; },

    /** Print the result line and set the exit code. Call once, last. */
    finish() {
      if (fails.length) {
        console.error(`\n${name}: ${passed} passed, ${fails.length} FAILED\n`);
        fails.forEach((f) => console.error(`  ✗ ${f}`));
        console.error('');
        process.exit(1);
      }
      console.log(`${name}: ${passed} passed, 0 failed`);
    },
  };
}
