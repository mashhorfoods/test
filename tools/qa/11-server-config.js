/* §11 the server configuration -------------------------------------
   THE ONE ARTIFACT NO OTHER CHECK TOUCHES. `.htaccess` is not exercised by
   anything above: the local server that serves `dist/` sends no headers of
   its own, so every rule in that file is unverified until it is on a real
   host — and `docs/58` T6 already records that the site "looks perfect
   without it".

   THE CATASTROPHIC ONE IS THE CSP. Every page inlines its own module, and
   the policy names each inline script by sha256. Get one hash wrong and that
   page's JavaScript is refused by the browser in production: no accordion,
   no language toggle, no package pre-fill — while locally, with no CSP
   header at all, everything works. There is no partial version of this
   failure and no way to notice it before a visitor does.

   So the hashes are recomputed here from the shipped bytes and matched both
   ways: every inline script must be named, and every name must match a
   script. The second direction matters too — a stale hash is a policy that
   has drifted from the pages, which is how the first direction breaks next.

   A NOTE ON HOW THIS WAS WRITTEN. The first version of this check read the
   policy with /script-src[^;"]*​/ against the whole file and reported that
   all 24 scripts would be blocked. The regex had matched a COMMENT higher up
   that mentions "script-src", so it was reading an empty hash list. The
   policy was correct all along. Anchor on the directive line, not on a word
   that also appears in prose. */

module.exports = async function check({ fs, path, crypto, DIST, cfg, fail, SHIP, SHIPPED }) {
  {
    const ht = fs.readFileSync(path.join(DIST, '.htaccess'), 'utf8');
    const csp = ht.split('\n').find((l) => l.includes('Header set Content-Security-Policy')) || '';
    const listed = new Set([...csp.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map((m) => m[1]));

    const used = new Set();
    for (const page of SHIPPED) {
      const file = path.join(DIST, page);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
        const hash = crypto.createHash('sha256').update(m[1], 'utf8').digest('base64');
        used.add(hash);
        if (!listed.has(hash)) {
          fail('HIGH', 'csp', `${page}: an inline script is not in the policy — it will be blocked in production (sha256-${hash.slice(0, 12)}…)`);
        }
      }
    }
    for (const h of listed) {
      if (!used.has(h)) fail('MED', 'csp', `the policy names sha256-${h.slice(0, 12)}… which no shipped page contains`);
    }
    if (!listed.size) fail('HIGH', 'csp', 'the policy carries no script hashes at all');

    /* Cheap assertions on the rest of the file, each for a rule whose failure
       is only ever visible in production. */
    const err = ht.match(/ErrorDocument\s+404\s+(\S+)/);
    if (!err) fail('MED', 'htaccess', 'no ErrorDocument 404');
    else if (!fs.existsSync(path.join(DIST, err[1].replace(/^\//, '')))) {
      fail('HIGH', 'htaccess', `ErrorDocument 404 points at ${err[1]}, which is not in the build`);
    }
    if (!/RewriteCond %\{REQUEST_FILENAME\}\.html -f/.test(ht)) {
      fail('HIGH', 'htaccess', 'the extensionless-URL rewrite is missing — every clean link in the markup 404s');
    }
    /* HSTS is a config switch and a one-year commitment; the file must agree
       with site.config.json in both directions. */
    const wantsHsts = cfg.hsts === true || cfg.hsts === 'all';
    const hasHsts = /Strict-Transport-Security/.test(ht);
    if (wantsHsts !== hasHsts) {
      fail('HIGH', 'htaccess', `site.config.json says hsts=${JSON.stringify(cfg.hsts)} but the file ${hasHsts ? 'sets' : 'omits'} it`);
    }
    /* THE FOUR-REGISTRATION TRAP. Adding a page needs it in `site.config.json`,
       in `SHIP`, in `build.js`'s list and in the footer. Miss `SHIP` and the
       page is built, indexed, listed in the sitemap and canonical-tagged — and
       simply not in the archive, so the URL the sitemap advertises returns 404
       on the server while looking perfect in `dist/`. Nothing caught that; the
       accessibility page needed all four by hand two days ago. */
    for (const p of cfg.pages.filter((x) => x.index !== false)) {
      if (!SHIP.includes(p.file)) {
        fail('HIGH', 'deploy', `${p.file} is indexed and in the sitemap but not in SHIP — the URL will 404 on the server`);
      }
    }
    for (const f of SHIPPED) {
      if (!fs.existsSync(path.join(DIST, f))) {
        fail('HIGH', 'deploy', `${f} is in SHIP but was not built — the archive will be missing a page`);
      }
    }

    /* ONE PUBLISHED EMAIL ADDRESS, AND IT IS THE DECLARED ONE.
       The address appears in `navigation-map.js` (the contact block and the
       form target) and again in the prose of Privacy, Terms and Accessibility
       in BOTH languages. Five places, no generator — because an address inside
       a bilingual sentence cannot be templated without turning the sentence
       into a template, which is worse.

       So the guard is a check rather than a build step: `site.config.json`
       declares the address, and no shipped page may publish a different one.
       The failure this prevents is specific and is coming — `docs/62` A10 has
       the Gmail being replaced by a domain address once deliverability is
       proven, and a partial swap would leave two live addresses on one site
       with nothing saying so. */
    const declared = cfg.contact && cfg.contact.email;
    if (!declared) {
      fail('MED', 'contact', 'site.config.json declares no contact.email, so nothing checks the address the site publishes');
    } else {
      const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
      for (const page of SHIPPED) {
        const file = path.join(DIST, page);
        if (!fs.existsSync(file)) continue;
        const found = new Set(fs.readFileSync(file, 'utf8').match(EMAIL) || []);
        for (const addr of found) {
          if (addr !== declared) {
            fail('HIGH', 'contact', `${page} publishes ${addr}, but site.config.json declares ${declared}`);
          }
        }
      }
    }

    const wantsAnalytics = !!(cfg.analytics && cfg.analytics.provider);
    if (wantsAnalytics && !csp.includes('plausible.io')) {
      fail('HIGH', 'csp', 'analytics is on but the policy does not allow its origin — the tag will be blocked');
    }
    if (!wantsAnalytics && csp.includes('plausible.io')) {
      fail('MED', 'csp', 'analytics is off but the policy still allows its origin');
    }
  }
};
