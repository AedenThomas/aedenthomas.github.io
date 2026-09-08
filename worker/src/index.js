/**
 * Visitor company lookup for aeden.me
 *
 * Resolves the visiting IP to an employer and decides whether it's worth
 * greeting them. Runs first-party at aeden.me/api/visitor so ad blockers
 * never see a third-party request and the upstream keys stay server-side.
 *
 * Providers: ipapi.is primary (no key, 1000/day), ipregistry fallback.
 *
 * The same Worker is also the backend for the site's self-hosted analytics —
 * event batches, heat cells and rrweb replay chunks from public/aeden.js, and
 * the read endpoints the dashboard uses. That side lives in analytics.js;
 * this file keeps the lookup, the log, the alerts and the routing.
 */

// Single self-contained page, no bundle and no GitHub Pages deploy. The Text
// module rule in wrangler.toml is what stops esbuild parsing it as code.
import DASHBOARD from "./dashboard.html";
import {
  VID_RE, identity, context, isNoTrack, respond, readCookie, netOf, refHost,
  visitorUpsert, sessionFromLookup, runBatches,
  handleCollect, handleReplay, handleRead,
} from "./analytics.js";

const DAY_MS = 86400e3;

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

/**
 * The registrable domain — the part that identifies the company, with the
 * regional and departmental subdomains dropped. us.ibm.com -> ibm.com.
 *
 * The full Public Suffix List is far too large to ship in a Worker, so this
 * carries only the multi-part suffixes an employer is plausibly registered
 * under. A miss costs one label — "bbc.co.uk" would reduce to "co.uk" and
 * greet the visitor as "Co" — which is why the list leans on the ccTLDs that
 * actually turn up in the log rather than trying to be complete.
 */
const MULTI_SUFFIX = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "ltd.uk", "plc.uk", "net.uk",
  "co.in", "net.in", "org.in", "ac.in", "gov.in", "edu.in", "res.in", "firm.in",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.nz", "net.nz", "org.nz", "ac.nz", "govt.nz",
  "co.za", "org.za", "ac.za", "gov.za",
  "co.jp", "ne.jp", "or.jp", "ac.jp", "go.jp",
  "co.kr", "or.kr", "re.kr", "go.kr",
  "com.cn", "net.cn", "org.cn", "edu.cn", "gov.cn", "ac.cn",
  "com.hk", "org.hk", "edu.hk", "gov.hk",
  "com.sg", "edu.sg", "gov.sg", "org.sg",
  "com.my", "com.ph", "com.vn", "com.tw", "com.tr", "com.pk", "com.bd",
  "com.br", "net.br", "org.br", "gov.br", "edu.br",
  "com.mx", "com.ar", "com.co", "com.pe", "com.ve", "com.uy",
  "co.il", "org.il", "ac.il", "gov.il",
  "co.id", "or.id", "ac.id", "go.id",
  "com.sa", "com.eg", "com.ng", "co.ke", "com.gh",
  "com.es", "com.pt", "com.pl", "com.ua", "com.ru", "com.ro", "com.gr",
]);

function registrableDomain(host) {
  if (!host) return null;
  const parts = String(host).trim().toLowerCase().replace(/^\.+|\.+$/g, "").split(".");
  if (parts.length < 2 || parts.some((p) => !p)) return null;
  const take = MULTI_SUFFIX.has(parts.slice(-2).join(".")) ? 3 : 2;
  if (parts.length < take) return null;
  return parts.slice(-take).join(".");
}

/**
 * Display names the domain label alone gets wrong, keyed by registrable domain.
 *
 * This map is doing the work no rule could. Every heuristic tried in its place
 * broke on something real: "a short label is an acronym" turns Uber into UBER,
 * and "match the capitalisation in the registry name" is no help when the whole
 * record is already shouting ("LOWES SERVICES INDIA"). Punctuation — Lowe's,
 * L'Oréal, P&G — is not recoverable from a domain at all.
 *
 * Entries are only worth adding where labelToName() would be wrong. Domains
 * that already resolve correctly (apple.com, google.com, deloitte.com) are
 * deliberately absent.
 */
