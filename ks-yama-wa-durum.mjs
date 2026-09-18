/* ks-yama-wa-durum.mjs — WA-DURUM-YAMASI: idempotent, assert'li hedefli yama (app.js).
   Öğrenci WhatsApp mesajı yeni biçim:
     1) {DERS} ({OGRETMEN}) — {KONU}
        👥 {Ad1, Ad2}   (yalnız grup dersinde)
     📅 {tarih} {gün} • {saat}   (öğretmen adı tarih satırında YOK)
     durum cümlesi (planliSatir/tamamlandiSatir opsiyonel şablon alanı; boşsa varsayılan)
   2. koşu: "Zaten uygulanmış" der (exit 2), dosyaya DOKUNMAZ. */
import { readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kaynak = "app.js";
const once = readFileSync(kaynak, "utf8");

if (once.includes("WA-DURUM-YAMASI")) {
  console.log("Zaten uygulanmış — dosyaya dokunulmadı.");
  process.exit(2);
}

const hedefEski =
  '    var D = DERS[l.dersId] || DERS.tur;\n' +
  '    var durum = l.durum === "tamamlandi" ? " ✓ Tamamlandı" : "";\n' +
  '    /* GRUP: grup dersinde tüm üyeler mesajda listelenir (birebirde satır aynı) */\n' +
  '    var uyeler = grupOgrenciAdlari(l);\n' +
  '    var uyeSatiri = uyeler.length > 1 ? "\\n   👥 " + uyeler.join(", ") : "";\n' +
  '    return (i + 1) + ") " + D.ad + (l.konu ? " — " + l.konu : "") + uyeSatiri + "\\n   📅 " + fmtTR(l.tarih) + " " + GUNLER[dowIdx(l.tarih)] + " • " + saatEtiket(l.saat) + " • " + l.ogretmenAd + durum;\n' +
  '  });';

if (!once.includes(hedefEski)) {
  console.error("HATA: hedef blok bulunamadı — kaynak beklentiden farklı. Fail-closed.");
  process.exit(1);
}

const hedefYeni =
  '    var D = DERS[l.dersId] || DERS.tur;\n' +
  '    /* WA-DURUM-YAMASI: yeni hedef düzen —\n' +
  '       1) {DERS} ({OGRETMEN}) — {KONU}   (konu boşsa bölüm gizlenir)\n' +
  '       👥 {Ad1, Ad2}                     (yalnız grup dersinde)\n' +
  '       📅 {tarih} {gün} • {saat}         (öğretmen adı YOK — tekrar etmez)\n' +
  '       durum cümlesi: tamamlandi → "…yapıldı." ; diğerleri → "…olacaktır."\n' +
  '       (planliSatir/tamamlandiSatir DB.ayarlar.whatsappSablon ile opsiyonel; boşsa varsayılan)\n' +
  '       Eski " ✓ Tamamlandı" işareti kaldırıldı. */\n' +
  '    var ogrAd = l.ogretmenAd;\n' +
  '    if (!ogrAd && l.ogretmenId && DB.ogretmenler) {\n' +
  '      var og = DB.ogretmenler.find(function (x) { return x.id === l.ogretmenId; });\n' +
  '      if (og) ogrAd = og.ad;\n' +
  '    }\n' +
  '    var satir = (i + 1) + ") " + D.ad + (ogrAd ? " (" + ogrAd + ")" : "") + (l.konu ? " — " + l.konu : "");\n' +
  '    /* GRUP: grup dersinde tüm üyeler mesajda listelenir (birebirde 👥 satırı yok) */\n' +
  '    var uyeler = grupOgrenciAdlari(l);\n' +
  '    var uyeSatiri = uyeler.length > 1 ? "\\n   👥 " + uyeler.join(", ") : "";\n' +
  '    var sab = (DB.ayarlar && DB.ayarlar.whatsappSablon && typeof DB.ayarlar.whatsappSablon === "object") ? DB.ayarlar.whatsappSablon : {};\n' +
  '    function satirDeger(alan, varsayilan) { var v = sab[alan]; return (v == null ? "" : String(v)).trim() !== "" ? v : varsayilan; }\n' +
  '    var durumCumlesi = l.durum === "tamamlandi"\n' +
  '      ? satirDeger("tamamlandiSatir", "Bu tarih ve saatte birebir dersiniz yapıldı.")\n' +
  '      : satirDeger("planliSatir", "Bu tarih ve saatte birebir dersiniz olacaktır.");\n' +
  '    return satir + uyeSatiri + "\\n   📅 " + fmtTR(l.tarih) + " " + GUNLER[dowIdx(l.tarih)] + " • " + saatEtiket(l.saat) + "\\n" + durumCumlesi;\n' +
  '  });';

const sonra = once.replace(hedefEski, hedefYeni);
if (sonra === once) { console.error("HATA: replace etkisiz."); process.exit(1); }

/* assert'ler */
if (!sonra.includes("WA-DURUM-YAMASI")) throw new Error("assert: yama işareti yok");
if (sonra.includes(hedefEski)) throw new Error("assert: hedef blok kalkmadı");
if ((sonra.match(/WA-DURUM-YAMASI/g) || []).length !== 1) throw new Error("assert: işaret tek değil");
if (!sonra.includes("planliSatir") || !sonra.includes("tamamlandiSatir")) throw new Error("assert: şablon alanları yok");

copyFileSync(kaynak, kaynak + ".wa-durum-calisma-oncesi.bak");
writeFileSync(kaynak, sonra);
console.log("Yama uygulandı. Backup: app.js.wa-durum-calisma-oncesi.bak");
console.log("app.js boyut:", statSync(kaynak).size, "· SHA-256:", sha(readFileSync(kaynak)));
process.exit(0);
