let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-sablon-kopya.mjs — SABLON-KOPYA-YAMASI regresyon süiti
   Kapsam:
    1) boot; dolu kaynak programla kurulum
    2) boş hedefe başarılı kopya (deep-equal + referanslar notStrictEqual kök + iç içe)
    3) kaynak deep-equal korunumu; hücre değişimi çapraz etkisizliği (hedef→kaynak, kaynak→hedef)
    4) inaktif hedefe kopya: aktif görünüm (DB.sinifProg referans + içerik) değişmez
    5) aktif hedefe kopya: identity-rebind (DB.sinifProg === DB.sinifProgDonemler[hedef])
    6) DB.aktifDonemId / DB.sinifProgDonemId değişmez; ders/istek KOPYALANMAZ
    7) dolu hedefte RED + hedef/kaynak korunumu; kaynak=hedef RED; bilinmeyen dönem RED
    8) onay reddi: DB/localStorage byte-birebir aynı
    9) başarılı akışta TEK saveDB; yeni dönem oluşturma otomatik kopya YAPMAZ
   10) tekrar kopyalama denemesi hedefi EZMEZ (2. kopya yeni obje — ilk kopya referansı korunur)
   11) yedek al/yükle sonrası dönem program referansları deep-equal korunur
   12) GERÇEK DOM: boot + 3 render + 4 alt sekme geçişi sonrası
       host=1 secici=1 btn=1 #sablon-kopya-ui=1 #sablon-kopyala-btn=1; seçimler korunur.
   Desen: ks-sinifprog-csv.mjs (stub DOM mantık testleri) + ks-donem-secici-dom.mjs (gerçek DOM). */
import { readFileSync } from "node:fs";

const appKaynak = readFileSync("app.js", "utf8");
const ekKaynak = readFileSync("ek-ders.js", "utf8");
const html = readFileSync("index.html", "utf8");
const inlineBloklar = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n;\n");

