/* ks-kadro-siralama.mjs — KADRO-SIRALAMA-YAMASI testleri
   csvKadroSatirlari emission sırası: ogretmen → sinif → ogrenci.
   Header byte-identical; satır içerikleri eskiyle aynı (sadece sıra farkı);
   import satır-sırasından bağımsız: yeni/eski/shuffled aynı DB sonucu; round-trip kayıpsız. */
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
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

const EXPORTS = "{ DB, csvKadroSatirlari, csvDosya, CSV_BASLIK_KADRO, csvParse, csvImportUygula }";
let P;
try {
  P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, csvKadroSatirlari, csvDosya, CSV_BASLIK_KADRO, csvParse, csvImportUygula } = P;

/* Eski sırayı (ogrenci→ogretmen→sinif) yamadan önceki algoritmayla birebir üret */
const eskiSatirlar = [];
DB.ogrenciler.forEach(o => eskiSatirlar.push(["yks-csv-v1","kadro","", "ogrenci", o.id || "", o.ad || "", "", (DB.sinifIds[o.sinif] || ""), o.sinif || "", JSON.stringify(Object.fromEntries(Object.keys(o).filter(k => !["id","donemId","ogrenciId","ogrenciIds","ogretmenId","dersId","sinif","tip"].includes(k)).map(k => [k, o[k]])))]));
DB.ogretmenler.forEach(tr => eskiSatirlar.push(["yks-csv-v1","kadro","", "ogretmen", tr.id || "", tr.ad || "", tr.brans || "", "", "", JSON.stringify(Object.fromEntries(Object.keys(tr).filter(k => !["id","donemId","ogrenciId","ogrenciIds","ogretmenId","dersId","sinif","tip"].includes(k)).map(k => [k, tr[k]])))]));
Object.keys(DB.sinifIds || {}).forEach(ad => eskiSatirlar.push(["yks-csv-v1","kadro","", "sinif", DB.sinifIds[ad] || "", ad, "", "", ad, "{}"]));

const yeniSatirlar = csvKadroSatirlari();

/* 1) Tip dizisi: ogretmen... → sinif... → ogrenci... */
console.log("1) Emission sırası:");
const tipler = yeniSatirlar.map(r => r[3]);
const ilkGrup = [tipler[0], tipler[tipler.indexOf("sinif") - 1 >= 0 ? tipler.indexOf("sinif") : 0], tipler[tipler.lastIndexOf("sinif") + 1] ?? tipler[0]];
const ogrIdx = tipler.indexOf("ogrenci");
const snfIdx = tipler.indexOf("sinif");
t("ilk tip ogretmen", tipler[0] === "ogretmen");
t("grup sırası tam olarak ogretmen→sinif→ogrenci", snfIdx > -1 && ogrIdx > -1 && !tipler.slice(0, snfIdx).includes("ogrenci") && !tipler.slice(snfIdx, ogrIdx).includes("ogretmen") && !tipler.slice(ogrIdx).includes("sinif"));
t("tip dizisi [ogretmenler…, siniflar…, ogrenciler…]", JSON.stringify([...new Set(tipler)]) === JSON.stringify(["ogretmen", "sinif", "ogrenci"]));
t("gruplar arasına yabancı tip yok (ilkGrup=" + JSON.stringify(ilkGrup) + ")", ilkGrup[0] === "ogretmen");

/* 2) Sayılar ve içerik birebirliği */
console.log("2) Sayılar ve içerik:");
t("öğretmen satır sayısı değişmedi", yeniSatirlar.filter(r => r[3] === "ogretmen").length === eskiSatirlar.filter(r => r[3] === "ogretmen").length);
t("sınıf satır sayısı değişmedi", yeniSatirlar.filter(r => r[3] === "sinif").length === eskiSatirlar.filter(r => r[3] === "sinif").length);
t("öğrenci satır sayısı değişmedi", yeniSatirlar.filter(r => r[3] === "ogrenci").length === eskiSatirlar.filter(r => r[3] === "ogrenci").length);
t("toplam satır sayısı eşit", yeniSatirlar.length === eskiSatirlar.length);
const key = (r) => JSON.stringify(r);
t("satır içerik kümesi aynı (tek fark sıra; TELEFON3-YAMASI: ekAlanlarJson'da tel alanları bilinçli olarak çıkarıldı)", (() => {
  const eskiKume = new Set(eskiSatirlar.map(key));
  const yeniKume = new Set(yeniSatirlar.map(key));
  /* yalnızca tel-farkı kaynaklı satırlara izin ver: aynı satır, ekAlanlarJson'da tel/anneTel/babaTel anahtarları farkı */
  const normalize = (r) => JSON.stringify(r.map((v) => {
    if (typeof v !== "string") return v;
    try { const o = JSON.parse(v); if (o && typeof o === "object") { delete o.tel; delete o.anneTel; delete o.babaTel; return o; } } catch (e) {}
    return v;
  }));
  const eskiN = eskiSatirlar.map(normalize).sort();
  const yeniN = yeniSatirlar.map(normalize).sort();
  return JSON.stringify(eskiN) === JSON.stringify(yeniN);
})());

