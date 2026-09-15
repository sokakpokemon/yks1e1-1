/* ks-yama-sablon-kopya.mjs — SABLON-KOPYA-YAMASI
   TEK İŞ: Boş bir döneme, seçilen kaynak dönemin SINIF PROGRAMINI kullanıcının
   açık onayı ile kopyalama özelliği (yalnız sınıf programı; ders/istek KOPYALANMAZ).
   - Değişen: yalnızca app.js (3 bölgesel ekleme, baştan yazma YOK) + test.mjs (yeni süit kaydı, bu script'in DIŞINDA).
   - index.html, ek-ders.js, vendor/* DOKUNULMAZ (hash doğrulaması yazma öncesi yapılır).
   - İdempotent: 2. koşu "Zaten uygulanmış" (exit 2), dosyalara DOKUNMAZ.
   - Backup: app.js.sablon-kopya-oncesi.bak (varsa üzerine YAZILMAZ, hash raporlanır).
   - Yeniden kullanılan yardımcılar: aktifDonemId, sinifProgAktif, sinifProguDonemeBagla,
     onayAc/onayOnayla/onayKapat, toast, saveDB, yenile, esc (YENİ ONAY/TOAST İCAT EDİLMEZ).
   - UI: yalnız kalıcı #donem-ui-host içine (#sablon-kopya-ui); donemHostOnar duplicate önler,
     donemHostTazele seçimleri DOM'dan okuyup KORUYARAK tazeler → alt sekme geçişinde TEK kopya.
*/
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };
const assert = (c, m) => { if (!c) fail(m); else console.log("  OK " + m); };
const say = (hay, need) => hay.split(need).length - 1;
const sha = (s) => createHash("sha256").update(s).digest("hex");

/* ================= Başlangıç hash'leri (yazma öncesi doğrulama) ================= */
const HTML_BEFORE = readFileSync("index.html", "utf8");
const EKDERS_BEFORE = readFileSync("ek-ders.js", "utf8");
const VENDOR_BEFORE = ["chart.js", "fontawesome.css", "fonts.css", "html2canvas.js", "tailwind.js"]
  .map((f) => f + ":" + sha(readFileSync("vendor/" + f)));

/* ================= app.js ================= */
const F = "app.js";
const src0 = readFileSync(F, "utf8");

/* --- idempotans: zaten uygulanmışsa çık (exit 2), dosyalara DOKUNMA --- */
if (src0.includes("SABLOM-KOPYA-YAMASI") || src0.includes("SABLON-KOPYA-YAMASI")) {
  console.error("Zaten uygulanmış (SABLON-KOPYA-YAMASI mevcut) — dosyalar değiştirilmedi.");
  console.error("app.js hash: " + sha(src0));
  process.exit(2);
}

/* --- Beklenen mevcut durum (exact anchor'lar) --- */
assert(say(src0, "function donemSecKutusuHTML()") === 1, "app.js: donemSecKutusuHTML tam 1 kez");
assert(say(src0, "function donemHostOnar()") === 1, "app.js: donemHostOnar tam 1 kez");
assert(say(src0, "function donemHostTazele(host)") === 1, "app.js: donemHostTazele tam 1 kez (tazeleme noktası)");
assert(say(src0, "function onayAc(opts, cb)") === 1, "app.js: onayAc tam 1 kez (mevcut onay yardımcısı)");
assert(say(src0, "function onayOnayla()") === 1, "app.js: onayOnayla tam 1 kez");
assert(say(src0, "function sinifProguDonemeBagla(id)") === 1, "app.js: sinifProguDonemeBagla tam 1 kez");
assert(say(src0, "function yedekAl()") === 1, "app.js: yedekAl anchor tam 1 kez (BLOCK ekleme noktası)");
assert(say(src0, "function sinifProgCsvSatirlari()") === 1, "app.js: sinifProgCsvSatirlari tam 1 kez (CSV korunur)");
assert(say(src0, "function sinifProgCsvUygula(") === 1, "app.js: sinifProgCsvUygula tam 1 kez (CSV korunur)");
assert(say(src0, "function sinifProgCsvIndir()") === 1, "app.js: sinifProgCsvIndir tam 1 kez (CSV korunur)");
assert(say(src0, "function sinifProgCsvImportTetik(input)") === 1, "app.js: sinifProgCsvImportTetik tam 1 kez (CSV korunur)");
assert(say(src0, "SABLOM-KOPYA-YAMASI") === 0, "app.js: yama damgası henüz YOK (temiz başlangıç)");
assert(say(src0, "sablonKopyaUIHTML") === 0, "app.js: sablonKopyaUIHTML simgesi henüz YOK");
assert(say(src0, "sablonKopyaUygula") === 0, "app.js: sablonKopyaUygula simgesi henüz YOK");

