/* ks-yama-donem-secici-ui.mjs — DONEM-SECICI-UI-YAMASI (assert'li, hedefli, idempotent)
   TEK İŞ: ek-ders.js'in renderYonetim override'ı dönem seçici hostunu sildiği için
   (kök neden: index.html L7 defer ek-ders.js L413-431 yonetimBolum.innerHTML'i
   donemSecKutusuHTML() OLMADAN yeniden yazar) dönem kontrolünü kalıcı hosta taşır:
     1) donemSecKutusuHTML çıktısı sabit #donem-ui-host + #donem-secici + #yeni-donem-btn
        üretir (eski id'ler data-id uyumluluk takma adı olarak KORUNUR — mevcut süitlerin
        markup/registry assert'leri bozulmaz).
     2) donemHostOnar() + donemHostOnarZincir(): boot sonrası host silinmişse (ek-ders
        override'ı) kartın ÜSTÜNDEKİ kalıcı hostu TEK kez onarır; tekrarlı çağrı no-op.
   Yazma öncesi TÜM assert'ler koşar; tek assert bile düşerse dosya DEĞİŞMEZ.
   2. koşu: "Zaten uygulanmış" → exit 2, dosyaya dokunmaz. */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const DOSYA = "app.js";
const YEDEK = "app.js.donem-secici-oncesi.bak";
const sha = (s) => createHash("sha256").update(s).digest("hex");

let kod;
try { kod = readFileSync(DOSYA, "utf8"); } catch (e) { console.error("app.js okunamadı: " + e.message); process.exit(1); }
const ORIJINAL_SHA = sha(kod);
console.log("app.js SHA-256 (işlem öncesi): " + ORIJINAL_SHA);

/* ---- Beklenen ankrajlar (önceki dilimlerin damgaları + hedef bölge) ---- */
const ANKRAJLAR = [
  ["DONEM-OLUSTURMA-YAMASI (donemSecKutusuHTML)", "DONEM-OLUSTURMA-YAMASI: dönem seçicinin yanında"],
  ["DONEM-SECICI-V2 (renderYonetim gömülü)", "DONEM-SECICI-V2: dönem seçici yönetim kartının İÇİNE"],
  ["DONEM-YENI buton fonksiyonu", "function yeniDonemOlustur() {"],
  ["donemSec fonksiyonu", "function donemSec(id) {"],
  ["Başlangıç bloğu", '/* ---- Başlangıç ---- */\nrenderFormDestek();\nyenile();']
];
for (const [ad, ankraj] of ANKRAJLAR) {
  if (!kod.includes(ankraj)) { console.error(`ASSERT DÜŞTÜ: ankraj yok → ${ad}`); process.exit(1); }
}
console.log("✓ Beklenen ankrajlar mevcut (" + ANKRAJLAR.length + "/" + ANKRAJLAR.length + ")");

/* ---- Zaten uygulanmış mı? (idempotentlik: exit 2, dokunma) ---- */
if (kod.includes("DONEM-SECICI-UI-YAMASI")) {
  console.log("Zaten uygulanmış — DONEM-SECICI-UI-YAMASI mevcut; hiçbir dosyaya dokunulmadı.");
  const simdi = sha(readFileSync(DOSYA, "utf8"));
  console.log("app.js SHA-256 (işlem sonrası — DEĞİŞMEDİ): " + simdi + (simdi === ORIJINAL_SHA ? " (birebir aynı)" : " (UYARI: dış değişiklik!)"));
  if (existsSync(YEDEK)) console.log("Yedek mevcut: " + YEDEK + " (SHA-256 " + sha(readFileSync(YEDEK, "utf8")) + ")");
  process.exit(2);
}

