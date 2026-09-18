// Salt-okuma XML doğrulama — yazma YOK
// RESMI KAYNAK: program-guncel.xml (kullanıcı B seçimi; A'daki 3 hücrelik aktarım hatası için bkz. CHECKPOINT)
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const raw = readFileSync("program-guncel.xml", "utf8");
const buf = readFileSync("program-guncel.xml");
const sha = createHash("sha256").update(buf).digest("hex");
console.log("XML bytes:", buf.length, "sha256:", sha);
if (!raw.startsWith('<?xml') || !raw.includes("<Workbook") || !raw.trimEnd().endsWith("</Workbook>")) {
  throw new Error("XML başlangıç/bitiş biçimi hatalı");
}
// parse edilebilirlik
import("node:stream/consumers"); // noop import guard
const { parseFromString } = await import("node:util").then(() => ({ parseFromString: null })).catch(() => ({}));
// Node DOMParser yok; hızlı yapısal kontrol + elle sayım
const cellRe = /<Cell\b([^>]*)>([\s\S]*?)<\/Cell>|<Cell\b([^>]*)\/>/g;

function decode(s) {
  return s.replace(/&#10;/g, "\n").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}
function attr(attrs, name) {
  const m = attrs && attrs.match(new RegExp('ss:' + name + '="([^"]*)"'));
  return m ? m[1] : undefined;
}
function styleOf(attrs) { return attr(attrs, "StyleID"); }
function redStyle(attrs) { return styleOf(attrs) === "s21"; }

// gün bloklarını böl
const dayNames = { "PAZARTESİ": 0, "SALI": 1, "ÇARŞAMBA": 2, "PERŞEMBE": 3, "CUMARTESİ": 5 };
const rowsXml = raw.split(/<Row\b/).slice(1).map(r => r.split("</Row>")[0]);
// Daha sağlam: sırayla satır tara
const rowRe = /<Row\b[^>]*>([\s\S]*?)<\/Row>/g;
let m, currentDay = null, dayData = { 0: [], 1: [], 2: [], 3: [], 5: [] };
let headerSeen = false;
let dayOrder = [];
while ((m = rowRe.exec(raw)) !== null) {
  const rowInner = m[1];
  const cells = [];
  const cRe = /<Cell\b([^>]*?)\/>|<Cell\b([^>]*?)>([\s\S]*?)<\/Cell>/g;
  let c;
  const colCells = [];
  while ((c = cRe.exec(rowInner)) !== null) {
    const attrs = c[1] !== undefined ? c[1] : c[2];
    const inner = c[3] !== undefined ? c[3] : "";
    const dMatch = inner.match(/<Data[^>]*>([\s\S]*?)<\/Data>/);
    const text = dMatch ? decode(dMatch[1]) : null;
    colCells.push({ attrs, text });
  }
  // ss:Index hesabı
  const cells2 = [];
  let col = 1;
  for (const cell of colCells) {
    const idx = attr(cell.attrs, "Index");
    if (idx) { col = parseInt(idx, 10); }
    cells2.push({ col, ...cell });
    col++;
  }
  // gün başlığı mı? (MergeAcross=12 + s24 + bilinen gün)
  const first = cells2[0];
  if (first && attr(first.attrs, "MergeAcross") === "12" && first.text) {
    const t = first.text.trim().toUpperCase();
    if (dayNames[t] !== undefined) { currentDay = dayNames[t]; dayOrder.push(t); headerSeen = true; continue; }
  }
  if (currentDay === null) continue;
  if (!headerSeen) continue;
  if (first && first.text && first.text.trim() === "DERS SAATLERİ") continue; // saat başlık satırı
  // öğretmen satırı
  if (first && first.text) {
    dayData[currentDay].push({ ad: first.text.trim(), cells: cells2.slice(1) });
  }
}
// beklenen: her gün 14 öğretmen satırı, 12 slot
let totals = { K: 0, DERS: 0, BOS: 0, MOLA: 0, BELIRSIZ: 0 };
const dayExpect = { 0: {K:68,DERS:40,BOS:45,MOLA:14,BELIRSIZ:1}, 1: {K:98,DERS:37,BOS:19,MOLA:14,BELIRSIZ:0},
  2: {K:71,DERS:40,BOS:43,MOLA:14,BELIRSIZ:0}, 3: {K:54,DERS:41,BOS:59,MOLA:14,BELIRSIZ:0},
  5: {K:18,DERS:85,BOS:51,MOLA:14,BELIRSIZ:0} };
const allTeachers = new Set();
const allClassTexts = new Set();
let ok = true;
for (const d of [0,1,2,3,5]) {
  const rows = dayData[d];
  if (rows.length !== 14) { console.error(`Gün ${d}: satır sayısı ${rows.length} ≠ 14`); ok = false; }
  const counts = { K: 0, DERS: 0, BOS: 0, MOLA: 0, BELIRSIZ: 0 };
  rows.forEach((r, ri) => {
    allTeachers.add(r.ad);
    // 12 slot; col 2..13
    const byCol = new Map(r.cells.map(c => [c.col, c]));
    let present = 0;
    for (let slot = 1; slot <= 12; slot++) {
      const col = slot + 1;
      const cell = byCol.get(col);
      if (!cell) { // fiziksel eksik (ss:Index atlama)
        if (d === 0 && r.ad.includes("FİKRİYE") && slot === 9) { counts.BELIRSIZ++; continue; }
        console.error(`Beklenmeyen eksik hücre: gün ${d} ${r.ad} slot ${slot}`); ok = false; continue;
      }
      present++;
      const t = (cell.text || "").trim();
      const tu = t.toLocaleUpperCase("tr-TR");
      const isRed = redStyle(cell.attrs);
      if (slot === 5) {
        if (tu === "ÖĞLE ARASI") counts.MOLA++; else { console.error(`Slot5 mola değil: gün ${d} ${r.ad}: ${t}`); ok=false; }
        continue;
      }
      if (tu === "K") {
        counts.K++;
        if (!isRed) { console.error(`K ama kırmızı değil: gün ${d} ${r.ad} slot ${slot}`); ok = false; }
      } else if (tu === "") {
        counts.BOS++;
        if (isRed) { console.error(`Boş ama kırmızı: gün ${d} ${r.ad} slot ${slot}`); ok = false; }
      } else {
        counts.DERS++;
        if (isRed) { console.error(`DERS ama kırmızı: gün ${d} ${r.ad} slot ${slot}: ${t}`); ok = false; }
        if (tu.includes("K") && t.split(/[\n]+/).length === 1 && tu === "K") { /* yok */ }
        allClassTexts.add(t);
      }
    }
  });
  const exp = dayExpect[d];
  for (const k of Object.keys(exp)) {
    if (counts[k] !== exp[k]) { console.error(`Gün ${d} ${k}: ${counts[k]} ≠ ${exp[k]}`); ok = false; }
    totals[k] += counts[k];
  }
  console.log(`Gün ${d} (row ${ri => ""}):`, JSON.stringify(counts));
}
console.log("TOPLAM:", JSON.stringify(totals));
console.log("Benzersiz öğretmen sayısı:", allTeachers.size);
console.log("Öğretmenler:", [...allTeachers].sort().join(", "));
console.log("Benzersiz ders/sınıf metinleri:", [...allClassTexts].sort().join(" | "));
if (!ok) { console.error("VALIDASYON FAIL"); process.exit(1); }
if (totals.K !== 309 || totals.DERS !== 243 || totals.BOS !== 217 || totals.MOLA !== 70 || totals.BELIRSIZ !== 1) {
  console.error("TOPLAM KAPISI FAIL"); process.exit(1);
}
console.log("XML SAYIM KAPISI GECTI");
