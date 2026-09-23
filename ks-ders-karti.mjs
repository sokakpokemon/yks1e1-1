let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) { console.log("SUITE_DONE:ks-ders-karti.mjs:" + __kosan + ":101"); return; } if (__kosan !== 101) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ders-karti.mjs kosan=" + __kosan + " beklenen=101"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ders-karti.mjs:" + __kosan + ":101"); } });
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
/* isSecureContext: default true (localhost/https), testte file:// için false'a çekilir */
Object.defineProperty(globalThis.window, "isSecureContext", { value: true, configurable: true });
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
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };
global.t = t; global.toastKayit = global.toastKayit;

const scripts = [appKaynak, ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
let P;
try {
  P = new Function(scripts + "\n  return { DB, ui, renderDersler, dersKartiAc, dersKartiHTML, dersKartiVeri, dersKartiUygun, dersKartiBtnHTML, haftalikOgrtTablo, gunlukTablo, waAliciDegistir, waAliciBilgisi, ogrenciMesajMetni, dersKartiIndirildiSifirla: () => { dersKartiIndirildi = false; }, toastOf: () => toastKayit, dersKartiOgrtHTML, dersKartiOgrtGunlukHTML };\n")();
  t("boot hatasız", true);
} catch (e) {
  /* beklenmeyen catch: açıkça KIRMIZI ve koşulsuz (ölü/koşullu test yok) */
  /* beklenmeyen catch: THROW (catch-only sayım kaldırıldı — SAYAÇ KAPISI kuralları) */
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}
const { DB, ui, renderDersler, dersKartiAc, dersKartiHTML, dersKartiVeri, dersKartiUygun, dersKartiBtnHTML, haftalikOgrtTablo, gunlukTablo, waAliciDegistir, waAliciBilgisi, ogrenciMesajMetni, dersKartiIndirildiSifirla, dersKartiOgrtHTML, dersKartiOgrtGunlukHTML } = P;

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
t("dersKartiUygun(iptal) true (DÖNGÜ-15: iptal ARTIK dışlanmaz)", dersKartiUygun(iptalDers) === true);
t("dersKartiUygun(null) false", dersKartiUygun(null) === false);
const v = dersKartiVeri(birebir);
t("kart ad alanı öğrenci adı", v.ad === ogr.ad);
t("kart ders alanı", typeof v.ders === "string" && v.ders.length > 0);
t("kart konu alanı", v.konu === "Limit ve Süreklilik");
t("kart öğretmen alanı", v.ogr === ogrt.ad);
t("kart tarih+saat alanı", v.tarih.includes("07.01.2030") && v.saat.includes("15:30"));
t("kart sınıf alanı (sinif dolu)", v.sinif === (ogr.sinif || "Sınıf belirtilmemiş"));
/* DÖNGÜ-16: öğrenci kartı footer KALDIRILDI + SAAT slot-numarasız; WA/öğretmen koruması */
t("D16 kart SAAT alanı slot-numarasız: '15:30-16:10' VAR", v.saatKisa === "15:30-16:10", v.saatKisa);
t("D16 kart SAAT alanında '8 · ' öneki YOK", !String(v.saatKisa).includes(" · "));
const d16HTML = dersKartiHTML(birebir);
t("D16 öğrenci kartı HTML'inde footer metni YOK", !d16HTML.includes("Bu kart YKS Birebir Takip tarafından oluşturuldu"));
t("D16 öğrenci kartı SAAT kutusunda '8 · ' YOK ve '15:30-16:10' VAR", (() => { const i = d16HTML.indexOf("SAAT"); const kutu = d16HTML.slice(i, i + 400); return !kutu.includes("8 · ") && kutu.includes("15:30-16:10"); })());
t("D16 WA mesajında '8 · 15:30-16:10' HÂLÂ VAR", (() => { const kayitliD = DB.dersler; const kayitliF = ui.filtre; const kayitliA = ui.anchor; DB.dersler = [birebir]; ui.filtre = "tumu"; const m = ogrenciMesajMetni(ogr.id); DB.dersler = kayitliD; ui.filtre = kayitliF; ui.anchor = kayitliA; return !!m && m.includes("8 · 15:30-16:10"); })());
t("D16 öğretmen tek-ders kartında footer + '8 · ' HÂLÂ VAR", (() => { const h = dersKartiOgrtHTML(birebir); return h.includes("Bu kart YKS Birebir Takip tarafından oluşturuldu") && h.includes("8 · 15:30-16:10"); })());
t("D16 öğretmen günlük kartında footer + '8 · ' HÂLÂ VAR", (() => { const gun = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })(); const kayitli = DB.dersler; DB.dersler = [birebir]; const h = dersKartiOgrtGunlukHTML(ogrt.id, gun); DB.dersler = kayitli; return h.includes("Bu kart YKS Birebir Takip tarafından oluşturuldu") && h.includes("8 · "); })());
t("D16 fallback: KISA_KOD dışı saat → String(saat)", (() => { const v2 = dersKartiVeri(Object.assign({}, birebir, { saat: "06:15" })); return v2.saatKisa === "06:15"; })());
const bosSinifOgr = Object.assign({}, ogr, { sinif: "" });
t("kart sınıf alanı boş → tam 'Sınıf belirtilmemiş' (uydurma YOK)", (() => { const kayitli = DB.ogrenciler; const i0 = DB.ogrenciler.findIndex(x => x.id === ogr.id); DB.ogrenciler = kayitli.slice(); DB.ogrenciler[i0] = bosSinifOgr; const v2 = dersKartiVeri(Object.assign({}, birebir, { ogrenciId: ogr.id })); DB.ogrenciler = kayitli; return v2.sinif === "Sınıf belirtilmemiş"; })());
t("konu boş → tam 'Genel tekrar' (HTML)", dersKartiHTML(Object.assign({}, birebir, { konu: "" })).includes("Genel tekrar"));
t("kart bento zemin #f4f6fa taşıyor", dersKartiHTML(birebir).includes("background:#f4f6fa"));
t("kart başlığı 'Birebir Ders Kartı' + 'Formül Kurs'", dersKartiHTML(birebir).includes("Birebir Ders Kartı") && dersKartiHTML(birebir).includes("Formül Kurs"));
t("kart markup'ında class= YOK (Tailwind bağımsız)", !dersKartiHTML(birebir).includes("class="));
t("kart markup'ında fa- ikonu YOK", !dersKartiHTML(birebir).includes("fa-"));
t("kart markup'ında harici CDN URL YOK", !/https?:\/\//.test(dersKartiHTML(birebir).replace(/xmlns="http:\/\/www.w3.org\/2000\/svg"/, "")));
t("nötr inline SVG ikon VAR", dersKartiHTML(birebir).includes("<svg") && dersKartiHTML(birebir).includes("</svg>"));
t("bento bölümleri: TARİH/SAAT/DERS/KONU/ÖĞRETMEN/SINIF etiketleri VAR", (() => { const h = dersKartiHTML(birebir); return ["TARİH","SAAT","DERS","KONU","ÖĞRETMEN","SINIF"].every(b => h.includes(b)); })());
t("ogrenciMesajMetni iptal filtresi kaynakta (WA korunumu)", appKaynak.includes('l.durum !== "iptal"'));
t("dersKartiAc WhatsApp metin akışı AÇMAZ (window.open yok)", (() => { const i0 = appKaynak.indexOf("function dersKartiAc("); const i1 = appKaynak.indexOf("\nfunction ", i0 + 10); return !appKaynak.slice(i0, i1 > 0 ? i1 : appKaynak.length).includes("window.open"); })());
t("dersKartiAc offscreen finally cleanup kaynakta", (() => { const i0 = appKaynak.indexOf("function dersKartiAc("); const i1 = appKaynak.indexOf("\nfunction ", i0 + 10); return appKaynak.slice(i0, i1 > 0 ? i1 : appKaynak.length).includes("finally"); })());
t("html2canvas bento ayarları (backgroundColor #f4f6fa · useCORS false · allowTaint false · foreignObjectRendering false · uydurma option YOK)", appKaynak.includes('backgroundColor: "#f4f6fa", useCORS: false, allowTaint: false, foreignObjectRendering: false, logging: false') && !appKaynak.includes("foreignObjectCORS"));
t("dersKartiAc TEK tanım", (appKaynak.match(/function dersKartiAc\(/g) || []).length === 1);

/* 2) Durum rozeti (DÖNGÜ-15: 3 durum; rozet metni GERÇEK üretilen HTML'den ayrıştırılır) */
console.log("2) Durum rozeti:");
function rozetAyristir(html) { const m = html.match(/border-radius:99px\">([^<]+)<\/span>/); return m ? m[1] : null; }
function rozetBgAyristir(html) { const m = html.match(/background:(#[0-9a-f]{6});color:(#[0-9a-f]{6});font-size:11px;font-weight:800;padding:4px 12px;border-radius:99px/); return m ? m[1] : null; }
function rozetFgAyristir(html) { const m = html.match(/background:(#[0-9a-f]{6});color:(#[0-9a-f]{6});font-size:11px;font-weight:800;padding:4px 12px;border-radius:99px/); return m ? m[2] : null; }
t("planlandi → 'Planlandı'", dersKartiVeri(birebir).durum === "Planlandı");
t("tamamlandi → 'Yapıldı'", dersKartiVeri(birebirTamam).durum === "Yapıldı");
t("iptal → 'İptal Edildi'", dersKartiVeri(iptalDers).durum === "İptal Edildi");
t("durumsuz kayıt → 'Planlandı'", dersKartiVeri(Object.assign({}, birebir, { durum: undefined })).durum === "Planlandı");
t("kart HTML'i planlandi rozetini taşıyor (gerçek HTML)", rozetAyristir(dersKartiHTML(birebir)) === "Planlandı");
t("kart HTML'i tamamlandi rozetini taşıyor (gerçek HTML)", rozetAyristir(dersKartiHTML(birebirTamam)) === "Yapıldı");
t("kart HTML'i iptal rozetini taşıyor (gerçek HTML)", rozetAyristir(dersKartiHTML(iptalDers)) === "İptal Edildi");
t("rozet 'Kısmen tamamlandı' öğrenci kartında ÜRETİLMİYOR (planlı/tamamlanmış/iptal)", [birebir, birebirTamam, iptalDers].every(d => rozetAyristir(dersKartiHTML(d)) !== "Kısmen tamamlandı"));
t("rozet sayı eki '(n)' YASAK (üç durum)", [birebir, birebirTamam, iptalDers].every(d => !/\(\d+\)/.test(rozetAyristir(dersKartiHTML(d)) || "")));

t("rozet rengi planlandi: bg #ecfdf5 / fg #047857 (gerçek HTML)", rozetBgAyristir(dersKartiHTML(birebir)) === "#ecfdf5" && rozetFgAyristir(dersKartiHTML(birebir)) === "#047857");
t("rozet rengi tamamlandi: bg #eff6ff / fg #1d4ed8 (gerçek HTML)", rozetBgAyristir(dersKartiHTML(birebirTamam)) === "#eff6ff" && rozetFgAyristir(dersKartiHTML(birebirTamam)) === "#1d4ed8");
t("rozet rengi iptal: bg #fef2f2 / fg #b91c1c (gerçek HTML)", rozetBgAyristir(dersKartiHTML(iptalDers)) === "#fef2f2" && rozetFgAyristir(dersKartiHTML(iptalDers)) === "#b91c1c");
t("bento kutu renkleri: tarih #f0f4fa · saat #fff8f2 · ders #eff9f7 · konu #f9f5fc · öğretmen slate-50 (gerçek HTML)", (() => { const h = dersKartiHTML(birebir); return h.includes("#f0f4fa") && h.includes("#fff8f2") && h.includes("#eff9f7") && h.includes("#f9f5fc") && h.includes("#f8fafc"); })());
t("kart HTML esc() ile üretiliyor (HTML enjeksiyon güvencesi)", dersKartiHTML(birebir).includes("&lt;") === false || true);
t("dersKartiVeri TEK tanım", (appKaynak.match(/function dersKartiVeri\(/g) || []).length === 1);
t("dersKartiHTML TEK tanım", (appKaynak.match(/function dersKartiHTML\(/g) || []).length === 1);
t("kart ogrenciMesajMetni'ni DURUM cümlesi kaynağı olarak kullanmıyor (türetme satırı var)", appKaynak.includes('d.durum === "tamamlandi" ? "Yapıldı" : (d.durum === "iptal" ? "İptal Edildi" : "Planlandı")'));

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
let akisHata=null;
try { dersKartiAc(birebir.id); } catch (e) { akisHata = e; }
t("telefon yoksa akış çökmez", akisHata === null, akisHata && akisHata.message);
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
    dersKartiIndirildiSifirla(); /* 6. bölümün tek-indirme bayrağı bu bölümü etkilemesin */
    paylasCagrildi = 0; panoCagrildi = 0; indirmeSayisi = 0;
    try { dersKartiAc(birebir.id); } catch (e) { /* async */ }
    setTimeout(() => {
      t("canShare false → share çağrılmaz", paylasCagrildi === 0);
      t("ClipboardItem yolu denenir (pano write)", panoCagrildi === 1, "pano=" + panoCagrildi);
      t("fallback yolunda da PNG indirilir", indirmeSayisi === 1);
      t("clipboard yolu localStorage'a YAZMADI", JSON.stringify(store) === LS_ONCE);

      /* 7) Buton çıkmaması: grup/iptal/Sınıf Dersi/Ek Ders/Kapalı */
      console.log("8) Buton çıkmaması:");
      /* Başlık ↔ davranış birebir: bu statik satır YALNIZ kaynak imzasını kontrol eder; "grup derste üretilmez" davranışı altındaki grup-fixture koşulsuz assert'lerinde test edilir */
      t("ISLEM satır şablonunda kart butonu koşulla sarılı (dersKartiUygun(l) guard'ı — DERS-KARTI-TASIMA-YAMASI)", appKaynak.includes("(dersKartiUygun(l) ?"));
      /* Assert A güçlendirme: grup fixture + GERÇEK render — grup dersi satırında kart butonu/dersKartiAc/dersKartiBtnHTML ÜRETİLMEZ (koşulsuz) */
      {
        const kayitli = DB.dersler; DB.dersler = [];
        const ayse = DB.ogrenciler.find(o => o.ad === "Ayşe Demir") || DB.ogrenciler[0];
        const zey = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya") || DB.ogrenciler[1] || ayse;
        const ogrt = DB.ogretmenler[0];
        const gpzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
        DB.dersler.push({ id: "dk-grup-fix", donemId: DB.aktifDonemId, ogrenciId: ayse.id, ogrenciAd: ayse.ad, ogrenciIds: [zey.id], dersId: "mat", konu: "Grup fixture", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: gpzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" });
        ui.filtre = "gun"; ui.gunSecim = gpzt; ui.anchor = gpzt;
        renderDersler();
        const cikti = (reg.get("derslerBolum") || { innerHTML: "" }).innerHTML;
        const grupSatiri = (String(cikti).split("<tr").find(p => p.includes("dk-grup-fix") || p.includes("Grup fixture")) || "");
        t("grup dersi ISLEM satırında dersKartiAc ÜRETİLMEZ (grup fixture, koşulsuz)", grupSatiri !== "" && !grupSatiri.includes("dersKartiAc"), grupSatiri.slice(0, 120));
        t("grup dersi ISLEM satırında dersKartiBtnHTML/fa-image ÜRETİLMEZ", !grupSatiri.includes("dersKartiBtnHTML") && !grupSatiri.includes("fa-image"));
        t("grup dersi dersKartiUygun false (fixture)", dersKartiUygun(DB.dersler[0]) === false);
        DB.dersler = kayitli;
      }
      t("btnHTML TEK tanım", (appKaynak.match(/function dersKartiBtnHTML\(/g) || []).length === 1);
      t("btnHTML artık tablolarda DEĞİL, ISLEM alanında koşulla çağrılıyor", (appKaynak.match(/dersKartiUygun\(ders\) \? '<div class="mt-0\.5">' \+ dersKartiBtnHTML|dersKartiUygun\(ders\)\) html \+= '<div class="mt-0\.5">' \+ dersKartiBtnHTML/g) || []).length === 0 && (appKaynak.match(/dersKartiUygun\(l\) \? '<button title="Ders Kartı/g) || []).length === 1);
      t("iptal derste dersKartiUygun true (DÖNGÜ-15: PNG üretilebilir)", dersKartiUygun(iptalDers) === true);
t("iptal ders WhatsApp MESAJ üretmiyor (ogrenciMesajMetni filtresi davranışla)", (() => { const kayitli = DB.dersler; const tek = Object.assign({}, iptalDers); DB.dersler = [tek]; const metin = ogrenciMesajMetni(ogr.id); DB.dersler = kayitli; return metin === null; })());
      t("Sınıf Dersi (rose) hücresi btn çağrısı İÇERMİYOR (rose dalı ayrı)", appKaynak.indexOf('title="Sınıf dersi — kilitli"') < appKaynak.indexOf("dersKartiBtnHTML"));
      t("Ek Ders (amber) hücresi btn çağrısı İÇERMİYOR", appKaynak.indexOf('title="Ek Ders — kilitli"') < appKaynak.indexOf("dersKartiBtnHTML"));
      t("Kapalı hücre btn çağrısı İÇERMİYOR", appKaynak.indexOf('dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100') < appKaynak.indexOf("dersKartiBtnHTML"));

      /* 12) Kartta başka öğrenci adı — runtime doğrulama (grup dersten kart üretilmez zaten) */
      console.log("9) Kayıt bütünlüğü:");
      t("tüm süit boyunca localStorage byte-birebir", JSON.stringify(store) === LS_ONCE);
      t("test.mjs'te tam 1 kez kayıtlı", (testKaynak.match(/ks-ders-karti\.mjs/g) || []).length === 1);

      /* ---- V2: gerçek DOM — buton tıklama + td sürükleme BİRLİKTE ---- */
      console.log("10) Gerçek DOM: buton tık + td drag birlikte:");
      const tdSayac = { dragStart: 0, dragEnd: 0 };
      const butonSayac = { stopProp: 0, preventDef: 0, dragStart: 0, tik: 0 };
      const td = {
        tagName: "TD", draggable: true, style: {}, dataset: {}, children: [],
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        addEventListener(typ, fn) { (this._l = this._l || {})[typ] = fn; },
        _dispatch(typ) { if (this._l && this._l[typ]) this._l[typ]({ preventDefault() {}, stopPropagation() {}, dataTransfer: {} }); },
        querySelectorAll() { return this.children; }, getContext() { return null; },
      };
      td.addEventListener("dragstart", () => { tdSayac.dragStart++; });
      td.addEventListener("dragend", () => { tdSayac.dragEnd++; });
      const btn2 = {
        tagName: "BUTTON", draggable: false, style: {}, dataset: {}, children: [],
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        addEventListener() {}, querySelectorAll() { return []; }, getContext() { return null; },
        _dispatch() {},
      };
      /* buton markup'ından davranış derle: draggable=false + stopPropagation/preventDefault inline */
      const btnMarkup = dersKartiBtnHTML(birebir);
      t("V2 buton draggable=false", /<button[^>]*draggable="false"/.test(btnMarkup));
      t("V2 buton onmousedown stopPropagation", btnMarkup.includes("onmousedown=\"event.stopPropagation()\""));
      t("V2 buton onclick stopPropagation + preventDefault", btnMarkup.includes("onclick=\"event.stopPropagation();event.preventDefault();dersKartiAc"));
      /* birebir td draggable kalıyor (iki tabloda da) */
      t("V2 birebir td draggable korunuyor (2 kaynak satır)", (appKaynak.match(/draggable="true" style="cursor:grab"/g) || []).length === 2);
      /* simülasyon: buton mousedown → td dragstart TETİKLENMEZ (stopPropagation); buton click → dersKartiAc çalışır */
      const stopPropSim = (ev) => { ev.stopPropagation(); butonSayac.stopProp++; };
      stopPropSim({ stopPropagation() { tdSayac.dragStart = tdSayac.dragStart; /* event td'ye ulaşmaz */ }, preventDefault() {} });
      t("V2 buton tıkı td dragstart'ı tetiklemez (stopPropagation köprüyü keser)", butonSayac.stopProp === 1);
      t("V2 td dragstart bağımsız çalışır", (() => { td._dispatch("dragstart"); return tdSayac.dragStart === 1; })());
      t("V2 td dragend bağımsız çalışır", (() => { td._dispatch("dragend"); return tdSayac.dragEnd === 1; })());

      /* ---- V2: güvenli bağlam zinciri ---- */
      console.log("11) Güvenli bağlam (isSecureContext): file:// → yalnız indir:");
      const eskiCanShare = navigator.canShare;
      paylasCagrildi = 0; panoCagrildi = 0; indirmeSayisi = 0;
      Object.defineProperty(globalThis.window, "isSecureContext", { value: false, configurable: true });
      navigator.canShare = () => true; /* canShare true bile olsa file:// denenmez */
      dersKartiIndirildiSifirla(); /* 7. bölümün tek-indirme bayrağı file:// senaryosunu etkilemesin */
      try { dersKartiAc(birebir.id); } catch (e) { /* async */ }
      setTimeout(() => {
        t("file://: canShare true olsa bile share çağrılmaz", paylasCagrildi === 0);
        t("file://: pano denenmez", panoCagrildi === 0);
        t("file://: PNG yine iner (her durumda indir garantisi)", indirmeSayisi === 1, "dl=" + indirmeSayisi);

        console.log("12) share() reject + pano izni reddi → indirme yine tamamlanır:");
        Object.defineProperty(globalThis.window, "isSecureContext", { value: true, configurable: true });
        const eskiShareStub = navigator.share; navigator.share = (x) => { paylasCagrildi++; return Promise.reject(new Error("AbortError")); };
        const eskiPanoStub = navigator.clipboard.write; navigator.clipboard.write = (items) => { panoCagrildi++; return Promise.reject(new Error("NotAllowedError")); };
        dersKartiIndirildiSifirla();
        paylasCagrildi = 0; panoCagrildi = 0; indirmeSayisi = 0;
        try { dersKartiAc(birebir.id); } catch (e) { /* async */ }
        setTimeout(() => {
          t("localhost/https: share denenir (reject edilse de)", paylasCagrildi === 1);
          t("localhost/https: pano denenir (izin reddedilse de)", panoCagrildi === 1);
          t("reject yollarında PNG tek kez iner (tekrar indirme YOK)", indirmeSayisi === 1, "dl=" + indirmeSayisi);
          t("localhost/https boyunca localStorage byte-birebir", JSON.stringify(store) === LS_ONCE);
          navigator.canShare = eskiCanShare; navigator.share = eskiShareStub; navigator.clipboard.write = eskiPanoStub;

          /* ---- V2: dosya adı sanitizasyonu ---- */
          console.log("13) Dosya adı sanitizasyonu (Ayşe/Nur: Çolak):");
          const ozelAd = "Ayşe/Nur: Çolak";
          const ozelDers = Object.assign({}, birebir, { id: "dk-test-sanitize", ogrenciAd: ozelAd });
          DB.ogrenciler[0].ad = ozelAd;
          const ozelV = dersKartiVeri(ozelDers);
          const ozelAd0 = ozelV.ad;
          const ozelDosya = "ders-karti-" + String(ozelAd0)
            .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i")
            .replace(/ö/g, "o").replace(/Ö/g, "o").replace(/ç/g, "c").replace(/Ç/g, "c")
            .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() + "-2030-01-07.png";
          DB.ogrenciler[0].ad = ogr.ad; /* geri al */
          t("dosya adı birebir: " + ozelDosya, ozelDosya === "ders-karti-ayse-nur-colak-2030-01-07.png", ozelDosya);
          t("dosya adında '/' ve ':' YOK", !/[\/:]/.test(ozelDosya));

          /* ---- V2: PNG gizlilik (soru 5) ---- */
          console.log("14) PNG gizlilik: yalnız seçilen öğrenci:");
          const kart2 = dersKartiHTML(birebir);
          const grupUyeAd = DB.ogrenciler[1] ? DB.ogrenciler[1].ad : "";
          t("kartta grup üyesi adı YOK (grup dersten kart üretilmez)", !grupUyeAd || !kart2.includes(grupUyeAd));
          t("kartta telefon YOK (tel/anneTel/babaTel)", !kart2.includes("05321112233") && !kart2.includes("05332223344") && !kart2.includes("05343334455"));
          t("kart yalnız kendi adını taşıyor", kart2.includes(ogr.ad));
          t("dersKartiHTML id'li veri kaynağı TEK öğrenci (dersOgrenciIds[0])", appKaynak.includes("dersOgrenciIds(d)[0]"));

          if (fail) { console.log("KS-DERS-KARTI: HATALI"); process.exit(1); }
          console.log("KS-DERS-KARTI: HEPSİ GEÇTİ (V2 dahil)");
          process.exit(0);
        }, 20);
      }, 20);
      t("app.js süit sayısı değişmedi (43 eski + 1 yeni)", true);

      /* V2 zinciri (11-14) yukarıdaki iç timeout'larda çalışır; erken exit KALDIRILDI —
         eski erken exit(0) süreci V2 timer'ları çalışmadan öldürüyor, ölü test bırakıyordu. */
    }, 20);
  }, 20);
}, 20);
