/* ks-yama-birebir-gorunum.mjs — BIREBIR-GORUNUM-ORTAK-YAMASI
   TEK İŞ: gunlukTablo() ve haftalikOgrtTablo() içindeki birebir ders hücreleri AYNI görünüme
   getirilir: TAM AD + (yalnız gerçek, dolu, ders adı/sınıf adından farklıysa) KONU + SINIF.
   Ders adı (MATEMATİK vb.) birebir hücresinden KALDIRILIR; konu asla ders adından türetilmez.
   Yöntem: tek ortak yardımcı `birebirHucreHTML(...)` eklenir; iki fonksiyonun hücre blokları
   exact-anchor ile değiştirilir. Grup/Kapalı/Bos/Sinif Dersi/Ek Ders dalları DOKUNULMAZ.
   Yedek: app.js.birebir-gorunum-oncesi.bak (üzerine yazılmaz). 2. koşu: exit 2. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const DOSYA = "app.js";
const once = readFileSync(DOSYA, "utf8");
const onceSha = sha(once);

if (once.includes("BIREBIR-GORUNUM-ORTAK-YAMASI")) {
  console.log("Zaten uygulanmış (BIREBIR-GORUNUM-ORTAK-YAMASI işareti mevcut) — dosya değiştirilmedi.");
  process.exit(2);
}

/* ---- Yedek (varsa üzerine YAZMA) ---- */
const yedek = DOSYA + ".birebir-gorunum-oncesi.bak";
if (!existsSync(yedek)) copyFileSync(DOSYA, yedek);

/* ---- Yardımcı blok: gunlukTablo'dan hemen ÖNCE eklenir ---- */
const YARDIMCI = `
/* BIREBIR-GORUNUM-ORTAK-YAMASI: günlük + haftalık birebir hücresi TEK kaynak.
   Satır sırası: (1) TAM AD, (2) gerçek konu (yalnız dolu + ders adı/sınıf adından farklıysa),
   (3) sınıf. Ders adı (DERS[dersId].ad) ASLA gösterilmez; konu asla ders adından türetilmez. */
function birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) {
  var tamAd = (function () {
    if (ogrenci && ogrenci.ad) return ogrenci.ad;
    if (ders.ogrenciId) { var o2 = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; }); if (o2 && o2.ad) return o2.ad; }
    return ogrenciAd || "";
  })();
  var dersBilgi = DERS[ders.dersId];
  var dersAdi = dersBilgi ? dersBilgi.ad : "";
  var konu = (typeof ders.konu === "string" ? ders.konu : "").trim();
  var konuGecerli = konu.length > 0 && konu !== dersAdi && konu !== (sinif || "") && konu !== tamAd;
  var hucreKonu = konuGecerli ? '<div class="text-[9px] text-slate-500 leading-tight truncate whitespace-nowrap min-w-0" title="' + esc(konu) + '">' + esc(konu) + '</div>' : '';
  return '<div class="rounded-lg border ' + (durumRenk || "bg-blue-50 border-blue-200") + ' px-1 py-1.5 min-w-0" title="Dolu — kilitli">' +
    '<div class="text-[10px] font-bold text-slate-800 leading-tight truncate whitespace-nowrap min-w-0" title="' + esc(tamAd) + '">' + esc(tamAd) + '</div>' +
    hucreKonu +
    (sinif ? '<div class="text-[8px] font-bold text-slate-400 leading-tight truncate whitespace-nowrap min-w-0">' + esc(sinif) + '</div>' : '') +
    '</div>';
}
`;

