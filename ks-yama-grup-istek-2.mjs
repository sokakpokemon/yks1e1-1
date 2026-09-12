/* ks-yama-grup-istek-2.mjs — GRUP İSTEK yaması v2 (tek seferlik, assert'li, hedefli)
   ks-grup-istegi.mjs koşusundaki 6 kırmızı testin KÖK NEDENLERİ (test gevşetme YOK):
   A) grupPanelSec havuz dalı: çıkarma→yeniden ekleme tıklama SIRASINI bozuyor (ana↔ek dönüştürme)
      → sıralı üye dizisi (ui.grupPanelSira); ilk seçilen ana, ana çıkarsa sıradaki ana.
   B) grupPanelCiz kapalıyken govde innerHTML'i BOŞALTILIYOR → kapatma sonrası "Ana/checked" assert'i boş buluyor
      → kapalıyken markup KORUNUR (yalnızca hidden).
   C) normalize() grup isteği ogrenciIds'ini deep-equal bozuyor (aynı üye sırayla zaten temizken yeniden yazıyor)
      → kayıpsızlık guard: temizlik fark yaratmıyorsa DOKUNMA.
   D) panel gövde markup'ı tek kaynağa alındı (grupPanelGovdeHTML) — açık/kapalı aynı markup'ı üretir.
   E) grupPanelOzetCiz havuz bağlamında grupPanelAnaDegisti'nin PLAN tarafı yan etkisini çağırıyordu
      (ek listeye kopya yazıyordu, toggle yönünü bozuyordu) → havuzda yalnız okuma.
   SÜİT) saveDB() localStorage'a JSON STRING yazar; süit deep-copy için yeniden stringify ediyordu → çökme.
   Her değişiklik TAM 1 kez eşleşmeli; aksi hâlde İPTAL + HİÇBİR şey yazılmaz. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const MARK = "ISTEK-GRUP-ISTEGI-YAMASI-v2";
let hata = 0;

function yamala(dosya, yedek, islem) {
  let kod = readFileSync(dosya, "utf8");
  if (kod.includes(MARK)) { console.log(dosya + ": zaten uygulanmış — çıkılıyor (idempotent)."); process.exit(2); }
  copyFileSync(dosya, yedek);
  islem((ad, eski, yeni) => {
    const n = kod.split(eski).length - 1;
    if (n !== 1) { console.error("✗ " + ad + ": " + n + " eşleşme (1 bekleniyor) — yama İPTAL"); hata = 1; return; }
    kod = kod.replace(eski, yeni);
    console.log("✓ " + dosya + " :: " + ad);
  }, kod => { kod = kod; });
  if (hata) { console.error("HİÇBİR değişiklik YAZILMADI."); process.exit(1); }
  writeFileSync(dosya, kod);
  console.log("Yama uygulandı → " + dosya + " (yedek: " + yedek + ")");
}

/* ================= app.js ================= */
yamala("app.js", "app.js.grup-istek-2-oncesi.bak", (uygula) => {

  /* ---------- A: havuz bağlamında SIRALI seçim ---------- */
  uygula(
    "A grupPanelSec havuz sıra",
`  if (grupPanelBaglami() === "havuz") {
    if (!Array.isArray(ui.ekOgrenciIds)) ui.ekOgrenciIds = [];
    if (ui.havuzAnaId === oid) { ui.havuzAnaId = ui.ekOgrenciIds.shift() || null; }
    else {
      var _j = ui.ekOgrenciIds.indexOf(oid);
      if (_j === -1) { if (!ui.havuzAnaId) ui.havuzAnaId = oid; else ui.ekOgrenciIds.push(oid); }
      else ui.ekOgrenciIds.splice(_j, 1);
    }
    grupPanelOzetCiz();
    grupPanelListeCiz();
    return;
  }`,
`  if (grupPanelBaglami() === "havuz") {
    /* ` + MARK + ` (A): tıklama SIRASI korunur (çıkarma→yeniden ekleme sıra atlamaz).
       SIRA, [ana]+ek birleşimiyle uyumsuzsa (harici reset) yeniden türetilir; her id EN FAZLA 1 kez. */
    var _birlesik = [ui.havuzAnaId].concat(Array.isArray(ui.ekOgrenciIds) ? ui.ekOgrenciIds : []).filter(function (v) { return v != null && v !== ""; });
    if (!Array.isArray(ui.grupPanelSira) || JSON.stringify(ui.grupPanelSira) !== JSON.stringify(_birlesik)) ui.grupPanelSira = _birlesik;
    var _k = ui.grupPanelSira.indexOf(oid);
    if (_k === -1) ui.grupPanelSira.push(oid); else ui.grupPanelSira.splice(_k, 1);
    ui.grupPanelSira = ui.grupPanelSira.filter(function (v, i) { return v != null && v !== "" && ui.grupPanelSira.indexOf(v) === i; });
    ui.havuzAnaId = ui.grupPanelSira[0] || null;
    ui.ekOgrenciIds = ui.grupPanelSira.slice(1);
    grupPanelOzetCiz();
    grupPanelListeCiz();
    return;
  }`
  );

  /* ---------- B: kapalıyken markup korunur ---------- */
  uygula(
    "B grupPanelCiz kapalı markup",
`  if (!ui.panelSecim.acik) { govdeEl.classList.add("hidden"); govdeEl.innerHTML = ""; return; }`,
`  /* ` + MARK + ` (B): kapalıyken markup KORUNUR (yalnızca gizlenir) — arama kutusu id'si DOM'da kalır;
     liste her durumda güncel seçimle çizilir */
  if (!ui.panelSecim.acik) { govdeEl.classList.add("hidden"); if (!govdeEl.innerHTML) govdeEl.innerHTML = grupPanelGovdeHTML(); grupPanelListeCiz(); return; }`
  );

  /* ---------- C: normalize kayıpsızlık guard ---------- */
  uygula(
    "C normalize deep-equal guard",
`    var _gAna = r.ogrenciId, _gTemiz = [];
    r.ogrenciIds.forEach(function (v) {
      if (v == null || v === "" || v === _gAna || _gTemiz.indexOf(v) !== -1) return;
      _gTemiz.push(v);
    });
    r.ogrenciIds = _gTemiz;`,
`    var _gAna = r.ogrenciId, _gTemiz = [];
    r.ogrenciIds.forEach(function (v) {
      if (v == null || v === "" || v === _gAna || _gTemiz.indexOf(v) !== -1) return;
      _gTemiz.push(v);
    });
    /* ` + MARK + ` (C): kayıpsızlık — temizlik sırayı/üyeyi değiştirmiyorsa DOKUNMA (yedek→yükleme deep-equal
       korunur); yalnız gerçekten bozuk kayıtlar (kopya/boş/ana-tekrarı) onarılır */
    if (_gTemiz.length !== r.ogrenciIds.length || _gTemiz.some(function (v, i) { return v !== r.ogrenciIds[i]; })) r.ogrenciIds = _gTemiz;`
  );

  /* ---------- D1: gövde markup tek kaynak (grupPanelGovdeHTML) ---------- */
  uygula(
    "D1 grupPanelGovdeHTML ekleyici",
`function istekOgrenciIds(istek) {
  if (!istek || typeof istek !== "object") return [];`,
`/* ` + MARK + ` (D): panel gövde markup'ı TEK kaynaktan — grupPanelCiz kapalıyken de aynı markup'ı üretir
   (kapanınca markup boşaltılmaz; açık dal da bu yardımcıyı kullanır) */
function grupPanelGovdeHTML() {
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  var sinifOps = '<option value="">Tüm sınıflar</option>';
  grupPanelTumSiniflar().forEach(function (s) {
    sinifOps += '<option value="' + esc(s) + '"' + (ui.panelSecim.sinif === s ? " selected" : "") + ">" + esc(s) + "</option>";
  });
  return
    '<div class="flex flex-col sm:flex-row gap-2">' +
      '<div class="relative flex-1">' +
        '<input id="grup-panel-arama" type="text" autocomplete="off" placeholder="Öğrenci ara..." value="' + esc(ui.panelSecim.arama) + '" oninput="grupPanelAra(this.value)" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />' +
        '<i class="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-300"></i>' +
      "</div>" +
      '<select id="grup-panel-sinif" onchange="grupPanelSinifSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/40">' + sinifOps + "</select>" +
    "</div>" +
    '<div id="grup-panel-liste" class="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100"></div>';
}
function istekOgrenciIds(istek) {
  if (!istek || typeof istek !== "object") return [];`
  );

  /* ---------- D2: açık dal aynı yardımcıyı kullanır ---------- */
  uygula(
    "D2 grupPanelCiz açık dal",
`  govdeEl.classList.remove("hidden");
  var sinifOps = '<option value="">Tüm sınıflar</option>';
  grupPanelTumSiniflar().forEach(function (s) {
    sinifOps += '<option value="' + esc(s) + '"' + (ui.panelSecim.sinif === s ? " selected" : "") + ">" + esc(s) + "</option>";
  });
  govdeEl.innerHTML =
    '<div class="flex flex-col sm:flex-row gap-2">' +
      '<div class="relative flex-1">' +
        '<input id="grup-panel-arama" type="text" autocomplete="off" placeholder="Öğrenci ara..." value="' + esc(ui.panelSecim.arama) + '" oninput="grupPanelAra(this.value)" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />' +
        '<i class="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-300"></i>' +
      "</div>" +
      '<select id="grup-panel-sinif" onchange="grupPanelSinifSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/40">' + sinifOps + "</select>" +
    "</div>" +
    '<div id="grup-panel-liste" class="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100"></div>';
  grupPanelListeCiz();`,
`  govdeEl.classList.remove("hidden");
  govdeEl.innerHTML = grupPanelGovdeHTML();
  grupPanelListeCiz();`
  );

  /* ---------- E: havuz bağlamında özet yalnız okuma ---------- */
  uygula(
    "E grupPanelOzetCiz havuz guard",
`  var anaId = grupPanelAnaDegisti();
  var secili = grupPanelSecimler();`,
`  /* ` + MARK + ` (E): havuz bağlamında plan tarafı yan etkisi YOK (ek listeye kopya yazılmaz) */
  var anaId = grupPanelBaglami() === "havuz" ? (ui.havuzAnaId || null) : grupPanelAnaDegisti();
  var secili = grupPanelSecimler();`
  );
});

/* ================= ks-grup-istegi.mjs (süit altyapı düzeltmesi) ================= */
yamala("ks-grup-istegi.mjs", "ks-grup-istegi.onceci.bak", (uygula) => {
  uygula(
    "SÜIT saveDB string saklama uyumu",
`console.log("13) Grup istek yedek/geri yükleme:");
saveDB();
const yedek2 = JSON.parse(JSON.stringify(store["yksOto_arsiv_v1"]));`,
`console.log("13) Grup istek yedek/geri yükleme:");
saveDB();
const _yedekHam = store["yksOto_arsiv_v1"];
const yedek2 = JSON.parse(JSON.stringify(typeof _yedekHam === "string" ? JSON.parse(_yedekHam) : _yedekHam));`
  );
});

console.log("v2 yaması TAMAM.");
