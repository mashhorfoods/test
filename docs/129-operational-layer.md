# 129 — The operational layer: order, CRM, project

**8 September 2026.** Phase 2. The hardened catalogue of `docs/128` is the
foundation; this is what was built on top of it, and — first — what was found
underneath.

---

## 1 — What the architecture actually is

The brief said to inspect before deciding, and not to assume. So:

| Question | Answer |
|---|---|
| Backend? | **None.** No server, no serverless function, no API of our own. |
| Database? | **None.** Zero runtime dependencies; `devDependencies` are axe-core, ffmpeg-static and playwright-core. |
| How does a visitor reach us? | A `wa.me` deep link, or a form whose `action` is a real `mailto:`. **Nothing POSTs anywhere.** |
| Is there an admin? | Yes — `admin.html` at the repository root. It is **not** in `site.config.json`, is never built into `dist/`, and `qa.js` §33 fails the build if it ever reaches the live host. |
| How does the admin save? | `api.github.com`, Contents API, with a token the operator pastes into the page. It reads a file, edits it in memory, and PUTs it back with the file's `sha` so a concurrent edit is refused rather than overwritten. |
| Where does the data live, then? | **In this git repository.** That is the store. |

That last line is the finding the whole phase is built on. There is no
localStorage CRM here and there is not going to be one: the token lives in
`sessionStorage` and the *data* lives in commits.

**So operational records are JSON files in `operations/`, written through the
mechanism that already writes prices.** Git gives the audit trail, a pull
request gives the review step, and nothing new has to be run, hosted or paid
for. This is a real store with real history. It is also, honestly, a store for
an agency with one operator — see §8.

---

## 2 — What was built

```
src/operations/
  catalogue-read.js   the ONE door to the catalogue — asks, never copies
  ids.js              ord.2026-09-08.k3f9qa — readable, sortable, no sequence
  status.js           four state machines, moved only from here
  events.js           the names, and a record on each entity. Not a bus.
  repository.js       get/put/all/find — memory and JSON-file adapters
  client.js           who asked. Deterministic matching, review over merge.
  order.js            what they selected, frozen. Validation. Amendment.
  project.js          how it will be done. Pipeline and workflow instances.
  index.js            the domain API — eleven operations, one implementation

src/data/operations/statuses.json   the state machines, as data
operations/{clients,orders,projects}.json   the records
tools/ops.mjs                       the operator's command line
tools/operations-test.mjs           209 assertions, scenarios A–O plus §40
src/scripts/admin-operations.js     read-only Clients / Orders / Projects
```

## 3 — The one rule the layer is built to keep

**The operational layer holds no copy of the business.**

Not a service list, not a price, not a `service -> pipeline` map, not a page
allowance. When the order validator wants to know whether something is valid, it
asks `catalogue-read.js`, and `catalogue-read.js` looks it up in
`catalogue.json`.

The test enforces this literally: `operations-test.mjs` reads every file in
`src/operations/`, strips the comments, and fails if any of them contains a
catalogue id (`'svc.…'`, `'feat.…'`, `'pipe.…'`, `'wf.…'`) or a number that
could be a price. There is nowhere in the domain that a mapping could be
written without the suite going red.

## 4 — Snapshot, and why an order is not a query

A catalogue answers *what does a Business Website cost* — present tense. An
order answers *what did this client agree to pay in September* — past tense,
forever, including after the catalogue says 800.

So every order line carries two things that must never be confused:

```json
{ "featureId": "feat.websites.development",
  "quantity": 1,
  "catalogueRef":    { "serviceId": "svc.websites",
                       "workflowId": "wf.build::feat.websites.development",
                       "pipelineId": "pipe.websites" },
  "pricingSnapshot": { "type": "fixed", "billing": "once",
                       "unitAmount": 520, "amount": 520, "currency": "USD" } }
```

`catalogueRef` traces **forward** — what does this mean today. `pricingSnapshot`
is the **frozen** number, copied once and never refreshed. Nothing in the
codebase re-reads a price into an existing order, and the test proves it by
moving the catalogue price to 999 under a live order and re-reading it.

The order also records `catalogueSnapshot.version`, so a reader in two years
knows which edition of the price list produced the numbers.

