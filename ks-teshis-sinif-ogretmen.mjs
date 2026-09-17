/* ks-teshis-sinif-ogretmen.mjs — SALT-OKUMA teşhis (yazma YOK).
   Sinif programı (DB.sinifProg) ↔ öğretmen haftalık program (avail.sinif) uyumunu ölçer. */
import { readFileSync } from "node:fs";

const app = readFileSync("app.js", "utf8");

/* --- app.js'i sandbox'ta değerlendir: DB'yi dışa aktaran yardımcı ekle --- */
global.window = global;
global.document = {
  getElementById: () => mockEl(),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {}, remove() {}, setAttribute() {} }),
  body: { appendChild() {} },
  documentElement: { outerHTML: "" },
};
function mockEl() {
  return { innerHTML: "", textContent: "", value: "", style: {}, checked: false, options: [],
    classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, remove() {},
    setAttribute() {}, scrollIntoView() {}, insertAdjacentHTML() {},
    getContext: () => ({ set fillStyle(v) {}, set strokeStyle(v) {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, closePath() {}, moveTo() {}, lineTo() {} }) };
}
try { global.navigator = {}; } catch (e) {} /* Node 21+ read-only getter */
global.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};
global.fetch = () => Promise.reject(new Error("no-fetch"));
global.location = { href: "http://localhost/" };
global.prompt = () => null;
global.confirm = () => false;
global.toast = () => {};
global.alert = () => {};
global.Chart = function () { return { destroy() {} }; };

const sondaj = `
;globalThis.__DB = DB;
globalThis.__fn = { togOgrSecili, togOgr, togSinif, haftalikOgrtTablo, gridTablo, duzeltmeBul,
  aktifDonemId, aktifDonemKayitlari, sinifProgDonemleriBaslat, sinifProgAktif, donemSeciliSinifProg,
  dersOgrenciIds, dowIdx, ksKodOf, pencere };
`;
const kod = app + sondaj;
(0, eval)(kod);

const DB = global.__DB;
const fn = global.__fn;
const satir = (b) => console.log((b ? "  ✓ " : "  ✗ "));

console.log("=== 1-2) sinifProg veri şeması ===");
const siniflar = Object.keys(DB.sinifProg || {});
let topluToplam = 0;
siniflar.forEach((s) => { topluToplam += (DB.sinifProg[s] || []).length; });
console.log("  sinifProg sınıf sayısı:", siniflar.length, "· toplu ders hücresi toplamı:", topluToplam);
satir(siniflar.every((s) => Array.isArray(DB.sinifProg[s])));
console.log("  → tüm değerler dizi (G-K anahtar listesi; öğretmen/ders bilgisi YOK)");
satir(siniflar.flatMap((s) => DB.sinifProg[s]).every((k) => /^\d-\d+$/.test(k)));
console.log("  → tüm anahtarlar GÜN-KOD biçiminde (0-6 gün, 1-11 kod)");

console.log("=== 3) Öğretmen programı kaynağı ===");
satir(/aktifDonemKayitliari|aktifDonemKayitlari\(DB\.dersler\)/.test(app) && /function haftalikOgrtTablo[\s\S]{0,400}aktifDonemKayitlari\(DB\.dersler\)/.test(app));
console.log("  → haftalikOgrtTablo dersleri aktifDonemKayitlari(DB.dersler)'dan alıyor (DB.dersler + aktif dönem)");
satir(/avail\.sinif && key in avail\.sinif/.test(app));
console.log("  → 'Sınıf Dersi' hücresi öğretmenin kendi avail.sinif'ından (G-K → sınıf adı)");

console.log("=== 4) 'Toplu ders var' karşılığı ===");
console.log("  → gridTablo(tip='sinif') DB.sinifProg[sinifAd] dizisini 'var' (mavi) olarak çizer; öğretmen tarafında karşılığı yok (öğretmen ataması veri modelinde bulunmuyor)");

console.log("=== 5-6) UYUM ÖLÇÜMÜ (aynı aktif dönem, aynı gün+kod) ===");
/* Yön A: öğretmen 'Sınıf Dersi' (avail.sinif[k]=cls) → sinifProg[cls] k içermeli */
let eksikA = [];
DB.ogretmenler.forEach((t) => {
  const sn = (t.avail && t.avail.sinif) || {};
  Object.keys(sn).forEach((k) => {
    const cls = sn[k];
    if (!cls || cls === "Sınıf Dersi") return;
    if (!(DB.sinifProg[cls] || []).includes(k)) eksikA.push(t.ad + " · " + cls + " · " + k);
  });
});
console.log("  Yön A (öğretmen Sınıf Dersi → sınıf programında karşılığı):", eksikA.length, "uyumsuz");
eksikA.slice(0, 12).forEach((x) => console.log("    -", x));

/* Yön A ters: sinifProg[cls] k → hiçbir öğretmenin avail.sinif'i bunu göstermiyor mu (bilgi amaçlı; öğretmen ataması olmadığından normal) */
console.log("  Yön A ters (sınıf hücresi → öğretmen): veri modelinde öğretmen-sınıf ataması olmadığından türetilemez — kural tek yönlü uygulanır");

console.log("=== 7) Pazar indeks/tarih ===");
satir(fn.dowIdx("2026-09-20") === 6); /* 20 Eyl 2026 Pazar */
satir(fn.dowIdx("2026-09-14") === 0); /* 14 Eyl Pzt */
console.log("  → dowIdx: 0=Pzt … 6=Paz; gridTablo & haftalikOgrtTablo aynı 0..6 döngüsünü kullanıyor");
satir(/Pazar|GUN_KISA\[g\]/.test(app) && /for \(var g2? = 0; g2? < 7;/.test(app));

console.log("=== 8) Aktif dönem sızıntısı ===");
satir(fn.aktifDonemId() === DB.aktifDonemId);
const aktifProg = fn.sinifProgAktif(fn.aktifDonemId());
satir(DB.sinifProg === aktifProg);
console.log("  → DB.sinifProg identity-rebind ile aktif dönem programına bağlı; başka dönem programı görünümde YOK");
satir(/sinifProguDonemeBagla/.test(app));

console.log("=== 9-10) Kapalı/birebir/toplu çakışma davranışı ===");
const u1 = fn.duzeltmeBul({ ogretmenId: DB.ogretmenler[0].id, ogrenciId: (DB.ogrenciler[0] || {}).id, tarih: "2030-01-07", saat: "15:30" }, false, []);
satir(Array.isArray(u1));
console.log("  → duzeltmeBul çalışıyor; sinifProg toplu ders uyarısı mevcut (o.sinif dalı)");
satir(/o\.sinif && \(DB\.sinifProg\[o\.sinif\] \|\| \[\]\)\.indexOf\(key\) >= 0/.test(app));

console.log("=== ÖZET ===");
console.log(eksikA.length === 0 ? "SONUÇ: gerçek uyumsuzluk YOK (Yön A tam uyum)" : "SONUÇ: Yön A uyumsuzluk SAYISI = " + eksikA.length + " → patch gerekli");
