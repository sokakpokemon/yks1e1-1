/* ks-yama-kadro-kolon.mjs — KADRO-KOLON-YAMASI (idempotent, assert'li, exact-anchor)
   İş: Yalnızca dataset=kadro CSV'si yks-csv-v2'ye taşınır.
   Yeni header: schema;dataset;donemId;tip;id;ad;soyad;telefon;brans;sinifId;sinifAd;ekAlanlarJson
   - v2 export: ad/soyad ayrık (son boşlukla ayrılan kelime = soyad), telefon = ogrenciler[].tel (string, biçimlenmez)
   - v2 import: ad = trim(ad + " " + soyad); telefon kolonu DB .tel'e YAZILIR ve ekAlanlarJson'dan AUTHORITATIVE
   - v1 import KORUNUR: tam ad kolonu + ekAlanlarJson.tel fallback
   - Ders/istek/ekders/sinifProg CSV şemaları DEĞİŞMEZ
   2. koşu: dosyaya dokunmadan exit 2 + "Zaten uygulanmış". */
import { readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const F = "app.js";
const once = readFileSync(F, "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const fail = (m) => { console.error("HATA: " + m); process.exit(1); };

/* ---- İdempotans: yama işareti varsa dokunma ---- */
if (once.includes("KADRO-KOLON-YAMASI")) {
  console.log("Zaten uygulanmış — KADRO-KOLON-YAMASI işareti mevcut. Dosyaya dokunulmadı.");
  process.exit(2);
}

/* ---- Backup (üzerine yazma YOK: yeni dosya adı) ---- */
const BAK = "app.js.kadro-kolon-oncesi.bak";
copyFileSync(F, BAK);
console.log("Backup:", BAK, statSync(BAK).size, "bayt, SHA-256", sha(once));

let sonuc = once;
const rep = (eski, yeni, etiket) => {
  const n = sonuc.split(eski).length - 1;
  if (n !== 1) fail("anchor '" + etiket + "' tam 1 kez bulunmalı (bulunan: " + n + ")");
  sonuc = sonuc.replace(eski, yeni);
};

/* ---- 1) CSV_SCHEMA_KADRO sabiti ---- */
rep(
  'var CSV_SCHEMA = "yks-csv-v1";',
  'var CSV_SCHEMA = "yks-csv-v1";\nvar CSV_SCHEMA_KADRO = "yks-csv-v2"; /* KADRO-KOLON-YAMASI: yalnızca dataset=kadro v2; diğer dataset\'ler v1 kalır */',
  "CSV_SCHEMA"
);

/* ---- 2) V2 header + ad/soyad/telefon yardımcıları (V1 header sabiti aynen korunur) ---- */
rep(
  'var CSV_BASLIK_KADRO = ["schema","dataset","donemId","tip","id","ad","brans","sinifId","sinifAd","ekAlanlarJson"];',
  'var CSV_BASLIK_KADRO = ["schema","dataset","donemId","tip","id","ad","brans","sinifId","sinifAd","ekAlanlarJson"];\n' +
  '/* KADRO-KOLON-YAMASI: v2 kadro header — ad;soyad;telefon üst düzey kolonlar (sıra sabittir) */\n' +
  'var CSV_BASLIK_KADRO_V2 = ["schema","dataset","donemId","tip","id","ad","soyad","telefon","brans","sinifId","sinifAd","ekAlanlarJson"];\n' +
  '/* Tam adı ad+soyad\'a ayırır: son boşlukla ayrılan kelime = soyad, önceki kısım = ad.\n' +
  '   Boş ad → {ad:"", soyad:""}; tek kelimelik ad → ad dolu, soyad boş. Biçimlendirme YOK (örn. +90 korunur). */\n' +
  'function kadroAdSoyadAyir(tamAd) {\n' +
  '  var s = String(tamAd || "").replace(/\\s+/g, " ").trim();\n' +
  '  if (!s) return { ad: "", soyad: "" };\n' +
  '  var i = s.lastIndexOf(" ");\n' +
  '  if (i === -1) return { ad: s, soyad: "" };\n' +
  '  return { ad: s.slice(0, i).trim(), soyad: s.slice(i + 1).trim() };\n' +
  '}\n' +
  '/* DB telefon alanı: ogrenciler[].tel — string olarak korunur (+90, baştaki 0, boşluk, tire silinmez) */\n' +
  'function kadroTelOf(kayit) {\n' +
  '  var t = kayit && kayit.tel;\n' +
  '  return t == null ? "" : String(t);\n' +
  '}\n' +
  '/* v2 kadro satırları — KADRO-SIRALAMA-YAMASI emission sırası aynen korunur: ogretmen → sinif → ogrenci.\n' +
  '   Sinif satırlarında ad = sınıf adı; soyad ve telefon BOŞ. ekAlanlarJson tüm ek alanlarıyla korunur. */\n' +
  'function kadroV2Satirlari() {\n' +
  '  var satirlar = [];\n' +
  '  DB.ogretmenler.forEach(function (t) {\n' +
  '    var a = kadroAdSoyadAyir(t.ad);\n' +
  '    satirlar.push([CSV_SCHEMA_KADRO,"kadro","","ogretmen", t.id || "", a.ad, a.soyad, "", t.brans || "", "", "", csvEkAlanlar(t)]);\n' +
  '  });\n' +
  '  Object.keys(DB.sinifIds || {}).forEach(function (ad) {\n' +
  '    satirlar.push([CSV_SCHEMA_KADRO,"kadro","","sinif", DB.sinifIds[ad] || "", ad, "", "", "", "", ad, "{}"]);\n' +
  '  });\n' +
  '  DB.ogrenciler.forEach(function (o) {\n' +
  '    var a = kadroAdSoyadAyir(o.ad);\n' +
  '    satirlar.push([CSV_SCHEMA_KADRO,"kadro","","ogrenci", o.id || "", a.ad, a.soyad, kadroTelOf(o), "", sinifId(o.sinif) || "", o.sinif || "", csvEkAlanlar(o)]);\n' +
  '  });\n' +
  '  return satirlar;\n' +
  '}',
  "CSV_BASLIK_KADRO"
);

/* ---- 3) csvCozDosya: v2 schema'yı da kabul et ---- */
rep(
  '  if (schema !== CSV_SCHEMA) return { dataset: dataset, schema: schema, baslik: [], veriler: [], hata: csvHata(dataset, 1, "schema", "Bilinmeyen schema: " + (schema || "(boş)")) };',
  '  /* KADRO-KOLON-YAMASI: yks-csv-v2 yalnızca kadro için; diğer schema reddedilir (aşağıda dataset kontrolü) */\n' +
  '  if (schema !== CSV_SCHEMA && schema !== CSV_SCHEMA_KADRO) return { dataset: dataset, schema: schema, baslik: [], veriler: [], hata: csvHata(dataset, 1, "schema", "Bilinmeyen schema: " + (schema || "(boş)")) };',
  "csvCozDosya schema"
);

/* ---- 4) csvImportUygula: v2 yalnız kadro dataset'inde ---- */
rep(
  '    if (["kadro", "dersler", "istekler"].indexOf(c.dataset) === -1) { hatalar.push(csvHata(d.ad, 1, "dataset", "Bilinmeyen dataset: " + c.dataset)); return; }',
  '    if (["kadro", "dersler", "istekler"].indexOf(c.dataset) === -1) { hatalar.push(csvHata(d.ad, 1, "dataset", "Bilinmeyen dataset: " + c.dataset)); return; }\n' +
  '    /* KADRO-KOLON-YAMASI: v2 şema YALNIZ kadro CSV\'sinde geçerli */\n' +
  '    if (c.schema === CSV_SCHEMA_KADRO && c.dataset !== "kadro") { hatalar.push(csvHata(d.ad, 1, "schema", "yks-csv-v2 yalnızca dataset=kadro için kullanılabilir")); return; }',
  "dataset v2 guard"
);

/* ---- 5) Kadro import: dosya-bazlı v2/v1 bayrağı ---- */
rep(
  '  cozulen.filter(function (c) { return c.dataset === "kadro"; }).forEach(function (c) {\n    var goren = {}; /* aynı dosya içinde yinelenen ID kontrolü */',
  '  cozulen.filter(function (c) { return c.dataset === "kadro"; }).forEach(function (c) {\n' +
  '    /* KADRO-KOLON-YAMASI: v2 → ad/soyad üst düzey + telefon authoritative; v1 → tam ad + ekAlanlarJson.tel fallback */\n' +
  '    var v2 = c.schema === CSV_SCHEMA_KADRO;\n' +
  '    var kadroAdBirlesik = function (vv) { return v2 ? (String(vv.ad || "") + " " + String(vv.soyad || "")).trim() : (vv.ad || ""); };\n' +
  '    var goren = {}; /* aynı dosya içinde yinelenen ID kontrolü */',
  "kadro v2 bayragi"
);

/* ---- 6) Öğrenci güncelleme (mevcut) ---- */
rep(
  '          mevcut.ad = v.ad; mevcut.sinif = v.sinifAd || mevcut.sinif;\n          csvEkAlanUygula(mevcut, v.ekAlanlarJson);',
  '          mevcut.ad = kadroAdBirlesik(v); mevcut.sinif = v.sinifAd || mevcut.sinif;\n' +
  '          csvEkAlanUygula(mevcut, v.ekAlanlarJson);\n' +
  '          if (v2) mevcut.tel = String(v.telefon == null ? "" : v.telefon); /* v2: üst düzey telefon AUTHORITATIVE */',
  "ogrenci guncelleme"
);

/* ---- 7) Öğrenci ekleme (yeni) ---- */
rep(
  '          kopya.ogrenciler.push({ id: id, ad: v.ad, sinif: v.sinifAd || "", tel: "" });\n          csvEkAlanUygula(kopya.ogrenciler[kopya.ogrenciler.length - 1], v.ekAlanlarJson);',
  '          kopya.ogrenciler.push({ id: id, ad: kadroAdBirlesik(v), sinif: v.sinifAd || "", tel: v2 ? String(v.telefon == null ? "" : v.telefon) : "" });\n' +
  '          csvEkAlanUygula(kopya.ogrenciler[kopya.ogrenciler.length - 1], v.ekAlanlarJson);\n' +
  '          if (v2) kopya.ogrenciler[kopya.ogrenciler.length - 1].tel = String(v.telefon == null ? "" : v.telefon); /* v2 authoritative */',
  "ogrenci ekleme"
);

/* ---- 8) Öğretmen güncelleme (mevcut) ---- */
rep(
  '          mevcutT.ad = v.ad; mevcutT.brans = v.brans || mevcutT.brans;',
  '          mevcutT.ad = kadroAdBirlesik(v); mevcutT.brans = v.brans || mevcutT.brans;',
  "ogretmen guncelleme"
);

/* ---- 9) Öğretmen ekleme (yeni) ---- */
rep(
  '          kopya.ogretmenler.push({ id: id, ad: v.ad, brans: v.brans || "", avail: { sinif: {}, musait: [] } });',
  '          kopya.ogretmenler.push({ id: id, ad: kadroAdBirlesik(v), brans: v.brans || "", avail: { sinif: {}, musait: [] } });',
  "ogretmen ekleme"
);

/* ---- 10) Export: kadro indirme artık v2 ---- */
rep(
  'function csvKadroIndir() {\n  csvIndir("yks-kadro-global.csv", CSV_BASLIK_KADRO, csvKadroSatirlari());\n  toast("Kadro CSV indirildi ✓ (tüm öğrenci/öğretmen/sınıf — dönem filtresi yok)");',
  'function csvKadroIndir() {\n  /* KADRO-KOLON-YAMASI: dışa aktarma v2 (ad;soyad;telefon üst düzey) — v1 içe aktarma KORUNUR */\n  csvIndir("yks-kadro-global.csv", CSV_BASLIK_KADRO_V2, kadroV2Satirlari());\n  toast("Kadro CSV indirildi ✓ (v2 — tüm öğrenci/öğretmen/sınıf — dönem filtresi yok)");',
  "csvKadroIndir"
);

/* ---- Son kontroller ---- */
if (sonuc.split("KADRO-KOLON-YAMASI").length - 1 < 5) fail("yama işaretleri eksik");
const v2HeaderSay = sonuc.split('"soyad","telefon"').length - 1;
if (v2HeaderSay !== 1) fail("v2 header tam 1 kez olmalı (bulunan: " + v2HeaderSay + ")");
if (!sonuc.includes('var CSV_BASLIK_KADRO = ["schema","dataset","donemId","tip","id","ad","brans","sinifId","sinifAd","ekAlanlarJson"];')) fail("v1 header sabiti korunmalı");

writeFileSync(F, sonuc);
console.log("KADRO-KOLON-YAMASI uygulandı.");
console.log("  öncesi SHA-256:", sha(once), "(" + once.length + " B)");
console.log("  sonrası SHA-256:", sha(sonuc), "(" + sonuc.length + " B)");
