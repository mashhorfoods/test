/* §18 controls that sound identical but are not -------------------
   Twice now this site has shipped a set of controls sharing one accessible
   name while doing different things. `docs/67` §1 found five identical
   "See what it covers" links, one per service. `docs/79` found twelve
   identical "What's not included" disclosures, one per package — missed by
   that pass because it looked at links and buttons and this is a <summary>.

   Both passed axe, because in each case the element HAD a name. The name
   was just the same as eleven others.

   The rule: **three or more controls sharing a name is fine only if they all
   go to the same place.** Four "Start Your Project" buttons all pointing at
   #contact are a deliberate repetition (`docs/30` §11) and pass. Five links
   to five different anchors do not. A <summary> has no destination, so its
   card's own heading stands in for one — twelve summaries in twelve
   differently-named cards are twelve different destinations. */

module.exports = async function check({ fs, path, DIST, fail, BASE, browser, SHIPPED }) {
  {
    for (const page of SHIPPED) {
      if (!fs.existsSync(path.join(DIST, page))) continue;
      const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await p.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
      });
      const groups = await p.evaluate(() => {
        const name = (el) => {
          const al = el.getAttribute('aria-label');
          if (al) return al.trim();
          return (el.innerText || '').replace(/\s+/g, ' ').trim();
        };
        const where = (el) => {
          const href = el.getAttribute('href');
          if (href) return href;
          const card = el.closest('article, li, .c-tier, section');
          if (!card) return '';
          const h = card.querySelector('h2, h3, h4, [class*="__name"]');
          return h ? (h.innerText || '').replace(/\s+/g, ' ').trim() : '';
        };
        const by = {};
        for (const el of document.querySelectorAll('a[href], button, summary, [role="button"]')) {
          if (!el.getBoundingClientRect().height) continue;
          const n = name(el);
          if (!n) continue;
          (by[n] = by[n] || []).push(where(el));
        }
        return Object.entries(by)
          .filter(([, dests]) => dests.length >= 3 && new Set(dests).size > 1)
          .map(([n, dests]) => ({ n, count: dests.length, distinct: new Set(dests).size }));
      });
      for (const g of groups) {
        fail('HIGH', 'a11y', `${page}: ${g.count} controls all announce "${g.n.slice(0, 40)}" but lead to ${g.distinct} different places — a screen reader hears the same name every time (docs/79)`);
      }
      await p.close();
    }
  }
};
