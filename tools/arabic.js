/* =============================================================================
   ARABIC — a mechanical audit of the bilingual layer.

   WHAT THIS IS NOT. It is not a review. Whether the Arabic sounds right is a
   question for a native speaker and `docs/91` is the brief that asks it. No
   amount of parsing answers it.

   WHAT IT IS. Everything about the Arabic that can be checked WITHOUT being a
   native speaker — and the list is longer than it looks, because most of what
   goes wrong in a bilingual site is structural rather than linguistic:

     · a string that has no sibling in the other language
     · a string that is identical in both, i.e. never translated
     · an Arabic string carrying Latin text that is not a brand name
     · an English string carrying Arabic
     · Arabic prose without `lang="ar"`, which sends a screen reader into it
       with an English voice
     · NUMBERS THAT DISAGREE between the two languages

   That last one is why this file exists. On 7 September the homepage said
   "Ten pieces" in English and "عشرة أعمال" in Arabic above SEVEN photographs
   (`docs/119` §2.1). Both languages were internally consistent and both were
   wrong, so no parity check caught it — but a check comparing the FIGURES in
   each language against each other would have caught the day the two drifted
   apart, which is the commoner failure: one language gets updated and the
   other does not.

   Run: node tools/arabic.js   ·   npm run arabic
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const findings = [];
const fail = (sev, area, msg) => findings.push({ sev, area, msg });

const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/* Numeric entities are DECODED, not blanked. `&#39;` blanked leaves nothing;
   `&#39;` left alone is read by the figure check as the number 39, which is
   how "Founder&#39;s portfolio" was reported as disagreeing with its Arabic
   about a number neither of them mentions. */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…' };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? ' ');
const strip = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/* Digits, in both Western and Eastern-Arabic forms.

   ONLY FIGURES OF TWO DIGITS OR MORE ARE COMPARED, and that is a real limit
   rather than laziness: Arabic idiomatically SPELLS small numbers — "3
   add-ons" is "ثلاث إضافات", with no digit in it at all — so demanding digit
   parity on single figures reports correct Arabic as broken. Fourteen of the
   first run's twenty "number" findings were exactly that.

   What survives the limit is what matters: prices (490, 990, 1990),
   percentages (70), day counts (18, 30). Those are written as digits in both
   languages, and those are the ones that cost money when they drift.

   Counts written as WORDS in both languages — "Ten pieces" over seven
   photographs — are not this check's job and never were. `qa.js` §31 compares
   a stated count against the markup, which is the only thing that could have
   caught it. */
function figures(text) {
  const western = [...text.matchAll(/\d[\d,.]*/g)].map((m) => m[0].replace(/[,.]$/, ''));
  const eastern = [...text.matchAll(/[٠-٩][٠-٩,.]*/g)]
    .map((m) => m[0].replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)));
  return [...western, ...eastern].map((n) => n.replace(/[^\d]/g, '')).filter((n) => n.length >= 2);
}

function pagesToCheck() {
  if (!fs.existsSync(DIST)) return [];
  return fs.readdirSync(DIST).filter((f) => f.endsWith('.html'));
}

