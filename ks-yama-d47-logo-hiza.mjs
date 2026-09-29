/* ks-yama-d47-logo-hiza.mjs — D47-LOGO-HIZA uygulayıcısı (ks-yama-*.mjs konvansiyonu, İDEMPOTENT).
   TEK İŞ: "kurs merkezi" alt yazısını marka kutusunun (brand-container · display:flex/row) İÇİNDEN
   çıkarıp dış sarmalayıcının (logo-wrapper · column/align-items:flex-end) 2. çocuğu yapmak —
   İKİ dosyada AYNI yapısal düzeltme (tek kaynak korunur):
     1) app.js → dersKartiHTML öğrenci kartı logo bloğu
     2) logo-master/formul-kurs-logo.html (TEK KAYNAK) → aynı taşıma

   NEDEN (ADIM 0 teşhisi, kanıtlı): marka kutusu row olduğu için SVG'nin right:8px ölçüsü kutunun
   SAĞ KENARINA — yani "kurs merkezi"nin bitişine — göre hesaplanıyordu; turuncu çift çizgi "u"
   harfinin üstüne değil ~90-110px sağa düşüyordu. Alt yazı kutu DIŞINA çıkınca kutunun sağ kenarı
   = marka metni bitişi olur. (Ölçülen 4 şüpheli sebep — overflow/z-index/yükseklik/stroke — ELENDİ.)

   DEĞİŞMEZ (kilitli): 'formul' · #d31d24 · 900 italic · 2.25rem (master 8.5rem) · -1.05px/-4px ·
   line-height 0.85 · viewBox 0 0 100 40 · iki path M15 10 L95 10 / M14 29 L94 29 · stroke-width 14 ·
   stroke-linecap round · #f29222 · fk-logo id · SVG width 21/80 · right 8px/30px · top 0.5px/2px ·
   'kurs merkezi' 0.74rem/2.8rem · -0.4px/-1.5px · margin-top 0/-3px · margin-right 14px/53px ·
   #1a1a1a · ölçek çarpanı 0.2647 · sarmalayıcı column+align-items:flex-end+padding 5px/19px ·
   marka kutusu display:flex;align-items:flex-start. Yeni SVG / üretici / renk / ölçek YOK.

   TEST TARAFI: ks-ders-karti.mjs'e +2 assertion → SUITE_DONE 113 → 115; donmuş listeler ELLE:
     suit-manifest.mjs · elle-vaka-manifesti.mjs · elle-vaka-adlari-base.mjs ·
     suit-vakalar/ks-ders-karti.mjs.txt. Bayat yorum kaynağı düzeltilir: app.js:4642-4650 → 4865-4872.
   SENKRON: kök app.js → public/dist/isolate; index.html + dist/index.html + isolate/index.html
     ?v= = yeni SHA16. logo-master dist/isolate'e KOPYALANMAZ (yalnız kök kaynak belge).

   KURALLAR
     • Her hedef dizge TAM olarak beklenen sayıda geçmeli (aksi hâlde HİÇBİR ŞEY yazılmaz, fail-closed).
     • Kural bazlı idempotentlik: hedef zaten YENİ hâlinde ise o kural "uygulanmış" sayılır ve atlanır.
     • Varsayılan koşu: app.js'te D47-LOGO-HIZA işareti varsa HİÇBİR dosyaya dokunmaz → exit 2.
     • `node ks-yama-d47-logo-hiza.mjs --tamamla`: işaret kapısını atlar; YALNIZ henüz uygulanmamış
       kuralları uygular; yapacak iş yoksa exit 2.
     • Bu dosya neden gerekli: elle-vaka-adlari-base.mjs 2579 satırdır ve Freebuff dosya aracı derin
       satırları (≈600+) eşleştiremiyor — proje bu yüzden ks-yama-*.mjs geleneğini kullanır. */