/* ---- Eski bloklar tam olarak 1 kez bulunmalı ---- */
const ESKI1 = `  var yeniBtn = '<button id="donemYeniBtn" onclick="yeniDonemOlustur()" title="2027/2028 dönemini oluştur ve ona geç" class="rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 text-[11.5px] font-bold transition-colors whitespace-nowrap"><i class="fa-solid fa-plus mr-1"></i>Yeni Dönem Oluştur</button>';
  return '<div id="donemSeciciKutu" class="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">' +
    '<span class="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap"><i class="fa-solid fa-layer-group mr-1"></i>Dönem</span>' +
    '<select id="donemSecici" onchange="donemSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40 max-w-full">' + ops + "</select>" + yeniBtn +
    "</div>";`;
const ESKI2 = `/* ---- Başlangıç ---- */
renderFormDestek();
yenile();
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { onayKapat(); waKapat(); pngKapat(); }
});`;

const sayac = (metin, iğne) => metin.split(iğne).length - 1;
for (const [ad, blok] of [["ESKI-1 donemSecKutusuHTML dönüş bloğu", ESKI1], ["ESKI-2 Başlangıç bloğu", ESKI2]]) {
  const n = sayac(kod, blok);
  if (n !== 1) { console.error(`ASSERT DÜŞTÜ: ${ad} tam olarak 1 kez bulunmalı; bulunan: ${n}`); process.exit(1); }
}
console.log("✓ Hedef eski bloklar tam olarak 1'er kez bulundu");

/* ---- Yeni ID'ler kaynakta hiç yok olmalı (çakışma önleme) ---- */
for (const id of ['id="donem-ui-host"', 'id="donem-secici"', 'id="yeni-donem-btn"', "donemHostOnar"]) {
  if (kod.includes(id)) { console.error(`ASSERT DÜŞTÜ: yeni tanımlayıcı kaynakta zaten var → ${id}`); process.exit(1); }
}
console.log("✓ Yeni ID'ler (donem-ui-host / donem-secici / yeni-donem-btn) kaynakta yok — çakışma imkânsız");

/* ---- Eski davranış koruma assert'leri (dokunulmaması gerekenler) ---- */
const KORUNANLAR = [
  ["function planla(", 1], ["function istekEkle(", 1], ["function istekGrupEkle(", 1],
  ["function normalize(", 1], ["function yedekOku(", 1], ["function yedekAl(", 1],
  ["function aktifDonemKayitlari(", 1], ["function sinifProgDonemleriBaslat(", 1],
  ["function sinifProguDonemeBagla(", 1], ["function yeniDonemOlustur()", 1],
  ["function donemSecKutusuHTML()", 1], ["function renderYonetim()", 1], ["function yenile()", 1],
  ["function donemSec(id)", 1], ["function aktifDonemId()", 1]
];
for (const [ad, beklenen] of KORUNANLAR) {
  const n = sayac(kod, ad);
  if (n !== beklenen) { console.error(`ASSERT DÜŞTÜ: '${ad}' beklenen ${beklenen}, bulunan ${n}`); process.exit(1); }
}
console.log("✓ Eski davranış bloklarının tanım sayıları doğrulandı (" + KORUNANLAR.length + " sembol × 1)");

/* ---- YENİ BLOK 1: donemSecKutusuHTML — kalıcı host + sabit ID'ler + data-id takma adları ---- */
const YENI1 = `  var yeniBtn = '<button id="yeni-donem-btn" data-id="donemYeniBtn" onclick="yeniDonemOlustur()" title="2027/2028 dönemini oluştur ve ona geç" class="rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 text-[11.5px] font-bold transition-colors whitespace-nowrap"><i class="fa-solid fa-plus mr-1"></i>Yeni Dönem Oluştur</button>';
  /* DONEM-SECICI-UI-YAMASI: kalıcı host + sabit select/buton kimlikleri (eski id'ler
     data-id uyumluluk takma adı olarak korunur); kart İÇİNDEN ek-ders.js override'ı selse bile kartın
     ÜSTÜNDEKİ bu kalıcı host donemHostOnar() ile TEK kez geri getirilir. */
  return '<div id="donem-ui-host" class="no-print mb-3">' +
    '<div id="donemSeciciKutu" data-id="donemSeciciKutu" class="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">' +
    '<span class="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap"><i class="fa-solid fa-layer-group mr-1"></i>Dönem</span>' +
    '<select id="donem-secici" data-id="donemSecici" onchange="donemSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40 max-w-full">' + ops + "</select>" + yeniBtn +
    "</div></div>";`;