for (const page of pagesToCheck()) {
  const html = fs.readFileSync(path.join(DIST, page), 'utf8');

  /* --- 1. pairing ------------------------------------------------------
     Every English span must be followed by an Arabic one. qa.js §5 counts
     them per page; this checks they are actually PAIRED, which a count
     cannot see — two extra English and two extra Arabic balance. */
  const spans = [...html.matchAll(/<span[^>]*data-lang-copy="(en|ar)"([^>]*)>([\s\S]*?)<\/span>/g)]
    .map((m) => ({ lang: m[1], attrs: m[2], text: strip(m[3]), raw: m[0] }));

  for (let i = 0; i < spans.length; i += 1) {
    const s = spans[i];
    if (s.lang !== 'en') continue;
    const next = spans[i + 1];
    if (!next || next.lang !== 'ar') {
      fail('HIGH', 'pairing', `${page}: an English string has no Arabic sibling after it — "${s.text.slice(0, 60)}"`);
      continue;
    }

    /* --- 2. never translated ------------------------------------------ */
    /* Identical on both sides is normal for a product name — "Google Ads",
       "Reels", "TikTok Ads" are the same word in Arabic and the first run
       reported nineteen of them. It is only a finding when the identical
       string is long enough to be a SENTENCE, which no brand name is. */
    if (s.text && next.text && s.text === next.text && !ARABIC.test(s.text)
        && s.text.split(/\s+/).length > 4) {
      fail('MED', 'untranslated', `${page}: both languages carry the identical sentence "${s.text.slice(0, 60)}" — it was never translated`);
    }

    /* --- 3. an empty side --------------------------------------------- */
    if (s.text && !next.text) {
      fail('HIGH', 'empty', `${page}: the Arabic side is empty for "${s.text.slice(0, 60)}"`);
    }

    /* --- 4. lang="ar" -------------------------------------------------- */
    if (ARABIC.test(next.text) && !/\blang="ar"/.test(next.attrs)) {
      fail('HIGH', 'lang', `${page}: Arabic text without lang="ar" — a screen reader reads it in an English voice: "${next.text.slice(0, 50)}"`);
    }

    /* --- 5. Latin inside Arabic -----------------------------------------
       NOT an allowlist. The first version kept a list of permitted names and
       reported 26 findings, every one of them correct Arabic: Behance, WCAG,
       AA, axe-core, Chromium, Safari, Firefox. A list that must grow every
       time the copy mentions a product is a list that will be wrong, and the
       cost of it being wrong is that real findings hide among the noise.

       What actually indicates untranslated prose is a RUN of Latin words —
       an Arabic sentence does not contain four English words in a row unless
       somebody forgot to translate it. Proper nouns arrive alone or in twos. */
    const run = next.text.match(/[A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){3,}/);
    if (run) {
      fail('MED', 'latin', `${page}: an Arabic string contains a run of English words, which usually means it was never translated — "${run[0].slice(0, 60)}"`);
    }
    if (next.text && !ARABIC.test(next.text) && next.text.split(/\s+/).length > 4) {
      fail('HIGH', 'latin', `${page}: an Arabic string contains no Arabic at all — "${next.text.slice(0, 60)}"`);
    }

    /* --- 6. UNTAGGED Arabic inside the English side ----------------------
       Quoting Arabic in English prose is good writing, not a defect —
       /story chapter 04 quotes the client's own promise and translates it in
       the same breath. What IS a defect is leaving it untagged: a screen
       reader on the English page then pronounces Arabic with an English
       voice, which produces noise rather than words.

       So the raw span is checked, not the stripped text, and anything already
       inside a lang="ar" element is removed before looking. Found exactly one
       instance on 7 September, in the one place the site quotes Arabic. */
    const bare = strip(s.raw.replace(/<[a-z]+[^>]*\blang="ar"[^>]*>[\s\S]*?<\/[a-z]+>/gi, ''));
    if (ARABIC.test(bare)) {
      fail('HIGH', 'untagged', `${page}: Arabic inside an English string with no lang="ar" — a screen reader reads it in an English voice: "${s.text.slice(0, 70)}"`);
    }

    /* --- 7. THE NUMBERS MUST AGREE -------------------------------------
       The check `docs/119` §2.1 wishes had existed. Compared as multisets:
       an extra figure on one side is as much a defect as a different one. */
    const en = figures(s.text);
    const ar = figures(next.text);
    const sortJoin = (a) => [...a].sort().join(',');
    if (sortJoin(en) !== sortJoin(ar)) {
      fail('HIGH', 'numbers', `${page}: the two languages state different figures — English [${en.join(', ') || 'none'}] vs Arabic [${ar.join(', ') || 'none'}] — "${s.text.slice(0, 55)}" / "${next.text.slice(0, 55)}"`);
    }
  }

  /* --- 8. alt text in both languages ---------------------------------- */
  const altEn = [...html.matchAll(/data-alt-en="([^"]*)"/g)].length;
  const altAr = [...html.matchAll(/data-alt-ar="([^"]*)"/g)].length;
  if (altEn !== altAr) {
    fail('HIGH', 'alt', `${page}: ${altEn} data-alt-en and ${altAr} data-alt-ar — an image loses its description in one language`);
  }
  for (const m of html.matchAll(/data-alt-ar="([^"]*)"/g)) {
    if (!m[1].trim()) fail('HIGH', 'alt', `${page}: an empty data-alt-ar`);
    else if (!ARABIC.test(m[1])) fail('MED', 'alt', `${page}: a data-alt-ar with no Arabic in it — "${m[1].slice(0, 50)}"`);
  }

  /* --- 8b. the pre-composed WhatsApp messages ---------------------------
     These are not page copy — they are URL-encoded message bodies that the
     visitor SENDS, under the client's own name, without editing. Several name
     a package and a price.

     Nothing was checking them. Found on 7 September by a negative test that
     missed: changing a price inside one produced no finding, because the
     checker only ever looked at `data-lang-copy` spans. A price drifting
     between the page and the message a buyer sends about it is exactly the
     kind of error nobody notices until a client quotes it back. */
  {
    const wa = (attr) => [...html.matchAll(new RegExp(`${attr}="([^"]*)"`, 'g'))]
      .map((m) => { try { return decodeURIComponent(m[1]); } catch { return m[1]; } });
    const en = wa('data-wa-en');
    const ar = wa('data-wa-ar');
    if (en.length !== ar.length) {
      fail('HIGH', 'whatsapp', `${page}: ${en.length} English WhatsApp messages and ${ar.length} Arabic — one language sends a different set`);
    }
    for (let i = 0; i < Math.min(en.length, ar.length); i += 1) {
      const fe = figures(en[i]);
      const fa = figures(ar[i]);
      const key = (a) => [...a].sort().join(',');
      /* The phone number is in both and is identical, so it cancels out; what
         is left is the package price and anything else quoted. */
      if (key(fe) !== key(fa)) {
        fail('HIGH', 'whatsapp', `${page}: a pre-composed WhatsApp message states different figures in each language — English [${fe.join(', ')}] vs Arabic [${fa.join(', ')}] — "${en[i].slice(0, 70)}"`);
      }
      if (ar[i] && !ARABIC.test(ar[i])) {
        fail('HIGH', 'whatsapp', `${page}: the Arabic WhatsApp message contains no Arabic — "${ar[i].slice(0, 70)}"`);
      }
    }
  }

  /* --- 9. mojibake and placeholders ------------------------------------ */
  if (/[�]/.test(html)) fail('HIGH', 'encoding', `${page}: contains U+FFFD — text was decoded with the wrong encoding somewhere`);
  for (const m of html.matchAll(/data-lang-copy="ar"[^>]*>([^<]*(?:TODO|TBD|PLACEHOLDER|XXX|LOREM|ترجمة)[^<]*)</gi)) {
    fail('HIGH', 'placeholder', `${page}: an Arabic string still reads as a placeholder — "${strip(m[1]).slice(0, 60)}"`);
  }
}

