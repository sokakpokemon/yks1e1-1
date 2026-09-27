/* ks-d32-grup-birebir-e2e.mjs — GRUP BİREBİR E2E DOĞRULAMA (GERÇEK form akışı + gerçek DB)
   FIXTURE: ana öğrenci + 1 ek üye, PAZAR günü grup birebir dersi (GERÇEK planla() form akışıyla).
   6 KONTROL:
   1) Ders kaydı: ogrenciId (ana) + ogrenciIds (ek) BİRLİKTE
   2) Öğretmen HAFTALIK çizelgesi: İKİ üye TAM ad
   3) Öğretmen GÜNLÜK çizelgesi: İKİ üye TAM ad
   4) WhatsApp alıcı listesi: HER üye AYRI satır + doğru "N ders" sayacı
   5) Her üyenin mesaj metni: ortak grup dersi VAR
   6) Sürükle-bırak ile havuza geri bırakma: TEK istek + iki üye birlikte
   Ayrıca REGRESYON: 0 ek (yalnız ana) → eski birebir akış (ogrenciIds YAZILMAZ).
   Teşhis; app.js'e YAZMAZ. */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"),
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
global.window.html2canvas = function () { return Promise.reject(new Error("stub")); };
if (!globalThis.navigator) globalThis.navigator = {};

