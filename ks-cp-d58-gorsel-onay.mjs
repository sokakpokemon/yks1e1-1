import { readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from "node:fs";
const A2 = "CHECKPOINT-ARSIV-2.md", CP = "CHECKPOINT.md";
const MARK = "D58-GORSEL-ONAY-TAMAM";
const TARIH = new Date().toISOString().slice(0, 10);
let a2 = readFileSync(A2, "utf8");
if (a2.includes(MARK)) { console.log("Zaten uygulanmış — no-op"); process.exit(0); }
const lines = a2.split("\n");
const bas = lines.map((l, i) => [i, l]).filter(([, l]) => l.startsWith("## ") && l.includes("D58"));
if (bas.length !== 1) { console.error("ANCHOR FAIL: '## ...D58' başlık " + bas.length + " kez. D58 satırları:\n" + lines.map((l, i) => l.includes("D58") ? (i + 1) + ": " + l : null).filter(Boolean).join("\n")); process.exit(1); }
const di = bas[0][0];
let son = di + 1;
while (son < lines.length && !lines[son].startsWith("## ") && lines[son] !== "---") son++;
const blokIdx = [];
for (let i = di; i < son; i++) if (lines[i].includes("GÖRSEL ONAY") && lines[i].trim().startsWith("- (")) blokIdx.push(i);
if (blokIdx.length > 1) { console.error("ANCHOR FAIL: açık GÖRSEL ONAY maddesi " + blokIdx.length + " satır:\n" + blokIdx.map(i => (i + 1) + ": " + lines[i]).join("\n")); process.exit(1); }
const cp = readFileSync(CP, "utf8");
const cpLines = cp.split("\n");
const cpHits = cpLines.map((l, i) => [i, l]).filter(([, l]) => l.includes("D58"));
if (cpHits.length !== 1) { console.error("ANCHOR FAIL: CHECKPOINT.md'de D58 satırı " + cpHits.length + " kez:\n" + cpHits.map(([i, l]) => (i + 1) + ": " + l).join("\n")); process.exit(1); }
if (!existsSync(CP + ".d58-onay-oncesi.bak")) copyFileSync(CP, CP + ".d58-onay-oncesi.bak");
if (!existsSync(A2 + ".d58-onay-oncesi.bak")) copyFileSync(A2, A2 + ".d58-onay-oncesi.bak");
if (blokIdx.length === 1) lines[blokIdx[0]] += " → ✅ KAPANDI (" + TARIH + ")";
else console.log("Bilgi: '- (N) ... GÖRSEL ONAY' maddesi yok — satır eki atlandı");
const ek = ["", "### CANLI DOĞRULAMA — GÖRSEL ONAY TAMAMLANDI (" + MARK + ")", "- Kullanıcı publish etti (" + TARIH + ") ve canlı uygulamada görsel kontrol yaptı: TEMİZ → D58 KAPANDI.", "- Dürüst not: görsel doğrulama KULLANICI beyanıdır; asistan bağımsız gözlem yapmadı (ortamda renderer yok)."];
lines.splice(son, 0, ...ek);
writeFileSync(A2, lines.join("\n"));
cpLines[cpHits[0][0]] += " · görsel onay TEMİZ (" + TARIH + ")";
writeFileSync(CP, cpLines.join("\n"));
const v = readFileSync(A2, "utf8");
if ((v.match(new RegExp(MARK, "g")) || []).length !== 1) { console.error("POST FAIL: marker sayısı 1 değil"); process.exit(1); }
console.log("SONRA: " + A2 + " " + statSync(A2).size + "B · " + CP + " " + statSync(CP).size + "B");
console.log("YEŞİL: D58 görsel onay kaydı yazıldı (" + TARIH + ")");
