/* ks-cp-append-d41-d42.mjs — D41 (Telefonsuz Öğrenciler / WA) + D42 (D41 regresyon onarımı)
   KAPANIŞ KAYDI ekleyici (assert'li, idempotent).
   Neden ayrı script: CHECKPOINT.md 340 KB+ ve düzenleyici penceresinin dışında kalıyor.
   Yerleşim: HIZ PROTOKOLÜ / JET 2.0 / LOGO KİLİDİ bloğunun ardına, kapanış kayıtlarının
   EN ÜSTÜNE (D39 kaydından hemen ÖNCE) — TEK ekleme, çift yok.
   Kayıt ZATEN VARSA tekrar eklemez; exit 2 ile reddeder.
   Uygulama kodu ve testlere DOKUNMAZ; yalnız CHECKPOINT.md yazar. */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const yol = "CHECKPOINT.md";
const YEDEK = "CHECKPOINT.md.d41-d42-kapanis-oncesi.bak";
const sha = (t) => createHash("sha256").update(t).digest("hex");

let s = readFileSync(yol, "utf8");
const onceki = sha(s);
const oncekiBayt = Buffer.byteLength(s, "utf8");

/* ---- 0) İDEMPOTANS KAPISI (önce) ---- */
if (s.includes("# ✅ KAPANIŞ KAYDI: D41 + D42")) {
  console.error("Zaten uygulanmış (D41 + D42 kapanış kaydı VAR).");
  process.exit(2);
}

/* ---- 1) ÇAPA: kapanış kayıtlarının en üstü = D39 başlığı ---- */
const CAPA = "---\n\n# ✅ KAPANIŞ KAYDI: D39 (Grup Üyesi Editöründe Öğrenci Arama) KAPANDI";
const capaSayi = s.split(CAPA).length - 1;
if (capaSayi !== 1) {
  console.error("ÇAPA " + capaSayi + " kez bulundu — beklenen TAM 1. DURDUM.");
  process.exit(1);
}

