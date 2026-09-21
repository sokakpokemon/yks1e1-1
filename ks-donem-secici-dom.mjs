let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 22) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-donem-secici-dom.mjs kosan=" + __kosan + " beklenen=22"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-donem-secici-dom.mjs:" + __kosan + ":22"); } });
/* ks-donem-secici-dom.mjs — DONEM-DOM-DÜZELTMESİ regresyon süiti (GERÇEK DOM semantiği)
   Kapsam: bilinmeyen getElementById → null; innerHTML eski çocukları gerçekten siler;
   insertAdjacentHTML markup'taki id'leri DOM'a kaydeder; ilk boot sonrası host/selector/buton
   = 1,1,1; ≥3 render sonrası yine 1,1,1; Öğretmen/Öğrenci & Sınıf/Ek Ders/Ayarlar & Yedekleme
   geçişleri sonrası yine 1,1,1; GECİKMELİ override senaryosu (ek-ders.js defer yazımı sonradan
   gelirse MutationObserver tabanlı onarım düzeltir); select'in seçili değeri aktifDonemId ile
   eşleşir; "Yeni Dönem Oluştur" duplicate dönem OLUŞTURMAZ; eksik elementte self-check AÇIK
   hata (console.error) verir. */
import { readFileSync } from "node:fs";

const appKaynak = readFileSync("app.js", "utf8");
const ekKaynak = readFileSync("ek-ders.js", "utf8");
const html = readFileSync("index.html", "utf8");
const inlineBloklar = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n;\n");
let n = 0, fail = 0;
const t = (ad, kosul, extra) => { __kosan++;  n++; if (!kosul) fail++; console.log((kosul ? "✓ " : "✗ ") + ad + (extra !== undefined ? " → " + extra : "")); };

/* ---- MutationObserver simülasyonu: innerHTML yazımı observer callback'ini setTimeout 0 ile
        tetikler (gerçek tarayıcıdaki mikro-görev kuyruğu davranışının eşleniği) ---- */
class MutationObserverSim {
  constructor(cb) { this._cb = cb; this._hedef = null; }
  observe(hedef) { this._hedef = hedef || null; if (hedef) { hedef._izleyiciler = hedef._izleyiciler || []; hedef._izleyiciler.push(this); } }
  disconnect() { if (this._hedef && this._hedef._izleyiciler) this._hedef._izleyiciler = this._hedef._izleyiciler.filter((x) => x !== this); }
  takeRecords() { return []; }
}

/* ---- GERÇEK DOM SEMANTİĞİ: bilinmeyen id → null; innerHTML yazımı eski çocukları siler;
        insertAdjacentHTML/appendChild/insertBefore markup id'lerini kayıt defterine ekler;
        qSA('[id="…"]') gerçek tekrar sayar; _propId ile özellik-atanmış id'ler de bulunur. ---- */
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
    ALL_ELS.forEach((e) => { if (e._koktenKopuk) return; adet += (e.innerHTML.split(hedef).length - 1); });
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
  return { document, window, localStorage, REGISTRY, BODY };
}

function boot(store) {
  const env = gercekDomKur(store || {});
  global.document = env.document; global.window = env.window; global.localStorage = env.localStorage;
  global.MutationObserver = MutationObserverSim;
  globalThis.tailwind = {};
  global.Chart = function () { this.destroy = () => {}; };
  const kaynak = [appKaynak, "\n;\n", ekKaynak, "\n;\n", inlineBloklar].join("");
  const api = new Function(kaynak + "\n  return { DB, ui, donemSecKutusuHTML, donemSec, renderYonetim, yenile, saveDB, aktifDonemId, sec, yeniDonemOlustur, donemHostOnar, donemOnarimPlanla, donemOzDenetim, donemHostOnarZincir, sinifProguDonemeBagla };")();
  return { api, REGISTRY: env.REGISTRY, BODY: env.BODY, flush: (ms) => new Promise((r) => setTimeout(r, ms || 0)) };
}
function olc(BODY) {
  const say = (id) => BODY.querySelectorAll('[id="' + id + '"]').length;
  return { host: say("donem-ui-host"), secici: say("donem-secici"), buton: say("yeni-donem-btn") };
}
const ozet = (o) => "(host=" + o.host + " secici=" + o.secici + " btn=" + o.buton + ")";
const uc1 = (o) => o.host === 1 && o.secici === 1 && o.buton === 1;

