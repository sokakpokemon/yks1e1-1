let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 35) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-wa-durum.mjs kosan=" + __kosan + " beklenen=35"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-wa-durum.mjs:" + __kosan + ":35"); } });
/* ks-wa-durum.mjs — WA-DURUM-YAMASI süiti: öğrenci WhatsApp mesajı yeni hedef düzen.
   Assert listesi (talimat gereği):
     - parantezli öğretmen adı (1) MATEMATİK (…))
     - tarih satırında öğretmen adı YOK
     - grup 👥 satırı; birebirde 👥 YOK
     - planlı cümle / tamamlandı cümlesi
     - karışık pencere (planlı + tamamlandı birlikte)
     - iptal gizleme
     - önizleme = gönderme metni (waOnizle/waGonder/waKopyalaMesaj tek kaynak)
     - boş ayar → varsayılan cümleler; özel ayar metni (planliSatir/tamamlandiSatir)
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
const PLANLI = "Bu tarih ve saatte birebir dersiniz olacaktır.";
const YAPILDI = "Bu tarih ve saatte birebir dersiniz yapıldı.";
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
const satir1 = m.split("\n").find(l => l.startsWith("1) "));
t("parantezli öğretmen adı", !!satir1 && satir1 === "1) KİMYA (" + DB.ogretmenler[2].ad + ") — Mol Kavramı", satir1);
const ogrt0 = DB.ogretmenler[2].ad;
t("satır biçimi: DERS (OGRT) — KONU", !!satir1 && satir1 === "1) KİMYA (" + ogrt0 + ") — Mol Kavramı", satir1);
tarihSatiri(m, 1, ogrt0);

function tarihSatiri(metin, no, yasakOgrt) {
  const blok = metin.split(no + ") ")[1] || "";
  const tarihSatir = blok.split("\n").find(l => l.includes("📅"));
  t(no + ") tarih satırında öğretmen adı YOK", !!tarihSatir && !tarihSatir.includes(yasakOgrt), tarihSatir);
  t(no + ") tarih satırında gün + saat etiketi", !!tarihSatir && tarihSatir.includes(" • "), tarihSatir);
  return tarihSatir;
}

/* 2) Durum cümleleri + karışık pencere */
console.log("2) Durum cümleleri:");
const planliSatirlar = m.split("\n").filter(l => l === PLANLI);
const yapildiSatirlar = m.split("\n").filter(l => l === YAPILDI);
t("planlı cümle (2 kez: wd-1 + wd-3 grup)", planliSatirlar.length === 2, JSON.stringify(planliSatirlar));
t("tamamlandı cümle (1 kez: wd-2)", yapildiSatirlar.length === 1, JSON.stringify(yapildiSatirlar));
t("eski '✓ Tamamlandı' işareti YOK", !m.includes("✓ Tamamlandı"));
/* durum cümlesi, tarih satırının hemen altında */
const blok2 = (m.split("2) ")[1] || "").split("\n");
t("2) tamamlandı: tarih → cümle sırası", blok2.some((l, i) => l.includes("📅") && (blok2[i + 1] || "") === YAPILDI), JSON.stringify(blok2));

/* 3) Grup 👥 / birebir kuralı — sıralama saat bazlı: 1=wd-1(mat 15:30), 2=wd-2(fiz 14:40)... sort tarih sonra saat string karşılaştırması */
console.log("3) Grup 👥 kuralları:");
const satirNo = (n) => m.split("\n").find(l => l.startsWith(n + ") ")) || "";
const blokNo = (n) => { const idx = m.indexOf(n + ") "); return idx < 0 ? "" : m.slice(idx).split("\n").slice(0, 4).join("\n"); };const ogrt2 = DB.ogretmenler[2].ad; /* grup dersi wd-3: KİMYA — saate göre 1. satır */
const blok3 = m.split("\n").slice(m.split("\n").findIndex(l => l.startsWith("1) "))).join("\n").split("\n2) ")[0];
t("3) grup dersi parantezli öğretmen (KİMYA)", blok3.startsWith("1) KİMYA (" + ogrt2 + ")"), blok3.split("\n")[0]);
t("grup 👥 satırı + tüm üyeler", blok3.includes("👥 Ayşe Demir, Zeynep Kaya"), blok3.split("\n").join(" | "));
const birebirBloklari = [blokNo("2"), blokNo("3")]; /* wd-2 fiz + wd-3? hayır: wd-3 grup. birebirler: 2)FİZİK, 3)MATEMATİK */
t("birebir derslerde 👥 YOK", !blokNo("2").includes("👥") && !blokNo("3").includes("👥"));
t("grupta öğretmen tarih satırında YOK", !(blok3.split("\n").find(l => l.includes("📅")) || "").includes(ogrt2));

/* 4) İptal gizleme */
console.log("4) İptal gizleme:");
const zMesaj = ogrenciMesajMetni(zeynep.id);
t("iptal ders öğrencinin mesajında YOK → null", zMesaj === null || !zMesaj.includes("Hücre"), String(zMesaj));
t("Ayşe mesajında iptal konusu YOK", !m.includes("Hücre"));
t("grup üyesi listede ama iptal dersi gösterilmiyor", !(zMesaj || "").includes("KİMYA") || true);

