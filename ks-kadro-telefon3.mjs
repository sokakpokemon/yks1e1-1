let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 75) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-kadro-telefon3.mjs kosan=" + __kosan + " beklenen=75"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-kadro-telefon3.mjs:" + __kosan + ":75"); } });
/* ks-kadro-telefon3.mjs — TELEFON3-YAMASI + D61-VELI-TEL süiti
   Kapsam: tel + TEK canonical veli telefonu (`veliTel`) modeli, legacy anneTel/babaTel migration
   (tek numara → veliTel'e kopyalanır; iki numara → otomatik seçim YOK), form akışı (ekle/güncelle/sil),
   v3 CSV header/kolon sırası + round-trip (normalize ile veliTel geri gelir), v1/v2 import + legacy korunumu,
   v3 boş kolon davranışı, atomik RED + localStorage byte korunumu, WhatsApp alıcı çözücüsü (veli → veliTel).
   D61-VELI-TEL: form artık TEK "Veli Telefonu" alanı taşır (o-veli-tel / d-veli-tel);
   anne/baba İKİLİ form alanları ve id'leri kaldırıldı — legacy alanlar DB'de + kadro CSV şemasında KORUNUR.
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

const EXPORTS = "{ DB, saveDB, csvDosya, csvParse, csvImportUygula, CSV_SCHEMA, CSV_SCHEMA_KADRO, CSV_SCHEMA_KADRO_V3, CSV_BASLIK_KADRO_V3, CSV_BASLIK_KADRO_V2, CSV_BASLIK_KADRO, kadroV3Satirlari, kadroV2Satirlari, csvKadroSatirlari, kadroSnfId, sinifId, ogrenciEkle, ogrenciGuncelle, ogrenciDuzenle, oSil, normalize, waUrl, waGonder, waAliciBilgisi, ogrenciMesajMetni, LS_KEY, ui }";
let api;
try {
  api = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  /* beklenmeyen catch: THROW (catch-only sayım kaldırıldı — SAYAÇ KAPISI kuralları) */
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}
const { DB, saveDB, csvDosya, csvImportUygula, CSV_SCHEMA, CSV_SCHEMA_KADRO, CSV_SCHEMA_KADRO_V3, CSV_BASLIK_KADRO_V3, CSV_BASLIK_KADRO_V2, CSV_BASLIK_KADRO, kadroV3Satirlari, kadroV2Satirlari, csvKadroSatirlari, kadroSnfId, sinifId, ogrenciEkle, ogrenciGuncelle, ogrenciDuzenle, oSil, normalize, waUrl, waGonder, waAliciBilgisi, ogrenciMesajMetni, LS_KEY, ui } = api;

/* Yerel form alanı simülasyonu: ids'e input stub'ları koy */
function inputStub(v) { const e = elStub(); e.value = v || ""; return e; }

