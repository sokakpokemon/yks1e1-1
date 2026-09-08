import fs from "fs";

const EXACT = (s) => s;
function patch(file, pairs) {
  let src = fs.readFileSync(file, "utf8");
  pairs.forEach(([oldS, newS, label], i) => {
    const o = EXACT(oldS);
    const n = EXACT(newS);
    const count = src.split(o).length - 1;
    if (count !== 1) {
      console.error(`FAIL [${file}] #${i} ${label}: matches=${count}`);
      process.exit(1);
    }
    src = src.replace(o, n);
    console.log(`ok  [${file}] #${i} ${label}`);
  });
  fs.writeFileSync(file, src);
}

const KS = fs.existsSync(".ks-patch-done") ? "" : `// ---------- Kısa Kod Ders Saatleri (yeni sistem) ----------
var KISA_KOD = [
  { no: "1",  b: "08:50", e: "09:30" },
  { no: "2",  b: "09:40", e: "10:20" },
  { no: "3",  b: "10:30", e: "11:10" },
  { no: "4",  b: "11:20", e: "12:00" },
  { no: "5",  b: "13:00", e: "13:40" },
  { no: "6",  b: "13:50", e: "14:30" },
  { no: "7",  b: "14:40", e: "15:20" },
  { no: "8",  b: "15:30", e: "16:10" },
  { no: "9",  b: "16:20", e: "17:00" },
  { no: "10", b: "17:10", e: "17:50" },
  { no: "11", b: "18:00", e: "18:40" }
];
function ksKodOf(saat) {
  var k = KISA_KOD.filter(function (x) { return x.b === saat; })[0];
  return k ? k.no : "";
}
function saatEtiket(saat) {
  var m = KISA_KOD.filter(function (x) { return x.b === saat; })[0];
  if (m) return m.no + " \\u00b7 " + m.b + "-" + m.e;
  var h = parseInt(String(saat).split(":")[0], 10);
  m = KISA_KOD.filter(function (x) { return parseInt(x.b, 10) === h; })[0];
  return m ? m.no + " \\u00b7 " + m.b + "-" + m.e : String(saat || "");
}
function ksSeceneklerHTML(secili) {
  var h = "";
  KISA_KOD.forEach(function (k) {
    h += '<option value="' + k.b + '"' + (secili === k.b ? " selected" : "") + ">" + k.no + " \\u00b7 " + k.b + "-" + k.e + "</option>";
  });
  return h;
}
/* Eski saat-bazlı dersleri kısa koda taşır; uymayanları DOKUNMADAN raporlar */
function ksGec() {
  var rapor = { tasinan: 0, belirsiz: [] };
  var diziler = [DB.dersler];
  if (Array.isArray(DB.ekDersler)) diziler.push(DB.ekDersler);
  diziler.forEach(function (dizi) {
    dizi.forEach(function (l) {
      if (l.kod) {
        var k = KISA_KOD.filter(function (x) { return x.no === l.kod; })[0];
        if (k && l.saat !== k.b) l.saat = k.b;
        return;
      }
      var s = String(l.saat || "");
      var h = parseInt(s.split(":")[0], 10);
      var m = (s.indexOf(":00") > 0) ? KISA_KOD.filter(function (x) { return parseInt(x.b, 10) === h; })[0] : null;
      if (m) { l.kod = m.no; l.saat = m.b; rapor.tasinan++; }
      else rapor.belirsiz.push({ ad: l.ogrenciAd || l.sinif || "?", tarih: l.tarih, saat: s });
    });
  });
  return rapor;
}
function ksRaporHTML() {
  if (typeof __KS_RAPOR === "undefined" || !__KS_RAPOR || !__KS_RAPOR.belirsiz.length || ui.ksRaporKapat) return "";
  var satir = __KS_RAPOR.belirsiz.map(function (r) {
    return "<li><b>" + esc(r.ad) + "</b> \\u00b7 " + fmtTR(r.tarih) + " \\u00b7 " + esc(r.saat) + "</li>";
  }).join("");
  return '<div class="no-print mx-5 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">' +
    '<div class="flex items-start gap-3"><span class="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-clock-rotate-left"></i></span>' +
    '<div class="flex-1"><b class="text-[13px] text-amber-800 block">Kısa koda taşıma: ' + __KS_RAPOR.tasinan + ' ders taşındı \\u00b7 ' + __KS_RAPOR.belirsiz.length + ' belirsiz (değiştirilmedi)</b>' +
    '<ul class="text-[12px] text-amber-700/90 mt-1.5 space-y-1 list-disc list-inside">' + satir + '</ul>' +
    '<p class="text-[11px] text-amber-600 mt-2">Bu derslerin başlangıç saati kısa kod saatlerine tam uymuyor. Listeden \\u201cDüzenle\\u201d ile doğru ders saatini seçin.</p></div>' +
    '<button onclick="ksRaporKapat()" class="w-7 h-7 rounded-full text-amber-400 hover:text-amber-600 hover:bg-amber-100 shrink-0"><i class="fa-solid fa-xmark"></i></button></div></div>';
}
function ksRaporKapat() { ui.ksRaporKapat = true; renderDersler(); }

`;

