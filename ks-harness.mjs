/* Logic harness: kısa kod v2 kuralları (index.html'den koparılmış sahte DOM ile) */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("\n;\n");

/* Sahte DOM */
const store = {};
globalThis.tailwind = {};
global.window = { crypto:{randomUUID:()=>"id-"+Math.random()}, addEventListener(){}, location:{hostname:"x"} };
const elStub = () => ({ options: [], getContext: () => null, style:{}, classList:{add(){},remove(){},toggle(){}}, innerHTML:"", textContent:"", value:"", appendChild(){}, remove(){}, click(){}, scrollIntoView(){}, addEventListener(){}, dataset:{}, querySelectorAll: () => [] });
global.document = {
  getElementById: () => elStub(),
  addEventListener(){}, removeEventListener(){},
  createElement: () => elStub(),
  body: { appendChild(){}, removeChild(){} },
  querySelectorAll: () => []
};
global.localStorage = { getItem:(k)=>store[k]??null, setItem:(k,v)=>{store[k]=v;}, removeItem:(k)=>{delete store[k];} };
global.Chart = function(){ this.destroy=()=>{}; };

try { new Function(scripts)(); } catch(e) { console.log("BOOT HATASI:", e.stack.split("\n").slice(0,6).join("\n")); process.exit(1); }

/* Değişkenler Function scope'unda kaldığı için tekrar değerlendir: return ile API al */
const fn = new Function(scripts + `
  return { KISA_KOD, DB, ksKodOf, saatEtiket, ksGec, ksVerGec, duzeltmeBul, normalize, ksSeceneklerHTML };
`);
const api = fn();
const { KISA_KOD, ksKodOf, saatEtiket, normalize, ksSeceneklerHTML } = api;

let fail = 0;
const t = (name, cond) => { console.log((cond?"  ✓":"  ✗")+" "+name); if(!cond) fail=1; };

console.log("1) ksKodOf aralık kuralı:");
t("08:50 → 1", ksKodOf("08:50")==="1");
t("15:30 → 8", ksKodOf("15:30")==="8");
t("16:00 → 8 (aralık kuralı)", ksKodOf("16:00")==="8");
t("12:00 → '' (mola)", ksKodOf("12:00")==="");
t("13:00 → 5", ksKodOf("13:00")==="5");
t("11:30 → 4 (aralık)", ksKodOf("11:30")==="4");
t("18:20 → 11", ksKodOf("18:20")==="11");
t("19:00 → '' (kapanış sonrası)", ksKodOf("19:00")==="");

console.log("2) saatEtiket:");
t("16:00 → '8 · 15:30-16:10'", saatEtiket("16:00")==="8 · 15:30-16:10");
t("15:30 → '8 · 15:30-16:10'", saatEtiket("15:30")==="8 · 15:30-16:10");
t("10:00 → '2 · 09:40-10:20'", saatEtiket("10:00")==="2 · 09:40-10:20");

console.log("3) normalize bozuk veri:");
const nv = normalize({ ogretmenler:[{id:"a",ad:"A",avail:{sinif:["0-9"],musait:["1-10"]}}], ogrenciler:[], istekler:[], dersler:[], sinifProg:{} });
t("sinif array → obje", typeof nv.ogretmenler[0].avail.sinif==="object" && nv.ogretmenler[0].avail.sinif["0-9"]==="Sınıf Dersi");

console.log("4) ksSeceneklerHTML:");
const ops = ksSeceneklerHTML("15:30");
t("11 seçenek", (ops.match(/<option/g)||[]).length===11);
t("8 · 15:30-16:10 seçili", ops.includes('>8 · 15:30-16:10</option>') && ops.includes('value="15:30" selected'));
t("Mola yok", !ops.includes("Mola"));

console.log("5) DB kurulum + ksGec:");
const DB2 = api.DB;
t("DB yüklü", Array.isArray(DB2.dersler) && DB2.dersler.length>0);
t("ksVer=2", DB2.ksVer===2);
t("tüm derslerde kod var", DB2.dersler.every(l=>!!l.kod));
const saatler = [...new Set(DB2.dersler.map(l=>l.saat))];
t("saatler kısa kod başlangıçları", saatler.every(s=>KISA_KOD.some(k=>k.b===s)));
const soner = DB2.ogretmenler.find(x=>x.ad.includes("SONER"));
t("müsaitlik anahtarları kısa kod (X-9/X-10 yok)", soner.avail.musait.every(k=>{const p=k.split("-");return KISA_KOD.some(x=>x.no===p[1]);}));
t("sinif sinif anahtarları kısa kod", Object.keys(soner.avail.sinif).every(k=>{const p=k.split("-");return KISA_KOD.some(x=>x.no===p[1]);}));
const sp = DB2.sinifProg["MEZUN SAY 1"];
t("sınıfProg anahtarları kısa kod", sp.every(k=>{const p=k.split("-");return KISA_KOD.some(x=>x.no===p[1]);}));

