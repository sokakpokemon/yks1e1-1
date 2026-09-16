/* ks-yama-ekders-ozet-csv.mjs — EKDERS-OZET-CSV-YAMASI (assert'li, idempotent)
   1) renderOzet: "Ek Ders" kartı (aktifDonemKayitlari(DB.ekDersler), iptal hariç, toplama EKLENMEZ)
   2) renderAnaliz: ayrı "Ek Ders" kategorisi bloğu (topOgr/topOgrt/dag bozulmaz)
   3) csvEkDersSatirlari + csvEkDersIndir (yks-ek-dersler-<donemId>.csv, dataset=ekders)
   4) CSV UI butonu + csvTumunuIndir'e ekleme
   Mevcut birebir/grup sayımları ve diğer CSV fonksiyonları DEĞİŞMEZ (hash korunur). */
import { readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const DIE = (m) => { console.error("FAIL-CLOSED: " + m); process.exit(1); };

const yol = "app.js";
const kaynak = readFileSync(yol, "utf8");
if (kaynak.includes("EKDERS-OZET-CSV-YAMASI")) {
  console.log("Zaten uygulanmış — EKDERS-OZET-CSV-YAMASI");
  process.exit(2);
}

/* ---------- Hedef tekillik + kapsam assertleri (yazmadan ÖNCE) ---------- */
const tekil = (s) => kaynak.split(s).length === 2;
for (const s of [
  'var kartlar =\n    kart("#e6fffa", "#2dd4bf", "fa-regular fa-clock", c1Ad, toplam, "birebir ders · " + donemAlt()) +',
  '  var dag = {};\n  ak.forEach(function (l) { dag[l.dersId || "?"] = (dag[l.dersId || "?"] || 0) + 1; });\n  var sirali = Object.keys(dag).map(function (k) { return { id: k, n: dag[k] }; }).sort(function (a, b) { return b.n - a.n; });\n  var uyari = "";',
  'function csvTumunuIndir() {\n  csvKadroIndir(); csvDersIndir(); csvIstekIndir();\n  toast("3 CSV indirildi ✓ — tarayıcı engellerse ayrı butonları kullanın.", "uyari");\n}',
  "'<button onclick=\"csvIstekIndir()\""
]) if (!tekil(s)) DIE("hedef blok tekil değil: " + JSON.stringify(s.slice(0, 60)));
if (!/function renderOzet\(\)/.test(kaynak) || !/function renderAnaliz\(\)/.test(kaynak)) DIE("renderOzet/renderAnaliz yok");
if (!/function csvDosya\(/.test(kaynak) || !/function csvIndir\(/.test(kaynak)) DIE("csv yardımcıları yok");
if (!kaynak.includes('var CSV_BASLIK_ISTEK')) DIE("CSV başlık sabitleri yok");

/* gunluk/haftalik görüntü blokları + kapsam dışı dosyalar hash'i (korunacak) */
const hashGunluk = sha(kaynak.slice(kaynak.indexOf("function gunlukTablo() {"), kaynak.indexOf("function haftalikOgrtTablo() {")));
const hashHaftalik = sha(kaynak.slice(kaynak.indexOf("function haftalikOgrtTablo() {"), kaynak.indexOf("function pngAc() {")));
for (const f of ["index.html", "ek-ders.js"]) { try { statSync(f); } catch (e) { DIE("kapsam dışı dosya yok: " + f); } }

/* ---------- Yedek (varsa üzerine YAZILMAZ) ---------- */
const bak = "app.js.ekders-ozet-csv-oncesi.bak";
try { statSync(bak); console.log("Yedek zaten var — üzerine yazılmadı: " + bak); }
catch (e) { copyFileSync(yol, bak); console.log("Yedek alındı: " + bak); }
console.log("Yedek SHA-256: " + sha(readFileSync(bak, "utf8")));

/* ---------- Yamalar ---------- */
let sonuc = kaynak;

/* 1) renderOzet: ek ders kartı (birebir kartları ve sayıları aynen) */
const eskiKartlar =
  'var kartlar =\n' +
  '    kart("#e6fffa", "#2dd4bf", "fa-regular fa-clock", c1Ad, toplam, "birebir ders · " + donemAlt()) +\n' +
  '    kart("#ebf8ff", "#60a5fa", "fa-solid fa-users", "Aktif Öğrenci", ogrenciSayi, "takip edilen öğrenci · " + donemAlt()) +\n' +
  '    kart("#fefcbf", "#f59e0b", "fa-solid fa-calendar-check", c3Ad, planlanan, "planlanan ders sayısı") +\n' +
  '    kart("#faf5ff", "#a78bfa", "fa-solid fa-book-open", "Toplam Ders", tumArsiv, "tüm zamanlar");';
const yeniKartlar =
  'var ekDerslerAktif = aktifDonemKayitlari(Array.isArray(DB.ekDersler) ? DB.ekDersler : []).filter(function (l) { return l && l.durum !== "iptal"; }); /* EKDERS-OZET-CSV-YAMASI: ayrı kategori; toplam birebir ders sayısına EKLENMEZ */\n' +
  eskiKartlar.replace(
    '    kart("#faf5ff", "#a78bfa", "fa-solid fa-book-open", "Toplam Ders", tumArsiv, "tüm zamanlar");',
    '    kart("#faf5ff", "#a78bfa", "fa-solid fa-book-open", "Toplam Ders", tumArsiv, "tüm zamanlar") +\n' +
    '    kart("#fffbeb", "#f59e0b", "fa-solid fa-clipboard-list", "Ek Ders", ekDerslerAktif.length, "sınıf ek dersi · " + donemAlt()); /* EKDERS-OZET-CSV-YAMASI: ayrı "Ek Ders" kategorisi */'
  );
sonuc = sonuc.replace(eskiKartlar, yeniKartlar);
if (!sonuc.includes('EKDERS-OZET-CSV-YAMASI: ayrı "Ek Ders" kategorisi')) DIE("renderOzet yaması uygulanamadı");

/* 2) renderAnaliz: ayrı "Ek Ders" kategorisi bloğu (dag/topOgr/topOgrt hesapları aynen) */
const eskiAnaliz =
  '  var dag = {};\n' +
  '  ak.forEach(function (l) { dag[l.dersId || "?"] = (dag[l.dersId || "?"] || 0) + 1; });\n' +
  '  var sirali = Object.keys(dag).map(function (k) { return { id: k, n: dag[k] }; }).sort(function (a, b) { return b.n - a.n; });\n' +
  '  var uyari = "";';
const yeniAnaliz =
  '  var dag = {};\n' +
  '  ak.forEach(function (l) { dag[l.dersId || "?"] = (dag[l.dersId || "?"] || 0) + 1; });\n' +
  '  var sirali = Object.keys(dag).map(function (k) { return { id: k, n: dag[k] }; }).sort(function (a, b) { return b.n - a.n; });\n' +
  '  /* EKDERS-OZET-CSV-YAMASI: ek dersler ayrı "Ek Ders" kategorisi — birebir/grup sayımlarına KARIŞMAZ, her kayıt TEK kez sayılır */\n' +
  '  var ekDerslerAktif = aktifDonemKayitlari(Array.isArray(DB.ekDersler) ? DB.ekDersler : []).filter(function (l) { return l && l.durum !== "iptal"; });\n' +
  '  var ekToplam = ekDerslerAktif.length;\n' +
  '  var ekOgrt = {};\n' +
  '  ekDerslerAktif.forEach(function (l) { var k = l.ogretmenAd || "Bilinmiyor"; ekOgrt[k] = (ekOgrt[k] || 0) + 1; });\n' +
  '  var ekOgrtSirali = Object.keys(ekOgrt).map(function (k) { return { k: k, n: ekOgrt[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 5);\n' +
  '  var uyari = "";';
sonuc = sonuc.replace(eskiAnaliz, yeniAnaliz);
if (!sonuc.includes("EKDERS-OZET-CSV-YAMASI: ek dersler ayrı")) DIE("renderAnaliz yaması uygulanamadı");

/* 2b) analiz çıktısına ek ders kategorisi bloğu ekle (analizIcerik grid'inden hemen sonra) */
const eskiCikis =
  '        \'<div class="px-5 pb-5">\' + uyari + "</div>" +\n' +
  '      "</div></div>";\n}';
const yeniCikis =
  '        \'<div class="px-5 pb-5">\' + uyari + "</div>" +\n' +
  '        /* EKDERS-OZET-CSV-YAMASI: ayrı "Ek Ders" kategorisi kartı (yalnız aktif dönem, iptal hariç) */\n' +
  '        \'<div class="px-5 pb-5"><div class="rounded-2xl border border-amber-100 bg-amber-50/50 p-4"><h4 class="text-[12px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-2 mb-2"><i class="fa-solid fa-clipboard-list"></i> Ek Ders kategorisi</h4>\' +\n' + /* SATIR-1 */
  '          (ekToplam ? \'<p class="text-[12.5px] text-slate-600"><b>\' + ekToplam + " ek ders</b> bu dönemde planlandı (birebir/grup ders sayılarına dahil değildir). Ek Ders ayrı bir kategoridir.</p>" +\n' + /* SATIR-2-FIX3 */
  '            (ekOgrtSirali.length ? \'<div class="mt-2 space-y-1">\' + ekOgrtSirali.map(function (x, i) {\n' +
  '              return \'<div class="flex items-center gap-3 py-1.5 border-b border-amber-100/60 last:border-0"><span class="w-6 h-6 rounded-full text-[10.5px] font-extrabold flex items-center justify-center shrink-0 bg-amber-100 text-amber-700">\' + (i + 1) + "</span><span class=\'flex-1 min-w-0 text-[13px] font-semibold text-slate-700 truncate\'>" + esc(x.k) + "</span><span class=\'text-[11px] font-bold text-slate-400 bg-white rounded-full px-2.5 py-1 whitespace-nowrap\'>" + x.n + " ek ders</span></div>";\n' +
  '            }).join("") + "</div>" : "")\n' +
  '          : \'<p class="text-[12px] text-slate-400 py-2 text-center">Bu dönemde ek ders kaydı yok.</p>\') +\n' +
  '        "</div></div>" +\n' +
  '      "</div></div>";\n}';
sonuc = sonuc.replace(eskiCikis, yeniCikis);
if (!sonuc.includes("Ek Ders kategorisi")) DIE("renderAnaliz çıktı bloğu uygulanamadı");

/* 3) CSV: başlık şeması + satır üretici + indir fonksiyonu (mevcut CSV bloklarına DOKUNULMAZ) */
const csvEkle =
  '\n/* ---- EKDERS-OZET-CSV-YAMASI: Ek Ders CSV dışa aktarma (yalnızca export; import ayrı dilim) ----\n' +
  '   Kolon şeması: schema;dataset;donemId;tip;id;... (mevcut yardımcılarla UTF-8 BOM + ; + CRLF).\n' +
  '   ID alanları korunur; isimle eşleştirme/birleştirme YOK. Yalnız aktif dönemin kayıtları girer. */\n' +
  'var CSV_BASLIK_EKDERS = ["schema","dataset","donemId","tip","id","sinif","sinifId","dersId","dersAd","konu","ogretmenId","ogretmenAd","tarih","saat","kod","durum","olusturma","ekAlanlarJson"];\n' +
  'function csvEkDersSatirlari() {\n' +
  '  var donem = aktifDonemId();\n' +
  '  return aktifDonemKayitlari(Array.isArray(DB.ekDersler) ? DB.ekDersler : []).filter(function (l) { return l && l.durum !== "iptal"; }).map(function (l) {\n' +
  '    return [CSV_SCHEMA, "ekders", l.donemId || donem, "ekders", l.id || "", l.sinif || "", sinifId(l.sinif) || "", l.dersId || "", csvDersAd(l.dersId), l.konu || "", l.ogretmenId || "", l.ogretmenAd || "", l.tarih || "", l.saat || "", l.kod || "", l.durum || "", l.olusturma || "", csvEkAlanlar(l)];\n' +
  '  });\n' +
  '}\n' +
  'function csvEkDersIndir() {\n' +
  '  var id = aktifDonemId();\n' +
  '  csvIndir("yks-ek-dersler-" + id + ".csv", CSV_BASLIK_EKDERS, csvEkDersSatirlari());\n' +
  '  toast("Aktif dönem ek ders CSV indirildi ✓ (" + id + ")");\n' +
  '}\n';
const csvAnchor = 'function csvHucre(v) {';
if (!tekil(csvAnchor)) DIE("csvAnchor tekil değil");
sonuc = sonuc.replace(csvAnchor, csvEkle + csvAnchor);

/* csvTumunuIndir'e ekleme (mevcut 3 davranış aynen + 4.) */
const eskiTum =
  'function csvTumunuIndir() {\n' +
  '  csvKadroIndir(); csvDersIndir(); csvIstekIndir();\n' +
  '  toast("3 CSV indirildi ✓ — tarayıcı engellerse ayrı butonları kullanın.", "uyari");\n' +
  '}';
const yeniTum =
  'function csvTumunuIndir() {\n' +
  '  csvKadroIndir(); csvDersIndir(); csvIstekIndir(); csvEkDersIndir(); /* EKDERS-OZET-CSV-YAMASI: ek ders dosyası eklendi */\n' +
  '  toast("4 CSV indirildi ✓ — tarayıcı engellerse ayrı butonları kullanın.", "uyari");\n' +
  '}';
sonuc = sonuc.replace(eskiTum, yeniTum);
if (!sonuc.includes("4 CSV indirildi")) DIE("csvTumunuIndir yaması uygulanamadı");

/* 4) CSV UI butonu (mevcut buton satırı aynen korunur, yanına ek ders butonu) */
const eskiBtn = "'<button onclick=\"csvIstekIndir()\"";
const btnIdx = sonuc.indexOf(eskiBtn);
const btnLineEnd = sonuc.indexOf("\n", btnIdx);
const btnSatir = sonuc.slice(btnIdx, btnLineEnd);
const yeniBtnSatir = btnSatir + " +\n" +
  "        '<button onclick=\"csvEkDersIndir()\" class=\"rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11.5px] font-bold px-3.5 py-2 transition-colors\"><i class=\"fa-solid fa-clipboard-list mr-1\"></i>Aktif Ek Dersleri CSV İndir</button>' /* EKDERS-OZET-CSV-YAMASI */";
sonuc = sonuc.slice(0, btnIdx) + yeniBtnSatir + sonuc.slice(btnLineEnd);
if (!sonuc.includes("csvEkDersIndir()\" class=")) DIE("UI butonu eklenemedi");

/* ---------- Yazma ÖNCESİ son assertler ---------- */
for (const kanit of [
  "aktifDonemKayitlari(Array.isArray(DB.ekDersler) ? DB.ekDersler : [])",
  '"yks-ek-dersler-" + id + ".csv"',
  'var CSV_BASLIK_EKDERS'
]) if (!sonuc.includes(kanit)) DIE("yama kanıtı yok: " + kanit);
if (sonuc.split("csvEkDersIndir").length < 4) DIE("csvEkDersIndir bağlantı sayısı beklenmedik");
/* mevcut CSV blokları hash korunumu — yama yalnız eklemeli, bu bloklar yerinde değişmedi: */
for (const b of ["function csvHucre(v) {", "function csvDosya(basliklar, satirlar) {", "function csvParse(metin) {",
  "function csvKadroSatirlari() {", "function csvKayitSatiri(kayit, dataset) {", "function csvAktifDonemKayitSatirlari(dataset) {",
  "function csvDersIndir() {", "function csvIstekIndir() {", "function csvKadroIndir() {"]) {
  const blok = (src, bName) => { const i = src.indexOf(bName); let j = src.indexOf("\nfunction ", i + 10); if (j === -1) j = src.length; return src.slice(i, j); };
  const kes = (src) => sha(blok(src, b));
  if (kes(kaynak) !== kes(sonuc)) DIE("mevcut CSV bloğu değişti: " + b);
}
if (sha(sonuc.slice(sonuc.indexOf("function gunlukTablo() {"), sonuc.indexOf("function haftalikOgrtTablo() {"))) !== hashGunluk) DIE("gunlukTablo değişti");
if (sha(sonuc.slice(sonuc.indexOf("function haftalikOgrtTablo() {"), sonuc.indexOf("function pngAc() {"))) !== hashHaftalik) DIE("haftalikOgrtTablo değişti");

writeFileSync(yol, sonuc);
console.log("EKDERS-OZET-CSV-YAMASI uygulandı ✓ — değişen dosya: app.js");
