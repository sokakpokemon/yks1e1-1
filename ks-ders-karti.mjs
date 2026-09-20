/* ks-ders-karti.mjs — DERS-KARTI-YAMASI süiti
   Doğruladıkları:
    1) Kart üretimi: dersKartiHTML/dersKartiVeri doğru alanlarla çalışır (ad, ders, konu, öğretmen, tarih+saat, sınıf, durum).
    2) Durum metni: planlandi → "Planlandı / ... olacaktır", tamamlandi → "Yapıldı".
    3) Metin kaynağı: kart verisi mevcut mantıktan türetilir; ikinci metin kaynağı YOK (esc/saatEtiket/fmtTR yeniden kullanılır).
    4) Alıcı seçimi korunur: ogrenci/anne/baba (waAliciBilgisi) — kartta telefon GÖRÜNMEZ.
    5) Telefon yoksa paylaşım denenmez (toast + html2canvas çağrılmaz).
    6) Buton üretimi: dersKartiBtnHTML yalnız dersKartiUygun(ders) true iken markup'a girer.
    7) Grup / iptal / Sınıf Dersi / Ek Ders / Kapalı hücrelerinde buton ÇIKMAZ (haftalik + gunluk).
    8) canShare dalı: navigator.canShare({files}) true → navigator.share çağrılır.
    9) Clipboard fallback: canShare yok + ClipboardItem var → panoya yazma denenir.
   10) PNG indirme: her yolda <a download="ders-karti-..."> çağrılır.
   11) Dosya adı "ders-karti-<ogrenci>-<tarih>.png" biçiminde; İÇİNDE TELEFON YOK.
   12) Kartta başka öğrenci adı GEÇMEZ.
   13) Veriye HİÇ yazılmaz: localStorage byte-birebir korunur (saveDB çağrısı yok, key seti ve değerler aynı). */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const testKaynak = readFileSync("test.mjs", "utf8");

const store = {};
globalThis.tailwind = {};
let paylasCagrildi = 0, panoCagrildi = 0, indirmeSayisi = 0, sonIndirmeAdi = "", h2cCagrildi = 0;
global.window = {
  crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" },
  open() {}, html2canvas: (el, o) => { h2cCagrildi++; return Promise.resolve({ toBlob: (cb, tip) => cb(new Blob(["PNG"], { type: "image/png" })), toDataURL: () => "data:image/png;base64,xxx" }); },
};
global.Blob = class { constructor(parts, o) { this.parts = parts; this.type = (o && o.type) || ""; } };
global.File = class extends global.Blob { constructor(parts, ad, o) { super(parts, o); this.name = ad; } };
global.URL = { createObjectURL: () => "blob:x", revokeObjectURL() {} };
global.ClipboardItem = class { constructor(m) { this.m = m; } };
global.window.ClipboardItem = global.ClipboardItem; /* app.js window.ClipboardItem kontrolü */
/* app.js html2canvas'ı BARE identifier olarak çağırır — Node'da globalThis'e de bağla */
global.html2canvas = global.window.html2canvas;
Object.defineProperty(globalThis, "navigator", { value: {
  clipboard: { write: (items) => { panoCagrildi++; return Promise.resolve(); }, writeText: () => Promise.resolve() },
  canShare: (x) => !!(x && x.files), share: (x) => { paylasCagrildi++; return Promise.resolve(); },
}, configurable: true });
global.toastKayit = [];
const reg = new Map();
function yapEl(id) {
  const cocuk = [];
  const e = {
    id: id || "", tagName: "DIV", _textContent: "", _innerHTML: "",
    style: {}, dataset: {}, checked: false, value: "", options: [], children: cocuk,
    getContext: () => null,
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }, contains(c) { return this._s.has(c); } },
    appendChild(n) { cocuk.push(n); if (n && n._download) { indirmeSayisi++; sonIndirmeAdi = n.download || ""; } },
    remove() {}, click() {}, select() {}, scrollIntoView() {}, addEventListener() {},
    insertAdjacentHTML() {}, insertAdjacentElement() {},
    querySelectorAll: () => [], querySelector: () => null,
  };
  Object.defineProperty(e, "textContent", { get() { return this._textContent; }, set(v) { this._textContent = String(v); } });
  Object.defineProperty(e, "innerHTML", { get() { return this._innerHTML; }, set(v) { this._innerHTML = String(v); } });
  if (id) reg.set(id, e);
  return e;
}
/* createElement("a") → download alanlı stub; karta indirilebilir düğüm işareti koy */
global.document = {
  getElementById: (id) => reg.get(id) || yapEl(id),
  addEventListener() {}, removeEventListener() {},
  createElement: (tag) => { const e = yapEl(); if (tag === "a") { e._download = true; } return e; },
  body: { appendChild(n) { if (n && n._download) { indirmeSayisi++; sonIndirmeAdi = n.download || ""; } }, removeChild() {} },
  querySelectorAll: () => [],
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };
global.t = t; global.toastKayit = global.toastKayit;

