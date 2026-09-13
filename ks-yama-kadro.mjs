/* ks-yama-kadro.mjs — GERÇEK KADRO YAMASI (assert'li, idempotent)
   Tek iş: 17 gerçek öğretmen + 18 gerçek sınıf DB şemasına eklenir/güncellenir;
   mevcut ID'ler, dersler, istekler, grup dersleri, sinifProg ve avail korunur.
   Uygulama:
     1) seed yazım düzeltmeleri (KANARIĞ, 11 SAYCAL — yalnızca seed kaynak metni;
        çalışan DB'deki kayıtlara dokunulmaz, kadroDuzelt onları normalize ile hizalar)
     1b) deterministik sınıf kimliği: kadroSnfId(ad) = ks-snf-00NN-<djb2 base36> —
        taze boot'ta da aynı ID; kayıtlı DB kimlikleri yine de KORUNUR
     2) kadroDuzelt(db) davranışsal katmanı: TR-aksan duyarsız ad eşlemesi; eşleşen
        öğretmenin ID'si KORUNUR, adı+branşı kadro yazımına güncellenir; eksikse şemaya
        uygun yeni kayıt + kimlikUret/kimlikleriTamamla ile kalıcı ID; sınıflar
        sinifProg + sinifIds'e eklenir (mevcut kimlik korunur); çift ad uyarı ile RAPORLANIR (silinmez).
   Her değişiklik assert edilir; anchor bulunamazsa YAZMAZ. 2. koşu exit 2. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const DOSYA = "app.js";
const once = readFileSync(DOSYA, "utf8");

/* Idempotentlik: tüm yama (1. faz kadro + 2. faz deterministik sınıf ID) tamamsa dokunma */
if (once.includes("KADRO-YAMASI") && once.includes("kadroDuzelt") && once.includes("kadroSnfId")) {
  console.log("Zaten uygulanmış (KADRO-YAMASI + kadroSnfId işareti mevcut) — dosya değiştirilmedi.");
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

/* Yama 1: seed yazım düzeltmeleri (yalnızca seed kaynak metni) */
const YAZIM = [
  { eski: '{ id: uid(), ad: "NİHAT KANARIG", brans: "tar"', yeni: '{ id: uid(), ad: "NİHAT KANARIĞ", brans: "tar"', ad: "NİHAT KANARIĞ yazımı (seed öğretmen kaydı)" },
  /* Seed plan satırlarındaki 3 tarihsel referans da kadro yazımına çevrilir — seed taze üretilir,
     ogr() ad-tam-eşleşmesi boş depo açılışında çökmesin. Çalışan DB'deki eski kayıtlara DOKUNULMAZ
     (onları kadroDuzelt normalize kançası ID korunarak hizalar). */
  { eski: '"NİHAT KANARIG"', yeni: '"NİHAT KANARIĞ"', tekrar: 3, ad: "NİHAT KANARIĞ yazımı (seed plan satırları ×3)" },
  { eski: '"11 SAY CAL": [],', yeni: '"11 SAYCAL": [],', ad: "11 SAYCAL yazımı (seed sinifProg anahtarı)" },
  { eski: '"1-1":"11 SAY CAL","2-1":"11 SAYISAL FEN"', yeni: '"1-1":"11 SAYCAL","2-1":"11 SAYISAL FEN"', tekrar: 3, ad: "11 SAYCAL yazımı (seed avail.sinif değerleri ×3)" },
];
/* Deterministik sınıf kimliği: ad → ks-snf-00NN-<djb2 base36>. Taze boot'ta da AYNI ID;
   mevcut DB'lerde kayıtlı kimlik yine de KORUNUR (yalnızca eksik girdiye üretilir). */
const SNF_FN = `function kadroSnfId(ad) {
  var h = 5381;
  var s = String(ad || "");
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  var n = KADRO_SINIFLAR.indexOf(s) + 1;
  return "ks-snf-" + ("0000" + n).slice(-4) + "-" + h.toString(36);
}`;

/* Yama 2: seedDB dönüş kancası (seedDB'nin gerçek sonuna — istekler bloğunun kapandığı yere) */
const ANCHOR_RETURN = '  ];\n  return db;\n}\n\n// ===== SECTION: ARAYÜZ DURUMU';
const KANCA_RETURN = `  ];
  /* KADRO-YAMASI: seed DB'si gerçek kadroyla hizalanır (idempotent davranışsal katman) */
  kadroDuzelt(db);
  return db;
}

// ===== SECTION: ARAYÜZ DURUMU`;
/* Yama 3: normalize sonuna kadro kancası */
const ANCHOR_NORM = "  kimlikleriTamamla(d);\n  return d;\n}";
const KANCA_NORM = `  kimlikleriTamamla(d);
  /* KADRO-YAMASI: her normalize (boot/loadDB/yedek yükleme) gerçek kadroyu DB'ye uygular — idempotent */
  if (typeof kadroDuzelt === "function") kadroDuzelt(d);
  return d;
}`;
/* Yama 4: kadro verisi + kadroDuzelt — bosDB'den ÖNCE tek ekleme noktası (üst-düzey) */
const ANCHOR_FN = "function bosDB() {";
const KADRO_FN = `/* ---------- KADRO-YAMASI: gerçek öğretmen ve sınıf kadrosu (tek gerçek kaynak; davranışsal katman) ---------- */
var KADRO_OGRETMENLER = ${JSON.stringify(KADRO_OGRETMENLER)};
var KADRO_SINIFLAR = ${JSON.stringify(KADRO_SINIFLAR)};
/* Kurallar:
   - Öğretmen GÜVENLİ NORMALIZE ad karşılaştırmasıyla bulunur (TR büyük/küçük + aksan duyarsız:
     ç→c ğ→g ı/İ→i ö→o ş→s ü→u). Aynı kişi: YENİ KAYIT OLUŞTURULMAZ — mevcut ID KORUNUR,
     ad + branş kadro yazımıyla güncellenir. Yoksa: mevcut şemada ({id, ad, brans, avail:{sinif:{},musait:[]}})
     yeni kayıt + kimlikUret/kimlikleriTamamla ile kalıcı ID.
   - Sınıflar DB.sinifIds[ad] + DB.sinifProg[ad] içine eklenir; var olan sınıf kimliği KORUNUR.
   - Aynı adla ikinci öğretmen kimliği ASLA üretilmez; çift ad (aksan varyantları dahil) uyarıyla RAPORLANIR, SİLİNMEZ.
   - Referanslar (ders/istek/ogrenciIds/ogretmenId/ekDers) ve mevcut sinifProg/avail İÇERİKLERİ değiştirilmez. */
function kadroAdKey(ad) {
  return String(ad || "").trim().toLocaleLowerCase("tr-TR")
    .replace(/\\u00e7/g, "c").replace(/\\u011f/g, "g").replace(/\\u0131/g, "i")
    .replace(/\\u00f6/g, "o").replace(/\\u015f/g, "s").replace(/\\u00fc/g, "u")
    .replace(/\\u0307/g, "").replace(/[\\u0300-\\u036f]/g, "");
}
${SNF_FN}
function kadroDuzelt(db) {
  if (!db || typeof db !== "object") return { t: 0, s: 0, b: 0, n: 0 };
  var say = { t: 0, s: 0, b: 0, n: 0 };
  function ogretmenBul(ad) { var k = kadroAdKey(ad); return (db.ogretmenler || []).filter(function (t) { return kadroAdKey(t.ad) === k; })[0]; }
  /* Öğretmenler: eşleşen → ID korunur, ad + branş kadro yazımına güncellenir */
  KADRO_OGRETMENLER.forEach(function (r) {
    var t = ogretmenBul(r[0]);
    if (!t) return;
    if (t.brans !== r[1]) { t.brans = r[1]; say.b++; }
    if (t.ad !== r[0]) { t.ad = r[0]; say.n++; }
  });
  /* Çift ad (aksan varyantları dahil) üretimi engellenir; mevcut çiftler RAPORLANIR (silinmez) */
  var adSay = {};
  (db.ogretmenler || []).forEach(function (t) { var k = kadroAdKey(t.ad); adSay[k] = (adSay[k] || 0) + 1; });
  var cift = Object.keys(adSay).filter(function (k) { return adSay[k] > 1; });
  if (cift.length && typeof console !== "undefined") console.warn("KADRO-YAMASI: aynı kişiye ait çoklu öğretmen kaydı (birleştirilmedi, raporlandı):", cift.join(", "));
  /* Eksik öğretmenler: mevcut şemada yeni kayıt; kalıcı ID kimlikleriTamamla ile üretilir (idempotent) */
  if (!cift.length) {
    db.ogretmenler = Array.isArray(db.ogretmenler) ? db.ogretmenler : [];
    KADRO_OGRETMENLER.forEach(function (r) {
      if (ogretmenBul(r[0])) return;
      db.ogretmenler.push({ id: "", ad: r[0], brans: r[1], avail: { sinif: {}, musait: [] } });
      say.t++;
    });
  }
  if (Array.isArray(db.ogretmenler) && db.ogretmenler.some(function (t) { return !t.id; })) kimlikleriTamamla(db);
  /* Sınıflar: sinifProg girdisi + sinifIds kimliği (mevcut kimlik KORUNUR) */
  db.sinifProg = db.sinifProg && typeof db.sinifProg === "object" ? db.sinifProg : {};
  if (!db.sinifIds || typeof db.sinifIds !== "object" || Array.isArray(db.sinifIds)) db.sinifIds = {};
  KADRO_SINIFLAR.forEach(function (ad) {
    if (!db.sinifProg[ad]) { db.sinifProg[ad] = []; say.s++; }
    if (db.sinifIds[ad] == null || db.sinifIds[ad] === "") { db.sinifIds[ad] = kadroSnfId(ad); say.s++; }
  });
  return say;
}
function bosDB() {`;

const DEGISIMLER = [
  ...YAZIM.map(y => ({ ad: y.ad, eski: y.eski, yeni: y.yeni, tekrar: y.tekrar })),
  { ad: "seedDB dönüş kancası", eski: ANCHOR_RETURN, yeni: KANCA_RETURN },
  { ad: "normalize kadro kancası", eski: ANCHOR_NORM, yeni: KANCA_NORM },
  { ad: "kadroDuzelt tanımı (bosDB öncesi)", eski: ANCHOR_FN, yeni: KADRO_FN },
];

/* Faz 2 (zaten kadro-yamalı dosyaya): deterministik sınıf ID geçişi */
const ESKI_SNF = 'if (db.sinifIds[ad] == null || db.sinifIds[ad] === "") { db.sinifIds[ad] = kimlikUret("snf", Object.keys(db.sinifIds).length); say.s++; }';
const YENI_SNF = 'if (db.sinifIds[ad] == null || db.sinifIds[ad] === "") { db.sinifIds[ad] = kadroSnfId(ad); say.s++; }';
const ANCHOR_KEYSON = '.replace(/[\\u0300-\\u036f]/g, "");\n}\nfunction kadroDuzelt(db) {';
const KANCA_KEYSON = '.replace(/[\\u0300-\\u036f]/g, "");\n}\n' + SNF_FN + '\nfunction kadroDuzelt(db) {';
const degisimler = [];
if (!once.includes('ad: "NİHAT KANARIĞ"')) degisimler.push(...YAZIM.map(y => ({ ad: y.ad, eski: y.eski, yeni: y.yeni, tekrar: y.tekrar })));
if (!once.includes("kadroDuzelt(db);\n  return db;")) degisimler.push({ ad: "seedDB dönüş kancası", eski: ANCHOR_RETURN, yeni: KANCA_RETURN });
if (!once.includes('if (typeof kadroDuzelt === "function") kadroDuzelt(d);')) degisimler.push({ ad: "normalize kadro kancası", eski: ANCHOR_NORM, yeni: KANCA_NORM });
if (!once.includes("function kadroDuzelt(db)")) degisimler.push({ ad: "kadroDuzelt tanımı (bosDB öncesi)", eski: ANCHOR_FN, yeni: KADRO_FN });
if (!once.includes("function kadroSnfId(ad)")) {
  if (!once.includes("function kadroDuzelt(db)")) {
    /* 1. faz yolu: KADRO_FN zaten deterministik üretimi taşır */
  } else {
    degisimler.push({ ad: "deterministik sınıf ID üretimi (kadroDuzelt içi)", eski: ESKI_SNF, yeni: YENI_SNF });
    degisimler.push({ ad: "kadroSnfId tanımı (kadroAdKey sonrası)", eski: ANCHOR_KEYSON, yeni: KANCA_KEYSON });
  }
}
if (degisimler.length === 0) {
  console.log("Zaten uygulanmış — dosya değiştirilmedi.");
  process.exit(2);
}

let sonra = once;
for (const d of degisimler) {
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
  ["kadruAdKey değil kadroAdKey", sonra.includes("function kadroAdKey(ad)") && !sonra.includes("function kadruAdKey")],
  ["TR aksan katlaması (ğ→g)", sonra.includes("kadroAdKey") && /replace\([^)]*011f[^)]*,\s*"g"\)/.test(sonra)],
  ["normalize kancası yerinde", sonra.includes('if (typeof kadroDuzelt === "function") kadroDuzelt(d);')],
  ["seedDB kancası yerinde", sonra.includes("kadroDuzelt(db);\n  return db;")],
  ["17 öğretmen kadro listesi (tek tanım)", (sonra.match(/KADRO_OGRETMENLER = \[/g) || []).length === 1],
  ["18 sınıf kadro listesi (tek tanım)", (sonra.match(/KADRO_SINIFLAR = \[/g) || []).length === 1],
  ["NİHAT KANARIĞ (ğ) seed'de", sonra.includes('ad: "NİHAT KANARIĞ"')],
  ["eski KANARIG tamamen kalktı", !sonra.includes("NİHAT KANARIG")],
  ["11 SAYCAL seed'de", sonra.includes('"11 SAYCAL": [],')],
  ["eski '11 SAY CAL' tamamen kalktı", !sonra.includes('"11 SAY CAL"')],
  /* 1 sinifProg + 3 seed avail + (KADRO_SINIFLAR JSON gömümünde kaç tırnaklı geçiş varsa) */
  ["11 SAYCAL referans sayısı tam", (sonra.match(/"11 SAYCAL"/g) || []).length >= 4],
  ["kadroSnfId tanımlı (tek)", (sonra.match(/function kadroSnfId\(ad\)/g) || []).length === 1],
  ["kadroDuzelt deterministik sınıf ID kullanıyor", sonra.includes("db.sinifIds[ad] = kadroSnfId(ad); say.s++;")],
  ["kadroDuzelt'ten eski kimlikUret snf satırı kalktı", !sonra.includes('db.sinifIds[ad] = kimlikUret(')],
  ["djb2 hash üretimi yerinde", sonra.includes("((h << 5) + h + s.charCodeAt(i)) >>> 0")],
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
