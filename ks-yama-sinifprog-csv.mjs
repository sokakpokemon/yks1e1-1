/* ks-yama-sinifprog-csv.mjs — SINIFPROG-CSV-YAMASI: aktif dönem sınıf programı Excel CSV dilimi
   TEK İŞ: DB.sinifProgDonemler[aktifDonemId] programını dışa/içe aktarma + eski yedek uyumluluk.
   - Değişen: yalnızca app.js (bölgesel ekleme, baştan yazma YOK) + test.mjs (yeni süit kaydı).
   - index.html, ek-ders.js, vendor/* DOKUNULMAZ (hash doğrulaması yazma öncesi yapılır).
   - İdempotent: 2. koşu "Zaten uygulanmış" (exit 2), dosyalara DOKUNMAZ.
   - Backup: app.js.sinifprog-csv-oncesi.bak (varsa üzerine YAZILMAZ, hash raporlanır).
   - Yeniden kullanılan yardımcılar: csvHucre, csvSatir, csvDosya, csvParse, csvIndir (YENİ PARSER YOK).
*/
import { readFileSync, writeFileSync, existsSync } from "node:fs";
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
if (src0.includes("SINIFPROG-CSV-YAMASI")) {
  console.error("Zaten uygulanmış (SINIFPROG-CSV-YAMASI mevcut) — dosyalar değiştirilmedi.");
  console.error("app.js hash: " + sha(src0));
  process.exit(2);
}

/* --- Beklenen mevcut durum (exact anchor'lar) --- */
assert(say(src0, "function csvHucre(") === 1, "app.js: csvHucre tam 1 kez (yeniden kullanılır)");
assert(say(src0, "function csvSatir(") === 1, "app.js: csvSatir tam 1 kez");
assert(say(src0, "function csvDosya(") === 1, "app.js: csvDosya tam 1 kez");
assert(say(src0, "function csvParse(") === 1, "app.js: csvParse tam 1 kez");
assert(say(src0, "function csvIndir(") === 1, "app.js: csvIndir tam 1 kez");
assert(say(src0, "function csvImportUygula(") === 1, "app.js: csvImportUygula tam 1 kez (akış uyumu)");
assert(say(src0, "function sinifProgDonemleriBaslat(") === 1, "app.js: sinifProgDonemleriBaslat tam 1 kez");
assert(say(src0, "function sinifProguDonemeBagla(") === 1, "app.js: sinifProguDonemeBagla tam 1 kez");
assert(say(src0, "function csvYonetimKartHTML()") === 1, "app.js: csvYonetimKartHTML tam 1 kez (buton ekleme noktası)");
assert(say(src0, "SINIFPROG-CSV") === 0, "app.js: yama henüz YOK (temiz başlangıç)");

/* --- Backup (yamadan önceki hâl; varsa üzerine YAZILMAZ) --- */
const bakPath = "app.js.sinifprog-csv-oncesi.bak";
if (existsSync(bakPath)) {
  console.log("  OK backup zaten var: " + bakPath + " SHA-256 " + sha(readFileSync(bakPath)));
} else {
  writeFileSync(bakPath, src0);
  console.log("  OK backup alındı: " + bakPath + " SHA-256 " + sha(src0));
}

