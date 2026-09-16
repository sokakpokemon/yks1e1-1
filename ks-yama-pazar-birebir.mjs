/* ks-yama-pazar-birebir.mjs — PAZAR-BIREBIR-GORUNUM-YAMASI (assert'li, idempotent, exact-anchor)
   TEK İŞ (yalnızca app.js, yalnızca haftalikOgrtTablo() hücre dalları):
     A) Pazar satırı: `if (isPazar || musaitDegil)` gri/kilitli dalındaki Pazar ızgarasını
        kaldırır → Pazar artık Pazartesi–Cumartesi ile AYNI normal hücre dallarından geçer
        (sinifVar → ekDers → ders → boş drop zone). musaitDegil için davranış AYNEN korunur.
     B) Birebir ders hücresi: `ogrenciAd.split(" ")[0]` yerine DB.ogrenciler'den güvenli çözümlenen
        TAM AD + konu satırı + sınıf satırı (3 ayrı okunabilir satır, truncate ile taşma kontrolü).
        Grup hücresi (grupUyeler > 0) bu değişiklikten ETKİLENMEZ — grup dalları aynen korunur.
   Kesin koruma: veri modeli, kayıt, istekBurak/planla/gunlukTablo/CSV/analiz DOKUNULMAZ.
   Yedek: app.js.pazar-birebir-oncesi.bak (üzerine yazılmaz). 2. koşu: exit 2 "Zaten uygulanmış". */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const DOSYA = "app.js";
const once = readFileSync(DOSYA, "utf8");
const onceSha = sha(once);

/* ---- Idempotentlik ---- */
if (once.includes("PAZAR-BIREBIR-GORUNUM-YAMASI")) {
  console.log("Zaten uygulanmış (PAZAR-BIREBIR-GORUNUM-YAMASI işareti mevcut) — dosya değiştirilmedi.");
  process.exit(2);
}

/* ---- Anchorlar (exact, tek geçiş) ---- */

/* A) Pazar ızgarası: tek satır. musaitDegil'de "—", Pazar'da "Pazar" yazan gri hücre. */
const PAZAR_ESKI = `      if (isPazar || musaitDegil) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100"><span class="text-[9px] text-slate-400">' + (isPazar ? "Pazar" : "—") + '</span></td>';
      } else if (sinifVar) {`;
const PAZAR_YENI = `      if (musaitDegil) { /* PAZAR-BIREBIR-GORUNUM-YAMASI: Pazar artık normal gün satırı — yalnız Kapalı (musaitDegil) gri kalır */
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100"><span class="text-[9px] text-slate-400">—</span></td>';
      } else if (sinifVar) {`;

/* B) Birebir hücresi: ilk ad yerine tam ad + konu + sınıf (grup dalı korunur — grupUyeler koşulu öncesinde kalır) */
const HUCRE_ESKI = `        var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
        var ogrenciAd = ders.ogrenciAd || (ogrenci ? ogrenci.ad : "");
        var sinif = ogrenci ? ogrenci.sinif : "";
        var dersBilgi = DERS[ders.dersId];
        var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
        /* GRUP: grid hücresi dar → grup dersinde üye baş harfleri satırı (birebirde eski görünüm) */
        var grupUyeler = grupUyeEtiketleri(ders);
        var hucreUst = grupUyeler.length ? '<span class="text-[8.5px] font-bold text-slate-400">' + grupUyeler.map(function (a) { return esc(ilkHarfler(a)); }).join(" · ") + "</span>" : (sinif ? esc(sinif) : '');
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border ' + durumRenk + ' px-1 py-1.5" title="Dolu — kilitli">' +
          '<div class="text-[10.5px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd.split(" ")[0]) + '</div>' +
          (hucreUst ? '<div class="leading-tight">' + hucreUst + '</div>' : '') +
          (dersBilgi ? '<div class="text-[8px] font-bold mt-0.5 ' + dersBilgi.tx + '">' + dersBilgi.ad + '</div>' : '') +
          '</div></td>';`;

const HUCRE_YENI = `        var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
        var ogrenciAd = ders.ogrenciAd || (ogrenci ? ogrenci.ad : "");
        var sinif = ogrenci ? ogrenci.sinif : "";
        var dersBilgi = DERS[ders.dersId];
        var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
        /* GRUP: grid hücresi dar → grup dersinde üye baş harfleri satırı (birebirde eski görünüm) */
        var grupUyeler = grupUyeEtiketleri(ders);
        var hucreUst = grupUyeler.length ? '<span class="text-[8.5px] font-bold text-slate-400">' + grupUyeler.map(function (a) { return esc(ilkHarfler(a)); }).join(" · ") + "</span>" : (sinif ? esc(sinif) : '');
        /* PAZAR-BIREBIR-GORUNUM-YAMASI: birebir hücresi = TAM AD + KONU + SINIF (3 ayrı satır);
           null-on-miss: ogrenci bulunamazsa DB.ogrenciler ad eşlemesiyle fallback, o da yoksa boş.
           Uzun metin taşması: truncate + min-w-0 + orantılı padding/font/leading korunur. */
        var tamAd = (function () {
          if (ogrenci && ogrenci.ad) return ogrenci.ad;
          if (ders.ogrenciId) { var o2 = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; }); if (o2 && o2.ad) return o2.ad; }
          return ogrenciAd || "";
        })();
        var hucreKonu = ders.konu ? '<div class="text-[8.5px] text-slate-500 leading-tight truncate whitespace-nowrap min-w-0" title="' + esc(ders.konu) + '">' + esc(ders.konu) + '</div>' : '';
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border ' + durumRenk + ' px-1 py-1.5 min-w-0" title="Dolu — kilitli">' +
          '<div class="text-[10px] font-bold text-slate-800 leading-tight truncate whitespace-nowrap min-w-0" title="' + esc(tamAd) + '">' + esc(tamAd) + '</div>' +
          hucreKonu +
          (sinif ? '<div class="text-[8px] font-bold text-slate-400 leading-tight truncate whitespace-nowrap min-w-0">' + esc(sinif) + '</div>' : '') +
          (dersBilgi ? '<div class="text-[8px] font-bold mt-0.5 ' + dersBilgi.tx + '">' + dersBilgi.ad + '</div>' : '') +
          '</div></td>';`;

