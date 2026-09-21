let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-sinif-prog-uyum-onar.mjs — SINIF-PROG-UYUM-ONAR süiti
   Doğruladıkları:
    1) 10.SINIF kaynak avail.sinif slotları okunuyor (SALİM URTİMUR 1-1, ŞAHİN DOĞANAY 1-1)
    2) Kayıtlar grid'in okuduğu canonical map'te (sinifProgDonemler[sinifProgDonemId]["10.SINIF"])
    3) Grid renderi (renderOgrenci → gridTablo) 10.SINIF için boş değil (dolu hücre = dolu slot)
    4) DB.sinifProg identity-rebind: DB.sinifProg === DB.sinifProgDonemler[sinifProgDonemId]
    5) In-memory DB ile persisted localStorage deep-equal (sinifProg + sinifProgDonemler)
    6) Boot sonrası reload (loadDB) aynı slotları koruyor
    7) Onarım 2. kez duplicate üretmiyor (idempotent)
    8) Başka dönem aktifken onarım artık o dönemin canonical map'ine de yazıyor (kök neden düzeltmesi)
       ve eski dönemin verisi EZİLMİYOR
    9) Mevcut dolu slotlar + teacher avail.sinif kaynağı korunuyor
   10) 0=Pzt / 6=Paz gün-kod kuralı korunuyor (dowIdx)
   11) 10.SINIF için kaynak veri yoksa grid zorla doldurulmuyor
   Mevcut süit assertion'ları değiştirilmedi; bu dosya test.mjs'e tam 1 kez eklenir. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
