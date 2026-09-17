/* ks-yama-dv-etiket.mjs — DV etiketi kaldırma + ders/öğretmen adı gösterimi yaması
   Hedef: yalnız app.js (index.html, ek-ders.js, vendor/* DOKUNULMAZ).
   Idempotent: 2. koşuda "Zaten uygulanmış" der, exit 2, dosyayı değiştirmez.
   Kural: ders adı/öğretmen adı yalnızca authoritative kaynak varsa gösterilir;
   kaynak yoksa uydurma YOK, hücre yeşil kalır ama metinsiz. */
import { readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const bak = "app.js.dv-etiket-oncesi.bak";
let src = readFileSync("app.js", "utf8");
const onceHash = sha("app.js");

/* Yedek: üzerine YAZMA — mevcut backup varsa onu koru */
if (!existsSync(bak)) {
  copyFileSync("app.js", bak);
  const b = statSync(bak);
  console.log(`Backup alındı: ${bak} · ${b.size} bayt · SHA-256 ${sha(bak)}`);
} else {
  console.log(`Backup mevcut (korundu): ${bak} · ${statSync(bak).size} bayt · SHA-256 ${sha(bak)}`);
}

const MARK = "/* DV-ETIKET-YAMASI */";
if (src.includes(MARK)) {
  console.log("Zaten uygulanmış — dokunulmadı.");
  process.exit(2);
}

/* ── Yama 1: gridTablo imzasına sinifAd parametresi ── */
let n = 0;
const old1 = 'function gridTablo(onclickOnce, avail, tip) {';
const new1 = 'function gridTablo(onclickOnce, avail, tip, sinifAd) { /* DV-ETIKET-YAMASI */';
if (!src.includes(old1)) throw new Error("Yama 1 hedefi bulunamadı (gridTablo imzası)");
src = src.replace(old1, new1); n++;

/* ── Yama 2: sınıf grid çağrısı sinifAd iletir ── */
const old2 = 'gridTablo("togSinif(\'" + esc(ui.sinifAd).replace(/\'/g, "\\\'") + "\'", program, "sinif") + "</div>";';
if (!src.includes(old2)) throw new Error("Yama 2 hedefi bulunamadı (sınıf grid çağrısı)");
const new2 = 'gridTablo("togSinif(\'" + esc(ui.sinifAd).replace(/\'/g, "\\\'") + "\'", program, "sinif", ui.sinifAd) + "</div>"; /* DV-ETIKET-YAMASI */';
src = src.replace(old2, new2); n++;

/* ── Yama 3: yardımcı — aktif dönemde slot → [Ders Adı - Öğretmen Adı] eşleşmeleri.
   Kaynak zinciri: DB.sinifProg[sinifAd][gun-kod] → ogretmenler[].avail.sinif[key]===sinifAd
   → ogretmen.ad → ogretmen.brans → DERSLER (DERS[brans].ad). Uydurma isim YOK. ── */
const yardimci = `
/* DV-ETIKET-YAMASI: dolu sınıf slotu için authoritative "Ders Adı - Öğretmen Adı" eşleşmeleri.
   aktifDonem + sinifAd + gun + kod → avail.sinif → ogretmen → branş → ders adı.
   Kaynak yoksa [] döner — hücrede uydurma isim YAZILMAZ. */
function dvSlotEtiketleri(sinifAd, key) {
  var sonuc = [];
  try {
    var prog = (DB.sinifProgDonemler && DB.sinifProgDonemler[aktifDonemId()] && DB.sinifProgDonemler[aktifDonemId()][sinifAd]) || DB.sinifProg[sinifAd] || [];
    if (prog.indexOf(key) < 0) return sonuc; /* yalnız aktif dönemin dolu slotu */
    (DB.ogretmenler || []).forEach(function (t) {
      if (!t || !t.avail || !t.avail.sinif || t.avail.sinif[key] !== sinifAd) return;
      var ad = String(t.ad || "").trim();
      if (!ad) return; /* uydurma etiket yok */
      var D = DERS[t.brans];
      var dersAd = D && D.ad ? D.ad : "";
      sonuc.push(dersAd ? dersAd + " - " + ad : ad);
    });
  } catch (e) { return []; }
  return sonuc;
}
`;
const anchor3 = new1;
if (!src.includes(anchor3)) throw new Error("Yama 3 çapası bulunamadı");
src = src.replace(anchor3, new1 + "\n" + yardimci); n++;

/* ── Yama 4: "var" dalında DV yerine eşleşme etiketleri (kompakt, truncate, title) ── */
const old4 = 'durum === "var" ? \'<span class="text-[8.5px] font-extrabold text-blue-600/60">DV</span>\' : "") +';
if (!src.includes(old4)) throw new Error("Yama 4 hedefi bulunamadı (DV satırı)");
const new4 = 'durum === "var" ? (function () { var es = dvSlotEtiketleri(sinifAd, key); return es.length ? \'<span class="block min-w-0 max-w-[72px] mx-auto px-0.5 text-[7.5px] font-extrabold text-blue-700/80 leading-tight truncate text-left">\' + esc(es.join(" · ")) + \'</span>\' : ""; })() : "") + /* DV-ETIKET-YAMASI: DV kaldırıldı; kaynaklı eşleşme yoksa uydurma YOK */';
src = src.replace(old4, new4); n++;

/* ── Yama 5: title'a eşleşmeleri ekle (uzun metin taşmaz, tooltip'te tam) ── */
const old5 = 'else if (durum === "var") { cls += "bg-blue-200 border-blue-300 hover:bg-blue-300"; baslik += " · Toplu ders"; }';
if (!src.includes(old5)) throw new Error("Yama 5 hedefi bulunamadı (Toplu ders title dalı)");
const new5 = 'else if (durum === "var") { cls += "bg-blue-200 border-blue-300 hover:bg-blue-300 overflow-hidden"; var es5 = sinifAd ? dvSlotEtiketleri(sinifAd, key) : []; baslik += " · Toplu ders" + (es5.length ? " — " + es5.join(" · ") : ""); } /* DV-ETIKET-YAMASI */';
src = src.replace(old5, new5); n++;

/* Doğrulamalar */
if (n !== 5) throw new Error("Beklenmeyen yama sayısı: " + n);
if (src.includes(">DV<")) throw new Error("DV etiketi hâlâ kaynakta!");
writeFileSync("app.js", src);
console.log(`Yama uygulandı (5 bölge). app.js: ${onceHash.slice(0, 8)} → ${sha("app.js").slice(0, 8)}`);
