/* mutasyon-dongu30cache.mjs — YALNIZ ilgili süiti (ks-kart-kolon) koşar.
   M1: ?v= damgaları silinir            → #56 damga assertion'ı KIRMIZI
   M2: damga yanlış hash'e çevrilir     → KIRMIZI
   canonical index.html restore sonrası SHA birebir. */
import { readFileSync, writeFileSync, copyFileSync, rmSync, mkdtempSync } from "fs";
import { execSync } from "child_process";
import { createHash } from "crypto";
import { tmpdir } from "os";
import { join } from "path";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const dogal = readFileSync("index.html", "utf8");
const oncesi = sha("index.html");
const tmp = mkdtempSync(join(tmpdir(), "d30c-"));
const kanonik = join(tmp, "canonical.html");
writeFileSync(kanonik, dogal);

const durumlar = [
  {
    ad: "M1 ?v= damgası silinir (damgasız eski hâl)",
    uygula: (s) => s.replace("?v=1d509a6410c874b4", "").replace("?v=3d2dd38ff517c64f", ""),
  },
  {
    ad: "M2 damga yanlış hash'e çevrilir",
    uygula: (s) => s.replace("?v=1d509a6410c874b4", "?v=0000000000000000").replace("?v=3d2dd38ff517c64f", "?v=ffffffffffffffff"),
  },
];

let hepsi = true;
for (const m of durumlar) {
  const mut = m.uygula(dogal);
  if (mut === dogal) { console.log("MUTASYON UYGULANAMADI (anchor): " + m.ad); hepsi = false; continue; }
  writeFileSync("index.html", mut);
  let cikti = "";
  try { cikti = execSync("node ks-kart-kolon.mjs 2>&1", { encoding: "utf8" }); } catch (e) { cikti = (e.stdout || "") + (e.stderr || ""); }
  copyFileSync(kanonik, "index.html");
  const kirmizi = [...cikti.matchAll(/✗ (.*)/g)].map((x) => x[1].trim());
  const damgaKirmizi = kirmizi.some((k) => k.startsWith("index.html damga = SHA ilk 16 hane"));
  console.log((damgaKirmizi ? "PASS" : "FAIL") + "  " + m.ad + " → " + (kirmizi.length ? kirmizi.length + " kırmızı (" + kirmizi[0].slice(0, 55) + "…)" : "kırmızı YOK"));
  if (!damgaKirmizi) hepsi = false;
}

const sonrasi = sha("index.html");
console.log("canonical index.html SHA önce: " + oncesi);
console.log("canonical index.html SHA sonra: " + sonrasi);
const birebir = oncesi === sonrasi;
console.log("restore SHA birebir: " + (birebir ? "EVET" : "HAYIR"));
if (!birebir) { copyFileSync(kanonik, "index.html"); rmSync(tmp, { recursive: true, force: true }); console.error("FAIL → tmp kanonikten restore yapıldı"); process.exit(1); }
rmSync(tmp, { recursive: true, force: true });
if (!hepsi) process.exit(1);
console.log("MUTASYONLAR: 2/2 PASS");