/* ================= Eklenen kod bloğu (bölgesel) ================= */
const BLOCK = `
/* ================================================================
   SINIFPROG-CSV-YAMASI: aktif dönem sınıf programı CSV dışa/içe aktarma
   - Dosya: yks-sinif-programi-<aktifDonemId>.csv — TEK dönem taşır.
   - Kolon başlığı (tam): schema;dataset;donemId;donemAd;sinifId;sinifAd;gun;kod;saat;durum;deger;degerJson
   - schema=yks-csv-v1 (mevcut CSV_SCHEMA), dataset=sinifProg.
   - sinifId DB.sinifIds'ten gelir (ID-birincil; ada göre eşleştirme YOK);
     sinifAd yalnız görüntüleme alanıdır.
   - gun/kod/saat KS kısa kod semantiği: sinifProg hücre anahtarı "G-K" biçimindedir
     (G = 0..6 gün, K = KISA_KOD no); saat = KISA_KOD[K].b başlangıç saati.
   - durum: "sinif" (sınıf dersi hücresi); boş hücreler satır üretilmez ama import'ta
     mevcut satır silinerek temsil edilir (round-trip kayıpsız).
   - deger/degerJson: sinifProg yapısını kayıpsız taşıyan bilgi alanları.
   - İçe aktarma atomiktir: tüm satırlar doğrulanmadan DB/localStorage değişmez;
     başarılı işlem TEK saveDB + identity-rebind + yenile.
   - Mevcut csvHucre/csvSatir/csvDosya/csvParse/csvIndir YENİDEN KULLANILIR (parser yazılmaz).
   ================================================================ */
var SINIFPROG_CSV_BASLIK = ["schema","dataset","donemId","donemAd","sinifId","sinifAd","gun","kod","saat","durum","deger","degerJson"];
var SINIFPROG_CSV_SNAPSHOT = null; /* son BAŞARILI sinifProg içe aktarması öncesi DB snapshot (oturum içi) */

function sinifProgCsvSaatOf(kod) {
  var k = KISA_KOD.filter(function (x) { return String(x.no) === String(kod); })[0];
  return k ? k.b : "";
}
function sinifProgCsvSatirlari() {
  var donemId = aktifDonemId();
  var donemAd = "";
  ((DB && Array.isArray(DB.donemler)) ? DB.donemler : []).forEach(function (d) {
    if (d && d.id === donemId) donemAd = d.ad || "";
  });
  var prog = sinifProgAktif(donemId) || {};
  var satirlar = [];
  Object.keys(prog).forEach(function (sinifAd) {
    var cells = prog[sinifAd];
    if (!Array.isArray(cells)) return;
    var sinifId = (DB.sinifIds && DB.sinifIds[sinifAd] != null) ? String(DB.sinifIds[sinifAd]) : "";
    cells.slice().sort(function (a, b) {
      var pa = String(a).split("-"), pb = String(b).split("-");
      return (Number(pa[0]) - Number(pb[0])) || (Number(pa[1]) - Number(pb[1]));
    }).forEach(function (key) {
      var p = String(key).split("-");
      var gun = p[0], kod = p.slice(1).join("-");
      var saat = sinifProgCsvSaatOf(kod);
      if (!saat) return; /* bilinmeyen kod: satır üretme (import zaten reddeder) */
      satirlar.push([
        CSV_SCHEMA, "sinifProg", donemId, donemAd, sinifId, sinifAd,
        gun, kod, saat, "sinif", key, JSON.stringify({ key: key })
      ]);
    });
  });
  return satirlar;
}
function sinifProgCsvIndir() {
  var donemId = aktifDonemId();
  csvIndir("yks-sinif-programi-" + donemId + ".csv", SINIFPROG_CSV_BASLIK, sinifProgCsvSatirlari());
  toast("Aktif dönem sınıf programı CSV indirildi ✓ (" + donemId + ")");
}
/* ---- sinifProg içe aktarma: parse → validate (tam) → TEK commit ---- */
function sinifProgCsvUygula(dosyalar) {
  var hedefDonem = aktifDonemId();
  var hatalar = [];
  var satirlar = []; /* { sn, sinifId, sinifAd, gun, kod, saat, durum, deger, degerJson } */
  dosyalar.forEach(function (d) {
    var satirMatrisi = csvParse(d.metin);
    if (!satirMatrisi.length) { hatalar.push(csvHata(d.ad, 1, "dosya", "Dosya boş")); return; }
    var baslik = satirMatrisi[0];
    var beklenen = SINIFPROG_CSV_BASLIK.join(";");
    if (baslik.join(";") !== beklenen) { hatalar.push(csvHata(d.ad, 1, "başlık", "Kolon başlığı uyuşmuyor: " + baslik.join(";"))); return; }
    satirMatrisi.slice(1).forEach(function (r, idx) {
      var sn = idx + 2;
      if (!r || !r.length || r.every(function (c) { return String(c).trim() === ""; })) return; /* tamamen boş satır yoksayılır */
      var o = {};
      SINIFPROG_CSV_BASLIK.forEach(function (k, i) { o[k] = r[i] != null ? r[i] : ""; });
      o._sn = sn;
      satirlar.push(o);
    });
  });
  if (!hatalar.length) {
    if (!satirlar.length) hatalar.push(csvHata("sinifProg", 1, "dosya", "Veri satırı yok"));
    var goren = {};
    satirlar.forEach(function (v) {
      var sn = v._sn;
      if ((v.schema || "").trim() !== CSV_SCHEMA) { hatalar.push(csvHata("sinifProg", sn, "schema", "Bilinmeyen schema: " + (v.schema || "(boş)"))); return; }
      if ((v.dataset || "").trim() !== "sinifProg") { hatalar.push(csvHata("sinifProg", sn, "dataset", "Bilinmeyen dataset: " + (v.dataset || "(boş)"))); return; }
      var dn = (v.donemId || "").trim();
      if (!dn) { hatalar.push(csvHata("sinifProg", sn, "donemId", "donemId boş (zorunlu)")); return; }
      if (dn !== hedefDonem) { hatalar.push(csvHata("sinifProg", sn, "donemId", "Dosya dönemi aktif dönemle uyuşmuyor (" + dn + " ≠ " + hedefDonem + ") — karışık/başka dönem RED")); return; }
      var sinifId = (v.sinifId || "").trim();
      var sinifAd = (v.sinifAd || "").trim();
      if (!sinifId) { hatalar.push(csvHata("sinifProg", sn, "sinifId", "sinifId boş (zorunlu)")); return; }
      if (!sinifAd) { hatalar.push(csvHata("sinifProg", sn, "sinifAd", "sinifAd boş")); return; }
      /* ID-birincil eşleştirme: ada göre tahmin YOK. sinifId DB.sinifIds'ten gelmeli. */
      var adById = null;
      Object.keys(DB.sinifIds || {}).forEach(function (ad) { if (String(DB.sinifIds[ad]) === sinifId) adById = ad; });
      if (!adById) { hatalar.push(csvHata("sinifProg", sn, "sinifId", "Bilinmeyen sinifId: " + sinifId)); return; }
      if (adById !== sinifAd) { hatalar.push(csvHata("sinifProg", sn, "sinifAd", "sinifAd sinifId ile uyuşmuyor (" + sinifAd + " ≠ " + adById + ") — ada göre eşleştirme yapılmaz")); return; }
      var gun = String(v.gun || "").trim();
      if (!/^\\d+$/.test(gun) || Number(gun) < 0 || Number(gun) > 6) { hatalar.push(csvHata("sinifProg", sn, "gun", "Geçersiz gün: " + gun)); return; }
      var kod = String(v.kod || "").trim();
      var kodGecerli = KISA_KOD.some(function (x) { return String(x.no) === kod; });
      if (!kodGecerli) { hatalar.push(csvHata("sinifProg", sn, "kod", "Geçersiz KS kısa kod: " + kod)); return; }
      var saat = String(v.saat || "").trim();
      var kodSaat = sinifProgCsvSaatOf(kod);
      if (saat !== kodSaat) { hatalar.push(csvHata("sinifProg", sn, "saat", "Saat KS koduyla uyuşmuyor (" + saat + " ≠ " + kodSaat + ")")); return; }
      var durum = String(v.durum || "").trim();
      if (durum !== "sinif") { hatalar.push(csvHata("sinifProg", sn, "durum", "Geçersiz durum: " + (durum || "(boş)") + " (yalnız sinif)")); return; }
      var deger = String(v.deger || "").trim();
      var key = gun + "-" + kod;
      if (deger !== key) { hatalar.push(csvHata("sinifProg", sn, "deger", "deger hücre anahtarıyla uyuşmuyor (" + deger + " ≠ " + key + ")")); return; }
      var degerJson = String(v.degerJson || "").trim();
      if (degerJson) { try { var _j = JSON.parse(degerJson); if (!_j || typeof _j !== "object") throw 0; } catch (e) { hatalar.push(csvHata("sinifProg", sn, "degerJson", "Bozuk JSON")); return; } }
      var dupKey = sinifId + "|" + key;
      if (goren[dupKey]) { hatalar.push(csvHata("sinifProg", sn, "satır", "Yinelenen satır: " + sinifAd + " " + key)); return; }
      goren[dupKey] = 1;
    });
  }
  if (hatalar.length) return { ok: false, hatalar: hatalar };
  /* Tüm satırlar doğrulandı → derin kopya üzerinde uygula (mevcut programdan round-trip: silinen satır = boş hücre) */
  var kopya = JSON.parse(JSON.stringify(DB));
  var yeniProg = {};
  var adlardan = {};
  satirlar.forEach(function (v) {
    var sinifId = String(v.sinifId).trim();
    adlardan[sinifId] = String(v.sinifAd).trim();
  });
  Object.keys(adlardan).forEach(function (sid) { yeniProg[adlardan[sid]] = []; });
  satirlar.forEach(function (v) {
    yeniProg[String(v.sinifAd).trim()].push(String(v.deger).trim());
  });
  Object.keys(yeniProg).forEach(function (ad) { yeniProg[ad].sort(function (a, b) { var pa = a.split("-"), pb = b.split("-"); return (Number(pa[0]) - Number(pb[0])) || (Number(pa[1]) - Number(pb[1])); }); });
  kopya.sinifProgDonemler[hedefDonem] = yeniProg;
  kopya.sinifProgDonemId = hedefDonem;
  kopya.sinifProg = kopya.sinifProgDonemler[hedefDonem]; /* identity-rebind (JSON döngüsü sonrası referans eşitliği korunur) */
  return { ok: true, kopya: kopya, satir: satirlar.length, sinif: Object.keys(yeniProg).length };
}
function sinifProgCsvImportTetik(input) {
  csvDosyalarOku(input, function (dosyalar) {
    var sonuc = sinifProgCsvUygula(dosyalar);
    if (!sonuc.ok) {
      var mesaj = "Sınıf programı içe aktarma REDDEDİLDİ — hiçbir değişiklik yapılmadı.";
      if (sonuc.hatalar && sonuc.hatalar.length) {
        mesaj += " İlk hatalar: " + sonuc.hatalar.slice(0, 4).map(function (h) {
          return "[satır " + h.satir + (h.kolon ? " · " + h.kolon : "") + "] " + h.sebep;
        }).join(" | ");
      }
      toast(mesaj, "hata");
      if ($("csvMesaj")) $("csvMesaj").innerHTML = '<span class="text-rose-600 font-bold">' + esc(mesaj) + "</span>";
      return;
    }
    /* Başarılı: snapshot al → identity-rebind commit → TEK saveDB + yenile */
    SINIFPROG_CSV_SNAPSHOT = JSON.stringify(DB);
    DB = sonuc.kopya;
    saveDB();
    yenile();
    var ozet = "Sınıf programı içe aktarıldı ✓ — " + sonuc.sinif + " sınıf, " + sonuc.satir + " hücre (" + aktifDonemId() + ")";
    toast(ozet);
    if ($("csvMesaj")) $("csvMesaj").innerHTML = '<span class="text-teal-600 font-bold">' + esc(ozet) + "</span>";
  });
}
/* SINIFPROG-CSV-YAMASI sonu */
`;

