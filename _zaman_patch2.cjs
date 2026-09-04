const fs = require("fs");
const P = "index.html";
let src = fs.readFileSync(P, "utf8");
const ORIG = src.length;
let steps = [];
function done(name) { steps.push(name); fs.writeFileSync(P, src); }
function must(c, m) { if (!c) { console.error("FAIL: " + m); process.exit(1); } }

/* ============================================================
   1) SLOT modeli v2: 11 DERS + MOLA idx4 — slot INDEX anahtarları
   SAATLER = [0..11] (slot indeksleri), SLOT_BILGI[i] = {s,e,no}
   anahtar biçimi: "gun-slot" (örn. "0-0" = Pzt 1. ders)
   ============================================================ */
const OLD_SLOT = `// ---------- Zaman çizelgesi (11 ders + kilitli öğle molası) ----------
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
  SLOT_BILGI.sh.push = Array.prototype.push; // satır sonu koruma (kullanılmıyor)
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

const NEW_SLOT = `// ---------- Zaman çizelgesi (11 ders + 12:00-13:00 kilitli öğle molası) ----------
// SLOT_BILGI[i] = { s: başlangıç saati (gösterim), e: bitiş, no: "1".."11" }
// Slot ANAHTARLARI INDEX tabanlıdır: SAATLER = [0..11], mola index'i MOLA_SLOT.
var SAATLER = [];
var SLOT_BILGI = [
  { s: "08:50", e: "09:30", no: "1"  },  // slot 0
  { s: "09:40", e: "10:20", no: "2"  },  // slot 1
  { s: "10:30", e: "11:10", no: "3"  },  // slot 2
  { s: "11:20", e: "12:00", no: "4"  },  // slot 3
  { s: "12:00", e: "13:00", no: "Mola", mola: true }, // slot 4 — KİLİTLİ
  { s: "13:00", e: "13:40", no: "5"  },  // slot 5
  { s: "13:50", e: "14:30", no: "6"  },  // slot 6
  { s: "14:40", e: "15:20", no: "7"  },  // slot 7
  { s: "15:30", e: "16:10", no: "8"  },  // slot 8
  { s: "16:20", e: "17:00", no: "9"  },  // slot 9
  { s: "17:10", e: "17:50", no: "10" },  // slot 10
  { s: "18:00", e: "18:40", no: "11" }   // slot 11
];
var MOLA_SLOT = 4;                       // SLOT_BILGI[4] = öğle molası (ders eklenemez)
var SAATLER = SLOT_BILGI.map(function (b, i) { return i; }); // slot indeksleri [0..11]
function gecerliSlot(i) { return SAATLER.indexOf(i) >= 0 && i !== MOLA_SLOT; }
function slotSaatYazi(i) { return SLOT_BILGI[i] ? SLOT_BILGI[i].s : "—"; }
function slotAralikYazi(b) { return b.s + "-" + b.e; }
function slotEtiket(i) { return SLOT_BILGI[i].no + ". Ders (" + slotAralikYazi(SLOT_BILGI[i]) + ")"; }
// Eski model (saat başı 09:00..19:00, key "g-HH") → yeni slot index dönüşümü
var ESKI_SAAT_SLOTLARI = { 9: 0, 10: 1, 11: 2, 12: 3, 13: 5, 14: 6, 15: 7, 16: 8, 17: 9, 18: 10, 19: 11, 20: 11 };
function eskiSaatToSlot(v) {
  var h = parseInt(String(v).split(":")[0], 10);
  return ESKI_SAAT_SLOTLARI[h] == null ? null : ESKI_SAAT_SLOTLARI[h];
}
function saatDonustur(v) {
  var si = eskiSaatToSlot(v);
  return si == null ? String(v || "") : String(si);
}
function saatKeyDonustur(k) {
  var p = String(k || "").split("-");
  if (p.length !== 2) return k;
  var si = eskiSaatToSlot(p[1]);
  return si == null ? null : p[0] + "-" + si;
}
function eskiKeyMi(k) {
  var h = parseInt(String(k).split("-").pop(), 10);
  return !isNaN(h) && h >= 8 && h <= 20; // 0..11 dışındaki değerler eski modeldir
}`;

const OLD_SAATLER2 = `// ---------- Zaman çizelgesi (11 ders + kilitli öğle molası) ----------
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

if (src.indexOf("SLOT_BILGI = [")==-1){
  if (src.indexOf(OLD_SLOT) >= 0) src = src.replace(OLD_SLOT, NEW_SLOT);
  else if (src.indexOf(OLD_SAATLER2) >= 0) src = src.replace(OLD_SAATLER2, NEW_SLOT);
  else must(false, "old slot model");
}
done("SLOT model v2: 11 ders + mola idx4 + index keys");

/* ============================================================
   2) LS v1→v2 migration in loadDB/normalize
   ============================================================ */
const OLD_LS = `var LS_KEY = "yksOto_arsiv_v1";`;
const NEW_LS = `var LS_KEY = "yksOto_arsiv_v2";         // yeni slot modeli
var LS_KEY_ESKI = "yksOto_arsiv_v1";    // saat-bazlı eski model (otomatik taşınır)`;
if (src.indexOf("LS_KEY_ESKI")==-1){
  must(src.indexOf(OLD_LS) >= 0, "LS_KEY");
  src = src.replace(OLD_LS, NEW_LS);
  done("LS_KEY → v2 with legacy key constant");
}

