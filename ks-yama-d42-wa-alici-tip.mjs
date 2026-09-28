/* ks-yama-d42-wa-alici-tip.mjs — D42-WA-ALICI-TIP yaması (İDEMPOTENT · TEK yama dosyası).
   D41 REGRESYON ONARIMI: D41 satır durumu yalnız öğrencinin `tel`ine bakıyordu → alıcı=Anne/Baba
   + veli teli VAR + öğrenci teli BOŞ iken satır YANLIŞLIKLA disabled oluyordu (meşru veli gönderimi engellenirdi).
   Düzeltme:
     (a) Satır durumu SEÇİLİ ALICIYA göre: waAliciSatirHTML(s, waAliciBilgisi(s.id, waAliciTipi).varMi)
         (anne→anneTel · baba→babaTel · tel — tek çözücü).
     (b) waAliciDegistir: alıcı tipini günceller + LİSTE KONTEYNERİNİ TEK KEZ yeniler
         (innerHTML) → rozet/disabled ANINDA güncel; modal YENİDEN AÇILMAZ; ÇİFT SATIR YOK;
         sayaç/seçim KORUNUR (dizi yeniden hesaplanmaz, waSonDizi'den çizilir).
     (c) TOPLU gönderim YOK (kişi-bazlı akış) → dokunulacak toplu yol yok.
   DOKUNULMAZ: waGonder çözücü yolu (!a.varMi → toast+return) · grup üyeleri + "N ders" sayaçları ·
   D25 şablonu · iptal filtresi · D29–D41 diğer akışları · damga BİÇİMİ. ek-ders.js DEĞİŞMEZ.

   İdempotent: marker (D42-WA-ALICI-TIP) varsa hiçbir şeye dokunmaz ve exit 0. */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const KOPYALAR = ["public/app.js", "dist/app.js", "isolate/app.js"];
const DAMGALAR = ["index.html", "dist/index.html", "isolate/index.html"];
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const sha16 = (s) => sha256(s).slice(0, 16);

if (readFileSync(APP, "utf8").includes("D42-WA-ALICI-TIP")) {
  console.log("Zaten uygulanmış (D42-WA-ALICI-TIP) — hiçbir şeye dokunulmadı.");
  process.exit(0);
}

let src = readFileSync(APP, "utf8");
console.log("=== D42-WA-ALICI-TIP · yedekten ÖNCE ===");
console.log("  app.js  " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src) + " · sha16=" + sha16(src));

const yedek = "app.js.d42-wa-alici-tip-oncesi.bak";
if (!existsSync(yedek)) { copyFileSync(APP, yedek); console.log("Yedek alındı: " + yedek); }
else console.log("Yedek zaten var: " + yedek);

/* ---- (a) waAliciListeHTML + waSonDizi + waAliciListeTazele (waAc ÖNÜNE) ---- */
const YENI_FONK = String.raw`/* D42-WA-ALICI-TIP: son çizilen alıcı listesi (alıcı değişince satırlar bu diziden YENİDEN çizilir;
   sayaç/ders listesi YENİDEN hesaplanmaz — "N ders" ve seçim korunur). */
var waSonDizi = [];

/* D42-WA-ALICI-TIP: satır gövdesi TEK üreticiden ve SEÇİLİ ALICIYA göre.
   Tek çözücü waAliciBilgisi(s.id, waAliciTipi): öğrenci→tel · anne→anneTel · baba→babaTel. */
function waAliciListeHTML(dizi) {
  if (!dizi.length) {
    return '<div class="text-center py-10"><p class="text-3xl mb-2">💬</p><p class="text-[13px] text-slate-400 font-medium">Bu dönemde bilgilendirme yapılacak ders yok.</p></div>';
  }
  var icerik = dizi.map(function (s) {
    return waAliciSatirHTML(s, waAliciBilgisi(s.id, waAliciTipi).varMi); /* seçili alıcı çözücüsü */
  }).join("");
  var telVarMi = dizi.some(function (x) { return waAliciBilgisi(x.id, waAliciTipi).varMi; });
  if (!telVarMi) icerik += '<p class="text-[10.5px] text-slate-300 mt-3 text-center">Seçili alıcı için telefon kaydedilmedi — WhatsApp’ta göndermek istediğiniz kişiyi seçersiniz. Telefon eklemek için Öğrenciler sekmesini kullanın.</p>';
  return icerik;
}

/* D42-WA-ALICI-TIP: yalnız LİSTE KONTEYNERİNİ yeniler (modal yeniden açılmaz; ÇİFT SATIR YOK).
   Sayaç/seçim KORUNUR: dizi (waSonDizi) yeniden hesaplanmaz; yalnız satır durumu tazelenir. */
function waAliciListeTazele() {
  var el = document.getElementById("waIcerik");
  if (!el) return;
  el.innerHTML = waAliciListeHTML(waSonDizi); /* TEK yenileme */
  if (el.insertAdjacentHTML) el.insertAdjacentHTML("afterbegin", waAliciSeciciHTML());
}

function waAc() {`;
const CAPA_FONK = "function waAc() {";
if (src.split(CAPA_FONK).length !== 2) { console.error("CAPA_FONK (function waAc) tek değil — DUR"); process.exit(1); }
src = src.replace(CAPA_FONK, YENI_FONK);

