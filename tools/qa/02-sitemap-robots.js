/* §2 sitemap and robots ---- */

module.exports = async function check({ fs, path, DIST, cfg, fail, SHIP, SHIPPED }) {
  {
    const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
    const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const { publicPath } = require('../build-deploy');
    const should = cfg.pages.filter((p) => p.index !== false).map((p) => `${cfg.url}/${publicPath(p.file)}`);
    should.filter((u) => !listed.includes(u)).forEach((u) => fail('HIGH', 'seo', `sitemap is missing ${u}`));
    listed.filter((u) => !should.includes(u)).forEach((u) => fail('MED', 'seo', `sitemap lists an unexpected ${u}`));
    /* The share card. A broken og:image is the one defect that is invisible
       everywhere except somebody else's chat window — the site looks perfect
       and the link previews as a grey strip. So the tag must exist on every
       indexed page, be absolute, and point at a file that actually shipped. */
    for (const page of cfg.pages.filter((p) => p.index !== false)) {
      const file = path.join(DIST, page.file);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      const og = html.match(/<meta property="og:image" content="([^"]+)"/);
      if (!og) { fail('MED', 'seo', `${page.file}: no og:image — links to it preview as a grey strip`); continue; }
      if (!/^https?:\/\//.test(og[1])) fail('HIGH', 'seo', `${page.file}: og:image is relative; every scraper ignores it`);
      const asset = path.join(DIST, og[1].replace(cfg.url, '').replace(/^\//, ''));
      if (!fs.existsSync(asset)) fail('HIGH', 'seo', `${page.file}: og:image points at ${og[1]}, which did not ship`);
    }

    /* The touch icon, checked for the same reason and with the same shape of
       failure: nothing on the page looks wrong, and an iPhone that saves the
       site to its home screen shows a screenshot instead of the mark.

       Three separate things go wrong here, so all three are asserted:
       the link must exist on every shipped page (four <head>s are maintained
       by hand and only this catches the one that was forgotten), it must NOT
       be a data: URI (Safari ignores those, silently), and the file must
       actually be in the archive. */
    for (const page of SHIPPED) {
      const file = path.join(DIST, page);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      const link = html.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/);
      if (!link) { fail('MED', 'seo', `${page}: no apple-touch-icon — an iPhone home-screen shortcut shows a screenshot of the page`); continue; }
      if (link[1].startsWith('data:')) { fail('HIGH', 'seo', `${page}: apple-touch-icon is a data: URI, which Safari ignores`); continue; }
      if (!fs.existsSync(path.join(DIST, link[1].replace(/^\.\//, '')))) {
        fail('HIGH', 'seo', `${page}: apple-touch-icon points at ${link[1]}, which did not ship`);
      }
    }

    const robots = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
    if (!robots.includes('Sitemap:')) fail('MED', 'seo', 'robots.txt does not point at the sitemap');
    /* A noindex page needs a Disallow only if it ships. styleguide.html is built
       into dist/ and deliberately kept out of the archive, so robots.txt stays
       silent about it — a Disallow would name a URL that returns 404 and would
       advertise an internal page to anyone reading the file. Its own
       `noindex, nofollow` meta is what protects it if it is ever uploaded. */
    cfg.pages.filter((p) => p.index === false && SHIP.includes(p.file)).forEach((p) => {
      if (!robots.includes(p.file)) fail('MED', 'seo', `robots.txt does not disallow ${p.file}`);
    });
    cfg.pages.filter((p) => p.index === false && !SHIP.includes(p.file)).forEach((p) => {
      const file = path.join(DIST, p.file);
      if (!fs.existsSync(file)) return;
      if (!/<meta name="robots" content="noindex/.test(fs.readFileSync(file, 'utf8'))) {
        fail('MED', 'seo', `${p.file} is not in the deployment and carries no noindex meta — nothing keeps it out of an index if it is ever uploaded`);
      }
    });
  }
};
