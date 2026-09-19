/* ks-yama-gunluk-ders-tasi.mjs — GUNLUK-DERS-TASI-YAMASI uygulayıcısı (ks-yama-*.mjs konvansiyonu, İDEMPOTENT).
   TEK İŞ: günlük tabloda (gunlukTablo; satır=öğretmen, kolon=saat) MEVCUT birebir ders kartını AYNI SATIRDA
   başka BOŞ saate taşımak. Altyapı HAFTALIK dilimde kurulmuş olandır (dersDrag/dersBurak/dersDropHedef +
   aynı istekDragOver/istekDragLeave/istekBurak drop yolu). ÜÇÜNCÜ paralel drag&drop sistemi KURULMAZ.

   NEDEN SCRIPT: app.js 4.457 satır / ~290 KB'dır; Freebuff dosya aracı bu dosyanın yalnız ilk ~600 satırını
   eşleştirebiliyor (derin bölgelerdeki düzenlemeler "not found" ile düşüyor). Aynı sınır CHECKPOINT.md için
   de geçerli. Bu yüzden yama repo'nun kendi ks-yama-*.mjs geleneğiyle uygulanır:
     • her hedef DİZGE tam olarak 1 kez geçmek zorunda → aksi hâlde HİÇBİR ŞEY yazılmaz (fail-closed)
     • yazımdan önce node --check, sonrasında byte + SHA-256 raporu
     • backup YOKSA oluşturulur, VARSA ÜZERİNE YAZILMAZ (byte + SHA-256 raporlanır)
     • 2. koşu: app.js'e DOKUNULMAZ; test.mjs kaydı ve ks-ders-tasi.mjs düzeltmesi tekrar uygulanmaz.
   v1 KARARI: yalnız AYNI ÖĞRETMEN SATIRINDA saat değişikliği. Başka satıra bırakma RED; öğretmen otomatik
   değişmez. Gün değişikliği bu tabloda YOK (seçili gün sabit). Dersin öğretmen/tarih alanları DEĞİŞMEZ;
   yalnız saat/kod değişir. */
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const DOSYA = "app.js";
const TEST = "test.mjs";
const HAFTALIK_SUIT = "ks-ders-tasi.mjs";
const SUIT = "ks-gunluk-ders-tasi.mjs";
const YEDEK = "app.js.gunluk-ders-tasi-oncesi.bak";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const kez = (s, d) => d.split(s).length - 1;

if (!existsSync(DOSYA)) { console.error("HEDEF YOK: " + DOSYA); process.exit(1); }

/* ---- YEDEK: yoksa oluştur, varsa ASLA üzerine yazma ---- */
const srcIlk = readFileSync(DOSYA, "utf8");
if (!existsSync(YEDEK)) {
  writeFileSync(YEDEK, srcIlk);
  console.log("Yedek : " + YEDEK + " OLUŞTURULDU · " + statSync(YEDEK).size + " B · SHA-256 " + sha(readFileSync(YEDEK)));
} else {
  console.log("Yedek : " + YEDEK + " ZATEN VAR (üzerine yazılmadı) · " + statSync(YEDEK).size + " B · SHA-256 " + sha(readFileSync(YEDEK)));
}

const src = srcIlk;
const ONCE = { byte: Buffer.byteLength(src, "utf8"), sha: sha(src), satir: src.split("\n").length };
console.log("Önce : " + DOSYA + " · " + ONCE.byte + " B · " + ONCE.satir + " satır · SHA-256 " + ONCE.sha);

