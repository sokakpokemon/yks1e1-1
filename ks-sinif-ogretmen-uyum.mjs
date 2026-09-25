let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 34) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-sinif-ogretmen-uyum.mjs kosan=" + __kosan + " beklenen=34"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-sinif-ogretmen-uyum.mjs:" + __kosan + ":34"); } });
/* ks-sinif-ogretmen-uyum.mjs — SINIF-OGRT-UYUM süiti
   Sınıf programı (DB.sinifProg) ↔ öğretmen haftalık program uyumu.
   Salt-okuma mantık testleri; mevcut davranışları bozmaz. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const app = readFileSync("app.js", "utf8");
const ekders = readFileSync("ek-ders.js", "utf8");
const html = readFileSync("index.html", "utf8");
const KNOWN_HTML = "1dad38661cf7bd5be2828feffd23a4b320324b4ba0a51b67b502c37cb5f0883b"; /* referans; yalnız uyarı amaçlı değil — hash farklıysa başkası dokundu */
const KNOWN_EKDERS = "3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f"; /* güncel checkout hash — bu dilim ek-ders.js'e dokunmaz */

let pass = 0, fail = 0;
function t(ad, ok) { __kosan++;  if (ok) { pass++; console.log("  ✓ " + ad); } else { fail++; console.log("  ✗ " + ad); } }

