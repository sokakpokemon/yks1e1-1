let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 33) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-cakisma-raporu.mjs kosan=" + __kosan + " beklenen=33"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-cakisma-raporu.mjs:" + __kosan + ":33"); } });
/* ks-cakisma-raporu.mjs — D63-CAKISMA-RAPORU süiti (Öğrenci Saat Çakışma Raporu — SALT-OKUMA)
   Kapsam: anahtar = ogrenciId|tarih|saatKod; (a) aynı öğrenci+tarih+saatKod+iki farklı öğretmen
   → 1 çakışma; (b) grup üyesi ana öğrenci gibi sayılır; (c) iptal edilen kayıt saymaz;
   (d) aynı öğrenci farklı saat → çakışma yok; (e) aynı öğretmen aynı saat iki farklı öğrenci
   → çakışma YOK; (f) farklı tarih aynı saat → çakışma YOK; (g) rapor öncesi/sonrası
   JSON.stringify(DB) birebir (DB değişmiyor); (h) yeni localStorage anahtarı yok;
   (i) kart HTML idempotent (çift kart yok); (j) ek dersler rapora girmiyor.
   Ayrıca: HTML sözleşmesi (birebir alt not · özet · esc · butonsuz) ve ayarTab entegrasyonu
   (kart csvYonetimKartHTML()'in HEMEN SONRASINDA, TAM 1 kez).
   Desen: tek boot + gerçek app.js; t( çağrılarının TAMAMI koşulsuzdur
   (statik-eksiksizlik sıfır-hit kapısı). */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const scripts = [appKaynak, ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" }, open() {} };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
const ids = {};
global.document = {
  getElementById: (id) => { if (ids[id]) return ids[id]; return elStub(); },
  addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => []
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

const EXPORTS = "{ db: () => DB, bul: cakismaRaporuBul, rapor: cakismaRaporuHTML, ayarTab, kart: csvYonetimKartHTML, kaynak: () => String(cakismaRaporuHTML) }";
let api;
try {
  api = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
  t("boot hatasız (app.js + cakismaRaporuBul/cakismaRaporuHTML yüzeyi)", typeof api.bul === "function" && typeof api.rapor === "function");
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}
const db = api.db;

/* ================= Fixture: 6 öğrenci · 9 ders + 2 ek ders =================
   d1 = 2026-10-05 (Pzt) · d2 = 2026-10-06 (Sal)
   "16:20" → KS koda 9 · "17:10" → KS koda 10 */
db().ogrenciler = [
  { id: "o1", ad: "Ali Veli", sinif: "12 SAY 1" },
  { id: "o2", ad: "Zeynep Kaya", sinif: "12 SAY 2" },
  { id: "o3", ad: "Buse Demir", sinif: "11 EA 1" },
  { id: "o4", ad: "Can Tekin", sinif: "11 SAY 1" },
  { id: "o5", ad: "Deniz Ak", sinif: "10.SINIF" },
  { id: "o6", ad: "Efe Yalçın", sinif: "12 DİL" }
];
db().dersler = [
  { id: "r1", ogrenciId: "o1", ogrenciAd: "Ali Veli", dersId: "mat", ogretmenId: "tA", ogretmenAd: "Öğretmen A", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "planlandi" },
  { id: "r2", ogrenciId: "o1", ogrenciAd: "Ali Veli", dersId: "fiz", ogretmenId: "tB", ogretmenAd: "Öğretmen B", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "planlandi" },
  { id: "r3", ogrenciId: "o1", ogrenciAd: "Ali Veli", dersId: "kim", ogretmenId: "tA", ogretmenAd: "Öğretmen A", tarih: "2026-10-05", saat: "17:10", kod: "10", durum: "planlandi" },
  { id: "r4", ogrenciId: "o2", ogrenciAd: "Zeynep Kaya", dersId: "mat", ogretmenId: "tA", ogretmenAd: "Öğretmen A", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "planlandi" },
  { id: "r5", ogrenciId: "o1", ogrenciAd: "Ali Veli", dersId: "mat", ogretmenId: "tA", ogretmenAd: "Öğretmen A", tarih: "2026-10-06", saat: "16:20", kod: "9", durum: "planlandi" },
  { id: "r6", ogrenciId: "o6", ogrenciAd: "Efe Yalçın", ogrenciIds: ["o3"], dersId: "biy", ogretmenId: "tC", ogretmenAd: "Öğretmen C", tarih: "2026-10-06", saat: "17:10", kod: "10", durum: "planlandi" },
  { id: "r7", ogrenciId: "o3", ogrenciAd: "Buse Demir", dersId: "tar", ogretmenId: "tD", ogretmenAd: "Öğretmen D", tarih: "2026-10-06", saat: "17:10", kod: "10", durum: "planlandi" },
  { id: "r8", ogrenciId: "o4", ogrenciAd: "Can Tekin", dersId: "mat", ogretmenId: "tA", ogretmenAd: "Öğretmen A", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "iptal" },
  { id: "r9", ogrenciId: "o4", ogrenciAd: "Can Tekin", dersId: "fiz", ogretmenId: "tB", ogretmenAd: "Öğretmen B", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "planlandi" }
];
db().ekDersler = [
  { id: "e1", ogrenciId: "o5", dersId: "mat", ogretmenAd: "Öğretmen E", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "planlandi" },
  { id: "e2", ogrenciId: "o5", dersId: "fiz", ogretmenAd: "Öğretmen F", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "planlandi" }
];

/* ================= 1) Çakışma kuralları (a · b · c · d · e · f · j) ================= */
console.log("1) Çakışma kuralları:");
const rapor = api.bul();
const aliSatir = rapor.filter((c) => c.ogrenciId === "o1");
const buseSatir = rapor.filter((c) => c.ogrenciId === "o3");
t("(a) aynı öğrenci+tarih+saatKod+iki farklı öğretmen → TEK çakışma satırı", aliSatir.length === 1 && aliSatir[0].kayitlar.length === 2, JSON.stringify(aliSatir));
t("(a) çakışma kayıtları iki farklı öğretmen (r1/r2 aynı saate düşürüldü)", aliSatir[0] && aliSatir[0].kayitlar.map((k) => k.id).join(",") === "r1,r2", JSON.stringify(aliSatir[0] && aliSatir[0].kayitlar.map((k) => k.id)));
t("(a) anahtar alanları tarih + saatKod doğru (2026-10-05 / 9)", aliSatir[0] && aliSatir[0].tarih === "2026-10-05" && aliSatir[0].saatKod === "9" && aliSatir[0].ad === "Ali Veli");
t("(b) grup üyesi ana öğrenci gibi sayılır (Buse: grup dersi r6 + kendi dersi r7)", buseSatir.length === 1 && buseSatir[0].kayitlar.map((k) => k.id).join(",") === "r6,r7", JSON.stringify(buseSatir));
t("(c) iptal edilen kayıt çakışma saymaz (Can Tekin rapora GİRMEDİ)", !rapor.some((c) => c.ogrenciId === "o4"), JSON.stringify(rapor.map((c) => c.ogrenciId)));
t("(d) aynı öğrenci farklı saat → çakışma YOK (Ali 17:10 satırı yok)", !rapor.some((c) => c.ogrenciId === "o1" && c.saatKod === "10"));
t("(e) aynı öğretmen aynı saat iki farklı öğrenci → çakışma YOK (Zeynep yok)", !rapor.some((c) => c.ogrenciId === "o2"));
t("(f) farklı tarih aynı saat → çakışma YOK (Ali'nin d2|16:20 kaydı tek)", !rapor.some((c) => c.ogrenciId === "o1" && c.tarih === "2026-10-06"));
t("(j) ek dersler rapora GİRMEZ (Deniz Ak yok) — DB.ekDersler'de 2 aynı-slot kayıt var", !rapor.some((c) => c.ogrenciId === "o5") && db().ekDersler.length === 2);
t("toplam: N=2 çakışma · M=2 öğrenci", rapor.length === 2 && Object.keys(rapor.reduce((a, c) => (a[c.ogrenciId] = 1, a), {})).length === 2, JSON.stringify(rapor.map((c) => c.ogrenciId)));
t("sıralama: tarih artan, sonra öğrenci adı artan (Ali Veli → Buse Demir)", rapor[0].ad === "Ali Veli" && rapor[1].ad === "Buse Demir", JSON.stringify(rapor.map((c) => c.ad)));
t("dönüş sözleşmesi: kayitlar { id, dersId, ogretmenAd, sinif, durum }", (function () {
  const k = rapor[0].kayitlar[0];
  return typeof k.id === "string" && typeof k.dersId === "string" && typeof k.ogretmenAd === "string" && typeof k.sinif === "string" && typeof k.durum === "string";
})());

/* ================= 2) Salt-okuma: DB ve localStorage (g · h) ================= */
console.log("2) Salt-okuma garantisi:");
const dbOnce = JSON.stringify(db());
const lsOnce = Object.keys(store).sort().join(",");
api.bul();
api.rapor();
t("(g) rapor öncesi/sonrası JSON.stringify(DB) BİREBİR", JSON.stringify(db()) === dbOnce);
t("(h) yeni localStorage anahtarı YOK (anahtar kümesi değişmedi)", Object.keys(store).sort().join(",") === lsOnce, lsOnce + " → " + Object.keys(store).sort().join(","));

/* ================= 3) Kart HTML sözleşmesi ================= */
console.log("3) Kart HTML sözleşmesi:");
const kart = api.rapor();
t("başlık 'Öğrenci Saat Çakışma Raporu' TAM 1 kez", (kart.match(/Öğrenci Saat Çakışma Raporu/g) || []).length === 1);
t("alt not BİREBİR (salt-okuma uyarısı)", kart.includes("Salt-okuma ekran — hiçbir kaydı silmez veya değiştirmez."));
t("özet satırı '2 çakışma · 2 öğrenci'", kart.includes("2 çakışma · 2 öğrenci") && kart.includes('text-[11.5px] font-bold'), kart.slice(0, 200));
t("her çakışmada öğrenci adı + 'Pzt 05.10.2026 · 9 · 16:20-17:00'", kart.includes("Ali Veli") && kart.includes("Pzt 05.10.2026 · 9 · 16:20-17:00"));
t("kayıtların öğretmenAd · dersId listesi görünür (Öğretmen A · mat)", kart.includes("Öğretmen A · mat") && kart.includes("Öğretmen B · fiz"));
t("buton YOK (salt-okuma ekran)", !kart.includes("<button") && !kart.includes("onclick"));
t("(i) kart HTML idempotent (iki çağrı birebir, çift kart yok)", api.rapor() === api.rapor());
t("görsel dil csvYonetimKartHTML ile aynı kök sınıf (rounded-2xl border + başlık/ikon satırı)", kart.includes('rounded-2xl border border-teal-100 bg-teal-50/40 p-5 mt-4') && kart.includes('w-9 h-9 rounded-xl bg-teal-100'));
t("kaynakta ekDersler/ek-ders veri kümesi KULLANILMIYOR (statik kanıt)", !api.kaynak().includes("ekDersler") && !api.kaynak().includes("ek-ders"));
t("kaynakta yazma yolu YOK (saveDB/localStorage geçmiyor)", !api.kaynak().includes("saveDB") && !api.kaynak().includes("localStorage"));
t("esc() ile kaçırma: '<script>' içeren ad ham HTML olarak çıkmaz", (function () {
  const o7 = { id: "o7", ad: "<b>Kötü</b>", sinif: "9.SINIF" };
  db().ogrenciler = db().ogrenciler.concat([o7]);
  db().dersler = db().dersler.concat([
    { id: "r10", ogrenciId: "o7", ogrenciAd: o7.ad, dersId: "mat", ogretmenAd: "Ö <script>", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "planlandi" },
    { id: "r11", ogrenciId: "o7", ogrenciAd: o7.ad, dersId: "fiz", ogretmenAd: "Ö B", tarih: "2026-10-05", saat: "16:20", kod: "9", durum: "planlandi" }
  ]);
  const k = api.rapor();
  db().ogrenciler = db().ogrenciler.filter((o) => o.id !== "o7");
  db().dersler = db().dersler.filter((l) => l.id !== "r10" && l.id !== "r11");
  return k.includes("&lt;b&gt;Kötü&lt;/b&gt;") && !k.includes("<b>Kötü</b>") && k.includes("Ö &lt;script&gt;");
})());

/* ================= 4) Sıfır çakışma durumu ================= */
console.log("4) Sıfır çakışma durumu:");
const derslerYedek = db().dersler;
db().dersler = [];
const bosKart = api.rapor();
t("çakışma yok: '0 çakışma · 0 öğrenci' + yeşil 'Çakışma yok' durumu", bosKart.includes("0 çakışma · 0 öğrenci") && bosKart.includes("Çakışma yok") && bosKart.includes("bg-green-50"));
t("boş kümede liste gövdesi üretilmez (yeşil durum dışında çakışma kartı yok)", !bosKart.includes("rounded-xl border border-slate-200 bg-white p-3.5"));
db().dersler = derslerYedek;

/* ================= 5) ayarTab entegrasyonu ================= */
console.log("5) ayarTab entegrasyonu:");
const ayar = api.ayarTab();
const iCsv = ayar.indexOf(api.kart());
const iRapor = ayar.indexOf('Öğrenci Saat Çakışma Raporu');
t("kart ayarTab çıktısında TAM 1 kez", (ayar.match(/Öğrenci Saat Çakışma Raporu/g) || []).length === 1);
t("kart csvYonetimKartHTML() çıktısının HEMEN SONRASINDA (aynı '+' zinciri)", iCsv >= 0 && iRapor >= 0 && ayar.indexOf(api.rapor()) === iCsv + api.kart().length);
t("csvYonetimKartHTML DEĞİŞMEDİ (rapor kodu o kartın içinde değil)", !api.kart().includes("Çakışma Raporu") && (ayar.match(/Excel \/ CSV Veri Yönetimi/g) || []).length === 1);
t("ayarTab çıktısında 'NaN' YOK", !/\bNaN\b/.test(ayar));
t("ks-cakisma-raporu.mjs test.mjs'te tam 1 kez", (readFileSync("test.mjs", "utf8").match(/ks-cakisma-raporu\.mjs/g) || []).length === 1);

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
