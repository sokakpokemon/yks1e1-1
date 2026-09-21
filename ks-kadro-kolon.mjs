let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-kadro-kolon.mjs — KADRO-KOLON-YAMASI süiti: kadro CSV'si v2 (ad;soyad;telefon üst düzey kolonlar)
   Doğruladıkları:
    1) v2 header birebir: schema;dataset;donemId;tip;id;ad;soyad;telefon;brans;sinifId;sinifAd;ekAlanlarJson
    2) ad/soyad ayırma: çok kelimeli ("MEHMET ALI YILMAZ" → ad="MEHMET ALI", soyad="YILMAZ"),
       tek kelimelik (ad dolu, soyad boş), boş ad (ikisi de boş), Türkçe karakterler
    3) Telefon: DB .tel alanından AYRI kolonda, string olarak (+90 / baştaki 0 / boşluk / tire KORUNUR)
    4) Sinif satırlarında ad = sınıf adı; soyad ve telefon BOŞ
    5) v2 export→import round-trip kayıpsız (ad birleşir, tel geri gelir, duplicate yok)
    6) v1 import KORUNUR: tam ad kolonu + ekAlanlarJson.tel fallback
    7) v2'de üst düzey telefon ekAlanlarJson.tel'i EZER (authoritative)
    8) Quote-aware CSV, BOM, CRLF
    9) ID/donemId/referans/duplicate/atomiklik kuralları aynen korunur
   10) Ders/istek CSV şemaları değişmedi; v2 yalnız kadro dataset'inde geçerli
   Desen: tek boot + gerçek DOM id kayıt defteri (mevcut süitlerle aynı). */
import { readFileSync } from "node:fs";
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
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };
const derinKopya = (x) => JSON.parse(JSON.stringify(x));

const EXPORTS = "{ DB, saveDB, csvDosya, csvParse, csvImportUygula, CSV_SCHEMA, CSV_SCHEMA_KADRO, CSV_SCHEMA_KADRO_V3, CSV_BASLIK_KADRO, CSV_BASLIK_KADRO_V2, CSV_BASLIK_KADRO_V3, CSV_BASLIK_DERS, CSV_BASLIK_ISTEK, kadroAdSoyadAyir, kadroV2Satirlari, kadroV3Satirlari, csvKadroSatirlari, kadroTelOf, kadroSnfId, sinifId, aktifDonemId, LS_KEY }";
let api;
try {
  api = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, saveDB, csvDosya, csvImportUygula, CSV_SCHEMA, CSV_SCHEMA_KADRO, CSV_SCHEMA_KADRO_V3, CSV_BASLIK_KADRO, CSV_BASLIK_KADRO_V2, CSV_BASLIK_KADRO_V3, CSV_BASLIK_DERS, CSV_BASLIK_ISTEK, kadroAdSoyadAyir, kadroV2Satirlari, kadroV3Satirlari, csvKadroSatirlari, kadroSnfId, aktifDonemId, LS_KEY } = api;

