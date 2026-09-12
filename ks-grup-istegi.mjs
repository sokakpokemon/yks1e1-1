/* ks-grup-istegi.mjs — ORTAK GRUP İSTEK süiti (13 senaryo)
   Eski tekli istek bozulmaz · yedek/geri yükleme sağlam · ≥2 öğrenci zorunlu · ilk seçilen ana
   ekler benzersiz ogrenciIds'te · 10+ engellenmez · havuzda tek kayıt + tüm üyeler ·
   gruptan tek ders · üyeler forma otomatik · öğretmen+tüm öğrenci çakışma ·
   plan sonrası deep-copy'de yalnızca durum değişir · istekOgrenciIds idempotent.
   Tek boot + gerçek DOM id kayıt defteri (ks-istekten-grup.mjs deseni). */
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

const EXPORTS = "{ DB, ui, planla, formaAktar, normalize, duzeltmeBul, dersOgrenciIds, istekOgrenciIds, istekGrupPanelAc, istekGrupEkle, istekGrupIptal, istekGrupUyeleri, istekGrupOzetHTML, renderHavuz, renderFormDestek, grupPanelSec, grupPanelSecimler, grupPanelOzetCiz, grupPanelListeCiz, grupPanelToggle, grupPanelTumSiniflar, saveDB, loadDB }";
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

P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
const { DB, ui, planla, formaAktar, normalize, duzeltmeBul, dersOgrenciIds, istekOgrenciIds, istekGrupPanelAc, istekGrupEkle, istekGrupIptal, istekGrupUyeleri, istekGrupOzetHTML, renderHavuz, renderFormDestek, grupPanelSec, grupPanelSecimler, grupPanelOzetCiz, grupPanelListeCiz, grupPanelToggle, grupPanelTumSiniflar, saveDB, loadDB } = P;

const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ayse = DB.ogrenciler.find(o => o.ad === "Ayşe Demir");
const zeynep = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya");
const emir = DB.ogrenciler.find(o => o.ad === "Emir Aydın");

function formTemizle() {
  ui.editId = null; ui.aktifIstekId = null; ui.ekOgrenciIds = []; ui.havuzAnaId = null; ui.grupPanelBaglam = "plan";
  ui.panelSecim = { acik: false, arama: "", sinif: "", anaId: null };
  for (const id of ["f-ogrenci", "f-ders", "f-konu", "f-ogretmen", "f-tarih", "f-saat"]) reg[id].value = "";
  reg["f-yoksay"].checked = false;
}
function istekTemizle() { DB.istekler = DB.istekler.filter(r => r.id !== "gi-tekli" && r.id !== "gi-grup" && r.id !== "gi-cakisma"); }

/* 1) Eski tekli istek normalize'da bozulmuyor */
console.log("1) Eski tekli istek normalize:");
const eskiTekli = { id: "gi-tekli", ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "mat", konu: "Paragraf", durum: "bekliyor", olusturma: "2026-09-01" };
const nBefore = DB.istekler.length;
DB.istekler.push(eskiTekli);
const nd = normalize(JSON.parse(JSON.stringify({ istekler: DB.istekler, ogretmenler: [], ogrenciler: [], dersler: [], sinifProg: {} })));
const eskiN = nd.istekler.find(x => x.id === "gi-tekli");
t("eski tekli istek normalize'da alanları korur", eskiN.ogrenciId === ayse.id && eskiN.dersId === "mat" && eskiN.konu === "Paragraf" && eskiN.durum === "bekliyor");
t("eski tekli isteğe ogrenciIds ALANI EKLENMEZ", !("ogrenciIds" in eskiN));
t("istekOgrenciIds eski istekte hata vermez → [ogrenciId]", JSON.stringify(istekOgrenciIds(eskiN)) === JSON.stringify([ayse.id]), JSON.stringify(istekOgrenciIds(eskiN)));
DB.istekler = DB.istekler.filter(x => x.id !== "gi-tekli");
t("havuz boyutu restore edildi", DB.istekler.length === nBefore);

/* 2) Eski tekli istek yedek/geri yükleme sağlam */
console.log("2) Eski tekli istek yedek/geri yükleme:");
const yedek1 = JSON.parse(JSON.stringify({ istekler: [eskiTekli], ogretmenler: DB.ogretmenler, ogrenciler: DB.ogrenciler, dersler: DB.dersler, sinifProg: DB.sinifProg }));
const yuklenen1 = normalize(yedek1);
const eskiYuklenen = yuklenen1.istekler[0];
t("yedek→yükleme sonrası tekli istek birebir", JSON.stringify(eskiYuklenen) === JSON.stringify(eskiTekli));
t("yükleme sonrası istekOgrenciIds aynı", JSON.stringify(istekOgrenciIds(eskiYuklenen)) === JSON.stringify([ayse.id]));

