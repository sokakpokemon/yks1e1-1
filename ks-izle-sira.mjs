/* ks-izle-sira.mjs — TANI: havuz bağlamında grupPanelSec sıra davranışı (salt-okunur) */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
const store = {}, reg = {};
const el = (id) => { if (reg[id]) return reg[id]; const e = { id, textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; }, appendChild() {}, remove() {}, click() {}, focus() {}, addEventListener() {}, scrollIntoView() {}, querySelectorAll: () => [], getContext: () => null }; let _html = ""; Object.defineProperty(e, "innerHTML", { get() { return _html; }, set(v) { _html = String(v); [..._html.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); } }); reg[id] = e; return e; };
for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
global.document = { getElementById: i => reg[i] || null, addEventListener() {}, removeEventListener() {}, createElement: () => el("anon" + Math.random()), body: { appendChild() {}, removeChild() {} }, querySelectorAll() { return []; } };
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
let P;
try { P = new Function(scripts + "\n  return { DB, ui, istekGrupPanelAc, grupPanelSec, istekGrupUyeleri, istekGrupEkle, istekOgrenciIds, grupPanelToggle, grupPanelListeCiz };\n")(); } catch (e) { console.log("BOOT HATASI:", e.stack.split("\n").slice(0, 4).join("\n")); process.exit(1); }
const { DB, ui, istekGrupPanelAc, grupPanelSec, istekGrupUyeleri, istekOgrenciIds, grupPanelToggle, grupPanelListeCiz } = P;
const kim = id => { const o = DB.ogrenciler.find(x => x.id === id); return o ? o.ad.split(" ")[0] : "?"; };
const zeynep = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya");
const emir = DB.ogrenciler.find(o => o.ad === "Emir Aydın");

console.log("--- A) remove→re-add sıra davranışı ---");
istekGrupPanelAc();
grupPanelSec(zeynep.id);
grupPanelSec(emir.id);
console.log("iki seçim:", istekGrupUyeleri().length, "sira:", JSON.stringify(ui.grupPanelSira.map(kim)), "ana:", kim(ui.havuzAnaId));
grupPanelSec(zeynep.id);
console.log("çıkarma → sira:", JSON.stringify(ui.grupPanelSira.map(kim)), "ana:", kim(ui.havuzAnaId), "ekler:", JSON.stringify(ui.ekOgrenciIds.map(kim)));
grupPanelSec(zeynep.id);
console.log("yeniden ekleme → sira:", JSON.stringify(ui.grupPanelSira.map(kim)), "ana:", kim(ui.havuzAnaId), "ekler:", JSON.stringify(ui.ekOgrenciIds.map(kim)));
console.log("TEST BEKLENTİSİ: yeniden ekleme sonrası ekler = [zeynep, emir] (ilk-seçim sırası korunur)");

console.log("--- B) grup-panel-govde markup: liste çizimi govde içinde mi ---");
reg["grup-panel-govde"].innerHTML = "";
grupPanelToggle(); /* paneli aç */
console.log("govde innerHTML 'Ana' içeriyor mu:", reg["grup-panel-govde"].innerHTML.includes("Ana"));
console.log("govde innerHTML 'checked' içeriyor mu:", reg["grup-panel-govde"].innerHTML.includes("checked"));
console.log("liste el kayıtlı mı:", !!reg["grup-panel-liste"], "liste innerHTML uzunluğu:", (reg["grup-panel-liste"] || { innerHTML: "" }).innerHTML.length);
grupPanelListeCiz();
console.log("listeCiz sonrası govde 'Ana':", reg["grup-panel-govde"].innerHTML.includes("Ana"), "| 'checked':", reg["grup-panel-govde"].innerHTML.includes("checked"));
console.log("liste innerHTML 'Zeynep':", (reg["grup-panel-liste"] || { innerHTML: "" }).innerHTML.includes("Zeynep"));
