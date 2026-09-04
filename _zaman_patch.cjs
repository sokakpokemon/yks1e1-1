const fs = require("fs");
const P = "index.html";
let src = fs.readFileSync(P, "utf8");
const ORIG = src.length;
let steps = [];
function done(name) { steps.push(name); fs.writeFileSync(P, src); }
function must(c, m) { if (!c) { console.error("FAIL: " + m); process.exit(1); } }

/* ============================================================
   0) Yeni zaman çizelgesi modeli: SLOT (11 ders) + MOLA
   slotlar[dizin] = { s: başlangıç saati (sayı), e: bitiş saati, no: "1".."11" }
   ============================================================ */
const SLOT_MODEL = `// ---------- Zaman çizelgesi (11 ders + kilitli öğle molası) ----------
var SAATLER = [];              // birebir ders slotlarının başlangıç saatleri (sayı)
var SLOT_BILGI = [];           // { s, e, no } — her slotta dersin başlangıç/bitiş saati
(function kurSaatler() {
  var baslangiclar = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  // 1) 8:50-9:30 → slot başlangıcı 9 (09:00 gösterimi, ders 08:50'de girilir)
  SLOT_BILGI.push({ s: 9,  e: 10, no: "1"  }); // 08:50 - 09:30
  SLOT_BILGI.push({ s: 10, e: 11, no: "2"  }); // 09:40 - 10:20
  SLOT_BILGI.push({ s: 11, e: 12, no: "3"  }); // 10:30 - 11:10
  // 12:00-13:00 ÖĞLE MOLASI — ders eklenemez (kilitli)
  SLOT_BILGI.push({ s: 13, e: 14, no: "5"  }); // 13:00 - 13:40
  SLOT_BILGI.push({ s: 14, e: 15, no: "6"  }); // 13:50 - 14:30
  SLOT_BILGI.push({ s: 15, e: 16, no: "7"  }); // 14:40 - 15:20
  SLOT_BILGI.push({ s: 16, e: 17, no: "8"  }); // 15:30 - 16:10
  SLOT_BILGI.push({ s: 17, e: 18, no: "9"  }); // 16:20 - 17:00
  SLOT_BILGI.push({ s: 18, e: 19, no: "10" }); // 17:10 - 17:50
  SLOT_BILGI.push({ s: 19, e: 20, no: "11" }); // 18:00 - 18:40
  SLOT_BILGI.forEach(function (b) { SAATLER.push(b.s); });
})();
var MOLA_SLOT = 3;             // SLOT_BILGI[3] = 12:00 - 13:00 öğle molası
var MOLA_SAAT = 12;            // 12:00 saat değerine ders planlanamaz
function slotSaatYazi(h) { return String(h).padStart(2, "0") + ":00"; }
function slotAralikYazi(b) { return String(b.s).padStart(2, "0") + ":00-" + String(b.e).padStart(2, "0") + ":00"; }
function slotEtiket(b) { return b.no + ". Ders (" + slotAralikYazi(b) + ")"; }
function gecerliDersSaati(h) { return SAATLER.indexOf(h) >= 0; }`;

const OLD_SAATLER = `var SAATLER = [];
for (var hs = 9; hs <= 19; hs++) SAATLER.push(hs);`;
must(src.indexOf(OLD_SAATLER) >= 0, "old SAATLER block");
src = src.replace(OLD_SAATLER, SLOT_MODEL);
done("SAATLER → new 11-slot model + helpers");

/* ============================================================
   1) normalize(): eski veriyi yeni slot modeline taşı
   - ders saatleri: 09:00..19:00 → "08:50" (1.ders), "09:40" (2.ders) ... "18:00" (11.ders)
   - 20:00 ve sonrası → son geçerli slota ("18:00")
   - 12:00 (eski mola slotu) → 13:00'e (5. ders) kaydır
   - sinifProg ve avail anahtarları "-HH" saat bölümü aynı dönüşüme uğrar
   ============================================================ */
const NORM_ANCHOR = "function normalize(d) {";
const NORM_NEW = `var SAAT_DONUSUM = { "8": "08:50", "9": "09:40", "10": "10:30", "11": "11:20", "12": "13:00", "13": "13:00", "14": "13:50", "15": "14:40", "16": "15:30", "17": "16:20", "18": "17:10", "19": "18:00", "20": "18:00" };
function saatDonustur(v) {
  var s = String(v == null ? "" : v).trim();
  if (!s) return s;
  if (s.indexOf(":") < 0) { s = s + ":00"; }
  var h = parseInt(s.split(":")[0], 10);
  var mn = s.split(":")[1] || "00";
  if (isNaN(h)) return s;
  if (SAATLER.indexOf(h) >= 0 && mn === "00") return slotSaatYazi(h);
  return SAAT_DONUSUM[h] || "18:00";
}
function saatKeyDonustur(k) {
  var p = String(k || "").split("-");
  if (p.length !== 2) return k;
  var g = p[0];
  var h = parseInt(p[1].split(":")[0], 10);
  if (isNaN(h)) return k;
  if (SAATLER.indexOf(h) >= 0) return g + "-" + h;
  var yeni = SAAT_DONUSUM[h];
  if (!yeni) return null;
  return g + "-" + parseInt(yeni.split(":")[0], 10);
}
function normalize(d) {`;
must(src.indexOf(NORM_ANCHOR) >= 0, "normalize anchor");
src = src.replace(NORM_ANCHOR, NORM_NEW);
done("saatDonustur + saatKeyDonustur helpers added");

