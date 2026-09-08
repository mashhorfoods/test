/**
 * CATALOGUE-READ — the one door between the operational layer and the catalogue.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE.
 * The operational layer must never hold a second copy of what Pixora sells or
 * how it is executed. Not a service list, not a price, not a service -> pipeline
 * map, not a page-allowance rule. When the order validator wants to know
 * whether something is valid it ASKS, and this is what it asks.
 *
 * Everything below is a lookup into `catalogue/catalogue.json` — most of it
 * through the `index` block that build-catalogue.js generates precisely so
 * these questions are lookups rather than walks. Nothing here decides anything.
 * If a question cannot be answered from the catalogue, the right fix is in the
 * catalogue, not here.
 *
 * It takes the parsed catalogue as an argument and does no I/O, so the same
 * module serves Node, the browser and the tests without any of them knowing
 * about the others.
 */

export function createCatalogue(catalogue) {
  if (!catalogue || !catalogue.index) {
    throw new Error('catalogue-read: that is not catalogue.json — it has no index block');
  }

  const services = new Map(catalogue.services.map((s) => [s.id, s]));
  const features = new Map(catalogue.features.map((f) => [f.id, f]));
  const workflows = new Map(catalogue.workflows.map((w) => [w.workflow_id, w]));
  const roles = new Map((catalogue.roles || []).map((r) => [r.id, r]));
  const packages = new Map();
  const categories = new Map();
  for (const cat of catalogue.packages || []) {
    categories.set(cat.id, cat);
    for (const p of cat.packages) packages.set(p.id, p);
  }
  const addonGroups = new Map((catalogue.addonGroups || []).map((g) => [g.id, g]));
  const stages = new Map();
  for (const s of catalogue.services) {
    for (const st of s.pipeline.stages || []) stages.set(st.id, { ...st, pipeline: s.pipeline.id, service: s.id });
  }
  const idx = catalogue.index;

  return {
    /** What the order snapshot records so a reader knows which catalogue it came from. */
    version: catalogue.version,
    currency: catalogue.currency,

    service: (id) => services.get(id) || null,
    feature: (id) => features.get(id) || null,
    package: (id) => packages.get(id) || null,
    category: (id) => categories.get(id) || null,
    workflow: (id) => workflows.get(id) || null,
    role: (id) => roles.get(id) || null,
    stage: (id) => stages.get(id) || null,
    addonGroup: (id) => addonGroups.get(id) || null,

    allServices: () => [...services.values()],
    allPackages: () => [...packages.values()],

    /** SERVICE -> PIPELINE, from the catalogue. Never a mapping in project code. */
    pipelineFor(serviceId) {
      const s = services.get(serviceId);
      return s ? s.pipeline.id : null;
    },

    /** The pipeline's stages, in order, as the template defines them. */
    pipelineStages(serviceId) {
      const s = services.get(serviceId);
      return s ? s.pipeline.stages.map((st) => ({ ...st })) : [];
    },

    /** FEATURE -> WORKFLOW, by lookup. */
    workflowFor: (featureId) => idx.featureToWorkflow[featureId] || null,

    /** FEATURE -> the pipeline stage(s) it runs in. A composite spans several. */
    stagesFor(featureId) {
      const at = idx.featureToStage[featureId];
      return at ? { pipeline: at.pipeline, stages: [...at.stages] } : null;
    },

    /** Which published packages contain this feature. */
    packagesWith: (featureId) => [...(idx.featureToPackages[featureId] || [])],

    /** What a home-page capability chip actually resolves to. */
    capabilityFeatures: (capabilityId) => [...(idx.capabilityToFeatures[capabilityId] || [])],

    /** Is this feature a composite, and of what? */
    partsOf: (featureId) => [...((features.get(featureId) || {}).composedOf || [])],
    isComposite: (featureId) => Boolean((features.get(featureId) || {}).composedOf || []).valueOf(),

    /** The service that owns a feature — used to check an order's own claim. */
    serviceOf: (featureId) => (features.get(featureId) || {}).service || null,

    /** The service that owns a package. */
    serviceOfPackage: (packageId) => (packages.get(packageId) || {}).service || null,

    /**
     * THE PAGE-ALLOWANCE RULE, read from the catalogue rather than restated.
     * `builtBy` names the features whose presence means pages are being built;
     * `beyondFirst` names the add-on that prices every page after the first.
     */
    pageAllowance() {
      const s = catalogue.services.find((x) => x.pageAllowance);
      if (!s) return null;
      const { _comment, ...rule } = s.pageAllowance;
      return rule;
    },

    /** How many pages a package includes, if it includes any. */
    packagePages: (packageId) => ((packages.get(packageId) || {}).limits || {}).pages ?? null,

    /** A package's declared rank — the tier ladder, never inferred from price. */
    packageRank: (packageId) => (packages.get(packageId) || {}).rank ?? null,

    /** A feature's published price shape. Read to TAKE A SNAPSHOT, never to re-price. */
    featurePricing: (featureId) => {
      const f = features.get(featureId);
      return f ? { ...f.pricing } : null;
    },

    /** A package's published price. Same purpose. */
    packagePrice: (packageId) => {
      const p = packages.get(packageId);
      return p ? { ...p.price } : null;
    },

    /** Bilingual names, for customer-facing summaries. Ids are never translated. */
    nameOf(id) {
      const f = features.get(id); if (f) return f.name;
      const s = services.get(id); if (s) return s.name;
      const p = packages.get(id); if (p) return { en: p.name, ar: p.name };
      const st = stages.get(id); if (st) return st.name;
      const r = roles.get(id); if (r) return r.name;
      return null;
    },

    /** Does this id exist at all, and as what? Used by the order validator. */
    kindOf(id) {
      if (services.has(id)) return 'service';
      if (features.has(id)) return 'feature';
      if (packages.has(id)) return 'package';
      if (workflows.has(id)) return 'workflow';
      if (stages.has(id)) return 'stage';
      if (roles.has(id)) return 'role';
      if (addonGroups.has(id)) return 'addonGroup';
      return null;
    },

    /** Is this feature published as an add-on, and in which group? */
    addonGroupOf: (featureId) => (features.get(featureId) || {}).addonGroup || null,

    /** Does executing this feature need a person to approve something? */
    needsHumanApproval: (featureId) => Boolean((features.get(featureId) || {}).humanApprovalRequired),

    /** How long the catalogue expects the work to take. */
    durationOf(featureId) {
      const w = workflows.get(idx.featureToWorkflow[featureId]);
      return w ? { ...w.estimated_duration } : null;
    },

    /** The dependency edges, for validating that an ordered scope is executable. */
    requires: (featureId) => [...(((features.get(featureId) || {}).dependencies || {}).requires || [])],
    conflicts: (featureId) => [...(((features.get(featureId) || {}).dependencies || {}).conflicts || [])],
    supersedes: (featureId) => [...(((features.get(featureId) || {}).dependencies || {}).supersedes || [])],

    /** Where a feature will accept a client-supplied artefact instead of an upstream feature. */
    suppliedInputs: (featureId) => [...((features.get(featureId) || {}).suppliedInputs || [])],
  };
}
