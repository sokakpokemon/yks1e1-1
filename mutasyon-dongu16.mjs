/* DÖNGÜ-16 MUTASYON KANITLARI — yalnız geçici kopyada; canonical app.js SHA birebir korunur.
   Yöntem: geçici klasöre PROJE TAM kopyası alınır; app.js'e mutasyon uygulanır; süit o klasörde koşar. */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, rmSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANON = "app.js";
const CANON_SHA = "ad3b980bfaf6edb5498631b53a0809a0aba5f39b33be3ff46f8b528dfff71fe8"; /* D16 uygulaması sonrası canonical */
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
if (sha(CANON) !== CANON_SHA) { console.error("RED: canonical app.js SHA beklenen değil: " + sha(CANON)); process.exit(2); }

const donmus = ["ks-ders-karti.mjs", "ks-ders-karti-tasima.mjs", "ks-wa-durum.mjs", "ks-wa-sablon.mjs",
  "suit-manifest.mjs", "elle-vaka-manifesti.mjs", "elle-vaka-adlari.mjs", "statik-eksiksizlik.mjs",
  "suit-vakalar/ks-ders-karti.mjs.txt", "suit-vakalar/ks-ders-karti-tasima.mjs.txt", "suit-vakalar/ks-wa-durum.mjs.txt"];
const once = {};
for (const f of donmus) once[f] = sha(f);

const calisma = mkdtempSync(join(tmpdir(), "d16-mut-"));
let n = 0, hepsi = true;

function koş(mutasyon) {
  n++;
  cpSync(process.cwd(), calisma, { recursive: true, filter: (s) => !s.includes("node_modules") && !s.includes("/.git") && !s.includes("olay-dongu15-kilit") });
  const appYolu = join(calisma, "app.js");
  let s = readFileSync(appYolu, "utf8");
  const sonra = mutasyon(s);
  if (sonra === s) return { kirmizi: false, kotu: 0, cikti: "(mutasyon uygulanmadı — hedef string yok)" };
  writeFileSync(appYolu, sonra);
  const r = spawnSync(process.execPath, [join(calisma, "ks-ders-karti.mjs")], { encoding: "utf8", timeout: 120000, cwd: calisma });
  const cikti = (r.stdout || "") + (r.stderr || "");
  const kotu = (cikti.match(/✗/g) || []).length;
  return { kirmizi: r.status === 1 && kotu > 0, kotu, cikti };
}
function kontrol(ad, mutasyon, beklenenAd) {
  const r = koş(mutasyon);
  const pass = r.kirmizi && r.cikti.includes(beklenenAd);
  hepsi = hepsi && pass;
  console.log((pass ? "PASS" : "FAIL") + " | " + ad + " | kirmizi=" + !!r.kirmizi + " kotu=" + r.kotu + (pass ? "" : "\n--- çıktı (son 600):\n" + r.cikti.slice(-600)));
}

/* M1: öğrenci footer geri */
kontrol("M1 footer öğrenci kartına geri eklendi",
  (s) => s.replace('      /* DÖNGÜ-16: öğrenci kartı footer KALDIRILDI (öğretmen kartlarındaki footer korunur) */',
                   '      \'<div style="font-size:9.5px;color:#94a3b8;margin-top:14px">Bu kart YKS Birebir Takip tarafından oluşturuldu · \' + esc(pencereAdi()) + "</div>" +'),
  "D16 öğrenci kartı HTML'inde footer metni YOK");

/* M2: öğrenci saat "8 · " geri */
kontrol("M2 öğrenci SAAT v.saat'e döndü ('8 · ' geri gelir)",
  (s) => s.replace('kutu("#fff8f2", "#f59e0b", "SAAT", v.saatKisa)', 'kutu("#fff8f2", "#f59e0b", "SAAT", v.saat)'),
  "D16 öğrenci kartı SAAT kutusunda '8 · ' YOK");

/* M3: ortak saatEtiket değiştirilir → öğretmen koruma testi kırmızı */
kontrol("M3 saatEtiket slot öneki kaldırıldı (ortak yardımcı bozuldu)",
  (s) => s.replace('return m ? m.no + " · " + m.b + "-" + m.e : String(saat || "");', 'return m ? m.b + "-" + m.e : String(saat || "");'),
  "D16 öğretmen tek-ders kartında footer + '8 · ' HÂLÂ VAR");

/* M4: öğretmen tek-ders footer kaldırılır */
kontrol("M4 öğretmen tek-ders kartı footer'ı kaldırıldı",
  (s) => s.replace('    \'<div style="font-size:9.5px;color:#94a3b8">Bu kart YKS Birebir Takip tarafından oluşturuldu · \' + esc(pencereAdi()) + "</div>" +\n  "</div>";\n}\nfunction dersKartiOgrtBtnHTML',
                   '  "</div>";\n}\nfunction dersKartiOgrtBtnHTML'),
  "D16 öğretmen tek-ders kartında footer + '8 · ' HÂLÂ VAR");

/* M5: öğretmen günlük footer kaldırılır */
kontrol("M5 öğretmen günlük kartı footer'ı kaldırıldı",
  (s) => {
    const i0 = s.indexOf('function dersKartiOgrtGunlukHTML');
    const i1 = s.indexOf('\nfunction ', i0 + 10);
    const blok = s.slice(i0, i1);
    const hedef = '    \'<div style="font-size:9.5px;color:#94a3b8">Bu kart YKS Birebir Takip tarafından oluşturuldu · \' + esc(pencereAdi()) + "</div>" +';
    if (!blok.includes(hedef)) return s;
    return s.slice(0, i0) + blok.replace(hedef, '    ""') + s.slice(i1);
  },
  "D16 öğretmen günlük kartında footer + '8 · ' HÂLÂ VAR");

/* temizlik + canonical + donmuş doğrulama */
rmSync(calisma, { recursive: true, force: true });
const son = sha(CANON);
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
console.log("canonical app.js son SHA: " + (son === CANON_SHA ? "BİREBİR OK" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "11/11 AYNI" : "BOZULDU"));
process.exit(hepsi && son === CANON_SHA && donmusOk ? 0 : 1);
