/* ks-dom-semantik-donem.mjs — GERÇEK DOM semantiğiyle dönem seçici görünürlük teşhisi (DONEM-SECICI-UI-YAMASI).
   Kurallar (gerçek tarayıcı davranışı):
   - document.getElementById("olmayan-id") → null döner (stub auto-create YOK).
   - el.innerHTML = "..." yazımı eski çocukları siler → onların id'leri DOM kayıt defterinden düşer.
   - Markup id'leri (innerHTML + insertAdjacentHTML + createElement.id) gerçekten kaydedilir.
   - document.querySelectorAll('[id="..."]') güncel markup üzerinden GERÇEK tekrar sayısını verir.
   - index.html'in STATİK id'leri boot öncesi DOM'dadır; async flush microtask+timer gerçekleştirir.
   Senaryolar: sanity → boot(app) → boot(app+ek-ders defer sırası) → renderYonetim×3 → 5 alt sekme →
   dönem değişimi → yeniDonemOlustur tazeliği → tekrar 3 render. Her adımda host/selector/buton sayılır.
   Karar kriteri: her adımda #donem-ui-host / #donem-secici / #yeni-donem-btn TAM 1.
   Not: ek-ders.js gerçek dosyada defer'dir; boot'ta kaynağı app.js'ten SONRA eval edilir ve
   ek-ders'in kendi boot renderYonetim() çağrısı zincir onarımı tetikler (microtask/timer flush). */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const appKaynak = readFileSync("app.js", "utf8");
const ekKaynak = readFileSync("ek-ders.js", "utf8");
const html = readFileSync("index.html", "utf8");
const inlineBloklar = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n;\n");
const sha = (s) => createHash("sha256").update(s).digest("hex");

/* ---- Gerçek DOM taklidi ---- */
function gercekDomKur(baslangicStore) {
  const store = baslangicStore || {};
  const REGISTRY = Object.create(null);   /* id → element (gerçek DOM kayıt defteri) */
  const ALL_ELS = [];                      /* qsaBody güncel markup taraması */

  function El(id) {
    const e = {
      tagName: "DIV", parentNode: null, _cocuk: [], _propId: false,
      style: {}, dataset: {}, value: "", checked: false, textContent: "",
      files: null,
      classList: { _s: new Set(), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, toggle(c, f) { if (f === undefined) this._s.has(c) ? this._s.delete(c) : this._s.add(c); else f ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      insertAdjacentHTML(_p, h) { idKaydet(String(h), this); },
      insertAdjacentElement(_p, n) { if (n && n.id && !REGISTRY[n.id]) kayit(n, this); },
      appendChild(c) { kayit(c, this); },
      remove() { if (this.parentNode) this.parentNode._cocuk = this.parentNode._cocuk.filter((x) => x !== this); this.parentNode = null; delete REGISTRY[this.id]; },
      click() {}, focus() {}, select() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
      querySelectorAll(sel) { return qsaBody(sel); },
      insertBefore(n, ref) { kayit(n, this); return n; },
      getContext() { return null; },
      get options() { const m = this.innerHTML.match(/<option/g); return m ? { length: m.length } : { length: 0 }; }
    };
    let _h = "";
    Object.defineProperty(e, "innerHTML", {
      get() { return _h; },
      set(v) {
        _h = String(v);
        /* GERÇEK DAVRANIŞ: innerHTML yazımı eski çocukları siler → id'ler kayıt defterinden düşer */
        Object.keys(REGISTRY).forEach((k) => { if (REGISTRY[k] && REGISTRY[k]._host === e) delete REGISTRY[k]; });
        this._cocuk = [];
        idKaydet(_h, e);
      }
    });
    ALL_ELS.push(e);
    /* GERÇEK DAVRANIŞ: id property ataması (el.id = "x") elementi kimliklendirir —
       property-form id, sonradan createElement ile oluşturulan elementler için de sayılır. */
    let _id = id;
    Object.defineProperty(e, "id", {
      get() { return _id; },
      set(v) { _id = v; e._propId = true; if (v && !REGISTRY[v]) REGISTRY[v] = e; }
    });
    if (id && !REGISTRY[id]) REGISTRY[id] = e;
    return e;
  }
  function kayit(e, host) { e._host = host || null; e.parentNode = host || null; if (host) host._cocuk.push(e); if (e.id && !REGISTRY[e.id]) REGISTRY[e.id] = e; }
  function idKaydet(metin, host) {
    [...metin.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!REGISTRY[m[1]]) kayit(El(m[1]), host); });
  }
  const BODY = El("body-kok"); kayit(BODY, null);
  const HTMLKOK = El("html-kok"); kayit(HTMLKOK, null);
  /* Gerçek sayfa: index.html'in STATİK id'leri boot'tan önce DOM'da */
  [...html.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!REGISTRY[m[1]]) kayit(El(m[1]), BODY); });

  /* querySelectorAll('[id="x"]') → güncel markup içinden gerçek tekrar sayısı */
  function qsaBody(sel) {
    const m = sel.match(/\[id="([^"]+)"\]/);
    if (!m) return [];
    const hedef = 'id="' + m[1] + '"';
    let adet = 0;
    ALL_ELS.forEach((e) => { adet += (e.innerHTML.split(hedef).length - 1); });
    /* property-form id: markup'ta yok ama createElement+id atamasıyla DOM'da → gerçek qSA bulur */
    if (adet === 0 && REGISTRY[m[1]] && REGISTRY[m[1]]._propId) adet = 1;
    return new Array(adet).fill(REGISTRY[m[1]] || { id: m[1] });
  }
  const document = {
    getElementById: (i) => REGISTRY[i] || null,   /* bilinmeyen id → NULL */
    createElement: (tag) => El("anon-" + tag + "-" + Math.random().toString(36).slice(2, 7)),
    addEventListener() {}, removeEventListener() {},
    querySelectorAll: qsaBody,
    body: BODY,
    documentElement: HTMLKOK
  };
  const window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
  const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  return { document, window, localStorage, REGISTRY, BODY, store };
}

