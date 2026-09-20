/* ks-yama-ders-karti.mjs — DERS-KARTI-YAMASI (idempotent, assert'li, exact-anchor)
   1. koşu: yamayı uygular. 2. koşu: "Zaten uygulanmış" der, exit 2, dosyayı DEĞİŞTİRMEZ.
   Uygulama:
     Y1) app.js: pngAc öncesi TEK BLOK — dersKarti fonksiyon ailesi
     Y2) haftalikOgrtTablo birebir hücresi: dersKartiBtn eklentisi
     Y3) gunlukTablo birebir hücresi: aynı buton (tek ortak buton üretici)
   Bölge dışı byte-birebir korunur (assert ile kanıtlanır). */
import { readFileSync, writeFileSync, statSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const F = "app.js";
const BK = "app.js.ders-karti-oncesi.bak";
let src = readFileSync(F, "utf8");

const MARK = "DERS-KARTI-YAMASI";
if (src.includes(MARK)) { console.log("Zaten uygulanmış — dosya değiştirilmedi."); process.exit(2); }

if (!existsSync(BK)) { copyFileSync(F, BK); }
const onceki = { byte: statSync(F).size, sha: sha(src) };

/* ---------- Y1: TEK BLOK (pngAc öncesi) ---------- */
const A1 = "/* ---- PNG raporu ---- */\nfunction pngAc() {";
if ((src.match(/\/\* ---- PNG raporu ---- \*\/\nfunction pngAc\(\) \{/g) || []).length !== 1) {
  console.error("ASSERT Y1: pngAc exact-anchor bulunamadı veya çoğul"); process.exit(1);
}

const BLOK = `/* ═══════════════════════════════════════════════════════════════
   DERS-KARTI-YAMASI — BİREBİR DERS "Ders Kartı" PNG üretimi ve paylaşımı
   ÖNEMLİ DOĞRULUK SINIRLARI (aşan iddia YASAK):
    - wa.me gorsel GÖNDEREMEZ; yalnız metin hazırlar.
    - navigator.share({files}) yalnız destekleyen platformlarda denenir.
    - Panoya kopyalama (ClipboardItem) destek garantisi vermez.
    - Her durumda PNG dosyası indirilir; kullanıcı WhatsApp'ta yapıştırır/sürükler.
   Karttaki metin ogrenciMesajMetni/mevcut durum mantığından TÜRETİLİR — ikinci metin kaynağı yok.
   Kart yalnız TEK ÖĞRENCİLİ aktif birebir dersi kapsar; grup/iptal/Sınıf Dersi/Ek Ders/Kapalı'da buton yok.
   Bu özellik VERİ DEĞİŞTİRMEZ: saveDB/localStorage yazımı YOK.
   ═══════════════════════════════════════════════════════════════ */
function dersKartiUygun(d) {
  return d && d.durum !== "iptal" && dersOgrenciIds(d).length === 1;
}
function dersKartiEtiket(d) {
  /* WA-DURUM mantığıyla hizalı: planlandi → "... olacaktır", tamamlandi → "yapıldı" */
  return d.durum === "tamamlandi" ? "Yapıldı" : "Planlandı / ... olacaktır";
}
function dersKartiBtnHTML(d) {
  return '<button title="Ders Kartı görseli (PNG) üret" onclick="dersKartiAc(\\'' + esc(d.id) + '\\')" class="w-6 h-6 rounded-full text-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"><i class="fa-solid fa-image text-[10px]"></i></button>';
}
function dersKartiVeri(d) {
  var o = DB.ogrenciler.find(function (x) { return x.id === (dersOgrenciIds(d)[0] || d.ogrenciId); }) || null;
  var ogrAd = d.ogretmenAd;
  if (!ogrAd && d.ogretmenId && DB.ogretmenler) {
    var og = DB.ogretmenler.find(function (x) { return x.id === d.ogretmenId; });
    if (og) ogrAd = og.ad;
  }
  var D = DERS[d.dersId] || DERS.tur;
  return { o: o, ad: (o && o.ad) || d.ogrenciAd || "", ders: D.ad, konu: d.konu || "", ogr: ogrAd || "", tarih: fmtTR(d.tarih) + " " + GUNLER[dowIdx(d.tarih)], saat: saatEtiket(d.saat), sinif: (o && o.sinif) || "", durum: d.durum === "tamamlandi" ? "Yapıldı" : "Planlandı / ... olacaktır" };
}
function dersKartiHTML(d) {
  var v = dersKartiVeri(d);
  function satir(b, x) { return x ? '<div style="display:flex;gap:10px;font-size:14px;color:#334155;padding:5px 0"><span style="width:110px;font-size:10px;font-weight:800;letter-spacing:.06em;color:#94a3b8;padding-top:3px">' + b + "</span><span style=\\"font-weight:600\\">" + esc(x) + "</span></div>" : ""; }
  return '<div id="dersKartiGovde" style="width:640px;background:#fff;font-family:Inter,system-ui,sans-serif;padding:34px 40px;border-radius:0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div style="display:flex;gap:12px;align-items:center"><div style="width:40px;height:40px;border-radius:13px;background:#14b8a6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px">🎓</div><div><div style="font-size:15px;font-weight:800;color:#0f172a">YKS Birebir Takip</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">Ders Kartı</div></div></div>' +
      '<span style="background:' + (d.durum === "tamamlandi" ? "#d1fae5;color:#047857" : "#e0f2fe;color:#0369a1") + ';font-size:11px;font-weight:800;padding:4px 12px;border-radius:99px">' + esc(v.durum) + "</span>" +
    "</div>" +
    '<div style="border-bottom:2px solid #e2e8f0;margin:16px 0"></div>' +
    '<div style="font-size:22px;font-weight:800;color:#0f172a">' + esc(v.ad) + "</div>" +
    satir("DERS", v.ders) + satir("KONU", v.konu || "Genel tekrar") + satir("ÖĞRETMEN", v.ogr) +
    satir("TARİH", v.tarih) + satir("SAAT", v.saat) + satir("SINIF", v.sinif) +
    '<div style="border-bottom:1px solid #f1f5f9;margin:14px 0"></div>' +
    '<div style="font-size:9.5px;color:#94a3b8">Bu kart YKS Birebir Takip tarafından oluşturuldu · ' + esc(pencereAdi()) + "</div>" +
  "</div>";
}
function dersKartiAc(dersId) {
  var d = DB.dersler.find(function (x) { return x.id === dersId; });
  if (!d) { toast("Ders bulunamadı.", "hata"); return; }
  if (!dersKartiUygun(d)) { toast("Ders Kartı yalnız aktif tek öğrencili birebir ders için üretilir.", "uyari"); return; }
  /* DERS-KARTI-GIZLILIK: kart yalnız bu dersin öğrencisinin bilgisini taşır; başka öğrenci adı/telefonu YOK.
     ALCI: mevcut alıcı seçicisi yeniden KULLANILIR — kart görseli TELEFON İÇERMEZ; telefon yoksa paylaşılmaz. */
  var a = waAliciBilgisi(d.ogrenciId || "", waAliciTipi);
  if (!a.varMi) { toast(a.etiket + " telefonu kayitli degil", "uyari"); return; }
  if (!window.html2canvas) { toast("Görsel motoru (html2canvas) yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.", "hata"); return; }
  var el = document.getElementById("dersKartiRapor");
  if (!el) {
    el = document.createElement("div");
    el.id = "dersKartiRapor";
    el.style.position = "fixed"; el.style.left = "-9999px"; el.style.top = "0";
    document.body.appendChild(el);
  }
  el.innerHTML = dersKartiHTML(d);
  function dosyaAdi() {
    /* GIZLILIK: dosya adında TELEFON YOK — yalnız öğrenci adı + tarih */
    var v = dersKartiVeri(d);
    return "ders-karti-" + v.ad.toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, "-").replace(/^-+|-+$/g, "") + "-" + d.tarih + ".png";
  }
  html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false })
    .then(function (canvas) {
      canvas.toBlob(function (blob) {
        if (!blob) { toast("Görsel oluşturulamadı.", "hata"); return; }
        var ad = dosyaAdi();
        var adim = { pano: false };
        var bitir = function () {
          /* Her durumda PNG indir: masaüstünde en güvenilir yol — dosyayı WhatsApp'a sürükleyin */
          var a = document.createElement("a");
          a.download = ad; a.href = URL.createObjectURL(blob);
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
          var dosya = new File([blob], ad, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
            navigator.share({ files: [dosya], title: "Ders Kartı" }).catch(function () {});
            adim.paylas = true;
          }
          if (!adim.pano && !adim.paylas) {
            toast("Kart hazır: indirildi (" + ad + "). WhatsApp'ta dosyayı sürükleyin ya da indirdikten sonra pano kopyalama denenmedi.", "basarili");
          } else {
            toast("Kart hazır: panoya kopyalandı + indirildi. WhatsApp'ta Ctrl+V ile yapıştır veya dosyayı sürükle.", "basarili");
          }
        };
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
              .then(function () { adim.pano = true; bitir(); })
              .catch(function () { bitir(); });
            return;
          } catch (e) { /* ClipboardItem desteklenmiyor — indir yolu */ }
        }
        bitir();
      }, "image/png");
    })
    .catch(function () { toast("Görsel oluşturulamadı.", "hata"); });
}

`;

let yeni = src.replace(A1, BLOK + A1);
if (yeni === src) { console.error("ASSERT Y1: blok ekleme başarısız"); process.exit(1); }
src = yeni;

/* ---------- Y2: haftalık tablo butonları ---------- */
/* Hedef: haftalık hücre içinde birebirHucreHTML(...) + '</td>' satırı — butonu hücre içine sonuna ekle.
   Exact anchor: haftalık döngüdeki satırlar. Buton YALNIZ dersKartiUygun(ders) ise eklenir. */
const A2 = "          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) + '</td>';";
if ((src.match(/          birebirHucreHTML\(ders, ogrenci, ogrenciAd, sinif, durumRenk\) \+ '<\/td>';/g) || []).length !== 1) {
  console.error("ASSERT Y2: haftalik exact-anchor bulunamadı veya çoğul"); process.exit(1);
}
src = src.replace(A2,
  "          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) + (dersKartiUygun(ders) ? '<div class=\"mt-0.5\">' + dersKartiBtnHTML(ders) + '</div>' : '') + '</td>';");

/* ---------- Y3: günlük tablo butonları ---------- */
/* Günlükte hücre: html += birebirHucreHTML(...); satırı takip eder. Butonu aynı koşulla ekle. */
const A3 = "            birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || \"\", sinif, durumRenkG);";
if ((src.match(/            birebirHucreHTML\(ders, ogrenci, ders\.ogrenciAd \|\| "", sinif, durumRenkG\);/g) || []).length !== 1) {
  console.error("ASSERT Y3: gunluk exact-anchor bulunamadı veya çoğul"); process.exit(1);
}
src = src.replace(A3,
  "            birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || \"\", sinif, durumRenkG);\n            if (dersKartiUygun(ders)) html += '<div class=\"mt-0.5\">' + dersKartiBtnHTML(ders) + '</div>';");

/* ---------- Bölge dışı koruma assert'leri ---------- */
if (!src.includes("function pngAc() {")) { console.error("ASSERT: pngAc kayboldu"); process.exit(1); }
if ((src.match(/function waAliciBilgisi\(/g) || []).length !== 1) { console.error("ASSERT: wa fonksiyonları etkilendi"); process.exit(1); }
if ((src.match(MARK, "g") || []).length > 6) { console.error("ASSERT: mark çoğulluğu"); process.exit(1); }

writeFileSync(F, src);
console.log("Yama uygulandı.");
console.log("Önce:", onceki.byte, "bayt", onceki.sha);
console.log("Sonra:", statSync(F).size, "bayt", sha(readFileSync(F, "utf8")));
console.log("Backup:", BK, statSync(BK).size, "bayt", sha(readFileSync(BK, "utf8")));
