/* ks-kapali-gorunum.mjs — Kapalı hücre görünümü + tıklanabilirlik regresyon süiti (16 test) */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => {
  const el = { options: [], children: [], getContext: () => null, style: {}, dataset: {}, classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll() { return []; }, files: null };
  Object.defineProperty(el, "checked", { value: false, writable: true });
  return el;
};
const els = {};
global.document = { getElementById: (id) => (els[id] = els[id] || elStub()), addEventListener() {}, removeEventListener() {}, createElement: () => elStub(), body: { appendChild() {}, removeChild() {} }, querySelectorAll() { return []; } };
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond) => { console.log("  " + (cond ? "✓" : "✗") + " " + name); if (!cond) fail = 1; };

const api = new Function(scripts + "\n;return { gridTablo, durumSec, togOgrSecili, togOgr, DB, ui, saveDB, yenile: () => {} };")();

/* 1) Kapalı hücre render */
const avail = { sinif: {}, musait: ["0-1"] };
const grid = api.gridTablo("togOgrSecili('X'", avail, "ogretmen");
const btnRe = /<td class="p-0\.5"><button class="([^"]*)" title="([^"]*)"[^>]*>((?:(?!<\/button>).)*)<\/button><\/td>/g;
let m, kapali = null, bos = null;
while ((m = btnRe.exec(grid))) {
  if (m[2].includes("Pzt 1 ·") && m[2].includes("Kapalı")) kapali = m;
  else if (m[2].includes("· Boş") && !bos) bos = m;
}
console.log("1) Kapalı hücre render:");
t("kapalı hücre DOM'da mevcut ve title'lı", !!kapali);
t("kapalı hücre gri/soluk stil taşıyor (bg-slate-100 + opacity)", !!kapali && /bg-slate-100/.test(kapali[1]) && /opacity-70/.test(kapali[1]));
t("kapalı hücrede kırmızı etiket YOK (bg-rose-200/rose-500 kalmadı)", !!kapali && !/rose/.test(kapali[0]));
t("kapalı hücrede disabled YOK", !!kapali && !/disabled/.test(kapali[0]));
t("kapalı hücrede readonly YOK", !!kapali && !/readonly/.test(kapali[0]));
t("kapalı hücrede pointer-events:none YOK", !!kapali && !/pointer-events/.test(kapali[0]));
t("kapalı hücre onclick togOgrSecili'ye bağlı", !!kapali && /onclick="togOgrSecili\('X',0,1\)"/.test(kapali[0]));

/* 2) Kapalı seçiliyken tıklama → avail.musait yazımı + localStorage */
console.log("2) Kapalı tıklama + kalıcılık:");
const ogr = api.DB.ogretmenler.find(x => x.avail && Array.isArray(x.avail.musait)) || api.DB.ogretmenler[0];
if (!ogr.avail) ogr.avail = { sinif: {}, musait: [] };
if (!Array.isArray(ogr.avail.musait)) ogr.avail.musait = [];
if (!ogr.avail.sinif || typeof ogr.avail.sinif !== "object") ogr.avail.sinif = {};
const testKey = "5-9";
api.ui.seciliDurum = "kapali";
const lsBefore = store.yksOto_arsiv_v1 || "";
api.togOgrSecili(ogr.id, 5, 9);
t("kapalı seçiliyken tıklama avail.musait'e yazdı", ogr.avail.musait.indexOf(testKey) >= 0);
t("saveDB çağrıldı (localStorage değişti)", store.yksOto_arsiv_v1 !== lsBefore);
t("localStorage'daki kayıt 5-9 anahtarını taşıyor", (store.yksOto_arsiv_v1 || "").includes('"5-9"') || (store.yksOto_arsiv_v1 || "").includes("\\\"5-9\\\""));
/* ikinci tıklama → boşalt (döngü davranışı korunur) */
api.togOgrSecili(ogr.id, 5, 9);
t("ikinci tıklama kapalıyı boşalttı (döngü korunur)", ogr.avail.musait.indexOf(testKey) < 0);

/* 3) Boş ve sınıf durumları korunuyor */
console.log("3) Boş/sınıf durumları:");
api.ui.seciliDurum = null;
global.prompt = () => null; /* seçisiz tıklama: eski prompt akışı — ks-durum-fn kapsamında; burada avail bozulmadığı denetlenir */
api.togOgr(ogr.id, 2, 3);
t("togOgr çağrısı sonrası avail.musait dizi kaldı", Array.isArray(ogr.avail.musait));
delete global.prompt;
api.ui.seciliDurum = "sinif"; api.ui.seciliOgrId = "TEST SNF";
api.togOgrSecili(ogr.id, 6, 11);
t("sınıf seçiliyken tıklama sinif kaydını yazdı", ogr.avail.sinif["6-11"] === "TEST SNF");
/* boş hücre görünümü */
t("boş hücre görünümü değişmedi (beyaz, boş içerik)", !!bos && /bg-white border-slate-200/.test(bos[1]) && bos[3].trim() === "");
api.ui.seciliDurum = null;

/* 4) Haftalık program/ders kayıtları dokunulmaz */
console.log("4) Sınır bölgeleri:");
const src = readFileSync("app.js", "utf8");
t("haftalikOgrtTablo kaynakta mevcut ve gridTablo dışında", src.includes("function haftalikOgrtTablo"));
t("yama işareti yalnız gridTablo/legend bölgesinde (app.js tek MARK kümesi)", (src.match(/KAPALI-GORUNUM-YAMASI/g) || []).length === 4);
t("saveDB fonksiyonu değişmedi (imza satırı mevcut)", /function saveDB\(\)/.test(src));
t("togOgrSecili davranış gövdesi korunuyor (isSame + musait push dalı)", src.includes("if (t.avail.musait.indexOf(k) < 0) t.avail.musait.push(k);"));
t("durumSeciciHTML Kapalı butonu hâlâ rose vurgulu (seçici çubuk değişmedi)", src.includes('btn("kapali", null, "Kapalı", "bg-rose-300 border-rose-400 text-rose-900 hover:bg-rose-400")'));

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
