/* ks-yama-grup-istegi.mjs — GRUP İSTEK yaması (idempotent, assert'li, hedefli)
   Her yama: eski metin TAM 1 kez bulunmalı; aksi hâlde çıkar ve HİÇBİR şey yazmaz. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const KAYNAK = "const-KAYNAK";
const HEDEF = "app.js";
const MARK = "ISTEK-GRUP-ISTEGI-YAMASI v1";
const YEDEK = "app.js.grup-istegi-oncesi.bak";

let kod = readFileSync(HEDEF, "utf8");
if (kod.includes(MARK)) {
  console.log("Zaten uygulanmış — 2. koşu reddedildi (idempotent).");
  process.exit(2);
}
copyFileSync(HEDEF, YEDEK);

let hata = 0;
function uygula(ad, eski, yeni) {
  const n = kod.split(eski).length - 1;
  if (n !== 1) { console.error("✗ " + ad + ": " + n + " eşleşme (1 bekleniyor) — yama İPTAL"); hata = 1; return; }
  kod = kod.replace(eski, yeni);
  console.log("✓ " + ad);
}

/* ---------- P1: normalize → isteklerdeki ogrenciIds uyumu (eski tekli kayda dokunma) ---------- */
uygula(
  "P1 normalize istek uyumu",
`  d.sinifProg = d.sinifProg && typeof d.sinifProg === "object" ? d.sinifProg : {};`,
`  d.sinifProg = d.sinifProg && typeof d.sinifProg === "object" ? d.sinifProg : {};
  /* GRUP İSTEK uyumluluğu: isteklerdeki ogrenciIds benzersiz/geçerli/ana-haricî normalize edilir.
     Eski tekli isteklere (ogrenciIds alanı yok) DOKUNULMAZ — alan eklenmez, yapı bozulmaz. */
  if (Array.isArray(d.istekler)) d.istekler.forEach(function (r) {
    if (!r || typeof r !== "object") return;
    if (!Array.isArray(r.ogrenciIds)) { if (r.ogrenciIds != null) delete r.ogrenciIds; return; }
    var _gAna = r.ogrenciId, _gTemiz = [];
    r.ogrenciIds.forEach(function (v) {
      if (v == null || v === "" || v === _gAna || _gTemiz.indexOf(v) !== -1) return;
      _gTemiz.push(v);
    });
    r.ogrenciIds = _gTemiz;
  });`
);

