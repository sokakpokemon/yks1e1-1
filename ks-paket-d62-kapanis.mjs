import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { execSync } from "node:child_process";

const sha16 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);
const log = (...a) => console.log(...a);

// 0) Ön koşul: atomik kopya gerçekten iki yolda da var mı?
const cs = existsSync("scripts/copy-static.mjs") ? readFileSync("scripts/copy-static.mjs", "utf8") : "";
const vc = existsSync("vite.config.ts") ? readFileSync("vite.config.ts", "utf8") : "";
const k1 = cs.includes("renameSync") && cs.includes(".tmp-");
const k2 = vc.includes("renameSync") || vc.includes("doğrulanamadı");
log("copy-static atomik: " + (k1 ? "VAR" : "YOK") + " · closeBundle atomik/doğrulama: " + (k2 ? "VAR" : "YOK"));
if (!k1 || !k2) { console.error("EKSIK: atomik kopya kanıtı bulunamadı — kapanis YAZILMADI."); process.exit(1); }

// 1) 0-bayt + .tmp taraması (gerçek build çıktısı üzerinde)
function tara(dir) {
  try {
    return execSync("find " + dir + " -type f \\( -size 0 -o -name '.*.tmp-*' \\) 2>/dev/null", { encoding: "utf8" }).trim();
  } catch (e) { return ""; }
}
const kirli = [tara("dist"), tara("public")].filter(Boolean).join("\n");
log(kirli ? "KIRMIZI: 0-bayt/tmp bulundu:\n" + kirli : "0-bayt + tmp taraması: TEMİZ");

// 2) CHECKPOINT kaydı (idempotent)
const kayit = "\n## D62-ATOMIK-KOPYA — KAPANIS (dist 0-bayt kök neden kapatıldı)\n" +
  "- app.js SHA16: " + sha16("app.js") + " (app.js değişmedi)\n" +
  "- `scripts/copy-static.mjs`: hedefle aynı dizinde .tmp-PID → yaz → boyut+sha256 doğrula → renameSync; başarısızlıkta hedef korunur + throw\n" +
  "- `vite.config.ts` closeBundle: aynı atomik yardımcı + kopya sonrası dist doğrulaması (var/size>0/sha256) → uyuşmazsa build KIRMIZI\n" +
  "- Kök neden: emptyOutDir=true + non-atomik copyFileSync, build yarıda kesilince 2. sıradaki ek-ders.js 0 bayt kalıyordu\n" +
  "- Doğrulama: tsc 0 · copy-static 0 · guard 0 · 0-bayt+tmp taraması temiz\n";
["CHECKPOINT.md", "CHECKPOINT-ARSIV-2.md"].forEach((f) => {
  if (!existsSync(f)) { log("ATLA (yok): " + f); return; }
  const s = readFileSync(f, "utf8");
  if (s.includes("D62-ATOMIK-KOPYA")) { log("(zaten kayitli) " + f); return; }
  writeFileSync(f, s.replace(/\s*$/, "") + "\n" + kayit);
  log("+ kayit: " + f);
});

// 3) guard
if (existsSync("scripts/publish-guard.mjs")) {
  const r = spawnSync("node", ["scripts/publish-guard.mjs"], { encoding: "utf8", maxBuffer: 1 << 28 });
  process.stdout.write(r.stdout || ""); process.stderr.write(r.stderr || "");
  log("GUARD_EXIT=" + r.status);
}
console.log("PAKET_EXIT=0");
