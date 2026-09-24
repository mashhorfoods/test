/* §37 The builder cannot offer a scope nobody could execute ----------

   The package builder lets a visitor assemble their own scope out of
   sixty-eight features. The brief that commissioned it is explicit that it
   "must not allow logically impossible scopes" — a website deployed but
   never built, a retargeting campaign with no conversion tracking behind
   it, a campaign optimised before it was set up.

   The rules that prevent that live in `data-requires`, `data-supersedes`
   and `data-conflicts` on each row, written there by
   tools/build-builder.js from the catalogue. `tools/build-catalogue.js`
   already refuses to build a catalogue whose references do not resolve —
   so this is NOT a second copy of that check. It asks a different question:
   did the rules SURVIVE THE JOURNEY onto the page? A reference that resolves
   in the source and points at a row this page does not carry is a rule that
   silently does nothing, which is the failure mode this project has now hit
   eighteen times.

   It reads the built page, not the source, for exactly that reason. */

module.exports = async function check({ PAGES, fail, BASE, browser }) {
  {
    const KINDS = new Set(['included', 'fixed', 'unit', 'project', 'quote']);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();

    for (const page of PAGES) {
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      const rows = await p.evaluate(() => [...document.querySelectorAll('.c-pick[data-feature]')].map((li) => ({
        id: li.dataset.feature,
        service: li.dataset.service || '',
        kind: li.dataset.priceType || '',
        price: li.dataset.price || '',
        requires: (li.getAttribute('data-requires') || '').split(/\s+/).filter(Boolean),
        supersedes: (li.getAttribute('data-supersedes') || '').split(/\s+/).filter(Boolean),
        conflicts: (li.getAttribute('data-conflicts') || '').split(/\s+/).filter(Boolean),
        qty: (() => {
          const q = li.querySelector('[data-qty]');
          return q ? { value: Number(q.value), min: Number(q.min), max: Number(q.max) } : null;
        })(),
        /* A quantity can come from a stepper OR from a set of choices — the
           platform rows are priced per platform and count the platforms
           chosen. Two controls for one number would be two ways to disagree. */
        optionsDriveQty: li.hasAttribute('data-options-drive-qty'),
        options: li.querySelectorAll('[data-option]').length,
        tiers: (li.getAttribute('data-tiers') || '').split(/\s+/).filter(Boolean).length,
        tierInputs: li.querySelectorAll('[data-tier]').length,
        digits: /\d/.test((li.querySelector('.c-pick__price') || {}).textContent || ''),
      })));
      if (!rows.length) continue;

      const present = new Set(rows.map((r) => r.id));
      for (const r of rows) {
        for (const [rel, list] of [['requires', r.requires], ['supersedes', r.supersedes], ['conflicts', r.conflicts]]) {
          for (const ref of list) {
            if (!present.has(ref)) {
              fail('HIGH', 'builder', `${page}: ${r.id} ${rel} ${ref}, which is not on this page — the rule does nothing`);
            }
            if (ref === r.id) fail('HIGH', 'builder', `${page}: ${r.id} ${rel} itself`);
          }
        }
        if (!KINDS.has(r.kind)) {
          fail('HIGH', 'builder', `${page}: ${r.id} has price kind "${r.kind}", which the builder cannot total`);
        }
        /* THE BRIEF'S OWN RULE: where a price cannot reasonably be
           calculated, show a custom quote rather than invent a figure. */
        if (r.kind === 'quote' && (r.price || r.digits)) {
          fail('HIGH', 'builder', `${page}: ${r.id} is quote-only and still prints a figure`);
        }
        if (r.kind === 'unit') {
          if (r.optionsDriveQty) {
            if (r.qty) fail('HIGH', 'builder', `${page}: ${r.id} counts its options AND carries a stepper — two controls for one number`);
            if (!r.options) fail('HIGH', 'builder', `${page}: ${r.id} says its options are the quantity and offers none`);
          } else if (!r.qty) {
            fail('HIGH', 'builder', `${page}: ${r.id} is priced per unit with no quantity control`);
          } else if (!(r.qty.min <= r.qty.value && r.qty.value <= r.qty.max)) {
            fail('HIGH', 'builder', `${page}: ${r.id} opens at ${r.qty.value}, outside its own ${r.qty.min}–${r.qty.max}`);
          }
        }
        /* A row that declares depths must offer them, and offer all of them —
           a level present in the data and absent from the page is a level
           nobody can buy. */
        if (r.tiers && r.tiers !== r.tierInputs) {
          fail('HIGH', 'builder', `${page}: ${r.id} declares ${r.tiers} depth(s) and renders ${r.tierInputs}`);
        }
        if (!r.service) fail('HIGH', 'builder', `${page}: ${r.id} belongs to no service`);
      }
    }
    await ctx.close();
  }
};
