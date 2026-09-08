/* =============================================================================
   ADMIN-TEST — the acceptance test for the dashboard's data layer.

   `docs/120` §6.1 names the failure that would sink this: the browser's
   validation drifting from what CI enforces. The defence is that there is one
   implementation — `src/scripts/admin-validate.js` — and this file imports
   THAT ONE, not a copy of its rules.

   Three things are checked, and the third is the one that matters:

     1. every editable file round-trips byte-identically, so a dashboard write
        changes only what the operator changed;
     2. the data that ships today passes every rule — a validator that fails
        the real data is a validator nobody will trust;
     3. EVERY RULE FAILS WHEN ITS DEFECT IS REINTRODUCED. A rule that cannot
        fail is a comment. This project has shipped at least twelve of those
        and each cost more to find than to prevent.

   Run: node tools/admin-test.js   ·   npm run admin:test
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILES, SERIALISE, validate } from '../src/scripts/admin-validate.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const clone = (o) => JSON.parse(JSON.stringify(o));

let failures = 0;
const ok = (name) => console.log(`  ✓ ${name}`);
const no = (name, detail) => { failures += 1; console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`); };

/* --- 1. round-trip -------------------------------------------------------- */
console.log('\n  round-trip — a write changes only what was changed');
for (const f of FILES) {
  const raw = read(f.path);
  const back = SERIALISE(JSON.parse(raw));
  if (back === raw) ok(`${f.path} is byte-identical after parse and write`);
  else no(`${f.path} is NOT byte-identical`, `${raw.length} bytes in, ${back.length} out — the dashboard would rewrite formatting the operator did not touch`);
}

/* --- 2. the real data passes ---------------------------------------------- */
console.log('\n  the shipped data passes every rule');
const data = {};
for (const f of FILES) {
  data[f.path] = JSON.parse(read(f.path));
  const found = validate(f.path, data[f.path]);
  if (!found.length) ok(`${f.path} — 0 findings`);
  else no(`${f.path} — ${found.length} finding(s)`, found.slice(0, 4).map((x) => `${x.path}: ${x.message}`).join('\n      '));
}

/* --- 3. every rule fails when its defect is reintroduced ------------------- */
console.log('\n  negative tests — each rule, broken on purpose');

const P = 'src/data/pricing.json';
const I = 'src/data/i18n-ar.json';

/** Apply a mutation to a clone, expect at least one finding mentioning `want`. */
function expectFail(name, file, mutate, want) {
  const copy = clone(data[file]);
  mutate(copy);
  const found = validate(file, copy);
  const hit = found.some((f) => f.message.toLowerCase().includes(want.toLowerCase()));
  if (hit) ok(`${name} — caught`);
  else no(`${name} — NOT caught`, found.length ? `got instead: ${found[0].message}` : 'no findings at all');
}

const firstPkg = (d) => d.categories[0].packages[0];

/* THE CONTRACT INVERTED ON 8 SEPTEMBER, and these four moved with it.
   A price used to be a STRING of digits, and the fourth test below asserted
   that a number was a mistake. The hardening pass made it a number: formatting
   is the generator's job and a business value that has to be coerced before it
   can be compared is not a value, it is a label. So the same four mistakes are
   still caught — a symbol, a comma, a leading zero, and now the string itself —
   and the one that used to be an error is now the only correct form. */
expectFail('a price with a currency symbol', P, (d) => { firstPkg(d).price = '$490'; }, 'must be a number');
expectFail('a price as text, not a number', P, (d) => { firstPkg(d).price = '490'; }, 'must be a number');
expectFail('a price with a comma', P, (d) => { firstPkg(d).price = '1,990'; }, 'must be a number');
expectFail('a price starting with zero', P, (d) => { firstPkg(d).price = '0490'; }, 'must be a number');
expectFail('a price of zero', P, (d) => { firstPkg(d).price = 0; }, 'whole number above zero');
expectFail('a price with a fraction', P, (d) => { firstPkg(d).price = 490.5; }, 'whole number above zero');
expectFail('an empty package name', P, (d) => { firstPkg(d).name = ''; }, 'has no name');
expectFail('two packages with the same name', P, (d) => { d.categories[0].packages[1].name = d.categories[0].packages[0].name; }, 'used twice');
expectFail('a level in English with no Arabic', P, (d) => { firstPkg(d).levelAr = ''; }, 'and no Arabic one');
expectFail('a level in Arabic with no English', P, (d) => { firstPkg(d).level = ''; }, 'and no English one');
expectFail('a purpose in English with no Arabic', P, (d) => { firstPkg(d).purposeAr = ''; }, 'and no Arabic one');
expectFail('an Arabic level that is English', P, (d) => { firstPkg(d).levelAr = 'Foundation'; }, 'contains no Arabic');
/* The counter-case: Social genuinely has neither, and that must stay legal. */
{
  const copy = clone(data[P]);
  const social = copy.categories.find((c) => c.id === 'social');
  const found = validate(P, copy).filter((f) => /level|purpose/.test(f.path));
  if (social && !found.length) ok('a package with neither level nor purpose is allowed — Social ships that way');
  else no('a package with neither level nor purpose', found.map((f) => f.message).join('; ') || 'no social category found');
}
expectFail('an Arabic label with no Arabic', P, (d) => { d.categories[0].labelAr = 'Branding'; }, 'no Arabic in it');
expectFail('a feature with no Arabic', P, (d) => { firstPkg(d).features[0].ar = ''; }, 'no Arabic text');
expectFail('a feature half-translated — Arabic box holds different English', P, (d) => { firstPkg(d).features[0].ar = 'Logo design work'; }, 'not the English either');
/* The counter-case that failed the first rule: a proper-noun feature. */
{
  const copy = clone(data[P]);
  copy.categories[0].packages[0].features[0] = { carry: false, en: 'Google Ads', ar: 'Google Ads' };
  const found = validate(P, copy).filter((f) => f.path.includes('features[0]'));
  if (!found.length) ok('a feature identical in both languages is allowed — "Facebook + Instagram" ships that way');
  else no('a proper-noun feature', found[0].message);
}
expectFail('no features at all', P, (d) => { firstPkg(d).features = []; }, 'lists no features');
expectFail('a missing delivery promise', P, (d) => { delete firstPkg(d).facts.delivery; }, 'does not say its delivery');
expectFail('an empty revisions promise', P, (d) => { firstPkg(d).facts.revisions.en = ''; }, 'revisions has no English');
expectFail('Eastern-Arabic numerals in delivery', P, (d) => { firstPkg(d).facts.delivery.ar = '٥–٧ أيام عمل'; }, 'Eastern-Arabic numerals');
expectFail('a category with no packages', P, (d) => { d.categories[0].packages = []; }, 'has no packages');
expectFail('not pricing.json at all', P, (d) => { delete d.categories; }, 'not pricing.json');

expectFail('an empty Arabic string', I, (d) => { const k = Object.keys(d).find((x) => !x.startsWith('_')); d[k] = ''; }, 'empty Arabic string');
expectFail('an Arabic value that is different English', I, (d) => { const k = Object.keys(d).find((x) => !x.startsWith('_')); d[k] = 'this is not translated at all'; }, 'not the English either');

console.log(`\nadmin-test: ${failures === 0 ? 'all checks passed' : `${failures} FAILED`}\n`);
process.exit(failures ? 1 : 0);