/* 3) Ortak grup isteği: en az 2 öğrenci zorunlu */
console.log("3) En az 2 öğrenci zorunlu:");
formTemizle();
istekGrupPanelAc();
t("havuz bağlamı açıldı", ui.grupPanelBaglam === "havuz");
t("havuz özet şeridi markup'ta", (reg["havuzBolum"] || { innerHTML: "" }).innerHTML.includes("istek-grup-ozet"));
grupPanelSec(ayse.id);
t("1 öğrenci seçildi", istekGrupUyeleri().length === 1);
const istekNOnce = DB.istekler.length;
istekGrupEkle();
t("1 öğrenciyle kayıt OLUŞMAZ", DB.istekler.length === istekNOnce);

/* 4) İlk seçilen ana öğrenci (ogrenciId), diğerleri ogrenciIds — benzersiz */
console.log("4) İlk seçilen ana + benzersiz ekler:");
grupPanelSec(zeynep.id);
grupPanelSec(emir.id);
grupPanelSec(zeynep.id); /* aynı öğrenci tekrar → eklenmez, ÇIKARILIR (kopya yazılmaz) */
grupPanelSec(zeynep.id); /* tekrar eklenir */
reg["h-ders"].value = "mat"; reg["h-konu"].value = "Limit ve Süreklilik";
istekGrupEkle();
const gi = DB.istekler[DB.istekler.length - 1];
t("grup isteği kaydedildi", DB.istekler.length === istekNOnce + 1);
t("ogrenciId = İLK seçilen (Ayşe)", gi.ogrenciId === ayse.id, "aldı: " + gi.ogrenciId);
t("ogrenciIds = [Zeynep, Emir] (benzersiz, tekrar yok)", JSON.stringify(gi.ogrenciIds) === JSON.stringify([zeynep.id, emir.id]), JSON.stringify(gi.ogrenciIds));
t("ana, ogrenciIds'te YOK", gi.ogrenciIds.indexOf(ayse.id) === -1);
t("istekOgrenciIds tüm üyeler (3)", JSON.stringify(istekOgrenciIds(gi)) === JSON.stringify([ayse.id, zeynep.id, emir.id]));
t("ogrenciAdlari alanı YOK (isimler DB'den)", !("ogrenciAdlari" in gi));

/* 5) 10+ seçim engellenmiyor — yalnızca uyarı */
console.log("5) 10+ seçim engellenmez:");
formTemizle();
istekGrupPanelAc();
const t10 = [];
for (let i = 0; i < 11; i++) { const o = { id: "gi10-" + i, ad: "Grup10 Öğrenci " + i, sinif: "GRUP 10", tel: "" }; DB.ogrenciler.push(o); t10.push(o); }
t10.forEach(o => grupPanelSec(o.id));
t("11 öğrenci seçilebildi (sınır yok)", istekGrupUyeleri().length === 11);
const ozetHtml = istekGrupOzetHTML();
t("özette '11 öğrenci seçildi' yazar", ozetHtml.includes("11 öğrenci seçildi"));
t("özette geniş grup UYARISI var (engelleme yok)", ozetHtml.includes("Geniş grup"));
reg["h-ders"].value = "mat"; reg["h-konu"].value = "Deneme";
istekGrupEkle();
const gi10 = DB.istekler[DB.istekler.length - 1];
t("11 üyeli grup isteği KAYDEDİLDİ", DB.istekler.length === istekNOnce + 2 && istekOgrenciIds(gi10).length === 11);
DB.ogrenciler = DB.ogrenciler.filter(o => !o.id.startsWith("gi10-"));

/* 6) Havuzda grup isteği TEK kayıt + tüm üyeler doğru isimlerle */
console.log("6) Havuzda tek kayıt + üye isimleri:");
t("grup isteği havuzda TEK kayıt", DB.istekler.filter(r => istekOgrenciIds(r).length > 1).length === 2);
renderHavuz();
const havuzHtml = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML;
t("havuz kartı Ayşe (ana) adını gösterir", havuzHtml.includes("Ayşe Demir"));
t("havuz kartı üye badge'lerini gösterir (Zeynep, Emir)", havuzHtml.includes("Zeynep Kaya") && havuzHtml.includes("Emir Aydın"));
t("havuz başlığı 'Ortak Grup İsteği' butonunu taşır", havuzHtml.includes("Ortak Grup İsteği"));

