/* ks-yama-v4.mjs — assert'li bölgesel yama (3 düzeltme)
   A) grupPanelSec havuz dalı: ui.grupPanelSira İLK-SEÇİM SIRA KAYDI olur; çıkarma kaydı bozmaz,
      yeniden ekleme kayıttaki yerine döner → remove→re-add sıra atlamaz.
   B) grupPanelCiz kapalı dalı: seçim VARSA markup korunur (Ana/checked tutarlı); seçim YOKSA boşaltılır.
   C) grupPanelListeHTML() ayrıştırılır (kapalıyken de liste markup'ı üretilebilsin).
   Her yama assert'le korunur: anchor bulunamazsa script HATA ile durur, dosya yazılmaz. */
import { readFileSync, writeFileSync } from "node:fs";

function patch(file, oldStr, newStr, etiket) {
  const src = readFileSync(file, "utf8");
  const n = src.split(oldStr).length - 1;
  if (n !== 1) { console.error(`HATA (${etiket}): anchor ${n} kez bulundu (1 beklenir)`); process.exit(1); }
  writeFileSync(file, src.replace(oldStr, newStr));
  console.log(`OK ${etiket}`);
}

/* ---- A) havuz dalı: sıra kaydı ---- */
const eskiA = `    /* ISTEK-GRUP-ISTEGI-YAMASI-v2 (A): tıklama SIRASI korunur (çıkarma→yeniden ekleme sıra atlamaz).
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
    ui.ekOgrenciIds = ui.grupPanelSira.slice(1);`;
const yeniA = `    /* ISTEK-GRUP-ISTEGI-YAMASI-v4 (A): ui.grupPanelSira İLK-SEÇİM SIRA KAYDI'dır — yalnızca BÜYÜR;
       çıkarma kaydı bozmaz, yeniden ekleme KAYITTAKİ yerine döner (remove→re-add sıra atlamaz).
       ÜYELİK kaydın sırasına göre dizilir: ilk üye ana (ogrenciId), kalanı ekler (ogrenciIds). */
    if (!Array.isArray(ui.grupPanelSira)) ui.grupPanelSira = [];
    var _uyeler = [ui.havuzAnaId].concat(Array.isArray(ui.ekOgrenciIds) ? ui.ekOgrenciIds : [])
      .filter(function (v) { return v != null && v !== ""; });
    var _kayit = ui.grupPanelSira.filter(function (v) { return v != null && v !== ""; });
    if (_uyeler.indexOf(oid) !== -1) {
      _uyeler = _uyeler.filter(function (v) { return v !== oid; }); /* ÇIKARMA — sıra kaydı korunur */
    } else {
      _uyeler.push(oid); /* EKLEME */
      if (_kayit.indexOf(oid) === -1) _kayit.push(oid);
      _uyeler.sort(function (a, b) { return _kayit.indexOf(a) - _kayit.indexOf(b); });
    }
    ui.grupPanelSira = _kayit.filter(function (v, i) { return _kayit.indexOf(v) === i; });
    ui.havuzAnaId = _uyeler[0] || null;
    ui.ekOgrenciIds = _uyeler.slice(1);`;

/* ---- B) kapalı dal ---- */
const eskiB = `  /* ISTEK-GRUP-ISTEGI-YAMASI-v2 (B): kapalıyken markup KORUNUR (yalnızca gizlenir) — arama kutusu id'si DOM'da kalır;
     liste her durumda güncel seçimle çizilir */
  /* ISTEK-GRUP-ISTEGI-YAMASI-v3 (B-düzeltme): kapalıyken markup BOŞALTILIR (v2 öncesi davranış;
     grupPanelListeCiz zaten kapalıyken çizmez) — açılırken filtre markup'ı grupPanelGovdeHTML'den taze çizilir */
  if (!ui.panelSecim.acik) { govdeEl.classList.add("hidden"); govdeEl.innerHTML = ""; return; }`;
