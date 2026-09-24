/* §33 the dashboard must never reach the live host -------------------

   `admin.html` is a tool, not a page of the site. It talks to
   api.github.com, and the live site's Content-Security-Policy forbids that
   — correctly. The resolution (docs/120 §4.1) is not to loosen the policy
   but to keep the page off that host entirely: it is served by the review
   surface, GitHub Pages, which has no .htaccess.

   That arrangement is invisible. Nothing about `admin.html` sitting in the
   repository root says "this must not be uploaded", and the one thing
   standing between it and the live server is its absence from a list in
   another file. So the absence is checked, five ways. */

module.exports = async function check({ fs, path, ROOT, DIST, cfg, PAGES, fail, SHIP }) {
  {
    const admin = path.join(ROOT, 'admin.html');
    if (fs.existsSync(admin)) {
      const html = fs.readFileSync(admin, 'utf8');

      const { SHIP } = require('../build-zip.js');
      if (SHIP.includes('admin.html')) {
        fail('HIGH', 'admin', 'admin.html is in SHIP — it would be uploaded to the live host, where its API calls are blocked by the CSP and where it has no business being');
      }
      if (fs.existsSync(path.join(DIST, 'admin.html'))) {
        fail('HIGH', 'admin', 'admin.html has been built into dist/ — nothing should build it, and dist/ is one careless copy away from the server');
      }
      if (cfg.pages.some((p) => p.file === 'admin.html')) {
        fail('HIGH', 'admin', 'admin.html is registered in site.config.json — that makes it a page of the site, which it is not');
      }
      if (!/name="robots"[^>]*noindex/i.test(html)) {
        fail('HIGH', 'admin', 'admin.html does not carry noindex');
      }
      const sitemap = path.join(DIST, 'sitemap.xml');
      if (fs.existsSync(sitemap) && fs.readFileSync(sitemap, 'utf8').includes('admin')) {
        fail('HIGH', 'admin', 'admin.html appears in the sitemap');
      }

      /* A credential pasted once and accidentally committed is the failure
         this whole design is arranged to avoid, so the file is checked for
         one rather than trusted not to have one. */
      if (/gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,}/.test(html)) {
        fail('HIGH', 'admin', 'admin.html contains something shaped like a GitHub token');
      }

      /* Linked from nowhere: a link would put it in front of visitors and in
         front of crawlers that ignore robots. */
      for (const page of PAGES) {
        const body = fs.readFileSync(path.join(DIST, page), 'utf8');
        if (/href="[^"]*admin\.html/.test(body)) {
          fail('HIGH', 'admin', `${page} links to admin.html — it is linked from nowhere by design`);
        }
      }
    }
  }
};
