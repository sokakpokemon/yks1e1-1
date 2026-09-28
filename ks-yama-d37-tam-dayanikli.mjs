/* ks-yama-d37-tam-dayanikli.mjs — D37-TAM-DAYANIKLI: hizli-test.mjs --tam'ı terminal sınırına dayanıklı yap.
   Marker: D37-TAM-DAYANIKLI → ikinci koşumda exit 2 (yazmaz).
   Yedek: hizli-test.mjs.d37-tam-dayanikli-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır —
   rapor YEDEKTEN ÖNCE yazılır: önce mevcut dosyanın byte+SHA'sı, sonra yedek + yedek doğrulaması).

   KÖK NEDEN (ölçümle):
     hizli-test.mjs tam() (eski satır 117-129), iki kapıyı `kos(..., { bas: true })` ile koşuyordu;
     kos() = spawnSync + encoding:"utf8" → çocuk sürecin TÜM çıktısı (test.mjs ~169 KB / 3.337 satır,
     statik ~4 KB) parent BELLEĞİNDE tamponlanıp kapı BİTTİKTEN SONRA basılıyordu. Terminal süreci
     180 sn'de kesilirse tampon da süreçle ölüyordu → ne ekranda ne dosyada çıktı kalıyordu
     (eski kolda hiçbir yere dosya YAZILMIYORDU). Kapı süreleri ölçüldü: test.mjs ~15.5 sn,
     statik-eksiksizlik.mjs ~16 sn (toplam ~31.5 sn) — darboğaz çıktı tamponu + kesilince kayıp.

   ÇÖZÜM (yalnız KOŞUM/ÇIKTI biçimi — KAPI MANTIĞI, ASSERTION'LAR ve SÜİT LİSTESİ DEĞİŞMEZ):
     1) --tam: iki kapı (test.mjs → statik-eksiksizlik.mjs) AYNI Node sürecinde ardışık koşar.
        Her kapının stdout+stderr'i doğrudan /tmp/tam.txt'nin açık fd'sine BAĞLANIR (spawnSync
        stdio:["ignore", fd, fd]) → çıktı AKAR; kesilse bile o ana kadar yazılan dosyada kalır.
     2) Ekrana ≤ ~10 satır özet: kapı süresi + EXIT + MANIFEST/HAM Σ/TAMLIK satırları + KAPANIŞ + satır sayısı.
     3) Her kapıdan ÖNCE tek satırlık ilerleme izi (kesilirse hangi kapıda kalındığı anlaşılır).
     4) --tam --hizli: AYNI kapılar/assertion'lar; yalnız özet (ilerleme izi + hata kuyruğu basılmaz).

   DOKUNULMAZ: tek süit (MOD 1), mutasyon (MOD 2), --profil (MOD 4) ve yönlendirme mantığı;
   app.js ve test/vaka dosyaları. Yalnız koşum seçici değişir (uygulama kodu DEĞİŞMEZ, publish YOK). */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const HEDEF = "hizli-test.mjs";
const BAK = "hizli-test.mjs.d37-tam-dayanikli-oncesi.bak";
const MARKER = "D37-TAM-DAYANIKLI";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

let src = readFileSync(HEDEF, "utf8");
if (src.includes(MARKER)) { console.error("ZATEN UYGULANMIŞ (" + MARKER + " marker var) — yazmadan çıkılıyor."); process.exit(2); }

