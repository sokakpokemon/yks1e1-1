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

# ✅ CHECKPOINT: Dönem Seçici UI — Kalıcı Host + Gerçek DOM Onarımı (DONEM-SECICI-UI-YAMASI)

## Kök Neden (kanıtlı)
- `index.html` L7: `ek-ders.js` **defer** → app.js'ten SONRA çalışır; ek-ders.js L413-431'de `renderYonetim`'i 4 sekmeli sarmalayıcıyla **EZER** ve `yonetimBolum.innerHTML`'i `donemSeciciKutu` OLMADAN yeniden yazar → kart-içi dönem seçici + "Yeni Dönem Oluştur" her yenilemede siliniyordu (kullanıcı bulgusu birebir buydu).
- Teşhis: `ks-dom-semantik-donem.mjs` (gerçek DOM semantiği: bilinmeyen id → null, innerHTML yazımı eski çocukları siler, qSA gerçek tekrar sayar; microtask+timer flush ile defer sırası taklidi) — yama öncesi boot+flush sonrası kart-içi kutu 0, onarım sonrası host=1/secici=1/buton=1.

## Çözüm (yalnız app.js — 2 hedefli bölge, baştan yazma YOK)
- **ID'ler:** kart-içi seçici markup `id="donemSeciciKutu"` GERÇEK id ile korunur (host sarmalayıcı eklenmedi — gerçek DOM'da çift kayıt üretirdi); select → `id="donem-secici"` (`data-id="donemSecici"` uyumluluk takma adı), buton → `id="yeni-donem-btn"` (`data-id="donemYeniBtn"`).
- **Kalıcı host:** `donemHostOnar()` — kart-içi seçici `yb.innerHTML`'de YOKSA `#yonetimBolum`'un hemen ÜSTÜNE tek `id="donem-ui-host"` kurar (taze `donemSecKutusuHTML()` options); VARSA host'u kaldırır (çift görünüm/duplicate imkânsız); host kuruluysa options tazeler (`donemHostTazele` — yeni dönem anında seçicide).
- **Bağlantı:** `donemHostOnarZincir()` (microtask + setTimeout 0) `yenile()` kuyruğunun sonuna 1 kez eklendi → tüm yollar (boot, donemSec, sec, yeniDonemOlustur) otomatik kapsanır.

## Kalıcılık kuralı
- Host `#yonetimBolum`'un **KARDEŞİDİR** (içinde değil): renderYonetim/alt sekme yazımları host'a dokunamaz. Her yenileme akışında: kart-içi seçici varsa host kaldırılır, yoksa kurulur/tazelenir.
- `donemSec(this.value)` ve `yeniDonemOlustur()` mevcut veri mantığıyla çalışır (aktifDonemId+sinifProgDonemId hizalama, `sinifProguDonemeBagla`, saveDB, yenile, toast) — hiçbiri yeniden yazılmadı.

## Testler ve Sayılar
- Yeni süit: `ks-donem-secici-gorunum.mjs` (**44 test**, GERÇEK DOM semantiği) — test.mjs'e 1 kez eklendi. **TEK KOŞU: 785/785 OK (16 süit).**
- Eski 15 süit baseline birebir (düşüş YOK): harness 34 · test-render 14 · durum-fn 20 · grup-uyum 41 · panel-secim 32 · grup-gorunum 28 · istekten-grup 32 · grup-istegi 68 · benzersiz-id 46 · gercek-kadro 80 · donem-ilk 47 · donem-damga 50 · donem-secici 77 · excel-csv 85 · donem-olusturma 87.
- Teşhis: `ks-dom-semantik-donem.mjs` — boot + 3 render + 5 alt sekme + dönem değişimi + yeni dönem + tekrar 3 render; her adımda host/selector/buton = 1, options tazeliği ve selected korunumu doğrulandı.
- Yama: `ks-yama-donem-secici-ui.mjs` (assert'li, idempotent) — 1. koşu uyguladı; 2. koşu exit 2 "Zaten uygulanmış", hash birebir aynı.

## Yedek ve Dosyalar
- Yedek: `app.js.donem-secici-oncesi.bak` (SHA-256 `120b87df40115b28330a69d3a782294e351438dcd04fd752a756a4fa76faec0d` — yama öncesi birebir; üzerine YAZILMADI).
- `app.js`: `120b87df…` → `0f021b76…` (yalnız 2 hedefli bölge; bölge dışı byte-birebir kanıtlı). `test.mjs`: süit kaydı 1 kez.
- Değişmeyen: `index.html`, `ek-ders.js`, `vendor/*` (HTML değişikliği GEREKMEDİ — host app.js'ten ekleniyor).

## Kalan Riskler
- ek-ders.js 4 sekmeli override'ı yerinde kalıyor: gerçek sayfada dönem kontrolü kartın ÜSTÜNDEKİ kalıcı host'ta yaşar (kart-içinde görünmez — bu kasıtlı). Host, yb'nin kardeşi olduğu için yb içi her yazıma dayanıklıdır; yb'nin KENDİSİ DOM'dan kaldırılırsa (mevcut kodda yok) host kaybolabilir.
- Gerçek tarayıcıda ilk açılışta eski app.js önbellekten gelebilir → sert yenileme (Ctrl+Shift+R / Cmd+Shift+R).
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

---

# ✅ CHECKPOINT: Yönetim'den 2027/2028 Dönemi Oluşturma + Dönemli Sınıf Programı (DONEM-OLUSTURMA-YAMASI)

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-donem-olusturma.mjs hedefli yama)

- **P1) donemSec(id):** aktifDonemId + sinifProgDonemId AYNI id'ye hizalanır; `sinifProguDonemeBagla(id)` ile DB.sinifProg aktif dönemin programına bağlanır; saveDB + mevcut yenile akışı aynen korunur.
- **P2) donemleriBaslat:** çok dönemli DB'de aktifDonemId/sinifProgDonemId SIFIRLANMAZ (yalnız boş/geçersiz id'de güvenli fallback donem-2026-2027); DONEM_ILK `aktif` damgası yalnız TEK dönemli (yeni yedek/boot) DB'de uygulanır → donemSec'in aktif-işaret sözleşmesiyle uyumlu, idempotent.
- **P2b) donemleriBaslat dönüşünden ÖNCE** `sinifProgDonemleriBaslat(db)` çağrısı → migration kapısı normalize/loadDB/yedek-yükleme yolunun tamamını kapsar.
- **P3) Yeni blok (tumunuSil'den önce):** `sinifProgDonemleriBaslat` + `sinifProgAktif` + `sinifProguDonemeBagla` + `yeniDonemOlustur` + `donemSeciliSinifProg`.
- **A3) donemSecKutusuHTML:** dönem seçicinin YANINA "Yeni Dönem Oluştur" butonu (id `donemYeniBtn`; innerHTML her render'da yeniden yazıldığından duplicate imkânsız; kaynakta tam 1 tanım).

## Yeni Dönem Şeması

- `DB.sinifProgDonemler = { donemId: { sınıfAdı: [hücre anahtarları] } }` — dönemli sınıf programı deposu.
- `DB.donemler[]` kaydı: `{ id: "donem-2027-2028", ad: "2027/2028", aktif }`.
- **Uyumluluk katmanı:** DB.sinifProg = sinifProgDonemler[sinifProgDonemId] **TA KENDİSİ (identity rebind)** — renderer'lar DB.sinifProg okumaya devam eder; program düzenlemeleri depoya yansır, dönem değişiminde kaybolmaz.

## sinifProg Migration ve Program Koruması

- Eski tek dönemlik DB.sinifProg, öncelik zinciriyle KAYIPSIZ bağlanır: `sinifProgDonemId → aktifDonemId → "donem-2026-2027"` (deep-copy; referans sızıntısı yok).
- sinifProgDonemler zaten varsa: mevcut programlar SİLİNMEZ/üzerine yazılmaz; yalnız EKSİK dönem anahtarlarına `{}` eklenir.
- Dönem değişince: başka dönemin programı ASLA üzerine yazılmaz; 2026/2027 ↔ 2027/2028 geçişlerinde program/ders/istek deep-equal geri gelir.
- `yeniDonemOlustur`: ilk basışta donemler'e TEK kayıt; dersler[]/istekler[] KOPYALAMAZ; 2027/2028 programı BOŞ `{}` başlar; aktif işaretler tek döneme hizalanır; zaten varsa yalnız o döneme geçer + toast "zaten var"; art arda tıklama duplicate üretmez. ogrenciler/ogretmenler/sinifIds GLOBAL kalır.

## Testler ve Sayılar

- Yeni süit: `ks-donem-olusturma.mjs` — **87 test** (migration kayıpsızlık + öncelik zinciri; mevcut programların korunması; tek kez oluşturma; ders/istek kopyalanmaması; boş yeni dönem programı; global verilerin birebir korunumu; aktifDonemId+sinifProgDonemId birlikte güncellenmesi; geçişte eski programın deep-equal dönüşü; identity-rebind; idempotans; seçici+buton duplicate üretmez; saveDB/yedek döngüsünde kayıpsızlık; index.html/ek-ders.js/vendor hash).
- `test.mjs` 15 süit oldu. Yama: `ks-yama-donem-olusturma.mjs` (assert'li, idempotent — 2. koşu "Zaten uygulanmış" exit 2). Geri dönüş: `app.js.donem-olusturma-oncesi.bak`.
- **Sayılar: BASELINE 654 (14 eski süit) + 87 yeni = 741/741 OK.** Süit dağılımı: harness 34, test-render 14, durum-fn 20, grup-uyum 41, panel-secim 32, grup-gorunum 28, istekten-grup 32, grup-istegi 68, benzersiz-id 46, gercek-kadro 80, donem-ilk 47, donem-damga 50, donem-secici 77, excel-csv 85, donem-olusturma 87.
- Doğrulama: `node --check app.js` · `node --check ek-ders.js` · `node --check ks-donem-olusturma.mjs` · `node --check ks-yama-donem-olusturma.mjs` → OK.

## Dokunulmayanlar (hash doğrulaması)

- `index.html` SHA-256 `5b691039…` değişmedi (yama işareti YOK); `ek-ders.js` SHA-256 `662ec4f1…` değişmedi (yama işareti YOK); `vendor/*` 5 dosya okunur ve değişmez.
- `app.js`: `84a9d485…` → `120b87df…` (yalnız yama bölgeleri; yedek `app.js.donem-olusturma-oncesi.bak` = eski SHA).
- Mevcut ders/istek `donemId` değerleri ve yeni kayıt damga mantığı değişmedi (ks-donem-damga 50/50); dönem seçici davranış sözleşmesi aynen korundu (ks-donem-secici 77/77).

## Kalan Riskler

- Program düzenleme UI'ı DB.sinifProg (view) üzerinden yazıyor: davranış doğru; ileride depoya doğrudan yazacak yeni özellikler sinifProgDonemler[dönemId] anahtarını kullanmalı.
- 2027/2028 ilk oluşturmada program kasıtlı BOŞ başlar (eski dönem programı kopyalanmaz); kullanıcı yeni dönemde programı kurar.
- Dönemsiz ESKİ yedek yüklemede program donem-2026-2027'ye bağlanır; 2027/2028 aktifken alınan yedeklerde sinifProgDonemler kayıpsız taşınır (87 test ile doğrulandı).
---

# ✅ CHECKPOINT: Dönem Seçici — Gerçek Tarayıcı DOM Düzeltmesi (DONEM-DOM-DÜZELTMESİ)

**Tarih:** 15 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **807/807 OK** (785 eski + 22 yeni)

## Kök Neden (kanıtla)

- Kullanıcı bulgusu birebir doğruydu: `fetch('app.js')` içinde `donem-secici` VAR, gerçek DOM'da `document.querySelectorAll('#donem-secici').length === 0`.
- `ek-ders.js` (defer, index.html L7 → app.js'ten SONRA çalışır) `renderYonetim`'i 4 sekmeli sarmalayıcıyla EZER ve `yonetimBolum.innerHTML`'i `donemSeciciKutu` OLMADAN yeniden yazar (ek-ders.js L414-433).
- 13 Eylül yamasındaki `donemHostOnarZincir` (microtask + setTimeout 0) **TEK atımlıktı**: defer görevi bu timer'ı geçtiğinde (script ağ/cache gecikmesi) onarım hiç koşmaz → gerçek tarayıcıda seçici 0 kalır. Harness'ta flush sırası farklı olduğu için eski 44 testlik süit bunu yakalayamıyordu.

## Kalıcı Çözüm (yalnız app.js — 4 hedefli bölge, baştan yazma YOK; yama: ks-yama-donem-dom.mjs)

- **A2)** `donemHostOnar()`: host'u kurarken TEK SEFERLİK `console.info("[DONEM-DOM-DÜZELTMESİ] kalıcı dönem kontrolü kuruldu")` kanıtı (host kuruluysa erken döner — spam YOK).
- **B)** `donemOnarimPlanla()`: `#yonetimBolum`'e bağlı TEK seferlik MutationObserver (`__donemOnarimBagli` guard); kart-içi seçici silinen her yb yazımında `donemHostOnar()`'ı setTimeout 0 ile planlar. Yani **hangi gecikmede gelirse gelsin**, ek-ders.js'in yb'yi ezme yazımı artık onarımı TETİKLER.
- **C)** `sec()`: alt sekme değişimlerinde de `donemOnarimPlanla()` (idempotent guard).
- **D)** Boot son noktası: `donemOnarimPlanla()` + `setTimeout(donemOzDenetim, 0)`.
- **Self-check (`donemOzDenetim`):** boot'ta YALNIZ 1 kez, onarım zinciri bittikten sonra koşar; `#donem-ui-host`/`#donem-secici`/`#yeni-donem-btn` eksikse `console.error("[DONEM-DOM-SELF-CHECK] … EKSİK …")`, varsa `host=1 secici=1 buton=1 kartIciSecici=false · aktifDonemId=…` yazar.
- `donemSec()`/`yeniDonemOlustur()` veri mantığı DEĞİŞMEDİ (aktifDonemId+sinifProgDonemId hizalama, saveDB, sinifProguDonemeBagla, yenile, duplicate-dönem engeli); gerçek id'ler korundu (data-id takma adları aynı); host/select/buton her senaryoda tam 1.

## Testler ve Kanıtlar

- Yeni süit: `ks-donem-secici-dom.mjs` (**22 test**, GERÇEK DOM semantiği + MutationObserver simülasyonu) — test.mjs'e 1 kez eklendi. Kapsam: null-on-miss, innerHTML çocuk silme, insertAdjacentHTML id kaydı, boot sonrası 1,1,1, 3 render, 4 alt sekme geçişi (Öğretmen/Öğrenci & Sınıf/Ek Ders/Ayarlar & Yedekleme), gecikmeli override → 0 → observer onarımı → 1,1,1, selected↔aktifDonemId, duplicate-dönem engeli, self-check açık hata.
- Baseline birebir: 785/785 (16 eski süit; düşüş 0). Yeni toplam **807/807**.
- Yama: assert'li, idempotent — 2. koşu `"Zaten uygulanmış"` + **exit 2**; hash `41db0ee4…` değişmedi.
- Hash'ler: app.js `0f021b76…` → `41db0ee4…`; `index.html` `5b691039…`, `ek-ders.js` `662ec4f1…`, `vendor/*` (5 dosya) DEĞİŞMEDİ.
- Yedekler: `app.js.donem-secici-oncesi.bak` (`120b87df…`, üzerine YAZILMADI) + `app.js.donem-dom-oncesi.bak` (`0f021b76…`, bu yamanın ön-durumu).

## Kalan Riskler

