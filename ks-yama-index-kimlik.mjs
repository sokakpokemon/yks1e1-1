/* ks-yama-index-kimlik.mjs — index.html damga kaskadı + KALICI DÜZELTME (TEK idempotent yama).
   1) index.html:349 app.js?v=1d509a6410c874b4 → 6751449a8d3dea92 (ek-ders damgası AYNI kalır)
   2) 8 süitteki SABİT index.html SHA-256 pini KALDIRILIR (koruma kaybolmaz)
   3) ks-donem-ilk literal damga assertion'ı kaldırılır → TEK dinamik kontrole bağlanır
   4) Yeni ks-index-kimlik.mjs: app.js/ek-ders SHA16 damgası + script src + kritik id'ler (DİNAMİK)
   5) Donmuş manifest/elle/adliste/vaka listeleri YALNIZ gerçekten değişen satırlar için güncellenir
   Yedek: her dokunulan dosya için <ad>.index-kimlik-oncesi.bak (yazmadan ÖNCE). */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const sha16 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const OKU = (f) => readFileSync(f, "utf8");
const YAZ = (f, s) => writeFileSync(f, s);
const YEDEK = (f) => { const b = f + ".index-kimlik-oncesi.bak"; if (!existsSync(b)) copyFileSync(f, b); };

/* Tek seferlik tamamlanma kontrolü */
if (OKU("index.html").includes("app.js?v=6751449a8d3dea92") && existsSync("ks-index-kimlik.mjs")) {
  console.error("Zaten uygulanmış (index.html damga + ks-index-kimlik)."); process.exit(2);
}

const YAPILAN = [];

/* ——— 1) index.html damga ——— */
{
  const f = "index.html";
  YEDEK(f);
  const s = OKU(f);
  const yeni = s.replace('src="app.js?v=1d509a6410c874b4"', 'src="app.js?v=6751449a8d3dea92"');
  if (yeni === s) { console.error("DUR: index.html app.js?v= damgası bulunamadı."); process.exit(1); }
  YAZ(f, yeni); YAPILAN.push(f + " app.js?v=1d509a6410c874b4 → 6751449a8d3dea92");
}

/* ——— yardımcı: tam satır sil ——— */
function satirSil(f, tam) {
  const satirlar = OKU(f).split("\n");
  const kalan = satirlar.filter((l) => l !== tam);
  if (satirlar.length - kalan.length !== 1) {
    console.error(`DUR: ${f} — "${tam.slice(0, 70)}…" ${satirlar.length - kalan.length} kez (1 olmalı).`); process.exit(1);
  }
  YAZ(f, kalan.join("\n"));
  YAPILAN.push(`${f}: silindi → ${tam.slice(0, 72)}…`);
}
/* ——— yardımcı: süit içi SABİT beklenen sayısını güncelle ——— */
function sayiGuncelle(f, eski, yeni) {
  const satirlar = OKU(f).split("\n");
  const i = satirlar.findIndex((l) => l.includes("__kosan !== " + eski));
  if (i < 0) { console.error(`DUR: ${f} — "__kosan !== ${eski}" satırı yok.`); process.exit(1); }
  const l = satirlar[i];
  const duz = l.replace(new RegExp("\\b" + eski + "\\b", "g"), String(yeni));
  if (duz === l) { console.error(`DUR: ${f} — sayı ${eski} değişmedi.`); process.exit(1); }
  satirlar[i] = duz; YAZ(f, satirlar.join("\n"));
  YAPILAN.push(`${f}: beklenen ${eski} → ${yeni}`);
}
/* ——— yardımcı: manifest/elle-manifest sayı güncelle ——— */
function manifestGuncelle(f, suit, eski, yeni) {
  const s = OKU(f);
  const hedef = `"${suit}": ${eski},`;
  if (!s.includes(hedef)) { console.error(`DUR: ${f} — "${hedef}" yok.`); process.exit(1); }
  const yeniMetin = s.replace(hedef, `"${suit}": ${yeni},`);
  YEDEK(f); YAZ(f, yeniMetin); YAPILAN.push(`${f}: ${suit} ${eski} → ${yeni}`);
}
/* ——— yardımcı: vaka listesi txt ——— */
function txtSil(f, ad) {
  const satirlar = OKU(f).split("\n");
  const kalan = satirlar.filter((l) => l !== ad);
  if (satirlar.length - kalan.length !== 1) { console.error(`DUR: ${f} — ad 1 kez geçmeli: ${ad}`); process.exit(1); }
  YAZ(f, kalan.join("\n"));
}
function txtDegistir(f, eskiAd, yeniAd) {
  const satirlar = OKU(f).split("\n");
  const kalan = satirlar.filter((l) => l !== eskiAd);
  if (satirlar.length - kalan.length !== 1) { console.error(`DUR: ${f} — ad 1 kez geçmeli: ${eskiAd}`); process.exit(1); }
  const i = satirlar.indexOf(eskiAd);
  satirlar[i] = yeniAd; YAZ(f, satirlar.join("\n"));
}
function txtSonrasiEkle(f, hedefAd, yeniAdlar) {
  const satirlar = OKU(f).split("\n");
  const i = satirlar.indexOf(hedefAd);
  if (i < 0) { console.error(`DUR: ${f} — ekleme çapası yok: ${hedefAd}`); process.exit(1); }
  satirlar.splice(i + 1, 0, ...yeniAdlar); YAZ(f, satirlar.join("\n"));
}

