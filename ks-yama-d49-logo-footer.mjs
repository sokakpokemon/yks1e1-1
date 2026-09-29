/* ks-yama-d49-logo-footer.mjs — D49-LOGO-FOOTER uygulayıcısı (ks-yama-*.mjs konvansiyonu, İDEMPOTENT).

   ADIM 1 TEŞHİSİ (salt-okuma, ölçümle):
     • Font kimliği: kartın gömülü @font-face'i (MontsKart) ile vendor/fonts/montserrat-900-italic.woff2
       BİREBİR aynı dosya (sha16 7084156f0b371b85 · 18.624 B). WOFF2 kendim çözüldü (hmtx dönüşümsüz),
       upem 1000. "formul" advance'ları: f 426 · o 676 · r 456 · m 1040 · u 698 · l 326 fu (= 3.6220 em).
     • "u" harfinin ölçülen yeri:   kart 89.33 → 113.41 px (24.08 px) · master 337.33 → 428.26 px
     • Turuncu çift çizginin yeri:  kart 98.24 → 115.04 px (16.80 px) · master 370.59 → 434.59 px
       → master × 0.2647 = kart, TÜM noktalarda fark ≤ 0.17 px: çizgiler ölçek-tutarlı, YAPISAL KUSUR YOK.
         (D47'nin kaldırdığı ~90-110 px'lik kayma gerçekten gitmiş.) İki çizginin "u"ya göre konumu
         master ve kartta AYNI olduğu için bu bir TASARIM tercihi — kanıtlanmış bir HATA olmadığından
         D49'da ÇİZGİLERE DOKUNULMADI (kullanıcı kuralı: kanıtsız müdahale yok).
     • Alt yazı dikey boşluğu: kart margin-top 0 · master -3px → master × 0.2647 = kart eşitliği
       bu TEK özellikte kırıktı (0 ≠ -3 × 0.2647). D49 hedefi: kart 2px, master 2 / 0.2647 = 7.56px;
       böylece 7.56 × 0.2647 = 2.00 (tam) → istisna kalkar.
     • Footer: D30 not şeridi tek satır metin; cümlelere bölünmesi mevcut D30 FROZEN kapısının
       h.includes(tam dizge) biçimini geçersiz kılar → kapı GEVŞETİLMEDİ, tam tersine SIKILAŞTIRILDI
       (etiket-sökümlü TAM EŞİTLİK). Metin birebir: kelime ekleme/çıkarma YOK, yeni emoji YOK, • YOK.

   DEĞİŞMEZ (kilitli): 'formul' · font (MontsKart/Montserrat) · #d31d24 · #f29222 · #1a1a1a · 900 italic ·
   SVG path (M15 10 L95 10 / M14 29 L94 29) · viewBox 0 0 100 40 · stroke-width 14 · linecap round ·
   fk-logo id · SVG width 21/80 · right 8px/30px · top 0.5px/2px · ölçek çarpanı 0.2647 ·
   marka kutusu/eleman sırası. Bu yama SVG'ye ve 'formul'a HİÇ dokunmaz.

   TEST TARAFI: ks-ders-karti.mjs'e +3 assertion → SUITE_DONE 115 → 118; donmuş listeler ELLE:
     suit-manifest.mjs · elle-vaka-manifesti.mjs · elle-vaka-adlari-base.mjs ·
     suit-vakalar/ks-ders-karti.mjs.txt. D30 kapısının ADI ve metni DEĞİŞMEZ (yalnız gövdesi sıkılaşır).
   SENKRON: kök app.js → public/dist/isolate; index.html + dist/index.html + isolate/index.html
     ?v= = yeni SHA16. logo-master dist/isolate'e KOPYALANMAZ (yalnız kök kaynak belge).

   KURALLAR
     • Her hedef dizge TAM olarak beklenen sayıda geçmeli (aksi hâlde HİÇBİR ŞEY yazılmaz, fail-closed).
     • Kural bazlı idempotentlik: hedef zaten YENİ hâlinde ise o kural atlanır.
     • Varsayılan koşu: app.js'te D49-LOGO-FOOTER işareti varsa HİÇBİR dosyaya dokunmaz → exit 2.
     • `--tamamla`: işaret kapısını atlar; YALNIZ uygulanmamış kuralları uygular; iş yoksa exit 2. */
