/* ks-tani-id.mjs — geçici tanı: hangi id'ler nereden geliyor? */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
global.document = { getElementById: () => elStub(), addEventListener() {}, removeEventListener() {}, createElement: () => elStub(), body: { appendChild() {}, removeChild() {} }, querySelectorAll: () => [] };
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

const EXPORTS = "{ DB, ui, istekGrupPanelAc, grupPanelSec, istekGrupUyeleri, istekGrupEkle, uid }";
let P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
const { DB, ui, istekGrupPanelAc, grupPanelSec, istekGrupUyeleri, istekGrupEkle, uid } = P;

const ayse = DB.ogrenciler.find(o => o.ad === "Ayşe Demir");
const zeynep = DB.ogrenciler.find(o => o.ad === "Zeynep Kaya");
const emir = DB.ogrenciler.find(o => o.ad === "Emir Aydın");
console.log("const referans id'leri:", JSON.stringify([ayse.id, zeynep.id, emir.id]));
console.log("uid() örnekleri:", JSON.stringify([uid(), uid(), uid()]));

istekGrupPanelAc();
grupPanelSec(ayse.id); grupPanelSec(zeynep.id); grupPanelSec(emir.id);
console.log("seçim sonrası istekGrupUyeleri():", JSON.stringify(istekGrupUyeleri()));
console.log("uyeler === const id'ler mi?", JSON.stringify(istekGrupUyeleri()) === JSON.stringify([ayse.id, zeynep.id, emir.id]));

const once = DB.istekler.length;
DB.istekler.push({ id: "tanı-istek", ogrenciId: zeynep.id, ogrenciAd: zeynep.ad, dersId: "mat", konu: "t", durum: "bekliyor", olusturma: "2026-09-12" });
istekGrupEkle();
const kayit = DB.istekler[DB.istekler.length - 1];
console.log("istekGrupEkle kayıt etti mi?", DB.istekler.length === once + 1);
console.log("kayıt id'leri:", JSON.stringify([kayit.ogrenciId, ...(kayit.ogrenciIds || [])]));
console.log("h-ders var mı/value:", typeof ui, "— kayıt.dersId =", kayit.dersId);
