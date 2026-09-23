/* test.mjs — tüm regresyon testlerini sırayla çalıştırır ve özetler.
   SUITE_DONE kapısı: her süit çıktıda TAM BİR 'SUITE_DONE:<ad>:<kosan>:<beklenen>'
   satırı basmak ZORUNDA; kosan === beklenen === manifest olmalı. Marker yoksa,
   çiftse veya sayılar uyuşmazsa süit FAIL sayılır. */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { manifest } from "./suit-manifest.mjs";
import { elleManifest } from "./elle-vaka-manifesti.mjs";
import { elleVakaAdlari } from "./elle-vaka-adlari.mjs";

const suites = ["ks-harness.mjs", "ks-test-render.mjs", "ks-durum-fn.mjs", "ks-grup-uyum.mjs", "ks-panel-secim.mjs", "ks-grup-gorunum.mjs", "ks-istekten-grup.mjs", "ks-grup-istegi.mjs", "ks-benzersiz-id.mjs", "ks-gercek-kadro.mjs", "ks-donem-ilk.mjs", "ks-donem-damga.mjs", "ks-donem-secici.mjs", "ks-excel-csv.mjs", "ks-donem-olusturma.mjs", "ks-donem-secici-gorunum.mjs", "ks-donem-secici-dom.mjs", "ks-sinifprog-csv.mjs", "ks-sablon-kopya.mjs", "ks-render-sahipligi.mjs", "ks-d1-render-refactor.mjs", "ks-kadro-siralama.mjs", "ks-kapali-gorunum.mjs", "ks-ek-ders-donem.mjs", "ks-ekders-gorunum.mjs", "ks-ekders-ozet-csv.mjs", "ks-birebir-gorunum.mjs", "ks-sinif-ogretmen-uyum.mjs", "ks-sinif-prog-uyum-onar.mjs", "ks-sinif-prog-etiket.mjs", "ks-kart-sirasi.mjs", "ks-kart-kolon.mjs", "ks-brans-ders-kurali.mjs", "ks-excel-ui-kontrol.mjs", "ks-wa-sablon.mjs", "ks-wa-onizleme.mjs", "ks-wa-durum.mjs", "ks-wa-alici.mjs", "ks-excel-k-import.mjs", "ks-kadro-kolon.mjs", "ks-kadro-telefon3.mjs", "ks-ders-tasi.mjs", "ks-gunluk-ders-tasi.mjs", "ks-ders-karti.mjs", "ks-ders-karti-tasima.mjs", "ks-ogrt-ders-karti.mjs", "ks-ogrt-denetim.mjs"];

console.log("YKS Birebir Takip — test runner (SUITE_DONE kapısı aktif)");

const dusenler = [];
let toplamGecen = 0, toplamTest = 0;

