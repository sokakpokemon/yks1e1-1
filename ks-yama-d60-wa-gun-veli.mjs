import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const MARK = "D60-WA-GUN-DATES";
const KAYNAK = existsSync("app.js") ? "app.js" : (existsSync("public/app.js") ? "public/app.js" : null);
if (!KAYNAK) { console.error("app.js bulunamadi."); process.exit(1); }
let app = readFileSync(KAYNAK, "utf8");
if (app.includes("D60-WA-GUN-DATES") && app.includes("D60-ALICI-VELI")) { console.log("Zaten uygulanmis — no-op."); process.exit(0); }
if (!existsSync(KAYNAK + ".d60-oncesi.bak")) copyFileSync(KAYNAK, KAYNAK + ".d60-oncesi.bak");
console.log("Kaynak: " + KAYNAK + " (" + app.length + " B) · yedek alindi");

let hata = 0;
function tek(esk, yen, ad) {
  const n = app.split(esk).length - 1;
  if (n !== 1) { console.error("  X ANCHOR FAIL [" + ad + "]: " + n + " kez (1 bekleniyor)"); hata = 1; return; }
  app = app.replace(esk, yen); console.log("  + " + ad);
}

/* [1] GUN FILTRESI: tarih anahtari destegi */
tek(`function waGunKaynak() {
  var g = ui.waGun || "tumu";
  if (g === "bugun") return penceredeDersler().filter(function (l) { return l.durum !== "iptal" && l.tarih === todayKey(); });
  if (g === "yarin") return penceredeDersler().filter(function (l) { return l.durum !== "iptal" && l.tarih === addDaysKey(todayKey(), 1); });
  return null;
}`,
`function waGunKaynak() {
  /* ${"D60-WA-GUN-DATES"}: 'bugun'/'yarin' geriye-uyumlu; ayrica bir TARIH (YYYY-AA-GG) seciliyse yalniz o gun. */
  var g = ui.waGun || "tumu";
  if (g === "bugun") g = todayKey();
  else if (g === "yarin") g = addDaysKey(todayKey(), 1);
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(g)) return penceredeDersler().filter(function (l) { return l.durum !== "iptal" && l.tarih === g; });
  return null;
}`, "1) waGunKaynak tarih filtresi");

/* [2] GUN BARI: Tumu + tarihli kucuk pill'ler */
tek(`function waGunBarHTML() {
  var g = ui.waGun || "tumu";
  var h = "";
  [["tumu", "Tümü"], ["bugun", "Bugün"], ["yarin", "Yarın"]].forEach(function (s) {
    var aktif = g === s[0];
    h += "<button data-gun=\\"" + s[0] + "\\" onclick='waGunSec(this.getAttribute(\\"data-gun\\"))' class=\\"" + (aktif ? "bg-teal-600 text-white border-teal-600" : "text-slate-500 border-slate-200 hover:bg-slate-50") + "\\">" + s[1] + "</button>";
  });
  return h;
}`,
`function waGunListe() {
  /* ${"D60-WA-GUN-DATES"}: mevcut pencerede dersi olan benzersiz tarihler (sirali). */
  var varsa = {};
  penceredeDersler().filter(function (l) { return l.durum !== "iptal"; }).forEach(function (l) { if (l.tarih) varsa[l.tarih] = 1; });
  var t = Object.keys(varsa).sort();
  if (t.length > 31) t = t.slice(0, 31);
  return t;
}
function waGunEtiket(k) {
  var d = fromKey(k);
  return GUN_KISA[dowIdx(k)] + " " + d.getDate() + " " + AYLAR[d.getMonth()].slice(0, 3);
}
function waGunBarHTML() {
  var g = ui.waGun || "tumu";
  var cls = "text-[10px] font-semibold border rounded-full px-2 py-1 mr-1 mb-1 inline-block ";
  var h = "<button data-gun=\\"tumu\\" onclick='waGunSec(this.getAttribute(\\"data-gun\\"))' class=\\"" + cls + (g === "tumu" ? "bg-teal-600 text-white border-teal-600" : "text-slate-500 border-slate-200 hover:bg-slate-50") + "\\">Tümü</button>";
  waGunListe().forEach(function (k) {
    var aktif = g === k;
    h += "<button data-gun=\\"" + k + "\\" onclick='waGunSec(this.getAttribute(\\"data-gun\\"))' title=\\"" + gunAdi(k) + "\\" class=\\"" + cls + (aktif ? "bg-teal-600 text-white border-teal-600" : "text-slate-500 border-slate-200 hover:bg-slate-50") + "\\">" + waGunEtiket(k) + "</button>";
  });
  return h;
}`, "2) waGunBarHTML tarihli pill'ler");

/* [3] waAlt basligi secili gunu gosterir */
tek(`$("waAlt").textContent = pencereAdi() + (ui.waGun === "bugun" ? " · Bugün" : (ui.waGun === "yarin" ? " · Yarın" : "")) + " · " + dizi.length + " öğrenci";`,
`$("waAlt").textContent = pencereAdi() + (/^\\d{4}-\\d{2}-\\d{2}$/.test(ui.waGun || "") ? " · " + waGunEtiket(ui.waGun) : (ui.waGun === "bugun" ? " · Bugün" : (ui.waGun === "yarin" ? " · Yarın" : ""))) + " · " + dizi.length + " öğrenci";`, "3) waAlt secili gun etiketi");

