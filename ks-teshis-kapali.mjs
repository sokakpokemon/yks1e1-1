/* ks-teshis-kapali.mjs — salt-okuma teshis: kapali hucre render/tiklama akisi */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => {
  const el = { options: [], children: [], getContext: () => null, style: {}, dataset: {}, classList: { _s: new Set(), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));}, toggle(){}, contains(){return false;} }, innerHTML: "", textContent: "", value: "", appendChild(){}, remove(){}, click(){}, focus(){}, scrollIntoView(){}, addEventListener(){}, removeEventListener(){}, querySelectorAll(){return [];}, files: null };
  Object.defineProperty(el, "checked", { value: false, writable: true });
  return el;
};
const els = {};
global.document = { getElementById: (id) => (els[id] = els[id] || elStub()), addEventListener(){}, removeEventListener(){}, createElement: () => elStub(), body: { appendChild(){}, removeChild(){} }, querySelectorAll() { return []; } };
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

const api = new Function(scripts + "\n;return { gridTablo, durumSec, togOgrSecili, togOgr, DB, ui, durumSeciciHTML, saveDB, yenile: () => {} };")();

// kapali hucre render
const grid = api.gridTablo("togOgrSecili('X'", { sinif: {}, musait: ["0-1"] }, "ogretmen");
const m = grid.match(/<td class="p-0\.5"><button class="([^"]*)" title="([^"]*)"[^>]*>([\s\S]*?)<\/button><\/td>/);
// butun butonlari tara ve key'e gore bul
const btnRe = /<td class="p-0\.5"><button class="([^"]*)" title="([^"]*)"[^>]*>((?:(?!<\/button>).)*)<\/button><\/td>/g;
let mm, found;
while ((mm = btnRe.exec(grid))) { if (mm[2].startsWith("Pazartesi 1 ·") && mm[2].includes("Kapalı")) { found = mm; break; } }
console.log("KAPALI HÜCRE class:", found && found[1]);
console.log("KAPALI HÜCRE title:", found && found[2]);
console.log("KAPALI HÜCRE içerik:", found && found[3]);
console.log("disabled var mı:", found && /disabled/.test(found[0]));
console.log("pointer-events var mı:", found && /pointer-events/.test(found[0]));
// bos hucre
let bos;
btnRe.lastIndex = 0;
while ((mm = btnRe.exec(grid))) { if (mm[2].includes("· Boş")) { bos = mm; break; } }
console.log("BOŞ HÜCRE class:", bos && bos[1], "| içerik:", JSON.stringify(bos && bos[3]));

// tiklama akisi
api.ui.seciliDurum = "kapali";
const ogr = api.DB.ogretmenler[0];
const before = ogr.avail.musait.slice();
api.togOgrSecili(ogr.id, 3, 6);
console.log("kapali tık sonrası musait içeriyor 3-6:", ogr.avail.musait.includes("3-6"), "| localStorage yazıldı:", !!store.yksOto_arsiv_v1);
// geri al
ogr.avail.musait = ogr.avail.musait.filter(k => k !== "3-6");
console.log("sinif durum tık çalışıyor mu (regresyon):", (() => { api.ui.seciliDurum = "sinif"; api.ui.seciliOgrId = "TEST SINIF"; api.togOgrSecili(ogr.id, 4, 6); const ok = ogr.avail.sinif["4-6"] === "TEST SINIF"; delete ogr.avail.sinif["4-6"]; api.ui.seciliDurum = null; return ok; })());
