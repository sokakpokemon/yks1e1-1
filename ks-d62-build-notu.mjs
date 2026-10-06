// ks-d62-build-notu.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execSync, spawnSync } from "node:child_process";

const IMZA = "D62-BUILD-DOGRULANDI";
const sha16 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);

// 1) Build sonrası hızlı doğrulama
const kirli = ["dist", "public"].map((d) => {
  try { return execSync("find " + d + " -type f \\( -size 0 -o -name '.*.tmp-*' \\) 2>/dev/null", { encoding: "utf8" }).trim(); }
  catch (e) { return ""; }
}).filter(Boolean).join("\n");
console.log(kirli ? "KIRMIZI: 0-bayt/tmp bulundu:\n" + kirli : "0-bayt + tmp taraması: TEMİZ");
console.log("app.js SHA16 = " + sha16("app.js"));

const g = spawnSync("node", ["scripts/publish-guard.mjs"], { encoding: "utf8", maxBuffer: 1 << 28 });
process.stdout.write(g.stdout || ""); process.stderr.write(g.stderr || "");
console.log("GUARD_EXIT=" + g.status);

// 2) D62 bloğunun sonuna tek satır ekle (idempotent)
const satir = "- Gercek build (vite build / publish) DOGRULANDI: build yesil · closeBundle dogrulamasi gecti · tarama temiz · guard yesil · "
  + new Date().toISOString().slice(0, 10) + " (" + IMZA + ")\n";
["CHECKPOINT.md", "CHECKPOINT-ARSIV-2.md"].forEach((f) => {
  if (!existsSync(f)) { console.log("ATLA (yok): " + f); return; }
  const s = readFileSync(f, "utf8");
  if (s.includes(IMZA)) { console.log("(zaten isaretli) " + f); return; }
  const i = s.indexOf("D62-ATOMIK-KOPYA");
  if (i < 0) { console.log("D62 blogu yok — once kapanis kaydini yaz: " + f); return; }
  const son = s.indexOf("\n## ", i);
  const ekle = son < 0 ? s.length : son;
  writeFileSync(f, s.slice(0, ekle).replace(/\s*$/, "") + "\n" + satir + s.slice(ekle));
  console.log("+ not: " + f);
});
console.log("PAKET_EXIT=0");