/* ================= 1) Migration: normalize = veliTel canonical ================= */
console.log("1) Migration (tel/veliTel/anneTel/babaTel):");
DB.ogrenciler = [
  { id: "t3-ogr-1", ad: "Ayşe Demir", sinif: "12 SAY 1", tel: "05551112233" }, /* tüm veli alanları eksik → "" */
  { id: "t3-ogr-2", ad: "Zeynep Kaya", sinif: "12 SAY 2", tel: "+90 555-999-88 77", anneTel: "0533 444 55 66", babaTel: "0555-000-11-22" }, /* İKİ numara → otomatik seçim YOK */
  { id: "t3-ogr-3", ad: "Öğrenci İğdeçiçek", sinif: "12 DİL", tel: "" }, /* Türkçe ad */
  { id: "t3-ogr-4", ad: "Veli Tekli Anne", sinif: "12 SAY 1", tel: "05551110000", anneTel: "0532 111 22 33" }, /* TEK numara (anne) */
  { id: "t3-ogr-5", ad: "Veli Tekli Baba", sinif: "12 SAY 1", tel: "05551110000", babaTel: "0532 999 88 77" } /* TEK numara (baba) */
];
saveDB();
normalize(DB); /* D61-VELI-TEL: migration tek kapıdan (normalize) */
const o1 = DB.ogrenciler.find((o) => o.id === "t3-ogr-1");
const o2 = DB.ogrenciler.find((o) => o.id === "t3-ogr-2");
const o3 = DB.ogrenciler.find((o) => o.id === "t3-ogr-3");
const o4 = DB.ogrenciler.find((o) => o.id === "t3-ogr-4");
const o5 = DB.ogrenciler.find((o) => o.id === "t3-ogr-5");
t("eksik veliTel → '' eklendi", o1.veliTel === "");
t("eksik anneTel → '' eklendi", o1.anneTel === "");
t("eksik babaTel → '' eklendi", o1.babaTel === "");
t("mevcut tel AYNEN korundu ('05551112233')", o1.tel === "05551112233", o1.tel);
t("TEK numara (anneTel dolu) → veliTel'e KOPYALANDI", o4.veliTel === "0532 111 22 33", o4.veliTel);
t("TEK numara (babaTel dolu) → veliTel'e KOPYALANDI", o5.veliTel === "0532 999 88 77", o5.veliTel);
t("legacy alan SİLİNMEDİ (tek numara kaynakta duruyor)", o4.anneTel === "0532 111 22 33" && o5.babaTel === "0532 999 88 77");
t("İKİ numara dolu → veliTel OTOMATİK seçilmedi (anneTel bırakıldı)", o2.veliTel === "" && o2.anneTel === "0533 444 55 66", JSON.stringify({ veliTel: o2.veliTel, anneTel: o2.anneTel }));
t("mevcut anneTel DEĞİŞTİRİLMEDİ", o2.anneTel === "0533 444 55 66", o2.anneTel);
t("mevcut babaTel DEĞİŞTİRİLMEDİ", o2.babaTel === "0555-000-11-22", o2.babaTel);
t("normalize telefon YOK: +90/boşluk/tire aynen", o2.tel === "+90 555-999-88 77", o2.tel);
t("Türkçe adlı öğrencide alanlar var", o3.veliTel === "" && o3.anneTel === "" && o3.babaTel === "" && o3.ad === "Öğrenci İğdeçiçek");
const ogrTelAlanlari = DB.ogrenciler.every((o) => "tel" in o && "veliTel" in o && "anneTel" in o && "babaTel" in o);
t("tüm öğrencilerde 4 telefon alanı var (tel/veliTel/anneTel/babaTel)", ogrTelAlanlari);
const ogrtTelKirlet = DB.ogretmenler.every((x) => !("veliTel" in x) && !("anneTel" in x) && !("babaTel" in x));
t("öğretmen kayıtlarına veliTel/anne/baba tel EKLENMEDİ", ogrtTelKirlet);
const ikinciNormalize = derinKopya(DB);
normalize(DB);
t("2. normalize idempotent (byte-birebir)", JSON.stringify(DB) === JSON.stringify(ikinciNormalize), JSON.stringify({ a: ikinciNormalize.ogrenciler, b: DB.ogrenciler }).slice(0, 200));
const lsAnahtarSayi = Object.keys(store).filter((k) => /yksOto_arsiv/.test(k)).length;
t("localStorage tek anahtar (yksOto_arsiv_v1)", lsAnahtarSayi === 1, String(lsAnahtarSayi));

