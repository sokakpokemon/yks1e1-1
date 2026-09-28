/* ks-yama-d36-ana-satir.mjs — GÜNLÜK ÇİZELGE ANA SATIR sınıf dersi hücresi (D36 kalanı).
   Marker: D36-ANA-SATIR → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.d36-ana-satir-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır).
   KÖK: gunlukTablo ANA satırlarında (o gün dersi OLAN öğretmen) sınıf dersi slotu (avail.sinif) ders
   kaydı olmadığı için MEVCUT drop-zone "+" olarak çiziliyordu — gerçek sınıf adı görünmüyordu.
   ÇÖZÜM: ana satırda avail.sinif["<gün>-<slot>"] DOLU ise hücre DROP-ZONE DEĞİL; haftalık çizelge ve
   günlük "Boş" satırıyla AYNI üreticiden (sinifChipHTML) GERÇEK sınıf adı chip'i basılır (ikinci
   chip/string inşası YOK). Sınıf adı boş/yoksa bu dal çalışmaz → MEVCUT drop-zone davranışı korunur
   (uydurma etiket YOK). Kilit zaten MEVCUT istekBurak/dersBurak kurallarında (avail.sinif → kilitli).
   DOKUNULMAZ: haftalık çıktı, mola/Pazar/Kapalı/"Boş"/"Dolu" hücreleri, dolu birebir hücresi,
   dersDrag/dersBurak/dersDropHedef, D29 havuza-geri, grupUyeYaz, WA/PNG, D35. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.d36-ana-satir-oncesi.bak";
const HTML = "index.html";
const MARKER = "D36-ANA-SATIR";
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

/* ---- 1) ANA satır: satır öğretmeninin avail kaydı (veri alanı haftalık/Boş satırla AYNI) ---- */
degis("1 ana satır öğretmen avail referansı",
`    var ogrtId = ogrtIdMap[ogrtAd] || ""; /* GUNLUK-DERS-TASI-YAMASI: satırın öğretmen kimliği — hedef satır kontrolü bununla yapılır */`,
`    var ogrtId = ogrtIdMap[ogrtAd] || ""; /* GUNLUK-DERS-TASI-YAMASI: satırın öğretmen kimliği — hedef satır kontrolü bununla yapılır */
    /* D36-ANA-SATIR-YAMASI: satır öğretmeninin avail kaydı — sınıf dersi slotu ANA satırda da GERÇEK
       sınıf adı chip'i olarak çizilir; veri alanı haftalık ve "Boş" satırıyla AYNI: avail.sinif["<günIdx>-<slotNo>"] */
    var ogrtAvail = ogrtId ? DB.ogretmenler.find(function (x) { return x.id === ogrtId; }) : null;`, 1);

/* ---- 2) ANA satır sınıf dersi hücresi: drop-zone yerine TEK üreticiden pembe chip ---- */
degis("2 ana satır sınıf dersi hücresi: drop-zone → GERÇEK sınıf adı chip'i (kilitli)",
`        } else if (ogrtId) {
          /* GUNLUK-DERS-TASI-YAMASI: boş hücre = MEVCUT drop-zone yolu (aynı dnd-bos + istekDragOver/istekDragLeave +`,
`        } else if (ogrtAvail && ogrtAvail.avail && ogrtAvail.avail.sinif && ogrtAvail.avail.sinif[dowIdx28 + "-" + slot.no]) {
          /* D36-ANA-SATIR-YAMASI: sınıf dersi slotu (avail.sinif) — bu hücre artık DROP-ZONE DEĞİL;
             haftalık çizelge ve günlük "Boş" satırıyla AYNI sinifChipHTML üreticisi + AYNI veri alanı.
             Sınıf adı boş/yoksa bu dal HİÇ çalışmaz → mevcut drop-zone davranışı korunur (uydurma etiket YOK).
             Kilit ayrıca MEVCUT istekBurak/dersBurak kuralında (avail.sinif → kilitli) zaten reddeder. */
          html += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-r border-slate-200">' + sinifChipHTML(ogrtAvail.avail.sinif[dowIdx28 + "-" + slot.no]) + '</td>';
        } else if (ogrtId) {
          /* GUNLUK-DERS-TASI-YAMASI: boş hücre = MEVCUT drop-zone yolu (aynı dnd-bos + istekDragOver/istekDragLeave +`, 1);

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
