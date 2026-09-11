/* ks-yama-panel-secim.mjs — GRUP PANEL v2 yaması (assert'li, byte-exact)
 * 1) Chip yapısı → checkbox'lı açılır panel (arama + sınıf filtresi + "Tüm sınıflar")
 * 2) Sabit 5 öğrenci sınırı KALDIRILIR; 10+ yalnızca uyarı (engelleme yok)
 * 3) Düzenlemede dersOgrenciIds ile tüm katılımcılar yüklenir, panel açık açılır
 * 4) planla(): ana öğrenci grup listesinden hariç tutulur (kopya yok)
 * Korumalı: ikinci çalıştırmada reddeder. Tüm anchorlar 1 kez bulunmalı, aksi hâlde YAZMAZ.
 */
import { readFileSync, writeFileSync } from "node:fs";

const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };
const assert = (c, m) => { if (!c) fail(m); else console.log("  OK " + m); };
const say = (hay, need) => hay.split(need).length - 1;

/* ================= app.js ================= */
const F = "app.js";
const src0 = readFileSync(F, "utf8");

if (src0.includes("grupPanelToggle")) { console.error("REDDEDILDI: yama zaten uygulanmis gorunuyor."); process.exit(1); }
assert(say(src0, "ekOgrenciEkle") === 2, "app.js: ekOgrenciEkle tam 2 kez geçiyor (tanım + markup)");
assert(say(src0, 'var ekPanel = ') === 1, "app.js: ekPanel bloğu 1 kez");
assert(say(src0, "panelSecim: null") === 1, "app.js: ui.panelSecim alanı mevcut (önceki aşamadan)");
assert(say(src0, "function dersOgrenciIds") === 1, "app.js: dersOgrenciIds mevcut");
assert(say(src0, "EK_OGR_MAX") === 3, "app.js: EK_OGR_MAX beklenen 3 konumda");

/* ---------- YAMA 1: renderFormDestek — panel markup + çizim çağrısı ---------- */
const A1 = `  var ekPanel = '<div id="ek-ogrenciler" class="no-print rounded-2xl border border-slate-100 bg-slate-50/60 p-3 mt-2">' +
`;
const A2 = `  if (sayacEl) sayacEl.textContent = ui.ekOgrenciIds.length + " / " + EK_OGR_MAX;
`;
const iA1 = src0.indexOf(A1);
assert(iA1 !== -1, "Y1: başlangıç anchor bulundu");
const iA2 = src0.indexOf(A2, iA1);
assert(iA2 !== -1 && iA2 > iA1, "Y1: bitiş anchor bulundu");
const YENI_PANEL = `  /* GRUP PANEL v2 — chip yerine: arama + sınıf filtresi + checkbox listesi */
  var ekPanel = '<div id="ek-ogrenciler" class="no-print rounded-2xl border border-slate-100 bg-slate-50/60 p-3 mt-2">' +
    '<div class="flex items-center justify-between gap-2">' +
      '<span class="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide"><i class="fa-solid fa-user-group mr-1"></i>Grup Öğrencileri</span>' +
      '<button type="button" onclick="grupPanelToggle()" class="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors"><i id="grup-panel-ok" class="fa-solid fa-chevron-down text-[9px] transition-transform"></i><span id="grup-panel-ok-yazi">Öğrenci Seç</span></button>' +
    '</div>' +
    '<div id="grup-ozet" class="mt-2"></div>' +
    '<div id="grup-panel-govde" class="hidden mt-2 pt-2 border-t border-slate-200/70"></div>' +
  "</div>";
  /* Paneli yalnızca bir kez ekle (idempotent; stub DOM'larda da güvenli) */
  if (!document.getElementById("ek-ogrenciler")) {
    var fOgrEl = $("f-ogrenci");
    if (fOgrEl && fOgrEl.insertAdjacentHTML) fOgrEl.insertAdjacentHTML("afterend", ekPanel);
  }
  grupPanelCiz();
`;

