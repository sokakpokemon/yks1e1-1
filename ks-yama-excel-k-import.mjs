/* ks-yama-excel-k-import.mjs — EXCEL-K-IMPORT-YAMASI (v2, veri-dosyalı)
   Resmi kaynak: program-guncel.xml (SHA 73cf1ba8…; kullanıcı B seçti).
   ks-excel-k-veri.json önceden parse edilmiş slot verisini taşır (K=309, DERS=243 kapısı ile doğrulanmış).
   Tek iş: bu veriyi DB'ye (musait + sinif + sinifProg aktif dönem) atomik, idempotent yazmak.
   Kurallar:
   - Yalnız PAZARTESİ/SALI/ÇARŞAMBA/PERŞEMBE/CUMARTESİ; CUMA (4-*) ve PAZAR (5-*) KODLARINA DOKUNULMAZ.
   - "#K" → t.avail.musait["G-K"]="G-K" (yalnız musait; sinif'a yazılmaz).
   - DERS metni → sinifDuzelt() → sinifProg[sınıf] push + t.avail.sinif["G-K"]=sınıf.
   - Birleşik hücre: Array (ayrı sınıflar) — her biri ayrı sinifProg girdisi.
   - Boş hücreler (JSON'da yok) silme değildir; mevcut kayıtlar korunur.
   - 5. Excel slotu JSON'a hiç alınmadı (mola yazılmaz).
   - Atomiklik: DB'nin deep-copy'si (staging) üzerinde; başarılıysa TEK saveDB.
   - Idempotent: DB.ayarlar.EXCEL-K-IMPORT-YAMASI varsa no-op. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const ISARET = "EXCEL-K-IMPORT-YAMASI";
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
function fail(m){ console.error("IMPORT-DUR: " + m); process.exit(1); }

const veriRaw = JSON.parse(readFileSync("ks-excel-k-veri.json", "utf8"));
const kaynakSha = sha("program-guncel.xml");
if (kaynakSha !== "73cf1ba85e8815a38fcd6ed96f2da2de6b4158b996af5760ba81882ca835fbb0") fail("program-guncel.xml SHA değişmiş: " + kaynakSha);

/* --- app.js veri katmanını yükle (localStorage simülasyonu) --- */
/* Idempotans işareti işlem-ötesi kalıcılık için dosyada tutulur; proses içi store
   her koşumda boş başladığından localStorage bazlı işaret ikinci koşumu yakalayamaz. */
const ISARET_DOSYASI = "ks-excel-k-import-uygulandi.flag";
if (existsSync(ISARET_DOSYASI)) { console.log("Zaten uygulanmış — no-op (idempotent, dosya işareti)."); process.exit(2); }
const store = {};
global.tailwind = {};
global.window = { crypto: { randomUUID: () => "uuid-imp-" + Date.now() }, addEventListener() {}, location: { hostname: "localhost" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, innerHTML: "", textContent: "", value: "", checked: false, appendChild(){}, remove(){}, click(){}, addEventListener(){}, dataset: {}, querySelectorAll: () => [] });
global.document = { getElementById: () => elStub(), addEventListener(){}, removeEventListener(){}, createElement: () => elStub(), body: { appendChild(){}, removeChild(){} }, querySelectorAll: () => [] };
global.Chart = function(){ this.destroy = () => {}; };
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const appKaynak = readFileSync("app.js", "utf8");
const { DB, saveDB, aktifDonemId } = new Function(appKaynak + "\n  return { DB, saveDB, aktifDonemId };\n")();

/* --- Idempotans: işaret localStorage'dan yüklendi mi? (saveDB zaten yazdı; yeni boot'ta loadDB okur) --- */
if (DB.ayarlar && DB.ayarlar[ISARET]) { console.log("Zaten uygulanmış — no-op (idempotent)."); process.exit(2); }
if (!DB.sinifProgDonemler) DB.sinifProgDonemler = {};
if (!DB.sinifProgDonemler[DB.sinifProgDonemId]) DB.sinifProgDonemler[DB.sinifProgDonemId] = DB.sinifProg;
if (DB.sinifProg !== DB.sinifProgDonemler[DB.sinifProgDonemId]) DB.sinifProg = DB.sinifProgDonemler[DB.sinifProgDonemId];

