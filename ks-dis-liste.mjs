let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 38) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-dis-liste.mjs kosan=" + __kosan + " beklenen=38"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-dis-liste.mjs:" + __kosan + ":38"); } });
/* ks-dis-liste.mjs — D61-DIS-LISTE süiti ("Dış Liste Yükle" toplu içe aktarma)
   Kapsam: ayraç OTOMATİK algılama (; , TAB) · başlık normalizasyonu (aksan/büyük-küçük/boşluk/
   alt çizgi duyarsız) · zorunlu kolon hatası (Ad+Soyad eksik → DOSYA düzeyinde hata, HİÇBİR satır
   yazılmaz) · satır düzeyi boş Ad → "Hatalı" sayılır ve atlanır · Yeni/Güncellenecek/Atlanacak/
   Hatalı sayaçları · boş hücre mevcut telefonu EZMEZ · telefonlar AYNEN saklanır · sinifProg'a
   YENİ ANAHTAR AÇILMAZ · Geri Al birebir snapshot döndürür (csvGeriAl yolu) · bölüm HTML'i
   idempotent (çift kart yok) · disListeTetik (csvDosyalarOku + csvParse) yolu.
   Desen: tek boot + gerçek app.js (mevcut süitlerle aynı); t( çağrılarının TAMAMI koşulsuzdur
   (statik-eksiksizlik sıfır-hit kapısı). */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const scripts = [appKaynak, ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" }, open() {} };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
const ids = {};
global.document = {
  getElementById: (id) => { if (ids[id]) return ids[id]; return elStub(); },
  addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => []
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
/* disListeTetik yolu (csvDosyalarOku → FileReader) için minimal okuma stub'ı */
global.FileReader = function () { this.readAsText = (f) => { this.result = f._metin || ""; if (this.onload) this.onload(); }; };

let fail = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };
const dosya = (metin, ad) => [{ ad: ad || "dis.csv", metin: metin }];

const EXPORTS = "{ db: () => DB, durum: () => DIS_LISTE_ONIZLE, onizle: disListeOnizle, bolum: disListeBolumHTML, uygula: disListeUygula, vazgec: disListeVazgec, tetik: disListeTetik, ayarTab, kart: csvYonetimKartHTML, geriAl: csvGeriAl, sinifProgAnahtar: () => Object.keys(DB.sinifProg).sort().join(\",\") }";
let api;
try {
  api = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
  t("boot hatasız (app.js + disListe* yüzeyi)", typeof api.onizle === "function" && typeof api.uygula === "function" && typeof api.bolum === "function" && typeof api.tetik === "function" && typeof api.vazgec === "function");
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}
const db = api.db;

/* ---- test verisi: 2 aynı adlı (atla), 1 eşleşecek, sınıf kayıt defteri ---- */
db().ogrenciler = [
  { id: "dl-1", ad: "Ali Veli", sinif: "12 SAY 1", tel: "", veliTel: "", anneTel: "", babaTel: "" },
  { id: "dl-2", ad: "Zeynep Kaya", sinif: "12 SAY 2", tel: "05550000000", veliTel: "05550000000", anneTel: "05550000000", babaTel: "" },
  { id: "dl-3", ad: "İkiz Kaya", sinif: "12 SAY 2", tel: "", veliTel: "", anneTel: "", babaTel: "" },
  { id: "dl-4", ad: "İkiz Kaya", sinif: "12 SAY 3", tel: "", veliTel: "", anneTel: "", babaTel: "" }
];
db().sinifIds = { "12 SAY 1": "snf1", "12 SAY 2": "snf2" };

/* ================= 1) Ayraç OTOMATİK algılama ================= */
console.log("1) Ayraç otomatik algılama:");
api.onizle(dosya("Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel\nAyşe,Yılmaz,12 SAY 1,1,2\n"));
t("virgül ayraç algılandı (ilk satırda en çok geçen ayraç)", api.durum().ayrac === ",", JSON.stringify(api.durum().ayrac));
api.onizle(dosya("Ad\tSoyad\tSinif\tOgrenci_Ceptel\tVeli_Ceptel\nAli\tVeli\t12 SAY 1\t1\t2\n"));
t("TAB ayraç algılandı", api.durum().ayrac === "\t", JSON.stringify(api.durum().ayrac));
api.onizle(dosya("Ad;Soyad;Sinif;Ogrenci_Ceptel;Veli_Ceptel\nAli;Veli;12 SAY 1;1;2\n"));
t("noktalı virgül ayraç algılandı", api.durum().ayrac === ";", JSON.stringify(api.durum().ayrac));

/* ================= 2) Başlık normalizasyonu ================= */
console.log("2) Başlık normalizasyonu:");
api.onizle(dosya("AD,SoyAd,Sınıf,Ogrenci Ceptel,VELİ_CEPTEL\nAyşe,Yılmaz,12 SAY 1,0500 111 22 33,0555 444 55 66\n"));
t("büyük/küçük harf + aksan + boşluk/alt çizgi duyarsız (5 kolon eşleşti)", api.durum().hata === "" && api.durum().satirlar.length === 1, JSON.stringify(api.durum().hata));
t("hücre değerleri doğru okundu (telefonlar AYNEN)", api.durum().satirlar[0].ogrenciCeptel === "0500 111 22 33" && api.durum().satirlar[0].veliCeptel === "0555 444 55 66");

/* ================= 3) Zorunlu kolon (DOSYA düzeyinde hata) ================= */
console.log("3) Zorunlu kolon hatası:");
api.onizle(dosya("Ad,Sinif\nAli,12 SAY 1\n"));
t("Soyad kolonu eksik → DOSYA düzeyinde hata", !!api.durum().hata, JSON.stringify(api.durum().hata));
t("zorunlu kolon hatasında HİÇBİR satır yazılmaz (satır listesi boş)", api.durum().satirlar.length === 0);
api.onizle(dosya("Soyad,Sinif\nVeli,12 SAY 1\n"));
t("Ad kolonu eksik → DOSYA düzeyinde hata + boş plan", !!api.durum().hata && api.durum().satirlar.length === 0);

/* ================= 4) Satır düzeyi boş Ad → Hatalı ================= */
console.log("4) Satır düzeyi boş Ad:");
api.onizle(dosya("Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel\n,Yılmaz,12 SAY 1,,\n"));
t("boş Ad satırı 'Hatalı' sayılır (durum=hata)", api.durum().satirlar[0].durum === "hata", JSON.stringify(api.durum().satirlar[0]));
t("hatalı satır sayaçta 1 (say.hatali)", api.durum().say.hatali === 1);
api.uygula();
t("hatalı satır uygulanmadı (DB'de boş adlı kayıt yok)", db().ogrenciler.every((o) => String(o.ad).trim() !== ""), JSON.stringify(db().ogrenciler.map((o) => o.ad)));

/* ================= 5) Eşleşme mantığı ================= */
console.log("5) Eşleşme mantığı (kucuk(ad + ' ' + soyad)):");
api.onizle(dosya("Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel\nAli,Veli,,,\n"));
t("tek eşleşme → Güncellenecek (hedef id)", api.durum().satirlar[0].durum === "guncelle" && api.durum().satirlar[0].hedefId === "dl-1");
api.onizle(dosya("Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel\nYeni,Ogrenci,12 SAY 1,,\n"));
t("eşleşme yok → Yeni", api.durum().satirlar[0].durum === "yeni");
api.onizle(dosya("Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel\nİkiz,Kaya,12 SAY 1,,\n"));
t("aynı isim birden fazla kayıtta → Atla (otomatik seçim YOK)", api.durum().satirlar[0].durum === "atla", JSON.stringify(api.durum().satirlar[0]));

/* ================= 6) Kayıtlı olmayan sınıf → uyarı ================= */
console.log("6) Sınıf kayıt defteri uyarısı:");
api.onizle(dosya("Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel\nAli,Veli,99 YENI SINIF,,\n"));
t("kayıtlı olmayan sınıf → satır 'uyarı' + say.uyari=1", api.durum().satirlar[0].uyari === true && api.durum().say.uyari === 1, JSON.stringify(api.durum().say));

/* ================= 7) Sayaçlar (karışık dosya) ================= */
console.log("7) Sayaçlar (yeni/güncellenecek/atlanacak/hatalı):");
api.onizle(dosya("Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel\nYeni,Ogrenci,12 SAY 1,,\nAli,Veli,12 SAY 1,,\nİkiz,Kaya,12 SAY 1,,\n,Yılmaz,12 SAY 1,,\n"));
t("say.yeni = 1", api.durum().say.yeni === 1, JSON.stringify(api.durum().say));
t("say.guncelle = 1", api.durum().say.guncelle === 1, JSON.stringify(api.durum().say));
t("say.atla = 1", api.durum().say.atla === 1, JSON.stringify(api.durum().say));
t("say.hatali = 1", api.durum().say.hatali === 1, JSON.stringify(api.durum().say));
t("kayıtlı sınıflarda uyarı ÜRETİLMEZ (say.uyari = 0)", api.durum().say.uyari === 0, JSON.stringify(api.durum().say));

/* ================= 8) Uygula: atomik yazım kuralları ================= */
console.log("8) Uygula (boş hücre ezmez · telefonlar aynen · sinifProg'a anahtar açılmaz):");
const csvUygula = [
  "Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel",
  "Ali,Veli,,,",                                            /* güncelle: tüm hücreler boş → mevcut değerler korunur */
  "Yeni,Ogrenci,12 SAY 1,0500 111 22 33,0555 444 55 66",    /* yeni kayıt */
  "İkiz,Kaya,12 SAY 1,,",                                   /* atla */
  "Zeynep,Kaya,12 SAY 1,,0553 000 11 22"                    /* güncelle: sınıf + veli teli */
].join("\n") + "\n";
api.onizle(dosya(csvUygula));
const spOnce = api.sinifProgAnahtar();
const dbOnce = JSON.stringify(db());
api.uygula();
const yeniK = db().ogrenciler.find((o) => o.ad === "Yeni Ogrenci");
const ali = db().ogrenciler.find((o) => o.id === "dl-1");
const zey = db().ogrenciler.find((o) => o.id === "dl-2");
t("yeni kayıt eklendi (ad + soyad birleşti)", !!yeniK);
t("yeni kayıtta telefonlar AYNEN + veliTel legacy ayna", yeniK && yeniK.tel === "0500 111 22 33" && yeniK.veliTel === "0555 444 55 66" && yeniK.anneTel === "0555 444 55 66" && yeniK.babaTel === "", JSON.stringify(yeniK));
t("boş hücre mevcut değeri EZMEDİ (Ali: tel/sınıf/veliTel aynen)", ali.tel === "" && ali.sinif === "12 SAY 1" && ali.veliTel === "", JSON.stringify(ali));
t("dolu hücreler yazıldı (Zeynep: sınıf + veliTel; boş Ceptel mevcut tel'i ezmedi)", zey.sinif === "12 SAY 1" && zey.veliTel === "0553 000 11 22" && zey.tel === "05550000000", JSON.stringify({ sinif: zey.sinif, veliTel: zey.veliTel, tel: zey.tel }));
t("aynı isim (İkiz Kaya) uygulanmadı", db().ogrenciler.filter((o) => o.ad === "İkiz Kaya" && o.sinif === "12 SAY 1").length === 0);
t("DB.sinifProg'a yeni anahtar AÇILMADI", api.sinifProgAnahtar() === spOnce, spOnce + " → " + api.sinifProgAnahtar());
t("önizleme temizlendi (uygulama sonrası durum null)", api.durum() === null);

/* ================= 9) Geri Al (csvGeriAl ile aynı davranış) ================= */
console.log("9) Geri Al:");
api.geriAl();
t("Geri Al DB'yi birebir snapshot'a döndürdü", JSON.stringify(db()) === dbOnce);

/* ================= 10) Bölüm HTML'i: idempotent + kart ayrımı ================= */
console.log("10) Bölüm HTML'i (idempotent, çift kart yok):");
const ayar = api.ayarTab();
t("ayarTab 'Dış Liste Yükle' bölümünü TAM 1 kez içerir (çift kart YOK)", (ayar.match(/Dış Liste Yükle/g) || []).length === 1, String((ayar.match(/Dış Liste Yükle/g) || []).length));
t("csvYonetimKartHTML DEĞİŞMEDİ (bölüm o kartın DIŞINDA)", !api.kart().includes("Dış Liste Yükle") && (ayar.match(/Excel \/ CSV Veri Yönetimi/g) || []).length === 1);
t("ayarTab çıktısında 'NaN' YOK", !/\bNaN\b/.test(ayar));
t("bölüm HTML'i önizlemesiz iken SAF (2 çağrı birebir)", api.bolum() === api.bolum());
t("dosya input sözleşmesi (id=disListeInput · accept=.csv,text/csv · disListeTetik)", api.bolum().includes('id="disListeInput"') && api.bolum().includes('accept=".csv,text/csv"') && api.bolum().includes("disListeTetik(this)"));
t("'İçe Aktar' + 'Geri Al' butonları bağlı (disListeUygula · csvGeriAl)", api.bolum().includes("disListeUygula()") && api.bolum().includes("csvGeriAl()"));

/* ================= 11) disListeTetik (csvDosyalarOku + csvParse) yolu ================= */
console.log("11) disListeTetik yolu:");
const inp = { files: [{ name: "liste.csv", _metin: "Ad,Soyad,Sinif,Ogrenci_Ceptel,Veli_Ceptel\nTetik,Ogrenci,12 SAY 1,,\n" }], value: "x" };
api.tetik(inp);
t("disListeTetik → dosya okuma + önizleme kuruldu (Yeni satır)", !!api.durum() && api.durum().satirlar.length === 1 && api.durum().satirlar[0].durum === "yeni");
api.vazgec();
t("Vazgeç önizlemeyi temizler", api.durum() === null);

/* ================= 12) Süit kaydı ================= */
console.log("12) Süit kaydı:");
t("ks-dis-liste.mjs test.mjs'te tam 1 kez", (readFileSync("test.mjs", "utf8").match(/ks-dis-liste\.mjs/g) || []).length === 1);

console.log(fail ? "\nKIRMIZI TEST VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