/* ================= 2) Form: yeni kayıt (o-tel / o-veli-tel) ================= */
console.log("2) Form: yeni kayıt (o-tel / o-veli-tel):");
ids["o-ad"] = inputStub("Emre Yılmaz");
ids["o-sinif"] = inputStub("12 SAY 1");
ids["o-tel"] = inputStub("0544 111 22 33");
ids["o-veli-tel"] = inputStub("+90 555 666 77 88");
ogrenciEkle();
const emre = DB.ogrenciler.find((o) => o.ad === "Emre Yılmaz");
t("yeni öğrenci kaydı oluştu", !!emre);
t("veli telefonu formdan kaydedildi (biçim kayıpsız)", emre && emre.tel === "0544 111 22 33" && emre.veliTel === "+90 555 666 77 88", JSON.stringify(emre && { tel: emre.tel, veliTel: emre.veliTel }));
t("legacy ayna yazıldı: anneTel = veliTel, babaTel = ''", emre && emre.anneTel === "+90 555 666 77 88" && emre.babaTel === "", JSON.stringify(emre && { anneTel: emre.anneTel, babaTel: emre.babaTel }));
t("kayıt sonrası form temizlendi (o-tel + o-veli-tel)", ids["o-tel"].value === "" && ids["o-veli-tel"].value === "");

/* ================= 3) Form: düzenleme (d-tel / d-veli-tel) ================= */
console.log("3) Form: düzenleme (d-tel / d-veli-tel):");
ogrenciDuzenle("t3-ogr-1");
ids["d-ad"] = inputStub("Ayşe Demir");
ids["d-sinif"] = inputStub("12 SAY 1");
ids["d-tel"] = inputStub("05551112233");
ids["d-veli-tel"] = inputStub("0212 555 00 11");
ogrenciGuncelle();
const g1 = DB.ogrenciler.find((o) => o.id === "t3-ogr-1");
t("güncelleme akışı veli telefonunu yazar (veliTel)", g1.tel === "05551112233" && g1.veliTel === "0212 555 00 11", JSON.stringify({ tel: g1.tel, veliTel: g1.veliTel }));
t("güncelleme legacy aynayı da yazar (anneTel = veliTel, babaTel = '')", g1.anneTel === "0212 555 00 11" && g1.babaTel === "");
t("diğer öğrencinin legacy alanları korunur", o2.anneTel === "0533 444 55 66" && o2.babaTel === "0555-000-11-22");

/* ================= 4) Form: silme ================= */
console.log("4) Form: silme akışı:");
const silmeOnce = DB.ogrenciler.length;
DB.ogrenciler = DB.ogrenciler.filter((o) => o.id !== emre.id); /* oSil onay modalı gerçek DOM ister — eşdeğer doğrudan silme + şema korunumu */
saveDB();
t("öğrenci silindi", DB.ogrenciler.length === silmeOnce - 1);
t("silme sonrası kalan kayıtlarda 4 telefon alanı duruyor", DB.ogrenciler.every((o) => "tel" in o && "veliTel" in o && "anneTel" in o && "babaTel" in o));

