/* ks-yama-d52-svg-height.mjs — D52-SVG-HEIGHT uygulayıcısı (ks-yama-*.mjs konvansiyonu, İDEMPOTENT).

   KANIT (D51 A/B + statik tanı sayfası):
     • cizgi-tani.html'de A (üretimdeki tam markup), B (kırmızı/kalın çizgi), C (sade inline SVG),
       D (img/data-URI), E (turuncu CSS kutusu) → TARAYICIDA HEPSİ GÖRÜNÜYOR. Yani inline SVG
       gerçekten boyanıyor; koordinat da doğru (V1 = right 8 / top 0.5).
     • Buna karşılık UYGULAMADAN İNEN PNG'de turuncu çizgi YOK → kusur PNG (html2canvas) yolunda.
     • Mekanizma (vendor/html2canvas.js 1.4.1 okunarak): SVGElementContainer kopyaya
       setAttribute("width", …+"px") + setAttribute("height", …+"px") yazıp XMLSerializer ile
       data:image/svg+xml üretiyor; AMA klonda satır-içi "height:auto" kalıyor ve ATTRIBUTE'u
       EZİYOR (CSS > presentation attribute). Tek başına kalan SVG belgesinde "auto" yükseklik
       güvenilir çözülmediği için çizgiler raster'da kayboluyor.
     • ÇÖZÜM (bu yama): satır-içi "height:auto" KALDIRILIR, yerine AÇIK ölçü konur:
         kart   : width 21 × 40/100 = 8.4px
         master : width 80 × 40/100 = 32px   (ve 32 × 0.2647 = 8.47 ≈ 8.4 — ölçek korunur)
       html2canvas OPTION'ları ve ks-ders-karti.mjs:184 DEĞİŞMEZ.

   DEĞİŞMEZ (kilitli): 'formul' · font (MontsKart/Montserrat 900 italic) · #d31d24 · #f29222 ·
   #1a1a1a · SVG width 21/80 · viewBox 0 0 100 40 · iki path (M15 10 L95 10 / M14 29 L94 29) ·
   stroke-width 14 · stroke-linecap round · fk-logo id · right 8px/30px · top 0.5px/2px ·
   display:block · overflow:visible · z-index:1 · ölçek çarpanı 0.2647 · alt yazı 2px ·
   modern footer · eleman sırası.

   TEST TARAFI: ks-ders-karti.mjs'e +1 dar kapı → SUITE_DONE 118 → 119. Sözleşme değiştiği için
   D33 token'ı ve D47 kapısının "height:auto" beklentisi yeni sözleşmeye ÇEVRİLİR (silme/gevşetme
   yok; aynı güçte, yalnız beklenen değer/ad güncellenir — D33'ün ad-güncelleme örneğiyle aynı).
   Donmuş listeler ELLE: suit-manifest.mjs · elle-vaka-manifesti.mjs · elle-vaka-adlari-base.mjs ·
   suit-vakalar/ks-ders-karti.mjs.txt. test.mjs süit listesi DOKUNULMAZ.
   SENKRON: kök app.js → public/dist/isolate; index.html + dist + isolate ?v= yeni SHA16.

   KURALLAR
     • Her hedef dizge TAM beklenen sayıda geçmeli; ön kontrol geçmezse HİÇBİR ŞEY yazılmaz.
     • Varsayılan koşu: app.js'te D52-SVG-HEIGHT işareti varsa no-op → exit 2.
     • `--tamamla`: işaret kapısını atlar; yalnız uygulanmamış kuralları uygular; iş yoksa exit 2. */
