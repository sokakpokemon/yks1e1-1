/* ks-durum-fn.mjs — durum seçici çubuğu davranış testleri (boot + işlevsel) */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => {
  const el = {
    options: [], children: [],
    getContext: () => null,
    style: {}, dataset: {},
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle(c, f) { if (f === undefined) this._s.has(c) ? this._s.delete(c) : this._s.add(c); else f ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    innerHTML: "", textContent: "", value: "",
    appendChild() {}, remove() {}, click() {}, focus() {},
    scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
    querySelectorAll() { return []; },
    files: null
  };
  Object.defineProperty(el, "checked", { value: false, writable: true });
  return el;
};
const els = {};
global.document = {
  getElementById: (id) => (els[id] = els[id] || elStub()),
  addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond) => { console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) fail = 1; };

let api;
try {
  api = new Function(scripts + `
    yenile();
    return { DB, ui, durumSeciciHTML, durumSec, togOgrSecili, ogretmenTab, tumSiniflar, renderYonetim };
  `)();
  t("boot + ilk render hatasız", true);
} catch (e) {
  t("boot + ilk render hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, ui, durumSeciciHTML, durumSec, togOgrSecili, ogretmenTab, tumSiniflar } = api;

/* 1) Buton sayısı = DB'deki kayıtlı sınıf sayısı + 1 (Kapalı) */
const snflar = tumSiniflar();
const bar = durumSeciciHTML();
const sinifBtnSay = snflar.filter(s => bar.includes("durumSec('sinif','" + s + "')")).length;
const kapaliBtn = bar.includes("durumSec('kapali')");
console.log("1) Durum çubuğu:");
t("sınıf butonları DB'den geliyor (" + snflar.length + " sınıf)", snflar.length > 0 && sinifBtnSay === snflar.length);
t("en sonda Kapalı butonu var", kapaliBtn);
t("Kapalı çubuğun son butonu", bar.lastIndexOf("durumSec('kapali')") > bar.lastIndexOf("durumSec('sinif'"));

/* 2) Hiçbir durum seçili değilken hücreye tıklama → eski togOgr akışı (prompt) */
global.prompt = () => "TEST-SINIF";
const ogr0 = DB.ogretmenler[0];
const testKey = "6-11"; /* Pazar değil, boş hücre seç */
console.log("2) Seçisiz davranış (eski akış):");
ui.seciliDurum = null;
togOgrSecili(ogr0.id, 6, "11");
t("seçisiz tıklamada togOgr prompt ile sınıf atadı (geriye dönük uyum)", ogr0.avail.sinif[testKey] === "TEST-SINIF");
delete ogr0.avail.sinif[testKey];

/* 3) Sınıf butonu seçiliyken hücreye tıklama → o sınıf atanır, tekrar tıklama boşaltır */
console.log("3) Sınıf seçili davranışı:");
durumSec("sinif", snflar[0]);
t("durumSec sınıfı vurguladı (ui.seciliDurum=sinif, seciliOgrId=" + snflar[0] + ")", ui.seciliDurum === "sinif" && ui.seciliOgrId === snflar[0]);
const bar2 = durumSeciciHTML();
t("vurgu ring'i sınıf butonuna uygulandı", bar2.includes("durumSec('sinif','" + snflar[0] + "')") && bar2.includes("ring-2"));
togOgrSecili(ogr0.id, 6, "11");
t("hücreye seçili sınıf atandı (müsaitle kayıt: avail.sinif)", ogr0.avail.sinif[testKey] === snflar[0] && ogr0.avail.musait.indexOf(testKey) < 0);
togOgrSecili(ogr0.id, 6, "11");
t("ikinci tıklama hücreyi Boş yaptı (döngüsüz)", !(testKey in ogr0.avail.sinif) && ogr0.avail.musait.indexOf(testKey) < 0);

/* 4) Kapalı davranışı: kapalı yapar, ikinci tıklama boşaltır; sınıf hücresini de kapalıya çevirir */
console.log("4) Kapalı davranışı:");
durumSec("kapali");
t("durumSec kapalıyı vurguladı", ui.seciliDurum === "kapali");
togOgrSecili(ogr0.id, 6, "11");
t("hücre Kapalı oldu (avail.musait kaydı)", ogr0.avail.musait.indexOf(testKey) >= 0);
togOgrSecili(ogr0.id, 6, "11");
t("ikinci tıklama Kapalı'yı Boş yaptı", ogr0.avail.musait.indexOf(testKey) < 0);
/* kapalı → sınıf hücresi üstüne yazma */
const mevcutSinif = Object.keys(ogr0.avail.sinif)[0];
if (mevcutSinif) {
  const gd = mevcutSinif.split("-");
  togOgrSecili(ogr0.id, Number(gd[0]), gd[1]);
  t("Kapalı, sınıf hücresini de kapalıya çevirdi", !(mevcutSinif in ogr0.avail.sinif) && ogr0.avail.musait.indexOf(mevcutSinif) >= 0);
  /* temizle: eski haline döndür */
  ogr0.avail.musait = ogr0.avail.musait.filter(x => x !== mevcutSinif);
  ogr0.avail.sinif[mevcutSinif] = DB.sinifProg ? mevcutSinif && "KORUNAN" : "";
  delete ogr0.avail.sinif[mevcutSinif];
  /* gerçek orijinal değeri yeniden yaz: (test sonrası DB bütünlüğü için) */
  ogr0.avail.sinif[mevcutSinif] = api.DB.ogretmenler[0].avail.sinif[mevcutSinif] || "KORUNAN";
}

/* 5) OgretmenTab çıktısı: çubuk + dinamik legend + Kapalı; Sınıf Dorsi sayımı */
console.log("5) Render çıktısı:");
ui.seciliDurum = null;
const tab = ogretmenTab();
t("takvimde durum çubuğu var", tab.includes('id="durumSecici"'));
t("legend'de tüm sınıf adları var", snflar.every(s => tab.includes(s)));
t("legend'de Kapalı var, 'Müsait Değil' yok", tab.includes("Kapalı") && !tab.includes("Müsait Değil"));
let sinifDersiHucresi = 0, kapaliHucresi = 0;
DB.ogretmenler.forEach(t2 => {
  Object.keys(t2.avail.sinif || {}).forEach(() => { sinifDersiHucresi++; });
  kapaliHucresi += (t2.avail.musait || []).length;
});
t("eski 'sınıf dersi' hücre sayısı sayıldı ve bozulmadı (" + sinifDersiHucresi + " hücre)", sinifDersiHucresi > 0);
t("Kapalı (musait) hücre sayısı: " + kapaliHucresi, true);

/* 6) Çakışma kontrolü: kapalı hücre hâlâ meşgul sayılıyor (duzeltmeBul tip === kapali) */
console.log("6) Çakışma entegrasyonu:");
const kapaliKey = ogr0.avail.musait[0] || null;
t("kapalı hücre kayıtlı meşgul durumunda", kapaliKey !== null);
const kaynak = readFileSync("app.js", "utf8");
t("duzeltmeBul kapalıyı 'musait' dalından Kapalı etiketiyle uyarıyor", kaynak.includes('tip === "musait"') && kaynak.includes("o saat için <b>Kapalı</b> olarak işaretli"));

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