/* ---------- P2: istekOgrenciIds + havuz grup isteği yardımcıları (grupUyeSatirlari sonrası) ---------- */
uygula(
  "P2 istekOgrenciIds + havuz yardımcıları",
`function grupUyeSatirlari(ders) {
  /* WhatsApp / PNG düz metin: tüm grup üyeleri, ana öğrenci ilk sırada */
  return grupOgrenciAdlari(ders);
}`,
`function grupUyeSatirlari(ders) {
  /* WhatsApp / PNG düz metin: tüm grup üyeleri, ana öğrenci ilk sırada */
  return grupOgrenciAdlari(ders);
}

/* ---------- Grup İSTEK uyumluluk katmanı ---------- /* ${MARK} */
/* İdempotent okuma yardımcısı: istek kaydına ASLA yazmaz.
   - [istek.ogrenciId, ...(istek.ogrenciIds || [])] → benzersiz, boş olmayan, sırasını koruyan üye listesi
   - eski tekli istek (ogrenciIds yok) → [ogrenciId] — hata vermez
   - hatalı/boş kayıt → [] */
function istekOgrenciIds(istek) {
  if (!istek || typeof istek !== "object") return [];
  var _tum = [istek.ogrenciId].concat(Array.isArray(istek.ogrenciIds) ? istek.ogrenciIds : []);
  return _tum.filter(function (v, i) { return v != null && v !== "" && _tum.indexOf(v) === i; });
}
/* GRUP İSTEK: havuz tarafındaki ortak grup isteği yardımcıları — panel TEK kopyadır, bağlamla yeniden kullanılır */
function grupPanelBaglami() { return ui.grupPanelBaglam === "havuz" ? "havuz" : "plan"; }
function istekGrupUyeleri() {
  var _tum = [grupAnaOgrenciId()].concat(Array.isArray(ui.ekOgrenciIds) ? ui.ekOgrenciIds : []);
  return _tum.filter(function (v, i) {
    return v != null && v !== "" && _tum.indexOf(v) === i &&
      DB.ogrenciler.some(function (x) { return x.id === v; });
  });
}
function istekGrupPanelAc() {
  ui.grupPanelBaglam = "havuz";
  ui.ekOgrenciIds = [];
  ui.havuzAnaId = null;
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  ui.panelSecim.acik = true; ui.panelSecim.arama = ""; ui.panelSecim.sinif = ""; ui.panelSecim.anaId = null;
  renderHavuz();
  renderFormDestek();
  grupPanelCiz();
}
function istekGrupSifirla() {
  ui.grupPanelBaglam = "plan";
  ui.ekOgrenciIds = [];
  ui.havuzAnaId = null;
  if (ui.panelSecim) { ui.panelSecim.acik = false; ui.panelSecim.arama = ""; ui.panelSecim.sinif = ""; ui.panelSecim.anaId = null; }
}
function istekGrupIptal() { istekGrupSifirla(); renderHavuz(); renderFormDestek(); toast("Ortak grup isteği iptal edildi."); }
function istekGrupEkle() {
  if (grupPanelBaglami() !== "havuz") return;
  var uyeler = istekGrupUyeleri();
  if (uyeler.length < 2) { toast("Ortak grup isteği için en az 2 öğrenci seçin.", "hata"); return; }
  var dersId = $("h-ders") ? $("h-ders").value : "";
  if (!dersId) { toast("Ders seçin.", "hata"); return; }
  var konu = $("h-konu") ? $("h-konu").value.trim() : "";
  var anaId = uyeler[0], ekler = uyeler.slice(1);
  var anaO = DB.ogrenciler.find(function (x) { return x.id === anaId; });
  DB.istekler.push({ id: uid(), ogrenciId: anaId, ogrenciIds: ekler, ogrenciAd: anaO ? anaO.ad : "", dersId: dersId, konu: konu, durum: "bekliyor", olusturma: todayKey() });
  /* 10+ seçim engellenmez — yalnızca uyarı */
  if (uyeler.length >= 10) toast(uyeler.length + " öğrencilik geniş grup isteği kaydedildi — kontrol edin.", "uyari");
  else toast("Ortak grup isteği havuza eklendi ✓ (" + uyeler.length + " öğrenci)");
  istekGrupSifirla();
  renderHavuz();
  renderFormDestek();
}
function istekGrupOzetHTML() {
  if (grupPanelBaglami() !== "havuz") return "";
  var uyeler = istekGrupUyeleri();
  var chipler = uyeler.map(function (oid, i) {
    var o = DB.ogrenciler.find(function (x) { return x.id === oid; });
    return '<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold ' + (i === 0 ? "bg-slate-800 text-white" : "bg-teal-50 border border-teal-200 text-teal-700") + '">' + esc(o ? o.ad : "?") + (i === 0 ? ' <span class="opacity-70 font-extrabold">(Ana)</span>' : "") + "</span>";
  }).join("");
  var uyari = uyeler.length >= 10 ? '<span class="rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-[10.5px] font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Geniş grup</span>' : "";
  return '<div id="istek-grup-ozet" class="flex flex-wrap items-center gap-2 mb-3 rounded-2xl border border-teal-100 bg-teal-50/50 px-3.5 py-2.5">' +
    '<span class="text-[12px] font-extrabold text-teal-700"><i class="fa-solid fa-user-group mr-1.5"></i>Ortak Grup İsteği · ' + uyeler.length + " öğrenci seçildi</span>" + chipler + uyari +
    '<span class="ml-auto flex items-center gap-2">' +
      '<button onclick="istekGrupEkle()" class="rounded-full bg-teal-500 hover:bg-teal-600 text-white text-[11.5px] font-bold px-3.5 py-1.5 shadow-sm transition-colors"><i class="fa-solid fa-check mr-1"></i>Grup İsteğini Kaydet</button>' +
      '<button onclick="istekGrupIptal()" class="rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 text-[11.5px] font-bold px-3 py-1.5 transition-colors">Vazgeç</button>' +
    "</span></div>";
}
/* GRUP İSTEK: paneli aktif bağlamın formuna taşır — GERÇEK DOM'da düğüm taşınır (id çoğaltılmaz);
   stub DOM'da insertAdjacentElement yokken işlem yapılmaz (idempotent, çoğaltma yok) */
function grupPanelYerlestir() {
  var panel = document.getElementById("ek-ogrenciler");
  if (!panel) return;
  var hedef = $(grupPanelBaglami() === "havuz" ? "h-ogrenci" : "f-ogrenci");
  if (!hedef || !hedef.insertAdjacentElement) return;
  if (panel.previousElementSibling === hedef) return;
  hedef.insertAdjacentElement("afterend", panel);
}`
);

