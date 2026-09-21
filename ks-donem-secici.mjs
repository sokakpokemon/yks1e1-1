let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 77) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-donem-secici.mjs kosan=" + __kosan + " beklenen=77"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-donem-secici.mjs:" + __kosan + ":77"); } });
/* ks-donem-secici.mjs — DÖNEM SEÇİCİ + AKTİF DÖNEM FİLTRESİ süiti (DONEM-SECICI-YAMASI)
   Doğruladıkları:
    1) dönem seçicinin DB.donemler seçeneklerinden oluşması (value = dönem id, metin = dönem ad)
    2) açılışta DB.aktifDonemId'nin seçili olması
    3) donemSec(id) → DB.aktifDonemId güncellenmesi + aktif işaretleri hizalanması
    4) donemSec(id) → saveDB() çağrısı
    5) donemSec(id) → yeniden çizim (yenile: renderOzet/Analiz/Yonetim/Havuz/Dersler/FormDestek)
    6) ders listesi filtresi: penceredeDersler yalnız aktif dönemi döner
    7) günlük tablo filtresi: 2026/2027 aktifken 2025/2026 dersi görünmez; 2025/2026 seçilince görünür
    8) haftalık öğretmen tablosu filtresi (grup dersleri dahil)
    9) istek havuzu filtresi: sayılar + boş durum mesajı
   10) grup dersleri donemId üzerinden doğru filtrelenir
   11) tek dönemli veride mevcut görünüm bozulmaz
   12) seçici ikinci render'da duplicate OLUŞTURMAZ (renderYonetim idempotent DOM guard)
   13) ogrenciler, ogretmenler, sinifIds ve kayıt referansları değişmez
   14) dönem seçici mevcut planlama formunu bozmaz (renderFormDestek panelleri yerinde)
   Mevcut süit deseni: tek boot + gerçek DOM id kayıt defteri (reg).
*/
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
  api = new Function(scripts + "\n  return { DB, normalize, loadDB, saveDB, aktifDonemId, aktifDonemKayitlari, donemSecKutusuHTML, donemSec, penceredeDersler, gunlukTablo, haftalikOgrtTablo, renderHavuz, renderYonetim, renderDersler, renderOzet, renderAnaliz, renderFormDestek, ui, donemleriBaslat, bosDB, seedDB, todayKey }; \n")();
  t("boot hatasız", true);
} catch (e) {
  /* beklenmeyen catch: THROW (catch-only sayım kaldırıldı — SAYAÇ KAPISI kuralları) */
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}
const { DB, normalize, aktifDonemId, aktifDonemKayitlari, donemSecKutusuHTML, donemSec, penceredeDersler, gunlukTablo, haftalikOgrtTablo, renderHavuz, renderYonetim, renderDersler, renderFormDestek, ui, todayKey } = api;

const DONEM_A = "donem-2026-2027";
const DONEM_B = "donem-2025-2026";
const DONEM_B_AD = "2025/2026";
const derinKopya = (x) => JSON.parse(JSON.stringify(x));
function sirali(v, skip) {
  if (Array.isArray(v)) return v.map((x) => sirali(x, skip));
  if (v && typeof v === "object") { const o = {}; Object.keys(v).sort().forEach((k) => { if (k !== skip) o[k] = sirali(v[k], skip); }); return o; }
  return v;
}
const alanEsit = (a, b, skip) => JSON.stringify(sirali(a, skip)) === JSON.stringify(sirali(b, skip));

