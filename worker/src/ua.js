/**
 * User-Agent parsing — just enough to fill three dashboard columns.
 *
 * Deliberately small. A full UA library is 50 KB of regexes for distinctions
 * (Chrome 127 vs 128 minor builds, obscure Android skins) that nobody reading
 * a portfolio dashboard cares about. Browser and OS come back as short labels
 * with a major version where the UA still carries one.
 */

/**
 * Crawlers, monitors, link previewers, HTTP libraries. Anything matching is
 * dropped before it reaches the database — a bot renders the page once and
 * would otherwise show up as a stream of one-page sessions.
 */
const BOT =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|facebookexternalhit|linkedinbot|twitterbot|discordbot|telegrambot|whatsapp|skypeuripreview|preview|python-requests|python-urllib|go-http-client|okhttp|curl\/|wget\/|java\/|libwww|httpclient|scrapy|phantomjs|puppeteer|playwright|selenium/i;

export function isBot(ua) {
  return !ua || BOT.test(ua);
}

/** Coarse device bucket. Tablets first: iPadOS and most tablet UAs also say "Mobile". */
export function deviceType(ua) {
  if (!ua) return null;
  if (/iPad|Tablet(?!.*Mobile)|Android(?!.*Mobile)|Silk|PlayBook/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "mobile";
  return "desktop";
}

function major(ua, re) {
  const m = re.exec(ua);
  return m && m[1] ? " " + m[1].split(/[._]/)[0] : "";
}

/**
 * Browser label. Order matters: everything Chromium-based says "Chrome", and
 * everything on iOS says "Safari", so the more specific tokens go first.
 * In-app webviews (LinkedIn, Instagram, …) are called out by name — on a
 * portfolio site "opened from the LinkedIn app" is the interesting fact.
 */
export function browserOf(ua) {
  if (!ua) return null;
  if (/LinkedInApp/i.test(ua)) return "LinkedIn app";
  if (/Instagram/i.test(ua)) return "Instagram app";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook app";
  if (/Twitter|X\/[\d.]+ \(iPhone/i.test(ua)) return "X app";
  if (/Slack/i.test(ua)) return "Slack";
  if (/GSA\//i.test(ua)) return "Google app";
  if (/Edg(e|A|iOS)?\//i.test(ua)) return "Edge" + major(ua, /Edg(?:e|A|iOS)?\/([\d.]+)/i);
  if (/OPR\/|Opera/i.test(ua)) return "Opera" + major(ua, /(?:OPR|Opera)\/([\d.]+)/i);
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet" + major(ua, /SamsungBrowser\/([\d.]+)/i);
  if (/DuckDuckGo/i.test(ua)) return "DuckDuckGo";
  if (/Vivaldi/i.test(ua)) return "Vivaldi";
  if (/YaBrowser/i.test(ua)) return "Yandex";
  if (/UCBrowser/i.test(ua)) return "UC Browser";
  if (/Firefox\/|FxiOS\//i.test(ua)) return "Firefox" + major(ua, /(?:Firefox|FxiOS)\/([\d.]+)/i);
  if (/CriOS\//i.test(ua)) return "Chrome" + major(ua, /CriOS\/([\d.]+)/i);
  if (/Chrome\/|Chromium\//i.test(ua)) return "Chrome" + major(ua, /Chrom(?:e|ium)\/([\d.]+)/i);
  if (/Safari\//i.test(ua) && /Version\//i.test(ua)) return "Safari" + major(ua, /Version\/([\d.]+)/i);
  if (/Safari\//i.test(ua)) return "Safari";
  if (/MSIE|Trident\//i.test(ua)) return "Internet Explorer";
  return "other";
}

/**
 * OS label. macOS is frozen at 10.15.7 by every modern browser and Windows
 * 11 still reports "Windows NT 10.0", so those two get no version — a wrong
 * number is worse than none.
 */
export function osOf(ua) {
  if (!ua) return null;
  if (/iPhone|iPod/i.test(ua)) return "iOS" + major(ua, /OS (\d+[._]\d+)/i);
  if (/iPad/i.test(ua)) return "iPadOS" + major(ua, /OS (\d+[._]\d+)/i);
  if (/Android/i.test(ua)) return "Android" + major(ua, /Android ([\d.]+)/i);
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Windows Phone/i.test(ua)) return "Windows Phone";
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) {
    // Safari on iPadOS masquerades as a Mac; a touch-capable "Mac" is an iPad.
    return /Mobile/i.test(ua) ? "iPadOS" : "macOS";
  }
  if (/Linux/i.test(ua)) return "Linux";
  if (/X11/i.test(ua)) return "Unix";
  return "other";
}

export function parseUA(ua) {
  return { browser: browserOf(ua), os: osOf(ua), device: deviceType(ua), bot: isBot(ua) };
}
