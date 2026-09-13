/* ks-yama-kadro.mjs — GERÇEK KADRO YAMASI (assert'li, idempotent)
   Tek iş: 17 gerçek öğretmen + 18 gerçek sınıf DB şemasına eklenir/güncellenir;
   mevcut ID'ler, dersler, istekler, grup dersleri, sinifProg ve avail korunur.
   Uygulama iki katmanda yapılır:
     A) seedDB() kayıt bloğu: isim/branş yazım düzeltmeleri (KANARIĞ, 11 SAYCAL)
        + her kayıttan sonra GERÇEK KADRO davranışsal kancası (kadroDuzelt(DB)).
        Kadro tam listesi SABİT olarak seed'e gömülür (veri, kodla ayrı).
     B) normalize()/boot: kadroDuzelt(d) → çalışan DB'de ad-anahtarlı sınıf
        eşlemesi (güvenli normalize), branş güncelleme, eksik kayıt üretimi
        (kimlikUret + kimlikleriTamamla), benzersizlik assert'i.
   Yazım düzeltmeleri yalnızca seed kaynak metninde yapılır (app.js'te "11 SAY CAL"
   yalnız seed'de geçer; çalışan DB'de zaten '11 SAYCAL' yoksa kimse etkilenmez —
   mevcut sınıf kayıtları/sinifProg anahtarları ASLA yeniden adlandırılmaz).
   Her değişiklik assert edilir; anchor bulunamazsa YAZMAZ. 2. koşu exit 2. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const DOSYA = "app.js";
const once = readFileSync(DOSYA, "utf8");

/* Idempotentlik: yama işareti zaten varsa dokunma */
if (once.includes("KADRO-YAMASI") && once.includes("kadroDuzelt")) {
  console.log("Zaten uygulanmış (KADRO-YAMASI işareti mevcut) — dosya değiştirilmedi.");
  process.exit(2);
}

/* ---- KADRO VERİSİ (tek gerçek kaynak) ---- */
const KADRO_OGRETMENLER = [
  ["BELGİN ÇOLAK", "kim"], ["EREN BİLGİLİ", "tur"], ["FATMA KURT", "tur"],
  ["FİKRİYE KIYAR", "cgr"], ["KARDELEN ASLAN", "kim"], ["SELİNA KUTLU", "kim"],
  ["MEHMET ŞAŞAR", "mat"], ["MERT ASİL", "ing"], ["MERVE GEREK", "mat"],
  ["MUSTAFA GÜRKAN", "fiz"], ["MİNE GÜRKAN", "mat"], ["NİHAT KANARIĞ", "tar"],
  ["RAVİDE DERYA", "fiz"], ["SALİM URTİMUR", "mat"], ["SONER AÇIKGÖZ", "mat"],
  ["TAHSİN ASLAN", "mat"], ["ŞAHİN DOĞANAY", "biy"],
];
const KADRO_SINIFLAR = [
  "MEZUN SAY 1", "MEZUN SAY 2", "MEZUN SAY 3", "MEZUN EA 1", "MEZUN EA 2",
  "12 SAY 1", "12 SAY 2", "12 SAY CAL", "12 EA 1", "12 DİL",
  "11 SAY 1", "11 SAY 2", "11 SAY 3", "11 SAYCAL", "11 SAYISAL FEN",
  "11 EA 1", "10.SINIF", "9.SINIF",
];

/* Yama 1: seed yazım düzeltmeleri (yalnızca seed kayıt satırlarında, tek eşleşme) */
const YAZIM = [
  { eski: '{ id: uid(), ad: "NİHAT KANARIG", brans: "tar"', yeni: '{ id: uid(), ad: "NİHAT KANARIĞ", brans: "tar"', ad: "NİHAT KANARIĞ yazımı (seed öğretmen kaydı)" },
  { eski: '"11 SAY CAL": [],', yeni: '"11 SAYCAL": [],', ad: "11 SAYCAL yazımı (seed sinifProg anahtarı)" },
  /* seed avail.sinif değerleri sınıf adıdır — sınıf listesiyle birebir yazılır (3 öğretmen satırında aynı desen) */
  { eski: '"1-1":"11 SAY CAL","2-1":"11 SAYISAL FEN"', yeni: '"1-1":"11 SAYCAL","2-1":"11 SAYISAL FEN"', tekrar: 3, ad: "11 SAYCAL yazımı (seed avail.sinif değerleri ×3)" },
];
/* Yama 2: kadro veri bloğu + kadroDuzelt — bosDB'den ÖNCE tek ekleme noktası (üst-düzey) */
const ANCHOR_SP = "function bosDB() {";
/* Yama 3: seedDB'nin sonuna kadro kancası çağrısı + tersi bozuk plan satırındaki
   eski isim referanslarını da güvenceye al (yazım düzeltmesi sonrası otomatik tutarlı) */
