/* §9 the transfer budget --------------------------------------------
   WHAT WAS NEVER MEASURED. Section 1 caps the HTML at 600KB and docs/53 caps
   the showpiece at 2MB per visitor. Between those two numbers sat everything
   else — twelve WebP panels, and whatever gets added next — and nothing
   counted it. A site whose whole argument is that it is light should not
   learn its own weight from a client on a hotel connection.

   THE BUDGET IS 1MB PER PAGE, EXCLUDING THE SHOWPIECE. The film has its own
   number in docs/53 §2 and its own check in section 7; counting it here
   would make one file answer to two budgets that could drift apart. The
   homepage measures 918KB today — 510KB of one HTML file (fonts, CSS, JS and
   the inlined poster) plus 408KB of brand-board panels. Roughly 11% of
   headroom is deliberate: it is about one more panel, which is exactly the
   size of decision that should have to be made on purpose.

   TWO NUMBERS, BECAUSE DIFFERENT PEOPLE PAY THEM. `first` is what everyone
   downloads to see the first screen. `full` is what a reader who scrolls the
   whole page pays — on a 30,000px phone page, a committed one.

   AND `full` IS ONLY REACHABLE BY SCROLLING IN STEPS. A single jump to the
   bottom fetches almost nothing: a lazy image loads when it enters the
   viewport, and a page that scrolls past twelve of them in one frame never
   puts any of them there. The first draft of this check did exactly that and
   reported the homepage at 510KB — wrong by 408KB, and confident about it. */

