let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 115) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-gunluk-ders-tasi.mjs kosan=" + __kosan + " beklenen=115"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-gunluk-ders-tasi.mjs:" + __kosan + ":115"); } });
/* ks-gunluk-ders-tasi.mjs — GUNLUK-DERS-TASI-YAMASI regresyon süiti.

   TEK İŞ: GÜNLÜK tabloda (gunlukTablo; satır=öğretmen, kolon=saat) MEVCUT birebir ders kartını
   AYNI SATIRDA başka BOŞ saate taşımak. Altyapı HAFTALIK dilimde kurulan MEVCUT drag&drop yoludur
   (dersDrag/dersBurak/dersDropHedef + aynı istekDragOver/istekDragLeave/istekBurak drop-zone yolu).
   ÜÇÜNCÜ paralel sistem YOKTUR; bu süit bunu kaynak düzeyinde de doğrular.

   AÇIK KARAR (v1): yalnız AYNI ÖĞRETMEN SATIRINDA saat değişikliği. Başka satıra bırakma RED
   (öğretmen otomatik değişmez). Gün değişikliği bu tabloda YOK (seçili gün sabit). Dersin
   öğretmen/tarih alanları DEĞİŞMEZ; yalnız saat/kod değişir.

   Kapsam:
     1) Kaynak sözleşmesi (mevcut altyapı yeniden kullanımı; üçüncü sistem yok)
     2) Günlük tablo satır kimliği (ogretmenId) + boş hücre drop-zone markup'ı (exact anchor)
     3) Draggable kaynak kuralı: yalnız AKTİF TEK ÖĞRENCİLİ birebir; grup / Ek Ders (amber) / iptal ✗
        Mola KESİNLİKLE drop-zone değil; Kapalı/Sınıf Dersi günlük tabloda kart olarak çizilmez (drop'ta RED)
     4) Başarı: aynı satır 6→8 (gerçek drop yolu) — TEK saveDB, yalnız saat/kod değişir (tarih/öğretmen sabit)
     5) no-op (kaynak = hedef)
     6) RED: cross-row, Mola, dolu hedef, Kapalı, Sınıf Dersi, öğretmen çakışması, öğrenci çakışması,
        toplu ders (sınıf programı), Ek Ders hedefi, grup ders kaynağı → hepsinde localStorage byte-birebir
     7) Görünüm tutarlılığı: günlük tablo + gün sekmesi + haftalık tablo AYNI DB kaydını gösterir
     8) Mevcut istek kartı akışı (runtime) bozulmadı
     9) Süit kaydı + dokunulmayan dosyaların SHA-256'sı + haftalık süitteki stale assert güncellemesi */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const scripts = [appKaynak,
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const LS_KEY = "yksOto_arsiv_v1";

/* ---------- Sahte DOM (id kayıtlı) ---------- */
const store = {};
let sayiSet = 0;                 /* saveDB → localStorage.setItem sayacı = saveDB çağrı sayısı */
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };

const reg = {};
const el = (id) => {
  const e = {
    id, textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], files: null,
    _eklenen: 0,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle() {}, contains(c) { return this._s.has(c); } },
    insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; },
    appendChild() { e._eklenen++; }, remove() {}, click() {}, focus() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
    querySelectorAll: () => [], getContext: () => null
  };
  let _html = "";
  Object.defineProperty(e, "innerHTML", {
    get() { return _html; },
    set(v) { _html = String(v); [..._html.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }
  });
  reg[id] = e;
  return e;
};
for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
global.document = {
  getElementById: (i) => reg[i] || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};
global.localStorage = {
  getItem: k => store[k] ?? null,
  setItem: (k, v) => { sayiSet++; store[k] = v; },
  removeItem: k => { delete store[k]; }
};
global.Chart = function () { this.destroy = () => {}; };
if (!globalThis.navigator) globalThis.navigator = {};

let n = 0, fail = 0;
const t = (name, cond, extra) => { __kosan++;  n++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };

/* ---------- Boot ---------- */
let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, yenile, gunlukTablo, haftalikOgrtTablo, birebirHucreHTML,
             dersDrag, dersBurak, istekDrag, istekBurak, istekDragOver, istekDragLeave,
             dersOgrenciIds, duzeltmeBul, KISA_KOD, ksKodOf, addDaysKey, dowIdx,
             aktifDonemId, DERS, esc };
  `)();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 8).join("\n"));
  process.exit(1);
}
const { DB, ui, gunlukTablo, haftalikOgrtTablo, dersDrag, dersBurak, istekDrag, istekBurak,
        istekDragOver, istekDragLeave, dersOgrenciIds, duzeltmeBul, KISA_KOD, ksKodOf,
        addDaysKey, dowIdx, aktifDonemId, DERS } = P;

/* ---------- Test ortamı: izole öğretmen + izole öğrenciler ---------- */
const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const gunKey = gelecekPzt;                            /* seçili gün SABİT (v1: gün değişikliği yok) */
const dersKey = Object.keys(DERS)[0];
const T = { id: "kg-t1", ad: "KG TEST ÖĞRETMEN", brans: dersKey, avail: { sinif: {}, musait: [] } };
const T2 = { id: "kg-t2", ad: "KG DİĞER ÖĞRETMEN", brans: dersKey, avail: { sinif: {}, musait: [] } };
const O1 = { id: "kg-o1", ad: "KG Test Öğrenci", sinif: "", tel: "" };
const O2 = { id: "kg-o2", ad: "KG İkinci Öğrenci", sinif: "", tel: "" };
DB.ogretmenler.push(T, T2); DB.ogrenciler.push(O1, O2);
if (!Array.isArray(DB.ekDersler)) DB.ekDersler = [];

const KOD6 = KISA_KOD[5].b;   /* 13:50 → 6. ders */
const KOD8 = KISA_KOD[7].b;   /* 15:30 → 8. ders */
const KOD1 = KISA_KOD[0].b;   /* 08:50 → 1. ders (boş hedef varsayılanı) */

const evt = () => ({ preventDefault() {}, dataTransfer: null });
const elStub = () => ({ classList: { add() {}, remove() {} } });
const toastSayisi = () => reg["toastAlan"] ? reg["toastAlan"]._eklenen : 0;

let sayac = 0;
const dersYap = (over) => Object.assign({
  id: "kg-d" + (++sayac), donemId: aktifDonemId(), ogrenciId: O1.id, ogrenciAd: O1.ad,
  dersId: dersKey, konu: "Limit", ogretmenId: T.id, ogretmenAd: T.ad,
  tarih: gunKey, saat: KOD6, kod: ksKodOf(KOD6), durum: "planlandi", olusturma: "2026-09-01"
}, over || {});
const dersBul = (id) => DB.dersler.find(x => x.id === id);
const temizle = () => {
  DB.dersler = DB.dersler.filter(l => !String(l.id).startsWith("kg-d"));
  DB.ekDersler = DB.ekDersler.filter(l => !String(l.id).startsWith("kg-ek"));
  T.avail = { sinif: {}, musait: [] };
  DB.ogrenciler.find(x => x.id === O1.id).sinif = "";
};

/* günlük görünüm: gun sekmesi (seçili gün sabit) */
const gunGorunum = () => { ui.filtre = "gun"; ui.anchor = gunKey; ui.gunSecim = gunKey; ui.haftalikOgrtId = null; return gunlukTablo(); };
/* haftalık görünüm: aynı DB kaydını okur */
const haftaGorunum = () => { ui.filtre = "hafta"; ui.anchor = gunKey; ui.gunSecim = ""; ui.haftalikOgrtId = T.id; return haftalikOgrtTablo(); };
/* verilen işaretten önceki son <td ...> açılış bloğunu döndürür */
const tdBlok = (h, isaret) => { const i = h.indexOf(isaret); if (i < 0) return ""; return h.slice(h.lastIndexOf("<td", i), i); };

/* GERÇEK drop yolu: dragstart (dersDrag) + boş hücreye bırakma (istekBurak → dersBurak devri) */
const tasi = (id, hedefOgrtId, hedefTarih, hedefSaat) => { dersDrag(evt(), id); istekBurak(evt(), elStub(), hedefOgrtId, hedefTarih, hedefSaat); };

function basari(ad, id, hedefSaat) {
  const ls0 = store[LS_KEY], set0 = sayiSet, o0 = JSON.parse(JSON.stringify(dersBul(id)));
  tasi(id, T.id, gunKey, hedefSaat);
  const l = dersBul(id);
  t(ad + " → ders hedef SAATE taşındı (saat + kod)", !!l && l.saat === hedefSaat && l.kod === ksKodOf(hedefSaat), l ? l.saat + " / " + l.kod : "ders yok");
  t(ad + " → TARİH ve ÖĞRETMEN DEĞİŞMEDİ (gün sabit)", !!l && l.tarih === gunKey && l.tarih === o0.tarih && l.ogretmenId === o0.ogretmenId && l.ogretmenAd === o0.ogretmenAd);
  t(ad + " → diğer alanlar aynı (id/öğrenci/ders/konu/durum/donemId)",
    !!l && l.id === o0.id && l.ogrenciId === o0.ogrenciId && l.ogrenciAd === o0.ogrenciAd && l.dersId === o0.dersId && l.konu === o0.konu && l.durum === o0.durum && l.donemId === o0.donemId);
  t(ad + " → TEK saveDB (setItem tam +1)", sayiSet - set0 === 1, String(sayiSet - set0));
  t(ad + " → localStorage yazıldı", store[LS_KEY] !== ls0);
  t(ad + " → kopya kayıt üretilmedi (tek kayıt)", DB.dersler.filter(x => x.id === id).length === 1);
  return l;
}

function red(ad, id, hedefOgrtId, hedefTarih, hedefSaat) {
  const ls0 = store[LS_KEY], db0 = JSON.stringify(DB), set0 = sayiSet, toast0 = toastSayisi();
  const yer0 = JSON.stringify(dersBul(id));
  tasi(id, hedefOgrtId, hedefTarih, hedefSaat);
  t(ad + " → RED: localStorage byte-birebir aynı", store[LS_KEY] === ls0);
  t(ad + " → RED: DB birebir aynı + saveDB çağrılmadı (" + (sayiSet - set0) + ")", JSON.stringify(DB) === db0 && sayiSet === set0);
  t(ad + " → RED: toast gösterildi", toastSayisi() > toast0);
  t(ad + " → RED: ders yerinde kaldı", JSON.stringify(dersBul(id)) === yer0);
}

/* ---- 1) Kaynak sözleşmesi (mevcut altyapı yeniden kullanımı) ---- */
console.log("1) Kaynak sözleşmesi (mevcut altyapı yeniden kullanımı):");
const bolge = (fn) => { const i = appKaynak.indexOf(fn); const j = appKaynak.indexOf("\nfunction ", i + 10); return appKaynak.slice(i, j); };
const kez = (s) => appKaynak.split(s).length - 1;
const gunlukBolge = bolge("function gunlukTablo() {");
t("dersDropHedef globali tam 1 kez (mevcut)", kez("var dersDropHedef = null;") === 1);
t("dersDrag tanımı tam 1 (YENİ sistem YOK)", kez("function dersDrag(ev, id) {") === 1);
t("dersBurak tanımı tam 1 (YENİ sistem YOK)", kez("function dersBurak(ogrtId, tarih, saat) {") === 1);
t("paralel dragover/dersDragOver YOK", !appKaynak.includes("function dersDragOver(") && kez("function istekDragOver(") === 1);
t("AYNI drop yolu (istekBurak → dersBurak devri) tam 1", kez("if (dersDropHedef) { dersBurak(ogrtId, tarih, saat); return; }") === 1);
t("drop-zone çağrısı 2 yol (haftalık + günlük), aynı handler adı", kez('ondrop="istekBurak(event, this,') === 2);
t("günlük yama işareti var (GUNLUK-DERS-TASI-YAMASI)", kez("GUNLUK-DERS-TASI-YAMASI") >= 5);
t("günlük hücre MEVCUT dersDrag'i çağırıyor (yeni fonksiyon değil)", gunlukBolge.includes('ondragstart="dersDrag(event,'));
t("günlük boş hücre MEVCUT istekDragOver/istekDragLeave/istekBurak yolunu kullanıyor",
  gunlukBolge.includes('ondragover="istekDragOver(event, this)"') && gunlukBolge.includes('ondragleave="istekDragLeave(this)"') && gunlukBolge.includes('ondrop="istekBurak(event, this,'));
t("günlük draggable yalnız tek öğrencili birebir (grup/iptal guard'ı)", gunlukBolge.includes('(ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ?'));
t("hedef saat MEVCUT SAAT_SLOTLARI yardımcısından (slot.b) — index varsayımı YOK", gunlukBolge.includes("slot.b"));
t("hedef gün MEVCUT dowIdx(gunKey) ile — gün değişmez", gunlukBolge.includes("dowIdx(gunKey)"));
t("dersBurak mevcut duzeltmeBul kontrolünü kullanıyor (kaynak hariç: staged.id)", bolge("function dersBurak(ogrtId, tarih, saat) {").includes("duzeltmeBul({ id: staged.id,"));
t("mevcut istek kartı inline handler'ı korundu (istekDrag + opaklık + ondragend sıfırlama)", (() => {
  const i = appKaynak.indexOf("istekDrag(event,");
  if (i < 0) return false;
  const blok = appKaynak.slice(i, i + 200);
  return blok.includes("this.style.opacity") &&
         blok.includes("ondragend") && blok.includes("istekDropHedef=null; this.style.opacity=");
})());

/* ---- 2) Günlük tablo satır kimliği + boş hücre drop-zone markup'ı ---- */
console.log("2) Günlük tablo — satır kimliği ve boş hücre drop-zone markup'ı:");
t("slot 6 → " + KOD6 + " · slot 8 → " + KOD8 + " · slot 1 → " + KOD1, KOD6 === "13:50" && KOD8 === "15:30" && KOD1 === "08:50");
temizle();
const kKaynak = dersYap({ id: "kg-d-kaynak" });
DB.dersler.push(kKaynak);
let g = gunGorunum();
const beklenenZone = '<td class="dnd-bos px-1.5 py-2 border-r border-slate-200 transition-colors"' +
  ' data-drop-ogrt="' + T.id + '" data-drop-gun="' + dowIdx(gunKey) + '" data-drop-saat="' + KOD1 + '"' +
  ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)" ondrop="istekBurak(event, this, \'' + T.id + '\', \'' + gunKey + '\', \'' + KOD1 + '\')" title="Boş saat — ders kartını ya da havuz isteğini bırakın">' +
  '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
t("boş hücre drop-zone markup'ı birebir (dnd-bos + data-drop-ogrt/gun/saat + istekBurak)", g.includes(beklenenZone));
t("satır öğretmen kimliği ogretmenId ile (data-drop-ogrt = T.id)", g.includes('data-drop-ogrt="' + T.id + '"'));
t("hedef gün seçili güne sabit (data-drop-gun = " + dowIdx(gunKey) + ")", g.includes('data-drop-gun="' + dowIdx(gunKey) + '"'));
t("öğretmen satır adı hâlâ görünür (eski görünüm)", g.includes(T.ad));
t("günlük tablo hâlâ 12 slot başlıklı (11 ders + Mola)", g.includes(">Mola<") && (g.slice(0, g.indexOf("</thead>")).match(/<\/th>/g) || []).length === 13);
/* Mola hücresi: KESİNLİKLE drop-zone değil */
t("Mola hücresi drop-zone DEĞİL (data-drop-saat=\"12:00\" yok)", !g.includes('data-drop-saat="12:00"'));
t("Mola hücresi markup'ı birebir korundu (emerald)",
  g.includes('<td class="px-1.5 py-2 border-r border-slate-200 bg-emerald-50"><div class="text-[10px] font-bold text-emerald-600">Mola</div>'));
t("ksKodOf(\"12:00\") = '' (mola kısa kodda yok)", ksKodOf("12:00") === "");

/* ---- 3) Draggable kaynak kuralı ---- */
console.log("3) Draggable kaynak kuralı (günlük tablo):");
/* Aynı satırda: birebir (slot 6) + grup (slot 9) + Ek Ders amber (slot 10) */
temizle();
const kBir = dersYap({ id: "kg-d-bir" });
const kGrup = dersYap({ id: "kg-d-grup", ogrenciIds: [O2.id], saat: KISA_KOD[8].b, kod: ksKodOf(KISA_KOD[8].b) });
DB.dersler.push(kBir, kGrup);
DB.ekDersler.push({ id: "kg-ek1", sinif: "KG 12 SAY 1", dersId: dersKey, konu: "", ogretmenId: T.id, ogretmenAd: T.ad, tarih: gunKey, saat: KISA_KOD[9].b, kod: ksKodOf(KISA_KOD[9].b), durum: "planlandi", olusturma: "2026-09-01", donemId: aktifDonemId() });
g = gunGorunum();
const satirT = g.split("<tr").find(r => r.includes(T.ad)) || "";
const kBirebirBlok = tdBlok(satirT, 'title="Dolu');
t("birebir ders hücresi draggable + dersDrag taşıyor",
  kBirebirBlok.includes('<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors" draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \'' + kBir.id + '\'); this.style.opacity=\'0.45\'" ondragend="dersDropHedef=null; this.style.opacity=\'\'">'), kBirebirBlok.slice(0, 260));
t("birebir hücre içeriği değişmedi (tam ad)", satirT.includes('title="' + O1.ad + '"'));
const kGrupBlok = tdBlok(satirT, "text-[8.5px] text-slate-400 mt-0.5");
t("GRUP dersi hücresi draggable DEĞİL", kGrupBlok.length > 0 && !kGrupBlok.includes("draggable"));
t("grup dersinde ana öğrenci tam adı görünür", satirT.includes('title="' + O1.ad + '"'));
t("amber Ek Ders hücresi draggable DEĞİL", !tdBlok(satirT, "Ek Ders").includes("draggable"));
t("amber Ek Ders hücresi eski markup'ta (bg-amber-50 + 'Ek Ders')", satirT.includes("bg-amber-50") && satirT.includes("Ek Ders"));
t("T satırında draggable sayısı = birebir ders sayısı (1)", satirT.length > 0 && (satirT.match(/draggable="true"/g) || []).length === 1);
/* iptal ders → günlük tabloda YOK (kaynak olamaz) */
const kIptal = dersYap({ id: "kg-d-iptal", saat: KOD8, kod: ksKodOf(KOD8), durum: "iptal" });
DB.dersler.push(kIptal);
g = gunGorunum();
t("İPTAL ders günlük tabloda YOK (draggable kaynak olamaz)", !g.includes("kg-d-iptal") && !g.includes("dersDrag(event, '" + kIptal.id + "')"));
t("iptal guard'ı günlük kaynakta (ders.durum !== \"iptal\")", gunlukBolge.includes('ders.durum !== "iptal"'));
temizle();

/* ---- 4) Başarı: aynı satır 6→8 ---- */
console.log("4) Başarılı taşıma — aynı satır 6→8 (gerçek drop yolu):");
temizle();
const k68 = dersYap({ id: "kg-d-68" });
DB.dersler.push(k68);
basari("aynı satır 6→8", k68.id, KOD8);
t("taşıma sonrası günlük tabloda yeni slot (eski slot boş → zona döndü)", (() => {
  const hh = gunGorunum();
  return hh.includes('data-drop-saat="' + KOD6 + '"') && tdBlok(hh, 'title="Dolu').includes("dersDrag(event, '" + k68.id + "')");
})());

/* ---- 5) no-op (kaynak = hedef) ---- */
console.log("5) no-op (kaynak = hedef):");
temizle();
const kNoop = dersYap({ id: "kg-d-noop", saat: KOD8, kod: ksKodOf(KOD8) });
DB.dersler.push(kNoop);
{
  const ls0 = store[LS_KEY], db0 = JSON.stringify(DB), set0 = sayiSet, toast0 = toastSayisi();
  tasi(kNoop.id, T.id, gunKey, KOD8);
  t("no-op: localStorage değişmedi", store[LS_KEY] === ls0);
  t("no-op: DB değişmedi + saveDB çağrılmadı", JSON.stringify(DB) === db0 && sayiSet === set0);
  t("no-op: toast YOK (sessiz)", toastSayisi() === toast0);
  t("no-op: ders yerinde (8. slot)", dersBul(kNoop.id).saat === KOD8);
}

/* ---- 6) RED senaryoları (hepsinde localStorage byte-birebir) ---- */
console.log("6) RED senaryoları:");
/* cross-row: başka öğretmen satırına bırakma RED (öğretmen otomatik değişmez) */
temizle();
const kCross = dersYap({ id: "kg-d-cross" });
DB.dersler.push(kCross);
red("cross-row (başka öğretmen satırı)", kCross.id, T2.id, gunKey, KOD8);
t("cross-row sonrası dersin ogretmenId'si DEĞİŞMEDİ", dersBul(kCross.id).ogretmenId === T.id && dersBul(kCross.id).saat === KOD6);

/* mola (12:00) hedefi RED — ve günlük tabloda mola drop-zone değil */
red("mola (12:00) hedefi", kCross.id, T.id, gunKey, "12:00");
t("mola hedefi günlük tabloda drop-zone olarak da yok", !gunGorunum().includes('data-drop-saat="12:00"'));

/* dolu hedef: aynı öğretmenin başka dersi aynı slottadır */
temizle();
const kDolu = dersYap({ id: "kg-d-dolu" });
DB.dersler.push(kDolu, dersYap({ id: "kg-d-dolu2", ogrenciId: O2.id, ogrenciAd: O2.ad, saat: KOD8, kod: ksKodOf(KOD8) }));
red("dolu hedef", kDolu.id, T.id, gunKey, KOD8);
t("dolu senaryoda kaynak ders yerinde (6. slot)", dersBul(kDolu.id).saat === KOD6);

/* Kapalı (avail.musait) hedef RED */
temizle();
const kKapali = dersYap({ id: "kg-d-kapali" });
DB.dersler.push(kKapali);
T.avail.musait = [dowIdx(gunKey) + "-" + ksKodOf(KOD8)];
red("Kapalı hedef (avail.musait)", kKapali.id, T.id, gunKey, KOD8);
T.avail.musait = [];

/* Sınıf Dersi (avail.sinif) hedefi RED */
temizle();
const kSinif = dersYap({ id: "kg-d-sinif" });
DB.dersler.push(kSinif);
T.avail.sinif = { [dowIdx(gunKey) + "-" + ksKodOf(KOD8)]: "KG MEZUN EA 1" };
red("Sınıf Dersi hedefi (avail.sinif)", kSinif.id, T.id, gunKey, KOD8);
T.avail.sinif = {};

/* Ek Ders (amber) hedefi RED */
temizle();
const kEk = dersYap({ id: "kg-d-ek" });
DB.dersler.push(kEk);
DB.ekDersler.push({ id: "kg-ek-hedef", sinif: "KG 12 SAY 2", dersId: dersKey, konu: "", ogretmenId: T.id, ogretmenAd: T.ad, tarih: gunKey, saat: KOD8, kod: ksKodOf(KOD8), durum: "planlandi", olusturma: "2026-09-01", donemId: aktifDonemId() });
red("Ek Ders (amber) hedefi", kEk.id, T.id, gunKey, KOD8);
DB.ekDersler = DB.ekDersler.filter(l => l.id !== "kg-ek-hedef");

/* öğretmen çakışması: aynı gün+kod+açık öğretmen (dolu guard'ı) — duzeltmeBul da bildirir */
temizle();
const kOgc = dersYap({ id: "kg-d-ogc" });
DB.dersler.push(kOgc, dersYap({ id: "kg-d-ogc2", ogrenciId: O2.id, ogrenciAd: O2.ad, saat: KOD8, kod: ksKodOf(KOD8) }));
red("öğretmen çakışması", kOgc.id, T.id, gunKey, KOD8);
t("duzeltmeBul öğretmen çakışmasını bildiriyor (mevcut kontrol yeniden kullanıldı)",
  duzeltmeBul({ id: "kg-x", ogrenciId: O1.id, ogretmenId: T.id, tarih: gunKey, saat: KOD8 }, false, null).length > 0);

/* öğrenci çakışması: aynı öğrencinin BAŞKA öğretmenle aynı slotta dersi var */
temizle();
const kOgr = dersYap({ id: "kg-d-ogr" });
DB.dersler.push(kOgr, dersYap({ id: "kg-d-ogr2", ogretmenId: T2.id, ogretmenAd: T2.ad, saat: KOD8, kod: ksKodOf(KOD8) }));
red("öğrenci çakışması (başka öğretmenle aynı slot)", kOgr.id, T.id, gunKey, KOD8);

/* toplu ders (sınıf programı) engeli */
temizle();
const kToplu = dersYap({ id: "kg-d-toplu" });
DB.dersler.push(kToplu);
const oncekiSinifProg = DB.sinifProg["KG SINIF"];
DB.sinifProg["KG SINIF"] = [dowIdx(gunKey) + "-" + ksKodOf(KOD8)];
DB.ogrenciler.find(x => x.id === O1.id).sinif = "KG SINIF";
red("toplu ders (sınıf programı) engeli", kToplu.id, T.id, gunKey, KOD8);
if (oncekiSinifProg === undefined) delete DB.sinifProg["KG SINIF"]; else DB.sinifProg["KG SINIF"] = oncekiSinifProg;

/* grup dersi taşınamaz (tek öğrencili değil) */
temizle();
const kGrup2 = dersYap({ id: "kg-d-grup2", ogrenciIds: [O2.id] });
DB.dersler.push(kGrup2);
red("grup ders kaynağı", kGrup2.id, T.id, gunKey, KOD8);
temizle();

/* ---- 7) Görünüm tutarlılığı: günlük + gün sekmesi + haftalık AYNI DB kaydı ---- */
console.log("7) Görünüm tutarlılığı (günlük ↔ gün sekmesi ↔ haftalık):");
temizle();
const kUyum = dersYap({ id: "kg-d-uyum" });
DB.dersler.push(kUyum);
basari("tutarlılık senaryosu 6→8", kUyum.id, KOD8);
ui.filtre = "gun"; ui.anchor = gunKey; ui.gunSecim = gunKey;   /* gün sekmesi */
t("gün sekmesi taşınan dersi yeni slotta gösteriyor", tdBlok(gunlukTablo(), 'title="Dolu').includes("dersDrag(event, '" + kUyum.id + "')"));
t("gün sekmesi eski slotta boş drop-zone gösteriyor", gunlukTablo().includes('data-drop-saat="' + KOD6 + '"'));
t("günlük tablo ilk slotta (08:50) drop-zone gösteriyor", gunlukTablo().includes('data-drop-saat="' + KOD1 + '"'));
t("haftalık tablo taşınan dersi yeni slotta gösteriyor", haftaGorunum().includes("dersDrag(event, '" + kUyum.id + "')"));
t("haftalık tabloda eski slot artık boş \"+\" drop-zone", haftaGorunum().includes('data-drop-saat="' + KOD6 + '"'));
t("haftalık tablo hâlâ birebir hücreyi aynı çiziyor (tam ad)", haftaGorunum().includes('title="' + O1.ad + '"'));
t("DB'de TEK kayıt, tarih sabit", DB.dersler.filter(l => l.id === kUyum.id).length === 1 && dersBul(kUyum.id).tarih === gunKey);

/* ---- 8) Mevcut istek kartı akışı (runtime) korundu ---- */
console.log("8) Mevcut istek kartı akışı (runtime):");
temizle();
DB.istekler = DB.istekler.filter(r => !String(r.id).startsWith("kg-i"));
const istek = { id: "kg-i1", ogrenciId: O1.id, ogrenciAd: O1.ad, dersId: dersKey, konu: "Havuz", durum: "bekliyor", olusturma: "2026-09-01", donemId: aktifDonemId() };
DB.istekler.push(istek);
{
  const set0 = sayiSet, ders0 = DB.dersler.length;
  istekDrag(evt(), istek.id);                        /* havuz kartı dragstart */
  istekBurak(evt(), elStub(), T.id, gunKey, KOD8);    /* günlük boş hücreye bırakma */
  const yeni = DB.dersler.find(l => l.tarih === gunKey && ksKodOf(l.saat) === ksKodOf(KOD8) && l.ogrenciId === O1.id);
  t("havuz isteği günlük boş hücreye bırakılınca ders oluştu", !!yeni && DB.dersler.length === ders0 + 1);
  t("istek havuzdan düştü", !DB.istekler.some(r => r.id === istek.id));
  t("istek akışı TEK saveDB", sayiSet - set0 === 1, String(sayiSet - set0));
  /* dersDropHedef set edilmeden istek akışı bozulmaz: ders taşıma dalı çalışmaz */
  const istekB = { id: "kg-i2", ogrenciId: O2.id, ogrenciAd: O2.ad, dersId: dersKey, konu: "Havuz B", durum: "bekliyor", olusturma: "2026-09-01", donemId: aktifDonemId() };
  DB.istekler.push(istekB);
  const set1 = sayiSet;
  istekDrag(evt(), istekB.id);
  istekBurak(evt(), elStub(), T.id, gunKey, KISA_KOD[9].b);
  t("istek akışı ders dalına kaymıyor (istekDropHedef ile çalışır)", sayiSet - set1 === 1, String(sayiSet - set1));
}
/* ders taşıma, havuzdaki istekleri tüketmez */
temizle();
const istek2 = { id: "kg-i3", ogrenciId: O1.id, ogrenciAd: O1.ad, dersId: dersKey, konu: "Dokunulmamalı", durum: "bekliyor", olusturma: "2026-09-01", donemId: aktifDonemId() };
DB.istekler.push(istek2);
const kIstekKoruma = dersYap({ id: "kg-d-istek-koruma" });
DB.dersler.push(kIstekKoruma);
tasi(kIstekKoruma.id, T.id, gunKey, KOD8);
t("ders taşıma havuz isteklerine dokunmadı", DB.istekler.some(r => r.id === istek2.id));
t("istekDragOver boşta tepki vermez (dersDropHedef de yoksa) hata atmaz", (() => { istekDragOver(evt(), elStub()); return true; })());
temizle();
DB.istekler = DB.istekler.filter(r => !String(r.id).startsWith("kg-i"));

/* ---- 9) Süit kaydı + dosya bütünlüğü ---- */
console.log("9) Süit kaydı ve dosya bütünlüğü:");
const sha = (s) => createHash("sha256").update(s).digest("hex");
t("bu süit test.mjs'te tam 1 kez", (readFileSync("test.mjs", "utf8").match(/ks-gunluk-ders-tasi\.mjs/g) || []).length === 1);
t("haftalık süit hâlâ test.mjs'te tam 1 kez", (readFileSync("test.mjs", "utf8").match(/ks-ders-tasi\.mjs/g) || []).length === 1);
t("index.html değişmedi (bilinen hash)", sha(readFileSync("index.html", "utf8")) === "7ee493bae3d1396cafd2e102dce2a10c6f70b6170a17ab35d699d3870e04c2d5");
t("ek-ders.js değişmedi (bilinen hash)", sha(readFileSync("ek-ders.js", "utf8")) === "3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f");
t("EK-DERS-GORUNUM mark sayısı 5 (değişmedi)", kez("EK-DERS-GORUNUM") === 5);
t("haftalık süitteki stale günlük assert güncellendi (draggable DEĞİL → birebir draggable)",
  readFileSync("ks-ders-tasi.mjs", "utf8").includes("günlük tablo birebir hücresi draggable"));
t("haftalık süitteki draggable kaynak sayısı 2'ye güncellendi",
  readFileSync("ks-ders-tasi.mjs", "utf8").includes("'draggable=\"true\" style=\"cursor:grab\"') === 2"));
t("yama script'i mevcut (assert'li, idempotent)", readFileSync("ks-yama-gunluk-ders-tasi.mjs", "utf8").includes("GUNLUK-DERS-TASI-YAMASI"));

console.log("");
console.log(fail ? "BAZI TESTLER BAŞARISIZ" : "HEPSİ GEÇTİ");
console.log("→ ks-gunluk-ders-tasi.mjs: " + (n - fail) + "/" + n + (fail ? " ✗ BAŞARISIZ" : " test ✓ GEÇTİ"));
process.exit(fail ? 1 : 0);