const ALIASES = new Map(Object.entries({
  // Acronyms whose label carries a vowel, so labelToName() would title-case it
  "ibm.com": "IBM", "sap.com": "SAP", "ge.com": "GE", "gm.com": "GM",
  "aig.com": "AIG", "ups.com": "UPS", "kfc.com": "KFC", "amd.com": "AMD",
  "sas.com": "SAS", "asml.com": "ASML", "nato.int": "NATO", "nasa.gov": "NASA",
  "noaa.gov": "NOAA", "nih.gov": "NIH", "cdc.gov": "CDC", "esa.int": "ESA",
  "mit.edu": "MIT", "ucla.edu": "UCLA", "usc.edu": "USC", "nyu.edu": "NYU",
  "iisc.ac.in": "IISc", "3m.com": "3M", "7-eleven.com": "7-Eleven",
  // Acronyms with mixed case no rule would guess
  "pwc.com": "PwC", "ey.com": "EY", "kpmg.com": "KPMG", "bdo.com": "BDO",
  "hcltech.com": "HCLTech", "tcs.com": "TCS", "ltimindtree.com": "LTIMindtree",
  // Possessives and punctuation — unrecoverable from a domain
  "lowes.com": "Lowe's", "mcdonalds.com": "McDonald's", "macys.com": "Macy's",
  "kohls.com": "Kohl's", "sainsburys.co.uk": "Sainsbury's", "levi.com": "Levi's",
  "loreal.com": "L'Oréal", "dominos.com": "Domino's", "wendys.com": "Wendy's",
  "traderjoes.com": "Trader Joe's", "victoriassecret.com": "Victoria's Secret",
  "pg.com": "P&G", "jnj.com": "Johnson & Johnson", "jpmorgan.com": "J.P. Morgan",
  "att.com": "AT&T", "hm.com": "H&M", 
  // Multi-word names run together in the label
  "bestbuy.com": "Best Buy", "homedepot.com": "The Home Depot",
  "statefarm.com": "State Farm", "johndeere.com": "John Deere",
  "lockheedmartin.com": "Lockheed Martin", "northropgrumman.com": "Northrop Grumman",
  "generalmotors.com": "General Motors", "americanexpress.com": "American Express",
  "goldmansachs.com": "Goldman Sachs", "gs.com": "Goldman Sachs",
  "morganstanley.com": "Morgan Stanley", "bankofamerica.com": "Bank of America",
  "wellsfargo.com": "Wells Fargo", "unitedhealthgroup.com": "UnitedHealth Group",
  "charlesschwab.com": "Charles Schwab", "deutschebank.com": "Deutsche Bank",
  "db.com": "Deutsche Bank", "bnpparibas.com": "BNP Paribas",
  "standardchartered.com": "Standard Chartered", "techmahindra.com": "Tech Mahindra",
  "creditsuisse.com": "Credit Suisse",
  "jpmorganchase.com": "JPMorganChase", "royalmail.com": "Royal Mail",
  "marksandspencer.com": "Marks & Spencer", "rollsroyce.com": "Rolls-Royce",
  "virginmedia.com": "Virgin Media", "britishairways.com": "British Airways",
  // Internal capitalisation
  "youtube.com": "YouTube", "linkedin.com": "LinkedIn", "github.com": "GitHub",
  "gitlab.com": "GitLab", "paypal.com": "PayPal", "ebay.com": "eBay",
  "servicenow.com": "ServiceNow", "mongodb.com": "MongoDB", "redhat.com": "Red Hat",
  "vmware.com": "VMware", "tiktok.com": "TikTok", "bytedance.com": "ByteDance",
  "doordash.com": "DoorDash", "deepmind.com": "DeepMind", "openai.com": "OpenAI",
  "tsmc.com": "TSMC", "hpe.com": "HPE",
  "hp.com": "HP", "lg.com": "LG", "bmw.com": "BMW", "bmw.de": "BMW",
  "abb.com": "ABB", "ntt.com": "NTT", "dhl.com": "DHL", "ubs.com": "UBS",
  "rbc.com": "RBC", "bbc.co.uk": "BBC", "nhs.uk": "NHS", "bt.com": "BT",
  // Universities whose label is not how anyone says the name
  "ox.ac.uk": "Oxford", "cam.ac.uk": "Cambridge", "ucl.ac.uk": "UCL",
  "ed.ac.uk": "the University of Edinburgh", "imperial.ac.uk": "Imperial College London",
  "lse.ac.uk": "LSE", "kcl.ac.uk": "King's College London",
  "manchester.ac.uk": "the University of Manchester",
  "berkeley.edu": "UC Berkeley", "cmu.edu": "Carnegie Mellon",
  "gatech.edu": "Georgia Tech", "caltech.edu": "Caltech",
}));

