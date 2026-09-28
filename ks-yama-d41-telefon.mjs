/* ks-yama-d41-telefon.mjs — D41-TELEFON yaması (İDEMPOTENT · TEK yama dosyası).
   HEDEF (kanıtlı eksik): WhatsApp alıcı listesinde (waAc) TELEFONSUZ kişi AÇIKÇA işaretlenmiyor
   ve Gönder butonu hep aktif. Düzeltme: satır TEK üreticiden (waAliciSatirHTML); telefonsuzsatırda
   "Telefon kayıtlı değil" rozeti + Gönder `disabled` (yalnız O kişinin gönderimi kapanır,
   DİĞER satırlara gönderim SÜRER). waGonder yolu DEĞİŞMEZ; grup üyeleri/sayaçlar/mesaj şablonu DEĞİŞMEZ.

   DOKUNULMAZ: ek-ders.js · grupUyeYaz · ders sayımı · iptal filtresi · WA şablonu · damga BİÇİMİ ·
   PNG/kart · drag/drop. Yalnız app.js satır markup'ı + index.html/dist/isolate app.js damgası.

   İdempotent: marker (D41-TELEFON) zaten varsa hiçbir şeye dokunmaz ve exit 0. */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const KOPYALAR = ["public/app.js", "dist/app.js", "isolate/app.js"]; /* kök app.js ile byte-birebir */
const DAMGALAR = ["index.html", "dist/index.html", "isolate/index.html"];
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const sha16 = (s) => sha256(s).slice(0, 16);

if (readFileSync(APP, "utf8").includes("D41-TELEFON")) {
  console.log("Zaten uygulanmış (D41-TELEFON) — hiçbir şeye dokunulmadı.");
  process.exit(0);
}

let src = readFileSync(APP, "utf8");
console.log("=== D41-TELEFON · yedekten ÖNCE ===");
console.log("  app.js  " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src) + " · sha16=" + sha16(src));

/* ---- Yedek (yalnız bir kez) ---- */
const yedek = "app.js.d41-telefon-oncesi.bak";
if (!existsSync(yedek)) { copyFileSync(APP, yedek); console.log("Yedek alındı: " + yedek); }
else console.log("Yedek zaten var: " + yedek);

/* ---- (1) Satır üreticisini waAc ÖNÜNE ekle ---- */
const SATIR_URETICI = String.raw`/* D41-TELEFON: alıcı listesi satırı — TEK üretici (waAc bu satırı çağırır).
   telVar=false ise kişi TELEFONSUZ: satırda "Telefon kayıtlı değil" rozeti görünür ve
   Gönder butonu disabled olur (tarayıcı tıklamayı engeller) — yalnız O kişinin gönderimi
   kapanır, DİĞER satırlar etkilenmez. Buton waGonder'e bağlı kalır (markup tekilliği).
   Grup üyeleri/sayaçlar ile mesaj şablonu DEĞİŞMEZ; yalnız satır markup'ı. */
function waAliciSatirHTML(s, telVar) {
  return '<div class="flex items-center gap-3 rounded-xl border border-slate-100 hover:border-green-200 px-3.5 py-2.5 transition-colors" data-wa-satir="' + s.id + '">' +
    avatar(s.ad, 0) +
    '<div class="flex-1 min-w-0"><b class="text-[13px] text-slate-800 block truncate">' + esc(s.ad) + "</b>" +
    '<span class="text-[11px] text-slate-400 font-semibold">' + s.n + " ders · " + pencereAdi() + "</span>" +
    (telVar ? "" : '<span class="ml-2 text-[10.5px] font-bold text-rose-500">Telefon kayıtlı değil</span>') +
    "</div>" +
    (telVar
      ? '<button onclick="waGonder(\'' + s.id + '\')" class="rounded-full bg-green-500 hover:bg-green-600 text-white text-[11.5px] font-bold px-3.5 py-2 shadow-sm transition-colors"><i class="fa-brands fa-whatsapp mr-1"></i>Gönder</button>'
      : '<button onclick="waGonder(\'' + s.id + '\')" disabled title="' + esc(s.ad) + ' telefonu kayıtlı değil" class="rounded-full bg-slate-200 text-slate-400 cursor-not-allowed text-[11.5px] font-bold px-3.5 py-2"><i class="fa-brands fa-whatsapp mr-1"></i>Gönder</button>') +
    '<button onclick="waOnizle(\'' + s.id + '\')" title="Mesaj önizlemesi" class="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"><i class="fa-regular fa-eye text-[12px]"></i></button>' +
    '<button onclick="waKopyalaMesaj(\'' + s.id + '\')" title="Mesaj metnini kopyala" class="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-colors"><i class="fa-regular fa-copy text-[12px]"></i></button></div>';
}

function waAc() {`;
const CAPA_A = "function waAc() {";
if (src.split(CAPA_A).length !== 2) { console.error("CAPA_A (function waAc) tek değil — DUR"); process.exit(1); }
src = src.replace(CAPA_A, SATIR_URETICI);

