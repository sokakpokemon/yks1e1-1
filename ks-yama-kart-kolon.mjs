/* ks-yama-kart-kolon.mjs — KART-KOLON-YAMASI (idempotent, assert'li, fail-closed)
   Tek iş: planKart (Birebir Ders Planla) + havuzBolum (Öğrenci Birebir İstek Havuzu)
   kartlarını tek iki-kolon wrapper içine yerleştirir (masaüstü/tablet: yan yana,
   dar ekran: tek kolon). Kart id'leri, içerikleri, handler'lar ve veri modeli aynen korunur.
   2. koşu: "Zaten uygulanmış" der, exit 2, hiçbir dosyayı değiştirmez. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");

const AYRAC = "/* ---- Başlangıç ---- */";
const eskiSec = 'function sec(ad) { ui.sekme = ad; renderYonetim(); donemOnarimPlanla(); } /* DONEM-DOM-DÜZELTMESİ: alt sekme değişimlerinde de tek onarım planlanır (idempotent guard) */';
const yeniSec = 'function sec(ad) { ui.sekme = ad; renderYonetim(); donemOnarimPlanla(); kartKolonOnar(); } /* DONEM-DOM-DÜZELTMESİ: alt sekme değişimlerinde de tek onarım planlanır (idempotent guard) · KART-KOLON-YAMASI: sekme değişiminde iki-kolon wrapper onarımı */';

const CSS = `  /* KART-KOLON-YAMASI: plan + istek havuzu kartları masaüstü/tablet'te yan yana iki eşit kolon; dar ekranda tek kolon */
  #ks-kart-kolon { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 1rem; align-items: start; }
  #ks-kart-kolon > div { min-width: 0; max-width: 100%; overflow-wrap: break-word; }
  @media (max-width: 1023.98px) {
    #ks-kart-kolon { grid-template-columns: minmax(0,1fr); }
  }`;

const HELPER = `
/* KART-KOLON-YAMASI: iki-kolon wrapper onarımı (idempotent, silici yazım yok)
   planKart ve havuzBolum statik markup'ta tek #ks-kart-kolon wrapper'ının iki kolonunda
   durur; render'lar kartların İÇİNİ yazar (havuzBolum.innerHTML / form alanları),
   wrapper'a dokunmaz. Wrapper DOM'dan kaldırıldıysa (dış müdahale) orijinal yerinde
   yeniden kurulur; VARSA hiçbir şey yapmaz (duplicate imkânsız). */
function kartKolonMarkup() {
  var plan = document.getElementById("planKart");
  var havuz = document.getElementById("havuzBolum");
  if (!plan || !havuz) return null;
  var w = document.createElement("div");
  w.id = "ks-kart-kolon";
  var sol = document.createElement("div"); sol.id = "ks-kart-kolon-sol";
  var sag = document.createElement("div"); sag.id = "ks-kart-kolon-sag";
  sol.appendChild(plan); sag.appendChild(havuz);
  w.appendChild(sol); w.appendChild(sag);
  var parent = plan._kkEskiParent || null;
  return { w: w, sol: sol, sag: sag, parent: parent, sonraki: null };
}
function kartKolonOnar() {
  if (document.getElementById("ks-kart-kolon")) return; /* zaten var — dokunma */
  var plan = document.getElementById("planKart");
  var havuz = document.getElementById("havuzBolum");
  if (!plan || !havuz) return;
  var w = document.createElement("div"); w.id = "ks-kart-kolon";
  var sol = document.createElement("div"); sol.id = "ks-kart-kolon-sol";
  var sag = document.createElement("div"); sag.id = "ks-kart-kolon-sag";
  var parent = plan.parentNode;
  var sonraki = havuz.parentNode === parent ? havuz.nextSibling : null;
  sol.appendChild(plan); sag.appendChild(havuz);
  w.appendChild(sol); w.appendChild(sag);
  if (parent && parent.insertBefore) parent.insertBefore(w, sonraki);
  else if (parent && parent.appendChild) parent.appendChild(w);
}
`;

const eskiPlanTag = '  <section id="planKart" class="kart p-5 md:p-6">';
const yeniPlanTag = '  <div id="ks-kart-kolon" class="no-print">\n  <div id="ks-kart-kolon-sol" class="min-w-0">\n  <section id="planKart" class="kart p-5 md:p-6 min-w-0">';
const eskiHavuzBlok = '  <!-- ============ 3) İSTEK HAVUZU ============ -->\n  <section id="havuzBolum" class="no-print"></section>';
const yeniHavuzBlok = '  </div>\n  <div id="ks-kart-kolon-sag" class="min-w-0">\n  <!-- ============ 3) İSTEK HAVUZU ============ -->\n  <section id="havuzBolum" class="no-print min-w-0"></section>\n  </div>\n  </div>';

function ok(m, c) { if (!c) { console.error("✗ " + m); process.exit(1); } }

