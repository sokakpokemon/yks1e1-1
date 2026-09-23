/* DÖNGÜ-15 MUTASYON KANITLARI — yalnız GEÇİCİ app.js kopyasında koşar; her mutasyon:
   FAIL (exit=1) → backup restore (SHA birebir) → GREEN. Test/manifest/vaka dosyaları boyunca SHA dondurulur. */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const BAK = "app.js.dongu15-bento-oncesi.bak";
const BASE_SHA = sha(BAK);

/* Mutasyon boyunca DONMUŞ test tarafı (byte-birebir zorunlu) */
const donmusDosyalar = ["ks-ders-karti.mjs", "ks-ders-karti-tasima.mjs", "ks-wa-durum.mjs", "ks-wa-sablon.mjs",
  "suit-manifest.mjs", "elle-vaka-manifesti.mjs", "elle-vaka-adlari.mjs", "statik-eksiksizlik.mjs",
  "suit-vakalar/ks-ders-karti.mjs.txt", "suit-vakalar/ks-ders-karti-tasima.mjs.txt", "suit-vakalar/ks-wa-durum.mjs.txt"];
const once = {};
for (const f of donmusDosyalar) once[f] = sha(f);

function koş(dosya) {
  return spawnSync(process.execPath, [dosya], { encoding: "utf8", timeout: 120000 });
}
function appKur(mutasyon) {
  let s = readFileSync(BAK, "utf8");
  s = mutasyon(s);
  writeFileSync("app.js", s);
}
function kontrol(ad, mutasyon, beklenenKirmizi) {
  appKur(mutasyon);
  const r = koş("ks-ders-karti.mjs");
  const cikti = r.stdout + r.stderr;
  const kotu = (cikti.match(/✗/g) || []).length;
  const kirmizi = r.status === 1 && kotu > 0;
  const beklenenBulundu = beklenenKirmizi ? cikti.includes(beklenenKirmizi) : true;
  /* restore */
  copyFileSync(BAK, "app.js");
  const geriSha = sha("app.js") === BASE_SHA;
  const onay = koş("ks-ders-karti.mjs");
  const yesil = onay.status === 0 && ((onay.stdout || "") + (onay.stderr || "")).includes("✗") === false; /* ✗ YOK + exit=0 (fail-dalı da marker basıyor) */
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

console.log("app.js backup SHA:", BASE_SHA.slice(0, 16) + "…");

/* ——— YENİ rozet/iptal mutasyonları (spec-4 revize) ——— */
/* MUT-G1: rozet metni yanlış ("Planlandi") */
kontrol("MUT-G1 rozet 'Planlandi' (Türkçe düşük)", (s) =>
  s.replace('d.durum === "iptal" ? "İptal Edildi" : "Planlandı");', 'd.durum === "iptal" ? "İptal Edildi" : "Planlandi");'), "Planlandı");
/* MUT-G2: iptal eşlemesi kaldırıldı (iptal → "Planlandı") */
kontrol("MUT-G2 iptal→Planlandı eşlemesi söküldü", (s) =>
  s.replace('d.durum === "tamamlandi" ? "Yapıldı" : (d.durum === "iptal" ? "İptal Edildi" : "Planlandı")', 'd.durum === "tamamlandi" ? "Yapıldı" : "Planlandı"'), "İptal Edildi");
/* MUT-G3: rozet rengi yanlış duruma bağlandı (Planlandı↔Yapıldı renk takası) */
kontrol("MUT-G3 rozet rengi durum-takası", (s) =>
  s.replace('var rozetBg = d.durum === "tamamlandi" ? "#eff6ff" : (d.durum === "iptal" ? "#fef2f2" : "#ecfdf5");', 'var rozetBg = d.durum === "tamamlandi" ? "#ecfdf5" : (d.durum === "iptal" ? "#fef2f2" : "#eff6ff");'), "rozet rengi");
/* MUT-G4: WA iptal filtresi ogrenciMesajMetni'nden kaldırıldı */
kontrol("MUT-G4 WA iptal filtresi kaldırıldı (ks-ders-karti)", (s) =>
  s.replace('return (l.ogrenciId === o.id || l.ogrenciAd === o.ad) && l.durum !== "iptal";', 'return (l.ogrenciId === o.id || l.ogrenciAd === o.ad);'), "WA");
/* MUT-G5: iptal derste buton koşulu söküldü (dersKartiUygun'a iptal dışlaması geri eklendi) */
kontrol("MUT-G5 dersKartiUygun iptal dışlaması geri eklendi", (s) =>
  s.replace('function dersKartiUygun(d) {\n  return !!(d && dersOgrenciIds(d).length === 1);', 'function dersKartiUygun(d) {\n  return !!(d && d.durum !== "iptal" && dersOgrenciIds(d).length === 1);'), "DÖNGÜ-15");

/* ——— DÖNGÜ-15 esas mutasyonları ——— */
kontrol("MUT-H1 bento bölümü kaldırıldı (eski satir-listesine dönüş simüle)", (s) =>
  s.replace("background:#f4f6fa", "background:#fff").replace("Formül Kurs", "Ders Kartı"), "bento");
kontrol("MUT-H2 rozete '(1)' eki", (s) =>
  s.replace('d.durum === "iptal" ? "İptal Edildi" : "Planlandı");', 'd.durum === "iptal" ? "İptal Edildi" : "Planlandı (1)");'), "(1)");
kontrol("MUT-H3 'Genel tekrar' dalı kaldırıldı", (s) =>
  s.replace('kutu("KONU", v.konu || "Genel tekrar", "#f9f5fc", "#7e22ce")', 'kutu("KONU", v.konu, "#f9f5fc", "#7e22ce")'), "Genel tekrar");
kontrol("MUT-H4 'Sınıf belirtilmemiş' dalı kaldırıldı", (s) =>
  s.replace('sinif: (o && o.sinif) || "Sınıf belirtilmemiş"', 'sinif: (o && o.sinif) || ""'), "Sınıf belirtilmemiş");
kontrol("MUT-H5 karta class= (Tailwind) geri eklendi", (s) =>
  s.replace('<div id="dersKartiGovde" style="width:640px;background:#f4f6fa', '<div id="dersKartiGovde" class="bento" style="width:640px;background:#f4f6fa'), "class=");
kontrol("MUT-H6 PNG'ye telefon eklendi", (s) =>
  s.replace('kutu("DERS", v.ders, "#eff9f7", "#0f766e")', 'kutu("DERS", v.ders + " " + (v.o && v.o.tel ? v.o.tel : ""), "#eff9f7", "#0f766e")'), "telefon");
kontrol("MUT-H7 dosya adına telefon eklendi", (s) =>
  s.replace('return "ders-karti-" + String(v.ad)', 'return "ders-karti-" + String(v.ad) + ((v.o && v.o.tel) ? "-" + v.o.tel : "")'), "ders-karti-");
kontrol("MUT-H8 offscreen cleanup kaldırıldı", (s) =>
  s.replace(".finally(function () { if (el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el); }); /* DÖNGÜ-15 OFFSCREEN TEMİZLİK */", ".catch(function () { toast(\"Görsel oluşturulamadı.\", \"hata\"); });"), "finally");
kontrol("MUT-H9 karttan KONU alanı kaldırıldı", (s) =>
  s.replace('kutu("DERS", v.ders, "#eff9f7", "#0f766e") + kutu("KONU", v.konu || "Genel tekrar", "#f9f5fc", "#7e22ce")', 'kutu("DERS", v.ders, "#eff9f7", "#0f766e")'), "KONU");
kontrol("MUT-H10 html2canvas uydurma option (foreignObjectCORS) eklendi", (s) =>
  s.replace('foreignObjectRendering: false, logging: false', 'foreignObjectRendering: false, logging: false, foreignObjectCORS: true'), "html2canvas bento ayarları");

/* ——— Öğretmen kilidi: mutasyonlar sonrası öğretmen süitleri yeşil kalmalı ——— */
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

/* final: mutasyon-dongu15 kendisi temiz app.js üzerinde bitirir */
console.log("DÖNGÜ-15 MUTASYON ZİNCİRİ: HEPSİ PASS");