// normalize gövdesini genişlet: ders saatleri + anahtar dönüşümü
const OLD_NORM_BODY = `  d.sinifProg = d.sinifProg && typeof d.sinifProg === "object" ? d.sinifProg : {};
  if (Array.isArray(d.ogretmenler)) d.ogretmenler.forEach(function (t) {
    if (!t.avail) t.avail = { sinif: {}, musait: [] };
    if (Array.isArray(t.avail.sinif)) {
      var o = {}; t.avail.sinif.forEach(function (k) { o[k] = "Sınıf Dersi"; }); t.avail.sinif = o;
    }
    if (!t.avail.sinif || typeof t.avail.sinif !== "object") t.avail.sinif = {};
    if (!Array.isArray(t.avail.musait)) t.avail.musait = [];
  });
  return d;
}`;
const NEW_NORM_BODY = `  d.sinifProg = d.sinifProg && typeof d.sinifProg === "object" ? d.sinifProg : {};
  if (Array.isArray(d.ogretmenler)) d.ogretmenler.forEach(function (t) {
    if (!t.avail) t.avail = { sinif: {}, musait: [] };
    if (Array.isArray(t.avail.sinif)) {
      var o = {}; t.avail.sinif.forEach(function (k) { o[k] = "Sınıf Dersi"; }); t.avail.sinif = o;
    }
    if (!t.avail.sinif || typeof t.avail.sinif !== "object") t.avail.sinif = {};
    if (!Array.isArray(t.avail.musait)) t.avail.musait = [];
    // eski saat anahtarlarını yeni slot modeline taşı
    var yeniSinif = {}, degisti = false;
    Object.keys(t.avail.sinif).forEach(function (k) {
      var nk = saatKeyDonustur(k); if (!nk) { degisti = true; return; }
      if (nk !== k) degisti = true;
      if (!yeniSinif[nk]) yeniSinif[nk] = t.avail.sinif[k];
    });
    if (degisti) t.avail.sinif = yeniSinif;
    var yeniMusait = [], mDegisti = false;
    t.avail.musait.forEach(function (k) {
      var nk = saatKeyDonustur(k); if (!nk) { mDegisti = true; return; }
      if (nk !== k) mDegisti = true;
      if (yeniMusait.indexOf(nk) < 0) yeniMusait.push(nk);
    });
    if (mDegisti) t.avail.musait = yeniMusait;
  });
  // sınıf programlarını yeni slot modeline taşı
  var yeniProg = {}, pDegisti = false;
  Object.keys(d.sinifProg).forEach(function (sAd) {
    var liste = Array.isArray(d.sinifProg[sAd]) ? d.sinifProg[sAd] : [];
    var nL = [];
    liste.forEach(function (k) {
      var nk = saatKeyDonustur(k); if (!nk) { pDegisti = true; return; }
      if (nk !== k) pDegisti = true;
      if (nL.indexOf(nk) < 0) nL.push(nk);
    });
    if (pDegisti) yeniProg[sAd] = nL; else yeniProg[sAd] = liste;
  });
  if (pDegisti) d.sinifProg = yeniProg;
  // ders saatlerini yeni slotta başlangıç saatine taşı
  if (Array.isArray(d.dersler)) d.dersler.forEach(function (l) {
    var ns = saatDonustur(l.saat);
    if (ns !== l.saat) l.saat = ns;
  });
  return d;
}`;
must(src.indexOf(OLD_NORM_BODY) >= 0, "normalize body");
src = src.replace(OLD_NORM_BODY, NEW_NORM_BODY);
done("normalize migration: lessons + schedule keys → new slots");

/* ============================================================
   2) gridTablo: yeni saat matrisi + mola satırı + düzenleme kilidi
   ============================================================ */
const OLD_GRID_ANCHOR = `function gridTablo(onclickOnce, avail, tip) {
  var h = "<thead><tr><th class='sticky left-0 bg-slate-50/80'></th>";
  for (var g = 0; g < 7; g++) h += '<th class="py-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">' + GUN_KISA[g] + "</th>";
  h += "</tr></thead><tbody>";
  SAATLER.forEach(function (saat) {
    var saatYazi = String(saat).padStart(2, "0") + ":00";
    h += "<tr>";
    h += '<td class="sticky left-0 bg-white pr-2 text-[10.5px] font-bold text-slate-400 text-right whitespace-nowrap">' + saatYazi + "</td>";
    for (var g2 = 0; g2 < 7; g2++) {
      var key = g2 + "-" + saat;
      var durum = tip === "ogretmen"
        ? ((avail.sinif && key in avail.sinif) ? "sinif" : avail.musait.indexOf(key) >= 0 ? "musait" : "")
        : (avail.indexOf(key) >= 0 ? "var" : "");
      var cls = "hucreBtn border ";
      var baslik = GUN_KISA[g2] + " " + saatYazi;
      if (durum === "sinif") { cls += "bg-amber-200 border-amber-300 hover:bg-amber-300"; baslik += " · Sınıf Dersi"; }
      else if (durum === "musait") { cls += "bg-rose-200 border-rose-300 hover:bg-rose-300"; baslik += " · Müsait Değil"; }
      else if (durum === "var") { cls += "bg-blue-200 border-blue-300 hover:bg-blue-300"; baslik += " · Toplu ders"; }
      else { cls += "bg-white border-slate-200 hover:border-teal-300 hover:bg-teal-50"; baslik += " · Boş"; }
      h += '<td class="p-0.5"><button class="' + cls + '" title="' + baslik + '" onclick="' + onclickOnce + "," + g2 + "," + saat + ')">' +
        (durum === "sinif" ? '<span class="text-[7.5px] font-extrabold text-amber-700/80 leading-tight whitespace-nowrap">' + esc((avail.sinif[key] || "SD").substring(0, 14)) + '</span>' :
         durum === "musait" ? '<span class="text-[8.5px] font-extrabold text-rose-500/70">MD</span>' :
         durum === "var" ? '<span class="text-[8.5px] font-extrabold text-blue-600/60">DV</span>' : "") +
        "</button></td>";
    }
    h += "</tr>";
  });
  h += "</tbody>";
  return '<div class="overflow-x-auto rounded-xl border border-slate-100"><table class="w-full min-w-[640px] text-center border-separate border-spacing-0.5">' + h + "</table></div>";
}`;

