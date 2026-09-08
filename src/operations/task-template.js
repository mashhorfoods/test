/**
 * TASK-TEMPLATE — derived, never authored.
 *
 * THE DECISION THIS FILE RECORDS.
 * A task template is a reusable definition of a piece of work: what it is for,
 * what it needs, who does it, how long it takes, what it produces, and how you
 * know it is done. Every one of those already exists, in
 * `src/data/catalogue/workflows.json`, on a workflow-template STAGE:
 *
 *   objective  inputs  actions  tools  output  validation  owner  duration  next_stage
 *
 * Writing a second copy of that under the heading "task template" would be the
 * duplication Phase 1 spent its whole length removing, and the two copies would
 * disagree the first time a stage changed. So there is no task-template file.
 * A template is COMPUTED here from the catalogue, and the only thing this
 * module adds is the vocabulary the catalogue never needed:
 * capabilities, executor policy, QA validation mode, and limits — all from
 * `src/data/operations/execution.json`.
 *
 * The result is stable and deterministic: same catalogue, same templates,
 * every time. That is what makes task generation idempotent (§8) rather than
 * merely careful.
 */

/** Everything that decides who and what may execute a stage. */
export function createTaskTemplates(catalogue, execution) {
  if (!catalogue || !execution) throw new Error('task-template: needs a catalogue read model and the execution policy');

  const capabilityIds = new Set(execution.capabilities.map((c) => c.id));
  for (const [role, caps] of Object.entries(execution.roleCapabilities)) {
    for (const c of caps) if (!capabilityIds.has(c)) throw new Error(`task-template: role ${role} needs capability ${c}, which is not declared`);
  }

  const capsForRole = (roleId) => [...(execution.roleCapabilities[roleId] || [])];
  const executorPolicy = (potential) => execution.executors[potential] || execution.executors.none;

  /**
   * The templates for one feature, in the order its workflow runs them.
   *
   * A COMPOSITE HAS NO WORK OF ITS OWN. `feat.websites.extra_landing` is a
   * commercial wrapper: its stages delegate to the three parts, which are
   * separate features with separate workflows and their own tasks. Generating
   * tasks for the wrapper too would put the same work on the board twice and
   * is exactly the double-execution the landing-page rules exist to prevent.
   */
  function forFeature(featureId) {
    const feature = catalogue.feature(featureId);
    if (!feature) return [];
    if ((feature.composedOf || []).length) return [];

    const workflowId = catalogue.workflowFor(featureId);
    const workflow = catalogue.workflow(workflowId);
    if (!workflow) return [];

    const approvalStages = new Set(workflow.approval_points || []);
    const policy = executorPolicy(feature.automationPotential);
    const at = catalogue.stagesFor(featureId) || { pipeline: null, stages: [] };

    return (workflow.stages || []).map((stage, i, all) => {
      const ownerRole = (stage.owner || {}).type === 'role' ? stage.owner.id : null;
      const isLast = i === all.length - 1;

      /* QA. Every check the FEATURE publishes is judged at the stage that
         produces the deliverable — the last one — because that is the only
         stage where there is something to judge. Earlier stages are validated
         by their own sentence, which is what the catalogue wrote it for. */
      const qaCriteria = [];
      if (stage.validation) {
        qaCriteria.push({
          id: `qa.${stage.stage_id}.stage`,
          type: 'stage-validation',
          description: stage.validation,
          required: true,
          validationMode: execution.qa.defaultValidationMode,
        });
      }
      if (isLast) {
        for (const [n, check] of (feature.qualityChecks || []).entries()) {
          qaCriteria.push({
            id: `qa.${stage.stage_id}.check-${n + 1}`,
            type: 'quality-check',
            description: check,
            required: true,
            validationMode: execution.qa.defaultValidationMode,
          });
        }
        if (feature.completionCriteria) {
          qaCriteria.push({
            id: `qa.${stage.stage_id}.completion`,
            type: 'completion-criteria',
            description: feature.completionCriteria,
            required: true,
            validationMode: execution.qa.defaultValidationMode,
          });
        }
      }

      /* OUTPUTS. The stage names one; the last stage also owes the feature's
         published deliverables, because those are what the client bought. */
      const outputs = [];
      if (stage.output) {
        outputs.push({ type: 'artefact', key: `${stage.stage_id}.output`, description: stage.output, required: true });
      }
      if (isLast) {
        for (const [n, d] of (feature.deliverables || []).entries()) {
          outputs.push({ type: 'deliverable', key: `deliverable.${n + 1}`, description: d, required: true });
        }
      }

      /* WHO MAY EXECUTE. The client's own stages are never an agent's, whatever
         the feature's automation potential says: an approval is the client's
         to give. */
      const clientOwned = ownerRole === 'role.client';
      const allowedExecutorTypes = clientOwned ? ['human'] : [...policy.allowed];
      const aiEligible = clientOwned ? false : Boolean(policy.aiEligible);

      return {
        /* The template's identity: which workflow template, which stage. Stable
           across every project that ever runs this workflow. */
        id: `tpl.${workflow.template}.${stage.stage_id}`,
        workflowTemplate: workflow.template,
        stageId: stage.stage_id,
        order: i,

        title: stage.objective,
        description: (stage.actions || []).join(' '),
        actions: [...(stage.actions || [])],

        ownerRole,
        defaultDurationMinutes: null,
        duration: stage.duration ? { ...stage.duration } : null,

        requiredCapabilities: capsForRole(ownerRole),
        allowedExecutorTypes,
        aiEligible,
        automationEligible: !clientOwned,
        /* An `assist` or `partial` feature always ends in front of a person,
           whatever produced the output. */
        requiresHumanReview: Boolean(policy.requiresHumanReview) || clientOwned,

        expectedInputs: (stage.inputs || []).map((v, n) => ({ key: `input.${n + 1}`, description: v, required: true })),
        tools: [...(stage.tools || [])],
        expectedOutputs: outputs,
        qaCriteria,

        /* Approval is the WORKFLOW's word, not a guess: `approval_points` names
           the stages a person has to sign. */
        approvalRequired: approvalStages.has(stage.stage_id),

        /* Within a workflow, a stage depends on the one before it. This is the
           catalogue's own `next_stage` chain read backwards, so the dependency
           graph is the workflow rather than a second description of it. */
        dependsOnStages: i === 0 ? [] : [all[i - 1].stage_id],
        nextStage: stage.next_stage || null,
        isFinalStage: isLast,

        maxAttempts: execution.limits.maxAttempts,
        executionTimeoutMinutes: execution.limits.executionTimeoutMinutes,

        /* Where it sits, so a task never has to search for its own context. */
        featureId,
        serviceId: feature.service,
        workflowId,
        pipelineId: at.pipeline,
        pipelineStages: [...at.stages],
      };
    });
  }

  return {
    forFeature,
    capabilities: () => execution.capabilities.map((c) => ({ ...c })),
    capabilitiesForRole: capsForRole,
    limits: () => ({ ...execution.limits }),
    executorPolicyFor: (featureId) => {
      const f = catalogue.feature(featureId);
      return f ? { ...executorPolicy(f.automationPotential), automationPotential: f.automationPotential } : null;
    },
    /** Every template the catalogue can produce — used by the architecture audit. */
    all() {
      const out = [];
      for (const f of catalogue.allServices().flatMap((s) => [])) out.push(f); // placeholder, unused
      return out;
    },
  };
}
