/* ks-istekten-grup.mjs — İSTEK HAVUZUNDAN PLANLAMA → GRUP SEÇİMİ testleri
   (1) panel istekten planda DOM'da, (2) sahip + 2 ek → tek kayıt, (3) ogrenciId sahip + ogrenciIds ekler,
   (4) istek kaydı değişmedi (yalnız durum), (5) çakışan üyede isimli uyarı, (6) tekli eski akış bozulmadı,
   (7) 10+ seçim engellenmiyor. ÖNEMLİ: tek boot — gerçek DOM id kayıt defteri (ks-panel-secim.mjs deseni). */
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
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

const EXPORTS = "{ DB, ui, planla, formaAktar, duzeltmeBul, dersOgrenciIds, renderFormDestek, grupPanelCiz, grupPanelListe, grupPanelSecimler, grupPanelTumSiniflar, grupPanelSec, grupPanelOzetCiz, grupPanelToggle }";
let P;
try {
  P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}

/* ---- Gerçek form DOM simülasyonu: id kayıt defteri; markup id'leri gerçekten kaydedilir ---- */
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

/* Gerçek DOM ile YENİDEN değerlendirme (tek boot garantisine yaklaşır) */
P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
const { DB, ui, planla, formaAktar, duzeltmeBul, dersOgrenciIds, renderFormDestek, grupPanelCiz, grupPanelSecimler, grupPanelTumSiniflar, grupPanelSec, grupPanelOzetCiz, grupPanelToggle } = P;

const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ayse = DB.ogrenciler.find(o => o.ad === "Ayşe Demir");
const zeynep = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya");
const emir = DB.ogrenciler.find(o => o.ad === "Emir Aydın");

function formTemizle() {
  ui.editId = null; ui.aktifIstekId = null; ui.ekOgrenciIds = [];
  ui.panelSecim = { acik: false, arama: "", sinif: "", anaId: null };
  for (const id of ["f-ogrenci", "f-ders", "f-konu", "f-ogretmen", "f-tarih", "f-saat"]) reg[id].value = "";
  reg["f-yoksay"].checked = false;
}

/* 1) Panel istekten planlamada DOM'da + DB'den sınıf filtresi */
console.log("1) İstekten planda panel DOM:");
const r1 = { id: "ik-r1", ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "mat", konu: "Limit ve Süreklilik", durum: "bekliyor", olusturma: "2026-09-01" };
DB.istekler.push(r1);
formTemizle();
formaAktar("ik-r1");
t("formaAktar çalıştı (aktifIstekId = istek)", ui.aktifIstekId === "ik-r1");
t("#ek-ogrenciler paneli DOM'a ekleniyor", !!reg["ek-ogrenciler"]);
t("panel temiz başladı (ekOgrenciIds boş)", Array.isArray(ui.ekOgrenciIds) && ui.ekOgrenciIds.length === 0);
const siniflar = grupPanelTumSiniflar();
t("sınıf filtresi DB'den otomatik", siniflar.includes("12 SAY 1") && siniflar.includes("MEZUN EA 1"));
grupPanelToggle();
t("panel açılınca arama + 'Tüm sınıflar' markup'ta", (reg["grup-panel-govde"] || { innerHTML: "" }).innerHTML.includes("grup-panel-arama") && reg["grup-panel-govde"].innerHTML.includes("Tüm sınıflar"));
grupPanelToggle();

/* 2) Sahip + 2 ek → TEK ders kaydı */
console.log("2) Sahip + 2 ek → tek kayıt:");
grupPanelSec(zeynep.id);
grupPanelSec(emir.id);
const nOnce = DB.dersler.length;
reg["f-ogrenci"].value = "Ayşe Demir"; reg["f-ders"].value = "mat"; reg["f-konu"].value = "Limit ve Süreklilik";
reg["f-ogretmen"].value = "SONER AÇIKGÖZ"; reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = true;
planla();
t("tek ders kaydı oluştu (+1, kopya yok)", DB.dersler.length === nOnce + 1, "önce=" + nOnce + " sonra=" + DB.dersler.length);
const grupKayit = DB.dersler[nOnce];

/* 3) ogrenciId = sahip, ogrenciIds = ekler, dersOgrenciIds tüm katılımcılar */
console.log("3) Kayıt alanları:");
t("ogrenciId = istek sahibi (Ayşe)", grupKayit.ogrenciId === ayse.id);
t("ogrenciAd = Ayşe Demir", grupKayit.ogrenciAd === "Ayşe Demir");
t("ogrenciIds = [Zeynep, Emir]", JSON.stringify(grupKayit.ogrenciIds) === JSON.stringify([zeynep.id, emir.id]), JSON.stringify(grupKayit.ogrenciIds));
t("dersOgrenciIds tüm katılımcılar (3)", JSON.stringify(dersOgrenciIds(grupKayit)) === JSON.stringify([ayse.id, zeynep.id, emir.id]));

/* 4) İstek kaydı değişmedi — yalnızca durum güncellendi */
console.log("4) İstek kaydı korunumu:");
t("istek kaydı tek ve bulunur (kopya/silme yok)", DB.istekler.filter(x => x.id === "ik-r1").length === 1);
const r1s = DB.istekler.find(x => x.id === "ik-r1");
t("istek id aynı", !!r1s && r1s.id === "ik-r1");
t("istek sahibi (ogrenciId) AYNEN", !!r1s && r1s.ogrenciId === ayse.id);
t("istek ogrenciAd/dersId/konu/olusturma AYNEN", !!r1s && r1s.ogrenciAd === "Ayşe Demir" && r1s.dersId === "mat" && r1s.konu === "Limit ve Süreklilik" && r1s.olusturma === "2026-09-01");
t("istek durumu 'planlandi'", !!r1s && r1s.durum === "planlandi");
t("ui.aktifIstekId temizlendi", ui.aktifIstekId === null);
DB.dersler = DB.dersler.filter(l => l !== grupKayit);
DB.istekler = []; formTemizle();