const NEW_GRID = `function gridTablo(onclickOnce, avail, tip, sinifOgrtMap) {
  var kilitli = !ui.duzenlemeAcik; // Düzenleme Kilidi: kapalıysa hiçbir hücre düzenlenemez
  var h = "<thead><tr><th class='sticky left-0 bg-slate-50/80'></th>";
  for (var g = 0; g < 7; g++) h += '<th class="py-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">' + GUN_KISA[g] + "</th>";
  h += "</tr></thead><tbody>";
  SLOT_BILGI.forEach(function (bil, sIdx) {
    var saat = bil.s;
    var mola = sIdx === MOLA_SLOT;
    var aralik = slotAralikYazi(bil);
    h += "<tr>";
    if (mola) {
      h += '<td class="sticky left-0 bg-emerald-50 pr-2 text-[10.5px] font-extrabold text-emerald-600 text-right whitespace-nowrap">☕ ' + aralik + "</td>";
    } else {
      h += '<td class="sticky left-0 bg-white pr-2 text-[10px] font-bold text-slate-400 text-right whitespace-nowrap">' + bil.no + ". Ders<br><span class=\\"text-[9px] font-semibold text-slate-300\\">" + aralik + "</span></td>";
    }
    for (var g2 = 0; g2 < 7; g2++) {
      var key = g2 + "-" + saat;
      var durum = mola ? "mola"
        : tip === "ogretmen"
          ? ((avail.sinif && key in avail.sinif) ? "sinif" : avail.musait.indexOf(key) >= 0 ? "musait" : "")
          : (avail.indexOf(key) >= 0 ? "var" : "");
      var tikla = kilitli || mola ? "" : ' onclick="' + onclickOnce + "," + g2 + "," + saat + ')"';
      if (!tikla) {
        // onclickOnce "..." ile başlar; kilitli/mola hücreler tıklanamaz
      }
      var cls = "hucreBtn border ";
      var baslik = GUN_KISA[g2] + " " + aralik;
      if (mola) { cls += "bg-emerald-100 border-emerald-200 cursor-not-allowed"; baslik = "Öğle Molası 12:00-13:00 · kilitli"; }
      else if (durum === "sinif") { cls += "bg-amber-200 border-amber-300" + (kilitli ? "" : " hover:bg-amber-300"); baslik += " · Sınıf Dersi"; }
      else if (durum === "musait") { cls += "bg-rose-200 border-rose-300" + (kilitli ? "" : " hover:bg-rose-300"); baslik += " · Müsait Değil"; }
      else if (durum === "var") { cls += "bg-blue-200 border-blue-300" + (kilitli ? "" : " hover:bg-blue-300"); baslik += " · Toplu ders"; }
      else { cls += "bg-white border-slate-200" + (kilitli ? " cursor-not-allowed" : " hover:border-teal-300 hover:bg-teal-50"); baslik += kilitli ? " · Düzenleme kapalı" : " · Boş"; }
      var icerik = "";
      if (mola) icerik = '<span class="text-[8.5px] font-extrabold text-emerald-600/80">MOLA</span>';
      else if (durum === "sinif") {
        var ogrtB = sinifOgrtMap && sinifOgrtMap[key];
        icerik = ogrtB
          ? '<div class="leading-tight"><span class="block text-[7px] font-extrabold text-amber-800/90 whitespace-nowrap">' + esc(ogrtB.ad.substring(0, 12)) + '</span><span class="block text-[6.5px] font-bold text-amber-600/80 whitespace-nowrap">' + esc(ogrtB.dersAd.substring(0, 10)) + '</span></div>'
          : '<span class="text-[7.5px] font-extrabold text-amber-700/80 leading-tight whitespace-nowrap">' + esc((avail.sinif[key] || "SD").substring(0, 14)) + '</span>';
      }
      else if (durum === "musait") icerik = '<span class="text-[8.5px] font-extrabold text-rose-500/70">MD</span>';
      else if (durum === "var") icerik = '<span class="text-[8.5px] font-extrabold text-blue-600/60">DV</span>';
      h += '<td class="p-0.5"><button ' + (tikla ? "" : "disabled ") + 'class="' + cls + (kilitli || mola ? " opacity-90" : "") + '" title="' + baslik + '"' + (tikla ? ' onclick="' + onclickOnce + "," + g2 + "," + saat + ')"' : "") + ">" + icerik + "</button></td>";
    }
    h += "</tr>";
  });
  h += "</tbody>";
  return '<div class="overflow-x-auto rounded-xl border border-slate-100"><table class="w-full min-w-[700px] text-center border-separate border-spacing-0.5">' + h + "</table></div>";
}`;
must(src.indexOf(OLD_GRID_ANCHOR) >= 0, "gridTablo");
src = src.replace(OLD_GRID_ANCHOR, NEW_GRID);
done("gridTablo rebuilt: 11 slots + mola row + edit-lock + class-teacher badges");

// --- Sınıf hücrelerinde öğretmen+ders rozeti için harita üretici ---
const SINIF_MAP_FN = `function sinifOgretmenHaritasi() {
  // her "gün-saat" anahtarı için o saatte sınıf dersi olan öğretmen + branş
  var map = {};
  DB.ogretmenler.forEach(function (t) {
    if (!t.avail || !t.avail.sinif) return;
    Object.keys(t.avail.sinif).forEach(function (k) {
      if (!map[k]) map[k] = { ad: t.ad, dersAd: DERS[t.brans] ? DERS[t.brans].ad : "Ders" };
    });
  });
  return map;
}
function secOgr(id) { ui.ogrId = id; renderYonetim(); }`;
must(src.indexOf("function secOgr(id) { ui.ogrId = id; renderYonetim(); }") >= 0, "secOgr anchor");
src = src.replace("function secOgr(id) { ui.ogrId = id; renderYonetim(); }", SINIF_MAP_FN);
done("sinifOgretmenHaritasi helper added");

/* ============================================================
   3) ogretmenTab: düzenleme kilidi switch'i + grid çağrısına harita
   ============================================================ */