/* ------------------------------------------------------------------ */
const YAMALAR = [
  {
    ad: "1) günlük tablo satır kimliği haritası (ad → ogretmenId) + ders döngüsünde doldurma",
    eski: String.raw`  var ogrtMap = {};
  gunDersler.forEach(function (l) {
    var k = l.ogretmenAd || "Bilinmiyor";
    if (!ogrtMap[k]) ogrtMap[k] = {};
    ogrtMap[k][l.saat] = l;
  });`,
    yeni: String.raw`  var ogrtMap = {};
  var ogrtIdMap = {}; /* GUNLUK-DERS-TASI-YAMASI: satır öğretmen kimliği (ad → ogretmenId); hedef satırın ogretmenId'si drop doğrulamasında kullanılır */
  gunDersler.forEach(function (l) {
    var k = l.ogretmenAd || "Bilinmiyor";
    if (!ogrtMap[k]) ogrtMap[k] = {};
    ogrtMap[k][l.saat] = l;
    if (!ogrtIdMap[k] && l.ogretmenId) ogrtIdMap[k] = l.ogretmenId;
  });`
  },
  {
    ad: "2) ek ders döngüsünde de kimlik toplama + eksik satır kimliğini ad üzerinden TEK eşlemeyle tamamlama",
    eski: String.raw`      var k = l.ogretmenAd || "Bilinmiyor";
      if (!ogrtMap[k]) ogrtMap[k] = {};
      ogrtMap[k][l.saat] = l;
    }
  });

  var ogrtSirasi = Object.keys(ogrtMap).sort();`,
    yeni: String.raw`      var k = l.ogretmenAd || "Bilinmiyor";
      if (!ogrtMap[k]) ogrtMap[k] = {};
      ogrtMap[k][l.saat] = l;
      if (!ogrtIdMap[k] && l.ogretmenId) ogrtIdMap[k] = l.ogretmenId;
    }
  });

  var ogrtSirasi = Object.keys(ogrtMap).sort();
  /* GUNLUK-DERS-TASI-YAMASI: satır kimliği eksikse ad üzerinden TEK eşleme ile tamamlanır;
     çözülemezse "" kalır → o satırda drop-zone ÇİZİLMEZ (ölü hedef yok, mevcut görünüm korunur). */
  ogrtSirasi.forEach(function (ad) {
    if (!ogrtIdMap[ad]) { var ts = DB.ogretmenler.find(function (x) { return x.ad === ad; }); ogrtIdMap[ad] = ts ? ts.id : ""; }
  });`
  },
  {
    ad: "3) satır döngüsüne satırın ogretmenId'si (hedef doğrulaması için)",
    eski: String.raw`  ogrtSirasi.forEach(function (ogrtAd, oi) {
    var saatMap = ogrtMap[ogrtAd];
    var bg = oi % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';`,
    yeni: String.raw`  ogrtSirasi.forEach(function (ogrtAd, oi) {
    var saatMap = ogrtMap[ogrtAd];
    var ogrtId = ogrtIdMap[ogrtAd] || ""; /* GUNLUK-DERS-TASI-YAMASI: satırın öğretmen kimliği — hedef satır kontrolü bununla yapılır */
    var bg = oi % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';`
  },
  {
    ad: "4) günlük birebir hücresi: yalnız AKTİF TEK ÖĞRENCİLİ ders draggable (mevcut dersDrag yolu)",
    eski: String.raw`          /* BIREBIR-GORUNUM-ORTAK-YAMASI: haftalik tablo ile AYNI hücre (tam ad + gerçek konu + sınıf; ders adı yok) */
          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors">' +
            birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || "", sinif, durumRenkG);`,
    yeni: String.raw`          /* BIREBIR-GORUNUM-ORTAK-YAMASI: haftalik tablo ile AYNI hücre (tam ad + gerçek konu + sınıf; ders adı yok) */
          /* GUNLUK-DERS-TASI-YAMASI: yalnız AKTİF TEK ÖĞRENCİLİ birebir ders draggable'dır;
             grup / iptal / Sınıf Dersi (rose) / Ek Ders (amber) / Kapalı (gri) sürüklenemez.
             Taşıma MEVCUT dersDrag/dersBurak yoluyla yapılır — paralel DnD sistemi kurulmaz. */
          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors"' +
            (ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ? ' draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \'' + esc(ders.id) + '\'); this.style.opacity=\'0.45\'" ondragend="dersDropHedef=null; this.style.opacity=\'\'"' : '') + '>' +
            birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || "", sinif, durumRenkG);`
  },
  {
    ad: "5) günlük boş hücre: MEVCUT dnd-bos drop-zone yolu (istekDragOver/istekDragLeave/istekBurak → dersBurak); mola bu dala hiç girmez",
    eski: String.raw`        } else {
          html += '<td class="px-1.5 py-2 border-r border-slate-200"></td>';
        }`,
    yeni: String.raw`        } else if (ogrtId) {
          /* GUNLUK-DERS-TASI-YAMASI: boş hücre = MEVCUT drop-zone yolu (aynı dnd-bos + istekDragOver/istekDragLeave +
             istekBurak → dersBurak devri). Mola hücresi bu dala HİÇ girmez (slot.mola dalı üstte).
             Hedef gün SABİTTİR (gunKey); gün değişikliği bu tabloda YOK. Saat MEVCUT SAAT_SLOTLARI yardımcısından (slot.b). */
          html += '<td class="dnd-bos px-1.5 py-2 border-r border-slate-200 transition-colors"' +
            ' data-drop-ogrt="' + esc(ogrtId) + '" data-drop-gun="' + dowIdx(gunKey) + '" data-drop-saat="' + slot.b + '"' +
            ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)" ondrop="istekBurak(event, this, \'' + esc(ogrtId) + '\', \'' + gunKey + '\', \'' + slot.b + '\')" title="Boş saat — ders kartını ya da havuz isteğini bırakın">' +
            '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
        } else {
          html += '<td class="px-1.5 py-2 border-r border-slate-200"></td>';
        }`
  }
];