const reg = {};
const el = (id) => {
  const e = {
    id, textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], files: null,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle() {}, contains(c) { return this._s.has(c); } },
    insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; },
    appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
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
  getElementById: (i) => reg[i] || null, addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()), body: { appendChild() {}, removeChild() {} }, querySelectorAll() { return []; }
};
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (kontrol, name, cond, extra) => { console.log((cond ? "  ✓ [" + kontrol + "] " : "  ✗ [" + kontrol + "] ") + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, planla, waAc, ogrenciMesajMetni, dersOgrenciIds, haftalikOgrtTablo, gunlukTablo,
             dersHavuzaGeriBurak, onayOnayla, temizleForm };
  `)();
} catch (e) {
  console.error("BOOT HATASI:", e.message);
  console.log(e.stack.split("\n").slice(0, 10).join("\n"));
  process.exit(1);
}
const { DB, ui, planla, waAc, ogrenciMesajMetni, dersOgrenciIds, haftalikOgrtTablo, gunlukTablo, dersHavuzaGeriBurak, onayOnayla } = P;

/* ---------- GERÇEK DB FIXTURE ---------- */
const ana = DB.ogrenciler[0], ek = DB.ogrenciler[1], ucuncu = DB.ogrenciler[2];
const ogr = DB.ogretmenler[0];
ogr.avail = { sinif: {}, musait: [] }; /* slot kilidi olmasın */
DB.dersler = [];
DB.istekler = [];
const pazar = (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const SLOT = "09:40";

/* ---- GERÇEK FORM AKIŞI: ana (f-ogrenci) + 1 ek (panel) → planla() ---- */
ui.grupPanelBaglam = "plan"; ui.panelSecim = { acik: true, arama: "", sinif: "", anaId: ana.id };
reg["f-ogrenci"].value = ana.ad; reg["f-ders"].value = ogr.brans; reg["f-konu"].value = "Ortak grup konusu";
reg["f-ogretmen"].value = ogr.ad; reg["f-tarih"].value = pazar; reg["f-saat"].value = SLOT; reg["f-yoksay"].checked = false;
ui.ekOgrenciIds = [ek.id];
planla();
console.log("Fixture: Pazar " + pazar + " · ana=" + ana.ad + " · ek=" + ek.ad + " · öğretmen=" + ogr.ad);

/* ---------- K1: ders kaydı ---------- */
const g = DB.dersler[DB.dersler.length - 1];
t(1, "kayıt: ogrenciId=ana + ogrenciIds=[ek] BİRLİKTE",
  !!g && g.ogrenciId === ana.id && Array.isArray(g.ogrenciIds) && g.ogrenciIds.length === 1 && g.ogrenciIds[0] === ek.id,
  g ? "ogrenciId=" + (g.ogrenciId === ana.id) + " ogrenciIds=" + JSON.stringify(g.ogrenciIds) : "kayıt yok");
t(1, "dersOgrenciIds = [ana, ek] (tüm katılımcı)",
  !!g && JSON.stringify(dersOgrenciIds(g)) === JSON.stringify([ana.id, ek.id]), g && JSON.stringify(dersOgrenciIds(g)));

/* ---------- K2: HAFTALIK öğretmen çizelgesi ---------- */
ui.filtre = "hafta"; ui.anchor = pazar; ui.gunSecim = ""; ui.haftalikOgrtId = ogr.id;
const hafta = haftalikOgrtTablo();
t(2, "haftalık çizelgede ANA üye TAM ad", hafta.includes(ana.ad));
t(2, "haftalık çizelgede EK üye TAM ad", hafta.includes(ek.ad));

/* ---------- K3: GÜNLÜK öğretmen çizelgesi ---------- */
ui.filtre = "gun"; ui.anchor = pazar; ui.gunSecim = pazar;
const gun = gunlukTablo();
t(3, "günlük çizelgede ANA üye TAM ad", gun.includes(ana.ad));
t(3, "günlük çizelgede EK üye TAM ad", gun.includes(ek.ad));

/* ---------- K4: WhatsApp alıcı listesi ---------- */
ui.filtre = "tumu";
waAc();
const waHTML = reg["waIcerik"] ? reg["waIcerik"].innerHTML : "";
const btnler = [...waHTML.matchAll(/waGonder\('([^']+)'\)/g)].map(m => m[1]);
t(4, "alıcı listesinde ana üye AYRI satır", btnler.filter(i => i === ana.id).length === 1);
t(4, "alıcı listesinde ek üye AYRI satır", btnler.filter(i => i === ek.id).length === 1);
t(4, "üçüncü öğrenci sızmaz", !btnler.includes(ucuncu.id));
const satir = (id) => { const i = waHTML.indexOf("waGonder('" + id + "')"); return i === -1 ? "" : waHTML.slice(Math.max(0, i - 400), i + 60); };
const anaN = (satir(ana.id).match(/(\d+) ders/) || [])[1];
const ekN = (satir(ek.id).match(/(\d+) ders/) || [])[1];
t(4, "ana sayaç = 1 (grup dersi BİR kez)", anaN === "1", anaN);
t(4, "ek sayaç = 1 (grup dersi BİR kez)", ekN === "1", ekN);

/* ---------- K5: mesaj metinleri ---------- */
const anaMetin = ogrenciMesajMetni(ana.id);
const ekMetin = ogrenciMesajMetni(ek.id);
t(5, "ana mesajı üretildi", typeof anaMetin === "string" && anaMetin.length > 0);
t(5, "ek mesajı üretildi", typeof ekMetin === "string" && ekMetin.length > 0);
t(5, "ana mesajında ortak grup dersi VAR (Pazar)", !!anaMetin && anaMetin.includes("Pazar"));
t(5, "ek mesajında ortak grup dersi VAR (Pazar)", !!ekMetin && ekMetin.includes("Pazar"));

/* ---------- K6: Sürükle-bırak ile havuza geri bırakma ---------- */
const istek0 = DB.istekler.length;
dersHavuzaGeriBurak(g.id);
onayOnayla();
const yeni = DB.istekler[DB.istekler.length - 1];
t(6, "ders SİLİNDİ", !DB.dersler.some(x => x.id === g.id));
t(6, "TEK istek oluştu (+1)", DB.istekler.length === istek0 + 1, DB.istekler.length - istek0);
t(6, "istekte iki üye BİRLİKTE (ogrenciId=ana, ogrenciIds=[ek])",
  !!yeni && yeni.ogrenciId === ana.id && Array.isArray(yeni.ogrenciIds) && yeni.ogrenciIds.length === 1 && yeni.ogrenciIds[0] === ek.id);
t(6, "istek bekliyor", !!yeni && yeni.durum === "bekliyor");

/* ---------- REGRESYON: 0 ek → eski birebir akış (ogrenciIds YAZILMAZ) ---------- */
DB.dersler = []; DB.istekler = [];
ui.grupPanelBaglam = "plan"; ui.ekOgrenciIds = [];
reg["f-ogrenci"].value = ana.ad; reg["f-ders"].value = ogr.brans; reg["f-konu"].value = "Tekli";
reg["f-ogretmen"].value = ogr.ad; reg["f-tarih"].value = pazar; reg["f-saat"].value = SLOT; reg["f-yoksay"].checked = false;
planla();
const tek = DB.dersler[DB.dersler.length - 1];
t("R", "0 ek → birebir kayıt: ogrenciIds YOK", !!tek && !("ogrenciIds" in tek) && tek.ogrenciId === ana.id);

console.log(fail ? "\n>>> E2E: BAŞARISIZ" : "\n>>> E2E: HEPSİ GEÇTİ (6/6 + regresyon)");
process.exit(fail);