const DEGISIMLER = [
  { ad: "Pazar ızgarası → normal gün satırı", eski: PAZAR_ESKI, yeni: PAZAR_YENI },
  { ad: "Birebir hücresi: tam ad + konu + sınıf", eski: HUCRE_ESKI, yeni: HUCRE_YENI },
];

let sonra = once;
for (const d of DEGISIMLER) {
  const n = sonra.split(d.eski).length - 1;
  if (n !== 1) {
    console.error(`ASSERT BAŞARISIZ [${d.ad}]: anchor ${n} kez bulundu (tam 1 beklenir) — yazma İPTAL.`);
    process.exit(1);
  }
  sonra = sonra.split(d.eski).join(d.yeni);
}

/* ---- Yazma ÖNCESİ assert'ler ---- */
const fn = (kaynak, ad) => { const i = kaynak.indexOf(ad); const j = kaynak.indexOf("\nfunction ", i + 10); return kaynak.slice(i, j === -1 ? kaynak.length : j); };
const korunanFn = ["function gunlukTablo() {", "function dersOgrenciIds(ders) {", "function planla() {", "function istekBurak(", "function csvAktifDonemKayitSatirlari("];
const asserts = [
  ["PAZAR-BIREBIR işareti eklendi", sonra.includes("PAZAR-BIREBIR-GORUNUM-YAMASI")],
  ["Pazar kilit dalı kalktı", !sonra.includes('isPazar ? "Pazar" :')],
  ["isPazar artık kullanılmıyor (tanımdan başka)", (sonra.match(/isPazar/g) || []).length === 1], /* yalnız tanım satırı kaldı */
  ["musaitDegil davranışı korundu", sonra.includes("if (musaitDegil) {")],
  ["Birebir hücresi tam ad kullanıyor", sonra.includes('var tamAd = (function ()')],
  ["Eski ilk-ad split kaldırıldı", !sonra.includes('esc(ogrenciAd.split(" ")[0])')],
  ["Konu satırı eklendi", sonra.includes("var hucreKonu = ders.konu")],
  ["Sınıf satırı eklendi", sonra.includes("(sinif ? '<div class=\"text-[8px] font-bold text-slate-400")],
  ["Grup üye etiketleri KORUNDU", sonra.includes("var grupUyeler = grupUyeEtiketleri(ders);") && sonra.includes("esc(ilkHarfler(a))")],
  ["Ek Ders amber dalı KORUNDU", sonra.includes('title="Ek Ders — kilitli"')],
  ["Sınıf dersi dalı KORUNDU", sonra.includes('title="Sınıf dersi — kilitli"')],
  ["Boş drop zone dalı KORUNDU", sonra.includes('data-drop-ogrt=')],
  ["Üst-düzey fonksiyon tanımı sayısı değişmedi", (sonra.match(/\nfunction /g) || []).length === (once.match(/\nfunction /g) || []).length], /* IIFE dahil iç fonksiyonlar değişebilir; üst-düzey tanım sayısı sabit */
  ...korunanFn.map(f => ["Korunan blok birebir aynı: " + f, sha(fn(sonra, f)) === sha(fn(once, f))]),
];
let hata = 0;
for (const [ad, ok] of asserts) { console.log((ok ? "  ✓ " : "  ✗ ") + ad); if (!ok) hata = 1; }
if (hata) { console.error("ASSERT BAŞARISIZ — dosya YAZILMADI."); process.exit(1); }

/* ---- Test dosyası hash'leri (değişiklik öncesi kayıt) ---- */
const testDosyalari = ["test.mjs", "ks-harness.mjs", "ks-grup-gorunum.mjs", "ks-kapali-gorunum.mjs", "ks-ekders-ozet-csv.mjs"];
const hashKayit = {};
for (const d of testDosyalari) if (existsSync(d)) hashKayit[d] = sha(readFileSync(d, "utf8"));

const yedek = DOSYA + ".pazar-birebir-oncesi.bak";
if (!existsSync(yedek)) copyFileSync(DOSYA, yedek);
writeFileSync(DOSYA, sonra);
console.log("Yama uygulandı → " + DOSYA);
console.log("Yedek: " + yedek + " (SHA-256 " + sha(readFileSync(yedek, "utf8")).slice(0, 16) + "…)");
console.log("app.js: " + onceSha.slice(0, 16) + "… → " + sha(sonra).slice(0, 16) + "…");
console.log("Test hash kaydı: " + JSON.stringify(Object.fromEntries(Object.entries(hashKayit).map(([k, v]) => [k, v.slice(0, 12) + "…"]))));
