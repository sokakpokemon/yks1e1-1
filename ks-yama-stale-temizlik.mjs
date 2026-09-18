/* ks-yama-stale-temizlik.mjs — STALE-TEMIZLIK-YAMASI (opsiyon b, onaylı)
   Kapsam: preflight A listesindeki TAM 46 avail.sinif kaydının silinmesi.
   Kurallar (onaylı):
   - X-5 (mola-slotu 6. Excel slottur, GERÇEK DERS) kayıtlarına DOKUNULMAZ.
   - Cuma (4-*) / Pazar (6-*) kayıtları korunur.
   - SELİNA KUTLU'nun tüm programı korunur.
   - sinifProg HİÇBİR yerinden değiştirilmez (JSON birebir aynı kalmalı).
   - Yeni ders veya K kaydı üretilmez; avail.musait dokunulmaz.
   - Atomiklik: staging deep-copy; başarılıysa TEK snapshot yazımı (yeni dosya,
     mevcut ks-excel-k-import-db.json üzerine YAZILMAZ — o yedek olarak kalır).
   - Idempotent: flag dosyası varsa no-op (exit 2). */
import { readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const KAYNAK_DB = "ks-excel-k-import-db.json";
const CIKTI_DB = "ks-stale-temizlik-db.json";
const FLAG = "ks-stale-temizlik-uygulandi.flag";
const YEDEK = "ks-stale-temizlik-oncesi.yedek.json";
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
function fail(m) { console.error("TEMIZLIK-DUR: " + m); process.exit(1); }

if (existsSync(FLAG)) { console.log("Zaten uygulanmış — no-op (idempotent, dosya işareti)."); process.exit(2); }

/* --- Onaylı 46 kayıt (preflight A listesi): ogretmen ad -> slot -> sinif adi --- */
const ONAYLI = {
  "SONER AÇIKGÖZ": { "0-1": "MEZUN SAY 1", "1-1": "MEZUN SAY 2" },
  "MEHMET ŞAŞAR": { "1-1": "MEZUN EA 2", "2-1": "12 SAY 1", "3-1": "12 SAY 2" },
  "TAHSİN ASLAN": { "2-1": "12 SAY CAL", "3-1": "12 EA 1" },
  "MİNE GÜRKAN": { "0-1": "12 DİL", "1-1": "11 SAY 1", "2-1": "11 SAY 2", "3-1": "11 SAY 3" },
  "MERVE GEREK": { "0-1": "11 SAY 3", "1-1": "11 SAYCAL", "3-1": "11 EA 1" },
  "SALİM URTİMUR": { "0-1": "11 EA 1", "1-1": "10.SINIF", "2-1": "9.SINIF", "3-1": "MEZUN SAY 1" },
  "MUSTAFA GÜRKAN": { "0-1": "MEZUN SAY 1", "1-1": "MEZUN SAY 2", "2-1": "MEZUN SAY 3", "3-1": "MEZUN EA 1" },
  "BELGİN ÇOLAK": { "0-1": "12 SAY 2", "1-1": "12 SAY CAL", "3-1": "12 DİL" },
  "KARDELEN ASLAN": { "0-1": "12 DİL", "1-1": "11 SAY 1", "2-1": "11 SAY 2", "3-1": "11 SAY 3" },
  "ŞAHİN DOĞANAY": { "0-1": "11 EA 1", "3-1": "9.SINIF" },
  "EREN BİLGİLİ": { "0-1": "MEZUN SAY 1", "1-1": "MEZUN SAY 2" },
  "FATMA KURT": { "0-1": "MEZUN EA 1", "1-1": "MEZUN EA 2", "2-1": "12 SAY 1" },
  "FİKRİYE KIYAR": { "1-1": "12 SAY CAL", "2-1": "12 EA 1", "3-1": "12 DİL" },
  "NİHAT KANARIĞ": { "0-1": "12 DİL", "2-1": "11 SAY 2", "3-1": "11 SAY 3" },
  "MERT ASİL": { "0-1": "11 SAY 3", "1-1": "11 SAYCAL", "2-1": "11 SAYISAL FEN", "3-1": "11 EA 1" },
};

/* Sayı kapısı: tam 46 */
const onayliAnahtarlar = [];
for (const [ad, slots] of Object.entries(ONAYLI)) for (const [kod, s] of Object.entries(slots)) onayliAnahtarlar.push(ad + "|" + kod + "|" + s);
if (onayliAnahtarlar.length !== 46) fail("onaylı liste 46 değil: " + onayliAnahtarlar.length);

const DB = JSON.parse(readFileSync(KAYNAK_DB, "utf8"));

/* --- Kod eşleştirme koruması (onaylı kural): aday yalnızca Excel slot 1-4 = G-1..G-4 olan
   anahtarlarda aranabilir; X-5, 4-*, 6-* adaylara DAHİL DEĞİL --- */
for (const k of onayliAnahtarlar) {
  const kod = k.split("|")[1];
  const [g, s] = kod.split("-").map(Number);
  if (s === 5) fail("adayda X-5 var (yasak): " + k);
  if (g === 4 || g === 6) fail("adayda Cuma/Pazar var (yasak): " + k);
}

/* --- DB'de gerçek aday kümesini doğrula: birebir eşleşme --- */
const gercekAday = new Set();
for (const t of DB.ogretmenler) {
  const ad = (t.ad || "").toUpperCase();
  if (ad.includes("SELİNA")) continue;
  const sinif = (t.avail && t.avail.sinif) || {};
  for (const [kod, s] of Object.entries(sinif)) {
    const [g, sl] = kod.split("-").map(Number);
    if (g === 4 || g === 6) continue;
    if (sl === 5) continue; /* X-5 mola-slotu = gerçek ders, DOKUNULMAZ */
    if (ONAYLI[ad] && ONAYLI[ad][kod] === s) gercekAday.add(ad + "|" + kod + "|" + s);
  }
}
const onayliSet = new Set(onayliAnahtarlar);
if (gercekAday.size !== 46) fail("gerçek aday sayısı ≠ 46: " + gercekAday.size);
for (const k of gercekAday) if (!onayliSet.has(k)) fail("beklenmeyen aday: " + k);
for (const k of onayliSet) if (!gercekAday.has(k)) fail("onaylı aday DB'de yok: " + k);

/* --- Assertler (yazma ÖNCESİ) --- */
/* X-5 değişiklik adayı = 0 */
let x5Aday = 0, cumaPazarAday = 0, selinaAday = 0;
for (const t of DB.ogretmenler) {
  const ad = (t.ad || "").toUpperCase();
  const sinif = (t.avail && t.avail.sinif) || {};
  for (const kod of Object.keys(sinif)) {
    const [g, s] = kod.split("-").map(Number);
    if (s === 5) x5Aday++;
    if (g === 4 || g === 6) cumaPazarAday++;
    if (ad.includes("SELİNA")) selinaAday++;
  }
}
/* Selina adayı = Selina kayıtları arasından onaylı listede olan (0 olmalı) */
selinaAday = 0;
for (const t of DB.ogretmenler) {
  const ad = (t.ad || "").toUpperCase();
  if (!ad.includes("SELİNA")) continue;
  const sinif = (t.avail && t.avail.sinif) || {};
  for (const [kod, s] of Object.entries(sinif)) if (onayliSet.has(ad + "|" + kod + "|" + s)) selinaAday++;
}
/* X-5 kayıtları meşru olarak DB'de durur; aday sayısı = silinecek X-5 sayısı (0 olmalı) */
let x5Silinecek = 0;
for (const k of onayliSet) { const kod = k.split("|")[1]; if (+kod.split("-")[1] === 5) x5Silinecek++; }
if (x5Silinecek !== 0) fail("onaylı listede X-5 var (koruma ihlali)");
void x5Aday; void cumaPazarAday;
if (cumaPazarAday !== 0) { /* koruma: Cuma/Pazar kayıtları asla aday olamaz; aday = onaylı listede olan */
  let cp = 0;
  for (const t of DB.ogretmenler) { const sinif = (t.avail && t.avail.sinif) || {};
    for (const [kod, s] of Object.entries(sinif)) { const g = +kod.split("-")[0]; if ((g === 4 || g === 6) && onayliSet.has((t.ad||"").toUpperCase()+"|"+kod+"|"+s)) cp++; } }
  if (cp !== 0) fail("Cuma/Pazar aday ≠ 0");
}
if (selinaAday !== 0) fail("Selina aday ≠ 0");

/* Excel'de bulunan ders eksigi = 0 (sinifProg silinmediği için silme öncesi de sonrası da 0 olmalı) */
const veri = JSON.parse(readFileSync("ks-excel-k-veri.json", "utf8"));
const KADRO = ["MEZUN SAY 1","MEZUN SAY 2","MEZUN SAY 3","MEZUN EA 1","MEZUN EA 2","12 SAY 1","12 SAY 2","12 SAY CAL","12 EA 1","12 DİL","11 SAY 1","11 SAY 2","11 SAY 3","11 SAYCAL","11 SAYISAL FEN","11 EA 1","11 EA DİL","10.SINIF","9.SINIF"];
const sinifDuzelt = (Ad) => {
  if (!Ad) return null;
  const satirlar = String(Ad).split(/\n+/).map(x => x.trim()).filter(Boolean);
  if (satirlar.length > 1) return satirlar.map(x => sinifDuzelt(x)).flat();
  let s = Ad.trim().replace(/\s+/g, " ").toLocaleUpperCase("tr-TR");
  if (s === "MEUN SAY-2") return "MEZUN SAY 2";
  if (s === "MEZUNSAY-3") return "MEZUN SAY 3";
  if (s === "SAYCAL") return "12 SAY CAL";
  s = s.replace(/MEZUN SAY-(\d)/g, "MEZUN SAY $1").replace(/MEZUN EA-(\d)/g, "MEZUN EA $1")
       .replace(/12 SAY-(\d)/g, "12 SAY $1").replace(/11 SAY-(\d)/g, "11 SAY $1")
       .replace(/11 EA-1/g, "11 EA 1").replace(/12 EA-1/g, "12 EA 1");
  if (s.includes(" ")) {
    const parts = s.split(" "); const out = []; let buf = [];
    for (const p of parts) { buf.push(p); const a = buf.join(" ");
      if (KADRO.includes(a)) { out.push(a); buf = []; } else if (a === "SAYCAL") { out.push("12 SAY CAL"); buf = []; } }
    if (buf.length) out.push(buf.join(" "));
    if (out.length > 1 && out.every(p => KADRO.includes(p))) return out;
  }
  return s;
};
const hedef = {};
for (const ogrs of Object.values(veri)) for (const [ad, slots] of Object.entries(ogrs)) for (const [kod, v] of Object.entries(slots)) if (v !== "#K") hedef[ad + "|" + kod] = sinifDuzelt(v);
let eksikProg = 0;
for (const [key, arr] of Object.entries(hedef)) {
  const [ad, kod] = key.split("|"); const g = +kod.split("-")[0]; if (g === 4 || g === 6) continue;
  (Array.isArray(arr) ? arr : [arr]).forEach(s => { if (!(((DB.sinifProg || {})[s] || []).includes(kod))) eksikProg++; });
}
if (eksikProg !== 0) fail("Excel'de bulunan ders eksigi ≠ 0: " + eksikProg);

/* 12 SAY CAL duplicate = 0 */
const sidAnahtar = Object.keys(DB.sinifIds || {}).filter(s => s.replace(/\s+/g, "") === "12SAYCAL");
if (sidAnahtar.length !== 1) fail("12 SAY CAL duplicate ≠ 0: " + JSON.stringify(sidAnahtar));

/* --- Staging deep-copy --- */
const staging = JSON.parse(JSON.stringify(DB));
const silinen = [];
for (const t of staging.ogretmenler) {
  const ad = (t.ad || "").toUpperCase();
  if (ad.includes("SELİNA")) continue;
  const sinif = t.avail && t.avail.sinif;
  if (!sinif || typeof sinif !== "object") continue;
  for (const [kod, s] of Object.entries(sinif)) {
    if (onayliSet.has(ad + "|" + kod + "|" + s)) { delete sinif[kod]; silinen.push(ad + " | " + kod + " | " + s); }
  }
}
if (silinen.length !== 46) fail("silinen ≠ 46: " + silinen.length);

/* --- Yazma SONRASI savunma assertleri (staging üzerinde) --- */
const progOnce = JSON.stringify(DB.sinifProg);
const progSonra = JSON.stringify(staging.sinifProg);
if (progOnce !== progSonra) fail("sinifProg değişti (yasak)");
/* X-5 kayıtları tam sayıyla korunmalı */
const x5Once = (() => { let n = 0; DB.ogretmenler.forEach(t => { const s = (t.avail && t.avail.sinif) || {}; for (const k of Object.keys(s)) if (+k.split("-")[1] === 5) n++; }); return n; })();
const x5Sonra = (() => { let n = 0; staging.ogretmenler.forEach(t => { const s = (t.avail && t.avail.sinif) || {}; for (const k of Object.keys(s)) if (+k.split("-")[1] === 5) n++; }); return n; })();
if (x5Once !== x5Sonra) fail("X-5 kayıt sayısı değişti: " + x5Once + " → " + x5Sonra);
/* Cuma/Pazar korunumu */
const cpOnce = JSON.stringify(DB.ogretmenler.map(t => Object.entries((t.avail && t.avail.sinif) || {}).filter(([k]) => { const g = +k.split("-")[0]; return g === 4 || g === 6; })));
const cpSonra = JSON.stringify(staging.ogretmenler.map(t => Object.entries((t.avail && t.avail.sinif) || {}).filter(([k]) => { const g = +k.split("-")[0]; return g === 4 || g === 6; })));
if (cpOnce !== cpSonra) fail("Cuma/Pazar kayıtları değişti (yasak)");
/* Selina korunumu */
const selOnce = JSON.stringify(DB.ogretmenler.find(t => (t.ad || "").toUpperCase().includes("SELİNA")));
const selSonra = JSON.stringify(staging.ogretmenler.find(t => (t.ad || "").toUpperCase().includes("SELİNA")));
if (selOnce !== selSonra) fail("Selina kayıtları değişti (yasak)");
/* avail.musait korunumu */
if (JSON.stringify(DB.ogretmenler.map(t => t.avail && t.avail.musait)) !== JSON.stringify(staging.ogretmenler.map(t => t.avail && t.avail.musait))) fail("avail.musait değişti (yasak)");
/* 4 birleşik hücre sinifProg kayıtları korunur (sinifProg birebir asserti zaten kapsar) */

/* --- Atomik yazım: önce yedek (üzerine yazma yok, yeni dosya), sonra TEK snapshot --- */
copyFileSync(KAYNAK_DB, YEDEK);
const yedekSha = sha(YEDEK);
const yedekBoyut = statSync(YEDEK).size;

staging.ayarlar = staging.ayarlar || {};
staging.ayarlar["STALE-TEMIZLIK-YAMASI"] = {
  kaynak: KAYNAK_DB,
  kaynakSha: sha(KAYNAK_DB),
  tarih: new Date().toISOString(),
  silinen: silinen.length,
  kural: "opsiyon-b: 46 stale avail.sinif; X-5/4-*/6-*/Selina korundu; sinifProg degismedi",
};
writeFileSync(CIKTI_DB, JSON.stringify(staging, null, 1));
writeFileSync(FLAG, JSON.stringify({ kaynak: KAYNAK_DB, cikti: CIKTI_DB, yedek: YEDEK, yedekSha, tarih: new Date().toISOString(), silinen: silinen.length }) + "\n");

console.log("TEMIZLIK OK — " + silinen.length + " kayıt silindi");
console.log("Yedek: " + YEDEK + " | boyut: " + yedekBoyut + " bayt | SHA-256: " + yedekSha);
console.log("Snapshot: " + CIKTI_DB);
console.log("--- Silinen 46 kayıt ---");
silinen.sort().forEach(s => console.log("  " + s));
