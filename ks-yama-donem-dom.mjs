/* ks-yama-donem-dom.mjs — DONEM-DOM-DÜZELTMESİ (assert'li, idempotent, hedefli yama)
   TEK İŞ: dönem seçici + "Yeni Dönem Oluştur"un GERÇEK tarayıcı DOM'unda kalıcı görünmesi.
   Kök neden: ek-ders.js (defer) renderYonetim'i 4 sekmeli sarmalayıcıyla EZER ve
   yonetimBolum.innerHTML'i donemSeciciKutu OLMADAN yeniden yazar; donemHostOnarZincir'in
   microtask+setTimeout-0 zinciri TEK atımlıktır → defer görevi timer'ı geçtiğinde
   (script ağ/cache gecikmesi) onarım hiç koşmaz ve #donem-secici DOM'da 0 kalır.
   Yamada (yalnız app.js — 3 hedefli bölge, baştan yazma YOK, silme YOK):
     A2) donemHostOnar() — host'u kurarken TEK SEFERLİK konsol kanıtı yazar (console.info;
        her yenilemede değil — host zaten kuruluysa erken döner).
     B) donemOnarimPlanla() — yb.innerHTML'e bağlı TEK seferlik MutationObserver; kart-içi
        seçici silinen her yb yazımında donemHostOnar()'ı setTimeout 0 ile planlar (idempotent).
        + donemOzDenetim() — boot sonunda 1 kez koşan self-check (eksikse console.error).
     C) sec() — alt sekme değişiminde de tek onarım planlanır.
     D) Başlangıç bölümü — boot'un en son noktasında donemOnarimPlanla() + self-check
        (setTimeout 0: onarım zincirinin microtask+timer'ından SONRA settled durumu raporlar).
   KURAL: tüm assert'ler geçmeden dosyaya YAZILMAZ. 2. koşu: "Zaten uygulanmış" + exit 2. */
