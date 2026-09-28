/* ks-yama-d35-ad-sinif.mjs — D35: çizelge hücresinde "Ad Soyad + Sınıf" + uzun soyad kısaltma.
   TEK idempotent yama (hedef: app.js). Marker: D35-AD-SINIF → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.d35-ad-sinif-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır).
   Yapılan 6 değişiklik:
     1) kisaAdlik() + adHarfSayisi() + MAX_SOYAD_HARF=8 / MAX_AD_UZUNLUK=22 (gorselAd hemen ardına)
     2) birebirEtiketHTML sınıf span'ı → whitespace-nowrap (havuz tipografisi TEK kaynak)
     3) birebirHucreHTML → her üye KENDİ satırında, ad+sınıf yan yana, birebirEtiketHTML ile
     4) haftalikOgrtTablo: ayrı virgüllü üye satırı satırı KALDIRILDI
     5) haftalikOgrtTablo: hücre çağrısından sonraki üye div'i KALDIRILDI
     6) gunlukTablo: ayrı üye satırı + div KALDIRILDI
   Ayrıca index.html'deki app.js?v=<SHA16> damgası YENİ SHA16 ile tazelenir (DİNAMİK kapı bunu bekler). */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.d35-ad-sinif-oncesi.bak";
const HTML = "index.html";
const MARKER = "D35-AD-SINIF";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const sha16 = (s) => sha256(s).slice(0, 16);

let src = readFileSync(APP, "utf8");
if (src.includes(MARKER)) { console.error("ZATEN UYGULANMIŞ (" + MARKER + " marker var) — yazmadan çıkılıyor."); process.exit(2); }

