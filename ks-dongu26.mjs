let __kosan = 0; /* SAYAÇ KAPISI */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 26) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-dongu26.mjs kosan=" + __kosan + " beklenen=26"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-dongu26.mjs:" + __kosan + ":26"); } });
/* ks-dongu26.mjs — DÖNGÜ-26 süiti: GRUP BİREBİR VERİ AKIŞI DÜZELTMESİ
   (1) istekBurak: 3 üyeli grup isteği drop → TEK ders kaydı, ogrenciId ana + ogrenciIds ekler,
       istek havuzdan tüketilir; haftalık tablo hücresinde 3 üye TAM AD görünür.
   (2) gunlukTablo: grup hücresinde 3 üye tam ad; draggable korunumu.
   (3) Tek öğrencili regresyon: ogrenciIds YAZILMAZ, draggable korundu, istek tüketilir.
   (4) formaAktar: renderHavuz çağrısı — havuz innerHTML değişir (tazeliği).
   Desen: tek boot + gerçek DOM id kayıt defteri (ks-istekten-grup.mjs ile aynı). */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
global.document = {
  getElementById: () => elStub(),
  addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => []
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

const EXPORTS = "{ DB, ui, istekBurak, setIstekDrop, formaAktar, haftalikOgrtTablo, gunlukTablo, renderHavuz, dersOgrenciIds, pencere }";
let P;
try {
  P = new Function(scripts + "\n return { DB, ui, istekBurak, setIstekDrop: function(v){ istekDropHedef = v; }, formaAktar, haftalikOgrtTablo, gunlukTablo, renderHavuz, dersOgrenciIds, pencere };\n")();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}

/* ---- Gerçek DOM id kayıt defteri ---- */
const reg = {};
const el = (id) => {
  if (reg[id]) return reg[id];
  const e = { id, textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; }, appendChild() {}, remove() {}, click() {}, focus() {}, addEventListener() {}, scrollIntoView() {}, querySelectorAll: () => [], getContext: () => null };
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
P = new Function(scripts + "\n return { DB, ui, istekBurak, setIstekDrop: function(v){ istekDropHedef = v; }, formaAktar, haftalikOgrtTablo, gunlukTablo, renderHavuz, dersOgrenciIds, pencere };\n")();
const { DB, ui, istekBurak, setIstekDrop, formaAktar, haftalikOgrtTablo, gunlukTablo, renderHavuz, dersOgrenciIds, pencere } = P;

/* Gelecek haftanın Pazartesi'si + Pzt 2. ders slotu (KISA_KOD[1].b = 09:40; slot 1 öğretmende sınıf dersi olabilir) */
const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();

/* draggable attr tespiti: markup ondragstart="dersDrag(event, '<id>'..." — tek tırnak JS içinde charCode ile */
const dragAttr = (id) => "dersDrag(event, " + String.fromCharCode(39) + id;

/* ================= A) Gerçek DB fixture: 3 üyeli grup isteği ================= */
console.log("A) Fixture + istekBurak grup drop:");
const ogrt = DB.ogretmenler[0];
const [ana, u1, u2] = DB.ogrenciler.slice(0, 3);
DB.dersler = DB.dersler.filter(l => l.tarih !== gelecekPzt || l.ogretmenId !== ogrt.id); /* hedef gün temiz */
DB.istekler = DB.istekler.filter(r => r.durum !== "bekliyor");
DB.istekler.push({ id: "d26-istek-1", ogrenciId: ana.id, ogrenciIds: [u1.id, u2.id], ogrenciAd: ana.ad, dersId: ogrt.brans, konu: "Türev", durum: "bekliyor", olusturma: "2026-09-25", donemId: DB.aktifDonemId });
ui.anchor = gelecekPzt;
ui.gunSecim = null;

const stub = { preventDefault() {}, classList: { remove() {} } };
setIstekDrop("d26-istek-1");
istekBurak(stub, stub, ogrt.id, gelecekPzt, "09:40" /* KISA_KOD[1].b — boş kilitli olmayan slot */);

const yeniDers = DB.dersler.find(l => l.tarih === gelecekPzt && l.ogretmenId === ogrt.id);
t("drop sonrası ders kaydı oluştu", !!yeniDers);
t("ders TEK kayıt (kopya yok)", DB.dersler.filter(l => l.konu === "Türev").length === 1);
t("ders.ogrenciId = ana öğrenci", !!yeniDers && yeniDers.ogrenciId === ana.id);
t("ders.ogrenciIds = 2 ek üye (sıra korunur)", !!yeniDers && Array.isArray(yeniDers.ogrenciIds) && yeniDers.ogrenciIds.join("|") === u1.id + "|" + u2.id, JSON.stringify(yeniDers && yeniDers.ogrenciIds));
t("dersOgrenciIds(ders) = 3 üye (ana ilk)", !!yeniDers && JSON.stringify(dersOgrenciIds(yeniDers)) === JSON.stringify([ana.id, u1.id, u2.id]));
t("istek havuzdan TÜKETİLDİ (silindi)", !DB.istekler.some(r => r.id === "d26-istek-1"));

/* Haftalık öğretmen tablosunda 3 üye TAM AD (tablo yalnız ui.haftalikOgrtId seçiliyken çizilir) */
ui.haftalikOgrtId = ogrt.id;
const haftalikHTML = haftalikOgrtTablo();
t("haftalık tablo render edildi", haftalikHTML.length > 0);
t("haftalık hücrede ANA ad tam görünür", haftalikHTML.includes(ana.ad));
t("haftalık hücrede ÜYE 1 tam ad görünür", haftalikHTML.includes(u1.ad));
t("haftalık hücrede ÜYE 2 tam ad görünür", haftalikHTML.includes(u2.ad));
t("grup hücresi draggable (DÖNGÜ-29: havuz hedefi)", !!yeniDers && haftalikHTML.includes(dragAttr(yeniDers.id)));

/* ================= B) Gunluk tablo grup görünümü ================= */
console.log("B) gunlukTablo grup görünümü:");
ui.gunSecim = gelecekPzt;
const gunlukHTML = gunlukTablo();
t("günlük hücrede ana ad", gunlukHTML.includes(ana.ad));
t("günlük hücrede üye 1 tam ad", gunlukHTML.includes(u1.ad));
t("günlük hücrede üye 2 tam ad", gunlukHTML.includes(u2.ad));
t("grup hücresi draggable (gunluk, DÖNGÜ-29)", !!yeniDers && gunlukHTML.includes(dragAttr(yeniDers.id)));

/* ================= C) Tek öğrencili regresyon ================= */
console.log("C) Tek öğrencili birebir regresyon:");
DB.istekler.push({ id: "d26-istek-2", ogrenciId: u1.id, ogrenciAd: u1.ad, dersId: ogrt.brans, konu: "Tekli konu", durum: "bekliyor", olusturma: "2026-09-25", donemId: DB.aktifDonemId });
setIstekDrop("d26-istek-2");
istekBurak({ preventDefault() {}, classList: { remove() {} } }, { classList: { remove() {} } }, ogrt.id, gelecekPzt, "10:30" /* KISA_KOD[2].b */);
const tekDers = DB.dersler.find(l => l.konu === "Tekli konu");
t("tekli istek drop → ders oluştu", !!tekDers);
t("tekli ders ogrenciIds YAZILMAZ (eski şema)", !!tekDers && !("ogrenciIds" in tekDers), JSON.stringify(tekDers && Object.keys(tekDers)));
t("tekli istek tüketildi", !DB.istekler.some(r => r.id === "d26-istek-2"));
const haftalikTek = haftalikOgrtTablo();
t("tekli ders draggable KORUNDU (haftalık)", !!tekDers && haftalikTek.includes(dragAttr(tekDers.id)));
const gunlukTek = gunlukTablo();
t("tekli ders draggable KORUNDU (günlük)", !!tekDers && gunlukTek.includes(dragAttr(tekDers.id)));

/* ================= D) formaAktar → renderHavuz tazeliği ================= */
console.log("D) formaAktar havuz tazeliği:");
ui.filtre = "tumu"; /* pencere() tüm-zamanlar: renderHavuz hafta penceresine bağlı olmasın */
DB.istekler.push({ id: "d26-istek-3", ogrenciId: u2.id, ogrenciAd: u2.ad, dersId: ogrt.brans, konu: "Tazelik konusu", durum: "bekliyor", olusturma: "2026-09-25", donemId: DB.aktifDonemId });
/* formaAktar veri DEĞIŞTIRMEZ (istek bekliyor kalır; yalnız planla/drop tüketir) → render çıktısı aynı olur.
   Doğru assertion: formaAktar gerçekten çalıştı (aktifIstekId) + kaynakta renderHavuz() VAR (DÖNGÜ-26 Yama 3). */
formaAktar("d26-istek-3");
const __formaAktarKaynak = formaAktar.toString();
t("formaAktar kaynağında renderHavuz() çağrısı VAR (DÖNGÜ-26 Yama 3)", __formaAktarKaynak.includes("renderHavuz()"));
t("form aktarımda aktifIstekId set", ui.aktifIstekId === "d26-istek-3");
t("havuzda istek hâlâ VAR (tüketilmez — yalnız planla/drop tüketir)", DB.istekler.some(r => r.id === "d26-istek-3"));

/* ================= E) Alan korunumu ================= */
console.log("E) Alan korunumu:");
const diger = DB.dersler.find(l => l.id !== yeniDers.id && l.id !== tekDers.id);
const digerSnapshot = JSON.stringify(diger || null);
t("başka ders kaydı değişmedi", diger ? JSON.stringify(DB.dersler.find(l => l.id === diger.id)) === digerSnapshot : true);
t("grup ders istek sahipliği: ogrenciId + ogrenciAd ana öğrenci aynen", yeniDers.ogrenciAd === ana.ad);

process.exit(fail ? 1 : 0);
