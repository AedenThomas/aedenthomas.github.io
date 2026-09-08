/**
 * Self-hosted analytics for aeden.me — the Worker side of public/aeden.js.
 *
 * Ingest (neutral names: "collect" and "replay" are blocklist vocabulary):
 *   POST /api/visitor/journal   batches of engagement events + heat cells
 *   POST /api/visitor/frames    one rrweb chunk -> R2, index row -> D1
 *
 * Read (dashboard):
 *   GET  /api/visitor/sessions[/<sid>]
 *   GET  /api/visitor/visitors[/<vid>]
 *   GET  /api/visitor/engagement
 *   GET  /api/visitor/heat
 *   GET  /api/visitor/replay/<sid>[/<seq>]
 *
 * Identity is the HttpOnly `aeden_vid` cookie, minted here. The tracker only
 * ever sees its own `cid`, which is used once — to name the cookie on the
 * very first request so the first batch and every later one agree.
 */
import { parseUA } from "./ua.js";

export const VID_RE = /^[a-f0-9]{32}$/;
const PVID_RE = /^[a-f0-9]{8,32}$/;
const DAY_MS = 86400e3;
const COOKIE_MAX_AGE = 31536000; // 1 year, sliding

/* ------------------------------------------------------------- helpers -- */

export function readCookie(request, name) {
  const m = new RegExp("(?:^|;\\s*)" + name + "=([^;]+)").exec(request.headers.get("cookie") || "");
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch (_) { return m[1]; }
}

export function hex(bytes) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** /24 for v4, /48 for v6 — enough to group an office, not a person. */
export function netOf(ip) {
  if (!ip) return null;
  return ip.includes(":")
    ? ip.split(":").slice(0, 3).join(":") + "::/48"
    : ip.split(".").slice(0, 3).join(".") + ".0/24";
}

/**
 * The visitor id and the Set-Cookie that (re)asserts it. The cookie always
 * wins; the client's cid is only trusted when there is no cookie yet, so a
 * cleared localStorage never splits one visitor into two.
 */
