# Visitor Worker: employer lookup, alerts and self-hosted analytics

Serves `https://aeden.me/api/visitor*` and `https://aeden.me/dashboard`. Two
jobs, one Worker:

1. **Employer lookup.** Resolves the caller's IP to a company and decides
   whether the site should greet them. The React side is
   `src/components/VisitorPeek.js` and `src/useVisitorCompany.js`.
2. **Analytics.** Clarity-style, first-party, nothing third-party: page views,
   sessions, engagement, heatmaps and session replay from `public/aeden.js`,
   stored in D1 and R2 and viewed in the dashboard.

```
browser ──/api/visitor (lookup)──────────► index.js ── ipapi.is ─┐
        ──/api/visitor/journal (batches)─► analytics.js          ├─► D1  aeden-visitors
        ──/api/visitor/frames (rrweb)────► analytics.js ─► R2  aeden-replays (blobs)
                                                          KV  VISITOR_CACHE (answers + alert dedupe)
dashboard ──/api/visitor/{log,sessions,visitors,engagement,heat,replay}
```

## Why a Worker and not a browser fetch

- **First-party.** Everything goes to your own domain, so ad blockers and
  Brave shields never see a third-party lookup or analytics host.
- **Keys stay server-side.** The ipregistry fallback key is never shipped.
- **One place to swap providers.** The frontend contract never changes.

## Deploy

The database has to be ahead of the Worker, and the site has to be ahead of
the dashboard. In order:

```bash
cd worker
npx wrangler login

# 1. R2 bucket for replay blobs (once)
npx wrangler r2 bucket create aeden-replays

# 2. Database: fresh …
npx wrangler d1 execute aeden-visitors --remote --file=schema.sql
#    … or already deployed (adds the analytics tables and the new visits columns)
npx wrangler d1 execute aeden-visitors --remote --file=migrations/0002_analytics.sql

# 3. The Worker
npx wrangler deploy

# 4. The site, which now ships public/aeden.js and public/vendor/ (rrweb)
cd .. && npm run deploy
```

Two Cloudflare settings have to be right or the route silently won't fire:

1. The `aeden.me` DNS record must be **proxied** (orange cloud). Workers do not
   run on DNS-only records.
2. SSL/TLS mode must be **Full**, or GitHub Pages behind the proxy will
   redirect-loop.

### Secrets

```bash
npx wrangler secret put IPAPI_KEY        # ipapi.is — see below
npx wrangler secret put DEBUG_TOKEN      # enables ?debug= and ?ip=
npx wrangler secret put ALERT_WEBHOOK    # Discord / Slack / Telegram / ntfy
npx wrangler secret put MAIL_RELAY_URL    # Apps Script /exec URL — see Alerts
npx wrangler secret put MAIL_RELAY_SECRET # shared secret, must match relay.gs
npx wrangler secret put IPREGISTRY_KEY   # optional fallback provider
npx wrangler secret put DASHBOARD_TOKEN  # optional; locks the dashboard + reads
```

### Local

```bash
cd worker
npx wrangler d1 execute aeden-visitors --local --file=schema.sql
npx wrangler dev --local --var DEBUG_TOKEN:dev --var ALERT_WEBHOOK:http://127.0.0.1:9799/hook
```

Local D1, KV and R2 are emulated. The dashboard at
`http://127.0.0.1:8787/dashboard` reads the local database; the replay player
and the heatmap preview are fetched from the live site because they are served
by GitHub Pages, so the heatmap falls back to per-element cards off aeden.me.

## Deployed state

Live, analytics included, since 6 September 2026. KV namespace
`6c3ee61f096a44e5b63296ef011ecb69` and R2 bucket `aeden-replays` are bound,
migration 0002 has been applied to the production database, and `IPAPI_KEY`,
`DEBUG_TOKEN` is set as a secret. `ALERT_WEBHOOK`, `MAIL_RELAY_URL` and
`MAIL_RELAY_SECRET` gate the alerts — with none of them set nothing is sent.
`DASHBOARD_TOKEN` is not
set, so the dashboard and every read endpoint are public.

## Why the API key matters

Keep `IPAPI_KEY` set. Without it ipapi.is returns a *reduced, flat* payload.
Anonymous calls have looked like this over time:

