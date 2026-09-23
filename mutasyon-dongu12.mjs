/* mutasyon-dongu12.mjs — DÖNGÜ-12 mutasyon kanıtı
   Üç mutasyon, üçü de GEÇİCİ app.js kopyasında (gerçek dosya restore edilir):
    MUT-A: sınıf dersi kart segmentine MATEMATİK sızdırılır → denetim süiti E2 KIRMIZI (exit=1)
    MUT-B: saat başlığı bozulur ("1 · 08:50-09:30" → "1 · 08:51") → denetim süiti E4 KIRMIZI (exit=1)
    MUT-C: ad hücresinde buton İKİ KEZ çizilir → denetim süiti B1 KIRMIZI (exit=1)
   Her mutasyon sonrası backup'tan restore + SHA-256 byte-birebir kanıtı. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const BEFORE = sha("app.js");
copyFileSync("app.js", "/tmp/app-d12-mutasyon-oncesi.js");

const mutasyonlar = [
  {
    ad: "MUT-A: MATEMATİK sınıf kartı segmentine sızar",
    uygula: (s) => s.replace(
      'esc(r.sinif) + "</div>" + cakismaRozeti + "</div>";',
      'esc(r.sinif) + " MATEMATİK</div>" + cakismaRozeti + "</div>";'
    ),
    beklenti: "E2 kırmızı",
    hedefAd: "E2",
  },
  {
    ad: "MUT-B: saat başlığı bozulur (PNG tablosu başlık üretimi değişir)",
    /* Gerçek üretim ankoru: dersKartiOgrtGunlukHTML içindeki başlık satırı (haftalik izgara üretimine DOKUNULMAZ).
       '\u00b7' arası boşluk çıkarılıp saat '08:51' yapılır → E4'teki tam-biçim '1 · 08:50' eşleşmesi kırılır. */
    uygula: (s) => s.replace(
      "'<div style=\"font-size:11px;font-weight:800;color:#475569\">' + k.no + \" \\u00b7 \" + k.b + \"</div>\" +",
      "'<div style=\"font-size:11px;font-weight:800;color:#475569\">' + k.no + \" \\u00b7\" + (k.b === \"08:50\" ? \"08:51\" : k.b) + \"</div>\" +"
    ),
    beklenti: "E4 kırmızı",
    hedefAd: "E4",
  },
  {
    ad: "MUT-C: ad hücresinde buton iki kez çizilir",
    uygula: (s) => s.replace(
      "(ogrtId && ogrtGunlukSatirVar ? dersKartiOgrtGunlukBtnHTML(ogrtId, gunKey) : \"\") + '</td>';",
      "(ogrtId && ogrtGunlukSatirVar ? dersKartiOgrtGunlukBtnHTML(ogrtId, gunKey) + dersKartiOgrtGunlukBtnHTML(ogrtId, gunKey) : \"\") + '</td>';"
    ),
    beklenti: "B1 kırmızı",
    hedefAd: "B1",
  },
];

let hepsiKirmizi = true;
for (const m of mutasyonlar) {
  let src = readFileSync("/tmp/app-d12-mutasyon-oncesi.js", "utf8");
  src = m.uygula(src);
  if (src === readFileSync("/tmp/app-d12-mutasyon-oncesi.js", "utf8")) {
    console.error("MUTASYON UYGULANAMADI (ankor bulunamadı): " + m.ad);
    hepsiKirmizi = false;
    continue;
  }
  writeFileSync("app.js", src);
  const r = spawnSync(process.execPath, ["ks-ogrt-denetim.mjs"], { encoding: "utf8" });
  const cikti = r.stdout || "";
  const hedefKirmizi = cikti.includes("✗ " + m.hedefAd);
  const exit1 = r.status === 1;
  console.log(m.ad + " → hedef(" + m.hedefAd + ") kırmızı=" + hedefKirmizi + ", exit=" + r.status + " [" + m.beklenti + "]");
  if (!hedefKirmizi || !exit1) {
    hepsiKirmizi = false;
    console.log(cikti.split("\n").filter(l => l.includes("✗")).join("\n"));
  }
  /* restore */
  copyFileSync("/tmp/app-d12-mutasyon-oncesi.js", "app.js");
  if (sha("app.js") !== BEFORE) { console.error("RESTORE SHA UYUŞMAZLIĞI: " + m.ad); hepsiKirmizi = false; }
}

/* son doğrulama: normal koşum yeniden yeşil */
const r = spawnSync(process.execPath, ["ks-ogrt-denetim.mjs"], { encoding: "utf8" });
const sonuc = r.status === 0 && (r.stdout || "").includes("HEPSİ GEÇTİ");
console.log("Restore sonrası normal koşum: exit=" + r.status + " yeşil=" + sonuc + " · app.js SHA=" + sha("app.js").slice(0, 16) + "…");
process.exit(hepsiKirmizi && sonuc && sha("app.js") === BEFORE ? 0 : 1);
