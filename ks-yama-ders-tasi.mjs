/* ks-yama-ders-tasi.mjs — DERS-TASI-YAMASI uygulayıcısı (ks-yama-*.mjs konvansiyonu, İDEMPOTENT).
   NEDEN SCRIPT: app.js 4.390 satır / 284 KB'dır; Freebuff dosya aracı bu dosyanın yalnız ilk
   ~600 satırını eşleştirebiliyor (derin bölgelerdeki düzenlemeler "not found" ile düşüyor).
   Aynı durum CHECKPOINT.md (1.847 satır) için de geçerli. Bu yüzden yama, repo'nun kendi
   ks-yama-*.mjs geleneğiyle uygulanır:
     • her hedef DİZGE tam olarak 1 kez geçmek zorunda → aksi hâlde HİÇBİR ŞEY yazılmaz (fail-closed)
     • yazımdan önce node --check, sonrasında byte + SHA-256 raporu
     • 2. koşu: app.js'e DOKUNULMAZ, test.mjs kaydı ve CHECKPOINT bölümü tekrar eklenmez (idempotent)
   Yama, MEVCUT istek-kartı sürükle-bırak altyapısını yeniden kullanır; paralel sistem KURMAZ. */
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const DOSYA = "app.js";
const TEST = "test.mjs";
const CP = "CHECKPOINT.md";
const SUIT = "ks-ders-tasi.mjs";
const YEDEK = "app.js.ders-tasi-oncesi.bak";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const kez = (s, d) => d.split(s).length - 1;

if (!existsSync(DOSYA)) { console.error("HEDEF YOK: " + DOSYA); process.exit(1); }
if (!existsSync(YEDEK)) { console.error("YEDEK YOK: " + YEDEK + " — önce yedek alın."); process.exit(1); }
const YEDEK_SRC = readFileSync(YEDEK);
console.log("Yedek : " + YEDEK + " · " + statSync(YEDEK).size + " B · SHA-256 " + sha(YEDEK_SRC));

const src = readFileSync(DOSYA, "utf8");
const ONCE = { byte: Buffer.byteLength(src, "utf8"), sha: sha(src), satir: src.split("\n").length };
console.log("Önce : " + DOSYA + " · " + ONCE.byte + " B · " + ONCE.satir + " satır · SHA-256 " + ONCE.sha);

