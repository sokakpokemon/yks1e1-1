/* ks-yama-d53-svg-raster.mjs — D53-SVG-RASTER uygulayıcısı (ks-yama-*.mjs konvansiyonu, İDEMPOTENT).

   KANIT:
     • D52'den SONRA indirilen GERÇEK PNG'de turuncu çizgi YİNE YOK (kullanıcı görseli).
     • Statik cizgi-tani.html'de A/B/C/D/E bloklarının HEPSİ tarayıcıda görünüyor → inline SVG
       gerçekten boyanıyor ve konum doğru (V1 = right 8 / top 0.5) ⇒ kusur html2canvas'ın inline
       SVG'yi data:image/svg+xml'e SERİLEŞTİRME adımında (SVGElementContainer).
     • ÇÖZÜM (bu yama): html2canvas çağrısına `onclone` eklenir; klonda YALNIZ svg#fk-logo,
       konum stili AYNEN taşınan bir <img> ile değiştirilir; src = data:image/svg+xml;charset=utf-8,
       + TEMİZ standalone SVG (açık width="21" height="8.4", viewBox 0 0 100 40, iki path
       #f29222 / stroke-width 14 / stroke-linecap round; position/right/top/overflow/height:auto/
       style İÇERMEZ). Böylece serileştirme adımı devre dışı kalır.
     • html2canvas option'ları (option string assertion'ı ks-ders-karti.mjs'te AYNEN kalır),
       scale/callback akışı, diğer SVG'ler ve tüm kilitli değerler DEĞİŞMEZ.

   DEĞİŞMEZ (kilitli): 'formul' · font (MontsKart/Montserrat 900 italic) · #d31d24 · #f29222 ·
   #1a1a1a · SVG width 21/80 · viewBox 0 0 100 40 · iki path (M15 10 L95 10 / M14 29 L94 29) ·
   stroke-width 14 · stroke-linecap round · fk-logo id · right 8px/30px · top 0.5px/2px ·
   display:block · overflow:visible · z-index:1 · ölçek çarpanı 0.2647 · alt yazı 2px ·
   modern footer · D46 emojileri · eleman sırası · koordinat V1 DEĞİŞMEZ.

   TEST TARAFI: ks-ders-karti.mjs'e +2 dar kapı → SUITE_DONE 119 → 121 (silme/gevşetme YOK).
   Donmuş beşli ELLE: suit-manifest.mjs · elle-vaka-manifesti.mjs · elle-vaka-adlari-base.mjs ·
   suit-vakalar/ks-ders-karti.mjs.txt + sayaç (3 yer). test.mjs süit listesi DOKUNULMAZ.
   SENKRON: kök app.js → public/dist/isolate; index.html + dist + isolate ?v= yeni SHA16.

   KURALLAR
     • Her hedef dizge TAM beklenen sayıda geçmeli; ön kontrol geçmezse HİÇBİR ŞEY yazılmaz.
     • Varsayılan koşu: app.js'te D53-SVG-RASTER işareti varsa no-op → exit 2.
     • `--tamamla`: işaret kapısını atlar; yalnız uygulanmamış kuralları uygular; iş yoksa exit 2.
     • `--kuru`: HİÇBİR ŞEY YAZMADAN üretilecek blokları basar (ön kontrol öncesi çıkar). */