/* app.js (+ opsiyonel ek-ders.js defer sırası) boot'u; dönen flush microtask+timer'ı boşaltır */
function boot(ekDahil, store) {
  const env = gercekDomKur(store);
  global.document = env.document;
  global.window = env.window;
  global.localStorage = env.localStorage;
  globalThis.tailwind = {};
  global.Chart = function () { this.destroy = () => {}; };
  const kaynaklar = [appKaynak, "\n;\n", ekDahil ? ekKaynak : "", "\n;\n", inlineBloklar].join("");
  const api = new Function(kaynaklar + "\n  return { DB, ui, donemSecKutusuHTML, donemSec, renderYonetim, yenile, saveDB, aktifDonemId, sec, yeniDonemOlustur, donemHostOnar };")();
  const flush = () => new Promise((r) => setTimeout(r, 0)); /* microtask kuyruğu + setTimeout(0) */
  return { api, REGISTRY: env.REGISTRY, BODY: env.BODY, flush };
}

/* ---- Ölçüm: gerçek querySelectorAll üzerinden ---- */
function olc(BODY) {
  const say = (id) => BODY.querySelectorAll('[id="' + id + '"]').length;
  return {
    host: say("donem-ui-host"), secici: say("donem-secici"), buton: say("yeni-donem-btn"),
    eskiKutu: say("donemSeciciKutu"), eskiSecici: say("donemSecici"), eskiBtn: say("donemYeniBtn")
  };
}
const ozet = (o) => "yeni(host=" + o.host + " secici=" + o.secici + " btn=" + o.buton + ") | eski(kutu=" + o.eskiKutu + " secici=" + o.eskiSecici + " btn=" + o.eskiBtn + ")";

let fail = 0;
let o;
const t = (ad, kosul, extra) => { console.log((kosul ? "  ✓ " : "  ✗ ") + ad + (extra !== undefined ? " → " + extra : "")); if (!kosul) fail = 1; };
const bilgi = (ad, ek) => { console.log("  · " + ad + (ek !== undefined ? " → " + ek : "")); };
const uc1 = (o) => o.host === 1 && o.secici === 1 && o.buton === 1;