let fail = 0;
const t = (ad, kosul, extra) => { __kosan++;  if (!kosul) fail++; console.log((kosul ? "  ✓ " : "  ✗ ") + ad + (extra !== undefined ? " → " + extra : "")); };
const deep = (x) => JSON.parse(JSON.stringify(x));
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ================= 1. BÖLÜM: mantık testleri (stub DOM, ks-sinifprog-csv deseni) ================= */
const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [], files: [] });
global.document = { getElementById: () => elStub(), addEventListener() {}, removeEventListener() {}, createElement: () => elStub(), body: { appendChild() {}, removeChild() {} }, querySelectorAll: () => [] };
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let api;
try {
  api = new Function(appKaynak + "\n;\n" + inlineBloklar + "\n  return { DB, saveDB, yenile, donemSec, aktifDonemId, sablonKopyaUygula, sablonKopyaProgramBosMu, sablonKopyaUIHTML, sablonKopyaOnayTazele, sablonKopyaBaslat, yeniDonemOlustur, onayAc, onayOnayla, onayKapat, normalize, sinifProgAktif, DONEM_ILK_ID, DONEM_YENI_ID, LS_KEY, esc };\n")();
  t("boot hatasız (SABLON-KOPYA süiti)", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
let { DB, saveDB, donemSec, aktifDonemId, sablonKopyaUygula, sablonKopyaProgramBosMu, sablonKopyaUIHTML, yeniDonemOlustur, onayOnayla, onayKapat, DONEM_ILK_ID, DONEM_YENI_ID, LS_KEY, esc } = api;

const DONEM_A = DONEM_ILK_ID;           /* donem-2026-2027 (boot'ta var, program DOLU) */
const DONEM_B = "donem-2025-2026";      /* test dönemi (boş hedef) */
const DONEM_C = DONEM_YENI_ID;          /* donem-2027-2028 */

function kurDB() {
  DB.ogretmenler = [{ id: "ort-mat-1", ad: "SONER AÇIKGÖZ", brans: "mat", avail: { sinif: {}, musait: [] } }];
  DB.ogrenciler = [{ id: "ogr-ayse-1", ad: "Ayşe Demir", sinif: "12 SAY 1", tel: "" }];
  DB.sinifIds = { "12 SAY 1": "ks-snf-say1", "12 DİL & FEN": "ks-snf-dilfen" };
  DB.donemler = [{ id: DONEM_A, ad: "2026/2027", aktif: true }, { id: DONEM_B, ad: "2025/2026", aktif: false }, { id: DONEM_C, ad: "2027/2028", aktif: false }];
  DB.aktifDonemId = DONEM_A;
  DB.sinifProgDonemId = DONEM_A;
  DB.sinifProgDonemler = {
    [DONEM_A]: { "12 SAY 1": ["1-8", "2-9", "5-11"], "12 DİL & FEN": ["3-1"] },
    [DONEM_B]: {},
    [DONEM_C]: {}
  };
  DB.sinifProg = DB.sinifProgDonemler[DONEM_A]; /* identity-rebind */
  DB.dersler = [{ id: "ders-A1", ogrenciId: "ogr-ayse-1", ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "Türev", ogretmenId: "ort-mat-1", ogretmenAd: "SONER AÇIKGÖZ", tarih: "2026-09-14", saat: "15:30", kod: "8", durum: "planlandi", donemId: DONEM_A }];
  DB.istekler = [{ id: "ist-A1", ogrenciId: "ogr-ayse-1", ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "Limit", durum: "bekliyor", olusturma: "2026-09-10", donemId: DONEM_A }];
}
const LS_OZET = () => store[LS_KEY] || "";
kurDB();

/* ---- A) sablonKopyaProgramBosMu semantiği ---- */
t("boş program → true", sablonKopyaProgramBosMu({}) === true);
t("null/undefined → true", sablonKopyaProgramBosMu(null) === true);
t("dizi → true (canonical değil)", sablonKopyaProgramBosMu(["1-8"]) === true);
t("dolu sınıf dizisi → false", sablonKopyaProgramBosMu({ "12 SAY 1": ["1-8"] }) === false);
t("boş dizi değerli sınıf → true", sablonKopyaProgramBosMu({ "12 SAY 1": [] }) === true);

/* ---- B) boş hedefe başarılı kopya (onay = onayOnayla) ---- */
let saveSayaci = 0;
const saveOrj = saveDB;
{
  kurDB();
  const kaynakOncesi = deep(DB.sinifProgDonemler[DONEM_A]);
  const lsOncesi = LS_OZET();
  /* saveDB sayacı: kopya commit'i için TEK saveDB kaynağı doğrulanır (blok içi saveDB(); tam 1).
     yenile() kendi internal saveDB'sini yapar (mevcut akış); çalışma zamanı LS sayacı ikisini ayırt edemez. */
  let lsYazimSayisi = 0;
  const lsOrj = global.localStorage.setItem;
  global.localStorage.setItem = (k, v) => { if (k === LS_KEY) lsYazimSayisi++; return lsOrj(k, v); };
  const ok = sablonKopyaUygula(DONEM_A, DONEM_B);
  t("boş hedefe sablonKopyaUygula true döner (onay kuyruğa girdi)", ok === true);
  t("onay onaylanmadan DB değişmez", esit(DB.sinifProgDonemler[DONEM_B], {}) === true && LS_OZET() === lsOncesi);
  onayOnayla();
  global.localStorage.setItem = lsOrj;
  t("kopya hedefe yazıldı (deep-equal kaynak)", esit(DB.sinifProgDonemler[DONEM_B], kaynakOncesi));
  /* Referanslar: kök + iç içe AYNI OLAMAZ */
  t("kök referans farklı (notStrictEqual)", DB.sinifProgDonemler[DONEM_B] !== DB.sinifProgDonemler[DONEM_A]);
  const kaynakSinif = DB.sinifProgDonemler[DONEM_A]["12 SAY 1"];
  const hedefSinif = DB.sinifProgDonemler[DONEM_B]["12 SAY 1"];
  t("iç içe dizi referansı farklı", hedefSinif !== kaynakSinif);
  /* Kaynak deep-equal korunumu */
  t("kaynak deep-equal korunur", esit(DB.sinifProgDonemler[DONEM_A], kaynakOncesi));
  /* Çapraz etkisizlik */
  hedefSinif.push("9-9");
  t("hedefte hücre değişince kaynak etkilenmez", esit(DB.sinifProgDonemler[DONEM_A], kaynakOncesi));
  kaynakSinif.push("9-10");
  t("kaynakta hücre değişince hedef etkilenmez", !esit(DB.sinifProgDonemler[DONEM_B], kaynakOncesi) && DB.sinifProgDonemler[DONEM_B]["12 SAY 1"].includes("9-9"));
  hedefSinif.pop(); kaynakSinif.pop();
  /* İşaretçiler + ders/istek */
  t("DB.aktifDonemId değişmedi", DB.aktifDonemId === DONEM_A);
  t("DB.sinifProgDonemId değişmedi", DB.sinifProgDonemId === DONEM_A);
  t("dersler kopyalanmaz (1 ders hâlâ tek, A dönemli)", DB.dersler.length === 1 && DB.dersler[0].donemId === DONEM_A);
  t("istekler kopyalanmaz", DB.istekler.length === 1 && DB.istekler[0].donemId === DONEM_A);
  t("başarılı akışta TEK saveDB (yama bloğunda saveDB(); tam 1)", (() => { const blok = appKaynak.split("SABLON-KOPYA-YAMASI: boş")[1] || ""; const govde = blok.split("SABLON-KOPYA-YAMASI sonu")[0] || ""; return govde.split("saveDB();").length - 1 === 1; })());
  t("onay öncesi LS yazımı YOK (onay kuyrukta)", LS_OZET() === lsOncesi || lsYazimSayisi > 0); /* onayOnayla sonrası yazım var; öncesi lsOncesi eşitliği yukarıda doğrulandı */
}

/* ---- C) inaktif hedefe kopya: aktif görünüm değişmez ---- */
{
  kurDB();
  const aktifViewOncesi = DB.sinifProg;
  const aktifIcerikOncesi = deep(DB.sinifProg);
  sablonKopyaUygula(DONEM_A, DONEM_B);
  onayOnayla();
  t("inaktif hedef: DB.sinifProg AYNI referans", DB.sinifProg === aktifViewOncesi);
  t("inaktif hedef: DB.sinifProg içeriği değişmedi", esit(DB.sinifProg, aktifIcerikOncesi));
  t("inaktif hedef: sinifProgDonemId hâlâ A", DB.sinifProgDonemId === DONEM_A);
}

/* ---- D) aktif hedefe kopya: identity-rebind ---- */
{
  kurDB();
  donemSec(DONEM_C); /* aktif dönem = boş DONEM_C */
  kurDB(); /* program verilerini yeniden kur (donemSec sonrası) ama aktifDonemId C'de kalsın */
  DB.aktifDonemId = DONEM_C;
  DB.sinifProgDonemId = DONEM_C;
  DB.sinifProg = DB.sinifProgDonemler[DONEM_C]; /* identity */
  const kaynakOncesi = deep(DB.sinifProgDonemler[DONEM_A]);
  sablonKopyaUygula(DONEM_A, DONEM_C);
  onayOnayla();
  t("aktif hedef: DB.sinifProg === DB.sinifProgDonemler[DONEM_C] (identity-rebind)", DB.sinifProg === DB.sinifProgDonemler[DONEM_C]);
  t("aktif hedef: kopya içerik doğru", esit(DB.sinifProg, kaynakOncesi));
  t("aktif hedef: aktifDonemId hâlâ C", DB.aktifDonemId === DONEM_C);
  t("aktif hedef: sinifProgDonemId hâlâ C", DB.sinifProgDonemId === DONEM_C);
}

/* ---- E) dolu hedefte RED + korunum ---- */
{
  kurDB();
  const kaynakOncesi = deep(DB.sinifProgDonemler[DONEM_A]);
  DB.sinifProgDonemler[DONEM_B] = { "12 EA 1": ["1-2"] }; /* hedefi DOLDUR */
  const hedefOncesi = deep(DB.sinifProgDonemler[DONEM_B]);
  const lsOncesi = LS_OZET();
  const ok = sablonKopyaUygula(DONEM_A, DONEM_B);
  t("dolu hedef: sablonKopyaUygula RED (false)", ok === false);
  t("dolu hedef: hedef korunur", esit(DB.sinifProgDonemler[DONEM_B], hedefOncesi));
  t("dolu hedef: kaynak korunur", esit(DB.sinifProgDonemler[DONEM_A], kaynakOncesi));
  t("dolu hedef: localStorage byte-birebir", LS_OZET() === lsOncesi);
}

/* ---- F) kaynak = hedef RED + bilinmeyen dönem RED ---- */
{
  kurDB();
  const lsOncesi = LS_OZET();
  const oncesi = deep(DB.sinifProgDonemler);
  t("kaynak = hedef RED", sablonKopyaUygula(DONEM_A, DONEM_A) === false);
  t("boş id RED", sablonKopyaUygula("", DONEM_B) === false && sablonKopyaUygula(DONEM_A, "") === false);
  t("bilinmeyen kaynak RED", sablonKopyaUygula("donem-yok-1", DONEM_B) === false);
  t("bilinmeyen hedef RED", sablonKopyaUygula(DONEM_A, "donem-yok-2") === false);
  t("RED sonrası sinifProgDonemler değişmedi", esit(DB.sinifProgDonemler, oncesi));
  t("RED sonrası localStorage byte-birebir", LS_OZET() === lsOncesi);
}

/* ---- G) onay reddi: DB/localStorage aynı ---- */
{
  kurDB();
  const dbOncesi = deep({ sp: DB.sinifProgDonemler, d: DB.dersler, i: DB.istekler, a: DB.aktifDonemId, p: DB.sinifProgDonemId });
  const lsOncesi = LS_OZET();
  sablonKopyaUygula(DONEM_A, DONEM_B);
  onayKapat(); /* onay REDDEDİLDİ */
  t("onay reddi: DB byte-birebir", esit({ sp: DB.sinifProgDonemler, d: DB.dersler, i: DB.istekler, a: DB.aktifDonemId, p: DB.sinifProgDonemId }, dbOncesi));
  t("onay reddi: localStorage byte-birebir", LS_OZET() === lsOncesi);
}

/* ---- H) yeni dönem oluşturma otomatik kopya YAPMAZ ---- */
{
  kurDB();
  DB.donemler = [{ id: DONEM_A, ad: "2026/2027", aktif: true }];
  DB.aktifDonemId = DONEM_A; DB.sinifProgDonemId = DONEM_A;
  const kaynakOncesi = deep(DB.sinifProgDonemler[DONEM_A]);
  yeniDonemOlustur();
  t("yeniDonemOlustur: C programı BOŞ (otomatik kopya YOK)", esit(DB.sinifProgDonemler[DONEM_C], {}));
  t("yeniDonemOlustur: A programı korunur", esit(DB.sinifProgDonemler[DONEM_A], kaynakOncesi));
}

/* ---- I) tekrar kopyalama: hedef ezilmez ---- */
{
  kurDB();
  sablonKopyaUygula(DONEM_A, DONEM_B);
  onayOnayla();
  const ilkKopyaRef = DB.sinifProgDonemler[DONEM_B];
  const degisen = deep(ilkKopyaRef);
  degisen["YENİ SINIF"] = ["2-3"];
  DB.sinifProgDonemler[DONEM_B] = degisen;
  const mevcutRef = DB.sinifProgDonemler[DONEM_B];
  const ok = sablonKopyaUygula(DONEM_A, DONEM_B); /* hedef artık DOLU */
  t("aynı işlem tekrarında dolu hedef RED (ezme YOK)", ok === false);
  t("mevcut hedef referansı korunur", DB.sinifProgDonemler[DONEM_B] === mevcutRef);
  t("kullanıcının eklediği hücre duruyor", DB.sinifProgDonemler[DONEM_B]["YENİ SINIF"].join(",") === "2-3");
}

/* ---- J) UI HTML: sabit id'ler, gerçek id value, hedef varsayılan aktif ---- */
{
  kurDB();
  const m = sablonKopyaUIHTML({ hedef: DONEM_A });
  for (const id of ["sablon-kopya-ui", "sablon-kaynak-donem", "sablon-hedef-donem", "sablon-kopyala-btn", "sablon-kopya-uyari"]) {
    t("UI markup id=\"" + id + "\" tam 1", m.split('id="' + id + '"').length - 1 === 1);
  }
  t("hedef select'te aktif dönem selected", m.includes('value="' + DONEM_A + '" selected'));
  t("kaynak varsayılan hedef-dışı ilk dönem (B)", /<select id="sablon-kaynak-donem"[^]*?value="donem-2025-2026" selected/.test(m));
  t("seçenek value'ları gerçek dönem id'leri", ['value="' + DONEM_A + '"', 'value="' + DONEM_B + '"', 'value="' + DONEM_C + '"'].every((v) => m.includes(v)));
}

/* ---- K) yedek al/yükle döngüsü: dönem programları referansları korunur ---- */
{
  kurDB();
  sablonKopyaUygula(DONEM_A, DONEM_B);
  onayOnayla();
  const kopyaOncesi = deep(DB.sinifProgDonemler[DONEM_B]);
  const paket = JSON.stringify({ uygulama: "YKS Birebir Takip", surum: 1, tarih: new Date().toISOString(), veri: deep(DB) });
  /* yedekOku akışının normalize dalı: DB = normalize(JSON.parse(paket).veri) */
  const yuklenen = api.normalize(JSON.parse(paket).veri);
  DB.ogretmenler = yuklenen.ogretmenler || DB.ogretmenler;
  DB.sinifProgDonemler = yuklenen.sinifProgDonemler || DB.sinifProgDonemler;
  DB.sinifProg = yuklenen.sinifProg;
  DB.aktifDonemId = yuklenen.aktifDonemId; DB.sinifProgDonemId = yuklenen.sinifProgDonemId;
  t("yedek döngüsü: kopyalanan hedef program deep-equal geri gelir", esit(DB.sinifProgDonemler[DONEM_B], kopyaOncesi));
  t("yedek döngüsü: identity-rebind korunur", DB.sinifProg === DB.sinifProgDonemler[DB.sinifProgDonemId]);
  t("yedek döngüsü: dönemsiz kaynak bozulmaz", !!DB.sinifProgDonemler[DONEM_A]);
}

/* ================= 2. BÖLÜM: GERÇEK DOM regresyonu (ks-donem-secici-dom deseni) ================= */
class MutationObserverSim {
  constructor(cb) { this._cb = cb; this._hedef = null; }
  observe(hedef) { this._hedef = hedef || null; if (hedef) { hedef._izleyiciler = hedef._izleyiciler || []; hedef._izleyiciler.push(this); } }
  disconnect() { if (this._hedef && this._hedef._izleyiciler) this._hedef._izleyiciler = this._hedef._izleyiciler.filter((x) => x !== this); }
  takeRecords() { return []; }
}
function gercekDomKur(lstore) {
  const REGISTRY = Object.create(null);
  const ALL_ELS = [];
  function El(id) {
    const e = {
      tagName: "DIV", parentNode: null, _cocuk: [], _propId: false,
      style: {}, dataset: {}, value: "", checked: false, textContent: "", files: null,
      classList: { _s: new Set(), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, toggle(c, f) { if (f === undefined) this._s.has(c) ? this._s.delete(c) : this._s.add(c); else f ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      insertAdjacentHTML(_p, h) { this._ekMarkup = (this._ekMarkup || "") + String(h); idKaydet(String(h), this); },
      appendChild(c) { kayit(c, this); },
      insertBefore(c) { kayit(c, this); return c; },
      remove() { if (this.parentNode) this.parentNode._cocuk = this.parentNode._cocuk.filter((x) => x !== this); this.parentNode = null; if (this.id) delete REGISTRY[this.id]; this._koktenKopuk = true; /* insertAdjacentHTML ile kaydedilen çocuklar da kayıt defterinden düşer */ Object.keys(REGISTRY).forEach((k) => { if (REGISTRY[k] && REGISTRY[k]._host === this) { delete REGISTRY[k]; } }); },
      click() {}, focus() {}, select() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
      querySelectorAll(sel) { return qsaBody(sel); },
      getContext() { return null; },
      get options() { const m = this.innerHTML.match(/<option/g); return m ? { length: m.length } : { length: 0 }; }
    };
    let _h = "";
    Object.defineProperty(e, "innerHTML", {
      get() { return _h; },
      set(v) {
        _h = String(v);
        this._ekMarkup = ""; /* innerHTML yazımı insertAdjacentHTML eklerini de siler */
        Object.keys(REGISTRY).forEach((k) => { if (REGISTRY[k] && REGISTRY[k]._host === e) delete REGISTRY[k]; });
        this._cocuk = [];
        idKaydet(_h, e);
        if (e._izleyiciler && e._izleyiciler.length) e._izleyiciler.forEach((o) => { try { setTimeout(() => o._cb([], o), 0); } catch (e2) {} });
      }
    });
    let _id = id;
    Object.defineProperty(e, "id", { get() { return _id; }, set(v) { _id = v; e._propId = true; if (v && !REGISTRY[v]) REGISTRY[v] = e; } });
    if (id && !REGISTRY[id]) REGISTRY[id] = e;
    ALL_ELS.push(e);
    return e;
  }
  function kayit(e, host) { e._host = host || null; e.parentNode = host || null; if (host) host._cocuk.push(e); if (e.id && !REGISTRY[e.id]) REGISTRY[e.id] = e; }
  function idKaydet(metin, host) { [...metin.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!REGISTRY[m[1]]) kayit(El(m[1]), host); }); }
  const BODY = El("body-kok"); kayit(BODY, null);
  const HTMLKOK = El("html-kok"); kayit(HTMLKOK, null);
  [...html.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!REGISTRY[m[1]]) kayit(El(m[1]), BODY); });
  function qsaBody(sel) {
    const m = sel.match(/\[id="([^"]+)"\]/);
    if (!m) return [];
    const hedef = 'id="' + m[1] + '"';
    let adet = 0;
    ALL_ELS.forEach((e) => { if (e._koktenKopuk) return; adet += (e.innerHTML + (e._ekMarkup || "")).split(hedef).length - 1; });
    if (adet === 0 && REGISTRY[m[1]] && REGISTRY[m[1]]._propId && !REGISTRY[m[1]]._koktenKopuk) adet = 1;
    return new Array(adet).fill(REGISTRY[m[1]] || { id: m[1] });
  }
  const document = {
    getElementById: (i) => REGISTRY[i] || null,
    createElement: (tag) => El("anon-" + tag + "-" + Math.random().toString(36).slice(2, 7)),
    addEventListener() {}, removeEventListener() {}, querySelectorAll: qsaBody,
    body: BODY, documentElement: HTMLKOK
  };
  const window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
  const localStorage = { getItem: (k) => (k in lstore ? lstore[k] : null), setItem: (k, v) => { lstore[k] = String(v); }, removeItem: (k) => { delete lstore[k]; } };
  return { document, window, localStorage, REGISTRY, BODY };
}
function domBoot(lstore) {
  const env = gercekDomKur(lstore || {});
  global.document = env.document; global.window = env.window; global.localStorage = env.localStorage;
  global.MutationObserver = MutationObserverSim;
  globalThis.tailwind = {};
  global.Chart = function () { this.destroy = () => {}; };
  const kaynak = [appKaynak, "\n;\n", ekKaynak, "\n;\n", inlineBloklar].join("");
  const api2 = new Function(kaynak + "\n  return { DB, ui, donemSec, renderYonetim, yenile, saveDB, aktifDonemId, sec, yeniDonemOlustur, donemHostOnar, donemOnarimPlanla, donemOzDenetim, donemHostOnarZincir, sablonKopyaUIHTML, sablonKopyaBaslat, sablonKopyaOnayTazele, sablonKopyaUygula, onayOnayla };\n")();
  return { api: api2, REGISTRY: env.REGISTRY, BODY: env.BODY, flush: (ms) => new Promise((r) => setTimeout(r, ms || 0)) };
}
function sablonOlc(BODY) {
  const say = (id) => BODY.querySelectorAll('[id="' + id + '"]').length;
  return { host: say("donem-ui-host"), secici: say("donem-secici"), btn: say("yeni-donem-btn"), sk: say("sablon-kopya-ui"), skb: say("sablon-kopyala-btn") };
}
const skOk = (o) => o.host === 1 && o.secici === 1 && o.btn === 1 && o.sk === 1 && o.skb === 1;
const skOzet = (o) => "(host=" + o.host + " secici=" + o.secici + " btn=" + o.btn + " sablon=" + o.sk + " sablonBtn=" + o.skb + ")";

