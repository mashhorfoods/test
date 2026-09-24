/* §7 the showpiece budget ------------------------------------------
   WEBSTART X, X05: one budgeted showpiece — a video hero on desktop, a
   still on the phone. Written as a check rather than an intention because
   a budget nobody measures is a budget that grows. See docs/53.

   Passes vacuously until a video ships. That is the point: it is here on
   the day the decision was made, not on the day someone notices the phone
   build got heavy. */

module.exports = async function check({ fs, path, DIST, PAGES, fail, BASE, browser }) {
  /* TWO BUDGETS, BECAUSE THERE ARE TWO KINDS OF COST. Split 7 Sep 2026.

     One number used to cover every video file in assets/, and that number was
     written for the hero: a loop hero-film.js attaches on every wide screen,
     which every desktop visitor pays for whether or not they wanted it. 2MB
     is the right cap for that and it does not move.

     The showreel is not that. It sits behind `preload="none"` inside a
     `<video controls>`: not one byte is fetched until somebody presses play,
     and somebody who presses play has asked for the file. Weighing it against
     the hero's number said a sixty-second reel had to fit in the 350KB the
     hero left over — which is not a reel, it is a warning. So click-to-play
     video gets its own 6MB, roughly twenty-five seconds of waiting on a 2Mbps
     connection: still a real cost, which is why it is not larger.

     WHICH POOL A FILE IS IN IS READ FROM THE MARKUP, NOT FROM ITS NAME. A
     file is click-to-play only if every `<video>` that references it carries
     both `controls` and `preload="none"`. Anything else — attached by script,
     autoplaying, or referenced nowhere the parse can see — counts against the
     hero. The conservative default is the point: a reel that loses its
     `controls` attribute silently becomes a 6MB autoplay, and this is what
     notices. */
  {
    const AUTO_BUDGET = 2 * 1024 * 1024;  // paid by every desktop visitor
    const CLICK_BUDGET = 6 * 1024 * 1024; // paid only by someone who pressed play
    const assets = path.join(DIST, 'assets');
    const vids = fs.existsSync(assets)
      ? fs.readdirSync(assets).filter((f) => /\.(mp4|webm|mov|m4v)$/i.test(f))
      : [];

    /* Every <video> in every shipped page, with the files it names. */
    const clickOnly = new Set(vids);
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(DIST, page), 'utf8');
      for (const block of html.match(/<video\b[\s\S]*?<\/video>/gi) || []) {
        const tag = block.match(/<video\b[^>]*>/i)[0];
        const gated = /\bcontrols\b/i.test(tag) && /preload="none"/i.test(tag);
        const named = [...block.matchAll(/(?:src|data-film-webm|data-film-mp4)="[^"]*?([^/"]+\.(?:mp4|webm|mov|m4v))"/gi)]
          .map((m) => m[1]);
        if (!gated) named.forEach((n) => clickOnly.delete(n));
      }
    }
    /* A file no page references at all is dead weight in assets/ — and it is
       weighed against the stricter pool, not excused by the looser one. */
    const referenced = new Set();
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(DIST, page), 'utf8');
      for (const m of html.matchAll(/([\w.-]+\.(?:mp4|webm|mov|m4v))/gi)) referenced.add(m[1]);
    }
    for (const v of vids) if (!referenced.has(v)) clickOnly.delete(v);

    let auto = 0;
    let click = 0;
    for (const v of vids) {
      const bytes = fs.statSync(path.join(assets, v)).size;
      const cap = clickOnly.has(v) ? CLICK_BUDGET : AUTO_BUDGET;
      if (clickOnly.has(v)) click += bytes; else auto += bytes;
      if (/\.mov$/i.test(v)) fail('HIGH', 'budget', `${v} is a .mov — an editing format, not a delivery one`);
      if (bytes > cap) fail('HIGH', 'budget', `${v} is ${(bytes / 1048576).toFixed(1)}MB, over the ${cap / 1048576}MB ${clickOnly.has(v) ? 'click-to-play' : 'showpiece'} budget`);
    }
    if (auto > AUTO_BUDGET) fail('HIGH', 'budget', `video every visitor pays for totals ${(auto / 1048576).toFixed(1)}MB — the budget is one showpiece, not a library`);
    if (click > CLICK_BUDGET) fail('HIGH', 'budget', `click-to-play video totals ${(click / 1048576).toFixed(1)}MB, over ${CLICK_BUDGET / 1048576}MB — re-encode with tools/build-reel.js`);

    /* Markup rules. A video without a poster is a blank rectangle until it
       decodes; one without preload="none" spends the budget on every visitor
       whether or not they ever see it; one with sound autoplays into a room. */
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(DIST, page), 'utf8');
      /* The rule is "a video is never a blank rectangle", not "a video has a
         poster attribute". An <img> painted underneath satisfies it better —
         it renders before the video element is parsed, and it survives a
         failed video entirely — so either form passes. */
      const stillNearby = /<img\b[^>]*class="[^"]*__still/i.test(html);
      for (const tag of html.match(/<video\b[^>]*>/gi) || []) {
        if (!/\bposter=/i.test(tag) && !stillNearby) fail('HIGH', 'budget', `${page}: <video> has no poster and no still beneath it — the hero is blank until it decodes`);
        if (!/preload="none"/i.test(tag)) fail('HIGH', 'budget', `${page}: <video> does not set preload="none"`);
        if (/\bautoplay\b/i.test(tag) && !/\bmuted\b/i.test(tag)) fail('HIGH', 'budget', `${page}: <video autoplay> without muted — it will be blocked, and it should be`);
        if (!/\bplaysinline\b/i.test(tag)) fail('MED', 'budget', `${page}: <video> without playsinline goes fullscreen on iOS`);
      }
    }

    /* The rule most likely to be broken quietly: the phone must not pay for
       the desktop's showpiece. Measured, not assumed. */
    const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    const heavy = [];
    p.on('request', (r) => { if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(r.url())) heavy.push(r.url().split('/').pop()); });
    await p.goto(`${BASE}/index.html`, { waitUntil: 'load' });
    await p.waitForTimeout(1200);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(900);
    if (heavy.length) fail('HIGH', 'budget', `the phone requested video (${heavy.join(', ')}) — the still is the phone's version`);

    /* ---- 8 width parity ---------------------------------------------------
       X01 found eight of thirteen package CTAs missing on the phone: a rule
       hid them when they were interchangeable, and stayed after P0-4 made each
       one carry its own package, price and analytics attribute. Nothing
       watched it, because every check counted links on ONE width.

       So this counts the conversion affordances a buyer can actually reach at
       390 and at 1280 and requires them to match. A deliberate difference is
       still allowed — it just has to be argued for here rather than happen. */
    const reach = async (width, isMobile) => {
      const c = await browser.newContext({ viewport: { width, height: 800 }, isMobile, hasTouch: isMobile });
      const pg = await c.newPage();
      await pg.goto(`${BASE}/index.html`, { waitUntil: 'load' });
      await pg.waitForTimeout(700);
      const n = await pg.evaluate(() => [...document.querySelectorAll('main a[href*="wa.me"]')]
        .filter((a) => { const b = a.getBoundingClientRect(); return b.width > 0 && b.height > 0; }).length);
      await c.close();
      return n;
    };
    const wide = await reach(1280, false);
    const narrow = await reach(390, true);
    if (narrow < wide) {
      fail('HIGH', 'parity', `the phone reaches ${narrow} package CTA(s), the desktop ${wide} — the conversion path is not the same on both`);
    }

    await ctx.close();
  }
};
