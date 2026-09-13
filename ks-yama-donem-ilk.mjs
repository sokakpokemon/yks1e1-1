/* ks-yama-donem-ilk.mjs — DONEM-ILK-YAMASI: 2026/2027 dönem modeli, yalnızca VERİ-UYUMLULUK dilimi.
   app.js'e hedefli yama (baştan yazma YOK). Assert'li + idempotent:
     P1) donemleriBaslat() veri katmanı fonksiyonu (donemler/aktifDonemId/sinifProgDonemId/donemId backfill)
     P2) bosDB() şemasına dönem alanları (donemler, aktifDonemId, sinifProgDonemId)
     P3) normalize() sonuna donemleriBaslat(d)  → loadDB / yedek yükleme tek kapıdan geçer
     P4) boot'ta donemleriBaslat(DB) + saveDB   → seed yolu da dönemli
   Dokunulmaz: UI/HTML, tablolar, analiz, istek havuzu, ek-ders.js, Excel, kimlikler, KS kısa kod, yedek buton davranışı.
   2. koşu: "Zaten uygulanmış" der (exit 2) — dosyayı değiştirmez.
   Tüm assert'ler geçmeden dosyaya YAZILMAZ. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const DOSYA = "app.js";
const MARKER = "DONEM-ILK-YAMASI";

const sha = (s) => createHash("sha256").update(s).digest("hex");
let src;
try { src = readFileSync(DOSYA, "utf8"); }
catch { console.error("HATA: app.js bulunamadı — proje kökünden çalıştırın."); process.exit(1); }

if (src.includes(MARKER)) { console.log("Zaten uygulanmış — değişiklik yapılmadı."); process.exit(2); }
if (!existsSync("index.html") || !existsSync("ek-ders.js")) { console.error("HATA: index.html / ek-ders.js kök dizinde değil."); process.exit(1); }

let fail = 0;
const t = (ad, kosul, extra) => {
  console.log((kosul ? "  ✓ " : "  ✗ ") + ad);
  if (!kosul) { fail = 1; if (extra) console.log("     ↳ " + extra); }
};

const eslesme = (hedef) => src.split(hedef).length - 1;
function degistir(hedef, yeni, ad) {
  const n = eslesme(hedef);
  t(`ASSERT [${ad}]: hedef tam 1 kez bulundu (${n})`, n === 1, `eşleşme sayısı=${n}, beklenen=1`);
  if (n !== 1) return false;
  src = src.replace(hedef, yeni);
  return true;
}

const shaOnce = sha(src);
console.log("DONEM-ILK-YAMASI — app.js yaması");
console.log("  öncesi SHA-256: " + shaOnce);

/* ---------- P1: donemleriBaslat() — bosDB'den hemen önce ---------- */
const DONEM_FN = `/* ---------- DONEM-ILK-YAMASI: 2026/2027 dönem modeli — yalnızca veri-uyumluluk dilimi ----------
   - DB.donemler: dönem kayıt dizisi; 2026/2027 kaydı TEK KEZ oluşur (idempotent; mevcut doğru ID korunur).
   - DB.aktifDonemId / DB.sinifProgDonemId: dönem işaretçileri (sinifProg YAPISI DEĞİŞMEZ, yalnızca ek alan).
   - dersler[]/istekler[]: donemId'siz ESKİ kayıtlara "donem-2026-2027" yazılır; mevcut donemId ASLA üzerine yazılmaz.
   - ogrenciler/ogretmenler/sinifIds bu dilimde GLOBAL kalır: donemId eklenmez, ID'ler değişmez.
   - Sınıf adları, sınıf ID'leri, ders/istek/grup dersi referansları DEĞİŞTİRİLMEZ. */
var DONEM_ILK_ID = "donem-2026-2027";
var DONEM_ILK_AD = "2026/2027";
function donemleriBaslat(db) {
  if (!db || typeof db !== "object") return { d: 0, ders: 0, ist: 0 };
  var say = { d: 0, ders: 0, ist: 0 };
  if (!Array.isArray(db.donemler)) db.donemler = [];
  var mevcut = db.donemler.filter(function (x) { return x && x.id === DONEM_ILK_ID; })[0];
  if (!mevcut) { db.donemler.push({ id: DONEM_ILK_ID, ad: DONEM_ILK_AD, aktif: true }); say.d = 1; mevcut = db.donemler[db.donemler.length - 1]; }
  else if (mevcut.ad !== DONEM_ILK_AD || mevcut.aktif !== true) { mevcut.ad = DONEM_ILK_AD; mevcut.aktif = true; say.d = 1; }
  if (db.aktifDonemId !== DONEM_ILK_ID) { db.aktifDonemId = DONEM_ILK_ID; say.d++; }
  if (db.sinifProgDonemId !== DONEM_ILK_ID) { db.sinifProgDonemId = DONEM_ILK_ID; say.d++; }
  (Array.isArray(db.dersler) ? db.dersler : []).forEach(function (l) {
    if (!l || typeof l !== "object") return;
    if (l.donemId == null || l.donemId === "") { l.donemId = DONEM_ILK_ID; say.ders++; }
  });
  (Array.isArray(db.istekler) ? db.istekler : []).forEach(function (r) {
    if (!r || typeof r !== "object") return;
    if (r.donemId == null || r.donemId === "") { r.donemId = DONEM_ILK_ID; say.ist++; }
  });
  return say;
}
`;
const ok1 = degistir("function bosDB() {", DONEM_FN + "function bosDB() {", "P1 donemleriBaslat ekleme");

