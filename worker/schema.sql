CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  seen_at    TEXT    NOT NULL,
  company    TEXT    NOT NULL,
  domain     TEXT,
  type       TEXT,
  asn        INTEGER,
  -- /24 only, never the full address: enough to group an office, not enough to
  -- single out a person.
  net        TEXT,
  country    TEXT,
  city       TEXT,
  path       TEXT,
  referrer   TEXT
);
CREATE INDEX IF NOT EXISTS idx_visits_seen  ON visits (seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_co    ON visits (company);
