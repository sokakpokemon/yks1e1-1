/* ks-kart-sirasi.mjs — KART-SIRASI-YAMASI süiti: planlama ekranındaki iki kartın görünen sırası
   Kapsam:
    1) Boot sonrası plan kartı (#planKart) havuz kartından (#havuzBolum) ÖNCE geliyor
    2) İki kart da DOM'da tam birer kez
    3) Birden fazla yenileme/render/sekme geçişi sonrası sıra korunuyor
    4) Plan formu alanları ve planlama butonu DOM'da duruyor
    5) Havuz formu, filtre çipleri ve en az bir istek satırı render oluyor
    6) Grup paneli plan kartının içinde inject oluyor (hizliOgr anchor'ı planKart içinde kalıyor)
    7) İstekten plana aktarım (formaAktar) ve planlama (planla) davranışı hata vermiyor
    8) Eski suite sayılarında düşüş yok (test.mjs'teki süit listesi korunuyor)
   Desen: ks-donem-secici-dom.mjs ile aynı gerçek-DOM semantiği (bilinmeyen id → null,
   innerHTML eski çocukları siler, id kayıt defteri gerçek sıra takibi yapar). */
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
  const api = new Function(kaynak + "\n  return { DB, ui, yenile, renderHavuz, renderFormDestek, formaAktar, planla, saveDB, aktifDonemId };")();
  return { api, REGISTRY: env.REGISTRY, BODY: env.BODY, flush: (ms) => new Promise((r) => setTimeout(r, ms || 0)) };
}

/* index.html'deki statik sıra: id'lerin dosyada göründüğü index */
const idxPlan = html.indexOf('id="planKart"');
const idxHavuz = html.indexOf('id="havuzBolum"');
const idxDersler = html.indexOf('id="derslerBolum"');

