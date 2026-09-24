/* §40 One name per service, on every surface that names one ----------

   docs/124 §3 found service 04 called four different things on one page:
   "Digital Marketing & Advertising" in the accordion, "Marketing & Ads" on
   the price cards, "Digital Marketing & Ads" in the hero diagram and
   "Digital Marketing" in the ecosystem flow. Nothing could notice, because
   nothing had ever been told which one was right.

   The owner settled it on 8 September: the full name, everywhere a service
   is named. build-catalogue.js holds pricing.json to it. This holds the
   BUILT PAGES to it — including the two diagrams, which no data file feeds
   and which drifted precisely because of that.

   The retired forms come from `aliases` in services.json, so retiring
   another name is one entry there rather than an edit here. A name is only a
   finding where it is the WHOLE of what an element says: "Branding" inside a
   sentence is prose, and "Branding" as the entire label of a service node is
   the old name coming back. */

module.exports = async function check({ fs, path, ROOT, PAGES, fail, BASE, browser }) {
  {
    const cat = path.join(ROOT, 'catalogue/catalogue.public.json');
    if (fs.existsSync(cat)) {
      const C = JSON.parse(fs.readFileSync(cat, 'utf8'));
      const services = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/catalogue/services.json'), 'utf8')).services;
      const retired = new Map();
      for (const s of services) for (const a of s.aliases || []) retired.set(a, s);
      const canonical = new Set(C.services.flatMap((s) => [s.name.en, s.name.ar]));

      /* The elements whose ENTIRE text is a service's name. */
      const SEL = ['.c-orbit__label', '.c-eco__name', '.c-service__name',
        '.c-index__name', '.c-build__name'];

      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const p = await ctx.newPage();
      for (const page of PAGES) {
        await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
        const found = await p.evaluate((sel) => [...document.querySelectorAll(sel.join(','))]
          .map((el) => {
            const en = el.querySelector('[data-lang-copy="en"]');
            const ar = el.querySelector('[data-lang-copy="ar"]');
            const t = (x) => (x ? x.textContent : '').replace(/\s+/g, ' ').trim();
            return { en: t(en) || (el.textContent || '').replace(/\s+/g, ' ').trim(), ar: t(ar), sel: el.className };
          }), SEL);

        for (const f of found) {
          for (const form of [f.en, f.ar]) {
            if (!form) continue;
            if (retired.has(form)) {
              const svc = retired.get(form);
              fail('HIGH', 'naming', `${page}: a service is labelled "${form}" (${f.sel}) — that name was retired; ${svc.id} is "${svc.name.en}"`);
            }
          }
          /* And a surface that names a service must name one we have. This is
             the half that catches a NEW wrong name rather than an old one. */
          if (f.en && !canonical.has(f.en) && /^(Branding|Websites?|Social|Digital|Marketing|Integrated)/.test(f.en)) {
            fail('HIGH', 'naming', `${page}: "${f.en}" (${f.sel}) reads as a service name and matches none of the five`);
          }
        }
      }
      await ctx.close();
    }
  }
};
