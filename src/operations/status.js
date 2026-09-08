/**
 * STATUS — four state machines, read from data, never from a switch statement.
 *
 * `src/data/operations/statuses.json` holds the states and the moves between
 * them. This file is the only thing that moves a record from one to another,
 * and it refuses a move the data does not list.
 *
 * WHY THAT MATTERS MORE THAN IT LOOKS. The brief is emphatic that order status,
 * project status, pipeline status and workflow status are four different
 * questions. The failure mode is not that someone merges them on purpose — it
 * is that `if (order.status === 'approved') project.status = 'approved'` gets
 * written once, on a Tuesday, and after that nothing can tell you whether a
 * project is late. Keeping the machines in data and the moves in one function
 * makes that line impossible to write without noticing.
 *
 * Every transition appends to the record's own `history`, which is the whole
 * audit trail this phase needs: who, when, from what, to what.
 */

export function createStatus(statuses) {
  const machines = statuses.machines;

  const machine = (name) => {
    const m = machines[name];
    if (!m) throw new Error(`status: there is no "${name}" machine`);
    return m;
  };

  return {
    /** The state a new record of this kind starts in. */
    initial: (name) => machine(name).initial,

    states: (name) => Object.keys(machine(name).states),

    label: (name, state) => (machine(name).states[state] || {}).label || null,

    isTerminal: (name, state) => Boolean((machine(name).states[state] || {}).terminal),

    /** Is this state live work? Answers "which projects are running?" from data. */
    isActive: (name, state) => Boolean((machine(name).states[state] || {}).active),

    /** Does reaching this state freeze the commercial scope? (Orders do, at `submitted`.) */
    freezesScope: (name, state) => Boolean((machine(name).states[state] || {}).freezesScope),

    can: (name, from, to) => {
      const s = machine(name).states[from];
      return Boolean(s && (s.to || []).includes(to));
    },

    /**
     * Move a record, or explain why not. Mutates `record.status` and appends to
     * `record.history` — the record is the audit trail, so there is no second
     * place for a transition to be recorded and disagree.
     */
    transition(name, record, to, { by = 'system', reason = null, at = new Date().toISOString() } = {}) {
      const from = record.status;
      if (!machine(name).states[to]) {
        throw new Error(`status: "${to}" is not a state of ${name}`);
      }
      if (from === to) return record; // asking for what is already true is not an error
      if (!this.can(name, from, to)) {
        throw new Error(`status: ${name} cannot go from "${from}" to "${to}" — allowed: ${(machine(name).states[from].to || []).join(', ') || 'nothing, it is terminal'}`);
      }
      record.status = to;
      record.updatedAt = at;
      record.history = record.history || [];
      record.history.push({ at, by, from, to, reason });
      return record;
    },
  };
}