import { readFileSync, writeFileSync, existsSync, copyFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const HEDEF = "app.js";
const DAMGA = "DONEM-DOM-SELF-CHECK";
const sha = (s) => createHash("sha256").update(s).digest("hex");
let kaynak = readFileSync(HEDEF, "utf8");
const oncesiSha = sha(kaynak);
const oncesiBayt = statSync(HEDEF).size;

/* ---- İDEMPOTANS: zaten uygulanmışsa dosyaya DOKUNMA ---- */
if (kaynak.includes(DAMGA)) {
  console.error("Zaten uygulanmış — dosya değiştirilmedi. (hash: " + oncesiSha.slice(0, 12) + "…)");
  process.exit(2);
}

/* ---- YEDEKLER (varsa üzerine YAZILMAZ) ---- */
const bakA = "app.js.donem-secici-oncesi.bak"; /* görevde istenen yedek adı */
const bakB = "app.js.donem-dom-oncesi.bak";    /* bu yamanın gerçek ön-durumu */
if (!existsSync(bakA)) copyFileSync(HEDEF, bakA);
if (!existsSync(bakB)) copyFileSync(HEDEF, bakB);

function say(metin, igne) { return metin.split(igne).length - 1; }
function tekDegistir(metin, eski, yeni, etiket) {
  const adet = say(metin, eski);
  if (adet !== 1) { console.error("ASSERT başarısız (" + etiket + "): hedef tam 1 kez bulunmalı — bulunan " + adet); process.exit(1); }
  return metin.replace(eski, () => yeni);
}

/* ---- YAZMA ÖNCESİ ASSERT'LER ---- */
const A_SEC = "function sec(ad) { ui.sekme = ad; renderYonetim(); }";
const A_ZINCIR = "function donemHostOnarZincir() {";
const A_BOOT = "/* ---- Başlangıç ---- */\nrenderFormDestek();\nyenile();";
const A_HOST = "  if (host) { donemHostTazele(host); return; } /* zaten kurulu — no-op + seçenekleri tazele */\n";
[
  [A_SEC, "sec() imzası"], [A_ZINCIR, "donemHostOnarZincir() imzası"], [A_BOOT, "Başlangıç bloğu"], [A_HOST, "donemHostOnar host-erken-dönüş satırı"]
].forEach(([igne, ad]) => {
  if (say(kaynak, igne) !== 1) { console.error("ASSERT başarısız: " + ad + " tam 1 kez bulunamadı (" + say(kaynak, igne) + ")"); process.exit(1); }
});
if (say(kaynak, "donemHostOnarZincir();") !== 1) { console.error("ASSERT: yenile() kuyruk bağlantısı tam 1 olmalı"); process.exit(1); }
if (!kaynak.includes("function donemHostOnar()")) { console.error("ASSERT: donemHostOnar yok"); process.exit(1); }
if (!kaynak.includes('id="donem-secici" data-id="donemSecici"')) { console.error("ASSERT: sabit kimlikli select markup yok"); process.exit(1); }
if (!kaynak.includes('id="yeni-donem-btn" data-id="donemYeniBtn"')) { console.error("ASSERT: sabit kimlikli buton markup yok"); process.exit(1); }
if (say(kaynak, "$(\"donemSecici\")") !== 0 || say(kaynak, "$(\"donemYeniBtn\")") !== 0) { console.error("ASSERT: eski id kullanımı taraması — $('donemSecici')/$('donemYeniBtn') OLMAMALI"); process.exit(1); }

/* ---- BÖLGE B: donemOnarimPlanla + donemOzDenetim (donemHostOnarZincir'in üstüne) ---- */
const PLANLA_BLOK = `/* DONEM-DOM-DÜZELTMESİ (idempotent ensureDonemUI): kök neden — ek-ders.js (defer) görevi
   renderYonetim'i 4 sekmeli sarmalayıcıyla EZER ve yonetimBolum.innerHTML'i donemSeciciKutu
   OLMADAN yeniden yazar; donemHostOnarZincir'in microtask+setTimeout-0 zinciri TEK atımlıktır
   → defer görevi bu timer'ı geçtiğinde (script ağ/cache gecikmesi) onarım hiç koşmaz ve
   gerçek tarayıcıda #donem-secici 0 kalır. donemOnarimPlanla(): yb.innerHTML'e bağlı TEK
   seferlik MutationObserver kurar; kart-içi seçici silinen her yb yazımında donemHostOnar()'ı
   setTimeout 0 ile planlar. Observer tek kez kurulur (idempotent); host zaten kuruluysa veya
   kart-içi seçici varsa işlem yapmaz → her render'da çoğaltma/console spam YOK. */
function donemOnarimPlanla() {
  try {
    if (typeof document === "undefined") return;
    var yb0 = document.getElementById("yonetimBolum");
    if (!yb0 || yb0.__donemOnarimBagli) return;
    yb0.__donemOnarimBagli = true;
    if (typeof MutationObserver !== "function") return;
    var mo = new MutationObserver(function () {
      var k = null;
      try { k = document.getElementById("yonetimBolum"); } catch (e1) { k = null; }
      if (k && k.__donemOnarimBagli === false) return; /* yb yeniden kurulduysa eski observer yok sayar */
      var ici = false;
      try { ici = !!(k && k.innerHTML && k.innerHTML.indexOf('id="donemSeciciKutu"') !== -1); } catch (e2) { ici = false; }
      if (ici) return; /* kart-içi seçici mevcut — host gerekmez */
      var h = null;
      try { h = document.getElementById("donem-ui-host"); } catch (e3) { h = null; }
      if (h) return; /* host zaten kurulu — işlem yok */
      try { setTimeout(donemHostOnar, 0); } catch (e4) {}
    });
    try { mo.observe(yb0, { childList: true, subtree: false, attributes: false, characterData: false }); } catch (e5) {}
  } catch (e6) {}
}
/* DONEM-DOM-SELF-CHECK: #donem-ui-host / #donem-secici / #yeni-donem-btn DOM'da eksikse
   console.error ile AÇIK hata; varsa sayıları + aktif dönem id'sini raporlar.
   Yalnızca boot'un en sonunda 1 kez çağrılır (bkz. Başlangıç bölümü) — render başına DEĞİL. */
function donemOzDenetim() {
  try {
    if (typeof document === "undefined") return;
    var sayac = function (id) {
      try { if (document.querySelectorAll) { var n = document.querySelectorAll('[id="' + id + '"]').length; if (n) return n; } } catch (e1) {}
      try { return document.getElementById(id) ? 1 : 0; } catch (e2) { return 0; }
    };
    var h = sayac("donem-ui-host"), s = sayac("donem-secici"), b = sayac("yeni-donem-btn");
    var yb = null;
    try { yb = document.getElementById("yonetimBolum"); } catch (e3) { yb = null; }
    var kartIci = false;
    try { kartIci = !!(yb && yb.innerHTML && yb.innerHTML.indexOf('id="donemSeciciKutu"') !== -1); } catch (e4) { kartIci = false; }
    if ((h < 1 && !kartIci) || s < 1 || b < 1) {
      console.error("[DONEM-DOM-SELF-CHECK] Dönem kontrolü DOM'da EKSİK: host=" + h + " secici=" + s + " buton=" + b + " kartIciSecici=" + kartIci + " — donemOnarimPlanla observer'ı ve donemHostOnar() onarımını bekliyor.");
      return;
    }
    var ak = "";
    try { ak = (typeof aktifDonemId === "function") ? String(aktifDonemId()) : String((typeof DB !== "undefined") && DB ? DB.aktifDonemId : "?"); } catch (e5) { ak = "?"; }
    console.info("[DONEM-DOM-SELF-CHECK] host=" + h + " secici=" + s + " buton=" + b + " kartIciSecici=" + kartIci + " · aktifDonemId=" + ak);
  } catch (e6) { try { console.error("[DONEM-DOM-SELF-CHECK] öz-denetim hatası: " + e6); } catch (e7) {} }
}
`;

/* ---- YAMALA (bellekte; assert'ler geçmeden yazma YOK) ---- */
let yeni = kaynak;
yeni = tekDegistir(yeni, A_HOST, "  if (host) { donemHostTazele(host); return; } /* zaten kurulu — no-op + seçenekleri tazele */\n  try { if (typeof console !== \"undefined\" && console.info) console.info(\"[DONEM-DOM-DÜZELTMESİ] kalıcı dönem kontrolü kuruldu (#donem-ui-host).\"); } catch (eK) {}\n", "A2: host kurulum tek seferlik kanıt log'u");
yeni = tekDegistir(yeni, A_ZINCIR, PLANLA_BLOK + A_ZINCIR, "B: donemOnarimPlanla/donemOzDenetim ekleme");
yeni = tekDegistir(yeni, A_SEC, "function sec(ad) { ui.sekme = ad; renderYonetim(); donemOnarimPlanla(); } /* DONEM-DOM-DÜZELTMESİ: alt sekme değişimlerinde de tek onarım planlanır (idempotent guard) */", "C: sec() kuyruk bağlantısı");
yeni = tekDegistir(yeni, A_BOOT, A_BOOT + "\ndonemOnarimPlanla(); /* DONEM-DOM-DÜZELTMESİ: boot'un en son noktası — observer mutlaka kurulur */\n/* DONEM-DOM-SELF-CHECK: yalnızca BİR KEZ, onarım zinciri bittikten sonra (setTimeout 0) raporlar — render döngüsünde DEĞİL. */\nsetTimeout(donemOzDenetim, 0);", "D: boot son noktası + self-check (ertelenmiş)");

/* ---- YAZMA SONRASI (bellek) DOĞRULAMALAR ---- */
const postKontroller = [
  ["function donemOnarimPlanla(", 1], ["function donemOzDenetim(", 1],
  ["donemOnarimPlanla();", 2], ["setTimeout(donemOzDenetim, 0);", 1], ["donemOzDenetim();", 0],
  ["new MutationObserver", 1], ["donemHostOnarZincir();", 1],
  ["__donemOnarimBagli", 3], ["mo.observe(", 1],
  ["[DONEM-DOM-DÜZELTMESİ] kalıcı dönem kontrolü kuruldu", 1]
];
for (const [igne, beklenen] of postKontroller) {
  if (say(yeni, igne) !== beklenen) { console.error("ASSERT başarısız (sonrası): \"" + igne + "\" beklenen " + beklenen + ", bulunan " + say(yeni, igne)); process.exit(1); }
}
if (say(yeni, DAMGA) < 3) { console.error("ASSERT başarısız (sonrası): self-check damgası eksik"); process.exit(1); }
for (const igne of [A_SEC.split(" ")[0] + " sec(ad)", A_ZINCIR, "function donemHostOnar()"]) {
  if (say(yeni, igne) !== 1) { console.error("ASSERT başarısız (sonrası): " + igne + " bozuldu"); process.exit(1); }
}

/* ---- YAZ ---- */
writeFileSync(HEDEF, yeni);
const sonrasiSha = sha(readFileSync(HEDEF, "utf8"));
console.log("DONEM-DOM-DÜZELTMESİ uygulandı (yalnız app.js, 3 hedefli bölge, silme 0).");
console.log("  önce: " + oncesiSha + " (" + oncesiBayt + " B)");
console.log("  sonra: " + sonrasiSha + " (" + statSync(HEDEF).size + " B)");
console.log("  yedekler: " + bakA + (existsSync(bakA) ? " (mevcut, korunmuş)" : " (YOK!)") + " · " + bakB + " (bu yamanın ön-durumu)");
