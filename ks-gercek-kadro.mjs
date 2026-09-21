let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-gercek-kadro.mjs — GERÇEK ÖĞRETMEN VE SINIF KADROSU süiti (KADRO-YAMASI)
   Doğruladıkları:
    1) 17 öğretmenin tamamı mevcut (normalize-ad eşlemesiyle)
    2) 18 sınıfın tamamı DB.sinifIds içinde
    3) Öğretmen adları benzersiz
    4) Tüm öğretmen ve sınıfların kalıcı ID'si var
    5) Branşlar doğru
    6) İkinci çalıştırma kopya üretmiyor ve ID değiştirmiyor (idempotans)
    7) Mevcut ders/istek/grup dersi sayıları ve referansları değişmiyor
   Tek boot + gerçek DOM id kayıt defteri (mevcut süit deseni).
   Yedek al→yükleme (normalize yolu) mevcut ID'leri korur (test 8). */
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

const EXPORTS = "{ DB, ui, normalize, kimlikleriTamamla, saveDB, loadDB, kadroDuzelt, dersOgrenciIds }";
let P;
try {
  P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
} catch (e) {
  console.log("  ✗ boot hatasız → " + e.message);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, normalize, kimlikleriTamamla, loadDB, kadroDuzelt, dersOgrenciIds } = P;

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

/* KADRO (tek gerçek kaynak; ks-yama-kadro.mjs ile birebir aynı) */
const KADRO_OGRETMENLER = [
  ["BELGİN ÇOLAK", "kim"], ["EREN BİLGİLİ", "tur"], ["FATMA KURT", "tur"],
  ["FİKRİYE KIYAR", "cgr"], ["KARDELEN ASLAN", "kim"], ["SELİNA KUTLU", "kim"],
  ["MEHMET ŞAŞAR", "mat"], ["MERT ASİL", "ing"], ["MERVE GEREK", "mat"],
  ["MUSTAFA GÜRKAN", "fiz"], ["MİNE GÜRKAN", "mat"], ["NİHAT KANARIĞ", "tar"],
  ["RAVİDE DERYA", "fiz"], ["SALİM URTİMUR", "mat"], ["SONER AÇIKGÖZ", "mat"],
  ["TAHSİN ASLAN", "mat"], ["ŞAHİN DOĞANAY", "biy"],
];
const KADRO_SINIFLAR = [
  "MEZUN SAY 1", "MEZUN SAY 2", "MEZUN SAY 3", "MEZUN EA 1", "MEZUN EA 2",
  "12 SAY 1", "12 SAY 2", "12 SAY CAL", "12 EA 1", "12 DİL",
  "11 SAY 1", "11 SAY 2", "11 SAY 3", "11 SAYCAL", "11 SAYISAL FEN",
  "11 EA 1", "10.SINIF", "9.SINIF",
];

/* ---- 1) 17 öğretmenin tamamı mevcut ---- */
console.log("1) 17 öğretmenin tamamı mevcut:");
KADRO_OGRETMENLER.forEach(([ad, brans]) => {
  const t2 = DB.ogretmenler.find(x => kadroAdKey(x.ad) === kadroAdKey(ad));
  t("öğretmen: " + ad, !!t2);
});
t("toplam öğretmen sayısı 17", DB.ogretmenler.length === 17, "bulunan: " + DB.ogretmenler.length);

/* ---- 2) 18 sınıfın tamamı DB.sinifIds içinde ---- */
console.log("2) 18 sınıfın tamamı DB.sinifIds içinde:");
KADRO_SINIFLAR.forEach(ad => {
  t("sınıf: " + ad, !!DB.sinifIds[ad] && Array.isArray(DB.sinifProg[ad]));
});
t("toplam sinifIds girdisi 18", Object.keys(DB.sinifIds).length === 18, "bulunan: " + Object.keys(DB.sinifIds).length);

/* ---- 3) Öğretmen adları benzersiz ---- */
console.log("3) Öğretmen adları benzersiz:");
const adKeys = DB.ogretmenler.map(x => kadroAdKey(x.ad));
t("normalize-ad tekrarı yok", new Set(adKeys).size === adKeys.length);
t("ham-ad tekrarı yok", new Set(DB.ogretmenler.map(x => x.ad)).size === DB.ogretmenler.length);
t("her kadro adından tam 1 kayıt", KADRO_OGRETMENLER.every(([ad]) => adKeys.filter(k => k === kadroAdKey(ad)).length === 1));

/* ---- 4) Tüm öğretmen ve sınıfların kalıcı ID'si var ---- */
console.log("4) Kalıcı ID'ler:");
t("tüm öğretmen ID'leri dolu", DB.ogretmenler.every(x => x.id && x.id !== ""));
t("tüm öğretmen ID'leri benzersiz", new Set(DB.ogretmenler.map(x => x.id)).size === DB.ogretmenler.length);
t("tüm sınıf ID'leri dolu", KADRO_SINIFLAR.every(ad => DB.sinifIds[ad] && DB.sinifIds[ad] !== ""));
t("sınıf ID'leri benzersiz", new Set(KADRO_SINIFLAR.map(ad => DB.sinifIds[ad])).size === 18);
t("ID formatı: UUID veya ks-ogr-*", DB.ogretmenler.every(x => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x.id) || String(x.id).startsWith("ks-ogr-")));
t("sınıf ID formatı: ks-snf-*", KADRO_SINIFLAR.every(ad => String(DB.sinifIds[ad]).startsWith("ks-snf-")));

/* ---- 5) Branşlar doğru ---- */
console.log("5) Branşlar doğru:");
KADRO_OGRETMENLER.forEach(([ad, brans]) => {
  const t2 = DB.ogretmenler.find(x => kadroAdKey(x.ad) === kadroAdKey(ad));
  t(ad + " → " + brans, !!t2 && t2.brans === brans, t2 ? "brans=" + t2.brans : "yok");
});

