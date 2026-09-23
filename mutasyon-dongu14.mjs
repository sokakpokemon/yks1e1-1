/* mutasyon-dongu14.mjs — DÖNGÜ-14 kanıt zinciri
   YALNIZ app.js geçici kopya üzerinden; test-tarafı SHA'ları önce/sonra kanıtlı.
   MUT-D: rozete " (n)" sayı eki → A1..A6 kırmızı (yasak metin yakalanıyor)
   MUT-E: rozet sayı-ekisiz ama YANLIŞ metin ("Planlandi" / "Bozuk rozet") → A1..A6 kırmızı
          (doğru-biçimli yanlış metin de yakalanıyor → testler sözleşme METNİNİ zorluyor,
           "ne varsa ona eşit" değil)
   MUT-F: rozet METNİ doğru ama rozet yerleşimi/etiketi bozuk (rozet span'i başlığa
          taşınır / iki span) → hangi vaka düşerse tek tek raporlanır
   Her mutasyon: app.js'e yaz → ks-ogrt-denetim.mjs koştur → ham ✗ satırları + exit →
   restore → app.js SHA f85e1585… birebir kanıtı. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const BEFORE = sha("app.js");
if (BEFORE !== "f85e1585a87f3a9a13dd026247a2e7970e05dcdd4f0c41ed3213ff6c37e5f098") {
  console.error("BEKLENMEDİK app.js SHA: " + BEFORE + " — DUR"); process.exit(1);
}
copyFileSync("app.js", "/tmp/app-d14-oncesi.js");

const testTarafi = ["ks-ogrt-denetim.mjs", "suit-manifest.mjs", "elle-vaka-manifesti.mjs", "elle-vaka-adlari.mjs", "suit-vakalar/ks-ogrt-denetim.mjs.txt", "statik-eksiksizlik.mjs"];
const onceSha = Object.fromEntries(testTarafi.map(f => [f, sha(f)]));
console.log("=== MUTASYON ÖNCESİ test-tarafı SHA-256 ===");
for (const [f, s] of Object.entries(onceSha)) console.log(s + "  " + f);

const ROZET_ESKI = 'var rozet = !satirlar.length ? "Planlandı" : (tamam === satirlar.length ? "Yapıldı" : (tamam > 0 ? "Kısmen tamamlandı" : "Planlandı"));';

const mutasyonlar = [
  {
    ad: "MUT-D: rozet metnine ' (n)' sayı eki eklenir (yasak format geri gelir)",
    uygula: (s) => s.replace(ROZET_ESKI,
      'var rozet = !satirlar.length ? "Planlandı (0)" : (tamam === satirlar.length ? "Yapıldı (" + tamam + ")" : (tamam > 0 ? "Kısmen tamamlandı (" + tamam + ")" : "Planlandı (" + satirlar.length + ")"));'),
    hedefAdlar: ["A1", "A3", "A4", "A6"],
  },
  {
    ad: "MUT-E1: rozet sayı-ekisiz ama YANLIŞ metin ('Planlandi' — Türkçe karakter düşürülmüş)",
    uygula: (s) => s.replace(ROZET_ESKI,
      'var rozet = !satirlar.length ? "Planlandi" : (tamam === satirlar.length ? "Yapildi" : (tamam > 0 ? "Kismen tamamlandi" : "Planlandi"));'),
    hedefAdlar: ["A1", "A3", "A4", "A6"],
  },
  {
    ad: "MUT-E2: rozet sayı-ekisiz ama tamamen yanlış metin ('Bozuk rozet')",
    uygula: (s) => s.replace(ROZET_ESKI,
      'var rozet = !satirlar.length ? "Bozuk rozet" : (tamam === satirlar.length ? "Bozuk rozet" : (tamam > 0 ? "Bozuk rozet" : "Bozuk rozet"));'),
    hedefAdlar: ["A1", "A3", "A4", "A6"],
  },
  {
    ad: "MUT-F: kart VERİSİ doğru ama durum etiketi KARŞIT çevrilir (planlı↔tamamlanmış) — rozet 'Yapıldı' görünür ama kart yeşil değil; durum kaynağı bozulur",
    uygula: (s) => s.replace('durum: l.durum === "tamamlandi" ? "Yapıldı" : "Planlandı"', 'durum: l.durum === "tamamlandi" ? "Planlandı" : "Yapıldı"'),
    hedefAdlar: ["A1", "A4", "A6"], /* A3/A5 hepsi-tamamlandi senaryolarında değişmez gibi görünse de kaynak bozulur */
    kacis: true,
  },
];