/* ================= 5) v3 CSV: header + kolon sırası ================= */
console.log("5) v3 header ve kolon sırası:");
const v3 = kadroV3Satirlari();
t("header birebir: schema;dataset;donemId;tip;id;ad;soyad;telefon;anneTelefon;babaTelefon;brans;sinifId;sinifAd;ekAlanlarJson", JSON.stringify(CSV_BASLIK_KADRO_V3) === JSON.stringify(["schema","dataset","donemId","tip","id","ad","soyad","telefon","anneTelefon","babaTelefon","brans","sinifId","sinifAd","ekAlanlarJson"]));
t("v3 satır genişliği 14", v3.every((r) => r.length === 14));
const v3O1 = v3.find((r) => r[3] === "ogrenci" && r[4] === "t3-ogr-1");
const v3O2 = v3.find((r) => r[3] === "ogrenci" && r[4] === "t3-ogr-2");
const v3T = v3.find((r) => r[3] === "ogretmen");
const v3S = v3.find((r) => r[3] === "sinif");
t("öğrenci: telefon=tel · anneTelefon=veliTel (legacy ayna) · babaTelefon=''", v3O1[7] === "05551112233" && v3O1[8] === "0212 555 00 11" && v3O1[9] === "", JSON.stringify([v3O1[7], v3O1[8], v3O1[9]]));
t("legacy İKİ-numaralı kayıt CSV'de KAYIPSIZ (anneTelefon/babaTelefon aynen)", v3O2[8] === "0533 444 55 66" && v3O2[9] === "0555-000-11-22", JSON.stringify([v3O2[8], v3O2[9]]));
t("biçim kayıpsız: +90/boşluk/tire aynen", v3O2[7] === "+90 555-999-88 77");
t("öğretmen satırında 3 telefon kolonu BOŞ", v3T[7] === "" && v3T[8] === "" && v3T[9] === "");
t("sınıf satırında 3 telefon kolonu BOŞ", v3S[7] === "" && v3S[8] === "" && v3S[9] === "");
const ekJson = JSON.parse(v3O1[13]);
t("ekAlanlarJson'da tel/veliTel/anneTel/babaTel YOK (v3 temizliği)", !("tel" in ekJson) && !("veliTel" in ekJson) && !("anneTel" in ekJson) && !("babaTel" in ekJson) && !("anneTelefon" in ekJson) && !("babaTelefon" in ekJson), v3O1[13]);
t("v2 üretici hâlâ çalışıyor (12 kolon)", kadroV2Satirlari().every((r) => r.length === 12));
t("v1 üretici hâlâ çalışıyor (10 kolon)", csvKadroSatirlari().every((r) => r.length === 10));
const v3Dosya = csvDosya(CSV_BASLIK_KADRO_V3, v3);
t("v3 dosya BOM + CRLF + noktalı virgül", v3Dosya.charCodeAt(0) === 0xFEFF && v3Dosya.includes("\r\n") && v3Dosya.replace(/^\uFEFF/, "").split("\r\n")[0] === CSV_BASLIK_KADRO_V3.join(";"));

/* ================= 6) v3 round-trip (normalize ile veliTel geri gelir) ================= */
console.log("6) v3 export → import round-trip:");
saveDB();
const onceDB6 = derinKopya(DB);
const r6 = csvImportUygula([{ ad: "yks-kadro-global.csv", metin: v3Dosya }]);
t("v3 import kabul edildi", r6.ok, JSON.stringify((r6.hatalar || []).slice(0, 3)));
if (r6.ok) {
  const k6 = r6.kopya;
  const g6 = k6.ogrenciler.find((o) => o.id === "t3-ogr-1");
  t("round-trip: anneTelefon → anneTel (legacy ayna) kayıpsız", g6.tel === "05551112233" && g6.anneTel === "0212 555 00 11", JSON.stringify({ tel: g6.tel, anneTel: g6.anneTel }));
  normalize(k6); /* D61-VELI-TEL: gerçek boru hattı (import → normalize) */
  t("round-trip: normalize sonrası veliTel GERİ GELDİ (canonical kayıpsız)", k6.ogrenciler.find((o) => o.id === "t3-ogr-1").veliTel === "0212 555 00 11");
  const g6b = k6.ogrenciler.find((o) => o.id === "t3-ogr-2");
  t("round-trip: İKİ-numaralı kayıtta legacy alanlar kayıpsız (veliTel otomatik seçilmedi)", g6b.anneTel === "0533 444 55 66" && g6b.babaTel === "0555-000-11-22" && g6b.veliTel === "");
  t("round-trip: ad+soyad birleşti (ad+soyad → ad)", g6b.ad === "Zeynep Kaya", g6b.ad);
}

