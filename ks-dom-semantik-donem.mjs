/* ks-dom-semantik-donem.mjs — GERÇEK DOM semantiğiyle dönem seçici görünürlük teşhisi.
   Kurallar (gerçek tarayıcı davranışı):
   - document.getElementById("olmayan-id") → null döner (stub auto-create YOK).
   - el.innerHTML = "..." yazımı eski çocukları siler → onların id'leri DOM kayıt defterinden düşer.
   - Markup'taki id'ler (innerHTML + insertAdjacentHTML) gerçekten DOM'a kaydedilir.
   - document.querySelectorAll('[id="..."]') güncel markup üzerinden gerçeği sayar; aynı id 2 kez
     üretilirse sayı 2 olur (duplicate yakalanır).
   - index.html'in STATİK id'leri boot öncesi DOM'dadır (gerçek sayfa gibi seed edilir).
   Senaryolar: boot(app) → boot(app+ek-ders defer sırası) → renderYonetim ×3 → 5 alt sekme geçişi →
   dönem değişimi → tekrar 3 render. Her adımda host/selector/buton sayılır.
   - YENİ ID'LER (donem-ui-host / donem-secici / yeni-donem-btn): REGRESYON karar kriteri —
     her adımda tam 1 olmalı. Yama öncesi 0'dır (henüz üretilmiyor).
   - ESKİ ID'LER (donemSeciciKutu / donemSecici / donemYeniBtn): BİLGİ amaçlı — silme mekânizmasının
     (ek-ders.js renderYonetim override'ı) kanıtını verir. */
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
  const ALL_ELS = [];                      /* qsaBody güncel markup taraması için */

  function El(id) {
    const e = {
      id, tagName: "DIV", parentNode: null, _cocuk: [],
      style: {}, dataset: {}, value: "", checked: false, textContent: "",
      files: null,
      classList: { _s: new Set(), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, toggle(c, f) { if (f === undefined) this._s.has(c) ? this._s.delete(c) : this._s.add(c); else f ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      insertAdjacentHTML(_p, h) { idKaydet(String(h), this); },
      insertAdjacentElement(_p, n) { if (n && n.id && !REGISTRY[n.id]) kayit(n, this); },
      appendChild(c) { kayit(c, this); },
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
        /* GERÇEK DAVRANIŞ: innerHTML yazımı eski çocukları siler → id'leri kayıt defterinden düşer */
        Object.keys(REGISTRY).forEach((k) => { if (REGISTRY[k] && REGISTRY[k]._host === e) delete REGISTRY[k]; });
        this._cocuk = [];
        idKaydet(_h, e);
      }
    });
    ALL_ELS.push(e);
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

/* app.js (+ opsiyonel ek-ders.js defer sırası) boot'u */
function boot(ekDahil, store) {
  const env = gercekDomKur(store);
  global.document = env.document;
  global.window = env.window;
  global.localStorage = env.localStorage;
  globalThis.tailwind = {};
  global.Chart = function () { this.destroy = () => {}; };
  const kaynaklar = [appKaynak, "\n;\n", ekDahil ? ekKaynak : "", "\n;\n", inlineBloklar].join("");
  const api = new Function(kaynaklar + "\n  return { DB, ui, donemSecKutusuHTML, donemSec, renderYonetim, yenile, saveDB, aktifDonemId, sec };")();
  return { api, REGISTRY: env.REGISTRY, BODY: env.BODY };
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
const t = (ad, kosul, extra) => { console.log((kosul ? "  ✓ " : "  ✗ ") + ad + (extra !== undefined ? " → " + extra : "")); if (!kosul) fail = 1; };
const bilgi = (ad, ek) => { console.log("  · " + ad + (ek !== undefined ? " → " + ek : "")); };

console.log("=== ks-dom-semantik-donem — GERÇEK DOM semantiği (bilinmeyen id → null, innerHTML çocukları siler) ===");
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
console.log("0) İlk boot (yalnız app.js — ek-ders henüz yüklenmedi):");
const b0 = boot(false, {});
t("boot hatasız", !!b0.api && !!b0.api.DB);
let o = olc(b0.BODY);
bilgi("markup sayıları", ozet(o));
t("app-only boot: eski seçici markup'ta (donemSeciciKutu=1)", o.eskiKutu === 1 && o.eskiSecici === 1 && o.eskiBtn === 1);

/* ---- 1) Gerçek sayfa yüklemesi: app.js + ek-ders.js (defer override sırası) ---- */
console.log("1) Gerçek sayfa yüklemesi (app.js + ek-ders.js defer):");
const b1 = boot(true, {});
t("boot hatasız", !!b1.api && !!b1.api.DB);
o = olc(b1.BODY);
bilgi("markup sayıları", ozet(o));
/* KÖK NEDEN KANITI: ek-ders.js override'ı sonrası eski seçici markup'tan SİLİNİR (0) */
bilgi("MEKÂNİZMA: ek-ders.js renderYonetim override'ı seçiciyi siliyor mu?", (o.eskiKutu === 0 && o.eskiSecici === 0 && o.eskiBtn === 0) ? "EVET — innerHTML seçici olmadan yeniden yazıldı" : "HAYIR — seçici hâlâ markup'ta");

const { api, REGISTRY, BODY } = b1;
const renderYonetim = api.renderYonetim, sec = api.sec, donemSec = api.donemSec;

/* ---- 2..4) renderYonetim ×3 ---- */
for (let i = 1; i <= 3; i++) {
  console.log((i + 1) + ") renderYonetim() " + i + ". çağrı:");
  renderYonetim();
  o = olc(BODY);
  t("host=1", o.host === 1, ozet(o));
  t("selector=1", o.secici === 1);
  t("button=1", o.buton === 1);
}

/* ---- 6..10) Alt sekme geçişleri ---- */
const sekmeler = [["ogretmen", "Öğretmen Yönetimi"], ["ogrenci", "Öğrenci & Sınıf"], ["ekders", "Ek Ders"], ["ayar", "Ayarlar & Yedekleme"], ["ogretmen", "Tekrar Öğretmen"]];
sekmeler.forEach((s, i) => {
  console.log((6 + i) + ") Alt sekme: " + s[1]);
  sec(s[0]);
  o = olc(BODY);
  t("host=1", o.host === 1, ozet(o));
  t("selector=1", o.secici === 1);
  t("button=1", o.buton === 1);
});

/* ---- 11) Dönem değişimi (2. dönem uygulama içinden eklenir) ---- */
console.log("11) Dönem değişimi:");
if (!api.DB.donemler.some((d) => d && d.id === "donem-2025-2026")) api.DB.donemler.push({ id: "donem-2025-2026", ad: "2025/2026", aktif: false });
donemSec("donem-2025-2026");
o = olc(BODY);
t("donemSec sonrası host=1", o.host === 1, ozet(o));
t("donemSec sonrası selector=1", o.secici === 1);
t("donemSec sonrası button=1", o.buton === 1);
t("DB.aktifDonemId güncellendi", api.aktifDonemId() === "donem-2025-2026", api.aktifDonemId());
const secEl = REGISTRY["donem-secici"];
t("selector'da 2 dönem option", !!(secEl && secEl.options.length === 2), "options=" + (secEl ? secEl.options.length : "yok"));
t("selected option aktif dönem", !!(secEl && secEl.innerHTML.includes('value="donem-2025-2026" selected')));
const onceAktif = api.aktifDonemId();
donemSec("olmayan-donem");
t("geçersiz id → aktif dönem korunur", api.aktifDonemId() === onceAktif);

/* ---- 12..14) Tekrar 3 render ---- */
for (let i = 1; i <= 3; i++) {
  console.log((11 + i) + ") renderYonetim() tekrar " + i + ". çağrı:");
  renderYonetim();
  o = olc(BODY);
  t("host=1", o.host === 1, ozet(o));
  t("selector=1", o.secici === 1);
  t("button=1", o.buton === 1);
}

/* ---- Özet ---- */
console.log("\napp.js SHA-256: " + sha(appKaynak));
console.log(fail === 0 ? "TÜM GERÇEK DOM KONTROLLERİ GEÇTİ" : "BAŞARISIZ — yukarıdaki ✗ satırları sorun bölgesini gösterir");
process.exit(fail);