import { readFileSync, writeFileSync, existsSync, statSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const MARKER = "D47-LOGO-HIZA";
const APP = "app.js";
const MST = "logo-master/formul-kurs-logo.html";
const SUIT = "ks-ders-karti.mjs";
const BASE = "elle-vaka-adlari-base.mjs";
const VAKA = "suit-vakalar/ks-ders-karti.mjs.txt";
const ESKI_SAYI = 113, YENI_SAYI = 115, K = 2;
const TAMAMLA = process.argv.includes("--tamamla");

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kez = (d, s) => d.split(s).length - 1;

const YENI_ADLAR = [
  "D47 logo hiza: 'kurs merkezi' marka kutusunun DIŞINDA (brand-container <div>/</div> dengesi) — sarmalayıcının 2. çocuğu",
  "D47 logo hiza: iki path #f29222 + fk-logo SVG marka kutusunda + görünürlük engeli YOK (overflow:hidden yok · z-index var · height:auto)",
];

/* ---------- İDEMPOTENT KAPISI (varsayılan koşu) ---------- */
if (!existsSync(APP)) { console.error("HEDEF YOK: " + APP); process.exit(1); }
const appIlk = readFileSync(APP, "utf8");
if (appIlk.includes(MARKER) && !TAMAMLA) {
  console.log(MARKER + ": zaten uygulanmış → hiçbir dosyaya dokunulmadı (no-op).");
  console.log("(Kısmi kurulum tamamlamak için: node ks-yama-d47-logo-hiza.mjs --tamamla)");
  process.exit(2);
}

/* ---------- YEDEK: yoksa oluştur, varsa ASLA üzerine yazma ---------- */
const YEDEKLER = [
  { kaynak: APP, yedek: "app.js.d47-logo-hiza-oncesi.bak" },
  { kaynak: MST, yedek: "logo-master/formul-kurs-logo.html.d47-oncesi.bak" },
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
console.log("Önce : " + MST + " · " + Buffer.byteLength(mstIlk, "utf8") + " B · SHA-256 " + sha(mstIlk));

/* ---------- app.js KURALLARI (alt yazıyı marka kutusundan çıkar + marker) ---------- */
const SUB_ESKI =
  "        '<div style=\"font-family:MontsKart,serif;font-size:0.74rem;font-weight:900;font-style:italic;letter-spacing:-0.4px;margin-top:0;margin-right:14px;color:#1a1a1a;white-space:nowrap\">kurs merkezi</div>' +\n" +
  "        '</div>' +";
const SUB_YENI =
  "        '</div>' +\n" +
  "        '<div style=\"font-family:MontsKart,serif;font-size:0.74rem;font-weight:900;font-style:italic;letter-spacing:-0.4px;margin-top:0;margin-right:14px;color:#1a1a1a;white-space:nowrap\">kurs merkezi</div>' +";

const APP_KURALLARI = [
  { on: SUB_ESKI, sn: SUB_YENI },
  { on: "function dersKartiHTML(d) {",
    sn: "/* " + MARKER + ": \"kurs merkezi\" alt yazısı marka kutusunun DIŞINA alındı (logo-wrapper'ın 2. çocuğu) —\n" +
        "   SVG right:8px artık marka METNİ bitişine göre ölçülür; kilitli değer/ölçek/renk/path DEĞİŞMEDİ. */\n" +
        "function dersKartiHTML(d) {" },
];

/* ---------- master KURALLARI (aynı taşıma + not bloğu) ---------- */
const MST_ESKI =
  "    <div class=\"sub-text\"\n" +
  "         style=\"font-family:'Montserrat',sans-serif;font-size:2.8rem;font-weight:900;font-style:italic;letter-spacing:-1.5px;margin-top:-3px;margin-right:53px;color:#1a1a1a;white-space:nowrap\">kurs merkezi</div>\n" +
  "\n" +
  "  </div>";
const MST_YENI =
  "  </div>\n" +
  "\n" +
  "  <div class=\"sub-text\"\n" +
  "       style=\"font-family:'Montserrat',sans-serif;font-size:2.8rem;font-weight:900;font-style:italic;letter-spacing:-1.5px;margin-top:-3px;margin-right:53px;color:#1a1a1a;white-space:nowrap\">kurs merkezi</div>";
const MST_NOT_ON = "  bölünmesiyle birebir geriye çözülmüştür (2.25rem / 0.2647 = 8.5rem — tam).";
const MST_NOT_SN = MST_NOT_ON + "\n\n" +
  "  D47-LOGO-HIZA: alt yazı (\"kurs merkezi\") marka kutusunun (brand-container) DIŞINA alındı;\n" +
  "  artık logo-wrapper'ın 2. çocuğu (sarmalayıcı column + align-items:flex-end → marka kutusunun\n" +
  "  altında sağa hizalı). Marka kutusu İÇİNDEKİ sıra (formul → SVG) ve tüm kilitli değerler\n" +
  "  DEĞİŞMEDİ. (YASAK listesindeki \"hizalama/sıra\" marka kutusunun İÇİ içeriği için geçerlidir.)";

const MST_KURALLARI = [
  { on: MST_ESKI, sn: MST_YENI },
  { on: MST_NOT_ON, sn: MST_NOT_SN },
];

/* ---------- ks-ders-karti.mjs KURALLARI (+2 assertion · yorum · sayaç) ---------- */
const ANKRA =
  "  return kademe && m.includes(\"ÖLÇEK\") && m.includes(\"logo-wrapper\") && m.includes(\"brand-container\");\n" +
  "})());";

const D47_BLOK = [
  "",
  "/* ---- D47-LOGO-HIZA: 'kurs merkezi' alt yazısı marka kutusunun (brand-container) DIŞINA alındı →",
  "   artık sarmalayıcının 2. çocuğu (column + align-items:flex-end). KUSUR: sub-text kutu İÇİNDE (row)",
  "   iken SVG'nin right:8px ölçüsü kutunun SAĞ KENARINA (sub-text bitişine) göre hesaplanıyordu →",
  "   turuncu çift çizgi 'u' harfinin üstüne değil ~90-110px sağa düşüyordu. Kilitli değerler/ölçek/renk/",
  "   path/viewBox/stroke-width DEĞİŞMEDİ; yeni SVG/üretici YOK (SVG sayısı 2 → 2). */",
  "function fkKutuKapanis(h) {",
  "  const kutu = '<div style=\"position:relative;display:flex;align-items:flex-start;white-space:nowrap\">';",
  "  const bas = h.indexOf(kutu);",
  "  if (bas < 0) return -1;",
  "  const etiket = /<div\\b|<\\/div>/g;",
  "  etiket.lastIndex = bas;",
  "  let derinlik = 0, m;",
  "  while ((m = etiket.exec(h)) !== null) {",
  "    if (m[0] === \"</div>\") { derinlik--; if (derinlik === 0) return m.index; }",
  "    else derinlik++;",
  "  }",
  "  return -1;",
  "}",
  "const D47_KUTU = '<div style=\"position:relative;display:flex;align-items:flex-start;white-space:nowrap\">';",
  "t(\"" + YENI_ADLAR[0] + "\", (() => { const h = dersKartiHTML(birebir); const kapanis = fkKutuKapanis(h); if (kapanis < 0) return false; const merkezi = h.indexOf(\">kurs merkezi</div>\"); const logo = h.indexOf('id=\"fk-logo\"'); return merkezi > kapanis && logo > h.indexOf(D47_KUTU) && logo < kapanis; })());",
  "t(\"" + YENI_ADLAR[1] + "\", (() => { const h = dersKartiHTML(birebir); const bas = h.indexOf('id=\"fk-logo\"'); const son = h.indexOf(\"</svg>\", bas); if (bas < 0 || son < 0) return false; const svg = h.slice(bas, son + 6); return (svg.match(/<path /g) || []).length === 2 && (svg.match(/stroke=\"#f29222\"/g) || []).length === 2 && svg.includes(\"height:auto\") && svg.includes(\"z-index:1\") && svg.includes(\"overflow:visible\") && !svg.includes(\"overflow:hidden\") && bas > h.indexOf(D47_KUTU) && bas < fkKutuKapanis(h); })());",
].join("\n");

const SUIT_KURALLARI = [
  { on: ANKRA, sn: ANKRA + "\n" + D47_BLOK },
  { on: "(markup app.js:4642-4650)", sn: "(markup app.js:4865-4872)" },
  { on: '+ __kosan + ":113")', sn: '+ __kosan + ":' + YENI_SAYI + '")', beklenen: 2 },
  { on: "__kosan !== 113", sn: "__kosan !== " + YENI_SAYI },
  { on: "beklenen=113", sn: "beklenen=" + YENI_SAYI },
];

/* ---------- donmuş liste KURALLARI ---------- */
const MANIFEST_KURALLARI = [
  { dosya: "suit-manifest.mjs",
    on: '"ks-ders-karti.mjs": 113,',
    sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + ', /* D47-LOGO-HIZA: ' + ESKI_SAYI + ' + ' + K + ' (alt yazı marka kutusunun DIŞINDA/denge + çizgi görünürlük) */' },
  { dosya: "elle-vaka-manifesti.mjs",
    on: '"ks-ders-karti.mjs": 113, /* D33-LOGO-KİLİDİ: 109 + 1 yeni master-kaynak kapısı (logo-master/formul-kurs-logo.html) · D46-KART-EMOJI: 110 + 3 (bento emoji öneki + etiket metni korundu + SVG yerine geçmedi) */',
    sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + ', /* D33-LOGO-KİLİDİ: 109 + 1 yeni master-kaynak kapısı (logo-master/formul-kurs-logo.html) · D46-KART-EMOJI: 110 + 3 (bento emoji öneki + etiket metni korundu + SVG yerine geçmedi) · D47-LOGO-HIZA: ' + ESKI_SAYI + ' + ' + K + ' (alt yazı marka kutusunun DIŞINDA/denge + çizgi görünürlük) */' },
];

/* ---------- LİSTE EKLEME (aynı 2 ad, iki dosya: txt + elle base) ---------- */
const LISTE_EKLEME = [
  { dosya: VAKA, ankra: "D33 logo master kaynağı logo-master/formul-kurs-logo.html VAR (8.5rem tabanı · kilitli path/viewBox/stroke-width/renkler/900-italik) + kademe = master × 0.2647 (2.25rem ≈ 8.5×0.2647)" },
  { dosya: BASE, baslangic: '    "D33 logo master kaynağı', satirTabanli: true },
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
  if (YENI_ADLAR.every(a => metin.includes(a))) { raporlar.push("ATLA  " + k.dosya + " → D47 adları zaten var"); return false; }
  const satirlar = metin.split("\n");
  const idx = k.ankra !== undefined ? satirlar.indexOf(k.ankra) : satirlar.findIndex(s => s.startsWith(k.baslangic));
  if (idx < 0) { console.error("FAIL-CLOSED: " + k.dosya + " ankra bulunamadı: " + (k.ankra || k.baslangic)); process.exit(1); }
  satirlar.splice(idx + 1, 0, ...YENI_ADLAR.map(a => (k.satirTabanli ? "    \"" + a + "\"," : a)));
  writeFileSync(k.dosya, satirlar.join("\n"));
  raporlar.push("YAZ   " + k.dosya + " → +" + YENI_ADLAR.length + " satır (" + satirlar.length + " satır)");
  return true;
}

let isYapildi = false;
for (const k of LISTE_EKLEME) if (listeEkle(k)) isYapildi = true;
for (const m of MANIFEST_KURALLARI) if (kuralUygula(m.dosya, [m])) isYapildi = true;
if (kuralUygula(SUIT, SUIT_KURALLARI)) isYapildi = true;
if (kuralUygula(MST, MST_KURALLARI)) isYapildi = true;
if (kuralUygula(APP, APP_KURALLARI)) isYapildi = true;

raporlar.forEach(r => console.log(r));

if (!isYapildi) {
  console.log(MARKER + ": yapacak iş yok (tüm kurallar zaten uygulanmış).");
  process.exit(2);
}

/* ---------- söz dizimi kapısı + sert kanıt ---------- */
execFileSync(process.execPath, ["--check", APP], { stdio: "pipe" });
console.log("node --check " + APP + " ✓");
execFileSync(process.execPath, ["--check", SUIT], { stdio: "pipe" });
console.log("node --check " + SUIT + " ✓");

const appYeni = readFileSync(APP, "utf8");
const mstYeni = readFileSync(MST, "utf8");
const svgYeni = kez(appYeni, "<svg");
const kanitlar = [
  [appYeni.includes(MARKER), "app.js marker"],
  [kez(appYeni, SUB_YENI) === 1 && kez(appYeni, SUB_ESKI) === 0, "app.js taşıma (tek yeni hâl, eski hâl yok)"],
  [kez(appYeni, "id=\"fk-logo\"") === 1, "fk-logo TEK"],
  [svgYeni === kez(appIlk, "<svg"), "SVG sayısı sabit (" + svgYeni + ")"],
  [kez(mstYeni, MST_YENI) === 1 && kez(mstYeni, MST_ESKI) === 0, "master taşıma (tek yeni hâl, eski hâl yok)"],
  [mstYeni.includes("font-size:8.5rem") && mstYeni.includes("stroke=\"#f29222\"") && mstYeni.includes("viewBox=\"0 0 100 40\""), "master kilitli değerler korundu"],
];
const dusen = kanitlar.filter(k => !k[0]).map(k => k[1]);
if (dusen.length) { console.error("KANIT DÜŞTÜ: " + dusen.join(" · ")); process.exit(1); }
console.log("Kanıt: " + kanitlar.map(k => k[1]).join(" · "));

/* ---------- SENKRON + DAMGA (yalnız app.js BU koşuda yazıldıysa) ---------- */
if (appYazildi) {
  const SONRA = { byte: Buffer.byteLength(appYeni, "utf8"), sha: sha(appYeni) };
  console.log("Sonra: " + APP + " · " + SONRA.byte + " B · SHA-256 " + SONRA.sha + " · SHA16 " + SONRA.sha.slice(0, 16));
  console.log("Sonra: " + MST + " · " + Buffer.byteLength(mstYeni, "utf8") + " B · SHA-256 " + sha(mstYeni) + " · SHA16 " + sha(mstYeni).slice(0, 16));
  for (const h of ["public", "dist", "isolate"]) {
    copyFileSync(APP, h + "/" + APP);
    const k = sha(readFileSync(h + "/" + APP));
    if (k !== SONRA.sha) { console.error("SENKRON DÜŞTÜ: " + h + "/" + APP); process.exit(1); }
    console.log("Senkron: " + h + "/" + APP + " ✓ " + k.slice(0, 16));
  }
  const ESKI_SHA16 = ONCE.sha.slice(0, 16), YENI_SHA16 = SONRA.sha.slice(0, 16);
  for (const d of ["index.html", "dist/index.html", "isolate/index.html"]) {
    const s = readFileSync(d, "utf8");
    const eskiDizge = "app.js?v=" + ESKI_SHA16, yeniDizge = "app.js?v=" + YENI_SHA16;
    if (kez(s, eskiDizge) !== 1) { console.error("DAMGA FAIL-CLOSED: " + d + " · eski damga kez=" + kez(s, eskiDizge)); process.exit(1); }
    writeFileSync(d, s.split(eskiDizge).join(yeniDizge));
    console.log("Damga : " + d + " → app.js?v=" + YENI_SHA16);
  }
  console.log("NOT  : " + MST + " dist/isolate'e KOPYALANMAZ (yalnız kök kaynak belge).");
} else {
  console.log("app.js bu koşuda değişmedi → senkron/damga adımı atlandı (kök=public=dist=isolate zaten eşit).");
}
console.log(MARKER + " TAMAM. (varsayılan koşu bundan sonra no-op exit 2 olur.)");