const OLD_TEACHER_GRID = `        '<div class="flex items-center gap-3 text-[10.5px] font-semibold text-slate-500 flex-wrap">' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border border-slate-200 bg-white inline-block"></span> Boş (ders verilebilir)</span>' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-200 border border-amber-300 inline-block"></span> Sınıf Dersi</span>' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-rose-200 border border-rose-300 inline-block"></span> Müsait Değil</span>' +
        "</div></div>" +
      gridTablo("togOgr('" + t2.id + "'", t2.avail, "ogretmen") +
      "</div>";`;
const NEW_TEACHER_GRID = `        '<div class="flex items-center gap-3 text-[10.5px] font-semibold text-slate-500 flex-wrap">' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border border-slate-200 bg-white inline-block"></span> Boş (ders verilebilir)</span>' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-200 border border-amber-300 inline-block"></span> Sınıf Dersi</span>' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-rose-200 border border-rose-300 inline-block"></span> Müsait Değil</span>' +
        "</div>" +
        kilidAnahtariHtml() +
      "</div>" +
      gridTablo("togOgr('" + t2.id + "'", t2.avail, "ogretmen", sinifOgretmenHaritasi()) +
      "</div>";`;
must(src.indexOf(OLD_TEACHER_GRID) >= 0, "teacher grid call");
src = src.replace(OLD_TEACHER_GRID, NEW_TEACHER_GRID);
done("teacher tab: lock switch + grid map param");

// kilidAnahtariHtml global yardımcısı — hem öğretmen hem sınıf programının üstünde görünür
const KILIT_FN = `function kilidAnahtariHtml() {
  var acik = !!ui.duzenlemeAcik;
  return '<label class="inline-flex items-center gap-2 ml-auto cursor-pointer select-none shrink-0">' +
    '<span class="text-[10.5px] font-bold uppercase tracking-wide ' + (acik ? "text-emerald-600" : "text-slate-400") + '">' +
    (acik ? '<i class="fa-solid fa-lock-open mr-1"></i>Düzenleme Açık' : '<i class="fa-solid fa-lock mr-1"></i>Düzenleme Kilidi') + '</span>' +
    '<span class="relative inline-block w-9 h-5 rounded-full transition-colors ' + (acik ? "bg-emerald-500" : "bg-slate-300") + '">' +
      '<span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ' + (acik ? "translate-x-4" : "") + '"></span>' +
    '</span>' +
    '<input type="checkbox" class="sr-only" ' + (acik ? "checked" : "") + ' onchange="duzenlemeTik(this.checked)" />' +
    '</label>';
}
function duzenlemeTik(v) { ui.duzenlemeAcik = !!v; toast(v ? "Düzenleme kilidi açıldı — takvimler üzerinde sürükleyebilirsiniz." : "Düzenleme kilidi kapatıldı — takvimler salt-okunur."); renderYonetim(); renderDersler(); }
function secOgr(id) { ui.ogrId = id; renderYonetim(); }`;
src = src.replace("function secOgr(id) { ui.ogrId = id; renderYonetim(); }", KILIT_FN);
done("kilidAnahtariHtml + duzenlemeTik added");

/* ============================================================
   4) togOgr: mola ve kilit koruması (API seviyesinde)
   ============================================================ */
const OLD_TOGOGR = `function togOgr(tid, di, saat) {
  var t = DB.ogretmenler.find(function (x) { return x.id === tid; });
  if (!t) return;
  var k = di + "-" + saat;`;
const NEW_TOGOGR = `function togOgr(tid, di, saat) {
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — değişiklik için üstteki kilidi açın.", "uyari"); return; }
  if (saat === MOLA_SAAT) { toast("Öğle molasına ders eklenemez.", "hata"); return; }
  var t = DB.ogretmenler.find(function (x) { return x.id === tid; });
  if (!t) return;
  var k = di + "-" + saat;`;
must(src.indexOf(OLD_TOGOGR) >= 0, "togOgr");
src = src.replace(OLD_TOGOGR, NEW_TOGOGR);
done("togOgr: lock + mola guards");

/* ============================================================
   5) togSinif: mola ve kilit koruması (API seviyesinde)
   ============================================================ */
const OLD_TOGSINIF = `function togSinif(sinifAd, di, saat) {
  if (!DB.sinifProg[sinifAd]) DB.sinifProg[sinifAd] = [];
  var key = di + "-" + saat;`;
const NEW_TOGSINIF = `function togSinif(sinifAd, di, saat) {
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — değişiklik için üstteki kilidi açın.", "uyari"); return; }
  if (saat === MOLA_SAAT) { toast("Öğle molasına ders eklenemez.", "hata"); return; }
  if (!DB.sinifProg[sinifAd]) DB.sinifProg[sinifAd] = [];
  var key = di + "-" + saat;`;
must(src.indexOf(OLD_TOGSINIF) >= 0, "togSinif");
src = src.replace(OLD_TOGSINIF, NEW_TOGSINIF);
done("togSinif: lock + mola guards");

/* ============================================================
   6) Sınıf programı: kilit anahtarı + grid'e harita parametresi
   ============================================================ */
const OLD_SINIF_GRID = `        '<div><h4 class="text-[14px] font-bold text-slate-900">Sınıf Toplu Ders Programı — ' + esc(ui.sinifAd) + "</h4>" +
        '<p class="text-[11px] text-slate-400 mt-0.5">Bu saatlerde sınıf derste olduğu için öğrencilere birebir ders planlanamaz</p></div>' +
        '<span class="flex items-center gap-3 text-[10.5px] font-semibold text-slate-500">' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border border-slate-200 bg-white inline-block"></span> Boş</span>' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-200 border border-blue-300 inline-block"></span> Toplu ders var</span></span></div>' +
      gridTablo("togSinif('" + esc(ui.sinifAd).replace(/'/g, "\\'") + "'", program, "sinif") + "</div>";`;
