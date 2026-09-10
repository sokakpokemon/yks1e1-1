/* ks-yama-coklu-ui.mjs — ÇOKLU ÖĞRENCİ SEÇİMİ UI yaması (yalnızca renderFormDestek + ui state)
 * Kural: f-ogrenci tekli input AYNEN kalır; planla()/duzeltmeBul()/kaydetme mantığına DOKUNULMAZ.
 * Byte-exact yama: expected çıkış önceden kurulur ve çıktıyla birebir karşılaştırılır.
 * Korumalı: ikinci çalıştırmada reddeder.
 */
import { readFileSync, writeFileSync } from "node:fs";

const F = "app.js";
const src0 = readFileSync(F, "utf8");

const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };
const assert = (c, m) => { if (!c) fail(m); else console.log("  OK " + m); };
const say = (hay, need) => hay.split(need).length - 1;

/* KORUMA: yama zaten uygulanmış mı? */
if (src0.includes("ek-ogrenci-arama") || src0.includes("ui.ekOgrenciIds")) {
  console.error("REDDEDILDI: yama zaten uygulanmis gorunuyor.");
  process.exit(1);
}

/* ---------- YAMA 1: ui state — ekOgrenciIds alanı ---------- */
const need1 = '  seciliDurum: null, seciliOgrId: null\n};\n';
const rep1 =
'  seciliDurum: null, seciliOgrId: null,\n' +
'  ekOgrenciIds: null /* COKLU UI: secili ogrenci id dizisi (max 5) */\n' +
'};\n';

/* ---------- YAMA 2: renderFormDestek — chip çizimi ---------- */
const need2 = '  $("dl-ogrenci").innerHTML = dlO;\n';
const rep2 =
'  $("dl-ogrenci").innerHTML = dlO;\n' +
'\n' +
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
'  $("ek-ogrenci-sayac").textContent = ui.ekOgrenciIds.length + " / " + EK_OGR_MAX;\n';

/* ---------- YAMA 3: renderFormDestek sonu — arama paneli + iki global fn ---------- */
const need3 = '  duzenleBannerGuncelle();\n}\nfunction hizliSec(ad)';
const rep3 =
'  var ekPanel = \'<div id="ek-ogrenciler" class="no-print rounded-2xl border border-slate-100 bg-slate-50/60 p-3 mt-2">\' +\n' +
'    \'<div class="flex items-center justify-between gap-2 mb-1.5">\' +\n' +
'      \'<span class="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide"><i class="fa-solid fa-user-group mr-1"></i>Ek Ogrenciler (Grup)</span>\' +\n' +
'      \'<span id="ek-ogrenci-sayac" class="text-[10.5px] font-bold text-slate-400"></span>\' +\n' +
"    '</div>' +\n" +
'    \'<div id="ek-ogrenci-chips" class="flex flex-wrap items-center gap-1.5 mb-2"></div>\' +\n' +
'    \'<div class="relative">\' +\n' +
'      \'<input id="ek-ogrenci-arama" list="dl-ogrenci" autocomplete="off" placeholder="Ara ve ekle (Enter)" onkeydown="ekOgrenciEkle(event)" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />\' +\n' +
'      \'<i class="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-300"></i>\' +\n' +
"    '</div>' +\n" +
'  "</div>";\n' +
'  $("hizliOgr").insertAdjacentHTML("afterend", ekPanel);\n' +
'\n' +
'  duzenleBannerGuncelle();\n' +
'}\n' +
'function ekOgrenciEkle(ev) {\n' +
'  var inp = $("ek-ogrenci-arama");\n' +
'  var v = (ev && ev.key === "Enter" ? inp.value : "").trim();\n' +
'  if (!v) return;\n' +
'  var o = DB.ogrenciler.find(function (x) { return x.ad === v; });\n' +
'  if (!o) { toast("Ogrenci bulunamadi: " + v, "hata"); return; }\n' +
'  if (!ui.ekOgrenciIds) ui.ekOgrenciIds = [];\n' +
'  if (ui.ekOgrenciIds.indexOf(o.id) !== -1) { toast(o.ad + " zaten listede", "uyari"); return; }\n' +
'  if (ui.ekOgrenciIds.length >= 5) { toast("En fazla 5 ek ogrenci eklenebilir", "uyari"); return; }\n' +
'  ui.ekOgrenciIds.push(o.id);\n' +
'  inp.value = "";\n' +
'  renderFormDestek();\n' +
'}\n' +
'function ekOgrenciSil(oid) {\n' +
'  if (!ui.ekOgrenciIds) ui.ekOgrenciIds = [];\n' +
'  ui.ekOgrenciIds = ui.ekOgrenciIds.filter(function (y) { return y !== oid; });\n' +
'  renderFormDestek();\n' +
'}\n' +
'function hizliSec(ad)';

/* ---------- HEDEF SAYIMLARI ---------- */
assert(say(src0, need1) === 1, "YAMA1 hedefi tam 1 kez (ui state)");
assert(say(src0, need2) === 1, "YAMA2 hedefi tam 1 kez (dl-ogrenci satiri)");
assert(say(src0, need3) === 1, "YAMA3 hedefi tam 1 kez (renderFormDestek bitisi)");

/* ---------- BYTE-EXACT UYGULAMA ---------- */
const i1 = src0.indexOf(need1);
const i2 = src0.indexOf(need2);
const i3 = src0.indexOf(need3);
const expected =
  src0.slice(0, i1) + rep1 +
  src0.slice(i1 + need1.length, i2) + rep2 +
  src0.slice(i2 + need2.length, i3) + rep3 +
  src0.slice(i3 + need3.length);
assert(expected !== src0, "expected cikis kaynaktan farkli (yama iceriyor)");

writeFileSync(F, expected);
console.log("Yama uygulandi -> " + F);

/* ---------- DOGRULAMA ---------- */
const chk = readFileSync(F, "utf8");
assert(chk === expected, "dosya icerigi expected ile birebir (baska hicbir bayt degismedi)");
const satir = (s) => chk.split("\n").findIndex((l) => l.includes(s)) + 1;
assert(chk.includes("ek-ogrenciler"), '"ek-ogrenciler" app.js icinde (satir ' + satir("ek-ogrenciler") + ")");
assert(chk.includes("ek-ogrenci-chips"), '"ek-ogrenci-chips" app.js icinde (satir ' + satir("ek-ogrenci-chips") + ")");
assert(chk.includes("ek-ogrenci-arama"), '"ek-ogrenci-arama" app.js icinde (satir ' + satir("ek-ogrenci-arama") + ")");
assert(chk.includes("function ekOgrenciEkle"), "ekOgrenciEkle() tanimli");
assert(chk.includes("function ekOgrenciSil"), "ekOgrenciSil() tanimli");
assert(chk.includes("ui.ekOgrenciIds"), "ui.ekOgrenciIds null-safe state alani var");

/* ---------- DOKUNULMAYANLAR ---------- */
assert(chk.includes('var ogrenciAd = $("f-ogrenci").value.trim();'), "kaydetme akisi f-ogrenci'den okumaya devam ediyor");
assert(say(chk, "function duzeltmeBul(") === say(src0, "function duzeltmeBul("), "duzeltmeBul() tanim sayisi degismedi");
assert(say(chk, "f-ogrenci") >= say(src0, "f-ogrenci"), "f-ogrenci referanslari korundu");
assert(say(chk, "function planla(") === say(src0, "function planla("), "planla() tanim sayisi degismedi");

console.log("TUM ASSERT'LER GECTI");
