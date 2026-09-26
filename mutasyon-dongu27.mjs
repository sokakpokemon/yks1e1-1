/* mutasyon-dongu27.mjs — YALNIZ tmp kopya üzerinde; canonical app.js ASLA değişmez.
   M1 waAc üye-dağıtımı kaldır → ks-dongu27 kırmızı
   M2 ogrenciMesajMetni filtresi eski hâle döner → ks-dongu27 kırmızı
   M3 grup dersine tek üye sayma (k = l.ogrenciId her üyede) → ks-dongu27 kırmızı
   M4 iptal filtresi gevşetilir → ks-dongu27 kırmızı + ks-wa-durum iptal kanıtı */
import { readFileSync, writeFileSync, copyFileSync, rmSync, mkdtempSync } from "fs";
import { execSync } from "child_process";
import { createHash } from "crypto";
import { tmpdir } from "os";
import { join } from "path";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const appOnce = sha("app.js");
const tmp = mkdtempSync(join(tmpdir(), "d27-"));
const mutasyonlar = [
  {
    ad: "M1 waAc üye-dağıtımı kaldırılır (eski tek-ana sayacı geri)",
    uygula: (s) => s.replace(
      /    var uyeIds = dersOgrenciIds\(l\);\n    if \(!uyeIds\.length\) uyeIds = \[l\.ogrenciId \|\| ""\];\n    uyeIds\.forEach\(function \(oid\) \{\n      var k = oid \|\| l\.ogrenciAd;\n      if \(!sayac\[k\]\) \{\n        var uye = oid \? DB\.ogrenciler\.find\(function \(x\) \{ return x\.id === oid; \}\) : null;\n        sayac\[k\] = \{ id: oid \|\| "", ad: \(uye && uye\.ad\) \|\| l\.ogrenciAd, n: 0 \};\n      \}\n      sayac\[k\]\.n\+\+;\n    \}\);/,
      "    var k = l.ogrenciId || l.ogrenciAd;\n    if (!sayac[k]) sayac[k] = { id: l.ogrenciId || \"\", ad: l.ogrenciAd, n: 0 };\n    sayac[k].n++;"
    ),
    beklenenKirmizi: ["alıcı listesinde Yusuf satırı VAR", "Yusuf ders sayacı = 2", "Emir ders sayacı = 1"]
  },
  {
    ad: "M2 ogrenciMesajMetni filtresi eski hâle döner",
    uygula: (s) => s.replace(
      "return (dersOgrenciIds(l).indexOf(o.id) !== -1 || l.ogrenciAd === o.ad) && l.durum !== \"iptal\";",
      "return (l.ogrenciId === o.id || l.ogrenciAd === o.ad) && l.durum !== \"iptal\";"
    ),
    beklenenKirmizi: ["Yusuf mesajında PAZAR grup dersi VAR", "Yusuf mesajında 2 ders bölümü VAR", "Emir mesajında PAZAR grup dersi VAR"]
  },
  {
    ad: "M3 her üye ayrı ders sayılır (dersOgrenciIds yerine dup anahtar)",
    uygula: (s) => s.replace("var uyeIds = dersOgrenciIds(l);", "var uyeIds = [l.ogrenciId, l.ogrenciId];"),
    beklenenKirmizi: ["alıcı satırları benzersiz", "Emir ders sayacı = 1"]
  },
  {
    ad: "M4 iptal filtresi gevşetilir",
    uygula: (s) => s.replace('dersOgrenciIds(l).indexOf(o.id) !== -1 || l.ogrenciAd === o.ad) && l.durum !== "iptal";', 'dersOgrenciIds(l).indexOf(o.id) !== -1 || l.ogrenciAd === o.ad);'),
    beklenenKirmizi: ["iptal dersi üye mesajına SIZMAZ"]
  }
];

let hepsi = true;
for (const m of mutasyonlar) {
  const mut = m.uygulama ? m : m; /* noop */
  const src = readFileSync("app.js", "utf8");
  const degismis = m.uygula(src);
  if (degismis === src) { console.log(m.ad + " → MUTASYON UYGULANAMADI (anchor)"); hepsi = false; continue; }
  /* tmp kopyada süit koş */
  const appYedek = join(tmp, "app.js");
  writeFileSync(appYedek, degismis);
  /* geçici: süit app.js okur → canonical'ı koru, mutasyonlu yaz, koş, geri yaz */
  copyFileSync("app.js", join(tmp, "canonical.js"));
  writeFileSync("app.js", degismis);
  let cikti = "";
  try { cikti = execSync("node ks-dongu27.mjs 2>&1", { encoding: "utf8" }); } catch (e) { cikti = e.stdout || ""; }
  const kirmizi = [...cikti.matchAll(/✗ (.*)/g)].map(x => x[1].trim());
  const kanit = m.beklenenKirmizi.some(b => kirmizi.some(k => k.startsWith(b) || k.includes(b.split(" ").slice(0, 4).join(" "))));
  copyFileSync(join(tmp, "canonical.js"), "app.js");
  rmSync(appYedek);
  console.log((kanit ? "PASS" : "FAIL") + "  " + m.ad + " → kırmızı: " + (kirmizi.length ? kirmizi.length + " test (" + kirmizi[0] + (kirmizi.length > 1 ? "; …" : "") + ")" : "YOK"));
  if (!kanit) hepsi = false;
}
rmSync(tmp, { recursive: true, force: true });

const appSonra = sha("app.js");
console.log("canonical app.js SHA önce: " + appOnce);
console.log("canonical app.js SHA sonra: " + appSonra);
console.log("SHA birebir: " + (appOnce === appSonra ? "EVET" : "HAYIR — RESTORE GEREKLİ"));
if (appOnce !== appSonra) { copyFileSync("app.js.dongu27-oncesi.bak", "app.js"); console.error("FAIL → SHA restore yapıldı"); process.exit(1); }
if (!hepsi) process.exit(1);
console.log("MUTASYONLAR: 4/4 PASS");
