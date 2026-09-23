/* ks-ogrt-denetim.mjs — DÖNGÜ-12 DENETİM SÜİTİ (DÖNGÜ-11 denetim açıklarının kapatılması)
   Beş denetim maddesi, HEPSİ gerçek DB girdisiyle (sabit true/false fixture YASAK):
    A) ROZET SÖZLEŞMESİ: yalnız gerçekten görünen satırların durumu; TAM üç metin
       ("Planlandı" | "Yapıldı" | "Kısmen tamamlandı"); "Planlandı (n)" sayı eki YASAK.
    B) BUTON YERLEŞİMİ/TEKLİĞİ: yalnız seçili günün öğretmen ADI hücresinde tam 1;
       satır yoksa 0; birebir hücresinde 0; haftalık/ek ders/sınıf programında 0;
       draggable=false + stopPropagation + tıklama korumaları korunur.
    C) GÜN İZOLASYONU: iki günlük gerçek DB fixture — seçili günün satırları GÖRÜNÜR,
       diğer günün sınıf/öğrenci/konu işaretleri SIZMAZ; mola/boş slot yok; haftalık aralık yok.
    D) YAZIMSIZLIK: kart HTML üretimi + gerçek PNG/paylaşım akışı (stub'lu html2canvas/
       navigator) → saveDB yok, localStorage.setItem/removeItem/clear yok, DB byte aynı.
    E) MATEMATİK KAPSAM + SAAT BAŞLIĞI: branş yalnız BAŞLIKTA meşru; kart segmentinde
       YASAK; saat başlıkları tam "n · hh:dd" biçimiyle KART TABLOSU bağlamında doğrulanır.
   MUTASYON KAPISI: her maddenin hedef assertion'ı gerçek app.js çıktısı bozulunca
   KIRMIZIYA düşer (mutasyon-dongu12.mjs kanıt zinciri; sabit true yok). */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const ekDersKaynak = readFileSync("ek-ders.js", "utf8");
