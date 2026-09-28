/* D34-GRUP-UYE-YAZ yaması — "ek öğrenci > 0 ⇒ ogrenciIds ZORUNLU" DEĞİŞMEZİNİ TEK KAPIYA indir.
   KÖK NEDEN (D32 sonrası kalan yapısal risk): ogrenciIds alanı 5 ayrı yerde ELLE yazılıyordu
   (planla() yeni grup, planla() grup düzenleme, istekBurak(), dersHavuzaGeriBurak(), istekGrupEkle()).
   Her yol kendi filtresini/sırasını uyguluyordu; bir yolun atlanması veya düzenleme dalının
   mevcut üyeleri düşürmesi veri kaybı üretir.
   YAMA:
   1) grupUyeYaz(hedef, anaId, ekIds) TEK yazma kapısı (yoksa eklenir).
   2) 5 yazma yolu bu kapıdan geçirilir (elle `ogrenciIds =` atamaları KALDIRILIR).
   3) Düzenleme dalı: form ek listesi boşalsa bile mevcut grup üyeleri SİLİNMEZ (korumalı);
      üye çıkarma yalniz panelden AÇIKÇA yapılır (ui.uyeDegisti).
   4) ADIM-4: ders düzenleme/planlama sırasında ilgili istek kaydının üyeleri SENKRON güncellenir;
      havuza dönmüş bekleyen istek kartına "Grup Üyelerini Ekle/Çıkar" alanı eklenir.
   İdempotent: uygulanmışsa "Zaten uygulanmış" + exit 2, dosyaya dokunmaz. */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { createHash } from "crypto";

const dosya = "app.js";
const once = readFileSync(dosya, "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");

if (once.includes("D34-GRUP-UYE-YAZ")) {
  console.error("Zaten uygulanmış (D34-GRUP-UYE-YAZ)");
  process.exit(2);
}

const yedek = "app.js.d34-grup-uye-oncesi.bak";
if (!existsSync(yedek)) { copyFileSync(dosya, yedek); console.log("Yedek alındı:", yedek); }

let s = once;
function degis(etiket, eski, yeni, kez) {
  const n = kez === undefined ? 1 : kez;
  const adet = s.split(eski).length - 1;
  if (adet !== n) { console.error("ANCHOR HATASI [" + etiket + "]: bulunan=" + adet + " beklenen=" + n); process.exit(1); }
  s = s.split(eski).join(yeni);
  console.log("  ✓ " + etiket);
}

/* ---- 1) TEK KAPI: grupUyeYaz (yoksa ekle) ---- */
const HELPER_ANCHOR = `  if (ders.ogrenciId != null && ders.ogrenciId !== "") return [ders.ogrenciId];
  return [];
}

/* ---------- Grup ders görünüm yardımcıları ----------`;
const HELPER = `  if (ders.ogrenciId != null && ders.ogrenciId !== "") return [ders.ogrenciId];
  return [];
}

/* ---------- Grup üye YAZMA yardımcısı (TEK KAPI) — D34-GRUP-UYE-YAZ ----------
   DEĞİŞMEZ: "ek öğrenci > 0 ⇒ ogrenciIds ZORUNLU".
   Tüm yazım yolları (planla() yeni/düzenleme, istekBurak(), dersHavuzaGeriBurak(), istekGrupEkle())
   ogrenciIds alanını YALNIZCA buradan yazar/siler — dağınık elle atama YOK.
   - anaId: ana/sahip öğrenci id (boş bırakılırsa ogrenciId'ye dokunulmaz)
   - ekIds: ek üyeler; benzersiz, ana hariç, boş/geçersiz değerler atılır
   - ek > 0 → hedef.ogrenciIds = [ek...]  (ZORUNLU alan)
   - ek = 0 → hedef.ogrenciIds SİLİNİR (tekli kayıt = eski şema)
   Dönüş: yazılan ek üye dizisi (kopya). */
function grupUyeYaz(hedef, anaId, ekIds) {
  if (!hedef || typeof hedef !== "object") return [];
  var ana = (anaId == null || anaId === "") ? null : anaId;
  var ekler = [];
  (Array.isArray(ekIds) ? ekIds : []).forEach(function (oid) {
    if (oid == null || oid === "") return;
    if (ana != null && oid === ana) return;
    if (ekler.indexOf(oid) >= 0) return;
    ekler.push(oid);
  });
  if (ana != null) hedef.ogrenciId = ana;
  if (ekler.length) hedef.ogrenciIds = ekler.slice();
  else if ("ogrenciIds" in hedef) delete hedef.ogrenciIds;
  return ekler.slice();
}

/* ---------- Grup ders görünüm yardımcıları ----------`;
if (!s.includes("function grupUyeYaz(hedef, anaId, ekIds)")) {
  degis("1) TEK KAPI grupUyeYaz eklendi", HELPER_ANCHOR, HELPER);
} else {
  console.log("  · grupUyeYaz zaten var (adım atlandı)");
}