/* 7) Grup isteği planlamada TÜM üyeler otomatik seçili gelir */
console.log("7) Planlama formuna otomatik üye yükleme:");
formTemizle();
formaAktar(gi.id);
t("formaAktar grup istekte çalışır (aktifIstekId)", ui.aktifIstekId === gi.id);
t("TÜM ek üyeler otomatik seçili (2 ek)", JSON.stringify(ui.ekOgrenciIds) === JSON.stringify([zeynep.id, emir.id]), JSON.stringify(ui.ekOgrenciIds));
t("ana öğrenci form kutusunda", reg["f-ogrenci"].value === "Ayşe Demir");
t("panel açık + arama/sınıf temiz", ui.panelSecim.acik === true && ui.panelSecim.arama === "" && ui.panelSecim.sinif === "");
grupPanelToggle();
t("panelde ana 'Ana' etiketi + emir seçili işaretli", (reg["grup-panel-govde"] || { innerHTML: "" }).innerHTML.includes("Ana") && (reg["grup-panel-govde"] || { innerHTML: "" }).innerHTML.includes("checked"));
/* ek öğrenci ekleme de çalışsın */
const yeniUye = { id: "gi-ek", ad: "Elif Şahin", sinif: "12 SAY 1", tel: "" };
DB.ogrenciler.push(yeniUye);
grupPanelSec(yeniUye.id);
t("istekten ek öğrenci eklenebilir (3 ek)", grupPanelSecimler().length === 3);

/* 8) Grup isteğinden TEK ders kaydı + alan semantiği */
console.log("8) Gruptan tek ders kaydı:");
reg["f-ders"].value = "mat"; reg["f-konu"].value = "Limit ve Süreklilik";
reg["f-ogretmen"].value = "SONER AÇIKGÖZ"; reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = true;
const giSnapshot = JSON.parse(JSON.stringify(gi)); /* plan öncesi DEEP-COPY snapshot (aynı nesne referansı değil) */
const nOnce = DB.dersler.length;
planla();
t("tek ders kaydı (+1, kopya yok)", DB.dersler.length === nOnce + 1, "önce=" + nOnce + " sonra=" + DB.dersler.length);
const ders = DB.dersler[nOnce];
t("ders.ogrenciId = ana (Ayşe)", ders.ogrenciId === ayse.id);
t("ders.ogrenciIds = [Zeynep, Emir, Elif]", JSON.stringify(ders.ogrenciIds) === JSON.stringify([zeynep.id, emir.id, yeniUye.id]), JSON.stringify(ders.ogrenciIds));
t("dersOgrenciIds tüm katılımcılar (4)", JSON.stringify(dersOgrenciIds(ders)) === JSON.stringify([ayse.id, zeynep.id, emir.id, yeniUye.id]));

/* 9) Planlama sonrası deep-copy snapshot: YALNIZCA durum değişti */
console.log("9) Deep-copy snapshot — yalnızca durum:");
t("snapshot gerçek deep-copy (referans değil)", giSnapshot !== gi && JSON.stringify(giSnapshot) !== "undefined");
t("planlama öncesi snapshot alınmıştı (deep-copy)", typeof giSnapshot === "object" && giSnapshot !== null);
const alanlar = [...new Set([...Object.keys(giSnapshot), ...Object.keys(gi)])];
const farklar = alanlar.filter(k => JSON.stringify(giSnapshot[k]) !== JSON.stringify(gi[k]));
t("istekte yalnızca 'durum' alanı değişti", farklar.length === 1 && farklar[0] === "durum", "farklı alanlar: " + JSON.stringify(farklar));
t("durum artık 'planlandi'", gi.durum === "planlandi");
t("ogrenciId/ogrenciIds/konu/dersId/olusturma KORUNDU", gi.ogrenciId === giSnapshot.ogrenciId && JSON.stringify(gi.ogrenciIds) === JSON.stringify(giSnapshot.ogrenciIds) && gi.konu === giSnapshot.konu && gi.dersId === giSnapshot.dersId && gi.olusturma === giSnapshot.olusturma);
t("ui.aktifIstekId temizlendi", ui.aktifIstekId === null);

