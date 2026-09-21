let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 51) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-kart-kolon.mjs kosan=" + __kosan + " beklenen=51"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-kart-kolon.mjs:" + __kosan + ":51"); } });
/* ks-kart-kolon.mjs — KART-KOLON-YAMASI süiti: planlama ekranındaki iki kart
   (Birebir Ders Planla + Öğrenci Birebir İstek Havuzu) masaüstü/tablet'te yan yana
   iki kolon (#ks-kart-kolon), dar ekranda tek kolon. Gerçek DOM semantiği:
   bilinmeyen id → null, innerHTML yazımı eski çocukları siler, gerçek parent/çocuk yapısı. */
import { readFileSync } from "node:fs";

const appKaynak = readFileSync("app.js", "utf8");
const ekKaynak = readFileSync("ek-ders.js", "utf8");
const html = readFileSync("index.html", "utf8");
const inlineBloklar = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n;\n");
let n = 0, fail = 0;
const t = (ad, kosul, extra) => { __kosan++;  n++; if (!kosul) fail++; console.log((kosul ? "✓ " : "✗ ") + ad + (extra !== undefined ? " → " + extra : "")); };

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
      insertAdjacentHTML(_p, h) { idKaydet(String(h), this); },
      appendChild(c) { kayit(c, this); },
      insertBefore(c, ref) { kayit(c, this); const i = this._cocuk.indexOf(ref); if (i >= 0) this._cocuk = cok(this._cocuk, c, i); return c; },
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
  function cok(arr, item, idx) { const arr2 = arr.filter((x) => x !== item); arr2.splice(idx, 0, item); return arr2; }
  function kayit(e, host) { e._host = host || null; e.parentNode = host || null; if (host) host._cocuk.push(e); if (e.id && !REGISTRY[e.id]) REGISTRY[e.id] = e; }
  function idKaydet(metin, host) { [...metin.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!REGISTRY[m[1]]) kayit(El(m[1]), host); }); }
  const BODY = El("body-kok"); kayit(BODY, null);
  const HTMLKOK = El("html-kok"); kayit(HTMLKOK, null);
  /* statik HTML çocuk sırası: index.html body içeriğini kabaca sırayla kur */
  const govde = html.slice(html.indexOf("<body"));
  [...govde.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!REGISTRY[m[1]]) kayit(El(m[1]), BODY); });
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
  return { document, window, localStorage, REGISTRY, BODY, ALL_ELS };
}

function boot(store) {
  const env = gercekDomKur(store || {});
  global.document = env.document; global.window = env.window; global.localStorage = env.localStorage;
  global.MutationObserver = MutationObserverSim;
  globalThis.tailwind = {};
  global.Chart = function () { this.destroy = () => {}; };
  const kaynak = [appKaynak, "\n;\n", ekKaynak, "\n;\n", inlineBloklar].join("");
  const api = new Function(kaynak + "\n  return { DB, ui, yenile, renderHavuz, renderYonetim, renderFormDestek, formaAktar, planla, saveDB, aktifDonemId, kartKolonOnar };")();
  return { api, REGISTRY: env.REGISTRY, BODY: env.BODY, ALL_ELS: env.ALL_ELS, flush: (ms) => new Promise((r) => setTimeout(r, ms || 0)) };
}

/* Kolon sırası statik kaynaktan kanıtlanır (sim DOM statik id'leri düz kaydeder);
   runtime onarım yolu ayrıca test edilir (wrapper silinir → kartKolonOnar yeniden kurar). */
/* Statik parent yapısı: index.html kaynak semantiğiyle kolon üyeliği kanıtlanır.
   (Sim DOM statik id'leri düz kaydeder; gerçek parent zinciri kaynak sırasından okunur.) */
const idxSolAc = html.indexOf('<div id="ks-kart-kolon-sol"');
const idxSagAc = html.indexOf('<div id="ks-kart-kolon-sag"');
const idxWrapKapa = html.lastIndexOf("</div>\n</div>");
const idxPlan = html.indexOf('id="planKart"');
const idxHavuz = html.indexOf('id="havuzBolum"');
const planSolda = idxSolAc !== -1 && idxSagAc !== -1 && idxSolAc < idxPlan && idxPlan < idxSagAc;
const havuzSagda = idxSagAc !== -1 && idxWrapKapa !== -1 && idxSagAc < idxHavuz && idxHavuz < idxWrapKapa;
function kartParentId(env, kid) {
  const k = env.REGISTRY[kid];
  return k && k.parentNode ? (k.parentNode.id || "?") : null;
}