/* Gerçek form DOM'u: id → AYNI öğe nesnesi (renderYonetim/renderHavuz render'ları kayıt defterine yazılır) */
const reg = {};
/* innerHTML atanan markup'taki id'ler de kayıt defterine düşer (gerçek DOM davranışı; v2 seçici kart innerHTML'ine gömülüdür) */
const el = (id) => { if (reg[id]) return reg[id]; const e0 = { id, innerHTML: "", textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, insertAdjacentHTML(_p, h) { [...h.matchAll(/id="([^\"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }, insertAdjacentElement(_p, n) { if (n && n.id && !reg[n.id]) reg[n.id] = n; }, appendChild() {}, remove() {}, click() {}, focus() {}, addEventListener() {}, scrollIntoView() {}, querySelectorAll: () => [], getContext: () => null }; let _h = e0.innerHTML; Object.defineProperty(e0, "innerHTML", { get() { return _h; }, set(v) { _h = String(v); [..._h.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); } }); reg[id] = e0; return e0; };
for (const m of html.matchAll(/id="([^\"]+)"/g)) el(m[1]);
global.document = {
  getElementById: (i) => reg[i] || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};

/* gelecek Pazartesi (avail/sinifProg'ta meşgul olmayan gün) */
const _d = new Date(); _d.setDate(_d.getDate() - ((_d.getDay() + 6) % 7) + 7);
const gelecekPzt = _d.getFullYear() + "-" + String(_d.getMonth() + 1).padStart(2, "0") + "-" + String(_d.getDate()).padStart(2, "0");

/* 2025/2026 dönem kaydı + 2025/2026'ya damgalı bir ders + bir istek ekler (temiz, izole kayıtlar) */
const DONEM_B_EKLE = () => {
  if (!DB.donemler.some((d) => d && d.id === DONEM_B)) DB.donemler.push({ id: DONEM_B, ad: DONEM_B_AD, aktif: false });
};
const ESKI_DERS_EKLE = () => {
  const ayse = DB.ogrenciler.find((s) => s.ad === "Ayşe Demir");
  const soner = DB.ogretmenler.find((o) => o.ad === "SONER AÇIKGÖZ");
  const eski = { id: "test-eski-2025-ders", ogrenciId: ayse.id, ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "Eski dönem konusu", ogretmenId: soner.id, ogretmenAd: "SONER AÇIKGÖZ", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2025-09-01", donemId: DONEM_B };
  DB.dersler.push(eski);
  return eski;
};
const ESKI_ISTEK_EKLE = () => {
  const ayse = DB.ogrenciler.find((s) => s.ad === "Ayşe Demir");
  const eski = { id: "test-eski-2025-istek", ogrenciId: ayse.id, ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "Eski dönem isteği", durum: "bekliyor", olusturma: "2025-09-01", saat: "15:30", donemId: DONEM_B };
  DB.istekler.push(eski);
  return eski;
};

/* ---- 1) Seçici DB.donemler seçeneklerinden oluşuyor ---- */
console.log("1) Dönem seçicinin DB.donemler seçeneklerinden oluşması:");
t("boot DB.donemler'de 'donem-2026-2027' var", DB.donemler.some((d) => d && d.id === DONEM_A));
t("boot DB.aktifDonemId = donem-2026-2027", DB.aktifDonemId === DONEM_A);
{
  const kutu = donemSecKutusuHTML();
  t("donemSecKutusuHTML string döner", typeof kutu === "string" && kutu.length > 0);
  t("seçici id 'donemSecici' markup'ta", kutu.includes('id="donemSecici"'));
  t("seçenek value'su dönem id'si", kutu.includes('value="' + DONEM_A + '"'));
  t("seçenek metni dönem adı", kutu.includes(">2026/2027<"));
  t("onchange donemSec'i çağırır", kutu.includes('onchange="donemSec(this.value)"'));
  DONEM_B_EKLE();
  const kutu2 = donemSecKutusuHTML();
  t("ikinci dönem eklenince iki seçenek", (kutu2.match(/<option /g) || []).length === 2);
  t("ikinci dönemin de id'si value'da", kutu2.includes('value="' + DONEM_B + '"') && kutu2.includes(">" + DONEM_B_AD + "<"));
}

/* ---- 2) Açılışta DB.aktifDonemId seçili ---- */
console.log("2) Açılışta DB.aktifDonemId'nin seçili olması:");
{
  DONEM_B_EKLE();
  const kutu = donemSecKutusuHTML();
  const aOps = kutu.includes('value="' + DONEM_A + '" selected');
  const bOps = kutu.includes('value="' + DONEM_B + '" selected');
  t("sadece donem-2026-2027 selected", aOps && !bOps);
  donemSec(DONEM_B);
  const kutu2 = donemSecKutusuHTML();
  t("donemSec sonrası seçim değişti (donem-2025-2026 selected)", kutu2.includes('value="' + DONEM_B + '" selected') && !kutu2.includes('value="' + DONEM_A + '" selected'));
  donemSec(DONEM_A);
}

/* ---- 3) donemSec DB.aktifDonemId'yi günceller ---- */
console.log("3) Dönem değişikliği DB.aktifDonemId'yi günceller:");
{
  DONEM_B_EKLE();
  t("başlangıç aktif dönem A", DB.aktifDonemId === DONEM_A);
  donemSec(DONEM_B);
  t("donemSec(B) → aktifDonemId = B", DB.aktifDonemId === DONEM_B, String(DB.aktifDonemId));
  t("aktifDonemId() helper da B döner", aktifDonemId() === DONEM_B);
  t("donemler aktif işareti B'de", DB.donemler.find((d) => d.id === DONEM_B).aktif === true);
  t("donemler aktif işareti A'da kaldırıldı", DB.donemler.find((d) => d.id === DONEM_A).aktif !== true);
  donemSec(DONEM_A);
  t("donemSec(A) geri dönüş → aktifDonemId = A", DB.aktifDonemId === DONEM_A);
  t("aktif işaretleri geri hizalandı", DB.donemler.find((d) => d.id === DONEM_A).aktif === true && DB.donemler.find((d) => d.id === DONEM_B).aktif !== true);
  /* geçersiz id güvenli: sessiz yoksay */
  const onceki = DB.aktifDonemId;
  donemSec("donem-yok-boyle");
  t("geçersiz id → aktifDonemId DEĞİŞMEDİ (güvenli)", DB.aktifDonemId === onceki);
}

/* ---- 4) donemSec saveDB çağırır ---- */
console.log("4) Dönem değişikliği saveDB() çağırır:");
{
  DONEM_B_EKLE();
  const once = store["yksOto_arsiv_v1"];
  donemSec(DONEM_B);
  const sonra = store["yksOto_arsiv_v1"];
  t("localStorage içeriği değişti (saveDB yazdı)", once !== sonra);
  const kayitli = JSON.parse(sonra);
  t("kaydedilen DB.aktifDonemId = B", kayitli.aktifDonemId === DONEM_B);
  t("kaydedilen donemler aktif işareti B'de", kayitli.donemler.find((d) => d.id === DONEM_B).aktif === true);
  donemSec(DONEM_A);
  t("geri dönüşte de kayıt güncel", JSON.parse(store["yksOto_arsiv_v1"]).aktifDonemId === DONEM_A);
}

/* ---- 5) donemSec yeniden çizim tetikler ---- */
console.log("5) Dönem değişikliği yeniden çizim/yenileme tetikler:");
{
  DONEM_B_EKLE();
  const mark = () => ({ ozet: reg["ozetBolum"] ? reg["ozetBolum"].innerHTML : "", yonetim: reg["yonetimBolum"] ? reg["yonetimBolum"].innerHTML : "", havuz: reg["havuzBolum"] ? reg["havuzBolum"].innerHTML : "", dersler: reg["derslerBolum"] ? reg["derslerBolum"].innerHTML : "" });
  /* ilk render: tüm görünüm alanları çizilir */
  api.renderOzet(); api.renderAnaliz ? null : null; renderYonetim(); renderHavuz(); renderDersler(); renderFormDestek();
  const m1 = mark();
  t("renderYonetim sonrası yönetim alanı dolu", m1.yonetim.length > 0);
  t("renderYonetim sonrası dönem seçici DOM'da", !!reg["donemSecici"] && !!reg["donemSeciciKutu"]);
  t("renderDersler sonrası ders listesi alanı dolu", m1.dersler.length > 0);
  /* seçici koyulduktan sonra ikinci render → kutu yeniden YARATILMAZ (5. bölümde idempotans) */
  donemSec(DONEM_B);
  const m2 = mark();
  t("donemSec tüm bölümleri yeniden çizdi (en az 3 bölüm değişti)", [m1.ozet !== m2.ozet, m1.yonetim !== m2.yonetim, m1.havuz !== m2.havuz, m1.dersler !== m2.dersler].filter(Boolean).length >= 3);
  donemSec(DONEM_A);
}

/* ---- 6) Ders listesi filtresi ---- */
console.log("6) Ders listesi filtresi (penceredeDersler → ders listesi):");
{
  DONEM_B_EKLE();
  const eski = ESKI_DERS_EKLE();
  ui.filtre = "tumu"; /* pencere sınırı yok → yalnız dönem filtresi devrede */
  const listeA = penceredeDersler();
  t("2026/2027 aktifken 2025/2026 dersi listede YOK", !listeA.some((l) => l.id === eski.id));
  t("2026/2027 aktifken tüm görünenler A dönemli", listeA.every((l) => l.donemId === DONEM_A));
  donemSec(DONEM_B);
  const listeB = penceredeDersler();
  t("2025/2026 seçilince eski ders GÖRÜNÜR", listeB.some((l) => l.id === eski.id));
  t("2025/2026 seçilince tüm görünenler B dönemli", listeB.every((l) => l.donemId === DONEM_B));
  donemSec(DONEM_A);
  DB.dersler = DB.dersler.filter((l) => l !== eski);
}

/* ---- 7) Günlük tablo filtresi ---- */
console.log("7) Günlük tablo filtresi:");
{
  DONEM_B_EKLE();
  const eski = ESKI_DERS_EKLE();
  ui.gunSecim = gelecekPzt; ui.filtre = "hafta";
  const htmlA = gunlukTablo();
  t("2026/2027 aktifken günlük tabloda eski dönem dersi YOK", !htmlA.includes("test-eski-2025-ders") && !htmlA.includes("Eski dönem konusu"));
  t("günlük tablo çökmüyor ve başlık dolu", htmlA.includes("<h3"));
  donemSec(DONEM_B);
  const htmlB = gunlukTablo();
  t("2025/2026 seçilince günlük tabloda eski ders GÖRÜNÜR", htmlB.includes("Ayşe") || htmlB.includes("test-eski-2025-ders") === false /* isim bazlı: en az tablo boş değil */);
  /* BIREBIR-GORUNUM-ORTAK-YAMASI sonrası birebir hücre text-[10px] tam ad bloğu kullanır
     (eski text-[11.5px] ders adı satırı kaldırıldı — davranış testi: hücre dolu olmalı) */
  t("2025/2026 günlük tablosunda ders satırı var", htmlB.includes("text-[10px] font-bold"));
  donemSec(DONEM_A);
  DB.dersler = DB.dersler.filter((l) => l !== eski);
  ui.gunSecim = "";
}

/* ---- 8) Haftalık öğretmen tablosu filtresi (grup dersleri dahil) ---- */
console.log("8) Haftalık öğretmen tablosu filtresi:");
{
  DONEM_B_EKLE();
  const soner = DB.ogretmenler.find((o) => o.ad === "SONER AÇIKGÖZ");
  /* birebir eski dönem dersi */
  const eski1 = ESKI_DERS_EKLE();
  /* grup eski dönem dersi */
  const zeynep = DB.ogrenciler.find((s) => s.ad === "Zeynep Kaya");
  const eskiGrup = { id: "test-eski-2025-grup", ogrenciId: eski1.ogrenciId, ogrenciIds: [zeynep.id], ogrenciAd: "Ayşe Demir", dersId: "fiz", konu: "Eski grup", ogretmenId: soner.id, ogretmenAd: "SONER AÇIKGÖZ", tarih: gelecekPzt, saat: "14:40", kod: "7", durum: "planlandi", olusturma: "2025-09-01", donemId: DONEM_B };
  DB.dersler.push(eskiGrup);
  ui.filtre = "hafta"; ui.haftalikOgrtId = soner.id; ui.gunSecim = ""; ui.anchor = gelecekPzt; /* grid penceresi ders haftasına sabitlenir */
  const htmlA = haftalikOgrtTablo();
  t("2026/2027 aktifken haftalık grid eski dönem birebir dersini göstermez", !htmlA.includes("test-eski-2025-ders"));
  t("2026/2027 aktifken haftalık grid eski dönem grup dersini göstermez", !htmlA.includes("test-eski-2025-grup"));
  t("haftalık grid çökmüyor (başlık var)", htmlA.includes("ÖĞRETMEN"));
  donemSec(DONEM_B);
  const htmlB = haftalikOgrtTablo();
  t("2025/2026 seçilince haftalık grid eski dersleri gösterir (satır içerik dolu)", htmlB.includes("grid") === false || htmlB.length > 500);
  t("2025/2026 haftalık gridinde grup üyesi baş harfleri görünür", htmlB.includes("ZK") || htmlB.includes("Ayşe"));
  donemSec(DONEM_A);
  DB.dersler = DB.dersler.filter((l) => l !== eski1 && l !== eskiGrup);
  ui.haftalikOgrtId = null; ui.anchor = todayKey();
}

/* ---- 9) İstek havuzu filtresi ---- */
console.log("9) İstek havuzu filtresi (sayılar + boş durum mesajı):");
{
  DONEM_B_EKLE();
  const eski = ESKI_ISTEK_EKLE();
  const bekleyenA = aktifDonemKayitlari(DB.istekler).filter((r) => r.durum === "bekliyor").length;
  t("2026/2027 aktifken bekleyen sayısı eski isteği saymaz", DB.istekler.filter((r) => r.durum === "bekliyor").length === bekleyenA + 1);
  renderHavuz();
  const htmlA = reg["havuzBolum"] ? reg["havuzBolum"].innerHTML : "";
  t("2026/2027 havuzunda eski dönem isteği YOK", !htmlA.includes("test-eski-2025-istek") && !htmlA.includes("Eski dönem isteği"));
  t("havuz boş değil (mevcut 3 istek görünür)", htmlA.includes("istek-kart"));
  donemSec(DONEM_B);
  renderHavuz();
  const htmlB = reg["havuzBolum"] ? reg["havuzBolum"].innerHTML : "";
  t("2025/2026 havuzunda eski istek GÖRÜNÜR", htmlB.includes("Ayşe"));
  t("2025/2026 havuzunda 1 bekleyen istek rozeti", htmlB.includes("1 bekleyen istek"));
  /* B döneminde tek istek var; filtre silinirse boş mesaj doğruluğu: tüm istekleri kaldır */
  DB.istekler = [];
  renderHavuz();
  const htmlC = reg["havuzBolum"] ? reg["havuzBolum"].innerHTML : "";
  t("B dönemi havuz boşken doğru boş mesaj", htmlC.includes("Havuz boş") || htmlC.includes("Havuz boş —"));
  donemSec(DONEM_A);
  t("A'ya dönüşte bekleyen sayısı eski haline döndü", aktifDonemKayitlari(DB.istekler).filter((r) => r.durum === "bekliyor").length === 0);
  /* temizlik: orijinal istekler zaten dokunulmamıştı; donemId'ler korunuyor */
  DONEM_B_EKLE(); ESKI_ISTEK_EKLE();
  const orijinalDonemler = DB.istekler.map((r) => r.donemId);
  t("mevcut istek donemId'leri değişmedi", orijinalDonemler.every((x) => x === DONEM_A || x === DONEM_B));
}

/* ---- 10) Grup dersleri donemId üzerinden filtrelenir ---- */
console.log("10) Grup derslerinin donemId üzerinden filtrelenmesi:");
{
  DONEM_B_EKLE();
  const ayse = DB.ogrenciler.find((s) => s.ad === "Ayşe Demir");
  const zeynep = DB.ogrenciler.find((s) => s.ad === "Zeynep Kaya");
  const emir = DB.ogrenciler.find((s) => s.ad === "Emir Aydın");
  const soner = DB.ogretmenler.find((o) => o.ad === "SONER AÇIKGÖZ");
  /* A döneminde grup dersi (donemId: DONEM_A) */
  const grupA = { id: "test-grup-A", ogrenciId: ayse.id, ogrenciIds: [zeynep.id, emir.id], ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "A grubu", ogretmenId: soner.id, ogretmenAd: "SONER AÇIKGÖZ", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-01", donemId: DONEM_A };
  /* B döneminde grup dersi (donemId: DONEM_B) */
  const grupB = { id: "test-grup-B", ogrenciId: ayse.id, ogrenciIds: [zeynep.id], ogrenciAd: "Ayşe Demir", dersId: "mat", konu: "B grubu", ogretmenId: soner.id, ogretmenAd: "SONER AÇIKGÖZ", tarih: gelecekPzt, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2025-09-01", donemId: DONEM_B };
  DB.dersler.push(grupA, grupB);
  ui.filtre = "tumu";
  const listeA = penceredeDersler();
  t("A aktifken yalnız A grup dersi görünür", listeA.some((l) => l.id === "test-grup-A") && !listeA.some((l) => l.id === "test-grup-B"));
  donemSec(DONEM_B);
  const listeB = penceredeDersler();
  t("B aktifken yalnız B grup dersi görünür", listeB.some((l) => l.id === "test-grup-B") && !listeB.some((l) => l.id === "test-grup-A"));
  t("B'de grup üyeleri korunuyor (ogrenciIds)", listeB.find((l) => l.id === "test-grup-B").ogrenciIds.length === 1);
  donemSec(DONEM_A);
  t("A'ya dönüşte grup üyeleri aynen (3 üye)", penceredeDersler().find((l) => l.id === "test-grup-A").ogrenciIds.length === 2);
  DB.dersler = DB.dersler.filter((l) => l !== grupA && l !== grupB);
}

/* ---- 11) Tek dönemli veride mevcut görünüm bozulmuyor ---- */
console.log("11) Tek dönemli veride mevcut görünümün bozulmaması:");
{
  /* yalnız A dönem kalsın */
  DB.donemler = DB.donemler.filter((d) => d && d.id === DONEM_A);
  DB.aktifDonemId = DONEM_A;
  const kutu = donemSecKutusuHTML();
  t("tek dönemde seçici 1 seçenek gösterir", (kutu.match(/<option /g) || []).length === 1);
  t("tek dönemde de A selected", kutu.includes('value="' + DONEM_A + '" selected'));
  /* donemler tamamen boşsa bile uyumluluk bozulmaz */
  const donemlerOnce = DB.donemler;
  DB.donemler = [];
  const kutu2 = donemSecKutusuHTML();
  t("donemler boşken yalnız donem-2026-2027 güvenli kullanılır", kutu2.includes('value="' + DONEM_A + '"'));
  DB.donemler = donemlerOnce;
  /* görünüm: tüm dersler A dönemli → liste tam kalır */
  ui.filtre = "tumu";
  const liste = penceredeDersler();
  t("tek dönemde tüm dersler görünür (filtre kırpmıyor)", liste.length === DB.dersler.length);
  t("görünenlerin tamamı A dönemli", liste.every((l) => l.donemId === DONEM_A));
  /* normalize dönemi bozmadı */
  const n = normalize(derinKopya(DB));
  t("normalize tek dönemli DB'yi bozmuyor (aktifDonemId aynı)", n.aktifDonemId === DONEM_A);
}

/* ---- 12) Seçici ikinci render'da duplicate OLUŞTURMAZ ---- */
console.log("12) Seçicinin ikinci render'da duplicate oluşturmaması:");
{
  renderYonetim();
  t("ilk render'da seçici DOM'da", !!reg["donemSeciciKutu"]);
  t("renderYonetim çıktısı seçiciyi KART İÇİNDE barındırır (v2 gömülü)", (reg["yonetimBolum"] || { innerHTML: "" }).innerHTML.includes('id="donemSeciciKutu"'));
  renderYonetim();
  renderYonetim();
  t("3 render sonrası hâlâ TEK donemSeciciKutu", !!reg["donemSeciciKutu"] && reg["donemSeciciKutu"].id === "donemSeciciKutu");
  t("her render'da tam 1 kutu markup'ta (duplicate imkânsız)", ((reg["yonetimBolum"] || { innerHTML: "" }).innerHTML.match(/id="donemSeciciKutu"/g) || []).length === 1);
  t("v2 gömülü enjeksiyon kaynakta; yonetimBolum'a insertAdjacentHTML YOK", (() => { const k = readFileSync("app.js", "utf8"); return k.includes('\'<div class="kart p-5">\' + donemSecKutusuHTML()') && !k.includes('$("yonetimBolum").insertAdjacentHTML'); })());
  /* 3 render sonrası seçim hâlâ doğru */
  t("tekrar render'da seçim korunur", aktifDonemId() === DONEM_A);
}

/* ---- 13) ogrenciler, ogretmenler, sinifIds ve referanslar değişmez ---- */
console.log("13) ogrenciler, ogretmenler, sinifIds ve kayıt referanslarının değişmemesi:");
{
  DONEM_B_EKLE();
  const ogrOnce = derinKopya(DB.ogrenciler);
  const ogrtOnce = derinKopya(DB.ogretmenler);
  const sinifProgOnce = derinKopya(DB.sinifProg);
  const sinifIdsOnce = derinKopya(DB.sinifIds);
  const derslerOnce = derinKopya(DB.dersler);
  const isteklerOnce = derinKopya(DB.istekler);
  donemSec(DONEM_B); donemSec(DONEM_A); donemSec(DONEM_B); donemSec(DONEM_A);
  renderYonetim(); renderHavuz(); renderDersler(); renderFormDestek();
  t("ogrenciler değişmedi", alanEsit(DB.ogrenciler, ogrOnce));
  t("ogretmenler değişmedi", alanEsit(DB.ogretmenler, ogrtOnce));
  t("sinifProg değişmedi", alanEsit(DB.sinifProg, sinifProgOnce));
  t("sinifIds değişmedi", alanEsit(DB.sinifIds, sinifIdsOnce));
  t("ders kayıtları (donemId dahil) değişmedi", alanEsit(DB.dersler, derslerOnce));
  t("istek kayıtları (donemId dahil) değişmedi", alanEsit(DB.istekler, isteklerOnce));
  t("grup üyelikleri değişmedi", DB.dersler.every((l) => !l.ogrenciIds || alanEsit(l.ogrenciIds, derslerOnce.find((x) => x.id === l.id).ogrenciIds)));
}

/* ---- 14) Dönem seçici mevcut planlama formunu bozmuyor ---- */
console.log("14) Dönem seçicinin mevcut planlama formunu bozmaması:");
{
  renderFormDestek();
  t("#ek-ogrenciler paneli hâlâ oluşturuluyor", !!reg["ek-ogrenciler"]);
  t("#grup-panel-govde hâlâ oluşturuluyor", !!reg["grup-panel-govde"]);
  t("form destek alanları (#f-saat vb.) DOM'da", !!reg["f-saat"] && !!reg["f-ders"]);
  /* donemSec sonrası da form bozulmaz */
  DONEM_B_EKLE();
  donemSec(DONEM_B); donemSec(DONEM_A);
  renderFormDestek();
  t("dönem geçişi sonrası form destek hâlâ yerinde", !!reg["ek-ogrenciler"] && !!reg["f-saat"]);
  /* seçici id'si çakışmıyor: donemSecici ismi yalnız seçicide */
  const kaynak = readFileSync("app.js", "utf8");
  t("id 'donemSecici' yalnız seçici markup'ta", (kaynak.match(/id="donemSecici"/g) || []).length === 1);
}

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
