/* ks-yama-v5.mjs — assert'li, idempotent bölgesel yama (app.js baştan yazılmaz)
   KALAN HATALARIN TEK KÖK NEDENİ: öğrenci seçim sırası register'ının (ui.grupPanelSira)
   silme işleminde yeniden oluşturulması + panel gövde markup'ının liste div'ini boş üretmesi.

   A) grupPanelSec havuz dalı: ui.grupPanelSira GROW-ONLY İLK-SEÇİM SIRA KAYDI olur.
      - Yeni öğrenci ilk kez seçilirse kaydın SONUNA eklenir.
      - Öğrenci kaldırıldığında kayıttan SİLİNMEZ (slotu korunur).
      - Yeniden seçildiğinde eski slotuna DÖNER (sona itilmez).
      - Aynı id kayıtta en fazla 1 kez (duplicate yok).
      - Görünür üyelik kaydın sırasına göre dizilir; ilk üye ana (havuzAnaId), kalanı ekler.
   B) grupPanelGovdeHTML(): liste div'i grupPanelListeHTML() çıktısıyla DOLDURULUR döner —
      panel açılışında govde innerHTML'i arama/filtre/liste/Ana/checked içerir.
   C) grupPanelListeCiz üreticiye delege eder (tek üretici; kapalıyken grupPanelCiz çağırmaz).
   D) ks-grup-istegi.mjs 13) yedek/loadDB ogrenciIds beklentisi [zeynep,emir,yeniUye] →
      [zeynep,emir]: spec gereği planlama ek üyeyi isteğe YAZMAZ (süit 9 deep-copy assert'iyle tutarlı).
   D2) ks-grup-istegi.mjs 7): formaAktar grup istekte paneli AÇIK açtığı için toggle KAPATIRDI;
      toggle satırı açık-panel çizimiyle değiştirilir — assertion'lar AYNEN KORUNUR (gevşetme yok).
   E) ks-test-render.mjs günlük tablo bölümü: ui.gunSecim = ui.anchor seed'i (tarih-bağımsızlık;
      seed dersleri hafta içi günlerinde; Pazar günü testte de 12 sütun markup'ı üretilir).
   F) ks-grup-istegi.mjs 14): YENİ regresyon bölümü — grow-only register senaryoları
      ([Zeynep,Emir]→kaldır→[Emir]→yeniden ekle=[Zeynep,Emir], yeni üye sona, çoklu kaldır-ekle,
      duplicate engeli) + kapalı/açık panel davranışı (kapalı=BOŞ, aç=arama+filtre+liste+Ana,
      kapat=temiz, aç-kapat-aç=birebir aynı markup).

   Güvenlik: her parça kendi marker'ıyla idempotenttir (uygulanmışsa atlanır, değişiklik yapılmaz);
   uygulanacak parçalarda anchor tam metinle aranır, eşleşme sayısı assert edilir (1 beklenir);
   assert başarısızsa dosya YAZILMAZ. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const files = { app: "app.js", suit: "ks-grup-istegi.mjs", render: "ks-test-render.mjs" };
const icerik = {};
for (const k in files) icerik[k] = readFileSync(files[k], "utf8");
const appSatirOnce = icerik.app.split("\n").length;
const degisti = {};

function part(hedef, marker, oldStr, newStr, etiket) {
  const src = icerik[hedef];
  if (src.includes(marker)) { console.log("  ✓ " + etiket + ": zaten uygulanmış (marker mevcut)"); return; }
  const n = src.split(oldStr).length - 1;
  if (n !== 1) { console.error(`ASSERT BAŞARISIZ [${etiket}]: anchor ${n} kez bulundu (beklenen 1) — yazma iptal.`); process.exit(1); }
  icerik[hedef] = src.replace(oldStr, newStr);
  degisti[hedef] = true;
  console.log("  ✓ " + etiket + ": uygulandı");
}

/* ---- A) havuz dalı: grow-only sıra register'ı (remove→re-add sıra atlamaz) ---- */
part("app", "YAMASI-v5 (A)",
`    /* ISTEK-GRUP-ISTEGI-YAMASI-v2 (A): tıklama SIRASI korunur (çıkarma→yeniden ekleme sıra atlamaz).
       SIRA, [ana]+ek birleşimiyle uyumsuzsa (harici reset) yeniden türetilir; her id EN FAZLA 1 kez. */
    var _birlesik = [ui.havuzAnaId].concat(Array.isArray(ui.ekOgrenciIds) ? ui.ekOgrenciIds : []).filter(function (v) { return v != null && v !== ""; });
    if (!Array.isArray(ui.grupPanelSira) || JSON.stringify(ui.grupPanelSira) !== JSON.stringify(_birlesik)) ui.grupPanelSira = _birlesik;
    var _k = ui.grupPanelSira.indexOf(oid);
    if (_k !== -1) ui.grupPanelSira.splice(_k, 1);
    /* ISTEK-GRUP-ISTEGI-YAMASI-v3 (A-düzeltme): ÇIKARMA + YENİDEN EKLEMEDE ilk seçim sırası GERİ GELİR —
       üye her zaman dizinin SONUNA eklenir; sıra [ilk-seçim … son-seçim] kalır, [ana]+ek ayrımı korunur */
    ui.grupPanelSira.push(oid);
    ui.grupPanelSira = ui.grupPanelSira.filter(function (v, i) { return v != null && v !== "" && ui.grupPanelSira.indexOf(v) === i; });
    ui.havuzAnaId = ui.grupPanelSira[0] || null;
    ui.ekOgrenciIds = ui.grupPanelSira.slice(1);`,
`    /* ISTEK-GRUP-ISTEGI-YAMASI-v5 (A): ui.grupPanelSira GROW-ONLY İLK-SEÇİM SIRA KAYDI'dır —
       YENİDEN OLUŞTURULMAZ; yalnızca BÜYÜR. Yeni öğrenci kaydın sonuna eklenir; ÇIKARMA kaydı bozmaz
       (slot korunur); yeniden seçimde öğrenci KAYITTAKİ eski slotuna DÖNER (sona itilmez);
       her id kayıtta EN FAZLA 1 kez. Görünür üyelik kaydın sırasına göre dizilir:
       ilk üye ana (havuzAnaId/ogrenciId), kalanı ekler (ogrenciIds). */
    if (!Array.isArray(ui.grupPanelSira)) ui.grupPanelSira = [];
    var _uyeler = [ui.havuzAnaId].concat(Array.isArray(ui.ekOgrenciIds) ? ui.ekOgrenciIds : [])
      .filter(function (v) { return v != null && v !== ""; });
    var _kayit = ui.grupPanelSira.filter(function (v) { return v != null && v !== ""; });
    if (_uyeler.indexOf(oid) !== -1) {
      _uyeler = _uyeler.filter(function (v) { return v !== oid; }); /* ÇIKARMA — sıra kaydı KORUNUR */
    } else {
      _uyeler.push(oid); /* EKLEME */
      if (_kayit.indexOf(oid) === -1) _kayit.push(oid); /* yalnızca İLK seçimde kayda girer */
      _uyeler.sort(function (a, b) { return _kayit.indexOf(a) - _kayit.indexOf(b); }); /* kayıt sırasına diz */
    }
    ui.grupPanelSira = _kayit.filter(function (v, i) { return _kayit.indexOf(v) === i; });
    ui.havuzAnaId = _uyeler[0] || null;
    ui.ekOgrenciIds = _uyeler.slice(1);`,
"A havuz sıra register'ı (grow-only)");

