import fs from "node:fs";
const p = "ks-yama-ekders-ozet-csv.mjs";
const lines = fs.readFileSync(p, "utf8").split("\n");
const i = lines.findIndex(l => l.includes("SATIR-2-FIX2"));
if (i === -1) { console.error("satır bulunamadı"); process.exit(1); }
/* Hedef üretilen JS satırı (app.js'te görünecek):
          (ekToplam ? '<p class="text-[12.5px] text-slate-600"><b>' + ekToplam + " ek ders</b> bu dönemde planlandı (birebir/grup ders sayılarına dahil değildir). Ek Ders ayrı bir kategoridir.</p>' +
   Bu JS'te geçersiz: dq string " ek ders ... </p>' + SONSUZ. Doğrusu:
          (ekToplam ? '<p class="text-[12.5px] text-slate-600"><b>' + ekToplam + " ek ders</b> bu dönemde planlandı (birebir/grup ders sayılarına dahil değildir). Ek Ders ayrı bir kategoridir.</p>" +
   yani açıklama sq değil dq ile bitmeli. Yama kaynak satırında: "...kategoridir.</p>\\' +\\n' +"
   yerine: "...kategoridir.</p>\" +\\n' +" olmalı. */
const eski = lines[i];
const yeni = eski.replace("kategoridir.</p>\\' + /* EK-DERS-KATEGORI-ACIKLAMA */\\n' + /* SATIR-2-FIX2 */",
  "kategoridir.</p>\" +\\n' + /* SATIR-2-FIX3 */");
lines[i] = yeni;
fs.writeFileSync(p, lines.join("\n"));
console.log("yazıldı:", JSON.stringify(yeni.slice(-100)));