/* --- 10. the i18n map ------------------------------------------------- */
{
  const mapFile = path.join(ROOT, 'src/scripts/navigation-map.js');
  if (fs.existsSync(mapFile)) {
    const src = fs.readFileSync(mapFile, 'utf8');
    /* The file holds an English block and an Arabic block. Keys must match. */
    const keysIn = (block) => new Set([...block.matchAll(/^\s{4}([A-Za-z][\w]*)\s*:/gm)].map((m) => m[1]));
    const halves = src.split(/\n\s*ar\s*:\s*\{/);
    if (halves.length >= 2) {
      const en = keysIn(halves[0]);
      const ar = keysIn(halves[1]);
      for (const k of en) if (!ar.has(k)) fail('HIGH', 'i18n', `navigation-map.js: key "${k}" exists in English and not in Arabic`);
      for (const k of ar) if (!en.has(k)) fail('HIGH', 'i18n', `navigation-map.js: key "${k}" exists in Arabic and not in English`);
    }
  }
}

const n = { HIGH: 0, MED: 0, LOW: 0 };
for (const f of findings) n[f.sev] += 1;
console.log('');
/* Grouped, because one bad pattern can produce fifty lines and the shape
   matters more than the count. */
const byArea = {};
for (const f of findings) (byArea[f.area] ||= []).push(f);
for (const [area, list] of Object.entries(byArea)) {
  console.log(`  ${area} — ${list.length}`);
  for (const f of list.slice(0, 6)) console.log(`    ${f.sev.padEnd(4)} ${f.msg}`);
  if (list.length > 6) console.log(`    … and ${list.length - 6} more`);
}
console.log(`\narabic: ${findings.length} finding(s) — ${n.HIGH} high, ${n.MED} medium, ${n.LOW} low\n`);
process.exit(n.HIGH > 0 ? 1 : 0);
