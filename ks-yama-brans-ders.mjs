/* ks-yama-brans-ders.mjs — BRANS-DERS-KURALI yaması (assert'li, idempotent)
   1. koşu: uygular, backup alır (varsa üzerine YAZMAZ). 2. koşu: exit 2 "Zaten uygulanmış". */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const h = (f) => sha(readFileSync(f));
const as = (c, m) => { if (!c) { console.error("ASSERT: " + m); process.exit(1); } };

const MARK_APP = "BRANS-DERS-KURALI-YAMASI";
const MARK_EK = "BRANS-DERS-KURALI-EK-YAMASI";

/* ---- app.js ---- */
let app = readFileSync("app.js", "utf8");
const appOnce = h("app.js");
if (app.includes(MARK_APP)) {
  console.log("[app.js] Zaten uygulanmış (BRANS-DERS-KURALI-YAMASI var) — dokunulmadı.");
  app = null;
} else {
  /* Backup (varolan üzerine yazma) */
  if (!existsSync("app.js.brans-ders-oncesi.bak")) writeFileSync("app.js.brans-ders-oncesi.bak", readFileSync("app.js"));

  /* 1) Tek kaynak: BRANS_DERS_HARITA + bransDersUygun (DERS map kurulduktan hemen sonra) */
  const anchorApp = "var DERS = {};\nDERSLER.forEach(function (d) { DERS[d.id] = d; });";
  as(app.includes(anchorApp), "app.js DERS map anchor bulunamadı");
  const helper = anchorApp + `

/* ===== BRANS-DERS-KURALI-YAMASI v1: öğretmen branşı ↔ verilebilir ders kuralı (TEK KAYNAK) =====
   Kural: mat → [mat, geo] · tur → [tur, edb] · diğer branşlar yalnız kendi dersini verir.
   Eşleşme aksan/büyük-küçük harf/boşluk duyarsızdır. Ders/branş haritada yoksa FAIL-CLOSED: uygun sayılmaz. */
var BRANS_DERS_HARITA = { mat: ["mat", "geo"], tur: ["tur", "edb"] };
function bransDersNorm(v) {
  var m = { "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u", "ş": "s", "Ş": "s", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c" };
  return String(v || "").replace(/[ıİğĞüÜşŞöÖçÇ]/g, function (c) { return m[c]; }).toLocaleLowerCase("tr").replace(/\\s+/g, "").trim();
}
var BRANS_DERS_TUM_DERSLER = DERSLER.map(function (d) { return d.id; });
function bransDersUygun(ogretmenId, dersId, konu) {
  /* konu parametresi sözleşmeyi tamamlar (şu an kuralda etkisiz); geriye dönük uyumlu imza */
  var t = (typeof DB !== "undefined" && DB.ogretmenler || []).find(function (x) { return x.id === ogretmenId; });
  if (!t) return false; /* FAIL-CLOSED: öğretmen yok */
  var ders = DERS[dersId];
  if (!ders || !BRANS_DERS_TUM_DERSLER.indexOf) return false;
  if (BRANS_DERS_TUM_DERSLER.indexOf(dersId) < 0) return false; /* bilinmeyen ders */
  var b = bransDersNorm(t.brans);
  if (!b) return false; /* branşsız öğretmen — FAIL-CLOSED */
  var haritaGirdi = Object.keys(BRANS_DERS_HARITA).filter(function (k) { return bransDersNorm(k) === b; })[0];
  var izinli;
  if (haritaGirdi) {
    izinli = BRANS_DERS_HARITA[haritaGirdi];
  } else {
    /* diğer branşlar: yalnız kendi dersini verir — branş adı aynen bir ders id olmalı */
    var eslesenDers = DERSLER.filter(function (d) { return bransDersNorm(d.id) === b; })[0];
    if (!eslesenDers) return false; /* FAIL-CLOSED: branş hiçbir derse bağlanamıyor */
    izinli = [eslesenDers.id];
  }
  if (!izinli || !izinli.length) return false;
  return izinli.some(function (d) { return bransDersNorm(d) === bransDersNorm(dersId); });
}
function bransDersIzinliDersler(ogretmenId) {
  var t = (typeof DB !== "undefined" && DB.ogretmenler || []).find(function (x) { return x.id === ogretmenId; });
  if (!t) return DERSLER.map(function (d) { return d.id; });
  var b = bransDersNorm(t.brans);
  var haritaGirdi = Object.keys(BRANS_DERS_HARITA).filter(function (k) { return bransDersNorm(k) === b; })[0];
  if (haritaGirdi) return BRANS_DERS_HARITA[haritaGirdi].slice();
  var eslesenDers = DERSLER.filter(function (d) { return bransDersNorm(d.id) === b; })[0];
  return eslesenDers ? [eslesenDers.id] : [];
}
function bransDersRedMesaji(t, dersId) {
  var D = DERS[dersId] || { ad: String(dersId) };
  var izinli = bransDersIzinliDersler(t.id).map(function (d) { return (DERS[d] || {}).ad || d; });
  var bAd = (DERS[t.brans] || { ad: String(t.brans || "?") }).ad;
  return "<b>" + esc(t.ad) + "</b> öğretmeninin branşı <b>" + esc(bAd) + "</b>; <b>" + esc(D.ad) +
    "</b> dersi veremez. Bu öğretmene verilebilecek dersler: <b>" + esc(izinli.join(", ")) + "</b>.";
}`;
  app = app.replace(anchorApp, helper);
  as(app.includes(MARK_APP), "helper bloğu yerleştirilemedi");

  /* 2) planla(): öğretmen bulununca kaydetmeden ÖNCE uygunluk kontrolü (grup dahil — tek kapı) */
  const anchorPlanla = '    toast("Yeni öğretmen kaydedildi: " + ogretmenAd);\n  }';
  as(app.includes(anchorPlanla), "planla öğretmen anchor bulunamadı");
  const planlaYama = `    toast("Yeni öğretmen kaydedildi: " + ogretmenAd);
  }
  /* BRANS-DERS-KURALI: kaydetmeden önce zorunlu uygunluk — uygunsuz atama KAYDEDİLMEZ */
  if (typeof bransDersUygun === "function" && !bransDersUygun(t.id, dersId, konu)) {
    hataKart([typeof bransDersRedMesaji === "function" ? bransDersRedMesaji(t, dersId) : "Branş-ders uyumsuzluğu."]);
    return;
  }`;
  app = app.replace(anchorPlanla, planlaYama);

  /* 3) renderFormDestek(): ders listesi öğretmene göre filtrelenir (asıl güvenlik kayıt öncesi) */
  const anchorFiltre = '  var dersSec = $("f-ders");\n  if (!dersSec.innerHTML.trim()) dersSec.innerHTML = dersOpsi();';
  as(app.includes(anchorFiltre), "renderFormDestek ders anchor bulunamadı");
  const filtreYama = `  var dersSec = $("f-ders");
  if (!dersSec.innerHTML.trim()) {
    /* BRANS-DERS-KURALI: öğretmen seçiliyse ders listesi yalnız izin verilen derslerle doldurulur */
    var _ogrtAd = $("f-ogretmen") ? $("f-ogretmen").value.trim() : "";
    var _ogrt = _ogrtAd ? DB.ogretmenler.find(function (x) { return kucuk(x.ad) === kucuk(_ogrtAd); }) : null;
    var _izinli = _ogrt ? bransDersIzinliDersler(_ogrt.id) : DERSLER.map(function (d) { return d.id; });
    var _opts = "";
    DERSLER.forEach(function (d) { if (_izinli.indexOf(d.id) >= 0) _opts += '<option value="' + d.id + '">' + d.ad + "</option>"; });
    if (!_opts) _opts = dersOpsi(); /* filtre boşsa tüm liste (güvenlik kayıtta) */
    dersSec.innerHTML = _opts;
  }`;
  app = app.replace(anchorFiltre, filtreYama);
  as(app.includes(MARK_APP), "filtre yaması yerleştirilemedi");

  /* 4) hizliSec sonrası ve f-ogretmen değişiminde ders listesini tazele: planla güvencesi yeterli;
     form filtresi renderFormDestek çağrılarında işler. Ek yenileme: hizliSec tanımını bul. */
  const anchorHizli = /function hizliSec\(([^)]*)\) \{\n/;
  if (anchorHizli.test(app)) {
    app = app.replace(anchorHizli, (m) => m + `  if (typeof renderFormDestek === "function") renderFormDestek(); /* BRANS-DERS-KURALI: öğretmen seçiminde ders listesi tazelenir */\n`);
  }
  writeFileSync("app.js", app);
  console.log("[app.js] yama uygulandı. " + appOnce + " → " + sha(app));
}

