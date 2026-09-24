/* §41 The structured order ships, and ships empty ---------------------

   The builder writes two things now: a message for a person and a payload
   for a machine. The payload is the record — an order, a CRM row and a
   project are all meant to be created from it — and the message is the
   presentation of it.

   Two things have to be true of the SHIPPED page, before any script runs.
   The island has to be there, or the whole bridge is missing and only a
   browser test would ever notice. And it has to be EMPTY: nothing has been
   chosen yet, and a page that shipped a pre-filled order would be
   describing a scope nobody built. The rules the payload needs that are not
   on a row — the currency, the page allowance — have to be on the form
   rather than re-decided in the script, which is the whole point of moving
   them out of tools/build-catalogue.js and into services.json.
   ------------------------------------------------------------------------ */

module.exports = async function check({ fs, path, ROOT, DIST, pricing, fail, SHIP }) {
  {
    const page = 'pricing.html';
    const PUBLIC_CATALOGUE = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalogue/catalogue.public.json'), 'utf8'));
    if (SHIP.includes(page)) {
      const html = fs.readFileSync(path.join(DIST, page), 'utf8');
      const island = /<script type="application\/json" id="build-order"[^>]*>([\s\S]*?)<\/script>/.exec(html);
      if (!island) {
        fail('HIGH', 'order', `${page}: no build-order island — the builder has no machine-readable output`);
      } else if (island[1].trim() !== '{}') {
        fail('HIGH', 'order', `${page}: the build-order island ships with something in it (${island[1].slice(0, 60)}…) — nothing has been chosen yet`);
      }
      const form = /<form[^>]*data-build[^>]*>/.exec(html);
      if (!form) {
        fail('HIGH', 'order', `${page}: no builder form`);
      } else {
        if (!/data-currency="[A-Z]{3}"/.test(form[0])) {
          fail('HIGH', 'order', `${page}: the builder form does not carry the currency`);
        }
        const allow = /data-page-allowance='([^']*)'/.exec(form[0]);
        if (!allow) {
          fail('HIGH', 'order', `${page}: the builder form does not carry the page-allowance rule`);
        } else {
          let rule = null;
          try { rule = JSON.parse(allow[1]); } catch { rule = null; }
          if (!rule || !Array.isArray(rule.builtBy) || !rule.builtBy.length || !rule.beyondFirst) {
            fail('HIGH', 'order', `${page}: the page-allowance rule on the form is not usable (${allow[1].slice(0, 60)}…)`);
          }
          /* And it must be the rule the catalogue validated, not a second copy
             that happens to look like it. */
          const authored = (PUBLIC_CATALOGUE.services.find((x) => x.pageAllowance) || {}).pageAllowance;
          if (rule && authored && JSON.stringify(rule) !== JSON.stringify(authored)) {
            fail('HIGH', 'order', `${page}: the page-allowance rule on the page differs from the one in the catalogue`);
          }
        }
      }
      /* Every add-on row has to say which group it belongs to, or the payload
         cannot report an add-on as an add-on. */
      const addonRows = (html.match(/data-addon-group="/g) || []).length;
      const declared = PUBLIC_CATALOGUE.features.filter((f) => f.addonGroup).length;
      if (addonRows !== declared) {
        fail('MED', 'order', `${page}: ${addonRows} row(s) declare an add-on group and the catalogue publishes ${declared}`);
      }
    }
  }
};
