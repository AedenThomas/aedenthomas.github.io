/**
 * Visitor company lookup for aeden.me
 *
 * Resolves the visiting IP to an employer and decides whether it's worth
 * greeting them. Runs first-party at aeden.me/api/visitor so ad blockers
 * never see a third-party request and the upstream keys stay server-side.
 *
 * Providers: ipapi.is primary (no key, 1000/day), ipregistry fallback.
 */

const TIMEOUT_MS = 2500;

// Only these org types are plausible employers. `isp` means a home broadband
// line, `hosting` means a datacenter — greeting either is how this feature
// embarrasses you, so both are dropped.
const EMPLOYER_TYPES = new Set(["business", "education", "government", "banking"]);

// Legal suffixes make the copy read like a filing. "are you at Apple?" not
// "are you at Apple Inc.?"
//
// Strictly *legal entity* markers only. Words like Technology, Systems,
// Solutions, Group and Holdings are part of the actual name — stripping those
// turned "King Abdul Aziz City for Science and Technology" into
// "…for Science and".
const SUFFIXES =
  /[\s,]+(inc|inc\.|llc|l\.l\.c\.|ltd|ltd\.|limited|corp|corp\.|corporation|co|co\.|plc|gmbh|mbh|ag|s\.a\.|s\.a\.s|sas|b\.v\.|bv|n\.v\.|nv|oy|oyj|ab|a\/s|pty|pte|pvt|private limited|pvt\.? ltd\.?|llp|s\.r\.l\.|srl|s\.p\.a\.|spa)\.?$/i;

function prettyName(name) {
  if (!name) return null;
  let out = String(name).trim().replace(/\s+/g, " ");
  // Strip up to two trailing legal suffixes ("Foo Technologies Pvt Ltd").
  for (let i = 0; i < 2; i++) {
    const next = out.replace(SUFFIXES, "");
    if (next === out) break;
    out = next.trim();
  }
  // ALL-CAPS registry records read as shouting; title-case them.
  if (out === out.toUpperCase() && out.length > 3) {
    out = out
      .toLowerCase()
      .replace(/\b([a-z])/g, (m) => m.toUpperCase())
      .replace(/\b(Of|And|The|For|De|Da)\b/g, (m) => m.toLowerCase());
  }
  return out || null;
}

/** Cache per /24 (v4) or /48 (v6) — neighbours on a corporate range share an answer. */
function cacheKey(ip) {
  if (ip.includes(":")) return "v6:" + ip.split(":").slice(0, 3).join(":");
  return "v4:" + ip.split(".").slice(0, 3).join(".");
}