const OLD_LOAD = `function loadDB() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) { var d = JSON.parse(raw); if (d && d.dersler) return normalize(d); }
  } catch (e) { /* bozuk kayıt -> yeniden kur */ }
  return null;
}`;
const NEW_LOAD = `function loadDB() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) { var d = JSON.parse(raw); if (d && d.dersler) return normalize(d); }
    // eski (saat-bazlı) arşivi yeni slot modeline otomatik taşı
    var rawEski = localStorage.getItem(LS_KEY_ESKI);
    if (rawEski) {
      var dE = JSON.parse(rawEski);
      if (dE && dE.dersler) {
        var tasinar = migrateEski(dE);
        saveDB(); // yeni anahtara yaz
        return normalize(tasinar);
      }
    }
  } catch (e) { /* bozuk kayıt -> yeniden kur */ }
  return null;
}
// Eski saat-bazlı veriyi (key "g-HH", saat "HH:00") yeni slot-index modeline dönüştürür
function migrateEski(d) {
  (d.dersler || []).forEach(function (l) {
    if (typeof l.saat === "string" && isNaN(parseInt(l.saat, 10)) === false && String(parseInt(l.saat, 10)) === l.saat.trim()) {
      // zaten "0".."11" biçiminde (slot index) — dokunma
    } else {
      var si = eskiSaatToSlot(l.saat);
      if (si != null) l.saat = String(si); else l.saat = "11";
    }
  });
  Object.keys(d.sinifProg || {}).forEach(function (sAd) {
    if (Array.isArray(d.sinifProg[sAd])) {
      d.sinifProg[sAd] = d.sinifProg[sAd].map(saatKeyDonustur).filter(function (k) { return k != null; });
    }
  });
  (d.ogretmenler || []).forEach(function (t) {
    if (t.avail) {
      if (Array.isArray(t.avail.sinif)) {
        var o = {}; t.avail.sinif.forEach(function (k) { o[k] = "Sınıf Dersi"; }); t.avail.sinif = o;
      }
      if (t.avail.sinif && typeof t.avail.sinif === "object") {
        var yS = {};
        Object.keys(t.avail.sinif).forEach(function (k) {
          var nk = saatKeyDonustur(k); if (nk) yS[nk] = t.avail.sinif[k];
        });
        t.avail.sinif = yS;
      }
      if (Array.isArray(t.avail.musait)) {
        t.avail.musait = t.avail.musait.map(saatKeyDonustur).filter(function (k) { return k != null; });
      }
    }
  });
  return d;
}`;
if (src.indexOf("migrateEski")==-1){
  must(src.indexOf(OLD_LOAD) >= 0, "loadDB");
  src = src.replace(OLD_LOAD, NEW_LOAD);
  done("loadDB: v1→v2 auto-migration via migrateEski");
}

// normalize: sinifProg v2 doğrulaması (slot index 0..11, mola hariç) + ders saat kontrolü
const OLD_NORM2 = `  d.sinifProg = d.sinifProg && typeof d.sinifProg === "object" ? d.sinifProg : {};
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
const NEW_NORM2 = `  d.sinifProg = d.sinifProg && typeof d.sinifProg === "object" ? d.sinifProg : {};
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
if (src.indexOf(OLD_NORM2) >= 0){
  src = src.replace(OLD_NORM2, NEW_NORM2);
  done("normalize simplified (v1 conversion centralized in migrateEski)");
}

/* ============================================================
   3) seedDB: slot-index anahtarlarına taşı ("0-9"→"0-0" vb.)
   ESKİ_SLOTLAMA: 9→0, 10→1, 11→2, 12→3, 13→5, 14→6, 15→7, 16→8, 17→9, 18→10, 19→11
   ============================================================ */