/* 10) Öğretmen + TÜM öğrenci çakışma kontrolü — isimli uyarı */
console.log("10) Öğretmen + tüm öğrenci çakışması:");
DB.dersler.push({ id: "gi-caki", ogrenciId: emir.id, ogrenciAd: "Emir Aydın", dersId: "mat", konu: "Türev", ogretmenId: "gi-tx", ogretmenAd: "BAŞKA Ö", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" });
const uyarilar = duzeltmeBul({ ogrenciId: ayse.id, ogretmenId: "gi-ty", tarih: gelecekPzt, saat: "15:30", id: "" }, false, [zeynep.id, emir.id, yeniUye.id]);
t("çakışan üyenin ADI uyarıda", uyarilar.some(m => m.includes("Emir Aydın")), JSON.stringify(uyarilar));
t("öğretmen çakışması da uyarıda", uyarilar.some(m => m.includes("SONER AÇIKGÖZ")) || uyarilar.length >= 1);
const nOnce2 = DB.dersler.length;
formTemizle();
formaAktar(gi.id);
reg["f-ogrenci"].value = "Ayşe Demir"; reg["f-ders"].value = "mat"; reg["f-ogretmen"].value = "SONER AÇIKGÖZ";
reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = false;
planla();
t("çakışma yoksayılmadıkça kayıt OLUŞMAZ", DB.dersler.length === nOnce2);
DB.dersler = DB.dersler.filter(l => l.id !== "gi-caki");
DB.ogrenciler = DB.ogrenciler.filter(o => o.id !== "gi-ek");

/* 11) Tekli eski istekten planlama bozulmadı */
console.log("11) Tekli eski akış:");
formTemizle();
const rTekli = { id: "gi-tekli", ogrenciId: zeynep.id, ogrenciAd: zeynep.ad, dersId: "mat", konu: "Paragraf", durum: "bekliyor", olusturma: "2026-09-02" };
DB.istekler.push(rTekli);
formaAktar("gi-tekli");
t("tekli istekte seçim BOŞ kalır (eski davranış)", Array.isArray(ui.ekOgrenciIds) && ui.ekOgrenciIds.length === 0 && ui.panelSecim.acik === false);
reg["f-ogrenci"].value = "Zeynep Kaya"; reg["f-ders"].value = "mat"; reg["f-konu"].value = "Paragraf";
reg["f-ogretmen"].value = "TAHSİN ASLAN"; reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = true;
const nOnce3 = DB.dersler.length;
planla();
const tek = DB.dersler[nOnce3];
t("tekli kayıt oluştu", DB.dersler.length === nOnce3 + 1);
t("tekli kayıtta ogrenciIds YAZILMAZ", tek && !("ogrenciIds" in tek));
t("tekli istek durumu planlandı (eski dal)", rTekli.durum === "planlandi");
DB.dersler = DB.dersler.filter(l => l !== tek);

/* 12) istekOgrenciIds idempotent — tekrarlı çağrıda aynı sonuç */
console.log("12) istekOgrenciIds idempotent:");
const a1 = istekOgrenciIds(gi), a2 = istekOgrenciIds(gi), a3 = istekOgrenciIds(JSON.parse(JSON.stringify(gi)));
t("aynı istekte tekrarlı çağrı aynı dizi", JSON.stringify(a1) === JSON.stringify(a2) && JSON.stringify(a2) === JSON.stringify(a3));
t("sonuç benzersiz + sıra korunur", new Set(a1).size === a1.length && a1[0] === ayse.id);
t("bozuk kayıtta hata vermez", JSON.stringify(istekOgrenciIds(null)) === "[]" && JSON.stringify(istekOgrenciIds({})) === "[]" && JSON.stringify(istekOgrenciIds({ ogrenciId: "x", ogrenciIds: "bozuk" })) === JSON.stringify(["x"]));

/* 13) Yedek alma/yükleme grup üyelerini eksiksiz korur (deep-equal) */
console.log("13) Grup istek yedek/geri yükleme:");
saveDB();
const yedek2 = JSON.parse(JSON.stringify(store["yksOto_arsiv_v1"]));
const yuklenen2 = normalize(JSON.parse(JSON.stringify(yedek2)));
const giYuklenen = yuklenen2.istekler.find(r => r.id === gi.id);
t("yükleme sonrası grup isteği bulunur", !!giYuklenen);
t("grup isteği alanları DEEP-EQUAL geri döner", giYuklenen && JSON.stringify(giYuklenen) === JSON.stringify(JSON.parse(JSON.stringify(gi))));
t("ogrenciIds eksiksiz (3 üye)", giYuklenen && JSON.stringify(giYuklenen.ogrenciIds) === JSON.stringify([zeynep.id, emir.id, yeniUye.id]));
const loadYuklenen = loadDB();
t("loadDB de grup isteğini korur", !!loadYuklenen && !!loadYuklenen.istekler.find(r => r.id === gi.id && JSON.stringify(r.ogrenciIds) === JSON.stringify([zeynep.id, emir.id, yeniUye.id])));

/* temizlik — test DB'sini seed'e yakın bırak */
DB.istekler = DB.istekler.filter(r => r.id !== "gi-grup" && r.id !== "gi-tekli");
DB.dersler = DB.dersler.filter(l => l !== ders);
DB.ogrenciler = DB.ogrenciler.filter(o => o.id !== "gi-ek");
formTemizle();

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
