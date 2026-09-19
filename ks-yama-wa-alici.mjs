/* ks-yama-wa-alici.mjs — WA-ALICI-YAMASI (idempotent, assert'li, exact-anchor)
   TEK İŞ: WhatsApp bilgilendirme modalına GENEL alici secici ekle (Ogrenci/Anne/Baba).
   - #waModal içinde TEK select id="waAlici" (index.html — duplicate imkânsız).
   - Bellek içi state: waAktifOgrenciId + waAliciTipi (localStorage'a YAZILMAZ, yeni key YOK).
   - waAc() her açılışta alici = "ogrenci".
   - waAliciBilgisi(ogrenciId, aliciTipi) tek çözücü: ogrenci→o.tel, anne→o.anneTel, baba→o.babaTel.
   - waGonder: telefon yoksa toast + window.open YOK (fallback YOK).
   - waOnizle: metin = ogrenciMesajMetni (birebir); alici etiketi üst bilgide (#waAliciBilgi).
   - waSatir + Öğrenciler sekmesi waGonder yolu aynen öğrenci tel kullanır (kaynak kanıtı).
   - waUrl/encodeURIComponent/ogrenciMesajMetni formatı DEĞİŞMEZ.
   - Mevcut backup'ların üzerine YAZILMAZ: yeni ad app.js.wa-alici-oncesi.bak.
   2. koşu: "Zaten uygulanmış" → exit 2, dosyalara DOKUNMAZ. */
import { readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const boy = (f) => statSync(f).size;
const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };
const say = (hay, need) => hay.split(need).length - 1;

const ISARET = "WA-ALICI-YAMASI";

/* ---- idempotans ---- */
if (readFileSync("app.js", "utf8").includes(ISARET)) {
  console.log("Zaten uygulanmış (" + ISARET + " app.js'te mevcut) — dosyalar değiştirilmedi.");
  process.exit(2);
}

/* ---- salt-okuma exact-anchor envanteri (yazma ÖNCE) ---- */
const app0 = readFileSync("app.js", "utf8");
const html0 = readFileSync("index.html", "utf8");
const tm0 = readFileSync("test.mjs", "utf8");

const A_WAURL = "function waUrl(metin, tel) {";
const A_WAONIZLE = "function waOnizle(ogrenciId) {";
const A_WAGONDER = "function waGonder(ogrenciId) {";
const A_WAKAPAT = 'function waKapat() { $("waModal").classList.add("hidden"); }';
const A_WAONIZLEME_SIFIRLA = "function waOnizlemeSifirla() {";
const A_WAOPEN = 'window.open(waUrl(metin, o ? o.tel : ""), "_blank");';
const A_PANELHTML = '<div id="waOnizlemePanel" class="mx-3 mb-3 rounded-xl border border-indigo-100 bg-indigo-50/60">';

fail0: { /* (etiket yok — düz akış) */
}
if (say(app0, A_WAURL) !== 1) fail("anchor waUrl tam 1 kez değil");
if (say(app0, A_WAONIZLE) !== 1) fail("anchor waOnizle tam 1 kez değil");
if (say(app0, A_WAGONDER) !== 1) fail("anchor waGonder tam 1 kez değil");
if (say(app0, A_WAKAPAT) !== 1) fail("anchor waKapat tam 1 kez değil");
if (say(app0, A_WAONIZLEME_SIFIRLA) !== 1) fail("anchor waOnizlemeSifirla tam 1 kez değil");
if (say(app0, A_WAOPEN) !== 1) fail("anchor window.open(o.tel) tam 1 kez değil");
if (say(html0, A_PANELHTML) !== 1) fail("anchor waOnizlemePanel index.html'de tam 1 kez değil");
if (html0.includes("waAlici")) fail("index.html'de waAlici zaten var (beklenmedik)");
if (tm0.includes("ks-wa-alici.mjs")) fail("test.mjs'te ks-wa-alici.mjs zaten var");
console.log("Envanter OK: tüm exact-anchor'lar tam 1 kez.");

/* ---- backup (üzerine yazma YOK) ---- */
const BAK = "app.js.wa-alici-oncesi.bak";
copyFileSync("app.js", BAK);
console.log("Backup:", BAK, boy(BAK) + " B", "sha256=" + sha(BAK));

let app = app0;

/* ================= app.js yamaları ================= */