const KSEK = `/* ---------- Kısa Kod Ders Saatleri (ana sistemle birebir) ---------- */
var KISA_KOD = [
  { no: "1",  b: "08:50", e: "09:30" },
  { no: "2",  b: "09:40", e: "10:20" },
  { no: "3",  b: "10:30", e: "11:10" },
  { no: "4",  b: "11:20", e: "12:00" },
  { no: "5",  b: "13:00", e: "13:40" },
  { no: "6",  b: "13:50", e: "14:30" },
  { no: "7",  b: "14:40", e: "15:20" },
  { no: "8",  b: "15:30", e: "16:10" },
  { no: "9",  b: "16:20", e: "17:00" },
  { no: "10", b: "17:10", e: "17:50" },
  { no: "11", b: "18:00", e: "18:40" }
];
function ksKodOf(saat) {
  var k = KISA_KOD.filter(function (x) { return x.b === saat; })[0];
  return k ? k.no : "";
}
function saatEtiket(saat) {
  var m = KISA_KOD.filter(function (x) { return x.b === saat; })[0];
  if (m) return m.no + " \\u00b7 " + m.b + "-" + m.e;
  var h = parseInt(String(saat).split(":")[0], 10);
  m = KISA_KOD.filter(function (x) { return parseInt(x.b, 10) === h; })[0];
  return m ? m.no + " \\u00b7 " + m.b + "-" + m.e : String(saat || "");
}
function ksSeceneklerHTML(secili) {
  var h = "";
  KISA_KOD.forEach(function (k) {
    h += '<option value="' + k.b + '"' + (secili === k.b ? " selected" : "") + ">" + k.no + " \\u00b7 " + k.b + "-" + k.e + "</option>";
  });
  return h;
}

`;

