let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 91) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ders-tasi.mjs kosan=" + __kosan + " beklenen=91"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ders-tasi.mjs:" + __kosan + ":91"); } });
/* ks-ders-tasi.mjs — DERS-TASI-YAMASI regresyon süiti.
   TEK İŞ: öğretmen haftalık tablosunda MEVCUT birebir ders kartını, MEVCUT istek-kartı
   sürükle-bırak altyapısıyla (aynı dnd-bos "+" drop-zone + aynı dragover/leave/drop yolu)
   aynı gösterilen hafta içindeki başka gün/saat boş slotuna taşımak.

   Kapsam:
     1) Kaynak sözleşmesi (dersDropHedef/dersDrag/dersBurak, paralel sistem yok)
     2) Haftalık hücre: yalnız AKTİF TEK ÖĞRENCİLİ birebir draggable; grup/iptal/Sınıf Dersi/
        Ek Ders/Kapalı draggable DEĞİL; günlük tablo draggable DEĞİL
     3) Drop-zone ve mevcut istek kartı akışı korundu (markup + runtime)
     4) Başarı: aynı gün 6→8, gün değişimi (Pzt→Çar), TEK saveDB
     5) no-op (kaynak = hedef)
     6) RED: dolu, Kapalı, mola (12:00), öğretmen çakışması, öğrenci çakışması, toplu ders,
        grup dersi, hafta dışı → hepsinde localStorage byte-birebir korunumu
     7) Gün sekmesi ↔ Hafta görünümü uyumu (aynı DB kaydı)
     8) Süit kaydı + dokunulmayan dosyaların SHA-256'sı */
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
             aktifDonemId, aktifDonemKayitlari, DERS, esc };
  `)();
  t("boot hatasız", true);
} catch (e) {
  /* beklenmeyen catch: THROW (catch-only sayım kaldırıldı — SAYAÇ KAPISI kuralları) */
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  throw e;
  process.exit(1);
}
const { DB, ui, gunlukTablo, haftalikOgrtTablo, dersDrag, dersBurak, istekDrag, istekBurak,
        istekDragOver, istekDragLeave, dersOgrenciIds, duzeltmeBul, KISA_KOD, ksKodOf,
        addDaysKey, dowIdx, aktifDonemId, DERS } = P;

/* ---------- Test ortamı: izole öğretmen + izole öğrenciler ---------- */
const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const cars = addDaysKey(gelecekPzt, 2);              /* Çarşamba */
const ertesiHaftaPzt = addDaysKey(gelecekPzt, 7);    /* hafta dışı hedef */

const dersKey = Object.keys(DERS)[0];
const T = { id: "kd-t1", ad: "KD TEST ÖĞRETMEN", brans: dersKey, avail: { sinif: {}, musait: [] } };
const O1 = { id: "kd-o1", ad: "KD Test Öğrenci", sinif: "", tel: "" };
const O2 = { id: "kd-o2", ad: "KD İkinci Öğrenci", sinif: "", tel: "" };
DB.ogretmenler.push(T); DB.ogrenciler.push(O1, O2);
if (!Array.isArray(DB.ekDersler)) DB.ekDersler = [];

const KOD6 = KISA_KOD[5].b;   /* 13:50 → 6. ders */
const KOD8 = KISA_KOD[7].b;   /* 15:30 → 8. ders */

const evt = () => ({ preventDefault() {}, dataTransfer: null });
const elStub = () => ({ classList: { add() {}, remove() {} } });
const toastSayisi = () => reg["toastAlan"] ? reg["toastAlan"]._eklenen : 0;

let sayac = 0;
const dersYap = (over) => Object.assign({
  id: "kd-d" + (++sayac), donemId: aktifDonemId(), ogrenciId: O1.id, ogrenciAd: O1.ad,
  dersId: dersKey, konu: "Limit", ogretmenId: T.id, ogretmenAd: T.ad,
  tarih: gelecekPzt, saat: KOD6, kod: ksKodOf(KOD6), durum: "planlandi", olusturma: "2026-09-01"
}, over || {});
const dersBul = (id) => DB.dersler.find(x => x.id === id);
const temizle = () => {
  DB.dersler = DB.dersler.filter(l => !String(l.id).startsWith("kd-d"));
  DB.ekDersler = DB.ekDersler.filter(l => !String(l.id).startsWith("kd-ek"));
  T.avail = { sinif: {}, musait: [] };
};
const haftaGorunum = (hafta) => { ui.filtre = "hafta"; ui.anchor = hafta || gelecekPzt; ui.gunSecim = ""; ui.haftalikOgrtId = T.id; return haftalikOgrtTablo(); };
/* verilen işaretten önceki son <td ...> açılışını döndürür */
const tdBlok = (h, isaret) => { const i = h.indexOf(isaret); if (i < 0) return ""; return h.slice(h.lastIndexOf("<td", i), i); };

const tasi = (id, tarih, saat) => { dersDrag(evt(), id); dersBurak(T.id, tarih, saat); };

function basari(ad, id, hedefTarih, hedefSaat) {
  const ls0 = store[LS_KEY], set0 = sayiSet, oncesi = JSON.stringify(dersBul(id));
  const o0 = oncesi ? JSON.parse(oncesi) : null;
  tasi(id, hedefTarih, hedefSaat);
  const l = dersBul(id);
  t(ad + " → ders hedef gün/saate taşındı", !!l && l.tarih === hedefTarih && l.saat === hedefSaat && l.kod === ksKodOf(hedefSaat), l ? l.tarih + " " + l.saat : "ders yok");
  t(ad + " → TEK saveDB (setItem tam +1)", sayiSet - set0 === 1, String(sayiSet - set0));
  t(ad + " → localStorage yazıldı", store[LS_KEY] !== ls0);
  t(ad + " → yalnız tarih/saat/kod değişti (id/öğrenci/öğretmen/ders/konu aynı)",
    l && o0 && l.id === o0.id && l.ogrenciId === o0.ogrenciId && l.ogrenciAd === o0.ogrenciAd &&
    l.ogretmenId === o0.ogretmenId && l.ogretmenAd === o0.ogretmenAd && l.dersId === o0.dersId &&
    l.konu === o0.konu && l.durum === o0.durum && l.donemId === o0.donemId);
  return l;
}

function red(ad, id, hedefTarih, hedefSaat) {
  const ls0 = store[LS_KEY], db0 = JSON.stringify(DB), set0 = sayiSet, toast0 = toastSayisi();
  tasi(id, hedefTarih, hedefSaat);
  t(ad + " → RED: localStorage byte-birebir aynı", store[LS_KEY] === ls0);
  t(ad + " → RED: DB birebir aynı + saveDB çağrılmadı (" + (sayiSet - set0) + ")", JSON.stringify(DB) === db0 && sayiSet === set0);
  t(ad + " → RED: toast gösterildi", toastSayisi() > toast0);
}

/* ---- 1) Kaynak sözleşmesi ---- */
console.log("1) Kaynak sözleşmesi (mevcut altyapı yeniden kullanımı):");
const bolge = (fn) => { const i = appKaynak.indexOf(fn); const j = appKaynak.indexOf("\nfunction ", i + 10); return appKaynak.slice(i, j); };
const kez = (s) => appKaynak.split(s).length - 1;
t("dersDropHedef globali tam 1 kez", kez("var dersDropHedef = null;") === 1);
t("dersDrag tanımı tam 1", kez("function dersDrag(ev, id) {") === 1);
t("dersBurak tanımı tam 1", kez("function dersBurak(ogrtId, tarih, saat) {") === 1);
t("paralel istekDropHedef globali korundu", kez("var ev_dnd = null, istekDropHedef = null;") === 1);
t("AYNI drop-zone yolu kullanılıyor (istekBurak → dersBurak devri)",
  kez("if (dersDropHedef) { dersBurak(ogrtId, tarih, saat); return; }") === 1);
t("istekDragOver tek fonksiyon (paralel dragover yok)", kez("function istekDragOver(") === 1 && !appKaynak.includes("function dersDragOver("));
t("istekBurak kilit kontrolü korundu", kez("Bu saat kilitli ya da dolu — istek bırakılamadı.") === 1);
t("Mevcut istek kartı akışı korundu (formaAktar drop yolu)",
  kez("formaAktar(istekDropHedef);") === 1 &&
  kez("İstek planlama formuna aktarıldı. Tarih ve saati seçip kaydedin.") === 1);
t("dersBurak yalnız tek öğrencili birebir (grup dersi guard'ı)",
  bolge("function dersBurak(ogrtId, tarih, saat) {").includes('if (dersOgrenciIds(l).length !== 1)'));
t("dersBurak iptal guard'ı", bolge("function dersBurak(ogrtId, tarih, saat) {").includes('if (l.durum === "iptal")'));
t("dersBurak mevcut duzeltmeBul kontrolünü kullanıyor (kaynak hariç: staged.id)",
  bolge("function dersBurak(ogrtId, tarih, saat) {").includes("duzeltmeBul({ id: staged.id,"));
t("dersBurak tarih yardımcılarını kullanıyor (manuel index yok)",
  bolge("function dersBurak(ogrtId, tarih, saat) {").includes("addDaysKey(tarih, -dowIdx(tarih))"));

/* ---- 2) Haftalık hücre: draggable olan/olmayan ---- */
console.log("2) Haftalık tablo — draggable kaynak kuralı:");
t("slot 6 → " + KOD6 + " · slot 8 → " + KOD8, KOD6 === "13:50" && KOD8 === "15:30");
temizle();
const dBirebir = dersYap({});
DB.dersler.push(dBirebir);
let h = haftaGorunum();
t("birebir ders hücresi draggable + dersDrag(event, ...) taşıyor",
  h.includes('<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100" draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \'' + dBirebir.id + '\'); this.style.opacity=\'0.45\'" ondragend="dersDropHedef=null; this.style.opacity=\'\'">'));
t("birebir hücre içeriği değişmedi (tam ad)", h.includes('title="' + O1.ad + '"'));

/* grup dersi (ana öğrenci + 1 ek üye) → draggable DEĞİL */
temizle();
const dGrup = dersYap({ id: "kd-d-grup", ogrenciIds: [O2.id], tarih: gelecekPzt, saat: KISA_KOD[8].b, kod: ksKodOf(KISA_KOD[8].b) });
DB.dersler.push(dGrup);
h = haftaGorunum();
t("GRUP dersi hücresi draggable DEĞİL",
  h.includes('<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border bg-blue-50') &&
  !tdBlok(h, 'title="' + O1.ad + '"').includes("draggable"));
t("grup dersinde ana öğrenci adı hâlâ görünür", h.includes('title="' + O1.ad + '"'));

/* iptal ders → haftalık tabloda hiç görünmez (bu yüzden kaynak olamaz) */
const dIptal = dersYap({ id: "kd-d-iptal", tarih: gelecekPzt, saat: KISA_KOD[9].b, kod: ksKodOf(KISA_KOD[9].b), durum: "iptal" });
DB.dersler.push(dIptal);
h = haftaGorunum();
t("İPTAL ders haftalık tabloda YOK (draggable kaynak olamaz)",
  !h.includes('<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100" draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \'' + dIptal.id + '\'') &&
  h.includes('data-drop-saat="' + KISA_KOD[9].b + '"'));
t("iptal guard'ı kaynakta (ders.durum !== \"iptal\")", appKaynak.includes('(ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ?'));

/* Sınıf Dersi (rose) → draggable DEĞİL */
temizle(); DB.dersler.push(dersYap({ id: "kd-d-rose" }));
T.avail.sinif = { [dowIdx(gelecekPzt) + "-2"]: "MEZUN SAY 1" };
h = haftaGorunum();
t("rose Sınıf Dersi hücresi draggable DEĞİL",
  h.includes('<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg bg-rose-100 border border-rose-200') &&
  !tdBlok(h, "MEZUN SAY 1").includes("draggable"));
t("rose hücrede sınıf adı görünür, hiç draggable yok (o hücrede)", h.includes(">MEZUN SAY 1<") && !tdBlok(h, "MEZUN SAY 1").includes("draggable"));
T.avail.sinif = {};

/* Ek Ders (amber) → draggable DEĞİL */
DB.ekDersler.push({ id: "kd-ek1", sinif: "KD 12 SAY 1", dersId: dersKey, konu: "", ogretmenId: T.id, ogretmenAd: T.ad, tarih: gelecekPzt, saat: KISA_KOD[10].b, kod: ksKodOf(KISA_KOD[10].b), durum: "planlandi", olusturma: "2026-09-01", donemId: aktifDonemId() });
h = haftaGorunum();
t("amber Ek Ders hücresi draggable DEĞİL",
  h.includes('<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg bg-amber-100 border border-amber-300') &&
  !tdBlok(h, "Ek Ders").includes("draggable"));

/* Kapalı (slate) → draggable DEĞİL ve drop-zone da değil */
T.avail.musait = [dowIdx(gelecekPzt) + "-5"];
h = haftaGorunum();
t("gri Kapalı hücresi draggable DEĞİL, o slotta drop-zone da DEĞİL",
  h.includes('<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100"><span class="text-[9px] text-slate-400">—</span></td>') &&
  !h.includes('data-drop-gun="0" data-drop-saat="' + KISA_KOD[4].b + '"'));
T.avail.musait = [];

/* günlük tablo artık YALNIZ aynı-satır birebir hücresinde draggable (GUNLUK-DERS-TASI-YAMASI) */
ui.filtre = "gun"; ui.anchor = gelecekPzt; ui.gunSecim = gelecekPzt;
t("günlük tablo birebir hücresi draggable (GUNLUK-DERS-TASI-YAMASI)", tdBlok(gunlukTablo(), 'title="Dolu').includes('draggable="true" style="cursor:grab" ondragstart="dersDrag(event,'));
t("draggable kaynak: 2 birebir hücre (haftalık + günlük) (" + kez("draggable=\"true\"") + " kaynak satırı)",
  kez('draggable="true" style="cursor:grab"') === 2);
temizle();

/* ---- 3) Drop-zone + mevcut istek kartı akışı korundu ---- */
console.log("3) Drop-zone ve istek kartı akışı korundu:");
h = haftaGorunum();
const beklenenZone = '<td class="dnd-bos px-1.5 py-1.5 text-center border-l border-slate-100 transition-colors"' +
  ' data-drop-ogrt="' + T.id + '" data-drop-gun="0" data-drop-saat="' + KOD6 + '"' +
  ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)" ondrop="istekBurak(event, this, \'' + T.id + '\', \'' + gelecekPzt + '\', \'' + KOD6 + '\')" title="Boş saat — havuzdan istek kartı sürükleyip bırakın">' +
  '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
t("boş \"+\" drop-zone markup'ı birebir korundu (dnd-bos + data-* + istekBurak)", h.includes(beklenenZone));
t("mola (12:00) için drop-zone YOK — KISA_KOD'da mola yok", !KISA_KOD.some(k => k.b === "12:00" || k.mola) && !h.includes('data-drop-saat="12:00"'));
t("ksKodOf(\"12:00\") = '' (mola kısa kodda yok)", ksKodOf("12:00") === "");
t("istekDragOver boşta tepki vermez (dersDropHedef de yoksa)", (() => {
  const elc = elStub(); istekDragOver(evt(), elc); return true; /* hata atmaz */
})());
/* kaynakta görünen kaçışlı tırnak: \' */
const BS = "\\'";
t("mevcut istek kartı inline handler'ı birebir korundu (istekDrag + opaklık)", (() => {
  const i = appKaynak.indexOf('ondragstart="istekDrag(event,');
  if (i < 0) return false;
  const blok = appKaynak.slice(i, i + 170);
  return blok.includes("this.style.opacity=" + BS + "0.45" + BS) &&
         blok.includes("ondragend=\"istekDropHedef=null; this.style.opacity=" + BS + BS + "\"");
})());
t("istek kartı dragstart'ı tam 1 kez (paralel kaynak eklenmedi)", kez('ondragstart="istekDrag(event,') === 1);

/* ---- 4) Başarı: aynı gün 6→8 ---- */
console.log("4) Başarılı taşıma — aynı gün 6→8:");
temizle();
const kBir = dersYap({ id: "kd-d-68" });
DB.dersler.push(kBir);
basari("aynı gün 6→8", kBir.id, gelecekPzt, KOD8);
t("taşıma sonrası haftalık tabloda yeni slotta (eski slot boş + zona döndü)", (() => {
  const hh = haftaGorunum();
  return hh.includes('data-drop-saat="' + KOD6 + '"') && hh.includes("dersDrag(event, '" + kBir.id + "')");
})());

/* ---- 5) Başarı: gün değişimi (Pzt → Çar) ---- */
console.log("5) Başarılı taşıma — gün değişimi (Pzt → Çar):");
temizle();
const kGun = dersYap({ id: "kd-d-gun" });
DB.dersler.push(kGun);
basari("gün değişimi Pzt→Çar", kGun.id, cars, KOD6);
t("ders artık Çarşamba'da (dowIdx=2)", dowIdx(dersBul(kGun.id).tarih) === 2);

/* ---- 6) no-op: kaynak = hedef ---- */
console.log("6) no-op (kaynak = hedef):");
temizle();
const kNoop = dersYap({ id: "kd-d-noop" });
DB.dersler.push(kNoop);
{
  const ls0 = store[LS_KEY], db0 = JSON.stringify(DB), set0 = sayiSet, toast0 = toastSayisi();
  tasi(kNoop.id, gelecekPzt, KOD6);
  t("no-op: localStorage değişmedi", store[LS_KEY] === ls0);
  t("no-op: DB değişmedi + saveDB çağrılmadı", JSON.stringify(DB) === db0 && sayiSet === set0);
  t("no-op: toast YOK (sessiz)", toastSayisi() === toast0);
}

/* ---- 7) RED senaryoları (hepsinde localStorage byte-birebir) ---- */
console.log("7) RED senaryoları:");
/* dolu hedef: aynı öğretmenin başka dersi aynı slottadır */
temizle();
const kRed1 = dersYap({ id: "kd-d-r1" });
const kDolu = dersYap({ id: "kd-d-dolu", ogrenciId: O2.id, ogrenciAd: O2.ad, tarih: gelecekPzt, saat: KOD8, kod: ksKodOf(KOD8) });
DB.dersler.push(kRed1, kDolu);
red("dolu hedef", kRed1.id, gelecekPzt, KOD8);
t("dolu senaryoda kaynak ders yerinde kaldı", dersBul(kRed1.id).tarih === gelecekPzt && dersBul(kRed1.id).saat === KOD6);

/* Kapalı (musait) hedef */
temizle();
const kRed2 = dersYap({ id: "kd-d-r2" });
DB.dersler.push(kRed2);
T.avail.musait = [dowIdx(gelecekPzt) + "-8"];
red("Kapalı hedef (avail.musait)", kRed2.id, gelecekPzt, KOD8);
T.avail.musait = [];

/* Sınıf Dersi (avail.sinif) hedefi */
temizle();
const kRed3 = dersYap({ id: "kd-d-r3" });
DB.dersler.push(kRed3);
T.avail.sinif = { [dowIdx(gelecekPzt) + "-8"]: "MEZUN EA 1" };
red("Sınıf Dersi hedefi (avail.sinif)", kRed3.id, gelecekPzt, KOD8);
T.avail.sinif = [];

/* mola (12:00) hedefi */
temizle();
const kRed4 = dersYap({ id: "kd-d-r4" });
DB.dersler.push(kRed4);
red("mola (12:00) hedefi", kRed4.id, gelecekPzt, "12:00");

/* öğretmen çakışması (aynı gün+kod, aynı öğretmen, başka öğrenci) — dolu guard'ı ile RED */
temizle();
const kRed5 = dersYap({ id: "kd-d-r5" });
DB.dersler.push(kRed5, dersYap({ id: "kd-d-r5b", ogrenciId: O2.id, ogrenciAd: O2.ad, tarih: cars, saat: KOD6, kod: ksKodOf(KOD6) }));
red("öğretmen çakışması", kRed5.id, cars, KOD6);
t("duzeltmeBul öğretmen çakışmasını bildiriyor (mevcut kontrol yeniden kullanıldı)",
  duzeltmeBul({ id: "kd-x", ogrenciId: O1.id, ogretmenId: T.id, tarih: cars, saat: KOD6 }, false, null).length > 0);

/* öğrenci çakışması: aynı öğrencinin BAŞKA öğretmenle aynı slotta dersi var */
temizle();
const kBaskaOgrt = { id: "kd-t2", ad: "KD DİĞER ÖĞRETMEN", brans: dersKey, avail: { sinif: {}, musait: [] } };
DB.ogretmenler.push(kBaskaOgrt);
const kRed6 = dersYap({ id: "kd-d-r6" });
DB.dersler.push(kRed6, dersYap({ id: "kd-d-r6b", ogretmenId: kBaskaOgrt.id, ogretmenAd: kBaskaOgrt.ad, tarih: gelecekPzt, saat: KOD8, kod: ksKodOf(KOD8) }));
red("öğrenci çakışması (başka öğretmenle aynı slot)", kRed6.id, gelecekPzt, KOD8);

/* toplu ders (sınıf programı) engeli */
temizle();
const kRed7 = dersYap({ id: "kd-d-r7" });
DB.dersler.push(kRed7);
const oncekiSinifProg = DB.sinifProg["KD SINIF"];
DB.sinifProg["KD SINIF"] = [dowIdx(gelecekPzt) + "-8"];
DB.ogrenciler.find(x => x.id === O1.id).sinif = "KD SINIF";
red("toplu ders (sınıf programı) engeli", kRed7.id, gelecekPzt, KOD8);
DB.ogrenciler.find(x => x.id === O1.id).sinif = "";
if (oncekiSinifProg === undefined) delete DB.sinifProg["KD SINIF"]; else DB.sinifProg["KD SINIF"] = oncekiSinifProg;

/* grup dersi taşınamaz (tek öğrencili değil) */
temizle();
const kGrup2 = dersYap({ id: "kd-d-grup2", ogrenciIds: [O2.id] });
DB.dersler.push(kGrup2);
red("grup dersi", kGrup2.id, gelecekPzt, KOD8);

/* aynı gösterilen hafta dışı hedef */
temizle();
const kHafta = dersYap({ id: "kd-d-hafta" });
DB.dersler.push(kHafta);
red("hafta dışı hedef", kHafta.id, ertesiHaftaPzt, KOD6);

/* ---- 8) Gün sekmesi ↔ Hafta görünümü uyumu ---- */
console.log("8) Gün sekmesi ↔ Hafta uyumu:");
temizle();
const kUyum = dersYap({ id: "kd-d-uyum" });
DB.dersler.push(kUyum);
basari("uyum senaryosu Pzt/Cuma-8", kUyum.id, addDaysKey(gelecekPzt, 4), KOD8);
const cuma = addDaysKey(gelecekPzt, 4);
ui.filtre = "gun"; ui.anchor = cuma; ui.gunSecim = cuma;
t("gün sekmesi (Cuma) taşınan dersi gösteriyor", gunlukTablo().includes('title="' + O1.ad + '"'));
ui.gunSecim = gelecekPzt;
t("gün sekmesi (eski gün Pzt) dersi göstermiyor", !gunlukTablo().includes('title="' + O1.ad + '"'));
t("haftalık görünüm taşınan dersi yeni slotta gösteriyor", haftaGorunum().includes("dersDrag(event, '" + kUyum.id + "')"));
t("ders DB'de TEK kayıt (kopya üretilmedi)", DB.dersler.filter(l => l.id === kUyum.id).length === 1);

/* ---- 9) Mevcut istek kartı akışı (runtime) korundu ---- */
console.log("9) Mevcut istek kartı akışı (runtime):");
temizle();
DB.istekler = DB.istekler.filter(r => !String(r.id).startsWith("kd-i"));
const istek = { id: "kd-i1", ogrenciId: O1.id, ogrenciAd: O1.ad, dersId: dersKey, konu: "Havuz", durum: "bekliyor", olusturma: "2026-09-01", donemId: aktifDonemId() };
DB.istekler.push(istek);
{
  const set0 = sayiSet, ders0 = DB.dersler.length;
  istekDrag(evt(), istek.id);                                  /* havuz kartı dragstart */
  istekBurak(evt(), elStub(), T.id, gelecekPzt, KOD8);          /* boş "+" hücresine bırakma */
  const yeni = DB.dersler.find(l => l.tarih === gelecekPzt && ksKodOf(l.saat) === ksKodOf(KOD8) && l.ogrenciId === O1.id);
  t("havuz isteği boş slota bırakılınca ders oluştu", !!yeni && DB.dersler.length === ders0 + 1);
  t("istek havuzdan düştü", !DB.istekler.some(r => r.id === istek.id));
  t("istek akışı TEK saveDB", sayiSet - set0 === 1, String(sayiSet - set0));
  /* dersDropHedef set edilmeden istek akışı bozulmaz: ders taşıma dalı çalışmaz */
  const istekB = { id: "kd-i1b", ogrenciId: O2.id, ogrenciAd: O2.ad, dersId: dersKey, konu: "Havuz B", durum: "bekliyor", olusturma: "2026-09-01", donemId: aktifDonemId() };
  DB.istekler.push(istekB);
  const set1 = sayiSet;
  istekDrag(evt(), istekB.id);
  istekBurak(evt(), elStub(), T.id, gelecekPzt, KISA_KOD[9].b);
  t("istek akışı ders dalına kaymıyor (istekDropHedef ile çalışır)", sayiSet - set1 === 1, String(sayiSet - set1));
}
/* ders taşıma, havuzdaki istekleri tüketmez */
temizle();
const istek2 = { id: "kd-i2", ogrenciId: O1.id, ogrenciAd: O1.ad, dersId: dersKey, konu: "Dokunulmamalı", durum: "bekliyor", olusturma: "2026-09-01", donemId: aktifDonemId() };
DB.istekler.push(istek2);
const kIstekKoruma = dersYap({ id: "kd-d-istek-koruma" });
DB.dersler.push(kIstekKoruma);
tasi(kIstekKoruma.id, gelecekPzt, KOD8);
t("ders taşıma havuz isteklerine dokunmadı", DB.istekler.some(r => r.id === istek2.id));
temizle();
DB.istekler = DB.istekler.filter(r => !String(r.id).startsWith("kd-i"));

/* ---- 10) Süit kaydı + dokunulmayan dosyalar ---- */
console.log("10) Süit kaydı ve dosya bütünlüğü:");
const sha = (s) => createHash("sha256").update(s).digest("hex");
t("bu süit test.mjs'te tam 1 kez", (readFileSync("test.mjs", "utf8").match(/ks-ders-tasi\.mjs/g) || []).length === 1);
t("index.html değişmedi (bilinen hash)", sha(readFileSync("index.html", "utf8")) === "7ee493bae3d1396cafd2e102dce2a10c6f70b6170a17ab35d699d3870e04c2d5");
t("ek-ders.js değişmedi (bilinen hash)", sha(readFileSync("ek-ders.js", "utf8")) === "3d2dd38ff517c64fb488714edac932381daa79bd1e87a3831941b9d04a37233f");
t("EK-DERS-GORUNUM mark sayısı 5 (değişmedi)", kez("EK-DERS-GORUNUM") === 5);

console.log("");
console.log(fail ? "BAZI TESTLER BAŞARISIZ" : "HEPSİ GEÇTİ");
console.log("→ ks-ders-tasi.mjs: " + (n - fail) + "/" + n + (fail ? " ✗ BAŞARISIZ" : " test ✓ GEÇTİ"));
process.exit(fail ? 1 : 0);