import { readFileSync, writeFileSync, existsSync, statSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const MARKER = "D53-SVG-RASTER";
const APP = "app.js";
const MST = "logo-master/formul-kurs-logo.html";
const SUIT = "ks-ders-karti.mjs";
const BASE = "elle-vaka-adlari-base.mjs";
const VAKA = "suit-vakalar/ks-ders-karti.mjs.txt";
const ESKI_SAYI = 119, YENI_SAYI = 121, K = 2;
const OLC = 0.2647, KART_W = 21, KART_H = 8.4, MST_W = 80, MST_H = 32;
const TAMAMLA = process.argv.includes("--tamamla");

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kez = (d, s) => d.split(s).length - 1;

const G1 = "D53 SVG raster: html2canvas onclone VAR + klonda YALNIZ #fk-logo hedeflenir + img konum stili klondaki SVG'den AYNEN (yedek literal kart SVG style'ıyla birebir)";
const G2 = "D53 SVG raster: standalone data-URI SVG'de position/right/top/overflow/height:auto YOK + width 21 + height 8.4 + viewBox AÇIK + 2 path #f29222 stroke-width 14 linecap round";

/* ---------- İDEMPOTENT KAPISI ---------- */
if (!existsSync(APP)) { console.error("HEDEF YOK: " + APP); process.exit(1); }
const appIlk = readFileSync(APP, "utf8");
if (appIlk.includes(MARKER) && !TAMAMLA) {
  console.log(MARKER + ": zaten uygulanmış → hiçbir dosyaya dokunulmadı (no-op).");
  console.log("(Kısmi kurulum tamamlamak için: node ks-yama-d53-svg-raster.mjs --tamamla)");
  process.exit(2);
}

/* ---------- YEDEK: yoksa oluştur, varsa ASLA üzerine yazma ---------- */
const YEDEKLER = [
  { kaynak: APP, yedek: "app.js.d53-svg-raster-oncesi.bak" },
  { kaynak: MST, yedek: "logo-master/formul-kurs-logo.html.d53-oncesi.bak" },
];
for (const y of YEDEKLER) {
  if (!existsSync(y.kaynak)) { console.error("HEDEF YOK: " + y.kaynak); process.exit(1); }
  if (!existsSync(y.yedek)) {
    writeFileSync(y.yedek, readFileSync(y.kaynak));
    console.log("Yedek : " + y.yedek + " OLUŞTURULDU · " + statSync(y.yedek).size + " B · SHA-256 " + sha(readFileSync(y.yedek)));
  } else {
    console.log("Yedek : " + y.yedek + " ZATEN VAR (üzerine yazılmadı) · " + statSync(y.yedek).size + " B · SHA-256 " + sha(readFileSync(y.yedek)));
  }
}
const ONCE = { byte: Buffer.byteLength(appIlk, "utf8"), sha: sha(appIlk), satir: appIlk.split("\n").length };
console.log("Önce : " + APP + " · " + ONCE.byte + " B · " + ONCE.satir + " satır · SHA-256 " + ONCE.sha);
const mstIlk = readFileSync(MST, "utf8");
console.log("Önce : " + MST + " · " + Buffer.byteLength(mstIlk, "utf8") + " B · " + mstIlk.split("\n").length + " satır · SHA-256 " + sha(mstIlk));

/* ---------- app.js KURALLARI ---------- */
const APP_ANKRA = "var dersKartiIndirildi = false;\nfunction dersKartiAc(dersId) {";
const RASTER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + KART_W + '" height="' + KART_H + '" viewBox="0 0 100 40">' +
  '<path d="M15 10 L95 10" fill="none" stroke="#f29222" stroke-width="14" stroke-linecap="round"/>' +
  '<path d="M14 29 L94 29" fill="none" stroke="#f29222" stroke-width="14" stroke-linecap="round"/></svg>';
const KONUM_STIL = "position:absolute;right:8px;top:0.5px;height:" + KART_H + "px;display:block;overflow:visible;z-index:1";

const APP_EK = [
  "/* " + MARKER + ": html2canvas klonunda (onclone) inline SVG yerine TEMİZ standalone data-URI img.",
  "   SEBEP (kanıtlı): D52'den sonra indirilen GERÇEK PNG'de turuncu çizgi yine yok. Statik cizgi-tani.html'de",
  "   A–E bloklarının HEPSİ tarayıcıda görünüyor (inline SVG boyanıyor, koordinat V1 = right 8 / top 0.5 doğru)",
  "   ⇒ kusur html2canvas'ın inline SVG'yi data:image/svg+xml'e SERİLEŞTİRME adımında. Klonda YALNIZ",
  "   svg#fk-logo hedeflenir ve konum stili AYNEN taşınan bir img ile değiştirilir; kaynak SVG zaten TEMİZ",
  "   standalone (açık width/height attribute + viewBox + iki path) olduğu için serileştirme adımı devre dışı kalır.",
  "   DEĞİŞMEZ: path/viewBox/stroke #f29222/stroke-width 14/linecap round/width 21/right 8/top 0.5/0.2647,",
  "   footer, D46 emojileri, alt yazı 2px; html2canvas option'ları ve akış (scale/callback) DEĞİŞMEDİ. */",
  "var FK_LOGO_RASTER_SVG = '" + RASTER_SVG + "';",
  "function fkLogoRaster(klonDoc) {",
  "  var klon = klonDoc.getElementById(\"fk-logo\");",
  "  if (!klon || !klon.parentNode) { return; }",
  "  var img = klonDoc.createElement(\"img\");",
  "  img.setAttribute(\"alt\", \"\");",
  "  img.setAttribute(\"src\", \"data:image/svg+xml;charset=utf-8,\" + encodeURIComponent(FK_LOGO_RASTER_SVG));",
  "  /* Konum stili klondaki SVG'den AYNEN alınır (yedek: kart SVG'sinin kendi style'ı) — koordinat TEK kaynaktan. */",
  "  img.setAttribute(\"style\", klon.getAttribute(\"style\") || \"" + KONUM_STIL + "\");",
  "  klon.parentNode.replaceChild(img, klon);",
  "}",
  "",
  APP_ANKRA,
].join("\n");

/* HTML2CANVAS OPTION ÇEKİRDEĞİ: ks-ders-karti.mjs'teki option assertion'ıyla BİREBİR aynı dizi (DEĞİŞMEZ). */
const OPT_CEKIRDEK = 'backgroundColor: "#f4f6fa", useCORS: false, allowTaint: false, foreignObjectRendering: false, logging: false';
const APP_OPT_ON = OPT_CEKIRDEK + ' });';
const APP_OPT_SN = OPT_CEKIRDEK + ', onclone: fkLogoRaster });';

const APP_KURALLARI = [
  { on: APP_ANKRA, sn: APP_EK },
  { on: APP_OPT_ON, sn: APP_OPT_SN },
];

/* ---------- master KURALLARI (yalnız kayıt notu; master dosyası render yoluna GİRMEZ) ---------- */
const MST_NOT_ON = "  width/viewBox/path/stroke-width/renk/right/top/ölçek DEĞİŞMEDİ.";
const MST_NOT_SN = MST_NOT_ON + "\n\n" +
  "  " + MARKER + ": master'da ölçü DEĞİŞİKLİĞİ YOK (bu dosya html2canvas'a hiç girmez). Kart tarafında PNG\n" +
  "  yolu düzeltildi: html2canvas klonunda (onclone) YALNIZ svg#fk-logo, konum stili AYNEN taşınan standalone\n" +
  "  data-URI img ile değiştirilir (açık width 21 / height 8.4 + viewBox + iki path; position/right/top/overflow/\n" +
  "  height:auto İÇERMEZ) → serileştirme adımı devre dışı kalır. Kilitli değerler ve eleman sırası DEĞİŞMEDİ.";
const MST_KURALLARI = [
  { on: MST_NOT_ON, sn: MST_NOT_SN },
];

/* ---------- ks-ders-karti.mjs KURALLARI ---------- */
const D53_ANKRA = "/* D33 font kapısı: gömülü aile MONTSSKART (italic 900) · 'Montserrat' ve CDN referansı YOK.";
const D53_BLOK = [
  "",
  "/* ---- " + MARKER + ": turuncu çizgiler GERÇEK PNG'de hâlâ YOK. Statik cizgi-tani.html'de A–E bloklarının",
  "   HEPSİ görünüyor (inline SVG boyanıyor, koordinat V1 = right 8 / top 0.5 doğru) ⇒ kusur html2canvas'ın",
  "   inline SVG'yi data:image/svg+xml'e SERİLEŞTİRME adımında. Çözüm: klonda (onclone) YALNIZ svg#fk-logo,",
  "   konum stili AYNEN taşınan bir img ile değiştirilir; kaynak SVG zaten TEMİZ standalone (açık width/height",
  "   attribute + viewBox + iki path) olduğu için serileştirme adımı devre dışı kalır. html2canvas option'ları,",
  "   scale/callback akışı ve tüm kilitli değerler DEĞİŞMEDİ (diğer SVG'lere DOKUNULMAZ). */",
  "t(\"" + G1 + "\", (() => {",
  "  const i0 = appKaynak.indexOf(\"function fkLogoRaster(\");",
  "  if (i0 < 0) return false;",
  "  const i1 = appKaynak.indexOf(\"\\n}\", i0);",
  "  const blok = appKaynak.slice(i0, i1 > 0 ? i1 : appKaynak.length);",
  "  const h = dersKartiHTML(birebir);",
  "  const svgStil = (h.match(/<svg id=\"fk-logo\"[^>]*style=\"([^\"]*)\"/) || [])[1] || \"\";",
  "  const yedek = (blok.match(/\"position:absolute;[^\"]*\"/) || [])[0] || \"\";",
  "  return (appKaynak.match(/onclone:/g) || []).length === 1 &&",
  "    appKaynak.includes(\"onclone: fkLogoRaster\") &&",
  "    (blok.match(/getElementById\\(/g) || []).length === 1 &&",
  "    blok.includes('getElementById(\"fk-logo\")') &&",
  "    blok.includes('klon.getAttribute(\"style\")') &&",
  "    blok.includes(\"replaceChild(img, klon)\") &&",
  "    svgStil === \"" + KONUM_STIL + "\" &&",
  "    yedek.length > 2 && yedek.slice(1, -1) === svgStil;",
  "})());",
  "t(\"" + G2 + "\", (() => {",
  "  const m = appKaynak.match(/var FK_LOGO_RASTER_SVG = '([^']*)'/);",
  "  if (!m) return false;",
  "  const s = m[1];",
  "  const yasak = [\"position:\", \"absolute\", \"right:\", \"top:\", \"overflow\", \"height:auto\", \"style=\", \"display:block\", \"z-index\"];",
  "  const kart = (dersKartiHTML(birebir).match(/<svg id=\"fk-logo\"[^>]*>/) || [])[0] || \"\";",
  "  return !yasak.some(y => s.includes(y)) &&",
  "    s.includes('width=\"" + KART_W + "\"') && s.includes('height=\"" + KART_H + "\"') &&",
  "    s.includes('viewBox=\"0 0 100 40\"') && s.includes('xmlns=\"http://www.w3.org/2000/svg\"') &&",
  "    (s.match(/<path /g) || []).length === 2 &&",
  "    (s.match(/stroke=\"#f29222\"/g) || []).length === 2 &&",
  "    (s.match(/stroke-width=\"14\"/g) || []).length === 2 &&",
  "    (s.match(/stroke-linecap=\"round\"/g) || []).length === 2 &&",
  "    s.includes('d=\"M15 10 L95 10\"') && s.includes('d=\"M14 29 L94 29\"') &&",
  "    kart.includes('width=\"" + KART_W + "\"') && Math.abs(" + MST_H + " * " + OLC + " - " + KART_H + ") < 0.1;",
  "})());",
].join("\n");
const SUIT_KURALLARI = [
  { on: D53_ANKRA, sn: D53_BLOK + "\n" + D53_ANKRA },
  { on: '+ __kosan + ":119")', sn: '+ __kosan + ":' + YENI_SAYI + '")', beklenen: 2 },
  { on: "__kosan !== 119", sn: "__kosan !== " + YENI_SAYI },
  { on: "beklenen=119", sn: "beklenen=" + YENI_SAYI },
];

/* ---------- donmuş manifest KURALLARI ---------- */
const D52_EK = "· D52-SVG-HEIGHT: 118 + 1 (height:auto kaldırıldı → açık ölçü: kart 8.4px / master 32px) */";
const D53_EK = " · " + MARKER + ": " + ESKI_SAYI + " + " + K + " (onclone klonunda YALNIZ #fk-logo → standalone data-URI img · raster SVG'de konum/height:auto YOK + açık width/height) */";
const MANIFEST_KURALLARI = [
  { dosya: "suit-manifest.mjs", on: '"ks-ders-karti.mjs": 119,', sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + "," },
  { dosya: "suit-manifest.mjs", on: D52_EK, sn: D52_EK.replace(/ \*\/$/, "") + D53_EK },
  { dosya: "elle-vaka-manifesti.mjs", on: '"ks-ders-karti.mjs": 119,', sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + "," },
  { dosya: "elle-vaka-manifesti.mjs", on: D52_EK, sn: D52_EK.replace(/ \*\/$/, "") + D53_EK },
];

/* ---------- ad ekleme (txt + elle base) ---------- */
const D52_AD = "D52 SVG yükseklik: style'da height:auto YOK + açık yükseklik (kart 8.4px · master 32px = width × 40/100) — html2canvas PNG yolu";
const YENI_ADLAR = [G1, G2];
/* D53 adları, koşumdaki D52 adından SONRA gelmeli (test.mjs adları SIRALI karşılaştırır). */
const LISTE_EKLEME = [
  { dosya: VAKA, ankra: D52_AD, satirTabanli: false },
  { dosya: BASE, ankra: '    "' + D52_AD + '",', satirTabanli: true },
];

const raporlar = [];
let appYazildi = false;

function kuralUygula(dosya, kurallar) {
  const metin = readFileSync(dosya, "utf8");
  const hepsiUygulanmis = kurallar.every(k => kez(metin, k.sn) === (k.beklenen === undefined ? 1 : k.beklenen));
  if (hepsiUygulanmis) { raporlar.push("ATLA  " + dosya + " → kurallar zaten uygulanmış"); return false; }
  for (const k of kurallar) {
    const bek = k.beklenen === undefined ? 1 : k.beklenen;
    const nOn = kez(metin, k.on), nSn = kez(metin, k.sn);
    if (nSn === bek) continue;
    if (nOn !== bek) {
      console.error("FAIL-CLOSED: " + dosya + ' · "' + k.on.slice(0, 60) + '…" on-kez=' + nOn + " (beklenen " + bek + ") ve yeni-hâl yok → HİÇBİR ŞEY YAZILMADI");
      process.exit(1);
    }
  }
  let yeni = metin;
  for (const k of kurallar) {
    const bek = k.beklenen === undefined ? 1 : k.beklenen;
    if (kez(yeni, k.sn) === bek) continue;
    yeni = yeni.split(k.on).join(k.sn);
  }
  writeFileSync(dosya, yeni);
  if (dosya === APP) appYazildi = true;
  raporlar.push("YAZ   " + dosya + " · " + Buffer.byteLength(yeni, "utf8") + " B · " + yeni.split("\n").length + " satır");
  return true;
}

function listeEkle(k) {
  const metin = readFileSync(k.dosya, "utf8");
  if (metin.includes(YENI_ADLAR[0])) { raporlar.push("ATLA  " + k.dosya + " → D53 adları zaten var"); return false; }
  const satirlar = metin.split("\n");
  const idx = satirlar.indexOf(k.ankra);
  if (idx < 0) { console.error("FAIL-CLOSED: " + k.dosya + " ankra bulunamadı: " + k.ankra); process.exit(1); }
  const eklenecek = YENI_ADLAR.map(a => k.satirTabanli ? '    "' + a + '",' : a);
  satirlar.splice(idx + 1, 0, ...eklenecek);
  writeFileSync(k.dosya, satirlar.join("\n"));
  raporlar.push("YAZ   " + k.dosya + " → +" + YENI_ADLAR.length + " satır (" + satirlar.length + " satır)");
  return true;
}

/* ---------- --kuru: HİÇBİR ŞEY YAZILMADAN üretilecek metinleri göster ---------- */
if (process.argv.includes("--kuru")) {
  console.log("===== app.js INSERT =====\n" + APP_EK);
  console.log("===== app.js OPTION =====\n" + APP_OPT_SN);
  console.log("===== ks-ders-karti.mjs BLOCK =====\n" + D53_BLOK);
  console.log("===== master NOTE =====\n" + MST_NOT_SN);
  console.log("===== D53 EK =====\n" + D53_EK);
  process.exit(0);
}

/* ---------- ÖN KONTROL: hiçbir bayt yazılmadan TÜM kurallar doğrulanır ---------- */
{
  let hata = null;
  for (const k of LISTE_EKLEME) {
    const metin = readFileSync(k.dosya, "utf8");
    if (metin.includes(YENI_ADLAR[0])) continue;
    if (metin.split("\n").indexOf(k.ankra) < 0) hata = "liste ankrası yok: " + k.dosya;
  }
  const KONTROL = [[SUIT, SUIT_KURALLARI], [MST, MST_KURALLARI], [APP, APP_KURALLARI]]
    .concat(MANIFEST_KURALLARI.map(m => [m.dosya, [{ on: m.on, sn: m.sn }]]));
  for (const [d, ks] of KONTROL) {
    const metin = readFileSync(d, "utf8");
    for (const k of ks) {
      const bek = k.beklenen === undefined ? 1 : k.beklenen;
      if (kez(metin, k.sn) === bek) continue;
      if (kez(metin, k.on) !== bek) hata = d + ' · "' + k.on.slice(0, 50) + '…" on-kez=' + kez(metin, k.on) + " (beklenen " + bek + ")";
    }
  }
  if (hata) { console.error("ÖN KONTROL FAIL-CLOSED: " + hata + " → HİÇBİR ŞEY YAZILMADI"); process.exit(1); }
  console.log("Ön kontrol: tüm kurallar doğrulandı (henüz hiçbir şey yazılmadı).");
}

let isYapildi = false;
for (const k of LISTE_EKLEME) if (listeEkle(k)) isYapildi = true;
for (const m of MANIFEST_KURALLARI) if (kuralUygula(m.dosya, [{ on: m.on, sn: m.sn }])) isYapildi = true;
if (kuralUygula(SUIT, SUIT_KURALLARI)) isYapildi = true;
if (kuralUygula(MST, MST_KURALLARI)) isYapildi = true;
if (kuralUygula(APP, APP_KURALLARI)) isYapildi = true;
raporlar.forEach(r => console.log(r));

/* ---------- söz dizimi + sert kanıt ---------- */
execFileSync(process.execPath, ["--check", APP], { stdio: "pipe" });
console.log("node --check " + APP + " ✓");
execFileSync(process.execPath, ["--check", SUIT], { stdio: "pipe" });
console.log("node --check " + SUIT + " ✓");

const appYeni = readFileSync(APP, "utf8");
const mstYeni = readFileSync(MST, "utf8");
const svgTag = (s) => (s.match(/<svg id="fk-logo"[\s\S]*?<\/svg>/) || [])[0] || "";
const kartSvg = svgTag(appYeni);
const raster = (appYeni.match(/var FK_LOGO_RASTER_SVG = '([^']*)'/) || [])[1] || "";
const kanitlar = [
  [appYeni.includes(MARKER), "app.js marker"],
  [(appYeni.match(/onclone:/g) || []).length === 1 && appYeni.includes("onclone: fkLogoRaster"), "onclone TEK + fkLogoRaster"],
  [kartSvg !== "" && kartSvg === svgTag(appIlk), "kart fk-logo SVG markup'ı DEĞİŞMEDİ"],
  [kez(appYeni, "id=\"fk-logo\"") === 1, "fk-logo TEK"],
  [kez(appYeni, OPT_CEKIRDEK) === 1 && kez(appYeni, "onclone: fkLogoRaster") === 1, "html2canvas option string (scale/backgroundColor/useCORS/allowTaint/foreignObjectRendering/logging) DEĞİŞMEDİ + onclone eklendi"],
  [kez(appYeni, "html2canvas(el,") === kez(appIlk, "html2canvas(el,") && kez(appYeni, "scale:") === kez(appIlk, "scale:"), "html2canvas çağrı sayısı/scale DEĞİŞMEDİ"],
  [raster.includes('width="' + KART_W + '"') && raster.includes('height="' + KART_H + '"') && raster.includes('viewBox="0 0 100 40"'), "raster SVG açık width/height + viewBox"],
  [!["position:", "absolute", "right:", "top:", "overflow", "height:auto", "style="].some(y => raster.includes(y)), "raster SVG'de konum/height:auto/style YOK"],
  [(raster.match(/<path /g) || []).length === 2 && (raster.match(/stroke="#f29222"/g) || []).length === 2 && (raster.match(/stroke-width="14"/g) || []).length === 2 && (raster.match(/stroke-linecap="round"/g) || []).length === 2, "raster SVG: 2 path · #f29222 · stroke-width 14 · linecap round"],
  [appYeni.includes('klon.getAttribute("style")') && appYeni.includes(KONUM_STIL), "img konum stili klondan + yedek literal kilitli koordinat"],
  [kez(appYeni, "margin-top:2px;margin-right:14px") === 1 && kez(appYeni, "<span style=\"display:block\">") === 5, "alt yazı 2px + modern footer korundu"],
  [kez(appYeni, "d=\"M15 10 L95 10\"") === 2 && kez(appYeni, "d=\"M14 29 L94 29\"") === 2, "path'ler: kart SVG'de 1 + raster sabitte 1 (TOPLAM 2)"],
  [["🎓", "🏫", "📅", "📚", "📝"].every(e => kez(appYeni, e) === kez(appIlk, e)), "D46 emojileri DEĞİŞMEDİ"],
  [mstYeni.includes(MARKER) && mstYeni.includes("top:2px;height:" + MST_H + "px") && mstYeni.includes('width="' + MST_W + '"'), "master kilitli değerler korundu + D53 kaydı"],
  [readFileSync(SUIT, "utf8").includes("beklenen=" + YENI_SAYI) && readFileSync(VAKA, "utf8").split("\n").filter(s => s.trim() !== "").length === YENI_SAYI, "sayaç + vaka txt = " + YENI_SAYI],
];
const dusen = kanitlar.filter(k => !k[0]).map(k => k[1]);
if (dusen.length) { console.error("KANIT DÜŞTÜ: " + dusen.join(" · ")); process.exit(1); }
console.log("Kanıt: " + kanitlar.map(k => k[1]).join(" · "));

/* ---------- SENKRON + DAMGA (idempotent) ---------- */
const SONRA = { byte: Buffer.byteLength(appYeni, "utf8"), sha: sha(appYeni) };
if (appYazildi) {
  console.log("Sonra: " + APP + " · " + SONRA.byte + " B · " + appYeni.split("\n").length + " satır · SHA-256 " + SONRA.sha + " · SHA16 " + SONRA.sha.slice(0, 16));
  console.log("Sonra: " + MST + " · " + Buffer.byteLength(mstYeni, "utf8") + " B · " + mstYeni.split("\n").length + " satır · SHA-256 " + sha(mstYeni) + " · SHA16 " + sha(mstYeni).slice(0, 16));
}
const YENI_SHA16 = SONRA.sha.slice(0, 16);
let senkronVar = false;
for (const h of ["public", "dist", "isolate"]) {
  const yol = h + "/" + APP;
  const k = sha(readFileSync(yol));
  if (k === SONRA.sha) { console.log("Senkron: " + yol + " ZATEN EŞİT ✓ " + k.slice(0, 16)); continue; }
  copyFileSync(APP, yol);
  if (sha(readFileSync(yol)) !== SONRA.sha) { console.error("SENKRON DÜŞTÜ: " + yol); process.exit(1); }
  senkronVar = true;
  console.log("Senkron: " + yol + " ✓ " + YENI_SHA16 + " (önceki " + k.slice(0, 16) + ")");
}
for (const d of ["index.html", "dist/index.html", "isolate/index.html"]) {
  const s = readFileSync(d, "utf8");
  const bulunan = [...s.matchAll(/app\.js\?v=[0-9a-f]{16}/g)].map(m => m[0]);
  if (bulunan.length !== 1) { console.error("DAMGA FAIL-CLOSED: " + d + " · damga kez=" + bulunan.length); process.exit(1); }
  if (bulunan[0] === "app.js?v=" + YENI_SHA16) { console.log("Damga : " + d + " ZATEN GÜNCEL ✓"); continue; }
  writeFileSync(d, s.replace(/app\.js\?v=[0-9a-f]{16}/g, "app.js?v=" + YENI_SHA16));
  senkronVar = true;
  console.log("Damga : " + d + " → app.js?v=" + YENI_SHA16 + " (önceki " + bulunan[0] + ")");
}
console.log("NOT  : " + MST + " dist/isolate'e KOPYALANMAZ (yalnız kök kaynak belge).");

if (!isYapildi && !senkronVar) {
  console.log(MARKER + ": yapacak iş yok (kurallar + senkron + damga yerinde).");
  process.exit(2);
}
console.log(MARKER + " TAMAM. (varsayılan koşu bundan sonra no-op exit 2 olur.)");
