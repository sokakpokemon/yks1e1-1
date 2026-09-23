/* DÖNGÜ-15 MUTASYON KANITLARI — yeşil app.js'in GEÇİCİ kopyasında koşar; her mutasyon:
   FAIL (exit=1) → restore (SHA birebir) → GREEN. Test/manifest/vaka dosyaları boyunca SHA dondurulur.
   Taban: MEVCUT app.js (bento+rozet+iptal uygulanmış, yeşil). Yedek app.js.dongu15-bento-oncesi.bak dokunulmaz. */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const TABAN = "app.js";
const BAK = "app.js.dongu15-bento-oncesi.bak";
const TABAN_SHA = sha(TABAN);

const donmusDosyalar = ["ks-ders-karti.mjs", "ks-ders-karti-tasima.mjs", "ks-wa-durum.mjs", "ks-wa-sablon.mjs",
  "suit-manifest.mjs", "elle-vaka-manifesti.mjs", "elle-vaka-adlari.mjs", "statik-eksiksizlik.mjs",
  "suit-vakalar/ks-ders-karti.mjs.txt", "suit-vakalar/ks-ders-karti-tasima.mjs.txt", "suit-vakalar/ks-wa-durum.mjs.txt"];
const once = {};
for (const f of donmusDosyalar) once[f] = sha(f);

function koş(dosya) {
  return spawnSync(process.execPath, [dosya], { encoding: "utf8", timeout: 120000 });
}
function kontrol(ad, mutasyon, beklenenKirmizi) {
  let s = readFileSync(TABAN, "utf8");
  s = mutasyon(s);
  if (s === readFileSync(TABAN, "utf8")) { console.log("FAIL | " + ad + " | mutasyon uygulanmadı (hedef string yok)"); process.exit(1); }
  writeFileSync(TABAN, s);
  const r = koş("ks-ders-karti.mjs");
  const cikti = (r.stdout || "") + (r.stderr || "");
  const kotu = (cikti.match(/✗/g) || []).length;
  const kirmizi = r.status === 1 && kotu > 0;
  const beklenenBulundu = beklenenKirmizi ? cikti.includes(beklenenKirmizi) : true;
  /* restore: taban dosyasını birebir geri yaz */
  copyFileSync(BAK + ".tmp-taban", TABAN).catch?.(() => {});
  /* taban kopyasını başta sakla */
  const geriSha = sha(TABAN) === TABAN_SHA;
  const onay = koş("ks-ders-karti.mjs");
  const yesil = onay.status === 0;
  const sonuc = kirmizi && beklenenBulundu && geriSha && yesil;
  console.log((sonuc ? "PASS" : "FAIL") + " | " + ad +
    " | kirmizi=" + kirmizi + " (exit=" + r.status + ", kirmizi-test=" + kotu + ")" +
    (beklenenKirmizi ? " beklenen-düştü=" + beklenenBulundu : "") +
    " | restoreSHA=" + geriSha + " | green=" + yesil);
  if (!sonuc) {
    if (!kirmizi) console.log("--- beklenen KIRMIZI çıkmadı; ilk 3 ✗:\n" + (cikti.match(/✗.*/g) || ["(yok)"]).slice(0, 3).join("\n"));
    process.exit(1);
  }
}

/* taban kopyasını bir kez sakla (restore kaynağı) */
copyFileSync(TABAN, BAK + ".tmp-taban");
if (sha(BAK + ".tmp-taban") !== TABAN_SHA) { console.error("taban kopya SHA uyuşmadı"); process.exit(1); }

console.log("app.js taban SHA:", TABAN_SHA.slice(0, 16) + "…");

/* ——— YENİ rozet/iptal mutasyonları (spec-4 revize) ——— */
/* MUT-G1: rozet metni yanlış ("Planlandi") — dersKartiVeri eşleme satırı */
kontrol("MUT-G1 rozet 'Planlandi' (Türkçe düşük)", (s) =>
  s.replace('d.durum === "tamamlandi" ? "Yapıldı" : (d.durum === "iptal" ? "İptal Edildi" : "Planlandı")',
            'd.durum === "tamamlandi" ? "Yapıldı" : (d.durum === "iptal" ? "İptal Edildi" : "Planlandi")'), "Planlandı");
/* MUT-G2: iptal eşlemesi kaldırıldı (iptal → "Planlandı") — hem veri hem renk dalı düşer */
kontrol("MUT-G2 iptal→Planlandı eşlemesi söküldü", (s) =>
  s.replace('d.durum === "tamamlandi" ? "Yapıldı" : (d.durum === "iptal" ? "İptal Edildi" : "Planlandı")',
            'd.durum === "tamamlandi" ? "Yapıldı" : "Planlandı"'), "İptal Edildi");
/* MUT-G3: rozet rengi yanlış duruma bağlandı (Planlandı ↔ Yapıldı bg takası, dersKartiHTML) */
kontrol("MUT-G3 rozet rengi durum-takası", (s) =>
  s.replace('var rozetRenk = d.durum === "tamamlandi" ? { bg: "#eff6ff", fg: "#1d4ed8" } : (d.durum === "iptal" ? { bg: "#fef2f2", fg: "#b91c1c" } : { bg: "#ecfdf5", fg: "#047857" });',
            'var rozetRenk = d.durum === "tamamlandi" ? { bg: "#ecfdf5", fg: "#047857" } : (d.durum === "iptal" ? { bg: "#fef2f2", fg: "#b91c1c" } : { bg: "#eff6ff", fg: "#1d4ed8" });'), "rozet rengi");