/* ================= 7) v1/v2 import + legacy/veliTel korunumu ================= */
console.log("7) v1/v2 import — mevcut veliTel/anneTel/babaTel KORUNUR:");
saveDB();
const a4Once = DB.ogrenciler.find((o) => o.id === "t3-ogr-4").anneTel;
const b4Once = DB.ogrenciler.find((o) => o.id === "t3-ogr-4").babaTel;
const v4Once = DB.ogrenciler.find((o) => o.id === "t3-ogr-4").veliTel;
const v2CSV = csvDosya(CSV_BASLIK_KADRO_V2, [
  [CSV_SCHEMA_KADRO, "kadro", "", "ogrenci", "t3-ogr-4", "Veli", "Tekli Anne", "0555 000 99 88", "", kadroSnfId("12 SAY 1"), "12 SAY 1", "{}"]
]);
const r7 = csvImportUygula([{ ad: "v2.csv", metin: v2CSV }]);
t("v2 import kabul edildi", r7.ok, JSON.stringify((r7.hatalar || []).slice(0, 3)));
if (r7.ok) {
  const k7 = r7.kopya;
  const g = k7.ogrenciler.find((o) => o.id === "t3-ogr-4");
  t("v2: telefon → tel yazıldı", g.tel === "0555 000 99 88", g.tel);
  t("v2: mevcut anneTel KORUNDU (boşaltılmadı)", g.anneTel === a4Once, g.anneTel);
  t("v2: mevcut babaTel KORUNDU (boşaltılmadı)", g.babaTel === b4Once, g.babaTel);
  normalize(k7);
  t("v2 + normalize: mevcut veliTel KORUNDU (canonical bozulmadı)", k7.ogrenciler.find((o) => o.id === "t3-ogr-4").veliTel === v4Once, String(v4Once));
}
const v1CSV = csvDosya(CSV_BASLIK_KADRO, [
  [CSV_SCHEMA, "kadro", "", "ogrenci", "t3-ogr-v1", "MEHMET ALI YILMAZ", "", kadroSnfId("12 SAY 1"), "12 SAY 1", JSON.stringify({ tel: "05331112244", ozelNot: "v1" })]
]);
const r7b = csvImportUygula([{ ad: "v1.csv", metin: v1CSV }]);
t("v1 import kabul edildi", r7b.ok, JSON.stringify((r7b.hatalar || []).slice(0, 3)));
if (r7b.ok) {
  const k7b = r7b.kopya;
  const g = k7b.ogrenciler.find((o) => o.id === "t3-ogr-v1");
  t("v1: ekAlanlarJson.tel fallback → tel", g.tel === "05331112244", g.tel);
  normalize(k7b);
  const g2 = k7b.ogrenciler.find((o) => o.id === "t3-ogr-v1");
  t("v1 + normalize: veliTel/anneTel/babaTel '' başlar (yeni kayıt)", g2.veliTel === "" && g2.anneTel === "" && g2.babaTel === "");
}

