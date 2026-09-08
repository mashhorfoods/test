/* =============================================================================
   ARCHITECTURE-TEST
   Asserts the things the hardening pass of 8 September made true, on the DATA
   rather than on the rendered page.

   WHY IT IS SEPARATE FROM build-catalogue.js.
   build-catalogue.js refuses to emit a catalogue that is internally
   inconsistent — a broken reference, a cycle, a package that costs more than
   its parts. Those are rules about the SHAPE of the data, and they hold for
   any catalogue anyone might author. What is here is different: these are
   claims about THIS business, decided by the owner and locked. Social Pro is
   400. A complete landing page is 120. Business Website allows five pages.
   Nothing about the schema makes those true, and a validator that enforced
   them would be a validator nobody could ever reuse.

   So: shape rules live in the build, business facts live here, and the two do
   not get confused for each other.

   WHY IT IS SEPARATE FROM builder-test.cjs.
   That one drives a browser to prove the rules DO something when clicked.
   This one needs no browser and runs in a second, which means it can be the
   first thing that fails when a price moves.

   Run:  node tools/architecture-test.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const CAT = read('catalogue/catalogue.json');
const PUB = read('catalogue/catalogue.public.json');
const PRICING = read('src/data/pricing.json');
const CAPS = read('src/data/catalogue/capabilities.json');
const ROLES = read('src/data/catalogue/roles.json');

const fails = [];
const passes = [];
const ok = (label, cond, detail = '') => {
  if (cond) passes.push(label);
  else fails.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

const F = new Map(CAT.features.map((f) => [f.id, f]));
const W = new Map(CAT.workflows.map((w) => [w.feature_id, w]));
const PKG = new Map();
for (const cat of CAT.packages) for (const p of cat.packages) PKG.set(p.id, p);
const ARABIC = /[؀-ۿ]/;

/* --- W1. one file answers the whole question ------------------------------ */
{
  for (const k of ['services', 'features', 'workflows', 'packages', 'roles', 'capabilities', 'addonGroups', 'platforms', 'index']) {
    ok(`catalogue.json carries ${k}`, Array.isArray(CAT[k]) || (CAT[k] && typeof CAT[k] === 'object'), 'absent');
  }
  ok('catalogue.json names where every block was authored', CAT.sources && CAT.sources.packages === 'src/data/pricing.json');
  ok('every published package reached the catalogue', PKG.size === PRICING.categories.reduce((a, c) => a + c.packages.length, 0),
    `${PKG.size} in the catalogue`);
  /* The materialised copy must not drift from the authored source. */
  for (const c of PRICING.categories) {
    for (const p of c.packages) {
      const m = PKG.get(p.id);
      if (!m) { ok(`${p.id} is in the catalogue`, false); continue; }
      ok(`${p.id}: the catalogue price matches pricing.json`, m.price.amount === p.price, `${m.price.amount} vs ${p.price}`);
      ok(`${p.id}: the catalogue name matches pricing.json`, m.name === p.name);
      ok(`${p.id}: the catalogue rank matches pricing.json`, m.rank === p.rank);
      ok(`${p.id}: every feature row resolves`, m.features.every((f) => F.has(f.ref)));
      ok(`${p.id}: every feature row names the workflow that executes it`,
        m.features.every((f) => f.workflow && W.has(f.ref)));
    }
  }
}

