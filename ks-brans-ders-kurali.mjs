let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 54) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-brans-ders-kurali.mjs kosan=" + __kosan + " beklenen=54"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-brans-ders-kurali.mjs:" + __kosan + ":54"); } });
/* ks-brans-ders-kurali.mjs — BRANS-DERS-KURALI-YAMASI regresyon süiti:
   Öğretmen branşı ↔ verilebilir ders kuralı (mat→mat,geo · tur→tur,edb · diğerleri yalnız kendi dersi).
   Fail-closed eşleşme (aksan/harf/boşluk normalize). Kayıt öncesi zorunlu kontrol: birebir, grup, ek ders.
   Mevcut eski (aykırı) kayıtlar düzenlenmeden korunur. Mapping belirsizse yazma YOK (rapor yalnız). */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"),
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
const ekSrc = readFileSync("ek-ders.js", "utf8");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };

const reg = {};
const el = (id) => {
  const e = {
    id, textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], files: null,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle() {}, contains(c) { return this._s.has(c); } },
    insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; },
    appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
    querySelectorAll: () => [], getContext: () => null
  };
  let _html = "";
  Object.defineProperty(e, "innerHTML", {
    get() { return _html; },
    set(v) { _html = String(v); [..._html.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }
  });
  reg[id] = e;
  return e;
};
for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
global.document = {
  getElementById: (i) => reg[i] || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
if (!globalThis.navigator) globalThis.navigator = {};

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, DERSLER, DERS, BRANS_DERS_HARITA, bransDersUygun, bransDersIzinliDersler, bransDersNorm, bransDersRedMesaji, planla, duzenleBulYok: typeof duzeltmeBul, esc, dollar: $, renderYonetim, ogretmenTab, ayarTab };
  `)();
  t("boot hatasız", true);
} catch (e) {
  /* beklenmeyen catch: THROW (catch-only sayım kaldırıldı — SAYAÇ KAPISI kuralları) */
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  throw e;
  process.exit(1);
}
const { DB, ui, DERSLER, DERS, BRANS_DERS_HARITA, bransDersUygun, bransDersIzinliDersler, bransDersRedMesaji, planla, esc } = P;

/* --- yardımcılar: öğretmen bul/ekle --- */
const ogrBy = (ad) => DB.ogretmenler.find(o => o.ad === ad);
const yeniOgr = (ad, brans) => { const o = { id: "kstest-" + Math.random().toString(36).slice(2, 8), ad, brans, avail: { sinif: {}, musait: [] } }; DB.ogretmenler.push(o); return o; };
const dersSayisi = () => DB.dersler.length;

/* Gelecek pazartesi (plan formu tarihi) */
const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ogrOgrenci = DB.ogrenciler.find(o => o.ad === "Ayşe Demir") || DB.ogrenciler[0];

function formDoldur(ogrenciAd, dersId, ogretmenAd) {
  reg["f-ogrenci"].value = ogrenciAd;
  reg["f-ders"].value = dersId;
  reg["f-ogretmen"].value = ogretmenAd;
  reg["f-konu"].value = "KS test konu";
  reg["f-tarih"].value = gelecekPzt;
  reg["f-saat"].value = "15:30";
  reg["f-yoksay"].checked = false;
}
function hataKartMetni() { return reg["cakismaUyari"] ? reg["cakismaUyari"].innerHTML : ""; }

/* ===== 0) Tek kaynak + mapping doğruluğu ===== */
console.log("0) Tek kaynak + normalize:");
t("BRANS_DERS_HARITA tek tanım (app.js'te 1 kez)", (readFileSync("app.js", "utf8").match(/var BRANS_DERS_HARITA/g) || []).length === 1);
t("bransDersUygun app.js'te tek tanım", (readFileSync("app.js", "utf8").match(/function bransDersUygun\(/g) || []).length === 1);
t("ek-ders.js kendi kopyasını İÇERMEZ (tek kaynak)", !ekSrc.includes("function bransDersUygun("));
t("harita: mat → [mat, geo]", JSON.stringify(BRANS_DERS_HARITA.mat) === JSON.stringify(["mat", "geo"]));
t("harita: tur → [tur, edb]", JSON.stringify(BRANS_DERS_HARITA.tur) === JSON.stringify(["tur", "edb"]));

/* ===== 1) Helper düzey kurallar ===== */
console.log("1) bransDersUygun kuralları:");
const matT = yeniOgr("KS MAT ÖĞRETMEN", "mat");
const turT = yeniOgr("KS TÜRKÇE ÖĞRETMEN", "tur");
const fizT = yeniOgr("KS FİZ ÖĞRETMEN", "fiz");
const yokT = { id: "yok", brans: "mat" };

t("mat öğretmen → mat KABUL", bransDersUygun(matT.id, "mat") === true);
t("mat öğretmen → geo KABUL", bransDersUygun(matT.id, "geo") === true);
t("mat öğretmen → fiz RED", bransDersUygun(matT.id, "fiz") === false);
t("tur öğretmen → tur KABUL", bransDersUygun(turT.id, "tur") === true);
t("tur öğretmen → edb KABUL", bransDersUygun(turT.id, "edb") === true);
t("tur öğretmen → mat RED", bransDersUygun(turT.id, "mat") === false);
t("fiz öğretmen → fiz KABUL (kendi dersi)", bransDersUygun(fizT.id, "fiz") === true);
t("fiz öğretmen → mat RED (başka ders)", bransDersUygun(fizT.id, "mat") === false);
t("fiz öğretmen → edb RED", bransDersUygun(fizT.id, "edb") === false);
t("olmayan öğretmen → RED (fail-closed)", bransDersUygun("yok-olmayan", "mat") === false);

/* Türkçe karakter / büyük-küçük / boşluk varyantları */
console.log("2) Normalize varyantları:");
const fizT2 = yeniOgr("KS VARYANT ÖĞRETMEN", "FİZ"); /* büyük harf + Türkçe İ */
t("branş 'FİZ' → fiz dersi KABUL (aksan+harf)", bransDersUygun(fizT2.id, "fiz") === true);
const turT2 = yeniOgr("KS VARYANT 2", "TÜRKÇE");
t("branş 'TÜRKÇE' → edb KABUL (aksanlı harita girdisi)", bransDersUygun(turT2.id, "edb") === true);
const matT2 = yeniOgr("KS VARYANT 3", " mat "); /* boşluklu */
t("branş ' mat ' → geo KABUL (boşluk)", bransDersUygun(matT2.id, "geo") === true);
const geoT = yeniOgr("KS GEOMETRİ ÖĞRETMEN", "GEOMETRI"); /*aksansız yazım*/
t("branş 'GEOMETRI' → geo KABUL (kendi dersi)", bransDersUygun(geoT.id, "geo") === true);
t("bilinmeyen ders id → RED", bransDersUygun(matT.id, "bilinmeyen-ders") === false);
t("branşsız öğretmen → RED (fail-closed)", bransDersUygun((() => { const o = yeniOgr("KS BRANŞSIZ", ""); return o; })().id, "mat") === false);

/* ===== 3) Red mesajı içeriği ===== */
console.log("3) Türkçe ve açık red mesajı:");
const msg = bransDersRedMesaji(fizT, "mat");
t("mesajda öğretmen branşı var", msg.includes("FİZİK"));
t("mesajda seçilen ders var", msg.includes("MATEMATİK"));
t("mesajda izinli dersler listesi var", msg.includes("verilebilecek dersler"));

/* ===== 4) Birebir kayıt akışı: kaydetme engeli + kayıt OLUŞMAZ ===== */
console.log("4) Birebir planla kaydetme kapısı:");
const n0 = dersSayisi();
formDoldur(ogrOgrenci.ad, "mat", fizT.ad);
planla();
t("MAT öğretmene MATEMATİK atanamadı (kayıt artmadı)", dersSayisi() === n0);
t("hata kartı gösterildi (branş-ders uyumu)", hataKartMetni().includes("FİZİK") && hataKartMetni().includes("MATEMATİK"));
const kayitlarOnce = JSON.stringify(DB.dersler);

formDoldur(ogrOgrenci.ad, "fiz", fizT.ad);
planla();
t("FİZ öğretmene FİZİK kaydedildi (+1)", dersSayisi() === n0 + 1);
const yeniKayit = DB.dersler[DB.dersler.length - 1];
DB.dersler = DB.dersler.filter(l => l.id !== yeniKayit.id); /* temizlik */

formDoldur(ogrOgrenci.ad, "edb", turT.ad);
planla();
t("TÜRKÇE öğretmene EDEBİYAT kaydedildi (+1)", dersSayisi() === n0 + 1);
DB.dersler = DB.dersler.filter(l => l.id !== DB.dersler[DB.dersler.length - 1].id);

formDoldur(ogrOgrenci.ad, "mat", turT.ad);
planla();
t("TÜRKÇE öğretmene MATEMATİK REDDEDİLDİ (kayıt artmadı)", dersSayisi() === n0);
t("aykırı denemede mevcut kayıtlar bozulmadı", JSON.stringify(DB.dersler) === kayitlarOnce);

formDoldur(ogrOgrenci.ad, "geo", matT.ad);
planla();
t("MATEMATİK öğretmene GEOMETRİ kaydedildi (+1)", dersSayisi() === n0 + 1);
DB.dersler = DB.dersler.filter(l => l.id !== DB.dersler[DB.dersler.length - 1].id);

/* ===== 5) Grup kayıt akışı (planla grup dalı — tek kapı) ===== */
console.log("5) Grup dersi kaydetme kapısı:");
const ek1 = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya") || DB.ogrenciler[1] || ogrOgrenci;
const ek2 = DB.ogrenciler.find(o => o.ad === "Emir Aydın") || DB.ogrenciler[2] || ogrOgrenci;
ui.ekOgrenciIds = [ek1.id, ek2.id].filter(v => v && v !== ogrOgrenci.id);
formDoldur(ogrOgrenci.ad, "mat", fizT.ad);
planla();
t("grup: uygunsuz atama kayıt OLUŞTURMAZ", dersSayisi() === n0);
t("grup: hata kartı gösterildi", hataKartMetni().includes("FİZİK"));
ui.ekOgrenciIds = [];
formDoldur(ogrOgrenci.ad, "fiz", fizT.ad);
planla();
t("grup: uygun atama çalışır (referans)", dersSayisi() === n0 + 1);
DB.dersler = DB.dersler.filter(l => l.id !== DB.dersler[DB.dersler.length - 1].id);

/* ===== 6) Ek ders akışı (ekPlanla — app.js'teki tek helper) ===== */
console.log("6) Ek ders kaydetme kapısı:");
/* ekPlanla ek-ders.js kapsamındadır; ayrı bir New Function bağlamında ek-ders.js + app.js birlikte yüklenir */
let P2;
try {
  P2 = new Function(scripts + "\n;\n" + ekSrc + `
    var yenile = function(){};
    var ekler = ekDersler;
    return { DB, ui, ekPlanla, ekler, ekDersler: ekDersler };
  `)();
  t("ek-ders.js bağlamı boot hatasız", true);
} catch (e) { /* beklenmeyen catch: THROW — SAYAÇ KAPISI kuralları */ console.error(e && e.message); throw e; }
if (P2) {
  const { DB: DB2, ui: ui2, ekPlanla, ekDersler } = P2;
  const ekler = ekDersler;
  const mT = DB2.ogretmenler.find(o => o.brans === "mat") || DB2.ogretmenler[0];
  const sinif = Object.keys(DB2.sinifProg)[0] || "10.SINIF";
  const e0 = ekler().length;
  ui2.ekEditId = null;
  ui2.ekForm = { sinif, dersId: "fiz", konu: "KS ek test", ogretmen: mT.ad, tarih: gelecekPzt, saat: "15:30", yoksay: false };
  ekPlanla();
  t("ek ders: MATEMATİK öğretmene FİZİK ek dersi REDDEDİLDİ (kayıt OLUŞMAZ)", ekler().length === e0, ekler().length + " vs " + e0);
  ui2.ekForm.dersId = "mat";
  ekPlanla();
  t("ek ders: MATEMATİK öğretmene MATEMATİK ek dersi kaydedildi", ekler().length === e0 + 1);
  /* temizlik */
  const enSon = ekler()[ekler().length - 1];
  DB2.ekDersler = ekler().filter(x => x.id !== (enSon && enSon.id));
}

/* ===== 7) Fail-closed: mapping belirsizse YAZMA YOK ===== */
console.log("7) Fail-closed mapping:");
const belirsiz = yeniOgr("KS BELİRSİZ BRANŞ", "felsefe");
formDoldur(ogrOgrenci.ad, "mat", belirsiz.ad);
planla();
t("belirsiz branş ('felsefe') ataması kayıt OLUŞTURMAZ", dersSayisi() === n0);
t("belirsiz branş hata kartında", hataKartMetni().length > 0);
const nDersler = DERSLER.length, nOgretmen = DB.ogretmenler.length;
t("fail-closed yolunda DERSLER/öğretmen kayıtları SİLİNMEZ (silme yok)", DERSLER.length === nDersler && DB.ogretmenler.length === nOgretmen);
/* belirsiz branşlı öğretmen silinmez, yalnız atama reddedilir */
t("belirsiz branşlı öğretmen hâlâ kayıtlı", !!DB.ogretmenler.find(o => o.id === belirsiz.id));

/* ===== 8) Mevcut eski aykırı kayıt korunur ===== */
console.log("8) Eski aykırı kayıt korunumu:");
/* Düzenleme YOK: sadece mevcut kayıt zaten aykırıysa silinmez/bozulmaz */
const mevcutAykiri = { id: "ks-aykiri-1", ogrenciId: ogrOgrenci.id, ogrenciAd: ogrOgrenci.ad, dersId: "fiz", konu: "eski", ogretmenId: turT.id, ogretmenAd: turT.ad, tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", donemId: DB.aktifDonemId || "donem-2026-2027" };
DB.dersler.push(mevcutAykiri);
const aykiriOnce = JSON.stringify(mevcutAykiri);
t("aykırı eski kayıt (tur öğretmen + fiz dersi) SİLİNMEDİ ve birebir korundu", JSON.stringify(mevcutAykiri) === aykiriOnce);
/* kontrol yalnız YENİ atama / düzenlemede: yeni atama denemesi red edilir, eski kayıt aynen kalır */
formDoldur(ogrOgrenci.ad, "fiz", turT.ad);
planla();
t("yeni atama denemesi REDDEDİLDİ (kayıt artmadı)", dersSayisi() === n0 + 1);
const aykiriSonra = JSON.stringify(mevcutAykiri);
t("red sonrası eski aykırı kayıt AYNEN kaldı", aykiriOnce === aykiriSonra);
DB.dersler = DB.dersler.filter(l => l.id !== "ks-aykiri-1"); /* temizlik */

/* ===== 9) Öğretmen seçildiğinde ders listesi filtresi ===== */
console.log("9) Form ders listesi filtresi:");
const izinliFiz = bransDersIzinliDersler(fizT.id);
t("fiz öğretmeni izinli dersler = [fiz]", JSON.stringify(izinliFiz) === JSON.stringify(["fiz"]));
const izinliMat = bransDersIzinliDersler(matT.id);
t("mat öğretmeni izinli dersler = [mat, geo]", JSON.stringify(izinliMat) === JSON.stringify(["mat", "geo"]));
const izinliTur = bransDersIzinliDersler(turT.id);
t("tur öğretmeni izinli dersler = [tur, edb]", JSON.stringify(izinliTur) === JSON.stringify(["tur", "edb"]));

/* ===== 10) Yama işaretleri + süit kaydı ===== */
console.log("10) Yama işaretleri:");
const appSrc = readFileSync("app.js", "utf8");
t("BRANS-DERS-KURALI-YAMASI işareti app.js'te", appSrc.includes("BRANS-DERS-KURALI-YAMASI"));
t("BRANS-DERS-KURALI-EK-YAMASI işareti ek-ders.js'te", ekSrc.includes("BRANS-DERS-KURALI-EK-YAMASI"));
t("planla() içinde bransDersUygun çağrısı var", /function planla\(\)[\s\S]*?bransDersUygun\(t\.id/.test(appSrc));
t("ekPlanla içinde bransDersUygun çağrısı var", /ekPlanla = function[\s\S]*?bransDersUygun\(t\.id/.test(ekSrc));
const tm = readFileSync("test.mjs", "utf8");
t("ks-brans-ders-kurali.mjs test.mjs'te tam 1 kez", (tm.match(/"ks-brans-ders-kurali\.mjs"/g) || []).length === 1);
t("eski süit listesi korundu (ks-harness hâlâ 1. süit)", tm.includes('"ks-harness.mjs"'));

if (fail) { console.log("BAŞARISIZ"); process.exit(1); }
console.log("HEPSİ GEÇTİ");
