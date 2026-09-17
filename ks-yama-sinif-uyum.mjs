/* ks-yama-sinif-uyum.mjs — SINIF-OGRT-UYUM-YAMASI (assert'li, idempotent)
   TEK İŞ: Öğretmen avail.sinif["G-K"]=sınıfAd kayıtları ile DB.sinifProg[sinifAd]
   (aktif dönem programı) arasındaki uyumu tek kaynaklı yazımla kurar.
   - Eksik G-K anahtarları sinifProg'a EKLENİR (silme/taşıma/uydurma YOK).
   - Kapalı (avail.musait) çakışması olan hücreler ATLANIR (sessiz kaybolma yok; uyarı davranışı korunur).
   - Öğretmen kayıtlarına, derslere, ek-derslere, sinifIds'e DOKUNULMAZ.
   - sinifProgDonemler identity-rebind üzerinden güncellenir (DB.sinifProg referansı korunur).
   2. koşu: exit 2 "Zaten uygulanmış" — dosya değiştirilmez. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const ISARET = "SINIF-OGRT-UYUM-YAMASI";
const DOSYA = "app.js";
const once = readFileSync(DOSYA, "utf8");

if (once.includes(ISARET)) {
  console.log("Zaten uygulanmış — dosya değiştirilmedi.");
  process.exit(2);
}

/* ANCHOR 1: fonksiyon gövdesi — boot dönem satırından ÖNCEYE yerleşir */
const ANCHOR1 = `if (typeof donemleriBaslat === "function") donemleriBaslat(DB); /* DONEM-ILK-YAMASI: boot sonrası eksik dönem alanları kapanır ve kaydedilir */`;
const n1 = once.split(ANCHOR1).length - 1;
console.log(`[assert] ANCHOR1 (boot satırı) eşleşme: ${n1} (beklenen 1)`);
if (n1 !== 1) { console.error("ASSERT BAŞARISIZ — yazma İPTAL."); process.exit(1); }

const FONK = `
/* ${ISARET}: Sınıf programı ↔ öğretmen haftalık program uyumu (tek kaynaklı yazım, idempotent).
   Kural: öğretmenin avail.sinif["G-K"]=sınıfAd kaydı VARSA, aynı G-K o sınıfın aktif dönem
   programında (sinifProgDonemler[sinifProgDonemId]) da OLMALI. Eksikse EKLENİR;
   mevcut hücreler ASLA silinmez/taşınmaz; isimle tahmin yapılmaz (sınıf adı kayıttan gelir).
   avail.musait (Kapalı) ile çakışan öğretmen kayıtları atlanır — ders sessizce kaybolmaz,
   duzeltmeBul'un mevcut 'musait' uyarı davranışı korunur. Dönüş: { e: eklenen }. */
function sinifOgrtUyumOnar(db) {
  if (!db || typeof db !== "object" || !db.sinifProg || typeof db.sinifProg !== "object") return { e: 0 };
  var hedef = (typeof db.sinifProgDonemId === "string" && db.sinifProgDonemId) || db.aktifDonemId || DONEM_ILK_ID;
  if (!db.sinifProgDonemler || typeof db.sinifProgDonemler !== "object") db.sinifProgDonemler = {};
  if (!db.sinifProgDonemler[hedef] || typeof db.sinifProgDonemler[hedef] !== "object") db.sinifProgDonemler[hedef] = db.sinifProg;
  var prog = db.sinifProgDonemler[hedef];
  var eklenen = 0;
  (Array.isArray(db.ogretmenler) ? db.ogretmenler : []).forEach(function (t) {
    if (!t || !t.avail || !t.avail.sinif || typeof t.avail.sinif !== "object") return;
    if (Array.isArray(t.avail.musait) && t.avail.musait.indexOf(k) >= 0) return; /* Kapalı slot atlanır (k dış tanımda) */
    Object.keys(t.avail.sinif).forEach(function (k) {
      var cls = t.avail.sinif[k];
      if (!cls || typeof cls !== "string" || cls === "Sınıf Dersi") return;
      if (Array.isArray(t.avail.musait) && t.avail.musait.indexOf(k) >= 0) return; /* Kapalı: atla */
      if (!prog[cls]) prog[cls] = [];
      if (prog[cls].indexOf(k) < 0) { prog[cls].push(k); eklenen++; }
    });
  });
  return { e: eklenen };
}
`;
/* dummy yok — FONK zaten temiz */
const FONK_TEMIZ = FONK;
const ARAYA = FONK_TEMIZ + ANCHOR1;

