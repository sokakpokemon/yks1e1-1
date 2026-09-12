/* ks-yama-v3-duzelt.mjs — hedefli yama (app.js baştan yazılmaz):
   B-düzeltme: grupPanelCiz kapalı dalı markup BOŞALTIR (boot kalıntısı id kaydı olmasın)
   A-düzeltme: havuz seçiminde ÇIKARMA+YENİDEN EKLEME sırayı ilk-seçim düzenine döndürür
   Her değişiklik assert edilir; idempotent (uygulanmışsa exit 2). */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const DOSYA = "app.js";
const once = readFileSync(DOSYA, "utf8");

const DEGISIMLER = [
  {
    ad: "A-düzeltme: havuz çıkarma+yeniden eklemede ilk-seçim sırası",
    eski: "    if (_k === -1) ui.grupPanelSira.push(oid); else ui.grupPanelSira.splice(_k, 1);\n",
    yeni:
      "    if (_k !== -1) ui.grupPanelSira.splice(_k, 1);\n" +
      "    /* ISTEK-GRUP-ISTEGI-YAMASI-v3 (A-düzeltme): ÇIKARMA + YENİDEN EKLEMEDE ilk seçim sırası GERİ GELİR —\n" +
      "       üye her zaman dizinin SONUNA eklenir; sıra [ilk-seçim … son-seçim] kalır, [ana]+ek ayrımı korunur */\n" +
      "    ui.grupPanelSira.push(oid);\n",
  },
  {
    ad: "B-düzeltme: kapalı panel markup'ı boşaltılır (boot kalıntısı yok)",
    eski: '  if (!ui.panelSecim.acik) { govdeEl.classList.add("hidden"); if (!govdeEl.innerHTML) govdeEl.innerHTML = grupPanelGovdeHTML(); grupPanelListeCiz(); return; }\n',
    yeni:
      '  /* ISTEK-GRUP-ISTEGI-YAMASI-v3 (B-düzeltme): kapalıyken markup BOŞALTILIR (v2 öncesi davranış;\n' +
      "     grupPanelListeCiz zaten kapalıyken çizmez) — açılırken filtre markup'ı grupPanelGovdeHTML'den taze çizilir */\n" +
      '  if (!ui.panelSecim.acik) { govdeEl.classList.add("hidden"); govdeEl.innerHTML = ""; return; }\n',
  },
];

/* idempotentlik: v3 işaretleri zaten varsa dokunma */
if (once.includes("YAMASI-v3 (A-düzeltme)") && once.includes("YAMASI-v3 (B-düzeltme)")) {
  console.log("Zaten uygulanmış (v3 işaretleri mevcut) — dosya değiştirilmedi.");
  process.exit(2);
}

let sonra = once;
const yedek = DOSYA + ".v3-oncesi.bak";
copyFileSync(DOSYA, yedek);

for (const d of DEGISIMLER) {
  const n = sonra.split(d.eski).length - 1;
  if (n !== 1) {
    console.error(`ASSERT BAŞARISIZ [${d.ad}]: eşleşme sayısı ${n} (beklenen 1) — yazma iptal.`);
    process.exit(1);
  }
  sonra = sonra.replace(d.eski, d.yeni);
}

/* doğrulamalar */
const ASSERTS = [
  ["kapalı dal boşaltıyor", sonra.includes('if (!ui.panelSecim.acik) { govdeEl.classList.add("hidden"); govdeEl.innerHTML = ""; return; }')],
  ["eski kapalı-dal satırı kaldırıldı", !sonra.includes("if (!govdeEl.innerHTML) govdeEl.innerHTML = grupPanelGovdeHTML()")],
  ["çıkar→ekle sırası düzeldi", sonra.includes("if (_k !== -1) ui.grupPanelSira.splice(_k, 1);") && sonra.includes("ui.grupPanelSira.push(oid);")],
  ["eski tek-satırlık toggle kaldırıldı", !sonra.includes("if (_k === -1) ui.grupPanelSira.push(oid); else ui.grupPanelSira.splice(_k, 1);")],
  ["v2 (F) ASI düzeltmesi yerinde", sonra.includes("return '<div class=\"flex flex-col sm:flex-row gap-2\">' +")],
  ["v3 işaretleri", sonra.includes("YAMASI-v3 (A-düzeltme)") && sonra.includes("YAMASI-v3 (B-düzeltme)")],
  ["satır sayısı mantıklı büyüdü (+5)", sonra.split("\n").length === once.split("\n").length + 5],
];
let hata = 0;
for (const [ad, ok] of ASSERTS) {
  console.log((ok ? "  ✓ " : "  ✗ ") + ad);
  if (!ok) hata = 1;
}
if (hata) {
  console.error("ASSERT BAŞARISIZ — dosya YAZILMADI (yedek " + yedek + " duruyor).");
  process.exit(1);
}
writeFileSync(DOSYA, sonra);
console.log("Yama uygulandı → " + DOSYA + " (yedek: " + yedek + ")");
