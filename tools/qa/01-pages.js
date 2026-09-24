/* §1 data integrity, 3 accessibility, 4 bilingual, 5 performance ---- */

module.exports = async function check({ fs, path, DIST, cfg, pricing, PAGES, fail, BASE, browser }) {
  for (const page of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    let bytes = 0; let requests = 0;
    p.on('response', async (r) => {
      requests += 1;
      const len = Number(r.headers()['content-length'] || 0);
      bytes += len || 0;
    });
    await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
    await p.waitForTimeout(900);

    const r = await p.evaluate(() => {
      /* contrast, computed against the first painted ancestor background */
      const lum = (c) => {
        const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      /* Composite every semi-transparent layer over the one behind it. A tag
         painted as accent-at-14% over a dark ground is not the same colour as
         the accent, and comparing it to the accent reports 1:1 — a harness
         bug that would have buried a real finding. */
      const bgOf = (el) => {
        const layers = [];
        for (let n = el; n; n = n.parentElement) {
          const c = getComputedStyle(n).backgroundColor;
          const m = (c.match(/[\d.]+/g) || []).map(Number);
          if (!m.length) continue;
          const alpha = m.length > 3 ? m[3] : 1;
          if (alpha === 0) continue;
          layers.push({ rgb: m.slice(0, 3), alpha });
          if (alpha === 1) break;
        }
        if (!layers.length) return [0, 0, 0];
        let out = layers[layers.length - 1].alpha === 1 ? layers.pop().rgb : [0, 0, 0];
        for (let i = layers.length - 1; i >= 0; i -= 1) {
          const { rgb, alpha } = layers[i];
          out = out.map((v, k) => rgb[k] * alpha + v * (1 - alpha));
        }
        return out;
      };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

      const lowContrast = [];
      document.querySelectorAll('p,li,a,h1,h2,h3,h4,span,dd,dt,summary,label,button').forEach((el) => {
        if (!el.textContent.trim() || el.children.length) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || !el.getClientRects().length) return;
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
        const got = ratio(parse(cs.color), bgOf(el));
        if (got < (large ? 3 : 4.5)) lowContrast.push(`${el.tagName}.${(el.className || '').toString().split(' ')[0]} ${got.toFixed(2)}:1 "${el.textContent.trim().slice(0, 24)}"`);
      });

      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
      const skips = headings.filter((lv, i) => i && lv - headings[i - 1] > 1).length;

      const imgs = [...document.images];
      const enCopy = document.querySelectorAll('[data-lang-copy="en"]').length;
      const arCopy = document.querySelectorAll('[data-lang-copy="ar"]').length;

      return {
        lowContrast,
        skips,
        /* alt="" is the CORRECT marking for a decorative image, not a missing
           one — it tells a screen reader to skip it rather than read a
           filename. So the rule is: every image declares alt, and an empty one
           is only allowed where the image is genuinely decoration. An image
           with neither alt nor a decorative role is the real defect. */
        imgsNoAlt: imgs.filter((i) => {
          if (i.alt) return false;
          if (!i.hasAttribute('alt')) return true;
          return !(i.closest('[aria-hidden="true"]') || i.getAttribute('role') === 'presentation');
        }).length,
        imgsNoDims: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
        /* A data: URI is already in the document — there is no request to
           defer, and lazy-loading one only delays decoding something the
           browser already holds. The rule is about network cost, so it applies
           to images that cost a request. */
        imgsNoLazy: imgs.filter((i) => i.loading !== 'lazy' && !/^data:/i.test(i.getAttribute('src') || '')).length,
        unlabelled: [...document.querySelectorAll('input,select,textarea')]
          .filter((f) => !f.labels?.length && !f.getAttribute('aria-label') && !f.getAttribute('aria-labelledby')).length,
        blankNoRel: [...document.querySelectorAll('a[target="_blank"]')].filter((a) => !/noopener/.test(a.rel)).length,
        pending: document.querySelectorAll('[data-i18n-pending]').length,
        enCopy, arCopy,
        prices: [...document.querySelectorAll('.c-tier__amount')].map((e) => e.textContent.trim()),
        names: [...document.querySelectorAll('.c-tier__name')].map((e) => e.textContent.trim()),
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content || '',
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
        ogUrl: document.querySelector('meta[property="og:url"]')?.content || '',
        /* TEXT NODES. Two wrong versions preceded this one, and both passed the
           very page they were written to catch:
             1. `innerText` — rendering-aware, so on an English-default page it
                never saw the Arabic half at all, which is `display: none`.
             2. `textContent` on childless elements — but the sentence that
                carried the digits also carried a `<strong>`, so its span had a
                child and was skipped.
           Walking text is what a reader does, and it is the third time on this
           project that has been the answer. */
        arabicIndic: (() => {
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let n = 0;
          for (let t = walk.nextNode(); t; t = walk.nextNode()) {
            if (t.parentElement && t.parentElement.closest('script, style')) continue;
            n += (t.nodeValue.match(/[\u0660-\u0669]/g) || []).length;
          }
          return n;
        })(),
        lcp: performance.getEntriesByType('largest-contentful-paint').slice(-1)[0]?.startTime
          || performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    /* data integrity */
    if (r.prices.length) {
      const expected = pricing.categories.flatMap((c) => c.packages.map((k) => ({ name: k.name, price: k.price })));
      r.names.forEach((name, i) => {
        const want = expected.find((e) => e.name === name);
        if (!want) fail('HIGH', 'data', `${page}: card "${name}" is not in pricing.json`);
        /* The page renders text; the file holds a number. Compare them as the
           same kind of thing rather than as different ones. */
        else if (String(want.price) !== String(r.prices[i])) fail('HIGH', 'data', `${page}: "${name}" shows ${r.prices[i]}, source says ${want.price}`);
      });
    }

    /* accessibility */
    if (r.skips) fail('MED', 'a11y', `${page}: ${r.skips} skipped heading level(s)`);
    if (r.imgsNoAlt) fail('HIGH', 'a11y', `${page}: ${r.imgsNoAlt} image(s) without alt`);
    if (r.imgsNoDims) fail('MED', 'a11y', `${page}: ${r.imgsNoDims} image(s) without width/height`);
    if (r.imgsNoLazy) fail('LOW', 'perf', `${page}: ${r.imgsNoLazy} image(s) not lazy-loaded`);
    if (r.unlabelled) fail('HIGH', 'a11y', `${page}: ${r.unlabelled} form control(s) without a label`);
    if (r.blankNoRel) fail('MED', 'security', `${page}: ${r.blankNoRel} new-tab link(s) without rel=noopener`);
    r.lowContrast.slice(0, 6).forEach((t) => fail('HIGH', 'a11y', `${page}: contrast ${t}`));

    /* bilingual */
    if (r.pending) fail('HIGH', 'i18n', `${page}: ${r.pending} string(s) still pending translation`);
    if (r.enCopy !== r.arCopy) fail('HIGH', 'i18n', `${page}: ${r.enCopy} English copies vs ${r.arCopy} Arabic`);
    /* ONE NUMERAL SYSTEM, SITE-WIDE. `docs/47` §2 and `docs/49` §7 settled this
       deliberately: prices, dates, delivery windows and `خطأ 404` all use 0-9,
       because a page whose prices are Western-numeralled and whose body text is
       not asks a reader to switch systems mid-sentence. It was recorded as
       "confirmed" and nothing kept it confirmed — the accessibility page was
       written months later and arrived with ٤٤ × ٤٤ and ١٫٨٦ in it. String
       parity cannot see this: both languages were present and counted. */
    if (r.arabicIndic) fail('MED', 'i18n', `${page}: ${r.arabicIndic} Arabic-Indic digit(s) — the site uses 0-9 in both languages (docs/47 §2)`);

    /* SEO */
    const meta = cfg.pages.find((x) => x.file === page) || {};
    if (!r.title || r.title.length > 65) fail('MED', 'seo', `${page}: title is ${r.title.length} chars`);
    if (!r.desc || r.desc.length < 50 || r.desc.length > 165) fail('MED', 'seo', `${page}: description is ${r.desc.length} chars`);
    if (meta.index !== false && !r.canonical) fail('HIGH', 'seo', `${page}: no canonical`);
    if (meta.index === false && r.canonical) fail('MED', 'seo', `${page}: noindex page carries a canonical`);
    if (meta.index !== false && !r.ogUrl) fail('MED', 'seo', `${page}: no og:url`);

    /* performance */
    const html = fs.statSync(path.join(DIST, page)).size;
    if (html > 600 * 1024) fail('MED', 'perf', `${page}: ${(html / 1024).toFixed(0)}KB of HTML`);
    if (r.lcp > 2500) fail('MED', 'perf', `${page}: largest paint at ${Math.round(r.lcp)}ms`);
    console.log(`  ·  ${page.padEnd(16)} ${(html / 1024).toFixed(0).padStart(4)}KB  ${String(requests).padStart(2)} req  paint ${Math.round(r.lcp)}ms  imgs ${r.imgsNoAlt === 0 ? 'alt ok' : 'ALT MISSING'}`);
    await ctx.close();
  }
};
