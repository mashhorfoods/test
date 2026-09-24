/* §10 the printed page ----------------------------------------------
   WHY THIS IS A CHECK AND NOT A ONE-OFF FIX.
   Every browser prints with "background graphics" OFF by default, and this
   is a dark site: with the grounds gone, `--color-text-primary` is white ink
   on white paper. Before `src/styles/07-print.css` existed, /pricing printed
   as a blank sheet carrying one yellow X — the accent letter of the logo,
   the only mark dark enough to survive.

   That is the exact shape of defect this project keeps meeting: nothing on
   screen looks wrong, and the failure only exists somewhere nobody looked.
   The pricing page is the one page a buyer saves to PDF and forwards to
   whoever signs, so it gets a test rather than a fix and a hope.

   HOW IT MEASURES. Print media is emulated, background painting is removed
   the way the print dialog removes it, and every visible text node's
   computed colour is checked against white. Anything the print stylesheet
   hides is skipped — being invisible on paper on purpose is the point of
   half that file. */

module.exports = async function check({ fail, BASE, browser, SHIPPED }) {
  {
    const KILL_BG = '*,*::before,*::after{background-image:none!important;background-color:transparent!important}html,body{background:#fff!important}';
    for (const page of SHIPPED) {
      const c = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
      const pg = await c.newPage();
      await pg.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await pg.waitForTimeout(700);
      await pg.emulateMedia({ media: 'print' });
      await pg.addStyleTag({ content: KILL_BG });
      await pg.waitForTimeout(200);

      const faint = await pg.evaluate(() => {
        const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
        const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
        /* Composited against white, because that is the paper. An alpha of
           0.2 on black is not dark grey, it is nearly nothing. */
        const onWhite = (s) => {
          const m = s.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const [r, g, b, a = 1] = m[1].split(',').map(Number);
          return [r, g, b].map((ch) => ch * a + 255 * (1 - a));
        };
        const out = [];
        for (const el of document.querySelectorAll('main *, footer *')) {
          if (el.children.length) continue;                    // leaf text only
          const text = (el.textContent || '').trim();
          if (text.length < 3) continue;
          const box = el.getBoundingClientRect();
          if (box.width < 1 || box.height < 1) continue;       // hidden in print
          const px = onWhite(getComputedStyle(el).color);
          if (!px) continue;
          const ratio = 1.05 / (lum(px) + 0.05);
          if (ratio < 4.5) out.push({ ratio: Math.round(ratio * 100) / 100, text: text.slice(0, 40), sel: el.className || el.tagName });
        }
        return out;
      });

      const worst = faint.sort((a, b) => a.ratio - b.ratio).slice(0, 3);
      for (const f of worst) {
        fail(f.ratio < 2 ? 'HIGH' : 'MED', 'print',
          `${page}: printed text at ${f.ratio}:1 on paper — "${f.text}" (${f.sel})`);
      }
      if (faint.length > worst.length) {
        fail('MED', 'print', `${page}: ${faint.length - worst.length} further faint element(s) on paper`);
      }
      await c.close();
    }
  }
};