/* ================= 1) BLOCK: yedekOku'dan hemen önce ================= */
const ANCHOR1 = "function yedekAl() {";
assert(say(src0, ANCHOR1) === 1, "app.js: yedekAl anchor tam 1 kez");
let src1 = src0.replace(ANCHOR1, BLOCK + "\n" + ANCHOR1);

/* ================= 2) Buton: csvYonetimKartHTML içine ================= */
const BUTON_ESKI = "        '<button onclick=\"csvIstekIndir()\" class=\"rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11.5px] font-bold px-3.5 py-2 transition-colors\"><i class=\"fa-solid fa-inbox mr-1\"></i>Aktif İstekleri CSV İndir</button>' +";
assert(say(src1, BUTON_ESKI) === 1, "app.js: Aktif İstekleri CSV İndir butonu anchor tam 1 kez");
const BUTON_YENI = BUTON_ESKI + "\n" +
  "        '<button onclick=\"sinifProgCsvIndir()\" class=\"rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11.5px] font-bold px-3.5 py-2 transition-colors\"><i class=\"fa-solid fa-table-cells mr-1\"></i>Aktif Sınıf Programı CSV İndir</button>' +";
src1 = src1.replace(BUTON_ESKI, BUTON_YENI);

/* ================= 3) İçe aktarma butonu: sinifProg dataset'i ================= */
const IMPORT_ESKI = "        '<input id=\"csvDosyaInput\" type=\"file\" accept=\".csv,text/csv\" multiple class=\"hidden\" onchange=\"csvImportTetik(this)\" />' +\n" +
  "        '<button onclick=\"document.getElementById(\\'csvDosyaInput\\').click()\" class=\"rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 text-[11.5px] font-bold px-3.5 py-2 transition-colors\"><i class=\"fa-solid fa-file-import mr-1\"></i>CSV İçe Aktar</button>' +";
