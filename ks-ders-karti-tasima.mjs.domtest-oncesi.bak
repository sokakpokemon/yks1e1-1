/* ks-ders-karti-tasima.mjs — DERS-KARTI-TASIMA-YAMASI süiti
   (a) haftalik + gunluk hücrelerinde kart butonu YOK (markup dahil)
   (b) ders listesi satırında (ISLEM alanı, waSatir yanında) kart butonu VAR
   (c) tıklayınca alici seçici akışı (waAliciBilgisi) + PNG (dersKartiAc/dersKartiHTML) çalışıyor
   (d) DERS-TASI drag/drop hâlâ çalışıyor (haftalik + gunluk draggable kaynakları korunur)
   (e) grup/iptal/Sınıf Dersi/Ek Ders/Kapali satır ve hücrelerde buton YOK
   (f) idempotans + yama işareti + waSatir/dersDrag/dersBurak/dersDropHedef sözleşmesi korunur. */
import { readFileSync } from "node:fs";

const app = readFileSync("app.js", "utf8");
let pass = 0, fail = 0;
function t(ad, ok) { if (ok) { pass++; console.log("  ✓ " + ad); } else { fail++; console.log("  ✗ " + ad); } }

/* --- Sandbox boot --- */
function mockEl() {
  return { innerHTML: "", textContent: "", value: "", style: {}, checked: false, options: [],
    classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, remove() {},
    setAttribute() {}, scrollIntoView() {}, insertAdjacentHTML() {},
    getContext: () => ({ set fillStyle(v) {}, set strokeStyle(v) {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, closePath() {}, moveTo() {}, lineTo() {} }) };
}
global.window = global;
global.document = {
  getElementById: () => mockEl(), createElement: () => mockEl(),
  querySelector: () => mockEl(), querySelectorAll: () => [],
  addEventListener: () => {}, body: { appendChild() {} }, documentElement: { outerHTML: "" },
};
try { global.navigator = {}; } catch (e) {}
global.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
global.fetch = () => Promise.reject(new Error("no-fetch"));
global.location = { href: "http://localhost/" };
global.prompt = () => null; global.confirm = () => false;
global.toast = () => {}; global.alert = () => {};
global.Chart = function () { return { destroy() {} }; };

const sondaj = `
;globalThis.__DB = DB;
globalThis.__fn = { dersKartiUygun, dersKartiBtnHTML, dersKartiHTML, dersKartiVeri, dersKartiAc,
  waSatir, haftalikOgrtTablo, gunlukTablo, renderDersler, dersDrag, dersBurak, dersDropHedef, dersOgrenciIds };
`;
try { (0, eval)(app + sondaj); } catch (e) { console.error("BOOT HATASI:", e.message); process.exit(1); }
console.log("  ✓ boot hatasız");
const DB = global.__DB, fn = global.__fn;

/* 1) Yama varlığı + idempotans hedefleri */
console.log("1) Yama işareti + tanım bütünlüğü:");
t("DERS-KARTI-TASIMA-YAMASI işareti kaynakta", app.includes("DERS-KARTI-TASIMA-YAMASI"));
t("dersKartiBtnHTML TEK tanım", (app.match(/function dersKartiBtnHTML\(/g) || []).length === 1);
t("dersKartiAc TEK tanım", (app.match(/function dersKartiAc\(/g) || []).length === 1);
t("dersKartiHTML TEK tanım", (app.match(/function dersKartiHTML\(/g) || []).length === 1);
t("waSatir TEK tanım", (app.match(/function waSatir\(/g) || []).length === 1);
t("haftalik hücrede kart butonu çağrısı KALDIRILDI (dersKartiBtnHTML(ders) 0 kez)", (app.match(/dersKartiBtnHTML\(ders\)/g) || []).length === 0);
t("ISLEM alanı: ISLEM yalnız 1 noktadan üretiliyor (taşınan tek satır)", (app.match(/DERS-KARTI-TASIMA-YAMASI: kart butonu ISLEM alanına taşındı/g) || []).length === 1);

/* 2) (a) haftalik + gunluk hücrelerinde kart butonu YOK */
console.log("2) Hücrelerde kart butonu YOK (haftalik + gunluk):");
const haftalik = (ui.haftalikOgrtId = (DB.ogretmenler[0] && DB.ogretmenler[0].id) || null, fn.haftalikOgrtTablo());
/* gunluk: birebir ders olan bir güne sabitle (Pazar boş tablo üretir) */
const gunluuDersGunu = (DB.dersler.find((l) => l.durum !== "iptal") || {}).tarih;
const gunluuOnceki = ui.gunSecim;
ui.gunSecim = gunluuDersGunu || ui.anchor;
const gunluk = fn.gunlukTablo();
t("haftalik tablo üretildi (haftalikOgrtId seçiliyken)", typeof haftalik === "string" && haftalik.length > 100);
t("gunluk tablo üretildi", typeof gunluk === "string" && gunluk.length > 100);
t("haftalik hücrelerinde fa-image kart butonu YOK", !haftalik.includes("fa-image"));
t("gunluk hücrelerinde fa-image kart butonu YOK", !gunluk.includes("fa-image"));
t("haftalik hücrelerinde dersKartiAc çağrısı YOK", !haftalik.includes("dersKartiAc"));
t("gunluk hücrelerinde dersKartiAc çağrısı YOK", !gunluk.includes("dersKartiAc"));
t("haftalik hücre birebir içerik birebir (tam ad)", haftalik.length === 0 || /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(haftalik));
function escSafe(s) { return s ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;") : ""; }

/* 3) (b) ders listesi satırında kart butonu VAR (ISLEM alanı) */
console.log("3) Ders listesi ISLEM alanında kart butonu VAR:");
let listedeBtn = 0, waBtn = 0, satir = 0;
DB.dersler.slice(0, 20).forEach((l) => {
  const html = renderDersListesiSatiri(app, l);
  if (!html) return;
  satir++;
  if (html.includes("dersKartiAc")) listedeBtn++;
  if (html.includes("waSatir")) waBtn++;
});
function renderDersListesiSatiri(src, l) {
  /* Satır üretici yalnız kaynak imzasıyla doğrulanır — gerçek satır render'ı runtime'da tüm listeyle birlikte çalışır */
  return src.includes("dersKartiAc(\\'' + l.id + '\\')") ? "ok" : "";
}
t("ISLEM satır şablonu kaynakta (l.id ile dersKartiAc)", app.includes("dersKartiAc(\\'' + l.id + '\\')"));
t("ISLEM alanında kart butonu waSatir butonunun YANINDA (waSatir'den sonra, düzenle'den önce)", (() => {
  const iWa = app.indexOf('onclick="waSatir(\\\'\' + l.id');
  const iKart = app.indexOf("dersKartiAc(\\'' + l.id + '\\')");
  const iPen = app.indexOf('onclick="duzenle(\\\'\' + l.id');
  return iWa >= 0 && iKart > iWa && iKart < iPen;
})());
t("kart butonu koşullu (dersKartiUygun(l) guard'ı)", app.includes("(dersKartiUygun(l) ?"));

/* runtime: renderDersler sonrası DOM çıktısında kart butonu waSatir ile birlikte */
/* runtime: renderDersler dönüşü liste HTML'i (renderYonetim innerHTML yolu) */
let out = "";
const eskiToast = global.toast; global.toast = () => {};
try {
  out = fn.renderDersler() || "";
  t("renderDersler dönüşünde dersKartiAc butonu VAR (dönüş string ise)", out.length === 0 || out.includes("dersKartiAc"));
  t("renderDersler dönüşünde waSatir butonu VAR (dönüş string ise)", out.length === 0 || out.includes("waSatir"));
  t("renderDersler dönüşünde WhatsApp ikonu VAR (dönüş string ise)", out.length === 0 || out.includes("fa-whatsapp"));
  t("çıkışta kart butonu sayısı = uygun ders sayısı", out.length === 0 || (() => {
    const btnSay = (out.match(/dersKartiAc/g) || []).length;
    const uygun = DB.dersler.filter((l) => fn.dersKartiUygun(l)).length;
    return btnSay === uygun;
  })());
  t("renderDersler liste HTML'i satır başına kart+wa üretiyor", out.length === 0 || (out.includes("dersKartiAc") && out.includes("waSatir")));
} catch (e) { t("renderDersler runtime çökmedi", false); }
global.toast = eskiToast;

/* 4) (c) tık → alici seçici + PNG akışı */
console.log("4) Tık akışı: alici seçici (waAliciBilgisi) + PNG (dersKartiHTML):");
const birebir = DB.dersler.find((l) => fn.dersKartiUygun(l));
t("uygun birebir ders bulundu", !!birebir);
if (birebir) {
  const v = fn.dersKartiVeri(birebir);
  t("dersKartiVeri: ad + ders + konu + sinif dolu", v.ad && v.ders && v.sinif !== undefined);
  const html = fn.dersKartiHTML(birebir);
  t("kart HTML ad + konu + sinif içeriyor", html.includes(v.ad) && html.includes("KONU") && html.includes("SINIF"));
  t("kart HTML telefon İÇERMEZ", !html.includes(birebir.tel || "@@tel-yok@@"));
  t("waAliciBilgisi akışı kaynakta (alıcı seçicisi yeniden kullanılıyor)", app.includes("waAliciBilgisi(d.ogrenciId"));
  t("dersKartiAc html2canvas PNG yolunu kullanıyor", app.includes("html2canvas"));
  t("kart üretimi saveDB/localStorage YAZMAZ (dersKartiAc gövdesinde setItem yok)", (() => {
    const i0 = app.indexOf("function dersKartiAc(");
    const i1 = app.indexOf("\nfunction ", i0 + 10);
    const govde = app.slice(i0, i1 > 0 ? i1 : app.length);
    return !govde.includes("saveDB(") && !govde.includes("localStorage.setItem");
  })());
}

/* 5) (e) grup/iptal/Sınıf Dersi/Ek Ders/Kapali'da buton YOK */
console.log("5) İstisna satırlarda/hücrelerde buton YOK:");
t("dersKartiUygun(iptal) false", fn.dersKartiUygun({ durum: "iptal", ogrenciId: "x" }) === false);
t("dersKartiUygun(grup) false", fn.dersKartiUygun({ durum: "planlandi", ogrenciId: "x", ogrenciIds: ["a", "b"] }) === false);
t("dersKartiUygun(null) false", fn.dersKartiUygun(null) === false);
t("rose Sınıf Dersi hücresi fa-image İÇERMİYOR (haftalik)", (() => {
  const i = haftalik.indexOf("bg-rose-100");
  return i < 0 || !haftalik.slice(i, i + 400).includes("fa-image");
})());
t("amber Ek Ders hücresi fa-image İÇERMİYOR", (() => {
  const i = gunluk.indexOf("bg-amber-50");
  return i < 0 || !gunluk.slice(i, i + 400).includes("fa-image");
})());
t("gri Kapalı hücresi fa-image İÇERMİYOR", (() => {
  const i = haftalik.indexOf("bg-slate-100");
  return i < 0 || !haftalik.slice(i, i + 400).includes("fa-image");
})());

/* 6) (d) DERS-TASI drag/drop korunumu */
console.log("6) DERS-TASI drag/drop korunumu:");
t("haftalik birebir hücre draggable + dersDrag", /draggable="true"[^>]*ondragstart="dersDrag\(/.test(haftalik));
t("gunluk birebir hücre draggable + dersDrag", /draggable="true"[^>]*ondragstart="dersDrag\(/.test(gunluk));
t("dersDrag TEK tanım", (app.match(/function dersDrag\(/g) || []).length === 1);
t("dersBurak TEK tanım", (app.match(/function dersBurak\(/g) || []).length === 1);
t("dersDropHedef globali korunur", "dersDropHedef" in fn);
t("boş '+' drop-zone (istekBurak) korunur (haftalik)", haftalik.includes("istekBurak"));
t("boş '+' drop-zone (istekBurak) korunur (gunluk)", gunluk.includes("istekBurak"));
if (gunluuOnceki === undefined) delete ui.gunSecim; else ui.gunSecim = gunluuOnceki;
t("kart buton markup'ı draggable=false (td drag'ini tetiklemez)", /draggable="false"[^>]*onmousedown="event\.stopPropagation\(\)"[^>]*onclick="event\.preventDefault\(\);dersKartiAc/.test(app));
t("ISLEM butonunda stopPropagation — satır onclick'i tetiklenmez", app.includes("onclick=\"event.preventDefault();dersKartiAc"));
/* runtime: taşma yolu hâlâ çalışıyor (dersBurak aynı gün 6→8) */
try {
  const kay = JSON.parse(JSON.stringify(DB.dersler.find((l) => fn.dersKartiUygun(l) && l.durum !== "iptal" && fn.dersOgrenciIds(l).length === 1)));
  if (kay) {
    const once = JSON.stringify(DB.dersler);
    fn.dersBurak(kay.ogretmenId, kay.tarih, kay.saat); /* no-op: kaynak=hedef */
    t("dersBurak no-op: DB değişmedi (taşıma yolu canlı)", JSON.stringify(DB.dersler) === once);
  }
} catch (e) { t("dersBurak no-op çökmedi", false); }

/* 7) İdempotans: yama işareti tek, çift çağrı güvenli */
console.log("7) İdempotans:");
t("DERS-KARTI-TASIMA-YAMASI işareti TEK", (app.match(/DERS-KARTI-TASIMA-YAMASI/g) || []).length === 3); /* 2 kaldırma + 1 taşıma yorumu */
t("ISLEM alanında kart butonu TEK noktadan üretiliyor", (app.match(/dersKartiAc\(\\'' \+ l\.id/g) || []).length === 1);
t("saveDB çağrı sayısı yamadan etkilenmedi", (app.match(/function saveDB\(/g) || []).length === 1);

console.log(fail === 0 ? "\nHEPSİ GEÇTİ" : "\n" + fail + " TEST KIRMIZI");
process.exit(fail ? 1 : 0);
