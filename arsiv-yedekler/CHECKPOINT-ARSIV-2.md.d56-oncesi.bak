<!-- EKLEMELİ ARŞİV — D43 SONRASI · SIKIŞTIRMA YOK · bu dosya yalnız BÜYÜR -->
# 🗄️ CHECKPOINT-ARSIV-2 — D43 SONRASI TAM KAYITLAR (EKLEMELİ)

**Neden bu dosya:** `CHECKPOINT-ARSIV.md`, D43 anındaki `CHECKPOINT.md`'nin BYTE-BİREBİR kopyasıdır
(SHA-256 `fef67637ff3ebfae0c6629cf8865f2cebd98d32d7e5188b9469c22dc1381007a` · 4246 satır / 355.955 byte ·
not: `CHECKPOINT-ARSIV-NOT.md`) — bu yüzden **D43'ten SONRAKİ** kayıtları içeremez. Bu dosya o boşluğu kapatır.

**Kurallar**
- D43 sonrası her turun **TAM** kaydı burada birikir; kayıt SİLİNMEZ, üzerine YAZILMAZ → yalnız SONA eklenir.
- `CHECKPOINT.md` ROLLING bölümü aktif/özet kayıtları tutar; buradaki kayıtlar tam metindir.
- Bu dosya için byte-birebir/SHA iddiası YOKTUR (bilinçli olarak EKLEMELİ).
- No-drift damgası (tüm turlar boyunca değişmedi): `app.js` `231cf09fef286267` · `ek-ders.js` `3d2dd38ff517c64f` · `index.html` `13edc44a0784df72`.

---

## ✅ JET-TURBO FAZ 0 — TEMEL ÖLÇÜM (salt-okuma baseline) · 2026-09-29
- Hiçbir dosya değişmedi; publish yok.
- `node hizli-test.mjs --profil`: 55 süit, TOPLAM 15.63s, 55/55 ✓. En yavaş: `ks-brans-ders-kurali.mjs` 3.67s · `ks-donem-secici-gorunum.mjs` 3.65s; ardından `ks-render-sahipligi` 0.49s · `ks-d1-render-refactor` 0.39s.
- Statik kapı 3 koşum: 16.112s / 15.668s / 15.922s → **medyan 15.922s**; her koşumda `TAMLIK KANITI: 48/48`, exit 0, 55 OK satırı.
- `node scripts/publish-guard.mjs`: YEŞİL, 0.090s.
- SHA-256: app.js `231cf09fef286267` · ek-ders.js `3d2dd38ff517c64f` · index.html `13edc44a0784df72`.

## ✅ JET-TURBO FAZ 1 — STATİK KAPI PARALEL (isteğe bağlı `--paralel`) · 2026-09-29
**Değişen dosya:** `statik-eksiksizlik.mjs` (tek dosya).
**İç zamanlama bulgusu (ADIM 1):** iki yavaş süitte gerçek iş ~50 ms — app.js okuma 1.5–2.9 ms · sahte DOM 0.4 ms · `new Function` derleme 4.3 ms (1×) / 7.4 ms (2×) · boot çağrısı 34–46 ms · `console.log` toplam 3.3 ms. Kalan ~3.53 sn **ölü bekleme**: `app.js:1066` `toast()` içindeki `setTimeout(…, 3200)` — bu iki süit (diğerlerinin aksine) `process.exit()` çağırmadığı için Node olay döngüsü toast timer'ını bekliyor. Statik kapı: 55 sıralı `spawnSync` = 14.67s, acorn parse toplam 263 ms.
**Uygulama:** `--paralel` → en fazla 2 işçi; her işçi benzersiz `/tmp/enst-isl-<pid>-<slot>/` dizini; sonuçlar tamponlanıp MANIFEST SIRASINA göre basılır; temp kalıntı 0; bayraksız koşum aynen eski seri yol.
**Kapılar:** Kapı-1 seri↔paralel çıktı birebir (`diff` boş, md5 `b332ceedb31f80fb1f4ca970882d9612`; değişiklik ÖNCESİ seri çıktı ile de birebir) · Kapı-2 48/48 · 55 OK / 0 KALDI · exit 0 (iki modda) · Kapı-3 yalnız `statik-eksiksizlik.mjs` değişti, `ks-*`/vaka/manifest dokunulmadı · Kapı-4 kalıntı 0 · Kapı-5 no-drift aynı.
**Ölçüm:** statik kapı 15.922s → **8.340s** (8.490/8.340/8.245, medyan) · seri 15.376/15.652/15.898 (medyan 15.652s, regresyon yok) · `--tam` 30.07s → 15.16s (test 14.48s + statik 7.00s) · MANIFEST 55 süit / 2586 birebir · `node --check` OK.

