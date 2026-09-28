/* ks-d35-ad-sinif.mjs — D35-AD-SINIF kalıcı süiti (23 assertion)
   KAPSAM: çizelge hücresinde HER öğrenci için "Ad Soyad + Sınıf" (havuz kartındaki
   birebirEtiketHTML ile AYNI tipografi), üyeler ALT ALTA; uzun soyadlı adlar kisaAdlik ile kısalır.
   Etki sınırı: WhatsApp mesajı, PNG kartı, havuz chip'i TAM adla kalır.
   SUITE_DONE kapısı: tam 1 marker, kosan === beklenen === 23. app.js'e YAZMAZ. */
import { readFileSync } from "node:fs";

let __kosan = 0;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 23) { console.error("SUITE_DONE UYUŞMAZLIK: ks-d35-ad-sinif.mjs kosan=" + __kosan + " beklenen=23"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-d35-ad-sinif.mjs:" + __kosan + ":23"); } });

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const scripts = [appKaynak,
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
global.window.html2canvas = function () { return Promise.reject(new Error("stub")); };
if (!globalThis.navigator) globalThis.navigator = {};

const reg = {};
const el = (id) => {
  const e = {
    id, textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], files: null,
    classList: { _s: new Set(), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, toggle() {}, contains(c) { return this._s.has(c); } },
    insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; },
    appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
    querySelectorAll: () => [], getContext: () => null
  };
  let _html = "";
  Object.defineProperty(e, "innerHTML", {
    get() { return _html; },
    set(v) { _html = String(v); [..._html.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }
  });
  reg[id] = e;
  return e;
};
for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
global.document = {
  getElementById: (i) => reg[i] || null, addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()), body: { appendChild() {}, removeChild() {} }, querySelectorAll() { return []; }
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };

const EXPORTS = "{ DB, ui, haftalikOgrtTablo, gunlukTablo, birebirHucreHTML, kisaAdlik, adHarfSayisi, gorselAd, dersOgrenciIds, MAX_SOYAD_HARF, MAX_AD_UZUNLUK, ogrenciMesajMetni, pngAc, renderHavuz }";
let P;
try {
  P = new Function(scripts + "\n  yenile();\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  throw e;
}
const { DB, ui, haftalikOgrtTablo, gunlukTablo, kisaAdlik, adHarfSayisi, gorselAd, MAX_SOYAD_HARF, MAX_AD_UZUNLUK, ogrenciMesajMetni, pngAc, renderHavuz } = P;

/* ---------- FIXTURE (demo öğrenciler + kısaltma sınavı için sentetik adlar) ---------- */
const ana = DB.ogrenciler.find((o) => o.ad === "Ayşe Demir");
const ek1 = DB.ogrenciler.find((o) => o.ad === "Zeynep Kaya");
const ogr = DB.ogretmenler.find((o) => o.ad === "SONER AÇIKGÖZ") || DB.ogretmenler[0];
ogr.avail = { sinif: {}, musait: [] };
const uzun = { id: "d35-uzun", ad: "AHMET KIZILIRMAK", sinif: "MEZUN SAY 1", tel: "" };
const kisa = { id: "d35-kisa", ad: "Hasan Hüseyin Taşkın", sinif: "11 SAY 1", tel: "" };
const bosSinif = { id: "d35-bossinif", ad: "Boş Sınıflı Öğrenci", sinif: "", tel: "" };
const tek = { id: "d35-tek", ad: "Ecrin", sinif: "10.SINIF", tel: "" };
DB.ogrenciler.push(uzun, kisa, bosSinif, tek);
const GHOST = "d35-kaydi-silinmis"; /* DB.ogrenciler'de YOK */

const pzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ortak = { dersId: "mat", ogretmenId: ogr.id, ogretmenAd: ogr.ad, tarih: pzt, durum: "planlandi", olusturma: "2026-09-25", donemId: DB.aktifDonemId };
DB.dersler = [
  Object.assign({ id: "d35-grup", ogrenciId: ana.id, ogrenciAd: ana.ad, ogrenciIds: [ek1.id, uzun.id, kisa.id, bosSinif.id, GHOST], konu: "Grup konusu", saat: "15:30", kod: "8" }, ortak),
  Object.assign({ id: "d35-tekli", ogrenciId: tek.id, ogrenciAd: tek.ad, konu: "Tek konu", saat: "10:30", kod: "3" }, ortak)
];
DB.istekler = [{ id: "d35-istek", ogrenciId: uzun.id, ogrenciAd: uzun.ad, dersId: "mat", konu: "", durum: "bekliyor", olusturma: "2026-09-25", donemId: DB.aktifDonemId }];
ui.istekFiltre = "";
const hafta = () => { ui.filtre = "hafta"; ui.anchor = pzt; ui.gunSecim = ""; ui.haftalikOgrtId = ogr.id; return haftalikOgrtTablo(); };
const gun = () => { ui.filtre = "gun"; ui.anchor = pzt; ui.gunSecim = pzt; ui.haftalikOgrtId = null; return gunlukTablo(); };
const tdAl = (h, anahtar) => { const i = h.indexOf(anahtar); if (i < 0) return ""; const b = h.lastIndexOf("<td", i); const e = h.indexOf("</td>", i); return h.slice(b, e < 0 ? h.length : e); };
/* üye satırı = <div class="min-w-0 whitespace-nowrap" title="AD"> ... </div> (hücrenin dış kabuğu class="rounded-lg ... min-w-0" ile karışmaz).
   D35-DUZELTME: nowrap ORTAK formatter'dan çıkarıldı → hücre üye sarmalayıcısına taşındı. */
const uyeSatirlari = (h) => (h.match(/<div class="min-w-0 whitespace-nowrap" title="[^"]*">[\s\S]*?<\/div>/g) || []);

/* ================= A) kisaAdlik birimi ================= */
t("kisaAdlik: 'Ahmet Kızılırmak' → 'Ahmet K.'", kisaAdlik("Ahmet Kızılırmak") === "Ahmet K.", kisaAdlik("Ahmet Kızılırmak"));
t("kisaAdlik: 'Mehmet Ali Kızılırmak' → 'Mehmet Ali K.'", kisaAdlik("Mehmet Ali Kızılırmak") === "Mehmet Ali K.", kisaAdlik("Mehmet Ali Kızılırmak"));
t("kisaAdlik: 'Hasan Hüseyin Taşkın' DEĞİŞMEZ (eşik altı — soyadı 6 < 10, toplam 18 < 22)", kisaAdlik("Hasan Hüseyin Taşkın") === "Hasan Hüseyin Taşkın", kisaAdlik("Hasan Hüseyin Taşkın"));
t("kisaAdlik: tek kelimeli ad DEĞİŞMEZ ('Ecrin' · 'Yusuf Can')", kisaAdlik("Ecrin") === "Ecrin" && kisaAdlik("Yusuf Can") === "Yusuf Can", kisaAdlik("Ecrin") + " | " + kisaAdlik("Yusuf Can"));
t("kisaAdlik: gorselAd normalizasyonundan geçer (HAM 'AHMET KIZILIRMAK' → 'Ahmet K.')", kisaAdlik("AHMET KIZILIRMAK") === "Ahmet K." && gorselAd("AHMET KIZILIRMAK") === "Ahmet Kızılırmak");
t("kisaAdlik: normal soyadlar KISALMAZ ('Ahmet Karabulut' 9 < 10 · 'Ahmet Demirci' 7 < 10)", kisaAdlik("Ahmet Karabulut") === "Ahmet Karabulut" && kisaAdlik("Ahmet Demirci") === "Ahmet Demirci", kisaAdlik("Ahmet Karabulut") + " | " + kisaAdlik("Ahmet Demirci"));
t("eşikler tek yerde: MAX_SOYAD_HARF = 10 · MAX_AD_UZUNLUK = 22", MAX_SOYAD_HARF === 10 && MAX_AD_UZUNLUK === 22);
t("adHarfSayisi: boşluk/tire/kesme işareti sayılmaz, Türkçe harf TEK sayılır", adHarfSayisi("Kızılırmak") === 10 && adHarfSayisi("Taşkın") === 6 && adHarfSayisi("O'Brien Kızıl-ırmak") === 16, adHarfSayisi("Kızılırmak") + "/" + adHarfSayisi("O'Brien Kızıl-ırmak"));

/* ================= B) HAFTALIK hücre ================= */
const hHTML = hafta();
const gTD = tdAl(hHTML, "d35-grup");
const aSinif = ana.sinif || "", eSinif = ek1.sinif || "";
t("haftalık grup hücresi: ana + ek üyeler TAM ad ve sınıf AYNI hücrede", gTD.includes(gorselAd(ana.ad)) && gTD.includes(aSinif) && gTD.includes(gorselAd(ek1.ad)) && gTD.includes(eSinif) && gTD.includes(kisa.ad) && gTD.includes(kisa.sinif), gTD.slice(0, 160));
t("haftalık grup hücresi: HER üye KENDİ satırında (5 üye → 5 satır)", uyeSatirlari(gTD).length === 5, "satır=" + uyeSatirlari(gTD).length);
t("haftalık grup hücresi: uzun soyadlı üye 'Ahmet K.' görünür — tam soyadı GÖRÜNMEZ", gTD.includes("Ahmet K.") && !gTD.includes("Kızılırmak"), gTD.slice(0, 200));
const bosSatir = uyeSatirlari(gTD).find((s) => s.includes(bosSinif.ad)) || "";
t("haftalık grup hücresi: sınıfı BOŞ üye → hücrede sınıf metni YOK (yer tutucu YOK)", !!bosSatir && bosSatir.includes(bosSinif.ad) && !bosSatir.includes("Sınıf belirtilmemiş") && !bosSatir.includes(aSinif) && !bosSatir.includes(eSinif), bosSatir);
t("haftalık grup hücresi: kaydı silinmiş üye hücreye YAZILMAZ (uydurma ad/sınıf YOK)", !gTD.includes(GHOST) && (gTD.match(/birebir-etiket/g) || []).length === 5, "etiket=" + (gTD.match(/birebir-etiket/g) || []).length);
const tTD = tdAl(hHTML, "d35-tekli");
t("haftalık TEKLİ hücre: sınıf VAR + tek kelimeli ad DEĞİŞMEZ", tTD.includes(tek.ad) && !tTD.includes("Ecrin.") && tTD.includes(tek.sinif));

/* ================= C) GÜNLÜK hücre (aynı davranış) ================= */
const gHTML = gun();
const gGunTD = tdAl(gHTML, "d35-grup");
t("günlük grup hücresi: TAM ad + sınıf AYNI hücrede + 'Ahmet K.' kısaltması", gGunTD.includes(gorselAd(ana.ad)) && gGunTD.includes(aSinif) && gGunTD.includes(kisa.ad) && gGunTD.includes("Ahmet K.") && !gGunTD.includes("Kızılırmak"), gGunTD.slice(0, 160));
t("günlük grup hücresi = haftalık grup hücresi (üye satırları BİREBİR aynı)", uyeSatirlari(gGunTD).length === 5 && JSON.stringify(uyeSatirlari(gGunTD)) === JSON.stringify(uyeSatirlari(gTD)));
const tGunTD = tdAl(gHTML, "d35-tekli");
t("günlük TEKLİ hücre: sınıf VAR (tek öğrencili ders de sınıfı gösterir)", tGunTD.includes(tek.ad) && tGunTD.includes(tek.sinif));

/* ================= D) ETKİ SINIRI (kısaltma sızmaz) ================= */
const msg = ogrenciMesajMetni(uzun.id);
t("ETKİ SINIRI: WhatsApp mesajı TAM ad (kısaltma sızmadı)", typeof msg === "string" && msg.includes(uzun.ad) && !msg.includes("Ahmet K."));
ui.filtre = "tumu";
pngAc();
const pngHTML = reg["pngRapor"] ? reg["pngRapor"].innerHTML : "";
t("ETKİ SINIRI: PNG/rapor kartı TAM ad (kısaltma sızmadı)", pngHTML.includes(uzun.ad) && !pngHTML.includes("Ahmet K."), pngHTML.length + " B");
renderHavuz();
const havuzHTML = reg["havuzBolum"] ? reg["havuzBolum"].innerHTML : "";
t("ETKİ SINIRI: havuz chip'i TAM ad (kısaltma yok)", havuzHTML.includes(gorselAd(uzun.ad)) && !havuzHTML.includes("Ahmet K."));
t("havuz chip'i sarma SERBEST (whitespace-nowrap YOK) — nowrap YALNIZ çizelge hücresi üye satırında",
  !havuzHTML.includes("whitespace-nowrap") &&
  (havuzHTML.match(/birebir-etiket/g) || []).length >= 1 &&
  !appKaynak.includes("text-slate-400 shrink-0 whitespace-nowrap") &&
  uyeSatirlari(gTD).length === 5 && uyeSatirlari(gTD).every((s) => s.includes("whitespace-nowrap")),
  "havuz nowrap=" + havuzHTML.includes("whitespace-nowrap") + " · satır nowrap=" + uyeSatirlari(gTD).filter((s) => s.includes("whitespace-nowrap")).length + "/" + uyeSatirlari(gTD).length);

/* ================= E) statik sözleşme ================= */
const blok = (fn) => { const i = appKaynak.indexOf(fn); let j = appKaynak.indexOf("\nfunction ", i + 10); if (j === -1) j = appKaynak.length; return appKaynak.slice(i, j); };
t("statik: ad/sınıf için İKİNCİ formatter YOK (kisaAdlik tek tanım · hücre birebirEtiketHTML · çizelge hücrelerinde ayrı üye satırı kalmadı)",
  (appKaynak.match(/function kisaAdlik\(/g) || []).length === 1 &&
  (appKaynak.match(/function birebirHucreHTML\(/g) || []).length === 1 &&
  appKaynak.includes("birebirEtiketHTML(kisaAdlik(") &&
  !appKaynak.includes('text-[10px] font-bold text-slate-800 leading-tight truncate') &&
  !blok("function haftalikOgrtTablo() {").includes("grupUyeEtiketleri(ders)") &&
  !blok("function gunlukTablo() {").includes("grupUyeEtiketleri(ders)") &&
  blok("function gunlukTablo() {").includes("birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || \"\", sinif, durumRenkG)"));

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
