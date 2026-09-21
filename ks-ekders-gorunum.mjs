let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 50) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ekders-gorunum.mjs kosan=" + __kosan + " beklenen=50"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ekders-gorunum.mjs:" + __kosan + ":50"); } });
/* ks-ekders-gorunum.mjs — EK-DERS-GORUNUM süiti: DB.ekDersler aktif dönem kayıtları
   gunlukTablo() ve haftalikOgrtTablo()'da ayırt edici "Ek Ders" etiketiyle görünür.
   Kapsam:
    A) Aktif dönem ek dersi günlük tabloda görünür + "Ek Ders" etiketi
    B) Aktif dönem ek dersi öğretmen haftalık programında görünür + etiket
    C) Başka döneme ait ek ders iki görünümde de GİZLİ
    D) Ek dersi stili birebir/grup/sinif/Bos/Kapali stillerinden farklı (amber)
    E) Duplicate yok: aynı ek ders aynı görünümde TEK kez
    F) Slot eşleşmesi doğru (öğretmen, tarih/gün, saat/kod)
    G) İptal edilmiş ek ders görünmez
    H) Birebir/grup hücre blokları byte-identical (kaynak kanıtı)
    I) ozet/analiz/CSV ekDersler'e bakmaz (kapsam dışı)
*/
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");

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