const NEW_SINIF_GRID = `        '<div><h4 class="text-[14px] font-bold text-slate-900">Sınıf Toplu Ders Programı — ' + esc(ui.sinifAd) + "</h4>" +
        '<p class="text-[11px] text-slate-400 mt-0.5">Bu saatlerde sınıf derste olduğu için öğrencilere birebir ders planlanamaz</p></div>' +
        '<span class="flex items-center gap-3 text-[10.5px] font-semibold text-slate-500">' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border border-slate-200 bg-white inline-block"></span> Boş</span>' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-200 border border-blue-300 inline-block"></span> Toplu ders var</span></span>' +
        kilidAnahtariHtml() + '</div>' +
      gridTablo("togSinif('" + esc(ui.sinifAd).replace(/'/g, "\\'") + "'", program, "sinif", sinifOgretmenHaritasi()) + "</div>";`;
must(src.indexOf(OLD_SINIF_GRID) >= 0, "sinif grid call");
src = src.replace(OLD_SINIF_GRID, NEW_SINIF_GRID);
done("class program: lock switch + grid map param");

/* ============================================================
   7) ui state: duzenlemeAcik + haftalikOgrtId
   ============================================================ */
const OLD_UI = `var ui = {
  filtre: "hafta", anchor: todayKey(), sekme: "ogretmen",
  editId: null, aktifIstekId: null, ogrId: null, sinifAd: null, analizAcik: true, istekFiltre: ""
};`;
const NEW_UI = `var ui = {
  filtre: "hafta", anchor: todayKey(), sekme: "ogretmen",
  editId: null, aktifIstekId: null, ogrId: null, sinifAd: null, analizAcik: true, istekFiltre: "",
  duzenlemeAcik: false, haftalikOgrtId: null, gunSecim: null
};`;
must(src.indexOf(OLD_UI) >= 0, "ui state");
src = src.replace(OLD_UI, NEW_UI);
done("ui state: duzenlemeAcik default false (kilitli)");

/* ============================================================
   8) haftalikOgrtTablo: yeni saat matrisi + mola sütunu + zengin hücreler + kilit
   ============================================================ */
const OLD_HO_ANCHOR = `  // Saat başlıkları
  var saatBaslik = "";
  for (var h = 9; h <= 19; h++) {
    saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100' style='min-width:75px'>" +
      '<div class="text-[11px] font-extrabold text-slate-600">' + String(h).padStart(2,"0") + ":00</div>" +
      '<div class="text-[9px] text-slate-400">' + String(h).padStart(2,"0") + ":50</div></th>";
  }`;
const NEW_HO_ANCHOR = `  // Saat başlıkları: 11 ders slottu + kilitli öğle molası
  var saatBaslik = "";
  SLOT_BILGI.forEach(function (bil, bi) {
    if (bi === MOLA_SLOT) {
      saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100 bg-emerald-100' style='min-width:56px'>" +
        '<div class="text-[10px] font-extrabold text-emerald-600">☕ MOLA</div>' +
        '<div class="text-[8.5px] text-emerald-500">12:00-13:00</div></th>';
    } else {
      saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100' style='min-width:75px'>" +
        '<div class="text-[10px] font-extrabold text-slate-600">' + bil.no + ". Ders</div>" +
        '<div class="text-[8.5px] text-slate-400">' + slotAralikYazi(bil) + '</div></th>';
    }
  });`;
must(src.indexOf(OLD_HO_ANCHOR) >= 0, "haftalik saat baslik");
src = src.replace(OLD_HO_ANCHOR, NEW_HO_ANCHOR);
done("haftalik: new hour headers with mola column");

// haftalik satır döngüsü — 9..19 yerine SLOT_BILGI; mola hücresi; zengin ders kartı
const OLD_HO_ROWS = `  var satirlar = "";
  for (var g = 0; g < 7; g++) {
    var gunAd = gunAdlari[g];
    var isPazar = g === 6;
    var bg = g % 2 === 0 ? "bg-white" : "bg-slate-50/50";

    satirlar += '<tr class="border-b border-slate-100 ' + bg + '">';
    satirlar += '<td class="px-3 py-2 border-r border-slate-100 text-[11.5px] font-bold text-slate-600 whitespace-nowrap" style="min-width:100px">' + gunAd + '</td>';

    for (var h = 9; h <= 19; h++) {
      var key = g + "-" + h;`;
const NEW_HO_ROWS = `  var kilitKapa = !ui.duzenlemeAcik; // Düzenleme Kilidi kapalıysa sürükleme yok
  var satirlar = "";
  for (var g = 0; g < 7; g++) {
    var gunAd = gunAdlari[g];
    var isPazar = g === 6;
    var bg = g % 2 === 0 ? "bg-white" : "bg-slate-50/50";

    satirlar += '<tr class="border-b border-slate-100 ' + bg + '">';
    satirlar += '<td class="px-3 py-2 border-r border-slate-100 text-[11.5px] font-bold text-slate-600 whitespace-nowrap" style="min-width:100px">' + gunAd + '</td>';

    SLOT_BILGI.forEach(function (bil, hIdx) {
      var h = bil.s;
      var saatYazi = slotSaatYazi(h);
      var key = g + "-" + h;
      if (hIdx === MOLA_SLOT) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-emerald-50"><span class="text-[9px] font-bold text-emerald-500">Mola</span></td>';
        return;
      }`;
must(src.indexOf(OLD_HO_ROWS) >= 0, "haftalik rows");
src = src.replace(OLD_HO_ROWS, NEW_HO_ROWS);

// döngü kapanışını düzelt: for(...) } → forEach });  (eski kodda satır sonunda "});\n  }" yok,
// eski döngü: for içinde hücreler eklenir, sonra "satirlar += "</tr>";\n  }" ile kapanır.
const OLD_HO_END = `        // BOŞ HÜCRE → DROP ZONE (havuzdaki istek kartı buraya bırakılabilir)
        var hk = String(h).padStart(2, "0") + ":00";
        satirlar += '<td class="dnd-bos px-1.5 py-1.5 text-center border-l border-slate-100 transition-colors"' +
          ' data-drop-ogrt="' + esc(t.id) + '" data-drop-gun="' + g + '" data-drop-saat="' + hk + '"' +
          ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)" ondrop="istekBurak(event, this, \\'' + esc(t.id) + '\\', \\'' + addDaysKey(p.start, g) + '\\', \\'' + hk + '\\')" title="Boş saat — havuzdan istek kartı sürükleyip bırakın">' +
          '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
      }
    }
    satirlar += "</tr>";
  }`;