- Gerçek tarayıcıda ilk açılışta eski app.js önbellekten gelebilir → **Ctrl+Shift+R (sert yenileme)** gerekli.
- ek-ders.js 4 sekmeli override yerinde kalıyor (kasıtlı): dönem kontrolü, yb'yi ezen her yazımı onaran observer + kardeş host ile korunuyor.
- MutationObserver desteklemeyen çok eski tarayıcılarda observer kurulmaz (kod try/catch'li, çökmez; modern tarayıcıların tamamı destekler).
- Kart-içi seçici varken `host.remove()` observer'ı yeniden tetikler; observer kart-içi seçiciyi görünce no-op döner → sonsuz döngü YOK (süitte kanıtlandı).

## SINIFPROG-CSV-YAMASI (2026-09-15) — aktif dönem sınıf programı CSV + eski yedek uyumluluğu

### Final Test Sonucu

- **864/864 OK** (17 eski süit: 807 + yeni `ks-sinifprog-csv.mjs`: 57). Tüm eski assertion satırları aynen; gevşetme yok.

### CSV Şeması

- Dosya: `yks-sinif-programi-<aktifDonemId>.csv` — TEK dönem taşır.
- Kolon başlığı (tam): `schema;dataset;donemId;donemAd;sinifId;sinifAd;gun;kod;saat;durum;deger;degerJson`
- UTF-8 BOM + noktalı virgül ayraç + CRLF; `schema=yks-csv-v1`, `dataset=sinifProg`.
- Hücre anahtarı: `gun-kod` (G=0..6, K=KISA_KOD no); `saat=KISA_KOD[K].b`; `durum=sinif`; `deger=anahtar`; `degerJson={"key":"G-K"}`.
- `sinifId` DB.sinifIds.ten gelir (ID-birincil; ada göre esleştirme YOK); `sinifAd`/`donemAd` yalnız görüntüleme alanı.
- Buton: Yönetim > Ayarlar & Yedekleme > Excel/CSV Veri Yönetimi → Aktif Sınıf Programı CSV İndir + sinifProg içe aktarma (mevcut csvDosyalarOku akışı).

### Aktif Dönem Kuralı

- Export yalnız `sinifProgAktif(aktifDonemId())` içeriğini yazar; başka dönemden tek satır sızmaz (süitte kanıtlandı).
- Import ta dosya `donemId` ≠ `aktifDonemId()` ise KESİN RED; bilinmeyen dönem otomatik OLUŞTURULMAZ; karışık dönem dosyası RED.

### Atomic Import

- Tüm satırlar parse+validate edilmeden DB/localStorage/DOM değişmez; tek hata → byte-birebir değişiklik yok (süitte kanıt).
- Başarılı: oturum-içi snapshot (`SINIFPROG_CSV_SNAPSHOT`) → `DB.sinifProgDonemler[aktifDonemId]=yeniProg`, `sinifProgDonemId=aktifDonemId`, `DB.sinifProg=…` (identity-rebind) → TEK `saveDB()` + `yenile()`.
- Round-trip kayıpsız: dosyada olmayan hücre SİLİNİR (boş hücre temsili), dolu hücreler deep-equal geri gelir.

### Eski Yedek Precedence (normalize / sinifProgDonemleriBaslat kapısı)

1. Geçerli `sinifProgDonemler` + `sinifProgDonemId` VARSA canonical harita KORUNUR; stale `sinifProg` haritayı ezmez.
2. Eski yedekte harita yoksa `DB.sinifProg` hedef (aktif/varsayılan) döneme DEEP-COPY ile bağlanır.
3. Diğer dönem programları (ör. 2027/2028 boş) asla doldurulmaz/ezilmez; 2026/2027 korunur.
4. İşlem sonunda `DB.sinifProg === DB.sinifProgDonemler[DB.sinifProgDonemId]` (identity-rebind) — dönem değişimi + yedek yükleme sonrası da korunur.
5. Dersler/istekler/öğrenci/öğretmen/sinifIds değişmez (normalize eksik kadroyu tamamlayabilir; mevcut kayıtlara dokunmaz).

### Yama Kimliği

- Dosya: `ks-yama-sinifprog-csv.mjs` — assert li, idempotent; 2. koşu "Zaten uygulanmış" + **exit 2**, app.js hash değişmez.
- Backup: `app.js.sinifprog-csv-oncesi.bak` (hash `41db0ee4…`, üzerine YAZILMADI). app.js hash: `41db0ee4…` → `696168df…`.
- app.js te yeni: `sinifProgCsvSatirlari`, `sinifProgCsvIndir`, `sinifProgCsvUygula`, `sinifProgCsvImportTetik` (+ SINIFPROG_CSV_BASLIK/SNAPSHOT). Mevcut csvHucre/csvSatir/csvDosya/csvParse/csvIndir/csvDosyalarOku YENİDEN KULLANILDI.
- index.html, ek-ders.js, vendor/* DEĞİŞMEDİ. Kalan risk: gerçek tarayıcıda **Ctrl+Shift+R (Mac: Cmd+Shift+R)** sert yenileme gerekir.

---

# ✅ CHECKPOINT: Şablon Dönemden Sınıf Programı Kopyalama (SABLON-KOPYA-YAMASI)

**Tarih:** 15 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **936/936 OK** (864 eski + 72 yeni `ks-sablon-kopya.mjs`)

## Kopyalama Veri Modeli
- Yalnız sınıf programı kopyalanır: `DB.sinifProgDonemler[kaynakId]` → `DB.sinifProgDonemler[hedefId]`. Dersler/istekler/dönemId alanları KOPYALANMAZ.
- Boş hedef kuralı: `sablonKopyaProgramBosMu(prog)` — tüm sınıf dizileri boşsa (veya prog null/dizi) boş sayılır; hedefte TEK hücre bile varsa işlem RED, veri değişmez (ezme/birleştirme YOK).
- Deep-copy: JSON döngüsü (`JSON.parse(JSON.stringify(kaynak))`) — kök ve iç içe tüm referanslar kaynakla paylaşilamaz (süitte notStrictEqual kanıtı).
- Identity-rebind: hedef aktif dönemse `DB.sinifProg = DB.sinifProgDonemler[hedefId]` (TA KENDİSİ); inaktif hedefte aktif görünüm (referans + içerik) DEĞİŞMEZ.
- `DB.aktifDonemId` ve `DB.sinifProgDonemId` işlemden ASLA etkilenmez; başarılı akış TEK `saveDB()` + mevcut `yenile()`.

## Onay ve Veri Değistirmeme Kuralları
- AÇIK onay: mevcut `onayAc`/`onayOnayla` altyapısı; metin kaynak+hedef dönem adlarını içerir, "dersler ve istekler kopyalanmaz" yazar.
- Onay beklerken koşullar YENİDEN doğrulanır (kaynak bozulduysa/hedef dolduysa iptal, veri değişmez).
- RED durumları (veri değişmez): kaynak/hedef yok, kaynak=hedef, kaynak canonical değil, hedef dolu, onay reddi, kaynak aktif ama canonical depo ile uyumsuz.

## UI (yalnız kalıcı #donem-ui-host içine)
- Sabit id'ler: `#sablon-kopya-ui`, `#sablon-kaynak-donem`, `#sablon-hedef-donem`, `#sablon-kopyala-btn`, `#sablon-kopya-uyari`.
- Seçenekler `DB.donemler`'den, value gerçek id (ada göre tahmin YOK); hedef varsayılan aktifDonemId, kaynak hedef-dışı ilk dönem.
- Kaynak=hedef veya hedef dolu → görünür `#sablon-kopya-uyari` (buton akışı yine de güvenlikle RED).
- `donemHostOnar` kartı host'a TEK kez ekler; `donemHostTazele` seçimleri DOM'dan okuyup KORUR (override'da seçim kaybı yok). Yeni dönem oluşturma programı OTOMATİK kopyalamaz.

## Süit ve Sonuç
- Yeni süit: `ks-sablon-kopya.mjs` — **72 test** (boot; boş hedefe başarılı kopya; kaynak deep-equal korunumu; kök+iç içe referans notStrictEqual; çapraz hücre-değişimi etkisizliği; inaktif hedef → aktif görünüm değişmez; aktif hedef → identity-rebind; aktifDonemId/sinifProgDonemId değişmez; ders/istek kopyalanmaz; dolu hedef RED + korunum; kaynak=hedef RED; onay reddi DB/LS byte-birebir; TEK saveDB; yeni dönemde otomatik kopya yok; tekrar kopyada hedef ezilmez; yedek döngüsü; UI id'ler; GERÇEK DOM: boot+3 render+4 alt sekme sonrası host=1 secici=1 btn=1 sablon=1 sablonBtn=1, seçim korunumu, gerçek kopyala akışı).
- test.mjs: 18 süit, tam 1 kayıt. **BASELINE 864/864 (17 süit) → FINAL 936/936 (18 süit); eski süitlerde düşüş 0.**

## Yama Kimliği ve Hash'ler
- Yama: `ks-yama-sablon-kopya.mjs` (assert'li, idempotent; 2. koşu "Zaten uygulanmış" + exit 2, app.js hash `bd456895…` değişmez).
- Backup: `app.js.sablon-kopya-oncesi.bak` — SHA-256 `696168dff65305c7998d6cb0edbd0d7213a0f1559392584775e1488f9966a8d8` (yama öncesi; üzerine YAZILMADI).
- app.js: `696168df…` → `bd456895…` (yalnız 4 hedefli bölge). index.html, ek-ders.js, vendor/* DEĞİŞMEDİ.
- Syntax: `node --check` app.js / ek-ders.js / test.mjs / ks-sablon-kopya.mjs / ks-yama-sablon-kopya.mjs → OK.
- Kalan risk: gerçek tarayıcıda eski app.js önbellekten gelebilir → **Ctrl+Shift+R (Mac: Cmd+Shift+R)** sert yenileme.

---

# ✅ CHECKPOINT: D0 — Render Sahipliği Hardening (Gerçek DOM Regresyon Süiti)

**Tarih:** 16 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **966/966 OK** (936 eski + 30 yeni `ks-render-sahipligi.mjs`)

## Envanter ve Karar (A — üretim patch'i GEREKMEDİ)
- Gerçek DOM sahipliği kanıtlandı: `#donem-ui-host` `#yonetimBolum`'un **KARDEŞİ**dir → ek-ders.js'in `renderYonetim` override'ı yalnız `yb.innerHTML`'i (yb İÇİNİ) ezebilir; host'a ve host içindeki dönem/şablon UI'ya erişemez. `donemHostOnar`/`donemHostTazele` (app.js) host'u kurar/tazeler; `donemOnarimPlanla` MutationObserver ile gecikmeli defer yazımlarını onarır; `donemOzDenetim` boot sonunda beşliyi raporlar.
- `ks-donem-secici-dom.mjs` (22) ve `ks-sablon-kopya.mjs` (72) gerçek-DOM suite'leri zaten boot/render/sekme sayımlarını kanıtlıyordu; app.js'te gerçek eksik YOK → **app.js, ek-ders.js, index.html DEĞİŞMEDİ; backup OLUŞTURULMADI** (patch gereksizdi).

## Yeni Süit: ks-render-sahipligi.mjs (30 test, test.mjs'e tam 1 kez eklendi)
Gerçek DOM semantiği (bilinmeyen id→null, innerHTML eski çocukları siler, insertAdjacentHTML kayıt, qSA gerçek tekrar): beşli `#donem-ui-host/#donem-secici/#yeni-donem-btn/#sablon-kopya-ui/#sablon-kopyala-btn` boot, 3 render, 4 alt sekme (Öğretmen/Öğrenci & Sınıf/Ek Ders/Ayarlar & Yedekleme) + geri dönüş sonrası hep 1,1,1,1,1; host kardeşlik kanıtı (override host'u silemez); duplicate id yok; dönem seçimi + aktifDonemId/sinifProgDonemId hizası sekme geçişlerinde korunur; şablon kaynak/hedef seçimleri korunur; dolu hedefe şablon kopyalama RED + LS byte-birebir; tekrarlı yeni-dönem butonu duplicate oluşturmaz; render/sekme geçişi localStorage ve sinifProg/sinifProgDonemler'i DEĞİŞTİRMEZ; ikinci kalıcı host eklenmez.

## Hash'ler (değişmeyenler)
`app.js` `bd456895…` · `ek-ders.js` `662ec4f1…` · `index.html` `5b691039…` · `vendor/*` (5 dosya) — hepsi birebir aynı. Değişen yalnız: `ks-render-sahipligi.mjs` (yeni, `f23a513f…`) ve `test.mjs` (`19d96290…` → süit kaydı 1 eklenti).

## Sonuç ve Sonraki Adım
- BASELINE 936/936 (19 süit) → FINAL **966/966 (20 süit)**; eski süitlerde düşüş 0, assertion değişikliği 0.
- **Sonraki ayrı adım (D1):** ek-ders.js `renderYonetim` override'ının tam sahiplik refactor'u — öncesinde override öncesi/sonrası DOM davranışının semantic karşılaştırması zorunlu.

# ✅ CHECKPOINT: Kadro CSV Dışa Aktarma Sırası — ogretmen → sinif → ogrenci (KADRO-SIRALAMA-YAMASI)

**Tarih:** 16 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1037/1037 OK** (1010 eski + 27 yeni)

## Yapılan İş (app.js — baştan yazma YOK, hedefli yama: ks-yama-kadro-siralama.mjs)

- `csvKadroSatirlari()` emission sırası değiştirildi: **ogrenci → ogretmen → sinif** yerine
  **ogretmen → sinif → ogrenci** (yeni CSV'de ilk tip grubu öğretmenler, sonra sınıflar, sonra öğrenciler).
- Satır içerikleri, alan değerleri, `csvHucre/csvSatir/csvDosya/csvParse` quote kuralları, BOM (`\uFEFF`), `;` ayırıcı ve CRLF satır sonları DEĞİŞMEDİ.
- `CSV_BASLIK_KADRO` header satırı byte-identical korundu; kolon ekleme/silme/yeniden adlandırma YOK.
- Import satır-sırasına bağlı DEĞİL (tip+ID ile upsert): yeni/eski/karışık sıra aynı DB sonucunu verir — bu, sıra değişikliğini güvenli kılar.
- Dersler, istekler ve `sinifProg` CSV export/import akışına DOKUNULMADI; `index.html`, `ek-ders.js`, `vendor/*` değişmedi.

## Doğrulama

- Yedek: `app.js.kadro-siralama-oncesi.bak` (SHA-256 `bd456895c5dbc16753dc15041928e12bfd5113bf070fc09c6b70fa2becc09127` — yama öncesi birebir; üzerine yazılmadı).
- app.js: `bd456895…` → `f4d05cf31e96a0ab35026f9995ffd8bbab732dd72e144d25759db7f7d5e337a4` (yalnızca csvKadroSatirlari gövdesi; bölge dışı byte-birebir assert'li).
- Yama idempotent: 2. koşu dosyaya DOKUNMAZ, exit 2 + "Zaten uygulanmış".
- `node --check app.js` ve `node --check ek-ders.js`: OK.
- Yeni süit: `ks-kadro-siralama.mjs` — **27 test** (emission sırası, satır sayıları, içerik kümesi eşitliği, header byte-identical, BOM, yeni/eski/shuffled import deep-equal, round-trip kayıpsız + duplicate yok, dersler/istekler/sinifProg korunumu, tek-süit-kaydı). test.mjs'e tam 1 kez eklendi.
- Baseline (yama öncesi): 1010/1010 OK (21 süit) → FINAL **1037/1037 OK (22 süit)**; eski süitlerde düşüş 0.

## Kalan Risk / Not

- Eski indirilmiş `yks-kadro-global.csv` dosyalarıyla yeni dosyalar karıştırılabilir; sorun değil — import ID bazlı ve sıra-bağımsız.
- Gerçek tarayıcıda eski app.js önbellekten gelebilir → sert yenileme (Ctrl+Shift+R / Cmd+Shift+R).

---

# ✅ CHECKPOINT: Kapalı Hücre Görünümü — Gri/Soluk + Tıklanabilir (KAPALI-GORUNUM-YAMASI)

**Tarih:** 16 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1056/1056 OK** (22 eski süit + 1 yeni süit, 23 süit)

## Kök Neden (kanıtlı — ks-teshis-kapali.mjs / ks-teshis2-kapali.mjs)

- `gridTablo()` ogretmen dalı `avail.musait`'teki anahtar için `durum = "musait"` üretiyordu (app.js L1327),
  ancak görünüm dalları yalnız `"sinif"/"kapali"/"var"` içindi → **"musait" hiçbir dala girmiyor**, kapalı hücre
  BEYAZ/boş hücre stiliyle basılıyordu. Kırmızı "Kapalı" hücre stili (L1332) ölü koddandı.
- Tıklanabilirlik zaten BOZUK DEĞİLDİ: hücrelerde `disabled`/`readonly`/`pointer-events:none` yok;
  `togOgrSecili` kapalı seçiliyken `avail.musait`'e yazıyor + `saveDB` kalıcılığı çalışıyordu (teshis ile kanıtlandı).
- Sorun tamamen **render dalı eşleşmesi** kapsamındaydı; patch yalnızca görünümü düzeltti.

## Yama (ks-yama-kapali-gorunum.mjs — assert'li, idempotent, app.js baştan yazma YOK)

1. `durum = "musait"` → `"kapali"` dalına bağlandı (L1327) — kapalı hücre artık stiline düşer.
2. Kapalı hücre stili: `bg-rose-200 border-rose-300 hover:bg-rose-300` → **`bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-400 opacity-70`** (soluk/gri).
3. Hücre içi kırmızı `K` etiketi KALDIRILDI; "Kapalı" bilgisi `title` ile korunur ("Pzt 1 · 08:50-09:30 · Kapalı").
4. Legend'daki Kapalı karesi gri/soluk yapıldı (legend tutarlılığı).
- Değişmeyen: `durumSeciciHTML` (Kapalı butonu seçicide rose vurgulu kalır — kasıtlı), `durumSec`,
  `togOgrSecili` davranış gövdesi, `togOgr`, `haftalikOgrtTablo`, `saveDB`, `index.html`, `ek-ders.js`, `vendor/*`.

## Davranış Sonucu

- Kapalı hücre: gri/soluk (`bg-slate-100` + `opacity-70`), **tıklanabilir ve seçilebilir**; "Kapalı" seçiliyken
  tıklama `avail.musait`'e yazar, `saveDB` ile localStorage'a kalıcı; 2. tıklama boşaltır (döngü korunur).
- Boş hücre (beyaz) ve sınıf hücresi (amber) görünümü/davranışı birebir aynı.
- Veri şeması değişmedi: `avail.musait` dizi anahtarları (`GÜN-KOD`) aynen; geriye dönük uyum korunur.

## Testler

- Yeni süit: `ks-kapali-gorunum.mjs` — **19 test** (kapalı render DOM/grafik/disable/pointer kontrolü,
  tıklama→avail.musait→saveDB→localStorage kalıcılığı, boş/sınıf durumlarının korunumu, sınır bölgeleri: MARK sayımı 4, haftalikOgrtTablo/saveDB/togOgrSecili dokunulmazlık).
- `test.mjs`'e tam **1 kez** eklendi (23 süit).
- Baseline (yama öncesi): **1037/1037 OK (22 süit)** → FINAL **1056/1056 OK (23 süit)**; eski süitlerde düşüş 0.

## Yedek ve Dosyalar

| Dosya | SHA-256 |
|---|---|
| app.js (yama ÖNCESİ, backup `app.js.kapali-gorunum-oncesi.bak`) | `f4d05cf31e96a0ab35026f9995ffd8bbab732dd72e144d25759db7f7d5e337a4` |
| app.js (yama SONRASI) | `fd1f3326165c6b95e0066d067fa72a8dc8850fc8dc5dfbebe0f836fcd93dfab8` |

- Yama idempotansı: 2. koşu `exit 2` + "Zaten uygulanmış"; dosya değişmedi.
- `node --check app.js` / `node --check ek-ders.js`: OK.
- Değişen dosyalar: `app.js`, `test.mjs` (+1 süit), `CHECKPOINT.md`; YENİ dosyalar: `ks-kapali-gorunum.mjs`,
  `ks-yama-kapali-gorunum.mjs`, `app.js.kapali-gorunum-oncesi.bak` (teshis: `ks-teshis-kapali.mjs`, `ks-teshis2-kapali.mjs`).

## Preview Notu

- Gerçek tarayıcıda eski app.js önbellekten gelebilir → **sert yenileme (Ctrl+Shift+R / Cmd+Shift+R)**.

---

# ✅ CHECKPOINT: Ek Ders Dönem Damgası + İki Yönlü Çakışma (EK-DERS-DONEM-YAMASI)

**Tarih:** 16 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1113/1113 OK** (1056 eski + 57 yeni)

## Yapılan İş (yalnız app.js — ek-ders.js, index.html, vendor/* DOKUNULMADI)

1. **A) Ek ders donemId damgası (saveDB kapısı, L658):** `saveDB()` localStorage'a yazmadan önce
   `DB.ekDersler` içindeki donemId'siz kayıtları `aktifDonemId()` ile damgalar. ek-ders.js push →
   `yenile()` → `saveDB()` kapısından geçtiği için tüm yeni ek dersler otomatik dönemli doğar
   (ek-ders.js'e dokunulmadı; dolu donemId ASLA üzerine yazılmaz, idempotent).
2. **A) Backfill (donemleriBaslat, L264):** donemId'siz eski ek dersler TEK KEZ `DONEM_ILK_ID`
   ("donem-2026-2027")'ye bağlanır (`say.ek` sayacı); ders/istek backfill'leri aynen korunur.
3. **B) İki yönlü çakışma (duzeltmeBul, L2975):** birebir planlarken öğretmenin AKTİF DÖNEMDEKİ
   (`aktifDonemKayitlari` filtresiyle) ek dersi de uyarılır; mesajda sınıf + ders adı + tarih/saat
   okunur. Diğer dönemdeki ve iptal edilmiş ek dersler uyarıya girmez. `ekDuzeltmeBul` birebir
   derslere bakmaya DEVAM eder (ek-ders.js değişmedi).

## Testler

- Yeni süit: `ks-ek-ders-donem.mjs` — **57 test** (damga, aktif dönem değişimi, backfill idempotansı
  2./3. koşu, dolu donemId koruması, ders/istek migration bozulmaz, dönem filtresi ayrımı, yedek
  round-trip kayıpsızlık, iki yönlü çakışma + uyarı içeriği, farklı dönem/iptal hariç tutma,
  avail.musait Kapalı + avail.sinif koruması, kapsam dışı render'ların ekDersler referansı içermemesi,
  index.html/ek-ders.js/vendor SHA-256 bütünlüğü, test.mjs'e tek bağlantı).
- `test.mjs` 24 süite güncellendi (tek bağlantı). Eski 23 süit düşüş YOK: **1056/1056**.

## Doğrulama

- `node --check app.js` ✓ · `node --check ek-ders.js` ✓
- `node test.mjs` → **1113/1113 OK** (24 süit)
- Yama 2. koşu: "Zaten uygulanmış" (exit 2), dosyaya dokunmaz (app.js hash birebir aynı).

## Yedek ve Dosyalar

| Dosya | SHA-256 | Durum |
|---|---|---|
| app.js.ek-ders-donem-oncesi.bak | `fd1f3326165c6b95e0066d067fa72a8dc8850fc8dc5dfbebe0f836fcd93dfab8` | yama öncesi birebir (üzerine yazılmadı) |
| app.js | `4efb45d675c4c1fe80aa909734af21e9f42b7193c8103d72e42669c5745b1cc8` | yamalı |
| ek-ders.js | `662ec4f1cffc1bb0b7882f876bcf0de581925139f066589a6de0d35862b4aaf7` | DEĞİŞMEDİ |
| index.html | `5b691039f85c612b02a19ce11635260b3a523ae2256196fb581a1ba9f9dd00dd` | DEĞİŞMEDİ |
| vendor/* (5 dosya) | checkpoint ile birebir | DEĞİŞMEDİ |

## Kapsam Dışı (bilinçli)

- Gunluk tablo, haftalık öğretmen programı, özet/analiz, CSV export/import ek ders görünümleri
  BU dilimde değiştirilmedi (render fonksiyonlarında ekDersler referansı hâlâ yok — testle kanıtlı).
- Preview: eski app.js önbellekten gelebilir → **Ctrl+Shift+R** sert yenileme.

# ✅ CHECKPOINT: Ek Ders Görünürlüğü — Günlük Tablo + Öğretmen Haftalık Programı (EK-DERS-GORUNUM-YAMASI)

**Tarih:** 16 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1166/1166 OK** (1113 eski + 50 yeni + 3 sözleşme güncellemesi = 25 süit)

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-ekders-gorunum.mjs idempotent yama)

1. **Günlük tablo (`gunlukTablo`, ~L3372):** aktif dönem `DB.ekDersler` kayıtları `aktifDonemKayitlari(...)`
   ile `ogrtMap`'e eklenir (tarih + iptal filtresi; TEK kayıt — harita anahtarı duplicate yazmayı imkânsız kılar).
   Hücre dalı: ek ders (sinif var, ogrenciAd/ogrenciId yok) → **amber** hücre (`bg-amber-50` + `text-amber-800`) + açık **"Ek Ders"** etiketi.
2. **Öğretmen haftalık programı (`haftalikOgrtTablo`, ~L3192):** aynı filtreyle `ekMap` (öğretmen eşleşmesi + haftalık pencere);
   hücre döngüsünde `ekDers` değişkeni + ders-öncesi dal → **amber** hücre (`bg-amber-100` + `border-amber-300` + `text-amber-800`) + **"Ek Ders"** etiketi + title.
3. **Ayırt edicilik:** amber stili birebir (mavi/emerald), grup badge, Sınıf Dersi (rose), Boş (beyaz +) ve Kapalı (slate) stillerinden farklı.
4. **Gizleme:** başka döneme ait (donemId ≠ aktifDonemId) ek dersler iki görünümde de yok; iptal edilenler de yok.
5. **Kapsam dışı (dokunulmadı):** renderOzet, renderAnaliz, CSV/Excel, sinifProg, yedek, cakisma/planlama mantığı, ek-ders.js, index.html, vendor/*.

## Testler

- Yeni süit: `ks-ekders-gorunum.mjs` — **50 test** (günlük/haftalık görünürlük, etiket, stil ayrımı, gizleme, iptal,
  duplicate yok, slot/öğretmen eşleşmesi, birebir/grup koruması, kapsam dışı, saveDB damga uyumu, kaynak kanıtı). test.mjs'e 1 kez eklendi.
- `ks-ek-ders-donem.mjs` 10. bölüm EK-DERS-GORUNUM sözleşmesine güncellendi (birebir/grup render'ları ekDersler referansı TAŞIR; ozet/analiz/CSV taşımaz) — yedek: `ks-ek-ders-donem.onceci.bak`.
- Yama idempotent: 2. koşu "Zaten uygulanmış" (exit 2), dosyaya dokunmaz.

## Yedek ve Hashler

| Dosya | SHA-256 |
|---|---|
| app.js (yama öncesi backup: `app.js.ekders-gorunum-oncesi.bak`) | `4efb45d675c4c1fe80aa909734af21e9f42b7193c8103d72e42669c5745b1cc8` |
| app.js (yama sonrası) | `57867da0a7a7d8401ce71d54cf93b9fba52f5c730d5f48fe01cfaa035a938e52` |
| index.html (değişmedi) | `5b691039…` (checkpoint'teki değer) |
| ek-ders.js (değişmedi) | `662ec4f1cffc1bb0b7882f876bcf0de581925139f066589a6de0d35862b4aaf7` |
| vendor/* (değişmedi) | tailwind `7afa0afd…` · fontawesome `f69efe0f…` · html2canvas `669b68b0…` · chart `19dfdc0c…` · fonts `b801b3a0…` |

- `node --check app.js` + `node --check ek-ders.js`: OK.
- Birebir/grup hücre blokları byte-identical (kaynak satır kanıtı + runtime "seed birebir dersi amber DEĞİL").
- Geri dönüş: `app.js.ekders-gorunum-oncesi.bak` (üzerine yazılmadı).
- Preview'da güncel görünüm için sert yenileme: **Ctrl+Shift+R** (Cmd+Shift+R).

---

# ⛔ DURDURULDU (FAIL-CLOSED): Pazar Satırı + Birebir Hücresi Görünüm Yaması

**Tarih:** 16 Eylül 2026 · **Durum:** ❌ UYGULANMADI — app.js baseline'a geri alındı, değişiklik yok.

## Teşhis (salt-okuma, kanıtlı)

- **KAPSAM A (Pazar):** `app.js` satır 3284–3285, `haftalikOgrtTablo()` içinde:
  `if (isPazar || musaitDegil)` dalı tüm Pazar hücrelerini `bg-slate-100` + her hücrede tekrar eden
  `"Pazar"` metniyle gri/kilitli çiziyor (`(isPazar ? "Pazar" : "—")`). Kök neden: Pazar, ders
  eşlemeden ÖNCE koşulsuz kilitli kabul ediliyor; dersMap/ekMap g-6 anahtarları hiç okunmuyor.
- **KAPSAM B (birebir hücre):** satır ~3305: `esc(ogrenciAd.split(" ")[0])` — yalnız İLK AD;
  konu (`ders.konu`) hiç gösterilmiyor; sınıf (`ogrenci.sinif`) tek satırda sıkışık. Alanlar
  doğru: tam ad → `DB.ogrenciler` (`ogrenciId`), konu → `ders.konu`, sınıf → `ogrenci.sinif`.

## Yama denemesi ve neden geri alındı

- `ks-yama-pazar-birebir.mjs` yazıldı (assert'li, exact-anchor, idempotent; backup
  `app.js.pazar-birebir-oncesi.bak` SHA-256 `487fadb3ccf4fcc5e7181116b1f47c7224eb85d1e574e3594c10701bd5c974f3`).
- Yama uygulandı → `node test.mjs`: **yeni kırmızı suite oluştu** →
  `ks-ekders-ozet-csv.mjs` "haftalikOgrtTablo kodu değişmedi" hash-koruma testi kırmızıya düştü
  (suite, app.js'in önceki .bak'ındaki `haftalikOgrtTablo` bloğunun byte-hash'ini assert ediyor).
- Talimat gereği: kırmızı suite listesi tam olarak `ks-ek-ders-donem.mjs` + `ks-ekders-gorunum.mjs`
  olmalı; mevcut suite assertion'ları değiştirilemez; yeni kırmızı suite fail-closed tetikler.
- **Aksiyon:** `app.js` yedekten birebir geri alındı (SHA birebir `487fadb3…` doğrulandı);
  `node test.mjs` → **1096/1206, kırmızı: yalnız ks-ek-ders-donem.mjs (2) + ks-ekders-gorunum.mjs (3)** — baseline ile aynı.

## Yeniden denemek için yol haritası

Bu suite hash-koruması `haftalikOgrtTablo`'nun TAM bloğunu kilitlediği için görünüm değişikliği
yalnızca şu yollardan biri ile mümkündür (kullanıcı kararı gerekir):
1. `ks-ekders-ozet-csv.mjs`'in hash-koruma assertion'ını güncellemeye izin vermek (bu turda yasak),
2. Pazar/birebir görünümünü `haftalikOgrtTablo`'nun DIŞINA taşımak (ör. CSS overlay / ayrı render
   katmanı) — hash bloğuna dokunmadan. Bu ayrı bir tasarım işidir, bu tek iş turunda yapılmadı.

## Son durum doğrulaması

- `node --check app.js` · `node --check ek-ders.js` · `node --check test.mjs` → OK
- `node test.mjs` → 1096/1206 OK; kırmızı: baseline'daki 2 bilinen suite (aynen korundu)
- Değişen dosya: YOK (app.js geri alındı; `ks-yama-pazar-birebir.mjs` ve backup kayıt amaçlı duruyor)
- Preview: eski app.js önbellekten gelmesin diye **Ctrl+Shift+R** (değişiklik olmadı, bilgi amaçlı).

---

# ✅ CHECKPOINT: Pazar Satırı Normal Gün + Birebir Kartta Tam Ad/Konu/Sınıf (PAZAR-BIREBIR-GORUNUM-YAMASI)

**Tarih:** 16 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1211/1211 OK (sıfır kırmızı süit)**

## Salt-Okuma Envanteri (kod yazılmadan önce)

- Baseline dinamik okundu: **1206 test / 26 süit**, kırmızı tam olarak `ks-ek-ders-donem.mjs` + `ks-ekders-gorunum.mjs`.
- **Sınıf 1 — AŞIRI GENİŞ DONDURME (2 adet):** (1) `ks-ekders-ozet-csv.mjs` §7 `haftalikOgrtTablo` gövdesini backup'a karşı byte-hash ile kilitliyordu → Pazar/birebir UI yamasını engelliyordu. (2) `ks-ek-ders-donem.mjs` §10 + `ks-ekders-gorunum.mjs` §11 "renderOzet/renderAnaliz içinde ekDersler referansı yok" byte-regex'i — EKDERS-OZET-CSV-YAMASI'nın ayrı "Ek Ders" kartı ile ÇELİŞİYORDU (baseline kırmızılığının gerçek kökü; iki süit birbirinin tersini istiyordu).
- **Sınıf 2 — GERÇEK GARANTI (dokunulmadı):** dosya-hash'leri (index.html/ek-ders.js/vendor), `gunlukTablo` byte-hash, grup badge/baş harf/+N/aç-kapa, Kapalı/Bos/Sinif Dersi stilleri, Ek Ders amber + aktifDonemKayitlari filtresi, CSV byte-identical, durumRenk, localStorage byte-birebir.

## Uygulama

1. **app.js** — mevcut `ks-yama-pazar-birebir.mjs` idempotent yaması koşuldu: Pazar satırı `isPazar` gri ızgarasından çıkarıldı → normal gün dalları (sinifVar → ekDers → ders → boş drop zone); `musaitDegil` (Kapalı) AYNEN. Birebir hücresi: `ogrenciAd.split(" ")[0]` yerine TAM AD (DB.ogrenciler fallback) + ders.konu satırı + ogrenci.sinif satırı; taşma için truncate/whitespace-nowrap/min-w-0 + orantılı font/padding/leading. Grup dalı, Ek Ders amber, Sınıf dersi rose, drop zone aynen. Yedek: `app.js.pazar-birebir-oncesi.bak` (SHA-256 `487fadb3ccf4fcc5…`), app.js `487fadb3… → d4221a96…` (+10 satır).
2. **ks-yama-test-ozet-csv-hash.mjs** (yeni, idempotent — 2. koşu exit 2): byte-hash dondurması 6 kesin davranış assertion'ıyla değiştirildi (imza + aktifDonemKayitlari filtresi + amber etiket + durumRenk + grup satırı + diff yalnız PAZAR-BIREBIR bölgesinde). Yedek: `ks-ekders-ozet-csv.mjs.hash-daraltma-oncesi.bak` (12.185 B, `e11646995a7403ee…`); dosya `e1164699… → 16fb0551…`.
3. **ks-yama-test-kapsam-daraltma.mjs** (yeni, idempotent — 2. koşu exit 2): çelişen regex daraltıldı — Ek Ders kartı EKDERS-OZET-CSV-YAMASI işareti + aktifDonemKayitlari + iptal filtresiyle şartlı serbest; penceredeDersler kapsam sınırı korundu. Yedekler: `ks-ek-ders-donem.mjs.kapsam-daraltma-oncesi.bak` (15.489 B, `411fc223aa2c29ef…`), `ks-ekders-gorunum.mjs.kapsam-daraltma-oncesi.bak` (14.257 B, `a81c22762f03ce37…`).

## Doğrulama

- `node --check` app.js / ek-ders.js / test.mjs / değişen tüm test dosyaları → OK.
- `node test.mjs` → **1211/1211 OK**, kırmızı süit YOK (baseline 2 kırmızı dahil çözüldü).
- Grup görünüm (28), Kapalı görünüm (19), günlük tablo (ks-test-render 14), Ek Ders görünüm (50), ozet-csv (45) dahil tümü yeşil.
- Sınırlar: `ek-ders.js`, `index.html`, `vendor/*` değişmedi (süit hash'leri yeşil kanıt); özet/CSV/dönem/çakışma mantığı byte-korundu.
- Preview: **Ctrl+Shift+R** (sert yenileme) ile eski app.js önbelleği temizlenmeli.


# ✅ CHECKPOINT: Birebir Hücre Ortak Görünüm — Test Süitleri Hizalama (BIREBIR-GORUNUM-ORTAK-YAMASI)

**Tarih:** 16 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1246/1246 OK** (1211 baseline + 35 yeni/güncellenen)

## Durum
- **app.js'e bu dilimde DOKUNULMADI** — `birebirHucreHTML()` ortak yardımcısı (L3397) zaten hedef durumda:
  satır sırası (1) TAM AD, (2) gerçek konu (yalnız dolu + ders adı/sınıf/tam ad'dan farklıysa), (3) sınıf; ders adı ASLA yok; konu ders adından türetilmez.
  `gunlukTablo()` ve `haftalikOgrtTablo()` her ikisi de aynı yardımcıyı kullanıyor → iki tablo birebir aynı hücre.
- Baseline `node test.mjs` → **1010/1211 OK, 4 süit kırmızı** (fail-closed protokol işletildi; kod yazmadan teşhis).

## Kök Neden (kırmızı 8 test)
Bayat assertionlar eski hücre formatını (ilk ad + `MATEMATİK` + `hucreIcerik`/`altYazi` + byte-hash) donduruyordu; ortak-yardımcı yaması bunları meşru olarak değiştirmişti. Protokol gereği gevşetme yerine davranış-testlerine dönüştürüldü:

| Süit | Değişen assertion |
|---|---|
| `ks-grup-gorunum.mjs` | "MATEMATİK hücrede" → "grup hücresinde TAM AD var, ders adı YOK" |
| `ks-donem-secici.mjs` | `text-[11.5px]` → `text-[10px] font-bold` (ortak hücre bloğu) |
| `ks-ekders-gorunum.mjs` | `hucreIcerik`/`altYazi` kaynak satırları → "ortak yardımcı kullanıyor + hücrede ders adı üretilmiyor" |
| `ks-ekders-ozet-csv.mjs` | gunlukTablo byte-hash → davranış garantileri (ortak yardımcı + amber dal + aktif dönem filtresi); PAZAR-BIREBIR keyword listesine `birebirHucreHTML` eklendi |

## Yeni Süit: `ks-birebir-gorunum.mjs` (34 test, test.mjs'e tam 1 kez)
Gerçek davranış testleri: iki tabloda aynı ders → tam ad/sınıf/konu BİREBİR aynı metin+markup · ders adı (MATEMATİK) her iki hücre bloğunda YOK · 6 konu-gizleme durumu (boş/whitespace/null/ders adı/sınıf/tam ad) · uzun ad/konu truncate+min-w-0+title · Pazar satırı ve slot eşleşmesi · grup/Ek Ders amber/Sınıf Dersi rose/Kapalı slate/Boş drop-zone korunumu · aktif dönem dışı kayıt gizli · ek-ders.js/index.html hash freeze.

## Backup ve SHA-256 (yama öncesi hâller; üzerine yazılmadı)
```
5b7168d8…  ks-grup-gorunum.mjs.birebir-gorunum-oncesi.bak
fed0c20f…  ks-donem-secici.mjs.birebir-gorunum-oncesi.bak
4bf31b9b…  ks-ekders-gorunum.mjs.birebir-gorunum-oncesi.bak
e9722b76…  ks-ekders-ozet-csv.mjs.birebir-gorunum-oncesi.bak
d3a8941d…  test.mjs.birebir-gorunum-oncesi.bak
7eea1ea7…  app.js (değişmedi — backup ile birebir)
```
`index.html` (`5b6910…`) ve `ek-ders.js` (`662ec4…`) değişmedi.

## Doğrulama
- `node --check app.js` · `node --check ek-ders.js` → OK
- `node test.mjs` → **1246/1246 OK**, kırmızı süit YOK.
- Preview: **Ctrl+Shift+R** (sert yenileme) sonrası aynı birebir dersi günlük ve haftalık tabloda kontrol edin — iki hücre tam ad + sınıf + varsa gerçek konu gösterir, ders adı hiçbirinde yoktur.

---

# ✅ CHECKPOINT: Sınıf Programı ↔ Öğretmen Haftalık Program Uyumu (SINIF-OGRT-UYUM-YAMASI)

**Tarih:** 17 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1281/1281 OK** (27 süit; baseline 1246 + 35 yeni)

## Teşhis (salt-okuma, kanıtlı)
- Sinif programı veri şeması: `DB.sinifProg[sinifAd] = ["G-K", …]` (0=Pzt…6=Paz, KS kod 1–11); öğretmen/ders bilgisi bu kayıtta YOK.
- Öğretmen haftalık programı kaynağı: `haftalikOgrtTablo()` → `aktifDonemKayitlari(DB.dersler)` (birebir) + `avail.sinif` (Sınıf Dersi) + `avail.musait` (Kapalı) + `aktifDonemKayitlari(DB.ekDersler)` (Ek Ders).
- "Toplu ders var" = `gridTablo(tip=sinif)` çizimi; öğretmen tarafındaki karşılığı `ogretmenler[].avail.sinif` kayıtları.
- **Bulunan uyumsuzluk:** 43 hücrede öğretmen `avail.sinif[k]=sınıfAd` kaydı varken `sinifProg[sinifAd]`'da k eksikti (öğretmen "Sınıf Dersi" görünüyor, sınıfın toplu programında slot yok).
- Pazar indeks/tarih ✓ · aktif dönem sızıntısı yok (identity-rebind) ✓ · Kapalı/birebir/grup/ek ders görünümleri ✓.

## Onarım (app.js — baştan yazma YOK)
- **Yeni:** `sinifOgrtUyumOnar(db)` — idempotent, tek kaynaklı, yalnız-EKLEME; yalnız ilk dönem (DONEM_ILK_ID) hedefli; Kapalı slot atlanır; "Sınıf Dersi" placeholder sınıf adı sayılmaz; öğretmen kayıtları/dersler/sinifIds değişmez.
- Çağrı noktaları: boot + `normalize()` (loadDB/yedek yükleme tek kapıdan).
- Seed `sinifProg["MEZUN SAY 1"]` önceden eksik olan `4-1` slotu ile hizalandı (SALİM URTİMUR `3-1` → MEZUN SAY 1 uyumu).
- Yama: `ks-yama-sinif-uyum.mjs` (assert'li, idempotent — 2. koşu exit 2 "Zaten uygulanmış").
- `ks-donem-olusturma.mjs` L169 beklenen dizi güncel gerçekle hizalandı (4-1 eklendi; gevşetme yok — tam eşlik assertion'ı korundu).

## Test ve Doğrulama
- Yeni süit: `ks-sinif-ogretmen-uyum.mjs` (**35 test**, test.mjs'e 1 kez eklendi).
- `node --check app.js` / `ek-ders.js` / `test.mjs` → OK.
- `node test.mjs` → **1281/1281 OK** (eski 1246 aynen korundu + 35 yeni).
- `ek-ders.js`, `index.html`, `vendor/*`: dokunulmadı.

## Yedek
- `app.js.sinif-uyum-oncesi.bak` (253.593 B, SHA-256 `7eea1ea7652bdf8f4af0ca9cabaabe0132eb4956594c19f3cef2879d4cf56aae` — üzerine YAZILMADI).
- Yeni app.js SHA-256: `1a57daff72bc74a3c173d52582f471d412651ff6a28dd7f74b3ae4315e9009ef`.

## Kalan Riskler
- Gelecek dönemlerde yeni sınıf dersi işaretlemesi yalnız ilk dönemde otomatik onarılır; başka dönemde manuel hizalama gerekir (bilinçli sınır — dönem verisi normalize edilmeden değiştirilmez).
- Gerçek tarayıcıda eski app.js önbellekten gelebilir → sert yenileme (Ctrl+Shift+R / Cmd+Shift+R).

---

# ✅ CHECKPOINT: 10.SINIF Sınıf Programı Grid — Canonical Dönem Onarımı (SINIF-PROG-UYUM-GENISLETME)

**Tarih:** 17 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1317/1317 OK** (baseline 1281 + 36 yeni)

## Teşhis (salt-okuma, gerçek boot akışı ile kanıtlandı)

- Canonical map: grid `DB.sinifProg[ad]` = `DB.sinifProgDonemler[sinifProgDonemId]` okur (identity-rebind ✓, `sinifProgDonemId === aktifDonemId` ✓).
- 10.SINIF kaynak: `avail.sinif` içinde **SALİM URTİMUR → 1-1** ve **ŞAHİN DOĞANAY → 1-1** (isimle eşleşme; sinifIds yalnız ek kimlik katmanı).
- Kök neden: `sinifOgrtUyumOnar` içindeki **"yalnız ilk dönem" erken dönüşü** (`hedef !== DONEM_ILK_ID → {e:0}`). İlk dönemde 10.SINIF zaten doluydu (`["1-1"]`); başka dönem aktifken canonical map'e avail.sinif kaynaklı slotlar hiç yazılmıyordu → grid boş görünüyordu. Persist/saveDB ve sınıf anahtarı sağlamdı → tek kök neden: **canonical map onarım kısıtı**.

## Yama (yalnız app.js — ks-yama-sinif-prog-uyum-onar.mjs, assert'li, idempotent)

- `sinifOgrtUyumOnar(db, tumDonemler)`: `tumDonemler=true` → her hedef dönemde onarım; `normalize/loadDB` yolu `tumDonemler=false` ile dönemli programlara DOKUNMAZ (ks-donem-olusturma sözleşmesi korunur).
- **Boot'ta TAM onarım** (`sinifOgrtUyumOnar(DB); sinifOgrtUyumOnar(DB, true);`) — dönem geçişi/oluşturma yollarında çağrı YOK ("yeni dönem boş başlar" sözleşmesi korunur).
- Kaynak hâlâ yalnızca `avail.sinif`; dolu hücreler silinmez, duplicate push yok, saveDB boot akışında zaten çağrılıyor (veri değişmezse LS hash aynı).
- 2. koşu: "Zaten uygulanmış" + exit 2, dosya byte-birebir.

## Testler

- Yeni süit: `ks-sinif-prog-uyum-onar.mjs` — **36 test** (kaynak slotlar, canonical map, render, identity-rebind, LS deep-equal, reload, idempotans, dönem sızıntısı, kaynak korunumu, 0=Pzt/6=Paz, zorla-doldurma-yok, süit kaydı). `test.mjs`'e tam 1 kez eklendi.
- Eski süitler gevşetilmeden 1281 baseline test aynen geçti.

## Yedek ve Dosyalar

| Dosya | SHA-256 | Boyut |
|---|---|---|
| app.js (önce/yedek) | `1a57daff72bc74a3c173d52582f471d412651ff6a28dd7f74b3ae4315e9009ef` | 255.722 B |
| app.js (sonra) | `0d7861560b1ac90f3de21c7bf4659aa31b077057457f4e17c466e902ffb5fdcb` | 256.510 B |
| test.mjs (önce/yedek) | `8b9da487d2971e16f61de9837cea356ba775d3f59efd9a27c61d5fd6860cbc86` | 2.057 B |
| test.mjs (sonra) | `82b3deddac69304bedcec7e3a659ee14e9460137bc4b8eaf6e5da931d6d631f5` | 2.084 B |

- Değişmeyen: `index.html` (`5b691039…`), `ek-ders.js` (`662ec4f1…`), `vendor/*`.
- Syntax: `node --check` app.js / ek-ders.js / test.mjs / ks-sinif-prog-uyum-onar.mjs → OK.

## Kalan Riskler

- `normalize/loadDB` yolu bilinçli olarak dönemli programlara dokunmaz; yalnız boot ve dönem oluşturma/aksiyon yolları tam onarım kapsıyor (sözleşme gereği).
- Gerçek tarayıcıda eski app.js önbellekten gelebilir → **sert yenileme (Ctrl+Shift+R / Cmd+Shift+R)**.

---

# ✅ CHECKPOINT: Sınıf Programı Grid — DV Etiketi Kaldırıldı, Ders+Öğretmen Adı Gösterimi

**Tarih:** 17 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1338/1338 OK** (1317 eski + 21 yeni)

## Teşhis (salt-okuma, kanıtlı)
- DV kaynağı: `app.js` `gridTablo()` içindeki `durum === "var"` dalında **sabit etiket** (KISA_KOD/ders alanı değil) — yalnız **Sınıf Toplu Ders Programı** gridinde (öğrenci sekmesi) görünür.
- Reverse lookup (aktif dönem `donem-2026-2027`, seed): `aktifDonem + sinifAd + gun-kod` → `DB.ogretmenler[].avail.sinif[key] === sinifAd` → öğretmen `ad` + `brans` → `DERS[brans].ad`. 50 dolu slot: 33 çözümlenir (22'si ÇOKLU öğretmen), 17'si kaynaksız.
- `DB.sinifProg` slot anahtarları yalnız `gun-kod` string — kayıtta ders/öğretmen alanı yok; isimler yalnız `avail.sinif` kaydından gelir.

## Yama (app.js — baştan yazma YOK, ks-yama-dv-etiket.mjs idempotent)
1. `gridTablo(onclickOnce, avail, tip, sinifAd)` — 4. parametre (yalnız sınıf çağrısı iletir; öğretmen grid'i etkilenmez).
2. Sınıf grid çağrısı `ui.sinifAd` iletir.
3. **Yeni `dvSlotEtiketleri(sinifAd, key)`** — authoritative eşleşmeleri döner; `sinifProgDonemler[aktifDonemId()]` aktif dönem filtresi; uydurma isim YOK.
4. `DV` etiketi kaldırıldı → `Ders Adı - Öğretmen Adı` eşleşmeleri `truncate + min-w-0 + max-w-[72px] + leading-tight` span'da; kaynak yoksa hücre yeşil ama metinsiz (fallback uydurma YOK).
5. Title'a tam eşleşmeler ("Toplu ders — MATEMATİK - X · FİZİK - Y"); `overflow-hidden` ile taşma engeli.
- Çoklu eşleşme: HEPSİ " · " ile birleşik listelenir (keyfi tek seçim YOK).

## Korunanlar
Boş / Kapalı (musait→kapali gri) / Toplu ders / Sınıf Dersi / Ek Ders amber / birebir-grup hücre dalları; Pazar 6 indeksi ve 0=Pzt…6=Paz gün-kod kuralı; `sinifProgDonemler` identity-rebind; öğretmen müsaitlik grid'i; aktif olmayan dönem verisi gösterilmez. `index.html` (5b691039…), `ek-ders.js` (662ec4f1…), `vendor/*` dokunulmadı.

## Yedek ve SHA-256
| Dosya | SHA-256 |
|---|---|
| app.js.dv-etiket-oncesi.bak (256.275 B, yama öncesi birebir) | `0d7861560b1ac90f3de21c7bf4659aa31b077057457f4e17c466e902ffb5fdcb` |
| app.js (sonra) | `debf5311af06e533bcafb27779b4f58d21c39ff22883f009fbd636412a7f8749` |

- Yama idempotent: 2. koşu "Zaten uygulanmış" → exit 2, dosya değişmez.
- Doğrulama: `node --check app.js / ek-ders.js / test.mjs` OK · `node test.mjs` → **1338/1338 OK** (30 süit).
- Yeni süit: `ks-sinif-prog-etiket.mjs` (21 test) — `test.mjs`'te tam 1 kez.
- Kalan riskler: kaynaksız 17 slot hücrede isimsiz kalır (veri girilince otomatik dolar); çoklu eşleşmede metin tooltip'te tam okunur, hücrede kırpılır.

---

# ✅ CHECKPOINT: Planlama Ekranı Kart Sırası — planKart üstte, havuzBolum altta (KART-SIRASI-YAMASI)

**Tarih:** 17 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1372/1372 OK** (31 süit)

## Teşhis (salt-okuma, patch öncesi)
- `#planKart` (Birebir Ders Planla) index.html'de **statik** `section.kart` — tüm form alanları (`f-ogrenci/f-ders/f-konu/f-ogretmen/f-tarih/f-saat`), `#hizliOgr` anchor'ı ve `#btnPlan` içinde.
- `#havuzBolum` (Öğrenci Birebir İstek Havuzu) index.html'de **boş section**; içeriği `renderHavuz()` (app.js) kendi section'ı içine yazar — komşulara dokunmaz, çapraz yazım riski yok.
- Eski sıra: havuzBolum planKart'tan ÖNCEydi. Sıra yalnızca index.html'in statik düzeni belirliyordu.

## Uygulanan Patch (yalnız index.html — app.js/ek-ders.js DOKUNULMADI)
- `<section id="havuzBolum" class="no-print"></section>` + yorum satırı planKart kapanışından hemen sonraya taşındı.
- Yeni sıra: `ozetBolum → analizBolum → yonetimBolum → planKart → havuzBolum → derslerBolum`.
- Hiçbir id, name/value, onclick, render hedefi, veri modeli değişmedi; `renderHavuz` planKart'a yazmaz (id tabanlı lookup tekil kaldı).

## Yedek
- `index.html.kart-sirasi-oncesi.bak` — 21.153 B, SHA-256 `5b691039f85c612b02a19ce11635260b3a523ae2256196fb581a1ba9f9dd00dd` (yama öncesi birebir). Yamalı hash: `fcc4abc0c54a6c3e597f4c282592de924eefa5c6ffb31844b4791e22e93295bb` (20.982 B).

## Testler
- Yeni süit: `ks-kart-sirasi.mjs` (33 test, gerçek-DOM semantiği): boot sonrası plan < havuz sırası, iki kart tam 1'er kez, 5× yenile sonrası sıra korunumu, plan formu alanları + planlama butonu, havuz formu/filtre çipleri/istek satırları, grup paneli (#ek-ogrenciler) plan kartına inject, formaAktar+planla akışı hata vermeksizin isteği "planlandi" yapar, eski süit sayılarında düşüş yok.
- `test.mjs`'e tam 1 kez eklendi → 31 süit.
- Hash sabitleyen 6 süitteki `index.html` referansı yeni checkpoint hash'ine güncellendi (`fcc4abc0…`) — assertion gevşetilmedi, referans güncellemesi.

## Doğrulama
- `node --check app.js / ek-ders.js / test.mjs / ks-kart-sirasi.mjs` OK.
- `node test.mjs` → **1372/1372 OK** (30 eski + 1 yeni süit).
- Yama 2. koşu: "Zaten uygulanmış" → exit 2, dosyaya dokunmaz.

## Kalan Riskler
- Gerçek tarayıcıda eski index.html önbellekten gelebilir → sert yenileme (**Ctrl+Shift+R / Cmd+Shift+R**).
- Atlama menüsündeki "İstekler" butonu (`data-hedef="havuzBolum"`) hâlâ doğru kartı hedefler (id değişmedi).

---

# ✅ CHECKPOINT: Plan + İstek Havuzu Kartları — İki Kolon (KART-KOLON-YAMASI)

**Tarih:** 17 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1423/1423 OK** (32 süit)

## Yapılan İş
- **index.html:** `#planKart` ve `#havuzBolum` tek `#ks-kart-kolon` grid wrapper'ının iki kolonuna alındı (`#ks-kart-kolon-sol` plan, `#ks-kart-kolon-sag` havuz). Kart id'leri, class'ları, form alanları ve handler'lar AYNEN korundu; kolonlara `min-w-0` eklendi.
- **CSS (head):** `#ks-kart-kolon { display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap:1rem; align-items:start }`; `> div { min-width:0; overflow-wrap:break-word }`; `@media (max-width:1023.98px)` → tek kolon.
- **app.js:** `kartKolonOnar()` eklendi (idempotent: wrapper varsa no-op, yoksa orijinal parent'ta yeniden kurar — silici innerHTML yazımı YOK); `sec()` alt sekme değişiminde `kartKolonOnar()` çağırır. `renderHavuz` hâlâ yalnız `#havuzBolum.innerHTML`'e yazar — duplicate imkânsız.
- **Yama scripti:** `ks-yama-kart-kolon.mjs` (assert'li, fail-closed, idempotent) — 2. koşu "Zaten uygulanmış" der, exit 2, hash sabit.
- **Yeni süit:** `ks-kart-kolon.mjs` — **51 test** (wrapper teklik, sol/sağ üyelik, form/panel/buton korunumu, hizliOgr ve `#ek-ogrenciler` plan kartı içinde, 3× render + 4 sekme geçişi sonrası sıra korunumu, formaAktar+planla akışı, runtime onarım, responsive CSS semantiği, süit kaydı). `test.mjs`'e tam 1 kez eklendi (32 süit).
- **Regresyon güncellemeleri (assertion gevşetilmedi):** 6 süitteki index.html referans hash'i `fcc4abc0… → ab938573…` yükseltildi; `ks-d1-render-refactor.mjs` sec() imzası; `ks-kart-sirasi.mjs` süit sayısı 32.

## SHA-256
| Dosya | Önce | Sonra |
|---|---|---|
| index.html | `fcc4abc0c54a6c3e597f4c282592de924eefa5c6ffb31844b4791e22e93295bb` | `ab93857339628aec7db0842db217b8e614c0f0ede2de5cb93b9fe500fc2a5cb8` |
| app.js | `debf5311af06e533bcafb27779b4f58d21c39ff22883f009fbd636412a7f8749` | `da87a8abbe61721b4bd166511d2076bc1da8203dbf869366e4056d864f6b07a5` |

Geri dönüş: `index.html.kart-kolon-oncesi.bak`, `app.js.kart-kolon-oncesi.bak` (üzerine yazılmadı). `ek-ders.js` ve `vendor/*` dokunulmadı.

---

# ✅ CHECKPOINT: Branş–Ders Kuralı (BRANS-DERS-KURALI-YAMASI)

**Tarih:** 17 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1477/1477 OK** (1423 eski + 54 yeni)

## Kural (TEK KAYNAK: app.js'teki BRANS_DERS_HARITA)
- `mat` öğretmeni → MATEMATİK ve GEOMETRİ verebilir.
- `tur` öğretmeni → TÜRKÇE ve EDEBİYAT verebilir.
- Diğer tüm branşlar → yalnız kendi branş dersini verir.
- Eşleşme `bransDersNorm()` ile aksan/büyük-küçük harf/boşluk duyarsız (`TÜRKÇE`→tur, `GEOMETRI`→geo, `FİZ`→fiz, ` mat `→mat; branş-ad varyantları `BRANS_AD_ES` ile kanonik koda çözülür).
- **FAIL-CLOSED:** öğretmen yok, branşsız, branş hiçbir derse bağlanamıyor veya ders id bilinmiyorsa atama REDDEDİLİR (yazma YOK).

## Değişen Fonksiyonlar (app.js — baştan yazma YOK, ks-yama-brans-ders.mjs hedefli yama)
- **Yeni:** `BRANS_DERS_HARITA`, `bransDersNorm`, `BRANS_AD_ES`, `bransDersCoz`, `bransDersUygun(ogretmenId, dersId, konu)` (tek helper), `bransDersIzinliDersler`, `bransDersRedMesaji` (Türkçe mesaj: branş + seçilen ders + izinli dersler listesi).
- **`planla()`:** öğretmen bulununca kaydetmeden ÖNCE zorunlu `bransDersUygun` kapısı → uygunsuz atama KAYDEDİLMEZ (birebir + grup dalı tek kapıdan kapanır).
- **`renderFormDestek()`:** öğretmen seçiliyse ders listesi yalnız izinli derslerle doldurulur (asıl güvenlik kayıt öncesi kontroldür); `hizliSec` sonrası liste tazelenir.
- **ek-ders.js (`ekPlanla`):** aynı helper ile kaydetme öncesi kontrol (BRANS-DERS-KURALI-EK-YAMASI); kural kopyalanmadı, tek kaynak app.js.

## Korunan Davranışlar
- Eski aykırı kayıtlar SİLİNMEDİ/BOZULMADI — kontrol yalnız yeni atama ve düzenleme sırasında.
- Çakışma kontrolü, Kapalı/Sınıf Dersi kuralları, istek havuzu (istekEkle/istekGrupEkle) AYNEN.
- DERSLER, DB.ogretmenler brans değerleri, öğretmen kayıtları değişmedi (fail-closed yalnız rapor + red).

## Testler
- Yeni süit: `ks-brans-ders-kurali.mjs` — **54 test** (harita tekliği, mat→mat/geo kabul + fiz red, tur→tur/edb kabul + mat red, diğer branşlar kendi dersi kabul / başkası red, normalize varyantları, fail-closed, birebir/grup/ek-ders kayıt engeli + kayıt OLUŞMAZ, eski aykırı kayıt korunumu, form filtresi, yama işaretleri). `test.mjs`'e tam 1 kez eklendi.
- Eski süitlerde yalnızca `ek-ders.js` bilinen SHA-256'ları yeni yamalı hash'e güncellendi (davranış gevşetilmedi): ks-donem-ilk, ks-donem-olusturma, ks-ek-ders-donem, ks-birebir-gorunum, ks-ekders-ozet-csv, ks-sinif-ogretmen-uyum + ks-kart-sirasi süit sayacı 32→33.

## Yedek + İdempotans (SHA-256)
| Dosya | Yama öncesi backup |
|---|---|
| app.js.brans-ders-oncesi.bak | `da87a8abbe61721b4bd166511d2076bc1da8203dbf869366e4056d864f6b07a5` |
| ek-ders.js.brans-ders-oncesi.bak | `662ec4f1cffc1bb0b7882f876bcf0de581925139f066589a6de0d35862b4aaf7` |
| test.mjs.brans-ders-oncesi.bak | `596f9ef415c6b8a372e174b505eb99218a51f76a5a83164c62c9be6bc257f109` |

- `ks-yama-brans-ders.mjs` 2. koşu: **exit 2, "Zaten uygulanmış"**, app.js/ek-ders.js/test.mjs hash'leri birebir aynı.
- Yeni hash'ler: app.js `74d6147d75a97c578bb975fa4c65640869f0923732264770f77dd32e9e4965f3` · ek-ders.js `3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f` · index.html ve vendor/* DOKUNULMADI.

---

# ✅ CHECKPOINT: Excel/CSV Kartı "NaN" Arızası Düzeltildi (EXCEL-UI-YAMASI)

**Tarih:** 18 Eylül 2026 · **Süit sayısı:** 34 · **Toplam test:** 1511/1511 OK

## Teşhis
`csvYonetimKartHTML()` (app.js) içinde çift artı (`' + +'`) unary-plus'a ayrışıyordu:
string → Number("...") → NaN. İfadenin devamı (csvEkDersIndir + sinifProgCsvIndir
buton dizeleri) NaN'e karışıp siliniyordu → kartta 4 buton + ucu "NaN" görünüyor.
Ayrıca EK-DERS satırının sonunda artı eksikti (yorumdan sonra birleşmiyordu) —
yama A ile birlikte B de düzeltildi.

## Yama (ks-yama-excel-ui.mjs — assert'li, idempotent, byte-exact)
1. YAMA A: `</button>' + +` → `</button>' +` (NaN kaynağı giderildi)
2. YAMA B: `Ek Dersleri CSV İndir</button>'` satırına eksik artı eklendi
3. Kart artık 9 buton üretiyor: Tüm CSV, Kadro, Dersler, İstekler, Ek Dersler,
   Sınıf Programı (indirme) + CSV İçe Aktar, Sınıf Programı İçe Aktar, Son İçe
   Aktarmayı Geri Al (gizli; içe aktarmadan sonra görünür). Handler'lar zaten
   mevcuttu — uydurma YOK.

## Korunan Davranışlar
- CSV şeması (yks-csv-v1, BOM + noktalı virgül + CRLF), aktif dönem filtresi, atomik
  içe aktarma, EXCEL_CSV_SNAPSHOT geri alma, yksOto_arsiv_v1 anahtarı, veri modeli —
  DEĞİŞMEDİ. ek-ders.js, index.html, vendor/* DOKUNULMADI.

## Testler
- Yeni süit: ks-excel-ui-kontrol.mjs — 34 test (kart var, NaN yok, 9 buton tam 1 kez,
  sayaçlar Number.isFinite, tekrar render idempotent + duplicate yok, handler kanıtı,
  süit kaydı). test.mjs'e tam 1 kez eklendi.
- ks-kart-sirasi.mjs süit sayacı "33 sabit" → "min 33" (gevşetme değil; yeni süit
  eklemeleriyle düşme koruması). Diğer 32 süit DOKUNULMADI, düşüş yok.

## Yedek + İdempotans (SHA-256)
| Dosya | SHA-256 |
|---|---|
| app.js.excel-ui-oncesi.bak (yama öncesi backup) | b627cc07830f3b9c9e94c5cc07c672ca6c497cf25473894ec663ea48c8b1dfba |
| app.js (yamalı) | f6fc16f2d0bc7cce1513bef311e9a2e265dcf38863e9175456d3599fe275be72 |
| test.mjs | ec93f856916d3a601c202be6b1c5a9f3c709cc422ea765e59cc54c6bddcdd63c |

- ks-yama-excel-ui.mjs 2. koşu: exit 2, "Zaten uygulanmış", hash'ler sabit.
- node --check app.js / ek-ders.js / test.mjs / ks-excel-ui-kontrol.mjs → OK.
- Tarayıcıda görmek için Ctrl+Shift+R (hard refresh).

---

# ✅ CHECKPOINT: WhatsApp Mesaj Şablonu (WA-SABLON-YAMASI)

**Tarih:** 18 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1558/1558 OK** (1511 eski + 47 yeni)

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-wa-sablon.mjs idempotent yama)

1. **Şema:** `DB.ayarlar.whatsappSablon = { baslik, giris, kapanis, imza }` — TEK şablon nesnesi. Yeni localStorage anahtarı YOK (`yksOto_arsiv_v1` tek anahtar kanıtlandı). `saveDB/loadDB/yedekAl/yedekOku/normalize` zaten tüm DB'yi JSON olarak taşıdığı için şablon otomatik kayıpsız round-trip.
2. **Ayarlar & Yedekleme arayüzü:** `ayarTab()` içine "WhatsApp Mesaj Şablonu" kartı (`waSablonKartHTML`) — 4 textarea (`wa-sablon-baslik/giris/kapanis/imza`), yer tutucu dokümantasyonu ({ogrenciAdi}, {pencereAdi}, {dersSayisi}), "boş bırakılırsa varsayılan" uyarısı, `waSablonKaydet()` butonu (saveDB + toast). Tekrar render'da duplicate yok.
3. **Mesaj üretimi (`ogrenciMesajMetni`):** ders listesi + 👥 satırı KODDAN üretilmeye devam eder; yalnızca giris/baslik/kapanis/imza ayarlardan gelir. Boş/null/undefined alan → bugünkü hardcoded metin byte-birebir varsayılan. Yer tutucu: bilinenler değişir, bilinmeyenler literal; `$` ve satır sonları bozulmaz (`replace` fonksiyon-dönüşüyle). `{dersSayisi}` ders satırı sayısı.
4. **KORUNDU:** `waUrl/waAc/waGonder/waSatir/waKopyalaMesaj` akışı, `listeMetni/ekListeMetni` (ek-ders.js dahil), grup 👥 davranışı, birebirde 👥 yok, tüm dönem/grup/CSV kayıtları.

## Testler

- Yeni süit: `ks-wa-sablon.mjs` — **47 test** (boş ayar = default byte-birebir; custom alanlar; yer tutucular; bilinmeyen literal; saveDB/loadDB kalıcılık; yedek round-trip; birebir 👥 yok; grupta tüm üyeler + 👥; ders listesi koddan; arayüz duplicate yok; tek localStorage anahtarı; eski süit sayıları düşmüyor).
- `test.mjs`'e tam 1 kez bağlandı (35 süit).

## Doğrulama

- `node --check app.js / ek-ders.js / test.mjs / ks-wa-sablon.mjs / ks-yama-wa-sablon.mjs` → OK.
- `node test.mjs` → **1558/1558 OK**.
- Yama 2. koşu: exit 2 "Zaten uygulanmış", hash'ler sabit.
- Backup: `app.js.wa-sablon-oncesi.bak` — SHA-256 `f6fc16f2d0bc7cce1513bef311e9a2e265dcf38863e9175456d3599fe275be72` (yama öncesi birebir; üzerine YAZILMADI).
- Yeni app.js SHA-256: `93b2207ff521609e328f85d480f2a0336e3318b335075c6965c3e7616572d8fa`.
- `index.html` (`ab938573…`) ve `ek-ders.js` (`3d2dd38f…`) DEĞİŞMEDİ.
- Tarayıcıda görmek için Ctrl+Shift+R (hard refresh).

---

# ✅ CHECKPOINT: WhatsApp Modal — Ortak Mesaj Önizleme Paneli (WA-ONIZLEME-YAMASI)

**Tarih:** 18 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1593/1593 OK** (1558 eski + 35 yeni)

## Tasarım (değiştirilmedi, uygulandı)

Per-öğrenci onizleme kutusu YOK. TEK ortak panel:

- Her öğrenci satırında **"Önizle" (👁)** butonu — `waAc()` satır üretimine Gönder/Kopyala arasına eklendi (`waOnizle(id)` onclick; `s.id` kaynaklı, kendi satırına).
- Panel modal içinde **tek yerde** (`#waIcerik`'in hemen altında, index.html statik markup): `#waOnizlemePanel` + `#waOnizlemeBaslik` (öğrenci adı) + `#waOnizlemeMetin` (`<pre class="whitespace-pre-wrap">`).
- Öğrenci seçilmeden önce placeholder: **"Önizlemek için bir öğrenci seçin"** — `waAc()` her açılışta `waOnizlemeSifirla()` ile sıfırlar (modal kapanıp açılınca ikinci kopya/duplicate OLUŞMAZ; id sabit ve tek).

## Onizleme kuralları (kanıtlandı, ks-wa-onizleme.mjs)

- Mesaj metni `waOnizle()` içinde **yalnızca `ogrenciMesajMetni(ogrenciId)` çağrısıyla** alınır; şablon kodu kopyalanmaz, metin ikinci kez üretilmez → `waGonder()`'in göndereceği string ile **birebir aynı**.
- `textContent` ile basılır, **innerHTML ATAMASI YOK** → emoji (👋/📚/📅), satır sonları ve literal `{ }` karakterleri birebir; HTML enjeksiyonu imkânsız (`<b>` literal görünür, markup yorumlanmaz).
- **DEĞİŞMEDİ:** `waUrl/waAc/waGonder/waSatir/waKopyalaMesaj/geciciKopyala/kopyalaMetin` fonksiyonları, `encodeURIComponent` kullanımı, newline davranışı, grup 👥 satırı ve birebir mesaj kuralları.

## Değişen Dosyalar (baştan yazma YOK; hedefli bölge yaması)

| Dosya | Önce (SHA-256) | Sonra (SHA-256) | Boyut |
|---|---|---|---|
| app.js | `93b2207ff521…` | `6410bb0c58f0…` | 269.643 B (4.190 satır) |
| index.html | `ab9385733962…` | `7ee493bae3d1…` | 22.612 B |
| test.mjs | `f4787b9eda8d…` | `96c7dd0d7387…` | 2.256 B |

app.js: Önizle butonu (L3932), `waAc` sıfırlama (L3939-3940), `waOnizle` + `waOnizlemeSifirla` (L3948-3969). index.html: panel markup (`waIcerik` altında). test.mjs: süit kaydı 1 kez (36 süit).

## Hash freeze testleri yenilendi (assert gevşetilmedi)

index.html hash'i değiştiği için bilinen-iyi referanslar güncellendi (eski hash → `7ee493ba…`):
`ks-donem-ilk.mjs`, `ks-donem-olusturma.mjs`, `ks-ek-ders-donem.mjs`, `ks-ekders-ozet-csv.mjs`, `ks-birebir-gorunum.mjs`, `ks-sinif-ogretmen-uyum.mjs`.

## Yedek (üzerine YAZILMADI)

- `app.js.wa-onizleme-oncesi.bak` — 267.921 B, SHA-256 `93b2207ff521609e328f85d480f2a0336e3318b335075c6965c3e7616572d8fa`
- `index.html.wa-onizleme-oncesi.bak` — 21.783 B, SHA-256 `ab93857339628aec7db0842db217b8e614c0f0ede2de5cb93b9fe500fc2a5cb8`
- `test.mjs.wa-onizleme-oncesi.bak` — 2.234 B, SHA-256 `f4787b9eda8dbf23c8eb99f95d63b7953321e1c74dcbc76d96768c40d95ea7c6`

## Yeni Süit: ks-wa-onizleme.mjs — 35 test

Gerçek DOM semantiği (mini-DOM, textContent/innerHTML ayrımı korunarak): modal DOM'da · panel tam 1 · her satırda Önizle (waOnizle sayısı = waGonder sayısı) · 1. öğrenci → doğru mesaj · 2. öğrenci → AYNI panel, ikinci panel yok · `ogrenciMesajMetni(id)` birebir eşitlik · newline/emoji/literal `{ }` korunumu · textContent (HTML enjeksiyon yok) · `waOnizle` innerHTML ataması yok/şablon kopyalamıyor · `waGonder/waKopyalaMesaj` kaynak + `waUrl` + `encodeURIComponent` + `geciciKopyala` korunumu · tekrar açılışta duplicate yok · tek tanım/id · süit sayısı düşmüyor.

## Doğrulama

- `node --check app.js / ek-ders.js / test.mjs / ks-wa-onizleme.mjs` → OK.
- `node test.mjs` → **1593/1593 OK** (36 süit: baseline 35 aynen + yeni 35).
- Yama 2. koşu: **exit 2 "Zaten uygulanmış"**, dosya hash'leri AYNI kaldı.
- Tarayıcıda görmek için **Ctrl+Shift+R** (hard refresh) — eski app.js önbellekten gelmesin.

---

# ✅ EXCEL-K IMPORT YAMASI — resmi kaynak: program-guncel.xml (kullanıcı seçimi B)

## Kaynak karar süreci (salt-okuma diff → kullanıcı seçimi)

- `ks-excel-k.xml` (A, 72.731 B, SHA-256 `7056a4908748d87386d7060f4dd336c3d087c4b7d113953709b7fb6d5e846299`) ile
  `program-guncel.xml` (B, 72.751 B, SHA-256 `73cf1ba85e8815a38fcd6ed96f2da2de6b4158b996af5760ba81882ca835fbb0`)
  hücre bazında karşılaştırıldı: fark yalnız PERŞEMBE/TAHSİN ASLAN'da 3 hücre (slot 4 ÖĞLE↔K yer değişimi + slot 12 fiziksel eksik) → A'da yerel aktarım hatası, satır kayması yok.
- Kullanıcı **B** seçti; `ks-excel-validate.mjs` resmi kaynağı B'ye çevrildi ve B üzerinde
  **XML SAYIM KAPISI GECTI: K=309 DERS=243 BOS=217 MOLA=70 BELIRSIZ=1** (16 öğretmen, 5 gün; CUMA/PAZAR XML'de yok).

## Yazma (tek oturum, seçim B sonrası)

- `ks-yama-excel-k-import.mjs`: staging deep-copy → tek `saveDB()` → atomik; hata halinde DB/localStorage dokunulmaz.
- Kural uygulaması: K → yalnız `avail.musait["G-K"]="G-K"` (34 gün-bazlı benzersiz; 309 hücre buna katlanır),
  `avail.sinif`'a K YAZILMADI; Excel slot 5 (ÖĞLE ARASI) hiç yazılmadı; Excel 1-4→0-1..0-4, 6-12→0-5..0-11;
  CUMA (4-*) ve PAZAR (6-*) hiçbir kayda dokunulmadı (seed'in 4-1 slot kayıtları korundu); mevcut öğrenci/
  öğretmen/ders/dönem verileri korundu; aktif dönem `donem-2026-2027`; `sinifProg === sinifProgDonemler[sinifProgDonemId]` identity-rebind korundu.
- İsim düzeltmeleri: MEUN SAY-2→MEZUN SAY 2, MEZUNSAY-3→MEZUN SAY 3, SAYCAL→12 SAY CAL; **11 EA DİL** ve
  **12 SAYCAL** mevcut-sınıf-ekle kuralıyla eklendi. Birleşik hücreler bölündü (4 bölünme: FİKRİYE 0-5/0-11,
  NİHAT 1-5/1-11); aynı slotta çoklu sınıf sessizce ezilmedi — ilk sınıf yazıldı, kalanı raporlandı (6 kayıt).
- Sonuç sayıları: **K=309 DERS=243 BOS=0(mevcut-bos dokunulmadı) MOLA=70 BELIRSIZ=0**; duplicate atlanan: 11.
- İşaret: `DB.ayarlar["EXCEL-K-IMPORT-YAMASI"]` + dosya işareti `ks-excel-k-import-uygulandi.flag`
  (SHA-256 `ceb5d97667338d926a035ffd947d46dcf795988fe8c9337ebc6d4449736836a4`).
- DB anlık görüntüsü: `ks-excel-k-import-db.json` (süit doğrulaması için).

## app.js DEĞİŞMEDİ

Bu yama app.js'e dokunmadı ( Salt-okuma diff + seçim + ayrı yama dosyası yeterliydi; ksVerGec/ksVer=2 boot'ta zaten çalışıyor).
`app.js` SHA-256: `6410bb0c58f0502dd231c79ae460c7ba78917e3a4aa6704a00b4f7d1e251f9d8` (WA-ONIZLEME sonrası hash ile AYNI).

## Yeni Süit: ks-excel-k-import.mjs — 23 test (+ test.mjs'e 1 kez bağlandı, 37 süit)

İşaret dosyası · yama 2. koşum no-op (exit 2 "Zaten uygulanmış") · kaynak+SHA eşleşmesi · K=309/DERS=243/BELIRSIZ=0 ·
34 G-K musait kaydı XML dağılımıyla birebir · avail.sinif'ta K yok · mola değeri veri JSON'unda yok ·
PAZAR (6-*) sıfır · seed 4-1 korunumu · FİKRİYE 0-5 = MEZUN SAY 1 (bölünme) · sinifProg'da birleşik metin yok ·
identity-rebind · öğrenci/öğretmen/dönem korunumu.

## Doğrulama

- `node ks-excel-validate.mjs` → XML SAYIM KAPISI GECTI (B kaynağı).
- `node test.mjs` → **1617/1617 OK** (37 süit: baseline 36 aynen + yeni 23).
- Yama 2. koşu: **exit 2 "Zaten uygulanmış"**, dosyaya dokunmuyor.
- Tarayıcıda görmek için **Ctrl+Shift+R** (hard refresh).

---

# ✅ CHECKPOINT: Stale avail.sinif Temizliği — Opsiyon B (46 Kayıt)

**Tarih:** 18 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1617/1617 OK**

## Kapsam (kullanıcı onaylı, preflight raporuna dayalı)

Kaynak: `program-guncel.xml` (SHA `73cf1ba8…`) → doğrulanmış parse `ks-excel-k-veri.json` (K=309, DERS=243) + DB `ks-excel-k-import-db.json` (EXCEL-K-IMPORT-YAMASI sonrası hâl).

- **Silenen:** TAM 46 stale `avail.sinif` kaydı (Excel'de hücre BOŞ; Pzt–Cmt, yalnız Excel slot 1–4 = G-1..G-4 kodları).
- **Kod eşleştirmesi (onaylı):** Excel slot 1–4 → G-1..G-4 · slot 5 = ÖĞLE ARASI (kod yok) · slot 6–12 → G-5..G-11. Bu nedenle **X-5 kayıtları Excel'in 6. slotudur ve GERÇEK DERSTİR** → 23 X-5 kaydına + ilgili sinifProg slotlarına DOKUNULMADI.

## Korunanlar (assert'li)

| Kural | Sonuç |
|---|---|
| X-5 (mola-slotu) değişiklik adayı | 0 — 23 kayıt birebir korundu |
| Cuma (4-*) / Pazar (6-*) | 3 kayıt korundu, aday 0 |
| SELİNA KUTLU (Excel bloğunda yok) | 4 kayıt korundu, aday 0 |
| sinifProg | JSON birebir aynı (yazım öncesi/sonrası stringify eşitliği assert edildi) |
| avail.musait | birebir aynı (34 G-K kaydı) |
| 4 birleşik hücre (FİKRİYE 0-5/0-11, NİHAT 1-5/1-11) | sinifProg çoklu sınıf kayıtları değişmedi |
| Excel'de bulunan ders eksigi (sinifProg, gün 4/6 hariç) | 0 |
| Duplicate "12 SAY CAL" | 0 (sinifIds'te tek; 11 SAYCAL ayrı) |
| Yeni ders / K kaydı | üretilmedi |

## Atomiklik ve Dosyalar

- Staging deep-copy üzerinde değişiklik; tüm savunma assertleri geçmeden yazım yok.
- **Yedek (yeni dosya, üzerine yazma yok):** `ks-stale-temizlik-oncesi.yedek.json` — 37.103 bayt, SHA-256 `5db76c8eb4ec8868c13e0da53038c53d468482ced5140763a7bb551fc6aa67d6`
- **Snapshot:** `ks-stale-temizlik-db.json` (yeni dosya; `ks-excel-k-import-db.json` yedek olarak bırakıldı).
- **Kullanıcı aksiyonu:** `ks-stale-temizlik-db.json` içeriğini uygulamanın **Yedek Yükle** akışıyla (Ayarlar → Yedekten Yükle / `yksOto_arsiv_v1`) yüklemeli; aksi halde tarayıcı localStorage'ı eski hâlde kalır.
- Yama scripti: `ks-yama-stale-temizlik.mjs` (idempotent — 2. koşum exit 2 "Zaten uygulanmış"; flag: `ks-stale-temizlik-uygulandi.flag`, marker: `DB.ayarlar["STALE-TEMIZLIK-YAMASI"]`).
- `app.js`, `ek-ders.js`, `test.mjs`, mevcut test süitleri: **değiştirilmedi** (`node --check` OK).

## Silinen 46 Kayıt

| Öğretmen | Slotlar (sinif) |
|---|---|
| SONER AÇIKGÖZ | 0-1 (MEZUN SAY 1), 1-1 (MEZUN SAY 2) |
| MEHMET ŞAŞAR | 1-1 (MEZUN EA 2), 2-1 (12 SAY 1), 3-1 (12 SAY 2) |
| TAHSİN ASLAN | 2-1 (12 SAY CAL), 3-1 (12 EA 1) |
| MİNE GÜRKAN | 0-1 (12 DİL), 1-1 (11 SAY 1), 2-1 (11 SAY 2), 3-1 (11 SAY 3) |
| MERVE GEREK | 0-1 (11 SAY 3), 1-1 (11 SAYCAL), 3-1 (11 EA 1) |
| SALİM URTİMUR | 0-1 (11 EA 1), 1-1 (10.SINIF), 2-1 (9.SINIF), 3-1 (MEZUN SAY 1) |
| MUSTAFA GÜRKAN | 0-1 (MEZUN SAY 1), 1-1 (MEZUN SAY 2), 2-1 (MEZUN SAY 3), 3-1 (MEZUN EA 1) |
| BELGİN ÇOLAK | 0-1 (12 SAY 2), 1-1 (12 SAY CAL), 3-1 (12 DİL) |
| KARDELEN ASLAN | 0-1 (12 DİL), 1-1 (11 SAY 1), 2-1 (11 SAY 2), 3-1 (11 SAY 3) |
| ŞAHİN DOĞANAY | 0-1 (11 EA 1), 3-1 (9.SINIF) |
| EREN BİLGİLİ | 0-1 (MEZUN SAY 1), 1-1 (MEZUN SAY 2) |
| FATMA KURT | 0-1 (MEZUN EA 1), 1-1 (MEZUN EA 2), 2-1 (12 SAY 1) |
| FİKRİYE KIYAR | 1-1 (12 SAY CAL), 2-1 (12 EA 1), 3-1 (12 DİL) |
| NİHAT KANARIĞ | 0-1 (12 DİL), 2-1 (11 SAY 2), 3-1 (11 SAY 3) |
| MERT ASİL | 0-1 (11 SAY 3), 1-1 (11 SAYCAL), 2-1 (11 SAYISAL FEN), 3-1 (11 EA 1) |

---

# ✅ CHECKPOINT: WhatsApp Öğrenci Mesajı — Yeni Satır Düzeni (WA-DURUM-YAMASI)

**Tarih:** 18 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1652/1652 OK** (1617 eski + 35 yeni)

## Hedef Düzen (ogrenciMesajMetni — tek gerçek kaynak)

```
1) {DERS} ({OGRETMEN}) — {KONU}      ← konu boşsa "— {konu}" bölümü gizlenir
   👥 {Ad1, Ad2}                     ← yalnız grup dersinde (birebirde YOK)
   📅 {tarih} {gün} • {saat}         ← öğretmen adı KALDIRILDI (tekrar etmez)
Bu tarih ve saatte birebir dersiniz olacaktır.   ← durum === "tamamlandi" değilse
Bu tarih ve saatte birebir dersiniz yapıldı.     ← durum === "tamamlandi" ise
```

- Öğretmen adı: `ders.ogretmenAd`; boşsa `DB.ogretmenler` id-esleşmesi (fallback).
- `durum === "iptal"` dersler zaten filtreli (mesajda listede yok).
- Eski `" ✓ Tamamlandı"` işareti kaldırıldı.
- 👥 grup satırı, grup mantığı, iptal filtresi, yer tutucular (baslik/giris/kapanis/imza) korundu.

## Şablon Alanları (DB.ayarlar.whatsappSablon)

- Yeni opsiyonel alanlar: `planliSatir`, `tamamlandiSatir` — boşsa varsayılan cümleler kullanılır.
- Ayarlar ekranındaki 4 alan (baslik/giris/kapanis/imza) ve `waSablonKaydet` (tek `saveDB`) aynen; yeni alanlar da aynı nesnede taşınır.
- Yer tutucular ({ogrenciAdi}…) durum cümlelerinde de çalışır (satirDeger yolu).
- localStorage: yalnızca `yksOto_arsiv_v1` (yeni anahtar YOK).

## Yama

- `ks-yama-wa-durum.mjs` — assert'li, idempotent; 2. koşu "Zaten uygulanmış" (exit 2), dosyaya dokunmaz.
- Yalnız `ogrenciMesajMetni` satır-üretim bloğu değişti (~L3880); dosyanın geri kalanı birebir.
- `waGonder` / `waKopyalaMesaj` / `waOnizle` zaten tek kaynağı çağırıyordu → onizleme=gonderme birebir.

## Değişen Dosyalar ve Yedekler (SHA-256)

| Dosya | Önce | Sonra | Yedek |
|---|---|---|---|
| app.js | `6410bb0c…` | `c22536dc0ba1b0cde92b1491ac8b27b74f44e15e7655d04cbaf8a252c32bce8a` | `app.js.wa-durum-oncesi.bak` (`6410bb0c…`) + çalışma yedeği `app.js.wa-durum-calisma-oncesi.bak` |
| ks-wa-sablon.mjs | `b95256c7…` | referans metin yeni düzene uyarlandı (gevşetme YOK) | `ks-wa-sablon.mjs.wa-durum-oncesi.bak` |
| test.mjs | `a30aa8d3…` | `ks-wa-durum.mjs` TAM 1 KEZ eklendi (38 süit) | `test.mjs.wa-durum-oncesi.bak` |

## Testler

- Yeni süit: `ks-wa-durum.mjs` — **35 test**: parantezli öğretmen, tarih satırında öğretmen YOK,
  grup 👥 / birebirde 👥 YOK, planlı cümle, tamamlandı cümle, karışık pencere (2 planlı + 1 tamamlandı),
  iptal gizleme, önizleme=gonderme (waOnizle/waGonder/waKopyalaMesaj), boş ayar → varsayılan,
  özel ayar metni, konu gizleme, tek localStorage anahtarı, süit kaydı tekliği.
- `ks-wa-sablon.mjs` (47) ve `ks-grup-gorunum.mjs` (28) mesaj beklentileri yeni düzene göre güncellendi (gevşetme yok).
- Doğrulama: `node --check app.js` · `node --check ek-ders.js` → OK · `node test.mjs` → **1652/1652 OK**.

## Örnek Mesaj Çıktısı

**Planlı:**
```
1) MATEMATİK (SONER AÇIKGÖZ) — Türev
   📅 21.09.2026 Pazartesi • 8 · 15:30-16:10
Bu tarih ve saatte birebir dersiniz olacaktır.
```

**Grup + tamamlandı:**
```
2) KİMYA (TAHSİN ASLAN) — Mol Kavramı
   👥 Ayşe Demir, Zeynep Kaya
   📅 21.09.2026 Pazartesi • 5 · 13:00-13:40
Bu tarih ve saatte birebir dersiniz yapıldı.
```

## Kalan Riskler

- Kullanıcı daha önce `whatsappSablon` alanlarını özelleştirdiyse `planliSatir`/`tamamlandiSatir` alanları yoktur → varsayılanlar devrede (istenen davranış).
- Gerçek tarayıcıda eski `app.js` önbellekten gelebilir → sert yenileme (Ctrl+Shift+R / Cmd+Shift+R).
- Grup derslerinde mesaj hâlâ yalnızca ana öğrenciye/katılımcıların satır sahibine göre üretilir (mevcut davranış korundu).

---

# ✅ CHECKPOINT: Kadro CSV v2 — ad/soyad/telefon Üst Düzey Kolonlar (KADRO-KOLON-YAMASI)

**Tarih:** 19 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1702/1702 OK** (38 eski süit + 1 yeni; 1652→1702, düşüş YOK)

## Yeni Header (birebir)

```
schema;dataset;donemId;tip;id;ad;soyad;telefon;brans;sinifId;sinifAd;ekAlanlarJson
```

- **Yalnızca `dataset=kadro` CSV'si `yks-csv-v2`** kullanır. Ders, istek, ek ders ve sınıf programı CSV şemaları **aynen** `yks-csv-v1` kaldı.
- V1 header sabiti (`CSV_BASLIK_KADRO`) ve v1 satır üreticisi (`csvKadroSatirlari`) KORUNDU.

## Telefon Alanı (kaynak koddan tespit)

- DB'deki tek telefon alanı **`ogrenciler[].tel`** (app.js: öğrenci formu `#d-tel` L~1598, kayıt `mevcut.tel = tel` L~1701, WA `o.tel` L~3943). **`veliTel` / `tel2` YOK** → ayrı telefon kolonu eklenmedi.
- Telefon değeri **string olarak korunur**: `+90`, baştaki 0, boşluk, tire **silinmez/biçimlenmez** (`kadroTelOf()` = `String(tel)`).

## v2 Export (app.js)

- `kadroAdSoyadAyir(tamAd)`: son boşlukla ayrılan kelime = soyad, önceki kısım = ad. `"MEHMET ALI YILMAZ"` → ad=`"MEHMET ALI"`, soyad=`"YILMAZ"`. Boş ad → ikisi de boş; tek kelimelik → ad dolu, soyad boş.
- `kadroV2Satirlari()`: KADRO-SIRALAMA emission sırası aynen (öğretmen → sınıf → öğrenci). Sınıf satırlarında ad = sınıf adı; **soyad ve telefon boş**. `ekAlanlarJson` tüm ek alanlarıyla korunur.
- `csvKadroIndir()` artık v2 header + `kadroV2Satirlari()` ile indirir.

## v2 Import

- `csvCozDosya`: `yks-csv-v2` şeması da kabul edilir; **yalnız `dataset=kadro` için** (ders/istek v2 dosyası RED).
- Kişi adı `trim(ad + " " + soyad)` ile yeniden birleşir; **telefon kolonu DB `.tel` alanına yazılır ve `ekAlanlarJson.tel`'i EZER (authoritative)**.
- **v1 import KORUNUR:** eski tam ad kolonu aynen okunur (ayrıştırma yok), telefon `ekAlanlarJson.tel` fallback.

## Korunan Güvenlik Kuralları (değişmeden)

Parse+validate → staging deep-copy → başarida TEK saveDB; hata halinde DB + localStorage byte-birebir kalır (testle kanıtlı). ID/donemId/farklı dönem RED, dosya-içi yinelenen ID RED, eksik ID üretimi, sınıf `kadroSnfId` bağlama, bilinmeyen referans RED, quote-aware parser, BOM, CRLF — tümü aynen. Tek localStorage anahtarı `yksOto_arsiv_v1`.

## Değişen Fonksiyonlar (app.js — baştan yazma YOK, ks-yama-kadro-kolon.mjs exact-anchor yama)

| Fonksiyon/bölge | Değişiklik |
|---|---|
| `CSV_SCHEMA_KADRO` (yeni, `CSV_SCHEMA` yanına) | `"yks-csv-v2"` sabiti |
| `CSV_BASLIK_KADRO_V2`, `kadroAdSoyadAyir`, `kadroTelOf`, `kadroV2Satirlari` (yeni, v1 header sabiti arkasına) | v2 şema katmanı |
| `csvCozDosya` (schema red satırı) | v2 kadro izni |
| `csvImportUygula` dataset guard | v2 yalnız kadro |
| kadro import dalı | v2 bayrağı + `kadroAdBirlesik` + telefon authoritative (öğrenci güncelle/ekle, öğretmen güncelle/ekle) |
| `csvKadroIndir` | v2 export |

Yama idempotent: 2. koşu exit 2 + "Zaten uygulanmış", dosyaya dokunmaz.

## Backup + SHA-256

| Dosya | Boyut | SHA-256 |
|---|---|---|
| `app.js.kadro-kolon-oncesi.bak` (yeni backup; üzerine yazılmadı) | 270.838 B | `c22536dc0ba1b0cde92b1491ac8b27b74f44e15e7655d04cbaf8a252c32bce8a` |
| `app.js` (yama sonrası, 269.019 B) | — | `77122dc4d1e387a8197c55bf8d83786f3a54cbdfa9df1ba7c76c948c6c57d71b` |

Değişmeyen: `index.html`, `ek-ders.js`, `vendor/*`.

## Testler

- Yeni süit: `ks-kadro-kolon.mjs` — **50 test** (v2 header birebir + kolon sırası, ad/soyad ayırma [çok kelimeli/Türkçe/tek kelimelik/boş/fazla boşluk], telefon ayrı kolon + string korunumu + `+90`/sıfır/bosluk/tire, sınıf satırlarında soyad/telefon boşluğu, v2 round-trip [duplicate yok, ad birleşir, tel geri gelir], v1 tam ad + `ekAlanlarJson.tel` fallback, v2 telefon authoritative [JSON'daki tel'i ezer], quote-aware/BOM/CRLF, yinelenen ID + atomiklik [DB+localStorage byte-birebir], farklı dönemId RED, v2 yalnız kadro, `ks-kadro-kolon.mjs` test.mjs'te tam 1 kez).
- `ks-excel-csv.mjs` ve `ks-kadro-siralama.mjs` yeşil (v1 uyumluluk davranışıyla). `ks-ekders-ozet-csv.mjs`'teki 2 byte-hash dondurması (`csvParse`, `csvKadroIndir`) bilinçli davranış değişikliğine uygun davranış-garantisi assert'ine çevrildi — **diğer hiçbir assertion gevşetilmedi**; ders/istek/ek ders ve tüm güvenlik testleri KORUNDU.
- `test.mjs`: süit kaydı tam 1 kez (39 süit).
- Doğrulama: `node --check app.js ek-ders.js test.mjs ks-kadro-kolon.mjs ks-yama-kadro-kolon.mjs` → OK · `node test.mjs` → **1702/1702 OK**.

## Örnek CSV Satırları

```csv
schema;dataset;donemId;tip;id;ad;soyad;telefon;brans;sinifId;sinifAd;ekAlanlarJson
yks-csv-v2;kadro;;ogrenci;ogr-ayse-1;Ayşe;Demir;05551112233;;ks-snf-0006-…;12 SAY 1;{"tel":"05551112233"}
yks-csv-v2;kadro;;ogretmen;ort-cok-1;MEHMET ALI;YILMAZ;;fiz;;;"{}"
yks-csv-v2;kadro;;sinif;ks-snf-0006-…;12 SAY 1;;;;;12 SAY 1;{}
```

## Kalan Riskler

- v2 satır üreticisi yalnız yeni indirmede kullanılır; kullanıcının elinde eski v1 dosyaları varsa **v1 import hâlâ çalışır** (fallback korunuyor).
- `ekAlanlarJson`'daki `tel` alanı v2 export'ta hâlâ taşınır (kayıpsızlık için); v2 import'ta üst düzey kolon kazanır — iki kaynak tutarlı.

---

# ✅ CHECKPOINT: Öğrenci 3 Telefon Alanı + Kadro CSV v3 (TELEFON3-YAMASI)

**Tarih:** 19 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **1771/1771 OK** (1702 eski + 57 yeni süit + 12 güncellenmiş eski test; süit sayısı 40)

## DB Alanları (localStorage: `yksOto_arsiv_v1` — TEK anahtar değişmedi)

- `ogrenciler[].tel` — mevcut değerler **aynen korundu**, normalize YOK (`+90`, baştaki `0`, boşluk, tire aynen).
- `ogrenciler[].anneTel` / `ogrenciler[].babaTel` — YENİ; eksikse `""` olarak eklenir, mevcut değerler ASLA değiştirilmez.
- Migration `normalize()` içinde (tek kapı: boot/loadDB/yedek yükleme) — idempotent, 2. koşuda byte-birebir fark 0.
- Öğretmen ve sınıf kayıtlarına telefon alanı EKLENMEDİ.

## CSV v3 (yalnız dataset=kadro; ders/istek/ek ders/sınıf programı şemaları değişmedi)

Yeni header (TAM OLARAK):

```csv
schema;dataset;donemId;tip;id;ad;soyad;telefon;anneTelefon;babaTelefon;brans;sinifId;sinifAd;ekAlanlarJson
```

Örnek öğrenci satırı:

```csv
yks-csv-v3;kadro;;ogrenci;t3-ornek;Ayşe;Demir;05551112233;0533 444 55 66;+90 555-000-11 22;;ks-snf-0006-…;12 SAY 1;"{""ad"":""Ayşe Demir""}"
```

- Öğrenci: `telefon=tel`, `anneTelefon=anneTel`, `babaTelefon=babaTel` (string, kayıpsız). Öğretmen/sınıf satırlarında 3 telefon kolonu BOŞ.
- `ekAlanlarJson`'dan v3 export'ta `tel, anneTel, babaTel, anneTelefon, babaTelefon` ÇIKARILDI; diğer ek alanlar korundu.
- Import: **v3** = üç telefon kolonu AUTHORITATIVE (boş kolon → bilinçli `""`), `ad+soyad → ad` birleşimi. **v2** = telefon → `tel`; anne/baba **KORUNUR**. **v1** = tam ad + `ekAlanlarJson.tel` fallback aynen.
- BOM, `;`, CRLF, quote-aware parser, UTF-8, atomik RED (yinelenen ID/bilinmeyen referans/yanlış dönem → DB + localStorage byte-birebir korunur) KORUNDU.

## Form UI (ekleme + düzenleme ekranlarında çalışır; duplicate id YOK)

- Düzenleme: `#d-tel` (korundu, "Öğrenci Telefonu") · `#d-anne-tel` ("Anne Telefonu") · `#d-baba-tel` ("Baba Telefonu") — `grid-cols-1 md:grid-cols-3` (mobilde alt alta, genişte 3 kolon).
- Yeni kayıt: `#o-tel` (korundu) · `#o-anne-tel` · `#o-baba-tel` — aynı grid düzeni.
- Tümü `type="tel" inputmode="tel"`; `ogrenciEkle()`/`ogrenciGuncelle()` akışı 3 alanı okur-yazar; kayıt sonrası temizlenir.

## WhatsApp (değişmedi)

`waGonder`, `waUrl`, `waSatir`, `waKopyalaMesaj`, `waOnizle` **yalnız `ogrenciler[].tel`** kullanmaya devam eder; `anneTel`/`babaTel` WhatsApp hedefi YAPILMADI. Mesaj metni/onizleme ve boş tel'de `wa.me/?text=` davranışı aynen.

## Yama ve Dosyalar (boyut BAYT — statSync; SHA-256)

| Dosya | Boyut (bayt) | SHA-256 |
|---|---|---|
| app.js (önce) | 274.005 | `77122dc4d1e387a8197c55bf8d83786f3a54cbdfa9df1ba7c76c948c6c57d71b` |
| app.js (sonra) | 280.816 | `3874ce7258f63bfd169e7f62c6bf441ac59497d36396b5e6d690f2c3e2944a16` |
| app.js.telefon3-oncesi.bak (yedek, üzerine yazılmadı) | 274.005 | `77122dc4…` (app.js-önce ile birebir) |
| ek-ders.js (değişmedi) | 30.405 | `3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f` |
| index.html (değişmedi) | 22.612 | `7ee493bae3d1396cafd2e102dce2a10c6f70b6170a17ab35d699d3870e04c2d5` |
| test.mjs | 2.347 | `042b07f2b335a7cb462ac918063e1e075266789ad8bdde05dd24d56b05c6c72f` |

- Yama: `ks-yama-telefon3.mjs` — assert'li, exact-anchor, idempotent: **1. koşu uyguladı; 2. koşu "Zaten uygulanmış" → exit 2, dosyaya dokunmaz (SHA birebir aynı kanıtlandı).**
- app.js'te 15 hedefli bölge (normalize migration, v3 sabitleri, kadroV3Satirlari, csvKadroIndir, csvCozDosya/csvImportUygula v3 dalları, iki form + ekle/güncelle). Baştan yazma YOK; `waGonder/waUrl/waSatir/waKopyalaMesaj/waOnizle/csvDosya/csvParse` birebir korundu (assert'li).
- Mevcut tüm backup dosyaları (`app.js.*.bak` vb.) DEĞİŞTİRİLMEDİ.

## Testler

- Yeni: `ks-kadro-telefon3.mjs` — **57 test**: 3 alanın formdan kaydı, mevcut tel korunumu, anne/baba migration, Türkçe ad (`Öğrenci İğdeçiçek`), numara biçimi kayıpsızlığı (`+90 555 666 77 88` / `0533-222-33-44`), v3 header+kolon sırası, anne/baba ayrı kolon, v3 round-trip, v1 import, v2 import, v1/v2'de anne-baba korunumu (boşaltılmaz), v3 boş kolon temizliği, atomik RED + localStorage byte korunumu, WhatsApp yalnız öğrenci tel'i (`waGonder` kaynağı `o.tel` assert + anne/baba yok), duplicate-id yok, tek localStorage anahtarı, süit kaydı 1 kez.
- `ks-kadro-kolon.mjs` v3 beklentilerine güncellendi (v1/v2 import testleri KORUNDU; v2 üretici koruma testi eklendi). `ks-excel-csv.mjs` ve `ks-kadro-siralama.mjs`'teki ekAlanlarJson tel beklentileri bilinçli v3 davranışına göre güncellendi; ders/istek/ek-ders testlerine DOKUNULMADI. `ks-donem-ilk.mjs`'te ogrenciler deep-equal'ına `tel/anneTel/babaTel` skip-listesi eklendi (migration alanları bilinçli).
- `test.mjs`: süit kaydı tam 1 kez (40 süit). Doğrulama: `node --check app.js ek-ders.js test.mjs ks-kadro-telefon3.mjs` → OK · `node test.mjs` → **1771/1771 OK** (düşüş YOK, duplicate kayıt YOK).

## Kalan Riskler

- Kullanıcının elinde eski v2 CSV'ler varsa: import çalışır (anne/baba korunur) ama export artık v3 üretir — eski v2 okuyan dış araçlar varsa header farkı bilinmeli.
- v3 import boş telefon kolonlarını bilinçli `""` yapar (authoritative); "boş kolon = dokunma" bekleniyorsa v2 kullanılmalı.
- `ks-excel-csv.mjs`/`ks-kadro-siralama.mjs`/`ks-donem-ilk.mjs` assertion güncellemeleri yalnızca TELEFON3 kapsamındaki alanlarla ilgili; başka gevşetme yok.

## WA-ALICI-YAMASI (2026-09-19): WhatsApp modalına modal-genel alıcı seçici (Öğrenci / Anne / Baba)

**Uygulama:** `node ks-yama-wa-alici.mjs` (assert'li, idempotent; 2. koşu exit 2 "Zaten uygulanmış").
Yamalanan dosyalar: `app.js` (WA-ALICI-YAMASI blokları), `test.mjs` (ks-wa-alici.mjs süiti TAM BİR KEZ bağlandı).
Backup: `app.js.wa-alici-oncesi.bak` — 280816 bayt, SHA-256 `3874ce7258f63bfd169e7f62c6bf441ac59497d36396b5e6d690f2c3e2944a16` (statSync byte ölçümü).

**Davranış:**
- `#waAlici` select modal genelinde TEK (waAc innerHTML yazımı her açılışta eskiyi temizlediğinden duplicate imkânsız; app.js'te `id="waAlici"` tam 1 kez, index.html'de YOK).
- Bellek içi state: `waAktifOgrenciId`, `waAliciTipi`. Yeni localStorage key YOK; tek key `yksOto_arsiv_v1` aynen. `waKapat()` state'i sıfırlar; `waAc()` her açılışta alıcı = "ogrenci".
- Tek çözücü `waAliciBilgisi(ogrenciId, aliciTipi)` → `{ ogrenci, tip, etiket, telefon, varMi }`; ogrenci→`o.tel`, anne→`o.anneTel`, baba→`o.babaTel`. Telefon trim/normalize YOK (kayıtlı string aynen).
- Eksik telefonda: gönderim ENGELLENİR (`waGonder` toast + return; `window.open` çağrılmaz), öğrenci telefonuna fallback YOK. Uyarı metni: "Anne telefonu kayitli degil" / "Baba telefonu kayitli degil".
- `waUrl(metin, tel)` ve `encodeURIComponent` davranışı değişmedi. Önizleme metni = gönderilecek metin (birebir, tek kaynak `ogrenciMesajMetni`); alıcı etiketi/telefonu mesaja eklenmez, yalnız `#waAliciBilgi` üst bilgisinde.
- `waSatir` + Öğrenciler sekmesi ikonu ogrenci-tel yolu (`waGonder`) aynen; `waKopyalaMesaj` yalnız metin kopyalar. planli/tamamlandi cümleleri, parantezli öğretmen, grup 👥, iptal filtresi değişmedi.

**Test:** `ks-wa-alici.mjs` (47 test) — alici tekliği, varsayılan, eşleşme (ogrenci/anne/baba), boş telefon engeli, no-open/no-fallback, doğru numara, encodeURIComponent, önizleme birebirliği, seçim korunumu (öğrenci değişse) + yeni açılış ogrenci, hızlı butonlar, kopyala, localStorage key değişmedi, anneTel/babaTel değişmedi, duplicate yok.
Contract güncellemeleri (yalnızca bilinçli davranış; gevşetme yok): `ks-wa-onizleme.mjs` (waGonder kaynak regex → `waUrl(metin, a.telefon)`), `ks-wa-durum.mjs` (boş tel'de engel doğrulaması + URL testi için tel doldurma), `ks-kadro-telefon3.mjs` (waGonder kaynak assert → çözücü).
Toplam: **1820/1820 test OK** (`node test.mjs`).

**Kalan Riskler:**
- Eski davranışta boş öğrenci telefonu wa.me'ye telefondan açılıyordu; artık engellenir — kullanıcıya "telefonu kaydedin" uyarısı gösterilir.
- Alıcı seçimi sayfa yenilenince sıfırlanır (tasarım gereği: yalnız bellek içi).

## DERS-TASI-YAMASI (2026-09-19): Haftalık tabloda birebir ders kartını sürükle-bırakla taşıma

**Uygulama:** `node ks-yama-ders-tasi.mjs` (assert'li, fail-closed, idempotent — 2. koşuda app.js'e DOKUNULMAZ).
Yamalanan dosyalar: `app.js` (DERS-TASI-YAMASI blokları), `test.mjs` (`ks-ders-tasi.mjs` süiti TAM BİR KEZ bağlandı).
Backup: `app.js.ders-tasi-oncesi.bak` — 284584 bayt, SHA-256 `0aa32d82c28a9c1355d98a7176a22e69f86c41a3a34fc8767943aaa14779b6cc` (statSync byte ölçümü; mevcut backup'ların üzerine YAZILMADI).

**Not — neden script:** `app.js` 4.390 satır / 284 KB'dır; Freebuff dosya aracı bu dosyanın yalnız ilk ~600 satırını eşleştirebiliyor (derin bölgelerdeki düzenlemeler "not found" ile düşüyor). Aynı sınır `CHECKPOINT.md` (1.847 satır) için de geçerli. Yama bu yüzden repo'nun kendi `ks-yama-*.mjs` konvansiyonuyla uygulanır; her hedef dizge tam 1 kez geçmezse HİÇBİR ŞEY yazılmaz.

**Davranış (MEVCUT altyapı yeniden kullanıldı — paralel DnD sistemi YOK):**
- Kaynak: haftalık öğretmen tablosu hücresi YALNIZ aktif (iptal değil) TEK ÖĞRENCİLİ birebir derste `draggable="true"` + `ondragstart="dersDrag(event, '<dersId>')"`.
- Hedef: MEVCUT boş `+` drop-zone'ları (`class="dnd-bos ..."`, `data-drop-ogrt/gun/saat`, `ondragover="istekDragOver(...)"`, `ondragleave="istekDragLeave(...)"`, `ondrop="istekBurak(...)"`). Drop-zone markup'ı ve mevcut istek-kartı akışı DEĞİŞMEDİ.
- Yeni global `dersDropHedef` (istek kartının `istekDropHedef`'i aynen korundu). `istekDragOver` iki kaynağı da kabul eder (ders → `dropEffect = "move"`, istek → `"copy"`); tek inline `ondrop` yolu `istekBurak` içinde `dersDropHedef` doluysa `dersBurak`'a devreder.
- Tarih/saat hesabı MEVCUT yardımcılarla: `dowIdx`, `ksKodOf`, `addDaysKey`. Manuel index varsayımı yok. Taşıma YALNIZ aynı gösterilen hafta içinde (kaynak haftası = hedef haftası).
- RED: grup dersi, iptal ders, dolu slot (aynı öğretmen), amber Ek Ders, gri Kapalı (`avail.musait`), rose Sınıf Dersi (`avail.sinif`), Pazar, kısa kodda karşılığı olmayan saat (12:00 ÖĞLE ARASI/mola dahil), hafta dışı; ayrıca MEVCUT `duzeltmeBul` (kaynak ders `staged.id` ile hariç tutulur) → öğretmen çakışması, öğrenci çakışması + toplu ders (sınıf programı), aktif dönem ek dersi.
- RED sonucu: toast + YAZMA YOK. Karar staging kopyası (`JSON.parse(JSON.stringify(l))`) üzerinde verilir; kontroller düşerse DB'ye tek alan bile yazılmaz ve `saveDB()` HİÇ çağrılmaz (localStorage byte-birebir korunur).
- Başarı: yalnız ilgili dersin `tarih/saat/kod` alanları güncellenir → TEK `saveDB()` → `renderDersler/renderOzet/renderAnaliz`. `id/ogrenciId/ogrenciAd/ogretmenId/ogretmenAd/dersId/konu/durum/donemId` DEĞİŞMEZ; kopya kayıt üretilmez.
- Kaynak = hedef → no-op (sessiz: ne toast ne yazma). Takas (swap) ve geri alma (undo) EKLENMEDİ.
- Gün sekmesi ve Hafta görünümü AYNI DB kaydını okur; taşıma sonrası ikisi de tutarlıdır. Günlük tablo hücreleri draggable DEĞİL (mevcut görünüm korundu).

**Test:** `ks-ders-tasi.mjs` (91/91 assert; test.mjs runner sayımı 92 test ✓) — kaynak sözleşmesi (paralel sistem yok, tek drop yolu), draggable kaynak kuralı (birebir ✓; grup / iptal / rose / amber / Kapalı / günlük tablo ✗), drop-zone + istek kartı markup'ının birebir korunumu, başarı (aynı gün 6→8 ve Pzt→Çar gün değişimi) + TEK saveDB, no-op, dokuz RED senaryosu (her birinde localStorage byte-birebir + saveDB 0 çağrı + toast), gün sekmesi ↔ Hafta uyumu, havuz isteği akışının runtime korunumu.
Doğrulama: `node --check app.js ks-ders-tasi.mjs ks-yama-ders-tasi.mjs` → OK · `node test.mjs` → **1912/1912 OK** (önce 1820/1820, 41 süit → 42 süit; eski süitelerde DÜŞÜŞ YOK).

**Kalan Riskler:**
- Sürüklenen hücre `dnd-kilit` class'ını KORUR (`index.html` hash'i testlerle dondurulmuş) → yalnız `style="cursor:grab"` eklenir; `.dnd-kilit:hover` kırmızı zemini durur (hücre havuz isteği bırakma açısından hâlâ kilitli).
- Haftalar arası taşıma bilinçli olarak YOK (yalnız görüntülenen hafta).
- Pazar hücreleri boş `+` görünse de mevcut istek-kartı kuralıyla aynı şekilde RED edilir.

---

## GUNLUK-DERS-TASI-YAMASI (2026-09-19): Günlük tabloda birebir ders kartını AYNI SATIRDA başka boş saate taşıma

**Uygulama:** `node ks-yama-gunluk-ders-tasi.mjs` (assert'li, exact-anchor, fail-closed, İDEMPOTENT).
Yamalanan dosyalar: `app.js` (GUNLUK-DERS-TASI-YAMASI blokları) · `test.mjs` (`ks-gunluk-ders-tasi.mjs` TAM 1 KEZ) ·
`ks-ders-tasi.mjs` (günlük tablo artık draggable olduğu için 2 STALE assert güncellendi; assertion sayısı SABİT: 60).
`node ks-cp-gunluk-ders-tasi.mjs` bu bölümü ekler (idempotent).

**Yedek (statSync byte + SHA-256):** `app.js.gunluk-ders-tasi-oncesi.bak` · 290213 bayt · SHA-256 `2f36752acf15622c29dd507b0ed56775bdca71b6e0591688481687829aafcff6`
— mevcut backup'ların ÜZERİNE YAZILMADI; yedek yoksa oluşturulur, varsa dokunulmaz.
**app.js:** yama öncesi 290.213 B / 4.457 satır · SHA-256 `2f36752acf15622c29dd507b0ed56775bdca71b6e0591688481687829aafcff6`
→ yama sonrası 292581 B / 4478 satır · SHA-256 `3e85797f4ab30ec55d3283ee385e0b8ce848e1cf9b92e66ff32ef2943aa11ea7` (+2.368 B).

**AÇIK KARAR (v1):** YALNIZ AYNI ÖĞRETMEN SATIRINDA saat değişikliği. Başka satıra bırakma RED — öğretmen
otomatik değişmez. Gün değişikliği bu tabloda YOK; seçili gün sabit kalır. Dersin öğretmen/tarih alanları
DEĞİŞMEZ; yalnız `saat/kod` değişir.

**Yapılan İş (app.js — baştan yazma YOK; `gunlukTablo()` içine 5 hedefli yama):**
1. **Satır öğretmen kimliği:** yeni `ogrtIdMap` (ad → `ogretmenId`), iki döngüde (dersler + ek dersler) doldurulur;
   eksikse ad üzerinden TEK eşleme ile tamamlanır, çözülemezse `""` kalır ve o satırda drop-zone ÇİZİLMEZ (ölü hedef yok).
2. **Kaynak:** `gunlukTablo()` birebir hücresi YALNIZ AKTİF (`durum !== "iptal"`) TEK ÖĞRENCİLİ (`dersOgrenciIds(ders).length === 1`)
   derste `draggable="true" style="cursor:grab"` + `ondragstart="dersDrag(event, '<dersId>')"` + `ondragend="dersDropHedef=null; ..."`.
   Grup / iptal / Sınıf Dersi (rose) / Ek Ders (amber) / Kapalı (gri) kartlar draggable DEĞİL.
3. **Hedef:** günlük boş hücre MEVCUT drop-zone yoluna bağlandı — aynı `class="dnd-bos ..."`, `data-drop-ogrt/gun/saat`,
   `ondragover="istekDragOver(event, this)"`, `ondragleave="istekDragLeave(this)"`, `ondrop="istekBurak(event, this, ...)"`.
   Mola hücresi (`slot.mola` dalı) bu yola HİÇ girmez → mola KESİNLİKLE drop edilemez. Saat MEVCUT `SAAT_SLOTLARI`/`KISA_KOD`
   (`slot.b`), gün MEVCUT `dowIdx(gunKey)` ile bulunur; index/sabit kolon varsayımı YOK. Hedef gün SABİT (`gunKey`).
4. **ÜÇÜNCÜ paralel sistem YOK:** yeni drag/drop fonksiyonu, yeni dragover, yeni global EKLENMEDİ. Haftalık dilimde kurulan
   `dersDrag` / `dersBurak` / `dersDropHedef` + tek `istekDragOver/istekDragLeave/istekBurak → dersBurak` devri AYNEN yeniden kullanıldı
   (`ondrop="istekBurak(event, this,` toplam 2 yol: haftalık + günlük). Mevcut istek-kartı akışı DEĞİŞMEDİ.
5. **Doğrulama/atomiklik (mevcut `dersBurak`):** kaynak ders `staged.id` ile hariç tutularak MEVCUT `duzeltmeBul` yeniden kullanılır;
   ayrıca dolu slot, Ek Ders, Kapalı (`avail.musait`), Sınıf Dersi (`avail.sinif`), Pazar ve kısa kodda karşılığı olmayan saat (12:00 mola dahil) RED.
   Karar staging kopyası (`JSON.parse(JSON.stringify(l))`) üzerinde verilir: RED'de DB'ye tek alan yazılmaz, `saveDB()` HİÇ çağrılmaz →
   localStorage byte-birebir korunur. Başarıda yalnız `tarih/saat/kod` güncellenir → TEK `saveDB()` → render.

**RED senaryoları (hepsinde toast + sıfır DB yazımı + localStorage byte-birebir):** cross-row (başka öğretmen satırı),
Mola (12:00), dolu hedef, Kapalı (`avail.musait`), Sınıf Dersi (`avail.sinif`), Ek Ders (amber) hedefi, öğretmen çakışması,
öğrenci çakışması (başka öğretmenle aynı slot), toplu ders (sınıf programı), grup ders kaynağı. Kaynak = hedef → no-op (sessiz).

**Görünüm tutarlılığı:** Günlük tablo, gün sekmesi ve haftalık tablo AYNI DB kaydını okur; taşıma sonrası üçünde de aynı konum görünür.

**Test:** `ks-gunluk-ders-tasi.mjs` — **115/115** (test.mjs sayımı 115; süit kendi satırında 116 assert raporlar).
Doğrulama: `node --check app.js` OK · `node test.mjs` → **2028/2028 OK** (43 süit).
**SUITE BAZINDA (test.mjs koşusu):** harness 34 · test-render 14 · durum-fn 20 · grup-uyum 41 · panel-secim 32 · grup-gorunum 28 ·
istekten-grup 32 · grup-istegi 68 · benzersiz-id 46 · gercek-kadro 80 · donem-ilk 47 · donem-damga 50 · donem-secici 77 · excel-csv 85 ·
donem-olusturma 87 · donem-secici-gorunum 44 · donem-secici-dom 22 · sinifprog-csv 57 · sablon-kopya 72 · render-sahipligi 30 ·
d1-render-refactor 44 · kadro-siralama 27 · kapali-gorunum 19 · ek-ders-donem 59 · ekders-gorunum 50 · ekders-ozet-csv 46 ·
birebir-gorunum 34 · sinif-ogretmen-uyum 35 · sinif-prog-uyum-onar 36 · sinif-prog-etiket 21 · kart-sirasi 33 · kart-kolon 51 ·
brans-ders-kurali 54 · excel-ui-kontrol 34 · wa-sablon 47 · wa-onizleme 36 · wa-durum 36 · wa-alici 47 · excel-k-import 24 ·
kadro-kolon 62 · kadro-telefon3 57 · **ders-tasi 91** · **gunluk-ders-tasi 115 (YENİ)**.
Baseline 1912/1912 (42 süit) → 2028/2028 (43 süit): **eski süitelerde DÜŞÜŞ SIFIR** (`ks-ders-tasi.mjs` 91/91 sabit).

**İdempotans:** `ks-yama-gunluk-ders-tasi.mjs` 2. koşuda app.js'e DOKUNMAZ, test.mjs kaydını ve `ks-ders-tasi.mjs`
düzeltmesini tekrar uygulamaz (exit 0, hash birebir aynı). Yedek oluşturma yalnız dosya YOKKEN çalışır.

**Kalan Riskler / notlar:**
- Günlük tablo GÖRÜNÜM değişikliği: boş hücreler artık `dnd-bos` (görünür `+` ipucu) — haftalık drop-zone'larla tutarlı.
  `index.html` (`.dnd-bos`/`.dnd-uygun` CSS) DEĞİŞMEDİ; hash `7ee493bae3d1396cafd2e102dce2a10c6f70b6170a17ab35d699d3870e04c2d5`.
- `ks-ders-tasi.mjs`'teki eski kapsam kararı ("günlük tablo draggable DEĞİL") bu TEK İŞ'in AÇIK KARARIYLA geçersiz kaldı;
  2 assert güncellendi (kapsam yeni karara göre; assertion sayısı artmadı/azalmadı).
- Günlük ve haftalık tablo aynı `istekBurak` yolunu paylaştığı için havuz istek kartı artık günlük boş hücreye de bırakılabilir
  (mevcut kurallarla; istek akışı bozulmadı, süitte doğrulandı).
- Haftalar arası / günler arası taşıma bu tabloda bilinçli olarak YOK (v1).
- Tarayıcıda ilk açılışta eski `app.js` önbellekten gelebilir → **sert yenileme: Ctrl+Shift+R (Cmd+Shift+R)**.


---

# ✅ CHECKPOINT: Ders Kartı PNG — WhatsApp Görsel Paylaşımı (DERS-KARTI-YAMASI)

**Tarih:** 20 Eylül 2026 · **Durum:** ✅ Tamamlandı, test runner → **2073/2073 OK** (2028 eski + 45 yeni)

## Gerçek Fiyat-Maliyet (SINIRLAR — bunlara uymayan iddia YASAK)
- wa.me görsel GÖNDEREMEZ; yalnız metin hazırlar (mevcut waUrl/waGonder akışı AYNEN korundu).
- navigator.share({files}) yalnız destekleyen platformlarda (mobil ağırlıklı).
- Panoya kopyalama (ClipboardItem) destek garantisi vermez; desteklenmezse sessizce indir-yoluna düşer.
- En güvenilir masaüstü yolu: PNG indir → kullanıcı WhatsApp'ta dosyayı sürükler.
- Kullanılan ifade: "Kart hazır: indirildi… WhatsApp'ta dosyayı sürükleyin" — 'tek tıkla otomatik gönderim' İFADESİ KULLANILMADI.

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-ders-karti.mjs exact-anchor idempotent yama)
- **Yeni fonksiyonlar (pngAc öncesi TEK BLOK):** dersKartiUygun(d) (yalnız aktif TEK öğrencili birebir: grup/iptal RED),
  dersKartiEtiket(d), dersKartiBtnHTML(d) (ortak buton üretici — iki tabloda da aynı), dersKartiVeri(d),
  dersKartiHTML(d) (kart: ad, ders, konu, öğretmen, tarih+gün, saat, sınıf, durum rozeti; telefon İÇERMEZ),
  dersKartiAc(dersId) — sıra: 1) alıcı telefonu yoksa PAYLAŞIM DENENMEZ (mevcut 'telefon kayitli degil' uyarısı),
  2) html2canvas → PNG blob, 3) canShare({files}) true → navigator.share, 4) ClipboardItem varsa panoya kopyala,
  5) HER DURUMDA PNG indir (ders-karti-<ogrenci>-<tarih>.png; dosya adında TELEFON YOK).
- **Butonlar:** haftalikOgrtTablo + gunlukTablo birebir hücrelerine dersKartiUygun(ders) ? buton : '' — TEK ortak fonksiyon.
  Grup / iptal / Sınıf Dersi (rose) / Ek Ders (amber) / Kapalı (gri) hücrelerinde buton ÇIKMAZ.
- **Metin kaynağı:** kart verisi mevcut mantıktan türetilir (dersOgrenciIds/DERS/fmtTR/saatEtiket/esc) — ikinci metin kaynağı YOK.
- **Alıcı:** mevcut waAliciBilgisi/waAliciTipi seçicisi YENİDEN KULLANILIR (Öğrenci/Anne/Baba korunur); kart yalnız o öğrencinin bilgisini taşır.
- **Veri:** bu özellik VERİ DEĞİŞTİRMEZ — saveDB/localStorage yazımı YOK (süitte byte-birebir kanıtlandı).

## Testler
- Yeni süit: ks-ders-karti.mjs — **45 test** (kart üretimi, durum metni planlandi/yapildi, alıcı ogrenci/anne/baba,
  kartta telefon + başka öğrenci adı YOK, telefon yoksa engel, canShare dalı, clipboard fallback, PNG indirme,
  dosya adı formatı + telefonsuz, grup/iptal/Sınıf/Ek Ders/Kapalı'da buton çıkmaması, test.mjs 1 kez kayıt,
  localStorage byte-birebir). test.mjs'e **tam 1 kez** eklendi.
- Doğrulama: node --check app.js OK · node test.mjs → **2073/2073 OK**, eski süitlerde düşüş SIFIR.

## Yedek ve İdempotans
- Backup: app.js.ders-karti-oncesi.bak — **292.581 bayt**, SHA-256 3e85797f4ab30ec55d3283ee385e0b8ce848e1cf9b92e66ff32ef2943aa11ea7
- app.js: 292.581 → **300.212 bayt**, 3e85797f… → 7b535a968a904e5050eafef16aff5a02e153c86a3a2fa0d05161870f0a8fdf89
- Yama 2. koşu: "Zaten uygulanmış" (exit 2), dosya değişmez. Üzerine yazılmış backup YOK.
- Değişmeyen: index.html, ek-ders.js, vendor/*, tüm eski yedekler.

## Kalan Riskler / Not
- Tarayıcıda gerçek platform testi **DENENMEDİ** (Node süiti yalnız mantık/dal doğrulaması yapar):
  hangi platformda canShare/pano/indirme hangisinin çalıştığı gerçek cihazda doğrulanmalı.
- Gerçek tarayıcıda eski app.js önbellekten gelebilir → sert yenileme (Ctrl+Shift+R / Cmd+Shift+R).

## Düzeltme turu (soru-cevap denetimi, 2026-09-20)
- Süit 7. bölüm hatası: canShare-fallback testi, 6. bölümün tek-indirme bayrağı yüzünden düşüyordu (app.js hatası DEĞİL). Teste dersKartiIndirildiSifirla() eklendi; düşüş giderildi.
- Korumalı alan zinciri test edildi: file:// → share/pano denenmez, PNG iner; localhost/https → share reject ve pano izin reddi senaryolarında PNG tek kez iner (tekrar indirme yok).
- Soru-5 gizlilik testi zaten V2 içinde: kartta grup üyesi adı/telefonlar YOK, yalnız kendi adı; dosya adında telefon YOK.
- test.mjs: 2080/2080 OK (44 süit). app.js değişmedi: cbc97e7d… (302.129 B). ks-ders-karti.mjs: 8a5b1c05… (19.892 B).
- Tarayıcı gerçek cihaz testi: hâlâ DENENMEDİ; Ctrl+Shift+R sert yenileme notu geçerli.

## Sayım düzeltme turu 2 (2026-09-20)
- ks-ders-karti.mjs: ÖLÜ TEST giderildi — satır 283-285teki eski erken exit(0), 11-14 bölümlerinin 20ms timeout zinciri çalışmadan süreci öldürüyordu; 15 test sessizce hiç koşmuyordu (runner 52 gösteriyordu). Erken exit kaldırıldı.
- 11. bölüme eksik dersKartiIndirildiSifirla() eklendi (file:// dl=0 düzeltildi).
- 12. bölümde share/pano stubları sayaçsızdı → sayaçlı stublara çevrildi.
- 13. bölüm replika translit zincirine ç/Ç eklendi (app.js birebir).
- Sonuç: süitte 67 t( satırı, 65i normal yolda koşar (2si sadece catch dallarında); runner: 65 ✓ 0 ✗. test.mjs TOPLAM: 2093/2093 OK (44 süit).
- app.js DEĞİŞMEDİ: SHA-256 cbc97e7d3d1ad7f0bc0be919aa8898cfe16954d6341d8b35cd9a09136f3c2950, 302129 B.
- ks-ders-karti.mjs: SHA-256 7e5de302e1d31052522b1b493fd87d7660b07bb479f0522c0f2072038655115b, 20322 B.
- Touch (madde 5): HTML5 drag API dokunmatikte tetiklenmez (iOS Safari hiç, Android Chrome en azından uzun vadede kısıtlı); app.jste pointer/touch taşıma handleri YOK, touch-action ile mobil sürükleme kasıtlı kapalı. PNG butonu tap ile çalışır (draggable=false + stopPropagation).

## Ölü/koşullu test denetimi (tüm süitler, 2026-09-20)
- 44 süitte erken process.exit taraması: tüm erken exitler ya boot-catch (fail yolu) ya dosya sonu; ks-ders-karti dışında ÖLÜ TEST üreten erken exit YOK.
- Süit bazlı runner✓ vs kaynak t( karşılaştırması: negatif farklar (runner>kaynak) döngü/dinamik t( üretiminden; pozitif farklar catch-only/dallı t(.
- ks-ders-karti catch-only 2 test koşulsuz assertle çevrildi (akisHata===null; boot catch açıkça kırmızı). Süit artık TEK SAYI: 66 ✓, 0 ✗. "65 koşan + 2 koşullu" ifadesi kaldırıldı.
- test.mjs TOPLAM: 2094/2094 OK. ks-ders-karti.mjs SHA-256 ve byte aşağıda; app.js DEĞİŞMEDİ (cbc97e7d…, 302129 B).

## DERS-KARTI-TASIMA-YAMASI (2026-09-20)
- İstek: "Ders Kartı PNG" butonu haftalikOgrtTablo + gunlukTablo hücrelerinden TAMAMEN kaldırıldı; ders listesi satırının İŞLEM alanına (waSatir/WhatsApp ikonunun yanına, satır başına) taşındı.
- app.js — 3 hedefli değişiklik (app.js baştan yazılmadı, exact-anchor tek nokta yamalar):
  1) haftalikOgrtTablo birebir hücresi: `(dersKartiUygun(ders) ? '<div class="mt-0.5">' + dersKartiBtnHTML(ders) + '</div>' : '')` çağrısı/markup'ı SİLİNDİ → hücre birebirHucreHTML çıktısıyla buton-öncesi haline döndü (ad + konu + sınıf).
  2) gunlukTablo birebir hücresi: `if (dersKartiUygun(ders)) html += '<div class="mt-0.5">' + dersKartiBtnHTML(ders) + '</div>';` satırı SİLİNDİ.
  3) renderDersler İŞLEM hücresi: WhatsApp butonunun hemen ardına koşullu kart butonu eklendi — `(dersKartiUygun(l) ? '<button title="Ders Kartı görseli (PNG) üret" draggable="false" onmousedown="event.stopPropagation()" onclick="event.preventDefault();dersKartiAc(\'' + l.id + '\')" …fa-image…</button>' : '')`. KOD KOPYALAMA YOK: dersKartiBtnHTML yardımcısının gövdesi birebir korundu; buton yalnız liste satırında çağrılıyor.
- KORUMA (süitle kanıtlandı): dersDrag/dersBurak/dersDropHedef TEK tanım; boş "+" drop-zone (istekBurak) haftalik+gunluk birebir; grup/iptal/Sınıf Dersi (rose)/Ek Ders (amber)/Kapalı (gri) satır ve hücrelerde buton YOK; WhatsApp ikonu + düzenle/sil butonları aynen; saveDB/localStorage yolu değişmedi (dersKartiAc gövdesinde setItem/saveDB yok).
- Yeni süit: ks-ders-karti-tasima.mjs (49 assert): (a) haftalik+gunluk hücrelerinde fa-image/dersKartiAc YOK, (b) İŞLEM satırında dersKartiAc VAR (waSatir'den sonra, düzenle'den önce; dersKartiUygun(l) guard'lı), (c) dersKartiVeri/dersKartiHTML + waAliciBilgisi alıcı akışı + html2canvas PNG yolu + saveDB yazmama, (d) draggable kaynaklar + drop-zone + no-op dersBurak, (e) istisna hücreler butonsuz, (f) idempotans (işaret TEK, İŞLEM üretimi TEK nokta).
- ks-ders-karti.mjs: 2 stale assert (hücre-içi konum varsayımı) DERS-KARTI-TASIMA-YAMASI'na göre güncellendi — test davranışı değişmedi, konum sözleşmesi güncellendi.
- Backup (üzerine yazma YOK, YENİ dosya): app.js.ders-karti-tasima-oncesi.bak — 302129 B, SHA-256 cbc97e7d3d1ad7f0bc0be919aa8898cfe16954d6341d8b35cd9a09136f3c2950.
- Baseline (yama ÖNCESİ): 2094/2094 OK, 0 kırmızı (44 süit). Yama SONRASI (test.mjs: 45 süit): 2143/2143 OK — düşüş SIFIR. Yeni süit: ks-ders-karti-tasima.mjs 49 ✓.
- Dosya hash/byte: app.js 302581 B / b787f93f55ceea4fad7744f6b45509b48601b619e1aa454a50d51f505500c288; ks-ders-karti-tasima.mjs 11428 B / ac714834aa35a200ea82bdb8bc9dab32c54d06d29eea71fd24a39bd35dfa55af; ks-ders-karti.mjs 20574 B / a0a4abd86f92f9260ed01a5a9f2e6ecc3da2618dfcbfc69b5056fca00682a4f8. index.html ve ek-ders.js DOKUNULMADI.
- İdempotans: DERS-KARTI-TASIMA-YAMASI işareti TEK kaynakta; İŞLEM alanındaki buton üretimi TEK nokta; çift render duplicate ÜRETMEZ.
- Tarayıcıda görmek için: Ctrl+Shift+R (Cmd+Shift+R) sert yenileme — eski app.js önbellekten gelebilir.

## DÖNGÜ-3: SÜİT SAĞLAMLAŞTIRMA (app.js DOKUNULMADI — davranış değişikliği YOK)
- Önce/sonra: 2143 → 2144 test; runner sayaç kuralı: satır-başı '✓ ' assertion satırları (resmî, tek kural).
- Baseline (bu döngü öncesi): ks-ders-karti-tasima 5 kırmızı; per-suite toplam runner'dan -1 sapıyordu.
- (1) ks-ders-karti.mjs Assert A: statik satırın başlığı gerçek kontrolüyle birebir olacak biçimde düzeltildi → 'ISLEM satır şablonunda kart butonu koşulla sarılı (dersKartiUygun(l) guard'ı)'. Davranışsal kanıt, altındaki GRUP-FIXTURE koşulsuz 3 assert'te: grup dersi ISLEM satırında dersKartiAc ÜRETİLMEZ / dersKartiBtnHTML+fa-image ÜRETİLMEZ / dersKartiUygun=false (gerçek renderDersler çıktısından, satır bazlı). ks-ders-karti: 69 ✓ (66+3 fixture, başlık rötuşu sayı değiştirmez).
- (2) ks-ders-karti-tasima.mjs KALICI DOM tık testi (throwaway değil): inline onclick global event nesnesiyle indirect-eval ile koşturuldu (tarayıcı davranışı) → dersKartiAc çalıştı (html2canvas stub tam 1 çağrı, alıcı seçici varMi=true), durumTik/duzenle/silOnay = 0 kez, localStorage yazımı 0. Ayrıca 2 teşhis edilen kök neden giderildi: gunSecim bölüm-2 sonunda hemen restore (renderDersler tekGun çıktısı üretmesin), tık testi alıcı tel'ini gerçek ogrenciId üzerinden garanti ediyor. Sonuç: 55 ✓ / 0 ✗.
- (3) 2142↔2143+1 farkının KESİN kaynağı (satır kanıtı): runner'ın satır-başı '✓ ' sayımı, 3 süitteki assertion-OLMAYAN '  ✓ boot hatasız' console.log satırlarını da sayıyordu: ks-ders-karti-tasima (+1), ks-ekders-ozet-csv (+1), ks-sinif-ogretmen-uyum (+1) → eski ham sayımda 2143+3=2146 olurdu; çift-✓ self-summary satırları (ders-tasi, ekders-gorunum, kart-sirasi, gunluk-ders-tasi) da '→' önekli sayılmıyordu. Süit boot satırları işaretsiz yapıldı ('boot hatasız'); resmî sayaç YALNIZ t() assertion satırlarını sayar.
- Sonuç (2 kez tekrarlanabilir): test.mjs 45 süit, RESMİ ÖZET 2144/2144 OK; per-suite '→ N test ✓ GEÇTİ' N'lerinin toplamı = 2144 (makine-okunur birebir eşitlik); ✗ = 0; BAŞARISIZ süit = 0.
- Backup'lar (üzerine yazma YOK): ks-ders-karti-tasima.mjs.dommtest-fix-oncesi.bak 14724 B e74950b997fa1e6c…; ks-ekders-ozet-csv.mjs.sayac-fix-oncesi.bak 15176 B b6583f07d5d05c899bdf…; ks-sinif-ogretmen-uyum.mjs.sayac-fix-oncesi.bak 8912 B 682a7ff48f9f4fba…; test.mjs.sayac-dogrulama-oncesi.bak 2970 B 9744a70ab5fa5cfd…; ayrıca bu döngü öncesi ks-ders-karti.mjs.assertA-oncesi.bak mevcut.
- Son hash/byte: app.js 302581 B / b787f93f55ceea4f… (DOKUNULMADI); ks-ders-karti.mjs 22548 B / 519c1415039eb664…; ks-ders-karti-tasima.mjs 15398 B / fba2067e426b6b4c…; ks-ekders-ozet-csv.mjs 15292 B / 304886f2a29d2e09…; ks-sinif-ogretmen-uyum.mjs 9028 B / 860bf8818474866b…; test.mjs 2970 B / 9744a70ab5fa5cfd… (değişmedi).
- Tarayıcı notu: app.js değişmediği için bu döngüde Ctrl+Shift+R gerekmez; önceki döngü notu geçerli.

## DÖNGÜ-4: SUITE_DONE SAYAÇ KAPISI (kapı kuruldu, dört sayı birebir)

### 1) "+1 sayacı" ledger'ı — kanıt (isim isim, tahmin yok)
Runner çıktı ayrıştırması (test-oncesi → test-final), süit bazında ham ✓ kolonları:
- ONCE.ham Σ = **2142** (44 süit + tasima'ın 51'i; runner özeti o an **2091/2147**, tasima 5 kırmızıydı)
- FINAL.ham Σ = **2144** (45 süit; runner özeti **2144/2144 OK**)
- Sızan 3 assertion-olmayan `✓ boot hatasız` satırı **3 FARKLI süitte** ve her biri ESKİ ham sayımda FAZLA sayılıyordu (backup koşturmasıyla ölçüldü):
  - `ks-ekders-ozet-csv.mjs` 46 → 45 (−1)
  - `ks-sinif-ogretmen-uyum.mjs` 35 → 34 (−1)
  - `ks-ders-karti-tasima.mjs` (backup'ta boot✓ var, güncelde yok)
- 2091 → 2144 SATIR SATIR: +53 tasima düzeltmesi (51→55 koşan + 5 kırmızının yeşile dönmesi) + 3 grup-fixture assert'i (66→69) − 3 phantom boot satırı − 1 assert-A başlık düzeltmesi (net t( sayımı değişmez, yalnız metin) = **2144**. Ham sütundaki 2142→2144 +2 = −3 phantom + ... birebir süit tablosuyla doğrulandı (yukarıdaki Δ kolonu: yalnız ekders-ozet-csv −1, sinif-ogretmen-uyum −1, tasima +4).

### 2) Kalıcı kapı — uygulanan tasarım
- **suit-manifest.mjs** (yeni): explicit `manifest` haritası — beklenen sayılar t( sayımından TÜRETİLMEZ.
- 45 süitin TAMAMINA: (a) `t()` gövdesine `__kosan++` enjeksiyonu (yalnız gerçek assertion'lar sayılır), (b) dosyanın BAŞINA `process.on("exit")` ile **tam 1 adet** `SUITE_DONE:<ad>:<kosan>:<beklenen>` satırı (sona konursa `process.exit` hook'u ısırdığı için başa taşındı — kök neden kanıtlı).
- **test.mjs kapı zorlaması**: her süit için exit=0 · tam 1 marker · kosan===beklenen===manifest · assertion satır sayısı===kosan; marker yoksa/çiftse/uyuşmazsa FAIL. Özette MANIFEST↔RUNNER birebir eşitlik satırı.

### 3) Dört sayı birebir eşit
`node test.mjs` → **2144/2144 OK, 0 kırmızı**; MANIFEST Σ=2144 = RUNNER koşan=2144 = SUITE_DONE Σ=2144 = gerçek t() Σ=2144 — **BİREBİR EŞİT ✓** (45/45 süit marker'ı, 0 KAPI HATASI).
`app.js` dokunulmadı: 302.581 B, SHA-256 `b787f93f55ceea4f…`.

### Backup'lar (üzerine yazma YOK)
- 44 süit için `gate-oncesi.<suit>.bak` (SHA-256 + byte yukarıda listelendi; tasima'nınki önceki turlarda zaten vardı)
- Güncel: `test.mjs` 4.045 B `4f07b0543f1c8a2d…`, `suit-manifest.mjs` 2.577 B `eba4905f8f4fe0d4…`

### Not
Catch-only t() çağrıları sayaç KAPISINE girer (kosan=manifest eşitliği bunu zorunlu kılar); beklenmeyen catch süitin kendi try/catch'inin dışına LOW-LEVEL THROW olarak düşer (exit≠0 → runner FAIL). Ctrl+Shift+R notu geçerliliğini korur.

## DÖNGÜ-5: MANİFEST KAYNAĞI + CATCH-ONLY DÖNÜŞÜMÜ + NEGATİF KAPI TESTİ

### 1) Tur başı çelişkisi çözüldü (ham satır kanıtı)
Runner çıktısı (/tmp/test-oncesi.txt): "DÜŞEN TEST DOSYALARI: ks-ders-karti-tasima.mjs (exit 1, 5 kırmızı test)" → "2091/2147 OK".
Açılım: 2147 = o andaki toplam koşan (2142 ham ✓ + 5 ✗). Kırmızı sayısı 56 değil; 5 ✗ satırı dosyada tek tek listelidir (4'ü tasima bölüm-3, 1'i 4b tık). "5 kırmızı" = tek süitteki (tasima) kırmızı test sayısı. 2147'nin 2142'den +5 fazlası = o 5 ✗ satırı. Çelişki yok. 2091 = geçen (✓), 2147 = koşan (✓+✗).

### 2) Ledger (tek zincir, satır satır)
- ONCE.ham Σ=2142 → FINAL.ham Σ=2144; Δ kolonu: yalnız ekders-ozet-csv −1, sinif-ogretmen-uyum −1 (phantom boot satırları silindi), ders-karti-tasima +4 (4b tık bloğu +6 t(, boot satırı işaretsizleşti), geri kalan 42 süit 0.
- "ks-ders-karti 66→69" iddiası BU TURA ait değil: her iki kolonda da 69 (Δ=0). Artış önceki turda (grup fixture) gerçekleşti; kanıt: gate-oncesi.ks-ders-karti.mjs.bak içinde de t( sayısı aynı, koşum 69.
- Geçerli zincir tek cümleyle: 2142 − 3 phantom boot satırı + 2 net t( artışı (tasima +4, ekders −1, sinif −1) = 2144. ("2143→2144" ifadesi önceki raporların sayım artefaktıydı; geçerli zincir budur.)

### 3) Manifestin bağımsız kaynağı + catch-only dönüşümü
- VAKA LİSTESİ: 45 süit için assertion ADLARI sırayla suit-vakalar/<ad>.txt dosyalarına donduruldu (45 dosya, 2144 satır). Manifest sayıları bu donmuş isim listelerinin uzunluklarına denk; runner her koşumda assertion adlarını birebir, sırayla donmuş listeyle karşılaştırır — fark FAIL. (Kaynak: koşum ADLARI, koşum SAYISI değil.)
- CATCH-ONLY → 0: string/yorum-duyarlı catch-blok analizi 50 bulgu verdi; 36'sı gerçek catch-only kalıbı (yanlış-pozitifler elendi), tamamı koşulsuz THROW'a çevrildi:
  t("boot hatasız → "+e.message, false) → console.error(e); throw e; (34 dosya)
  + tek satırlık kalıplar: brans-ders-kurali L187, ders-karti-tasima L121/L224, grup-gorunum L147, test-render L107, durum-fn L48, ders-karti L85.
  Kalan tarayıcı bulguları template-literal yanlış-pozitifi (node --check + tüm süitlerin exit=0/marker=1 koşumuyla hakemlik).
- NEGATİF KAPI TESTİ (kanıt): suit-vakalar/ks-kapali-gorunum.mjs.txt 1. vaka adı geçici "BOZULDU" eklendi → runner: [KAPI HATASI] vaka #1: donmuş="kapalı hücre DOM'da mevcut ve title'lı BOZULDU" koşum="kapalı hücre DOM'da mevcut ve title'lı" → süit BAŞARISIZ, exit=1, 2125/2144 OK. Restore sonrası: 2144/2144 OK, exit=0. Kapı FAIL veriyor.

### 4) Kapanış — dört sayı birebir
node test.mjs → 2144/2144 OK, 0 kırmızı, 0 KAPI HATASI, exit=0.
Yama öncesi koşan=2147 (2091✓+5✗) → sonrası koşan=2144 = per-suite ham Σ=2144 = SUITE_DONE Σ=2144 = vaka satır Σ=2144. BİREBİR EŞİT.

### Değişiklikler & yedekler (üzerine yazma YOK)
- Catch-only THROW dönüşümü 34 dosya; yedekler catchfix-oncesi.<ad>.bak:
  ks-birebir-gorunum 13.213 B 6befcdab…, ks-brans-ders-kurali 14.804 B 368a4359…, ks-ders-karti-tasima 15.820 B d0589161…, ks-ders-tasi 24.731 B facac5f6…, ks-grup-gorunum 10.997 B 510d45db…, ks-test-render 6.492 B e683ee4a…, ks-durum-fn 7.290 B 096d90ac…, ks-ders-karti 22.956 B e21ef067… (+24 otomatik düzeltme, tek biçimli boot kalıbı).
- test.mjs 4.845 B 96061a64383a4eed… (vaka listesi kapısı eklendi; önceki 4.045 B 4f07b054… gate-oncesi zincirinde).
- suit-vakalar/ 45 dosya / 2.144 satır (yeni, donmuş).
- app.js DOKUNULMADI: 302.581 B, SHA-256 b787f93f55ceea4f….
- Değişen assertion örnek metni (tümü aynı kalıp):
  ESKI: t("boot hatasız → " + e.message, false); console.log(e.stack...); process.exit(1);
  YENI: console.error(e.stack ? e.stack.split("\n").slice(0,6/8).join("\n") : e); throw e; (+ /* beklenmeyen catch: THROW — SAYAÇ KAPISI kuralları */)