/* ---- app.js: uygula ya da zaten uygulanmışsa doğrula (idempotent) ---- */
const ZATEN = src.includes("GUNLUK-DERS-TASI-YAMASI");
if (ZATEN) {
  console.log("app.js: yama ZATEN uygulanmış → dosyaya DOKUNULMADI (idempotent).");
  const eksik = YAMALAR.filter(y => !src.includes(y.yeni)).map(y => y.ad);
  if (eksik.length) { console.error("HATA: işaret var ama yama bütünü eksik → " + eksik.join(" | ")); process.exit(1); }
  console.log("  ✓ " + YAMALAR.length + " yama bloğunun tamamı yerinde");
} else {
  let out = src;
  for (const y of YAMALAR) {
    const c = kez(y.eski, out);
    if (c !== 1) { console.error("\nDUR (fail-closed): " + y.ad + " → hedef " + c + " kez bulundu (1 olmalı). Dosya YAZILMADI."); process.exit(1); }
    out = out.split(y.eski).join(y.yeni);
    console.log("  ✓ " + y.ad);
  }

  /* Yazım öncesi sözleşme kontrolleri:
     ayni() = yama öncesi taban sayı ile birebir eşit (dokunulmadı) · eklendi() = taban + 1 */
  const ayni = (s) => kez(s, out) === kez(s, src);
  const eklendi = (s) => kez(s, out) === kez(s, src) + 1;
  const gunlukBolge = (h) => { const i = h.indexOf("function gunlukTablo() {"); const j = h.indexOf("\nfunction ", i + 10); return h.slice(i, j); };
  const KONTROL = [
    ["günlük yama işareti ≥ 5 (harita + tamamlama + satır kimliği + kaynak hücre + drop-zone)", kez("GUNLUK-DERS-TASI-YAMASI", out) >= 5 && kez("GUNLUK-DERS-TASI-YAMASI", src) === 0],
    ["paralel dersDrag tanımı YOK (üçüncü sistem kurulmadı)", kez("function dersDrag(", out) === 1 && kez("function dersDrag(", src) === 1],
    ["paralel dersDragOver YOK", !out.includes("function dersDragOver(")],
    ["mevcut dersBurak tek tanım (yeniden kullanım)", kez("function dersBurak(ogrtId, tarih, saat) {", out) === 1],
    ["tek drop yolu: istekBurak → dersBurak devri (taban)", ayni("if (dersDropHedef) { dersBurak(ogrtId, tarih, saat); return; }")],
    ["drop-zone çağrısı 2 yol (haftalık + günlük), aynı handler adı", kez('ondrop="istekBurak(event, this,', out) === 2],
    ["draggable kaynak satırı tam 2 (haftalık + günlük birebir)", kez('draggable="true" style="cursor:grab"', out) === 2],
    ["günlük drop-zone class'ı dnd-bos (mevcut stil) tam 1", eklendi('class="dnd-bos px-1.5 py-2')],
    ["haftalık drop-zone class'ı dnd-bos KORUNDU (taban)", ayni('class="dnd-bos px-1.5 py-1.5')],
    ["günlük draggable koşulu tek öğrencili birebir (+1)", eklendi('(ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ?')],
    ["günlük hedef saat MEVCUT yardımcıdan (slot.b) — index varsayımı yok", gunlukBolge(out).includes('data-drop-saat="\' + slot.b + \'"')],
    ["günlük hedef gün MEVCUT dowIdx(gunKey) ile — gün değişmez", gunlukBolge(out).includes('data-drop-gun="\' + dowIdx(gunKey) + \'"') && gunlukBolge(out).includes("+ gunKey +")],
    ["günlük mola dalı dokunulmadı (taban) + mola drop-zone DEĞİL", ayni('if (slot.mola) {') && ayni('text-[10px] font-bold text-emerald-600">Mola<') && !gunlukBolge(out).includes('data-drop-saat="12:00"')],
    ["haftalık hücre stil satırı dokunulmadı (taban)", ayni('var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";')],
    ["dersBurak tek saveDB yolu korundu (taban)", ayni("l.tarih = staged.tarih; l.saat = staged.saat; l.kod = staged.kod;")],
    ["dersBurak duzeltmeBul ile çakışma (kaynak hariç) korundu (taban)", ayni("duzeltmeBul({ id: staged.id,")],
    ["istek kartı inline ondragstart korundu (taban)", ayni('ondragstart="istekDrag(event,')],
    ["istekBurak kilit kontrolü korundu (taban)", ayni("Bu saat kilitli ya da dolu — istek bırakılamadı.")],
    ["günlük amber Ek Ders dalı dokunulmadı (taban)", ayni("bg-amber-50")],
    ["günlük grup alt satırı dokunulmadı (taban)", ayni("grupUyeEtiketleri(ders)")],
    ["günlük boş hücre else dalı yalnız kimliksiz satırda (ölü hedef yok)", gunlukBolge(out).includes("} else if (ogrtId) {")],
    ["EK-DERS-GORUNUM mark sayısı değişmedi (taban = 5)", ayni("EK-DERS-GORUNUM") && kez("EK-DERS-GORUNUM", src) === 5],
    ["günlük satır öğretmen adı çizimi dokunulmadı (taban)", ayni('esc(ogrtAd) + \'</div></td>\'')]
  ];
  for (const [ad, ok] of KONTROL) if (!ok) { console.error("\nDUR (fail-closed): sözleşme düştü → " + ad + ". Dosya YAZILMADI."); process.exit(1); }
  console.log("Sözleşme kontrolü: " + KONTROL.length + "/" + KONTROL.length + " ✓");

  /* Geçici dosyaya yaz → node --check → ancak geçerse app.js'e taşı */
  const TMP = "gunluk-ders-tasi-check.tmp.js"; /* .js uzantısı: node --check uzantıya göre ayrıştırır */
  writeFileSync(TMP, out);
  try { execFileSync(process.execPath, ["--check", TMP], { stdio: "pipe" }); }
  catch (e) { console.error("\nDUR: node --check başarısız, app.js YAZILMADI.\n" + (e.stderr || e.stdout || e.message)); unlinkSync(TMP); process.exit(1); }
  console.log("node --check: ✓");
  writeFileSync(DOSYA, out);
  unlinkSync(TMP);
}

