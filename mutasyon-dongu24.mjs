/* DÖNGÜ-24 MUTASYON KANITLARI — yalnız geçici kopya; canonical SHA birebir korunur.
   M1 chip sarmalayıcıyı kaldır (havuz kartı düz satıra döner) → D24 FAIL
   M2 sahte X butonu ekle → D24 "X butonu yok" FAIL
   M3 truncate ekle (chip'e truncate/ellipsis) → D24 kırpmasız FAIL (formatter kırpmasız kuralı)
   M4 formatter'ı atla (chip içeriğini ham esc ad'a çevir) → D24 formatter tek kaynak FAIL */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, rmSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANON = ["app.js", "ks-grup-gorunum.mjs", "suit-manifest.mjs", "elle-vaka-manifesti.mjs", "elle-vaka-adlari.mjs", "suit-vakalar/ks-grup-gorunum.mjs.txt"];
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const CANON_SHA = Object.fromEntries(CANON.map((f) => [f, sha(f)]));

const donmus = ["ks-grup-gorunum.mjs", "elle-vaka-adlari.mjs"];
const once = {};
for (const f of donmus) once[f] = sha(f);

const calisma = mkdtempSync(join(tmpdir(), "d24-mut-"));
let hepsi = true;

function kos(suitAd, mutasyon, beklenenAd) {
  cpSync(process.cwd(), calisma, { recursive: true, filter: (s) => !s.includes("node_modules") && !s.includes("/.git") });
  for (const [dosya, fn] of Object.entries(mutasyon)) {
    const yol = join(calisma, dosya);
    let s = readFileSync(yol, "utf8");
    const sonra = fn(s);
    if (sonra === s) { hepsi = false; console.log("FAIL | (mutasyon uygulanmadı: " + dosya + ") | " + beklenenAd); return; }
    writeFileSync(yol, sonra);
  }
  const r = spawnSync(process.execPath, [join(calisma, suitAd)], { encoding: "utf8", timeout: 120000, cwd: calisma });
  const cikti = (r.stdout || "") + (r.stderr || "");
  const kotu = (cikti.match(/✗/g) || []).length;
  const pass = r.status === 1 && kotu > 0 && cikti.includes(beklenenAd);
  hepsi = hepsi && pass;
  console.log((pass ? "PASS" : "FAIL") + " | " + suitAd + " | " + beklenenAd + " | kirmizi=" + (r.status === 1) + " kotu=" + kotu + (pass ? "" : "\n--- çıktı (son 400):\n" + cikti.slice(-400)));
}

const CHIP = "'<span class=\"inline-flex rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1\">'";

/* M1: sarmalayıcıyı kaldır */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace(CHIP + " + (o ? birebirEtiketHTML(o.ad, o.sinif || \"\") : birebirEtiketHTML(r.ogrenciAd, null)) + '</span>'",
                              "(o ? birebirEtiketHTML(o.ad, o.sinif || \"\") : birebirEtiketHTML(r.ogrenciAd, null))") },
  "sade chip sarmalayıcıda");

/* M2: sahte X butonu ekle */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace(CHIP + " + (o ? birebirEtiketHTML(o.ad, o.sinif || \"\") : birebirEtiketHTML(r.ogrenciAd, null)) + '</span>'",
                              CHIP + " + (o ? birebirEtiketHTML(o.ad, o.sinif || \"\") : birebirEtiketHTML(r.ogrenciAd, null)) + '<span class=\"w-4 h-4 rounded-full hover:bg-slate-200 flex items-center justify-center\"><i class=\"fa-solid fa-xmark text-[9px]\"></i></span></span>'") },
  "X butonu yok");

/* M3: truncate ekle */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace(CHIP, "'<span class=\"inline-flex rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 truncate\">'") },
  "sade chip sarmalayıcıda");

/* M4: formatter'ı atla */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace(CHIP + " + (o ? birebirEtiketHTML(o.ad, o.sinif || \"\") : birebirEtiketHTML(r.ogrenciAd, null)) + '</span>'",
                              CHIP + " + esc(o ? o.ad : r.ogrenciAd) + '</span>'") },
  "formatter tek kaynak");

rmSync(calisma, { recursive: true, force: true });
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
const shaOk = CANON.every((f) => sha(f) === CANON_SHA[f]);
console.log("canonical SHA önce/sonra: " + (shaOk ? "BİREBİR OK (6 dosya)" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "2/2 AYNI" : "BOZULDU"));
process.exit(hepsi && shaOk && donmusOk ? 0 : 1);