/* ---- A) haftalikOgrtTablo birebir bloğu (mevcut PAZAR-BIREBIR hali) ---- */
const HAFT_ESKI = `        var tamAd = (function () {
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
const HAFT_YENI = `        /* BIREBIR-GORUNUM-ORTAK-YAMASI: ortak yardımcıyla günlük tablo ile AYNI hücre (ders adı yok) */
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100">' +
          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) + '</td>';`;

/* ---- B) gunlukTablo birebir bloğu ---- */
const GUN_ESKI = `          var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
          var sinif = ogrenci ? ogrenci.sinif : "";
          var dersBilgi = DERS[ders.dersId];
          var hucreIcerik = sinif || esc(ders.ogrenciAd || "").split(" ")[0];
          /* GRUP: günlük tabloda üye baş harfleri alt satırda (birebirde eklenmez) */
          var grupUyelerG = grupUyeEtiketleri(ders);
          var altYazi = (grupUyelerG.length ? grupUyelerG.map(function (a) { return ilkHarfler(a); }).join(" · ") + (dersBilgi ? " · " : "") : "") + (dersBilgi ? dersBilgi.ad : "");
          var renk = ders.durum === "tamamlandi" ? "text-emerald-600" : "text-slate-700";

          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors">' +
            '<div class="text-[11.5px] font-bold ' + renk + ' leading-tight">' + esc(hucreIcerik) + '</div>';
          if (altYazi) html += '<div class="text-[8.5px] text-slate-400 mt-0.5">' + esc(altYazi) + '</div>';
          html += '</td>';`;
const GUN_YENI = `          var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
          var sinif = ogrenci ? ogrenci.sinif : "";
          /* GRUP: günlük tabloda üye baş harfleri alt satırda (birebirde eklenmez) */
          var grupUyelerG = grupUyeEtiketleri(ders);
          var durumRenkG = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
          /* BIREBIR-GORUNUM-ORTAK-YAMASI: haftalik tablo ile AYNI hücre (tam ad + gerçek konu + sınıf; ders adı yok) */
          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors">' +
            birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || "", sinif, durumRenkG);
          if (grupUyelerG.length) html += '<div class="text-[8.5px] text-slate-400 mt-0.5">' + grupUyelerG.map(function (a) { return ilkHarfler(a); }).join(" · ") + '</div>';
          html += '</td>';`;

/* ---- Yardımcının eklenme noktası: gunlukTablo tanımı ---- */
const YERLESTIR_ESKI = `function gunlukTablo() {`;
const YERLESTIR_YENI = YARDIMCI + `\nfunction gunlukTablo() {`;

const DEGISIMLER = [
  { ad: "yardımcı ekleme noktası (gunlukTablo öncesi)", eski: YERLESTIR_ESKI, yeni: YERLESTIR_YENI },
  { ad: "haftalik birebir bloğu → ortak yardımcı", eski: HAFT_ESKI, yeni: HAFT_YENI },
  { ad: "gunluk birebir bloğu → ortak yardımcı", eski: GUN_ESKI, yeni: GUN_YENI },
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
const korunanFn = ["function dersOgrenciIds(ders) {", "function planla() {", "function istekBurak(", "function csvAktifDonemKayitSatirlari("];
const asserts = [
  ["Yama işareti eklendi", sonra.includes("BIREBIR-GORUNUM-ORTAK-YAMASI")],
  ["Ortak yardımcı mevcut (tek)", (sonra.match(/function birebirHucreHTML\(/g) || []).length === 1],
  ["Ortak yardımcı iki yerden çağrılıyor", (sonra.match(/birebirHucreHTML\(ders/g) || []).length === 3],
  ["Ders adı artık birebir hücresinde YOK (haftalik)", !sonra.includes("(dersBilgi ? '<div class=\"text-[8px] font-bold mt-0.5 ' + dersBilgi.tx")],
  ["Eski gunluk hucreIcerik kalktı", !sonra.includes('var hucreIcerik = sinif || esc(ders.ogrenciAd')],
  ["Eski altYazi birleşimi kalktı", !sonra.includes('(dersBilgi ? dersBilgi.ad : "")')],
  ["Konu ders adına fallback EDİLMİYOR", !/konu\s*=\s*[^;]*DERS\[\s*ders\.dersId\s*\]/.test(sonra)],
  ["Konu geçerlilik kurulu", sonra.includes('konu !== dersAdi') && sonra.includes('konu !== (sinif || "")')],
  ["Grup baş harf satırı korundu (gunluk)", sonra.includes('grupUyelerG.map(function (a) { return ilkHarfler(a); }).join(" · ")')],
  ["Grup üye satırı korundu (haftalik)", sonra.includes("var grupUyeler = grupUyeEtiketleri(ders);") && sonra.includes("esc(ilkHarfler(a))")],
  ["Ek Ders amber dalı KORUNDU (haftalik)", sonra.includes('title="Ek Ders — kilitli"')],
  ["Ek Ders amber dalı KORUNDU (gunluk)", sonra.includes('text-amber-600">Ek Ders')],
  ["Sınıf dersi dalı KORUNDU", sonra.includes('title="Sınıf dersi — kilitli"')],
  ["Kapalı dal KORUNDU", sonra.includes("if (musaitDegil) {")],
  ["Boş drop zone dalı KORUNDU", sonra.includes('data-drop-ogrt=')],
  ["Pazar normal gün satırı KORUNDU", !sonra.includes('isPazar ? "Pazar" :')],
  ["Fonksiyon tanım sayısı sabit (+1 yardımcı)", (sonra.match(/\nfunction /g) || []).length === (once.match(/\nfunction /g) || []).length + 1],
  ...korunanFn.map(f => ["Korunan blok birebir aynı: " + f, (() => { const b = fn(sonra, f); const h = b.indexOf("\n/* BIREBIR-GORUNUM-ORTAK-YAMASI"); const kiyas = h === -1 ? b : b.slice(0, h); if (sha(kiyas) === sha(fn(once, f))) return true; /* yardımcı eklemesi sonrası bitişik blok: yalnız işaret-satırı farkına izin ver */ return kiyas.replace(/\n?\/\* BIREBIR-GORUNUM-ORTAK-YAMASI[\s\S]*$/, "").trimEnd() === fn(once, f).replace(/\n?\/\* BIREBIR-GORUNUM-ORTAK-YAMASI[\s\S]*$/, "").trimEnd() || (h > -1 && kiyas.endsWith(fn(once, f).trimEnd()) ); })()]),
];
let hata = 0;
for (const [ad, ok] of asserts) { console.log((ok ? "  ✓ " : "  ✗ ") + ad); if (!ok) hata = 1; }
if (hata) { console.error("ASSERT BAŞARISIZ — dosya YAZILMADI."); process.exit(1); }

writeFileSync(DOSYA, sonra);
console.log("Yama uygulandı → " + DOSYA);
console.log("Yedek: " + yedek + " (SHA-256 " + sha(readFileSync(yedek, "utf8")).slice(0, 16) + "…)");
console.log("app.js: " + onceSha.slice(0, 16) + "… → " + sha(sonra).slice(0, 16) + "…");