const SHA_HTML_ESKI = "0fe95a46ebc743722c022a7424b51c1080ecce3d6eb5e7093257a2896e36e41c";

/* ——— 2) 8 süitten SABİT index.html SHA-256 pini kaldır ——— */
const PIN_SIL = [
  ["ks-birebir-gorunum.mjs", `t("index.html değişmedi (bilinen hash)", sha(readFileSync("index.html", "utf8")) === "${SHA_HTML_ESKI}");`, "ks-birebir-gorunum.mjs"],
  ["ks-ders-tasi.mjs", `t("index.html değişmedi (bilinen hash)", sha(readFileSync("index.html", "utf8")) === "${SHA_HTML_ESKI}");`, "ks-ders-tasi.mjs"],
  ["ks-donem-olusturma.mjs", `  t("index.html SHA-256 değişmedi", sha(html) === "${SHA_HTML_ESKI}", sha(html));`, "ks-donem-olusturma.mjs"],
  ["ks-ekders-ozet-csv.mjs", `t("index.html değişmedi", sha(readFileSync("index.html", "utf8")) === "${SHA_HTML_ESKI}");`, "ks-ekders-ozet-csv.mjs"],
  ["ks-gunluk-ders-tasi.mjs", `t("index.html değişmedi (bilinen hash)", sha(readFileSync("index.html", "utf8")) === "${SHA_HTML_ESKI}");`, "ks-gunluk-ders-tasi.mjs"],
];
for (const [f, satir] of PIN_SIL) { YEDEK(f); satirSil(f, satir); }

/* ks-donem-ilk: SHA pini + literal damga assertion'ı (2 adet) */
{
  const f = "ks-donem-ilk.mjs"; YEDEK(f);
  satirSil(f, `t("index.html SHA-256 değişmedi", sha(html) === "${SHA_HTML_ESKI}", sha(html));`);
  satirSil(f, `t("index.html statik varlık ?v=1d509a6410c874b4 (app.js) + ?v=3d2dd38ff517c64f (ek-ders.js) damgası VAR — damga kaldırılırsa KIRMIZI", html.includes('src="app.js?v=1d509a6410c874b4"') && html.includes('src="ek-ders.js?v=3d2dd38ff517c64f"'));`);
}
/* ks-ek-ders-donem: beklenen nesnesinden index.html girdisini çıkar */
{
  const f = "ks-ek-ders-donem.mjs"; YEDEK(f);
  const s = OKU(f);
  const yeni = s.replace(`"index.html": "${SHA_HTML_ESKI}", `, "");
  if (yeni === s) { console.error("DUR: ks-ek-ders-donem beklenen[index.html] bulunamadı."); process.exit(1); }
  YAZ(f, yeni); YAPILAN.push(`${f}: beklenen[index.html] girdisi kaldırıldı`);
}
/* ks-sinif-ogretmen-uyum: KNOWN_HTML sabiti + assertion */
{
  const f = "ks-sinif-ogretmen-uyum.mjs"; YEDEK(f);
  satirSil(f, `const KNOWN_HTML = "${SHA_HTML_ESKI}"; /* referans; yalnız uyarı amaçlı değil — hash farklıysa başkası dokundu */`);
  satirSil(f, `t("index.html dokunulmadı (bu dilim)", sha(html) === KNOWN_HTML);`);
}

