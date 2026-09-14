/* ks-yama-excel-csv.mjs — EXCEL-CSV-YAMASI: Excel uyumlu CSV dışa/içe aktarma dilimi
   TEK İŞ: aktif döneme göre CSV dışa/içe aktarma (kadro global + ders/istek aktif dönem).
   - Değişen: yalnızca app.js (bölgesel ekleme, baştan yazma YOK) + test.mjs (yeni süit kaydı).
   - index.html, ek-ders.js, vendor/* DOKUNULMAZ (hash doğrulaması yazma öncesi yapılır).
   - İdempotent: 2. koşu "Zaten uygulanmış" (exit 2), dosyalara DOKUNMAZ.
   - Backup: app.js.excel-csv-oncesi.bak (geri dönüş).
   - Teknik karar: SheetJS YOK — UTF-8 BOM + noktalı virgül (;) + CRLF Excel uyumlu CSV.
     Sandbox çevrimdışı çalışır; küçük parser/serializer uygulama içi ve test edilebilir kalır.
*/
import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };
const assert = (c, m) => { if (!c) fail(m); else console.log("  OK " + m); };
const say = (hay, need) => hay.split(need).length - 1;
const sha = (s) => createHash("sha256").update(s).digest("hex");

/* ================= Başlangıç hash'leri (yazma öncesi doğrulama) ================= */
const HTML_BEFORE = readFileSync("index.html", "utf8");
const EKDERS_BEFORE = readFileSync("ek-ders.js", "utf8");
const VENDOR_BEFORE = ["chart.js", "fontawesome.css", "fonts.css", "html2canvas.js", "tailwind.js"]
  .map((f) => f + ":" + sha(readFileSync("vendor/" + f)));

/* ================= app.js ================= */
const F = "app.js";
const src0 = readFileSync(F, "utf8");

/* --- idempotans: zaten uygulanmışsa çık (exit 2), dosyalara DOKUNMA --- */
if (src0.includes("EXCEL-CSV-YAMASI")) {
  console.error("Zaten uygulanmış (EXCEL-CSV-YAMASI mevcut) — dosyalar değiştirilmedi.");
  process.exit(2);
}

/* --- Beklenen mevcut durum (exact anchor'lar, tek geçişli hedefler) --- */
assert(say(src0, "function aktifDonemKayitlari(") === 1, "app.js: aktifDonemKayitlari tam 1 kez");
assert(say(src0, "function aktifDonemId()") === 1, "app.js: aktifDonemId() tam 1 kez");
assert(say(src0, "function kimlikUret(") === 1, "app.js: kimlikUret tam 1 kez");
assert(say(src0, "function kimlikleriTamamla(") === 1, "app.js: kimlikleriTamamla tam 1 kez");
assert(say(src0, "function kadroSnfId(") === 1, "app.js: kadroSnfId (deterministik sınıf helper) tam 1 kez");
assert(say(src0, "function sinifId(") === 1, "app.js: sinifId okuma helper tam 1 kez");
assert(say(src0, "function saveDB()") === 1, "app.js: saveDB tam 1 kez");
assert(say(src0, "function yenile()") === 1, "app.js: yenile tam 1 kez");
assert(say(src0, "function istekOgrenciIds(") === 1, "app.js: istekOgrenciIds tam 1 kez");
assert(say(src0, "function dersOgrenciIds(") === 1, "app.js: dersOgrenciIds tam 1 kez");
assert(say(src0, "function yedekAl()") === 1, "app.js: yedekAl tam 1 kez (dışa aktarma block'u ona eklenir)");
assert(say(src0, "EXCEL-CSV") === 0, "app.js: yama henüz YOK (temiz başlangıç)");

/* --- Backup (yamadan önceki hâl) --- */
const bakPath = "app.js.excel-csv-oncesi.bak";
if (!existsSync(bakPath)) writeFileSync(bakPath, src0);

