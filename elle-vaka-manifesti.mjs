/* elle-vaka-manifesti.mjs — MANUEL (ELLE YAZILMIS) VAKA SAYI MANIFESTI
   Kaynak: SUIT DOSYALARININ MANUEL SAYIMI (elle, satır satır sayıldı) —
   koşumdan ve t( satır-regexinden ÜRETİLMEDİ. suit-manifest.mjs'teki sayılar
   ve suit-vakalar/*.txt ile birebir karşılaştırılır; fark → runner FAIL.
   (sayi) = elle sayılan koşulsuz/koşullu t( assertion sayısı.
   Elle fark girişleri: DÖNGÜ-8'de eklendi: birebir +1 (#16), d1 +1 (#14),
   ekders +1 (#41), kart-kolon +1 (#45), etiket +3 (#6/#10/#12), tasima +1 (#56). */
export const elleManifest = {
  "ks-harness.mjs": 34,
  "ks-test-render.mjs": 14,
  "ks-durum-fn.mjs": 20,
  "ks-grup-uyum.mjs": 41,
  "ks-panel-secim.mjs": 35,
  "ks-grup-gorunum.mjs": 51,
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
  "ks-wa-durum.mjs": 38,
  "ks-wa-alici.mjs": 56, /* D41-TELEFON: elle sayım (49 → 56) — telefonsuz satır işareti + gönderim kapalı */
  "ks-excel-k-import.mjs": 23,
  "ks-kadro-kolon.mjs": 62,
  "ks-kadro-telefon3.mjs": 57,
  "ks-ders-tasi.mjs": 90,
  "ks-gunluk-ders-tasi.mjs": 121, /* D36-BOS-AD-KILIT: elle sayım (120 → 121) */
  "ks-ders-karti.mjs": 110, /* D33-LOGO-KİLİDİ: 109 + 1 yeni master-kaynak kapısı (logo-master/formul-kurs-logo.html) */
  "ks-ders-karti-tasima.mjs": 56,
  "ks-ogrt-ders-karti.mjs": 91,
  "ks-ogrt-denetim.mjs": 42, /* OGRT-TAMGUN-KART: elle sayım */
  "ks-dongu26.mjs": 26, /* DÖNGÜ-26: elle sayım */
  "ks-dongu27.mjs": 31, /* DÖNGÜ-27: elle sayım */
  "ks-dongu28.mjs": 26, /* DÖNGÜ-28 + SINIF-CHIP (6 yeni vaka): elle sayım */
  "ks-index-kimlik.mjs": 8,
  "ks-dongu29.mjs": 25, /* DÖNGÜ-29: elle sayım */
  "ks-d32-grup-birebir-e2e.mjs": 20, /* D32-GRUP-2UYE: elle sayım (gerçek form akışı + eşik regresyonu) */
  "ks-grup-uye-yaz.mjs": 49, /* D34-GRUP-UYE-YAZ: elle sayım (TEK KAPI invariant: 4 yazım yolu + düzenleme koruması + havuz editörü + WA) · D37-HUCRE-GRUP +6 (havuz kartı DOM yerleşimi: TEK dış grid hücresi) · D38-UYE-BUTON-TOGGLE +5 (buton aç/kapa: "Kapat" · aynı buton kapatır · TEK açık editör) · D39-UYE-ARAMA +13 (editörde öğrenci arama: NFC+tr-TR normalize · seçili üye filtre dışında da görünür/İŞARETLİ · odak korunur) */
  "ks-d35-ad-sinif.mjs": 26, /* D35-AD-SINIF + RİSK: elle sayım (çizelge hücresi ad+sınıf · uzun soyad kısaltma · nowrap kapsamı · dar hücre fixture · boş sınıf hücre/chip · etki sınırı) */
};
