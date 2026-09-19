/* ks-yama-telefon3.mjs — TELEFON3-YAMASI
   TEK İŞ: öğrenci kaydına 3 telefon alanı (tel, anneTel, babaTel) + CSV v3 + form UI.
   Assert'li, idempotent: 2. koşu "Zaten uygulanmış" (exit 2), dosyaya dokunmaz. */
import { readFileSync, writeFileSync, existsSync, copyFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const F = "app.js";
let kod;
try { kod = readFileSync(F, "utf8"); } catch (e) { console.error("app.js okunamadı:", e.message); process.exit(1); }
const onceSha = sha(kod);

if (kod.includes("TELEFON3-YAMASI")) {
  console.log("Zaten uygulanmış — değişiklik yapılmadı. SHA-256 (değişmedi): " + onceSha);
  process.exit(2);
}

const onceKod = kod; // bölge-dışı bütünlük kanıtı için
let yeni = kod;
function yamaAdim(ad, eski, yeniMetin, sayi) {
  const n = yeni.split(eski).length - 1;
  if (n !== (sayi || 1)) { console.error(`FAIL-CLOSED [${ad}]: anchor ${n} kez bulundu (beklenen ${sayi || 1}).`); process.exit(1); }
  if (!yeni.includes(eski)) { console.error(`FAIL-CLOSED [${ad}]: anchor yok.`); process.exit(1); }
  yeni = yeni.replace(eski, yeniMetin);
  if (!yeni.includes(yeniMetin)) { console.error(`FAIL-CLOSED [${ad}]: replace etkisiz.`); process.exit(1); }
  console.log(`  bölge uygulandı: ${ad}`);
}

/* ---------- 1) normalize migration: tel/anneTel/babaTel ---------- */
yamaAdim("normalize-migration",
  `  if (typeof kadroDuzelt === "function") kadroDuzelt(d);`,
  `  /* TELEFON3-YAMASI: ogrenciler[].tel/anneTel/babaTel migration — idempotent.
     Mevcut tel AYNEN korunur; anneTel/babaTel eksikse "" olarak eklenir; mevcut değerler DEĞİŞTİRİLMEZ;
     telefonlar normalize edilmez (+90, 0, boşluk, tire aynen kalır). Öğretmen/sınıf kayıtlarına dokunulmaz. */
  if (Array.isArray(d.ogrenciler)) d.ogrenciler.forEach(function (o) {
    if (!o || typeof o !== "object") return;
    if (o.tel == null) o.tel = "";
    if (o.anneTel == null) o.anneTel = "";
    if (o.babaTel == null) o.babaTel = "";
  });
  if (typeof kadroDuzelt === "function") kadroDuzelt(d);`);

/* ---------- 2) CSV v3: şema sabiti ---------- */
yamaAdim("v3-schema-const",
  `var CSV_SCHEMA_KADRO = "yks-csv-v2"; /* KADRO-KOLON-YAMASI: yalnızca dataset=kadro v2; diğer dataset'ler v1 kalır */`,
  `var CSV_SCHEMA_KADRO = "yks-csv-v2"; /* KADRO-KOLON-YAMASI: yalnızca dataset=kadro v2; diğer dataset'ler v1 kalır */
/* TELEFON3-YAMASI: v3 kadro header — telefon;anneTelefon;babaTelefon üst düzey kolonlar (sıra sabittir). Yalnız dataset=kadro. */
var CSV_SCHEMA_KADRO_V3 = "yks-csv-v3";
var CSV_BASLIK_KADRO_V3 = ["schema","dataset","donemId","tip","id","ad","soyad","telefon","anneTelefon","babaTelefon","brans","sinifId","sinifAd","ekAlanlarJson"];
/* v3 ekAlanlarJson'dan ÇIKARILAN anahtarlar — telefona üst düzey kolonlar authoritative; JSON'da tekrar etmez */
var TELEFON3_JSON_CIKAR = ["tel","anneTel","babaTel","anneTelefon","babaTelefon"];`);

/* ---------- 3) csvEkAlanlar: v3 export'ta telefon anahtarlarını çıkar ---------- */
yamaAdim("csvEkAlanlar-v3",
  `function csvEkAlanlar(kayit) {
  var ek = {};
  Object.keys(kayit || {}).forEach(function (k) {
    if (CSV_KORUMALI_ALANLAR.indexOf(k) !== -1) return;
    ek[k] = kayit[k];
  });
  return JSON.stringify(ek);
}`,
  `function csvEkAlanlar(kayit) {
  var ek = {};
  Object.keys(kayit || {}).forEach(function (k) {
    if (CSV_KORUMALI_ALANLAR.indexOf(k) !== -1) return;
    if (TELEFON3_JSON_CIKAR.indexOf(k) !== -1) return; /* TELEFON3-YAMASI: v3 export JSON'unda telefon alanları tekrar edilmez (diğer sürümlerde de zararsız — üst düzey kolonlar yoksa ekAlanJson tel v1 fallback'i çalışır) */
    ek[k] = kayit[k];
  });
  return JSON.stringify(ek);
}`);

/* ---------- 4) kadroTelOf: anne/baba yardımcıları + v3 satır üretici ---------- */
yamaAdim("v3-satirlar",
  `/* v2 kadro satırları — KADRO-SIRALAMA-YAMASI emission sırası aynen korunur: ogretmen → sinif → ogrenci.
   Sinif satırlarında ad = sınıf adı; soyad ve telefon BOŞ. ekAlanlarJson tüm ek alanlarıyla korunur. */`,
  `/* TELEFON3-YAMASI: anne/baba telefon okuma yardımcıları — string, normalize YOK */
function kadroAnneTelOf(kayit) { var t = kayit && kayit.anneTel; return t == null ? "" : String(t); }
function kadroBabaTelOf(kayit) { var t = kayit && kayit.babaTel; return t == null ? "" : String(t); }
/* v3 kadro satırları — emission sırası aynen: ogretmen → sinif → ogrenci.
   Öğretmen ve sınıf satırlarında telefon;anneTelefon;babaTelefon BOŞ. Öğrenci satırında
   telefon = o.tel, anneTelefon = o.anneTel, babaTelefon = o.babaTel (string, kayıpsız). */
function kadroV3Satirlari() {
  var satirlar = [];
  DB.ogretmenler.forEach(function (t) {
    var a = kadroAdSoyadAyir(t.ad);
    satirlar.push([CSV_SCHEMA_KADRO_V3,"kadro","","ogretmen", t.id || "", a.ad, a.soyad, "", "", "", t.brans || "", "", "", csvEkAlanlar(t)]);
  });
  Object.keys(DB.sinifIds || {}).forEach(function (ad) {
    satirlar.push([CSV_SCHEMA_KADRO_V3,"kadro","","sinif", DB.sinifIds[ad] || "", ad, "", "", "", "", "", "", ad, "{}"]);
  });
  DB.ogrenciler.forEach(function (o) {
    var a = kadroAdSoyadAyir(o.ad);
    satirlar.push([CSV_SCHEMA_KADRO_V3,"kadro","","ogrenci", o.id || "", a.ad, a.soyad, kadroTelOf(o), kadroAnneTelOf(o), kadroBabaTelOf(o), "", sinifId(o.sinif) || "", o.sinif || "", csvEkAlanlar(o)]);
  });
  return satirlar;
}
/* v2 kadro satırları — KADRO-SIRALAMA-YAMASI emission sırası aynen korunur: ogretmen → sinif → ogrenci.
   Sinif satırlarında ad = sınıf adı; soyad ve telefon BOŞ. ekAlanlarJson tüm ek alanlarıyla korunur. */`);

/* ---------- 5) kadroIndir: v3 kullan ---------- */
yamaAdim("kadro-indir-v3",
  `function csvKadroIndir() {
  /* KADRO-KOLON-YAMASI: dışa aktarma v2 (ad;soyad;telefon üst düzey) — v1 içe aktarma KORUNUR */
  csvIndir("yks-kadro-global.csv", CSV_BASLIK_KADRO_V2, kadroV2Satirlari());
  toast("Kadro CSV indirildi ✓ (v2 — tüm öğrenci/öğretmen/sınıf — dönem filtresi yok)");
}`,
  `function csvKadroIndir() {
  /* TELEFON3-YAMASI: dışa aktarma v3 (telefon;anneTelefon;babaTelefon) — v1/v2 içe aktarma KORUNUR */
  csvIndir("yks-kadro-global.csv", CSV_BASLIK_KADRO_V3, kadroV3Satirlari());
  toast("Kadro CSV indirildi ✓ (v3 — tüm öğrenci/öğretmen/sınıf — dönem filtresi yok)");
}`);

/* ---------- 6) csvCozDosya: v3 şemasını kabul et ---------- */
yamaAdim("cozdosya-v3",
  `  if (schema !== CSV_SCHEMA && schema !== CSV_SCHEMA_KADRO) return { dataset: dataset, schema: schema, baslik: [], veriler: [], hata: csvHata(dataset, 1, "schema", "Bilinmeyen schema: " + (schema || "(boş)")) };`,
  `  if (schema !== CSV_SCHEMA && schema !== CSV_SCHEMA_KADRO && schema !== CSV_SCHEMA_KADRO_V3) return { dataset: dataset, schema: schema, baslik: [], veriler: [], hata: csvHata(dosyaAdi, 1, "schema", "Bilinmeyen schema: " + (schema || "(boş)")) }; /* TELEFON3-YAMASI: v3 kabul */`);

/* ---------- 7) csvImportUygula: v3 yalnız kadro ---------- */
yamaAdim("import-v3-sadece-kadro",
  `    if (c.schema === CSV_SCHEMA_KADRO && c.dataset !== "kadro") { hatalar.push(csvHata(d.ad, 1, "schema", "yks-csv-v2 yalnızca dataset=kadro için kullanılabilir")); return; }`,
  `    if ((c.schema === CSV_SCHEMA_KADRO || c.schema === CSV_SCHEMA_KADRO_V3) && c.dataset !== "kadro") { hatalar.push(csvHata(d.ad, 1, "schema", "yks-csv-v2/v3 yalnızca dataset=kadro için kullanılabilir")); return; } /* TELEFON3-YAMASI */`);

/* ---------- 8) öğrenci upsert: v3 telefon/anne/baba authoritative ---------- */
yamaAdim("import-ogr-guncelle",
  `          csvEkAlanUygula(mevcut, v.ekAlanlarJson);
          if (v2) mevcut.tel = String(v.telefon == null ? "" : v.telefon); /* v2: üst düzey telefon AUTHORITATIVE */
          guncellenen++;`,
  `          csvEkAlanUygula(mevcut, v.ekAlanlarJson);
          if (v2) mevcut.tel = String(v.telefon == null ? "" : v.telefon); /* v2: üst düzey telefon AUTHORITATIVE */
          /* TELEFON3-YAMASI: v3 — telefon;anneTelefon;babaTelefon AUTHORITATIVE (boş kolon → bilinçli ""); v1/v2 anne/baba KORUNUR */
          if (v3) {
            mevcut.tel = String(v.telefon == null ? "" : v.telefon);
            mevcut.anneTel = String(v.anneTelefon == null ? "" : v.anneTelefon);
            mevcut.babaTel = String(v.babaTelefon == null ? "" : v.babaTelefon);
          }
          guncellenen++;`);

yamaAdim("import-ogr-yeni",
  `          kopya.ogrenciler.push({ id: id, ad: kadroAdBirlesik(v), sinif: v.sinifAd || "", tel: v2 ? String(v.telefon == null ? "" : v.telefon) : "" });
          csvEkAlanUygula(kopya.ogrenciler[kopya.ogrenciler.length - 1], v.ekAlanlarJson);
          if (v2) kopya.ogrenciler[kopya.ogrenciler.length - 1].tel = String(v.telefon == null ? "" : v.telefon); /* v2 authoritative */
          eklenen++;`,
  `          kopya.ogrenciler.push({ id: id, ad: kadroAdBirlesik(v), sinif: v.sinifAd || "", tel: v2 ? String(v.telefon == null ? "" : v.telefon) : "" });
          csvEkAlanUygula(kopya.ogrenciler[kopya.ogrenciler.length - 1], v.ekAlanlarJson);
          if (v2) kopya.ogrenciler[kopya.ogrenciler.length - 1].tel = String(v.telefon == null ? "" : v.telefon); /* v2 authoritative */
          /* TELEFON3-YAMASI: v3 — üç telefon alanı üst düzey kolonlardan; v1/v2'de anne/baba "" başlar */
          if (v3) {
            kopya.ogrenciler[kopya.ogrenciler.length - 1].tel = String(v.telefon == null ? "" : v.telefon);
            kopya.ogrenciler[kopya.ogrenciler.length - 1].anneTel = String(v.anneTelefon == null ? "" : v.anneTelefon);
            kopya.ogrenciler[kopya.ogrenciler.length - 1].babaTel = String(v.babaTelefon == null ? "" : v.babaTelefon);
          } else {
            kopya.ogrenciler[kopya.ogrenciler.length - 1].anneTel = "";
            kopya.ogrenciler[kopya.ogrenciler.length - 1].babaTel = "";
          }
          eklenen++;`);

/* v2/v3 bayrağı: var v2 satırının hemen altına v3 tanımı */
yamaAdim("import-v3-bayragi",
  `    var v2 = c.schema === CSV_SCHEMA_KADRO;`,
  `    var v2 = c.schema === CSV_SCHEMA_KADRO;
    var v3 = c.schema === CSV_SCHEMA_KADRO_V3; /* TELEFON3-YAMASI */`);

/* ---------- 9) form: düzenleme formu (duzForm) — 3 kolonlu telefon bölümü ---------- */
yamaAdim("duzform-tel",
  `        '<input id="d-tel" value="' + esc(duzO.tel || "") + '" placeholder="Telefon" inputmode="tel" class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400/40" />' +
        '<div class="flex gap-2">' +`,
  `        /* TELEFON3-YAMASI: 3 telefon alanı — mobilde alt alta, geniş ekranda 3 kolon */
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">' +
          '<div><label class="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Öğrenci Telefonu</label>' +
          '<input id="d-tel" type="tel" inputmode="tel" value="' + esc(duzO.tel || "") + '" placeholder="Öğrenci telefonu" class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400/40" /></div>' +
          '<div><label class="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Anne Telefonu</label>' +
          '<input id="d-anne-tel" type="tel" inputmode="tel" value="' + esc(duzO.anneTel || "") + '" placeholder="Anne telefonu" class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400/40" /></div>' +
          '<div><label class="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Baba Telefonu</label>' +
          '<input id="d-baba-tel" type="tel" inputmode="tel" value="' + esc(duzO.babaTel || "") + '" placeholder="Baba telefonu" class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400/40" /></div>' +
        '</div>' +
        '<div class="flex gap-2">' +`);

/* ---------- 10) form: yeni öğrenci formu (o-tel) — aynı telefonlar bölümü ---------- */
yamaAdim("yeni-form-tel",
  `        '<input id="o-tel" placeholder="Telefon (WhatsApp için, isteğe bağlı)" inputmode="tel" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />' +
        '<button onclick="ogrenciEkle()"`,
  `        /* TELEFON3-YAMASI: aynı telefonlar bölümü — 3 alan */
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">' +
          '<div><label class="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Öğrenci Telefonu</label>' +
          '<input id="o-tel" type="tel" inputmode="tel" placeholder="Öğrenci telefonu" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" /></div>' +
          '<div><label class="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Anne Telefonu</label>' +
          '<input id="o-anne-tel" type="tel" inputmode="tel" placeholder="Anne telefonu" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" /></div>' +
          '<div><label class="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Baba Telefonu</label>' +
          '<input id="o-baba-tel" type="tel" inputmode="tel" placeholder="Baba telefonu" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" /></div>' +
        '</div>' +
        '<button onclick="ogrenciEkle()"`);

/* ---------- 11) ogrenciEkle: yeni alanları kaydet ---------- */
yamaAdim("ogrenciEkle",
  `  var tel = $("o-tel").value.trim();
  if (!ad) { toast("Öğrenci adı boş olamaz.", "hata"); return; }
  var varMi = DB.ogrenciler.some(function (o) { return kucuk(o.ad) === kucuk(ad); });
  if (varMi) { toast("Bu öğrenci zaten kayıtlı.", "uyari"); return; }
  var yeni = { id: uid(), ad: ad, sinif: sinif, tel: tel };`,
  `  var tel = $("o-tel").value.trim();
  /* TELEFON3-YAMASI: anne/baba telefonları da kaydedilir (normalize YOK, aynen) */
  var anneTel = $("o-anne-tel") ? $("o-anne-tel").value.trim() : "";
  var babaTel = $("o-baba-tel") ? $("o-baba-tel").value.trim() : "";
  if (!ad) { toast("Öğrenci adı boş olamaz.", "hata"); return; }
  var varMi = DB.ogrenciler.some(function (o) { return kucuk(o.ad) === kucuk(ad); });
  if (varMi) { toast("Bu öğrenci zaten kayıtlı.", "uyari"); return; }
  var yeni = { id: uid(), ad: ad, sinif: sinif, tel: tel, anneTel: anneTel, babaTel: babaTel };`);
yamaAdim("ogrenciEkle-temizle",
  `  $("o-tel").value = "";
  renderYonetim(); renderFormDestek();`,
  `  $("o-tel").value = "";
  if ($("o-anne-tel")) $("o-anne-tel").value = ""; /* TELEFON3-YAMASI */
  if ($("o-baba-tel")) $("o-baba-tel").value = "";
  renderYonetim(); renderFormDestek();`);

/* ---------- 12) ogrenciGuncelle: yeni alanları güncelle ---------- */
yamaAdim("ogrenciGuncelle",
  `  var tel = $("d-tel").value.trim();
  if (!ad) { toast("Öğrenci adı boş olamaz.", "hata"); return; }
  var cakisiyor = DB.ogrenciler.some(function(o){ return o.id !== id && kucuk(o.ad) === kucuk(ad); });
  if (cakisiyor) { toast("Bu isimde başka bir öğrenci zaten var.", "hata"); return; }
  var eskiAd = mevcut.ad;
  mevcut.ad = ad;
  mevcut.sinif = sinif;
  mevcut.tel = tel;`,
  `  var tel = $("d-tel").value.trim();
  /* TELEFON3-YAMASI: anne/baba telefonları güncelleme akışında korunur/girilir */
  var anneTel = $("d-anne-tel") ? $("d-anne-tel").value.trim() : (mevcut.anneTel || "");
  var babaTel = $("d-baba-tel") ? $("d-baba-tel").value.trim() : (mevcut.babaTel || "");
  if (!ad) { toast("Öğrenci adı boş olamaz.", "hata"); return; }
  var cakisiyor = DB.ogrenciler.some(function(o){ return o.id !== id && kucuk(o.ad) === kucuk(ad); });
  if (cakisiyor) { toast("Bu isimde başka bir öğrenci zaten var.", "hata"); return; }
  var eskiAd = mevcut.ad;
  mevcut.ad = ad;
  mevcut.sinif = sinif;
  mevcut.tel = tel;
  mevcut.anneTel = anneTel;
  mevcut.babaTel = babaTel;`);

/* ---------- Assert'ler ---------- */
if ((yeni.match(/TELEFON3-YAMASI/g) || []).length < 10) { console.error("FAIL-CLOSED: yama işaretleri eksik."); process.exit(1); }
for (const s of ['id="d-tel"', 'id="d-anne-tel"', 'id="d-baba-tel"', 'id="o-tel"', 'id="o-anne-tel"', 'id="o-baba-tel"']) {
  const n = (yeni.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (n !== 1) { console.error(`FAIL-CLOSED: ${s} ${n} kez (beklenen 1) — duplicate id.`); process.exit(1); }
}
/* bölge dışı bütünlük: yamalı dosya, tüm yamalar geri alınıp eskiyle karşılaştırılamaz (replace'ler bölgesel);
   bunun yerine kritik korunan sembollerin hâlâ mevcudiyeti denetlenir */
for (const k of ["function waGonder(", "function waUrl(", "function waSatir(", "function waKopyalaMesaj(", "function waOnizle(", "function csvImportUygula(", "function csvDosya(", "function csvParse(", "function normalize(", "function ogrenciEkle(", "function ogrenciGuncelle(", "yksOto_arsiv_v1"]) {
  if (!yeni.includes(k)) { console.error("FAIL-CLOSED: korunan sembol kayboldu: " + k); process.exit(1); }
}
if (!yeni.includes("anneTel") || !yeni.includes("babaTel") || !yeni.includes("anneTelefon") || !yeni.includes("babaTelefon")) { console.error("FAIL-CLOSED: v3 alanları yok."); process.exit(1); }

/* Yedek: üzerine YAZILMAZ */
const bak = "app.js.telefon3-oncesi.bak";
if (existsSync(bak)) {
  const eskiBak = readFileSync(bak, "utf8");
  if (sha(eskiBak) !== onceSha) { console.error("FAIL-CLOSED: yedek var ama mevcut app.js ile uyuşmuyor — üzerine yazılmaz."); process.exit(1); }
  console.log("Yedek zaten var ve birebir uyuşuyor: " + bak + " (SHA-256 " + sha(eskiBak) + ")");
} else {
  copyFileSync(F, bak);
  console.log("Yedek alındı: " + bak + " (SHA-256 " + onceSha + ")");
}

writeFileSync(F, yeni);
console.log("Yama uygulandı. app.js: " + onceSha + " → " + sha(yeni));
console.log("app.js boyut (bayt): " + statSync(bak).size + " → " + statSync(F).size);
