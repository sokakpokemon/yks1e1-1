/* ks-ogrt-ders-karti.mjs — OGRT-YATAY-KART süiti (öğretmen günlük program görseli, YATAY saat şeridi)
   SÖZLEŞME (bu tur, bilinçli ters dönüş): görsel = ekrandaki öğretmen çizelgesinin o günkü satırı.
   Dikey 7-kolon tablo sözleşmesi KALDIRILDI; yatay şerit sözleşmesi geçerli. Doğruladıkları:
    1) dersKartiOgrtGunluk* tanımlı; öğrenci kart yolu (dersKartiAc/HTML/Veri/BtnHTML) BİREBİR korunur.
    2) YATAY şerit: 11 kolon (KISA_KOD 1..11), ÖĞLE kolonu ÇİZİLMEZ; sınıf dersi = rose kartta YALNIZ
       sınıf adı; birebir = ad · konu · sınıf (DERS adı YOK — birebirHucreHTML ile aynı); boş hücre boş.
    3) Ek Ders HARİÇ (ekran ölçütü l.sinif && !l.ogrenciAd && !l.ogrenciId); K/mola ve bilinmeyen slot uydurmaz.
    4) Aynı slotta çoklu kayıt ALT ALTA (2 satır değil 2 KART); çokluysa her iki ögeye ÇAKIŞMA.
    5) Rozet: hepsi planlı → "Planlandı"; hepsi tamamlandi → "Yapıldı"; karışık → "Kısmen tamamlandı".
    6) Buton: yalnız satır VARSA öğretmen adı hücresinde; grup/iptal birebir satırı YİNE satırdır (tam program).
    7) TELEFON YOK (görsel + dosya adı: ders-karti-ogretmen-{ogretmen}-{tarih}.png); paylaşım zinciri aynen.
    8) waAliciBilgisi "ogretmen" hedefi yalnız 2 akışta; tel yoksa varMi=false, PNG iner (fallback YASAK).
    9) VERİ DEĞİŞTİRMEZ: localStorage yazımı YOK; haftalık izgara / ek ders / sınıf programı buton İÇERMEZ.
    10) Gün anahtarı dowIdx (Pzt=0) — avail.sinif yazarlarıyla aynı; getDay() kayması olmamalı.
   REGRESYON KIRMIZISI: "yalnız birebir basılıyor", "yalnız sınıf dersi basılıyor", "ikinci kart düşürülüyor"
   mutasyonları ÜÇÜ FAIL; eski rozet "Planlandı (n)" / "Yapıldı (n)" da kırmızıya düşer.
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
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 91) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ogrt-ders-karti.mjs kosan=" + __kosan + " beklenen=91"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ogrt-ders-karti.mjs:" + __kosan + ":91"); } });

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, gunlukTablo, haftalikOgrtTablo, saatEtiket, KISA_KOD, ogrenciMesajMetni, ogrtGunlukSatirlar, ogrtGunlukSlotlari, dersKartiOgrtGunlukHTML, dersKartiOgrtGunlukBtnHTML, dersKartiOgrtGunlukAc, waAliciBilgisi, dersKartiHTML, dersKartiVeri, dersKartiOgrtHTML, dersKartiUygun };
  `)();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
  process.exit(1);
}
const { DB, ui, gunlukTablo, haftalikOgrtTablo, saatEtiket, KISA_KOD, ogrenciMesajMetni, ogrtGunlukSatirlar, ogrtGunlukSlotlari, dersKartiOgrtGunlukHTML, dersKartiOgrtGunlukBtnHTML, dersKartiOgrtGunlukAc, waAliciBilgisi, dersKartiHTML, dersKartiVeri, dersKartiOgrtHTML, dersKartiUygun } = P;

/* Gelecek SALI (gerçek DB gün eşlemesiyle; dowIdx Pzt=0 ve Date.getDay() Salı=2 aynı takvimi kullanır) */
const gelecekSali = (() => { const d = new Date(); do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 2); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const dowIdxYerel = (k) => (new Date(k + "T12:00:00").getDay() + 6) % 7;
const ogrt = DB.ogretmenler.find(o => o.ad === "SONER AÇIKGÖZ") || DB.ogretmenler[0];
const ogr = DB.ogrenciler.find(o => o.ad === "Ayşe Demir") || DB.ogrenciler[0];
const ogr2 = DB.ogrenciler.find(o => o.id !== ogr.id && o.ad) || DB.ogrenciler[1];
const gunNo = dowIdxYerel(gelecekSali);
ogrt.avail = ogrt.avail || { sinif: {}, musait: [] };
ogrt.avail.sinif = ogrt.avail.sinif || {};
ogrt.avail.musait = Array.isArray(ogrt.avail.musait) ? ogrt.avail.musait : [];
/* Fixture sınıf-dersi slotu: öğretmenin o günkü mevcut avail.sinif kaydından ALINIR (gerçek girdi); yoksa 1. slot */
const sinifSlotAnahtar = Object.keys(ogrt.avail.sinif).filter(k => parseInt(String(k).split("-")[0], 10) === gunNo && String(k).split("-")[1] !== "K")[0];
const sinifSlotNo = sinifSlotAnahtar ? String(sinifSlotAnahtar).split("-")[1] : "1";
const SINIF_SAATLERI = { "1": "08:50", "2": "09:40", "3": "10:30", "4": "11:20", "5": "13:00", "6": "13:50", "7": "14:40", "8": "15:30", "9": "16:20", "10": "17:10", "11": "18:00" };
const sinifSlotSaat = SINIF_SAATLERI[sinifSlotNo];
const temizle = () => { DB.dersler = DB.dersler.filter(l => l.tarih !== gelecekSali); };
const __orijinalSinifKayit = sinifSlotAnahtar ? ogrt.avail.sinif[sinifSlotAnahtar] : undefined;
const sifirGun = () => { temizle(); if (sinifSlotAnahtar) delete ogrt.avail.sinif[sinifSlotAnahtar]; };
const ekleBirebir = (over) => DB.dersler.push(Object.assign({ id: "ks-ogrt-1", donemId: DB.aktifDonemId, ogrenciId: ogr.id, ogrenciAd: ogr.ad, dersId: "mat", konu: "Limit ve Süreklilik", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: gelecekSali, saat: sinifSlotSaat, durum: "planlandi", olusturma: "2026-09-01" }, over));
const ekleEkDers = (over) => { if (!Array.isArray(DB.ekDersler)) DB.ekDersler = []; const kayit = Object.assign({ id: "ks-ogrt-ek", donemId: DB.aktifDonemId, sinif: "12 SAY 1", dersId: "mat", konu: "Türev", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: gelecekSali, saat: SINIF_SAATLERI["3"], kod: "3", durum: "planlandi", olusturma: "2026-09-01" }, over); DB.ekDersler.push(kayit); return kayit; };
const gunlukHTML = () => { ui.gunSecim = gelecekSali; return gunlukTablo(); };

/* ---- 1) Tanım + öğrenci yolu korunur ---- */
console.log("1) Tanımlar ve öğrenci kart yolu birebir:");
t("ogrtGunlukSatirlar tanımlı", typeof ogrtGunlukSatirlar === "function");
t("ogrtGunlukSlotlari tanımlı (yatay kolon modeli)", typeof ogrtGunlukSlotlari === "function");
t("dersKartiOgrtGunlukHTML tanımlı", typeof dersKartiOgrtGunlukHTML === "function");
t("dersKartiOgrtGunlukBtnHTML tanımlı", typeof dersKartiOgrtGunlukBtnHTML === "function");
t("dersKartiOgrtGunlukAc tanımlı", typeof dersKartiOgrtGunlukAc === "function");
t("öğrenci yolu: dersKartiAc çağrıları sayısı değişmedi (app'ta tanımlı)", (appKaynak.match(/function dersKartiAc\(/g) || []).length === 1);
t("öğrenci kart HTML dersKartiGovde id'yi kullanır; öğrenci + öğretmen-tek-ders + öğretmen-tam-gün = 3 paylaşım", (appKaynak.match(/id="dersKartiGovde"/g) || []).length === 3);

/* ---- 2) YATAY kolon modeli — fixture (a) SALI: hem sınıf dersi hem birebir ---- */
console.log("2) Yatay kolon modeli (gerçek avail.sinif + gerçek ders kaydı):");
sifirGun();
const sinifDeger = "12 SAY 1";
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
ekleBirebir({});
const slotlarA = ogrtGunlukSlotlari(ogrt.id, gelecekSali);
t("(a) kolon sayısı 11 (KISA_KOD; ÖĞLE kolonu YOK)", slotlarA.length === 11, String(slotlarA.length));
t("(a) kolon sırası KISA_KOD 1..11", slotlarA.every((s, i) => s.no === String(i + 1)));
t("(a) kolon başlığı gerçek saat aralığı (b-e)", slotlarA[0].b === "08:50" && slotlarA[0].e === "09:30" && slotlarA[10].b === "18:00");
t("(a) sınıf dersi o slottaki kolonda VAR", slotlarA.find(s => s.no === sinifSlotNo).ogeler.some(o => o.tur === "Sınıf dersi"));
t("(a) birebir o slottaki kolonda VAR", slotlarA.find(s => s.no === sinifSlotNo).ogeler.some(o => o.tur === "Birebir"));
t("(a) Sınıf dersi ögesi: Öğrenci '—', Konu '—' (UYDURMA YOK)", (() => { const o = slotlarA.find(s => s.no === sinifSlotNo).ogeler.find(x => x.tur === "Sınıf dersi"); return o.ogrenci === "—" && o.konu === "—"; })());
t("(a) Birebir ögesi: gerçek ad + gerçek konu + DB.ogrenciler[].sinif", (() => { const o = slotlarA.find(s => s.no === sinifSlotNo).ogeler.find(x => x.tur === "Birebir"); return o.ogrenci === ogr.ad && o.konu === "Limit ve Süreklilik" && o.sinif === (ogr.sinif || "Sınıf belirtilmemiş"); })());
t("(a) satır modeli de slot artan ve aynı içerikte (ekran sırası)", (() => { const satirlar = ogrtGunlukSatirlar(ogrt.id, gelecekSali); return satirlar.length === 2 && satirlar.every((r, i) => i === 0 || satirlar[i - 1].slot <= r.slot) && satirlar[0].tur === "Sınıf dersi"; })());
const hA = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
t("(a) HTML'de her iki öge de basılıyor (yalnız-birebir mutasyonu kırmızı olur)", hA.includes("Sınıf dersi") && hA.includes("Birebir"));
/* DÖNGÜ-17 sözleşme değişikliği: 11 kolon → 12 görsel kolon (Mola, 4 ile 5 arası) · başlık 3 satır (no/b/e) · ÖĞLE (12:10) yine YOK. Eski assertion güncellendi. */
t("(a) HTML'de 12 görsel kolon başlığı (11 ders + Mola) ve ÖĞLE (12:10) YOK", (() => { const baslikSatiri = (hA.match(/<tr style="background:#f8fafc">[\s\S]*?<\/tr>/) || [""])[0]; const thler = (baslikSatiri.match(/<th[\s\S]*?<\/th>/g) || []); return thler.length === 13 && !baslikSatiri.includes("12:10") && baslikSatiri.includes(">Mola<"); })(), "th sayısı=" + ((hA.match(/<tr style="background:#f8fafc">[\s\S]*?<\/tr>/) || [""])[0].match(/<th/g) || []).length);
t("(a) görsel sıra tam: 1,2,3,4,Mola,5..11 (başlık satırı)", (() => { const baslikSatiri = (hA.match(/<tr style="background:#f8fafc">[\s\S]*?<\/tr>/) || [""])[0]; const sira = (baslikSatiri.match(/>(\d{1,2}|Mola)</g) || []).map(x => x.slice(1, -1)); return JSON.stringify(sira) === JSON.stringify(["1","2","3","4","Mola","5","6","7","8","9","10","11"]); })());
t("(a) başlık 3 satırlı ve b/e EŞİT stil (PNG)", (() => { const m = hA.match(/<div style="font-size:11px;font-weight:800;color:#475569">1<\/div><div style="font-size:9px;font-weight:600;color:#94a3b8">08:50<\/div><div style="font-size:9px;font-weight:600;color:#94a3b8">09:30<\/div>/); return !!m; })());

/* ---- 3) Sınıf dersi = rose kartta YALNIZ sınıf adı; birebir = ad · konu · sınıf ---- */
console.log("3) Hücre içerik sözleşmesi (ekranla birebir):");
sifirGun();
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
const hS = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
/* YASAK taraması kart segmentiyle sınırlı: başlık alt satırı branşı (MATEMATİK) meşru basar; rose kartına sızarsa kırmızı */
const segS = hS.slice(hS.indexOf('title="Sınıf dersi'), hS.indexOf("</td>", hS.indexOf('title="Sınıf dersi')));
t("(b-öncesi) sınıf kartı içinde YALNIZ sınıf adı; DERS/KONU uydurma YOK", hS.includes("background:#ffe4e6") && segS.includes(sinifDeger) && !segS.includes("MATEMATİK"), "DERS adı rose kartta sızarsa kırmızı (başlıktaki branş adı sayılmaz)");
sifirGun();
ekleBirebir({});
const hB1 = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
/* YASAK taraması kart segmentiyle sınırlı: başlık alt satırı branşı meşru basar; birebir kartına sızarsa kırmızı */
const segB = hB1.slice(hB1.indexOf('title="Birebir"'), hB1.indexOf("</td>", hB1.indexOf('title="Birebir"')));
t("(c-öncesi) birebir kartında DERS adı YOK (birebirHucreHTML ile aynı)", segB.includes(ogr.ad) && segB.includes("Limit ve Süreklilik") && !segB.includes("MATEMATİK"), "DERS adı birebir kartına sızarsa kırmızı (başlıktaki branş adı sayılmaz)");
t("(c-öncesi) konu boş → 'Genel tekrar' dalı", (() => { const kayit = DB.dersler.find(l => l.id === "ks-ogrt-1"); kayit.konu = ""; const h = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali); kayit.konu = "Limit ve Süreklilik"; return h.includes("Genel tekrar"); })());
t("(c-öncesi) konu = ders adı ile aynıysa → 'Genel tekrar' (birebirHucreHTML konu kuralı)", (() => { const kayit = DB.dersler.find(l => l.id === "ks-ogrt-1"); kayit.konu = "MATEMATİK"; const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); kayit.konu = "Limit ve Süreklilik"; return r[0].konu === "Genel tekrar"; })());
t("(c-öncesi) öğrenci sinif alanı boşsa 'Sınıf belirtilmemiş'", (() => { const eski = ogr.sinif; ogr.sinif = ""; const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); ogr.sinif = eski; return r[0].sinif === "Sınıf belirtilmemiş"; })());

