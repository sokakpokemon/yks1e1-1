/* ks-yama-d46-kart-emoji.mjs — D46-KART-EMOJI uygulayıcısı (ks-yama-*.mjs konvansiyonu, İDEMPOTENT).
   TEK İŞ: ÖĞRENCİ kartında (dersKartiHTML) bento alan etiketlerine EMOJİ ÖNEKİ eklemek.
     TARİH → 📅 · SAAT → ⏰ · DERS → 📚 · KONU → 📝 · ÖĞRETMEN → 👤 · SINIF → 🏫
   SINIRLAR (ADIM 0 ölçümü, N=0):
     • svgKart (nötr inline SVG) ve fk-logo (LOGO KİLİDİ) DEĞİŞMEZ — emoji SVG'nin YERİNE GEÇMEZ (ek).
     • renk/#f0f4fa…#f8fafc · ölçek · D33 logo kademesi DEĞİŞMEZ. Yeni HTML yapısı / yeni üretici YOK.
     • Dokunulmayan hedefler (ölçülürse N≥1 olurdu): ">Değerli Öğrencimiz</div>" ve D30 FROZEN not şeridi.
   TEST TARAFI: ks-ders-karti.mjs'e +3 assertion → SUITE_DONE 110 → 113; donmuş listeler ELLE:
     suit-manifest.mjs · elle-vaka-manifesti.mjs · elle-vaka-adlari-base.mjs · suit-vakalar/ks-ders-karti.mjs.txt.
   SENKRON: kök app.js → public/dist/isolate; index.html + dist/index.html + isolate/index.html ?v= = yeni SHA16.

   KURALLAR
     • Her hedef dizge TAM olarak beklenen sayıda geçmeli (aksi hâlde HİÇBİR ŞEY yazılmaz, fail-closed).
     • Kural bazlı idempotentlik: hedef zaten YENİ hâlinde ise o kural "uygulanmış" sayılır ve atlanır.
     • Varsayılan koşu: app.js'te D46-KART-EMOJI işareti varsa HİÇBİR dosyaya dokunmaz → exit 2.
     • `node ks-yama-d46-kart-emoji.mjs --tamamla`: işaret kapısını atlar; YALNIZ henüz uygulanmamış
       kuralları uygular (kısmi kalmuş kurulum tamamlanır); yapacak iş yoksa exit 2.
     • Bu dosya neden gerekli: elle-vaka-adlari-base.mjs 2579 satırdır ve Freebuff dosya aracı derin
       satırları (≈600+) eşleştiremiyor — proje bu yüzden ks-yama-*.mjs geleneğini kullanır. */