const NEW_HO_END = `        // BOŞ HÜCRE → DROP ZONE (havuzdaki istek kartı buraya bırakılabilir)
        var hk = saatYazi;
        var suruklenebilir = kilitKapa ? ' draggable="false"' : "";
        var bosCls = kilitKapa ? "dnd-bos dnd-kapali" : "dnd-bos";
        satirlar += '<td class="' + bosCls + ' px-1.5 py-1.5 text-center border-l border-slate-100 transition-colors"' + suruklenebilir +
          ' data-drop-ogrt="' + esc(t.id) + '" data-drop-gun="' + g + '" data-drop-saat="' + hk + '"' +
          ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)" ondrop="istekBurak(event, this, \\'' + esc(t.id) + '\\', \\'' + addDaysKey(p.start, g) + '\\', \\'' + hk + '\\')" title="' + (kilitKapa ? "Boş saat — düzenleme kilidi açık değil" : "Boş saat — havuzdan istek kartı sürükleyip bırakın") + '">' +
          '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
      }
    });
    satirlar += "</tr>";
  }`;
must(src.indexOf(OLD_HO_END) >= 0, "haftalik rows end");
src = src.replace(OLD_HO_END, NEW_HO_END);
done("haftalik rows: forEach slots + mola cell + editable drop zones");

// haftalik ders hücreleri: zengin içerik (öğrenci + sınıf + eksik konu) ve kilit
const OLD_HO_DERS = `      } else if (ders) {
        var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
        var ogrenciAd = ders.ogrenciAd || (ogrenci ? ogrenci.ad : "");
        var sinif = ogrenci ? ogrenci.sinif : "";
        var dersBilgi = DERS[ders.dersId];
        var hareketli = ders.kaynak === "takvim"; // sürükle-bırakla yerleştirilmiş kart → takvim içinde taşınabilir
        if (hareketli) {
          // YENİ YERLEŞEN İSTEK KARTI: pastel yeşil, draggable
          satirlar += '<td class="px-1.5 py-1.5 text-center border-l border-slate-100">' +
            '<div draggable="true" ondragstart="istekDrag(event, \\'' + ders.id + '\\')" title="Sürükleyip başka boş saate taşıyabilirsin" class="dnd-kart rounded-lg border border-emerald-200 bg-emerald-50 px-1 py-1.5">' +
            '<div class="text-[10.5px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd.split(" ")[0]) + '</div>' +
            (sinif ? '<div class="text-[9px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[8px] font-bold mt-0.5 text-emerald-700">' + dersBilgi.ad + (ders.durum === "tamamlandi" ? ' <i class="fa-solid fa-check text-[8px]"></i>' : "") + '</div>' : '') +
            '</div></td>';
        } else {
          // Formdan planlanmış ders: KİLİTLİ — mevcut renk/şablon aynen korunur
          var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
          satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border ' + durumRenk + ' px-1 py-1.5" title="Dolu — kilitli">' +
            '<div class="text-[10.5px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd.split(" ")[0]) + '</div>' +
            (sinif ? '<div class="text-[9px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[8px] font-bold mt-0.5 ' + dersBilgi.tx + '">' + dersBilgi.ad + '</div>' : '') +
            '</div></td>';
        }
      } else {`;
const NEW_HO_DERS = `      } else if (ders) {
        var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
        var ogrenciAd = ders.ogrenciAd || (ogrenci ? ogrenci.ad : "");
        var sinif = ders.sinif || (ogrenci ? ogrenci.sinif : "");
        var dersBilgi = DERS[ders.dersId];
        var hareketli = ders.kaynak === "takvim" && !kilitKapa; // kilit kapalıysa taşınabilir kart da kilitli
        if (hareketli) {
          // YERLEŞEN İSTEK KARTI: pastel yeşil, draggable (sadece kilit açıkken)
          satirlar += '<td class="px-1.5 py-1.5 text-center border-l border-slate-100">' +
            '<div draggable="true" ondragstart="istekDrag(event, \\'' + ders.id + '\\')" title="Sürükleyip başka boş saate taşıyabilirsin" class="dnd-kart rounded-lg border border-emerald-200 bg-emerald-50 px-1 py-1.5">' +
            '<div class="text-[10px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd) + '</div>' +
            (sinif ? '<div class="text-[8.5px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (ders.konu ? '<div class="text-[8px] text-slate-500 leading-tight mt-0.5" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(ders.konu) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[7.5px] font-bold mt-0.5 text-emerald-700">' + dersBilgi.ad + '</div>' : '') +
            '</div></td>';
        } else {
          // Formdan planlanmış ders veya kilitli kart
          var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
          satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border ' + durumRenk + ' px-1 py-1.5" title="Dolu">' +
            '<div class="text-[10px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd) + '</div>' +
            (sinif ? '<div class="text-[8.5px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (ders.konu ? '<div class="text-[8px] text-slate-500 leading-tight mt-0.5" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(ders.konu) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[7.5px] font-bold mt-0.5 ' + dersBilgi.tx + '">' + dersBilgi.ad + '</div>' : '') +
            '</div></td>';
        }
      } else {`;
must(src.indexOf(OLD_HO_DERS) >= 0, "haftalik ders cell");
src = src.replace(OLD_HO_DERS, NEW_HO_DERS);
done("haftalik lesson cells: rich content (student+class+topic)");