const SONRA = readFileSync(DOSYA, "utf8");
const SN = { byte: Buffer.byteLength(SONRA, "utf8"), sha: sha(SONRA), satir: SONRA.split("\n").length };
console.log("Sonra: " + DOSYA + " · " + SN.byte + " B · " + SN.satir + " satır · SHA-256 " + SN.sha);

/* ---- test.mjs: süit kaydı (tam 1 kez, idempotent) ---- */
let testSrc = readFileSync(TEST, "utf8");
if (kez(SUIT, testSrc) === 0) {
  const ANCHOR = '"' + HAFTALIK_SUIT + '"];';
  if (kez(ANCHOR, testSrc) !== 1) { console.error("DUR: test.mjs süit dizisi çapası bulunamadı."); process.exit(1); }
  testSrc = testSrc.replace(ANCHOR, '"' + HAFTALIK_SUIT + '", "' + SUIT + '"];');
  writeFileSync(TEST, testSrc);
  console.log(TEST + ": " + SUIT + " kaydedildi (tam 1 kez).");
} else if (kez(SUIT, testSrc) === 1) {
  console.log(TEST + ": " + SUIT + " ZATEN tam 1 kez kayıtlı → dokunulmadı.");
} else {
  console.error("DUR: test.mjs'te " + SUIT + " " + kez(SUIT, testSrc) + " kez kayıtlı (1 olmalı).");
  process.exit(1);
}

