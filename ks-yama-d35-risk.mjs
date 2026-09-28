/* ks-yama-d35-risk.mjs — D35 RİSK A düzeltmesi (nowrap kapsamı).
   TEK idempotent yama (hedef: app.js). Marker: D35-RISK → ikinci koşumda exit 2 (yazmaz).
   Yedek: app.js.d35-risk-oncesi.bak (yalnız YOKSA oluşturulur; byte + SHA-256 raporlanır).
   Kök sorun: hücre üye sarmalayıcısı class="min-w-0 whitespace-nowrap" idi → TÜM SATIR nowrap.
   Düzeltme: sarmalayıcıdan nowrap KALDIRILIR; nowrap YALNIZ SINIF spanına, o da sadece
   çizelge hücresinden (sinifNowrap=true) geçirilir. AD spanı whitespace-normal break-words →
   uzun ad dar hücrede SERBEST sarar; sınıf etiketi kırılmaz. Havuz chip'i sinifNowrap'sız → sarma serbest.
   Ayrıca index.html'deki app.js?v=<SHA16> damgası YENİ SHA16 ile tazelenir (DİNAMİK kapı bunu bekler). */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const APP = "app.js";
const BAK = "app.js.d35-risk-oncesi.bak";
const HTML = "index.html";
const MARKER = "D35-RISK";
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

/* ---- 1) Ortak formatter: sinifNowrap parametresi (yalnız sınıf spanına nowrap) ---- */
degis("1a birebirEtiketHTML imzası + sınıf spanı nowrap parametresi",
`function birebirEtiketHTML(ad, sinif) {
  var snfSpan = "";
  if (sinif !== null) snfSpan = '<span class="text-[10px] font-medium text-slate-400 shrink-0">' + esc(sinif ? sinif : "Sınıf belirtilmemiş") + "</span>";`,
`function birebirEtiketHTML(ad, sinif, sinifNowrap) {
  var snfSpan = "";
  /* D35-RISK: nowrap YALNIZ çizelge hücresinden (sinifNowrap=true) geçirilir → SINIF spanı kırılmaz;
     havuz chip'i/öneri satırları sinifNowrap'sız çağırır → sarma SERBEST kalır. */
  if (sinif !== null) snfSpan = '<span class="text-[10px] font-medium text-slate-400 shrink-0' + (sinifNowrap ? " whitespace-nowrap" : "") + '">' + esc(sinif ? sinif : "Sınıf belirtilmemiş") + "</span>";`, 1);

degis("1b formatter dokümanı güncellendi",
`   D35-DUZELTME: bu formatter'da whitespace-nowrap YOK — havuz chip'i/öneri satırlarında sarma SERBEST.
   nowrap yalnız ÇİZELGE hücresi üye sarmalayıcısında (birebirHucreHTML) uygulanır. */`,
`   D35-RISK: bu formatter'ın KENDİSİ nowrap taşımaz — havuz chip'i/öneri satırlarında sarma SERBEST.
   nowrap YALNIZ sinifNowrap=true ile çağrıldığında SINIF spanına basılır (çizelge hücresi).
   AD spanı her durumda whitespace-normal break-words → AD serbest sarar, SINIF kırılmaz. */`, 1);

/* ---- 2) Çizelge hücresi: sarmalayıcıdan nowrap KALDIR, sınıf spanına nowrap ver ---- */
degis("2a ana üye sarmalayıcısı: nowrap kaldırıldı + sinifNowrap=true",
`  var hucreUyeleri = ['<div class="min-w-0 whitespace-nowrap" title="' + esc(tamAd) + '">' + birebirEtiketHTML(kisaAdlik(tamAd), anaSinif) + "</div>"];`,
`  /* D35-RISK: sarmalayıcıda nowrap YOK — uzun ad dar hücrede SERBEST sarar; nowrap YALNIZ sınıf spanında. */
  var hucreUyeleri = ['<div class="min-w-0" title="' + esc(tamAd) + '">' + birebirEtiketHTML(kisaAdlik(tamAd), anaSinif, true) + "</div>"];`, 1);

degis("2b ek üye sarmalayıcısı: nowrap kaldırıldı + sinifNowrap=true",
`    hucreUyeleri.push('<div class="min-w-0 whitespace-nowrap" title="' + esc(uo.ad) + '">' + birebirEtiketHTML(kisaAdlik(uo.ad), uo.sinif ? uo.sinif : null) + "</div>");`,
`    hucreUyeleri.push('<div class="min-w-0" title="' + esc(uo.ad) + '">' + birebirEtiketHTML(kisaAdlik(uo.ad), uo.sinif ? uo.sinif : null, true) + "</div>");`, 1);

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
console.log("D35-RISK yaması TAMAM.");