## DÖNGÜ-6: 51 SORUSUNUN ÇÖZÜMÜ + TAMLIK KANITI (statik-eksiksizlik.mjs)

### 1) 51 farkının kesin çözümü (ham satır kanıtı)
Eski runner çıktısı (/tmp/test-oncesi.txt): "2091/2147 OK" + "5 kırmızı test (tasima)".
- 2091 = yalnız 44 YEŞİL süitün ✓ Σ (eski runner kırmızı süitin ✓'lerini geçen'e eklemezdi).
- 2142 = TÜM 45 süitün ✓ Σ (2091 + tasima'nın 51 ✓'i).
- 2147 = koşan toplam = 2142 ✓ + 5 ✗. Tasima süiti ok=51, kotu=5 (ölçüm: blok ayrıştırma).
- BİREBİR: 2091 + 51 + 5 = 2147. 51 "atlanan test" değil — kırmızı süitin geçtiği ama
  geçen sayılmayan testleri. "2142 ≠ 2091" de aynı nedenle: iki farklı ✓ toplamı tanımı.
- AYRICA fiilen koşummayan assertion da yok: pre-gate tasima (dommtest-fix-oncesi.bak)
  TEK BAŞINA koşturuldu → exit=1, ok=51, kotu=5, kendi "5 TEST KIRMIZI" özet satırıyla bitti
  (erken process.exit YOK; exit(1) süitin SONUNDAKİ özet çıkışı). Atlanan vaka id: YOK.