let hepsiKirmizi = true;
for (const m of mutasyonlar) {
  const orijinal = readFileSync("/tmp/app-d14-oncesi.js", "utf8");
  const mut = m.uygula(orijinal);
  if (mut === orijinal) { console.error("MUTASYON ANKORU BULUNAMADI: " + m.ad); hepsiKirmizi = false; continue; }
  writeFileSync("app.js", mut);
  const r = spawnSync(process.execPath, ["ks-ogrt-denetim.mjs"], { encoding: "utf8" });
  const cikti = r.stdout || "";
  const kirmizilar = cikti.split("\n").filter(l => l.includes("✗")).map(l => l.trim().replace(/^✗\s*/, ""));
  console.log("\n=== " + m.ad + " ===");
  console.log("exit=" + r.status + " · kırmızı sayısı=" + kirmizilar.length);
  for (const k of kirmizilar) console.log("  HAM ✗: " + k);
  if (m.kacis) {
    console.log("  → MUT-F keşif: düşen vakalar yukarıda tek tek listelendi (rozet metni hâlâ doğru olduğundan A1–A6 YEŞİL kalması BEKLENİR; buton/başlık konumu testleri düşebilir)");
  } else {
    const hedefKirmizi = m.hedefAdlar.every(a => kirmizilar.some(k => k.startsWith(a + " ")));
    console.log("  hedef(" + m.hedefAdlar.join("+") + ") kırmızı=" + hedefKirmizi);
    if (!hedefKirmizi || r.status !== 1) { hepsiKirmizi = false; console.log("  !! BEKLENMEDİK SONUÇ"); }
  }
  if (kirmizilar.length === 0) { hepsiKirmizi = false; console.log("  !! HİÇBİR VAKA DÜŞMEDİ"); }
  copyFileSync("/tmp/app-d14-oncesi.js", "app.js");
  const shaRestore = sha("app.js");
  console.log("restore app.js SHA=" + shaRestore + (shaRestore === BEFORE ? " (BİREBİR)" : " (UYUŞMAZLIK!)"));
  if (shaRestore !== BEFORE) hepsiKirmizi = false;
}

console.log("\n=== MUTASYON SONRASI test-tarafı SHA-256 (önceyle birebir olmalı) ===");
let testTarafiDegismedi = true;
for (const f of testTarafi) {
  const s = sha(f);
  const ok = s === onceSha[f];
  if (!ok) testTarafiDegismedi = false;
  console.log(s + "  " + f + (ok ? "  ✓ aynı" : "  ✗ DEĞİŞTİ"));
}
console.log("Test tarafı değişmedi: " + (testTarafiDegismedi ? "KANITLANDI" : "İHLAL!"));

const r = spawnSync(process.execPath, ["ks-ogrt-denetim.mjs"], { encoding: "utf8" });
const sonuc = r.status === 0 && (r.stdout || "").includes("HEPSİ GEÇTİ");
console.log("\nRestore sonrası normal koşum: exit=" + r.status + " yeşil=" + sonuc);
console.log("app.js final SHA=" + sha("app.js"));
const tam = hepsiKirmizi && testTarafiDegismedi && sonuc && sha("app.js") === BEFORE;
console.log(tam ? "\nDÖNGÜ-14 KANIT ZİNCİRİ: TAMAM" : "\nDÖNGÜ-14 KANIT ZİNCİRİ: EKSİK — DUR");
process.exit(tam ? 0 : 1);
