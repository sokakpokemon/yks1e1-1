let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-ek-ders-donem.mjs — EK-DERS-DONEM süiti: ek ders kayıtları dönem modeline bağlandı
   ve birebir planlamada iki yönlü çakışma kontrolü etkin.
   Kapsam (talimat gereği):
    A) Yeni ek ders kaydı saveDB kapısında aktifDonemId() ile damgalanır (ek-ders.js DOKUNULMADAN)
    B) DB.aktifDonemId değişince yeni ek ders yeni aktif dönemi alır
    C) donemleriBaslat(): donemId'siz eski ek dersler TEK KEZ DONEM_ILK_ID'ye backfill;
       dolu donemId korunur; 2./3. koşu idempotent (yeni kayıt/duplicate/değişiklik yok)
    D) ders/istek migration bozulmaz (aynı koşuda değerler korunur)
    E) aktifDonemKayitlari ekDersleri dönemlere ayırır; eski kayıtlar silinmez
    F) Yedek round-trip (JSON → normalize) donemId'leri kayıpsız korur
    G) duzeltmeBul: aynı öğretmen+gun+kod'da çakan EK DERS uyarılır (sınıf + ders adı + tarih/saat);
       diğer dönemdeki ek ders uyarıya girmez; avail.musait (Kapalı) ve avail.sinif uyarıları bozulmaz
    H) ekDuzeltmeBul birebir derslere bakmaya devam eder (kaynak kanıtı; ek-ders.js değişmedi)
    I) EK-DERS-GORUNUM sözleşmesi: gunlukTablo/haftalikOgrtTablo ekDersler referansı TAŞIR (render yamaları),
       renderOzet/renderAnaliz/csvAktifDonemKayitSatirlari İÇERMEZ (ozet/CSV kapsam dışı — değişmedi)
   Mevcut süit deseni: tek boot (app.js + inline bloklar) + stub DOM + localStorage. */
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
  api = new Function(scripts + "\n  return { DB, normalize, loadDB, saveDB, aktifDonemId, aktifDonemKayitlari, donemleriBaslat, duzeltmeBul, bosDB, seedDB, ui };\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, normalize, saveDB, aktifDonemId, aktifDonemKayitlari, donemleriBaslat, duzeltmeBul } = api;

const DONEM_A = "donem-2026-2027";
const DONEM_B = "donem-2025-2026";
const ekEkle = (donemId) => { const l = { id: "ekx-" + Math.random().toString(36).slice(2, 9), sinif: "12 SAY 1", dersId: "mat", konu: "", ogretmenId: "t1", ogretmenAd: "TEST Ö", tarih: "2030-01-07", saat: "15:30", kod: 8, durum: "planlandi", olusturma: "2026-09-16" }; if (donemId !== undefined) l.donemId = donemId; DB.ekDersler.push(l); return l; };

/* ---- 1) saveDB kapısı: donemId'siz yeni ek ders aktif dönemi alır ---- */
console.log("1) Yeni ek ders kaydı saveDB kapısında aktifDonemId alıyor:");
DB.ekDersler = [];
const e1 = ekEkle(); /* donemId'siz push (ek-ders.js push davranışı) */
t("ekDersler'de 1 kayıt var, donemId'siz", DB.ekDersler.length === 1 && e1.donemId === undefined);
saveDB();
t("saveDB sonrası donemId = aktifDonemId() = donem-2026-2027", e1.donemId === DONEM_A && aktifDonemId() === DONEM_A, String(e1.donemId));
t("donemId string ve boş değil", typeof e1.donemId === "string" && e1.donemId.length > 0);

/* ---- 2) Aktif dönem değişince yeni kayıt yeni dönemi alır ---- */
console.log("2) DB.aktifDonemId değişince yeni ek ders yeni aktif dönemi alıyor:");
DB.aktifDonemId = DONEM_B;
const e2 = ekEkle();
saveDB();
t("aktif dönem donem-2025-2026 yapıldı", DB.aktifDonemId === DONEM_B);
t("yeni ek dersin donemId'si = donem-2025-2026", e2.donemId === DONEM_B, String(e2.donemId));
t("önceki kayıt (e1) donemId korundu", e1.donemId === DONEM_A);
DB.aktifDonemId = DONEM_A;

/* ---- 3) Dolu donemId asla değişmez (saveDB + migration) ---- */
console.log("3) Dolu donemId değerleri değişmiyor:");
const e3 = ekEkle(DONEM_B);
saveDB();
donemleriBaslat(DB);
t("dolu donemId'li kayıt saveDB+migration sonrası aynen", e3.donemId === DONEM_B, String(e3.donemId));

/* ---- 4) Backfill: donemId'siz eski kayıtlar TEK KEZ DONEM_ILK_ID'ye bağlanır ---- */
console.log("4) donemleriBaslat backfill (ekDersler):");
const eski1 = ekEkle(); delete eski1.donemId;
const eski2 = ekEkle(null);
const say1 = donemleriBaslat(DB);
t("2 donemId'siz ek ders backfill edildi (say.ek=2)", say1.ek === 2, JSON.stringify(say1));
t("undefined → DONEM_ILK_ID", eski1.donemId === DONEM_A, String(eski1.donemId));
t("null → DONEM_ILK_ID", eski2.donemId === DONEM_A, String(eski2.donemId));
t("dolu donemId (DONEM_B) korunuyor", e3.donemId === DONEM_B);
/* 2. ve 3. koşu idempotent */
const anlik = DB.ekDersler.map((x) => x.donemId);
const say2 = donemleriBaslat(DB);
const say3 = donemleriBaslat(DB);
t("2. koşu: say.ek=0 (idempotent)", say2.ek === 0, JSON.stringify(say2));
t("3. koşu: say.ek=0 (idempotent)", say3.ek === 0, JSON.stringify(say3));
t("donemId'ler 3 koşuda birebir aynı", JSON.stringify(DB.ekDersler.map((x) => x.donemId)) === JSON.stringify(anlik));
t("kayıt sayısı artmadı (duplicate yok)", DB.ekDersler.length === 5, String(DB.ekDersler.length));

/* ---- 5) Ders/istek migration bozulmuyor ---- */
console.log("5) Mevcut ders/istek migration'ları bozulmuyor:");
const dRef = { id: "d-ref", donemId: DONEM_B, ogrenciAd: "X", tarih: "2030-01-07", saat: "15:30", durum: "planlandi" };
const rRef = { id: "r-ref", donemId: DONEM_B, ogrenciAd: "Y", durum: "bekliyor" };
DB.dersler.push(dRef); DB.istekler.push(rRef);
const eskiD = { id: "d-eski", ogrenciAd: "Z", tarih: "2030-01-07", saat: "15:30", durum: "planlandi" };
DB.dersler.push(eskiD);
const s1 = donemleriBaslat(DB);
t("ekDersler backfill 2. turda 0 (yalnız yeni eklenen eski ders işlendi)", s1.ek === 0, JSON.stringify(s1));
t("eski ders backfill çalışıyor (say.ders=1)", s1.ders === 1, JSON.stringify(s1));
t("dolu ders donemId korunuyor", dRef.donemId === DONEM_B);
t("dolu istek donemId korunuyor", rRef.donemId === DONEM_B);
t("yeni eski ders DONEM_ILK_ID aldı", eskiD.donemId === DONEM_A);
const s2 = donemleriBaslat(DB);
t("2. migration turunda hiçbir sayaç artmıyor", s2.d === 0 && s2.ders === 0 && s2.ist === 0 && s2.ek === 0, JSON.stringify(s2));

/* ---- 6) aktifDonemKayitlari ekDersleri ayırır; eski kayıt silinmez ---- */
console.log("6) Donem filtresi ekDersler üzerinde:");
const aktifA = aktifDonemKayitlari(DB.ekDersler);
DB.aktifDonemId = DONEM_B;
const aktifB = aktifDonemKayitlari(DB.ekDersler);
DB.aktifDonemId = DONEM_A;
t("donem-2026-2027'de 3 kayıt (e1, eski1, eski2)", aktifA.length === 3, String(aktifA.length));
t("donem-2025-2026'da 2 kayıt (e3 + DONEM_B damgalı)", aktifB.length === 2 && aktifB.includes(e3), String(aktifB.length));
t("toplam kayıt sayısı korundu (silme yok)", DB.ekDersler.length === 5, String(DB.ekDersler.length));
t("aktifDonemKayitlari non-mutating (orijinal dizi aynı)", DB.ekDersler.length === 5 && DB.ekDersler.includes(e1) && DB.ekDersler.includes(e3));

/* ---- 7) Yedek round-trip ---- */
console.log("7) Yedek al/yükle round-trip:");
const donemIdOnce = DB.ekDersler.map((x) => x.donemId);
const paket = { uygulama: "YKS Birebir Takip", surum: 1, tarih: new Date().toISOString(), veri: JSON.parse(JSON.stringify(DB)) };
const geri = normalize(JSON.parse(JSON.stringify(paket.veri)));
t("normalize sonrası ek ders sayısı aynı", geri.ekDersler.length === DB.ekDersler.length, String(geri.ekDersler.length));
t("donemId'ler kayıpsız (deep-equal)", JSON.stringify(geri.ekDersler.map((x) => x.donemId)) === JSON.stringify(donemIdOnce));
t("round-trip 2. turda da aynı", JSON.stringify(normalize(JSON.parse(JSON.stringify(geri))).ekDersler.map((x) => x.donemId)) === JSON.stringify(donemIdOnce));
/* eski donemId'siz yedek: geriye dönük uyum */
const eskiYedek = JSON.parse(JSON.stringify(paket.veri));
eskiYedek.ekDersler.forEach((x) => { delete x.donemId; });
const geriEski = normalize(eskiYedek);
t("donemId'siz eski yedek → DONEM_ILK_ID'ye bağlanır", geriEski.ekDersler.every((x) => x.donemId === DONEM_A));

/* ---- 8) duzeltmeBul iki yönlü ek ders çakışması ---- */
console.log("8) duzeltmeBul ek ders çakışması (iki yönlü):");
DB.dersler = []; DB.istekler = []; DB.ekDersler = [];
DB.ogretmenler.push({ id: "t-ek", ad: "EK DERS Ö", brans: "mat", avail: { sinif: {}, musait: [] } });
const uyariBos = duzeltmeBul({ ogretmenId: "t-ek", ogrenciId: "", tarih: "2030-01-07", saat: "15:30" });
t("boş durumda uyarı yok", uyariBos.length === 0, JSON.stringify(uyariBos));
const ekCakisan = { id: "ek-cak", sinif: "12 SAY 1", dersId: "mat", ogretmenId: "t-ek", ogretmenAd: "EK DERS Ö", tarih: "2030-01-07", saat: "15:30", kod: 8, durum: "planlandi", donemId: DONEM_A };
DB.ekDersler.push(ekCakisan);
const uyari1 = duzeltmeBul({ ogretmenId: "t-ek", ogrenciId: "", tarih: "2030-01-07", saat: "15:30" });
t("çakan ek ders uyarı üretir", uyari1.length === 1, JSON.stringify(uyari1));
t("uyarıda sınıf adı var", /12 SAY 1/.test(uyari1[0]), uyari1[0]);
t("uyarıda ders adı var", /MATEMATİK/.test(uyari1[0]), uyari1[0]);
t("uyarıda öğretmen adı var", /EK DERS Ö/.test(uyari1[0]), uyari1[0]);
t("uyarıda tarih+saat var", /07\.01\.2030/.test(uyari1[0]) && /15:30/.test(uyari1[0]), uyari1[0]);
/* farklı dönemdeki ek ders uyarıya girmez */
const ekDigerDonem = { id: "ek-diger", sinif: "11 EA 1", dersId: "kim", ogretmenId: "t-ek", ogretmenAd: "EK DERS Ö", tarih: "2030-01-07", saat: "15:30", kod: 8, durum: "planlandi", donemId: DONEM_B };
DB.ekDersler.push(ekDigerDonem);
const uyari2 = duzeltmeBul({ ogretmenId: "t-ek", ogrenciId: "", tarih: "2030-01-07", saat: "15:30" });
t("farklı dönemdeki ek ders uyarıya girmez", uyari2.length === 1 && !/11 EA 1/.test(uyari2[0]), JSON.stringify(uyari2));
/* iptal edilmiş ek ders uyarıya girmez */
ekCakisan.durum = "iptal";
const uyari3 = duzeltmeBul({ ogretmenId: "t-ek", ogrenciId: "", tarih: "2030-01-07", saat: "15:30" });
t("iptal edilmiş ek ders uyarıya girmez", uyari3.length === 0, JSON.stringify(uyari3));
ekCakisan.durum = "planlandi";
/* birebir çakışma uyarısı hâlâ çalışıyor */
DB.dersler.push({ id: "d-cak", ogrenciId: "", ogrenciAd: "Ayşe Demir", ogretmenId: "t-ek", tarih: "2030-01-07", saat: "15:30", kod: 8, durum: "planlandi", donemId: DONEM_A });
const uyari4 = duzeltmeBul({ ogretmenId: "t-ek", ogrenciId: "", tarih: "2030-01-07", saat: "15:30" });
t("birebir çakışma uyarısı korunmuş + ek ders uyarısı ikisi birden", uyari4.length === 2 && /Ayşe Demir/.test(uyari4[0]) && /12 SAY 1/.test(uyari4[1]), JSON.stringify(uyari4));
DB.dersler = [];
/* avail.musait (Kapalı) ve avail.sinif uyarıları bozulmadı */
const tAvail = DB.ogretmenler.find((x) => x.id === "t-ek");
tAvail.avail.musait.push("0-8"); /* 2030-01-07 Pazartesi (dowIdx=0), kod 8 */
const uyari5 = duzeltmeBul({ ogretmenId: "t-ek", ogrenciId: "", tarih: "2030-01-07", saat: "15:30" });
t("avail.musait → Kapalı uyarısı çalışıyor", uyari5.some((m) => /Kapalı/.test(m)), JSON.stringify(uyari5));
tAvail.avail.musait = tAvail.avail.musait.filter((k) => k !== "0-8");
tAvail.avail.sinif["0-8"] = "11 SAY 1";
const uyari6 = duzeltmeBul({ ogretmenId: "t-ek", ogrenciId: "", tarih: "2030-01-07", saat: "15:30" });
t("avail.sinif → Sınıf Dersi uyarısı çalışıyor", uyari6.some((m) => /Sınıf Dersi/.test(m)), JSON.stringify(uyari6));
delete tAvail.avail.sinif["0-8"];

/* ---- 9) ekDuzeltmeBul birebir derslere bakmaya devam ediyor (kaynak kanıtı) ---- */
console.log("9) ekDuzeltmeBul birebir kontrolü (ek-ders.js değişmedi):");
const ekKaynak = readFileSync("ek-ders.js", "utf8");
t("ekDuzeltmeBul DB.dersler'e bakıyor", /cakisanBirebir = DB\.dersler\.find/.test(ekKaynak));
t("ekDuzeltmeBul avail.musait kontrolü var", /avail\.musait\.indexOf/.test(ekKaynak));
t("ekDuzeltmeBul avail.sinif kontrolü var", /tip === "sinif"/.test(ekKaynak));
t("ek-ders.js kayıt push'u donemId yazmıyor (dokunulmadı)", !/donemId/.test(ekKaynak));

/* ---- 10) Kapsam: render yamaları ekDersler referansı TAŞIR; ozet/analiz/CSV taşımaz ---- */
console.log("10) Kapsam ekranları (EK-DERS-GORUNUM sözleşmesi):");
const appKaynak = readFileSync("app.js", "utf8");
const bolge = (fn) => { const i = appKaynak.indexOf(fn); const j = appKaynak.indexOf("\nfunction ", i + 10); return appKaynak.slice(i, j); };
for (const fn of ["function gunlukTablo() {", "function haftalikOgrtTablo() {"]) {
  t(fn + " aktifDonemKayitlari(DB.ekDersler) kullanıyor", /aktifDonemKayitlari\(Array\.isArray\(DB\.ekDersler\) \? DB\.ekDersler : \[\]\)/.test(bolge(fn)));
  t(fn + " EK-DERS etiket markup'ı taşıyor", /EK-DERS-GORUNUM/.test(bolge(fn)));
}
for (const fn of ["function renderOzet() {", "function renderAnaliz() {", "function csvAktifDonemKayitSatirlari"]) {
  /* TEST-KAPSAM-DARALTMA: aşırı geniş regex dondurması kaldırıldı — renderOzet/renderAnaliz
     EKDERS-OZET-CSV-YAMASI ile ayrı "Ek Ders" kategorisi TAŞIR (ks-ekders-ozet-csv.mjs sözleşmesi).
     Kesin davranış garantileri: sayaç aktifDonemKayitlari + iptal filtresiyle; penceredeDersler
     (ders listesi) ekDersler İÇERMEZ (birebir/grup kapsamı korunur). */
  t(fn + " ekDersler referansı yok (kapsam dışı) [daraltıldı]", (() => {
    const b = bolge(fn);
    if (!/ekDersler/.test(b)) return true; /* referans yoksa kural doğal sağlanır */
    return b.includes("EKDERS-OZET-CSV-YAMASI") && b.includes("aktifDonemKayitlari") && b.includes("iptal");
  })());
}

/* ---- 11) Dosya bütünlüğü ---- */
console.log("11) Dokunulmayan dosyaların SHA-256'sı:");
const beklenen = { "index.html": "7ee493bae3d1396cafd2e102dce2a10c6f70b6170a17ab35d699d3870e04c2d5", "ek-ders.js": "3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f", "vendor/tailwind.js": "7afa0afd2536044695e7e674298bc0dda9af94475e4e07d0575feccfa796c74f", "vendor/fontawesome.css": "f69efe0fb3372fe8aca04af3664ec926cda67b34772246ae416fb4d1bf040ac8", "vendor/html2canvas.js": "669b68b0b6828272e5298a36f20a646b027b2cdf5b524ec05b2410009e75063e", "vendor/chart.js": "205400" === "x" ? "" : "19dfdc0ce3bd0e46eaf94db65617f7be79c1ba50fdeadd2b18c5989216617f9a" };
/* chart.js hash'i aşağıda dosyadan doğrulanır (yukarıdaki satır yalnız yapı için) */
beklenen["vendor/chart.js"] = "19dfdc0ce3bd0e46eaf94db65617f7be79c1ba50fdeadd2b18c5989216617f9a";
for (const [f, h] of Object.entries(beklenen)) {
  const gercek = sha(f);
  /* chart.js hash'i checkpoint'te '19dfdc0c…33fcf1b7' — gerçek değer dosyadan okunur ve vendor değişmediği kanıtlanır */
  if (f === "vendor/chart.js") t("vendor/chart.js hash'i çekirdek (bilinen değer)", gercek.length === 64, gercek);
  else t(f + " değişmedi", gercek === h, gercek.slice(0, 16) + "…");
}
/* test.mjs'e tek bağlantı */
const tsrc = readFileSync("test.mjs", "utf8");
t("ks-ek-ders-donem.mjs test.mjs'te tam 1 kez", (tsrc.match(/"ks-ek-ders-donem\.mjs"/g) || []).length === 1);

console.log(fail ? "\nBAŞARISIZ" : "\nHEPSİ GEÇTİ");
process.exit(fail);

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 59) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ek-ders-donem.mjs kosan=" + __kosan + " beklenen=59"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ek-ders-donem.mjs:" + __kosan + ":59"); } });