/* --- Backup (yamadan önceki hâl; varsa üzerine YAZILMAZ) --- */
const bakPath = "app.js.sablon-kopya-oncesi.bak";
if (existsSync(bakPath)) {
  console.log("  OK backup zaten var: " + bakPath + " SHA-256 " + sha(readFileSync(bakPath)));
} else {
  writeFileSync(bakPath, src0);
  console.log("  OK backup alındı: " + bakPath + " SHA-256 " + sha(src0));
}

/* ================= EKLEME 1: kopyalama mantığı (yedekOku'dan hemen ÖNCE — yedekAl'dan sonra) =================
   Kural: kaynak program DB.sinifProgDonemler[kaynakId] canonical depodan okunur; hedef BOŞ olmalı;
   kullanıcıdan kaynak+hedef adını içeren AÇIK onay alınır; deep-copy (referans paylaşımı YASAK);
   kopya DB.sinifProgDonemler[hedefId]'ye yazılır; hedef aktifse DB.sinifProg identity-rebind;
   DB.aktifDonemId ve DB.sinifProgDonemId ASLA değişmez; TEK saveDB + mevcut yenile. */
const BLOCK = `
/* ================================================================
   SABLON-KOPYA-YAMASI: boş döneme kaynak dönem SINIF PROGRAMINI kopyalama
   - Kapsam: YALNIZ sınıf programı (DB.sinifProgDonemler). Dersler/istekler KOPYALANMAZ.
   - Dolu hedef ASLA ezilmez: hedefte tek bir hücre bile varsa işlem RED, veri değişmez.
   - Deep-copy zorunlu: kök ve iç içe tüm nesne/dizi referansları kaynakla PAYLAŞILMAZ.
   - Hedef aktifse DB.sinifProg yeniden identity-rebind edilir; inaktifse görünüm değişmez.
   - DB.aktifDonemId ve DB.sinifProgDonemId bu işlemden ETKİLENMEZ.
   - Başarılı akış TEK saveDB() + mevcut yenile(); onay mevcut onayAc/onayOnayla altyapısıyla.
   ================================================================ */
function sablonKopyaProgramBosMu(prog) {
  if (!prog || typeof prog !== "object" || Array.isArray(prog)) return true;
  var adlar = Object.keys(prog);
  for (var i = 0; i < adlar.length; i++) {
    var hucreler = prog[adlar[i]];
    if (Array.isArray(hucreler) && hucreler.length > 0) return false;
  }
  return true;
}
function sablonKopyaDonemAdi(id) {
  var d = ((DB && Array.isArray(DB.donemler)) ? DB.donemler : []).filter(function (x) { return x && x.id === id; })[0];
  return d ? (d.ad || d.id) : String(id || "?");
}
function sablonKopyaUygula(kaynakId, hedefId) {
  /* Güvenlik: herhangi bir koşul bozuksa HİÇBİR veri değişmez */
  if (!kaynakId || !hedefId || kaynakId === hedefId) return false;
  if (!DB || !DB.sinifProgDonemler || typeof DB.sinifProgDonemler !== "object") return false;
  if (!DB.donemler || !Array.isArray(DB.donemler)) return false;
  var donemVar = function (id) { return DB.donemler.some(function (d) { return d && d.id === id; }); };
  if (!donemVar(kaynakId) || !donemVar(hedefId)) return false; /* kaynak/hedef yok */
  var kaynakProg = DB.sinifProgDonemler[kaynakId];
  if (!kaynakProg || typeof kaynakProg !== "object" || Array.isArray(kaynakProg)) return false; /* kaynak canonical değil */
  var hedefProg = DB.sinifProgDonemler[hedefId];
  if (!sablonKopyaProgramBosMu(hedefProg)) return false; /* hedef dolu — ezme YOK */
  var aktifId = aktifDonemId();
  if (aktifId === kaynakId && kaynakId !== hedefId) {
    /* kaynak aktif dönem: DB.sinifProg TEK canonical kaynak olmalı; bağlantısız eski görünüm kopyalanamaz */
  }
  var kaynakView = DB.sinifProg;
  if (kaynakId === aktifId && kaynakView && typeof kaynakView === "object" && !Array.isArray(kaynakView)) {
    var ayni = JSON.stringify(kaynakView) === JSON.stringify(kaynakProg);
    if (!ayni) return false; /* kaynak aktif ama canonical depo ile uyumsuz — RED (veri değişmez) */
  }
  /* AÇIK onay: kaynak + hedef adları metin içinde; mevcut onayAc/onayOnayla altyapısı */
  var kaynakAd = sablonKopyaDonemAdi(kaynakId);
  var hedefAd = sablonKopyaDonemAdi(hedefId);
  onayAc({
    baslik: "Sınıf programı kopyalansın mı?",
    metin: "<b>" + esc(kaynakAd) + "</b> döneminin sınıf programı, BOŞ olan <b>" + esc(hedefAd) + "</b> dönemine kopyalanacak. " +
      "Yalnızca sınıf programı kopyalanır — <b>dersler ve istekler kopyalanmaz</b>. Hedefteki mevcut program yoktur (boş).",
    onay: "Evet, Programı Kopyala"
  }, function () {
    /* Onay verildi; koşullar YENİDEN doğrulanır (onay beklerken veri değişmiş olabilir) */
    var k2 = DB.sinifProgDonemler[kaynakId];
    var h2 = DB.sinifProgDonemler[hedefId];
    if (!k2 || typeof k2 !== "object" || Array.isArray(k2)) return;
    if (!sablonKopyaProgramBosMu(h2)) { toast("Hedef dönem bu arada doldu — kopyalama iptal, hiçbir veri değişmedi.", "uyari"); return; }
    /* DEEP-COPY: JSON döngüsü → kök ve iç içe tüm referanslar kaynakla AYNI OLAMAZ */
    var kopya = JSON.parse(JSON.stringify(k2));
    if (kopya === k2) return; /* paranoia: referans paylaşımı olamaz */
    DB.sinifProgDonemler[hedefId] = kopya;
    /* Hedef aktif dönem ise DB.sinifProg yeniden identity-rebind (depodaki TA KENDİSİ) */
    if (aktifDonemId() === hedefId) {
      DB.sinifProg = DB.sinifProgDonemler[hedefId];
      if (DB.sinifProg !== DB.sinifProgDonemler[hedefId]) return; /* rebind assert'i — başarısızsa yazma yok */
    }
    /* DB.aktifDonemId ve DB.sinifProgDonemId ASLA değişmez (dokunulmadı) */
    saveDB();
    yenile();
    toast("Sınıf programı kopyalandı ✓ — " + kaynakAd + " → " + hedefAd);
  });
  return true;
}
/* SABLON-KOPYA-YAMASI sonu */
`;

