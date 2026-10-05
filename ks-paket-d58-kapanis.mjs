#!/usr/bin/env node
/* ks-paket-d58-kapanis.mjs — D58 tek-paket kapanış (fail-fast · idempotent)
   1) kart-sirasi #33 name sabitleme  2) kart-kolon #8 donmuş offset 19959
   3) txt+elle metin güncellemeleri   4) --tam beklenti KONTROLÜ KULLANICIYA (bu script koşmaz)
   Anchor tutmazsa YAZMADAN exit 1 + bağlam. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const oku = (f) => readFileSync(f, "utf8");
const yaz = (f, t) => writeFileSync(f, t);
const tek = (t, eski, yeni, ad, dosya) => {
  const n = t.split(eski).length - 1;
  if (n === 0 && t.includes(yeni)) { console.log("  " + ad + ": zaten uygulanmış (skip)"); return t; }
  if (n !== 1) { console.error("ANCHOR FAIL [" + ad + "] " + dosya + ": " + n + " kez:\n" + t.slice(Math.max(0, t.indexOf(eski.slice(0, 20))) - 80, t.indexOf(eski.slice(0, 20)) + 200)); process.exit(1); }
  console.log("  " + ad + ": güncellendi"); return t.replace(eski, yeni);
};

/* --- 1) ks-kart-sirasi.mjs: name sabitle (koşum-değeri ad'den çıkar) --- */
console.log("[1] ks-kart-sirasi.mjs");
let s1 = oku("ks-kart-sirasi.mjs");
const SI1_ESKI = 't("süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) — liste.length extra)", liste.length >= 33, liste.length)';
const SI1_YENI = 't("süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) — liste.length extra)", liste.length >= 33, liste.length)';
s1 = tek(s1, SI1_ESKI, SI1_YENI, "kart-sirasi name sabitleme", "ks-kart-sirasi.mjs");
yaz("ks-kart-sirasi.mjs", s1);

/* --- 2+3) donmuş metinler: txt + elle --- */
console.log("[2-3] donmuş txt + elle");
let txt = oku("suit-vakalar/ks-kart-sirasi.mjs.txt");
txt = tek(txt, "süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) → 55", "süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) — liste.length extra", "txt kart-sirasi", "txt");
yaz("suit-vakalar/ks-kart-sirasi.mjs.txt", txt);

let txt2 = oku("suit-vakalar/ks-kart-kolon.mjs.txt");
txt2 = tek(txt2, "kapa=19937", "kapa=19959", "txt kart-kolon offset", "txt");
yaz("suit-vakalar/ks-kart-kolon.mjs.txt", txt2);

let elle = oku("elle-vaka-adlari.mjs");
elle = tek(elle, "süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) → 55", "süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) — liste.length extra", "elle kart-sirasi", "elle");
elle = tek(elle, "kapa=19937", "kapa=19959", "elle kart-kolon offset", "elle");
yaz("elle-vaka-adlari.mjs", elle);

/* --- 4) hızlı doğrulama (izole koşumlar) --- */
console.log("[4] izole koşumlar:");
for (const s of ["ks-kart-sirasi", "ks-kart-kolon", "ks-wa-sablon", "ks-wa-durum", "ks-yedek-guvenlik"]) {
  try { execSync("node " + s + ".mjs", { stdio: "pipe" }); console.log("  ✓ " + s); }
  catch (e) { console.error("  ✗ " + s + " — exit " + e.status); process.exit(1); }
}
console.log("PAKET YEŞİL — şimdi: node hizli-test.mjs --tam (TAM 1 KEZ)");