/* ---- 2) planla() grup DÜZENLEME dalı ---- */
degis("2) planla() grup düzenleme → grupUyeYaz",
`        mg.ogrenciIds = grupOgrenciIds.slice();
        mg.ogrenciId = o.id; mg.ogrenciAd = o.ad;`,
`        grupUyeYaz(mg, o.id, grupOgrenciIds); /* D34-GRUP-UYE-YAZ: ek>0 ⇒ ogrenciIds ZORUNLU (tek kapı) */
        mg.ogrenciAd = o.ad;`);

/* ---- 3) planla() grup YENİ kayıt dalı ---- */
degis("3) planla() yeni grup → grupUyeYaz",
`      DB.dersler.push({
        id: uid(), ogrenciId: o.id, ogrenciIds: grupOgrenciIds.slice(), ogrenciAd: o.ad, dersId: dersId, konu: konu,
        ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
        durum: "planlandi", olusturma: todayKey(),
        donemId: aktifDonemId() /* DONEM-DAMGA-YAMASI: yeni grup dersi aktif döneme damgalanır */
      });`,
`      var yeniGrup = {
        id: uid(), ogrenciAd: o.ad, dersId: dersId, konu: konu,
        ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
        durum: "planlandi", olusturma: todayKey(),
        donemId: aktifDonemId() /* DONEM-DAMGA-YAMASI: yeni grup dersi aktif döneme damgalanır */
      };
      grupUyeYaz(yeniGrup, o.id, grupOgrenciIds); /* D34-GRUP-UYE-YAZ: ek>0 ⇒ ogrenciIds ZORUNLU (tek kapı) */
      DB.dersler.push(yeniGrup);`);

/* ---- 4) planla() grup YENİ: ilgili istek üyeleri SENKRON (ADIM-4) ---- */
degis("4) planla() yeni grup → istek üyeleri senkron",
`      /* ISTEK-GRUP: istekten planlandıysa istek kaydının SAHİBİ (ogrenciId) ve diğer alanları değişmez; yalnızca durum güncellenir */
      if (ui.aktifIstekId) {
        var _r2 = DB.istekler.find(function (x) { return x.id === ui.aktifIstekId; });
        if (_r2) { _r2.durum = "planlandi"; }`,
`      /* D34-GRUP-UYE-YAZ ADIM-4: istekten planlandıysa ilgili istek üyeleri SENKRON güncellenir + durum planlandi */
      if (ui.aktifIstekId) {
        var _r2 = DB.istekler.find(function (x) { return x.id === ui.aktifIstekId; });
        if (_r2) { grupUyeYaz(_r2, o.id, grupOgrenciIds); _r2.durum = "planlandi"; }`);

/* ---- 5) planla() TEKLİ DÜZENLEME dalı: üyeler KORUNUR ---- */
degis("5) planla() tekli düzenleme → üye koruması",
`  } else if (ui.editId) {
    var mevcut = DB.dersler.find(function (x) { return x.id === ui.editId; });
    if (mevcut) {
      mevcut.ogrenciId = o.id; mevcut.ogrenciAd = o.ad;
      mevcut.dersId = dersId; mevcut.konu = konu;`,
`  } else if (ui.editId) {
    var mevcut = DB.dersler.find(function (x) { return x.id === ui.editId; });
    if (mevcut) {
      /* D34-GRUP-UYE-YAZ KORUMA: düzenlemede form ek listesi boşalsa bile mevcut grup üyeleri
         SİLİNMEZ; üye çıkarma yalnızca panelden AÇIKÇA yapılır (ui.uyeDegisti) — o zaman da tek kapı temizler. */
      var _korunanEkler = Array.isArray(mevcut.ogrenciIds) ? mevcut.ogrenciIds.slice() : [];
      grupUyeYaz(mevcut, o.id, ui.uyeDegisti ? grupOgrenciIds : _korunanEkler);
      mevcut.ogrenciAd = o.ad;
      mevcut.dersId = dersId; mevcut.konu = konu;`);