/* ================= EKLEME 2: UI (donemSecKutusuHTML'den HEMEN ÖNCE) =================
   Yalnız kalıcı #donem-ui-host içine dondurulur (bkz. EKLEME 3). Sabit id'ler:
   #sablon-kopya-ui, #sablon-kaynak-donem, #sablon-hedef-donem, #sablon-kopyala-btn, #sablon-kopya-uyari.
   Seçenekler DB.donemler'den; value gerçek id (ada göre tahmin YOK). */
const UI_BLOCK = `
/* ---- SABLON-KOPYA-YAMASI: "Programı Sablondan Kopyala" kartı (kalıcı #donem-ui-host içine) ----
   - donemHostOnar bu kartı host'a TEK kez ekler; donemHostTazele seçimleri koruyarak tazeler →
     donemSec/yeniDonemOlustur/alt sekme geçişi sonrası TEK kopya (duplicate imkânsız).
   - Yeni dönem oluşturma programı OTOMATİK kopyalamaz; kopyalama yalnız kullanıcı butonuyla. */
function sablonKopyaUIHTML(secimler) {
  secimler = secimler || {};
  var donemler = (DB && Array.isArray(DB.donemler)) ? DB.donemler : [];
  var hedef = secimler.hedef || aktifDonemId();
  var kaynak = secimler.kaynak || "";
  if (!donemler.some(function (d) { return d && d.id === hedef; })) hedef = donemler.length ? donemler[0].id : "";
  var kandidate = donemler.filter(function (d) { return d && d.id !== hedef; });
  if (!kaynak || !kandidate.some(function (d) { return d.id === kaynak; })) kaynak = kandidate.length ? kandidate[0].id : "";
  var opt = function (seciliId) {
    return donemler.filter(function (d) { return d && d.id; }).map(function (d) {
      return '<option value="' + esc(d.id) + '"' + (d.id === seciliId ? " selected" : "") + ">" + esc(d.ad || d.id) + "</option>";
    }).join("");
  };
  return '<div id="sablon-kopya-ui" class="no-print rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 mb-2">' +
    '<div class="flex flex-wrap items-center gap-2">' +
      '<span class="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap"><i class="fa-regular fa-clone mr-1"></i>Programı Sablondan Kopyala</span>' +
      '<select id="sablon-kaynak-donem" onchange="sablonKopyaOnayTazele()" class="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40">' + opt(kaynak) + "</select>" +
      '<span class="text-[11px] text-slate-300 font-bold"><i class="fa-solid fa-arrow-right-long"></i></span>' +
      '<select id="sablon-hedef-donem" onchange="sablonKopyaOnayTazele()" class="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40">' + opt(hedef) + "</select>" +
      '<button id="sablon-kopyala-btn" onclick="sablonKopyaBaslat()" class="rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[11.5px] font-bold px-3.5 py-1.5 shadow-sm transition-colors whitespace-nowrap"><i class="fa-regular fa-clone mr-1"></i>Programı Kopyala</button>' +
    "</div>" +
    '<p id="sablon-kopya-uyari" class="hidden text-[11px] font-semibold text-rose-600 mt-1.5 mb-0"></p>' +
  "</div>";
}
/* Uyarı: kaynak = hedef veya hedef dolu → görünür uyari; buton akışı yine de sunucu-tarafı güvenlikle RED. */
function sablonKopyaOnayTazele() {
  try {
    var kEl = document.getElementById("sablon-kaynak-donem");
    var hEl = document.getElementById("sablon-hedef-donem");
    var uyariEl = document.getElementById("sablon-kopya-uyari");
    if (!kEl || !hEl || !uyariEl) return;
    var k = kEl.value, h = hEl.value;
    var msg = "";
    if (!k || !h || k === h) msg = "Kaynak ve hedef dönem farklı olmalı.";
    else if (!sablonKopyaProgramBosMu(DB.sinifProgDonemler ? DB.sinifProgDonemler[h] : null)) msg = "Hedef dönem dolu — mevcut program korunur, ezme yok. Kopyalama için boş bir dönem seçin.";
    if (msg) { uyariEl.textContent = msg; uyariEl.classList.remove("hidden"); }
    else uyariEl.classList.add("hidden");
  } catch (e) { /* DOM yoksa sessiz */ }
}
function sablonKopyaBaslat() {
  var kEl = document.getElementById("sablon-kaynak-donem");
  var hEl = document.getElementById("sablon-hedef-donem");
  if (!kEl || !hEl) { toast("Dönem seçicileri bulunamadı.", "hata"); return; }
  var k = kEl.value, h = hEl.value;
  if (!k || !h || k === h) { toast("Kaynak ve hedef dönem farklı olmalı.", "uyari"); return; }
  if (!DB.sinifProgDonemler || !sablonKopyaProgramBosMu(DB.sinifProgDonemler[h])) {
    toast("Hedef dönem dolu — mevcut program korunur, ezme yok.", "hata");
    return;
  }
  sablonKopyaUygula(k, h);
}
/* SABLON-KOPYA-YAMASI UI sonu */
`;

