/**
 * Visitor alerts — the webhook and email that tell you someone is on the site.
 *
 * Split out of index.js because the decision to alert no longer belongs to the
 * lookup. It used to: /api/visitor fired an alert the moment it resolved an IP,
 * roughly 1.2s into a visit. That is the only moment at which *nothing* about
 * the visit is known yet beyond its network, which is why the inbox filled with
 * crawlers.
 *
 * A month of logged sessions made the point plainly. Grouped by the lookup's
 * own `datacenter-or-vpn` verdict, the two halves of that bucket look nothing
 * alike:
 *
 *   synthetic   1 page view, 0 clicks, scroll stuck at exactly 36%, under a
 *               second of visible time, UA rotating between requests from the
 *               same /24 — AWS, Azure and IBM ranges
 *   human       3 page views, 8-10 clicks, scroll to 100%, two to eight
 *               minutes on the page — nearly all of it Cloudflare WARP, which
 *               is just people running 1.1.1.1 on a laptop or phone
 *
 * Dropping the whole bucket on the IP verdict would have silenced twelve real
 * readers, including the two most engaged visitors of the month. Engagement
 * separates them and the network does not, so the alert now waits for the
 * tracker to prove a human is there.
 *
 * The cost of waiting is real and worth stating: an alert arrives tens of
 * seconds into a visit rather than instantly, and a visitor who bounces
 * immediately never produces one at all.
 */

const DAY_MS = 86400e3;

/** Interaction that no observed crawler produced, and every observed human did. */
const ACTIVE_MS_MIN = 1000;

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
 * Send an alert email through the Google Apps Script relay.
 *
 * Apps Script hands out a public /exec URL that runs as the Google account
 * that deployed it, so MailApp.sendEmail posts from that account's Gmail with
 * no API key, no sending domain and no DNS — which is what makes this the one
 * free way to get real email out of a Worker here. Cloudflare's own Email
 * Sending needs Workers Paid, and Email Routing is zone-level: enabling it
 * would rewrite aeden.me's MX and break SimpleLogin. See README.
 *
 * The URL carries no auth of its own — anyone who learns it could make the
 * account send mail — so every payload is signed with a shared secret that
 * relay.gs checks before it does anything.
 *
 * Both halves must be set or this is a no-op, same as ALERT_WEBHOOK.
 */
async function mail(env, subject, text) {
  if (!env.MAIL_RELAY_URL || !env.MAIL_RELAY_SECRET) return;
  return fetch(env.MAIL_RELAY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // script.google.com answers 302 to googleusercontent.com; Workers' fetch
    // follows that on its own. Apps Script is slow (~1-2s) next to a webhook,
    // but every caller runs inside ctx.waitUntil so nobody is kept waiting.
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ secret: env.MAIL_RELAY_SECRET, subject, text }),
  });
}

/**
 * Fan one alert out to every channel that is configured. `head` is the whole
 * story in one line (and the email subject); `detail` is the supporting line.
 * The webhook gets them joined, exactly as it did when it was the only sink.
 * Channels are independent: either can be removed by clearing its secret, and
 * one failing never stops the other.
 */
export const alert = (env, head, detail) =>
  Promise.all([
    notify(env.ALERT_WEBHOOK, `${head}\n${detail}`).catch(() => {}),
    mail(env, head, detail).catch(() => {}),
  ]);

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const fmtDays = (ms) => {
  const d = ms / DAY_MS;
  return d < 1.5 ? "a day" : d < 60 ? `${Math.round(d)} days` : `${Math.round(d / 30)} months`;
};

/** First caller for `key` wins. KV is best-effort: without it, alert anyway. */
async function once(env, key, ttl = 86400) {
  if (!env.VISITOR_CACHE) return true;
  try {
    if (await env.VISITOR_CACHE.get(key)) return false;
    await env.VISITOR_CACHE.put(key, "1", { expirationTtl: ttl });
  } catch (_) { /* fall through */ }
  return true;
}

/**
 * Has this session shown a human?
 *
 * Three signals, any one of which is enough. All three come from the logged
 * sessions described at the top of this file: no crawler produced any of them,
 * and no human session produced none of them.
 *
 *   moved        a mouse-move heat cell in this batch. The sharpest signal in
 *                the data — across a month, every synthetic /24 produced
 *                exactly zero heat rows while the humans produced hundreds —
 *                and the earliest, since heat ships with every 5s batch.
 *   clicks       also per-batch, and the signal that covers touch devices,
 *                which never emit a mouse move.
 *   active_ms    the fallback for a reader who scrolls without touching
 *                anything. It only accumulates from `page_end`, so on its own
 *                it would not fire until the visitor left; the other two are what
 *                keep the alert timely.
 *
 * Scroll depth is deliberately unused — the crawlers report a confident 36%
 * without anyone touching anything.
 */
const engaged = (s, moved) =>
  moved || Number(s.clicks) > 0 || Number(s.active_ms) >= ACTIVE_MS_MIN;

/**
 * Alert on a session once it has proved a human is on the page.
 *
 * Called from the collect handler after each batch of events lands, so it runs
 * repeatedly for one session; the KV claim keeps that to a single alert. Reads
 * the session's own row rather than taking the caller's tallies, because the
 * interesting thresholds are crossed by the *accumulated* totals, not by any
 * one batch.
 *
 * Three headlines, unchanged from when the lookup sent them:
 *   🆕  a company never seen before
 *   ↩️  a company — or an anonymous visitor — back after more than 24 hours
 *   👀  a company seen again within 24 hours
 */
