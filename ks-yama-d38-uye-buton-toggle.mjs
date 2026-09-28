/* ks-yama-d38-uye-buton-toggle.mjs — D38-UYE-BUTON-TOGGLE: "Grup üyelerini ekle/çıkar" butonu gerçek AÇ/KAPA.
   Marker: D38-UYE-BUTON-TOGGLE → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.d38-uye-buton-toggle-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır —
   rapor YEDEKTEN ÖNCE yazılır: önce mevcut app.js byte+SHA, sonra yedek + yedek doğrulaması).

   KEŞİF (dosya:satır — değişiklik ÖNCESİ durum):
     · Buton üreticisi  : app.js:3066 istekUyeButonHTML(r) — app.js:3068 TEK return; metin SABİT
                          "Grup üyelerini ekle/çıkar (N)", onclick="istekUyeAc('<id>')" (app.js:3068).
     · Editör üreticisi : app.js:3070 istekUyeEditorHTML(r) — app.js:3071 `if (ui.istekUyeId !== r.id) return '';`
     · Editör durumu    : ui.istekUyeId (açık kartın id'si) + ui.istekUyeTaslak (taslak üyeler).
                          Aç : app.js:3088 istekUyeAc → app.js:3091-3092 (ui.istekUyeId = id; taslak = mevcut üyeler)
                          Kapa: app.js:3102 istekUyeIptal · app.js:3112 istekUyeKaydet · app.js:3117 istekSil
     · KÖK NEDEN: istekUyeAc koşulsuz `ui.istekUyeId = id` yazıp taslağı YENİDEN yüklüyordu → aynı butona
       2. tıklama editörü KAPATMIYOR (açık kalıyor) ve checkbox'ta yapılan değişiklikleri SESSİZCE SIFIRLIYORDU.
       Buton etiketi daima "Grup üyelerini ekle/çıkar (N)" idi; "Kapat" durumu YOKTU.

   ÇÖZÜM (2 fonksiyon, 3 anchor):
     A) istekUyeButonHTML: `uyeAcik = (ui.istekUyeId === r.id)` bayrağı; açıkken etiket "Kapat" + vurgu rengi.
     B) istekUyeAc: `ui.istekUyeId === id` ise KAPAT (id=null, taslak=[]) → aynı buton toggle olur.
        Aksi hâlde TEK alan (ui.istekUyeId) hedefe yazılır → başka kartın butonu öncekini kapatır (TEK açık editör).

   DOKUNULMAZ: istekUyeSec/istekUyeIptal/istekUyeKaydet/grupUyeYaz davranışı, Kaydet/İptal butonları,
   checkbox listesi, D28 zigzag/TEK ayırıcı, D37 kart-altı yerleşim, kart içi tipografi/chip, drag/drop,
   D29, D35, D36, WA/PNG. Uygulama verisi/DB şeması DEĞİŞMEZ (yalnız UI durum makinesi). */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.d38-uye-buton-toggle-oncesi.bak";
const HTML = "index.html";
const MARKER = "D38-UYE-BUTON-TOGGLE";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const sha16 = (s) => sha256(s).slice(0, 16);

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

/* ---- A) buton üreticisine "açık mı" bayrağı ---- */
const A_ESKI = [
  "function istekUyeButonHTML(r) {",
  "  var uyeler = istekOgrenciIds(r);",
].join("\n");
const A_YENI = [
  "function istekUyeButonHTML(r) {",
  "  var uyeler = istekOgrenciIds(r);",
  "  /* D38-UYE-BUTON-TOGGLE: aynı buton AÇ/KAPA — editör AÇIKKEN metin \"Kapat\" olur (2. tıklama kapatır). */",
  "  var uyeAcik = ui.istekUyeId === r.id;",
].join("\n");
degis("A buton açık/kapalı bayrağı (ui.istekUyeId)", A_ESKI, A_YENI, 1);

/* ---- B) buton class + etiket: açıkken "Kapat", kapalıyken eski metin ---- */
const B_ESKI = "class=\"text-[10.5px] font-bold text-slate-400 hover:text-teal-600 inline-flex items-center gap-1 transition-colors\"><i class=\"fa-solid fa-user-group text-[10px]\"></i>Grup üyelerini ekle/çıkar (' + uyeler.length + ')</button>";
const B_YENI = "class=\"text-[10.5px] font-bold ' + (uyeAcik ? \"text-teal-600\" : \"text-slate-400 hover:text-teal-600\") + ' inline-flex items-center gap-1 transition-colors\"><i class=\"fa-solid fa-user-group text-[10px]\"></i>' + (uyeAcik ? \"Kapat\" : \"Grup üyelerini ekle/çıkar (\" + uyeler.length + \")\") + '</button>";
degis("B buton etiketi: açık→\"Kapat\", kapalı→\"Grup üyelerini ekle/çıkar (N)\"", B_ESKI, B_YENI, 1);

/* ---- C) istekUyeAc: aynı kart → KAPAT; başka kart → öncekini kapat + hedefi aç ---- */
const C_ESKI = [
  "function istekUyeAc(id) {",
  "  var r = DB.istekler.find(function (x) { return x.id === id; });",
  "  if (!r || r.durum !== \"bekliyor\") { toast(\"Yalnızca bekleyen isteğin üyeleri düzenlenebilir.\", \"uyari\"); return; }",
  "  ui.istekUyeId = id;",
  "  ui.istekUyeTaslak = istekOgrenciIds(r).slice();",
  "  renderHavuz();",
  "}",
].join("\n");
const C_YENI = [
  "function istekUyeAc(id) {",
  "  var r = DB.istekler.find(function (x) { return x.id === id; });",
  "  if (!r || r.durum !== \"bekliyor\") { toast(\"Yalnızca bekleyen isteğin üyeleri düzenlenebilir.\", \"uyari\"); return; }",
  "  /* D38-UYE-BUTON-TOGGLE: AYNI kartın butonu 2. kez → editör KAPANIR (taslak atılır, editör durumu temizlenir). */",
  "  if (ui.istekUyeId === id) { ui.istekUyeId = null; ui.istekUyeTaslak = []; renderHavuz(); return; }",
  "  ui.istekUyeId = id; /* D38: başka kartın butonu → önceki editör bu TEK alan üzerinden KAPANIR (TEK açık editör) */",
  "  ui.istekUyeTaslak = istekOgrenciIds(r).slice();",
  "  renderHavuz();",
  "}",
].join("\n");
degis("C istekUyeAc toggle (aynı kart kapatır · başka kart öncekini kapatır)", C_ESKI, C_YENI, 1);

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
console.log("D38-UYE-BUTON-TOGGLE yaması TAMAM. (ek-ders.js / test verisi DEĞİŞMEDİ · publish YOK)");