import { readFileSync, writeFileSync, existsSync, statSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const MARKER = "D49-LOGO-FOOTER";
const APP = "app.js";
const MST = "logo-master/formul-kurs-logo.html";
const SUIT = "ks-ders-karti.mjs";
const BASE = "elle-vaka-adlari-base.mjs";
const VAKA = "suit-vakalar/ks-ders-karti.mjs.txt";
const ESKI_SAYI = 115, YENI_SAYI = 118, K = 3;
const OLC = 0.2647, KART_MT = 2, MST_MT = 7.56;
const TAMAMLA = process.argv.includes("--tamamla");

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kez = (d, s) => d.split(s).length - 1;

const YENI_ADLAR = [
  "D49 logo ince ayar: alt yazı 2px aşağı (kart margin-top:2px · master 7.56px = 2/0.2647 · ölçek 0.2647 korunur)",
  "D49 footer modern: 5 cümle + imza AYRI blok hâlinde (6 display:block) · birleşik metin BİREBİR",
  "D49 footer imza: ince ayraç (hairline border-top) + harf aralıklı (letter-spacing) satır",
];

/* ---------- İDEMPOTENT KAPISI (varsayılan koşu) ---------- */
if (!existsSync(APP)) { console.error("HEDEF YOK: " + APP); process.exit(1); }
const appIlk = readFileSync(APP, "utf8");
if (appIlk.includes(MARKER) && !TAMAMLA) {
  console.log(MARKER + ": zaten uygulanmış → hiçbir dosyaya dokunulmadı (no-op).");
  console.log("(Kısmi kurulum tamamlamak için: node ks-yama-d49-logo-footer.mjs --tamamla)");
  process.exit(2);
}

/* ---------- YEDEK: yoksa oluştur, varsa ASLA üzerine yazma ---------- */
const YEDEKLER = [
  { kaynak: APP, yedek: "app.js.d49-logo-footer-oncesi.bak" },
  { kaynak: MST, yedek: "logo-master/formul-kurs-logo.html.d49-oncesi.bak" },
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
console.log("Önce : " + MST + " · " + Buffer.byteLength(mstIlk, "utf8") + " B · " + sha(mstIlk));

/* ---------- app.js KURALLARI ---------- */
const SUB_ON = "letter-spacing:-0.4px;margin-top:0;margin-right:14px;";
const SUB_SN = "letter-spacing:-0.4px;margin-top:" + KART_MT + "px;margin-right:14px;";

const FOOTER_ON =
  "      '<div style=\"margin-top:14px;border-top:1px solid #e2e8f0;padding-top:10px;color:#64748b;font-size:10.5px;line-height:1.6;text-align:left\">" +
  "Bu dersler, eksiklerini tamamlaman ve hedeflerine biraz daha yaklaşman için planlandı. " +
  "Ders saatinden birkaç dakika önce hazır olman yeterli. " +
  "Anlamadığın veya zorlandığın konuları öğretmeninle paylaşmayı unutma. " +
  "Sen çalışmaya devam et, biz de bu süreçte yanında olalım. " +
  "Güzel çalışmalar, başarılar dileriz. — FORMÜL KURS REHBERLİK SERVİSİ</div>' +";
const FOOTER_SN = [
  "      /* " + MARKER + ": D30 not şeridi cümlelere bölündü (6 ayrı display:block blok) — imza satırında",
  "         ince ayraç (hairline) + harf aralığı. METİN BİREBİR: kelime ekleme/çıkarma YOK, yeni emoji YOK, • YOK. */",
  "      '<div style=\"margin-top:14px;border-top:1px solid #e2e8f0;padding-top:10px;color:#64748b;font-size:10.5px;line-height:1.6;text-align:left\">' +",
  "        '<span style=\"display:block\">Bu dersler, eksiklerini tamamlaman ve hedeflerine biraz daha yaklaşman için planlandı.</span>' +",
  "        '<span style=\"display:block\">Ders saatinden birkaç dakika önce hazır olman yeterli.</span>' +",
  "        '<span style=\"display:block\">Anlamadığın veya zorlandığın konuları öğretmeninle paylaşmayı unutma.</span>' +",
  "        '<span style=\"display:block\">Sen çalışmaya devam et, biz de bu süreçte yanında olalım.</span>' +",
  "        '<span style=\"display:block\">Güzel çalışmalar, başarılar dileriz.</span>' +",
  "        '<span style=\"display:block;margin-top:7px;padding-top:7px;border-top:1px solid #e2e8f0;letter-spacing:0.55px;color:#94a3b8\">— FORMÜL KURS REHBERLİK SERVİSİ</span>' +",
  "      '</div>' +",
].join("\n");

const APP_KURALLARI = [
  { on: SUB_ON, sn: SUB_SN },
  { on: FOOTER_ON, sn: FOOTER_SN },
  { on: "function dersKartiHTML(d) {",
    sn: "/* " + MARKER + ": alt yazı dikey boşluğu ölçeğe oturtuldu (kart margin-top 0 → 2px; master -3px → 7.56px = 2/0.2647).\n" +
        "   SVG/çizgi/path/viewBox/stroke/renk/font/ölçek DEĞİŞMEDİ. */\n" +
        "function dersKartiHTML(d) {" },
];

/* ---------- master KURALLARI ---------- */
const MST_SUB_ON = "letter-spacing:-1.5px;margin-top:-3px;margin-right:53px;";
const MST_SUB_SN = "letter-spacing:-1.5px;margin-top:" + MST_MT + "px;margin-right:53px;";
const MST_OLCEK_ON =
  "    alt yazı margin-top -3px    → 0   (ÇAKIŞMA KURALI: -3px alt yazıyı\n" +
  "                                          markanın üstüne bindiriyordu → 0)";
const MST_OLCEK_SN =
  "    alt yazı margin-top 7.56px  → 2px (D49-LOGO-FOOTER: ölçek 0.2647 korunur\n" +
  "                                          7.56 × 0.2647 = 2.00 · eski -3px istisnası KALDIRILDI)";
const MST_NOT_ON = "  DEĞİŞMEDİ. (YASAK listesindeki \"hizalama/sıra\" marka kutusunun İÇİ içeriği için geçerlidir.)";
const MST_NOT_SN = MST_NOT_ON + "\n\n" +
  "  D49-LOGO-FOOTER: alt yazı dikey boşluğu ölçeğe oturtuldu — kart margin-top 0 → 2px,\n" +
  "  master -3px → 7.56px (2 / 0.2647). Böylece tek \"ÇAKIŞMA KURALI\" istisnası kalktı ve\n" +
  "  master × 0.2647 = kart eşitliği alt yazıda da birebir sağlandı. Font/renk/ölçek/path/viewBox/\n" +
  "  stroke-width ve eleman sırası DEĞİŞMEDİ (turuncu çizgilere dokunulmadı: bkz. ks-yama-d49 teşhis notu).";

const MST_KURALLARI = [
  { on: MST_SUB_ON, sn: MST_SUB_SN },
  { on: MST_OLCEK_ON, sn: MST_OLCEK_SN },
  { on: MST_NOT_ON, sn: MST_NOT_SN },
];

/* ---------- ks-ders-karti.mjs KURALLARI ---------- */
const YORUM_ON =
  " · margin-top:0 (ÇAKIŞMA KURALI:\n" +
  "                  master -3px markanın üstüne biniyordu → 0 kullanıldı) · margin-right 14px */";
const YORUM_SN =
  " · margin-top:2px (D49-LOGO-FOOTER:\n" +
  "                  7.56px × 0.2647 = 2.00 — eski -3px istisnası kaldırıldı) · margin-right 14px */";

const FROZEN_ON = 'return h.includes(bekl) && !h.includes("•"); })());';
const FROZEN_SN =
  'const i = h.indexOf("Bu dersler, eksiklerini"); const j = h.indexOf("FORMÜL KURS REHBERLİK SERVİSİ") + "FORMÜL KURS REHBERLİK SERVİSİ".length; ' +
  'if (i < 0) return false; const duz = h.slice(i, j).replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim(); ' +
  'return duz === bekl && !h.includes("•"); })());';

const D49_ON = "/* D33 font kapısı: gömülü aile MONTSSKART (italic 900) · 'Montserrat' ve CDN referansı YOK.";
const D49_BLOK = [
  "",
  "/* ---- D49-LOGO-FOOTER: (1) alt yazı 2px aşağı (ölçek korunur: 7.56 × 0.2647 = 2.00),",
  "   (2) D30 not şeridi cümlelere bölündü. D30 FROZEN kapısı GEVŞETİLMEDİ — 'includes' yerine",
  "   etiket-sökümlü TAM EŞİTLİK (daha sıkı) kullanılır; metin birebir, • ayracı yok.",
  "   Turuncu çizgilere DOKUNULMADI: ölçüm (bkz. ks-yama-d49-logo-footer.mjs) master×0.2647 = kart eşitliğini",
  "   her noktada ≤ 0.17 px farkla doğruladı → kanıtlanmış kusur yok, tasarım tercihi. */",
  "t(\"" + YENI_ADLAR[0] + "\", (() => {",
  "  if (!existsSync(\"logo-master/formul-kurs-logo.html\")) return false;",
  "  const m = readFileSync(\"logo-master/formul-kurs-logo.html\", \"utf8\");",
  "  const h = dersKartiHTML(birebir);",
  "  return h.includes(\"" + SUB_SN + "\") && m.includes(\"" + MST_SUB_SN + "\") &&",
  "    !/margin-top:-/.test(h) && !m.includes(\"margin-top:-3px\") && Math.abs(" + MST_MT + " * " + OLC + " - " + KART_MT + ") < 0.01;",
  "})());",
  "t(\"" + YENI_ADLAR[1] + "\", (() => {",
  "  const h = dersKartiHTML(birebir);",
  "  const i = h.indexOf(\"Bu dersler, eksiklerini\");",
  "  const j = h.indexOf(\"FORMÜL KURS REHBERLİK SERVİSİ\") + \"FORMÜL KURS REHBERLİK SERVİSİ\".length;",
  "  if (i < 0 || j < 4) return false;",
  "  const duz = h.slice(i, j).replace(/<[^>]*>/g, \" \").replace(/\\s+/g, \" \").trim();",
  "  const bekl = \"Bu dersler, eksiklerini tamamlaman ve hedeflerine biraz daha yaklaşman için planlandı. Ders saatinden birkaç dakika önce hazır olman yeterli. Anlamadığın veya zorlandığın konuları öğretmeninle paylaşmayı unutma. Sen çalışmaya devam et, biz de bu süreçte yanında olalım. Güzel çalışmalar, başarılar dileriz. — FORMÜL KURS REHBERLİK SERVİSİ\";",
  "  return duz === bekl && (h.match(/<span style=\"display:block/g) || []).length === 6;",
  "})());",
  "t(\"" + YENI_ADLAR[2] + "\", (() => {",
  "  const h = dersKartiHTML(birebir);",
  "  const son = h.indexOf(\"— FORMÜL KURS REHBERLİK SERVİSİ\");",
  "  if (son < 0) return false;",
  "  const bas = h.lastIndexOf(\"<span\", son);",
  "  if (bas < 0) return false;",
  "  const etiket = h.slice(bas, h.indexOf(\">\", bas));",
  "  return etiket.includes(\"display:block\") && etiket.includes(\"border-top:1px solid #e2e8f0\") &&",
  "    /letter-spacing:0\\.\\d+px/.test(etiket) && etiket.includes(\"color:#94a3b8\");",
  "})());",
].join("\n");

const SUIT_KURALLARI = [
  { on: YORUM_ON, sn: YORUM_SN },
  { on: '"margin-top:0",', sn: '"margin-top:' + KART_MT + 'px",' },
  { on: FROZEN_ON, sn: FROZEN_SN },
  { on: D49_ON, sn: D49_BLOK + "\n" + D49_ON },
  { on: '+ __kosan + ":115")', sn: '+ __kosan + ":' + YENI_SAYI + '")', beklenen: 2 },
  { on: "__kosan !== 115", sn: "__kosan !== " + YENI_SAYI },
  { on: "beklenen=115", sn: "beklenen=" + YENI_SAYI },
];

/* ---------- donmuş liste KURALLARI ---------- */
const MANIFEST_KURALLARI = [
  { dosya: "suit-manifest.mjs",
    on: '"ks-ders-karti.mjs": 115, /* D47-LOGO-HIZA: 113 + 2 (alt yazı marka kutusunun DIŞINDA/denge + çizgi görünürlük) */',
    sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + ', /* D47-LOGO-HIZA: 113 + 2 (alt yazı marka kutusunun DIŞINDA/denge + çizgi görünürlük) · D49-LOGO-FOOTER: ' + ESKI_SAYI + ' + ' + K + ' (alt yazı 2px ölçek kapısı + footer 6 blok/birebir + imza ayraç-harf aralığı) */' },
  { dosya: "elle-vaka-manifesti.mjs",
    on: ' · D47-LOGO-HIZA: 113 + 2 (alt yazı marka kutusunun DIŞINDA/denge + çizgi görünürlük) */',
    sn: ' · D47-LOGO-HIZA: 113 + 2 (alt yazı marka kutusunun DIŞINDA/denge + çizgi görünürlük) · D49-LOGO-FOOTER: ' + ESKI_SAYI + ' + ' + K + ' (alt yazı 2px ölçek kapısı + footer 6 blok/birebir + imza ayraç-harf aralığı) */',
    sayiOn: '"ks-ders-karti.mjs": 115,', sayiSn: '"ks-ders-karti.mjs": ' + YENI_SAYI + ',' },
];

/* ---------- LİSTE EKLEME (aynı 3 ad, iki dosya: txt + elle base) ----------
   ANKRA = D47'nin SON adı: test.mjs adları SIRALI karşılaştırır (donmuş ↔ koşum ↔ ELLE),
   koşum sırası da ... D33 master kaynağı → D47 ×2 → D49 ×3 → D33 gömülü font ... olduğundan
   D49 adları txt/base içinde D47 satırlarından SONRA gelmelidir. */
const ANKRA_AD = "D47 logo hiza: iki path #f29222 + fk-logo SVG marka kutusunda + görünürlük engeli YOK (overflow:hidden yok · z-index var · height:auto)";
const LISTE_EKLEME = [
  { dosya: VAKA, ankra: ANKRA_AD },
  { dosya: BASE, baslangic: '    "D47 logo hiza: iki path #f29222', satirTabanli: true },
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
  if (YENI_ADLAR.every(a => metin.includes(a))) { raporlar.push("ATLA  " + k.dosya + " → D49 adları zaten var"); return false; }
  const satirlar = metin.split("\n");
  const idx = k.ankra !== undefined ? satirlar.indexOf(k.ankra) : satirlar.findIndex(s => s.startsWith(k.baslangic));
  if (idx < 0) { console.error("FAIL-CLOSED: " + k.dosya + " ankra bulunamadı: " + (k.ankra || k.baslangic)); process.exit(1); }
  satirlar.splice(idx + 1, 0, ...YENI_ADLAR.map(a => (k.satirTabanli ? "    \"" + a + "\"," : a)));
  writeFileSync(k.dosya, satirlar.join("\n"));
  raporlar.push("YAZ   " + k.dosya + " → +" + YENI_ADLAR.length + " satır (" + satirlar.length + " satır)");
  return true;
}

/* ---------- ÖN KONTROL: hiçbir bayt yazılmadan TÜM kurallar doğrulanır ---------- */
{
  let hata = null;
  for (const k of LISTE_EKLEME) {
    const metin = readFileSync(k.dosya, "utf8");
    if (YENI_ADLAR.every(a => metin.includes(a))) continue;
    const satirlar = metin.split("\n");
    const idx = k.ankra !== undefined ? satirlar.indexOf(k.ankra) : satirlar.findIndex(s => s.startsWith(k.baslangic));
    if (idx < 0) hata = "liste ankrası yok: " + k.dosya + " → " + (k.ankra || k.baslangic).slice(0, 60);
  }
  const KONTROL = [[SUIT, SUIT_KURALLARI], [MST, MST_KURALLARI], [APP, APP_KURALLARI]]
    .concat(MANIFEST_KURALLARI.map(m => [m.dosya, m.sayiOn === undefined ? [m] : [m, { on: m.sayiOn, sn: m.sayiSn }]]));
  for (const [d, ks] of KONTROL) {
    const metin = readFileSync(d, "utf8");
    for (const k of ks) {
      const bek = k.beklenen === undefined ? 1 : k.beklenen;
      if (kez(metin, k.sn) === bek) continue;
      if (kez(metin, k.on) !== bek) hata = d + ' · "' + k.on.slice(0, 50) + '…" on-kez=' + kez(metin, k.on) + " (beklenen " + bek + ")";
    }
  }
  if (hata) { console.error("ÖN KONTROL FAIL-CLOSED: " + hata + " → HİÇBİR ŞEY YAZILMADI"); process.exit(1); }
  console.log("Ön kontrol: tüm kurallar doğrulandı (hiçbir şey henüz yazılmadı).");
}

let isYapildi = false;
for (const k of LISTE_EKLEME) if (listeEkle(k)) isYapildi = true;
for (const m of MANIFEST_KURALLARI) {
  const k = m.sayiOn === undefined ? [m] : [m, { on: m.sayiOn, sn: m.sayiSn }];
  if (kuralUygula(m.dosya, k)) isYapildi = true;
}
if (kuralUygula(SUIT, SUIT_KURALLARI)) isYapildi = true;
if (kuralUygula(MST, MST_KURALLARI)) isYapildi = true;
if (kuralUygula(APP, APP_KURALLARI)) isYapildi = true;

raporlar.forEach(r => console.log(r));

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
  [kez(appYeni, SUB_SN) === 1 && kez(appYeni, SUB_ON) === 0, "alt yazı margin-top 2px (tek yeni hâl, eski hâl yok)"],
  [kez(appYeni, FOOTER_SN) === 1 && kez(appYeni, FOOTER_ON) === 0, "footer cümlelere bölündü (tek yeni hâl, eski hâl yok)"],
  [(appYeni.match(/<span style="display:block/g) || []).length === 6, "footer 6 blok"],
  [kez(appYeni, "id=\"fk-logo\"") === 1, "fk-logo TEK"],
  [svgYeni === kez(appIlk, "<svg"), "SVG sayısı sabit (" + svgYeni + ")"],
  [kez(appYeni, "M15 10 L95 10") === kez(appIlk, "M15 10 L95 10") && kez(appYeni, "M14 29 L94 29") === kez(appIlk, "M14 29 L94 29"), "SVG path'leri DEĞİŞMEDİ"],
  [kez(appYeni, "stroke-width=\"14\"") === kez(appIlk, "stroke-width=\"14\"") && kez(appYeni, "stroke=\"#f29222\"") === kez(appIlk, "stroke=\"#f29222\""), "stroke DEĞİŞMEDİ"],
  [kez(appYeni, "right:8px;top:0.5px") === 1 && kez(appYeni, "viewBox=\"0 0 100 40\"") === kez(appIlk, "viewBox=\"0 0 100 40\""), "SVG konum/viewBox DEĞİŞMEDİ"],
  [kez(mstYeni, MST_SUB_SN) === 1 && kez(mstYeni, MST_SUB_ON) === 0, "master margin-top 7.56px (tek yeni hâl, eski hâl yok)"],
  [mstYeni.includes("font-size:8.5rem") && mstYeni.includes("stroke=\"#f29222\"") && mstYeni.includes("viewBox=\"0 0 100 40\"") && mstYeni.includes("right:30px;top:2px"), "master kilitli değerler korundu"],
  [kez(appYeni, "color:#94a3b8\">— FORMÜL KURS REHBERLİK SERVİSİ</span>") === 1 && kez(appYeni, "•") === kez(appIlk, "•"), "footer imzası TEK ve • sayısı artmadı"],
];
const dusen = kanitlar.filter(k => !k[0]).map(k => k[1]);
if (dusen.length) { console.error("KANIT DÜŞTÜ: " + dusen.join(" · ")); process.exit(1); }
console.log("Kanıt: " + kanitlar.map(k => k[1]).join(" · "));

/* ---------- SENKRON + DAMGA (İDEMPOTENT: kök app.js ↔ public/dist/isolate + ?v= damgası) ---------- */
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
  console.log(MARKER + ": yapacak iş yok (tüm kurallar + senkron + damga zaten yerinde).");
  process.exit(2);
}
console.log(MARKER + " TAMAM. (varsayılan koşu bundan sonra no-op exit 2 olur.)");
