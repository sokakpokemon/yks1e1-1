/* DAĞITIM-DÜZELTME: postbuild statik kopyalama.
   Vite build'i yalnız dist/index.html + assets/ üretir; kökteki app.js,
   ek-ders.js ve vendor/* dist'e girmez → canlıda SPA fallback HTML döner
   (stilsiz site). Bu script build'den SONRA koşar (package.json postbuild)
   ve dosyaları byte-birebir kopyalar. Kaynaklar kökte kalır.

   D41: kök → dist/ **ve** public/ senkronlanır (aynı 8 varlık). Böylece
   app.js güncellenince public/app.js bayat kalmaz; publish-guard'ın
   "public kökle senkron" kontrolü yanlış alarm üretmez.

   D62: kopyalama ATOMİK. Eski copyFileSync hedefi yerinde açıp yazıdığı
   için (ağ/pan/zaman aşımı durumunda) 0-bayt/kısmi hedef kalabiliyordu —
   dist/ek-ders.js 0 BAYT olayının kök nedeni. Artık: hedefle AYNI dizinde
   benzersiz geçici dosya → writeFileSync → boyut+sha256 doğrula →
   renameSync (tek atomik adım). Kaynak 0 bayt ya da doğrulama başarısızsa
   geçici silinir, MEVCUT HEDEF KORUNUR, script throw/exit ile kırmızı düşer. */
import { mkdirSync, statSync, writeFileSync, renameSync, rmSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname, basename } from "node:path";

const DOSYALAR = [
  "app.js",
  "ek-ders.js",
  "vendor/tailwind.js",
  "vendor/fontawesome.css",
  "vendor/fonts.css",
  "vendor/html2canvas.js",
  "vendor/chart.js",
  "vendor/fonts/montserrat-900-italic.woff2",
];

const shaBuf = (b) => createHash("sha256").update(b).digest("hex");
const sha = async (p) => shaBuf(new Uint8Array(await readFile(p)));

/* ATOMİK KOPYA: geçici dosya hedefle AYNI dizinde (aynı FSY içinde rename
   atomiktir). Yazı → DOĞRULA → RENAME sırası: hedefe asla yarı
   yazılmış/0-bayt içerik ulaşmaz. */
const kopyalaAtomik = (kaynak, hedef) => {
  const icerik = readFileSync(kaynak); // Buffer
  if (icerik.length === 0) {
    throw new Error("0 BAYT KAYNAK REDDEDİLDİ: " + kaynak + " → " + hedef + " (mevcut hedef korundu)");
  }
  const gecici = join(dirname(hedef), "." + basename(hedef) + ".tmp-" + process.pid);
  try {
    writeFileSync(gecici, icerik);
    const geri = readFileSync(gecici);
    if (geri.length !== icerik.length || shaBuf(geri) !== shaBuf(icerik)) {
      throw new Error("DOĞRULAMA BAŞARISIZ: " + gecici + " → " + hedef);
    }
    renameSync(gecici, hedef); // atomik: hedef yalnız bu noktada değişir
  } catch (e) {
    rmSync(gecici, { force: true }); // geçiciyi sil, mevcut hedefi KORU
    throw e;
  }
};

const HEDEFLER = ["dist", "public"]; /* D41: kök → dist + public senkron */

for (const hedef of HEDEFLER) {
  for (const dosya of DOSYALAR) {
    mkdirSync(join(hedef, dirname(dosya)), { recursive: true });
    kopyalaAtomik(dosya, join(hedef, dosya));
  }
}

/* byte-birebirlik kanıtı (her hedef için) */
let tamam = true;
for (const dosya of DOSYALAR) {
  const s = await sha(dosya);
  for (const hedef of HEDEFLER) {
    const h = await sha(join(hedef, dosya));
    if (s !== h) { console.error("SHA UYUŞMADI: " + hedef + "/" + dosya); tamam = false; }
    else console.log("OK  " + hedef + "/" + dosya + "  " + s.slice(0, 12) + "…  (" + statSync(dosya).size + " B)");
  }
}
if (!tamam) process.exit(1);
console.log("copy-static: " + DOSYALAR.length + " dosya × " + HEDEFLER.length + " hedef (dist+public) ATOMİK kopyalandı (yazı→doğrula→rename).");
