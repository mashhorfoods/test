/* §27 the challenge config and the page must agree --------------------
   Same drift as §26, but the stakes are higher: this component hands out a
   discount code, and a wrong answer key hands it to everyone. The answer
   lives in the JSON as a plain id and reaches the page only as a salted
   digest, so a mismatch here is invisible by design — nothing on screen
   would look wrong while every visitor loses, or every visitor wins.

   Checks: the shipped digest is the digest of the configured answer; the
   configured answer is one of the configured options; every option and
   every reward tier ships in both languages; tiers carry a code and a
   positive weight; and the rendered options are exactly the configured
   ones, in neither direction more nor fewer. */

module.exports = async function check({ fs, path, crypto, ROOT, DIST, fail, SHIPPED }) {
  {
    const file = path.join(ROOT, 'src/data/challenge.json');
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const C = data.challenge || {};
      const Q = data.question || {};
      const R = data.reward || {};
      const opts = Q.options || [];
      const tiers = R.tiers || [];
      const page = SHIPPED.map((f) => fs.readFileSync(path.join(DIST, f), 'utf8')).join('\n');
      /* Same salt as tools/build-challenge.js. If that ever changes, this
         check fails loudly rather than passing on a stale key. */
      const digest = (id) =>
        crypto.createHash('sha256').update(`${C.id}:${id}`).digest('base64').slice(0, 16);

      const shippedAnswer = (page.match(/data-challenge-answer="([^"]+)"/) || [])[1];
      if (!shippedAnswer) {
        fail('HIGH', 'challenge', 'no shipped page carries data-challenge-answer — run node tools/build-challenge.js');
      } else if (shippedAnswer !== digest(Q.correct)) {
        fail('HIGH', 'challenge', `the shipped answer key is not the digest of challenge.json's "${Q.correct}" — rebuild, or every visitor is graded against the wrong answer`);
      }

      if (!opts.some((o) => o.id === Q.correct)) {
        fail('HIGH', 'challenge', `challenge.json marks "${Q.correct}" correct, but no option has that id — nobody can ever win`);
      }

      /* The option ids never reach the markup — only their digests do, in each
         radio's value. So compare digests, which is also what the runtime
         compares. Matching a bare `data-challenge-option` would match a
         valueless attribute and assert nothing. */
      const rendered = new Set(
        [...page.matchAll(/value="([^"]+)" data-challenge-option/g)].map((m) => m[1])
      );
      const byDigest = new Map(opts.map((o) => [digest(o.id), o.id]));
      for (const o of opts) {
        if (!rendered.has(digest(o.id))) {
          fail('HIGH', 'challenge', `challenge.json defines option "${o.id}" and no shipped page renders it — run node tools/build-challenge.js`);
        }
        const v = o.label || {};
        if (!v.en || !v.ar) {
          fail('HIGH', 'challenge', `option "${o.id}" is missing label.${v.en ? 'ar' : 'en'} — every visible string on this site exists in both languages`);
        }
      }
      for (const d of rendered) {
        if (!byDigest.has(d)) {
          fail('HIGH', 'challenge', `a shipped page renders an option challenge.json no longer defines (digest ${d}) — the page is stale`);
        }
      }

      for (const field of ['scenario', 'ask', 'explanation']) {
        const v = Q[field] || {};
        if (!v.en || !v.ar) {
          fail('HIGH', 'challenge', `question.${field} is missing ${v.en ? 'ar' : 'en'} — every visible string on this site exists in both languages`);
        }
      }

      if (!tiers.length) fail('HIGH', 'challenge', 'reward.tiers is empty, but the challenge ships — a winner would be promised nothing');
      for (const t of tiers) {
        if (!t.code) fail('HIGH', 'challenge', `reward tier "${t.id}" has no code — there is nothing for a winner to quote`);
        if (!(Number(t.percent) > 0)) fail('HIGH', 'challenge', `reward tier "${t.id}" has no positive percent — a winner is told they saved nothing`);
        if (!(Number(t.weight) > 0)) fail('MED', 'challenge', `reward tier "${t.id}" has no positive weight, so it can never be drawn — remove it or give it one`);
      }
      /* The headline promises a ceiling. If a tier ever exceeds it, the page
         is advertising less than it hands out — or, worse, the reverse. */
      const top = Math.max(...tiers.map((t) => Number(t.percent) || 0));
      const claimed = Number((String(R.headline && R.headline.en).match(/(\d+)\s*%/) || [])[1]);
      if (claimed && top !== claimed) {
        fail('HIGH', 'challenge', `the headline promises "up to ${claimed}%" but the best tier is ${top}% — the promise and the pool disagree`);
      }

      if (!(Number(C.maxAttempts) > 0)) {
        fail('HIGH', 'challenge', 'challenge.maxAttempts is not a positive number — a visitor gets no tries, or unlimited ones');
      }
      if (!C.storageKey) {
        fail('MED', 'challenge', 'challenge.storageKey is unset — a visitor’s result cannot survive a refresh');
      }
    }
  }
};
