let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-wa-sablon.mjs — WhatsApp Mesaj Şablonu süiti
   Doğruladıkları:
    1) Boş ayarla mesaj bugünkü varsayılanla byte-birebir aynı.
    2) Custom baslik/giris/kapanis/imza uygulanıyor; yer tutucular doğru; bilinmeyen yer tutucu literal.
    3) saveDB/loadDB sonrası şablon kalıcı; yedek round-trip kayıpsız.
    4) Birebir mesajda 👥 yok; grupta tüm üyeler + 👥 var; ders listesi koddan üretiliyor.
    5) Ayarlar arayüzü: bölüm + 4 alan + kaydet; tekrar render'da duplicate yok.
    6) Tek localStorage anahtarı (yeni anahtar yok); DB.ayarlar.whatsappSablon tek şablon nesnesi.
    7) Önceki süit sayılarında düşüş yok (test.mjs'te tam 1 kez). */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
const appKaynak = readFileSync("app.js", "utf8");
const testKaynak = readFileSync("test.mjs", "utf8");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" }, open() {} };
const reg = {};
const elStub = (id) => {
  const e = {
    id: id || "", options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    innerHTML: "", textContent: "", value: "", checked: false, dataset: {}, children: [],
    appendChild(n) { if (n && n.id) this.children.push(n); }, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {},
    insertAdjacentHTML() {}, insertAdjacentElement() {},
    querySelectorAll: () => [], querySelector: () => null,
  };
  if (id) reg[id] = e;
  return e;
};
global.document = {
  getElementById: (id) => reg[id] || elStub(id), addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(), body: { appendChild() {}, removeChild() {} }, querySelectorAll: () => [],
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };

let P;
let DB; /* normalize round-trip'lerde yeniden atanabilir */
try {
P = new Function(scripts + "\n  return { DB, ui, saveDB, loadDB, normalize, ogrenciMesajMetni, ayarTab, waSablonKaydet, waSablonKartHTML, waSablonVarsayilan, penceredeDersler, pencereAdi, dersMap: () => DERS, gunlerArr: () => GUNLER, fmtTRfn: () => fmtTR, dowIdxFn: () => dowIdx, saatEtiketfn: () => saatEtiket, grupOgrenciAdlarifn: () => grupOgrenciAdlari };")();
DB = P.DB;
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false); console.log(e.stack.split("\n").slice(0, 6).join("\n")); process.exit(1);
}
const { saveDB, loadDB, normalize, ogrenciMesajMetni, ayarTab, waSablonKaydet, waSablonKartHTML, waSablonVarsayilan, penceredeDersler, pencereAdi } = P;

/* Yedek round-trip için gerçek JSON yolu (app.js'teki DB referansıyla senkron) */
const yedekRoundTrip = () => {
  const paket = JSON.stringify({ uygulama: "YKS Birebir Takip", surum: 1, veri: DB });
  const geri = JSON.parse(paket).veri;
  DB = normalize(geri); P.DB = DB; /* yedekOku'nun normalize yolu */
};

const ogr = DB.ogrenciler.find((o) => o.ad === "Ayşe Demir");
const ogr2 = DB.ogrenciler.find((o) => o.ad === "Zeynep Kaya");
t("seed öğrenci var", !!ogr);

/* WA-DURUM-YAMASI sonrası yeni referans biçim:
   1) {DERS} ({OGRETMEN}) — {KONU}   (konu boşsa bölüm gizlenir)
      👥 {Ad1, Ad2}                  (yalnız grup)
   📅 {tarih} {gün} • {saat}         (öğretmen adı YOK)
   durum cümlesi (planliSatir/tamamlandiSatir opsiyonel; boşsa varsayılan) */