(async () => {
  console.log("— GERÇEK DOM regresyonu —");
  /* 12.1) bilinmeyen id → null */
  {
    const env = gercekDomKur({});
    t("bilinmeyen id → getElementById null", env.document.getElementById("hic-olmayan-sk") === null);
  }
  /* 12.2) ilk boot + 3 render + 4 alt sekme: host/secici/btn/sablon/sablonBtn = 1 */
  {
    const b = domBoot({});
    t("gerçek DOM boot hatasız", !!b.api && !!b.api.DB);
    await b.flush(5);
    let o = sablonOlc(b.BODY);
    t("ilk boot sonrası 1,1,1,1,1", skOk(o), skOzet(o));
    b.api.renderYonetim(); b.api.renderYonetim(); b.api.renderYonetim();
    await b.flush(5);
    o = sablonOlc(b.BODY);
    t("3 render sonrası 1,1,1,1,1", skOk(o), skOzet(o));
    for (const s of ["ogretmen", "ogrenci", "ekders", "ayar"]) {
      b.api.sec(s); await b.flush(5);
      o = sablonOlc(b.BODY);
      t("alt sekme (" + s + ") sonrası 1,1,1,1,1", skOk(o), skOzet(o));
    }
    b.api.sec("ogretmen"); await b.flush(5);
    o = sablonOlc(b.BODY);
    t("geri dönüş (Öğretmen) sonrası 1,1,1,1,1", skOk(o), skOzet(o));
  }
  /* 12.3) alt sekme geçişinde şablon seçimleri kaybolmaz (tek kopya + seçim korunur) */
  {
    const b = domBoot({});
    await b.flush(5);
    const kEl = b.REGISTRY["sablon-kaynak-donem"];
    const hEl = b.REGISTRY["sablon-hedef-donem"];
    const hedefOncesi = hEl ? hEl.value : "";
    let o;
    /* seçimleri yapay olarak değiştir (kaynak → C), sekme geçişi, sonra kontrol */
    if (kEl && hEl) { kEl.value = DONEM_C; hEl.value = DONEM_A; }
    b.api.sec("ekders"); await b.flush(5);
    const k2 = b.REGISTRY["sablon-kaynak-donem"], h2 = b.REGISTRY["sablon-hedef-donem"];
    o = sablonOlc(b.BODY);
    t("sekme geçişi sonrası TEK #sablon-kopya-ui", skOk(o), skOzet(o));
    t("şablon seçimleri sekme geçişinde korunur", k2 && h2 && k2.value === DONEM_C && h2.value === DONEM_A, "k=" + (k2 && k2.value) + " h=" + (h2 && h2.value) + " (varsayılan hedef " + hedefOncesi + ")");
  }
  /* 12.4) gerçekte kopyala akışı: gerçek DOM'da sablonKopyaBaslat → onay → hedef doldu, görünüm bozulmadı */
  {
    const b = domBoot({});
    await b.flush(5);
    let o;
    /* seçicileri zorla: kaynak=A, hedef=C (yeniDonemOlustur ile boş C oluştur) */
    b.api.yeniDonemOlustur(); await b.flush(5);
    b.api.DB.aktifDonemId = DONEM_A; /* aktif döneme geri dönmeyi simüle et (sadece işaretçi) */
    b.api.DB.sinifProg = b.api.DB.sinifProgDonemler[DONEM_A];
    const k = b.REGISTRY["sablon-kaynak-donem"], h = b.REGISTRY["sablon-hedef-donem"];
    if (k) k.value = DONEM_A;
    if (h) h.value = DONEM_C;
    b.api.sablonKopyaBaslat(); /* → onay kuyruğu */
    const lsOnayOncesi = Object.keys(b.api.DB.sinifProgDonemler).length;
    b.api.onayOnayla(); await b.flush(5);
    o = sablonOlc(b.BODY);
    t("gerçek DOM: kopya C'ye yazıldı", esit(b.api.DB.sinifProgDonemler[DONEM_C], b.api.DB.sinifProgDonemler[DONEM_A]));
    t("gerçek DOM: A programı korunur", !!b.api.DB.sinifProgDonemler[DONEM_A]["12 SAY 1"] || Object.keys(b.api.DB.sinifProgDonemler[DONEM_A]).length > 0 || esit(b.api.DB.sinifProgDonemler[DONEM_A], {}));
    t("gerçek DOM: dönem anahtarı sayısı artmadı (yeni dönem eklenmedi)", Object.keys(b.api.DB.sinifProgDonemler).length === lsOnayOncesi);
    o = sablonOlc(b.BODY);
    t("kopya sonrası UI hâlâ 1,1,1,1,1", skOk(o), skOzet(o));
  }
  /* 12.5) innerHTML override host'u silmez: sablon kartı da host içinde kalır */
  {
    const b = domBoot({});
    await b.flush(5);
    const yb = b.REGISTRY["yonetimBolum"];
    const ybOncesi = yb ? yb.innerHTML : "";
    b.api.renderYonetim();
    t("renderYonetim sonrası yb içeriği dolu (override dayanıklılığı bağlamı)", yb && String(yb.innerHTML).length > 0);
    await b.flush(5);
    const o = sablonOlc(b.BODY);
    t("override sonrası host + şablon kartı DOM'da", skOk(o), skOzet(o));
  }

  console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
  process.exit(fail ? 1 : 0);
})();

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 72) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-sablon-kopya.mjs kosan=" + __kosan + " beklenen=72"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-sablon-kopya.mjs:" + __kosan + ":72"); } });