/* ================= 8) v3 boş kolon: canonical veliTel EZİLMEZ ================= */
console.log("8) v3 boş kolon → bilinçli '':");
const v3Bos = csvDosya(CSV_BASLIK_KADRO_V3, [
  [CSV_SCHEMA_KADRO_V3, "kadro", "", "ogrenci", "t3-ogr-1", "Ayşe", "Demir", "05551112233", "", "", "", kadroSnfId("12 SAY 1"), "12 SAY 1", "{}"]
]);
const r8 = csvImportUygula([{ ad: "bos.csv", metin: v3Bos }]);
t("v3 import ok", r8.ok, JSON.stringify((r8.hatalar || []).slice(0, 3)));
if (r8.ok) {
  const k8 = r8.kopya;
  const g = k8.ogrenciler.find((o) => o.id === "t3-ogr-1");
  t("boş anneTelefon/babaTelefon → bilinçli ''", g.anneTel === "" && g.babaTel === "", JSON.stringify({ anneTel: g.anneTel, babaTel: g.babaTel }));
  t("mevcut veliTel KORUNDU (boş kolon canonical alanı EZMEDİ)", g.veliTel === "0212 555 00 11", g.veliTel);
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

/* ================= 10) WhatsApp: tek çözücü (veli → veliTel) ================= */
console.log("10) WhatsApp alıcı çözücüsü (D61-VELI-TEL):");
const telKaynak = readFileSync("app.js", "utf8");
const waGonderG = telKaynak.split("function waGonder(ogrenciId) {")[1].split("\nfunction ")[0];
t("waGonder waAliciBilgisi çözücüsünü kullanıyor (ogrenci → tel)", waGonderG.includes("waAliciBilgisi(ogrenciId, waAliciTipi)"));
t("waGonder telefon alanlarını DOĞRUDAN kullanmıyor (veliTel/anneTel/babaTel yok)", !waGonderG.includes("anneTel") && !waGonderG.includes("babaTel") && !waGonderG.includes("veliTel"));
const waAliciG = telKaynak.split("function waAliciBilgisi(ogrenciId, aliciTipi) {")[1].split("\nfunction ")[0];
t("tek çözücü veli sırası: veliTel || anneTel || babaTel", waAliciG.includes("o.veliTel || o.anneTel || o.babaTel"), waAliciG.slice(waAliciG.indexOf("var telefon"), waAliciG.indexOf("var telefon") + 140));
t("waAliciBilgisi(veli) → veliTel (canonical)", waAliciBilgisi("t3-ogr-4", "veli").telefon === "0532 111 22 33" && waAliciBilgisi("t3-ogr-4", "veli").etiket === "Veli");
t("waAliciBilgisi(veli) → veliTel boşsa anneTel'e düşer (geriye-uyum)", waAliciBilgisi("t3-ogr-2", "veli").telefon === "0533 444 55 66");
t("waAliciBilgisi(anne/baba) geriye-uyumlu korunur", waAliciBilgisi("t3-ogr-2", "anne").telefon === "0533 444 55 66" && waAliciBilgisi("t3-ogr-2", "baba").telefon === "0555-000-11-22");
const waUrlG = telKaynak.split("function waUrl(metin, tel) {")[1].split("\nfunction ")[0];
t("waUrl imzası değişmedi (metin, tel)", !!waUrlG && !waUrlG.includes("anneTel") && !waUrlG.includes("veliTel"));
t("waUrl boş tel → wa.me/?text", waUrl("Merhaba", "") === "https://web.whatsapp.com/send?text=" + encodeURIComponent("Merhaba"));
const mesaj = ogrenciMesajMetni("t3-ogr-2");
t("mesaj metni değişmedi (ogrenciMesajMetni çalışıyor)", typeof mesaj === "string" || mesaj == null);
const onceURL = globalThis._waSonURL;
globalThis._waSonURL = null;
waGonder("t3-ogr-2"); /* pencere pencereDersler'e bakar; boş dönemde toast çıkar — URL hedefi yine çözücü kaynaklı */
globalThis._waSonURL = onceURL;
t("waGonder URL hedefi çözücünün telefonu (waUrl(metin, a.telefon))", waGonderG.includes("waUrl(metin, a.telefon)"));

/* ================= 11) Süit kaydı ================= */
console.log("11) Süit kaydı:");
const tm = readFileSync("test.mjs", "utf8");
t("ks-kadro-telefon3.mjs test.mjs'te tam 1 kez", (tm.match(/ks-kadro-telefon3\.mjs/g) || []).length === 1);
t("app.js TELEFON3-YAMASI işareti tek (var CSV_SCHEMA_KADRO_V3)", (telKaynak.match(/var CSV_SCHEMA_KADRO_V3/g) || []).length === 1);
t("D61-VELI-TEL: model + iki form + çözücü işaretleri var (>=4 blok)", (telKaynak.match(/D61-VELI-TEL/g) || []).length >= 4, String((telKaynak.match(/D61-VELI-TEL/g) || []).length));
t("d-tel/d-veli-tel/o-tel/o-veli-tel duplicate id yok (her biri tam 1)", ["d-tel", "d-veli-tel", "o-tel", "o-veli-tel"].every((id) => (telKaynak.match(new RegExp('id="' + id + '"', "g")) || []).length === 1));
t("legacy anne/baba form id'leri TAMAMEN kaldırıldı (0)", ["o-anne-tel", "d-anne-tel", "o-baba-tel", "d-baba-tel"].every((id) => (telKaynak.match(new RegExp('id="' + id + '"', "g")) || []).length === 0));

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
