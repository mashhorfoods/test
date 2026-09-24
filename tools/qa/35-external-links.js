/* §35 every link that leaves the site says so, in the right language --

   THE RULE ALREADY EXISTED AND HAD A HOLE IN THE ONE PLACE THAT MATTERED.
   On 7 September a census of all 98 `target="_blank"` links found 76 of
   them carrying `(opens in a new tab)` — LinkedIn, Behance, the founder's
   portfolio, the client's own site, and even the WhatsApp links inside the
   legal pages' prose. The 22 that said nothing were **every WhatsApp
   button on the homepage and the pricing page**: the four service CTAs,
   all sixteen package CTAs, the contact panel and the form's fallback.
   The conversion path, and only the conversion path.

   AND THE 76 THAT PASSED WERE ENGLISH ON THE ARABIC PAGE. The note was a
   hard-coded `<span class="u-visually-hidden"> (opens in a new tab)</span>`
   with no Arabic sibling, so an Arabic screen-reader user heard an English
   sentence after every off-site link — 20 of them. Three separate
   mechanisms were in play (a hard-coded English span, a runtime-translated
   one in the footer, and the story generator's), which is why no single
   place was wrong enough to notice.

   A THIRD DEFECT FOUND THE SAME WAY: five `aria-label`s were English on
   both languages, three of them the direct-contact channels, and two of
   those held a second copy of the phone number. Those labels are gone —
   the visible content already names the channel in both languages — and
   §19 still owns the number.

   So this checks what a screen reader would actually be handed: for the
   language showing, every `target="_blank"` link must announce the new tab
   exactly once, in that language. Links inside the other language's half of
   a bilingual pair are skipped, because the visitor never reaches them. */

module.exports = async function check({ PAGES, fail, BASE, browser }) {
  {
    const EN = '(opens in a new tab)';
    const AR = '(يفتح في نافذة جديدة)';
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    for (const page of PAGES) {
      for (const lang of ['en', 'ar']) {
        await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
        await p.waitForTimeout(250);
        /* SET THE LANGUAGE EXPLICITLY, INCLUDING ENGLISH. One context is
           reused for every page here, and the choice is remembered, so after
           the first Arabic pass every later load came back Arabic — and the
           English pass then reported the footer's Arabic note as "the wrong
           language" on nine pages. The site was right and the check was
           wrong, which is the third time a check in this file has been the
           broken thing. Clicking the toggle for BOTH languages is one line
           and cannot drift. */
        const set = await p.evaluate((lang) => { const el = document.querySelector(`[data-lang="${lang}"]`); if (!el) return false; el.click(); return true; }, lang);
        if (!set) continue;
        await p.waitForTimeout(400);
        const rows = await p.evaluate((lang) => [...document.querySelectorAll('a[target="_blank"]')]
          /* A link living inside the other language's span is never reached. */
          .filter((a) => { const w = a.closest('[data-lang-copy]'); return !w || w.getAttribute('data-lang-copy') === lang; })
          .map((a) => {
            /* aria-label wins outright; otherwise the text of the spans this
               language actually shows. innerText cannot be used — a link
               inside a collapsed <details> renders nothing, so innerText is
               empty and textContent returns both languages at once. */
            const clone = a.cloneNode(true);
            clone.querySelectorAll(`[data-lang-copy]:not([data-lang-copy="${lang}"])`).forEach((e) => e.remove());
            return {
              name: (a.getAttribute('aria-label') || clone.textContent).replace(/\s+/g, ' ').trim(),
              where: `${a.tagName.toLowerCase()}.${String(a.className || '').split(' ').filter(Boolean)[0] || ''} → ${(a.href.split('/')[2] || a.href).slice(0, 30)}`,
            };
          }), lang);

        for (const r of rows) {
          const hasEn = r.name.includes('(opens in a new tab)');
          const hasAr = r.name.includes('(يفتح في نافذة جديدة)');
          const want = lang === 'ar' ? hasAr : hasEn;
          const other = lang === 'ar' ? hasEn : hasAr;
          if (!hasEn && !hasAr) {
            fail('HIGH', 'a11y', `${page} (${lang}): "${r.name.slice(0, 45)}" (${r.where}) opens a new tab and does not say so — every other off-site link on this site does`);
          } else if (!want) {
            fail('HIGH', 'a11y', `${page} (${lang}): "${r.name.slice(0, 45)}" (${r.where}) announces the new tab in the wrong language`);
          } else if (other) {
            fail('HIGH', 'a11y', `${page} (${lang}): "${r.name.slice(0, 45)}" (${r.where}) announces the new tab twice, once in each language`);
          }
        }
      }
    }
    await ctx.close();
  }
};
