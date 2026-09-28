/* scripts/publish-guard.mjs — PUBLISH ÖNCESİ KALKAN (HIZ PROTOKOLÜ kural (f)).
   D40-GUARD-HARDEN: güçlendirilmiş sürüm. Guard YALNIZ doğrular, ASLA onarmaz
   (onarım copy-static'in işi). Kök = doğruluk kaynağı; beklenen SHA/damga
   dosyadan CANLI hesaplanır — sabit (hardcoded) beklenen değer YOK.

   Kontroller (herhangi biri kırmızı → exit 1; her düşen dosya için tek satır gerekçe):
     1) Zorunlu kök varlıklar MEVCUT ve size > 0; 0 bayt / boş-SHA (e3b0c442…) RED.
     2) Her varlık için kök SHA-256 == dist SHA-256 (app.js · ek-ders.js · vendor/* · font).
     3) public/app.js + public/ek-ders.js kökle byte-birebir (Vite publicDir sızıntısı).
     4) isolate kök kopyaları kökle byte-birebir (publish kopyası).
     5) index.html + dist/index.html + isolate/index.html ?v= damgaları == app.js SHA16
        ve ek-ders.js SHA16.

   Kullanım: node scripts/publish-guard.mjs   (YEŞİL = exit 0) */
import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const BOS_SHA = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; /* boş dosyanın SHA-256'sı */
const VARLIKLAR = [
  "app.js",
  "ek-ders.js",
  "vendor/tailwind.js",
  "vendor/fontawesome.css",
  "vendor/fonts.css",
  "vendor/html2canvas.js",
  "vendor/chart.js",
  "vendor/fonts/montserrat-900-italic.woff2",
];
const DAMGA_DOSYALARI = ["index.html", "dist/index.html", "isolate/index.html"];
const hatalar = [];

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");

/* Var + size > 0 + boş-SHA kapısı; geçerliyse SHA döner, değilse null (kırmızıyı yazar). */
function varlikSha(dosya, bosNeden) {
  if (!existsSync(dosya)) { hatalar.push(dosya + " YOK — " + bosNeden); return null; }
  if (statSync(dosya).size === 0) { hatalar.push(dosya + " 0 BAYT — " + bosNeden); return null; }
  const s = sha(dosya);
  if (s === BOS_SHA) { hatalar.push(dosya + " boş-SHA (e3b0c442…) — " + bosNeden); return null; }
  return s;
}

/* 1) kök varlıklar (doğruluk kaynağı) */
const kokSha = {};
for (const f of VARLIKLAR) {
  const s = varlikSha(f, "kök varlık boş (kaynak bozuk)");
  if (s) kokSha[f] = s;
}

/* 2) dist kopyaları kökle byte-birebir (app.js · ek-ders.js · vendor/* · font) */
for (const f of VARLIKLAR) {
  const ds = varlikSha("dist/" + f, "copy-static çalıştır");
  if (ds && kokSha[f] && ds !== kokSha[f]) {
    hatalar.push("dist/" + f + " SHA ≠ kök " + f + " (" + ds.slice(0, 16) + " ≠ " + kokSha[f].slice(0, 16) + ") — copy-static çalıştır");
  }
}

/* 3) public kopyaları (Vite publicDir dist köküne kopyalar — eski kopya sızmasın) */
for (const f of ["app.js", "ek-ders.js"]) {
  const ps = varlikSha("public/" + f, "cp " + f + " public/" + f + " ile ekle");
  if (ps && kokSha[f] && ps !== kokSha[f]) {
    hatalar.push("public/" + f + " kökle senkron değil (" + ps.slice(0, 16) + " ≠ " + kokSha[f].slice(0, 16) + ") — cp " + f + " public/" + f);
  }
}

/* 4) isolate kopyaları (publish kopyası kökle byte-birebir olmalı) */
for (const f of VARLIKLAR) {
  const is = varlikSha("isolate/" + f, "isolate senkronu çalıştır");
  if (is && kokSha[f] && is !== kokSha[f]) {
    hatalar.push("isolate/" + f + " kökle senkron değil (" + is.slice(0, 16) + " ≠ " + kokSha[f].slice(0, 16) + ") — isolate senkronu çalıştır");
  }
}

/* 5) ?v= damgaları — canlı SHA16 (hardcoded beklenen değer YOK) */
if (kokSha["app.js"] && kokSha["ek-ders.js"]) {
  const app16 = kokSha["app.js"].slice(0, 16);
  const ek16 = kokSha["ek-ders.js"].slice(0, 16);
  for (const h of DAMGA_DOSYALARI) {
    if (!existsSync(h)) { hatalar.push(h + " YOK — damga doğrulanamıyor"); continue; }
    const html = readFileSync(h, "utf8");
    if (!html.includes('src="app.js?v=' + app16 + '"')) hatalar.push(h + " app.js damgası ≠ app.js SHA16 (" + app16 + ")");
    if (!html.includes('src="ek-ders.js?v=' + ek16 + '"')) hatalar.push(h + " ek-ders.js damgası ≠ ek-ders.js SHA16 (" + ek16 + ")");
  }
}

if (hatalar.length) {
  console.error("PUBLISH-GUARD KIRMIZI — publish YOK:\n  - " + hatalar.join("\n  - "));
  process.exit(1);
}
console.log("PUBLISH-GUARD YEŞİL: " + VARLIKLAR.length + " varlık kök=dist=isolate byte-birebir; public/app.js+ek-ders.js kökle senkron; index.html+dist+isolate damgaları = SHA16.");
