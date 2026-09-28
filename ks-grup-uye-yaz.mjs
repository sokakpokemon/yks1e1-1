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
     K) D38 buton AÇ/KAPA (toggle): açıkken "Kapat" metni · aynı butona 2. tıklama kapatır · TEK açık editör
     L) D39 editörde ÖĞRENCİ ARAMA: NFC+tr-TR normalize · seçili üye filtre dışında da görünür/İŞARETLİ · odak korunur
   SUITE_DONE kapısı: tam 1 marker, kosan === beklenen === 49. */
import { readFileSync } from "node:fs";

let __kosan = 0;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 49) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-grup-uye-yaz.mjs kosan=" + __kosan + " beklenen=49"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-grup-uye-yaz.mjs:" + __kosan + ":49"); } });

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

const EXPORTS = "{ DB, ui, planla, formaAktar, dersOgrenciIds, istekOgrenciIds, grupUyeYaz, istekDrag, istekBurak, dersHavuzaGeriBurak, onayOnayla, waAc, ogrenciMesajMetni, duzenle, grupPanelSec, istekUyeAc, istekUyeSec, istekUyeKaydet, istekUyeIptal, istekUyeAra, istekUyeListeHTML, istekUyeAramaNorm, renderHavuz }";
let P;
try {
  P = new Function(scripts + "\n  yenile();\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  throw e;
}
const { DB, ui, planla, formaAktar, dersOgrenciIds, istekOgrenciIds, grupUyeYaz, istekDrag, istekBurak, dersHavuzaGeriBurak, onayOnayla, waAc, ogrenciMesajMetni, duzenle, grupPanelSec, istekUyeAc, istekUyeSec, istekUyeKaydet, istekUyeIptal, istekUyeAra, istekUyeListeHTML, istekUyeAramaNorm, renderHavuz } = P;

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

/* ================= K) D38-UYE-BUTON-TOGGLE: buton AÇ/KAPA ================= */
/* Durum kurulumu (assertion DEĞİL): editör KAPALI başlangıçtan hedef kartı AÇ. */
ui.istekUyeId = null; ui.istekUyeTaslak = [];
istekUyeAc(geri.id);
const butonEtiket = (h, rid) => {
  const i = h.indexOf("istekUyeAc('" + rid + "')");
  if (i < 0) return null;
  const b = h.lastIndexOf("<button", i);
  const j = h.indexOf("</button>", i);
  return j < 0 ? null : h.slice(b < 0 ? i : b, j + "</button>".length);
};
const hvK1 = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML;
const etiket1 = butonEtiket(hvK1, geri.id);
t("editör AÇIKKEN buton etiketi 'Kapat' (üye sayaç metni yerine) + vurgu rengi (text-slate-400 DEĞİL)",
  !!etiket1 && etiket1.includes(">Kapat</button>") && !etiket1.includes("Grup üyelerini ekle/çıkar") && !etiket1.includes("text-slate-400"));

istekUyeAc(geri.id); /* AYNI butona 2. tıklama */
const hvK2 = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML;
t("AYNI butona 2. tıklama editörü KAPATIR (ui.istekUyeId = null · taslak boş · panel DOM'da YOK)",
  ui.istekUyeId === null && Array.isArray(ui.istekUyeTaslak) && ui.istekUyeTaslak.length === 0 && !hvK2.includes('class="istek-uye-editor'));

const etiket2 = butonEtiket(hvK2, geri.id);
t("editör KAPALIYKEN buton metni eski hâline döner: 'Grup üyelerini ekle/çıkar (N)' (sayaç + soluk renk geri gelir)",
  !!etiket2 && etiket2.includes("Grup üyelerini ekle/çıkar (" + istekOgrenciIds(geri).length + ")") && !etiket2.includes(">Kapat</button>") && etiket2.includes("text-slate-400"));

/* İkinci bekleyen istek: TEK AÇIK EDİTÖR kuralını AYNI ANDA iki kartla sınar. */
DB.istekler.push({ id: "k38b", ogrenciId: ana.id, ogrenciAd: ana.ad, dersId: "mat", konu: "", durum: "bekliyor", olusturma: "2026-09-02", donemId: DB.aktifDonemId });
istekUyeAc(geri.id);  /* 1. kart AÇIK */
istekUyeAc("k38b");   /* başka kartın butonu → önceki kapanır, hedef açılır */
t("başka kartın butonu → önceki editör KAPANIR, hedef AÇILIR (ui.istekUyeId = hedef · taslak hedefin üyeleri)",
  ui.istekUyeId === "k38b" && JSON.stringify(ui.istekUyeTaslak) === JSON.stringify([ana.id]));

const hvK3 = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML;
const hK = hvK3.indexOf('data-istek-hucre="k38b"');
const eK = hvK3.indexOf('class="istek-uye-editor', hK);
const sonraK = hvK3.indexOf('data-istek-hucre="', hK + 1);
t("DOM'da TEK editör paneli + TEK 'Kapat' etiketi; ikisi de HEDEF kartın hücresinde (önceki kartta editör YOK)",
  (hvK3.match(/class="istek-uye-editor/g) || []).length === 1 &&
  (hvK3.match(/>Kapat<\/button>/g) || []).length === 1 &&
  hK >= 0 && eK > hK && (sonraK < 0 || eK < sonraK));

/* ================= L) D39-UYE-ARAMA: editörde öğrenci arama ================= */
const ecrin = DB.ogrenciler.find(o => o.ad === "Ecrin Şahin");
const yusuf = DB.ogrenciler.find(o => o.ad === "Yusuf Can");
const havuzHTML = () => (reg["havuzBolum"] || { innerHTML: "" }).innerHTML;
const listeHTML = () => {
  const h = havuzHTML();
  const i = h.indexOf('id="istek-uye-liste"');
  if (i < 0) return null;
  const b = h.indexOf(">", i) + 1;
  const j = h.indexOf('<div class="flex items-center gap-2 mt-2 flex-wrap">', b);
  return h.slice(b, j < 0 ? h.length : j);
};
const satirSay = (h) => (h || "").split('onchange="istekUyeSec(').length - 1;
/* NOT (harness): stub DOM'da alt konteynere yazılan içerik ana innerHTML'e yansımaz.
   Bu yüzden istekUyeAra() SONRASI taze liste, konteynerin KENDİSİNDEN okunur. */
const konteynerHTML = () => (reg["istek-uye-liste"] ? reg["istek-uye-liste"].innerHTML : null);

/* deterministik kurulum: editör KAPALI → hedef kart AÇIK (taslak = mevcut üyeler, arama TEMİZ) */
ui.istekUyeId = null; ui.istekUyeTaslak = []; ui.istekUyeArama = "";
renderHavuz();
istekUyeAc(geri.id);

const hvL1 = havuzHTML();
t("editörde 'Öğrenci ara…' arama kutusu VAR (id=istek-uye-arama + placeholder + oninput=istekUyeAra(this.value))",
  hvL1.includes('id="istek-uye-arama"') && hvL1.includes('placeholder="Öğrenci ara…"') && hvL1.includes('oninput="istekUyeAra(this.value)"'));

t('arama normalize kuralı TEK fonksiyonda: normalize("NFC") + toLocaleLowerCase("tr-TR"); hem sorguya hem ada uygulanır (1 tanım + 2 kullanım)',
  /function istekUyeAramaNorm\(s\) \{\s*return String\(s == null \? "" : s\)\.normalize\("NFC"\)\.toLocaleLowerCase\("tr-TR"\);\s*\}/.test(appKaynak) &&
  (appKaynak.match(/istekUyeAramaNorm\(/g) || []).length === 3 &&
  appKaynak.includes("istekUyeAramaNorm(ui.istekUyeArama)") &&
  appKaynak.includes("istekUyeAramaNorm(o.ad).indexOf(q)"));

const listeL3 = listeHTML();
t("sorgu BOŞKEN görünür liste bugünkü hâliyle BİREBİR (tüm öğrenciler + satır markup'ı aynı, filtre YOK)",
  satirSay(listeL3) === DB.ogrenciler.length && DB.ogrenciler.every(o => listeL3.includes(o.ad)) && listeL3.includes('class="w-3.5 h-3.5 shrink-0 accent-teal-600"'));

istekUyeAra("ecr");
const l4 = konteynerHTML();
t("SORGU: eşleşen SEÇİLMEMİŞ öğrenci görünür · eşleşmeyen SEÇİLMEMİŞ öğrenci GİZLİ (ecr → Ecrin VAR, Yusuf YOK)",
  l4.includes(ecrin.ad) && !l4.includes(yusuf.ad) && satirSay(l4) === 5);

istekUyeAra("zzz");
const l5 = konteynerHTML();
t("eşleşmeyen SEÇİLİ üyeler listede KALIR ve İŞARETLİ kalır (zzz → 4 seçili satır + 4 checked)",
  satirSay(l5) === 4 && (l5.match(/checked/g) || []).length === 4 && [ana.ad, ek.ad, uc.ad, dort.ad].every(ad => l5.includes(ad)));

t("filtre değişince ui.istekUyeTaslak SIFIRLANMAZ (4 üye aynen korunur)",
  JSON.stringify(ui.istekUyeTaslak) === JSON.stringify([ana.id, ek.id, uc.id, dort.id]));

const araGovde = (appKaynak.match(/function istekUyeAra\(v\) \{[\s\S]*?\n\}/) || [""])[0];
t("yazarken TÜM editör yeniden çizilmez: istekUyeAra gövdesi YALNIZ #istek-uye-liste içeriğini tazeler (renderHavuz() ÇAĞRISI YOK)",
  araGovde.includes('getElementById("istek-uye-liste")') && araGovde.includes(".innerHTML = istekUyeListeHTML(") && !araGovde.includes("renderHavuz"));

const onceL8 = havuzHTML();
const onceAltL8 = konteynerHTML();
istekUyeAra("ecr");
const sonraL8 = havuzHTML();
t("tazeleme SADECE liste konteynerinde: liste DIŞINDAKİ editör DOM'u byte-birebir AYNI (arama input'u yeniden ÜRETİLMEZ → odak/imleç korunur)",
  onceL8 === sonraL8 && konteynerHTML() !== onceAltL8);

istekUyeAra("ecr"); renderHavuz();
t("'N üye seçili' sayacı SEÇİLİ TOPLAMI gösterir, filtreyi YOK SAYAR (ecr → görünür 5 satır, sayaç 4)",
  havuzHTML().includes("4 üye seçili") && satirSay(listeHTML()) === 5);

ui.istekUyeTaslak = []; istekUyeAra("zzz");
const l10 = konteynerHTML();
const l10ok = l10.includes("Sonuç yok") && satirSay(l10) === 0;
ui.istekUyeTaslak = [ana.id, ek.id, uc.id, dort.id]; /* taslağı geri yükle */
t("eşleşme yok ve SEÇİLİ de yok → listenin yerine 'Sonuç yok' satırı", l10ok);

istekUyeAra("ecr"); istekUyeIptal();
t('İptal\'de arama TEMİZLENİR (ui.istekUyeArama = "" + editör kapanır)',
  ui.istekUyeArama === "" && ui.istekUyeId === null && !havuzHTML().includes('class="istek-uye-editor'));

ui.istekUyeId = null; ui.istekUyeTaslak = []; ui.istekUyeArama = ""; renderHavuz();
istekUyeAc(geri.id); istekUyeAra("ecr");
istekUyeAc(geri.id); /* D38 toggle → KAPAT */
const kapanisOk = ui.istekUyeArama === "" && ui.istekUyeId === null;
istekUyeAc(geri.id); istekUyeAra("ecr");
istekUyeAc("k38b"); /* başka kartın butonu → kart DEĞİŞİMİ */
const kartOk = ui.istekUyeArama === "" && ui.istekUyeId === "k38b";
t("toggle kapanışta VE kart değişiminde arama TEMİZLENİR (bayat sorgu taşınmaz)", kapanisOk && kartOk);

ui.istekUyeId = null; ui.istekUyeTaslak = []; ui.istekUyeArama = ""; renderHavuz();
istekUyeAc(geri.id);
istekUyeAra("zzz");              /* hiçbir ad eşleşmiyor; seçili üyeler yine görünür */
istekUyeSec(geri.id, dort.id);   /* Elif Koç: seçimden ÇIKAR */
istekUyeSec(geri.id, ecrin.id);  /* Ecrin Şahin: sorgu dışı EKLE */
istekUyeKaydet(geri.id);
const hvL13 = havuzHTML();
const iL13 = hvL13.indexOf('data-istek-hucre="' + geri.id + '"');
const jL13 = hvL13.indexOf('data-istek-hucre="', iL13 + 1);
const blokL13 = hvL13.slice(iL13, jL13 < 0 ? hvL13.length : jL13);
t("Kaydet sonrası chip sayısı doğru + arama TEMİZLENDİ + editör kapandı (sorgu dışı seçili üye de kaydedilir)",
  JSON.stringify(istekOgrenciIds(geri)) === JSON.stringify([ana.id, ek.id, uc.id, ecrin.id]) &&
  [ana.ad, ek.ad, uc.ad, ecrin.ad].every(ad => blokL13.includes(ad)) && !blokL13.includes(dort.ad) &&
  ui.istekUyeArama === "" && ui.istekUyeId === null);

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
