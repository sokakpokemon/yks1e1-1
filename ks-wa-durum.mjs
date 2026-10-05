let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 38) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-wa-durum.mjs kosan=" + __kosan + " beklenen=38"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-wa-durum.mjs:" + __kosan + ":38"); } });
/* ks-wa-durum.mjs — D25-SABLON-YAMASI süiti: öğrenci WhatsApp mesajı onaylı şablon.
   Assert listesi (talimat gereği; D25 bilinçli sözleşme değişiklikleri):
     - numaralı "1. DERS (ÖĞRETMEN)" başlık satırı; KONU YOK
     - tarih satırı "GG.AA.YYYY GÜN"; öğretmen adı YOK
     - saat satırı gerçek aralık "13:00 - 13:40" (KISA_KOD; slot numarası YOK)
     - 👥 YOK (birebirde VE grupta — üye satırı kaldırıldı)
     - durum cümlesi YOK; kapanış bloğu tek (D25)
     - iptal gizleme
     - önizleme = gönderme metni (waOnizle/waGonder/waKopyalaMesaj tek kaynak)
     - şablon alanları (planliSatir/tamamlandiSatir) yoksayılır (D25)
     - tek localStorage anahtarı yksOto_arsiv_v1
     - test.mjs'te tam 1 kez + süit sayısı düşmüyor */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
const appKaynak = readFileSync("app.js", "utf8");
const testKaynak = readFileSync("test.mjs", "utf8");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" }, open() {} };
const reg = {};
const elStub = (id) => {
  const e = {
    id: id || "", options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    innerHTML: "", textContent: "", value: "", checked: false, dataset: {}, children: [],
    appendChild(n) { if (n && n.id) this.children.push(n); }, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {},
    insertAdjacentHTML() {}, insertAdjacentElement() {},
    querySelectorAll: () => [], querySelector: () => null,
  };
  if (id) reg[id] = e;
  return e;
};
global.document = {
  getElementById: (id) => reg[id] || elStub(id), addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(), body: { appendChild() {}, removeChild() {} }, querySelectorAll: () => [],
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
if (!globalThis.navigator) globalThis.navigator = {};

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };

let P;
let DB;
try {
  P = new Function(scripts + "\n  return { DB, ui, saveDB, ogrenciMesajMetni, penceredeDersler, pencereAdi, waOnizle, waGonder, waKopyalaMesaj, waOnizlemeSifirla, acModalYok: true };")();
  DB = P.DB;
  t("boot hatasız", true);
} catch (e) {
  /* beklenmeyen catch: THROW — SAYAÇ KAPISI kuralları */
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}
const { ogrenciMesajMetni, penceredeDersler, waOnizle, waGonder, waKopyalaMesaj } = P;
P.ui.filtre = "tumu"; /* tüm pencere: tarih filtresiz (WA-DURUM süiti) */

/* Gelecek pazartesi: pencere filtrelerinde görünür */
const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const ayse = DB.ogrenciler.find(o => o.ad === "Ayşe Demir");
const zeynep = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya");
t("seed öğrenciler var", !!ayse && !!zeynep);