/* 1) State + waAliciBilgisi helper + waAliciDegistir — waUrl'den ÖNCE */
const YENI_HELPERS = `/* ${ISARET}: modal-genel alici secici (bellek içi state — localStorage'a YAZILMAZ).
   Tek çözücü waAliciBilgisi: ogrenci → o.tel | anne → o.anneTel | baba → o.babaTel.
   Telefon kayıtlı string AYNEN kullanılır (trim/normalize YOK); yoksa varMi=false (fallback YOK). */
var waAktifOgrenciId = null;
var waAliciTipi = "ogrenci";
function waAliciBilgisi(ogrenciId, aliciTipi) {
  var o = DB.ogrenciler.find(function (x) { return x.id === ogrenciId; });
  var tip = aliciTipi === "anne" || aliciTipi === "baba" ? aliciTipi : "ogrenci";
  var etiket = tip === "anne" ? "Anne" : tip === "baba" ? "Baba" : "Öğrenci";
  var telefon = o ? (tip === "anne" ? o.anneTel : tip === "baba" ? o.babaTel : o.tel) : "";
  return { ogrenci: o || null, tip: tip, etiket: etiket, telefon: telefon == null ? "" : String(telefon), varMi: !!(o && telefon) };
}
function waAliciDegistir(tip) {
  waAliciTipi = (tip === "anne" || tip === "baba") ? tip : "ogrenci";
  waAliciPanelGuncelle();
  if (waAktifOgrenciId) waOnizle(waAktifOgrenciId);
}
function waAliciPanelGuncelle() {
  var sel = document.getElementById("waAlici");
  if (sel) sel.value = waAliciTipi;
  var bilgiKutu = document.getElementById("waAliciBilgi");
  var uyariKutu = document.getElementById("waAliciUyari");
  if (!bilgiKutu || !uyariKutu) return;
  var a = waAktifOgrenciId ? waAliciBilgisi(waAktifOgrenciId, waAliciTipi) : null;
  if (a && a.ogrenci) {
    bilgiKutu.innerHTML = '<span class="font-bold text-indigo-700">' + a.etiket + "</span>" +
      '<span class="text-slate-400">·</span>' +
      '<span class="' + (a.varMi ? "text-slate-600" : "text-rose-500 font-semibold") + '">' +
      (a.varMi ? esc(a.telefon) : "telefon kayıtlı değil") + "</span>";
    uyariKutu.textContent = a.varMi ? "" : a.etiket + " telefonu kayitli degil";
  } else {
    bilgiKutu.innerHTML = '<span class="text-slate-400">Öğrenci seçilmedi</span>';
    uyariKutu.textContent = "";
  }
}
function waAliciSeciciHTML() {
  return '<div class="flex flex-wrap items-center gap-2 px-3 pt-3" id="waAliciBar">' +
    '<label class="text-[10.5px] font-extrabold uppercase tracking-wide text-slate-400 whitespace-nowrap"><i class="fa-solid fa-address-book mr-1"></i>Alıcı</label>' +
    '<select id="waAlici" onchange="waAliciDegistir(this.value)" class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-400/40">' +
    '<option value="ogrenci">Öğrenci</option><option value="anne">Anne</option><option value="baba">Baba</option></select>' +
    '<span id="waAliciBilgi" class="text-[11.5px] inline-flex items-center gap-1.5"></span>' +
    '<span id="waAliciUyari" class="text-[11px] font-semibold text-rose-500"></span>' +
    "</div>";
}

`;
const iInsert = app.indexOf(A_WAURL);
if (iInsert === -1) fail("insert noktası (waUrl) bulunamadı");
app = app.slice(0, iInsert) + YENI_HELPERS + app.slice(iInsert);

/* 2) waOnizle: waAktifOgrenciId takip + alici üst bilgi (metin yalnız ogrenciMesajMetni — birebir) */
const ONIZLE_ESKI = `  var o = DB.ogrenciler.find(function (x) { return x.id === ogrenciId; });
  var metin = ogrenciMesajMetni(ogrenciId); /* waGonder/waKopyalaMesaj ile BİREBİR aynı kaynak */
  if (baslik) baslik.textContent = o ? o.ad : "";`;
if (say(app, ONIZLE_ESKI) !== 1) fail("waOnizle gövde anchor tam 1 kez değil");
const ONIZLE_YENI = `  var o = DB.ogrenciler.find(function (x) { return x.id === ogrenciId; });
  waAktifOgrenciId = ogrenciId; /* ${ISARET}: aktif öğrenci takibi (alıcı seçimi korunur) */
  waAliciPanelGuncelle();
  var metin = ogrenciMesajMetni(ogrenciId); /* waGonder/waKopyalaMesaj ile BİREBİR aynı kaynak */
  if (baslik) baslik.textContent = o ? o.ad : "";`;
app = app.replace(ONIZLE_ESKI, ONIZLE_YENI);

/* 3) waGonder: seçili alıcıya göre çözüm; eksik telefonda window.open YOK, fallback YOK */
const GONDER_ESKI = `  var o = DB.ogrenciler.find(function (x) { return x.id === ogrenciId; });
  window.open(waUrl(metin, o ? o.tel : ""), "_blank");
  waKapat();`;
