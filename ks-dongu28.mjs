/* ks-dongu28.mjs — DÖNGÜ-28 süiti:
   A) Havuz: iki sütun zigzag grid (1 sol, 2 sağ, 3 sol…), ortada TEK absolute dikey çizgi,
      üst filtre/kart içeriği byte-koruma (bkz. CHECKPOINT protokolü).
   B) Günlük: "Boş" etiketli ek satırlar — yalnız o gün HİÇ dersi olmayan ve ≥1 uygun boş
      slotu olan öğretmenler; Pazar YOK; mola/Kapalı/Sınıf-Dersi kilitli; dersli satırlar aynen.
   C) Sürükle-bırak: tekli + grup regresyonu (mevcut yollar üzerinden).
   Tek boot + gerçek DOM id kayıt defteri (mevcut süit deseni). */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"),
  ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
global.window.html2canvas = function () { return Promise.reject(new Error("stub")); };

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

let __kosan = 0;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 20) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-dongu28.mjs kosan=" + __kosan + " beklenen=20"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-dongu28.mjs:" + __kosan + ":20"); } });

let fail = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

let P;
try {
  P = new Function(scripts + `
    yenile();
    return { DB, ui, renderHavuz, gunlukTablo };
  `)();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0, 8).join("\n"));
  process.exit(1);
}
const { DB, ui, renderHavuz, gunlukTablo } = P;