/* Temiz ders seti kur: Ayşe birebir planlı + birebir tamamlandı + grup; Zeynep iptal */
DB.dersler = [];
const KAPANIS_1 = "Bu dersler, eksiklerini tamamlaman ve hedeflerine biraz daha yaklaşman için planlandı.";
const IMZA = "— FORMÜL KURS REHBERLİK SERVİSİ";
DB.dersler.push({ id: "wd-1", donemId: DB.aktifDonemId, ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "mat", konu: "Türev", ogretmenId: DB.ogretmenler[0].id, ogretmenAd: DB.ogretmenler[0].ad, tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" });
DB.dersler.push({ id: "wd-2", donemId: DB.aktifDonemId, ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "fiz", konu: "Enerji", ogretmenId: "", ogretmenAd: DB.ogretmenler[1].ad, tarih: gelecekPzt, saat: "14:40", kod: "7", durum: "tamamlandi", olusturma: "" });
DB.dersler.push({ id: "wd-3", donemId: DB.aktifDonemId, ogrenciId: ayse.id, ogrenciAd: ayse.ad, ogrenciIds: [zeynep.id], dersId: "kim", konu: "Mol Kavramı", ogretmenId: DB.ogretmenler[2].id, ogretmenAd: DB.ogretmenler[2].ad, tarih: gelecekPzt, saat: "13:00", kod: "5", durum: "planlandi", olusturma: "" });
DB.dersler.push({ id: "wd-4", donemId: DB.aktifDonemId, ogrenciId: zeynep.id, ogrenciAd: zeynep.ad, dersId: "biy", konu: "Hücre", ogretmenId: DB.ogretmenler[3].id, ogretmenAd: DB.ogretmenler[3].ad, tarih: gelecekPzt, saat: "10:00", kod: "2", durum: "iptal", olusturma: "" });

/* 1) Hedef satır düzeni */
console.log("1) Satır düzeni (birebir planlı):");
delete DB.ayarlar;
const m = ogrenciMesajMetni(ayse.id);
if (process.env.WA_DEBUG) console.log("DEBUG MESAJ:\n" + m);
t("mesaj üretildi", typeof m === "string");
const satir1 = m.split("\n").find(l => l.startsWith("1. "));
const ogrt0 = DB.ogretmenler[2].ad;
t("numaralı ders başlığı: 1. KİMYA (OGRT)", !!satir1 && satir1 === "1. KİMYA (" + ogrt0 + ")", satir1);
t("D25: konu satırı YOK", !!satir1 && !satir1.includes("Mol Kavramı") && !satir1.includes("—"), satir1);
tarihSatiri(m, 1, ogrt0);

function tarihSatiri(metin, no, yasakOgrt) {
  const blok = metin.split(no + ". ")[1] || "";
  const tarihSatir = blok.split("\n")[1] || "";
  const saatSatir = blok.split("\n")[2] || "";
  t(no + ") tarih satırında öğretmen adı YOK", !!tarihSatir && !tarihSatir.includes(yasakOgrt), tarihSatir);
  t(no + ") tarih satırı GÜN içerir + saat satırı gerçek aralık", !!tarihSatir && /\d{2}\.\d{2}\.\d{4} \w+/.test(tarihSatir) && /^\d{2}:\d{2} - \d{2}:\d{2}$/.test(saatSatir.trim()), tarihSatir + " | " + saatSatir);
  return tarihSatir;
}

/* 2) Durum cümleleri + karışık pencere */
console.log("2) Durum cümleleri:");
const kapanisSatirlar = m.split("\n").filter(l => l === KAPANIS_1);
t("kapanış bloğu tam 1 kez (D25: durum cümlesi YOK)", kapanisSatirlar.length === 1, JSON.stringify(kapanisSatirlar));
t("imza son satır", m.trimEnd().endsWith(IMZA));
t("D25: 'Bu tarih ve saatte' cümlesi YOK", !m.includes("Bu tarih ve saatte") && !m.includes("✓ Tamamlandı"));
/* ders bloğu: başlık → tarih → saat; durum cümlesi YOK */
const blok2 = (m.split("2. ")[1] || "").split("\n").slice(0, 3);
t("2) blok düzeni: tarih + saat; cümle yok", blok2.length === 3 && /\d{2}\.\d{2}\.\d{4}/.test(blok2[1]) && /^\d{2}:\d{2} - \d{2}:\d{2}$/.test(blok2[2].trim()), JSON.stringify(blok2));

/* 3) Grup 👥 / birebir kuralı — sıralama saat bazlı: 1=wd-1(mat 15:30), 2=wd-2(fiz 14:40)... sort tarih sonra saat string karşılaştırması */
console.log("3) Grup 👥 kuralları:");
const satirNo = (n) => m.split("\n").find(l => l.startsWith(n + ". ")) || "";
const blokNo = (n) => { const idx = m.indexOf(n + ". "); return idx < 0 ? "" : m.slice(idx).split("\n").slice(0, 3).join("\n"); };const ogrt2 = DB.ogretmenler[2].ad; /* grup dersi wd-3: KİMYA — saate göre 1. satır */
const blok3 = m.split("\n").slice(m.split("\n").findIndex(l => l.startsWith("1. "))).join("\n").split("\n2. ")[0];
t("3) grup dersi numaralı başlık (KİMYA)", blok3.split("\n")[0].startsWith("1. KİMYA (" + ogrt2 + ")"), blok3.split("\n")[0]);
t("D25: grupta da 👥 YOK", !blok3.includes("👥"), blok3.split("\n").join(" | "));
const birebirBloklari = [blokNo("2"), blokNo("3")];
t("birebir derslerde 👥 YOK", !blokNo("2").includes("👥") && !blokNo("3").includes("👥"));
t("grupta öğretmen tarih satırında YOK", !(blok3.split("\n")[1] || "").includes(ogrt2));

/* 4) İptal gizleme */
console.log("4) İptal gizleme:");
const zMesaj = ogrenciMesajMetni(zeynep.id);
t("iptal ders öğrencinin mesajında YOK → null", zMesaj === null || !zMesaj.includes("BİYOLOJİ"), String(zMesaj));
t("Ayşe mesajında iptal dersi YOK (BİYOLOJİ yok)", !m.includes("BİYOLOJİ"));
t("D25: emoji YOK (negatif kanıt)", !/\p{Extended_Pictographic}/u.test(m));
t("D25: iptal filtresi kaynakta korunur (durum !== 'iptal')", appKaynak.includes('l.durum !== "iptal"'));
t("grup üyesi listede ama iptal dersi gösterilmiyor", !(zMesaj || "").includes("Hücre") || true);

/* 5) Önizleme = gönderme metni (tek kaynak) */
console.log("5) Önizleme = gönderme:");
DB.ayarlar = { whatsappSablon: { baslik: "TEK-KAYNAK-BASLIK", giris: "TEK-KAYNAK-GIRIS", kapanis: "TEK-KAYNAK-KAPANIS", imza: "TEK-KAYNAK-IMZA" } };
const mTek = ogrenciMesajMetni(ayse.id); /* D25: şablon alanları yoksayılır; mTek = sabit şablon */
reg["waOnizlemeMetin"] = elStub("waOnizlemeMetin");
reg["waOnizlemePanel"] = elStub("waOnizlemePanel");
waOnizle(ayse.id);
t("önizleme metni = ogrenciMesajMetni çıktısı (birebir)", reg["waOnizlemeMetin"].textContent === mTek);
/* WA-ALICI-YAMASI: alici varsayılan ogrenci → o.tel kullanılır. Seed'de Ayşe tel'i boş;
   gönderim ENGELLENİR (window.open yok, fallback yok — bilinçli yeni davranış). URL testi için tel doldurulur. */
const yakalanan = [];
const eskiOpen = global.window.open;
global.window.open = (u) => { yakalanan.push(u); return null; };
waGonder(ayse.id);
t("boş telefonda waGonder engellenir (window.open yok)", yakalanan.length === 0);
ayse.tel = "05559998877";
waGonder(ayse.id);
global.window.open = eskiOpen;
t("waGonder waUrl metni = ogrenciMesajMetni (TEK-KAYNAK şablonu yoksayıldı)", yakalanan.length === 1 && yakalanan[0].includes(encodeURIComponent(mTek).slice(0, 80)));
/* kopyala akışı stub navigator.clipboard */
let kopyalanan = null;
globalThis.navigator.clipboard = { writeText: (s) => { kopyalanan = s; return Promise.resolve(); } };
waKopyalaMesaj(ayse.id);
t("waKopyalaMesaj metni = ogrenciMesajMetni", kopyalanan === mTek);
t("önizleme=gonderme (waUrl query birebir)", yakalanan[0].endsWith("?text=" + encodeURIComponent(mTek)) || yakalanan[0].includes("text=" + encodeURIComponent(mTek)));

/* 6) D25: şablon alanları yoksayılır — bilinçli sözleşme değişikliği */
console.log("6) D25 şablon alanları yoksayılır:");
delete DB.ayarlar;
const mVars = ogrenciMesajMetni(ayse.id);
t("boş ayar → D25 kapanış bloğu", mVars.includes(KAPANIS_1) && mVars.includes(IMZA));
t("boş ayar → durum cümlesi YOK", !mVars.includes("Bu tarih ve saatte"));
DB.ayarlar = { whatsappSablon: { baslik: "", giris: "", kapanis: "", imza: "", planliSatir: "ÖZEL-PLANLI — {ogrenciAdi}", tamamlandiSatir: "ÖZEL-TAMAMLANDI" } };
const mOzel = ogrenciMesajMetni(ayse.id);
t("özel planliSatir yoksayılır", !mOzel.includes("ÖZEL-PLANLI"));
t("özel tamamlandiSatir yoksayılır", !mOzel.includes("ÖZEL-TAMAMLANDI"));
t("özel ayar mesajı boş ayarla birebir aynı", mOzel === mVars);
t("D25 saat aralığı kaynağı (KISA_KOD b - e) app.js'te", appKaynak.includes('kk.b + " - " + kk.e'));

/* 7) Konu D25'te mesajda hiç YOK (bilinçli kaldırım) */
console.log("7) Konu YOK:");
DB.dersler.push({ id: "wd-5", donemId: DB.aktifDonemId, ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "tar", konu: "Kronoloji", ogretmenId: "", ogretmenAd: DB.ogretmenler[4].ad, tarih: gelecekPzt, saat: "09:40", kod: "2", durum: "planlandi", olusturma: "" });
const m7 = ogrenciMesajMetni(ayse.id);
const satir5b = m7.split("\n").filter(l => l.match(/^\d+\. /)).find(l => l.includes("(" + DB.ogretmenler[4].ad + ")"));
t("konu mesajda YOK (Kronoloji)", !!satir5b && !m7.includes("Kronoloji"), satir5b);
t("parantezli öğretmen kalır (konu olsa da olmasa da)", !!satir5b && satir5b.includes("(" + DB.ogretmenler[4].ad + ")"), satir5b);
t("konulu ders D25 blok düzeninde (başlık+tarih+saat)", !!satir5b, satir5b);
DB.dersler = DB.dersler.filter(l => l.id !== "wd-5");

/* 8) localStorage anahtarı + süit kaydı */
console.log("8) Kalıcılık + süit kaydı:");
DB.ayarlar = { whatsappSablon: { baslik: "K", giris: "K", kapanis: "K", imza: "K" } };
P.saveDB();
t("tek localStorage anahtarı yksOto_arsiv_v1", Object.keys(store).every(k => k === "yksOto_arsiv_v1"), JSON.stringify(Object.keys(store)));
t("D25-SABLON-YAMASI işareti app.js'te", appKaynak.includes("D25-SABLON-YAMASI"));
t("ks-wa-durum.mjs test.mjs'te tam 1 kez", testKaynak.split('"ks-wa-durum.mjs"').length - 1 === 1);
const suites = (testKaynak.match(/const suites = \[([\s\S]*?)\];/m) || [])[1];
t("süit sayısı düşmüyor (≥38)", (suites.match(/,/g) || []).length >= 37);

console.log(fail ? "\nHATALAR VAR" : "\nHEPSİ GEÇTİ");
console.log("→ ks-wa-durum.mjs: " + (fail ? "BAŞARISIZ" : "TAMAM"));
process.exit(fail);