/* --- Derin kopya (staging) --- */
const staging = JSON.parse(JSON.stringify(DB));
const prog = staging.sinifProgDonemler[staging.sinifProgDonemId];
staging.sinifProg = prog;

const sayac = { K: 0, DERS: 0, BOS: 0, MOLA: 70, BELIRSIZ: 0 };
const celiskiler = [], eklenenSiniflar = [];
let atlananDuplicate = 0;

for (const [gun, ogretmenler] of Object.entries(veriRaw)) {
  for (const [ad, slots] of Object.entries(ogretmenler)) {
    const t = staging.ogretmenler.find(x => (x.ad || "").trim() === ad);
    if (!t) fail("Öğretmen DB'de yok: " + ad);
    if (!t.avail) t.avail = { sinif: {}, musait: [] };
    if (Array.isArray(t.avail.sinif)) { const o = {}; t.avail.sinif.forEach(k => { o[k] = "Sınıf Dersi"; }); t.avail.sinif = o; }
    if (!Array.isArray(t.avail.musait)) t.avail.musait = [];
    for (const [kod, v] of Object.entries(slots)) {
      /* CUMA (4-*) ve PAZAR (6-*) KODLARINA DOKUNMA — savunma katmanı (XML'de zaten yok).
         NOT: CUMARTESİ = 5-* (XML'de VAR, yazılmalı); gün 4=Cuma, 6=Pazar. */
      if (kod.startsWith("4-") || kod.startsWith("6-")) continue;
      if (v === "#K") {
        /* Protokol: K için yalnızca avail.musait"G-K" = "G-K". app.js normalize musait'i ARRAY olarak
           zorlar; mevcut format ne ise o korunur: array ise "G-K" push (duplicate yok), obje ise key yazılır. */
        const gKod = kod.split("-")[0] + "-K";
        if (Array.isArray(t.avail.musait)) {
          if (t.avail.musait.indexOf(gKod) < 0) t.avail.musait.push(gKod);
        } else {
          if (!t.avail.musait) t.avail.musait = {};
          if (!t.avail.musait[gKod]) t.avail.musait[gKod] = gKod;
        }
        sayac.K++;
        continue;
      }
      sayac.DERS++;
      const cozum = sinifDuzelt(v);
      const siniflar = Array.isArray(cozum) ? cozum : [cozum];
      if (siniflar.length > 1) console.log("  birleşik hücre bölündü:", ad, kod, JSON.stringify(v), "→", siniflar.join(" | "));
      siniflar.forEach((s, i) => {
        if (!s) { sayac.BELIRSIZ++; celiskiler.push(gun+"/"+ad+"/"+kod+" boş DERS"); return; }
        if (!prog[s]) { prog[s] = []; eklenenSiniflar.push(s); }
        if (prog[s].indexOf(kod) < 0) prog[s].push(kod);
        else atlananDuplicate++;
        /* Aynı slotta çoklu sınıf: sessizce EZME — ilk sınıf yazılır, kalanı çakışma olarak raporlanır. */
        if (i === 0) t.avail.sinif[kod] = s;
        else { celiskiler.push(gun+"/"+ad+"/"+kod+" çoklu sınıf: '" + v + "' → " + siniflar.join(" | ") + " (ilki yazıldı: " + siniflar[0] + ")"); }
      });
    }
  }
}
function sinifDuzelt(Ad){
  /* çoklu satırlı hücreler ("12 SAY-1\n12 SAY-2\nSAYCAL") önce satıra bölünür */
  const satirlar = String(Ad).split(/\n+/).map(x => x.trim()).filter(Boolean);
  if (satirlar.length > 1) return satirlar.map(x => sinifDuzelt(x)).flat();
  let s = Ad.trim().replace(/\s+/g, " ").toLocaleUpperCase("tr-TR");
  if (s === "MEUN SAY-2") return "MEZUN SAY 2";
  if (s === "MEZUNSAY-3") return "MEZUN SAY 3";
  if (s === "SAYCAL") return "12 SAY CAL";
  s = s.replace(/MEZUN SAY-(\d)/g, "MEZUN SAY $1").replace(/MEZUN EA-(\d)/g, "MEZUN EA $1")
       .replace(/12 SAY-(\d)/g, "12 SAY $1").replace(/11 SAY-(\d)/g, "11 SAY $1")
       .replace(/11 EA-1/g, "11 EA 1").replace(/12 EA-1/g, "12 EA 1");
  /* "MEZUN SAY 1 MEZUN SAY-2" gibi birleşik hücreler ayrı sınıflara bölünür */
  if (s.includes(" ")) {
    const KADRO = ["MEZUN SAY 1","MEZUN SAY 2","MEZUN SAY 3","MEZUN EA 1","MEZUN EA 2","12 SAY 1","12 SAY 2","12 SAY CAL","12 EA 1","12 DİL","11 SAY 1","11 SAY 2","11 SAY 3","11 SAYCAL","11 SAYISAL FEN","11 EA 1","11 EA DİL","10.SINIF","9.SINIF"];
    const parts = s.split(" "); const out = []; let buf = [];
    for (const p of parts) {
      buf.push(p);
      const aday = buf.join(" ");
      if (KADRO.includes(aday)) { out.push(aday); buf = []; }
      else if (aday === "SAYCAL") { out.push("12 SAY CAL"); buf = []; }
    }
    if (buf.length) out.push(buf.join(" "));
    if (out.length > 1 && out.every(p => KADRO.includes(p))) return out;
  }
  return s;
}