// sınıf dersi hücresi + musait değil + pazar kontrolünde kilit/kilitKapa ile saatYazi
const OLD_HO_SINIF = `      if (isPazar || musaitDegil) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100"><span class="text-[9px] text-slate-400">' + (isPazar ? "Pazar" : "—") + '</span></td>';
      } else if (sinifVar) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg bg-rose-100 border border-rose-200 px-1 py-1.5" title="Sınıf dersi — kilitli">' +
          '<div class="text-[8px] font-bold text-rose-700 leading-tight truncate whitespace-nowrap">' + esc((avail.sinif[key] || 'Sınıf').substring(0, 14)) + '</div></div></td>';
      } else if (ders) {`;
const NEW_HO_SINIF = `      if (isPazar || musaitDegil) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100"><span class="text-[9px] text-slate-400">' + (isPazar ? "Pazar" : "—") + '</span></td>';
      } else if (sinifVar) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg bg-rose-100 border border-rose-200 px-1 py-1.5" title="Sınıf dersi — kilitli">' +
          '<div class="text-[8px] font-bold text-rose-700 leading-tight truncate whitespace-nowrap">' + esc((avail.sinif[key] || 'Sınıf').substring(0, 14)) + '</div></div></td>';
      } else if (ders) {`;
// (aynı — sınıf hücresi zaten kilitli; değişiklik gerekmedi)

/* ============================================================
   9) haftalik başlık rozeti: kilit durumu
   ============================================================ */
const OLD_HO_BADGE = `      '<span class="ml-auto hidden md:inline-flex items-center gap-1.5 rounded-full bg-white border border-teal-200 text-teal-600 text-[10.5px] font-bold px-3 py-1.5"><i class="fa-solid fa-hand-pointer"></i> İstek kartlarını boş hücrelere bırakın · yeşil kartları sürükleyip taşıyın</span>' +`;
const NEW_HO_BADGE = `      kilidAnahtariHtml() +`;
must(src.indexOf(OLD_HO_BADGE) >= 0, "haftalik badge");
src = src.replace(OLD_HO_BADGE, NEW_HO_BADGE);
done("haftalik header: lock switch replaces hint badge");

/* ============================================================
   10) istekBurak: kilit + mola koruması
   ============================================================ */
const OLD_IB = `  // Kilit kontrolü: hücre bu arada dolmuşsa veya öğretmen o saatte kilitliyse bırakmayı reddet
  var di = dowIdx(tarih), sNum = parseInt(saat.split(":")[0], 10);
  var key = di + "-" + sNum;
  var dolu = DB.dersler.some(function (l) { return l.ogretmenId === ogrtId && l.tarih === tarih && l.saat === saat && l.durum !== "iptal" && l.id !== istekId; });
  var pazar = di === 6; // Pazar: kurum tamamen kapalı
  var kilitli = dolu || pazar || (t.avail && ((t.avail.sinif && key in t.avail.sinif) || t.avail.musait.indexOf(key) >= 0));
  if (kilitli) { toast("Bu saat kilitli ya da dolu — kart bırakılamadı.", "hata"); renderDersler(); return; }`;
const NEW_IB = `  // Düzenleme Kilidi: kapalıysa hiçbir bırakma yapılamaz
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — takvimlere sürükle-bırak için kilidi açın.", "hata"); renderDersler(); return; }

  // Kilit kontrolü: hücre bu arada dolmuşsa veya öğretmen o saatte kilitliyse bırakmayı reddet
  var di = dowIdx(tarih), sNum = parseInt(saat.split(":")[0], 10);
  var key = di + "-" + sNum;
  var dolu = DB.dersler.some(function (l) { return l.ogretmenId === ogrtId && l.tarih === tarih && l.saat === saat && l.durum !== "iptal" && l.id !== istekId; });
  var pazar = di === 6; // Pazar: kurum tamamen kapalı
  var molaSaati = sNum === MOLA_SAAT; // Öğle molası: 12:00-13:00 kilitli
  var kilitli = dolu || pazar || molaSaati || (t.avail && ((t.avail.sinif && key in t.avail.sinif) || t.avail.musait.indexOf(key) >= 0));
  if (kilitli) { toast(molaSaati ? "Öğle molası (12:00-13:00) kilitli — bu saate ders bırakılamaz." : "Bu saat kilitli ya da dolu — kart bırakılamadı.", "hata"); renderDersler(); return; }`;
must(src.indexOf(OLD_IB) >= 0, "istekBurak kilit");
src = src.replace(OLD_IB, NEW_IB);
done("istekBurak: edit-lock + mola guards");

/* ============================================================
   11) planla(): saat doğrulaması yeni çizelgeye göre
   ============================================================ */
const OLD_PLAAN = `  else {
    var dk = saat.split(":")[1];
    var sNum = parseInt(saat.split(":")[0], 10);
    if (dk !== "00") hatalar.push("Dersler saat başı başlar — dakika “00” olmalı (örn. 16:00).");
    if (sNum < 9 || sNum > 19) hatalar.push("Ders saatleri 09:00 – 19:00 arasındadır.");
  }`;
const NEW_PLAAN = `  else {
    var dk = saat.split(":")[1];
    var sNum = parseInt(saat.split(":")[0], 10);
    if (sNum === MOLA_SAAT && dk === "00") hatalar.push("12:00 öğle molası saatidir — bu saate ders eklenemez.");
    else if (dk !== "00") hatalar.push("Dersler saat başı başlar — dakika “00” olmalı (örn. 16:00).");
    if (!gecerliDersSaati(sNum) && hatalar.indexOf("12:00 öğle molası saatidir — bu saate ders eklenemez.") < 0)
      hatalar.push("Geçersiz ders saati. Geçerli slotlar: " + SLOT_BILGI.filter(function(b,i){return i!==MOLA_SLOT;}).map(function(b){return b.no+". "+slotAralikYazi(b);}).join(", ") + ".");
  }`;
must(src.indexOf(OLD_PLAAN) >= 0, "planla validation");
src = src.replace(OLD_PLAAN, NEW_PLAAN);
done("planla: new-slot validation incl. lunch ban");

/* ============================================================
   12) gunlukTablo: yeni slot listesi + 12:00 mola
   ============================================================ */