/* ---- YEDEKTEN ÖNCE: mevcut dosya byte + SHA ---- */
console.log("HEDEF önce: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));
if (!existsSync(BAK)) { copyFileSync(HEDEF, BAK); console.log("YEDEK oluşturuldu: " + BAK); }
const bakSrc = readFileSync(BAK, "utf8");
console.log("BAK       : " + Buffer.byteLength(bakSrc, "utf8") + " B · sha256=" + sha256(bakSrc));
if (sha256(bakSrc) !== sha256(src)) { console.error("YEDEK DOĞRULAMA HATASI: yedek hedef dosya ile birebir DEĞİL."); process.exit(1); }

let degisen = 0;
function degis(etiket, eski, yeni, kez) {
  const n = src.split(eski).length - 1;
  if (n !== kez) { console.error("ANCHOR HATASI [" + etiket + "]: beklenen " + kez + ", bulunan " + n); process.exit(1); }
  src = src.split(eski).join(yeni);
  degisen += kez;
  console.log("  ✓ " + etiket + " (" + kez + ")");
}

/* ---- 0) başlık yorumuna yeni kol ---- */
const BAS_ESKI = [
  "     node hizli-test.mjs --tam               → kapanış kapısı: node test.mjs + node statik-eksiksizlik.mjs",
  "     node hizli-test.mjs --profil            → tüm süitleri AYRI Node süreçlerinde SIRALI koşar;",
].join("\n");
const BAS_YENI = [
  "     node hizli-test.mjs --tam               → kapanış kapısı: node test.mjs + node statik-eksiksizlik.mjs",
  "                                               TAM çıktı → /tmp/tam.txt (akıtılır, kesilse bile kalır);",
  "                                               ekrana ≤ ~10 satır özet + kapı başına ilerleme izi",
  "     node hizli-test.mjs --tam --hizli       → aynı kapılar/assertion'lar; YALNIZ özet (iz + hata kuyruğu yok)",
  "     node hizli-test.mjs --profil            → tüm süitleri AYRI Node süreçlerinde SIRALI koşar;",
].join("\n");
degis("0 başlık yorumu (--tam dayanıklı + --tam --hizli)", BAS_ESKI, BAS_YENI, 1);

/* ---- 1) fs import: akış için gerekli semboller ---- */
degis("1 fs import genişletildi (dosya fd akışı)",
  'import { existsSync, readFileSync, readdirSync } from "node:fs";',
  'import { existsSync, readFileSync, readdirSync, writeFileSync, appendFileSync, openSync, closeSync, statSync } from "node:fs";', 1);

/* ---- 2) tam(): tamponu akışa + özete çevir (aynı iki kapı, aynı kapı kriteri r.status===0) ---- */
const TAM_ESKI = [
  "/* ——— MOD 3: kapanış kapısı ——— */",
  "function tam() {",
  '  console.log("=== KAPANIŞ KAPISI (tam test + statik) ===");',
  '  const t1 = kos("test.mjs", [], { bas: true });',
  '  console.log(`\\n→ test.mjs: ${t1.r.status === 0 ? "✓ GEÇTİ" : "✗ BAŞARISIZ"}  ${SURE(t1.sure)}`);',
  '  const t2 = kos("statik-eksiksizlik.mjs", [], { bas: true });',
  '  console.log(`→ statik-eksiksizlik.mjs: ${t2.r.status === 0 ? "✓ GEÇTİ" : "✗ BAŞARISIZ"}  ${SURE(t2.sure)}`);',
  "  const gecti = t1.r.status === 0 && t2.r.status === 0;",
  "  console.log(",
  '    `\\nKAPANIŞ: ${gecti ? "✓ TÜM KAPILAR GEÇTİ" : "✗ KAPI DÜŞTÜ"}  (test ${SURE(t1.sure)} + statik ${SURE(t2.sure)} = ${SURE(t1.sure + t2.sure)})`',
  "  );",
  "  process.exit(gecti ? 0 : 1);",
  "}",
].join("\n");

const TAM_YENI = [
  "/* ——— MOD 3: kapanış kapısı (D37-TAM-DAYANIKLI) ———",
  "   Aynı iki kapı (test.mjs → statik-eksiksizlik.mjs) ve AYNI assertion'lar; yalnız KOŞUM/ÇIKTI biçimi değişti.",
  "   - Her kapının TAM çıktısı doğrudan /tmp/tam.txt'ye AKITILIR (child stdout+stderr → açık dosya fd).",
  "     Böylece terminal süreci 180 sn'de kesilse bile o ana kadarki çıktı dosyada kalır (eski kolda",
  "     173 KB çıktı yalnız parent belleğinde tamponlanıyor ve kapı bitene kadar hiçbir yere yazılmıyordu).",
  "   - Ekrana ≤ ~10 satır özet: kapı süresi + EXIT + MANIFEST/HAM Σ/TAMLIK satırları + KAPANIŞ + satır sayısı.",
  "   - Her kapıdan ÖNCE tek satırlık ilerleme izi (kesilirse hangi kapıda kalındığı görülür).",
  "   - hizli=true (--tam --hizli): aynı koşum; yalnız özet (ilerleme izi + hata kuyruğu basılmaz). */",
  'const TAM_DOSYA = "/tmp/tam.txt";',
  'const TAM_KAPILAR = ["test.mjs", "statik-eksiksizlik.mjs"];',
  "",
  "function tam(hizli = false) {",
  "  const bas = Date.now();",
  "  try {",
  '    writeFileSync(TAM_DOSYA, "");',
  "  } catch (e) {",
  '    console.error("✗ ÇIKTI DOSYASI AÇILAMADI: " + TAM_DOSYA + " (" + e.message + ")");',
  "    process.exit(1);",
  "  }",
  '  console.log("=== KAPANIŞ KAPISI (tam test + statik) ===  [çıktı → " + TAM_DOSYA + (hizli ? " · --hizli: yalnız özet" : "") + "]");',
  "",
  "  const olcum = [];",
  "  for (let i = 0; i < TAM_KAPILAR.length; i++) {",
  "    const kapi = TAM_KAPILAR[i];",
  '    if (!hizli) console.log("⏳ [" + (i + 1) + "/" + TAM_KAPILAR.length + "] " + kapi + " koşuyor…");',
  '    appendFileSync(TAM_DOSYA, "\\n### KAPI " + (i + 1) + "/" + TAM_KAPILAR.length + ": " + kapi + " ###\\n");',
  "    const once = statSync(TAM_DOSYA).size;",
  "    const t0 = Date.now();",
  '    const fd = openSync(TAM_DOSYA, "a");',
  "    let r;",
  "    try {",
  '      r = spawnSync(process.execPath, [kapi], { stdio: ["ignore", fd, fd] }); /* akış: çıktı doğrudan dosyaya */',
  "    } finally {",
  "      closeSync(fd);",
  "    }",
  "    const sure = Date.now() - t0;",
  '    const govde = readFileSync(TAM_DOSYA).subarray(once).toString("utf8");',
  "    const gecti = r.status === 0;",
  "    olcum.push({ kapi, sure, gecti, govde, kod: r.status });",
  '    console.log("→ " + kapi + ": " + (gecti ? "✓ GEÇTİ" : "✗ BAŞARISIZ") + "  (exit " + r.status + ")  " + SURE(sure));',
  "    if (!hizli && !gecti) {",
  '      govde.trimEnd().split("\\n").slice(-5).forEach(function (s) { console.log("   | " + s); });',
  "    }",
  "  }",
  "",
  '  [["test.mjs", /^MANIFEST:.*$/m], ["test.mjs", /^HAM Σ:.*$/m], ["statik-eksiksizlik.mjs", /^TAMLIK KANITI:.*$/m]].forEach(function (kv) {',
  "    const k = olcum.find(function (x) { return x.kapi === kv[0]; });",
  "    const m = k && k.govde.match(kv[1]);",
  '    if (m) console.log("   " + m[0].trim());',
  "  });",
  "",
  "  const hepsi = olcum.every(function (x) { return x.gecti; });",
  "  const toplam = olcum.reduce(function (a, x) { return a + x.sure; }, 0);",
  '  const dk = olcum.map(function (x) { return kokN(x.kapi) + " " + SURE(x.sure); }).join(" + ");',
  '  console.log("KAPANIŞ: " + (hepsi ? "✓ TÜM KAPILAR GEÇTİ" : "✗ KAPI DÜŞTÜ") + "  (" + dk + " = " + SURE(toplam) + " · duvar " + SURE(Date.now() - bas) + ")");',
  '  console.log("ÇIKTI: " + TAM_DOSYA + "  " + (readFileSync(TAM_DOSYA, "utf8").match(/\\n/g) || []).length + " satır  (tam çıktı korundu)"); /* wc -l ile aynı sayım */',
  "  process.exit(hepsi ? 0 : 1);",
  "}",
].join("\n");
degis("2 tam() → akışa yaz + özet (+ hizli kolu)", TAM_ESKI, TAM_YENI, 1);

/* ---- 3) yönlendirme: --tam --hizli bayrağını tam()'a geçir ---- */
degis("3 yönlendirme --hizli bayrağı",
  'if (mod === "--tam" || mod === "tam") tam();',
  'if (mod === "--tam" || mod === "tam") tam(arg === "--hizli");', 1);

/* ---- 4) yardım metni ---- */
const YARDIM_ESKI = [
  '    "  node hizli-test.mjs --tam           kapanış kapısı: test.mjs + statik-eksiksizlik.mjs\\n" +',
  '    "  node hizli-test.mjs --profil        tüm süitler sıralı + süre + EN YAVAŞ 10 (yazmaz)"',
].join("\n");
const YARDIM_YENI = [
  '    "  node hizli-test.mjs --tam           kapanış kapısı: test.mjs + statik-eksiksizlik.mjs (çıktı → /tmp/tam.txt)\\n" +',
  '    "  node hizli-test.mjs --tam --hizli   aynı kapılar/assertion\'lar; yalnız kısa özet\\n" +',
  '    "  node hizli-test.mjs --profil        tüm süitler sıralı + süre + EN YAVAŞ 10 (yazmaz)"',
].join("\n");
degis("4 yardım metni (--tam /tmp/tam.txt + --tam --hizli)", YARDIM_ESKI, YARDIM_YENI, 1);

writeFileSync(HEDEF, src, "utf8");
console.log("\nHEDEF sonra: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));
console.log("Toplam değişen anchor: " + degisen);
console.log("D37-TAM-DAYANIKLI yaması TAMAM. (app.js / test verisi / publish DEĞİŞMEDİ)");