const eskiMap = { 9: "0", 10: "1", 11: "2", 12: "3", 13: "5", 14: "6", 15: "7", 16: "8", 17: "9", 18: "10", 19: "11" };
// öğretmen avail satırları (sinif objeleri) + tüm "g-HH" key'leri slot index'e taşı
src = src.replace(/"(\d)-(\d+)"/g, function (m, g, h) {
  if (eskiMap[h] == null) return m;
  return '"' + g + "-" + eskiMap[h] + '"';
});
src = src.replace(/"(\d)-(\d+)":/g, function (m, g, h) {
  if (eskiMap[h] == null) return m;
  return '"' + g + "-" + eskiMap[h] + '":';
});
src = src.replace(/\["((?:\d-\d+,? ?)+)\"]/g, function (m, inner) {
  const parts = inner.split(",").map(function (s) { return s.trim().replace(/"/g, ""); }).filter(Boolean);
  const mapped = parts.map(function (k) {
    const mm = k.match(/^(\d)-(\d+)$/);
    if (!mm) return '"' + k + '"';
    return '"' + mm[1] + "-" + (eskiMap[mm[2]] != null ? eskiMap[mm[2]] : mm[2]) + '"';
  });
  return "[" + mapped.join(",") + "]";
});
// seed ders saatleri: String(r[2]).padStart(2,"0")+":00" → slot index string
const OLD_SEED_SAAT = `      saat: String(r[2]).padStart(2, "0") + ":00",`;
const NEW_SEED_SAAT = `      saat: String(ESKI_SAAT_SLOTLARI[r[2]] != null ? ESKI_SAAT_SLOTLARI[r[2]] : 11),`;
must(src.indexOf(OLD_SEED_SAAT) >= 0, "seed saat");
src = src.replace(OLD_SEED_SAAT, NEW_SEED_SAAT);
done("seed keys + lesson hours → slot indices");

/* ============================================================
   4) gridTablo: slot-index tabanlı, mola satırı, kilit, sınıf-öğretmen rozeti
   ============================================================ */
const OLD_GRID_START = `function gridTablo(onclickOnce, avail, tip, sinifOgrtMap) {
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

const NEW_GRID2 = `function gridTablo(onclickOnce, avail, tip, sinifOgrtMap) {
  var kilitli = !ui.duzenlemeAcik; // Düzenleme Kilidi: kapalıysa hiçbir hücre düzenlenemez
  var h = "<thead><tr><th class='sticky left-0 bg-slate-50/80'></th>";
  for (var g = 0; g < 7; g++) h += '<th class="py-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">' + GUN_KISA[g] + "</th>";
  h += "</tr></thead><tbody>";
  SLOT_BILGI.forEach(function (bil, sIdx) {
    var key = sIdx; // slot INDEX anahtarı
    var mola = sIdx === MOLA_SLOT;
    h += "<tr>";
    if (mola) {
      h += '<td class="sticky left-0 bg-emerald-50 pr-2 text-[10px] font-extrabold text-emerald-600 text-right whitespace-nowrap">☕ Öğle Molası<br><span class=\\"text-[9px] font-semibold text-emerald-400\\">12:00-13:00</span></td>';
    } else {
      h += '<td class="sticky left-0 bg-white pr-2 text-[10px] font-bold text-slate-400 text-right whitespace-nowrap">' + bil.no + ". Ders<br><span class=\\"text-[9px] font-semibold text-slate-300\\">" + slotAralikYazi(bil) + "</span></td>";
    }
    for (var g2 = 0; g2 < 7; g2++) {
      var k = g2 + "-" + key;
      var durum = mola ? "mola"
        : tip === "ogretmen"
          ? ((avail.sinif && k in avail.sinif) ? "sinif" : avail.musait.indexOf(k) >= 0 ? "musait" : "")
          : (avail.indexOf(k) >= 0 ? "var" : "");
      var sinifOgrt = null;
      if (tip === "sinif" && durum === "var" && sinifOgrtMap) sinifOgrt = sinifOgrtMap[k] || null;
      if (tip === "ogretmen" && durum === "sinif" && sinifOgrtMap) sinifOgrt = sinifOgrtMap[k] || null;
      var cls = "hucreBtn border ";
      var baslik = GUN_KISA[g2] + " " + bil.no + ". Ders (" + slotAralikYazi(bil) + ")";
      if (mola) { cls += "bg-emerald-100 border-emerald-200 cursor-not-allowed"; baslik = "Öğle Molası 12:00-13:00 — ders eklenemez"; }
      else if (durum === "sinif") { cls += "bg-amber-200 border-amber-300" + (kilitli ? "" : " hover:bg-amber-300"); baslik += " · Sınıf Dersi"; }
      else if (durum === "musait") { cls += "bg-rose-200 border-rose-300" + (kilitli ? "" : " hover:bg-rose-300"); baslik += " · Müsait Değil"; }
      else if (durum === "var") { cls += "bg-blue-200 border-blue-300" + (kilitli ? "" : " hover:bg-blue-300"); baslik += " · Toplu ders"; }
      else { cls += "bg-white border-slate-200" + (kilitli ? " cursor-not-allowed" : " hover:border-teal-300 hover:bg-teal-50"); baslik += kilitli ? " · Düzenleme kapalı" : " · Boş"; }
      var icerik = "";
      if (mola) icerik = '<span class="text-[8.5px] font-extrabold text-emerald-600/80">MOLA</span>';
      else if (durum === "sinif") {
        icerik = sinifOgrt
          ? '<div class="leading-tight"><span class="block text-[7px] font-extrabold text-amber-800/90 whitespace-nowrap">' + esc(String(sinifOgrt.ad).substring(0, 12)) + '</span><span class="block text-[6.5px] font-bold text-amber-600/80 whitespace-nowrap">' + esc(String(sinifOgrt.dersAd).substring(0, 10)) + '</span></div>'
          : '<span class="text-[7.5px] font-extrabold text-amber-700/80 leading-tight whitespace-nowrap">' + esc(String((avail.sinif && avail.sinif[k]) || "Sınıf Dersi").substring(0, 14)) + '</span>';
      }
      else if (durum === "musait") icerik = '<span class="text-[8.5px] font-extrabold text-rose-500/70">MD</span>';
      else if (durum === "var") {
        icerik = sinifOgrt
          ? '<div class="rounded-md bg-white/70 border border-blue-300 px-1 py-0.5 leading-tight"><span class="block text-[7px] font-extrabold text-blue-800/90 whitespace-nowrap">' + esc(String(sinifOgrt.ad).substring(0, 12)) + '</span><span class="block text-[6.5px] font-bold text-blue-600/80 whitespace-nowrap">' + esc(String(sinifOgrt.dersAd).substring(0, 10)) + '</span></div>'
          : '<span class="text-[8.5px] font-extrabold text-blue-600/60">DV</span>';
      }
      var disable = kilitli || mola ? "disabled " : "";
      h += '<td class="p-0.5"><button ' + disable + 'class="' + cls + '" title="' + baslik + '"' +
        (!kilitli && !mola ? ' onclick="' + onclickOnce + "," + g2 + "," + key + ')"' : "") + ">" + icerik + "</button></td>";
    }
    h += "</tr>";
  });
  h += "</tbody>";
  return '<div class="overflow-x-auto rounded-xl border border-slate-100"><table class="w-full min-w-[700px] text-center border-separate border-spacing-0.5">' + h + "</table></div>";
}`;

if (src.indexOf(OLD_GRID_START) >= 0) src = src.replace(OLD_GRID_START, NEW_GRID2);
else must(false, "gridTablo v1");
done("gridTablo: slot-index keys + mola row + lock + badges");

/* ============================================================
   5) togOgr / togSinif: slot-index uyumu
   togOgr(tid, di, sIdx) — key di+"-"+sIdx
   ============================================================ */
const OLD_TOGOGR2 = `function togOgr(tid, di, saat) {
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — değişiklik için üstteki kilidi açın.", "uyari"); return; }
  if (saat === MOLA_SAAT) { toast("Öğle molasına ders eklenemez.", "hata"); return; }
  var t = DB.ogretmenler.find(function (x) { return x.id === tid; });
  if (!t) return;
  var k = di + "-" + saat;`;
const NEW_TOGOGR2 = `function togOgr(tid, di, sIdx) {
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — değişiklik için üstteki kilidi açın.", "uyari"); return; }
  if (parseInt(sIdx, 10) === MOLA_SLOT) { toast("Öğle molasına (12:00-13:00) ders eklenemez.", "hata"); return; }
  var t = DB.ogretmenler.find(function (x) { return x.id === tid; });
  if (!t) return;
  var k = di + "-" + sIdx;`;
must(src.indexOf(OLD_TOGOGR2) >= 0, "togOgr v1");
src = src.replace(OLD_TOGOGR2, NEW_TOGOGR2);
done("togOgr: slot-index params");

const OLD_TOGSINIF2 = `function togSinif(sinifAd, di, saat) {
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — değişiklik için üstteki kilidi açın.", "uyari"); return; }
  if (saat === MOLA_SAAT) { toast("Öğle molasına ders eklenemez.", "hata"); return; }
  if (!DB.sinifProg[sinifAd]) DB.sinifProg[sinifAd] = [];
  var key = di + "-" + saat;`;
const NEW_TOGSINIF2 = `function togSinif(sinifAd, di, sIdx) {
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — değişiklik için üstteki kilidi açın.", "uyari"); return; }
  if (parseInt(sIdx, 10) === MOLA_SLOT) { toast("Öğle molasına (12:00-13:00) ders eklenemez.", "hata"); return; }
  if (!DB.sinifProg[sinifAd]) DB.sinifProg[sinifAd] = [];
  var key = di + "-" + sIdx;`;
must(src.indexOf(OLD_TOGSINIF2) >= 0, "togSinif v1");
src = src.replace(OLD_TOGSINIF2, NEW_TOGSINIF2);
done("togSinif: slot-index params");

/* ============================================================
   6) duzeltmeBul: saat → slot index
   ============================================================ */
const OLD_DUZ = `function duzeltmeBul(adet, yokSay) {
  var saatNum = parseInt(adet.saat.split(":")[0], 10);
  var di = dowIdx(adet.tarih);
  var key = di + "-" + saatNum;`;
const NEW_DUZ = `function duzeltmeBul(adet, yokSay) {
  var saatNum = parseInt(String(adet.saat).indexOf(":") >= 0 ? adet.saat.split(":")[0] : adet.saat, 10); // slot index veya eski saat
  var di = dowIdx(adet.tarih);
  var key = di + "-" + saatNum;`;
must(src.indexOf(OLD_DUZ) >= 0, "duzeltmeBul");
src = src.replace(OLD_DUZ, NEW_DUZ);
done("duzeltmeBul: slot-index key");

// duzeltmeBul uyarı metinlerinde saat gösterimi: "GÜN 09:00" yerine slot etiketi
const OLD_DUZTXT = `    if (tip === "sinif") uyari.push(ogr.ad + " öğretmeninin o saatte <b>Sınıf Dersi</b> var (" + GUN_KISA[di] + " " + String(saatNum).padStart(2, "0") + ":00).");`;
const NEW_DUZTXT = `    if (tip === "sinif") uyari.push(ogr.ad + " öğretmeninin o saatte <b>Sınıf Dersi</b> var (" + GUN_KISA[di] + " " + slotEtiket(saatNum) + ").");`;
must(src.indexOf(OLD_DUZTXT) >= 0, "duzeltme text");
src = src.replace(OLD_DUZTXT, NEW_DUZTXT);
done("duzeltmeBul: slot label in warnings");

/* ============================================================
   7) planla(): slot select doğrulaması (f-saat artık select)
   ============================================================ */
const OLD_PLAAN2 = `  else {
    var dk = saat.split(":")[1];
    var sNum = parseInt(saat.split(":")[0], 10);
    if (sNum === MOLA_SAAT && dk === "00") hatalar.push("12:00 öğle molası saatidir — bu saate ders eklenemez.");
    else if (dk !== "00") hatalar.push("Dersler saat başı başlar — dakika “00” olmalı (örn. 16:00).");
    if (!gecerliDersSaati(sNum) && hatalar.indexOf("12:00 öğle molası saatidir — bu saate ders eklenemez.") < 0)
      hatalar.push("Geçersiz ders saati. Geçerli slotlar: " + SLOT_BILGI.filter(function(b,i){return i!==MOLA_SLOT;}).map(function(b){return b.no+". "+slotAralikYazi(b);}).join(", ") + ".");
  }`;
const NEW_PLAAN2 = `  else {
    var sNum = parseInt(String(saat).indexOf(":") >= 0 ? saat.split(":")[0] : saat, 10);
    if (isNaN(sNum)) hatalar.push("Ders slotu seçin.");
    else if (sNum === MOLA_SLOT) hatalar.push("Öğle molası (12:00-13:00) slotuna ders eklenemez.");
    else if (!gecerliSlot(sNum)) hatalar.push("Geçersiz ders slotu — lütfen listeden bir ders saati seçin.");
  }`;
must(src.indexOf(OLD_PLAAN2) >= 0, "planla validation v1");
src = src.replace(OLD_PLAAN2, NEW_PLAAN2);
done("planla: slot-index validation");

/* ============================================================
   8) f-saat: time input → slot select (statik HTML)
   ============================================================ */
const OLD_FSAAT = `        <input id="f-saat" type="time" value="16:00" step="3600"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400" />`;
const NEW_FSAAT = `        <select id="f-saat"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"></select>`;
must(src.indexOf(OLD_FSAAT) >= 0, "f-saat input");
src = src.replace(OLD_FSAAT, NEW_FSAAT);
done("f-saat → slot select");

// f-saat select'i dolduran fonksiyon + temizleForm/duzenle uyumu
const OLD_TEMIZLE = `function temizleForm() {
  $("f-ogrenci").value = "";
  $("f-konu").value = "";
  $("f-ogretmen").value = "";
  $("f-tarih").value = "";
  $("f-saat").value = "16:00";
  $("f-yoksay").checked = false;
  $("cakismaUyari").classList.add("hidden");
}`;
const NEW_TEMIZLE = `function saatSecenekleri() {
  var ops = '<option value="" disabled>Ders saati seçin</option>';
  SLOT_BILGI.forEach(function (b, i) {
    if (i === MOLA_SLOT) {
      ops += '<option value="' + i + '" disabled>☕ Öğle Molası (12:00-13:00) — kilitli</option>';
    } else {
      ops += '<option value="' + i + '">' + b.no + ". Ders — " + b.s + " - " + b.e + "</option>";
    }
  });
  return ops;
}
function fSaatDoldur(secili) {
  var el = $("f-saat"); if (!el) return;
  el.innerHTML = saatSecenekleri();
  el.value = secili != null ? String(secili) : "5"; // varsayılan 5. ders (13:00)
}
fSaatDoldur();
function temizleForm() {
  $("f-ogrenci").value = "";
  $("f-konu").value = "";
  $("f-ogretmen").value = "";
  $("f-tarih").value = "";
  fSaatDoldur("5");
  $("f-yoksay").checked = false;
  $("cakismaUyari").classList.add("hidden");
}`;
must(src.indexOf(OLD_TEMIZLE) >= 0, "temizleForm");
src = src.replace(OLD_TEMIZLE, NEW_TEMIZLE);
done("fSaatDoldur + saatSecenekleri + temizleForm slot select");

// duzenle(id): l.saat slot index string olarak select'e bağlanır
const OLD_DUZENLE = `  $("f-saat").value = l.saat;`;
const NEW_DUZENLE = `  fSaatDoldur(l.saat); $("f-saat").value = String(l.saat);`;
must(src.indexOf(OLD_DUZENLE) >= 0, "duzenle f-saat");
src = src.replace(OLD_DUZENLE, NEW_DUZENLE);
done("duzenle: preselect slot in select");

/* ============================================================
   9) haftalikOgrtTablo: slot-index tabanlı tam yeniden yazım
   ============================================================ */
const OLD_HO_ALL = src.slice(src.indexOf("function haftalikOgrtTablo() {"), src.indexOf("function istekDragOver("));
const NEW_HO_ALL = `function haftalikOgrtTablo() {
  var ogrtId = ui.haftalikOgrtId;
  if (!ogrtId) return "";
  var t = DB.ogretmenler.find(function(x){ return x.id === ogrtId; });
  if (!t) return "";
  var brans = DERS[t.brans];

  // Bu öğretmenin bu dönemin derslerini slot bazında eşle (key: "gün-slot")
  var p = pencere();
  var dersMap = {};
  DB.dersler.forEach(function (l) {
    if (l.ogretmenId !== t.id && (l.ogretmenAd || "") !== t.ad) return;
    if (l.durum === "iptal") return;
    if (p.start && (l.tarih < p.start || l.tarih > p.end)) return;
    var d = new Date(l.tarih + "T12:00:00");
    var gunIdx = (d.getDay() + 6) % 7;
    var sIdx = parseInt(String(l.saat).indexOf(":") >= 0 ? eskiSaatToSlot(l.saat) : l.saat, 10);
    if (isNaN(sIdx)) sIdx = parseInt(l.saat, 10) || 0;
    dersMap[gunIdx + "-" + sIdx] = l;
  });

  var avail = t.avail || { sinif: {}, musait: [] };
  var kilitKapa = !ui.duzenlemeAcik; // Düzenleme Kilidi kapalıysa sürükleme yok

  // Saat başlıkları: 11 ders slottu + kilitli öğle molası
  var saatBaslik = "";
  SLOT_BILGI.forEach(function (bil, bi) {
    if (bi === MOLA_SLOT) {
      saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100 bg-emerald-100' style='min-width:58px'>" +
        '<div class="text-[9.5px] font-extrabold text-emerald-600">☕ MOLA</div>' +
        '<div class="text-[8px] text-emerald-500">12:00-13:00</div></th>';
    } else {
      saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100' style='min-width:76px'>" +
        '<div class="text-[10px] font-extrabold text-slate-600">' + bil.no + ". Ders</div>" +
        '<div class="text-[8.5px] text-slate-400">' + slotAralikYazi(bil) + '</div></th>';
    }
  });

  var gunAdlari = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
  var satirlar = "";
  for (var g = 0; g < 7; g++) {
    var gunAd = gunAdlari[g];
    var isPazar = g === 6;
    var bg = g % 2 === 0 ? "bg-white" : "bg-slate-50/50";

    satirlar += '<tr class="border-b border-slate-100 ' + bg + '">';
    satirlar += '<td class="px-3 py-2 border-r border-slate-100 text-[11.5px] font-bold text-slate-600 whitespace-nowrap" style="min-width:100px">' + gunAd + '</td>';

    SLOT_BILGI.forEach(function (bil, sIdx) {
      var key = g + "-" + sIdx;
      if (sIdx === MOLA_SLOT) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-emerald-50"><span class="text-[9px] font-bold text-emerald-500">Mola</span></td>';
        return;
      }
      var ders = dersMap[key];
      var sinifVar = avail.sinif && (key in avail.sinif);
      var musaitDegil = avail.musait.indexOf(key) >= 0;

      if (isPazar || musaitDegil) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100"><span class="text-[9px] text-slate-400">' + (isPazar ? "Pazar" : "—") + '</span></td>';
      } else if (sinifVar) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg bg-rose-100 border border-rose-200 px-1 py-1.5" title="Sınıf dersi — kilitli">' +
          '<div class="text-[8px] font-bold text-rose-700 leading-tight truncate whitespace-nowrap">' + esc(String(avail.sinif[key] || "Sınıf").substring(0, 14)) + '</div></div></td>';
      } else if (ders) {
        var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
        var ogrenciAd = ders.ogrenciAd || (ogrenci ? ogrenci.ad : "");
        var sinif = ders.sinif || (ogrenci ? ogrenci.sinif : "");
        var dersBilgi = DERS[ders.dersId];
        var hareketli = ders.kaynak === "takvim" && !kilitKapa;
        if (hareketli) {
          satirlar += '<td class="px-1.5 py-1.5 text-center border-l border-slate-100">' +
            '<div draggable="true" ondragstart="istekDrag(event, \\'' + ders.id + '\\')" title="Sürükleyip başka boş saate taşıyabilirsin" class="dnd-kart rounded-lg border border-emerald-200 bg-emerald-50 px-1 py-1.5">' +
            '<div class="text-[10px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd) + '</div>' +
            (sinif ? '<div class="text-[8.5px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (ders.konu ? '<div class="text-[8px] text-slate-500 leading-tight mt-0.5" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(ders.konu) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[7.5px] font-bold mt-0.5 text-emerald-700">' + dersBilgi.ad + '</div>' : '') +
            '</div></td>';
        } else {
          var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
          satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border ' + durumRenk + ' px-1 py-1.5" title="Dolu — düzenleme kilidi açıkken yeşil kartlar taşınabilir">' +
            '<div class="text-[10px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd) + '</div>' +
            (sinif ? '<div class="text-[8.5px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (ders.konu ? '<div class="text-[8px] text-slate-500 leading-tight mt-0.5" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(ders.konu) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[7.5px] font-bold mt-0.5 ' + dersBilgi.tx + '">' + dersBilgi.ad + '</div>' : '') +
            '</div></td>';
        }
      } else {
        // BOŞ HÜCRE → DROP ZONE (yalnızca düzenleme kilidi açıkken aktif)
        var suruklenebilir = kilitKapa ? ' draggable="false"' : "";
        var bosCls = kilitKapa ? "dnd-bos dnd-kapali" : "dnd-bos";
        satirlar += '<td class="' + bosCls + ' px-1.5 py-1.5 text-center border-l border-slate-100 transition-colors"' + suruklenebilir +
          ' data-drop-ogrt="' + esc(t.id) + '" data-drop-gun="' + g + '" data-drop-saat="' + sIdx + '"' +
          ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)" ondrop="istekBurak(event, this, \\'' + esc(t.id) + '\\', \\'' + addDaysKey(p.start, g) + '\\', \\'' + sIdx + '\\')" title="' + (kilitKapa ? "Boş saat — düzenleme kilidi açık değil" : "Boş saat — havuzdan istek kartı sürükleyip bırakın") + '">' +
          '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
      }
    });
    satirlar += "</tr>";
  }

  return '<div class="rounded-2xl border border-slate-100 overflow-hidden mb-4">' +
    '<div class="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-slate-100">' +
      '<div class="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-sm shrink-0"><i class="fa-solid fa-calendar-week text-sm"></i></div>' +
      '<div><h3 class="text-[14px] font-extrabold text-slate-800">ÖĞRETMEN — ' + esc(t.ad.toUpperCase()) + '</h3>' +
      '<p class="text-[11px] text-slate-400">' + (brans ? brans.ad : 'Branş yok') + " · " + pencereAdi() + '</p></div>' +
      kilidAnahtariHtml() +
    '</div>' +
    '<div class="overflow-x-auto"><table class="w-full border-collapse">' +
      '<thead><tr class="bg-slate-50/80 border-b border-slate-100">' +
        '<th class="px-3 py-2 text-left border-r border-slate-100 text-[10.5px] font-extrabold text-slate-400 uppercase" style="min-width:100px">Gün</th>' +
        saatBaslik +
      '</tr></thead><tbody>' + satirlar + '</tbody></table></div></div>';
}

`;
src = src.replace(OLD_HO_ALL, NEW_HO_ALL);
done("haftalikOgrtTablo: full slot-index rewrite");

/* ============================================================
   10) istekBurak: slot-index parametreleri + mola/kilit koruması
   ============================================================ */
const OLD_IB_TAIL = `  // Düzenleme Kilidi: kapalıysa hiçbir bırakma yapılamaz
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — takvimlere sürükle-bırak için kilidi açın.", "hata"); renderDersler(); return; }

  // Kilit kontrolü: hücre bu arada dolmuşsa veya öğretmen o saatte kilitliyse bırakmayı reddet
  var di = dowIdx(tarih), sNum = parseInt(saat.split(":")[0], 10);
  var key = di + "-" + sNum;
  var dolu = DB.dersler.some(function (l) { return l.ogretmenId === ogrtId && l.tarih === tarih && l.saat === saat && l.durum !== "iptal" && l.id !== istekId; });
  var pazar = di === 6; // Pazar: kurum tamamen kapalı
  var molaSaati = sNum === MOLA_SAAT; // Öğle molası: 12:00-13:00 kilitli
  var kilitli = dolu || pazar || molaSaati || (t.avail && ((t.avail.sinif && key in t.avail.sinif) || t.avail.musait.indexOf(key) >= 0));
  if (kilitli) { toast(molaSaati ? "Öğle molası (12:00-13:00) kilitli — bu saate ders bırakılamaz." : "Bu saat kilitli ya da dolu — kart bırakılamadı.", "hata"); renderDersler(); return; }`;
const NEW_IB_TAIL = `  // Düzenleme Kilidi: kapalıysa hiçbir bırakma yapılamaz
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — takvimlere sürükle-bırak için kilidi açın.", "hata"); renderDersler(); return; }

  // Kilit kontrolü: hücre bu arada dolmuşsa veya öğretmen o saatte kilitliyse bırakmayı reddet
  var di = dowIdx(tarih), sIdx = parseInt(saat, 10);
  var key = di + "-" + sIdx;
  var dolu = DB.dersler.some(function (l) { return l.ogretmenId === ogrtId && l.tarih === tarih && String(l.saat) === String(saat) && l.durum !== "iptal" && l.id !== istekId; });
  var pazar = di === 6; // Pazar: kurum tamamen kapalı
  var molaSaati = sIdx === MOLA_SLOT; // Öğle molası: 12:00-13:00 kilitli
  var kilitli = dolu || pazar || molaSaati || (t.avail && ((t.avail.sinif && key in t.avail.sinif) || t.avail.musait.indexOf(key) >= 0));
  if (kilitli) { toast(molaSaati ? "Öğle molası (12:00-13:00) kilitli — bu saate ders bırakılamaz." : "Bu saat kilitli ya da dolu — kart bırakılamadı.", "hata"); renderDersler(); return; }`;
must(src.indexOf(OLD_IB_TAIL) >= 0, "istekBurak v1 tail");
src = src.replace(OLD_IB_TAIL, NEW_IB_TAIL);
done("istekBurak: slot-index + mola + edit-lock");

/* ============================================================
   11) gunlukTablo: mola + öğretmen zengin hücreleri (sadece slot değişimi)
   SAAT_SLOTLARI zaten SLOT_BILGI'den geliyor — satır render'ında mola kontrolü var.
   (Öğretmen hücre içerikleri zenginleştirildi: ad+sınıf+ders)
   ============================================================ */
const OLD_GT_CELL = `        var ders = saatMap[slot.s];
        if (ders) {
          var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
          var sinif = ogrenci ? ogrenci.sinif : "";
          var dersBilgi = DERS[ders.dersId];
          var hucreIcerik = sinif || esc(ders.ogrenciAd || "").split(" ")[0];
          var altYazi = dersBilgi ? dersBilgi.ad : "";
          var renk = ders.durum === "tamamlandi" ? "text-emerald-600" : "text-slate-700";

          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors">' +
            '<div class="text-[11.5px] font-bold ' + renk + ' leading-tight">' + esc(hucreIcerik) + '</div>';
          if (altYazi) html += '<div class="text-[8.5px] text-slate-400 mt-0.5">' + esc(altYazi) + '</div>';
          html += '</td>';
        } else {
          html += '<td class="px-1.5 py-2 border-r border-slate-200"></td>';
        }`;
const NEW_GT_CELL = `        var ders = saatMap[slotIndexFromBilgi(slot)];
        if (ders) {
          var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
          var sinif = ders.sinif || (ogrenci ? ogrenci.sinif : "");
          var dersBilgi = DERS[ders.dersId];

          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors">' +
            '<div class="text-[10.5px] font-bold ' + (ders.durum === "tamamlandi" ? "text-emerald-600" : "text-slate-700") + ' leading-tight">' + esc(ders.ogrenciAd || (ogrenci ? ogrenci.ad : "—")) + '</div>' +
            (sinif ? '<div class="text-[8.5px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (ders.konu ? '<div class="text-[8px] text-slate-400 leading-tight mt-0.5 truncate">' + esc(ders.konu) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[7.5px] font-bold mt-0.5 ' + dersBilgi.tx + '">' + dersBilgi.ad + '</div>' : '') +
            '</td>';
        } else {
          html += '<td class="px-1.5 py-2 border-r border-slate-200"></td>';
        }`;
must(src.indexOf(OLD_GT_CELL) >= 0, "gunluk cell");
src = src.replace(OLD_GT_CELL, NEW_GT_CELL);
done("gunlukTablo: rich lesson cells (student+class+topic+subject)");

// gunlukTablo slot index eşleyicisi + ogrtMap saat normalizasyonu
const OLD_GT_MAP = `  var ogrtMap = {};
  gunDersler.forEach(function (l) {
    var k = l.ogretmenAd || "Bilinmiyor";
    if (!ogrtMap[k]) ogrtMap[k] = {};
    ogrtMap[k][parseInt(l.saat.split(":")[0], 10)] = l; // saat normalize: "09:00" → 9
  });`;
const NEW_GT_MAP = `  var ogrtMap = {};
  gunDersler.forEach(function (l) {
    var k = l.ogretmenAd || "Bilinmiyor";
    if (!ogrtMap[k]) ogrtMap[k] = {};
    var sIdx = String(l.saat).indexOf(":") >= 0 ? eskiSaatToSlot(l.saat) : parseInt(l.saat, 10);
    if (sIdx == null || isNaN(sIdx)) sIdx = 0;
    ogrtMap[k][sIdx] = l; // slot index
  });`;
must(src.indexOf(OLD_GT_MAP) >= 0, "gunluk map");
src = src.replace(OLD_GT_MAP, NEW_GT_MAP);
done("gunlukTablo: slot-index map");

// slotIndexFromBilgi yardımcısı (gunlukTablo için)
const GT_HELPER = `function slotIndexFromBilgi(slot) { return SLOT_BILGI.indexOf(slot); }
function gunlukTablo() {`;
must(src.indexOf("function gunlukTablo() {") >= 0, "gunluk anchor");
src = src.replace("function gunlukTablo() {", GT_HELPER);
done("slotIndexFromBilgi helper");

/* ============================================================
   12) form planla push: saat zaten slot index string (planla gövdesinde değişiklik yok —
       $("f-saat").value artık "0".."11" döndürüyor)
   ============================================================ */

/* ============================================================
   13) CSS: mola + kapalı hücre stilleri (varsa ekle)
   ============================================================ */
if (src.indexOf(".dnd-bos.dnd-kapali") < 0) {
  const CSS_ANCHOR = `    .dnd-kart { cursor: grab; transition: box-shadow .12s ease; }
    .dnd-kart:active { cursor: grabbing; }
    .dnd-kart:hover { box-shadow: 0 0 0 2px #6ee7b7; }`;
  const CSS_NEW = `    .dnd-kart { cursor: grab; transition: box-shadow .12s ease; }
    .dnd-kart:active { cursor: grabbing; }
    .dnd-kart:hover { box-shadow: 0 0 0 2px #6ee7b7; }
    /* Düzenleme kilidi kapalı: bırakma alanı pasif */
    .dnd-bos.dnd-kapali { cursor: not-allowed; }
    .dnd-bos.dnd-kapali:hover { background-color: #f8fafc; box-shadow: inset 0 0 0 1.5px #e2e8f0; }`;
  if (src.indexOf(CSS_ANCHOR) >= 0) { src = src.replace(CSS_ANCHOR, CSS_NEW); done("CSS: dnd-kapali"); }
}

fs.writeFileSync(P, src);
console.log("PATCH OK — " + steps.length + " steps:");
steps.forEach(function (s, i) { console.log("  " + (i + 1) + ". " + s); });
console.log("size: " + ORIG + " → " + src.length);
