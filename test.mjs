/* test.mjs — tüm regresyon testlerini sırayla çalıştırır ve özetler.
   Dördü de geçerse "86/86 OK" yazar; biri düşerse hangisinin düştüğünü gösterir. */
import { spawnSync } from "node:child_process";

const suites = ["ks-harness.mjs", "ks-test-render.mjs", "ks-durum-fn.mjs", "ks-grup-uyum.mjs", "ks-panel-secim.mjs", "ks-grup-gorunum.mjs", "ks-istekten-grup.mjs", "ks-grup-istegi.mjs", "ks-benzersiz-id.mjs", "ks-gercek-kadro.mjs", "ks-donem-ilk.mjs", "ks-donem-damga.mjs", "ks-donem-secici.mjs", "ks-excel-csv.mjs", "ks-donem-olusturma.mjs", "ks-donem-secici-gorunum.mjs", "ks-donem-secici-dom.mjs", "ks-sinifprog-csv.mjs", "ks-sablon-kopya.mjs", "ks-render-sahipligi.mjs", "ks-d1-render-refactor.mjs", "ks-kadro-siralama.mjs", "ks-kapali-gorunum.mjs", "ks-ek-ders-donem.mjs", "ks-ekders-gorunum.mjs", "ks-ekders-ozet-csv.mjs", "ks-birebir-gorunum.mjs", "ks-sinif-ogretmen-uyum.mjs", "ks-sinif-prog-uyum-onar.mjs", "ks-sinif-prog-etiket.mjs", "ks-kart-sirasi.mjs", "ks-kart-kolon.mjs", "ks-brans-ders-kurali.mjs", "ks-excel-ui-kontrol.mjs", "ks-wa-sablon.mjs", "ks-wa-onizleme.mjs", "ks-wa-durum.mjs", "ks-wa-alici.mjs", "ks-excel-k-import.mjs", "ks-kadro-kolon.mjs", "ks-kadro-telefon3.mjs", "ks-ders-tasi.mjs"];

console.log("YKS Birebir Takip — test runner");

const dusenler = [];
let toplamGecen = 0, toplamTest = 0;

for (const name of suites) {
  console.log(`\n===== ${name} =====`);
  const r = spawnSync(process.execPath, [name], { encoding: "utf8" });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);

  const cikti = (r.stdout || "") + (r.stderr || "");
  const ok = (cikti.match(/✓/g) || []).length;
  const kotu = (cikti.match(/✗/g) || []).length;
  const gecti = r.status === 0 && kotu === 0;
  toplamTest += ok + kotu;

  if (gecti) {
    toplamGecen += ok;
    console.log(`→ ${name}: ${ok} test ✓ GEÇTİ`);
  } else {
    dusenler.push(`${name} (exit ${r.status}${kotu ? ", " + kotu + " kırmızı test" : ""})`);
    console.log(`→ ${name}: BAŞARISIZ`);
  }
}

console.log("\n===== ÖZET =====");
if (dusenler.length === 0) {
  console.log(`${toplamGecen}/${toplamTest} OK`);
} else {
  console.log(`DÜŞEN TEST DOSYALARI: ${dusenler.join(" · ")}`);
  console.log(`${toplamGecen}/${toplamTest} OK — yukarıdaki dosyayı düzeltin.`);
}
process.exit(dusenler.length ? 1 : 0);
