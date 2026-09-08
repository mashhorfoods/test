# 132 — Deploying the Pixora API

*Written during Phase 4D. Everything here is verified by `npm run 4d:test`
unless a line says otherwise; the lines that say otherwise are the ones an
operator has to do by hand, and they are marked OWNER.*

---

## 1. What is being deployed

One Node process, no framework, no runtime dependencies, one SQLite file.

    a browser or an operator's tool
              │  HTTPS
              ▼
        reverse proxy (nginx / Caddy / a load balancer)   ← TLS terminates HERE
              │  HTTP, on loopback
              ▼
        node server/index.js        ← this repository
              │
              ├── SQLite file on a mounted volume
              └── HTTPS to the AI provider, outbound, server-side only

The application does **not** terminate TLS and is not intended to. A custom
TLS stack would be a second thing to keep patched and a second place for a
cipher decision to rot, and every host worth deploying on already has one that
is better maintained. What the application does instead is be safe to put
behind one: it binds loopback by default, it sets `no-store`, `DENY`,
`nosniff` and `no-referrer` on every response, it uses a bearer token rather
than a cookie (so there is no cookie flag to get wrong), and it will not
believe an `X-Forwarded-For` header until you tell it how many proxies you
control.

---

## 2. TLS and the proxy — the checklist

- [ ] **OWNER** TLS terminates at the proxy, with a certificate that renews
      automatically. HTTP redirects to HTTPS; the application is never reachable
      on plain HTTP from outside.
- [ ] **OWNER** HSTS is set by the proxy (`Strict-Transport-Security`), not by
      the application — it is a property of the origin, and the application does
      not know its own hostname.
- [ ] `PIXORA_HOST=127.0.0.1`, so the only route in is through the proxy.
      If you must bind a wider interface, `PIXORA_ALLOWED_ORIGINS` becomes
      mandatory and the server refuses to start without it.
- [ ] `PIXORA_TRUST_PROXY_HOPS` is the number of proxies **you control**,
      counted from the application outwards. One nginx in front: `1`. nginx
      behind a cloud load balancer: `2`. No proxy at all: `0`, and the header is
      ignored entirely.
      Getting this wrong in the generous direction is not cosmetic: it lets a
      caller forge their own address and walk around the per-IP login throttle.
      `server/client-ip.js` reads the *n*-th entry from the right, so anything
      the client forged sits to the left of it and is never read.
- [ ] The proxy sets `X-Forwarded-For` by appending, which is the default in
      nginx's `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
      and in every managed load balancer.
- [ ] **OWNER** The proxy does not cache API responses. The application says
      `Cache-Control: no-store` on every reply; a proxy that overrides it is
      caching other people's orders.

There are no cookies, so there is no `Secure`, `HttpOnly` or `SameSite` flag to
set. The session token is returned once in a JSON body and presented as
`Authorization: Bearer`. Callers must store it somewhere a page cannot read
cross-origin; that is a property of the caller, not of this server.

---

## 3. Configuration

Every variable, what it is for, and how it is classified, is in
`server/env.example`. The classification is:

| Class | Meaning |
|---|---|
| REQUIRED | The server will not run correctly in production without it. |
| OPTIONAL | Has a production-safe default. |
| SECRET | Comes from a secret store at boot. Never in a file in this repository, never in the image, never in a log. |
| STAGING ONLY | Legitimate on staging, refused or pointless in production. |
| DEV ONLY | For a laptop. |

`assertProductionSecrets()` runs at boot and **refuses to start** a production
server that is holding:

- AI enabled with no `ANTHROPIC_API_KEY`,
- a wide bind with no allowed origins,
- a `PIXORA_BOOTSTRAP_PASSWORD` still set,
- login rate limiting switched off,
- `PIXORA_AI_PROVIDER=fixture`.

That list is the whole "did we leave a development default on" question, asked
by the machine at boot rather than by a person during an incident.

---

## 4. First boot

1. **OWNER** Create the volume and point `PIXORA_DB` at it. In production set
   `PIXORA_DB_CREATE=0`: a database that does not exist should stop the boot,
   because the alternative is an empty system quietly serving an empty order
   book three days after the volume failed to mount.
2. Start once with `PIXORA_ENV=staging`, `PIXORA_BOOTSTRAP_EMAIL` and
   `PIXORA_BOOTSTRAP_PASSWORD` set. The first administrator is seeded, once,
   on an empty database.
3. **OWNER** Sign in, change that password, then remove both variables and
   restart into `PIXORA_ENV=production`. The server will refuse to start with
   the bootstrap password still present, which is the point.
4. Migrations run automatically, forward-only, each in a transaction, each
   recorded with a checksum. A migration edited after it was applied stops the
   boot rather than leaving two deployments with different tables.

---

## 5. Turning the AI on

Both switches are off in every default, and either one alone is enough to stop
an execution:

    PIXORA_AI_ENABLED=1              # the deployment-wide switch
    AI_AGENT_QA_READER_ENABLED=1     # the per-agent flag
    ANTHROPIC_API_KEY=...            # from the secret store

Plus the registry status: `agent.qa-reader` ships `paused`, and an operator
turns it `active` through `POST /agents/:id/status`. Three independent things
must be true before a model is called, and any one of them is a stop.

The incident control is `POST /agents/kill-switch {"on": true}`. It refuses new
executions immediately, records the refusal, and leaves every task exactly
where it was so a person can carry on by hand. Test it before you need it.

---

## 6. Backups and restart

- The database is one file plus its WAL. Back up with SQLite's own backup or
  by stopping the process and copying both; `synchronous=FULL` means an
  acknowledged write is on disk, so a crash loses nothing that was confirmed.
- On restart the sweeper recovers anything left `running` past its timeout —
  a crashed process and a slow action look identical from outside and get the
  same answer. Nothing is left running forever.
- Re-delivering the same events after a restart runs nothing twice: the
  `UNIQUE(idempotency_key)` constraint is the whole concurrency control.

---

## 7. What this deployment is not

One machine. SQLite with WAL, one writer, an in-process sweeper. That is the
right size for an agency's order book and it is stated here so nobody discovers
it later: horizontal scaling would need the ledger and the sweeper to move to
something that coordinates across processes, and that is a future phase, not a
configuration flag.

---

## 8. Operational endpoints

| Call | For |
|---|---|
| `GET /health` | Liveness, plus the redacted configuration: environment, model, whether a key is configured — never the key. |
| `GET /automation/executions?status=running` | What automation thinks is in flight. |
| `POST /automation/recover` | Force a sweep rather than waiting for the interval. |
| `GET /agent-executions?taskId=…` | Every model call for a task: model, prompt version, latency, tokens, outcome. |
| `POST /agents/kill-switch` | Stop all AI now. |

`GET /health` is deliberately answerable without a session, and deliberately
says nothing a stranger can use: no counts, no ids, no key.
