<!-- Tam geçmiş: CHECKPOINT-ARSIV.md · sıkıştırma: D43 · 2026-09-29 -->
# ✅ SIKIŞTIRMA: D43 — CHECKPOINT.md Kayıpsız Küçültme

**Tarih:** 29 Eylül 2026 · **Durum:** ✅ Tamamlandı — uygulama kodu/test DEĞİŞMEDİ (yalnız CHECKPOINT.md)

> **Tam geçmiş (kayıpsız):** `CHECKPOINT-ARSIV.md` — kaynak CHECKPOINT.md'nin BYTE-BİREBİR kopyası · SHA-256 `fef67637ff3ebfae0c6629cf8865f2cebd98d32d7e5188b9469c22dc1381007a` · 4246 satır / 355.955 byte · not: `CHECKPOINT-ARSIV-NOT.md`.
> **Sıkıştırma:** D43 · 2026-09-29 — KURAL/REHBER blokları + son 5 tur TAM; eski kapanış kayıtları TEK SATIR özet; TÜM eski başlıklar KAPSAM ENVANTERİ'nde.

## Ölçüm
- Eski: **4246 satır / 355.955 byte** → Yeni: **1181 satır / 96044 byte** (≈3.7× küçültme).
- Kapanış kaydı (H1): **61** → 61 özet satırı. Kapsam envanteri: **563** başlık (TAM 70).
- No-drift (değişmedi): `app.js` `231cf09fef286267` · `ek-ders.js` `3d2dd38ff517c64f`.
- Ayrıntılı kapılar: bu turun raporu (Kapı-1..6 YEŞİL). Tam metin: `CHECKPOINT-ARSIV.md`.

## 📌 ROLLING KURAL (D43'ten itibaren kalıcı)

**ROLLING KURAL:** yeni kapanış kaydı → `SON TURLAR (TAM)` bölümünün **BAŞINA** tam metin eklenir; bölümdeki **EN ESKİ** tam kayıt bir satırlık **ÖZET**'e indirilir (→ ayrıntı: `CHECKPOINT-ARSIV.md`). Böylece `CHECKPOINT.md` daima ~<120 KB kalır; TAM geçmiş yalnız `CHECKPOINT-ARSIV.md`'de büyür. Her turda: **+1 tam kayıt · +1 özet satırı · 1 eski tam kayıt → özet.**

---

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
- **📌 HIZ PROTOKOLÜ (kalıcı kural):** kalite kapıları korunur, yalnız koşum SIKLIĞI azalır. Koşum seçici: `node hizli-test.mjs …` — ayrıntı aşağıdaki HIZ PROTOKOLÜ bölümünde.

---

# 📌 HIZ PROTOKOLÜ (kalıcı kural — her turda geçerli)

**Amaç:** Aynı KALİTE kapılarını koruyarak tur başına koşum SIKLIĞINI azaltmak. Hiçbir assertion silinmez/gevşetilmez — yalnız neyin NE ZAMAN koşacağı değişir. Koşum seçici: `node hizli-test.mjs …`.

## A) GELİŞTİRME
- Tam kapı (`node test.mjs` + `node statik-eksiksizlik.mjs`) tur başına **EN ÇOK 1 kez**, kapanışta koşar. Ara adımda YALNIZ etkilenen süit: `node hizli-test.mjs ks-<ad>` (= o süiti + süreyi basar).
- Yama öncesi hedef satırı grep ile oku; uygulanabilirliği tek komutla teyit et. "No changes to existing files" tekrarına GİRME: bir kez dene, olmazsa DUR ve raporla.
- Yedek: tur başına TEK yedek; dosya zaten `.bak`'lıysa yenisini alma.

## B) MUTASYONLAR
- Hedefe göre 2–3 kritik mutasyon (5 zorunlu değil). Her mutasyon YALNIZ etkilenen süiti koşar, tam süiti değil: `node hizli-test.mjs mutasyon <ad>`.
- Rapor 2 satır: "FAIL etti" + "restore SHA birebir". Tam çıktı dökümü yok.

## C) DONMUŞ LİSTELER
- Yalnız gerçekten değişen vaka/süit satırları güncellenir; donmuş beşli (`suit-manifest.mjs`, `elle-vaka-manifesti.mjs`, `elle-vaka-adlari.mjs`, `suit-vakalar/<süit>.txt`) baştan ÜRETİLMEZ. Rapor: "N satır değişti + dosya:satır".

## D) RAPOR FORMATI
- Keşif ve kapanış raporu EN FAZLA 1 ekran: karar listesi + dosya:satır + sayı. Uzun envanter/tablo ve satır-satır döküm YOK.

## E) YAYIN
- Publish tur başına **EN ÇOK 1**. Akış: commit → publish → TEK curl teyidi (SHA + farklılaştırıcı string: `fk-logo` / `Değerli Öğrencimiz`).
- Aynı turda 2. publish YOK; cache şüphesinde ÖNCE `?v=` damgası güncellenir.
- **(f) Vly build zincirinin SON adımı publish-guard olmalı; guard KIRMIZIysa build/deploy DURUR. Guard onarmaz, doğrular. Publish öncesi guard'ı elle koşmak tek başına yeterli kanıt DEĞİLDİR — guard build'in sonunda otomatik koşmalı.**

## F) KALİTE KAPILARI KORUNUR
- Kapanışta: tam test + statik + syntax + no-drift SHA. Hiçbir assertion silinmez/gevşetilmez — yalnız koşum sıklığı azalır.

## G) hizli-test.mjs KOŞUM SEÇİCİSİ
- `node hizli-test.mjs ks-ders-karti` → tek süit + süre (SUITE_DONE kapısı test.mjs ile aynı kural).
- `node hizli-test.mjs mutasyon <ad>` → yalnız ilgili mutasyon script'i (`mutasyon-<ad>.mjs`; `<ad>` süit adı da olabilir).
- `node hizli-test.mjs --tam` → kapanış kapısı: `node test.mjs` + `node statik-eksiksizlik.mjs`.
- Yardımcı test mantığını DEĞİŞTİRMEZ, yalnız koşum seçicisidir.

---

# ⚡ JET MODU (kademeli yayın politikası)

*(Not: bu bölüm dosya SONUNA eklenmek istendi; düzenleyici araç 319 KB dosyanın son bölgesini eşleştiremediği için HIZ PROTOKOLÜ bloğunun hemen ardına alındı — içerik birebir.)*

Değişikliği kademelendir:
   T0 kozmetik (metin/renk/boşluk): yalnız etkilenen süit + node --check;
      tam test ve mutasyon YOK.
   T1 UI davranışı: etkilenen + komşu süitler + statik + syntax + 1 kritik mutasyon.
   T2 iş mantığı: tam test + statik + syntax + 2-3 kritik mutasyon.
   T3 veri/yayın: T2 + build + publish-guard + no-drift SHA + canlı teyit.
   Ortak kural: yedek yalnız değişecek dosya için (yazmadan önce); donmuş liste
   yalnız gerçekten değişen satır için güncellenir; rapor EN FAZLA 1 ekran;
   tur başına EN ÇOK 1 publish. T0/T1'de ara denemelerde tam kapı koşulmaz.

---

# ⚡ JET 2.0 (kurallar)

- Testler ücretsiz (tam paket 15.5 s) → rahatça koştur.
- 5 ayrı düzenleme yerine TEK idempotent yama script'i yaz.
- app.js'i ASLA baştan okuma (376 KB) → yalnız grep + hedefli satır okuma.
- Rapor EN FAZLA 1 ekran; T0/T1 işlerinde keşif raporu YOK.
- Aynı düzenleme 1 kez başarısız olursa DUR ve raporla (tekrar deneme yasak).
- Tur başına EN ÇOK 1 publish; öncesinde publish-guard yeşil olmalı.

---

# ⏱️ SÜRE KARNESİ

Her turun sonunda zorunlu satır:

> ⏱️ Bu tur: X dk · Hedef: <T0/T1/T2/T3/V> → Zamanında/Uzun

Hedef bütçe: T0 ≤5 · T1 ≤12 · T2 ≤25 · T3 ≤40 · Doğrulama ≤2 dk.

---

