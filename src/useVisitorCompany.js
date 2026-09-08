import { useEffect, useState } from "react";

const ENDPOINT = "/api/visitor";
const DISMISS_KEY = "aeden:visitor-peek-dismissed";

/**
 * The analytics tracker (public/track.js) owns the session id. Read it from
 * there when it has loaded; fall back to the same localStorage key it writes
 * so the lookup still lands on the right session if the script is blocked or
 * simply has not run yet.
 */
function currentSession() {
  try {
    if (window.__aeden && typeof window.__aeden.sid === "function") return window.__aeden.sid();
    const sid = window.localStorage.getItem("aeden:sid");
    return sid && /^[a-f0-9]{32}$/.test(sid) ? sid : null;
  } catch (_) {
    return null;
  }
}

function currentRoute() {
  const h = window.location.hash || "";
  if (h.indexOf("#/") === 0) return h.slice(1).split("?")[0] || "/";
  return window.location.pathname || "/";
}

/**
 * Resolves the visitor's employer via the Cloudflare Worker at /api/visitor.
 *
 * Returns null in every uninteresting case — no match, a home ISP, a
 * datacenter, a VPN, an earlier dismissal, or the endpoint being unreachable.
 * Callers can treat a non-null value as "worth greeting".
 *
 * The call doubles as the visit log entry, so it carries what the Worker
 * cannot see from the request alone: the route, the session id, viewport and
 * screen size, timezone and the real document.referrer (the Referer header on
 * a same-origin fetch is just our own page).
 *
 * Two testing modes:
 *   ?visitor=Apple            — pure UI. Skips the network entirely.
 *   ?ip=17.253.144.10&debug=T — real end-to-end. Runs the actual Worker
 *                               lookup against a spoofed IP. Requires the
 *                               DEBUG_TOKEN, which the Worker verifies, so a
 *                               stranger passing ?ip= is simply ignored.
 */
export default function useVisitorCompany({ delay = 1200 } = {}) {
  const [visitor, setVisitor] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    // Inside a frame — the dashboard's heatmap preview loads the live site in
    // an iframe — nobody is visiting, so neither greet nor log.
    try {
      if (window.top !== window.self) return undefined;
    } catch (_) {
      return undefined;
    }

    try {
      if (window.sessionStorage.getItem(DISMISS_KEY)) return undefined;
    } catch (_) {
      /* private mode — carry on without persistence */
    }

    const params = new URLSearchParams(window.location.search);

    const override = params.get("visitor");
    if (override) {
      const id = setTimeout(
        () => setVisitor({ company: override, domain: null, preview: true }),
        delay
      );
      return () => clearTimeout(id);
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      // Built here, not above, so the tracker has had its `defer` turn and the
      // session id is the one it is batching events under.
      const probe = new URLSearchParams();
      // Forward the spoof params so the real lookup path can be exercised in prod.
      if (params.get("ip")) probe.set("ip", params.get("ip"));
      if (params.get("debug")) probe.set("debug", params.get("debug"));
      probe.set("from", currentRoute());
      const sid = currentSession();
      if (sid) probe.set("sid", sid);
      try {
        const cid = window.localStorage.getItem("aeden:cid");
        if (cid && /^[a-f0-9]{32}$/.test(cid)) probe.set("cid", cid);
      } catch (_) {
        /* no storage */
      }
      probe.set("vw", String(window.innerWidth));
      probe.set("vh", String(window.innerHeight));
      probe.set("sw", String(window.screen.width));
      probe.set("sh", String(window.screen.height));
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) probe.set("tz", tz);
      } catch (_) {
        /* no Intl */
      }
      if (document.referrer) probe.set("ref", document.referrer.slice(0, 500));

      try {
        const res = await fetch(`${ENDPOINT}?${probe}`, {
          signal: controller.signal,
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data && data.show && data.company) {
          setVisitor({ company: data.company, domain: data.domain || null });
        }
      } catch (_) {
        /* offline, blocked, or the Worker is down — stay silent */
      }
    }, delay);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [delay]);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch (_) {
      /* best-effort */
    }
    setVisitor(null);
  };

  return [visitor, dismiss];
}
