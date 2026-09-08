/**
 * QA-SCHEMA — the shape a QA reader's answer must have, and the validator that
 * refuses everything else.
 *
 * MODEL OUTPUT IS UNTRUSTED EXTERNAL INPUT. That is the whole posture of this
 * file. Not "usually well-formed", not "our prompt asks for JSON" — untrusted,
 * in the same class as a form field from the internet. It is parsed, then
 * checked field by field against declared types, enums, lengths and the task's
 * own criterion ids. A response that fails any of it changes no state.
 *
 * The specific thing this prevents: a model inventing a criterion id, or
 * returning `"result": "approved"`, and a credulous reader writing that into a
 * task. The validator only accepts ids the task already declared, and `result`
 * is one of three values none of which is an approval.
 */

const RESULTS = new Set(['pass', 'fail', 'needs_human_review']);
const STATUSES = new Set(['pass', 'fail', 'unknown']);
const MAX_TEXT = 2000;
const MAX_CHECKS = 50;

const str = (v, max = MAX_TEXT) => (typeof v === 'string' ? v.slice(0, max) : null);

/**
 * Validate a model response against the task it was asked about.
 * Returns { ok, value, problems } — never throws, because a malformed answer is
 * an expected outcome rather than an exception.
 */
export function validateQaResult(raw, { allowedCriterionIds = [] } = {}) {
  const problems = [];
  const bad = (path, message) => problems.push({ path, message });

  let doc = raw;
  if (typeof raw === 'string') {
    /* Models fence JSON in prose more often than not. Take the outermost
       object and nothing else; anything around it is discarded, not obeyed. */
    const text = raw.trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return { ok: false, value: null, problems: [{ path: 'output', message: 'the response contains no JSON object' }] };
    try { doc = JSON.parse(text.slice(start, end + 1)); } catch (e) {
      return { ok: false, value: null, problems: [{ path: 'output', message: `the JSON did not parse: ${e.message}` }] };
    }
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return { ok: false, value: null, problems: [{ path: 'output', message: 'the response is not an object' }] };
  }

  if (!RESULTS.has(doc.result)) bad('result', `is ${JSON.stringify(doc.result)} — it must be one of ${[...RESULTS].join(', ')}`);

  const allowed = new Set(allowedCriterionIds);
  const checks = [];
  if (!Array.isArray(doc.checks)) bad('checks', 'must be an array');
  else if (doc.checks.length > MAX_CHECKS) bad('checks', `has ${doc.checks.length} entries — the maximum is ${MAX_CHECKS}`);
  else {
    for (const [i, c] of doc.checks.entries()) {
      if (!c || typeof c !== 'object') { bad(`checks[${i}]`, 'is not an object'); continue; }
      if (!allowed.size || !allowed.has(c.criterionId)) {
        /* THE IMPORTANT ONE. A criterion the task never declared is a criterion
           the model made up, and writing it back would let a model invent the
           thing it is being judged against. */
        bad(`checks[${i}].criterionId`, `${JSON.stringify(c.criterionId)} is not a criterion of this task`);
        continue;
      }
      if (!STATUSES.has(c.status)) { bad(`checks[${i}].status`, `is ${JSON.stringify(c.status)}`); continue; }
      checks.push({ criterionId: c.criterionId, status: c.status, evidence: str(c.evidence, 500) });
    }
  }

  const list = (v, path) => {
    if (v === undefined || v === null) return [];
    if (!Array.isArray(v)) { bad(path, 'must be an array'); return []; }
    return v.slice(0, MAX_CHECKS).map((x) => str(x, 300)).filter(Boolean);
  };
  const missing = list(doc.missing, 'missing');
  const warnings = list(doc.warnings, 'warnings');

  let confidence = null;
  if (doc.confidence !== undefined && doc.confidence !== null) {
    const n = Number(doc.confidence);
    if (!Number.isFinite(n) || n < 0 || n > 1) bad('confidence', 'must be a number between 0 and 1');
    else confidence = n;
  }

  const summary = str(doc.summary, 1000);
  if (!summary) bad('summary', 'is required — a result nobody can read is not a result');

  /* A model may not report on criteria it was not given, and a `pass` that
     skipped criteria is not a pass. */
  if (RESULTS.has(doc.result) && doc.result === 'pass' && allowed.size && checks.length < allowed.size) {
    bad('checks', `claims a pass while reporting ${checks.length} of ${allowed.size} criteria`);
  }

  if (problems.length) return { ok: false, value: null, problems };
  return {
    ok: true,
    problems: [],
    value: { result: doc.result, checks, missing, warnings, confidence, summary },
  };
}

/** The schema, as the prompt describes it to the model. One source, both uses. */
export const QA_RESULT_SCHEMA = {
  result: 'pass | fail | needs_human_review',
  checks: [{ criterionId: 'one of the ids given to you, exactly', status: 'pass | fail | unknown', evidence: 'what you saw, one sentence' }],
  missing: ['the key of anything required that is absent'],
  warnings: ['anything worth a person looking at'],
  confidence: '0 to 1',
  summary: 'one or two sentences',
};