const referansMetin = (ogrenciId) => {
  const o = DB.ogrenciler.find((s) => s.id === ogrenciId);
  const liste = P.penceredeDersler().filter((l) => (l.ogrenciId === o.id || l.ogrenciAd === o.ad) && l.durum !== "iptal");
  if (!liste.length) return null;
  const DERS = P.dersMap();
  const GUNLER = P.gunlerArr();
  const fmtTR = P.fmtTRfn();
  const dowIdx = P.dowIdxFn();
  const saatEtiket = P.saatEtiketfn();
  const grupOgrenciAdlari = P.grupOgrenciAdlarifn();
  const sab = (DB.ayarlar && DB.ayarlar.whatsappSablon && typeof DB.ayarlar.whatsappSablon === "object") ? DB.ayarlar.whatsappSablon : {};
  const satirDeger = (alan, varsayilan) => { const v = sab[alan]; return (v == null ? "" : String(v)).trim() !== "" ? v : varsayilan; };
  const satirlar = liste.map((l, i) => {
    const D = DERS[l.dersId] || DERS.tur;
    let ogrAd = l.ogretmenAd;
    if (!ogrAd && l.ogretmenId && DB.ogretmenler) { const og = DB.ogretmenler.find((x) => x.id === l.ogretmenId); if (og) ogrAd = og.ad; }
    let satir = (i + 1) + ") " + D.ad + (ogrAd ? " (" + ogrAd + ")" : "") + (l.konu ? " — " + l.konu : "");
    const uyeler = grupOgrenciAdlari(l);
    if (uyeler.length > 1) satir += "\n   👥 " + uyeler.join(", ");
    satir += "\n   📅 " + fmtTR(l.tarih) + " " + GUNLER[dowIdx(l.tarih)] + " • " + saatEtiket(l.saat) + "\n";
    satir += l.durum === "tamamlandi"
      ? satirDeger("tamamlandiSatir", "Bu tarih ve saatte birebir dersiniz yapıldı.")
      : satirDeger("planliSatir", "Bu tarih ve saatte birebir dersiniz olacaktır.");
    return satir;
  });
  return "Merhaba " + o.ad + "! 👋\n\n📚 " + P.pencereAdi() + " birebir ders programın:\n\n" + satirlar.join("\n") + "\n\nDerslerimize zamanında katılmayı unutma. İyi çalışmalar! 🎓\n— YKS Birebir Takip";
};

/* Ders bir hasar görmesin diye grup dersini kendi kayıtla kuracağız; önce birebir testleri */

/* ---- 1) Boş ayar → bugünkü varsayılan byte-birebir ---- */
console.log("1) Boş ayar = varsayılan (byte-birebir):");
delete DB.ayarlar;
t("ayarlar yokken mesaj üretiliyor (geriye dönük)", typeof ogrenciMesajMetni(ogr.id) === "string");
const m0 = ogrenciMesajMetni(ogr.id);
const r0 = referansMetin(ogr.id);
t("boş ayarla bugünkü default byte-birebir", m0 === r0, JSON.stringify({ m0: m0 && m0.slice(0, 60), r0: r0 && r0.slice(0, 60) }));
const m1 = ogrenciMesajMetni(ogr.id);
t("boş alanlı şablon nesnesi de varsayılan", m1 === r0);
DB.ayarlar = DB.ayarlar || {}; DB.ayarlar.whatsappSablon = { baslik: "", giris: null, kapanis: undefined, imza: "" };
t("null/undefined alanlarda da varsayılan", ogrenciMesajMetni(ogr.id) === r0);
DB.ayarlar = waSablonVarsayilan();

/* ---- 2) Custom alanlar + yer tutucular ---- */
console.log("2) Custom şablon + yer tutucular:");
const dersler = P.penceredeDersler().filter((l) => (l.ogrenciId === ogr.id || l.ogrenciAd === ogr.ad) && l.durum !== "iptal");
DB.ayarlar = DB.ayarlar || {}; DB.ayarlar.whatsappSablon = {
  baslik: "Program ({dersSayisi} ders) — {pencereAdi}",
  giris: "Sevgili {ogrenciAdi},",
  kapanis: "Görüşmek üzere {ogrenciAdi}! ~ $ özel",
  imza: "{ogrenciAdi} için — Kurum",
};
const m2 = ogrenciMesajMetni(ogr.id);
t("custom başlık uygulanıyor", m2.includes("Program (" + dersler.length + " ders) — " + P.pencereAdi()));
t("custom giriş uygulanıyor", m2.includes("Sevgili " + ogr.ad + ","));
t("custom kapanış uygulanıyor", m2.includes("Görüşmek üzere " + ogr.ad + "! ~ $ özel"));
t("custom imza uygulanıyor", m2.includes("{ogrenciAdi} için — Kurum".replace("{ogrenciAdi}", ogr.ad)));
t("imza satırı sonda", m2.trimEnd().endsWith(ogr.ad + " için — Kurum"));
t("eski varsayılan metin parçaları yok", !m2.includes("Merhaba " + ogr.ad + "! 👋") && !m2.includes("İyi çalışmalar"));

/* ---- 3) Bilinmeyen yer tutucu literal kalır ---- */
console.log("3) Bilinmeyen yer tutucu:");
DB.ayarlar = DB.ayarlar || {}; DB.ayarlar.whatsappSablon = { giris: "Merhaba {ogrenciAdSoyadi} {ogrenciAdi}!", baslik: "{bilinmeyen}", kapanis: "", imza: "" };
const m3 = ogrenciMesajMetni(ogr.id);
t("bilinmeyen yer tutucu literal kalır", m3.includes("{ogrenciAdSoyadi}") && m3.includes("{bilinmeyen}"));
t("bilinen yer tutucu değişir", m3.includes("Merhaba {ogrenciAdSoyadi} " + ogr.ad + "!"));

