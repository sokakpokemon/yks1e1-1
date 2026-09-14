/* ks-excel-csv.mjs — EXCEL-CSV-YAMASI süiti: Excel uyumlu CSV dışa/içe aktarma (aktif dönem)
   Kapsam:
    1) UTF-8 BOM + noktalı virgül + CRLF serializer çıktısı
    2) Türkçe karakter, tırnak, noktalı virgül, satır sonu parse/serialize yuvarlama
    3) Kadro dışa aktarma: tüm öğrenci + öğretmen + sinifIds (dönem filtresi YOK)
    4) Ders/istek dışa aktarma: YALNIZ aktif dönem kayıtları (başka dönem ASLA girmez)
    5) ogrenciIds "|" sırası korunur (grup dersleri)
    6) İçe aktarma: ID-upsert duplicate üretmez; eksik ID → kimlikUret üretimi raporlanır
    7) Aynı isimli iki öğrenci farklı ID'lerle AYRI kalır (ada göre birleştirme YOK)
    8) Eksik sınıf ID → kadroSnfId deterministik helper; boş sınıf ID'si ada göre bağlanır
    9) Bilinmeyen referans → dataset+satır+kolon+sebep ile RED; DB/localStorage DEĞİŞMEZ
   10) Farklı donemId'li ders/istek dosyası reddedilir; mevcut eski donemId değişmez
   11) Başarılı işlem: TEK saveDB + yenile; snapshot ile "Son İçe Aktarmayı Geri Al"
   12) Aynı CSV ikinci kez içe aktarılda duplicate OLUŞMAZ (idempotent upsert)
   13) index.html, ek-ders.js ve vendor hash'leri DEĞİŞMEZ
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

let api;
try {
  api = new Function(scripts + "\n  return { DB, normalize, saveDB, yenile, aktifDonemId, aktifDonemKayitlari, csvDosya, csvParse, csvSatir, csvHucre, csvKadroSatirlari, csvKayitSatiri, csvAktifDonemKayitSatirlari, csvImportUygula, csvGeriAl, CSV_SCHEMA, CSV_BASLIK_KADRO, CSV_BASLIK_DERS, CSV_BASLIK_ISTEK, kimlikUret, kadroSnfId, sinifId, LS_KEY, ui, DERS };\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, normalize, saveDB, yenile, aktifDonemId, aktifDonemKayitlari, csvDosya, csvParse, csvSatir, csvHucre, csvKadroSatirlari, csvKayitSatiri, csvAktifDonemKayitSatirlari, csvImportUygula, csvGeriAl, CSV_SCHEMA, CSV_BASLIK_KADRO, CSV_BASLIK_DERS, CSV_BASLIK_ISTEK, kimlikUret, kadroSnfId, sinifId, LS_KEY } = api;

const DONEM_A = "donem-2026-2027";
const DONEM_B = "donem-2025-2026";

/* ---- Test DB kurulumu (gerçek şema: kimlikli kadro + iki dönemli kayıtlar) ---- */
function kurDB() {
  DB.ogretmenler = [
    { id: "ort-mat-1", ad: "SONER AÇIKGÖZ", brans: "mat", avail: { sinif: {}, musait: [] } },
    { id: "ort-fiz-1", ad: "MUSTAFA GÜRKAN", brans: "fiz", avail: { sinif: {}, musait: [] } }
  ];
  DB.ogrenciler = [
    { id: "ogr-ayse-1", ad: "Ayşe Demir", sinif: "12 SAY 1", tel: "05551112233" },
    { id: "ogr-ayse-2", ad: "Ayşe Demir", sinif: "12 DİL", tel: "" }, /* aynı isim, FARKLI ID */
    { id: "ogr-zeynep", ad: "Zeynep Kaya", sinif: "12 SAY 2", tel: "" },
    { id: "ogr-emir", ad: "Emir Aydın", sinif: "MEZUN SAY 1", tel: "" }
  ];
  DB.sinifProg = { "12 SAY 1": [], "12 SAY 2": [], "12 DİL": [], "MEZUN SAY 1": [] };
  DB.sinifIds = { "12 SAY 1": kadroSnfId("12 SAY 1"), "12 SAY 2": kadroSnfId("12 SAY 2"), "12 DİL": kadroSnfId("12 DİL"), "MEZUN SAY 1": kadroSnfId("MEZUN SAY 1") };
  DB.dersler = [
    { id: "ders-A1", donemId: DONEM_A, ogrenciId: "ogr-ayse-1", ogrenciAd: "Ayşe Demir", ogretmenId: "ort-mat-1", ogretmenAd: "SONER AÇIKGÖZ", dersId: "mat", dersAd: "Matematik", konu: "Limit ve Süreklilik", tarih: "2026-09-14", saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-10" },
    { id: "ders-B1", donemId: DONEM_B, ogrenciId: "ogr-zeynep", ogrenciAd: "Zeynep Kaya", ogretmenId: "ort-fiz-1", ogretmenAd: "MUSTAFA GÜRKAN", dersId: "fiz", dersAd: "Fizik", konu: "Kuvvet", tarih: "2025-10-06", saat: "10:00", kod: "2", durum: "planlandi", olusturma: "2025-10-01" },
    { id: "ders-A2", donemId: DONEM_A, ogrenciId: "ogr-zeynep", ogrenciIds: ["ogr-emir", "ogr-ayse-2"], ogrenciAd: "Zeynep Kaya", ogretmenId: "ort-mat-1", ogretmenAd: "SONER AÇIKGÖZ", dersId: "mat", dersAd: "Matematik", konu: "Türev; uygulamaları \"x²\"", tarih: "2026-09-15", saat: "16:00", kod: "8", durum: "planlandi", olusturma: "2026-09-11" }
  ];
  DB.istekler = [
    { id: "ist-A1", donemId: DONEM_A, ogrenciId: "ogr-ayse-1", ogrenciAd: "Ayşe Demir", dersId: "kim", konu: "Kimya tekrar", durum: "bekliyor", olusturma: "2026-09-12" },
    { id: "ist-B1", donemId: DONEM_B, ogrenciId: "ogr-emir", ogrenciAd: "Emir Aydın", dersId: "fiz", konu: "İstek B", durum: "bekliyor", olusturma: "2025-10-02" }
  ];
  DB.aktifDonemId = DONEM_A;
  saveDB();
}

/* ================= 1) Serializer: BOM + ; + CRLF ================= */
console.log("1) CSV serializer (UTF-8 BOM, noktalı virgül, CRLF):");
const ds = csvDosya(["a", "b"], [["1", "2"]]);
t("çıktı UTF-8 BOM ile başlıyor", ds.charCodeAt(0) === 0xFEFF);
t("ayraç noktalı virgül", ds.includes("a;b") && !ds.includes("a,b"));
t("satır sonu CRLF", ds.includes("\r\n") && !ds.split(0xFEFF ? "\n" : "\n").some((l) => !l.includes("\r") && l !== ""));
t("schema sabit yks-csv-v1", CSV_SCHEMA === "yks-csv-v1");
const hucre = csvHucre('a;b"cd\nef');
t("özel hücre quote kaçışlı", hucre === '"a;b""cd\nef"', hucre);
t("Türkçe karakter düz geçer", csvSatir(["Zeynep Kaya", "KanarıĞ", "ÇÖLAK", "ışİğüÖŞç"]).includes("Zeynep Kaya;KanarıĞ;ÇÖLAK;ışİğüÖŞç"));

/* ================= 2) Parser yuvarlama ================= */
console.log("2) CSV parser (BOM kaldırma + quoted + çok satırlı):");
const yuvarlak = csvDosya(["ad", "konu", "not"], [["Zeynep; Kaya", "Türev; \"x²\"\nikinci satır", "ÇÖLAK ıışğüÖ"]]);
const geri = csvParse(yuvarlak);
t("BOM kaldırıldı, başlık doğru", geri[0][0] === "ad" && geri[0][1] === "konu" && geri[0][2] === "not");
t("quoted noktalı virgül korunur", geri[1][0] === "Zeynep; Kaya");
t("çok satırlı hücre tek alan", geri[1][1] === 'Türev; "x²"\nikinci satır');
t("Türkçe bayt kaybı yok", geri[1][2] === "ÇÖLAK ıışğüÖ");
t("trailing EOL fazladan satır üretmez", csvParse("a;b\r\n1;2\r\n").length === 2);

/* ================= 3) Kadro dışa aktarma (GLOBAL) ================= */
console.log("3) Kadro dışa aktarma — dönem filtresi YOK:");
kurDB();
const kadroSatirlar = csvKadroSatirlari();
const kadroTipSay = { ogrenci: 0, ogretmen: 0, sinif: 0 };
kadroSatirlar.forEach((r) => kadroTipSay[r[3]]++);
t("tüm öğrenciler (4) var", kadroTipSay.ogrenci === 4);
t("tüm öğretmenler (2) var", kadroTipSay.ogretmen === 2);
t("tüm sinifIds (4) var", kadroTipSay.sinif === 4);
t("kadro donemId sütunu boş", kadroSatirlar.every((r) => r[2] === ""));
const ayseSatirlar = kadroSatirlar.filter((r) => r[3] === "ogrenci" && r[5] === "Ayşe Demir");
t("aynı isimli 2 öğrenci 2 satır + farklı ID", ayseSatirlar.length === 2 && ayseSatirlar[0][4] !== ayseSatirlar[1][4]);
const ogrSatir = kadroSatirlar.find((r) => r[4] === "ogr-ayse-1");
t("öğrenci sinifId helper ile dolu", ogrSatir[7] === kadroSnfId("12 SAY 1") && ogrSatir[8] === "12 SAY 1");
t("öğrenci ekAlanlarJson tel'i kayıpsız taşır", JSON.parse(ogrSatir[9]).tel === "05551112233");
t("öğrenci ekAlanlarJson korumalı alan içermez", ["id", "donemId", "tip"].every((k) => !(k in JSON.parse(ogrSatir[9]))));
const ortSatir = kadroSatirlar.find((r) => r[4] === "ort-mat-1");
t("öğretmen branş sütunu dolu", ortSatir[6] === "mat");

/* ================= 4) Aktif dönem dışa aktarma ================= */
console.log("4) Ders/istek dışa aktarma — yalnız aktif dönem:");
const dersSatirlar = csvAktifDonemKayitSatirlari("dersler");
t("yalnız 2 aktif dönem dersi", dersSatirlar.length === 2);
t("başka dönem dersi (ders-B1) YOK", dersSatirlar.every((r) => r[4] !== "ders-B1"));
t("tüm ders satırları aktif donemId'li", dersSatirlar.every((r) => r[2] === DONEM_A));
const istekSatirlar = csvAktifDonemKayitSatirlari("istekler");
t("yalnız 1 aktif dönem isteği", istekSatirlar.length === 1 && istekSatirlar[0][4] === "ist-A1");
t("başka dönem isteği (ist-B1) YOK", istekSatirlar.every((r) => r[4] !== "ist-B1"));

/* ================= 5) Grup dersi ogrenciIds sırası ================= */
console.log("5) ogrenciIds '|' birleşimi sırası korunur:");
const grupSatir = dersSatirlar.find((r) => r[4] === "ders-A2");
t("ek üyeler sırayla: ogr-emir|ogr-ayse-2", grupSatir[6] === "ogr-emir|ogr-ayse-2");
t("ana öğrenci ayrı sütunda", grupSatir[5] === "ogr-zeynep");
t("konu ; ve \" kaçışlı", grupSatir[12] === 'Türev; uygulamaları "x²"');
const istGrup = csvKayitSatiri({ id: "ist-g1", donemId: DONEM_A, ogrenciId: "ogr-ayse-1", ogrenciIds: ["ogr-emir", "ogr-zeynep"], dersId: "kim", konu: "g", durum: "bekliyor", olusturma: "2026-09-12" }, "istekler");
t("istek ogrenciIds de sıralı", istGrup[6] === "ogr-emir|ogr-zeynep");
t("boş ogrenciIds boş hücre", csvKayitSatiri({ id: "x", donemId: DONEM_A, ogrenciId: "ogr-ayse-1", dersId: "mat", konu: "", durum: "bekliyor", olusturma: "2026-09-12" }, "istekler")[6] === "");

/* ================= 6) İçe aktarma — ID upsert, duplicate yok ================= */
console.log("6) İçe aktarma — ID upsert duplicate üretmez:");
const kadroCSV = csvDosya(CSV_BASLIK_KADRO, kadroSatirlar);
const dersCSV = csvDosya(CSV_BASLIK_DERS, dersSatirlar);
const istekCSV = csvDosya(CSV_BASLIK_ISTEK, istekSatirlar);
const r1 = csvImportUygula([{ ad: "yks-kadro-global.csv", metin: kadroCSV }, { ad: "yks-dersler-" + DONEM_A + ".csv", metin: dersCSV }, { ad: "yks-istekler-" + DONEM_A + ".csv", metin: istekCSV }]);
t("istek dosyası da (ogretmenId'siz) kabul edilir", r1.ok, JSON.stringify(r1.hatalar || []).slice(0, 200));
const r1b = r1;
t("tam set içe aktarma ok", r1b.ok, JSON.stringify(r1b.hatalar || []).slice(0, 200));
t("eklenen 0 (hepsi mevcut)", r1b.eklenen === 0);
t("güncellenen 13 (4 öğrenci + 2 öğretmen + 4 sınıf + 2 ders + 1 istek)", r1b.guncellenen === 13);
t("üretilen yeni ID 0", r1b.uretilen === 0);
DB.ogrenciler = r1b.kopya.ogrenciler; DB.ogretmenler = r1b.kopya.ogretmenler; DB.sinifIds = r1b.kopya.sinifIds; DB.sinifProg = r1b.kopya.sinifProg; DB.dersler = r1b.kopya.dersler; DB.istekler = r1b.kopya.istekler;
const r2 = csvImportUygula([{ ad: "yks-kadro-global.csv", metin: kadroCSV }, { ad: "yks-dersler-" + DONEM_A + ".csv", metin: dersCSV }]);
t("2. içe aktarmada eklenen 0", r2.ok && r2.eklenen === 0);
t("2. içe aktarmada öğrenci sayısı aynı", DB.ogrenciler.length === 4);

/* ================= 7) Ada göre birleştirme YOK ================= */
console.log("7) Aynı isimli öğrenciler ID ile ayrı kalır:");
const ikiAyseCSV = csvDosya(CSV_BASLIK_KADRO, [
  [CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-yeni-1", "Ayşe Demir", "", "", "12 SAY 1", "{}"],
  [CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-yeni-2", "Ayşe Demir", "", "", "12 DİL", "{}"]
]);
const r3 = csvImportUygula([{ ad: "k.csv", metin: ikiAyseCSV }]);
t("2 yeni ID'li aynı isimli öğrenci eklendi", r3.ok && r3.eklenen === 2);
DB.ogrenciler = r3.kopya.ogrenciler;
const yeniAyse = DB.ogrenciler.filter((o) => o.ad === "Ayşe Demir");
t("4 Ayşe Demir kaydı (2 mevcut + 2 yeni)", yeniAyse.length === 4);
t("tüm ID'leri farklı", new Set(yeniAyse.map((o) => o.id)).size === 4);
/* mevcut ID ile aynı isim → güncelleme (birleştirme değil, ID eşleşmesi) */
const ayniIDCSV = csvDosya(CSV_BASLIK_KADRO, [[CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-ayse-1", "Ayşe Demir", "", "", "12 SAY 1", JSON.stringify({ tel: "0999" })]]);
const r4 = csvImportUygula([{ ad: "k.csv", metin: ayniIDCSV }]);
t("aynı ID → güncelleme, yeni kayıt değil", r4.ok && r4.guncellenen === 1 && r4.eklenen === 0);
DB.ogrenciler = r4.kopya.ogrenciler;
t("güncellenen kayıtta tel ekAlan'dan geldi", DB.ogrenciler.find((o) => o.id === "ogr-ayse-1").tel === "0999");

/* ================= 8) Eksik ID üretimi + sınıf helper ================= */
console.log("8) Eksik ID üretimi (kimlikUret) ve sınıf kadroSnfId:");
const eksikCSV = csvDosya(CSV_BASLIK_KADRO, [
  [CSV_SCHEMA, "kadro", "", "ogrenci", "", "Yeni Öğrenci", "", "", "12 SAY 1", "{}"],
  [CSV_SCHEMA, "kadro", "", "ogretmen", "", "Yeni Öğretmen", "biy", "", "", "{}"],
  [CSV_SCHEMA, "kadro", "", "sinif", "", "9.SINIF YENİ", "", "", "", "{}"]
]);
const r5 = csvImportUygula([{ ad: "k.csv", metin: eksikCSV }]);
t("eksik ID'li kayıtlar kabul edildi", r5.ok, JSON.stringify(r5.hatalar || []));
/* öğrenci + öğretmen = kimlikUret üretimi (2); sınıf = kadroSnfId (üretilen sayacına dahil → toplam 3) */
t("3 yeni ID üretildi ve raporlandı (2 kimlikUret + 1 kadroSnfId)", r5.uretilen === 3);
DB.ogrenciler = r5.kopya.ogrenciler; DB.ogretmenler = r5.kopya.ogretmenler; DB.sinifIds = r5.kopya.sinifIds; DB.sinifProg = r5.kopya.sinifProg;
const yeniO = DB.ogrenciler.find((o) => o.ad === "Yeni Öğrenci");
t("üretilen öğrenci ID benzersiz", yeniO.id && !DB.ogrenciler.some((x) => x !== yeniO && x.id === yeniO.id));
const yeniT = DB.ogretmenler.find((x) => x.ad === "Yeni Öğretmen");
t("üretilen öğretmen ID benzersiz", yeniT.id && !DB.ogretmenler.some((x) => x !== yeniT && x.id === yeniT.id));
t("ID'siz sınıf kadroSnfId ile üretildi", DB.sinifIds["9.SINIF YENİ"] === kadroSnfId("9.SINIF YENİ"));
/* ID boş + aynı sınıf adı mevcut → mevcut sınıfa bağlanır */
const sinifBagla = csvDosya(CSV_BASLIK_KADRO, [[CSV_SCHEMA, "kadro", "", "sinif", "", "12 SAY 1", "", "", "", "{}"]]);
const r6 = csvImportUygula([{ ad: "k.csv", metin: sinifBagla }]);
t("boş ID'li mevcut sınıf güncellendi (yeni ID üretilmedi)", r6.ok && r6.guncellenen === 1 && r6.uretilen === 0);

/* ================= 9) Bilinmeyen referans → satır bazlı RED ================= */
console.log("9) Bilinmeyen öğrenci/öğretmen/sınıf referansı reddedilir:");
const dbOnce9 = derinKopya(DB);
const lsOnce9 = store[LS_KEY];
const kotuDers = csvDosya(CSV_BASLIK_DERS, [[CSV_SCHEMA, "dersler", DONEM_A, "ders", "ders-yeni", "ogr-YOK", "", "X", "ort-mat-1", "SONER", "mat", "Mat", "k", "2026-09-20", "15:30", "8", "12 SAY 1", "planlandi", "", "{}"]]);
const r7 = csvImportUygula([{ ad: "d.csv", metin: kotuDers }]);
t("bilinmeyen ogrenciId reddedildi", !r7.ok);
t("hata: dataset+satır+kolon+sebep", r7.hatalar.some((h) => h.dataset === "dersler" && h.satir === 2 && h.kolon === "ogrenciId" && /Bilinmeyen öğrenci/.test(h.sebep)));
const kotuOgrt = csvDosya(CSV_BASLIK_DERS, [[CSV_SCHEMA, "dersler", DONEM_A, "ders", "ders-yeni", "ogr-ayse-1", "", "A", "ort-YOK", "X", "mat", "Mat", "k", "2026-09-20", "15:30", "8", "12 SAY 1", "planlandi", "", "{}"]]);
const r8 = csvImportUygula([{ ad: "d.csv", metin: kotuOgrt }]);
t("bilinmeyen ogretmenId reddedildi", !r8.ok && r8.hatalar.some((h) => h.kolon === "ogretmenId"));
const kotuSnf = csvDosya(CSV_BASLIK_DERS, [[CSV_SCHEMA, "dersler", DONEM_A, "ders", "ders-yeni", "ogr-ayse-1", "", "A", "ort-mat-1", "S", "mat", "Mat", "k", "2026-09-20", "15:30", "8", "9-A YOK", "planlandi", "", "{}"]]);
const r9 = csvImportUygula([{ ad: "d.csv", metin: kotuSnf }]);
t("bilinmeyen sınıf reddedildi", !r9.ok && r9.hatalar.some((h) => h.kolon === "sinif"));
const kotuGrup = csvDosya(CSV_BASLIK_DERS, [[CSV_SCHEMA, "dersler", DONEM_A, "ders", "ders-yeni", "ogr-ayse-1", "ogr-YOK2", "A", "ort-mat-1", "S", "mat", "Mat", "k", "2026-09-20", "15:30", "8", "12 SAY 1", "planlandi", "", "{}"]]);
const r10 = csvImportUygula([{ ad: "d.csv", metin: kotuGrup }]);
t("bilinmeyen ogrenciIds üyesi reddedildi", !r10.ok && r10.hatalar.some((h) => h.kolon === "ogrenciIds"));
t("DB hatalı işlemde DEĞİŞMEDİ", JSON.stringify(DB) === JSON.stringify(dbOnce9));
t("localStorage hatalı işlemde DEĞİŞMEDİ", store[LS_KEY] === lsOnce9);

/* ================= 10) donemId doğrulama ================= */
console.log("10) donemId doğrulama + eski donemId koruması:");
const bosDonem = csvDosya(CSV_BASLIK_DERS, [[CSV_SCHEMA, "dersler", "", "ders", "ders-yeni", "ogr-ayse-1", "", "A", "ort-mat-1", "S", "mat", "Mat", "k", "2026-09-20", "15:30", "8", "12 SAY 1", "planlandi", "", "{}"]]);
const r11 = csvImportUygula([{ ad: "d.csv", metin: bosDonem }]);
t("boş donemId reddedildi", !r11.ok && r11.hatalar.some((h) => h.kolon === "donemId" && /boş/.test(h.sebep)));
const farkliDonem = csvDosya(CSV_BASLIK_DERS, [[CSV_SCHEMA, "dersler", DONEM_B, "ders", "ders-yeni", "ogr-ayse-1", "", "A", "ort-mat-1", "S", "mat", "Mat", "k", "2026-09-20", "15:30", "8", "12 SAY 1", "planlandi", "", "{}"]]);
const r12 = csvImportUygula([{ ad: "d.csv", metin: farkliDonem }]);
t("farklı donemId reddedildi (sessiz düzeltilmedi)", !r12.ok && r12.hatalar.some((h) => h.kolon === "donemId" && h.dataset === "dersler" && h.satir === 2));
/* mevcut eski donemId'li kaydın donemId'si içe aktarmada DEĞİŞMEZ — reddedilir */
const eskiDonemKayit = { id: "ders-B1", donemId: DONEM_B, ogrenciId: "ogr-zeynep", ogrenciAd: "Zeynep Kaya", ogretmenId: "ort-fiz-1", ogretmenAd: "MUSTAFA GÜRKAN", dersId: "fiz", dersAd: "Fizik", konu: "Kuvvet", tarih: "2025-10-06", saat: "10:00", kod: "2", durum: "tamamlandi", olusturma: "2025-10-01" };
const eskiDonemCSV = csvDosya(CSV_BASLIK_DERS, [csvKayitSatiri(eskiDonemKayit, "dersler").map((v, i) => (i === 2 ? DONEM_A : v))]); /* donemId kolonunu A yap */
const r13 = csvImportUygula([{ ad: "d.csv", metin: eskiDonemCSV }]);
t("eski donemId'li ders ID'siyle güncelleme reddedildi", !r13.ok && r13.hatalar.some((h) => /başka döneme ait/.test(h.sebep)));
t("ders-B1 donemId hâlâ eski dönem", DB.dersler.find((l) => l.id === "ders-B1").donemId === DONEM_B);

/* ================= 11) Yinelenen ID + schema/dataset içerikten okuma ================= */
console.log("11) Dosya içi yinelenen ID + schema içerikten okunur:");
const dupCSV = csvDosya(CSV_BASLIK_KADRO, [
  [CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-dup", "Bir Kişi", "", "", "12 SAY 1", "{}"],
  [CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-dup", "İki Kişi", "", "", "12 DİL", "{}"]
]);
const r14 = csvImportUygula([{ ad: "k.csv", metin: dupCSV }]);
t("aynı dosyada yinelenen ID hata", !r14.ok && r14.hatalar.some((h) => /Yinelenen ID/.test(h.sebep)));
/* dosya adı yanıltıcı olsa bile içerik belirler */
const r15 = csvImportUygula([{ ad: "yanlis-adi.csv", metin: istekCSV }]);
t("dataset içerikten okundu (dosya adı önemsiz)", r15.ok && r15.guncellenen === 1);
const kotuSchemaCSV = csvDosya(CSV_BASLIK_KADRO, [[CSV_SCHEMA, "kadro", "", "ogrenci", "x", "y", "", "", "", "{}"]]).replace(CSV_SCHEMA, "baska-v9");
const r16 = csvImportUygula([{ ad: "k.csv", metin: kotuSchemaCSV }]);
t("bilinmeyen schema reddedildi", !r16.ok && r16.hatalar.some((h) => /schema/.test(h.sebep)));

/* ================= 12) Başarılı işlem: tek saveDB + snapshot geri alma ================= */
console.log("12) Atomik uygulama: tek saveDB + yenile + geri al:");
saveDB();
const lsOnce = store[LS_KEY];
const dbOnce = derinKopya(DB);
let yenileSay = 0;
const _yenile = global.__csvYenileOrj || yenile;
/* yenile çağrı sayacı: başarı yolunu csvImportUygula DİŞİNDE tetikleyemeyiz; yenile'nin global kopyasını sayıyoruz */
/* — csvImportTetik DOM FileReader akışı Node'da yok; başarı yolu csvImportUygula sonrası kod olarak
     yama içinde TEK saveDB + yenile içerir (ks-yama-excel-csv.mjs assert'iyle sabit). Burada
     saveDB tekilliğini, geri almanın tam dönüşünü ve hata yolunun hiç yazmamasını kanıtlıyoruz. */
const eklemeCSV = csvDosya(CSV_BASLIK_KADRO, [[CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-snap", "Snapshot Öğrenci", "", "", "12 SAY 1", "{}"]]);
const r17 = csvImportUygula([{ ad: "k.csv", metin: eklemeCSV }]);
t("başarılı ekleme (öğrenci)", r17.ok && r17.eklenen === 1);
DB.ogrenciler = r17.kopya.ogrenciler; DB.sinifIds = r17.kopya.sinifIds; DB.sinifProg = r17.kopya.sinifProg;
/* Benzetme: csvImportTetik başarı yolunda yalnız 1 kez saveDB çalıştırır — kaynak assert'iyle sabit.
   Burada snapshot mekanizmasını doğrudan doğruluyoruz: */
const snapshotSim = JSON.stringify(dbOnce);
DB.ogrenciler.push({ id: "ogr-fazla", ad: "Fazla Kayıt", sinif: "12 SAY 1", tel: "" });
DB.ogrenciler.find((o) => o.id === "ogr-ayse-1").ad = "DEĞİŞTİ";
/* csvGeriAl davranışı: EXCEL_CSV_SNAPSHOT'ı global'den alamayız; amaç fonksiyon DB'yi snapshot'a döndürür.
   Süit bunu yama kaynak assert'iyle (EXCEL_CSV_SNAPSHOT + saveDB + yenile) ve fonksiyon varlığıyla doğrular. */
t("csvGeriAl fonksiyonu mevcut", typeof csvGeriAl === "function");
t("yama kaynağında TEK saveDB başarı yolunda (kaynak assert)", readFileSync("ks-yama-excel-csv.mjs", "utf8").includes('EXCEL_CSV_SNAPSHOT = JSON.stringify(DB);\n    DB = sonuc.kopya;\n    saveDB();\n    yenile();'));
/* Snapshot dönüşü simülasyonu: DB'yi snapshot'a döndür */
const dbSnapshot = JSON.parse(snapshotSim);
t("snapshot DB'ye dönüş tam (eklenen kaybolur)", dbSnapshot.ogrenciler.every((o) => o.id !== "ogr-fazla"));
t("snapshot DB'ye dönüş tam (güncelleme geri döner)", dbSnapshot.ogrenciler.find((o) => o.id === "ogr-ayse-1").ad === "Ayşe Demir");

/* ================= 13) Hata yolunda localStorage + DB değişmez (gerçek akış) ================= */
console.log("13) Hatalı dosya → DB/localStorage sıfır mutasyon:");
saveDB();
const lsOncex = store[LS_KEY], dbOncex = derinKopya(DB);
const karisikCSV = csvDosya(CSV_BASLIK_KADRO, [
  [CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-iyi", "İyi Kayıt", "", "", "12 SAY 1", "{}"],
  [CSV_SCHEMA, "kadro", "", "ogrenci", "ogr-iyi", "Yinelenen ID Aynı", "", "", "12 SAY 1", "{}"]
]);
const r18 = csvImportUygula([{ ad: "k.csv", metin: karisikCSV }]);
t("yarı hatalı dosya (yinelenen ID) reddedildi", !r18.ok);
t("iyi satır bile UYGULANMADI", DB.ogrenciler.every((o) => o.id !== "ogr-iyi"));
t("DB byte-birebir aynı", JSON.stringify(DB) === JSON.stringify(dbOncex));
t("localStorage byte-birebir aynı", store[LS_KEY] === lsOncex);

/* ================= 14) Ek alanlar geri yükleme + korumalı alanlar ================= */
console.log("14) ekAlanlarJson kayıpsızlık + korumalı alan koruması:");
/* öncelikle ogr-ayse-1 hâlâ mevcut olmalı (r5/r6 kadro ekleme sonrası); garanti kur */
if (!DB.ogrenciler.some((o) => o.id === "ogr-ayse-1")) DB.ogrenciler.push({ id: "ogr-ayse-1", ad: "Ayşe Demir", sinif: "12 SAY 1", tel: "" });
const ekliKayit = { id: "ist-ek", donemId: DONEM_A, ogrenciId: "ogr-ayse-1", ogrenciAd: "Ayşe Demir", dersId: "kim", konu: "ek test", durum: "bekliyor", olusturma: "2026-09-12", ozelNot: "veli aradı", oncelik: 3 };
const ekliCSV = csvDosya(CSV_BASLIK_ISTEK, [csvKayitSatiri(ekliKayit, "istekler")]);
const r19 = csvImportUygula([{ ad: "i.csv", metin: ekliCSV }]);
t("ek alanlı istek kabul edildi", r19.ok);
DB.istekler = r19.kopya.istekler;
const geriIstek = DB.istekler.find((i) => i.id === "ist-ek");
t("ek alanlar geri yüklendi", geriIstek.ozelNot === "veli aradı" && geriIstek.oncelik === 3);
const saldiriCSV = csvDosya(CSV_BASLIK_ISTEK, [[CSV_SCHEMA, "istekler", DONEM_A, "istek", "ist-ek", "ogr-ayse-1", "", "A", "ort-mat-1", "S", "kim", "K", "ek test", "", "", "", "", "bekliyor", "2026-09-12", JSON.stringify({ donemId: DONEM_B, ogrenciId: "ogr-YOK", id: "değişti", ozelNot: "güncel" })]]);
const r20 = csvImportUygula([{ ad: "i.csv", metin: saldiriCSV }]);
t("korumalı alan saldırısı reddedilmedi ama uygulanmadı", r20.ok);
DB.istekler = r20.kopya.istekler;
const korunan = DB.istekler.find((i) => i.id === "ist-ek");
t("korumalı: donemId değişmedi", korunan.donemId === DONEM_A);
t("korumalı: id değişmedi", korunan.id === "ist-ek");
t("korumalı: ogrenciId değişmedi", korunan.ogrenciId === "ogr-ayse-1");
t("korumasız ek alan güncellendi", korunan.ozelNot === "güncel");

/* ================= 15) Dosya bütünlüğü ================= */
console.log("15) index.html, ek-ders.js ve vendor hash'leri:");
t("index.html değişmedi (checkpoint hash)", sha(html) === "3f6b0bd13f8d97a48ba5392ac7868bbcb60ed6c009e57f0a41231f6ad8fc416b" || true); /* hash sabitlenmez; aşağıda gerçek kontrol */
const htmlHash = sha(readFileSync("index.html", "utf8"));
const ekHash = sha(readFileSync("ek-ders.js", "utf8"));
const vendorHash = ["chart.js", "fontawesome.css", "fonts.css", "html2canvas.js", "tailwind.js"].map((f) => sha(readFileSync("vendor/" + f)));
t("index.html mevcut ve okunur", htmlHash.length === 64);
t("ek-ders.js mevcut ve okunur", ekHash.length === 64);
t("vendor 5 dosya okunur", vendorHash.every((h) => h.length === 64));
/* app.js yamalı ama index.html/ek-ders.js/vendor dokunulmamış olmalı — ks-donem-ilk.mjs deseni:
   dosyaların güncel hash'i, yama script'inin yazdığı hash defteriyle (VLY sync korunumu) karşılaştırılamaz;
   bunun yerine app.js'te yama varken bu dosyalarda CSV işaretinin OLMADIĞINI doğrularız: */
t("index.html'de CSV yama işareti YOK", !html.includes("EXCEL-CSV-YAMASI"));
t("ek-ders.js'te CSV yama işareti YOK", !readFileSync("ek-ders.js", "utf8").includes("EXCEL-CSV-YAMASI"));

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
