/* ks-ogrt-ders-karti.mjs — OGRT-TAMGUN-KART süiti (öğretmen günlük TAM program görseli)
   SÖZLEŞME DEĞİŞİKLİĞİ: öğretmen PNG artık TEK birebir kartı DEĞİL, seçili günkü TAM programdır (sınıf dersleri + birebirler).
   Doğruladıkları:
    1) dersKartiOgrtGunluk* fonksiyonları tanımlı; öğrenci kart yolu (dersKartiAc/HTML/Veri/BtnHTML) BİREBİR korunur.
    2) Kart: tek tablo, slot artan; Sınıf dersi satırı (Tür="Sınıf dersi", Öğrenci="—", Sınıf=avail.sinif değeri,
       Ders=branştan, Konu="—", UYDURMA YOK); birebir satırı (Sınıf=yalnız DB.ogrenciler[].sinif, Konu=konu||"Genel tekrar").
    3) Mola (K) ve boş slotlar GÖSTERİLMEZ; aynı slotta ikisi → 2 satır + her ikisine ÇAKIŞMA.
t("(c) hepsi tamamlandi → rozet 'Yapıldı (n)'", (() => { sifirGun(); ekleBirebir({ id: "ks-ogrt-tam", durum: "tamamlandi" }); const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); const h = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali); const ok = h.includes("Yapıldı (" + r.length + ")"); sifirGun(); return ok; })());
    5) Buton: yalnız satır VARSA öğretmen adı hücresinde; grup/iptal birebir satırı YİNE satır olarak gelir (tam program) ama
       buton koşulu satır varlığıdır; hiç satır yoksa buton çizilmez.
    6) Görselde ve dosya adında TELEFON YOK; dosya adı ders-karti-ogretmen-{ogretmen}-{tarih}.png.
    7) waAliciBilgisi "ogretmen" hedefi yalnız bu akışta; tel yoksa varMi=false, PNG iner (fallback YASAK).
    8) VERİ DEĞİŞTİRMEZ: localStorage yazımı YOK; haftalık izgara / ek ders / sınıf programı buton İÇERMEZ.
   REGRESYON KIRMIZISI: "yalnız birebir basılıyor", "yalnız sınıf dersi basılıyor", "ikinci satır düşürülüyor" mutasyonları ÜÇÜ FAIL.
   TEST-KAPISI: her dal gerçek DB girdisiyle koşulur; sabit true fixture YASAK. */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const testKaynak = readFileSync("test.mjs", "utf8");