/* ---------- YAMA 2: ekOgrenciEkle/ekOgrenciSil → panel fonksiyonları ---------- */
const B1 = `function ekOgrenciEkle(ev) {`;
const B2 = `function hizliSec(ad) {`;
const iB1 = src0.indexOf(B1);
assert(iB1 !== -1, "Y2: ekOgrenciEkle bulundu");
const iB2 = src0.indexOf(B2, iB1);
assert(iB2 !== -1 && iB2 > iB1, "Y2: hizliSec bulundu");
const YENI_FN = `/* ---- GRUP PANEL v2: arama + sınıf filtresi + checkbox listesi (sınır yok, 10+ yalnızca uyarı) ---- */
function grupPanelToggle() {
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  ui.panelSecim.acik = !ui.panelSecim.acik;
  grupPanelCiz();
}
function grupPanelSecimler() {
  if (!Array.isArray(ui.ekOgrenciIds)) ui.ekOgrenciIds = [];
  return ui.ekOgrenciIds.filter(function (oid) { return DB.ogrenciler.some(function (x) { return x.id === oid; }); });
}
function grupAnaOgrenciId() {
  var inp = $("f-ogrenci");
  var ad = inp ? inp.value : "";
  if (!ad) return null;
  var o = DB.ogrenciler.find(function (x) { return kucuk(x.ad) === kucuk(ad); });
  return o ? o.id : null;
}
function grupPanelTumSiniflar() {
  var set = [];
  DB.ogrenciler.forEach(function (o) {
    var s = String(o.sinif || "").trim();
    if (s && set.indexOf(s) === -1) set.push(s);
  });
  return set;
}
function grupPanelListe() {
  var ps = ui.panelSecim || { acik: false, arama: "", sinif: "" };
  var q = kucuk(ps.arama);
  var secili = grupPanelSecimler();
  var anaId = grupAnaOgrenciId();
  return DB.ogrenciler.filter(function (o) {
    if (q && kucuk(o.ad).indexOf(q) === -1) return false;
    if (ps.sinif && String(o.sinif || "").trim() !== ps.sinif) return false;
    return true;
  }).map(function (o) {
    return { o: o, secili: secili.indexOf(o.id) !== -1, ana: o.id === anaId };
  });
}
/* Ana öğrenci değiştiğinde eski ana katılımcı olarak kalır (kopya oluşmaz; kayıtta ana ogrenciIds dışında tutulur) */
function grupPanelAnaDegisti() {
  var ana = grupAnaOgrenciId();
  var eski = ui.panelSecim ? ui.panelSecim.anaId : null;
  if (eski && eski !== ana && DB.ogrenciler.some(function (x) { return x.id === eski; })) {
    if (!Array.isArray(ui.ekOgrenciIds)) ui.ekOgrenciIds = [];
    if (ui.ekOgrenciIds.indexOf(eski) === -1) ui.ekOgrenciIds.push(eski);
  }
  if (ui.panelSecim) ui.panelSecim.anaId = ana;
  return ana;
}
function grupPanelSec(oid) {
  if (!oid) return;
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  var ana = grupPanelAnaDegisti();
  if (!Array.isArray(ui.ekOgrenciIds)) ui.ekOgrenciIds = [];
  var i = ui.ekOgrenciIds.indexOf(oid);
  if (i === -1) {
    if (ana && oid === ana) return; /* ana öğrenci iki kez seçilemez */
    ui.ekOgrenciIds.push(oid); /* sabit sınır yok — 10+ yalnızca uyarı */
  } else {
    ui.ekOgrenciIds.splice(i, 1);
  }
  grupPanelOzetCiz();
  grupPanelListeCiz();
}
function grupPanelAra(v) {
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  ui.panelSecim.arama = v;
  grupPanelListeCiz();
}
function grupPanelSinifSec(v) {
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  ui.panelSecim.sinif = v;
  grupPanelListeCiz();
}
function grupPanelOzetCiz() {
  var ozetEl = $("grup-ozet");
  if (!ozetEl) return;
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  var anaId = grupPanelAnaDegisti();
  var secili = grupPanelSecimler();
  var katilimcilar = anaId ? [anaId] : [];
  secili.forEach(function (oid) { if (katilimcilar.indexOf(oid) === -1) katilimcilar.push(oid); });
  var toplam = katilimcilar.length;
  var chipler = secili.filter(function (oid) { return oid !== anaId; }).map(function (oid) {
    var o = DB.ogrenciler.find(function (x) { return x.id === oid; });
    return '<span class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 pl-2.5 pr-1.5 py-1 text-[11.5px] font-bold text-teal-700">' + esc(o ? o.ad : "?") +
      '<button type="button" onclick="grupPanelSec(\\'' + esc(oid) + '\\')" title="Çıkar" class="w-4 h-4 -mr-0.5 rounded-full hover:bg-teal-200 text-teal-600 flex items-center justify-center"><i class="fa-solid fa-xmark text-[9px]"></i></button></span>';
  }).join("");
  var ic;
  if (!toplam) {
    ic = '<span class="text-[11.5px] text-slate-400 italic">Grup dersi için öğrenci seçin (sınır yok)</span>';
  } else {
    ic = '<span class="text-[12px] font-bold text-slate-600"><i class="fa-solid fa-circle-check text-teal-500 mr-1"></i>' + toplam + " öğrenci seçildi</span>" +
      (chipler ? '<span id="grup-ozet-chips" class="flex flex-wrap items-center gap-1.5 mt-1.5">' + chipler + "</span>" : "");
  }
  if (toplam >= 10) {
    ic += '<div id="grup-panel-uyari" class="mt-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-[11.5px] font-semibold text-amber-700"><i class="fa-solid fa-triangle-exclamation mr-1"></i>' + toplam + ' öğrenci seçildi — geniş grup: kaydetmeden önce kontrol edin</div>';
  }
  ozetEl.innerHTML = ic;
}
function grupPanelListeCiz() {
  var listeEl = $("grup-panel-liste");
  if (!listeEl || !ui.panelSecim || !ui.panelSecim.acik) return;
  var liste = grupPanelListe();
  if (!liste.length) { listeEl.innerHTML = '<div class="px-3 py-3 text-[11.5px] text-slate-300 italic">Bu filtreye uyan öğrenci yok</div>'; return; }
  listeEl.innerHTML = liste.map(function (e) {
    var kutu = '<input type="checkbox"' + (e.secili || e.ana ? " checked" : "") + (e.ana ? " disabled" : "") +
      ' onchange="grupPanelSec(\\'' + esc(e.o.id) + '\\')" class="w-4 h-4 rounded border-slate-300 accent-teal-600 cursor-pointer' + (e.ana ? " opacity-50 cursor-not-allowed" : "") + '" />';
    var anaTag = e.ana ? '<span class="text-[10px] font-extrabold text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 ml-auto">Ana</span>' : "";
    var sinifTag = e.o.sinif ? '<span class="text-[10px] font-bold text-slate-300 ' + (e.ana ? "" : "ml-auto") + ' shrink-0">' + esc(e.o.sinif) + "</span>" : "";
    return '<label class="flex items-center gap-3 px-3 py-2 hover:bg-teal-50/50 cursor-pointer' + (e.ana ? " bg-slate-50/80" : "") + '">' + kutu +
      '<span class="text-[13px] font-semibold text-slate-700">' + esc(e.o.ad) + "</span>" + anaTag + sinifTag + "</label>";
  }).join("");
}
function grupPanelCiz() {
  var govdeEl = $("grup-panel-govde");
  if (!govdeEl) return;
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  grupPanelOzetCiz();
  var okEl = $("grup-panel-ok"), okYazi = $("grup-panel-ok-yazi");
  if (okEl) okEl.className = "fa-solid fa-chevron-" + (ui.panelSecim.acik ? "up" : "down") + " text-[9px] transition-transform";
  if (okYazi) okYazi.textContent = ui.panelSecim.acik ? "Kapat" : "Öğrenci Seç";
  if (!ui.panelSecim.acik) { govdeEl.classList.add("hidden"); govdeEl.innerHTML = ""; return; }
  govdeEl.classList.remove("hidden");
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
  grupPanelListeCiz();
}
`;