(async () => {
console.log("=== ks-dom-semantik-donem — GERÇEK DOM semantiği (bilinmeyen id → null, innerHTML çocukları siler, microtask flush) ===");
t("sanity: getElementById('olmayan-id') null döner", (() => { const env = gercekDomKur(); global.document = env.document; return global.document.getElementById("olmayan-id") === null; })());
t("sanity: innerHTML yazımı eski id'yi kayıt defterinden siler", (() => {
  const env = gercekDomKur(); global.document = env.document;
  const k = env.document.createElement("div"); env.document.body.appendChild(k);
  k.innerHTML = '<i id="gecici-x"></i>';
  const once = env.document.getElementById("gecici-x") !== null;
  k.innerHTML = "<b>başka</b>";
  return once && env.document.getElementById("gecici-x") === null;
})());
t("sanity: insertAdjacentHTML markup id'lerini DOM'a kaydeder", (() => {
  const env = gercekDomKur(); global.document = env.document;
  const k = env.document.createElement("div"); env.document.body.appendChild(k);
  k.insertAdjacentHTML("afterbegin", '<i id="eklenen-y"></i>');
  return env.document.getElementById("eklenen-y") !== null;
})());

/* ---- 0) İlk boot: SADECE app.js (defer'den ÖNCE dünya) ---- */
console.log("0) İlk boot (yalnız app.js):");
const b0 = boot(false, {});
t("boot hatasız", !!b0.api && !!b0.api.DB);
await b0.flush();
o = olc(b0.BODY);
bilgi("sayılar", ozet(o));
t("app-only boot: seçici kart-içinde, host DUPLİKESİ YOK (host=0)", o.eskiKutu === 1 && o.eskiSecici === 1 && o.eskiBtn === 1 && o.host === 0);
t("app-only boot: kart-içi seçici YENİ kimlikli (#donem-secici + #yeni-donem-btn)", (() => { const yb0 = b0.REGISTRY["yonetimBolum"]; return !!(yb0 && yb0.innerHTML.includes('id="donem-secici"') && yb0.innerHTML.includes('id="yeni-donem-btn"')); })());
t("app-only boot: yonetimBolum.innerHTML'de seçici VAR (app.js kendi render'ı)", (() => { const yb = b0.REGISTRY["yonetimBolum"]; return !!(yb && yb.innerHTML.includes('id="donemSeciciKutu"')); })());

/* ---- 1) Gerçek sayfa yüklemesi: app.js + ek-ders.js (defer override sırası) + flush ---- */
console.log("1) Gerçek sayfa yüklemesi (app.js + ek-ders.js defer) + microtask flush:");
const b1 = boot(true, {});
t("boot hatasız (TypeError yok)", !!b1.api && !!b1.api.DB);
await b1.flush();
o = olc(b1.BODY);
bilgi("sayılar", ozet(o));
t("KÖK NEDEN: ek-ders override'ı kart-içi seçiciyi SİLDİ (yb.innerHTML'de kutu yok)", (() => { const yb = b1.REGISTRY["yonetimBolum"]; return !!(yb && yb.innerHTML.indexOf('id="donemSeciciKutu"') === -1); })());
t("ONARIM: flush sonrası kalıcı host TEK kez kuruldu (host=1 secici=1 btn=1)", uc1(o));
const yb1 = b1.REGISTRY["yonetimBolum"];
const hostEl1 = b1.REGISTRY["donem-ui-host"];
t("host #yonetimBolum'un HEMEN ÜSTÜNDE (komşu kardeş)", !!(hostEl1 && hostEl1.parentNode === yb1.parentNode));

const { api, REGISTRY, BODY, flush } = b1;
const renderYonetim = api.renderYonetim, sec = api.sec, donemSec = api.donemSec;

/* ---- 2..4) renderYonetim ×3 (flush'lu) ---- */
for (let i = 1; i <= 3; i++) {
  console.log((i + 1) + ") renderYonetim() " + i + ". çağrı + flush:");
  renderYonetim(); await flush();
  o = olc(BODY);
  t("host=1", o.host === 1, ozet(o));
  t("selector=1", o.secici === 1);
  t("button=1", o.buton === 1);
}

/* ---- 6..10) Alt sekme geçişleri (flush'lu) ---- */
const sekmeler = [["ogretmen", "Öğretmen Yönetimi"], ["ogrenci", "Öğrenci & Sınıf"], ["ekders", "Ek Ders"], ["ayar", "Ayarlar & Yedekleme"], ["ogretmen", "Tekrar Öğretmen"]];
for (let i = 0; i < sekmeler.length; i++) {
  const s = sekmeler[i];
  console.log((6 + i) + ") Alt sekme: " + s[1] + " + flush:");
  sec(s[0]); await flush();
  o = olc(BODY);
  t("host=1", o.host === 1, ozet(o));
  t("selector=1", o.secici === 1);
  t("button=1", o.buton === 1);
}

/* ---- 11) Dönem değişimi (2. dönem uygulama içinden eklenir) ---- */
console.log("11) Dönem değişimi + flush:");
if (!api.DB.donemler.some((d) => d && d.id === "donem-2025-2026")) api.DB.donemler.push({ id: "donem-2025-2026", ad: "2025/2026", aktif: false });
donemSec("donem-2025-2026"); await flush();
o = olc(BODY);
t("donemSec sonrası host=1", o.host === 1, ozet(o));
t("donemSec sonrası selector=1", o.secici === 1);
t("donemSec sonrası button=1", o.buton === 1);
t("DB.aktifDonemId güncellendi", api.aktifDonemId() === "donem-2025-2026", api.aktifDonemId());
/* Seçicinin yaşadığı kapsayıcı markup: kalıcı host (varsa), yoksa yonetimBolum kartı.
   (Sim'de markup'tan doğan çocukların kendi innerHTML'i boş kalır — gerçek DOM parser'ı
   option'ları çocuğa aktarır; kapsayıcı markup'ı okumak aynı kanıtı verir.) */
const seciciMarkup = () => {
  const h = REGISTRY["donem-ui-host"];
  if (h && h.innerHTML.includes('id="donem-secici"')) return h.innerHTML;
  const yb = REGISTRY["yonetimBolum"];
  return (yb && yb.innerHTML.includes('id="donem-secici"')) ? yb.innerHTML : "";
};
t("2 dönem option (tazelenen markup)", (seciciMarkup().match(/<option /g) || []).length === 2, "options=" + (seciciMarkup().match(/<option /g) || []).length);
t("selected option aktif dönem", seciciMarkup().includes('value="donem-2025-2026" selected'));
const onceAktif = api.aktifDonemId();
donemSec("olmayan-donem"); await flush();
t("geçersiz id → aktif dönem korunur", api.aktifDonemId() === onceAktif);

/* ---- 11b) yeniDonemOlustur: seçenek tazeliği + duplicate yok ---- */
console.log("11b) yeniDonemOlustur + flush:");
api.yeniDonemOlustur(); await flush();
o = olc(BODY);
t("yeni dönem sonrası host=1 (tek kontrol)", uc1(o), ozet(o));
t("2027/2028 seçenekleri tazelendi (3 option)", (seciciMarkup().match(/<option /g) || []).length === 3, "options=" + (seciciMarkup().match(/<option /g) || []).length);
const donemSayisi = api.DB.donemler.length;
api.yeniDonemOlustur(); await flush();
t("tekrar buton → duplicate dönem OLUŞTURULMAZ", api.DB.donemler.length === donemSayisi, "donemler=" + api.DB.donemler.length);
o = olc(BODY);
t("tekrar buton sonrası hâlâ host=1", uc1(o), ozet(o));

/* ---- 12..14) Tekrar 3 render (flush'lu) ---- */
for (let i = 1; i <= 3; i++) {
  console.log((11 + i) + ") renderYonetim() tekrar " + i + ". çağrı + flush:");
  renderYonetim(); await flush();
  o = olc(BODY);
  t("host=1", o.host === 1, ozet(o));
  t("selector=1", o.secici === 1);
  t("button=1", o.buton === 1);
}

/* ---- Özet ---- */
console.log("\napp.js SHA-256: " + sha(appKaynak));
console.log(fail === 0 ? "TÜM GERÇEK DOM KONTROLLERİ GEÇTİ" : "BAŞARISIZ — yukarıdaki ✗ satırları sorun bölgesini gösterir");
process.exit(fail);
})();