/** Only these count as vowels for the acronym test — "sky" and "byte" are words. */
const VOWELS = /[aeiouy]/;

/**
 * A domain label rendered as a name. Hyphens become spaces
 * ("tech-mahindra" -> "Tech Mahindra") and a short vowel-free token is read as
 * an acronym, which is safe because no English word lacks all of a, e, i, o
 * and u — and, with y included, "sky" and "gym" stay words rather than becoming
 * SKY and GYM.
 */
function labelToName(label) {
  if (!label || label.length < 2) return null;
  return label
    .split("-")
    .filter(Boolean)
    .map((tok) =>
      tok.length <= 5 && !VOWELS.test(tok)
        ? tok.toUpperCase()
        : tok.charAt(0).toUpperCase() + tok.slice(1)
    )
    .join(" ");
}

/**
 * Regional tails on a registry record. Only ever applied to the org-name
 * fallback, and deliberately limited to place names — the generic words around
 * them (Services, Solutions, Technologies) are part of real company names, as
 * the SUFFIXES comment above records the hard way.
 */
const REGION_TAIL =
  /[\s,]+\(?(india|emea|apac|apj|latam|americas?|europe|uk|u\.k\.|usa|u\.s\.a?\.?|canada|deutschland|france|japan|china|singapore|australia|philippines|ireland|global|international)\)?\.?$/i;

function stripRegionTail(name) {
  if (!name) return null;
  let out = String(name).trim();
  for (let i = 0; i < 2; i++) {
    const next = out.replace(REGION_TAIL, "").trim();
    if (next === out || !next) break;
    out = next;
  }
  return out || null;
}

/**
 * Names that are registry plumbing rather than a company: ARIN netblock handles
 * ("IBMC-20", "NET-24-104-0-0-1") and anything else carrying a digit. Used only
 * on the org-name fallback, where a bad name is the exact failure this whole
 * path exists to avoid — a greeting that never fires is invisible, a wrong one
 * is not.
 *
 * Note what is deliberately *not* here: a word count or a tight length cap.
 * Both read as good proxies for junk and both are wrong — "King Abdul Aziz City
 * for Science and Technology" is eight words and 47 characters of entirely real
 * name. Length is a sign of a foreign or public-sector org, not of plumbing.
 */
function looksLikeJunk(name) {
  if (!name) return true;
  if (name.length > 60) return true;
  if (/\d/.test(name)) return true;
  if (/(^|[-\s])(net|netblk|blk|block|asn|as)([-\s]|$)/i.test(name)) return true;
  return false;
}

/**
 * The name to put in front of the visitor, in order of how much it can be
 * trusted. The domain outranks the org name because the org name is a WHOIS or
 * netblock record and carries their artifacts — the two sightings that prompted
 * this, "Lowes Services India" and "IBMC-20", both arrived with a clean
 * lowes.com and us.ibm.com sitting right next to them.
 *
 * Returns null when no source yields something presentable, which the caller
 * turns into silence.
 */