module.exports = async function check({ fs, path, DIST, fail, BASE, browser, SHIPPED }) {
  {
    /* RAISED 7 Sep 2026, 1024KB -> 1200KB, deliberately and in a commit
       message, which is what the note below asks for.

       What it buys: the Selected Work gallery stopped being ten placeholder
       SVGs (40KB of nothing) and became seven real pieces of branding work
       supplied by the owner — 205KB after re-encoding at 900px, and the one
       detail-heavy flat-lay taken down to q0.50 on its own to stop it costing
       99KB by itself.

       Why it is worth the bytes here specifically: these images ARE the
       product. A studio selling design that ships soft, over-compressed
       pictures of its own work has argued against itself. And the number that
       governs how fast the page FEELS did not move — the gallery is below the
       fold and lazy, so the first screen stays at ~437KB against its own
       480KB budget, untouched. A visitor only pays this if they scroll to the
       work, which is the moment they have decided to look at it. */
    const BUDGET = 1200 * 1024;
    /* Above today's 450KB on purpose: a ratchet against the next unbudgeted
       feature, not a demand to undo the last two. Moving it is a decision to
       take in a commit message, which is the point. */
    const FIRST_SCREEN_BUDGET = 480 * 1024;
    /* `first` IS DEFINED BY LAYOUT, NOT BY A CLOCK.

       It used to be "everything fetched by load + 900ms", which made it a
       measure of how fast the machine was: a lazy image that finished inside
       the window counted, the same image on a slower runner did not. The same
       code reported 418KB in the dev container and 450KB in CI — 32KB apart
       on identical bytes — so a budget on it could pass in one place and fail
       in the other for no reason anyone could act on.

       Now an image is counted if its box overlaps the first viewport, and
       excluded if it does not. Whether a below-fold image happened to load is
       no longer a question the number can be sensitive to, because it is
       excluded either way. The waits below are conditions, not timeouts.

       Known approximation: a CSS background image is not in document.images,
       so it counts as first-screen wherever it sits. This site does not use
       any for content; if that changes, this counts high rather than low,
       which is the safe direction for a budget. */
    const weigh = async (page, width, height, scroll) => {
      const c = await browser.newContext({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
      const pg = await c.newPage();
      const seen = [];
      pg.on('response', (r) => seen.push(r.body().then((b) => [r.url(), b.length]).catch(() => null)));
      await pg.goto(`${BASE}/${page}`, { waitUntil: 'load' });

      /* Every URL each image could resolve to (src and every srcset
         candidate), absolute, split by whether the element overlaps the first
         viewport. Read from attributes rather than currentSrc: a lazy image
         that has not started loading has no currentSrc, and missing it here
         is exactly how its bytes would leak back into `first`. */
      const imgs = await pg.evaluate(() => {
        const abs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
        const urlsOf = (el) => {
          const out = [];
          if (el.getAttribute('src')) out.push(abs(el.getAttribute('src')));
          for (const part of (el.getAttribute('srcset') || '').split(',')) {
            const u = part.trim().split(/\s+/)[0];
            if (u) out.push(abs(u));
          }
          return out.filter(Boolean);
        };
        const all = new Set(); const firstScreen = new Set();
        const h = window.innerHeight;
        for (const img of document.images) {
          const r = img.getBoundingClientRect();
          const overlaps = r.top < h && r.bottom > 0;
          const urls = [...urlsOf(img), ...[...(img.parentElement?.tagName === 'PICTURE'
            ? img.parentElement.querySelectorAll('source') : [])].flatMap(urlsOf)];
          for (const u of urls) { all.add(u); if (overlaps) firstScreen.add(u); }
        }
        return { all: [...all], firstScreen: [...firstScreen] };
      });
      const belowFold = new Set(imgs.all.filter((u) => !imgs.firstScreen.includes(u)));

      /* Two conditions rather than a fixed wait: the images that DO overlap
         the first viewport have finished, and font loading has settled. Both
         are async and both would otherwise be a race against the clock. */
      await pg.waitForFunction(() => {
        const h = window.innerHeight;
        return [...document.images]
          .filter((i) => { const r = i.getBoundingClientRect(); return r.top < h && r.bottom > 0; })
          .every((i) => i.complete);
      }, null, { timeout: 20000 }).catch(() => {});
      await pg.evaluate(() => document.fonts.ready).catch(() => {});

      const settle = async () => (await Promise.all(seen)).filter(Boolean);
      const sum = (rows, film) => rows.filter(([u]) => /hero\.(mp4|webm)$/.test(u) === film)
        .reduce((n, [, b]) => n + b, 0);

      const firstRows = (await settle()).filter(([u]) => !belowFold.has(u) && !/hero\.(mp4|webm)$/.test(u));
      const first = firstRows.reduce((n, [, b]) => n + b, 0);

      /* WHERE THE BYTES WENT, not just how many.

         This measurement reads 418KB in the dev container and 450KB on the CI
         runner, and neither of the obvious explanations survived being tested:
         throttling the network to a quarter of its speed moved the number not
         at all, and waiting on document.fonts.ready instead of a timer fetched
         the same five files. The remaining difference between the two is the
         browser build itself, which cannot be reproduced from here.

         Rather than guess a third time, the number now carries its own
         composition. A 32KB disagreement that names a font is a different
         problem from one that names an image or the document, and the log line
         says which without anyone having to reproduce anything. */
      const bucket = (u) => (/\.woff2?$/.test(u) ? 'fonts'
        : /\.(webp|png|jpe?g|svg|avif|gif)$/.test(u) ? 'img'
        : /\.html?$|\/$/.test(u) ? 'html' : 'other');
      const parts = {};
      const otherUrls = new Set();
      for (const [u, b] of firstRows) {
        const k = bucket(u);
        parts[k] = (parts[k] || 0) + b;
        /* `other` is the bucket for things we did not anticipate, so it is the
           one that has to name itself. A 3KB "other" that turns out to be a
           data: URI is a non-finding; the same 3KB against a real request is
           a page fetching something nobody meant it to. */
        if (k === 'other') otherUrls.add(u.startsWith('data:') ? 'data:' : u.split('/').pop().slice(0, 24));
      }
      const firstBreakdown = ['html', 'fonts', 'img', 'other']
        .filter((k) => parts[k])
        .map((k) => `${k} ${(parts[k] / 1024).toFixed(0)}${k === 'other' ? ` [${[...otherUrls].join(' ')}]` : ''}`)
        .join(' + ');

      if (scroll) {
        const H = await pg.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < H; y += height) {
          await pg.evaluate((v) => window.scrollTo(0, v), y);
          await pg.waitForTimeout(60);
        }
        /* Again a condition rather than a fixed wait: every image on the page
           has settled, however long that took. */
        await pg.waitForFunction(() => [...document.images].every((i) => i.complete),
          null, { timeout: 30000 }).catch(() => {});
      }
      const rows = await settle();
      const out = { first, firstBreakdown, full: sum(rows, false), film: sum(rows, true) };
      await c.close();
      return out;
    };

    console.log('');
    for (const page of SHIPPED) {
      /* A page that references nothing under dist/assets/ IS its HTML file:
         nothing about it can change with the viewport or with scrolling, so it
         is weighed once rather than four times. */
      const varies = /src="\.\/assets\//.test(fs.readFileSync(path.join(DIST, page), 'utf8'));
      const phone = await weigh(page, 390, 844, varies);
      const desktop = varies ? await weigh(page, 1440, 900, true) : phone;

      for (const [label, m] of [['phone', phone], ['desktop', desktop]]) {
        if (m.full > BUDGET) {
          fail('MED', 'budget', `${page} @${label}: ${(m.full / 1024).toFixed(0)}KB excluding the showpiece, over the ${BUDGET / 1024}KB budget`);
        }
        if (!varies) break; // one measurement, one verdict
      }

      /* THE FIRST SCREEN HAS ITS OWN BUDGET, and it is the homepage's that
         matters: docs/52 stakes the whole positioning on a buyer in the Gulf
         on mobile data, and `full` at 1MB is a different promise to a
         different person — the reader who scrolls, not the one deciding
         whether to stay.

         This number was already measured and printed on every run. What it
         never had was a threshold, so it moved 314KB → 450KB across two
         interactive features (docs/92 §3.1, docs/98 §5) with nobody reading
         the line it was printed on. A number nobody acts on is not a guard. */
      if (page === 'index.html') {
        if (phone.first > FIRST_SCREEN_BUDGET) {
          fail('MED', 'budget', `the homepage costs a phone ${(phone.first / 1024).toFixed(0)}KB before it scrolls, over the ${FIRST_SCREEN_BUDGET / 1024}KB first-screen budget (docs/98 §5) — either the budget moves deliberately or the page comes back under it`);
        }
        /* docs/92 §3.2 verified once that a phone never requests the film, and
           nothing kept it verified. It is the reason the number above is
           affordable at all. */
        if (phone.film > 0) {
          fail('HIGH', 'budget', `a 390px phone requested ${(phone.film / 1024).toFixed(0)}KB of showpiece — the film is desktop-only (docs/53), and a phone paying for it breaks the one promise the budget exists to keep`);
        }
      }

      const line = varies
        ? `phone ${(phone.full / 1024).toFixed(0)}KB · desktop ${(desktop.full / 1024).toFixed(0)}KB` +
          ` (first screen ${(phone.first / 1024).toFixed(0)}KB = ${phone.firstBreakdown})` + (desktop.film ? ` + ${(desktop.film / 1024).toFixed(0)}KB showpiece` : '')
        : `${(phone.full / 1024).toFixed(0)}KB, one file`;
      console.log(`  ·  ${page.padEnd(14)} ${line}`);
    }
  }
};
