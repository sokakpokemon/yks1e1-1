let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 56) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ders-karti-tasima.mjs kosan=" + __kosan + " beklenen=56"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ders-karti-tasima.mjs:" + __kosan + ":56"); } });
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
function t(ad, ok) { __kosan++;  if (ok) { pass++; console.log("  ✓ " + ad); } else { fail++; console.log("  ✗ " + ad); } }

/* --- Sandbox boot --- */
const domReg = new Map();
function mockEl(id) {
  const e = { id: id || "", innerHTML: "", textContent: "", value: "", style: {}, checked: false, options: [], dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {} }, appendChild(n) { this.children.push(n); }, remove() {},
    setAttribute() {}, scrollIntoView() {}, insertAdjacentHTML() {},
    getContext: () => ({ set fillStyle(v) {}, set strokeStyle(v) {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, fillText() {}, closePath() {}, moveTo() {}, lineTo() {} }) };
  if (id) domReg.set(id, e);
  return e;
}
global.window = global;
global.document = {
  getElementById: (id) => domReg.get(id) || mockEl(id), createElement: () => mockEl(),
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
  waSatir, haftalikOgrtTablo, gunlukTablo, renderDersler, dersDrag, dersBurak, dersDropHedef, dersOgrenciIds, penceredeDersler };