/* 5) Çakışan grup üyesinde İSİMLİ uyarı */
console.log("5) İsimli çakışma uyarısı:");
DB.dersler.push({ id: "caki-1", ogrenciId: emir.id, ogrenciAd: "Emir Aydın", dersId: "mat", konu: "Türev", ogretmenId: "t-x", ogretmenAd: "BAŞKA Ö", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" });
const uyarilar = duzeltmeBul({ ogrenciId: ayse.id, ogretmenId: "t-y", tarih: gelecekPzt, saat: "15:30", id: "" }, false, [zeynep.id, emir.id]);
t("uyarıda çakışan üyenin ADI var", uyarilar.some(m => m.includes("Emir Aydın")), JSON.stringify(uyarilar));
t("uyarıda 'ile dersi var' ifadesi var", uyarilar.some(m => m.includes("ile dersi var")));
const nOnce2 = DB.dersler.length;
reg["f-ogrenci"].value = "Ayşe Demir"; reg["f-ders"].value = "mat"; reg["f-ogretmen"].value = "SONER AÇIKGÖZ";
reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = false;
grupPanelSec(zeynep.id); grupPanelSec(emir.id);
planla();
t("çakışma yoksayılmadıkça kayıt OLUŞMAZ", DB.dersler.length === nOnce2);
DB.dersler = DB.dersler.filter(l => l.id !== "caki-1");
formTemizle();

/* 6) Tek öğrencili eski akış bozulmadı (havuzdan tekli planlama; 1 ek seçilmişse de birebir) */
console.log("6) Tekli eski akış:");
const r2 = { id: "ik-r2", ogrenciId: zeynep.id, ogrenciAd: zeynep.ad, dersId: "mat", konu: "Paragraf", durum: "bekliyor", olusturma: "2026-09-02" };
DB.istekler.push(r2);
formaAktar("ik-r2");
reg["f-ogrenci"].value = "Zeynep Kaya"; reg["f-ders"].value = "mat"; reg["f-konu"].value = "Paragraf";
reg["f-ogretmen"].value = "TAHSİN ASLAN"; reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = true;
const nOnce3 = DB.dersler.length;
planla();
const tekKayit = DB.dersler[nOnce3];
t("tekli kayıt oluştu", DB.dersler.length === nOnce3 + 1);
t("ogrenciIds YAZILMAZ (birebir)", tekKayit && !("ogrenciIds" in tekKayit));
t("ogrenciId = Zeynep", tekKayit && tekKayit.ogrenciId === zeynep.id);
t("istek durumu planlandı (tekli dal)", r2.durum === "planlandi");
const nOnce4 = DB.dersler.length;
grupPanelSec(zeynep.id); /* 1 ek — grup değil */
reg["f-ogrenci"].value = "Zeynep Kaya"; reg["f-ders"].value = "mat"; reg["f-ogretmen"].value = "TAHSİN ASLAN";
reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = true;
planla();
const birebir = DB.dersler[nOnce4];
t("1 ek seçiliyken hâlâ birebir (ogrenciIds yok)", DB.dersler.length === nOnce4 + 1 && birebir && !("ogrenciIds" in birebir));
DB.dersler = DB.dersler.filter(l => l !== tekKayit && l !== birebir);
DB.istekler = []; formTemizle();

/* 7) 10+ seçim engellenmiyor — yalnızca uyarı + tek kayıt */
console.log("7) 10+ seçim engellenmiyor:");
const t10 = [];
for (let i = 0; i < 10; i++) { const o = { id: "t10-" + i, ad: "Test10 Öğrenci " + i, sinif: "TEST 10", tel: "" }; DB.ogrenciler.push(o); t10.push(o); }
const r4 = { id: "ik-r4", ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "mat", konu: "Deneme", durum: "bekliyor", olusturma: "2026-09-03" };
DB.istekler.push(r4);
formTemizle();
formaAktar("ik-r4");
t10.forEach(o => grupPanelSec(o.id));
t("10 ek öğrenci seçilebildi (sınır yok)", grupPanelSecimler().length === 10);
grupPanelOzetCiz();
t("10+ uyarı kartı gösterildi (#grup-panel-uyari)", (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("grup-panel-uyari"));
t("özet '11 öğrenci seçildi' (sahip dahil)", (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("11 öğrenci seçildi"));
reg["f-ogrenci"].value = "Ayşe Demir"; reg["f-ders"].value = "mat"; reg["f-ogretmen"].value = "SONER AÇIKGÖZ";
reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = true;
const nOnce5 = DB.dersler.length;
planla();
const buyuk = DB.dersler[nOnce5];
t("ENGELLENMEDİ: tek kayıt oluştu", DB.dersler.length === nOnce5 + 1, "dersler=" + DB.dersler.length + " beklenen=" + (nOnce5 + 1));
t("kayıtta ogrenciIds 10 üye", buyuk && Array.isArray(buyuk.ogrenciIds) && buyuk.ogrenciIds.length === 10);
t("kayıt sahibi Ayşe", buyuk && buyuk.ogrenciId === ayse.id);
t("istek durumu planlandı (grup daldan)", r4.durum === "planlandi");
DB.ogrenciler = DB.ogrenciler.filter(o => !o.id.startsWith("t10-"));
DB.dersler = DB.dersler.filter(l => l !== buyuk);
DB.istekler = []; formTemizle();

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