/* MUT-G4: WA iptal filtresi ogrenciMesajMetni'nden kaldırıldı */
kontrol("MUT-G4 WA iptal filtresi kaldırıldı (ogrenciMesajMetni)", (s) =>
  s.replace('return (l.ogrenciId === o.id || l.ogrenciAd === o.ad) && l.durum !== "iptal";',
            'return (l.ogrenciId === o.id || l.ogrenciAd === o.ad);'), "ogrenciMesajMetni iptal filtresi");
/* MUT-G5: iptal derste buton koşulu söküldü (dersKartiUygun'a iptal dışlaması geri eklendi) */
kontrol("MUT-G5 dersKartiUygun iptal dışlaması geri eklendi", (s) =>
  s.replace('function dersKartiUygun(d) {\n  return !!(d && dersOgrenciIds(d).length === 1);',
            'function dersKartiUygun(d) {\n  return !!(d && d.durum !== "iptal" && dersOgrenciIds(d).length === 1);'), "DÖNGÜ-15: iptal");

/* ——— Esas bento/gizlilik mutasyonları ——— */
kontrol("MUT-H1 bento zemini kaldırıldı", (s) =>
  s.replace('background:#f4f6fa;font-family:Inter,system-ui,sans-serif;padding:24px', 'background:#ffffff;font-family:Inter,system-ui,sans-serif;padding:24px'), "bento zemin");
kontrol("MUT-H2 rozete '(1)' eki", (s) =>
  s.replace('d.durum === "iptal" ? "İptal Edildi" : "Planlandı")', 'd.durum === "iptal" ? "İptal Edildi" : "Planlandı (1)")'), "(n)");
kontrol("MUT-H3 'Genel tekrar' dalı kaldırıldı", (s) =>
  s.replace('kutu("#f9f5fc", "#8b5cf6", "KONU", v.konu || "Genel tekrar")', 'kutu("#f9f5fc", "#8b5cf6", "KONU", v.konu)'), "Genel tekrar");
kontrol("MUT-H4 'Sınıf belirtilmemiş' dalı kaldırıldı", (s) =>
  s.replace('sinif: (o && o.sinif) || "Sınıf belirtilmemiş"', 'sinif: (o && o.sinif) || ""'), "Sınıf belirtilmemiş");
kontrol("MUT-H5 karta class= (Tailwind bağımlılığı) geri eklendi", (s) =>
  s.replace('<div id="dersKartiGovde" style="width:640px;background:#f4f6fa', '<div id="dersKartiGovde" class="bento" style="width:640px;background:#f4f6fa'), "class=");
kontrol("MUT-H6 PNG'ye telefon sızdırıldı", (s) =>
  s.replace('kutu("#eff9f7", "#14b8a6", "DERS", v.ders)', 'kutu("#eff9f7", "#14b8a6", "DERS", v.ders + " " + ((v.o && v.o.tel) ? v.o.tel : ""))'), "telefon");
kontrol("MUT-H7 dosya adına telefon eklendi", (s) =>
  s.replace('return "ders-karti-" + String(v.ad)', 'return "ders-karti-" + String(v.ad) + ((v.o && v.o.tel) ? "-" + v.o.tel : "")'), "telefon");
kontrol("MUT-H8 offscreen finally cleanup kaldırıldı", (s) =>
  s.replace('    /* DÖNGÜ-15: offscreen finally cleanup — hata/başarı ayrımı olmadan kopya node içeriği temizlenir */\n    .finally(function () { temizle(); });',
            '    ;'), "finally cleanup");
kontrol("MUT-H10 html2canvas uydurma option (foreignObjectCORS) eklendi", (s) =>
  s.replace('foreignObjectRendering: false, logging: false', 'foreignObjectRendering: false, logging: false, foreignObjectCORS: true'), "html2canvas bento ayarları");

/* ——— Öğretmen kilidi: mutasyonlar sonrası (restore edilmiş app.js) öğretmen süitleri yeşil ——— */
const ogrtKontrol = koş("ks-ogrt-ders-karti.mjs");
const denetimKontrol = koş("ks-ogrt-denetim.mjs");
console.log("Öğretmen kilidi: ks-ogrt-ders-karti exit=" + ogrtKontrol.status + " · ks-ogrt-denetim exit=" + denetimKontrol.status);
if (ogrtKontrol.status !== 0 || denetimKontrol.status !== 0) process.exit(1);

/* ——— Test tarafı byte-birebir ——— */
let testTarafiAynı = true;
for (const f of donmusDosyalar) {
  if (sha(f) !== once[f]) { console.error("TEST TARAFI DEĞİŞTİ: " + f); testTarafiAynı = false; }
}
console.log(testTarafiAynı ? "Test tarafı değişmedi: KANITLANDI (" + donmusDosyalar.length + " dosya SHA birebir)" : "KANIT GEÇERSİZ");
if (!testTarafiAynı) process.exit(1);

if (sha(TABAN) !== TABAN_SHA) { console.error("FINAL: app.js taban SHA uyuşmuyor!"); process.exit(1); }
console.log("DÖNGÜ-15 MUTASYON ZİNCİRİ: HEPSİ PASS");