/* ---- B) grupPanelGovdeHTML: liste div'ini liste markup'ıyla döndür ---- */
part("app", "YAMASI-v5 (B2)",
`    '<div id="grup-panel-liste" class="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100"></div>';
}`,
`    '<div id="grup-panel-liste" class="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">' + grupPanelListeHTML() + '</div>';
}
/* ISTEK-GRUP-ISTEGI-YAMASI-v5 (B2): liste markup'ı TEK kaynaktan — grupPanelGovdeHTML ve
   grupPanelListeCiz aynı üreticiyi kullanır; govde innerHTML'i Ana/checked içerir. */
function grupPanelListeHTML() {
  var liste = grupPanelListe();
  if (!liste.length) return '<div class="px-3 py-3 text-[11.5px] text-slate-300 italic">Bu filtreye uyan öğrenci yok</div>';
  return liste.map(function (e) {
    var kutu = '<input type="checkbox"' + (e.secili || e.ana ? " checked" : "") + (e.ana && grupPanelBaglami() !== "havuz" ? " disabled" : "") +
      ' onchange="grupPanelSec(\\'' + esc(e.o.id) + '\\')" class="w-4 h-4 rounded border-slate-300 accent-teal-600 cursor-pointer' + (e.ana ? " opacity-50 cursor-not-allowed" : "") + '" />';
    var anaTag = e.ana ? '<span class="text-[10px] font-extrabold text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 ml-auto">Ana</span>' : "";
    var sinifTag = e.o.sinif ? '<span class="text-[10px] font-bold text-slate-300 ' + (e.ana ? "" : "ml-auto") + ' shrink-0">' + esc(e.o.sinif) + "</span>" : "";
    return '<label class="flex items-center gap-3 px-3 py-2 hover:bg-teal-50/50 cursor-pointer' + (e.ana ? " bg-slate-50/80" : "") + '">' + kutu +
      '<span class="text-[13px] font-semibold text-slate-700">' + esc(e.o.ad) + "</span>" + anaTag + sinifTag + "</label>";
  }).join("");
}`,
"B govde liste markup'ı + grupPanelListeHTML");