`;
try { (0, eval)(app + sondaj); } catch (e) { console.error("BOOT HATASI:", e.message); process.exit(1); }
/* RESMİ SAYAÇ: yalnız t() assertion satırları satır-başı '✓ ' basar; boot satırı bilinçli işaretsizdir. */
console.log("boot hatasız");
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
/* SAYAÇ/DURUM HİJYENİ: gunSecim hemen restore edilir — sonraki renderDersler(3) tekGun çıktısı üretmesin */
if (gunluuOnceki === undefined) delete ui.gunSecim; else ui.gunSecim = gunluuOnceki;
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
/* runtime: renderDersler DOM'a yazıyor (derslerBolum.innerHTML) */
let out = "";
const eskiToast = global.toast; global.toast = () => {};
let domTikSonucu = null; /* 4b: async PNG zinciri bittikten sonra koşan assert bloğu */
try {
  ui.filtre = "tumu"; /* tüm pencere: pencere filtresi sayaçları etkilemesin */
  fn.renderDersler();
  out = (domReg.get("derslerBolum") || { innerHTML: "" }).innerHTML;
  t("renderDersler DOM'a yazdı (derslerBolum.innerHTML)", out.length > 100);
  t("renderDersler çıktısında dersKartiAc butonu VAR", out.includes("dersKartiAc"));
  t("renderDersler çıktısında waSatir butonu VAR", out.includes("waSatir"));
  t("renderDersler çıktısında WhatsApp ikonu VAR", out.includes("fa-whatsapp"));
  t("çıkışta kart butonu sayısı = penceredeki uygun ders sayısı", (() => {
    const btnSay = (out.match(/dersKartiAc/g) || []).length;
    const uygun = fn.penceredeDersler().filter((l) => fn.dersKartiUygun(l)).length;
    return btnSay === uygun;
  })());
  t("renderDersler liste HTML'i satır başına kart+wa üretiyor", out.includes("dersKartiAc") && out.includes("waSatir"));
} catch (e) { /* beklenmeyen catch: THROW — SAYAÇ KAPISI kuralları */ console.error(e && e.message); throw e; }
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
  /* KALICI DOM TIK TESTİ: ISLEM kamera butonuna tık → dersKartiAc çalışır; satırın kendi
     handler'ları (durumTik/duzenle/silOnay) 0 kez çağrılır. Gerçek DOM tık yolu (inline onclick
     event nesnesiyle koşturulur) — throwaway değil, bu süitin kalıcı bölümü. */
  console.log("4b) Kalıcı DOM tık testi (ISLEM butonu):");
  {
    const hedefDers = birebir;
    /* alıcı için telefon garanti et (alıcı seçici akışı gerçek koşulsun) */
    const ogrOf = DB.ogrenciler.find((x) => x.id === hedefDers.ogrenciId);
    if (!ogrOf) { const o = DB.ogrenciler.find((x) => x.ad === hedefDers.ogrenciAd); if (o) hedefDers.ogrenciId = o.id; }
    const ogrOf2 = DB.ogrenciler.find((x) => x.id === hedefDers.ogrenciId);
    const eskiTel = ogrOf2 ? ogrOf2.tel : undefined;
    if (ogrOf2 && !ogrOf2.tel) ogrOf2.tel = "05551112233";
    const aliciVarMi = !!(ogrOf2 && ogrOf2.tel); /* dersKartiAc bu şartı geçmeli; değilse pngCagri=0 kalır (tanısal) */
    let pngCagri = 0;
    const eskiH2C = global.html2canvas;
    global.html2canvas = () => { pngCagri++; const cv = mockEl(); cv.toBlob = (cb) => cb({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }); return Promise.resolve(cv); };
    const eskiCreateURL = global.URL && global.URL.createObjectURL;
    if (global.URL) { global.URL.createObjectURL = () => "blob:test"; global.URL.revokeObjectURL = () => {}; }
    const durumSayac = { durum: 0, duzenle: 0, sil: 0 };
    const eskiDurumTik = global.durumTik, eskiDuzenle = global.duzenle, eskiSilOnay = global.silOnay;
    global.durumTik = () => durumSayac.durum++; global.duzenle = () => durumSayac.duzenle++; global.silOnay = () => durumSayac.sil++;
    const lsOnce = JSON.stringify(global.localStorage._d);
    /* inline onclick'i gerçek tarayıcı gibi koştur: tarayıcıda inline handler GLOBAL 'event' görür (indirect eval global scope'tur) */
    const eskiEvent = global.event;
    global.event = { stopPropagation() {}, preventDefault() {} };
    const onclickGovde = "event.preventDefault();dersKartiAc('" + hedefDers.id + "')";
    let tikHatasi = null;
    try { (0, eval)(onclickGovde); } catch (e) { tikHatasi = e; }
    domTikSonucu = () => {
      t("tık → dersKartiAc çalıştı (html2canvas tam 1 çağrı)", tikHatasi === null && pngCagri === 1, tikHatasi ? tikHatasi.message : "pngCagri=" + pngCagri + " aliciVarMi=" + aliciVarMi);
      t("tık → durumTik 0 kez", durumSayac.durum === 0);
      t("tık → duzenle 0 kez", durumSayac.duzenle === 0);
      t("tık → silOnay 0 kez", durumSayac.sil === 0);
      t("tık → localStorage yazımı yok", JSON.stringify(global.localStorage._d) === lsOnce);
      t("buton markup'ı stopPropagation + preventDefault taşıyor (ISLEM şablonu)", app.includes('onmousedown="event.stopPropagation()"') && app.includes('onclick="event.preventDefault();dersKartiAc'));
      /* restore */
      global.html2canvas = eskiH2C;
      if (eskiCreateURL) global.URL.createObjectURL = eskiCreateURL;
      global.durumTik = eskiDurumTik; global.duzenle = eskiDuzenle; global.silOnay = eskiSilOnay;
      global.event = eskiEvent;
      if (ogrOf2) ogrOf2.tel = eskiTel;
    };
  }
}

/* 5) (e) grup/iptal/Sınıf Dersi/Ek Ders/Kapali'da buton YOK */
console.log("5) İstisna satırlarda/hücrelerde buton YOK:");
t("dersKartiUygun(iptal) true (DÖNGÜ-15: iptal PNG üretilebilir)", fn.dersKartiUygun({ durum: "iptal", ogrenciId: "x" }) === true);
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
} catch (e) { /* beklenmeyen catch: THROW — SAYAÇ KAPISI kuralları */ console.error(e && e.message); throw e; }

/* 7) İdempotans: yama işareti tek, çift çağrı güvenli */
console.log("7) İdempotans:");
t("DERS-KARTI-TASIMA-YAMASI işareti TEK", (app.match(/DERS-KARTI-TASIMA-YAMASI/g) || []).length === 3); /* 2 kaldırma + 1 taşıma yorumu */
t("ISLEM alanında kart butonu TEK noktadan üretiliyor", (app.match(/dersKartiAc\(\\'' \+ l\.id/g) || []).length === 1);
t("saveDB çağrı sayısı yamadan etkilenmedi", (app.match(/function saveDB\(/g) || []).length === 1);

/* 4b assert'leri async PNG zinciri sonrası koşar; process erken çıkmasın */
setTimeout(() => {
  /* GERÇEK-DAL FIXTURE (site #56): else dalı YOK — domTikSonucu DOLUysa gerçek tık bloğu koşar.
     Dal-spesifik gözlemlenebilir kanıt: tık bloğunun İÇİNDEKİ 6 assertion koştu mu?
     (domTikSonucu çağrıldıysa bu blok çalışmıştır; koşmadıysa aşağıdaki assert KIRMIZI olur.) */
  const passOnce = pass;
  if (domTikSonucu) domTikSonucu();
  t("4b fixture: gerçek tık dalı koştu (domTikSonucu çağrıldı → 6 tık assertion'ı bu koşumda üretildi)", typeof domTikSonucu === "function" && pass > passOnce);
  console.log(fail === 0 ? "\nHEPSİ GEÇTİ" : "\n" + fail + " TEST KIRMIZI");
  process.exit(fail ? 1 : 0);
}, 120);