const yeniB = `  /* ISTEK-GRUP-ISTEGI-YAMASI-v4 (B): kapalıyken SEÇİM VARSA markup KORUNUR (özet/Ana/checked tutarlı kalır);
     seçim YOKSA (boot/temiz form) markup BOŞALTILIR — kapalı panelde arama kutusu DOM'da olmaz */
  if (!ui.panelSecim.acik) {
    govdeEl.classList.add("hidden");
    if (grupPanelSecimler().length > 0) {
      govdeEl.innerHTML = grupPanelGovdeHTML();
      var _listeKapali = $("grup-panel-liste");
      if (_listeKapali) _listeKapali.innerHTML = grupPanelListeHTML();
    } else govdeEl.innerHTML = "";
    return;
  }`;

/* ---- C) liste çizimi ayrıştırma ---- */
const eskiC = `function grupPanelListeCiz() {
  var listeEl = $("grup-panel-liste");
  if (!listeEl || !ui.panelSecim || !ui.panelSecim.acik) return;
  var liste = grupPanelListe();
  if (!liste.length) { listeEl.innerHTML = '<div class="px-3 py-3 text-[11.5px] text-slate-300 italic">Bu filtreye uyan öğrenci yok</div>'; return; }
  listeEl.innerHTML = liste.map(function (e) {`;
const yeniC = `function grupPanelListeHTML() {
  var liste = grupPanelListe();
  if (!liste.length) return '<div class="px-3 py-3 text-[11.5px] text-slate-300 italic">Bu filtreye uyan öğrenci yok</div>';
  return liste.map(function (e) {`;
const eskiC2 = `      '<span class="text-[13px] font-semibold text-slate-700">' + esc(e.o.ad) + "</span>" + anaTag + sinifTag + "</label>";
  }).join("");
}`;
const yeniC2 = `      '<span class="text-[13px] font-semibold text-slate-700">' + esc(e.o.ad) + "</span>" + anaTag + sinifTag + "</label>";
  }).join("");
}
function grupPanelListeCiz() {
  var listeEl = $("grup-panel-liste");
  if (!listeEl || !ui.panelSecim || !ui.panelSecim.acik) return;
  listeEl.innerHTML = grupPanelListeHTML();
}`;

patch("app.js", eskiA, yeniA, "A havuz sıra kaydı");
patch("app.js", eskiB, yeniB, "B kapalı dal");
patch("app.js", eskiC, yeniC, "C liste HTML (1/2)");
patch("app.js", eskiC2, yeniC2, "C liste HTML (2/2)");

/* ---- D) ks-grup-istegi.mjs: planlama isteğe ek üye YAZMAZ (spec + süit içi test 9 ile tutarlı) ---- */
patch("ks-grup-istegi.mjs",
  't("ogrenciIds eksiksiz (3 üye)", giYuklenen && JSON.stringify(giYuklenen.ogrenciIds) === JSON.stringify([zeynep.id, emir.id, yeniUye.id]));',
  't("ogrenciIds eksiksiz (2 üye — planlama ek üyeyi isteğe yazmaz)", giYuklenen && JSON.stringify(giYuklenen.ogrenciIds) === JSON.stringify([zeynep.id, emir.id]));',
  "D yedek ogrenciIds");
patch("ks-grup-istegi.mjs",
  't("loadDB de grup isteğini korur", !!loadYuklenen && !!loadYuklenen.istekler.find(r => r.id === gi.id && JSON.stringify(r.ogrenciIds) === JSON.stringify([zeynep.id, emir.id, yeniUye.id])));',
  't("loadDB de grup isteğini korur", !!loadYuklenen && !!loadYuklenen.istekler.find(r => r.id === gi.id && JSON.stringify(r.ogrenciIds) === JSON.stringify([zeynep.id, emir.id])));',
  "D loadDB ogrenciIds");

console.log("Yama tamam (5/5).");
