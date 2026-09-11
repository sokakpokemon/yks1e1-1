# PROJE REHBERİ — önce burayı oku

- `index.html` = HTML iskeleti + giriş (ek-ders.js, app.js ve vendor/* yüklüyor)
- `app.js` = ana uygulama kodu (index.html'in ana inline script bloğu; KS v2 dahil)
- **app.js bölgeleri (SECTION ayracı → yaklaşık satır aralığı, dosya 2.117 satır):** `SABİTLER VE KISA KOD (KS)` 6–137 · `YARDIMCILAR VE VERİ KATMANI` 138–288
- `ARAYÜZ DURUMU VE GENEL KONTROLLER` 289–367 · `RENDER: ÖZET VE ANALİZ` 368–562
- `YÖNETİM — ÖĞRETMEN · ÖĞRENCİ · AYAR` 563–1087 · `TALEP HAVUZU` 1088–1193
- `BOOT VE DERS PLANLAMA` 1194–1397 · `TAKVİM, DERS LİSTESİ VE PAYLAŞIM` 1398–dosya sonu (2.117)
- `ek-ders.js` = Ek Ders sekmesi + kısa kod (KS) fonksiyonları
- Testler: `node ks-harness.mjs`, `node ks-test-render.mjs`, `node ks-durum-fn.mjs` ve `node ks-grup-uyum.mjs` (tek komut: `node test.mjs` — dördünü sırayla çalıştırır, özet verir; toplam **86/86**: 68 mevcut + 18 grup-uyum)
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
