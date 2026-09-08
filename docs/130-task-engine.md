# 130 — Task engine, automation and the agent contract

**8 September 2026.** Phase 3. Phases 1 and 2 are locked infrastructure; this
attaches to them and changes none of them.

---

## 1 — The one decision that shaped everything

**A workflow-template stage is already a task template.**

`src/data/catalogue/workflows.json` gives every stage an objective, inputs,
actions, tools, an output, a validation sentence, an owning role, a duration and
the stage that follows it. That is a task template in everything but name.

So there is no task-template file. `src/operations/task-template.js` **derives**
templates from the catalogue, and `src/data/operations/execution.json` adds only
the four things the catalogue never needed:

| | |
|---|---|
| `capabilities` | the vocabulary an agent is matched against, mapped from roles |
| `executors` | who may execute, read off the feature's own `automationPotential` |
| `qa` | how a check is judged — automatic, human or hybrid |
| `limits` | retries, timeout, escalation |

The alternative — a second file describing the same work — would have been the
duplication Phase 1 spent its whole length removing.

## 2 — Task identity, and why generation is idempotent

A task's identity is **`workflowInstanceId::stageId`**. Nothing else.

```
key  win.2026-09-08.k3f9qa::brief
id   tsk.2026-09-08.k3f9qa.brief
```

Deterministic, ASCII, derived from ids and never from display text. Generating
twice computes the same key, finds the task already there, and creates nothing.
That is the property that matters when an automation rule, a retried webhook or
an agent calls it twice — which they will.

## 3 — What generates, and what does not

A **composite generates no tasks.** `feat.websites.extra_landing` is a
commercial wrapper; its parts are separate features with their own workflows.
Generating tasks for the wrapper too would put the same work on the board twice.

The complete landing page therefore executes as design → development →
deployment while remaining one $120 line, and **deployment-only generates only
the deployment**, because Phase 1 made the build an input rather than a
prerequisite feature.

## 4 — Quantity

One task per stage, carrying the quantity. Ten posts is one design task that
knows it is for ten, not ten tasks and not a boolean.

That is the least invasive reading of "quantity must survive", and it is
reversible: `taskKey()` and `taskId()` both accept a `unitIndex`, and the
generator will fan out the day a template declares it should. Fanning out now
would have been a business decision about how the studio works, which is not
this phase's to make. Page counts ride along the same way, from the order.

## 5 — Dependencies, from the data and nowhere else

Three sources, all of them already in the catalogue:

1. **Within a workflow** — the stage chain, read from `next_stage`.
2. **Across workflows** — a feature's own `requires`. Website development
   requires the design, so the first development task waits for the last design
   task.
3. **Inside a composite** — `composedOf` order. Part *n* waits for part *n−1*.

`src/operations/task-generator.js` contains no feature id, no service id and no
notion of what a landing page is. The test greps the file, comments stripped, to
prove it.

Cycles are detected and **named** — a generator that says "there is a cycle"
without saying which one is an error nobody can fix.

## 6 — The task lifecycle

```
pending → ready → assigned → in_progress → review → approved → completed
                                    ↕                  ↓
                          waiting_for_input        rejected → in_progress
                                    ↓
                                 blocked → ready
```

Eleven states in `statuses.json`, as data, alongside the four Phase 2 machines.
**`review → completed` is not a transition for any task**: everything passes
through `approved`. `approvalRequired` decides only whether a *person* must be
the one who gives it.

Nothing sets a status directly. Every move goes through `_moveTask`, which
checks the state machine, then the content guards, then writes an audit line:

- **ready** — every dependency completed
- **assigned** — an executor exists and its type is allowed
- **review** — every required output actually produced
- **approved** — QA passed; a human actor where required; **and never the
  person or agent who did the work**
- **completed** — approved, and QA still passing

## 7 — Automation

Event → rule → condition → action. Five rules, in `automation.json`, evaluated
synchronously when a domain operation records an event.

**Every action calls a domain operation by name from an allowlist.** An
automation rule cannot write to a repository, cannot set a status, and cannot
call anything outside `AUTOMATION_ALLOWED_ACTIONS` — a rule naming
`completeTask` is refused at load, which the test proves.

Three guards against the thing that goes wrong:

- **idempotency** — a rendered key per rule per subject; a repeat is a no-op and
  is itself recorded
- **maxRuns** — a cap per key
- **cascadeDepth** — an action that causes an event that fires a rule stops at
  four levels rather than spiralling

## 8 — Agents

An agent is an **executor**. Not the owner of the database, the business rules,
the pricing or the project state.

- **Default deny.** Everything an agent may do is on its `allowedOperations`.
- **A hard ceiling above that.** `AGENT_GRANTABLE` is the set of operations any
  agent may *ever* hold; `AGENT_FORBIDDEN` names what none may — approving,
  completing, cancelling, anything commercial. A registry entry naming one is
  refused at load.
- **Writes are requests.** `submitAgentOutput` submits for review. It does not
  complete, approve, or pass QA.
- **The envelope carries only the task.** No price, no client identity, no other
  task, no other project. An agent cannot leak what it was never given.
- **Output is validated.** A response is not a completed task: required outputs
  must be present, declared, of the right key, and the unit count must match
  what was bought.
- **Eligibility is checked in full** — task AI-eligible, agent active,
  capabilities matched, inputs present, dependencies done, attempts remaining,
  concurrency available, kill switch off — and every failure is reported, not
  just the first.

## 9 — Nothing here executes an agent

There is no model call, no API key and no network access in this repository. The
three registry entries ship **paused** and every one records
`"integration": "none"`.

What is built is the contract. A real integration implements
`execute(envelope) → submission` and inherits eligibility, permissions,
validation, retries, timeouts, escalation and the kill switch.

The tests drive it with `mockExecutor()`, which returns `isMock: true` and lives
beside the contract it exercises. It is not a demonstration of AI working; it is
a way to prove the guard rails hold without a network.

## 10 — Progress is derived

Task completion rolls up: tasks → workflow instance → pipeline instance →
project. Counted from the tasks themselves, so there is no second counter to
drift out of agreement with the work.

## 11 — What this phase did not touch

No catalogue value, no price, no package, no order snapshot. The test asserts
the catalogue is byte-identical after a full execution run, and that an order's
items are unchanged after its project has been driven to completion.

`AGENT_FORBIDDEN` includes every commercial operation, so an agent could not
mutate one even if a registry tried to grant it.

## 12 — Known limits

- **Prototype-grade storage**, unchanged from `docs/129` §8: JSON in this
  repository, no auth of its own beyond GitHub's, whole-file writes.
- **Automation is synchronous and in-process.** Its idempotency ledger is in
  memory; the durable record of what a rule did is the audit trail. A restart
  mid-cascade would allow a rule to run once more — acceptable because every
  action it may call is itself idempotent, and worth naming.
- **QA defaults to human judgement.** The catalogue writes checks as sentences a
  person can act on, which is the right way to write them and the wrong way to
  evaluate them by machine. Only output presence is judged automatically.
- **`executionTimeoutMinutes` is declared and not enforced** — nothing runs long
  enough to time out, because nothing runs. It is in the envelope so a real
  executor is told the limit.
- **No task fan-out by unit** (see §4), no calendar, no workload balancing.
