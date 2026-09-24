/* §22 an in-page link that goes nowhere ------------------------------
   WHAT NOTHING WAS WATCHING. Tested before writing this: renaming one
   href="#marketing" to href="#marketing-typo" in a shipped page passed
   validate.js AND qa.js clean.

   AND IT IS WORSE THAN SILENT. navigation.js `resolveCrossPageAnchors()`
   takes any bare fragment whose id is not on the current page and rewrites
   it to `./#id`, on the reasonable assumption that it means a homepage
   section — that is how the footer's "#marketing" works from /pricing. The
   side effect is that a TYPO is laundered into a plausible cross-page link:
   the visitor taps "Marketing & Ads" in the service index and is navigated
   away to the homepage, which is worse than nothing happening.

   So this reads the MARKUP, not the live DOM — the first version read the
   DOM and missed exactly this, because by then the broken link no longer
   started with "#". Same blind spot as §19 had, same cause: our own script
   repairs the evidence before the check arrives.

   A fragment is sound if its id exists on the page, OR on the homepage,
   which is where navigation.js will send it. Anything else is dead both
   ways. */

module.exports = async function check({ fs, path, DIST, fail, SHIPPED }) {
  {
    const idsIn = (html) => new Set([
      ...[...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]),
      ...[...html.matchAll(/\sname="([^"]+)"/g)].map((m) => m[1]),
    ]);
    const homeIds = idsIn(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'));

    for (const page of SHIPPED) {
      const html = fs.readFileSync(path.join(DIST, page), 'utf8');
      const own = idsIn(html);
      const frags = [...html.matchAll(/<a\b[^>]*\shref="#([^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
      for (const id of new Set(frags)) {
        if (own.has(id) || homeIds.has(id)) continue;
        fail('HIGH', 'anchors', `${page} links to #${id}, which exists neither on the page nor on the homepage — navigation.js will rewrite it to ./#${id} and send the visitor away for nothing`);
      }
    }
  }
};
