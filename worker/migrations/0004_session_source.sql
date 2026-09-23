-- Migration 0004 — the ?s= tag a session landed with.
--
--   cd worker
--   npx wrangler d1 execute aeden-visitors --remote --file=migrations/0004_session_source.sql
--
-- Resume PDFs, email signatures and most mail apps send no referrer, so those
-- visits all look "direct". Their links carry a hidden ?s=<tag> (the visible
-- text stays plain aeden.me); the tracker reports it with the landing page
-- view and strips it from the address bar. The dashboard's sources panel
-- combines this with ref_host and the in-app browser label.

ALTER TABLE sessions ADD COLUMN source TEXT;
