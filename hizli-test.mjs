/* hizli-test.mjs — HIZ PROTOKOLÜ koşum seçicisi (test mantığını DEĞİŞTİRMEZ).
   Yalnız HANGİ kapıların koşacağını seçer ve süre basar.

   Kullanım:
     node hizli-test.mjs ks-ders-karti      → tek süit + süre (SUITE_DONE kapısı da doğrulanır)
     node hizli-test.mjs mutasyon <ad>       → yalnız ilgili mutasyon script'i (mutasyon-<ad>.mjs)
                                               <ad> süit adı da olabilir (ör. ks-dongu27)
     node hizli-test.mjs --tam               → kapanış kapısı: node test.mjs + node statik-eksiksizlik.mjs

   Notlar:
   - HİÇBİR assertion/gevşetme burada yapılmaz; süitler doğrudan (node <süit>) koşar.
   - Tek süitte SUITE_DONE kapısı test.mjs ile AYNI kuraldır (tam 1 marker, manifest birebir).
   - Mutasyon script'leri kendi içinde canonical app.js'i yedekleyip geri yazar; bu helper
     onların çalışmasını değiştirmez, yalnız seçer. */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

/* ——— MOD 3: kapanış kapısı ——— */
function tam() {
  console.log("=== KAPANIŞ KAPISI (tam test + statik) ===");
  const t1 = kos("test.mjs", [], { bas: true });
  console.log(`\n→ test.mjs: ${t1.r.status === 0 ? "✓ GEÇTİ" : "✗ BAŞARISIZ"}  ${SURE(t1.sure)}`);
  const t2 = kos("statik-eksiksizlik.mjs", [], { bas: true });
  console.log(`→ statik-eksiksizlik.mjs: ${t2.r.status === 0 ? "✓ GEÇTİ" : "✗ BAŞARISIZ"}  ${SURE(t2.sure)}`);
  const gecti = t1.r.status === 0 && t2.r.status === 0;
  console.log(
    `\nKAPANIŞ: ${gecti ? "✓ TÜM KAPILAR GEÇTİ" : "✗ KAPI DÜŞTÜ"}  (test ${SURE(t1.sure)} + statik ${SURE(t2.sure)} = ${SURE(t1.sure + t2.sure)})`
  );
  process.exit(gecti ? 0 : 1);
}

/* ——— YÖNLENDİRME ——— */
const [mod, arg] = process.argv.slice(2);
if (mod === "--tam" || mod === "tam") tam();
else if (mod === "mutasyon") {
  if (!arg) { console.error("Kullanım: node hizli-test.mjs mutasyon <ad>"); process.exit(1); }
  mutasyon(arg);
} else if (!mod || mod === "-h" || mod === "--help") {
  console.log(
    "HIZ PROTOKOLÜ koşum seçicisi:\n" +
    "  node hizli-test.mjs <süit>          tek süit + süre (ör. ks-ders-karti)\n" +
    "  node hizli-test.mjs mutasyon <ad>   yalnız ilgili mutasyon script'i\n" +
    "  node hizli-test.mjs --tam           kapanış kapısı: test.mjs + statik-eksiksizlik.mjs"
  );
} else tekSuit(mod);