/* ---------- YAMA 3: temizleForm — panel durumu da sıfırlansın ---------- */
const C1 = `  if (ui.ekOgrenciIds && ui.ekOgrenciIds.length) { ui.ekOgrenciIds = []; renderFormDestek(); }`;
const YENI_C1 = `  var panelKirli = ui.panelSecim && (ui.panelSecim.acik || ui.panelSecim.arama || ui.panelSecim.sinif);
  if ((ui.ekOgrenciIds && ui.ekOgrenciIds.length) || panelKirli) {
    ui.ekOgrenciIds = [];
    ui.panelSecim = { acik: false, arama: "", sinif: "" };
    renderFormDestek();
  }`;

/* ---------- YAMA 4: planla — ana öğrenci grup listesinden hariç ---------- */
const D1 = `  var t = DB.ogretmenler.find(function (x) { return kucuk(x.ad) === kucuk(ogretmenAd); });`;
assert(say(src0, D1) === 1, "Y4: planla anchor tam 1 kez");
const YENI_D1 = `  /* GRUP PANEL: ana öğrenci grup listesinde iki kez olamaz (ana değişse bile) */
  grupOgrenciIds = grupOgrenciIds.filter(function (oid) { return oid !== o.id; });
  grupModu = grupOgrenciIds.length >= 2;
` + D1;

/* ---------- YAMA 5: duzenle — tüm katılımcılar + panel açık ---------- */
const E1 = `  ui.ekOgrenciIds = Array.isArray(l.ogrenciIds) ? l.ogrenciIds.filter(function (oid) { return oid && oid !== l.ogrenciId; }) : [];`;
assert(say(src0, E1) === 1, "Y5: duzenle ekOgrenciIds satırı tam 1 kez");
const YENI_E1 = `  ui.ekOgrenciIds = dersOgrenciIds(l).filter(function (oid) { return oid && oid !== l.ogrenciId; });
  ui.panelSecim = { acik: true, arama: "", sinif: "", anaId: l.ogrenciId || null }; /* GRUP PANEL: düzenlemede panel seçili öğrencilerle açık açılır */`;

