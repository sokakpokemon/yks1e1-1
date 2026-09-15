/* ks-yama-donem-secici-ui.mjs — DONEM-SECICI-UI-YAMASI (assert'li, hedefli, idempotent)
   TEK İŞ: ek-ders.js'in renderYonetim override'ı yonetimBolum.innerHTML'i donemSeciciKutu
   OLMADAN yeniden yazdığı için (kök neden: index.html L7 defer → ek-ders.js L413-431)
   dönem kontrolü kayboluyor. Çözüm (3 hedefli bölge, app.js'e özgü):
     A) donemSecKutusuHTML: gerçek id="donemSeciciKutu" KORUNUR (host sarmalayıcı EKLENMEZ —
        gerçek DOM'da çift kayıt üretirdi); select→#donem-secici, buton→#yeni-donem-btn
        (eski id'ler data-id uyumluluk takma adı; ks-donem-secici.mjs sayım sözleşmesi = 1 kalır).
     B) Yeni yardımcılar: donemHostOnar() — kart-içi seçici DOM'da YOKSA (ek-ders override kanıtı)
        #yonetimBolum'un hemen ÜSTÜNE tek kalıcı #donem-ui-host kurar (options'lar taze);
        kart-içi seçici VARSA host'u kaldırır (çift kayıt imkânsız). Tekrarlı çağrı no-op.
     C) yenile() kuyruğunun sonuna donemHostOnarZincir() — tüm yenileme yolları
        (donemSec / sec / yeniDonemOlustur / boot) otomatik kapsanır.
   Yazma öncesi TÜM assert'ler koşar; tek assert bile düşerse dosya DEĞİŞMEZ.
   2. koşu: "Zaten uygulanmış" → exit 2, dosyaya dokunmaz. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const DOSYA = "app.js";
const YEDEK = "app.js.donem-secici-oncesi.bak";
const sha = (s) => createHash("sha256").update(s).digest("hex");

let kod;
try { kod = readFileSync(DOSYA, "utf8"); } catch (e) { console.error("app.js okunamadı: " + e.message); process.exit(1); }
const ORIJINAL_SHA = sha(kod);
console.log("app.js SHA-256 (işlem öncesi): " + ORIJINAL_SHA);

/* ---- Beklenen ankrajlar (önceki dilimlerin damgaları + hedef bölgeler) ---- */
const ANKRAJLAR = [
  ["DONEM-OLUSTURMA-YAMASI damgası", "DONEM-OLUSTURMA-YAMASI"],
  ["DONEM-SECICI-V2 damgası", "DONEM-SECICI-V2"],
  ["donemSec fonksiyonu", "function donemSec(id) {"],
  ["yeniDonemOlustur fonksiyonu", "function yeniDonemOlustur() {"],
  ["sinifProguDonemeBagla (migration)", "function sinifProguDonemeBagla("],
  ["yenile fonksiyonu", "function yenile() {"],
  ["yonetimBolum hedefi", 'renderYonetim();\n  renderHavuz();'],
  ["esc yardımcısı", "function esc("]
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

/* ---- Hedef eski bloklar tam olarak 1 kez bulunmalı ---- */
const ESKI_A = `  var yeniBtn = '<button id="donemYeniBtn" onclick="yeniDonemOlustur()" title="2027/2028 dönemini oluştur ve ona geç" class="rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 text-[11.5px] font-bold transition-colors whitespace-nowrap"><i class="fa-solid fa-plus mr-1"></i>Yeni Dönem Oluştur</button>';
  return '<div id="donemSeciciKutu" class="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">' +
    '<span class="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap"><i class="fa-solid fa-layer-group mr-1"></i>Dönem</span>' +
    '<select id="donemSecici" onchange="donemSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40 max-w-full">' + ops + "</select>" + yeniBtn +
    "</div>";`;
const ESKI_B = `  renderYonetim();
  renderHavuz();
  renderDersler();
  renderFormDestek();
}`;

const sayac = (metin, iğne) => metin.split(iğne).length - 1;
for (const [ad, blok] of [["ESKI-A donemSecKutusuHTML dönüş bloğu", ESKI_A], ["ESKI-B yenile() kuyruk kapanışı", ESKI_B]]) {
  const n = sayac(kod, blok);
  if (n !== 1) { console.error(`ASSERT DÜŞTÜ: ${ad} tam olarak 1 kez bulunmalı; bulunan: ${n}`); process.exit(1); }
}
console.log("✓ Hedef eski bloklar tam olarak 1'er kez bulundu");

/* ---- Yeni tanımlayıcılar kaynakta hiç yok olmalı (çakışma önleme) ---- */
for (const id of ['id="donem-ui-host"', 'id="donem-secici"', 'id="yeni-donem-btn"', "donemHostOnar", "donemHostOnarZincir", "DONEM-SECICI-UI-YAMASI"]) {
  if (kod.includes(id)) { console.error(`ASSERT DÜŞTÜ: yeni tanımlayıcı kaynakta zaten var → ${id}`); process.exit(1); }
}
console.log("✓ Yeni ID'ler (donem-ui-host / donem-secici / yeni-donem-btn) kaynakta yok — çakışma imkânsız");

/* ---- Eski davranış koruma assert'leri (dokunulmaması gerekenler) ---- */
const KORUNANLAR = [
  ["function planla(", 1], ["function istekEkle(", 1], ["function istekGrupEkle(", 1],
  ["function normalize(", 1], ["function yedekOku(", 1], ["function yedekAl(", 1],
  ["function aktifDonemKayitlari(", 1], ["function sinifProgDonemleriBaslat(", 1],
  ["function sinifProguDonemeBagla(", 1], ["function yeniDonemOlustur()", 1],
  ["function donemSecKutusuHTML()", 1], ["function renderYonetim()", 1],
  ["function donemSec(id)", 1], ["function aktifDonemId()", 1],
  ["function yenile()", 1], ["function sec(ad)", 1]
];
for (const [ad, beklenen] of KORUNANLAR) {
  const n = sayac(kod, ad);
  if (n !== beklenen) { console.error(`ASSERT DÜŞTÜ: '${ad}' beklenen ${beklenen}, bulunan ${n}`); process.exit(1); }
}
console.log("✓ Eski davranış bloklarının tanım sayıları doğrulandı (" + KORUNANLAR.length + " sembol × 1)");

/* ---- YENİ BLOK A: donemSecKutusuHTML — sabit select/buton kimlikleri + data-id takma adları ---- */
const YENI_A = `  var yeniBtn = '<button id="yeni-donem-btn" data-id="donemYeniBtn" onclick="yeniDonemOlustur()" title="2027/2028 dönemini oluştur ve ona geç" class="rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 text-[11.5px] font-bold transition-colors whitespace-nowrap"><i class="fa-solid fa-plus mr-1"></i>Yeni Dönem Oluştur</button>';
  /* DONEM-SECICI-UI-YAMASI: kart-içi seçici sabit kimlikli (select #donem-secici, buton #yeni-donem-btn;
     eski id'ler data-id uyumluluk takma adı). Kart İÇİ bu markup ek-ders.js override'ı selse bile
     donemHostOnar() kartın ÜSTÜNDEKİ kalıcı #donem-ui-host'u TEK kez geri getirir. */
  return '<div id="donemSeciciKutu" class="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">' +
    '<span class="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap"><i class="fa-solid fa-layer-group mr-1"></i>Dönem</span>' +
    '<select id="donem-secici" data-id="donemSecici" onchange="donemSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40 max-w-full">' + ops + "</select>" + yeniBtn +
    "</div>";`;

/* ---- YENİ BLOK B: host onarım yardımcıları ---- */
const YENI_B1 = `  renderYonetim();
  renderHavuz();
  renderDersler();
  renderFormDestek();
  donemHostOnarZincir();
}

/* ---- DONEM-SECICI-UI-YAMASI: kalıcı dönem kontrolü (host onarımı) ----
   Gerçek sayfada ek-ders.js (defer) renderYonetim'i 4 sekmeli sarmalayıcıyla ezer ve
   yonetimBolum.innerHTML'i donemSeciciKutu OLMADAN yeniden yazar. Bu durumda seçici
   kart-içinden silinir; donemHostOnar() bunu saptayıp #yonetimBolum'un hemen ÜSTÜNE
   (yan gözükür, alt sekmelerden bağımsız) TEK kalıcı #donem-ui-host kurar.
   Kart-içi seçici DOM'da VARSA host'u kaldırır → çift kayıt/duplicate imkânsız.
   Options'lar her yenileme akışında (donemSec/sec/yeniDonemOlustur → yenile) tazelenir. */
function donemHostOnar() {
  var yb = null;
  try { yb = (typeof document !== "undefined") ? document.getElementById("yonetimBolum") : null; } catch (e0) { yb = null; }
  if (!yb) return;
  var kartIciSecici = false;
  try { kartIciSecici = !!(yb.innerHTML && yb.innerHTML.indexOf('id="donemSeciciKutu"') !== -1); } catch (e1) { kartIciSecici = false; }
  var host = null;
  try { host = document.getElementById("donem-ui-host"); } catch (e2) { host = null; }
  if (kartIciSecici) {
    /* çift kayıt önleme: host varsa DOM'dan çıkar (id kayıt defterinden düşer) */
    if (host) { try { host.remove(); } catch (e3) {} }
    return;
  }
  if (host) { donemHostTazele(host); return; } /* zaten kurulu — no-op + seçenekleri tazele */
  var kutu = null;
  try { kutu = (typeof donemSecKutusuHTML === "function") ? donemSecKutusuHTML() : null; } catch (e4) { kutu = null; }
  if (!kutu) return;
  var yeni = null;
  try { yeni = document.createElement("div"); } catch (e5) { yeni = null; }
  if (!yeni) return;
  yeni.id = "donem-ui-host";
  yeni.className = "no-print mb-3";
  yeni.innerHTML = kutu;
  try { (yb.parentNode || document.body).insertBefore(yeni, yb); } catch (e6) { try { document.body.appendChild(yeni); } catch (e7) {} }
}
/* Tazelik kuralı: host kuruluysa seçenekleri her yenilemede donemSecKutusuHTML()'den
   tazele — yeniDonemOlustur() sonrası yeni dönem seçicide anında görünür. */
function donemHostTazele(host) {
  try { var taze = (typeof donemSecKutusuHTML === "function") ? donemSecKutusuHTML() : null; if (taze) host.innerHTML = taze; } catch (e8) {}
}
/* Zincirleme onarım: microtask (aynı tikte sonradan yazan render'dan SONRA koşar) —
   yenile() → renderYonetim → (defer) ek-ders override sırasını kapatır. */
function donemHostOnarZincir() {
  try { Promise.resolve().then(donemHostOnar); } catch (e1) {}
  try { setTimeout(donemHostOnar, 0); } catch (e2) {}
}`;

/* ---- Yama uygula ---- */
const yamali = kod.replace(ESKI_A, () => YENI_A).replace(ESKI_B, () => YENI_B1);

/* ---- Post-assert'ler (YAZMADAN ÖNCE) ---- */
const POST = [
  /* id="donem-ui-host": yalnız donemHostOnar içinde 1 gerçek atama (markup'ta YOK — kart-içi
     markup host'suz; gerçek DOM'da çift kayıt imkânsız) */
  /* id="donem-ui-host": yalnız property ataması (yeni.id) — markup'ta YOK; attribute-form sayaç 0, property-form 1 */
  ["yeni host property ataması tam 1 kez", 'yeni.id = "donem-ui-host"', 1],
  ["yeni host attribute-form yok", 'id="donem-ui-host"', 0],
  ["tazelik fonksiyonu", "function donemHostTazele(", 1],
  /* "donemHostTazele(host)": 1 çağrı + 1 tanım imzası = 2 */
  ["tazelik bağlantısı (çağrı+imza)", "donemHostTazele(host)", 2],
  ["yeni select tam 1 kez", 'id="donem-secici"', 1],
  ["yeni buton tam 1 kez", 'id="yeni-donem-btn"', 1],
  /* eski id'ler: yalnız data-id takma adı alt-dizisi (ks-donem-secici.mjs / ks-donem-olusturma.mjs
     sayım sözleşmeleri: donemSecici=1, donemYeniBtn=1; donemSeciciKutu gerçek markup=1) */
  /* eski kutu id: 1 gerçek markup + 1 donemHostOnar tespit referansı (indexOf) */
  ["eski kutu id (markup + tespit ref)", 'id="donemSeciciKutu"', 2],
  ["eski select id (yalnız data-id alt-dizisi)", 'id="donemSecici"', 1],
  ["eski buton id (yalnız data-id alt-dizisi)", 'id="donemYeniBtn"', 1],
  ["data-id takma ad: kutu yok (gerçek id korunur)", 'data-id="donemSeciciKutu"', 0],
  ["data-id takma ad: select", 'data-id="donemSecici"', 1],
  ["data-id takma ad: buton", 'data-id="donemYeniBtn"', 1],
  ["onarım fonksiyonu", "function donemHostOnar()", 1],
  ["zincir fonksiyonu", "function donemHostOnarZincir()", 1],
  ["yenile() kuyruk bağlantısı", "donemHostOnarZincir();", 1],
  ["host kurulum komşuluğu", "(yb.parentNode || document.body).insertBefore(yeni, yb)", 1],
  ["microtask onarım çağrısı", "Promise.resolve().then(donemHostOnar)", 1],
  ["yama damgası", "DONEM-SECICI-UI-YAMASI", 2]
];
for (const [ad, iğne, beklenen] of POST) {
  const n = sayac(yamali, iğne);
  if (n !== beklenen) { console.error(`ASSERT DÜŞTÜ (post): ${ad} beklenen ${beklenen}, bulunan ${n}`); process.exit(1); }
}
console.log("✓ Post-assert'ler geçti (" + POST.length + " sayım)");

/* ---- Bölge dışı değişim kanıtı: yalnız iki hedef blok değişti ---- */
const idxA = kod.indexOf(ESKI_A), idxB = kod.indexOf(ESKI_B);
if (idxA === -1 || idxB === -1 || idxA >= idxB) { console.error("ASSERT DÜŞTÜ: hedef bloklar uygulanamadı"); process.exit(1); }
const y2 = yamali.indexOf(YENI_B1); /* 1. değişim uzunluk farkı kaydırır → ikinci bloğu yamalı metinde bul */
if (y2 === -1) { console.error("ASSERT DÜŞTÜ: ikinci hedef blok yamalı metinde bulunamadı"); process.exit(1); }
const parcalar = [
  yamali.slice(0, idxA) === kod.slice(0, idxA),
  yamali.slice(idxA + YENI_A.length, y2) === kod.slice(idxA + ESKI_A.length, idxB),
  yamali.slice(y2 + YENI_B1.length) === kod.slice(idxB + ESKI_B.length)
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