const testKaynak = readFileSync("test.mjs", "utf8");
const scripts = [appKaynak,
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

/* ---- harness: localStorage yazım sayaçları + PNG akış stub'ları ---- */
const store = {};
let setItemSayi = 0, removeItemSayi = 0, clearSayi = 0;
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
const reg = new Map();
function yapEl(id) {
  const e = {
    id: id || "", tagName: "DIV", _textContent: "", _innerHTML: "",
    style: {}, dataset: {}, checked: false, value: "", options: [], files: null, _download: false, download: "",
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle() {}, contains(c) { return this._s.has(c); } },
    insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; },
    appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
    querySelectorAll: () => [], getContext: () => null
  };
  let _html = "";
  Object.defineProperty(e, "innerHTML", {
    get() { return _html; },
    set(v) { _html = String(v); [..._html.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg.has(m[1])) reg.set(m[1], yapEl(m[1])); }); }
  });
  reg.set(id, e);
  return e;
}
for (const m of html.matchAll(/id="([^"]+)"/g)) yapEl(m[1]);
let h2cCagrildi = 0, panoCagrildi = 0, paylasCagrildi = 0, indirmeSayisi = 0, sonIndirmeAdi = "";
global.document = {
  getElementById: (i) => reg.get(i) || null,
  addEventListener() {}, removeEventListener() {},
  createElement: (tag) => { const e = yapEl("anon" + Math.random()); if (tag === "a") e._download = true; return e; },
  body: { appendChild(n) { if (n && n._download) { indirmeSayisi++; sonIndirmeAdi = n.download || ""; } }, removeChild() {} },
  querySelectorAll() { return []; }
};
global.localStorage = {
  getItem: k => store[k] ?? null,
  setItem: (k, v) => { setItemSayi++; store[k] = v; },
  removeItem: k => { removeItemSayi++; delete store[k]; },
  clear: () => { clearSayi++; for (const k of Object.keys(store)) delete store[k]; }
};
global.window.html2canvas = (el, o) => { h2cCagrildi++; return Promise.resolve({ toBlob: (cb) => cb(new Blob(["PNG"], { type: "image/png" })), toDataURL: () => "data:image/png;base64,x" }); };
global.html2canvas = global.window.html2canvas;
global.Blob = class { constructor(parts, o) { this.parts = parts; this.type = (o && o.type) || ""; } };
global.File = class extends global.Blob { constructor(parts, ad, o) { super(parts, o); this.name = ad; } };
global.URL = { createObjectURL: () => "blob:x", revokeObjectURL() {} };
global.ClipboardItem = class { constructor(m) { this.m = m; } };
global.window.ClipboardItem = global.ClipboardItem;
if (!globalThis.navigator) globalThis.navigator = {};
Object.defineProperty(globalThis.navigator, "clipboard", { value: { write: () => { panoCagrildi++; return Promise.resolve(); }, writeText: () => Promise.resolve() }, configurable: true });
Object.defineProperty(globalThis.navigator, "canShare", { value: (x) => !!(x && x.files), configurable: true });
Object.defineProperty(globalThis.navigator, "share", { value: () => { paylasCagrildi++; return Promise.resolve(); }, configurable: true });
Object.defineProperty(globalThis.window, "isSecureContext", { value: true, configurable: true });
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
let __kosan = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };
const __BEKLENEN = 42;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== __BEKLENEN) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ogrt-denetim.mjs kosan=" + __kosan + " beklenen=" + __BEKLENEN); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ogrt-denetim.mjs:" + __kosan + ":" + __BEKLENEN); } });

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, gunlukTablo, haftalikOgrtTablo, ogrtGunlukSatirlar, ogrtGunlukSlotlari, dersKartiOgrtGunlukHTML, dersKartiOgrtGunlukBtnHTML, dersKartiOgrtGunlukAc, ogretmenTab, ogrenciTab, waAliciBilgisi,
      kartIndirildiSifirla: function () { dersKartiIndirildi = false; } };
  `)();
  t("denetim: boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  process.exit(1);
}
const { DB, ui, gunlukTablo, haftalikOgrtTablo, ogrtGunlukSatirlar, ogrtGunlukSlotlari, dersKartiOgrtGunlukHTML, dersKartiOgrtGunlukBtnHTML, dersKartiOgrtGunlukAc, ogretmenTab, ogrenciTab, waAliciBilgisi, kartIndirildiSifirla } = P;

/* ---- gerçek DB fixture altyapısı ---- */
const gelecekGun = (hedefDow) => { const d = new Date(); do { d.setDate(d.getDate() + 1); } while (d.getDay() !== hedefDow); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const gunA = gelecekGun(2); /* Salı */
const gunB = gelecekGun(3); /* Çarşamba */
const dowIdxYerel = (k) => (new Date(k + "T12:00:00").getDay() + 6) % 7;
const gunNoA = dowIdxYerel(gunA), gunNoB = dowIdxYerel(gunB);
const SINIF_SAATLERI = { "1": "08:50", "2": "09:40", "3": "10:30", "4": "11:20", "5": "13:00", "6": "13:50", "7": "14:40", "8": "15:30", "9": "16:20", "10": "17:10", "11": "18:00" };
const ogrt = DB.ogretmenler.find(o => o.ad === "SONER AÇIKGÖZ") || DB.ogretmenler[0];
const ogr = DB.ogrenciler.find(o => o.ad === "Ayşe Demir") || DB.ogrenciler[0];
const ogr2 = DB.ogrenciler.find(o => o.id !== ogr.id && o.ad) || DB.ogrenciler[1];
ogrt.avail = ogrt.avail || { sinif: {}, musait: [] };
ogrt.avail.sinif = ogrt.avail.sinif || {};
ogrt.avail.musait = Array.isArray(ogrt.avail.musait) ? ogrt.avail.musait : [];
/* SLOT = 1: gerçek DB'de bu öğretmenin hafta içi sınıf dersleri slot 1'de (dump: {"0-1".."3-1"});
   fixture bu gerçek slot üzerine yazılır ve SONDA orijinal avail.sinif objesi byte-birebir restore edilir */
const SLOT = "1";
const __sinifYedek = Object.assign({}, ogrt.avail.sinif);
const sinifSifirla = () => { for (const k of Object.keys(ogrt.avail.sinif)) delete ogrt.avail.sinif[k]; };
const sinifGeri = () => { sinifSifirla(); Object.assign(ogrt.avail.sinif, __sinifYedek); };
const temizleA = () => { DB.dersler = DB.dersler.filter(l => l.tarih !== gunA); };
const temizleB = () => { DB.dersler = DB.dersler.filter(l => l.tarih !== gunB); };
const ekleBirebir = (tarih, saat, over) => DB.dersler.push(Object.assign({ id: "ks-den-" + Math.random().toString(36).slice(2, 8), donemId: DB.aktifDonemId, ogrenciId: ogr.id, ogrenciAd: ogr.ad, dersId: "mat", konu: "Limit ve Süreklilik", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih, saat, durum: "planlandi", olusturma: "2026-09-01" }, over));
const gunAdiOf = (gunNo) => ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"][gunNo];
const fmtTRYerel = (k) => { const p = k.split("-"); return p[2] + "." + p[1] + "." + p[0]; };
const rozetOf = (h) => { const m = h.match(/border-radius:99px">([^<]+)</); return m ? m[1] : null; };
/* Öğretmenin ADI hücresi segmenti: ad hücresi işaretinden sonraki öğretmen satırına kadar */
const adHucreSeg = (g, ad) => {
  const bas = g.indexOf('uppercase leading-tight">' + ad + "</div>");
  if (bas < 0) return "";
  const sonraki = g.indexOf('uppercase leading-tight">', bas + 10);
  return g.slice(bas, sonraki < 0 ? g.length : sonraki);
};

/* ==================== A) ROZET SÖZLEŞMESİ ==================== */
console.log("A) Rozet sözleşmesi (yalnız görünen satırlar; TAM üç metin):");
const rozetSenaryo = (kur) => {
  temizleA(); temizleB();
  sinifSifirla();
  kur();
  const h = dersKartiOgrtGunlukHTML(ogrt.id, gunA);
  const r = rozetOf(h);
  temizleA(); temizleB();
  sinifGeri();
  return r;
};
const s1 = rozetSenaryo(() => { ogrt.avail.sinif[gunNoA + "-" + SLOT] = "ROZET-9A"; });
t("A1 yalnız sınıf dersi → 'Planlandı'", s1 === "Planlandı", String(s1));
const s2 = rozetSenaryo(() => { ekleBirebir(gunA, SINIF_SAATLERI["5"], {}); });
t("A2 yalnız planlı birebir → 'Planlandı'", s2 === "Planlandı", String(s2));
const s3 = rozetSenaryo(() => { ekleBirebir(gunA, SINIF_SAATLERI["5"], { durum: "tamamlandi" }); });
t("A3 yalnız tamamlanmış birebir → 'Yapıldı'", s3 === "Yapıldı", String(s3));
const s4 = rozetSenaryo(() => { ogrt.avail.sinif[gunNoA + "-" + SLOT] = "ROZET-9A"; ekleBirebir(gunA, SINIF_SAATLERI["5"], { durum: "tamamlandi" }); });
t("A4 sınıf dersi + tamamlanmış birebir → 'Kısmen tamamlandı' (sınıf dersi planlı sayılır)", s4 === "Kısmen tamamlandı", String(s4));
const s5 = rozetSenaryo(() => { ekleBirebir(gunA, SINIF_SAATLERI["5"], {}); ekleBirebir(gunA, SINIF_SAATLERI["6"], { durum: "tamamlandi" }); });
t("A5 planlı + tamamlanmış birebir → 'Kısmen tamamlandı'", s5 === "Kısmen tamamlandı", String(s5));
t("A6 rozet TAM üç metinden biri; 'Planlandı (n)' / 'Yapıldı (n)' sayı eki YASAK", [s1, s2, s3, s4, s5].every(x => ["Planlandı", "Yapıldı", "Kısmen tamamlandı"].includes(x)) && [s1, s2, s3, s4, s5].every(x => !/\(\d+\)/.test(x)), JSON.stringify([s1, s2, s3, s4, s5]));

/* ==================== B) BUTON YERLEŞİMİ VE TEKLİĞİ ==================== */
console.log("B) Buton yerleşimi ve tekliği (gerçek gunlukTablo DOM üretimi):");
const gunlukHTMLile = (kur) => { temizleA(); temizleB(); sinifSifirla(); kur(); ui.gunSecim = gunA; const g = gunlukTablo(); temizleA(); temizleB(); sinifGeri(); return g; };
const seg1 = adHucreSeg(gunlukHTMLile(() => { ekleBirebir(gunA, SINIF_SAATLERI["5"], {}); }), ogrt.ad);
t("B1 tek ders → öğretmen ADI hücresinde TAM 1 buton", (seg1.match(/dersKartiOgrtGunlukAc\(/g) || []).length === 1, String((seg1.match(/dersKartiOgrtGunlukAc\(/g) || []).length));
const seg2 = adHucreSeg(gunlukHTMLile(() => { ekleBirebir(gunA, SINIF_SAATLERI["5"], {}); ekleBirebir(gunA, SINIF_SAATLERI["6"], {}); }), ogrt.ad);
t("B2 aynı gün birden fazla ders → buton ÇOĞALMAZ, tam 1", (seg2.match(/dersKartiOgrtGunlukAc\(/g) || []).length === 1, String((seg2.match(/dersKartiOgrtGunlukAc\(/g) || []).length));
const seg3 = adHucreSeg(gunlukHTMLile(() => { ogrt.avail.sinif[gunNoA + "-" + SLOT] = "BTN-9A"; ekleBirebir(gunA, SINIF_SAATLERI["5"], {}); }), ogrt.ad);
t("B3 sınıf dersi + birebir → tam 1 buton", (seg3.match(/dersKartiOgrtGunlukAc\(/g) || []).length === 1, String((seg3.match(/dersKartiOgrtGunlukAc\(/g) || []).length));
const seg0 = adHucreSeg(gunlukHTMLile(() => {}), ogrt.ad);
t("B4 seçili günde hiç satır yok → 0 buton", (seg0.match(/dersKartiOgrtGunlukAc\(/g) || []).length === 0, String((seg0.match(/dersKartiOgrtGunlukAc\(/g) || []).length));
t("B5 buton kalıbı korunur: draggable=false + onmousedown stopPropagation + onclick preventDefault", (() => { const btn = dersKartiOgrtGunlukBtnHTML(ogrt.id, gunA); return btn.includes('draggable="false"') && btn.includes('onmousedown="event.stopPropagation()"') && btn.includes("event.stopPropagation();event.preventDefault();"); })());
t("B6 tıklama öğretmen düzenlemeyi/sürüklemeyi tetiklemez (ogrDuzenle/draggable=true yok)", !dersKartiOgrtGunlukBtnHTML(ogrt.id, gunA).includes("ogrDuzenle"));
t("B7 buton birebir hücresinde üretilmez (ad hücresi dışında dersKartiOgrtGunlukAc yok)", (() => { const g = gunlukHTMLile(() => { ogrt.avail.sinif[gunNoA + "-" + SLOT] = "BTN-9A"; ekleBirebir(gunA, SINIF_SAATLERI["5"], {}); }); const seg = adHucreSeg(g, ogrt.ad); const dis = g.replace(seg, ""); return (dis.match(/dersKartiOgrtGunlukAc\(/g) || []).length === 0; })());
t("B7b buton adı hücresi SEGMENTİNDE yer alıyor (birebir hücresinde değil)", (() => { const g = gunlukHTMLile(() => { ekleBirebir(gunA, SINIF_SAATLERI["5"], {}); }); const seg = adHucreSeg(g, ogrt.ad); return seg.includes("dersKartiOgrtGunlukAc"); })());
t("B8 haftalık öğretmen çizelgesinde (ogretmenTab) buton YOK", !ogretmenTab().includes("dersKartiOgrtGunlukAc"));
t("B9 sınıf programı/öğrenci sekmesinde (ogrenciTab) buton YOK", !ogrenciTab().includes("dersKartiOgrtGunlukAc"));
t("B10 Ek Ders sekmesi (ek-ders.js) buton İÇERMEZ", !ekDersKaynak.includes("dersKartiOgrtGunlukAc"));

/* ==================== C) GÜN İZOLASYONU ==================== */
console.log("C) Gün izolasyonu (iki günlük gerçek DB fixture):");
temizleA(); temizleB();
sinifSifirla();
ogrt.avail.sinif[gunNoA + "-" + SLOT] = "IZO-9A";
ogrt.avail.sinif[gunNoB + "-" + SLOT] = "IZO-9B";
ekleBirebir(gunA, SINIF_SAATLERI["5"], { id: "ks-den-izo-a", konu: "IZO-KONU-A" });
ekleBirebir(gunB, SINIF_SAATLERI["6"], { id: "ks-den-izo-b", ogrenciId: ogr2.id, ogrenciAd: ogr2.ad, konu: "IZO-KONU-B" });
const hIzoA = dersKartiOgrtGunlukHTML(ogrt.id, gunA);
const satirA = ogrtGunlukSatirlar(ogrt.id, gunA);
t("C1 seçili günün tüm satırları görünür (sınıf + birebir)", hIzoA.includes("IZO-9A") && hIzoA.includes(ogr.ad) && hIzoA.includes("IZO-KONU-A"));
t("C2 seçili gün başlığı: öğretmen adı + gün adı + gg.aa.yyyy", hIzoA.includes("ÖĞRETMEN — " + ogrt.ad.toUpperCase()) && hIzoA.includes(gunAdiOf(gunNoA)) && hIzoA.includes(fmtTRYerel(gunA)));
t("C3 diğer günün sınıf adı SIZMAZ", !hIzoA.includes("IZO-9B"));
t("C4 diğer günün öğrenci adı SIZMAZ", !hIzoA.includes(ogr2.ad));
t("C5 diğer günün konusu SIZMAZ", !hIzoA.includes("IZO-KONU-B"));
t("C6 diğer günün gün adı SIZMAZ", !hIzoA.includes(gunAdiOf(gunNoB)));
t("C7 diğer günün tarihi SIZMAZ", !hIzoA.includes(fmtTRYerel(gunB)));
t("C8 mola/ÖĞLE kolonu ve boş slot uydurulmaz ('12:10'/'Mola' yok)", !hIzoA.includes("12:10") && !hIzoA.includes(">Mola<"));
t("C9 haftalık tarih aralığı YOK (tek gün; ' – ' aralık ayracı yok)", !hIzoA.includes(" – "));
t("C10 aynı günün sınıf + birebir kayıtları KORUNUR (iki kart da basılı)", hIzoA.includes('title="Sınıf dersi') && hIzoA.includes('title="Birebir"') && satirA.length === 2);
/* temizlik */
temizleA(); temizleB();
sinifGeri();

/* ==================== D) YAZIMSIZLIK / SALT GÖRÜNTÜ ==================== */
console.log("D) Yazımsızlık (HTML üretimi + gerçek PNG/paylaşım akışı, stub'lu):");
const acKaynak = appKaynak.slice(appKaynak.indexOf("function dersKartiOgrtGunlukAc("), appKaynak.indexOf("/* ---- PNG raporu ---- */"));
t("D1 statik: dersKartiOgrtGunlukAc akışında saveDB çağrısı YOK", !/saveDB\s*\(/.test(acKaynak));
t("D2 statik: dersKartiOgrtGunlukAc akışında localStorage.setItem YOK", !acKaynak.includes("localStorage.setItem"));
temizleA(); temizleB();
delete ogrt.avail.sinif[gunNoA + "-" + SLOT];
ogrt.avail.sinif[gunNoA + "-" + SLOT] = "YAZ-9A";
ekleBirebir(gunA, SINIF_SAATLERI["5"], { id: "ks-den-yaz", konu: "YAZ-KONU" });
const dbOnce = JSON.stringify(DB);
const storeOnce = JSON.stringify(store);
setItemSayi = 0; removeItemSayi = 0; clearSayi = 0; h2cCagrildi = 0; panoCagrildi = 0; paylasCagrildi = 0; indirmeSayisi = 0; sonIndirmeAdi = "";
kartIndirildiSifirla();
ui.gunSecim = gunA;
gunlukTablo(); /* buton çizimi */
dersKartiOgrtGunlukAc(ogrt.id, gunA); /* gerçek kart akışı: html2canvas stub → pano → her durumda indir */
await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
t("D3 dinamik: localStorage.setItem = 0", setItemSayi === 0, String(setItemSayi));
t("D4 dinamik: removeItem/clear = 0 (yazma/silme/temizleme yok)", removeItemSayi === 0 && clearSayi === 0);
t("D5 dinamik: DB değişikliği YOK (byte karşılaştırma)", JSON.stringify(DB) === dbOnce);
t("D6 dinamik: localStorage içerik değişikliği YOK", JSON.stringify(store) === storeOnce);
t("D7 akış GERÇEK kart yoluna girdi: html2canvas çağrıldı + PNG indirildi", h2cCagrildi === 1 && indirmeSayisi === 1 && sonIndirmeAdi.startsWith("ders-karti-ogretmen-") && sonIndirmeAdi.endsWith(".png"), sonIndirmeAdi);
t("D8 dosya adında TELEFON YOK", !/\d{10,}/.test(sonIndirmeAdi), sonIndirmeAdi);
temizleA(); temizleB();
sinifGeri();

/* ==================== E) MATEMATİK KAPSAM + SAAT BAŞLIĞI ==================== */
console.log("E) MATEMATİK kapsam + saat başlığı (kart segmenti bağlamı):");
temizleA(); temizleB();
delete ogrt.avail.sinif[gunNoA + "-" + SLOT];
ogrt.avail.sinif[gunNoA + "-" + SLOT] = "MAT-9A";
ekleBirebir(gunA, SINIF_SAATLERI["5"], { id: "ks-den-mat", konu: "MAT-KONU" });
const hMat = dersKartiOgrtGunlukHTML(ogrt.id, gunA);
t("E1 MATEMATİK başlıkta branş olarak BULUNABİLİR (geçerli)", hMat.includes("MATEMATİK"));
const sinifSeg = hMat.slice(hMat.indexOf('title="Sınıf dersi'), hMat.indexOf("</td>", hMat.indexOf('title="Sınıf dersi')));
t("E2 kart segmentinde (sınıf kartı) MATEMATİK BULUNAMAZ — yalnız sınıf adı", sinifSeg.includes("MAT-9A") && !sinifSeg.includes("MATEMATİK"));
const birebirSeg = hMat.slice(hMat.indexOf('title="Birebir"'), hMat.indexOf("</td>", hMat.indexOf('title="Birebir"')));
t("E3 kart segmentinde (birebir kartı) MATEMATİK BULUNAMAZ", birebirSeg.includes(ogr.ad) && !birebirSeg.includes("MATEMATİK"));
/* saat başlıkları: kart tablosu başlık satırı bağlamında TAM biçim */
const tabloBas = hMat.indexOf('<tr style="background:#f8fafc">');
const tabloSon = hMat.indexOf("</tr>", tabloBas);
const baslikSatiri = hMat.slice(tabloBas, tabloSon);
const beklenenBasliklar = Object.entries(SINIF_SAATLERI).map(([no, b]) => no + " · " + b);
t("E4 saat başlıkları kart tablosunda TAM biçimde: '1 · 08:50' … '11 · 18:00' (11 kolon)", beklenenBasliklar.every(b => baslikSatiri.includes(b)) && (baslikSatiri.match(/ · \d{2}:\d{2}</g) || []).length === 11, JSON.stringify(beklenenBasliklar.filter(b => !baslikSatiri.includes(b))));
t("E5 saat başlığı ÖĞLE kolonu ÇİZİLMEZ (12:10 başlıkta yok)", !baslikSatiri.includes("12:10"));
temizleA(); temizleB();
sinifGeri();
t("denetim süiti test.mjs'te tam 1 kez kayıtlı", (testKaynak.match(/ks-ogrt-denetim\.mjs/g) || []).length === 1);

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
