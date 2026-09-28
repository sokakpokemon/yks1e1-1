/* ks-yama-d35-duzeltme.mjs — D35 DÜZELTME turu (yayın öncesi 3 sapma).
   TEK idempotent yama (hedef: app.js). Marker: D35-DUZELTME → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.d35-duzeltme-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır).
   Değişiklikler:
     1) MAX_SOYAD_HARF = 8 → 10 (MAX_AD_UZUNLUK = 22 sabit)
     2) birebirEtiketHTML: ortak formatter'dan whitespace-nowrap ÇIKARILDI (havuz chip'i sarma serbest)
     3) birebirHucreHTML: çizelge hücresi üye satırına whitespace-nowrap eklendi (nowrap yalnız ÇİZELGE)
     4) birebirHucreHTML: sınıf DB'de yoksa üye spanı HİÇ basılmaz ("Sınıf belirtilmemiş" yer tutucusu YOK)
   Ayrıca index.html'deki app.js?v=<SHA16> damgası YENİ SHA16 ile tazelenir (DİNAMİK kapı bunu bekler). */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.d35-duzeltme-oncesi.bak";
const HTML = "index.html";
const MARKER = "D35-DUZELTME";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const sha16 = (s) => sha256(s).slice(0, 16);

let src = readFileSync(APP, "utf8");
if (src.includes(MARKER)) { console.error("ZATEN UYGULANMIŞ (" + MARKER + " marker var) — yazmadan çıkılıyor."); process.exit(2); }

if (!existsSync(BAK)) { copyFileSync(APP, BAK); console.log("YEDEK oluşturuldu: " + BAK); }
const bak = readFileSync(BAK, "utf8");
console.log("APP  önce: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));
console.log("BAK     : " + Buffer.byteLength(bak, "utf8") + " B · sha256=" + sha256(bak));

let degisen = 0;
function degis(etiket, eski, yeni, kez) {
  const n = src.split(eski).length - 1;
  if (n !== kez) { console.error("ANCHOR HATASI [" + etiket + "]: beklenen " + kez + ", bulunan " + n); process.exit(1); }
  src = src.split(eski).join(yeni);
  degisen += kez;
  console.log("  ✓ " + etiket + " (" + kez + ")");
}

/* ---- 1) Eşik: 8 → 10 ---- */
degis("1 MAX_SOYAD_HARF = 10",
`var MAX_SOYAD_HARF = 8;
var MAX_AD_UZUNLUK = 22;`,
`var MAX_SOYAD_HARF = 10; /* D35-DUZELTME: 8 → 10 — "Ahmet Kızılırmak" (10) kısalır, "Ahmet Karabulut" (9) ve "Ahmet Demirci" (7) KISALMAZ */
var MAX_AD_UZUNLUK = 22;`, 1);

/* ---- 2) Ortak formatter'dan nowrap ÇIKAR (havuz chip'i sarma serbest kalsın) ---- */
degis("2a ortak sınıf spanından nowrap kaldırıldı",
`  if (sinif !== null) snfSpan = '<span class="text-[10px] font-medium text-slate-400 shrink-0 whitespace-nowrap">'`,
`  if (sinif !== null) snfSpan = '<span class="text-[10px] font-medium text-slate-400 shrink-0">'`, 1);

degis("2b formatter dokümanı güncellendi",
`   Ad gorselAd() ile Türkçe güvenli normal harf düzeninde; iki satıra sarar; kırpmasız. */`,
`   Ad gorselAd() ile Türkçe güvenli normal harf düzeninde; iki satıra sarar; kırpmasız.
   D35-DUZELTME: bu formatter'da whitespace-nowrap YOK — havuz chip'i/öneri satırlarında sarma SERBEST.
   nowrap yalnız ÇİZELGE hücresi üye sarmalayıcısında (birebirHucreHTML) uygulanır. */`, 1);

/* ---- 3+4) Çizelge hücresi: sınıf yoksa span YOK + hücre satırında nowrap ---- */
degis("3 anaSinif: sınıf DB'de yoksa null (yer tutucu metin YOK)",
`  var anaSinif = anaO ? anaO.sinif : null; /* null → sınıf spanı YOK ("Sınıf belirtilmemiş" de yazılmaz) */`,
`  var anaSinif = (anaO && anaO.sinif) ? anaO.sinif : null; /* D35-DUZELTME: sınıf DB'de yoksa span HİÇ basılmaz — yer tutucu metin ("Sınıf belirtilmemiş") YOK */`, 1);

degis("4a ana üye satırı: nowrap YALNIZ hücrede",
`  var hucreUyeleri = ['<div class="min-w-0" title="' + esc(tamAd) + '">' + birebirEtiketHTML(kisaAdlik(tamAd), anaSinif) + "</div>"];`,
`  var hucreUyeleri = ['<div class="min-w-0 whitespace-nowrap" title="' + esc(tamAd) + '">' + birebirEtiketHTML(kisaAdlik(tamAd), anaSinif) + "</div>"];`, 1);

degis("4b ek üye satırı: nowrap YALNIZ hücrede + sınıf yoksa null",
`    hucreUyeleri.push('<div class="min-w-0" title="' + esc(uo.ad) + '">' + birebirEtiketHTML(kisaAdlik(uo.ad), uo.sinif) + "</div>");`,
`    hucreUyeleri.push('<div class="min-w-0 whitespace-nowrap" title="' + esc(uo.ad) + '">' + birebirEtiketHTML(kisaAdlik(uo.ad), uo.sinif ? uo.sinif : null) + "</div>");`, 1);

writeFileSync(APP, src, "utf8");
console.log("\nAPP sonra: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src) + " · sha16=" + sha16(src));
console.log("Toplam değişen anchor: " + degisen);

/* ---- index.html damgası: app.js?v=<SHA16> tazele ---- */
let html = readFileSync(HTML, "utf8");
const eskiDamga = (html.match(/app\.js\?v=([0-9a-f]{16})/) || [])[1];
const yeniDamga = sha16(src);
if (eskiDamga !== yeniDamga) {
  const n = (html.match(/app\.js\?v=[0-9a-f]{16}/g) || []).length;
  if (n !== 1) { console.error("index.html damga sayısı beklenen 1, bulunan " + n); process.exit(1); }
  html = html.replace(/app\.js\?v=[0-9a-f]{16}/, "app.js?v=" + yeniDamga);
  writeFileSync(HTML, html, "utf8");
  console.log("index.html damgası tazelendi: " + eskiDamga + " → " + yeniDamga);
} else {
  console.log("index.html damgası zaten güncel: " + yeniDamga);
}
console.log("D35-DUZELTME yaması TAMAM.");
