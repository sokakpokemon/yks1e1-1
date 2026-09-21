/* ks-donem-ilk.mjs — 2026/2027 DÖNEM MODELİ, İLK (VERİ-UYUMLULUK) DİLİM süiti (DONEM-ILK-YAMASI)
   Doğruladıkları:
    1) 2026/2027 dönem kaydı tek kez var · 2) aktifDonemId doğru ·
    3) tüm eski derslerde donemId var · 4) tüm eski isteklerde donemId var ·
    5) ders/istek/grup dersi sayıları değişmedi · 6) ders/istek alanları donemId dışında korunuyor ·
    7) sinifProg yapısı ve sınıf ID'leri korunuyor · 8) öğrenci/öğretmen kayıtları değişmiyor ·
    9) ikinci normalize/boot idempotent · 10) yedek al→yükle dönem alanlarını kayıpsız koruyor ·
   11) UI/HTML/ek-ders.js dosyaları değişmiyor.
   Tek boot + gerçek DOM id kayıt defteri (mevcut süit deseni). */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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

const EXPORTS = "{ DB, normalize, loadDB, saveDB, donemleriBaslat, bosDB, seedDB }";
let P;
try {
  P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
} catch (e) {
  console.log("  ✗ boot hatasız → " + e.message);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, normalize, loadDB, saveDB, donemleriBaslat } = P;

let fail = 0;
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

const ID = "donem-2026-2027", AD = "2026/2027";
const derinKopya = (x) => JSON.parse(JSON.stringify(x));
/* donemId'yi atlayıp anahtarları sıralı serileştirir → donemId dışı alan deep-equal karşılaştırması */
function sirali(v, skip) {
  if (Array.isArray(v)) return v.map((x) => sirali(x, skip));
  if (v && typeof v === "object") { const o = {}; Object.keys(v).sort().forEach((k) => { if (k !== skip && !(Array.isArray(skip) && skip.indexOf(k) !== -1)) o[k] = sirali(v[k], skip); }); return o; }
  return v;
}
const alanEsit = (a, b, skip) => JSON.stringify(sirali(a, skip)) === JSON.stringify(sirali(b, skip));
/* Dönem alanları SIFIR eski DB üretir (gerçek seed'in eski-hal temsili) */
function eskiVeriyeCevir(db) {
  const d = derinKopya(db);
  delete d.donemler; delete d.aktifDonemId; delete d.sinifProgDonemId;
  d.dersler.forEach((l) => delete l.donemId);
  d.istekler.forEach((r) => delete r.donemId);
  return d;
}

/* Boot DB'si (seedDB + kadro + donem) referans sayılar */
const seedDersSayisi = DB.dersler.length, seedIstekSayisi = DB.istekler.length;
const seedEkDersSayisi = Array.isArray(DB.ekDersler) ? DB.ekDersler.length : 0;
const seedOgrSayisi = DB.ogrenciler.length, seedOgrtSayisi = DB.ogretmenler.length;

/* ---- 1) Dönem kaydı tek kez ---- */
console.log("1) 2026/2027 dönem kaydı tek kez:");
t("DB.donemler dizi ve uzunluk 1", Array.isArray(DB.donemler) && DB.donemler.length === 1, JSON.stringify(DB.donemler || null));
t("dönem kaydı { id, ad, aktif } doğru", DB.donemler[0] && DB.donemler[0].id === ID && DB.donemler[0].ad === AD && DB.donemler[0].aktif === true, JSON.stringify(DB.donemler[0]));
t("donemler içinde 'donem-2026-2027' id'si tam 1 kez", DB.donemler.filter((x) => x && x.id === ID).length === 1);

/* ---- 2) aktifDonemId ---- */
console.log("2) aktifDonemId doğru:");
t("DB.aktifDonemId = donem-2026-2027", DB.aktifDonemId === ID, String(DB.aktifDonemId));
t("DB.sinifProgDonemId = donem-2026-2027", DB.sinifProgDonemId === ID, String(DB.sinifProgDonemId));

/* ---- 3+4) Eski ders/isteklere donemId ---- */
const eski = eskiVeriyeCevir(DB);
const eskiDersSayisi = eski.dersler.length, eskiIstekSayisi = eski.istekler.length;
const n1 = normalize(derinKopya(eski));
console.log("3+4) Eski ders/isteklere donemId (migration):");
t("eski derslerin TAMAMINA donemId eklendi (" + eskiDersSayisi + " ders)", n1.dersler.every((l) => l.donemId === ID));
t("eklenen donemId sayısı = eski ders sayısı", n1.dersler.filter((l) => l.donemId === ID).length === eskiDersSayisi);
t("eski isteklerin TAMAMINA donemId eklendi (" + eskiIstekSayisi + " istek)", n1.istekler.every((r) => r.donemId === ID));
t("eklenen donemId sayısı = eski istek sayısı", n1.istekler.filter((r) => r.donemId === ID).length === eskiIstekSayisi);
t("boot DB'sinde de tüm derslerde donemId var (" + seedDersSayisi + " ders)", DB.dersler.every((l) => l.donemId === ID));
t("boot DB'sinde de tüm isteklerde donemId var (" + seedIstekSayisi + " istek)", DB.istekler.every((r) => r.donemId === ID));