/* ---- YENİ BLOK 2: host onarım yardımcıları + Başlangıç'a bağlantı ---- */
const YENI2 = `/* ---- DONEM-SECICI-UI-YAMASI: kalıcı dönem kontrolü (host + onarım) ----
   Gerçek sayfada ek-ders.js (defer) renderYonetim'i 4 sekmeli sarmalayıcıyla ezer ve
   yonetimBolum.innerHTML'i donem-ui-host OLMADAN yeniden yazar. Bölüm düzeyinde selector
   yeniden eklemek ESKİ id çift kayıt regresyonu üretir; doğru katman kartın ÜSTÜNDEKİ
   kalıcı #donem-ui-host'tur (SALT anakart çocuğu — sarmalayıcı bu düzeye yazmaz). */
function donemHostOnar() {
  var anakart = (typeof document !== "undefined" && document.body) || (document && document.documentElement);
  if (!anakart) return;
  var el = null;
  try { el = document.getElementById("donem-ui-host"); } catch (e0) { return; }
  var domdaMi = false;
  try { domdaMi = !!anakart.querySelectorAll('[id="donem-ui-host"]').length; } catch (e1) {}
  if (!domdaMi && el) {
    var annenMarkup = "";
    try { annenMarkup = anakart.innerHTML || ""; } catch (e2) { annenMarkup = ""; }
    if (annenMarkup.indexOf('id="donem-ui-host"') === -1) domdaMi = true;
  }
  if (domdaMi) return; /* zaten DOM'da — tekrarlı çağrı no-op (duplicate üretmez) */
  if (el) { try { el.remove(); } catch (e3) {} el = null; }
  var kutu = null;
  try { kutu = (typeof donemSecKutusuHTML === "function") ? donemSecKutusuHTML() : null; } catch (e4) { kutu = null; }
  if (!kutu || !document.body) return;
  var host = document.createElement("div");
  host.id = "donem-ui-host";
  host.className = "no-print mb-3";
  host.innerHTML = kutu;
  try { document.body.insertBefore(host, document.body.firstChild); } catch (e5) { try { document.body.appendChild(host); } catch (e6) {} }
}
/* Zincirleme onarım: microtask (aynı tikte sonradan yazan render'dan SONRA koşar) + DOMContentLoaded
   safety-net (defer ek-ders.js'in ilk override'ı sonrası bir kez daha garanti eder). */
function donemHostOnarZincir() {
  try { Promise.resolve().then(donemHostOnar); } catch (e1) {}
  if (typeof document !== "undefined" && document.addEventListener) {
    if (document.readyState === "loading") { try { document.addEventListener("DOMContentLoaded", donemHostOnar); } catch (e2) {} }
    else { try { setTimeout(donemHostOnar, 0); } catch (e3) {} }
  }
}

/* ---- Başlangıç ---- */
renderFormDestek();
yenile();
donemHostOnarZincir();
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { onayKapat(); waKapat(); pngKapat(); }
});`;

/* ---- Yama uygula ---- */
const yamali = kod.replace(ESKI1, () => YENI1).replace(ESKI2, () => YENI2);

