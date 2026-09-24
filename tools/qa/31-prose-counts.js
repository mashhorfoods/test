/* §31 a count written in prose, against the count in the markup ------

   Found the hard way on 7 September. The Selected Work lead read "Ten
   pieces from recent projects" — and "عشرة أعمال" — while the gallery
   beneath it held SEVEN, because `docs/114` replaced ten placeholders with
   seven real photographs, renumbered the captions 01/07…07/07, and left the
   sentence above them alone. In both languages. On the live site.

   Nothing could have caught it: the number lives in prose, and prose is not
   something the other thirty sections read. It was found while preparing
   the Arabic reviewer's brief, which is a lucky way to find a thing.

   So: a lead that states a count is checked against the gallery it leads.
   Number words in English and Arabic, because the sentence exists twice and
   a mismatch in one language only is the more likely failure — the
   translation gets updated and the original does not, or the reverse. */

module.exports = async function check({ PAGES, fail, BASE, browser }) {
  {
    const WORDS = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
      nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
      /* Arabic counts from three up take the plural form used here. One and
         two are not written as words in this position, so they are absent
         deliberately rather than forgotten. */
      'ثلاثة': 3, 'أربعة': 4, 'خمسة': 5, 'ستة': 6, 'سبعة': 7, 'ثمانية': 8,
      'تسعة': 9, 'عشرة': 10, 'أحد عشر': 11, 'اثنا عشر': 12,
    };
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    for (const page of PAGES) {
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await p.waitForTimeout(300);
      const rows = await p.evaluate(() => [...document.querySelectorAll('.c-gallery')].map((g) => {
        const section = g.closest('section');
        const lead = section?.querySelector('.c-showcase__lead');
        const say = (lang) => {
          const el = lead?.querySelector(`[data-lang-copy="${lang}"]`);
          return el ? el.textContent.trim() : '';
        };
        return { slides: g.querySelectorAll('.c-gallery__item').length, en: say('en'), ar: say('ar'),
          label: g.getAttribute('aria-label') || section?.id || 'gallery' };
      }));
      for (const r of rows) {
        for (const [lang, text] of [['en', r.en], ['ar', r.ar]]) {
          if (!text) continue;
          for (const [word, n] of Object.entries(WORDS)) {
            const re = lang === 'en'
              ? new RegExp(`\\b${word}\\b`, 'i')
              : new RegExp(word);
            if (re.test(text) && n !== r.slides) {
              fail('HIGH', 'content', `${page}: the ${lang === 'ar' ? 'Arabic' : 'English'} lead for "${r.label}" says ${word} (${n}) and the gallery holds ${r.slides} — "${text.slice(0, 70)}"`);
            }
          }
        }
      }
    }
    await ctx.close();
  }
};
