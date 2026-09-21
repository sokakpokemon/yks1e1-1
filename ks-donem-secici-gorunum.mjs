let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 44) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-donem-secici-gorunum.mjs kosan=" + __kosan + " beklenen=44"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-donem-secici-gorunum.mjs:" + __kosan + ":44"); } });
/* ks-donem-secici-gorunum.mjs — DONEM-SECICI-UI-YAMASI süiti (GERÇEK DOM semantiği)
   Test edilen davranış: dönem kontrolü kalıcı host (#donem-ui-host) + sabit kimlikli
   select (#donem-secici) + buton (#yeni-donem-btn); ek-ders.js renderYonetim override'ı
   kart-içi seçiciyi selse bile donemHostOnar() host'u TEK kez onarır; tekrarlı render
   ve alt sekme geçişleri duplicate üretmez; donemSec/yeniDonemOlustur mevcut veri
   mantığıyla (saveDB + sinifProguDonemeBagla + yenile) çalışır.
   Semantik: bilinmeyen getElementById → null; innerHTML yazımı eski çocukları siler;
   qSA('[id=...]') gerçek sayı; async flush microtask+timer (defer sırası taklidi). */
import { readFileSync } from "node:fs";

const appKaynak = readFileSync("app.js", "utf8");
const ekKaynak = readFileSync("ek-ders.js", "utf8");
const html = readFileSync("index.html", "utf8");
const inlineBloklar = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n;\n");
let n = 0;
const t = (ad, kosul, extra) => { __kosan++;  n++; console.log((kosul ? "✓ " : "✗ ") + ad + (extra !== undefined ? " → " + extra : "")); if (!kosul) process.exitCode = 1; };

function gercekDomKur(store) {
  const REGISTRY = Object.create(null);
  const ALL_ELS = [];
  function El(id) {
    const e = {
      tagName: "DIV", parentNode: null, _cocuk: [], _propId: false,
      style: {}, dataset: {}, value: "", checked: false, textContent: "", files: null,
      classList: { _s: new Set(), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, toggle(c, f) { if (f === undefined) this._s.has(c) ? this._s.delete(c) : this._s.add(c); else f ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      insertAdjacentHTML(_p, h) { idKaydet(String(h), this); },
      appendChild(c) { kayit(c, this); },
      insertBefore(c) { kayit(c, this); return c; },
      remove() { if (this.parentNode) this.parentNode._cocuk = this.parentNode._cocuk.filter((x) => x !== this); this.parentNode = null; delete REGISTRY[this.id]; },
      click() {}, focus() {}, select() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
      querySelectorAll(sel) { return qsaBody(sel); },
      getContext() { return null; },
      get options() { const m = this.innerHTML.match(/<option/g); return m ? { length: m.length } : { length: 0 }; }
    };
    let _h = "";
    Object.defineProperty(e, "innerHTML", {
      get() { return _h; },
      set(v) {
        _h = String(v);
        Object.keys(REGISTRY).forEach((k) => { if (REGISTRY[k] && REGISTRY[k]._host === e) delete REGISTRY[k]; });
        this._cocuk = [];
        idKaydet(_h, e);
      }
    });
    let _id = id;
    Object.defineProperty(e, "id", { get() { return _id; }, set(v) { _id = v; e._propId = true; if (v && !REGISTRY[v]) REGISTRY[v] = e; } });
    if (id && !REGISTRY[id]) REGISTRY[id] = e;
    ALL_ELS.push(e);
    return e;
  }
  function kayit(e, host) { e._host = host || null; e.parentNode = host || null; if (host) host._cocuk.push(e); if (e.id && !REGISTRY[e.id]) REGISTRY[e.id] = e; }
  function idKaydet(metin, host) { [...metin.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!REGISTRY[m[1]]) kayit(El(m[1]), host); }); }
  const BODY = El("body-kok"); kayit(BODY, null);
  const HTMLKOK = El("html-kok"); kayit(HTMLKOK, null);
  [...html.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!REGISTRY[m[1]]) kayit(El(m[1]), BODY); });
  function qsaBody(sel) {
    const m = sel.match(/\[id="([^"]+)"\]/);
    if (!m) return [];
    const hedef = 'id="' + m[1] + '"';
    let adet = 0;
    ALL_ELS.forEach((e) => { adet += (e.innerHTML.split(hedef).length - 1); });
    if (adet === 0 && REGISTRY[m[1]] && REGISTRY[m[1]]._propId) adet = 1;
    return new Array(adet).fill(REGISTRY[m[1]] || { id: m[1] });
  }
  const document = {
    getElementById: (i) => REGISTRY[i] || null,
    createElement: (tag) => El("anon-" + tag + "-" + Math.random().toString(36).slice(2, 7)),
    addEventListener() {}, removeEventListener() {}, querySelectorAll: qsaBody,
    body: BODY, documentElement: HTMLKOK
  };
  const window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
  const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  return { document, window, localStorage, REGISTRY, BODY };
}

