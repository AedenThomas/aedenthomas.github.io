-- Migration 0003 — give heat cells the network that recorded them.
--
--   cd worker
--   npx wrangler d1 execute aeden-visitors --remote --file=migrations/0003_heat_net.sql
--
-- Heat rows are pre-aggregated, so before this there was nothing in a cell
-- saying whose clicks were in it — the dashboard's "exclude my IP" toggle had
-- no way to leave the owner's own passes out of the map. `net` joins the
-- primary key so two networks landing on the same cell stay separate rows.
--
-- Rows written before this keep net = '' and are never excluded: they cannot
-- be attributed either way. Clear them by hand if the old map is mostly your
-- own testing:  DELETE FROM heat_points WHERE net = '' AND day <= 'YYYY-MM-DD';

ALTER TABLE heat_points RENAME TO heat_points_old;

CREATE TABLE heat_points (
  day    TEXT NOT NULL,
  page   TEXT NOT NULL,
  device TEXT NOT NULL,
  kind   TEXT NOT NULL,
  sel    TEXT NOT NULL,
  cx     REAL NOT NULL,
  cy     REAL NOT NULL,
  -- /24 (or /48) of the client, '' for rows that predate this column.
  net    TEXT NOT NULL DEFAULT '',
  n      INTEGER NOT NULL DEFAULT 0,
  w      INTEGER,
  h      INTEGER,
  PRIMARY KEY (day, page, device, kind, sel, cx, cy, net)
);

INSERT INTO heat_points (day, page, device, kind, sel, cx, cy, net, n, w, h)
  SELECT day, page, device, kind, sel, cx, cy, '', n, w, h FROM heat_points_old;

DROP TABLE heat_points_old;

CREATE INDEX IF NOT EXISTS idx_heat_page ON heat_points (page, day);
CREATE INDEX IF NOT EXISTS idx_heat_net  ON heat_points (net);
