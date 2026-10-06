import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const MARK = "D59-OGRENCI-SLOT-KURALI";
const KAYNAK = existsSync("app.js") ? "app.js" : (existsSync("public/app.js") ? "public/app.js" : null);
if (!KAYNAK) { console.error("app.js bulunamadı."); process.exit(1); }
let app = readFileSync(KAYNAK, "utf8");
if (app.includes(MARK)) { console.log("Zaten uygulanmış (marker var) — no-op."); process.exit(0); }
if (!existsSync(KAYNAK + ".d59-oncesi.bak")) copyFileSync(KAYNAK, KAYNAK + ".d59-oncesi.bak");
console.log("Kaynak: " + KAYNAK + " (" + app.length + " B) · yedek alındı");

let hata = 0;
function tek(esk, yen, ad) {
  const n = app.split(esk).length - 1;
  if (n !== 1) { console.error("  X ANCHOR FAIL [" + ad + "]: " + n + " kez (1 bekleniyor)"); hata = 1; return; }
  app = app.replace(esk, yen); console.log("  + " + ad);
}

const A_ESK = "function duzeltmeBul(adet, yokSay, grupOgrenciIds) {";
const A_YENI =
"/* D59-OGRENCI-SLOT-KURALI: ayni tarih+saat kodunda bir ogrenci (ana + grup uyeleri) en fazla 1 aktif derste olur. Cakismayi Yoksay bunu GECEMEZ. */\n" +
"function ogrenciSlotCakismasiBul(adet, katilimcilar) {\n" +
"  var saatKod = ksKodOf(adet.saat);\n" +
"  var idler = (Array.isArray(katilimcilar) ? katilimcilar : []).filter(function (v, i, a) {\n" +
"    return v != null && v !== \"\" && a.indexOf(v) === i;\n" +
"  });\n" +
"  var uyari = [];\n" +
"  idler.forEach(function (oid) {\n" +
"    var o = DB.ogrenciler.find(function (x) { return x.id === oid; });\n" +
"    if (!o) return;\n" +
"    var mevcut = DB.dersler.find(function (l) {\n" +
"      return l.id !== (adet.id || \"\") && l.tarih === adet.tarih &&\n" +
"        ksKodOf(l.saat) === saatKod && l.durum !== \"iptal\" &&\n" +
"        dersOgrenciIds(l).indexOf(oid) >= 0;\n" +
"    });\n" +
"    if (mevcut) {\n" +
"      uyari.push(\"<b>\" + esc(gorselAd(o.ad)) + \"</b> bu saatte (\" + GUN_KISA[dowIdx(adet.tarih)] + \" \" + saatEtiket(adet.saat) + \") zaten <b>\" + esc(gorselAd(mevcut.ogretmenAd || \"?\")) + \"</b> ogretmeniyle planli. Bir ogrenci ayni saatte yalniz bir ogretmenden ders alabilir.\");\n" +
"    }\n" +
"  });\n" +
"  return uyari;\n" +
"}\n" +
A_ESK;
tek(A_ESK, A_YENI, "A) ogrenciSlotCakismasiBul eklendi");

tek("function hataKart(liste) {", "function hataKart(liste, sert) {", "B1) hataKart(liste, sert)");
tek(
  "'<p class=\"text-[11px] text-rose-400 mt-2\">Gerçekten planlamak istiyorsanız <b>“Çakışmayı Yoksay / Ekstra Kontenjan”</b> kutusunu işaretleyip tekrar kaydedin.</p></div></div>';",
  "(sert ? '<p class=\"text-[11px] text-rose-400 mt-2\">Bu bir ogrenci cakismasidir — <b>yoksayilamaz</b>. Ders kaydedilmedi.</p>' : '<p class=\"text-[11px] text-rose-400 mt-2\">Gerçekten planlamak istiyorsanız <b>“Çakışmayı Yoksay / Ekstra Kontenjan”</b> kutusunu işaretleyip tekrar kaydedin.</p>') + '</div></div>';",
  "B2) hataKart sert metni");