/* --- W2. no capability string is unanswered ------------------------------- */
{
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const chips = [...home.matchAll(/<li class="c-service__cap"([^>]*)>/g)].map((m) => m[1]);
  ok('every capability chip on the home page declares an id', chips.every((a) => /data-capability="cap\./.test(a)),
    `${chips.filter((a) => !/data-capability/.test(a)).length} without one`);
  const declared = new Set(CAPS.services.flatMap((s) => s.capabilities.map((c) => c.id)));
  const onPage = chips.map((a) => (/data-capability="([^"]+)"/.exec(a) || [])[1]).filter(Boolean);
  ok('every chip on the page is declared in capabilities.json', onPage.every((id) => declared.has(id)),
    onPage.filter((id) => !declared.has(id)).join(', '));
  ok('every declared capability reaches the page', [...declared].every((id) => onPage.includes(id)),
    [...declared].filter((id) => !onPage.includes(id)).join(', '));
  for (const s of CAPS.services) {
    for (const c of s.capabilities) {
      const refs = c.type === 'group' ? c.featureIds : (c.featureId ? [c.featureId] : []);
      if (c.type === 'marketing') { ok(`${c.id}: marketing-only chips say why`, Boolean(c.reason)); continue; }
      ok(`${c.id}: resolves to at least one real feature`, refs.length > 0 && refs.every((r) => F.has(r)));
    }
  }
  ok('the index can answer "what does this chip mean?"',
    Object.keys(CAT.index.capabilityToFeatures).length === declared.size);
}

/* --- W3. every pipeline stage has a real relationship --------------------- */
{
  let stages = 0;
  for (const s of CAT.services) {
    for (const st of s.pipeline.stages) {
      stages += 1;
      ok(`${st.id}: declares its kind`, ['execution', 'intake', 'delegation'].includes(st.kind), String(st.kind));
      if (st.kind === 'execution') ok(`${st.id}: runs features`, (st.features || []).length > 0);
      if (st.kind === 'intake') {
        ok(`${st.id}: says what it produces`, (st.produces || []).length > 0);
        ok(`${st.id}: says which features consume it`, (st.feeds || []).length > 0 && st.feeds.every((f) => F.has(f)));
        ok(`${st.id}: has a role owner`, st.owner && st.owner.type === 'role');
      }
      if (st.kind === 'delegation') ok(`${st.id}: delegates to a pipeline`, Boolean(st.delegatesTo));
    }
  }
  ok('every one of the pipeline stages was checked', stages === 29, `${stages} stages`);

  /* The four questions an orchestrator asks, answered by lookup. */
  for (const f of CAT.features) {
    ok(`${f.id}: the index knows which workflow executes it`, Boolean(CAT.index.featureToWorkflow[f.id]));
    ok(`${f.id}: the index knows which pipeline and stage it runs in`, Boolean(CAT.index.featureToStage[f.id]));
  }
  ok('every workflow is reachable from a pipeline stage',
    CAT.workflows.every((w) => w.pipeline_stages.length > 0 || (F.get(w.feature_id) || {}).composedOf));
}

/* --- W4. prices are numbers and hierarchy is declared ---------------------- */
{
  ok('pricing.json declares a currency once', PRICING.currency === 'USD');
  const raw = fs.readFileSync(path.join(ROOT, 'src/data/pricing.json'), 'utf8');
  ok('no price is stored as a string', !/"price":\s*"/.test(raw));
  ok('no currency symbol is inside a business value', !/"(price|amount)":\s*"?\$/.test(raw));
  for (const c of PRICING.categories) {
    for (const p of c.packages) {
      const where = `${c.id}/${p.id}`;
      ok(`${where}: price is a number`, typeof p.price === 'number');
      ok(`${where}: declares an explicit rank`, Number.isInteger(p.rank));
      ok(`${where}: carries a level in both languages`, Boolean(p.level && p.levelAr && ARABIC.test(p.levelAr)));
      ok(`${where}: carries a purpose in both languages`, Boolean(p.purpose && p.purposeAr && ARABIC.test(p.purposeAr)));
    }
    const ranked = [...c.packages].sort((a, b) => a.rank - b.rank);
    ok(`${c.id}: rank and price agree`, ranked.every((p, i) => i === 0 || p.price >= ranked[i - 1].price));
  }
}

/* --- The locked business facts -------------------------------------------- */
{
  const price = (id) => PKG.get(id).price;
  ok('Social Pro is 400 a month', price('soc-pro').amount === 400 && price('soc-pro').billing === 'monthly',
    JSON.stringify(price('soc-pro')));
  ok('Social Growth is 650 a month', price('soc-growth').amount === 650 && price('soc-growth').billing === 'monthly',
    JSON.stringify(price('soc-growth')));
  ok('Growth outranks Pro', PKG.get('soc-growth').rank > PKG.get('soc-pro').rank);
  ok('Growth costs more than Pro', price('soc-growth').amount > price('soc-pro').amount);
  ok('Starter, Pro, Growth are ranked 1, 2, 3',
    [PKG.get('soc-starter').rank, PKG.get('soc-pro').rank, PKG.get('soc-growth').rank].join() === '1,2,3');

  /* Scope, not only price: a higher tier that contains less is the defect the
     ladder check exists for, restated here as a business fact. */
  const contents = (id) => new Set(PKG.get(id).features.map((f) => f.ref));
  const superseded = new Set();
  for (const ref of contents('soc-growth')) {
    for (const s of ((F.get(ref) || {}).dependencies || {}).supersedes || []) superseded.add(s);
  }
  const uncovered = [...contents('soc-pro')].filter((r) => !contents('soc-growth').has(r) && !superseded.has(r));
  ok('Growth covers everything Pro does', uncovered.length === 0, uncovered.join(', '));
  ok('Growth is the deeper content strategy',
    PKG.get('soc-growth').features.find((f) => f.ref === 'feat.social.content_strategy').tier === 'complete'
    && PKG.get('soc-pro').features.find((f) => f.ref === 'feat.social.content_strategy').tier === 'core');

  const from = (id) => F.get(id).pricing.from;
  ok('Landing page design is 50', from('feat.websites.landing_design') === 50);
  ok('Landing page development is 50', from('feat.websites.landing_build') === 50);
  ok('Landing page deployment is 20', from('feat.websites.landing_deploy') === 20);
  ok('A complete landing page is 120', from('feat.websites.extra_landing') === 120);
  const parts = F.get('feat.websites.extra_landing').composedOf;
  ok('the complete page is composed of exactly the three parts',
    parts.join() === 'feat.websites.landing_design,feat.websites.landing_build,feat.websites.landing_deploy');
  ok('the three parts add up to the complete price', parts.reduce((a, b) => a + from(b), 0) === 120);
  ok('the complete page is not cheaper to assemble by hand', from('feat.websites.extra_landing') <= parts.reduce((a, b) => a + from(b), 0));

  /* W5, on the data: a prerequisite would make the deployment unsellable. */
  ok('landing page deployment requires no other feature',
    (F.get('feat.websites.landing_deploy').dependencies.requires || []).length === 0,
    JSON.stringify(F.get('feat.websites.landing_deploy').dependencies.requires));
  ok('landing page deployment says where a supplied build may come from',
    (F.get('feat.websites.landing_deploy').suppliedInputs || []).some((s) => s.insteadOf === 'feat.websites.landing_build'));
  ok('its workflow opens by identifying the build it was handed',
    W.get('feat.websites.landing_deploy').stages[0].stage_id === 'intake');
  ok('and the complete page still runs its parts in order',
    W.get('feat.websites.extra_landing').stages.map((s) => s.stage_id).join()
      === 'landing_design,landing_build,landing_deploy');

  ok('Business Website allows five pages', PKG.get('web-business').limits.pages === 5);
  ok('Professional Website allows ten pages', PKG.get('web-professional').limits.pages === 10);
  const extra = F.get('feat.websites.extra_page');
  ok('additional pages use the existing add-on at its existing price',
    extra.pricing.type === 'unit' && extra.pricing.from === 70 && Boolean(extra.addonGroup));
  for (const [id, pages] of [['web-business', 5], ['web-professional', 10]]) {
    const row = PKG.get(id).features.find((f) => f.ref === 'feat.websites.extra_page');
    ok(`${id}: prices ${pages - 1} pages beyond the first`, row && row.qty === pages - 1, JSON.stringify(row));
  }
  const allow = CAT.services.find((s) => s.pageAllowance).pageAllowance;
  ok('the page-allowance rule is data, not code', Boolean(allow && allow.builtBy.length && allow.beyondFirst));
}

/* --- W7. every stage says who and how long -------------------------------- */
{
  const roleIds = new Set(ROLES.roles.map((r) => r.id));
  let stages = 0; let owned = 0; let timed = 0;
  for (const w of CAT.workflows) {
    ok(`${w.workflow_id}: reports an expected duration`, Boolean(w.estimated_duration));
    for (const st of w.stages || []) {
      stages += 1;
      const where = `${w.workflow_id}/${st.stage_id}`;
      if (!st.owner) { ok(`${where}: has an owner`, false); continue; }
      if (st.owner.type === 'delegated') {
        ok(`${where}: delegated stages say what they delegate to`, Boolean(st.owner.to));
        ok(`${where}: a delegated stage claims no duration of its own`, st.duration === null);
        continue;
      }
      ok(`${where}: owner is a role that exists`, st.owner.type === 'role' && roleIds.has(st.owner.id), JSON.stringify(st.owner));
      owned += 1;
      ok(`${where}: has a duration`, st.duration && st.duration.value > 0 && ['hours', 'days'].includes(st.duration.unit));
      timed += 1;
      ok(`${where}: no individual is named`, !/@|\bMr\b|\bMs\b/.test(JSON.stringify(st.owner)));
    }
  }
  ok('every materialised stage was checked', stages > 250, `${stages} stages`);
  ok('every non-delegated stage is owned and timed', owned === timed, `${owned} owned, ${timed} timed`);
  ok('the client is modelled as an external role',
    ROLES.roles.find((r) => r.id === 'role.client').external === true);
  const composite = CAT.workflows.find((w) => w.feature_id === 'feat.websites.extra_landing');
  ok('a composite reports the duration of what it delegates to', composite.estimated_duration.value > 0);
}

/* --- Bilingual integrity, on everything customer-facing -------------------- */
{
  const bi = (v, latin) => v && v.en && v.ar && (latin || ARABIC.test(v.ar));
  for (const s of CAT.services) {
    ok(`${s.id}: name, summary and description are bilingual`,
      bi(s.name) && bi(s.summary) && bi(s.description));
  }
  for (const f of CAT.features) {
    ok(`${f.id}: name and description are bilingual`, bi(f.name, f.latinName) && bi(f.description));
  }
  for (const p of PKG.values()) {
    ok(`${p.id}: level and purpose are bilingual`, bi(p.level) && bi(p.purpose));
  }
  for (const g of CAT.addonGroups) ok(`${g.id}: label is bilingual`, bi(g.label));
  for (const s of CAPS.services) {
    for (const c of s.capabilities) ok(`${c.id}: label is bilingual`, bi(c.label, c.latinLabel));
  }
  for (const r of ROLES.roles) ok(`${r.id}: name and description are bilingual`, bi(r.name) && bi(r.description));

  /* An id is not a label. Nothing in the machine layer may be Arabic. */
  const ids = [
    ...CAT.features.map((f) => f.id), ...CAT.services.map((s) => s.id),
    ...CAT.workflows.map((w) => w.workflow_id), ...[...PKG.keys()],
    ...ROLES.roles.map((r) => r.id), ...CAPS.services.flatMap((s) => s.capabilities.map((c) => c.id)),
  ];
  ok('every internal id is language-neutral', ids.every((i) => /^[\x20-\x7e]+$/.test(i)),
    ids.filter((i) => !/^[\x20-\x7e]+$/.test(i)).join(', '));
}

/* --- Nothing internal reached the public projection ----------------------- */
{
  const blob = JSON.stringify(PUB);
  for (const word of ['workflow_id', 'executionSteps', 'automationPotential', 'estimatedEffort',
    'approval_points', 'stage_id', 'role.', 'suppliedInputs', 'defaultRole']) {
    ok(`the public catalogue does not carry "${word}"`, !blob.includes(word));
  }
  ok('the public catalogue does carry the packages the builder needs', Array.isArray(PUB.packages) && PUB.packages.length === 4);
}

/* --- Report --------------------------------------------------------------- */

if (fails.length) {
  console.error(`\narchitecture-test: ${passes.length} passed, ${fails.length} FAILED\n`);
  fails.forEach((f) => console.error(`  ✗ ${f}`));
  console.error('');
  process.exit(1);
}
console.log(`architecture-test: ${passes.length} passed, 0 failed`);