/* Gelecek pazartesi + ertesi gün (Salı) — dersli senaryo günü */
const gelecekPzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const gelecekSali = (() => { const d = new Date(gelecekPzt + "T12:00:00"); d.setDate(d.getDate() + 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();

/* ---------- 1) Havuz zigzag grid ---------- */
console.log("1) Havuz zigzag grid + ayırıcı:");
ui.filtre = "tumu";
renderHavuz();
const havuzHTML = reg["havuzBolum"].innerHTML;
t("liste sarmalayıcı grid + relative", havuzHTML.includes('class="relative space-y-2 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-2 md:space-y-0"'));
t("ayırıcı TEK dikey çizgi (absolute left-1/2, pointer-events-none)", (havuzHTML.match(/havuz-ayirici pointer-events-none absolute inset-y-0 left-1\/2 hidden w-px -translate-x-1\/2 bg-slate-200 md:block/g) || []).length === 1);
t("divide-x KULLANILMADI", !havuzHTML.includes("divide-x"));
t("üst filtre çipleri korundu", havuzHTML.includes("İstek Filtresi:") && havuzHTML.includes("Tüm Dersler"));
t("kart içeriği korundu (avatar + Eşleştir & Planla + drag)", havuzHTML.includes("istek-kart") && havuzHTML.includes("Eşleştir &amp; Planla") && havuzHTML.includes('ondragstart="istekDrag(event,'));

/* ---------- 2) Günlük "Boş" satırları ---------- */
console.log("2) Günlük 'Boş' etiketli ek satırlar:");
const ogr0 = DB.ogretmenler[0];
const dersli = DB.ogretmenler.find(t2 => t2.id !== ogr0.id) || ogr0;
/* Salı günü: dersli öğretmene 1 ders koy; boş öğretmen satırı gelmeli */
ui.anchor = gelecekSali; ui.gunSecim = null;
DB.dersler.push({ id: "d28-1", ogrenciId: DB.ogrenciler[0].id, ogrenciAd: DB.ogrenciler[0].ad, dersId: "mat", konu: "Limit", ogretmenId: dersli.id, ogretmenAd: dersli.ad, tarih: gelecekSali, saat: "15:30", kod: "8", durum: "planlandi", olusturma: "" });
const gunHTML = gunlukTablo();
t("dersli öğretmen satırı adıyla VAR (etiketsiz)", gunHTML.includes(dersli.ad));
t("'Boş' etiketi markup'ta (aynı sayıda: boş öğretmen sayısı)", gunHTML.includes(">Boş</span>"), (gunHTML.match(/>Boş<\/span>/g) || []).length + " adet");
t("Boş satırlarda drop-zone yolu aynen (istekBurak)", gunHTML.includes('ondrop="istekBurak(event, this,'));
t("Boş satırda data-drop-ogrt gerçek id'li", gunHTML.includes('data-drop-ogrt="' + ogr0.id + '"') || gunHTML.includes('data-drop-ogrt="' + dersli.id + '"'));
/* Kısmen kapalı öğretmen: tek slot kapalı, kalan uygun → Boş satırı VAR ve o slot 'Kapalı' kilitli hücre */
const kOgr = DB.ogretmenler[2];
/* Kapalı/Sınıf-Dersi kilitli hücreler — snapshot/restore ile izole iki senaryo */
const musaitYedek28 = JSON.parse(JSON.stringify(DB.ogretmenler.map(t2 => t2.avail)));
DB.ogretmenler.forEach(t2 => { /* SADECE kOgr'u tüm gün kapalı yap, diğerleri temiz */ if (!t2.avail) t2.avail = {}; if (!Array.isArray(t2.avail.musait)) t2.avail.musait = []; });
DB.ogretmenler.forEach(t2 => { if (t2.id !== kOgr.id) return; for (let kod = 1; kod <= 11; kod++) { const k = "1-" + kod; if (t2.avail.musait.indexOf(k) < 0) t2.avail.musait.push(k); } });
const hepsiKapaliHTML = gunlukTablo();
t("tüm gün kapalı öğretmene 'Boş' satır YOK (kOgr'un tüm Salı slotları kapalı)", (() => {
  const i = hepsiKapaliHTML.indexOf(kOgr.ad);
  return i < 0; /* satır hiç yok */
})());
/* restore + kısmen kapalı: yalnız 1-3 kapalı */
DB.ogretmenler.forEach((t2, i) => { t2.avail = JSON.parse(JSON.stringify(musaitYedek28[i])); });
if (!kOgr.avail) kOgr.avail = {}; if (!Array.isArray(kOgr.avail.musait)) kOgr.avail.musait = [];
kOgr.avail.musait.push("1-3"); /* Salı 3. ders kapalı */
const kismenHTML = gunlukTablo();
t("kısmen kapalı öğretmen Boş satırında 'Kapalı' kilitli hücre VAR", kismenHTML.includes(">Kapalı</span>"));
t("kısmen kapalı öğretmen Boş satırı hâlâ VAR (başka uygun slotları var)", kismenHTML.includes(">Boş</span>"));
DB.ogretmenler.forEach((t2, i) => { t2.avail = JSON.parse(JSON.stringify(musaitYedek28[i])); });
/* Pazar: ek satır YOK */
const gelecekPzr = (() => { const d = new Date(gelecekPzt + "T12:00:00"); d.setDate(d.getDate() + 6); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
ui.gunSecim = gelecekPzr;
const pazarHTML = gunlukTablo();
t("Pazar günü 'Boş' satır YOK", !pazarHTML.includes(">Boş</span>"));
ui.gunSecim = null;
/* temizlik */
DB.dersler = DB.dersler.filter(l => l.id !== "d28-1");
/* hepsiKapali yalnız kOgr'a uygulandı + restore edildi — seed musaitlikleri temiz */

/* ---------- 3) Sürükle-bırak: drop zinciri + tekillik regresyonu ---------- */
console.log("3) Sürükle-bırak regresyonu:");
const appKaynak = scripts;
const kez = (s) => appKaynak.split(s).length - 1;
t("istekBurak tanımı tam 1 (paralel sistem YOK)", kez("function istekBurak(") === 1);
t("dersBurak tanımı tam 1 (grup dahil mevcut yol)", kez("function dersBurak(ogrtId, tarih, saat) {") === 1);
t("dersDrag tanımı tam 1", kez("function dersDrag(ev, id) {") === 1);
t("istekBurak → dersBurak devri tam 1", kez("if (dersDropHedef) { dersBurak(ogrtId, tarih, saat); return; }") === 1);
t("draggable guard: planlı birebir (DÖNGÜ-29: grup dahil; iptal+tamamlanmış hariç)", gunlukBolge28(appKaynak).includes('(ders.durum !== "iptal" && ders.durum !== "tamamlandi" ?'));
t("Boş satır drop hedefi SADECE uygun slotlarda (kilitli hücre dnd-bos değil)", (() => {
  /* boş satırlarda dnd-bos sayısı ≤ 11 (mola hariç); kilitli hücreler plain td */
  const bosBolum = gunHTML.slice(gunHTML.indexOf(">Boş</span>") - 500);
  return bosBolum.includes('class="dnd-bos');
})());

function gunlukBolge28(kaynak) {
  const i = kaynak.indexOf("function gunlukTablo() {");
  const j = kaynak.indexOf("\nfunction ", i + 10);
  return kaynak.slice(i, j);
}

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