## ✅ JET-TURBO FAZ 1B — SAHTE BEKLEME TEMİZLİĞİ + `--tam` PARALEL STATİK · 2026-09-29
**Değişen dosyalar:** `ks-donem-secici-gorunum.mjs` · `ks-brans-ders-kurali.mjs` · `hizli-test.mjs`.
**Kanıt:** iki süitte `toast`/`3200` hakkında assertion YOK; `setInterval` app.js/ek-ders.js/index.html'de 0. Kanıt aracı: assertion'lar 75.5 ms / 66.2 ms'de bitiyor, açık handle yalnız engellemeyen stdout/stderr Socket'i, bekleyen timer'lar 2× 3200 ms ve 5× 3200 ms (`Timeout` handle'ları `_getActiveHandles`'ta görünmediği için kurulum anında yakalandı).
**Uygulama:** her iki süitte hedefli temizlik — ≥1000 ms zamanlayıcılar kurulum anında kaydedilir, TÜM assertion'lar bittikten sonra `clearTimeout`; **`process.exit()` KULLANILMADI**. `hizli-test.mjs` `--tam` kapanışında statik kapı yalnız orada `--paralel` koşar (seri DEFAULT korunur).
**Kapılar:** Kapı-1 stdout birebir (44/44 ve 54/54; tek görünen fark stderr'deki 2 `[DONEM-DOM-SELF-CHECK]` satırıydı — FAZ 1 kaydında da aynı 2 satır var) · Kapı-2 statik çıktı değişiklik öncesi referansla birebir, 48/48, 55 OK, exit 0 · Kapı-3 `site=/hit=/vaka=/koşum=` sayıları aynı, vaka/manifest mtime değişmedi · Kapı-4 beforeExit 3591→64.1 ms ve 3585→67.3 ms, kalıntı 0 · Kapı-5 no-drift aynı.
**Ölçüm:** `ks-donem-secici-gorunum` 3.750s → **0.155s** (medyan) · `ks-brans-ders-kurali` 3.751s → **0.153s** · `--tam` 30.07s → **15.16s** · statik kapı 15.50s → **7.00s** · `test.mjs` 14.48s → 8.10s.

## ✅ JET-TURBO FAZ 2 ÖN ADIM — SÜİT BAĞIMSIZLIK DENETİMİ (salt-okuma) · 2026-09-29
- Hiçbir proje dosyası değişmedi; `--tam` koşulmadı; denetim aracı 0.832s ve silindi.
- Çıktı: `/tmp/suit-io-haritasi.txt` (624 satır). Okuma: `app.js` ×54 · `index.html` ×53 · `test.mjs` ×24 · `ek-ders.js` ×21.
- **YAZAN süit 0/55 · `/tmp` kullanan süit 0/55 · alt süreç çağıran 1 süit.**
- Sınıflandırma: **A 0 · B 54 · C 1** → C: `ks-excel-k-import.mjs` (`spawnSync(ks-yama-excel-k-import.mjs)`; çocuk `ks-excel-k-import-uygulandi.flag` varken no-op, exit 2).
- Kritik teyit: `suit-vakalar/*`, `suit-manifest.mjs`, `test.mjs` yazan süit yok · `/tmp/tam.txt`'yi yalnız `hizli-test.mjs` yazar · `ks-stale-temizlik-uygulandi.flag` öksüz (hiçbir dosyada geçmiyor) · hiçbir süit `.json` yazmıyor (yalnız bellekte mutasyon) · hiçbir süit geçen süreyi assert etmiyor.
- Karar: paralel mod uygulanabilir (EVET); önerilen işçi sayısı 2.

## ⛔ JET-TURBO FAZ 2 — `test.mjs` PARALEL DENEMESİ · HEDEF TUTMADI → GERİ ALINDI · 2026-09-29
- Uygulandı ve doğrulandı (kapı mantığı `suitDogrula` olarak çıkarıldı; `--paralel` ile Sınıf-B 54 süit 2 işçi, Sınıf-C kendi manifest sınırında tek başına, tamponlu manifest sırası, işçi başına benzersiz TMPDIR).
- **Kapı-1 GEÇTİ:** seri(önce) = seri(sonra) = paralel çıktı, md5 `1afe23653d50162d3beef141d9ac0d55` (3370 satır) · **Kapı-2 GEÇTİ:** 55 süit / 2586 birebir · HAM Σ 5'li eşitlik · exit 0.
- **Ölçüm (3 koşum medyan):** seri 7.778s (7.778/8.002/7.583) · paralel **6.064s** (6.377/5.648/6.064) → hedef **≤5.5s TUTMADI**.
- Kök neden: ortam `nproc=2` ve ölçülen eşzamanlılık kazancı ~1.7× (2 eşzamanlı süit ölçümü 0.219s → 0.254s); kalan iş CPU-ağırlıklı olduğu için 2 işçi ~5.6–6.4s tabanının altına inmiyor.
- **Kural uygulandı:** paralel yol geri alındı, `test.mjs` değişiklik öncesi haline döndü (seri çıktı md5 birebir aynı) · `hizli-test.mjs` `--tam` içinde `test.mjs` SERİ kalır, yalnız statik kapı `--paralel`.
- **`--tam` ölçümü (geri alma sonrası, 1 koşum):** 14.377s (test 7.89s + statik 6.43s) → hedef ≤13.0s TUTMADI · MANIFEST 55 süit / 2586 birebir · TAMLIK 48/48 · exit 0.

---

## ✅ KAPANIŞ KAYDI: JET-TURBO (FAZ 0 · 1 · 1B · 2) KAPANDI

**Tarih:** 29 Eylül 2026 · **Durum:** ✅ Kapandı — test altyapısı turu; **uygulama kodu DEĞİŞMEDİ**, publish GEREKMEZ.
**Kapsam:** `statik-eksiksizlik.mjs` · `test.mjs` (geri alındı) · `hizli-test.mjs` · `ks-donem-secici-gorunum.mjs` · `ks-brans-ders-kurali.mjs` · `CHECKPOINT.md` / `CHECKPOINT-ARSIV-2.md`.

### 1) FAZ 0 — TEMEL ÖLÇÜM (salt-okuma)
- Baseline `--tam` **30.07s** · `test.mjs` **14.48s** · statik kapı **15.92s** (medyan) · iki yavaş süit **3.716s / 3.751s** (medyan).
- Ortam: `nproc=2` · no-drift `app.js 231cf09fef286267` · `ek-ders.js 3d2dd38ff517c64f` · `index.html 13edc44a0784df72`.

### 2) FAZ 1 — STATİK KAPI PARALEL (isteğe bağlı bayrak; seri DEFAULT korundu)
- `statik-eksiksizlik.mjs --paralel`: **≤2 işçi** · işçi başına **benzersiz** geçici dizin · sonuçlar tamponlanıp **MANIFEST SIRASINA** göre basılır (çıktı seri ile birebir) · temp temizliği (kalan 0) · kaynak dosyalar salt-okuma.
- **15.92s → 8.34s** (hedef ≤11s ✓) · seri yol **regresyonsuz** · `--tam` 30.07s → 15.16s.

### 3) FAZ 1B — KÖK NEDEN BULUNDU (3.7s EVAL DEĞİL)
- İki yavaş süitte gerçek iş **~50 ms** (app.js okuma 1.5–2.9 ms · sahte DOM 0.4 ms · `new Function` derleme 4.3/7.4 ms · boot çağrısı 34–46 ms · `console.log` 3.3 ms); kalan **~3.53s ölü bekleme**: `app.js:1066` `toast()` içindeki `setTimeout(…, 3200)` + bu iki süitte **`process.exit()` yok** → Node olay döngüsü 3.2s bekliyor (beforeExit **3591 ms**; hızlı süitlerde beforeExit hiç ateşlenmiyor).
- ÇÖZÜM: assertion sonrası **hedefli timer temizliği** (`clearTimeout`) — **`process.exit()` KULLANILMADI** (stdout/SUITE_DONE kesilme riski) · global stub KULLANILMADI.
- SONUÇ: iki süit **3.750/3.751s → 0.155/0.153s** · `--tam` **30.07 → 15.16s** · `test.mjs` **14.48 → 8.10s** (bonus: 2×3.2s dead wait kalktı) · statik **7.00s**.

### 4) FAZ 2 — `test.mjs` PARALEL: DENENDİ, HEDEF TUTMADI, GERİ ALINDI
- Denenen: `test.mjs --paralel` (**2 işçi**; Sınıf-B **54** süit havuzda, Sınıf-C `ks-excel-k-import.mjs` **seri**) · çıktı seri ile **birebir** (md5 `1afe23653d50162d3beef141d9ac0d55`) · **2586/2586** · yarış/kalıntı **0**.
- ÖLÇÜM: medyan **6.064s** (7.778s seri tabanı) → hedef **≤5.5s TUTMADI**. Kök neden: `nproc=2`, cgroup `cpu.max=100000 100000`, ölçülen eşzamanlılık **~1.7×**; kalan iş CPU-ağır.
- KARAR: seri varsayılan korundu, **paralel yol GERİ ALINDI** (`test.mjs` değişiklik öncesi haline döndü).

### 5) FAZ 2 ÖN ADIM — SÜİT BAĞIMSIZLIK DENETİMİ (kalıcı kanıt)
- 55 süitlik I/O haritası (statik AST; süitler KOŞULMADAN) → `/tmp/suit-io-haritasi.txt` (624 satır).
- **A=0 · B=54 · C=1** · dosya YAZAN süit **0/55** · `/tmp` kullanan süit **0/55** · alt süreç çağıran **1** süit → süitler salt-okuma (gelecekte paralel gerekirse temel).
- C süiti: `ks-excel-k-import.mjs` → `spawnSync(ks-yama-excel-k-import.mjs)` (çocuk, `ks-excel-k-import-uygulandi.flag` varken no-op / exit 2).

### 6) NOT — TEKRAR DENEMEYİN
- Aynı 2-işçili `test.mjs` paralel yaklaşımı, **YENİ KANIT** (CPU ≥4 veya iş yükü değişimi) olmadan tekrar denenmesin.

### Kapı / No-drift
- `node hizli-test.mjs --tam` → **exit 0** · `MANIFEST: 55 süit, toplam 2586 beklenen | RUNNER: 2586 koşan, 2586 geçen — BİREBİR EŞİT ✓` · `HAM Σ: runner=2586 = SUITE_DONE=2586 = donmuş=2586 = ELLE sayı=2586 = ELLE ad=2586 — BİREBİR ✓` · `TAMLIK KANITI: 48/48 süitte her statik t( noktası koştu; vaka listesi tam.`
- No-drift: `app.js 231cf09fef286267` · `ek-ders.js 3d2dd38ff517c64f` · `index.html 13edc44a0784df72` — **DEĞİŞMEDİ**.
- Kapandı — **publish YOK** (tamamen test altyapısı).
