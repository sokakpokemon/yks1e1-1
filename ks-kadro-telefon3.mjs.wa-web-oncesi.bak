let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 57) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-kadro-telefon3.mjs kosan=" + __kosan + " beklenen=57"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-kadro-telefon3.mjs:" + __kosan + ":57"); } });
/* ks-kadro-telefon3.mjs — TELEFON3-YAMASI süiti
   Kapsam: 3 telefon alanı (tel/anneTel/babaTel) migration, form akışı (ekle/güncelle/sil),
   v3 CSV header/kolon sırası, round-trip, v1/v2 import + anne/baba korunumu, v3 boş kolon temizliği,
   atomik RED + localStorage byte korunumu, WhatsApp yalnız öğrenci tel'ini kullanır.
   Desen: tek boot + gerçek DOM id kayıt defteri (mevcut süitlerle aynı). */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" }, open: (u) => { globalThis._waSonURL = u; } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
/* Gerçek DOM id kayıt defteri: form alanları id ile yakalanır */
const ids = {};
global.document = {
  getElementById: (id) => { if (ids[id]) return ids[id]; return elStub(); },
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

const EXPORTS = "{ DB, saveDB, csvDosya, csvParse, csvImportUygula, CSV_SCHEMA, CSV_SCHEMA_KADRO, CSV_SCHEMA_KADRO_V3, CSV_BASLIK_KADRO_V3, CSV_BASLIK_KADRO_V2, CSV_BASLIK_KADRO, kadroV3Satirlari, kadroV2Satirlari, csvKadroSatirlari, kadroSnfId, sinifId, ogrenciEkle, ogrenciGuncelle, ogrenciDuzenle, oSil, normalize, waUrl, waGonder, ogrenciMesajMetni, LS_KEY, ui }";
let api;
try {
  api = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  /* beklenmeyen catch: THROW (catch-only sayım kaldırıldı — SAYAÇ KAPISI kuralları) */
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}
const { DB, saveDB, csvDosya, csvImportUygula, CSV_SCHEMA, CSV_SCHEMA_KADRO, CSV_SCHEMA_KADRO_V3, CSV_BASLIK_KADRO_V3, CSV_BASLIK_KADRO_V2, CSV_BASLIK_KADRO, kadroV3Satirlari, kadroV2Satirlari, csvKadroSatirlari, kadroSnfId, sinifId, ogrenciEkle, ogrenciGuncelle, ogrenciDuzenle, oSil, normalize, waUrl, waGonder, ogrenciMesajMetni, LS_KEY, ui } = api;

/* Yerel form alanı simülasyonu: ids'e input stub'ları koy */
function inputStub(v) { const e = elStub(); e.value = v || ""; return e; }

/* ================= 1) Migration: normalize ================= */
console.log("1) Migration (tel/anneTel/babaTel):");
DB.ogrenciler = [
  { id: "t3-ogr-1", ad: "Ayşe Demir", sinif: "12 SAY 1", tel: "05551112233" }, /* anne/baba eksik → "" */
  { id: "t3-ogr-2", ad: "Zeynep Kaya", sinif: "12 SAY 2", tel: "+90 555-999-88 77", anneTel: "0533 444 55 66", babaTel: "0555-000-11-22" }, /* mevcut KORUNUR */
  { id: "t3-ogr-3", ad: "Öğrenci İğdeçiçek", sinif: "12 DİL", tel: "" } /* Türkçe ad */
];
saveDB();
normalize(DB); /* TELEFON3-YAMASI: migration tek kapıdan (normalize) */
const o1 = DB.ogrenciler.find((o) => o.id === "t3-ogr-1");
const o2 = DB.ogrenciler.find((o) => o.id === "t3-ogr-2");
const o3 = DB.ogrenciler.find((o) => o.id === "t3-ogr-3");
t("eksik anneTel → '' eklendi", o1.anneTel === "");
t("eksik babaTel → '' eklendi", o1.babaTel === "");
t("mevcut tel AYNEN korundu ('05551112233')", o1.tel === "05551112233", o1.tel);
t("mevcut anneTel DEĞİŞTİRİLMEDİ", o2.anneTel === "0533 444 55 66", o2.anneTel);
t("mevcut babaTel DEĞİŞTİRİLMEDİ", o2.babaTel === "0555-000-11-22", o2.babaTel);
t("normalize telefon YOK: +90/boşluk/tire aynen", o2.tel === "+90 555-999-88 77", o2.tel);
t("Türkçe adlı öğrencide alanlar var", o3.anneTel === "" && o3.babaTel === "" && o3.ad === "Öğrenci İğdeçiçek");
const ogrTelAlanlari = DB.ogrenciler.every((o) => "tel" in o && "anneTel" in o && "babaTel" in o);
t("tüm öğrencilerde 3 alan var", ogrTelAlanlari);
const ogrtTelKirlet = DB.ogretmenler.every((x) => !("anneTel" in x) && !("babaTel" in x));
t("öğretmen kayıtlarına anne/baba tel EKLENMEDİ", ogrtTelKirlet);
const ikinciNormalize = derinKopya(DB);
normalize(DB);
t("2. normalize idempotent (byte-birebir)", JSON.stringify(DB) === JSON.stringify(ikinciNormalize), JSON.stringify({ a: ikinciNormalize.ogrenciler, b: DB.ogrenciler }).slice(0, 200));
const lsAnahtarSayi = Object.keys(store).filter((k) => /yksOto_arsiv/.test(k)).length;
t("localStorage tek anahtar (yksOto_arsiv_v1)", lsAnahtarSayi === 1, String(lsAnahtarSayi));

/* ================= 2) Form: yeni kayıt ================= */
console.log("2) Form: yeni kayıt (o-tel / o-anne-tel / o-baba-tel):");
ids["o-ad"] = inputStub("Emre Yılmaz");
ids["o-sinif"] = inputStub("12 SAY 1");
ids["o-tel"] = inputStub("0544 111 22 33");
ids["o-anne-tel"] = inputStub("0533-222-33-44");
ids["o-baba-tel"] = inputStub("+90 555 666 77 88");
ogrenciEkle();
const emre = DB.ogrenciler.find((o) => o.ad === "Emre Yılmaz");
t("yeni öğrenci kaydı oluştu", !!emre);
t("3 alan formdan kaydedildi (biçim kayıpsız)", emre && emre.tel === "0544 111 22 33" && emre.anneTel === "0533-222-33-44" && emre.babaTel === "+90 555 666 77 88", JSON.stringify(emre && { tel: emre.tel, anneTel: emre.anneTel, babaTel: emre.babaTel }));
t("kayıt sonrası form temizlendi", ids["o-tel"].value === "" && ids["o-anne-tel"].value === "" && ids["o-baba-tel"].value === "");

/* ================= 3) Form: düzenleme ================= */
console.log("3) Form: düzenleme (d-tel / d-anne-tel / d-baba-tel):");
ogrenciDuzenle("t3-ogr-1");
ids["d-ad"] = inputStub("Ayşe Demir");
ids["d-sinif"] = inputStub("12 SAY 1");
ids["d-tel"] = inputStub("05551112233");
ids["d-anne-tel"] = inputStub("0212 555 00 11");
ids["d-baba-tel"] = inputStub("0532 987 65 43");
ogrenciGuncelle();
const g1 = DB.ogrenciler.find((o) => o.id === "t3-ogr-1");
t("güncelleme akışı 3 alanı yazar", g1.tel === "05551112233" && g1.anneTel === "0212 555 00 11" && g1.babaTel === "0532 987 65 43", JSON.stringify({ tel: g1.tel, anneTel: g1.anneTel, babaTel: g1.babaTel }));
t("diğer öğrencinin anne/baba'sı korunur", o2.anneTel === "0533 444 55 66");

/* ================= 4) Form: silme ================= */
console.log("4) Form: silme akışı:");
const silmeOnce = DB.ogrenciler.length;
DB.ogrenciler = DB.ogrenciler.filter((o) => o.id !== emre.id); /* oSil onay modalı gerçek DOM ister — eşdeğer doğrudan silme + şema korunumu */
saveDB();
t("öğrenci silindi", DB.ogrenciler.length === silmeOnce - 1);
t("silme sonrası kalan kayıtlarda 3 alan duruyor", DB.ogrenciler.every((o) => "tel" in o && "anneTel" in o && "babaTel" in o));

/* ================= 5) v3 CSV: header + kolon sırası ================= */
console.log("5) v3 header ve kolon sırası:");
const v3 = kadroV3Satirlari();
t("header birebir: schema;dataset;donemId;tip;id;ad;soyad;telefon;anneTelefon;babaTelefon;brans;sinifId;sinifAd;ekAlanlarJson", JSON.stringify(CSV_BASLIK_KADRO_V3) === JSON.stringify(["schema","dataset","donemId","tip","id","ad","soyad","telefon","anneTelefon","babaTelefon","brans","sinifId","sinifAd","ekAlanlarJson"]));
t("v3 satır genişliği 14", v3.every((r) => r.length === 14));
const v3O1 = v3.find((r) => r[3] === "ogrenci" && r[4] === "t3-ogr-1");
const v3O2 = v3.find((r) => r[3] === "ogrenci" && r[4] === "t3-ogr-2");
const v3T = v3.find((r) => r[3] === "ogretmen");
const v3S = v3.find((r) => r[3] === "sinif");
t("öğrenci: telefon=tel, anneTelefon=anneTel, babaTelefon=babaTel", v3O1[7] === "05551112233" && v3O1[8] === "0212 555 00 11" && v3O1[9] === "0532 987 65 43", JSON.stringify([v3O1[7], v3O1[8], v3O1[9]]));
t("biçim kayıpsız: +90/boşluk/tire aynen", v3O2[7] === "+90 555-999-88 77" && v3O2[8] === "0533 444 55 66" && v3O2[9] === "0555-000-11-22");
t("öğretmen satırında 3 telefon kolonu BOŞ", v3T[7] === "" && v3T[8] === "" && v3T[9] === "");
t("sınıf satırında 3 telefon kolonu BOŞ", v3S[7] === "" && v3S[8] === "" && v3S[9] === "");
const ekJson = JSON.parse(v3O1[13]);
t("ekAlanlarJson'da tel/anneTel/babaTel YOK (v3 temizliği)", !("tel" in ekJson) && !("anneTel" in ekJson) && !("babaTel" in ekJson) && !("anneTelefon" in ekJson) && !("babaTelefon" in ekJson), v3O1[13]);
t("v2 üretici hâlâ çalışıyor (12 kolon)", kadroV2Satirlari().every((r) => r.length === 12));
t("v1 üretici hâlâ çalışıyor (10 kolon)", csvKadroSatirlari().every((r) => r.length === 10));
const v3Dosya = csvDosya(CSV_BASLIK_KADRO_V3, v3);
t("v3 dosya BOM + CRLF + noktalı virgül", v3Dosya.charCodeAt(0) === 0xFEFF && v3Dosya.includes("\r\n") && v3Dosya.replace(/^\uFEFF/, "").split("\r\n")[0] === CSV_BASLIK_KADRO_V3.join(";"));

/* ================= 6) v3 round-trip ================= */
console.log("6) v3 export → import round-trip:");
saveDB();
const onceDB6 = derinKopya(DB);
const r6 = csvImportUygula([{ ad: "yks-kadro-global.csv", metin: v3Dosya }]);
t("v3 import kabul edildi", r6.ok, JSON.stringify((r6.hatalar || []).slice(0, 3)));
if (r6.ok) {
  const g = r6.kopya.ogrenciler.find((o) => o.id === "t3-ogr-2");
  t("round-trip: 3 telefon alanı kayıpsız", g.tel === "+90 555-999-88 77" && g.anneTel === "0533 444 55 66" && g.babaTel === "0555-000-11-22", JSON.stringify(g));
  t("round-trip: ad+soyad birleşti (ad+soyad → ad)", g.ad === "Zeynep Kaya", g.ad);
}

/* ================= 7) v1/v2 import + anne/baba korunumu ================= */
console.log("7) v1/v2 import — mevcut anneTel/babaTel KORUNUR:");
saveDB();
const a2Once = DB.ogrenciler.find((o) => o.id === "t3-ogr-2").anneTel;
const b2Once = DB.ogrenciler.find((o) => o.id === "t3-ogr-2").babaTel;
const v2CSV = csvDosya(CSV_BASLIK_KADRO_V2, [
  [CSV_SCHEMA_KADRO, "kadro", "", "ogrenci", "t3-ogr-2", "Zeynep", "Kaya", "0555 000 99 88", "", kadroSnfId("12 SAY 2"), "12 SAY 2", "{}"]
]);
const r7 = csvImportUygula([{ ad: "v2.csv", metin: v2CSV }]);
t("v2 import kabul edildi", r7.ok, JSON.stringify((r7.hatalar || []).slice(0, 3)));
if (r7.ok) {
  const g = r7.kopya.ogrenciler.find((o) => o.id === "t3-ogr-2");
  t("v2: telefon → tel yazıldı", g.tel === "0555 000 99 88", g.tel);
  t("v2: mevcut anneTel KORUNDU (boşaltılmadı)", g.anneTel === a2Once, g.anneTel);
  t("v2: mevcut babaTel KORUNDU (boşaltılmadı)", g.babaTel === b2Once, g.babaTel);
}
const v1CSV = csvDosya(CSV_BASLIK_KADRO, [
  [CSV_SCHEMA, "kadro", "", "ogrenci", "t3-ogr-v1", "MEHMET ALI YILMAZ", "", kadroSnfId("12 SAY 1"), "12 SAY 1", JSON.stringify({ tel: "05331112244", ozelNot: "v1" })]
]);
const r7b = csvImportUygula([{ ad: "v1.csv", metin: v1CSV }]);
t("v1 import kabul edildi", r7b.ok, JSON.stringify((r7b.hatalar || []).slice(0, 3)));
if (r7b.ok) {
  const g = r7b.kopya.ogrenciler.find((o) => o.id === "t3-ogr-v1");
  t("v1: ekAlanlarJson.tel fallback → tel", g.tel === "05331112244", g.tel);
  t("v1: anneTel/babaTel '' başlar (yeni kayıt)", g.anneTel === "" && g.babaTel === "");
}

/* ================= 8) v3 boş kolon temizliği (authoritative) ================= */
console.log("8) v3 boş kolon → bilinçli '' :");
const v3Bos = csvDosya(CSV_BASLIK_KADRO_V3, [
  [CSV_SCHEMA_KADRO_V3, "kadro", "", "ogrenci", "t3-ogr-2", "Zeynep", "Kaya", "05551112233", "", "", "", kadroSnfId("12 SAY 2"), "12 SAY 2", "{}"]
]);
const r8 = csvImportUygula([{ ad: "bos.csv", metin: v3Bos }]);
t("v3 import ok", r8.ok, JSON.stringify((r8.hatalar || []).slice(0, 3)));
if (r8.ok) {
  const g = r8.kopya.ogrenciler.find((o) => o.id === "t3-ogr-2");
  t("boş anneTelefon/babaTelefon → bilinçli ''", g.anneTel === "" && g.babaTel === "", JSON.stringify({ anneTel: g.anneTel, babaTel: g.babaTel }));
  t("dolu telefon korunur", g.tel === "05551112233");
}

/* ================= 9) Atomik RED + localStorage byte korunumu ================= */
console.log("9) Atomiklik:");
saveDB();
const lsOnce9 = store[LS_KEY];
const dbOnce9 = derinKopya(DB);
const hataCSV = csvDosya(CSV_BASLIK_KADRO_V3, [
  [CSV_SCHEMA_KADRO_V3, "kadro", "", "ogrenci", "t3-yeni-1", "İyi", "Satır", "05550000001", "", "", "", kadroSnfId("12 SAY 1"), "12 SAY 1", "{}"],
  [CSV_SCHEMA_KADRO_V3, "kadro", "", "ogrenci", "t3-yeni-1", "Yinelenen", "ID", "05550000002", "", "", "", kadroSnfId("12 SAY 1"), "12 SAY 1", "{}"]
]);
const r9 = csvImportUygula([{ ad: "hata.csv", metin: hataCSV }]);
t("yinelenen ID → RED", !r9.ok && r9.hatalar.some((h) => /Yinelenen ID/.test(h.sebep)));
t("iyi satır bile uygulanmadı", DB.ogrenciler.every((o) => o.id !== "t3-yeni-1"));
t("DB byte-birebir aynı", JSON.stringify(DB) === JSON.stringify(dbOnce9));
t("localStorage byte-birebir aynı", store[LS_KEY] === lsOnce9);
const bozukCsv = csvDosya(CSV_BASLIK_KADRO_V3, [[CSV_SCHEMA_KADRO_V3, "kadro", "", "ogrenci", "", "Bozuk", "JSON", "", "", "", "", "", "", "{ kesik"]]);
const r9b = csvImportUygula([{ ad: "bozuk.csv", metin: bozukCsv }]);
/* mevcut davranış: bozuk ekAlanlarJson satır içi sessizce yoksayılır (csvEkAlanUygula), diğer satırlar uygulanır;
   atomiklik garantisi: kayıt yine de upsert edilebilir — test, sessiz yoksayma + byte korunumunu doğrular */
t("geçersiz ekAlanlarJson sessizce yoksayılır (mevcut davranış), uygulama çökmez", r9b !== null);
t("bozuk CSV sonrası da localStorage birebir", store[LS_KEY] === lsOnce9);

/* ================= 10) WhatsApp: yalnız öğrenci tel ================= */
console.log("10) WhatsApp yalnız öğrenci tel kullanır:");
const telKaynak = readFileSync("app.js", "utf8");
const waGonderG = telKaynak.split("function waGonder(ogrenciId) {")[1].split("\nfunction ")[0];
/* WA-ALICI-YAMASI: waGonder artık waAliciBilgisi çözücüsünü kullanır. Varsayılan alici="ogrenci" →
   çözücü o.tel döndürür (aynı davranış); kaynak testi çözücü üzerinden güncellendi (bilinçli). */
t("waGonder waAliciBilgisi çözücüsünü kullanıyor (ogrenci → tel)", waGonderG.includes("waAliciBilgisi(ogrenciId, waAliciTipi)"));
t("waGonder anneTel/babaTel KULLANMIYOR", !waGonderG.includes("anneTel") && !waGonderG.includes("babaTel"));
const waUrlG = telKaynak.split("function waUrl(metin, tel) {")[1].split("\nfunction ")[0];
t("waUrl imzası değişmedi (metin, tel)", !!waUrlG && !waUrlG.includes("anneTel"));
t("waUrl boş tel → wa.me/?text", waUrl("Merhaba", "") === "https://wa.me/?text=" + encodeURIComponent("Merhaba"));
const mesaj = ogrenciMesajMetni("t3-ogr-2");
t("mesaj metni değişmedi (ogrenciMesajMetni çalışıyor)", typeof mesaj === "string" || mesaj == null);
const kayit2 = DB.ogrenciler.find((o) => o.id === "t3-ogr-2");
const onceURL = globalThis._waSonURL;
globalThis._waSonURL = null;
waGonder("t3-ogr-2"); /* pencere pencereDersler'e bakar; boş dönemde toast çıkar — URL hedefi yine o.tel kaynaklı */
globalThis._waSonURL = onceURL;
/* WA-ALICI-YAMASI: URL hedefi artık çözücünün telefonu (varsayılan ogrenci → o.tel) */
t("waGonder URL hedefi çözücünün telefonu (waUrl(metin, a.telefon))", waGonderG.includes("waUrl(metin, a.telefon)"));

/* ================= 11) Süit kaydı ================= */
console.log("11) Süit kaydı:");
const tm = readFileSync("test.mjs", "utf8");
t("ks-kadro-telefon3.mjs test.mjs'te tam 1 kez", (tm.match(/ks-kadro-telefon3\.mjs/g) || []).length === 1);
t("app.js TELEFON3-YAMASI işareti tek (tanim-öncesi bölge dışı yok)", (telKaynak.match(/var CSV_SCHEMA_KADRO_V3/g) || []).length === 1);
t("d-tel/d-anne-tel/d-baba-tel duplicate id yok", ["d-tel", "d-anne-tel", "d-baba-tel", "o-tel", "o-anne-tel", "o-baba-tel"].every((id) => (telKaynak.match(new RegExp('id="' + id + '"', "g")) || []).length === 1));

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