/* ================= 1) BLOCK: yedekAl'dan HEMEN ÖNCE (SINIFPROG-CSV bloğu sonrası) ================= */
const ANCHOR1 = "function yedekAl() {";
assert(say(src0, ANCHOR1) === 1, "app.js: yedekAl anchor tam 1 kez");
let src1 = src0.replace(ANCHOR1, BLOCK + "\n" + ANCHOR1);

/* ================= 2) UI_BLOCK: donemSecKutusuHTML'den HEMEN ÖNCE ================= */
const ANCHOR2 = "function donemSecKutusuHTML() {";
assert(say(src1, ANCHOR2) === 1, "app.js: donemSecKutusuHTML anchor tam 1 kez");
src1 = src1.replace(ANCHOR2, UI_BLOCK + "\n" + ANCHOR2);

/* ================= 3) donemHostOnar: host'a şablon-kopya kartı eklenir + tazeleme seçimleri korur =================
   Yeni kart, host'un İÇİNE (donemSeciciKutu'nun kardeşi olarak) eklenir; host root olarak kalır →
   ek-ders.js yb.innerHTML override'ı host'u ASLA silmez (host yb kardeşi). */
const HOST_ESKI = `  yeni.id = "donem-ui-host";
  yeni.className = "no-print mb-3";
  yeni.innerHTML = kutu;
  try { (yb.parentNode || document.body).insertBefore(yeni, yb); } catch (e6) { try { document.body.appendChild(yeni); } catch (e7) {} }`;
