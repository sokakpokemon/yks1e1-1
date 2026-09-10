/* ks-teshis-runtime.mjs — TEŞHİS (app.js değişmez)
 * Gerçek tarayıcı semantiği: getElementById bilinmeyen id için NULL döner;
 * insertAdjacentHTML panel markup'ındaki id'leri gerçekten DOM'a kaydeder.
 */
import { readFileSync } from "node:fs";

const src = readFileSync("app.js", "utf8");
const html = readFileSync("index.html", "utf8");

/* --- Gerçekçi element: innerHTML/options/insertAdjacentHTML çalışır --- */
const reg = {}; // id -> element
function el(id) {
  return {
    id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {},
    options: { get length() { return (this.__owner.innerHTML.match(/<option/g) || []).length; } },
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    insertAdjacentHTML(_pos, h) { // panel markup'ındaki id'leri kaydet (gerçek DOM davranışı)
      const ids = [...h.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
      ids.forEach(i => { if (!reg[i]) reg[i] = el(i); });
    },
    appendChild(){}, remove(){}, click(){}, focus(){}, addEventListener(){},
    querySelectorAll(){ return []; }, getContext(){ return null; },
  };
}
/* index.html'deki statik id'leri kaydet (tarayıcı parse'ı gibi) */
for (const m of html.matchAll(/id="([^"]+)"/g)) reg[m[1]] = reg[m[1]] || el(m[1]);

global.document = { getElementById: (i) => reg[i] || null }; // BİLİNMEYEN = NULL
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener(){}, location: { hostname: "x" } };
global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
global.Chart = function(){ this.destroy = () => {}; };
globalThis.tailwind = {};

const scripts = src + "\n;\n" + [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n;\n");

/* --- BOOT: index.html'deki gibi app.js top-level + ilk renderFormDestek --- */
let bootErr = null;
try { new Function(scripts + "\nyenile();")(); }
catch (e) { bootErr = e; }

console.log("=== BOOT (gerçekçi DOM, bilinmeyen id => null) ===");
if (!bootErr) console.log("boot hatasız (beklenmedik!)");
else {
  console.log("HATA: " + bootErr.message);
  console.log("stack ilk satırlar:\n" + bootErr.stack.split("\n").slice(1, 4).join("\n"));
}

/* --- Adım adım izolasyon: hangi satır çöküyor? --- */
console.log("\n=== ADIM ADIM (renderFormDestek parçaları, ilk çağrı semantiği) ===");
const DBu = (() => { try { return new Function(scripts + "\nreturn DB;")(); } catch { return null; } })();
const ui = (() => { try { return new Function(scripts + "\nreturn ui;")(); } catch { return null; } })();
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const step = (ad, fn) => { try { fn(); console.log("  OK   " + ad); } catch (e) { console.log("  COKTU " + ad + "  → " + e.message); } };

/* statik elementler yeni sandbox'ta da var; ek-ogrenci-* YOK (ilk çağrı) */
const sandbox = () => {
  const r = {};
  for (const m of html.matchAll(/id="([^"]+)"/g)) r[m[1]] = el(m[1]);
  global.document = { getElementById: (i) => r[i] || null };
  return r;
};
sandbox();
/* S2 — chip doldurma bloğu (app.js 1306–1318 karşılığı, DB/ui gerçek) */
const chipBlock = `
  if (!ui.ekOgrenciIds) ui.ekOgrenciIds = [];
  var EK_OGR_MAX = 5;
  ui.ekOgrenciIds = ui.ekOgrenciIds.filter(function (oid) { return DB.ogrenciler.some(function (x) { return x.id === oid; }); });
  var ekChips = ui.ekOgrenciIds.map(function (oid) {
    var o = DB.ogrenciler.find(function (x) { return x.id === oid; });
    return '<span>' + esc(o ? o.ad : "?") + '</span>';
  }).join("");
  if (!ui.ekOgrenciIds.length) ekChips = '<span>bos</span>';
  $("ek-ogrenci-chips").innerHTML = ekChips;
  $("ek-ogrenci-sayac").textContent = ui.ekOgrenciIds.length + " / " + EK_OGR_MAX;
`;
const pre = "const $ = (i) => document.getElementById(i);\n" + (DBu ? "var DB = " + JSON.stringify(DBu) + ";\n" : "") + "var ui = " + JSON.stringify({ ekOgrenciIds: null }) + ";\n";
step("S2: chip doldurma (1317: $(\"ek-ogrenci-chips\").innerHTML)", () => { new Function("document", "esc", pre + chipBlock)(global.document, esc); });

/* S9 — panel ekleme + SONRA tekrar S2 (2. çağrı semantiği) */
sandbox();
step("S9: panel insertAdjacentHTML (guard'lı)", () => {
  global.document.getElementById("hizliOgr").insertAdjacentHTML("afterend",
    '<div id="ek-ogrenciler"><div id="ek-ogrenci-chips"></div><span id="ek-ogrenci-sayac"></span><input id="ek-ogrenci-arama"/></div>');
});
const r2 = global.document;
step("S2-TEKRAR: chip doldurma (panel DOM'da, 2. çağrı)", () => { new Function("document", "esc", "var $=(i)=>document.getElementById(i);" + pre.replace("ui.ekOgrenciIds", "ui.ekOgrenciIds") + chipBlock)(r2, esc); });

/* --- Satır haritası --- */
console.log("\n=== SATIR HARİTASI (app.js) ===");
[1306, 1310, 1317, 1318, 1342, 1354].forEach(n => {
  const l = src.split("\n")[n - 1];
  console.log("  " + n + ": " + (l || "").trim().slice(0, 90));
});
console.log("\nPanel markup'ında id'ler: " + [...src.split("\n")[1341].matchAll(/id="([^"]+)"/g)].map(m => m[1]).join(", "));
