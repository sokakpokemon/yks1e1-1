/* ks-yama-gorunum.mjs — GRUP GÖRÜNÜM yaması (assert'li, idempotent; app.js'e bölgesel ekleme).
   Tek iş: tablo hücreleri, WhatsApp, PNG ve analizde grup üyelerinin görünmesi/sayılması.
   app.js baştan yazılmaz; yalnızca hedefli dize değişimleri. Yardımcılar (grupOgrenciAdlari,
   grupUyeEtiketleri, grupBadgeHTML, grupUyeToggle, ui.grupAcikOgrId) önceki adımda eklendi. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const yol = "app.js";
const once = readFileSync(yol, "utf8");
if (!once.includes("grupBadgeHTML")) { console.error("HATA: yardımcı fonksiyonlar yok — önce yardımcı yaması gerekli."); process.exit(1); }
copyFileSync(yol, "app.js.yama-gorunum-oncesi.bak");

let son = once;
let sayac = 0;
function yama(ad, eski, yeni) {
  const n = son.split(eski).length - 1;
  if (n === 1) { son = son.replace(eski, yeni); sayac++; console.log("  ✓ " + ad); return; }
  if (son.includes(yeni) && n === 0) { console.log("  ↷ " + ad + " (zaten uygulanmış)"); return; }
  console.error("  ✗ " + ad + " → eşleşme sayısı: " + n + " (1 olmalı)"); process.exit(1);
}

/* Bu dosyada ` ve ${ yok (assert'li); özel ayraç kullanılabilir */
const T = "[~", E = "~]";

/* 1) DERS LİSTESİ satırı: öğrenci hücresine grup badge'leri eklenir */
yama(
  "1) ders listesi öğrenci hücresine grupBadgeHTML",
  `'<td class="px-4 py-3"><div class="flex items-center gap-2">' + avatar(l.ogrenciAd, 0) + '<span class="text-[13px] font-semibold text-slate-700 truncate max-w-[140px]">' + esc(l.ogrenciAd) + "</span></div></td>" +`,
  `'<td class="px-4 py-3"><div class="flex items-center gap-2">' + avatar(l.ogrenciAd, 0) + '<span class="text-[13px] font-semibold text-slate-700 truncate max-w-[140px]">' + esc(l.ogrenciAd) + "</span>" + grupBadgeHTML(l) + "</div></td>" +`
);

/* 2) HAFTALIK ÖĞRETMEN TABLOSU hücresi: grup dersinde sınıf satırı yerine üye baş harfleri */
yama(
  "2) haftalık öğretmen tablosu grup üyeleri",
  `        var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border ' + durumRenk + ' px-1 py-1.5" title="Dolu — kilitli">' +
          '<div class="text-[10.5px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd.split(" ")[0]) + '</div>' +
          (sinif ? '<div class="text-[9px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +`,
  `        var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
        /* GRUP: grid hücresi dar → grup dersinde üye baş harfleri satırı (birebirde eski görünüm) */
        var grupUyeler = grupUyeEtiketleri(ders);
        var hucreUst = sinif ? esc(sinif) : (grupUyeler.length ? '<span class="text-[8.5px] font-bold text-slate-400">' + grupUyeler.map(function (a) { return esc(ilkHarfler(a)); }).join(" · ") + "</span>" : '');
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border ' + durumRenk + ' px-1 py-1.5" title="Dolu — kilitli">' +
          '<div class="text-[10.5px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd.split(" ")[0]) + '</div>' +
          (hucreUst ? '<div class="leading-tight">' + hucreUst + '</div>' : '') +`
);

/* 3) GÜNLÜK TABLO hücresi: grup dersinde sınıf varsa sınıf, yoksa üye baş harfleri */
yama(
  "3) günlük tablo grup üyeleri",
  `          var hucreIcerik = sinif || esc(ders.ogrenciAd || "").split(" ")[0];
          var altYazi = dersBilgi ? dersBilgi.ad : "";
          var renk = ders.durum === "tamamlandi" ? "text-emerald-600" : "text-slate-700";`,
  `          var hucreIcerik = sinif || esc(ders.ogrenciAd || "").split(" ")[0];
          /* GRUP: günlük tabloda üye baş harfleri alt satırda (birebirde eklenmez) */
          var grupUyelerG = grupUyeEtiketleri(ders);
          var altYazi = (grupUyelerG.length ? grupUyelerG.map(function (a) { return ilkHarfler(a); }).join(" · ") + (dersBilgi ? " · " : "") : "") + (dersBilgi ? dersBilgi.ad : "");
          var renk = ders.durum === "tamamlandi" ? "text-emerald-600" : "text-slate-700";`
);

