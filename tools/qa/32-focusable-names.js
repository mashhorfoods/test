/* §32 a focusable region with no name, or with somebody else's -------

   axe checks that a scrollable region is REACHABLE by keyboard
   (scrollable-region-focusable). It does not check that the thing you land
   in tells you what it is. Both halves of that gap were live on 7 September
   and both passed every automated check:

     · `.c-brandboard`, `.c-devices` and `.c-modules` were given
       `tabindex="0"` by docs/113 to satisfy that very rule, and no name at
       all. Three unnamed groups on the way down one page.
     · Both homepage galleries carried `data-i18n-label="galleryScroller"`,
       so the i18n pass overwrote the two distinct labels the markup had
       written with ONE generic string — three regions across the site
       announcing the same name, and the author's own words destroyed to do
       it.

   docs/67 §1 had already found this shape once and fixed three instances
   of it by hand. A rule is cheaper than finding it a third time. */

module.exports = async function check({ PAGES, fail, BASE, browser }) {
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    for (const page of PAGES) {
      for (const lang of ['en', 'ar']) {
        await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
        await p.waitForTimeout(300);
        if (lang === 'ar') {
          const ok = await p.evaluate(() => {
            const el = document.querySelector('[data-lang="ar"]');
            if (!el) return false;
            el.click(); return true;
          });
          if (!ok) continue;
          await p.waitForTimeout(400);
        }
        const regions = await p.evaluate(() => [...document.querySelectorAll('[tabindex="0"]')]
          .filter((e) => {
            const b = e.getBoundingClientRect();
            const cs = getComputedStyle(e);
            return b.width > 0 && b.height > 0
              && (cs.overflowX === 'auto' || cs.overflowX === 'scroll'
                || cs.overflowY === 'auto' || cs.overflowY === 'scroll');
          })
          .map((e) => ({
            name: (e.getAttribute('aria-label')
              || document.getElementById(e.getAttribute('aria-labelledby') || '')?.textContent
              || '').trim(),
            what: `${e.tagName.toLowerCase()}.${String(e.className || '').split(' ').filter(Boolean)[0] || ''}`,
          })));
        const seen = new Map();
        for (const r of regions) {
          if (!r.name) {
            fail('HIGH', 'a11y', `${page} (${lang}): the focusable scroll region ${r.what} has no accessible name — a keyboard visitor lands in an unnamed group`);
            continue;
          }
          if (seen.has(r.name)) {
            fail('HIGH', 'a11y', `${page} (${lang}): ${r.what} and ${seen.get(r.name)} both announce "${r.name}" — two regions with one name is a name that says nothing`);
          } else {
            seen.set(r.name, r.what);
          }
        }
      }
    }
    await ctx.close();
  }
};
