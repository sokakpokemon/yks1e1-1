/* ks-yama-avail.mjs — planla() kayıt öncesi avail şema sapması düzeltmesi
   (L1483 kuralı: kaydetmeden önce normalize() ile aynı şekle getir).
   Assert'li, idempotent: ikinci çalıştırmada güvenli şekilde reddeder. */
import { readFileSync, writeFileSync } from "node:fs";

const F = "app.js";
const src = readFileSync(F, "utf8");
const say = (h, n) => h.split(n).length - 1;
const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };

/* Zaten uygulanmış mı? */
const MARK = "/* avail şema sapması (L1483 kuralı): kaydetmeden önce normalize() ile aynı şekle getir */";
if (src.includes(MARK)) { console.log("SKIP: avail normalizasyonu zaten uygulanmış"); process.exit(0); }

const need =
  '  var cakisma = duzeltmeBul({ ogrenciId: o.id, ogretmenId: t.id, tarih: tarih, saat: saat, id: ui.editId || "" }, yoksay, grupModu ? grupOgrenciIds : null);\n' +
  '  if (cakisma.length && !yoksay) { hataKart(cakisma); return; }\n';
if (say(src, need) !== 1) fail("hedef blok tam 1 kez bulunamadi (bulunan: " + say(src, need) + ")");

const rep =
  '  /* avail şema sapması (L1483 kuralı): kaydetmeden önce normalize() ile aynı şekle getir */\n' +
  '  if (!t.avail || typeof t.avail !== "object") t.avail = { sinif: {}, musait: [] };\n' +
  '  if (!Array.isArray(t.avail.musait)) t.avail.musait = [];\n' +
  '  if (Array.isArray(t.avail.sinif)) {\n' +
  '    var _sObj = {}; t.avail.sinif.forEach(function (k) { _sObj[k] = "Sınıf Dersi"; });\n' +
  '    t.avail.sinif = _sObj;\n' +
  '  }\n' +
  '  if (!t.avail.sinif || typeof t.avail.sinif !== "object") t.avail.sinif = {};\n' +
  need;

const out = src.replace(need, rep);
if (out === src) fail("degisiklik uretilemedi");
writeFileSync(F, out);

/* Doğrulama: dosyayı yeniden oku, beklenen işaretleri kontrol et */
const chk = readFileSync(F, "utf8");
if (!chk.includes(MARK)) fail("normalizasyon blogu yazilmadi");
if (say(chk, need) !== 1) fail("cakisma cagrisi etkilendi (sayi degisti)");
if (say(chk, "function planla()") !== 1) fail("planla etkilendi");
if (say(chk, "function duzeltmeBul(") !== 1) fail("duzeltmeBul etkilendi");
if (!chk.includes('var grupModu = grupOgrenciIds.length >= 2;')) fail("grupModu akisi etkilendi");
/* normalize() ile aynı kural sırası kullanıldı mı? (sinif dizi→obje, musait dizi garantisi) */
if (!chk.includes('t.avail.sinif.forEach(function (k) { _sObj[k] = "Sınıf Dersi"; });')) fail("sinif dizi→obje kurali yok");
if (!chk.includes('if (!Array.isArray(t.avail.musait)) t.avail.musait = [];')) fail("musait dizi garantisi yok");
console.log("OK: planla() kayıt öncesi avail şema normalizasyonu eklendi (normalize ile aynı kural seti)");
