/* ks-yama-gunluk-sinif-chip.mjs — GÜNLÜK ÇİZELGEDE GERÇEK SINIF ADI CHIP'i (haftalıkla TEK üretici).
   Marker: GUNLUK-SINIF-CHIP → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.gunluk-sinif-chip-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır).
   KÖK: gunlukTablo "Boş" satırlarında sınıf dersi slotu literal "Sınıf" yazıyordu (hangi sınıf belli değil).
   ÇÖZÜM: haftalık çizelgedeki PEMBE chip TEK üreticiye (sinifChipHTML) alındı.
     - Haftalık çıktı BİREBİR aynı: aynı td frame + aynı chip string'i (aynı veri alanı avail.sinif[key]).
     - Günlük de AYNI üreticiyi + AYNI veri alanını (t.avail.sinif["<gün>-<slot>"]) kullanır.
     - İkinci bir chip/string inşası YOK (tek markup literali).
     - Sınıf adı boş/bulunamazsa chip BASILMAZ (uydurma etiket yok) → mevcut gri "Kapalı" hücresi kalır.
   DOKUNULMAZ: mola / Pazar / Kapalı / "Dolu" hücreleri, dolu birebir hücresi, dersDrag/dersBurak/
   dersDropHedef, D29 havuza-geri, grupUyeYaz, WA/PNG, D35. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.gunluk-sinif-chip-oncesi.bak";
const HTML = "index.html";
const MARKER = "GUNLUK-SINIF-CHIP";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const sha16 = (s) => sha256(s).slice(0, 16);

let src = readFileSync(APP, "utf8");
if (src.includes(MARKER)) { console.error("ZATEN UYGULANMIŞ (" + MARKER + " marker var) — yazmadan çıkılıyor."); process.exit(2); }

if (!existsSync(BAK)) { copyFileSync(APP, BAK); console.log("YEDEK oluşturuldu: " + BAK); }
const bak = readFileSync(BAK, "utf8");
console.log("APP  önce: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));
console.log("BAK     : " + Buffer.byteLength(bak, "utf8") + " B · sha256=" + sha256(bak));

let degisen = 0;
function degis(etiket, eski, yeni, kez) {
  const n = src.split(eski).length - 1;
  if (n !== kez) { console.error("ANCHOR HATASI [" + etiket + "]: beklenen " + kez + ", bulunan " + n); process.exit(1); }
  src = src.split(eski).join(yeni);
  degisen += kez;
  console.log("  ✓ " + etiket + " (" + kez + ")");
}

/* ---- 1) ORTAK ÜRETİCİ: haftalık pembe chip'i (haftalikOgrtTablo'nun hemen öncesi —
        guncelMi/diğer blok-hash testleri bu bölgeyi taramaz, haftalik bolge dilimi DEĞİŞMEZ) ---- */
degis("1 ortak sınıf chip üreticisi (TEK markup literali)",
`function haftalikOgrtTablo() {
  var ogrtId = ui.haftalikOgrtId;`,
`/* SINIF-CHIP-ORTAK-YAMASI: haftalık çizelgedeki PEMBE sınıf dersi chip'i — TEK üretici.
   Veri alanı DAİMA t.avail.sinif["<günIdx>-<slotNo>"] (haftalık ve günlük aynı alan).
   Çağıran gerçek sınıf adını verir; ad boş/bulunamazsa çağıran chip BASMAZ (günlük de dahil).
   "Sınıf" yer tutucusu yalnız haftalığın MEVCUT davranışını korur (gerçek ad DAİMA önceliklidir). */
function sinifChipHTML(sinifAd) {
  return '<div class="rounded-lg bg-rose-100 border border-rose-200 px-1 py-1.5" title="Sınıf dersi — kilitli">' +
    '<div class="text-[8px] font-bold text-rose-700 leading-tight truncate whitespace-nowrap">' + esc((sinifAd || "Sınıf").substring(0, 14)) + '</div></div>';
}

function haftalikOgrtTablo() {
  var ogrtId = ui.haftalikOgrtId;`, 1);