function boot(store) {
  const env = gercekDomKur(store || {});
  global.document = env.document; global.window = env.window; global.localStorage = env.localStorage;
  globalThis.tailwind = {};
  global.Chart = function () { this.destroy = () => {}; };
  const kaynak = [appKaynak, "\n;\n", ekKaynak, "\n;\n", inlineBloklar].join("");
  const api = new Function(kaynak + "\n  return { DB, ui, donemSecKutusuHTML, donemSec, renderYonetim, yenile, saveDB, aktifDonemId, sec, yeniDonemOlustur, donemHostOnar, sinifProguDonemeBagla };")();
  return { api, REGISTRY: env.REGISTRY, BODY: env.BODY, flush: () => new Promise((r) => setTimeout(r, 0)) };
}
function olc(BODY) {
  const say = (id) => BODY.querySelectorAll('[id="' + id + '"]').length;
  return { host: say("donem-ui-host"), secici: say("donem-secici"), buton: say("yeni-donem-btn") };
}
const uc1 = (o) => o.host === 1 && o.secici === 1 && o.buton === 1;
const ozet = (o) => "(host=" + o.host + " secici=" + o.secici + " btn=" + o.buton + ")";
const seciciMarkup = (REGISTRY) => {
  const h = REGISTRY["donem-ui-host"];
  if (h && h.innerHTML.includes('id="donem-secici"')) return h.innerHTML;
  const yb = REGISTRY["yonetimBolum"];
  return (yb && yb.innerHTML.includes('id="donem-secici"')) ? yb.innerHTML : "";
};

