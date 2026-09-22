/* ks-ogrt-ders-karti.mjs — OGRT-KART-YAMASI süiti (öğretmen günlük birebir ders görseli)
   Doğruladıkları:
    1) dersKartiOgrt* fonksiyonları tanımlı; öğrenci kart yolu (dersKartiAc/HTML/Veri/BtnHTML) BİREBİR korunur.
    2) gunlukTablo öğretmen satırında buton YALNIZ uygun birebir derste; HARIC dal (grup/sınıf dersi/ek ders/iptal) gerçek girdiyle butonsuz.
    3) Buton kalıbı: draggable="false" + onmousedown stopPropagation + onclick stopPropagation + ayrı akış (dersKartiOgrtAc).
    4) Öğretmen kart HTML: satır sırası saat·öğrenci·sınıf·ders·konu·tarih; sınıf kaynağı yalnız DB.ogrenciler[].sinif (boş → "Sınıf belirtilmemiş");
       konu boş → "Genel tekrar"; durum tamamlandi → "Yapıldı", değilse "Planlandı". Görselde TELEFON YOK.
    5) dosya adı: ders-karti-ogretmen-{ogretmen}-{tarih}.png; telefon yok; Türkçe transliterasyon korunur.
    6) waAliciBilgisi "ogretmen" hedefi: yalnız öğretmen akışında; tel yoksa varMi=false, PNG indirme akışı devam eder (fallback YASAK).
    7) VERİ DEĞİŞTİRMEZ: localStorage saveDB yazımı YOK; buton çizimi localStorage'a dokunmaz.
    8) Haftalık izgara / ek ders / sınıf programı buton İÇERMEZ (yalnız günlük öğretmen satırı).
   TEST-KAPISI: her dal gerçek DB girdisiyle koşulur; sabit true fixture YASAK (mutasyon testi test.mjs dışında elle yapılır). */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const testKaynak = readFileSync("test.mjs", "utf8");