/* ---- 6) planla() TEKLİ YENİ: ilgili istek üyeleri SENKRON (ADIM-4) ---- */
degis("6) planla() tekli yeni → istek üyeleri senkron",
`    if (ui.aktifIstekId) {
      var r = DB.istekler.find(function (x) { return x.id === ui.aktifIstekId; });
      if (r) { r.durum = "planlandi"; }
      ui.aktifIstekId = null;
    }`,
`    if (ui.aktifIstekId) {
      var r = DB.istekler.find(function (x) { return x.id === ui.aktifIstekId; });
      /* D34-GRUP-UYE-YAZ ADIM-4: tekli planlamada ilgili istek üyeleri SENKRON (ek yok ⇒ ogrenciIds temizlenir) */
      if (r) { grupUyeYaz(r, o.id, grupOgrenciIds); r.durum = "planlandi"; }
      ui.aktifIstekId = null;
    }`);

/* ---- 7) temizleForm(): uyeDegisti sıfırla ---- */
degis("7) temizleForm → uyeDegisti sıfırla",
`  var panelKirli = ui.panelSecim && (ui.panelSecim.acik || ui.panelSecim.arama || ui.panelSecim.sinif);`,
`  ui.uyeDegisti = false;
  var panelKirli = ui.panelSecim && (ui.panelSecim.acik || ui.panelSecim.arama || ui.panelSecim.sinif);`);

/* ---- 8) grupPanelSec(): panelden açık değişim işareti ---- */
degis("8) grupPanelSec → uyeDegisti = true",
`function grupPanelSec(oid) {
  if (!oid) return;`,
`function grupPanelSec(oid) {
  if (!oid) return;
  ui.uyeDegisti = true; /* D34-GRUP-UYE-YAZ: üye listesi panelden AÇIKÇA değiştirildi */`);

/* ---- 9) duzenle(): uyeDegisti sıfırla ---- */
degis("9) duzenle → uyeDegisti sıfırla",
`  ui.editId = id; ui.aktifIstekId = null;
  ui.ekOgrenciIds = dersOgrenciIds(l).filter(function (oid) { return oid && oid !== l.ogrenciId; });`,
`  ui.editId = id; ui.aktifIstekId = null; ui.uyeDegisti = false;
  ui.ekOgrenciIds = dersOgrenciIds(l).filter(function (oid) { return oid && oid !== l.ogrenciId; });`);

/* ---- 10) istekBurak(): grup üyeleri tek kapıdan ---- */
degis("10) istekBurak → grupUyeYaz",
`  var _d26Ekler = (Array.isArray(r.ogrenciIds) ? r.ogrenciIds.slice() : []);
  var _d26Yeni = {
    id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: r.dersId, konu: r.konu || "",
    ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
    durum: "planlandi", olusturma: todayKey()
  };
  if (_d26Ekler.length) _d26Yeni.ogrenciIds = _d26Ekler;
  DB.dersler.push(_d26Yeni);`,
`  var _d26Yeni = {
    id: uid(), ogrenciAd: o.ad, dersId: r.dersId, konu: r.konu || "",
    ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
    durum: "planlandi", olusturma: todayKey()
  };
  grupUyeYaz(_d26Yeni, o.id, Array.isArray(r.ogrenciIds) ? r.ogrenciIds : []); /* D34-GRUP-UYE-YAZ: ek>0 ⇒ ogrenciIds ZORUNLU (tek kapı) */
  DB.dersler.push(_d26Yeni);`);

/* ---- 11) dersHavuzaGeriBurak(): üyelik korunur, tek kapıdan ---- */
degis("11) dersHavuzaGeriBurak → grupUyeYaz",
`    var yeniIstek = {
      id: uid(), ogrenciId: l.ogrenciId, ogrenciAd: (anaO ? anaO.ad : (l.ogrenciAd || "")),
      dersId: l.dersId, konu: l.konu || "", durum: "bekliyor",
      olusturma: l.olusturma || todayKey(), donemId: aktifDonemId()
    };
    if (ekler.length) yeniIstek.ogrenciIds = ekler; /* üyelik aynen korunur */
    DB.istekler.push(yeniIstek);`,
`    var yeniIstek = {
      id: uid(), ogrenciAd: (anaO ? anaO.ad : (l.ogrenciAd || "")),
      dersId: l.dersId, konu: l.konu || "", durum: "bekliyor",
      olusturma: l.olusturma || todayKey(), donemId: aktifDonemId()
    };
    grupUyeYaz(yeniIstek, l.ogrenciId, ekler); /* üyelik aynen korunur; D34-GRUP-UYE-YAZ: ek>0 ⇒ ogrenciIds ZORUNLU */
    DB.istekler.push(yeniIstek);`);