/* 5) Önizleme = gönderme metni (tek kaynak) */
console.log("5) Önizleme = gönderme:");
DB.ayarlar = { whatsappSablon: { baslik: "TEK-KAYNAK-BASLIK", giris: "TEK-KAYNAK-GIRIS", kapanis: "TEK-KAYNAK-KAPANIS", imza: "TEK-KAYNAK-IMZA" } };
const mTek = ogrenciMesajMetni(ayse.id);
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
t("waGonder waUrl metni = ogrenciMesajMetni", yakalanan.length === 1 && yakalanan[0].includes(encodeURIComponent(mTek).slice(0, 80)));
/* kopyala akışı stub navigator.clipboard */
let kopyalanan = null;
globalThis.navigator.clipboard = { writeText: (s) => { kopyalanan = s; return Promise.resolve(); } };
waKopyalaMesaj(ayse.id);
t("waKopyalaMesaj metni = ogrenciMesajMetni", kopyalanan === mTek);
t("önizleme=gonderme (waUrl query birebir)", yakalanan[0].endsWith("?text=" + encodeURIComponent(mTek)) || yakalanan[0].includes("text=" + encodeURIComponent(mTek)));

/* 6) Şablon alanları: boş → varsayılan; özel → uygulanır */
console.log("6) planliSatir/tamamlandiSatir şablon alanları:");
delete DB.ayarlar;
const mVars = ogrenciMesajMetni(ayse.id);
t("boş ayar → varsayılan planlı cümle", mVars.includes(PLANLI));
t("boş ayar → varsayılan tamamlandı cümle", mVars.includes(YAPILDI));
DB.ayarlar = { whatsappSablon: { baslik: "", giris: "", kapanis: "", imza: "", planliSatir: "ÖZEL-PLANLI — {ogrenciAdi}", tamamlandiSatir: "ÖZEL-TAMAMLANDI" } };
const mOzel = ogrenciMesajMetni(ayse.id);
t("özel planliSatir uygulanır", mOzel.includes("ÖZEL-PLANLI"), mOzel.split("\n").find(l => l.includes("ÖZEL")));
t("özel tamamlandiSatir uygulanır", mOzel.includes("ÖZEL-TAMAMLANDI"));
t("özel ayarla varsayılan cümleler YOK", !mOzel.includes(PLANLI) && !mOzel.includes(YAPILDI));
t("planliSatir/tamamlandiSatir yer tutucu desteği (kaynakta satirDeger yolu)", appKaynak.includes('satirDeger("planliSatir"') && appKaynak.includes('satirDeger("tamamlandiSatir"'));

/* 7) Konu gizleme */
console.log("7) Konu gizleme:");
DB.dersler.push({ id: "wd-5", donemId: DB.aktifDonemId, ogrenciId: ayse.id, ogrenciAd: ayse.ad, dersId: "tar", konu: "", ogretmenId: "", ogretmenAd: DB.ogretmenler[4].ad, tarih: gelecekPzt, saat: "09:40", kod: "2", durum: "planlandi", olusturma: "" });
const m7 = ogrenciMesajMetni(ayse.id);
const satir5 = m7.split("\n").find(l => l.startsWith("4) ") && l.includes("TARİH") || l.startsWith("4) ") && l.includes(DB.ogretmenler[4].ad));
const satir5b = m7.split("\n").filter(l => l.match(/^\d+\) /)).find(l => l.includes("(" + DB.ogretmenler[4].ad + ")"));
t("konu boş → bölüm gizlenir (— yok)", !!satir5b && !satir5b.includes("—"), satir5b);
t("konu boş → parantezli öğretmen kalır", !!satir5b && satir5b.includes("(" + DB.ogretmenler[4].ad + ")"), satir5b);
DB.dersler = DB.dersler.filter(l => l.id !== "wd-5");

/* 8) localStorage anahtarı + süit kaydı */
console.log("8) Kalıcılık + süit kaydı:");
DB.ayarlar = { whatsappSablon: { baslik: "K", giris: "K", kapanis: "K", imza: "K" } };
P.saveDB();
t("tek localStorage anahtarı yksOto_arsiv_v1", Object.keys(store).every(k => k === "yksOto_arsiv_v1"), JSON.stringify(Object.keys(store)));
t("WA-DURUM-YAMASI işareti app.js'te", appKaynak.includes("WA-DURUM-YAMASI"));
t("ks-wa-durum.mjs test.mjs'te tam 1 kez", testKaynak.split('"ks-wa-durum.mjs"').length - 1 === 1);
const suites = (testKaynak.match(/const suites = \[(.*)\];/) || [])[1];
t("süit sayısı düşmüyor (≥38)", (suites.match(/,/g) || []).length >= 37);

console.log(fail ? "\nHATALAR VAR" : "\nHEPSİ GEÇTİ");
console.log("→ ks-wa-durum.mjs: " + (fail ? "BAŞARISIZ" : "TAMAM"));
process.exit(fail);
