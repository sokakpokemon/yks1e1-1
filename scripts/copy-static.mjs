/* DAĞITIM-DÜZELTME: postbuild statik kopyalama.
   Vite build'i yalnız dist/index.html + assets/ üretir; kökteki app.js,
   ek-ders.js ve vendor/* dist'e girmez → canlıda SPA fallback HTML döner
   (stilsiz site). Bu script build'den SONRA koşar (package.json postbuild)
   ve dosyaları byte-birebir kopyalar. Kaynaklar kökte kalır. */
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
];

const sha = async (p) =>
  createHash("sha256").update(new Uint8Array(await readFile(p))).digest("hex");

for (const dosya of DOSYALAR) {
  mkdirSync(dirname(join("dist", dosya)), { recursive: true });
  copyFileSync(dosya, join("dist", dosya));
}

/* byte-birebirlik kanıtı */
let tamam = true;
for (const dosya of DOSYALAR) {
  const s = await sha(dosya);
  const d = await sha(join("dist", dosya));
  if (s !== d) { console.error("SHA UYUŞMADI: " + dosya); tamam = false; }
  else console.log("OK  " + dosya + "  " + s.slice(0, 12) + "…  (" + statSync(dosya).size + " B)");
}
if (!tamam) process.exit(1);
console.log("copy-static: " + DOSYALAR.length + " dosya byte-birebir kopyalandı.");
