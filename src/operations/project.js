/**
 * PROJECT — how the purchased work will actually be done.
 *
 * TEMPLATE AND INSTANCE, AND WHY THE DISTINCTION IS THE WHOLE FILE.
 * The catalogue holds `pipe.websites`: six stages, in order, with objectives
 * and owners. That is a TEMPLATE — it describes every website Pixora will ever
 * build. A project holds a pipeline INSTANCE: this client, this order, stage
 * three, started Tuesday, blocked on their logo.
 *
 * The instance points at the template and copies almost nothing from it. It
 * records progress; the template records intent. Updating progress must never
 * write to the catalogue, and reading intent must never depend on a project.
 *
 * WHAT AN INSTANCE DOES COPY, and why it is not a contradiction: the template
 * id, the stage ids, and the workflow ids — references, all of them — plus the
 * ORDER's quantities and origins, which came from the order snapshot and not
 * from the catalogue at all. If the catalogue's stage list changes tomorrow, a
 * running project keeps the stages it was created with, because a stage that
 * appears halfway through a build is not something anyone agreed to.
 *
 * SERVICE -> PIPELINE is asked of the catalogue, every time. There is no map in
 * this file, and there is deliberately nowhere one could be written.
 */

import { newId } from './ids.js';
import { EVENTS, record } from './events.js';
import { effectiveScope } from './order.js';

/**
 * Build a project from an approved order.
 *
 * IDEMPOTENT. The relationship `order.projectId <-> project.orderId` is the
 * lock: if the order already names a project, that project is returned and
 * nothing is created. This matters more than it looks, because the callers
 * this is being built for — an automation, an agent, a retried webhook — are
 * exactly the callers that run things twice.
 */
export function convertOrderToProject(order, {
  catalogue,
  projects,
  status,
  now = () => new Date(),
  random = Math.random,
  by = 'operator',
  name = null,
} = {}) {
  if (!catalogue) throw new Error('project: a catalogue read model is required');
  if (!projects) throw new Error('project: a projects store is required');
  if (!status) throw new Error('project: a status machine is required');

  /* --- idempotency, first, before anything is created --------------------- */
  if (order.projectId) {
    const existing = projects.get(order.projectId);
    if (existing) return { project: existing, created: false, reason: 'this order already has a project' };
    /* The order names a project nobody has. That is a broken link, not a
       licence to make a second one silently. */
    throw new Error(`project: order ${order.id} names project ${order.projectId}, which does not exist`);
  }
  const already = projects.find((p) => p.orderId === order.id)[0];
  if (already) return { project: already, created: false, reason: 'a project already references this order' };

  /* --- only an approved order becomes work -------------------------------- */
  if (order.status !== 'approved') {
    throw new Error(`project: order ${order.id} is "${order.status}" — only an approved order becomes a project`);
  }

  const at = now().toISOString();
  const scope = effectiveScope(order);

  /* --- one pipeline instance per service in the order --------------------- */
  const services = [...new Set(scope.map((s) => s.serviceId))].sort();
  const pipelines = services.map((serviceId) => {
    const pipelineId = catalogue.pipelineFor(serviceId);
    if (!pipelineId) throw new Error(`project: service ${serviceId} has no pipeline in the catalogue`);

    const template = catalogue.pipelineStages(serviceId);
    const mine = scope.filter((s) => s.serviceId === serviceId);

    /* --- one workflow instance per purchased feature ---------------------- */
    const workflows = mine.map((item) => {
      const workflowId = catalogue.workflowFor(item.featureId);
      const where = catalogue.stagesFor(item.featureId);
      return {
        id: newId('workflowInstance', { now, random }),
        featureId: item.featureId,
        /* THE REFERENCE, not a copy. What should happen lives in the
           catalogue; this records what is happening. */
        workflowRef: {
          workflowId,
          catalogueVersion: catalogue.version,
          pipelineId: (where || {}).pipeline || null,
          stages: (where || {}).stages || [],
        },
        /* Carried from the ORDER, not re-read from the catalogue: these are
           facts about what was bought. */
        quantity: item.quantity,
        origin: item.origin,
        tier: item.tier,
        options: item.options,
        partOf: item.partOf,
        addonGroup: item.addonGroup,
        /* Answered by the catalogue at creation so a board can show it without
           every consumer having to join back. Refreshable, never authoritative. */
        expected: {
          duration: catalogue.durationOf(item.featureId),
          humanApprovalRequired: catalogue.needsHumanApproval(item.featureId),
        },
        status: status.initial('workflowInstance'),
        startedAt: null,
        completedAt: null,
        history: [],
        events: [],
      };
    });

    /* Stages carried from the template AT CREATION TIME. A stage added to the
       catalogue tomorrow does not appear inside a build already under way. */
    const stages = template.map((st) => ({
      stageId: st.id,
      kind: st.kind,
      /* Which of this project's workflows run here. A composite spans several
         stages and appears in each — that is the template's own shape. */
      workflowInstanceIds: workflows
        .filter((w) => (w.workflowRef.stages || []).includes(st.id))
        .map((w) => w.id),
      status: status.initial('pipelineInstance'),
      startedAt: null,
      completedAt: null,
    }));

    return {
      id: newId('pipelineInstance', { now, random }),
      serviceId,
      /* THE TEMPLATE THIS INSTANCE FOLLOWS. Resolved from the catalogue, never
         from a mapping in this file. */
      pipelineRef: { pipelineId, catalogueVersion: catalogue.version },
      currentStageId: stages.length ? stages[0].stageId : null,
      stages,
      workflows,
      status: status.initial('pipelineInstance'),
      startedAt: null,
      completedAt: null,
      history: [],
      events: [],
    };
  });

  const project = {
    id: newId('project', { now, random }),
    orderId: order.id,
    clientId: order.clientId,
    name: name || defaultProjectName(order, catalogue),

    services,
    pipelines,

    /* Carried from the order so the project can answer "how many pages?"
       without recomputing a rule from a catalogue that may have moved. */
    limits: structuredClone(order.scope.limits || {}),

    status: status.initial('project'),
    createdAt: at,
    updatedAt: at,
    history: [],
    events: [],
  };

  record(project, EVENTS.PROJECT_CREATED, { at, by, data: { orderId: order.id, clientId: order.clientId } });
  for (const p of project.pipelines) {
    record(p, EVENTS.PIPELINE_STARTED, { at, by, data: { pipelineId: p.pipelineRef.pipelineId, created: true } });
  }

  projects.put(project);
  return { project, created: true };
}

