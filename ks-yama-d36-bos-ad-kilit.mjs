/* ks-yama-d36-bos-ad-kilit.mjs — D36 AÇIK KALEM (a): "boş adlı sınıf kaydı slotu" kilit sertleştirmesi.
   Marker: D36-BOS-AD-KILIT → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.d36-bos-ad-kilit-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır —
   rapor YEDEKTEN ÖNCE yazılır: önce mevcut app.js byte+SHA, sonra yedek + yedek doğrulaması).

   KÖK: iki yerde kilit koşulu "değer DOLU mu" (truthy) idi; "anahtar VAR mı" değil.
     1) HAFTALIK (haftalikOgrtTablo :3832): koşul `key in avail.sinif` DOĞRU olsa da
        sinifChipHTML(avail.sinif[key]) KOŞULSUZ çağrılıyordu → ad boşsa UYDURMA "Sınıf" etiketi.
     2) GÜNLÜK ANA SATIR (gunlukTablo :4245-4250): koşul `avail.sinif[dowIdx28+"-"+slot.no]` (truthy)
        idi → ad boşsa bu dal HİÇ çalışmıyor, hücre MEVCUT drop-zone "+" olarak kalıyordu.

   ÇÖZÜM: kilit koşulu "anahtar VAR" tabanlı. Hücre KİLİTLİ kalır (drop-zone AÇILMAZ);
           sinifChipHTML YALNIZ sınıf adı DOLUYSA çağrılır (ad boşsa uydurma "Sınıf"/etiket YOK).
   DOKUNULMAZ: haftalık çıktı (ad DOLU slotlarda birebir aynı chip), mola/Pazar/Kapalı/"Dolu"/"Boş"
   hücreleri, dolu birebir hücresi, dersDrag/dersBurak/dersDropHedef, D29 havuza-geri, grupUyeYaz,
   WA/PNG, D35. Yeni chip üreticisi/string inşası YOK — aynı sinifChipHTML. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.d36-bos-ad-kilit-oncesi.bak";
const HTML = "index.html";
const MARKER = "D36-BOS-AD-KILIT";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const sha16 = (s) => sha256(s).slice(0, 16);

let src = readFileSync(APP, "utf8");
if (src.includes(MARKER)) { console.error("ZATEN UYGULANMIŞ (" + MARKER + " marker var) — yazmadan çıkılıyor."); process.exit(2); }

/* ---- YEDEKTEN ÖNCE: mevcut app.js byte + SHA ---- */
console.log("APP  önce: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));

if (!existsSync(BAK)) { copyFileSync(APP, BAK); console.log("YEDEK oluşturuldu: " + BAK); }
const bakSrc = readFileSync(BAK, "utf8");
console.log("BAK     : " + Buffer.byteLength(bakSrc, "utf8") + " B · sha256=" + sha256(bakSrc));
if (sha256(bakSrc) !== sha256(src)) { console.error("YEDEK DOĞRULAMA HATASI: yedek app.js ile birebir DEĞİL."); process.exit(1); }

let degisen = 0;
function degis(etiket, eski, yeni, kez) {
  const n = src.split(eski).length - 1;
  if (n !== kez) { console.error("ANCHOR HATASI [" + etiket + "]: beklenen " + kez + ", bulunan " + n); process.exit(1); }
  src = src.split(eski).join(yeni);
  degisen += kez;
  console.log("  ✓ " + etiket + " (" + kez + ")");
}

/* ---- 1) HAFTALIK çizelge: anahtar VAR → kilitli; chip YALNIZ ad DOLUYSA ---- */
degis("1 haftalık sınıf-dersi hücresi: chip çağrısı yalnız ad DOLUYSA (anahtar var → kilitli)",
`      } else if (sinifVar) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100">' + sinifChipHTML(avail.sinif[key]) + '</td>'; /* SINIF-CHIP-ORTAK-YAMASI: pembe chip TEK üreticiden — dnd-kilit hücresi ve çıktı birebir aynı */`,
`      } else if (sinifVar) {
        /* D36-BOS-AD-KILIT: KİLİT koşulu "anahtar VAR" (key in avail.sinif) — sınıf adı BOŞ olsa bile
           hücre dnd-kilit (drop-zone DEĞİL); chip YALNIZ ad DOLUYSA çizilir (ad boşsa uydurma "Sınıf" YOK). */
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100">' + (avail.sinif[key] ? sinifChipHTML(avail.sinif[key]) : "") + '</td>'; /* SINIF-CHIP-ORTAK-YAMASI: pembe chip TEK üreticiden — dnd-kilit hücresi ve çıktı birebir aynı */`, 1);

/* ---- 2) GÜNLÜK ANA SATIR: kilit koşulu "anahtar VAR"; chip YALNIZ ad DOLUYSA ---- */
degis("2 günlük ANA satır sınıf-dersi hücresi: kilit koşulu key in avail.sinif + chip yalnız ad DOLUYSA",
`        } else if (ogrtAvail && ogrtAvail.avail && ogrtAvail.avail.sinif && ogrtAvail.avail.sinif[dowIdx28 + "-" + slot.no]) {
          /* D36-ANA-SATIR-YAMASI: sınıf dersi slotu (avail.sinif) — bu hücre artık DROP-ZONE DEĞİL;
             haftalık çizelge ve günlük "Boş" satırıyla AYNI sinifChipHTML üreticisi + AYNI veri alanı.
             Sınıf adı boş/yoksa bu dal HİÇ çalışmaz → mevcut drop-zone davranışı korunur (uydurma etiket YOK).
             Kilit ayrıca MEVCUT istekBurak/dersBurak kuralında (avail.sinif → kilitli) zaten reddeder. */
          html += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-r border-slate-200">' + sinifChipHTML(ogrtAvail.avail.sinif[dowIdx28 + "-" + slot.no]) + '</td>';`,
`        } else if (ogrtAvail && ogrtAvail.avail && ogrtAvail.avail.sinif && ((dowIdx28 + "-" + slot.no) in ogrtAvail.avail.sinif)) {
          /* D36-ANA-SATIR-YAMASI + D36-BOS-AD-KILIT: sınıf dersi slotu (avail.sinif) — bu hücre DROP-ZONE DEĞİL;
             haftalık çizelge ve günlük "Boş" satırıyla AYNI sinifChipHTML üreticisi + AYNI veri alanı.
             KİLİT koşulu "anahtar VAR" (key in avail.sinif): sınıf adı BOŞ olsa bile hücre KİLİTLİ kalır,
             drop-zone "+" AÇILMAZ. Chip YALNIZ sınıf adı DOLUYSA çizilir (ad boşsa uydurma "Sınıf" YOK).
             Kilit ayrıca MEVCUT istekBurak/dersBurak kuralında (avail.sinif → kilitli) zaten reddeder. */
          html += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-r border-slate-200">' + (ogrtAvail.avail.sinif[dowIdx28 + "-" + slot.no] ? sinifChipHTML(ogrtAvail.avail.sinif[dowIdx28 + "-" + slot.no]) : "") + '</td>';`, 1);

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
