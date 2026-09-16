/* ks-yama-ek-ders-donem.mjs — EK-DERS-DONEM yaması (assert'li, idempotent, hedefli bölgesel)
   TEK İŞ:
   A) Ek ders kayıtlarına aktif dönem ID damgası:
      - saveDB(): donemId'siz ekDersler kayıt anında aktifDonemId() ile damgalanır
        (ek-ders.js push → yenile() → saveDB kapısı; ek-ders.js DOKUNULMAZ).
      - donemleriBaslat(): donemId'siz eski ek dersler TEK KEZ DONEM_ILK_ID'ye bağlanır;
        dolu donemId ASLA üzerine yazılmaz.
   B) duzeltmeBul(): birebir planlamada aynı öğretmen+gun+kod'da çakan EK DERS de uyarılır
      (yalnız aktif dönem kayıtları; uyarıda sınıf+ders adı+zaman okunur).
   Kurallar: tüm assert'ler geçmeden yazma YOK; 2. koşu "Zaten uygulanmış" (exit 2), dosyaya dokunmaz.
   Yedek: app.js.ek-ders-donem-oncesi.bak (mevcut backup'ın üzerine YAZILMAZ). */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";

const HEDEF = "app.js";
const YEDEK = "app.js.ek-ders-donem-oncesi.bak";
const kaynak = readFileSync(HEDEF, "utf8");

function eslesmeAdet(metin, hedef) {
  if (!hedef) return 0;
  let n = 0, i = 0;
  while ((i = metin.indexOf(hedef, i)) !== -1) { n++; i += hedef.length; }
  return n;
}
function assertKere(metin, hedef, beklenen, etiket) {
  const n = eslesmeAdet(metin, hedef);
  if (n !== beklenen) {
    console.error(`✗ ASSERT (${etiket}): "${hedef.slice(0, 70)}…" için ${n} eşleşme, beklenen ${beklenen}`);
    process.exit(1);
  }
}

/* idempotentlik: zaten uygulanmış mı? */
if (kaynak.includes("EK-DERS-DONEM-YAMASI")) {
  console.log("Zaten uygulanmış (EK-DERS-DONEM-YAMASI işareti mevcut) — dosyaya dokunulmadı. (exit 2)");
  process.exit(2);
}

/* ---- Kapsam koruma assert'leri (yama ÖNCESİ kaynak) ---- */
assertKere(kaynak, "function saveDB() {", 1, "saveDB tekilliği");
assertKere(kaynak, "function donemleriBaslat(db) {", 1, "donemleriBaslat tekilliği");
assertKere(kaynak, "function duzeltmeBul(adet, yokSay, grupOgrenciIds) {", 1, "duzeltmeBul tekilliği");
assertKere(kaynak, "var say = { d: 0, ders: 0, ist: 0 };", 1, "say init anchor");
assertKere(kaynak, 'if (r.donemId == null || r.donemId === "") { r.donemId = DONEM_ILK_ID; say.ist++; }', 1, "istek backfill anchor");
/* Kapsam dışı: gunluk/haftalik/ozet/analiz render'ları ekDersler'e BUGÜN de referans vermiyor; yama sonrası da vermeyecek */
assertKere(kaynak, "function gunlukTablo() {", 1, "gunlukTablo tekilliği");
assertKere(kaynak, "function haftalikOgrtTablo() {", 1, "haftalikOgrtTablo tekilliği");

/* ---- YAMA A1: donemleriBaslat — say init'e ek:0 ---- */
const H1_ESKI = `  var say = { d: 0, ders: 0, ist: 0 };`;
const H1_YENI = `  var say = { d: 0, ders: 0, ist: 0, ek: 0 }; /* EK-DERS-DONEM-YAMASI: ek ders backfill sayacı */`;
assertKere(kaynak, H1_ESKI, 1, "A1 say init");
let sonuc = kaynak.replace(H1_ESKI, H1_YENI);

/* ---- YAMA A2: donemleriBaslat — istekler bloğunun ARDINA ekDersler backfill ---- */
const H2_ESKI = `  (Array.isArray(db.istekler) ? db.istekler : []).forEach(function (r) {
    if (!r || typeof r !== "object") return;
    if (r.donemId == null || r.donemId === "") { r.donemId = DONEM_ILK_ID; say.ist++; }
  });`;
const H2_YENI = H2_ESKI + `
  /* EK-DERS-DONEM-YAMASI: donemId'siz eski ek dersler TEK KEZ ilk döneme bağlanır (idempotent);
     mevcut dolu donemId ASLA üzerine yazılmaz. */
  (Array.isArray(db.ekDersler) ? db.ekDersler : []).forEach(function (l) {
    if (!l || typeof l !== "object") return;
    if (l.donemId == null || l.donemId === "") { l.donemId = DONEM_ILK_ID; say.ek++; }
  });`;
