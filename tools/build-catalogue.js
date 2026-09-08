/* =============================================================================
   BUILD-CATALOGUE
   Reads src/data/catalogue/, checks it is internally consistent, and emits
   two things:

     catalogue/catalogue.json         the WHOLE truth, with one materialised
                                      workflow per feature. This is the file a
                                      CRM, a project board, a quotation
                                      generator or an agent reads. Nothing
                                      ships it to a browser: no build touches
                                      catalogue/.

     catalogue/catalogue.public.json  the PROJECTION a visitor may see —
                                      labels, descriptions, pricing,
                                      dependencies, add-on grouping. No
                                      workflow, no stage, no automation field,
                                      no internal status, no effort estimate.

   WHY THE SPLIT IS THE POINT.
   The brief asks for two things that pull against each other: enough
   structure that an agent could execute a selected scope, and a visitor who
   never sees workflow ids, internal statuses or agent terminology. A single
   file cannot be both. So the internal catalogue is authored in full and the
   public one is DERIVED, by an allowlist — a field that is not named in
   PUBLIC_FEATURE_FIELDS below cannot reach a browser by being added upstream,
   which is the failure mode a denylist would have.

   WHY THE CHECKS ARE HERE AND NOT IN qa.js.
   qa.js reads the built site. These are checks on the source, and they must
   fail BEFORE anything is rendered: a dependency cycle or an unresolvable
   reference would otherwise become a builder that lets a visitor assemble a
   scope nobody can execute.

   Run:  node tools/build-catalogue.js
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/data/catalogue');
const OUT = path.join(ROOT, 'catalogue');

const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

const SERVICES = read('services.json');
const WORKFLOWS = read('workflows.json');
const ADDON_GROUPS = read('addon-groups.json');
const PRICING = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pricing.json'), 'utf8'));

const featureFiles = fs.readdirSync(SRC).filter((f) => /^features\..+\.json$/.test(f)).sort();

const problems = [];
const advisories = [];
const fail = (m) => problems.push(m);
const note = (m) => advisories.push(m);

/* --- Load ---------------------------------------------------------------- */

const features = [];
const byId = new Map();

for (const file of featureFiles) {
  const doc = read(file);
  if (!doc.service) fail(`${file}: no "service" declared`);
  for (const f of doc.features || []) {
    if (byId.has(f.id)) fail(`duplicate feature id ${f.id} (${file})`);
    const withService = { ...f, service: doc.service, _file: file };
    byId.set(f.id, withService);
    features.push(withService);
  }
}

const serviceById = new Map(SERVICES.services.map((s) => [s.id, s]));
const groupIds = new Set(ADDON_GROUPS.groups.map((g) => g.id));

/* --- Checks -------------------------------------------------------------- */

const PRICING_TYPES = new Set(['included', 'fixed', 'unit', 'project', 'quote']);
const AUTOMATION = new Set(['none', 'assist', 'partial', 'full']);

/* Bilingual means BOTH strings present and neither one a copy of the other.
   An Arabic field holding the English string is the failure this catches, and
   it is the one a human proof-reader misses on row fifty. */
const bilingual = (v, where, latinName = false) => {
  if (!v || typeof v !== 'object') { fail(`${where}: missing`); return; }
  if (!String(v.en || '').trim()) fail(`${where}: no English`);
  if (!String(v.ar || '').trim()) fail(`${where}: no Arabic`);
  /* An Arabic string identical to the English is almost always a row nobody
     translated. The exception is a product name that IS written in Latin
     script in Arabic — Reels, Meta Ads, Google Ads — and the exception has to
     be DECLARED (`latinName: true`) rather than inferred, so the check cannot
     be satisfied by an oversight that happens to look like one. */
  if (v.en && v.ar && v.en === v.ar && !latinName) {
    fail(`${where}: Arabic is a copy of the English (declare latinName if that is deliberate)`);
  }
  if (v.ar && !latinName && !/[؀-ۿ]/.test(v.ar)) {
    fail(`${where}: "ar" has no Arabic characters`);
  }
};

