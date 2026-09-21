/* test.mjs — tüm regresyon testlerini sırayla çalıştırır ve özetler.
   SUITE_DONE kapısı: her süit çıktıda TAM BİR 'SUITE_DONE:<ad>:<kosan>:<beklenen>'
   satırı basmak ZORUNDA; kosan === beklenen === manifest olmalı. Marker yoksa,
   çiftse veya sayılar uyuşmazsa süit FAIL sayılır. */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { manifest } from "./suit-manifest.mjs";
import { elleManifest } from "./elle-vaka-manifesti.mjs";

const suites = ["ks-harness.mjs", "ks-test-render.mjs", "ks-durum-fn.mjs", "ks-grup-uyum.mjs", "ks-panel-secim.mjs", "ks-grup-gorunum.mjs", "ks-istekten-grup.mjs", "ks-grup-istegi.mjs", "ks-benzersiz-id.mjs", "ks-gercek-kadro.mjs", "ks-donem-ilk.mjs", "ks-donem-damga.mjs", "ks-donem-secici.mjs", "ks-excel-csv.mjs", "ks-donem-olusturma.mjs", "ks-donem-secici-gorunum.mjs", "ks-donem-secici-dom.mjs", "ks-sinifprog-csv.mjs", "ks-sablon-kopya.mjs", "ks-render-sahipligi.mjs", "ks-d1-render-refactor.mjs", "ks-kadro-siralama.mjs", "ks-kapali-gorunum.mjs", "ks-ek-ders-donem.mjs", "ks-ekders-gorunum.mjs", "ks-ekders-ozet-csv.mjs", "ks-birebir-gorunum.mjs", "ks-sinif-ogretmen-uyum.mjs", "ks-sinif-prog-uyum-onar.mjs", "ks-sinif-prog-etiket.mjs", "ks-kart-sirasi.mjs", "ks-kart-kolon.mjs", "ks-brans-ders-kurali.mjs", "ks-excel-ui-kontrol.mjs", "ks-wa-sablon.mjs", "ks-wa-onizleme.mjs", "ks-wa-durum.mjs", "ks-wa-alici.mjs", "ks-excel-k-import.mjs", "ks-kadro-kolon.mjs", "ks-kadro-telefon3.mjs", "ks-ders-tasi.mjs", "ks-gunluk-ders-tasi.mjs", "ks-ders-karti.mjs", "ks-ders-karti-tasima.mjs"];

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
    else if (ok + kotu !== +kosan) gateHata = `assertion satır sayısı (${ok + kotu}) ≠ kosan (${kosan})`;
    else {
      /* ——— VAKA LİSTESİ KAPISI (manifestin bağımsız kaynağı): assertion ADLARI donmuş
         suit-vakalar/<ad>.txt listesiyle birebir karşılaştırılır. Fark → FAIL. ——— */
      const vakaDosya = "suit-vakalar/" + name + ".txt";
      const donmus = readFileSync(vakaDosya, "utf8").split("\n").filter(Boolean);
      const gorulen = [...cikti.matchAll(/^\s*[✓✗] (.*)$/gm)].map(m => m[1]);
      /* ELLE MANIFEST kapısı: donmuş liste, elle yazılmış manifestle de doğrulanır —
         ikisi aynı kaynaktan (koşum) türemiş olsaydı fark sessiz kalırdı; artık ikisi
         FARKLI kaynak (koşum vs elle sayım) ve runner ikisini de zorunlu kılar. */
      const elle = elleManifest[name];
      if (elle === undefined) gateHata = "elle-manifest kaydı yok";
      else if (donmus.length !== elle) gateHata = `donmuş liste (${donmus.length}) ≠ ELLE manifest (${elle})`;
      else if (donmus.length !== gorulen.length) gateHata = `vaka sayısı: donmuş=${donmus.length} koşum=${gorulen.length}`;
      else {
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
  console.log(`MANIFEST: 45 süit, toplam ${manifestToplam} beklenen | RUNNER: ${toplamTest} koşan, ${toplamGecen} geçen — ${manifestToplam === toplamTest && toplamGecen === toplamTest ? "BİREBİR EŞİT ✓" : "EŞİTSİZLİK ✗"}`);
  process.exit(0);
} else {
  console.log(`DÜŞEN TEST DOSYALARI: ${dusenler.join(" · ")}`);
  console.log(`${toplamGecen}/${toplamTest} OK — yukarıdaki dosyayı düzeltin.`);
  process.exit(1);
}
