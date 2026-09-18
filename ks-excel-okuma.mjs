/* ks-excel-okuma.mjs — SALT-OKUMA XML doğrulama (Excel 2003 XML).
   Kaynak: program-guncel.xml. Hiçbir dosyaya/DB'ye yazmaz.
   Çıktı: K / ders / bos / ogle sayıları (gün bazlı), kırmızı çapraz kontrol, slot doğrulama. */
import { readFileSync } from "node:fs";

const xml = readFileSync("program-guncel.xml", "utf8");

if (!xml.trimEnd().endsWith("</Workbook>")) { console.error("HATA: XML </Workbook> ile bitmiyor"); process.exit(1); }

function decode(s) {
  return String(s || "")
    .replace(/&#10;/g, "\n").replace(/&#13;/g, "\r").replace(/&#9;/g, "\t")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/* Styles: ss:ID -> interior color (CSS RGB; indexed/theme bu dosyada yok) */
const styles = {};
for (const m of xml.matchAll(/<Style\s+ss:ID="([^"]+)"([\s\S]*?)<\/Style>/g)) {
  const id = m[1], body = m[2];
  const im = body.match(/<Interior\s+ss:Color="([^"]+)"/);
  styles[id] = { color: im ? im[1] : null };
}
const KIRMIZI = "#FF0000";
const OGRE_RENK = "#BFBFBF";
console.log("[Renk kaynağı — CSS RGB, indexed/theme YOK]:", Object.entries(styles).map(([id,s])=>id+"="+(s.color||"yok")).join(" "));

const GUNLER_XLS = ["PAZARTESİ", "SALI", "ÇARŞAMBA", "PERŞEMBE", "CUMARTESİ"]; /* CUMA/PAZAR XML'de YOK */
const OGTMENLER = ["SONER AÇIKGÖZ","MEHMET ŞAŞAR","TAHSİN ASLAN","MİNE GÜRKAN","MERVE GEREK","RAVİDE DERYA","MUSTAFA GÜRKAN","ŞAHİN DOĞANAY","KARDELEN ASLAN","NİHAT KANARIĞ","FİKRİYE KIYAR","FATMA KURT","EREN BİLGİLİ","BELGİN ÇOLAK","SALİM URTİMUR","MERT ASİL"];
const SAAT_ETIKETLERI = new Set(["08.50 - 09.30","09.40 - 10.20","10.30 - 11.10","11.20 - 12.00","12.10 - 12.50","13.00 - 13.40","13:50- 14.30","14:40 - 15.20","15.30 - 16.10","16.20 - 17.00","17.10 - 17.50","18.00 - 18.40"]);

let gun = -1;
let saatSatiri = false;
let kirmizi = 0, kSayisi = 0, dersSayisi = 0, bosSayisi = 0, ogleSayisi = 0;
let hardFail = [], crossFail = [];
const gunSay = {};
GUNLER_XLS.forEach(g => gunSay[g] = { k: 0, ders: 0, bos: 0, ogle: 0 });
let dersSaatleriSatirlari = 0;
const dersHcreMetinleri = [];