const ANCHOR_RETURN = "  return db;\n}\n\n// ===== SECTION: ARAYÜZ DURUMU";
const KANCA_RETURN = `  /* KADRO-YAMASI: seed DB'si gerçek kadroyla hizalanır (idempotent davranışsal katman) */
  kadroDuzelt(db);
  return db;
}

// ===== SECTION: ARAYÜZ DURUMU`;
/* Yama 4: normalize sonuna kadro kancası */
const ANCHOR_NORM = "  kimlikleriTamamla(d);\n  return d;\n}";
const KANCA_NORM = `  kimlikleriTamamla(d);
  /* KADRO-YAMASI: her normalize (boot/loadDB/yedek yükleme) gerçek kadroyu DB'ye uygular — idempotent */
  if (typeof kadroDuzelt === "function") kadroDuzelt(d);
  return d;
}`;
/* Yama 5: bosDB'den hemen önce kadroDuzelt tanımı (ANCHOR_SP üzerinden, tek ekleme) */
const KADRO_FN = `/* ---------- KADRO-YAMASI: gerçek öğretmen ve sınıf kadrosu (tek gerçek kaynak; davranışsal katman) ----------
var KADRO_OGRETMENLER = ${JSON.stringify(KADRO_OGRETMENLER)};
var KADRO_SINIFLAR = ${JSON.stringify(KADRO_SINIFLAR)};
   Kurallar:
   - Öğretmen güvenli normalize ad karşılaştırmasıyla bulunur (TR büyük/küçük/aksan duyarsız).
     Aynı isimli mevcut öğretmen: YENİ KAYIT OLUŞTURULMAZ, mevcut ID KORUNUR, branş güncellenir.
     Yoksa: mevcut şemada ({id, ad, brans, avail:{sinif:{},musait:[]}}) yeni kayıt + kimlikUret/kimlikleriTamamla ile kalıcı ID.
   - Sınıflar DB.sinifIds[ad] + DB.sinifProg[ad] içine eklenir; var olan sınıf kimliği KORUNUR.
   - Aynı adla ikinci öğretmen/sınıf kimliği ASLA oluşmaz (assert + benzersiz üretim).
   - Referanslar (ders/istek/ogrenciIds/grup/ekDers) ve mevcut sinifProg/avail İÇERİKLERİ değiştirilmez. */
function kadroAdKey(ad) {
  return String(ad || "").trim().toLocaleLowerCase("tr-TR").replace(/\\u0131/g, "i").replace(/\\u0307/g, "").replace(/[\\u0300-\\u036f]/g, "");
}
function kadroDuzelt(db) {
  if (!db || typeof db !== "object") return { t: 0, s: 0, b: 0 };
  var say = { t: 0, s: 0, b: 0 };
  function ogretmenBul(ad) { var k = kadroAdKey(ad); return (db.ogretmenler || []).filter(function (t) { return kadroAdKey(t.ad) === k; })[0]; }
  /* Öğretmenler: eşle → branş güncelle; yoksa → şemaya uygun yeni kayıt + kalıcı ID */
  KADRO_OGRETMENLER.forEach(function (r) {
    var t = ogretmenBul(r[0]);
    if (t) {
      if (t.brans !== r[1]) { t.brans = r[1]; say.b++; }
      return;
    }
    db.ogretmenler = Array.isArray(db.ogretmenler) ? db.ogretmenler : [];
    db.ogretmenler.push({ id: "", ad: r[0], brans: r[1], avail: { sinif: {}, musait: [] } });
    say.t++;
  });
  /* Aynı adla iki öğretmen oluşmasını engelle (assert katmanı: bozuk DB'de de birleştirme YAPILMAZ, raporlanır) */
  var adSay = {};
  (db.ogretmenler || []).forEach(function (t) { var k = kadroAdKey(t.ad); adSay[k] = (adSay[k] || 0) + 1; });
  var cift = Object.keys(adSay).filter(function (k) { return adSay[k] > 1; });
  if (cift.length) { if (typeof console !== "undefined") console.warn("KADRO-YAMASI: aynı isimli öğretmen kayıtları bulundu (birleştirilmedi, raporlandı):", cift.join(", ")); return say; }
  if (Array.isArray(db.ogretmenler) && db.ogretmenler.some(function (t) { return !t.id; })) kimlikleriTamamla(db);
  /* Sınıflar: sinifProg girdisi + sinifIds kimliği (mevcut kimlik KORUNUR) */
  db.sinifProg = db.sinifProg && typeof db.sinifProg === "object" ? db.sinifProg : {};
  if (!db.sinifIds || typeof db.sinifIds !== "object" || Array.isArray(db.sinifIds)) db.sinifIds = {};
  KADRO_SINIFLAR.forEach(function (ad) {
    if (!db.sinifProg[ad]) { db.sinifProg[ad] = []; say.s++; }
    if (db.sinifIds[ad] == null || db.sinifIds[ad] === "") { db.sinifIds[ad] = kimlikUret("snf", Object.keys(db.sinifIds).length); say.s++; }
  });
  return say;
}
function bosDB() {`;