/* ---- 4) Ders listesi koddan üretilir; 👥 kuralları ---- */
console.log("4) Ders listesi + 👥 koruması:");
DB.ayarlar = DB.ayarlar || {}; DB.ayarlar.whatsappSablon = { giris: "ŞABLON-GIRIS", baslik: "ŞABLON-BASLIK", kapanis: "ŞABLON-KAPANIS", imza: "ŞABLON-IMZA" };
const m4 = ogrenciMesajMetni(ogr.id);
t("ders listesi satırları var (1) …", m4.includes("1) "));
t("ders listesi şablona ALINMIYOR", !m4.includes("ŞABLON") || (m4.indexOf("ŞABLON-GIRIS") < m4.indexOf("1) ") && m4.indexOf("1) ") < m4.indexOf("ŞABLON-KAPANIS")));
t("birebir mesajda 👥 YOK", !m4.includes("👥"));
/* Grup dersi kur (pencere içinde: Ayşe'nin mevcut dersinden tarih/saat al) */
const mevcutDers = penceredeDersler().find((l) => (l.ogrenciId === ogr.id || l.ogrenciAd === ogr.ad) && l.durum !== "iptal");
t("referans birebir ders bulundu (pencere)", !!mevcutDers);
const grp = { id: "ks-wa-grup-test", ogrenciId: ogr.id, ogrenciAd: ogr.ad, ogrenciIds: [ogr2.id], dersId: "mat", konu: "Türev", ogretmenId: "", ogretmenAd: "TEST Ö", tarih: mevcutDers.tarih, saat: mevcutDers.saat, kod: mevcutDers.kod || "8", durum: "planlandi", olusturma: "2026-09-01", donemId: mevcutDers.donemId || DB.aktifDonemId };
DB.dersler.push(grp); P.DB = DB;
const m5 = ogrenciMesajMetni(ogr.id);
t("grupta 👥 satırı var", m5.includes("   👥 Ayşe Demir, Zeynep Kaya"));
t("grupta tüm üye adları mesajda", m5.includes(ogr.ad) && m5.includes(ogr2.ad));
/* Grup üyesi (2. öğrenci) KENDİ pencere dersinde grup sahibi olursa 👥 var (eski davranış) */
const zDers = penceredeDersler().find((l) => (l.ogrenciId === ogr2.id || l.ogrenciAd === ogr2.ad) && l.durum !== "iptal");
const grp2 = { ...zDers, id: "ks-wa-grup-test-2", ogrenciId: ogr2.id, ogrenciAd: ogr2.ad, ogrenciIds: [ogr.id], konu: "Zeynep Grup" };
DB.dersler.push(grp2); P.DB = DB;
const m6 = ogrenciMesajMetni(ogr2.id);
t("grup sahibi üye mesajında 👥 var (mevcut davranış)", m6.includes("👥 Zeynep Kaya, Ayşe Demir"));
DB.dersler = DB.dersler.filter((l) => l.id !== grp2.id);
DB.dersler = DB.dersler.filter((l) => l.id !== grp.id);
t("grup test dersi kaldırıldı (temizlik)", !ogrenciMesajMetni(ogr.id).includes("👥"));

/* ---- 5) Kalıcılık: saveDB/loadDB ---- */
console.log("5) Kalıcılık:");
DB.ayarlar = DB.ayarlar || {}; DB.ayarlar.whatsappSablon = { baslik: "KALICI-BASLIK", giris: "KALICI-GIRIS", kapanis: "KALICI-KAPANIS", imza: "KALICI-IMZA" };
saveDB();
const anahtarlar = Object.keys(store);
t("tek localStorage anahtarı (yeni anahtar YOK)", anahtarlar.every((k) => k === "yksOto_arsiv_v1"), JSON.stringify(anahtarlar));
const kayitli = JSON.parse(store["yksOto_arsiv_v1"]);
t("DB.ayarlar.whatsappSablon saveDB'ye yazıldı", kayitli.ayarlar && kayitli.ayarlar.whatsappSablon && kayitli.ayarlar.whatsappSablon.baslik === "KALICI-BASLIK");
const yuklenen = loadDB();
DB = yuklenen || DB; P.DB = DB;
const m7 = ogrenciMesajMetni(DB.ogrenciler.find((o) => o.ad === "Ayşe Demir").id);
t("loadDB sonrası şablon kalıcı", m7.includes("KALICI-GIRIS") && m7.includes("KALICI-IMZA"));

