/**
 * ADMIN-VALIDATE — the data rules, in one place.
 *
 * WHY THIS FILE IS SEPARATE FROM EVERYTHING THAT USES IT.
 * `docs/120` §6.1 names the one thing that would sink the dashboard: browser
 * validation drifting from what CI enforces. A rule checked in the form and
 * not in the build is a false green; a rule checked in the build and not in
 * the form is the broken commit the dashboard exists to prevent.
 *
 * So there is ONE implementation. `admin.html` imports it to decide whether
 * the Commit button is enabled, and `tools/admin-test.js` imports the same
 * file to check it against the shipped data and against deliberately broken
 * copies. Neither can be right while the other is wrong.
 *
 * It is a plain ES module with no DOM and no Node API, so both can load it.
 */

/** Every editable file must survive parse -> stringify unchanged. */
export const SERIALISE = (data) => `${JSON.stringify(data, null, 2)}\n`;

const isStr = (v) => typeof v === 'string';
const filled = (v) => isStr(v) && v.trim().length > 0;
const ARABIC = /[؀-ۿݐ-ݿ]/;

/**
 * Rules over pricing.json. Each returns a list of {path, message}.
 * Written against the shape that ships, not an idealised one.
 */
function pricingRules(data) {
  const out = [];
  const bad = (path, message) => out.push({ path, message });

  if (!Array.isArray(data?.categories)) {
    bad('categories', 'the file has no categories array — this is not pricing.json');
    return out;
  }

  const names = new Map();

  data.categories.forEach((c, ci) => {
    const cp = `categories[${ci}]`;
    if (!filled(c.label)) bad(`${cp}.label`, 'a category has no English label');
    if (!filled(c.labelAr)) bad(`${cp}.labelAr`, `"${c.label || c.id}" has no Arabic label`);
    else if (!ARABIC.test(c.labelAr)) bad(`${cp}.labelAr`, `"${c.label}" has an Arabic label with no Arabic in it`);

    if (!Array.isArray(c.packages) || !c.packages.length) {
      bad(`${cp}.packages`, `"${c.label || c.id}" has no packages`);
      return;
    }

    c.packages.forEach((k, pi) => {
      const pp = `${cp}.packages[${pi}]`;
      const who = k.name || `${c.label} package ${pi + 1}`;

      /* A price is the thing most likely to be edited and most expensive to
         get wrong. It is a NUMBER in this file. It used to be a string of
         digits, on the argument that a rendered value should be stored the
         way it renders — but that put a business value and its formatting in
         the same field, and every consumer that wanted to compare or add two
         prices had to coerce first. Formatting is the generator's job; this
         file holds the amount. The currency is declared once, at the top of
         the document, and is not repeated on every package. */
      if (typeof k.price !== 'number' || !Number.isFinite(k.price)) {
        bad(`${pp}.price`, `"${who}" — the price must be a number, with no currency symbol, comma or quotes (got ${JSON.stringify(k.price)})`);
      } else if (!Number.isInteger(k.price) || k.price <= 0 || k.price > 999999) {
        bad(`${pp}.price`, `"${who}" — the price must be a whole number above zero (got ${k.price})`);
      }

      if (!filled(k.name)) bad(`${pp}.name`, `a package in "${c.label}" has no name`);

      /* LEVEL AND PURPOSE ARE OPTIONAL, AND PAIRED. The first version of this
         rule required both and failed the real data in thirteen places: the
         Social category's three packages carry neither, and the generator
         omits the element entirely rather than rendering an empty one, so the
         page is correct. Requiring a field the product does not use is how a
         validator gets ignored.

         What IS always wrong is having one language and not the other — the
         page would then show a level in English and nothing in Arabic. So the
         rule is pairing, not presence, which is the invariant that was
         actually true all along. */
      for (const [en, ar, what] of [['level', 'levelAr', 'level'], ['purpose', 'purposeAr', 'purpose line']]) {
        const hasEn = filled(k[en]);
        const hasAr = filled(k[ar]);
        if (hasEn && !hasAr) bad(`${pp}.${ar}`, `"${who}" has an English ${what} and no Arabic one`);
        if (hasAr && !hasEn) bad(`${pp}.${en}`, `"${who}" has an Arabic ${what} and no English one`);
        if (hasAr && !ARABIC.test(k[ar])) bad(`${pp}.${ar}`, `"${who}" — the Arabic ${what} contains no Arabic`);
      }

      /* The site renders one price per package and qa.js §1 compares the
         rendered figure back to this file, so a duplicate name makes that
         comparison ambiguous — it matches by name. */
      if (filled(k.name)) {
        if (names.has(k.name)) bad(`${pp}.name`, `"${k.name}" is used twice (also in ${names.get(k.name)}) — the build matches rendered cards to this file by name`);
        else names.set(k.name, c.label);
      }

      if (!Array.isArray(k.features) || !k.features.length) {
        bad(`${pp}.features`, `"${who}" lists no features`);
      } else {
        k.features.forEach((f, fi) => {
          if (!filled(f.en)) bad(`${pp}.features[${fi}].en`, `"${who}" — feature ${fi + 1} has no English text`);
          if (!filled(f.ar)) bad(`${pp}.features[${fi}].ar`, `"${who}" — feature ${fi + 1} has no Arabic text`);
          /* NO ARABIC IS FINE ONLY WHEN THE TWO SIDES ARE IDENTICAL. That is
             the signature of a proper noun — "Facebook + Instagram" is the
             same in both languages and shipping it twice is correct. The
             first version of this rule flagged it, which is a validator
             failing real data.

             A string with no Arabic that DIFFERS from the English is the real
             defect: somebody edited one side and left the other, or typed a
             translation in the wrong box. */
          else if (!ARABIC.test(f.ar) && f.ar.trim() !== String(f.en).trim()) {
            bad(`${pp}.features[${fi}].ar`, `"${who}" — feature ${fi + 1}'s Arabic contains no Arabic and is not the English either: "${f.ar.slice(0, 40)}"`);
          }
        });
      }

      /* Delivery and revisions are promises to a paying client and they are
         in the Terms by reference, so an empty one is a contract gap. */
      for (const key of ['delivery', 'revisions']) {
        const fact = k.facts?.[key];
        if (!fact) { bad(`${pp}.facts.${key}`, `"${who}" does not say its ${key}`); continue; }
        if (!filled(fact.en)) bad(`${pp}.facts.${key}.en`, `"${who}" — ${key} has no English text`);
        if (!filled(fact.ar)) bad(`${pp}.facts.${key}.ar`, `"${who}" — ${key} has no Arabic text`);
      }

      /* One numeral system, site-wide — docs/47 §2 and docs/49 §7 settled it,
         and qa.js enforces it on the rendered page. Catching it here means
         the operator is told before the commit rather than after. */
      const eastern = /[٠-٩]/;
      for (const [where, value] of [['delivery', k.facts?.delivery?.ar], ['revisions', k.facts?.revisions?.ar]]) {
        if (isStr(value) && eastern.test(value)) {
          bad(`${pp}.facts.${where}.ar`, `"${who}" — ${where} uses Eastern-Arabic numerals (٠-٩). This site uses 0-9 everywhere, in both languages`);
        }
      }
    });
  });

  return out;
}