for (const f of features) {
  const at = `${f.id}`;
  if (!/^feat\.[a-z_]+\.[a-z0-9_]+$/.test(f.id)) fail(`${at}: id is not feat.<service>.<slug>`);
  if (!serviceById.has(f.service)) fail(`${at}: unknown service ${f.service}`);

  bilingual(f.name, `${at}.name`, f.latinName === true);
  bilingual(f.description, `${at}.description`);
  bilingual(f.purpose, `${at}.purpose`);

  /* An id is language-neutral or it is not an id. A translated id would make
     every downstream join a translation problem. */
  if (/[؀-ۿ]/.test(f.id)) fail(`${at}: id contains Arabic`);

  for (const k of ['inputs', 'executionSteps', 'tools', 'outputs', 'deliverables', 'qualityChecks']) {
    if (!Array.isArray(f[k]) || !f[k].length) fail(`${at}.${k}: empty`);
  }
  if (!String(f.completionCriteria || '').trim()) fail(`${at}.completionCriteria: empty`);
  if (!f.revisionRules || typeof f.revisionRules.rounds !== 'number') fail(`${at}.revisionRules.rounds: missing`);
  if (!AUTOMATION.has(f.automationPotential)) fail(`${at}.automationPotential: "${f.automationPotential}" is not one of ${[...AUTOMATION].join('/')}`);
  if (typeof f.humanApprovalRequired !== 'boolean') fail(`${at}.humanApprovalRequired: not a boolean`);
  if (!f.estimatedEffort || typeof f.estimatedEffort.min !== 'number' || typeof f.estimatedEffort.max !== 'number') {
    fail(`${at}.estimatedEffort: missing min/max`);
  } else if (f.estimatedEffort.min > f.estimatedEffort.max) {
    fail(`${at}.estimatedEffort: min above max`);
  }
  if (f.status !== 'active' && f.status !== 'retired') fail(`${at}.status: "${f.status}"`);

  /* Pricing. The brief is explicit: where a price cannot reasonably be
     calculated, show a custom quote rather than invent a figure. So a `quote`
     row must NOT carry a number, and must say why in both languages. */
  const p = f.pricing || {};
  if (!PRICING_TYPES.has(p.type)) fail(`${at}.pricing.type: "${p.type}"`);
  if (p.type === 'quote') {
    if (p.from !== undefined) fail(`${at}: a quote-priced feature carries a price`);
    bilingual(p.quoteReason, `${at}.pricing.quoteReason`);
  }
  if ((p.type === 'fixed' || p.type === 'unit' || p.type === 'project') && typeof p.from !== 'number') {
    fail(`${at}.pricing.from: missing on a ${p.type} feature`);
  }
  if (p.type === 'included' && p.from !== undefined) fail(`${at}: an included feature carries a price`);
  if (p.type === 'unit') {
    bilingual(p.unit, `${at}.pricing.unit`);
    bilingual(p.unitPlural, `${at}.pricing.unitPlural`);
    for (const k of ['defaultQty', 'minQty', 'maxQty']) {
      if (typeof p[k] !== 'number') fail(`${at}.pricing.${k}: missing`);
    }
    if (p.defaultQty < p.minQty || p.defaultQty > p.maxQty) fail(`${at}.pricing.defaultQty outside min/max`);
  }

  if (f.addonGroup && !groupIds.has(f.addonGroup)) fail(`${at}.addonGroup: unknown group ${f.addonGroup}`);
  if (f.addonGroup && typeof f.addonOrder !== 'number') fail(`${at}: published as an add-on with no addonOrder`);
  if (f.addonOrder !== undefined && !f.addonGroup) fail(`${at}: has an addonOrder but no addonGroup`);
  if (f.addonName) bilingual(f.addonName, `${at}.addonName`, f.latinName === true);
  if (!WORKFLOWS.templates[f.workflow]) fail(`${at}.workflow: no template ${f.workflow}`);

  const d = f.dependencies || {};
  for (const k of ['requires', 'recommends', 'conflicts']) {
    if (!Array.isArray(d[k])) { fail(`${at}.dependencies.${k}: missing`); continue; }
    for (const ref of d[k]) {
      if (!byId.has(ref)) fail(`${at}.dependencies.${k}: unknown feature ${ref}`);
      if (ref === f.id) fail(`${at}.dependencies.${k}: depends on itself`);
    }
  }
  /* `supersedes` is OPTIONAL and one-directional, which is the whole reason it
     exists. Three pairs in this catalogue were written as conflicts and are
     not: complete brand guidelines do not clash with the short ones, they
     REPLACE them, and so does the full ad-template set, the full asset
     archive, community management over monitoring, and segmentation over
     plain targeting. Modelling that as a symmetric conflict made the Advanced
     package — which legitimately contains both, one carried from Professional
     — read as an impossible scope. */
  for (const k of ['supersedes']) {
    if (d[k] === undefined) continue;
    if (!Array.isArray(d[k])) { fail(`${at}.dependencies.${k}: not an array`); continue; }
    for (const ref of d[k]) {
      if (!byId.has(ref)) fail(`${at}.dependencies.${k}: unknown feature ${ref}`);
      if (ref === f.id) fail(`${at}.dependencies.${k}: depends on itself`);
    }
  }
}