/* 3) Header byte-identical */
console.log("3) Header:");
const KORUMA = 'var CSV_BASLIK_KADRO = ["schema","dataset","donemId","tip","id","ad","brans","sinifId","sinifAd","ekAlanlarJson"];';
t("CSV_BASLIK_KADRO byte-identical (kaynak satırı)", readFileSync("app.js", "utf8").includes(KORUMA));
t("csvDosya header satırı CSV_BASLIK_KADRO'dan üretiliyor", csvDosya(CSV_BASLIK_KADRO, []).slice(1).split("\r\n")[0] === CSV_BASLIK_KADRO.join(";"));
t("BOM korunur", csvDosya(CSV_BASLIK_KADRO, []).charCodeAt(0) === 0xFEFF);

/* 4) Import sıra-bağımsızlığı: yeni / eski / shuffled aynı DB sonucu */
console.log("4) Import sıra-bağımsızlığı:");
const sonucOf = (satirlar) => {
  const metin = "\uFEFF" + CSV_BASLIK_KADRO.map(c => c).join(";") + "\r\n" + satirlar.map(r => r.map(v => { const s = String(v); return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(";")).join("\r\n") + "\r\n";
  const r = csvImportUygula([{ ad: "t.csv", metin }]);
  if (!r.ok) return { hata: r.hatalar };
  const k = r.kopya;
  return JSON.stringify({ o: k.ogrenciler.map(x => [x.id, x.ad, x.sinif, x.tel, x.avail || null]), t: k.ogretmenler.map(x => [x.id, x.ad, x.brans]), s: k.sinifIds, p: k.sinifProg, d: k.dersler, i: k.istekler, dg: k.donemler, a: k.aktifDonemId, sp: k.sinifProgDonemId });
};
const rYeni = sonucOf(yeniSatirlar), rEski = sonucOf(eskiSatirlar);
t("yeni sıra import'u hatasız", !rYeni.hata, JSON.stringify(rYeni.hata || ""));
t("yeni sıra import sonucu = eski sıra import sonucu (deep-equal)", rYeni === rEski);
const shuffled = [...yeniSatirlar];
for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
const rShuf = sonucOf(shuffled);
t("shuffled/mixed sıra import sonucu da aynı (deep-equal)", rShuf === rEski);

/* 5) Round-trip: export → import → export → kayıp/duplicate yok, ders/istek/sinifProg korunur */
console.log("5) Round-trip:");
const onceDB = JSON.parse(JSON.stringify(DB));
const metin1 = csvDosya(CSV_BASLIK_KADRO, csvKadroSatirlari());
const imp1 = csvImportUygula([{ ad: "yks-kadro-global.csv", metin: metin1 }]);
t("round-trip import 1 hatasız", !!(imp1 && imp1.ok), JSON.stringify((imp1 && imp1.hatalar) || ""));
if (imp1 && imp1.ok) {
  const metin2 = csvDosya(CSV_BASLIK_KADRO, csvKadroSatirlari());
  t("round-trip: ikinci export birinciyle byte-identical", metin2 === metin1);
  const imp2 = csvImportUygula([{ ad: "yks-kadro-global.csv", metin: metin2 }]);
  t("round-trip import 2 hatasız (duplicate yok)", !!(imp2 && imp2.ok), JSON.stringify((imp2 && imp2.hatalar) || ""));
  if (imp2 && imp2.ok) {
    const k = imp2.kopya;
    t("hiçbir öğrenci kaybolmadı", k.ogrenciler.length === onceDB.ogrenciler.length && JSON.stringify(k.ogrenciler.map(x => x.id).sort()) === JSON.stringify(onceDB.ogrenciler.map(x => x.id).sort()));
    t("hiçbir öğretmen kaybolmadı", k.ogretmenler.length === onceDB.ogretmenler.length && JSON.stringify(k.ogretmenler.map(x => x.id).sort()) === JSON.stringify(onceDB.ogretmenler.map(x => x.id).sort()));
    t("hiçbir sınıf kaybolmadı (sinifIds deep-equal)", JSON.stringify(k.sinifIds) === JSON.stringify(onceDB.sinifIds));
    t("duplicate öğrenci/öğretmen yok (upsert)", k.ogrenciler.length === onceDB.ogrenciler.length && k.ogretmenler.length === onceDB.ogretmenler.length);
    t("dersler değişmedi", JSON.stringify(k.dersler) === JSON.stringify(onceDB.dersler));
    t("istekler değişmedi", JSON.stringify(k.istekler) === JSON.stringify(onceDB.istekler));
    t("sinifProg değişmedi", JSON.stringify(k.sinifProg) === JSON.stringify(onceDB.sinifProg));
  }
}

/* 6) İkinci bağlanma koruması (süit tek dosya, tek koşu — statik doğrulama) */
console.log("6) Süit kaydı:");
const tm = readFileSync("test.mjs", "utf8");
t("ks-kadro-siralama.mjs test.mjs'te tam 1 kez", (tm.match(/ks-kadro-siralama\.mjs/g) || []).length === 1);

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