/** Rules over i18n-ar.json: a flat map of English string -> Arabic string. */
function i18nRules(data) {
  const out = [];
  const bad = (path, message) => out.push({ path, message });
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    bad('', 'this is not the Arabic string map');
    return out;
  }
  for (const [en, ar] of Object.entries(data)) {
    if (en.startsWith('_')) continue; // comment keys
    if (!isStr(ar)) { bad(en, `"${en.slice(0, 40)}" has no Arabic string`); continue; }
    if (!ar.trim()) bad(en, `"${en.slice(0, 40)}" has an empty Arabic string`);
    /* Same rule as the features above, and for the same reason: this map is
       keyed by the English string, so `ar === en` is a proper noun kept
       untranslated on purpose. Anything else without Arabic is a mistake. */
    else if (!ARABIC.test(ar) && ar.trim() !== en.trim()) {
      bad(en, `"${en.slice(0, 40)}" — the Arabic side has no Arabic in it and is not the English either: "${ar.slice(0, 40)}"`);
    }
  }
  return out;
}

/** The files this dashboard is allowed to touch, and how each is checked. */
export const FILES = [
  {
    path: 'src/data/pricing.json',
    label: { en: 'Prices and packages', ar: 'الأسعار والباقات' },
    rules: pricingRules,
  },
  {
    path: 'src/data/i18n-ar.json',
    label: { en: 'Arabic strings', ar: 'النصوص العربية' },
    rules: i18nRules,
  },
];

/** Validate one file's parsed data. Returns [] when it is safe to commit. */
export function validate(filePath, data) {
  const f = FILES.find((x) => x.path === filePath);
  if (!f) return [{ path: filePath, message: 'this dashboard does not edit that file' }];
  return f.rules(data);
}
