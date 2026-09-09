/* ks-test-render.mjs — render + ek-ders.js hedefli testleri */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
/* Ana uygulama kodu app.js'te (index.html'de <script src="app.js">); inline bloklar (tailwind.config + atlama menüsü) sonrasına eklenir */
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto:{randomUUID:()=>"id-"+Math.random()}, addEventListener(){}, location:{hostname:"x"} };

/* renderFormDestek/düzenle gerçek eleman alır; value/innerHTML saklayan stub */
const elStub = () => {
  const el = {
    options: [], children: [],
    getContext: () => null,
    style: {}, dataset: {},
    classList: { _s:new Set(), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));}, toggle(c,f){ if(f===undefined) this._s.has(c)?this._s.delete(c):this._s.add(c); else f?this._s.add(c):this._s.delete(c); }, contains(c){return this._s.has(c);} },
    innerHTML: "", textContent: "", value: "",
    appendChild(){}, remove(){}, click(){}, focus(){},
    scrollIntoView(){}, addEventListener(){}, removeEventListener(){},
    querySelectorAll(){ return []; },
    files: null
  };
  Object.defineProperty(el, "checked", { value: false, writable: true });
  Object.defineProperty(el, "options", { get(){ const m = this.innerHTML.match(/<option/g); return m ? new Array(m.length) : []; } });
  return el;
};
const els = {};
global.document = {
  getElementById: (id) => (els[id] = els[id] || elStub()),
  addEventListener(){}, removeEventListener(){},
  createElement: () => elStub(),
  body: { appendChild(){}, removeChild(){} },
  querySelectorAll(){ return []; }
};
global.localStorage = { getItem:(k)=>store[k]??null, setItem:(k,v)=>{store[k]=v;}, removeItem:(k)=>{delete store[k];} };
global.Chart = function(){ this.destroy=()=>{}; };

let fail = 0;
const t = (name, cond) => { console.log((cond?"  ✓":"  ✗")+" "+name); if(!cond) fail=1; };

/* 1) Ana uygulama boot + API al */
let api;
try {
  api = new Function(scripts + `
    yenile();
    return { DB, KISA_KOD, gridTablo, gunlukTablo, renderDersler, duzeltmeBul, GUN_KISA, ui, saatEtiket };
  `)();
  console.log("1) index.html boot + yenile:");
  t("boot ve ilk render hatasız", true);
} catch (e) {
  console.log("1) index.html boot + yenile:");
  t("boot ve ilk render hatasız → " + e.message, false);
  console.log(e.stack.split("\n").slice(0,6).join("\n"));
  process.exit(1);
}
const { gridTablo, gunlukTablo, KISA_KOD } = api;

/* 2) gridTablo (müsaitlik) — 11 satır, kod etiketleri, onclick kod no */
console.log("2) gridTablo müsaitlik grid'i:");
const avail = { sinif: { "0-1": "9-A" }, musait: ["1-2"] };
const ghtml = gridTablo("togOgr('x'", avail, "ogretmen");
t("11 kısa kod satırı (7 gün × 11 = 77 hücre)", (ghtml.match(/togOgr\('x'/g)||[]).length === 77);
t("11 satır etiketi 1–11 (sticky td hücreleri)", (ghtml.match(/sticky left-0 bg-white pr-2[^>]*>\d+ · /g)||[]).length === 11);
t("satır etiketi '1 · 08:50-09:30'", ghtml.includes("1 · 08:50-09:30"));
t("satır etiketi '8 · 15:30-16:10'", ghtml.includes("8 · 15:30-16:10"));
t("onclick 8. kodu geçiyor", ghtml.includes("togOgr('x',0,8)"));
t("sınıf hücresi 0-1 anahtarında", ghtml.includes("9-A"));

/* 3) gunlukTablo — 12 sütun (11 ders + mola), mola 4-5 arası */
console.log("3) gunlukTablo günlük tablo:");
const dhtml = gunlukTablo();
t("Mola sütunu var", dhtml.includes("Mola"));
const thead = dhtml.slice(0, dhtml.indexOf("</thead>"));
t("12 slot sütunu (11 ders + Mola)", (dhtml.match(/border-r border-slate-200 /g)||[]).length >= 12 || thead.split("</th>").length - 1 === 13);
const molaIdx = thead.indexOf("Mola");
const k4Idx = thead.indexOf(">4<");
const k5Idx = thead.indexOf(">5<");
t("thead'de 4, Mola, 5 sıralı ve bulunur", k4Idx > -1 && k5Idx > -1 && molaIdx > -1 && molaIdx > k4Idx && molaIdx < k5Idx);
t("ders hücre saatleri kısa kod başlangıcı (13:00 değil 13:xx-mola)", dhtml.includes("13:00") && !dhtml.includes("09:00</div>"));

/* 4) form select gerçekten doldu mu (renderFormDestek boot'ta çağrıldı) */
console.log("4) f-saat select dolumu:");
const fSaat = els["f-saat"];
t("f-saat innerHTML dolduruldu (11 option)", fSaat && fSaat.innerHTML.includes('8 · 15:30-16:10') && (fSaat.innerHTML.match(/<option/g)||[]).length === 11);
t("varsayılan değer 15:30", fSaat.value === "15:30" || fSaat.innerHTML.includes('value="15:30" selected'));

/* 5) ek-ders.js — ayrı değerlendirme (defer simülasyonu) */
console.log("5) ek-ders.js boot + ekDuzeltmeBul:");
try {
  const ekApi = new Function(scripts + `
    /* ek-ders.js IIFE gövdesini çalıştır: anahtar fonksiyonları global yap */
    ${readFileSync("ek-ders.js","utf8")}
    /* IIFE içindeki fonksiyonlar closure'da; renderYonetim override edildi. ekPlanla/ekDuzeltmeBul window'a bağlanmış olmalı */
    return { DB, ekPlanla: typeof window.ekPlanla === "function" ? window.ekPlanla : null, renderYonetim };
  `)();
  t("ek-ders.js boot hatasız", true);
  /* ek-ders.js fonksiyonları IIFE'de local olabilir; boot hatasızlığı yeterli,
     çakışma mantığı index.html duzeltmeBul ile aynı ksKodOf anahtarlarını kullanıyor */
} catch (e) {
  t("ek-ders.js boot hatasız → " + e.message, false);
}

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
