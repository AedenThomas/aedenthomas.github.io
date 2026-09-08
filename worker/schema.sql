-- ============================================================================
-- aeden-visitors — full schema for a FRESH database.
--
--   npx wrangler d1 execute aeden-visitors --remote --file=schema.sql
--
-- Every CREATE is IF NOT EXISTS, so re-running this against a live database
-- adds only what is missing. The one thing it cannot do is add columns to a
-- table that already exists — see the MIGRATION section at the bottom and
-- migrations/0002_analytics.sql for the already-deployed database.
-- ============================================================================

-- ---------------------------------------------------------------- visits ---
-- One row per employer lookup (/api/visitor). Since the analytics work this is
-- every hit, not one per company per day: the daily dedupe now lives only in
-- front of the webhook alert.
CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  seen_at    TEXT    NOT NULL,
  -- Empty string for a generic (non-employer) visit, never NULL — keeps the
  -- column usable in the idx_visits_co index and simple to query either way.
  company    TEXT    NOT NULL DEFAULT '',
  domain     TEXT,
  type       TEXT,
  asn        INTEGER,
  -- /24 only, never the full address: enough to group an office, not enough to
  -- single out a person.
  net        TEXT,
  country    TEXT,
  city       TEXT,
  -- Cloudflare hands these over free on request.cf, so every row written from
  -- here on pins exactly on the map. Rows older than these columns fall back
  -- to a city lookup table in the dashboard.
  lat        REAL,
  lon        REAL,
  path       TEXT,
  referrer   TEXT,
  -- "mobile" | "tablet" | "desktop", parsed from the User-Agent header.
  device     TEXT,
  -- 1 when this row is a decided employer sighting (company/domain/type/asn
  -- populated); 0 for a generic visit that was looked up but not shown.
  shown      INTEGER NOT NULL DEFAULT 0,
  -- Only set when shown = 0: why decide() suppressed it (see decide() in
  -- src/index.js), e.g. "type:isp", "datacenter-or-vpn", "no-data".
  reason     TEXT,
  test       INTEGER NOT NULL DEFAULT 0,
  -- ---- added by the analytics work ----
  -- The first-party aeden_vid cookie (32 hex) and the client-derived session
  -- (30-minute inactivity timeout). Both nullable: rows written before this
  -- existed, and lookups from clients with cookies blocked, have neither.
  visitor_id TEXT,
  session_id TEXT,
  browser    TEXT,     -- "Chrome 128", "Safari 17", "LinkedIn app"
  os         TEXT,     -- "macOS", "iOS 17", "Android 14"
  region     TEXT,     -- request.cf.region, e.g. "England"
  timezone   TEXT,     -- request.cf.timezone, e.g. "Europe/London"
  protocol   TEXT,     -- request.cf.httpProtocol, e.g. "HTTP/2"
  lang       TEXT,     -- first Accept-Language tag, e.g. "en-GB"
  vw         INTEGER,  -- viewport, from the client
  vh         INTEGER,
  sw         INTEGER,  -- screen, from the client
  sh         INTEGER,
  ref_host   TEXT      -- host of the referrer, e.g. "linkedin.com"
);
CREATE INDEX IF NOT EXISTS idx_visits_seen ON visits (seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_co   ON visits (company);
CREATE INDEX IF NOT EXISTS idx_visits_vid  ON visits (visitor_id);
CREATE INDEX IF NOT EXISTS idx_visits_sid  ON visits (session_id);

-- -------------------------------------------------------------- visitors ---
-- One row per aeden_vid cookie. Identity plus the latest dimensions; counts
-- are derived from sessions / page_views / visits at read time so nothing
-- here can drift.
CREATE TABLE IF NOT EXISTS visitors (
  visitor_id    TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  -- Sticky: once an employer has been resolved for this visitor it stays,
  -- even if later hits come from a home connection.
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

-- -------------------------------------------------------------- sessions ---
-- One row per client session id. Written from two directions: the tracker's
-- /collect batches (engagement tallies, device, viewport) and the employer
-- lookup (company/domain/type/asn). Each side only overwrites its own
-- columns, so whichever arrives first, the row ends up complete.
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
  -- Running tallies, incremented per batch.
  page_views    INTEGER NOT NULL DEFAULT 0,
  events        INTEGER NOT NULL DEFAULT 0,
  clicks        INTEGER NOT NULL DEFAULT 0,
  rage_clicks   INTEGER NOT NULL DEFAULT 0,
  dead_clicks   INTEGER NOT NULL DEFAULT 0,
  max_scroll    INTEGER NOT NULL DEFAULT 0,   -- percent, deepest of any page
  active_ms     INTEGER NOT NULL DEFAULT 0,   -- interacting
  visible_ms    INTEGER NOT NULL DEFAULT 0,   -- tab in the foreground
  hidden_ms     INTEGER NOT NULL DEFAULT 0,   -- tab in the background
  replay_chunks INTEGER NOT NULL DEFAULT 0,   -- objects in R2 for this session
  replay_bytes  INTEGER NOT NULL DEFAULT 0,
  test          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_vid     ON sessions (visitor_id);

-- ------------------------------------------------------------ page_views ---
-- One row per page view, keyed on a client id so the page-end event that
-- arrives later (scroll depth, time on page) lands on the same row.
CREATE TABLE IF NOT EXISTS page_views (
  pvid        TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  visitor_id  TEXT,
  at          TEXT NOT NULL,
  ended_at    TEXT,
  path        TEXT NOT NULL,   -- HashRouter route, "/blog/x" not "/#/blog/x"
  title       TEXT,
  referrer    TEXT,            -- document.referrer, only on the landing view
  ref_host    TEXT,
  device      TEXT,
  vw          INTEGER,
  vh          INTEGER,
  scroll_max  INTEGER,         -- percent of the document reached
  active_ms   INTEGER,
  visible_ms  INTEGER,
  hidden_ms   INTEGER,
  dur_ms      INTEGER,
  why         TEXT,            -- load | route | hash | pop | resume | bfcache
  exit_why    TEXT,            -- nav | hide | timeout
  test        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_pv_at   ON page_views (at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_sid  ON page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views (path, at);

-- ---------------------------------------------------------------- events ---
-- click | rage_click | dead_click | copy | outbound | download | visibility |
-- page_end | custom. `selector` is structural (tag:nth-of-type, ids as
-- shortcuts, no class names) so the dashboard can find the element again.
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  visitor_id  TEXT,
  pvid        TEXT,
  at          TEXT NOT NULL,
  type        TEXT NOT NULL,
  path        TEXT,
  selector    TEXT,
  text        TEXT,            -- element text, first 80 chars
  x           INTEGER,         -- client coordinates at the time, for context
  y           INTEGER,
  vw          INTEGER,
  vh          INTEGER,
  meta        TEXT,            -- JSON: href, copied text, visibility state…
  device      TEXT,
  test        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_at   ON events (at DESC);
CREATE INDEX IF NOT EXISTS idx_events_sid  ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events (type, path);

-- ----------------------------------------------------------- heat_points ---
-- Pre-aggregated: one row per (day, page, device, kind, element, 1% cell),
-- with `n` counting hits. The tracker rolls raw positions up into these cells
-- before they leave the browser, so a 2-minute mouse trail is a few hundred
-- upserts rather than 1,200 inserts, and the table's size is bounded by the
-- page's geometry rather than by traffic.
CREATE TABLE IF NOT EXISTS heat_points (
  day    TEXT NOT NULL,        -- YYYY-MM-DD (UTC)
  page   TEXT NOT NULL,
  device TEXT NOT NULL,        -- mobile | tablet | desktop
  kind   TEXT NOT NULL,        -- c (click) | m (mouse move)
  sel    TEXT NOT NULL,        -- structural selector of the anchor element
  cx     REAL NOT NULL,        -- 0..1 across the anchor's box, 2 dp
  cy     REAL NOT NULL,
  n      INTEGER NOT NULL DEFAULT 0,
  w      INTEGER,              -- anchor box size when last seen, for fallback rendering
  h      INTEGER,
  PRIMARY KEY (day, page, device, kind, sel, cx, cy)
);
CREATE INDEX IF NOT EXISTS idx_heat_page ON heat_points (page, day);

-- --------------------------------------------------------- replay_chunks ---
-- Index only. The rrweb events themselves live in R2 at `key`, one object per
-- chunk, gzip when the browser could compress (gz = 1).
CREATE TABLE IF NOT EXISTS replay_chunks (
  session_id TEXT    NOT NULL,
  seq        INTEGER NOT NULL,
  key        TEXT    NOT NULL,
  at         TEXT    NOT NULL,
  ts_from    INTEGER,          -- client ms epoch of the first event
  ts_to      INTEGER,
  events     INTEGER,
  bytes      INTEGER,
  gz         INTEGER NOT NULL DEFAULT 0,
  page       TEXT,
  vw         INTEGER,
  vh         INTEGER,
  PRIMARY KEY (session_id, seq)
);

-- ============================================================================
-- MIGRATION for the already-deployed database
--
-- schema.sql only fully applies to a fresh database, because ALTER TABLE …
-- ADD COLUMN errors on a column that already exists. The runnable version of
-- this section is migrations/0002_analytics.sql:
--
--   cd worker
--   npx wrangler d1 execute aeden-visitors --remote --file=migrations/0002_analytics.sql
--
-- Everything is additive: new columns are nullable, new tables are empty, and
-- nothing the old Worker wrote is touched. Applying it while the old Worker is
-- still deployed is safe; deploying the new Worker before applying it is not
-- (inserts into missing columns fail, and logging fails silently by design).
--
-- ALTER TABLE visits ADD COLUMN visitor_id TEXT;
-- ALTER TABLE visits ADD COLUMN session_id TEXT;
-- ALTER TABLE visits ADD COLUMN browser TEXT;
-- ALTER TABLE visits ADD COLUMN os TEXT;
-- ALTER TABLE visits ADD COLUMN region TEXT;
-- ALTER TABLE visits ADD COLUMN timezone TEXT;
-- ALTER TABLE visits ADD COLUMN protocol TEXT;
-- ALTER TABLE visits ADD COLUMN lang TEXT;
-- ALTER TABLE visits ADD COLUMN vw INTEGER;
-- ALTER TABLE visits ADD COLUMN vh INTEGER;
-- ALTER TABLE visits ADD COLUMN sw INTEGER;
-- ALTER TABLE visits ADD COLUMN sh INTEGER;
-- ALTER TABLE visits ADD COLUMN ref_host TEXT;
-- CREATE INDEX IF NOT EXISTS idx_visits_vid ON visits (visitor_id);
-- CREATE INDEX IF NOT EXISTS idx_visits_sid ON visits (session_id);
-- …then the CREATE TABLE IF NOT EXISTS statements above for visitors,
-- sessions, page_views, events, heat_points and replay_chunks.
--
-- Earlier migrations, already applied to the live database and kept here for
-- the record (D1 errors on a column that already exists, so skip these):
-- ALTER TABLE visits ADD COLUMN shown INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE visits ADD COLUMN reason TEXT;
-- ALTER TABLE visits ADD COLUMN test INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE visits ADD COLUMN lat REAL;
-- ALTER TABLE visits ADD COLUMN lon REAL;
-- ALTER TABLE visits ADD COLUMN device TEXT;
-- UPDATE visits SET shown = 1 WHERE company != '' AND shown = 0;