/* ---- 12) istekGrupEkle(): ortak grup isteği tek kapıdan ---- */
degis("12) istekGrupEkle → grupUyeYaz",
`  DB.istekler.push({ id: uid(), ogrenciId: anaId, ogrenciIds: ekler, ogrenciAd: anaO ? anaO.ad : "", dersId: dersId, konu: konu, durum: "bekliyor", olusturma: todayKey(), donemId: aktifDonemId() /* DONEM-DAMGA-YAMASI: yeni grup istek aktif döneme damgalanır */ });`,
`  var yeniGrupIstek = { id: uid(), ogrenciAd: anaO ? anaO.ad : "", dersId: dersId, konu: konu, durum: "bekliyor", olusturma: todayKey(), donemId: aktifDonemId() /* DONEM-DAMGA-YAMASI: yeni grup istek aktif döneme damgalanır */ };
  grupUyeYaz(yeniGrupIstek, anaId, ekler); /* D34-GRUP-UYE-YAZ: ek>0 ⇒ ogrenciIds ZORUNLU (tek kapı) */
  DB.istekler.push(yeniGrupIstek);`);

/* ---- 13) renderHavuz(): kart HTML'i değişkene al (editör eklenecek) ---- */
degis("13) renderHavuz kart HTML değişkeni",
`    liste += '<div draggable="' + bekliyor + '" data-istek="' + r.id + '" class="istek-kart flex items-center gap-3 rounded-xl border px-3.5 py-2.5 '`,
`    var kartHTML = '<div draggable="' + bekliyor + '" data-istek="' + r.id + '" class="istek-kart flex items-center gap-3 rounded-xl border px-3.5 py-2.5 '`);

/* ---- 14) renderHavuz(): kart sonuna üye editörü (ADIM-4) ---- */
degis("14) renderHavuz üye editörü ekleniyor",
`      '<button onclick="istekSil(\\'' + r.id + '\\')" class="w-7 h-7 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 shrink-0"><i class="fa-solid fa-trash-can text-[12px]"></i></button></div>';
  });`,
`      '<button onclick="istekSil(\\'' + r.id + '\\')" class="w-7 h-7 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 shrink-0"><i class="fa-solid fa-trash-can text-[12px]"></i></button></div>';
    if (bekliyor) kartHTML += istekUyeEditorHTML(r); /* D34-GRUP-UYE-YAZ ADIM-4: bekleyen istek kartına üye ekle/çıkar */
    liste += kartHTML;
  });`);

/* ---- 15) ADIM-4 fonksiyonları + istekSil temizliği ---- */
const ISTEK_SIL_ESKI = `function istekSil(id) {
  DB.istekler = DB.istekler.filter(function (r) { return r.id !== id; });`;