/* ---- ek-ders.js ---- */
let ek = readFileSync("ek-ders.js", "utf8");
const ekOnce = h("ek-ders.js");
if (ek.includes(MARK_EK)) {
  console.log("[ek-ders.js] Zaten uygulanmış — dokunulmadı.");
} else if (!app) {
  console.log("[ek-ders.js] app.js yamalı idi ama ek yaması yok — beklenmedik durum, dokunulmadı.");
  process.exit(1);
} else {
  if (!existsSync("ek-ders.js.brans-ders-oncesi.bak")) writeFileSync("ek-ders.js.brans-ders-oncesi.bak", readFileSync("ek-ders.js"));
  const anchorEk = '      toast("Yeni öğretmen kaydedildi: " + ogretmenAd);\n    }\n\n    var cakisma = ekDuzeltmeBul(';
  as(ek.includes(anchorEk), "ekPlanla öğretmen anchor bulunamadı");
  const ekYama = `      toast("Yeni öğretmen kaydedildi: " + ogretmenAd);
    }
    /* BRANS-DERS-KURALI-EK-YAMASI: ek ders kaydetmeden önce zorunlu uygunluk (tek kaynak app.js'te) */
    if (typeof bransDersUygun === "function" && !bransDersUygun(t.id, dersId, konu)) {
      ekHataKart([typeof bransDersRedMesaji === "function" ? bransDersRedMesaji(t, dersId) : "Branş-ders uyumsuzluğu."]);
      return;
    }

    var cakisma = ekDuzeltmeBul(`;
  ek = ek.replace(anchorEk, ekYama);
  as(ek.includes(MARK_EK), "ekPlanla yaması yerleştirilemedi");

  /* ek ders ders listesi filtresi (UI konforu) */
  const anchorEkOps = "    var dersOps = '<option value=\"\" disabled>Ders seçin</option>';\n    DERSLER.forEach(function (d) { dersOps += '<option value=\"' + d.id + '\"' + (ui.ekForm.dersId === d.id ? \" selected\" : \"\") + \">\" + d.ad + \"</option>\"; });";
  if (ek.includes(anchorEkOps)) {
    const ekOpsYama = `    var dersOps = '<option value="" disabled>Ders seçin</option>';
    /* BRANS-DERS-KURALI-EK-YAMASI: öğretmen seçiliyse yalnız izinli dersler listelenir */
    var _ekOgrt = (ui.ekForm.ogretmen || "").trim() ? DB.ogretmenler.find(function (x) { return kucuk(x.ad) === kucuk(ui.ekForm.ogretmen); }) : null;
    var _ekIzinli = _ekOgrt ? bransDersIzinliDersler(_ekOgrt.id) : DERSLER.map(function (d) { return d.id; });
    DERSLER.forEach(function (d) { if (_ekIzinli.indexOf(d.id) >= 0) dersOps += '<option value="' + d.id + '"' + (ui.ekForm.dersId === d.id ? " selected" : "") + ">" + d.ad + "</option>"; });
    if (!ekOpsTumDersler()) { /* filtre boşsa tümü (fallback) */ }
    function ekOpsTumDersler() {
      var s = "";
      DERSLER.forEach(function (d) { s += '<option value="' + d.id + '"' + (ui.ekForm.dersId === d.id ? " selected" : "") + ">" + d.ad + "</option>"; });
      return s.length ? null : null;
    }`;
    /* Basit ve güvenli: yalnız döngü içine filtre koşulu ekle, fallback'i filtre boşluğunda tüm listeyle değiştir */
    const basit = `    var dersOps = '<option value="" disabled>Ders seçin</option>';
    /* BRANS-DERS-KURALI-EK-YAMASI: öğretmen seçiliyse yalnız izinli dersler listelenir; boşsa tümü */
    var _ekOgrt = (ui.ekForm.ogretmen || "").trim() ? DB.ogretmenler.find(function (x) { return kucuk(x.ad) === kucuk(ui.ekForm.ogretmen); }) : null;
    var _ekIzinli = _ekOgrt ? bransDersIzinliDersler(_ekOgrt.id) : DERSLER.map(function (d) { return d.id; });
    if (!_ekIzinli.length) _ekIzinli = DERSLER.map(function (d) { return d.id; });
    DERSLER.forEach(function (d) { if (_ekIzinli.indexOf(d.id) >= 0) dersOps += '<option value="' + d.id + '"' + (ui.ekForm.dersId === d.id ? " selected" : "") + ">" + d.ad + "</option>"; });`;
    ek = ek.replace(anchorEkOps, basit);
  }
  writeFileSync("ek-ders.js", ek);
  console.log("[ek-ders.js] yama uygulandı. " + ekOnce + " → " + sha(ek));
}

