/**
 * CLIENT-IP — who is actually calling, when a proxy is in front.
 *
 * X-Forwarded-For IS AN ATTACKER-CONTROLLED HEADER unless you know exactly how
 * many trusted hops sit in front of you. A client can send
 * `X-Forwarded-For: 1.2.3.4` and, if the server believes the leftmost entry,
 * every request looks like it comes from somewhere new — which turns a per-IP
 * rate limit into decoration.
 *
 * So this takes a COUNT, not a boolean. With `hops = 0` the header is ignored
 * entirely and the socket address is the truth (the correct default: no proxy).
 * With `hops = n` the address is the n-th entry from the RIGHT, because each
 * trusted proxy appends the address it saw. Anything the client forged sits to
 * the left of that and is never read.
 */

const clean = (s) => {
  const v = String(s || '').trim();
  /* ::ffff:1.2.3.4 is an IPv4 address wearing a v6 hat. [::1]:1234 has a port. */
  const noBrackets = v.startsWith('[') ? v.slice(1, v.indexOf(']') === -1 ? undefined : v.indexOf(']')) : v;
  const stripped = noBrackets.startsWith('::ffff:') ? noBrackets.slice(7) : noBrackets;
  return stripped.split('%')[0];
};

export function clientIp(req, hops = 0) {
  const socket = clean(req.socket && req.socket.remoteAddress);
  if (!hops) return socket || 'unknown';

  const chain = String(req.headers['x-forwarded-for'] || '')
    .split(',').map(clean).filter(Boolean);
  if (!chain.length) return socket || 'unknown';

  /* hops = 1 -> the last entry, written by the proxy we trust. */
  const index = chain.length - hops;
  return (index >= 0 ? chain[index] : chain[0]) || socket || 'unknown';
}
