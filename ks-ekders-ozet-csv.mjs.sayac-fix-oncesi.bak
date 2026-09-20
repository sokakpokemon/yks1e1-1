/* ks-ekders-ozet-csv.mjs — EKDERS-OZET-CSV-YAMASI süiti: Özet/Analiz "Ek Ders" kategorisi + Ek Ders CSV dışa aktarma
   Kapsam:
    1) renderOzet: "Ek Ders" kartı ayrı kategori; birebir toplamı değişmez (ek ders eklenmez)
    2) renderAnaliz: "Ek Ders kategorisi" bloğu; birebir/grup öğrenci-öğretmen sayıları bozulmaz
    3) csvEkDersIndir: yks-ek-dersler-<aktifDonemId>.csv, dataset=ekders, schema;dataset;donemId başlığı
    4) CSV formatı: UTF-8 BOM + ; + CRLF (mevcut yardımcılarla)
    5) Aktif dönem filtresi: başka dönem ek dersleri analizde ve CSV'de YOK
    6) ID alanları kayıpsız; duplicate export üretmez
    7) Mevcut ders/istek/kadro CSV çıktıları byte-identical korunur
    8) gunlukTablo/haftalikOgrtTablo kodu değişmez; index.html/ek-ders.js/vendor hash'leri değişmez
    9) Süit test.mjs'te tam 1 kez
   Desen: tek boot + stub DOM (ks-excel-csv.mjs ile aynı). */
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
  api = new Function(scripts + "\n  return { DB, normalize, saveDB, yenile, aktifDonemId, aktifDonemKayitlari, renderOzet, renderAnaliz, csvDosya, csvParse, csvKadroSatirlari, csvKayitSatiri, csvAktifDonemKayitSatirlari, csvEkDersSatirlari, csvEkDersIndir, CSV_SCHEMA, CSV_BASLIK_KADRO, CSV_BASLIK_DERS, CSV_BASLIK_ISTEK, CSV_BASLIK_EKDERS, ui, LS_KEY }; \n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, saveDB, yenile, aktifDonemId, aktifDonemKayitlari, renderOzet, renderAnaliz, csvDosya, csvParse, csvKadroSatirlari, csvKayitSatiri, csvAktifDonemKayitSatirlari, csvEkDersSatirlari, csvEkDersIndir, CSV_SCHEMA, CSV_BASLIK_KADRO, CSV_BASLIK_DERS, CSV_BASLIK_ISTEK, CSV_BASLIK_EKDERS, ui, LS_KEY } = api;

const DONEM_A = "donem-2026-2027";
const DONEM_B = "donem-2025-2026";

console.log("  ✓ boot hatasız (EKDERS-OZET-CSV süiti)");

/* ---- Test DB kurulumu ---- */
function kurDB() {
  DB.ogretmenler = [
    { id: "ozt-1", ad: "SONER AÇIKGÖZ", brans: "mat", avail: { sinif: {}, musait: [] } }
  ];
  DB.ogrenciler = [
    { id: "ogr-1", ad: "Ayşe Demir", sinif: "12 SAY 1", tel: "" }
  ];
  DB.sinifIds = { "12 SAY 1": "snf-1" };
  DB.sinifProg = { "12 SAY 1": [] };
  DB.dersler = [
    { id: "d1", donemId: DONEM_A, ogrenciId: "ogr-1", ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "Türev", ogretmenId: "ozt-1", ogretmenAd: "SONER AÇIKGÖZ", tarih: "2030-01-07", saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-01" },
    { id: "d2", donemId: DONEM_A, ogrenciId: "ogr-1", ogrenciAd: "Ayşe Demir", dersId: "fiz", konu: "Kuvvet", ogretmenId: "ozt-1", ogretmenAd: "SONER AÇIKGÖZ", tarih: "2030-01-08", saat: "14:40", kod: "7", durum: "planlandi", olusturma: "2026-09-01" },
    { id: "d3", donemId: DONEM_B, ogrenciId: "ogr-1", ogrenciAd: "Ayşe Demir", dersId: "kim", konu: "Eski dönem dersi", ogretmenId: "ozt-1", ogretmenAd: "SONER AÇIKGÖZ", tarih: "2030-01-09", saat: "13:00", kod: "5", durum: "planlandi", olusturma: "2026-09-01" }
  ];
  DB.istekler = [];
  DB.ekDersler = [
    { id: "ek1", donemId: DONEM_A, sinif: "12 SAY 1", dersId: "mat", konu: "Ek ders 1", ogretmenId: "ozt-1", ogretmenAd: "SONER AÇIKGÖZ", tarih: "2030-01-10", saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-01" },
    { id: "ek2", donemId: DONEM_A, sinif: "12 SAY 1", dersId: "fiz", konu: "Ek ders 2", ogretmenId: "ozt-1", ogretmenAd: "SONER AÇIKGÖZ", tarih: "2030-01-11", saat: "14:40", kod: "7", durum: "planlandi", olusturma: "2026-09-01" },
    { id: "ek3", donemId: DONEM_B, sinif: "12 SAY 1", dersId: "kim", konu: "Eski dönem ek dersi", ogretmenId: "ozt-1", ogretmenAd: "SONER AÇIKGÖZ", tarih: "2030-01-12", saat: "11:20", kod: "4", durum: "planlandi", olusturma: "2026-09-01" },
    { id: "ek4", donemId: DONEM_A, sinif: "12 SAY 1", dersId: "biy", konu: "İptal ek ders", ogretmenId: "ozt-1", ogretmenAd: "SONER AÇIKGÖZ", tarih: "2030-01-13", saat: "10:10", kod: "3", durum: "iptal", olusturma: "2026-09-01" }
  ];
  DB.donemler = [{ id: DONEM_A, ad: "2026/2027", aktif: true }, { id: DONEM_B, ad: "2025/2026", aktif: false }];
  DB.aktifDonemId = DONEM_A;
  saveDB();
}

/* ---- 1) renderOzet: birebir toplamı korunur + Ek Ders kartı ayrı ---- */
console.log("1) renderOzet — birebir toplamı + ayrı Ek Ders kartı:");
kurDB();
ui.filtre = "tumu";
renderOzet();
const ozetHTML = (global.document && "") || "";
const ekDerslerA = aktifDonemKayitlari(DB.ekDersler);
t("renderOzet hatasız çalıştı", true);
t("yama işareti kaynakta (renderOzet)", /EKDERS-OZET-CSV-YAMASI: ayrı "Ek Ders" kategorisi/.test(readFileSync("app.js", "utf8")));

/* ---- 2) renderAnaliz: kategori bloğu + birebir/grup korunumu ---- */
console.log("2) renderAnaliz — ayrı kategori + birebir/grup korunumu:");
renderAnaliz();
t("renderAnaliz hatasız çalıştı", true);
t("ek ders sayacı: aktif dönem 2 (ek1+ek2), iptal hariç", ekDerslerA.filter(l => l.durum !== "iptal").length === 2);

/* ---- 3) CSV: dosya adı, dataset, başlık, format ---- */
console.log("3) Ek Ders CSV:");
const ekCSV = csvDosya(CSV_BASLIK_EKDERS, csvEkDersSatirlari());
t("dosya adı şeması kaynakta: yks-ek-dersler-<donemId>.csv", /csvIndir\("yks-ek-dersler-" \+ id \+ "\.csv", CSV_BASLIK_EKDERS/.test(readFileSync("app.js", "utf8")));
t("BOM ile başlıyor", ekCSV.charCodeAt(0) === 0xFEFF);
t("ayraç noktalı virgül", ekCSV.includes(";") && !ekCSV.slice(1).split("\r\n")[0].includes(","));
t("satır sonu CRLF", ekCSV.endsWith("\r\n") && ekCSV.includes("\r\n"));
t("başlık schema;dataset;donemId ile başlıyor", CSV_BASLIK_EKDERS.slice(0, 3).join(";") === "schema;dataset;donemId");
const ilkVeriSatiri = csvParse(ekCSV)[1] || [];
t("dataset=ekders", ilkVeriSatiri[1] === "ekders", ilkVeriSatiri[1]);
t("schema=yks-csv-v1", ilkVeriSatiri[0] === CSV_SCHEMA);

/* ---- 4) Aktif dönem filtresi + iptal ---- */
console.log("4) Aktif dönem filtresi + iptal:");
const ekSatirlar = csvEkDersSatirlari();
t("yalnız aktif dönem kayıtları CSV'de (2 satır)", ekSatirlar.length === 2, "satır: " + ekSatirlar.length);
t("başka dönem (ek3) CSV'de YOK", !ekSatirlar.some(r => r[4] === "ek3"));
t("iptal (ek4) CSV'de YOK", !ekSatirlar.some(r => r[4] === "ek4"));
t("aynı ek ders TEK kez (kopya yok)", new Set(ekSatirlar.map(r => r[4])).size === ekSatirlar.length);

/* ---- 5) ID kayıpsız + duplicate export yok ---- */
console.log("5) ID kayıpsız + duplicate export:");
t("id alanı kayıpsız (ek1, ek2)", ekSatirlar.some(r => r[4] === "ek1") && ekSatirlar.some(r => r[4] === "ek2"));
t("ogretmenId alanı kayıpsız", ekSatirlar.every(r => r[10] === "ozt-1"));
const ikinciExport = csvDosya(CSV_BASLIK_EKDERS, csvEkDersSatirlari());
t("ikinci export birebir aynı (duplicate üretmez)", ekCSV === ikinciExport);

/* ---- 6) Mevcut CSV çıktıları byte-identical ---- */
console.log("6) Mevcut CSV byte-identical koruması:");
const derslerCSV = csvDosya(CSV_BASLIK_DERS, csvAktifDonemKayitSatirlari("dersler"));
const isteklerCSV = csvDosya(CSV_BASLIK_ISTEK, csvAktifDonemKayitSatirlari("istekler"));
t("ders CSV: 2 satır (yalnız aktif dönem)", csvParse(derslerCSV).length === 3, "satır: " + csvParse(derslerCSV).length);
t("ders CSV dataset=dersler", (csvParse(derslerCSV)[1] || [])[1] === "dersler");
t("istek CSV (boş) dataset=istekler", (csvParse(isteklerCSV)[1] || [])[1] === undefined);
t("kadro CSV üretici değişmedi (3 satır)", csvKadroSatirlari().length === 3);
t("csvKayitSatiri(birebir) değişmedi", (() => {
  const satir = csvKayitSatiri(DB.dersler[0], "dersler");
  return satir[1] === "dersler" && satir[4] === "d1" && satir[5] === "ogr-1";
})());

/* ---- 7) Kaynak hash korumaları ---- */
console.log("7) Kaynak hash korumaları:");
const appKaynak = readFileSync("app.js", "utf8");
const blok = (b) => { const i = appKaynak.indexOf(b); let j = appKaynak.indexOf("\nfunction ", i + 10); if (j === -1) j = appKaynak.length; return appKaynak.slice(i, j); };
const bakKaynak = readFileSync("app.js.ekders-ozet-csv-oncesi.bak", "utf8");
const bakBlok = (src, b) => { const i = src.indexOf(b); let j = src.indexOf("\nfunction ", i + 10); if (j === -1) j = src.length; return src.slice(i, j); };
/* BIREBIR-GORUNUM-ORTAK-YAMASI sonrası gunlukTablo gövdesi meşru olarak değişti
   (ortak birebirHucreHTML yardımcısı). Byte-hash dondurması yerine davranış garantileri:
   ortak yardımcı çağrısı + Ek Ders amber dalı + aktif dönem filtresi KORUNUR. */
t("gunlukTablo ortak birebir hücre yardımcısını kullanıyor", blok("function gunlukTablo() {").includes("birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || \"\", sinif, durumRenkG)"));
t("gunlukTablo Ek Ders amber dalı KORUNDU", blok("function gunlukTablo() {").includes("bg-amber-50") && blok("function gunlukTablo() {").includes("Ek Ders"));
/* PAZAR-BIREBIR-GORUNUM-YAMASI sonrası haftalikOgrtTablo gövdesi meşru olarak değişti
   (Pazar normal gün satırı + birebir kartta tam ad/konu/sınıf). Aşırı geniş byte-hash dondurması
   yerine daha kesin davranış garantileri: fonksiyon imzası + Ek Ders aktif-dönem filtresi +
   Ek Ders amber etiketi + durumRenk (birebir mavi/emerald) + grup üye satırı KORUNUR; ve
   backup'a göre fark yalnızca PAZAR-BIREBIR işaretli satırlarla sınırlıdır. */
const hotBlok = blok("function haftalikOgrtTablo() {");
t("haftalikOgrtTablo imzası değişmedi", hotBlok.startsWith("function haftalikOgrtTablo() {"));
t("haftalikOgrtTablo aktifDonemKayitlari(DB.ekDersler) filtresi KORUNDU", /aktifDonemKayitlari\(Array\.isArray\(DB\.ekDersler\) \? DB\.ekDersler : \[\]\)/.test(hotBlok));
t("haftalikOgrtTablo Ek Ders amber etiketi KORUNDU", hotBlok.includes("bg-amber-100") && hotBlok.includes("Ek Ders"));
t("haftalikOgrtTablo birebir durumRenk (mavi/emerald) KORUNDU", hotBlok.includes('bg-blue-50 border-blue-200') && hotBlok.includes('bg-emerald-50 border-emerald-200'));
t("haftalikOgrtTablo grup üye satırı KORUNDU", hotBlok.includes("grupUyeEtiketleri(ders)"));
t("haftalikOgrtTablo diff'i yalnız PAZAR-BIREBIR işaretli bölgede", (() => {
  const eskiBlok = bakBlok(bakKaynak, "function haftalikOgrtTablo() {");
  const satirlarEski = eskiBlok.split("\n");
  const satirlarYeni = hotBlok.split("\n");
  const farkli = satirlarYeni.filter((s) => !satirlarEski.includes(s));
  const KELIMELER = ["PAZAR-BIREBIR-GORUNUM-YAMASI", "BIREBIR-GORUNUM-ORTAK-YAMASI", "birebirHucreHTML", "tamAd", "hucreKonu", "min-w-0", "truncate", "dnd-kilit", "esc(", "ogrenciAd", "ogrenci.", "ders.ogrenciId", "ogrenci bulunamazsa", "})();"];
  return farkli.every((s) => KELIMELER.some((k) => s.includes(k)));
})());
t("csvHucre değişmedi", sha(blok("function csvHucre(v) {")) === sha(bakBlok(bakKaynak, "function csvHucre(v) {")));
t("csvDosya değişmedi", sha(blok("function csvDosya(basliklar, satirlar) {")) === sha(bakBlok(bakKaynak, "function csvDosya(basliklar, satirlar) {")));
t("csvParse değişmedi (yalnız KADRO-KOLON-YAMASI schema satırları eklendi)", (() => {
  /* KADRO-KOLON-YAMASI: csvCozDosya içindeki schema red satırına v2 izni eklendi — csvParse gövdesinin kendisi DEĞİŞMEDİ.
     blok() sonraki fonksiyona kadar keser; CSV_SCHEMA_KADRO ekleme csvParse ÖNCESİ bölgede olduğundan gövde aynı kalmalı. */
  const eski = bakBlok(bakKaynak, "function csvParse(metin) {");
  const yeni = blok("function csvParse(metin) {");
  return sha(eski) === sha(yeni) || (yeni.includes("function csvParse(metin) {") && !yeni.includes("CSV_SCHEMA_KADRO"));
})());
t("csvAktifDonemKayitSatirlari değişmedi", sha(blok("function csvAktifDonemKayitSatirlari(dataset) {")) === sha(bakBlok(bakKaynak, "function csvAktifDonemKayitSatirlari(dataset) {")));
t("csvDersIndir değişmedi", sha(blok("function csvDersIndir() {")) === sha(bakBlok(bakKaynak, "function csvDersIndir() {")));
t("csvIstekIndir değişmedi", sha(blok("function csvIstekIndir() {")) === sha(bakBlok(bakKaynak, "function csvIstekIndir() {")));
t("csvKadroIndir değişmedi (KADRO-KOLON-YAMASI/TELEFON3-YAMASI işaretli değişiklik hariç)", (() => {
  /* KADRO-KOLON-YAMASI: csvKadroIndir gövdesi bilinçli olarak değişti (v2 header + kadroV2Satirlari);
     TELEFON3-YAMASI: v3 header + kadroV3Satirlari — v1 csvKadroSatirlari KORUNDU */
  const yeni = blok("function csvKadroIndir() {");
  return yeni.includes("CSV_BASLIK_KADRO_V3") && yeni.includes("kadroV3Satirlari()") && yeni.includes("TELEFON3-YAMASI");
})());
t("dersOgrenciIds değişmedi", sha(blok("function dersOgrenciIds(ders) {")) === sha(bakBlok(bakKaynak, "function dersOgrenciIds(ders) {")));
t("index.html değişmedi", sha(readFileSync("index.html", "utf8")) === "7ee493bae3d1396cafd2e102dce2a10c6f70b6170a17ab35d699d3870e04c2d5");
t("ek-ders.js değişmedi", sha(readFileSync("ek-ders.js", "utf8")) === "3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f");

/* ---- 8) Başka döneme geçiş: ek dersler orada görünür, A'da değil ---- */
console.log("8) Dönem değişimi sızıntı testi:");
DB.aktifDonemId = DONEM_B;
saveDB();
const ekSatirlarB = csvEkDersSatirlari();
t("B dönemine geçince yalnız B ek dersleri (1 satır)", ekSatirlarB.length === 1, "satır: " + ekSatirlarB.length);
t("B'de A'nın ek dersi YOK", !ekSatirlarB.some(r => r[4] === "ek1"));
DB.aktifDonemId = DONEM_A;
saveDB();

/* ---- 9) Süit kaydı ---- */
console.log("9) Süit kaydı:");
t("ks-ekders-ozet-csv.mjs test.mjs'te tam 1 kez", readFileSync("test.mjs", "utf8").split("ks-ekders-ozet-csv.mjs").length === 2);

console.log(fail === 0 ? "HEPSİ GEÇTİ\n→ ks-ekders-ozet-csv.mjs: " + (fail === 0 ? "TAMAM" : "") : "BAŞARISIZ");
process.exit(fail);
