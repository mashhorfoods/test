/* §21 the gallery must never become a carousel ------------------------
   WHAT THIS COMPONENT PROMISES. gallery.css is a scroll-snap track chosen
   over a carousel for one reason: a carousel hides every slide but one and
   needs script to bring the rest back, which is exactly the failure §20
   measures at 132 blocks. This hides nothing, so there is nothing to strand.

   That promise is one CSS declaration away from being false. `overflow:
   hidden` instead of `auto`, or a slide given `display: none` by a later
   rule, turns it back into a carousel with no script to operate it — every
   item after the first unreachable, silently, on every page.

   So: with JAVASCRIPT OFF, which is the state the component was chosen for,
   every item must be visible and the track must actually scroll. */

module.exports = async function check({ fs, path, DIST, fail, BASE, browser, SHIPPED }) {
  {
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    for (const page of SHIPPED) {
      if (!/class="c-gallery"/.test(fs.readFileSync(path.join(DIST, page), 'utf8'))) continue;
      const pg = await nojs.newPage();
      await pg.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      const report = await pg.evaluate(() => [...document.querySelectorAll('.c-gallery')].map((g) => {
        const items = [...g.querySelectorAll('.c-gallery__item')];
        const cs = getComputedStyle(g);
        return {
          items: items.length,
          hidden: items.filter((i) => {
            const s = getComputedStyle(i);
            return s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05;
          }).length,
          /* Clipped and unreachable is the carousel failure wearing gallery
             clothes: the items exist, and no one can get to them. */
          clipped: cs.overflowX === 'hidden' && g.scrollWidth > g.clientWidth + 4,
          reachable: g.scrollWidth > g.clientWidth + 4 || items.length <= 1,
        };
      }));
      await pg.close();

      for (const g of report) {
        if (g.items < 2) {
          fail('MED', 'gallery', `${page} renders a gallery holding ${g.items} item(s) — a one-slide slideshow is a picture with extra controls, and build-story.js is meant to emit a plain figure instead`);
        }
        if (g.hidden) {
          fail('HIGH', 'gallery', `${page} hides ${g.hidden} of ${g.items} gallery item(s) with JavaScript off — that is a carousel, and there is no script to operate it`);
        }
        if (g.clipped) {
          fail('HIGH', 'gallery', `${page} clips its gallery instead of scrolling it — every item past the first is unreachable`);
        }
      }
    }
    await nojs.close();
  }
};
