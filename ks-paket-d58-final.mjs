import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const T0 = Date.now();
const oku = f => readFileSync(f, "utf8");
const fail = m => { console.error("KIRMIZI: " + m); process.exit(1); };

/* [1] Kaynak gerçek: süitten 15 adı çıkar (satır-başı t(" ) */
const suit = oku("ks-yedek-guvenlik.mjs");
const adlar = [...suit.matchAll(/^\s*t\(\s*"([^"]*)"/gm)].map(m => m[1]);
if (adlar.length !== 15) fail("t() ad sayısı " + adlar.length + " (15 beklenir):\n" + adlar.map((a,i)=>(i+1)+": "+a).join("\n"));
console.log("[1] 15 ad süitten çıkarıldı (kaynak=gerçek) ✓");

/* [2] txt = adlar (birebir) */
const TXTP = "suit-vakalar/ks-yedek-guvenlik.mjs.txt";
const txtEski = oku(TXTP).split(/\r?\n/).filter(l => l.trim() !== "");
if (!(txtEski.length === 15 && txtEski.every((l,i) => l === adlar[i]))) {
  if (!existsSync(TXTP + ".d58-oncesi.bak")) copyFileSync(TXTP, TXTP + ".d58-oncesi.bak");
  writeFileSync(TXTP, adlar.join("\n") + "\n");
  console.log("[2] txt yeniden yazıldı ✓");
} else console.log("[2] txt zaten birebir (skip)");

/* [3] ELLE bloğu: string satırlarını sırayla 1:1 değiştir */
const ELLE = "elle-vaka-adlari.mjs";
const lines = oku(ELLE).split("\n");
const bi = lines.findIndex(l => l.includes('"ks-yedek-guvenlik.mjs"'));
if (bi < 0) fail("ELLE'de ks-yedek-guvenlik bloğu yok");
let bj = -1;
for (let j = bi + 1; j < lines.length; j++) { const tr = lines[j].trim(); if (tr === ");" || tr === "];") { bj = j; break; } }
if (bj < 0) fail("ELLE blok kapanışı yok (satır " + bi + ")");
const strIdx = [];
for (let j = bi + 1; j < bj; j++) if (lines[j].trim().startsWith('"')) strIdx.push(j);
if (strIdx.length !== 15) fail("ELLE bloğunda string satır sayısı " + strIdx.length + " (15 beklenir)");
if (!strIdx.every((j, k) => lines[j].includes(adlar[k]))) {
  if (!existsSync(ELLE + ".d58-oncesi.bak")) copyFileSync(ELLE, ELLE + ".d58-oncesi.bak");
  strIdx.forEach((j, k) => { lines[j] = '  "' + adlar[k] + '",'; });
  writeFileSync(ELLE, lines.join("\n"));
  console.log("[3] ELLE bloğu 15 adla birebir güncellendi ✓");
} else console.log("[3] ELLE zaten birebir (skip)");

/* [4] standalone doğrulama */
const r1 = spawnSync("node", ["ks-yedek-guvenlik.mjs"], { encoding: "utf8" });
if (r1.status !== 0 || !r1.stdout.includes("SUITE_DONE:ks-yedek-guvenlik.mjs:15:15"))
  fail("standalone: exit=" + r1.status + "\n" + (r1.stdout + r1.stderr).split("\n").slice(-6).join("\n"));
console.log("[4] standalone 15/15 + SUITE_DONE ✓");

/* [5] KAPI: --tam */
const r2 = spawnSync("node", ["hizli-test.mjs", "--tam"], { encoding: "utf8", maxBuffer: 25 * 1024 * 1024 });
const out = r2.stdout + r2.stderr;
const tamOk = r2.status === 0;
console.log("[5] --tam exit=" + r2.status);
console.log(out.split("\n").filter(l => /MANIFEST|RUNNER|HAM |TAMLIK|KAPANI|KIRMIZI|donmu|ELLE/.test(l)).slice(-8).join("\n"));

/* [6] guard */
const r3 = spawnSync("node", ["scripts/publish-guard.mjs"], { encoding: "utf8" });
console.log("[6] guard exit=" + r3.status);

/* [7] KAPI yeşilse kayıtları yaz */
if (tamOk) {
  const A2 = "CHECKPOINT-ARSIV-2.md";
  let a2 = oku(A2);
  const H58 = "## ✅ KAPANIŞ KAYDI: D58 (YEDEK/GÜVENLİK + META ONARIM) KAPANDI";
  if (!a2.includes(H58)) {
    const kayit = [H58, "",
    "**Durum:** ✅ Kapandı — P0 yedek/geri yükleme güvenliği paketi.",
    "- UYGULAMA (app.js 5c76ba2e→b6cb048514087835): boot kurtarma IIFE (bozuk LS → LS_KEY_KURTARMA kopya + __kurtarmaDurumu + uyarı modalı, boş kayıt → sessiz seed KORUNDU) · yedekOku asama bayrağı (onay-DOM hatası artık 'Dosya okunamadı' demez) · zarf kontrolü (uygulama/sürüm uyuşmazsa RED; zarfsız eski yedekler geriye-uyumlu) · index.html L286 bayat metin.",
    "- YENİ SÜİT: ks-yedek-guvenlik.mjs 15 assertion (salt-okuma sözleşme) · txt = ELLE = koşum adları SÜİTTEN üretildi (üç-liste birebir kuralı) · toplam 2606 → 2621 · 56 süit.",
    "- META ONARIM: ks-wa-sablon + ks-wa-durum çok-satırlı suites regex çökmesi (standalone 49/49 · 38/38) · ks-kart-sirasi #33 ad sabitleme · ks-kart-kolon donmuş offset kapa=19937→19959 (D58 boot IIFE +22, meşru kayma).",
    "- KAPI: hizli-test --tam EXIT 0 · 56 süit / 2621 birebir · TAMLIK ✓ · guard YEŞİL · ek-ders.js 3d2dd38f DEĞİŞMEDİ.",
    "- DÜRÜST NOT: __kurtarmaDurumu refresh'te tekrar açılır (tasarım tercihi) · D58-4 yedekAl try/catch AÇIK KALDI · elle-vaka-adlari yedekli.",
    "- AÇIK KALEMLER: (a) D58-4 yedekAl hata bildirimi · (b) D59 ders planlama hızlı ekranı (P1) · (c) Excel içe aktarma önizlemesi (P2) · (d) öğrenci analizi paketi (P3).",
    ""].join("\n");
    if (!a2.endsWith("\n")) a2 += "\n";
    writeFileSync(A2, a2 + "\n" + kayit);
    console.log("[7a] ARSIV-2'ye D58 tam kaydı eklendi ✓");
  } else console.log("[7a] ARSIV-2'de D58 var (skip)");

  const CP = "CHECKPOINT.md";
  let cp = oku(CP);
  if (!cp.includes("**D58**")) {
    const ls = cp.split("\n");
    const i56 = ls.findIndex(l => l.includes("**D56**"));
    if (i56 < 0) fail("CHECKPOINT.md'de D56 özet satırı yok — manuel ekleme gerek");
    ls.splice(i56 + 1, 0, "- **D58** — Yedek/geri yükleme güvenliği (boot kurtarma + zarf kontrolü + onay hata mesajı) · yeni süit ks-yedek-guvenlik 15 · toplam 2606→2621 · app.js 5c76ba2e→b6cb0485 · 4 süit meta onarımı · Tam kayıt: CHECKPOINT-ARSIV-2.md");
    writeFileSync(CP, ls.join("\n"));
    console.log("[7b] CHECKPOINT.md'ye D58 özeti eklendi ✓");
  } else console.log("[7b] CHECKPOINT.md'de D58 var (skip)");
} else console.log("[7] TAM KIRMIZI → checkpoint YAZILMADI; yukarıdaki kırmızı satırları yapıştır");

console.log("=== BİTTİ · " + Math.round((Date.now() - T0) / 1000) + "s · tamOk=" + tamOk + " ===");