const F1 = `  $("cakismaUyari").classList.add("hidden");
  duzenleBannerGuncelle();
  $("planKart").scrollIntoView({ behavior: "smooth", block: "start" });`;
assert(say(src0, F1) === 1, "Y6: duzenle kuyruk bloğu tam 1 kez");
const YENI_F1 = `  $("cakismaUyari").classList.add("hidden");
  renderFormDestek();
  duzenleBannerGuncelle();
  $("planKart").scrollIntoView({ behavior: "smooth", block: "start" });`;

/* ---------- UYGULA ---------- */
let out = "";
out += src0.slice(0, iA1) + YENI_PANEL + src0.slice(iA2 + A2.length);
{
  const j1 = out.indexOf(B1);
  assert(j1 !== -1, "Y2 uygulama: ekOgrenciEkle hâlâ mevcut");
  const j2 = out.indexOf(B2, j1);
  assert(j2 !== -1, "Y2 uygulama: hizliSec hâlâ mevcut");
  out = out.slice(0, j1) + YENI_FN + "\n" + out.slice(j2);
}
{
  assert(say(out, C1) === 1, "Y3 uygulama: temizleForm satırı tam 1 kez");
  out = out.replace(C1, YENI_C1);
}
{
  assert(say(out, D1) === 1, "Y4 uygulama: planla anchor tam 1 kez");
  out = out.replace(D1, YENI_D1);
}
{
  assert(say(out, E1) === 1, "Y5 uygulama: duzenle satırı tam 1 kez");
  out = out.replace(E1, YENI_E1);
}
{
  assert(say(out, F1) === 1, "Y6 uygulama: duzenle kuyruk tam 1 kez");
  out = out.replace(F1, YENI_F1);
}
assert(out.includes("grupPanelToggle") && !out.includes("EK_OGR_MAX"), "sonuç: yeni fonksiyonlar var, EK_OGR_MAX yok");
assert(!out.includes("ek-ogrenci-chips") && !out.includes("ek-ogrenci-arama") && !out.includes("ek-ogrenci-sayac"), "sonuç: eski chip id'leri tamamen kaldırıldı");
assert(say(out, "grupOgrenciIds.length >= 2") === 2, "sonuç: grupModu hesabı 2 kez (ilk + ana hariç sonrası)");
writeFileSync(F, out);
console.log("app.js yamalandı.");

/* ================= test.mjs: yeni suite ================= */
const TF = "test.mjs";
let tsrc = readFileSync(TF, "utf8");
const T1 = `const suites = ["ks-harness.mjs", "ks-test-render.mjs", "ks-durum-fn.mjs", "ks-grup-uyum.mjs"];`;
const T2 = `const suites = ["ks-harness.mjs", "ks-test-render.mjs", "ks-durum-fn.mjs", "ks-grup-uyum.mjs", "ks-panel-secim.mjs"];`;
assert(say(tsrc, T1) === 1, "test.mjs: suites satırı tam 1 kez");
writeFileSync(TF, tsrc.replace(T1, T2));
console.log("test.mjs güncellendi.");

/* ================= ks-grup-uyum.mjs: chip id'leri → panel id'leri ================= */
const GF = "ks-grup-uyum.mjs";
let gsrc = readFileSync(GF, "utf8");
const g1 = `  t("ilk boot'ta #ek-ogrenci-chips de DOM'da (null değil)", !!reg["ek-ogrenci-chips"]);`;
const g2 = `  t("chip alanı boşken ipucu metni dolu", (reg["ek-ogrenci-chips"] || { innerHTML: "" }).innerHTML.includes("Grup dersi"));`;
const g3 = `  t("sayaç 0 / 5 gösterir", (reg["ek-ogrenci-sayac"] || { textContent: "" }).textContent === "0 / 5");`;
assert(say(gsrc, g1) === 1 && say(gsrc, g2) === 1 && say(gsrc, g3) === 1, "ks-grup-uyum.mjs: 3 chip satırı tam 1'er kez");
gsrc = gsrc
  .replace(g1, `  t("ilk boot'ta #grup-ozet de DOM'da (null değil)", !!reg["grup-ozet"]);`)
  .replace(g2, `  t("özet boşken ipucu metni dolu", (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("Grup dersi"));`)
  .replace(g3, `  t("5 kişilik sabit sınır kaldırıldı (sayaç id yok, 'sınır yok' ipucu var)", !reg["ek-ogrenci-sayac"] && (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("sınır yok"));`);
writeFileSync(GF, gsrc);
console.log("ks-grup-uyum.mjs güncellendi.");
console.log("YAMA TAMAM ✔");
