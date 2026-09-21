let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-donem-damga.mjs — DONEM-DAMGA süiti: yeni ders/istek kayıtları aktif dönem ID'siyle doğar
   Doğruladıkları:
    1) aktifDonemId() = donem-2026-2027 iken yeni dersin donemId'si doğru
    2) farklı aktif dönem seçiliyken yeni dersin donemId'si o döneme eşit
    3) DB.aktifDonemId eksik/boşken yeni kayıt fallback "donem-2026-2027" alıyor
    4) yeni TEKLİ istek doğrudan donemId ile oluşuyor
    5) yeni GRUP isteği doğrudan donemId ile oluşuyor
    6) yeni GRUP dersi doğrudan donemId ile oluşuyor (grupIstekAktif + panel yolları)
    7) eski donemId'li ders DÜZENLENDİĞİNDE donemId değişmiyor (birebir + grup düzenleme dalları)
    8) eski donemId'li istek güncellenirken (planlama kapatma) donemId değişmiyor
    9) yeni alan (donemId) dışında mevcut veriler korunuyor
   10) helper davranışı: trim, boş string, null/undefined, sayısal geçersiz değer
   Mevcut süit deseni: tek boot + gerçek DOM id kayıt defteri. */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
global.document = {
  getElementById: () => elStub(),
  addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => []
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let api;
try {
  api = new Function(scripts + "\n  return { DB, normalize, loadDB, saveDB, aktifDonemId, planla, istekEkle, istekGrupEkle, istekOgrenciIds, ui, donemleriBaslat, bosDB, seedDB };\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, normalize, aktifDonemId, planla, istekEkle, istekGrupEkle, istekOgrenciIds, ui } = api;

const DONEM_A = "donem-2026-2027";
const DONEM_B = "donem-2025-2026";
const derinKopya = (x) => JSON.parse(JSON.stringify(x));
/* donemId dışı alanları sıralı serileştirir → "yalnız donemId eklendi" kanıtı */
function sirali(v, skip) {
  if (Array.isArray(v)) return v.map((x) => sirali(x, skip));
  if (v && typeof v === "object") { const o = {}; Object.keys(v).sort().forEach((k) => { if (k !== skip) o[k] = sirali(v[k], skip); }); return o; }
  return v;
}
const alanEsit = (a, b, skip) => JSON.stringify(sirali(a, skip)) === JSON.stringify(sirali(b, skip));

/* Gerçek form DOM'u: id → AYNI öğe nesnesi (form değerleri okunabilir/ayarlanabilir) */
const reg = {};
const el = (id) => { if (!reg[id]) reg[id] = { id, innerHTML: "", textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, insertAdjacentHTML(_p, h) { [...h.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }, appendChild() {}, remove() {}, click() {}, focus() {}, addEventListener() {}, scrollIntoView() {}, querySelectorAll: () => [], getContext: () => null }; return reg[id]; };
for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
global.document = {
  getElementById: (i) => reg[i] || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};
const api2 = new Function(scripts + "\n  return { DB, normalize, loadDB, saveDB, aktifDonemId, planla, istekEkle, istekGrupEkle, istekOgrenciIds, ui, toast };\n")();
const { DB: D, planla: planla2, istekEkle: istekEkle2, istekGrupEkle: istekGrupEkle2, ui: ui2 } = api2;
const toastYakala = () => { const yakalanan = []; global.toast2log = yakalanan; return yakalanan; };

/* gelecek Pazartesi (avail/sinifProg'ta meşgul olmayan gün) */
const _d = new Date(); _d.setDate(_d.getDate() - ((_d.getDay() + 6) % 7) + 7);
const gelecekPzt = _d.getFullYear() + "-" + String(_d.getMonth() + 1).padStart(2, "0") + "-" + String(_d.getDate()).padStart(2, "0");
const formuDoldur = (ders = "mat") => { reg["f-ogrenci"].value = "Ayşe Demir"; reg["f-ders"].value = ders; reg["f-konu"].value = "Limit"; reg["f-ogretmen"].value = "SONER AÇIKGÖZ"; reg["f-tarih"].value = gelecekPzt; reg["f-saat"].value = "15:30"; reg["f-yoksay"].checked = false; };
const sonDers = (dbObj) => dbObj.dersler[dbObj.dersler.length - 1];
const sonIstek = (dbObj) => dbObj.istekler[dbObj.istekler.length - 1];

/* ---- 1) Aktif dönem doğruyken yeni ders ---- */
console.log("1) Aktif dönem 'donem-2026-2027' iken yeni dersin donemId'si doğru:");
t("boot DB aktifDonemId = donem-2026-2027", DB.aktifDonemId === DONEM_A, String(DB.aktifDonemId));
t("aktifDonemId() 'donem-2026-2027' döner", aktifDonemId() === DONEM_A, String(aktifDonemId()));
DB.dersler = [];
formuDoldur();
ui.ekOgrenciIds = [];
planla();
const d1 = sonDers(DB);
t("yeni birebir ders kaydı oluştu", DB.dersler.length === 1 && !!d1);
t("yeni dersin donemId'si = 'donem-2026-2027'", d1 && d1.donemId === DONEM_A, String(d1 && d1.donemId));
t("donemId string + boş değil", d1 && typeof d1.donemId === "string" && d1.donemId.length > 0);
/* temizlik */
DB.dersler = [];

/* ---- 2) Farklı aktif dönem seçiliyken yeni ders ---- */
console.log("2) Farklı bir aktif dönem seçiliyken yeni dersin donemId'si o döneme eşit:");
DB.aktifDonemId = DONEM_B;
formuDoldur();
planla();
const d2 = sonDers(DB);
t("DB.aktifDonemId = donem-2025-2026 yapıldı", DB.aktifDonemId === DONEM_B);
t("aktifDonemId() o dönemi döner", aktifDonemId() === DONEM_B);
t("yeni dersin donemId'si = 'donem-2025-2026' (aktif dönem)", d2 && d2.donemId === DONEM_B, String(d2 && d2.donemId));
/* temizlik */
DB.dersler = DB.dersler.filter((l) => l !== d2);
DB.aktifDonemId = DONEM_A;

/* ---- 3) aktifDonemId eksik/boşken fallback ---- */
console.log("3) DB.aktifDonemId eksik/boşken yeni kayıt fallback 'donem-2026-2027' alıyor:");
{
  DB.aktifDonemId = undefined;
  t("aktifDonemId undefined → fallback", aktifDonemId() === DONEM_A);
  DB.aktifDonemId = "";
  t("aktifDonemId boş string → fallback", aktifDonemId() === DONEM_A);
  DB.aktifDonemId = "   ";
  t("aktifDonemId boşluk → fallback (trim)", aktifDonemId() === DONEM_A);
  DB.aktifDonemId = null;
  t("aktifDonemId null → fallback", aktifDonemId() === DONEM_A);
  DB.aktifDonemId = 123;
  t("aktifDonemId sayı (geçersiz tip) → fallback", aktifDonemId() === DONEM_A);
  /* gerçek kayıt yolu: boş aktifDonemId ile planla → kayıt fallback alır, undefined/null YAZILMAZ */
  DB.aktifDonemId = "";
  formuDoldur();
  planla();
  const d3 = sonDers(DB);
  t("aktifDonemId boşken planlanan ders fallback aldı", d3 && d3.donemId === DONEM_A, String(d3 && JSON.stringify(d3.donemId)));
  t("yeni kayıtta donemId asla undefined/null/boş değil", d3 && d3.donemId != null && d3.donemId !== "");
  /* temizlik */
  DB.dersler = DB.dersler.filter((l) => l !== d3);
  DB.aktifDonemId = DONEM_A;
}

/* ---- 4) Yeni TEKLİ istek doğrudan donemId ile ---- */
console.log("4) Yeni istek doğrudan donemId ile oluşuyor:");
DB.istekler = [];
try { api.renderHavuz(); } catch (e) { /* stub DOM'da havuz çizimi tam olmayabilir; kritik olan h-* alanlarının varlığı */ }
if (!reg["h-ogrenci"]) reg["h-ogrenci"] = el("h-ogrenci");
if (!reg["h-ders"]) reg["h-ders"] = el("h-ders");
if (!reg["h-konu"]) reg["h-konu"] = el("h-konu");
reg["h-ogrenci"].value = "Ayşe Demir";
reg["h-ders"].value = "mat";
reg["h-konu"].value = "Türev";
istekEkle();
const r1 = sonIstek(DB);
t("tekli istek kaydı oluştu", DB.istekler.length === 1 && !!r1);
t("yeni isteğin donemId'si = aktif dönem", r1 && r1.donemId === DONEM_A, String(r1 && r1.donemId));
/* farklı dönemde de damga o dönemi izler */
DB.aktifDonemId = DONEM_B;
reg["h-konu"].value = "İntegral";
istekEkle();
const r1b = sonIstek(DB);
t("farklı aktif dönemde yeni istek o döneme damgalanır", r1b && r1b.donemId === DONEM_B, String(r1b && r1b.donemId));
DB.aktifDonemId = DONEM_A;
/* temizlik (havuz senaryoları sıfırdan) */
DB.istekler = [];

/* ---- 5) Yeni GRUP isteği doğrudan donemId ile ---- */
console.log("5) Varsa yeni grup isteği doğrudan donemId ile oluşuyor:");
{
  const ayse = DB.ogrenciler.find((s) => s.ad === "Ayşe Demir");
  const zeynep = DB.ogrenciler.find((s) => s.ad === "Zeynep Kaya");
  const emir = DB.ogrenciler.find((s) => s.ad === "Emir Aydın");
  /* havuz bağlamına geç: istekGrupEkle() havuz bağlamı ister; ana = ui.havuzAnaId, ekler = ui.ekOgrenciIds */
  ui.grupPanelBaglam = "havuz";
  ui.havuzAnaId = ayse.id;
  ui.ekOgrenciIds = [zeynep.id, emir.id];
  reg["h-ders"].value = "mat";
  reg["h-konu"].value = "Ortak tekrar";
  DB.istekler = [];
  istekGrupEkle();
  const g1 = sonIstek(DB);
  t("grup istek kaydı oluştu (TEK kayıt)", DB.istekler.length === 1 && !!g1);
  t("grup isteği üyeleri doğru (3 üye)", g1 && istekOgrenciIds(g1).length === 3);
  t("yeni grup isteğin donemId'si = aktif dönem", g1 && g1.donemId === DONEM_A, String(g1 && g1.donemId));
  /* 2. koşu: farklı dönemde de damga izler */
  DB.aktifDonemId = DONEM_B;
  ui.grupPanelBaglam = "havuz";
  ui.havuzAnaId = ayse.id;
  ui.ekOgrenciIds = [emir.id];
  istekGrupEkle();
  const g2 = sonIstek(DB);
  t("farklı dönemde grup istek o döneme damgalanır", g2 && g2.donemId === DONEM_B, String(g2 && g2.donemId));
  DB.aktifDonemId = DONEM_A;
  DB.istekler = [];
  ui.grupPanelBaglam = "plan"; ui.grupPanelSira = [];
}

/* ---- 6) Yeni GRUP dersi doğrudan donemId ile ---- */
console.log("6) Varsa yeni grup dersi doğrudan donemId ile oluşuyor:");
{
  const zeynep = DB.ogrenciler.find((s) => s.ad === "Zeynep Kaya");
  const emir = DB.ogrenciler.find((s) => s.ad === "Emir Aydın");
  DB.dersler = [];
  formuDoldur();
  ui.ekOgrenciIds = [zeynep.id, emir.id];
  planla();
  const gd = sonDers(DB);
  t("grup ders kaydı TEK oluştu", DB.dersler.length === 1 && !!gd);
  t("grup dersin donemId'si = aktif dönem", gd && gd.donemId === DONEM_A, String(gd && gd.donemId));
  t("grup üyeleri korunuyor (ogrenciIds 2 ek üye)", gd && JSON.stringify(gd.ogrenciIds) === JSON.stringify([zeynep.id, emir.id]));
  /* temizlik */
  DB.dersler = [];
  ui.ekOgrenciIds = [];
}

/* ---- 7) Eski donemId'li ders düzenlendiğinde donemId değişmiyor ---- */
console.log("7) Eski donemId'ye sahip bir ders düzenlendiğinde donemId değişmiyor:");
{
  /* birebir düzenleme: kayıt eski dönemden, form düzenleme moduna alınıp planla çağrılır */
  const eskiDers = { id: "test-eski-ders-1", ogrenciId: DB.ogrenciler.find((s) => s.ad === "Ayşe Demir").id, ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "Eski konu", ogretmenId: DB.ogretmenler.find((o) => o.ad === "SONER AÇIKGÖZ").id, ogretmenAd: "SONER AÇIKGÖZ", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2025-09-01", donemId: DONEM_B };
  DB.dersler.push(eskiDers);
  formuDoldur();
  reg["f-konu"].value = "Güncellenen konu";
  ui.editId = eskiDers.id;
  ui.ekOgrenciIds = [];
  planla();
  const duzenlenen = DB.dersler.find((l) => l.id === "test-eski-ders-1");
  t("düzenleme uygulandı (konu değişti)", duzenlenen && duzenlenen.konu === "Güncellenen konu");
  t("düzenlemede donemId 'donem-2025-2026' olarak AYNEN kaldı", duzenlenen && duzenlenen.donemId === DONEM_B, String(duzenlenen && duzenlenen.donemId));
  t("düzenleme yeni donemId (aktif) YAZMADI", duzenlenen && duzenlenen.donemId !== DONEM_A);
  t("düzenleme sonrası yeni kopya kayıt oluşmadı", DB.dersler.filter((l) => l.ogrenciAd === "Ayşe Demir" && l.tarih === gelecekPzt).length === 1);
  DB.dersler = DB.dersler.filter((l) => l !== eskiDers);
  ui.editId = null;
  /* grup düzenleme: eski donemId'li grup dersi düzenlenir */
  const eskiGrup = { id: "test-eski-grup-1", ogrenciId: DB.ogrenciler.find((s) => s.ad === "Ayşe Demir").id, ogrenciIds: [DB.ogrenciler.find((s) => s.ad === "Zeynep Kaya").id], ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "Eski grup konusu", ogretmenId: DB.ogretmenler.find((o) => o.ad === "SONER AÇIKGÖZ").id, ogretmenAd: "SONER AÇIKGÖZ", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2025-09-01", donemId: DONEM_B };
  DB.dersler.push(eskiGrup);
  formuDoldur();
  ui.ekOgrenciIds = [DB.ogrenciler.find((s) => s.ad === "Zeynep Kaya").id, DB.ogrenciler.find((s) => s.ad === "Emir Aydın").id];
  ui.editId = eskiGrup.id;
  planla();
  const duzenlenenG = DB.dersler.find((l) => l.id === "test-eski-grup-1");
  t("grup düzenleme uygulandı (üye eklendi)", duzenlenenG && duzenlenenG.ogrenciIds.length === 2);
  t("grup düzenlemede donemId değişmedi", duzenlenenG && duzenlenenG.donemId === DONEM_B, String(duzenlenenG && duzenlenenG.donemId));
  DB.dersler = DB.dersler.filter((l) => l !== eskiGrup);
  ui.editId = null; ui.ekOgrenciIds = [];
}

/* ---- 8) Eski donemId'li istek güncellenirken donemId değişmiyor ---- */
console.log("8) Eski donemId'ye sahip bir istek güncellendiğinde donemId değişmiyor:");
{
  const eskiIstek = { id: "test-eski-istek-1", ogrenciId: DB.ogrenciler.find((s) => s.ad === "Ayşe Demir").id, ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "Eski istek konusu", durum: "bekliyor", olusturma: "2025-09-01", donemId: DONEM_B };
  DB.istekler.push(eskiIstek);
  /* istekten planlama yolu: planla() istekte yalnızca durum alanını günceller */
  formuDoldur();
  reg["f-konu"].value = "Eski istek konusu";
  ui.aktifIstekId = eskiIstek.id;
  ui.editId = null;
  ui.ekOgrenciIds = [];
  planla();
  t("planlama sonrası istek durumu 'planlandi'", eskiIstek.durum === "planlandi");
  t("planlama yolu eski istek donemId'sini DEĞİŞTİRMEDİ", eskiIstek.donemId === DONEM_B, String(eskiIstek.donemId));
  /* normalize yolu: dolu donemId ASLA üzerine yazılmaz */
  const snap = derinKopya(eskiIstek);
  const n = normalize(derinKopya({ ...D, istekler: [eskiIstek] }));
  t("normalize dolu donemId'li isteğe dokunmaz", JSON.stringify(n.istekler[0].donemId) === JSON.stringify(DONEM_B));
  t("normalize eski istek alanlarını korur (donemId dahil)", alanEsit(n.istekler[0], snap));
  /* güncelleme (silme yok): dizi işlemleri donemId taşır */
  DB.istekler = DB.istekler.filter((r) => r !== eskiIstek);
  t("istek listeden çıkarıldı (temizlik)", DB.istekler.every((r) => r.id !== "test-eski-istek-1"));
  ui.aktifIstekId = null;
}

/* ---- 9) Yeni alan dışında mevcut veriler korunuyor ---- */
console.log("9) Yeni alan (donemId) dışında mevcut veriler korunuyor:");
{
  const dersOnce = derinKopya(DB.dersler);
  const istekOnce = derinKopya(DB.istekler);
  const ogrOnce = derinKopya(DB.ogrenciler);
  const ogrtOnce = derinKopya(DB.ogretmenler);
  const sinifProgOnce = derinKopya(DB.sinifProg);
  /* bir ders + bir istek daha oluştur; mevcutlara dokunulmalı */
  formuDoldur();
  planla();
  reg["h-ogrenci"].value = "Ayşe Demir"; reg["h-ders"].value = "mat"; reg["h-konu"].value = "Yeni istek";
  istekEkle();
  t("mevcut derslere dokunulmadı", JSON.stringify(DB.dersler.slice(0, dersOnce.length)) === JSON.stringify(dersOnce));
  t("mevcut isteklere dokunulmadı", JSON.stringify(DB.istekler.slice(0, istekOnce.length)) === JSON.stringify(istekOnce));
  t("öğrenci listesi değişmedi", alanEsit(DB.ogrenciler, ogrOnce));
  t("öğretmen listesi değişmedi", alanEsit(DB.ogretmenler, ogrtOnce));
  t("sinifProg değişmedi", alanEsit(DB.sinifProg, sinifProgOnce));
  t("yeni ders yalnızca donemId ile farklı değil — diğer alanlar da doğru", (() => { const son = sonDers(DB); return son.ogrenciAd === "Ayşe Demir" && son.dersId === "mat" && son.kod === "8" && son.durum === "planlandi" && son.donemId === DONEM_A; })());
  DB.dersler = DB.dersler.slice(0, dersOnce.length);
  DB.istekler = DB.istekler.slice(0, istekOnce.length);
}

/* ---- 10) Farklı DB bağlamında helper + damga (bosDB + loadDB yolu) ---- */
console.log("10) Helper: güvenli dönem değeri sözleşmesi:");
{
  t("helper DB.aktifDonemId doluysa ONU kullanır (yeni kayıt dönemi)", aktifDonemId() === DB.aktifDonemId);
  const kayitli = aktifDonemId();
  t("dönen değer her koşulda dolu string", typeof kayitli === "string" && kayitli.length > 0);
  t("fallback değeri 'donem-2026-2027' sözleşmesi kaynakta", readFileSync("app.js", "utf8").includes('DB.aktifDonemId : "donem-2026-2027"'));
  t("4 kayıt noktasında donemId: aktifDonemId() damgası var", (readFileSync("app.js", "utf8").match(/donemId: aktifDonemId\(\)/g) || []).length === 4);
}

/* ---- 11) 2. DB bağlamı: istek/plan akışı taze DB'de de damgalı ---- */
console.log("11) Taze DB (bosDB yolu) akışında damga sürüyor:");
{
  /* 2. API bağlamı (D) ile: aktif dönem B'ye alınıp tekli istek + ders damgası izler */
  D.aktifDonemId = DONEM_B;
  reg["h-ogrenci"].value = "Ayşe Demir"; reg["h-ders"].value = "mat"; reg["h-konu"].value = "Bağlam 2";
  const istOnce = D.istekler.length;
  istekEkle2();
  const r2 = sonIstek(D);
  t("2. bağlamda yeni istek 'donem-2025-2026' aldı", r2 && r2.donemId === DONEM_B, String(r2 && r2.donemId));
  D.istekler = D.istekler.slice(0, istOnce);
  D.dersler = [];
  formuDoldur();
  planla2();
  const d2b = sonDers(D);
  t("2. bağlamda yeni ders 'donem-2025-2026' aldı", d2b && d2b.donemId === DONEM_B, String(d2b && d2b.donemId));
  D.dersler = [];
  D.aktifDonemId = DONEM_A;
  /* grup istek yolu 2. bağlamda: ana = ui.havuzAnaId, ekler = ui.ekOgrenciIds */
  const ayse2 = D.ogrenciler.find((s) => s.ad === "Ayşe Demir");
  const zeynep2 = D.ogrenciler.find((s) => s.ad === "Zeynep Kaya");
  ui2.grupPanelBaglam = "havuz";
  ui2.havuzAnaId = ayse2.id;
  ui2.ekOgrenciIds = [zeynep2.id];
  reg["h-ders"].value = "mat"; reg["h-konu"].value = "Bağlam 2 grup";
  D.istekler = [];
  istekGrupEkle2();
  const g2b = sonIstek(D);
  t("2. bağlamda yeni grup istek 'donem-2026-2027' aldı (A'ya döndük)", g2b && g2b.donemId === DONEM_A, String(g2b && g2b.donemId));
  D.istekler = [];
  ui2.grupPanelBaglam = "plan"; ui2.havuzAnaId = null; ui2.ekOgrenciIds = [];
}

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 50) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-donem-damga.mjs kosan=" + __kosan + " beklenen=50"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-donem-damga.mjs:" + __kosan + ":50"); } });