/* =============================================================================
   BUILD-CONTACT
   Makes site.config.json's `contact` block the ONE place the studio's WhatsApp
   number, phone number and email address are written.

   WHY THIS EXISTS.
   navigation-map.js carried a CONTACT_CHANNELS array whose comment promised
   "everything that shows a channel reads from here, so the visible number and
   the dialled number cannot drift apart". Nothing read it. The numbers were
   typed by hand into the contact section, into both languages of the privacy
   policy, into aria-labels, into a copy button and into the form's target —
   while the package CTAs were already rendered from site.config.json. Two
   "single sources", one of them dead, and a dozen hand copies besides. Change
   the number and miss one, and a page dials a line that no longer answers.

   HOW IT WORKS.
   The values sit in very different markup — a structured channel list, and
   running bilingual prose in the privacy policy — so they are not generated
   from a template, which would drag page copy into code. Instead this reads
   which number the authored pages currently use and replaces EVERY spelling of
   it with the configured one:

     wa.me/…  tel:+…  mailto:…     the actions
     +249 962672192                the displayed number, wherever it appears —
                                   visible text, aria-label, the Arabic copy's
                                   direction-marked variant
     the bare address              visible text, data-copy, data-contact-form

   The CURRENT value is read from the pages' own links, which is what makes the
   display text unambiguous: the displayed number whose digits match the
   current wa.me link is the WhatsApp display; the one matching tel: is the
   phone's. If the pages disagree among themselves about the current value, the
   build stops rather than guess.

   Then it verifies: after the pass, every contact-shaped token in the sources
   must equal the configured value, or the build fails and names the file.

   To change a number: edit site.config.json, run `node build.js`. That is all.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const c = cfg.contact || {};

/* Authored sources only. The other root pages are regenerated from these by
   build-pages.js, and dist/ by build.js, so they follow automatically. */
const FILES = ['index.html', ...fs.readdirSync(path.join(ROOT, 'src/pages'))
  .filter((f) => f.endsWith('.html')).map((f) => `src/pages/${f}`)];

const WANT = {
  whatsapp: c.whatsapp,
  whatsappDisplay: c.whatsappDisplay,
  phone: c.phone,
  phoneDisplay: c.phoneDisplay,
  email: c.email,
};
for (const [k, v] of Object.entries(WANT)) {
  if (!v) throw new Error(`site.config.json contact.${k} is missing`);
}
const digits = (s) => String(s).replace(/\D/g, '');
if (digits(WANT.whatsappDisplay) !== WANT.whatsapp) throw new Error('contact.whatsappDisplay does not spell contact.whatsapp');
if (digits(WANT.phoneDisplay) !== WANT.phone) throw new Error('contact.phoneDisplay does not spell contact.phone');

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const all = FILES.map(read).join('\n');

/** The single value the pages currently agree on, or a stop. */
function current(label, re) {
  const found = [...new Set([...all.matchAll(re)].map((m) => m[1]))];
  if (found.length > 1) {
    throw new Error(`the pages disagree about the current ${label}: ${found.join(', ')}. `
      + 'Make them agree by hand once, then this tool keeps them that way.');
  }
  return found[0] || null;
}

const was = {
  whatsapp: current('WhatsApp number', /wa\.me\/(\d+)/g),
  phone: current('phone number', /tel:\+(\d+)/g),
  email: current('email address', /mailto:([^"?\s<]+)/g),
};

/* A displayed number is "+", digits, and spaces or hyphens between them. Its
   channel is whichever current number its digits spell.

   NOT when it follows "tel:" — that is the phone link's own number, which must
   stay unspaced. Without the lookbehind this pattern turned tel:+249119005441
   into tel:+249 119005441, a broken link, which is how it was caught. */
const DISPLAY = /(?<!tel:)\+\d[\d \-]{6,}\d/g;
const displayFor = (text) => {
  const d = digits(text);
  if (d === was.whatsapp) return WANT.whatsappDisplay;
  if (d === was.phone) return WANT.phoneDisplay;
  return text;
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let changed = 0;
for (const f of FILES) {
  const before = read(f);
  let s = before
    .replace(/wa\.me\/\d+/g, `wa.me/${WANT.whatsapp}`)
    .replace(/tel:\+\d+/g, `tel:+${WANT.phone}`)
    .replace(DISPLAY, displayFor);
  if (was.email && was.email !== WANT.email) {
    s = s.replace(new RegExp(escapeRe(was.email), 'g'), WANT.email);
  }
  if (s !== before) {
    fs.writeFileSync(path.join(ROOT, f), s);
    changed++;
  }
}

/* VERIFY. Every contact-shaped token must now be the configured one. */
const after = FILES.map((f) => [f, read(f)]);
const stale = [];
for (const [f, s] of after) {
  for (const m of s.matchAll(/wa\.me\/(\d+)/g)) if (m[1] !== WANT.whatsapp) stale.push(`${f}: wa.me/${m[1]}`);
  for (const m of s.matchAll(/tel:\+(\d+)/g)) if (m[1] !== WANT.phone) stale.push(`${f}: tel:+${m[1]}`);
  for (const m of s.matchAll(/mailto:([^"?\s<]+)/g)) if (m[1] !== WANT.email) stale.push(`${f}: mailto:${m[1]}`);
  for (const m of s.matchAll(DISPLAY)) {
    if (m[0] !== WANT.whatsappDisplay && m[0] !== WANT.phoneDisplay) stale.push(`${f}: "${m[0]}"`);
  }
}
if (stale.length) {
  throw new Error(`contact: ${stale.length} value(s) do not match site.config.json:\n  ${[...new Set(stale)].join('\n  ')}`);
}

console.log(`contact: ${changed ? `${changed} file(s) updated` : 'already up to date'} — WhatsApp, phone and email from site.config.json`);