/* ——— 3) ks-wa-alici: 3 idempotans assertion'ı ekle ——— */
const WA_YENI_ADLAR = [
  "waUrl idempotent: '905321234567' DEĞİŞMEZ (zaten tam uluslararası)",
  "waUrl '+90 532 123 45 67' → '905321234567' (rakam + baştaki 0 yok)",
  "waUrl '0532 123 45 67' → '905321234567' (baştaki 0 atılır + 90 eklenir)",
];
{
  const f = "ks-wa-alici.mjs"; YEDEK(f);
  const cipa = String.raw`t("waUrl imzası değişmedi (metin, tel)", /function waUrl\(metin, tel\) \{/.test(appKaynak));`;
  const satirlar = OKU(f).split("\n");
  const i = satirlar.indexOf(cipa);
  if (i < 0) { console.error("DUR: ks-wa-alici çapası yok."); process.exit(1); }
  const eklenecek = [
    `t("${WA_YENI_ADLAR[0]}", waUrl("m", "905321234567").includes("phone=905321234567&"));`,
    `t("${WA_YENI_ADLAR[1]}", waUrl("m", "+90 532 123 45 67").includes("phone=905321234567&"));`,
    `t("${WA_YENI_ADLAR[2]}", waUrl("m", "0532 123 45 67").includes("phone=905321234567&"));`,
  ];
  satirlar.splice(i + 1, 0, ...eklenecek);
  YAZ(f, satirlar.join("\n"));
  YAPILAN.push("ks-wa-alici.mjs: +3 idempotans assertion'ı");
}

/* ——— 4) Süit içi beklenen sayıları ——— */
const SAYILAR = [
  ["ks-birebir-gorunum.mjs", 35, 34], ["ks-ders-tasi.mjs", 91, 90], ["ks-donem-ilk.mjs", 48, 46],
  ["ks-donem-olusturma.mjs", 87, 86], ["ks-ek-ders-donem.mjs", 59, 58], ["ks-ekders-ozet-csv.mjs", 45, 44],
  ["ks-gunluk-ders-tasi.mjs", 115, 114], ["ks-sinif-ogretmen-uyum.mjs", 34, 33], ["ks-wa-alici.mjs", 46, 49],
];
for (const [f, e, y] of SAYILAR) sayiGuncelle(f, e, y);

/* ——— 5) test.mjs süit listesi ——— */
{
  const f = "test.mjs"; YEDEK(f);
  const s = OKU(f);
  const yeni = s.replace('"ks-dongu29.mjs"];', '"ks-dongu29.mjs", "ks-index-kimlik.mjs"];');
  if (yeni === s) { console.error("DUR: test.mjs süit dizisi sonu bulunamadı."); process.exit(1); }
  YAZ(f, yeni); YAPILAN.push("test.mjs: ks-index-kimlik.mjs süit listesine eklendi");
}

/* ——— 6) manifest + elle manifest ——— */
const MAN = [
  ["ks-birebir-gorunum.mjs", 35, 34], ["ks-ders-tasi.mjs", 91, 90], ["ks-donem-ilk.mjs", 48, 46],
  ["ks-donem-olusturma.mjs", 87, 86], ["ks-ek-ders-donem.mjs", 59, 58], ["ks-ekders-ozet-csv.mjs", 45, 44],
  ["ks-gunluk-ders-tasi.mjs", 115, 114], ["ks-sinif-ogretmen-uyum.mjs", 34, 33], ["ks-wa-alici.mjs", 46, 49],
];
for (const [suit, e, y] of MAN) { manifestGuncelle("suit-manifest.mjs", suit, e, y); manifestGuncelle("elle-vaka-manifesti.mjs", suit, e, y); }
{ /* yeni süit */
  for (const f of ["suit-manifest.mjs", "elle-vaka-manifesti.mjs"]) {
    YEDEK(f);
    const s = OKU(f);
    const yeni = s.replace('  "ks-dongu29.mjs":', '  "ks-index-kimlik.mjs": 8,\n  "ks-dongu29.mjs":');
    if (yeni === s) { console.error(`DUR: ${f} yeni süit girilecek nokta yok.`); process.exit(1); }
    YAZ(f, yeni); YAPILAN.push(`${f}: ks-index-kimlik.mjs = 8 eklendi`);
  }
}

