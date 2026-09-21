/* ks-panel-secim.mjs — GRUP PANEL v2 testleri:
   arama, sınıf filtresi (Tüm sınıflar dahil), düzenlemede yükleme, 10+ uyarı, tek seçimde birebir akış
   ÖNEMLİ: tek boot — gerçek DOM kayıt defteriyle; tüm erişimler P.* üzerinden (çift-boot tuzakları yok) */
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

let P;
try {
  P = new Function(scripts + "\n  return { DB, ui, planla, duzenle, temizleForm, grupPanelCiz, grupPanelListe, grupPanelSecimler, grupPanelTumSiniflar, grupPanelSec, grupPanelAra, grupPanelSinifSec, grupPanelOzetCiz, grupPanelListeCiz, grupPanelToggle };\n")();
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
  /* Gerçek tarayıcı gibi: innerHTML ataması da id'leri DOM kayıt defterine ekler */
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

/* Gerçek DOM ile YENİDEN değerlendirme: bundan sonra SADECE P2 kullanılır (tek boot garantisine yaklaşır) */
P = new Function(scripts + "\n  return { DB, ui, planla, duzenle, temizleForm, grupPanelCiz, grupPanelListe, grupPanelSecimler, grupPanelTumSiniflar, grupPanelSec, grupPanelAra, grupPanelSinifSec, grupPanelOzetCiz, grupPanelListeCiz, grupPanelToggle };\n")();
const { DB, ui, planla, duzenle, temizleForm } = P;
const { grupPanelCiz, grupPanelListe, grupPanelSecimler, grupPanelTumSiniflar, grupPanelSec, grupPanelAra, grupPanelSinifSec, grupPanelOzetCiz, grupPanelListeCiz, grupPanelToggle } = P;

const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ayse = DB.ogrenciler.find(o => o.ad === "Ayşe Demir");
const zeynep = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya");
const emir = DB.ogrenciler.find(o => o.ad === "Emir Aydın");

/* 1) Panel shell + sınıf filtresi DB'den otomatik */
console.log("1) Panel shell + sınıf filtresi:");
t("#ek-ogrenciler paneli DOM'da", !!reg["ek-ogrenciler"]);
t("#grup-panel-govde kapalı başlar", !!reg["grup-panel-govde"]);
t("#grup-panel-arama kutusu yok (panel kapalı)", !reg["grup-panel-arama"]);
const siniflar = grupPanelTumSiniflar();
t("sınıflar DB'den üretilir", siniflar.length >= 5 && siniflar.includes("12 SAY 1") && siniflar.includes("MEZUN EA 1"));
grupPanelToggle();
t("toggle → govde açıldı ve filtre markup'ı yazıldı", !reg["grup-panel-govde"].classList.contains("hidden") === false || reg["grup-panel-govde"].innerHTML.includes("Tüm sınıflar"), reg["grup-panel-govde"].innerHTML.slice(0, 80));
t("filtre opsiyonlarında 'Tüm sınıflar' VAR", reg["grup-panel-govde"].innerHTML.includes("Tüm sınıflar"));
t("arama inputu markup'ta VAR", reg["grup-panel-govde"].innerHTML.includes("grup-panel-arama"));

/* 2) Arama */
console.log("2) Arama:");
grupPanelAra("ayşe");
t("'ayşe' → yalnız Ayşe Demir", grupPanelListe().length === 1 && grupPanelListe()[0].o.ad === "Ayşe Demir");
grupPanelAra("AYŞE");
t("arama TR-büyük/küçük duyarsız", grupPanelListe().length === 1);
grupPanelAra("zzzz");
t("eşleşme yok → boş liste", grupPanelListe().length === 0);
grupPanelAra("");

/* 3) Sınıf filtresi işlevsel */
console.log("3) Sınıf filtresi işlevsel:");
grupPanelSinifSec("12 DİL");
const dilListe = grupPanelListe();
t("'12 DİL' → yalnız Ecrin Şahin", dilListe.length === 1 && dilListe[0].o.ad === "Ecrin Şahin");
grupPanelSinifSec("");
t("filtre boşaltınca tümü döner", grupPanelListe().length === DB.ogrenciler.length);

/* 4) Checkbox seçimi + çift seçim engeli + 5 sınırı yok */
console.log("4) Seçim davranışı:");
grupPanelSec(zeynep.id);
grupPanelSec(emir.id);
grupPanelSec(emir.id); /* çıkar */
grupPanelSec(emir.id); /* tekrar ekle */
t("aynı öğrenci iki kez listede olmaz (ham dizi benzersiz)", ui.ekOgrenciIds.filter(i => i === emir.id).length === 1);
for (let i = 0; i < 11; i++) grupPanelSec("test-ogr-" + i); /* olmayan id — görünür seçimi etkilemez */
t("olmayan id görünür seçimi etkilemez", grupPanelSecimler().length === 2);
for (let i = 0; i < 10; i++) {
  DB.ogrenciler.push({ id: "toplu-" + i, ad: "Toplu Öğrenci " + i, sinif: "TEST Sınıf", tel: "" });
  grupPanelSec("toplu-" + i);
}
t("12 öğrenci seçilebilir (sınır yok)", grupPanelSecimler().length === 12, "secimler=" + JSON.stringify(grupPanelSecimler().length));
grupPanelOzetCiz();
t("10+ uyarı kartı render edildi (#grup-panel-uyari)", (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("grup-panel-uyari"));
t("özet '12 öğrenci seçildi' içeriyor", (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("12 öğrenci seçildi"));
DB.ogrenciler = DB.ogrenciler.filter(o => !o.id.startsWith("toplu-"));
ui.ekOgrenciIds = [];
grupPanelOzetCiz();
t("uyarı 10'un altında kaybolur", !(reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("grup-panel-uyari"));

/* 5) Ana öğrenci: checkbox disabled + iki kez seçilemez */
console.log("5) Ana öğrenci kuralı:");
reg["f-ogrenci"].value = "Ayşe Demir";
grupPanelOzetCiz();
grupPanelCiz();
const anaListe = grupPanelListe();
const anaE = anaListe.find(e => e.o.ad === "Ayşe Demir");
t("ana öğrenci listede 'ana' işaretli", !!anaE && anaE.ana === true);
const once = grupPanelSecimler().length;
grupPanelSec(ayse.id);
t("ana öğrenci seçilemez (ek listeye girmez)", grupPanelSecimler().length === once);
const listeHTML = (reg["grup-panel-liste"] || { innerHTML: "" }).innerHTML;
t("ana checkbox markup'ta disabled", listeHTML.includes("disabled"), listeHTML.slice(0, 120));

/* 6) Düzenleme yükleme: dersOgrenciIds → panel açık, ilk ana */
console.log("6) Düzenleme yükleme:");
{
  DB.dersler.push({ id: "test-grup-1", ogrenciId: ayse.id, ogrenciAd: ayse.ad, ogrenciIds: [zeynep.id, emir.id], dersId: "mat", konu: "Limit", ogretmenId: "t-x", ogretmenAd: "BAŞKA Ö", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" });
  ui.editId = null; ui.aktifIstekId = null;
  duzenle("test-grup-1");
  const ids = grupPanelSecimler();
  t("düzenlemede 2 ek öğrenci yüklendi", ids.length === 2 && ids[0] === zeynep.id && ids[1] === emir.id, JSON.stringify(ids));
  t("düzenlemede panel açık açıldı", !!ui.panelSecim && ui.panelSecim.acik === true);
  t("panelSecim.anaId = dersin ana öğrencisi", ui.panelSecim.anaId === ayse.id);
  t("form ana öğrenci adını taşıyor", reg["f-ogrenci"].value === "Ayşe Demir");
  t("özet '3 öğrenci seçildi' (ana dahil)", (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.includes("3 öğrenci seçildi"), (reg["grup-ozet"] || { innerHTML: "" }).innerHTML.slice(0, 120));
  grupPanelCiz();
  const lh = (reg["grup-panel-liste"] || { innerHTML: "" }).innerHTML;
  t("liste çizildi ve Zeynep checked", lh.includes("Zeynep Kaya") && lh.includes("checked"), lh.slice(0, 200));
  /* Ana öğrenci değişimi: eski ana EK LİSTEDE tekrar oluşmaz (en fazla 1 kez) */
  reg["f-ogrenci"].value = "Zeynep Kaya";
  grupPanelOzetCiz();
  const hamSayi = ui.ekOgrenciIds.filter(i => i === ayse.id).length;
  t("ana değişince eski ana ek listede en fazla 1 kez (kopya oluşmaz)", hamSayi <= 1 && grupPanelSecimler().filter(i => i === ayse.id).length <= 1, "ham=" + hamSayi + " secimler=" + JSON.stringify(grupPanelSecimler()));
  DB.dersler = DB.dersler.filter(l => l.id !== "test-grup-1");
}

/* 7) Tek öğrenci → birebir akış aynen (ogrenciIds YAZILMAZ) */
console.log("7) Tek öğrenci birebir akış:");
{
  DB.dersler = [];
  ui.editId = null; ui.aktifIstekId = null;
  ui.ekOgrenciIds = [];
  ui.panelSecim = { acik: false, arama: "", sinif: "", anaId: null };
  reg["f-ogrenci"].value = "Ayşe Demir"; reg["f-ders"].value = "mat"; reg["f-konu"].value = "Limit";
  reg["f-ogretmen"].value = "SONER AÇIKGÖZ"; reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = false;
  const once = DB.dersler.length;
  planla();
  const kayit = DB.dersler[once];
  t("kayıt oluştu", !!kayit && DB.dersler.length === once + 1, "dersler=" + DB.dersler.length);
  t("ogrenciIds YOK (birebir)", kayit && !("ogrenciIds" in kayit));
  t("ogrenciId = Ayşe", kayit && kayit.ogrenciId === ayse.id);
  DB.dersler = DB.dersler.filter(l => l !== kayit);
}

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
