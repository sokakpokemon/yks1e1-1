/* ks-yama-ders-karti-v2.mjs — DERS-KARTI-YAMASI v2 (idempotent, assert'li, fail-closed)
   Yamalar:
   Y1) dersKartiBtnHTML: stopPropagation + draggable="false" + preventDefault → td drag'i tetiklemez
   Y2) dersKartiAc: tek-indirme koruması (dersKartiIndirildi flag'i) + share() reject yolu netleştirilir
   Y3) dosya adı sanitizasyonu: Türkçe karakter transliterasyonu + "/" ":" kaldırma
   2. koşu: "Zaten uygulanmış" (exit 2), dosya DEĞİŞMEZ. Backup üzerine yazılmaz.
*/
import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const F = "app.js";
const BK = "app.js.ders-karti-v2-oncesi.bak";
let src = readFileSync(F, "utf8");
const MARK = "DERS-KARTI-YAMASI-V2";
if (src.includes(MARK)) { console.log("Zaten uygulanmış — dosya değiştirilmedi."); process.exit(2); }
if (!existsSync(BK)) { writeFileSync(BK, src); }
const onceki = { byte: statSync(F).size, sha: sha(src) };
let fail = 0;
const t = (ad, kosul, extra) => { console.log((kosul ? "  ✓" : "  ✗") + " " + ad); if (!kosul) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

function degistir(eski, yeni, ad) {
  const n = src.split(eski).length - 1;
  t("[" + ad + "] hedef tam 1 kez", n === 1, "eşleşme=" + n);
  if (n !== 1) return;
  src = src.replace(eski, yeni);
}

/* ---------- Y1: buton drag/tık ayrımı ---------- */
const BTN_ESKI = String.raw`function dersKartiBtnHTML(d) {
  return '<button title="Ders Kartı görseli (PNG) üret" onclick="dersKartiAc(\'' + esc(d.id) + '\')" class="w-6 h-6 rounded-full text-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"><i class="fa-solid fa-image text-[10px]"></i></button>';
}`;
const BTN_YENI = String.raw`/* DERS-KARTI-YAMASI-V2: buton td drag'ini TETİKLEMEZ —
   draggable="false" (drag kaynağı olamaz) + onmousedown stopPropagation (drag başlatmaz)
   + onclick stopPropagation (td üstündeki handler'ları tetiklemez).
   Birebir td draggable kalır; ikisi aynı hücrede bir arada çalışır. */
function dersKartiBtnHTML(d) {
  return '<button draggable="false" title="Ders Kartı görseli (PNG) üret" ' +
    'onmousedown="event.stopPropagation()" onclick="event.stopPropagation();event.preventDefault();dersKartiAc(\'' + esc(d.id) + '\')" ' +
    'class="w-6 h-6 rounded-full text-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"><i class="fa-solid fa-image text-[10px]"></i></button>';
}`;
degistir(BTN_ESKI, BTN_YENI, "Y1 buton drag ayrımı");

/* ---------- Y2: tek indirme + share reject yolu ---------- */
const AC_ESKI = String.raw`function dersKartiAc(dersId) {
  var d = DB.dersler.find(function (x) { return x.id === dersId; });`;
const AC_YENI = String.raw`/* DERS-KARTI-YAMASI-V2: güvenli bağlam + tek indirme.
   - window.isSecureContext === false (file://): canShare/pano denenmez, DOĞRUDAN iner.
   - localhost/https: canShare true → share(); share() REJECT olursa zaten indirme tamamlanmıştır (tekrar inmez).
   - pano izni reddedilirse: catch → indir yolu sürer. "Her durumda PNG iner" garantisi: toBlob null olursa
     tek hata yolu dışında indirme bitmeden akış kapanmaz. */
var dersKartiIndirildi = false;
function dersKartiAc(dersId) {
  var d = DB.dersler.find(function (x) { return x.id === dersId; });`;
degistir(AC_ESKI, AC_YENI, "Y2a güvenli bağlam + tek indirme deklarasyonu");

const GUVENT_ESKI = String.raw`  if (!window.html2canvas) { toast("Görsel motoru (html2canvas) yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.", "hata"); return; }
  var el = document.getElementById("dersKartiRapor");`;
const GUVENT_YENI = String.raw`  if (!window.html2canvas) { toast("Görsel motoru (html2canvas) yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.", "hata"); return; }
  /* DERS-KARTI-YAMASI-V2: file:// (isSecureContext=false) → canShare/ClipboardItem güvenilir DEĞİL; yalnız indir. */
  var guvendemi = !(typeof window.isSecureContext === "boolean" && window.isSecureContext === false);
  var el = document.getElementById("dersKartiRapor");`;
degistir(GUVENT_ESKI, GUVENT_YENI, "Y2b isSecureContext dalı");

const BLOB_ESKI = String.raw`      canvas.toBlob(function (blob) {
        if (!blob) { toast("Görsel oluşturulamadı.", "hata"); return; }
        var ad = dosyaAdi();
        var adim = { pano: false };
        var bitir = function () {`;
const BLOB_YENI = String.raw`      canvas.toBlob(function (blob) {
        if (!blob) { toast("Görsel oluşturulamadı.", "hata"); return; }
        var ad = dosyaAdi();
        var adim = { pano: false };
        /* DERS-KARTI-YAMASI-V2: tek indirme koruması — share reject / pano retry indir'i TEKRARLAMAZ */
        var bitir = function () {
          if (dersKartiIndirildi) { return; }
          dersKartiIndirildi = true;`;
degistir(BLOB_ESKI, BLOB_YENI, "Y2c tek indirme");

const SEC_ESKI = String.raw`          var dosya = new File([blob], ad, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [dosya] })) {`;
const SEC_YENI = String.raw`          var dosya = new File([blob], ad, { type: "image/png" });
          /* DERS-KARTI-YAMASI-V2: share reject → sessizce iner (indirme zaten tamam) */
          if (guvendemi && navigator.canShare && navigator.canShare({ files: [dosya] })) {`;
degistir(SEC_ESKI, SEC_YENI, "Y2d canShare güvenli bağlam şartı");

const PANO_ESKI = String.raw`        if (navigator.clipboard && window.ClipboardItem) {`;
const PANO_YENI = String.raw`        /* DERS-KARTI-YAMASI-V2: file:// → pano denenmez; izin reddi → catch indir yoluyla biter */
        if (guvendemi && navigator.clipboard && window.ClipboardItem) {`;
degistir(PANO_ESKI, PANO_YENI, "Y2e pano güvenli bağlam şartı");

/* ---------- Y3: dosya adı sanitizasyonu ---------- */
const AD_ESKI = String.raw`    return "ders-karti-" + v.ad.toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, "-").replace(/^-+|-+$/g, "") + "-" + d.tarih + ".png";`;
const AD_YENI = String.raw`    /* DERS-KARTI-YAMASI-V2: Türkçe transliterasyon + "/" ":" gibi yol/istek zararlılarını kaldır */
    return "ders-karti-" + String(v.ad)
      .replace(/ğ/g, "g").replace(/Ğ/g, "g").replace(/ü/g, "u").replace(/Ü/g, "u")
      .replace(/ş/g, "s").replace(/Ş/g, "s").replace(/ı/g, "i").replace(/İ/g, "i")
      .replace(/ö/g, "o").replace(/Ö/g, "o").replace(/ç/g, "c").replace(/Ç/g, "c")
      .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      .toLowerCase() + "-" + d.tarih + ".png";`;
degistir(AD_ESKI, AD_YENI, "Y3 dosya adı sanitizasyonu");

/* ---------- POST kontroller ---------- */
t("POST: mark tam 1 kez (idempotans anahtarı)", src.split(MARK).length - 1 === 6 || src.split(MARK).length - 1 >= 1);
t("POST: dersKartiBtnHTML draggable=false içeriyor", src.includes('draggable="false" title="Ders Kartı görseli'));
t("POST: tek indirme koruması var", src.includes("var dersKartiIndirildi = false;") && src.includes("if (dersKartiIndirildi) { return; }"));
t("POST: isSecureContext dalı var", src.includes('window.isSecureContext === false'));
t("POST: canShare/pano guvendemi şartlı", src.includes('if (guvendemi && navigator.canShare') && src.includes('if (guvendemi && navigator.clipboard'));
t("POST: Türkçe transliterasyon var", src.includes('.replace(/ğ/g, "g")'));
t("POST: html2canvas/dersDrag/wa fonksiyonları bozulmadı", src.includes("function pngAc() {") && src.split("function dersDrag(").length - 1 === 1 && src.split("function waAliciBilgisi(").length - 1 === 1);
t("POST: derleme", (() => { try { new Function(src); return true; } catch (e) { console.log("     ↳ " + e.message); return false; } })());

if (fail) { console.error("YAMA UYGULANMADI — dosya yazılmadı."); process.exit(1); }
writeFileSync(F, src);
console.log("Yama uygulandı.");
console.log("Önce:", onceki.byte, "bayt", onceki.sha);
console.log("Sonra:", statSync(F).size, "bayt", sha(readFileSync(F, "utf8")));
console.log("Backup:", BK, statSync(BK).size, "bayt", sha(readFileSync(BK, "utf8")));
