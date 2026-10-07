/* suit-manifest.mjs — SÜİT SAYI MANİFESTİ (tek gerçek kaynak)
   "Beklenen" sayılar BURADA EXPLICIT yazılır; t( satır sayımından TÜRETİLMEZ.
   Kural: her süit sonunda tam 1 adet  SUITE_DONE:<ad>:<kosan>:<beklenen>  satırı basar.
   test.mjs bu satırı zorunlu kılar: exit=0 · tam 1 marker · kosan === beklenen === manifest.
   Marker yoksa / duplicate ise süit FAIL sayılır. Catch-only assert'ler normal sayıma girmez. */

export const manifest = {
  "ks-yedek-guvenlik.mjs": 15, /* D58-YEDEK-GUVENLIK: 15 assertion — manifest beklenen sayısı (elle ile tutarlı) */
  "ks-harness.mjs": 34,
  "ks-test-render.mjs": 14,
  "ks-durum-fn.mjs": 20,
  "ks-grup-uyum.mjs": 41,
  "ks-panel-secim.mjs": 35,
  "ks-grup-gorunum.mjs": 53, /* D55-RAPOR-EMOJI: 51 + 2 (PNG raporu tablo başlıkları: 7 <th> emoji ÖNEKLİ birebir + başlık METİNLERİ önek öncesiyle AYNI) */
  "ks-istekten-grup.mjs": 32,
  "ks-grup-istegi.mjs": 68,
  "ks-benzersiz-id.mjs": 46,
  "ks-gercek-kadro.mjs": 80,
  "ks-donem-ilk.mjs": 46,
  "ks-donem-damga.mjs": 50,
  "ks-donem-secici.mjs": 77,
  "ks-excel-csv.mjs": 85,
  "ks-donem-olusturma.mjs": 86,
  "ks-donem-secici-gorunum.mjs": 44,
  "ks-donem-secici-dom.mjs": 22,
  "ks-sinifprog-csv.mjs": 57,
  "ks-sablon-kopya.mjs": 72,
  "ks-render-sahipligi.mjs": 30,
  "ks-d1-render-refactor.mjs": 45,
  "ks-kadro-siralama.mjs": 27,
  "ks-kapali-gorunum.mjs": 19,
  "ks-ek-ders-donem.mjs": 58,
  "ks-ekders-gorunum.mjs": 51,
  "ks-ekders-ozet-csv.mjs": 44,
  "ks-birebir-gorunum.mjs": 34,
  "ks-sinif-ogretmen-uyum.mjs": 33,
  "ks-sinif-prog-uyum-onar.mjs": 36,
  "ks-sinif-prog-etiket.mjs": 24,
  "ks-kart-sirasi.mjs": 33,
  "ks-kart-kolon.mjs": 56,
  "ks-brans-ders-kurali.mjs": 54,
  "ks-excel-ui-kontrol.mjs": 34,
  "ks-wa-sablon.mjs": 49,
  "ks-wa-onizleme.mjs": 36,
  "ks-wa-durum.mjs": 38,  "ks-wa-alici.mjs": 70,
 /* D41-TELEFON +7 → 56 (telefonsuz satır rozeti + Gönder disabled); D42-WA-ALICI-TIP +6 → 62 (satır durumu SEÇİLİ ALICIYA göre + liste tazeleme); D56-WA-GUN-FILTRE +7 → 69 (waGunKaynak gün filtresi + waGunBar üretimi/çizimi) */
  "ks-excel-k-import.mjs": 23,
  "ks-kadro-kolon.mjs": 62,
  "ks-kadro-telefon3.mjs": 75, /* D61-VELI-TEL: 57 → 75 (tek canonical veli telefonu modeli: veliTel migration + tek "Veli Telefonu" formu + legacy ayna + WA veli çözücüsü + round-trip/boş-kolon/geriye-uyum assert'leri) */
  "ks-ders-tasi.mjs": 90,
  "ks-gunluk-ders-tasi.mjs": 121, /* D36-ANA-SATIR +6 → 120; D36-BOS-AD-KILIT +1 → 121 (haftalık boş ad → kilitli hücre) */
  "ks-ders-karti.mjs": 121, /* D47-LOGO-HIZA: 113 + 2 (alt yazı marka kutusunun DIŞINDA/denge + çizgi görünürlük) · D49-LOGO-FOOTER: 115 + 3 (alt yazı 2px ölçek kapısı + footer 6 blok/birebir + imza ayraç-harf aralığı) · D52-SVG-HEIGHT: 118 + 1 (height:auto kaldırıldı → açık ölçü: kart 8.4px / master 32px) · D53-SVG-RASTER: 119 + 2 (onclone klonunda YALNIZ #fk-logo → standalone data-URI img · raster SVG'de konum/height:auto YOK + açık width/height) */
  "ks-ders-karti-tasima.mjs": 56,
  "ks-ogrt-ders-karti.mjs": 91,
  "ks-ogrt-denetim.mjs": 42,
  "ks-dongu26.mjs": 26,
  "ks-dongu27.mjs": 31,
  "ks-dongu28.mjs": 26,
  "ks-index-kimlik.mjs": 8,
  "ks-dongu29.mjs": 25,
  "ks-d32-grup-birebir-e2e.mjs": 20,
  "ks-grup-uye-yaz.mjs": 49, /* D37-HUCRE-GRUP +6 → 31 (havuz kartı DOM yerleşimi: TEK dış grid hücresi); D38-UYE-BUTON-TOGGLE +5 → 36 (buton aç/kapa); D39-UYE-ARAMA +13 → 49 (editörde öğrenci arama) */
  "ks-d35-ad-sinif.mjs": 26,
  "ks-cakisma-raporu.mjs": 33, /* D63-CAKISMA-RAPORU: Öğrenci Saat Çakışma Raporu (salt-okuma) — 33 assertion (elle sayım koşumla birebir) */
  "ks-dis-liste.mjs": 38, /* D61-DIS-LISTE: "Dış Liste Yükle" toplu içe aktarma (ayraç otomatik · başlık normalizasyonu · dosya düzeyi zorunlu kolon hatası · satır düzeyi boş Ad · sayaçlar · boş hücre ezmez · sinifProg'a anahtar açılmaz · Geri Al snapshot · idempotent bölüm · disListeTetik) */
};

/* Süit içi yardımcı: kosan sayacını manifest ile KENDİ sunar.
   Kullanım: import { suiteDone } from "./suit-manifest.mjs";  …  suiteDone(import.meta.url, kosan); */
export function suiteDone(suitUrl, kosan) {
  const ad = String(suitUrl).split("/").pop();
  const beklenen = manifest[ad];
  if (typeof beklenen !== "number") {
    console.error("SUITE_HATA: manifestte yok: " + ad);
    process.exit(1);
  }
  console.log("SUITE_DONE:" + ad + ":" + kosan + ":" + beklenen);
  /* Kosan ≠ beklenen ise süit kendi hatasını görür ve exit 1 ile düşer (runner ayrıca yakalar). */
  if (kosan !== beklenen) {
    console.error("SUITE_DONE UYUŞMAZLIĞI: " + ad + " kosan=" + kosan + " beklenen=" + beklenen);
    process.exit(1);
  }
}
