import { appendFileSync } from "node:fs";

const kayit = `
---

# ✅ CHECKPOINT: DÖNGÜ-29 — Çizelgeden Havuza Geri Sürükleme (Onaylı, Tekli + Grup)

**Tarih:** 26 Eylül 2026 · **Durum:** ✅ Tamamlandı, \`node test.mjs\` → **2452/2452 OK** (2427 eski + 25 yeni)

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-dongu29.mjs hedefli yama)

1. **Grup dersleri draggable oldu:** haftalık (haftalikOgrtTablo) + günlük (gunlukTablo) hücre draggable guard'ı \`ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1\` → \`ders.durum !== "iptal" && ders.durum !== "tamamlandi"\` (grup dahil birebir planlı; iptal/tamamlanmış draggable değil). **Çizelge-içi grup taşıma YİNE reddedilir** — dersBurak guard'ı: "Grup dersleri çizelgede taşınamaz — havuza geri bırakın." (mevcut kural korunur; tamamlanmış için ayrı red mesajı eklendi).
2. **havuzBolum drop-zone:** DOMContentLoaded listener bloğunda planKart listener'ının yanına eklendi — \`dragover\` yalnız \`dersDropHedef\` doluysa tepki verir (havuz isteği akışına DOKUNMAZ), \`drop\` → \`dersHavuzaGeriBurak(dersDropHedef)\`. \`__geriAlmaBagli\` idempotent guard (double-bind imkânsız). Geçersiz/boş drop'ta veri DEĞİŞMEZ.
3. **dersHavuzaGeriBurak(dersId):** RED dalları — iptal, tamamlanmış, ekDersler'de aynı id, ogrenciId'siz/sinif'lı Sınıf Dersi kaydı (tümü toast + veri değişmez, onay açılmaz). Kapsam içindeysen MEVCUT onayAc ile: ders + tüm üyeler (tam ad) + ders + konu gösterilir; **"Planlama detayları (tarih, saat, öğretmen) sıfırlanır"** amber bildirimi. Onaylıysa: ders DB.dersler'den silinir → TEK \`bekliyor\` istek oluşur ({ogrenciId, ogrenciIds: ekler.slice(), ogrenciAd, dersId, konu, olusturma: eski değer korunur, donemId: aktifDonemId()}). \`ui.aktifIstekId = null\`; silinen ders düzenleniyorsa \`ui.editId = null\` + form alanları sıfırlanır + duzenleBannerGuncelle. Tek saveDB + renderHavuz/FormDestek/Dersler/Ozet/Analiz.
4. **Tekrar deneme çift kayıt ÜRETMEZ:** ders silindiği için aynı id ikinci kez bırakılamaz (no-op guard); istek→çizelge→geri döngüsünde her turda TEK ders + TEK istek (uid yeni, eski kayıt silinir — idsiz birikim yok).

## Test güncellemeleri (gevşetme DEĞİL, kasıtlı şema güncellemesi — ad değişiklikleri elle donmuş beşliye yazıldı)

| Süit | Eski ad/beklenti | Yeni ad/beklenti | Gerekçe |
|---|---|---|---|
| ks-ders-tasi (#17) | GRUP dersi hücresi draggable DEĞİL | GRUP dersi hücresi draggable (DÖNGÜ-29: yalnız havuz hedefi kabul eder) | grup draggable oldu; çizelge-içi taşıma dersBurak'ta reddedilir |
| ks-ders-tasi (#20) | iptal guard'ı kaynakta (eski string) | draggable guard'ı kaynakta (DÖNGÜ-29: iptal+tamamlanmış hariç; grup dahil) | guard metni değişti |
| ks-gunluk-ders-tasi (#11) | günlük draggable yalnız tek öğrencili birebir | günlük draggable planlı birebir (DÖNGÜ-29: grup dahil) | aynı guard güncellemesi |
| ks-gunluk-ders-tasi (#27) | GRUP dersi hücresi draggable DEĞİL | GRUP dersi hücresi draggable (DÖNGÜ-29: havuz hedefi) | aynı |
| ks-gunluk-ders-tasi (#31) | T satırı draggable sayısı = 1 | = 2 (birebir + grup) | grup draggable |
| ks-dongu26 (#12/#16) | grup hücresi draggable DEĞİL (haftalık/günlük) | grup hücresi draggable (DÖNGÜ-29: havuz hedefi) | aynı |
| ks-dongu28 (#19) | grup guard: dersOgrenciIds === 1 koşulu aynen | draggable guard: planlı birebir (DÖNGÜ-29) | aynı |
| ks-donem-damga (#47) | 4 kayıt noktasında donemId damgası | 5 kayıt noktası (4 + geri-alma isteği) | yeni istek damgalı |
| ks-ekders-ozet-csv | haftalikOgrtTablo diff beyaz listesi | + "DÖNGÜ-29" yasal bölge | guard satırı değişti |
| ks-kart-sirasi (#33) | süit sayısı → 50 | → 51 | yeni süit |
| statik-eksiksizlik | istisna listesi | + ks-dongu28 site#2, ks-dongu29 site#2 (boot-catch dalları, 0-hit DOĞRU) | açık kayıt, sessiz geçiş yok |

## Yeni Süit
- \`ks-dongu29.mjs\` — **25 test**: tekli geri bırakma (onay modal + öğrenci/konu + sıfırlanma bildirimi + ders silinir + TEK istek + olusturma/donemId korunur + aktifIstekId temiz); grup geri bırakma (üye koruması ogrenciId/ogrenciIds); RED dalları (iptal/tamamlanmış/Ek Ders/Sınıf Dersi — onay açılmaz, veri değişmez); tekrar denemede çift kayıt YOK; çizelge-içi grup taşıma RED (localStorage byte-birebir); statik sözleşme (idempotent guard, fonksiyon tekilliği, onayAc yolu, bildirim).

## Yedek / SHA

| Dosya | SHA-256 |
|---|---|
| app.js (önce = yedek \`app.js.dongu29-oncesi.bak\`) | \`7daf7d98c860b4263df6583a9a82b86765b22fa92ef97ab4375fda5940325251\` |
| app.js (sonra) | \`009d03d787f4fa435838a9f104f01056f757a038b6002dff17c31a0acd3f6567\` |
| index.html | \`244f61c87e84b3f43efc3326fcbf3b7950c981fa04fae077976b950318e6b403\` (DEĞİŞMEDİ) |
| ek-ders.js | \`3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f\` (DEĞİŞMEDİ) |

- Yama idempotent: 2. koşu "Zaten uygulanmış" + exit 2, SHA doğrulandı — dosya değişmez.
- Doğrulama: \`node --check app.js\` OK · \`node test.mjs\` → **2452/2452 OK, HAM Σ beşli BİREBİR** (51 süit) · \`node statik-eksiksizlik.mjs\` → **48/48 süitte TAMLIK KANITI**.

## Son Kabul

Çizelgeden (haftalık/günlük) bir birebir ders kartı havuza sürüklenip bırakıldığında: onay penceresinde ders + tüm üyeler + sıfırlanma bildirimi görünmeli; onayda ders çizelgeden kalkıp tüm üyeleri/ders/konu ile TEK bekleyen istek havuza düşmeli; iptal/tamamlanmış/Ek Ders/Sınıf Dersi bırakılamamalı; grup dersleri çizelge içinde taşınamamalı — **kullanıcı görsel kontrolü ile (Ctrl+Shift+R)**.
`;

appendFileSync("CHECKPOINT.md", kayit);
console.log("CHECKPOINT.md'ye DÖNGÜ-29 kaydı eklendi");