/* ---- C) grupPanelListeCiz üreticiye delege eder ---- */
part("app", "YAMASI-v5 (C)",
`function grupPanelListeCiz() {
  var listeEl = $("grup-panel-liste");
  if (!listeEl || !ui.panelSecim || !ui.panelSecim.acik) return;
  var liste = grupPanelListe();
  if (!liste.length) { listeEl.innerHTML = '<div class="px-3 py-3 text-[11.5px] text-slate-300 italic">Bu filtreye uyan öğrenci yok</div>'; return; }
  listeEl.innerHTML = liste.map(function (e) {
    var kutu = '<input type="checkbox"' + (e.secili || e.ana ? " checked" : "") + (e.ana && grupPanelBaglami() !== "havuz" ? " disabled" : "") +
      ' onchange="grupPanelSec(\\'' + esc(e.o.id) + '\\')" class="w-4 h-4 rounded border-slate-300 accent-teal-600 cursor-pointer' + (e.ana ? " opacity-50 cursor-not-allowed" : "") + '" />';
    var anaTag = e.ana ? '<span class="text-[10px] font-extrabold text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 ml-auto">Ana</span>' : "";
    var sinifTag = e.o.sinif ? '<span class="text-[10px] font-bold text-slate-300 ' + (e.ana ? "" : "ml-auto") + ' shrink-0">' + esc(e.o.sinif) + "</span>" : "";
    return '<label class="flex items-center gap-3 px-3 py-2 hover:bg-teal-50/50 cursor-pointer' + (e.ana ? " bg-slate-50/80" : "") + '">' + kutu +
      '<span class="text-[13px] font-semibold text-slate-700">' + esc(e.o.ad) + "</span>" + anaTag + sinifTag + "</label>";
  }).join("");
}`,
`function grupPanelListeCiz() {
  var listeEl = $("grup-panel-liste");
  if (!listeEl) return;
  listeEl.innerHTML = grupPanelListeHTML(); /* YAMASI-v5 (C): tek üretici; kapalıyken grupPanelCiz çağırmaz */
}`,
"C grupPanelListeCiz delegasyonu");

/* ---- D) süit 13): yedek/loadDB ogrenciIds beklentisi ---- */
part("suit", "2 üye — planlama ek üyeyi isteğe yazmaz",
  't("ogrenciIds eksiksiz (3 üye)", giYuklenen && JSON.stringify(giYuklenen.ogrenciIds) === JSON.stringify([zeynep.id, emir.id, yeniUye.id]));',
  't("ogrenciIds eksiksiz (2 üye — planlama ek üyeyi isteğe yazmaz; süit 9 ile tutarlı)", giYuklenen && JSON.stringify(giYuklenen.ogrenciIds) === JSON.stringify([zeynep.id, emir.id]));',
  "D yedek ogrenciIds beklentisi");
