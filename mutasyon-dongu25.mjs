/* mutasyon-dongu25.mjs — DÖNGÜ-25 şablon koruma mutasyonları.
   YALNIZ geçici kopyada çalışır: app.js tmp'ye kopyalanır, mutasyon uygulanır,
   ks-wa-durum.mjs (tmp app.js'i okur) FAIL olur; sonra restore + SHA doğrulaması.
   Canonical app.js ASLA yazılmaz. */
import { readFileSync, writeFileSync, copyFileSync, rmSync, mkdtempSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const APP = "app.js";
const shaOnce = sha(APP);
const tmp = mkdtempSync(join(tmpdir(), "dongu25-"));
const tmpApp = join(tmp, "app.js");
let PASS = 0, FAIL = 0;

function mutasyon(ad, uygula) {
  copyFileSync(APP, tmpApp);
  let kaynak = readFileSync(tmpApp, "utf8");
  kaynak = uygula(kaynak);
  writeFileSync(tmpApp, kaynak);
  let kirmizi = false;
  try {
    execSync(`node ks-wa-durum.mjs`, { cwd: process.cwd(), env: { ...process.env, KS_TMP_APP: tmpApp }, stdio: "pipe", timeout: 60000 });
  } catch (e) { kirmizi = true; }
  /* ks-wa-durum tmp app'i okumaz — o yüzden doğrudan tmp süit koşumu: süit kök app.js okur.
     Bu yüzden mutasyonu süreç-içi doğrulama ile yapacağız: süit kaynak dosya sabit,
     mutasyonu CWD bazlı test edemeyiz. Alternatif: tmp dizinde süit kopyası çalıştır. */
  const tmpSuit = join(tmp, "ks-wa-durum.mjs");
  copyFileSync("ks-wa-durum.mjs", tmpSuit);
  kirmizi = false;
  try {
    execSync(`node ${JSON.stringify(tmpSuit)}`, { cwd: tmp, env: process.env, stdio: "pipe", timeout: 60000 });
  } catch (e) { kirmizi = true; }
  if (kirmizi) { PASS++; console.log("  M-PASS " + ad); } else { FAIL++; console.log("  M-FAIL " + ad + " (mutasyon kırmızı yapmadı!)"); }
}

/* M4: saatEtiket kilidi ks-ogrt-ders-karti.mjs'te (D17-11) — mutasyonSuit ile ayrı süitte doğrulanır */
function mutasyonSuit(ad, suitAdi, uygula) {
  copyFileSync(APP, tmpApp);
  let kaynak = readFileSync(tmpApp, "utf8");
  kaynak = uygula(kaynak);
  writeFileSync(tmpApp, kaynak);
  const tmpSuit = join(tmp, suitAdi);
  copyFileSync(suitAdi, tmpSuit);
  let kirmizi = false;
  try {
    execSync(`node ${JSON.stringify(tmpSuit)}`, { cwd: tmp, env: process.env, stdio: "pipe", timeout: 60000 });
  } catch (e) { kirmizi = true; }
  if (kirmizi) { PASS++; console.log("  M-PASS " + ad); } else { FAIL++; console.log("  M-FAIL " + ad + " (mutasyon kırmızı yapmadı!)"); }
}
mutasyonSuit("M4 saatEtiket() gövdesi değişir (D25 dışı dokunuş — D17-11 kilitli)", "ks-ogrt-ders-karti.mjs", (k) =>
  k.replace('return m ? m.no + " · " + m.b + "-" + m.e : String(saat || "");',
              'return m ? m.b + "-" + m.e : String(saat || ""));'));

/* Not: ks-wa-durum.mjs readFileSync("app.js") CWD'den okur → tmp'de app.js yanına süit kopyası koyduk.
   Süit index.html ve test.mjs de okur; yoksa readFileSync hatası = kırmızı (mutasyondan bağımsız).
   Bu yüzden index.html + test.mjs'i de tmp'ye kopyalıyoruz. */
copyFileSync("index.html", join(tmp, "index.html"));
copyFileSync("test.mjs", join(tmp, "test.mjs"));

console.log("DÖNGÜ-25 mutasyonları (tmp=" + tmp + "):");

mutasyon("M1 eski slot-numaralı saatEtiket biçimi geri (8 · b-e)", (k) =>
  k.replace('var saatAralik = kk ? kk.b + " - " + kk.e : String(l.saat || "");',
              'var saatAralik = saatEtiket(l.saat);'));

mutasyon("M2 emoji ekleme (giriş satırına 👋)", (k) =>
  k.replace('return "Değerli öğrencimiz " + o.ad + ",\\nBirebir ders programın aşağıdaki gibidir:',
              'return "Değerli öğrencimiz " + o.ad + "! 👋\\nBirebir ders programın aşağıdaki gibidir:'));

mutasyon("M3 slot numaralı numaralandırma geri ('1. ' → '1) ')", (k) =>
  k.replace('return (i + 1) + ". " + D.ad', 'return (i + 1) + ") " + D.ad'));

mutasyon("M5 iptal filtresi gevşetilir (durum !== 'iptal' kaldırılır)", (k) =>
  k.replace('return (l.ogrenciId === o.id || l.ogrenciAd === o.ad) && l.durum !== "iptal";\n  });',
              'return (l.ogrenciId === o.id || l.ogrenciAd === o.ad);\n  });'));

rmSync(tmp, { recursive: true, force: true });
const shaSonra = sha(APP);
console.log("Canonical app.js SHA önce=" + shaOnce.slice(0, 8) + "… sonra=" + shaSonra.slice(0, 8) + "… " + (shaOnce === shaSonra ? "BİREBİR ✓" : "DEĞİŞMİŞ ✗"));
console.log(PASS + "/" + (PASS + FAIL) + " PASS" + (FAIL ? " — HATA" : ""));
process.exit(FAIL ? 1 : 0);
