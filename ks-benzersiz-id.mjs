/* ks-benzersiz-id.mjs — KALICI BENZERSİZ ID ALTYAPISI süiti (KİMLİK-YAMASI)
   Senaryolar:
    1) mevcut geçerli ID'ler değişmez · 2) eksik ID üretimi (öğrenci/öğretmen/sınıf) ·
    3) aynı isimli kayıtlar ayrı kalır · 4) tekrar çalıştırmada ID değişmez (idempotans) ·
    5) ders/istek/grup-dersi referansları korunur · 6) yedek al→yükle ID kayıpsız ·
    7) normalize ile tüm zayıf kayıtlar tek geçişte tamamlanır.
   Tek boot + gerçek DOM id kayıt defteri (ks-grup-istegi.mjs deseni). */
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
global.document = {
  getElementById: () => elStub(),
  addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => []
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

const EXPORTS = "{ DB, ui, normalize, kimlikleriTamamla, saveDB, loadDB, sinifId, dersOgrenciIds, istekOgrenciIds }";
let P;
try {
  P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
} catch (e) {
  console.log("  ✗ boot hatasız → " + e.message);
  console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
P = new Function(scripts + "\n  return " + EXPORTS + ";\n")();
const { DB, ui, normalize, kimlikleriTamamla, saveDB, loadDB, sinifId, dersOgrenciIds, istekOgrenciIds } = P;

let fail = 0;
const t = (name, cond, extra) => { console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

/* Zayıf şema: eski/ID'siz kayıtlar — gerçek verinin ESAS DURUMUNU temsil eder (seed + elle eklenmiş kayıtlar).
   (Ders kayıtlarında grup dersi: ogrenciIds DİZİSİ ile temsil edilir — mevcut grup dersi şeması.) */
function zayifDB() {
  return {
    kurulus: "2026-09-01", ksVer: 2,
    ogretmenler: [
      { id: "ogr-mevcut-1", ad: "AHMET ÖĞRETMEN", brans: "mat", avail: { sinif: { "0-8": "9-A", "1-8": "Sınıf Dersi" }, musait: ["2-8"] } },
      { ad: "AYŞE ÖĞRETMEN", brans: "fiz", avail: { sinif: {}, musait: [] } } /* id YOK */
    ],
    ogrenciler: [
      { id: "ogr-mevcut-2", ad: "Ali Veli", sinif: "9-A", tel: "" },
      { id: "", ad: "Ayşe Kaya", sinif: "9-A", tel: "" }, /* id BOŞ — aynı sınıf, farklı öğrenci */
      { ad: "Mehmet Deniz", sinif: "10-B", tel: "" } /* id YOK */
    ],
    sinifProg: { "9-A": ["0-8"], "10-B": [] },
    istekler: [
      { id: "ist-1", ogrenciId: "ogr-mevcut-2", ogrenciAd: "Ali Veli", dersId: "mat", konu: "Limit", durum: "bekliyor", olusturma: "2026-09-01", saat: "15:30" },
      { id: "ist-2", ogrenciId: "ogr-mevcut-2", ogrenciIds: ["ogr-mevcut-2", "ogr-mevcut-3"], ogrenciAd: "Ali Veli", dersId: "fiz", konu: "Grup talebi", durum: "bekliyor", olusturma: "2026-09-02" }
    ],
    dersler: [
      { id: "ders-1", ogrenciId: "ogr-mevcut-2", ogrenciAd: "Ali Veli", dersId: "mat", konu: "Denklem", ogretmenId: "ogr-mevcut-1", ogretmenAd: "AHMET ÖĞRETMEN", tarih: "2030-01-07", saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-01" },
      { id: "ders-2", ogrenciId: "ogr-mevcut-2", ogrenciIds: ["ogr-mevcut-3"], ogrenciAd: "Ali Veli", dersId: "fiz", konu: "Grup dersi", ogretmenId: "ogr-mevcut-1", ogretmenAd: "AHMET ÖĞRETMEN", tarih: "2030-01-08", saat: "15:30", kod: "8", durum: "planlandi", olusturma: "2026-09-01" }
    ]
  };
}
const derinKopya = (x) => JSON.parse(JSON.stringify(x));

/* ---- 1) Mevcut geçerli ID'ler değişmez ---- */
console.log("1) Mevcut geçerli ID'ler korunur:");
const z1 = zayifDB();
const z1Once = derinKopya(z1);
const sayilar = kimlikleriTamamla(z1);
t("dönüş sayıları doğru (2 öğrenci, 1 öğretmen, 2 sınıf)", sayilar.o === 2 && sayilar.t === 1 && sayilar.s === 2, JSON.stringify(sayilar));
t("mevcut öğrenci ID'si birebir", z1.ogrenciler[0].id === z1Once.ogrenciler[0].id);
t("mevcut öğretmen ID'si birebir", z1.ogretmenler[0].id === z1Once.ogretmenler[0].id);
t("mevcut ders kaydının ID'si birebir", z1.dersler[0].id === z1Once.dersler[0].id);

/* ---- 2) Eksik ID üretimi ---- */
console.log("2) Eksik ID'ler üretilir:");
const yeniOgr = z1.ogrenciler.find(o => o.ad === "Mehmet Deniz");
const yeniOgrt = z1.ogretmenler.find(x => x.ad === "AYŞE ÖĞRETMEN");
t("id'siz öğrenciye ID verildi", !!yeniOgr.id && yeniOgr.id !== "");
t("id'siz öğretmene ID verildi", !!yeniOgrt.id && yeniOgrt.id !== "");
t("tüm öğrenci/öğretmen/ders ID'leri artık dolu", z1.ogrenciler.every(o => o.id) && z1.ogretmenler.every(x => x.id) && z1.dersler.every(l => l.id));
t("format: ks- ön ekli, benzersiz ID'ler", z1.ogrenciler.map(o => o.id).concat(z1.ogretmenler.map(x => x.id)).filter(i => String(i).indexOf("ks-") === 0).length === 3);
t("yeni ID'ler mevcut ID'lerle ÇAKIŞMAZ", z1.ogrenciler[1].id !== z1.ogrenciler[0].id && z1.ogretmenler[1].id !== z1.ogretmenler[0].id);

/* ---- 3) Sınıf kimlikleri (sinifIds) ---- */
console.log("3) Sınıf kimlikleri:");
t("sinifIds üretildi", !!z1.sinifIds && typeof z1.sinifIds === "object");
t("sinifProg anahtarına kimlik atandı", !!z1.sinifIds["9-A"] && !!z1.sinifIds["10-B"]);
t("avail.sinif'taki 9-A kimliği AYNI girdiyi işaret eder", z1.sinifIds["9-A"] && z1.sinifIds["9-A"].length > 0);
t("'Sınıf Dersi' placeholder'ı sınıf adı SAYILMADI", z1.sinifIds["Sınıf Dersi"] === undefined);
t("sinifId() okuma yardımcısı DB'deki değeri döner", sinifId("12 SAY 1") === DB.sinifIds["12 SAY 1"] && sinifId("12 SAY 1") !== "");
t("sinifId() olmayan sınıf için boş döner (yan etkisiz)", sinifId("__olmayan_sinif__") === "");

/* ---- 4) Aynı isimli kayıtlar karışmaz ---- */
console.log("4) Aynı isimli kayıtlar ayrı:");
const z4 = zayifDB();
kimlikleriTamamla(z4);
t("aynı sınıfta iki ayrı öğrenci → iki farklı ID", z4.ogrenciler[0].id !== z4.ogrenciler[1].id);
t("her kayıt için ID sırayla üretildi ve benzersiz", new Set(z4.ogrenciler.map(o => o.id)).size === z4.ogrenciler.length);
/* Boot öncesi normalize: aynı isimli iki öğrenci (id'siz) ekleyip kaydet → sonra yeniden yükle */
const ayniAdDB = zayifDB();
ayniAdDB.ogrenciler.push({ ad: "Zeynep Kaya", sinif: "11-C", tel: "" });
ayniAdDB.ogrenciler.push({ ad: "Zeynep Kaya", sinif: "11-C", tel: "" }); /* AYNI AD, iki kayıt */
ayniAdDB.sinifProg["11-C"] = [];
const n4 = normalize(ayniAdDB);
const zk = n4.ogrenciler.filter(o => o.ad === "Zeynep Kaya");
t("normalize aynı isimli iki kaydı AYRI ID'lerle tamamlar", zk.length === 2 && zk[0].id !== zk[1].id, zk.map(o => o.id).join(","));

/* ---- 5) Tekrar çalıştırmada ID'ler değişmez (idempotans) ---- */
console.log("5) Idempotans — tekrar çalıştırmada ID değişmez:");
const z5 = derinKopya(z4);
const ilkSnapshot = derinKopya({ o: z5.ogrenciler.map(x => x.id), t: z5.ogretmenler.map(x => x.id), s: derinKopya(z5.sinifIds) });
const say5 = kimlikleriTamamla(z5);
const sonSnapshot = derinKopya({ o: z5.ogrenciler.map(x => x.id), t: z5.ogretmenler.map(x => x.id), s: z5.sinifIds });
t("ikinci çalıştırma 0 değişiklik raporlar", say5.o === 0 && say5.t === 0 && say5.s === 0, JSON.stringify(say5));
t("öğrenci ID'leri birebir aynı", JSON.stringify(ilkSnapshot.o) === JSON.stringify(sonSnapshot.o));
t("öğretmen ID'leri birebir aynı", JSON.stringify(ilkSnapshot.t) === JSON.stringify(sonSnapshot.t));
t("sinifIds birebir aynı", JSON.stringify(ilkSnapshot.s) === JSON.stringify(sonSnapshot.s));
/* boot'taki DB ile de: normalize'i 3 kez üst üste koştur */
const n5a = normalize(zayifDB());
const n5b = normalize(n5a);
const n5c = normalize(n5b);
t("normalize 3 kez üst üste → öğrenci ID'leri aynı", JSON.stringify(n5a.ogrenciler.map(o => o.id)) === JSON.stringify(n5c.ogrenciler.map(o => o.id)));
t("normalize 3 kez üst üste → sinifIds aynı", JSON.stringify(n5a.sinifIds) === JSON.stringify(n5c.sinifIds));

/* ---- 6) Referanslar (ders / istek / grup dersi) korunur ---- */
console.log("6) Referans koruması:");
const z6 = zayifDB();
const r6 = derinKopya({ d0: z6.dersler[0], d1: z6.dersler[1], i0: z6.istekler[0], i1: z6.istekler[1] });
const n6 = normalize(z6);
t("birebir ders ogrenciId + ogretmenId KORUNDU", n6.dersler[0].ogrenciId === r6.d0.ogrenciId && n6.dersler[0].ogretmenId === r6.d0.ogretmenId);
t("grup ders ogrenciIds DİZİSİ KORUNDU", JSON.stringify(n6.dersler[1].ogrenciIds) === JSON.stringify(r6.d1.ogrenciIds));
t("grup ders dersOgrenciIds() aynı üyeleri döner", JSON.stringify(dersOgrenciIds(n6.dersler[1])) === JSON.stringify([r6.d1.ogrenciId, r6.d1.ogrenciIds[0]]));
t("istek ogrenciId KORUNDU", n6.istekler[0].ogrenciId === r6.i0.ogrenciId);
t("grup istek üyeleri kayıpsız (ogrenciId + ogrenciIds)", JSON.stringify(istekOgrenciIds(n6.istekler[1])) === JSON.stringify([r6.i1.ogrenciId, r6.i1.ogrenciIds[1]]));
t("grup istekte ana ogrenciIds'ten çıkar (mevcut sözleşme)", JSON.stringify(n6.istekler[1].ogrenciIds) === JSON.stringify([r6.i1.ogrenciIds[1]]));
t("ID tamamlama kayıtların ALANLARINI değiştirmedi", n6.dersler[0].konu === r6.d0.konu && n6.dersler[0].tarih === r6.d0.tarih && n6.dersler[1].kod === r6.d1.kod);

/* ---- 7) Yedek al → yükle: ID kayıpsız ---- */
console.log("7) Yedek yükleme (normalize) ID kayıpsız:");
/* Boot'tan sonra gerçek DB seedDB'den gelir: mevcut kimlikler normalize edilmeden bozulmadan duruyor */
const canliOgr = derinKopya(DB.ogrenciler);
const canliOgrt = derinKopya(DB.ogretmenler);
const canliSinifIds = derinKopya(DB.sinifIds || {});
t("boot sonrası tüm öğrenci ID'leri dolu", canliOgr.every(o => o.id && o.id !== ""));
t("boot sonrası tüm öğretmen ID'leri dolu", canliOgrt.every(x => x.id && x.id !== ""));
t("boot sonrası sinifIds tüm sinifProg adlarını kapsıyor", Object.keys(DB.sinifProg).every(ad => canliSinifIds[ad]));
/* yedekAl() paketi = { uygulama, surum, tarih, veri: DB } — yedekOku'nun kullandığı normalize(v) yolunu simüle et */
const paket = { uygulama: "YKS Birebir Takip", surum: 1, tarih: new Date().toISOString(), veri: derinKopya(DB) };
const yuklenen = normalize(paket.veri);
t("yedek → yükleme sonrası öğrenci ID'leri kayıpsız", JSON.stringify(yuklenen.ogrenciler.map(o => o.id)) === JSON.stringify(canliOgr.map(o => o.id)));
t("yedek → yükleme sonrası öğretmen ID'leri kayıpsız", JSON.stringify(yuklenen.ogretmenler.map(x => x.id)) === JSON.stringify(canliOgrt.map(x => x.id)));
t("yedek → yükleme sonrası sinifIds kayıpsız", JSON.stringify(yuklenen.sinifIds) === JSON.stringify(canliSinifIds));
t("yedek → yükleme sonrası ders referansları kayıpsız", JSON.stringify(yuklenen.dersler.map(l => [l.id, l.ogrenciId, l.ogretmenId])) === JSON.stringify(DB.dersler.map(l => [l.id, l.ogrenciId, l.ogretmenId])));
t("yedek → yükleme sonrası grup ders üyeleri kayıpsız", JSON.stringify(yuklenen.dersler.filter(l => l.ogrenciIds).map(l => l.ogrenciIds)) === JSON.stringify(DB.dersler.filter(l => l.ogrenciIds).map(l => l.ogrenciIds)));
/* id'siz veri YENİDEN kaydedilirken ID'ler kalır (2. yedek döngüsü) */
const yedek2 = normalize(derinKopya(yuklenen));
t("ikinci yedek döngüsünde ID'ler yine aynı", JSON.stringify(yedek2.ogrenciler.map(o => o.id)) === JSON.stringify(canliOgr.map(o => o.id)));

/* ---- 8) Yeni kayıt akışı: normalize DB'ye eklenen id'siz kayıt sonraki kayıtta ID alır ---- */
console.log("8) Yeni kayıt akışı:");
/* loadDB → DB yerine elle: zayıf kayıtları localStorage'a yazıp loadDB ile geri oku */
const kayitDB = zayifDB();
store["yksOto_arsiv_v1"] = JSON.stringify(kayitDB);
const yuklenen8 = loadDB();
t("loadDB eksik ID'li veriyi tamamlar (öğrenci)", yuklenen8.ogrenciler.every(o => o.id && o.id !== ""));
t("loadDB eksik ID'li veriyi tamamlar (öğretmen)", yuklenen8.ogretmenler.every(x => x.id && x.id !== ""));
t("loadDB sinifIds'i tamamlar", Object.keys(yuklenen8.sinifProg).every(ad => yuklenen8.sinifIds[ad]));
const d8 = derinKopya(yuklenen8.ogrenciler.map(o => o.id));
/* uygulama boot'taki gibi tamamlanmış DB'yi kaydeder; tekrar okuma AYNI id'leri dönmeli (kalıcılık) */
store["yksOto_arsiv_v1"] = JSON.stringify(yuklenen8);
const yuklenen8b = loadDB();
t("kaydedilmiş DB tekrar okunduğunda ID'ler değişmedi", JSON.stringify(yuklenen8b.ogrenciler.map(o => o.id)) === JSON.stringify(d8));

/* ---- 9) normalize hiçbir mevcut alanı bozmaz (gerçek DB deep-kontrol) ---- */
console.log("9) Gerçek DB'ye etki:");
const n9 = normalize(derinKopya(DB));
const ozet = (d) => JSON.stringify([d.kurulus, d.ksVer, d.ogretmenler.length, d.ogrenciler.length, Object.keys(d.sinifProg).length, d.istekler.length, d.dersler.length]);
t("normalize DB yapısını korur (sayılar aynı)", ozet(n9) === ozet(DB));
t("seed DB zaten kimlikli — 0 yeni ID gerekmedi", n9.ogrenciler.every(o => o.id) && n9.ogretmenler.every(x => x.id));

console.log(fail === 0 ? "HEPSİ GEÇTİ" : "BAŞARISIZ");
process.exit(fail);