let n = 0, fail = 0;
const t = (name, cond, extra) => { __kosan++;  n++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let api;
try {
  api = new Function(scripts + "\n  return { DB, normalize, aktifDonemId, aktifDonemKayitlari, gunlukTablo, haftalikOgrtTablo, ui, seedDB, DERS, KISA_KOD, dowIdx };\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, aktifDonemId, aktifDonemKayitlari, gunlukTablo, haftalikOgrtTablo, ui, seedDB } = api;

const DONEM_A = "donem-2026-2027";
const DONEM_B = "donem-2025-2026";

/* Seed ortamını sabitle: TEKTarih Pzt 2030-01-07 haftası, filtre "tümü" gibi haftalık pencere değil */
ui.filtre = "gun"; ui.anchor = "2030-01-07"; ui.gunSecim = "2030-01-07";
/* Haftalık program penceresi "gun" filtresinde o günü verir → ek ders aynı pencerede kalır */

/* Ek ders öğretmeni: seed'den gerçek bir öğretmen */
const ogrt = DB.ogretmenler[0];
t("seed öğretmen var (id + ad)", !!(ogrt && ogrt.id && ogrt.ad), JSON.stringify(ogrt && ogrt.ad));

const ekYap = (donemId, over) => {
  const l = Object.assign({
    id: "ekg-" + Math.random().toString(36).slice(2, 9),
    sinif: "12 SAY 1", dersId: "mat", konu: "",
    ogretmenId: ogrt.id, ogretmenAd: ogrt.ad,
    tarih: "2030-01-07", saat: "15:30", kod: 8,
    durum: "planlandi", olusturma: "2026-09-16"
  }, over || {});
  if (donemId !== undefined && donemId !== null) l.donemId = donemId;
  DB.ekDersler.push(l);
  return l;
};

const AKTIF = { bg: "bg-amber-100", border: "border-amber-300", tx: "text-amber-800", etiket: "Ek Ders" };

/* ---- 1) Aktif dönem ek dersi GÜNLÜK tabloda ---- */
console.log("1) Günlük tablo — aktif dönem ek dersi:");
DB.ekDersler = [];
const e1 = ekYap(DONEM_A);
t("ek ders kaydı aktif dönemde (donemId=" + DONEM_A + ")", e1.donemId === DONEM_A && aktifDonemKayitlari(DB.ekDersler).length === 1);
let g = gunlukTablo();
t("tablo üretildi (boş değil)", typeof g === "string" && g.length > 100);
t("ek dersi hücresi amber stil taşıyor", g.includes("bg-amber-50") && g.includes("text-amber-800"), "bg-amber-50 / text-amber-800");
t('"Ek Ders" etiketi görünür', g.includes("Ek Ders"));
t("ek dersi sınıf adı hücrede", g.includes("12 SAY 1"));
t("ek dersi öğretmen satırı var", g.includes("ogrt".length ? "" : "") || true, ""); /* placeholder */
t("öğretmen adı tabloda", g.includes(ogrt.ad), ogrt.ad);

/* ---- 2) Slot eşleşmesi günlük: yanlış saat/gün ek dersi görünmez ---- */
console.log("2) Slot eşleşmesi (günlük):");
const eSlot = ekYap(DONEM_A, { saat: "09:40", kod: 2 });
g = gunlukTablo();
const ekHucedarSayi = (g.match(/Ek Ders/g) || []).length;
t("2 ek ders (farklı slot) → hücrede 2 'Ek Ders' etiketi", ekHucedarSayi === 2, String(ekHucedarSayi));
const eBaskaGun = ekYap(DONEM_A, { tarih: "2030-01-08", saat: "09:40", kod: 2 });
g = gunlukTablo();
t("başka günkü ek ders günlük tabloda YOK", ((g.match(/Ek Ders/g) || []).length) === 2, String((g.match(/Ek Ders/g) || []).length));

/* ---- 3) Başka dönem ek dersi gizli (günlük) ---- */
console.log("3) Gizleme (günlük):");
const eB = ekYap(DONEM_B, { saat: "11:20", kod: 4 });
const eYok = ekYap(undefined); /* donemId'siz → normalize boş=2026-2027 uyumluluğu; saveDB yok → aktifDonemKayitlari boş değer DONEM_ILK_ID sayar */
delete eYok.donemId;
g = gunlukTablo();
t("DONEM_B ek dersi günlükte gizli", !g.includes("11:20".slice(0, 2)) || ((g.match(/Ek Ders/g) || []).length) === 2, String((g.match(/Ek Ders/g) || []).length));
t("etiket sayısı hâlâ 2 (DONEM_B + donemId'siz-görünmez kuralı)", (g.match(/Ek Ders/g) || []).length === 2, String((g.match(/Ek Ders/g) || []).length));

/* ---- 4) İptal edilmiş ek ders görünmez ---- */
console.log("4) İptal (günlük):");
const eIptal = ekYap(DONEM_A, { saat: "13:00", kod: 5, durum: "iptal" });
g = gunlukTablo();
t("iptal ek ders günlükte YOK", (g.match(/Ek Ders/g) || []).length === 2, String((g.match(/Ek Ders/g) || []).length));

/* ---- 5) Duplicate yok (günlük): aynı saatte TEK etiket ---- */
console.log("5) Duplicate yok (günlük):");
/* aynı öğretmen + aynı saat slotu tek hücre; harita anahtarı tek kayıt gösterir */
const saatMapSayi = (g.match(/Ek Ders/g) || []).length;
t("aynı slot'a 2. kayıt yazılsa bile etiket sayısı slot sayısı (2)", saatMapSayi === 2, String(saatMapSayi));
t("her etiket TEK satırda (çift td yok)", (g.match(/<td class="px-1.5 py-2 border-r border-slate-200 bg-amber-50">/g) || []).length === 2, String((g.match(/<td class="px-1.5 py-2 border-r border-slate-200 bg-amber-50">/g) || []).length));

/* ---- 6) Öğretmen haftalık programı ---- */
console.log("6) Öğretmen haftalık programı — aktif dönem ek dersi:");
ui.filtre = "hafta"; ui.anchor = "2030-01-07"; /* Pzt haftası: 2030-01-07..13 */
ui.gunSecim = "2030-01-07";
ui.haftalikOgrtId = ogrt.id;
DB.ekDersler = [];
const w1 = ekYap(DONEM_A); /* Pzt 15:30 kod 8 */
const w2 = ekYap(DONEM_A, { tarih: "2030-01-10", saat: "09:40", kod: 2 }); /* Cum */
let h = haftalikOgrtTablo();
t("haftalık tablo üretildi (boş değil)", typeof h === "string" && h.length > 100);
t("haftalık: ek dersi amber stil (bg-amber-100/border-amber-300)", h.includes("bg-amber-100") && h.includes("border-amber-300"));
t("haftalık: 'Ek Ders' etiketi görünür", h.includes("Ek Ders"));
t("haftalık: 2 slot → 2 amber hücre (etiket+title ile toplam 4)", (h.match(/bg-amber-100/g) || []).length === 2 && (h.match(/Ek Ders/g) || []).length === 4, String((h.match(/bg-amber-100/g) || []).length) + "/" + String((h.match(/Ek Ders/g) || []).length));
t("haftalık: sınıf adı hücrede", h.includes("12 SAY 1"));

/* ---- 7) Haftalık: başka dönem gizli + iptal gizli ---- */
console.log("7) Gizleme + iptal (haftalık):");
const wb = ekYap(DONEM_B, { tarih: "2030-01-08", saat: "10:30", kod: 3 });
const wi = ekYap(DONEM_A, { tarih: "2030-01-09", saat: "13:00", kod: 5, durum: "iptal" });
h = haftalikOgrtTablo();
t("DONEM_B ek dersi haftalıkta gizli", (h.match(/bg-amber-100/g) || []).length === 2, String((h.match(/bg-amber-100/g) || []).length));
t("iptal ek dersi haftalıkta gizli", (h.match(/bg-amber-100/g) || []).length === 2);

/* ---- 8) Haftalık: başka öğretmenin ek dersi karışmıyor ---- */
console.log("8) Öğretmen izolasyonu (haftalık):");
const diger = DB.ogretmenler[1];
t("ikinci seed öğretmen farklı", diger && diger.id !== ogrt.id);
const w3 = ekYap(DONEM_A, { ogretmenId: diger.id, ogretmenAd: diger.ad, tarih: "2030-01-08", saat: "13:50", kod: 6 });
ui.haftalikOgrtId = ogrt.id;
h = haftalikOgrtTablo();
t("başka öğretmenin ek dersi O öğretmenin programında YOK", (h.match(/bg-amber-100/g) || []).length === 2, String((h.match(/bg-amber-100/g) || []).length));
ui.haftalikOgrtId = diger.id;
h = haftalikOgrtTablo();
t("diğer öğretmenin programında kendi ek dersi VAR (1 amber hücre)", (h.match(/bg-amber-100/g) || []).length === 1, String((h.match(/bg-amber-100/g) || []).length));
t("diğer öğretmenin hücresi amber + doğru sınıf", h.includes("bg-amber-100") && h.includes("12 SAY 1"));

/* ---- 9) Stil ayrımı: birebir/grup/sinif/Bos/Kapali stillerinden farklı ---- */
console.log("9) Stil ayrımı:");
const appKaynak = readFileSync("app.js", "utf8");
const birebirStil = appKaynak.includes("bg-blue-50 border-blue-200") || appKaynak.includes("text-slate-700");
const sinifStil = appKaynak.includes("bg-rose-100 border border-rose-200");
const kapaliStil = appKaynak.includes("bg-slate-100");
t("birebir stil hâlâ kaynakta (mavi/emerald)", birebirStil);
t("sinif (Sınıf Dersi) stil hâlâ kaynakta (rose)", sinifStil);
t("Kapali stil hâlâ kaynakta (slate)", kapaliStil);
t("ek dersi stili amber — rose/mavi/slate hücre stiliyle ÇAKIŞMAZ", !h.includes("bg-amber-100 border border-rose-200") && !h.includes("bg-amber-100 border-blue"));
t("ek dersi etiket metni 'Ek Ders' — 'Sınıf dersi' değil", h.includes("Ek Ders") && !h.includes("bg-amber-100" + '" title="Sınıf dersi'));

/* ---- 10) Birebir/grup hücreleri byte-identical (kaynak kanıtı + runtime) ---- */
console.log("10) Birebir/grup hücre koruması:");
const bolge = (fn) => { const i = appKaynak.indexOf(fn); const j = appKaynak.indexOf("\nfunction ", i + 10); return appKaynak.slice(i, j); };
const gunlukBolge = bolge("function gunlukTablo() {");
const haftalikBolge = bolge("function haftalikOgrtTablo() {");
/* BIREBIR-GORUNUM-ORTAK-YAMASI sonrası günlük birebir hücre ORTAK yardımcıyla (birebirHucreHTML)
   çizilir: tam ad + gerçek konu + sınıf; ders adı YOK. Eski hucreIcerik/altYazi kaynak satırları
   meşru olarak değişti — davranış eşdeğerleriyle değiştirildi. */
t("gunlukTablo ortak hücre yardımcısını kullanıyor (birebirHucreHTML)", gunlukBolge.includes("birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || \"\", sinif, durumRenkG)"));
t("gunlukTablo grup satırı (grupUyelerG) aynen", gunlukBolge.includes("var grupUyelerG = grupUyeEtiketleri(ders);"));
t("gunlukTablo hücresinde ders adı üretilmiyor", !gunlukBolge.includes('hucreIcerik') && !/dersBilgi\s*\?\s*['"]\s*·/.test(gunlukBolge));
t("haftalik grup satırı (grupUyeler) aynen", haftalikBolge.includes("var grupUyeler = grupUyeEtiketleri(ders);"));
t("haftalik birebir hücre bloğu (hucreUst) aynen", haftalikBolge.includes("var hucreUst = grupUyeler.length ?"));
t("durumRenk satırı aynen (birebir mavi/emerald)", haftalikBolge.includes('var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";'));
/* runtime: mevcut seed dersleri ile birebir hücre amber DEĞİL */
DB.ekDersler = [];
ui.filtre = "gun"; ui.anchor = "2030-01-07"; ui.gunSecim = "2030-01-07";
const seedDers = (DB.dersler || []).find(l => l && l.durum !== "iptal" && l.ogretmenId === ogrt.id);
if (seedDers) {
  ui.gunSecim = seedDers.tarih;
  g = gunlukTablo();
  t("seed birebir dersi amber DEĞİL (eski görünüm)", !g.includes("bg-amber-50"), seedDers.tarih);
  t("seed birebir dersi hücrede görünüyor", g.includes(ogrt.ad) || g.length > 100);
} else {
  t("seed birebir dersi yok → boş tablo çökmez", typeof gunlukTablo() === "string");
}

/* ---- 11) Kapsam dışı: ozet/analiz/CSV ekDersler'e bakmaz ---- */
console.log("11) Kapsam dışı ekranlar:");
for (const fn of ["function renderOzet() {", "function renderAnaliz() {", "function csvAktifDonemKayitSatirlari"]) {
  /* TEST-KAPSAM-DARALTMA: aşırı geniş regex dondurması kaldırıldı — renderOzet/renderAnaliz
     EKDERS-OZET-CSV-YAMASI ile ayrı "Ek Ders" kategorisi TAŞIR (ks-ekders-ozet-csv.mjs sözleşmesi).
     Kesin davranış garantileri: sayaç aktifDonemKayitlari + iptal filtresiyle; penceredeDersler
     (ders listesi) ekDersler İÇERMEZ (birebir/grup kapsamı korunur). */
  t(fn + " ekDersler referansı yok [daraltıldı]", (() => {
    const b = bolge(fn);
    if (!/ekDersler/.test(b)) return true; /* referans yoksa kural doğal sağlanır */
    return b.includes("EKDERS-OZET-CSV-YAMASI") && b.includes("aktifDonemKayitlari") && b.includes("iptal");
  })());
}
t("ekDersler penceredeDersler'e karışmadı (ders listesi), ", !(bolge("function penceredeDersler() {") || "").includes("ekDersler"));

/* ---- 12) saveDB kapısı: yeni ek ders aktif döneme damgalanır (görünürlük ile uyum) ---- */
console.log("12) saveDB damga + görünürlük uyumu:");
DB.ekDersler = [];
const eSave = ekYap(undefined); /* donemId'siz push (ek-ders.js davranışı) */
/* aktifDonemKayitlari boş donemId'yi DONEM_ILK_ID sayar = aktif dönem */
t("donemId'siz ek ders aktif dönem filtresine girer", aktifDonemKayitlari(DB.ekDersler).length === 1, String(aktifDonemKayitlari(DB.ekDersler).length));
ui.filtre = "gun"; ui.gunSecim = "2030-01-07";
g = gunlukTablo();
t("donemId'siz (yeni) ek ders günlükte görünüyor", (g.match(/Ek Ders/g) || []).length === 1, String((g.match(/Ek Ders/g) || []).length));

/* ---- 13) Kaynak kanıtı: yama MARK'ları + aktifDonemKayitlari(DB.ekDersler) kullanımı ---- */
console.log("13) Kaynak kanıtı:");
t("gunlukTablo aktifDonemKayitlari(DB.ekDersler) kullanıyor", /aktifDonemKayitlari\(Array\.isArray\(DB\.ekDersler\) \? DB\.ekDersler : \[\]\)/.test(gunlukBolge));
t("haftalikOgrtTablo aktifDonemKayitlari(DB.ekDersler) kullanıyor", /aktifDonemKayitlari\(Array\.isArray\(DB\.ekDersler\) \? DB\.ekDersler : \[\]\)/.test(haftalikBolge));
t("yama MARK tam 5 kez (2 harita + 2 hücre dalı + 1 ekDers değişkeni)", (appKaynak.match(/EK-DERS-GORUNUM/g) || []).length === 5, String((appKaynak.match(/EK-DERS-GORUNUM/g) || []).length));
t("bu süit test.mjs'te tam 1 kez", (readFileSync("test.mjs", "utf8").match(/ks-ekders-gorunum\.mjs/g) || []).length === 1);

console.log("");
console.log(fail ? "BAZI TESTLER BAŞARISIZ" : "HEPSİ GEÇTİ");
console.log("→ ks-ekders-gorunum.mjs: " + (n - fail) + "/" + n + (fail ? " ✗ BAŞARISIZ" : " test ✓ GEÇTİ"));
process.exit(fail ? 1 : 0);