const OLD_SLOTS = `  // Saat slotları: 09:00 - 20:00 (12 slot, mola 12:00-13:00 arası)
  var SAAT_SLOTLARI = [
    { s: 9, e: 10, no: "1" },
    { s: 10, e: 11, no: "2" },
    { s: 11, e: 12, no: "3" },
    { s: 12, e: 13, no: "Mola", mola: true },
    { s: 13, e: 14, no: "4" },
    { s: 14, e: 15, no: "5" },
    { s: 15, e: 16, no: "6" },
    { s: 16, e: 17, no: "7" },
    { s: 17, e: 18, no: "8" },
    { s: 18, e: 19, no: "9" },
    { s: 19, e: 20, no: "10" }
  ];`;
const NEW_SLOTS = `  // Saat slotları: yeni çizelge (11 ders + 12:00-13:00 kilitli öğle molası)
  var SAAT_SLOTLARI = SLOT_BILGI.map(function (b, i) {
    return { s: b.s, e: b.e, no: b.no, mola: i === MOLA_SLOT };
  });`;
must(src.indexOf(OLD_SLOTS) >= 0, "gunluk slots");
src = src.replace(OLD_SLOTS, NEW_SLOTS);
done("gunlukTablo: slots from SLOT_BILGI (mola 12:00)");

// gunlukTablo saat alt yazıları :00 yerine gerçek aralık (s→e)
const OLD_GUNLUK_HEAD = `  SAAT_SLOTLARI.forEach(function (slot) {
    var bg = slot.mola ? 'bg-emerald-200' : 'bg-slate-50';
    var textColor = slot.mola ? 'text-emerald-700' : 'text-slate-600';
    html += '<th class="px-2 py-2 border-r border-slate-200 ' + bg + '" style="min-width:72px">' +
      '<div class="text-[12px] font-black ' + textColor + '">' + slot.no + '</div>' +
      '<div class="text-[9px] font-semibold text-slate-400">' + String(slot.s).padStart(2,"0") + ":" + "00" + '</div>' +
      '<div class="text-[9px] font-semibold text-slate-400">' + String(slot.e).padStart(2,"0") + ":" + "00" + '</div>' +
      '</th>';
  });`;
const NEW_GUNLUK_HEAD = `  SAAT_SLOTLARI.forEach(function (slot) {
    var bg = slot.mola ? 'bg-emerald-200' : 'bg-slate-50';
    var textColor = slot.mola ? 'text-emerald-700' : 'text-slate-600';
    html += '<th class="px-2 py-2 border-r border-slate-200 ' + bg + '" style="min-width:72px">' +
      '<div class="text-[11px] font-black ' + textColor + '">' + (slot.mola ? "☕" : slot.no) + '</div>' +
      '<div class="text-[8.5px] font-semibold text-slate-400">' + String(slot.s).padStart(2,"0") + ":00</div>" +
      '<div class="text-[8.5px] font-semibold text-slate-400">' + String(slot.e).padStart(2,"0") + ":00</div>" +
      '</th>';
  });`;
must(src.indexOf(OLD_GUNLUK_HEAD) >= 0, "gunluk header cells");
src = src.replace(OLD_GUNLUK_HEAD, NEW_GUNLUK_HEAD);
done("gunlukTablo: header shows slot numbers with real ranges");

/* ============================================================
   13) seedDB: yeni slot modeline göre örnek veriler
   ============================================================ */
// a) ogretmen avail sinif/musait anahtarları — eski "0-9" 09:00 → yeni slotlarda tutarlı olsun.
//    Eski seed anahtarları zaten SAATLER içinde (9..19); mola dışı slotlar geçerli.
//    Yalnız 12:00 (eski mola saatine denk gelen "g-12") kullanılan yerleri 13:00'e kaydır.
const OLD_SEED_12 = `db.sinifProg = {
    "MEZUN SAY 1": ["0-9","2-9","3-9","5-9","0-10"],`;
const NEW_SEED_12 = `db.sinifProg = {
    "MEZUN SAY 1": ["0-9","2-9","3-9","5-9","0-10"],`;
// (seed anahtarları zaten 9..19 aralığında — mola saatine (12) denk gelen yok; kontrol edelim)
must(src.indexOf('"0-12"') < 0 && src.indexOf('"1-12"') < 0 && src.indexOf('"2-12"') < 0, "seed has no 12:00 slots");
// b) seed ders saatleri: r[2] 13 → 13:00 (5. ders) zaten geçerli; 9..19 arası geçerli slotlar.
//    12 saatli eski kullanım yok.
done("seed verified: no 12:00 slot usage");

/* ============================================================
   14) CSS: dnd-kapali + kilit görselleri
   ============================================================ */
const CSS_ANCHOR = `    .dnd-kart { cursor: grab; transition: box-shadow .12s ease; }
    .dnd-kart:active { cursor: grabbing; }
    .dnd-kart:hover { box-shadow: 0 0 0 2px #6ee7b7; }`;
const CSS_NEW = `    .dnd-kart { cursor: grab; transition: box-shadow .12s ease; }
    .dnd-kart:active { cursor: grabbing; }
    .dnd-kart:hover { box-shadow: 0 0 0 2px #6ee7b7; }
    /* Düzenleme kilidi kapalı: bırakma alanı pasif */
    .dnd-bos.dnd-kapali { cursor: not-allowed; }
    .dnd-bos.dnd-kapali:hover { background-color: #f8fafc; box-shadow: inset 0 0 0 1.5px #e2e8f0; }
    /* Mola sütunu/satırı */
    .mola-hucre { cursor: not-allowed; }`;
must(src.indexOf(CSS_ANCHOR) >= 0, "css anchor");
src = src.replace(CSS_ANCHOR, CSS_NEW);
done("CSS: dnd-kapali + mola styles");

fs.writeFileSync(P, src);
console.log("PATCH OK — " + steps.length + " steps:");
steps.forEach(function (s, i) { console.log("  " + (i + 1) + ". " + s); });
console.log("size: " + ORIG + " → " + src.length);