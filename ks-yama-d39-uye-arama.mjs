/* ks-yama-d39-uye-arama.mjs — D39-UYE-ARAMA: havuz grup üyesi editörüne ÖĞRENCİ ARAMA kutusu.
   Marker: D39-UYE-ARAMA → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.d39-uye-arama-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır —
   rapor YEDEKTEN ÖNCE yazılır: önce mevcut app.js byte+SHA, sonra yedek + yedek doğrulaması).

   KEŞİF (dosya:satır — değişiklik ÖNCESİ durum):
     · Buton üreticisi   : app.js:3066 istekUyeButonHTML(r) — D38 durumu (3069 uyeAcik, 3070 etiket "Kapat").
     · Editör üreticisi  : app.js:3072 istekUyeEditorHTML(r) — app.js:3073 `if (ui.istekUyeId !== r.id) return '';`
     · Satır üreticisi   : app.js:3075-3080 `var satir = DB.ogrenciler.map(...)` → checkbox + ad + sınıf markup'ı
                           (markup app.js:3077-3079), TEK üretici; `esc(r.id)` ile bağlı.
     · LİSTE KONTEYNERİ : app.js:3083 `<div class="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-3">'
                           + satir + "</div>"` — **id/data-* YOK** ⇒ TEK BAŞINA yeniden çizilebilir DEĞİL
                           (kanıt: konteynerde hiçbir tutamaç yok, satırlar yalnız burada üretiliyor ve
                           her checkbox değişimi app.js:3104 `renderHavuz()` ile TÜM havuzu yeniden çiziyor).
     · Aç/Kapa           : app.js:3090 istekUyeAc (3094 toggle kapanış · 3096 taslak yükleme)
     · Seçim             : app.js:3099 istekUyeSec (3104 renderHavuz) · İptal app.js:3106 ·
                           Kaydet app.js:3107-3119 (3116 temizlik) · istekSil app.js:3120-3125 (3121)
     · Durum             : `ui.istekUyeId` / `ui.istekUyeTaslak` (ui literal app.js:948-958 içinde ÖN TANIM YOK — tembel alanlar)
   KÖK NEDEN: editörde arama yoktu; liste 20+ öğrencide taranamıyordu. Ayrıca liste konteynerinin tutamacı
   olmadığı için seçim değişimi YALNIZ tam `renderHavuz()` ile yansıtılabiliyordu (yazarken o yolu kullanmak
   input odağını/imleci her tuşta kaybettirirdi).

   ÇÖZÜM (tek üretici + dar tazeleme):
     1) `istekUyeAramaNorm(s)`  : NFC + toLocaleLowerCase("tr-TR") — hem sorguya hem ada uygulanır.
     2) `istekUyeListeHTML(rid)`: görünür satırlar; SEÇİLİ üye eşleşmese de listede KALIR ve işaretli kalır,
        yalnız eşleşmeyen SEÇİLMEMİŞ öğrenciler gizlenir; sorgu boşsa liste bugünkü hâliyle BİREBİR;
        hiç görünür satır yoksa "Sonuç yok".
     3) `istekUyeAra(v)`        : ui.istekUyeArama'yı yazar ve YALNIZ `#istek-uye-liste` içeriğini tazeler
        → arama input'u ODAK/İMLEÇ kaybetmez (tam renderHavuz ÇAĞRILMAZ).
     4) `ui.istekUyeArama` bayat durum temizliği: açılış/kart değişimi/kapanış (istekUyeAc), İptal, başarılı Kaydet, istekSil.

   DOKUNULMAZ: grupUyeYaz · istekUyeKaydet yazma akışı (yalnız arama temizliği eklendi) · istekUyeSec davranışı ·
   D28 zikzak/TEK ayırıcı · D37 kart-altı yerleşim · D38 toggle · kart içi tipografi/chip · istekUyeKaydet sonrası
   chip tazeleme · drag/drop · D29/D35/D36 · WA/PNG. Yeni görsel dil/CDN YOK (mevcut Tailwind sınıfları). */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.d39-uye-arama-oncesi.bak";
const HTML = "index.html";
const MARKER = "D39-UYE-ARAMA";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const sha16 = (s) => sha256(s).slice(0, 16);
/* app.js kaynağındaki kaçışlı tırnak dizisi: @Q@ → \' (tek yazım, tüm bloklar için ortak) */
const TEMIZ = (s) => s.split("@Q@").join("\\'");