if (say(app, GONDER_ESKI) !== 1) fail("waGonder gövde anchor tam 1 kez değil");
const GONDER_YENI = `  var a = waAliciBilgisi(ogrenciId, waAliciTipi); /* ${ISARET}: seçili alıcı — fallback YOK */
  if (!a.varMi) { toast(a.etiket + " telefonu kayitli degil", "uyari"); return; }
  window.open(waUrl(metin, a.telefon), "_blank");
  waKapat();`;
app = app.replace(GONDER_ESKI, GONDER_YENI);

/* 4) waAc: her açılışta alici = ogrenci; seçici bar'ı waIcerik başına; panel güncelle.
      waAc satır listesi dizi.length=0 iken de seçici gizlenmemesi için bar her açılışta kurulu; duplicate guard'lı. */
const AC_ESKI = '  $("waIcerik").innerHTML = icerik;';
if (say(app, AC_ESKI) !== 1) fail("waAc innerHTML anchor tam 1 kez değil");
const AC_YENI = `  /* ${ISARET}: her açılışta alıcı varsayılan "ogrenci" (state yalnız bellek içi) */
  waAliciTipi = "ogrenci";
  waAktifOgrenciId = null;
  $("waIcerik").innerHTML = icerik;
  /* seçici bar: innerHTML yazımı her açılışta eskiyi temizlediği için yalnız burada TEK kez kurulur
     (duplicate imkânsız); gerçek DOM'da yoksa afterbegin eklenir, mini-DOM stub'larda noop. */
  if (document.getElementById("waIcerik") && document.getElementById("waIcerik").insertAdjacentHTML) {
    $("waIcerik").insertAdjacentHTML("afterbegin", waAliciSeciciHTML());
  }
  waAliciPanelGuncelle();`;
app = app.replace(AC_ESKI, AC_YENI);

/* 5) waKapat: state temizle (yeni açılış zaten waAc'te ogrenci'e döner) */
const KAPAT_ESKI = 'function waKapat() { $("waModal").classList.add("hidden"); }';
if (say(app, KAPAT_ESKI) !== 1) fail("waKapat anchor tam 1 kez değil");
const KAPAT_YENI = `function waKapat() {
  $("waModal").classList.add("hidden");
  /* ${ISARET}: state temizle — alici seçimi yalnız bellek içi, kalıcı kayıt YOK */
  waAktifOgrenciId = null;
  waAliciTipi = "ogrenci";
}`;
app = app.replace(KAPAT_ESKI, KAPAT_YENI);

/* ---- yazma sonrası kaynak kanıtları ---- */
if (say(app, "waAktifOgrenciId") === 0) fail("waAktifOgrenciId yok");
if (say(app, "function waAliciBilgisi(") !== 1) fail("waAliciBilgisi tam 1 kez değil");
if (say(app, 'id="waAlici"') !== 1) fail('id="waAlici" app.js icinde tam 1 kez değil');
const GONDER_BOLGESI = app.split(A_WAGONDER)[1].split("\nfunction ")[0];
if (GONDER_BOLGESI.includes("o.tel")) fail("waGonder eski o.tel fallback kalkmalıydı");
if (say(app, A_WAOPEN) !== 0) fail("eski waGonder window.open satırı kalkmalıydı");
/* waUrl + encodeURIComponent + ogrenciMesajMetni formatı korunur */
if (!app.includes('return "https://wa.me/" + no + "?text=" + encodeURIComponent(metin);')) fail("waUrl encodeURIComponent davranışı bozuldu");
if (!app.includes("waUrl(metin, a.telefon)")) fail("waGonder yeni çözücü kullanmıyor");

writeFileSync("app.js", app);
console.log("app.js yamalandı:", boy("app.js") + " B", "sha256=" + sha("app.js"));

/* ================= index.html: seçici statik bar (duplicate guard'lı değil — innerHTML dışı, tekillik garanti) =================
   NOT: waIcerik innerHTML yazımı bar'ı sildiği için bar app.js'ten insertAdjacentHTML ile kurulur;
   index.html'e BAR EKLENMEZ (duplicate imkânsız). Yalnız statik ID kontrolü yapılır. */
if ((html0.match(/id="waAlici"/g) || []).length !== 0) fail("index.html waAlici beklenmedik");

/* ================= test.mjs: süit kaydı (tam 1 kez) ================= */
let tm = tm0;
const SUIT = '"ks-wa-alici.mjs"';
tm = tm.replace('"ks-wa-durum.mjs"', '"ks-wa-durum.mjs", ' + SUIT);
if (say(tm, SUIT) !== 1) fail("test.mjs süit kaydı tam 1 kez olmadı");
writeFileSync("test.mjs", tm);
console.log("test.mjs güncellendi (ks-wa-alici.mjs eklendi).");

/* ---- sözdizimi kontrolü ---- */
for (const f of ["app.js", "ek-ders.js"]) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) fail(f + " sözdizimi hatası: " + (r.stderr || ""));
}
console.log("WA-ALICI-YAMASI uygulandı (app.js + test.mjs; index.html değişmedi).");
