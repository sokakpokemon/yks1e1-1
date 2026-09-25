/* DÖNGÜ-21 MUTASYON KANITLARI — yalnız geçici kopya; canonical dosyalar SHA birebir korunur.
   M1 arama kontrolünü kırp (flex-1 min-w-0 → min-w-[280px] sabit) → kırpma/klipping testi FAIL
   M2 sınıfı ikinci kez göster (sinifTag geri) → "sınıf BİR kez" FAIL
   M3 ham büyük harfli adı geri getir (birebirEtiketHTML'den esc(o.ad)'a havuz kartında) → gorselAd FAIL
   M4 bir select'in fontunu farklılaştır (grup-panel-sinif 13px/500 → 12.5px/600) → 13px/500 FAIL
   M5 öneri satırının boyutunu farklılaştır (ks-sug-satir 13px/500 → 12px/600) → FAIL
   M6 özel dropdown ankrajını kaldır (ksSugAnkraj çağrılarını yok et) → ankraj FAIL */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, rmSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANON = ["app.js", "index.html", "ks-panel-secim.mjs", "ks-grup-gorunum.mjs", "suit-vakalar/ks-panel-secim.mjs.txt", "suit-vakalar/ks-kart-sirasi.mjs.txt", "suit-vakalar/ks-kart-kolon.mjs.txt", "elle-vaka-adlari.mjs"];
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const CANON_SHA = Object.fromEntries(CANON.map((f) => [f, sha(f)]));

const donmus = ["ks-panel-secim.mjs", "ks-grup-gorunum.mjs", "suit-vakalar/ks-panel-secim.mjs.txt", "elle-vaka-adlari.mjs"];
const once = {};
for (const f of donmus) once[f] = sha(f);

const calisma = mkdtempSync(join(tmpdir(), "d21-mut-"));
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

/* M1: arama kontrolü tekrar kırpılır — liste kapsayıcısı sabit min-width'e döner (D20-öncesi kırpma zinciri) */
kos("ks-panel-secim.mjs",
  { "app.js": (s) => s.replace('\'<div id="grup-panel-liste" class="mt-2 w-full max-h-56 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">\'',
                              '\'<div id="grup-panel-liste" class="mt-2 max-h-56 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100 min-w-[280px]">\'') },
  "kapsayıcı w-full min-w-0");

/* M2: sınıf ikinci kez gösterilir — grup paneli satırına eski ikinci sinifTag geri eklenir;
   D21 'sınıf yalnız BİR kez' assertion'ı (gerçek grupPanelListeHTML DOM) kırmızıya düşer */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace('birebirEtiketHTML(e.o.ad, e.o.sinif || "") + anaTag + "</label>";',
                              'birebirEtiketHTML(e.o.ad, e.o.sinif || "") + anaTag + (e.o.sinif ? \'<span class="text-[10px] font-bold text-slate-300 shrink-0">\' + esc(e.o.sinif) + "</span>" : "") + "</label>";') },
  "sınıf yalnız formatter'dan BİR kez");

/* M3: havuz kartı adı ham büyük harfe döner — formatter'ın içindeki gorselAd ham esc'e çevrilir.
   D21 havuz ham-ad assertion'ı (gerçek renderHavuz DOM) kırmızıya düşer. */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace("' + esc(gorselAd(ad)) + \"</span>\" + snfSpan", "' + esc(ad) + \"</span>\" + snfSpan") },
  "ham büyük harf DB adı render'da düzelir");

/* M4: grup-panel-sinif fontu 13px/500'den farklılaştırılır (eski 12.5px/600) */
kos("ks-panel-secim.mjs",
  { "app.js": (s) => s.replace('\'<select id="grup-panel-sinif" onchange="grupPanelSinifSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/40">\'',
                              '\'<select id="grup-panel-sinif" onchange="grupPanelSinifSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/40">\'') },
  "13px/500 (tek tip kontrol)");

/* M5: öneri satırı boyutu farklılaştırılır (13px/500 → 12px/600) */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace("class=\"ks-sug-satir w-full text-left px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-teal-50/70 cursor-pointer flex\"",
                              "class=\"ks-sug-satir w-full text-left px-3 py-2 text-[12px] font-semibold rounded-lg hover:bg-teal-50/70 cursor-pointer flex\"") },
  "öneri satırları 13px/500");

/* M6: özel dropdown ankrajı kaldırılır (focus listener'dan ksSugAnkraj çağrısı silinir; D21 ankraj assertion'ı kırmızı) */
kos("ks-grup-gorunum.mjs",
  { "app.js": (s) => s.replace('inp.addEventListener("focus", function () { ksSugCiz(inpId, tip); if (el) el.classList.remove("hidden"); ksSugAnkraj(inpId, tip); });',
                              'inp.addEventListener("focus", function () { ksSugCiz(inpId, tip); if (el) el.classList.remove("hidden"); });') },
  "ANKRAJI kurulu");

rmSync(calisma, { recursive: true, force: true });
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
const shaOk = CANON.every((f) => sha(f) === CANON_SHA[f]);
console.log("canonical SHA önce/sonra: " + (shaOk ? "BİREBİR OK (8 dosya)" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "4/4 AYNI" : "BOZULDU"));
process.exit(hepsi && shaOk && donmusOk ? 0 : 1);