const DEGISIMLER = [
  ...YAZIM.map(y => ({ ad: y.ad, eski: y.eski, yeni: y.yeni, tekrar: y.tekrar })),
  { ad: "seedDB dönüş kancası", eski: ANCHOR_RETURN, yeni: KANCA_RETURN },
  { ad: "normalize kadro kancası", eski: ANCHOR_NORM, yeni: KANCA_NORM },
  { ad: "kadroDuzelt tanımı (bosDB öncesi)", eski: ANCHOR_SP, yeni: KADRO_FN },
];

let sonra = once;
for (const d of DEGISIMLER) {
  const n = sonra.split(d.eski).length - 1;
  const beklenen = d.tekrar || 1;
  if (n !== beklenen) {
    console.error(`ASSERT BAŞARISIZ [${d.ad}]: anchor ${n} kez bulundu (${beklenen} beklenir) — yazma İPTAL.`);
    process.exit(1);
  }
  sonra = sonra.split(d.eski).join(d.yeni);
}

/* ---- Yazma ÖNCESİ assert'ler (tümü geçmezse dosya yazılmaz) ---- */
const asserts = [
  ["KADRO-YAMASI işareti mevcut", sonra.includes("KADRO-YAMASI")],
  ["kadroDuzelt tanımlı (tek)", (sonra.match(/function kadroDuzelt\(db\)/g) || []).length === 1],
  ["bosDB tek tanım", (sonra.match(/function bosDB\(\)/g) || []).length === 1],
  ["normalize kancası yerinde", sonra.includes('if (typeof kadroDuzelt === "function") kadroDuzelt(d);')],
  ["seedDB kancası yerinde", sonra.includes("kadroDuzelt(db);\n  return db;")],
  ["17 öğretmen kadro listesi (tek tanım)", (sonra.match(/KADRO_OGRETMENLER = \[/g) || []).length === 1],
  ["18 sınıf kadro listesi (tek tanım)", (sonra.match(/KADRO_SINIFLAR = \[/g) || []).length === 1],
  ["NİHAT KANARIĞ (ğ) seed'de", sonra.includes('ad: "NİHAT KANARIĞ"')],
  /* tarihsel ders kayıtlarındaki (plan satırlarındaki) eski yazım KORUNUR — referans taşınmaz; kadro eşlemesi aksan duyarsız */
  ["eski KANARIG yalnızca plan satırlarında (3 tarihsel referans)", (sonra.match(/"NİHAT KANARIG"/g) || []).length === 3],
  ["11 SAYCAL seed'de", sonra.includes('"11 SAYCAL": [],')],
  ["eski '11 SAY CAL' tamamen kalktı", !sonra.includes('"11 SAY CAL"')],
  /* 1 sinifProg + 3 seed avail + (KADRO_SINIFLAR JSON gömümünde kaç tırnaklı geçiş varsa) */
  ["11 SAYCAL referans sayısı tam", (sonra.match(/"11 SAYCAL"/g) || []).length === 4 + (KADRO_FN.match(/"11 SAYCAL"/g) || []).length],
  ["satır sayısı mantıklı (+" + (sonra.split("\n").length - once.split("\n").length) + ")", sonra.split("\n").length > once.split("\n").length],
];
let hata = 0;
for (const [ad, ok] of asserts) {
  console.log((ok ? "  ✓ " : "  ✗ ") + ad);
  if (!ok) hata = 1;
}
if (hata) {
  console.error("ASSERT BAŞARISIZ — dosya YAZILMADI.");
  process.exit(1);
}
const yedek = DOSYA + ".kadro-oncesi.bak";
copyFileSync(DOSYA, yedek);
writeFileSync(DOSYA, sonra);
console.log("Yama uygulandı → " + DOSYA + " (yedek: " + yedek + ")");
