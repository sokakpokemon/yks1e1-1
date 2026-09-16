/* ks-yama-kapali-gorunum.mjs — Kapalı hücre görünümü yaması (assert'li, idempotent)
 *
 * KÖK NEDEN (kanıtlı, ks-teshis-kapali.mjs / ks-teshis2-kapali.mjs):
 * gridTablo() ogretmen dalında avail.musait'teki anahtar için durum="musait" üretir,
 * ama görünüm dalları "sinif"/"kapali"/"var" içindir → "musait" hiçbir dala girmez,
 * hücre BOŞ hücre stiliyle (beyaz) basılır. Kırmızı "Kapalı" hücre stili ASLA görünmez;
 * kırmızı etiket tiklanabilirliği engellemez (hücrelerde disabled/readonly/pointer-events yok — kanıt: teshis).
 * İstenen: kapalı hücre soluk/gri görünsün, tıklanabilir kalsın, "Kapalı" kırmızı etiketi olmasın.
 *
 * YAMA: gridTablo'da kapalı hücre stili: gri/soluk (bg-slate-100, border-slate-200, text-slate-400),
 * içerik "K" harfi yerine metin YOK (title'da "Kapalı" korunur). tiklama akışı (togOgrSecili) değişmez.
 *
 * IDEMPOTANS: zaten uygulanmışsa exit 2, "Zaten uygulanmış".
 */
import { readFileSync, writeFileSync, copyFileSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const FILE = "app.js";
const BAK = "app.js.kapali-gorunum-oncesi.bak";
const MARK = "KAPALI-GORUNUM-YAMASI";
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

let src = readFileSync(FILE, "utf8");
const beforeHash = sha256(src);

if (src.includes(MARK)) {
  console.error("Zaten uygulanmış — dosyaya dokunulmadı.");
  process.exit(2);
}

/* ---- Yedek (varsa üzerine YAZMA) ---- */
if (!existsSync(BAK)) copyFileSync(FILE, BAK);
const bakHash = sha256(readFileSync(BAK, "utf8"));

/* ---- Yamalar ---- */
const patches = [];
let patched = src;

// 1) gridTablo'da kapalı hücre durumu: "musait" (mevcut) yerine/ek olarak kapalı stili eşle.
//    Eski satır:
//      else if (durum === "kapali") { cls += "bg-rose-200 border-rose-300 hover:bg-rose-300"; baslik += " · Kapalı"; }
//    Yeni satır (MARK ile işaretli): gri/soluk stil + " · Kapalı" title korunur.
const oldCls = 'else if (durum === "kapali") { cls += "bg-rose-200 border-rose-300 hover:bg-rose-300"; baslik += " · Kapalı"; }';
const newCls = 'else if (durum === "kapali") { cls += "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-400 opacity-70"; baslik += " · Kapalı"; } /* ' + MARK + ': kapalı hücre soluk/gri — tıklanabilir kalır */';

// 2) gridTablo'da "K" harf etiketi: kırmızı etiket metni kaldırılıyor (title "Kapalı" bilgisini taşır)
const oldSpan = 'durum === "kapali" ? \'<span class="text-[8.5px] font-extrabold text-rose-500/70">K</span>\' :';
const newSpan = 'durum === "kapali" ? "" : /* ' + MARK + ': "K" kırmızı etiketi kaldırıldı — Kapalı bilgisi title\'da */';

// 3) KISA KOD SATIRI — gerçek koşul: "musait" durumunu da kapali stiline eşle.
//    Mevcut:  ? ((avail.sinif && key in avail.sinif) ? "sinif" : avail.musait.indexOf(key) >= 0 ? "musait" : "")
//    Yeni:    ... ? "kapali" : "")   (dallar "kapali" stiline zaten eş; "musait" görünüm dalı YOKTU)
const oldTip = '? ((avail.sinif && key in avail.sinif) ? "sinif" : avail.musait.indexOf(key) >= 0 ? "musait" : "")';
const newTip = '? ((avail.sinif && key in avail.sinif) ? "sinif" : avail.musait.indexOf(key) >= 0 ? "kapali" : "") /* ' + MARK + ': musait → kapali dalına bağlandı (gri/soluk görünüm) */';

// 4) Legend: KAPALI karesi gri/soluk olsun (öğretmen grid legend'ı)
const oldLegend = '<span class="w-3 h-3 rounded bg-rose-200 border border-rose-300 inline-block"></span> Kapalı</span>';
const newLegend = '<span class="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block"></span> Kapalı</span> /* ' + MARK + ' */';

patches.push({ name: "gridTablo: musait→kapali dal", old: oldTip, new: newTip, count: 1 });
patches.push({ name: "gridTablo: kapali stili gri/soluk", old: oldCls, new: newCls, count: 1 });
patches.push({ name: "gridTablo: K etiketi kaldırıldı", old: oldSpan, new: newSpan, count: 1 });
patches.push({ name: "legend: Kapalı karesi gri", old: oldLegend, new: newLegend, count: 1 });

/* ---- Assert'li uygulama: hepsi bulunamazsa YAZMA ---- */
for (const p of patches) {
  const n = patched.split(p.old).length - 1;
  if (n !== p.count) {
    console.error("ASSERT BAŞARISIZ: '" + p.name + "' beklenen " + p.count + " kez bulundu, gerçekte " + n + " — YAZILMADI.");
    process.exit(1);
  }
  patched = patched.replace(p.old, p.new);
}

/* ---- Sınırlar: dokunulmaması gereken bölgeler bozulmadı mı? ---- */
const mustHave = ["function togOgrSecili", "function togOgr", "function durumSec", "function durumSeciciHTML", "haftalikOgrtTablo", "function saveDB"];
for (const m of mustHave) {
  if (!patched.includes(m)) { console.error("ASSERT BAŞARISIZ: kritik bölge kayboldu: " + m); process.exit(1); }
}
if (sha256(patched) === beforeHash) { console.error("ASSERT BAŞARISIZ: patch değişiklik üretmedi."); process.exit(1); }

writeFileSync(FILE, patched);
console.log("Yama uygulandı ✓");
console.log("app.js SHA-256 (önce):", beforeHash);
console.log("app.js SHA-256 (sonra):", sha256(patched));
console.log("Yedek:", BAK, "SHA-256:", bakHash, existsSync(BAK) && bakHash !== beforeHash && statSync(BAK).size === 0 ? "(HATA)" : "");
