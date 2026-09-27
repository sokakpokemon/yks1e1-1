/* ks-d32-grup-birebir-e2e.mjs — GRUP BİREBİR UÇTAN UCA SÜİTİ (GERÇEK form akışı + gerçek DB)
   FIXTURE: ana öğrenci + 1 ek üye, PAZAR günü grup birebir dersi (GERÇEK planla() form akışıyla).
   6 KONTROL:
   1) Ders kaydı: ogrenciId (ana) + ogrenciIds (ek) BİRLİKTE
   2) Öğretmen HAFTALIK çizelgesi: İKİ üye TAM ad
   3) Öğretmen GÜNLÜK çizelgesi: İKİ üye TAM ad
   4) WhatsApp alıcı listesi: HER üye AYRI satır + doğru "N ders" sayacı
   5) Her üyenin mesaj metni: ortak grup dersi VAR
   6) Havuza geri bırakma: TEK istek + iki üye birlikte
   EŞİK REGRESYONU (D32-GRUP-2UYE): 0 ek (tekli) · 1 ek (grup-2) · 2 ek (grup-3) — üçünde de
   ogrenciIds doğru yazılır/kalır (2'den az ek artık DÜŞÜRÜLMEZ).
   SUITE_DONE kapısı: tam 1 marker, kosan === beklenen === 20. app.js'e YAZMAZ. */
import { readFileSync } from "node:fs";