/* ADD-ON NUMBERING IS GENERATED, so it must be unambiguous. The eleven index
   numbers used to be typed by hand into index.html, which is why adding a
   twelfth meant renumbering eleven. */
{
  const seen = new Map();
  for (const f of features.filter((x) => x.addonGroup)) {
    if (seen.has(f.addonOrder)) fail(`add-on order ${f.addonOrder} used by both ${seen.get(f.addonOrder)} and ${f.id}`);
    seen.set(f.addonOrder, f.id);
  }
  const orders = [...seen.keys()].sort((a, b) => a - b);
  orders.forEach((n, i) => { if (n !== i + 1) fail(`add-on numbering has a gap or does not start at 1: ${orders.join(', ')}`); });
  /* Publication order must agree with the group order, or the generated index
     numbers would run 01, 04, 02 down the page. */
  const groupOrder = new Map(ADDON_GROUPS.groups.map((g) => [g.id, g.order]));
  let last = 0;
  for (const n of orders) {
    const g = groupOrder.get(byId.get(seen.get(n)).addonGroup);
    if (g < last) fail(`add-on ${seen.get(n)} (#${n}) sits in a group that publishes before the previous add-on's group`);
    last = g;
  }
}

/* SUPERSEDING MUST NOT BE MUTUAL, and a feature may not supersede something it
   also requires — either would make the pair unresolvable in the builder. */
for (const f of features) {
  const sup = (f.dependencies || {}).supersedes || [];
  const req = new Set((f.dependencies || {}).requires || []);
  for (const other of sup) {
    if (req.has(other)) fail(`${f.id} supersedes ${other} and also requires it`);
    const o = byId.get(other);
    if (o && ((o.dependencies || {}).supersedes || []).includes(f.id)) {
      fail(`${f.id} and ${other} supersede each other`);
    }
  }
}

/* CONFLICTS MUST BE SYMMETRIC. A one-sided conflict is a rule that fires when
   the visitor selects A then B and stays silent when they select B then A —
   the same class of half-present rule this project keeps finding. */
for (const f of features) {
  for (const other of (f.dependencies || {}).conflicts || []) {
    const o = byId.get(other);
    if (o && !((o.dependencies || {}).conflicts || []).includes(f.id)) {
      fail(`${f.id} conflicts with ${other}, but ${other} does not conflict back`);
    }
  }
}

/* NO CYCLE IN `requires`. A cycle would be a scope nothing can start. */
{
  const WHITE = 0; const GREY = 1; const BLACK = 2;
  const mark = new Map(features.map((f) => [f.id, WHITE]));
  const walk = (id, trail) => {
    if (mark.get(id) === BLACK) return;
    if (mark.get(id) === GREY) { fail(`dependency cycle: ${[...trail, id].join(' -> ')}`); return; }
    mark.set(id, GREY);
    for (const r of (byId.get(id).dependencies || {}).requires || []) {
      if (byId.has(r)) walk(r, [...trail, id]);
    }
    mark.set(id, BLACK);
  };
  for (const f of features) walk(f.id, []);
}

/* A REQUIRED FEATURE MAY NOT ALSO BE A CONFLICT, directly or one step out —
   that is a scope that cannot be satisfied at all. */
for (const f of features) {
  const req = new Set((f.dependencies || {}).requires || []);
  for (const c of (f.dependencies || {}).conflicts || []) {
    if (req.has(c)) fail(`${f.id} both requires and conflicts with ${c}`);
  }
  for (const r of req) {
    const rf = byId.get(r);
    if (!rf) continue;
    for (const c of (rf.dependencies || {}).conflicts || []) {
      if (req.has(c)) fail(`${f.id} requires ${r} and ${c}, which conflict`);
    }
  }
}

