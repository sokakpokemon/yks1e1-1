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
  api = new Function(scripts + "\n  return { DB, dersOgrenciIds, normalize, planla, duzeltmeBul, ui, temizleForm };\n")();
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
  t("ilk boot'ta #grup-ozet de DOM'da (null değil)", !!reg["grup-ozet"]);
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
  t("özet boşken ipucu metni dolu", (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("Grup dersi"));
  t("5 kişilik sabit sınır kaldırıldı (sayaç id yok, 'sınır yok' ipucu var)", !reg["ek-ogrenci-sayac"] && (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("sınır yok"));
}

/* 7) Senaryolar: grup kayıt (A), isimli çakışma (B), birebir akış (C) — gerçek form DOM'u simülasyonu */
console.log("7) Senaryolar: grup kayıt, isimli çakışma, birebir akış:");
{
  /* id → öğe kayıt defteri; getElementById hep AYNI nesneyi döndürsün (form değerleri ayarlanabilir) */
  const reg = {};
  const el = (id) => { if (!reg[id]) reg[id] = { id, innerHTML: "", textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, insertAdjacentHTML(_p, h) { [...h.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }, appendChild() {}, remove() {}, click() {}, focus() {}, addEventListener() {}, scrollIntoView() {}, querySelectorAll: () => [], getContext: () => null }; return reg[id]; };
  for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
  global.document = {
    getElementById: (i) => reg[i] || null,
    addEventListener() {}, removeEventListener() {},
    createElement: () => el("anon" + Math.random()),
    body: { appendChild() {}, removeChild() {} },
    querySelectorAll() { return []; }
  };

  const api3 = new Function(scripts + "\n  return { DB, dersOgrenciIds, normalize, planla, duzeltmeBul, ui, temizleForm };")();
  const { DB: DB3, planla, duzeltmeBul, ui: ui3, temizleForm } = api3;

  /* gelecek Pazartesi 15:30 (kod 8) — avail/sinifProg'ta meşgul olmayan bir gün+kod */
  const _d = new Date(); _d.setDate(_d.getDate() - ((_d.getDay() + 6) % 7) + 7);
  const gelecekPzt = _d.getFullYear() + "-" + String(_d.getMonth() + 1).padStart(2, "0") + "-" + String(_d.getDate()).padStart(2, "0");
  const ayse = DB3.ogrenciler.find(s => s.ad === "Ayşe Demir");
  const zeynep = DB3.ogrenciler.find(s => s.ad === "Zeynep Kaya");
  const emir = DB3.ogrenciler.find(s => s.ad === "Emir Aydın");
  const formuDoldur = () => { reg["f-ogrenci"].value = "Ayşe Demir"; reg["f-ders"].value = "mat"; reg["f-konu"].value = "Limit"; reg["f-ogretmen"].value = "SONER AÇIKGÖZ"; reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = false; };

  /* Senaryo A — 2 öğrencili grup kaydı: TEK kayıt, ogrenciIds dizisi */
  DB3.dersler = [];
  formuDoldur();
  ui3.ekOgrenciIds = [zeynep.id, emir.id];
  planla();
  const grupKayit = DB3.dersler.filter(l => l.tarih === gelecekPzt && l.kod === "8");
  t("A: tam 1 kayıt oluştu (kopya değil)", grupKayit.length === 1);
  t("A: kayıtta ogrenciIds = [Zeynep, Emir]", grupKayit.length === 1 && JSON.stringify(grupKayit[0].ogrenciIds) === JSON.stringify([zeynep.id, emir.id]));
  t("A: uyumluluk: ogrenciId alanı dolu (eski okuyucular için)", grupKayit.length === 1 && typeof grupKayit[0].ogrenciId === "string" && grupKayit[0].ogrenciId.length > 0);
  t("A: dersOgrenciIds 3 kimlik verir", grupKayit.length === 1 && api3.dersOgrenciIds(grupKayit[0]).length === 3);
  t("A: kayıt sonrası grup chip listesi sıfırlandı (temizleForm)", Array.isArray(ui3.ekOgrenciIds) && ui3.ekOgrenciIds.length === 0);
  DB3.dersler = DB3.dersler.filter(l => !(l.tarih === gelecekPzt && l.kod === "8"));

  /* Senaryo B — çakışan öğrenci ADIYLA uyarılır (dersOgrenciIds ile bulunur) */
  DB3.dersler.push({ id: "test-conflict-1", ogrenciId: zeynep.id, ogrenciAd: zeynep.ad, dersId: "mat", konu: "", ogretmenId: "t-x", ogretmenAd: "BAŞKA Ö", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" });
  const uyariB = duzeltmeBul({ ogrenciId: ayse.id, ogretmenId: DB3.ogretmenler[0].id, tarih: gelecekPzt, saat: "15:30", id: "" }, false, [zeynep.id]);
  t("B: çakışan grup öğrencisi adıyla uyarıda geçiyor", uyariB.some(m => m.includes(zeynep.ad)));
  t("B: uyarı ders çakışması olarak nitelendiriliyor", uyariB.some(m => m.includes(zeynep.ad) && m.includes("ile dersi var")));
  DB3.dersler = DB3.dersler.filter(l => l.id !== "test-conflict-1");

  /* Senaryo C — 1 ek öğrenci bile kaydederse: eski birebir akış AYNEN (ogrenciIds YAZILMAZ) */
  formuDoldur();
  ui3.ekOgrenciIds = [emir.id];
  const sayiOnce = DB3.dersler.length;
  planla();
  const yeniKayit = DB3.dersler[sayiOnce];
  t("C: kayıt oluştu", DB3.dersler.length === sayiOnce + 1 && !!yeniKayit);
  t("C: eski davranış: ogrenciIds alanı YOK", yeniKayit && !("ogrenciIds" in yeniKayit));
  t("C: ogrenciId = formdaki öğrenci", yeniKayit && yeniKayit.ogrenciId === ayse.id);
  t("C: dersOgrenciIds tek kimlik verir", yeniKayit && api3.dersOgrenciIds(yeniKayit).length === 1);
  DB3.dersler = DB3.dersler.filter(l => l !== yeniKayit);

  /* 8) avail şema sapması: planla() kaydetmeden önce normalize ile aynı şekle getirir */
  console.log("8) avail şema normalizasyonu (kayıt öncesi):");
  DB3.dersler = [];
  ui3.ekOgrenciIds = [];
  const sapkin = DB3.ogretmenler.find(t2 => t2.ad === "MERT ASİL");
  sapkin.avail = { sinif: ["0-8", "1-3"], musait: ["2-4"] }; /* sinif DİZİ — normalize() sapması */
  formuDoldur();
  reg["f-ders"].value = "ing"; reg["f-ogretmen"].value = "MERT ASİL";
  planla(); /* '0-8' Sınıf Dersi çakışması → kayıt reddedilir ama avail yine de normalize edilmiş olmalı */
  t("sinif dizi → obje (Sınıf Dersi değeriyle)", sapkin.avail.sinif && typeof sapkin.avail.sinif === "object" && !Array.isArray(sapkin.avail.sinif) && sapkin.avail.sinif["0-8"] === "Sınıf Dersi" && sapkin.avail.sinif["1-3"] === "Sınıf Dersi");
  t("musait dizi korunur", Array.isArray(sapkin.avail.musait) && sapkin.avail.musait.length === 1 && sapkin.avail.musait[0] === "2-4");
  t("Sınıf Dersi uyarısı bu şekille üretiliyor", duzeltmeBul({ ogrenciId: ayse.id, ogretmenId: sapkin.id, tarih: gelecekPzt, saat: "15:30", id: "" }, false, null).some(m => m.includes("Sınıf Dersi")));
  t("normalize() artık ek değişiklik yapmıyor (şekil birebir)", (() => { const kopya = JSON.parse(JSON.stringify(sapkin.avail)); api3.normalize({ ogretmenler: [sapkin] }); return JSON.stringify(sapkin.avail) === JSON.stringify(kopya); })());
  sapkin.avail = { sinif: {}, musait: [] };
}

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