for (const rowMatch of xml.matchAll(/<Row[^>]*>([\s\S]*?)<\/Row>/g)) {
  const rowBody = rowMatch[1];
  const rowCells = [...rowBody.matchAll(/<Cell([^>]*?)(?:\/>|>([\s\S]*?)<\/Cell>)/g)];
  let col = 0; /* 0 = A sütunu, 1..12 = Excel slot */
  let ilk = true;
  for (const c of rowCells) {
    const attrs = c[1] || "";
    const body = c[2] || "";
    const dm = body.match(/<Data[^>]*>([\s\S]*?)<\/Data>/);
    const metin = dm ? decode(dm[1]) : "";
    const styleId = (attrs.match(/ss:StyleID="([^"]+)"/) || [])[1] || "Default";
    const color = (styles[styleId] || {}).color;
    /* ss:Index atlaması: hücre belirtilen sütuna atlar (1-tabanlı) */
    const idxAttr = (attrs.match(/ss:Index="(\d+)"/) || [])[1];
    if (idxAttr) col = parseInt(idxAttr, 10) - 1;
    /* MergeAcross: bu hücreden sonraki hücre merge kadar atlanır (birleşik hücre tek hücredir) */
    const merge = (attrs.match(/ss:MergeAcross="(\d+)"/) || [])[1];

    if (ilk) {
      ilk = false;
      const u = metin.trim().toUpperCase();
      if (GUNLER_XLS.includes(u)) { gun = GUNLER_XLS.indexOf(u); saatSatiri = false; col = 0; if (merge) col = parseInt(merge,10); continue; }
      if (u === "DERS SAATLERİ") { dersSaatleriSatirlari++; saatSatiri = true; col = 0; continue; }
      saatSatiri = false;
      continue; /* öğretmen satırı */
    }
    if (saatSatiri) { /* saat etiket satırının diğer hücreleri sayılmaz */ if (merge) col += parseInt(merge,10); col++; continue; }
    if (gun === -1) continue;
    col++; /* bir sonraki slot */
    const trim = metin.trim().toUpperCase();
    const slot = col;
    if (trim === "ÖĞLE ARASI") {
      ogleSayisi++; gunSay[GUNLER_XLS[gun]].ogle++;
      if (color !== OGRE_RENK) crossFail.push("ÖĞLE ARASI rengi #BFBFBF değil: " + GUNLER_XLS[gun] + " slot" + slot + " renk=" + color);
      if (merge) col += parseInt(merge,10);
      continue;
    }
    if (trim === "") { bosSayisi++; gunSay[GUNLER_XLS[gun]].bos++; if (merge) col += parseInt(merge,10); continue; }
    if (trim === "K") {
      kSayisi++; gunSay[GUNLER_XLS[gun]].k++;
      if (color === KIRMIZI) kirmizi++;
      else crossFail.push("K ama kırmızı değil: " + GUNLER_XLS[gun] + " slot" + slot + " renk=" + color);
      if (merge) col += parseInt(merge,10);
      continue;
    }
    /* DERS hücresi */
    dersSayisi++; gunSay[GUNLER_XLS[gun]].ders++;
    dersHcreMetinleri.push(GUNLER_XLS[gun] + " slot" + slot + ": " + metin.replace(/\n/g, "⏎"));
    if (color === KIRMIZI) hardFail.push("DERS kırmızı hücrede: " + GUNLER_XLS[gun] + " slot" + slot + " → " + trim);
    if (metin.split("\n").some(l => l.trim().toUpperCase() === "K")) hardFail.push("DERS hücresinde K satırı: " + GUNLER_XLS[gun] + " slot" + slot);
    if (merge) col += parseInt(merge,10);
  }
}

console.log("=== XML OKUMA RAPORU (salt-okuma) ===");
console.log("Kırmızı-dolgulu ve tam K:", kirmizi, "/ toplam K:", kSayisi);
console.log("Ders sayısı:", dersSayisi);
console.log("Bos sayısı:", bosSayisi);
console.log("Öğle arası:", ogleSayisi);
console.log("DERS SAATLERİ satırı:", dersSaatleriSatirlari, "(5 gün × 12 slot = 60 etiket)");
for (const g of GUNLER_XLS) console.log("  " + g + ": K=" + gunSay[g].k + " ders=" + gunSay[g].ders + " bos=" + gunSay[g].bos + " ogle=" + gunSay[g].ogle);

const beklenen = { k: 263, ders: 238, bos: 253 };
let ok = true;
if (kSayisi !== beklenen.k) { console.error("K sayısı beklenenle uyuşmuyor:", kSayisi, "≠", beklenen.k); ok = false; }
if (dersSayisi !== beklenen.ders) { console.error("Ders sayısı beklenenle uyuşmuyor:", dersSayisi, "≠", beklenen.ders); ok = false; }
if (bosSayisi !== beklenen.bos) { console.error("Bos sayısı beklenenle uyuşmuyor:", bosSayisi, "≠", beklenen.bos); ok = false; }
if (kirmizi !== kSayisi) { console.error("Kırmızı/K uyuşmazlığı:", kirmizi, "≠", kSayisi); ok = false; }
if (hardFail.length) { console.error("HARD FAIL:", hardFail.slice(0, 10)); ok = false; }
if (crossFail.length) { console.error("CAPRAZ KONTROL FAIL:", crossFail.slice(0, 10)); ok = false; }
if (dersSaatleriSatirlari !== 5) { console.error("DERS SAATLERİ satır sayısı ≠ 5:", dersSaatleriSatirlari); ok = false; }
/* 16 öğretmen × 5 gün = 80 satır; satır başına 12 slot (11 ders + 1 öğle) = 960 hücre */
const toplamHucre = kSayisi + dersSayisi + bosSayisi + ogleSayisi;
if (toplamHucre !== 80 * 12) { console.error("Toplam hücre beklenen 960 değil:", toplamHucre); ok = false; }

if (!ok) { console.error("XML DOĞRULAMA BAŞARISIZ"); process.exit(1); }
console.log("XML DOĞRULAMA OK — 263 K / 238 ders / 253 bos birebir; kırmızı↔K birebir; ders hücrelerinde K yok; toplam hücre 960.");