(async () => {
  console.log("=== ks-donem-secici-dom — dönem kontrolü: gerçek DOM + observer onarımı ===");

  /* 1) Bilinmeyen getElementById null döner */
  {
    const env = gercekDomKur({});
    t("bilinmeyen id → getElementById null", env.document.getElementById("hic-olmayan-xyz") === null);
    t("bilinen id → eleman döner", env.document.getElementById("yonetimBolum") !== null);
  }

  /* 2) innerHTML eski çocukları gerçekten siler */
  {
    const env = gercekDomKur({});
    const yb = env.REGISTRY["yonetimBolum"];
    yb.innerHTML = '<div id="gecici-cocuk"></div>';
    t("innerHTML yazımında çocuk id kaydedilir", env.document.getElementById("gecici-cocuk") !== null);
    yb.innerHTML = "<p>bambaşka içerik</p>";
    t("innerHTML yeniden yazımı eski çocuğu SİLER", env.document.getElementById("gecici-cocuk") === null);
  }

  /* 3) insertAdjacentHTML markup'taki id'leri DOM'a kaydeder */
  {
    const env = gercekDomKur({});
    const yb = env.REGISTRY["yonetimBolum"];
    yb.insertAdjacentHTML("afterend", '<div id="adjacent-id-orn"></div>');
    t("insertAdjacentHTML markup id'yi DOM'a kaydeder", env.document.getElementById("adjacent-id-orn") !== null);
  }

  /* 4) İlk boot sonrası host/selector/buton = 1,1,1 */
  {
    const b = boot({});
    t("boot hatasız (TypeError yok)", !!b.api && !!b.api.DB);
    await b.flush(5);
    const o = olc(b.BODY);
    t("ilk boot sonrası 1,1,1", uc1(o), ozet(o));
  }

  /* 5) ≥3 render sonrası yine 1,1,1 */
  {
    const b = boot({});
    await b.flush(5);
    b.api.renderYonetim(); b.api.renderYonetim(); b.api.renderYonetim();
    await b.flush(5);
    const o = olc(b.BODY);
    t("3 render sonrası yine 1,1,1", uc1(o), ozet(o));
  }

  /* 6) Alt sekme geçişleri sonrası yine 1,1,1 */
  {
    const b = boot({});
    await b.flush(5);
    b.api.sec("ogretmen"); await b.flush(5);
    let o = olc(b.BODY);
    t("Öğretmen sekmesi sonrası 1,1,1", uc1(o), ozet(o));
    b.api.sec("ogrenci"); await b.flush(5);
    o = olc(b.BODY);
    t("Öğrenci & Sınıf sekmesi sonrası 1,1,1", uc1(o), ozet(o));
    b.api.sec("ekders"); await b.flush(5);
    o = olc(b.BODY);
    t("Ek Ders sekmesi sonrası 1,1,1", uc1(o), ozet(o));
    b.api.sec("ayar"); await b.flush(5);
    o = olc(b.BODY);
    t("Ayarlar & Yedekleme sekmesi sonrası 1,1,1", uc1(o), ozet(o));
    b.api.sec("ogretmen"); await b.flush(5);
    o = olc(b.BODY);
    t("geri dönüş (Öğretmen) sonrası 1,1,1", uc1(o), ozet(o));
  }

  /* 7) GECİKMELİ override senaryosu: host'u kaldırıp ek-ders.js defer yazımını (seçici YOK)
        sonra gelirtiriz → seçici 0'a düşer → MutationObserver onarır (1,1,1). Bu, gerçek
        tarayıcıdaki "boot onarımı koşmadan defer script yazar" gecikme yoludur. */
  {
    const b = boot({});
    await b.flush(5);
    let o = olc(b.BODY);
    t("override öncesi 1,1,1", uc1(o), ozet(o));
    const host0 = b.REGISTRY["donem-ui-host"];
    const yb0 = b.REGISTRY["yonetimBolum"];
    const izleyiciSay = (el) => (el && el._izleyiciler ? el._izleyiciler.length : 0);
    t("observer yb'ye bağlı ve tek", izleyiciSay(yb0) === 1 && izleyiciSay(host0) === 0, "yb=" + izleyiciSay(yb0) + " host=" + izleyiciSay(host0));
    if (host0) host0.remove(); /* host'u DOM'dan çıkar (delete REGISTRY + kardeşlikten düşme) */
    b.api.renderYonetim(); /* ek-ders.js'in GECİKMELİ yb.innerHTML yazımı — seçici YOK */
    o = olc(b.BODY);
    t("gecikmeli yazım anında host+seçici 0 (hata koşulu gerçek)", o.host === 0 && o.secici === 0, ozet(o));
    await b.flush(5);
    o = olc(b.BODY);
    t("observer gecikmeli yazımı onarır (1,1,1)", uc1(o), ozet(o));
  }

  /* 8) select'in seçili değeri aktifDonemId ile eşleşir */
  {
    const b = boot({});
    await b.flush(5);
    const ak = b.api.aktifDonemId();
    const h = b.REGISTRY["donem-ui-host"];
    const markup = h ? h.innerHTML : "";
    const seciliOp = (markup.match(/<option[^>]*selected[^>]*>/g) || []);
    t("host'taki seçicide aktif dönem selected", seciliOp.length === 1 && seciliOp[0].includes('value="' + ak + '"'), seciliOp[0] || "yok");
  }

  /* 9) "Yeni Dönem Oluştur" duplicate dönem OLUŞTURMAZ */
  {
    const b = boot({});
    await b.flush(5);
    const once = b.api.DB.donemler.length;
    b.api.yeniDonemOlustur(); await b.flush(5);
    const yeniAdet = b.api.DB.donemler.length;
    b.api.yeniDonemOlustur(); b.api.yeniDonemOlustur(); await b.flush(5);
    const o = olc(b.BODY);
    t("ilk çağrı dönem ekler (1 yeni)", yeniAdet === once + 1, once + "→" + yeniAdet);
    t("tekrarlı çağrı duplicate dönem EKLEMEZ", b.api.DB.donemler.length === yeniAdet);
    t("tekrarlı buton sonrası hâlâ 1,1,1", uc1(o), ozet(o));
  }

  /* 10) Eksik element durumunda self-check AÇIK hata verir */
  {
    const b = boot({});
    await b.flush(5);
    const hataSatirlari = [];
    const gercekErr = console.error;
    console.error = (...a) => { hataSatirlari.push(a.join(" ")); };
    try {
      const host = b.REGISTRY["donem-ui-host"];
      const sakla = host ? host.innerHTML : "";
      if (host) host.innerHTML = "<p>boş</p>"; /* select/buton kayıt defterinden düşer */
      b.api.donemOzDenetim();
      if (host) host.innerHTML = sakla;
    } finally { console.error = gercekErr; }
    t("eksik elementte self-check console.error verir", hataSatirlari.some((s) => s.includes("[DONEM-DOM-SELF-CHECK]") && s.includes("EKSİK")));
  }

  console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
  process.exit(fail ? 1 : 0);
})();
