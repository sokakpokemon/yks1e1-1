/* scripts/publish-guard.mjs — PUBLISH ÖNCESİ KALKAN (HIZ PROTOKOLÜ kural (f)).
   Publish'ten önce `node scripts/publish-guard.mjs` YEŞİL olmalı; değilse exit 1.

   Kontroller:
     1) dist/app.js SHA-256 == kök app.js SHA-256
     2) dist/ek-ders.js SHA-256 == kök ek-ders.js SHA-256
     3) dist/index.html'deki app.js damgası == kök app.js SHA-256 ilk 16 hane
     4) dist/index.html'deki ek-ders.js damgası == kök ek-ders.js SHA-256 ilk 16 hane
     5) public/app.js SHA-256 == kök app.js SHA-256 (eski public kopyası Vite
        publicDir ile dist'e sızıp postbuild'i atlatmasın)
     6) public/ek-ders.js SHA-256 == kök ek-ders.js SHA-256

   Amaç: postbuild/prebuild koşmasa bile "dist eski public/ kopyası" drift'i sessizce
   publish edilmesin (DÖNGÜ-30-CACHE canlı drift'inin kök nedeni). */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const hatalar = [];

if (!existsSync("app.js") || !existsSync("ek-ders.js")) {
  hatalar.push("kök app.js veya ek-ders.js yok");
} else if (!existsSync("dist/index.html")) {
  hatalar.push("dist/index.html yok (önce `bun run build`)");
} else {
  const appSha = sha("app.js");
  const ekSha = sha("ek-ders.js");
  const app16 = appSha.slice(0, 16);
  const ek16 = ekSha.slice(0, 16);

  if (!existsSync("dist/app.js")) hatalar.push("dist/app.js yok");
  else if (sha("dist/app.js") !== appSha) hatalar.push("dist/app.js SHA ≠ kök app.js SHA (" + sha("dist/app.js").slice(0, 16) + " ≠ " + app16 + ")");

  if (!existsSync("dist/ek-ders.js")) hatalar.push("dist/ek-ders.js yok");
  else if (sha("dist/ek-ders.js") !== ekSha) hatalar.push("dist/ek-ders.js SHA ≠ kök ek-ders.js SHA (" + sha("dist/ek-ders.js").slice(0, 16) + " ≠ " + ek16 + ")");

  /* public/ kopyaları: Vite publicDir'i dist köküne kopyalar; postbuild
     copy-static koşmazsa eski public/x.js canlıya sızar (DÖNGÜ-30-CACHE drift'i). */
  if (!existsSync("public/app.js")) hatalar.push("public/app.js yok — cp app.js public/app.js ile ekle");
  else if (sha("public/app.js") !== appSha) hatalar.push("public/app.js kökle senkron değil — cp app.js public/app.js ile eşitle (" + sha("public/app.js").slice(0, 16) + " ≠ " + app16 + ")");

  if (!existsSync("public/ek-ders.js")) hatalar.push("public/ek-ders.js yok — cp ek-ders.js public/ek-ders.js ile ekle");
  else if (sha("public/ek-ders.js") !== ekSha) hatalar.push("public/ek-ders.js kökle senkron değil — cp ek-ders.js public/ek-ders.js ile eşitle (" + sha("public/ek-ders.js").slice(0, 16) + " ≠ " + ek16 + ")");

  const html = readFileSync("dist/index.html", "utf8");
  if (!html.includes('src="app.js?v=' + app16 + '"')) hatalar.push("dist/index.html app.js damgası ≠ app.js SHA16 (" + app16 + ")");
  if (!html.includes('src="ek-ders.js?v=' + ek16 + '"')) hatalar.push("dist/index.html ek-ders.js damgası ≠ ek-ders.js SHA16 (" + ek16 + ")");
}

if (hatalar.length) {
  console.error("PUBLISH-GUARD KIRMIZI — publish YOK:\n  - " + hatalar.join("\n  - "));
  process.exit(1);
}
console.log("PUBLISH-GUARD YEŞİL: dist + public app.js/ek-ders.js kökle birebir; index.html damgaları = SHA16.");
