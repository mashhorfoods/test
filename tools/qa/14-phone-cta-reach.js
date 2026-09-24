/* §14 reach: is a phone visitor ever without a call to action? -----
   Twice now this project has shipped a conversion path that worked on
   desktop and not on the device its market arrives on. On 4 September it
   was eight package buttons at `display: none` below 48em. On 5 September
   it was the header CTA: hidden on phone by design, so a visitor scrolled
   4,700px of the homepage — and 95% of /story — with nothing to press,
   while the fixed desktop header carried one at every scroll position
   (`docs/71`, `docs/72`).

   Neither was visible to any check here, because both pages were complete,
   accessible and correct at every width. What was missing was REACH, and
   reach is only observable by scrolling.

   So this scrolls, in half-screen steps, and asks at each stop whether any
   `.c-btn` is in the viewport. A page that goes more than two screens with
   none fails. Phone only: desktop has never been the problem. */

module.exports = async function check({ fs, path, DIST, fail, BASE, browser, SHIPPED }) {
  {
    const LIMIT_SCREENS = 2;
    for (const page of SHIPPED) {
      if (!fs.existsSync(path.join(DIST, page))) continue;
      const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      for (const lang of ['en', 'ar']) {
        if (lang === 'ar') {
          const ok = await p.evaluate(() => {
            const el = document.querySelector('[data-lang="ar"]');
            if (!el) return false;
            el.click();
            return true;
          });
          if (!ok) continue;
          await p.waitForTimeout(150);
        }
        const worst = await p.evaluate(async () => {
          const vh = window.innerHeight;
          const step = Math.round(vh / 2);
          const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
          let run = 0, worst = 0, at = 0, runStart = 0;
          for (let y = 0; y <= maxScroll; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 30));
            const has = [...document.querySelectorAll('.c-btn')].some((el) => {
              const r = el.getBoundingClientRect();
              return r.height > 0 && r.bottom > 0 && r.top < vh;
            });
            if (has) { if (run > worst) { worst = run; at = runStart; } run = 0; }
            else { if (run === 0) runStart = y; run += step; }
          }
          if (run > worst) { worst = run; at = runStart; }
          window.scrollTo(0, 0);
          return { worst, at, vh };
        });
        const screens = worst.worst / worst.vh;
        if (screens > LIMIT_SCREENS) {
          fail('HIGH', 'reach', `${page} (${lang}) on a 390px phone: ${worst.worst}px — ${screens.toFixed(1)} screens from ${worst.at}px — with no call to action in view (docs/72)`);
        }
      }
      await p.close();
    }
  }
};
