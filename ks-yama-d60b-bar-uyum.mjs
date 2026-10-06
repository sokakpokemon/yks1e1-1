import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const KAYNAK = existsSync("app.js") ? "app.js" : "public/app.js";
let app = readFileSync(KAYNAK, "utf8");
if (app.includes("D60B-BAR-UYUM")) { console.log("zaten uygulanmis"); process.exit(0); }
const ESK = `function waGunBarHTML() {
  var g = ui.waGun || "tumu";
  var cls = "text-[10px] font-semibold border rounded-full px-2 py-1 mr-1 mb-1 inline-block ";`;
const YENI = `function waGunBarHTML() {
  /* D60B-BAR-UYUM: eski 'bugun'/'yarin' degerleri tarihe cevrilir; ilgili tarih pill'i aktif olur. */
  var g = ui.waGun || "tumu";
  if (g === "bugun") g = todayKey();
  else if (g === "yarin") g = addDaysKey(todayKey(), 1);
  var cls = "text-[10px] font-semibold border rounded-full px-2 py-1 mr-1 mb-1 inline-block ";`;
const n = app.split(ESK).length - 1;
if (n !== 1) { console.error("ANCHOR FAIL: " + n + " kez (1 bekleniyor)"); process.exit(1); }
app = app.replace(ESK, YENI);
writeFileSync(KAYNAK, app);
const sha16 = createHash("sha256").update(readFileSync(KAYNAK)).digest("hex").slice(0,16);
console.log("SHA16 = " + sha16);
["public/app.js","dist/app.js","isolate/app.js"].forEach(p => { if (existsSync(p) && p !== KAYNAK) copyFileSync(KAYNAK, p); });
["index.html","public/index.html","dist/index.html","isolate/index.html"].forEach(p => { if (!existsSync(p)) return; const h = readFileSync(p,"utf8"); const y = h.replace(/app\.js\?v=[0-9a-f]{16}/g, "app.js?v=" + sha16); if (y!==h) { writeFileSync(p,y); console.log("  damga: " + p); } });
const R = (a) => spawnSync(a[0], a.slice(1), { encoding:"utf8", maxBuffer: 1<<28 });
let r = R(["node","--check",KAYNAK]); console.log("check: " + (r.status===0?"SYNTAX OK":"FAIL"));
if (existsSync("scripts/copy-static.mjs")) { r = R(["node","scripts/copy-static.mjs"]); process.stdout.write(r.stdout||""); }
if (existsSync("scripts/publish-guard.mjs")) { r = R(["node","scripts/publish-guard.mjs"]); process.stdout.write(r.stdout||""); console.log("GUARD_EXIT=" + r.status); }
console.log("== --tam ==");
r = R(["node","hizli-test.mjs","--tam"]); const out=(r.stdout||"")+(r.stderr||"");
console.log(out.split("\n").slice(-16).join("\n"));
console.log("TAM_EXIT=" + r.status);