const C_ESK = '  var cakisma = duzeltmeBul({ ogrenciId: o.id, ogretmenId: t.id, tarih: tarih, saat: saat, id: ui.editId || "" }, yoksay, grupModu ? grupOgrenciIds : null);';
tek(C_ESK,
  '  var sertCakisma = ogrenciSlotCakismasiBul({ tarih: tarih, saat: saat, id: ui.editId || "" }, [o.id].concat(grupOgrenciIds));\n' +
  '  if (sertCakisma.length) { hataKart(sertCakisma, true); return; }\n' +
  C_ESK, "C) planla sert ogrenci kapisi");

tek(
  "  if (eski && eski !== ana && DB.ogrenciler.some(function (x) { return x.id === eski; })) {",
  "  if ((ui.editId || ui.aktifIstekId) && eski && eski !== ana && DB.ogrenciler.some(function (x) { return x.id === eski; })) {",
  "D) ana degisimi tasima gate");

tek(
  "  ui.uyeDegisti = false;\n" +
  "  var panelKirli = ui.panelSecim && (ui.panelSecim.acik || ui.panelSecim.arama || ui.panelSecim.sinif);\n" +
  "  if ((ui.ekOgrenciIds && ui.ekOgrenciIds.length) || panelKirli) {\n" +
  "    ui.ekOgrenciIds = [];\n" +
  "    ui.panelSecim = { acik: false, arama: \"\", sinif: \"\" };\n" +
  "    renderFormDestek();\n" +
  "  }\n}",
  "  ui.uyeDegisti = false;\n" +
  "  /* D59-GRUP-BOS: yeni ders/iptal sonrasi grup paneli KOSULSUZ bosalir — onceki/ana ogrenci secili kalmaz */\n" +
  "  ui.ekOgrenciIds = [];\n" +
  "  ui.grupPanelSira = [];\n" +
  "  ui.havuzAnaId = null;\n" +
  "  ui.grupPanelBaglam = \"plan\";\n" +
  "  ui.panelSecim = { acik: false, arama: \"\", sinif: \"\", anaId: null };\n" +
  "  renderFormDestek();\n}",
  "E) temizleForm kosulsuz sifirlama");

if (hata) { console.error("\nFAIL-FAST: hicbir degisiklik YAZILMADI."); process.exit(1); }
writeFileSync(KAYNAK, app);
console.log("Yazildi: " + KAYNAK + " (" + app.length + " B)");

const sha16 = createHash("sha256").update(readFileSync(KAYNAK)).digest("hex").slice(0, 16);
console.log("Yeni SHA16 = " + sha16);
["public/app.js","dist/app.js","isolate/app.js"].forEach(function (p) { if (existsSync(p) && p !== KAYNAK) { copyFileSync(KAYNAK, p); console.log("  kopya: " + p); } });
["index.html","public/index.html","dist/index.html","isolate/index.html"].forEach(function (p) {
  if (!existsSync(p)) return;
  var h = readFileSync(p, "utf8");
  var y = h.replace(/app\.js\?v=[0-9a-f]{16}/g, "app.js?v=" + sha16);
  if (y !== h) { writeFileSync(p, y); console.log("  damga: " + p); }
});

function cal(a) { return spawnSync(a[0], a.slice(1), { encoding: "utf8" }); }
var r = cal(["node","--check",KAYNAK]);
console.log("\n[node --check] " + (r.status === 0 ? "SYNTAX OK" : "SYNTAX FAIL\n" + r.stderr));
if (existsSync("scripts/copy-static.mjs")) { r = cal(["node","scripts/copy-static.mjs"]); process.stdout.write(r.stdout || ""); process.stderr.write(r.stderr || ""); }
if (existsSync("scripts/publish-guard.mjs")) { r = cal(["node","scripts/publish-guard.mjs"]); process.stdout.write(r.stdout || ""); process.stderr.write(r.stderr || ""); console.log("GUARD_EXIT=" + r.status); }
console.log("PAKET_EXIT=0");
