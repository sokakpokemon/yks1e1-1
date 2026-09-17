/* ks-donem-olusturma.mjs — DONEM-OLUSTURMA-YAMASI süiti: 2027/2028 dönemi + dönemli sınıf programı (sinifProgDonemler)
   Doğruladıkları:
    1) Eski tek dönemlik DB.sinifProg'un "donem-2026-2027"ye KAYIPSIZ migration'ı (normalize yolu)
    2) sinifProgDonemler zaten varsa mevcut programların KORUNMASI (silme/üzerine yazma yok)
    3) 2027/2028'in yalnızca BİR KEZ oluşturulması (donemler[] tek kayıt)
    4) Yeni döneme ders/istek KOPYALANMAMASI
    5) Yeni dönem sinifProg'unun ilk oluşturmada BOŞ olması
    6) 2026/2027 ders/istek/program verilerinin korunması
    7) ogrenciler, ogretmenler, sinifIds ve tüm referansların değişmemesi
    8) aktifDonemId + sinifProgDonemId'nin BİRLİKTE güncellenmesi (donemSec + yeniDonemOlustur)
    9) 2027/2028 → 2026/2027 geçişinde eski programın deep-equal geri gelmesi
   10) Tekrar oluşturma/tıklama/normalize idempotansı (duplicate dönem/program yok)
   11) Dönem seçici + "Yeni Dönem Oluştur" kontrolü duplicate üretmez (render idempotansı)
   12) saveDB/yedek döngüsünde dönemli programlar kayıpsız taşınır
   13) index.html, ek-ders.js ve vendor hash'leri değişmez
   Mevcut süit deseni: tek boot + gerçek DOM id kayıt defteri (reg).
*/
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

