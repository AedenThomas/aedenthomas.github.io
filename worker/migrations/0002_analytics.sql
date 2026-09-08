-- Migration 0002 — self-hosted analytics (visitors, sessions, page views,
-- events, heat, replay index) for a database that already has `visits`.
--
--   cd worker
--   npx wrangler d1 execute aeden-visitors --remote --file=migrations/0002_analytics.sql
--
-- Additive only. If it has partially applied before (D1 stops at the first
-- ALTER that hits an existing column), delete the ALTERs that already landed
-- and re-run; the CREATEs are all IF NOT EXISTS and re-run cleanly.

ALTER TABLE visits ADD COLUMN visitor_id TEXT;
ALTER TABLE visits ADD COLUMN session_id TEXT;
ALTER TABLE visits ADD COLUMN browser TEXT;
ALTER TABLE visits ADD COLUMN os TEXT;
ALTER TABLE visits ADD COLUMN region TEXT;
ALTER TABLE visits ADD COLUMN timezone TEXT;
ALTER TABLE visits ADD COLUMN protocol TEXT;
ALTER TABLE visits ADD COLUMN lang TEXT;
ALTER TABLE visits ADD COLUMN vw INTEGER;
ALTER TABLE visits ADD COLUMN vh INTEGER;
ALTER TABLE visits ADD COLUMN sw INTEGER;
ALTER TABLE visits ADD COLUMN sh INTEGER;
ALTER TABLE visits ADD COLUMN ref_host TEXT;
CREATE INDEX IF NOT EXISTS idx_visits_vid ON visits (visitor_id);
CREATE INDEX IF NOT EXISTS idx_visits_sid ON visits (session_id);

CREATE TABLE IF NOT EXISTS visitors (
  visitor_id    TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  company       TEXT NOT NULL DEFAULT '',
  domain        TEXT,
  net           TEXT,
  country       TEXT,
  city          TEXT,
  region        TEXT,
  device        TEXT,
  browser       TEXT,
  os            TEXT,
  test          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_visitors_last ON visitors (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  session_id    TEXT PRIMARY KEY,
  visitor_id    TEXT,
  started_at    TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  landing_path  TEXT,
  exit_path     TEXT,
  referrer      TEXT,
  ref_host      TEXT,
  company       TEXT NOT NULL DEFAULT '',
  domain        TEXT,
  type          TEXT,
  asn           INTEGER,
  net           TEXT,
  country       TEXT,
  city          TEXT,
  region        TEXT,
  timezone      TEXT,
  protocol      TEXT,
  lang          TEXT,
  device        TEXT,
  browser       TEXT,
  os            TEXT,
  vw            INTEGER,
  vh            INTEGER,
  sw            INTEGER,
  sh            INTEGER,
  page_views    INTEGER NOT NULL DEFAULT 0,
  events        INTEGER NOT NULL DEFAULT 0,
  clicks        INTEGER NOT NULL DEFAULT 0,
  rage_clicks   INTEGER NOT NULL DEFAULT 0,
  dead_clicks   INTEGER NOT NULL DEFAULT 0,
  max_scroll    INTEGER NOT NULL DEFAULT 0,
  active_ms     INTEGER NOT NULL DEFAULT 0,
  visible_ms    INTEGER NOT NULL DEFAULT 0,
  hidden_ms     INTEGER NOT NULL DEFAULT 0,
  replay_chunks INTEGER NOT NULL DEFAULT 0,
  replay_bytes  INTEGER NOT NULL DEFAULT 0,
  test          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_vid     ON sessions (visitor_id);

CREATE TABLE IF NOT EXISTS page_views (
  pvid        TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  visitor_id  TEXT,
  at          TEXT NOT NULL,
  ended_at    TEXT,
  path        TEXT NOT NULL,
  title       TEXT,
  referrer    TEXT,
  ref_host    TEXT,
  device      TEXT,
  vw          INTEGER,
  vh          INTEGER,
  scroll_max  INTEGER,
  active_ms   INTEGER,
  visible_ms  INTEGER,
  hidden_ms   INTEGER,
  dur_ms      INTEGER,
  why         TEXT,
  exit_why    TEXT,
  test        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_pv_at   ON page_views (at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_sid  ON page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views (path, at);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  visitor_id  TEXT,
  pvid        TEXT,
  at          TEXT NOT NULL,
  type        TEXT NOT NULL,
  path        TEXT,
  selector    TEXT,
  text        TEXT,
  x           INTEGER,
  y           INTEGER,
  vw          INTEGER,
  vh          INTEGER,
  meta        TEXT,
  device      TEXT,
  test        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_at   ON events (at DESC);
CREATE INDEX IF NOT EXISTS idx_events_sid  ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events (type, path);

CREATE TABLE IF NOT EXISTS heat_points (
  day    TEXT NOT NULL,
  page   TEXT NOT NULL,
  device TEXT NOT NULL,
  kind   TEXT NOT NULL,
  sel    TEXT NOT NULL,
  cx     REAL NOT NULL,
  cy     REAL NOT NULL,
  n      INTEGER NOT NULL DEFAULT 0,
  w      INTEGER,
  h      INTEGER,
  PRIMARY KEY (day, page, device, kind, sel, cx, cy)
);
CREATE INDEX IF NOT EXISTS idx_heat_page ON heat_points (page, day);

CREATE TABLE IF NOT EXISTS replay_chunks (
  session_id TEXT    NOT NULL,
  seq        INTEGER NOT NULL,
  key        TEXT    NOT NULL,
  at         TEXT    NOT NULL,
  ts_from    INTEGER,
  ts_to      INTEGER,
  events     INTEGER,
  bytes      INTEGER,
  gz         INTEGER NOT NULL DEFAULT 0,
  page       TEXT,
  vw         INTEGER,
  vh         INTEGER,
  PRIMARY KEY (session_id, seq)
);
