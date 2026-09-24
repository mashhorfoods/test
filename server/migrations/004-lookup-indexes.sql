-- 004 — indexes for the two lookups the domain makes by equality that had none.
--
-- The domain now asks the store `where({ field: value })` instead of handing it
-- a predicate, so SQLite can answer from an index. Two of those lookups had
-- no index to answer from:
--
--   projects by order_id   every order-to-project conversion checks whether
--                          the order already has a project
--   tasks by assigned_to   every agent-eligibility check counts the tasks the
--                          agent is already holding
--
-- Additive only: no table changes, no data moves.

CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(order_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