assert(say(src1, HOST_ESKI) === 1, "app.js: donemHostOnar host kurulum bloğu anchor tam 1 kez");
const HOST_YENI = `  yeni.id = "donem-ui-host";
  yeni.className = "no-print mb-3";
  yeni.innerHTML = kutu;
  /* SABLON-KOPYA-YAMASI: "Programı Sablondan Kopyala" kartı host İÇİNE (donemSeciciKutu kardeşi) */
  try { yeni.insertAdjacentHTML("beforeend", sablonKopyaUIHTML({ hedef: aktifDonemId() })); } catch (eSk) {}
  try { (yb.parentNode || document.body).insertBefore(yeni, yb); } catch (e6) { try { document.body.appendChild(yeni); } catch (e7) {} }`;
src1 = src1.replace(HOST_ESKI, HOST_YENI);

const TAZELE_ESKI = `function donemHostTazele(host) {
  try { var taze = (typeof donemSecKutusuHTML === "function") ? donemSecKutusuHTML() : null; if (taze) host.innerHTML = taze; } catch (e8) {}
}`;
assert(say(src1, TAZELE_ESKI) === 1, "app.js: donemHostTazele gövdesi anchor tam 1 kez");
const TAZELE_YENI = `function donemHostTazele(host) {
  /* SABLON-KOPYA-YAMASI: tazelemede şablon-kopya kartının seçimleri DOM'dan okunup KORUNUR (override'da seçim kaybı yok) */
  var sablonSecim = null;
  try {
    var kEl = document.getElementById("sablon-kaynak-donem"), hEl = document.getElementById("sablon-hedef-donem");
    if (kEl && hEl && kEl.value && hEl.value) sablonSecim = { kaynak: kEl.value, hedef: hEl.value };
  } catch (eSk0) { sablonSecim = null; }
  try { var taze = (typeof donemSecKutusuHTML === "function") ? donemSecKutusuHTML() : null; if (taze) host.innerHTML = taze; } catch (e8) {}
  try {
    var sk = document.getElementById("sablon-kopya-ui");
    if (!sk) {
      if (typeof sablonKopyaUIHTML === "function") {
        host.insertAdjacentHTML("beforeend", sablonKopyaUIHTML(sablonSecim || { hedef: aktifDonemId() }));
      }
    }
  } catch (eSk1) {}
  if (sablonSecim) {
    try {
      var k2 = document.getElementById("sablon-kaynak-donem"), h2 = document.getElementById("sablon-hedef-donem");
      /* Veri güdümlü seçim koruma: seçenek id'leri yalnız markup'taki value="id" özniteliklerinden okunur (ada göre tahmin YOK) */
      var secenekIds = function (el) { return String((el && el.innerHTML) || "").match(/value="([^"]+)"/g) || []; };
      if (k2 && h2) {
        var idler = { k: secenekIds(k2), h: secenekIds(h2) };
        if (idler.k.indexOf('value="' + sablonSecim.kaynak + '"') !== -1) k2.value = sablonSecim.kaynak;
        if (idler.h.indexOf('value="' + sablonSecim.hedef + '"') !== -1) h2.value = sablonSecim.hedef;
      }
    } catch (eSk2) {}
  }
  try { sablonKopyaOnayTazele(); } catch (eSk3) {}
}`;
src1 = src1.replace(TAZELE_ESKI, TAZELE_YENI);

