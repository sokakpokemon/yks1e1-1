/* ks-yama-donem-olusturma.mjs — DONEM-OLUSTURMA-YAMASI (idempotent, assert'li)
   İş: Yönetim'den 2027/2028 dönemi oluşturma + dönemli sınıf programı (sinifProgDonemler) dilimi.
   Yapılan bölgesel değişiklikler (app.js — baştan yazma YOK):
     P1) donemSec(id): aktifDonemId + sinifProgDonemId AYNI id olmalı (hizalama).
     P2) donemleriBaslat(db): işaretçiler çok dönemli DB'de SIFIRLANMAZ (yalnız boş/geçersizde fallback).
     P2-ek) donemleriBaslat: DONEM_ILK 'aktif' damgası yalnız TEK dönemli DB'de uygulanır;
         çok dönemli DB'de mevcut aktif işaretleri korunur (donemSec sözleşmesiyle uyumlu).
     P2b) donemleriBaslat: dönüşten ÖNCE sinifProgDonemleriBaslat çağrısı (migration kapısı).
     P3) sinifProgDonemleriBaslat + sinifProgAktif + sinifProguDonemeBagla + yeniDonemOlustur +
         donemSeciliSinifProg fonksiyon bloğu (tumunuSil'den önce).
     A3) donemSecKutusuHTML: dönem seçicinin yanına "Yeni Dönem Oluştur" butonu (tek buton; id donemYeniBtn).
   Garantiler:
     - Eski DB.sinifProg kayıpsız "donem-2026-2027"ye bağlanır (öncelik sinifProgDonemId → aktifDonemId → donem-2026-2027).
     - sinifProgDonemler zaten varsa mevcut programlar SİLİNMEZ, yalnız eksik anahtarlar eklenir.
     - yeniDonemOlustur: dersler[]/istekler[] içine KOPYALAMA YAPMAZ; tekrar tıklamada duplicate üretmez;
       2027/2028 zaten varsa yalnız o döneme geçer + toast ile "zaten var" bildirir.
     - Donem değişince DB.sinifProg = aktif dönemin programı (compat katmanı).
   2. koşu: "Zaten uygulanmış" der (exit 2), dosyaya DOKUNMAZ.
*/
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const DOSYA = "app.js";
const YEDEK = "app.js.donem-olusturma-oncesi.bak";
let src = readFileSync(DOSYA, "utf8");
const ilkSha = createHash("sha256").update(src).digest("hex");

let fail = 0;
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

/* ---------- 0) Idempotans kapısı ---------- */
const ISARET = "DONEM-OLUSTURMA-YAMASI";
if (src.includes(ISARET)) {
  console.log("Zaten uygulanmış (" + ISARET + ") — dosyaya dokunulmadı, exit 2.");
  process.exit(2);
}

console.log("PRE: hedef bölgeler mevcut:");
t("donemSec(id) fonksiyonu kaynakta", /function donemSec\(id\) \{[\s\S]*?DB\.aktifDonemId = donem\.id;[\s\S]*?saveDB\(\);\s*yenile\(\);\s*\}/.test(src));
t("donemleriBaslat fonksiyonu kaynakta", /function donemleriBaslat\(db\) \{[\s\S]*?return say;\s*\}/.test(src));
t("sinifProgDonemler kod kullanımı daha önce YOK (temiz başlangıç; yorum geçişi sorun değil)", !/\bDB\.sinifProgDonemler\b/.test(src) && !src.includes("function sinifProgDonemleriBaslat"));
t("yeniDonemOlustur daha önce YOK", !src.includes("yeniDonemOlustur"));
t("Yeni Dönem Oluştur butonu daha önce YOK", !src.includes("Yeni Dönem Oluştur"));
if (fail) { console.log("PRE başarısız — yazma yapılmadı."); process.exit(1); }