patch("index.html", [
  // 1) constants + helpers before LS_KEY
  ['var LS_KEY = "yksOto_arsiv_v1";', KS + 'var LS_KEY = "yksOto_arsiv_v1";', "constants+helpers"],
  // 2) one-time migration
  ["var DB = loadDB() || seedDB();\nsaveDB();", "var DB = loadDB() || seedDB();\nsaveDB();\nvar __KS_RAPOR = ksGec(); saveDB();", "migration"],
  // 3) seed lessons -> short codes
  ['saat: String(r[2]).padStart(2, "0") + ":00",', "saat: KISA_KOD.filter(function(k){return parseInt(k.b,10)===r[2];})[0].b, kod: String(r[2]),", "seed lessons"],
  // 4) seed istek saatleri -> kısa kod başlangıçları
  ['olusturma: addDaysKey(todayKey(), -3), saat: "09:30" },', 'olusturma: addDaysKey(todayKey(), -3), saat: "15:30" },', "seed istek 1"],
  ['olusturma: addDaysKey(todayKey(), -3), saat: "14:00" },', 'olusturma: addDaysKey(todayKey(), -3), saat: "14:40" },', "seed istek 2"],
  ['olusturma: addDaysKey(todayKey(), -2), saat: "11:15" }', 'olusturma: addDaysKey(todayKey(), -2), saat: "11:20" }', "seed istek 3"],
  // 5) plan form: DERS SAATİ select
  [`        <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
          <i class="fa-regular fa-clock text-cyan-500"></i> Saat
        </label>
        <input id="f-saat" type="time" value="16:00" step="3600"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400" />`,
   `        <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
          <i class="fa-regular fa-clock text-cyan-500"></i> DERS SAATİ
        </label>
        <select id="f-saat"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"></select>`,
   "form select"],
  // 6) note text
  ["Dersler 1 saattir, saat başı başlar (09:00 – 20:00)", "Dersler 40 dakikadır, kısa kod saatlerine göre işler", "note text"],
  // 7) KS kılavuz panel after Ders Planla heading
  ['<section id="planKart"',
   '<div class="hidden" id="ks-kilavuz"><div class="no-print rounded-xl border border-teal-100 bg-teal-50/60 px-3.5 py-2.5 text-[11px] text-teal-800 leading-relaxed mb-3"><b class="font-extrabold"><i class="fa-solid fa-circle-info mr-1"></i>Ders Saati Kılavuzu:</b> Dersler 40 dakikadır ve kısa kod saatleriyle işler. 1 · 08:50-09:30 · 2 · 09:40-10:20 · 3 · 10:30-11:10 · 4 · 11:20-12:00 · 5 · 13:00-13:40 · 6 · 13:50-14:30 · 7 · 14:40-15:20 · 8 · 15:30-16:10 · 9 · 16:20-17:00 · 10 · 17:10-17:50 · 11 · 18:00-18:40. <span class="text-teal-600">Mola (12:00-13:00) ders için kullanılmaz.</span></div></div>\n  <section id="planKart"',
   "KS kılavuz"],
  // 8) select options injection after form set
  [`      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 mt-4">
      <div class="flex flex-wrap items-center gap-1.5 text-[12px] text-slate-500">
        <span class="font-semibold mr-1">Hızlı öğretmen:</span>`,
   `      </div>
    </div>

    <script>document.getElementById("f-saat").innerHTML = ksSeceneklerHTML("15:30");</` + `script>
    <div class="flex flex-wrap items-center justify-between gap-3 mt-4">
      <div class="flex flex-wrap items-center gap-1.5 text-[12px] text-slate-500">
        <span class="font-semibold mr-1">Hızlı öğretmen:</span>`,
   "select options"],
  // 9) istekFormaAl default
  ['  if ($("f-saat").value < "09:00" || $("f-saat").value > "20:00") $("f-saat").value = "16:00";',
   '  $("f-saat").value = "15:30";', "istekFormaAl default"],
  // 10) temizleForm default
  ['  $("f-saat").value = "16:00";\n  $("f-yoksay").checked = false;',
   '  $("f-saat").value = "15:30";\n  $("f-yoksay").checked = false;', "temizleForm default"],
  // 11) planla validation
  [`  else {
    var dk = saat.split(":")[1];
    var sNum = parseInt(saat.split(":")[0], 10);
    if (dk !== "00") hatalar.push("Dersler saat başı başlar — dakika \u201c00\u201d olmalı (örn. 16:00).");
    if (sNum < 9 || sNum > 19) hatalar.push("Ders saatleri 09:00 – 19:00 arasındadır.");
  }`,
   `  else {
    var k = KISA_KOD.filter(function (x) { return x.b === saat; })[0];
    if (!k) hatalar.push("Ders saati kısa kod saatlerinden biri olmalı (örn. 8 · 15:30-16:10).");
    if (saat === "12:00" || saat === "13:00") hatalar.push("Mola (12:00-13:00) ders için kullanılamaz.");
  }`,
   "planla validation"],
  // 12) duzeltmeBul core
  [`function duzeltmeBul(adet, yokSay) {
  var saatNum = parseInt(adet.saat.split(":")[0], 10);
  var di = dowIdx(adet.tarih);
  var key = di + "-" + saatNum;`,
   `function duzeltmeBul(adet, yokSay) {
  var saatKod = ksKodOf(adet.saat);
  var di = dowIdx(adet.tarih);
  var key = di + "-" + saatKod;`,
   "duzeltmeBul key"],
  [`    var cakisan = DB.dersler.find(function (l) {
      return l.ogretmenId === ogr.id && l.tarih === adet.tarih && l.saat === adet.saat && l.durum !== "iptal" && l.id !== (adet.id || "");
    });
    if (cakisan) uyari.push("Aynı saatte " + ogr.ad + " öğretmeninin <b>" + cakisan.ogrenciAd + "</b> ile başka bir dersi var (" + fmtTR(cakisan.tarih) + " " + cakisan.saat + ").");`,
   `    var cakisan = DB.dersler.find(function (l) {
      return l.ogretmenId === ogr.id && l.tarih === adet.tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal" && l.id !== (adet.id || "");
    });
    if (cakisan) uyari.push("Aynı kısa kod saatinde " + ogr.ad + " öğretmeninin <b>" + cakisan.ogrenciAd + "</b> ile başka bir dersi var (" + fmtTR(cakisan.tarih) + " " + saatEtiket(cakisan.saat) + ").");`,
   "duzeltmeBul ogr find"],
  [`  if (o && o.sinif && (DB.sinifProg[o.sinif] || []).indexOf(key) >= 0) {
    uyari.push(o.ad + " öğrencisinin sınıfı (<b>" + o.sinif + "</b>) o saatte toplu derste.");
  }`,
   `  if (o && o.sinif && (DB.sinifProg[o.sinif] || []).indexOf(key) >= 0) {
    uyari.push(o.ad + " öğrencisinin sınıfı (<b>" + o.sinif + "</b>) o kısa kod saatinde toplu derste.");
  }`,
   "duzeltmeBul sinif msg"],
  // 13) istekBurak
  [`  var di = dowIdx(tarih), sNum = parseInt(saat.split(":")[0], 10);
  var key = di + "-" + sNum;`,
   `  var di = dowIdx(tarih), saatKod = ksKodOf(saat);
  var key = di + "-" + saatKod;`,
   "istekBurak key"],
  [`  var dolu = DB.dersler.some(function (l) { return l.ogretmenId === ogrtId && l.tarih === tarih && l.saat === saat && l.durum !== "iptal"; });`,
   `  var dolu = DB.dersler.some(function (l) { return l.ogretmenId === ogrtId && l.tarih === tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal"; });`,
   "istekBurak dolu"],
  // 14) haftalikOgrtTablo: dersMap + headers
  [`    dersMap[gunIdx + "-" + l.saat] = l;`,
   `    dersMap[gunIdx + "-" + ksKodOf(l.saat)] = l;`,
   "haftalik dersMap"],
  [`  // Saat başlıkları
  var saatBaslik = "";
  for (var h = 9; h <= 19; h++) {
    saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100' style='min-width:75px'>" +
      '<div class="text-[11px] font-extrabold text-slate-600">' + String(h).padStart(2,"0") + ":00</div>" +
      '<div class="text-[9px] text-slate-400">' + String(h).padStart(2,"0") + ":50</div></th>";
  }`,
   `  // Kısa kod saat başlıkları
  var saatBaslik = "";
  KISA_KOD.forEach(function (k) {
    saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100' style='min-width:75px'>" +
      '<div class="text-[11px] font-extrabold text-slate-600">' + k.no + " \\u00b7 " + k.b + "</div>" +
      '<div class="text-[9px] text-slate-400">' + k.e + "</div></th>";
  });`,
   "haftalik headers"],
  [`    for (var h = 9; h <= 19; h++) {
      var key = g + "-" + h;
      var ders = dersMap[key];`,
   `    for (var hi = 0; hi < KISA_KOD.length; hi++) {
      var no = KISA_KOD[hi].no;
      var key = g + "-" + no;
      var ders = dersMap[key];`,
   "haftalik loop"],
  [`        var hk = String(h).padStart(2, "0") + ":00";
        satirlar += '<td class="dnd-bos px-1.5 py-1.5 text-center border-l border-slate-100 transition-colors"' +`,
   `        var hk = KISA_KOD[hi].b;
        satirlar += '<td class="dnd-bos px-1.5 py-1.5 text-center border-l border-slate-100 transition-colors"' +`,
   "haftalik drop saat"],
  // 15) tablo satırı
  [`      '<td class="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap" style="font-variant-numeric:tabular-nums">' + esc(l.saat) + "</td>" +`,
   `      '<td class="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap" style="font-variant-numeric:tabular-nums">' + esc(saatEtiket(l.saat)) + "</td>" +`,
   "tablo satır"],
  // 16) yazdır sarmalayıcı (rapor bandı)
  [`      '<div id="yazdir" class="bg-white">' +
        '<div class="print-goster px-6 pt-6 pb-2 flex items-center justify-between">' +`,
   `      '<div id="yazdir" class="bg-white">' +
        ksRaporHTML() +
        '<div class="print-goster px-6 pt-6 pb-2 flex items-center justify-between">' +`,
   "yazdır sarmalayıcı"],
  // 17) listeMetni
  [`    return fmtTR(l.tarih) + " " + l.saat + " | " + l.ogrenciAd + " | " + D.ad + " | " + (l.konu || "Genel tekrar") + " | " + l.ogretmenAd + " | " + l.durum;`,
   `    return fmtTR(l.tarih) + " " + saatEtiket(l.saat) + " | " + l.ogrenciAd + " | " + D.ad + " | " + (l.konu || "Genel tekrar") + " | " + l.ogretmenAd + " | " + l.durum;`,
   "listeMetni"],
  // 18) WhatsApp mesajı
  [`    return (i + 1) + ") " + D.ad + (l.konu ? " — " + l.konu : "") + "\\n   📅 " + fmtTR(l.tarih) + " " + GUNLER[dowIdx(l.tarih)] + " • " + l.saat + " • " + l.ogretmenAd + durum;`,
   `    return (i + 1) + ") " + D.ad + (l.konu ? " — " + l.konu : "") + "\\n   📅 " + fmtTR(l.tarih) + " " + GUNLER[dowIdx(l.tarih)] + " • " + saatEtiket(l.saat) + " • " + l.ogretmenAd + durum;`,
   "WhatsApp mesaj"],
  // 19) PNG satırı
  [`      '<td style="padding:7px 10px;font-size:11px;color:#475569;white-space:nowrap">' + l.saat + "</td>" +`,
   `      '<td style="padding:7px 10px;font-size:11px;color:#475569;white-space:nowrap">' + saatEtiket(l.saat) + "</td>" +`,
   "PNG satır"],
  // 20) silOnay metni
  [`    metin: "<b>" + esc(l.ogrenciAd) + "</b> · " + D.ad + (l.konu ? " (" + esc(l.konu) + ")" : "") + " · " + fmtTR(l.tarih) + " " + l.saat + " kaydı arşivden kaldırılacak.",`,
   `    metin: "<b>" + esc(l.ogrenciAd) + "</b> · " + D.ad + (l.konu ? " (" + esc(l.konu) + ")" : "") + " · " + fmtTR(l.tarih) + " " + saatEtiket(l.saat) + " kaydı arşivden kaldırılacak.",`,
   "silOnay"],
  // 21) düzenleme bandı
  [`      banner.innerHTML = '<i class="fa-solid fa-pen"></i>Ders düzenleniyor: ' + esc(l.ogrenciAd) + " · " + fmtTR(l.tarih) + " " + l.saat;`,
   `      banner.innerHTML = '<i class="fa-solid fa-pen"></i>Ders düzenleniyor: ' + esc(l.ogrenciAd) + " · " + fmtTR(l.tarih) + " " + saatEtiket(l.saat);`,
   "düzenleme bandı"],
  // 22) yedekOku: yüklenen veriyi de kısa koda taşı
  [`        DB = normalize(v);
        saveDB();`,
   `        DB = normalize(v);
        ksGec();
        saveDB();`,
   "yedekOku migration"],
]);