/* EVERY FEATURE BELONGS TO EXACTLY ONE PIPELINE STAGE. A feature in no stage
   is one nothing knows how to schedule; a feature in two is one two people
   will each assume the other did. */
{
  const seen = new Map();
  for (const s of SERVICES.services) {
    for (const st of s.pipeline.stages || []) {
      for (const ref of st.features || []) {
        if (!byId.has(ref)) { fail(`${st.id}: unknown feature ${ref}`); continue; }
        if (byId.get(ref).service !== s.id) fail(`${st.id}: ${ref} belongs to ${byId.get(ref).service}`);
        if (seen.has(ref)) fail(`${ref} appears in two pipeline stages: ${seen.get(ref)} and ${st.id}`);
        seen.set(ref, st.id);
      }
    }
  }
  for (const f of features) if (!seen.has(f.id)) fail(`${f.id} is in no pipeline stage`);
}

/* A COMPOSED SERVICE DELEGATES; IT DOES NOT HIDE A SIXTH PIPELINE. */
for (const s of SERVICES.services) {
  bilingual(s.name, `${s.id}.name`);
  bilingual(s.summary, `${s.id}.summary`);
  bilingual(s.description, `${s.id}.description`);
  for (const st of s.pipeline.stages || []) {
    bilingual(st.name, `${st.id}.name`);
    if (st.delegatesTo) {
      const target = SERVICES.services.find((x) => x.pipeline.id === st.delegatesTo);
      if (!target) fail(`${st.id}: delegates to unknown pipeline ${st.delegatesTo}`);
      if ((st.features || []).length) fail(`${st.id}: delegates AND declares its own features`);
    }
  }
  for (const c of s.composes || []) if (!serviceById.has(c)) fail(`${s.id}: composes unknown service ${c}`);
  if (s.legacyCategory) {
    const cat = PRICING.categories.find((c) => c.id === s.legacyCategory);
    if (!cat) {
      fail(`${s.id}: legacyCategory "${s.legacyCategory}" is not a category in pricing.json`);
    } else {
      /* THE PRICE SURFACES MAY USE A SHORTER NAME, AND MUST DECLARE IT.
         docs/124 §3 found service 04 called four different things in four
         places on one page — Digital Marketing & Advertising, Marketing & Ads,
         Digital Marketing & Ads, Digital Marketing — with nothing able to
         notice. The short form is legitimate: an index card and a WhatsApp
         button cannot carry the full name without wrapping. What was not
         legitimate was that nobody had written down which was which. */
      if (s.shortName) {
        bilingual(s.shortName, `${s.id}.shortName`);
        if (cat.label !== s.shortName.en) {
          fail(`${s.id}: pricing.json calls this category "${cat.label}" but the service declares its short form as "${s.shortName.en}"`);
        }
        if (cat.labelAr !== s.shortName.ar) {
          fail(`${s.id}: pricing.json's Arabic label for this category disagrees with the service's declared short form`);
        }
      } else if (cat.label !== s.name.en) {
        fail(`${s.id}: pricing.json calls this category "${cat.label}", the service is "${s.name.en}", and no shortName declares the difference`);
      }
    }
  }
}

