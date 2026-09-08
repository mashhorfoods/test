/* =============================================================================
   BUILD-CAPABILITIES
   Renders the capability chips under each service on the home page from
   src/data/catalogue/capabilities.json.

   WHY THIS FILE EXISTS.
   These chips were thirty strings typed into index.html. Eight repeated a
   catalogue feature's name exactly; twenty-two named nothing the system had
   ever heard of. The audit of 8 September called it the one unguarded
   duplication of business vocabulary on the site, and it is: a visitor reads
   "Campaign Management" as something we do, and nothing downstream — no
   builder, no workflow, no agent — could say what that meant or who would do
   it.

   They are the same words on the page as before. The difference is that each
   one now declares what executes it, and build-catalogue.js refuses the build
   if that declaration points at nothing.

   Run:  node tools/build-capabilities.js   (or via npm run catalogue)
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/catalogue/capabilities.json'), 'utf8'));
const SERVICES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/catalogue/services.json'), 'utf8'));

const byService = new Map(SERVICES.services.map((s) => [s.id, s]));

/* The labels are authored as the markup already escapes them — "Domain &amp;
   Hosting" is the string in the data file — so they are written through, not
   re-escaped. A second pass would render "&amp;amp;" on the page. */
const chip = (c) => `                  <li class="c-service__cap" data-capability="${c.id}"><span><span data-lang-copy="en">${c.label.en}</span><span data-lang-copy="ar" lang="ar">${c.label.ar}</span></span></li>`;

const render = (entry) => {
  const svc = byService.get(entry.service);
  const key = svc.legacyCategory;
  return [
    `<!-- CAPS:${key}:START -->`,
    `                <ul class="c-service__caps" role="list">`,
    ...entry.capabilities.map(chip),
    `                </ul>`,
    `                <!-- CAPS:${key}:END -->`,
  ].join('\n');
};

const file = path.join(ROOT, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html;
let written = 0;

for (const entry of DATA.services) {
  const svc = byService.get(entry.service);
  if (!svc) throw new Error(`capabilities.json names ${entry.service}, which services.json does not have`);
  const key = svc.legacyCategory;
  const a = `<!-- CAPS:${key}:START -->`;
  const b = `<!-- CAPS:${key}:END -->`;
  if (!html.includes(a) || !html.includes(b)) {
    throw new Error(`index.html carries no ${a} … ${b} markers — the chips for ${entry.service} have nowhere to go`);
  }
  html = html.replace(new RegExp(`${a}[\\s\\S]*?${b}`), () => render(entry));
  written += entry.capabilities.length;
}

fs.writeFileSync(file, html);
console.log(`index.html: ${html === before ? 'already up to date' : 'updated'}`);
console.log(`capabilities: ${written} chips across ${DATA.services.length} services`);
console.log('  source -> src/data/catalogue/capabilities.json');