/* [4] ALICI: Anne/Baba -> Veli */
tek(`    '<option value="ogrenci">Öğrenci</option><option value="anne">Anne</option><option value="baba">Baba</option></select>' +`,
`    '<option value="ogrenci">Öğrenci</option><option value="veli">Veli</option></select>' + /* D60-ALICI-VELI */`, "4) alici select Ogrenci/Veli");

/* [5] waAliciBilgisi: veli cozucusu (anne/baba geriye-uyumlu) */
tek(`  var tip = aliciTipi === "anne" || aliciTipi === "baba" ? aliciTipi : "ogrenci";
  var etiket = tip === "anne" ? "Anne" : tip === "baba" ? "Baba" : "Öğrenci";
  var telefon = o ? (tip === "anne" ? o.anneTel : tip === "baba" ? o.babaTel : o.tel) : "";`,
`  /* D60-ALICI-VELI: veli → anne veya baba telefonu (ilk dolu); anne/baba geriye-uyumlu korunur. */
  var tip = aliciTipi === "anne" || aliciTipi === "baba" || aliciTipi === "veli" ? aliciTipi : "ogrenci";
  var etiket = tip === "anne" ? "Anne" : tip === "baba" ? "Baba" : tip === "veli" ? "Veli" : "Öğrenci";
  var telefon = o ? (tip === "veli" ? (o.anneTel || o.babaTel || "") : (tip === "anne" ? o.anneTel : tip === "baba" ? o.babaTel : o.tel)) : "";`, "5) waAliciBilgisi veli cozucusu");

/* [6] waAliciDegistir: veli kabul */
tek(`  waAliciTipi = (tip === "anne" || tip === "baba") ? tip : "ogrenci";`,
`  waAliciTipi = (tip === "anne" || tip === "baba" || tip === "veli") ? tip : "ogrenci";`, "6) waAliciDegistir veli kabul");

/* [7] MESAJ: secili gune bagla (liste daralirsa mesaj da daralir) */
tek(`  var liste = penceredeDersler().filter(function (l) {
    return (dersOgrenciIds(l).indexOf(o.id) !== -1 || l.ogrenciAd === o.ad) && l.durum !== "iptal";
  });`,
`  /* ${"D60-WA-GUN-DATES"}: WA modalinda gun seciliyse mesaj da yalniz o gunun derslerini icerir. */
  var _waGunSec = (typeof waGunKaynak === "function") ? waGunKaynak() : null;
  var liste = penceredeDersler().filter(function (l) {
    if (_waGunSec && _waGunSec.indexOf(l) === -1) return false;
    return (dersOgrenciIds(l).indexOf(o.id) !== -1 || l.ogrenciAd === o.ad) && l.durum !== "iptal";
  });`, "7) ogrenciMesajMetni gun filtresi");

if (hata) { console.error("\nFAIL-FAST: hicbir degisiklik YAZILMADI."); process.exit(1); }
writeFileSync(KAYNAK, app);
console.log("Yazildi: " + KAYNAK + " (" + app.length + " B)");

const sha16 = createHash("sha256").update(readFileSync(KAYNAK)).digest("hex").slice(0, 16);
console.log("Yeni SHA16 = " + sha16);
["public/app.js","dist/app.js","isolate/app.js"].forEach(function (p) { if (existsSync(p) && p !== KAYNAK) { copyFileSync(KAYNAK, p); console.log("  kopya: " + p); } });
["index.html","public/index.html","dist/index.html","isolate/index.html"].forEach(function (p) {
  if (!existsSync(p)) return;
  var h = readFileSync(p, "utf8");
  var y = h.replace(/app\\.js\\?v=[0-9a-f]{16}/g, "app.js?v=" + sha16);
  if (y !== h) { writeFileSync(p, y); console.log("  damga: " + p); }
});

function cal(a) { return spawnSync(a[0], a.slice(1), { encoding: "utf8", maxBuffer: 1 << 28 }); }
var r = cal(["node","--check",KAYNAK]);
console.log("\n[node --check] " + (r.status === 0 ? "SYNTAX OK" : "SYNTAX FAIL\n" + r.stderr));
if (existsSync("scripts/copy-static.mjs")) { r = cal(["node","scripts/copy-static.mjs"]); process.stdout.write(r.stdout || ""); console.error(r.stderr || ""); }
if (existsSync("scripts/publish-guard.mjs")) { r = cal(["node","scripts/publish-guard.mjs"]); process.stdout.write(r.stdout || ""); console.error(r.stderr || ""); console.log("GUARD_EXIT=" + r.status); }
console.log("\n== --tam ==");
var t = cal(["node","hizli-test.mjs","--tam"]);
var out = (t.stdout || "") + (t.stderr || "");
console.log(out.split("\n").slice(-12).join("\n"));
console.log("TAM_EXIT=" + t.status);