/* ---- 6) İkinci çalıştırma kopya üretmiyor ve ID değiştirmiyor ---- */
console.log("6) İkinci çalıştırma — idempotans:");
const snap1 = JSON.stringify({ o: DB.ogretmenler.map(x => x.id), a: DB.ogretmenler.map(x => x.ad), s: DB.sinifIds, p: DB.sinifProg });
const r6 = kadroDuzelt(DB);
const snap2 = JSON.stringify({ o: DB.ogretmenler.map(x => x.id), a: DB.ogretmenler.map(x => x.ad), s: DB.sinifIds, p: DB.sinifProg });
t("kadroDuzelt 2. koşu 0 yeni öğretmen/sınıf", r6.t === 0 && r6.s === 0, JSON.stringify(r6));
t("2. koşuda ID/ad/sinifIds/sinifProg birebir aynı", snap1 === snap2);
const n6a = normalize(JSON.parse(JSON.stringify(DB)));
const n6b = normalize(n6a);
t("normalize 3× → öğretmen ID'leri aynı", JSON.stringify(n6a.ogretmenler.map(x => x.id)) === JSON.stringify(n6b.ogretmenler.map(x => x.id)));
t("normalize 3× → sinifIds aynı", JSON.stringify(n6a.sinifIds) === JSON.stringify(n6b.sinifIds));
t("2. koşuda öğretmen sayısı hâlâ 17", DB.ogretmenler.length === 17);
t("2. koşuda sinifIds hâlâ 18", Object.keys(DB.sinifIds).length === 18);

/* ---- 7) Mevcut ders/istek/grup dersi sayıları ve referansları değişmiyor ---- */
console.log("7) Mevcut veri korunumu:");
const once7 = JSON.stringify({ d: DB.dersler, i: DB.istekler, g: DB.ogrenciler, e: DB.ekDersler || [] });
kadroDuzelt(DB);
const sonra7 = JSON.stringify({ d: DB.dersler, i: DB.istekler, g: DB.ogrenciler, e: DB.ekDersler || [] });
t("dersler/istekler/öğrenciler/ek-dersler birebir aynı", once7 === sonra7);
t("ders sayısı değişmedi", DB.dersler.length === 37, "bulunan: " + DB.dersler.length);
t("istek sayısı değişmedi", DB.istekler.length === 3);
t("grup dersi üyeleri değişmedi", DB.dersler.every(l => !l.ogrenciIds || JSON.stringify(l.ogrenciIds) === JSON.stringify(JSON.parse(once7).d.find(x => x.id === l.id).ogrenciIds)));
const bootDers = DB.dersler[0];
const bootOgrt = DB.ogretmenler.find(x => x.id === bootDers.ogretmenId);
t("ders → öğretmen referansı (ogretmenId) çözümleniyor", !!bootOgrt && bootOgrt.ad === bootDers.ogretmenAd);

/* ---- 8) Yedek al→yükleme (normalize yolu) mevcut ID'leri korur ---- */
console.log("8) Yedek yükleme ID kayıpsız:");
const canli = JSON.parse(JSON.stringify({ o: DB.ogretmenler, s: DB.sinifIds }));
const yuklenen = normalize(JSON.parse(JSON.stringify(DB)));
t("yükleme sonrası öğretmen ID'leri kayıpsız", JSON.stringify(yuklenen.ogretmenler.map(x => x.id)) === JSON.stringify(canli.o.map(x => x.id)));
t("yükleme sonrası sinifIds kayıpsız", JSON.stringify(yuklenen.sinifIds) === JSON.stringify(canli.s));
t("yükleme sonrası öğretmen sayısı 17", yuklenen.ogretmenler.length === 17);
const yuk2 = normalize(JSON.parse(JSON.stringify(yuklenen)));
t("ikinci yedek döngüsünde ID'ler yine aynı", JSON.stringify(yuk2.ogretmenler.map(x => x.id)) === JSON.stringify(canli.o.map(x => x.id)) && JSON.stringify(yuk2.sinifIds) === JSON.stringify(canli.s));

/* ---- 9) Yeni öğretmen ekleme akışı (kadro dışı senaryo: id'siz yeni kayıt) ---- */
console.log("9) Yeni (kadro-dışı) öğretmen ID akışı:");
const z9 = JSON.parse(JSON.stringify(DB));
z9.ogretmenler.push({ id: "", ad: "TEST ÖĞRETMEN", brans: "mat", avail: { sinif: {}, musait: [] } });
const r9 = kadroDuzelt(z9);
t("kadro-dışı kayıt silinmez; eksik ID tamamlanır", !!z9.ogretmenler.find(x => x.ad === "TEST ÖĞRETMEN" && x.id && x.id !== ""));
t("kadro 2. kez dokunulmadan yeni ID üretildi", r9.t === 0 && z9.ogretmenler.filter(x => String(x.id).startsWith("ks-ogr-")).length === 1);

/* ---- kadroAdKey yardımcısı (test içi kopya; app.js'teki ile aynı kural) ---- */
function kadroAdKey(ad) {
  const s = String(ad || "").trim().toLocaleLowerCase("tr-TR");
  return s
    .replace(/\u0307/g, "")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[\u0300-\u036f]/g, "");
}

console.log(fail === 0 ? "HEPSİ GEÇTİ" : "BAŞARISIZ");
process.exit(fail);

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 80) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-gercek-kadro.mjs kosan=" + __kosan + " beklenen=80"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-gercek-kadro.mjs:" + __kosan + ":80"); } });