/* ---------- P3: ui state — bağlam + havuz ana öğrencisi ---------- */
uygula(
  "P3 ui state",
`  panelSecim: null /* GRUP PANEL: { acik, arama, sinif } */,`,
`  panelSecim: null /* GRUP PANEL: { acik, arama, sinif } */,
  grupPanelBaglam: "plan" /* GRUP İSTEK: panelin aktif form bağlamı ("plan" | "havuz") */,
  havuzAnaId: null /* GRUP İSTEK: havuz bağlamında İLK seçilen öğrenci (ana/sahip) */,`
);

/* ---------- P4: havuza "Ortak Grup İsteği" butonu ---------- */
uygula(
  "P4 havuz grup butonu",
`        '<button onclick="istekEkle()" class="rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 text-[13px] font-bold px-4 py-2 transition-colors"><i class="fa-solid fa-plus mr-1.5"></i>İsteği Havuza Ekle</button>' +`,
`        '<button onclick="istekEkle()" class="rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 text-[13px] font-bold px-4 py-2 transition-colors"><i class="fa-solid fa-plus mr-1.5"></i>İsteği Havuza Ekle</button>' +
        '<button onclick="istekGrupPanelAc()" class="rounded-full border-2 border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 text-[13px] font-bold px-4 py-2 transition-colors"><i class="fa-solid fa-user-group mr-1.5"></i>Ortak Grup İsteği</button>' +`
);

/* ---------- P5: havuz kartında grup üyeleri (istekOgrenciIds üzerinden) ---------- */
uygula(
  "P5a üye html hesabı",
`    var D2 = DERS[r.dersId];`,
`    var D2 = DERS[r.dersId];
    /* GRUP İSTEK: tüm üyeler istekOgrenciIds() üzerinden dinamik isimle, TEK kayıt olarak gösterilir */
    var uyeHtml = istekOgrenciIds(r).length > 1 ? ' <span class="grup-istek-uyeler inline-flex flex-wrap items-center gap-1 align-middle">' +
      istekOgrenciIds(r).slice(1).map(function (oid) {
        var mo = DB.ogrenciler.find(function (x) { return x.id === oid; });
        return mo ? '<span class="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">' + esc(mo.ad) + "</span>" : "";
      }).join("") + "</span>" : "";`
);
uygula(
  "P5b üye html kart adına eklenir",
`      '<div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><b class="text-[13px] text-slate-800">' + esc(o ? o.ad : r.ogrenciAd) + "</b>" +`,
`      '<div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><b class="text-[13px] text-slate-800">' + esc(o ? o.ad : r.ogrenciAd) + "</b>" + uyeHtml +`
);

/* ---------- P6: havuz özet şeridi + panel yeniden yerleştirme ---------- */
uygula(
  "P6 havuz özet şeridi",
`      chips + liste + "</div>";
}`,
`      istekGrupOzetHTML() + chips + liste + "</div>";
  /* GRUP İSTEK: havuz bağlamında panel bu formdadır — render sonrası yeniden yerleştir (id çoğaltmadan) */
  if (grupPanelBaglami() === "havuz") {
    if (!document.getElementById("ek-ogrenciler")) renderFormDestek();
    else grupPanelYerlestir();
  }
}`
);

/* ---------- P7: renderFormDestek — paneli aktif bağlama yerleştir ---------- */
uygula(
  "P7 renderFormDestek yerleştirme",
`  grupPanelCiz();

  duzenleBannerGuncelle();
}`,
`  grupPanelYerlestir();
  grupPanelCiz();

  duzenleBannerGuncelle();
}`
);

/* ---------- P8: formaAktar — grup isteğinin tüm üyeleri panele otomatik yüklenir ---------- */
uygula(
  "P8 formaAktar üye yükleme",
`  /* ISTEK-GRUP: grup panel seçimini temizle — sahibi ANA öğrenci olarak yüklü, kilidi panelde (checkbox disabled) */
  ui.ekOgrenciIds = [];
  if (ui.panelSecim) { ui.panelSecim.acik = false; ui.panelSecim.arama = ""; ui.panelSecim.sinif = ""; }`,
`  /* ISTEK-GRUP: grup İSTEĞİNDE tüm üyeler panele otomatik yüklenir (ilki ana/sahip, kalanı seçili);
     tekli istekte eski davranış birebir korunur (boş seçim, kapalı panel) */
  var _istekUyeleri = istekOgrenciIds(r).filter(function (oid) { return oid !== r.ogrenciId; });
  ui.grupPanelBaglam = "plan"; ui.havuzAnaId = null; /* istekten planlama her zaman plan bağlamında */
  ui.ekOgrenciIds = _istekUyeleri;
  if (ui.panelSecim) { ui.panelSecim.acik = _istekUyeleri.length > 0; ui.panelSecim.arama = ""; ui.panelSecim.sinif = ""; ui.panelSecim.anaId = r.ogrenciId; }`
);

