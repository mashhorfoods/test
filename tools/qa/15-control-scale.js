/* §15 the control scale, and both languages on it ------------------
   `docs/70` §4 measured the button system against its own tokens and found
   the tokens were not deciding: the scale declared 40/44/48/56 and the site
   rendered 44/46/48/54/56, with 40 unreachable because a 20px icon in a
   small button was taller than its 14px label.

   `docs/73` then found the larger half: EVERY button on the site was taller
   in Arabic than in English — seven classes of seven on desktop, +15px on
   `.c-final__cta` — because the label is a span, the span carries
   `lang="ar"`, and the generic `:lang(ar)` rule gave it body leading over
   the button's own `line-height: 1`. Nothing looked broken. The buttons were
   simply a different size in half the site's language.

   Both are now structural, so both get a guard: every button must render at
   a declared size, and must render at the SAME size in both languages. */

module.exports = async function check({ fs, path, DIST, pricing, fail, BASE, browser }) {
  {
    const SCALE = [44, 48, 56];   // --touch-target-min / --control-height / --control-height-lg
    const heights = new Map();    // "class|width" -> { en, ar }
    for (const page of ['index.html', 'pricing.html']) {
      if (!fs.existsSync(path.join(DIST, page))) continue;
      for (const width of [390, 1440]) {
        const p = await browser.newPage({ viewport: { width, height: 900 } });
        await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
        for (const lang of ['en', 'ar']) {
          if (lang === 'ar') {
            const ok = await p.evaluate(() => {
              const el = document.querySelector('[data-lang="ar"]');
              if (!el) return false;
              el.click();
              return true;
            });
            if (!ok) continue;
            await p.waitForTimeout(150);
          }
          const rows = await p.evaluate(() => [...document.querySelectorAll('.c-btn')]
            .filter((el) => el.getBoundingClientRect().height > 0)
            .map((el) => ({ cls: el.className.replace(/\s+/g, '.'), h: Math.round(el.getBoundingClientRect().height) })));
          for (const r of rows) {
            /* EVERY BUTTON WITH THIS CLASS, NOT THE LAST ONE.

               This kept `rec[lang] = r.h`, so twelve package CTAs sharing one
               class string collapsed to whichever happened to be measured
               last. When their heights were uniform that was harmless; the
               moment one label wrapped it became a lottery — the same build
               passed locally and failed in CI on 7 September, and both runs
               were right about the button they happened to sample.

               A range makes it deterministic and strictly stronger: a class
               that renders at two sizes in one language is now visible, and
               the comparison between languages is between the same two
               numbers every time. */
            const key = `${r.cls}|${width}`;
            const rec = heights.get(key) || {};
            const cur = rec[lang] || { min: Infinity, max: -Infinity };
            cur.min = Math.min(cur.min, r.h);
            cur.max = Math.max(cur.max, r.h);
            rec[lang] = cur;
            heights.set(key, rec);
          }
        }
        await p.close();
      }
    }
    const say = (r) => (r.min === r.max ? `${r.min}px` : `${r.min}-${r.max}px`);
    for (const [key, rec] of heights) {
      const [cls, width] = key.split('|');
      for (const lang of ['en', 'ar']) {
        if (!rec[lang]) continue;
        const off = [rec[lang].min, rec[lang].max].filter((h) => !SCALE.includes(h));
        if (off.length) {
          /* HIGH, NOT MEDIUM, SINCE 8 SEPTEMBER — and the reason is that this
             check just watched a defect through.

             The full service names made the phone CTA wrap, and it landed at
             84px in both languages. §15's other half compares a control ACROSS
             THE TWO LANGUAGES and stayed silent, because 84 equals 84. This
             half saw it and said MEDIUM six times, and MEDIUM prints and
             passes (docs/56 §3) — so CI went green on a360917 with all six in
             it, and only a person reading the log would have known.

             docs/56 §3 is right that most MEDIUMs are judgement calls worth
             printing rather than enforcing. This one is not a judgement call.
             docs/73 declares three control heights; a fourth height is not a
             debatable preference, it is the system having four heights. It is
             zero today across every page, width and language, so promoting it
             costs nothing and buys the one thing MEDIUM could not: a build
             that stops. */
          fail('HIGH', 'controls', `.${cls} renders ${[...new Set(off)].join(' and ')}px at ${width}px in ${lang} — not one of the declared control heights ${SCALE.join('/')} (docs/73)`);
        }
      }
      if (rec.en && rec.ar && (rec.en.min !== rec.ar.min || rec.en.max !== rec.ar.max)) {
        fail('HIGH', 'controls', `.${cls} is ${say(rec.en)} in English and ${say(rec.ar)} in Arabic at ${width}px — the same button is a different size in each language (docs/73)`);
      }
    }
  }
};