assert(say(src1, IMPORT_ESKI) === 1, "app.js: CSV İçe Aktar input+buton anchor tam 1 kez");
const IMPORT_YENI = "        '<input id=\"csvDosyaInput\" type=\"file\" accept=\".csv,text/csv\" multiple class=\"hidden\" onchange=\"csvImportTetik(this)\" />' +\n" +
  "        '<button onclick=\"document.getElementById(\\'csvDosyaInput\\').click()\" class=\"rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 text-[11.5px] font-bold px-3.5 py-2 transition-colors\"><i class=\"fa-solid fa-file-import mr-1\"></i>CSV İçe Aktar</button>' +\n" +
  "        '<input id=\"sinifProgCsvInput\" type=\"file\" accept=\".csv,text/csv\" class=\"hidden\" onchange=\"sinifProgCsvImportTetik(this)\" />' +\n" +
  "        '<button onclick=\"document.getElementById(\\'sinifProgCsvInput\\').click()\" title=\"Yalnız aktif dönemin sınıf programı (dataset=sinifProg)\" class=\"rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 text-[11.5px] font-bold px-3.5 py-2 transition-colors\"><i class=\"fa-solid fa-table-cells mr-1\"></i>Sınıf Programı CSV İçe Aktar</button>' +";
src1 = src1.replace(IMPORT_ESKI, IMPORT_YENI);

