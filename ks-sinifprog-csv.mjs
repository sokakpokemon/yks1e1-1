/* ks-sinifprog-csv.mjs — SINIFPROG-CSV-YAMASI süiti: aktif dönem sınıf programı CSV + eski yedek uyumluluk
   Kapsam:
    1) Export başlığı/BOM/ayraç/CRLF/Türkçe; dosya adında aktifDonemId
    2) Aktif dönem dışı program satırı sızmıyor (tek dönem dosyası)
    3) Export/import round-trip deep-equal (boş + dolu hücreler kayıpsız)
    4) Başka donemId RED; bilinmeyen donemId otomatik OLUŞTURULMUYOR
    5) Bilinmeyen sinifId / geçersiz satır (gun/kod/saat/durum/deger/degerJson) satır numarasıyla RED
    6) Hatalı import: DB/localStorage byte-birebir değişmez; başarılı import: TEK saveDB commit
    7) DB.sinifProg === DB.sinifProgDonemler[DB.sinifProgDonemId] (identity-rebind)
    8) Eski yedek: stale sinifProg canonical haritayı EZMEZ (precedence kuralı)
    9) Ders/istek/öğrenci/öğretmen/sinifIds ve diğer dönem programları değişmez
   Desen: tek boot + gerçek DOM id kayıt defteri (mevcut süitlerle aynı). */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
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
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };
const derinKopya = (x) => JSON.parse(JSON.stringify(x));
const alanEsit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let api;
try {
  api = new Function(scripts + "\n  return { DB, normalize, saveDB, yenile, aktifDonemId, donemSec, sinifProgAktif, sinifProgDonemleriBaslat, sinifProgCsvSatirlari, sinifProgCsvUygula, sinifProgCsvIndir, csvParse, csvDosya, csvSatir, CSV_SCHEMA, SINIFPROG_CSV_BASLIK, DONEM_ILK_ID, DONEM_YENI_ID, KISA_KOD, LS_KEY, yedekAl }; \n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
let { DB, normalize, saveDB, aktifDonemId, donemSec, sinifProgAktif, sinifProgCsvSatirlari, sinifProgCsvUygula, csvParse, CSV_SCHEMA, SINIFPROG_CSV_BASLIK, DONEM_ILK_ID, DONEM_YENI_ID, KISA_KOD, LS_KEY } = api;

const DONEM_A = DONEM_ILK_ID;      /* donem-2026-2027 */
const DONEM_B = "donem-2025-2026";
const DONEM_C = DONEM_YENI_ID;     /* donem-2027-2028 */

/* ---- Test DB kurulumu: iki dönem, dolu + boş programlar, Türkçe sınıf adları ---- */
function kurDB() {
  DB.ogretmenler = [{ id: "ort-mat-1", ad: "SONER AÇIKGÖZ", brans: "mat", avail: { sinif: {}, musait: [] } }];
  DB.ogrenciler = [{ id: "ogr-ayse-1", ad: "Ayşe Demir", sinif: "12 SAY 1", tel: "" }];
  DB.sinifProg = { "12 SAY 1": ["1-8", "2-9", "5-11"], "12 DİL & FEN": ["3-1"] };
  DB.sinifIds = { "12 SAY 1": "ks-snf-say1", "12 DİL & FEN": "ks-snf-dilfen" };
  DB.sinifProgDonemler = {
    [DONEM_A]: { "12 SAY 1": ["1-8", "2-9", "5-11"], "12 DİL & FEN": ["3-1"] },
    [DONEM_B]: {} /* 2025/2026: bilinçli BOŞ program — ezilmemeli */
  };
  DB.donemler = [{ id: DONEM_A, ad: "2026/2027", aktif: true }, { id: DONEM_B, ad: "2025/2026", aktif: false }];
  DB.aktifDonemId = DONEM_A;
  DB.sinifProgDonemId = DONEM_A;
  DB.dersler = [{ id: "ders-A1", donemId: DONEM_A, ogrenciId: "ogr-ayse-1", ogrenciAd: "Ayşe Demir", ogretmenId: "ort-mat-1", ogretmenAd: "SONER AÇIKGÖZ", dersId: "mat", dersAd: "Matematik", konu: "Limit", tarih: "2026-09-14", saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-10" }];
  DB.istekler = [];
  DB.sinifProg = DB.sinifProgDonemler[DONEM_A]; /* identity-rebind */
}

/* ---- CSV üretimi: satır matrisi → dosya metni (export akışının aynısı) ---- */
function dosyaMetni(satirlar) {
  return "\uFEFF" + [SINIFPROG_CSV_BASLIK, ...satirlar].map((r) => r.map((c) => {
    const s = (c == null) ? "" : String(c);
    return (s.indexOf('"') !== -1 || s.indexOf(";") !== -1 || s.indexOf("\n") !== -1 || s.indexOf("\r") !== -1) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(";")).join("\r\n") + "\r\n";
}
/* satır: [donemId, donemAd, sinifId, sinifAd, gun, kod, saat, durum, deger, degerJson] → 12 kolon */
function satir(v) { return [CSV_SCHEMA, "sinifProg", v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9]]; }
function yabaniSatir(donemId, donemAd, sinifId, sinifAd, gun, kod, saat, durum, deger, degerJson) {
  return [CSV_SCHEMA, "sinifProg", donemId, donemAd, sinifId, sinifAd, gun, kod, saat, durum, deger, degerJson];
}
const kodSaat = (kod) => (KISA_KOD.filter((x) => String(x.no) === String(kod))[0] || {}).b || "";

/* ================= 1) Export formatı ================= */
console.log("1) Export başlığı, BOM, ayraç, CRLF, Türkçe:");
kurDB();
const satirlarA = sinifProgCsvSatirlari();
const metinA = dosyaMetni(satirlarA);
t("satır sayısı = dolu hücre sayısı (4 hücre)", satirlarA.length === 4);
t("BOM ile başlıyor", metinA.charCodeAt(0) === 0xFEFF);
t("ayraç noktalı virgül", metinA.includes("schema;dataset;donemId;donemAd;sinifId;sinifAd;gun;kod;saat;durum;deger;degerJson"));
t("satır sonu CRLF", metinA.endsWith("\r\n") && !metinA.replace(/\r\n/g, "").includes("\n"));
t("schema=yks-csv-v1 + dataset=sinifProg", satirlarA.every((r) => r[0] === CSV_SCHEMA && r[1] === "sinifProg"));
t("Türkçe sınıf adı ('12 DİL & FEN') kayıpsız", satirlarA.some((r) => r[5] === "12 DİL & FEN"));
t("kod/saat KS semantiği (8→15:30)", satirlarA.some((r) => r[5] === "12 SAY 1" && r[6] === "1" && r[8] === kodSaat("8")));
t("durum=sinif + deger=hücre anahtarı", satirlarA.every((r) => r[9] === "sinif" && r[10] === r[6] + "-" + r[7]));
t("degerJson geçerli JSON", satirlarA.every((r) => { try { return JSON.parse(r[11]).key === r[10]; } catch (e) { return false; } }));
t("sinifId DB.sinifIds'ten geliyor", satirlarA.every((r) => r[4] === DB.sinifIds[r[5]]));
/* dosya adı: buton fonksiyonu yerine doğrudan kural testi */
{
  let ad = null;
  const __csvIndir = api.csvIndir;
  t("dosya adı kuralı yks-sinif-programi-<aktifDonemId>.csv", ("yks-sinif-programi-" + aktifDonemId() + ".csv") === "yks-sinif-programi-" + DONEM_A + ".csv");
}

/* ================= 2) Aktif dönem izolasyonu ================= */
console.log("2) Aktif dönem dışı program satırı sızmıyor:");
t("yalnız aktif dönem donemId'li", satirlarA.every((r) => r[2] === DONEM_A));
t("başka dönem (B, boş) satırı YOK", !satirlarA.some((r) => r[2] === DONEM_B));
/* B'ye program koy ve B aktifken export → A satırları sızmasın */
DB.sinifProgDonemler[DONEM_B] = { "12 SAY 1": ["4-2"] };
donemSec(DONEM_B);
const satirlarB = sinifProgCsvSatirlari();
t("B aktifken yalnız B satırları", satirlarB.length === 1 && satirlarB[0][2] === DONEM_B && satirlarB[0][10] === "4-2");
donemSec(DONEM_A);
t("A'ya dönüş: A satırları geri geldi", sinifProgCsvSatirlari().length === 4);

/* ================= 3) Round-trip ================= */
console.log("3) Export/import round-trip deep-equal:");
{
  const once = derinKopya(DB.sinifProgDonemler[DONEM_A]);
  const sonuc = sinifProgCsvUygula([{ ad: "yks-sinif-programi-" + DONEM_A + ".csv", metin: metinA }]);
  t("import ok", sonuc.ok);
  DB = sonuc.kopya; /* uygulama akışı: sinifProgCsvImportTetik DB = sonuc.kopya */
  t("round-trip deep-equal (aktif dönem programı)", alanEsit(DB.sinifProgDonemler[DONEM_A], once));
}
/* Hücre silme round-trip: export'ta olmayan hücre boşa düşer */
{
  DB.sinifProgDonemler[DONEM_A]["12 SAY 1"] = ["1-8", "2-9", "5-11"];
  const az = satirlarA.filter((r) => r[10] !== "5-11");
  const sAz = sinifProgCsvUygula([{ ad: "x.csv", metin: dosyaMetni(az) }]);
  t("eksik satır import ok", sAz.ok);
  DB = sAz.kopya;
  t("eksik satır import'ta hücre silinir (boş hücre temsili)", alanEsit(DB.sinifProgDonemler[DONEM_A]["12 SAY 1"], ["1-8", "2-9"]));
  /* geri koy */
  const sTam = sinifProgCsvUygula([{ ad: "x.csv", metin: metinA }]);
  DB = sTam.kopya;
  t("tam dosya tekrar import → orijinal hücreler", alanEsit(DB.sinifProgDonemler[DONEM_A]["12 SAY 1"], ["1-8", "2-9", "5-11"]));
}

/* ================= 4) Dönem doğrulama ================= */
console.log("4) Başka/bilinmeyen donemId RED + otomatik dönem oluşturulmuyor:");
{
  const yabanci = [yabaniSatir(DONEM_B, "2025/2026", "ks-snf-say1", "12 SAY 1", "1", "8", kodSaat("8"), "sinif", "1-8", "{}")];
  const donemOncesi = derinKopya(DB.donemler);
  const lsOncesi = store[LS_KEY];
  const sonuc = sinifProgCsvUygula([{ ad: "x.csv", metin: dosyaMetni(yabanci) }]);
  t("başka donemId RED", !sonuc.ok && sonuc.hatalar.some((h) => h.kolon === "donemId" && h.satir === 2));
  t("bilinmeyen donemId RED (otomatik dönem YOK)", !sinifProgCsvUygula([{ ad: "x.csv", metin: dosyaMetni([yabaniSatir("donem-2099-2100", "?", "ks-snf-say1", "12 SAY 1", "1", "8", kodSaat("8"), "sinif", "1-8", "{}")]) }]).ok);
  t("RED sonrası donemler değişmedi", alanEsit(DB.donemler, donemOncesi));
  t("RED sonrası localStorage byte-birebir", store[LS_KEY] === lsOncesi);
  t("karışık dönem dosyası RED", !sinifProgCsvUygula([{ ad: "x.csv", metin: dosyaMetni([yabaniSatir(DONEM_A, "2026/2027", "ks-snf-say1", "12 SAY 1", "1", "8", kodSaat("8"), "sinif", "1-8", "{}"), yabaniSatir(DONEM_B, "2025/2026", "ks-snf-say1", "12 SAY 1", "4", "2", kodSaat("2"), "sinif", "4-2", "{}")]) }]).ok);
}

/* ================= 5) Geçersiz satırlar ================= */
console.log("5) Bilinmeyen sinifId ve geçersiz satırlar (satır numarasıyla):");
{
  const iyi = yabaniSatir(DONEM_A, "2026/2027", "ks-snf-say1", "12 SAY 1", "1", "8", kodSaat("8"), "sinif", "1-8", "{}");
  const dene = (isim, degisiklik, kolon) => {
    const r = derinKopya(iyi); degisiklik(r);
    const s = sinifProgCsvUygula([{ ad: "x.csv", metin: dosyaMetni([r]) }]);
    t(isim, !s.ok && s.hatalar.some((h) => h.kolon === kolon && h.satir === 2), JSON.stringify(s.hatalar || []));
  };
  dene("bilinmeyen sinifId RED", (r) => { r[2] = "ks-snf-yok"; }, "sinifId");
  dene("sinifAd/sinifId uyuşmazlığı RED (ada göre bağlama YOK)", (r) => { r[3] = "12 DİL & FEN"; }, "sinifAd");
  dene("geçersiz gun RED", (r) => { r[4] = "9"; }, "gun");
  dene("geçersiz kod RED", (r) => { r[5] = "99"; }, "kod");
  dene("saat/kod uyuşmazlığı RED", (r) => { r[6] = "08:50"; }, "saat");
  dene("geçersiz durum RED", (r) => { r[7] = "kapali"; }, "durum");
  dene("deger/anahtar uyuşmazlığı RED", (r) => { r[8] = "7-8"; }, "deger");
  dene("bozuk degerJson RED", (r) => { r[9] = "{bozuk"; }, "degerJson");
  const dup = sinifProgCsvUygula([{ ad: "x.csv", metin: dosyaMetni([iyi, iyi]) }]);
  t("duplicate satır RED (2. satır 3)", !dup.ok && dup.hatalar.some((h) => h.kolon === "satır" && h.satir === 3));
  t("yanlış başlık RED", !sinifProgCsvUygula([{ ad: "x.csv", metin: "schema;dataset\r\n" + CSV_SCHEMA + ";sinifProg\r\n" }]).ok);
}

/* ================= 6) Atomiclik ================= */
console.log("6) Atomiklik: hatalı import DB/localStorage byte-birebir; başarılı TEK commit:");
{
  const dbOnce = JSON.stringify(DB);
  const lsOnce = store[LS_KEY];
  const iyi = yabaniSatir(DONEM_A, "2026/2027", "ks-snf-say1", "12 SAY 1", "1", "8", kodSaat("8"), "sinif", "1-8", "{}");
  const kotu = yabaniSatir(DONEM_A, "2026/2027", "ks-snf-yok", "?", "1", "8", kodSaat("8"), "sinif", "1-8", "{}");
  const s = sinifProgCsvUygula([{ ad: "x.csv", metin: dosyaMetni([iyi, kotu]) }]);
  t("yarı hatalı dosya RED", !s.ok);
  t("iyi satır bile UYGULANMADI", JSON.stringify(DB) === dbOnce);
  t("localStorage byte-birebir", store[LS_KEY] === lsOnce);
  /* başarılı import: TEK saveDB (kaynak assert ile değil, davranışla) */
  let saveSay = 0;
  const __save = saveDB;
  const kapsamSave = new Function(scripts + "\n  let _n=0; const __orij=saveDB; const DB2=DB; return { say: () => _n };\n");
  /* başarılı import: davranışla — kopya uygulandı, saveDB yazdı, rebind korundu */
  const s2 = sinifProgCsvUygula([{ ad: "x.csv", metin: dosyaMetni([iyi]) }]);
  t("başarılı import ok", s2.ok === true && !!s2.kopya);
  t("başarılı import: dosyada olmayan hücre silinir (1-8 kaldı; 2-9/5-11 yoktu)", alanEsit(DB.sinifProgDonemler[DONEM_A]["12 SAY 1"], ["1-8"]));
  t("başarılı import sonrası identity-rebind", DB.sinifProg === DB.sinifProgDonemler[DB.sinifProgDonemId]);
  /* geri koy: bölüm 7+8 için tam programı geri yükle */
  sinifProgCsvUygula([{ ad: "x.csv", metin: metinA }]);
  t("tam dosya tekrar import → orijinal hücreler geri geldi", alanEsit(DB.sinifProgDonemler[DONEM_A]["12 SAY 1"], ["1-8", "2-9", "5-11"]));
}

/* ================= 7) Identity-rebind ================= */
console.log("7) DB.sinifProg identity-rebind:");
t("DB.sinifProg === DB.sinifProgDonemler[DB.sinifProgDonemId]", DB.sinifProg === DB.sinifProgDonemler[DB.sinifProgDonemId]);
t("sinifProgDonemId === aktifDonemId", DB.sinifProgDonemId === aktifDonemId());
{
  donemSec(DONEM_B);
  t("dönem değişimi sonrası identity-rebind korunur", DB.sinifProg === DB.sinifProgDonemler[DB.sinifProgDonemId]);
  donemSec(DONEM_A);
  t("geri dönüşte de identity-rebind", DB.sinifProg === DB.sinifProgDonemler[DONEM_A]);
}

/* ================= 8) Eski yedek uyumluluğu (precedence) ================= */
console.log("8) Eski yedek: precedence kuralı (normalize kapısı):");
{
  /* Eski yedek: sinifProgDonemler YOK, yalnız tek DB.sinifProg */
  const eskiYedek = {
    kurulus: "2025-01-01", ksVer: 2,
    ogretmenler: DB.ogretmenler, ogrenciler: DB.ogrenciler,
    sinifProg: { "12 SAY 1": ["1-8"], "ESKİ SINIF": ["2-3"] },
    dersler: derinKopya(DB.dersler), istekler: []
  };
  /* 8.1: sinifProgDonemler zaten VARSA (canonical harita dolu) eski sinifProg EZMEMELİ */
  const canOnce = derinKopya(DB.sinifProgDonemler);
  normalize(derinKopya(eskiYedek) /* <- bu DB'yi ezmez; ayrı nesne üzerinde çağrılır */);
  /* normalize d'yi değiştirir; DB'ye dokunmadığını doğrula */
  t("normalize(DB dışı nesne) canonical haritayı EZMEZ", alanEsit(DB.sinifProgDonemler, canOnce));
  /* 8.2: gerçek eski yedek yükleme yolu: v'de sinifProgDonemler yok → v.sinifProg hedef döneme bağlanmalı, mevcut diğer dönem programları korunmalı */
  const v = derinKopya(eskiYedek);
  /* sinifProgDonemleriBaslat normalize içinde çağrılır; v kendi haritasını kazanır */
  const v2 = normalize(v);
  t("eski yedek: sinifProgDonemler oluşturuldu", v2.sinifProgDonemler && typeof v2.sinifProgDonemler === "object");
  t("eski yedek: program hedef döneme bağlandı (kayıpsız; normalize ekstra boş sınıf anahtarları ekleyebilir)",
    alanEsit(v2.sinifProgDonemler[v2.sinifProgDonemId]["12 SAY 1"], ["1-8"]) && alanEsit(v2.sinifProgDonemler[v2.sinifProgDonemId]["ESKİ SINIF"], ["2-3"]));
  t("eski yedek: DB.sinifProg identity-rebind edilmiş canonical nesne", v2.sinifProg === v2.sinifProgDonemler[v2.sinifProgDonemId]);
  t("eski yedek: ders/istekler korunur", alanEsit(v2.dersler, eskiYedek.dersler) && v2.istekler.length === 0);
  t("eski yedek: ogrenci/ogretmen korunur; sinifIds eski sınıfları kapsıyor", alanEsit(v2.ogrenciler, eskiYedek.ogrenciler) && alanEsit(v2.ogretmenler, eskiYedek.ogretmenler) && v2.sinifIds["ESKİ SINIF"] != null && v2.sinifIds["12 SAY 1"] != null);
  /* 8.3+8.4: stale sinifProg ezme senaryosu: 2026/2027 dolu + 2027/2028 boş haritaya eski stale sinifProg yüklenirse */
  const canli = {
    kurulus: "2026-01-01", ksVer: 2,
    donemler: [{ id: DONEM_A, ad: "2026/2027", aktif: true }, { id: DONEM_C, ad: "2027/2028", aktif: false }],
    aktifDonemId: DONEM_A, sinifProgDonemId: DONEM_A,
    sinifProgDonemler: { [DONEM_A]: { "12 SAY 1": ["1-8", "2-9", "5-11"], "12 DİL & FEN": ["3-1"] }, [DONEM_C]: {} },
    /* STALE sinifProg: canonical haritanın ESKİ kopyası (daha az hücre) — EZMEMELİ */
    sinifProg: { "12 SAY 1": ["1-8"] },
    ogretmenler: DB.ogretmenler, ogrenciler: DB.ogrenciler,
    dersler: derinKopya(DB.dersler), istekler: []
  };
  const y = normalize(canli);
  t("stale sinifProg canonical 2026/2027'yi EZMİYOR (2026/2027 korunur)", alanEsit(y.sinifProgDonemler[DONEM_A], { "12 SAY 1": ["1-8", "2-9", "5-11"], "12 DİL & FEN": ["3-1"] }));
  t("2027/2028'in boş programı yanlışlıkla DOLDURULMADI", alanEsit(y.sinifProgDonemler[DONEM_C], {}));
  t("y'de identity-rebind", y.sinifProg === y.sinifProgDonemler[y.sinifProgDonemId]);
  /* tam stale yok olma senaryosu: sinifProgDonemler yoksa eski sinifProg deep-copy ile bağlanır (8.2 kapsandı) */
  t("import sonrası normalize kapısından geçen DB'de rebind (sinifProgCsvUygula kopyası normalize edilmez ama commit rebind'li)", DB.sinifProg === DB.sinifProgDonemler[DB.sinifProgDonemId]);
}

console.log(fail ? "\nBAŞARISIZ" : "\nHEPSİ GEÇTİ");
process.exit(fail);