/* EVERY PUBLISHED PACKAGE ROW RESOLVES. This is the join that makes the
   catalogue true rather than parallel: if a package sells something the
   catalogue does not describe, the catalogue is a decoration. */
{
  const rowsByPackage = new Map();
  for (const c of PRICING.categories) {
    const svc = SERVICES.services.find((s) => s.legacyCategory === c.id);
    if (!svc) { fail(`pricing category "${c.id}" maps to no service`); continue; }
    for (const p of c.packages) {
      const refs = [];
      for (const row of p.features) {
        /* A MISSING ref IS AN ADVISORY; a BROKEN one is a failure.
           The admin dashboard edits pricing.json from a browser — possibly a
           phone — and a person adding a line to a package there has no way to
           know a catalogue exists. Refusing their edit would be the build
           protecting itself at the owner's expense: the line still renders,
           it is simply not joined to anything yet. A ref that points at
           nothing is different — that is a join someone made and broke. */
        if (!('ref' in row)) { note(`${c.id}/${p.id}: feature "${row.en}" is not joined to the catalogue — add a "ref"`); continue; }
        if (row.ref === null) continue; // a carry line, not a feature
        const f = byId.get(row.ref);
        if (!f) { fail(`${c.id}/${p.id}: ref ${row.ref} resolves to nothing`); continue; }
        if (f.service !== svc.id) fail(`${c.id}/${p.id}: ${row.ref} belongs to ${f.service}, not ${svc.id}`);
        if (row.qty !== undefined && f.pricing.type !== 'unit') {
          fail(`${c.id}/${p.id}: ${row.ref} carries a qty but is not unit-priced`);
        }
        if (refs.includes(row.ref)) {
          note(`${c.id}/${p.id}: "${row.en}" is a second published line for ${row.ref}`);
        }
        refs.push(row.ref);
      }
      rowsByPackage.set(`${c.id}/${p.id}`, refs);
    }
  }

  /* A PUBLISHED PACKAGE MAY NOT BE AN IMPOSSIBLE SCOPE EITHER. The builder is
     not the only thing that can assemble one — a package can, and one did:
     until this check existed nothing compared a package's contents against the
     dependency graph the builder enforces. */
  for (const [where, refs] of rowsByPackage) {
    const has = new Set(refs);
    const carries = /branding\/tier-advanced/.test(where)
      ? new Set([...has, ...(rowsByPackage.get('branding/tier-professional') || [])])
      : has;
    for (const ref of refs) {
      const f = byId.get(ref);
      for (const r of (f.dependencies || {}).requires || []) {
        if (!carries.has(r)) note(`${where}: ${ref} requires ${r}, which the package does not list`);
      }
      /* CONFLICTS are checked against this package's OWN rows, not the carried
         set: a higher tier that carries a lower one legitimately contains the
         superseded version of a thing, and that is an upgrade, not a clash. */
      for (const c of (f.dependencies || {}).conflicts || []) {
        if (has.has(c)) fail(`${where}: lists ${ref} and ${c}, which conflict`);
      }
      for (const sup of (f.dependencies || {}).supersedes || []) {
        if (has.has(sup)) note(`${where}: lists ${ref} and ${sup}, which it supersedes`);
      }
    }
  }
}

/* --- Materialise --------------------------------------------------------- */

/* Resolve the $feature.* tokens a template carries. This is the mechanism
   that keeps sixty-eight workflows from being sixty-eight hand-written
   objects: the shape comes from the template, the substance from the feature,
   and neither is authored twice. */
const TOKEN = /\$feature\.[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/g;
const lookup = (path, feature) =>
  path.replace('$feature.', '').split('.').reduce((o, k) => (o == null ? o : o[k]), feature);

function resolve(value, feature) {
  if (typeof value === 'string') {
    /* A string that is NOTHING BUT a token takes the value's own type — an
       array splices in, a number stays a number. A token INSIDE a sentence is
       substituted as text, because "Stop at 2." is the sentence that was
       written and "Stop at [2]." is not. */
    const whole = /^\$feature\.[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.exec(value);
    if (whole) {
      const got = lookup(value, feature);
      return got === undefined ? value : got;
    }
    return value.replace(TOKEN, (t) => {
      const got = lookup(t, feature);
      if (got === undefined) return t;
      return Array.isArray(got) ? got.join('; ') : String(got);
    });
  }
  if (Array.isArray(value)) {
    // A token that resolves to an array splices in; it does not nest.
    return value.flatMap((v) => {
      const r = resolve(v, feature);
      return Array.isArray(r) ? r : [r];
    });
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, feature)]));
  }
  return value;
}

function materialise(feature) {
  const tpl = WORKFLOWS.templates[feature.workflow];
  const overrides = feature.workflowOverrides || {};
  const base = resolve({ ...tpl, ...overrides }, feature);
  delete base.label;
  return {
    workflow_id: `${feature.workflow}::${feature.id}`,
    template: feature.workflow,
    feature_id: feature.id,
    service_id: feature.service,
    ...base,
  };
}

/* A materialised workflow with an unresolved token in it is a workflow that
   would hand an agent the literal string "$feature.tools". */
const materialised = features.map(materialise);
{
  const leftover = JSON.stringify(materialised).match(/\$feature\.[a-zA-Z_.]+/g);
  if (leftover) fail(`unresolved tokens after materialising: ${[...new Set(leftover)].join(', ')}`);
}

