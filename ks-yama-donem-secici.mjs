/* ks-yama-donem-secici.mjs — DÖNEM SEÇİCİ + AKTİF DÖNEM FİLTRESİ yaması v2 (assert'li, idempotent)
 * TEK İŞ: 2026/2027 dönem seçici (yönetim üst bölümü) + aktif döneme göre 4 görünüm filtresi.
 * Değişen: yalnızca app.js (bölgesel) + test.mjs (yeni süit kaydı). ek-ders.js DOKUNULMAZ.
 *
 * v2 (bu sürüm) v1'e göre iki düzeltme içerir:
 *  1) Seçici enjeksiyonu: v1 insertAdjacentHTML("afterbegin") + hemen ardından innerHTML yazımı
 *     hem gerçek DOM'da kutuyu her render'da siliyordu hem de eski DOM enjeksiyon sayaç testlerini
 *     bozuyordu. v2 seçiciyi renderYonetim'in innerHTML çıktısının BAŞINA gömer: her render'da tam
 *     1 kutu (duplicate imkânsız), insertAdjacentHTML çağrısı YOK, kutu asla kaybolmaz.
 *  2) Filtre katmanı non-mutating uyumluluk: donemId'siz ESKİ kayıtlar (boot sonrası eklenen /
 *     yedekten gelen) mevcut DONEM-ILK kuralıyla "donem-2026-2027" KABUL edilir; hiçbir kayıt
 *     yerinde değiştirilmez, mevcut donemId ASLA üzerine yazılmaz.
 *
 * Çalışma yolları:
 *  - app.js'de DONEM-SECICI-V2 varsa → "Zaten uygulanmış" (exit 2), dosyalara DOKUNMAZ.
 *  - app.js'de DONEM-SECICI-YAMASI (v1) varsa → v1→v2 göç (assert'li, bölgesel replace).
 *  - hiçbiri yoksa (taze ağaç) → tam v2 uygulaması (assert'li, tek yazma).
 *
 * Kurallar: ogrenciler/ogretmenler/sinifIds GLOBAL kalır; kayıt referansları ve donemId değerleri
 * değişmez; normalize/donemleriBaslat/aktifDonemId/yedek mantığı gereksiz değişmez.
 */
import { readFileSync, writeFileSync } from "node:fs";

const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };
const assert = (c, m) => { if (!c) fail(m); else console.log("  OK " + m); };
const say = (hay, need) => hay.split(need).length - 1;

/* ---------- v2 ortak içerik parçaları ---------- */
/* Filtre katmanı (non-mutating uyumluluklu) */
const KATMAN = `/* DONEM-SECICI-YAMASI: dönem seçici + aktif dönem filtre katmanı.
   Tek güvenilir filtre kuralı: record.donemId === DB.aktifDonemId (donemId'siz ESKİ kayıt = "donem-2026-2027").
   ogrenciler/ogretmenler/sinifIds GLOBAL kalır; bu katman onlara DOKUNMAZ.
   Geçersiz/eksik aktifDonemId → güvenli fallback "donem-2026-2027". */
function aktifDonemKayitlari(dizi) {
  if (!Array.isArray(dizi)) return [];
  var hedef = aktifDonemId();
  /* DONEM-SECICI-V2: donemId'siz ESKİ kayıtlar (boot sonrası eklenen/yedekten gelen) mevcut DONEM-ILK
     uyumluluk kuralıyla aynı kabul edilir: boş donemId = "donem-2026-2027". Non-mutating: hiçbir kayıt
     yerinde değiştirilmez, mevcut donemId değerleri ASLA üzerine yazılmaz. */
  return dizi.filter(function (r) { return r && (r.donemId || DONEM_ILK_ID) === hedef; });
}`;
/* renderYonetim kuyruğu (v2: seçici kart başına gömülü) */
const RY_V2 = `  /* DONEM-SECICI-V2: dönem seçici yönetim kartının İÇİNE, başa gömülür — innerHTML her render'da
     yeniden yazılırken seçici de AYNI TEK kutu olarak yeniden üretilir: duplicate imkânsız,
     insertAdjacentHTML YOK (eski DOM enjeksiyon sayaçları bozulmaz), kutu asla kaybolmaz. */
  $("yonetimBolum").innerHTML = '<div class="kart p-5">' + donemSecKutusuHTML() + '<div class="flex flex-wrap items-center justify-between gap-3 mb-5">' +
    '<h2 class="text-[15px] font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-sliders text-slate-300"></i> Veri Yönetimi ve Program Tanımlama</h2>' + pills + "</div>" + icerik + "</div>";`;

