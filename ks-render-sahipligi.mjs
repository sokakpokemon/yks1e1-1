/* ks-render-sahipligi.mjs — D0 RENDER SAHİPLİĞİ regresyon süiti (GERÇEK DOM semantiği)
   Sahiplik sınırını gerçek DOM ile kanıtlar: yb.innerHTML yeniden yazımı eski çocukları SİLER;
   #donem-ui-host yb'nin KARDEŞİ olduğu için override'a rağmen kalır; insertAdjacentHTML
   markup id'leri kayıt defterine ekler; boot/3 render/4 alt sekme turu sonrası beşli
   (host, donem-secici, yeni-donem-btn, sablon-kopya-ui, sablon-kopyala-btn) = 1'er;
   seçim değerleri korunur; localStorage render'da değişmez; duplicate id yok. */
import { readFileSync } from "node:fs";

const appKaynak = readFileSync("app.js", "utf8");
const ekKaynak = readFileSync("ek-ders.js", "utf8");
const html = readFileSync("index.html", "utf8");
const inlineBloklar = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n;\n");
let n = 0, fail = 0;
const t = (ad, kosul, extra) => { n++; if (!kosul) fail++; console.log((kosul ? "✓ " : "✗ ") + ad + (extra !== undefined ? " → " + extra : "")); };

class MutationObserverSim {
  constructor(cb) { this._cb = cb; this._hedef = null; }
  observe(hedef) { this._hedef = hedef || null; if (hedef) { hedef._izleyiciler = hedef._izleyiciler || []; hedef._izleyiciler.push(this); } }
  disconnect() { if (this._hedef && this._hedef._izleyiciler) this._hedef._izleyiciler = this._hedef._izleyiciler.filter((x) => x !== this); }
  takeRecords() { return []; }
}

