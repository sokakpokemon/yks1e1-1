/* ks-yama-sira-duzelt.mjs — renderFormDestek boot çökmesi düzeltmesi (v2, iki aşamalı)
 * 1) Eski chip bloğu (panel eklemesinden ÖNCE) silinir.
 * 2) Chip bloğu, null-guard'lı haliyle panel ekleme bloğunun SONRASINA eklenir.
 * Byte-exact: expected çıkış önceden kurulur; her adım assert'li. Tek seferlik, korumalı.
 */
import { readFileSync, writeFileSync } from "node:fs";

const F = "app.js";
const src = readFileSync(F, "utf8");
const say = (h, n) => h.split(n).length - 1;
const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };
const ok = (m) => console.log("  OK " + m);

/* KORUMA */
if (src.includes('if (chipsEl)')) fail("yama zaten uygulanmis gorunuyor (chipsEl guard mevcut)");
ok("koruma: yama daha once uygulanmamis");

/* ---------- Parça 1: ESKİ chip bloğu (silinecek) ---------- */
const eskiChip =
'  /* ---------- COKLU OGRENCI SECIMI (yalnizca UI) ---------- */\n' +
'  /* f-ogrenci tekli input ve planla()/kaydetme akisi AYNEN; bu blok yalnizca ek chipleri cizer. */\n' +
'  if (!ui.ekOgrenciIds) ui.ekOgrenciIds = [];\n' +
'  var EK_OGR_MAX = 5;\n' +
'  ui.ekOgrenciIds = ui.ekOgrenciIds.filter(function (oid) { return DB.ogrenciler.some(function (x) { return x.id === oid; }); });\n' +
'  var ekChips = ui.ekOgrenciIds.map(function (oid) {\n' +
'    var o = DB.ogrenciler.find(function (x) { return x.id === oid; });\n' +
"    return '<span class=\"inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 pl-2.5 pr-1.5 py-1 text-[11.5px] font-bold text-teal-700\">' + esc(o ? o.ad : \"?\") +\n" +
"      '<button onclick=\"ekOgrenciSil(\\'' + esc(oid) + '\\')\" title=\"Cikar\" class=\"w-4 h-4 -mr-0.5 rounded-full hover:bg-teal-200 text-teal-600 flex items-center justify-center\"><i class=\"fa-solid fa-xmark text-[9px]\"></i></button></span>';\n" +
'  }).join("");\n' +
"  if (!ui.ekOgrenciIds.length) ekChips = '<span class=\"text-[11px] text-slate-300 italic\">Grup dersi icin ek ogrenci ekle (en fazla ' + EK_OGR_MAX + ')</span>';\n" +
'  $("ek-ogrenci-chips").innerHTML = ekChips;\n' +
'  $("ek-ogrenci-sayac").textContent = ui.ekOgrenciIds.length + " / " + EK_OGR_MAX;\n' +
'\n';

/* ---------- Parça 2: panel ekleme bloğu (chip bloğu SONRASINA eklenecek nokta) ---------- */
const panelBloku =
'  /* Paneli yalnizca bir kez ekle (idempotent; stub DOM"larda da guvenli) */\n' +
'  if (!document.getElementById("ek-ogrenciler")) {\n' +
'    var hzEl = $("hizliOgr");\n' +
'    if (hzEl && hzEl.insertAdjacentHTML) hzEl.insertAdjacentHTML("afterend", ekPanel);\n' +
'  }\n' +
'\n';

/* ---------- YENİ chip bloğu: null-guard'lı ---------- */
const yeniChip =
'  /* COKLU OGRENCI SECIMI chipleri — panel eklendikten SONRA doldurulur (boot null-guvenli) */\n' +
'  if (!ui.ekOgrenciIds) ui.ekOgrenciIds = [];\n' +
'  var EK_OGR_MAX = 5;\n' +
'  ui.ekOgrenciIds = ui.ekOgrenciIds.filter(function (oid) { return DB.ogrenciler.some(function (x) { return x.id === oid; }); });\n' +
'  var ekChips = ui.ekOgrenciIds.map(function (oid) {\n' +
'    var o = DB.ogrenciler.find(function (x) { return x.id === oid; });\n' +
"    return '<span class=\"inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 pl-2.5 pr-1.5 py-1 text-[11.5px] font-bold text-teal-700\">' + esc(o ? o.ad : \"?\") +\n" +
"      '<button onclick=\"ekOgrenciSil(\\'' + esc(oid) + '\\')\" title=\"Cikar\" class=\"w-4 h-4 -mr-0.5 rounded-full hover:bg-teal-200 text-teal-600 flex items-center justify-center\"><i class=\"fa-solid fa-xmark text-[9px]\"></i></button></span>';\n" +
'  }).join("");\n' +
"  if (!ui.ekOgrenciIds.length) ekChips = '<span class=\"text-[11px] text-slate-300 italic\">Grup dersi icin ek ogrenci ekle (en fazla ' + EK_OGR_MAX + ')</span>';\n" +
'  var chipsEl = $("ek-ogrenci-chips");\n' +
'  if (chipsEl) chipsEl.innerHTML = ekChips;\n' +
'  var sayacEl = $("ek-ogrenci-sayac");\n' +
'  if (sayacEl) sayacEl.textContent = ui.ekOgrenciIds.length + " / " + EK_OGR_MAX;\n' +
'\n';

