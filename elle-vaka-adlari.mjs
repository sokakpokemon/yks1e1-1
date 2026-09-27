/* elle-vaka-adlari.mjs — ELLE YAZILMIŞ VAKA AD MANİFESTİ (AD BAZLI)
   Kaynak: elle-vaka-adlari-base.mjs (manuel derlenmiş tam liste). Bu sarmalayıcı
   liste üzerinde YALNIZ D30-CACHE'te kayması gereken İKİ statik byte-offset vaka adını
   hedefli olarak düzeltir; başka hiçbir ad/sıra/sayı değişmez.

   Neden: DÖNGÜ-30-CACHE'te index.html'deki ek-ders.js/app.js script referanslarına
   ?v=6dd3188 damgası eklendi. Damga, ek-ders.js etiketinin (index.html satır ~13)
   uzunluğunu +10 artırdığı için kendisinden SONRAKİ tüm statik offsetler +10 kaydı.
   ks-kart-sirasi ve ks-kart-kolon süitleri adlarında bu ham offsetleri taşıyor.
   Düzeltme ELLE yapılır (koşumdan türetme YOK); hedef bulunamazsa yüksek sesle hata verir. */
import { elleVakaAdlari as taban } from "./elle-vaka-adlari-base.mjs";

export const elleVakaAdlari = structuredClone(taban);

function offsetDuzelt(suit, eski, yeni) {
  const liste = elleVakaAdlari[suit];
  if (!Array.isArray(liste)) throw new Error("D30-CACHE offset düzeltmesi: süit yok: " + suit);
  const i = liste.indexOf(eski);
  if (i < 0) throw new Error("D30-CACHE offset düzeltmesi: hedef ad bulunamadı: " + suit + " :: " + eski);
  liste[i] = yeni;
}

offsetDuzelt(
  "ks-kart-sirasi.mjs",
  "index.html'de planKart havuzBolum'den ÖNCE (statik sıra) → plan=9491 havuz=15402",
  "index.html'de planKart havuzBolum'den ÖNCE (statik sıra) → plan=9510 havuz=15421",
);
offsetDuzelt(
  "ks-kart-kolon.mjs",
  "Plan kartı ÜST panelde (statik parent) → sol=9435 plan=9491 sag=15293",
  "Plan kartı ÜST panelde (statik parent) → sol=9454 plan=9510 sag=15312",
);
offsetDuzelt(
  "ks-kart-kolon.mjs",
  "İstek havuzu ALT panelde (statik parent) → sag=15293 havuz=15402 kapa=19790",
  "İstek havuzu ALT panelde (statik parent) → sag=15312 havuz=15421 kapa=19809",
);

/* DÖNGÜ-30-CACHE (SHA16 damgası): 6dd3188 → dosya SHA-256 ilk 16 hane.
   - ks-donem-ilk #48 vaka adı damga metnini taşır → hedefli yeniden adlandırma.
   - ks-kart-kolon yeni #56 vaka adı (içerik damgası = SHA16) listenin SONUNA eklenir. */
offsetDuzelt(
  "ks-donem-ilk.mjs",
  "index.html statik varlık ?v=6dd3188 damgası VAR (app.js + ek-ders.js) — damga kaldırılırsa KIRMIZI",
  "index.html statik varlık ?v=1d509a6410c874b4 (app.js) + ?v=3d2dd38ff517c64f (ek-ders.js) damgası VAR — damga kaldırılırsa KIRMIZI",
);
elleVakaAdlari["ks-kart-kolon.mjs"].push(
  "index.html damga = SHA ilk 16 hane (app.js ?v=1d509a6410c874b4 + ek-ders.js ?v=3d2dd38ff517c64f)",
);
