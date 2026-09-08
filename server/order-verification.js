/**
 * ORDER-VERIFICATION — the untrusted boundary in front of createOrder.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT IN THE DOMAIN.
 * Phase 2's `validateOrder` checks that an order is INTERNALLY honest: its
 * lines add up to its totals, its references resolve, its quantities are within
 * the published bounds. That is the right check for a domain, and it was
 * enough while the only caller was an operator's own command line.
 *
 * It is not enough for an HTTP endpoint. A payload whose line says 1 USD and
 * whose total says 1 USD is internally consistent and completely wrong, and the
 * domain would accept it because nothing in it disagrees. §15 is explicit: the
 * server never trusts a client-provided price. So the amounts are recomputed
 * here from the catalogue and the payload is refused if it disagrees.
 *
 * It sits at the boundary rather than in the domain deliberately. The order
 * SNAPSHOT must stay the numbers that were quoted — that is Phase 2's whole
 * point, and re-pricing inside the domain would make a historical order a
 * function of today's catalogue. What happens here is different: an arriving
 * claim is checked against the catalogue ONCE, before it becomes a snapshot.
 * After that the snapshot is frozen and nothing recomputes it again.
 */

import { fail } from './errors.js';

export function verifyPayloadPrices(payload, catalogue) {
  const problems = [];
  const bad = (path, message) => problems.push({ path, message });

  if (!payload || !Array.isArray(payload.services)) {
    throw fail('VALIDATION_ERROR', 'that is not a builder payload');
  }

  let expectedOnce = 0;
  let expectedMonthly = 0;

  for (const svc of payload.services) {
    for (const line of svc.features || []) {
      const at = `${svc.serviceId}/${line.featureId}`;
      const feature = catalogue.feature(line.featureId);
      if (!feature) { bad(at, 'is not a feature in this catalogue'); continue; }

      const pricing = feature.pricing;
      const isPart = Boolean(line.partOf);
      const qty = Number.isInteger(line.quantity) ? line.quantity : 1;

      /* The tier factor is the catalogue's, not the payload's. A request that
         names a cheap tier and a deep one's price is refused by this. */
      let factor = 1;
      if (line.tier) {
        const level = ((feature.tiers || {}).levels || []).find((l) => l.id === line.tier);
        if (!level) { bad(`${at}.tier`, `"${line.tier}" is not a level of this feature`); continue; }
        factor = level.priceFactor || 1;
      }

      const free = isPart || pricing.type === 'included' || pricing.type === 'quote';
      const unit = free ? 0 : Math.round(pricing.from * factor);
      const amount = free ? 0 : unit * (pricing.type === 'unit' ? qty : 1);
      const billing = pricing.period === 'monthly' ? 'monthly' : 'once';

      const claimed = line.pricing || {};
      if (claimed.unitAmount !== undefined && claimed.unitAmount !== unit) {
        bad(`${at}.pricing.unitAmount`, `says ${claimed.unitAmount} and the catalogue prices it at ${unit}`);
      }
      if (claimed.amount !== amount) {
        bad(`${at}.pricing.amount`, `says ${claimed.amount} and the catalogue prices it at ${amount}`);
      }
      if (claimed.billing !== undefined && claimed.billing !== billing) {
        bad(`${at}.pricing.billing`, `says ${claimed.billing} and the catalogue bills it ${billing}`);
      }
      if (billing === 'monthly') expectedMonthly += amount; else expectedOnce += amount;
    }
  }

  const total = (payload.pricing || {}).total || {};
  if (total.oneTime !== expectedOnce) bad('pricing.total.oneTime', `says ${total.oneTime} and the catalogue totals ${expectedOnce}`);
  if (total.monthly !== expectedMonthly) bad('pricing.total.monthly', `says ${total.monthly} and the catalogue totals ${expectedMonthly}`);

  const currency = payload.currency || catalogue.currency;
  if (currency !== catalogue.currency) bad('currency', `is ${currency} and this catalogue prices in ${catalogue.currency}`);

  return problems;
}