/* ================= Eklenen kod bloğu ================= */
const BLOCK = `
/* ================================================================
   EXCEL-CSV-YAMASI: Excel uyumlu CSV dışa/içe aktarma (aktif dönem)
   - Teknik karar: SheetJS/dış kütüphane YOK. Sandbox çevrimdışı çalışır;
     UTF-8 BOM + noktalı virgül (;) ayraç + CRLF satır sonu → Türkçe Excel'de
     doğrudan açılır. Serializer/parser küçük ve test edilebilir.
   - Dışa: kadro (GLOBAL, dönem filtresi YOK), dersler-<aktifDonemId> ve
     istekler-<aktifDonemId> (yalnız aktifDonemKayitlari() sonucu —
     başka dönem ASLA girmez).
   - İçe: multi-file atomik upsert; ID-birincil eşleştirme; ada göre
     öğrenci/öğretmen birleştirme YOK; referans/dönem doğrulama satır bazlı;
     hata durumunda DB/localStorage değişmez; başarılı işlem tek saveDB + yenile;
     "Son İçe Aktarmayı Geri Al" oturum-içi snapshot ile tersine çevirir.
   - Bu katman sinifProg/sinifProgDonemler, dönemi damgalama (DONEM-DAMGA),
     dönem seçici (DONEM-SECICI), yedek formatı ve mevcut analiz mantığına DOKUNMAZ.
   ================================================================ */
var CSV_SCHEMA = "yks-csv-v1";
var CSV_SEP = ";";
var CSV_EOL = "\\r\\n";
var EXCEL_CSV_SNAPSHOT = null; /* son BAŞARILI içe aktarma öncesi DB snapshot (oturum içi) */

/* ---- CSV serializer: quote-aware, UTF-8 BOM + ; + CRLF ---- */
function csvHucre(v) {
  var s = (v == null) ? "" : String(v);
  if (s.indexOf('"') !== -1 || s.indexOf(CSV_SEP) !== -1 || s.indexOf("\\n") !== -1 || s.indexOf("\\r") !== -1) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
function csvSatir(alanlar) { return alanlar.map(csvHucre).join(CSV_SEP); }
function csvDosya(basliklar, satirlar) {
  var out = "\\uFEFF"; /* UTF-8 BOM — Excel TR için şart */
  out += csvSatir(basliklar) + CSV_EOL;
  satirlar.forEach(function (r) { out += csvSatir(r) + CSV_EOL; });
  return out;
}
/* ---- CSV parser: BOM kaldırır, quoted alanları ve çok satırlı alanları okur ---- */
function csvParse(metin) {
  var s = String(metin || "");
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  var satirlar = [], alan = "", satir = [], i = 0, icindeTirnak = false, c, n;
  for (i = 0; i < s.length; i++) {
    c = s[i];
    if (icindeTirnak) {
      if (c === '"') {
        n = s[i + 1];
        if (n === '"') { alan += '"'; i++; }
        else icindeTirnak = false;
      } else alan += c;
    } else if (c === '"') {
      icindeTirnak = true;
    } else if (c === CSV_SEP) {
      satir.push(alan); alan = "";
    } else if (c === "\\r") {
      if (s[i + 1] === "\\n") i++;
      satir.push(alan); alan = ""; satirlar.push(satir); satir = [];
    } else if (c === "\\n") {
      satir.push(alan); alan = ""; satirlar.push(satir); satir = [];
    } else alan += c;
  }
  /* Dosya sonu: son alan/satır boşsa ekleme yapılmaz (trailing EOL güvenli) */
  if (alan !== "" || satir.length) { satir.push(alan); satirlar.push(satir); }
  return satirlar;
}

/* ---- CSV kolon şemaları (sabit ve tam) ---- */
var CSV_BASLIK_KADRO = ["schema","dataset","donemId","tip","id","ad","brans","sinifId","sinifAd","ekAlanlarJson"];
var CSV_BASLIK_DERS  = ["schema","dataset","donemId","tip","id","ogrenciId","ogrenciIds","ogrenciAd","ogretmenId","ogretmenAd","dersId","dersAd","konu","tarih","saat","kod","sinif","durum","ekAlanlarJson"];
var CSV_BASLIK_ISTEK = ["schema","dataset","donemId","tip","id","ogrenciId","ogrenciIds","ogrenciAd","ogretmenId","ogretmenAd","dersId","dersAd","konu","tarih","saat","kod","sinif","durum","olusturma","ekAlanlarJson"];
/* ekAlanlarJson içinde KORUNAMAYAN (korumalı) alanlar — geri yüklenmez */
var CSV_KORUMALI_ALANLAR = ["id","donemId","ogrenciId","ogrenciIds","ogretmenId","dersId","sinif","tip"];

function csvEkAlanlar(kayit) {
  var ek = {};
  Object.keys(kayit || {}).forEach(function (k) {
    if (CSV_KORUMALI_ALANLAR.indexOf(k) !== -1) return;
    ek[k] = kayit[k];
  });
  return JSON.stringify(ek);
}
function csvEkAlanUygula(hedef, ekJson) {
  if (!ekJson) return;
  var ek;
  try { ek = JSON.parse(ekJson); } catch (e) { return; } /* bozuk JSON sessizce yoksayılır */
  if (!ek || typeof ek !== "object") return;
  Object.keys(ek).forEach(function (k) {
    if (CSV_KORUMALI_ALANLAR.indexOf(k) !== -1) return; /* korumalı alanlar uygulanmaz */
    if (ek[k] !== undefined) hedef[k] = ek[k];
  });
}
function csvDersAd(dersId) {
  var D = (typeof DERS === "object" && DERS && DERS[dersId]) ? DERS[dersId] : null;
  return D ? D.ad : "";
}

/* ---- DIŞA AKTARMA ---- */
function csvKadroSatirlari() {
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
}
function csvKayitSatiri(kayit, dataset) {
  var baslik = dataset === "istekler" ? CSV_BASLIK_ISTEK : CSV_BASLIK_DERS;
  var m = {
    schema: CSV_SCHEMA, dataset: dataset, donemId: kayit.donemId || "", tip: dataset === "istekler" ? "istek" : "ders",
    id: kayit.id || "",
    ogrenciId: kayit.ogrenciId || "",
    ogrenciIds: (Array.isArray(kayit.ogrenciIds) ? kayit.ogrenciIds : []).join("|"), /* "|" birleşik ek öğrenci ID'leri */
    ogrenciAd: kayit.ogrenciAd || "",
    ogretmenId: kayit.ogretmenId || "",
    ogretmenAd: kayit.ogretmenAd || "",
    dersId: kayit.dersId || "",
    dersAd: csvDersAd(kayit.dersId),
    konu: kayit.konu || "",
    tarih: kayit.tarih || "",
    saat: kayit.saat || "",
    kod: kayit.kod || "",
    sinif: kayit.sinif || "",
    durum: kayit.durum || "",
    olusturma: kayit.olusturma || ""
  };
  return baslik.map(function (k) {
    if (k === "ekAlanlarJson") return csvEkAlanlar(kayit);
    return m[k] != null ? m[k] : "";
  });
}
function csvAktifDonemKayitSatirlari(dataset) {
  var kaynak = dataset === "istekler" ? DB.istekler : DB.dersler;
  return aktifDonemKayitlari(kaynak).map(function (k) { return csvKayitSatiri(k, dataset); });
}
function csvIndir(dosyaAd, basliklar, satirlar) {
  var blob = new Blob([csvDosya(basliklar, satirlar)], { type: "text/csv;charset=utf-8" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = dosyaAd;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}
function csvKadroIndir() {
  csvIndir("yks-kadro-global.csv", CSV_BASLIK_KADRO, csvKadroSatirlari());
  toast("Kadro CSV indirildi ✓ (tüm öğrenci/öğretmen/sınıf — dönem filtresi yok)");
}
function csvDersIndir() {
  var id = aktifDonemId();
  csvIndir("yks-dersler-" + id + ".csv", CSV_BASLIK_DERS, csvAktifDonemKayitSatirlari("dersler"));
  toast("Aktif dönem ders CSV indirildi ✓ (" + id + ")");
}
function csvIstekIndir() {
  var id = aktifDonemId();
  csvIndir("yks-istekler-" + id + ".csv", CSV_BASLIK_ISTEK, csvAktifDonemKayitSatirlari("istekler"));
  toast("Aktif dönem istek CSV indirildi ✓ (" + id + ")");
}
function csvTumunuIndir() {
  csvKadroIndir(); csvDersIndir(); csvIstekIndir();
  toast("3 CSV indirildi ✓ — tarayıcı engellerse ayrı butonları kullanın.", "uyari");
}

/* ---- İÇE AKTARMA (atomik upsert) ----
   1) Tüm dosyaları parse et → 2) tüm satırları doğrula → 3) DB kopyası üzerinde uygula →
   4) her şey başarılıysa DB=copy + TEK saveDB + yenile; aksi hâlde hiçbir şey yazılmaz. */
function csvHata(dataset, satir, kolon, sebep) {
  return { dataset: dataset, satir: satir, kolon: kolon, sebep: sebep };
}
function csvCozDosya(metin, dosyaAdi) {
  var satirlar = csvParse(metin);
  if (!satirlar.length) return { dataset: "", schema: "", baslik: [], veriler: [], hata: csvHata(dosyaAdi, 1, "dosya", "Dosya boş") };
  var baslik = satirlar[0];
  var schema = "", dataset = "";
  /* schema + dataset İÇERİKTEN okunur (dosya adına güvenilmez); schema kolonu yoksa ilk satır veri gibi değerlendirilir */
  if (baslik[0] === "schema" && baslik[1] === "dataset") {
    schema = satirlar[1] ? satirlar[1][0] : "";
    dataset = satirlar[1] ? satirlar[1][1] : "";
    satirlar = satirlar.slice(1);
  } else if (baslik.indexOf("schema") !== -1 && baslik.indexOf("dataset") !== -1) {
    var si = baslik.indexOf("schema"), di = baslik.indexOf("dataset");
    var ilk = satirlar[1] || [];
    schema = ilk[si] || ""; dataset = ilk[di] || "";
  } else {
    return { dataset: "", schema: "", baslik: [], veriler: [], hata: csvHata(dosyaAdi, 1, "başlık", "schema/dataset başlıkları yok") };
  }
  if (schema !== CSV_SCHEMA) return { dataset: dataset, schema: schema, baslik: [], veriler: [], hata: csvHata(dataset, 1, "schema", "Bilinmeyen schema: " + (schema || "(boş)")) };
  var veriler = satirlar.map(function (r) {
    var o = {};
    baslik.forEach(function (k, i) { o[k] = r[i] != null ? r[i] : ""; });
    return o;
  });
  return { dataset: dataset, schema: schema, baslik: baslik, veriler: veriler };
}
function csvIdVarmi(db, id) {
  if (!id) return "";
  if (db.ogrenciler.some(function (x) { return x.id === id; })) return "ogrenci";
  if (db.ogretmenler.some(function (x) { return x.id === id; })) return "ogretmen";
  return "";
}
function csvImportUygula(dosyalar) {
  /* dosyalar: [{ad, metin}] — hepsi birlikte doğrulanır; tek işlem uygulanır */
  var hatalar = [], cozulen = [];
  dosyalar.forEach(function (d) {
    var c = csvCozDosya(d.metin, d.ad);
    if (c.hata) { hatalar.push(c.hata); return; }
    if (["kadro", "dersler", "istekler"].indexOf(c.dataset) === -1) { hatalar.push(csvHata(d.ad, 1, "dataset", "Bilinmeyen dataset: " + c.dataset)); return; }
    cozulen.push(c);
  });
  if (hatalar.length) return { ok: false, hatalar: hatalar };

  /* Kural: kadro dosyası önce uygulanmış gibi doğrulanır */
  var siralama = cozulen.slice().sort(function (a, b) {
    var r = { kadro: 0, dersler: 1, istekler: 2 };
    return r[a.dataset] - r[b.dataset];
  });
  var kadroVar = cozulen.some(function (c) { return c.dataset === "kadro"; });
  var dersVar = cozulen.some(function (c) { return c.dataset === "dersler"; });
  var istekVar = cozulen.some(function (c) { return c.dataset === "istekler"; });
  if (dersVar && !kadroVar) { /* referans kontrolü mevcut kadroyla da yapılabilir; kadro opsiyonel */
    kadroVar = false;
  }

  /* Derin kopya üzerinde çalış */
  var kopya = JSON.parse(JSON.stringify(DB));
  var uretilen = 0, guncellenen = 0, eklenen = 0;
  var hedefDonem = aktifDonemId();

  /* ---- 1) KADRO (önce) ---- */
  cozulen.filter(function (c) { return c.dataset === "kadro"; }).forEach(function (c) {
    var goren = {}; /* aynı dosya içinde yinelenen ID kontrolü */
    c.veriler.forEach(function (v, idx) {
      var sn = idx + 2; /* 1 = başlık */
      var tip = v.tip, id = (v.id || "").trim();
      if (["ogrenci", "ogretmen", "sinif"].indexOf(tip) === -1) { hatalar.push(csvHata("kadro", sn, "tip", "Bilinmeyen tip: " + tip)); return; }
      if (tip === "sinif" && !id && (v.ad || v.sinifAd || "").trim()) {
        /* Kural: boş sınıf ID'si → ada göre mevcut sınıfa bağlan; yoksa kadroSnfId ile üret */
        var _snfAd = (v.ad || v.sinifAd || "").trim();
        var _snfMevcut = kopya.sinifIds[_snfAd];
        id = (_snfMevcut != null && _snfMevcut !== "") ? _snfMevcut : (typeof kadroSnfId === "function" ? kadroSnfId(_snfAd) : ("ks-snf-" + _snfAd));
      } else if (!id) { hatalar.push(csvHata("kadro", sn, "id", "ID boş")); return; }
      var donem = (v.donemId || "").trim();
      if (donem && donem !== hedefDonem && tip !== "sinif") { hatalar.push(csvHata("kadro", sn, "donemId", "Kadro satırı farklı dönem ID'si taşıyor")); return; }
      if (tip === "ogrenci") {
        if (goren[id]) { hatalar.push(csvHata("kadro", sn, "id", "Yinelenen ID: " + id)); return; }
        goren[id] = 1;
        var mevcut = kopya.ogrenciler.find(function (x) { return x.id === id; });
        if (mevcut) {
          var eskiO = Object.assign({}, mevcut);
          mevcut.ad = v.ad; mevcut.sinif = v.sinifAd || mevcut.sinif;
          csvEkAlanUygula(mevcut, v.ekAlanlarJson);
          guncellenen++;
        } else {
          kopya.ogrenciler.push({ id: id, ad: v.ad, sinif: v.sinifAd || "", tel: "" });
          csvEkAlanUygula(kopya.ogrenciler[kopya.ogrenciler.length - 1], v.ekAlanlarJson);
          eklenen++;
        }
      } else if (tip === "ogretmen") {
        if (goren[id]) { hatalar.push(csvHata("kadro", sn, "id", "Yinelenen ID: " + id)); return; }
        goren[id] = 1;
        var mevcutT = kopya.ogretmenler.find(function (x) { return x.id === id; });
        if (mevcutT) {
          mevcutT.ad = v.ad; mevcutT.brans = v.brans || mevcutT.brans;
          csvEkAlanUygula(mevcutT, v.ekAlanlarJson);
          guncellenen++;
        } else {
          kopya.ogretmenler.push({ id: id, ad: v.ad, brans: v.brans || "", avail: { sinif: {}, musait: [] } });
          csvEkAlanUygula(kopya.ogretmenler[kopya.ogretmenler.length - 1], v.ekAlanlarJson);
          eklenen++;
        }
      } else { /* sinif */
        var ad = v.ad || v.sinifAd || "";
        if (!ad) { hatalar.push(csvHata("kadro", sn, "ad", "Sınıf adı boş")); return; }
        var mevcutS = kopya.sinifIds[ad];
        if (mevcutS == null || mevcutS === "") {
          kopya.sinifIds[ad] = id || (typeof kadroSnfId === "function" ? kadroSnfId(ad) : ("ks-snf-" + ad));
          if (!kopya.sinifProg[ad]) kopya.sinifProg[ad] = [];
          eklenen++;
        } else guncellenen++;
      }
    });
  });
  /* Kadro upsERT sonrası ID seti (referans doğrulaması bu set üzerinden) */
  var ogrSet = {}, ortSet = {};
  kopya.ogrenciler.forEach(function (o) { if (o.id) ogrSet[o.id] = 1; });
  kopya.ogretmenler.forEach(function (t) { if (t.id) ortSet[t.id] = 1; });

  /* ---- 2) DERSLER / ISTEKLER (aktif dönem zorunlu) ---- */
  cozulen.filter(function (c) { return c.dataset === "dersler" || c.dataset === "istekler"; }).forEach(function (c) {
    var isDers = c.dataset === "dersler";
    var hedefListe = isDers ? kopya.dersler : kopya.istekler;
    var goren = {};
    c.veriler.forEach(function (v, idx) {
      var sn = idx + 2;
      var id = (v.id || "").trim();
      /* donemId ZORUNLU ve aktif dönem — sessizce düzeltilmez */
      var dn = (v.donemId || "").trim();
      if (!dn) { hatalar.push(csvHata(c.dataset, sn, "donemId", "donemId boş (zorunlu)")); return; }
      if (dn !== hedefDonem) { hatalar.push(csvHata(c.dataset, sn, "donemId", "donemId aktif dönemle uyuşmuyor (" + dn + " ≠ " + hedefDonem + ")")); return; }
      if (goren[id]) { hatalar.push(csvHata(c.dataset, sn, "id", "Yinelenen ID: " + id)); return; }
      goren[id] = 1;
      /* Referans doğrulama: ada göre tahmin YOK; eksik referans → satır reddedilir */
      var ogrId = (v.ogrenciId || "").trim();
      if (!ogrId || !ogrSet[ogrId]) { hatalar.push(csvHata(c.dataset, sn, "ogrenciId", "Bilinmeyen öğrenci ID: " + (ogrId || "(boş)"))); return; }
      var ekIds = (v.ogrenciIds || "").split("|").map(function (s) { return s.trim(); }).filter(function (s) { return s; });
      for (var e = 0; e < ekIds.length; e++) if (!ogrSet[ekIds[e]]) { hatalar.push(csvHata(c.dataset, sn, "ogrenciIds", "Bilinmeyen öğrenci ID: " + ekIds[e])); return; }
      var ortId = (v.ogretmenId || "").trim();
      if (!ortId || !ortSet[ortId]) { hatalar.push(csvHata(c.dataset, sn, "ogretmenId", "Bilinmeyen öğretmen ID: " + (ortId || "(boş)"))); return; }
      var snf = (v.sinif || "").trim();
      if (snf && !(kopya.sinifIds && kopya.sinifIds[snf] != null)) { hatalar.push(csvHata(c.dataset, sn, "sinif", "Bilinmeyen sınıf: " + snf)); return; }
      /* dersId doğrulaması: DERS tanımı mevcutsa ve değer bilinmiyorsa satır reddedilir (sessiz değişim yok) */
      var dersK = (v.dersId || "").trim();
      if (typeof DERS === "object" && DERS && Object.keys(DERS).length && !DERS[dersK]) { hatalar.push(c.dataset === "dersler" ? csvHata(c.dataset, sn, "dersId", "Bilinmeyen ders tanımı: " + (dersK || "(boş)")) : csvHata(c.dataset, sn, "dersId", "Bilinmeyen ders tanımı: " + (dersK || "(boş)"))); return; }

      /* Upsert: mevcut kaydın donemId'si ASLA değiştirilmez; farklı dönem → satır reddedilir */
      var mevcutKayit = id ? hedefListe.find(function (x) { return x.id === id; }) : null;
      if (mevcutKayit) {
        if ((mevcutKayit.donemId || DONEM_ILK_ID) !== hedefDonem) {
          hatalar.push(csvHata(c.dataset, sn, "id", "Aynı ID başka döneme ait (donemId değiştirilemez)"));
          return;
        }
        mevcutKayit.ogrenciId = ogrId;
        if (ekIds.length) mevcutKayit.ogrenciIds = ekIds; else delete mevcutKayit.ogrenciIds;
        mevcutKayit.ogrenciAd = v.ogrenciAd || mevcutKayit.ogrenciAd;
        mevcutKayit.ogretmenId = ortId;
        mevcutKayit.ogretmenAd = v.ogretmenAd || mevcutKayit.ogretmenAd;
        mevcutKayit.dersId = dersK;
        mevcutKayit.dersAd = csvDersAd(dersK);
        mevcutKayit.konu = v.konu;
        mevcutKayit.durum = v.durum || mevcutKayit.durum;
        if (isDers) {
          mevcutKayit.tarih = v.tarih; mevcutKayit.saat = v.saat; mevcutKayit.kod = v.kod;
        } else {
          mevcutKayit.olusturma = v.olusturma || mevcutKayit.olusturma;
          if (v.tarih) mevcutKayit.tarih = v.tarih;
          if (v.saat) mevcutKayit.saat = v.saat;
        }
        csvEkAlanUygula(mevcutKayit, v.ekAlanlarJson);
        guncellenen++;
      } else {
        /* yeni kayıt: eksik ID üretimi mevcut helper'larla */
        if (!id) {
          id = kimlikUret(isDers ? "ders" : "ist", hedefListe.length);
          /* çakışma savunması (benzersiz() deseni) */
          var n2 = 2, aday = id;
          var cak = function (h) { return hedefListe.some(function (x) { return x.id === h; }); };
          while (cak(aday)) aday = id + "-" + (n2++);
          id = aday;
          uretilen++;
        }
        var yeni = { id: id, donemId: hedefDonem, ogrenciId: ogrId, ogrenciAd: v.ogrenciAd || "", ogretmenId: ortId, ogretmenAd: v.ogretmenAd || "", dersId: dersK, dersAd: csvDersAd(dersK), konu: v.konu, durum: v.durum || "bekliyor" };
        if (ekIds.length) yeni.ogrenciIds = ekIds;
        if (isDers) { yeni.tarih = v.tarih; yeni.saat = v.saat; yeni.kod = v.kod; yeni.olusturma = v.olusturma || todayKey(); }
        else { yeni.olusturma = v.olusturma || todayKey(); }
        csvEkAlanUygula(yeni, v.ekAlanlarJson);
        hedefListe.push(yeni);
        eklenen++;
      }
    });
  });

  if (hatalar.length) {
    return { ok: false, hatalar: hatalar, uretilen: 0 };
  }
  return { ok: true, kopya: kopya, eklenen: eklenen, guncellenen: guncellenen, uretilen: uretilen, kadroVar: kadroVar, dersVar: dersVar, istekVar: istekVar };
}
function csvDosyalarOku(input, cb) {
  var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
  input.value = "";
  if (!files.length) { toast("Dosya seçilmedi.", "uyari"); return; }
  var okunanlar = [], kalan = files.length;
  files.forEach(function (f) {
    var r = new FileReader();
    r.onload = function () {
      okunanlar.push({ ad: f.name || "dosya", metin: String(r.result || "") });
      kalan--;
      if (kalan === 0) cb(okunanlar);
    };
    r.onerror = function () { kalan--; if (kalan === 0) cb(okunanlar.length ? okunanlar : [{ ad: f.name || "dosya", metin: "", hata: true }]); };
    r.readAsText(f, "utf-8");
  });
}
function csvImportTetik(input) {
  csvDosyalarOku(input, function (dosyalar) {
    var sonuc = csvImportUygula(dosyalar);
    if (!sonuc.ok) {
      var mesaj = "İçe aktarma REDDEDİLDİ — hiçbir değişiklik yapılmadı.";
      if (sonuc.hatalar && sonuc.hatalar.length) {
        mesaj += " İlk hatalar: " + sonuc.hatalar.slice(0, 4).map(function (h) {
          return "[" + h.dataset + " satır " + h.satir + (h.kolon ? " · " + h.kolon : "") + "] " + h.sebep;
        }).join(" | ");
      }
      toast(mesaj, "hata");
      if ($("csvMesaj")) $("csvMesaj").innerHTML = '<span class="text-rose-600 font-bold">' + esc(mesaj) + "</span>";
      return; /* snapshot TEMİZLENMEZ — başarılı işlem olmadan geri al butonu çıkmaz */
    }
    /* Başarılı: snapshot'ı AL, DB'yi değiştir, TEK saveDB + yenile */
    EXCEL_CSV_SNAPSHOT = JSON.stringify(DB);
    DB = sonuc.kopya;
    saveDB();
    yenile();
    var ozet = "İçe aktarma tamamlandı ✓ — eklenen: " + sonuc.eklenen + ", güncellenen: " + sonuc.guncellenen + (sonuc.uretilen ? ", üretilen yeni ID: " + sonuc.uretilen : "");
    toast(ozet);
    if ($("csvMesaj")) $("csvMesaj").innerHTML = '<span class="text-teal-600 font-bold">' + esc(ozet) + "</span>";
    if ($("csvGeriBtn")) $("csvGeriBtn").classList.remove("hidden");
  });
}
function csvGeriAl() {
  if (!EXCEL_CSV_SNAPSHOT) { toast("Geri alınacak içe aktarma yok.", "uyari"); return; }
  DB = JSON.parse(EXCEL_CSV_SNAPSHOT);
  EXCEL_CSV_SNAPSHOT = null;
  saveDB();
  yenile();
  toast("Son içe aktarma geri alındı ✓");
  if ($("csvGeriBtn")) $("csvGeriBtn").classList.add("hidden");
}

/* ---- Yönetim arayüzü: Excel / CSV Veri Yönetimi kartı ---- */
function csvYonetimKartHTML() {
  return '<div class="rounded-2xl border border-teal-100 bg-teal-50/40 p-5 mt-4">' +
      '<div class="flex items-center gap-3 mb-1"><div class="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center text-[15px]"><i class="fa-solid fa-file-csv"></i></div>' +
      '<h4 class="text-[14px] font-bold text-slate-900">Excel / CSV Veri Yönetimi</h4></div>' +
      '<p class="text-[11.5px] text-slate-500 mt-1 leading-relaxed">Kadro dosyası <b>globaldir</b> (dönem filtresi yok); ders ve istek dosyaları <b>yalnızca aktif dönemi</b> içerir. CSV dosyaları UTF-8 BOM + noktalı virgül ile Excel\\'de doğrudan açılır. İçe aktarma atomiktir: herhangi bir hata varsa hiçbir veri değişmez.</p>' +
      '<div class="flex flex-wrap gap-2 mt-3">' +
        '<button onclick="csvTumunuIndir()" class="rounded-full bg-teal-500 hover:bg-teal-600 text-white text-[11.5px] font-bold px-3.5 py-2 shadow-sm transition-colors"><i class="fa-solid fa-download mr-1"></i>Tüm CSV\\'leri İndir</button>' +
        '<button onclick="csvKadroIndir()" class="rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11.5px] font-bold px-3.5 py-2 transition-colors"><i class="fa-solid fa-users mr-1"></i>Kadro CSV İndir</button>' +
        '<button onclick="csvDersIndir()" class="rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11.5px] font-bold px-3.5 py-2 transition-colors"><i class="fa-solid fa-calendar-days mr-1"></i>Aktif Dersleri CSV İndir</button>' +
        '<button onclick="csvIstekIndir()" class="rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11.5px] font-bold px-3.5 py-2 transition-colors"><i class="fa-solid fa-inbox mr-1"></i>Aktif İstekleri CSV İndir</button>' +
      "</div>" +
      '<div class="flex flex-wrap items-center gap-2 mt-3">' +
        '<input id="csvDosyaInput" type="file" accept=".csv,text/csv" multiple class="hidden" onchange="csvImportTetik(this)" />' +
        '<button onclick="document.getElementById(\\'csvDosyaInput\\').click()" class="rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 text-[11.5px] font-bold px-3.5 py-2 transition-colors"><i class="fa-solid fa-file-import mr-1"></i>CSV İçe Aktar</button>' +
        '<button id="csvGeriBtn" onclick="csvGeriAl()" class="hidden rounded-full border-2 border-rose-200 text-rose-500 hover:bg-rose-50 text-[11.5px] font-bold px-3.5 py-2 transition-colors"><i class="fa-solid fa-rotate-left mr-1"></i>Son İçe Aktarmayı Geri Al</button>' +
      "</div>" +
      '<div id="csvMesaj" class="text-[11.5px] text-slate-500 mt-2"></div>' +
    "</div>";
}
`;

