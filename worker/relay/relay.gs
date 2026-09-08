/**
 * aeden.me visitor alerts — Google Apps Script mail relay.
 *
 * Deployed as a Web App, this turns your Google account into a tiny email API
 * the Worker can call. Why it exists: a Cloudflare Worker cannot open a TCP
 * socket, so SMTP is impossible; Cloudflare Email Sending needs Workers Paid;
 * and Cloudflare Email Routing is zone-level, so enabling it would rewrite
 * aeden.me's MX records and break SimpleLogin. Apps Script sends from Gmail
 * with no API key, no sending domain and no DNS changes.
 *
 * DEPLOY (see worker/README.md for the full walkthrough):
 *   script.new  →  paste this  →  set SECRET below to the same value you gave
 *   the Worker's MAIL_RELAY_SECRET  →  Deploy > New deployment > Web app,
 *   "Execute as: Me", "Who has access: Anyone"  →  copy the /exec URL.
 *
 * Re-deploy as a *new version* after any edit, or the old code keeps serving.
 */

// Must match the Worker's MAIL_RELAY_SECRET exactly.
//
// Placeholder on purpose: this repo is public, and the deployed Apps Script
// is the only place the real value belongs. Generate one with
//   openssl rand -hex 24
// then paste the same string here in the Apps Script editor and into
//   npx wrangler secret put MAIL_RELAY_SECRET
const SECRET = 'REPLACE_WITH_MAIL_RELAY_SECRET';

// Where the alerts land.
//
// NOT notify@aeden.me. That alias forwards to aedengeo@gmail.com, and this
// script sends *as* aedengeo@gmail.com — SimpleLogin refuses to forward a
// message from an alias's own mailbox back to that mailbox, so alerts were
// silently dropped. Nothing configurable fixes that while sender and final
// destination are the same account, and the alias bought nothing anyway:
// Apps Script can only send as the account running it, never as notify@.
//
// The +visitors tag is delivered to the same inbox and makes a Gmail filter
// ("to: aedengeo+visitors@gmail.com" -> label, skip inbox) a one-liner.
const TO = 'aedengeo+visitors@gmail.com';

function doPost(e) {
  try {
    // "Who has access: Anyone" is what lets the Worker call this without a
    // Google login, which also means the URL alone is a capability. The shared
    // secret is the only thing standing between a leaked URL and someone
    // sending mail as you, so it is checked before anything else happens.
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return reply('forbidden');

    MailApp.sendEmail({
      to: TO,
      subject: body.subject || 'aeden.me visitor',
      body: (body.text || '') + '\n\n—\nhttps://aeden.me/dashboard',
      name: 'aeden.me visitors',
    });
    return reply('ok');
  } catch (err) {
    // Logger output shows up in the Apps Script execution log. Never echo the
    // error to the caller: this endpoint is public.
    Logger.log(err);
    return reply('error');
  }
}

/** GET is only ever a human checking the deployment is alive. */
function doGet() {
  return reply('aeden.me mail relay');
}

const reply = (s) => ContentService.createTextOutput(s);

/**
 * Run this once from the editor (Run > sendTest) before wiring the Worker.
 * It forces the OAuth consent prompt and proves MailApp can reach TO.
 */
function sendTest() {
  MailApp.sendEmail({
    to: TO,
    subject: 'aeden.me relay test',
    body: 'If you are reading this, the relay works. Remaining quota today: ' +
      MailApp.getRemainingDailyQuota(),
    name: 'aeden.me visitors',
  });
}
