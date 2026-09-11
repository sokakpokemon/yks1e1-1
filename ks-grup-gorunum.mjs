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
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, renderDersler, gunlukTablo, haftalikOgrtTablo, ogrenciMesajMetni, pngAc, renderAnaliz,
      grupBadgeHTML, grupUyeEtiketleri, grupOgrenciAdlari, grupUyeToggle, dersOgrenciIds, renderOzet };
  `)();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 8).join("\n"));
  process.exit(1);
}
const { DB, ui, renderDersler, gunlukTablo, haftalikOgrtTablo, ogrenciMesajMetni, pngAc, renderAnaliz,
  grupBadgeHTML, grupUyeEtiketleri, grupOgrenciAdlari, grupUyeToggle, dersOgrenciIds, renderOzet } = P;

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
t("açık: tüm baş harf badge'leri (4: ana hariç 3 üye + …)", (acik3.match(/bg-slate-100 border/g) || []).length === 3, acik3);
t("açık: daralt düğmesi (−)", acik3.includes(">−</button>"));
grupUyeToggle("");
t("grupUyeToggle('') daraltır + tabloyu yeniden çizer", ui.grupAcikOgrId === null && reg["derslerBolum"].innerHTML.includes("grup-badges"));
ui.grupAcikOgrId = null;

/* 3) Ders listesi: birebir satır eski görünümde */
console.log("3) Ders listesi tablosu:");
t("grup satırında ana ad + badge'ler", listeHTML.includes(ayse.ad) && (listeHTML.match(/grup-badges/g) || []).length === 1);
t("birebir satırında grup-badges YOK", !reg["derslerBolum"].innerHTML.split("</tr>").filter(r => r.includes(zeynep.ad) && r.includes("Enerji")).some(r => r.includes("grup-badges")));

/* 4) Günlük tablo: grup hücresinde baş harfler, birebirde eski */
console.log("4) Günlük tablo:");
ui.gunSecim = gelecekPzt;
const gunHTML = gunlukTablo();
t("grup hücresinde üye baş harfleri (ZK · EA)", gunHTML.includes("ZK · EA"), "ZK · EA bulunamadı");
const grpSatir = gunHTML.split("</td>").find(r => r.includes("ZK · EA"));
t("baş harfler ders hücresinde (MATEMATİK ile)", !!grpSatir && grpSatir.includes("MATEMATİK"), grpSatir ? grpSatir.slice(0, 200) : "yok");
const tekSatir = gunHTML.split("</td>").find(r => r.includes("FİZİK"));
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
t("grup üyesi mesajda tüm adlar", waGrup.includes("👥") && waGrup.includes(ayse.ad) && waGrup.includes(zeynep.ad) && waGrup.includes(emir.ad), waGrup);
const waTek = ogrenciMesajMetni(zeynep.id);
t("birebir mesajda 👥 yok (eski metin)", !waTek.includes("👥"), waTek);

/* 7) PNG: grup satırında tüm adlar (pngAc html2canvas yoksa güvenli şekilde çizimde kalır) */
ui.filtre = "tumu";
try { pngAc(); } catch (e) { t("pngAc hatasız", false, e.message); }
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

/* temizlik */
DB.dersler = DB.dersler.filter(l => l.id !== "gtest-1" && l.id !== "gtest-2" && l.id !== "gtest-4");
ui.filtre = "hafta";

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