/* ================= YAMA 1: kod bloğu — yedekAl()'ın HEMEN ÖNCESİNE ================= */
const A1 = "/* ---- Ayarlar & Yedekleme ---- */";
assert(say(src0, A1) === 1, "yama1 anchor: '/* ---- Ayarlar & Yedekleme ---- */' exact 1 kez");
let out = src0.replace(A1, BLOCK + "\n" + A1);

/* ================= YAMA 2: ayarTab() kart ekleyici — return sonuna kart ekle ================= */
/* ayarTab son div'i kapatır: `"</div></div>";` — güvenli, exact tek hedef */
const B1 = `      '<p class="text-[10.5px] text-slate-400 mt-3"><i class="fa-solid fa-shield-halved mr-1"></i>Sıfırlamadan önce mutlaka yedek alın.</p>' +
    "</div></div>";
}`;
assert(say(out, B1) === 1, "yama2 anchor: ayarTab kapanış bloğu exact 1 kez");
const B1YENI = `      '<p class="text-[10.5px] text-slate-400 mt-3"><i class="fa-solid fa-shield-halved mr-1"></i>Sıfırlamadan önce mutlaka yedek alın.</p>' +
    "</div>" + csvYonetimKartHTML() + "</div>";
}`;
out = out.replace(B1, B1YENI);