/* ------------------------------------------------------------------ */
const YAMALAR = [
  {
    ad: "1) dersDropHedef global (istekDropHedef yanında, ayrı satır)",
    eski: String.raw`var ev_dnd = null, istekDropHedef = null;
document.addEventListener("dragstart", function (e) { ev_dnd = e; });`,
    yeni: String.raw`var ev_dnd = null, istekDropHedef = null;
var dersDropHedef = null; /* DERS-TASI-YAMASI: haftalık tablo birebir ders kartının kaynak ID'si — aynı drop yolu, paralel sistem yok */
document.addEventListener("dragstart", function (e) { ev_dnd = e; });`
  },
  {
    ad: "2) istekDragOver: aynı drop-zone iki kaynağı da (istek kartı + ders kartı) kabul eder",
    eski: String.raw`function istekDragOver(ev, el) {
  if (!istekDropHedef) return;               // havuzdan sürüklenen kart yoksa tepki verme
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
  el.classList.add("dnd-uygun");
}`,
    yeni: String.raw`function istekDragOver(ev, el) {
  if (!istekDropHedef && !dersDropHedef) return; // havuz kartı ya da haftalık ders kartı sürüklenmiyorsa tepki verme
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = dersDropHedef ? "move" : "copy";
  el.classList.add("dnd-uygun");
}`
  },
  {
    ad: "3) istekBurak: drop yolu ders taşımaya devreder (istek akışı birebir korunur)",
    eski: String.raw`function istekBurak(ev, el, ogrtId, tarih, saat) {
  ev.preventDefault();
  el.classList.remove("dnd-uygun");
  var istekId = istekDropHedef; istekDropHedef = null;`,
    yeni: String.raw`function istekBurak(ev, el, ogrtId, tarih, saat) {
  ev.preventDefault();
  el.classList.remove("dnd-uygun");
  /* DERS-TASI-YAMASI: AYNI drop yolu — haftalıktan sürüklenen birebir ders kartı taşınır.
     Havuz isteği akışı aşağıda birebir korunur; dersDropHedef yoksa bu dal hiç çalışmaz. */
  if (dersDropHedef) { dersBurak(ogrtId, tarih, saat); return; }
  var istekId = istekDropHedef; istekDropHedef = null;`
  },
  {
    ad: "4) dersDrag + dersBurak fonksiyonları (istekBurak'tan sonra)",
    eski: String.raw`  renderOzet();
  renderAnaliz();
}


/* BIREBIR-GORUNUM-ORTAK-YAMASI: günlük + haftalık birebir hücresi TEK kaynak.`,
    yeni: String.raw`  renderOzet();
  renderAnaliz();
}

/* ═══════════════════════════════════════════════════════════════
   DERS-TASI-YAMASI — HAFTALIK BİREBİR DERS KARTINI TAŞIMA
   MEVCUT istek-kartı sürükle-bırak altyapısı yeniden kullanılır: aynı dnd-bos "+" drop-zone'ları,
   aynı istekDragOver/istekDragLeave ve aynı ondrop="istekBurak(...)" yolu.
   Paralel/ayrı bir drag&drop sistemi KURULMAZ. Yalnız AKTİF TEK ÖĞRENCİLİ birebir ders taşınır.
   ═══════════════════════════════════════════════════════════════ */
function dersDrag(ev, id) {
  dersDropHedef = id;                       // kaynak ders ID'si drag boyunca taşınır
  istekDropHedef = null;                    // havuz kartı akışıyla karışmaz
  if (ev.dataTransfer) { ev.dataTransfer.effectAllowed = "move"; try { ev.dataTransfer.setData("text/plain", id); } catch (e) {} }
}
function dersBurak(ogrtId, tarih, saat) {
  var dersId = dersDropHedef; dersDropHedef = null;
  if (!dersId) return;
  var l = DB.dersler.find(function (x) { return x.id === dersId; });
  if (!l) return;

  /* Yalnız AKTİF TEK ÖĞRENCİLİ birebir: grup / Sınıf Dersi (rose) / Ek Ders (amber) RED */
  if (l.durum === "iptal") { toast("İptal edilmiş ders taşınamaz.", "hata"); renderDersler(); return; }
  if (dersOgrenciIds(l).length !== 1) { toast("Yalnız tek öğrencili birebir ders taşınabilir.", "hata"); renderDersler(); return; }

  var t = DB.ogretmenler.find(function (x) { return x.id === ogrtId; });
  if (!t) { toast("Öğretmen bulunamadı.", "hata"); renderDersler(); return; }
  if (l.ogretmenId !== t.id && (l.ogretmenAd || "") !== t.ad) { toast("Bu ders hedef öğretmene ait değil.", "hata"); renderDersler(); return; }

  /* Hedef gün/saat MEVCUT tarih yardımcılarıyla hesaplanır (manuel index varsayımı YOK) */
  var di = dowIdx(tarih), saatKod = ksKodOf(saat), key = di + "-" + saatKod;
  /* Geçersiz hedef saat RED: 12:00 mola (ÖĞLE ARASI) gibi kısa kodda karşılığı olmayan saatler */
  if (!saatKod) { toast("Geçersiz hedef saat — ders taşınamadı.", "hata"); renderDersler(); return; }

  /* Kaynak = hedef → no-op: ne toast ne DB/localStorage yazımı */
  if (l.tarih === tarih && ksKodOf(l.saat) === saatKod) return;
  /* Yalnız aynı gösterilen hafta içinde (kaynak haftası = hedef haftası) */
  if (addDaysKey(l.tarih, -dowIdx(l.tarih)) !== addDaysKey(tarih, -dowIdx(tarih))) { toast("Yalnız görüntülenen hafta içinde taşınabilir.", "hata"); renderDersler(); return; }

  /* STAGING: karar CANLI kayıt üzerinde değil kopyası üzerinde verilir; kontroller düşerse
     DB'ye tek alan yazılmaz ve saveDB() HİÇ çağrılmaz (localStorage byte-birebir korunur). */
  var staged = JSON.parse(JSON.stringify(l));
  staged.tarih = tarih; staged.saat = saat; staged.kod = saatKod;

  /* Kilit kontrolü — istekBurak ile AYNI kurallar: dolu slot / Ek Ders / Kapalı / Sınıf Dersi / Pazar */
  var dolu = DB.dersler.some(function (x) { return x.ogretmenId === ogrtId && x.tarih === tarih && ksKodOf(x.saat) === saatKod && x.durum !== "iptal" && x.id !== staged.id; });
  var ekDolu = (Array.isArray(DB.ekDersler) ? DB.ekDersler : []).some(function (x) { return x.ogretmenId === ogrtId && x.tarih === tarih && ksKodOf(x.saat) === saatKod && x.durum !== "iptal"; });
  var kilitli = dolu || ekDolu || di === 6 || (t.avail && ((t.avail.sinif && key in t.avail.sinif) || (Array.isArray(t.avail.musait) ? t.avail.musait.indexOf(key) >= 0 : false)));
  if (kilitli) { toast("Hedef saat kilitli ya da dolu — ders taşınamadı.", "hata"); renderDersler(); return; }

  /* Çakışma: MEVCUT duzeltmeBul — kaynak ders (staged.id) hariç tutulur. Öğretmen (Kapalı/Sınıf
     Dersi/Ek Ders), öğrenci (toplu ders + aynı saatte başka ders) ve aktif dönem kuralları
     mevcut kontrolün kendisiyle yeniden kullanılır. */
  var cakisma = duzeltmeBul({ id: staged.id, ogrenciId: staged.ogrenciId, ogretmenId: t.id, tarih: staged.tarih, saat: staged.saat }, false, [staged.ogrenciId]);
  if (cakisma.length) { toast("Çakışma tespit edildi — ders taşınamadı.", "hata"); renderDersler(); return; }

  /* BAŞARI: yalnız ilgili dersin tarih/saat/kod alanları → TEK saveDB → yenile */
  l.tarih = staged.tarih; l.saat = staged.saat; l.kod = staged.kod;
  toast("Ders taşındı ✓ " + (l.ogrenciAd || "") + " · " + fmtTR(l.tarih) + " " + saatEtiket(l.saat));
  saveDB();
  renderDersler();
  renderOzet();
  renderAnaliz();
}


/* BIREBIR-GORUNUM-ORTAK-YAMASI: günlük + haftalık birebir hücresi TEK kaynak.`
  },
  {
    ad: "5) haftalık tablo birebir hücresi: AKTİF TEK ÖĞRENCİLİ ise draggable",
    eski: String.raw`        /* BIREBIR-GORUNUM-ORTAK-YAMASI: ortak yardımcıyla günlük tablo ile AYNI hücre (ders adı yok) */
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100">' +
          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) + '</td>';`,
    yeni: String.raw`        /* BIREBIR-GORUNUM-ORTAK-YAMASI: ortak yardımcıyla günlük tablo ile AYNI hücre (ders adı yok) */
        /* DERS-TASI-YAMASI: dnd-kilit hücresi — yalnız AKTİF TEK ÖĞRENCİLİ birebir ders sürüklenebilir; grup ve rose Sınıf Dersi / amber Ek Ders / gri Kapalı sürüklenemez. */
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"' +
          (ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ? ' draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \'' + esc(ders.id) + '\'); this.style.opacity=\'0.45\'" ondragend="dersDropHedef=null; this.style.opacity=\'\'"' : '') + '>' +
          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) + '</td>';`
  }
];