/* ================= Yazma öncesi son kontroller ================= */
assert(say(src1, "function sablonKopyaUIHTML(") === 1, "app.js yeni: sablonKopyaUIHTML tam 1 kez");
assert(say(src1, "function sablonKopyaUygula(") === 1, "app.js yeni: sablonKopyaUygula tam 1 kez");
assert(say(src1, "function sablonKopyaBaslat(") === 1, "app.js yeni: sablonKopyaBaslat tam 1 kez");
assert(say(src1, "function sablonKopyaOnayTazele(") === 1, "app.js yeni: sablonKopyaOnayTazele tam 1 kez");
assert(say(src1, "function sablonKopyaProgramBosMu(") === 1, "app.js yeni: sablonKopyaProgramBosMu tam 1 kez");
assert(say(src1, "function sablonKopyaDonemAdi(") === 1, "app.js yeni: sablonKopyaDonemAdi tam 1 kez");
assert(say(src1, 'id="sablon-kopya-ui"') === 1, "app.js yeni: #sablon-kopya-ui id tam 1 kez");
assert(say(src1, 'id="sablon-kaynak-donem"') === 1, "app.js yeni: #sablon-kaynak-donem id tam 1 kez");
assert(say(src1, 'id="sablon-hedef-donem"') === 1, "app.js yeni: #sablon-hedef-donem id tam 1 kez");
assert(say(src1, 'id="sablon-kopyala-btn"') === 1, "app.js yeni: #sablon-kopyala-btn id tam 1 kez");
assert(say(src1, 'id="sablon-kopya-uyari"') === 1, "app.js yeni: #sablon-kopya-uyari id tam 1 kez");
/* Duplicate fonksiyon adı kontrolü: ekleme öncesi 0 olan semboller artık TAM 1 */
["sablonKopyaUIHTML", "sablonKopyaUygula", "sablonKopyaBaslat", "sablonKopyaOnayTazele", "sablonKopyaProgramBosMu", "sablonKopyaDonemAdi"].forEach((fn) => {
  assert(say(src1, "function " + fn + "(") === 1, "app.js yeni: " + fn + " tanımı tam 1 kez (duplicate YOK)");
});
/* Mevcut semboller hâlâ tam 1 (bölge dışı bozulma yok) */
["donemSecKutusuHTML", "donemSec(", "yeniDonemOlustur(", "aktifDonemKayitlari(", "onayAc(", "sinifProguDonemeBagla(", "sinifProgAktif(", "yedekAl(", "yedekOku(", "saveDB(", "yenile("].forEach((s) => {
  const name = s.endsWith("(") ? s.slice(0, -1) : s;
  assert(say(src1, "function " + name + "(") === 1, "app.js yeni: mevcut " + name + " tam 1 kez");
});
/* CSV koruması: sinifProg CSV sembolleri ve satır sayısı birebir korunmalı */
["sinifProgCsvSatirlari", "sinifProgCsvUygula", "sinifProgCsvIndir", "sinifProgCsvImportTetik", "csvHucre", "csvSatir", "csvDosya", "csvParse"].forEach((fn) => {
  assert(say(src1, "function " + fn + "(") === 1, "app.js yeni: CSV " + fn + " tam 1 kez (korunur)");
});
/* Bölge dışı değişiklik reddi: BLOCK/UI_BLOCK ekleri tam yerinde olmalı */
assert(src1.indexOf(BLOCK) !== -1 && src1.indexOf(BLOCK) < src1.indexOf(ANCHOR1), "app.js yeni: BLOCK yedekAl'dan önce (bölge içi)");
assert(src1.indexOf(UI_BLOCK) !== -1 && src1.indexOf(UI_BLOCK) < src1.indexOf(ANCHOR2), "app.js yeni: UI_BLOCK donemSecKutusuHTML'den önce (bölge içi)");
assert(src1.length > src0.length, "app.js yeni: yalnız ekleme/değiştirme (uzunluk arttı)");

/* ================= Tüm assert'ler geçti → hash koruması + yaz ================= */
assert(sha(readFileSync("index.html", "utf8")) === sha(HTML_BEFORE), "index.html yazım öncesi hash aynı");
assert(sha(readFileSync("ek-ders.js", "utf8")) === sha(EKDERS_BEFORE), "ek-ders.js yazım öncesi hash aynı");
VENDOR_BEFORE.forEach((v) => {
  const f = v.split(":")[0];
  assert(sha(readFileSync("vendor/" + f)) === v.split(":")[1], "vendor/" + f + " hash aynı");
});
writeFileSync(F, src1);
console.log("YAMA UYGULANDI: " + F + " (yeni hash " + sha(src1) + ")");
console.log("app.js.sablon-kopya-oncesi.bak SHA-256: " + sha(readFileSync(bakPath)));
