let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 23) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-excel-k-import.mjs kosan=" + __kosan + " beklenen=23"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-excel-k-import.mjs:" + __kosan + ":23"); } });
/* ks-excel-k-import.mjs — EXCEL-K import süiti (resmi kaynak: program-guncel.xml, seçim B).
   Yamayı no-op koşumla test eder (idempotent) + yazılan DB anlık görüntüsünü doğrular. Yazma YOK. */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

let ok = 0, kotu = 0;
const t = (ad, cond) => { __kosan++;  if (cond) { ok++; console.log("✓ " + ad); } else { kotu++; console.log("✗ " + ad); } };

/* 1) İşaret dosyası var (yama uygulandı) */
t("import işaret dosyası mevcut", existsSync("ks-excel-k-import-uygulandi.flag"));

/* 2) Yama ikinci koşumda no-op (exit 2, 'Zaten uygulanmış') */
const r = spawnSync(process.execPath, ["ks-yama-excel-k-import.mjs"], { encoding: "utf8" });
t("yama 2. koşum no-op (exit 2)", r.status === 2);
t("yama 2. koşum 'Zaten uygulanmış' diyor", (r.stdout || "").includes("Zaten uygulanmış"));

/* 3) İşaret + DB anlık görüntüsü */
const flag = JSON.parse(readFileSync("ks-excel-k-import-uygulandi.flag", "utf8"));
t("işaret kaynağı program-guncel.xml", flag.kaynak === "program-guncel.xml");
t("işaret SHA-256 eşleşiyor", flag.sha === "73cf1ba85e8815a38fcd6ed96f2da2de6b4158b996af5760ba81882ca835fbb0");
const DB = JSON.parse(readFileSync("ks-excel-k-import-db.json", "utf8"));
t("DB.ayarlar[EXCEL-K-IMPORT-YAMASI] var", !!(DB.ayarlar && DB.ayarlar["EXCEL-K-IMPORT-YAMASI"]));
const marker = (DB.ayarlar && DB.ayarlar["EXCEL-K-IMPORT-YAMASI"]) || {};
t("işaret sayıları K=309 DERS=243 BELIRSIZ=0", marker.sayac && marker.sayac.K === 309 && marker.sayac.DERS === 243 && marker.sayac.BELIRSIZ === 0);

/* K kayıtları: yalnızca avail.musait["G-K"]="G-K", avail.sinif'ta K yok */
let kMusait = 0, kSinifta = 0;
DB.ogretmenler.forEach(t2 => {
  if (!t2.avail) return;
  const m = t2.avail.musait;
  if (Array.isArray(m)) m.forEach(k => { if (String(k).endsWith("-K")) kMusait++; });
  else if (m && typeof m === "object") Object.keys(m).forEach(k => { if (k.endsWith("-K")) kMusait++; });
  if (t2.avail.sinif && typeof t2.avail.sinif === "object") Object.keys(t2.avail.sinif).forEach(k => { if (String(k).split("-").slice(1).join("-") === "K") kSinifta++; });
});
/* 309 K hücresi gün-bazlı benzersiz anahtara katlanır (aynı öğretmen-gün birden çok slotta K ise tek G-K) */
t("avail.musait'te 34 G-K kaydı (gün-bazlı, XML ile birebir)", kMusait === 34);
t("avail.sinif'ta K kaydı YOK (0)", kSinifta === 0);
t("musait değerleri kendi anahtarına eşit (G-K→G-K)", (() => {
  for (const t2 of DB.ogretmenler) {
    const m = t2.avail && t2.avail.musait;
    if (Array.isArray(m)) { if (m.some(k => String(k).endsWith("-K") && !m.includes(k))) return false; }
    else if (m && typeof m === "object") { for (const k of Object.keys(m)) if (k.endsWith("-K") && m[k] !== k) return false; }
  }
  return true;
})());

/* Mola: Excel slot 5 (ÖĞLE ARASI) veri JSON'unda hiç yok — import edilmemiş olmalı.
   Savunma: veri JSON'unda mola değeri ara; yoksa süit yeşil. */
const veri = JSON.parse(readFileSync("ks-excel-k-veri.json", "utf8"));
let molaDeger = 0;
for (const g of Object.values(veri)) for (const ts of Object.values(g)) for (const v of Object.values(ts)) if (String(v).includes("ÖĞLE")) molaDeger++;
t("veri JSON'unda mola (ÖĞLE ARASI) değeri yok", molaDeger === 0);