/* ================= app.js ================= */
const F = "app.js";
const src0 = readFileSync(F, "utf8");

/* --- idempotans: v2 zaten uygulanmışsa çık (exit 2), dosyalara DOKUNMA --- */
if (src0.includes("DONEM-SECICI-V2")) {
  console.error("Zaten uygulanmış (DONEM-SECICI-V2 mevcut) — dosyalar değiştirilmedi.");
  process.exit(2);
}
const v1Applied = src0.includes("DONEM-SECICI-YAMASI");

let out;
if (v1Applied) {
  /* ============ YOL 1: v1 → v2 göç (bölgesel, assert'li) ============ */
  console.log("v1 tespit edildi → v1→v2 göç uygulanıyor...");

  /* G1: renderYonetim enjeksiyonu — v1 guard bloğu + innerHTML → v2 gömülü seçici */
  const G1 = `  /* DONEM-SECICI-YAMASI: yönetim alanının üst bölümünde dönem seçici — renderYonetim tekrarlandığında
     ikinci kez OLUŞTURULMAZ (idempotent DOM guard); kutu bulunamazsa app çökmez (null-safe). */
  var donemKutu = $("donemSeciciKutu");
  if (!donemKutu && $("yonetimBolum") && $("yonetimBolum").insertAdjacentHTML) {
    $("yonetimBolum").insertAdjacentHTML("afterbegin", donemSecKutusuHTML());
  }
  $("yonetimBolum").innerHTML = '<div class="kart p-5"><div class="flex flex-wrap items-center justify-between gap-3 mb-5">' +
    '<h2 class="text-[15px] font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-sliders text-slate-300"></i> Veri Yönetimi ve Program Tanımlama</h2>' + pills + "</div>" + icerik + "</div>";`;
  assert(say(src0, G1) === 1, "v2-G1: v1 renderYonetim enjeksiyon bloğu exact 1 kez");

  /* H1: filtre katmanı — v1 gövde → non-mutating uyumluluk */
  const H1 = `function aktifDonemKayitlari(dizi) {
  if (!Array.isArray(dizi)) return [];
  var hedef = aktifDonemId();
  return dizi.filter(function (r) { return r && r.donemId === hedef; });
}`;
  assert(say(src0, H1) === 1, "v2-H1: v1 aktifDonemKayitlari gövdesi exact 1 kez");

  out = src0.replace(G1, RY_V2).replace(H1, KATMAN.replace("/* DONEM-SECICI-YAMASI: dönem seçici + aktif dönem filtre katmanı.\n   Tek güvenilir filtre kuralı: record.donemId === DB.aktifDonemId (donemId'siz ESKİ kayıt = \"donem-2026-2027\").", "/* DONEM-SECICI-YAMASI: dönem seçici + aktif dönem filtre katmanı.\n   Tek güvenilir filtre kuralı: record.donemId === DB.aktifDonemId."));

  /* --- göç sonrası doğrulamalar (yazmadan ÖNCE) --- */
  assert(say(out, "DONEM-SECICI-V2") >= 2, "v2-sonuç: DONEM-SECICI-V2 işareti tam yerinde (>=2)");
  assert(say(out, '$("yonetimBolum").insertAdjacentHTML') === 0, "v2-sonuç: yonetimBolum'a insertAdjacentHTML KALMADI");
  assert(say(out, "var donemKutu") === 0, "v2-sonuç: eski DOM guard bloğu kalktı");
  assert(say(out, "'<div class=\"kart p-5\">' + donemSecKutusuHTML()") === 1, "v2-sonuç: seçici kart başına gömülü (tam 1 yerde)");
  assert(say(out, "(r.donemId || DONEM_ILK_ID) === hedef") === 1, "v2-sonuç: non-mutating uyumluluk predikatı tam 1 yerde");
  assert(say(out, "r.donemId === hedef") === 0, "v2-sonuç: eski katı predikat kalktı");
  assert(say(out, "function aktifDonemKayitlari(") === 1, "v2-sonuç: aktifDonemKayitlari hâlâ tam 1 kez");
  assert(say(out, "donemSecKutusuHTML()") === 2, "v2-sonuç: donemSecKutusuHTML tanım+çağrı tam 2 kez");
  assert(say(out, "function donemSec(id)") === 1, "v2-sonuç: donemSec DOKUNULMADI");
  assert(say(out, "function penceredeDersler()") === 1, "v2-sonuç: penceredeDersler DOKUNULMADI");
  assert(say(out, "function normalize(d)") === 1, "v2-sonuç: normalize DOKUNULMADI");
  assert(say(out, "donemId: aktifDonemId()") === 4, "v2-sonuç: DONEM-DAMGA kayıt noktaları aynen (4)");
  assert(out.length !== src0.length, "v2-sonuç: göç bölgesel değişiklik yaptı");
} else {
  /* ============ YOL 2: taze ağaç → tam v2 uygulaması (assert'li) ============ */
  console.log("Taze ağaç → tam v2 uygulaması...");

  /* ---------- Beklenen mevcut durum (exact, tek geçişli hedefler) ---------- */
  assert(say(src0, "function aktifDonemId()") === 1, "app.js: aktifDonemId() tam 1 kez");
  assert(say(src0, "function donemleriBaslat(db)") === 1, "app.js: donemleriBaslat tam 1 kez");
  assert(say(src0, 'var DONEM_ILK_ID = "donem-2026-2027"') === 1, "app.js: DONEM_ILK_ID sabiti tam 1 kez");
  assert(say(src0, "function penceredeDersler()") === 1, "app.js: penceredeDersler tam 1 kez");
  assert(say(src0, "function haftalikOgrtTablo()") === 1, "app.js: haftalikOgrtTablo tam 1 kez");
  assert(say(src0, "function gunlukTablo()") === 1, "app.js: gunlukTablo tam 1 kez");
  assert(say(src0, "function renderHavuz()") === 1, "app.js: renderHavuz tam 1 kez");
  assert(say(src0, "function renderYonetim()") === 1, "app.js: renderYonetim tam 1 kez");
  assert(say(src0, "function yenile()") === 1, "app.js: yenile tam 1 kez");
  assert(say(src0, "DONEM-SECICI") === 0, "app.js: yama henüz YOK (temiz başlangıç)");
  assert(say(src0, "function donemSecKutusuHTML()") === 0, "app.js: donemSecKutusuHTML henüz yok");
  assert(say(src0, "function donemSec(id)") === 0, "app.js: donemSec henüz yok");
  assert(say(src0, "function aktifDonemKayitlari(") === 0, "app.js: aktifDonemKayitlari henüz yok");

  /* ---------- YAMA A+B+C: yardımcılar — aktifDonemId()'nin HEMEN ARDINA ekle ---------- */
  const A1 = `/* DONEM-DAMGA-YAMASI: yeni kayıt damgası için güvenli aktif dönem ID'si.`;
  const iA1 = src0.indexOf(A1);
  assert(iA1 !== -1, "A: aktifDonemId yorum anchor bulundu");
  assert(src0.indexOf("function yenile()") !== -1, "A: yenile() mevcut");
  assert(src0.indexOf("function renderYonetim()") !== -1, "A: renderYonetim() mevcut");

  const YENI_YARDIMCILAR = KATMAN + `
/* Dönem seçici: DB.donemler[]'den beslenir; value = dönem id; açılışta DB.aktifDonemId seçili.
   DB.donemler boş/eksikse mevcut dönem uyumluluk katmanı BOZULMAZ: yalnız "donem-2026-2027"
   güvenli şekilde kullanılır (seçici tek seçenek). Null-safe: kutu DOM'da yoksa hiçbir şey yapmaz. */
function donemSecKutusuHTML() {
  var donemler = (DB && Array.isArray(DB.donemler) && DB.donemler.length) ? DB.donemler : [{ id: DONEM_ILK_ID, ad: "2026/2027", aktif: true }];
  var secili = aktifDonemId();
  if (!donemler.some(function (d) { return d && d.id === secili; })) secili = donemler[0].id;
  var ops = donemler.map(function (d) {
    if (!d || !d.id) return "";
    return '<option value="' + esc(d.id) + '"' + (d.id === secili ? " selected" : "") + ">" + esc(d.ad || d.id) + "</option>";
  }).join("");
  return '<div id="donemSeciciKutu" class="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">' +
    '<span class="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap"><i class="fa-solid fa-layer-group mr-1"></i>Dönem</span>' +
    '<select id="donemSecici" onchange="donemSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40 max-w-full">' + ops + "</select>" +
    "</div>";
}
/* Dönem değişimi: DB.aktifDonemId güncellenir, aktif işaretleri hizalanır, saveDB + yenile.
   Geçersiz id gelirse sessizce yoksayılır (fallback: mevcut aktif dönem aynen kalır). */
function donemSec(id) {
  var donemler = (DB && Array.isArray(DB.donemler)) ? DB.donemler : [];
  var donem = donemler.filter(function (d) { return d && d.id === id; })[0];
  if (!donem) return;
  DB.aktifDonemId = donem.id;
  donemler.forEach(function (d) { if (d) d.aktif = (d.id === donem.id); });
  saveDB();
  yenile();
}

`;

  /* ---------- YAMA D1: penceredeDersler → ders listesi/günlük/haftalık ortak kaynağı ---------- */
  const B1 = `function penceredeDersler() {
  var p = pencere();
  var liste = DB.dersler.filter(function (l) {
    if (!p.start) return true;
    return l.tarih >= p.start && l.tarih <= p.end;
  });`;
  assert(say(src0, B1) === 1, "D1: penceredeDersler bloğu exact 1 kez");
  const YENI_B1 = `function penceredeDersler() {
  var p = pencere();
  var liste = aktifDonemKayitlari(DB.dersler).filter(function (l) {
    if (!p.start) return true;
    return l.tarih >= p.start && l.tarih <= p.end;
  }); /* DONEM-SECICI-YAMASI: yalnız aktif dönemin dersleri */`;

  /* ---------- YAMA D2: haftalık öğretmen grid'i ---------- */
  const C1 = `  var dersMap = {};
  DB.dersler.forEach(function (l) {
    if (l.ogretmenId !== t.id && (l.ogretmenAd || "") !== t.ad) return;`;
  assert(say(src0, C1) === 1, "D2: haftalikOgrtTablo dersMap bloğu exact 1 kez");
  const YENI_C1 = `  var dersMap = {};
  aktifDonemKayitlari(DB.dersler).forEach(function (l) { /* DONEM-SECICI-YAMASI: yalnız aktif dönem */
    if (l.ogretmenId !== t.id && (l.ogretmenAd || "") !== t.ad) return;`;

  /* ---------- YAMA D3: günlük tablo ---------- */
  const D1 = `  var gunDersler = DB.dersler.filter(function (l) {
    return l.tarih === gunKey && l.durum !== "iptal";
  });`;
  assert(say(src0, D1) === 1, "D3: gunlukTablo gunDersler bloğu exact 1 kez");
  const YENI_D1 = `  var gunDersler = aktifDonemKayitlari(DB.dersler).filter(function (l) { /* DONEM-SECICI-YAMASI: yalnız aktif dönem */
    return l.tarih === gunKey && l.durum !== "iptal";
  });`;

  /* ---------- YAMA D4: istek havuzu (3 exact satır) ---------- */
  const E1 = `  var bekleyen = DB.istekler.filter(function (r) { return r.durum === "bekliyor"; }).length;`;
  assert(say(src0, E1) === 1, "D4a: renderHavuz bekleyen satırı exact 1 kez");
  const YENI_E1 = `  var bekleyen = aktifDonemKayitlari(DB.istekler).filter(function (r) { return r.durum === "bekliyor"; }).length; /* DONEM-SECICI-YAMASI: yalnız aktif dönem */`;

  const E2 = `  var gosterilen = DB.istekler.filter(function (r) { return !aktif || r.dersId === aktif; });`;
  assert(say(src0, E2) === 1, "D4b: renderHavuz gosterilen satırı exact 1 kez");
  const YENI_E2 = `  var gosterilen = aktifDonemKayitlari(DB.istekler).filter(function (r) { return !aktif || r.dersId === aktif; }); /* DONEM-SECICI-YAMASI: yalnız aktif dönem */`;

  const E3 = `    var n = DB.istekler.filter(function (r) { return r.dersId === d.id; }).length;`;
  assert(say(src0, E3) === 1, "D4c: renderHavuz chip sayacı exact 1 kez");
  const YENI_E3 = `    var n = aktifDonemKayitlari(DB.istekler).filter(function (r) { return r.dersId === d.id; }).length; /* DONEM-SECICI-YAMASI: yalnız aktif dönem */`;

  /* ---------- YAMA E: renderYonetim kuyruğu → v2 gömülü seçici ---------- */
  const F1 = `  var icerik = ui.sekme === "ogretmen" ? ogretmenTab() : ui.sekme === "ogrenci" ? ogrenciTab() : ayarTab();
  $("yonetimBolum").innerHTML = '<div class="kart p-5"><div class="flex flex-wrap items-center justify-between gap-3 mb-5">' +
    '<h2 class="text-[15px] font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-sliders text-slate-300"></i> Veri Yönetimi ve Program Tanımlama</h2>' + pills + "</div>" + icerik + "</div>";`;
  assert(say(src0, F1) === 1, "E: renderYonetim kuyruk bloğu exact 1 kez");
  const YENI_F1 = `  var icerik = ui.sekme === "ogretmen" ? ogretmenTab() : ui.sekme === "ogrenci" ? ogrenciTab() : ayarTab();
` + RY_V2;

  /* ---------- UYGULA (tüm assert'ler geçti; tek yazma) ---------- */
  out = src0.slice(0, iA1) + YENI_YARDIMCILAR + src0.slice(iA1);
  assert(out.includes(YENI_YARDIMCILAR.slice(0, 80)), "uygulama: yardımcılar doğru yerde");

  out = out.replace(B1, YENI_B1);
  out = out.replace(C1, YENI_C1);
  out = out.replace(D1, YENI_D1);
  out = out.replace(E1, YENI_E1);
  out = out.replace(E2, YENI_E2);
  out = out.replace(E3, YENI_E3);
  out = out.replace(F1, YENI_F1);

  /* --- sonuç doğrulamaları (yazmadan ÖNCE) --- */
  assert(say(out, "DONEM-SECICI-V2") >= 2, "sonuç: DONEM-SECICI-V2 işareti (>=2)");
  assert(say(out, "DONEM-SECICI-YAMASI") >= 8, "sonuç: yama işaretleri mevcut (>=8 konum)");
  assert(say(out, "function aktifDonemKayitlari(") === 1, "sonuç: aktifDonemKayitlari tam 1 kez");
  assert(say(out, "function donemSecKutusuHTML()") === 1, "sonuç: donemSecKutusuHTML tam 1 kez");
  assert(say(out, "function donemSec(id)") === 1, "sonuç: donemSec tam 1 kez");
  assert(say(out, "(r.donemId || DONEM_ILK_ID) === hedef") === 1, "sonuç: TEK filtre kuralı + non-mutating uyumluluk tam 1 yerde");
  assert(say(out, "aktifDonemKayitlari(DB.dersler)") === 3, "sonuç: ders filtresi 3 görünümde (liste+günlük+haftalık)");
  assert(say(out, "aktifDonemKayitlari(DB.istekler)") === 3, "sonuç: istek filtresi 3 noktada (bekleyen+gosterilen+chip)");
  assert(say(out, 'onchange="donemSec(this.value)"') === 1, "sonuç: seçici onchange tam 1 kez");
  assert(say(out, "id=\"donemSeciciKutu\"") === 1, "sonuç: seçici kutu id tam 1 kez (markup'ta)");
  assert(say(out, "'<div class=\"kart p-5\">' + donemSecKutusuHTML()") === 1, "sonuç: seçici kart başına gömülü (tam 1 yerde)");
  assert(say(out, "donemSecKutusuHTML()") === 2, "sonuç: donemSecKutusuHTML tanım+çağrı tam 2 kez");
  assert(say(out, "function penceredeDersler()") === 1, "sonuç: penceredeDersler hâlâ tam 1 kez");
  assert(say(out, "function normalize(d)") === 1, "sonuç: normalize DOKUNULMADI (tam 1 kez, değişmedi)");
  assert(say(out, "function donemleriBaslat(db)") === 1, "sonuç: donemleriBaslat DOKUNULMADI");
  assert(say(out, "donemId: aktifDonemId()") === 4, "sonuç: DONEM-DAMGA kayıt noktaları aynen (4)");
  assert(out.length > src0.length, "sonuç: dosya yalnızca büyüdü (bölgesel ekleme/replace, baştan yazma yok)");
}

writeFileSync(F, out);
console.log("app.js v2 yamalandı.");

/* ================= test.mjs: yeni süit kaydı (idempotent) ================= */
const TF = "test.mjs";
const tsrc0 = readFileSync(TF, "utf8");
if (say(tsrc0, '"ks-donem-secici.mjs"') === 0) {
  const T1 = `"ks-donem-ilk.mjs", "ks-donem-damga.mjs"]`;
  assert(say(tsrc0, T1) === 1, "test.mjs: suites satırı exact 1 kez");
  writeFileSync(TF, tsrc0.replace(T1, T1.replace("]", "") + ", \"ks-donem-secici.mjs\"]"));
  console.log("test.mjs güncellendi (ks-donem-secici.mjs eklendi).");
} else {
  assert(say(tsrc0, '"ks-donem-secici.mjs"') === 1, "test.mjs: süit kaydı zaten tam 1 kez (dokunulmadı)");
  console.log("test.mjs zaten güncel (dokunulmadı).");
}

console.log("YAMA TAMAM ✔");
