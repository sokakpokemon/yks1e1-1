/* ks-grup-uye-yaz.mjs — "TEK KAPI" kalıcı süit (D34-GRUP-UYE-YAZ)
   DEĞİŞMEZ: "ek öğrenci > 0 ⇒ ogrenciIds ZORUNLU". Tüm yazım yolları grupUyeYaz() üzerinden geçer.
   KAPSAM (gerçek fonksiyon akışları, app.js'e YAZMAZ):
     A) grupUyeYaz sözleşmesi (yaz / sil / dedupe / üzerine yaz)
     B) planla() YENİ (0 ek / 1 ek)
     C) planla() DÜZENLEME (üye koruma + açık ekle/çıkar)
     D) istekBurak() havuz→çizelge (tekil / grup)
     E) formaAktar() + planla() → ilgili istek.ogrenciIds SENKRON
     F) dersHavuzaGeriBurak() → TEK istek, üyeler korunur
     G) WhatsApp alıcı listesi + mesajlar
     H) havuz istek kartı "Grup Üyelerini Ekle/Çıkar" (ADIM-4)
     I) statik sözleşme (tek tanım, elle atama yok)
     J) D37 havuz kartı DOM yerleşimi (kart + buton + editör TEK dış grid hücresi)
   SUITE_DONE kapısı: tam 1 marker, kosan === beklenen === 31. */
import { readFileSync } from "node:fs";