/* yamayı birebir geri alır — byte-semantic kanıt için */
function geriAl(s) {
  let r = s;
  r = r.replace(ANCHOR3 + "\n  if (typeof sinifOgrtUyumOnar === \"function\") sinifOgrtUyumOnar(db); /* " + ISARET + ": loadDB/normalize yolu da kapatır */", ANCHOR3);
  r = r.replace(ANCHOR2 + "\nsinifOgrtUyumOnar(DB); /* " + ISARET + ": sinifProg ↔ avail.sinif uyumu boot'ta kapanır (idempotent) */", ANCHOR2);
  r = r.replace(FONK_TEMIZ + ANCHOR1, ANCHOR1);
  return r;
}

let sonra = once.replace(ANCHOR1, ARAYA);

/* ANCHOR 2: boot çağrısı — kimlikleriTamamla(DB) satırından sonra */

/* ANCHOR 2: boot çağrısı — kimlikleriTamamla(DB) satırından sonra */
const ANCHOR2 = `kimlikleriTamamla(DB); /* KİMLİK-YAMASI: seed/restore sonrası eksik kimlikler ilk açılışta kapanır ve kaydedilir */`;
const n2 = sonra.split(ANCHOR2).length - 1;
console.log(`[assert] ANCHOR2 (boot kimlik satırı) eşleşme: ${n2} (beklenen 1)`);
if (n2 !== 1) { console.error("ASSERT BAŞARISIZ — yazma İPTAL."); process.exit(1); }
sonra = sonra.replace(ANCHOR2, ANCHOR2 + `
sinifOgrtUyumOnar(DB); /* ${ISARET}: sinifProg ↔ avail.sinif uyumu boot'ta kapanır (idempotent) */`);

/* ANCHOR 3: normalize() sonuna bağla — donemleriBaslat(db) çağrısının hemen ardındaki satırdan önce değil,
   loadDB/normalize yolu da uyumu kaplasın. normalize içindeki sinifProgDonemleriBaslat(db) çağrısından sonraya. */
const ANCHOR3 = `if (typeof sinifProgDonemleriBaslat === "function") sinifProgDonemleriBaslat(db);`;
const n3 = sonra.split(ANCHOR3).length - 1;
console.log(`[assert] ANCHOR3 (normalize satırı) eşleşme: ${n3} (beklenen 1)`);
if (n3 !== 1) { console.error("ASSERT BAŞARISIZ — yazma İPTAL."); process.exit(1); }
sonra = sonra.replace(ANCHOR3, ANCHOR3 + `
  if (typeof sinifOgrtUyumOnar === "function") sinifOgrtUyumOnar(db); /* ${ISARET}: loadDB/normalize yolu da kapatır */`);

/* --- ASSERTLER --- */
const asserts = [
  ["işaret eklendi", sonra.includes(ISARET)],
  ["fonksiyon tanımı tek", (sonra.match(/function sinifOgrtUyumOnar\(/g) || []).length === 1],
  ["boot çağrısı var", sonra.includes("sinifOgrtUyumOnar(DB);")],
  ["normalize çağrısı var", sonra.includes("sinifOgrtUyumOnar(db);")],
  ["silme yok (delete sinifProg yok)", !/delete\s+(db|DB)\.sinifProg\b/.test(FONK_TEMIZ)],
  ["yama dışı bölge dokunulmadı", geriAl(sonra) === once],
];
let hata = 0;
for (const [ad, ok] of asserts) { console.log((ok ? "  ✓ " : "  ✗ ") + ad); if (!ok) hata = 1; }
if (hata) { console.error("ASSERT BAŞARISIZ — dosya YAZILMADI."); process.exit(1); }

/* --- SÖZDİZİMİ KONTROLÜ (yazmadan önce) --- */
const { spawnSync } = await import("node:child_process");
const tmp = DOSYA + "tmp.js";
writeFileSync(tmp, sonra);
const chk = spawnSync(process.execPath, ["--check", tmp], { encoding: "utf8" });
if (chk.status !== 0) { console.error("SÖZDİZİMİ HATASI — yazma İPTAL:\n" + chk.stderr); (await import("node:fs")).rmSync(tmp); process.exit(1); }

/* --- YEDEK + YAZ --- */
const yedek = "app.js.sinif-uyum-oncesi.bak";
if (!existsSync(yedek)) copyFileSync(DOSYA, yedek);
writeFileSync(DOSYA, sonra);
(await import("node:fs")).rmSync(tmp);

console.log("app.js yamalandı · yedek: " + yedek + " (" + readFileSync(yedek).length + " B, sha " + sha(readFileSync(yedek, "utf8")) + ")");
console.log("Yeni app.js sha: " + sha(sonra) + " (" + Buffer.byteLength(sonra) + " B)");