/* ---- 5) Sayılar değişmedi ---- */
console.log("5) Kayıt sayıları değişmedi:");
t("ders sayısı değişmedi (" + seedDersSayisi + ")", n1.dersler.length === eskiDersSayisi && DB.dersler.length === seedDersSayisi);
t("istek sayısı değişmedi (" + seedIstekSayisi + ")", n1.istekler.length === eskiIstekSayisi && DB.istekler.length === seedIstekSayisi);
t("öğrenci/öğretmen sayıları değişmedi", n1.ogrenciler.length === seedOgrSayisi && n1.ogretmenler.length === seedOgrtSayisi);
t("grup dersi (ogrenciIds'li) sayısı değişmedi", n1.dersler.filter((l) => l.ogrenciIds).length === eski.dersler.filter((l) => l.ogrenciIds).length);
t("grup istek (ogrenciIds'li) sayısı değişmedi", n1.istekler.filter((r) => r.ogrenciIds).length === eski.istekler.filter((r) => r.ogrenciIds).length);

/* ---- 6) Alan koruma (donemId dışı deep-equal) ---- */
console.log("6) Ders/istek alanları korunuyor (donemId dışında):");
t("her dersin donemId dışı alanları birebir", n1.dersler.every((l, i) => alanEsit(l, eski.dersler[i], "donemId")));
t("her isteğin donemId dışı alanları birebir", n1.istekler.every((r, i) => alanEsit(r, eski.istekler[i], "donemId")));
t("ders sırası ve ID'leri aynı", JSON.stringify(n1.dersler.map((l) => l.id)) === JSON.stringify(eski.dersler.map((l) => l.id)));
t("istek sırası ve ID'leri aynı", JSON.stringify(n1.istekler.map((r) => r.id)) === JSON.stringify(eski.istekler.map((r) => r.id)));

/* ---- 7) sinifProg yapısı + sınıf ID'leri ---- */
console.log("7) sinifProg ve sınıf ID'leri korunuyor:");
t("sinifProg yapısı birebir aynı", alanEsit(n1.sinifProg, eski.sinifProg));
t("sinifProg anahtar (sınıf ad) kümesi aynı", JSON.stringify(Object.keys(n1.sinifProg).sort()) === JSON.stringify(Object.keys(eski.sinifProg).sort()));
t("sinifIds birebir aynı", alanEsit(n1.sinifIds, eski.sinifIds));
t("sinifProgDonemId yalnız EK alan (sinifProg nesnesi içinde değil", !("donemId" in n1.sinifProg) && !("donemler" in n1.sinifProg));

/* ---- 8) Öğrenci/öğretmen kayıtları ---- */
console.log("8) Öğrenci ve öğretmen kayıtları değişmiyor:");
t("ogrenciler birebir aynı", alanEsit(n1.ogrenciler, eski.ogrenciler, ["anneTel","babaTel","tel"])); /* TELEFON3-YAMASI: migration alanları (tel/anneTel/babaTel "" backfill) bilinçli */
t("ogretmenler birebir aynı", alanEsit(n1.ogretmenler, eski.ogretmenler));
t("öğrenci kayıtlarına donemId EKLENMEDİ", n1.ogrenciler.every((o) => !("donemId" in o)));
t("öğretmen kayıtlarına donemId EKLENMEDİ", n1.ogretmenler.every((o) => !("donemId" in o)));

