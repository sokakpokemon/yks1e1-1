/* test.mjs — tüm regresyon testlerini sırayla çalıştırır ve özetler.
   Dördü de geçerse "86/86 OK" yazar; biri düşerse hangisinin düştüğünü gösterir. */
import { spawnSync } from "node:child_process";

const suites = ["ks-harness.mjs", "ks-test-render.mjs", "ks-durum-fn.mjs", "ks-grup-uyum.mjs", "ks-panel-secim.mjs", "ks-grup-gorunum.mjs", "ks-istekten-grup.mjs"];

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