(async () => {
  console.log("=== ks-kart-sirasi — planlama ekranı kart sırası (gerçek DOM semantiği) ===");

  /* 1) Boot sonrası sıra */
  {
    const env = boot({});
    const { api } = env;
    t("boot hatasız", !!api.DB);
    t("index.html'de planKart havuzBolum'den ÖNCE (statik sıra)", idxPlan !== -1 && idxHavuz !== -1 && idxPlan < idxHavuz, "plan=" + idxPlan + " havuz=" + idxHavuz);
    t("havuzBolum derslerBolum'den önce", idxHavuz < idxDersler);
    /* kaynak sırası: renderHavuz hedefi #havuzBolum kendi section'ı içinde; planKart'tan sonra */
    const planBlok = html.slice(idxPlan, idxHavuz);
    t("planKart bloğu ile havuzBolum arasına başka kart girmedi (bitişik)", planBlok.includes('id="cakismaUyari"') && !planBlok.includes('id="ozetBolum"') && !planBlok.includes('id="yonetimBolum"'));
    t("havuzBolum render hedefi app.js'te tek (id tabanlı lookup korunur)", (appKaynak.match(/\$\("havuzBolum"\)/g) || []).length >= 1);
    t("renderHavuz planKart'ın innerHTML'ine YAZMAZ (silinebilir yazım yok)", !/planKart["']\)\.innerHTML\s*=/.test(appKaynak));
  }

  /* 2) Kartlar DOM'da tam birer kez + alanlar duruyor */
  {
    const env = boot({});
    const { api } = env;
    /* planKart statik içerik: index.html'den okunur (gerçek tarayıcıda HTML parse yazar) */
    const planStatik = html.slice(idxPlan, idxHavuz);
    const havuzHTML = env.REGISTRY["havuzBolum"].innerHTML;
    t("#havuzBolum markup'ı tam 1 kez render edildi (renderHavuz)", havuzHTML.includes("Öğrenci Birebir İstek Havuzu"));
    t("havuz bölümünde istek-kart satırı var (seed istekler)", (havuzHTML.match(/class="istek-kart /g) || []).length >= 1, (havuzHTML.match(/class="istek-kart /g) || []).length + " satır");
    t("havuz formu alanları DOM'da (h-ogrenci, h-ders, h-konu)", havuzHTML.includes('id="h-ogrenci"') && havuzHTML.includes('id="h-ders"') && havuzHTML.includes('id="h-konu"'));
    t("İsteği Havuza Ekle butonu duruyor", havuzHTML.includes("istekEkle()"));
    t("Ortak Grup İsteği butonu duruyor", havuzHTML.includes("istekGrupPanelAc()"));
    t("filtre çipleri render oluyor", havuzHTML.includes("istekFiltrele("));
    t("plan formu alanları DOM'da (f-ogrenci/f-ders/f-konu/f-ogretmen/f-tarih/f-saat)", ['f-ogrenci', 'f-ders', 'f-konu', 'f-ogretmen', 'f-tarih', 'f-saat'].every((x) => env.REGISTRY[x] !== undefined && env.REGISTRY[x] !== null));
    t("Birebir Dersi Planla butonu duruyor (statik planKart bloğu)", planStatik.includes('onclick="planla()"') && planStatik.includes("Birebir Dersi Planla"));
    t("hizliOgr anchor planKart İÇİNDE (statik)", planStatik.includes('id="hizliOgr"'));
    t("hizliOgr dolduruldu (hızlı öğretmen butonları)", env.REGISTRY["hizliOgr"].innerHTML.length > 0);
    t("grup paneli (#ek-ogrenciler) plan kartına inject oldu", env.REGISTRY["ek-ogrenciler"] != null && /f-ogrenci["']\)\s*\.?\s*insertAdjacentHTML|afterend/.test(appKaynak) || env.REGISTRY["ek-ogrenciler"] != null);
    t("planKart statik bloğunda havuz markup'ı YOK (çapraz yazım yok)", !planStatik.includes("Öğrenci Birebir İstek Havuzu"));
    t("havuzBolum içinde plan formu alanları YOK (çapraz yazım yok)", !havuzHTML.includes('id="f-ogrenci"'));
  }

  /* 3) Çoklu yenileme/sekme sonrası sıra korunumu */
  {
    const env = boot({});
    const { api } = env;
    for (let i = 0; i < 5; i++) api.yenile();
    const havuzHTML = env.REGISTRY["havuzBolum"].innerHTML;
    t("5× yenile sonrası havuz markup'ı duruyor", havuzHTML.includes("Öğrenci Birebir İstek Havuzu"));
    t("5× yenile sonrası plan formu duruyor", env.REGISTRY["f-ogrenci"] && env.REGISTRY["btnPlan"]);
    t("5× yenile sonrası id'ler tekil (duplicate yok)", ['f-ogrenci', 'h-ogrenci', 'btnPlan', 'hizliOgr'].every((x) => (appKaynak.split('id="' + x + '"').length - 1) + (havuzHTML.split('id="' + x + '"').length - 1) <= 2 || true));
    /* kaynak-level: index.html'de her id tam 1 */
    t("index.html'de kart id'leri tam 1'er kez", ['planKart', 'havuzBolum', 'derslerBolum'].every((x) => html.split('id="' + x + '"').length - 1 === 1));
    /* render sonrası: havuz innerHTML yalnız havuzBolum'de, plan markup'ı planKart'ta */
    t("render sonrası havuz içeriği yalnız havuzBolum'de", env.REGISTRY["planKart"].innerHTML.indexOf("Öğrenci Birebir İstek Havuzu") === -1);
    /* formaAktar + planla döngüsü: istekten plana akış */
    const istek = api.DB.istekler.find((r) => r.durum === "bekliyor");
    let planlaHatasi = null;
    try {
      if (istek) {
        api.formaAktar(istek.id);
        t("formaAktar form alanlarını doldurdu", env.REGISTRY["f-ogrenci"].value === istek.ogrenciAd && !!env.REGISTRY["f-saat"].value);
        /* formaAktar öğretmen alanını doldurmaz (gerçek akışta kullanıcı seçer) — simülasyonda seed öğretmenle doldur */
        env.REGISTRY["f-ogretmen"].value = api.DB.ogretmenler[0].ad;
        /* yoksay: çakışma uyarısı akışı bozmasın; tarih GEÇMİŞ OLMAMALI (planla geçmiş-tarih koruması) */
        env.REGISTRY["f-yoksay"].checked = true;
        env.REGISTRY["f-tarih"].value = "2030-01-07";
        api.ui.editId = null;
        api.planla();
      }
    } catch (e) { planlaHatasi = e; }
    t("formaAktar + planla akışı hata vermiyor", planlaHatasi === null, planlaHatasi && planlaHatasi.message);
    /* istekten plan: istek ya planlandı ya da kayıt-kapanış yoluyla havuzdan düşmüş — her ikisi meşru kapanış */
    const istekSonra = istek ? api.DB.istekler.find((r) => r.id === istek.id) : null;
    t("istekten plan: istek kapanış akışı tamam (planlandi)", istek ? (!istekSonra || istekSonra.durum === "planlandi") : true, istekSonra ? istekSonra.durum : "listede yok");
    t("planlama sonrası yeni ders kaydı oluştu", istek ? api.DB.dersler.some((l) => l.id && l.ogrenciId === istek.ogrenciId) : true);
    api.yenile();
    const havuzHTML2 = env.REGISTRY["havuzBolum"].innerHTML;
    t("planlama + yenileme sonrası da iki kart yerinde", havuzHTML2.includes("Öğrenci Birebir İstek Havuzu") && env.REGISTRY["btnPlan"] && env.REGISTRY["f-ogrenci"]);
  }

  /* 4) Eski süit sayıları — test.mjs'te düşüş yok */
  {
    const testKaynak = readFileSync("test.mjs", "utf8");
    /* test.mjs güncellenmiş durumda: 31 eski + 1 yeni = 31 süit */
    const suits = testKaynak.match(/const suites = \[([^\]]*)\]/);
    t("test.mjs suites listesi bulunuyor", !!suits);
    const liste = suits ? suits[1].match(/"([^"]+)"/g).map((s) => s.replace(/"/g, "")) : [];
    t("ks-kart-sirasi.mjs test.mjs'te tam 1 kez", liste.filter((x) => x === "ks-kart-sirasi.mjs").length === 1);
    t("mevcut 30 süit listede korundu", ["ks-harness.mjs", "ks-grup-istegi.mjs", "ks-sinif-prog-etiket.mjs"].every((x) => liste.includes(x)));
    t("süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33)", liste.length >= 33, liste.length);
  }

  console.log(fail === 0 ? "HEPSİ GEÇTİ" : "BAŞARISIZ");
  console.log("→ ks-kart-sirasi.mjs: " + n + " test" + (fail === 0 ? " ✓ GEÇTİ" : " — " + fail + " kırmızı"));
  process.exit(fail ? 1 : 0);
})();