/* ---- 9) İdempotans ---- */
console.log("9) İkinci normalize/boot idempotent:");
const ikinci = donemleriBaslat(n1);
t("ikinci donemleriBaslat 0 değişiklik raporlar", ikinci.d === 0 && ikinci.ders === 0 && ikinci.ist === 0, JSON.stringify(ikinci));
const n2 = normalize(derinKopya(n1));
t("ikinci normalize: dönem kaydı hâlâ tek", n2.donemler.length === 1 && n2.donemler[0].id === ID);
t("ikinci normalize: dönem alanları birebir", alanEsit({ donemler: n2.donemler, aktifDonemId: n2.aktifDonemId, sinifProgDonemId: n2.sinifProgDonemId }, { donemler: n1.donemler, aktifDonemId: n1.aktifDonemId, sinifProgDonemId: n1.sinifProgDonemId }));
t("ikinci normalize: donemId değerleri değişmedi", JSON.stringify(n2.dersler.map((l) => l.donemId)) === JSON.stringify(n1.dersler.map((l) => l.donemId)) && JSON.stringify(n2.istekler.map((r) => r.donemId)) === JSON.stringify(n1.istekler.map((r) => r.donemId)));
t("ikinci normalize: yeni dönem/ID/kopya kayıt YOK", n2.dersler.length === n1.dersler.length && n2.istekler.length === n1.istekler.length && JSON.stringify(n2.donemler) === JSON.stringify(n1.donemler));
/* boot yolu: kaydet → loadDB → yine aynı */
store["yksOto_arsiv_v1"] = JSON.stringify(n1);
const y9 = loadDB();
t("loadDB (boot yolu) dönem alanlarını değiştirmez", y9.donemler.length === 1 && y9.donemler[0].id === ID && y9.aktifDonemId === ID && y9.sinifProgDonemId === ID);
saveDB();
const y9b = loadDB();
t("kaydet→okuma döngüsünde dönem alanları birebir", alanEsit({ donemler: y9b.donemler, aktifDonemId: y9b.aktifDonemId, sinifProgDonemId: y9b.sinifProgDonemId }, { donemler: n1.donemler, aktifDonemId: n1.aktifDonemId, sinifProgDonemId: n1.sinifProgDonemId }));

/* ---- 10) Yedek al→yükle ---- */
console.log("10) Yedek al→yükle dönem alanlarını kayıpsız koruyor:");
const paket = { uygulama: "YKS Birebir Takip", surum: 1, tarih: new Date().toISOString(), veri: derinKopya(n1) };
const yuklenen = normalize(paket.veri);
t("yedek→yükleme: donemler kayıpsız", JSON.stringify(yuklenen.donemler) === JSON.stringify(n1.donemler));
t("yedek→yükleme: aktifDonemId + sinifProgDonemId kayıpsız", yuklenen.aktifDonemId === ID && yuklenen.sinifProgDonemId === ID);
t("yedek→yükleme: tüm donemId'ler kayıpsız", JSON.stringify(yuklenen.dersler.map((l) => l.donemId)) === JSON.stringify(n1.dersler.map((l) => l.donemId)) && JSON.stringify(yuklenen.istekler.map((r) => r.donemId)) === JSON.stringify(n1.istekler.map((r) => r.donemId)));
t("yedek→yükleme: ders/istek alanları donemId dışı birebir", yuklenen.dersler.every((l, i) => alanEsit(l, n1.dersler[i], "donemId")) && yuklenen.istekler.every((r, i) => alanEsit(r, n1.istekler[i], "donemId")));
/* ESKİ format yedek (dönem alanları hiç yok) yüklenince otomatik dönemlenir */
const eskiPaket = { uygulama: "YKS Birebir Takip", surum: 1, tarih: new Date().toISOString(), veri: eskiVeriyeCevir(n1) };
const eskiYuklenen = normalize(eskiPaket.veri);
t("eski yedek yüklenince dönem kaydı oluşur (tek)", eskiYuklenen.donemler.length === 1 && eskiYuklenen.donemler[0].id === ID && eskiYuklenen.aktifDonemId === ID);
t("eski yedekteki tüm ders/isteklere donemId taşındı", eskiYuklenen.dersler.every((l) => l.donemId === ID) && eskiYuklenen.istekler.every((r) => r.donemId === ID));
t("eski yedekte taşınan: " + eskiDersSayisi + " ders + " + eskiIstekSayisi + " istek, kopya yok", eskiYuklenen.dersler.length === eskiDersSayisi && eskiYuklenen.istekler.length === eskiIstekSayisi);
const donem2 = normalize(derinKopya(yuklenen));
t("ikinci yedek döngüsünde dönem alanları yine aynı", JSON.stringify(donem2.donemler) === JSON.stringify(n1.donemler) && donem2.aktifDonemId === ID && donem2.sinifProgDonemId === ID);

/* ---- 11) UI/HTML/ek-ders.js değişmedi ---- */
console.log("11) UI/HTML/ek-ders.js değişmiyor:");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const ekders = readFileSync("ek-ders.js", "utf8");
t("index.html SHA-256 değişmedi", sha(html) === "7ee493bae3d1396cafd2e102dce2a10c6f70b6170a17ab35d699d3870e04c2d5", sha(html));
t("ek-ders.js SHA-256 değişmedi", sha(ekders) === "3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f", sha(ekders));
t("ek-ders.js yama içermiyor (donemleriBaslat yok)", !ekders.includes("donemleriBaslat") && !ekders.includes("DONEM-ILK"));
t("index.html yama içermiyor (donemleriBaslat yok)", !html.includes("donemleriBaslat") && !html.includes("DONEM-ILK"));

console.log(fail === 0 ? "HEPSİ GEÇTİ" : "BAŞARISIZ");
process.exit(fail);
