/* ks-teshis-d35-muhur.mjs — D35 sonrası DONMUŞ BEŞLİ tutarlılık teşhisi (tam kapıyı HARCAMAZ).
   Yalnız D35'te dokunulan süitleri koşar ve test.mjs'in AD KAPISI kuralını aynen uygular:
     donmuş suit-vakalar/<ad>.txt  ↔  koşum ✓/✗ adları  ↔  elleVakaAdlari[<ad>]
   Ayrıca manifest/elleManifest sayıları ve ks-kart-siraşı süit sayısı metni doğrulanır. */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { manifest } from "./suit-manifest.mjs";
import { elleManifest } from "./elle-vaka-manifesti.mjs";
import { elleVakaAdlari } from "./elle-vaka-adlari.mjs";

const hedefler = ["ks-birebir-gorunum.mjs", "ks-ekders-gorunum.mjs", "ks-ekders-ozet-csv.mjs", "ks-gunluk-ders-tasi.mjs", "ks-kart-sirasi.mjs", "ks-kart-kolon.mjs", "ks-d35-ad-sinif.mjs"];
let hata = 0;
const norm = (s) => s.trim();

for (const ad of hedefler) {
  const r = spawnSync(process.execPath, [ad], { encoding: "utf8" });
  const c = (r.stdout || "") + (r.stderr || "");
  const gorulen = [...c.matchAll(/^\s*[✓✗] (.*)$/gm)].map((m) => norm(m[1]));
  const donmus = readFileSync("suit-vakalar/" + ad + ".txt", "utf8").split("\n").filter(Boolean).map(norm);
  const elle = elleVakaAdlari[ad];
  const sayi = manifest[ad], elleSayi = elleManifest[ad];
  const kontroller = [
    ["exit=0", r.status === 0],
    ["SUITE_DONE marker tam 1", (c.match(/^SUITE_DONE:/gm) || []).length === 1],
    ["manifest = elleManifest (" + sayi + "/" + elleSayi + ")", sayi === elleSayi],
    ["donmuş satır = manifest (" + donmus.length + "/" + sayi + ")", donmus.length === sayi],
    ["elleAdlar uzunluk = elle (" + (elle ? elle.length : "?") + "/" + elleSayi + ")", Array.isArray(elle) && elle.length === elleSayi],
    ["koşum satır = donmuş (" + gorulen.length + "/" + donmus.length + ")", gorulen.length === donmus.length],
  ];
  const donFark = donmus.findIndex((v, i) => v !== gorulen[i]);
  kontroller.push(["donmuş ↔ koşum ADLARI birebir", donFark < 0]);
  const elleFark = Array.isArray(elle) ? donmus.findIndex((v, i) => v !== elle[i]) : -1;
  kontroller.push(["donmuş ↔ ELLE ADLARI birebir", elleFark < 0]);
  const kotu = kontroller.filter((k) => !k[1]);
  console.log((kotu.length ? "✗ " : "✓ ") + ad + "  (" + gorulen.length + " vaka)");
  kotu.forEach((k) => console.log("     ✗ " + k[0]));
  if (donFark >= 0) console.log("     ↳ donmuş=\"" + donmus[donFark] + "\"\n       koşum=\"" + gorulen[donFark] + "\"");
  if (elleFark >= 0) console.log("     ↳ donmuş=\"" + donmus[elleFark] + "\"\n       ELLE =\"" + elle[elleFark] + "\"");
  if (kotu.length) hata = 1;
}

/* süit sayısı metni: test.mjs suites uzunluğu = manifest anahtar sayısı */
const suitesSrc = readFileSync("test.mjs", "utf8");
const suitesSatir = suitesSrc.match(/const suites = \[([^\]]*)\]/);
const suites = suitesSatir ? suitesSatir[1].split(",").map((s) => norm(s).replace(/"/g, "")).filter(Boolean) : [];
console.log("\ntest.mjs süit sayısı = " + suites.length + " · manifest anahtar = " + Object.keys(manifest).length + " · elleManifest = " + Object.keys(elleManifest).length);
const sayiOk = suites.length === Object.keys(manifest).length && suites.length === Object.keys(elleManifest).length && suites.every((a) => manifest[a] !== undefined && elleManifest[a] !== undefined && Array.isArray(elleVakaAdlari[a]));
const kartMetni = suites.includes("ks-kart-sirasi.mjs") && readFileSync("suit-vakalar/ks-kart-sirasi.mjs.txt", "utf8").includes("(min 33) → " + suites.length);
console.log((sayiOk ? "✓" : "✗") + " süit sayısı üç kaynakta eşit (" + suites.length + ")");
console.log((kartMetni ? "✓" : "✗") + " ks-kart-sirasi metni = " + suites.length);
if (!sayiOk || !kartMetni) hata = 1;

console.log("\n" + (hata ? "DONMUŞ BEŞLİ TUTARSIZ" : "DONMUŞ BEŞLİ TUTARLI"));
process.exit(hata);
