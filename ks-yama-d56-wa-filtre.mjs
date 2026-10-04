/* ks-yama-d56-wa-filtre.mjs — D56-WA-GUN-FILTRE
   WA modal: Bugün/Yarın/Tümü alıcı filtresi. waAc veri akışı korunur;
   satır üretimi TEK waAliciListeHTML; D25/D41/D42 dokunulmadı.
   Idempotent: marker varsa no-op exit 2. Anchor fail → YAZMADAN exit 1. */
import { readFileSync, writeFileSync, copyFileSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha16 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);
const MARKER = "D56-WA-GUN-FILTRE";

if (readFileSync("app.js", "utf8").includes(MARKER)) { console.log("Zaten uygulanmış — no-op"); process.exit(2); }

const appOnce = readFileSync("app.js", "utf8");
const idxOnce = readFileSync("index.html", "utf8");
console.log("ÖNCE app.js", statSync("app.js").size + "B", sha16("app.js"));
console.log("ÖNCE index.html", statSync("index.html").size + "B", sha16("index.html"));

/* Anchor-1: waAc TEK tanım */
const waAcBas = appOnce.indexOf("function waAc(");
if (waAcBas < 0 || (appOnce.match(/function waAc\(/g) || []).length !== 1) { console.error("ANCHOR-1 FAIL: waAc tanımı"); process.exit(1); }
const waAcSon = appOnce.indexOf("\nfunction ", waAcBas + 10);
const govde = appOnce.slice(waAcBas, waAcSon > 0 ? waAcSon : appOnce.length);

/* Anchor-2: waAc içinde penceredeDersler() TAM 1 kez */
const pd = (govde.match(/penceredeDersler\(\)/g) || []).length;
if (pd !== 1) { console.error("ANCHOR-2 FAIL: waAc içinde penceredeDersler() " + pd + " kez (1 bekleniyordu)"); process.exit(1); }

/* Anchor-3: waAlt şablonu */
const ALT_ESKI = 'pencereAdi() + " · " + dizi.length + " öğrenci"';
const ALT_YENI = 'pencereAdi() + (ui.waGun === "bugun" ? " · Bugün" : (ui.waGun === "yarin" ? " · Yarın" : "")) + " · " + dizi.length + " öğrenci"';
if (!govde.includes(ALT_ESKI)) {
  const i = govde.indexOf("waAlt");
  console.error("ANCHOR-3 FAIL: waAlt şablonu yok. Bağlam:\n" + govde.slice(Math.max(0, i - 80), i + 220));
  process.exit(1);
}

/* Anchor-4: waIcerik tek-üretici satırı */
const IC_ESKI = '$("waIcerik").innerHTML = waAliciListeHTML(dizi);';
if (!govde.includes(IC_ESKI)) {
  const i = govde.indexOf("waAliciListeHTML");
  console.error("ANCHOR-4 FAIL: waIcerik satırı yok. Bağlam:\n" + govde.slice(Math.max(0, i - 120), i + 140));
  process.exit(1);
}

/* Anchor-5: index.html */
if ((idxOnce.match(/<div id="waIcerik"/g) || []).length !== 1) { console.error("ANCHOR-5 FAIL: index.html waIcerik tek değil"); process.exit(1); }
if (idxOnce.includes("waGunBar")) { console.error("ANCHOR-5 FAIL: index.html'de waGunBar zaten var"); process.exit(1); }

/* TÜM anchor'lar YEŞİL → yedek + yaz */
if (!existsSync("app.js.d56-wa-gun-oncesi.bak")) copyFileSync("app.js", "app.js.d56-wa-gun-oncesi.bak");
if (!existsSync("index.html.d56-wa-gun-oncesi.bak")) copyFileSync("index.html", "index.html.d56-wa-gun-oncesi.bak");

const BLOK = [
'/* ===== ' + MARKER + ': Bugün/Yarın/Tümü alıcı filtresi =====',
'   waAc akışı korunur: filtre yalnız waGunKaynak() ile ders kaynağını daraltır;',
'   satır üretimi TEK waAliciListeHTML, mesaj ogrenciMesajMetni — D25/D41/D42 dokunulmadı. */',
'function waGunKaynak() {',
'  var g = ui.waGun || "tumu";',
'  if (g === "bugun") return penceredeDersler().filter(function (l) { return l.durum !== "iptal" && l.tarih === todayKey(); });',
'  if (g === "yarin") return penceredeDersler().filter(function (l) { return l.durum !== "iptal" && l.tarih === addDaysKey(todayKey(), 1); });',
'  return null;',
'}',
'function waGunBarHTML() {',
'  var g = ui.waGun || "tumu";',
'  var h = "";',
'  [["tumu", "Tümü"], ["bugun", "Bugün"], ["yarin", "Yarın"]].forEach(function (s) {',
'    var aktif = g === s[0];',
'    h += "<button data-gun=\\"" + s[0] + "\\" onclick=\'waGunSec(this.getAttribute(\\"data-gun\\"))\' class=\\"" + (aktif ? "bg-teal-600 text-white border-teal-600" : "text-slate-500 border-slate-200 hover:bg-slate-50") + "\\">" + s[1] + "</button>";',
'  });',
'  return h;',
'}',
'function waGunSec(g) { ui.waGun = g; waAc(); }',
'/* ===== /' + MARKER + ' ===== */',
''].join("\n");

let govde2 = govde.replace("penceredeDersler()", "(waGunKaynak() || penceredeDersler())");
govde2 = govde2.split(ALT_ESKI).join(ALT_YENI);
govde2 = govde2.replace(IC_ESKI, IC_ESKI + '\n  var __waBar = $("waGunBar"); if (__waBar) __waBar.innerHTML = waGunBarHTML();');

const appYeni = appOnce.slice(0, waAcBas) + BLOK + govde2 + appOnce.slice(waAcSon > 0 ? waAcSon : appOnce.length);
const yeniSha = createHash("sha256").update(appYeni).digest("hex").slice(0, 16);
const stamp = "app.js?v=" + yeniSha;

const ozSayi = (idxOnce.match(/app\.js\?v=[0-9a-f]{16}/g) || []).length;
const idxYeni = idxOnce.replace('<div id="waIcerik"', '<!-- ' + MARKER + ' -->\n      <div id="waGunBar" class="px-3 pt-2.5 pb-0.5 flex flex-wrap gap-1.5 items-center"></div>\n      <div id="waIcerik"').replace(/app\.js\?v=[0-9a-f]{16}/g, stamp);

writeFileSync("app.js", appYeni);
writeFileSync("index.html", idxYeni);
for (const k of ["public/app.js", "dist/app.js", "isolate/app.js"]) writeFileSync(k, appYeni);
for (const k of ["dist/index.html", "isolate/index.html"]) writeFileSync(k, idxYeni);

console.log("Yeni app.js SHA16:", yeniSha, "· byte:", statSync("app.js").size);
console.log("Damga güncellendi:", ozSayi, "→", stamp, "(index+dist+isolate)");
console.log("SONRA app.js", sha16("app.js"), "· index.html", sha16("index.html"));
console.log("Yedek: app.js.d56-wa-gun-oncesi.bak · index.html.d56-wa-gun-oncesi.bak");
console.log("ek-ders.js DOKUNULMADI:", sha16("ek-ders.js"));