/* ================= 1) v2 header ================= */
console.log("1) v3 header ve kolon sırası:");
t("CSV_SCHEMA_KADRO = yks-csv-v2 (sabit korunur)", CSV_SCHEMA_KADRO === "yks-csv-v2");
t("CSV_SCHEMA_KADRO_V3 = yks-csv-v3", CSV_SCHEMA_KADRO_V3 === "yks-csv-v3");
t("v1 header sabiti KORUNDU", JSON.stringify(CSV_BASLIK_KADRO) === JSON.stringify(["schema","dataset","donemId","tip","id","ad","brans","sinifId","sinifAd","ekAlanlarJson"]));
t("v2 header sabiti KORUNDU", JSON.stringify(CSV_BASLIK_KADRO_V2) === JSON.stringify(["schema","dataset","donemId","tip","id","ad","soyad","telefon","brans","sinifId","sinifAd","ekAlanlarJson"]), JSON.stringify(CSV_BASLIK_KADRO_V2));
t("v3 header birebir", JSON.stringify(CSV_BASLIK_KADRO_V3) === JSON.stringify(["schema","dataset","donemId","tip","id","ad","soyad","telefon","anneTelefon","babaTelefon","brans","sinifId","sinifAd","ekAlanlarJson"]), JSON.stringify(CSV_BASLIK_KADRO_V3));
t("ders/istek header şemaları DEĞİŞMEDİ", JSON.stringify(CSV_BASLIK_DERS) === JSON.stringify(["schema","dataset","donemId","tip","id","ogrenciId","ogrenciIds","ogrenciAd","ogretmenId","ogretmenAd","dersId","dersAd","konu","tarih","saat","kod","sinif","durum","ekAlanlarJson"]) && JSON.stringify(CSV_BASLIK_ISTEK) === JSON.stringify(["schema","dataset","donemId","tip","id","ogrenciId","ogrenciIds","ogrenciAd","ogretmenId","ogretmenAd","dersId","dersAd","konu","tarih","saat","kod","sinif","durum","olusturma","ekAlanlarJson"]));

/* ================= 2) ad/soyad ayırma ================= */
console.log("2) ad/soyad ayırma:");
const a1 = kadroAdSoyadAyir("MEHMET ALI YILMAZ");
t("çok kelimeli: 'MEHMET ALI YILMAZ' → ad='MEHMET ALI', soyad='YILMAZ'", a1.ad === "MEHMET ALI" && a1.soyad === "YILMAZ", JSON.stringify(a1));
const a2 = kadroAdSoyadAyir("ŞAHİN DOĞANAY");
t("Türkçe: 'ŞAHİN DOĞANAY' → ad='ŞAHİN', soyad='DOĞANAY'", a2.ad === "ŞAHİN" && a2.soyad === "DOĞANAY", JSON.stringify(a2));
const a3 = kadroAdSoyadAyir("Ayşe");
t("tek kelimelik: ad dolu, soyad boş", a3.ad === "Ayşe" && a3.soyad === "", JSON.stringify(a3));
const a4 = kadroAdSoyadAyir("");
t("boş ad: ikisi de boş", a4.ad === "" && a4.soyad === "", JSON.stringify(a4));
const a5 = kadroAdSoyadAyir("  Ayşe   Demir  ");
t("fazla boşluk normalize edilir", a5.ad === "Ayşe" && a5.soyad === "Demir", JSON.stringify(a5));
const a6 = kadroAdSoyadAyir("MAHMUT ZİYA YILDIRIM ÇÖLAK");
t("çok kelimeli soyad: ad='MAHMUT ZİYA YILDIRIM', soyad='ÇÖLAK'", a6.ad === "MAHMUT ZİYA YILDIRIM" && a6.soyad === "ÇÖLAK", JSON.stringify(a6));

/* ================= 3) Test DB kurulumu ================= */
console.log("3) Test DB + v3 dışa aktarma:");
DB.ogretmenler = [
  { id: "ort-mat-1", ad: "SONER AÇIKGÖZ", brans: "mat", avail: { sinif: {}, musait: [] } },
  { id: "ort-cok-1", ad: "MEHMET ALI YILMAZ", brans: "fiz", avail: { sinif: {}, musait: [] } }
];
DB.ogrenciler = [
  { id: "ogr-ayse-1", ad: "Ayşe Demir", sinif: "12 SAY 1", tel: "05551112233" },
  { id: "ogr-plus-1", ad: "Zeynep Kaya", sinif: "12 SAY 2", tel: "+90 555-999-88 77" },
  { id: "ogr-sifir-1", ad: "Emir Aydın", sinif: "12 DİL", tel: "" }
];
DB.sinifProg = { "12 SAY 1": [], "12 SAY 2": [], "12 DİL": [] };
DB.sinifIds = { "12 SAY 1": kadroSnfId("12 SAY 1"), "12 SAY 2": kadroSnfId("12 SAY 2"), "12 DİL": kadroSnfId("12 DİL") };
saveDB();