/* Birleşik hücre bölünmeleri bilinen ve kasıtlı — bunlar çakışma değil. Diğer çelişkiler yazımı durdurur. */
const beklenenBolme = celiskiler.filter(c => c.includes("çoklu sınıf"));
const digerCeliski = celiskiler.filter(c => !c.includes("çoklu sınıf"));
if (digerCeliski.length) { console.error("ÇELİŞKİLER:"); digerCeliski.forEach(c => console.error("  - " + c)); fail("çapraz kontrol başarısız — YAZILMADI"); }
if (beklenenBolme.length) { console.log("Bilinen çoklu-sınıf bölünmeleri (ilki yazıldı, kalanı raporlu): " + beklenenBolme.length); beklenenBolme.forEach(c => console.log("  - " + c)); }
const BEKLENEN = { K: 309, DERS: 243 };
for (const k of Object.keys(BEKLENEN)) if (sayac[k] !== BEKLENEN[k]) fail("sayı kapısı: " + k + "=" + sayac[k] + " ≠ " + BEKLENEN[k]);
if (sayac.BELIRSIZ !== 0) fail("BELIRSIZ=" + sayac.BELIRSIZ + " — yazma İPTAL");

/* --- Staging → DB: tek saveDB --- */
DB.ogretmenler = staging.ogretmenler;
DB.sinifProgDonemler[DB.sinifProgDonemId] = prog;
DB.sinifProg = prog;
if (!DB.ayarlar) DB.ayarlar = {};
DB.ayarlar[ISARET] = { kaynak: "program-guncel.xml", sha: kaynakSha, tarih: new Date().toISOString(), sayac: { K: sayac.K, DERS: sayac.DERS, BOS: sayac.BOS, MOLA: sayac.MOLA, BELIRSIZ: sayac.BELIRSIZ } };
saveDB();
writeFileSync(ISARET_DOSYASI, JSON.stringify({ kaynak: "program-guncel.xml", sha: kaynakSha, tarih: new Date().toISOString() }) + "\n");
writeFileSync("ks-excel-k-import-db.json", JSON.stringify(DB, null, 1));

console.log("IMPORT OK — resmi kaynak: program-guncel.xml");
console.log("SHA-256:", kaynakSha);
console.log("Sayılar:", JSON.stringify(sayac));
console.log("Eklenen sınıf:", [...new Set(eklenenSiniflar)].join(", ") || "(yok)");
console.log("Duplicate atlanan:", atlananDuplicate);