import { readFileSync, writeFileSync, existsSync, statSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const MARKER = "D46-KART-EMOJI";
const APP = "app.js";
const SUIT = "ks-ders-karti.mjs";
const BASE = "elle-vaka-adlari-base.mjs";
const VAKA = "suit-vakalar/ks-ders-karti.mjs.txt";
const ESKI_SAYI = 110, YENI_SAYI = 113, K = 3;
const ESKI_EMOJI_YOK = true; /* D46 öncesi kartta hiç emoji yoktu (ölçüldü) */
const TAMAMLA = process.argv.includes("--tamamla");

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kez = (d, s) => d.split(s).length - 1;
const kuralIzi = (metin, on, sn) => (sn !== "" && metin.includes(sn)) ? "uygulanmış" : "bekliyor";

/* ---------- İDEMPOTENT KAPISI (varsayılan koşu) ---------- */
if (!existsSync(APP)) { console.error("HEDEF YOK: " + APP); process.exit(1); }
const appIlk = readFileSync(APP, "utf8");
if (appIlk.includes(MARKER) && !TAMAMLA) {
  console.log(MARKER + ": zaten uygulanmış → hiçbir dosyaya dokunulmadı (no-op).");
  console.log("(Kısmi kurulum tamamlamak için: node ks-yama-d46-kart-emoji.mjs --tamamla)");
  process.exit(2);
}

/* ---------- YEDEK: yoksa oluştur, varsa ASLA üzerine yazma ---------- */
const YEDEK = "app.js.d46-kart-emoji-oncesi.bak";
if (!existsSync(YEDEK)) {
  writeFileSync(YEDEK, appIlk);
  console.log("Yedek : " + YEDEK + " OLUŞTURULDU · " + statSync(YEDEK).size + " B · SHA-256 " + sha(readFileSync(YEDEK)));
} else {
  console.log("Yedek : " + YEDEK + " ZATEN VAR (üzerine yazılmadı) · " + statSync(YEDEK).size + " B · SHA-256 " + sha(readFileSync(YEDEK)));
}
const ONCE = { byte: Buffer.byteLength(appIlk, "utf8"), sha: sha(appIlk), satir: appIlk.split("\n").length };
console.log("Önce : " + APP + " · " + ONCE.byte + " B · " + ONCE.satir + " satır · SHA-256 " + ONCE.sha);

const EMOJI = { TARIH: "\u{1F4C5}", SAAT: "\u{23F0}", DERS: "\u{1F4DA}", KONU: "\u{1F4DD}", OGR: "\u{1F464}", SINIF: "\u{1F3EB}" };

/* ---------- app.js KURALLARI (6 etiket öneki + marker) ---------- */
const APP_KURALLARI = [
  { on: 'kutu("#f0f4fa", "#6366f1", "TARİH", v.tarih)',
    sn: 'kutu("#f0f4fa", "#6366f1", "' + EMOJI.TARIH + ' TARİH", v.tarih)' },
  { on: 'kutu("#fff8f2", "#f59e0b", "SAAT", v.saatKisa)',
    sn: 'kutu("#fff8f2", "#f59e0b", "' + EMOJI.SAAT + ' SAAT", v.saatKisa)' },
  { on: 'kutu("#eff9f7", "#14b8a6", "DERS", v.ders)',
    sn: 'kutu("#eff9f7", "#14b8a6", "' + EMOJI.DERS + ' DERS", v.ders)' },
  { on: 'kutu("#f9f5fc", "#8b5cf6", "KONU", v.konu || "Genel tekrar")',
    sn: 'kutu("#f9f5fc", "#8b5cf6", "' + EMOJI.KONU + ' KONU", v.konu || "Genel tekrar")' },
  { on: 'kutu("#f8fafc", "#94a3b8", "ÖĞRETMEN", v.ogr)',
    sn: 'kutu("#f8fafc", "#94a3b8", "' + EMOJI.OGR + ' ÖĞRETMEN", v.ogr)' },
  { on: '">SINIF</div>', sn: '">' + EMOJI.SINIF + ' SINIF</div>' },
  { on: "function dersKartiHTML(d) {",
    sn: "/* D46-KART-EMOJI: bento alan etiketlerine EMOJİ ÖNEKİ (ek emoji) — svgKart/fk-logo/renk/ölçek/kademe DEĞİŞMEZ. */\nfunction dersKartiHTML(d) {" },
];

/* ---------- ks-ders-karti.mjs KURALLARI ---------- */
const ANKRA = 't("telefon yoksa akış çökmez", akisHata === null, akisHata && akisHata.message);';
const YENI_ADLAR = [
  "D46 kart bento etiketleri emoji önekli (TARİH/SAAT/DERS/KONU/ÖĞRETMEN/SINIF altısı da)",
  "D46 bento etiket metinleri KORUNDU (emoji yalnız önek — 'TARİH'…'SINIF' tam etiketler hâlâ VAR; D30 etiket kapısı bozulmadı)",
  "D46 kartta TAM 2 inline SVG (nötr ikon + fk-logo) — emoji SVG'nin YERİNE GEÇMEDİ, fk-logo id sabit",
];
const YENI_BLOK = [
  "",
  "/* ---- D46-KART-EMOJI: öğrenci kartı bento alan etiketlerine emoji öneki eklendi (EK emoji).",
  "   ADIM 0 ölçümü N=0: pinler include()/indexOf() tabanlı → önek eklemek kırmızı üretmez.",
  "   svgKart (nötr inline SVG) ve fk-logo DEĞİŞMEDİ; renk/ölçek/kademe DEĞİŞMEDİ; yeni yapı/üretici YOK. */",
  't("' + YENI_ADLAR[0] + '", (() => { const h = dersKartiHTML(birebir); return ["' + EMOJI.TARIH + ' TARİH", "' + EMOJI.SAAT + ' SAAT", "' + EMOJI.DERS + ' DERS", "' + EMOJI.KONU + ' KONU", "' + EMOJI.OGR + ' ÖĞRETMEN", "' + EMOJI.SINIF + ' SINIF"].every(s => h.includes(s)); })());',
  't("' + YENI_ADLAR[1] + '", (() => { const h = dersKartiHTML(birebir); return ["TARİH","SAAT","DERS","KONU","ÖĞRETMEN","SINIF"].every(b => h.includes(b)); })());',
  't("' + YENI_ADLAR[2] + '", (() => { const h = dersKartiHTML(birebir); return (h.match(/<svg/g) || []).length === 2 && (h.match(/id="fk-logo"/g) || []).length === 1; })());',
].join("\n");

const SUIT_KURALLARI = [
  { on: ANKRA, sn: ANKRA + "\n" + YENI_BLOK },
  { on: '+ __kosan + ":110")', sn: '+ __kosan + ":' + YENI_SAYI + '")', beklenen: 2 },
  { on: "__kosan !== 110", sn: "__kosan !== " + YENI_SAYI },
  { on: "beklenen=110", sn: "beklenen=" + YENI_SAYI },
];

/* ---------- donmuş liste KURALLARI ---------- */
const MANIFEST_KURALLARI = [
  { dosya: "suit-manifest.mjs",
    on: '"ks-ders-karti.mjs": 110,', sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + ',' },
  { dosya: "elle-vaka-manifesti.mjs",
    on: '"ks-ders-karti.mjs": 110, /* D33-LOGO-KİLİDİ: 109 + 1 yeni master-kaynak kapısı (logo-master/formul-kurs-logo.html) */',
    sn: '"ks-ders-karti.mjs": ' + YENI_SAYI + ', /* D33-LOGO-KİLİDİ: 109 + 1 yeni master-kaynak kapısı (logo-master/formul-kurs-logo.html) · D46-KART-EMOJI: ' + ESKI_SAYI + ' + ' + K + ' (bento emoji öneki + etiket metni korundu + SVG yerine geçmedi) */' },
];

/* ---------- LİSTE EKLEME kuralı (aynı adlar, iki dosya: txt + elle base) ---------- */
const LISTE_EKLEME = [
  { dosya: VAKA, ankra: "telefon yoksa akış çökmez" },
  { dosya: BASE, ankra: '    "telefon yoksa akış çökmez",', satirTabanli: true },
];

const raporlar = [];
let appYazildi = false;

/* ---- string-replacement kuralları ---- */
function kuralUygula(dosya, kurallar) {
  const metin = readFileSync(dosya, "utf8");
  const hepsiUygulanmis = kurallar.every(k => kez(metin, k.sn) === (k.beklenen === undefined ? 1 : k.beklenen));
  if (hepsiUygulanmis) { raporlar.push("ATLA  " + dosya + " → kurallar zaten uygulanmış"); return false; }
  for (const k of kurallar) {
    const bek = k.beklenen === undefined ? 1 : k.beklenen;
    const nOn = kez(metin, k.on), nSn = kez(metin, k.sn);
    if (nSn === bek) continue; /* bu kural uygulanmış */
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

/* ---- liste ekleme kuralı ---- */
function listeEkle(k) {
  const metin = readFileSync(k.dosya, "utf8");
  if (YENI_ADLAR.every(a => metin.includes(a))) { raporlar.push("ATLA  " + k.dosya + " → D46 adları zaten var"); return false; }
  const satirlar = metin.split("\n");
  const idx = satirlar.indexOf(k.ankra);
  if (idx < 0) { console.error("FAIL-CLOSED: " + k.dosya + " ankra bulunamadı: " + k.ankra); process.exit(1); }
  satirlar.splice(idx + 1, 0, ...YENI_ADLAR.map(a => (k.satirTabanli ? "    \"" + a + "\"," : a)));
  writeFileSync(k.dosya, satirlar.join("\n"));
  raporlar.push("YAZ   " + k.dosya + " → +" + YENI_ADLAR.length + " satır (" + satirlar.length + " satır)");
  return true;
}

let isYapildi = false;
for (const k of LISTE_EKLEME) if (listeEkle(k)) isYapildi = true;
for (const m of MANIFEST_KURALLARI) if (kuralUygula(m.dosya, [m])) isYapildi = true;
if (kuralUygula(SUIT, SUIT_KURALLARI)) isYapildi = true;
if (kuralUygula(APP, APP_KURALLARI)) isYapildi = true;

raporlar.forEach(r => console.log(r));

if (!isYapildi) {
  console.log(MARKER + ": yapacak iş yok (tüm kurallar zaten uygulanmış).");
  process.exit(2);
}

/* ---------- app.js söz dizimi kapısı + sert kanıt ---------- */
const appYeni = readFileSync(APP, "utf8");
execFileSync(process.execPath, ["--check", APP], { stdio: "pipe" });
console.log("node --check " + APP + " ✓");
const svgYeni = kez(appYeni, "<svg");
const ETIKETLER = [EMOJI.TARIH + " TARİH", EMOJI.SAAT + " SAAT", EMOJI.DERS + " DERS", EMOJI.KONU + " KONU", EMOJI.OGR + " ÖĞRETMEN", EMOJI.SINIF + " SINIF"];
if (!appYeni.includes(MARKER) || svgYeni !== kez(appIlk, "<svg") || !ETIKETLER.every(e => appYeni.includes(e))) { console.error("KANIT DÜŞTÜ"); process.exit(1); }
console.log("Kanıt: marker ✓ · SVG sayısı sabit (" + svgYeni + ") · 6 etiket emoji önekli (" + ESKI_EMOJI_YOK + " = D46 öncesi emoji yoktu)");

/* ---------- SENKRON + DAMGA (yalnız app.js BU koşuda yazıldıysa) ---------- */
if (appYazildi) {
  const SONRA = { byte: Buffer.byteLength(appYeni, "utf8"), sha: sha(appYeni) };
  console.log("Sonra: " + APP + " · " + SONRA.byte + " B · SHA-256 " + SONRA.sha + " · SHA16 " + SONRA.sha.slice(0, 16));
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
} else {
  console.log("app.js bu koşuda değişmedi → senkron/damga adımı atlandı (kök=public=dist=isolate zaten eşit).");
}
console.log(MARKER + " TAMAM. (varsayılan koşu bundan sonra no-op exit 2 olur.)");
