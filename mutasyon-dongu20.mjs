/* DÖNGÜ-20 MUTASYON KANITLARI — yalnız geçici kopya; canonical app.js + index.html SHA birebir korunur.
   M1 eski iki-kolon CSS'i geri ekle → layout testi FAIL
   M2 runtime kartKolonMarkup yolunu eski hale getir (inline grid order/stil) → runtime testi FAIL
   M3 plan/havuz sırasını ters çevir (havuz üstte) → sıra testi FAIL
   M4 wrapper çocuk sayısını değiştir (tek panel) → sahiplik/idempotency FAIL
   M5 çelişen media kuralı bırak → kaynak taraması FAIL */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, rmSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANON = ["app.js", "index.html"];
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const CANON_SHA = Object.fromEntries(CANON.map((f) => [f, sha(f)]));

const donmus = ["ks-kart-kolon.mjs", "ks-render-sahipligi.mjs", "suit-manifest.mjs", "elle-vaka-manifesti.mjs",
  "elle-vaka-adlari.mjs", "suit-vakalar/ks-kart-kolon.mjs.txt", "statik-eksiksizlik.mjs"];
const once = {};
for (const f of donmus) once[f] = sha(f);

const calisma = mkdtempSync(join(tmpdir(), "d20-mut-"));
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

/* M1: eski iki-kolon CSS geri eklenir (index.html) → tek-kolon kaynak assertion'ı kırmızı */
kos("ks-kart-kolon.mjs",
  { "index.html": (s) => s.replace("#ks-kart-kolon { display: grid; grid-template-columns: minmax(0,1fr); gap: 1rem; align-items: start; }",
                                    "#ks-kart-kolon { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 1rem; align-items: start; }") },
  "İki-kolon grid kuralı kaynakta SIFIR hit");

/* M2: runtime onarım yolu bozulur — wrapper'a ekstra üçüncü çocuk eklenir (eski/yabancı düzen katmanı);
   sim DOM style.cssText/order'ı hesaplamadığından kanıt, çocuk sayısı/DOM yapısı üzerinden alınır (dürüstlük kuralı) */
kos("ks-kart-kolon.mjs",
  { "app.js": (s) => s.replace('var w = document.createElement("div"); w.id = "ks-kart-kolon";\n  var sol = document.createElement("div"); sol.id = "ks-kart-kolon-sol";',
                                'var w = document.createElement("div"); w.id = "ks-kart-kolon";\n  var sol = document.createElement("div"); sol.id = "ks-kart-kolon-sol";\n  var eskiKatman = document.createElement("div"); eskiKatman.id = "ks-kart-kolon-iki-kolon-katman"; w.appendChild(eskiKatman);') },
  "Onarım sonrası üst→alt çocuk sırası");

/* M3: plan/havuz sırası ters çevrilir (havuz üst panelde) → sıra assertion'ları kırmızı */
kos("ks-kart-kolon.mjs",
  { "app.js": (s) => s.replace("sol.appendChild(plan); sag.appendChild(havuz);\n  w.appendChild(sol); w.appendChild(sag);\n  if (parent && parent.insertBefore) parent.insertBefore(w, sonraki);",
                                "sol.appendChild(havuz); sag.appendChild(plan);\n  w.appendChild(sol); w.appendChild(sag);\n  if (parent && parent.insertBefore) parent.insertBefore(w, sonraki);") },
  "Üst panel ilk (plan üstte)");

/* M4: wrapper tek panel üretir (havuz eklenmez) → sahiplik/idempotency kırmızı */
kos("ks-kart-kolon.mjs",
  { "app.js": (s) => s.replace("sol.appendChild(plan); sag.appendChild(havuz);\n  w.appendChild(sol); w.appendChild(sag);\n  if (parent && parent.insertBefore) parent.insertBefore(w, sonraki);",
                                "sol.appendChild(plan); w.appendChild(sol);\n  if (parent && parent.insertBefore) parent.insertBefore(w, sonraki);") },
  "kartKolonOnar wrapper silinince yeniden kurar (tek)");

/* M5: çelişen media kuralı geri bırakılır (dar ekranda farklı düzen) → kaynak taraması kırmızı */
kos("ks-kart-kolon.mjs",
  { "index.html": (s) => s.replace("  </style>",
                                    "  @media (max-width: 767.98px) { #ks-kart-kolon { grid-template-columns: minmax(0,1fr) minmax(0,1fr); } }\n  </style>") },
  "İki-kolon grid kuralı kaynakta SIFIR hit");

rmSync(calisma, { recursive: true, force: true });
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
const shaOk = CANON.every((f) => sha(f) === CANON_SHA[f]);
console.log("canonical SHA önce/sonra: " + (shaOk ? "BİREBİR OK (app.js + index.html)" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "7/7 AYNI" : "BOZULDU"));
process.exit(hepsi && shaOk && donmusOk ? 0 : 1);
