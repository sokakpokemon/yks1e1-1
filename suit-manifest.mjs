/* suit-manifest.mjs — SÜİT SAYI MANİFESTİ (tek gerçek kaynak)
   "Beklenen" sayılar BURADA EXPLICIT yazılır; t( satır sayımından TÜRETİLMEZ.
   Kural: her süit sonunda tam 1 adet  SUITE_DONE:<ad>:<kosan>:<beklenen>  satırı basar.
   test.mjs bu satırı zorunlu kılar: exit=0 · tam 1 marker · kosan === beklenen === manifest.
   Marker yoksa / duplicate ise süit FAIL sayılır. Catch-only assert'ler normal sayıma girmez. */

export const manifest = {
  "ks-harness.mjs": 34,
  "ks-test-render.mjs": 14,
  "ks-durum-fn.mjs": 20,
  "ks-grup-uyum.mjs": 41,
  "ks-panel-secim.mjs": 32,
  "ks-grup-gorunum.mjs": 28,
  "ks-istekten-grup.mjs": 32,
  "ks-grup-istegi.mjs": 68,
  "ks-benzersiz-id.mjs": 46,
  "ks-gercek-kadro.mjs": 80,
  "ks-donem-ilk.mjs": 47,
  "ks-donem-damga.mjs": 50,
  "ks-donem-secici.mjs": 77,
  "ks-excel-csv.mjs": 85,
  "ks-donem-olusturma.mjs": 87,
  "ks-donem-secici-gorunum.mjs": 44,
  "ks-donem-secici-dom.mjs": 22,
  "ks-sinifprog-csv.mjs": 57,
  "ks-sablon-kopya.mjs": 72,
  "ks-render-sahipligi.mjs": 30,
  "ks-d1-render-refactor.mjs": 45,
  "ks-kadro-siralama.mjs": 27,
  "ks-kapali-gorunum.mjs": 19,
  "ks-ek-ders-donem.mjs": 59,
  "ks-ekders-gorunum.mjs": 51,
  "ks-ekders-ozet-csv.mjs": 45,
  "ks-birebir-gorunum.mjs": 35,
  "ks-sinif-ogretmen-uyum.mjs": 34,
  "ks-sinif-prog-uyum-onar.mjs": 36,
  "ks-sinif-prog-etiket.mjs": 24,
  "ks-kart-sirasi.mjs": 33,
  "ks-kart-kolon.mjs": 52,
  "ks-brans-ders-kurali.mjs": 54,
  "ks-excel-ui-kontrol.mjs": 34,
  "ks-wa-sablon.mjs": 47,
  "ks-wa-onizleme.mjs": 36,
  "ks-wa-durum.mjs": 35,
  "ks-wa-alici.mjs": 47,
  "ks-excel-k-import.mjs": 23,
  "ks-kadro-kolon.mjs": 62,
  "ks-kadro-telefon3.mjs": 57,
  "ks-ders-tasi.mjs": 91,
  "ks-gunluk-ders-tasi.mjs": 115,
  "ks-ders-karti.mjs": 101,
  "ks-ders-karti-tasima.mjs": 56,
  "ks-ogrt-ders-karti.mjs": 70,
  "ks-ogrt-denetim.mjs": 42,
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