/* ================= Sonuç doğrulamaları (yazmadan ÖNCE) ================= */
assert(say(out, "EXCEL-CSV-YAMASI") >= 1, "sonuç: EXCEL-CSV-YAMASI işareti mevcut");
assert(say(out, "function csvDosya(") === 1, "sonuç: csvDosya serializer tam 1 kez");
assert(say(out, "function csvParse(") === 1, "sonuç: csvParse parser tam 1 kez");
assert(say(out, "function csvKadroIndir(") === 1, "sonuç: csvKadroIndir tam 1 kez");
assert(say(out, "function csvDersIndir(") === 1, "sonuç: csvDersIndir tam 1 kez");
assert(say(out, "function csvIstekIndir(") === 1, "sonuç: csvIstekIndir tam 1 kez");
assert(say(out, "function csvTumunuIndir(") === 1, "sonuç: csvTumunuIndir tam 1 kez");
assert(say(out, "function csvImportUygula(") === 1, "sonuç: csvImportUygula tam 1 kez");
assert(say(out, "function csvImportTetik(") === 1, "sonuç: csvImportTetik tam 1 kez");
assert(say(out, "function csvGeriAl(") === 1, "sonuç: csvGeriAl tam 1 kez");
assert(say(out, "function csvYonetimKartHTML(") === 1, "sonuç: csvYonetimKartHTML tam 1 kez");
assert(say(out, '"yks-csv-v1"') === 1, "sonuç: CSV_SCHEMA sabiti 'yks-csv-v1' tam 1 kez (tek gerçek kaynak)");
assert(say(out, "yks-kadro-global.csv") === 1, "sonuç: kadro dosya adı tam 1 yerde (csvKadroIndir)");
assert(say(out, '"yks-dersler-" + id + ".csv"') === 1, "sonuç: ders dosya adı aktif dönem ID ile üretiliyor");
assert(say(out, '"yks-istekler-" + id + ".csv"') === 1, "sonuç: istek dosya adı aktif dönem ID ile üretiliyor");
assert(say(out, "aktifDonemKayitlari(kaynak)") === 1, "sonuç: dışa aktarma TEK filtre kapısından geçiyor");
assert(say(out, "CSV_BASLIK_KADRO") === 2, "sonuç: kadro başlık dizisi tam 2 kez (tanım + kullanım)");
assert(say(out, "CSV_BASLIK_DERS") === 3, "sonuç: ders başlık dizisi tam 3 kez (tanım + kayıt satırı + indir)");
assert(say(out, "CSV_BASLIK_ISTEK") === 3, "sonuç: istek başlık dizisi tam 3 kez (tanım + kayıt satırı + indir)");
assert(say(out, "\\uFEFF") === 1, "sonuç: UTF-8 BOM tam 1 yerde ekleniyor");
const CSV_EOL_NEEDLE = 'var CSV_EOL = ' + '"' + String.fromCharCode(92) + 'r' + String.fromCharCode(92) + 'n' + '";';
assert(say(out, CSV_EOL_NEEDLE) === 1, "sonuç: CRLF satır sonu sabiti tam 1 kez (BLOCK içinde \\r\\n literali)");
assert(say(out, "CSV_EOL;") === 2, "sonuç: CRLF kullanım noktaları (2 satır ekleme)");
assert(say(out, "function kimlikUret(") === 1, "sonuç: kimlikUret çağrı noktaları değişmedi (tanım 1)");
assert(say(out, "function kadroSnfId(") === 1, "sonuç: kadroSnfId dokunulmadı");
assert(say(out, "function donemSec(id)") === 1, "sonuç: donemSec dokunulmadı");
assert(say(out, "function penceredeDersler()") === 1, "sonuç: penceredeDersler dokunulmadı");
assert(say(out, "function normalize(d)") === 1, "sonuç: normalize dokunulmadı");
assert(say(out, "donemId: aktifDonemId()") === 4, "sonuç: DONEM-DAMGA kayıt noktaları aynen (4)");
assert(say(out, "function yedekAl()") === 1, "sonuç: yedekAl değişmedi");
assert(say(out, "function saveDB()") === 1, "sonuç: saveDB değişmedi");
assert(say(out, "function yenile()") === 1, "sonuç: yenile değişmedi");
assert(out.length > src0.length, "sonuç: dosya yalnızca büyüdü (bölgesel ekleme)");