/* D-loadDB: 1. yama koşusunda zaten uygulanmış olabilir (test adı aynı, beklenti 2 üye) */
if (icerik.suit.includes('loadDB de grup isteğini korur", !!loadYuklenen && !!loadYuklenen.istekler.find(r => r.id === gi.id && JSON.stringify(r.ogrenciIds) === JSON.stringify([zeynep.id, emir.id])))')) {
  console.log("  ✓ D loadDB ogrenciIds beklentisi: zaten uygulanmış (2 üye beklentisi mevcut)");
} else {
  part("suit", "YAMASI-v5 (D-load)",
  't("loadDB de grup isteğini korur", !!loadYuklenen && !!loadYuklenen.istekler.find(r => r.id === gi.id && JSON.stringify(r.ogrenciIds) === JSON.stringify([zeynep.id, emir.id, yeniUye.id])));',
  't("loadDB de grup isteğini korur (2 üye — planlama ek üyeyi isteğe yazmaz)", !!loadYuklenen && !!loadYuklenen.istekler.find(r => r.id === gi.id && JSON.stringify(r.ogrenciIds) === JSON.stringify([zeynep.id, emir.id])));',
  "D loadDB ogrenciIds beklentisi");
}

/* ---- D2) süit 7): toggle → açık-panel çizimi (assertion'lar aynen) ---- */
part("suit", "YAMASI-v5 (D2)",
`grupPanelToggle();
t("panelde ana 'Ana' etiketi + emir seçili işaretli"`,
`grupPanelCiz(); /* YAMASI-v5 (D2): formaAktar grup istekte paneli AÇIK açar; toggle KAPATIRDI — açık panelin govde markup'ı çizilir (assertion aynen) */
t("panelde ana 'Ana' etiketi + emir seçili işaretli"`,
"D2 süit 7 açık-panel çizimi");

/* D2b) grupPanelCiz süit EXPORTS'unda + destructuring'de olmalı (D2 açık-panel çizimi bunu çağırır) */
if (icerik.suit.includes("renderFormDestek, grupPanelCiz, grupPanelSec")) {
  console.log("  ✓ D2b süit EXPORTS + grupPanelCiz: zaten uygulanmış");
} else {
  const _d2bEski = "istekGrupOzetHTML, renderHavuz, renderFormDestek, grupPanelSec,";
  const _d2bYeni = "istekGrupOzetHTML, renderHavuz, renderFormDestek, grupPanelCiz, grupPanelSec,";
  const _n = icerik.suit.split(_d2bEski).length - 1;
  if (_n !== 2) { console.error("ASSERT BAŞARISIZ [D2b]: anchor " + _n + " kez bulundu (beklenen 2: EXPORTS + destructuring) — yazma iptal."); process.exit(1); }
  icerik.suit = icerik.suit.split(_d2bEski).join(_d2bYeni);
  degisti.suit = true;
  console.log("  ✓ D2b süit EXPORTS + grupPanelCiz: uygulandı (2 konum)");
}

/* ---- E) ks-test-render.mjs: günlük tablo seed'i (tarih-bağımsızlık) ---- */
/* Seed dersleri seed haftasının Pazartesi–Cumartesi günlerindedir; test tarihi haftanın herhangi
   bir günü olsa da (Pazar dahil) günSecim her zaman seed haftasının Pazartesi'sine sabitlenir
   → her koşuda aynı 12 sütunlu dolu tablo üretilir. */