/* 4) WHATSAPP öğrenci mesajı: grup dersinde tüm üyeler listelenir (birebirde metin aynı) */
yama(
  "4) WhatsApp grup üyeleri",
  `  var satirlar = liste.map(function (l, i) {
    var D = DERS[l.dersId] || DERS.tur;
    var durum = l.durum === "tamamlandi" ? " ✓ Tamamlandı" : "";
    return (i + 1) + ") " + D.ad + (l.konu ? " — " + l.konu : "") + "\\n   📅 " + fmtTR(l.tarih) + " " + GUNLER[dowIdx(l.tarih)] + " • " + saatEtiket(l.saat) + " • " + l.ogretmenAd + durum;
  });`,
  `  var satirlar = liste.map(function (l, i) {
    var D = DERS[l.dersId] || DERS.tur;
    var durum = l.durum === "tamamlandi" ? " ✓ Tamamlandı" : "";
    /* GRUP: grup dersinde tüm üyeler mesajda listelenir (birebirde satır aynı) */
    var uyeler = grupOgrenciAdlari(l);
    var uyeSatiri = uyeler.length > 1 ? "\\n   👥 " + uyeler.join(", ") : "";
    return (i + 1) + ") " + D.ad + (l.konu ? " — " + l.konu : "") + uyeSatiri + "\\n   📅 " + fmtTR(l.tarih) + " " + GUNLER[dowIdx(l.tarih)] + " • " + saatEtiket(l.saat) + " • " + l.ogretmenAd + durum;
  });`
);

/* 5) PNG raporu öğrenci hücresi: grup dersinde tüm adlar (birebirde tek ad) */
yama(
  "5) PNG rapor grup üyeleri",
  `      '<td style="padding:7px 10px;font-size:11px;font-weight:600;color:#334155">' + esc(l.ogrenciAd) + "</td>" +`,
  `      '<td style="padding:7px 10px;font-size:11px;font-weight:600;color:#334155">' + (grupOgrenciAdlari(l).length > 1 ? esc(grupOgrenciAdlari(l).join(", ")) : esc(l.ogrenciAd)) + "</td>" +`
);

/* 6) ANALİZ: öğrenci bazlı istatistikte her grup üyesi o dersi almış sayılır */
yama(
  "6) analiz grup üyesi dağıtımı",
  `  function grup(key) {
    var m = {};
    ak.forEach(function (l) { var k = key(l); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { k: k, n: m[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
  }
  var topOgr = grup(function (l) { return l.ogrenciId || l.ogrenciAd; });`,
  `  function grup(key) {
    var m = {};
    ak.forEach(function (l) { var k = key(l); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { k: k, n: m[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
  }
  /* GRUP: öğrenci bazlı istatistikte grup dersi HER üyesine sayılır; ders sayısı tek kalır */
  var topOgr = (function () {
    var m = {};
    ak.forEach(function (l) {
      var kimlikler = dersOgrenciIds(l);
      (kimlikler.length ? kimlikler : [null]).forEach(function (oid) {
        var k = oid || l.ogrenciId || l.ogrenciAd;
        if (k) m[k] = (m[k] || 0) + 1;
      });
    });
    return Object.keys(m).map(function (k) { return { k: k, n: m[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
  })();`
);

/* 7) Düzeltme: haftalık grid'te grup üyeleri SINIF olsa da görünsün (sınıf yerini baş harflere bırakır) */
yama(
  "7) haftalık grid: grup üyeleri sınıftan öncelikli",
  `        var hucreUst = sinif ? esc(sinif) : (grupUyeler.length ? '<span class="text-[8.5px] font-bold text-slate-400">' + grupUyeler.map(function (a) { return esc(ilkHarfler(a)); }).join(" · ") + "</span>" : '');`,
  `        var hucreUst = grupUyeler.length ? '<span class="text-[8.5px] font-bold text-slate-400">' + grupUyeler.map(function (a) { return esc(ilkHarfler(a)); }).join(" · ") + "</span>" : (sinif ? esc(sinif) : '');`
);

/* --- Assert'ler --- */
console.log("\nDoğrulama:");
if (sayac < 1 || sayac > 7) { console.error("✗ beklenmedik yama sayısı: " + sayac); process.exit(1); }
const kontroller = [
  ["ders listesinde grupBadgeHTML çağrısı", /esc\(l\.ogrenciAd\) \+ "<\/span>" \+ grupBadgeHTML\(l\)/],
  ["haftalık tabloda grupUyeler", /var grupUyeler = grupUyeEtiketleri\(ders\)/],
  ["günlük tabloda grupUyelerG", /var grupUyelerG = grupUyeEtiketleri\(ders\)/],
  ["WhatsApp'ta grupOgrenciAdlari", /var uyeler = grupOgrenciAdlari\(l\)/],
  ["PNG'de grupOgrenciAdlari", /grupOgrenciAdlari\(l\)\.length > 1 \? esc\(grupOgrenciAdlari\(l\)\.join/, "png"],
  ["analizde dersOgrenciIds dağıtımı", /var kimlikler = dersOgrenciIds\(l\)/]
];
for (const [ad, re] of kontroller) {
  if (!re.test(son)) { console.error("  ✗ " + ad); process.exit(1); }
  console.log("  ✓ " + ad);
}
if (son === once) { console.log("Zaten uygulanmış — dosya değişmedi."); process.exit(0); }
writeFileSync(yol, son);
console.log("Yama tamam: " + sayac + " bölge. Yedek: app.js.yama-gorunum-oncesi.bak");