/* ================= Geçici dosya + atomic rename ================= */
const tmp = F + ".excel-csv-tmp";
writeFileSync(tmp, out);
renameSync(tmp, F);

/* ================= Yazma sonrası dokunulmazlık doğrulaması ================= */
assert(sha(readFileSync("index.html", "utf8")) === sha(HTML_BEFORE), "yazma sonrası: index.html hash değişmedi");
assert(sha(readFileSync("ek-ders.js", "utf8")) === sha(EKDERS_BEFORE), "yazma sonrası: ek-ders.js hash değişmedi");
VENDOR_BEFORE.forEach((v) => {
  const [f, h] = v.split(":");
  assert(sha(readFileSync("vendor/" + f)) === h, "yazma sonrası: vendor/" + f + " hash değişmedi");
});

/* ================= test.mjs: yeni süit kaydı (idempotent) ================= */
const TF = "test.mjs";
const tsrc0 = readFileSync(TF, "utf8");
if (say(tsrc0, '"ks-excel-csv.mjs"') === 0) {
  const T1 = `"ks-donem-ilk.mjs", "ks-donem-damga.mjs", "ks-donem-secici.mjs"]`;
  assert(say(tsrc0, T1) === 1, "test.mjs: suites satırı exact 1 kez");
  writeFileSync(TF, tsrc0.replace(T1, T1.replace("]", "") + `, "ks-excel-csv.mjs"]`));
  console.log("test.mjs güncellendi (ks-excel-csv.mjs eklendi).");
} else {
  console.log("test.mjs: ks-excel-csv.mjs kaydı zaten mevcut — değişmedi.");
}

console.log("\\nEXCEL-CSV-YAMASI uygulandı. Backup: " + bakPath);
