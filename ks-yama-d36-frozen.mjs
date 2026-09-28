/* ks-yama-d36-frozen.mjs — D36-ANA-SATIR: DONMUŞ LİSTELER (yalnız DEĞİŞEN satırlar, elle yazıldı).
   Kapsam: suit-vakalar/ks-gunluk-ders-tasi.mjs.txt (114 → 120) ve
           suit-vakalar/ks-dongu28.mjs.txt (26; 1 ad güncellendi).
   Marker: D36-FROZEN-TXT → ikinci koşumda exit 2 (yazmaz). Koşumdan otomatik üretim YOK:
   adlar/konumlar elle yazılır ve sayı iddialarıyla doğrulanır. */
import { readFileSync, writeFileSync } from "node:fs";

const MARKER = "D36 ana satır: sınıf dersi hücresi GERÇEK sınıf adı chip'i";
const F1 = "suit-vakalar/ks-gunluk-ders-tasi.mjs.txt";
const F2 = "suit-vakalar/ks-dongu28.mjs.txt";

let a = readFileSync(F1, "utf8");
let b = readFileSync(F2, "utf8");
if (a.includes(MARKER)) { console.error("ZATEN UYGULANMIŞ — yazmadan çıkılıyor."); process.exit(2); }

const satirlar = (s) => s.split("\n");
if (satirlar(a).length - 1 !== 114) { console.error("F1 satır sayısı beklenen 114, bulunan " + (satirlar(a).length - 1)); process.exit(1); }

/* 1) 4 RED vakasının adı: "Sınıf Dersi hedefi (avail.sinif) → RED: X" → "D36 ana satır sınıf chip hücresi (avail.sinif) → RED: X" */
const eskiAd = "Sınıf Dersi hedefi (avail.sinif) → RED: ";
const yeniAd = "D36 ana satır sınıf chip hücresi (avail.sinif) → RED: ";
const adSayisi = a.split(eskiAd).length - 1;
if (adSayisi !== 4) { console.error("F1 RED adı beklenen 4, bulunan " + adSayisi); process.exit(1); }
a = a.split(eskiAd).join(yeniAd);

/* 2) chip/kilit iddiaları: ilk RED adından ÖNCE (Kapalı bloğundan hemen sonra) */
const ilkRed = yeniAd + "localStorage byte-birebir aynı\n";
if (a.split(ilkRed).length - 1 !== 1) { console.error("F1 ilk RED satırı tekil değil"); process.exit(1); }
a = a.replace(ilkRed,
  "D36 ana satır: sınıf dersi hücresi GERÇEK sınıf adı chip'i (haftalıkla AYNI üretici + AYNI markup)\n" +
  "D36 ana satır: chip hücresi KİLİTLİ — dnd-bos/drop-zone/draggable YOK, literal 'Sınıf' YOK\n" +
  ilkRed);

/* 3) red() SONRASI iddialar: son RED adından SONRA */
const sonRed = yeniAd + "ders yerinde kaldı\n";
if (a.split(sonRed).length - 1 !== 1) { console.error("F1 son RED satırı tekil değil"); process.exit(1); }
a = a.replace(sonRed, sonRed +
  "D36 ana satır: bırakma REDDİ sonrası ders 6. slotta kaldı (tek kayıt, kopya YOK)\n" +
  "D36 ana satır: boş sınıf adı → T satırında chip YOK + literal 'Sınıf' YOK + mevcut '+' drop-zone korunur\n" +
  "D36 regresyon: mola hücresi hâlâ drop-zone DEĞİL, birebir hücresi hâlâ draggable (ana satır chip'i bunları değiştirmedi)\n" +
  "D36 tek üretici korunuyor: chip markup literali kaynakta TAM 1 · sinifChipHTML çağrısı 3 (haftalık + günlük Boş satırı + günlük ANA satır)\n");

const yeniSayi = satirlar(a).length - 1;
if (yeniSayi !== 120) { console.error("F1 yeni satır sayısı beklenen 120, bulunan " + yeniSayi); process.exit(1); }

/* 4) ks-dongu28: "çağrı 2 (haftalık+günlük)" → "çağrı 3 (haftalık + günlük Boş satırı + günlük ANA satır)" */
const eski28 = "tek üretici: sinifChipHTML tanımı 1 · chip markup literali 1 · çağrı 2 (haftalık+günlük)";
const yeni28 = "tek üretici: sinifChipHTML tanımı 1 · chip markup literali 1 · çağrı 3 (haftalık + günlük Boş satırı + günlük ANA satır)";
if (b.split(eski28).length - 1 !== 1) { console.error("F2 eski ad bulunamadı/tekil değil"); process.exit(1); }
b = b.split(eski28).join(yeni28);
if (satirlar(b).length - 1 !== 26) { console.error("F2 satır sayısı 26 değil"); process.exit(1); }

writeFileSync(F1, a, "utf8");
writeFileSync(F2, b, "utf8");
console.log("✓ " + F1 + ": 114 → 120 (4 ad güncellendi, 6 ad eklendi)");
console.log("✓ " + F2 + ": 26 (1 ad güncellendi)");