async function getJSON(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/**
 * Carriers, hosts and consumer ISPs, matched on name.
 *
 * Only used when the provider gives us no `type` field — which is the case for
 * anonymous ipapi.is calls. With an API key the real `company.type` arrives and
 * this list is bypassed entirely. Covers UK, US and India carriers plus the
 * generic words that almost always mean "network operator, not employer".
 */
const ISP_WORDS =
  /\b(telecom|telecomm|telecommunications|communications|broadband|internet|isp|cable|wireless|cellular|mobile|fibre|fiber|hosting|datacenter|data centre|data center|colocation|colo|cloud|server|vps|dedicated|networks?|bandwidth)\b/i;

const ISP_NAMES =
  /\b(comcast|xfinity|verizon|at&t|att|charter|spectrum|cox|centurylink|lumen|frontier|windstream|t-mobile|sprint|cogent|level ?3|zayo|hurricane electric|bt group|british telecom|sky (uk|broadband)?|virgin media|talktalk|plusnet|zen internet|gamma|daisy|colt|ee limited|three uk|vodafone|orange|telefonica|deutsche telekom|telia|airtel|bharti|jio|reliance|bsnl|mtnl|act fibernet|hathway|tata (communications|teleservices)|sify|excitel|you broadband|amazon|aws|google cloud|microsoft azure|digitalocean|linode|hetzner|ovh|vultr|contabo|godaddy|namecheap|cloudflare|akamai|fastly)\b/i;

function looksLikeCarrier(name) {
  if (!name) return true;
  return ISP_WORDS.test(name) || ISP_NAMES.test(name);
}

/**
 * ipapi.is — primary.
 *
 * Two response shapes. With IPAPI_KEY set you get the documented nested objects
 * (company.name/type/domain/network). Anonymous, you get a flat reduced payload
 * (company_name, asn_org, asn_num) with no type at all. Handle both.
 */
async function viaIpapiIs(ip, key) {
  const d = await getJSON(
    `https://api.ipapi.is/?q=${encodeURIComponent(ip)}${key ? `&key=${encodeURIComponent(key)}` : ""}`
  );
  const company = d.company || {};
  const asn = d.asn || {};
  const flat = !d.company && !d.asn;

  const name = company.name || d.company_name || asn.org || d.asn_org || null;

  return {
    upstream: d,
    provider: flat ? "ipapi.is (anonymous)" : "ipapi.is",
    degraded: flat,
    name,
    domain: company.domain || asn.domain || null,
    // No type in the flat shape — infer just enough to avoid greeting an ISP.
    type: company.type || asn.type || (flat ? (looksLikeCarrier(name) ? "isp" : "business") : null),
    asn: asn.asn || d.asn_num || null,
    // Any of these means the IP doesn't represent a person sitting in an office.
    risky: Boolean(
      d.is_datacenter || d.is_vpn || d.is_proxy || d.is_tor || d.is_abuser || d.is_crawler
    ),
    // Secure web gateways, iCloud Private Relay, public DNS resolvers. Present
    // as an object when it applies, absent otherwise.
    relay: Boolean(d.egress_service),
  };
}

/** ipregistry — fallback. Needs IPREGISTRY_KEY; skipped when unset. */
async function viaIpregistry(ip, key) {
  const d = await getJSON(
    `https://api.ipregistry.co/${encodeURIComponent(ip)}?key=${encodeURIComponent(key)}`
  );
  const company = d.company || {};
  const conn = d.connection || {};
  const sec = d.security || {};
  return {
    provider: "ipregistry",
    name: company.name || conn.organization || null,
    domain: company.domain || conn.domain || null,
    type: company.type || conn.type || null,
    asn: conn.asn || null,
    risky: Boolean(
      sec.is_cloud_provider || sec.is_vpn || sec.is_proxy || sec.is_tor || sec.is_abuser || sec.is_threat
    ),
    relay: Boolean(sec.is_relay || sec.is_anonymous),
  };
}

/** Turn a provider result into the answer the page actually needs. */
function decide(r) {
  if (!r || !r.name) return { show: false, reason: "no-data" };
  if (r.risky) return { show: false, reason: "datacenter-or-vpn" };
  if (r.relay) return { show: false, reason: "relay" };
  if (!EMPLOYER_TYPES.has(r.type)) return { show: false, reason: `type:${r.type || "unknown"}` };

  const name = prettyName(r.name);
  if (!name) return { show: false, reason: "unnamed" };

  return {
    show: true,
    company: name,
    domain: r.domain || null,
    type: r.type,
    asn: r.asn,
    provider: r.provider,
  };
}

const json = (body, setCookie = null) => {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    // Per-visitor. Without this the edge would serve one visitor's employer
    // to everyone who follows.
    "cache-control": "no-store, private",
    "access-control-allow-origin": "*",
  };
  if (setCookie) headers["set-cookie"] = setCookie;
  return new Response(JSON.stringify(body), { headers });
};

/**
 * Ping a chat webhook. Shape is inferred from the host so you can point
 * ALERT_WEBHOOK at Discord, Slack, Telegram or ntfy without a code change.
 */
