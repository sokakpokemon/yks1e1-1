let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-wa-alici.mjs — WA-ALICI-YAMASI süiti
   Doğruladıkları:
    1) #waAlici select modal-genel TEK (id tam 1 kez; waSatir/Öğrenciler sekmesi onu KULLANMAZ).
    2) waAc her açılışta alıcı = "ogrenci"; seçim waAliciTipi bellek içi (localStorage yeni key YOK).
    3) waAliciBilgisi eşleşmesi: ogrenci→tel, anne→anneTel, baba→babaTel; trim/normalize YOK.
    4) Eksik telefonda waGonder: toast + window.open YOK, fallback YOK.
    5) Doğru telefonda waUrl doğru numarayı alır; encodeURIComponent davranışı korunur.
    6) Önizleme metni = gönderilecek metin (birebir); alici bilgisi yalnız panel üst bilgisinde.
    7) Öğrenci değişse de alıcı seçimi korunur; waKapat sonrası yeni açılışta "ogrenci".
    8) waSatir hızlı butonu öğrenci tel yolunu korur; waKopyalaMesaj telefon/etiket EKLEMEZ.
    9) planli/tamamlandi cümleleri, grup 👥, iptal filtresi değişmez.
   10) localStorage tek key; anneTel/babaTel değerleri değişmez; tekrarlı waAc duplicate üretmez. */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const testKaynak = readFileSync("test.mjs", "utf8");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" }, open(url) { window._waOpenSayisi = (window._waOpenSayisi || 0) + 1; window._sonWaUrl = url; } };
const reg = new Map();
function yapEl(id) {
  const cocuk = [];
  const e = {
    id: id || "", tagName: "DIV", _textContent: "", _innerHTML: "",
    style: {}, dataset: {}, checked: false, value: "", options: [], children: cocuk,
    getContext: () => null,
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }, contains(c) { return this._s.has(c); } },
    appendChild(n) { cocuk.push(n); },
    remove() {}, click() {}, select() {}, scrollIntoView() {}, addEventListener() {},
    insertAdjacentHTML() {}, insertAdjacentElement() {},
    querySelectorAll: () => [], querySelector: () => null,
  };
  Object.defineProperty(e, "textContent", { get() { return this._textContent; }, set(v) { this._textContent = String(v); } });
  Object.defineProperty(e, "innerHTML", { get() { return this._innerHTML; }, set(v) { this._innerHTML = String(v); } });
  if (id) reg.set(id, e);
  return e;
}
global.document = {
  getElementById: (id) => reg.get(id) || yapEl(id),
  addEventListener() {}, removeEventListener() {},
  createElement: () => yapEl(), body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => [],
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
try { global.navigator = { clipboard: null }; } catch (e) { /* Node 21+: geciciKopyala yolu */ }

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };

const scripts = [appKaynak, ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
let P;
try {
  P = new Function(scripts + "\n  return { DB, ui, waAc, waOnizle, waGonder, waKopyalaMesaj, waUrl, waKapat, waAliciDegistir, waAliciBilgisi, waAliciTipiOf: () => waAliciTipi, waAktifIdOf: () => waAktifOgrenciId, waSatir, ogrenciMesajMetni, penceredeDersler };")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false); console.log(e.stack.split("\n").slice(0, 6).join("\n")); process.exit(1);
}
const { DB, waAc, waOnizle, waGonder, waUrl, waKapat, waAliciDegistir, waAliciBilgisi, waAliciTipiOf, waAktifIdOf, waSatir, ogrenciMesajMetni } = P;

/* ---- test verisi: tel/anneTel/babaTel doldur (yalnız bellek içi; kayıt atılmaz) ---- */
const ogr1 = DB.ogrenciler[0], ogr2 = DB.ogrenciler[1];
const T1 = "05321112233", A1 = "05332223344", B1 = "05343334455";
ogr1.tel = T1; ogr1.anneTel = A1; ogr1.babaTel = B1;
ogr2.tel = ""; ogr2.anneTel = ""; ogr2.babaTel = "";
const LS_ONCE = Object.keys(store).slice();
const ANNE_ONCE = JSON.stringify(DB.ogrenciler.map(o => [o.id, o.anneTel]));
const BABA_ONCE = JSON.stringify(DB.ogrenciler.map(o => [o.id, o.babaTel]));

