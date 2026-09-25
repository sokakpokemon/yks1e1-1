/* DÖNGÜ-23 MUTASYON KANITLARI — yalnız geçici kopya; canonical SHA birebir korunur.
   M1 ham büyük ad (formatter gorselAd → ham esc) → D23 öğrenci-satırı FAIL
   M2 sınıf silme (öğrenci önerisi formatter'a null sınıf) → D23 gerçek sınıf FAIL
   M3 öğretmen satırına sınıf ekleme (ksSugSatirHTML(t.ad, t…)) → D23 öğretmen SINIFSIZ FAIL
   M4 kesik ad (button min-w-0/whitespace-normal/break-words silinir) → D23 kesilmez FAIL */
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

const calisma = mkdtempSync(join(tmpdir(), "d23-mut-"));
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

/* M1: ham büyük ad — birebirEtiketHTML'deki gorselAd ham esc'e çevrilir (öğrenci önerisi dahil tüm formatter yüzeyleri etkilenir) */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace("' + esc(gorselAd(ad)) + \"</span>\" + snfSpan",
                              "' + esc(ad) + \"</span>\" + snfSpan") },
  "D23 öğrenci öneri satırı formatter'dan");

/* M2: sınıf silme — ksSugOgrenci'nin öneri html'ine null sınıf verilir (sınıf spanı üretilmez) */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace("birebirEtiketHTML(o.ad, o.sinif || \"\") }; });",
                              "birebirEtiketHTML(o.ad, null) }; });") },
  "D23 öğrenci öneri satırı formatter'dan");

/* M3: öğretmen satırına sınıf ekleme — D19 kilidi kırılır */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace("html: ksSugSatirHTML(t.ad, null, false) }; });",
                              "html: ksSugSatirHTML(t.ad, \"9-A\", true) }; });") },
  "D23 öğretmen öneri satırı SINIFSIZ");

/* M4: kesik ad — öneri button'undan wrap/min-w sınıfları silinir */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace("ks-sug-satir w-full min-w-0 text-left px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-teal-50/70 cursor-pointer flex whitespace-normal break-words",
                              "ks-sug-satir w-full text-left px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-teal-50/70 cursor-pointer flex") },
  "D23 öneri satırı kesilmez");

rmSync(calisma, { recursive: true, force: true });
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
const shaOk = CANON.every((f) => sha(f) === CANON_SHA[f]);
console.log("canonical SHA önce/sonra: " + (shaOk ? "BİREBİR OK (6 dosya)" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "2/2 AYNI" : "BOZULDU"));
process.exit(hepsi && shaOk && donmusOk ? 0 : 1);
