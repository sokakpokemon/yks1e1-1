/* ks-grup-uyum.mjs — grup dersi veri uyumluluk katmanı testleri (dersOgrenciIds) */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {} }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
global.document = {
  getElementById: () => elStub(),
  addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => []
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) fail = 1; };

let api;
try {
  api = new Function(scripts + "\n  return { DB, dersOgrenciIds, normalize };\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { dersOgrenciIds, DB } = api;

/* 1) Yeni biçim: ogrenciIds dizisi */
console.log("1) Yeni biçim (ogrenciIds dizisi):");
t("dizi döndürür, sıra korunur", JSON.stringify(dersOgrenciIds({ ogrenciIds: ["o1", "o2", "o3"] })) === JSON.stringify(["o1", "o2", "o3"]));
t("tekrar kimlikler benzersizleştirilir", JSON.stringify(dersOgrenciIds({ ogrenciIds: ["o1", "o1", "o2", "o1"] })) === JSON.stringify(["o1", "o2"]));
t("dizideki null/undefined atılır", JSON.stringify(dersOgrenciIds({ ogrenciIds: ["o1", null, "o2", undefined] })) === JSON.stringify(["o1", "o2"]));

/* 2) Eski biçim: ogrenciId (mevcut kayıtlar) */
console.log("2) Eski biçim (ogrenciId — mevcut kayıtlar):");
t("tek kimlik → [ogrenciId]", JSON.stringify(dersOgrenciIds({ ogrenciId: "o9" })) === JSON.stringify(["o9"]));
t("ogrenciIds yoksa eski alan kullanılır", JSON.stringify(dersOgrenciIds({ ogrenciId: "o5", ogrenciAd: "Ali" })) === JSON.stringify(["o5"]));

/* 3) Hatalı kayıtlar → boş dizi */
console.log("3) Hatalı kayıtlar:");
t("null ders → []", JSON.stringify(dersOgrenciIds(null)) === "[]");
t("undefined ders → []", dersOgrenciIds(undefined).length === 0);
t("nesne değil (string) → []", JSON.stringify(dersOgrenciIds("d1")) === "[]");
t("kimlik yok → []", JSON.stringify(dersOgrenciIds({ ogrenciAd: "Ali" })) === "[]");
t("boş ogrenciId → []", JSON.stringify(dersOgrenciIds({ ogrenciId: "" })) === "[]");
t("ogrenciIds dizi değil → []", JSON.stringify(dersOgrenciIds({ ogrenciIds: "o1" })) === "[]");
t("ogrenciIds null → eski ogrenciId kullanılır", JSON.stringify(dersOgrenciIds({ ogrenciId: "o7", ogrenciIds: null })) === JSON.stringify(["o7"]));

/* 4) Veri dokunulmazlığı: girdi nesnesi değişmemeli */
console.log("4) Veri dokunulmazlığı:");
const kopya = JSON.stringify({ ogrenciId: "ox", ogrenciIds: ["a", "a"] });
const girdi = { ogrenciId: "ox", ogrenciIds: ["a", "a"] };
dersOgrenciIds(girdi);
t("yardımcı girdi nesnesini değiştirmez", JSON.stringify(girdi) === kopya);

/* 5) Mevcut seed verisi: ogrenciId alanı yerinde, dersOgrenciIds eşleşir */
console.log("5) Mevcut DB ile uyum:");
const seedDersleri = DB.dersler;
t("seed derslerinde ogrenciId hâlâ dolu (alan bozulmadı)", seedDersleri.length > 0 && seedDersleri.every(d => typeof d.ogrenciId === "string" && d.ogrenciId.length > 0));
t("seed derslerinde ogrenciIds eklenmedi", seedDersleri.every(d => !("ogrenciIds" in d)));
t("her seed dersinde yardımcı = [ogrenciId]", seedDersleri.every(d => JSON.stringify(dersOgrenciIds(d)) === JSON.stringify([d.ogrenciId])));
t("dönen değerler dizi (tüm kayıtlar)", seedDersleri.every(d => Array.isArray(dersOgrenciIds(d))));

/* 6) Boot sıra düzeltmesi: gerçek tarayıcı DOM'u — bilinmeyen id → NULL döner,
   insertAdjacentHTML markup'taki id'leri gerçekten DOM'a kaydeder (test kör noktasını kapatır) */
console.log("6) Gerçek tarayıcı DOM simülasyonu (bilinmeyen id → null):");
{
  const reg = {};
  let insertSay = 0;
  const gercekEl = (id) => ({ id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {},
    get options() { const m = this.innerHTML.match(/<option/g); return { length: m ? m.length : 0 }; },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    insertAdjacentHTML(_p, h) { insertSay++; [...h.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = gercekEl(m[1]); }); },
    appendChild() {}, remove() {}, click() {}, focus() {}, addEventListener() {}, scrollIntoView() {},
    querySelectorAll() { return []; }, getContext() { return null; } });
  for (const m of html.matchAll(/id="([^"]+)"/g)) if (!reg[m[1]]) reg[m[1]] = gercekEl(m[1]);
  global.document = {
    getElementById: (i) => reg[i] || null,
    addEventListener() {}, removeEventListener() {},
    createElement: () => gercekEl("anon"),
    body: { appendChild() {}, removeChild() {} },
    querySelectorAll() { return []; }
  };
  let boot2Err = null;
  try { new Function(scripts + "\n  yenile();")(); } catch (e) { boot2Err = e; }
  t("ilk boot (renderFormDestek dahil) çökmeden tamamlanır", !boot2Err);
  if (boot2Err) console.log(boot2Err.stack.split("\n").slice(0, 5).join("\n"));
  t("ilk boot'ta #ek-ogrenciler paneli DOM'a eklendi", !!reg["ek-ogrenciler"]);
  t("ilk boot'ta #ek-ogrenci-chips de DOM'da (null değil)", !!reg["ek-ogrenci-chips"]);
  let api2Err = null, render2Err = null;
  let renderFormDestek2 = null;
  try {
    const api2 = new Function(scripts + "\n  yenile();\n  return { renderFormDestek };")();
    renderFormDestek2 = api2.renderFormDestek;
  } catch (e) { api2Err = e; }
  t("ikinci boot da çökmeden tamamlanır", !api2Err && typeof renderFormDestek2 === "function");
  try { if (renderFormDestek2) renderFormDestek2(); } catch (e) { render2Err = e; }
  t("2. renderFormDestek çağrısı çökmez", !render2Err);
  if (render2Err) console.log(render2Err.stack.split("\n").slice(0, 5).join("\n"));
  t("panel idempotent: insertAdjacentHTML yalnızca 1 kez çağrıldı", insertSay === 1);
  t("chip alanı boşken ipucu metni dolu", (reg["ek-ogrenci-chips"] || { innerHTML: "" }).innerHTML.includes("Grup dersi"));
  t("sayaç 0 / 5 gösterir", (reg["ek-ogrenci-sayac"] || { textContent: "" }).textContent === "0 / 5");
}

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