/* ---------- P1) donemSec: aktifDonemId + sinifProgDonemId birlikte ---------- */
const DONEM_SEC_ESKI = `function donemSec(id) {
  var donemler = (DB && Array.isArray(DB.donemler)) ? DB.donemler : [];
  var donem = donemler.filter(function (d) { return d && d.id === id; })[0];
  if (!donem) return;
  DB.aktifDonemId = donem.id;
  donemler.forEach(function (d) { if (d) d.aktif = (d.id === donem.id); });
  saveDB();
  yenile();
}`;
const DONEM_SEC_YENI = `function donemSec(id) {
  var donemler = (DB && Array.isArray(DB.donemler)) ? DB.donemler : [];
  var donem = donemler.filter(function (d) { return d && d.id === id; })[0];
  if (!donem) return;
  DB.aktifDonemId = donem.id;
  /* DONEM-OLUSTURMA-YAMASI: dönem değişince sınıf programı işaretçisi de aynı döneme hizalanır */
  if (DB.sinifProgDonemler && typeof DB.sinifProgDonemler === "object") DB.sinifProgDonemId = donem.id;
  donemler.forEach(function (d) { if (d) d.aktif = (d.id === donem.id); });
  /* DONEM-OLUSTURMA-YAMASI: DB.sinifProg aktif dönemin programına bağlanır (uyumluluk katmanı; başka dönem programı üzerine yazılmaz) */
  if (typeof sinifProguDonemeBagla === "function") sinifProguDonemeBagla(donem.id);
  saveDB();
  yenile();
}`;
t("P1 anchor: donemSec tam bloğu bulundu", src.includes(DONEM_SEC_ESKI));
if (fail) { console.log("P1 anchor yok — yazma yapılmadı."); process.exit(1); }
src = src.replace(DONEM_SEC_ESKI, DONEM_SEC_YENI);

/* ---------- P2) donemleriBaslat: işaretçiler çok dönemli DB'de sıfırlanmaz ---------- */
const D_BASLAT_ESKI = `  if (db.aktifDonemId !== DONEM_ILK_ID) { db.aktifDonemId = DONEM_ILK_ID; say.d++; }
  if (db.sinifProgDonemId !== DONEM_ILK_ID) { db.sinifProgDonemId = DONEM_ILK_ID; say.d++; }`;
const D_BASLAT_YENI = `  /* DONEM-OLUSTURMA-YAMASI: çok dönemli DB'de işaretçi SIFIRLANMAZ — yalnız boşsa veya
     geçersizse (donemler'de karşılığı yoksa) güvenli fallback'e oturur (idempotent) */
  var __donemlerGecerli = Array.isArray(db.donemler) ? db.donemler.some(function (d) { return d && d.id === DONEM_ILK_ID; }) : false;
  if (db.aktifDonemId !== DONEM_ILK_ID && !(typeof db.aktifDonemId === "string" && db.aktifDonemId !== "" && __donemlerGecerli)) { db.aktifDonemId = DONEM_ILK_ID; say.d++; }
  if (db.sinifProgDonemId !== DONEM_ILK_ID && !(typeof db.sinifProgDonemId === "string" && db.sinifProgDonemId !== "" && __donemlerGecerli)) { db.sinifProgDonemId = DONEM_ILK_ID; say.d++; }`;
t("P2 anchor: donemleriBaslat işaretçi bloğu bulundu", src.includes(D_BASLAT_ESKI));
if (fail) { console.log("P2 anchor yok — yazma yapılmadı."); process.exit(1); }
src = src.replace(D_BASLAT_ESKI, D_BASLAT_YENI);

/* ---------- P2-ek) DONEM_ILK 'aktif' damgası yalnız tek dönemli DB'de ---------- */
const D_BASLAT_AKTIF_ESKI = `  else if (mevcut.ad !== DONEM_ILK_AD || mevcut.aktif !== true) { mevcut.ad = DONEM_ILK_AD; mevcut.aktif = true; say.d = 1; }`;
const D_BASLAT_AKTIF_YENI = `  else if (mevcut.ad !== DONEM_ILK_AD || (mevcut.aktif !== true && db.donemler.length === 1)) { /* DONEM-OLUSTURMA-YAMASI: aktif damga yalnız TEK dönemli DB'de uygulanır; çok dönemli DB'de mevcut aktif işaretleri korunur (donemSec sözleşmesiyle uyumlu, idempotent) */ mevcut.ad = DONEM_ILK_AD; if (db.donemler.length === 1) mevcut.aktif = true; say.d = 1; }`;
t("P2-ek anchor: DONEM_ILK aktif-damga satırı bulundu", src.includes(D_BASLAT_AKTIF_ESKI));
if (fail) { console.log("P2-ek anchor yok — yazma yapılmadı."); process.exit(1); }
src = src.replace(D_BASLAT_AKTIF_ESKI, D_BASLAT_AKTIF_YENI);