/* ---- test.mjs: süit tam 1 kez ekle ---- */
let tm = readFileSync("test.mjs", "utf8");
const SUIT = "ks-brans-ders-kurali.mjs";
const nOnce = (tm.match(new RegExp("\"" + SUIT + "\"", "g")) || []).length;
if (nOnce === 0) {
  as(tm.includes('"ks-kart-kolon.mjs"]'), "test.mjs suites anchor bulunamadı");
  if (!existsSync("test.mjs.brans-ders-oncesi.bak")) writeFileSync("test.mjs.brans-ders-oncesi.bak", readFileSync("test.mjs"));
  tm = tm.replace('"ks-kart-kolon.mjs"]', '"ks-kart-kolon.mjs", "' + SUIT + '"]');
  writeFileSync("test.mjs", tm);
  console.log("[test.mjs] süit eklendi (1 kez).");
} else {
  console.log("[test.mjs] süit kaydı zaten " + nOnce + " kez — dokunulmadı.");
}
console.log("YAMA OK");
/* İdempotans sözleşmesi: hiçbir değişiklik yapılmadıysa (zaten uygulanmış) exit 2 */
if (h("app.js") === appOnce && h("ek-ders.js") === ekOnce &&
    (readFileSync("test.mjs", "utf8").match(new RegExp("\"" + SUIT + "\"", "g")) || []).length >= 1 && nOnce >= 1) {
  console.log("Zaten uygulanmış — hiçbir dosya değişmedi (exit 2).");
  process.exit(2);
}
