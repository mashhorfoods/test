/* §34 a named person's words, held to one source --------------------

   On 7 September Al Mada's founder sent a testimonial, and this site gained
   the first sentence on it that the studio did not write about itself. That
   is worth more than anything else currently published here — and it is
   also the single most dangerous string in the repository, because it is
   the only one attributed to a real person by name.

   TWO WAYS IT GOES WRONG, neither of which any other section can see:

     · DRIFT. The quote is published twice — the homepage, under the four
       deliverables, and the end of the case study. Two copies of a
       sentence, edited independently, is a named man quoted saying two
       different things. Nobody would do that deliberately; a tidy-up of
       one copy's wording is all it takes.
     · A QUOTE WITH NOBODY BEHIND IT. `/about` publishes the promise that
       "there is no invented statistic, client or testimonial anywhere on
       this site". An unattributed quotation — no name, or no role, or one
       language carrying an attribution the other does not — is exactly
       what that promise forbids, and it is one deleted span away at any
       time.

   So: `src/data/story.json` holds the words, and every rendering of them
   anywhere on the site must match it exactly, in both languages, complete
   with a name, a role, and the note declaring that the Arabic is our
   translation. A hand-typed quotation that no source file backs is a
   finding, not a convenience. */

module.exports = async function check({ fs, path, ROOT, PAGES, fail, BASE, browser }) {
  {
    const storyPath = path.join(ROOT, 'src/data/story.json');
    const source = fs.existsSync(storyPath)
      ? JSON.parse(fs.readFileSync(storyPath, 'utf8')).testimonial
      : null;
    const norm = (v) => String(v || '').replace(/\s+/g, ' ').trim();
    const PARTS = ['quote', 'name', 'role', 'note'];

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    const said = new Map(); // "name·lang" -> { quote, page }

    for (const page of PAGES) {
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await p.waitForTimeout(200);
      const blocks = await p.evaluate(() => [...document.querySelectorAll('.c-testimonial')].map((t) => {
        const say = (part, lang) => {
          const el = t.querySelector(`.c-testimonial__${part} [data-lang-copy="${lang}"]`);
          return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
        };
        const read = (part) => ({ en: say(part, 'en'), ar: say(part, 'ar') });
        return { quote: read('quote'), name: read('name'), role: read('role'), note: read('note') };
      }));

      for (const b of blocks) {
        /* Both languages, all four parts. A missing Arabic name is a quote
           attributed to a person in English and to nobody in Arabic. */
        for (const part of PARTS) {
          for (const lang of ['en', 'ar']) {
            if (!b[part][lang]) {
              fail('HIGH', 'content', `${page}: a testimonial has no ${lang === 'ar' ? 'Arabic' : 'English'} ${part} — a quotation attributed to a real person must carry their name, their role and the note that the Arabic is our translation, in both languages`);
            }
          }
        }

        if (!source) {
          fail('HIGH', 'content', `${page}: a testimonial is published that no source file holds — src/data/story.json has no testimonial block, so these are words attributed to a named person with nothing behind them`);
          continue;
        }

        for (const part of PARTS) {
          for (const lang of ['en', 'ar']) {
            const shown = b[part][lang];
            const held = norm(source[part] && source[part][lang]);
            if (shown && held && shown !== held) {
              fail('HIGH', 'content', `${page}: the ${lang === 'ar' ? 'Arabic' : 'English'} ${part} of the ${b.name.en || 'client'} testimonial does not match src/data/story.json — published "${shown.slice(0, 60)}…" against "${held.slice(0, 60)}…". Two copies of one person's words, edited apart`);
            }
          }
        }

        /* Across pages: the same person, twice, saying two things. */
        for (const lang of ['en', 'ar']) {
          const who = b.name[lang];
          if (!who) continue;
          const key = `${who}·${lang}`;
          const prev = said.get(key);
          if (prev && prev.quote !== b.quote[lang]) {
            fail('HIGH', 'content', `${page}: ${who} is quoted differently here than on ${prev.page} (${lang}) — one person, two sets of words`);
          } else if (!prev) {
            said.set(key, { quote: b.quote[lang], page });
          }
        }
      }
    }
    await ctx.close();
  }
};
