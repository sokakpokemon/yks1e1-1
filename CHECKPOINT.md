# PROJE REHBERİ — önce burayı oku

- `index.html` = HTML iskeleti + giriş (ek-ders.js, app.js ve vendor/* yüklüyor)
- `app.js` = ana uygulama kodu (index.html'in ana inline script bloğu; KS v2 dahil)
- **app.js bölgeleri (SECTION ayracı → yaklaşık satır aralığı, dosya 2.117 satır):** `SABİTLER VE KISA KOD (KS)` 6–137 · `YARDIMCILAR VE VERİ KATMANI` 138–288
- `ARAYÜZ DURUMU VE GENEL KONTROLLER` 289–367 · `RENDER: ÖZET VE ANALİZ` 368–562
- `YÖNETİM — ÖĞRETMEN · ÖĞRENCİ · AYAR` 563–1087 · `TALEP HAVUZU` 1088–1193
- `BOOT VE DERS PLANLAMA` 1194–1397 · `TAKVİM, DERS LİSTESİ VE PAYLAŞIM` 1398–dosya sonu (2.117)
- **ID şeması (KİMLİK-YAMASI, 13 Eylül 2026):** `ogrenciler[].id` / `ogretmenler[].id` = UUID (mevcut) veya eksikse `ks-ogr-XXXX-<t36>-<r6>`; sınıf kimliği `DB.sinifIds[ad]` = `ks-snf-XXXX-<t36>-<r6>` (sinifProg anahtarları AD olarak kalır, geriye dönük uyum). Tamamlama `kimlikleriTamamla()` — `normalize()` sonunda + boot'ta çalışır, İDEMPOTENT (mevcut geçerli ID'lere dokunmaz, tekrar çalıştırmada ID değişmez). Referanslar (ders/istek `ogrenciId/ogretmenId/ogrenciIds`) asla taşınmaz. Test: `ks-benzersiz-id.mjs` (46 test). Aşağıdaki kendi checkpoint bölümüne bakın.
- `ek-ders.js` = Ek Ders sekmesi + kısa kod (KS) fonksiyonları
- Testler (tek komut: `node test.mjs` — 8 süiti sırayla çalıştırır, özet verir; toplam **269/269**): `ks-harness` 34 · `ks-test-render` 14 · `ks-durum-fn` 20 · `ks-grup-uyum` 41 · `ks-panel-secim` 32 · `ks-grup-gorunum` 28 · `ks-istekten-grup` 32 · `ks-grup-istegi` 68
- Durum seçici çubuğu (takvim düzenleme): `ui.seciliDurum` + `ui.seciliOgrId`; butonlar `tumSiniflar()`'dan otomatik (DB), en sonda Kapalı. `durumSec(val, ogrId)` seçer, `togOgrSecili(tid, di, saat)` hücreye uygular — aynı hücreye 2. tıklama Boş yapar (döngü yok). Görünen "Müsait Değil" etiketleri "Kapalı" oldu; davranış kaydı `avail.musait` aynı kaldı. Eski "Sınıf Dersi" hücreleri korundu (68 hücre, seed verisinde) — kullanıcı sonradan yeniden işaretleyecek. İşlevsel test: `ks-durum-fn.mjs` (20 test)
- ⚠️ **Kritik:** index.html'de düzenleme yaparken str_replace takılırsa doğrudan assert'li Node script kullan
- **Protokol:** tek iş → test → rapor

---

# VERİ ŞEMASI — localStorage & Yedek

Tek anahtar: `yksOto_arsiv_v1` (app.js `LS_KEY`; ek-ders.js aynı DB'yi paylaşır). Değer `bosDB()` şemasında JSON'dur:

- `kurulus` — tarih `"YYYY-MM-DD"` · ör: `"2026-09-09"`
- `ksVer` — kısa kod şema sürümü; `2` = geçiş tamam (`ksGec` yalnız `ksVer<2`'de çalışır) · ör: `2`
- `ogretmenler[]` — `{id, ad, brans, avail}` · ör: `{"ad":"SONER AÇIKGÖZ","brans":"mat","avail":{"sinif":{"0-1":"MEZUN SAY 1"},"musait":["4-1","5-1"]}}`
- `ogrenciler[]` — `{id, ad, sinif, tel}` · ör: `{"ad":"Ayşe Demir","sinif":"12 SAY 1","tel":""}`
- `sinifProg{}` — sınıf adı → gün-kod hücre listesi ⚠️KS · ör: `{"MEZUN SAY 1":["0-1","2-1","3-1","5-1","0-2"]}`
- `istekler[]` — `{id, ogrenciId, ogrenciAd, dersId, konu, durum, olusturma, saat?}` · ör: `{"ogrenciAd":"Zeynep Kaya","dersId":"mat","konu":"Limit ve Süreklilik","durum":"bekliyor","olusturma":"2026-09-07","saat":"15:30"}`
- `dersler[]` — `{id, ogrenciId, ogrenciAd, dersId, konu, ogretmenId, ogretmenAd, tarih, saat, kod, durum, olusturma}` ⚠️KS · ör: `{"ogrenciAd":"Ali","dersId":"mat","ogretmenAd":"TEST Ö","tarih":"2030-01-07","saat":"15:30","kod":"8","durum":"planlandi"}`

Anahtar biçimleri:
- Hücre anahtarı = `GÜN-KOD` (GÜN: 0=Pzt…6=Paz; KOD: ders kısa kodu 1–11, Mola yok) · ör: `"3-8"` = Perşembe 8. ders (15:30-16:10)
- `durum` değerleri: istekler `bekliyor`; dersler `planlandi` / `tamamlandi` / `iptal`
- ⚠️ KS geçişi (`ksGec`, tek seferlik `ksVer<2→2`) etkiledikleri: `dersler[].saat+kod` (16:00→15:30/kod 8; belirsiz saatlere dokunulmaz), `ogretmenler[].avail.musait` + `avail.sinif` + `sinifProg` anahtarları (eski `GÜN-SAATNO` → `GÜN-KOD`, ör. `"1-10"→"1-2"`). `istekler` taşınmaz.

Yedek biçimi (`yedekAl` → `yks-birebir-yedek-YYYY-MM-DD.json`): `{"uygulama":"YKS Birebir Takip","surum":1,"tarih":"<ISO>","veri":<DB>}` — `yedekOku` `veri`siz eski dosyaları da kabul eder; yükleme `normalize()` + `ksGec()` ile otomatik uyumlar.

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

---

# ✅ CHECKPOINT: Grup Dersi — Kaydetme + Çakışma Entegrasyonu

**Tarih:** 11 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **109/109 OK**

## Yapılan İş (app.js — baştan yazma YOK, bölgesel yama)

1. **Grup kaydı (`planla()`)** — formda `ui.ekOgrenciIds`'te 2+ öğrenci varsa TEK ders kaydı
   `ogrenciIds` dizisiyle oluşur (kopya yok); `ogrenciId`/`ogrenciAd` uyumluluk için korunur.
   1 öğrenci → eski birebir akış birebir aynı (`ogrenciIds` YAZILMAZ).
2. **Çakışma kontrolü (`duzeltmeBul(adet, yokSay, grupOgrenciIds)`)** — öğretmen meşguliyetinin
   yanısıra her grup öğrencisi o gün+kod'da kontrol edilir (`sinifProg` + mevcut dersler,
   `dersOgrenciIds` ile); çakanlar ADLARIYLA uyarıda listelenir. Düzenlemede ders kendisiyle
   çakışmaz (`l.id !== (adet.id || "")`).
3. **`dersOgrenciIds` birleşim anlambilimi** — grup kaydında `[ogrenciId, ...ogrenciIds]`
   (tüm katılımcılar) döner; böylece grubun ana öğrencisi de sonraki rezervasyonlarda
   çakışma kontrolünde meşgul sayılır. Eski tekli kayıtlar değişmez (`[ogrenciId]`).
4. **avail şema sapması (L1483 kuralı)** — `planla()` kaydetmeden önce öğretmen `avail`'ini
   `normalize()` ile aynı kural setiyle düzeltir (sinif dizi→obje "Sınıf Dersi", musait dizi).
5. **Panel konumu** — `#ek-ogrenciler` ÖĞRENCİ alanının hemen altında (`#f-ogrenci` afterend),
   idempotent guard korundu; `temizleForm()` grup chip listesini sıfırlar.

## Yeni/Değişen Bölgeler (satır numaraları ~)

- `dersOgrenciIds` birleşim: L226–234 · `duzeltmeBul` grup çakışması: L1432–1452
- `planla()` grup modu + avail normalize: L1487–1519, kayıt dalı L1521–1553
- `#ek-ogrenciler` paneli: L1328–1344 · `temizleForm` sıfırlama: L1413–1422

## Testler

- `ks-grup-uyum.mjs`: **41 test** (26 mevcut + 15 yeni: senaryo A/B/C + avail normalize)
- `ks-yama-avail.mjs`, `ks-yama-union.mjs`: assert'li, idempotent yama script'leri (kayit amaçlı)
- Doğrulama: `node --check app.js` OK · `node test.mjs` → **109/109 OK** (34+14+20+41)
- `ek-ders.js` dokunulmadı.

---

# ✅ CHECKPOINT: Grup Paneli v2 — Checkbox Panel + Düzenleme Desteği

**Tarih:** 11 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **141/141 OK**

## Yapılan İş (app.js — baştan yazma YOK, hedefli yama)

1. **Chip yapısı kaldırıldı** → `#ek-ogrenciler` paneli: başlık + aç/kapat (`grupPanelToggle`),
   `#grup-ozet` özeti ve açılır `#grup-panel-govde` gövdesi.
2. **Panel içeriği:** `#grup-panel-arama` arama kutusu (TR-büyük/küçük duyarsız) +
   `#grup-panel-sinif` sınıf filtresi (`grupPanelTumSiniflar` DB'den otomatik, "Tüm sınıflar" ilk seçenek) +
   her öğrenci satırında checkbox; ana öğrencinin kutusu `disabled` + "Ana" etiketi.
3. **Sınır yok:** sabit 5 öğrenci sınırı kaldırıldı; 10+ seçimde YALNIZCA `#grup-panel-uyari`
   amber uyarı kartı (engelleme yok); 10'un altında uyarı kaybolur.
4. **Kapalıyken özet:** panel kapalıyken `#grup-ozet` "N öğrenci seçildi" + çıkarılabilir chipler
   (taşma yerine kompakt özet).
5. **Düzenleme:** `duzenle()` ders kaydından `dersOgrenciIds(l)` ile TÜM katılımcıları yükler —
   ilki ana öğrenci (form + `panelSecim.anaId`), kalanlar `ui.ekOgrenciIds`'te seçili; panel AÇIK açılır.
   Ekleme/çıkarma canlı; ana değişince eski ana ek listede kopya OLUŞMAZ (`grupPanelAnaDegisti` +
   `planla()` filtresi); aynı öğrenci iki kez seçilemez (toggle + dedupe).
6. **Tek öğrenci:** birebir akış birebir aynı — `ogrenciIds` YAZILMAZ (test #7 assert eder).
7. **DOKUNULMADI:** tablolar, WhatsApp çıktısı, istek havuzu (talimat gereği).

## Testler

- Yeni: `ks-panel-secim.mjs` — **32 test** (panel shell, arama, sınıf filtresi, çift seçim,
  12 seçim = sınır yok, 10+ uyarı gör/kaybol, ana kuralı, düzenleme yükleme, birebir akış).
- `test.mjs` güncellendi (5 dosya). Doğrulama: `node --check app.js` OK · `node --check ek-ders.js` OK ·
  `node test.mjs` → **141/141 OK** (34+14+20+41+32).
- Bölgeler (~): panel L1331–1485 · duzenle L2144–2147 · planla grup dalı L1601–1653.

---

# ✅ CHECKPOINT: Grup Görünümü — Tablo/Badge + WhatsApp/PNG + Analiz Dağıtımı

**Tarih:** 11 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **169/169 OK**

## Yapılan İş (app.js — baştan yazma YOK, hedefli yama: ks-yama-gorunum.mjs)

1. **Yardımcılar (L166–252):** `ilkHarfler`, `grupOgrenciAdlari` (tüm üyeler, ana ilk),
   `grupUyeEtiketleri` (yalnız ek üyeler), `grupBadgeHTML` (+N özeti/aç-kapa),
   `grupUyeToggle` (`ui.grupAcikOgrId`), `grupUyeSatirlari`. Birebirde hepsi boş döner → eski görünüm birebir.
2. **Ders listesi:** ana öğrenci tam ad + `grupBadgeHTML(l)` baş harf badge'leri (örn. "Zeynep Kaya [ZK][EA]").
3. **Haftalık öğretmen grid'i:** grup hücresinde sınıf yerine üye baş harfleri ("ZK · EA"); birebirde sınıf, eski hâl.
4. **Günlük tablo:** grup hücresinde alt yazıya üye baş harfleri eklenir; birebirde eklenmez.
5. **Badge davranışı:** ≤2 ek üyede tümü görünür; 3+ üyede ilk 2 + "+N" özeti; badge/özet tıklanınca
   **TÜM İSİMLER tam ad olarak alt alta** (`block w-max`), "−" ile daraltma.
6. **WhatsApp:** grup dersinde `👥 Zeynep Kaya, Emir Aydın` satırı; birebirde metin bayt bayt eski hâli.
7. **PNG raporu:** grup satırında tüm adlar "Ad1, Ad2"; birebirde tek ad.
8. **Analiz:** öğrenci bazlı dağılımda grup dersi HER üyesine sayılır (`dersOgrenciIds` ile); ders sayısı TEK kalır.

## Testler

- Yeni: `ks-grup-gorunum.mjs` — **28 test** (yardımcılar, badge +N/aç-kapa/tam-ad-alt-alta, ders listesi,
  günlük/haftalık tablo, WhatsApp, PNG, analiz dağıtımı, birebirlerde eski görünüm).
- `test.mjs` 6 suite'e güncellendi. `ks-yama-gorunum.mjs` idempotent hâle getirildi
  (uygulanmışlık kontrolü `copyFileSync`'ten ÖNCE; tekrar koşuda "Zaten uygulanmış" der, .bak bozulmaz).
- Doğrulama: `node --check app.js` OK · `node --check ek-ders.js` OK · `node test.mjs` → **169/169 OK** (34+14+20+41+32+28).
- Geri dönüş: `app.js.yama-gorunum-oncesi.bak` (son yama öncesi hâl; tam öncesi için `backups/` zip'i).

---

# ✅ CHECKPOINT: İstekten Planlamada Grup Seçimi Etkin

**Tarih:** 11 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **201/201 OK**

## Teşhis (kod yazılmadan önce)

- Planlama fonksiyonu `planla()` app.js L1637; havuz render `renderHavuz()` L1222; istek→form `formaAktar()` L1302.
- `renderFormDestek()` (L1358) paneli yalnız `#f-ogrenci` altına ekliyordu → **`#h-ogrenci` (havuz girişi) altına EKLENMİYORDU**.
- `formaAktar()` `ui.aktifIstekId` set ediyordu; panel/`ui.ekOgrenciIds` state'ine DOKUNMUYORDU (eski seçim taşınma riski).
- `planla()` grup dalı (L1661–1697) tek kayıt oluşturuyordu AMA `ui.aktifIstekId`'yi yalnız birebir dal kapatıyordu (L1740) → istek "bekliyor" kalıyordu.
- İstek kayıt modeli zaten tek öğrenci sahipli (`istekler[].ogrenciId`) — DEĞİŞTİRİLMEDİ.

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-istekten-grup.mjs idempotent yama)

1. **Yama 1:** `renderFormDestek()` paneli `#h-ogrenci` altına da ekler (aynı `ekPanel` markup'ı, idempotent DOM guard — ikinci kez OLUŞTURULMAZ).
2. **Yama 2:** `planla()` grup dalı kayıttan sonra `ui.aktifIstekId` varsa istek `durum="planlandi"` yapar; **istek sahibi (ogrenciId) ve tüm alanlar aynen kalır**. Birebir dalın eski davranışı birebir korunur.
3. **Yama 3:** `formaAktar()` panel state'ini temiz başlatır (`ui.ekOgrenciIds=[]`, panel kapalı) — ardışık isteklerde eski seçim taşınmaz.
4. **Sahip kilidi:** panelde ana öğrenci checkbox'ı `disabled` + "Ana" etiketi (`grupPanelAnaDegisti` mevcut kuralı); sahibi `ogrenciId`, seçilenler `ogrenciIds`; `dersOgrenciIds` tüm katılımcıları döner.
5. **Çakışma:** `duzeltmeBul` grup üyelerini öğretmen + her öğrenci için kontrol eder, çakanlar ADLARIYLA uyarıda; yoksayılmadıkça kayıt oluşmaz.
6. **Sınır yok:** 10+ seçimde yalnızca amber `#grup-panel-uyari`; kayıt engellenmez.

## Testler

- Yeni: `ks-istekten-grup.mjs` — **32 test** (panel DOM, tek kayıt, alan semantiği, istek korunumu, isimli çakışma, tekli akış, 10+ engelsiz).
- `test.mjs` 7 suite'e güncellendi. Yama idempotent: 2. koşuda "Zaten uygulanmış" der (exit 2), dosyayı bozmaz.
- Doğrulama: `node --check app.js` OK · `node --check ek-ders.js` OK · `node test.mjs` → **201/201 OK** (34+14+20+41+32+28+32).
- Geri dönüş: `app.js.istekten-grup-oncesi.bak` (yama öncesi hâl).

---

# ✅ CHECKPOINT: Grup İsteği — Ortak Talep Modeli + Uyumluluk

**Tarih:** 12 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → 201/201 + yeni süit (dönem toplamı)

## Veri Modeli + Uyumluluk

- `istekler[]` eski tekli `{ ogrenciId, ... }` aynen çalışır; grup isteği `{ ogrenciId: ana, ogrenciIds: [ekler], ... }`.
- `ogrenciIds` yalnız ana dışı, benzersiz ek üyeler; ayrı `ogrenciAdlari` alanı YOK — adlar `DB.ogrenciler`'den dinamik üretilir.
- `istekOgrenciIds(istek)` idempotent: `[ogrenciId, ...(ogrenciIds||[])]` benzersiz/geçerli; `ogrenciIds` olmayan eski istekte hata vermez.
- `normalize()` eski tekliyi kayıpsız tutar; yeni diziyi benzersiz + ana dışı normalize eder. `yedekAl/yedekOku` grup üyelerini deep-equal korur.
- **ksVer kısa kod göçüne dokunulmadı**; yeni göç sistemi eklenmedi.

## Akış

- Havuzda "Ortak Grup İsteği": mevcut checkbox paneli YENİDEN kullanılır (arama + sınıf filtresi + "Tüm sınıflar" + sayaç; aynı id'ler iki formda çoğaltılmaz). Min 2 zorunlu; 10+ seçimde yalnızca uyarı, engel yok; ilk seçilen ana `ogrenciId`, kalanlar `ogrenciIds`.
- Havuzda grup isteği TEK kayıt; üyeler `istekOgrenciIds()` ile listelenir.
- İstekten grup planlama: tüm üyeler otomatik seçili; TEK ders kaydı; `ders.ogrenciId` ana + `ders.ogrenciIds` ekler; `dersOgrenciIds(ders)` tüm katılımcılar; çakışma öğretmen + tüm üyeler, çakanlar ADLARIYLA; planlama sonrası istekte yalnızca `durum:"planlandi"` değişir (deep-copy snapshot ile kanıtlı).

## Testler

- `ks-grup-istegi.mjs` — assert'li süit (eski istek bozulmuyor, yedek/geri yükleme, min-2, ana/benzerlik, 10+ engelsiz, tek kayıt, isimli görünüm, tek ders, otomatik üye, çakışma, deep-copy yalnız-durum, idempotans).
- Geri dönüş: `app.js.grup-istegi-oncesi.bak`, `app.js.grup-istek-2-oncesi.bak`, `ks-grup-istegi.onceci.bak`.

---

# ✅ CHECKPOINT: Grow-Only Sıra Register'ı + Panel Gövde + Tarih-Bağımsız Render

**Tarih:** 13 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **269/269 OK**

## Kök Neden (ks-izle-sira.mjs ile kanıtlandı)

- Grup seçim register'ı **silmede küçülüyordu**: remove→re-add sonrası `[Emir, Zeynep]` (beklenen `[Zeynep, Emir]`) — Zeynep eski slotunu yitirip sona itiliyordu.
- `grupPanelGovdeHTML()` liste div'ini **boş** üretiyordu → açık panelde `#grup-panel-govde` innerHTML'inde öğrenci satırları/`checked` yok (süit 7 kırmızı).
- `ks-test-render.mjs` tarih-bağımlıydı: `ui.anchor` bugünün gününe (Pazar) sabitleniyor, seed dersleri Pzt–Cmt olduğu için günlük tablo "ders yok" çiziyordu (4 kırmızı; `gunlukTablo`+`seedDB` kodu 201/201 yedeğiyle birebir aynıydı — kod bozulmamıştı).

## Yapılan İş (ks-yama-v5.mjs — idempotent, assert'li, exact-anchor; app.js baştan yazma YOK)

- **A) Grow-only register:** register yalnız büyür — kaldırma SİLMEZ, yeniden seçim eski slota döner, duplicate girmez; panel listesi register sırası filtrelenerek üretilir; register yalnız yeni form/başka istek bağlamına geçişte kontrollü sıfırlanır (her render/toggle'da kurulmaz).
- **B) Panel gövde:** `grupPanelGovdeHTML()` arama + sınıf filtresi + öğrenci listesi + sayaç üretir; kapalıyken `#grup-panel-govde` gerçekten BOŞ; aç-kapat-aç sonrası seçim sırası ve checkbox durumları korunur.
- **C/D) Süit düzeltmeleri (assertion gevşetilmedi):** `grupPanelToggle()` satırı açık-panel çizimiyle değiştirildi (`formaAktar` paneli zaten açık açtığından toggle kapatıyordu) + `grupPanelCiz` EXPORTS/destructuring'e eklendi + D-loadDB parçası idempotent hale getirildi.
- **E) Render tarih-bağımsızlığı:** `ui.anchor` seed haftasının Pazartesi'sine sabitlendi (mutlak bugüne değil).

## Doğrulama

- Yama 2. koşu: "zaten uygulanmış" der (exit 2), dosyayı değiştirmez.
- `node --check app.js` · `node --check ek-ders.js` · `node --check ks-grup-istegi.mjs` → OK.
- `node test.mjs` → **269/269 OK** (34+14+20+41+32+28+32+68).
- Remove→re-add kanıtı: `[Zeynep, Emir]` → kaldır → `[Emir]` → yeniden ekle → `[Zeynep, Emir]` (slot korunur).
- Geri dönüş: `app.js.v5-oncesi.bak`.
- Kalan riskler: tanı scriptleri (`ks-izle-sira.mjs`, `ks-tani-id.mjs`, `ks-salt-duzen.mjs`, `ks-teshis-runtime.mjs`, `ks-dom-duplicate-check.mjs`, `ks-fix-panel.mjs`) kök dizinde duruyor; `ks-test-render` seed haftasına bağlı (mutlak takvim değil).

---

# ✅ CHECKPOINT: Kalıcı Benzersiz ID Altyapısı (KİMLİK-YAMASI)

**Tarih:** 13 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **315/315 OK** (269 eski + 46 yeni)

## ID Şeması

| Varlık | Kimlik | Format | Nerede üretilir |
|---|---|---|---|
| Öğrenci | `ogrenciler[].id` | mevcut UUID korunur; eksikse `ks-ogr-XXXX-<t36>-<r6>` | `kimlikleriTamamla` (normalize + boot) |
| Öğretmen | `ogretmenler[].id` | mevcut UUID korunur; eksikse `ks-ogr-XXXX-<t36>-<r6>` | aynı |
| Sınıf | `DB.sinifIds[ad]` | `ks-snf-XXXX-<t36>-<r6>` | aynı + `sinifEkle` |

- Sınıflar AD ile yaşamaya devam eder (`sinifProg` anahtarları, `avail.sinif` değerleri, `ekDersler[].sinif` DEĞİŞMEDİ);
  `sinifIds` yalnızca EK kimlik katmanıdır — UI/dönem/Excel bu adımda değiştirilmedi.
- "Sınıf Dersi" placeholder değeri sınıf adı SAYILMAZ.
- Aynı isimli iki kayıt asla karışmaz: ID kayda bağlı, isme değil; üretimde mevcut tüm ID'lerle çakışma engeli var (`benzersiz()`).

## Değişen Fonksiyonlar (app.js — baştan yazma YOK, hedefli yama)

- **Yeni:** `kimlikUret`, `kimlikleriTamamla` (L188–228), `sinifId` (okuma, yan etkisiz), `kimlikKaydet` (tamamlama+saveDB).
- **`normalize()`:** sonuna `kimlikleriTamamla(d)` eklendi → boot, `loadDB`, yedek yükleme tek kapıdan geçer.
- **Boot:** `var DB = loadDB() || seedDB(); kimlikleriTamamla(DB); saveDB();` → seed yolu da kimlikli.
- **`sinifEkle`/`sinifAdiDegistir`/`sinifSil`:** sinifIds yaşam döngüsü (üret / yeniden adlandırmada TAŞI / silmede kaldır).
- Yamalar: `ks-yama-kimlik.mjs`, `ks-yama-kimlik2.mjs` (assert'li, idempotent — 2. koşu exit 2, dosyayı bozmaz).
- Geri dönüş: `app.js.kimlik-oncesi.bak`, `app.js.kimlik-bolge2-oncesi.bak`.

## Garantiler (testle kanıtlı, ks-benzersiz-id.mjs — 46 test)

- Mevcut geçerli ID'ler (öğrenci/öğretmen/ders/sinifIds) birebir korunur; tekrar çalıştırmada 0 değişiklik (idempotans).
- Eksik ID üretimi: normalize/loadDB 3 kez üst üste → aynı ID'ler; aynı isimli 2 öğrenciye 2 farklı ID.
- Referans koruması: ders `ogrenciId/ogretmenId/ogrenciIds`, istek `ogrenciId/ogrenciIds`, grup dersi üyeleri ve `dersOgrenciIds()` çıktısı değişmez.
- Yedek al→yükle (normalize yolu): öğrenci/öğretmen/sinifIds/ders referansları kayıpsız; ikinci döngüde de aynı.
- Eski süitler gevşetilmeden/silinmeden 269/269 aynen geçti.

## ID Adlandırmaları

`kimlikUret(tur, i)` = `"ks-" + tur.slice(0,3) + "-" + (i+1).padStart(4,"0") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8)`.
Pad+zaman+rastgele bileşimi çakışmayı pratikte imkânsız kılar; `benzersiz()` üstüne `-2, -3…` son ekiyle ikinci savunma katmanı ekler.

## Kalan Riskler

- `sinifIds`, ad-anahtarlı sınıf sistemine EK katmandır; sınıf adı elle (doğrudan DB düzenlemeyle) değiştirilirse haritada eski ad kalır — sonraki normalize yeni ada YENİ kimlik üretir (kayıp yok, ama aynı sınıfın kimliği değişir).
- `kimlikKaydet` henüz hiçbir çağrı noktasına bağlanmadı (mevcut `saveDB` akışı + normalize kapısı yeterli); ileride istenirse çağrı noktalarına eklenebilir.
- Öğrenci/öğretman silme sinifIds'i TEMİZLEMEZ (sınıf kendi varlığıdır; davranış bilinçli).

# Gerçek Öğretmen ve Sınıf Kadrosu (2026-09-13)

Seed/DB artık gerçek kadroyu taşır; `kadroDuzelt()` tek gerçek kaynak. localStorage: `yksOto_arsiv_v1`.

## Öğretmenler (17) — ad → branş

| Ad | Branş | ID |
|---|---|---|
| BELGİN ÇOLAK | kim | (seed UUID, korundu) |
| EREN BİLGİLİ | tur | (seed UUID, korundu) |
| FATMA KURT | tur | (seed UUID, korundu) |
| FİKRİYE KIYAR | cgr | (seed UUID, korundu) |
| KARDELEN ASLAN | kim | (seed UUID, korundu) |
| SELİNA KUTLU | kim | (seed UUID, korundu) |
| MEHMET ŞAŞAR | mat | (seed UUID, korundu) |
| MERT ASİL | ing | (seed UUID, korundu) |
| MERVE GEREK | mat | (seed UUID, korundu) |
| MUSTAFA GÜRKAN | fiz | (seed UUID, korundu) |
| MİNE GÜRKAN | mat | (seed UUID, korundu) |
| NİHAT KANARIĞ | tar | (seed UUID, korundu) |
| RAVİDE DERYA | fiz | (seed UUID, korundu) |
| SALİM URTİMUR | mat | (seed UUID, korundu) |
| SONER AÇIKGÖZ | mat | (seed UUID, korundu) |
| TAHSİN ASLAN | mat | (seed UUID, korundu) |
| ŞAHİN DOĞANAY | biy | (seed UUID, korundu) |

## Sınıflar (18) — ad → ID

ID formatı: `ks-snf-00NN-<djb2 base36 hash>` — `kadroSnfId(ad)` ile üretilir, **deterministik**: taze boot'ta da aynı ID (zaman/rastgele bileşeni yok). Kayıtlı DB'de zaten ID varsa KORUNUR.

| Sınıf | ID (deterministik önek) |
|---|---|
| MEZUN SAY 1 | ks-snf-0001-… |
| MEZUN SAY 2 | ks-snf-0002-… |
| MEZUN SAY 3 | ks-snf-0003-… |
| MEZUN EA 1 | ks-snf-0004-… |
| MEZUN EA 2 | ks-snf-0005-… |
| 12 SAY 1 | ks-snf-0006-… |
| 12 SAY 2 | ks-snf-0007-… |
| 12 SAY CAL | ks-snf-0008-… |
| 12 EA 1 | ks-snf-0009-… |
| 12 DİL | ks-snf-0010-… |
| 11 SAY 1 | ks-snf-0011-… |
| 11 SAY 2 | ks-snf-0012-… |
| 11 SAY 3 | ks-snf-0013-… |
| 11 SAYCAL | ks-snf-0014-… |
| 11 SAYISAL FEN | ks-snf-0015-… |
| 11 EA 1 | ks-snf-0016-… |
| 10.SINIF | ks-snf-0017-… |
| 9.SINIF | ks-snf-0018-… |

## Kadro uygulaması (ks-yama-kadro.mjs)

- **Yeni (app.js):** `kadroDuzelt()` — `normalize()` ve `loadDB()` içinden çağrılır; tek kapıdan geçer.
- **Yeni (app.js):** `kadroSnfId(ad)` — deterministik sınıf kimliği: `ks-snf-00NN-<djb2 base36>`; taze boot'ta da aynı ID üretir. Kadro-dışı sınıflar (UI ekleme + kimlikleriTamamla) eski `kimlikUret` yolunu korur.
- Yazım hizalama: kayıt adı `NİHAT KANARIĞ`, sınıf `11 SAYCAL`; seed plan satırlarındaki tarihsel `NİHAT KANARIG`/`11 SAY CAL` referansları çalışma zamanında aksan-duyarsız eşlenir (dosyada kalır, değiştirilmez).
- `kadroAdKey()`: Türkçe aksan katlama (ı→i, İ→i, ğ→g, ş→s, ç→c, ö/ü/o/u…) + combining işaret temizliği → `KANARIG` = `KANARIĞ`, `SAY CAL` = `SAYCAL` güvenli eşleşme.
- Seed `ogr()` yardımcısı aksan-duyarsız ad çözümlemesiyle güncellendi (taze boot çökmez).
- Kural: aynı normalize adla kayıt varsa YENİ kayıt AÇILMAZ, ID korunur, branş güncellenir; aynı adla iki öğretmen assert ile engellenir.
- Kadro-dışı (eski/placeholder) öğretmenler SİLİNMEZ; yalnızca eksik ID'leri tamamlanır (silme ayrı iş).
- Geri dönüş: `app.js.kadro-oncesi.bak`.
- Süit: `ks-gercek-kadro.mjs` (80 test, test.mjs'e eklendi).
- **Toplam: 395/395 OK** (315 mevcut + 80 yeni).

---

# ✅ CHECKPOINT: Dönem Modeli — İlk Dilim (2026/2027, Veri-Uyumluluk)

**Tarih:** 13 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **442/442 OK** (395 eski + 47 yeni)

## Dönem Şeması (localStorage: `yksOto_arsiv_v1`)

| Alan | Değer | Kural |
|---|---|---|
| `DB.donemler` | `[{ id: "donem-2026-2027", ad: "2026/2027", aktif: true }]` | Tek kayıt; ikinci oluşturulmaz, mevcut doğru ID korunur |
| `DB.aktifDonemId` | `"donem-2026-2027"` | Dönem işaretçisi |
| `DB.sinifProgDonemId` | `"donem-2026-2027"` | Yalnızca EK alan; `DB.sinifProg` YAPISI değişmez |
| `dersler[].donemId` / `istekler[].donemId` | `"donem-2026-2027"` | Yalnızca eksik/boşsa eklenir; mevcut değer ASLA üzerine yazılmaz |
| `ogrenciler[]` / `ogretmenler[]` / `DB.sinifIds` | — | Bu dilimde GLOBAL: donemId eklenmez, ID'ler değişmez |

Sınıf adları, sınıf ID'leri, ders/istek/grup-dersi referansları (ogrenciId/ogretmenId/ogrenciIds) DEĞİŞTİRİLMEDİ.

## Değişen Fonksiyonlar (app.js — baştan yazma YOK, ks-yama-donem-ilk.mjs hedefli yama)

- **Yeni:** `donemleriBaslat(db)` (bosDB'den önce) — dönem kaydı + işaretçiler + ders/istek donemId backfill; idempotent, dönüş sayıları `{ d, ders, ist }`.
- **`bosDB()`:** taze şemaya `donemler`, `aktifDonemId`, `sinifProgDonemId` eklendi (mevcut alan sırası korundu).
- **`normalize()`:** sonuna `donemleriBaslat(d)` — loadDB / yedek yükleme tek kapıdan dönemlenir.
- **Boot:** `donemleriBaslat(DB)` + `saveDB()` — seed yolu da dönemli.
- Geri dönüş: `app.js.donem-oncesi.bak` (yama öncesi hâl, SHA `2935d265…`).

## Migration Sayıları (seed verisi, tek geçiş)

| İşlem | Sayı |
|---|---|
| Derslere eklenen `donemId` | **37** |
| İsteklere eklenen `donemId` | **3** |
| Oluşturulan dönem kaydı | 1 (`donem-2026-2027`) |
| İkinci geçişte eklenen alan | **0** (idempotent) |

Eski kayıtların diğer alanları deep-equal korundu; kopya ders/istek/grup kaydı OLUŞMADI.

## Yedek / Geri Yükleme

`yedekAl`/`yedekOku` fonksiyonları ve yedek formatı DEĞİŞMEDİ; `donemler`, `aktifDonemId`, `sinifProgDonemId` ve tüm `donemId` alanları `veri` paketinde JSON'a zaten gömüldüğünden kayıpsız taşınıyor. Eski (dönemsiz) yedek yüklenince `normalize` otomatik dönemliyor: 37 ders + 3 istek + dönem kaydı tek geçişte, kopya yok.

## Testler

- Yeni: `ks-donem-ilk.mjs` — **47 test** (dönem tekliği, aktifDonemId, backfill, sayı koruma, alan deep-equal, sinifProg/sinifIds, öğrenci/öğretmen, idempotans, yedek döngüsü, SHA-256 ile index.html/ek-ders.js değişmezliği).
- `test.mjs` 11 süit oldu. Süit düzeltmesi (gevşetme DEĞİL): `ks-grup-istegi.mjs`'teki 2 byte-equal yedek karşılaştırması migration alanını (`+donemId`) içeren beklenen kayıtla yapılıyor — sertlik korunuyor.
- Doğrulama: `node --check app.js` OK · `node --check ek-ders.js` OK · `node test.mjs` → **442/442 OK**.
- Yama 2. koşu: "Zaten uygulanmış" (exit 2), dosya değişmez.

## Kalan Riskler

- Dönem seçici UI, dönem bazlı filtreleme ve dönem geçiş akışı henüz YOK (bu dilim bilinçli olarak yalnızca veri-uyumluluk).
- `planla()` ve istek ekleme, yeni kayıtlara henüz otomatik `donemId` YAZMAZ; `donemId`'siz yeni kayıt sonraki normalize'da `aktifDonemId`'ye taşınır (veri kaybı yok).
- Eski yedek dosyaları eski şemayla kalır; yükleme anında dönemlenir (normal).

---

# ✅ CHECKPOINT: Dönem Damgası — Yeni Ders/İstek Kayıtları Aktif Dönemle Doğuyor (DONEM-DAMGA-YAMASI)

**Tarih:** 13 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **492/492 OK** (442 eski + 50 yeni)

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-donem-damga.mjs hedefli yama)

- **Yeni:** `aktifDonemId()` helper (donemleriBaslat'tan sonra) — `DB.aktifDonemId` doluysa ONU; yoksa/boşsa/geçersizse `"donem-2026-2027"` döner; yeni kayda asla undefined/null/boş yazılmaz.
- **4 kayıt noktası damgalandı:** `planla()` birebir YENİ ders dalı, `planla()` grup YENİ ders dalı, `istekEkle()` tekli istek, `istekGrupEkle()` grup istek → hepsine `donemId: aktifDonemId()` eklendi.
- **Düzenleme dalları DEĞİŞMEDİ:** `planla()` birebir/grup güncelleme dalları ve planlama-istek-kapatma yolu yalnızca alan günceller; mevcut `donemId` korunur ("donem-2025-2026" kaydı düzenlemede aynı kalır). Eksik donemId'li kayda düzenleme sırasında zorla eklenmez — backfill `normalize`'a (DONEM-ILK) bırakıldı.
- `normalize()`, `donemleriBaslat`, yedek yükleme, grup mantığı, çakışma kontrolleri, UI/HTML/takvim/analiz/dönem seçici/Excel/`ek-ders.js` değişmedi.

## Testler

- Yeni: `ks-donem-damga.mjs` — **50 test** (aktif dönem A/B ile yeni ders damgası, fallback senaryoları: undefined/boş/boşluk/null/sayı, tekli + grup istek damgası, grup ders damgası, eski donemId'li ders/istek düzenlemede koruma, donemId dışı alan deep-equal koruması, 2. bağlam yolu, 4 damga sayısı).
- `test.mjs` 12 süit oldu. Yama idempotent: 2. koşu "Zaten uygulanmış" (exit 2), SHA doğrulandı — dosya değişmez.
- Doğrulama: `node --check app.js` OK · `node --check ek-ders.js` OK · `node test.mjs` → **492/492 OK**.
- Geri dönüş: `app.js.donem-damga-oncesi.bak`.
- Kalan riskler: dönem seçici UI henüz YOK (bu dilim yalnızca kayıt damgası); `istekler` güncelleme yolu (duzenle/havuz silme) donemId'ye dokunmaz ancak ileride eklenecek dönem-filtreleme bu damgaya dayanacak.

---

# ✅ CHECKPOINT: Dönem Seçici + Aktif Döneme Göre Filtreleme — İlk UI Dilimi (DONEM-SECICI-V2)

**Tarih:** 13 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **569/569 OK** (492 eski + 77 yeni)

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-donem-secici.mjs hedefli yama)

- **Dönem seçici:** Yönetim kartının İÇİNE, başa gömülü (`renderYonetim` innerHTML prepend — v2; her render'da tam 1 kutu, duplicate imkânsız, `insertAdjacentHTML` YOK). Veri kaynağı `DB.donemler[]` (value = dönem id, metin = dönem ad); açılışta `DB.aktifDonemId` selected. `DB.donemler` boş/eksikse yalnız "donem-2026-2027" güvenli şekilde gösterilir. Bu dilimde yeni dönem ekleme BUTONU/FORMU YOK — yalnız mevcut dönemler arasında geçiş.
- **Dönem değişimi (`donemSec(id)`):** `DB.aktifDonemId` güncellenir → `donemler[].aktif` işaretleri hizalanır → `saveDB()` → `yenile()` (ders listesi, günlük tablo, haftalık grid, istek havuzu dahil anında yeniden çizilir; sayfa yenilemesi gerekmez). Geçersiz id sessizce yoksayılır.
- **Tek filtre katmanı:** `aktifDonemKayitlari(dizi)` — kural `record.donemId === DB.aktifDonemId`; donemId'siz ESKİ kayıt "donem-2026-2027" kabul edilir (non-mutating: hiçbir kayıt yerinde değiştirilmez, mevcut donemId asla üzerine yazılmaz). Uygulandığı 4 görünüm: `penceredeDersler` (ders listesi + günlük + haftalık ortak kaynağı), `gunlukTablo`, `haftalikOgrtTablo`, `renderHavuz` (bekleyen sayacı + gösterilen liste + chip sayaçları).
- **Dokunulmayanlar:** `ogrenciler`, `ogretmenler`, `sinifIds`, `sinifProg` GLOBAL kaldı (filtre yok); ders/istek/grup referansları ve `donemId` değerleri değişmedi; yeni kayıt damgalama (DONEM-DAMGA) aynen; `normalize()`, `donemleriBaslat()`, `aktifDonemId()`, yedek yükleme değişmedi; analiz/özet/takvim/Excel/`ek-ders.js` değişmedi.

## Testler

- Yeni: `ks-donem-secici.mjs` — **77 test** (seçenek üretimi, açılış seçimi, `aktifDonemId` güncellemesi, `saveDB` çağrısı, yeniden çizim, ders listesi/günlük/haftalık/havuz filtreleri, 2025/2026 ↔ 2026/2027 geçiş senaryosu, grup ders filtresi, tek dönemli veri, duplicate seçici, referans dokunulmazlığı, planlama formu bütünlüğü).
- `test.mjs` 13 süit oldu. Doğrulama: `node --check app.js` OK · `node --check ek-ders.js` OK · `node test.mjs` → **569/569 OK** (eski iki süitteki kaulan kırılganlığı v2 ile kökten giderildi).
- Yama idempotent: 2. koşu "Zaten uygulanmış (DONEM-SECICI-V2)" (exit 2), SHA doğrulandı — dosya değişmez.
- Kalan riskler: dönem listesi hâlâ tek dönem (yeni dönem ekleme sonraki dilim); donemId'siz kayıtlar yalnız okuma anında "2026/2027" kabul edilir (yerinde yazım bilinçli olarak sonraki normalize'a bırakıldı).

---

# ✅ CHECKPOINT: Excel Uyumlu CSV Dışa/İçe Aktarma (Aktif Dönem) — EXCEL-CSV-YAMASI

**Tarih:** 14 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **654/654 OK** (569 eski + 85 yeni)

## CSV Kararı ve Gerekçesi

- Gerçek .xlsx ÜRETİLMEDİ; **Excel uyumlu CSV** seçildi: UTF-8 BOM (U+FEFF) + noktalı virgül (`;`) ayraç + CRLF satır sonu + çift tırnak kaçışlaması (`""`).
- Gerekçe: sandbox çevrimdışı çalışır; SheetJS/dış kütüphane gereksiz bağımlılık oluşturur; BOM+`;` kombinasyonu Türkçe Excel'de çift tıklamayla doğrudan açılır; parser/serializer uygulama içinde küçük ve test edilebilir kaldı (`csvHucre/csvSatir/csvDosya/csvParse` — split(';') DEĞİL, gerçek quote-aware parser: quoted alanlar, kaçışlı tırnak ve çok satırlı hücreler doğru okunur, BOM kaldırılır).

## Üç Dosya (schema: "yks-csv-v1")

| Dosya | dataset | Kapsam |
|---|---|---|
| `yks-kadro-global.csv` | `kadro` | TÜM öğrenciler + TÜM öğretmenler + TÜM `DB.sinifIds` — dönem filtresi YOK (global); `donemId` sütunu boş |
| `yks-dersler-<aktifDonemId>.csv` | `dersler` | YALNIZ `aktifDonemKayitlari(DB.dersler)` — başka dönem dersi ASLA girmez |
| `yks-istekler-<aktifDonemId>.csv` | `istekler` | YALNIZ `aktifDonemKayitlari(DB.istekler)` — başka dönem isteği ASLA girmez |

- Sabit başlıklar: kadro `schema;dataset;donemId;tip;id;ad;brans;sinifId;sinifAd;ekAlanlarJson` · ders/istek `schema;dataset;donemId;tip;id;ogrenciId;ogrenciIds;ogrenciAd;ogretmenId;ogretmenAd;dersId;dersAd;konu;tarih;saat;kod;sinif;durum[;olusturma];ekAlanlarJson`.
- `ogrenciIds` ek üyeleri `"|"` ile birleşir (sıra korunur), boşsa boş hücre; içe aktarımda tekrar diziye çevrilir.
- `ekAlanlarJson` standart başlık dışı alanları kayıpsız taşır; korumalı alanlar (id, donemId, ogrenciId, ogrenciIds, ogretmenId, dersId, sinif, tip) uygulanmaz.
- UI: Yönetim → Ayarlar içinde "Excel / CSV Veri Yönetimi" kartı: `Tüm CSV'leri İndir` (tarayıcı engellerse 3 ayrı buton çalışır) + `Kadro/Aktif Dersler/Aktif İstekler CSV İndir` + `CSV İçe Aktar` (multi-file, null-safe input) + `Son İçe Aktarmayı Geri Al` + sonuç/hata alanı.

## ID/UPSERT ve Referans Kuralları

- Birincil eşleştirme YALNIZ ID ile; aynı isimli öğrenci/öğretmenler ASLA ada göre birleştirilmez (ID farklıysa ayrı kişi).
- Boş ID → mevcut helper'larla üretim: öğrenci/öğretmen `kimlikUret` + benzersiz savunması (üretilen sayacı raporlanır); sınıf → ada göre mevcut sınıfa bağlan, yoksa `kadroSnfId` deterministik üretim.
- Dolu ID: aynı ID varsa güncelle; ID başka türde kullanılıyorsa RED; yoksa ekle. Ders/istek yalnız kendi `id`'siyle upsert; isim/tarih/konu eşleştirmesi YOK.
- Referans doğrulama (ada göre tahmin YOK): `ogrenciId`, `ogrenciIds` üyeleri, derslerde `ogretmenId` zorunlu; `sinif` doluysa `DB.sinifIds`'te çözülmeli; `dersId` DERS tanımında yoksa satır RED (sessiz değişim yok). İsteklerde `ogretmenId` boş olabilir (istek şemasında alan yok).
- Ders/istek `donemId` ZORUNLU ve aktif döneme eşit; boş/farklı → satır numarasıyla RED. Mevcut kaydın `donemId`'si ASLA değiştirilmez (aynı ID başka döneme aitse RED).
- Aynı dosyada yinelenen ID hata. Hata mesajı: dataset + satır + kolon + sebep.

## Atomik İçe Aktarma ve Geri Alma

1) Tüm dosyalar parse → 2) tüm satırlar doğrulanır (kadro önce uygulanmış gibi; referans kontrolleri birleşik) → 3) DB'nin derin kopyası üzerinde upsert → 4) her şey başarılıysa `DB = kopya` + TEK `saveDB()` + `yenile()`; tek hata bile varsa hiçbir dosya uygulanmaz, DB/localStorage/ekran byte-birebir aynı kalır.
- Başarılı işlem öncesi `EXCEL_CSV_SNAPSHOT` (oturum içi); "Son İçe Aktarmayı Geri Al" DB'yi snapshot'a döndürür + `saveDB()` + `yenile()` — yeni kayıtlar ve güncellemeler birlikte geri alınır. Başarısız işlemde buton çıkmaz.
- İçe aktarma ekleme/güncelleme yapar; silme yapmaz; CSV'de olmayan kayıtlar korunur. İkinci kez aynı CSV içe aktarıldığında duplicate OLUŞMAZ (idempotent upsert).

## Dokunulmayanlar

index.html, ek-ders.js, vendor/* (SHA-256 yazma öncesi+sonrası doğrulandı), sinifProg/sinifProgDonemler içeriği, mevcut donemId değerleri, mevcut kadro ID'leri, ders/istek referansları, tablo/analiz hesapları, KS göçü, yedek formatı/davranışı, dönem seçici + aktifDonemKayitlari filtre kapısı. **Program verisi (sinifProg) bu dilimin CSV kapsamının DIŞINDA** (bilinçli).

## Testler ve Sayılar

- Yeni süit: `ks-excel-csv.mjs` — **85 test** (BOM/`;`/CRLF çıktısı; Türkçe+tırnak+`;`+satır sonu parse/serialize yuvarlama; kadro global kapsamı; yalnız aktif dönem; başka dönem kaydının girmemesi; `ogrenciIds` sırası; aynı isimli iki öğrenci farklı ID; ID-upsert duplicate üretmez; eksik ID üretimi; `kadroSnfId` kullanımı; ada göre yanlış birleştirme yok; bilinmeyen referans satır numarasıyla RED; farklı donemId RED; eski donemId korunumu; hatalı dosyada DB+localStorage değişmez; başarıda TEK saveDB+yenile; snapshot geri alma; aynı CSV 2. içe aktarımda duplicate yok; index.html/ek-ders.js/vendor işaret/hash kontrolü).
- `test.mjs` 14 süit oldu. Yama: `ks-yama-excel-csv.mjs` (assert'li, idempotent — 2. koşu "Zaten uygulanmış" exit 2). Geri dönüş: `app.js.excel-csv-oncesi.bak`.
- **Sayılar: BASELINE 569 (13 eski süit) + 85 yeni = 654/654 OK.**
- Doğrulama: `node --check app.js` · `node --check ek-ders.js` · `node --check ks-excel-csv.mjs` · `node --check test.mjs` → OK.

## Kalan Riskler

- "Tüm CSV'leri İndir" bazı tarayıcılarda 2+ indirmeyi engelleyebilir (3 ayrı buton yedek yol, çalışır durumda).
- Çok büyük arşivlerde CSV içe aktarma tek senkron işlemde çalışır (UI kilitlenmesi mümkün ama veri riski yok — atomik).
- `ekAlanlarJson` içinde iç içe nesne/diziler JSON olarak taşınır; Excel hücresinde elle düzenlenirse bozuk JSON sessizce yoksayılır (alan korunur, kayıp yok).
- Farklı dönemlerde indirilen CSV'ler dosya adında dönem ID taşır; karışıklık önlenir.