if (!existsSync(BAK)) { copyFileSync(APP, BAK); console.log("YEDEK oluşturuldu: " + BAK); }
const bak = readFileSync(BAK, "utf8");
console.log("APP  önce: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));
console.log("BAK     : " + Buffer.byteLength(bak, "utf8") + " B · sha256=" + sha256(bak));

let degisen = 0;
function degis(etiket, eski, yeni, kez) {
  const n = src.split(eski).length - 1;
  if (n !== kez) { console.error("ANCHOR HATASI [" + etiket + "]: beklenen " + kez + ", bulunan " + n); process.exit(1); }
  src = src.split(eski).join(yeni);
  degisen += kez;
  console.log("  ✓ " + etiket + " (" + kez + ")");
}

/* ---- 1) Kısaltma yardımcıları: gorselAd hemen ardına ---- */
degis("1 kisaAdlik + sabitler", `    .join(" ");
}

// ---------- Veri katmanı ----------`,
`    .join(" ");
}

/* ---------- D35-AD-SINIF: uzun ad kısaltma yardımcısı (TEK kaynak) ----------
   Görünen ad gorselAd() ile normalize edilir; ardından soyadı harf sayısı MAX_SOYAD_HARF'e
   ulaşırsa VEYA ad+soyadın boşluksuz toplam harfi MAX_AD_UZUNLUK'a ulaşırsa soyadı baş harfe iner:
   "Ahmet Kızılırmak" → "Ahmet K." · "Mehmet Ali Kızılırmak" → "Mehmet Ali K." · tek kelimeli ad DEĞİŞMEZ.
   Türkçe karakter tek harf sayılır; boşluk/tire/kesme işareti sayılmaz. Yalnız ÇİZELGE hücrelerinde
   (haftalikOgrtTablo + gunlukTablo) kullanılır; havuz/WA/PNG/banner TAM adla kalır. */
var MAX_SOYAD_HARF = 8;
var MAX_AD_UZUNLUK = 22;
function adHarfSayisi(s) { return String(s == null ? "" : s).replace(/[\\s\\-'’]/g, "").length; }
function kisaAdlik(ad) {
  var tam = gorselAd(ad);
  var parcalar = tam.split(/\\s+/).filter(function (p) { return p; });
  if (parcalar.length < 2) return tam; /* tek kelimeli ad */
  var soyad = parcalar[parcalar.length - 1];
  if (adHarfSayisi(soyad) >= MAX_SOYAD_HARF || adHarfSayisi(parcalar.join("")) >= MAX_AD_UZUNLUK) {
    return parcalar.slice(0, -1).join(" ") + " " + soyad.charAt(0).toLocaleUpperCase("tr-TR") + ".";
  }
  return tam;
}

// ---------- Veri katmanı ----------`, 1);

/* ---- 2) birebirEtiketHTML sınıf span'ı nowrap (tek format kaynağı; havuz + çizelge aynı) ---- */
degis("2 sınıf span nowrap",
  `'<span class="text-[10px] font-medium text-slate-400 shrink-0">'`,
  `'<span class="text-[10px] font-medium text-slate-400 shrink-0 whitespace-nowrap">'`, 1);

/* ---- 3) birebirHucreHTML: her üye kendi satırında, ad + sınıf yan yana ---- */
degis("3 birebirHucreHTML üye satırları",
`  var konu = (typeof ders.konu === "string" ? ders.konu : "").trim();
  var konuGecerli = konu.length > 0 && konu !== dersAdi && konu !== (sinif || "") && konu !== tamAd;
  var hucreKonu = konuGecerli ? '<div class="text-[9px] text-slate-500 leading-tight truncate whitespace-nowrap min-w-0" title="' + esc(konu) + '">' + esc(konu) + '</div>' : '';
  return '<div class="rounded-lg border ' + (durumRenk || "bg-blue-50 border-blue-200") + ' px-1 py-1.5 min-w-0" title="Dolu — kilitli">' +
    '<div class="text-[10px] font-bold text-slate-800 leading-tight truncate whitespace-nowrap min-w-0" title="' + esc(tamAd) + '">' + esc(tamAd) + '</div>' +
    hucreKonu +
    (sinif ? '<div class="text-[8px] font-bold text-slate-400 leading-tight truncate whitespace-nowrap min-w-0">' + esc(sinif) + '</div>' : '') +
    '</div>';
}`,
`  /* D35-AD-SINIF: ana öğrenci kaydı (yoksa yalnız tam ad; sınıf UYDURULMAZ) */
  var anaO = (ogrenci && ogrenci.ad) ? ogrenci : (ders.ogrenciId ? DB.ogrenciler.find(function (x) { return x.id === ders.ogrenciId; }) : null);
  var anaSinif = anaO ? anaO.sinif : null; /* null → sınıf spanı YOK ("Sınıf belirtilmemiş" de yazılmaz) */
  var konu = (typeof ders.konu === "string" ? ders.konu : "").trim();
  var konuGecerli = konu.length > 0 && konu !== dersAdi && konu !== (anaSinif || "") && konu !== tamAd;
  var hucreKonu = konuGecerli ? '<div class="text-[9px] text-slate-500 leading-tight truncate whitespace-nowrap min-w-0" title="' + esc(konu) + '">' + esc(konu) + '</div>' : '';
  /* D35-AD-SINIF: HER üye (ana + ekler) KENDİ satırında — ad + sınıf YAN YANA, havuz kartındaki
     birebirEtiketHTML ile AYNI tipografi; ad/sınıf için İKİNCİ formatter YOK. Ek üyenin kaydı
     yoksa ad/sınıf YAZILMAZ (uydurma YOK). Uzun soyadlı adlar kisaAdlik ile kısalır (tam ad title'da). */
  var hucreUyeleri = ['<div class="min-w-0" title="' + esc(tamAd) + '">' + birebirEtiketHTML(kisaAdlik(tamAd), anaSinif) + "</div>"];
  dersOgrenciIds(ders).forEach(function (oid) {
    if (oid === (anaO ? anaO.id : ders.ogrenciId)) return;
    var uo = DB.ogrenciler.find(function (x) { return x.id === oid; });
    if (!uo) return;
    hucreUyeleri.push('<div class="min-w-0" title="' + esc(uo.ad) + '">' + birebirEtiketHTML(kisaAdlik(uo.ad), uo.sinif) + "</div>");
  });
  return '<div class="rounded-lg border ' + (durumRenk || "bg-blue-50 border-blue-200") + ' px-1 py-1.5 min-w-0" title="Dolu — kilitli">' +
    hucreUyeleri.join("") +
    hucreKonu +
    '</div>';
}`, 1);

/* ---- 4) haftalık: ayrı virgüllü üye satırı DEĞİŞKENİ kaldırıldı ---- */
degis("4 haftalik ayri uye degiskeni kaldirildi",
`        /* DÖNGÜ-26: grup dersinde TÜM üye tam adları hücrede okunur (hover gerektirmez);
           birebirde eski görünüm birebir korunur. Eski ölü hucreUst (baş harf, hiç kullanılmıyordu) kaldırıldı. */
        var grupUyeler = grupUyeEtiketleri(ders);`,
`        /* DÖNGÜ-26 → D35-AD-SINIF: grup üyeleri artık birebirHucreHTML hücresi İÇİNDE (her biri kendi satırında, ad + sınıf) — ayrı virgüllü üye satırı KALDIRILDI. */`, 1);

/* ---- 5) haftalık: hücrenin ardındaki virgüllü üye div'i kaldırıldı ---- */
degis("5 haftalik uye div kaldirildi",
`          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) +
          (grupUyeler.length ? '<div class="text-[9px] font-semibold text-slate-500 leading-snug break-words mt-0.5" title="Grup üyeleri">' + grupUyeler.map(function (a) { return esc(a); }).join(", ") + '</div>' : '') + '</td>'; /* DÖNGÜ-26: grup üyeleri TAM AD, alt satır sarımlı; birebirde eklenmez. DERS-KARTI-TASIMA-YAMASI: haftalik hücreden kart butonu kaldırıldı — ders listesi ISLEM alanına taşındı */`,
`          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) + '</td>'; /* D35-AD-SINIF: üyeler birebirHucreHTML hücresi İÇİNDE (ayrı virgüllü üye satırı KALDIRILDI). DERS-KARTI-TASIMA-YAMASI: haftalik hücreden kart butonu kaldırıldı — ders listesi ISLEM alanına taşındı */`, 1);

/* ---- 6) günlük: ayrı üye satırı + div kaldırıldı ---- */
degis("6 gunluk uye satiri kaldirildi",
`          /* GRUP: günlük tabloda üye baş harfleri alt satırda (birebirde eklenmez) */
          var grupUyelerG = grupUyeEtiketleri(ders);`,
`          /* DÖNGÜ-26 → D35-AD-SINIF: grup üyeleri artık birebirHucreHTML hücresi İÇİNDE (her biri kendi satırında, ad + sınıf) — ayrı üye satırı KALDIRILDI. */`, 1);

degis("6b gunluk uye div kaldirildi",
`            birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || "", sinif, durumRenkG); /* DERS-KARTI-TASIMA-YAMASI: gunluk hücreden kart butonu kaldırıldı */

          if (grupUyelerG.length) html += '<div class="text-[9px] font-semibold text-slate-500 leading-snug break-words mt-0.5" title="Grup üyeleri">' + grupUyelerG.map(function (a) { return esc(a); }).join(", ") + '</div>'; /* DÖNGÜ-26: üyeler TAM AD (baş harf yerine) */
          html += '</td>';`,
`            birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || "", sinif, durumRenkG); /* DERS-KARTI-TASIMA-YAMASI: gunluk hücreden kart butonu kaldırıldı. D35-AD-SINIF: üyeler hücre İÇİNDE (ayrı üye satırı KALDIRILDI) */

          html += '</td>';`, 1);

writeFileSync(APP, src, "utf8");
console.log("\nAPP sonra: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src) + " · sha16=" + sha16(src));
console.log("Toplam değişen anchor: " + degisen);

/* ---- index.html damgası: app.js?v=<SHA16> tazele ---- */
let html = readFileSync(HTML, "utf8");
const eskiDamga = (html.match(/app\.js\?v=([0-9a-f]{16})/) || [])[1];
const yeniDamga = sha16(src);
if (eskiDamga !== yeniDamga) {
  const n = (html.match(/app\.js\?v=[0-9a-f]{16}/g) || []).length;
  if (n !== 1) { console.error("index.html damga sayısı beklenen 1, bulunan " + n); process.exit(1); }
  html = html.replace(/app\.js\?v=[0-9a-f]{16}/, "app.js?v=" + yeniDamga);
  writeFileSync(HTML, html, "utf8");
  console.log("index.html damgası tazelendi: " + eskiDamga + " → " + yeniDamga);
} else {
  console.log("index.html damgası zaten güncel: " + yeniDamga);
}
console.log("D35-AD-SINIF yaması TAMAM.");
