-- 002 — durable automation, events, and agent executions (Phase 4B/4C).
--
-- Phase 3 held automation's idempotency ledger in memory, which was honest for
-- a single process and useless across a restart. These tables move it onto
-- disk, so "has this rule already run for this event" survives a crash.

CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  project_id   TEXT,
  actor        TEXT,
  actor_type   TEXT,
  payload      TEXT,
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);

CREATE TABLE IF NOT EXISTS automation_executions (
  id               TEXT PRIMARY KEY,
  rule_id          TEXT NOT NULL,
  event_id         TEXT,
  -- THE WHOLE POINT OF THIS TABLE. UNIQUE means the second delivery of an
  -- event loses the insert rather than running the action again, and it loses
  -- it in the database rather than in a map that a restart forgets.
  idempotency_key  TEXT NOT NULL UNIQUE,
  status           TEXT NOT NULL,
  attempt_count    INTEGER NOT NULL DEFAULT 0,
  max_attempts     INTEGER NOT NULL DEFAULT 3,
  started_at       TEXT,
  timeout_at       TEXT,
  completed_at     TEXT,
  result           TEXT,
  error_code       TEXT,
  error_message    TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_autoexec_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_autoexec_timeout ON automation_executions(timeout_at);

CREATE TABLE IF NOT EXISTS agent_executions (
  id               TEXT PRIMARY KEY,
  agent_id         TEXT NOT NULL,
  agent_version    TEXT,
  task_id          TEXT NOT NULL,
  project_id       TEXT,
  attempt          INTEGER NOT NULL,
  status           TEXT NOT NULL,
  -- What was actually asked, of what, by which instructions. An execution you
  -- cannot reproduce is an execution you cannot investigate.
  prompt_version   TEXT,
  model            TEXT,
  provider         TEXT,
  started_at       TEXT,
  timeout_at       TEXT,
  completed_at     TEXT,
  latency_ms       INTEGER,
  input_tokens     INTEGER,
  output_tokens    INTEGER,
  result           TEXT,
  error_code       TEXT,
  error_message    TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agentexec_task ON agent_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_agentexec_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agentexec_timeout ON agent_executions(timeout_at);