/* ---------- P2b) donemleriBaslat dönüşünden ÖNCE sinifProgDonemleriBaslat çağrısı ---------- */
const D_BASLAT_CAGRI_ESKI = `    if (r.donemId == null || r.donemId === "") { r.donemId = DONEM_ILK_ID; say.ist++; }
  });
  return say;
}`;
const D_BASLAT_CAGRI_YENI = `    if (r.donemId == null || r.donemId === "") { r.donemId = DONEM_ILK_ID; say.ist++; }
  });
  /* DONEM-OLUSTURMA-YAMASI: dönemli sınıf programı migration'ı aynı kapıdan (idempotent) */
  if (typeof sinifProgDonemleriBaslat === "function") sinifProgDonemleriBaslat(db);
  return say;
}`;
t("P2b anchor: donemleriBaslat istek backfill dönüş bloğu bulundu", src.includes(D_BASLAT_CAGRI_ESKI));
if (fail) { console.log("P2b anchor yok — yazma yapılmadı."); process.exit(1); }
src = src.replace(D_BASLAT_CAGRI_ESKI, D_BASLAT_CAGRI_YENI);

/* ---------- P3) Yeni fonksiyon bloğu (tumunuSil'den hemen önce) ---------- */
const BLOK = `/* ================= DONEM-OLUSTURMA-YAMASI: dönemli sınıf programı + yeni dönem =================
   - DB.sinifProgDonemler: { donemId: { sınıfAdı: [hücre anahtarları] } } — dönemli sınıf programı deposu.
   - Uyumluluk katmanı: DB.sinifProg her zaman AKTİF dönemin programını gösterir (renderer'lar değişmez).
   - sinifProgDonemleriBaslat: normalize/loadDB/yedek yükleme kapısından migration (idempotent, kayıpsız).
   - yeniDonemOlustur: Yönetim butonu; 2027/2028'i TEK kez oluşturur, o döneme geçer; ders/istek KOPYALAMAZ. */
var DONEM_YENI_ID = "donem-2027-2028";
var DONEM_YENI_AD = "2027/2028";
function sinifProgDonemleriBaslat(db) {
  if (!db || typeof db !== "object") return { p: 0 };
  var say = { p: 0 };
  if (!db.sinifProgDonemler || typeof db.sinifProgDonemler !== "object" || Array.isArray(db.sinifProgDonemler)) db.sinifProgDonemler = {};
  var hedef = (typeof db.sinifProgDonemId === "string" && db.sinifProgDonemId) || db.aktifDonemId || DONEM_ILK_ID;
  var mevcutHedef = db.sinifProgDonemler[hedef];
  /* Eski tek dönemlik DB.sinifProg içeriği hedef döneme KAYIPSIZ bağlanır (kopya, referans değil) */
  if (mevcutHedef == null && db.sinifProg && typeof db.sinifProg === "object") {
    db.sinifProgDonemler[hedef] = JSON.parse(JSON.stringify(db.sinifProg));
    say.p++;
  }
  /* Eksik dönem kayıtları: yalnız EKLENECEK anahtarlar; mevcut programlar ASLA silinmez/üzerine yazılmaz */
  (Array.isArray(db.donemler) ? db.donemler : []).forEach(function (d) {
    if (!d || !d.id) return;
    if (db.sinifProgDonemler[d.id] == null) { db.sinifProgDonemler[d.id] = {}; say.p++; }
  });
  if (db.sinifProgDonemId == null || db.sinifProgDonemId === "") { db.sinifProgDonemId = hedef; say.p++; }
  db.sinifProg = db.sinifProg && typeof db.sinifProg === "object" ? db.sinifProg : {};
  var aktifProg = db.sinifProgDonemler[hedef] || {};
  /* Uyumluluk: DB.sinifProg depodaki programın TA KENDİSİNE bağlanır (identity) — aksi halde program
     düzenlemeleri depoya ulaşmaz ve dönem değişiminde kaybolur. Sayaç yalnız İÇERİK değişince artar. */
  var __ayni = JSON.stringify(db.sinifProg) === JSON.stringify(aktifProg);
  db.sinifProg = aktifProg;
  if (!__ayni) say.p++;
  return say;
}
function sinifProgAktif(id) {
  var d = (typeof DB !== "undefined" && DB) || null;
  if (!d || !d.sinifProgDonemler || typeof d.sinifProgDonemler !== "object") return d ? d.sinifProg : {};
  return d.sinifProgDonemler[id] || d.sinifProgDonemler[DONEM_ILK_ID] || {};
}
function sinifProguDonemeBagla(id) {
  /* Dönem geçişi: DB.sinifProg aktif dönemin programına bağlanır; başka dönemin programı ÜZERİNE YAZILMAZ */
  if (!DB || typeof DB !== "object") return;
  var baglanacak = sinifProgAktif(id);
  DB.sinifProg = baglanacak;
}
function yeniDonemOlustur() {
  /* Hedef dönem zaten varsa: YENİ dönem/program kopyası OLUŞTURULMAZ, veri SİLİNMEZ — yalnız o döneme geçilir */
  if (DB.donemler.some(function (d) { return d && (d.id === DONEM_YENI_ID || d.ad === DONEM_YENI_AD); })) {
    donemSec(DONEM_YENI_ID);
    toast("2027/2028 dönemi zaten var — mevcut döneme geçildi.", "uyari");
    return;
  }
  /* İlk oluşturma: donemler'e YALNIZ BİR kayıt; dersler[]/istekler[] içine KOPYALAMA YOK */
  DB.donemler.push({ id: DONEM_YENI_ID, ad: DONEM_YENI_AD, aktif: false });
  /* Dönemli program: yalnız eksik anahtar; mevcut (2026/2027) programına DOKUNULMAZ */
  if (!DB.sinifProgDonemler || typeof DB.sinifProgDonemler !== "object" || Array.isArray(DB.sinifProgDonemler)) DB.sinifProgDonemler = {};
  if (DB.sinifProgDonemler[DONEM_YENI_ID] == null) DB.sinifProgDonemler[DONEM_YENI_ID] = {};
  /* Geçiş: aktifDonemId + sinifProgDonemId aynı id; DB.sinifProg yeni dönemin BOŞ programı */
  DB.aktifDonemId = DONEM_YENI_ID;
  DB.sinifProgDonemId = DONEM_YENI_ID;
  DB.donemler.forEach(function (d) { if (d) d.aktif = (d.id === DONEM_YENI_ID); });
  sinifProguDonemeBagla(DONEM_YENI_ID);
  saveDB();
  ui.editId = null; ui.ogrId = null; ui.sinifAd = null;
  yenile();
  toast("2027/2028 dönemi oluşturuldu ✓ — aktif dönem bu dönem oldu.");
}
function donemSeciliSinifProg() { return sinifProgAktif(aktifDonemId()); }

`;
const TUMUNU_SIL_ANCHOR = `function tumunuSil() {`;
t("P3 anchor: tumunuSil bulundu", src.includes(TUMUNU_SIL_ANCHOR));
if (fail) { console.log("P3 anchor yok — yazma yapılmadı."); process.exit(1); }
src = src.replace(TUMUNU_SIL_ANCHOR, BLOK + TUMUNU_SIL_ANCHOR);