/* ---- 4) Fixture (b) yalnız sınıf dersi ---- */
console.log("4) Fixture (b) yalnız sınıf dersi:");
sifirGun();
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
const slotlarB = ogrtGunlukSlotlari(ogrt.id, gelecekSali);
t("(b) yalnız sınıf dersi ögesi (birebir YOK)", slotlarB.find(s => s.no === sinifSlotNo).ogeler.length === 1 && slotlarB.find(s => s.no === sinifSlotNo).ogeler[0].tur === "Sınıf dersi", JSON.stringify(slotlarB.find(s => s.no === sinifSlotNo).ogeler));
const hB = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
t("(b) HTML'de sınıf dersi basılıyor (yalnız-sınıf mutasyonu kırmızı olur)", hB.includes("Sınıf dersi") && hB.includes(sinifDeger));
t("(b) HTML'de birebir kartı YOK (title='Birebir' yok)", !hB.includes('title="Birebir"'));
t("(b) rozet hepsi planlı → 'Planlandı' (ESKİ 'Planlandı (n)' KALDIRILDI)", (() => { const m = hB.match(/border-radius:99px">([^<]+)</); return m && m[1] === "Planlandı"; })(), hB.slice(hB.indexOf("border-radius:99px") - 60, hB.indexOf("border-radius:99px") + 60));

/* ---- 5) Fixture (c) yalnız birebir ---- */
console.log("5) Fixture (c) yalnız birebir:");
sifirGun();
ekleBirebir({});
const slotlarC = ogrtGunlukSlotlari(ogrt.id, gelecekSali);
t("(c) yalnız birebir ögesi (sınıf dersi YOK)", slotlarC.find(s => s.no === sinifSlotNo).ogeler.length === 1 && slotlarC.find(s => s.no === sinifSlotNo).ogeler[0].tur === "Birebir", JSON.stringify(slotlarC.find(s => s.no === sinifSlotNo).ogeler));
const hC = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
t("(c) HTML'de birebir basılıyor (yalnız-birebir-düşürme mutasyonu kırmızı olur)", hC.includes('title="Birebir"') && hC.includes(ogr.ad));
t("(c) HTML'de sınıf dersi kartı YOK", !hC.includes("background:#ffe4e6"));
t("(c) rozet hepsi planlı → 'Planlandı'", (() => { const m = hC.match(/border-radius:99px">([^<]+)</); return m && m[1] === "Planlandı"; })());

/* ---- 6) Fixture (d) AYNI slotta ikisi → 2 kart ALT ALTA + ÇAKIŞMA ---- */
console.log("6) Fixture (d) aynı slot çakışması:");
sifirGun();
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
ekleBirebir({}); /* birebir saatini sınıf dersi slotuna bilerek çakıştır */
const slotlarD = ogrtGunlukSlotlari(ogrt.id, gelecekSali);
t("(d) aynı slotta İKİ öge ALT ALTA (ezme/birleştirme YOK)", slotlarD.find(s => s.no === sinifSlotNo).ogeler.length === 2, JSON.stringify(slotlarD.find(s => s.no === sinifSlotNo).ogeler.map(o => o.tur)));
t("(d) her iki ögeye ÇAKIŞMA işareti", slotlarD.find(s => s.no === sinifSlotNo).ogeler.every(o => o.cakisma));
const hD = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
t("(d) HTML'de 2 × ÇAKIŞMA rozeti (ikinci kart düşürülüyor mutasyonu kırmızı olur)", (hD.match(/ÇAKIŞMA/g) || []).length === 2, String((hD.match(/ÇAKIŞMA/g) || []).length));
t("(d) HTML'de iki kart aynı hücrede (tek <td> içinde 2 kart bloğu)", (() => { const i = hD.indexOf("ÇAKIŞMA"); const tdBas = hD.lastIndexOf("<td", i); const tdSon = hD.indexOf("</td>", i); const seg = hD.slice(tdBas, tdSon); return (seg.match(/ÇAKIŞMA/g) || []).length === 2 && seg.includes("Sınıf dersi") && seg.includes("Birebir"); })());
t("(d) rozet karışık → 'Kısmen tamamlandı' YOK (ikisi de planlı) → 'Planlandı'", (() => { const m = hD.match(/border-radius:99px">([^<]+)</); return m && m[1] === "Planlandı"; })());

/* ---- 7) Fixture (e) mola/boş slot/Kapalı → çıktıda yok; Ek Ders HARİÇ ---- */
console.log("7) Fixture (e) mola, boş slot, Kapalı, Ek Ders:");
t("(e) K (mola) anahtarlı avail kaydı öge üretmez", (() => { const k = gunNo + "-K"; ogrt.avail.sinif[k] = sinifDeger; const r = ogrtGunlukSlotlari(ogrt.id, gelecekSali).filter(s => s.ogeler.some(o => String(o.saatYazi).indexOf("12:00") >= 0 || o.slot === 12)); delete ogrt.avail.sinif[k]; return r.length === 0; })());
t("(e) bilinmeyen slot anahtarı ('9x') öge üretmez (uydurma YOK)", (() => { sifirGun(); const k = gunNo + "-9x"; ogrt.avail.sinif[k] = sinifDeger; const n = ogrtGunlukSatirlar(ogrt.id, gelecekSali).length; delete ogrt.avail.sinif[k]; return n === 0; })());
t("(e) boş gün → tüm kolonlar boş", (() => { sifirGun(); return ogrtGunlukSlotlari(ogrt.id, gelecekSali).every(s => s.ogeler.length === 0); })());
t("(e) Kapalı (musait) slot → HTML'de gri '—' hücre, öge YOK", (() => { const k = gunNo + "-" + sinifSlotNo; ogrt.avail.musait.push(k); ogrt.avail.sinif[k] = sinifDeger; const h = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali); ogrt.avail.musait.pop(); return h.includes("background:#f1f5f9") && h.includes(">—</span>"); })());
t("(e) Ek Ders kaydı görselleşmez (ekran ölçütü) ama satır varlığı ETKİLEMEZ — buton YOK", (() => { sifirGun(); ekleEkDers({}); const n = ogrtGunlukSatirlar(ogrt.id, gelecekSali).length; const g = gunlukHTML(); const butonVar = g.includes("dersKartiOgrtGunlukAc('" + ogrt.id + "'"); DB.ekDersler = DB.ekDersler.filter(l => l.id !== "ks-ogrt-ek"); return n === 0 && !butonVar; })());
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

/* ---- 9) Başlık + rozet üçlüsü ---- */
console.log("9) Başlık ve rozet:");
const baslikHTML = (() => { sifirGun(); ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger; const h = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali); return h; })();
t("başlık 'ÖĞRETMEN — <AD SOYAD>'", baslikHTML.includes("ÖĞRETMEN — " + ogrt.ad.toUpperCase()));
t("alt satır: branş + gün adı + gg.aa.yyyy (tek gün; haftalık aralık YOK)", (() => { const gunAdi = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"][gunNo]; const tr = gunKey => { const p = gunKey.split("-"); return p[2] + "." + p[1] + "." + p[0]; }; return baslikHTML.includes("MATEMATİK") && baslikHTML.includes(gunAdi) && baslikHTML.includes(tr(gelecekSali)) && !baslikHTML.includes("–"); })(), "haftalık aralık tire'si sızarsa kırmızı");
t("rozet üçlüsü dal kapsamı: karışık → 'Kısmen tamamlandı'", (() => { sifirGun(); ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger; ekleBirebir({}); ekleBirebir({ id: "ks-ogrt-t2", saat: SINIF_SAATLERI["4"], durum: "tamamlandi" }); const h = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali); sifirGun(); return h.includes("Kısmen tamamlandı"); })());
t("rozet üçlüsü dal kapsamı: hepsi tamamlandi → 'Yapıldı' (ESKİ 'Yapıldı (n)' KALDIRILDI)", (() => { sifirGun(); ekleBirebir({ id: "ks-ogrt-t3", durum: "tamamlandi" }); const h = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali); sifirGun(); const m = h.match(/border-radius:99px">([^<]+)</); return m && m[1] === "Yapıldı"; })());
t("rozet kaynağı satır durumları (sınıf dersi 'planlı' sayılır)", (() => { ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger; ekleBirebir({ id: "ks-ogrt-t4", durum: "tamamlandi" }); const h = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali); sifirGun(); const m = h.match(/border-radius:99px">([^<]+)</); return m && m[1] === "Kısmen tamamlandı"; })());

/* ---- 10) Dosya adı + WA hedefi ---- */
console.log("10) Dosya adı ve WA hedefi:");
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

/* ---- 11) Negatif/veri değişmezlik + kapsam ---- */
console.log("11) Veri değişmezlik ve kapsam:");
const keysOnce = Object.keys(store).length;
sifirGun();
ogrt.avail.sinif[sinifSlotAnahtar || gunNo + "-" + sinifSlotNo] = sinifDeger;
ekleBirebir({});
gunlukHTML(); /* render tekrar — buton çizimi localStorage'a yazmamalı */
t("buton çizimi localStorage'a YAZMAZ", Object.keys(store).length === keysOnce, JSON.stringify(Object.keys(store)));
t("grup birebir TAM programda görünür (grupHarici kesmesi kaldırıldı)", (() => { temizle(); ekleBirebir({ id: "ks-ogrt-g", ogrenciIds: [ogr.id, ogr2.id] }); const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); const ok = r.some(x => x.tur === "Birebir" && x.ogrenci.includes(ogr.ad) && x.ogrenci.includes(ogr2.ad)); temizle(); return ok; })());
t("ogretmenAd fallback dalı: ogrtId'siz kayıt ad eşlemesiyle görünür", (() => { sifirGun(); temizle(); ekleBirebir({ id: "ks-ogrt-of", ogretmenId: null }); const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); temizle(); return r.length === 1 && r[0].tur === "Birebir"; })());
t("saat-kod fallback dalı: aralık-içi saat ('08:55') 1. kolona düşer", (() => { sifirGun(); temizle(); ekleBirebir({ id: "ks-ogrt-sk", saat: "08:55" }); const s = ogrtGunlukSlotlari(ogrt.id, gelecekSali).find(x => x.no === "1"); temizle(); return s.ogeler.length === 1 && s.ogeler[0].tur === "Birebir"; })());
t("mola saati ('12:15') öge üretmez (ekran da göstermez)", (() => { sifirGun(); temizle(); ekleBirebir({ id: "ks-ogrt-mola", saat: "12:15" }); const n = ogrtGunlukSatirlar(ogrt.id, gelecekSali).length; temizle(); return n === 0; })());
t("iptal birebir satır üretmez", (() => { sifirGun(); ekleBirebir({ id: "ks-ogrt-i", durum: "iptal" }); const r = ogrtGunlukSatirlar(ogrt.id, gelecekSali); sifirGun(); return r.length === 0; })());
t("GÜN ANAHTARI dowIdx (Pzt=0): diğer günün avail kaydı sızmaz", (() => { const diger = (gunNo + 1) % 7; const k = diger + "-" + sinifSlotNo; ogrt.avail.sinif[k] = sinifDeger; const n = ogrtGunlukSatirlar(ogrt.id, gelecekSali).length; delete ogrt.avail.sinif[k]; return n === 0; })());
t("başka günün birebir kaydı sızmaz", (() => { temizle(); ekleBirebir({ id: "ks-ogrt-bg", tarih: "2030-01-07" }); const n = ogrtGunlukSatirlar(ogrt.id, gelecekSali).length; temizle(); return n === 0; })());
t("süit test.mjs'te tam 1 kez kayıtlı", (testKaynak.match(/ks-ogrt-ders-karti\.mjs/g) || []).length === 1);

/* Fixture temizliği: gerçek avail kaydı geri konur (restore, idempotent değil — SONDA tam 1 kez) */
if (sinifSlotAnahtar) ogrt.avail.sinif[sinifSlotAnahtar] = __orijinalSinifKayit;
sifirGun();
console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
/* ---- DÖNGÜ-17 HİZALAMA ASSERTION'LARI (onaylı ek kapılar; gerçek üretilen HTML'den) ---- */
console.log("D17) Öğretmen tabloları ve PNG hizalama:");
ui.haftalikOgrtId = ogrt.id;
sifirGun();
ekleBirebir({ id: "d17-hafta-1", saat: SINIF_SAATLERI["4"] });
ekleBirebir({ id: "d17-hafta-2", saat: SINIF_SAATLERI["5"] });
const haftaHTML = haftalikOgrtTablo();
sifirGun();
ekleBirebir({ id: "d17-gunluk-1" });
const gunlukHTMLD17 = gunlukTablo();
const pngHTML = dersKartiOgrtGunlukHTML(ogrt.id, gelecekSali);
/* 1) Haftalık BAŞLIK satırında veri hücresi sayısı tam 12 */
t("D17-1 haftalık başlık veri hücresi = 12", (() => { const tr = (haftaHTML.match(/<tr[^>]*>\s*<th[\s\S]*?<\/tr>/) || [""])[0]; return (tr.match(/<th/g) || []).length === 13; })()); /* GÜN başlık th + 12 veri kolonu */
/* 2) Haftalık HER gövde satırında veri hücresi = 12 */
t("D17-2 haftalık her gövde satırında 12 hücre", (() => { const satirlar = haftaHTML.match(/<tr class="border-b[^>]*>[\s\S]*?<\/tr>/g) || []; return satirlar.length === 7 && satirlar.every(tr => (tr.match(/<td/g) || []).length === 13); })()); /* GUN td + 12 veri */
/* 3) Görsel sıra: 1,2,3,4,Mola,5..11 (haftalık başlık) */
t("D17-3 haftalık görsel sıra 1,2,3,4,Mola,5..11", (() => { const tr = (haftaHTML.match(/<tr[^>]*>\s*<th[\s\S]*?<\/tr>/) || [""])[0]; const sira = (tr.match(/>(\d{1,2}|Mola)</g) || []).map(x => x.slice(1, -1)); return JSON.stringify(sira) === JSON.stringify(["1","2","3","4","Mola","5","6","7","8","9","10","11"]); })());
/* 4) "+ istek"/drop-zone 11 KALIR; Mola hücresinde draggable/drop/+ YOK */
t("D17-4a haftalıkta 7 Mola hücresi ve hiçbiri drop/drag içermiyor", (() => { const molaTds = (haftaHTML.match(/bg-emerald-50">[\s\S]*?<\/td>/g) || []).filter(x => x.includes("Mola")); return molaTds.length === 7 && molaTds.every(m => !m.includes("dnd-bos") && !m.includes("dnd-kilit") && !m.includes("istekBurak") && !m.includes("draggable")); })());
t("D17-4c her drop-zone hücresinin data-drop-saat'i kendi slotun GERÇEK başlangıcı; 12:00 (mola) ASLA drop değil", (() => { const zorlar = (haftaHTML.match(/data-drop-saat="([^"]+)"/g) || []).map(x => x.slice(16, -1).replace('data-drop-saat="', '')); const gercek = KISA_KOD.map(k => k.b); return zorlar.length > 0 && zorlar.every(z => gercek.includes(z)) && !zorlar.includes("12:00"); })());
t("D17-4b mola hücresinde draggable/drop/+ istek YOK", (() => { const m = haftaHTML.match(/bg-emerald-50">[\s\S]*?<\/td>/) || [""]; const h = m[0]; return !h.includes("draggable") && !h.includes("istekBurak") && !h.includes("dnd-bos") && !h.includes(">+</span>"); })());
/* 5) 5. ders Mola'dan SONRA doğru görsel kolonda + doğru drop hedefi */
t("D17-5 5. ders Mola'dan SONRA doğru görsel kolonda ve doğru drop hedefiyle görünür", (() => { sifirGun(); ekleBirebir({ id: "d17-slot5", saat: "15:30" }); const g = gunlukTablo(); sifirGun(); const molaIdx = g.indexOf(">Mola<"); const dersIdx = g.indexOf(">Limit ve Süreklilik<"); const dropIdx = g.indexOf('data-drop-saat="15:30"');
      /* drop hedefi: haftalık tabloda 15:30 boşsa VAR; günlükte tek satır dolu olduğundan günlükte drop-zone beklenmez.
         Kritik: günlükte MOLA konumunda data-drop-saat="12:00" uydurulmaz. */
      const haftaD = haftalikOgrtTablo();
      return molaIdx >= 0 && dersIdx > molaIdx && !g.includes('data-drop-saat="12:00"') && haftaD.includes('data-drop-saat="15:30"'); })());
/* 6) Günlük ekran ve PNG AYNI GÖRSEL SLOT SIRASI (veri modeli 11 ders slotu kalır) */
t("D17-6 günlük ekran ve PNG aynı görsel slot sırası", (() => { const sira = (h) => { const tr = (h.match(/<tr[^>]*>\s*<th[\s\S]*?<\/tr>/) || [""])[0]; return (tr.match(/>(\d{1,2}|Mola)</g) || []).map(x => x.slice(1, -1)); }; return JSON.stringify(sira(gunlukHTMLD17)) === JSON.stringify(sira(pngHTML)) && JSON.stringify(sira(pngHTML)) === JSON.stringify(["1","2","3","4","Mola","5","6","7","8","9","10","11"]); })());
/* 7) PNG başlık hücre sayısı = gövde hücre sayısı (13 = GÜN + 12) */
t("D17-7 PNG başlık th = gövde td = 13 (GÜN + 12 kolon)", (() => { const trs = pngHTML.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []; const baslik = trs.find(tr => tr.includes("<th")); const govde = trs.find(tr => tr.includes("<td") && !tr.includes("<th")); return baslik && govde && (baslik.match(/<th/g) || []).length === 13 && (govde.match(/<td/g) || []).length === 13; })());
/* 8) PNG b/e EŞİT font; günlük+haftalık da öyle */
t("D17-8 PNG başlık b/e eşit font (24 çift div eşit stil)", (() => { return (pngHTML.match(/font-size:9px;font-weight:600/g) || []).length === 24; })());
t("D17-8b günlük ekran b/e eşit stil (24 çift)", (() => { return (gunlukHTMLD17.match(/text-\[9px\] font-semibold/g) || []).length === 24; })());
t("D17-8c haftalık ekran b/e eşit stil (24 çift)", (() => { return (haftaHTML.match(/text-\[9px\] font-semibold/g) || []).length === 24; })());
/* PNG korumaları: marka, footer, tarih satırı büyüklüğü */
t("D17-9 PNG marka 'Formül Kurs' + alt başlık 'Günlük Ders Programı' KORUNDU", (() => { const i0 = pngHTML.indexOf("Günlük Ders Programı"); const seg = pngHTML.slice(Math.max(0, i0 - 260), i0 + 60); return seg.includes("Formül Kurs"); })());
t("D17-9b PNG footer YOK", !pngHTML.includes("Bu kart YKS Birebir Takip"));
t("D17-9c PNG tarih/gün satırı büyütüldü (font-size:14px;font-weight:700)", (() => { const i = pngHTML.indexOf("Branş yok"); const seg = i >= 0 ? pngHTML.slice(Math.max(0, i - 220), i) : ""; return seg.includes("font-size:14px;font-weight:700") || (() => { const j = pngHTML.indexOf(" · "); return (pngHTML.match(/font-size:14px;font-weight:700/g) || []).length >= 1; })(); })());
t("D17-9d öğretmen TEK-DERS kartı footer + marka KORUNDU (kapsam dışı)", (() => { sifirGun(); ekleBirebir({ id: "d17-tek" }); const h = dersKartiOgrtHTML(DB.dersler[DB.dersler.length - 1]); sifirGun(); return h.includes("Bu kart YKS Birebir Takip") && h.includes("YKS Birebir Takip"); })());
/* Koruma: öğrenci PNG + WA + saatEtiket */
t("D17-10 öğrenci PNG kartı değişmedi (footer YOK + bento zemini + saatKisa)", (() => { sifirGun(); ekleBirebir({ id: "d17-ogr", saat: "15:30" }); const d = DB.dersler[DB.dersler.length - 1]; const h = dersKartiHTML(d); const v = dersKartiVeri(d); sifirGun(); return !h.includes("Bu kart YKS") && h.includes("background:#f4f6fa") && v.saatKisa === "15:30-16:10"; })());
t("D17-11 saatEtiket AYNI ('8 · 15:30-16:10' üretir)", saatEtiket("15:30") === "8 · 15:30-16:10");
t("D17-12/D25 WA mesajında '8 · ' YOK + gerçek aralık VAR (saatEtiket D17-11 kilitli)", (() => { sifirGun(); ekleBirebir({ id: "d17-wa", saat: "15:30" }); const f = ui.filtre; ui.filtre = "tumu"; const m = ogrenciMesajMetni(ogr.id); ui.filtre = f; sifirGun(); return !!m && !m.includes("8 · ") && m.includes("15:30 - 16:10"); })());

process.exit(fail ? 1 : 0);