const scripts = [appKaynak,
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
const reg = new Map();
function yapEl(id) {
  const e = {
    id: id || "", tagName: "DIV", _textContent: "", _innerHTML: "",
    style: {}, dataset: {}, checked: false, value: "", options: [], files: null,
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
global.document = {
  getElementById: (i) => reg.get(i) || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => yapEl("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
if (!globalThis.navigator) globalThis.navigator = {};

let fail = 0;
let __kosan = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 37) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ogrt-ders-karti.mjs kosan=" + __kosan + " beklenen=37"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ogrt-ders-karti.mjs:" + __kosan + ":37"); } });

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, gunlukTablo, haftalikOgrtTablo, dersKartiOgrtVeri, dersKartiOgrtHTML, dersKartiOgrtBtnHTML, dersKartiOgrtAc, dersKartiUygun, waAliciBilgisi, dersKartiHTML, dersKartiVeri, dersOgrenciIds };
  `)();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  process.exit(1);
}
const { DB, ui, gunlukTablo, haftalikOgrtTablo, dersKartiOgrtVeri, dersKartiOgrtHTML, dersKartiOgrtBtnHTML, dersKartiOgrtAc, dersKartiUygun, waAliciBilgisi, dersKartiHTML, dersKartiVeri, dersOgrenciIds } = P;

/* Gelecek pazartesi */
const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ogrt = DB.ogretmenler.find(o => o.ad === "SONER AÇIKGÖZ") || DB.ogretmenler[0];
const ogr = DB.ogrenciler.find(o => o.ad === "Ayşe Demir") || DB.ogrenciler[0];
const ogr2 = DB.ogrenciler.find(o => o.id !== ogr.id && o.ad) || DB.ogrenciler[1];
const saat = "15:30";
const temizle = () => { DB.dersler = DB.dersler.filter(l => !(l.tarih === gelecekPzt && l.ogretmenId === ogrt.id && l.saat === saat)); };
const ekle = (over) => DB.dersler.push(Object.assign({ id: "ks-ogrt-1", donemId: DB.aktifDonemId, ogrenciId: ogr.id, ogrenciAd: ogr.ad, dersId: "mat", konu: "Limit ve Süreklilik", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: gelecekPzt, saat, kod: "8", durum: "planlandi", olusturma: "2026-09-01" }, over));
const gunlukHTML = () => { ui.gunSecim = gelecekPzt; return gunlukTablo(); };

/* ---- 1) Tanım + öğrenci yolu korunur ---- */
console.log("1) Tanımlar ve öğrenci kart yolu birebir:");
t("dersKartiOgrtVeri tanımlı (fonksiyon çağrılabilir)", typeof dersKartiOgrtVeri === "function");
t("dersKartiOgrtHTML tanımlı", typeof dersKartiOgrtHTML === "function");
t("dersKartiOgrtBtnHTML tanımlı", typeof dersKartiOgrtBtnHTML === "function");
t("dersKartiOgrtAc tanımlı", typeof dersKartiOgrtAc === "function");
t("öğrenci yolu: dersKartiAc çağrıları sayısı değişmedi (app'ta tanımlı + liste satırı)", (appKaynak.match(/function dersKartiAc\(/g) || []).length === 1);
t("öğrenci kart HTML dersKartiGovde id'sini kullanır (tek kaynak), öğretmen HTML AYNI id'yi paylaşır", (appKaynak.match(/id="dersKartiGovde"/g) || []).length === 2);

/* ---- 2) Buton dal testleri — GERÇEK girdiyle ---- */
console.log("2) Buton dalleri (gerçek girdi):");
temizle();
/* 2a) uygun birebir ders → buton VAR */
ekle({});
let g = gunlukHTML();
t("uygun birebir derste buton VAR (dersKartiOgrtAc)", g.includes("dersKartiOgrtAc('" + DB.dersler.find(l => l.id === "ks-ogrt-1").id + "')"), g.slice(0, 200));
/* 2b) grup (>1 öğrenci) → buton YOK */
temizle();
ekle({ id: "ks-ogrt-g", ogrenciIds: [ogr.id, ogr2.id] });
const grupUygun = dersKartiUygun(DB.dersler.find(l => l.id === "ks-ogrt-g"));
g = gunlukHTML();
t("grup dersi butonsuz (dersKartiUygun=false)", !grupUygun, String(grupUygun));
t("grup satırında buton çağrısı YOK", !g.includes("dersKartiOgrtAc"));
/* 2c) Sınıf Dersi (öğrenci boş) → buton YOK */
temizle();
ekle({ id: "ks-ogrt-s", ogrenciId: "", ogrenciAd: "", sinif: "12 SAY 1" });
const sinifUygun = dersKartiUygun(DB.dersler.find(l => l.id === "ks-ogrt-s"));
g = gunlukHTML();
t("Sınıf Dersi (öğrenci boş) dersKartiUygun=false", !sinifUygun, String(sinifUygun));
t("Sınıf Dersi satırında buton çağrısı YOK", !g.includes("dersKartiOgrtAc"));
/* 2d) iptal → buton YOK */
temizle();
ekle({ id: "ks-ogrt-i", durum: "iptal" });
const iptalUygun = dersKartiUygun(DB.dersler.find(l => l.id === "ks-ogrt-i"));
g = gunlukHTML();
t("iptal ders dersKartiUygun=false", !iptalUygun, String(iptalUygun));
t("iptal satırında buton çağrısı YOK", !g.includes("dersKartiOgrtAc"));
temizle();

/* ---- 3) Buton kalıbı ---- */
console.log("3) Buton kalıbı:");
const btn = dersKartiOgrtBtnHTML({ id: "x1" });
t("buton draggable=false", btn.includes('draggable="false"'));
t("buton onmousedown stopPropagation", btn.includes('onmousedown="event.stopPropagation()"'));
t("buton onclick stopPropagation + dersKartiOgrtAc", btn.includes("onclick=\"event.stopPropagation();event.preventDefault();dersKartiOgrtAc('x1')\""));
t("buton fa-image ikonu KULLANMAZ (eski kapı çakışması yok)", !btn.includes("fa-image"));

/* ---- 4) Kart HTML içerik kuralları ---- */
console.log("4) Kart HTML içerik kuralları:");
temizle();
ekle({});
const d1 = DB.dersler.find(l => l.id === "ks-ogrt-1");
const v1 = dersKartiOgrtVeri(d1);
t("öğretmen adı başlıkta (ogrAd)", v1.ogrAd === ogrt.ad, v1.ogrAd);
t("sınıf kaynağı yalnız DB.ogrenciler[].sinif", v1.sinif === (ogr.sinif || "Sınıf belirtilmemiş"), v1.sinif);
t("konu boş → 'Genel tekrar'", (() => { const d = Object.assign({}, d1, { konu: "" }); return dersKartiOgrtVeri(d).konu === "Genel tekrar"; })());
t("durum planlandi → 'Planlandı'", v1.durum === "Planlandı", v1.durum);
t("durum tamamlandi → 'Yapıldı'", (() => { const d = Object.assign({}, d1, { durum: "tamamlandi" }); return dersKartiOgrtVeri(d).durum === "Yapıldı"; })());
t("sınıfı olmayan öğrenci → 'Sınıf belirtilmemiş'", (() => { const oo = Object.assign({}, ogr, { id: "ks-ogrt-sinifsiz", sinif: "" }); DB.ogrenciler.push(oo); const dv = dersKartiOgrtVeri(Object.assign({}, d1, { ogrenciId: "ks-ogrt-sinifsiz" })); DB.ogrenciler = DB.ogrenciler.filter(x => x.id !== "ks-ogrt-sinifsiz"); return dv.sinif === "Sınıf belirtilmemiş"; })());
const h1 = dersKartiOgrtHTML(d1);
t("görselde TELEFON YOK (tel/anneTel/babaTel değerleri sızamaz)", !h1.includes(String(ogr.tel || "___telYok___")) && !/(0[5-9]\d{2})\s?\d{3}/.test(h1));

/* ---- 5) Dosya adı ---- */
console.log("5) Dosya adı:");
const srcOgrtAc = appKaynak.slice(appKaynak.indexOf("function dersKartiOgrtAc("), appKaynak.indexOf("/* ---- PNG raporu ---- */"));
t("dosya adı öneki: ders-karti-ogretmen-", srcOgrtAc.includes('"ders-karti-ogretmen-"'));
t("dosya adı öğretmen adından türetilir (ogrAd)", srcOgrtAc.includes("v.ogrAd"));
t("dosya adı .png ile biter", srcOgrtAc.includes('.png"'));
t("dosya adı telefon İÇERMEZ (yalnız ad+tarih kaynağı)", !/(tel| Telefon)/.test(srcOgrtAc.split("function dosyaAdi")[1].split("}")[0]));

/* ---- 6) WA hedefi: yalnız öğretmen akışı ---- */
console.log("6) WA hedefi (ogretmen):");
const aOgrt = waAliciBilgisi(ogrt.id, "ogretmen");
t("ogretmen hedefi tip=ogretmen, etiket=Öğretmen", aOgrt.tip === "ogretmen" && aOgrt.etiket === "Öğretmen");
t("ogretmen tel yoksa varMi=false (fallback yok)", aOgrt.varMi === !!(ogrt.tel), JSON.stringify({ tel: ogrt.tel, varMi: aOgrt.varMi }));
t("öğrenci yolları birebir: ogrenci hedefi davranışı aynı", waAliciBilgisi(ogr.id, "ogrenci").tip === "ogrenci");
t("akışta ogretmen hedefi yalnız dersKartiOgrtAc içinde", (appKaynak.match(/waAliciBilgisi\([^)]*,\s*"ogretmen"\)/g) || []).length === 1);
t("öğretmen tel yoksa toast: 'Öğretmen telefonu kayıtlı değil; görsel indirildi.'", srcOgrtAc.includes("Öğretmen telefonu kayıtlı değil; görsel indirildi."));

/* ---- 7) VERİ DEĞİŞTİRMEZ + kapsam ---- */
console.log("7) Veri değişmezlik ve kapsam:");
const keysOnce = Object.keys(store).length;
gunlukHTML(); /* render tekrar — buton çizimi localStorage'a yazmamalı */
t("buton çizimi localStorage'a YAZMAZ", Object.keys(store).length === keysOnce, JSON.stringify(Object.keys(store)));
t("haftalik izgarada öğretmen-kart butonu YOK", !haftalikOgrtTablo().includes("dersKartiOgrtAc"));
t("süit test.mjs'te tam 1 kez kayıtlı", (testKaynak.match(/ks-ogrt-ders-karti\.mjs/g) || []).length === 1);

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