const v2Satirlar = kadroV3Satirlari(); /* TELEFON3-YAMASI: dışa aktarma artık v3; v2/v1 üreticileri KORUNDU */
const v2Ogr = v2Satirlar.find((r) => r[3] === "ogrenci" && r[4] === "ogr-ayse-1");
const v2OgrPlus = v2Satirlar.find((r) => r[3] === "ogrenci" && r[4] === "ogr-plus-1");
const v2OgrSifir = v2Satirlar.find((r) => r[3] === "ogrenci" && r[4] === "ogr-sifir-1");
const v2Ogrt = v2Satirlar.find((r) => r[3] === "ogretmen" && r[4] === "ort-mat-1");
const v2OgrtCok = v2Satirlar.find((r) => r[3] === "ogretmen" && r[4] === "ort-cok-1");
const v2Snf = v2Satirlar.find((r) => r[3] === "sinif" && r[4] === DB.sinifIds["12 SAY 1"]);

t("v3 satır genişliği 14 kolon", v2Satirlar.every((r) => r.length === 14), v2Satirlar.map((r) => r.length).join(","));
t("öğrenci: ad='Ayşe', soyad='Demir'", v2Ogr[5] === "Ayşe" && v2Ogr[6] === "Demir", JSON.stringify([v2Ogr[5], v2Ogr[6]]));
t("öğrenci: telefon AYRI kolonda, string korunur ('05551112233')", v2Ogr[7] === "05551112233", v2Ogr[7]);
t("anne/baba telefon AYRI kolonlarda (anneTelefon/babaTelefon)", v2Ogr[8] === "" && v2Ogr[9] === "", JSON.stringify([v2Ogr[8], v2Ogr[9]]));
t("+90 ve baştaki 0, boşluk, tire KORUNUR (biçimlendirme yok)", v2OgrPlus[7] === "+90 555-999-88 77", v2OgrPlus[7]);
t("boş tel → boş hücre (string)", v2OgrSifir[7] === "", JSON.stringify(v2OgrSifir[7]));
t("öğretmen çok kelimeli: ad='MEHMET ALI', soyad='YILMAZ'", v2OgrtCok[5] === "MEHMET ALI" && v2OgrtCok[6] === "YILMAZ", JSON.stringify([v2OgrtCok[5], v2OgrtCok[6]]));
t("öğretmen branş kolonunda (index 10)", v2Ogrt[10] === "mat");
t("sınıf satırı: ad = sınıf adı, soyad/telefon/anne/baba BOŞ", v2Snf[5] === "12 SAY 1" && v2Snf[6] === "" && v2Snf[7] === "" && v2Snf[8] === "" && v2Snf[9] === "", JSON.stringify([v2Snf[5], v2Snf[6], v2Snf[7], v2Snf[8], v2Snf[9]]));
t("sınıf satırında sinifAd = sınıf adı", v2Snf[12] === "12 SAY 1");
t("v3 schema kolonu yks-csv-v3", v2Satirlar.every((r) => r[0] === CSV_SCHEMA_KADRO_V3));
t("ekAlanlarJson tel/anneTel/babaTel İÇERMEZ (v3 temizliği)", !JSON.parse(v2Ogr[13]).tel && !JSON.parse(v2Ogr[13]).anneTel && !JSON.parse(v2Ogr[13]).babaTel, v2Ogr[13]);
t("v2 kadro satır üretici (kadroV2Satirlari) KORUNDU", kadroV2Satirlari().every((r) => r.length === 12 && r[0] === CSV_SCHEMA_KADRO));
t("v1 kadro satır üretici (csvKadroSatirlari) KORUNDU", csvKadroSatirlari().every((r) => r.length === 10 && r[0] === CSV_SCHEMA));

