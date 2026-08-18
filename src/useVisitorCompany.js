import { useEffect, useState } from "react";

const ENDPOINT = "/api/visitor";
const DISMISS_KEY = "aeden:visitor-peek-dismissed";

/**
 * Resolves the visitor's employer via the Cloudflare Worker at /api/visitor.
 *
 * Returns null in every uninteresting case — no match, a home ISP, a
 * datacenter, a VPN, an earlier dismissal, or the endpoint being unreachable.
 * Callers can treat a non-null value as "worth greeting".
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

    // Forward the spoof params so the real lookup path can be exercised in prod.
    const probe = new URLSearchParams();
    if (params.get("ip")) probe.set("ip", params.get("ip"));
    if (params.get("debug")) probe.set("debug", params.get("debug"));
    const endpoint = probe.toString() ? `${ENDPOINT}?${probe}` : ENDPOINT;

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(endpoint, { signal: controller.signal });
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