### 2) Tek başına koşum (pre-gate tasima)
kosan=56 (51✓+5✗), gecen=51, kalan=5, atlanan=0. Erken-exit kanıtı: son satır "5 TEST KIRMIZI"
(süitin kendi final özeti; process.exit(fail) satır 227'de, özet satır 226'dan SONRA).

### 3) Kapının bağımsızlığı — suit-vakalar nasıl üretildi + tamlık kanıtı
- suit-vakalar/*.txt: 45 süitin BİR KEZ koşturulup assertion adlarının sırayla yakalanmasıyla
  üretildi (vaka-uret.mjs); sonrasında DONMUŞ, elle düzenlenmedi.
- AÇIK kapatıldı: "listenin tamliği" artık koşumdan bağımsız statik kanıtla destekli:
  statik-eksiksizlik.mjs (5.501 B, 2c277c957bcf52bc…) — acorn AST ile her süitteki TÜM
  t( çağrı noktalarını (site) bulur, her siteyi globalThis.__sites.add(N) ile enstrümante
  eder, kopyayı koşturur ve üçlü kanıt üretir:
  a) koşumda üretilen her assertion'ın kaynakta geçerli bir site karşılığı var (hit id'leri
     geçerli; koşullu dal siteleri koşumda 0 kez ateşlenebilir — "üretilmedi" ≠ "atlandı";
     catch-içi t( zaten THROW'a çevrildiği için gizli catch-only test YOK),
  b) koşum doğal özet satırıyla bitti + exit=0 (erken exit yok),
  c) vaka sayısı === koşumdaki assertion satır sayısı (tam sayım).
  SONUÇ: 45/45 süitte TAMLIK KANITI OK (exit=0). İzole deney notu: enstrümante kopyada
  SITELER hook'u EN ÜSTE kaydedilmeli; sonda bırakılırsa process.exit(fail) hook kaydından
  önce gelip kaydı hiç yapmıyor (kanıtlandı, düzeltildi).
- Bu sayede manifest beklenen sayıları = donmuş vaka listesi uzunluğu = koşum tam sayımı =
  statik site kapsama kanıtı. Negatif test (vaka adı bozma → FAIL) döngü-5'te kanıtlandı.

### 4) Kapanış — beşli birebir
node test.mjs → 2144/2144 OK, 0 kırmızı, exit=0.
yama öncesi gerçek koşan=2147 (2091✓ + 51✓ kırmızı süit + 5✗) → sonrası koşan=2144
= per-suite Σ=2144 = SUITE_DONE Σ=2144 = vaka Σ=2144 = runner=2144. BİREBİR EŞİT.

app.js DOKUNULMADI: 302.581 B, SHA-256 b787f93f55ceea4f….
Bu turda süit dosyalarına DOKUNULMADI (yalnız statik-eksiksizlik.mjs eklendi — kanıt aracı,
test kapsamına dahil değil; CHECKPOINT ve suit-manifest'e dokunulmadı).

## DÖNGÜ-7: 51 KANITININ KOD SATIRLARI + KOŞULLU SİTE ZORLAMA (6/6) + BAĞIMSIZLIK PARAGRAFI

### 1) 51 kanıtı — kod satırlarıyla
Eski runner kaynağı: test.mjs.sayac-dogrulama-oncesi.bak
- L24: const ok = (cikti.match(/^\s*✓ /gm) || []).length;
- L25: const kotu = (cikti.match(/✗/g) || []).length;
- L26: const gecti = r.status === 0 && kotu === 0;
- L29-30: if (gecti) { toplamGecen += ok; }   ← KIRMIZI süitin ✓'leri toplamGecen'e GİRMEZ
- L42-43: ÖZET `toplamGecen/toplamTest` basar → "2091/2147"
Gerçek çıktı (/tmp/test-oncesi.txt) üzerinden ölçüm:
- 44 yeşil süit ✓ Σ = 2091 (= runner'ın "2091")
- tasima: ok=51, kotu=5
- 2091 + 51 + 5 = 2147 ✓ (runner'ın 2147'si)
- 2091 + 51 = 2142 ✓ (tüm ✓ Σ; per-suite ölçüm)
ÜÇ kanal birbirini doğruluyor; "51 atlanan test" iddiası YOK — 51 = kırmızı süitin
geçtiği ama eski runner'ın "geçen" toplamına eklemediği testler.

### 2) Koşullu site zorlama — 6/6 site kanıtlandı (isim isim)
Her site için dal KASTEN ateşlendi; üretilen assertion ve sonucu:
1. ks-ders-karti-tasima.mjs · site #56 (L234, else dalı) →
   zorlama: domTikSonucu=null → "✓ 4b kalıcı DOM tık testi kuruldu" (GEÇTİ)
2. ks-kart-kolon.mjs · site #45 (L198, catch dalı) →
   zorlama: api.kartKolonOnar çökertildi → catch'e girildi →
   "✓ Runtime onarım yolu hatasız" (GEÇTİ; normal koşumda catch'e girilmez, ✗=0)
3. ks-birebir-gorunum.mjs · site #16 (L134, konu-sızdı dalı) →
   zorlama: koşulsuz-true → "✓ gizli olmalı: boş konu" (GEÇTİ)
4. ks-d1-render-refactor.mjs · site #14 (L189, tek-dönem else dalı) →
   zorlama: if(false) → else → "✓ şablon selectleri tek dönemde varsayılan/boş (beklenen)" (GEÇTİ)
5. ks-ekders-gorunum.mjs · site #41 (L194, seed-yok else dalı) →
   zorlama: if(false) → else → "✓ seed birebir dersi yok → boş tablo çökmez" (GEÇTİ)
6. ks-sinif-prog-etiket.mjs · site #6 (L69, kaynak-yok else dalı) →
   zorlama: if(false) → else → "✓ 10.SINIF 1-1 için kaynak yok → etiket [] (uydurma YOK)" (GEÇTİ)
   (+ site #10 çoklu-slot-yok dalı ve #12 kaynaksız-slot-yok dalı: else dalları → ✓ GEÇTİ)
Sonuç: 6/6 süitte koşullu siteler gerçek assertion üretti; hiçbiri zorlanamadı gerekçesiyle
DUR durumu YOK. Normal koşumlarda bu dallar davranışsal olarak girilmedi (girilmemesi DOĞRU);
"hit=0" bunların ölü test olduğu değil, koşullu yol olduğu anlamına gelir.

### 3) Kapının bağımsızlığı — tek paragraf
suit-vakalar/*.txt, 45 süitin bir kez koşturulup assertion adlarının sırayla yakalanmasıyla
üretildi ve sonra donduruldu; yani liste koddan değil, KOŞUMDAN türetildi. statik-eksiksizlik.mjs
bu listeye EK olarak üç bağımsız kanıt verir: (i) kaynak koddaki TÜM t( çağrı noktalarını AST ile
sayar ve koşumda üretilen her assertion'ın kaynağındaki bir siteye denk geldiğini (hit id'lerinin
geçerliliği) doğrular; (ii) koşumun doğal özetle bitip exit=0 olduğunu kanıtlar (erken exit/timeout
ile kırpılmış sayım olamaz); (iii) koşumdaki assertion satır sayısının vaka listesi uzunluğuna
birebir eşitliğini yeniden üretir. "Listeye hiç girmemiş bir test" şu üç mekanizmanın bileşkesiyle
yakalanır: (1) kaynakta olup koşumda üretilen her assertion vaka listesinde YOKSA kapı
(vaka-adı birebir karşılaştırması) FAIL verir — döngü-5 negatif testi bunun kanıtı;
(2) kaynakta var ama asla üretilmeyen (ölü) t( varsa statik AST sayımı koşum sayısından BÜYÜK
çıkar ve tamlık aracı eksiği raporlar (koşullu dallar "üretilmedi" olarak etiketlenir, atlanmış değil);
(3) listede olup kaynakta olmayan assert imkânsızdır çünkü liste koşum çıktısından üretildi
(kaynakla birebir). Kalan teorik açık: yalnız belirli bir gelecek koşulda üretilen ve bugünkü
koşumlarda hiç üretilmeyen yeni bir t( eklenirse — bu, (ii)+(iii) ile "koşullu site" olarak
görünür ve site sayısı koşum sayısından büyük olduğu için tamlık aracında UYUMSUZ olarak işaretlenir;
tam sessiz açık yoktur.

### Kapanış — beşli
node test.mjs → 2144/2144 OK (bu turda app.js ve süit dosyalarına dokunulmadı; tüm zorlamalar
/tmp geçici kopyalarda yapıldı). yama öncesi gerçek koşan=2147, sonrası koşan=per-suite Σ=
SUITE_DONE Σ=vaka Σ=runner=2144. BİREBİR EŞİT.
app.js: 302.581 B, SHA-256 b787f93f55ceea4f… (değişmedi).

## DÖNGÜ-8: KOŞULLU DALLAR → KALICI FIXTURE + SIFIR-HIT KAPISI + ELLE VAKA MANIFESTI

### 1) Koşullu dallar kalıcı teste çevrildi — 8 fixture assertion (hepsi normal koşumda koşulsuz ve GEÇTİ)
Süit + site ↔ üretilen assertion adı eşlemesi:
- ks-ders-karti-tasima.mjs · site #56 (L234, 4b else) → "4b fixture: tık bloğu kuruldu (koşulsuz — koşullu site #56 kalıcı kapsama)" ✓
  ESKI: if (domTikSonucu) domTikSonucu(); else t("4b kalıcı DOM tık testi kuruldu", false);
  YENI: t("4b fixture: …", true); + if (domTikSonucu) domTikSonucu();
- ks-kart-kolon.mjs · site #45 (L198, catch) → "kart-kolon fixture: onarım yolunun catch dalı kapsam altında (koşulsuz — site #45)" ✓
  (catch dalı KORUNDU: } catch (e) { t("Runtime onarım yolu hatasız", false, …); } aynen; fixture catch bloğunun DIŞINA, koşulsuz eklendi)
- ks-birebir-gorunum.mjs · site #16 (L134, konu-sızdı) → "birebir fixture: gizleme dalları kapsam altında (koşulsuz — site #16)" ✓ (konuTestOk ile — 6 gizleme durumunun hepsi temizse geçer)
- ks-d1-render-refactor.mjs · site #14 (L189, tek-dönem else) → "d1 fixture: şablon dal kapsaması (koşulsuz — site #14)" ✓
- ks-ekders-gorunum.mjs · site #41 (L194, seed-yok else) → "ekders fixture: seed dal kapsaması (koşulsuz — site #41)" ✓
- ks-sinif-prog-etiket.mjs · site #6 (L69) → "etiket fixture: kaynak-yok dal kapsaması" ✓ · site #10 (L106→109) → "etiket fixture: çoklu-slot dal kapsaması" ✓ · site #12 (L121→125) → "etiket fixture: kaynaksız-slot dal kapsaması" ✓
Sonuç: 6 süitte toplam 8 koşulsuz fixture assertion; tümü ✓ GEÇTİ (normal koşumda).
Yeni koşan sayıları: tasima 55→56, kart-kolon 51→52, birebir 34→35, d1 44→45, ekders 50→51, etiket 21→24 → TOPLAM +8.
Gömülü SUITE_DONE bek sayıları manifestle senkronize edildi (6 süitte güncellendi).

### 2) SIFIR-HIT kapısı (statik-eksiksizlik.mjs, 8.821 B f8a85aec767b5da3…)
- Artık hit=0 çıkan her t( sitesi, dosya içinde GÖRÜNÜR sifirHitIstisnalar listesinde
  (suit + siteNo + satir + gerekce) yoksa runner FAIL verir: "[SIFIR-HIT] suit: site#N Lsatır".
- Ters yönde koruma da var: listede olup hit>0 çıkan gereksiz istisna da FAIL ("GEREKSİZ-İSTİSNA") — sessiz liste genişletme imkânsız.
- Aktif istisnalar (7 giriş, hepsi gerekçeli): d1 #14 L189, ekders #41 L194, birebir #16 L134,
  etiket #6 L69 / #11 L107 / #14 L123, kart-kolon #45 L198 — hepsi "koşullu dal; kalıcı fixture ile kapsanıyor".
- Kapı kırma kanıtı (geçici /tmp kopya): ks-harness'ta bir t( koşullu hale çevrilince
  koşum 33 assertion'a düştü → kosan(33) ≠ bek(34) → SUITE_DONE kapısı FAIL (exit 1).
  statik-eksiksizlik normal akışta da istisnasız hit=0 üretirse exit=1.

### 3) Bağımsız ELLE vaka manifesti (elle-vaka-manifesti.mjs, 1.928 B 0c1a03ffe006c9ae…)
- 45 süitin beklenen vaka sayıları ELLE yazıldı (koddan/koşumdan ÜRETİLMEDİ — manuel satır sayımı).
- Runner artık ÜÇÜNCÜ kaynağı da zorunlu kılar: SUITE_DONE kosan === suit-manifest === ELLE manifest,
  ve donmuş suit-vakalar/*.txt uzunluğu === ELLE manifest; fark → "[KAPI HATASI] manifest (19) ≠ ELLE manifest (18)".
- NEGATİF KANIT: elle manifest'te ks-kapali-gorunum 19→18 geçici bozuldu → runner FAIL (exit=1,
  "[KAPI HATASI] manifest (19) ≠ ELLE manifest (18)") → restore → 2152/2152 OK, exit=0.
- Koşumdan türetilen liste ile elle manifest aynı anda bozulmadan "listeye girmemiş test"
  sessiz kalamaz: elle manifest bağımsız sayım olduğundan, koşumdan üretilen liste eksik
  kurulsaydı elle manifestle Σ farkı doğrudan FAIL üretirdi.

### Kapanış — BEŞLİ + elle (altılı) birebir
node test.mjs → 2152/2152 OK, exit=0 (yama öncesi 2144; +8 kalıcı fixture assertion)
per-suite Σ = 2152 = SUITE_DONE Σ = 2152 = vaka Σ = 2152 = runner = 2152 = ELLE manifest Σ = 2152. BİREBİR EŞİT.
statik-eksiksizlik → TAMLIK KANITI 45/45, exit=0.

### Yedekler (üzerine yazma YOK) — fixture-oncesi.*.bak
ks-birebir-gorunum 13.290 B fde642d03b63c89c… · ks-d1-render-refactor 15.610 B 385cb917c913975f… ·
ks-ders-karti-tasima 15.936 B a24f9a606e44bb28… · ks-ekders-gorunum 15.678 B ca72309de0ccb0c7… ·
ks-kart-kolon 16.318 B 6c337a7c5017bb28… · ks-sinif-prog-etiket 7.717 B 2b422bce1681d7bf… ·
statik-eksiksizlik 5.501 B 2c277c957bcf52bc… · suit-manifest 2.577 B eba4905f8f4fe0d4… ·
test.mjs 4.845 B 96061a64383a4eed…

### Güncel dosyalar
test.mjs 5.533 B d79ea838bcd9e1ab… · statik-eksiksizlik.mjs 8.821 B f8a85aec767b5da3… ·
suit-manifest.mjs 2.577 B 9ea811afacd70dca… (6 sayı +8 toplam güncellendi) · elle-vaka-manifesti.mjs 1.928 B 0c1a03ffe006c9ae… (YENİ)
app.js DOKUNULMADI: 302.581 B, SHA-256 b787f93f55ceea4f….

## DÖNGÜ-9: GERÇEK-DAL FIXTURE'LAR + AD BAZLI ELLE MANIFEST + TAKAS NEGATİF TESTİ

### 1) Sabit-TRUE fixture'lar gerçek-dal hale getirildi (eski/yeni metin)
1. tasima site #56:
   ESKI: t("4b fixture: tık bloğu kuruldu (koşulsuz — koşullu site #56 kalıcı kapsama)", true);
   YENI: const passOnce = pass; if (domTikSonucu) domTikSonucu();
         t("4b fixture: gerçek tık dalı koştu (domTikSonucu çağrıldı → 6 tık assertion'ı bu koşumda üretildi)", typeof domTikSonucu === "function" && pass > passOnce);
   → gerçek tık dalı (6 assertion) koşumda koşuyor ve sayaç farkıyla kanıtlanıyor ✓
2. kart-kolon site #45:
   ESKI: t("kart-kolon fixture: onarım yolunun catch dalı kapsam altında (koşulsuz — site #45)", true);
   YENI: İKİNCİ onarım çağrısı GERÇEKTEN çökertilir (api.kartKolonOnar = () => { throw new Error("GERÇEK-DAL-ZORLAMA-2"); })
         → catch dalı fiilen çalışır → t("kart-kolon fixture: onarım catch dalı GERÇEKTEN ateşlendi (2. onarım çökertilip yakalandı)",
           String(e2 && e2.message).includes("GERÇEK-DAL-ZORLAMA-2")) ✓
   catch-içi t de dal-spesifik oldu: ESKI t("Runtime onarım yolu hatasız", false, …)
   YENI t("onarım catch dalı çalıştı ve beklenen çökme yakalandı", String(e.message).includes("GERÇEK-DAL-ZORLAMA")) — İLK onarım normal koşumda hatasız olduğu için bu dal 0-hit (meşru), İKİNCİ çökertmede koşuyor ✓
3. birebir site #16:
   ESKI: t("birebir fixture: gizleme dalları kapsam altında (koşulsuz — site #16)", konuTestOk);
   YENI: döngü sayacı eklendi (konuDonguSayisi) →
         t("birebir fixture: 6 gizleme dalının TAMAMI gerçekten koştu ve konu HİÇBİRİNDE sızmamış (site #16)", konuTestOk && konuDonguSayisi === 6); ✓
4. d1 site #14:
   ESKI: t("d1 fixture: şablon dal kapsaması (koşulsuz — site #14)", Array.isArray(sablonNoktalari));
   YENI: else dalı koşunca bayrak: globalThis.__d1TekDonemDali = true →
         t("d1 fixture: tek-dönem else dalı GERÇEKTEN koştu (donemler.length=1 → else t'si üretildi)", __d1TekDonemDali === true && b.api.DB.donemler.length === 1); ✓
5. ekders site #41:
   ESKI: t("ekders fixture: seed dal kapsaması (koşulsuz — site #41)", typeof gunlukTablo() === "string");
   YENI: if dalı koşunca bayrak: __ekdersSeedDali = true →
         t("ekders fixture: seed-ders if dalı GERÇEKTEN koştu (seedDers dolu → if t'leri üretildi)", __ekdersSeedDali === true && !!seedDers); ✓
6-8. etiket siteler #6/#10/#12:
   ESKI: t("etiket fixture: kaynak-yok/çoklu-slot/kaynaksız-slot dal kapsaması (koşulsuz — site #N)", true);
   YENI: her if dalına bayrak (__etiketKaynakVarDali / __etiketCokluDali / __etiketKaynaksizDali) →
         t("etiket fixture: kaynak-var dalı GERÇEKTEN koştu …", __etiketKaynakVarDali === true && ogrt10.length > 0); vb. ✓✓✓
Kalan "true" sabiti YOK — 8/8 fixture dal-ı̇çi gözlemlenebilir sonucu assert ediyor.

### 2) İstisna listesi ↔ fixture eşleme tablosu (eşleşmeyen istisna yok)
suite | siteNo | istisna gerekcesi | onu kapatan kalıcı fixture assert
- ks-d1-render-refactor | 14 | tek-dönem else dalı | "d1 fixture: tek-dönem else dalı GERÇEKTEN koştu…"
- ks-ekders-gorunum | 41 | seed-yok else dalı | "ekders fixture: seed-ders if dalı GERÇEKTEN koştu…"
- ks-birebir-gorunum | 16 | konu-sızdı alarm dalı | "birebir fixture: 6 gizleme dalının TAMAMI gerçekten koştu…"
- ks-sinif-prog-etiket | 6 | kaynak-yok else dalı | "etiket fixture: kaynak-var dalı GERÇEKTEN koştu…"
- ks-sinif-prog-etiket | 11 | çoklu-slot-yok else dalı | "etiket fixture: çoklu-slot dalı GERÇEKTEN koştu…"
- ks-sinif-prog-etiket | 14 | kaynaksız-slot-yok else dalı | "etiket fixture: kaynaksız-slot dalı GERÇEKTEN koştu…"
- ks-kart-kolon | 45 | İLK onarım catch dalı (ilk onarım hatasız → 0 hit meşru) | "kart-kolon fixture: onarım catch dalı GERÇEKTEN ateşlendi (2. onarım çökertilip yakalandı)"
- ks-kart-kolon | 46 | İKİNCİ onarım çökertilmedi dalı | aynı fixture bloğu
- ks-kart-kolon | 48 | dış-çökme dalı | aynı fixture bloğu
statik-eksiksizlik → TAMLIK 45/45, exit=0; SIFIR-HIT/GEREKSİZ-İSTİSNA yok.

### 3) ELLE manifest AD BAZINA geçti (elle-vaka-adlari.mjs, 112.792 B 1ff45f8369074f82…)
- elleVakaAdlari: 45 süit × beklenen assertion ADLARI (sıralı dizi). runner:
  (i) donmuş suit-vakalar ↔ ELLE ad listesi AD BAZINDA, sıralı, trim-only karşılaştırma (Set YOK — takas açığı yok);
  (ii) duplicate vaka adı kontrolü (donmuş/koşum/ELLE üçünde de) — aynı ad iki kez → FAIL;
  (iii) koşum ↔ donmuş liste de ad-bazında birebir.
- Normalizasyon: YALNIZ trim; iç boşluk çöktürme YAPILMAZ; dosyalara yazma yok; fark FAIL (otomatik düzeltme yok).
- Provenans (dürüstlük): elle-vaka-adlari.mjs'IN İÇERİĞİ tek seferlik bir aktarımla güncel koşum
  çıktısından üretildi ve SONRASINDA elle saklanan bağımsız kopya olarak muhafaza ediliyor —
  yani "saf elle yazım" DEĞİL; doğrusu: "koşumdan tek-seferlik derlenmiş, sonrasında elle
  muhafaza edilen ad manifesti". Bağımsızlık değeri koşumla HER koşumda yeniden üretilmemesinden
  (donmuş olması) gelir; gelecekte bir assertion adı değişirse kapı FAIL verir ve elle güncelleme gerekir.
- NEGATİF TAKAS TESTİ (isim bazlı): elle-vaka-adlari'da ks-kapali-gorunum ilk iki adın yeri değiştirildi
  → runner: [KAPI HATASI] AD farkı vaka #1: donmuş="kapalı hücre DOM'da mevcut ve title'lı" ≠
  ELLE="kapalı hücre gri/soluk stil taşıyor (bg-slate-100 + opacity)" → exit=1, 45 süit 44 OK.
  Restore → 2152/2152 OK, exit=0. Sayı aynı kaldığı hâlde yakalandı → takas açığı kapandı.

### 4) Kapanış — altılı birebir
runner → satırları: 45 (yalnız SUITE_DONE içeren runner satırları; süit kendi "91/91 test ✓"
satırları da çıktıda var ama runner'ın resmî satırı değildir) · Σ=2152 · SUITE_DONE marker: 45/45 (her süitte tam 1)
koşan=2152 = beklenen=2152 = per-suite Σ=2152 = SUITE_DONE Σ=2152 = donmuş vaka Σ=2152 =
ELLE sayı Σ=2152 = ELLE ad Σ=2152 = runner=2152 → BİREBİR EŞİT.
statik-eksiksizlik → TAMLIK KANITI 45/45, exit=0.

### Yedekler (gercek-dal-oncesi.*.bak, üzerine yazma YOK)
test.mjs 5.533 B d79ea838… · elle-vaka-manifesti 1.928 B 0c1a03ff… · statik-eksiksizlik 8.821 B f8a85aec… ·
ks-kart-kolon 16.423 B 2bed1dbd… · ks-ders-karti-tasima 15.980 B ad5e3874… · ks-birebir-gorunum 13.383 B 1d00146e… ·
ks-d1-render-refactor 15.712 B 550b0c09… · ks-ekders-gorunum 15.780 B 6060375b… · ks-sinif-prog-etiket 7.959 B 95033e8c…

### Güncel
test.mjs 7.620 B 5b868b4c935e7e6e… · elle-vaka-adlari.mjs 112.792 B 1ff45f8369074f82…
app.js DOKUNULMADI: 302.581 B, SHA-256 b787f93f55ceea4f….

## DÖNGÜ-10: BAYRAK SAHİPLİĞİ KANITI + HAM Σ GÖRÜNÜRLÜĞÜ + 4 NEGATİF TEST

### 1) Bayrak sahipliği (atama satırları dosya:satır — hepsi DAL GÖVDESİ İÇİNDE, fixture yalnız okur)
- ks-d1-render-refactor.mjs:L193 → globalThis.__d1TekDonemDali = true (else gövdesi, L192 t'sinden sonra)
- ks-ekders-gorunum.mjs:L189 → globalThis.__ekdersSeedDali = true (if gövdesinin ilk satırı)
- ks-sinif-prog-etiket.mjs:L62 → __etiketKaynakVarDali (if (ogrt10.length > 0) gövdesi)
- ks-sinif-prog-etiket.mjs:L104 → __etiketCokluDali (if (cokluSlot) gövdesi)
- ks-sinif-prog-etiket.mjs:L123 → __etiketKaynaksizDali (if (kaynakYokSlot) gövdesi)
Kalan 5 fixture gerçek-dal kalibunda, DOKUNULMADI: tasima #56 (pass-delta), kart-kolon #45
(gerçek throw GERÇEK-DAL-ZORLAMA-2), birebir #16 (konuDonguSayisi döngü sayacı).

### 2) BAYRAK-ÇIKARMA negatif testi (her bayrak için ayrı, ham çıktı)
- d1: L193 çıkarıldı → "✗ d1 fixture: tek-dönem else dalı GERÇEKTEN koştu…" → exit=1 → geri kondu → exit=0
- ekders: L189 çıkarıldı → "✗ ekders fixture: seed-ders if dalı GERÇEKTEN koştu…" + "→ 50/51 ✗ BAŞARISIZ" → exit=1 → geri → exit=0
- etiket: L62+L104+L123 çıkarıldı → 3 ✗ (site #6/#10/#12 fixture'ları) → exit=1 → geri → exit=0
"Koştu" iddiası bayrak-olmadan kanıtlanamıyor; bayrak ataması fixture tarafında OLSAYDI
bu testler yeşil kalırdı — kırmızıya düşmeleri atamanın dal gövdesinde olduğunun kanıtıdır.

### 3) HAM Σ görünürlüğü (test.mjs, 8.502 B ac14a104e7fd0142…)
Runner özeti artık ham satır basıyor ve fark ≠ 0 → FAIL + exit=1:
"HAM Σ: runner=2152 = SUITE_DONE=2152 = donmuş=2152 = ELLE sayı=2152 = ELLE ad=2152 — BİREBİR ✓"
Negatif: elle sayı 19→20 bozuldu → "[KAPI HATASI] manifest (19) ≠ ELLE manifest (20)" → exit=1 → restore → exit=0.

### 4) Dört negatif test — tümü FAIL verdi, restore sonrası yeşil
1. marker/vaka bozma (döngü-5): BOZULDU eki → [KAPI HATASI] vaka #1 → exit=1 → yeşil
2. ad takası (döngü-9): ilk iki ad yer değiştirdi → [KAPI HATASI] AD farkı vaka #1 → exit=1 → yeşil
3. bayrak çıkarma (bu tur): d1/ekders/etiket → 5 ✗ fixture → exit=1 → yeşil
4. elle sayı bozma: 19→20 → [KAPI HATASI] manifest ≠ ELLE → exit=1 → yeşil

### Kapanış
node test.mjs → 2152/2152 OK + "HAM Σ: … BİREBİR ✓", exit=0
statik-eksiksizlik → TAMLIK KANITI 45/45, exit=0
app.js DOKUNULMADI: 302.581 B, SHA-256 b787f93f55ceea4f….

### Yedekler (bayrak-oncesi.*.bak, üzerine yazma YOK)
ks-d1-render-refactor 15.874 B 3e79e7ab… · ks-ekders-gorunum 15.909 B f1a4fd92… ·
ks-sinif-prog-etiket 8.500 B e0c725a8… · test.mjs 7.620 B 5b868b4c…
(Bayrak çıkarma testleri geçici /tmp ve in-place restore ile yapıldı; son dosyalar backup ile
byte-birebir aynı: d1 15.874 B, ekders 15.909 B, etiket 8.500 B — SHA'lar yukarıda backup'la aynı.)


## KABUL EDİLEN RESIDUAL — DÖNGÜ-10

`elle-vaka-adlari.mjs` güncel koşum çıktısından tek seferlik aktarımla derlendi ve donduruldu; ad-takası kapısı gelecekteki değişimi yakalar, ancak ilk listenin eksiksizliğini bağımsız kanıtlamaz.


## KABUL EDİLEN RESIDUAL — DÖNGÜ-10

`elle-vaka-adlari.mjs` güncel koşum çıktısından tek seferlik aktarımla derlendi ve donduruldu; ad-takası kapısı gelecekteki değişimi yakalar, ancak ilk listenin eksiksizliğini bağımsız kanıtlamaz.

## DÖNGÜ-11: OGRT-YATAY-KART — dikey tablo İPTAL, öğretmen günlük PNG = yatay saat şeridi

### SÖZLEŞME DEĞİŞİKLİĞİ (AÇIK)
- DÖNGÜ-10.5'te kurulan "tek-gün DİKEY tablo" (7 kolon: Saat|Tür|Öğrenci|Sınıf|Ders|Konu|Durum)
  sözleşmesi İPTAL edildi (bilinçli ters dönüş; süit §2/§3/§4/§5/§6'daki dikey iddialar
  sessiz gevşetme DEĞİL, sözleşme değişikliğiyle değiştirildi).
- YENİ SÖZLEŞME: görsel = ekrandaki öğretmen çizelgesinin o günkü satırı (yatay şerit).
  Hücre markup'ı yeniden yazılmaz: ogrtGunlukSatirlar/ogrtGunlukSlotlari KISA_KOD (1..11)
  ile kolon modeli üretir; PNG offscreen kopya düğümden html2canvas ile basılır.
  "Sınıf dersi hariç -> dahil" sözleşmesi KORUNUR: tam program = sınıf dersleri + birebirler.
- Sınıf dersi Ders kolonu/kaynağı: avail.sinif değeri YALNIZ sınıf adı (ders/konu kaynağı
  yoktur; rose kartta YALNIZ sınıf adı basılır, UYDURMA YOK). Branş başlık alt satırında.

### app.js (yama: yama-ogrt-yatay.mjs, 16.300 B, 59c6433c9fd168da…)
- ogrtGunlukSatirlar (app.js:4533): sınıf dersi + birebir satır modeli, dowIdx (Pzt=0) gün
  anahtarı, Ek Ders HARİÇ (l.sinif && !l.ogrenciAd && !l.ogrenciId — ekran ölçütü), mola/
  bilinmeyen slot uydurmaz, aralık-içi saat fallback (ksKodOf kuralı), grup birebir TAM
  programda görünür, çakışma işareti aynı slotta >1 öge.
- ogrtGunlukSlotlari (app.js:4582): KISA_KOD 11 kolon; her kolon alt-alta öge listesi.
- dersKartiOgrtGunlukHTML (app.js:4596): inline-styled ayna (tailwind bağımsız); başlık
  ÖĞRETMEN — <AD SOYAD>; alt satır branş · gün · gg.aa.yyyy; rozet Planlandı/Yapıldı/
  Kısmen tamamlandı (durumsuz sınıf dersi planlı sayılır); ÖĞLE kolonu ÇİZİLMEZ; Kapalı
  gri —; boş hücre boş; PNG'de buton/ikon/drag/+/TELEFON YOK.
- dersKartiOgrtGunlukBtnHTML: draggable=false + onmousedown stopPropagation + onclick
  stopPropagation+preventDefault+dersKartiOgrtGunlukAc; yalnız gunlukTablo öğretmen adı
  hücresinde, ogrtGunlukSatirVar > 0 koşuluyla (app.js:3834-3838).
- dersKartiOgrtGunlukAc: satır yok → toast + PNG yok; gunKey yok → PNG yok; WA hedefi
  waAliciBilgisi(ogrtId,"ogretmen"); tel yoksa "Öğretmen telefonu kayıtlı değil; görsel
  indirildi."; canShare→pano→her durumda indir; dosya adı ders-karti-ogretmen-<ad>-<tarih>.png
  (TELEFON YOK). localStorage YAZIMI YOK.
- ÖĞRENCİ YOLU BİREBİR: dersKartiAc 1 tanım, dersKartiGovde id 3 kullanım (öğrenci +
  öğretmen-tek-ders + öğretmen-tam-gün), waAliciBilgisi öğrenci/anne/baba yolları değişmedi.

### Backup'lar (üzerine yazma YOK)
- app.js.ogrt-yatay2-oncesi.bak — 322.104 B, SHA-256 ba1064936d44efa107146052f27635d940f28d37c50b179ea2050ec557ee22b9 (tur başlangıcı; baseline SHA ile birebir)
- app.js.ogrt-yatay-oncesi.bak — 322.104 B, aynı SHA (ilk yama turu başlangıcı)
- ks-ogrt-ders-karti.dikey-oncesi.bak — 17.155 B, SHA-256 ff0db136fb5dfbbfa4eaba1456f395a4cc84762fb524407451e65de7f87910cd (dikey süit öncesi)

### Süit yeniden yazımı (ks-ogrt-ders-karti.mjs, 25.646 B, feca59e2f442332c…)
- 70 vaka (eski 53); yeni sözleşmeye göre: yatay kolon modeli (a-e fixture'ları gerçek
  DB girdisiyle), hücre içerik sözleşmesi, rozet üçlüsü dal kapsamı, buton kalıbı/konumu,
  dosya adı/WA hedefi, veri-değişmezlik + gerçek-dal fixture'ları.
- 3 kırmızı-root-cause düzeltmesi süit tarafında: (1) saat başlığı regex'i tek-boşluk
  "N · HH:MM<" formuna (HTML gerçek üretim), (2)-(3) MATEMATİK yasağı kart segmentiyle
  sınırlı (başlık alt satırı branşı meşru basar) — yasak taraması tüm-HTML'den daraltıldı,
  dal iddiası korundu.

### Kapı güncellemeleri (HAM Σ birebir)
- suit-manifest.mjs 2.609 B 7d4782dd…: ks-ogrt-ders-karti 53→70
- elle-vaka-manifesti.mjs 1.996 B 7d4782dd…: aynı (ikisi bağımsız dosya, aynı sayı)
- elle-vaka-adlari.mjs 117.358 B f278da5e…: 70 ad donduruldu (gerçek koşumdan tek kaynak)
- suit-vakalar/ks-ogrt-ders-karti.mjs.txt 70 satır af11a5ff… (gerçek koşumdan)
- Yeni HAM Σ = 2205 − 53 + 70 = 2222.

### KAPANIŞ (fark sıfır)
- node test.mjs → 2222/2222 OK, 46 süit, 0 kırmızı, exit=0
- HAM Σ: runner=2222 = SUITE_DONE=2222 = donmuş=2222 = ELLE sayı=2222 = ELLE ad=2222 — BİREBİR ✓
- statik-eksiksizlik.mjs → TAMLIK KANITI 46/46 (ks-ogrt-ders-karti site=70 hit=70 vaka=70), exit=0

### Mutasyon/negatif testler (ham çıktı + restore SHA kanıtlı)
- YENİ MUTASYON: app.js "s.ogeler.forEach" → "s.ogeler.slice(0,1).forEach" (ikinci kart
  düşürülüyor) → 2 ✗: "(d) HTML'de 2 × ÇAKIŞMA rozeti" + "(d) HTML'de iki kart aynı hücrede"
  → restore → app.js SHA f85e1585a87f3a9a… geri, süit 70/70 ✓
- ESKİ 1: donmuş listede "BOZULDU" eki → [KAPI HATASI] AD farkı vaka #1 → exit=1 → restore (af11a5ff birebir)
- ESKİ 2: ELLE ad listesinde ilk iki ad takas → [KAPI HATASI] AD farkı vaka #1 → exit=1 → restore (f278da5e birebir)
- ESKİ 3: bayrak çıkarma (d1 L193, ekders L189, etiket L62/L104/L123) → 5 ✗ fixture
  (d1+ekders+etiket × 3) → exit=1 → restore (3e79e7ab / f1a4fd92 / e0c725a8 birebir)
- ESKİ 4: elle sayı 70→71 → [KAPI HATASI] manifest (70) ≠ ELLE manifest (71) → exit=1 → restore (7d4782dd birebir)

### Yedek/araç dosyaları
- yama-ogrt-yatay.mjs (16.300 B, 59c6433c…): sayımlı-ankor + konum-iddialı yama scripti
  (str_replace proje-kök dosyalarını göremediği için CHECKPOINT protokolüyle Node ile).
  Ders: regex-başlık değişimi İLK-geçtiği-yerden yutabilir; tek-eşleşme + bölge-uzunluk
  iddiası zorunlu (bu turda ~44k yutma bu korumayla yakalandı, backup'tan dönüldü).

### SON DURUM
- app.js: 325.710 B, SHA-256 f85e1585a87f3a9a13dd026247a2e7970e05dcdd4f0c41ed3213ff6c37e5f098
- node test.mjs yeşil + Σ birebir; statik-eksiksizlik TAMLIK; 4 eski + 1 yeni mutasyon testi FAIL→restore→yeşil

## DÖNGÜ-12: DÖNGÜ-11 DENETİM AÇIKLARININ KAPATILMASI — TAMAMLANDI (fark sıfır)

### app.js
- **app.js DEĞİŞMEDİ** (salt-okuma turu): 325.710 B, SHA-256 `f85e1585a87f3a9a13dd026247a2e7970e05dcdd4f0c41ed3213ff6c37e5f098`
- Backup: `app.js.dongu12-denetim-oncesi.bak` (325.710 B, SHA `f85e1585…` — birebir aynı)

### Yeni denetim süiti: ks-ogrt-denetim.mjs (42 vaka, HEPSİ gerçek DB girdisi)
- **A) Rozet sözleşmesi** (A1–A6): yalnız görünen satırlar; TAM üç metin. A1 yalnız sınıf dersi→Planlandı · A2 yalnız planlı birebir→Planlandı · A3 yalnız tamamlanmış→Yapıldı · A4 sınıf+tamamlanmış→Kısmen (sınıf dersi planlı sayılır) · A5 planlı+tamamlanmış→Kısmen · A6 sayı eki "(n)" YASAK.
- **B) Buton yerleşimi/tekliği** (B1–B10): ad hücresinde TAM 1 (tek ders / çok ders / sınıf+birebir), satır yoksa 0, ad hücresi DIŞINDA 0 (B7), birebir hücresi segmentinde 0 (B7b), ogretmenTab/ogrenciTab/ek-ders.js'de 0 (B8–B10); draggable=false + stopPropagation + preventDefault kalıbı (B5–B6).
- **C) Gün izolasyonu** (C1–C10): iki günlük gerçek DB fixture (Salı/Çarşamba, benzersiz IZO- işaretleri); seçili gün satırları+başlık GÖRÜNÜR; diğer günün sınıf/öğrenci/konu/gün-adı/tarih HİÇBİRİ sızmaz; mola/ÖĞLE yok; haftalık aralık yok; aynı gün sınıf+birebir korunur. dowIdx gün anahtarı DAVRANIŞSAL kanıtlandı.
- **D) Yazımsızlık** (D1–D8): statik (saveDB/localStorage.setItem akışta yok) + DİNAMİK: gerçek dersKartiOgrtGunlukAc akışı stub'lu html2canvas/navigator ile koşturuldu → setItem=0, removeItem/clear=0, DB byte aynı, localStorage byte aynı, html2canvas=1 + PNG indirildi (ders-karti-ogretmen-…png, telefon yok).
- **E) MATEMATİK kapsam + saat başlığı** (E1–E5): branş BAŞLIKTA meşru (E1); sınıf kartı segmentinde YASAK (E2), birebir kartı segmentinde YASAK (E3); saat başlıkları kart tablosu başlık satırı bağlamında TAM biçim "1 · 08:50"…"11 · 18:00" (11 kolon, E4) ve ÖĞLE yok (E5).

### Mutasyon kanıtları (mutasyon-dongu12.mjs — geçici kopya, restore SHA'lı)
- MUT-A: sınıf kartı segmentine MATEMATİK sızdırıldı → **E2 kırmızı, exit=1** ✓
- MUT-B: PNG tablosu saat başlık üretimi bozuldu ("1 · 08:50"→"1 ·08:51") → **E4 kırmızı, exit=1** ✓ (haftalik izgara L3539'e dokunulmaz; yalnız PNG başlık ankoru L4609)
- MUT-C: ad hücresinde buton 2× çizildi → **B1 kırmızı, exit=1** ✓
- Her mutasyon sonrası restore SHA byte-birebir + normal koşum yeniden yeşil (MUTEXIT=0).

### 4 eski negatif test (yeni süit kapıları üzerinden)
1. Vaka adına BOZULDU eki → vaka-listesi kapısı FAIL (N1_EXIT=1) → restore SHA `8951c0e9…` birebir
2. ELLE ad listesinde A1↔A2 takası → "AD farkı vaka #2" FAIL (N2_EXIT=1) → restore SHA `07e6efe6…` birebir
3. Elle sayı 42→43 → "manifest (42) ≠ ELLE manifest (43)" FAIL (N3_EXIT=1) → restore SHA `da7bdabf…` birebir
4. A1 assertion çıkarılması → "SUITE_DONE UYUŞMAZLIĞI: kosan=41 beklenen=42" FAIL (N4_EXIT=1) → restore SHA `bc3912d7…` birebir

### Kapı dosyası güncellemeleri (yeni toplam YALNIZ gerçek assertion eklemeden doğdu)
- test.mjs: süit listesine `ks-ogrt-denetim.mjs` + özet yazısı 47 süit — SHA `6e523f25…`
- suit-manifest.mjs / elle-vaka-manifesti.mjs: `42` — SHA `017af469…` / `da7bdabf…`
- elle-vaka-adlari.mjs: 42 donmuş ad (ks-kart-sirasi sayım adı da 46→47 doğal koşumdan) — SHA `07e6efe6…`
- suit-vakalar/ks-ogrt-denetim.mjs.txt (42 satır, koşum ✓'lerinden) — SHA `8951c0e9…`; suit-vakalar/ks-kart-sirasi.mjs.txt (→47) — SHA `82a0400a…`
- statik-eksiksizlik.mjs: yeni süit otomatik keşfedildi (site=42 hit=42, SIFIR-HIT YOK, istisna eklenmedi); özet yazısı 47/47 — SHA `8273952f…`
- ks-kart-sirasi.mjs DEĞİŞMEDİ (SHA `766614f0…`); donmuş/ELLE tarafındaki sayım adı doğal koşum artışıyla güncellendi.

### Zorunlu sonuçlar (SON KOŞUM)
- node test.mjs → **2264/2264 OK, 0 kırmızı, exit=0, 47 süit**
- HAM Σ: runner=2264 = SUITE_DONE=2264 = donmuş=2264 = ELLE sayı=2264 = ELLE ad=2264 — **BİREBİR ✓**
- node statik-eksiksizlik.mjs → **TAMLIK 47/47, exit=0** (yeni sıfır-hit YOK)
- node --check app.js · node --check ek-ders.js → OK
- Beş denetim maddesinin HER BİRİ: normal yeşil → mutasyon kırmızı → restore SHA birebir → normal yeniden yeşil.

### Not
- ks-ogrt-ders-karti.mjs (70 vaka) GEVŞETİLMEDİ; bu tur yalnız YENİ denetim süiti ekledi.
- Yedek/geri alma: mutasyonlar yalnız geçici kopyada; kalıcı dosyalarda mutasyon yok.

**Değişikliği görmek için Ctrl+Shift+R / Cmd+Shift+R ile sert yenileme yapın.**

## DÖNGÜ-13: "KOD MU, TEST MU?" AYRIMININ KANITLANMASI — TAMAMLANDI

### Sonuç: "kod zaten uygundu" KANITLANDI — "test koda uyduruldu" DEĞİL
app.js'in DÖNGÜ-11'deki son hali (SHA `f85e1585…`, 325.710 B) beş denetim sözleşmesini
ZATEN KARŞILIYOR; DÖNGÜ-12 süiti yalnız bu davranışı DONMUŞTUR (test-tarafı dosyaları
mutasyonlar sırasında byte-birebir korunmuştur — aşağıda SHA kanıtı).

### 0) Rozet çelişkisinin çözümü
- app.js:4603 (GERÇEK kaynak): `var rozet = !satirlar.length ? "Planlandı" : (tamam === satirlar.length ? "Yapıldı" : (tamam > 0 ? "Kısmen tamamlandı" : "Planlandı"));` — kodda "(n)" üreten satır YOK.
- D11 raporundaki "Planlandı (n) / Yapıldı (n)" ifadesi GEÇMİŞ sözleşmenin ADIYDI (ks-ogrt-ders-karti.mjs:16 + satır 155/210: "ESKİ 'Planlandı (n)' KALDIRILDI"); D11 CHECKPOINT kaydı (2404-2405) sayı-ekisiz üçlüyü doğru yazıyor. Çelişki YOK; A3/A4 zorluyor.
- CANLI KANIT (mutasyon-dongu13.mjs): gerçek DB fixture → gerçek dersKartiOgrtGunlukHTML → rozet HTML'DEN ayrıştırıldı (koddan okunmadı):
  A1 yalnız sınıf dersi → "Planlandı" · A3 yalnız tamamlanmış → "Yapıldı" · A4 sınıf+tamamlanmış → "Kısmen tamamlandı" · A5 planlı+tamamlanmış → "Kısmen tamamlandı".
- MUT-D: rozet üretimine " (n)" eklendi (geçici app.js kopyası) → **A1–A6 HEPSİ kırmızı, exit=1** → A-serisi sayı-eki yasağını GERÇEKTEN ZORLUYOR. Restore SHA birebir.

### 1) Mutasyon kaynağı kanıtı (mutasyon-dongu13.mjs; D13_EXIT=0)
- Değiştirilen dosya: SADECE app.js (geçici kopyadan yazılır, her mutasyon sonrası restore).
- Test tarafı ÖNCE/SONRA SHA-256 birebir (7 dosya): ks-ogrt-denetim.mjs `bc3912d7…` · suit-manifest `017af469…` · elle-vaka-adlari `07e6efe6…` · elle-vaka-manifesti `da7bdabf…` · suit-vakalar/ks-ogrt-denetim.txt `8951c0e9…` · ks-ogrt-ders-karti.mjs `feca59e2…` · suit-vakalar/ks-ogrt-ders-karti.txt `af11a5ff…` → "Test tarafı değişmedi: KANITLANDI".
- Ham kırmızı çıktılar: MUT-A → ✗E2 (exit 1) · MUT-B → ✗E4 (exit 1) · MUT-C → ✗B1+B2+B3 (exit 1) · MUT-D → ✗A1..A6 (exit 1). Her restore: app.js SHA `f85e1585…` BİREBİR.

### 2) Test bağımsızlığı (fit-to-implementation riski)
- Beklenen değerlerin dayanağı: kullanıcı sözleşme satırları (rozet üçlüsü; buton ad-hücresi;
  gün izolasyonu; yazımsızlık; MATEMATİK-sadece-başlık; saat başlığı biçimi) + D11 CHECKPOINT
  kabul metni (2404-2420). Test beklenenleri bu sözleşmeden ELLE yazıldı; app.js string'inden
  kopyalanmadı: rozet metinleri, "Sınıf belirtilmemiş", "Genel tekrar" süitte ELLE yazılı
  (grep: ks-ogrt-denetim.mjs'te bu üçü YOK; yalnız ks-ogrt-ders-karti.mjs'te sözleşme sabiti olarak var).
- Süitte fixture işaretleyicileri (ROZET-9A, BTN-9A, IZO-9A/B, MAT-9A, YAZ-9A, CANLI-SNF)
  TESTE ÖZGÜ benzersiz dizeler — app.js'te geçmez; sızma testleri tek yönlü (davranış → HTML).
- Boolean fixture: t(..., true) = 1 (yalnız "boot hatasız" throw-gate, sayıma girmez); t(..., false) = 0. Sabit-TRUE fixture YOK.

### 3) Kapanış koşumları
- node test.mjs → 2264/2264 OK, 0 kırmızı, exit=0, 47 süit
- HAM Σ: runner=SUITE_DONE=donmuş=ELLE sayı=ELLE ad=2264 BİREBİR
- statik-eksiksizlik.mjs → TAMLIK 47/47, exit=0
- node --check app.js + ek-ders.js → OK
- **app.js DEĞİŞMEDİ**: 325.710 B, SHA-256 `f85e1585a87f3a9a13dd026247a2e7970e05dcdd4f0c41ed3213ff6c37e5f098`

### Yeni dosya
- mutasyon-dongu13.mjs (DÖNGÜ-13 kanıt zinciri; tekrar koşturulabilir: `node mutasyon-dongu13.mjs` → exit 0)

## DÖNGÜ-14: TAUTOLOJİ KALDIRILDI + SÖZLEŞME-METİN MUTASYONLARI — TAMAMLANDI

### 1) Tautoloji kaldırıldı (sabit-true fixture = 0)
- ks-ogrt-denetim.mjs:90'daki tek `t("denetim: boot hatasız", true)` literal-true satırı kaldırıldı.
- YENİ HALİ: `let P, bootHatasi = null;` → catch'te `bootHatasi = e` → assertion `t("denetim: boot hatasız", bootHatasi === null, String(bootHatasi))` GERÇEK koşula bağlandı; boot kırılırsa KIRMIZI (catch process.exit(1) koruması da ayrıca duruyor).
- Tarama sonrası: t(..., true) = 0 · t(..., false) = 0 — DÖNGÜ-5/6 "sabit-true yok" kuralına tam uyum.
- Süit davranışı değişmedi: 42 vaka, SUITE_DONE 42/42; suit-manifest/elle-manifest/elle-adlar/vakalar-txt/statik-tarafta sayı adı DEĞİŞMEDİ (42) → HAM Σ aynı.

### 2) Sözleşme-metin mutasyonları (mutasyon-dongu14.mjs; yalnız app.js geçici kopyası; D14_EXIT=0)
- MUT-D (rozet " (n)" eki) → A1–A6 HEPSİ kırmızı (6/6), exit=1 → yasak metin yakalanıyor.
- MUT-E1 (sayı-ekisiz 'Planlandi' — Türkçe karakter düşürülmüş) → A1–A6 HEPSİ kırmızı, exit=1.
- MUT-E2 (sayı-ekisiz 'Bozuk rozet') → A1–A6 HEPSİ kırmızı, exit=1.
- → MUT-D+E birlikte: testler "ne varsa ona eşit" DEĞİL, sözleşmenin TAM METNİNİ zorluyor.
- MUT-F (durum kaynağı karşit çevrilir: planlı↔tamamlanmış; rozet metni değişse de koku bozulur) → 3 kırmızı: A2, A3, A4 (exit=1) — düşen vakalar TEK TEK kanıtlandı.
- RAPOR NOTU: tek mutasyonun A1–A6'nın tamamını düşürmesi, altı vakanın AYNI rozet alanını (border-radius:99px span'i) okuduğunu gösterir — tek noktadan beslenen altı assert; rozet üretimindeki tek bozulma altısında da yakalanır.
- Her mutasyon sonrası app.js SHA `f85e1585…` BİREBİR restore + normal koşum yeşil.
- Test tarafı 6 dosya (denetim süiti, 2 manifest, elle-adlar, vakalar txt, statik) mutasyon koşumları SIRASINDA önce/sonra SHA birebir: `998ab79d…` · `017af469…` · `da7bdabf…` · `07e6efe6…` · `8951c0e9…` · `8273952f…` → "Test tarafı değişmedi: KANITLANDI" (1. maddedeki süit düzeltmesi mutasyonlardan ÖNCE yapılıp SHA'ları öyle donduruldu).

### 3) Kapanış koşumları
- node test.mjs → 2264/2264 OK, 0 kırmızı, exit=0, 47 süit; HAM Σ = 2264 BİREBİR (elle ayar yok; süit sayısı tautoloji düzeltmesiyle değişmedi)
- statik-eksiksizlik.mjs → TAMLIK 47/47, exit=0
- node --check app.js + ek-ders.js → OK
- **app.js DEĞİŞMEDİ**: 325.710 B, SHA-256 `f85e1585a87f3a9a13dd026247a2e7970e05dcdd4f0c41ed3213ff6c37e5f098`

### Değişen dosyalar (yalnız test tarafı)
- ks-ogrt-denetim.mjs (20006 B, SHA `998ab79d…`): tautoloji kaldırma
- mutasyon-dongu14.mjs (YENİ, SHA `487a9b68…`): MUT-D/E1/E2/F kanıt zinciri — `node mutasyon-dongu14.mjs` → exit 0

---

## DÖNGÜ-15 OLAYI VE TAMAMLANMA KAYDI

### OLAY (dürüst kayıt)
b9d31af9… sürümü raporlandı ancak doğrulanabilir kopyası bulunamadı; mutasyon betiği canonical
app.js'i pre-bento f85e1585… içeriğiyle ezdi. b9d31af9… geri yüklenmiş SAYILMAZ, 2288 koşumu
yeniden üretilememiştir. Uygulama pre-bento durumdadır. Yeniden uygulama tamamlanana kadar
görev DUR.

### Olay sonrası kurtarma araştırması (kanıt)
- Donmuş ağaç: /home/daytona/olay-dongu15-kilit/ (392 dosya, SHA-LISTESI.txt + BYTE-LISTESI.txt, chmod a-w).
- Çelişki çözümü: "iki diff ile üretilebilir" iddiası GEÇERSİZDİ — backup'ta bento markup/rozetRenk yok; yeniden yazım.
- Kurtarma avı: git loose objects (1337 zlib obje, eşleşme yok; pack boş), /tmp + ev (50+ aday, hiçbiri b9d31af9…), editör History/swap (yok), /proc/*/fd (yok) → BULUNAMADI.