/* ================= 4) csvImportUygula: sinifProg dataset RED (kesin kapsam ayrımı) ================= */
const DS_ESKI = "    if ([\"kadro\", \"dersler\", \"istekler\"].indexOf(c.dataset) === -1) { hatalar.push(csvHata(d.ad, 1, \"dataset\", \"Bilinmeyen dataset: \" + c.dataset)); return; }";
assert(say(src1, DS_ESKI) === 1, "app.js: csvImportUygula dataset check anchor tam 1 kez");
const DS_YENI = "    if (c.dataset === \"sinifProg\") { hatalar.push(csvHata(d.ad, 1, \"dataset\", \"sinifProg dataset'i genel içe aktarmada desteklenmez — Sınıf Programı CSV İçe Aktar butonunu kullanın\")); return; }\n" +
  "    if ([\"kadro\", \"dersler\", \"istekler\"].indexOf(c.dataset) === -1) { hatalar.push(csvHata(d.ad, 1, \"dataset\", \"Bilinmeyen dataset: \" + c.dataset)); return; }";
src1 = src1.replace(DS_ESKI, DS_YENI);

/* ================= Tüm assert'ler geçti → yaz ================= */
assert(sha(readFileSync("index.html", "utf8")) === sha(HTML_BEFORE), "index.html yazım öncesi hash aynı");
assert(sha(readFileSync("ek-ders.js", "utf8")) === sha(EKDERS_BEFORE), "ek-ders.js yazım öncesi hash aynı");
VENDOR_BEFORE.forEach((v) => {
  const f = v.split(":")[0];
  assert(sha(readFileSync("vendor/" + f)) === v.split(":")[1], "vendor/" + f + " hash aynı");
});
writeFileSync(F, src1);
console.log("YAMA UYGULANDI: " + F + " (yeni hash " + sha(src1) + ")");
console.log("app.js.sinifprog-csv-oncesi.bak SHA-256: " + sha(readFileSync(bakPath)));
