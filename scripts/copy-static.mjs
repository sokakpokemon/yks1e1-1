/* DAĞITIM-DÜZELTME: postbuild statik kopyalama.
   Vite build'i yalnız dist/index.html + assets/ üretir; kökteki app.js,
   ek-ders.js ve vendor/* dist'e girmez → canlıda SPA fallback HTML döner
   (stilsiz site). Bu script build'den SONRA koşar (package.json postbuild)
   ve dosyaları byte-birebir kopyalar. Kaynaklar kökte kalır.

   D41: kök → dist/ **ve** public/ senkronlanır (aynı 8 varlık). Böylece
   app.js güncellenince public/app.js bayat kalmaz; publish-guard'ın
   "public kökle senkron" kontrolü yanlış alarm üretmez. */
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";

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

const sha = async (p) =>
  createHash("sha256").update(new Uint8Array(await readFile(p))).digest("hex");

const HEDEFLER = ["dist", "public"]; /* D41: kök → dist + public senkron */

for (const hedef of HEDEFLER) {
  for (const dosya of DOSYALAR) {
    mkdirSync(dirname(join(hedef, dosya)), { recursive: true });
    copyFileSync(dosya, join(hedef, dosya));
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
console.log("copy-static: " + DOSYALAR.length + " dosya × " + HEDEFLER.length + " hedef (dist+public) byte-birebir kopyalandı.");