console.log("6) duzeltmeBul çakışma (aynı gün+kod):");
const l0 = DB2.dersler[0];
const ogrt = DB2.ogretmenler.find(x=>x.id===l0.ogretmenId);
const u = api.duzeltmeBul({ ogrenciId:l0.ogrenciId, ogretmenId:ogrt.id, tarih:l0.tarih, saat:l0.saat, id:"yeni" });
t("aynı gün+saatte çakışma uyarısı", u.length>0 && u.join(" ").includes(ogrt.ad));
t("mesaj tanımsız/NaN içermiyor", u.join(" ").indexOf("undefined")<0 && u.join(" ").indexOf("NaN")<0);

console.log("7) yedek yükleme → normalize + ksGec eski veri:");
const eski = {
  ogretmenler: [{ id:"t1", ad:"TEST Ö", brans:"mat", avail:{ sinif:{"0-9":"9-A"}, musait:["1-10","5-9"] } }],
  ogrenciler: [],
  istekler: [],
  dersler: [
    { id:"d1", ogrenciAd:"Ali", dersId:"mat", ogretmenAd:"TEST Ö", tarih:"2030-01-07", saat:"16:00", durum:"planlandi" },
    { id:"d2", ogrenciAd:"Veli", dersId:"mat", ogretmenAd:"TEST Ö", tarih:"2030-01-07", saat:"16:20", durum:"planlandi" },
    { id:"d3", ogrenciAd:"Ayşe", dersId:"mat", ogretmenAd:"TEST Ö", tarih:"2030-01-07", saat:"12:30", durum:"planlandi" }
  ],
  sinifProg: { "9-A": ["0-9","3-10"] }
};
const n2 = normalize(JSON.parse(JSON.stringify(eski)));
/* ksGec'i izole çalıştırmak için DB'yi geçici değiştir */
const __oldDB = api.DB;
/* api.DB const — ksGec closure DB'yi kullanır; ayrı Function değerlendirmesi ile simüle */
const gecFn = new Function(scripts + `
  DB = normalize(${JSON.stringify(eski)});
  var rapor = ksGec();
  return { rapor, DB, ksKodOf };
`);
const g = gecFn();
t("16:00 → kod 8 taşındı", g.DB.dersler.find(d=>d.id==="d1").kod==="8" && g.DB.dersler.find(d=>d.id==="d1").saat==="15:30");
t("16:20 → kod 9 taşındı", g.DB.dersler.find(d=>d.id==="d2").kod==="9" && g.DB.dersler.find(d=>d.id==="d2").saat==="16:20");
t("12:30 → belirsiz listelendi, dokunulmadı", g.rapor.belirsiz.some(b=>b.ad==="Ayşe" && b.saat==="12:30") && g.DB.dersler.find(d=>d.id==="d3").saat==="12:30" && !g.DB.dersler.find(d=>d.id==="d3").kod);
t("taşınan sayısı = 2", g.rapor.tasinan===2);
t("avail sinif 0-9 → 0-1", g.DB.ogretmenler[0].avail.sinif["0-1"]==="9-A");
t("musait 5-9 → 5-1", g.DB.ogretmenler[0].avail.musait.includes("5-1"));
t("musait 1-10 → 1-2", g.DB.ogretmenler[0].avail.musait.includes("1-2"));
t("sinifProg 3-10 → 3-2", g.DB.sinifProg["9-A"].includes("3-2"));
t("ksVer bayrağı 2", g.DB.ksVer===2);

/* aynı veriyle ikinci ksGec: kod'lu dersler dokunulmamalı, çift taşınma olmamalı */
const g2fn = new Function(scripts + `
  var varsa = normalize(${JSON.stringify(eski)});
  DB = varsa; /* yeniden atama: boot'taki DB'yi test verisiyle değiştir */
  ksGec();
  var ilk = JSON.parse(JSON.stringify(DB.dersler.find(d=>d.id==="d1")));
  ksGec();
  var son = DB.dersler.find(d=>d.id==="d1");
  return { ilk: ilk, son: son, guncel: typeof DB !== "undefined" ? DB.dersler.filter(d=>d.id==="d1").length : -1 };
`);
const g2 = g2fn();
console.log("  (d1 örnek sayısı: " + g2.guncel + ")");
t("çift ksGec idempotent (kod sabit kalır)", g2.ilk.saat==="15:30" && g2.ilk.kod==="8" && g2.son.saat==="15:30" && g2.son.kod==="8");

console.log(fail? "BAŞARISIZ":"HEPSİ GEÇTİ");
process.exit(fail);