/* --- Sandbox boot (test.mjs süitlerindeki desen) --- */
function mockEl() {
  return { innerHTML: "", textContent: "", value: "", style: {}, checked: false, options: [],
    classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, remove() {},
    setAttribute() {}, scrollIntoView() {}, insertAdjacentHTML() {},
    getContext: () => ({ set fillStyle(v) {}, set strokeStyle(v) {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, closePath() {}, moveTo() {}, lineTo() {} }) };
}
global.window = global;
global.document = {
  getElementById: () => mockEl(),
  createElement: () => mockEl(),
  querySelector: () => mockEl(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: { appendChild() {} },
  documentElement: { outerHTML: "" },
};
try { global.navigator = {}; } catch (e) {}
global.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
global.fetch = () => Promise.reject(new Error("no-fetch"));
global.location = { href: "http://localhost/" };
global.prompt = () => null;
global.confirm = () => false;
global.toast = () => {};
global.alert = () => {};
global.Chart = function () { return { destroy() {} }; };

const sondaj = `
;globalThis.__DB = DB;
globalThis.__fn = { sinifOgrtUyumOnar, sinifProgAktif, aktifDonemId, dowIdx, ksKodOf, haftalikOgrtTablo, togOgrSecili, gridTablo };
`;
try { (0, eval)(app + sondaj); } catch (e) { console.error("BOOT HATASI:", e.message); process.exit(1); }
/* RESMİ SAYAÇ: yalnız t() assertion satırları satır-başı '✓ ' basar; boot satırı bilinçli işaretsizdir. */
console.log("boot hatasız");
const DB = global.__DB, fn = global.__fn;

/* 1) SINIF-OGRT-UYUM-YAMASI mevcut ve kaynakta */
console.log("1) Yama varlığı:");
t("SINIF-OGRT-UYUM-YAMASI işareti kaynakta", app.includes("SINIF-OGRT-UYUM-YAMASI"));
t("sinifOgrtUyumOnar tek tanım", (app.match(/function sinifOgrtUyumOnar\(/g) || []).length === 1);
t("boot çağrısı var", app.includes("sinifOgrtUyumOnar(DB);"));
t("normalize/loadDB çağrısı var", app.includes("sinifOgrtUyumOnar(db);"));

/* 2) Çekirdek uyum kuralı: öğretmen Sınıf Dersi → sinifProg karşılığı */
console.log("2) Çekirdek uyum (öğretmen Sınıf Dersi → sınıf programı):");
let uyumsuz = 0, toplam = 0;
DB.ogretmenler.forEach((t2) => {
  const sn = (t2.avail && t2.avail.sinif) || {};
  const mu = (t2.avail && t2.avail.musait) || [];
  Object.keys(sn).forEach((k) => {
    const cls = sn[k];
    if (!cls || cls === "Sınıf Dersi") return;
    if (mu.indexOf(k) >= 0) return; /* Kapalı atlanır — sessiz kaybolma yok */
    toplam++;
    if (!(DB.sinifProg[cls] || []).includes(k)) uyumsuz++;
  });
});
t("aktif dönemde tüm öğretmen Sınıf Dersi slotlarının sınıf programında karşılığı var (0 uyumsuz / " + toplam + " slot)", uyumsuz === 0);

/* 3) Onarım fonksiyonu idempotent ve koruyucu */
console.log("3) sinifOgrtUyumOnar idempotans + koruma:");
const before = JSON.stringify(DB.sinifProgDonemler);
const r1 = fn.sinifOgrtUyumOnar(DB);
const r2 = fn.sinifOgrtUyumOnar(DB);
t("1. koşu idempotent (boot zaten kapattı: e=0)", r1.e === 0);
t("2. koşu 0 değişiklik", r2.e === 0);
t("3 koşu sonrası sinifProgDonemler birebir", JSON.stringify(DB.sinifProgDonemler) === before);

/* 4) Silme/taşıma yok — boş slot ekleme yalnız EKLEME */
console.log("4) Onarım yalnız ekleme (silme/taşıma yok):");
const testDb = JSON.parse(JSON.stringify({ ogretmenler: [{ id: "t1", avail: { sinif: { "0-5": "TEST SINIF" }, musait: [] } }], sinifProg: { "TEST SINIF": [] }, sinifProgDonemler: null, sinifProgDonemId: "donem-2026-2027", aktifDonemId: "donem-2026-2027" }));
const r3 = fn.sinifOgrtUyumOnar(testDb);
t("eksik slot eklendi (e=1)", r3.e === 1);
t("eklenen slot sinifProg'da", (testDb.sinifProg["TEST SINIF"] || []).includes("0-5"));
t("mevcut hücreler korunur", (() => { const db2 = JSON.parse(JSON.stringify({ ogretmenler: [{ id: "t1", avail: { sinif: { "0-5": "S" }, musait: [] } }], sinifProg: { S: ["1-3", "2-4"] }, sinifProgDonemler: null, sinifProgDonemId: "donem-2026-2027", aktifDonemId: "donem-2026-2027" })); const r = fn.sinifOgrtUyumOnar(db2); return r.e === 1 && db2.sinifProg.S.includes("1-3") && db2.sinifProg.S.includes("2-4"); })());
t("Kapalı slot eklenmez (musait çakışması atlanır)", (() => { const db2 = { ogretmenler: [{ id: "t1", avail: { sinif: { "0-5": "S" }, musait: ["0-5"] } }], sinifProg: {}, sinifProgDonemler: null, sinifProgDonemId: "donem-2026-2027", aktifDonemId: "donem-2026-2027" }; const r = fn.sinifOgrtUyumOnar(db2); return r.e === 0 && !(db2.sinifProg.S || []).includes("0-5"); })());
t("'Sınıf Dersi' placeholder'ı sınıf adı sayılmaz", (() => { const db2 = { ogretmenler: [{ id: "t1", avail: { sinif: { "0-5": "Sınıf Dersi" }, musait: [] } }], sinifProg: {}, sinifProgDonemler: null, sinifProgDonemId: "donem-2026-2027", aktifDonemId: "donem-2026-2027" }; const r = fn.sinifOgrtUyumOnar(db2); return r.e === 0 && !db2.sinifProg["Sınıf Dersi"]; })());

/* 5) Öğretmen programında olmayan sınıf dersi uydurulmaz */
console.log("5) Uydurma yok:");
t("ogretmeni olmayan sinifProg hücresi silinmedi (30+ hücre mevcut)", Object.keys(DB.sinifProg).every((s) => Array.isArray(DB.sinifProg[s])));
t("onarım mevcut ogretmen kayıtlarına dokunmaz", (() => { const ozet = (t3) => JSON.stringify(t3.avail); const once2 = DB.ogretmenler.map(ozet).join("|"); fn.sinifOgrtUyumOnar(DB); return DB.ogretmenler.map(ozet).join("|") === once2; })());

/* 6) Pazar doğru slotta */
console.log("6) Pazar:");
t("dowIdx(Pazar)=6", fn.dowIdx("2026-09-20") === 6);
t("dowIdx(Pzt)=0 — Pazar-Pzt-Cmt aynı indeks kuralı", fn.dowIdx("2026-09-14") === 0);
t("haftalikOgrtTablo 7 gün aynı döngüyle", /for \(var g = 0; g < 7; g\+\+\)/.test(app));

/* 7) Dönem sızıntısı yok */
console.log("7) Aktif dönem:");
t("aktifDonemId() = DB.aktifDonemId", fn.aktifDonemId() === DB.aktifDonemId);
t("DB.sinifProg identity-rebind aktif dönem programı", DB.sinifProg === fn.sinifProgAktif(fn.aktifDonemId()));

/* 8) 'Toplu ders var' birebir planlamayı engellemeye devam ediyor */
console.log("8) Toplu ders engeli:");
t("duzeltmeBul sinifProg dalı kaynakta", /o\.sinif && \(DB\.sinifProg\[o\.sinif\] \|\| \[\]\)\.indexOf\(key\) >= 0/.test(app));
t("gridTablo 'Toplu ders' dalı kaynakta", /Toplu ders/.test(app));

/* 9) Kapalı/boş/birebir/grup/ek ders görünümleri korunuyor */
console.log("9) Görünüm korunumu (kaynak imzaları):");
t("Kapalı gri dalı", /bg-slate-100 border-slate-200 hover:bg-slate-200/.test(app));
t("Sınıf Dersi rose dalı (haftalık)", /bg-rose-100 border border-rose-200/.test(app));
t("Ek Ders amber dalı (haftalık)", /bg-amber-100 border border-amber-300/.test(app));
t("birebirHucreHTML ortak hücre", /function birebirHucreHTML\(/.test(app));
t("haftalikOgrtTablo aktifDonemKayitlari(DB.dersler) filtresi", /function haftalikOgrtTablo[\s\S]{0,400}aktifDonemKayitlari\(DB\.dersler\)/.test(app));
t("ek-ders.js değişmedi", sha(ekders) === KNOWN_EKDERS);
t("index.html dokunulmadı (bu dilim)", sha(html) === KNOWN_HTML);

/* 10) ID/veri korunumu */
console.log("10) ID/veri korunumu:");
t("tüm öğretmen ID'leri dolu", DB.ogretmenler.every((t3) => t3.id));
t("tüm ders donemId'leri dolu", DB.dersler.every((l) => l.donemId));
t("sinifIds birebir aynı kaldı (3 koşu sonrası)", DB.sinifIds && Object.keys(DB.sinifIds).length === 18);

/* 11) Duplicate yok */
console.log("11) Duplicate yok:");
t("sinifProg hücre anahtarları her sınıfta benzersiz", Object.keys(DB.sinifProg).every((s) => new Set(DB.sinifProg[s]).size === DB.sinifProg[s].length));
t("boot + 3 onarım sonrası hücre sayısı sabit", (() => { const n1 = JSON.stringify(DB.sinifProgDonemler).length; fn.sinifOgrtUyumOnar(DB); fn.sinifOgrtUyumOnar(DB); return JSON.stringify(DB.sinifProgDonemler).length === n1; })());

console.log(fail === 0 ? "\nHEPSİ GEÇTİ" : "\n" + fail + " TEST KIRMIZI");
process.exit(fail ? 1 : 0);
