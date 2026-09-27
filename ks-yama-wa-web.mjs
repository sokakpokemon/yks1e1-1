/* ks-yama-wa-web.mjs — WhatsApp gönderme linkini WEB sürümüne çevirir (TEK idempotent yama).
   wa.me / api.whatsapp.com → https://web.whatsapp.com/send?phone=<rakam>&text=<encodeURIComponent>
   Telefon: yalnız rakam, baştaki 0 atılır, 90 ülke kodu eklenir (yoksa). Telefonsuz: .../send?text=<enc>

   Dokunulan dosyalar (yalnız bunlar): app.js · ks-wa-alici.mjs · ks-wa-onizleme.mjs · ks-kadro-telefon3.mjs
   Yedek: her dosya için yazmadan ÖNCE <ad>.wa-web-oncesi.bak (zaten varsa YENİDEN alınmaz).

   Mesaj metni / iptal filtresi / telefonsuz uyarı / önizleme-kopyalama davranışı DEĞİŞMEZ.
   DÖNGÜ-25 şablonu ve DÖNGÜ-27 alıcı/mesaj mantığı DEĞİŞMEZ; yalnız açılan URL değişir.
   Assertion ADLARI (donmuş vaka listeleri) DEĞİŞMEZ — yalnız beklenen URL metni güncellenir. */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const ISARET = "web.whatsapp.com/send"; /* uygulanmışlık kontrolü */
const sha16 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/* ——— Değişiklik çiftleri (String.raw: ters bölü kaçışları birebir) ——— */
const APP_ESKI = String.raw`function waUrl(metin, tel) {
  var no = String(tel || "").replace(/\D/g, "");
  if (no) return "https://wa.me/" + no + "?text=" + encodeURIComponent(metin);
  return "https://wa.me/?text=" + encodeURIComponent(metin);
}`;
const APP_YENI = String.raw`function waUrl(metin, tel) {
  var no = String(tel || "").replace(/\D/g, "").replace(/^0+/, "");
  if (no) {
    if (no.slice(0, 2) !== "90") no = "90" + no;
    return "https://web.whatsapp.com/send?phone=" + no + "&text=" + encodeURIComponent(metin);
  }
  return "https://web.whatsapp.com/send?text=" + encodeURIComponent(metin);
}`;

const plan = [
  { dosya: "app.js", ciftler: [[APP_ESKI, APP_YENI]] },
  {
    dosya: "ks-wa-alici.mjs",
    ciftler: [
      [
        String.raw`const urlAnne = "https://wa.me/" + A1 + "?text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));`,
        String.raw`const urlAnne = "https://web.whatsapp.com/send?phone=" + ("90" + A1.replace(/\D/g, "").replace(/^0+/, "")) + "&text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));`,
      ],
      [
        String.raw`const urlBaba = "https://wa.me/" + B1 + "?text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));`,
        String.raw`const urlBaba = "https://web.whatsapp.com/send?phone=" + ("90" + B1.replace(/\D/g, "").replace(/^0+/, "")) + "&text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));`,
      ],
      [
        String.raw`const urlOgr = "https://wa.me/" + T1 + "?text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));`,
        String.raw`const urlOgr = "https://web.whatsapp.com/send?phone=" + ("90" + T1.replace(/\D/g, "").replace(/^0+/, "")) + "&text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));`,
      ],
      [
        String.raw`t("waUrl formatı korunmuş", waUrl("Merhaba dünya", "05551112233") === "https://wa.me/05551112233?text=" + encodeURIComponent("Merhaba dünya"));`,
        String.raw`t("waUrl formatı korunmuş", waUrl("Merhaba dünya", "05551112233") === "https://web.whatsapp.com/send?phone=905551112233&text=" + encodeURIComponent("Merhaba dünya"));`,
      ],
      [
        String.raw`t("waUrl boş tel → wa.me/?text", waUrl("x", "") === "https://wa.me/?text=" + encodeURIComponent("x"));`,
        String.raw`t("waUrl boş tel → wa.me/?text", waUrl("x", "") === "https://web.whatsapp.com/send?text=" + encodeURIComponent("x"));`,
      ],
    ],
  },
  {
    dosya: "ks-wa-onizleme.mjs",
    ciftler: [
      [
        String.raw`t("waUrl formatı korunmuş", url === "https://wa.me/" + String(tel).replace(/\D/g, "") + "?text=" + encodeURIComponent(m) || url === "https://wa.me/?text=" + encodeURIComponent(m));`,
        String.raw`t("waUrl formatı korunmuş", url === (function () { var n = String(tel || "").replace(/\D/g, "").replace(/^0+/, ""); if (n && n.slice(0, 2) !== "90") n = "90" + n; return n ? "https://web.whatsapp.com/send?phone=" + n + "&text=" + encodeURIComponent(m) : "https://web.whatsapp.com/send?text=" + encodeURIComponent(m); })());`,
      ],
    ],
  },
  {
    dosya: "ks-kadro-telefon3.mjs",
    ciftler: [
      [
        String.raw`t("waUrl boş tel → wa.me/?text", waUrl("Merhaba", "") === "https://wa.me/?text=" + encodeURIComponent("Merhaba"));`,
        String.raw`t("waUrl boş tel → wa.me/?text", waUrl("Merhaba", "") === "https://web.whatsapp.com/send?text=" + encodeURIComponent("Merhaba"));`,
      ],
    ],
  },
];

/* ——— İdempotanlık: hepsi zaten yeni mi? ——— */
if (plan.every((p) => readFileSync(p.dosya, "utf8").includes(ISARET))) {
  console.error("Zaten uygulanmış (web.whatsapp.com/send). Değişiklik yok.");
  process.exit(2);
}

/* ——— FAZ 1: doğrula (hiçbir dosya YAZILMADAN) ——— */
for (const p of plan) {
  const src = readFileSync(p.dosya, "utf8");
  for (const [eski, yeni] of p.ciftler) {
    const varEski = src.includes(eski);
    const varYeni = src.includes(yeni);
    if (!varEski && !varYeni) {
      console.error(`DUR: ${p.dosya} içinde hedef metin bulunamadı (ne eski ne yeni):\n  ${eski.slice(0, 80)}…`);
      process.exit(1);
    }
  }
}

/* ——— FAZ 2: yedek + uygula ——— */
const rapor = [];
for (const p of plan) {
  const yol = p.dosya;
  const once = readFileSync(yol, "utf8");
  const bak = yol + ".wa-web-oncesi.bak";
  if (!existsSync(bak)) copyFileSync(yol, bak);
  let metin = once;
  let uygulanan = 0;
  for (const [eski, yeni] of p.ciftler) {
    if (metin.includes(yeni)) continue; /* bu çift zaten yeni */
    const parcalar = metin.split(eski);
    if (parcalar.length !== 2) {
      console.error(`DUR: ${yol} — hedef metin ${parcalar.length - 1} kez (1 olmalı).`);
      process.exit(1);
    }
    metin = parcalar[0] + yeni + parcalar[1];
    uygulanan++;
  }
  if (metin !== once) writeFileSync(yol, metin);
  rapor.push({ dosya: yol, once, sonra: metin, uygulanan, bak });
}

/* ——— Rapor ——— */
for (const r of rapor) {
  console.log(
    `${r.dosya}: ${Buffer.byteLength(r.once)}B ${sha16(r.once)} → ${Buffer.byteLength(r.sonra)}B ${sha16(r.sonra)}  (${r.uygulanan} çift, yedek ${r.bak})`
  );
}
console.log("TAMAM: WhatsApp linki web.whatsapp.com/send biçimine çevrildi.");