const ISTEK_SIL_YENI = `/* ================================================================
   D34-GRUP-UYE-YAZ ADIM-4 — HAVUZ İSTEĞİ: "Grup Üyelerini Ekle/Çıkar"
   Bekleyen bir isteğin üyeleri doğrudan kart üzerinden düzenlenir; kaydedince
   grupUyeYaz TEK KAPISINDAN ogrenciId + ogrenciIds SENKRON yazılır. Mevcut chip düzeni korunur.
   ================================================================ */
function istekUyeEditorHTML(r) {
  var uyeler = istekOgrenciIds(r);
  if (ui.istekUyeId !== r.id) {
    return '<div class="mt-1 px-1"><button type="button" onclick="istekUyeAc(\\'' + esc(r.id) + '\\')" class="text-[10.5px] font-bold text-slate-400 hover:text-teal-600 inline-flex items-center gap-1 transition-colors"><i class="fa-solid fa-user-group text-[10px]"></i>Grup üyelerini ekle/çıkar (' + uyeler.length + ')</button></div>';
  }
  var taslak = Array.isArray(ui.istekUyeTaslak) ? ui.istekUyeTaslak : [];
  var satir = DB.ogrenciler.map(function (o) {
    var sec = taslak.indexOf(o.id) >= 0;
    return '<label class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white cursor-pointer"><input type="checkbox"' + (sec ? " checked" : "") +
      ' onchange="istekUyeSec(\\'' + esc(r.id) + '\\',\\'' + esc(o.id) + '\\')" class="w-3.5 h-3.5 shrink-0 accent-teal-600" />' +
      '<span class="text-[11.5px] text-slate-600 truncate">' + esc(o.ad) + (o.sinif ? ' <span class="text-slate-300">· ' + esc(o.sinif) + "</span>" : "") + "</span></label>";
  }).join("");
  return '<div class="mt-1 rounded-xl border border-teal-200 bg-teal-50/40 p-2.5">' +
    '<div class="text-[10.5px] font-extrabold text-teal-700 mb-1"><i class="fa-solid fa-user-group mr-1"></i>Grup Üyelerini Ekle/Çıkar</div>' +
    '<div class="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-3">' + satir + "</div>" +
    '<div class="flex items-center gap-2 mt-2 flex-wrap">' +
      '<button type="button" onclick="istekUyeKaydet(\\'' + esc(r.id) + '\\')" class="rounded-full bg-teal-500 hover:bg-teal-600 text-white text-[11px] font-bold px-3 py-1.5 transition-colors">Kaydet</button>' +
      '<button type="button" onclick="istekUyeIptal()" class="rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-700 text-[11px] font-bold px-3 py-1.5 transition-colors">İptal</button>' +
      '<span class="text-[10.5px] text-slate-400 ml-auto">' + (taslak.length ? taslak.length + " üye seçili" : "üye seçilmedi — en az 1 gerekli") + "</span>" +
    "</div></div>";
}
function istekUyeAc(id) {
  var r = DB.istekler.find(function (x) { return x.id === id; });
  if (!r || r.durum !== "bekliyor") { toast("Yalnızca bekleyen isteğin üyeleri düzenlenebilir.", "uyari"); return; }
  ui.istekUyeId = id;
  ui.istekUyeTaslak = istekOgrenciIds(r).slice();
  renderHavuz();
}
function istekUyeSec(id, oid) {
  if (ui.istekUyeId !== id) return;
  if (!Array.isArray(ui.istekUyeTaslak)) ui.istekUyeTaslak = [];
  var i = ui.istekUyeTaslak.indexOf(oid);
  if (i === -1) ui.istekUyeTaslak.push(oid); else ui.istekUyeTaslak.splice(i, 1);
  renderHavuz();
}
function istekUyeIptal() { ui.istekUyeId = null; ui.istekUyeTaslak = []; renderHavuz(); }
function istekUyeKaydet(id) {
  var r = DB.istekler.find(function (x) { return x.id === id; });
  if (!r) { istekUyeIptal(); return; }
  if (!Array.isArray(ui.istekUyeTaslak) || !ui.istekUyeTaslak.length) { toast("En az 1 üye seçin.", "hata"); return; }
  var ana = ui.istekUyeTaslak[0], ekler = ui.istekUyeTaslak.slice(1);
  grupUyeYaz(r, ana, ekler); /* D34-GRUP-UYE-YAZ ADIM-4: istek.ogrenciIds SENKRON güncellenir (tek kapı) */
  var anaO = DB.ogrenciler.find(function (x) { return x.id === ana; });
  if (anaO) r.ogrenciAd = anaO.ad;
  saveDB();
  ui.istekUyeId = null; ui.istekUyeTaslak = [];
  renderHavuz();
  toast("İstek üyeleri güncellendi ✓ (" + istekOgrenciIds(r).length + " üye)");
}
function istekSil(id) {
  if (ui.istekUyeId === id) { ui.istekUyeId = null; ui.istekUyeTaslak = []; }
  DB.istekler = DB.istekler.filter(function (r) { return r.id !== id; });`;
degis("15) ADIM-4 havuz üye editörü fonksiyonları + istekSil temizliği", ISTEK_SIL_ESKI, ISTEK_SIL_YENI);

if (s === once) { console.error("Değişiklik üretilemedi"); process.exit(1); }

console.log("D34-GRUP-UYE-YAZ yaması uygulandı.");
console.log("app.js SHA önce :", sha(once));
console.log("app.js SHA sonra:", sha(s));
writeFileSync(dosya, s);
console.log("OK");