/* ---- (b) waAc gövdesi: icerik üretimi TEK üreticiye + alıcı sıfırlama ÖNE ---- */
const ESKI_WAAC = String.raw`  var icerik = "";
  if (!dizi.length) {
    icerik = '<div class="text-center py-10"><p class="text-3xl mb-2">💬</p><p class="text-[13px] text-slate-400 font-medium">Bu dönemde bilgilendirme yapılacak ders yok.</p></div>';
  } else {
    icerik = dizi.map(function (s) {
      var o = DB.ogrenciler.find(function (x) { return x.id === s.id; });
      var tel = o ? o.tel : "";
      return waAliciSatirHTML(s, !!tel); /* D41-TELEFON: telefonsuz üye → rozet + Gönder DEVRE DIŞI */
    }).join("");
    var telVarMi = dizi.some(function(x){ var o = DB.ogrenciler.find(function(y){return y.id===x.id;}); return o && o.tel; });
    if (!telVarMi) icerik += '<p class="text-[10.5px] text-slate-300 mt-3 text-center">Öğrenciye telefon kaydedilmedi — WhatsApp’ta göndermek istediğiniz kişiyi seçersiniz. Telefon eklemek için Öğrenciler sekmesini kullanın.</p>';
  }
  /* WA-ALICI-YAMASI: her açılışta alıcı varsayılan "ogrenci" (state yalnız bellek içi) */
  waAliciTipi = "ogrenci";
  waAktifOgrenciId = null;
  $("waIcerik").innerHTML = icerik;`;
const YENI_WAAC = String.raw`  /* WA-ALICI-YAMASI: her açılışta alıcı varsayılan "ogrenci"; D42: satır durumu bu alıcıya göre çizilir. */
  waAliciTipi = "ogrenci";
  waAktifOgrenciId = null;
  waSonDizi = dizi; /* D42-WA-ALICI-TIP: alıcı değişince satırlar bu diziden YENİDEN çizilir (sayaç korunur) */
  $("waIcerik").innerHTML = waAliciListeHTML(dizi); /* D42-WA-ALICI-TIP: satır TEK üreticiden + SEÇİLİ ALICIYA göre */`;
if (src.split(ESKI_WAAC).length !== 2) { console.error("ESKI_WAAC anchor tek değil — DUR"); process.exit(1); }
src = src.replace(ESKI_WAAC, YENI_WAAC);

/* ---- (b2) waAliciDegistir: liste konteynerini TEK kez yenile ---- */
const ESKI_DEG = String.raw`function waAliciDegistir(tip) {
  waAliciTipi = (tip === "anne" || tip === "baba") ? tip : "ogrenci";
  waAliciPanelGuncelle();
  if (waAktifOgrenciId) waOnizle(waAktifOgrenciId);
}`;
const YENI_DEG = String.raw`function waAliciDegistir(tip) {
  waAliciTipi = (tip === "anne" || tip === "baba") ? tip : "ogrenci";
  waAliciListeTazele(); /* D42-WA-ALICI-TIP: rozet + Gönder durumu ANINDA seçili alıcıya göre güncellenir */
  waAliciPanelGuncelle();
  if (waAktifOgrenciId) waOnizle(waAktifOgrenciId);
}`;
if (src.split(ESKI_DEG).length !== 2) { console.error("ESKI_DEG anchor tek değil — DUR"); process.exit(1); }
src = src.replace(ESKI_DEG, YENI_DEG);

writeFileSync(APP, src, "utf8");
console.log("=== D42-WA-ALICI-TIP · app.js yamadan SONRA ===");
console.log("  app.js  " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src) + " · sha16=" + sha16(src));

/* ---- damga (16 hex biçimi korunur) + kök→public/dist/isolate senkron ---- */
const yeniDamga = sha16(src);
for (const dosya of DAMGALAR) {
  if (!existsSync(dosya)) { console.log("damga: " + dosya + " YOK (atlandı)"); continue; }
  let h = readFileSync(dosya, "utf8");
  const eski = (h.match(/app\.js\?v=([0-9a-f]{16})/) || [])[1];
  if (eski === undefined) { console.log("damga: " + dosya + " içinde app.js?v= yok (atlandı)"); continue; }
  const n = (h.match(/app\.js\?v=[0-9a-f]{16}/g) || []).length;
  if (n !== 1) { console.error("damga sayısı " + dosya + " beklenen 1, bulunan " + n + " — DUR"); process.exit(1); }
  if (eski === yeniDamga) { console.log("damga zaten güncel: " + dosya); continue; }
  writeFileSync(dosya, h.replace(/app\.js\?v=[0-9a-f]{16}/, "app.js?v=" + yeniDamga), "utf8");
  console.log("damga tazelendi: " + dosya + " " + eski + " → " + yeniDamga);
}
for (const hedef of KOPYALAR) {
  if (!existsSync(hedef)) { console.log("senkron: " + hedef + " YOK (atlandı)"); continue; }
  copyFileSync(APP, hedef);
  console.log("senkron " + hedef.padEnd(16) + " sha16=" + sha16(readFileSync(hedef, "utf8")) + (sha256(readFileSync(hedef, "utf8")) === sha256(src) ? " ✓" : " ✗ FARK"));
}
console.log("D42-WA-ALICI-TIP yaması TAMAM. (ek-ders.js DEĞİŞMEDİ · grup/sayaç/şablon DOKUNULMADI · TOPLU gönderim YOK · publish YOK)");