An order that reaches `submitted` is a commercial fact. Changing one goes
through `amendOrder()`, which copies the previous items and totals into
`amendments[]` **before** touching anything and refuses without a reason. What
was originally agreed survives every later edit.

## 5 — Template and instance

The distinction the phase turns on:

| | Catalogue | Project |
|---|---|---|
| holds | `pipe.websites`: six stages, objectives, owners | *this client, stage three, blocked on their logo* |
| describes | every website Pixora will ever build | one build |
| changes when | the business changes | the work moves |

A pipeline **instance** references `pipe.websites` and copies its stage list at
creation time — so a stage added to the catalogue tomorrow does not appear
halfway through a build already under way — and holds status, timestamps and
which workflow instances run where. A workflow **instance** references the
workflow id and holds the quantity, tier, origin and `partOf` that came from the
*order*, not from the catalogue.

Updating progress never writes to `catalogue/`. The test asserts the template is
byte-identical after a workflow instance has been moved.

## 6 — Idempotency

`convertOrderToProject()` is the operation an automation, a retried webhook or an
agent will call twice. The lock is the relationship itself:

- the order names its project (`order.projectId`)
- the project names its order (`project.orderId`)
- before anything is created, both are checked

A second call returns the existing project and says so. A third does the same.
An order that names a project which does not exist **throws** rather than
quietly making a second one — a broken link is not a licence.

Only an `approved` order converts. A draft or a rejected one is refused, and the
test checks that no project exists afterwards.

## 7 — API-ready, not an API

Every domain operation is shaped as though it were already an endpoint: named
arguments in, `{ok:true, …}` or `{ok:false, problems:[…]}` out, no DOM, no `fs`,
no globals, everything injected. `createOrder`, `submitOrder`, `approveOrder`,
`rejectOrder`, `convertOrderToProject`, `getProject`, `getProjectPipelines` and
the rest exist once. The command line calls them. The admin screens read what
they wrote. An HTTP handler would call the same functions, and so would an
agent.

Storage is behind four methods — `get`, `put`, `all`, `find` — so moving from
JSON files to an API or a database is a decision made once, at the edge, rather
than a hundred times through the UI.

## 8 — What this is not

**This is a prototype-grade store, and it is important not to claim otherwise.**

- There is no authentication on the operational data beyond GitHub's own: anyone
  who can read the repository can read every order.
- There is no encryption at rest beyond GitHub's.
- Whole-file writes are correct for an agency with one operator and wrong for
  anything concurrent.
- No payment, tax, discount, currency conversion, invoicing or accounting logic
  exists. `discount` is present in the shape and is always zero, because the
  published packages *are* the discount and this layer does not invent a second
  one.
- Client records deliberately hold **no** password, payment detail, address or
  identity document. The public site asks for none of those, so neither does
  this: the safest store for sensitive data is the one that does not hold it.

Moving to a real backend means writing one repository adapter and an auth layer.
It does not mean rewriting the domain.

## 9 — Why orders are not typed into a form

The admin dashboard writes prices, because a price is a sentence and the operator
is its author. An order is not a sentence — it is a record whose entire value is
that it was validated against the catalogue before it existed. A form would route
around `validateOrder()`, which is the only place those rules are.

So the operational screens are **read-only**, and writing goes through
`node tools/ops.mjs`, which calls the domain layer. When a backend arrives the
same screens gain their buttons by pointing at the same functions over HTTP.

## 10 — The flow, end to end

```
visitor builds a scope on /pricing
   └─ builder writes #build-order  (deterministic JSON, ids not labels)
        └─ they send it — WhatsApp or email, unchanged
             └─ operator: ops.mjs order create --payload …   → validated, draft
                  ├─ ops.mjs client add / resolve            → CRM record
                  ├─ ops.mjs order submit                    → scope frozen
                  ├─ ops.mjs order approve
                  └─ ops.mjs order convert                   → project (idempotent)
                       ├─ one pipeline instance per service   (catalogue lookup)
                       └─ one workflow instance per feature   (catalogue lookup)
                            └─ carries quantity, tier, origin, partOf, allowance
```

Everything after `convert` — tasks, automation, agents — is the next phase, and
the workflow instances are the place it attaches.
