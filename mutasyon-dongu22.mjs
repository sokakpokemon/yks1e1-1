/* DÖNGÜ-22 MUTASYON KANITLARI — yalnız geçici kopya; canonical dosyalar SHA birebir korunur.
   M1 kırpan parent geri (liste kapsayıcısı overflow-hidden + sabit min-width) → kırpılma testi FAIL
   M2 popup hosttan ayrılma (top-full/left-right CSS kaldırılır, statik konum) → host-bağlılık FAIL
   M3 chipten sınıf silme (havuz chip formatter → gorselAd sınıfsız) → ad+sınıf testi FAIL
   M4 ham büyük ad (formatter gorselAd → ham esc) → gorselAd düzeltme testi FAIL
   M5 sınıf iki kez basma (grup paneli satırına 2. sinifTag) → sınıf-tekrarsız FAIL */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, rmSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANON = ["app.js", "index.html", "ks-grup-gorunum.mjs", "ks-panel-secim.mjs", "suit-vakalar/ks-grup-gorunum.mjs.txt", "suit-vakalar/ks-panel-secim.mjs.txt", "suit-vakalar/ks-kart-sirasi.mjs.txt", "suit-vakalar/ks-kart-kolon.mjs.txt", "elle-vaka-adlari.mjs"];
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const CANON_SHA = Object.fromEntries(CANON.map((f) => [f, sha(f)]));

const donmus = ["ks-grup-gorunum.mjs", "ks-panel-secim.mjs", "elle-vaka-adlari.mjs"];
const once = {};
for (const f of donmus) once[f] = sha(f);

const calisma = mkdtempSync(join(tmpdir(), "d22-mut-"));
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

/* M1: kırpan parent geri — D21-öncesi düzen (grup paneli gövdesine overflow-hidden sabit genişlik sarmalayıcı) */
kos("ks-panel-secim.mjs",
  { "index.html": (s) => s.replace('<div class="lg:col-span-2 relative">', '<div class="lg:col-span-1 overflow-hidden">') },
  "kırpmasız düzen");

/* M2: popup hosttan ayrılma — ksSugListeHTML'de in-flow absolute CSS kaldırılır (static konum → hosta bağlılık bozulur) */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace('ks-sug-liste hidden absolute z-30 left-0 right-0 top-full mt-1 max-h-60',
                              'ks-sug-liste hidden mt-1 max-h-60') },
  "in-flow absolute bağlı");

/* M3: chipten sınıf silme — havuz chip formatter'dan gorselAd sınıfsız düz ada döner */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace(`'">' + (o ? birebirEtiketHTML(o.ad, o.sinif || "") : "?") + (i === 0 ? ' <span class="opacity-70">(Ana)</span>' : "") + "</span>";`,
                              `'">' + esc(o ? gorselAd(o.ad) : "?") + (i === 0 ? ' <span class="opacity-70">(Ana)</span>' : "") + "</span>";`) },
  "formatter'dan (ad+sınıf");

/* M4: ham büyük ad — formatter gorselAd → ham esc */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace("' + esc(gorselAd(ad)) + \"</span>\" + snfSpan",
                              "' + esc(ad) + \"</span>\" + snfSpan") },
  "ham büyük harf DB adı render'da düzelir");

/* M5: sınıf iki kez basma — grup paneli satırına eski 2. sinifTag geri eklenir */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace('birebirEtiketHTML(e.o.ad, e.o.sinif || "") + anaTag + "</label>";',
                              'birebirEtiketHTML(e.o.ad, e.o.sinif || "") + anaTag + (e.o.sinif ? \'<span class="text-[10px] font-bold text-slate-300 shrink-0">\' + esc(e.o.sinif) + "</span>" : "") + "</label>";') },
  "sınıf yalnız formatter'dan BİR kez");

rmSync(calisma, { recursive: true, force: true });
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
const shaOk = CANON.every((f) => sha(f) === CANON_SHA[f]);
console.log("canonical SHA önce/sonra: " + (shaOk ? "BİREBİR OK (9 dosya)" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "3/3 AYNI" : "BOZULDU"));
process.exit(hepsi && shaOk && donmusOk ? 0 : 1);