/* ---- 1) Fail-closed: idempotans kontrolü (yazma ÖNCE) ---- */
const htmlOnce = readFileSync("index.html", "utf8");
const appOnce = readFileSync("app.js", "utf8");
if (htmlOnce.includes('id="ks-kart-kolon"')) {
  console.log("Zaten uygulanmış — hiçbir dosya değişmedi.");
  process.exit(2);
}
ok("index.html'de planKart tam 1 kez", (htmlOnce.match(/id="planKart"/g) || []).length === 1);
ok("index.html'de havuzBolum tam 1 kez", (htmlOnce.match(/id="havuzBolum"/g) || []).length === 1);
ok("planKart havuzBolum'den önce (statik)", htmlOnce.indexOf('id="planKart"') < htmlOnce.indexOf('id="havuzBolum"'));
ok("hedef plan tag'i kaynakta tam 1 kez", htmlOnce.split(eskiPlanTag).length === 2);
ok("hedef havuz bloğu kaynakta tam 1 kez", htmlOnce.split(eskiHavuzBlok).length === 2);
ok("app.js'te eski sec() satırı tam 1 kez", appOnce.split(eskiSec).length === 2);
ok("app.js'te kartKolonOnar henüz yok", !appOnce.includes("kartKolonOnar"));
ok("app.js Başlangıç ayracı tam 1 kez", appOnce.split(AYRAC).length === 2);

/* ---- 2) Backup (mevcut backup üzerine YAZILMAZ) ---- */
if (!existsSync("index.html.kart-kolon-oncesi.bak")) copyFileSync("index.html", "index.html.kart-kolon-oncesi.bak");
if (!existsSync("app.js.kart-kolon-oncesi.bak")) copyFileSync("app.js", "app.js.kart-kolon-oncesi.bak");
const htmlBakSha = sha("index.html.kart-kolon-oncesi.bak");
const appBakSha = sha("app.js.kart-kolon-oncesi.bak");
ok("index backup yama öncesi birebir", htmlBakSha === sha("index.html"));
ok("app backup yama öncesi birebir", appBakSha === sha("app.js"));

/* ---- 3) index.html yaması ---- */
let html = htmlOnce;
html = html.replace(eskiPlanTag, yeniPlanTag);
html = html.replace(eskiHavuzBlok, yeniHavuzBlok);
ok("wrapper açılışı kondu", html.includes('id="ks-kart-kolon"'));
ok("wrapper içinde plan solda", html.indexOf('id="ks-kart-kolon-sol"') < html.indexOf('id="planKart"'));
ok("wrapper içinde havuz sağda", html.indexOf('id="ks-kart-kolon-sag"') < html.indexOf('id="havuzBolum"'));
ok("wrapper kapanışı havuzdan sonra (sag bloğu tam)", html.includes(yeniHavuzBlok) && html.indexOf(yeniHavuzBlok) > html.indexOf("<body"));
const cssKonum = html.indexOf("<title>deneme 1</title><!--probe-->");
ok("CSS konum bulundu", cssKonum !== -1);
html = html.replace("<title>deneme 1</title><!--probe-->", "<title>deneme 1</title><!--probe-->\n<style>\n" + CSS + "\n  </style>");
ok("responsive media query kaynakta", html.includes("@media (max-width: 1023.98px)"));
ok("grid-template-columns minmax çift kolon", html.includes("grid-template-columns: minmax(0,1fr) minmax(0,1fr)"));
ok("yamadan sonra planKart hâlâ tam 1 kez", (html.match(/id="planKart"/g) || []).length === 1);
ok("yamadan sonra havuzBolum hâlâ tam 1 kez", (html.match(/id="havuzBolum"/g) || []).length === 1);
ok("wrapper tam 1 kez", (html.match(/id="ks-kart-kolon"/g) || []).length === 1);

/* ---- 4) app.js yaması ---- */
let app = appOnce;
app = app.replace(eskiSec, yeniSec);
ok("sec() güncellendi", app.includes(yeniSec));
const ayracIdx = app.indexOf(AYRAC);
ok("Başlangıç ayracı bulundu", ayracIdx > 0);
app = app.slice(0, ayracIdx) + HELPER + "\n" + app.slice(ayracIdx);
ok("kartKolonOnar tanımı eklendi (tek)", (app.match(/function kartKolonOnar\(/g) || []).length === 1);
ok("sec() çağrısı var", app.includes("renderYonetim(); donemOnarimPlanla(); kartKolonOnar();"));

/* ---- 5) Yaz ---- */
writeFileSync("index.html", html);
writeFileSync("app.js", app);
console.log("KART-KOLON-YAMASI uygulandı ✓");
console.log("index.html: " + sha("index.html.kart-kolon-oncesi.bak").slice(0, 12) + "… → " + sha("index.html").slice(0, 12) + "…");
console.log("app.js:     " + sha("app.js.kart-kolon-oncesi.bak").slice(0, 12) + "… → " + sha("app.js").slice(0, 12) + "…");