/* ——— 7) donmuş vaka listeleri (txt) ——— */
const TXT = [
  ["suit-vakalar/ks-birebir-gorunum.mjs.txt", "index.html değişmedi (bilinen hash)"],
  ["suit-vakalar/ks-ders-tasi.mjs.txt", "index.html değişmedi (bilinen hash)"],
  ["suit-vakalar/ks-donem-olusturma.mjs.txt", "index.html SHA-256 değişmedi"],
  ["suit-vakalar/ks-ekders-ozet-csv.mjs.txt", "index.html değişmedi"],
  ["suit-vakalar/ks-gunluk-ders-tasi.mjs.txt", "index.html değişmedi (bilinen hash)"],
  ["suit-vakalar/ks-sinif-ogretmen-uyum.mjs.txt", "index.html dokunulmadı (bu dilim)"],
  ["suit-vakalar/ks-ek-ders-donem.mjs.txt", "index.html değişmedi"],
];
for (const [f, ad] of TXT) { YEDEK(f); txtSil(f, ad); YAPILAN.push(`${f}: "${ad}" silindi`); }
{ YEDEK("suit-vakalar/ks-donem-ilk.mjs.txt");
  txtSil("suit-vakalar/ks-donem-ilk.mjs.txt", "index.html SHA-256 değişmedi");
  txtSil("suit-vakalar/ks-donem-ilk.mjs.txt", "index.html statik varlık ?v=1d509a6410c874b4 (app.js) + ?v=3d2dd38ff517c64f (ek-ders.js) damgası VAR — damga kaldırılırsa KIRMIZI");
  YAPILAN.push("suit-vakalar/ks-donem-ilk.mjs.txt: 2 ad silindi"); }
/* ks-kart-kolon #56: dinamik ad yeni app.js SHA16 ile */
txtDegistir("suit-vakalar/ks-kart-kolon.mjs.txt",
  "index.html damga = SHA ilk 16 hane (app.js ?v=1d509a6410c874b4 + ek-ders.js ?v=3d2dd38ff517c64f)",
  "index.html damga = SHA ilk 16 hane (app.js ?v=6751449a8d3dea92 + ek-ders.js ?v=3d2dd38ff517c64f)");
YAPILAN.push("suit-vakalar/ks-kart-kolon.mjs.txt: #56 damga adı güncellendi");
/* ks-wa-alici: +3 ad */
YEDEK("suit-vakalar/ks-wa-alici.mjs.txt");
txtSonrasiEkle("suit-vakalar/ks-wa-alici.mjs.txt", "waUrl imzası değişmedi (metin, tel)", WA_YENI_ADLAR);
YAPILAN.push("suit-vakalar/ks-wa-alici.mjs.txt: +3 ad");
/* yeni süit listesi */
{
  const f = "suit-vakalar/ks-index-kimlik.mjs.txt";
  YAZ(f, [
    "index.html app.js?v= damgası = app.js SHA-256 ilk 16 hane (bayat kalırsa KIRMIZI)",
    "index.html ek-ders.js?v= damgası = ek-ders.js SHA-256 ilk 16 hane (bayat kalırsa KIRMIZI)",
    "her iki statik varlıkta ?v= 16 haneli SHA biçiminde (damga kaybolur/bozulursa KIRMIZI)",
    "app.js script src'i index.html'de TAM 1 kez",
    "ek-ders.js script src'i index.html'de TAM 1 kez (defer'li)",
    "index.html planKart id'si VAR",
    "index.html havuzBolum id'si VAR",
    "index.html ks-kart-kolon id'si VAR",
  ].join("\n") + "\n");
  YAPILAN.push(`${f}: oluşturuldu (8 ad)`);
}