/* ---------- AŞAMA 1: eski chip bloğunu sil ---------- */
if (say(src, eskiChip) !== 1) fail("eski chip blogu tam 1 kez bulunamadi (bulunan: " + say(src, eskiChip) + ")");
ok("eski chip blogu tam 1 kez bulundu");
const r1 = src.replace(eskiChip, "");
if (say(r1, eskiChip) !== 0) fail("eski chip blogu silinemedi");
ok("eski chip blogu silindi");

/* ---------- AŞAMA 2: yeni chip bloğunu panel bloğunun sonrasına ekle ---------- */
if (say(r1, panelBloku) !== 1) fail("panel blogu tam 1 kez bulunamadi (bulunan: " + say(r1, panelBloku) + ")");
ok("panel blogu tam 1 kez bulundu");
const pIdx = r1.indexOf(panelBloku);
const expected = r1.slice(0, pIdx + panelBloku.length) + yeniChip + r1.slice(pIdx + panelBloku.length);
if (expected === src) fail("degisiklik uretilemedi");
writeFileSync(F, expected);
ok("yama uygulandi");

/* ---------- DOĞRULAMA ---------- */
const chk = readFileSync(F, "utf8");
if (chk !== expected) fail("dosya expected ile birebir degil");
ok("dosya icerigi expected ile birebir (baska hicbir bayt degismedi)");

/* Sıra kontrolü: panel ekleme satırı artık chip doldurmadan ÖNCE gelmeli */
const satirlar = chk.split("\n");
const idxPanel = satirlar.findIndex(l => l.includes('if (!document.getElementById("ek-ogrenciler")) {'));
const idxChips = satirlar.findIndex(l => l.includes('var chipsEl = $("ek-ogrenci-chips");'));
if (idxPanel < 0 || idxChips < 0) fail("yeni satirlar bulunamadi");
if (idxPanel > idxChips) fail("sira hala ters (panel: " + (idxPanel + 1) + ", chips: " + (idxChips + 1) + ")");
ok("sira dogru: panel ekleme satir " + (idxPanel + 1) + " < chip doldurma satir " + (idxChips + 1));

/* Null-guard kontrolü */
if (!chk.includes('if (chipsEl) chipsEl.innerHTML = ekChips;')) fail("chipsEl guard yazilmadi");
if (!chk.includes('if (sayacEl) sayacEl.textContent')) fail("sayacEl guard yazilmadi");
ok("null-guard'lar yerinde (chipsEl + sayacEl)");

/* Eski korunsuz erişim gitmeli */
if (chk.includes('$("ek-ogrenci-chips").innerHTML')) fail("korunsuz chips erisimi hala dosyada");
if (chk.includes('$("ek-ogrenci-sayac").textContent')) fail("korunsuz sayac erisimi hala dosyada");
ok("korunsuz erisimler kalkti");

/* Dokunulmayanlar */
if (!chk.includes('var ogrenciAd = $("f-ogrenci").value.trim();')) fail("planla akisi etkilendi");
if (say(chk, "function ekOgrenciEkle(") !== 1 || say(chk, "function ekOgrenciSil(") !== 1) fail("ekOgrenci fn'lari etkilendi");
if (say(chk, "function planla(") !== say(src, "function planla(")) fail("planla tanim sayisi degisti");
if (!chk.includes('$("dl-ogrenci").innerHTML = dlO;')) fail("dl-ogrenci dolgusu etkilendi");
if (!chk.includes('duzenleBannerGuncelle();\n}')) fail("renderFormDestek bitisi etkilendi");
ok("dokunulmayanlar dogrulandi (planla, ekOgrenciEkle/Sil, dl dolgulari, fn sonu)");

console.log("TUM ASSERT'LER GECTI");