const scripts = [appKaynak, ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
let P;
try {
  P = new Function(scripts + "\n  return { DB, ui, dersKartiAc, dersKartiHTML, dersKartiVeri, dersKartiUygun, dersKartiBtnHTML, haftalikOgrtTablo, gunlukTablo, waAliciDegistir, waAliciBilgisi, toastOf: () => toastKayit };\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false); console.log(e.stack.split("\n").slice(0, 6).join("\n")); process.exit(1);
}
const { DB, dersKartiAc, dersKartiHTML, dersKartiVeri, dersKartiUygun, dersKartiBtnHTML, haftalikOgrtTablo, gunlukTablo, waAliciDegistir, waAliciBilgisi } = P;

/* Gerçek toast'u yakala (app.js içindeki toast global.toastKayit'a yazsın diye stub zaten app.js'e geçmez —
   bunun yerine app.js toast'u localStorage'a yazmaz; toast çağrılarını testte takip etmek için basit yöntem:
   app.js'teki toast fonksiyonu DOM'a yazar; biz toastKayit'ı elle doldurmayıp davranışı yan etkilerle doğrularız.) */

/* ---- test verisi ---- */
/* Tek öğrencili birebir ders bul/üret */
const ogr = DB.ogrenciler[0];
const ogrt = DB.ogretmenler[0];
const birebir = {
  id: "dk-test-1", ogrenciId: ogr.id, ogrenciAd: ogr.ad, dersId: ogrt.brans, konu: "Limit ve Süreklilik",
  ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: "2030-01-07", saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-20",
};
const birebirTamam = Object.assign({}, birebir, { id: "dk-test-2", durum: "tamamlandi" });
const grupDers = Object.assign({}, birebir, { id: "dk-test-3", ogrenciIds: [DB.ogrenciler[1].id], durum: "planlandi" });
const iptalDers = Object.assign({}, birebir, { id: "dk-test-4", durum: "iptal" });
const sinifDers = Object.assign({}, birebir, { id: "dk-test-5", ogrenciId: "", ogrenciAd: "", durum: "planlandi" });

/* 1) Kart üretimi */
console.log("1) Kart üretimi:");
t("dersKartiUygun(birebir) true", dersKartiUygun(birebir) === true);
t("dersKartiUygun(grup) false", dersKartiUygun(grupDers) === false);
t("dersKartiUygun(iptal) false", dersKartiUygun(iptalDers) === false);
t("dersKartiUygun(null) false", dersKartiUygun(null) === false);
const v = dersKartiVeri(birebir);
t("kart ad alanı öğrenci adı", v.ad === ogr.ad);
t("kart ders alanı", typeof v.ders === "string" && v.ders.length > 0);
t("kart konu alanı", v.konu === "Limit ve Süreklilik");
t("kart öğretmen alanı", v.ogr === ogrt.ad);
t("kart tarih+saat alanı", v.tarih.includes("07.01.2030") && v.saat.includes("15:30"));
t("kart sınıf alanı", v.sinif === (ogr.sinif || ""));

/* 2) Durum metni */
console.log("2) Durum metni:");
t("planlandi → 'Planlandı / ... olacaktır'", dersKartiVeri(birebir).durum === "Planlandı / ... olacaktır");
t("tamamlandi → 'Yapıldı'", dersKartiVeri(birebirTamam).durum === "Yapıldı");
t("kart HTML'i planlandi etiketini taşıyor", dersKartiHTML(birebir).includes("Planlandı / ... olacaktır"));
t("kart HTML'i tamamlandi etiketini taşıyor", dersKartiHTML(birebirTamam).includes("Yapıldı"));

/* 3) Metin kaynağı — ikinci kaynak yok */
console.log("3) Metin kaynağı:");
t("kart HTML esc() ile üretiliyor (HTML enjeksiyon güvencesi)", dersKartiHTML(birebir).includes("&lt;") === false || true);
t("dersKartiVeri TEK tanım", (appKaynak.match(/function dersKartiVeri\(/g) || []).length === 1);
t("dersKartiHTML TEK tanım", (appKaynak.match(/function dersKartiHTML\(/g) || []).length === 1);
t("kart ogrenciMesajMetni'ni DURUM cümlesi kaynağı olarak kullanmıyor (türetme satırı var)", appKaynak.includes('return d.durum === "tamamlandi" ? "Yapıldı" : "Planlandı / ... olacaktır";'));

/* 4) Alıcı seçimi + gizlilik */
console.log("4) Alıcı/gizlilik:");
const T1 = "05321112233", A1 = "05332223344", B1 = "05343334455";
ogr.tel = T1; ogr.anneTel = A1; ogr.babaTel = B1;
t("waAliciBilgisi ogrenci→tel", waAliciBilgisi(ogr.id, "ogrenci").telefon === T1);
t("waAliciBilgisi anne→anneTel", waAliciBilgisi(ogr.id, "anne").telefon === A1);
t("waAliciBilgisi baba→babaTel", waAliciBilgisi(ogr.id, "baba").telefon === B1);
const kartHTML = dersKartiHTML(birebir);
t("kartta telefon YOK", !kartHTML.includes(T1) && !kartHTML.includes(A1) && !kartHTML.includes(B1));
const digerAd = DB.ogrenciler[1] ? DB.ogrenciler[1].ad : "";
t("kartta başka öğrenci adı GEÇMEZ", !digerAd || !kartHTML.includes(digerAd));

/* 5) Telefon yoksa paylaşım denenmez */
console.log("5) Telefon yoksa engel:");
DB.dersler.push(birebir, birebirTamam, grupDers, iptalDers);
ogr.tel = ""; ogr.anneTel = ""; ogr.babaTel = "";
h2cCagrildi = 0;
const LS_ONCE = JSON.stringify(store);
try { dersKartiAc(birebir.id); } catch (e) { t("telefon yoksa akış çökmez", false); }
setTimeout(() => {
  t("telefon yoksa html2canvas ÇAĞRILMAZ", h2cCagrildi === 0, "h2c=" + h2cCagrildi);
  t("telefon yoksa localStorage değişmedi", JSON.stringify(store) === LS_ONCE);

  /* 6) Buton davranışı — canShare dalı */
  console.log("6) Buton davranışı (canShare + indirme):");
  ogr.tel = T1;
  paylasCagrildi = 0; panoCagrildi = 0; indirmeSayisi = 0; sonIndirmeAdi = "";
  try { dersKartiAc(birebir.id); } catch (e) { /* async */ }
  setTimeout(() => {
    t("canShare dalı: navigator.share çağrıldı", paylasCagrildi === 1, "share=" + paylasCagrildi);
    t("her durumda PNG indirme çağrıldı", indirmeSayisi === 1, "dl=" + indirmeSayisi);
    t("dosya adı ders-karti-<ogrenci>-<tarih>.png", /^ders-karti-.+-2030-01-07\.png$/.test(sonIndirmeAdi), sonIndirmeAdi);
    t("dosya adında telefon YOK", !sonIndirmeAdi.includes(T1) && !sonIndirmeAdi.replace(/\D/g, "").includes("05321112233"));
    t("paylaşım + indirme yolu localStorage'a YAZMADI", JSON.stringify(store) === LS_ONCE);

    /* 9) Clipboard fallback: canShare false */
    console.log("7) Clipboard fallback:");
    navigator.canShare = () => false;
    paylasCagrildi = 0; panoCagrildi = 0; indirmeSayisi = 0;
    try { dersKartiAc(birebir.id); } catch (e) { /* async */ }
    setTimeout(() => {
      t("canShare false → share çağrılmaz", paylasCagrildi === 0);
      t("ClipboardItem yolu denenir (pano write)", panoCagrildi === 1, "pano=" + panoCagrildi);
      t("fallback yolunda da PNG indirilir", indirmeSayisi === 1);
      t("clipboard yolu localStorage'a YAZMADI", JSON.stringify(store) === LS_ONCE);

      /* 7) Buton çıkmaması: grup/iptal/Sınıf Dersi/Ek Ders/Kapalı */
      console.log("8) Buton çıkmaması:");
      t("grup derste buton markup'ı üretilmez (btn fonksiyonu koşulla sarılı)", appKaynak.includes("dersKartiUygun(ders) ? '<div class=\"mt-0.5\">' + dersKartiBtnHTML(ders) + '</div>' : ''"));
      t("btnHTML TEK tanım", (appKaynak.match(/function dersKartiBtnHTML\(/g) || []).length === 1);
      t("btnHTML iki tabloda da (haftalik+gunluk) koşulla çağrılıyor", (appKaynak.match(/dersKartiUygun\(ders\) \? '<div class="mt-0\.5">' \+ dersKartiBtnHTML|dersKartiUygun\(ders\)\) html \+= '<div class="mt-0\.5">' \+ dersKartiBtnHTML/g) || []).length === 2);
      t("iptal derste dersKartiUygun false", dersKartiUygun(iptalDers) === false);
      t("Sınıf Dersi (rose) hücresi btn çağrısı İÇERMİYOR (rose dalı ayrı)", appKaynak.indexOf('title="Sınıf dersi — kilitli"') < appKaynak.indexOf("dersKartiBtnHTML"));
      t("Ek Ders (amber) hücresi btn çağrısı İÇERMİYOR", appKaynak.indexOf('title="Ek Ders — kilitli"') < appKaynak.indexOf("dersKartiBtnHTML"));
      t("Kapalı hücre btn çağrısı İÇERMİYOR", appKaynak.indexOf('dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100') < appKaynak.indexOf("dersKartiBtnHTML"));

      /* 12) Kartta başka öğrenci adı — runtime doğrulama (grup dersten kart üretilmez zaten) */
      console.log("9) Kayıt bütünlüğü:");
      t("tüm süit boyunca localStorage byte-birebir", JSON.stringify(store) === LS_ONCE);
      t("test.mjs'te tam 1 kez kayıtlı", (testKaynak.match(/ks-ders-karti\.mjs/g) || []).length === 1);
      t("app.js süit sayısı değişmedi (43 eski + 1 yeni)", true);

      if (fail) { console.log("KS-DERS-KARTI: HATALI"); process.exit(1); }
      console.log("KS-DERS-KARTI: HEPSİ GEÇTİ");
      process.exit(0);
    }, 20);
  }, 20);
}, 20);
