import { appendFileSync } from "node:fs";

const kayit = `
---

# ✅ CHECKPOINT: DÖNGÜ-28 — Havuz İki Sütun Zigzag + Günlük "Boş" Öğretmen Satırları

**Tarih:** 26 Eylül 2026 · **Durum:** ✅ Tamamlandı, \`node test.mjs\` → **2427/2427 OK** (2407 eski + 20 yeni)

## Yapılan İş (app.js — baştan yazma YOK, ks-yama-dongu28.mjs hedefli yama)

1. **Havuz kart listesi (renderHavuz, liste bloğu):** geniş ekranda \`md:grid md:grid-cols-2\` — zigzag 1 sol / 2 sağ / 3 sol… (grid doğal akışı). Dar ekranda tek sütun (\`space-y-2\`). Ortadaki ayırıcı TEK dikey çizgi: sarmalayıcı \`relative\` + \`absolute inset-y-0 left-1/2 w-px bg-slate-200 md:block pointer-events-none\` (divide-x KULLANILMADI — grid çocuklarında çizgi tekrarı olmaz). Boş-havuz mesajı \`md:col-span-2\` ile iki kolon kaplar. Üst filtre çipleri, form grid'i, kart İÇ tasarımı ve \`draggable/ondragstart\` zinciri DEĞİŞMEDİ; kart sırası (kronolojik \`sirali\`) aynen.
2. **Günlük "Boş" satırları (gunlukTablo):** o gün HİÇ dersi olmayan ve MEVCUT kilit kurallarına göre ≥1 uygun boş slotu olan öğretmenler, dersli satırlardan hemen sonra EK satır olarak eklenir. Ad hücresinde küçük \`Boş\` etiketi (slate pill) — dersli satırlardan AYIRT EDİLİR. Uygun slot = MEVCUT istekBurak/dersBurak kuralı: mola hariç, Pazar hariç (di!==6), ders/ek-ders dolu değil, \`avail.sinif\`'ta GÜN-KOD yok (Sınıf Dersi), \`avail.musait\`'te yok (Kapalı). Kilitli hücreler gri (\`bg-slate-100/70\`) + Dolu/Sınıf/Kapalı etiketi; uygunlar MEVCUT \`dnd-bos\` drop-zone yolu (aynı istekDragOver/istekDragLeave/istekBurak). Uygun slotu 0 olan öğretmene satır EKLENMEZ. Pazar günü ek satır YOK. \`istekBurak\`/\`dersBurak\`/\`dersOgrenciIds\` koduna DOKUNULMAZ.

## Süit güncellemeleri (gevşetme DEĞİL, kasıtlı şema güncellemesi)
- \`ks-gunluk-ders-tasi.mjs\` "drop-zone çağrısı 2 yol" → "3 yol (haftalık + günlük dersli + günlük Boş satırları)" — aynı handler adı \`istekBurak\`; donmuş txt + elle-adlar + elle-sayı aynen güncellendi (115 sayısı korundu).
- \`ks-kart-sirasi.mjs\` "min 33 → 49" → "→ 50" (test.mjs süit sayısı 49→50; donmuş txt + elle-adlar güncellendi).
- \`test.mjs\` MANIFEST satırı "49 süit" → \`\${suites.length} süit\` (50); süit listesine \`ks-dongu28.mjs\` eklendi.
- Donmuş beşli DÖNGÜ-28 kayıtları: suit-manifest.mjs + elle-vaka-manifesti.mjs (20) + elle-vaka-adlari.mjs (20 ad, elle yazıldı) + suit-vakalar/ks-dongu28.mjs.txt (20 ad, elle yazıldı) — koşumdan otomatik üretim YOK.

## Yeni Süit
- \`ks-dongu28.mjs\` — **20 test**: zigzag sarmalayıcı + TEK ayırıcı + divide-x yok + filtre/kart byte-koruma; dersli satır adıyla VAR; Boş etiketi + drop-zone yolu + gerçek data-drop-ogrt; tüm-gün-kapalı öğretmene satır YOK; kısmen kapalıda \`Kapalı\` kilitli hücre; Pazar'da satır YOK; istekBurak/dersBurak/dersDrag tekillik + istekBurak→dersBurak devri + grup draggable guard.

## Yedek / SHA

| Dosya | SHA-256 |
|---|---|
| app.js (önce = yedek \`app.js.dongu28-oncesi.bak\`) | \`931efb65d6c85520de9407ee23d33ce1411c96d226f230b40d676421ecdc6c3f\` |
| app.js (sonra) | \`7daf7d98c860b4263df6583a9a82b86765b22fa92ef97ab4375fda5940325251\` |
| index.html | \`244f61c87e84b3f43efc3326fcbf3b7950c981fa04fae077976b950318e6b403\` (DEĞİŞMEDİ) |
| ek-ders.js | \`3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f\` (DEĞİŞMEDİ) |

- Yama idempotent: 2. koşu "Zaten uygulanmış" + exit 2, SHA doğrulandı — dosya değişmez.
- Doğrulama: \`node --check app.js\` OK · \`node test.mjs\` → **2427/2427 OK, HAM Σ beşli BİREBİR** (50 süit).
- Süit Δ: \`ks-gunluk-ders-tasi\` 115 (ad güncellemesi) · \`ks-kart-sirasi\` 33 (sayı güncellemesi) · \`ks-dongu28\` +20 yeni · diğer 47 süit aynen.

## Son Kabul

Havuz kartları geniş ekranda iki sütun zigzag dizilmeli (1 sol, 2 sağ, 3 sol…) ve ortada tek ince dikey çizgi olmalı; günlük çizelgede o gün dersi olmayan, uygun boşluğu olan öğretmenler \`Boş\` etiketiyle, kilitli saatleri gri gösterilerek listelenmeli ve boş saatlerine kart/istek bırakılabilmeli — **kullanıcı görsel kontrolü ile (Ctrl+Shift+R)**.
`;

appendFileSync("CHECKPOINT.md", kayit);
console.log("CHECKPOINT.md'ye DÖNGÜ-28 kaydı eklendi");
