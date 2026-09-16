/* ks-yama-kadro-siralama.mjs — KADRO-SIRALAMA-YAMASI
   Tek iş: csvKadroSatirlari() emission sırası → ogretmen → sinif → ogrenci.
   Assert'li, idempotent: 2. koşu dosyaya dokunmadan exit 2 + "Zaten uygulanmış". */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const F = "app.js";
const sha = (s) => createHash("sha256").update(s).digest("hex");

let kod;
try { kod = readFileSync(F, "utf8"); } catch (e) { console.error("app.js okunamadı:", e.message); process.exit(1); }
const once = sha(kod);

const ESKI = `function csvKadroSatirlari() {
  var satirlar = [];
  DB.ogrenciler.forEach(function (o) {
    satirlar.push([CSV_SCHEMA,"kadro","", "ogrenci", o.id || "", o.ad || "", "", sinifId(o.sinif) || "", o.sinif || "", csvEkAlanlar(o)]);
  });
  DB.ogretmenler.forEach(function (t) {
    satirlar.push([CSV_SCHEMA,"kadro","", "ogretmen", t.id || "", t.ad || "", t.brans || "", "", "", csvEkAlanlar(t)]);
  });
  Object.keys(DB.sinifIds || {}).forEach(function (ad) {
    satirlar.push([CSV_SCHEMA,"kadro","", "sinif", DB.sinifIds[ad] || "", ad, "", "", ad, "{}"]);
  });
  return satirlar;
}`;

const YENI = `function csvKadroSatirlari() {
  /* KADRO-SIRALAMA-YAMASI: emission sırası → ogretmen → sinif → ogrenci.
     Import satır sırasına bağlı DEĞİLDİR (tip+ID upsert); sıra yalnızca okunabilirlik içindir. */
  var satirlar = [];
  DB.ogretmenler.forEach(function (t) {
    satirlar.push([CSV_SCHEMA,"kadro","", "ogretmen", t.id || "", t.ad || "", t.brans || "", "", "", csvEkAlanlar(t)]);
  });
  Object.keys(DB.sinifIds || {}).forEach(function (ad) {
    satirlar.push([CSV_SCHEMA,"kadro","", "sinif", DB.sinifIds[ad] || "", ad, "", "", ad, "{}"]);
  });
  DB.ogrenciler.forEach(function (o) {
    satirlar.push([CSV_SCHEMA,"kadro","", "ogrenci", o.id || "", o.ad || "", "", sinifId(o.sinif) || "", o.sinif || "", csvEkAlanlar(o)]);
  });
  return satirlar;
}`;

if (kod.includes(YENI)) {
  console.error("Zaten uygulanmış — dosyaya dokunulmadı. SHA-256 (değişmedi): " + once);
  process.exit(2);
}
if (kod.includes("CSV_SCHEMA,\"kadro\",\"\", \"ogrenci\"") && !kod.includes(ESKI)) {
  console.error("BEKLENMEDİK DURUM: csvKadroSatirlari tanınıyor ama anchor birebir eşleşmedi — fail-closed, yazma YOK.");
  process.exit(1);
}
if (!kod.includes(ESKI)) {
  console.error("FAIL-CLOSED: exact anchor (csvKadroSatirlari gövdesi) bulunamadı — hiçbir dosya değiştirilmedi.");
  process.exit(1);
}

/* Koruma assert'leri: yalnız TEK csvKadroSatirlari tanımı; header byte-identical kalacak */
const defCount = (kod.match(/function csvKadroSatirlari\(/g) || []).length;
if (defCount !== 1) { console.error("FAIL-CLOSED: csvKadroSatirlari tanım sayısı " + defCount + " ≠ 1."); process.exit(1); }
if (!kod.includes('var CSV_BASLIK_KADRO = ["schema","dataset","donemId","tip","id","ad","brans","sinifId","sinifAd","ekAlanlarJson"];')) {
  console.error("FAIL-CLOSED: CSV_BASLIK_KADRO anchor yok."); process.exit(1);
}
const bak = "app.js.kadro-siralama-oncesi.bak";
if (existsSync(bak)) {
  const eskiBak = readFileSync(bak, "utf8");
  if (sha(eskiBak) !== once) { console.error("FAIL-CLOSED: yedek var ama mevcut app.js ile uyuşmuyor — üzerine yazılmaz."); process.exit(1); }
  console.log("Yedek zaten var ve birebir uyuşuyor: " + bak + " (SHA-256 " + sha(eskiBak) + ")");
} else {
  writeFileSync(bak, kod);
  console.log("Yedek alındı: " + bak + " SHA-256 " + once);
}

const yeni = kod.replace(ESKI, YENI);
if (yeni === kod) { console.error("FAIL-CLOSED: replace etkisiz."); process.exit(1); }
/* Yazma öncesi son koruma: header ve diğer fonksiyonlar değişmemeli */
const koru = ["function csvHucre(", "function csvSatir(", "function csvDosya(", "function csvParse(", "function csvImportUygula(", "function sinifProgCsvSatirlari("];
for (const k of koru) if (!yeni.includes(k)) { console.error("FAIL-CLOSED: koruma sembolü kayboldu: " + k); process.exit(1); }
if (yeni.replace(YENI, "") !== kod.replace(ESKI, "")) { console.error("FAIL-CLOSED: bölge dışı fark var."); process.exit(1); }

writeFileSync(F, yeni);
console.log("Yama uygulandı. app.js: " + once + " → " + sha(yeni));
