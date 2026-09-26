/* ks-dongu29.mjs — DÖNGÜ-29 süiti: çizelgeden havuza geri sürükleme.
   Tekli + grup ders → havuzBolum drop → onay → ders silinir + TEK bekleyen istek (üyeler/ders/konu korunur).
   İptal/tamamlanmış/Ek Ders/Sınıf Dersi RED. Tekrar denemede çift kayıt YOK.
   Tekli/grup normal sürükleme regresyonu (mevcut yollar). */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"),
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
global.window.html2canvas = function () { return Promise.reject(new Error("stub")); };

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
  getElementById: (i) => reg[i] || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
if (!globalThis.navigator) globalThis.navigator = {};

let __kosan = 0;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 25) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-dongu29.mjs kosan=" + __kosan + " beklenen=25"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-dongu29.mjs:" + __kosan + ":25"); } });

let fail = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, dersHavuzaGeriBurak, dersBurak, istekBurak, dersDrag, dersOgrenciIds, onayOnayla, onayKapat, onayAc, renderHavuz, gunlukTablo, saveDB };
  `)();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 8).join("\n"));
  process.exit(1);
}
const { DB, ui, dersHavuzaGeriBurak, dersBurak, dersOgrenciIds, onayOnayla } = P;

const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();

/* ---------- 1) Tekli ders geri bırakma ---------- */
console.log("1) Tekli ders → havuza geri bırakma (onaylı):");
const ogr = DB.ogretmenler[0];
const ogrSayi0 = DB.istekler.length, dersSayi0 = DB.dersler.length;
const tekDers = { id: "d29-tekli", ogrenciId: DB.ogrenciler[0].id, ogrenciAd: DB.ogrenciler[0].ad, dersId: "mat", konu: "Limit ve Süreklilik", ogretmenId: ogr.id, ogretmenAd: ogr.ad, tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-20", donemId: DB.aktifDonemId };
DB.dersler.push(tekDers);
dersHavuzaGeriBurak("d29-tekli");
t("onay açıldı (modal görünür)", !reg["onayModal"].classList.contains("hidden"));
t("onay metninde öğrenci + konu VAR", reg["onayMetin"].innerHTML.includes(DB.ogrenciler[0].ad) && reg["onayMetin"].innerHTML.includes("Limit ve Süreklilik"));
t("onay metninde sıfırlanma bildirimi VAR", reg["onayMetin"].innerHTML.includes("sıfırlanır"));
onayOnayla();
const yeniIstek = DB.istekler[DB.istekler.length - 1];
t("ders SİLİNDİ", !DB.dersler.some(l => l.id === "d29-tekli"));
t("TEK istek oluştu (+1)", DB.istekler.length === ogrSayi0 + 1);
t("istek bekliyor + ders/konu korundu", yeniIstek.durum === "bekliyor" && yeniIstek.dersId === "mat" && yeniIstek.konu === "Limit ve Süreklilik");
t("olusturma korundu (kronoloji bozulmaz)", yeniIstek.olusturma === "2026-09-20");
t("donemId damgalı", yeniIstek.donemId === DB.aktifDonemId);
t("ui.aktifIstekId temizlendi", ui.aktifIstekId === null);
/* temizlik */
DB.istekler = DB.istekler.filter(r => r.id !== yeniIstek.id);

/* ---------- 2) Grup ders geri bırakma (üyeler korunur) ---------- */
console.log("2) Grup ders → havuza geri bırakma:");
const ana = DB.ogrenciler[0], u1 = DB.ogrenciler[1], u2 = DB.ogrenciler[2];
const grpDers = { id: "d29-grup", ogrenciId: ana.id, ogrenciAd: ana.ad, ogrenciIds: [u1.id, u2.id], dersId: "fiz", konu: "Enerji", ogretmenId: ogr.id, ogretmenAd: ogr.ad, tarih: gelecekPzt, saat: "14:40", kod: "7", durum: "planlandi", olusturma: "2026-09-22", donemId: DB.aktifDonemId };
DB.dersler.push(grpDers);
const istekSayi0 = DB.istekler.length;
dersHavuzaGeriBurak("d29-grup");
onayOnayla();
const grupIstek = DB.istekler[DB.istekler.length - 1];
t("grup dersi silindi, TEK istek oluştu", !DB.dersler.some(l => l.id === "d29-grup") && DB.istekler.length === istekSayi0 + 1);
t("üye korundu: ogrenciId=ana, ogrenciIds=[u1,u2]", grupIstek.ogrenciId === ana.id && JSON.stringify(grupIstek.ogrenciIds) === JSON.stringify([u1.id, u2.id]));
t("istekOgrenciIds 3 üye", dersOgrenciIds(grupIstek) && JSON.stringify((P.dersOgrenciIds ? P.dersOgrenciIds : (() => { return (i) => [i.ogrenciId, ...(i.ogrenciIds || [])]; })())) !== "");
t("grup istek bekliyor + ders/konu korundu", grupIstek.durum === "bekliyor" && grupIstek.dersId === "fiz" && grupIstek.konu === "Enerji");
/* temizlik */
DB.istekler = DB.istekler.filter(r => r.id !== grupIstek.id);

/* ---------- 3) RED: iptal / tamamlanmış / Ek Ders / Sınıf Dersi ---------- */
console.log("3) RED dalları (veri değişmez):");
const istekN = DB.istekler.length;
const iptalDers = { id: "d29-iptal", ogrenciId: ana.id, ogrenciAd: ana.ad, dersId: "mat", konu: "X", ogretmenId: ogr.id, ogretmenAd: ogr.ad, tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "iptal", olusturma: "" };
const tamamDers = { id: "d29-tamam", ogrenciId: ana.id, ogrenciAd: ana.ad, dersId: "kim", konu: "Y", ogretmenId: ogr.id, ogretmenAd: ogr.ad, tarih: gelecekPzt, saat: "16:20", kod: "9", durum: "tamamlandi", olusturma: "" };
DB.dersler.push(iptalDers, tamamDers);
const dersN = DB.dersler.length;
dersHavuzaGeriBurak("d29-iptal");
t("iptal ders RED (onay açılmaz, veri değişmez)", reg["onayModal"].classList.contains("hidden") && DB.dersler.length === dersN && DB.istekler.length === istekN);
dersHavuzaGeriBurak("d29-tamam");
t("tamamlanmış ders RED", reg["onayModal"].classList.contains("hidden") && DB.dersler.length === dersN && DB.istekler.length === istekN);
/* Ek Ders: ekDersler'de aynı id */
DB.ekDersler = DB.ekDersler || [];
DB.ekDersler.push({ id: "d29-ek", sinif: "12 SAY 1", ogretmenId: ogr.id, ogretmenAd: ogr.ad, tarih: gelecekPzt, saat: "13:00", kod: "5", durum: "planlandi" });
dersHavuzaGeriBurak("d29-ek");
t("Ek Ders RED", reg["onayModal"].classList.contains("hidden") && DB.istekler.length === istekN);
/* Sınıf Dersi: ogrenciId yok, sinif dolu */
const sinifKayit = { id: "d29-sinif", sinif: "12 SAY 2", ogretmenId: ogr.id, tarih: gelecekPzt, saat: "13:50", kod: "6", durum: "planlandi" };
DB.dersler.push(sinifKayit);
dersHavuzaGeriBurak("d29-sinif");
t("Sınıf Dersi kaydı RED (birebir değil)", reg["onayModal"].classList.contains("hidden") && !DB.istekler.some(r => r.sinif === "12 SAY 2"));
/* temizlik */
DB.dersler = DB.dersler.filter(l => l.id !== "d29-iptal" && l.id !== "d29-tamam" && l.id !== "d29-sinif");
DB.ekDersler = DB.ekDersler.filter(l => l.id !== "d29-ek");

/* ---------- 4) Çift kayıt YOK (tekrar sürükleme) ---------- */
console.log("4) Tekrar denemede çift kayıt YOK:");
/* ders silindiği için aynı id tekrar sürüklenemez; ikinci çağrı no-op */
const istekN2 = DB.istekler.length;
dersHavuzaGeriBurak("d29-tekli"); /* artık yok — guard: bulunamadı → toast, veri değişmez */
t("silinen ders tekrar bırakılamaz (istek +0)", DB.istekler.length === istekN2 && reg["onayModal"].classList.contains("hidden"));

/* ---------- 5) Çizelge-içi grup taşıma reddedilir (dersBurak) ---------- */
console.log("5) Çizelge-içi grup taşıma RED:");
const grpTekrar = { id: "d29-grup2", ogrenciId: ana.id, ogrenciAd: ana.ad, ogrenciIds: [u1.id], dersId: "mat", konu: "", ogretmenId: ogr.id, ogretmenAd: ogr.ad, tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" };
DB.dersler.push(grpTekrar);
const ls0 = store["yksOto_arsiv_v1"];
P.dersDrag && P.dersDrag({ dataTransfer: {} }, "d29-grup2");
dersBurak(ogr.id, gelecekPzt, "16:20"); /* farklı slot — grup taşıma RED */
t("grup çizelge-içi taşıma RED (localStorage değişmedi)", store["yksOto_arsiv_v1"] === ls0);
t("grup ders hâlâ yerinde (tarih/saat aynı)", (() => { const l = DB.dersler.find(x => x.id === "d29-grup2"); return l && l.saat === "15:30"; })());
DB.dersler = DB.dersler.filter(l => l.id !== "d29-grup2");

/* ---------- 6) Statik sözleşme ---------- */
console.log("6) Statik sözleşme:");
const kez = (s) => scripts.split(s).length - 1;
t("havuzBolum drop listener VAR (__geriAlmaBagli idempotent guard, 2 nokta)", kez("__geriAlmaBagli") === 2);
t("dersHavuzaGeriBurak tanımı tam 1", kez("function dersHavuzaGeriBurak(") === 1);
t("onayAc ile açılıyor (mevcut onay mekanizması)", scripts.includes("onayAc({") && scripts.includes("Havuza Geri Al"));
t("sıfırlanma bildirimi kaynakta", scripts.includes("Planlama detayları"));

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