/* ---- 6) Yedek round-trip ---- */
console.log("6) Yedek round-trip:");
yedekRoundTrip();
const m8 = ogrenciMesajMetni(DB.ogrenciler.find((o) => o.ad === "Ayşe Demir").id);
t("round-trip'te şablon kayıpsız", m8.includes("KALICI-GIRIS") && m8.includes("KALICI-BASLIK") && m8.includes("KALICI-KAPANIS") && m8.includes("KALICI-IMZA"));
/* Eski yedek (ayarlar yok) → varsayılan */
delete DB.ayarlar;
yedekRoundTrip();
t("eski yedek (ayarlar yok) → varsayılan çalışır", typeof ogrenciMesajMetni(DB.ogrenciler.find((o) => o.ad === "Ayşe Demir").id) === "string");

/* ---- 7) Arayüz ---- */
console.log("7) Ayarlar arayüzü:");
const htmlAyar = ayarTab();
t("'WhatsApp Mesaj Şablonu' bölümü var", htmlAyar.includes("WhatsApp Mesaj Şablonu"));
t("bölüm tam 1 kez (duplicate yok)", htmlAyar.split("WhatsApp Mesaj Şablonu").length - 1 === 1);
["baslik", "giris", "kapanis", "imza"].forEach((a) => {
  t("alan wa-sablon-" + a + " tam 1 kez", htmlAyar.split('id="wa-sablon-' + a + '"').length - 1 === 1);
});
t("yer tutucular belgelenmiş", htmlAyar.includes("{ogrenciAdi}") && htmlAyar.includes("{pencereAdi}") && htmlAyar.includes("{dersSayisi}"));
t("boş bırakılırsa varsayılan uyarısı var", htmlAyar.includes("varsayılan"));
t("kaydet butonu waSablonKaydet çağırır", htmlAyar.includes("waSablonKaydet()"));
const kartTekrar = waSablonKartHTML();
t("kart tekrar üretimde birebir aynı (idempotent render)", kartTekrar === waSablonKartHTML());
t("ayarTab 2. render'da NaN yok", !/\bNaN\b/.test(ayarTab()));

/* Kaydet akışı: alan değerlerini stub'a yaz */
console.log("8) Kaydet akışı:");
["baslik", "giris", "kapanis", "imza"].forEach((a) => { reg["wa-sablon-" + a] = elStub("wa-sablon-" + a); });
reg["wa-sablon-baslik"].value = "UI-BASLIK";
reg["wa-sablon-giris"].value = "UI-GIRIS";
reg["wa-sablon-kapanis"].value = "UI-KAPANIS";
reg["wa-sablon-imza"].value = "UI-IMZA";
const once = JSON.parse(store["yksOto_arsiv_v1"]);
waSablonKaydet();
const sonra = JSON.parse(store["yksOto_arsiv_v1"]);
t("kaydet DB.ayarlar.whatsappSablon'a yazar", sonra.ayarlar.whatsappSablon.baslik === "UI-BASLIK" && sonra.ayarlar.whatsappSablon.imza === "UI-IMZA");
t("kaydet diğer DB alanlarına dokunmaz (öğretmen/öğrenci/ders sayısı)", sonra.ogretmenler.length === once.ogretmenler.length && sonra.ogrenciler.length === once.ogrenciler.length && sonra.dersler.length === once.dersler.length);
t("kaydet localStorage'a yazdı (kalıcı)", store["yksOto_arsiv_v1"].includes("UI-GIRIS"));

/* ---- 9) Kaynak kanıtları + süit kaydı ---- */
console.log("9) Kaynak kanıtları:");
t("WA-SABLON-YAMASI işareti app.js'te", appKaynak.includes("WA-SABLON-YAMASI"));
t("listeMetni kaynakta 1 kez (dokunulmadı)", appKaynak.split("function listeMetni(").length - 1 === 1);
t("waUrl/waGonder/waSatir/waKopyalaMesaj tanımlı", ["function waUrl(", "function waGonder(", "function waSatir(", "function waKopyalaMesaj("].every((n) => appKaynak.includes(n)));
t("👥 satır üretimi koddan (kaynakta)", appKaynak.includes('"\\n   👥 " + uyeler.join(", ")'));
const suiteSayisi = testKaynak.split('"ks-wa-sablon.mjs"').length - 1;
t("ks-wa-sablon.mjs test.mjs'te tam 1 kez", suiteSayisi === 1, String(suiteSayisi));
const suites = (testKaynak.match(/const suites = \[(.*)\];/) || [])[1];
t("mevcut 34 süit listede korundu", ["ks-harness.mjs", "ks-excel-ui-kontrol.mjs", "ks-kart-kolon.mjs"].every((s) => suites.includes('"' + s + '"')) && (suites.match(/,/g) || []).length >= 33);

console.log(fail ? "\nHATALAR VAR" : "\nHEPSİ GEÇTİ");
console.log("→ ks-wa-sablon.mjs: " + (fail ? "BAŞARISIZ" : "TAMAM"));
process.exit(fail);

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 47) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-wa-sablon.mjs kosan=" + __kosan + " beklenen=47"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-wa-sablon.mjs:" + __kosan + ":47"); } });