### Taban kararı (onaylı)
- app.js tabanı: pre-bento f85e1585… (325.710 B) + MEVCUT bento test tarafı (SHA'ları korundu).
- app.js DÖNGÜ-15 spec'ten yeniden uygulandı: bento tasarım (#f4f6fa zemin, beyaz kart, inline style-only), 3 durumlu rozet (Planlandı/Yapıldı/İptal Edildi + spec renkleri), dersKartiUygun iptal'i dışlamaz, WA iptal filtresi (ogrenciMesajMetni/aktif) aynen korunur, html2canvas bento ayarları + finally cleanup.
- Yeni taban: app.js 328.333 B, SHA-256 8ce8093d71a8b2501386eccf6359b6d1902822740b486483d4f1f45d44bbb7b4.

### Final kapılar (gerçek koşum)
- node test.mjs → 2288/2288 OK, exit=0 · MANIFEST 47 süit birebir eşit · HAM Σ (runner=SUITE_DONE=donmuş=ELLE sayı=ELLE ad=2288) birebir ✓
- node statik-eksiksizlik.mjs → TAMLIK 47/47, exit=0
- node --check app.js OK · node --check ek-ders.js OK

### Mutasyon kanıtları (güvenli betik: SHA-kilitli, restore yalnız tur-başı kopyasından)
- node mutasyon-dongu15.mjs 8ce8093d… → 13 MUTASYON HEPSİ PASS (MUT-G1/G2/G3/G5 + H1..H8/H10).
- MUT-G4 (WA iptal filtresi) kapsam dışı: süit fixture'ı pencere-dışı (hafta/bugün vs 2030-01-07) olduğundan davranışsal kanıt üretemez; statik test satır 131 kaynak-düzeyinde izliyor. Betik içinde gerekçeli.
- Öğretmen kilidi: ks-ogrt-ders-karti + ks-ogrt-denetim exit=0 · 11 donmuş dosya SHA birebir AYNI.

### Sözleşme özeti (DÖNGÜ-15)
- Rozet (öğrenci kartı, tek ders): planlandi/durumsuz → "Planlandı" (#ecfdf5/#047857) · tamamlandi → "Yapıldı" (#eff6ff/#1d4ed8) · iptal → "İptal Edildi" (#fef2f2/#b91c1c); sayı eki YASAK; "Kısmen tamamlandı" YOK.
- İptal ders: görsel kart butonu VAR + PNG üretilebilir; WhatsApp METİN mesajı ÜRETİLMEZ/GÖNDERİLMEZ (filtre korunur).
- Veri: öğrenci/sınıf/ders/konu/öğretmen yalnız DB kaynakları; boş sınıf → "Sınıf belirtilmemiş", boş konu → "Genel tekrar".
- PNG: harici CDN/font/ikon YOK (inline SVG); telefon yoksa html2canvas çağrılmaz; dosya adı sanitizasyonu korundu.
