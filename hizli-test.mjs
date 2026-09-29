/* hizli-test.mjs — HIZ PROTOKOLÜ koşum seçicisi (test mantığını DEĞİŞTİRMEZ).
   Yalnız HANGİ kapıların koşacağını seçer ve süre basar.

   Kullanım:
     node hizli-test.mjs ks-ders-karti      → tek süit + süre (SUITE_DONE kapısı da doğrulanır)
     node hizli-test.mjs mutasyon <ad>       → yalnız ilgili mutasyon script'i (mutasyon-<ad>.mjs)
                                               <ad> süit adı da olabilir (ör. ks-dongu27)
     node hizli-test.mjs --tam               → kapanış kapısı: node test.mjs + node statik-eksiksizlik.mjs
                                               TAM çıktı → /tmp/tam.txt (akıtılır, kesilse bile kalır);
                                               ekrana ≤ ~10 satır özet + kapı başına ilerleme izi
                                               (statik kapı yalnız BURADA --paralel koşar; kanıt/sayımlar
                                               ve çıktı sırası DEĞİŞMEZ, yalnız süre düşer)
     node hizli-test.mjs --tam --hizli       → aynı kapılar/assertion'lar; YALNIZ özet (iz + hata kuyruğu yok)
     node hizli-test.mjs --profil            → tüm süitleri AYRI Node süreçlerinde SIRALI koşar;
                                               her süitin süresi + toplam + EN YAVAŞ 10 süit
                                               (manifest/vaka dosyalarına YAZMAZ, yalnız ölçer)

   Notlar:
   - HİÇBİR assertion/gevşetme burada yapılmaz; süitler doğrudan (node <süit>) koşar.
   - Tek süitte SUITE_DONE kapısı test.mjs ile AYNI kuraldır (tam 1 marker, manifest birebir).
   - Mutasyon script'leri kendi içinde canonical app.js'i yedekleyip geri yazar; bu helper
     onların çalışmasını değiştirmez, yalnız seçer. */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync, appendFileSync, openSync, closeSync, statSync } from "node:fs";
import { manifest } from "./suit-manifest.mjs";

const SURE = (ms) => (ms / 1000).toFixed(2) + "s";
const kokN = (p) => p.replace(/\.mjs$/, "");

function kos(cmd, argv, { bas = false } = {}) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [cmd, ...argv], { encoding: "utf8" });
  const sure = Date.now() - t0;
  const cikti = (r.stdout || "") + (r.stderr || "");
  if (bas) process.stdout.write((r.stdout || "") + (r.stderr || ""));
  return { r, cikti, sure };
}

/* ——— MOD 1: tek süit ——— */
function tekSuit(ad) {
  const dosya = ad.endsWith(".mjs") ? ad : ad + ".mjs";
  if (!existsSync(dosya)) {
    console.error(`SÜİT YOK: ${dosya} bulunamadı.`);
    const ks = readdirSync(".").filter((f) => /^ks-.*\.mjs$/.test(f));
    console.error("Mevcut süitler:\n  " + ks.join("\n  "));
    process.exit(1);
  }
  console.log(`=== HIZLI KOŞU: ${dosya} ===`);
  const { r, cikti, sure } = kos(dosya, [], { bas: true });

  const beklenen = manifest[dosya];
  const markerlar = [...cikti.matchAll(/^SUITE_DONE:(\S+):(\d+):(\d+)$/gm)];
  const okSatir = (cikti.match(/^\s*✓ /gm) || []).length;
  const kotuSatir = (cikti.match(/✗/g) || []).length;

  let kapi = null;
  if (beklenen === undefined) kapi = "manifest kaydı yok";
  else if (markerlar.length === 0) kapi = "SUITE_DONE marker'ı YOK";
  else if (markerlar.length > 1) kapi = markerlar.length + " adet SUITE_DONE marker'ı (çift)";
  else {
    const [, mAd, kosan, bek] = markerlar[0];
    if (mAd !== dosya) kapi = `marker adı uyuşmuyor (${mAd})`;
    else if (+kosan !== +bek) kapi = `kosan=${kosan} ≠ beklenen=${bek}`;
    else if (+bek !== beklenen) kapi = `beklenen=${bek} ≠ manifest=${beklenen}`;
    else if (okSatir + kotuSatir !== +kosan) kapi = `assertion satır sayısı (${okSatir + kotuSatir}) ≠ kosan (${kosan})`;
  }

  const gecti = r.status === 0 && kotuSatir === 0 && !kapi;
  if (kapi) console.log(`  [KAPI HATASI] ${kapi}`);
  console.log(
    `${gecti ? "✓ GEÇTİ" : "✗ BAŞARISIZ"}  ${dosya}  ${okSatir}✓ ${kotuSatir}✗  (exit ${r.status})  ${SURE(sure)}`
  );
  process.exit(gecti ? 0 : 1);
}