export async function maybeAlertSession(env, sid, moved = false) {
  if (!sid || !env.DB || (!env.ALERT_WEBHOOK && !env.MAIL_RELAY_URL)) return;

  let s;
  try {
    s = await env.DB.prepare(
      `SELECT s.*, (SELECT v.reason FROM visits v
                     WHERE v.session_id = s.session_id AND v.reason IS NOT NULL
                     ORDER BY v.seen_at LIMIT 1) AS reason
         FROM sessions s WHERE s.session_id = ?`
    ).bind(sid).first();
  } catch (_) {
    return;
  }
  if (!s || s.test || !engaged(s, moved)) return;

  // Claimed only once the session is worth alerting on, so a crawler's session
  // never burns the key and a later real visit on the same id still reports.
  if (!(await once(env, `alerted:${sid}`, 21600))) return;

  const now = Date.now();
  const company = s.company || "";

  // Prior history, this session excluded so "first time" and "days since" are
  // both honest. Sessions rather than visits: one arrival, one row.
  let coPrev = null, vidPrev = null;
  try {
    const reads = [];
    if (company) {
      reads.push(env.DB.prepare(
        `SELECT MAX(last_seen_at) AS last, COUNT(*) AS n FROM sessions
          WHERE company = ? AND test = 0 AND session_id != ?`
      ).bind(company, sid));
    }
    if (s.visitor_id) {
      reads.push(env.DB.prepare(
        `SELECT MAX(last_seen_at) AS last, COUNT(*) AS n FROM sessions
          WHERE visitor_id = ? AND test = 0 AND session_id != ?`
      ).bind(s.visitor_id, sid));
    }
    const res = reads.length ? await env.DB.batch(reads) : [];
    if (company) coPrev = res[0] && res[0].results[0];
    if (s.visitor_id) { const r = res[company ? 1 : 0]; vidPrev = r && r.results[0]; }
  } catch (_) {
    /* headlines degrade to the first-time wording */
  }

  const where = [s.city, s.country].filter(Boolean).join(", ");
  const dev = [s.device, s.browser, s.os].filter(Boolean).join(" · ");
  // How long they actually stayed, which is the whole reason this alert waited.
  // active_ms lands only at page_end, so a still-reading visitor shows 0 here.
  // Say "reading now" rather than "0s active", which reads like a bounce.
  const secs = Math.round(Number(s.active_ms) / 1000);
  const spent =
    (secs ? `${secs < 60 ? `${secs}s` : `${Math.round(secs / 60)}m`} active` : "reading now") +
    ` · ${plural(Number(s.page_views) || 1, "page")} · ${s.max_scroll || 0}% scrolled` +
    (Number(s.clicks) ? ` · ${plural(Number(s.clicks), "click")}` : "");

  const vidPrevMs = vidPrev && vidPrev.last ? Date.parse(vidPrev.last) : NaN;
  const vidBack = Number.isFinite(vidPrevMs) && now - vidPrevMs > DAY_MS;

  if (company) {
    const prevMs = coPrev && coPrev.last ? Date.parse(coPrev.last) : NaN;
    let head;
    if (!Number.isFinite(prevMs)) head = `🆕 ${company} visited aeden.me for the first time`;
    else if (now - prevMs > DAY_MS) {
      head = `↩️ ${company} is back after ${fmtDays(now - prevMs)} — ${plural(Number(coPrev.n) + 1, "visit")} total`;
    } else head = `👀 ${company} just visited aeden.me`;
    // Everything that identifies the visit goes in `head` so it survives as an
    // email subject on its own; `detail` is the technical line under it.
    if (where) head += ` — from ${where}`;
    if (s.domain) head += ` (${s.domain})`;
    await alert(
      env,
      head,
      `${spent}\n${s.net} · AS${s.asn || "?"} · ${s.type || "?"}` +
        (dev ? ` · ${dev}` : "") +
        (s.landing_path && s.landing_path !== "/" ? ` · ${s.landing_path}` : "") +
        (vidBack ? `\nsame browser last here ${fmtDays(now - vidPrevMs)} ago · ${plural(Number(vidPrev.n) + 1, "visit")}` : "")
    );
    return;
  }

  // No employer resolved: still an alert, just a thinner one. The subject says
  // which of the three this is so the inbox is skimmable without opening it.
  const head = vidBack
    ? `↩️ a returning visitor is back after ${fmtDays(now - vidPrevMs)} — ${plural(Number(vidPrev.n) + 1, "visit")} total`
    : vidPrev && Number(vidPrev.n) > 0
      ? `👀 someone is back on aeden.me — ${plural(Number(vidPrev.n) + 1, "visit")} total`
      : `👋 a new visitor is on aeden.me`;
  await alert(
    env,
    head + (where ? ` · ${where}` : "") + (dev ? ` · ${dev}` : ""),
    `${spent}\n${s.net} · ${s.reason || "no employer"}` +
      (s.landing_path && s.landing_path !== "/" ? ` · ${s.landing_path}` : "")
  );
}
