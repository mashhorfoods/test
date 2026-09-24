/* §38 Nothing internal reaches a visitor -----------------------------

   The service catalogue behind the builder carries a great deal a visitor
   must never meet: workflow ids, pipeline stages, execution steps, tool
   lists, quality checks, effort estimates, automation ratings, internal
   status. The brief is unambiguous — "do not expose workflow IDs,
   automation logic, internal statuses, technical schemas, agent
   terminology, or internal operational complexity to visitors."

   tools/build-catalogue.js keeps that promise by ALLOWLIST: a field reaches
   the public projection only by being named, so adding one upstream cannot
   publish it by accident. This checks the promise was actually kept, in the
   bytes that ship, because an allowlist is a mechanism and a mechanism can
   be edited.

   Feature ids themselves DO ship, on `data-feature`. That is deliberate and
   is not what the rule is about: an id is the join a CRM, a quotation or an
   agent needs, it is invisible on the page, and it says nothing about how
   the work is done. Workflow ids say how. */

module.exports = async function check({ fs, path, DIST, PAGES, fail }) {
  {
    const FORBIDDEN = [
      ['wf.', 'a workflow id'],
      ['pipe.', 'a pipeline id'],
      ['automationPotential', 'an automation rating'],
      ['executionSteps', 'execution steps'],
      ['qualityChecks', 'quality checks'],
      ['completionCriteria', 'completion criteria'],
      ['humanApprovalRequired', 'an approval flag'],
      ['estimatedEffort', 'an effort estimate'],
      ['revisionRules', 'internal revision rules'],
      ['workflowOverrides', 'a workflow override'],
    ];
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(DIST, page), 'utf8');
      for (const [token, what] of FORBIDDEN) {
        if (html.includes(token)) {
          fail('HIGH', 'builder', `${page} ships ${what} ("${token}") — internal catalogue data reached a visitor`);
        }
      }
    }
  }
};