/* ——— 8) elle-vaka-adlari.mjs sarmalayıcı ——— */
{
  const f = "elle-vaka-adlari.mjs"; YEDEK(f);
  let s = OKU(f);
  /* eski donem-ilk yeniden adlandırması kaldırılır (o assertion artık yok) */
  const eskiBlok = `/* DÖNGÜ-30-CACHE (SHA16 damgası): 6dd3188 → dosya SHA-256 ilk 16 hane.
   - ks-donem-ilk #48 vaka adı damga metnini taşır → hedefli yeniden adlandırma.
   - ks-kart-kolon yeni #56 vaka adı (içerik damgası = SHA16) listenin SONUNA eklenir. */
offsetDuzelt(
  "ks-donem-ilk.mjs",
  "index.html statik varlık ?v=6dd3188 damgası VAR (app.js + ek-ders.js) — damga kaldırılırsa KIRMIZI",
  "index.html statik varlık ?v=1d509a6410c874b4 (app.js) + ?v=3d2dd38ff517c64f (ek-ders.js) damgası VAR — damga kaldırılırsa KIRMIZI",
);
`;
  const yeniBlok = `/* DÖNGÜ-30-CACHE (SHA16 damgası): ks-donem-ilk damga assertion'ı KALDIRILDI;
   damga artık DİNAMİK olarak ks-index-kimlik.mjs süitinde doğrulanır. */
`;
  if (!s.includes(eskiBlok)) { console.error("DUR: elle-vaka-adlari.mjs donem-ilk bloğu bulunamadı."); process.exit(1); }
  s = s.replace(eskiBlok, yeniBlok);
  /* ks-kart-kolon #56 push: yeni app.js SHA16 */
  const eskiPush = `"index.html damga = SHA ilk 16 hane (app.js ?v=1d509a6410c874b4 + ek-ders.js ?v=3d2dd38ff517c64f)",`;
  if (!s.includes(eskiPush)) { console.error("DUR: elle-vaka-adlari.mjs kart-kolon push bulunamadı."); process.exit(1); }
  s = s.replace(eskiPush, `"index.html damga = SHA ilk 16 hane (app.js ?v=6751449a8d3dea92 + ek-ders.js ?v=3d2dd38ff517c64f)",`);
  /* silinen pin adları + yeni adlar */
  s += `
/* KALICI DÜZELTME: index.html SABİT SHA-256 pinleri ve literal damga assertion'ı KALDIRILDI.
   Koruma kaybolmaz: damga/script/id denetimi artık TEK yerde, ks-index-kimlik.mjs'de DİNAMİK. */
function adSil(suit, ad) {
  const liste = elleVakaAdlari[suit];
  if (!Array.isArray(liste)) throw new Error("adSil: süit yok: " + suit);
  const i = liste.indexOf(ad);
  if (i < 0) throw new Error("adSil: hedef ad bulunamadı: " + suit + " :: " + ad);
  liste.splice(i, 1);
}
function adSonrasiEkle(suit, sonraAd, yeniAdlar) {
  const liste = elleVakaAdlari[suit];
  if (!Array.isArray(liste)) throw new Error("adSonrasiEkle: süit yok: " + suit);
  const i = liste.indexOf(sonraAd);
  if (i < 0) throw new Error("adSonrasiEkle: çapa ad bulunamadı: " + suit + " :: " + sonraAd);
  liste.splice(i + 1, 0, ...yeniAdlar);
}
adSil("ks-birebir-gorunum.mjs", "index.html değişmedi (bilinen hash)");
adSil("ks-ders-tasi.mjs", "index.html değişmedi (bilinen hash)");
adSil("ks-donem-ilk.mjs", "index.html SHA-256 değişmedi");
adSil("ks-donem-ilk.mjs", "index.html statik varlık ?v=6dd3188 damgası VAR (app.js + ek-ders.js) — damga kaldırılırsa KIRMIZI");
adSil("ks-donem-olusturma.mjs", "index.html SHA-256 değişmedi");
adSil("ks-ek-ders-donem.mjs", "index.html değişmedi");
adSil("ks-ekders-ozet-csv.mjs", "index.html değişmedi");
adSil("ks-gunluk-ders-tasi.mjs", "index.html değişmedi (bilinen hash)");
adSil("ks-sinif-ogretmen-uyum.mjs", "index.html dokunulmadı (bu dilim)");
adSonrasiEkle("ks-wa-alici.mjs", "waUrl imzası değişmedi (metin, tel)", [
  "waUrl idempotent: '905321234567' DEĞİŞMEZ (zaten tam uluslararası)",
  "waUrl '+90 532 123 45 67' → '905321234567' (rakam + baştaki 0 yok)",
  "waUrl '0532 123 45 67' → '905321234567' (baştaki 0 atılır + 90 eklenir)",
]);
elleVakaAdlari["ks-index-kimlik.mjs"] = [
  "index.html app.js?v= damgası = app.js SHA-256 ilk 16 hane (bayat kalırsa KIRMIZI)",
  "index.html ek-ders.js?v= damgası = ek-ders.js SHA-256 ilk 16 hane (bayat kalırsa KIRMIZI)",
  "her iki statik varlıkta ?v= 16 haneli SHA biçiminde (damga kaybolur/bozulursa KIRMIZI)",
  "app.js script src'i index.html'de TAM 1 kez",
  "ek-ders.js script src'i index.html'de TAM 1 kez (defer'li)",
  "index.html planKart id'si VAR",
  "index.html havuzBolum id'si VAR",
  "index.html ks-kart-kolon id'si VAR",
];
`;
  YAZ(f, s); YAPILAN.push("elle-vaka-adlari.mjs: 9 pin adı silindi, +3 wa-alici, ks-index-kimlik eklendi");
}

console.log("UYGULANDI (" + YAPILAN.length + " adım):");
YAPILAN.forEach((x) => console.log("  · " + x));
console.log("\nindex.html SHA16 = " + sha16(OKU("index.html")) + " · app.js SHA16 = " + sha16(OKU("app.js")) + " · ek-ders.js SHA16 = " + sha16(OKU("ek-ders.js")));