/* ---------- P9: planla — grup isteği 1 ek ile bile grup dersi olur (üyeler korunur) ---------- */
uygula(
  "P9a planla grupIstekAktif (1. site)",
`  }) : [];
  var grupModu = grupOgrenciIds.length >= 2;`,
`  }) : [];
  /* GRUP İSTEK: aktif istek grup isteği ise (ogrenciIds dolu) 1 ek ile bile grup dersi olur — üyeler korunur */
  var grupIstekAktif = !!ui.aktifIstekId && (function () {
    var _gr = DB.istekler.find(function (x) { return x.id === ui.aktifIstekId; });
    return !!_gr && istekOgrenciIds(_gr).length > 1;
  })();
  var grupModu = grupOgrenciIds.length >= 2 || (grupIstekAktif && grupOgrenciIds.length >= 1);`
);
uygula(
  "P9b planla grupModu (2. site)",
`  grupOgrenciIds = grupOgrenciIds.filter(function (oid) { return oid !== o.id; });
  grupModu = grupOgrenciIds.length >= 2;`,
`  grupOgrenciIds = grupOgrenciIds.filter(function (oid) { return oid !== o.id; });
  grupModu = grupOgrenciIds.length >= 2 || (grupIstekAktif && grupOgrenciIds.length >= 1);`
);

/* ---------- P10: grupAnaOgrenciId — havuz bağlamında İLK seçilen ---------- */
uygula(
  "P10 grupAnaOgrenciId bağlam",
`function grupAnaOgrenciId() {
  var inp = $("f-ogrenci");`,
`function grupAnaOgrenciId() {
  /* GRUP İSTEK: havuz bağlamında ana = İLK seçilen öğrenci (ui.havuzAnaId) */
  if (grupPanelBaglami() === "havuz") return ui.havuzAnaId || null;
  var inp = $("f-ogrenci");`
);

/* ---------- P11: grupPanelAnaDegisti — havuz bağlamı koruması ---------- */
uygula(
  "P11 grupPanelAnaDegisti havuz",
`function grupPanelAnaDegisti() {
  var ana = grupAnaOgrenciId();`,
`function grupPanelAnaDegisti() {
  if (grupPanelBaglami() === "havuz") { if (ui.panelSecim) ui.panelSecim.anaId = ui.havuzAnaId || null; return ui.havuzAnaId || null; }
  var ana = grupAnaOgrenciId();`
);

/* ---------- P12: grupPanelSec — havuz bağlamı dalı (ilk seçilen ana; kopya yazılmaz) ---------- */
uygula(
  "P12 grupPanelSec havuz dalı",
`function grupPanelSec(oid) {
  if (!oid) return;
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  var ana = grupPanelAnaDegisti();`,
`function grupPanelSec(oid) {
  if (!oid) return;
  if (!ui.panelSecim) ui.panelSecim = { acik: false, arama: "", sinif: "" };
  /* GRUP İSTEK (havuz bağlamı): İLK seçilen ana olur; ana çıkarılırsa sıradaki üye ana olur; kopya yazılmaz */
  if (grupPanelBaglami() === "havuz") {
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
  }
  var ana = grupPanelAnaDegisti();`
);

/* ---------- P13: grupPanelListeCiz — havuz bağlamında ana checkbox'ı serbest (ana değiştirilebilir) ---------- */
uygula(
  "P13 havuzda ana serbest",
`    var kutu = '<input type="checkbox"' + (e.secili || e.ana ? " checked" : "") + (e.ana ? " disabled" : "") +`,
`    var kutu = '<input type="checkbox"' + (e.secili || e.ana ? " checked" : "") + (e.ana && grupPanelBaglami() !== "havuz" ? " disabled" : "") +`
);

if (hata) { console.error("HİÇBİR değişiklik YAZILMADI."); process.exit(1); }
writeFileSync(HEDEF, kod);
console.log("GRUP İSTEK yaması uygulandı → " + HEDEF + " (yedek: " + YEDEK + ")");
