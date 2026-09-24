/* §16 type: a floor, and no shrinking as the screen grows ----------
   `docs/75` found three components rendering below the design system's
   smallest declared step, on raw rem values that appear nowhere else — and
   all three shared one shape: THEY GOT SMALLER AS THE VIEWPORT GREW.

     .c-orbit__label       12px phone -> 10px on a 1024px laptop
     .c-brand__tagline     11px phone ->  9px above 48em
     .c-orbit__card-label                 8px, the smallest text on the site

   The first two are the service names and the line that says what the
   business is. The cause is `cqw` units and a `min-width` media query
   pulling the wrong way — a container that stops growing before the
   viewport does.

   Two checks, because the floor alone would not have found the shape:
   nothing renders below 10px, and nothing is more than a pixel smaller on
   a desktop than it is on a phone. The one-pixel tolerance is deliberate:
   `--text-label` is 13px on a phone and 12px on a desktop by design, and a
   check that cannot allow that would be turned off. */

module.exports = async function check({ fail, BASE, browser }) {
  {
    const FLOOR = 10;
    const sizes = {};
    /* 1024 is sampled because that is where the orbit label was worst — 10px,
       against 11px at 1440 and 12px on a phone. A check that only looked at
       the two ends would have missed the bottom of the curve. */
    for (const width of [390, 1024, 1440]) {
      const p = await browser.newPage({ viewport: { width, height: 900 } });
      await p.goto(`${BASE}/index.html`, { waitUntil: 'load' });
      await p.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 800) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
        window.scrollTo(0, 0);
      });
      const rows = await p.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('*')) {
          if (!el.getBoundingClientRect().height) continue;
          const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
          if (!text) continue;
          /* Key on the element AND its nearest classed ancestor. Keying on
             the class alone put every unclassed <span> in one bucket, so a
             CTA label was compared against an orbit label and the check
             reported a shrink that did not exist. */
          const own = el.getAttribute('class') || '';
          const parent = el.parentElement && el.parentElement.closest('[class]');
          const key = `${parent ? parent.getAttribute('class').split(' ')[0] : '-'} > ${el.tagName.toLowerCase()}${own ? '.' + own.split(' ')[0] : ''}`;
          out.push({ key, size: +parseFloat(getComputedStyle(el).fontSize).toFixed(1), text: text.slice(0, 24) });
        }
        return out;
      });
      for (const r of rows) {
        sizes[r.key] = sizes[r.key] || { text: r.text };
        const cur = sizes[r.key][width];
        sizes[r.key][width] = cur === undefined ? r.size : Math.min(cur, r.size);
      }
      await p.close();
    }
    for (const [key, rec] of Object.entries(sizes)) {
      const smallest = Math.min(...[rec[390], rec[1024], rec[1440]].filter((v) => v !== undefined));
      if (smallest < FLOOR) {
        fail('HIGH', 'type', `"${rec.text}" renders at ${smallest}px — below the ${FLOOR}px floor (docs/75 §3)`);
      }
      /* Compared against the SMALLEST desktop sample rather than the widest.
         The orbit label bottomed out at 1024 and recovered by 1440, so a
         check that looked only at the two ends would have missed it. */
      const desktop = [rec[1024], rec[1440]].filter((v) => v !== undefined);
      if (rec[390] !== undefined && desktop.length) {
        const worst = Math.min(...desktop);
        if (rec[390] - worst > 1) {
          fail('MED', 'type', `"${rec.text}" is ${rec[390]}px on a phone and ${worst}px on a desktop — it shrinks as the screen grows (docs/75 §3)`);
        }
      }
    }
  }
};