/* --- Report and stop, or write ------------------------------------------- */

if (problems.length) {
  console.error(`\ncatalogue: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  problems.forEach((p) => console.error(`  ${p}`));
  console.error('');
  process.exit(1);
}

/* --- The public projection ----------------------------------------------- */

/* AN ALLOWLIST, DELIBERATELY. Adding a field to a feature must not be able to
   publish it by accident; a field reaches a visitor only by being named here,
   and adding a name to this list is a decision someone makes on purpose. */
const PUBLIC_FEATURE_FIELDS = [
  'id', 'service', 'name', 'description', 'purpose',
  'category', 'selectable', 'addonGroup', 'pricing', 'recurrence',
  'thirdPartyCost', 'latinName', 'addonName', 'addonOrder',
];

/* Dependencies are public because the builder has to enforce them in front of
   the visitor — but only the edges, never the reasoning. */
const publicFeature = (f) => {
  const out = {};
  for (const k of PUBLIC_FEATURE_FIELDS) if (f[k] !== undefined) out[k] = f[k];
  out.dependencies = {
    requires: (f.dependencies || {}).requires || [],
    recommends: (f.dependencies || {}).recommends || [],
    conflicts: (f.dependencies || {}).conflicts || [],
    supersedes: (f.dependencies || {}).supersedes || [],
  };
  out.revisions = (f.revisionRules || {}).rounds;
  return out;
};

const publicCatalogue = {
  _comment: [
    'GENERATED by tools/build-catalogue.js. Do not edit.',
    'The projection of src/data/catalogue/ that a visitor may see. Every',
    'internal field — workflow, stages, execution steps, tools, quality',
    'checks, automation potential, effort, status — is absent by',
    'construction, not by deletion.',
  ],
  version: SERVICES.version,
  generated: 'tools/build-catalogue.js',
  services: SERVICES.services.map((s) => ({
    id: s.id,
    order: s.order,
    legacyCategory: s.legacyCategory,
    name: s.name,
    shortName: s.shortName,
    summary: s.summary,
    description: s.description,
    composes: s.composes,
    note: s.note,
    pricing: s.pricing,
    recurring: Boolean(s.recurring),
  })),
  addonGroups: ADDON_GROUPS.groups,
  addonCounts: ADDON_GROUPS.counts,
  features: features.filter((f) => f.status === 'active').map(publicFeature),
};

/* --- The full export ----------------------------------------------------- */

const fullCatalogue = {
  _comment: [
    'GENERATED by tools/build-catalogue.js. Do not edit.',
    'The whole service architecture in one file: services, pipelines,',
    'features and one materialised workflow per feature. This is the file an',
    'automation, a CRM, a quotation generator or an agent reads. No build',
    'reads catalogue/, so nothing here can reach dist/ or a visitor.',
  ],
  version: SERVICES.version,
  generated: 'tools/build-catalogue.js',
  services: SERVICES.services,
  addonGroups: ADDON_GROUPS.groups,
  features: features.map(({ _file, ...f }) => f),
  workflows: materialised,
};

fs.mkdirSync(OUT, { recursive: true });
const write = (name, obj) => {
  const file = path.join(OUT, name);
  const next = `${JSON.stringify(obj, null, 2)}\n`;
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  fs.writeFileSync(file, next);
  return next === before ? 'already up to date' : 'written';
};

console.log(`catalogue: ${SERVICES.services.length} services, ${features.length} features, ${Object.keys(WORKFLOWS.templates).length} workflow templates, ${materialised.length} materialised workflows`);
console.log(`  catalogue/catalogue.json         ${write('catalogue.json', fullCatalogue)}`);
console.log(`  catalogue/catalogue.public.json  ${write('catalogue.public.json', publicCatalogue)}`);

const addonCount = features.filter((f) => f.addonGroup).length;
const quoteCount = features.filter((f) => f.pricing.type === 'quote').length;
console.log(`  ${addonCount} published as add-ons, ${quoteCount} quote-only, ${features.filter((f) => f.pricing.type === 'unit').length} quantity-based`);

if (advisories.length) {
  console.log(`\ncatalogue: ${advisories.length} advisor${advisories.length === 1 ? 'y' : 'ies'} — not failures, but worth reading`);
  advisories.forEach((a) => console.log(`  ${a}`));
}
