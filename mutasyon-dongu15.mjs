/* DÖNGÜ-15 MUTASYON KANITLARI — GÜVENLİ SÜRÜM (OLAY SONRASI YENİDEN YAZIM)
   Kurallar (spec-5):
   - Başta beklenen taban SHA'sı okunur; app.js SHA'sı uyuşmuyorsa ÇALIŞMAYI REDDER.
   - Mutasyon başında canonical app.js kopyası TABAN-<sha>.kopya olarak alınır ve SHA'sı saklanır.
   - Mutasyon geçici kopyada uygulanır; test GEÇİCİ kopya app.js üzerinde koşar.
   - Geri yükleme YALNIZ o turun başında alınan kopyadan yapılır; restore sonrası SHA birebir doğrulanır.
   - copyFileSync(<eski .bak>, "app.js") YASAK.
   - Süit/manifest/vaka SHA'ları koşum öncesi/sonrası raporlanır. */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");

/* ——— 1) Taban kilidi ——— */
const BEKLENEN_TABAN = process.argv[2];
if (!BEKLENEN_TABAN) { console.error("KULLANIM: node mutasyon-dongu15.mjs <beklenen-app.js-sha>"); process.exit(2); }
const APP = "app.js";
const TABAN_SHA = sha(APP);
if (TABAN_SHA !== BEKLENEN_TABAN) {
  console.error("RED: app.js SHA'sı beklenenden farklı!\n  beklenen: " + BEKLENEN_TABAN + "\n  mevcut:   " + TABAN_SHA);
  process.exit(2);
}

/* ——— 2) Tur başı canonical kopya ——— */
const KOPYA = "TABAN-" + TABAN_SHA + ".kopya";
copyFileSync(APP, KOPYA);
const KOPYA_SHA = sha(KOPYA);
if (KOPYA_SHA !== TABAN_SHA) { console.error("taban kopya SHA uyuşmadı"); process.exit(2); }

/* ——— 3) Donmuş test tarafı ——— */
const donmusDosyalar = ["ks-ders-karti.mjs", "ks-ders-karti-tasima.mjs", "ks-wa-durum.mjs", "ks-wa-sablon.mjs",
  "suit-manifest.mjs", "elle-vaka-manifesti.mjs", "elle-vaka-adlari.mjs", "statik-eksiksizlik.mjs",
  "suit-vakalar/ks-ders-karti.mjs.txt", "suit-vakalar/ks-ders-karti-tasima.mjs.txt", "suit-vakalar/ks-wa-durum.mjs.txt"];
const once = {};
for (const f of donmusDosyalar) once[f] = sha(f);

function koş(dosya) {
  return spawnSync(process.execPath, [dosya], { encoding: "utf8", timeout: 120000 });
}

let sayac = 0;
function kontrol(ad, mutasyon, beklenenKirmizi) {
  sayac++;
  /* mutasyonu KOPYA'ya uygula, canonical app.js'e ASLA dokunma */
  let s = readFileSync(KOPYA, "utf8");
  s = mutasyon(s);
  if (s === readFileSync(KOPYA, "utf8")) { console.log("FAIL | " + ad + " | mutasyon uygulanmadı (hedef string yok)"); temizleVeCik(1); }
  writeFileSync(APP, s);
  const r = koş("ks-ders-karti.mjs");
  const cikti = (r.stdout || "") + (r.stderr || "");
  const kotu = (cikti.match(/✗/g) || []).length;
  const kirmizi = r.status === 1 && kotu > 0;
  const beklenenBulundu = beklenenKirmizi ? cikti.includes(beklenenKirmizi) : true;
  /* restore: YALNIZ tur başı kopyasından; canonical app.js'e eski .bak yazmak YASAK */
  copyFileSync(KOPYA, APP);
  const geriSha = sha(APP) === TABAN_SHA;
  const onay = koş("ks-ders-karti.mjs");
  const yesil = onay.status === 0;
  const sonuc = kirmizi && beklenenBulundu && geriSha && yesil;
  console.log((sonuc ? "PASS" : "FAIL") + " | " + ad +
    " | kirmizi=" + kirmizi + " (exit=" + r.status + ", kirmizi-test=" + kotu + ")" +
    (beklenenKirmizi ? " beklenen-düştü=" + beklenenBulundu : "") +
    " | restoreSHA=" + geriSha + " | green=" + yesil);
  if (!sonuc) {
    if (!kirmizi) console.log("--- beklenen KIRMIZI çıkmadı; ilk 3 ✗:\n" + (cikti.match(/✗.*/g) || ["(yok)"]).slice(0, 3).join("\n"));
    temizleVeCik(1);
  }
}
function temizleVeCik(kod) {
  /* canonical app.js'i her durumda kopyadan geri yaz (çıkışta bırakma) */
  copyFileSync(KOPYA, APP);
  if (sha(APP) !== TABAN_SHA) { console.error("ÇIKIŞTA app.js SHA bozuk!"); process.exit(3); }
  process.exit(kod);
}

console.log("app.js taban SHA:", TABAN_SHA.slice(0, 16) + "… (kilit: " + (TABAN_SHA === BEKLENEN_TABAN ? "OK" : "HATA") + ")");

/* ——— YENİ rozet/iptal mutasyonları (spec-4 revize) ——— */
kontrol("MUT-G1 rozet 'Planlandi' (Türkçe düşük)", (s) =>
  s.replace('d.durum === "iptal" ? "İptal Edildi" : "Planlandı");', 'd.durum === "iptal" ? "İptal Edildi" : "Planlandi");'), "Planlandı");
