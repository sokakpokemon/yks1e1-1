# Checkpoint: Vendor Kütüphane Ayrımı — Çalışan Durum

**Tarih:** 7 Eylül 2026
**Durum:** ✅ Çalışıyor ve doğrulandı. Bu nokta kaydedildi.

## Yapılan İş

`index.html` içinde gömülü durumdaki 4 kütüphane bloğu (okunmadan/değiştirilmeden, olduğu gibi)
`vendor/` klasörüne ayrı dosyalar olarak çıkarıldı:

| Dosya | Boyut | SHA-256 |
|---|---|---|
| index.html | 321.430 bayt (2.264 satır) | `e8456c0775853ac812cc400361e1e4511900c4aa45bd301329b03cae1e823866` |
| vendor/tailwind.js | 407.280 bayt | `7afa0afd2536044695e7e674298bc0dda9af94475e4e07d0575feccfa796c74f` |
| vendor/fontawesome.css | 1.305.692 bayt | `f69efe0fb3372fe8aca04af3664ec926cda67b34772246ae416fb4d1bf040ac8` |
| vendor/html2canvas.js | 198.690 bayt | `669b68b0b6828272e5298a36f20a646b027b2cdf5b524ec05b2410009e75063e` |
| vendor/chart.js | 205.400 bayt | `19dfdc0ce3bd0e46eaf94db65617f7be79c1ba50fdeadd2a5f33258633fcf1b7` |

Not: Tailwind Play CDN bir JavaScript dosyası olduğu için `vendor/tailwind.css` yerine
`vendor/tailwind.js` olarak kaydedildi; `.css` uzantısı çalışmasını bozar.

## index.html'deki Bağlantılar (değiştirilmedi, sadece işaret edildi)

- Satır 14: `<script src="vendor/tailwind.js"></script>` (ardından kullanıcıya ait `tailwind.config` bloğu — korundu)
- Satır 24: `<link rel="stylesheet" href="vendor/fontawesome.css">`
- Satır 25: `<script src="vendor/chart.js"></script>`
- Satır 26: `<script src="vendor/html2canvas.js"></script>`

## Doğrulama Sonuçları

- index.html içinde kütüphane kodu kalmadı (Font Awesome / Chart.js / html2canvas / Tailwind / CDN marker taraması: 0 eşleşme).
- FontAwesome fontları CSS içinde base64 data-URI olarak gömülü; ayrı font dosyası gerekmiyor, `vendor/fonts/` klasörü oluşturulmadı.
- Kullanıcının kendi Inter `@font-face` blokları (satır 11–12) korundu — bunlar kütüphane değil.
- HTML yapısı bozulmadı: `</head>` satır 60, `</body></html>` dosya sonu.
- Kullanıcının Türkçe kodları, fonksiyonları, örnek verileri ve localStorage mantığına dokunulmadı.
- FontAwesome CSS'te `../webfonts/` gibi dış font referansı yok (0 eşleşme) — dosya kendi kendine yeterli.

## Bu Checkpoint'ten Geri Dönmek / Tutarlılığı Kontrol Etmek İçin

Yukarıdaki SHA-256 değerleri ile dosya bütünlüğü doğrulanabilir:

```bash
sha256sum index.html vendor/*
```

Değerler tabloyla eşleşiyorsa, bu checkpoint'teki çalışır durum aynıdır.

## Güncelleme: Kısa Kod (Ders Saati) Sistemi v2 — Tamamlandı

**Tarih:** 9 Eylül 2026 · **Durum:** ✅ Tamamlandı, 33 mantık testi geçti

- `KISA_KOD` (11 ders saati) tek gerçek kaynak; Mola seçilemez.
- `ksKodOf` aralık kuralı: başlangıç saati hangi aralığa düşerse o kod (16:00 → 8. ders).
- `ksGec`: kod'suz dersleri aralık kuralıyla taşır; belirsizleri (ör. 12:30) DOKUNMADAN amber rapor kartında listeler.
- `ksVerGec` (v2, tek seferlik, `DB.ksVer` bayrağı): eski `X-9`/`X-10` müsaitlik/sınıf programı anahtarlarını kısa kod anahtarlarına çevirir.
- Form: `DERS SAATİ` açılır listesi (11 seçenek); dolum `renderFormDestek`'te (tanım-öncesi çağrı hatası giderildi).
- Çakışma, kilit, istek-bırakma: GÜN + kısa kod bazlı. `Çakışmayı Yoksay` aynen çalışır.
- Tablolar: ana liste, haftalık öğretmen grid'i, müsaitlik grid'i ve günlük tablo `8 · 15:30-16:10` formatında; günlük tabloda Mola 4 ile 5 arasında.
- Yazdır/PDF, PNG, WhatsApp, kopyala ve toast mesajları aynı etiketi (`saatEtiket`) kullanır.
- `ek-ders.js` birebir aynı sisteme çevrildi: DERS SAATİ select, kısa kod çakışma, etiketler, not metni.
- seed: eski `X-9/X-10` anahtarları ve 12:00 çökmesi giderildi (12:00 satırları 4. derse eşlenir).
- Yedek al/yükle: eski yedekler `normalize + ksGec` ile otomatik taşınır (test edildi).
- Doğrulama: `node --check ek-ders.js`, 4 inline script sözdizimi, `ks-harness.mjs` (33 test) — hepsi geçti.