const scripts = [appKaynak,
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
const reg = new Map();
function yapEl(id) {
  const e = {
    id: id || "", tagName: "DIV", _textContent: "", _innerHTML: "",
    style: {}, dataset: {}, checked: false, value: "", options: [], files: null,
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, toggle() {}, contains(c) { return this._s.has(c); } },
    insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; },
    appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
    querySelectorAll: () => [], getContext: () => null
  };
  let _html = "";
  Object.defineProperty(e, "innerHTML", {
    get() { return _html; },
    set(v) { _html = String(v); [..._html.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg.has(m[1])) reg.set(m[1], yapEl(m[1])); }); }
  });
  reg.set(id, e);
  return e;
}
for (const m of html.matchAll(/id="([^"]+)"/g)) yapEl(m[1]);
global.document = {
  getElementById: (i) => reg.get(i) || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => yapEl("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
if (!globalThis.navigator) globalThis.navigator = {};

let fail = 0;
let __kosan = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 53) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ogrt-ders-karti.mjs kosan=" + __kosan + " beklenen=53"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ogrt-ders-karti.mjs:" + __kosan + ":53"); } });

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, gunlukTablo, haftalikOgrtTablo, ogrtGunlukSatirlar, dersKartiOgrtGunlukHTML, dersKartiOgrtGunlukBtnHTML, dersKartiOgrtGunlukAc, waAliciBilgisi, dersKartiHTML, dersKartiVeri, dersKartiOgrtHTML, dersKartiUygun };
  `)();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  process.exit(1);
}
const { DB, ui, gunlukTablo, haftalikOgrtTablo, ogrtGunlukSatirlar, dersKartiOgrtGunlukHTML, dersKartiOgrtGunlukBtnHTML, dersKartiOgrtGunlukAc, waAliciBilgisi, dersKartiHTML, dersKartiVeri, dersKartiOgrtHTML, dersKartiUygun } = P;

/* Gelecek SALI (gerçek DB gün eşlemesiyle; dowIdx ve Date aynı takvimi kullanır) */
const gelecekSali = (() => { const d = new Date(); do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 2); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ogrt = DB.ogretmenler.find(o => o.ad === "SONER AÇIKGÖZ") || DB.ogretmenler[0];
const ogr = DB.ogrenciler.find(o => o.ad === "Ayşe Demir") || DB.ogrenciler[0];
const ogr2 = DB.ogrenciler.find(o => o.id !== ogr.id && o.ad) || DB.ogrenciler[1];
const gunNo = new Date(gelecekSali + "T12:00:00").getDay();
/* Fixture sınıf-dersi slotu: öğretmenin o günkü mevcut avail.sinif kaydından ALINIR (gerçek girdi); yoksa 1. slot kullanılır */
const sinifSlotAnahtar = Object.keys((ogrt.avail && ogrt.avail.sinif) || {}).filter(k => parseInt(String(k).split("-")[0], 10) === gunNo && String(k).split("-")[1] !== "K")[0];
const sinifSlotNo = sinifSlotAnahtar ? String(sinifSlotAnahtar).split("-")[1] : "1";
const sinifSlotSaat = ({ "1": "08:50", "2": "09:40", "3": "10:30", "4": "11:20", "5": "13:00", "6": "13:50", "7": "14:40", "8": "15:30", "9": "16:20", "10": "17:10", "11": "18:00" })[sinifSlotNo];
const temizle = () => { DB.dersler = DB.dersler.filter(l => l.tarih !== gelecekSali); };
const __orijinalSinifKayit = sinifSlotAnahtar ? ogrt.avail.sinif[sinifSlotAnahtar] : undefined;
const sifirGun = () => { temizle(); if (sinifSlotAnahtar) delete ogrt.avail.sinif[sinifSlotAnahtar]; };
const ekleBirebir = (over) => DB.dersler.push(Object.assign({ id: "ks-ogrt-1", donemId: DB.aktifDonemId, ogrenciId: ogr.id, ogrenciAd: ogr.ad, dersId: "mat", konu: "Limit ve Süreklilik", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: gelecekSali, saat: sinifSlotSaat, durum: "planlandi", olusturma: "2026-09-01" }, over));
const gunlukHTML = () => { ui.gunSecim = gelecekSali; return gunlukTablo(); };

/* ---- 1) Tanım + öğrenci yolu korunur ---- */
console.log("1) Tanımlar ve öğrenci kart yolu birebir:");
t("ogrtGunlukSatirlar tanımlı", typeof ogrtGunlukSatirlar === "function");
t("dersKartiOgrtGunlukHTML tanımlı", typeof dersKartiOgrtGunlukHTML === "function");
t("dersKartiOgrtGunlukBtnHTML tanımlı", typeof dersKartiOgrtGunlukBtnHTML === "function");
t("dersKartiOgrtGunlukAc tanımlı", typeof dersKartiOgrtGunlukAc === "function");
t("öğrenci yolu: dersKartiAc çağrıları sayısı değişmedi (app'ta tanımlı)", (appKaynak.match(/function dersKartiAc\(/g) || []).length === 1);
t("öğrenci kart HTML dersKartiGovde id'yi kullanır; öğrenci + öğretmen-tek-ders + öğretmen-tam-gün = 3 paylaşım", (appKaynak.match(/id="dersKartiGovde"/g) || []).length === 3);

/* ---- 2) Satır üretimi — fixture (a) SALI: hem sınıf dersi hem birebir ---- */
console.log("2) Satır üretimi (gerçek avail.sinif + gerçek ders kaydı):");
sifirGun();
const sinifDeger = "12 SAY 1";
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
ekleBirebir({});
let satirlar = ogrtGunlukSatirlar(ogrt.id, gelecekSali);
t("(a) sınıf dersi satırı VAR", satirlar.some(r => r.tur === "Sınıf dersi"), JSON.stringify(satirlar.map(r => r.tur)));
t("(a) birebir satırı VAR", satirlar.some(r => r.tur === "Birebir"));
t("(a) sınıf dersi Sınıf alanı = avail.sinif değeri", satirlar.find(r => r.tur === "Sınıf dersi").sinif === sinifDeger);
t("(a) sınıf dersi Öğrenci = '—'", satirlar.find(r => r.tur === "Sınıf dersi").ogrenci === "—");
t("(a) sınıf dersi Ders = öğretmen branşından (mat → MATEMATİK)", satirlar.find(r => r.tur === "Sınıf dersi").ders === "MATEMATİK");
t("(a) sınıf dersi Konu = '—' (gerçek alan yok, UYDURMA YOK)", satirlar.find(r => r.tur === "Sınıf dersi").konu === "—");
t("(a) birebir Öğrenci = gerçek öğrenci adı", satirlar.find(r => r.tur === "Birebir").ogrenci === ogr.ad);
t("(a) birebir Sınıf = yalnız DB.ogrenciler[].sinif", satirlar.find(r => r.tur === "Birebir").sinif === (ogr.sinif || "Sınıf belirtilmemiş"));
t("(a) birebir Konu = gerçek konu", satirlar.find(r => r.tur === "Birebir").konu === "Limit ve Süreklilik");
t("(a) sıralama slot artan", satirlar.every((r, i) => i === 0 || satirlar[i - 1].slot <= r.slot));
t("(a) mola (K) slotu satırlarda YOK", !satirlar.some(r => String(r.saatYazi).includes("Mola") || r.slot === 12));

/* ---- 3) Kart HTML — rozet, çakışma, telefon yok ---- */
console.log("3) Kart HTML:");
const hA = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
t("(a) HTML'de her iki satır da basılıyor (yalnız-birebir mutasyonu kırmızı olur)", hA.includes("Sınıf dersi") && hA.includes("Birebir"));
t("(a) rozet 'Planlandı (n)' — planlı sayısı", hA.includes("Planlandı (" + satirlar.filter(r => r.durum !== "Yapıldı").length + ")"), hA.slice(0, 400));
t("görselde TELEFON YOK (tel değerleri sızamaz)", !hA.includes(String(ogr.tel || "___telYok___")) && !/(0[5-9]\d{2})\s?\d{3}/.test(hA));
t("başlıkta öğretmen adı + gün", hA.includes(ogrt.ad) && hA.includes(gelecekSali));

/* ---- 4) Fixture (b) yalnız sınıf dersi ---- */
console.log("4) Fixture (b) yalnız sınıf dersi:");
sifirGun();
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
satirlar = ogrtGunlukSatirlar(ogrt.id, gelecekSali);
t("(b) yalnız sınıf dersi satırı (birebir YOK)", satirlar.length === 1 && satirlar[0].tur === "Sınıf dersi", JSON.stringify(satirlar));
const hB = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
t("(b) HTML'de sınıf dersi basılıyor (yalnız-sınıf mutasyonu kırmızı olur)", hB.includes("Sınıf dersi") && hB.includes(sinifDeger));
t("(b) HTML'de birebir satırı YOK (Tür kolonunda Birebir geçmiyor)", !hB.includes(">Birebir<"));

/* ---- 5) Fixture (c) yalnız birebir ---- */
console.log("5) Fixture (c) yalnız birebir:");
sifirGun();
ekleBirebir({});
satirlar = ogrtGunlukSatirlar(ogrt.id, gelecekSali);
t("(c) yalnız birebir satırı (sınıf dersi YOK)", satirlar.length === 1 && satirlar[0].tur === "Birebir", JSON.stringify(satirlar));
const hC = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
t("(c) konu boş → 'Genel tekrar' dalı (mutasyona karşı kapı)", (() => { const r2 = ogrtGunlukSatirlar(ogrt.id, gelecekSali); const kayit = DB.dersler.find(l => l.id === "ks-ogrt-1"); kayit.konu = ""; const r3 = ogrtGunlukSatirlar(ogrt.id, gelecekSali); kayit.konu = "Limit ve Süreklilik"; return r3[0].konu === "Genel tekrar" && r2[0].konu === "Limit ve Süreklilik"; })());
t("(c) HTML'de birebir basılıyor (yalnız-birebir-düşürme mutasyonu kırmızı olur)", hC.includes("Birebir") && hC.includes(ogr.ad));
t("(c) HTML'de sınıf dersi satırı YOK", !hC.includes("Sınıf dersi"));

/* ---- 6) Fixture (d) AYNI slotta ikisi → 2 satır + ÇAKIŞMA ---- */
console.log("6) Fixture (d) aynı slot çakışması:");
sifirGun();
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
ekleBirebir({}); /* birebir saatini sınıf dersi slotuna bilerek çakıştır */
satirlar = ogrtGunlukSatirlar(ogrt.id, gelecekSali);
t("(d) aynı slotta İKİ satır da kalır", satirlar.filter(r => r.slot === parseInt(sinifSlotNo, 10)).length === 2, JSON.stringify(satirlar.map(r => r.slot + ":" + r.tur)));
t("(d) her iki satıra ÇAKIŞMA işareti", satirlar.filter(r => r.slot === parseInt(sinifSlotNo, 10)).every(r => r.cakisma));
const hD = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
t("(d) HTML'de 2 × ÇAKIŞMA rozeti", (hD.match(/ÇAKIŞMA/g) || []).length === 2, String((hD.match(/ÇAKIŞMA/g) || []).length));

/* ---- 7) Fixture (e) mola/boş slot → çıktıda yok ---- */
console.log("7) Fixture (e) mola ve boş slot:");
t("(e) K (mola) anahtarlı avail kaydı satır üretmez", (() => { const k = gunNo + "-K"; ogrt.avail.sinif[k] = sinifDeger; const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali).filter(x => x.slot === 12 || String(x.saatYazi).indexOf("12:00") >= 0); delete ogrt.avail.sinif[k]; return r.length === 0; })());
t("(e) boş gün → satır dizisi boş", (() => { sifirGun(); const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); return r.length === 0; })());
t("(e) satır yoksa buton çizilmez (gunlukTablo)", !gunlukHTML().includes("dersKartiOgrtGunlukAc"));

/* ---- 8) Buton koşulu + kalıp ---- */
console.log("8) Buton:");
sifirGun();
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
ekleBirebir({});
const btn = dersKartiOgrtGunlukBtnHTML(ogrt.id, gelecekSali);
t("buton draggable=false", btn.includes('draggable="false"'));
t("buton onmousedown stopPropagation", btn.includes('onmousedown="event.stopPropagation()"'));
t("buton onclick stopPropagation + dersKartiOgrtGunlukAc", btn.includes("dersKartiOgrtGunlukAc('" + ogrt.id + "', '" + gelecekSali + "')"));
t("buton fa-image ikonu KULLANMAZ (eski kapı çakışması yok)", !btn.includes("fa-image"));
t("buton öğretmen adı hücresinde (gunlukTablo, ad td içinde)", (() => { const g = gunlukHTML(); const td = g.slice(g.indexOf("font-black text-slate-800 uppercase"), g.indexOf("font-black text-slate-800 uppercase") + 600); return g.includes("dersKartiOgrtGunlukAc('" + ogrt.id + "', '" + gelecekSali + "')") && td.includes("ogrt") === false && g.indexOf("dersKartiOgrtGunlukAc") > g.indexOf("font-black text-slate-800 uppercase"); })());
t("buton birebir hücresine EKLENMEDİ (eski konum boş)", (() => { const g = gunlukHTML(); const i = g.indexOf("draggable=\"true\""); const seg = g.slice(i, i + 900); return !seg.includes("dersKartiOgrtGunlukAc"); })());
t("haftalik izgarada öğretmen-kart butonu YOK", !haftalikOgrtTablo().includes("dersKartiOgrtGunlukAc"));

/* ---- 9) Dosya adı + WA hedefi ---- */
console.log("9) Dosya adı ve WA hedefi:");
const srcOgrtAc = appKaynak.slice(appKaynak.indexOf("function dersKartiOgrtGunlukAc("), appKaynak.indexOf("/* ---- PNG raporu ---- */"));
const gunlukDosyaSeg = srcOgrtAc.slice(srcOgrtAc.indexOf("function dosyaAdi")).split("\n  }")[0];
t("dosya adı öneki: ders-karti-ogretmen-", srcOgrtAc.includes('"ders-karti-ogretmen-"'));
t("dosya adı .png ile biter", srcOgrtAc.includes('.png"'));
t("dosya adı telefon İÇERMEZ (yalnız ad+tarih kaynağı)", !/(tel[^a-z]|tel$)/i.test(gunlukDosyaSeg.replace(/GIZLILIK[^\n]*\n?/, "").replace(/TELEFON/g, "")));
const aOgrt = waAliciBilgisi(ogrt.id, "ogretmen");
t("ogretmen hedefi tip=ogretmen, etiket=Öğretmen", aOgrt.tip === "ogretmen" && aOgrt.etiket === "Öğretmen");
t("ogretmen tel yoksa varMi=false (fallback yok)", aOgrt.varMi === !!(ogrt.tel), JSON.stringify({ tel: ogrt.tel, varMi: aOgrt.varMi }));
t("akışta ogretmen hedefi tam 2 akış (tek-ders + tam-gün) okunur", (appKaynak.match(/waAliciBilgisi\([^)]*,\s*"ogretmen"\)/g) || []).length === 2);
t("öğretmen tel yoksa toast: 'Öğretmen telefonu kayıtlı değil; görsel indirildi.'", srcOgrtAc.includes("Öğretmen telefonu kayıtlı değil; görsel indirildi."));

/* ---- 10) Negatif/veri değişmezlik + kapsam ---- */
console.log("10) Veri değişmezlik ve kapsam:");
const keysOnce = Object.keys(store).length;
sifirGun();
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
ekleBirebir({});
gunlukHTML(); /* render tekrar — buton çizimi localStorage'a yazmamalı */
t("buton çizimi localStorage'a YAZMAZ", Object.keys(store).length === keysOnce, JSON.stringify(Object.keys(store)));
t("grup birebir satırı TAM programda görünür (tam program sözleşmesi)", (() => { temizle(); ekleBirebir({ id: "ks-ogrt-g", ogrenciIds: [ogr.id, ogr2.id] }); const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); const ok = r.some(x => x.tur === "Birebir" && x.ogrenci.includes(ogr.ad) && x.ogrenci.includes(ogr2.ad)); temizle(); return ok; })());
t("iptal birebir satır üretmez", (() => { sifirGun(); ekleBirebir({ id: "ks-ogrt-i", durum: "iptal" }); const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); sifirGun(); return r.length === 0; })());
t("süit test.mjs'te tam 1 kez kayıtlı", (testKaynak.match(/ks-ogrt-ders-karti\.mjs/g) || []).length === 1);

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