function displayName(domain, orgName) {
  const reg = registrableDomain(domain);

  // 1. Curated map. Also where the alias table the backfill cron writes will
  //    slot in, ahead of this fallback chain and behind the same interface.
  if (reg && ALIASES.has(reg)) return ALIASES.get(reg);

  // 2. The domain label, which is canonical where the registry name is not.
  if (reg) {
    const fromDomain = labelToName(reg.split(".")[0]);
    if (fromDomain) return fromDomain;
  }

  // 3. No usable domain — scrub the registry name and only use it if it comes
  //    out looking like something a person would recognise.
  const cleaned = prettyName(stripRegionTail(orgName));
  return cleaned && !looksLikeJunk(cleaned) ? cleaned : null;
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
  // Three shapes over the years: nested objects with the key; a flat payload
  // with company_name/asn_org for anonymous calls; and, since 2026, a flat
  // free tier where `company` is a bare string and `asn` reads "AS714 Apple".
  const company = d.company && typeof d.company === "object" ? d.company : {};
  const asn = d.asn && typeof d.asn === "object" ? d.asn : {};
  const flat = !Object.keys(company).length && !Object.keys(asn).length;

  const name =
    company.name || d.company_name || asn.org || d.asn_org ||
    (typeof d.company === "string" ? d.company : null) ||
    (typeof d.asn === "string" ? d.asn.replace(/^AS\d+\s*/i, "") : null) || null;
  const asnNum =
    asn.asn || d.asn_num ||
    (typeof d.asn === "string" && /^AS(\d+)/i.test(d.asn) ? Number(/^AS(\d+)/i.exec(d.asn)[1]) : null);

  return {
    upstream: d,
    provider: flat ? "ipapi.is (anonymous)" : "ipapi.is",
    degraded: flat,
    name,
    domain: company.domain || asn.domain || null,
    // No type in the flat shape — infer just enough to avoid greeting an ISP.
    type: company.type || asn.type || (flat ? (looksLikeCarrier(name) ? "isp" : "business") : null),
    asn: asnNum || null,
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

/**
 * `?since=24h`, `?since=3d`, `?since=all`, or a bare hour count. Anything that
 * doesn't parse means "all", because a filter the caller mistyped should show
 * too much rather than silently show nothing.
 */
function sinceISO(raw) {
  if (!raw || raw === "all") return null;
  const m = /^(\d+)\s*([hd])?$/.exec(String(raw).trim().toLowerCase());
  if (!m) return null;
  const hours = Number(m[1]) * (m[2] === "d" ? 24 : 1);
  if (!hours || hours > 24 * 366 * 5) return null;
  return new Date(Date.now() - hours * 3600e3).toISOString();
}

/** Turn a provider result into the answer the page actually needs. */
function decide(r) {
  // A domain with no name is still a sighting — displayName() prefers the
  // domain anyway — so only the absence of both is nothing to work with.
  if (!r || (!r.name && !r.domain)) return { show: false, reason: "no-data" };
  if (r.risky) return { show: false, reason: "datacenter-or-vpn" };
  if (r.relay) return { show: false, reason: "relay" };
  if (!EMPLOYER_TYPES.has(r.type)) return { show: false, reason: `type:${r.type || "unknown"}` };

  const name = displayName(r.domain, r.name);
  if (!name) return { show: false, reason: "unnameable" };

  return {
    show: true,
    company: name,
    domain: r.domain || null,
    type: r.type,
    asn: r.asn,
    provider: r.provider,
  };
}

/** JSON answer. `cookies` may be one Set-Cookie string, an array, or nothing. */
const json = (body, cookies = null) =>
  respond(body, 200, Array.isArray(cookies) ? cookies : [cookies]);

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
    // but record() already runs in ctx.waitUntil so nobody is kept waiting.
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
const alert = (env, head, detail) =>
  Promise.all([
    notify(env.ALERT_WEBHOOK, `${head}\n${detail}`).catch(() => {}),
    mail(env, head, detail).catch(() => {}),
  ]);

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const fmtDays = (ms) => {
  const d = ms / DAY_MS;
  return d < 1.5 ? "a day" : d < 60 ? `${Math.round(d)} days` : `${Math.round(d / 30)} months`;
};

/**
 * Log a lookup and decide whether to alert.
 *
 * Every hit is written. The once-per-day dedupe that used to live here now
 * guards only the webhook, so the log is a real visit log rather than a
 * "companies seen today" list. Three rows per hit: the visit itself, the
 * visitor (identity plus latest dimensions) and the session (company columns
 * — the tracker fills in the rest). Runs inside ctx.waitUntil so the visitor
 * never waits on it. Stores only the /24, never the full address.
 *
 * Alerts, each at most once per subject per UTC day:
 *   🆕  a company never seen before
 *   ↩️  a company — or an anonymous visitor — back after more than 24 hours,
 *       with days away and total visits
 *   👀  a company seen again within 24 hours (the original daily alert)
 */
async function record(env, answer, ip, request, isTest = false, vid = null) {
  const now = Date.now();
  const nowISO = new Date(now).toISOString();
  const day = nowISO.slice(0, 10);
  const q = new URL(request.url).searchParams;

  // Dimensions the tracker passes along on the lookup call. The net comes
  // from the *lookup* ip so a pinned or spoofed address groups correctly.
  const c = context(request, {
    device: q.get("d"), vw: q.get("vw"), vh: q.get("vh"), sw: q.get("sw"), sh: q.get("sh"),
  });
  if (c.bot) return;
  c.net = netOf(ip);
  c.test = isTest ? 1 : 0;
  if (q.get("tz")) c.timezone = q.get("tz").slice(0, 64);

  const sid = VID_RE.test(q.get("sid") || "") ? q.get("sid") : null;
  const path = (q.get("from") || "/").slice(0, 300);
  // document.referrer, sent by the client. The Referer *header* on this fetch
  // is just the page that made it — our own URL — which is why it is not used.
  const referrer = (q.get("ref") || "").slice(0, 500) || null;

  // What was known before this hit, read first so "days since" is honest.
  let coPrev = null, vidPrev = null;
  if (env.DB) {
    try {
      const reads = [];
      if (answer.show) {
        reads.push(env.DB.prepare(
          `SELECT MAX(seen_at) AS last, COUNT(*) AS n FROM visits WHERE company = ? AND test = 0`
        ).bind(answer.company));
      }
      if (vid) {
        reads.push(env.DB.prepare(
          `SELECT v.first_seen_at, v.last_seen_at,
                  (SELECT COUNT(*) FROM visits x WHERE x.visitor_id = v.visitor_id) AS n
           FROM visitors v WHERE v.visitor_id = ?`
        ).bind(vid));
      }
      const res = reads.length ? await env.DB.batch(reads) : [];
      if (answer.show) coPrev = (res[0] && res[0].results[0]) || null;
      if (vid) { const r = res[answer.show ? 1 : 0]; vidPrev = (r && r.results[0]) || null; }
    } catch (_) {
      /* alerts degrade to the plain daily one */
    }
  }

  if (env.DB) {
    const db = env.DB;
    const stmts = [
      db.prepare(
        `INSERT INTO visits (seen_at, company, domain, type, asn, net, country, city, lat, lon, path, referrer, device,
                             shown, reason, test, visitor_id, session_id, browser, os, region, timezone, protocol, lang,
                             vw, vh, sw, sh, ref_host)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(
        nowISO, answer.company || "", answer.domain || null, answer.type || null, answer.asn || null,
        c.net, c.country, c.city,
        // cf.latitude/longitude arrive as strings, and are the /24's rough
        // centre rather than a street address.
        c.lat, c.lon, path, referrer, c.device,
        answer.show ? 1 : 0, answer.show ? null : answer.reason || null, c.test,
        vid, sid, c.browser, c.os, c.region, c.timezone, c.protocol, c.lang,
        c.vw, c.vh, c.sw, c.sh, refHost(referrer)
      ),
    ];
    if (vid) stmts.push(visitorUpsert(db, vid, nowISO, c, answer.show ? answer.company : "", answer.domain || null));
    if (sid) stmts.push(sessionFromLookup(db, sid, vid, nowISO, c, answer, path, referrer));
    await runBatches(db, stmts);
  }

  if (isTest || (!env.ALERT_WEBHOOK && !env.MAIL_RELAY_URL)) return;

  // First caller for `key` wins. KV is best-effort: without it, alert anyway.
  const once = async (key, ttl = 86400) => {
    if (!env.VISITOR_CACHE) return true;
    try {
      if (await env.VISITOR_CACHE.get(key)) return false;
      await env.VISITOR_CACHE.put(key, "1", { expirationTtl: ttl });
    } catch (_) { /* fall through */ }
    return true;
  };

  const where = [c.city, c.country].filter(Boolean).join(", ");
  const dev = [c.device, c.browser, c.os].filter(Boolean).join(" · ");
  const vidPrevMs = vidPrev ? Date.parse(vidPrev.last_seen_at) : NaN;
  const vidBack = Number.isFinite(vidPrevMs) && now - vidPrevMs > DAY_MS;

  // Every visit alerts, employer or not — deduped per *session* rather than per
  // request, so one person reading four pages is one email, not four. Sessions
  // lapse after 30 minutes idle, so the same person returning this evening is a
  // new session and does alert again.
  //
  // With no session id (cookies blocked, tracker not loaded) fall back to the
  // /24 for the day: coarse, but it stops a bot loop from emptying the relay's
  // ~100/day Gmail quota in a minute.
  if (!(await once(sid ? `vis:${sid}` : `net:${c.net}:${day}`, sid ? 21600 : 86400))) return;

  if (answer.show) {
    const prevMs = coPrev && coPrev.last ? Date.parse(coPrev.last) : NaN;
    let head;
    if (!Number.isFinite(prevMs)) head = `🆕 ${answer.company} visited aeden.me for the first time`;
    else if (now - prevMs > DAY_MS) {
      head = `↩️ ${answer.company} is back after ${fmtDays(now - prevMs)} — ${plural(Number(coPrev.n) + 1, "visit")} total`;
    } else head = `👀 ${answer.company} just visited aeden.me`;
    // Everything that identifies the visit goes in `head` so it survives as an
    // email subject on its own; `detail` is the technical line under it.
    if (where) head += ` — from ${where}`;
    if (answer.domain) head += ` (${answer.domain})`;
    await alert(
      env,
      head,
      `${c.net} · AS${answer.asn || "?"} · ${answer.type || "?"}` +
        (dev ? ` · ${dev}` : "") +
        (path !== "/" ? ` · ${path}` : "") +
        (vidBack ? `\nsame browser last here ${fmtDays(now - vidPrevMs)} ago · ${plural(Number(vidPrev.n) + 1, "visit")}` : "")
    );
    return;
  }

  // No employer resolved: still an alert, just a thinner one. The subject says
  // which of the three this is so the inbox is skimmable without opening it.
  const head = vidBack
    ? `↩️ a returning visitor is back after ${fmtDays(now - vidPrevMs)} — ${plural(Number(vidPrev.n) + 1, "visit")} total`
    : vidPrev
      ? `👀 someone is back on aeden.me — ${plural(Number(vidPrev.n) + 1, "visit")} total`
      : `👋 a new visitor is on aeden.me`;
  await alert(
    env,
    head + (where ? ` · ${where}` : "") + (dev ? ` · ${dev}` : ""),
    `${c.net} · ${answer.reason || "no employer"}` + (path !== "/" ? ` · ${path}` : "")
  );
}

const DASH_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  // The page is a live view of tables that change; caching it at the edge
  // would serve yesterday's shell with today's data.
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

/**
 * Optional gate on the dashboard and every read endpoint. Off until the
 * DASHBOARD_TOKEN secret exists. With it set, `?token=` once on the dashboard
 * URL stores an HttpOnly cookie and everything the page fetches rides on it.
 */
function authorized(request, env, url) {
  if (!env.DASHBOARD_TOKEN) return true;
  if (url.searchParams.get("token") === env.DASHBOARD_TOKEN) return true;
  return readCookie(request, "aeden_dash") === env.DASHBOARD_TOKEN;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
    }

    const url = new URL(request.url);

    // Debug exposes upstream payloads and lets the caller name an arbitrary IP,
    // which would make this a free lookup proxy on our quota. Off unless
    // DEBUG_TOKEN is set as a secret and matches.
    const debug =
      Boolean(env.DEBUG_TOKEN) && url.searchParams.get("debug") === env.DEBUG_TOKEN;

    // Trailing slashes are the caller's business, not ours.
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Analytics ingest from public/aeden.js. Never gated, never cached, and
    // never waits on the database — the response is out before D1 is touched.
    // "journal" and "frames" rather than "collect" and "replay": the obvious
    // words are tracker vocabulary that content blockers match on.
    // The old names stay as aliases: Cloudflare caches the script for four
    // hours, and a stale copy posting to /collect must not fall through to
    // the lookup below and write a visit row every five seconds.
    if (path.endsWith("/api/visitor/journal") || path.endsWith("/api/visitor/collect")) {
      return handleCollect(request, env, ctx);
    }
    if ((path.endsWith("/api/visitor/frames") || path.endsWith("/api/visitor/replay")) && request.method === "POST") {
      return handleReplay(request, env, ctx, url);
    }

    // The dashboard over the log, at /dashboard and /api/visitor/dashboard
    // both. Served before any lookup runs, so opening it never records a visit
    // or spends provider quota.
    if (path === "/dashboard" || path.endsWith("/api/visitor/dashboard")) {
      const t = url.searchParams.get("token");
      if (env.DASHBOARD_TOKEN && t === env.DASHBOARD_TOKEN) {
        // Swap the token in the URL for a cookie and drop it from the address
        // bar, so the link that gets copied around does not carry it.
        url.searchParams.delete("token");
        return new Response(null, {
          status: 302,
          headers: {
            location: url.pathname + url.search,
            "set-cookie": `aeden_dash=${t}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict`,
            "cache-control": "no-store",
          },
        });
      }
      return new Response(DASHBOARD, { headers: DASH_HEADERS });
    }

    // Read endpoints. Public unless DASHBOARD_TOKEN is set — see README.
    //
    //   /log                          the lookup log (see below)
    //   /sessions[/<sid>]             sessions, or one with its pages + events
    //   /visitors[/<vid>]             visitors, or one with a full timeline
    //   /engagement                   per-page scroll/time/click aggregates
    //   /heat?page=&device=&kind=     heat cells for one page
    //   /replay/<sid>[/<seq>]         chunk index, or one chunk from R2
    const read = /\/api\/visitor\/(log|sessions|visitors|engagement|heat|replay)(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(path);
    if (read) {
      if (!authorized(request, env, url)) return respond({ error: "unauthorized" }, 401);

      // Read the log: /api/visitor/log?since=7d&limit=500&test=0
      //
      //   since  24h | 3d | 30d | all | bare hours   (default: all)
      //   limit  1..5000                             (default: 100)
      //   test   0 excludes pinned test rows, 1 shows only those
      if (read[1] === "log") {
        if (!env.DB) return json({ error: "no database bound" });
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100) || 100, 1), 5000);
        const since = sinceISO(url.searchParams.get("since"));
        const test = url.searchParams.get("test");

        const where = [];
        const binds = [];
        if (since) {
          where.push("seen_at >= ?");
          binds.push(since);
        }
        if (test === "0") where.push("test = 0");
        else if (test === "1") where.push("test = 1");

        const { results } = await env.DB.prepare(
          `SELECT v.id, v.seen_at, v.company, v.domain, v.type, v.asn, v.net, v.country, v.city, v.lat, v.lon,
                  v.path, v.referrer, v.device, v.shown, v.reason, v.test,
                  v.visitor_id, v.session_id, v.browser, v.os, v.region, v.timezone, v.protocol, v.lang,
                  v.vw, v.vh, v.sw, v.sh, v.ref_host,
                  s.replay_chunks AS replay_chunks, s.page_views AS session_pages,
                  s.started_at AS session_started, s.last_seen_at AS session_last
           FROM visits v LEFT JOIN sessions s ON s.session_id = v.session_id
           ${where.length ? "WHERE " + where.map(w => "v." + w).join(" AND ") : ""}
           ORDER BY v.seen_at DESC LIMIT ?`
        )
          .bind(...binds, limit)
          .all();
        return json({ count: results.length, since, limit, visits: results });
      }

      return handleRead(read[1], [read[2], read[3]].filter(Boolean).map(decodeURIComponent), url, env, sinceISO);
    }

    // A pinned IP lets you browse aeden.me with no query params at all and
    // still be seen as arriving from somewhere else. The full lookup still
    // runs against it — only the source address is substituted.
    const pinned = readCookie(request, "peek_ip");

    const spoof = debug ? url.searchParams.get("ip") : null;
    const ip = spoof || pinned || request.headers.get("CF-Connecting-IP");
    if (!ip) return json({ show: false, reason: "no-ip" });

    // ?pin=1 stores the spoof for later param-free visits; ?pin=0 clears it.
    let setCookie = null;
    if (debug && url.searchParams.has("pin")) {
      setCookie =
        url.searchParams.get("pin") === "0"
          ? "peek_ip=; Path=/; Max-Age=0; SameSite=Lax; Secure"
          : `peek_ip=${encodeURIComponent(ip)}; Path=/; Max-Age=86400; SameSite=Lax; Secure`;
    }

    // The first-party visitor id, asserted (or minted) on every lookup.
    const { vid, cookie: vidCookie } = identity(request, url.searchParams.get("cid"));
    const cookies = [setCookie, vidCookie];
    const track = !isNoTrack(request);

    const key = cacheKey(ip);

    // KV is optional — the Worker runs fine before the namespace exists.
    if (env.VISITOR_CACHE && !debug) {
      try {
        const hit = await env.VISITOR_CACHE.get(key, "json");
        if (hit) {
          if (track) ctx.waitUntil(record(env, hit, ip, request, Boolean(pinned), vid).catch(() => {}));
          return json({ ...hit, cached: true }, cookies);
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
        ctx.waitUntil(record(env, answer, ip, request, false, vid).catch(() => {}));
      }
      return json({ ...answer, _ip: ip, _errors: errors, _raw: result }, cookies);
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

    if (track) ctx.waitUntil(record(env, answer, ip, request, Boolean(pinned), vid).catch(() => {}));

    return json(answer, cookies);
  },
};