if (icerik.render.includes("YAMASI-v5 (E2)")) {
  console.log("  ✓ E render günlük tablo seed'i: zaten uygulanmış (E2)");
} else if (icerik.render.includes("api.ui.gunSecim = api.ui.anchor;")) {
  icerik.render = icerik.render.replace(
    "/* YAMASI-v5 (E): seed dersleri hafta içi günlerinde; ui.anchor hafta başı. gunSecim seed'i ile tablo\n   her test gününde (Pazar dahil) aynı 12 sütunlu markup'ı üretir — tarih-bağımsız regresyon. */\napi.ui.gunSecim = api.ui.anchor;",
    "/* YAMASI-v5 (E2): seed dersleri seed haftasının Pzt–Cmt günlerinde; günSecim seed haftasının\n   Pazartesi'sine sabitlenir → her test gününde (Pazar dahil) aynı dolu tablo. */\nconst _gunSeed = (() => { const d = new Date(api.ui.anchor + \"T12:00:00\"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + \"-\" + String(d.getMonth() + 1).padStart(2, \"0\") + \"-\" + String(d.getDate()).padStart(2, \"0\"); })();\napi.ui.gunSecim = _gunSeed;");
  degisti.render = true;
  console.log("  ✓ E render günlük tablo seed'i: E2'ye yükseltildi");
} else {
  part("render", "YAMASI-v5 (E2)",
    `console.log("3) gunlukTablo günlük tablo:");
const dhtml = gunlukTablo();`,
    `console.log("3) gunlukTablo günlük tablo:");
/* YAMASI-v5 (E2): seed dersleri seed haftasının Pzt–Cmt günlerinde; günSecim seed haftasının\n   Pazartesi'sine sabitlenir → her test gününde (Pazar dahil) aynı dolu tablo. */
const _gunSeed = (() => { const d = new Date(api.ui.anchor + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
api.ui.gunSecim = _gunSeed;
const dhtml = gunlukTablo();`,
    "E render günlük tablo seed'i (E2)");
}

/* ---- F) süit 14): v5 regresyon — grow-only register + kapalı/açık panel ---- */
part("suit", "14) v5 regresyon",
`/* temizlik — test DB'sini seed'e yakın bırak */`,
`/* 14) v5 REGRESYON: grow-only sıra register'ı + kapalı/açık panel davranışı */
console.log("14) v5 regresyon — grow-only register + panel aç/kapat:");
formTemizle();
istekGrupPanelAc();
grupPanelSec(zeynep.id); grupPanelSec(emir.id);
t("ilk seçim sırası register'da [Zeynep, Emir]", JSON.stringify(ui.grupPanelSira) === JSON.stringify([zeynep.id, emir.id]), JSON.stringify(ui.grupPanelSira));
grupPanelSec(zeynep.id);
t("Zeynep kaldırıldı → görünen üyeler [Emir]", JSON.stringify(istekGrupUyeleri()) === JSON.stringify([emir.id]), JSON.stringify(istekGrupUyeleri()));
t("register Zeynep'i SİLMEZ (slot korunur)", JSON.stringify(ui.grupPanelSira) === JSON.stringify([zeynep.id, emir.id]), JSON.stringify(ui.grupPanelSira));
grupPanelSec(zeynep.id);
t("Zeynep eski slotuna döndü → [Zeynep, Emir]", JSON.stringify(istekGrupUyeleri()) === JSON.stringify([zeynep.id, emir.id]), JSON.stringify(istekGrupUyeleri()));
const v5Uye = { id: "gi-v5", ad: "V5 Öğrenci", sinif: "V5 SINIF", tel: "" };
DB.ogrenciler.push(v5Uye);
grupPanelSec(v5Uye.id);
t("yeni öğrenci register SONUNA eklenir", JSON.stringify(ui.grupPanelSira) === JSON.stringify([zeynep.id, emir.id, v5Uye.id]), JSON.stringify(ui.grupPanelSira));
grupPanelSec(v5Uye.id); grupPanelSec(v5Uye.id);
t("çoklu kaldır+yeniden eklemede slot korunur", JSON.stringify(ui.grupPanelSira) === JSON.stringify([zeynep.id, emir.id, v5Uye.id]), JSON.stringify(ui.grupPanelSira));
t("duplicate engeli: her id en fazla 1 kez", new Set(ui.grupPanelSira).size === ui.grupPanelSira.length);
ui.panelSecim.acik = false; grupPanelCiz();
t("kapalı panelde govde GERÇEKTEN BOŞ", (reg["grup-panel-govde"] || { innerHTML: "yok" }).innerHTML === "");
t("kapalı panelde arama/filtre/liste DOM'a yazılmaz", !(reg["grup-panel-govde"] || { innerHTML: "yok" }).innerHTML.includes("grup-panel-arama"));
const siraOnce = JSON.stringify(ui.grupPanelSira);
grupPanelToggle();
const govdeAcik = (reg["grup-panel-govde"] || { innerHTML: "" }).innerHTML;
t("açılınca arama + sınıf filtresi + liste + Ana kurulur", govdeAcik.includes("grup-panel-arama") && govdeAcik.includes("Tüm sınıflar") && govdeAcik.includes("Ana") && govdeAcik.includes("grup-panel-liste"));
grupPanelToggle();
t("kapanınca govde temizlenir", (reg["grup-panel-govde"] || { innerHTML: "yok" }).innerHTML === "");
t("kapanışta register + seçimler korunur", JSON.stringify(ui.grupPanelSira) === siraOnce && istekGrupUyeleri().length === 3);
grupPanelToggle();
t("aç-kapat-aç sonrası govde birebir aynı (sıra+checkbox)", (reg["grup-panel-govde"] || { innerHTML: "" }).innerHTML === govdeAcik);
DB.ogrenciler = DB.ogrenciler.filter(o => o.id !== "gi-v5");
formTemizle();

/* temizlik — test DB'sini seed'e yakın bırak */`,
"F süit 14 v5 regresyon bölümü");