/** "Websites + Branding & Design for Al Mada" — a name a person recognises. */
function defaultProjectName(order, catalogue) {
  const names = [...new Set((order.items || []).map((i) => i.catalogueRef.serviceId))]
    .map((id) => (catalogue.nameOf(id) || {}).en)
    .filter(Boolean);
  return names.length ? names.join(' + ') : `Order ${order.id}`;
}

/* ---------- reading a project ---------------------------------------------- */

/** Every workflow instance in the project, across every pipeline. */
export const allWorkflows = (project) => project.pipelines.flatMap((p) => p.workflows);

/** The workflow instance for a feature, or null. */
export const workflowFor = (project, featureId) =>
  allWorkflows(project).find((w) => w.featureId === featureId) || null;

/** The pipeline instance for a service, or null. */
export const pipelineFor = (project, serviceId) =>
  project.pipelines.find((p) => p.serviceId === serviceId) || null;

/**
 * How far along, counted rather than estimated. Returns completed/total for
 * workflows and stages so a board can render a bar without inventing a number.
 */
export function progress(project, status) {
  const workflows = allWorkflows(project);
  const stages = project.pipelines.flatMap((p) => p.stages);
  const done = (list) => list.filter((x) => x.status === 'completed').length;
  return {
    workflows: { completed: done(workflows), total: workflows.length },
    stages: { completed: done(stages), total: stages.length },
    pipelines: { completed: done(project.pipelines), total: project.pipelines.length },
    active: status.isActive('project', project.status),
  };
}

/** What the catalogue says should happen next in this pipeline instance. */
export function nextStage(project, serviceId) {
  const p = pipelineFor(project, serviceId);
  if (!p) return null;
  return p.stages.find((s) => s.status !== 'completed') || null;
}

/* ---------- moving a project ------------------------------------------------ */

/** Move a workflow instance. Only the instance changes; the template is untouched. */
export function setWorkflowStatus(project, workflowInstanceId, to, status, { by = 'operator', at = new Date().toISOString(), reason = null } = {}) {
  const w = allWorkflows(project).find((x) => x.id === workflowInstanceId);
  if (!w) throw new Error(`project: no workflow instance ${workflowInstanceId}`);
  status.transition('workflowInstance', w, to, { by, at, reason });
  if (to === 'in_progress' && !w.startedAt) { w.startedAt = at; record(w, EVENTS.WORKFLOW_STARTED, { at, by }); }
  if (to === 'completed') { w.completedAt = at; record(w, EVENTS.WORKFLOW_COMPLETED, { at, by }); }
  project.updatedAt = at;
  return w;
}

/** Move a pipeline instance. */
export function setPipelineStatus(project, pipelineInstanceId, to, status, { by = 'operator', at = new Date().toISOString(), reason = null } = {}) {
  const p = project.pipelines.find((x) => x.id === pipelineInstanceId);
  if (!p) throw new Error(`project: no pipeline instance ${pipelineInstanceId}`);
  status.transition('pipelineInstance', p, to, { by, at, reason });
  if (to === 'in_progress' && !p.startedAt) p.startedAt = at;
  if (to === 'completed') { p.completedAt = at; record(p, EVENTS.PIPELINE_COMPLETED, { at, by }); }
  project.updatedAt = at;
  return p;
}

/** Move the project itself. Kept separate from every layer beneath it. */
export function setProjectStatus(project, to, status, { by = 'operator', at = new Date().toISOString(), reason = null } = {}) {
  status.transition('project', project, to, { by, at, reason });
  if (to === 'in_progress') record(project, EVENTS.PROJECT_STARTED, { at, by });
  if (to === 'completed') record(project, EVENTS.PROJECT_COMPLETED, { at, by });
  return project;
}