global.document = { getElementById: () => elStub(), addEventListener() {}, removeEventListener() {}, createElement: () => elStub(), body: { appendChild() {}, removeChild() {} }, querySelectorAll: () => [] };
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let api;
try {
  api = new Function(scripts + "\n  return { DB, normalize, loadDB, saveDB, aktifDonemId, sinifOgrtUyumOnar, dowIdx, ogrenciTab, ui };")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const DB = api.DB;
const ui = api.ui;
const derinKopya = (x) => JSON.parse(JSON.stringify(x));

console.log("1) 10.SINIF kaynak avail.sinif slotları:");
const kaynakSlotlar = [];
DB.ogretmenler.forEach((tg) => {
  Object.entries(tg.avail?.sinif || {}).forEach(([k, v]) => { if (v === "10.SINIF") kaynakSlotlar.push({ ogrt: tg.ad, key: k }); });
});
t("SALİM URTİMUR → 1-1 kaydı var", kaynakSlotlar.some((x) => x.ogrt === "SALİM URTİMUR" && x.key === "1-1"), JSON.stringify(kaynakSlotlar));
t("ŞAHİN DOĞANAY → 1-1 kaydı var", kaynakSlotlar.some((x) => x.ogrt === "ŞAHİN DOĞANAY" && x.key === "1-1"));
t("kaynak slot sayısı ≥ 1", kaynakSlotlar.length >= 1, String(kaynakSlotlar.length));

console.log("2) Canonical map (grid'in okuduğu yer):");
const hedef = DB.sinifProgDonemId;
t("DB.sinifProgDonemId = DB.aktifDonemId", hedef === DB.aktifDonemId, hedef + " vs " + DB.aktifDonemId);
t("DB.sinifProg === DB.sinifProgDonemler[sinifProgDonemId] (identity-rebind)", DB.sinifProg === DB.sinifProgDonemler[hedef]);
t("DB.sinifProg === DB.sinifProgDonemler[aktifDonemId]", DB.sinifProg === DB.sinifProgDonemler[DB.aktifDonemId]);
t("10.SINIF canonical map'te mevcut ve dolu", Array.isArray(DB.sinifProg["10.SINIF"]) && DB.sinifProg["10.SINIF"].length > 0, JSON.stringify(DB.sinifProg["10.SINIF"]));
t("avail.sinif'taki her 10.SINIF slotu canonical map'te", kaynakSlotlar.every((x) => DB.sinifProg["10.SINIF"].includes(x.key)));
t("sinifIds['10.SINIF'] kimliği var (isim + ID katmanı uyumlu)", !!DB.sinifIds?.["10.SINIF"]);
t("'10. SINIF' gibi alternatif anahtar üretilmiyor (isim eşleşmesi birebir)", !("10. SINIF" in DB.sinifProg));

console.log("3) Grid renderi (ogrenciTab → gridTablo):");
ui.sinifAd = "10.SINIF";
let markup = "";
try { markup = api.ogrenciTab(); } catch (e) { markup = ""; }
t("ogrenciTab hatasız", markup.length > 0);
const doluHucre = (markup.match(/Sınıf Toplu Ders Programı|bg-blue-200/g) || []).length;
t("10.SINIF grid'i boş değil (program grid'i + dolu hücre stili markup'ta)", doluHucre >= 2, "eşleşme: " + doluHucre);

console.log("4) localStorage kalıcılık:");
api.saveDB();
const persisted = JSON.parse(store["yksOto_arsiv_v1"]);
t("in-memory sinifProg === persisted.sinifProg (deep-equal)", JSON.stringify(DB.sinifProg) === JSON.stringify(persisted.sinifProg));
t("in-memory sinifProgDonemler === persisted (deep-equal)", JSON.stringify(DB.sinifProgDonemler) === JSON.stringify(persisted.sinifProgDonemler));
t("persisted 10.SINIF dolu", Array.isArray(persisted.sinifProg["10.SINIF"]) && persisted.sinifProg["10.SINIF"].length > 0);

console.log("5) Reload (loadDB) slotları koruyor:");
const lsHashOnce = sha(store["yksOto_arsiv_v1"]);
const yeniden = api.loadDB();
t("loadDB 10.SINIF slotlarını koruyor", JSON.stringify(yeniden.sinifProg["10.SINIF"]) === JSON.stringify(DB.sinifProg["10.SINIF"]), JSON.stringify(yeniden.sinifProg["10.SINIF"]));
t("reload sonrası identity-rebind yeniden kuruluyor", yeniden.sinifProg === yeniden.sinifProgDonemler[yeniden.sinifProgDonemId]);

console.log("6) Onarım idempotans:");
const progOnce = derinKopya(DB.sinifProg);
const donemlerOnce = derinKopya(DB.sinifProgDonemler);
const r1 = api.sinifOgrtUyumOnar(DB);
const r2 = api.sinifOgrtUyumOnar(DB);
t("1. koşu 0 değişiklik (boot zaten kapattı)", r1.e === 0, JSON.stringify(r1));
t("2. koşu da 0 (duplicate yok)", r2.e === 0, JSON.stringify(r2));
t("3 koşu sonrası sinifProg birebir", JSON.stringify(DB.sinifProg) === JSON.stringify(progOnce));
t("3 koşu sonrası sinifProgDonemler birebir", JSON.stringify(DB.sinifProgDonemler) === JSON.stringify(donemlerOnce));

console.log("7) Başka dönem aktifken onarım (kök neden düzeltmesi):");
{
  const ilkDonem = DB.aktifDonemId;
  const ilkProg = derinKopya(DB.sinifProgDonemler[ilkDonem]);
  /* yeni dönem oluştur ve geç */
  DB.donemler.push({ id: "donem-2027-2028", ad: "2027/2028", aktif: false });
  DB.aktifDonemId = "donem-2027-2028";
  DB.sinifProgDonemId = "donem-2027-2028";
  DB.sinifProgDonemler["donem-2027-2028"] = {};
  DB.sinifProg = DB.sinifProgDonemler["donem-2027-2028"];
  const r = api.sinifOgrtUyumOnar(DB, true); /* boot/dönem-geçiş yolu: TAM onarım */
  t("yeni dönemde onarım slot ekliyor (e > 0)", r.e > 0, JSON.stringify(r));
  t("yeni dönemde 10.SINIF canonical map'te dolu", Array.isArray(DB.sinifProg["10.SINIF"]) && DB.sinifProg["10.SINIF"].includes("1-1"), JSON.stringify(DB.sinifProg["10.SINIF"]));
  t("yeni dönemde de identity-rebind", DB.sinifProg === DB.sinifProgDonemler["donem-2027-2028"]);
  t("eski dönemin verisi EZİLMEDİ", JSON.stringify(DB.sinifProgDonemler[ilkDonem]) === JSON.stringify(ilkProg));
  /* geri dönüş */
  DB.aktifDonemId = ilkDonem;
  DB.sinifProgDonemId = ilkDonem;
  DB.sinifProg = DB.sinifProgDonemler[ilkDonem];
  const r2b = api.sinifOgrtUyumOnar(DB, true);
  t("ilk döneme dönüş: 0 değişiklik (ezme yok, duplicate yok)", r2b.e === 0 && DB.sinifProg["10.SINIF"].length === ilkProg["10.SINIF"].length, JSON.stringify(r2b));
  /* test dönemi temizliği */
  DB.donemler = DB.donemler.filter((d) => d.id !== "donem-2027-2028");
  delete DB.sinifProgDonemler["donem-2027-2028"];
}

console.log("8) Mevcut veriler ve kaynak korunumu:");
const availOnce = derinKopya(DB.ogretmenler.map((tg) => tg.avail));
api.sinifOgrtUyumOnar(DB);
t("avail.sinif kaynağı değişmedi", JSON.stringify(DB.ogretmenler.map((tg) => tg.avail)) === JSON.stringify(availOnce));
t("mevcut dolu sinifProg hücreleri korundu", JSON.stringify(DB.sinifProg) === JSON.stringify(progOnce));
const toplamDolu = Object.values(DB.sinifProg).reduce((a, v) => a + v.length, 0);
t("toplam dolu slot sayısı makul (≥50, canonical map dolu)", toplamDolu >= 50, String(toplamDolu));

console.log("9) Gün-kod kuralı (0=Pzt / 6=Paz):");
t("dowIdx(Pazartesi)=0", api.dowIdx("2026-09-14") === 0);
t("dowIdx(Pazar)=6", api.dowIdx("2026-09-13") === 6);
t("onarım anahtar biçimi G-K korunuyor", kaynakSlotlar.every((x) => /^\d-\d+$/.test(x.key)));

console.log("10) Kaynak yoksa zorla doldurma YOK:");
{
  const snap = derinKopya(DB.sinifProg);
  const yedekOgr = derinKopya(DB.ogretmenler);
  /* tüm 10.SINIF avail kayıtlarını sil */
  DB.ogretmenler.forEach((tg) => { Object.keys(tg.avail.sinif || {}).forEach((k) => { if (tg.avail.sinif[k] === "10.SINIF") delete tg.avail.sinif[k]; }); });
  /* 10.SINIF'ı boşaltıp onarımı dene */
  DB.sinifProg["10.SINIF"] = [];
  const r = api.sinifOgrtUyumOnar(DB);
  t("kaynak yoksa 10.SINIF grid zorla doldurulmuyor", DB.sinifProg["10.SINIF"].length === 0, JSON.stringify(DB.sinifProg["10.SINIF"]));
  /* 10.SINIF slotunu tek teacher'dan geri kur (onarım kaynağı çalışıyor kanıtı) */
  const t1 = DB.ogretmenler.find((x) => x.ad === "SALİM URTİMUR");
  t1.avail.sinif["1-1"] = "10.SINIF";
  const r2c = api.sinifOgrtUyumOnar(DB);
  t("tek kaynak geri konunca onarım slotu ekliyor", r2c.e === 1 && DB.sinifProg["10.SINIF"].includes("1-1"), JSON.stringify(r2c) + " " + JSON.stringify(DB.sinifProg["10.SINIF"]));
  /* temizlik: orijinallere dön */
  DB.ogretmenler = yedekOgr;
  DB.sinifProg = snap;
  api.sinifOgrtUyumOnar(DB);
}

console.log("11) Süit kaydı:");
const testRunner = readFileSync("test.mjs", "utf8");
t("ks-sinif-prog-uyum-onar.mjs test.mjs'te tam 1 kez", (testRunner.match(/ks-sinif-prog-uyum-onar\.mjs/g) || []).length === 1);

if (fail) { console.log("BAŞARISIZ"); process.exit(1); }
console.log("HEPSİ GEÇTİ");
console.log("→ ks-sinif-prog-uyum-onar.mjs: " + ((fail === 0) ? "TAMAM" : ""));

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 36) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-sinif-prog-uyum-onar.mjs kosan=" + __kosan + " beklenen=36"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-sinif-prog-uyum-onar.mjs:" + __kosan + ":36"); } });