let __kosan = 0;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 20) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-d32-grup-birebir-e2e.mjs kosan=" + __kosan + " beklenen=20"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-d32-grup-birebir-e2e.mjs:" + __kosan + ":20"); } });

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
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, planla, waAc, ogrenciMesajMetni, dersOgrenciIds, haftalikOgrtTablo, gunlukTablo, dersHavuzaGeriBurak, onayOnayla };
  `)();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  throw e;
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

/* GERÇEK FORT AKIŞI: ana (f-ogrenci) + N ek (panel) → planla() */
function formKur(ekler) {
  ui.grupPanelBaglam = "plan"; ui.panelSecim = { acik: true, arama: "", sinif: "", anaId: ana.id };
  reg["f-ogrenci"].value = ana.ad; reg["f-ders"].value = ogr.brans; reg["f-konu"].value = "Ortak grup konusu";
  reg["f-ogretmen"].value = ogr.ad; reg["f-tarih"].value = pazar; reg["f-saat"].value = SLOT; reg["f-yoksay"].checked = false;
  ui.ekOgrenciIds = ekler;
}
function sonKayit() { return DB.dersler[DB.dersler.length - 1]; }

/* ================= 1) EŞİK REGRESYONU: 0 ek / 1 ek / 2 ek ================= */
DB.dersler = []; formKur([]); planla();
const k0 = sonKayit();
t("eşik 0 ek (tekli): ogrenciIds YAZILMAZ, ogrenciId = ana", !!k0 && !("ogrenciIds" in k0) && k0.ogrenciId === ana.id);

DB.dersler = []; formKur([ek.id, ucuncu.id]); planla();
const k2 = sonKayit();
t("eşik 2 ek (grup-3): ogrenciIds = [ek, üçüncü]", !!k2 && JSON.stringify(k2.ogrenciIds) === JSON.stringify([ek.id, ucuncu.id]));

DB.dersler = []; formKur([ek.id]); planla();
const g = sonKayit();
t("eşik 1 ek (grup-2): ogrenciIds = [ek]", !!g && Array.isArray(g.ogrenciIds) && g.ogrenciIds.length === 1 && g.ogrenciIds[0] === ek.id);

/* ================= 2) K1 — ders kaydı ================= */
t("K1 kayıt: ogrenciId = ana + ogrenciIds = [ek] BİRLİKTE",
  !!g && g.ogrenciId === ana.id && Array.isArray(g.ogrenciIds) && g.ogrenciIds[0] === ek.id,
  g ? JSON.stringify(g.ogrenciIds) : "kayıt yok");
t("K1 dersOgrenciIds = [ana, ek] (tüm katılımcı)",
  !!g && JSON.stringify(dersOgrenciIds(g)) === JSON.stringify([ana.id, ek.id]), g && JSON.stringify(dersOgrenciIds(g)));

/* ================= 3) K2 — HAFTALIK öğretmen çizelgesi ================= */
ui.filtre = "hafta"; ui.anchor = pazar; ui.gunSecim = ""; ui.haftalikOgrtId = ogr.id;
const hafta = haftalikOgrtTablo();
t("K2 haftalık çizelgede ANA üye TAM ad", hafta.includes(ana.ad));
t("K2 haftalık çizelgede EK üye TAM ad", hafta.includes(ek.ad));

/* ================= 4) K3 — GÜNLÜK öğretmen çizelgesi ================= */
ui.filtre = "gun"; ui.anchor = pazar; ui.gunSecim = pazar;
const gun = gunlukTablo();
t("K3 günlük çizelgede ANA üye TAM ad", gun.includes(ana.ad));
t("K3 günlük çizelgede EK üye TAM ad", gun.includes(ek.ad));

/* ================= 5) K4 — WhatsApp alıcı listesi ================= */
ui.filtre = "tumu";
waAc();
const waHTML = reg["waIcerik"] ? reg["waIcerik"].innerHTML : "";
const btnler = [...waHTML.matchAll(/waGonder\('([^']+)'\)/g)].map(m => m[1]);
t("K4 alıcı listesinde ana üye AYRI satır", btnler.filter(i => i === ana.id).length === 1);
t("K4 alıcı listesinde ek üye AYRI satır", btnler.filter(i => i === ek.id).length === 1);
t("K4 üçüncü öğrenci sızmaz", !btnler.includes(ucuncu.id));
const satir = (id) => { const i = waHTML.indexOf("waGonder('" + id + "')"); return i === -1 ? "" : waHTML.slice(Math.max(0, i - 400), i + 60); };
t("K4 ana sayaç = 1 (grup dersi BİR kez)", (satir(ana.id).match(/(\d+) ders/) || [])[1] === "1", (satir(ana.id).match(/(\d+) ders/) || [])[1]);
t("K4 ek sayaç = 1 (grup dersi BİR kez)", (satir(ek.id).match(/(\d+) ders/) || [])[1] === "1", (satir(ek.id).match(/(\d+) ders/) || [])[1]);

/* ================= 6) K5 — mesaj metinleri ================= */
const anaMetin = ogrenciMesajMetni(ana.id);
const ekMetin = ogrenciMesajMetni(ek.id);
t("K5 ana ve ek mesajı üretildi (ikisi de null değil)", typeof anaMetin === "string" && anaMetin.length > 0 && typeof ekMetin === "string" && ekMetin.length > 0);
t("K5 ana mesajında ortak grup dersi VAR (Pazar)", !!anaMetin && anaMetin.includes("Pazar"));
t("K5 ek mesajında ortak grup dersi VAR (Pazar)", !!ekMetin && ekMetin.includes("Pazar"));

/* ================= 7) K6 — havuza geri bırakma ================= */
const istek0 = DB.istekler.length;
dersHavuzaGeriBurak(g.id);
onayOnayla();
const yeni = DB.istekler[DB.istekler.length - 1];
t("K6 ders silindi + TEK istek oluştu (+1)", !DB.dersler.some(x => x.id === g.id) && DB.istekler.length === istek0 + 1, DB.istekler.length - istek0);
t("K6 istek: ogrenciId = ana + ogrenciIds = [ek] + bekliyor",
  !!yeni && yeni.ogrenciId === ana.id && Array.isArray(yeni.ogrenciIds) && yeni.ogrenciIds.length === 1 && yeni.ogrenciIds[0] === ek.id && yeni.durum === "bekliyor");

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
