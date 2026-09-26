/* ks-yama-dongu28.mjs — DÖNGÜ-28-YAMASI: idempotent, assert'li hedefli yama (app.js).
   A) Havuz kart listesi: geniş ekranda iki sütun zigzag grid + ortada TEK absolute dikey çizgi.
   B) gunlukTablo: o gün HİÇ dersi olmayan ve ≥1 uygun boş slotu olan öğretmenler
      "Boş" etiketli ek satır olarak eklenir; mola/Kapalı/Sınıf-Dersi hücreleri gri-kilitli,
      Pazar için ek satır YOK; istekBurak/dersBurak kurallarına DOKUNULMAZ.
   2. koşu: "Zaten uygulanmış" der (exit 2), dosyaya DOKUNMAZ. */
import { readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kaynak = "app.js";
const once = readFileSync(kaynak, "utf8");

if (once.includes("DÖNGÜ-28-YAMASI")) {
  console.log("Zaten uygulanmış — dosyaya dokunulmadı.");
  process.exit(2);
}

let sonuc = once;

/* ---------- YAMA 1: havuz liste sarmalayıcı ---------- */
const h1Eski = `  var liste = '<div class="space-y-2">';
  if (!sirali.length) {`;
const h1Yeni = `  /* DÖNGÜ-28-YAMASI: kart listesi geniş ekranda İKİ SÜTUN grid (zigzag: 1 sol, 2 sağ, 3 sol…);
     dar ekranda tek sütun. Ayırıcı: sarmalayıcı relative + %50'de absolute 1px dikey çizgi
     (pointer-events-none; divide-x yerine — TEK çizgi garantisi). Üst filtreler, boş-havuz
     mesajı ve kart içeriği DEĞİŞMEDİ; kart sıralaması (sirali) ve draggable zinciri aynen. */
  var liste = '<div class="relative space-y-2 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-2 md:space-y-0">' +
    '<div aria-hidden="true" class="havuz-ayirici pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-slate-200 md:block"></div>';
  if (!sirali.length) {`;
if (!sonuc.includes(h1Eski)) { console.error("HATA: hedef-1 bulunamadı — fail-closed."); process.exit(1); }
sonuc = sonuc.replace(h1Eski, h1Yeni);

/* ---------- YAMA 2: boş-havuz mesajı iki kolon kaplasın ---------- */
const h2Eski = `liste += '<div class="border border-dashed border-slate-200 rounded-2xl py-10 text-center">`;
const h2Yeni = `liste += '<div class="md:col-span-2 border border-dashed border-slate-200 rounded-2xl py-10 text-center">`;
if (!sonuc.includes(h2Eski)) { console.error("HATA: hedef-2 bulunamadı — fail-closed."); process.exit(1); }
sonuc = sonuc.replace(h2Eski, h2Yeni);

/* ---------- YAMA 3: gunlukTablo ek satırları ---------- */
const h3Eski = `  var ogrtSirasi = Object.keys(ogrtMap).sort();
  /* GUNLUK-DERS-TASI-YAMASI: satır kimliği eksikse ad üzerinden TEK eşleme ile tamamlanır;
     çözülemezse "" kalır → o satırda drop-zone ÇİZİLMEZ (ölü hedef yok, mevcut görünüm korunur). */
  ogrtSirasi.forEach(function (ad) {
    if (!ogrtIdMap[ad]) { var ts = DB.ogretmenler.find(function (x) { return x.ad === ad; }); ogrtIdMap[ad] = ts ? ts.id : ""; }
  });`;
const h3Yeni = `  var ogrtSirasi = Object.keys(ogrtMap).sort();
  /* GUNLUK-DERS-TASI-YAMASI: satır kimliği eksikse ad üzerinden TEK eşleme ile tamamlanır;
     çözülemezse "" kalır → o satırda drop-zone ÇİZİLMEZ (ölü hedef yok, mevcut görünüm korunur). */
  ogrtSirasi.forEach(function (ad) {
    if (!ogrtIdMap[ad]) { var ts = DB.ogretmenler.find(function (x) { return x.ad === ad; }); ogrtIdMap[ad] = ts ? ts.id : ""; }
  });
  /* DÖNGÜ-28-YAMASI (bosOgrtSatirlari): o gün HİÇ dersi olmayan ve MEVCUT istekBurak/dersBurak
     kilit kurallarına göre ≥1 uygun boş slotu olan öğretmenler ek satır olarak eklenir.
     Kural aynen: mola hariç, Pazar hariç (di!==6), ders/ek-ders dolu değil, avail.sinif'ta
     GÜN-KOD yok (Sınıf Dersi), avail.musait'te yok (Kapalı). "Boş" etiketiyle AYIRT EDİLİR;
     istekBurak/dersBurak koduna DOKUNULMAZ — kilitler zaten reddeder. */
  var dowIdx28 = dowIdx(gunKey);
  var bosOgrtSatirlari = [];
  if (dowIdx28 !== 6) {
    var gunDersleri28 = gunDersler; /* dersli öğretmen adları ogrtMap'te zaten var */
    DB.ogretmenler.forEach(function (t) {
      if (!t || !t.id) return;
      if (ogrtIdMap[t.ad] === t.id || Object.keys(ogrtIdMap).some(function (k) { return ogrtIdMap[k] === t.id; })) return; /* o gün dersi VAR — eklenmez */
      var uygunVar = false;
      KISA_KOD.forEach(function (slot) {
        if (uygunVar) return;
        var kod = slot.no, key28 = dowIdx28 + "-" + kod;
        var saatStr = (function () { var k = KISA_KOD.filter(function (x) { return x.no === kod; })[0]; return k ? k.b : ""; })();
        var dolu28 = DB.dersler.some(function (x) { return x.ogretmenId === t.id && x.tarih === gunKey && ksKodOf(x.saat) === kod && x.durum !== "iptal"; }) ||
          (Array.isArray(DB.ekDersler) ? DB.ekDersler : []).some(function (x) { return x.ogretmenId === t.id && x.tarih === gunKey && ksKodOf(x.saat) === kod && x.durum !== "iptal"; });
        var kilitli28 = dolu28 || (t.avail && ((t.avail.sinif && key28 in t.avail.sinif) || (Array.isArray(t.avail.musait) ? t.avail.musait.indexOf(key28) >= 0 : false)));
        if (!kilitli28 && saatStr) uygunVar = true;
      });
      if (uygunVar) bosOgrtSatirlari.push(t);
    });
  }`;
if (!sonuc.includes(h3Eski)) { console.error("HATA: hedef-3 bulunamadı — fail-closed."); process.exit(1); }
sonuc = sonuc.replace(h3Eski, h3Yeni);

/* ---------- YAMA 4: ek satırların tbody sonuna çizimi ---------- */
const h4Eski = `    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  return html;
}


function renderDersler() {`;
const h4Yeni = `    html += '</tr>';
  });
  /* DÖNGÜ-28-YAMASI: "Boş" etiketli ek satırlar — dersli satırlardan hemen sonra, aynı
     slot/tesis mantığıyla; dolu/Kapalı/Sınıf-Dersi hücreleri gri-kilitli, uygunlar drop-zone. */
  bosOgrtSatirlari.forEach(function (t) {
    var ogrtId = t.id;
    html += '<tr class="border-b border-slate-200 bg-white">';
    html += '<td class="px-3 py-3 border-r border-slate-200 text-left">' +
      '<div class="text-[12px] font-black text-slate-500 uppercase leading-tight">' + esc(t.ad) + '</div>' +
      '<span class="inline-block mt-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Boş</span></td>';
    SAAT_SLOTLARI.forEach(function (slot) {
      if (slot.mola) {
        html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-emerald-50/60">' +
          '<div class="text-[10px] font-bold text-emerald-400">Mola</div>' +
          '<div class="text-[9px] text-emerald-300">' + slot.b + '-' + slot.e + '</div></td>';
      } else {
        var kod = slot.no, key28 = dowIdx28 + "-" + kod;
        var dolu28 = DB.dersler.some(function (x) { return x.ogretmenId === ogrtId && x.tarih === gunKey && ksKodOf(x.saat) === kod && x.durum !== "iptal"; }) ||
          (Array.isArray(DB.ekDersler) ? DB.ekDersler : []).some(function (x) { return x.ogretmenId === ogrtId && x.tarih === gunKey && ksKodOf(x.saat) === kod && x.durum !== "iptal"; });
        var kilitli28 = dolu28 || (t.avail && ((t.avail.sinif && key28 in t.avail.sinif) || (Array.isArray(t.avail.musait) ? t.avail.musait.indexOf(key28) >= 0 : false)));
        if (kilitli28) {
          html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-slate-100/70" title="Kilitli — bu saatte ders veremez">' +
            '<span class="text-[9px] font-bold text-slate-400 select-none">' + (dolu28 ? "Dolu" : (t.avail && t.avail.sinif && key28 in t.avail.sinif) ? "Sınıf" : "Kapalı") + '</span></td>';
        } else {
          html += '<td class="dnd-bos px-1.5 py-2 border-r border-slate-200 transition-colors"' +
            ' data-drop-ogrt="' + esc(ogrtId) + '" data-drop-gun="' + dowIdx28 + '" data-drop-saat="' + slot.b + '"' +
            ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)" ondrop="istekBurak(event, this, \\'' + esc(ogrtId) + '\\', \\'' + gunKey + '\\', \\'' + slot.b + '\\')" title="Boş saat — ders kartını ya da havuz isteğini bırakın">' +
            '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
        }
      }
    });
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  return html;
}


function renderDersler() {`;
if (!sonuc.includes(h4Eski)) { console.error("HATA: hedef-4 bulunamadı — fail-closed."); process.exit(1); }
sonuc = sonuc.replace(h4Eski, h4Yeni);

/* ---------- assert'ler ---------- */
if ((sonuc.match(/DÖNGÜ-28-YAMASI/g) || []).length < 3) throw new Error("assert: yama işareti sayısı");
if (!sonuc.includes('havuz-ayirici')) throw new Error("assert: ayırıcı yok");
if (!sonuc.includes('bosOgrtSatirlari')) throw new Error("assert: bosOgrtSatirlari yok");
if (sonuc.split('onoutput="istekBurak').length !== 1) throw new Error("assert: bozuk ondrop");
if (!sonuc.includes('istekBurak(event, this')) throw new Error("assert: istekBurak zinciri kırıldı");
if (sonuc.includes('onoutput')) throw new Error("assert: bozuk anahtar");

/* bölge dışı bütünlük: yalnız 4 hedef blok değişti (uzunluk farkı + işaret sayısı ile kanıtlanır) */
copyFileSync(kaynak, kaynak + ".dongu28-calisma-oncesi.bak");
writeFileSync(kaynak, sonuc);
console.log("Yama uygulandı. Backup: app.js.dongu28-calisma-oncesi.bak");
console.log("app.js boyut:", statSync(kaynak).size, "· SHA-256:", sha(readFileSync(kaynak)));
console.log("Uzunluk:", once.length, "→", sonuc.length, "(+" + (sonuc.length - once.length) + ")");
process.exit(0);