export function identity(request, cid) {
  let vid = readCookie(request, "aeden_vid");
  if (!VID_RE.test(vid || "")) vid = VID_RE.test(cid || "") ? cid : hex(16);
  const cookie =
    `aeden_vid=${vid}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
  return { vid, cookie };
}

/** The owner's own browser, after visiting once with ?aeden_notrack=1. */
export function isNoTrack(request) {
  return readCookie(request, "aeden_notrack") === "1";
}

export function respond(body, status = 200, cookies = []) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, private",
    "access-control-allow-origin": "*",
  });
  for (const c of cookies) if (c) headers.append("set-cookie", c);
  return new Response(JSON.stringify(body), { status, headers });
}

export function refHost(ref) {
  if (!ref) return null;
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    return h && h !== "aeden.me" ? h : null;
  } catch (_) { return null; }
}

export function firstLang(request) {
  const al = request.headers.get("accept-language");
  if (!al) return null;
  const tag = al.split(",")[0].split(";")[0].trim();
  return tag ? tag.slice(0, 16) : null;
}

const int = (v, lo, hi) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : null;
};
const str = (v, max) => (v == null ? null : String(v).slice(0, max) || null);
const clampMs = (ms, now) => {
  const n = Number(ms);
  if (!Number.isFinite(n)) return now;
  // Anything more than a day off either side is a broken client clock.
  return Math.max(now - DAY_MS, Math.min(now + 60e3, n));
};

/**
 * Everything about the request that every row wants: geography from
 * request.cf, browser and OS from the UA, viewport and screen from the
 * client. Shared by collect(), replay() and the lookup's record().
 */
export function context(request, client = {}) {
  const cf = request.cf || {};
  const ua = request.headers.get("user-agent") || "";
  const p = parseUA(ua);
  const ip = request.headers.get("CF-Connecting-IP") || "";
  return {
    ua,
    bot: p.bot,
    net: netOf(ip),
    country: cf.country || null,
    city: cf.city || null,
    region: cf.region || cf.regionCode || null,
    timezone: cf.timezone || null,
    protocol: cf.httpProtocol || null,
    lat: cf.latitude != null ? Number(cf.latitude) : null,
    lon: cf.longitude != null ? Number(cf.longitude) : null,
    lang: firstLang(request),
    // The client's own device bucket wins when present: it has seen the
    // pointer type and viewport, which the UA alone cannot.
    device: /^(mobile|tablet|desktop)$/.test(client.device || "") ? client.device : p.device,
    browser: p.browser,
    os: p.os,
    vw: int(client.vw, 0, 20000), vh: int(client.vh, 0, 20000),
    sw: int(client.sw, 0, 20000), sh: int(client.sh, 0, 20000),
    // Pinned (test) sessions carry the peek_ip cookie the debug flow sets.
    test: readCookie(request, "peek_ip") ? 1 : 0,
  };
}

/* --------------------------------------------------------- upserts (SQL) -- */

/** visitors: identity + latest dimensions. Company is sticky. */
export function visitorUpsert(db, vid, at, c, company = "", domain = null) {
  return db.prepare(
    `INSERT INTO visitors (visitor_id, first_seen_at, last_seen_at, company, domain, net, country, city, region, device, browser, os, test)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(visitor_id) DO UPDATE SET
       first_seen_at = MIN(visitors.first_seen_at, excluded.first_seen_at),
       last_seen_at  = MAX(visitors.last_seen_at, excluded.last_seen_at),
       company = CASE WHEN excluded.company != '' THEN excluded.company ELSE visitors.company END,
       domain  = COALESCE(excluded.domain, visitors.domain),
       net = excluded.net, country = excluded.country, city = excluded.city, region = excluded.region,
       device = COALESCE(excluded.device, visitors.device),
       browser = COALESCE(excluded.browser, visitors.browser),
       os = COALESCE(excluded.os, visitors.os),
       test = MAX(visitors.test, excluded.test)`
  ).bind(vid, at, at, company || "", domain, c.net, c.country, c.city, c.region, c.device, c.browser, c.os, c.test);
}

/**
 * sessions, from the employer lookup: identity, geography and the company
 * columns. Tallies are left alone — they belong to collect().
 */
export function sessionFromLookup(db, sid, vid, at, c, answer, path, referrer) {
  return db.prepare(
    `INSERT INTO sessions (session_id, visitor_id, started_at, last_seen_at, landing_path, referrer, ref_host,
        company, domain, type, asn, net, country, city, region, timezone, protocol, lang,
        device, browser, os, vw, vh, sw, sh, test)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(session_id) DO UPDATE SET
       visitor_id   = COALESCE(sessions.visitor_id, excluded.visitor_id),
       started_at   = MIN(sessions.started_at, excluded.started_at),
       last_seen_at = MAX(sessions.last_seen_at, excluded.last_seen_at),
       landing_path = COALESCE(sessions.landing_path, excluded.landing_path),
       referrer     = COALESCE(sessions.referrer, excluded.referrer),
       ref_host     = COALESCE(sessions.ref_host, excluded.ref_host),
       company = CASE WHEN excluded.company != '' THEN excluded.company ELSE sessions.company END,
       domain  = COALESCE(excluded.domain, sessions.domain),
       type    = COALESCE(excluded.type, sessions.type),
       asn     = COALESCE(excluded.asn, sessions.asn),
       net = COALESCE(sessions.net, excluded.net), country = COALESCE(sessions.country, excluded.country),
       city = COALESCE(sessions.city, excluded.city), region = COALESCE(sessions.region, excluded.region),
       timezone = COALESCE(sessions.timezone, excluded.timezone), protocol = COALESCE(sessions.protocol, excluded.protocol),
       lang = COALESCE(sessions.lang, excluded.lang),
       device = COALESCE(sessions.device, excluded.device), browser = COALESCE(sessions.browser, excluded.browser),
       os = COALESCE(sessions.os, excluded.os),
       vw = COALESCE(sessions.vw, excluded.vw), vh = COALESCE(sessions.vh, excluded.vh),
       sw = COALESCE(sessions.sw, excluded.sw), sh = COALESCE(sessions.sh, excluded.sh),
       test = MAX(sessions.test, excluded.test)`
  ).bind(
    sid, vid, at, at, path, referrer, refHost(referrer),
    answer.show ? answer.company : "", answer.domain || null, answer.type || null, answer.asn || null,
    c.net, c.country, c.city, c.region, c.timezone, c.protocol, c.lang,
    c.device, c.browser, c.os, c.vw, c.vh, c.sw, c.sh, c.test
  );
}

/* ------------------------------------------------------------- collect -- */

const EVENT_TYPES = {
  click: "click", rage: "rage_click", dead: "dead_click", copy: "copy", out: "outbound",
  dl: "download", vis: "visibility", pe: "page_end", custom: "custom",
};

export async function handleCollect(request, env, ctx) {
  if (request.method !== "POST") return respond({ error: "POST only" }, 405);
  if (Number(request.headers.get("content-length") || 0) > 600000) return respond({ error: "too large" }, 413);

  let body;
  try { body = await request.json(); } catch (_) { return respond({ error: "bad json" }, 400); }
  if (!body || typeof body !== "object") return respond({ error: "bad body" }, 400);

  const { vid, cookie } = identity(request, body.cid);
  const c = context(request, body);
  if (c.bot || isNoTrack(request) || !env.DB) return respond({ ok: true, skipped: true }, 200, [cookie]);
  if (!VID_RE.test(String(body.sid || ""))) return respond({ error: "bad sid" }, 400, [cookie]);

  ctx.waitUntil(store(env, body, vid, c).catch(() => {}));
  return respond({ ok: true }, 200, [cookie]);
}

async function store(env, body, vid, c) {
  const db = env.DB;
  const sid = body.sid;
  const now = Date.now();
  const skew = typeof body.ts === "number" && Math.abs(now - body.ts) < DAY_MS ? now - body.ts : 0;
  const iso = (ms) => new Date(clampMs(Number(ms) + skew, now)).toISOString();
  const nowISO = new Date(now).toISOString();

  const events = Array.isArray(body.events) ? body.events.slice(0, 200) : [];
  const heat = Array.isArray(body.heat) ? body.heat.slice(0, 500) : [];
  const stmts = [];

  let pv = 0, clicks = 0, rage = 0, dead = 0, active = 0, visible = 0, hidden = 0, maxScroll = 0;
  let landing = null, exit = null, landingRef = null, first = nowISO, last = nowISO;

  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const at = iso(ev.at);
    if (at < first) first = at;
    if (at > last) last = at;
    const path = str(ev.p, 300) || "/";
    const pvid = PVID_RE.test(String(ev.id || "")) ? ev.id : null;

    if (ev.t === "pv") {
      pv++;
      if (!landing) { landing = path; landingRef = str(ev.ref, 500); }
      exit = path;
      if (!pvid) continue;
      stmts.push(db.prepare(
        `INSERT INTO page_views (pvid, session_id, visitor_id, at, path, title, referrer, ref_host, device, vw, vh, why, test)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(pvid) DO UPDATE SET
           title = COALESCE(excluded.title, page_views.title),
           referrer = COALESCE(page_views.referrer, excluded.referrer),
           ref_host = COALESCE(page_views.ref_host, excluded.ref_host),
           why = COALESCE(page_views.why, excluded.why)`
      ).bind(pvid, sid, vid, at, path, str(ev.title, 120), str(ev.ref, 500), refHost(ev.ref), c.device,
             int(ev.vw, 0, 20000), int(ev.vh, 0, 20000), str(ev.why, 16), c.test));
      continue;
    }

    if (ev.t === "pe") {
      const a = int(ev.active, 0, 7 * DAY_MS) || 0, v = int(ev.visible, 0, 7 * DAY_MS) || 0;
      const h = int(ev.hidden, 0, 7 * DAY_MS) || 0, d = int(ev.dur, 0, 7 * DAY_MS) || 0;
      const s = int(ev.scroll, 0, 100) || 0;
      active += a; visible += v; hidden += h; if (s > maxScroll) maxScroll = s;
      exit = path;
      if (pvid) {
        stmts.push(db.prepare(
          `INSERT INTO page_views (pvid, session_id, visitor_id, at, ended_at, path, device, scroll_max, active_ms, visible_ms, hidden_ms, dur_ms, exit_why, test)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(pvid) DO UPDATE SET
             ended_at = excluded.ended_at,
             scroll_max = MAX(COALESCE(page_views.scroll_max, 0), excluded.scroll_max),
             active_ms = excluded.active_ms, visible_ms = excluded.visible_ms,
             hidden_ms = excluded.hidden_ms, dur_ms = excluded.dur_ms,
             exit_why = excluded.exit_why`
        ).bind(pvid, sid, vid, iso(Number(ev.at) - d), at, path, c.device, s, a, v, h, d, str(ev.why, 16), c.test));
      }
      stmts.push(eventInsert(db, sid, vid, pvid, at, "page_end", path, null, null, null, null, null, null,
        { scroll: s, active: a, visible: v, hidden: h, dur: d, why: str(ev.why, 16) }, c));
      continue;
    }

    const type = ev.t === "custom" ? "custom:" + (str(ev.name, 32) || "x") : EVENT_TYPES[ev.t];
    if (!type) continue;
    if (ev.t === "click") clicks++;
    else if (ev.t === "rage") rage++;
    else if (ev.t === "dead") dead++;

    let meta = null;
    if (ev.t === "copy") meta = { len: int(ev.len, 0, 1e6), text: str(ev.txt, 120) };
    else if (ev.t === "out" || ev.t === "dl") meta = { href: str(ev.href, 300) };
    else if (ev.t === "vis") meta = { state: str(ev.s, 12) };
    else if (ev.t === "rage") meta = { n: int(ev.n, 0, 100) };
    else if (ev.t === "custom") meta = { data: str(ev.meta, 500) };

    stmts.push(eventInsert(db, sid, vid, pvid, at, type, path, str(ev.sel, 400), str(ev.txt, 80),
      int(ev.x, -1e5, 1e5), int(ev.y, -1e5, 1e5), int(ev.vw, 0, 20000), int(ev.vh, 0, 20000), meta, c));
  }

  // The session row. Tallies add; dimensions from the client win over the
  // UA-only guess the lookup may have written first.
  stmts.push(db.prepare(
    `INSERT INTO sessions (session_id, visitor_id, started_at, last_seen_at, landing_path, exit_path, referrer, ref_host,
        net, country, city, region, timezone, protocol, lang, device, browser, os, vw, vh, sw, sh,
        page_views, events, clicks, rage_clicks, dead_clicks, max_scroll, active_ms, visible_ms, hidden_ms, test)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(session_id) DO UPDATE SET
       visitor_id   = COALESCE(sessions.visitor_id, excluded.visitor_id),
       started_at   = MIN(sessions.started_at, excluded.started_at),
       last_seen_at = MAX(sessions.last_seen_at, excluded.last_seen_at),
       landing_path = COALESCE(sessions.landing_path, excluded.landing_path),
       exit_path    = COALESCE(excluded.exit_path, sessions.exit_path),
       referrer     = COALESCE(sessions.referrer, excluded.referrer),
       ref_host     = COALESCE(sessions.ref_host, excluded.ref_host),
       net = COALESCE(sessions.net, excluded.net), country = COALESCE(sessions.country, excluded.country),
       city = COALESCE(sessions.city, excluded.city), region = COALESCE(sessions.region, excluded.region),
       timezone = COALESCE(sessions.timezone, excluded.timezone), protocol = COALESCE(sessions.protocol, excluded.protocol),
       lang = COALESCE(sessions.lang, excluded.lang),
       device = excluded.device, browser = excluded.browser, os = excluded.os,
       vw = excluded.vw, vh = excluded.vh, sw = excluded.sw, sh = excluded.sh,
       page_views  = sessions.page_views + excluded.page_views,
       events      = sessions.events + excluded.events,
       clicks      = sessions.clicks + excluded.clicks,
       rage_clicks = sessions.rage_clicks + excluded.rage_clicks,
       dead_clicks = sessions.dead_clicks + excluded.dead_clicks,
       max_scroll  = MAX(sessions.max_scroll, excluded.max_scroll),
       active_ms   = sessions.active_ms + excluded.active_ms,
       visible_ms  = sessions.visible_ms + excluded.visible_ms,
       hidden_ms   = sessions.hidden_ms + excluded.hidden_ms,
       test = MAX(sessions.test, excluded.test)`
  ).bind(
    sid, vid, first, last, landing, exit, landingRef, refHost(landingRef),
    c.net, c.country, c.city, c.region, c.timezone, c.protocol, c.lang, c.device, c.browser, c.os,
    c.vw, c.vh, c.sw, c.sh,
    pv, events.length, clicks, rage, dead, maxScroll, active, visible, hidden, c.test
  ));
  stmts.push(visitorUpsert(db, vid, last, c));

  // Heat cells. Test sessions are left out entirely — the owner clicking
  // around while pinned would otherwise paint the map.
  if (!c.test) {
    const day = last.slice(0, 10);
    for (const h of heat) {
      if (!h || typeof h !== "object") continue;
      const kind = h.k === "c" ? "c" : h.k === "m" ? "m" : null;
      const sel = str(h.s, 400);
      const cx = Number(h.x), cy = Number(h.y), n = int(h.n, 1, 100000);
      if (!kind || !sel || !(cx >= 0 && cx <= 1) || !(cy >= 0 && cy <= 1) || !n) continue;
      stmts.push(db.prepare(
        `INSERT INTO heat_points (day, page, device, kind, sel, cx, cy, n, w, h) VALUES (?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(day, page, device, kind, sel, cx, cy) DO UPDATE SET
           n = heat_points.n + excluded.n, w = excluded.w, h = excluded.h`
      ).bind(day, str(h.p, 300) || "/", c.device || "desktop", kind, sel,
             Math.round(cx * 100) / 100, Math.round(cy * 100) / 100, n, int(h.w, 0, 100000), int(h.h, 0, 100000)));
    }
  }

  await runBatches(db, stmts);
}

function eventInsert(db, sid, vid, pvid, at, type, path, selector, text, x, y, vw, vh, meta, c) {
  return db.prepare(
    `INSERT INTO events (session_id, visitor_id, pvid, at, type, path, selector, text, x, y, vw, vh, meta, device, test)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(sid, vid, pvid, at, type, path, selector, text, x, y, vw, vh,
         meta ? JSON.stringify(meta) : null, c.device, c.test);
}

/** D1 batches are atomic; keep them modest so one bad row cannot sink a whole flush. */
export async function runBatches(db, stmts, size = 40) {
  for (let i = 0; i < stmts.length; i += size) {
    try { await db.batch(stmts.slice(i, i + size)); } catch (_) { /* logging never throws */ }
  }
}

/* -------------------------------------------------------------- replay -- */

export async function handleReplay(request, env, ctx, url) {
  if (request.method !== "POST") return respond({ error: "POST only" }, 405);
  const q = url.searchParams;
  const sid = q.get("sid") || "";
  const seq = int(q.get("seq"), 1, 1e6);
  const { vid, cookie } = identity(request, q.get("cid"));
  const c = context(request, { device: q.get("d"), vw: q.get("vw"), vh: q.get("vh") });

  if (!VID_RE.test(sid) || !seq) return respond({ error: "bad sid/seq" }, 400, [cookie]);
  if (c.bot || isNoTrack(request)) return respond({ ok: true, skipped: true }, 200, [cookie]);
  if (!env.REPLAYS) return respond({ error: "no replay bucket bound" }, 503, [cookie]);
  if (Number(request.headers.get("content-length") || 0) > 8e6) return respond({ error: "too large" }, 413, [cookie]);

  const buf = await request.arrayBuffer();
  if (buf.byteLength < 2) return respond({ error: "empty" }, 400, [cookie]);
  const b = new Uint8Array(buf);
  const gz = b[0] === 0x1f && b[1] === 0x8b;
  if (!gz && b[0] !== 0x5b /* [ */) return respond({ error: "not a chunk" }, 400, [cookie]);

  const key = `replays/${sid}/${String(seq).padStart(6, "0")}.json${gz ? ".gz" : ""}`;
  const now = new Date().toISOString();
  const page = str(q.get("p"), 300) || "/";
  const from = int(q.get("from"), 0, 9e15), to = int(q.get("to"), 0, 9e15), n = int(q.get("n"), 0, 1e6);

  ctx.waitUntil((async () => {
    await env.REPLAYS.put(key, buf, {
      httpMetadata: { contentType: "application/json", contentEncoding: gz ? "gzip" : undefined },
      customMetadata: { sid, seq: String(seq), page, from: String(from || ""), to: String(to || ""), n: String(n || "") },
    });
    if (!env.DB) return;
    const db = env.DB;
    await runBatches(db, [
      db.prepare(
        `INSERT OR REPLACE INTO replay_chunks (session_id, seq, key, at, ts_from, ts_to, events, bytes, gz, page, vw, vh)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(sid, seq, key, now, from, to, n, buf.byteLength, gz ? 1 : 0, page, c.vw, c.vh),
      db.prepare(
        `INSERT INTO sessions (session_id, visitor_id, started_at, last_seen_at, landing_path, net, country, city, region,
            device, browser, os, vw, vh, replay_chunks, replay_bytes, test)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)
         ON CONFLICT(session_id) DO UPDATE SET
           visitor_id = COALESCE(sessions.visitor_id, excluded.visitor_id),
           last_seen_at = MAX(sessions.last_seen_at, excluded.last_seen_at),
           replay_chunks = sessions.replay_chunks + 1,
           replay_bytes = sessions.replay_bytes + excluded.replay_bytes`
      ).bind(sid, vid, now, now, page, c.net, c.country, c.city, c.region, c.device, c.browser, c.os, c.vw, c.vh,
             buf.byteLength, c.test),
      visitorUpsert(db, vid, now, c),
    ]);
  })().catch(() => {}));

  return respond({ ok: true, key }, 200, [cookie]);
}

/* --------------------------------------------------------------- reads -- */

/** `?since=` as an ISO floor, `?test=` as a WHERE fragment, `?limit=` bounded. */
function readParams(url, sinceISO, defLimit = 200, maxLimit = 2000) {
  const since = sinceISO(url.searchParams.get("since"));
  const test = url.searchParams.get("test");
  const testWhere = test === "0" ? "test = 0" : test === "1" ? "test = 1" : null;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || defLimit) || defLimit, 1), maxLimit);
  return { since, testWhere, limit };
}

function where(parts) {
  const w = parts.filter(Boolean);
  return w.length ? "WHERE " + w.join(" AND ") : "";
}

export async function handleRead(kind, rest, url, env, sinceISO) {
  if (!env.DB) return respond({ error: "no database bound" }, 503);
  const db = env.DB;
  const { since, testWhere, limit } = readParams(url, sinceISO);

  /* ---- sessions ------------------------------------------------------- */
  if (kind === "sessions") {
    if (rest[0]) {
      const sid = rest[0];
      if (!VID_RE.test(sid)) return respond({ error: "bad sid" }, 400);
      const [s, pv, ev, rc] = await db.batch([
        db.prepare(`SELECT * FROM sessions WHERE session_id = ?`).bind(sid),
        db.prepare(`SELECT * FROM page_views WHERE session_id = ? ORDER BY at`).bind(sid),
        db.prepare(`SELECT id, pvid, at, type, path, selector, text, x, y, vw, vh, meta FROM events
                    WHERE session_id = ? ORDER BY at LIMIT 2000`).bind(sid),
        db.prepare(`SELECT seq, key, at, ts_from, ts_to, events, bytes, gz, page, vw, vh FROM replay_chunks
                    WHERE session_id = ? ORDER BY seq`).bind(sid),
      ]);
      const session = s.results[0] || null;
      if (!session) return respond({ error: "not found" }, 404);
      return respond({ session, page_views: pv.results, events: ev.results, replay: rc.results });
    }
    const vid = url.searchParams.get("visitor");
    const binds = [];
    const w = [];
    if (since) { w.push("s.started_at >= ?"); binds.push(since); }
    if (vid && VID_RE.test(vid)) { w.push("s.visitor_id = ?"); binds.push(vid); }
    if (url.searchParams.get("replay") === "1") w.push("s.replay_chunks > 0");
    if (testWhere) w.push("s." + testWhere);
    const { results } = await db.prepare(
      `SELECT s.*,
         (SELECT GROUP_CONCAT(path, ' › ') FROM (SELECT path FROM page_views p WHERE p.session_id = s.session_id ORDER BY at)) AS paths
       FROM sessions s ${where(w)} ORDER BY s.started_at DESC LIMIT ?`
    ).bind(...binds, limit).all();
    return respond({ count: results.length, since, sessions: results });
  }

  /* ---- visitors ------------------------------------------------------- */
  if (kind === "visitors") {
    if (rest[0]) {
      const vid = rest[0];
      if (!VID_RE.test(vid)) return respond({ error: "bad visitor id" }, 400);
      const [v, s, pv, vis, ev] = await db.batch([
        db.prepare(`SELECT * FROM visitors WHERE visitor_id = ?`).bind(vid),
        db.prepare(`SELECT * FROM sessions WHERE visitor_id = ? ORDER BY started_at DESC LIMIT 200`).bind(vid),
        db.prepare(`SELECT pvid, session_id, at, ended_at, path, title, ref_host, device, vw, vh, scroll_max, active_ms, dur_ms, why, exit_why
                    FROM page_views WHERE visitor_id = ? ORDER BY at DESC LIMIT 1000`).bind(vid),
        db.prepare(`SELECT id, seen_at, session_id, company, domain, type, asn, net, country, city, path, referrer, ref_host,
                           device, browser, os, shown, reason, test
                    FROM visits WHERE visitor_id = ? ORDER BY seen_at DESC LIMIT 500`).bind(vid),
        db.prepare(`SELECT session_id, type, COUNT(*) AS n FROM events WHERE visitor_id = ? AND type != 'visibility'
                    GROUP BY session_id, type`).bind(vid),
      ]);
      const visitor = v.results[0] || null;
      if (!visitor) return respond({ error: "not found" }, 404);
      return respond({ visitor, sessions: s.results, page_views: pv.results, visits: vis.results, event_counts: ev.results });
    }
    const binds = [];
    const w = [];
    if (since) { w.push("v.last_seen_at >= ?"); binds.push(since); }
    if (testWhere) w.push("v." + testWhere);
    const { results } = await db.prepare(
      `SELECT v.*,
         (SELECT COUNT(*) FROM sessions s WHERE s.visitor_id = v.visitor_id) AS sessions_n,
         (SELECT COUNT(*) FROM page_views p WHERE p.visitor_id = v.visitor_id) AS pages_n,
         (SELECT COUNT(*) FROM visits x WHERE x.visitor_id = v.visitor_id) AS visits_n,
         (SELECT SUM(replay_chunks) FROM sessions s WHERE s.visitor_id = v.visitor_id) AS replay_chunks
       FROM visitors v ${where(w)} ORDER BY v.last_seen_at DESC LIMIT ?`
    ).bind(...binds, limit).all();
    return respond({ count: results.length, since, visitors: results });
  }

  /* ---- engagement ----------------------------------------------------- */
  if (kind === "engagement") {
    const pvW = where([since && "at >= ?", testWhere]);
    const evW = where([since && "at >= ?", testWhere, "type IN ('click','rage_click','dead_click')"]);
    const tyW = where([since && "at >= ?", testWhere]);
    const b = since ? [since] : [];
    const [pages, clicks, types, hourly] = await db.batch([
      db.prepare(
        `SELECT path, COUNT(*) AS views,
                COUNT(ended_at) AS ended,
                AVG(active_ms) AS active_avg, AVG(visible_ms) AS visible_avg, AVG(dur_ms) AS dur_avg,
                AVG(scroll_max) AS scroll_avg,
                SUM(CASE WHEN scroll_max >= 25 THEN 1 ELSE 0 END) AS s25,
                SUM(CASE WHEN scroll_max >= 50 THEN 1 ELSE 0 END) AS s50,
                SUM(CASE WHEN scroll_max >= 75 THEN 1 ELSE 0 END) AS s75,
                SUM(CASE WHEN scroll_max >= 90 THEN 1 ELSE 0 END) AS s90,
                COUNT(DISTINCT session_id) AS sessions
         FROM page_views ${pvW} GROUP BY path ORDER BY views DESC LIMIT 200`
      ).bind(...b),
      db.prepare(
        `SELECT path, selector, type, MIN(text) AS text, COUNT(*) AS n, COUNT(DISTINCT session_id) AS sessions
         FROM events ${evW} GROUP BY path, selector, type ORDER BY n DESC LIMIT 600`
      ).bind(...b),
      db.prepare(`SELECT type, COUNT(*) AS n FROM events ${tyW} GROUP BY type`).bind(...b),
      db.prepare(
        `SELECT substr(at, 1, 13) AS hour, COUNT(*) AS views FROM page_views ${pvW} GROUP BY hour ORDER BY hour`
      ).bind(...b),
    ]);
    return respond({ since, pages: pages.results, clicks: clicks.results, types: types.results, hourly: hourly.results });
  }

  /* ---- heat ----------------------------------------------------------- */
  if (kind === "heat") {
    const day = since ? since.slice(0, 10) : null;
    const page = url.searchParams.get("page");
    const device = url.searchParams.get("device");
    const hk = url.searchParams.get("kind") === "m" ? "m" : "c";
    const pw = where([day && "day >= ?"]);
    const pagesQ = db.prepare(
      `SELECT page, device, kind, SUM(n) AS n FROM heat_points ${pw} GROUP BY page, device, kind ORDER BY n DESC`
    ).bind(...(day ? [day] : []));
    if (!page) {
      const { results } = await pagesQ.all();
      return respond({ since, pages: results, cells: [] });
    }
    const binds = [];
    const w = [];
    if (day) { w.push("day >= ?"); binds.push(day); }
    w.push("page = ?"); binds.push(page.slice(0, 300));
    w.push("kind = ?"); binds.push(hk);
    if (device && /^(mobile|tablet|desktop)$/.test(device)) { w.push("device = ?"); binds.push(device); }
    const [pages, cells] = await db.batch([
      pagesQ,
      db.prepare(
        `SELECT sel, cx, cy, SUM(n) AS n, MAX(w) AS w, MAX(h) AS h FROM heat_points ${where(w)}
         GROUP BY sel, cx, cy ORDER BY n DESC LIMIT 30000`
      ).bind(...binds),
    ]);
    return respond({ since, page, device: device || "all", kind: hk, pages: pages.results, cells: cells.results });
  }

  /* ---- replay --------------------------------------------------------- */
  if (kind === "replay") {
    const sid = rest[0] || "";
    if (!VID_RE.test(sid)) return respond({ error: "bad sid" }, 400);
    if (!rest[1]) {
      const { results } = await db.prepare(
        `SELECT seq, key, at, ts_from, ts_to, events, bytes, gz, page, vw, vh FROM replay_chunks
         WHERE session_id = ? ORDER BY seq`
      ).bind(sid).all();
      return respond({ sid, chunks: results });
    }
    const seq = int(rest[1], 1, 1e6);
    if (!seq) return respond({ error: "bad seq" }, 400);
    if (!env.REPLAYS) return respond({ error: "no replay bucket bound" }, 503);
    const row = await db.prepare(`SELECT key, gz FROM replay_chunks WHERE session_id = ? AND seq = ?`)
      .bind(sid, seq).first();
    if (!row) return respond({ error: "not found" }, 404);
    const obj = await env.REPLAYS.get(row.key);
    if (!obj) return respond({ error: "blob missing" }, 404);
    const headers = new Headers({
      "content-type": "application/json",
      "cache-control": "private, max-age=3600",
      "access-control-allow-origin": "*",
    });
    // The bytes are already gzip when gz = 1. encodeBody "manual" tells the
    // runtime not to compress them a second time; the browser inflates once
    // and the dashboard's fetch().json() just works.
    if (row.gz) headers.set("content-encoding", "gzip");
    return new Response(obj.body, { headers, encodeBody: row.gz ? "manual" : "automatic" });
  }

  return respond({ error: "unknown endpoint" }, 404);
}