let src = readFileSync(APP, "utf8");
if (src.includes(MARKER)) { console.error("ZATEN UYGULANMIŞ (" + MARKER + " marker var) — yazmadan çıkılıyor."); process.exit(2); }

/* ---- YEDEKTEN ÖNCE: mevcut app.js byte + SHA ---- */
console.log("APP  önce: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));
if (!existsSync(BAK)) { copyFileSync(APP, BAK); console.log("YEDEK oluşturuldu: " + BAK); }
const bakSrc = readFileSync(BAK, "utf8");
console.log("BAK     : " + Buffer.byteLength(bakSrc, "utf8") + " B · sha256=" + sha256(bakSrc));
if (sha256(bakSrc) !== sha256(src)) { console.error("YEDEK DOĞRULAMA HATASI: yedek app.js ile birebir DEĞİL."); process.exit(1); }

let degisen = 0;
function degis(etiket, eski, yeni, kez) {
  const n = src.split(eski).length - 1;
  if (n !== kez) { console.error("ANCHOR HATASI [" + etiket + "]: beklenen " + kez + ", bulunan " + n); process.exit(1); }
  src = src.split(eski).join(yeni);
  degisen += kez;
  console.log("  ✓ " + etiket + " (" + kez + ")");
}

/* ---- A) ui: arama sorgusu alanı (tembel değil, açıkça tanımlı) ---- */
const A_ESKI = [
  "  havuzAnaId: null /* GRUP İSTEK: havuz bağlamında İLK seçilen öğrenci (ana/sahip) */,",
  "  grupAcikOgrId: null /* GRUP GORUNUM: tum uye adlari acik olan ders id'si (badge toggle) */",
  "};",
].join("\n");
const A_YENI = [
  "  havuzAnaId: null /* GRUP İSTEK: havuz bağlamında İLK seçilen öğrenci (ana/sahip) */,",
  "  grupAcikOgrId: null /* GRUP GORUNUM: tum uye adlari acik olan ders id'si (badge toggle) */,",
  "  istekUyeArama: \"\" /* D39-UYE-ARAMA: havuz grup üyesi editörü öğrenci arama sorgusu (açılış/kart değişimi/kapanış/İptal/Kaydet'te TEMİZLENİR) */",
  "};",
].join("\n");
degis("A ui.istekUyeArama alanı tanımlandı", A_ESKI, A_YENI, 1);

/* ---- B) TEK satır üreticisi + liste konteynerine tutamaç: yeni yardımcılar ---- */
const B_ESKI = "function istekUyeEditorHTML(r) {\n  if (ui.istekUyeId !== r.id) return '';";
const B_YENI = TEMIZ(`/* D39-UYE-ARAMA: arama normalizasyonu — hem SORGU hem AD aynı kuraldan geçer (Unicode NFC + Türkçe küçük harf). */
function istekUyeAramaNorm(s) {
  return String(s == null ? "" : s).normalize("NFC").toLocaleLowerCase("tr-TR");
}
/* D39-UYE-ARAMA: editör açıkken listelenecek öğrenci satırları (TEK üretici).
   KURAL: SEÇİLİ üye (ui.istekUyeTaslak) aramayla eşleşmese bile listede KALIR ve İŞARETLİ kalır;
   yalnız eşleşmeyen SEÇİLMEMİŞ öğrenciler gizlenir. Sorgu BOŞSA liste bugünkü hâliyle BİREBİR. */
function istekUyeListeHTML(rid) {
  var taslak = Array.isArray(ui.istekUyeTaslak) ? ui.istekUyeTaslak : [];
  var q = istekUyeAramaNorm(ui.istekUyeArama);
  var gorunur = q ? DB.ogrenciler.filter(function (o) {
    return taslak.indexOf(o.id) >= 0 || istekUyeAramaNorm(o.ad).indexOf(q) >= 0;
  }) : DB.ogrenciler;
  if (!gorunur.length) return '<div class="px-2 py-1.5 text-[11.5px] text-slate-400 italic">Sonuç yok</div>';
  return gorunur.map(function (o) {
    var sec = taslak.indexOf(o.id) >= 0;
    return '<label class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white cursor-pointer"><input type="checkbox"' + (sec ? " checked" : "") +
      ' onchange="istekUyeSec(@Q@' + esc(rid) + '@Q@,@Q@' + esc(o.id) + '@Q@)" class="w-3.5 h-3.5 shrink-0 accent-teal-600" />' +
      '<span class="text-[11.5px] text-slate-600 truncate">' + esc(o.ad) + (o.sinif ? ' <span class="text-slate-300">· ' + esc(o.sinif) + "</span>" : "") + "</span></label>";
  }).join("");
}
/* D39-UYE-ARAMA: her tuşta TÜM editör yeniden çizilmez — YALNIZ #istek-uye-liste içeriği tazelenir;
   böylece arama input'u ODAĞI ve imleç konumu KORUNUR. Taslak/asgari seçim mantığı değişmez. */
function istekUyeAra(v) {
  ui.istekUyeArama = (v == null ? "" : String(v));
  var kutu = document.getElementById("istek-uye-liste");
  if (kutu && ui.istekUyeId) kutu.innerHTML = istekUyeListeHTML(ui.istekUyeId);
}
function istekUyeEditorHTML(r) {
  if (ui.istekUyeId !== r.id) return '';`);
degis("B yardımcılar eklendi (istekUyeAramaNorm + istekUyeListeHTML + istekUyeAra)", B_ESKI, B_YENI, 1);

/* ---- C) editör gövdesi: satır map'i kaldırıldı, arama input'u + tutamaçlı liste konteyneri eklendi ---- */
const C_ESKI = TEMIZ(`  var satir = DB.ogrenciler.map(function (o) {
    var sec = taslak.indexOf(o.id) >= 0;
    return '<label class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white cursor-pointer"><input type="checkbox"' + (sec ? " checked" : "") +
      ' onchange="istekUyeSec(@Q@' + esc(r.id) + '@Q@,@Q@' + esc(o.id) + '@Q@)" class="w-3.5 h-3.5 shrink-0 accent-teal-600" />' +
      '<span class="text-[11.5px] text-slate-600 truncate">' + esc(o.ad) + (o.sinif ? ' <span class="text-slate-300">· ' + esc(o.sinif) + "</span>" : "") + "</span></label>";
  }).join("");
  return '<div class="istek-uye-editor mt-1 rounded-xl border border-teal-200 bg-teal-50/40 p-2.5">' +
    '<div class="text-[10.5px] font-extrabold text-teal-700 mb-1"><i class="fa-solid fa-user-group mr-1"></i>Grup Üyelerini Ekle/Çıkar</div>' +
    '<div class="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-3">' + satir + "</div>" +`);
const C_YENI = [
  "  return '<div class=\"istek-uye-editor mt-1 rounded-xl border border-teal-200 bg-teal-50/40 p-2.5\">' +",
  "    '<div class=\"text-[10.5px] font-extrabold text-teal-700 mb-1\"><i class=\"fa-solid fa-user-group mr-1\"></i>Grup Üyelerini Ekle/Çıkar</div>' +",
  "    /* D39-UYE-ARAMA: üstte sabit arama input'u — yazarken YALNIZ liste konteyneri tazelenir (odak/imleç korunur). */",
  "    '<div class=\"relative mb-1.5\">' +",
  "      '<input id=\"istek-uye-arama\" type=\"text\" autocomplete=\"off\" placeholder=\"Öğrenci ara…\" value=\"' + esc(ui.istekUyeArama || \"\") + '\" oninput=\"istekUyeAra(this.value)\" class=\"w-full rounded-xl border border-slate-200 bg-white pl-7 pr-2.5 py-1.5 text-[11.5px] font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/40\" />' +",
  "      '<i class=\"fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-300 pointer-events-none\"></i>' +",
  "    '</div>' +",
  "    '<div id=\"istek-uye-liste\" class=\"max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-3\">' + istekUyeListeHTML(r.id) + \"</div>\" +",
].join("\n");
degis("C editör: arama input'u + tutamaçlı liste konteyneri (satır map'i TEK üreticiye taşındı)", C_ESKI, C_YENI, 1);

/* ---- D) arama temizliği: açılış/kart değişimi + toggle kapanışı ---- */
const D_ESKI = [
  "  if (ui.istekUyeId === id) { ui.istekUyeId = null; ui.istekUyeTaslak = []; renderHavuz(); return; }",
  "  ui.istekUyeId = id; /* D38: başka kartın butonu → önceki editör bu TEK alan üzerinden KAPANIR (TEK açık editör) */",
  "  ui.istekUyeTaslak = istekOgrenciIds(r).slice();",
].join("\n");
const D_YENI = [
  "  if (ui.istekUyeId === id) { ui.istekUyeId = null; ui.istekUyeTaslak = []; ui.istekUyeArama = \"\"; renderHavuz(); return; } /* D39: kapanışta arama TEMİZLENİR */",
  "  ui.istekUyeId = id; /* D38: başka kartın butonu → önceki editör bu TEK alan üzerinden KAPANIR (TEK açık editör) */",
  "  ui.istekUyeTaslak = istekOgrenciIds(r).slice();",
  "  ui.istekUyeArama = \"\"; /* D39: açılışta ve kart DEĞİŞİMİNDE arama temiz başlar */",
].join("\n");
degis("D istekUyeAc: arama temizliği (kapanış + kart değişimi)", D_ESKI, D_YENI, 1);

/* ---- E) İptal ---- */
degis("E istekUyeIptal: arama temizliği",
  'function istekUyeIptal() { ui.istekUyeId = null; ui.istekUyeTaslak = []; renderHavuz(); }',
  'function istekUyeIptal() { ui.istekUyeId = null; ui.istekUyeTaslak = []; ui.istekUyeArama = ""; renderHavuz(); } /* D39: İptal\'de arama TEMİZLENİR */', 1);

/* ---- F) başarılı Kaydet ---- */
const F_ESKI = [
  "  ui.istekUyeId = null; ui.istekUyeTaslak = [];",
  "  renderHavuz();",
].join("\n");
const F_YENI = [
  "  ui.istekUyeId = null; ui.istekUyeTaslak = []; ui.istekUyeArama = \"\"; /* D39: başarılı Kaydet'te arama TEMİZLENİR */",
  "  renderHavuz();",
].join("\n");
degis("F istekUyeKaydet (başarılı yol): arama temizliği", F_ESKI, F_YENI, 1);

/* ---- G) istekSil: açık kart silinirse bayat sorgu kalmasın ---- */
degis("G istekSil: açık kart silinince arama da temizlenir",
  "  if (ui.istekUyeId === id) { ui.istekUyeId = null; ui.istekUyeTaslak = []; }",
  "  if (ui.istekUyeId === id) { ui.istekUyeId = null; ui.istekUyeTaslak = []; ui.istekUyeArama = \"\"; } /* D39 */", 1);

writeFileSync(APP, src, "utf8");
console.log("\nAPP sonra: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src) + " · sha16=" + sha16(src));
console.log("Toplam değişen anchor: " + degisen);

/* ---- index.html damgası: app.js?v=<SHA16> tazele ---- */
const yeniDamga = sha16(src);
function damgaTazele(dosya, yaz) {
  if (!existsSync(dosya)) { console.log("damga: " + dosya + " YOK (atlandı)"); return; }
  let h = readFileSync(dosya, "utf8");
  const eski = (h.match(/app\.js\?v=([0-9a-f]{16})/) || [])[1];
  if (eski === undefined) { console.log("damga: " + dosya + " içinde app.js?v= yok (atlandı)"); return; }
  if (eski === yeniDamga) { console.log("damga zaten güncel: " + dosya + " → " + yeniDamga); return; }
  const n = (h.match(/app\.js\?v=[0-9a-f]{16}/g) || []).length;
  if (n !== 1) { console.error("damga sayısı " + dosya + " beklenen 1, bulunan " + n); process.exit(1); }
  h = h.replace(/app\.js\?v=[0-9a-f]{16}/, "app.js?v=" + yeniDamga);
  if (yaz) { writeFileSync(dosya, h, "utf8"); console.log("damga tazelendi: " + dosya + " " + eski + " → " + yeniDamga); }
}
damgaTazele(HTML, true);

/* ---- kök → public / dist / isolate senkron (byte-birebir) ---- */
const kopyalar = ["public/app.js", "dist/app.js", "isolate/app.js"];
for (const hedef of kopyalar) {
  if (!existsSync(hedef)) { console.log("senkron: " + hedef + " YOK (atlandı)"); continue; }
  copyFileSync(APP, hedef);
  const h2 = readFileSync(hedef, "utf8");
  console.log("senkron " + hedef + " sha16=" + sha16(h2) + (sha256(h2) === sha256(src) ? " ✓" : " ✗ FARK"));
}
damgaTazele("dist/index.html", true);
damgaTazele("isolate/index.html", true);
console.log("D39-UYE-ARAMA yaması TAMAM. (ek-ders.js / test verisi DEĞİŞMEDİ · publish YOK)");
