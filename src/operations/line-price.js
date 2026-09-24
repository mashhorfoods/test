/**
 * LINE-PRICE — what one line of a scope costs. The only copy of the rule.
 *
 * The browser builder prices a scope as the visitor builds it, and the server
 * re-prices the payload before it becomes an order snapshot, because a payload
 * is only a claim. Those were two implementations, and they had drifted in
 * two ways:
 *
 *   ROUNDING. The builder rounded the total — round(price × factor × qty) —
 *   and the server rounded the unit, then multiplied. Identical for every
 *   feature today (the four tiered ones are fixed-price with whole results),
 *   and bound to disagree the first time a per-unit feature gained a tier.
 *   The unit is rounded here, so `amount === unitAmount × quantity` always
 *   holds, which is what an order snapshot needs to be re-checkable.
 *
 *   COMPOSITE PARTS. A part of a composite (design, build and deploy inside
 *   the complete landing page) is paid for by the composite. The builder
 *   recorded the part's own unit price with an amount of 0; the server
 *   demanded a unit price of 0 too, and so refused every payload containing
 *   the complete landing page. The part keeps its unit price here — it says
 *   what the part is worth — and its amount is 0.
 *
 * Pure, dependency-free and importable from both the browser (bundled by
 * build.js) and Node.
 */
export function linePrice({ type, from = 0, factor = 1, quantity = 1, isPart = false }) {
  const unpriced = type === 'included' || type === 'quote';
  const unitAmount = unpriced ? 0 : Math.round(from * factor);
  /* Only a per-unit price is multiplied. The builder shows a quantity control
     only on those, and the server must not multiply what the builder did not. */
  const counted = type === 'unit' ? quantity : 1;
  const amount = unpriced || isPart ? 0 : unitAmount * counted;
  return { unitAmount, amount };
}