/* ---- Post-assert'ler (YAZMADAN ÖNCE) ---- */
const POST = [
  /* id="donem-ui-host": 1 markup (YENI1) + 2 bilinçli yardımcı referansı (querySelectorAll / indexOf) */
  ["yeni host id toplam (1 markup + 2 helper ref)", 'id="donem-ui-host"', 3],
  ["yeni select tam 1 kez", 'id="donem-secici"', 1],
  ["yeni buton tam 1 kez", 'id="yeni-donem-btn"', 1],
  /* eski kutu id: 1 gerçek markup + 1 data-id takma adı alt-dizisi */
  ["eski kutu id (markup + data-id alt-dizisi)", 'id="donemSeciciKutu"', 2],
  /* eski select id: yalnız data-id takma adı alt-dizisi (ks-donem-secici.mjs sayım sözleşmesi = 1) */
  ["eski select id (yalnız data-id alt-dizisi)", 'id="donemSecici"', 1],
  ["eski buton id (yalnız data-id alt-dizisi)", 'id="donemYeniBtn"', 1],
  ["data-id takma ad: kutu", 'data-id="donemSeciciKutu"', 1],
  ["data-id takma ad: select", 'data-id="donemSecici"', 1],
  ["data-id takma ad: buton", 'data-id="donemYeniBtn"', 1],
  ["onarım fonksiyonu", "function donemHostOnar()", 1],
  ["zincir fonksiyonu", "function donemHostOnarZincir()", 1],
  ["Başlangıç bağlantısı", "donemHostOnarZincir();", 1],
  ["yama damgası (YENI1 + YENI2 yorumları)", "DONEM-SECICI-UI-YAMASI", 2]
];
for (const [ad, iğne, beklenen] of POST) {
  const n = sayac(yamali, iğne);
  if (n !== beklenen) { console.error(`ASSERT DÜŞTÜ (post): ${ad} beklenen ${beklenen}, bulunan ${n}`); process.exit(1); }
}
console.log("✓ Post-assert'ler geçti (" + POST.length + " sayım)");

/* ---- Bölge dışı değişim kanıtı: yalnız iki hedef blok değişti ---- */
const idxA = kod.indexOf(ESKI1), idxB = kod.indexOf(ESKI2);
if (idxA === -1 || idxB === -1 || idxA >= idxB) { console.error("ASSERT DÜŞTÜ: hedef bloklar uygulanamadı"); process.exit(1); }
const y2 = yamali.indexOf(YENI2); /* 1. değişim uzunluk farkı kaydırır → ikinci bloğu yamalı metinde bul */
if (y2 === -1) { console.error("ASSERT DÜŞTÜ: ikinci hedef blok yamalı metinde bulunamadı"); process.exit(1); }
const parcalar = [
  yamali.slice(0, idxA) === kod.slice(0, idxA),
  yamali.slice(idxA + YENI1.length, y2) === kod.slice(idxA + ESKI1.length, idxB),
  yamali.slice(y2 + YENI2.length) === kod.slice(idxB + ESKI2.length)
];
if (!parcalar.every(Boolean)) { console.error("ASSERT DÜŞTÜ: hedef bölgeler dışında değişiklik saptandı"); process.exit(1); }
console.log("✓ Değişiklik yalnız 2 hedef bölgede (bölge dışı byte-birebir aynı)");

/* ---- Yedek: mevcutsa ÜZERİNE YAZMA ---- */
if (!existsSync(YEDEK)) {
  writeFileSync(YEDEK, kod);
  console.log("✓ Yedek yazıldı: " + YEDEK + " (SHA-256 " + sha(kod) + ")");
} else {
  console.log("• Yedek zaten mevcut, üzerine YAZILMADI: " + YEDEK + " (SHA-256 " + sha(readFileSync(YEDEK, "utf8")) + ")");
}

/* ---- Yaz ---- */
writeFileSync(DOSYA, yamali);
const YENI_SHA = sha(readFileSync(DOSYA, "utf8"));
console.log("✓ Yamalandı: " + DOSYA);
console.log("app.js SHA-256: " + ORIJINAL_SHA + " → " + YENI_SHA);
console.log("Tamamlandı (1. koşu — uygulandı).");
