/* ks-yama-suite-sayi.mjs — ks-index-kimlik eklenince toplam süit sayısı 51 → 52 olur.
   ks-kart-sirasi #33 yazdığı ada "→ 51" gömüyor; donmuş liste + elle listesi tek satır güncellenir.
   elle-vaka-adlari-base.mjs (133 KB) DEĞİŞMEZ — sarmalayıcıdaki offsetDuzelt ile hedefli düzeltilir. */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";

const ESKI_AD = "süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) → 51";
const YENI_AD = "süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) → 52";

/* 1) elle-vaka-adlari.mjs sarmalayıcısına hedefli yeniden adlandırma */
{
  const f = "elle-vaka-adlari.mjs";
  const s = readFileSync(f, "utf8");
  if (s.includes('"→ 52"')) { console.error("Zaten uygulanmış (→ 52)."); process.exit(2); }
  /* ESKI_AD base listesinde yaşar; offsetDuzelt çalışma anında orada arar ve bulunamazsa hata verir. */
  const ek = `
/* YENİ SÜİT (ks-index-kimlik.mjs) sonrası toplam süit 51 → 52; yazdığa gömülü sayı güncellendi. */
offsetDuzelt("ks-kart-sirasi.mjs", "${ESKI_AD}", "${YENI_AD}");
`;
  const b = f + ".suite-sayi-oncesi.bak";
  if (!existsSync(b)) copyFileSync(f, b);
  writeFileSync(f, s + ek);
  console.log(`  · ${f}: ks-kart-sirasi adı → 52`);
}

/* 2) donmuş vaka listesi */
{
  const f = "suit-vakalar/ks-kart-sirasi.mjs.txt";
  const satirlar = readFileSync(f, "utf8").split("\n");
  const kalan = satirlar.filter((l) => l !== ESKI_AD);
  if (satirlar.length - kalan.length !== 1) { console.error("DUR: txt'de ad 1 kez geçmeli."); process.exit(1); }
  const i = satirlar.indexOf(ESKI_AD);
  satirlar[i] = YENI_AD;
  const b = f + ".suite-sayi-oncesi.bak";
  if (!existsSync(b)) copyFileSync(f, b);
  writeFileSync(f, satirlar.join("\n"));
  console.log(`  · ${f}: → 51 → → 52`);
}
console.log("TAMAM: süit sayısı 52'ye hizalandı.");