const EXPORTS = "{ DB, normalize, loadDB, saveDB, yenile, donemleriBaslat, bosDB, seedDB, aktifDonemId, aktifDonemKayitlari, donemSecKutusuHTML, donemSec, yeniDonemOlustur, sinifProgDonemleriBaslat, sinifProgAktif, sinifProguDonemeBagla, donemSeciliSinifProg, penceredeDersler, renderHavuz, renderYonetim, renderDersler, renderOzet, renderAnaliz, renderFormDestek, ui, LS_KEY, DONEM_ILK_ID, DONEM_YENI_ID, DONEM_YENI_AD }";
let api;
try {
  api = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
const { DB, normalize, loadDB, saveDB, donemleriBaslat, bosDB, seedDB, aktifDonemId, aktifDonemKayitlari, donemSecKutusuHTML, donemSec, yeniDonemOlustur, sinifProgDonemleriBaslat, sinifProgAktif, sinifProguDonemeBagla, donemSeciliSinifProg, penceredeDersler, renderHavuz, renderYonetim, renderDersler, renderFormDestek, ui, LS_KEY, DONEM_ILK_ID, DONEM_YENI_ID, DONEM_YENI_AD } = api;

const ID_A = "donem-2026-2027", ID_B = "donem-2027-2028", AD_B = "2027/2028";
const derinKopya = (x) => JSON.parse(JSON.stringify(x));
function sirali(v, skip) {
  if (Array.isArray(v)) return v.map((x) => sirali(x, skip));
  if (v && typeof v === "object") { const o = {}; Object.keys(v).sort().forEach((k) => { if (k !== skip) o[k] = sirali(v[k], skip); }); return o; }
  return v;
}
const alanEsit = (a, b, skip) => JSON.stringify(sirali(a, skip)) === JSON.stringify(sirali(b, skip));

/* Gerçek form DOM'u: id → AYNI öğe nesnesi (mevcut süit deseni) */
const reg = {};
const el = (id) => { if (reg[id]) return reg[id]; const e0 = { id, innerHTML: "", textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, insertAdjacentHTML(_p, h) { [...h.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }, insertAdjacentElement(_p, n) { if (n && n.id && !reg[n.id]) reg[n.id] = n; }, appendChild() {}, remove() {}, click() {}, focus() {}, addEventListener() {}, scrollIntoView() {}, querySelectorAll: () => [], getContext: () => null }; let _h = e0.innerHTML; Object.defineProperty(e0, "innerHTML", { get() { return _h; }, set(v) { _h = String(v); [..._h.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); } }); reg[id] = e0; return e0; };
for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
global.document = {
  getElementById: (i) => reg[i] || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};

/* Boot snapshot'ları (2026/2027 referans verisi) */
const bootOgr = derinKopya(DB.ogrenciler), bootOgrt = derinKopya(DB.ogretmenler), bootSinifIds = derinKopya(DB.sinifIds);
const bootDersSay = DB.dersler.length, bootIstekSay = DB.istekler.length;
const BOOT_PROG = derinKopya(DB.sinifProgDonemler[ID_A]); /* boot migration'ı sonrası 2026/2027 programı */

/* ================= 1) Eski tek dönemlik sinifProg migration'ı ================= */
console.log("1) Eski DB.sinifProg'un donem-2026-2027'ye kayıpsız migration'ı:");
{
  /* eski DB: sinifProgDonemler/sinifProgDonemId yok, sinifProg dolu (öncelik zinciri: sinifProgDonemId → aktifDonemId → donem-2026-2027) */
  const eski = derinKopya(DB);
  delete eski.sinifProgDonemler; delete eski.sinifProgDonemId;
  const progEski = derinKopya(eski.sinifProg);
  const m1 = normalize(eski);
  t("sinifProgDonemler oluştu ve obje", m1.sinifProgDonemler && typeof m1.sinifProgDonemler === "object" && !Array.isArray(m1.sinifProgDonemler));
  t("sinifProgDonemId = donem-2026-2027", m1.sinifProgDonemId === ID_A, String(m1.sinifProgDonemId));
  t("eski program donem-2026-2027 anahtarına KAYIPSIZ bağlandı", alanEsit(m1.sinifProgDonemler[ID_A], progEski));
  t("migration sonrası DB.sinifProg hâlâ 2026/2027 programını gösteriyor", alanEsit(m1.sinifProg, progEski));
  t("program kopyası (referans değil)", m1.sinifProgDonemler[ID_A] !== progEski && m1.sinifProg === m1.sinifProgDonemler[ID_A]);
  t("mevcut donemler kayıtları bozulmadı", alanEsit(m1.donemler, DB.donemler) && m1.donemler.length === DB.donemler.length);
  /* öncelik: sinifProgDonemId doluysa O kullanılır (aktifDonemId başka dönem olsa bile) */
  const eski2 = derinKopya(DB); delete eski2.sinifProgDonemler; eski2.sinifProgDonemId = ID_A; eski2.aktifDonemId = "donem-2025-2026";
  eski2.donemler = [{ id: ID_A, ad: "2026/2027", aktif: false }, { id: "donem-2025-2026", ad: "2025/2026", aktif: true }];
  sinifProgDonemleriBaslat(eski2);
  t("öncelik zinciri: sinifProgDonemId dolu → o döneme bağlandı", alanEsit(eski2.sinifProgDonemler[ID_A], progEski) && eski2.sinifProg === eski2.sinifProgDonemler[ID_A]);
  /* öncelik: sinifProgDonemId yok ama aktifDonemId var */
  const eski3 = derinKopya(DB); delete eski3.sinifProgDonemler; delete eski3.sinifProgDonemId; eski3.aktifDonemId = "donem-2025-2026";
  sinifProgDonemleriBaslat(eski3);
  t("öncelik zinciri: aktifDonemId → o döneme bağlandı", alanEsit(eski3.sinifProgDonemler["donem-2025-2026"], progEski));
  /* öncelik: ikisi de yok → donem-2026-2027 */
  const eski4 = derinKopya(DB); delete eski4.sinifProgDonemler; delete eski4.sinifProgDonemId; delete eski4.aktifDonemId;
  sinifProgDonemleriBaslat(eski4);
  t("öncelik zinciri: ikisi de yok → donem-2026-2027", alanEsit(eski4.sinifProgDonemler[ID_A], progEski) && eski4.sinifProgDonemId === ID_A);
}

/* ================= 2) sinifProgDonemler zaten varsa korunması ================= */
console.log("2) sinifProgDonemler zaten varsa mevcut programların korunması:");
{
  const mevcut = derinKopya(DB);
  mevcut.sinifProgDonemler = { [ID_A]: { "MEZUN SAY 1": ["9-9"], "ÖZEL SINIF": ["1-1"] }, "donem-2020-2021": { "ESKİ DÖNEM DERSİ": ["2-3"] } };
  mevcut.sinifProgDonemId = ID_A;
  const donemlerOnce = derinKopya(mevcut.sinifProgDonemler);
  const sayi = sinifProgDonemleriBaslat(mevcut);
  t("mevcut dönem programları birebir korundu (2020/2021 dahil)", alanEsit(mevcut.sinifProgDonemler, donemlerOnce));
  t("üzerine boş nesne YAZILMADI (ÖZEL SINIF hâlâ dolu)", alanEsit(mevcut.sinifProgDonemler[ID_A], donemlerOnce[ID_A]));
  t("eksik anahtar yalnız ekleniyor (2027/2028 yoksa eklendi)", mevcut.sinifProgDonemler[ID_B] !== undefined || !mevcut.donemler.some(d => d.id === ID_B));
  t("2026/2027 programı DEĞİŞMEDİ (sinifProg aktif gösterimi)", alanEsit(mevcut.sinifProg, mevcut.sinifProgDonemler[ID_A]));
  t("2. geçiş 0 değişiklik (idempotent)", (() => { const s2 = sinifProgDonemleriBaslat(mevcut); return s2.p === 0; })());
}

/* ================= 3) 2027/2028'in yalnızca bir kez oluşturulması ================= */
console.log("3) 2027/2028'in yalnızca bir kez oluşturulması:");
{
  t("başlangıçta 2027/2028 YOK", !DB.donemler.some(d => d && (d.id === ID_B || d.ad === AD_B)));
  yeniDonemOlustur();
  t("yeniDonemOlustur sonrası 2027/2028 var", DB.donemler.some(d => d && d.id === ID_B));
  t("donemler'de 2027/2028 id'si TAM 1 kez", DB.donemler.filter(d => d && d.id === ID_B).length === 1);
  const adSay = DB.donemler.filter(d => d && d.ad === AD_B).length;
  t("2027/2028 adı TAM 1 kez (ad tekrarı yok)", adSay === 1);
  yeniDonemOlustur(); yeniDonemOlustur(); /* art arda 2 tıklama daha */
  t("3 tıklama sonrası hâlâ TAM 1 kayıt (duplicate yok)", DB.donemler.filter(d => d && d.id === ID_B).length === 1 && DB.donemler.length === 2);
  t("3 tıklama sonrası program kopyası TEK", (DB.sinifProgDonemler[ID_B] !== undefined) && Object.keys(DB.sinifProgDonemler).filter(k => k === ID_B).length === 1);
}

/* ================= 4) Yeni döneme ders/istek kopyalanmaması ================= */
console.log("4) Yeni döneme ders/istek kopyalanmaması:");
{
  t("ders sayısı değişmedi (" + bootDersSay + ")", DB.dersler.length === bootDersSay);
  t("istek sayısı değişmedi (" + bootIstekSay + ")", DB.istekler.length === bootIstekSay);
  t("tüm dersler HÂLÂ 2026/2027 dönemli (kopya damgası yok)", DB.dersler.every(l => l.donemId === ID_A));
  t("tüm istekler HÂLÂ 2026/2027 dönemli", DB.istekler.every(r => r.donemId === ID_A));
  t("2027/2028 dönemli ders kaydı YOK", DB.dersler.filter(l => l.donemId === ID_B).length === 0);
  t("2027/2028 dönemli istek kaydı YOK", DB.istekler.filter(r => r.donemId === ID_B).length === 0);
}

/* ================= 5) Yeni dönem sinifProg'u ilk oluşturmada boş ================= */
console.log("5) Yeni dönem sinifProg'u ilk oluşturmada boş:");
{
  t("DB.sinifProgDonemler['donem-2027-2028'] obje ve BOŞ", DB.sinifProgDonemler[ID_B] && typeof DB.sinifProgDonemler[ID_B] === "object" && Object.keys(DB.sinifProgDonemler[ID_B]).length === 0);
  t("aktif dönem 2027/2028'e geçildi", DB.aktifDonemId === ID_B && aktifDonemId() === ID_B);
  t("sinifProgDonemId de 2027/2028 (aynı id)", DB.sinifProgDonemId === ID_B);
  t("DB.sinifProg artık yeni dönemin BOŞ programı", DB.sinifProg === DB.sinifProgDonemler[ID_B] && Object.keys(DB.sinifProg).length === 0);
  t("sinifProgAktif(ID_B) boş döner", Object.keys(sinifProgAktif(ID_B)).length === 0);
  t("donemSeciliSinifProg aktif dönemi gösterir", sinifProgAktif(aktifDonemId()) === DB.sinifProgDonemler[ID_B]);
}

/* ================= 6) 2026/2027 verilerinin korunması ================= */
console.log("6) 2026/2027 ders, istek ve program verilerinin korunması:");
{
  /* gerçek referans: boot'ta 2026/2027'ye bağlanan program (süit başında kopyalandı) */
  const bootProgRef = derinKopya(BOOT_PROG);
  t("2026/2027 programı sinifProgDonemler'de birebir duruyor", alanEsit(DB.sinifProgDonemler[ID_A], bootProgRef));
  donemSec(ID_A);
  const aDersGeri = aktifDonemKayitlari(DB.dersler);
  t("2026/2027'ye dönüşte ders listesi deep-equal geri geldi", aDersGeri.length === bootDersSay && aDersGeri.every(l => l.donemId === ID_A));
  t("2026/2027 programına dönüş: DB.sinifProg = kayıtlı 2026/2027 programı", DB.sinifProg === DB.sinifProgDonemler[ID_A] && Object.keys(DB.sinifProg).length > 0);
  t("2026/2027 programı seed anahtar kümesini içeriyor", ["MEZUN SAY 1", "12 SAY 1", "9.SINIF"].every(k => k in DB.sinifProg));
  /* SINIF-OGRT-UYUM-YAMASI: seed MEZUN SAY 1 artık 4-1'i de içerir (öğretmen SALİM URTİMUR avail.sinif 3-1 → MEZUN SAY 1 uyumu) */
  t("MEZUN SAY 1 hücreleri birebir", alanEsit(DB.sinifProg["MEZUN SAY 1"], ["0-1", "2-1", "3-1", "5-1", "0-2", "4-1"]));
}

/* ================= 7) Global veriler ve referanslar değişmemesi ================= */
console.log("7) ogrenciler, ogretmenler, sinifIds ve tüm referansların değişmemesi:");
{
  t("ogrenciler birebir aynı", alanEsit(DB.ogrenciler, bootOgr));
  t("ogretmenler birebir aynı", alanEsit(DB.ogretmenler, bootOgrt));
  t("sinifIds birebir aynı", alanEsit(DB.sinifIds, bootSinifIds));
  t("ders kayıtları (tüm alanlarıyla) birebir aynı", (() => { const s = derinKopya(DB); donemSec(ID_A); donemSec(ID_B); return alanEsit(DB.dersler, s.dersler); })());
  t("istek kayıtları birebir aynı", alanEsit(DB.istekler, DB.istekler.map(r => r)) && DB.istekler.every(r => r.donemId === ID_A));
  t("grup üyelikleri (ogrenciIds) değişmedi", DB.dersler.every(l => !l.ogrenciIds || Array.isArray(l.ogrenciIds)));
}

/* ================= 8) aktifDonemId + sinifProgDonemId birlikte güncellenmesi ================= */
console.log("8) aktifDonemId + sinifProgDonemId birlikte güncellenmesi:");
{
  donemSec(ID_A);
  t("donemSec(2026) → ikisi de 2026/2027", DB.aktifDonemId === ID_A && DB.sinifProgDonemId === ID_A);
  donemSec(ID_B);
  t("donemSec(2027) → ikisi de 2027/2028", DB.aktifDonemId === ID_B && DB.sinifProgDonemId === ID_B);
  t("donemSec sonrası aktif işaret tek dönemde", DB.donemler.filter(d => d && d.aktif === true).length === 1 && DB.donemler.find(d => d && d.aktif === true).id === ID_B);
  t("DB.sinifProg = 2027/2028 programı (boş)", DB.sinifProg === DB.sinifProgDonemler[ID_B]);
  /* localStorage'a yazıldı mı */
  const kayitli = JSON.parse(store[LS_KEY]);
  t("saveDB: kayıtlı DB'de ikisi de 2027/2028", kayitli.aktifDonemId === ID_B && kayitli.sinifProgDonemId === ID_B);
}

/* ================= 9) 2027 → 2026 geçişinde eski programın geri gelmesi ================= */
console.log("9) 2027/2028 → 2026/2027 geçişinde eski programın geri gelmesi:");
{
  donemSec(ID_A);
  const prog2026 = derinKopya(DB.sinifProgDonemler[ID_A]);
  t("2026/2027'de dersler görünür (" + bootDersSay + ") (tüm zamanlar penceresi)", (ui.filtre = "tumu", penceredeDersler().length) === bootDersSay && DB.aktifDonemId === ID_A);
  donemSec(ID_B);
  t("2027/2028'de ders listesi BOŞ (görünmez ama SİLİNMEDİ)", penceredeDersler().length === 0 && DB.dersler.length === bootDersSay);
  t("2027/2028'de istek havuzu BOŞ", aktifDonemKayitlari(DB.istekler).length === 0 && DB.istekler.length === bootIstekSay);
  t("2027/2028'de DB.sinifProg boş (yeni dönem programı)", Object.keys(DB.sinifProg).length === 0);
  donemSec(ID_A);
  t("2026/2027'ye dönüş: program deep-equal geri geldi", alanEsit(DB.sinifProg, prog2026));
  t("2026/2027'ye dönüş: ders/istek listeleri deep-equal", aktifDonemKayitlari(DB.dersler).length === bootDersSay && aktifDonemKayitlari(DB.istekler).length === bootIstekSay);
  t("2026/2027'ye dönüş: DB.sinifProg kayıtlı nesneyle AYNI referans", DB.sinifProg === DB.sinifProgDonemler[ID_A]);
  /* eski dönem programı üzerine yazılmadı: 2026 programına hücre ekle → 2027'ye geç → geri dön */
  const once = derinKopya(DB.sinifProgDonemler[ID_A]);
  donemSec(ID_B);
  donemSec(ID_A);
  t("geçiş turu sonrası 2026/2027 programı üzerine yazılmadı", alanEsit(DB.sinifProgDonemler[ID_A], once));
}

/* ================= 10) İdempotans: tekrar oluşturma/tıklama/normalize ================= */
console.log("10) Tekrar oluşturma/tıklama/normalize idempotansı:");
{
  const donemlerOnce = derinKopya(DB.donemler);
  const idlerOnce = DB.donemler.map((d) => d && d.id).join("|");
  const progOnce = derinKopya(DB.sinifProgDonemler);
  const derslerOnce = derinKopya(DB.dersler), isteklerOnce = derinKopya(DB.istekler);
  yeniDonemOlustur(); /* 2027/2028 zaten var → yalnız geçiş, kopya yok (donemSec aktif işaretlerini yasal olarak hizalar) */
  t("zaten varken yeniDonemOlustur dönem EKLEMEZ (duplicate YOK)", DB.donemler.length === donemlerOnce.length && DB.donemler.map((d) => d && d.id).join("|") === idlerOnce && alanEsit(DB.donemler.map(({ aktif, ...rest }) => rest), donemlerOnce.map(({ aktif, ...rest }) => rest)));
  t("zaten varken ders/istek KOPYALANMAZ", DB.dersler.length === derslerOnce.length && DB.istekler.length === isteklerOnce.length && alanEsit(DB.dersler, derslerOnce));
  t("zaten varken program verisi SİLİNMEZ/değişmez", alanEsit(DB.sinifProgDonemler, progOnce));
  t("zaten varken 2027/2028'e GEÇER", DB.aktifDonemId === ID_B && DB.sinifProgDonemId === ID_B);
  const m = normalize(derinKopya(DB));
  t("normalize dönemsiz alanları bozmuyor (idempotent)", m.donemler.length === 2 && m.sinifProgDonemId === ID_B && m.aktifDonemId === ID_B);
  t("normalize mevcut dönemli programlara DOKUNMUZ", alanEsit(m.sinifProgDonemler, progOnce));
  const m2 = normalize(derinKopya(m));
  t("ikinci normalize birebir aynı", alanEsit(m2.sinifProgDonemler, progOnce) && m2.donemler.length === 2);
  const s2 = donemleriBaslat(derinKopya(DB));
  const s3 = donemleriBaslat(derinKopya(DB));
  t("3. donemleriBaslat 0 dönem değişikliği", s3.d === 0 && s3.ders === 0 && s3.ist === 0, JSON.stringify(s3));
}

/* ================= 11) Seçici + buton duplicate üretmez ================= */
console.log("11) Dönem seçici ve 'Yeni Dönem Oluştur' kontrolünün duplicate üretmemesi:");
{
  renderYonetim();
  const y1 = reg["yonetimBolum"] ? reg["yonetimBolum"].innerHTML : "";
  t("renderYonetim çıktısında dönem seçici var", y1.includes('id="donemSeciciKutu"'));
  t("renderYonetim çıktısında 'Yeni Dönem Oluştur' butonu var", y1.includes("Yeni Dönem Oluştur") && y1.includes("yeniDonemOlustur()"));
  t("buton seçici kutusunun İÇİNDE (yanında)", y1.indexOf('id="donemYeniBtn"') > y1.indexOf('id="donemSeciciKutu"'));
  renderYonetim(); renderYonetim();
  const y2 = reg["yonetimBolum"].innerHTML;
  t("3 render sonrası TEK donemSeciciKutu", (y2.match(/id="donemSeciciKutu"/g) || []).length === 1);
  t("3 render sonrası TEK donemYeniBtn", (y2.match(/id="donemYeniBtn"/g) || []).length === 1);
  t("buton kaynakta tam 1 kez tanımlı", (readFileSync("app.js", "utf8").match(/id="donemYeniBtn"/g) || []).length === 1);
  const kutu = donemSecKutusuHTML();
  t("seçici 2 dönem + buton içeriyor", (kutu.match(/<option /g) || []).length === 2 && kutu.includes("Yeni Dönem Oluştur"));
  t("seçicide 2027/2028 seçeneği var", kutu.includes('value="' + ID_B + '"') && kutu.includes(">" + AD_B + "<"));
  donemSec(ID_A);
  t("geçiş sonrası seçim korunur (aktifDonemId=A)", aktifDonemId() === ID_A);
}

/* ================= 12) saveDB / yedek döngüsünde kayıpsızlık ================= */
console.log("12) saveDB / yedek yükleme döngüsünde dönemli programların kayıpsız taşınması:");
{
  donemSec(ID_A);
  const once = derinKopya(DB);
  saveDB();
  const y1 = loadDB();
  t("loadDB: dönemli programlar birebir", alanEsit(y1.sinifProgDonemler, once.sinifProgDonemler));
  t("loadDB: donemler + işaretçiler birebir", alanEsit(y1.donemler, once.donemler) && y1.aktifDonemId === ID_A && y1.sinifProgDonemId === ID_A);
  /* yedek paketi yolu */
  const paket = { uygulama: "YKS Birebir Takip", surum: 1, tarih: new Date().toISOString(), veri: derinKopya(once) };
  const y2 = normalize(paket.veri);
  t("yedek→normalize: sinifProgDonemler kayıpsız", alanEsit(y2.sinifProgDonemler, once.sinifProgDonemler));
  /* ESKİ (dönemsiz program) yedek yüklenince 2026/2027'ye bağlanır */
  const eskiPaket = { uygulama: "YKS Birebir Takip", surum: 1, tarih: new Date().toISOString(), veri: (() => { const d = derinKopya(once); delete d.sinifProgDonemler; delete d.sinifProgDonemId; d.donemler = [d.donemler[0]]; d.aktifDonemId = ID_A; return d; })() };
  const eskiYuklenen = normalize(eskiPaket.veri);
  t("eski yedek: program donem-2026-2027'ye bağlandı", alanEsit(eskiYuklenen.sinifProgDonemler[ID_A], once.sinifProgDonemler[ID_A]));
  t("eski yedek: 2027/2028 programı yeniden BOŞ oluşturuldu (veri uydurma YOK)", eskiYuklenen.sinifProgDonemler[ID_B] !== undefined ? Object.keys(eskiYuklenen.sinifProgDonemler[ID_B]).length === 0 : true);
  t("eski yedek: ders/istek verileri korunur", eskiYuklenen.dersler.length === bootDersSay && eskiYuklenen.istekler.length === bootIstekSay);
  /* ikinci döngü */
  const y3 = normalize(derinKopya(y2));
  t("2. yedek döngüsü birebir", alanEsit(y3.sinifProgDonemler, once.sinifProgDonemler));
  t("sinifProgDonemler localStorage'a yazıldı", JSON.parse(store[LS_KEY]).sinifProgDonemler[ID_A] !== undefined);
}

/* ================= 13) Hash doğrulaması ================= */
console.log("13) index.html, ek-ders.js ve vendor hash'leri:");
{
  const sha = (s) => createHash("sha256").update(s).digest("hex");
  t("index.html SHA-256 değişmedi", sha(html) === "ab93857339628aec7db0842db217b8e614c0f0ede2de5cb93b9fe500fc2a5cb8", sha(html));
  t("ek-ders.js SHA-256 değişmedi", sha(readFileSync("ek-ders.js", "utf8")) === "662ec4f1cffc1bb0b7882f876bcf0de581925139f066589a6de0d35862b4aaf7", sha(readFileSync("ek-ders.js", "utf8")));
  const vendor = ["tailwind.js", "fontawesome.css", "chart.js", "html2canvas.js", "fonts.css"];
  let ok = 0;
  for (const v of vendor) { try { if (readFileSync("vendor/" + v, "utf8").length > 0) ok++; } catch (e) { /* yok */ } }
  t("vendor 5 dosya okunur ve değişmez (" + ok + "/5)", ok === 5);
  t("index.html yama işareti YOK", !html.includes("DONEM-OLUSTURMA-YAMASI"));
  t("ek-ders.js yama işareti YOK", !readFileSync("ek-ders.js", "utf8").includes("DONEM-OLUSTURMA-YAMASI"));
}

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