/* ——— MOD 2: mutasyon ——— */
function mutasyon(ad) {
  const adaylar = [];
  if (ad.endsWith(".mjs")) adaylar.push(ad);
  adaylar.push("mutasyon-" + kokN(ad) + ".mjs");
  const hedef = adaylar.find((f) => existsSync(f));
  if (hedef) return kosMutasyon(hedef);

  /* Süit adı verildiyse: içinde o süiti çağıran mutasyon script'lerini bul. */
  const suit = ad.endsWith(".mjs") ? ad : (ad.startsWith("ks-") ? ad + ".mjs" : null);
  if (suit) {
    const eslesen = readdirSync(".").filter(
      (f) => /^mutasyon-.*\.mjs$/.test(f) && readFileSync(f, "utf8").includes(suit)
    );
    if (eslesen.length) {
      let hepsi = true;
      for (const f of eslesen) hepsi = kosMutasyon(f) && hepsi;
      process.exit(hepsi ? 0 : 1);
    }
  }
  console.error(`MUTASYON YOK: "${ad}" için mutasyon script'i bulunamadı.`);
  const ms = readdirSync(".").filter((f) => /^mutasyon-.*\.mjs$/.test(f));
  console.error("Mevcut mutasyon script'leri:\n  " + ms.join("\n  "));
  process.exit(1);
}

function kosMutasyon(dosya) {
  console.log(`=== MUTASYON KOŞU: ${dosya} ===`);
  const { r, sure } = kos(dosya, [], { bas: true });
  const gecti = r.status === 0;
  console.log(`${gecti ? "✓ GEÇTİ" : "✗ BAŞARISIZ"}  ${dosya}  (exit ${r.status})  ${SURE(sure)}`);
  return gecti;
}

/* ——— MOD 3: kapanış kapısı (D37-TAM-DAYANIKLI) ———
   Aynı iki kapı (test.mjs → statik-eksiksizlik.mjs) ve AYNI assertion'lar; yalnız KOŞUM/ÇIKTI biçimi değişti.
   - Her kapının TAM çıktısı doğrudan /tmp/tam.txt'ye AKITILIR (child stdout+stderr → açık dosya fd).
     Böylece terminal süreci 180 sn'de kesilse bile o ana kadarki çıktı dosyada kalır (eski kolda
     173 KB çıktı yalnız parent belleğinde tamponlanıyor ve kapı bitene kadar hiçbir yere yazılmıyordu).
   - Ekrana ≤ ~10 satır özet: kapı süresi + EXIT + MANIFEST/HAM Σ/TAMLIK satırları + KAPANIŞ + satır sayısı.
   - Her kapıdan ÖNCE tek satırlık ilerleme izi (kesilirse hangi kapıda kalındığı görülür).
   - hizli=true (--tam --hizli): aynı koşum; yalnız özet (ilerleme izi + hata kuyruğu basılmaz). */
const TAM_DOSYA = "/tmp/tam.txt";
const TAM_KAPILAR = ["test.mjs", "statik-eksiksizlik.mjs"];
/* statik kapı kapanışta YALNIZ burada paralel koşar: kanıtlar/sayımlar ve basılan satırlar
   seri ile birebir aynıdır (FAZ 1 kapı-1 ile kanıtlı), tek fark duvar süresi. Diğer tüm
   çağrılar (doğrudan `node statik-eksiksizlik.mjs`) seri DEFAULT'ta kalır. */
const KAPI_EK_ARGV = { "statik-eksiksizlik.mjs": ["--paralel"] };