```json
{ "ip":"17.253.144.10", "company_name":"Apple Inc.", "asn_org":"Apple Inc.",
  "asn_num":714, "cc":"US", "is_datacenter":false }
{ "ip":"17.253.144.10", "company":"Apple Inc.", "asn":"AS714 Apple Inc.",
  "city":"Cupertino", "country":"United States" }
```

No `company.type`, which is the single field the employer-vs-ISP decision
rests on. With the key you get the real thing:

```json
{ "company": { "name":"Apple Inc.", "domain":"apple.com", "type":"business",
               "network":"17.0.0.0 - 17.255.255.255", "netname":"APPLE-WWNET",
               "abuser_score":"0.0001 (Very Low)" } }
```

The Worker detects all three shapes. If the key is ever removed or rejected it
degrades to a keyword heuristic (`ISP_WORDS` / `ISP_NAMES` in `src/index.js`)
rather than breaking. That path guesses, so don't rely on it.

**ipregistry fallback** (used only if ipapi.is errors or is rate-limited):

```bash
npx wrangler secret put IPREGISTRY_KEY
```

## The lookup response

```jsonc
{ "show": true, "company": "Apple", "domain": "apple.com", "type": "business", "asn": 714 }
{ "show": false, "reason": "type:isp" }
```

`show` is false far more often than true, by design. It is suppressed when the
IP is a datacenter, VPN, proxy, Tor exit, known abuser, or an egress relay like
iCloud Private Relay. Most importantly, it is suppressed when the org type is
`isp` or `hosting`. An ISP means someone's home broadband, so the honest answer
is that we don't know where they work.

Only `business`, `education`, `government` and `banking` are treated as
employers.

