/* ks-yama-d37-hucre-grup.mjs — D37-HUCRE-GRUP: havuz istek kartı üye editörünü KARTIN ALTINA al.
   Marker: D37-HUCRE-GRUP → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.d37-hucre-grup-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır —
   rapor YEDEKTEN ÖNCE yazılır: önce mevcut app.js byte+SHA, sonra yedek + yedek doğrulaması).

   KÖK NEDEN: renderHavuz() kart HTML'ine editörü SIBLING olarak ekliyordu
     (`kartHTML += istekUyeEditorHTML(r)`), yani md:grid-cols-2 grid'inde kart 1 hücre,
     buton/editör AYRI bir hücre (yan sütun) oluyordu. Kullanıcı: buton + editör ait olduğu
     kartın HEMEN ALTINA ve KARTLA AYNI GENİŞLİKTE olmalı.

   ÇÖZÜM:
     1) istekUyeButonHTML(r) — "Grup üyelerini ekle/çıkar" butonu TEK üreticiden; kart DOM'unun
        İÇİNE (w-full satır, flex-wrap) yerleşir. istekUyeEditorHTML(r) artık YALNIZ açık
        olduğunda panel döner (kapalıyken "").
     2) renderHavuz(): her istek kart + (açıksa) editör TEK dış grid hücresinde
        (.istek-hucre[data-istek-hucre]) gruplanır; editör kartın ALTINDA, aynı genişlikte.
        Grid hücresi col-span ALMAZ → D28 zigzag (1-sol/2-sağ/3-sol) ve %50'deki TEK absolute
        ayırıcı çizgi aynen korunur; boş-havuz mesajı md:col-span-2 kuralı korunur.

   DOKUNULMAZ: istekUyeAc/istekUyeSec/istekUyeKaydet davranışı, grupUyeYaz, Kaydet/İptal,
   kart içi tipografi/chip, draggable/istekDrag zinciri, D29/D35/D36, WA/PNG. Öğrenci ARAMA
   input'u EKLENMEDİ (bu turda yalnız var/yok raporu: YOK). */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.d37-hucre-grup-oncesi.bak";
const HTML = "index.html";
const MARKER = "D37-HUCRE-GRUP";
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

/* ---- 1) istekUyeButonHTML(r) ayrı üretici + istekUyeEditorHTML kapalıyken boş ---- */
degis("1 buton ayrı üreticiden (kart içine) + editör kapalıyken boş",
`function istekUyeEditorHTML(r) {
  var uyeler = istekOgrenciIds(r);
  if (ui.istekUyeId !== r.id) {
    return '<div class="mt-1 px-1"><button type="button" onclick="istekUyeAc(\\'' + esc(r.id) + '\\')" class="text-[10.5px] font-bold text-slate-400 hover:text-teal-600 inline-flex items-center gap-1 transition-colors"><i class="fa-solid fa-user-group text-[10px]"></i>Grup üyelerini ekle/çıkar (' + uyeler.length + ')</button></div>';
  }
  var taslak = Array.isArray(ui.istekUyeTaslak) ? ui.istekUyeTaslak : [];`,
`/* D37-HUCRE-GRUP: "Grup üyelerini ekle/çıkar" butonu TEK üreticiden — kart DOM'unun İÇİNE
   yerleşir (ayrı dış grid hücresi DEĞİL). Editör paneli ise kartın ALTINA, AYNI hücreye çizilir. */
function istekUyeButonHTML(r) {
  var uyeler = istekOgrenciIds(r);
  return '<div class="istek-uye-buton w-full pt-0.5"><button type="button" onclick="istekUyeAc(\\'' + esc(r.id) + '\\')" class="text-[10.5px] font-bold text-slate-400 hover:text-teal-600 inline-flex items-center gap-1 transition-colors"><i class="fa-solid fa-user-group text-[10px]"></i>Grup üyelerini ekle/çıkar (' + uyeler.length + ')</button></div>';
}
function istekUyeEditorHTML(r) {
  if (ui.istekUyeId !== r.id) return '';
  var taslak = Array.isArray(ui.istekUyeTaslak) ? ui.istekUyeTaslak : [];`, 1);

/* ---- 2) editör paneline ayırt edici sınıf (test/MARKUP çapası) ---- */
degis("2 editör paneli sınıfı istek-uye-editor olarak işaretlendi",
`  return '<div class="mt-1 rounded-xl border border-teal-200 bg-teal-50/40 p-2.5">' +`,
`  return '<div class="istek-uye-editor mt-1 rounded-xl border border-teal-200 bg-teal-50/40 p-2.5">' +`, 1);

/* ---- 3) kart flex-wrap (w-full buton satırı kart içinde alt satıra iner) ---- */
degis("3 kart flex-wrap (buton satırı kart içinde)",
`class="istek-kart flex items-center gap-3 rounded-xl border px-3.5 py-2.5 '`,
`class="istek-kart flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-2.5 '`, 1);

/* ---- 4) kart + buton(kart içinde) + editör(kartın altında) TEK dış grid hücresi ---- */
degis("4 kart+buton+editör tek dış grid hücresinde (buton kart içinde, editör kart altinda)",
`      '<button onclick="istekSil(\\'' + r.id + '\\')" class="w-7 h-7 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 shrink-0"><i class="fa-solid fa-trash-can text-[12px]"></i></button></div>';
    if (bekliyor) kartHTML += istekUyeEditorHTML(r); /* D34-GRUP-UYE-YAZ ADIM-4: bekleyen istek kartına üye ekle/çıkar */
    liste += kartHTML;`,
`      '<button onclick="istekSil(\\'' + r.id + '\\')" class="w-7 h-7 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 shrink-0"><i class="fa-solid fa-trash-can text-[12px]"></i></button>' +
      (bekliyor ? istekUyeButonHTML(r) : "") + /* D37-HUCRE-GRUP: buton kart DOM'unun İÇİNDE (w-full satır — ayrı grid öğesi DEĞİL) */
      '</div>';
    /* D37-HUCRE-GRUP: her istek kart + (açıksa) editör TEK dış grid hücresinde gruplanır; editör kartın ALTINDA,
       kartla AYNI genişlikte. Hücre col-span ALMAZ → D28 zigzag + %50 ayırıcı çizgi aynen korunur. */
    liste += '<div class="istek-hucre min-w-0" data-istek-hucre="' + r.id + '">' + kartHTML + (bekliyor ? istekUyeEditorHTML(r) : "") + '</div>';`, 1);

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
console.log("D37-HUCRE-GRUP yaması TAMAM.");