for (const name of suites) {
  console.log(`\n===== ${name} =====`);
  const r = spawnSync(process.execPath, [name], { encoding: "utf8" });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);

  const cikti = (r.stdout || "") + (r.stderr || "");
  const ok = (cikti.match(/^\s*✓ /gm) || []).length;
  const kotu = (cikti.match(/✗/g) || []).length;

  /* ——— SUITE_DONE KAPISI ——— */
  const beklenen = manifest[name];
  const markerlar = [...cikti.matchAll(/^SUITE_DONE:(\S+):(\d+):(\d+)$/gm)];
  let gateHata = null;
  if (beklenen === undefined) gateHata = "manifest kaydı yok";
  else if (markerlar.length === 0) gateHata = "SUITE_DONE marker'ı YOK";
  else if (markerlar.length > 1) gateHata = markerlar.length + " adet SUITE_DONE marker'ı (çift)";
  else {
    const [, ad, kosan, bek] = markerlar[0];
    if (ad !== name) gateHata = `marker adı uyuşmuyor (${ad})`;
    else if (+kosan !== +bek) gateHata = `kosan=${kosan} ≠ beklenen=${bek}`;
    else if (+bek !== beklenen) gateHata = `beklenen=${bek} ≠ manifest=${beklenen}`;
    else if (elleManifest[name] !== beklenen) gateHata = `manifest (${beklenen}) ≠ ELLE manifest (${elleManifest[name]})`;
    else if (Array.isArray(elleVakaAdlari[name]) && elleVakaAdlari[name].length !== beklenen) gateHata = `ELLE ad listesi uzunluğu (${elleVakaAdlari[name].length}) ≠ manifest (${beklenen})`;
    else if (ok + kotu !== +kosan) gateHata = `assertion satır sayısı (${ok + kotu}) ≠ kosan (${kosan})`;
    else {
      /* ——— VAKA LİSTESİ KAPISI (manifestin bağımsız kaynağı): assertion ADLARI donmuş
         suit-vakalar/<ad>.txt listesiyle birebir karşılaştırılır. Fark → FAIL. ——— */
      const vakaDosya = "suit-vakalar/" + name + ".txt";
      /* Normalizasyon kuralı: karşılaştırma anında YALNIZ .trim() — iç boşluk çöktürülmez
         (ad anlamı bozulur), donmuş/elle dosyalara DOKUNULMAZ, fark varsa FAIL (otomatik
         düzeltme yok). Çok satırlı üretilen ad iki tarafta da tek-satır formda saklanır
         (koşum ✓ satırı tek satırdır; elle liste de tek-satır string tutar). */
      const norm = (s) => s.trim();
      const donmus = readFileSync(vakaDosya, "utf8").split("\n").filter(Boolean).map(norm);
      const gorulen = [...cikti.matchAll(/^\s*[✓✗] (.*)$/gm)].map(m => norm(m[1]));
      /* ELLE MANIFEST kapısı: donmuş liste, elle yazılmış manifestle de doğrulanır —
         ikisi aynı kaynaktan (koşum) türemiş olsaydı fark sessiz kalırdı; artık ikisi
         FARKLI kaynak (koşum vs elle sayım) ve runner ikisini de zorunlu kılar. */
      const elle = elleManifest[name];
      const elleAdlar = elleVakaAdlari[name];
      if (elle === undefined) gateHata = "elle-manifest kaydı yok";
      else if (donmus.length !== elle) gateHata = `donmuş liste (${donmus.length}) ≠ ELLE manifest (${elle})`;
      else if (!Array.isArray(elleAdlar)) gateHata = "elle-vaka-adlari kaydı yok";
      else if (elleAdlar.length !== elle) gateHata = `ELLE ad listesi (${elleAdlar.length}) ≠ ELLE sayı (${elle})`;
      else if (gorulen.length !== elle) gateHata = `koşum (${gorulen.length}) ≠ ELLE manifest (${elle})`;
      else {
        /* AD BAZINDA, SIRALI, duplicate kontrollü üçlü karşılaştırma:
           donmuş ↔ koşum ↔ ELLE — her ad sırasıyla ve birebir (trim'li) eşleşmeli.
           Set KULLANILMAZ: sıra/takas açığı kalır; sıralı dizi karşılaştırması yapılır.
           Ayrıca duplicate ad kontrolü: aynı liste içinde aynı ad iki kez geçiyorsa
           takas gizlenebilir → explicit FAIL. */
        const dupKontrol = (arr, kaynak) => {
          const gorulenAd = new Map();
          for (let i = 0; i < arr.length; i++) {
            if (gorulenAd.has(arr[i])) return `${kaynak} duplicate vaka adı #${gorulenAd.get(arr[i]) + 1} ve #${i + 1}: "${arr[i]}"`;
            gorulenAd.set(arr[i], i);
          }
          return null;
        };
        gateHata = dupKontrol(donmus, "donmuş") || dupKontrol(gorulen, "koşum") || dupKontrol(elleAdlar, "ELLE") || null;
      }
      if (!gateHata) {
        const elleFark = donmus.findIndex((v, i) => v !== elleAdlar[i]);
        if (elleFark >= 0) gateHata = `AD farkı vaka #${elleFark + 1}: donmuş="${donmus[elleFark]}" ≠ ELLE="${elleAdlar[elleFark]}"`;
      }
      if (!gateHata) {
        const fark = donmus.findIndex((v, i) => v !== gorulen[i]);
        if (fark >= 0) gateHata = `vaka #${fark + 1}: donmuş="${donmus[fark]}" koşum="${gorulen[fark]}"`;
      }
    }
  }
  if (gateHata) console.log(`  [KAPI HATASI] ${gateHata}`);

  const gecti = r.status === 0 && kotu === 0 && !gateHata;
  toplamTest += ok + kotu;

  if (gecti) {
    toplamGecen += ok;
    console.log(`→ ${name}: ${ok} test ✓ GEÇTİ (SUITE_DONE:${markerlar[0]?.[2] ?? "?"}:${beklenen})`);
  } else {
    dusenler.push(`${name} (exit ${r.status}${kotu ? ", " + kotu + " kırmızı test" : ""}${gateHata ? ", kapı: " + gateHata : ""})`);
    console.log(`→ ${name}: BAŞARISIZ`);
  }
}

console.log("\n===== ÖZET =====");
const manifestToplam = Object.values(manifest).reduce((a, b) => a + b, 0);
const sdSatirlari = [...(process.env.__SD_YAKALA || "")];
if (dusenler.length === 0) {
  console.log(`${toplamGecen}/${toplamTest} OK`);
  console.log(`MANIFEST: 47 süit, toplam ${manifestToplam} beklenen | RUNNER: ${toplamTest} koşan, ${toplamGecen} geçen — ${manifestToplam === toplamTest && toplamGecen === toplamTest ? "BİREBİR EŞİT ✓" : "EŞİTSİZLİK ✗"}`);
  /* ——— HAM Σ GÖRÜNÜRLÜĞÜ: beş toplam tek satırda; fark ≠ 0 → FAIL + exit=1 ——— */
  const donmusSum = suites.reduce((a, n) => {
    try { return a + readFileSync("suit-vakalar/" + n + ".txt", "utf8").split("\n").filter(Boolean).length; } catch { return a; }
  }, 0);
  const elleSayiSum = Object.values(elleManifest).reduce((a, b) => a + b, 0);
  const elleAdSum = Object.values(elleVakaAdlari).reduce((a, b) => a + b.length, 0);
  console.log(`HAM Σ: runner=${toplamTest} = SUITE_DONE=${toplamGecen} = donmuş=${donmusSum} = ELLE sayı=${elleSayiSum} = ELLE ad=${elleAdSum} — ${new Set([toplamTest, toplamGecen, donmusSum, elleSayiSum, elleAdSum]).size === 1 ? "BİREBİR ✓" : "FARK VAR ✗"}`);
  if (new Set([toplamTest, toplamGecen, donmusSum, elleSayiSum, elleAdSum]).size !== 1) {
    console.log("Σ FARKI — FAIL");
    process.exit(1);
  }
  process.exit(0);
} else {
  console.log(`DÜŞEN TEST DOSYALARI: ${dusenler.join(" · ")}`);
  console.log(`${toplamGecen}/${toplamTest} OK — yukarıdaki dosyayı düzeltin.`);
  process.exit(1);
}
