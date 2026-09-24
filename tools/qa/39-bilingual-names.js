/* §39 Every generated name names itself in both languages ------------

   "Company Profile" shipped for weeks as a bare English string inside the
   add-ons list, while its ten neighbours each carried the two-span pair the
   rest of the site uses. It was hand-typed markup, so nothing could have
   told anyone: there was no rule for it to break.

   The add-ons and the builder are generated now, which removes the way that
   defect was introduced. This removes the way it could come back — because
   a generator is only as bilingual as its data, and a new row with a
   missing `ar` would produce exactly the same silent English string. */

module.exports = async function check({ PAGES, fail, BASE, browser }) {
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    for (const page of PAGES) {
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      const bad = await p.evaluate(() => {
        const out = [];
        const SELECTORS = ['.c-addon__name', '.c-pick__label', '.c-build__name', '.c-addons__category'];
        for (const sel of SELECTORS) {
          for (const el of document.querySelectorAll(sel)) {
            const en = el.querySelectorAll('[data-lang-copy="en"]').length;
            const ar = el.querySelectorAll('[data-lang-copy="ar"]').length;
            /* A heading can legitimately hold more than one pair — the add-on
               category headings carry their name AND a hidden count, and the
               first version of this check called all five of them defects.
               What matters is that the two languages are matched, and that no
               words sit OUTSIDE a pair. */
            const clone = el.cloneNode(true);
            clone.querySelectorAll('[data-lang-copy], [aria-hidden="true"]').forEach((x) => x.remove());
            /* Digits and punctuation belong to no language. */
            const loose = (clone.textContent || '').replace(/[\s\d.,:;/()·—–-]+/g, '');
            if (en < 1 || ar < 1 || en !== ar || loose) {
              out.push({
                sel,
                text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
                en, ar, loose: loose.slice(0, 30),
              });
            }
          }
        }
        return out;
      });
      for (const b of bad) {
        const why = b.loose
          ? `the words "${b.loose}" sit outside any language pair`
          : `it carries ${b.en} English and ${b.ar} Arabic label(s)`;
        fail('HIGH', 'i18n', `${page}: ${b.sel} "${b.text}" — ${why}; a generated name must say itself in both languages and in neither by accident`);
      }
    }
    await ctx.close();
  }
};