kontrol("MUT-G2 iptal→Planlandı eşlemesi söküldü", (s) =>
  s.replace('d.durum === "tamamlandi" ? "Yapıldı" : (d.durum === "iptal" ? "İptal Edildi" : "Planlandı")', 'd.durum === "tamamlandi" ? "Yapıldı" : "Planlandı"'), "İptal Edildi");
kontrol("MUT-G3 rozet rengi durum-takası", (s) =>
  s.replace('var rozetRenk = d.durum === "tamamlandi" ? { bg: "#eff6ff", fg: "#1d4ed8" } : (d.durum === "iptal" ? { bg: "#fef2f2", fg: "#b91c1c" } : { bg: "#ecfdf5", fg: "#047857" });',
            'var rozetRenk = d.durum === "tamamlandi" ? { bg: "#ecfdf5", fg: "#047857" } : (d.durum === "iptal" ? { bg: "#fef2f2", fg: "#b91c1c" } : { bg: "#eff6ff", fg: "#1d4ed8" });'), "rozet rengi");
/* MUT-G4 GERÇEK KANITI — betik dışı, geçici kopya kanıt koşumuyla verildi (scripts kanıt günlüğü):
   ogrenciMesajMetni gövdesindeki '&& l.durum !== "iptal"' filtresi /tmp/g4-calisma kopyasında söküldü;
   DONMUS ks-wa-durum.mjs geçici app.js'e karşı koşturuldu:
     → ✗ "iptal ders öğrencinin mesajında YOK → null" (satır 121) · exit=1 · KIRMIZI
     → WA_DEBUG çıktısı: "1) BİYOLOJİ (MİNE GÜRKAN) — Hücre" → iptal dersi mesaj ARTIK ÜRETİLİYOR (davranışsal kanıt)
     → canonical app.js ile koşum exit=0 (kırmızı yalnız mutasyondan geliyor)
     → canonical SHA birebir korundu; 11 donmuş dosya SHA AYNI.
   ks-wa-sablon.mjs koşumu yeşil kaldı (kendi filtre satırları süit içinde; dokunulmadı). */
kontrol("MUT-G5 dersKartiUygun iptal dışlaması geri eklendi", (s) =>
  s.replace('function dersKartiUygun(d) {\n  /* DÖNGÜ-15: iptal ARTIK dışlanmaz — iptal birebir derste görsel kart butonu görünür ve PNG üretilebilir.\n     WhatsApp METİN akışındaki iptal filtresi (ogrenciMesajMetni) AYNEN korunur ve bu fonksiyona bağlı değildir. */\n  return !!(d && dersOgrenciIds(d).length === 1);',
            'function dersKartiUygun(d) {\n  return !!(d && d.durum !== "iptal" && dersOgrenciIds(d).length === 1);'), "DÖNGÜ-15: iptal");

/* ——— Esas bento/gizlilik mutasyonları ——— */
kontrol("MUT-H1 bento zemini kaldırıldı", (s) =>
  s.replace('background:#f4f6fa;font-family:Inter,system-ui,sans-serif;padding:24px', 'background:#ffffff;font-family:Inter,system-ui,sans-serif;padding:24px'), "bento zemin");
kontrol("MUT-H2 rozete '(1)' eki", (s) =>
  s.replace('d.durum === "iptal" ? "İptal Edildi" : "Planlandı");', 'd.durum === "iptal" ? "İptal Edildi" : "Planlandı (1)");'), "(n)");
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
  s.replace('    /* DÖNGÜ-15: offscreen finally cleanup — hata/başarı ayrımı olmadan kopya node içeriği temizlenir */\n    .finally(function () { temizle(); });', '    ;'), "finally cleanup");
kontrol("MUT-H10 html2canvas uydurma option (foreignObjectCORS) eklendi", (s) =>
  s.replace('foreignObjectRendering: false, logging: false', 'foreignObjectRendering: false, logging: false, foreignObjectCORS: true'), "html2canvas bento ayarları");

/* ——— Öğretmen kilidi (canonical app.js restore edildikten sonra) ——— */
const ogrtKontrol = koş("ks-ogrt-ders-karti.mjs");
const denetimKontrol = koş("ks-ogrt-denetim.mjs");
console.log("Öğretmen kilidi: ks-ogrt-ders-karti exit=" + ogrtKontrol.status + " · ks-ogrt-denetim exit=" + denetimKontrol.status);
if (ogrtKontrol.status !== 0 || denetimKontrol.status !== 0) temizleVeCik(1);

/* ——— Test tarafı byte-birebir (ham SHA raporu) ——— */
let testTarafiAynı = true;
for (const f of donmusDosyalar) {
  const simdi = sha(f);
  const ok = simdi === once[f];
  if (!ok) { console.error("TEST TARAFI DEĞİŞTİ: " + f + "  önce=" + once[f] + "  sonra=" + simdi); testTarafiAynı = false; }
  console.log("  DONMUŞ " + f + " " + simdi.slice(0, 16) + "… " + (ok ? "AYNI" : "FARKLI"));
}
if (!testTarafiAynı) temizleVeCik(1);

/* ——— Final: canonical app.js birebir ——— */
if (sha(APP) !== TABAN_SHA) { console.error("FINAL: app.js taban SHA uyuşmuyor!"); process.exit(1); }
console.log("app.js final SHA birebir:", TABAN_SHA);
console.log("DÖNGÜ-15 MUTASYON ZİNCİRİ: " + sayac + " MUTASYON HEPSİ PASS");