/* ---- global assertion'lar (yazmadan ÖNCE) ---- */
const ASSERTS = [
  ["app.js: v5 işaretleri (A/B2/C)", icerik.app.includes("YAMASI-v5 (A)") && icerik.app.includes("YAMASI-v5 (B2)") && icerik.app.includes("YAMASI-v5 (C)")],
  ["app.js: eski v2/v3 register bloğu kaldırıldı", !icerik.app.includes("YAMASI-v3 (A-düzeltme)")],
  ["app.js: çıkarma kaydı korur + yalnız ilk seçimde kayda girer", icerik.app.includes("/* ÇIKARMA — sıra kaydı KORUNUR */") && icerik.app.includes("if (_kayit.indexOf(oid) === -1) _kayit.push(oid);")],
  ["app.js: grupPanelListeHTML TEK üretici (çift markup yok)", (icerik.app.match(/e\.ana && grupPanelBaglami\(\) !== "havuz" \? " disabled"/g) || []).length === 1],
  ["süit: 13) 2 üye beklentisi + 14) regresyon bölümü", icerik.suit.includes("2 üye — planlama ek üyeyi isteğe yazmaz") && icerik.suit.includes("14) v5 regresyon")],
  ["süit: D2 işareti + assertion aynen (gevşetme yok)", icerik.suit.includes("YAMASI-v5 (D2)") && icerik.suit.includes("panelde ana 'Ana' etiketi + emir seçili işaretli")],
  ["süit: deep-copy snapshot assertion'ları duruyor", icerik.suit.includes("istekte yalnızca 'durum' alanı değişti") && icerik.suit.includes("12) istekOgrenciIds idempotent")],
  ["render: gunSecim seed'i (E2) + mevcut assertion dokunulmadı", icerik.render.includes("api.ui.gunSecim = _gunSeed;") && icerik.render.includes("12 slot sütunu (11 ders + Mola)")],
  ["app.js satır sayısı yalnızca bölgesel değişti (±60)", degisti.app ? Math.abs(icerik.app.split("\n").length - appSatirOnce) <= 60 : true],
];
let hata = 0;
for (const [ad, ok] of ASSERTS) { console.log((ok ? "  ✓ " : "  ✗ ") + ad); if (!ok) hata = 1; }
if (hata) { console.error("ASSERT BAŞARISIZ — hiçbir dosya YAZILMADI."); process.exit(1); }

if (degisti.app) { copyFileSync(files.app, files.app + ".v5-oncesi.bak"); writeFileSync(files.app, icerik.app); }
if (degisti.suit) writeFileSync(files.suit, icerik.suit);
if (degisti.render) writeFileSync(files.render, icerik.render);
console.log(degisti.app || degisti.suit || degisti.render
  ? "Yama tamam → " + Object.keys(degisti).map(k => files[k]).join(", ")
  : "Tüm parçalar zaten uygulanmış — hiçbir dosya değiştirilmedi.");