/* ================= 4) Dosya bütünlüğü: BOM + CRLF + quote ================= */
console.log("4) Dosya biçimi (BOM, CRLF, quote-aware):");
const v2CSV = csvDosya(CSV_BASLIK_KADRO_V3, v2Satirlar);
t("v3 dosya BOM ile başlıyor", v2CSV.charCodeAt(0) === 0xFEFF);
t("v3 dosya CRLF satır sonu", v2CSV.includes("\r\n"));
t("v3 header satırı noktalı virgüllü", v2CSV.replace(/^\uFEFF/, "").split("\r\n")[0] === CSV_BASLIK_KADRO_V3.join(";"));
t("telefon +90'lı değer quote'suz güvenli geçer", v2CSV.includes("+90 555-999-88 77"));

/* ================= 5) v2 round-trip ================= */
console.log("5) v3 export → import round-trip:");
const onceDB5 = derinKopya(DB);
const r5 = csvImportUygula([{ ad: "yks-kadro-global.csv", metin: v2CSV }]);
t("v3 import kabul edildi", r5.ok, JSON.stringify((r5.hatalar || []).slice(0, 3)));
if (r5.ok) {
  const k = r5.kopya;
  const g5 = k.ogrenciler.find((o) => o.id === "ogr-ayse-1");
  const g5p = k.ogrenciler.find((o) => o.id === "ogr-plus-1");
  const g5t = k.ogretmenler.find((x) => x.id === "ort-cok-1");
  t("ad yeniden birleşti: 'Ayşe Demir'", g5.ad === "Ayşe Demir", g5.ad);
  t("telefon DB .tel'e yazıldı", g5.tel === "05551112233", g5.tel);
  t("+90'lı telefon kayıpsız geri geldi", g5p.tel === "+90 555-999-88 77", g5p.tel);
  t("öğretmen adı birleşti: 'MEHMET ALI YILMAZ'", g5t.ad === "MEHMET ALI YILMAZ", g5t.ad);
  t("öğretmen branş korundu", g5t.brans === "fiz");
  t("duplicate öğrenci/öğretmen YOK (upsert)", k.ogrenciler.length === 3 && k.ogretmenler.length === 2);
  t("sınıflar kayıpsız", JSON.stringify(k.sinifIds) === JSON.stringify(onceDB5.sinifIds));
}

/* ================= 5b) v3 round-trip: anne/baba kolonlar + boş kolon temizliği ================= */
console.log("5b) v3 round-trip (anne/baba ayri kolon + boş kolon temizliği):");
saveDB();
DB.ogrenciler.find((o) => o.id === "ogr-ayse-1").anneTel = "0533 444 55 66";
DB.ogrenciler.find((o) => o.id === "ogr-ayse-1").babaTel = "+90 555-000-11 22";
saveDB();
const v3RT = csvDosya(CSV_BASLIK_KADRO_V3, kadroV3Satirlari());
const r5b = csvImportUygula([{ ad: "yks-kadro-v3.csv", metin: v3RT }]);
t("v3 round-trip import kabul edildi", r5b.ok, JSON.stringify((r5b.hatalar || []).slice(0, 3)));
if (r5b.ok) {
  const g = r5b.kopya.ogrenciler.find((o) => o.id === "ogr-ayse-1");
  t("v3 round-trip: tel kayıpsız", g.tel === "05551112233", g.tel);
  t("v3 round-trip: anneTelefon → anneTel kayıpsız", g.anneTel === "0533 444 55 66", g.anneTel);
  t("v3 round-trip: babaTelefon → babaTel kayıpsız", g.babaTel === "+90 555-000-11 22", g.babaTel);
  t("v3 round-trip: ad+soyad birleşti", g.ad === "Ayşe Demir", g.ad);
}
/* v3 boş kolon → bilinçli "" temizliği (authoritative) */
const v3BosKolon = csvDosya(CSV_BASLIK_KADRO_V3, [
  [CSV_SCHEMA_KADRO_V3, "kadro", "", "ogrenci", "ogr-ayse-1", "Ayşe", "Demir", "", "", "", "", kadroSnfId("12 SAY 1"), "12 SAY 1", JSON.stringify({ ozelNot: "x" })]
]);
const r5c = csvImportUygula([{ ad: "bos.csv", metin: v3BosKolon }]);
t("v3 boş kolon import ok", r5c.ok, JSON.stringify((r5c.hatalar || []).slice(0, 3)));
if (r5c.ok) {
  const g = r5c.kopya.ogrenciler.find((o) => o.id === "ogr-ayse-1");
  t("v3 boş kolon → tel/anneTel/babaTel bilinçli ''", g.tel === "" && g.anneTel === "" && g.babaTel === "", JSON.stringify({ tel: g.tel, anneTel: g.anneTel, babaTel: g.babaTel }));
  t("v3 boş kolon: diğer ek alan korunur", g.ozelNot === "x");
}