let __kosan = 0;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 31) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-grup-uye-yaz.mjs kosan=" + __kosan + " beklenen=31"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-grup-uye-yaz.mjs:" + __kosan + ":31"); } });

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const scripts = [appKaynak,
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

const EXPORTS = "{ DB, ui, planla, formaAktar, dersOgrenciIds, istekOgrenciIds, grupUyeYaz, istekDrag, istekBurak, dersHavuzaGeriBurak, onayOnayla, waAc, ogrenciMesajMetni, duzenle, grupPanelSec, istekUyeAc, istekUyeSec, istekUyeKaydet, renderHavuz }";
let P;
try {
  P = new Function(scripts + "\n  yenile();\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  throw e;
}
const { DB, ui, planla, formaAktar, dersOgrenciIds, istekOgrenciIds, grupUyeYaz, istekDrag, istekBurak, dersHavuzaGeriBurak, onayOnayla, waAc, ogrenciMesajMetni, duzenle, grupPanelSec, istekUyeAc, istekUyeSec, istekUyeKaydet, renderHavuz } = P;

/* ---------- FIXTURE ---------- */
const ana = DB.ogrenciler.find(o => o.ad === "Ayşe Demir");
const ek = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya");
const uc = DB.ogrenciler.find(o => o.ad === "Emir Aydın");
const dort = DB.ogrenciler.find(o => o.ad === "Elif Koç");
const ogr = DB.ogretmenler.find(t2 => t2.ad === "SONER AÇIKGÖZ");
ogr.avail = { sinif: {}, musait: [] };
const pzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const SLOT = "15:30";

function formKur(ekler) {
  ui.grupPanelBaglam = "plan"; ui.panelSecim = { acik: false, arama: "", sinif: "", anaId: ana.id };
  ui.editId = null; ui.aktifIstekId = null; ui.uyeDegisti = false;
  reg["f-ogrenci"].value = ana.ad; reg["f-ders"].value = "mat"; reg["f-konu"].value = "Ortak konu";
  reg["f-ogretmen"].value = ogr.ad; reg["f-tarih"].value = pzt; reg["f-saat"].value = SLOT; reg["f-yoksay"].checked = false;
  ui.ekOgrenciIds = (ekler || []).slice();
}
function sonDers() { return DB.dersler[DB.dersler.length - 1]; }
function grupDersKur(ekler) { DB.dersler = []; formKur(ekler); planla(); return sonDers(); }

/* ================= A) grupUyeYaz sözleşmesi ================= */
const h1 = { id: "h1" };
grupUyeYaz(h1, "ana1", ["e1", "e2"]);
t("grupUyeYaz: ek>0 ⇒ ogrenciIds = [ek] (ana yazılır)", h1.ogrenciId === "ana1" && JSON.stringify(h1.ogrenciIds) === JSON.stringify(["e1", "e2"]));
const h2 = { id: "h2", ogrenciIds: ["eski"], ogrenciId: "x" };
grupUyeYaz(h2, "ana2", []);
t("grupUyeYaz: ek=0 ⇒ ogrenciIds SİLİNİR", h2.ogrenciId === "ana2" && !("ogrenciIds" in h2));
const h3 = {};
grupUyeYaz(h3, "ana3", ["ana3", "e1", "e1", "", null, "e2"]);
t("grupUyeYaz: ana ek listesinde tekrar etmez + kopya elenir", JSON.stringify(h3.ogrenciIds) === JSON.stringify(["e1", "e2"]));
const h4 = { ogrenciIds: ["bayat1", "bayat2"] };
grupUyeYaz(h4, "ana4", ["yeni"]);
t("grupUyeYaz: mevcut ogrenciIds ÜZERİNE yazılır (bayat kayıt kalmaz)", JSON.stringify(h4.ogrenciIds) === JSON.stringify(["yeni"]));

/* ================= B) planla() YENİ ================= */
const k0 = grupDersKur([]);
t("planla() yeni 0 ek: ogrenciIds YAZILMAZ, ogrenciId = ana", !!k0 && !("ogrenciIds" in k0) && k0.ogrenciId === ana.id);
const k1 = grupDersKur([ek.id]);
t("planla() yeni 1 ek: ogrenciIds = [ek]", !!k1 && JSON.stringify(k1.ogrenciIds) === JSON.stringify([ek.id]));

/* ================= C) planla() DÜZENLEME (üye koruma) ================= */
let g = grupDersKur([ek.id]);
duzenle(g.id);
planla();
t("düzenleme 1 ek: grup üyesi KORUNUR", JSON.stringify((DB.dersler.find(x => x.id === g.id) || {}).ogrenciIds) === JSON.stringify([ek.id]));

g = grupDersKur([ek.id, uc.id]);
duzenle(g.id);
grupPanelSec(uc.id); /* açıkça çıkar → 1 ek kalır */
planla();
t("düzenleme 2→1 ek: ogrenciIds = [kalan]", JSON.stringify((DB.dersler.find(x => x.id === g.id) || {}).ogrenciIds) === JSON.stringify([ek.id]));

g = grupDersKur([ek.id, uc.id]);
duzenle(g.id);
grupPanelSec(ek.id); grupPanelSec(uc.id); /* panelden TÜM ekler çıkarıldı */
planla();
const mevcutC = DB.dersler.find(x => x.id === g.id) || {};
t("düzenleme tüm ekler çıkarıldı: ogrenciIds SİLİNİR, ogrenciId = ana", !("ogrenciIds" in mevcutC) && mevcutC.ogrenciId === ana.id);

g = grupDersKur([ek.id]);
duzenle(g.id);
ui.ekOgrenciIds = []; ui.uyeDegisti = false; /* panel dokunulmadı; form ek listesi boşaldı */
planla();
t("düzenleme panel dokunulmadı: mevcut üyeler KORUNUR (silinmez)", JSON.stringify((DB.dersler.find(x => x.id === g.id) || {}).ogrenciIds) === JSON.stringify([ek.id]));

/* ================= D) istekBurak() havuz→çizelge ================= */
DB.dersler = []; DB.istekler = [];
DB.istekler.push({ id: "it1", ogrenciId: ana.id, ogrenciAd: ana.ad, dersId: "mat", konu: "", durum: "bekliyor", olusturma: "2026-09-01", donemId: DB.aktifDonemId });
istekDrag({ dataTransfer: null }, "it1");
istekBurak({ preventDefault() {} }, { classList: { remove() {} } }, ogr.id, pzt, SLOT);
const b1 = sonDers();
t("istekBurak tekil istek: ogrenciIds YAZILMAZ", !!b1 && b1.ogrenciId === ana.id && !("ogrenciIds" in b1));

DB.dersler = []; DB.istekler = [];
DB.istekler.push({ id: "ig1", ogrenciId: ana.id, ogrenciAd: ana.ad, ogrenciIds: [ek.id], dersId: "mat", konu: "", durum: "bekliyor", olusturma: "2026-09-01", donemId: DB.aktifDonemId });
istekDrag({ dataTransfer: null }, "ig1");
istekBurak({ preventDefault() {} }, { classList: { remove() {} } }, ogr.id, pzt, SLOT);
const b2 = sonDers();
t("istekBurak grup istek: ogrenciIds = [ek]", !!b2 && b2.ogrenciId === ana.id && JSON.stringify(b2.ogrenciIds) === JSON.stringify([ek.id]));

/* ================= E) formaAktar + planla → istek SENKRON ================= */
DB.dersler = []; DB.istekler = [];
const istekG = { id: "ig2", ogrenciId: ana.id, ogrenciAd: ana.ad, ogrenciIds: [ek.id], dersId: "mat", konu: "Grup", durum: "bekliyor", olusturma: "2026-09-01", donemId: DB.aktifDonemId };
DB.istekler.push(istekG);
formaAktar("ig2");
t("formaAktar grup istek: ek üyeler panele yüklenir", JSON.stringify(ui.ekOgrenciIds) === JSON.stringify([ek.id]) && ui.aktifIstekId === "ig2");
grupPanelSec(uc.id); /* forma ek üye ekle */
reg["f-ogretmen"].value = ogr.ad; reg["f-tarih"].value = pzt; reg["f-saat"].value = SLOT; reg["f-yoksay"].checked = false;
planla();
const L = sonDers();
t("planla sonrası ilgili istek ogrenciIds SENKRON", JSON.stringify(istekG.ogrenciIds) === JSON.stringify([ek.id, uc.id]) && istekG.durum === "planlandi" && JSON.stringify(L.ogrenciIds) === JSON.stringify([ek.id, uc.id]));

/* ================= G) WhatsApp ================= */
ui.filtre = "tumu";
waAc();
const waHTML = reg["waIcerik"] ? reg["waIcerik"].innerHTML : "";
const btnler = [...waHTML.matchAll(/waGonder\('([^']+)'\)/g)].map(m => m[1]);
t("WA alıcı listesinde ana üye AYRI satır", btnler.filter(i => i === ana.id).length === 1, "alıcı=" + btnler.length);
t("WA alıcı listesinde ek üye AYRI satır", btnler.filter(i => i === ek.id).length === 1 && btnler.filter(i => i === uc.id).length === 1);
const mA = ogrenciMesajMetni(ana.id), mE = ogrenciMesajMetni(ek.id);
t("WA mesajlarında ortak grup dersi VAR (ikisi)", typeof mA === "string" && mA.includes("Pazartesi") && typeof mE === "string" && mE.includes("Pazartesi"));

/* ================= F) dersHavuzaGeriBurak ================= */
const istekOnce = DB.istekler.length;
dersHavuzaGeriBurak(L.id);
onayOnayla();
const geri = DB.istekler[DB.istekler.length - 1];
t("havuza geri: ders silinir + TEK istek", !DB.dersler.some(x => x.id === L.id) && DB.istekler.length === istekOnce + 1);
t("havuza geri istek: ogrenciId = ana + ogrenciIds = [ek, uc]", !!geri && geri.ogrenciId === ana.id && JSON.stringify(geri.ogrenciIds) === JSON.stringify([ek.id, uc.id]) && geri.durum === "bekliyor");

/* ================= H) havuz istek kartı üye editörü ================= */
istekUyeAc(geri.id);
t("istekUyeAc: editör açılır + taslak mevcut üyeler", ui.istekUyeId === geri.id && JSON.stringify(ui.istekUyeTaslak) === JSON.stringify([ana.id, ek.id, uc.id]));
istekUyeSec(geri.id, dort.id);
t("istekUyeSec: üye ekle/çıkar taslağı değiştirir", ui.istekUyeTaslak.includes(dort.id) && ui.istekUyeTaslak.length === 4);
istekUyeKaydet(geri.id);
t("istekUyeKaydet: istek.ogrenciIds SENKRON + durum bekliyor", JSON.stringify(geri.ogrenciIds) === JSON.stringify([ek.id, uc.id, dort.id]) && geri.ogrenciId === ana.id && geri.durum === "bekliyor" && ui.istekUyeId === null);

/* ================= I) statik sözleşme ================= */
t("app.js'te grupUyeYaz TEK tanım", (appKaynak.match(/function grupUyeYaz\(/g) || []).length === 1);
t("5 yazım yolu grupUyeYaz'dan geçer (elle ogrenciIds ataması YOK)",
  (appKaynak.match(/grupUyeYaz\(/g) || []).length >= 6 &&
  !appKaynak.includes("ogrenciIds: grupOgrenciIds.slice()") &&
  !appKaynak.includes("if (_d26Ekler.length) _d26Yeni.ogrenciIds") &&
  !appKaynak.includes("if (ekler.length) yeniIstek.ogrenciIds = ekler") &&
  !appKaynak.includes("ogrenciIds: ekler, ogrenciAd"));

/* ================= J) havuz kartı DOM yerleşimi (D37: kart + buton + editör TEK dış grid hücresi) ================= */
renderHavuz();
const hvJ = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML;
t("ayırıcı grid'in İLK çocuğu + hücreler ONDAN sonra (auto-placement bozulmadı → 1-sol/2-sağ zigzag korunur)",
  hvJ.indexOf("havuz-ayirici") >= 0 && hvJ.indexOf("havuz-ayirici") < hvJ.indexOf('data-istek-hucre="') && hvJ.indexOf('data-istek-hucre="') < hvJ.indexOf('class="istek-kart '));
const hucreSayJ = (hvJ.match(/data-istek-hucre="/g) || []).length;
const kartSayJ = (hvJ.match(/class="istek-kart /g) || []).length;
t("her istek TEK dış grid hücresinde gruplanır (istek-hucre sayısı = istek-kart sayısı; hücre col-span DEĞİL)",
  hucreSayJ >= 1 && hucreSayJ === kartSayJ && !/istek-hucre[^"]*col-span/.test(hvJ), "hücre=" + hucreSayJ + " kart=" + kartSayJ);
istekUyeAc(geri.id); /* bekleyen istek: editörü AÇ */
const hvJ2 = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML;
const hB = hvJ2.indexOf('data-istek-hucre="' + geri.id + '"');
const kB = hvJ2.indexOf('class="istek-kart ', hB);
const bB = hvJ2.indexOf("istekUyeAc('" + geri.id + "')", kB);
const eB = hvJ2.indexOf('class="istek-uye-editor', kB);
t("buton kart DOM'unun İÇİNDE (kart açılışından SONRA, editör panelinden ÖNCE) — ayrı grid öğesi DEĞİL",
  hB >= 0 && kB > hB && bB > kB && eB > bB, "hücre=" + hB + " kart=" + kB + " buton=" + bB + " editör=" + eB);
const sonrakiHucreJ = hvJ2.indexOf('data-istek-hucre="', hB + 1);
t("editör paneli kartın ALTINDA ve AYNI dış grid hücresinde (hücre sarmalayıcı kart + editörü kapsar)",
  eB > bB && (sonrakiHucreJ < 0 || sonrakiHucreJ > eB));
t("editör paneli kart genişliğinde taşmaz: hücre min-w-0 + yalnız dikey kaydırma (overflow-x YOK) + dar ekranda 1 sütun",
  hvJ2.includes('class="istek-hucre min-w-0"') && hvJ2.includes("max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2") && !hvJ2.includes("overflow-x"));
t("boş-havuz mesajı md:col-span-2 kuralı kaynakta korunur",
  appKaynak.includes('md:col-span-2 border border-dashed border-slate-200 rounded-2xl py-10 text-center'));

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