function tam(hizli = false) {
  const bas = Date.now();
  try {
    writeFileSync(TAM_DOSYA, "");
  } catch (e) {
    console.error("✗ ÇIKTI DOSYASI AÇILAMADI: " + TAM_DOSYA + " (" + e.message + ")");
    process.exit(1);
  }
  console.log("=== KAPANIŞ KAPISI (tam test + statik) ===  [çıktı → " + TAM_DOSYA + (hizli ? " · --hizli: yalnız özet" : "") + "]");

  const olcum = [];
  for (let i = 0; i < TAM_KAPILAR.length; i++) {
    const kapi = TAM_KAPILAR[i];
    if (!hizli) console.log("⏳ [" + (i + 1) + "/" + TAM_KAPILAR.length + "] " + kapi + " koşuyor…");
    appendFileSync(TAM_DOSYA, "\n### KAPI " + (i + 1) + "/" + TAM_KAPILAR.length + ": " + kapi + " ###\n");
    const once = statSync(TAM_DOSYA).size;
    const t0 = Date.now();
    const fd = openSync(TAM_DOSYA, "a");
    let r;
    try {
      r = spawnSync(process.execPath, [kapi, ...(KAPI_EK_ARGV[kapi] || [])], { stdio: ["ignore", fd, fd] }); /* akış: çıktı doğrudan dosyaya */
    } finally {
      closeSync(fd);
    }
    const sure = Date.now() - t0;
    const govde = readFileSync(TAM_DOSYA).subarray(once).toString("utf8");
    const gecti = r.status === 0;
    olcum.push({ kapi, sure, gecti, govde, kod: r.status });
    console.log("→ " + kapi + ": " + (gecti ? "✓ GEÇTİ" : "✗ BAŞARISIZ") + "  (exit " + r.status + ")  " + SURE(sure));
    if (!hizli && !gecti) {
      govde.trimEnd().split("\n").slice(-5).forEach(function (s) { console.log("   | " + s); });
    }
  }

  [["test.mjs", /^MANIFEST:.*$/m], ["test.mjs", /^HAM Σ:.*$/m], ["statik-eksiksizlik.mjs", /^TAMLIK KANITI:.*$/m]].forEach(function (kv) {
    const k = olcum.find(function (x) { return x.kapi === kv[0]; });
    const m = k && k.govde.match(kv[1]);
    if (m) console.log("   " + m[0].trim());
  });

  const hepsi = olcum.every(function (x) { return x.gecti; });
  const toplam = olcum.reduce(function (a, x) { return a + x.sure; }, 0);
  const dk = olcum.map(function (x) { return kokN(x.kapi) + " " + SURE(x.sure); }).join(" + ");
  console.log("KAPANIŞ: " + (hepsi ? "✓ TÜM KAPILAR GEÇTİ" : "✗ KAPI DÜŞTÜ") + "  (" + dk + " = " + SURE(toplam) + " · duvar " + SURE(Date.now() - bas) + ")");
  console.log("ÇIKTI: " + TAM_DOSYA + "  " + (readFileSync(TAM_DOSYA, "utf8").match(/\n/g) || []).length + " satır  (tam çıktı korundu)"); /* wc -l ile aynı sayım */
  process.exit(hepsi ? 0 : 1);
}

/* ——— MOD 4: profil ——— */
function profil() {
  /* Süit kümesi = suit-manifest.mjs anahtarları (SÜİT kayıtlarının tek gerçek kaynağı).
     Kökteki diğer ks-*.mjs dosyaları süit DEĞİL (teşhis/yama/checkpoint script'leri) —
     glob ile koşmak uygulama dosyalarına yazabilir; bu yüzden yalnız kayıtlı süitler koşar.
     Bu mod HİÇBİR dosyaya yazmaz; sadece ölçüm basar. */
  const suitler = Object.keys(manifest);
  console.log(`=== PROFİL: ${suitler.length} süit (ayrı Node süreçleri, sıralı) ===`);
  const olcum = [];
  const t0 = Date.now();
  for (const ad of suitler) {
    const t = Date.now();
    const r = spawnSync(process.execPath, [ad], { encoding: "utf8" });
    const sure = Date.now() - t;
    const cikti = (r.stdout || "") + (r.stderr || "");
    const kotu = (cikti.match(/✗/g) || []).length;
    const gecti = r.status === 0 && kotu === 0;
    olcum.push({ ad, sure, gecti });
    console.log(`${gecti ? "✓" : "✗"} ${ad.padEnd(34)} ${SURE(sure)}`);
  }
  const toplam = Date.now() - t0;
  const gecen = olcum.filter((x) => x.gecti).length;
  console.log(`\nTOPLAM: ${SURE(toplam)}  (${gecen}/${olcum.length} süit geçti)`);
  const enYavas = [...olcum].sort((a, b) => b.sure - a.sure).slice(0, 10);
  console.log("\nEN YAVAŞ 10 SÜİT:");
  enYavas.forEach((x, i) => console.log(`  ${String(i + 1).padStart(2)}. ${x.ad.padEnd(34)} ${SURE(x.sure)}`));
}

/* ——— YÖNLENDİRME ——— */
const [mod, arg] = process.argv.slice(2);
if (mod === "--tam" || mod === "tam") tam(arg === "--hizli");
else if (mod === "--profil" || mod === "profil") profil();
else if (mod === "mutasyon") {
  if (!arg) { console.error("Kullanım: node hizli-test.mjs mutasyon <ad>"); process.exit(1); }
  mutasyon(arg);
} else if (!mod || mod === "-h" || mod === "--help") {
  console.log(
    "HIZ PROTOKOLÜ koşum seçicisi:\n" +
    "  node hizli-test.mjs <süit>          tek süit + süre (ör. ks-ders-karti)\n" +
    "  node hizli-test.mjs mutasyon <ad>   yalnız ilgili mutasyon script'i\n" +
    "  node hizli-test.mjs --tam           kapanış kapısı: test.mjs + statik-eksiksizlik.mjs (çıktı → /tmp/tam.txt)\n" +
    "  node hizli-test.mjs --tam --hizli   aynı kapılar/assertion'lar; yalnız kısa özet\n" +
    "  node hizli-test.mjs --profil        tüm süitler sıralı + süre + EN YAVAŞ 10 (yazmaz)"
  );
} else tekSuit(mod);
