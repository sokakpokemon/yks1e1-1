const fs = require("fs");
const BLK = `

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
`;
fs.appendFileSync("CHECKPOINT.md", BLK);
console.log("CHECKPOINT.md güncellendi");