The hook sends a few extra query params with the lookup so the visit row is
complete: `from` (the route), `sid` (the tracker's session id), `cid`, `vw vh
sw sh` (viewport and screen), `tz` and `ref` (the real `document.referrer`; the
Referer header on a same-origin fetch is just our own page).

## Where the displayed name comes from

The name in the greeting is resolved by `displayName()`, and the order matters
more than any single step:

1. **`ALIASES`**, a curated map keyed on registrable domain. This is the only
   thing that reliably knows `lowes.com` is Lowe's and `ibm.com` is IBM.
2. **The domain label**: `us.ibm.com` reduces to `ibm.com` reduces to `IBM`.
   Hyphens become spaces, and a short vowel-free label is read as an acronym.
3. **The org name**, scrubbed of legal suffixes and regional tails, and only if
   it survives `looksLikeJunk()`.

Step 2 exists because the provider's `company.name` is a WHOIS or netblock
record and comes with their artifacts. Two real sightings made the case:

| `company.name` | `company.domain` | shown before | shown now |
| --- | --- | --- | --- |
| `Lowes Services India` | `lowes.com` | Lowes Services India | Lowe's |
| `IBMC-20` | `us.ibm.com` | Ibmc-20 | IBM |

When no step yields a presentable name the answer is `show: false` with reason
`unnameable`. A greeting that never fires is invisible; a wrong one is the
exact embarrassment this feature exists to avoid.

### Adding an alias

Only add entries `labelToName()` would get wrong: acronyms (`SAP`), mixed case
(`PwC`, `eBay`), punctuation (`Lowe's`, `P&G`), and multi-word names run
together in the label (`bestbuy.com` -> Best Buy). The dashboard's `why` tab
with the `no clean name` reason is the place to find candidates.

## Identity and sessions

- **`aeden_vid`** is a first-party, HttpOnly, Secure, SameSite=Lax cookie with
  a random 128-bit id and a sliding one-year expiry. The Worker mints it on the
  first request it sees (lookup or collect) and re-asserts it on every
  response. The tracker cannot read it; it keeps its own `cid` in localStorage
  only so the very first batch, sent before any cookie exists, can name the
  cookie and agree with every batch after it. The cookie always wins after
  that, so clearing localStorage does not split a visitor in two.
- **Sessions** are derived in the browser: a random id kept in localStorage
  with a 30-minute inactivity timeout, shared across tabs. Every hit, event,
  page view and replay chunk carries it. When a tab sits idle past the timeout
  and the visitor comes back, the page view is closed against the old session
  and a fresh one starts, replay snapshot included.
- **Every lookup is logged.** `visits` used to hold one row per company per
  day; it now holds one per hit. The once-per-day dedupe survives only in front
  of the webhook.

Dimensions stored per hit and per session: device, browser and OS parsed from
the User-Agent (`src/ua.js`), country/city/region/timezone/HTTP protocol from
`request.cf`, the first `Accept-Language` tag, viewport and screen size from
the client, and the referrer's host. Only the **/24** is stored, never the full
address.

Bots (crawlers, link previewers, HTTP libraries, headless browsers by UA) are
dropped before any write. So is anything carrying the `aeden_notrack=1` cookie;
the dashboard footer has an *exclude this browser* toggle that sets it, and
`?aeden_notrack=1` on any page of the site does the same.

## Alerts

Alerts fan out to two independent channels, either of which can be left off.
Point `ALERT_WEBHOOK` at Discord, Slack, Telegram or ntfy; the payload shape is
inferred from the host. Set `MAIL_RELAY_URL` + `MAIL_RELAY_SECRET` for email.
**Every visit alerts**, employer or not. Dedupe is per *session* (KV key
`vis:<session>`, 6 h), so one person reading four pages is one alert, not four;
the same person back after the 30-minute session timeout is a new session and
alerts again. Clients with no session id fall back to `net:<net>:<day>`, which
is coarse but keeps a bot loop from draining the relay's ~100/day Gmail quota.
One channel failing never stops the other.

| when | text |
| --- | --- |
| a company never seen before | `🆕 Apple visited aeden.me for the first time — from Cupertino, US (apple.com)` |
| a company back after > 24 h | `↩️ Apple is back after 3 days — 7 visits total — from …` |
| a company seen again within 24 h | `👀 Apple just visited aeden.me — from …` (the original alert) |
| a browser never seen before, no employer | `👋 a new visitor is on aeden.me · Leeds, GB · desktop · Edge 128 · Windows` |
| a known browser, back within 24 h | `👀 someone is back on aeden.me — 4 visits total · …` |
| a known browser back after > 24 h | `↩️ a returning visitor is back after 17 days — 4 visits total · …` |

The second line carries the /24, ASN, org type, device, browser, OS and the
route. When a company alert's browser has itself been away more than a day, a
third line says so: `same browser last here 3 days ago · 3 visits`.

In the email the first line becomes the subject and the rest the body.

Pinned and debug requests never alert and never write live rows.

### Email, and why it goes through Apps Script

A Worker has no TCP sockets, so SMTP is out — every option has to be an HTTPS
call. The obvious Cloudflare-native routes are both closed for this domain:

- **Email Sending** (the `send_email` binding) requires the Workers **Paid**
  plan. On the free plan the API answers `Unauthorized [code: 2036]` and the
  binding rejects sends with `E_SENDER_NOT_VERIFIED`.
- **Email Routing** would make sends to a verified destination free, but it is
  a *zone-level* feature that applies to the apex domain — adding a subdomain
  requires enabling the apex first. Turning it on would rewrite aeden.me's MX
  records from SimpleLogin to Cloudflare and break every alias on the domain.
  Do not run `wrangler email routing enable` against this zone.

`relay/relay.gs` sidesteps both. Deployed as an Apps Script Web App it exposes
a URL that runs as your Google account, so `MailApp.sendEmail` posts from Gmail
with no API key, no sending domain and no DNS changes. Roughly 100 sends/day,
far above what the once-per-day dedupe can produce.

Setup:

1. Open <https://script.new>, paste `relay/relay.gs`, and set `SECRET` in it.
2. **Run > sendTest** once. This triggers the OAuth consent prompt and proves
   `MailApp` can reach the inbox.

   `TO` is `aedengeo+visitors@gmail.com`, deliberately **not**
   `notify@aeden.me`: that alias forwards to the same Gmail account the script
   sends as, and SimpleLogin drops a message coming from an alias's own
   mailbox. The alias gained nothing regardless — Apps Script can only send as
   the account running it, so the From address is the Gmail either way.
3. **Deploy > New deployment > Web app**, with *Execute as: Me* and
   *Who has access: Anyone*. Copy the `/exec` URL.
4. `npx wrangler secret put MAIL_RELAY_URL` (that URL) and
   `npx wrangler secret put MAIL_RELAY_SECRET` (the same `SECRET`).

*Who has access: Anyone* is what lets the Worker call in without a Google
login, which makes the URL itself a capability — anyone holding it could send
mail as you. That is why the payload is signed and `relay.gs` checks the secret
before doing anything. Treat the URL as a credential, and after editing the
script always redeploy as a **new version**, or the old code keeps serving.

## The tracker (`public/aeden.js`)

Everything the browser fetches or posts has a deliberately bland name:
`/aeden.js`, `/vendor/scene.min.js`, `/api/visitor/journal`,
`/api/visitor/frames`. EasyPrivacy blocks `/rrweb-record.min.js` and
`/rrweb.js` by filename, and "track", "collect" and "replay" are the words
its patterns are built from, so under the obvious names a visitor running
uBlock Origin would lose the recorder or the whole script. The old
`/collect` and `/replay` paths are still accepted by the Worker as aliases.

Vanilla, no dependencies, loaded with `defer` from `public/index.html`. The
whole file runs inside one `try`, every listener is wrapped, nothing awaits the
network, and it does nothing at all when framed, under `navigator.webdriver`,
or when the notrack cookie is present.

What it batches to `POST /api/visitor/journal` every 5 s and on `pagehide`
(via `sendBeacon`, falling back to `fetch keepalive`):

| event | when |
| --- | --- |
| `pv` page view | load, SPA route change (hash, `pushState`, `popstate`), bfcache restore, session resume |
| `pe` page end | route change, `pagehide`, session timeout: max scroll %, active / visible / hidden ms, duration |
| `click` | every click: structural selector, text, client x/y |
| `rage` | 3+ clicks within 1 s and 30 px |
| `dead` | a click on a non-interactive element that caused no DOM change (outside `<head>`, ignoring nodes that were already animating) and no navigation within 800 ms |
| `copy` | text copied: length and first 120 chars |
| `out` | click on a link to another host |
| `dl` | click on a `.pdf`/`.docx`/`.zip`, a `download` link, or anything that says résumé / CV |
| `vis` | tab hidden / visible |

*Active time* adds each interaction gap up to 5 s, so a visitor reading with
the mouse still counts and one who walked away does not.

**Heat** points are never raw pixels. Each click and each mouse sample (at
most one per 100 ms, only while moving) is recorded against the nearest
*stable* ancestor (an id, a landmark or heading tag, or the nearest block at
least 240×120 px) as a fraction of that element's box, rounded to 1 %. The
tracker rolls repeats into cells before sending, and the Worker upserts them
into `heat_points` keyed on (day, page, device, kind, selector, cell). Selectors
are structural (`#root>div>div:nth-of-type(3)>h2`) with no class names, so the
dashboard can find the element again after a redeploy.

**Replay** is rrweb, self-hosted. `scripts/vendor-rrweb.js` copies the recorder
and player out of `node_modules` into `public/vendor/` as `scene.min.js`,
`scene-player.min.js` and `scene-player.css` (it runs on `postinstall`; the
outputs are committed too). The recorder is injected after
`load` on an idle callback, records with `maskAllInputs`, throttles mouse moves
to 80 ms, takes a fresh full snapshot every 10 minutes and at every session
rotation, and flushes a chunk every 10 s, whenever the buffer passes ~180 KB,
and on `pagehide`. Chunks are gzip-compressed with `CompressionStream` when the
browser can (not on `pagehide`, where there is no time) and land in R2 at
`replays/<session>/<seq>.json[.gz]`; D1's `replay_chunks` is the index. Notable
events (page views, rage and dead clicks, copies, downloads, outbound links)
are also written into the recording as rrweb custom events, which is what puts
them on the player's timeline.

Nothing is recorded when the browser asks for reduced data (`saveData` or
`prefers-reduced-data`). `window.AEDEN_TRACK = { replay: false }` before the
script turns replay off entirely; `window.__aeden.track(name, meta)` sends a
custom event.

## Storage

D1 `aeden-visitors`, all in `schema.sql`:

| table | one row per |
| --- | --- |
| `visits` | employer lookup (every hit), now with visitor/session ids and the extra dimensions |
| `visitors` | `aeden_vid` cookie: first/last seen, sticky company, latest dimensions |
| `sessions` | client session: identity, geography, device, running tallies, replay chunk count |
| `page_views` | page view, keyed on a client id so the page-end lands on the same row |
| `events` | click / rage / dead / copy / outbound / download / visibility / page_end / custom |
| `heat_points` | (day, page, device, kind, selector, 1 % cell) with a hit count |
| `replay_chunks` | R2 object: key, byte size, event count, time span |

R2 `aeden-replays` holds only the replay blobs. Counts on the dashboard are
derived at read time from `sessions`, `page_views` and `visits`, so nothing can
drift.

### Migrating the already-deployed database

`schema.sql` is the full schema and only fully applies to a fresh database,
because `ALTER TABLE … ADD COLUMN` errors on a column that already exists. The
same statements, in runnable form, are `migrations/0002_analytics.sql`:

```bash
cd worker
npx wrangler d1 execute aeden-visitors --remote --file=migrations/0002_analytics.sql
```

Everything is additive. Apply it before deploying the new Worker: the new
Worker inserts into the new columns, and logging fails silently by design, so
a missing column would mean a quiet gap in the log rather than an error.

Earlier, already-applied migrations are kept at the bottom of `schema.sql`.

## Endpoints

Ingest, never gated:

| | |
| --- | --- |
| `POST /api/visitor/journal` | JSON batch: `sid cid ts device vw vh sw sh tz lang events[] heat[]` |
| `POST /api/visitor/frames?sid&seq&from&to&n&p&vw&vh&d&gz` | body: gzip or raw JSON array of rrweb events |

Reads, public unless `DASHBOARD_TOKEN` is set. All take `since` (`24h`, `3d`,
`30d`, `all`, bare hours), `test` (`0` / `1`) and `limit`:

| | |
| --- | --- |
| `GET /api/visitor/log` | the lookup log, as before, plus the new columns |
| `GET /api/visitor/sessions[?visitor=&replay=1]` | sessions with a `paths` breadcrumb |
| `GET /api/visitor/sessions/<sid>` | one session: page views, events, replay chunk index |
| `GET /api/visitor/visitors` | visitors with session / page / lookup counts |
| `GET /api/visitor/visitors/<vid>` | one visitor: sessions, page views, lookups, event counts |
| `GET /api/visitor/engagement` | per-page views, time, scroll funnel; clicks grouped by element |
| `GET /api/visitor/heat[?page=&kind=c|m&device=]` | pages with counts; cells for one page |
| `GET /api/visitor/replay/<sid>` | chunk index |
| `GET /api/visitor/replay/<sid>/<seq>` | the chunk, served with `Content-Encoding: gzip` when stored compressed |

### Locking it down

Replays are recordings of real people, so the dashboard should not stay public
for long. Set `DASHBOARD_TOKEN` and every read endpoint answers `401` without
it. Open `https://aeden.me/dashboard?token=<the token>` once: the Worker swaps
the token for an HttpOnly cookie (30 days) and redirects to the clean URL, and
the page's own fetches ride on that cookie. The dashboard shows an unlock
prompt when it meets a `401`. Without the secret, everything is public as it
was.

## The dashboard

```
https://aeden.me/dashboard
```

One self-contained page served by the Worker. Amber means an employer resolved;
slate means it did not; nothing decorative is ever amber. Dark by default and
the site's cream on request, remembered in `localStorage`.

Five views, chosen in the top bar and kept in the URL fragment:

- **overview**: unchanged. KPI tiles, the dot-matrix world map, feed, ranked
  companies / places / reasons / networks, lookups per hour or day, the
  day-of-week × hour heat grid, and the full sortable log with a detail drawer.
- **visitors**: new vs returning, sessions, employers and replays as tiles; a
  table of every cookie seen in the range; a timeline per visitor (each
  session with its pages, scroll depth and active time, device, referrer,
  event summary, a *watch replay* button); and *likely the same person*,
  which groups different cookies that share a company and a /24 with sessions
  within an hour of each other (where no company resolved, the city has to
  match too). Grouped visitors carry a `P1`, `P2` … pill.
- **engagement**: per page, views, sessions, average active and on-page time,
  a four-bar scroll funnel (25 / 50 / 75 / 90 %), and click / rage / dead
  counts. Pick a page and the right rail ranks the elements clicked on it,
  with rage and dead counts per element; clicking one copies its selector.
- **heatmaps**: click or mouse heat, filtered by device and the global date
  range, drawn on a canvas over the **live page** in an iframe at the device's
  width (1280 / 820 / 390). Because points were recorded against elements, the
  page is loaded fresh, each selector is found again, and the heat lands where
  the element is *now*. Cells whose element has gone are counted in the note
  under the toolbar. Off aeden.me the iframe is cross-origin and the view
  falls back to one small heat canvas per element.
- **replays**: sessions with duration, pages, company, place, device and
  activity; pick one and the vendored rrweb player loads every chunk from R2,
  with a timeline, 1–8× speed, skip-inactive, the visitor's cursor with a
  trail, scrolling, and coloured markers for rage / dead clicks, downloads,
  outbound links and copies. The list under the player is the same timeline
  as text; click an entry to jump there.

Filter state lives in the URL fragment, so a narrowed view is a link worth
keeping:

```
/dashboard#range=30d&view=visitors&vid=…
/dashboard#view=heatmaps&hpage=/&hkind=m&hdev=mobile
/dashboard#view=replays&sid=…
```

Keys: `/` search, `1`-`6` range, `t` test rows, `r` refresh, `l` live,
`d` theme, `e` export CSV, `Esc` clear.

The footer's *exclude this browser* sets the notrack cookie on aeden.me, so
opening the dashboard in the same browser you use to check the site keeps your
own visits out of every table.

### The raw log

Public unless the token is set:

```
https://aeden.me/api/visitor/log?since=7d&limit=500&test=0
```

| param   | accepts                                | default |
| ------- | -------------------------------------- | ------- |
| `since` | `24h`, `3d`, `30d`, `all`, bare hours  | `all`   |
| `limit` | `1`-`5000`                             | `100`   |
| `test`  | `0` excludes test rows, `1` only those | both    |

An unparseable `since` means `all`: a mistyped filter should show too much
rather than silently show nothing. Rows from a pinned session carry
`"test": 1`. Real visits are `0`.

## Testing

**The UI**, without touching the network: append `?visitor=Apple` to any page.
The hook short-circuits and renders as if that company had been detected.

**The lookup**, against a chosen IP, requires `DEBUG_TOKEN`:

```bash
curl "https://aeden.me/api/visitor?debug=$DEBUG_TOKEN&ip=17.253.144.10"
```

Debug bypasses the cache and returns the raw upstream payload. Without a
matching token both `debug` and `ip` are ignored, so the endpoint can't be used
as a free IP-lookup proxy on your quota. `&log=1` forces a log row for a
positive answer.

**The tracker**: open the site with DevTools' network panel filtered to
`/api/visitor/` and watch `journal` batches leave every few seconds and
`frames` chunks every ten. `window.__aeden.sid()` is the current session;
`window.__aeden.flush()` sends whatever is buffered.

## Gotchas found while deploying

- **The route pattern needs the trailing `*`.** Cloudflare matches routes
  against the full URL *including the query string*, so a bare
  `aeden.me/api/visitor` silently falls through to GitHub Pages the moment any
  query param is added.
- **ipapi.is IP-bans on burst traffic.** Enough requests in a short window and
  it stops answering that source with `connection refused`, not a 429. The KV
  cache is what keeps normal traffic well clear of this.
- **Negative answers are cached too** (6h). If you change the decision logic,
  flush the namespace or you'll keep reading the old verdict:
  `npx wrangler kv key list --namespace-id=<id> --remote`
- **`sendBeacon` is capped at 64 KB** in Chromium, and so is `fetch` with
  `keepalive`. That is why replay chunks are flushed early (~180 KB raw, well
  under the cap once compressed) and why the `pagehide` flush sends raw JSON
  rather than waiting on async compression.
- **Serving gzip from R2** needs `encodeBody: "manual"` on the Response, or the
  runtime compresses the bytes a second time.
- **Cloudflare caches `/aeden.js` and `/vendor/*` at the edge for 4 hours**
  (`.js` and `.css` are cacheable by extension; the HTML is not). After
  `npm run deploy` changes the tracker, either purge those URLs in the
  Cloudflare dashboard (Caching → Configuration → Custom Purge) or expect the
  old script to keep running for up to four hours. A 404 fetched before Pages
  had published is cached for a few minutes too, which is why a visit made
  right after the very first deploy can go unrecorded.