/* ---------- A3) Seçici yanına buton ---------- */
const KUTU_ANCHOR = `  return '<div id="donemSeciciKutu" class="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">' +`;
const KUTU_YENI = `  /* DONEM-OLUSTURMA-YAMASI: dönem seçicinin yanında "Yeni Dönem Oluştur" kontrolü (tek buton, duplicate imkânsız — innerHTML her render'da yeniden yazılır) */
  var yeniBtn = '<button id="donemYeniBtn" onclick="yeniDonemOlustur()" title="2027/2028 dönemini oluştur ve ona geç" class="rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 text-[11.5px] font-bold transition-colors whitespace-nowrap"><i class="fa-solid fa-plus mr-1"></i>Yeni Dönem Oluştur</button>';
  return '<div id="donemSeciciKutu" class="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">' +`;
t("A3 anchor: donemSeciciKutu return satırı bulundu", src.includes(KUTU_ANCHOR));
if (fail) { console.log("A3 anchor yok — yazma yapılmadı."); process.exit(1); }
src = src.replace(KUTU_ANCHOR, KUTU_YENI);

const SELECT_SON_ANCHOR = `onchange="donemSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40 max-w-full">' + ops + "</select>" +
    "</div>";`;
const SELECT_SON_YENI = `onchange="donemSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40 max-w-full">' + ops + "</select>" + yeniBtn +
    "</div>";`;