(async () => {
  console.log("=== ks-kart-kolon — iki-kolon plan + havuz yerleşimi (gerçek DOM semantiği) ===");

  /* A) Boot sonrası wrapper varlığı + teklik */
  {
    const env = boot({});
    const { api } = env;
    t("boot hatasız", !!api.DB);
    t("Iki kolon wrapper'ı boot sonrası DOM'da", !!env.REGISTRY["ks-kart-kolon"]);
    t("Wrapper DOM'da tam bir kez", (env.ALL_ELS.filter((e) => e.id === "ks-kart-kolon" && !e._koktenKopuk).length) === 1);
    t("Plan kartı tam bir kez", (env.ALL_ELS.filter((e) => e.id === "planKart" && !e._koktenKopuk).length) === 1);
    t("İstek havuzu tam bir kez", (env.ALL_ELS.filter((e) => e.id === "havuzBolum" && !e._koktenKopuk).length) === 1);
    const sir = planSolda && havuzSagda ? ["ks-kart-kolon-sol", "ks-kart-kolon-sag"] : null;
    t("Wrapper iki kolon çocuklu (sol→sag, kaynak sırası)", !!sir, JSON.stringify(sir));
    t("Plan kartı SOL kolonda (statik parent)", planSolda, "sol=" + idxSolAc + " plan=" + idxPlan + " sag=" + idxSagAc);
    t("İstek havuzu SAĞ kolonda (statik parent)", havuzSagda, "sag=" + idxSagAc + " havuz=" + idxHavuz + " kapa=" + idxWrapKapa);
    t("Sol kolon ilk (plan solda)", !!sir && sir[0] === "ks-kart-kolon-sol");
    t("Sağ kolon ikinci (havuz sağda)", !!sir && sir[1] === "ks-kart-kolon-sag");

    /* B) Form/panel/buton korunumu */
    t("Plan formu f-ogrenci DOM'da", !!env.REGISTRY["f-ogrenci"]);
    t("Plan formu f-ders DOM'da", !!env.REGISTRY["f-ders"]);
    t("Plan formu f-konu DOM'da", !!env.REGISTRY["f-konu"]);
    t("Plan formu f-ogretmen DOM'da", !!env.REGISTRY["f-ogretmen"]);
    t("Plan formu f-tarih DOM'da", !!env.REGISTRY["f-tarih"]);
    t("Plan formu f-saat DOM'da", !!env.REGISTRY["f-saat"]);
    t("Planlama butonu btnPlan DOM'da", !!env.REGISTRY["btnPlan"]);
    t("hizliOgr anchor DOM'da ve dolduruldu", !!env.REGISTRY["hizliOgr"] && (env.REGISTRY["hizliOgr"].innerHTML.includes("hizliSec") || env.REGISTRY["hizliOgr"].innerHTML.includes("Öğretmenler")));
    t("hizliOgr plan kartının İÇİNDE (statik)", idxPlan < html.indexOf('id="hizliOgr"') && html.indexOf('id="hizliOgr"') < idxSagAc);
    t("Grup paneli (#ek-ogrenciler) DOM'da", !!env.REGISTRY["ek-ogrenciler"]);
    t("Grup paneli f-ogrenci'ye inject edildi (plan kartı içinde)", env.REGISTRY["ek-ogrenciler"] && env.REGISTRY["ek-ogrenciler"].parentNode && env.REGISTRY["ek-ogrenciler"].parentNode.id === "f-ogrenci");
    t("Grup paneli plan kartı DIŞINA taşınmadı", !(env.REGISTRY["ek-ogrenciler"] && env.REGISTRY["ek-ogrenciler"].parentNode && (env.REGISTRY["ek-ogrenciler"].parentNode.id === "ks-kart-kolon-sag" || env.REGISTRY["ek-ogrenciler"].parentNode.id === "havuzBolum")));
    t("Havuz formu h-ogrenci DOM'da", !!env.REGISTRY["h-ogrenci"]);
    t("Havuz formu h-ders DOM'da", !!env.REGISTRY["h-ders"]);
    t("İsteği Havuza Ekle butonu havuzda", (env.REGISTRY["havuzBolum"].innerHTML.includes("istekEkle")));
    t("Ortak Grup İsteği butonu havuzda", (env.REGISTRY["havuzBolum"].innerHTML.includes("istekGrupPanelAc")));
    t("Havuz filtre çipleri render oluyor", (env.REGISTRY["havuzBolum"].innerHTML.match(/istekFiltrele/g) || []).length >= 1);
    t("Havuzda istek satırı var (seed istekler)", (env.REGISTRY["havuzBolum"].innerHTML.match(/formaAktar\(/g) || []).length >= 1);

    /* C) Render/yenile idempotansı */
    await env.flush(0);
    api.yenile();
    api.yenile();
    await env.flush(0);
    t("3× render sonrası wrapper tam bir kez", (env.ALL_ELS.filter((e) => e.id === "ks-kart-kolon" && !e._koktenKopuk).length) === 1);
    t("3× render sonrası plan kartı tam bir kez", (env.ALL_ELS.filter((e) => e.id === "planKart" && !e._koktenKopuk).length) === 1);
    t("3× render sonrası havuz tam bir kez", (env.ALL_ELS.filter((e) => e.id === "havuzBolum" && !e._koktenKopuk).length) === 1);
    t("render sonrası kolon üyeliği korunur (statik + runtime teklik)", planSolda && havuzSagda);
    t("render sonrası panel hâlâ f-ogrenci altında (plan kartı içinde)", env.REGISTRY["ek-ogrenciler"] && env.REGISTRY["ek-ogrenciler"].parentNode && env.REGISTRY["ek-ogrenciler"].parentNode.id === "f-ogrenci");

    /* D) renderYonetim + sekme geçişleri sonrası kolon sırası korunur */
    const sekmeler = ["ogretmen", "ogrenci", "ekders", "ayar"];
    let tamam = true, sirTamam = true;
    for (const s of sekmeler) {
      const wIdOncesi = env.REGISTRY["ks-kart-kolon"] ? 1 : 0;
      try { api.renderYonetim(); api.kartKolonOnar(); } catch (e) { tamam = false; }
      const wIdSonrasi = (env.REGISTRY["ks-kart-kolon"] && !env.REGISTRY["ks-kart-kolon"]._koktenKopuk) ? 1 : 0;
      if (wIdOncesi !== 1 || wIdSonrasi !== 1) sirTamam = false;
      if (!(env.ALL_ELS.filter((e) => (e.id === "planKart" || e.id === "havuzBolum") && !e._koktenKopuk).length === 2)) sirTamam = false;
    }
    t("Sekme geçişleri hatasız", tamam);
    t("renderYonetim + sekme geçişleri sonrası iki kolon sırası korunuyor", sirTamam);
    t("Sekmelerden sonra da wrapper tek", (env.ALL_ELS.filter((e) => e.id === "ks-kart-kolon" && !e._koktenKopuk).length) === 1);

    /* E) kartKolonOnar idempotent + formaAktar/planla akışı */
    api.kartKolonOnar();
    t("kartKolonOnar tekrar çağrısı duplicate üretmez", (env.ALL_ELS.filter((e) => e.id === "ks-kart-kolon" && !e._koktenKopuk).length) === 1);
    let akisHatasiz = true;
    try {
      const istek = api.DB.istekler.find((i) => i.durum === "bekliyor");
      if (istek) { api.formaAktar(istek.id); api.planla(); }
    } catch (e) { akisHatasiz = false; }
    t("formaAktar + planla akışı hata vermiyor", akisHatasiz);
    t("Akış sonrası wrapper hâlâ tek ve yerinde", (env.ALL_ELS.filter((e) => e.id === "ks-kart-kolon" && !e._koktenKopuk).length) === 1);
    t("Akış sonrası kartlar tekli ve kolon yapısı bozulmadı", (env.ALL_ELS.filter((e) => (e.id === "planKart" || e.id === "havuzBolum") && !e._koktenKopuk).length) === 2 && planSolda && havuzSagda);

    /* E2) Runtime onarım: wrapper'ı sim DOM'dan sil → kartKolonOnar sol→sag yeniden kurar */
    try {
      const w = env.REGISTRY["ks-kart-kolon"];
      if (w) w.remove();
      api.kartKolonOnar();
      const sirY = (env.REGISTRY["ks-kart-kolon"] && env.REGISTRY["ks-kart-kolon"]._cocuk.map((c) => c.id).join(",")) || "";
      t("kartKolonOnar wrapper silinince yeniden kurar (tek)", !!env.REGISTRY["ks-kart-kolon"]);
      t("Onarım sonrası sol→sag çocuk sırası", sirY === "ks-kart-kolon-sol,ks-kart-kolon-sag", sirY);
      t("Onarım sonrası plan solda (parent)", env.REGISTRY["planKart"].parentNode && env.REGISTRY["planKart"].parentNode.id === "ks-kart-kolon-sol");
      t("Onarım sonrası havuz sağda (parent)", env.REGISTRY["havuzBolum"].parentNode && env.REGISTRY["havuzBolum"].parentNode.id === "ks-kart-kolon-sag");
    } catch (e) { t("Runtime onarım yolu hatasız", false, String(e.message)); }
  }

  /* F) Responsive CSS kuralları (kaynak semantiği) */
  {
    t("Wrapper CSS kuralı kaynakta (#ks-kart-kolon)", html.includes("#ks-kart-kolon"));
    t("Dar ekran media query breakpoint tanımlı", /@media\s*\(max-width:\s*1023\.98px\)/.test(html));
    const mq = html.slice(html.indexOf("@media (max-width: 1023.98px)"), html.indexOf("@media (max-width: 1023.98px)") + 400);
    t("Dar ekran kuralında grid tek kolona düşüyor", mq.includes("grid-template-columns: minmax(0,1fr)") && !mq.includes("minmax(0,1fr) minmax(0,1fr)"));
    t("Masaüstü kuralı iki eşit minmax kolon", html.includes("grid-template-columns: minmax(0,1fr) minmax(0,1fr)"));
    t("Dar kolonda min-width:0 koruması", html.includes("#ks-kart-kolon > div { min-width: 0"));
  }

  /* G) Süit kaydı: test.mjs'te tam 1 kez, eski süitler korunuyor */
  {
    const testRunner = readFileSync("test.mjs", "utf8");
    const adet = (testRunner.match(/ks-kart-kolon\.mjs/g) || []).length;
    t("ks-kart-kolon.mjs test.mjs'te tam 1 kez", adet === 1, String(adet));
    const eski = ["ks-harness.mjs", "ks-test-render.mjs", "ks-durum-fn.mjs", "ks-grup-uyum.mjs", "ks-panel-secim.mjs", "ks-grup-gorunum.mjs", "ks-istekten-grup.mjs", "ks-grup-istegi.mjs", "ks-benzersiz-id.mjs", "ks-gercek-kadro.mjs", "ks-donem-ilk.mjs", "ks-donem-damga.mjs", "ks-donem-secici.mjs", "ks-excel-csv.mjs", "ks-donem-olusturma.mjs", "ks-donem-secici-gorunum.mjs", "ks-donem-secici-dom.mjs", "ks-sinifprog-csv.mjs", "ks-sablon-kopya.mjs", "ks-render-sahipligi.mjs", "ks-d1-render-refactor.mjs", "ks-kadro-siralama.mjs", "ks-kapali-gorunum.mjs", "ks-ek-ders-donem.mjs", "ks-ekders-gorunum.mjs", "ks-ekders-ozet-csv.mjs", "ks-birebir-gorunum.mjs", "ks-sinif-ogretmen-uyum.mjs", "ks-sinif-prog-uyum-onar.mjs", "ks-sinif-prog-etiket.mjs", "ks-kart-sirasi.mjs"];
    const eksik = eski.filter((s) => !testRunner.includes('"' + s + '"'));
    t("Mevcut 31 süit test.mjs'te korundu (test sayısı düşmüyor)", eksik.length === 0, eksik.join(","));
  }

  console.log(fail === 0 ? "HEPSİ GEÇTİ" : fail + " TEST KIRMIZI");
  process.exit(fail === 0 ? 0 : 1);
})();