async function notify(webhook, text) {
  if (!webhook) return;
  const opts = { method: "POST", signal: AbortSignal.timeout(4000) };
  if (webhook.includes("api.telegram.org")) {
    const sep = webhook.includes("?") ? "&" : "?";
    return fetch(`${webhook}${sep}text=${encodeURIComponent(text)}`, {
      signal: AbortSignal.timeout(4000),
    });
  }
  if (webhook.includes("ntfy.sh")) {
    return fetch(webhook, { ...opts, body: text });
  }
  const body = webhook.includes("slack.com") ? { text } : { content: text };
  return fetch(webhook, {
    ...opts,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Record a company visit and alert, at most once per company per day.
 *
 * Runs inside ctx.waitUntil so the visitor never waits on it. Stores only the
 * /24, never the full address — enough to group an office, not enough to
 * single out a person.
 */
async function record(env, answer, ip, request, isTest = false) {
  const day = new Date().toISOString().slice(0, 10);
  const dedupeKey = `seen:${answer.company}:${day}`;

  if (env.VISITOR_CACHE && !isTest) {
    const already = await env.VISITOR_CACHE.get(dedupeKey);
    if (already) return;
    await env.VISITOR_CACHE.put(dedupeKey, "1", { expirationTtl: 86400 });
  }

  const cf = request.cf || {};
  const net = ip.includes(":")
    ? ip.split(":").slice(0, 3).join(":") + "::/48"
    : ip.split(".").slice(0, 3).join(".") + ".0/24";
  const referrer = request.headers.get("referer") || null;

  if (env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO visits (seen_at, company, domain, type, asn, net, country, city, path, referrer, test)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      )
        .bind(
          new Date().toISOString(),
          answer.company,
          answer.domain || null,
          answer.type || null,
          answer.asn || null,
          net,
          cf.country || null,
          cf.city || null,
          new URL(request.url).searchParams.get("from") || "/",
          referrer,
          isTest ? 1 : 0
        )
        .run();
    } catch (_) {
      /* logging must never break the response */
    }
  }

  const where = [cf.city, cf.country].filter(Boolean).join(", ");
  await notify(
    env.ALERT_WEBHOOK,
    `👀 ${answer.company} just visited aeden.me` +
      (where ? ` — from ${where}` : "") +
      (answer.domain ? ` (${answer.domain})` : "") +
      `\n${net} · AS${answer.asn || "?"} · ${answer.type || "?"}`
  ).catch(() => {});
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
        },
      });
    }

    const url = new URL(request.url);

    // Debug exposes upstream payloads and lets the caller name an arbitrary IP,
    // which would make this a free lookup proxy on our quota. Off unless
    // DEBUG_TOKEN is set as a secret and matches.
    const debug =
      Boolean(env.DEBUG_TOKEN) && url.searchParams.get("debug") === env.DEBUG_TOKEN;

    // Read the log: /api/visitor/log?debug=<DEBUG_TOKEN>
    if (url.pathname.endsWith("/log")) {
      if (!env.DB) return json({ error: "no database bound" });
      const limit = Math.min(Number(url.searchParams.get("limit") || 100) || 100, 500);
      const { results } = await env.DB.prepare(
        `SELECT seen_at, company, domain, type, asn, net, country, city, test
         FROM visits ORDER BY seen_at DESC LIMIT ?`
      )
        .bind(limit)
        .all();
      return json({ count: results.length, visits: results });
    }

    // A pinned IP lets you browse aeden.me with no query params at all and
    // still be seen as arriving from somewhere else. The full lookup still
    // runs against it — only the source address is substituted.
    const cookies = request.headers.get("cookie") || "";
    const pinned = /(?:^|;\s*)peek_ip=([^;]+)/.exec(cookies);

    const spoof = debug ? url.searchParams.get("ip") : null;
    const ip = spoof || (pinned && decodeURIComponent(pinned[1])) || request.headers.get("CF-Connecting-IP");
    if (!ip) return json({ show: false, reason: "no-ip" });

    // ?pin=1 stores the spoof for later param-free visits; ?pin=0 clears it.
    let setCookie = null;
    if (debug && url.searchParams.has("pin")) {
      setCookie =
        url.searchParams.get("pin") === "0"
          ? "peek_ip=; Path=/; Max-Age=0; SameSite=Lax; Secure"
          : `peek_ip=${encodeURIComponent(ip)}; Path=/; Max-Age=86400; SameSite=Lax; Secure`;
    }

    const key = cacheKey(ip);

    // KV is optional — the Worker runs fine before the namespace exists.
    if (env.VISITOR_CACHE && !debug) {
      try {
        const hit = await env.VISITOR_CACHE.get(key, "json");
        if (hit) {
          if (hit.show) {
            ctx.waitUntil(record(env, hit, ip, request, Boolean(pinned)).catch(() => {}));
          }
          return json({ ...hit, cached: true }, setCookie);
        }
      } catch (_) {
        /* cache is best-effort */
      }
    }

    let result = null;
    const errors = {};
    try {
      result = await viaIpapiIs(ip, env.IPAPI_KEY);
    } catch (e) {
      errors.ipapi = String(e && e.message ? e.message : e).slice(0, 120);
      if (env.IPREGISTRY_KEY) {
        try {
          result = await viaIpregistry(ip, env.IPREGISTRY_KEY);
        } catch (e2) {
          errors.ipregistry = String(e2 && e2.message ? e2.message : e2).slice(0, 120);
        }
      } else {
        errors.ipregistry = "no-key";
      }
    }

    const answer = decide(result);
    if (debug) {
      // &log=1 forces a record so the logging path can be exercised on demand.
      if (answer.show && url.searchParams.get("log") === "1") {
        ctx.waitUntil(record(env, answer, ip, request).catch(() => {}));
      }
      return json({ ...answer, _ip: ip, _errors: errors, _raw: result }, setCookie);
    }

    if (env.VISITOR_CACHE) {
      // Negative answers cached shorter: an ISP range can get reassigned, and
      // a wrong "no" is cheaper to retry than a wrong "yes" is to live with.
      const ttl = answer.show ? 86400 : 21600;
      try {
        await env.VISITOR_CACHE.put(key, JSON.stringify(answer), { expirationTtl: ttl });
      } catch (_) {
        /* best-effort */
      }
    }

    // Never log our own pin/debug testing.
    if (answer.show && !spoof) {
      ctx.waitUntil(record(env, answer, ip, request, Boolean(pinned)).catch(() => {}));
    }

    return json(answer, setCookie);
  },
};
