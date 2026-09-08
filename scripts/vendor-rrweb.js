#!/usr/bin/env node
/**
 * Copy the rrweb recorder and player out of node_modules into public/vendor so
 * the site serves them first-party from aeden.me. No CDN, no third party.
 *
 *   node scripts/vendor-rrweb.js
 *
 * Runs on `postinstall`, so a fresh `npm ci` (CI included) always has the
 * files before `npm run build` copies public/ into build/. The outputs are
 * committed too, so the tracker keeps working even if the hook is skipped.
 *
 *   public/vendor/scene.min.js         -> the recorder, loaded lazily by public/aeden.js
 *   public/vendor/scene-player.min.js  -> the player, loaded by worker/src/dashboard.html
 *   public/vendor/scene-player.css     -> same
 *
 * The files are deliberately not called rrweb-anything. EasyPrivacy blocks
 * "/rrweb-record.min.js", "/rrweb.js" and friends by filename, so a visitor
 * with uBlock Origin would never load the recorder under its real name — the
 * whole point of self-hosting is that the site's own analytics survive a
 * content blocker.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "public", "vendor");

const FILES = [
  ["@rrweb/record/dist/record.umd.min.cjs", "scene.min.js"],
  ["rrweb-player/dist/rrweb-player.umd.cjs", "scene-player.min.js"],
  ["rrweb-player/dist/style.css", "scene-player.css"],
];

fs.mkdirSync(out, { recursive: true });

let copied = 0;
for (const [src, dest] of FILES) {
  const from = path.join(root, "node_modules", src);
  if (!fs.existsSync(from)) {
    console.warn(`vendor-rrweb: missing ${src} — run npm install first`);
    continue;
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "node_modules", src.split("/dist/")[0], "package.json"), "utf8")
  );
  const banner = `/*! ${pkg.name} ${pkg.version} — ${pkg.license || "MIT"} — vendored by scripts/vendor-rrweb.js */\n`;
  fs.writeFileSync(path.join(out, dest), banner + fs.readFileSync(from, "utf8"));
  copied++;
}
console.log(`vendor-rrweb: ${copied}/${FILES.length} files -> public/vendor/`);