/* ---- (2) waAc içindeki satır markup'ını tek üretici çağrısıyla değiştir ---- */
const ESKI_RETURN = String.raw`      return '<div class="flex items-center gap-3 rounded-xl border border-slate-100 hover:border-green-200 px-3.5 py-2.5 transition-colors">' +
        avatar(s.ad, 0) +
        '<div class="flex-1 min-w-0"><b class="text-[13px] text-slate-800 block truncate">' + esc(s.ad) + "</b>" +
        '<span class="text-[11px] text-slate-400 font-semibold">' + s.n + " ders · " + pencereAdi() + "</span></div>" +
        '<button onclick="waGonder(\'' + s.id + '\')" class="rounded-full bg-green-500 hover:bg-green-600 text-white text-[11.5px] font-bold px-3.5 py-2 shadow-sm transition-colors"><i class="fa-brands fa-whatsapp mr-1"></i>Gönder</button>' +
        '<button onclick="waOnizle(\'' + s.id + '\')" title="Mesaj önizlemesi" class="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"><i class="fa-regular fa-eye text-[12px]"></i></button>' +
        '<button onclick="waKopyalaMesaj(\'' + s.id + '\')" title="Mesaj metnini kopyala" class="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-colors"><i class="fa-regular fa-copy text-[12px]"></i></button></div>';`;
const YENI_RETURN = `      return waAliciSatirHTML(s, !!tel); /* D41-TELEFON: telefonsuz üye → rozet + Gönder DEVRE DIŞI */`;
if (src.split(ESKI_RETURN).length !== 2) { console.error("ESKI_RETURN anchor tek değil — DUR"); process.exit(1); }
src = src.replace(ESKI_RETURN, YENI_RETURN);

writeFileSync(APP, src, "utf8");
console.log("=== D41-TELEFON · app.js yamadan SONRA ===");
console.log("  app.js  " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src) + " · sha16=" + sha16(src));

/* ---- (3) app.js damgasını index.html + dist + isolate'te tazele (biçim korunur: 16 hex) ---- */
const yeniDamga = sha16(src);
function damgaTazele(dosya) {
  if (!existsSync(dosya)) { console.log("damga: " + dosya + " YOK (atlandı)"); return; }
  let h = readFileSync(dosya, "utf8");
  const eski = (h.match(/app\.js\?v=([0-9a-f]{16})/) || [])[1];
  if (eski === undefined) { console.log("damga: " + dosya + " içinde app.js?v= yok (atlandı)"); return; }
  const n = (h.match(/app\.js\?v=[0-9a-f]{16}/g) || []).length;
  if (n !== 1) { console.error("damga sayısı " + dosya + " beklenen 1, bulunan " + n + " — DUR"); process.exit(1); }
  if (eski === yeniDamga) { console.log("damga zaten güncel: " + dosya + " → " + yeniDamga); return; }
  h = h.replace(/app\.js\?v=[0-9a-f]{16}/, "app.js?v=" + yeniDamga);
  writeFileSync(dosya, h, "utf8");
  console.log("damga tazelendi: " + dosya + " " + eski + " → " + yeniDamga);
}
for (const d of DAMGALAR) damgaTazele(d);

/* ---- (4) kök app.js → public/dist/isolate (byte-birebir) ---- */
for (const hedef of KOPYALAR) {
  if (!existsSync(hedef)) { console.log("senkron: " + hedef + " YOK (atlandı)"); continue; }
  copyFileSync(APP, hedef);
  const h = readFileSync(hedef, "utf8");
  console.log("senkron " + hedef.padEnd(16) + " sha16=" + sha16(h) + (sha256(h) === sha256(src) ? " ✓" : " ✗ FARK"));
}
console.log("D41-TELEFON yaması TAMAM. (ek-ders.js DEĞİŞMEDİ · grup/sayaç/şablon DOKUNULMADI · publish YOK)");