import { readFileSync, writeFileSync, existsSync, statSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const MARKER = "D52-SVG-HEIGHT";
const APP = "app.js";
const MST = "logo-master/formul-kurs-logo.html";
const SUIT = "ks-ders-karti.mjs";
const BASE = "elle-vaka-adlari-base.mjs";
const VAKA = "suit-vakalar/ks-ders-karti.mjs.txt";
const ESKI_SAYI = 118, YENI_SAYI = 119, K = 1;
const OLC = 0.2647, KART_H = 8.4, MST_H = 32;
const TAMAMLA = process.argv.includes("--tamamla");

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kez = (d, s) => d.split(s).length - 1;

const YENI_AD =
  "D52 SVG yükseklik: style'da height:auto YOK + açık yükseklik (kart 8.4px · master 32px = width × 40/100) — html2canvas PNG yolu";

/* ---------- İDEMPOTENT KAPISI ---------- */
if (!existsSync(APP)) { console.error("HEDEF YOK: " + APP); process.exit(1); }
const appIlk = readFileSync(APP, "utf8");
if (appIlk.includes(MARKER) && !TAMAMLA) {
  console.log(MARKER + ": zaten uygulanmış → hiçbir dosyaya dokunulmadı (no-op).");
  console.log("(Kısmi kurulum tamamlamak için: node ks-yama-d52-svg-height.mjs --tamamla)");
  process.exit(2);
}

/* ---------- YEDEK: yoksa oluştur, varsa ASLA üzerine yazma ---------- */
const YEDEKLER = [
  { kaynak: APP, yedek: "app.js.d52-svg-height-oncesi.bak" },
  { kaynak: MST, yedek: "logo-master/formul-kurs-logo.html.d52-oncesi.bak" },
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
const SVG_ON = "right:8px;top:0.5px;height:auto;display:block;overflow:visible;z-index:1";
const SVG_SN = "right:8px;top:0.5px;height:" + KART_H + "px;display:block;overflow:visible;z-index:1";
const APP_KURALLARI = [
  { on: SVG_ON, sn: SVG_SN },
  { on: "function dersKartiHTML(d) {",
    sn: "/* " + MARKER + ": kart SVG'sinin \"height:auto\" bildirimi KALDIRILDI → açık \"height:" + KART_H + "px\"\n" +
        "   (width 21 × 40/100). Sebep: html2canvas 1.4.1 SVGElementContainer kopyaya width/height ATTRIBUTE'u\n" +
        "   yazıp serileştiriyor; satır-içi \"height:auto\" o attribute'u ezdiği için tek başına SVG'de yükseklik\n" +
        "   çözülemiyor ve turuncu çizgiler PNG'de kayboluyordu (aynı markup HTML'de görünüyordu).\n" +
        "   width/viewBox/path/stroke/right/top ve tüm kilitli değerler DEĞİŞMEDİ. */\n" +
        "function dersKartiHTML(d) {" },
];

/* ---------- master KURALLARI ---------- */
const MST_SVG_ON = "right:30px;top:2px;height:auto;display:block;overflow:visible";
const MST_SVG_SN = "right:30px;top:2px;height:" + MST_H + "px;display:block;overflow:visible";
const MST_OLCEK_ON = "    SVG top             2px     → 0.5px";
const MST_OLCEK_SN = MST_OLCEK_ON + "\n" +
  "    SVG height          32px    → 8.4px (width × 40/100 · D52-SVG-HEIGHT: height:auto KALDIRILDI)";
const MST_NOT_ON = "  stroke-width ve eleman sırası DEĞİŞMEDİ (turuncu çizgilere dokunulmadı: bkz. ks-yama-d49 teşhis notu).";
const MST_NOT_SN = MST_NOT_ON + "\n\n" +
  "  D52-SVG-HEIGHT: SVG'nin satır-içi \"height:auto\" bildirimi KALDIRILDI, yerine AÇIK ölçü konuldu\n" +
  "  (master 32px = 80 × 40/100 · kart 8.4px = 21 × 40/100 · 32 × 0.2647 = 8.47 ≈ 8.4 → ölçek korunur).\n" +
  "  Sebep: html2canvas 1.4.1 SVGElementContainer kopyaya width/height ATTRIBUTE'u yazıp serileştiriyor;\n" +
  "  satır-içi \"height:auto\" o attribute'u ezdiği için tek başına SVG belgesinde yükseklik çözülemiyor ve\n" +
  "  turuncu çizgiler PNG'de kayboluyordu — aynı markup HTML'de görünüyordu (statik cizgi-tani.html A–E).\n" +
  "  width/viewBox/path/stroke-width/renk/right/top/ölçek DEĞİŞMEDİ.";
const MST_KURALLARI = [
  { on: MST_SVG_ON, sn: MST_SVG_SN },
  { on: MST_OLCEK_ON, sn: MST_OLCEK_SN },
  { on: MST_NOT_ON, sn: MST_NOT_SN },
];

/* ---------- ks-ders-karti.mjs KURALLARI ---------- */
const D47_ESKI_AD = "D47 logo hiza: iki path #f29222 + fk-logo SVG marka kutusunda + görünürlük engeli YOK (overflow:hidden yok · z-index var · height:auto)";
const D47_YENI_AD = "D47 logo hiza: iki path #f29222 + fk-logo SVG marka kutusunda + görünürlük engeli YOK (overflow:hidden yok · z-index var · height:8.4px)";
const D52_ANKRA = "/* D33 font kapısı: gömülü aile MONTSSKART (italic 900) · 'Montserrat' ve CDN referansı YOK.";
const D52_BLOK = [
  "",
  "/* ---- D52-SVG-HEIGHT: kart SVG style'ındaki \"height:auto\" KALDIRILDI, açık ölçü konuldu.",
  "   SEBEP (kanıtlı): statik cizgi-tani.html'de A–E bloklarının HEPSİ tarayıcıda görünüyor (inline SVG",
  "   boyanıyor, koordinat doğru) ama uygulamadan inen PNG'de çizgi yok → kusur html2canvas yolunda.",
  "   html2canvas 1.4.1 SVGElementContainer kopyaya width/height ATTRIBUTE'u yazar; satır-içi",
  "   \"height:auto\" o attribute'u ezer ve tek başına SVG'de yükseklik çözülemez → raster'da çizgi kaybolur.",
  "   Açık ölçü: kart 8.4px (21×40/100) · master 32px (80×40/100) · 32×0.2647 = 8.47 ≈ 8.4.",
  "   width/viewBox/path/stroke/right/top/renk/ölçek DEĞİŞMEDİ; html2canvas option'ları DEĞİŞMEDİ. */",
  "t(\"" + YENI_AD + "\", (() => {",
  "  if (!existsSync(\"logo-master/formul-kurs-logo.html\")) return false;",
  "  const h = dersKartiHTML(birebir);",
  "  const m = readFileSync(\"logo-master/formul-kurs-logo.html\", \"utf8\");",
  "  const bas = h.indexOf('id=\"fk-logo\"'), son = h.indexOf(\"</svg>\", bas);",
  "  if (bas < 0 || son < 0) return false;",
  "  const svg = h.slice(bas, son + 6);",
  "  const kartOk = svg.includes(\"height:\" + " + KART_H + " + \"px\") && !svg.includes(\"top:0.5px;height:auto\");",
  "  const mstOk = m.includes(\"top:2px;height:\" + " + MST_H + " + \"px\") && !m.includes(\"top:2px;height:auto\");",
  "  return kartOk && mstOk && Math.abs(" + MST_H + " * " + OLC + " - " + KART_H + ") < 0.1;",
  "})());",
].join("\n");
const SUIT_KURALLARI = [
  { on: "→ width 21 · right 8 · top 0.5 · height:auto", sn: "→ width 21 · right 8 · top 0.5 · height 8.4px (D52-SVG-HEIGHT: height:auto KALDIRILDI)" },
  { on: ',"height:auto",', sn: ',"height:' + KART_H + 'px",' },
  { on: D47_ESKI_AD, sn: D47_YENI_AD },
  { on: 'svg.includes("height:auto")', sn: 'svg.includes("height:' + KART_H + 'px")' },
  { on: D52_ANKRA, sn: D52_BLOK + "\n" + D52_ANKRA },
  { on: '+ __kosan + ":118")', sn: '+ __kosan + ":' + YENI_SAYI + '")', beklenen: 2 },
  { on: "__kosan !== 118", sn: "__kosan !== " + YENI_SAYI },
  { on: "beklenen=118", sn: "beklenen=" + YENI_SAYI },
];

/* ---------- donmuş liste KURALLARI ---------- */
const MANIFEST_KURALLARI = [
  { dosya: "suit-manifest.mjs",
    on: '"ks-ders-karti.mjs": 118,',
    sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + ",",
    ekOn: "· D49-LOGO-FOOTER: 115 + 3 (alt yazı 2px ölçek kapısı + footer 6 blok/birebir + imza ayraç-harf aralığı) */",
    ekSn: "· D49-LOGO-FOOTER: 115 + 3 (alt yazı 2px ölçek kapısı + footer 6 blok/birebir + imza ayraç-harf aralığı) · D52-SVG-HEIGHT: " + ESKI_SAYI + " + " + K + " (height:auto kaldırıldı → açık ölçü: kart 8.4px / master 32px) */" },
  { dosya: "elle-vaka-manifesti.mjs",
    on: '"ks-ders-karti.mjs": 118,',
    sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + ",",
    ekOn: "· D49-LOGO-FOOTER: 115 + 3 (alt yazı 2px ölçek kapısı + footer 6 blok/birebir + imza ayraç-harf aralığı) */",
    ekSn: "· D49-LOGO-FOOTER: 115 + 3 (alt yazı 2px ölçek kapısı + footer 6 blok/birebir + imza ayraç-harf aralığı) · D52-SVG-HEIGHT: " + ESKI_SAYI + " + " + K + " (height:auto kaldırıldı → açık ölçü: kart 8.4px / master 32px) */" },
];

/* ---------- ad değişimi + yeni ad (txt + elle base) ---------- */
const TXT_BASE_KURALLARI = [
  { dosya: VAKA, on: D47_ESKI_AD, sn: D47_YENI_AD },
  { dosya: BASE, on: '    "' + D47_ESKI_AD + '",', sn: '    "' + D47_YENI_AD + '",' },
];
const ANKRA_AD = "D49 footer imza: ince ayraç (hairline border-top) + harf aralıklı (letter-spacing) satır";
/* D52 adı, koşumdaki D47+D49 adlarından SONRA gelmeli (test.mjs adları SIRALI karşılaştırır). */
const LISTE_EKLEME = [
  { dosya: VAKA, ankra: ANKRA_AD },
  { dosya: BASE, baslangic: '    "D49 footer imza: ince ayraç', satirTabanli: true },
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
  if (metin.includes(YENI_AD)) { raporlar.push("ATLA  " + k.dosya + " → D52 adı zaten var"); return false; }
  const satirlar = metin.split("\n");
  const idx = k.ankra !== undefined ? satirlar.indexOf(k.ankra) : satirlar.findIndex(s => s.startsWith(k.baslangic));
  if (idx < 0) { console.error("FAIL-CLOSED: " + k.dosya + " ankra bulunamadı: " + (k.ankra || k.baslangic)); process.exit(1); }
  satirlar.splice(idx + 1, 0, k.satirTabanli ? '    "' + YENI_AD + '",' : YENI_AD);
  writeFileSync(k.dosya, satirlar.join("\n"));
  raporlar.push("YAZ   " + k.dosya + " → +1 satır (" + satirlar.length + " satır)");
  return true;
}

/* ---------- ÖN KONTROL: hiçbir bayt yazılmadan TÜM kurallar doğrulanır ---------- */
{
  let hata = null;
  for (const k of TXT_BASE_KURALLARI.concat(LISTE_EKLEME.map(x => x)).filter(x => x.on !== undefined)) {
    const metin = readFileSync(k.dosya, "utf8");
    if (kez(metin, k.sn) === 1) continue;
    if (kez(metin, k.on) !== 1) hata = k.dosya + ' · "' + k.on.slice(0, 50) + '…" on-kez=' + kez(metin, k.on);
  }
  for (const k of LISTE_EKLEME) {
    const metin = readFileSync(k.dosya, "utf8");
    if (metin.includes(YENI_AD)) continue;
    const satirlar = metin.split("\n");
    const idx = k.ankra !== undefined ? satirlar.indexOf(k.ankra) : satirlar.findIndex(s => s.startsWith(k.baslangic));
    if (idx < 0) hata = "liste ankrası yok: " + k.dosya;
  }
  const KONTROL = [[SUIT, SUIT_KURALLARI], [MST, MST_KURALLARI], [APP, APP_KURALLARI]]
    .concat(MANIFEST_KURALLARI.map(m => [m.dosya, [{ on: m.on, sn: m.sn }, { on: m.ekOn, sn: m.ekSn }]]));
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
for (const k of TXT_BASE_KURALLARI) if (kuralUygula(k.dosya, [k])) isYapildi = true;
for (const m of MANIFEST_KURALLARI) if (kuralUygula(m.dosya, [{ on: m.on, sn: m.sn }, { on: m.ekOn, sn: m.ekSn }])) isYapildi = true;
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
const appSvg = appYeni.match(/<svg id="fk-logo"[^>]*>/)[0];
const kanitlar = [
  [appYeni.includes(MARKER), "app.js marker"],
  [kez(appYeni, SVG_SN) === 1 && kez(appYeni, SVG_ON) === 0, "kart SVG: açık height tek, height:auto yok"],
  [appSvg.includes('width="21"') && appSvg.includes('viewBox="0 0 100 40"'), "kart SVG width/viewBox DEĞİŞMEDİ"],
  [kez(appYeni, "id=\"fk-logo\"") === 1, "fk-logo TEK"],
  [kez(appYeni, "M15 10 L95 10") === kez(appIlk, "M15 10 L95 10") && kez(appYeni, "M14 29 L94 29") === kez(appIlk, "M14 29 L94 29"), "SVG path'leri DEĞİŞMEDİ"],
  [kez(appYeni, "stroke-width=\"14\"") === kez(appIlk, "stroke-width=\"14\"") && kez(appYeni, "stroke=\"#f29222\"") === kez(appIlk, "stroke=\"#f29222\"") && kez(appYeni, "stroke-linecap=\"round\"") === kez(appIlk, "stroke-linecap=\"round\""), "stroke/linecap DEĞİŞMEDİ"],
  [kez(appYeni, "right:8px;top:0.5px") === 1, "kart right/top DEĞİŞMEDİ"],
  [kez(appYeni, "margin-top:2px;margin-right:14px") === 1 && kez(appYeni, "<span style=\"display:block\">") === 5, "alt yazı 2px + modern footer korundu"],
  [kez(appYeni, "html2canvas(el,") === kez(appIlk, "html2canvas(el,") && kez(appYeni, "scale:") === kez(appIlk, "scale:"), "html2canvas çağrı/option'ları DEĞİŞMEDİ"],
  [kez(mstYeni, MST_SVG_SN) === 1 && kez(mstYeni, MST_SVG_ON) === 0, "master SVG: açık height tek, height:auto yok"],
  [mstYeni.includes('width="80"') && mstYeni.includes('viewBox="0 0 100 40"') && kez(mstYeni, 'stroke-width="14"') === 2 && kez(mstYeni, 'stroke="#f29222"') === 2, "master width/viewBox/stroke DEĞİŞMEDİ (2 path)"],
  [mstYeni.includes("font-size:8.5rem") && mstYeni.includes("margin-top:7.56px"), "master kilitli değerler korundu"],
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