function gercekDomKur(store) {
  const REGISTRY = Object.create(null);
  const ALL_ELS = [];
  function El(id) {
    const e = {
      tagName: "DIV", parentNode: null, _cocuk: [], _propId: false,
      style: {}, dataset: {}, value: "", checked: false, textContent: "", files: null,
      classList: { _s: new Set(), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, toggle(c, f) { if (f === undefined) this._s.has(c) ? this._s.delete(c) : this._s.add(c); else f ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      insertAdjacentHTML(_p, h) { this._ekMarkup = (this._ekMarkup || "") + String(h); idKaydet(String(h), this); },
      appendChild(c) { kayit(c, this); },
      insertBefore(c) { kayit(c, this); return c; },
      remove() { if (this.parentNode) this.parentNode._cocuk = this.parentNode._cocuk.filter((x) => x !== this); this.parentNode = null; if (this.id) delete REGISTRY[this.id]; this._koktenKopuk = true; },
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
        this._ekMarkup = ""; /* innerHTML yazımı insertAdjacentHTML eklerini de siler */
        idKaydet(_h, e);
        if (e._izleyiciler && e._izleyiciler.length) e._izleyiciler.forEach((o) => { try { setTimeout(() => o._cb([], o), 0); } catch (e2) {} });
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
    ALL_ELS.forEach((e) => { if (e._koktenKopuk) return; adet += (e.innerHTML + (e._ekMarkup || "")).split(hedef).length - 1; });
    if (adet === 0 && REGISTRY[m[1]] && REGISTRY[m[1]]._propId && !REGISTRY[m[1]]._koktenKopuk) adet = 1;
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
  return { document, window, localStorage, REGISTRY, BODY, store };
}

function boot(store) {
  const env = gercekDomKur(store || {});
  global.document = env.document; global.window = env.window; global.localStorage = env.localStorage;
  global.MutationObserver = MutationObserverSim;
  globalThis.tailwind = {};
  global.Chart = function () { this.destroy = () => {}; };
  const kaynak = [appKaynak, "\n;\n", ekKaynak, "\n;\n", inlineBloklar].join("");
  const api = new Function(kaynak + "\n  return { DB, ui, renderYonetim, yenile, saveDB, aktifDonemId, sec, yeniDonemOlustur, sablonKopyaUygula, sinifProgAktif };\n")();
  return { api, REGISTRY: env.REGISTRY, BODY: env.BODY, store: env.store, flush: (ms) => new Promise((r) => setTimeout(r, ms || 0)) };
}
const IDS = ["donem-ui-host", "donem-secici", "yeni-donem-btn", "sablon-kopya-ui", "sablon-kopyala-btn"];
function olc(BODY) {
  const o = {};
  IDS.forEach((id) => { o[id] = BODY.querySelectorAll('[id="' + id + '"]').length; });
  return o;
}
const ozet = (o) => "(" + IDS.map((id) => id + "=" + o[id]).join(" ") + ")";
const besli1 = (o) => IDS.every((id) => o[id] === 1);
const secimDegeri = (REGISTRY, id) => {
  const el = REGISTRY[id];
  if (!el) return null;
  if (el.value) return el.value; /* kullanıcı/mock tarafından atanmış değer önceliklidir */
  /* gerçek DOM'da select.value = selected option'ın value'su — mock'ta markup'tan okunur */
  const markup = String(el.innerHTML || "") + String(el._ekMarkup || "");
  const m = markup.match(/<option[^>]*value="([^"]+)"[^>]*selected/);
  return m ? m[1] : null;
};

(async () => {
  console.log("=== ks-render-sahipligi — render sahipliği: gerçek DOM semantiği ===");

  /* 1) Bilinmeyen getElementById null döner */
  {
    const env = gercekDomKur({});
    t("bilinmeyen id → getElementById null", env.document.getElementById("hic-olmayan-abc") === null);
    t("bilinen id → eleman döner", env.document.getElementById("yonetimBolum") !== null);
  }

  /* 2) innerHTML eski çocukları gerçekten siler */
  {
    const env = gercekDomKur({});
    const yb = env.REGISTRY["yonetimBolum"];
    yb.innerHTML = '<div id="rs-gecici-cocuk"></div>';
    t("innerHTML yazımı çocuk id'yi kayıt defterine ekler", env.document.getElementById("rs-gecici-cocuk") !== null);
    yb.innerHTML = "<p>başka içerik</p>";
    t("innerHTML yeniden yazımı eski çocuğu gerçekten SİLER", env.document.getElementById("rs-gecici-cocuk") === null);
  }

  /* 3) insertAdjacentHTML markup id'leri DOM'a kaydeder */
  {
    const env = gercekDomKur({});
    env.REGISTRY["yonetimBolum"].insertAdjacentHTML("afterend", '<div id="rs-adjacent-id"></div>');
    t("insertAdjacentHTML markup id'yi DOM'a kaydeder", env.document.getElementById("rs-adjacent-id") !== null);
  }

  /* 4) İlk boot sonrası beşli 1,1,1,1,1 */
  {
    const b = boot({});
    t("boot hatasız", !!b.api && !!b.api.DB);
    await b.flush(5);
    const o = olc(b.BODY);
    t("ilk boot sonrası beşli 1,1,1,1,1", besli1(o), ozet(o));
  }

  /* 5) ≥3 render sonrası yine 1,1,1,1,1 */
  {
    const b = boot({});
    await b.flush(5);
    b.api.renderYonetim(); b.api.renderYonetim(); b.api.renderYonetim();
    await b.flush(5);
    const o = olc(b.BODY);
    t("3 render sonrası beşli hâlâ 1,1,1,1,1", besli1(o), ozet(o));
  }

  /* 6) 4 alt sekme + geri dönüş sonrası beşli korunur */
  {
    const b = boot({});
    await b.flush(5);
    b.api.sec("ogretmen"); await b.flush(5);
    let o = olc(b.BODY);
    t("Öğretmen sekmesi sonrası beşli 1", besli1(o), ozet(o));
    b.api.sec("ogrenci"); await b.flush(5);
    o = olc(b.BODY);
    t("Öğrenci & Sınıf sekmesi sonrası beşli 1", besli1(o), ozet(o));
    b.api.sec("ekders"); await b.flush(5);
    o = olc(b.BODY);
    t("Ek Ders sekmesi sonrası beşli 1", besli1(o), ozet(o));
    b.api.sec("ayar"); await b.flush(5);
    o = olc(b.BODY);
    t("Ayarlar & Yedekleme sekmesi sonrası beşli 1", besli1(o), ozet(o));
    b.api.sec("ogretmen"); await b.flush(5);
    o = olc(b.BODY);
    t("geri dönüş (Öğretmen) sonrası beşli 1", besli1(o), ozet(o));
  }

  /* 7) yb.innerHTML override'ı host'u SİLEMEZ (kardeşlik kanıtı) */
  {
    const b = boot({});
    await b.flush(5);
    const host = b.REGISTRY["donem-ui-host"];
    const yb = b.REGISTRY["yonetimBolum"];
    t("host yb'nin KARDEŞİ ( parentNode === yb.parentNode )", host && yb && host.parentNode === yb.parentNode);
    b.api.renderYonetim();
    await b.flush(5);
    t("override sonrası host DOM'da kalıyor", b.REGISTRY["donem-ui-host"] === host);
    const o = olc(b.BODY);
    t("override sonrası beşli hâlâ 1", besli1(o), ozet(o));
  }

  /* 8) Duplicate id yok */
  {
    const b = boot({});
    await b.flush(5);
    b.api.sec("ekders"); await b.flush(5);
    const o = olc(b.BODY);
    t("duplicate id YOK (tümü tam 1)", besli1(o), ozet(o));
  }

  /* 9) Dönem seçimi sekme geçişlerinde korunur */
  {
    const b = boot({});
    await b.flush(5);
    b.api.yeniDonemOlustur(); await b.flush(5);
    const hedef = b.api.DB.aktifDonemId;
    const secici = b.REGISTRY["donem-secici"];
    if (secici) secici.value = hedef;
    const deger1 = secimDegeri(b.REGISTRY, "donem-secici");
    b.api.sec("ogretmen"); await b.flush(5);
    b.api.sec("ekders"); await b.flush(5);
    const deger2 = secimDegeri(b.REGISTRY, "donem-secici");
    t("dönem seçimi sekme geçişlerinde korunur", deger1 === deger2, deger1 + " → " + deger2);
    t("DB.aktifDonemId hâlâ seçilen dönem", b.api.DB.aktifDonemId === deger2, b.api.DB.aktifDonemId);
    t("DB.sinifProgDonemId ile uyumlu", b.api.DB.sinifProgDonemId === b.api.DB.aktifDonemId, b.api.DB.sinifProgDonemId);
    b.api.sec("ogretmen"); await b.flush(5);
  }

  /* 10) Şablon seçimleri sekme geçişlerinde korunur */
  {
    const b = boot({});
    await b.flush(5);
    b.api.yeniDonemOlustur(); await b.flush(5); /* ikinci dönem → şablon selectleri dolu */
    const kEl = b.REGISTRY["sablon-kaynak-donem"];
    const hEl = b.REGISTRY["sablon-hedef-donem"];
    /* gerçek DOM'da select.value = selected option'ın value'su; mock'ta seçimi açıkça atarız */
    if (kEl && hEl) { kEl.value = b.api.DB.donemler[0].id; hEl.value = b.api.DB.donemler[b.api.DB.donemler.length - 1].id; }
    const k1 = kEl ? kEl.value : null, h1 = hEl ? hEl.value : null;
    t("şablon selectleri gerçek dönem id'leri taşıyor", !!k1 && !!h1 && k1 !== h1, "k=" + k1 + " h=" + h1);
    b.api.sec("ayar"); await b.flush(5);
    b.api.sec("ogrenci"); await b.flush(5);
    const k2 = b.REGISTRY["sablon-kaynak-donem"] ? b.REGISTRY["sablon-kaynak-donem"].value : null;
    const h2 = b.REGISTRY["sablon-hedef-donem"] ? b.REGISTRY["sablon-hedef-donem"].value : null;
    t("şablon kaynak/hedef seçimleri sekme geçişinde korunur", k1 === k2 && h1 === h2, "k=" + k1 + "→" + k2 + " h=" + h1 + "→" + h2);
  }

  /* 11) Şablon kopyalama onay akışına bağlı (dolu hedef RED, LS değişmez) */
  {
    const b = boot({});
    await b.flush(5);
    b.api.yeniDonemOlustur(); await b.flush(5);
    const hedefDonem = b.api.DB.donemler[b.api.DB.donemler.length - 1].id;
    b.api.sinifProgAktif; /* referans */
    /* hedef programa bir hücre koy (dolu) */
    b.api.DB.sinifProgDonemler[hedefDonem] = { "RS SINIF": ["0-1"] };
    const lsOnce = b.store["yksOto_arsiv_v1"];
    const red = b.api.sablonKopyaUygula(b.api.DB.donemler[0].id, hedefDonem);
    t("dolu hedefe şablon kopyalama RED", red === false);
    t("RED sonrası localStorage byte-birebir", b.store["yksOto_arsiv_v1"] === lsOnce);
    b.api.sec("ogretmen"); await b.flush(5);
  }

  /* 12) Yeni dönem butonu aynı dönemi ikinci kez oluşturmaz + beşli korunur */
  {
    const b = boot({});
    await b.flush(5);
    b.api.yeniDonemOlustur(); await b.flush(5);
    const adet = b.api.DB.donemler.length;
    b.api.yeniDonemOlustur(); b.api.yeniDonemOlustur(); await b.flush(5);
    t("tekrarlı buton duplicate dönem OLUŞTURMAZ", b.api.DB.donemler.length === adet, adet + "→" + b.api.DB.donemler.length);
    const o = olc(b.BODY);
    t("tekrarlı buton sonrası beşli hâlâ 1", besli1(o), ozet(o));
  }

  /* 13) Render/sekme geçişi localStorage'ı DEĞİŞTİRMEZ */
  {
    const b = boot({});
    await b.flush(5);
    const lsOnce = b.store["yksOto_arsiv_v1"];
    b.api.renderYonetim(); b.api.renderYonetim();
    b.api.sec("ogretmen"); b.api.sec("ekders"); b.api.sec("ayar");
    await b.flush(5);
    t("render + sekme geçişleri localStorage'ı değiştirmedi", b.store["yksOto_arsiv_v1"] === lsOnce);
  }

  /* 14) Render sırasında program verileri değişmez */
  {
    const b = boot({});
    await b.flush(5);
    const progOnce = JSON.stringify(b.api.DB.sinifProg);
    const spOnce = JSON.stringify(b.api.DB.sinifProgDonemler);
    b.api.renderYonetim(); b.api.sec("ekders"); b.api.sec("ogrenci");
    await b.flush(5);
    t("sinifProg render'da değişmedi", JSON.stringify(b.api.DB.sinifProg) === progOnce);
    t("sinifProgDonemler render'da değişmedi", JSON.stringify(b.api.DB.sinifProgDonemler) === spOnce);
  }

  /* 15) ikinci kalıcı host eklenmez */
  {
    const b = boot({});
    await b.flush(5);
    b.api.sec("ayar"); b.api.sec("ogretmen"); await b.flush(5);
    const o = olc(b.BODY);
    t("tek #donem-ui-host (ikinci kalıcı host yok)", o["donem-ui-host"] === 1, ozet(o));
  }

  console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
  process.exit(fail ? 1 : 0);
})();