/* ---------- P2: bosDB() şeması ---------- */
const BOS_ESKI = `function bosDB() {
  return { kurulus: todayKey(), ksVer: 2, ogretmenler: [], ogrenciler: [], sinifProg: {}, istekler: [], dersler: [] };
}`;
const BOS_YENI = `function bosDB() {
  return { kurulus: todayKey(), ksVer: 2, donemler: [{ id: DONEM_ILK_ID, ad: DONEM_ILK_AD, aktif: true }], aktifDonemId: DONEM_ILK_ID, sinifProgDonemId: DONEM_ILK_ID, ogretmenler: [], ogrenciler: [], sinifProg: {}, istekler: [], dersler: [] };
}`;
const ok2 = degistir(BOS_ESKI, BOS_YENI, "P2 bosDB dönem şeması");

/* ---------- P3: normalize() kuyruğu ---------- */
const NORM_ESKI = `  if (typeof kadroDuzelt === "function") kadroDuzelt(d);
  return d;`;
const NORM_YENI = `  if (typeof kadroDuzelt === "function") kadroDuzelt(d);
  if (typeof donemleriBaslat === "function") donemleriBaslat(d); /* DONEM-ILK-YAMASI: dönem/donemId eksikleri tek kapıdan (idempotent) */
  return d;`;
const ok3 = degistir(NORM_ESKI, NORM_YENI, "P3 normalize kuyruğu");

/* ---------- P4: boot ---------- */
const BOOT_ESKI = `kimlikleriTamamla(DB); /* KİMLİK-YAMASI: seed/restore sonrası eksik kimlikler ilk açılışta kapanır ve kaydedilir */
saveDB();`;
const BOOT_YENI = `kimlikleriTamamla(DB); /* KİMLİK-YAMASI: seed/restore sonrası eksik kimlikler ilk açılışta kapanır ve kaydedilir */
if (typeof donemleriBaslat === "function") donemleriBaslat(DB); /* DONEM-ILK-YAMASI: boot sonrası eksik dönem alanları kapanır ve kaydedilir */
saveDB();`;
const ok4 = degistir(BOOT_ESKI, BOOT_YENI, "P4 boot satırı");

if (!(ok1 && ok2 && ok3 && ok4)) {
  console.error("\nYAMA UYGULANMADI: en az bir assert başarısız — dosya yazılmadı (app.js değişmedi).");
  process.exit(1);
}

/* ---------- Yazım ÖNCESİ son doğrulamalar ---------- */
t("POST: donemleriBaslat tanımı mevcut", src.includes("function donemleriBaslat(db) {"));
t("POST: DONEM_ILK_ID sabiti mevcut", src.includes('var DONEM_ILK_ID = "donem-2026-2027";'));
t("POST: normalize kuyruğunda donemleriBaslat(d)", eslesme('donemleriBaslat(d); /* DONEM-ILK-YAMASI') === 1);
t("POST: boot'ta donemleriBaslat(DB)", eslesme('donemleriBaslat(DB); /* DONEM-ILK-YAMASI') === 1);
t("POST: bosDB şemasında donemler/aktifDonemId/sinifProgDonemId", eslesme("donemler: [{ id: DONEM_ILK_ID") === 1 && eslesme("aktifDonemId: DONEM_ILK_ID") === 1 && eslesme("sinifProgDonemId: DONEM_ILK_ID") === 1);
t("POST: donemId backfill yalnız donemleriBaslat içinde (2 blok)", eslesme('donemId = DONEM_ILK_ID; say.') === 2);
t("POST: sinifProg yapısına dokunulmadı (eski sinifProg satırları aynı)", src.includes('d.sinifProg = d.sinifProg && typeof d.sinifProg === "object" ? d.sinifProg : {};'));
t("POST: yama sözdizimi geçerli (derleme kontrolü)", (() => { try { new Function(src); return true; } catch (e) { console.log("     ↳ " + e.message); return false; } })());
const html = readFileSync("index.html", "utf8"), ekders = readFileSync("ek-ders.js", "utf8");
t("POST: index.html yamadan etkilenmedi (marker yok)", !html.includes(MARKER) && !html.includes("donemleriBaslat"));
t("POST: ek-ders.js yamadan etkilenmedi (marker yok)", !ekders.includes(MARKER) && !ekders.includes("donemleriBaslat"));

if (fail) {
  console.error("\nYAMA UYGULANMADI: son doğrulama başarısız — dosya yazılmadı (app.js değişmedi).");
  process.exit(1);
}

writeFileSync(DOSYA, src);
console.log("  sonrası SHA-256: " + sha(src));
console.log("OK: DONEM-ILK-YAMASI uygulandı (4 yama bölgesi).");