patch("ek-ders.js", [
  // 1) constants after wrapper open
  [`  typeof document !== "undefined"
) {
`,
   `  typeof document !== "undefined"
) {

` + KSEK,
   "constants"],
  // 2) default saat
  [`  if (!ui.ekForm) ui.ekForm = { sinif: "", dersId: "", konu: "", ogretmen: "", tarih: "", saat: "16:00", yoksay: false };`,
   `  if (!ui.ekForm) ui.ekForm = { sinif: "", dersId: "", konu: "", ogretmen: "", tarih: "", saat: "15:30", yoksay: false };`,
   "ekForm default"],
  [`    ui.ekForm.ogretmen = ""; ui.ekForm.tarih = ""; ui.ekForm.saat = "16:00";`,
   `    ui.ekForm.ogretmen = ""; ui.ekForm.tarih = ""; ui.ekForm.saat = "15:30";`,
   "ekTemizle default"],
  // 3) ekDuzeltmeBul
  [`  var ekDuzeltmeBul = function (adet) {
    var saatNum = parseInt(adet.saat.split(":")[0], 10);
    var di = dowIdx(adet.tarih);
    var key = di + "-" + saatNum;`,
   `  var ekDuzeltmeBul = function (adet) {
    var saatKod = ksKodOf(adet.saat);
    var di = dowIdx(adet.tarih);
    var key = di + "-" + saatKod;`,
   "ekDuzeltmeBul key"],
  [`      var cakisanBirebir = DB.dersler.find(function (l) {
        return l.ogretmenId === ogr.id && l.tarih === adet.tarih && l.saat === adet.saat && l.durum !== "iptal";
      });
      if (cakisanBirebir) uyari.push("Aynı saatte " + ogr.ad + " öğretmeninin <b>" + esc(cakisanBirebir.ogrenciAd) + "</b> ile bir birebir dersi var (" + fmtTR(cakisanBirebir.tarih) + " " + cakisanBirebir.saat + ").");
      var cakisanEk = ekDersler().find(function (l) {
        return l.ogretmenId === ogr.id && l.tarih === adet.tarih && l.saat === adet.saat && l.durum !== "iptal" && l.id !== (adet.id || "");
      });
      if (cakisanEk) uyari.push("Aynı saatte " + ogr.ad + " öğretmeninin <b>" + esc(cakisanEk.sinif) + "</b> sınıfıyla bir ek dersi var (" + fmtTR(cakisanEk.tarih) + " " + cakisanEk.saat + ").");
    }
    var cakisanSinif = ekDersler().find(function (l) {
      return l.sinif === adet.sinif && l.tarih === adet.tarih && l.saat === adet.saat && l.durum !== "iptal" && l.id !== (adet.id || "");
    });
    if (cakisanSinif) uyari.push("<b>" + esc(adet.sinif) + "</b> sınıfının aynı saatte başka bir ek dersi var (" + fmtTR(cakisanSinif.tarih) + " " + cakisanSinif.saat + ").");`,
   `      var cakisanBirebir = DB.dersler.find(function (l) {
        return l.ogretmenId === ogr.id && l.tarih === adet.tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal";
      });
      if (cakisanBirebir) uyari.push("Aynı kısa kod saatinde " + ogr.ad + " öğretmeninin <b>" + esc(cakisanBirebir.ogrenciAd) + "</b> ile bir birebir dersi var (" + fmtTR(cakisanBirebir.tarih) + " " + saatEtiket(cakisanBirebir.saat) + ").");
      var cakisanEk = ekDersler().find(function (l) {
        return l.ogretmenId === ogr.id && l.tarih === adet.tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal" && l.id !== (adet.id || "");
      });
      if (cakisanEk) uyari.push("Aynı kısa kod saatinde " + ogr.ad + " öğretmeninin <b>" + esc(cakisanEk.sinif) + "</b> sınıfıyla bir ek dersi var (" + fmtTR(cakisanEk.tarih) + " " + saatEtiket(cakisanEk.saat) + ").");
    }
    var cakisanSinif = ekDersler().find(function (l) {
      return l.sinif === adet.sinif && l.tarih === adet.tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal" && l.id !== (adet.id || "");
    });
    if (cakisanSinif) uyari.push("<b>" + esc(adet.sinif) + "</b> sınıfının aynı kısa kod saatinde başka bir ek dersi var (" + fmtTR(cakisanSinif.tarih) + " " + saatEtiket(cakisanSinif.saat) + ").");`,
   "ekDuzeltmeBul finds"],
  // 4) ekPlanla validation
  [`    else {
      var dk = saat.split(":")[1];
      var sNum = parseInt(saat.split(":")[0], 10);
      if (dk !== "00") hatalar.push("Dersler saat başı başlar — dakika \\u201c00\\u201d olmalı (örn. 16:00).");
      if (sNum < 9 || sNum > 19) hatalar.push("Ders saatleri 09:00 – 19:00 arasındadır.");
    }`,
   `    else {
      var k = KISA_KOD.filter(function (x) { return x.b === saat; })[0];
      if (!k) hatalar.push("Ders saati kısa kod saatlerinden biri olmalı (örn. 8 · 15:30-16:10).");
      if (saat === "12:00" || saat === "13:00") hatalar.push("Mola (12:00-13:00) ders için kullanılamaz.");
    }`,
   "ekPlanla validation"],
  // 5) note text
  [`          '<span class="text-[11px] text-slate-400 font-medium"><i class="fa-regular fa-clock mr-1"></i>Dersler 1 saattir, saat başı başlar (09:00 – 20:00)</span>' +`,
   `          '<span class="text-[11px] text-slate-400 font-medium"><i class="fa-regular fa-clock mr-1"></i>Dersler 40 dakikadır, kısa kod saatlerine göre işler</span>' +`,
   "ek note text"],
  // 6) saat select
  [`            '<label class="' + lbl + '"><i class="fa-regular fa-clock text-cyan-500"></i> Saat</label>' +
            '<input id="ek-saat" type="time" value="' + esc(ui.ekForm.saat) + '" step="3600" onchange="ekFormSet(\\'saat\\', this.value)" oninput="ekFormSet(\\'saat\\', this.value)" class="' + inp + '" />' +`,
   `            '<label class="' + lbl + '"><i class="fa-regular fa-clock text-cyan-500"></i> DERS SAATİ</label>' +
            '<select id="ek-saat" onchange="ekFormSet(\\'saat\\', this.value)" class="' + inp + '">' + ksSeceneklerHTML(ui.ekForm.saat) + "</select>" +`,
   "ek saat select"],
  // 7) banner
  [`      banner = '<span class="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-[11.5px] font-bold text-amber-700"><i class="fa-solid fa-pen"></i>Ek ders düzenleniyor: ' + esc(duzenlenen.sinif) + " · " + fmtTR(duzenlenen.tarih) + " " + duzenlenen.saat + "</span>";`,
   `      banner = '<span class="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-[11.5px] font-bold text-amber-700"><i class="fa-solid fa-pen"></i>Ek ders düzenleniyor: ' + esc(duzenlenen.sinif) + " · " + fmtTR(duzenlenen.tarih) + " " + saatEtiket(duzenlenen.saat) + "</span>";`,
   "ek banner"],
  // 8) satır
  [`        '<td class="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap" style="font-variant-numeric:tabular-nums">' + esc(l.saat) + "</td>" +`,
   `        '<td class="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap" style="font-variant-numeric:tabular-nums">' + esc(saatEtiket(l.saat)) + "</td>" +`,
   "ek satır"],
  // 9) ekListeMetni
  [`      return fmtTR(l.tarih) + " " + l.saat + " | " + l.sinif + " | " + D.ad + " | " + (l.konu || "Genel tekrar") + " | " + l.ogretmenAd + " | " + l.durum;`,
   `      return fmtTR(l.tarih) + " " + saatEtiket(l.saat) + " | " + l.sinif + " | " + D.ad + " | " + (l.konu || "Genel tekrar") + " | " + l.ogretmenAd + " | " + l.durum;`,
   "ekListeMetni"],
  // 10) silOnay metni
  [`      metin: "<b>" + esc(l.sinif) + "</b> sınıfı · " + D.ad + (l.konu ? " (" + esc(l.konu) + ")" : "") + " · " + fmtTR(l.tarih) + " " + l.saat + " kaydı arşivden kaldırılacak.",`,
   `      metin: "<b>" + esc(l.sinif) + "</b> sınıfı · " + D.ad + (l.konu ? " (" + esc(l.konu) + ")" : "") + " · " + fmtTR(l.tarih) + " " + saatEtiket(l.saat) + " kaydı arşivden kaldırılacak.",`,
   "ek silOnay"],
]);

// Success marker: only written if every replacement above succeeded.
fs.writeFileSync(".ks-patch-done", new Date().toISOString());
console.log("ALL PATCHES APPLIED");