/* ---- 2) BÖLÜM ---- */
const BOLUM = [
  "# ✅ KAPANIŞ KAYDI: D41 + D42 (Telefonsuz Öğrenciler / WA Alıcı) KAPANDI",
  "",
  "**Tarih:** 29 Eylül 2026 · **Durum:** ✅ Kapandı — kullanıcı publish etti + canlı görsel doğrulama TEMİZ",
  "**Bu turda değişen tek dosya:** `CHECKPOINT.md` (uygulama kodu ve testler DEĞİŞMEDİ).",
  "",
  "*(Not: bu kayıt HIZ PROTOKOLÜ / JET 2.0 / LOGO KİLİDİ bloğunun hemen ardına, mevcut kapanış kayıtlarının EN ÜSTÜNE (D39'dan önce), TEK append olarak alındı — içerik birebir.)*",
  "",
  "## 1) D41 KEŞİF — telefon alanı ZATEN VAR (yeni UI gerekmedi)",
  "- Öğrenci ekleme: `#o-tel` (`app.js:1755`) · öğrenci düzenleme: `#d-tel` (`app.js:1701`) · anne/baba telefon alanları da mevcut.",
  "- Veri: `DB.ogrenciler[].tel` (`.telefon` DEĞİL); backfill `if (o.tel == null) o.tel = \"\";` (`app.js:590`); normalizasyon yok (`app.js:587`).",
  "- Tek çözücü: `waAliciBilgisi(ogrenciId, aliciTipi)` (`app.js:4606`) → `ogrenci→o.tel` · `anne→o.anneTel` · `baba→o.babaTel` · `ogretmen→t.tel`; dönüş `{ogrenci, tip, etiket, telefon, varMi}` — **fallback YOK**.",
  "- Gönderim: `waGonder(ogrenciId)` (`app.js:4741`) → `var a = waAliciBilgisi(...); if (!a.varMi) { toast(a.etiket + \" telefonu kayitli degil\", \"uyari\"); return; }` — kişi-bazlı, dokunulmadı.",
  "- Sonuç: UI zaten var ⇒ D41 adım (c) (yeni telefon girişi) UYGULANMADI.",
  "",
  "## 2) D41 UYGULAMA — ks-yama-d41-telefon.mjs",
  "- Script: `ks-yama-d41-telefon.mjs` (marker **D41-TELEFON**, idempotent; yedek `app.js.d41-telefon-oncesi.bak`).",
  "- TEK satır üreticisi eklendi: `waAliciSatirHTML(s, telVar)` (`app.js:4660`); telefonsuz ⇒ gül kurusu rozet **\"Telefon kayıtlı değil\"** + `disabled` Gönder butonu (`onclick=\"waGonder('id')\"` korunur, markup `data-wa-satir=\"<id>\"`).",
  "- `waAc` satır döngüsü artık bu üreticiyi çağırır (`app.js:4701`).",
  "- **ADIM 0 (yan iş):** `scripts/copy-static.mjs:29` → `HEDEFLER = [\"dist\", \"public\"]` (guard'ın `public/app.js` kontrolü artık yanlış alarm üretmez; 8 varlık × 2 hedef byte-birebir).",
  "- Diğer çağrı yerleri kişi-bazlı: kart butonu (`app.js:1681`) · `waSatir` (`app.js:4782`, `4785`).",
  "- **TOPLU/grup gönderim YOLU YOK** (tüm `waGonder` çağrıları kişi-bazlı).",
  "",
  "## 3) D41 SAYILAR / SHA",
  "- Toplam **2573 → 2580** (+7) · `ks-wa-alici.mjs` **49 → 56** (+7, bölüm 13) · süit sayısı **55 (DEĞİŞMEDİ)**.",
  "- `app.js` **`af149eedb804449c` → `52aff56fe86068c0`** (394014 B) · `ek-ders.js` **DEĞİŞMEDİ** (`3d2dd38ff517c64f…`).",
  "- Donmuş beşli (suit-manifest · elle-vaka-manifesti · elle-vaka-adlari · suit-vakalar/ks-wa-alici.mjs.txt · test.mjs suites) ELLE hizalandı.",
  "",
  "## 4) D41 TEYİDİ REGRESYON BULDU (kanıt: teyit adımı işe yarıyor)",
  "- Senaryo: **veli telefonu DOLU / öğrenci telefonu BOŞ** · satır durumu SEÇİLİ ALICIYI (`waAliciTipi`) yok sayıyordu (rozet/`disabled` yalnız `!!tel`'e bakıyordu) ve `waAliciDegistir` listeyi tazelemiyordu.",
  "- Sonuç: **alıcı=Anne/Baba iken satır yanlışlıkla `disabled`** ⇒ meşru veli gönderimi engellenirdi (D41 ÖNCESİ çalışıyordu). Ters yön de tutarsızdı.",
  "- **Eksik fixture:** \"veli dolu / öğrenci boş\" kombinasyonunu hiçbir donmuş vaka kapsamıyordu.",
  "",
  "## 5) D42 KEŞİF",
  "- `waAliciDegistir` (`app.js:4614`) yalnız panel + önizlemeyi güncelliyordu; listeyi tazelemiyordu ⇒ **bayat rozet KÖK NEDENİ**.",
  "- `waAc` (`app.js:4701`) satır durumu `!!tel` ⇒ D41 regresyonu.",
  "- **TOPLU gönderim YOK** ⇒ D42 adım 2(c) **N/A** (aşağıdaki dürüst nota bakınız).",
  "",
  "## 6) D42 UYGULAMA — ks-yama-d42-wa-alici-tip.mjs",
  "- Script: `ks-yama-d42-wa-alici-tip.mjs` (marker **D42-WA-ALICI-TIP**, idempotent; yedek `app.js.d42-wa-alici-tip-oncesi.bak`).",
  "- `var waSonDizi = []` (`app.js:4677`) — sayaç/seçim korunur.",
  "- `waAliciListeHTML(dizi)` (`app.js:4681`): satır durumu = `waAliciBilgisi(s.id, waAliciTipi).varMi`; dipnot \"Seçili alıcı için telefon kaydedilmedi…\".",
  "- `waAliciListeTazele()` (`app.js:4695`): **TEK** `innerHTML` + seçici çubuğu yeniden ekleme (modal yeniden AÇILMAZ, çift satır YOK).",
  "- `waAc` bu üreticiden çizer (`app.js:4726`); `waAliciDegistir` artık tazeler (`app.js:4616`).",
  "- **`waAliciTipi` reset YALNIZ** `waAc:4723` (liste çiziminden ÖNCE) + `waKapat:4741`; `waAliciListeTazele` tipi **SIFIRLAMAZ**.",
  "",
  "## 7) D42 SAYILAR / SHA",
  "- Toplam **2580 → 2586** (+6) · `ks-wa-alici.mjs` **56 → 62** (+6, bölüm 14) · süit sayısı **55 (DEĞİŞMEDİ)**.",
  "- `app.js` **`52aff56fe86068c0` → `231cf09fef286267`** (395111 B; sha256 `231cf09fef286267f6500de848ae9d000311da4d9ba9bbc4db9e18e3a177ed12`).",
  "- `ek-ders.js` **`3d2dd38ff517c64f…` DEĞİŞMEDİ** · **kök = public = dist = isolate byte-birebir** · damga **`app.js?v=231cf09fef286267`** · **publish-guard YEŞİL**.",
  "- Donmuş beşli ELLE hizalandı (62); D41 \"TEK üretici\" assertion'ı \"D41/D42: satır markup'ı TEK üreticiden (waAliciSatirHTML tanım 1 · tek çağrı waAliciListeHTML içinde)\" olarak `offsetDuzelt` ile yeniden adlandırıldı.",
  "",
  "## 8) KAPI (tek koşu)",
  "- `node hizli-test.mjs --tam` → **EXIT 0** · **55 süit** · **RUNNER 2586/2586 BİREBİR** · HAM Σ 5'li eşitlik · **TAMLIK 48/48**.",
  "- `node --check app.js` OK · `copy-static` → `publish-guard` YEŞİL · `bun run build` EXIT 0 (guard SON adım, yeşil).",
  "",
  "## 9) CANLI DOĞRULAMA",
  "- Kullanıcı publish etti; görsel kontrol **TEMİZ** — alıcı değişimi doğru: veli dolu/öğrenci boş ⇒ alıcı=Anne **ETKİN**, alıcı=Öğrenci **\"Telefon kayıtlı değil\" + kapalı**; ters yön de doğru; rozet anında güncelleniyor; diğer satırlar etkin ⇒ **KAPANDI**.",
  "",
  "## 10) DÜRÜST NOT",
  "- **(a)** D41 ilk turunda seçili-alıcı göz ardı edilerek regresyon üretildi; **teyit yakaladı, D42 onardı** — bu, \"teyit adımı gerçekten işe yarıyor\" kanıtıdır.",
  "- **(b)** TOPLU gönderim yolu hiç olmadığından \"telefonsuzu atla, diğerine devam et\" maddesi **N/A**; davranış kişi-bazlı rozet + `disabled` ile karşılanıyor.",
  "- **(c)** Eksik fixture **D42'de eklendi** (veli dolu/öğrenci boş + ters yön).",
  "",
  "## 11) AÇIK KALEMLER",
  "- **(a)** TOPLU telefon girişi (Excel/paste) — kapsam dışı bırakıldı, **ayrı tur önerisi**.",
  "- **(b)** LOGO ince ayarı — **ASKIDA** (kullanıcı ölçek kararı bekliyor; LOGO KİLİDİ'ne tabi).",
  "- **(c)** Kart emoji zenginleştirme — **ASKIDA** (kullanıcı isteğiyle).",
  "- **(d)** Repo hijyeni (`.bak` / `ks-yama-d3x` / mutasyon artıkları) + `/tmp` arşivi — **sırada**.",
].join("\n");

/* ---- 3) TEK EKLEME (D39'dan hemen önce) ---- */
s = s.replace(CAPA, BOLUM + "\n\n" + CAPA);

const sonraki = sha(s);
const sonrakiBayt = Buffer.byteLength(s, "utf8");

/* ---- 4) YEDEK (yalnız BİR kez) ---- */
if (!existsSync(YEDEK)) copyFileSync(yol, YEDEK);
else console.log("Yedek zaten var, üzerine yazılmadı: " + YEDEK);

writeFileSync(yol, s);
console.log("ÖNCE  : " + onceki.slice(0, 12) + " · " + oncekiBayt + " B");
console.log("SONRA : " + sonraki.slice(0, 12) + " · " + sonrakiBayt + " B (+" + (sonrakiBayt - oncekiBayt) + ")");
console.log("YAZILDI: " + yol + " (tek ekleme, D39'un öncesine).");
