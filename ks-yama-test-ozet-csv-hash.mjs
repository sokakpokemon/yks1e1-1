/* ks-yama-test-ozet-csv-hash.mjs — TEST-HASH-DARALTMA (assert'li, idempotent)
   Yalnızca ks-ekders-ozet-csv.mjs içindeki TEK aşırı geniş dondurma assertion'ını
   (haftalikOgrtTablo fonksiyonunun TÜM gövdesini backup'a karşı byte-hash ile kilitleyen
   kontrol) daha KESİN davranış assertion'larıyla değiştirir. Diğer tüm testlere dokunulmaz.
   2. koşu: exit 2 "Zaten uygulanmış" — dosya değiştirilmez. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const DOSYA = "ks-ekders-ozet-csv.mjs";
const once = readFileSync(DOSYA, "utf8");
const onceSha = sha(once);

const ESKI = `t("haftalikOgrtTablo kodu değişmedi", sha(blok("function haftalikOgrtTablo() {")) === sha(bakBlok(bakKaynak, "function haftalikOgrtTablo() {")));`;
const YENI = `/* PAZAR-BIREBIR-GORUNUM-YAMASI sonrası haftalikOgrtTablo gövdesi meşru olarak değişti
   (Pazar normal gün satırı + birebir kartta tam ad/konu/sınıf). Aşırı geniş byte-hash dondurması
   yerine daha kesin davranış garantileri: fonksiyon imzası + Ek Ders aktif-dönem filtresi +
   Ek Ders amber etiketi + durumRenk (birebir mavi/emerald) + grup üye satırı KORUNUR; ve
   backup'a göre fark yalnızca PAZAR-BIREBIR işaretli satırlarla sınırlıdır. */
const hotBlok = blok("function haftalikOgrtTablo() {");
t("haftalikOgrtTablo imzası değişmedi", hotBlok.startsWith("function haftalikOgrtTablo() {"));
t("haftalikOgrtTablo aktifDonemKayitlari(DB.ekDersler) filtresi KORUNDU", /aktifDonemKayitlari\\(Array\\.isArray\\(DB\\.ekDersler\\) \\? DB\\.ekDersler : \\[\\]\\)/.test(hotBlok));
t("haftalikOgrtTablo Ek Ders amber etiketi KORUNDU", hotBlok.includes("bg-amber-100") && hotBlok.includes("Ek Ders"));
t("haftalikOgrtTablo birebir durumRenk (mavi/emerald) KORUNDU", hotBlok.includes('bg-blue-50 border-blue-200') && hotBlok.includes('bg-emerald-50 border-emerald-200'));
t("haftalikOgrtTablo grup üye satırı KORUNDU", hotBlok.includes("grupUyeEtiketleri(ders)"));
t("haftalikOgrtTablo diff'i yalnız PAZAR-BIREBIR işaretli bölgede", (() => {
  const eskiBlok = bakBlok(bakKaynak, "function haftalikOgrtTablo() {");
  const satirlarEski = eskiBlok.split("\\n");
  const satirlarYeni = hotBlok.split("\\n");
  const farkli = satirlarYeni.filter((s) => !satirlarEski.includes(s));
  return farkli.every((s) => s.includes("PAZAR-BIREBIR-GORUNUM-YAMASI") || s.includes("PAZAR-BIREBIR") || s.includes("tamAd") || s.includes("hucreKonu"));
})());`;

if (once.includes("PAZAR-BIREBIR-GORUNUM-YAMASI sonrası haftalikOgrtTablo")) {
  console.log("Zaten uygulanmış (TEST-HASH-DARALTMA işareti mevcut) — dosya değiştirilmedi.");
  process.exit(2);
}

/* Eski assertion metni TAM eşleşmeli; aksi halde yazma iptal. */
const n = once.split(ESKI).length - 1;
if (n !== 1) {
  console.error(`ASSERT BAŞARISIZ: eski assertion tam eşleşmedi (${n} bulundu, 1 beklenir) — yazma İPTAL.`);
  process.exit(1);
}
const sonra = once.split(ESKI).join(YENI);

/* Yazma öncesi assert'ler */
const asserts = [
  ["TEST-HASH-DARALTMA işareti eklendi", sonra.includes("PAZAR-BIREBIR-GORUNUM-YAMASI sonrası haftalikOgrtTablo")],
  ["Aşırı geniş byte-hash assertion kaldırıldı", !sonra.includes('sha(blok("function haftalikOgrtTablo() {")) === sha(bakBlok')],
  ["Diğer 9 hash assertion dokunulmadı (gunlukTablo dahil)", (sonra.match(/=== sha\(bakBlok\(bakKaynak/g) || []).length === 9],
  ["Toplam assertion sayısı arttı (zayıflatma yok)", (sonra.match(/^t\(/gm) || []).length > (once.match(/^t\(/gm) || []).length],
];
let hata = 0;
for (const [ad, ok] of asserts) { console.log((ok ? "  ✓ " : "  ✗ ") + ad); if (!ok) hata = 1; }
if (hata) { console.error("ASSERT BAŞARISIZ — dosya YAZILMADI."); process.exit(1); }

/* Backup: mevcut backup varsa ÜZERİNE YAZMA */
const yedek = DOSYA + ".hash-daraltma-oncesi.bak";
if (!existsSync(yedek)) copyFileSync(DOSYA, yedek);
writeFileSync(DOSYA, sonra);
console.log("Yama uygulandı → " + DOSYA);
console.log("Yedek: " + yedek + " · " + (existsSync(yedek) ? readFileSync(yedek).length : 0) + " bayt · SHA-256 " + sha(readFileSync(yedek, "utf8")));
console.log(DOSYA + ": " + onceSha.slice(0, 16) + "… → " + sha(sonra).slice(0, 16) + "…");
