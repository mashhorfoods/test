-- 001 — the operational schema.
--
-- ONE TABLE PER ENTITY, EACH HOLDING THE DOMAIN'S OWN DOCUMENT.
-- The domain treats a record as an opaque object with an id; the repository
-- contract is four methods. So the row is `id` plus the document, with the few
-- fields queries actually need lifted into real columns and indexed. That keeps
-- the schema honest about what it can search on without splitting the domain
-- model across twenty tables that would then have to be reassembled — and
-- reassembly is where a model quietly changes shape.
--
-- Nothing here is a second copy of the catalogue. Commercial truth stays in
-- pricing.json and catalogue.json; these tables hold what happened.

CREATE TABLE IF NOT EXISTS clients (
  id           TEXT PRIMARY KEY,
  email        TEXT,
  phone        TEXT,
  doc          TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY,
  client_id    TEXT,
  project_id   TEXT,
  status       TEXT NOT NULL,
  doc          TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS projects (
  id           TEXT PRIMARY KEY,
  client_id    TEXT,
  order_id     TEXT,
  status       TEXT NOT NULL,
  doc          TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_order ON projects(order_id);

CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  -- `key` is workflowInstanceId::stageId. UNIQUE is what makes duplicate task
  -- generation impossible at the storage layer as well as in the generator —
  -- two guarantees for the property Phase 3 cares about most.
  task_key     TEXT NOT NULL UNIQUE,
  project_id   TEXT NOT NULL,
  client_id    TEXT,
  status       TEXT NOT NULL,
  assigned_to  TEXT,
  doc          TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);

CREATE TABLE IF NOT EXISTS audit (
  id           TEXT PRIMARY KEY,
  project_id   TEXT,
  entity_id    TEXT,
  entity_type  TEXT,
  actor_type   TEXT,
  action       TEXT,
  doc          TEXT NOT NULL,
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit(entity_id);

-- --- people and sessions ----------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  -- Set when the user is a client rather than staff. It is the scope of
  -- everything they may see, enforced on every request.
  client_id     TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  -- The token is stored HASHED. A stolen database does not hand over live
  -- sessions, for the same reason it does not hand over passwords.
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT,
  user_agent  TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
