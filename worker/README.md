# Visitor lookup Worker

Serves `https://aeden.me/api/visitor`. Resolves the caller's IP to an employer
and decides whether it's worth greeting them. The React side is
`src/components/VisitorPeek.js`.

## Why a Worker and not a browser fetch

- **First-party.** The request goes to your own domain, so ad blockers and
  Brave shields never see a third-party IP-lookup host.
- **Keys stay server-side.** The ipregistry fallback key is never shipped.
- **One place to swap providers.** The frontend contract never changes.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Two Cloudflare settings have to be right or the route silently won't fire:

1. The `aeden.me` DNS record must be **proxied** (orange cloud). Workers do not
   run on DNS-only records.
2. SSL/TLS mode must be **Full**, or GitHub Pages behind the proxy will
   redirect-loop.

## Deployed state

Live. KV namespace `6c3ee61f096a44e5b63296ef011ecb69` is bound, and
`IPAPI_KEY` and `DEBUG_TOKEN` are both set as secrets.

## Why the API key matters

Keep `IPAPI_KEY` set. Without it ipapi.is returns a *reduced, flat* payload
that looks nothing like the docs:

```json
{ "ip":"17.253.144.10", "company_name":"Apple Inc.", "asn_org":"Apple Inc.",
  "asn_num":714, "cc":"US", "is_datacenter":false }
```

No `company.type` — which is the single field the employer-vs-ISP decision
rests on. With the key you get the real thing:

```json
{ "company": { "name":"Apple Inc.", "domain":"apple.com", "type":"business",
               "network":"17.0.0.0 - 17.255.255.255", "netname":"APPLE-WWNET",
               "abuser_score":"0.0001 (Very Low)" } }
```

The Worker detects both shapes. If the key is ever removed or rejected it
degrades to a keyword heuristic (`ISP_WORDS` / `ISP_NAMES` in `src/index.js`)
rather than breaking — but that path guesses, so don't rely on it.

**ipregistry fallback** (used only if ipapi.is errors or is rate-limited):

```bash
npx wrangler secret put IPREGISTRY_KEY
```

## The response

```jsonc
{ "show": true, "company": "Apple", "domain": "apple.com", "type": "business", "asn": 714 }
{ "show": false, "reason": "type:isp" }
```

`show` is false far more often than true, by design. It is suppressed when the
IP is a datacenter, VPN, proxy, Tor exit, known abuser, or an egress relay like
iCloud Private Relay — and, most importantly, when the org type is `isp` or
`hosting`. An ISP means someone's home broadband, so the honest answer is that
we don't know where they work.

Only `business`, `education`, `government` and `banking` are treated as
employers.

## Visit log and alerts

Every company visit is written to D1 (`aeden-visitors`) and pings a webhook, at
most **once per company per day** so a single person browsing five pages is one
notification.

Read the log — public, no token:

```
https://aeden.me/api/visitor/log?limit=100
```

Rows from a pinned session carry `"test": 1`. Real visits are `0`. To re-lock
it later, restore the `if (!debug) return json({ error: "unauthorized" });`
guard at the top of the `/log` branch.

Turn on alerts — point `ALERT_WEBHOOK` at Discord, Slack, Telegram or ntfy and
the payload shape is inferred from the host:

```bash
npx wrangler secret put ALERT_WEBHOOK && npx wrangler deploy
```

Only the **/24** is stored, never the full address — enough to group an office,
not enough to identify a person. Pinned and debug requests are excluded so your
own testing never lands in the log.

## Testing

**The UI**, without touching the network: append `?visitor=Apple` to any page.
The hook short-circuits and renders as if that company had been detected. Works
against `npm start` and production.

**The lookup**, against a chosen IP — requires the `DEBUG_TOKEN` secret:

```bash
curl "https://aeden.me/api/visitor?debug=$DEBUG_TOKEN&ip=17.253.144.10"
```

Debug bypasses the cache and returns the raw upstream payload. Without a
matching token both `debug` and `ip` are ignored, so the endpoint can't be used
as a free IP-lookup proxy on your quota.

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