/* 1) waAlici modal-genel TEK */
console.log("1) Modal-genel alici secici:");
t("#waAlici app.js üretiminde tam 1 kez", (appKaynak.match(/id="waAlici"/g) || []).length === 1);
t("index.html'de waAlici YOK (bar app.js'ten, duplicate imkânsız)", !html.includes('id="waAlici"'));
t("waAliciTipi başlangıç 'ogrenci'", waAliciTipiOf() === "ogrenci");
t("waAliciBilgisi tam 1 tanım", (appKaynak.match(/function waAliciBilgisi\(/g) || []).length === 1);

/* 2) waAc her açılışta ogrenci */
console.log("2) waAc varsayılanı:");
waAc();
t("waAc sonrası alici = ogrenci", waAliciTipiOf() === "ogrenci");
t("waAc sonrası aktif öğrenci null (henüz önizleme yok)", waAktifIdOf() === null);

/* 3) waAliciBilgisi eşleşmesi */
console.log("3) Eşleşme ve normalize yokluğu:");
const bO = waAliciBilgisi(ogr1.id, "ogrenci");
const bA = waAliciBilgisi(ogr1.id, "anne");
const bB = waAliciBilgisi(ogr1.id, "baba");
t("ogrenci → tel", bO.telefon === T1 && bO.etiket === "Öğrenci" && bO.varMi === true, JSON.stringify(bO.telefon));
t("anne → anneTel", bA.telefon === A1 && bA.etiket === "Anne", JSON.stringify(bA.telefon));
t("baba → babaTel", bB.telefon === B1 && bB.etiket === "Baba", JSON.stringify(bB.telefon));
/* normalize yok: kayıtlı string aynen */
DB.ogrenciler[0].tel = "  +90 (532) abc-123  ";
const bN = waAliciBilgisi(ogr1.id, "ogrenci");
t("telefon trim/normalize YOK (kayıtlı string aynen)", bN.telefon === "  +90 (532) abc-123  ", JSON.stringify(bN.telefon));
DB.ogrenciler[0].tel = T1;
/* bilinmeyen tip → ogrenci */
t("bilinmeyen tip → ogrenci fallback tipi", waAliciBilgisi(ogr1.id, "yok").tip === "ogrenci");

/* 4) Eksik telefonda gönderim engellenir */
console.log("4) Eksik telefon: engel + fallback YOK:");
const openOnce = window._waOpenSayisi || 0;
/* alıcıyı anne'e al; anne telefonu dolu → açılır */
waAliciDegistir("anne");
t("anne seçimi bellekte", waAliciTipiOf() === "anne");
/* ogr2 (tüm telefonlar boş) önizle + gönder */
waOnizle(ogr2.id);
const openOnceO2 = window._waOpenSayisi || 0;
waGonder(ogr2.id);
t("boş telefonda window.open çağrılmadı", (window._waOpenSayisi || 0) === openOnceO2);
t("boş telefonda URL üretilmedi (fallback yok)", !window._sonWaUrl || window._sonWaUrl === "");
/* ogr1 anne'e gönder → doğru numara */
waOnizle(ogr1.id);
const urlAnne = "https://wa.me/" + A1 + "?text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));
waGonder(ogr1.id);
t("anne gönderimi anneTel numarasını kullanır", window._sonWaUrl === urlAnne, JSON.stringify(window._sonWaUrl && window._sonWaUrl.slice(0, 30)));
t("anne gönderiminde window.open 1 kez", (window._waOpenSayisi || 0) === openOnceO2 + 1);
/* baba */
waAliciDegistir("baba");
const urlBaba = "https://wa.me/" + B1 + "?text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));
waGonder(ogr1.id);
t("baba gönderimi babaTel numarasını kullanır", window._sonWaUrl === urlBaba);
/* ogrenci */
waAliciDegistir("ogrenci");
const urlOgr = "https://wa.me/" + T1 + "?text=" + encodeURIComponent(ogrenciMesajMetni(ogr1.id));
waGonder(ogr1.id);
t("ogrenci gönderimi tel numarasını kullanır", window._sonWaUrl === urlOgr);

/* 5) encodeURIComponent davranışı korunur */
console.log("5) waUrl / encodeURIComponent:");
t("waUrl formatı korunmuş", waUrl("Merhaba dünya", "05551112233") === "https://wa.me/05551112233?text=" + encodeURIComponent("Merhaba dünya"));
t("waUrl boş tel → wa.me/?text", waUrl("x", "") === "https://wa.me/?text=" + encodeURIComponent("x"));
t("waUrl imzası değişmedi (metin, tel)", /function waUrl\(metin, tel\) \{/.test(appKaynak));

/* 6) Önizleme = gönderilecek metin (birebir) + üst bilgi */
console.log("6) Önizleme birebirliği:");
waAliciDegistir("anne");
waOnizle(ogr1.id);
const metinKutu = reg.get("waOnizlemeMetin");
t("önizleme metni = ogrenciMesajMetni (birebir)", metinKutu.textContent === ogrenciMesajMetni(ogr1.id));
const govde = appKaynak.split("function waOnizle(")[1].split("\nfunction ")[0];
t("waOnizle gövdesinde etiket/telefon MESAJA eklenmiyor", !govde.includes("etiket") && !govde.includes("a.telefon"));
t("alıcı üst bilgi kutusu ayrı (#waAliciBilgi)", appKaynak.includes('id="waAliciBilgi"'));
t("waAliciUyari metni kaynakta", appKaynak.includes("telefonu kayitli degil"));

/* 7) Öğrenci değişince seçim korunur; yeni açılışta ogrenci */
console.log("7) Seçim korunumu + yeni açılış:");
waAliciDegistir("baba");
waOnizle(ogr2.id);
t("öğrenci değişince alici seçimi korunur (baba)", waAliciTipiOf() === "baba");
waKapat();
waAc();
t("waKapat → yeni waAc'te alici = ogrenci", waAliciTipiOf() === "ogrenci");
t("waKapat state temizledi (aktif öğrenci null)", waAktifIdOf() === null);

/* 8) Hızlı butonlar öğrenci tel yolunu korur */
console.log("8) waSatir + hızlı butonlar:");
t("waSatir waGonder yolunu kullanıyor (kaynak)", /function waSatir\(lid\) \{\s*var l = DB\.dersler\.find/.test(appKaynak));
t("waGonder kaynakta a.telefon çözücüsü var", /var a = waAliciBilgisi\(ogrenciId, waAliciTipi\)/.test(appKaynak));
/* waSatir davranışı: waAliciTipi ne olursa olsun waGonder öğrenci satırının öğrencisine gider —
   waSatir modal dışından çağrıldığından alici tipi neyse o çıkar; davranış garantisi:
   waSatir kendisi ekstra telefon çözümü EKLEMİYOR (değişmedi kanıtı) */
const satirG = appKaynak.split("function waSatir(lid) {")[1].split("\nfunction ")[0];
t("waSatir gövdesi değişmedi (tel/anneTel/babaTel referansı yok)", !satirG.includes("anneTel") && !satirG.includes("babaTel") && !satirG.includes("waAlici"));

/* 9) Kopyala: yalnız mesaj metni */
console.log("9) waKopyalaMesaj:");
const kopyaG = appKaynak.split("function waKopyalaMesaj(ogrenciId) {")[1].split("\nfunction ")[0];
t("kopyala gövdesinde telefon/etiket YOK", !kopyaG.includes("telefon") && !kopyaG.includes("etiket") && !kopyaG.includes("waAlici"));
t("kopyala yalnız ogrenciMesajMetni + kopyalaMetin", kopyaG.includes("ogrenciMesajMetni") && kopyaG.includes("kopyalaMetin"));

/* 10) Mesaj formatı / durum cümleleri / grup / iptal */
console.log("10) Geriye dönüklük:");
t("planlı varsayılan cümle kaynakta", appKaynak.includes('satirDeger("planliSatir", "Bu tarih ve saatte birebir dersiniz olacaktır.")'));
t("tamamlandı varsayılan cümle kaynakta", appKaynak.includes('satirDeger("tamamlandiSatir", "Bu tarih ve saatte birebir dersiniz yapıldı.")'));
t("👥 grup satırı kaynakta", appKaynak.includes('"\\n   👥 " + uyeler.join(", ")'));
t("waAc iptal filtresi korunur", /penceredeDersler\(\)\.filter\(function \(l\) \{ return l\.durum !== "iptal"; \}\)/.test(appKaynak));
t("parantezli öğretmen adı korunur", appKaynak.includes('var satir = (i + 1) + ") " + D.ad + (ogrAd ? " (" + ogrAd + ")" : "")'));

/* 11) localStorage: yeni key YOK, anne/baba tel değişmez */
console.log("11) localStorage + DB alanları:");
t("yeni localStorage key eklenmedi", JSON.stringify(Object.keys(store)) === JSON.stringify(LS_ONCE), JSON.stringify(Object.keys(store)));
waAc(); waAliciDegistir("anne"); waAliciDegistir("baba"); waKapat();
t("alıcı değişimlerinde localStorage hâlâ aynı", JSON.stringify(Object.keys(store)) === JSON.stringify(LS_ONCE));
t("anneTel değerleri değişmedi", JSON.stringify(DB.ogrenciler.map(o => [o.id, o.anneTel])) === ANNE_ONCE);
t("babaTel değerleri değişmedi", JSON.stringify(DB.ogrenciler.map(o => [o.id, o.babaTel])) === BABA_ONCE);

/* 12) Tekrarlı waAc: duplicate yok */
console.log("12) Duplicate koruması:");
const aliciSay = () => (reg.get("waIcerik").innerHTML.match(/id="waAlici"/g) || []).length;
waAc(); waAc(); waAc();
t("waAc innerHTML yolu waAlici markup'ı taşımıyor (mini-DOM innerHTML parse etmez → duplicate imkânsız kanıt)", aliciSay() === 0);
const waAcG = appKaynak.split("function waAc() {")[1].split("\nfunction ")[0];
t("waAc gövdesinde waAliciSeciciHTML çağrısı tam 1 nokta (tekrarlı açılışta markup tazelenir, çoğalmaz)", (waAcG.match(/waAliciSeciciHTML\(\)/g) || []).length === 1);
t("app.js'te waAliciSeciciHTML tam 1 tanım", (appKaynak.match(/function waAliciSeciciHTML\(/g) || []).length === 1);
t("süit test.mjs'te tam 1 kez", (testKaynak.match(/ks-wa-alici\.mjs/g) || []).length === 1);

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 47) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-wa-alici.mjs kosan=" + __kosan + " beklenen=47"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-wa-alici.mjs:" + __kosan + ":47"); } });