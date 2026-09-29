/* ks-yama-d55-rapor-emoji.mjs — D55-RAPOR-EMOJI uygulayıcısı (ks-yama-*.mjs konvansiyonu, İDEMPOTENT).

   KAPSAM (yalnız bu): app.js içindeki PNG RAPORU tablo başlıkları (pngAc → $("pngRapor").innerHTML,
   7 adet <th>, satır 5404–5411) metinlerine YALNIZ EMOJİ ÖNEKİ eklenir.

   DEĞİŞMEZ: başlık METİNLERİ (kelimeler), <th> sayısı (7) ve SIRASI, ortak sütun stil şablonu,
   tablo markup'ı, PNG akışı (pngAc → cizPngDonut → setTimeout(pngYakala)), html2canvas option'ları,
   ve DİĞER ÜÇ YÜZEY: öğrenci kartı (dersKartiHTML) · öğretmen tek-ders kartı (dersKartiOgrtHTML) ·
   öğretmen günlük kartı (dersKartiOgrtGunlukHTML) · logo bloğu · D49 footer · günlük çizelge.

   EMOJİ EŞLEMESİ (öğrenci kartı sözlüğüyle AYNI kavramlar — uydurma YOK):
     📅 TARİH   (kart: "📅 TARİH")        ⏰ SAAT   (kart: "⏰ SAAT")
     🎒 ÖĞRENCİ (kartta karşılık yok; 🎓 marka bloğunda kullanıldığı için ÇAKIŞMASIN diye 🎒)
     📚 DERS    (kart: "📚 DERS")         📝 EKSİK KONU (kart: "📝 KONU")
     👤 ÖĞRETMEN (kart: "👤 ÖĞRETMEN" — aynı kavram, aynı emoji)
     🚦 DURUM   (kartta karşılığı YOK; sütun Planlandı/Tamamlandı/İptal durum rozeti → durum göstergesi)

   TEST TARAFI: ks-grup-gorunum.mjs'e +2 dar kapı (GERÇEK pngRapor HTML'i koşumda üretilir)
   → SUITE_DONE 51 → 53 (silme/gevşetme YOK). Donmuş beşli ELLE: suit-manifest.mjs ·
   elle-vaka-manifesti.mjs · elle-vaka-adlari-base.mjs · suit-vakalar/ks-grup-gorunum.mjs.txt +
   sayaç (aynı dosyada 3 yer). test.mjs süit listesi DOKUNULMAZ (toplam 2597 → 2599).
   SENKRON: kök app.js → public/dist/isolate; index.html + dist + isolate ?v= yeni SHA16.

   KURALLAR
     • Her hedef dizge TAM beklenen sayıda geçmeli; ön kontrol geçmezse HİÇBİR ŞEY yazılmaz.
     • Varsayılan koşu: app.js'te D55-RAPOR-EMOJI işareti varsa no-op → exit 2.
     • `--tamamla`: işaret kapısını atlar; yalnız uygulanmamış kuralları uygular; iş yoksa exit 2.
     • `--kuru`: HİÇBİR ŞEY YAZMADAN üretilecek blokları basar (ön kontrol öncesi çıkar). */