/* ---- 2) HAFTALIK: chip ortak üreticiden (çıktı BİREBİR aynı) ---- */
degis("2 haftalık chip ortak üreticiye bağlandı (çıktı birebir)",
`        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg bg-rose-100 border border-rose-200 px-1 py-1.5" title="Sınıf dersi — kilitli">' +
          '<div class="text-[8px] font-bold text-rose-700 leading-tight truncate whitespace-nowrap">' + esc((avail.sinif[key] || 'Sınıf').substring(0, 14)) + '</div></div></td>';`,
`        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100">' + sinifChipHTML(avail.sinif[key]) + '</td>'; /* SINIF-CHIP-ORTAK-YAMASI: pembe chip TEK üreticiden — dnd-kilit hücresi ve çıktı birebir aynı */`, 1);

/* ---- 3) GÜNLÜK: literal "Sınıf" yerine gerçek sınıf adı chip'i (aynı üretici + aynı veri alanı) ---- */
degis("3 günlük sınıf dersi hücresi: literal 'Sınıf' → GERÇEK sınıf adı chip'i",
`        if (kilitli28) {
          html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-slate-100/70" title="Kilitli — bu saatte ders veremez">' +
            '<span class="text-[9px] font-bold text-slate-400 select-none">' + (dolu28 ? "Dolu" : (t.avail && t.avail.sinif && key28 in t.avail.sinif) ? "Sınıf" : "Kapalı") + '</span></td>';`,
`        if (kilitli28) {
          /* SINIF-CHIP-ORTAK-YAMASI: sınıf dersi slotu UYDURMA "Sınıf" etiketi DEĞİL — haftalık çizelgeyle
             AYNI pembe chip + AYNI veri alanı (t.avail.sinif["<gün>-<slot>"]). Sınıf adı boş/yoksa chip
             BASILMAZ (uydurma etiket yok). "Dolu"/"Kapalı" hücreleri DEĞİŞMEDİ (aynı td + aynı span).
             Hücre çerçevesi günlük tablonun kendi kenarlık kuralıdır (border-r); CHIP markup'ı birebir aynı. */
          var snf28 = (t.avail && t.avail.sinif && key28 in t.avail.sinif) ? t.avail.sinif[key28] : "";
          if (!dolu28 && snf28) {
            html += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-r border-slate-200">' + sinifChipHTML(snf28) + '</td>';
          } else {
            html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-slate-100/70" title="Kilitli — bu saatte ders veremez">' +
              '<span class="text-[9px] font-bold text-slate-400 select-none">' + (dolu28 ? "Dolu" : "Kapalı") + '</span></td>';
          }`, 1);

writeFileSync(APP, src, "utf8");
console.log("\nAPP sonra: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src) + " · sha16=" + sha16(src));
console.log("Toplam değişen anchor: " + degisen);

/* ---- index.html damgası: app.js?v=<SHA16> tazele ---- */
let html = readFileSync(HTML, "utf8");
const eskiDamga = (html.match(/app\.js\?v=([0-9a-f]{16})/) || [])[1];
const yeniDamga = sha16(src);
if (eskiDamga !== yeniDamga) {
  const n = (html.match(/app\.js\?v=[0-9a-f]{16}/g) || []).length;
  if (n !== 1) { console.error("index.html damga sayısı beklenen 1, bulunan " + n); process.exit(1); }
  html = html.replace(/app\.js\?v=[0-9a-f]{16}/, "app.js?v=" + yeniDamga);
  writeFileSync(HTML, html, "utf8");
  console.log("index.html damgası tazelendi: " + eskiDamga + " → " + yeniDamga);
} else {
  console.log("index.html damgası zaten güncel: " + yeniDamga);
}
console.log("index.html sha256=" + sha256(html));