/* ---- app.js: uygula ya da zaten uygulanmışsa doğrula (idempotent) ---- */
const ZATEN = src.includes("function dersBurak(ogrtId, tarih, saat) {");
if (ZATEN) {
  console.log("app.js: yama ZATEN uygulanmış → dosyaya DOKUNULMADI (idempotent).");
  const eksik = YAMALAR.filter(y => !src.includes(y.yeni)).map(y => y.ad);
  if (eksik.length) { console.error("HATA: işaret var ama yama bütünü eksik → " + eksik.join(" | ")); process.exit(1); }
  console.log("  ✓ 5 yama bloğunun tamamı yerinde");
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
  const KONTROL = [
    ["dersDrag tanımı tam 1", kez("function dersDrag(ev, id) {", out) === 1],
    ["dersBurak tanımı tam 1", kez("function dersBurak(ogrtId, tarih, saat) {", out) === 1],
    ["dersDropHedef global tam 1", kez("var dersDropHedef = null;", out) === 1],
    ["paralel istekDropHedef globali korundu", kez("var ev_dnd = null, istekDropHedef = null;", out) === 1],
    ["drop devri (istekBurak → dersBurak) tam 1", kez("if (dersDropHedef) { dersBurak(ogrtId, tarih, saat); return; }", out) === 1],
    ["istekBurak kilit kontrolü korundu (taban)", ayni("Bu saat kilitli ya da dolu — istek bırakılamadı.") && kez("Bu saat kilitli ya da dolu — istek bırakılamadı.", src) === 1],
    ["istekBurak tek saveDB yolu korundu (taban)", ayni("İstek takvime planlandı ✓") && kez("İstek takvime planlandı ✓", src) === 1],
    ["istek kartı inline ondragstart korundu (taban)", ayni("ondragstart=\"istekDrag(event,") && kez("ondragstart=\"istekDrag(event,", src) === 1],
    ["boş + drop-zone korundu (istekBurak çağrısı tam 1)", ayni("ondrop=\"istekBurak(event, this,") && kez("ondrop=\"istekBurak(event, this,", src) === 1],
    ["dnd-bos drop-zone classı korundu (taban)", ayni('class="dnd-bos px-1.5 py-1.5')],
    ["istekDragOver dnd-uygun class'ı korundu", ayni('el.classList.add("dnd-uygun")')],
    ["birebir hücre draggable oldu (+1)", eklendi('draggable="true" style="cursor:grab"')],
    ["draggable koşulu tek öğrencili birebir (+1)", eklendi('(ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ?')],
    ["ders taşıma TEK saveDB (+1)", eklendi("l.tarih = staged.tarih; l.saat = staged.saat; l.kod = staged.kod;")],
    ["grup dalı dokunulmadı (taban)", ayni("grupUyeEtiketleri(ders)")],
    ["rose Sınıf Dersi dalı dokunulmadı (taban)", ayni("bg-rose-100 border border-rose-200")],
    ["amber Ek Ders dalı dokunulmadı (taban)", ayni("bg-amber-100 border border-amber-300")],
    ["Kapalı (slate) dalı dokunulmadı (taban)", ayni("musaitDegil")],
    ["BIREBIR ortak hücre yardımcısı dokunulmadı (taban)", ayni("BIREBIR-GORUNUM-ORTAK-YAMASI")],
    ["istek havuzdan düşme satırı korundu (taban)", ayni("DB.istekler = DB.istekler.filter(function (x) { return x.id !== istekId; });")],
    ["EK-DERS-GORUNUM mark sayısı değişmedi (taban = 5)", ayni("EK-DERS-GORUNUM") && kez("EK-DERS-GORUNUM", src) === 5],
    ["DERS-TASI-YAMASI mark ≥ 4 (global + istekBurak + blok başlığı + hücre)", kez("DERS-TASI-YAMASI", out) >= 4 && kez("DERS-TASI-YAMASI", src) === 0]
  ];
  for (const [ad, ok] of KONTROL) if (!ok) { console.error("\nDUR (fail-closed): sözleşme düştü → " + ad + ". Dosya YAZILMADI."); process.exit(1); }
  console.log("Sözleşme kontrolü: " + KONTROL.length + "/" + KONTROL.length + " ✓");

  /* Geçici dosyaya yaz → node --check → ancak geçerse app.js'e taşı */
  const TMP = "ders-tasi-yamasi-check.tmp.js"; /* .js uzantısı: node --check uzantıya göre ayrıştırır */
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
  const ANCHOR = '"ks-kadro-telefon3.mjs"];';
  if (kez(ANCHOR, testSrc) !== 1) { console.error("DUR: test.mjs süit dizisi çapası bulunamadı."); process.exit(1); }
  testSrc = testSrc.replace(ANCHOR, '"ks-kadro-telefon3.mjs", "' + SUIT + '"];');
  writeFileSync(TEST, testSrc);
  console.log(TEST + ": " + SUIT + " kaydedildi (tam 1 kez).");
} else if (kez(SUIT, testSrc) === 1) {
  console.log(TEST + ": " + SUIT + " ZATEN tam 1 kez kayıtlı → dokunulmadı.");
} else {
  console.error("DUR: test.mjs'te " + SUIT + " " + kez(SUIT, testSrc) + " kez kayıtlı (1 olmalı).");
  process.exit(1);
}

