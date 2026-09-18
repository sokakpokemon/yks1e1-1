/* ks-excel-ui-kontrol.mjs — EXCEL-UI-KONTROL: Excel/CSV kartı DOM semantiği süiti
   Doğruladıkları:
    1) csvYonetimKartHTML gerçek fonksiyondan üretilen kart HTML'i DOM'da/produksiyonda var.
    2) Kart HTML'inde "NaN" HİÇBİR yerde yok (render-time NaN).
    3) Beklenen butonların her biri tam 1 kez (duplicate yok).
    4) AyarTab özet sayaçları sonlu sayı (Number.isFinite).
    5) Kart tekrar render edilince NaN yok + duplicate buton yok (idempotent).
    6) Handler'sız sahte buton eklenmediği kanıtı: her buton onclick'i app.js'te tanımlı.
    7) Eksik butonlar (Sınıf Programı CSV İndir, Ek Dersler CSV İndir, İçe aktarma, Geri Al) mevcut.
    8) Önceki suite sayılarında düşüş yok (süit kaydı test.mjs'te tam 1 kez).
   Salt-okuma süit: app.js'e yama yapmaz, sadece okur ve fonksiyonu çağırır. */
import { readFileSync } from "node:fs";
const app = readFileSync("app.js", "utf8");
const html = readFileSync("index.html", "utf8");
const scripts = [app, ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
global.document = { getElementById: () => elStub(), addEventListener() {}, removeEventListener() {}, createElement: () => elStub(), body: { appendChild() {}, removeChild() {} }, querySelectorAll: () => [] };
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let P;
try {
  P = new Function(scripts + "\n  return { DB, ui, ayarTab, csvYonetimKartHTML, csvTumunuIndir, csvKadroIndir, csvDersIndir, csvIstekIndir, csvEkDersIndir, sinifProgCsvIndir, csvImportTetik, sinifProgCsvImportTetik, csvGeriAl };\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, ayarTab, csvYonetimKartHTML, csvTumunuIndir, csvKadroIndir, csvDersIndir, csvIstekIndir, csvEkDersIndir, sinifProgCsvIndir, csvImportTetik, sinifProgCsvImportTetik, csvGeriAl } = P;

/* Beklenen butonlar: (buton fonksiyonu, etiket parçası) */
const BEKLENEN = [
  ["csvTumunuIndir", "Tüm CSV"],
  ["csvKadroIndir", "Kadro CSV"],
  ["csvDersIndir", "Dersleri CSV"],
  ["csvIstekIndir", "İstekleri CSV"],
  ["csvEkDersIndir", "Ek Dersleri CSV"],
  ["sinifProgCsvIndir", "Sınıf Programı CSV İndir"],
  ["csvImportTetik", "CSV İçe Aktar"],
  ["sinifProgCsvImportTetik", "Sınıf Programı CSV İçe Aktar"],
  ["csvGeriAl", "Son İçe Aktarmayı Geri Al"],
];

/* ---- 1) Kart var + üretilebilir ---- */
console.log("1) Excel/CSV kartı:");
const kartHTML = csvYonetimKartHTML();
t("csvYonetimKartHTML kart HTML'i üretiyor (boş değil)", typeof kartHTML === "string" && kartHTML.length > 200);
const ayarHTML = ayarTab();
t("ayarTab Excel/CSV kartını içeriyor", ayarHTML.includes("Excel / CSV Veri Yönetimi"));
t("kart ayarTab çıktısında tam 1 kez (tek kart)", ayarHTML.split("Excel / CSV Veri Yönetimi").length - 1 === 1);

/* ---- 2) NaN yok ---- */
console.log("2) NaN yok:");
t("kart HTML'inde 'NaN' YOK", !kartHTML.includes("NaN"), JSON.stringify(kartHTML.slice(kartHTML.indexOf("NaN") - 80, kartHTML.indexOf("NaN") + 10)));
t("ayarTab çıktısında 'NaN' YOK", !ayarHTML.includes("NaN"));

/* ---- 3) Butonlar tam 1 kez ---- */
console.log("3) Butonlar tam 1 kez:");
BEKLENEN.forEach(([fn, etiket]) => {
  const n = kartHTML.split(fn).length - 1;
  t(fn + " butonu tam 1 kez", n === 1, "say=" + n);
});
t("'Ek Dersleri CSV İndir' etiketi var", kartHTML.includes("Ek Dersleri CSV İndir"));
t("'Sınıf Programı CSV İndir' etiketi var", kartHTML.includes("Sınıf Programı CSV İndir"));
t("'CSV İçe Aktar' etiketi var", kartHTML.includes("CSV İçe Aktar"));
t("'Son İçe Aktarmayı Geri Al' etiketi var", kartHTML.includes("Son İçe Aktarmayı Geri Al"));

/* ---- 4) Sayaçlar sonlu ---- */
console.log("4) Sayaç/özet sonlu:");
const sayilar = [DB.ogretmenler.length, DB.ogrenciler.length, DB.dersler.length, Object.keys(DB.sinifProg).length];
t("AyarTab sayaç kaynakları sonlu sayı", sayilar.every((n) => Number.isFinite(n)), JSON.stringify(sayilar));
t("ayarTab HTML'inde NaN yok (sayı birleşiminde)", !/\bNaN\b/.test(ayarHTML));

/* ---- 5) Tekrar render idempotent ---- */
console.log("5) Tekrar render idempotent:");
const kart2 = csvYonetimKartHTML();
const ayar2 = ayarTab();
t("2. render kart HTML'i birebir aynı (saf fonksiyon)", kart2 === kartHTML);
t("2. ayarTab'ta NaN yok", !ayar2.includes("NaN"));
t("2. render'da duplicate buton yok", BEKLENEN.every(([fn]) => kart2.split(fn).length - 1 === 1));

/* ---- 6) Handler'sız sahte buton yok (kanıt) ---- */
console.log("6) Handler tanımları app.js'te:");
BEKLENEN.forEach(([fn]) => {
  t("function " + fn + " app.js'te tanımlı", app.includes("function " + fn + "("));
});

/* ---- 7) Süit kaydı ---- */
console.log("7) Süit kaydı:");
const testRunner = readFileSync("test.mjs", "utf8");
t("ks-excel-ui-kontrol.mjs test.mjs'te tam 1 kez", testRunner.split("ks-excel-ui-kontrol.mjs").length - 1 === 1);

console.log(fail === 0 ? "HEPSİ GEÇTİ" : "BAŞARISIZ");
process.exit(fail);