## ⚡ HIZLI TUR PROTOKOLÜ (her turda OTOMATİK — kullanıcı hatırlatmaz)
Kullanıcı yalnız "Şunu değiştir: <hedef>" yazar. Aşağıdakiler KENDİLİĞİNDEN uygulanır:
1. app.js'i baştan OKUMA; yalnız grep + hedefli satır okuma.
2. Değişikliği TEK idempotent yama script'i ile uygula (ks-yama-*.mjs).
3. Yedek yalnız değişecek dosya için, yazmadan ÖNCE (byte + SHA).
4. Kapı: node hizli-test.mjs --tam → TAM 1 KEZ; çıktı /tmp/tam.txt + tail -n 6.
5. 1 başarısız denemede DUR ve raporla; aynı komutu/düzenlemeyi TEKRARLAMA.
6. Rapor EN FAZLA 1 ekran (yapılan + dosya:satır + kapı sonucu + SHA'lar).
7. Publish YOK; var olmayan süit/dosya adı UYDURMA.
8. Rapor sonu ZORUNLU: "⏱️ Bu tur: X dk · Hedef: Tk → Zamanında/Uzun".
Kademe hedefleri: T0≤5 · T1≤12 · T2≤25 · T3≤40 · doğrulama≤2 dk.
Bu protokol HER turda geçerlidir; kullanıcı ayrıca şablon yapıştırmaz.

---

## 🎨 LOGO KİLİDİ (mutlak kural — her turda geçerli, kullanıcı hatırlatmaz)
Formül Kurs logosu (marka "formul" + turuncu çift çizgi + "kurs merkezi" alt yazı)
ORİJİNALDİR ve ASLA DEĞİŞTİRİLMEZ.
- İZİN VERİLEN TEK ŞEY: uyum sağlamak için ORANTILI ölçekleme (TEK çarpan, TÜM ölçülere uygulanır).
- YASAK: renk, font-weight(900), italik, harf-aralığı oranı, SVG yolu (path), viewBox, stroke-width,
  stroke-linecap, alt yazı metni, hizalama, eleman sırası, "iyileştirme" amaçlı tasarım değişikliği.
- ZORUNLU (master'ın offline birebir karşılığı — kapsam dışı istisna): font-family **'MontsKart'**
  (gömülü, CDN YOK, system fallback YOK) · literal renkler #d31d24 / #f29222 / #1a1a1a ·
  xmlns="http://www.w3.org/2000/svg".
- YÖNTEM: bir çarpan seç, TÜM ölçüleri o çarpanla ölçekle; TEK bir değeri elle değiştirme.
- TEK KAYNAK: `logo-master/formul-kurs-logo.html` (master/orijinal HTML, 8.5rem tabanı). Logo işi
  başlamadan ÖNCE bu dosyaya bak; ölçek gerekiyorsa çarpanı buradan hesapla, karta elle yazma.


---

# 📌 KALICI KURAL (e) — Statik Varlık İçerik Damgası

> (e) Statik varlık URL'leri içerik damgasıyla (?v=<sha16>) sunulur; app.js/ek-ders.js değişince damga güncellenir; publish sonrası canlı SHA teyidi şart.
> Guard YEŞİL olmadan publish YOK (publish-guard build zincirinin SON adımı — HIZ PROTOKOLÜ (f)).
> Publish tur başına EN ÇOK 1; cache şüphesinde ÖNCE ?v= damgası güncellenir. CHECKPOINT canlıya servis edilmez.
> (CANLI-YAYIM KURALI'nın tam metni son 5 tur içindeki DÖNGÜ-36 §7'de TAM korunur.)

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


---

# 📐 AKTİF BASELINE + AÇIK KALEMLER

## Baseline
- Aktif süitler: `suit-manifest.mjs` **55 süit / 2586 beklenen assertion** (`node hizli-test.mjs --tam`).
- Kök varlıklar (tek doğru kaynak): `app.js` · `ek-ders.js` · `index.html` · `vendor/*` (6) · `public/*` · `dist/*` · `isolate/*`.
- No-drift çivili SHA: `app.js` `231cf09fef286267` · `ek-ders.js` `3d2dd38ff517c64f` · damga `app.js?v=231cf09fef286267`.
- Arşivler (codebase DIŞI): `/home/daytona/codebase-arsiv-dongu15-29/` · `/home/daytona/codebase-arsiv-d30-d42/` (92 dosya) · `/home/daytona/tmp-arsiv-d30-d42/` (394 dosya).
- Kalıcı kural blokları bu dosyanın başında: PROJE REHBERİ · HIZ PROTOKOLÜ (A–G) · JET MODU · JET 2.0 · SÜRE KARNESİ · HIZLI TUR PROTOKOLÜ · LOGO KİLİDİ · VERİ ŞEMASI · KALICI KURAL (e).

## Açık kalemler (D41+D42 §11 itibarıyla — güncel)
- **(a)** TOPLU telefon girişi (Excel/paste) — kapsam dışı bırakıldı, **ayrı tur önerisi**.
- **(b)** LOGO ince ayarı — **ASKIDA** (kullanıcı ölçek kararı; LOGO KİLİDİ'ne tabi).
- **(c)** Kart emoji zenginleştirme — **ASKIDA** (kullanıcı isteğiyle).
- **(d)** Repo hijyeni (`.bak` / `ks-yama-d3x` / mutasyon artıkları) + `/tmp` arşivi — ✅ **TAMAMLANDI** (FAZ 2 + #6 /tmp).

---

# 🗂️ KAPANIŞ KAYITLARI — ÖZET (tur başına 1 satır · tam metin: CHECKPOINT-ARSIV.md)

- ✅ TEMİZLİK #6 (FAZ 2 /tmp) — arşiv: `/home/daytona/tmp-arsiv-d30-d42/` · **394 dosya / 18.668.637 B** · MANIFEST-SHA256: `b322b77179abd05fd546ee2dfde63f39f18d8c56baf27dc5287d5f7b715fd40c` · kapsam dışı: **29 çakışan** (21 byte-ayni ∪ 8 codebase-arsiv-adı; 4 KE-38 adı ikisinde ortak → 29) + `daytona-daemon.log` + `vly-stats/*` (açık fd) + node/convex/bunx tooling dir'leri · **silinen = 0** · kapılar (kopya öncesi/sonrası) 4/4 YEŞİL · no-drift: app.js `231cf09fef286267` · damga `app.js?v=231cf09fef286267` · ek-ders.js `3d2dd38ff517c64f`. → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: TEMİZLİK — D30–D42 Artıklarının Güvenli Arşivlenmesi (FAZ 2) · ✅ Tamamlandı — SİLME YOK, doğrulanmış kopya sonrası ta → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ KAPANIŞ KAYDI: D41 + D42 (Telefonsuz Öğrenciler / WA Alıcı) KAPANDI · SHA af149eedb804449c→52aff56fe86068c0 · ✅ Kapandı — kullanıcı publish etti + canlı görsel doğr → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ KAPANIŞ KAYDI: D39 (Grup Üyesi Editöründe Öğrenci Arama) KAPANDI · SHA 9e1f611265dbd1f6→af149eedb804449c · ✅ Kapandı — kullanıcı publish etti + canlı görsel doğr → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ KAPANIŞ KAYDI: D38 (Grup Üyesi Butonu AÇ/KAPA) KAPANDI · SHA dc1a864bb9415aa4→9e1f611265dbd1f6 · ✅ Kapandı — kullanıcı publish etti + canlı görsel doğr → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ KAPANIŞ KAYDI: D36-BOS-AD-KILIT KAPANDI · ✅ Kapandı — publish sonrası canlı görsel doğrulama → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ KAPANIŞ KAYDI: DÖNGÜ-36 + DÖNGÜ-36 KALANI KAPANDI · ✅ Kapandı — kullanıcı görsel doğrulaması + canlı damg → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DÖNGÜ-30-CACHE — app.js/ek-ders.js İçerik Damgası (?v=<sha16>) · ✅ Tamamlandı — yalnız index.html (2 satır) + test pinleri → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ KAPANIŞ KAYDI: DÖNGÜ-30 + DÖNGÜ-30-CACHE KAPANDI · ✅ Kapandı — kullanıcı görsel doğrulaması + canlı teyi → ayrıntı: CHECKPOINT-ARSIV.md
- Checkpoint: Vendor Kütüphane Ayrımı — Çalışan Durum · ✅ Çalışıyor ve doğrulandı. Bu nokta kaydedildi. → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Ana Inline Script → app.js (Tek Doğru Kaynak) · ✅ Tamamlandı, assert'li Node script'i ile doğrulandı → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Kısa Kod Sistemi Çalışan Durum (v2) · Çalışıyor, testleri geçmiş, kaydedildi. → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Dönem Seçici UI — Kalıcı Host + Gerçek DOM Onarımı (DONEM-SECICI-UI-YAMASI) → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Kullanılmayan Dosyaların Temizliği · ✅ Tamamlandı, tüm doğrulamalar geçti → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Grup Dersi — Kaydetme + Çakışma Entegrasyonu · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Grup Paneli v2 — Checkbox Panel + Düzenleme Desteği · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Grup Görünümü — Tablo/Badge + WhatsApp/PNG + Analiz Dağıtımı · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: İstekten Planlamada Grup Seçimi Etkin · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Grup İsteği — Ortak Talep Modeli + Uyumluluk · ✅ Tamamlandı, `node test.mjs` → 201/201 + yeni süit (döne → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Grow-Only Sıra Register'ı + Panel Gövde + Tarih-Bağımsız Render · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Kalıcı Benzersiz ID Altyapısı (KİMLİK-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- Gerçek Öğretmen ve Sınıf Kadrosu (2026-09-13) → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Dönem Modeli — İlk Dilim (2026/2027, Veri-Uyumluluk) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Dönem Damgası — Yeni Ders/İstek Kayıtları Aktif Dönemle Doğuyor (DONEM-DAMGA-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Dönem Seçici + Aktif Döneme Göre Filtreleme — İlk UI Dilimi (DONEM-SECICI-V2) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Excel Uyumlu CSV Dışa/İçe Aktarma (Aktif Dönem) — EXCEL-CSV-YAMASI · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Yönetim'den 2027/2028 Dönemi Oluşturma + Dönemli Sınıf Programı (DONEM-OLUSTURMA-YAMASI) → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Dönem Seçici — Gerçek Tarayıcı DOM Düzeltmesi (DONEM-DOM-DÜZELTMESİ) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Şablon Dönemden Sınıf Programı Kopyalama (SABLON-KOPYA-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: D0 — Render Sahipliği Hardening (Gerçek DOM Regresyon Süiti) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Kadro CSV Dışa Aktarma Sırası — ogretmen → sinif → ogrenci (KADRO-SIRALAMA-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Kapalı Hücre Görünümü — Gri/Soluk + Tıklanabilir (KAPALI-GORUNUM-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Ek Ders Dönem Damgası + İki Yönlü Çakışma (EK-DERS-DONEM-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Ek Ders Görünürlüğü — Günlük Tablo + Öğretmen Haftalık Programı (EK-DERS-GORUNUM-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ⛔ DURDURULDU (FAIL-CLOSED): Pazar Satırı + Birebir Hücresi Görünüm Yaması · ❌ UYGULANMADI — app.js baseline'a geri alındı, değişikli → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Pazar Satırı Normal Gün + Birebir Kartta Tam Ad/Konu/Sınıf (PAZAR-BIREBIR-GORUNUM-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Birebir Hücre Ortak Görünüm — Test Süitleri Hizalama (BIREBIR-GORUNUM-ORTAK-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Sınıf Programı ↔ Öğretmen Haftalık Program Uyumu (SINIF-OGRT-UYUM-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: 10.SINIF Sınıf Programı Grid — Canonical Dönem Onarımı (SINIF-PROG-UYUM-GENISLETME) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Sınıf Programı Grid — DV Etiketi Kaldırıldı, Ders+Öğretmen Adı Gösterimi · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Planlama Ekranı Kart Sırası — planKart üstte, havuzBolum altta (KART-SIRASI-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Plan + İstek Havuzu Kartları — İki Kolon (KART-KOLON-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Branş–Ders Kuralı (BRANS-DERS-KURALI-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Excel/CSV Kartı "NaN" Arızası Düzeltildi (EXCEL-UI-YAMASI) → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: WhatsApp Mesaj Şablonu (WA-SABLON-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: WhatsApp Modal — Ortak Mesaj Önizleme Paneli (WA-ONIZLEME-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ EXCEL-K IMPORT YAMASI — resmi kaynak: program-guncel.xml (kullanıcı seçimi B) → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Stale avail.sinif Temizliği — Opsiyon B (46 Kayıt) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: WhatsApp Öğrenci Mesajı — Yeni Satır Düzeni (WA-DURUM-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Kadro CSV v2 — ad/soyad/telefon Üst Düzey Kolonlar (KADRO-KOLON-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Öğrenci 3 Telefon Alanı + Kadro CSV v3 (TELEFON3-YAMASI) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: Ders Kartı PNG — WhatsApp Görsel Paylaşımı (DERS-KARTI-YAMASI) · ✅ Tamamlandı, test runner →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DÖNGÜ-26 — Grup Birebir Veri Akışı Düzeltmesi · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DÖNGÜ-27 — Grup Üyeleri WhatsApp Akışı Doğrulaması ve Düzeltmesi · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DÖNGÜ-28 — Havuz İki Sütun Zigzag + Günlük "Boş" Öğretmen Satırları · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DÖNGÜ-29 — Çizelgeden Havuza Geri Sürükleme (Onaylı, Tekli + Grup) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DAĞITIM-DÜZELTME — Canlı Site Stilsiz (Assets SPA-Fallback HTML Dönüyordu) · ✅ Tamamlandı — saf deploy düzeltmesi; app.js/index.html/ek → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: TEMİZLİK — Eski .bak ve Mutasyon Dosyalarının Güvenli Arşivlenmesi (dongu15–29) · ✅ Tamamlandı — SİLME YOK, doğrulanmış kopya sonrası ta → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DAĞITIM — public/ Geçişi ve Derleme-Zincir Kanıt Turu · ✅ Tamamlandı — uygulama koduna dokunulmadı; kanıt + taze  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DÖNGÜ-30 — Öğrenci Bento Kart: Logo + Etiket + Not Şeridi · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md
- ✅ CHECKPOINT: DÖNGÜ-30-CACHE — app.js CDN Önbelleğini Aşma (?v= Damgası) · ✅ Tamamlandı, `node test.mjs` →  → ayrıntı: CHECKPOINT-ARSIV.md

---

# 📜 SON 5 TUR — TAM KAYIT (D41+D42 · D39 · D38 · D36-BOS-AD-KILIT · DÖNGÜ-36)

# ✅ KAPANIŞ KAYDI: D41 + D42 (Telefonsuz Öğrenciler / WA Alıcı) KAPANDI

**Tarih:** 29 Eylül 2026 · **Durum:** ✅ Kapandı — kullanıcı publish etti + canlı görsel doğrulama TEMİZ
**Bu turda değişen tek dosya:** `CHECKPOINT.md` (uygulama kodu ve testler DEĞİŞMEDİ).

*(Not: bu kayıt HIZ PROTOKOLÜ / JET 2.0 / LOGO KİLİDİ bloğunun hemen ardına, mevcut kapanış kayıtlarının EN ÜSTÜNE (D39'dan önce), TEK append olarak alındı — içerik birebir.)*

## 1) D41 KEŞİF — telefon alanı ZATEN VAR (yeni UI gerekmedi)
- Öğrenci ekleme: `#o-tel` (`app.js:1755`) · öğrenci düzenleme: `#d-tel` (`app.js:1701`) · anne/baba telefon alanları da mevcut.
- Veri: `DB.ogrenciler[].tel` (`.telefon` DEĞİL); backfill `if (o.tel == null) o.tel = "";` (`app.js:590`); normalizasyon yok (`app.js:587`).
- Tek çözücü: `waAliciBilgisi(ogrenciId, aliciTipi)` (`app.js:4606`) → `ogrenci→o.tel` · `anne→o.anneTel` · `baba→o.babaTel` · `ogretmen→t.tel`; dönüş `{ogrenci, tip, etiket, telefon, varMi}` — **fallback YOK**.
- Gönderim: `waGonder(ogrenciId)` (`app.js:4741`) → `var a = waAliciBilgisi(...); if (!a.varMi) { toast(a.etiket + " telefonu kayitli degil", "uyari"); return; }` — kişi-bazlı, dokunulmadı.
- Sonuç: UI zaten var ⇒ D41 adım (c) (yeni telefon girişi) UYGULANMADI.

## 2) D41 UYGULAMA — ks-yama-d41-telefon.mjs
- Script: `ks-yama-d41-telefon.mjs` (marker **D41-TELEFON**, idempotent; yedek `app.js.d41-telefon-oncesi.bak`).
- TEK satır üreticisi eklendi: `waAliciSatirHTML(s, telVar)` (`app.js:4660`); telefonsuz ⇒ gül kurusu rozet **"Telefon kayıtlı değil"** + `disabled` Gönder butonu (`onclick="waGonder('id')"` korunur, markup `data-wa-satir="<id>"`).
- `waAc` satır döngüsü artık bu üreticiyi çağırır (`app.js:4701`).
- **ADIM 0 (yan iş):** `scripts/copy-static.mjs:29` → `HEDEFLER = ["dist", "public"]` (guard'ın `public/app.js` kontrolü artık yanlış alarm üretmez; 8 varlık × 2 hedef byte-birebir).
- Diğer çağrı yerleri kişi-bazlı: kart butonu (`app.js:1681`) · `waSatir` (`app.js:4782`, `4785`).
- **TOPLU/grup gönderim YOLU YOK** (tüm `waGonder` çağrıları kişi-bazlı).

## 3) D41 SAYILAR / SHA
- Toplam **2573 → 2580** (+7) · `ks-wa-alici.mjs` **49 → 56** (+7, bölüm 13) · süit sayısı **55 (DEĞİŞMEDİ)**.
- `app.js` **`af149eedb804449c` → `52aff56fe86068c0`** (394014 B) · `ek-ders.js` **DEĞİŞMEDİ** (`3d2dd38ff517c64f…`).
- Donmuş beşli (suit-manifest · elle-vaka-manifesti · elle-vaka-adlari · suit-vakalar/ks-wa-alici.mjs.txt · test.mjs suites) ELLE hizalandı.

## 4) D41 TEYİDİ REGRESYON BULDU (kanıt: teyit adımı işe yarıyor)
- Senaryo: **veli telefonu DOLU / öğrenci telefonu BOŞ** · satır durumu SEÇİLİ ALICIYI (`waAliciTipi`) yok sayıyordu (rozet/`disabled` yalnız `!!tel`'e bakıyordu) ve `waAliciDegistir` listeyi tazelemiyordu.
- Sonuç: **alıcı=Anne/Baba iken satır yanlışlıkla `disabled`** ⇒ meşru veli gönderimi engellenirdi (D41 ÖNCESİ çalışıyordu). Ters yön de tutarsızdı.
- **Eksik fixture:** "veli dolu / öğrenci boş" kombinasyonunu hiçbir donmuş vaka kapsamıyordu.

## 5) D42 KEŞİF
- `waAliciDegistir` (`app.js:4614`) yalnız panel + önizlemeyi güncelliyordu; listeyi tazelemiyordu ⇒ **bayat rozet KÖK NEDENİ**.
- `waAc` (`app.js:4701`) satır durumu `!!tel` ⇒ D41 regresyonu.
- **TOPLU gönderim YOK** ⇒ D42 adım 2(c) **N/A** (aşağıdaki dürüst nota bakınız).

## 6) D42 UYGULAMA — ks-yama-d42-wa-alici-tip.mjs
- Script: `ks-yama-d42-wa-alici-tip.mjs` (marker **D42-WA-ALICI-TIP**, idempotent; yedek `app.js.d42-wa-alici-tip-oncesi.bak`).
- `var waSonDizi = []` (`app.js:4677`) — sayaç/seçim korunur.
- `waAliciListeHTML(dizi)` (`app.js:4681`): satır durumu = `waAliciBilgisi(s.id, waAliciTipi).varMi`; dipnot "Seçili alıcı için telefon kaydedilmedi…".
- `waAliciListeTazele()` (`app.js:4695`): **TEK** `innerHTML` + seçici çubuğu yeniden ekleme (modal yeniden AÇILMAZ, çift satır YOK).
- `waAc` bu üreticiden çizer (`app.js:4726`); `waAliciDegistir` artık tazeler (`app.js:4616`).
- **`waAliciTipi` reset YALNIZ** `waAc:4723` (liste çiziminden ÖNCE) + `waKapat:4741`; `waAliciListeTazele` tipi **SIFIRLAMAZ**.

## 7) D42 SAYILAR / SHA
- Toplam **2580 → 2586** (+6) · `ks-wa-alici.mjs` **56 → 62** (+6, bölüm 14) · süit sayısı **55 (DEĞİŞMEDİ)**.
- `app.js` **`52aff56fe86068c0` → `231cf09fef286267`** (395111 B; sha256 `231cf09fef286267f6500de848ae9d000311da4d9ba9bbc4db9e18e3a177ed12`).
- `ek-ders.js` **`3d2dd38ff517c64f…` DEĞİŞMEDİ** · **kök = public = dist = isolate byte-birebir** · damga **`app.js?v=231cf09fef286267`** · **publish-guard YEŞİL**.
- Donmuş beşli ELLE hizalandı (62); D41 "TEK üretici" assertion'ı "D41/D42: satır markup'ı TEK üreticiden (waAliciSatirHTML tanım 1 · tek çağrı waAliciListeHTML içinde)" olarak `offsetDuzelt` ile yeniden adlandırıldı.

## 8) KAPI (tek koşu)
- `node hizli-test.mjs --tam` → **EXIT 0** · **55 süit** · **RUNNER 2586/2586 BİREBİR** · HAM Σ 5'li eşitlik · **TAMLIK 48/48**.
- `node --check app.js` OK · `copy-static` → `publish-guard` YEŞİL · `bun run build` EXIT 0 (guard SON adım, yeşil).

## 9) CANLI DOĞRULAMA
- Kullanıcı publish etti; görsel kontrol **TEMİZ** — alıcı değişimi doğru: veli dolu/öğrenci boş ⇒ alıcı=Anne **ETKİN**, alıcı=Öğrenci **"Telefon kayıtlı değil" + kapalı**; ters yön de doğru; rozet anında güncelleniyor; diğer satırlar etkin ⇒ **KAPANDI**.

## 10) DÜRÜST NOT
- **(a)** D41 ilk turunda seçili-alıcı göz ardı edilerek regresyon üretildi; **teyit yakaladı, D42 onardı** — bu, "teyit adımı gerçekten işe yarıyor" kanıtıdır.
- **(b)** TOPLU gönderim yolu hiç olmadığından "telefonsuzu atla, diğerine devam et" maddesi **N/A**; davranış kişi-bazlı rozet + `disabled` ile karşılanıyor.
- **(c)** Eksik fixture **D42'de eklendi** (veli dolu/öğrenci boş + ters yön).

## 11) AÇIK KALEMLER
- **(a)** TOPLU telefon girişi (Excel/paste) — kapsam dışı bırakıldı, **ayrı tur önerisi**.
- **(b)** LOGO ince ayarı — **ASKIDA** (kullanıcı ölçek kararı bekliyor; LOGO KİLİDİ'ne tabi).
- **(c)** Kart emoji zenginleştirme — **ASKIDA** (kullanıcı isteğiyle).
- **(d)** Repo hijyeni (`.bak` / `ks-yama-d3x` / mutasyon artıkları) + `/tmp` arşivi — **sırada**.

---

# ✅ KAPANIŞ KAYDI: D39 (Grup Üyesi Editöründe Öğrenci Arama) KAPANDI

**Tarih:** 28 Eylül 2026 · **Durum:** ✅ Kapandı — kullanıcı publish etti + canlı görsel doğrulama TEMİZ
**Bu turda değişen tek dosya:** `CHECKPOINT.md` (uygulama kodu ve testler DEĞİŞMEDİ).

*(Not: bu kayıt HIZ PROTOKOLÜ / JET 2.0 / LOGO KİLİDİ bloğunun hemen ardına, mevcut kapanış kayıtlarının EN ÜSTÜNE, TEK append olarak alındı — içerik birebir.)*

## 1) KEŞİF — ui.istekUye* ailesi + checkbox liste konteyner sınırı (yama ÖNCESİ satırlar)
- Buton: `app.js:3066` `istekUyeButonHTML` (D38: `app.js:3069` `uyeAcik` · `app.js:3070` etiket).
- Editör: `app.js:3072` `istekUyeEditorHTML` — `app.js:3073` `if (ui.istekUyeId !== r.id) return '';`
- Satır üreticisi: `app.js:3075-3080` `var satir = DB.ogrenciler.map(...)` (markup `app.js:3077-3079`).
- **LİSTE KONTEYNERİ: `app.js:3083`** `<div class="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-3">' + satir + "</div>`
  — **id/data-* YOK** ⇒ tek başına yeniden çizilebilir DEĞİL (satırlar yalnız burada üretiliyor; her değişim `renderHavuz()`).
- Aç/Kapa: `app.js:3090` `istekUyeAc` (`app.js:3094` toggle kapanış · `app.js:3096` taslak yükleme) ·
  Seçim: `app.js:3099` `istekUyeSec` (`app.js:3104` `renderHavuz()`) · İptal: `app.js:3106` ·
  Kaydet: `app.js:3107-3119` (`app.js:3116` temizlik) · `istekSil`: `app.js:3120-3125`.
- Durum: `ui.istekUyeId` + `ui.istekUyeTaslak` (ui literal `app.js:948-958` içinde ÖN TANIM YOK — tembel alanlar).

## 2) UYGULAMA — ks-yama-d39-uye-arama.mjs
- Marker `D39-UYE-ARAMA`, **7 anchor**, idempotent (2. koşu **exit 2**, dosya değişmez).
- Yeni yardımcılar: `istekUyeAramaNorm(s)` (`app.js:3074`) · `istekUyeListeHTML(rid)` (`app.js:3080`) · `istekUyeAra(v)` (`app.js:3096`).
- Konteyner kimliği: `id="istek-uye-liste"` (**app.js:3111**, tek üretici) · tazeleme `app.js:3098` `getElementById("istek-uye-liste")` ·
  arama input'u `id="istek-uye-arama"` (`app.js:3108`, placeholder "Öğrenci ara…", `oninput="istekUyeAra(this.value)"`).
- FİLTRE: `normalize("NFC").toLocaleLowerCase("tr-TR")` + `includes` (hem SORGUYA hem ADA uygulanır).
- GÖRÜNÜRLÜK: SEÇİLİ üye aramayla eşleşmese de listede **KALIR ve İŞARETLİ kalır**; eşleşmeyen SEÇİLMEMİŞ gizlenir;
  "N üye seçili" sayacı filtreyi YOK SAYAR (seçili toplam); eşleşme yoksa **"Sonuç yok"**; sorgu BOŞKEN liste BİREBİR eski hâl.
- `ui.istekUyeArama` (`app.js:957`): açılışta "", kapanışta/kart değişiminde (`app.js:3122`/`3125`), İptal'de (`app.js:3135`),
  başarılı Kaydet'te (`app.js:3145`), istekSil'de (`app.js:3150`) TEMİZLENİR; filtre değişince taslak **SIFIRLANMAZ**.
- Kaydet/İptal + `grupUyeYaz` + D38 toggle davranışı **DEĞİŞMEDİ**; yeni görsel dil/CDN YOK.

## 3) ODAK KORUMA
- Her tuşta TÜM editör/havuz yeniden çizilmez; **YALNIZ liste konteyneri içeriği** güncellenir → arama input'unun ODAĞI + imleç KORUNUR.
- Kanıt (statik): `istekUyeAra` gövdesinde `renderHavuz()` çağrısı YOK, yalnız `#istek-uye-liste` içeriği yazılır.
- Kanıt (dinamik): tuş sonrası liste DIŞINDAKİ editör DOM'u byte-birebir AYNI kalır (input yeniden ÜRETİLMEZ).

## 4) SAYILAR
- Toplam: **2560 → 2573 (+13)** · süit: **55 SABİT** · `ks-grup-uye-yaz.mjs`: **36 → 49 (+13)**.
- Statik: `site=49 hit=49 vaka=49 koşum=49` · donmuş beşli ELLE hizalandı
  (`suit-manifest.mjs:61` 49 · `elle-vaka-manifesti.mjs:62` 49 · ELLE ad listesi 49 · `suit-vakalar/ks-grup-uye-yaz.mjs.txt` 49 ·
  süit `SUITE_DONE:ks-grup-uye-yaz.mjs:49:49`).

## 5) SHA / DAMGA
- `app.js`: **390372 → 392976 B** · `9e1f611265dbd1f6…` → **`af149eedb804449c…`** (sha16 `af149eedb804449c`).
- Kök = `public/app.js` = `dist/app.js` = `isolate/app.js` — **byte-birebir** (`af149eedb804449c`, 392976 B).
- Damga: `app.js?v=9e1f611265dbd1f6` → **`app.js?v=af149eedb804449c`** (`index.html` + `dist/index.html` + `isolate/index.html`).
- `ek-ders.js 3d2dd38ff517c64f…` **DEĞİŞMEDİ** (30405 B) · `scripts/publish-guard.mjs` → **YEŞİL**.

## 6) KAPI
- `node hizli-test.mjs --tam` (**TAM 1 KEZ**) → **EXIT=0** · `MANIFEST: 55 süit, toplam 2573 beklenen | RUNNER: 2573 koşan, 2573 geçen — BİREBİR EŞİT ✓` ·
  `HAM Σ beşli 2573 — BİREBİR ✓` · `TAMLIK KANITI: 48/48` · `node --check app.js` **OK**.
- `ks-dongu28.mjs` (D28 zikzak + %50'deki TEK ayırıcı çizgi) **yeşil** — arama kutusu yerleşimi bozmadı.

## 7) CANLI DOĞRULAMA
- Kullanıcı **publish etti**; görsel kontrol **TEMİZ**: yazarken odak kaybolmuyor; eşleşmeyen seçili üye görünür + işaretli;
  eşleşmeyen seçilmemiş gizli; sayaç filtreyi yok sayıyor; Kaydet/İptal + D38 toggle normal.
- → **D39 (Grup Üyesi Editöründe Öğrenci Arama) KAPANDI.**

## 8) DÜRÜST NOT
- **(a)** Test HARNESS stub DOM'unda alt konteynere yazılan içerik ana `innerHTML`'e yansımadığı için testler taze içeriği
  **KONTEYNERİN KENDİSİNDEN** okur (`ks-grup-uye-yaz.mjs:280` `konteynerHTML()`); konteyner kimliği gerçek kodla birebir eşleşiyor
  (`app.js:3098` ↔ `app.js:3111`) → **ZAYIFLATMA DEĞİL**; `ks-grup-uye-yaz.mjs:316` "gövdede `renderHavuz` YOK" kanıtı
  odak-koruma yaklaşımını doğrular.
- **(b)** *Kozmetik:* `grep -E 'HAM'` ikinci satır olarak `HAM 'AHMET KIZILIRMAK'` vaka adını da yakalar.
- **(c)** **DRIFT OLAYI:** kapı sonrası taramada `dist/app.js` **0 BAYT** (`e3b0c442…` boş-SHA) bulundu — harici build/kopyalama
  boşaltmış; `node scripts/copy-static.mjs` ile **8/8 byte-birebir** onarıldı, `publish-guard` **YEŞİL**. Uygulama kodu ve kök SHA
  **değişmedi**; canlı etkilenmedi (kullanıcı bu turdan önce publish edip görsel doğruladı) → **publish GEREKMEDİ**.
  **GÜVENLİ SIRA:** `bun run build` → `node scripts/copy-static.mjs` → `node scripts/publish-guard.mjs` → başka build çalıştırmadan publish.

## AÇIK KALEMLER
- **(a)** **LOGO ince ayarı** — **askıda** (kullanıcının ölçek kararını bekliyor; LOGO KİLİDİ kuralı yürürlükte).
- **(b)** **Eski Pazar grup kaydı** kontrolü — **opsiyonel**, yalnız kullanıcı isterse.

## Kapı / No-drift
- No-drift: `app.js af149eedb804449c…` (392976 B) · `index.html` damga `af149eedb804449c` ·
  `ek-ders.js 3d2dd38f…` — **DEĞİŞMEDİ** (bu tur yalnız `CHECKPOINT.md`).
- Commit'i Vly alır · **publish GEREKMEZ** (CHECKPOINT canlıya servis edilmiyor).

---

# ✅ KAPANIŞ KAYDI: D38 (Grup Üyesi Butonu AÇ/KAPA) KAPANDI

**Tarih:** 28 Eylül 2026 · **Durum:** ✅ Kapandı — kullanıcı publish etti + canlı görsel doğrulama TEMİZ
**Bu turda değişen tek dosya:** `CHECKPOINT.md` (uygulama kodu ve testler DEĞİŞMEDİ).

*(Not: bu kayıt HIZ PROTOKOLÜ / JET 2.0 / LOGO KİLİDİ bloğunun hemen ardına, TEK append olarak alındı — içerik birebir.)*

## 1) KEŞİF — istekUyeAc · istekUyeButonHTML · istekUyeEditorHTML · istekUyeTaslak (yama ÖNCESİ satırlar)
- Buton üreticisi: `app.js:3066` `istekUyeButonHTML(r)` → `app.js:3068` TEK return; metin **SABİT**
  `"Grup üyelerini ekle/çıkar (N)"`, `onclick="istekUyeAc('<id>')"`.
- Editör üreticisi: `app.js:3070` `istekUyeEditorHTML(r)` → `app.js:3071` `if (ui.istekUyeId !== r.id) return '';`
  (açık/kapalı YALNIZ bu tek alandan okunuyor).
- Editör durumu: `ui.istekUyeId` (açık kartın id'si) + `ui.istekUyeTaslak` (taslak üyeler).
  Aç: `app.js:3088` `istekUyeAc` → `app.js:3091` `ui.istekUyeId = id` · `app.js:3092` `ui.istekUyeTaslak = istekOgrenciIds(r).slice()`.
  Kapa: `app.js:3102` `istekUyeIptal` · `app.js:3112` `istekUyeKaydet` · `app.js:3117` `istekSil`.
  Taslak tüketicileri: `app.js:3072` (editör) · `app.js:3096-3099` `istekUyeSec` · `app.js:3107` (Kaydet).
- **KÖK NEDEN:** `istekUyeAc` KOŞULSUZ `ui.istekUyeId = id` yazıp taslağı yeniden yüklüyordu → aynı butona
  2. tıklama editörü KAPATMIYOR (açık kalıyor) ve checkbox'taki değişiklikleri SESSİZCE SIFIRLIYORDU;
  "Kapat" durumu hiç YOKTU.

## 2) UYGULAMA — ks-yama-d38-uye-buton-toggle.mjs
- Marker `D38-UYE-BUTON-TOGGLE`, **3 anchor**, idempotent (2. koşu **exit 2**, dosya değişmez).
- (A) `istekUyeButonHTML`: `var uyeAcik = ui.istekUyeId === r.id` bayrağı (yama sonrası `app.js:3069`).
- (B) Etiket/renk: **açıkken metin "Kapat"** + vurgu (`text-teal-600`); kapalıyken eski metin
  `"Grup üyelerini ekle/çıkar (N)"` + `text-slate-400` (yama sonrası `app.js:3070`).
- (C) `istekUyeAc`: `ui.istekUyeId === id` ise **KAPAT** (`id=null`, taslak `[]`) → aynı buton gerçek toggle;
  aksi hâlde hedef yazılır → **başka kartın butonu öncekini kapatır, yenisini açar (TEK açık editör)**.
- Yedek: `app.js.d38-uye-buton-toggle-oncesi.bak` (yedekten ÖNCE byte+SHA raporlandı, yedek birebir doğrulandı).
- **DOKUNULMADI:** `istekUyeSec` / `istekUyeKaydet` / `İptal` · `grupUyeYaz` · D28 zikzak + %50'deki TEK ayırıcı çizgi ·
  D37 kart-altı yerleşim · kart içi tipografi/chip · checkbox listesi · drag/drop · D29 · D35/D36 · WA/PNG.

## 3) SAYILAR
- Toplam: **2555 → 2560 (+5)** · süit: **55 SABİT** · `ks-grup-uye-yaz.mjs`: **31 → 36 (+5)**.
- 5 yeni assertion (sıra korunur, ELLE yazıldı): açıkken "Kapat" metni · aynı butona 2. tıklama kapatır ·
  kapalıyken eski metin + sayaç · başka kart → önceki kapanır/hedef açılır · DOM'da TEK editör paneli + TEK "Kapat".
- Statik: `site=36 hit=36 vaka=36 koşum=36` · donmuş beşli ELLE güncellendi
  (`suit-manifest.mjs:61` 36 · `elle-vaka-manifesti.mjs:62` 36 · ELLE ad listesi 36 · `suit-vakalar/ks-grup-uye-yaz.mjs.txt` 36 ·
  süit `SUITE_DONE:ks-grup-uye-yaz.mjs:36:36`).

## 4) SHA / DAMGA
- `app.js`: **389816 → 390372 B** · `dc1a864bb9415aa4…` → **`9e1f611265dbd1f6…`** (sha16 `9e1f611265dbd1f6`).
- Kök = `public/app.js` = `dist/app.js` = `isolate/app.js` — **byte-birebir** (`9e1f611265dbd1f6`, 390372 B).
- Damga: `index.html` / `dist/index.html` / `isolate/index.html` → `app.js?v=dc1a864bb9415aa4` → **`app.js?v=9e1f611265dbd1f6`**.
- `ek-ders.js 3d2dd38ff517c64f…` **DEĞİŞMEDİ** (30405 B; kök = public = dist birebir).
- `scripts/publish-guard.mjs` → **YEŞİL** (dist+public kökle birebir; index.html damgaları = SHA16).

## 5) KAPI
- `node hizli-test.mjs --tam` → **EXIT=0** · `MANIFEST: 55 süit, toplam 2560 beklenen | RUNNER: 2560 koşan, 2560 geçen — BİREBİR EŞİT ✓` ·
  `HAM Σ beşli 2560 — BİREBİR ✓` · `TAMLIK KANITI: 48/48` · `node --check app.js` **OK**.
- `ks-dongu28.mjs` (D28 zikzak + TEK ayırıcı çizgi yerleşimi) **yeşil** — toggle yerleşime dokunmadı.

## 6) CANLI DOĞRULAMA
- Kullanıcı **publish etti**; görsel kontrol **TEMİZ**: buton aç/kapa çalışıyor, açıkken metin **"Kapat"**,
  aynı anda **TEK açık editör** (başka kartın butonu öncekini kapatıyor).
- D28 zikzak + %50'deki TEK ayırıcı çizgi ve D37 kart-altı yerleşim **korundu**.
- → **D38 (Grup Üyesi Butonu AÇ/KAPA) KAPANDI.**

## 7) DÜRÜST NOT
- **(a)** Toggle turunda `--tam` **1 kez** koşuldu (kurala uygun).
- **(b)** `--tam` **dayanıklılık turunda "TAM 1 KEZ" kuralı AŞILDI**: yeni çıktı biçimi (akış + `/tmp/tam.txt` + özet)
  doğrulanırken tam kapı birden fazla kez (≈3 × ~31 s) koşuldu. O tur bir kapanış kaydıyla belgelenmemişti → **burada kayda geçiyor**.
- **(c)** *Kozmetik:* `RUNNER` satırı `MANIFEST` ile **AYNI satırda** olduğu için `^RUNNER` grep'i boş döner;
  kanıt `MANIFEST: … | RUNNER: …` satırındadır.

## AÇIK KALEMLER
- **(a)** Editöre **öğrenci arama kutusu** — **opsiyonel**; yalnız liste 20+ olunca gerekir (şu an YOK).
- **(b)** **LOGO ince ayarı** — **askıda** (LOGO KİLİDİ kuralı yürürlükte).
- **(c)** **Eski Pazar grup kaydı** kontrolü — **opsiyonel**, yalnız kullanıcı isterse.

## Kapı / No-drift
- No-drift: `app.js 9e1f611265dbd1f6…` (390372 B) · `index.html` damga `9e1f611265dbd1f6` ·
  `ek-ders.js 3d2dd38f…` — **DEĞİŞMEDİ** (bu tur yalnız `CHECKPOINT.md`).
- Commit'i Vly alır · **publish GEREKMEZ** (CHECKPOINT canlıya servis edilmiyor).

---

# ✅ KAPANIŞ KAYDI: D36-BOS-AD-KILIT KAPANDI

**Tarih:** 28 Eylül 2026 · **Durum:** ✅ Kapandı — publish sonrası canlı görsel doğrulama
**Bu turda değişen tek dosya:** `CHECKPOINT.md` (uygulama kodu ve testler DEĞİŞMEDİ).

*(Not: bu kayıt HIZ PROTOKOLÜ / JET 2.0 / LOGO KİLİDİ bloğunun hemen ardına, TEK append olarak alındı — içerik birebir.)*

## 1) KEŞİF — "ad dolu mu" ≠ "anahtar var mı"
- HAFTALIK: `app.js:3826` `sinifVar = avail.sinif && key in avail.sinif` DOĞRUYDU (anahtar var) ama
  `app.js:3832` `sinifChipHTML(avail.sinif[key])` KOŞULSUZ çağrılıyordu → ad boşsa **uydurma "Sınıf"** etiketi.
- GÜNLÜK ANA SATIR: `app.js:4245` koşul `ogrtAvail.avail.sinif[dowIdx28 + "-" + slot.no]` (**değer truthy**) idi →
  ad boşsa dal HİÇ çalışmıyor, hücre `app.js:4253` MEVCUT `dnd-bos` "+" drop-zone olarak kalıyordu.
- GÜNLÜK "Boş" satırı `app.js:4283` (`kilitli28` zaten `key28 in t.avail.sinif`) → **DOKUNULMADI**.

## 2) UYGULAMA — ks-yama-d36-bos-ad-kilit.mjs
- Marker `D36-BOS-AD-KILIT`, 2 anchor, idempotent (2. koşu **exit 2**, dosya değişmez).
- Kilit artık **"anahtar VAR"** tabanlı: haftalık `dnd-kilit` + chip YALNIZ ad DOLUYSA;
  günlük ANA satır `((dowIdx28 + "-" + slot.no) in ogrtAvail.avail.sinif)` → KİLİTLİ, drop-zone AÇILMAZ.
- Chip YALNIZ ad DOLUYSA çizilir. **Yeni üretici/string inşası YOK** (aynı `sinifChipHTML`).
- Yedek: `app.js.d36-bos-ad-kilit-oncesi.bak` (yedekten ÖNCE byte+SHA raporlandı, yedek birebir doğrulandı).

## 3) SAYILAR
- Toplam: **2548 → 2549 (+1)** · süit: **55 SABİT** · `ks-gunluk-ders-tasi.mjs`: **120 → 121**
  (1 ad güncellendi: günlük boş ad → KİLİTLİ; 1 yeni: haftalık boş ad → kilitli + adlı slot DEĞİŞMEDİ).

## 4) SHA / DAMGA
- `app.js`: **388693 → 389132 B** · `aa94ed0b…` → `feecb17b…`
  (tam: `feecb17b82d067c223620e155a0d94d5dfc9d311bff013b4713368cd7c24792e`; sha16 `feecb17b82d067c2`).
- `index.html` damga: `app.js?v=aa94ed0b2b722628` → `app.js?v=feecb17b82d067c2`.
- `ek-ders.js 3d2dd38f…` **DEĞİŞMEDİ** (`3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f`, 30405 B).
- Kök→public/dist senkron + `scripts/publish-guard.mjs` **YEŞİL**.

## 5) KAPI
- `node hizli-test.mjs --tam` → **EXIT=0** · `MANIFEST: 55 süit, toplam 2549 beklenen | RUNNER: 2549 koşan, 2549 geçen — BİREBİR EŞİT ✓` · `HAM Σ beşli 2549 — BİREBİR ✓` · `TAMLIK KANITI: 48/48` · `node --check app.js` **OK**.

## 6) DÜRÜST NOT-1 — haftalık çıktı bilinçli DEĞİŞTİ
- Haftalık çizelgede "sınıf kaydı VAR + ad BOŞ" durumu ESKİDEN uydurma **"Sınıf"** etiketi basıyordu;
  YENİ: hücre **chip'siz + kilitli**. Bu, "uydurma etiket basma" kuralıyla UYUMLUDUR (gevşetme değil, sıkılaştırma).
- Ad DOLU slotlarda chip **birebir aynı** kaldı (aynı üretici + aynı markup).

## 7) DÜRÜST NOT-2 — sapma kaydı (HIZLI TUR "TAM 1 KEZ")
- `--tam` **1. koşuda DÜŞTÜ**: `ks-ekders-ozet-csv.mjs` "haftalikOgrtTablo diff'i yalnız PAZAR-BIREBIR işaretli bölgede"
  (yeni yasal bölge beyaz listede yoktu) → `[KAPI HATASI] SUITE_DONE marker'ı YOK`.
- Düzeltilip **2. kez** koşuldu → yeşil. Bu, HIZLI TUR "TAM 1 KEZ" kuralından **SAPMA**dır; dürüstçe kayda geçti.

## 8) BEYAZ LİSTE KANITI — test GEVŞETİLMEDİ
- `ks-ekders-ozet-csv.mjs:170` `KELIMELER`: **32 → 33 bölge**; eklenen YALNIZ `"D36-BOS-AD-KILIT"`
  (diğer 32 bölge adı/sırası DEĞİŞMEDİ).
- **MUTASYON:** `haftalikOgrtTablo` içine ilgisiz satır eklendi → süit **exit 1 / BAŞARISIZ** (tek kırmızı)
  → beyaz liste hâlâ DİŞLİ; restore sonrası canonical `feecb17b…` **birebir**. → gevşetme YOK.

## 9) CANLI DOĞRULAMA
- Kullanıcı **publish etti**; canlı damga **`app.js?v=feecb17b82d067c2`**.
- Günlük + haftalık görsel kontrol **TEMİZ**: adlı sınıf slotları pembe chip + gerçek sınıf adı;
  adsız (boş adlı) kayıtlı slot **chip'siz + "+"sız KİLİTLİ**.
- → **D36-BOS-AD-KILIT KAPANDI.**

## AÇIK KALEMLER
- **(a)** LOGO ince ayarı — **askıda**; kullanıcının ölçek kararını bekliyor (LOGO KİLİDİ kuralı yürürlükte).
- **(b)** Eski Pazar grup kaydı kontrolü — **opsiyonel**, yalnız kullanıcı isterse.

## Kapı / No-drift
- No-drift: `app.js feecb17b82d067c2…` · `index.html` damga `feecb17b82d067c2` · `ek-ders.js 3d2dd38f…` — **DEĞİŞMEDİ** (bu tur yalnız `CHECKPOINT.md`).
- Commit'i Vly alır · **publish GEREKMEZ** (CHECKPOINT canlıya servis edilmiyor).

---

# ✅ KAPANIŞ KAYDI: DÖNGÜ-36 + DÖNGÜ-36 KALANI KAPANDI

**Tarih:** 28 Eylül 2026 · **Durum:** ✅ Kapandı — kullanıcı görsel doğrulaması + canlı damga teyidi
**Bu turda değişen tek dosya:** `CHECKPOINT.md` (uygulama kodu ve testler DEĞİŞMEDİ).

*(Not: bu kayıt HIZ PROTOKOLÜ / JET 2.0 bloğunun hemen ardına, TEK append olarak alındı — içerik birebir.)*

## 1) D36 ilk tur — günlük kilitli satırdaki literal "Sınıf" → gerçek sınıf chip'i
- Tek üretici: `function sinifChipHTML(sinifAd)` (`app.js:3747`) — TEK markup literali
  (`bg-rose-100 border border-rose-200`) + `esc((sinifAd || "Sınıf").substring(0,14))`;
  `"Sınıf"` yer tutucusu YALNIZ haftalık davranışı korur.
- Çağrı yerleri: haftalık `app.js:3832` (`sinifChipHTML(avail.sinif[key])`) · günlük "Boş" satırı `app.js:4282` (`sinifChipHTML(snf28)`).
- Kaynakta `sinifChipHTML(` = 1 tanım + 3 çağrı (haftalık + günlük Boş + günlük ANA); chip markup literali = 1 (tek üretici kanıtı).
- Yama: `ks-yama-gunluk-sinif-chip.mjs` (marker `GUNLUK-SINIF-CHIP`; yedek `app.js.gunluk-sinif-chip-oncesi.bak` 386299 B `ed0cc06c…`).

## 2) D36 kalanı — günlük ANA satır sınıf-dersi slotu
- Günlük ANA satır sınıf-dersi slotu `dnd-bos` (drop-zone) dalından ÇIKARILDI.
- `app.js:4246-4250`: `avail.sinif` dolu ise hücre KİLİTLİ `td` + AYNI chip
  (`sinifChipHTML(ogrtAvail.avail.sinif[dowIdx28 + "-" + slot.no])`).
- Veri alanı haftalık/"Boş" ile AYNI: `ogrtAvail` (`app.js:4203`, `ogrtId ? DB.ogretmenler.find(x => x.id === ogrtId) : null`); `dowIdx28 = dowIdx(gunKey)` (`app.js:4152`).
- Kilit ÖNCEDEN vardı: `istekBurak` (`app.js:3892` / kilit `:3910`) ve `dersBurak` (`app.js:4018` / kilit `:4053`) — ikisi de `(t.avail.sinif && key in t.avail.sinif)` içerir.
- Yama: `ks-yama-d36-ana-satir.mjs` (marker `D36-ANA-SATIR`, 2 çapa, `index.html` damgasını yeniden yazar — idempotent, 2. koşu exit 2).
- Yedek: `app.js.d36-ana-satir-oncesi.bak` (387594 B, `02a81143…`).

## 3) Sayı zinciri
- Toplam assertion: **2536 → 2542 (+6) → 2548 (+6)**.
- Süit: **55 SABİT** (değişmedi).
- `ks-dongu28.mjs`: **20 → 26** · `ks-gunluk-ders-tasi.mjs`: **114 → 120**.

## 4) SHA zinciri (no-drift)
- `app.js`: **386299 → 387594 → 388693 B** · `ed0cc06c…` → `02a81143…` → `aa94ed0b…`
  (tam: `aa94ed0b2b7226287742431b5bddc451ce9c5f82c8d3d2b420ffeff5153b2ad5`).
- `index.html` damga: `app.js?v=aa94ed0b2b722628` (+ `ek-ders.js?v=3d2dd38ff517c64f`); `ks-index-kimlik.mjs` / `ks-kart-kolon.mjs:246-258` bunu DİNAMİK doğrular (ada gömülü elle SHA pin YOK).
- `ek-ders.js 3d2dd38f…` **DEĞİŞMEDİ** (`3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f`, 30405 B).

## 5) GÖRSEL DOĞRULAMA (kullanıcı onayı)
- Günlük **PAZARTESİ** çizelgesinde sınıf-dersi slotları pembe chip + GERÇEK sınıf adı:
  **12.DİL · MEZUN SAY 1 · 11 EA 1 · MEZUN EA 1 · 12 SAY 2** — haftalıkla TUTARLI.
- Grup dersinde iki üye KENDİ satırında ad+sınıf: **ŞAHİN DOĞANAY slot 8 → "Emir Aydın MEZUN SAY 1" + "Yusuf Can MEZUN SAY 2"**.
- → **D36 + grup üyesi görünümü KAPANDI.**

## 6) DÜRÜST NOT
- Sınıf kaydı VAR ama **adı BOŞ** olan slotta hücre hâlâ "+" drop-zone görünüyor — **YALNIZ görsel**.
- `istekBurak` / `dersBurak` kilidi (`key in avail.sinif`) drop'u REDDETTİĞİ için **veri bozulmuyor**.
- Bu durum sonraki tura AÇIK KALEM olarak kaydedildi (aşağıda).

## 7) CANLI-YAYIM KURALI
- Kullanıcı **publish etti**; canlı damga `app.js?v=aa94ed0b2b722628`.
- Bu tur YALNIZ `CHECKPOINT.md` değiştiği için **publish GEREKMEZ** (CHECKPOINT canlıya servis edilmiyor).
- **D36 teyidi:** publish sonrası canlıda görsel doğrulama yapıldı (canlı damga `feecb17b82d067c2`) — KAPANDI.

## AÇIK KALEMLER
- **(a)** Boş adlı sınıf kaydı slotu görsel sertleştirmesi — `key in avail.sinif` VARSA hücreyi kilitle (drop-zone gösterme). *Görsel; veri zaten güvenli.*
- **(b)** LOGO ince ayarı — **askıda** (LOGO KİLİDİ kuralı yürürlükte).
- **(c)** Eski Pazar grup kaydı kontrolü — **opsiyonel**, yalnız kullanıcı isterse.

## Kapı / No-drift
- `node hizli-test.mjs --tam` → **exit 0** · `MANIFEST: 55 süit, toplam 2548 beklenen | RUNNER: 2548 koşan, 2548 geçen — BİREBİR EŞİT ✓` · `TAMLIK KANITI: 48/48`.
- No-drift: `app.js aa94ed0b2b722628…` · `index.html` · `ek-ders.js 3d2dd38f…` — **DEĞİŞMEDİ**.
- Bu turda (kapanış kaydı) değişen dosya: **yalnız `CHECKPOINT.md`**. Commit'i Vly alır; **publish YOK**.

---


---

# 🧾 KAPSAM ENVANTERİ — TÜM ESKİ BAŞLIKLAR (D43 sıkıştırma kanıtı)

> Her eski başlık TAM | özet | ACIKCA-KAPSAM-DISI olarak en az 1 kez geçer. TAM = yeni dosyada birebir; diğerleri arşivde (CHECKPOINT-ARSIV.md).

L1 | # PROJE REHBERİ — önce burayı oku | TAM
L19 | # 📌 HIZ PROTOKOLÜ (kalıcı kural — her turda geçerli) | TAM
L23 | ## A) GELİŞTİRME | TAM
L28 | ## B) MUTASYONLAR | TAM
L32 | ## C) DONMUŞ LİSTELER | TAM
L35 | ## D) RAPOR FORMATI | TAM
L38 | ## E) YAYIN | TAM
L43 | ## F) KALİTE KAPILARI KORUNUR | TAM
L46 | ## G) hizli-test.mjs KOŞUM SEÇİCİSİ | TAM
L54 | # ⚡ JET MODU (kademeli yayın politikası) | TAM
L70 | # ⚡ JET 2.0 (kurallar) | TAM
L81 | # ⏱️ SÜRE KARNESİ | TAM
L91 | ## ⚡ HIZLI TUR PROTOKOLÜ (her turda OTOMATİK — kullanıcı hatırlatmaz) | TAM
L106 | ## 🎨 LOGO KİLİDİ (mutlak kural — her turda geçerli, kullanıcı hatırlatmaz) | TAM
L119 | # ✅ TEMİZLİK #6 (FAZ 2 /tmp) — arşiv: `/home/daytona/tmp-arsiv-d30-d42/` · **394 dosya / 18.668.637 B** · MANIFEST-SHA256: `b322b77179abd05fd546ee2dfde63f39f18d8c56baf27dc5287d5f7b715fd40c` · kapsam dışı: **29 çakışan** (21 byte-ayni ∪ 8 codebase-arsiv-adı; 4 KE-38 adı ikisinde ortak → 29) + `daytona-daemon.log` + `vly-stats/*` (açık fd) + node/convex/bunx tooling dir'leri · **silinen = 0** · kapılar (kopya öncesi/sonrası) 4/4 YEŞİL · no-drift: app.js `231cf09fef286267` · damga `app.js?v=231cf09fef286267` · ek-ders.js `3d2dd38ff517c64f`. | ACIKCA-KAPSAM-DISI
L121 | # ✅ CHECKPOINT: TEMİZLİK — D30–D42 Artıklarının Güvenli Arşivlenmesi (FAZ 2) | ACIKCA-KAPSAM-DISI
L127 | ## Ne yapıldı | ACIKCA-KAPSAM-DISI
L132 | ## KE — codebase'de KALAN aile (dokunulmadı) | ACIKCA-KAPSAM-DISI
L135 | ## Kapılar — taşıma ÖNCESİ (genişletilmiş liste 93→92 aday) | ACIKCA-KAPSAM-DISI
L142 | ## Kapılar — taşıma SONRASI (hepsi YEŞİL) | ACIKCA-KAPSAM-DISI
L148 | ## Dürüst notlar | ACIKCA-KAPSAM-DISI
L153 | ## Kalan Risk / Sonraki adım | ACIKCA-KAPSAM-DISI
L159 | # ✅ KAPANIŞ KAYDI: D41 + D42 (Telefonsuz Öğrenciler / WA Alıcı) KAPANDI | TAM
L166 | ## 1) D41 KEŞİF — telefon alanı ZATEN VAR (yeni UI gerekmedi) | TAM
L173 | ## 2) D41 UYGULAMA — ks-yama-d41-telefon.mjs | TAM
L181 | ## 3) D41 SAYILAR / SHA | TAM
L186 | ## 4) D41 TEYİDİ REGRESYON BULDU (kanıt: teyit adımı işe yarıyor) | TAM
L191 | ## 5) D42 KEŞİF | TAM
L196 | ## 6) D42 UYGULAMA — ks-yama-d42-wa-alici-tip.mjs | TAM
L204 | ## 7) D42 SAYILAR / SHA | TAM
L210 | ## 8) KAPI (tek koşu) | TAM
L214 | ## 9) CANLI DOĞRULAMA | TAM
L217 | ## 10) DÜRÜST NOT | TAM
L222 | ## 11) AÇIK KALEMLER | TAM
L230 | # ✅ KAPANIŞ KAYDI: D39 (Grup Üyesi Editöründe Öğrenci Arama) KAPANDI | TAM
L237 | ## 1) KEŞİF — ui.istekUye* ailesi + checkbox liste konteyner sınırı (yama ÖNCESİ satırlar) | TAM
L248 | ## 2) UYGULAMA — ks-yama-d39-uye-arama.mjs | TAM
L260 | ## 3) ODAK KORUMA | TAM
L265 | ## 4) SAYILAR | TAM
L271 | ## 5) SHA / DAMGA | TAM
L277 | ## 6) KAPI | TAM
L282 | ## 7) CANLI DOĞRULAMA | TAM
L287 | ## 8) DÜRÜST NOT | TAM
L298 | ## AÇIK KALEMLER | TAM
L302 | ## Kapı / No-drift | TAM
L309 | # ✅ KAPANIŞ KAYDI: D38 (Grup Üyesi Butonu AÇ/KAPA) KAPANDI | TAM
L316 | ## 1) KEŞİF — istekUyeAc · istekUyeButonHTML · istekUyeEditorHTML · istekUyeTaslak (yama ÖNCESİ satırlar) | TAM
L329 | ## 2) UYGULAMA — ks-yama-d38-uye-buton-toggle.mjs | TAM
L340 | ## 3) SAYILAR | TAM
L348 | ## 4) SHA / DAMGA | TAM
L355 | ## 5) KAPI | TAM
L360 | ## 6) CANLI DOĞRULAMA | TAM
L366 | ## 7) DÜRÜST NOT | TAM
L373 | ## AÇIK KALEMLER | TAM
L378 | ## Kapı / No-drift | TAM
L385 | # ✅ KAPANIŞ KAYDI: D36-BOS-AD-KILIT KAPANDI | TAM
L392 | ## 1) KEŞİF — "ad dolu mu" ≠ "anahtar var mı" | TAM
L399 | ## 2) UYGULAMA — ks-yama-d36-bos-ad-kilit.mjs | TAM
L406 | ## 3) SAYILAR | TAM
L410 | ## 4) SHA / DAMGA | TAM
L417 | ## 5) KAPI | TAM
L420 | ## 6) DÜRÜST NOT-1 — haftalık çıktı bilinçli DEĞİŞTİ | TAM
L425 | ## 7) DÜRÜST NOT-2 — sapma kaydı (HIZLI TUR "TAM 1 KEZ") | TAM
L430 | ## 8) BEYAZ LİSTE KANITI — test GEVŞETİLMEDİ | TAM
L436 | ## 9) CANLI DOĞRULAMA | TAM
L442 | ## AÇIK KALEMLER | TAM
L446 | ## Kapı / No-drift | TAM
L452 | # ✅ KAPANIŞ KAYDI: DÖNGÜ-36 + DÖNGÜ-36 KALANI KAPANDI | TAM
L459 | ## 1) D36 ilk tur — günlük kilitli satırdaki literal "Sınıf" → gerçek sınıf chip'i | TAM
L467 | ## 2) D36 kalanı — günlük ANA satır sınıf-dersi slotu | TAM
L476 | ## 3) Sayı zinciri | TAM
L481 | ## 4) SHA zinciri (no-drift) | TAM
L487 | ## 5) GÖRSEL DOĞRULAMA (kullanıcı onayı) | TAM
L493 | ## 6) DÜRÜST NOT | TAM
L498 | ## 7) CANLI-YAYIM KURALI | TAM
L503 | ## AÇIK KALEMLER | TAM
L508 | ## Kapı / No-drift | TAM
L515 | # ✅ CHECKPOINT: DÖNGÜ-30-CACHE — app.js/ek-ders.js İçerik Damgası (?v=<sha16>) | ACIKCA-KAPSAM-DISI
L521 | ## Yapılan İş | ACIKCA-KAPSAM-DISI
L526 | ## Build kanıtı | ACIKCA-KAPSAM-DISI
L529 | ## Donmuş pin güncellemesi (elle, old→new) | ACIKCA-KAPSAM-DISI
L534 | ## Yeni assertion (kendini doğrular) | ACIKCA-KAPSAM-DISI
L537 | ## Mutasyonlar (tmp kopya, yalnız ks-kart-kolon) | ACIKCA-KAPSAM-DISI
L540 | ## Kapı / No-drift | ACIKCA-KAPSAM-DISI
L544 | ## Kalıcı kural — CANLI-YAYIM KURALI (e) | ACIKCA-KAPSAM-DISI
L547 | ## Yedek / Sonraki adım | ACIKCA-KAPSAM-DISI
L553 | # ✅ KAPANIŞ KAYDI: DÖNGÜ-30 + DÖNGÜ-30-CACHE KAPANDI | ACIKCA-KAPSAM-DISI
L559 | ## Kullanıcı görsel doğrulaması | ACIKCA-KAPSAM-DISI
L564 | ## 1) Kök↔public drift — kök neden + çözüm zinciri | ACIKCA-KAPSAM-DISI
L572 | ## 2) Dürüstlük notu (düzeltme) | ACIKCA-KAPSAM-DISI
L576 | ## 3) Kapı | ACIKCA-KAPSAM-DISI
L583 | # VERİ ŞEMASI — localStorage & Yedek | TAM
L604 | # Checkpoint: Vendor Kütüphane Ayrımı — Çalışan Durum | ACIKCA-KAPSAM-DISI
L609 | ## Yapılan İş | ACIKCA-KAPSAM-DISI
L625 | ## index.html'deki Bağlantılar (değiştirilmedi, sadece işaret edildi) | ACIKCA-KAPSAM-DISI
L632 | ## Doğrulama Sonuçları | ACIKCA-KAPSAM-DISI
L641 | ## Bu Checkpoint'ten Geri Dönmek / Tutarlılığı Kontrol Etmek İçin | ACIKCA-KAPSAM-DISI
L651 | ## Güncelleme: Kısa Kod (Ders Saati) Sistemi v2 — Tamamlandı | ACIKCA-KAPSAM-DISI
L670 | # ✅ CHECKPOINT: Ana Inline Script → app.js (Tek Doğru Kaynak) | ACIKCA-KAPSAM-DISI
L674 | ## Karar | ACIKCA-KAPSAM-DISI
L685 | ## Sonuç (boyut + SHA-256) | ACIKCA-KAPSAM-DISI
L696 | ## Script'in Assert Ettikleri | ACIKCA-KAPSAM-DISI
L706 | ## Test Dosyalarında Eş Zamanlı Güncelleme | ACIKCA-KAPSAM-DISI
L711 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L720 | # ✅ CHECKPOINT: Kısa Kod Sistemi Çalışan Durum (v2) | ACIKCA-KAPSAM-DISI
L724 | ## Bu Checkpoint'in Dosya Bütünlüğü (SHA-256) | ACIKCA-KAPSAM-DISI
L744 | ## Test Dosyaları (regresyon için kök dizinde kalıcı) | ACIKCA-KAPSAM-DISI
L749 | ## Güncelleme: Base64 Font Bloklarının vendor/fonts.css'e Ayrılması | ACIKCA-KAPSAM-DISI
L766 | # ✅ CHECKPOINT: Dönem Seçici UI — Kalıcı Host + Gerçek DOM Onarımı (DONEM-SECICI-UI-YAMASI) | ACIKCA-KAPSAM-DISI
L768 | ## Kök Neden (kanıtlı) | ACIKCA-KAPSAM-DISI
L772 | ## Çözüm (yalnız app.js — 2 hedefli bölge, baştan yazma YOK) | ACIKCA-KAPSAM-DISI
L777 | ## Kalıcılık kuralı | ACIKCA-KAPSAM-DISI
L781 | ## Testler ve Sayılar | ACIKCA-KAPSAM-DISI
L787 | ## Yedek ve Dosyalar | ACIKCA-KAPSAM-DISI
L792 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L800 | ## Geri Dönüş | ACIKCA-KAPSAM-DISI
L808 | # ✅ CHECKPOINT: Kullanılmayan Dosyaların Temizliği | ACIKCA-KAPSAM-DISI
L812 | ## Silinen Dosyalar (7) | ACIKCA-KAPSAM-DISI
L826 | ## Korunan Dosyalar (dokunulmadı) | ACIKCA-KAPSAM-DISI
L831 | ## Temizlik Sonrası Doğrulama | ACIKCA-KAPSAM-DISI
L840 | ## Temizlik Sonrası Kök Dizini | ACIKCA-KAPSAM-DISI
L850 | # ✅ CHECKPOINT: Grup Dersi — Kaydetme + Çakışma Entegrasyonu | ACIKCA-KAPSAM-DISI
L854 | ## Yapılan İş (app.js — baştan yazma YOK, bölgesel yama) | ACIKCA-KAPSAM-DISI
L871 | ## Yeni/Değişen Bölgeler (satır numaraları ~) | ACIKCA-KAPSAM-DISI
L877 | ## Testler | ACIKCA-KAPSAM-DISI
L886 | # ✅ CHECKPOINT: Grup Paneli v2 — Checkbox Panel + Düzenleme Desteği | ACIKCA-KAPSAM-DISI
L890 | ## Yapılan İş (app.js — baştan yazma YOK, hedefli yama) | ACIKCA-KAPSAM-DISI
L908 | ## Testler | ACIKCA-KAPSAM-DISI
L918 | # ✅ CHECKPOINT: Grup Görünümü — Tablo/Badge + WhatsApp/PNG + Analiz Dağıtımı | ACIKCA-KAPSAM-DISI
L922 | ## Yapılan İş (app.js — baştan yazma YOK, hedefli yama: ks-yama-gorunum.mjs) | ACIKCA-KAPSAM-DISI
L936 | ## Testler | ACIKCA-KAPSAM-DISI
L947 | # ✅ CHECKPOINT: İstekten Planlamada Grup Seçimi Etkin | ACIKCA-KAPSAM-DISI
L951 | ## Teşhis (kod yazılmadan önce) | ACIKCA-KAPSAM-DISI
L959 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-istekten-grup.mjs idempotent yama) | ACIKCA-KAPSAM-DISI
L968 | ## Testler | ACIKCA-KAPSAM-DISI
L977 | # ✅ CHECKPOINT: Grup İsteği — Ortak Talep Modeli + Uyumluluk | ACIKCA-KAPSAM-DISI
L981 | ## Veri Modeli + Uyumluluk | ACIKCA-KAPSAM-DISI
L989 | ## Akış | ACIKCA-KAPSAM-DISI
L995 | ## Testler | ACIKCA-KAPSAM-DISI
L1002 | # ✅ CHECKPOINT: Grow-Only Sıra Register'ı + Panel Gövde + Tarih-Bağımsız Render | ACIKCA-KAPSAM-DISI
L1006 | ## Kök Neden (ks-izle-sira.mjs ile kanıtlandı) | ACIKCA-KAPSAM-DISI
L1012 | ## Yapılan İş (ks-yama-v5.mjs — idempotent, assert'li, exact-anchor; app.js baştan yazma YOK) | ACIKCA-KAPSAM-DISI
L1019 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L1030 | # ✅ CHECKPOINT: Kalıcı Benzersiz ID Altyapısı (KİMLİK-YAMASI) | ACIKCA-KAPSAM-DISI
L1034 | ## ID Şeması | ACIKCA-KAPSAM-DISI
L1047 | ## Değişen Fonksiyonlar (app.js — baştan yazma YOK, hedefli yama) | ACIKCA-KAPSAM-DISI
L1056 | ## Garantiler (testle kanıtlı, ks-benzersiz-id.mjs — 46 test) | ACIKCA-KAPSAM-DISI
L1064 | ## ID Adlandırmaları | ACIKCA-KAPSAM-DISI
L1069 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L1075 | # Gerçek Öğretmen ve Sınıf Kadrosu (2026-09-13) | ACIKCA-KAPSAM-DISI
L1079 | ## Öğretmenler (17) — ad → branş | ACIKCA-KAPSAM-DISI
L1101 | ## Sınıflar (18) — ad → ID | ACIKCA-KAPSAM-DISI
L1126 | ## Kadro uygulaması (ks-yama-kadro.mjs) | ACIKCA-KAPSAM-DISI
L1141 | # ✅ CHECKPOINT: Dönem Modeli — İlk Dilim (2026/2027, Veri-Uyumluluk) | ACIKCA-KAPSAM-DISI
L1145 | ## Dönem Şeması (localStorage: `yksOto_arsiv_v1`) | ACIKCA-KAPSAM-DISI
L1157 | ## Değişen Fonksiyonlar (app.js — baştan yazma YOK, ks-yama-donem-ilk.mjs hedefli yama) | ACIKCA-KAPSAM-DISI
L1165 | ## Migration Sayıları (seed verisi, tek geçiş) | ACIKCA-KAPSAM-DISI
L1176 | ## Yedek / Geri Yükleme | ACIKCA-KAPSAM-DISI
L1180 | ## Testler | ACIKCA-KAPSAM-DISI
L1187 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L1195 | # ✅ CHECKPOINT: Dönem Damgası — Yeni Ders/İstek Kayıtları Aktif Dönemle Doğuyor (DONEM-DAMGA-YAMASI) | ACIKCA-KAPSAM-DISI
L1199 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-donem-damga.mjs hedefli yama) | ACIKCA-KAPSAM-DISI
L1206 | ## Testler | ACIKCA-KAPSAM-DISI
L1216 | # ✅ CHECKPOINT: Dönem Seçici + Aktif Döneme Göre Filtreleme — İlk UI Dilimi (DONEM-SECICI-V2) | ACIKCA-KAPSAM-DISI
L1220 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-donem-secici.mjs hedefli yama) | ACIKCA-KAPSAM-DISI
L1227 | ## Testler | ACIKCA-KAPSAM-DISI
L1236 | # ✅ CHECKPOINT: Excel Uyumlu CSV Dışa/İçe Aktarma (Aktif Dönem) — EXCEL-CSV-YAMASI | ACIKCA-KAPSAM-DISI
L1240 | ## CSV Kararı ve Gerekçesi | ACIKCA-KAPSAM-DISI
L1245 | ## Üç Dosya (schema: "yks-csv-v1") | ACIKCA-KAPSAM-DISI
L1258 | ## ID/UPSERT ve Referans Kuralları | ACIKCA-KAPSAM-DISI
L1267 | ## Atomik İçe Aktarma ve Geri Alma | ACIKCA-KAPSAM-DISI
L1273 | ## Dokunulmayanlar | ACIKCA-KAPSAM-DISI
L1277 | ## Testler ve Sayılar | ACIKCA-KAPSAM-DISI
L1284 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L1293 | # ✅ CHECKPOINT: Yönetim'den 2027/2028 Dönemi Oluşturma + Dönemli Sınıf Programı (DONEM-OLUSTURMA-YAMASI) | ACIKCA-KAPSAM-DISI
L1295 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-donem-olusturma.mjs hedefli yama) | ACIKCA-KAPSAM-DISI
L1303 | ## Yeni Dönem Şeması | ACIKCA-KAPSAM-DISI
L1309 | ## sinifProg Migration ve Program Koruması | ACIKCA-KAPSAM-DISI
L1316 | ## Testler ve Sayılar | ACIKCA-KAPSAM-DISI
L1323 | ## Dokunulmayanlar (hash doğrulaması) | ACIKCA-KAPSAM-DISI
L1329 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L1336 | # ✅ CHECKPOINT: Dönem Seçici — Gerçek Tarayıcı DOM Düzeltmesi (DONEM-DOM-DÜZELTMESİ) | ACIKCA-KAPSAM-DISI
L1340 | ## Kök Neden (kanıtla) | ACIKCA-KAPSAM-DISI
L1346 | ## Kalıcı Çözüm (yalnız app.js — 4 hedefli bölge, baştan yazma YOK; yama: ks-yama-donem-dom.mjs) | ACIKCA-KAPSAM-DISI
L1355 | ## Testler ve Kanıtlar | ACIKCA-KAPSAM-DISI
L1363 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L1370 | ## SINIFPROG-CSV-YAMASI (2026-09-15) — aktif dönem sınıf programı CSV + eski yedek uyumluluğu | ACIKCA-KAPSAM-DISI
L1372 | ### Final Test Sonucu | ACIKCA-KAPSAM-DISI
L1376 | ### CSV Şeması | ACIKCA-KAPSAM-DISI
L1385 | ### Aktif Dönem Kuralı | ACIKCA-KAPSAM-DISI
L1390 | ### Atomic Import | ACIKCA-KAPSAM-DISI
L1396 | ### Eski Yedek Precedence (normalize / sinifProgDonemleriBaslat kapısı) | ACIKCA-KAPSAM-DISI
L1404 | ### Yama Kimliği | ACIKCA-KAPSAM-DISI
L1413 | # ✅ CHECKPOINT: Şablon Dönemden Sınıf Programı Kopyalama (SABLON-KOPYA-YAMASI) | ACIKCA-KAPSAM-DISI
L1417 | ## Kopyalama Veri Modeli | ACIKCA-KAPSAM-DISI
L1424 | ## Onay ve Veri Değistirmeme Kuralları | ACIKCA-KAPSAM-DISI
L1429 | ## UI (yalnız kalıcı #donem-ui-host içine) | ACIKCA-KAPSAM-DISI
L1435 | ## Süit ve Sonuç | ACIKCA-KAPSAM-DISI
L1439 | ## Yama Kimliği ve Hash'ler | ACIKCA-KAPSAM-DISI
L1448 | # ✅ CHECKPOINT: D0 — Render Sahipliği Hardening (Gerçek DOM Regresyon Süiti) | ACIKCA-KAPSAM-DISI
L1452 | ## Envanter ve Karar (A — üretim patch'i GEREKMEDİ) | ACIKCA-KAPSAM-DISI
L1456 | ## Yeni Süit: ks-render-sahipligi.mjs (30 test, test.mjs'e tam 1 kez eklendi) | ACIKCA-KAPSAM-DISI
L1459 | ## Hash'ler (değişmeyenler) | ACIKCA-KAPSAM-DISI
L1462 | ## Sonuç ve Sonraki Adım | ACIKCA-KAPSAM-DISI
L1466 | # ✅ CHECKPOINT: Kadro CSV Dışa Aktarma Sırası — ogretmen → sinif → ogrenci (KADRO-SIRALAMA-YAMASI) | ACIKCA-KAPSAM-DISI
L1470 | ## Yapılan İş (app.js — baştan yazma YOK, hedefli yama: ks-yama-kadro-siralama.mjs) | ACIKCA-KAPSAM-DISI
L1479 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L1488 | ## Kalan Risk / Not | ACIKCA-KAPSAM-DISI
L1495 | # ✅ CHECKPOINT: Kapalı Hücre Görünümü — Gri/Soluk + Tıklanabilir (KAPALI-GORUNUM-YAMASI) | ACIKCA-KAPSAM-DISI
L1499 | ## Kök Neden (kanıtlı — ks-teshis-kapali.mjs / ks-teshis2-kapali.mjs) | ACIKCA-KAPSAM-DISI
L1508 | ## Yama (ks-yama-kapali-gorunum.mjs — assert'li, idempotent, app.js baştan yazma YOK) | ACIKCA-KAPSAM-DISI
L1517 | ## Davranış Sonucu | ACIKCA-KAPSAM-DISI
L1524 | ## Testler | ACIKCA-KAPSAM-DISI
L1531 | ## Yedek ve Dosyalar | ACIKCA-KAPSAM-DISI
L1543 | ## Preview Notu | ACIKCA-KAPSAM-DISI
L1549 | # ✅ CHECKPOINT: Ek Ders Dönem Damgası + İki Yönlü Çakışma (EK-DERS-DONEM-YAMASI) | ACIKCA-KAPSAM-DISI
L1553 | ## Yapılan İş (yalnız app.js — ek-ders.js, index.html, vendor/* DOKUNULMADI) | ACIKCA-KAPSAM-DISI
L1566 | ## Testler | ACIKCA-KAPSAM-DISI
L1575 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L1581 | ## Yedek ve Dosyalar | ACIKCA-KAPSAM-DISI
L1591 | ## Kapsam Dışı (bilinçli) | ACIKCA-KAPSAM-DISI
L1597 | # ✅ CHECKPOINT: Ek Ders Görünürlüğü — Günlük Tablo + Öğretmen Haftalık Programı (EK-DERS-GORUNUM-YAMASI) | ACIKCA-KAPSAM-DISI
L1601 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-ekders-gorunum.mjs idempotent yama) | ACIKCA-KAPSAM-DISI
L1612 | ## Testler | ACIKCA-KAPSAM-DISI
L1619 | ## Yedek ve Hashler | ACIKCA-KAPSAM-DISI
L1636 | # ⛔ DURDURULDU (FAIL-CLOSED): Pazar Satırı + Birebir Hücresi Görünüm Yaması | ACIKCA-KAPSAM-DISI
L1640 | ## Teşhis (salt-okuma, kanıtlı) | ACIKCA-KAPSAM-DISI
L1650 | ## Yama denemesi ve neden geri alındı | ACIKCA-KAPSAM-DISI
L1662 | ## Yeniden denemek için yol haritası | ACIKCA-KAPSAM-DISI
L1670 | ## Son durum doğrulaması | ACIKCA-KAPSAM-DISI
L1679 | # ✅ CHECKPOINT: Pazar Satırı Normal Gün + Birebir Kartta Tam Ad/Konu/Sınıf (PAZAR-BIREBIR-GORUNUM-YAMASI) | ACIKCA-KAPSAM-DISI
L1683 | ## Salt-Okuma Envanteri (kod yazılmadan önce) | ACIKCA-KAPSAM-DISI
L1689 | ## Uygulama | ACIKCA-KAPSAM-DISI
L1695 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L1704 | # ✅ CHECKPOINT: Birebir Hücre Ortak Görünüm — Test Süitleri Hizalama (BIREBIR-GORUNUM-ORTAK-YAMASI) | ACIKCA-KAPSAM-DISI
L1708 | ## Durum | ACIKCA-KAPSAM-DISI
L1714 | ## Kök Neden (kırmızı 8 test) | ACIKCA-KAPSAM-DISI
L1724 | ## Yeni Süit: `ks-birebir-gorunum.mjs` (34 test, test.mjs'e tam 1 kez) | ACIKCA-KAPSAM-DISI
L1727 | ## Backup ve SHA-256 (yama öncesi hâller; üzerine yazılmadı) | ACIKCA-KAPSAM-DISI
L1738 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L1745 | # ✅ CHECKPOINT: Sınıf Programı ↔ Öğretmen Haftalık Program Uyumu (SINIF-OGRT-UYUM-YAMASI) | ACIKCA-KAPSAM-DISI
L1749 | ## Teşhis (salt-okuma, kanıtlı) | ACIKCA-KAPSAM-DISI
L1756 | ## Onarım (app.js — baştan yazma YOK) | ACIKCA-KAPSAM-DISI
L1763 | ## Test ve Doğrulama | ACIKCA-KAPSAM-DISI
L1769 | ## Yedek | ACIKCA-KAPSAM-DISI
L1773 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L1779 | # ✅ CHECKPOINT: 10.SINIF Sınıf Programı Grid — Canonical Dönem Onarımı (SINIF-PROG-UYUM-GENISLETME) | ACIKCA-KAPSAM-DISI
L1783 | ## Teşhis (salt-okuma, gerçek boot akışı ile kanıtlandı) | ACIKCA-KAPSAM-DISI
L1789 | ## Yama (yalnız app.js — ks-yama-sinif-prog-uyum-onar.mjs, assert'li, idempotent) | ACIKCA-KAPSAM-DISI
L1796 | ## Testler | ACIKCA-KAPSAM-DISI
L1801 | ## Yedek ve Dosyalar | ACIKCA-KAPSAM-DISI
L1813 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L1820 | # ✅ CHECKPOINT: Sınıf Programı Grid — DV Etiketi Kaldırıldı, Ders+Öğretmen Adı Gösterimi | ACIKCA-KAPSAM-DISI
L1824 | ## Teşhis (salt-okuma, kanıtlı) | ACIKCA-KAPSAM-DISI
L1829 | ## Yama (app.js — baştan yazma YOK, ks-yama-dv-etiket.mjs idempotent) | ACIKCA-KAPSAM-DISI
L1837 | ## Korunanlar | ACIKCA-KAPSAM-DISI
L1840 | ## Yedek ve SHA-256 | ACIKCA-KAPSAM-DISI
L1853 | # ✅ CHECKPOINT: Planlama Ekranı Kart Sırası — planKart üstte, havuzBolum altta (KART-SIRASI-YAMASI) | ACIKCA-KAPSAM-DISI
L1857 | ## Teşhis (salt-okuma, patch öncesi) | ACIKCA-KAPSAM-DISI
L1862 | ## Uygulanan Patch (yalnız index.html — app.js/ek-ders.js DOKUNULMADI) | ACIKCA-KAPSAM-DISI
L1867 | ## Yedek | ACIKCA-KAPSAM-DISI
L1870 | ## Testler | ACIKCA-KAPSAM-DISI
L1875 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L1880 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L1886 | # ✅ CHECKPOINT: Plan + İstek Havuzu Kartları — İki Kolon (KART-KOLON-YAMASI) | ACIKCA-KAPSAM-DISI
L1890 | ## Yapılan İş | ACIKCA-KAPSAM-DISI
L1898 | ## SHA-256 | ACIKCA-KAPSAM-DISI
L1908 | # ✅ CHECKPOINT: Branş–Ders Kuralı (BRANS-DERS-KURALI-YAMASI) | ACIKCA-KAPSAM-DISI
L1912 | ## Kural (TEK KAYNAK: app.js'teki BRANS_DERS_HARITA) | ACIKCA-KAPSAM-DISI
L1919 | ## Değişen Fonksiyonlar (app.js — baştan yazma YOK, ks-yama-brans-ders.mjs hedefli yama) | ACIKCA-KAPSAM-DISI
L1925 | ## Korunan Davranışlar | ACIKCA-KAPSAM-DISI
L1930 | ## Testler | ACIKCA-KAPSAM-DISI
L1934 | ## Yedek + İdempotans (SHA-256) | ACIKCA-KAPSAM-DISI
L1946 | # ✅ CHECKPOINT: Excel/CSV Kartı "NaN" Arızası Düzeltildi (EXCEL-UI-YAMASI) | ACIKCA-KAPSAM-DISI
L1950 | ## Teşhis | ACIKCA-KAPSAM-DISI
L1957 | ## Yama (ks-yama-excel-ui.mjs — assert'li, idempotent, byte-exact) | ACIKCA-KAPSAM-DISI
L1965 | ## Korunan Davranışlar | ACIKCA-KAPSAM-DISI
L1970 | ## Testler | ACIKCA-KAPSAM-DISI
L1977 | ## Yedek + İdempotans (SHA-256) | ACIKCA-KAPSAM-DISI
L1990 | # ✅ CHECKPOINT: WhatsApp Mesaj Şablonu (WA-SABLON-YAMASI) | ACIKCA-KAPSAM-DISI
L1994 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-wa-sablon.mjs idempotent yama) | ACIKCA-KAPSAM-DISI
L2001 | ## Testler | ACIKCA-KAPSAM-DISI
L2006 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L2018 | # ✅ CHECKPOINT: WhatsApp Modal — Ortak Mesaj Önizleme Paneli (WA-ONIZLEME-YAMASI) | ACIKCA-KAPSAM-DISI
L2022 | ## Tasarım (değiştirilmedi, uygulandı) | ACIKCA-KAPSAM-DISI
L2030 | ## Onizleme kuralları (kanıtlandı, ks-wa-onizleme.mjs) | ACIKCA-KAPSAM-DISI
L2036 | ## Değişen Dosyalar (baştan yazma YOK; hedefli bölge yaması) | ACIKCA-KAPSAM-DISI
L2046 | ## Hash freeze testleri yenilendi (assert gevşetilmedi) | ACIKCA-KAPSAM-DISI
L2051 | ## Yedek (üzerine YAZILMADI) | ACIKCA-KAPSAM-DISI
L2057 | ## Yeni Süit: ks-wa-onizleme.mjs — 35 test | ACIKCA-KAPSAM-DISI
L2061 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L2070 | # ✅ EXCEL-K IMPORT YAMASI — resmi kaynak: program-guncel.xml (kullanıcı seçimi B) | ACIKCA-KAPSAM-DISI
L2072 | ## Kaynak karar süreci (salt-okuma diff → kullanıcı seçimi) | ACIKCA-KAPSAM-DISI
L2080 | ## Yazma (tek oturum, seçim B sonrası) | ACIKCA-KAPSAM-DISI
L2095 | ## app.js DEĞİŞMEDİ | ACIKCA-KAPSAM-DISI
L2100 | ## Yeni Süit: ks-excel-k-import.mjs — 23 test (+ test.mjs'e 1 kez bağlandı, 37 süit) | ACIKCA-KAPSAM-DISI
L2107 | ## Doğrulama | ACIKCA-KAPSAM-DISI
L2116 | # ✅ CHECKPOINT: Stale avail.sinif Temizliği — Opsiyon B (46 Kayıt) | ACIKCA-KAPSAM-DISI
L2120 | ## Kapsam (kullanıcı onaylı, preflight raporuna dayalı) | ACIKCA-KAPSAM-DISI
L2127 | ## Korunanlar (assert'li) | ACIKCA-KAPSAM-DISI
L2141 | ## Atomiklik ve Dosyalar | ACIKCA-KAPSAM-DISI
L2150 | ## Silinen 46 Kayıt | ACIKCA-KAPSAM-DISI
L2172 | # ✅ CHECKPOINT: WhatsApp Öğrenci Mesajı — Yeni Satır Düzeni (WA-DURUM-YAMASI) | ACIKCA-KAPSAM-DISI
L2176 | ## Hedef Düzen (ogrenciMesajMetni — tek gerçek kaynak) | ACIKCA-KAPSAM-DISI
L2191 | ## Şablon Alanları (DB.ayarlar.whatsappSablon) | ACIKCA-KAPSAM-DISI
L2198 | ## Yama | ACIKCA-KAPSAM-DISI
L2204 | ## Değişen Dosyalar ve Yedekler (SHA-256) | ACIKCA-KAPSAM-DISI
L2212 | ## Testler | ACIKCA-KAPSAM-DISI
L2221 | ## Örnek Mesaj Çıktısı | ACIKCA-KAPSAM-DISI
L2238 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L2246 | # ✅ CHECKPOINT: Kadro CSV v2 — ad/soyad/telefon Üst Düzey Kolonlar (KADRO-KOLON-YAMASI) | ACIKCA-KAPSAM-DISI
L2250 | ## Yeni Header (birebir) | ACIKCA-KAPSAM-DISI
L2259 | ## Telefon Alanı (kaynak koddan tespit) | ACIKCA-KAPSAM-DISI
L2264 | ## v2 Export (app.js) | ACIKCA-KAPSAM-DISI
L2270 | ## v2 Import | ACIKCA-KAPSAM-DISI
L2276 | ## Korunan Güvenlik Kuralları (değişmeden) | ACIKCA-KAPSAM-DISI
L2280 | ## Değişen Fonksiyonlar (app.js — baştan yazma YOK, ks-yama-kadro-kolon.mjs exact-anchor yama) | ACIKCA-KAPSAM-DISI
L2293 | ## Backup + SHA-256 | ACIKCA-KAPSAM-DISI
L2302 | ## Testler | ACIKCA-KAPSAM-DISI
L2309 | ## Örnek CSV Satırları | ACIKCA-KAPSAM-DISI
L2318 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L2325 | # ✅ CHECKPOINT: Öğrenci 3 Telefon Alanı + Kadro CSV v3 (TELEFON3-YAMASI) | ACIKCA-KAPSAM-DISI
L2329 | ## DB Alanları (localStorage: `yksOto_arsiv_v1` — TEK anahtar değişmedi) | ACIKCA-KAPSAM-DISI
L2336 | ## CSV v3 (yalnız dataset=kadro; ders/istek/ek ders/sınıf programı şemaları değişmedi) | ACIKCA-KAPSAM-DISI
L2355 | ## Form UI (ekleme + düzenleme ekranlarında çalışır; duplicate id YOK) | ACIKCA-KAPSAM-DISI
L2361 | ## WhatsApp (değişmedi) | ACIKCA-KAPSAM-DISI
L2365 | ## Yama ve Dosyalar (boyut BAYT — statSync; SHA-256) | ACIKCA-KAPSAM-DISI
L2380 | ## Testler | ACIKCA-KAPSAM-DISI
L2386 | ## Kalan Riskler | ACIKCA-KAPSAM-DISI
L2392 | ## WA-ALICI-YAMASI (2026-09-19): WhatsApp modalına modal-genel alıcı seçici (Öğrenci / Anne / Baba) | ACIKCA-KAPSAM-DISI
L2414 | ## DERS-TASI-YAMASI (2026-09-19): Haftalık tabloda birebir ders kartını sürükle-bırakla taşıma | ACIKCA-KAPSAM-DISI
L2443 | ## GUNLUK-DERS-TASI-YAMASI (2026-09-19): Günlük tabloda birebir ders kartını AYNI SATIRDA başka boş saate taşıma | ACIKCA-KAPSAM-DISI
L2510 | # ✅ CHECKPOINT: Ders Kartı PNG — WhatsApp Görsel Paylaşımı (DERS-KARTI-YAMASI) | ACIKCA-KAPSAM-DISI
L2514 | ## Gerçek Fiyat-Maliyet (SINIRLAR — bunlara uymayan iddia YASAK) | ACIKCA-KAPSAM-DISI
L2521 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-ders-karti.mjs exact-anchor idempotent yama) | ACIKCA-KAPSAM-DISI
L2534 | ## Testler | ACIKCA-KAPSAM-DISI
L2541 | ## Yedek ve İdempotans | ACIKCA-KAPSAM-DISI
L2547 | ## Kalan Riskler / Not | ACIKCA-KAPSAM-DISI
L2552 | ## Düzeltme turu (soru-cevap denetimi, 2026-09-20) | ACIKCA-KAPSAM-DISI
L2559 | ## Sayım düzeltme turu 2 (2026-09-20) | ACIKCA-KAPSAM-DISI
L2569 | ## Ölü/koşullu test denetimi (tüm süitler, 2026-09-20) | ACIKCA-KAPSAM-DISI
L2575 | ## DERS-KARTI-TASIMA-YAMASI (2026-09-20) | ACIKCA-KAPSAM-DISI
L2590 | ## DÖNGÜ-3: SÜİT SAĞLAMLAŞTIRMA (app.js DOKUNULMADI — davranış değişikliği YOK) | ACIKCA-KAPSAM-DISI
L2601 | ## DÖNGÜ-4: SUITE_DONE SAYAÇ KAPISI (kapı kuruldu, dört sayı birebir) | ACIKCA-KAPSAM-DISI
L2603 | ### 1) "+1 sayacı" ledger'ı — kanıt (isim isim, tahmin yok) | ACIKCA-KAPSAM-DISI
L2613 | ### 2) Kalıcı kapı — uygulanan tasarım | ACIKCA-KAPSAM-DISI
L2618 | ### 3) Dört sayı birebir eşit | ACIKCA-KAPSAM-DISI
L2622 | ### Backup'lar (üzerine yazma YOK) | ACIKCA-KAPSAM-DISI
L2626 | ### Not | ACIKCA-KAPSAM-DISI
L2629 | ## DÖNGÜ-5: MANİFEST KAYNAĞI + CATCH-ONLY DÖNÜŞÜMÜ + NEGATİF KAPI TESTİ | ACIKCA-KAPSAM-DISI
L2631 | ### 1) Tur başı çelişkisi çözüldü (ham satır kanıtı) | ACIKCA-KAPSAM-DISI
L2635 | ### 2) Ledger (tek zincir, satır satır) | ACIKCA-KAPSAM-DISI
L2640 | ### 3) Manifestin bağımsız kaynağı + catch-only dönüşümü | ACIKCA-KAPSAM-DISI
L2648 | ### 4) Kapanış — dört sayı birebir | ACIKCA-KAPSAM-DISI
L2652 | ### Değişiklikler & yedekler (üzerine yazma YOK) | ACIKCA-KAPSAM-DISI
L2662 | ## DÖNGÜ-6: 51 SORUSUNUN ÇÖZÜMÜ + TAMLIK KANITI (statik-eksiksizlik.mjs) | ACIKCA-KAPSAM-DISI
L2664 | ### 1) 51 farkının kesin çözümü (ham satır kanıtı) | ACIKCA-KAPSAM-DISI
L2675 | ### 2) Tek başına koşum (pre-gate tasima) | ACIKCA-KAPSAM-DISI
L2679 | ### 3) Kapının bağımsızlığı — suit-vakalar nasıl üretildi + tamlık kanıtı | ACIKCA-KAPSAM-DISI
L2697 | ### 4) Kapanış — beşli birebir | ACIKCA-KAPSAM-DISI
L2706 | ## DÖNGÜ-7: 51 KANITININ KOD SATIRLARI + KOŞULLU SİTE ZORLAMA (6/6) + BAĞIMSIZLIK PARAGRAFI | ACIKCA-KAPSAM-DISI
L2708 | ### 1) 51 kanıtı — kod satırlarıyla | ACIKCA-KAPSAM-DISI
L2723 | ### 2) Koşullu site zorlama — 6/6 site kanıtlandı (isim isim) | ACIKCA-KAPSAM-DISI
L2743 | ### 3) Kapının bağımsızlığı — tek paragraf | ACIKCA-KAPSAM-DISI
L2761 | ### Kapanış — beşli | ACIKCA-KAPSAM-DISI
L2767 | ## DÖNGÜ-8: KOŞULLU DALLAR → KALICI FIXTURE + SIFIR-HIT KAPISI + ELLE VAKA MANIFESTI | ACIKCA-KAPSAM-DISI
L2769 | ### 1) Koşullu dallar kalıcı teste çevrildi — 8 fixture assertion (hepsi normal koşumda koşulsuz ve GEÇTİ) | ACIKCA-KAPSAM-DISI
L2784 | ### 2) SIFIR-HIT kapısı (statik-eksiksizlik.mjs, 8.821 B f8a85aec767b5da3…) | ACIKCA-KAPSAM-DISI
L2794 | ### 3) Bağımsız ELLE vaka manifesti (elle-vaka-manifesti.mjs, 1.928 B 0c1a03ffe006c9ae…) | ACIKCA-KAPSAM-DISI
L2804 | ### Kapanış — BEŞLİ + elle (altılı) birebir | ACIKCA-KAPSAM-DISI
L2809 | ### Yedekler (üzerine yazma YOK) — fixture-oncesi.*.bak | ACIKCA-KAPSAM-DISI
L2816 | ### Güncel dosyalar | ACIKCA-KAPSAM-DISI
L2821 | ## DÖNGÜ-9: GERÇEK-DAL FIXTURE'LAR + AD BAZLI ELLE MANIFEST + TAKAS NEGATİF TESTİ | ACIKCA-KAPSAM-DISI
L2823 | ### 1) Sabit-TRUE fixture'lar gerçek-dal hale getirildi (eski/yeni metin) | ACIKCA-KAPSAM-DISI
L2854 | ### 2) İstisna listesi ↔ fixture eşleme tablosu (eşleşmeyen istisna yok) | ACIKCA-KAPSAM-DISI
L2867 | ### 3) ELLE manifest AD BAZINA geçti (elle-vaka-adlari.mjs, 112.792 B 1ff45f8369074f82…) | ACIKCA-KAPSAM-DISI
L2883 | ### 4) Kapanış — altılı birebir | ACIKCA-KAPSAM-DISI
L2890 | ### Yedekler (gercek-dal-oncesi.*.bak, üzerine yazma YOK) | ACIKCA-KAPSAM-DISI
L2895 | ### Güncel | ACIKCA-KAPSAM-DISI
L2899 | ## DÖNGÜ-10: BAYRAK SAHİPLİĞİ KANITI + HAM Σ GÖRÜNÜRLÜĞÜ + 4 NEGATİF TEST | ACIKCA-KAPSAM-DISI
L2901 | ### 1) Bayrak sahipliği (atama satırları dosya:satır — hepsi DAL GÖVDESİ İÇİNDE, fixture yalnız okur) | ACIKCA-KAPSAM-DISI
L2910 | ### 2) BAYRAK-ÇIKARMA negatif testi (her bayrak için ayrı, ham çıktı) | ACIKCA-KAPSAM-DISI
L2917 | ### 3) HAM Σ görünürlüğü (test.mjs, 8.502 B ac14a104e7fd0142…) | ACIKCA-KAPSAM-DISI
L2922 | ### 4) Dört negatif test — tümü FAIL verdi, restore sonrası yeşil | ACIKCA-KAPSAM-DISI
L2928 | ### Kapanış | ACIKCA-KAPSAM-DISI
L2933 | ### Yedekler (bayrak-oncesi.*.bak, üzerine yazma YOK) | ACIKCA-KAPSAM-DISI
L2940 | ## KABUL EDİLEN RESIDUAL — DÖNGÜ-10 | ACIKCA-KAPSAM-DISI
L2945 | ## KABUL EDİLEN RESIDUAL — DÖNGÜ-10 | ACIKCA-KAPSAM-DISI
L2949 | ## DÖNGÜ-11: OGRT-YATAY-KART — dikey tablo İPTAL, öğretmen günlük PNG = yatay saat şeridi | ACIKCA-KAPSAM-DISI
L2951 | ### SÖZLEŞME DEĞİŞİKLİĞİ (AÇIK) | ACIKCA-KAPSAM-DISI
L2962 | ### app.js (yama: yama-ogrt-yatay.mjs, 16.300 B, 59c6433c9fd168da…) | ACIKCA-KAPSAM-DISI
L2982 | ### Backup'lar (üzerine yazma YOK) | ACIKCA-KAPSAM-DISI
L2987 | ### Süit yeniden yazımı (ks-ogrt-ders-karti.mjs, 25.646 B, feca59e2f442332c…) | ACIKCA-KAPSAM-DISI
L2996 | ### Kapı güncellemeleri (HAM Σ birebir) | ACIKCA-KAPSAM-DISI
L3003 | ### KAPANIŞ (fark sıfır) | ACIKCA-KAPSAM-DISI
L3008 | ### Mutasyon/negatif testler (ham çıktı + restore SHA kanıtlı) | ACIKCA-KAPSAM-DISI
L3018 | ### Yedek/araç dosyaları | ACIKCA-KAPSAM-DISI
L3024 | ### SON DURUM | ACIKCA-KAPSAM-DISI
L3028 | ## DÖNGÜ-12: DÖNGÜ-11 DENETİM AÇIKLARININ KAPATILMASI — TAMAMLANDI (fark sıfır) | ACIKCA-KAPSAM-DISI
L3030 | ### app.js | ACIKCA-KAPSAM-DISI
L3034 | ### Yeni denetim süiti: ks-ogrt-denetim.mjs (42 vaka, HEPSİ gerçek DB girdisi) | ACIKCA-KAPSAM-DISI
L3041 | ### Mutasyon kanıtları (mutasyon-dongu12.mjs — geçici kopya, restore SHA'lı) | ACIKCA-KAPSAM-DISI
L3047 | ### 4 eski negatif test (yeni süit kapıları üzerinden) | ACIKCA-KAPSAM-DISI
L3053 | ### Kapı dosyası güncellemeleri (yeni toplam YALNIZ gerçek assertion eklemeden doğdu) | ACIKCA-KAPSAM-DISI
L3061 | ### Zorunlu sonuçlar (SON KOŞUM) | ACIKCA-KAPSAM-DISI
L3068 | ### Not | ACIKCA-KAPSAM-DISI
L3074 | ## DÖNGÜ-13: "KOD MU, TEST MU?" AYRIMININ KANITLANMASI — TAMAMLANDI | ACIKCA-KAPSAM-DISI
L3076 | ### Sonuç: "kod zaten uygundu" KANITLANDI — "test koda uyduruldu" DEĞİL | ACIKCA-KAPSAM-DISI
L3081 | ### 0) Rozet çelişkisinin çözümü | ACIKCA-KAPSAM-DISI
L3088 | ### 1) Mutasyon kaynağı kanıtı (mutasyon-dongu13.mjs; D13_EXIT=0) | ACIKCA-KAPSAM-DISI
L3093 | ### 2) Test bağımsızlığı (fit-to-implementation riski) | ACIKCA-KAPSAM-DISI
L3103 | ### 3) Kapanış koşumları | ACIKCA-KAPSAM-DISI
L3110 | ### Yeni dosya | ACIKCA-KAPSAM-DISI
L3113 | ## DÖNGÜ-14: TAUTOLOJİ KALDIRILDI + SÖZLEŞME-METİN MUTASYONLARI — TAMAMLANDI | ACIKCA-KAPSAM-DISI
L3115 | ### 1) Tautoloji kaldırıldı (sabit-true fixture = 0) | ACIKCA-KAPSAM-DISI
L3121 | ### 2) Sözleşme-metin mutasyonları (mutasyon-dongu14.mjs; yalnız app.js geçici kopyası; D14_EXIT=0) | ACIKCA-KAPSAM-DISI
L3131 | ### 3) Kapanış koşumları | ACIKCA-KAPSAM-DISI
L3137 | ### Değişen dosyalar (yalnız test tarafı) | ACIKCA-KAPSAM-DISI
L3143 | ## DÖNGÜ-15 OLAYI VE TAMAMLANMA KAYDI | ACIKCA-KAPSAM-DISI
L3145 | ### OLAY (dürüst kayıt) | ACIKCA-KAPSAM-DISI
L3151 | ### Olay sonrası kurtarma araştırması (kanıt) | ACIKCA-KAPSAM-DISI
L3156 | ### Taban kararı (onaylı) | ACIKCA-KAPSAM-DISI
L3161 | ### Final kapılar (gerçek koşum) | ACIKCA-KAPSAM-DISI
L3166 | ### Mutasyon kanıtları (güvenli betik: SHA-kilitli, restore yalnız tur-başı kopyasından) | ACIKCA-KAPSAM-DISI
L3171 | ### Sözleşme özeti (DÖNGÜ-15) | ACIKCA-KAPSAM-DISI
L3176 | ### MUT-G4 KANIT TAMAMLANMASI (CHECKPOINT ek yazımı — tek yazım) | ACIKCA-KAPSAM-DISI
L3196 | ### DÖNGÜ-16 KAYDI — ÖĞRENCİ KARTI SAAT VE FOOTER DÜZENLEMESİ | ACIKCA-KAPSAM-DISI
L3198 | #### Kapsam (yalnız iki değişiklik) | ACIKCA-KAPSAM-DISI
L3202 | #### Kilit koruması (kanıtlı) | ACIKCA-KAPSAM-DISI
L3209 | #### Uygulama mimarisi | ACIKCA-KAPSAM-DISI
L3216 | #### Yeni assertion'lar (ks-ders-karti.mjs, gerçek üretilen çıktıdan; 8 adet) | ACIKCA-KAPSAM-DISI
L3226 | #### Manifest/vaka güncelleme (gerçek koşumdan, elle ayar yok) | ACIKCA-KAPSAM-DISI
L3231 | #### Mutasyon kanıtları (mutasyon-dongu16.mjs — yalnız geçici kopya; canonical SHA birebir korundu) | ACIKCA-KAPSAM-DISI
L3239 | #### Final kapılar | ACIKCA-KAPSAM-DISI
L3243 | #### Dosya karnesi | ACIKCA-KAPSAM-DISI
L3251 | ### DÖNGÜ-16 EK YAZIMI (statik kanıt + mutasyon-güvenlik kuralı) | ACIKCA-KAPSAM-DISI
L3264 | ### DÖNGÜ-17 KAYDI — ÖĞRETMEN TABLOLARI VE GÜNLÜK PNG GÜNCELLEMESİ | ACIKCA-KAPSAM-DISI
L3266 | #### Uygulama (yalnız üç görünüm; veri modeli değişmedi) | ACIKCA-KAPSAM-DISI
L3288 | #### Güncellenen eski assertion'lar (dosya:satır; silme/gevşetme YOK, eski→yeni gerekçeli) | ACIKCA-KAPSAM-DISI
L3296 | #### Yeni D17 assertion'ları (ks-ogrt-ders-karti.mjs; gerçek üretilen HTML'den; 91 koşum) | ACIKCA-KAPSAM-DISI
L3308 | #### Manifest/vaka (gerçek koşumdan, elle ayar yok) | ACIKCA-KAPSAM-DISI
L3314 | #### Mutasyon kanıtları (mutasyon-dongu17.mjs — yalnız geçici kopya; canonical SHA birebir korundu) | ACIKCA-KAPSAM-DISI
L3326 | #### Final kapılar | ACIKCA-KAPSAM-DISI
L3330 | #### Dosya karnesi | ACIKCA-KAPSAM-DISI
L3339 | ### DÖNGÜ-17 KAPANIŞ KANITLARI (ek kayıt — bu üç kayıt görülmeden "DÖNGÜ-17 TAMAMLANDI" yazılmaz) | ACIKCA-KAPSAM-DISI
L3356 | ## DÖNGÜ-18 KAYDI — İSTEK HAVUZU İSİM PUNTOSU + GRUP ÖĞRENCİ SEÇİM LİSTESİ GÖRÜNÜMÜ | ACIKCA-KAPSAM-DISI
L3358 | ### Uygulama (yalnız iki görsel alan; veri modeli değişmedi) | ACIKCA-KAPSAM-DISI
L3370 | ### gorselAd() — Türkçe güvenli dönüşüm | ACIKCA-KAPSAM-DISI
L3374 | ### Yeni D18 assertion'ları (gerçek üretilen HTML'den; +8) | ACIKCA-KAPSAM-DISI
L3381 | ### Manifest/vaka güncelleme (gerçek koşumdan) | ACIKCA-KAPSAM-DISI
L3386 | ### Mutasyon kanıtları (mutasyon-dongu18.mjs — yalnız geçici kopya; canonical SHA birebir korundu; 8/8 PASS) | ACIKCA-KAPSAM-DISI
L3394 | ### Final kapılar | ACIKCA-KAPSAM-DISI
L3400 | ### Dosya karnesi | ACIKCA-KAPSAM-DISI
L3411 | ## DÖNGÜ-19 — BİREBİR PLANLAMA + İSTEK HAVUZU ORTAK GÖRSEL FORMAT (TAMAMLANDI) | ACIKCA-KAPSAM-DISI
L3415 | ### Uygulanan değişiklikler (yalnız birebir planlama + istek havuzu görsel katmanı) | ACIKCA-KAPSAM-DISI
L3448 | ### Test (yalnız gerçek koşumdan; silme/gevşetme YOK) | ACIKCA-KAPSAM-DISI
L3460 | ### Mutasyon kanıtları (mutasyon-dongu19.mjs — YENİ; yalnız geçici tmp kopya; canonical app.js SHA önce/sonra birebir) | ACIKCA-KAPSAM-DISI
L3472 | ### No-drift | ACIKCA-KAPSAM-DISI
L3480 | ## DÖNGÜ-20 — BİREBİR PANELLERİ ALT ALTA YIĞINLAMA (TAMAMLANDI) | ACIKCA-KAPSAM-DISI
L3482 | ### Kapsam | ACIKCA-KAPSAM-DISI
L3489 | ### Test (ks-kart-kolon.mjs — D20 revizyonu; 55 assertion) | ACIKCA-KAPSAM-DISI
L3494 | ### statik-eksiksizlik istisna-listesi güncellemesi (tek yazım) | ACIKCA-KAPSAM-DISI
L3498 | ### Mutasyon kanıtları (mutasyon-dongu20.mjs — yalnız tmp kopya; canonical app.js+index.html SHA birebir) | ACIKCA-KAPSAM-DISI
L3507 | ### Geometri dürüstlük notu | ACIKCA-KAPSAM-DISI
L3510 | ### No-drift | ACIKCA-KAPSAM-DISI
L3519 | ## DÖNGÜ-21 — BİREBİR PLANLAMA / İSTEK HAVUZU UI DÜZELTMESİ (TAMAMLANDI) | ACIKCA-KAPSAM-DISI
L3521 | ### Kapsam (app.js + test tarafı; index.html DOKUNULMADI) | ACIKCA-KAPSAM-DISI
L3536 | ### Test (gerçek koşumdan; silme/gevşetme YOK) | ACIKCA-KAPSAM-DISI
L3547 | ### Mutasyon kanıtları (mutasyon-dongu21.mjs — YENİ; yalnız tmp kopya; canonical SHA birebir) | ACIKCA-KAPSAM-DISI
L3557 | ### No-drift | ACIKCA-KAPSAM-DISI
L3566 | ### Geometri dürüstlük notu | ACIKCA-KAPSAM-DISI
L3571 | ### DÖNGÜ-21 KAPANIŞ EKİ — 5 KANIT RAPORU ÖZETİ + DÜRÜSTLÜK KAYITLARI | ACIKCA-KAPSAM-DISI
L3573 | #### 1) Backup hatası kaydı (kalıcı ders) | ACIKCA-KAPSAM-DISI
L3582 | #### 2) ks-kart-sirasi / ks-kart-kolon donmuş satır istisna kaydı | ACIKCA-KAPSAM-DISI
L3592 | #### 3) Kapanış ibaresi | ACIKCA-KAPSAM-DISI
L3599 | ## DÖNGÜ-22 — GERÇEK TARAYICI DÜZELTMESİ (Uygulandı; kapanış kullanıcının görsel onayı ile) | ACIKCA-KAPSAM-DISI
L3601 | ### Keşif kök nedenleri (salt-okuma kanıtları) | ACIKCA-KAPSAM-DISI
L3611 | ### Uygulama | ACIKCA-KAPSAM-DISI
L3625 | ### Test (gerçek koşumdan; silme/gevşetme YOK) | ACIKCA-KAPSAM-DISI
L3641 | ### Mutasyon kanıtları (mutasyon-dongu22.mjs — YENİ; tmp kopya; canonical SHA birebir) | ACIKCA-KAPSAM-DISI
L3650 | ### No-drift | ACIKCA-KAPSAM-DISI
L3659 | ### Geometri dürüstlük + KABUL | ACIKCA-KAPSAM-DISI
L3666 | ## DÖNGÜ-23 — AUTOCOMPLETE ÖĞRENCİ ADI + SINIF EKSİĞİ (Uygulandı; son kabul Ctrl+Shift+R görsel kontrolü) | ACIKCA-KAPSAM-DISI
L3668 | ### Keşif | ACIKCA-KAPSAM-DISI
L3674 | ### Uygulama (app.js tek satır; index.html DEĞİŞMEDİ) | ACIKCA-KAPSAM-DISI
L3681 | ### Test (gerçek koşumdan; silme/gevşetme YOK) | ACIKCA-KAPSAM-DISI
L3695 | ### Mutasyon kanıtları (mutasyon-dongu23.mjs — YENİ; tmp kopya; canonical SHA birebir) | ACIKCA-KAPSAM-DISI
L3703 | ### No-drift | ACIKCA-KAPSAM-DISI
L3711 | ### Kabul | ACIKCA-KAPSAM-DISI
L3715 | ## DÖNGÜ-24 — HAVUZ / İSTEK KARTLARINDA AD-SOYAD CHIP GÖRÜNÜMÜ (Uygulandı; son kabul Ctrl+Shift+R görsel kontrolü) | ACIKCA-KAPSAM-DISI
L3717 | ### D23 açık kanıt kapanışı (salt-okuma) | ACIKCA-KAPSAM-DISI
L3726 | ### D24 keşif envanteri (havuz kartı + istek kartları ad-soyad yüzeyleri) | ACIKCA-KAPSAM-DISI
L3731 | ### Uygulama | ACIKCA-KAPSAM-DISI
L3739 | ### Test (gerçek koşumdan; silme/gevşetme YOK) | ACIKCA-KAPSAM-DISI
L3747 | ### Mutasyon kanıtları (mutasyon-dongu24.mjs — YENİ; tmp kopya; canonical SHA birebir) | ACIKCA-KAPSAM-DISI
L3755 | ### No-drift | ACIKCA-KAPSAM-DISI
L3762 | ### Kabul | ACIKCA-KAPSAM-DISI
L3768 | ## DÖNGÜ-25 — BİREBİR ÖĞRENCİ WHATSAPP ŞABLONU (Uygulandı; son kabul Ctrl+Shift+R görsel kontrolü) | ACIKCA-KAPSAM-DISI
L3770 | ### Keşif (salt-okuma kanıtları) | ACIKCA-KAPSAM-DISI
L3778 | ### Uygulama (app.js yalnız ogrenciMesajMetni gövdesi; saatEtiket() DEĞİŞMEDİ) | ACIKCA-KAPSAM-DISI
L3790 | ### Test (gerçek koşumdan; silme/gevşetme YOK; her değişiklik dosya:satır + gerekçe) | ACIKCA-KAPSAM-DISI
L3823 | ### Mutasyon kanıtları (mutasyon-dongu25.mjs — YENİ; yalnız tmp kopya; canonical SHA birebir) | ACIKCA-KAPSAM-DISI
L3832 | ### No-drift | ACIKCA-KAPSAM-DISI
L3843 | ### Kabul | ACIKCA-KAPSAM-DISI
L3851 | # ✅ CHECKPOINT: DÖNGÜ-26 — Grup Birebir Veri Akışı Düzeltmesi | ACIKCA-KAPSAM-DISI
L3855 | ## Kök Nedenler (keşif, kanıtlı) | ACIKCA-KAPSAM-DISI
L3861 | ## Yapılan İş (app.js — 3 bölge, baştan yazma YOK; ks-yama-dongu26.mjs + ks-yama-dongu26b.mjs idempotent yamalar) | ACIKCA-KAPSAM-DISI
L3869 | ## Testler | ACIKCA-KAPSAM-DISI
L3876 | ## Yedek / SHA | ACIKCA-KAPSAM-DISI
L3886 | ## Son Kabul | ACIKCA-KAPSAM-DISI
L3892 | # ✅ CHECKPOINT: DÖNGÜ-27 — Grup Üyeleri WhatsApp Akışı Doğrulaması ve Düzeltmesi | ACIKCA-KAPSAM-DISI
L3896 | ## Keşif (salt-okuma; SHA/baseline birebir: app.js `888c0356…` = DÖNGÜ-26 final) | ACIKCA-KAPSAM-DISI
L3902 | ## Yapılan İş (app.js — 2 bölge, baştan yazma YOK; ks-yama-dongu27.mjs idempotent yama) | ACIKCA-KAPSAM-DISI
L3907 | ## Gerçek Fixture (ks-dongu27.mjs — 31 test) | ACIKCA-KAPSAM-DISI
L3914 | ## Eski→yeni assertion eşlemesi (elle; koşumdan otomatik üretim YOK) | ACIKCA-KAPSAM-DISI
L3919 | ## Mutasyon kanıtları (mutasyon-dongu27.mjs — yalnız tmp kopya; canonical SHA birebir) | ACIKCA-KAPSAM-DISI
L3927 | ## Yedek / SHA | ACIKCA-KAPSAM-DISI
L3940 | ## Son Kabul | ACIKCA-KAPSAM-DISI
L3944 | ## Kapanış — DÖNGÜ-27 (görsel doğrulama + geriye dönük onay) | ACIKCA-KAPSAM-DISI
L3950 | # ✅ CHECKPOINT: DÖNGÜ-28 — Havuz İki Sütun Zigzag + Günlük "Boş" Öğretmen Satırları | ACIKCA-KAPSAM-DISI
L3954 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-dongu28.mjs hedefli yama) | ACIKCA-KAPSAM-DISI
L3959 | ## Süit güncellemeleri (gevşetme DEĞİL, kasıtlı şema güncellemesi) | ACIKCA-KAPSAM-DISI
L3965 | ## Yeni Süit | ACIKCA-KAPSAM-DISI
L3968 | ## Yedek / SHA | ACIKCA-KAPSAM-DISI
L3981 | ## Son Kabul | ACIKCA-KAPSAM-DISI
L3987 | # ✅ CHECKPOINT: DÖNGÜ-29 — Çizelgeden Havuza Geri Sürükleme (Onaylı, Tekli + Grup) | ACIKCA-KAPSAM-DISI
L3991 | ## Yapılan İş (app.js — baştan yazma YOK, ks-yama-dongu29.mjs hedefli yama) | ACIKCA-KAPSAM-DISI
L3998 | ## Test güncellemeleri (gevşetme DEĞİL, kasıtlı şema güncellemesi — ad değişiklikleri elle donmuş beşliye yazıldı) | ACIKCA-KAPSAM-DISI
L4014 | ## Yeni Süit | ACIKCA-KAPSAM-DISI
L4017 | ## Yedek / SHA | ACIKCA-KAPSAM-DISI
L4029 | ## Son Kabul | ACIKCA-KAPSAM-DISI
L4033 | ## Kapanış — DÖNGÜ-29 (görsel doğrulama) | ACIKCA-KAPSAM-DISI
L4039 | # ✅ CHECKPOINT: DAĞITIM-DÜZELTME — Canlı Site Stilsiz (Assets SPA-Fallback HTML Dönüyordu) | ACIKCA-KAPSAM-DISI
L4043 | ## Kök Neden (kanıtlı) | ACIKCA-KAPSAM-DISI
L4049 | ## Çözüm (build-time copy) | ACIKCA-KAPSAM-DISI
L4056 | ## Yerel build doğrulaması (Şart 3) — dist/kaynak SHA birebir | ACIKCA-KAPSAM-DISI
L4069 | ## Injected bundle'ların vanilla app'e etkisi (Şart 4) — TEMİZ | ACIKCA-KAPSAM-DISI
L4075 | ## No-drift (Şart 6) | ACIKCA-KAPSAM-DISI
L4081 | ## Canlı Doğrulama (Şart 5) — dağıtım sonrası | ACIKCA-KAPSAM-DISI
L4088 | # ✅ CHECKPOINT: TEMİZLİK — Eski .bak ve Mutasyon Dosyalarının Güvenli Arşivlenmesi (dongu15–29) | ACIKCA-KAPSAM-DISI
L4092 | ## Ne yapıldı | ACIKCA-KAPSAM-DISI
L4099 | ## Dürüstlük notu (temizlik — DÖNGÜ düzeltme geleneği) | ACIKCA-KAPSAM-DISI
L4103 | ## KE — codebase'de KALAN 37 (kararla) | ACIKCA-KAPSAM-DISI
L4107 | ## Dokunulmazlar | ACIKCA-KAPSAM-DISI
L4113 | ## Kapılar (taşıma sonrası, hepsi yeşil) | ACIKCA-KAPSAM-DISI
L4126 | # ✅ CHECKPOINT: DAĞITIM — public/ Geçişi ve Derleme-Zincir Kanıt Turu | ACIKCA-KAPSAM-DISI
L4130 | ## Durum (baştan sorgulandı) | ACIKCA-KAPSAM-DISI
L4135 | ## Bu turda kanıtlananlar | ACIKCA-KAPSAM-DISI
L4154 | ## Sonraki adımlar (kullanıcıya ait) | ACIKCA-KAPSAM-DISI
L4158 | ## KAPANIŞ — DAĞITIM-DÜZELTME (görsel doğrulama + kök neden + kalıcı kural) | ACIKCA-KAPSAM-DISI
L4168 | # ✅ CHECKPOINT: DÖNGÜ-30 — Öğrenci Bento Kart: Logo + Etiket + Not Şeridi | ACIKCA-KAPSAM-DISI
L4172 | ## Yapılan İş (app.js — baştan yazma YOK, 4 noktalı hedefli yama) | ACIKCA-KAPSAM-DISI
L4181 | ## Test güncellemeleri (ks-ders-karti.mjs 101→109, donmuş beşli ELLE) | ACIKCA-KAPSAM-DISI
L4188 | ## Mutasyon kanıtları (tmp kopya, restore byte-birebir) | ACIKCA-KAPSAM-DISI
L4193 | ## Etki sınırı (byte-diff kanıtı) | ACIKCA-KAPSAM-DISI
L4197 | ## Yedek / SHA | ACIKCA-KAPSAM-DISI
L4210 | ## Son Kabul | ACIKCA-KAPSAM-DISI
L4216 | # ✅ CHECKPOINT: DÖNGÜ-30-CACHE — app.js CDN Önbelleğini Aşma (?v= Damgası) | ACIKCA-KAPSAM-DISI
L4220 | ## Teşhis (kullanıcı kanıtı) | ACIKCA-KAPSAM-DISI
L4224 | ## Uygulama (yalnız index.html + test pin/offset dosyaları) | ACIKCA-KAPSAM-DISI
L4235 | ## Kapılar (tek koşu) | ACIKCA-KAPSAM-DISI
L4241 | ## Kalıcı kural + sonraki adım | ACIKCA-KAPSAM-DISI
L4245 | ## Kalan Risk | ACIKCA-KAPSAM-DISI