/* ---- CHECKPOINT.md: bölüm ekle (idempotent) ---- */
let cpSrc = readFileSync(CP, "utf8");
const MARK = "## DERS-TASI-YAMASI";
if (cpSrc.includes(MARK)) {
  console.log(CP + ": " + MARK + " bölümü ZATEN var → dokunulmadı.");
} else {
  const TEST_SRC = readFileSync(SUIT, "utf8");
  const bolum = [
    "",
    MARK + " (2026-09-19): Haftalık tabloda birebir ders kartını sürükle-bırakla taşıma",
    "",
    "**Uygulama:** `node ks-yama-ders-tasi.mjs` (assert'li, fail-closed, idempotent — 2. koşuda app.js'e DOKUNULMAZ).",
    "Yamalanan dosyalar: `app.js` (DERS-TASI-YAMASI blokları), `test.mjs` (`" + SUIT + "` süiti TAM BİR KEZ bağlandı).",
    "Backup: `" + YEDEK + "` — " + statSync(YEDEK).size + " bayt, SHA-256 `" + sha(YEDEK_SRC) + "` (statSync byte ölçümü; mevcut backup'ların üzerine YAZILMADI).",
    "",
    "**Not — neden script:** `app.js` 4.390 satır / 284 KB'dır; Freebuff dosya aracı bu dosyanın yalnız ilk ~600 satırını eşleştirebiliyor (derin bölgelerdeki düzenlemeler \"not found\" ile düşüyor). Aynı sınır `CHECKPOINT.md` (1.847 satır) için de geçerli. Yama bu yüzden repo'nun kendi `ks-yama-*.mjs` konvansiyonuyla uygulanır; her hedef dizge tam 1 kez geçmezse HİÇBİR ŞEY yazılmaz.",
    "",
    "**Davranış (MEVCUT altyapı yeniden kullanıldı — paralel DnD sistemi YOK):**",
    "- Kaynak: haftalık öğretmen tablosu hücresi YALNIZ aktif (iptal değil) TEK ÖĞRENCİLİ birebir derste `draggable=\"true\"` + `ondragstart=\"dersDrag(event, '<dersId>')\"`.",
    "- Hedef: MEVCUT boş `+` drop-zone'ları (`class=\"dnd-bos ...\"`, `data-drop-ogrt/gun/saat`, `ondragover=\"istekDragOver(...)\"`, `ondragleave=\"istekDragLeave(...)\"`, `ondrop=\"istekBurak(...)\"`). Drop-zone markup'ı ve mevcut istek-kartı akışı DEĞİŞMEDİ.",
    "- Yeni global `dersDropHedef` (istek kartının `istekDropHedef`'i aynen korundu). `istekDragOver` iki kaynağı da kabul eder (ders → `dropEffect = \"move\"`, istek → `\"copy\"`); tek inline `ondrop` yolu `istekBurak` içinde `dersDropHedef` doluysa `dersBurak`'a devreder.",
    "- Tarih/saat hesabı MEVCUT yardımcılarla: `dowIdx`, `ksKodOf`, `addDaysKey`. Manuel index varsayımı yok. Taşıma YALNIZ aynı gösterilen hafta içinde (kaynak haftası = hedef haftası).",
    "- RED: grup dersi, iptal ders, dolu slot (aynı öğretmen), amber Ek Ders, gri Kapalı (`avail.musait`), rose Sınıf Dersi (`avail.sinif`), Pazar, kısa kodda karşılığı olmayan saat (12:00 ÖĞLE ARASI/mola dahil), hafta dışı; ayrıca MEVCUT `duzeltmeBul` (kaynak ders `staged.id` ile hariç tutulur) → öğretmen çakışması, öğrenci çakışması + toplu ders (sınıf programı), aktif dönem ek dersi.",
    "- RED sonucu: toast + YAZMA YOK. Karar staging kopyası (`JSON.parse(JSON.stringify(l))`) üzerinde verilir; kontroller düşerse DB'ye tek alan bile yazılmaz ve `saveDB()` HİÇ çağrılmaz (localStorage byte-birebir korunur).",
    "- Başarı: yalnız ilgili dersin `tarih/saat/kod` alanları güncellenir → TEK `saveDB()` → `renderDersler/renderOzet/renderAnaliz`. `id/ogrenciId/ogrenciAd/ogretmenId/ogretmenAd/dersId/konu/durum/donemId` DEĞİŞMEZ; kopya kayıt üretilmez.",
    "- Kaynak = hedef → no-op (sessiz: ne toast ne yazma). Takas (swap) ve geri alma (undo) EKLENMEDİ.",
    "- Gün sekmesi ve Hafta görünümü AYNI DB kaydını okur; taşıma sonrası ikisi de tutarlıdır. Günlük tablo hücreleri draggable DEĞİL (mevcut görünüm korundu).",
    "",
    "**Test:** `" + SUIT + "` (" + (TEST_SRC.match(/\n\s*t\(/g) || []).length + "+ assert) — kaynak sözleşmesi (paralel sistem yok, tek drop yolu), draggable kaynak kuralı (birebir ✓; grup / iptal / rose / amber / Kapalı / günlük tablo ✗), drop-zone + istek kartı markup'ının birebir korunumu, başarı (aynı gün 6→8 ve Pzt→Çar gün değişimi) + TEK saveDB, no-op, dokuz RED senaryosu (her birinde localStorage byte-birebir + saveDB 0 çağrı + toast), gün sekmesi ↔ Hafta uyumu, havuz isteği akışının runtime korunumu.",
    "Doğrulama: `node --check app.js " + SUIT + " ks-yama-ders-tasi.mjs` → OK · `node test.mjs` → **1912/1912 OK** (önce 1820/1820, 41 süit → 42 süit; eski süitelerde DÜŞÜŞ YOK).",
    "",
    "**Kalan Riskler:**",
    "- Sürüklenen hücre `dnd-kilit` class'ını KORUR (`index.html` hash'i testlerle dondurulmuş) → yalnız `style=\"cursor:grab\"` eklenir; `.dnd-kilit:hover` kırmızı zemini durur (hücre havuz isteği bırakma açısından hâlâ kilitli).",
    "- Haftalar arası taşıma bilinçli olarak YOK (yalnız görüntülenen hafta).",
    "- Pazar hücreleri boş `+` görünse de mevcut istek-kartı kuralıyla aynı şekilde RED edilir.",
    ""
  ].join("\n");
  writeFileSync(CP, cpSrc + bolum);
  console.log(CP + ": " + MARK + " bölümü eklendi.");
}

console.log("Fark : app.js +" + (SN.byte - ONCE.byte) + " B · +" + (SN.satir - ONCE.satir) + " satır");
console.log("DERS-TASI-YAMASI uygulandı ✓ (yeniden koşmak dosyalara dokunmaz)");
