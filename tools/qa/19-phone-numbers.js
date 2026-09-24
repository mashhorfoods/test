/* §19 the number you read is the number it dials --------------------
   WHAT WAS CLAIMED AND NEVER CHECKED. navigation-map.js carried a
   CONTACT_CHANNELS constant whose docstring said "Everything that shows a
   channel reads from here, so the visible number and the dialled number
   cannot drift apart." Nothing imported it. The numbers are hand-written in
   index.html, accessibility.html, privacy.html and terms.html, and the only
   thing standing between a corrected display and an uncorrected href was
   whoever happened to edit both.

   A wrong published phone number is not a cosmetic defect: it is a buyer
   who calls a stranger, or one who reads the right number, taps it, and
   reaches nobody. Section 12 of this file exists because a rule that styles
   nothing is worse than no rule; a channel that dials nothing is worse
   still.

   So this asserts two things on the SHIPPED pages, which is where a visitor
   meets them:
     a. every tel:, wa.me and mailto: link matches site.config.json;
     b. any digits a visitor can READ inside such a link match the digits
        that link ACTS on.
   (b) is the drift the deleted docstring was worried about, and it is now
   the check rather than the claim. */

module.exports = async function check({ fs, path, DIST, cfg, fail, BASE, browser, SHIPPED }) {
  {
    const digits = (v) => (v || '').replace(/\D/g, '');
    const declared = {
      wa: digits(cfg.contact && cfg.contact.whatsapp),
      tel: digits(cfg.contact && cfg.contact.phone),
      mail: (cfg.contact && cfg.contact.email) || '',
    };
    if (!declared.wa) fail('HIGH', 'contact', 'site.config.json declares no contact.whatsapp — nothing to check the links against');
    if (!declared.tel) fail('HIGH', 'contact', 'site.config.json declares no contact.phone — nothing to check the tel: links against');

    /* THE MARKUP, BEFORE ANY SCRIPT TOUCHES IT. Found by breaking this check
       and watching it not fail: contact.js rewrites every [data-wa] href from
       data-wa-en on load, so a wrong number in the markup is REPAIRED before
       a DOM check can see it. With JavaScript off — which this site promises
       to work under — the wrong number is what the visitor gets. Reading the
       served file is the only way to see the link a no-JS visitor follows. */
    for (const page of SHIPPED) {
      const raw = fs.readFileSync(path.join(DIST, page), 'utf8');
      const attrs = [...raw.matchAll(/(?:href|data-wa-en|data-wa-ar)="((?:tel:|mailto:|https:\/\/wa\.me\/)[^"]*)"/g)].map((m) => m[1]);
      for (const href of new Set(attrs)) {
        if (href.startsWith('mailto:')) {
          const addr = href.slice('mailto:'.length).split('?')[0];
          if (declared.mail && addr && addr !== declared.mail) {
            fail('HIGH', 'contact', `${page} markup links to ${addr}, but site.config.json declares ${declared.mail}`);
          }
          continue;
        }
        const kind = href.startsWith('tel:') ? 'tel' : 'wa';
        const target = digits(href.split('?')[0]);
        if (declared[kind] && target !== declared[kind]) {
          fail('HIGH', 'contact', `${page} markup has a ${kind === 'tel' ? 'tel:' : 'wa.me'} link on ${target} — site.config.json declares ${declared[kind]} (a visitor with JavaScript off follows this one)`);
        }
      }
    }

    const cctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    for (const page of SHIPPED) {
      const pg = await cctx.newPage();
      await pg.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      const links = await pg.evaluate(() => [...document.querySelectorAll('a[href^="tel:"], a[href*="wa.me"], a[href^="mailto:"]')]
        .map((a) => ({
          href: a.getAttribute('href'),
          /* innerText, not textContent: a number hidden from sight is not a
             number a visitor can read, and u-visually-hidden suffixes like
             "(opens in a new tab)" would otherwise count as content. */
          shown: a.innerText.trim(),
          waEn: a.dataset.waEn || '', waAr: a.dataset.waAr || '',
        })));
      await pg.close();

      for (const l of links) {
        /* Every form the link can take, including the two a language swap
           installs — an Arabic href that dialled elsewhere would be invisible
           to a check that only read the markup default. */
        for (const href of [l.href, l.waEn, l.waAr].filter(Boolean)) {
          const kind = href.startsWith('tel:') ? 'tel' : href.includes('wa.me') ? 'wa' : 'mail';
          if (kind === 'mail') {
            const addr = href.slice('mailto:'.length).split('?')[0];
            if (declared.mail && addr && addr !== declared.mail) {
              fail('HIGH', 'contact', `${page} links to ${addr}, but site.config.json declares ${declared.mail}`);
            }
            continue;
          }
          /* The number is the path, never the query: a wa.me prefill can hold
             a price with digits in it, and counting those as the number would
             report drift on every package CTA. */
          const target = digits(href.split('?')[0]);
          const want = declared[kind];
          if (want && target !== want) {
            fail('HIGH', 'contact', `${page} has a ${kind === 'tel' ? 'tel:' : 'wa.me'} link on ${target} — site.config.json declares ${want}`);
          }
        }

        /* (b) — displayed against dialled. Only when the label actually shows
           a number: most CTAs read "Ask about Starter", and a label with no
           digits makes no claim that could be wrong. */
        const seen = digits(l.shown);
        if (!seen || l.href.startsWith('mailto:')) continue;
        const acts = digits(l.href.split('?')[0]);
        /* A displayed number may legitimately omit a country code, so the
           test is that one ends with the other, not that they are equal. */
        if (!acts.endsWith(seen) && !seen.endsWith(acts)) {
          fail('HIGH', 'contact', `${page} shows "${l.shown.replace(/\s+/g, ' ').slice(0, 40)}" on a link that acts on ${acts} — read and dialled disagree`);
        }
      }
    }
    await cctx.close();
  }
};
