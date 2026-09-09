# PROJE REHBERİ — önce burayı oku

- `index.html` = HTML iskeleti + giriş (ek-ders.js, app.js ve vendor/* yüklüyor)
- `app.js` = ana uygulama kodu (index.html'in ana inline script bloğu; KS v2 dahil)
- `ek-ders.js` = Ek Ders sekmesi + kısa kod (KS) fonksiyonları
- Testler: `node ks-harness.mjs` ve `node ks-test-render.mjs`
- ⚠️ **Kritik:** index.html'de düzenleme yaparken str_replace takılırsa doğrudan assert'li Node script kullan
- **Protokol:** tek iş → test → rapor

---

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

---

# ✅ CHECKPOINT: Ana Inline Script → app.js (Tek Doğru Kaynak)

**Tarih:** 9 Eylül 2026 · **Durum:** ✅ Tamamlandı, assert'li Node script'i ile doğrulandı

## Karar

`index.html`'deki ana inline script bloğu (satır 328, ~130.4k karakter, "YKS Birebir Takip")
ile kök dizindeki `app.js` karşılaştırıldı:

- **Aynı değillerdi.** `app.js` KS v2 öncesi eski sürümdü (0× `KISA_KOD`/`saatEtiket`,
  7 fark grubu; inline'da olmayan fonksiyon: YOK).
- Kullanıcının kuralına göre **inline kaynak kabul edildi; `app.js` üzerine yazıldı**
  (ana bloğun birebir kendisi, baştaki boş satır ve sondaki boşluklar normalize edilerek).
- `index.html`'de bloğun yerine `<script src="app.js"></script>` kondu.

## Sonuç (boyut + SHA-256)

| Dosya | Önce | Sonra | Yeni SHA-256 |
|---|---|---|---|
| index.html | 153.486 B (`226a5d32…`) | 21.153 B (400 satır) | `5b691039f85c612b02a19ce11635260b3a523ae2256196fb581a1ba9f9dd00dd` |
| app.js | 127.683 B (`56943c40…`, eski) | 132.345 B (2.108 satır) | `f2034775a348d8a7670c45dd4f7731026a0fce8528b98c0bd0f99afc22433fe4` |

Kalıcı olarak 2 inline blok kaldı: `tailwind.config` (satır 13) ve atlama menüsü (satır 330).
Script yüklenme sırası: `ek-ders.js` (defer) → `vendor/tailwind.js` → tailwind.config →
`vendor/chart.js` → `vendor/html2canvas.js` → `app.js`.

## Script'in Assert Ettikleri

- 3 inline blok beklenip bulundu; blok kimlikleri (tailwind.config / ana uygulama / atlama menüsü) doğrulandı.
- Silme güvenliği: `app.js`'te inline'da olmayan fonksiyon/üst-düzey değişken olmadığı
  (fonksiyon adı karşılaştırması: fark 0) assert edildi.
- Dönüşüm birebirliği: blok metni tag'iyle birlikte hedeflendi; `htmlAfter.replace(tag, target)
  === htmlBefore` assert'i başka hiçbir bayta dokunulmadığını kanıtladı.
- Çift uygulama koruması: hedef tag zaten varsa script reddetti.
- Yeni `app.js` 'te `saatEtiket`/`KISA_KOD` varlığı (KS v2) doğrulandı.

## Test Dosyalarında Eş Zamanlı Güncelleme

`ks-harness.mjs` ve `ks-test-render.mjs` ana kodu artık `app.js`'ten okuyor
(inline bloklar hâlâ index.html'den alınıp aynı sırada birleştiriliyor —oot sırası tarayıcıdakiyle aynı kalır).

## Doğrulama

- `node --check app.js` ve `node --check ek-ders.js`: OK
- `ks-harness.mjs`: **33/33 geçti**
- `ks-test-render.mjs`: **12/12 geçti**
- `ek-ders.js` (29.588 B, `a2a421fb…`) ve `vendor/*`: birebir aynı, dokunulmadı

---

# ✅ CHECKPOINT: Kısa Kod Sistemi Çalışan Durum (v2)

**Tarih:** 9 Eylül 2026 · **Durum:** Çalışıyor, testleri geçmiş, kaydedildi.

## Bu Checkpoint'in Dosya Bütünlüğü (SHA-256)

| Dosya | Boyut | SHA-256 |
|---|---|---|
| index.html | 331.857 bayt (2.512 satır) | `56c3b6a03b6cc2c9c2e40e95d5c5945277cfb2c0e54a3794385d79305bc7cb78` |

> ⚠️ **9 Eylül 2026 güncellemesi:** Aşağıdaki "Font Ayrımı" bölümüne bakın —
> `index.html` artık 153.486 bayt ve checksum'u değişti (base64 font blokları
> `vendor/fonts.css`'e taşındı). Yukarıdaki index.html satırı yalnızca o tarihten
> önceki durum için geçerlidir. `ek-ders.js` ve `vendor/` checksum'ları hâlâ geçerlidir.

| ek-ders.js | 29.588 bayt (435 satır) | `a2a421fb5b8136039d31f9e8df6237a617975f99c340673b0ead718c6d2ad691` |
| vendor/tailwind.js | 407.280 bayt | `7afa0afd2536044695e7e674298bc0dda9af94475e4e07d0575feccfa796c74f` |
| vendor/fontawesome.css | 1.305.692 bayt | `f69efe0fb3372fe8aca04af3664ec926cda67b34772246ae416fb4d1bf040ac8` |
| vendor/html2canvas.js | 198.690 bayt | `669b68b0b6828272e5298a36f20a646b027b2cdf5b524ec05b2410009e75063e` |
| vendor/chart.js | 205.400 bayt | `19dfdc0ce3bd0e46eaf94db65617f7be79c1ba50fdeadd2a5f33258633fcf1b7` |

Not: `index.html`, 7 Eylül checkpoint'inden sonra kısa kod sistemiyle değişti
(321.430 → 331.857 bayt); vendor dosyaları ise birebir aynıdır.

## Test Dosyaları (regresyon için kök dizinde kalıcı)

- `ks-harness.mjs` — 33 mantık testi (aralık kuralı, taşıma, anahtar göçü, çakışma, yedek yükleme). Çalıştır: `node ks-harness.mjs`
- `ks-test-render.mjs` — 12 render testi (grid 11×7, günlük tablo Mola 4–5 arası, `f-saat` select, ek-ders.js boot). Çalıştır: `node ks-test-render.mjs`

## Güncelleme: Base64 Font Bloklarının vendor/fonts.css'e Ayrılması

**Tarih:** 9 Eylül 2026 · **Durum:** ✅ Tamamlandı, assert'li Node script'i ile doğrulandı

`index.html`'in 11–14. satırlarındaki `<style>` bloğundaki 2 Inter `@font-face`
(base64 woff2 gömülü) kesilip `vendor/fonts.css`'e taşındı; yerine
`<link rel="stylesheet" href="vendor/fonts.css">` kondu (satır 11,
`vendor/tailwind.js`'ten hemen önce).

| Dosya | Boyut | SHA-256 |
|---|---|---|
| index.html (sonra) | 153.486 bayt | `226a5d326ee1adb6a0d695c91f8b586b508f33875d6cbb4944ee45b1200cbcbf` |
| vendor/fonts.css | 178.509 bayt | `b801b3a0b95140edae0deabbee362ddc9723dd03affcbe518401548f00e21af4` |

- Taşınan font verisi bayt bayt korundu: 2 adet woff2, 48.256 B + 85.068 B
  (base64 decode edilip `wOF2` magic byte'larıyla doğrulandı).
- Toplam kesilen: 178.371 bayt. Dosya başlıklarının diğer hiçbir yeri değişmedi
  (script, çıktının girdinin birebir "satır 11–14 → link" dönüşümü olduğunu assert etti).
- Script ikinci kez çalıştırıldığında güvenli şekilde reddetti (idempotent değil, korumalı).
- Doğrulama: `ks-harness.mjs` 33/33, `ks-test-render.mjs` 12/12 — HEPSİ GEÇTİ.

## Geri Dönüş

- Zaman damgalı yedek zip'i: `backups/` klasöründe (node_modules, .git ve .env hariç tüm proje).
- Kod düzeyinde geri dönüş: `ks-patch.mjs` / `ks-patch2.mjs` yamalarının tersini uygulamak yerine bu zip'teki `index.html` ve `ek-ders.js` kopyalanır.
  (Not: `ks-patch.mjs` 9 Eylül temizliğinde silindi — yine de geri dönüş zip'i `backups/` içinde duruyor.)

---

# ✅ CHECKPOINT: Kullanılmayan Dosyaların Temizliği

**Tarih:** 9 Eylül 2026 · **Durum:** ✅ Tamamlandı, tüm doğrulamalar geçti

## Silinen Dosyalar (7)

| Dosya | Neden |
|---|---|
| `ks-patch.mjs` | Tek seferlik yama script'i; hiçbir kod dosyasından referansı yoktu |
| `src/` (tüm klasör) | Eski React/Convex iskeleti (93 dosya); `index.html` hiç referans vermiyordu |
| `main.ts` | Deno `serveStatic` sunucu kalıntısı; hiçbir tsconfig include'unda değil |
| `convex.json` | Silinen `src/convex/` klasörünü işaret ediyordu |
| `sst-env.d.ts` | SST kalıntısı |
| `components.json` | shadcn yapılandırması; yalnızca silinen React iskeletince kullanılıyordu |
| `public/manifest.webmanifest` | `index.html`'de referans yoktu; `public/logo.svg` korundu |

Not: `.nodetest.txt`, `.writetest.txt`, `app_tmp.js` istek listesindeydi ama repoda zaten mevcut değillerdi.

## Korunan Dosyalar (dokunulmadı)

`package.json`, `tsconfig.json`, `bun.lock`, `vendor/`, `index.html`, `app.js`,
`ek-ders.js`, `ks-harness.mjs`, `ks-test-render.mjs`

## Temizlik Sonrası Doğrulama

- `ks-harness.mjs`: 33/33 test geçti (HEPSİ GEÇTİ)
- `ks-test-render.mjs`: 12/12 test geçti (regresyon için korundu)
- `bun tsc -b --noEmit`: hatasız (exit 0)
- `node --check app.js` ve `node --check ek-ders.js`: OK
- SHA-256: `index.html`, `ek-ders.js` ve 4 `vendor/` dosyası bir önceki checkpoint
  ile bayt bayt aynı — uygulama koduna dokunulmadı.

## Temizlik Sonrası Kök Dizini

`index.html` (331.857 B), `app.js` (127.683 B), `ek-ders.js` (29.588 B),
`ks-harness.mjs`, `ks-test-render.mjs`, `vendor/` (4 dosya), `public/logo.svg`,
`package.json`, `bun.lock`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`,
`postcss.config.cjs`, `vly-toolbar-readonly.tsx`, `CHECKPOINT.md`, `README.md`,
`integrations.md`, `.env*`, `.gitignore`, `.prettier*`
