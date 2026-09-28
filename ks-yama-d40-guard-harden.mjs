/* ks-yama-d40-guard-harden.mjs — D40-GUARD-HARDEN yaması (İDEMPOTENT · TEK yama dosyası).
   HEDEF: boş/uyumsuz bir varlığın publish edilmesini imkânsız kıl. Guard, build zincirinin
   SON adımı olarak otomatik koşsun; kırmızıysa build/deploy DURSUN. Guard YALNIZ doğrular,
   ASLA onarmaz (onarım copy-static'in işi).

   Yalnız 3 dosyaya dokunur:
     (a) scripts/publish-guard.mjs  → güçlendirilmiş kontroller (kök = doğruluk kaynağı, SABİT SHA YOK):
         zorunlu varlıklar var + size > 0 (0-bayt / boş-SHA e3b0c442… RED), kök SHA == dist SHA
         (app.js · ek-ders.js · vendor/* · font), public kopyaları kökle senkron, damgalar
         index.html + dist/index.html + isolate/index.html == app.js/ek-ders.js SHA16 (canlı).
     (b) package.json "postbuild": copy-static'in SONUNA guard eklendi → guard = zincirin son adımı.
     (c) CHECKPOINT.md HIZ PROTOKOLÜ (f) satırı yeni metinle güncellendi.

   DOKUNULMAZ: app.js · ek-ders.js · index.html · dist/ · testler · süit sayısı (55).

   İdempotent: marker (D40-GUARD-HARDEN) zaten varsa hiçbir şeye dokunmaz ve exit 0. */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const rapor = (etiket, dosya) => {
  if (!existsSync(dosya)) { console.log("  " + etiket.padEnd(6) + dosya + " YOK"); return; }
  const b = readFileSync(dosya);
  console.log("  " + etiket.padEnd(6) + dosya.padEnd(32) + String(b.length).padStart(7) + " B · sha256=" + sha256(b).slice(0, 16) + "…");
};

const GUARD = "scripts/publish-guard.mjs";
const PAKET = "package.json";
const CP = "CHECKPOINT.md";
const HEDEFLER = [GUARD, PAKET, CP];

/* ---- İDEMPOTANS: marker varsa dur ---- */
if (existsSync(GUARD) && readFileSync(GUARD, "utf8").includes("D40-GUARD-HARDEN")) {
  console.log("Zaten uygulanmış (D40-GUARD-HARDEN) — hiçbir şeye dokunulmadı.");
  process.exit(0);
}

/* ---- YEDEKTEN ÖNCE byte + SHA raporu ---- */
console.log("=== D40-GUARD-HARDEN · hedef durumu (yedekten ÖNCE) ===");
for (const d of HEDEFLER) rapor("ÖNCE", d);

/* ---- Yedek (dosya başına yalnız bir kez) ---- */
const YEDEKLER = [
  [GUARD, GUARD + ".d40-guard-harden-oncesi.bak"],
  [PAKET, "package.json.d40-guard-harden-oncesi.bak"],
  [CP, "CHECKPOINT.md.d40-guard-harden-oncesi.bak"],
];
for (const [kaynak, yedek] of YEDEKLER) {
  if (!existsSync(yedek)) { copyFileSync(kaynak, yedek); console.log("Yedek alındı : " + yedek); }
  else console.log("Yedek zaten var: " + yedek + " (yeni yedek YOK — HIZ PROTOKOLÜ A)");
}

/* ===================== (a) publish-guard.mjs: GÜÇLENDİR ===================== */
const yeniGuard = String.raw`/* scripts/publish-guard.mjs — PUBLISH ÖNCESİ KALKAN (HIZ PROTOKOLÜ kural (f)).
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
`;
writeFileSync(GUARD, yeniGuard, "utf8");
console.log("(a) " + GUARD + " güncellendi (" + Buffer.byteLength(yeniGuard, "utf8") + " B · sha16=" + sha256(yeniGuard).slice(0, 16) + ")");

/* ===================== (b) package.json: guard = zincirin SON adımı ===================== */
let paket = readFileSync(PAKET, "utf8");
const ESKI_PB = '"postbuild": "node scripts/copy-static.mjs"';
const YENI_PB = '"postbuild": "node scripts/copy-static.mjs && node scripts/publish-guard.mjs"';
if (paket.includes(YENI_PB)) {
  console.log("(b) postbuild zaten guard içeriyor (atlandı)");
} else {
  if (!paket.includes(ESKI_PB)) { console.error("(b) postbuild anchor bulunamadı — DUR"); process.exit(1); }
  if (paket.split(ESKI_PB).length !== 2) { console.error("(b) postbuild anchor tek değil — DUR"); process.exit(1); }
  paket = paket.replace(ESKI_PB, YENI_PB);
  writeFileSync(PAKET, paket, "utf8");
  console.log("(b) postbuild → " + YENI_PB);
}

/* ===================== (c) CHECKPOINT.md HIZ PROTOKOLÜ (f) ===================== */
let cp = readFileSync(CP, "utf8");
const ESKI_F = '- **(f) Publish öncesi `node scripts/publish-guard.mjs` YEŞİL olmadan publish YOK.** (dist/app.js + dist/ek-ders.js kökle birebir; dist/index.html damgaları = SHA16)';
const YENI_F = "- **(f) Vly build zincirinin SON adımı publish-guard olmalı; guard KIRMIZIysa build/deploy DURUR. Guard onarmaz, doğrular. Publish öncesi guard'ı elle koşmak tek başına yeterli kanıt DEĞİLDİR — guard build'in sonunda otomatik koşmalı.**";
if (cp.includes(YENI_F)) {
  console.log("(c) (f) satırı zaten güncel (atlandı)");
} else {
  if (!cp.includes(ESKI_F)) { console.error("(c) (f) anchor bulunamadı — DUR"); process.exit(1); }
  if (cp.split(ESKI_F).length !== 2) { console.error("(c) (f) anchor tek değil (" + (cp.split(ESKI_F).length - 1) + " adet) — DUR"); process.exit(1); }
  cp = cp.replace(ESKI_F, YENI_F);
  writeFileSync(CP, cp, "utf8");
  console.log("(c) HIZ PROTOKOLÜ (f) güncellendi");
}

/* ---- SONRA raporu ---- */
console.log("=== D40-GUARD-HARDEN · hedef durumu (yamadan SONRA) ===");
for (const d of HEDEFLER) rapor("SONRA", d);
console.log("D40-GUARD-HARDEN TAMAM · DOKUNULMADI: app.js · ek-ders.js · index.html · dist/ · testler · publish YOK");