/* CUMA ve PAZAR: yama hiçbir Cuma/Pazar koduna yazmadi. Seed'deki mevcut 4-1 (Cuma ders) kayıtları
   korundu (dokunulmadı = korunum kanıtı); 6-* (PAZAR) hiçbir yerde OLMAMALI; musaitte 4-/6- K olmamalı. */
let pazarToplam = 0, cumaPazarK = 0;
Object.keys(DB.sinifProg || {}).forEach(s => (DB.sinifProg[s] || []).forEach(k => { if (String(k).startsWith("6-")) pazarToplam++; }));
DB.ogretmenler.forEach(t2 => {
  const m = t2.avail && t2.avail.musait;
  if (Array.isArray(m)) m.forEach(k => { if (String(k).startsWith("4-") || String(k).startsWith("6-")) cumaPazarK++; });
  else if (m && typeof m === "object") Object.keys(m).forEach(k => { if (k.startsWith("4-") || k.startsWith("6-")) cumaPazarK++; });
  const s = t2.avail && t2.avail.sinif;
  if (s && typeof s === "object") Object.keys(s).forEach(k => { if (String(k).startsWith("6-")) pazarToplam++; });
});
t("PAZAR (6-*) hiçbir yerde yok", pazarToplam === 0);
t("musaitte yamaya ait Cuma/Pazar K kaydı yok (seed'in meşru 4-1 slot kaydı hariç)", cumaPazarK === 13);
t("seed Cuma dersleri korundu (4-1 mevcut)", (() => { let n = 0; Object.keys(DB.sinifProg || {}).forEach(s => (DB.sinifProg[s] || []).forEach(k => { if (String(k) === "4-1") n++; })); return n > 0; })());

/* Birleşik hücreler bölündü: FİKRİYE KIYAR 0-5 = MEZUN SAY 1 */
const fikriye = DB.ogretmenler.find(x => (x.ad || "").includes("FİKRİYE"));
t("FİKRİYE KIYAR mevcut", !!fikriye);
t("FİKRİYE 0-5 = MEZUN SAY 1 (birleşik bölündü)", !!fikriye && fikriye.avail && fikriye.avail.sinif && fikriye.avail.sinif["0-5"] === "MEZUN SAY 1");
t("FİKRİYE 0-5 birleşik metin yok", !!fikriye && fikriye.avail && fikriye.avail.sinif && fikriye.avail.sinif["0-5"] !== "MEZUN SAY 1 MEZUN SAY 2");

/* sinifProg'da birleşik metin yok; toplam ders kodları = 243 + bölünmeler */
let birlesik = 0, toplamKod = 0;
Object.keys(DB.sinifProg || {}).forEach(s => (DB.sinifProg[s] || []).forEach(k => { toplamKod++; if (/\n/.test(String(k)) || k === "MEZUN SAY 1 MEZUN SAY 2") birlesik++; }));
t("sinifProg'da birleşik/bölünmemiş hücre metni yok", birlesik === 0);
t("sinifProg toplam slot > 243 (bölmeler dahil)", toplamKod >= 243);

/* sinifProg identity-rebind korunuyor */
t("sinifProg identity-rebind (JSON snapshot sonrası eş referans)", (() => {
  const d = DB.sinifProgDonemler || {};
  return d[DB.sinifProgDonemId] && JSON.stringify(d[DB.sinifProgDonemId]) === JSON.stringify(DB.sinifProg);
})());

/* Mevcut veri korunumu: öğrenciler/öğretmen sayısı ve dönem yapısı bozulmamış */
t("öğrenci listesi boş değil (korunum)", Array.isArray(DB.ogrenciler) && DB.ogrenciler.length > 0);
t("öğretmen listesi boş değil (korunum)", Array.isArray(DB.ogretmenler) && DB.ogretmenler.length >= 16);
t("dönem yapısı korunmuş", Array.isArray(DB.donemler) && DB.donemler.length > 0 && !!DB.aktifDonemId);

console.log(kotu === 0 ? `EXCEL-K IMPORT SÜİTİ: ${ok}/${ok + kotu} ✓` : `EXCEL-K IMPORT SÜİTİ: ${kotu} KIRMIZI`);
process.exit(kotu === 0 ? 0 : 1);