/* ---- ks-ders-tasi.mjs: GÜNLÜK günlük tablo artık draggable olduğu için 2 STALE assert güncellenir.
       Assertion SAYISI değişmez (düşüş sıfır); yalnız kapsam yeni AÇIK KARARA göre düzeltilir. ---- */
const hs = readFileSync(HAFTALIK_SUIT, "utf8");
const H_ESKI_1 = String.raw`/* günlük tablo draggable DEĞİL (görünüm korundu) */
ui.filtre = "gun"; ui.anchor = gelecekPzt; ui.gunSecim = gelecekPzt;
t("günlük tablo hücreleri draggable DEĞİL (görünüm korundu)", !gunlukTablo().includes("draggable"));`;
const H_YENI_1 = String.raw`/* günlük tablo artık YALNIZ aynı-satır birebir hücresinde draggable (GUNLUK-DERS-TASI-YAMASI) */
ui.filtre = "gun"; ui.anchor = gelecekPzt; ui.gunSecim = gelecekPzt;
t("günlük tablo birebir hücresi draggable (GUNLUK-DERS-TASI-YAMASI)", tdBlok(gunlukTablo(), 'title="Dolu').includes('draggable="true" style="cursor:grab" ondragstart="dersDrag(event,'));`;
const H_ESKI_2 = String.raw`t("haftalık tabloda draggable yalnız birebir ders hücresinde (" + kez("draggable=\"true\"") + " kaynak satırı)",
  kez('draggable="true" style="cursor:grab"') === 1);`;
const H_YENI_2 = String.raw`t("draggable kaynak: 2 birebir hücre (haftalık + günlük) (" + kez("draggable=\"true\"") + " kaynak satırı)",
  kez('draggable="true" style="cursor:grab"') === 2);`;

if (hs.includes(H_YENI_1) && hs.includes(H_YENI_2)) {
  console.log(HAFTALIK_SUIT + ": stale günlük assert'leri ZATEN güncel → dokunulmadı.");
} else {
  if (kez(H_ESKI_1, hs) !== 1 || kez(H_ESKI_2, hs) !== 1) {
    console.error("DUR: " + HAFTALIK_SUIT + " stale assert çapaları bulunamadı (dosya değişmiş olabilir). Süit dosyası YAZILMADI.");
    process.exit(1);
  }
  let hsOut = hs.split(H_ESKI_1).join(H_YENI_1).split(H_ESKI_2).join(H_YENI_2);
  const onceT = (hs.match(/\n\s*t\(/g) || []).length, sonraT = (hsOut.match(/\n\s*t\(/g) || []).length;
  if (onceT !== sonraT) { console.error("DUR: " + HAFTALIK_SUIT + " assertion sayısı değişti (" + onceT + " → " + sonraT + ") — düşüş yasak. YAZILMADI."); process.exit(1); }
  writeFileSync(HAFTALIK_SUIT, hsOut);
  console.log(HAFTALIK_SUIT + ": 2 stale assert güncellendi (assertion sayısı sabit: " + sonraT + ").");
}

console.log("Fark : app.js +" + (SN.byte - ONCE.byte) + " B · +" + (SN.satir - ONCE.satir) + " satır");
console.log("GUNLUK-DERS-TASI-YAMASI uygulandı ✓ (yeniden koşmak dosyalara dokunmaz)");
