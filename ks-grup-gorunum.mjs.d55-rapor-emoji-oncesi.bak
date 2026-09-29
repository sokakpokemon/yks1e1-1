let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 51) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-grup-gorunum.mjs kosan=" + __kosan + " beklenen=51"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-grup-gorunum.mjs:" + __kosan + ":51"); } });
/* DÖNGÜ-19: kosan=42 (28 + 7 D18/D19 havuz-kartı + 7 D19) · DÖNGÜ-21: kosan=47 (+5 D21 UI sözleşmesi) */
/* ks-grup-gorunum.mjs — GRUP GÖRÜNÜM testleri:
   badge markup (+N özeti, aç/kapa), tablo hücreleri, WhatsApp/PNG metinleri, analiz dağıtımı,
   birebir derslerde eski görünüm. Tek boot + gerçek id kayıt defteri (stub DOM). */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"),
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
global.window.html2canvas = function () { return Promise.reject(new Error("stub")); }; /* pngAc çizimi tetiklesin, yakalama stub */

/* id kayıt defteri: innerHTML atanan markup'taki id'ler de kaydedilir (panel testlerindeki desen) */
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

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, renderDersler, gunlukTablo, haftalikOgrtTablo, ogrenciMesajMetni, pngAc, renderAnaliz,
      grupBadgeHTML, grupUyeEtiketleri, grupOgrenciAdlari, grupUyeToggle, dersOgrenciIds, renderOzet, renderHavuz, gorselAd,
      birebirEtiketHTML, ksSugSatirHTML, ksSugListeHTML, ksSugOgrenci, ksSugOgretmen, istekGrupOzetHTML, grupPanelGovdeHTML, grupPanelListeHTML };
  `)();
  t("boot hatasız", true);
} catch (e) {
  /* beklenmeyen catch: THROW (catch-only sayım kaldırıldı — SAYAÇ KAPISI kuralları) */
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  throw e;
  process.exit(1);
}
const { DB, ui, renderDersler, gunlukTablo, haftalikOgrtTablo, ogrenciMesajMetni, pngAc, renderAnaliz,
  grupBadgeHTML, grupUyeEtiketleri, grupOgrenciAdlari, grupUyeToggle, dersOgrenciIds, renderOzet, renderHavuz, gorselAd,
  birebirEtiketHTML, ksSugSatirHTML, ksSugListeHTML, ksSugOgrenci, ksSugOgretmen, istekGrupOzetHTML, grupPanelGovdeHTML, grupPanelListeHTML } = P;
const appKaynak = scripts;

/* Gelecek pazartesi: tüm pencere filtrelerinde görünür */
const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ayse = DB.ogrenciler.find(o => o.ad === "Ayşe Demir");
const zeynep = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya");
const emir = DB.ogrenciler.find(o => o.ad === "Emir Aydın");

/* Grup ders kaydı: ana Ayşe + ek Zeynep, Emir (2 ek üye = +0 özeti, tam açma senaryosu için) */
const grp = { id: "gtest-1", ogrenciId: ayse.id, ogrenciAd: ayse.ad, ogrenciIds: [zeynep.id, emir.id], dersId: "mat", konu: "Limit", ogretmenId: DB.ogretmenler[0].id, ogretmenAd: DB.ogretmenler[0].ad, tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" };
/* Birebir ders kaydı (eski alanlar) */
const tek = { id: "gtest-2", ogrenciId: zeynep.id, ogrenciAd: zeynep.ad, dersId: "fiz", konu: "Enerji", ogretmenId: DB.ogretmenler[0].id, ogretmenAd: DB.ogretmenler[0].ad, tarih: gelecekPzt, saat: "14:40", kod: "7", durum: "planlandi", olusturma: "" };
DB.dersler.push(grp, tek);
ui.filtre = "tumu";
ui.grupAcikOgrId = null;
renderDersler();
const listeHTML = reg["derslerBolum"].innerHTML;

/* 1) Yardımcılar */
console.log("1) Grup görünüm yardımcıları:");
t("grupOgrenciAdlari → 3 üye, ana ilk", JSON.stringify(grupOgrenciAdlari(grp)) === JSON.stringify([ayse.ad, zeynep.ad, emir.ad]), JSON.stringify(grupOgrenciAdlari(grp)));
t("grupUyeEtiketleri → yalnız ek üyeler", JSON.stringify(grupUyeEtiketleri(grp)) === JSON.stringify([zeynep.ad, emir.ad]));
t("birebirde yardımcılar boş", grupUyeEtiketleri(tek).length === 0 && grupOgrenciAdlari(tek).length === 1);
t("dersOgrenciIds bozuk kayıt → []", dersOgrenciIds({ ogrenciIds: "x" }).length === 0);

/* 2) Badge: 2 eklemede tümü görünür; 3+ eklemede +N özeti, aç/kapa */
console.log("2) Badge davranışı:");
ui.grupAcikOgrId = null;
const kapali2 = grupBadgeHTML(grp);
t("2 ek üye: tümü görünür (2 badge)", (kapali2.match(/bg-slate-100 border/g) || []).length === 2);
t("2 ek üye: +N özeti YOK", !kapali2.includes(">+") || !kapali2.includes("</button>"));
t("2 ek üye: baş harfler ZK·EA", kapali2.includes("ZK") && kapali2.includes("EA") && !kapali2.includes("AD"), kapali2);
t("tam ad yok (yalnız baş harf)", !kapali2.includes("Zeynep Kaya"));
/* 3+ ek üye → +N özeti */
const d3 = { ...grp, id: "gtest-3", ogrenciIds: [zeynep.id, emir.id, DB.ogrenciler[3].id] };
const kapali3 = grupBadgeHTML(d3);
t("3 ek üye: 2 badge + '+1' özeti", (kapali3.match(/bg-slate-100 border/g) || []).length === 2 && kapali3.includes(">+1</button>"), kapali3);
t("+N title'da tüm ilk adlar", kapali3.includes("title="));
const d4 = { ...grp, id: "gtest-4", ogrenciIds: [zeynep.id, emir.id, DB.ogrenciler[3].id, DB.ogrenciler[4].id] };
t("4 ek üyede '+2'", grupBadgeHTML(d4).includes(">+2</button>"));
/* Açma: tüm adlar alt alta */
ui.grupAcikOgrId = "gtest-3";
const acik3 = grupBadgeHTML(d3);
t("açık: tüm üye adları TAM ad olarak alt alta (block w-max)", (acik3.match(/block w-max/g) || []).length === 3 && acik3.includes(zeynep.ad) && acik3.includes(emir.ad) && acik3.includes(DB.ogrenciler[3].ad), acik3);
t("açık: daralt düğmesi (−)", acik3.includes(">−</button>"));
grupUyeToggle("");
t("grupUyeToggle('') daraltır + tabloyu yeniden çizer", ui.grupAcikOgrId === null && reg["derslerBolum"].innerHTML.includes("grup-badges"));
ui.grupAcikOgrId = null;

/* 3) Ders listesi: birebir satır eski görünümde */
console.log("3) Ders listesi tablosu:");
t("grup satırında ana ad + badge'ler", listeHTML.includes(ayse.ad) && (listeHTML.match(/grup-badges/g) || []).length === 1);
t("birebir satırında grup-badges YOK", !reg["derslerBolum"].innerHTML.split("</tr>").filter(r => r.includes(zeynep.ad) && r.includes("Enerji")).some(r => r.includes("grup-badges")));

/* 4) Günlük tablo: grup hücresinde baş harfler; birebir hücresi ORTAK GÖRÜNÜM
   (BIREBIR-GORUNUM-ORTAK-YAMASI sonrası: tam ad + gerçek konu + sınıf; ders adı ASLA yok.
   Eski "MATEMATİK hücrede" beklentisi artık kasıtlı olarak geçersiz — davranış testiyle değiştirildi.) */
console.log("4) Günlük tablo:");
ui.gunSecim = gelecekPzt;
const gunHTML = gunlukTablo();
/* DÖNGÜ-26: eski→yeni ad + gerekçe — "grup hücresinde üye baş harfleri (ZK · EA)" → "grup hücresinde üye TAM ADLARI";
   gerekçe: öğretmenin üyeleri ayırt edebilmesi için baş harf yetmez, tam ad satır sarımlı gösterilir (kullanıcı onayı). */
t("grup hücresinde üye TAM ADLARI (DÖNGÜ-26: baş harf → tam ad)", gunHTML.includes(zeynep.ad) && gunHTML.includes(emir.ad), "tam adlar bulunamadı");
const grpSatir = gunHTML.split("</td>").find(r => r.includes(zeynep.ad) && r.includes(emir.ad));
t("grup ders hücresinde TAM AD var, ders adı YOK", !!grpSatir && grpSatir.includes(ayse.ad) && !grpSatir.includes("MATEMATİK"), grpSatir ? grpSatir.slice(0, 200) : "yok");
const tekSatir = gunHTML.split("</td>").find(r => r.includes("FİZİK") || r.includes("Enerji"));
t("birebir hücresinde baş harf satırı yok (eski)", !!tekSatir && !tekSatir.includes("·"), tekSatir ? tekSatir.slice(0, 200) : "yok");
ui.gunSecim = null;

/* 5) Haftalık öğretmen tablosu: grup hücresinde üyeler */
console.log("5) Haftalık öğretmen tablosu:");
ui.haftalikOgrtId = DB.ogretmenler[0].id;
const haftaHTML = haftalikOgrtTablo();
t("tablo çizildi", haftaHTML.includes(DB.ogretmenler[0].ad));
ui.haftalikOgrtId = null;

/* 6) WhatsApp metni: tüm grup üyeleri listelenir */
console.log("6) WhatsApp / PNG:");
const waGrup = ogrenciMesajMetni(ayse.id);
/* D25: üye satırı şablondan bilinçli kaldırıldı; üye adları artık WhatsApp mesajında listelenmez. */
t("grup mesajı D25 sabit şablonla üretilir (üye satırı YOK)", typeof waGrup === "string" && !waGrup.includes("👥") && waGrup.includes("1. MATEMATİK"), waGrup && waGrup.slice(0, 120));
const waTek = ogrenciMesajMetni(zeynep.id);
t("birebir mesajda 👥 yok (eski metin)", !waTek.includes("👥"), waTek);

/* 7) PNG: grup satırında tüm adlar (pngAc html2canvas yoksa güvenli şekilde çizimde kalır) */
ui.filtre = "tumu";
try { pngAc(); } catch (e) { /* beklenmeyen catch: THROW — SAYAÇ KAPISI kuralları */ console.error(e && e.message); throw e; }
const pngHTML = reg["pngRapor"].innerHTML;
t("PNG grup satırında tüm adlar", pngHTML.includes(ayse.ad + ", " + zeynep.ad + ", " + emir.ad), pngHTML.slice(0, 150));
t("PNG birebir satırında tek ad (virgülle birleşme yok)", !pngHTML.split("</tr>").filter(r => r.includes("Enerji")).some(r => r.includes(", ")));

/* 8) Analiz: her grup üyesi ders almış sayılır; ders sayısı tek */
console.log("8) Özet/Analiz dağıtımı:");
ui.filtre = "tumu";
renderAnaliz();
const analizHTML = reg["analizBolum"].innerHTML;
t("her üye analizde görünüyor", ["Ayşe Demir", "Zeynep Kaya", "Emir Aydın"].every(ad => analizHTML.includes(ad)));
t("grup üyelerine ders dağıtıldı (n ≥ 2)", (() => {
  const satirlar = analizHTML.split("</div>").filter(s => s.includes("ders · "));
  return satirlar.length >= 3;
})());
renderOzet();
const ozetHTML = reg["ozetBolum"].innerHTML;
/* Ders TEKİM sayılır: donut merkezindeki toplam = aktif ders kaydı sayısı */
t("özet: ders tek kez sayılır (donut merkezi)", (() => {
  const beklenen = DB.dersler.filter(l => l.durum !== "iptal").length;
  const m = ozetHTML.match(/text-\[26px\] font-extrabold[^>]*>(\d+)</);
  return !!m && Number(m[1]) === beklenen;
})(), "beklenen=" + DB.dersler.filter(l => l.durum !== "iptal").length);

function fmtSayiKontrol(n) { return Number(n).toLocaleString("tr-TR"); }

/* 9) DÖNGÜ-18: İstek havuzu kartı ad markup'ı (12px/semibold, uppercase yok, Türkçe görsel ad, kırpmasız) */
console.log("9) D18 havuz kartı ad markup'ı:");
DB.istekler.push({ id: "d18-istek", ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "mat", konu: "Paragraf", durum: "bekliyor", olusturma: "2026-09-20" });
renderHavuz();
const havuzHTML = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML;
t("D18 havuz adı 12px + font-semibold", havuzHTML.includes('text-[12px] font-semibold normal-case tracking-normal'), havuzHTML.slice(0, 100));
t("D18 havuz adı eski 13px değil", !havuzHTML.includes('text-[13px] text-slate-800'));
/* DÖNGÜ-19 güncellemesi (dosya:satır ks-grup-gorunum.mjs:182-183): ad markup'ı <b class="text-[12px]..."> →
   ortak birebirEtiketHTML (span.birebir-etiket, 12px/600 + sınıf 10px/500) taşındı; eski assertion
   "<b> tabanlı whitespace-normal kontrolü" → "formatter üretimi + kırpmasız + sınıf etiketi" */
t("D19 havuz adı ortak formatter'dan (birebir-etiket) + kırpmasız + sınıf etiketi VAR", havuzHTML.includes('birebir-etiket') && havuzHTML.includes('text-[12px] font-semibold') && havuzHTML.includes('whitespace-normal break-words') && havuzHTML.includes('text-[10px] font-medium text-slate-400'), havuzHTML.slice(0, 80));
t("D18 görsel ad 'Ayşe Demir' biçiminde (DB ham adı değişmeden)", havuzHTML.includes("Ayşe Demir") && DB.ogrenciler.find(o => o.id === ayse.id).ad === "Ayşe Demir");
t("D18 gorselAd('SONER AÇIKGÖZ') → 'Soner Açıkgöz' (Türkçe güvenli)", gorselAd("SONER AÇIKGÖZ") === "Soner Açıkgöz" && gorselAd("İBRAHİM İLHAN") === "İbrahim İlhan");
/* DÖNGÜ-19 güncellemesi: üye badge font-bold → font-medium; ad formatter'dan */
t("D18 grup üye badge'i ad'dan küçük ölçekte (text-[10px])", (() => { DB.istekler.push({ id: "d18-grp", ogrenciId: ayse.id, ogrenciAd: ayse.ad, ogrenciIds: [zeynep.id, emir.id], dersId: "mat", konu: "T", durum: "bekliyor", olusturma: "2026-09-20" }); renderHavuz(); const h = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML; const kart = h.split("data-istek=\"d18-grp\"")[1] || ""; const ok = kart.includes('birebir-etiket') && kart.includes('grup-istek-uyeler') && kart.includes('text-[10px]'); DB.istekler = DB.istekler.filter(r => r.id !== "d18-grp"); renderHavuz(); return ok; })());
/* DÖNGÜ-19: havuz kartı metadata ölçeği (ders 11px/600 · durum 10px/500 · konu 10px/500 kırpmasız · tarih 10px/500) */
t("D19 havuz kartı metadata ölçeği kompakt (ders 11px/600 · konu truncate YOK)", (() => { const kart = (havuzHTML.split("data-istek=")[1] || ""); return kart.includes('text-[11px] font-semibold') && kart.includes('text-[10px] font-medium text-slate-500 whitespace-normal break-words') && !kart.includes("truncate"); })(), havuzHTML.slice(0, 120));
DB.istekler = DB.istekler.filter(r => r.id !== "d18-istek");

/* 10) DÖNGÜ-19: ortak formatter sözleşmesi (tek tanım · sınıf davranışı · suggestion hostları · chip/banner) */
console.log("10) DÖNGÜ-19 ortak formatter sözleşmesi:");
t("D19 birebirEtiketHTML tek tanım (grep TAM 1)", (appKaynak.match(/function birebirEtiketHTML\(/g) || []).length === 1);
t("D19 sinif=null → sınıf spanı YOK ('Sınıf belirtilmemiş' üretilmez)", (() => { const h = birebirEtiketHTML("Serbest İstek", null); return h.includes("birebir-etiket") && h.includes("text-[12px] font-semibold") && !h.includes("Sınıf belirtilmemiş") && !h.includes("text-[10px] font-medium text-slate-400"); })());
t("D19 sinif='' → 'Sınıf belirtilmemiş' + 10px/500 gri etiket", (() => { const h = birebirEtiketHTML("Ayşe Demir", ""); return h.includes("Sınıf belirtilmemiş") && h.includes("text-[10px] font-medium text-slate-400"); })());
t("D19 sinif dolu → sınıf adın yanında (gap-2 wrapper)", birebirEtiketHTML("Ayşe Demir", "9-A").includes("gap-2") && birebirEtiketHTML("Ayşe Demir", "9-A").includes(">9-A<"));
t("D19 serbest metin havuz isteğinde sınıf EKLENMEZ (gerçek DOM)", (() => { DB.istekler.push({ id: "d19-serbest", ogrenciId: null, ogrenciAd: "Serbest Metin Öğrenci", dersId: "mat", konu: "K", durum: "bekliyor", olusturma: "2026-09-20" }); renderHavuz(); const h = (reg["havuzBolum"] || { innerHTML: "" }).innerHTML; const kart = h.split("data-istek=\"d19-serbest\"")[1] || ""; const ok = kart.includes("birebir-etiket") && kart.includes("Serbest Metin Öğrenci") && !kart.includes("Sınıf belirtilmemiş"); DB.istekler = DB.istekler.filter(r => r.id !== "d19-serbest"); renderHavuz(); return ok; })());
t("D19 tüm autocomplete hostları TEK renderer (ksSugListeHTML · 3 host · ks-sug-liste)", (() => { const liste = ksSugListeHTML([{ deger: "Ayşe Demir", html: birebirEtiketHTML("Ayşe Demir", "9-A") }], "ogrenci"); return liste.includes("ks-sug-liste") && liste.includes("hidden") && liste.includes("ks-sug-satir") && (appKaynak.match(/function ksSugListeHTML\(/g) || []).length === 1 && appKaynak.includes('"f-ogrenci:ogrenci", "h-ogrenci:ogrenci", "f-ogretmen:ogretmen"'); })());
/* DÖNGÜ-22 güncellemesi (dosya:satır L205 → L205): chip/banner artık birebirEtiketHTML (ad+sınıf) —
   kullanıcı kararı D19 kompakt-chip (sınıfsız) kararını AÇIKÇA geçersiz kılar; appKaynak kontrolü
   'esc(gorselAd(l.ogrenciAd))' → 'birebirEtiketHTML(l.ogrenciAd' */
t("D22 chip+banner formatter'dan (ad+sınıf; serbest metinde sınıf uydurulmaz)", (() => { const ogrt = ksSugSatirHTML("Ahmet Yılmaz", null, false); const eskiBaglam = ui.grupPanelBaglam, eskiAna = ui.havuzAnaId, eskiEk = ui.ekOgrenciIds; ui.grupPanelBaglam = "havuz"; ui.havuzAnaId = ayse.id; ui.ekOgrenciIds = [zeynep.id]; const ozet = istekGrupOzetHTML(); ui.grupPanelBaglam = eskiBaglam; ui.havuzAnaId = eskiAna; ui.ekOgrenciIds = eskiEk; return ogrt.includes("text-[12px] font-semibold normal-case") && ozet.includes("Ayşe Demir") && ozet.includes("Zeynep Kaya") && ozet.includes("12 SAY 2") && appKaynak.includes("birebirEtiketHTML(l.ogrenciAd") && appKaynak.includes("birebirEtiketHTML(o.ad, o.sinif") ; })());
/* DÖNGÜ-21: UI sözleşmesi — sınıf TEK gösterim (grup paneli satırında ikinci sinifTag YOK) ·
   arama kontrolü kırpılmıyor (kapsayıcı w-full min-w-0) · öneri satırları 13px/500 · ankraj VAR.
   jsdom geometri ölçmez; font/kırpma kontrolleri string-düzeyi, gerçek taşma tarayıcıda doğrulanır. */
t("D21 grup paneli satırında sınıf yalnız formatter'dan BİR kez (ikinci sinifTag yok)", (() => { const eskiBaglam = ui.grupPanelBaglam, eskiAcik = ui.panelSecim; ui.grupPanelBaglam = "plan"; ui.panelSecim = { acik: true, arama: "", sinif: "", anaId: ayse.id }; const lh = grupPanelListeHTML(); ui.panelSecim = eskiAcik; const satirSayisi = (lh.match(/birebir-etiket/g) || []).length; /* kod yorumundaki 'sinifTag' geçmiş açıklaması sayılmaz — tanım/üretim yok */ const sinifTagUretimi = (appKaynak.match(/sinifTag\s*=/g) || []).length + (appKaynak.match(/\+ sinifTag/g) || []).length; return !lh.includes("text-slate-300") && sinifTagUretimi === 0 && satirSayisi >= 1; })());
t("D21 arama kontrolü kırpılmıyor (liste kapsayıcısı w-full + min-w-0, min-w-[280px] YOK)", (() => { const eskiAcik = ui.panelSecim; ui.panelSecim = { acik: true, arama: "", sinif: "", anaId: null }; const govde = grupPanelGovdeHTML(); ui.panelSecim = eskiAcik; return govde.includes('id="grup-panel-arama"') && govde.includes("relative flex-1 min-w-0") && govde.includes("min-w-[280px]") === false && govde.includes("w-full max-h-56"); })());
t("D21/D23 öneri satırları 13px/500 + kesme yok (ks-sug-satir + Eşleşme yok)", (() => { const dolu = ksSugListeHTML([{ deger: "Ayşe Demir", html: birebirEtiketHTML("Ayşe Demir", "9-A") }], "ogrenci"); const bos = ksSugListeHTML([], "ogrenci"); return dolu.includes('ks-sug-satir w-full min-w-0 text-left px-3 py-2 text-[13px] font-medium rounded-lg') && bos.includes("Eşleşme yok"); })());
t("D21 havuz kartı adı gorselAd ile normal biçimde (ham büyük harf DB adı render'da düzelir)", (() => { const once=DB.ogrenciler.find(o=>o.id===ayse.id).ad; DB.ogrenciler.find(o=>o.id===ayse.id).ad="AYŞE DEMİR"; DB.istekler.push({ id: "d21-ham", ogrenciId: ayse.id, ogrenciAd: "AYŞE DEMİR", dersId: "mat", konu: "K", durum: "bekliyor", olusturma: "2026-09-20" }); renderHavuz(); const h=(reg["havuzBolum"]||{innerHTML:""}).innerHTML; const kart=h.split('data-istek="d21-ham"')[1]||""; const ok=kart.includes("Ayşe Demir") && !kart.includes("AYŞE DEMİR"); DB.istekler=DB.istekler.filter(r=>r.id!=="d21-ham"); DB.ogrenciler.find(o=>o.id===ayse.id).ad=once; renderHavuz(); return ok; })());
/* DÖNGÜ-22 güncellemesi (L213 → L213): popup in-flow absolute (top-full) — relative host ile otomatik
   ankraj; scroll/resize JS konumlandırması KALDIRILDI (kayma kanıtı gerektirmez). Yeni sözleşme:
   ksSugAnkraj uyumluluk stub'u + ksSugListeHTML'de top-full + h-ogrenci kendi relative sarmalayıcısında */
/* DÖNGÜ-23: iki satır tipi AYRI — öğrenci satırı birebirEtiketHTML (gorselAd + gerçek DB sınıfı; ham ad data-ks-sug'te), öğretmen satırı sınıfsız (D19 kilidi korunur). Öneri satırı kesme düzeltmesi (min-w-0 whitespace-normal break-words). */
t("D23 öğrenci öneri satırı formatter'dan (gorselAd + gerçek sınıf; ham ad değeri korunur)", (() => { const l=ksSugOgrenci("ayşe"); return l.length===1 && l[0].deger==="Ayşe Demir" && l[0].html.includes("birebir-etiket") && l[0].html.includes("12 SAY 1") && l[0].html.includes("Ayşe Demir") && appKaynak.includes("birebirEtiketHTML(o.ad, o.sinif || \"\")"); })());
t("D23 öneri satırı kesilmez (button min-w-0 whitespace-normal break-words)", (() => { const l=ksSugListeHTML([{deger:"X",html:"<span>Y</span>"}],"ogrenci"); return l.includes("ks-sug-satir w-full min-w-0 text-left px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-teal-50/70 cursor-pointer flex whitespace-normal break-words"); })());
t("D23 öğretmen öneri satırı SINIFSIZ kalır (D19 kilidi; öğrenci satırından ayrı üretim)", (() => { const t=ksSugOgretmen("soner"); const o=ksSugOgrenci("ayşe"); const snf="text-[10px] font-medium text-slate-400"; return t.length>=1 && !t[0].html.includes(snf) && !t[0].html.includes("birebir-etiket") && o[0].html.includes(snf) && appKaynak.includes("ksSugSatirHTML(t.ad, null, false)"); })());
/* DÖNGÜ-24: havuz/istek kartı ad-soyad alanı sade chip sarmalayıcıda (formatter tek kaynak; ikinci sarmalama yok; sahte X butonu yok) */
t("D24 havuz kartı ad-soyad sade chip sarmalayıcıda (formatter tek kaynak; X butonu yok)", (() => { DB.istekler.push({ id: "d24-chip", ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "mat", konu: "K", durum: "bekliyor", olusturma: "2026-09-20" }); renderHavuz(); const h=(reg["havuzBolum"]||{innerHTML:""}).innerHTML; const kart=h.split('data-istek="d24-chip"')[1]||""; const ok=kart.includes('inline-flex rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1') && kart.includes("birebir-etiket") && kart.includes("12 SAY 1") && !kart.includes("fa-xmark"); DB.istekler=DB.istekler.filter(r=>r.id!=="d24-chip"); renderHavuz(); return ok; })());
t("D22 öneri popup'ı input hostuna in-flow absolute bağlı (top-full + relative host)", (() => { return (appKaynak.match(/function ksSugAnkraj\(/g) || []).length === 1 && appKaynak.includes("ks-sug-liste hidden absolute z-30 left-0 right-0 top-full") && appKaynak.includes('<div class="relative min-w-0"><input id="h-ogrenci"') && appKaynak.indexOf("position: fixed") === -1 && appKaynak.indexOf("ksSugPortal") === -1; })());

/* temizlik */
DB.dersler = DB.dersler.filter(l => l.id !== "gtest-1" && l.id !== "gtest-2" && l.id !== "gtest-4");
ui.filtre = "hafta";

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