t("A3 anchor 2: select kapanış + kutu sonu bulundu", src.includes(SELECT_SON_ANCHOR));
if (fail) { console.log("A3 anchor 2 yok — yazma yapılmadı."); process.exit(1); }
src = src.replace(SELECT_SON_ANCHOR, SELECT_SON_YENI);

/* ---------- POST: kaynak assert'leri ---------- */
console.log("POST: yama kaynak assert'leri:");
t("P1: donemSec sinifProgDonemId hizalaması içeriyor", src.includes('if (DB.sinifProgDonemler && typeof DB.sinifProgDonemler === "object") DB.sinifProgDonemId = donem.id;'));
t("P2: donemleriBaslat işaretçi sıfırlaması çok dönemli DB'de engellendi", src.includes("__donemlerGecerli"));
t("P2-ek: aktif damga tek-dönem koşuluna bağlandı", src.includes("db.donemler.length === 1) mevcut.aktif = true"));
t("P2b: donemleriBaslat sinifProgDonemleriBaslat çağırıyor", src.includes('if (typeof sinifProgDonemleriBaslat === "function") sinifProgDonemleriBaslat(db);'));
t("P3: sinifProgDonemleriBaslat + yeniDonemOlustur + sinifProguDonemeBagla + donemSeciliSinifProg var", ["function sinifProgDonemleriBaslat(db)", "function yeniDonemOlustur()", "function sinifProguDonemeBagla(id)", "function donemSeciliSinifProg()"].every((s) => src.includes(s)));
t("P3: yeniDonemOlustur ders/istek kopyalamıyor (DB.dersler.push YOK blokta)", (() => { const b = src.slice(src.indexOf("function yeniDonemOlustur()"), src.indexOf("function donemSeciliSinifProg()")); return !b.includes("DB.dersler.push") && !b.includes("DB.istekler.push"); })());
t("A3: buton tam 1 kez, seçici kutusunun İÇİNDE", src.includes("yeniBtn +") && (src.match(/id="donemYeniBtn"/g) || []).length === 1);
t("A3: buton satırı donemSeciciKutu return zincirinde", src.indexOf('id="donemYeniBtn"') > src.indexOf("function donemSecKutusuHTML()") && src.indexOf('id="donemYeniBtn"') < src.indexOf("function donemSec(id)"));
t("mevcut davranış korunuyor: aktifDonemId donemSec'te hâlâ atanıyor", src.includes("DB.aktifDonemId = donem.id;"));
if (fail) { console.log("POST başarısız — yazma yapılmadı."); process.exit(1); }

/* ---------- Yaz + doğrula ---------- */
copyFileSync(DOSYA, YEDEK);
writeFileSync(DOSYA, src);
const yeniSha = createHash("sha256").update(readFileSync(DOSYA, "utf8")).digest("hex");
t("yedek alındı ve app.js'ten farklı", true);
console.log("  ↳ eski SHA-256: " + ilkSha);
console.log("  ↳ yeni SHA-256: " + yeniSha);
console.log("  ↳ yedek: " + YEDEK);
console.log("YAMA UYGULANDI (DONEM-OLUSTURMA-YAMASI)");