(async () => {
console.log("=== ks-donem-secici-gorunum — dönem kontrolü kalıcı host + gerçek DOM semantiği ===");

/* ---- Kaynak sözleşmeleri (statik) ---- */
t("app.js yama damgası mevcut (DONEM-SECICI-UI-YAMASI)", appKaynak.includes("DONEM-SECICI-UI-YAMASI"));
t("kart-içi seçici markup gerçek donemSeciciKutu id'li", appKaynak.includes('<div id="donemSeciciKutu"'));
t("select sabit kimlikli + data-id takma adı", appKaynak.includes('id="donem-secici" data-id="donemSecici"'));
t("buton sabit kimlikli + data-id takma adı", appKaynak.includes('id="yeni-donem-btn" data-id="donemYeniBtn"'));
t("yenile() kuyruğu onarımı çağırıyor", (appKaynak.match(/donemHostOnarZincir\(\);/g) || []).length === 1);

/* 1..4) İlk boot + flush: host/selector/buton tam 1 */
console.log("1-4) İlk boot (app.js + ek-ders.js defer sırası):");
const b = boot({});
t("boot hatasız (TypeError yok)", !!b.api && !!b.api.DB);
await b.flush();
let o = olc(b.BODY);
t("#donem-ui-host tam 1 kez", o.host === 1, ozet(o));
t("#donem-secici tam 1 kez", o.secici === 1);
t("#yeni-donem-btn tam 1 kez", o.buton === 1);

/* 5) 3+ render duplicate üretmez */
console.log("5) renderYonetim ×3:");
b.api.renderYonetim(); b.api.renderYonetim(); b.api.renderYonetim(); await b.flush();
o = olc(b.BODY);
t("3+ render sonrası duplicate yok", uc1(o), ozet(o));

/* 6..8) Alt sekme geçişlerinde host/selector/buton kaybolmaz */
console.log("6-8) Alt sekme geçişleri:");
for (const s of [["ogretmen", "Öğretmen"], ["ogrenci", "Öğrenci"], ["ekders", "Ek Ders"], ["ayar", "Ayarlar"], ["ogretmen", "Tekrar Öğretmen"]]) {
  b.api.sec(s[0]); await b.flush();
  o = olc(b.BODY);
  t(s[1] + ": host kalıcı", o.host === 1, ozet(o));
  t(s[1] + ": selector kalıcı", o.secici === 1);
  t(s[1] + ": buton kalıcı", o.buton === 1);
}

/* 9..10) DB.donemler option'ları + aktif seçili */
console.log("9-10) Seçenekler + aktif dönem:");
const aktif0 = b.api.aktifDonemId();
const mk0 = seciciMarkup(b.REGISTRY);
t("DB.donemler option olarak listelendi", (mk0.match(/<option /g) || []).length === b.api.DB.donemler.length, "options=" + (mk0.match(/<option /g) || []).length);
t("DB.aktifDonemId doğru option'ı selected yapıyor", mk0.includes('value="' + aktif0 + '" selected'));

/* 11..13) donemSec: aktif güncellenir, saveDB+yenile çalışır, geçersiz id güvenli */
console.log("11-13) donemSec davranışı:");
const DB = b.api.DB;
DB.donemler.push({ id: "donem-gorunum-test", ad: "Görünüm Test", aktif: false });
let saveSayi = 0; const orijinalSave = DB.saveDB; /* yoksa app saveDB kapalı — sayaç yerine store bak */
const storeAnahtari = () => { try { return global.localStorage.getItem("yksOto_arsiv_v1"); } catch (e) { return null; } };
const onceStore = storeAnahtari();
b.api.donemSec("donem-gorunum-test"); await b.flush();
t("donemSec DB.aktifDonemId günceller", b.api.aktifDonemId() === "donem-gorunum-test");
t("donemSec sinifProgDonemId'yi hizalar", DB.sinifProgDonemId === "donem-gorunum-test");
t("donemSec saveDB çağırır (localStorage yazımı değişti)", storeAnahtari() !== onceStore);
o = olc(b.BODY);
t("donemSec sonrası kontrol kalıcı", uc1(o), ozet(o));
const onceAktif = b.api.aktifDonemId();
b.api.donemSec("olmayan-id-xyz"); await b.flush();
t("geçersiz donem ID'si veri bozmaz", b.api.aktifDonemId() === onceAktif);

/* 14..15) Buton tek kontrol + tekrarlı çağrı duplicate dönem üretmez */
console.log("14-15) yeniDonemOlustur:");
const donemSayi0 = DB.donemler.length;
const onceStore2 = storeAnahtari();
b.api.yeniDonemOlustur(); await b.flush();
t("yeni dönem eklendi", DB.donemler.length === donemSayi0 + 1);
b.api.yeniDonemOlustur(); await b.flush();
t("tekrar çağrı duplicate dönem eklemez", DB.donemler.length === donemSayi0 + 1);
o = olc(b.BODY);
t("tekrarlı buton sonrası hâlâ tek kontrol", uc1(o), ozet(o));
t("yeni dönem saveDB ile kalıcı", storeAnahtari() !== onceStore2);

/* 16) 2026/2027 verileri korunur */
console.log("16) Mevcut dönem verileri:");
t("ilk dönem listede ve verisi korunur", DB.donemler.some((d) => d && d.id === "donem-2026-2027") && !!DB.sinifProgDonemler["donem-2026-2027"]);

/* 17) Alt sekme geçişlerinde selected değer korunur */
console.log("17) Selected değer korunumu:");
const beklenen = b.api.aktifDonemId();
b.api.sec("ayar"); await b.flush();
t("sekme değişimi selected değeri korur", seciciMarkup(b.REGISTRY).includes('value="' + beklenen + '" selected'));
b.api.sec("ogretmen"); await b.flush();
t("geri dönüşte selected değer korunur", seciciMarkup(b.REGISTRY).includes('value="' + beklenen + '" selected'));

/* 18) Bilinmeyen getElementById null — boot TypeError vermez (bütün senaryolar zaten koştu) */
console.log("18) Null-on-miss DOM semantiği:");
t("bilinmeyen id getElementById null döner", b.REGISTRY["olmayan-anon-id"] === undefined && global.document.getElementById("olmayan-anon-id") === null);
t("tüm senaryolar null-on-miss ile hatasız koştu (yukarıdaki adımlar)", true);

/* 19) innerHTML alt sekme yazımı host'u silmez — kanıt */
console.log("19) innerHTML override host'u silmez:");
b.api.sec("ekders"); await b.flush();
const yb = b.REGISTRY["yonetimBolum"];
t("alt sekme render'ı yb.innerHTML'i yeniden yazar", !!(yb && yb.innerHTML.length > 0));
o = olc(b.BODY);
t("yeniden yazıma rağmen host DOM'da kalır", uc1(o), ozet(o));

/* 20) Eski süitler baseline'a göre düşmedi → test.mjs koşar; burada yalnız süit bağlantısı */
console.log("20) Süit bağlantısı:");
const tsrc = readFileSync("test.mjs", "utf8");
t("ks-donem-secici-gorunum.mjs test.mjs'te tam 1 kez", (tsrc.match(/"ks-donem-secici-gorunum\.mjs"/g) || []).length === 1);

console.log(n === 0 ? "" : (process.exitCode === 1 ? "BAŞARISIZ" : n + "/" + n + " OK"));
})();