import { readFileSync, writeFileSync, existsSync, statSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const MARKER = "D55-RAPOR-EMOJI";
const APP = "app.js";
const SUIT = "ks-grup-gorunum.mjs";
const VAKA = "suit-vakalar/ks-grup-gorunum.mjs.txt";
const BASE = "elle-vaka-adlari-base.mjs";
const MAN = "suit-manifest.mjs";
const ELLEMAN = "elle-vaka-manifesti.mjs";
const ESKI_SAYI = 51, YENI_SAYI = 53, K = 2;
const TAMAMLA = process.argv.includes("--tamamla");

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kez = (d, s) => d.split(s).length - 1;

/* ---------- BAŞLIK METİNLERİ + EMOJİ ÖNEKLERİ (tek kaynak: hem app.js hem kapı adları buradan) ---------- */
const METINLER = ["TARİH", "SAAT", "ÖĞRENCİ", "DERS", "EKSİK KONU", "ÖĞRETMEN", "DURUM"];
const EMOJILER = ["📅", "⏰", "🎒", "📚", "📝", "👤", "🚦"];
const BASLIKLAR = METINLER.map((m, i) => EMOJILER[i] + " " + m);

/* PNG raporu sütun stil şablonu (app.js kaynağıyla BİREBİR; DEĞİŞMEZ) */
const TH = "<th style='text-align:left;padding:8px 10px;font-size:9.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em'>";

const G1 = "PNG rapor başlıkları: 7 <th> emoji ÖNEKLİ ve SIRASI birebir (" + BASLIKLAR.join(" · ") + ")";
const G2_AD = "PNG rapor başlık METİNLERİ önek öncesiyle AYNI (emoji çıkarılınca 7 kelime sırasıyla " + METINLER.join("|") + ")";

/* ---------- İDEMPOTENT KAPISI ---------- */
if (!existsSync(APP)) { console.error("HEDEF YOK: " + APP); process.exit(1); }
const appIlk = readFileSync(APP, "utf8");
if (appIlk.includes(MARKER) && !TAMAMLA) {
  console.log(MARKER + ": zaten uygulanmış → hiçbir dosyaya dokunulmadı (no-op).");
  console.log("(Kısmi kurulum tamamlamak için: node ks-yama-d55-rapor-emoji.mjs --tamamla)");
  process.exit(2);
}

/* ---------- YEDEK: yoksa oluştur, varsa ASLA üzerine yazma ---------- */
const YEDEKLER = [
  { kaynak: APP, yedek: "app.js.d55-rapor-emoji-oncesi.bak" },
  { kaynak: SUIT, yedek: "ks-grup-gorunum.mjs.d55-rapor-emoji-oncesi.bak" },
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
const suitIlk = readFileSync(SUIT, "utf8");
console.log("Önce : " + SUIT + " · " + Buffer.byteLength(suitIlk, "utf8") + " B · " + suitIlk.split("\n").length + " satır · SHA-256 " + sha(suitIlk));

/* ---------- app.js KURALLARI ---------- */
const APP_ANKRA = '  $("pngRapor").innerHTML =';
const APP_YORUM_METNI = [
  "  /* " + MARKER + ": PNG raporu tablo BAŞLIKLARINA yalnız EMOJİ ÖNEKİ eklendi",
  "     (" + BASLIKLAR.join(" · ") + ").",
  "     Metin kelimeleri, <th> sayısı (7) ve SIRASI, sütun stil şablonu, tablo markup'ı, PNG akışı",
  "     (pngAc → cizPngDonut → setTimeout(pngYakala)) ve html2canvas option'ları DEĞİŞMEDİ.",
  "     EMOJİ EŞLEMESİ öğrenci kartı sözlüğünden: 📅/⏰/📚/📝 aynı kavramlar; 👤 = ÖĞRETMEN (karttaki",
  "     '👤 ÖĞRETMEN' ile AYNI); ÖĞRENCİ için kartta karşılık yok → 🎒 (marka bloğundaki 🎓 ile",
  "     ÇAKIŞMASIN); DURUM için kartta karşılık yok → 🚦 (Planlandı/Tamamlandı/İptal durum rozeti).",
  "     Öğrenci kartı · öğretmen tek-ders kartı · öğretmen günlük kartı · logo bloğu · D49 footer ·",
  "     günlük çizelge bu yamada DOKUNULMADI. */",
].join("\n");

const APP_KURALLARI = [{ on: APP_ANKRA, sn: APP_YORUM_METNI + "\n" + APP_ANKRA }]
  .concat(METINLER.map((m, i) => ({ on: TH + m + "</th>", sn: TH + BASLIKLAR[i] + "</th>" })));

/* ---------- ks-grup-gorunum.mjs KURALLARI (+2 kapı · gerçek pngRapor HTML'i) ---------- */
const KAPI_ANKRA = 't("PNG birebir satırında tek ad (virgülle birleşme yok)", !pngHTML.split("</tr>").filter(r => r.includes("Enerji")).some(r => r.includes(", ")));';
const KAPI_BLOK = [
  "/* ---- " + MARKER + ": PNG raporu tablo BAŞLIKLARINA emoji ÖNEKİ (metin/sıra/sayı DEĞİŞMEDİ) ---- */",
  "const __pngTh = [...pngHTML.matchAll(/<th[^>]*>([^<]*)<\\/th>/g)].map(m => m[1]);",
  "const __pngThBeklenen = " + JSON.stringify(BASLIKLAR) + ";",
  "t(" + JSON.stringify(G1) + ",",
  "  __pngTh.length === 7 && __pngTh.every((s, i) => s === __pngThBeklenen[i]),",
  "  JSON.stringify(__pngTh));",
  "const __pngThMetin = __pngTh.map(s => s.replace(/^\\S+ /, \"\"));",
  "t(" + JSON.stringify(G2_AD) + ",",
  "  __pngThMetin.join(\"|\") === " + JSON.stringify(METINLER.join("|")) + ",",
  "  __pngThMetin.join(\"|\"));",
].join("\n");

/* Not: ankra satırı yorumun KAPANISINI da içerir; kapanış aynen taşınır, not ondan ÖNCE eklenir
   → yorum kapanışı TEK kalır (yorum erken kapanıp kod sızması OLMAZ). */
const SUIT_YORUM_GOVDE = "/* DÖNGÜ-19: kosan=42 (28 + 7 D18/D19 havuz-kartı + 7 D19) · DÖNGÜ-21: kosan=47 (+5 D21 UI sözleşmesi)";
const SUIT_YORUM_ON = SUIT_YORUM_GOVDE + " */";
const SUIT_YORUM_SN = SUIT_YORUM_GOVDE + " · " + MARKER + ": kosan=" + YENI_SAYI + " (+2 PNG raporu tablo başlık emoji öneki) */";
const SUIT_KURALLARI = [
  { on: KAPI_ANKRA, sn: KAPI_ANKRA + "\n" + KAPI_BLOK },
  { on: SUIT_YORUM_ON, sn: SUIT_YORUM_SN },
  { on: "__kosan !== " + ESKI_SAYI, sn: "__kosan !== " + YENI_SAYI },
  { on: "beklenen=" + ESKI_SAYI, sn: "beklenen=" + YENI_SAYI },
  { on: '__kosan + ":' + ESKI_SAYI + '")', sn: '__kosan + ":' + YENI_SAYI + '")' },
];

/* ---------- donmuş manifest KURALLARI ---------- */
const MAN_SATIR_ON = '  "ks-grup-gorunum.mjs": ' + ESKI_SAYI + ",";
const MAN_NOT = " /* " + MARKER + ": " + ESKI_SAYI + " + " + K + " (PNG raporu tablo başlıkları: 7 <th> emoji ÖNEKLİ birebir + başlık METİNLERİ önek öncesiyle AYNI) */";
const MAN_SATIR_SN = '  "ks-grup-gorunum.mjs": ' + YENI_SAYI + "," + MAN_NOT;
const MANIFEST_KURALLARI = [
  { dosya: MAN, on: MAN_SATIR_ON, sn: MAN_SATIR_SN },
  { dosya: ELLEMAN, on: MAN_SATIR_ON, sn: MAN_SATIR_SN },
];

/* ---------- ad ekleme (txt + elle base) ---------- */
const ANA_ANKRA = "PNG birebir satırında tek ad (virgülle birleşme yok)";
const YENI_ADLAR = [G1, G2_AD];
const LISTE_EKLEME = [
  { dosya: VAKA, ankra: ANA_ANKRA, tabanli: false },
  { dosya: BASE, ankra: '    "' + ANA_ANKRA + '",', tabanli: true },
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
  if (metin.includes(YENI_ADLAR[0])) { raporlar.push("ATLA  " + k.dosya + " → D55 adları zaten var"); return false; }
  const satirlar = metin.split("\n");
  const idx = satirlar.indexOf(k.ankra);
  if (idx < 0) { console.error("FAIL-CLOSED: " + k.dosya + " ankra bulunamadı: " + k.ankra); process.exit(1); }
  const eklenecek = YENI_ADLAR.map(a => k.tabanli ? '    "' + a + '",' : a);
  satirlar.splice(idx + 1, 0, ...eklenecek);
  writeFileSync(k.dosya, satirlar.join("\n"));
  raporlar.push("YAZ   " + k.dosya + " → +" + YENI_ADLAR.length + " satır (" + satirlar.length + " satır)");
  return true;
}

/* ---------- --kuru: HİÇBİR ŞEY YAZILMADAN üretilecek blokları göster ---------- */
if (process.argv.includes("--kuru")) {
  console.log("===== app.js YORUM =====\n" + APP_YORUM_METNI);
  console.log("===== app.js TH kuralları =====");
  METINLER.forEach((m, i) => console.log("  on: " + TH + m + "</th>\n  sn: " + TH + BASLIKLAR[i] + "</th>"));
  console.log("===== SUIT kapı bloğu =====\n" + KAPI_BLOK);
  console.log("===== SUIT sayaç kuralları =====\n" + SUIT_KURALLARI.slice(1).map(k => "  " + k.on + "  →  " + k.sn).join("\n"));
  console.log("===== MANIFEST satırı =====\n" + MAN_SATIR_SN);
  console.log("===== YENİ ADLAR =====\n" + YENI_ADLAR.map(a => "  " + a).join("\n"));
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
  const KONTROL = [[SUIT, SUIT_KURALLARI], [APP, APP_KURALLARI]]
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

/* Donmuş manifest TOPLAMI: yazma turunda +K, zaten yazılmışsa +0 (idempotent ikinci koşu). */
const MAN_METIN = readFileSync(MAN, "utf8");
const TOPLAM_ONCE = [...MAN_METIN.matchAll(/^  "([^"]+)": (\d+),/gm)].reduce((a, r) => a + Number(r[2]), 0);
const TOPLAM_BEKLENEN = TOPLAM_ONCE + (MAN_METIN.includes(MAN_SATIR_SN) ? 0 : K);

let isYapildi = false;
for (const k of LISTE_EKLEME) if (listeEkle(k)) isYapildi = true;
for (const m of MANIFEST_KURALLARI) if (kuralUygula(m.dosya, [{ on: m.on, sn: m.sn }])) isYapildi = true;
if (kuralUygula(SUIT, SUIT_KURALLARI)) isYapildi = true;
if (kuralUygula(APP, APP_KURALLARI)) isYapildi = true;
raporlar.forEach(r => console.log(r));

/* ---------- söz dizimi + sert kanıt ---------- */
execFileSync(process.execPath, ["--check", APP], { stdio: "pipe" });
console.log("node --check " + APP + " ✓");
execFileSync(process.execPath, ["--check", SUIT], { stdio: "pipe" });
console.log("node --check " + SUIT + " ✓");

const appYeni = readFileSync(APP, "utf8");
const suitYeni = readFileSync(SUIT, "utf8");
/* "ÖNCE" REFERANSI: D55 öncesi app.js byte'ları YEDEKTEN okunur (yedek yazma turundan ÖNCE alınır).
   Böylece kanıt, idempotent ikinci koşuda da AYNI referansa dayanır (app.js artık yeni hâlde olsa bile). */
const ONCE_METIN = readFileSync(YEDEKLER[0].yedek, "utf8");
/* GERİ ALMA KANITI: yamayı TERSİNE çevir (yorum bloğunu + 7 emoji önekini çıkar) → D55 ÖNCESİ app.js ile
   BİREBİR eşit olmalı. Bu, "başka hiçbir bayt değişmedi"nin tam kanıtıdır (öğrenci kartı · öğretmen
   tek-ders · öğretmen günlük kart · logo bloğu · D49 footer · günlük çizelge DAHİL). */
const geriAl = (() => {
  let s = appYeni.split(APP_YORUM_METNI + "\n" + APP_ANKRA).join(APP_ANKRA);
  METINLER.forEach((m, i) => { s = s.split(TH + BASLIKLAR[i] + "</th>").join(TH + m + "</th>"); });
  return s;
})();
if (geriAl !== ONCE_METIN) {
  let k = 0; while (k < Math.max(geriAl.length, ONCE_METIN.length) && geriAl[k] === ONCE_METIN[k]) k++;
  console.error("GERİ ALMA FARKI idx=" + k + "\n  geriAl : " + JSON.stringify(geriAl.slice(k - 80, k + 80)) + "\n  önceki : " + JSON.stringify(ONCE_METIN.slice(k - 80, k + 80)));
}
const kanitlar = [
  [appYeni.includes(MARKER), "app.js marker"],
  [kez(ONCE_METIN, TH) === 7 && kez(appYeni, TH) === 7, "<th> stil şablonu sayısı: 7 (DEĞİŞMEDİ)"],
  [BASLIKLAR.every((b, i) => kez(appYeni, TH + b + "</th>") === 1 && kez(appYeni, TH + METINLER[i] + "</th>") === 0), "7 başlık emoji ÖNEKLİ (öneksiz hâli 0)"],
  [METINLER.every((m, i) => kez(appYeni, TH + m + "</th>") === 0 && kez(appYeni, TH + BASLIKLAR[i] + "</th>") === 1), "başlık SIRASI tek tek pinlendi"],
  [kez(appYeni, APP_ANKRA) === 1 && kez(appYeni, "$(\"pngRapor\").innerHTML") === 1, "pngRapor üreteci TEK ve yerinde"],
  [geriAl === ONCE_METIN, "GERİ ALMA: yorum + 7 emoji öneki çıkarılınca app.js D55 ÖNCESİ hâlle BİREBİR (başka hiçbir bayt değişmedi — diğer üç yüzey/logo/footer/günlük çizelge DAHİL)"],
  [kez(appYeni, "html2canvas(") === kez(ONCE_METIN, "html2canvas(") && kez(appYeni, "setTimeout(function () { pngYakala(); }, 500);") === 1, "PNG akışı + html2canvas çağrı sayısı DEĞİŞMEDİ"],
  [kez(appYeni, "</th>") === kez(ONCE_METIN, "</th>") && kez(appYeni, "<th ") === kez(ONCE_METIN, "<th "), "th sayısı birebir (7) ve başka tablo DOKUNULMADI"],
  [kez(suitYeni, "beklenen=" + YENI_SAYI) === 1 && kez(suitYeni, "__kosan !== " + YENI_SAYI) === 1 && kez(suitYeni, YENI_ADLAR[0]) === 1 && kez(suitYeni, YENI_ADLAR[1]) === 1, "süit sayacı + +2 kapı adı"],
  [readFileSync(VAKA, "utf8").split("\n").filter(s => s.trim() !== "").length === YENI_SAYI, "vaka txt = " + YENI_SAYI + " dolu satır"],
  [(readFileSync(MAN, "utf8").match(/^  "([^"]+)": (\d+),/gm) || []).reduce((a, r) => a + Number(r.match(/: (\d+),/)[1]), 0) === TOPLAM_BEKLENEN, "donmuş manifest TOPLAMI = " + TOPLAM_BEKLENEN + " (öncesi " + TOPLAM_ONCE + ")"],
  [readFileSync(MAN, "utf8").includes(MAN_SATIR_SN) && readFileSync(ELLEMAN, "utf8").includes(MAN_SATIR_SN), "donmuş iki manifest ELLE eşitlendi"],
];
const dusen = kanitlar.filter(k => !k[0]).map(k => k[1]);
if (dusen.length) { console.error("KANIT DÜŞTÜ: " + dusen.join(" · ")); process.exit(1); }
console.log("Kanıt: " + kanitlar.map(k => k[1]).join(" · "));

/* ---------- SENKRON + DAMGA (idempotent) ---------- */
const SONRA = { byte: Buffer.byteLength(appYeni, "utf8"), sha: sha(appYeni), satir: appYeni.split("\n").length };
if (appYazildi) console.log("Sonra: " + APP + " · " + SONRA.byte + " B · " + SONRA.satir + " satır · SHA-256 " + SONRA.sha + " · SHA16 " + SONRA.sha.slice(0, 16));
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

if (!isYapildi && !senkronVar) {
  console.log(MARKER + ": yapacak iş yok (kurallar + senkron + damga yerinde).");
  process.exit(2);
}
console.log(MARKER + " TAMAM. (varsayılan koşu bundan sonra no-op exit 2 olur.)");
