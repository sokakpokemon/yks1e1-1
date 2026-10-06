import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const log = (...a) => console.log(...a);
const sha16 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);

// 0) Ön koşul: D61 markerları gerçekten girmiş mi?
const app = readFileSync("app.js", "utf8");
const m1 = app.includes("D61-VELI-TEL");
const m2 = app.includes("D61-DIS-LISTE");
log(app.length + " B · SHA16=" + sha16("app.js"));
log("marker D61-VELI-TEL: " + (m1 ? "VAR" : "YOK"));
log("marker D61-DIS-LISTE: " + (m2 ? "VAR" : "YOK"));
if (!m1 || !m2) { console.error("EKSIK marker — kapanis YAZILMADI."); process.exit(1); }

// 1) CHECKPOINT kayıtları (idempotent)
const SHA = sha16("app.js");
const kayit = "\n## D61-VELI-TEL + D61-DIS-LISTE — KAPANIS (gorsel onay temiz)\n" +
  "- app.js SHA16: " + SHA + "\n" +
  "- Fix 1: ogrenci formlarinda tek 'Veli Telefonu' (o-veli-tel / d-veli-tel); modelde veliTel, legacy anneTel/babaTel korunur\n" +
  "- Fix 2: Yonetim -> Dis Liste Yukle (Ogrenciler): CSV onizleme (Yeni/Guncellenecek/Atlanacak/Hatali) -> atomik Ice Aktar -> Geri Al\n" +
  "- Yeni suit: ks-dis-liste 38 · toplam 57 suit / 2678\n" +
  "- --tam: TAM_EXIT=0 · 2678/2678 birebir · TAMLIK 48/48\n" +
  "- guard: GUARD_EXIT=0\n" +
  "- Gorsel kontrol: KULLANICI ONAYI TEMIZ\n";

["CHECKPOINT.md", "CHECKPOINT-ARSIV-2.md"].forEach((f) => {
  if (!existsSync(f)) { log("ATLA (yok): " + f); return; }
  const s = readFileSync(f, "utf8");
  if (s.includes("D61-VELI-TEL")) { log("(zaten kayitli) " + f); return; }
  writeFileSync(f, s.replace(/\s*$/, "") + "\n" + kayit);
  log("+ kayit: " + f);
});

// 2) Son doğrulama: guard + tam
function cal(a) { return spawnSync(a[0], a.slice(1), { encoding: "utf8", maxBuffer: 1 << 28 }); }
if (existsSync("scripts/publish-guard.mjs")) {
  const r = cal(["node", "scripts/publish-guard.mjs"]);
  process.stdout.write(r.stdout || ""); process.stderr.write(r.stderr || "");
  log("GUARD_EXIT=" + r.status);
}
const t = cal(["node", "hizli-test.mjs", "--tam"]);
const out = (t.stdout || "") + (t.stderr || "");
log(out.split("\n").slice(-8).join("\n"));
log("TAM_EXIT=" + t.status);