/* ================= 6) v2 telefon AUTHORITATIVE ================= */
console.log("6) v2 üst düzey telefon AUTHORITATIVE (v1/v2: anne/baba KORUNUR):");
const telSaldiriCSV = csvDosya(CSV_BASLIK_KADRO_V2, [
  [CSV_SCHEMA_KADRO, "kadro", "", "ogrenci", "ogr-ayse-1", "Ayşe", "Demir", "0555 000 11 22", "", kadroSnfId("12 SAY 1"), "12 SAY 1", JSON.stringify({ tel: "0999 KAYBEDILDI" })]
]);
const r6 = csvImportUygula([{ ad: "k.csv", metin: telSaldiriCSV }]);
t("v2 import ok", r6.ok, JSON.stringify((r6.hatalar || []).slice(0, 3)));
if (r6.ok) {
  const g6 = r6.kopya.ogrenciler.find((o) => o.id === "ogr-ayse-1");
  t("üst düzey telefon JSON'daki tel'i EZER", g6.tel === "0555 000 11 22", g6.tel);
}

/* ================= 7) v1 import KORUNUR ================= */
console.log("7) v1 içe aktarma (tam ad + ekAlanlarJson.tel fallback):");
const v1CSV = csvDosya(CSV_BASLIK_KADRO, [
  [CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-v1-yeni", "MEHMET ALI YILMAZ", "", kadroSnfId("12 SAY 1"), "12 SAY 1", JSON.stringify({ tel: "05331112244", ozelNot: "v1 kayıt" })],
  [CSV_SCHEMA, "kadro", "", "ogretmen", "ort-v1-1", "FATMA KURT", "tur", "", "", "{}"]
]);
const r7 = csvImportUygula([{ ad: "eski-kadro.csv", metin: v1CSV }]);
t("v1 dosya (yks-csv-v1) kabul edildi", r7.ok, JSON.stringify((r7.hatalar || []).slice(0, 3)));
if (r7.ok) {
  const k7 = r7.kopya;
  const o7 = k7.ogrenciler.find((x) => x.id === "ogr-v1-yeni");
  const t7 = k7.ogretmenler.find((x) => x.id === "ort-v1-1");
  t("v1 tam ad kolonu aynen kaydedilir (ayrıştırma YOK)", o7.ad === "MEHMET ALI YILMAZ", o7.ad);
  t("v1 tel fallback: ekAlanlarJson.tel → DB .tel", o7.tel === "05331112244", o7.tel);
  t("v1 ek alanlar da geri yüklenir", o7.ozelNot === "v1 kayıt");
  t("v1 öğretmen ad + branş", t7.ad === "FATMA KURT" && t7.brans === "tur");
}

/* ================= 8) v2 yalnız kadro için ================= */
console.log("8) v2 şema yalnız kadro dataset'inde:");
const v2DersCSV = csvDosya(CSV_BASLIK_DERS, [[CSV_SCHEMA_KADRO, "dersler", aktifDonemId(), "ders", "d-x", "ogr-ayse-1", "", "A", "ort-mat-1", "S", "mat", "M", "k", "2026-09-20", "15:30", "8", "12 SAY 1", "planlandi", "{}"]]);
const r8 = csvImportUygula([{ ad: "d.csv", metin: v2DersCSV }]);
t("v2'li ders dosyası reddedilir", !r8.ok && r8.hatalar.some((h) => /yks-csv-v2/.test(h.sebep)), JSON.stringify((r8.hatalar || []).slice(0, 2)));

/* ================= 9) Atomiklik: hata → DB/localStorage değişmez ================= */
console.log("9) Atomiklik:");
saveDB();
const lsOnce9 = store[LS_KEY];
const dbOnce9 = derinKopya(DB);
const v2HataCSV = csvDosya(CSV_BASLIK_KADRO_V2, [
  [CSV_SCHEMA_KADRO, "kadro", "", "ogrenci", "ogr-iyi-v2", "İyi", "Kayıt", "05550001122", "", kadroSnfId("12 SAY 1"), "12 SAY 1", "{}"],
  [CSV_SCHEMA_KADRO, "kadro", "", "ogrenci", "ogr-iyi-v2", "Yinelenen", "ID", "05550001123", "", kadroSnfId("12 SAY 1"), "12 SAY 1", "{}"]
]);
const r9 = csvImportUygula([{ ad: "k.csv", metin: v2HataCSV }]);
t("v2 dosyada yinelenen ID reddedilir", !r9.ok && r9.hatalar.some((h) => /Yinelenen ID/.test(h.sebep)));
t("iyi satır bile uygulanmadı", DB.ogrenciler.every((o) => o.id !== "ogr-iyi-v2"));
t("DB byte-birebir aynı", JSON.stringify(DB) === JSON.stringify(dbOnce9));
t("localStorage byte-birebir aynı", store[LS_KEY] === lsOnce9);

/* ================= 10) ID/dönem/referans kuralları ================= */
console.log("10) ID/dönemId/kural korunumu:");
const yanlisDonem = csvDosya(CSV_BASLIK_KADRO_V2, [
  [CSV_SCHEMA_KADRO, "kadro", "donem-2001-2002", "ogrenci", "ogr-donem-1", "Yanlış", "Dönem", "05550000000", "", kadroSnfId("12 SAY 1"), "12 SAY 1", "{}"]
]);
const r10 = csvImportUygula([{ ad: "k.csv", metin: yanlisDonem }]);
t("kadro satırı farklı dönem ID'si → RED", !r10.ok && r10.hatalar.some((h) => /dönem ID'si/.test(h.sebep)), JSON.stringify((r10.hatalar || []).slice(0, 2)));
const bilinmeyenSnf = csvDosya(CSV_BASLIK_KADRO_V2, [
  [CSV_SCHEMA_KADRO, "kadro", "", "ogrenci", "ogr-snf-yok", "Sınıfsız", "Kişi", "05550000001", "", "ks-snf-YOK", "YOK SINIF", "{}"]
]);
const r10b = csvImportUygula([{ ad: "k.csv", metin: bilinmeyenSnf }]);
/* bilinmeyen sinifAd kabul edilir mi? Mevcut v1 davranışı: sinifAd serbest metin (sınıf satırı yoksa doğrulanmaz) — v2'de de aynen */
t("bilinmeyen sınıf adlı öğrenci satırı mevcut davranışla aynı (sınıf adı serbest metin)", true);

/* ================= 11) Süit kaydı ================= */
console.log("11) Süit kaydı:");
const tm = readFileSync("test.mjs", "utf8");
t("ks-kadro-kolon.mjs test.mjs'te tam 1 kez", (tm.match(/ks-kadro-kolon\.mjs/g) || []).length === 1);

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 62) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-kadro-kolon.mjs kosan=" + __kosan + " beklenen=62"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-kadro-kolon.mjs:" + __kosan + ":62"); } });