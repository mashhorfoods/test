/* §36 English words where an Arabic visitor has to read them ---------

   THREE STRINGS WERE ENGLISH ON THE ARABIC PAGE, AND ALL THREE HAD
   ALREADY BEEN TRANSLATED SOMEWHERE ELSE IN THIS REPOSITORY.

     · The **skip link** — a bare `Skip to content` in the shell every page
       is built from. The first focusable element on the site, on eight
       pages, in the wrong language.
     · The **brand tagline** — `Digital Agency` in the header and the
       footer, while the same element's accessible name says
       `بيكسورا، وكالة رقمية`. A screen reader and an eye on one page got
       different words. `header.css` even carries a
       `[dir="rtl"] .c-brand__tagline` block explaining that Arabic has no
       letter case: **a rule written for Arabic that never had Arabic to
       style.**
     · The **footer portfolio link** — `SOCIAL_LINKS` has carried
       `labelAr: 'أعمال المؤسس'` since it was written, and `renderSocial()`
       took `label` unconditionally. `404.html` was worse: it still said
       `Website`, the label `navigation-map.js` records as deliberately
       replaced.

   None of these is a missing translation. Each is a translation that was
   decided and then not wired up, which is harder to see than an absent one
   because the Arabic is sitting right there in the source.

   `arabic.js` cannot catch them: it looks for runs of four or more English
   words, and these are two, three and two. So this asks a narrower
   question — **can an Arabic visitor reach a control whose name is English
   prose?** — and takes its allowlist from the data rather than from a
   hand-kept list, so a new package name never needs anyone to remember
   this check exists.

   A control living inside the English half of a bilingual pair is skipped:
   an Arabic visitor never reaches it, and counting it is counting
   something nobody sees. Two scratch versions of this check without that
   rule reported twenty findings and every one of them was hidden. */

module.exports = async function check({ fs, path, ROOT, pricing, PAGES, fail, BASE, browser }) {
  {
    const pricingData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pricing.json'), 'utf8'));
    /* Product names are Latin in Arabic on purpose — the site writes
       "اسأل عن باقة Starter". Read from the data so the list cannot go stale. */
    const productWords = new Set();
    for (const c of pricingData.categories || []) {
      for (const w of `${c.label} ${(c.packages || []).map((k) => k.name).join(' ')}`.split(/[^A-Za-z]+/)) {
        if (w.length > 1) productWords.add(w.toLowerCase());
      }
    }
    /* Names of things, not words of a language. Short and stable on purpose. */
    for (const w of ['pixora', 'whatsapp', 'linkedin', 'behance', 'instagram', 'facebook',
      'usd', 'sar', 'aed', 'egp', 'seo', 'google', 'ceo', 'faq', 'al', 'mada', 'muhalab',
      'salah', 'faris', 'mohammed', 'umrah', 'github', 'gmail', 'com']) productWords.add(w);

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    for (const page of PAGES) {
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await p.waitForTimeout(250);
      const set = await p.evaluate(() => { const el = document.querySelector('[data-lang="ar"]'); if (!el) return false; el.click(); return true; });
      if (!set) continue;
      await p.waitForTimeout(400);

      const rows = await p.evaluate(() => [...document.querySelectorAll('a[href],button,summary,input,select,textarea,[tabindex="0"]')]
        .filter((e) => { const w = e.closest('[data-lang-copy]'); return !w || w.getAttribute('data-lang-copy') === 'ar'; })
        .map((e) => {
          const clone = e.cloneNode(true);
          clone.querySelectorAll('[data-lang-copy="en"]').forEach((x) => x.remove());
          const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
          const label = (e.getAttribute('aria-label') || '').trim();
          /* BOTH READINGS, because the tagline defect lived in the gap
             between them: the brand link's aria-label is Arabic and the words
             printed inside it were English, so a check that stops at the
             accessible name sees a healthy control and a person sees an
             English page. The first version of this section did stop there,
             and its negative test for the tagline reported nothing while the
             other two fired — which is how it was caught. */
          return {
            names: [label, text].filter(Boolean),
            where: `${e.tagName.toLowerCase()}.${String(e.className || '').split(' ').filter(Boolean)[0] || ''}`,
          };
        }).filter((r) => r.names.length));

      for (const r of rows) {
        for (const name of r.names) {
          /* Addresses, URLs and numbers are not words of any language. */
          const prose = name
            .replace(/[\w.+-]+@[\w.-]+/g, ' ')
            .replace(/https?:\/\/\S+/g, ' ')
            .split(/[^A-Za-z]+/)
            .filter((w) => w.length > 2 && !productWords.has(w.toLowerCase()));
          if (prose.length) {
            fail('HIGH', 'i18n', `${page} (ar): "${name.slice(0, 50)}" (${r.where}) is English where an Arabic visitor reads it — ${prose.slice(0, 4).join(', ')}`);
            break;
          }
        }
      }
    }
    await ctx.close();
  }
};