assertKere(sonuc, H2_ESKI, 1, "A2 istek backfill bloğu");
sonuc = sonuc.replace(H2_ESKI, H2_YENI);

/* ---- YAMA A3: saveDB — aktarım/damgalama kapısı ---- */
const H3_ESKI = `function saveDB() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }`;
const H3_YENI = `function saveDB() {
  /* EK-DERS-DONEM-YAMASI: ek ders kayıtları localStorage'a yazılmadan ÖNCE aktif döneme damgalanır.
     ek-ders.js push → yenile() → saveDB kapısı buradan geçer; mevcut dolu donemId ASLA üzerine yazılmaz
     (idempotent: dolu alanda dokunulmaz, ikinci koşuda hiçbir alan değişmez). */
  if (typeof DB !== "undefined" && DB && Array.isArray(DB.ekDersler)) DB.ekDersler.forEach(function (l) {
    if (l && typeof l === "object" && (l.donemId == null || l.donemId === "")) l.donemId = aktifDonemId();
  });
  try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }`;
assertKere(sonuc, H3_ESKI, 1, "A3 saveDB kapısı");
sonuc = sonuc.replace(H3_ESKI, H3_YENI);

/* ---- YAMA B1: duzeltmeBul — iki yönlü ek ders çakışması (yalnız aktif dönem) ---- */
const H4_ESKI = `    if (cakisan) uyari.push("Aynı kısa kod saatinde " + ogr.ad + " öğretmeninin <b>" + cakisan.ogrenciAd + "</b> ile başka bir dersi var (" + fmtTR(cakisan.tarih) + " " + saatEtiket(cakisan.saat) + ").");
  }`;
const H4_YENI = `    if (cakisan) uyari.push("Aynı kısa kod saatinde " + ogr.ad + " öğretmeninin <b>" + cakisan.ogrenciAd + "</b> ile başka bir dersi var (" + fmtTR(cakisan.tarih) + " " + saatEtiket(cakisan.saat) + ").");
    /* EK-DERS-DONEM-YAMASI: iki yönlü çakışma — birebir planlarken öğretmenin AKTİF DÖNEMDEKİ ek dersi de uyarılır.
       Diğer dönemdeki ek dersler uyarıya DAHİL EDİLMEZ; mesajda sınıf + ders adı + tarih/saat okunur. */
    var cakisanEkDers = aktifDonemKayitlari(Array.isArray(DB.ekDersler) ? DB.ekDersler : []).find(function (l) {
      return l.ogretmenId === ogr.id && l.tarih === adet.tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal" && l.id !== (adet.id || "");
    });
    if (cakisanEkDers) {
      var _ekD = DERS[cakisanEkDers.dersId] || DERS.tur;
      uyari.push("Aynı saatte " + ogr.ad + " öğretmeninin <b>" + esc(cakisanEkDers.sinif) + "</b> sınıfıyla bir <b>" + _ekD.ad + "</b> ek dersi var (" + fmtTR(cakisanEkDers.tarih) + " " + saatEtiket(cakisanEkDers.saat) + ").");
    }
  }`;
assertKere(sonuc, H4_ESKI, 1, "B1 duzeltmeBul ek ders dalı");
sonuc = sonuc.replace(H4_ESKI, H4_YENI);

/* ---- Son doğrulamalar ---- */
assertKere(sonuc, "EK-DERS-DONEM-YAMASI", 4, "son: 4 yama işareti");
assertKere(sonuc, "say.ek++", 1, "son: tek backfill noktası");
assertKere(sonuc, "l.donemId = aktifDonemId()", 1, "son: saveDB damga noktası");
assertKere(sonuc, "aktifDonemKayitlari(Array.isArray(DB.ekDersler)", 1, "son: dönem-filtreli ek ders çakışması");
assertKere(sonuc, "l.donemId = DONEM_ILK_ID", 2, "son: dersler+ekDersler backfill (l.)");
assertKere(sonuc, "r.donemId = DONEM_ILK_ID", 1, "son: istekler backfill (r.)");
/* kapsam dışı bütünlük: render fonksiyonlarına ekDersler referansı EKLENMEDİ */
assertKere(sonuc, "function gunlukTablo() {", 1, "koruma: gunlukTablo tek");
assertKere(sonuc, "function haftalikOgrtTablo() {", 1, "koruma: haftalikOgrtTablo tek");

/* ---- backup (üzerine yazma YOK) + yaz ---- */
if (existsSync(YEDEK)) { console.error("✗ ASSERT: backup dosyası zaten var — üzerine yazılmaz: " + YEDEK); process.exit(1); }
copyFileSync(HEDEF, YEDEK);
writeFileSync(HEDEF, sonuc, "utf8");
console.log("EK-DERS-DONEM yaması uygulandı: saveDB damga kapısı + donemleriBaslat ekDersler backfill + duzeltmeBul iki yönlü çakışma.");
console.log("Geri dönüş: " + YEDEK);
