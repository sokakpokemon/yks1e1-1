// ks-cp-d56-gorsel-onay.mjs
// D56 görsel onayının kapanışını ARSIV-2 + CHECKPOINT özetine yazar.
//
// GERÇEK (kullanıcı beyanı, 2026-10-04): "Preview'da baktım, görsel kontrol yapıldı."
//   → görsel kontrol YAPILDI (Preview / dev), TEMİZ.
//   → publish EDİLMEDİ. Yayın iddiası bilinçli olarak yazılmaz.
//
// İDEMPOTENS: marker `D56-GORSEL-ONAY-TAMAM` varsa no-op exit 0.
// Yedek: yalnızca YOKSA oluşturulur (var olan yedeğin üzerine yazılmaz).

import fs from "node:fs";

const ARSIV = "CHECKPOINT-ARSIV-2.md";
const CP = "CHECKPOINT.md";
const BAK_A = ARSIV + ".d56-onay-oncesi.bak";
const BAK_C = CP + ".d56-onay-oncesi.bak";
const MARK = "D56-GORSEL-ONAY-TAMAM";

function yedekAl(dosya, yedek) {
  if (fs.existsSync(yedek)) {
    console.log("YEDEK ATLANDI (zaten var, üzerine yazılmadı): " + yedek);
    return;
  }
  fs.copyFileSync(dosya, yedek);
  console.log("YEDEK ALINDI: " + yedek);
}

let arsiv = fs.readFileSync(ARSIV, "utf8");
let cp = fs.readFileSync(CP, "utf8");

// ---------- IDEMPOTENS ----------
if (arsiv.includes(MARK)) {
  console.log("NO-OP: " + MARK + " mevcut — kayıt zaten kapanmış, dokunulmadı.");
  process.exit(0);
}

// ---------- YEDEKler ----------
yedekAl(ARSIV, BAK_A);
yedekAl(CP, BAK_C);

// ---------- YENİ METİNLER ----------
const ESKI_DURUM =
  "**Tarih:** 2026-10-04 · **Durum:** ✅ Kapandı — kapı zinciri tam yeşil; publish EDİLMEDİ, canlı görsel kontrol YAPILAMADI (ortamda renderer yok).";
const YENI_DURUM =
  "**Tarih:** 2026-10-04 · **Durum:** ✅ Kapandı — kapı zinciri tam yeşil; publish EDİLMEDİ; görsel kontrol KULLANICI TARAFINDAN Preview'da yapıldı ve TEMİZ (bkz. §6).";

const ESKI_S6 = `### 6) CANLI DOĞRULAMA — YAPILAMADI (renderer yok)
- Bu turda publish YAPILMADI ve ortamda tarayıcı/renderer BULUNMADI; bar'ın görünümü,
  aktif vurgu ve waGunSec TIKLAMASI gözle doğrulanmadı. Kapılar yalnız ÜRETİLEN veriyi
  (HTML metni + filtre kümesi) doğrular; tıklama davranışının kalıcı kapısı YOKTUR.
- Kapı düzeyinde doğrulanan: 3 buton üretimi, tam 1 aktif düğme, waAc'nin #waGunBar'ı
  yeniden çizmesi, Bugün/Yarın filtrelerinin iptal elemesi ve gün eşitliği.
- Bu turda kullanıcıya 'göründü/düzeldi' DENMEDİ; publish sonrası görsel onay AÇIK kaldı.`;

const YENI_S6 = `### 6) CANLI DOĞRULAMA — KULLANICI GÖZÜYLE YAPILDI (Preview)
- Kullanıcı beyanı (2026-10-04): "Preview'da baktım, görsel kontrol yapıldı."
  Buna göre #waGunBar bar'ının görünümü, aktif düğme vurgusu ve TIKLAMA akışı
  (Tümü / Bugün / Yarın → waGunSec) kullanıcı tarafından gözle kontrol EDİLDİ ve TEMİZ
  bulundu → bu kayıtta AÇIK kalan görsel onay maddesi KAPANDI.
- publish EDİLMEDİ: kullanıcı kontrolü yalnız PREVIEW (dev) üzerinde yaptığını belirtti;
  yayın (publish) yapılmadığı bu kayda ÖZENLE yazıldı. Bu turda production build çıktısı
  alınamadığı için yayın iddiası KANITSIZ olurdu ve yazılmadı.
- Dürüstlük notu: ortamda renderer YOKTUR; yukarıdaki onay BENİM gözlemim değil,
  kullanıcının beyanıdır. Kapıların kapsamı DEĞİŞMEDİ — aşağıdaki kapı düzeyi kanıtlar
  geçerlidir ve tıklama için kalıcı regresyon kapısı hâlâ YOKTUR (bkz. 7-b).
- Kapı düzeyinde doğrulanan (aynen): 3 buton üretimi, tam 1 aktif düğme, waAc'nin #waGunBar'ı
  yeniden çizmesi, Bugün/Yarın filtrelerinin iptal elemesi ve gün eşitliği.
<!-- ${MARK} — yukarıdaki maddeler kapanış kaydının son hâlidir; elle geri almayın. -->`;

const ESKI_7B =
  "- (b) Tıklama (waGunSec) ve bar görünümü tarayıcıda DOĞRULANMADI (ortamda renderer yok); bu yüzden kalıcı tıklama kapısı da eklenmedi.";
const YENI_7B =
  "- (b) Tıklama (waGunSec) ve bar görünümü KULLANICI TARAFINDAN Preview'da gözle onaylandı (2026-10-04 beyanı — renderer'ım yok, bu benim gözlemim değildir). Buna rağmen tıklama davranışının kalıcı regresyon kapısı hâlâ YOKTUR; kapılar yalnız üretilen veriyi doğrular.";

const ESKI_7E = `      (özgün hâli üç geçişten dolayı guard'ı kaçırıp yazma sonrası exit 1 veriyordu) ve
      yayın/görsel-doğrulama iddiaları gerçeğe çevrildi.`;
const YENI_7E = `      (özgün hâli üç geçişten dolayı guard'ı kaçırıp yazma sonrası exit 1 veriyordu) ve
      yayın/görsel-doğrulama iddiaları gerçeğe çevrildi. Bu kapanış kaydı da AYNI ilkeyle
      yazıldı: tarih 2026-10-04'te geriye gitmedi, publish iddiası EKLENMEDİ, §6 ile §7
      birbiriyle çelişmiyor, açık kalemdeki görsel onay maddesi gerçeğe göre kapandı.`;

const ACIK_KALEM_0 = `- (0) D56 publish sonrası GÖRSEL ONAY — renderer yok; kullanıcı publish edip bar'ı ve
      tıklama akışını gözle kontrol etmeli.
`;

const ESKI_CP =
  "kapı zinciri YEŞİL · publish/görsel kontrol YAPILMADI (renderer yok) · Tam kayıt: CHECKPOINT-ARSIV-2.md";
const YENI_CP =
  "kapı zinciri YEŞİL · publish EDİLMEDİ · görsel kontrol kullanıcı tarafından Preview'da yapıldı, TEMİZ · Tam kayıt: CHECKPOINT-ARSIV-2.md";

// ---------- ANCHOR DOĞRULAMA (fail-fast, tekil olmalı) ----------
function tekil(haystack, ihtiyac, etiket) {
  const n = haystack.split(ihtiyac).length - 1;
  if (n !== 1) {
    console.error("ANCHOR FAIL [" + etiket + "]: " + n + " eşleşme (1 bekleniyordü). YAZILMADI.");
    process.exit(1);
  }
}

tekil(arsiv, ESKI_DURUM, "durum satırı");
tekil(arsiv, ESKI_S6, "§6 blok");
tekil(arsiv, ESKI_7B, "§7(b)");
tekil(arsiv, ESKI_7E, "§7(e)");
tekil(arsiv, ACIK_KALEM_0, "AÇIK KALEMLER (0)");
tekil(cp, ESKI_CP, "CHECKPOINT D56 özeti");

arsiv = arsiv.replace(ESKI_DURUM, YENI_DURUM);
arsiv = arsiv.replace(ESKI_S6, YENI_S6);
arsiv = arsiv.replace(ESKI_7B, YENI_7B);
arsiv = arsiv.replace(ESKI_7E, YENI_7E);
arsiv = arsiv.replace(ACIK_KALEM_0, "");
cp = cp.replace(ESKI_CP, YENI_CP);

console.log("Değişimler uygulandı (6 nokta).");

// ---------- POST-KONTROL (yazmadan önce) ----------
const hatalar = [];
if (!arsiv.includes(YENI_DURUM)) hatalar.push("yeni durum satırı yok");
if (!arsiv.includes(MARK)) hatalar.push("marker yok");
if (arsiv.includes("publish EDİLMEDİ, canlı görsel kontrol YAPILAMADI"))
  hatalar.push("ESKİ durum satırı hâlâ duruyor");
if (arsiv.includes("### 6) CANLI DOĞRULAMA — YAPILAMADI"))
  hatalar.push("ESKİ §6 başlığı hâlâ duruyor");
if (arsiv.includes("DOĞRULANMADI (ortamda renderer yok)"))
  hatalar.push("ESKİ §7(b) hâlâ duruyor");
if (arsiv.includes("görsel onay AÇIK kaldı"))
  hatalar.push("ESKİ 'görsel onay AÇIK kaldı' notu hâlâ duruyor");
if (arsiv.includes("- (0) D56 publish sonrası GÖRSEL ONAY"))
  hatalar.push("AÇIK KALEMLER (0) kalkmadı");
if (arsiv.includes("YAYIN/görsel-doğrulama")) hatalar.push("bayat ifade kaldı");
if (!cp.includes(YENI_CP)) hatalar.push("CHECKPOINT.md D56 özeti güncellenmedi");
if (cp.includes(ESKI_CP)) hatalar.push("CHECKPOINT.md ESKİ özet hâlâ duruyor");
if (!arsiv.includes("**Tarih:** 2026-10-04")) hatalar.push("D56 kaydı tarihi 2026-10-04 DEĞİL (geriye gidiyor)");
if (arsiv.includes("publish EDİLDİ")) hatalar.push("publish EDİLDİ iddiası kayda sızdı — kanıtsız, olmamalı");

if (hatalar.length) {
  console.error("POST-KONTROL FAIL — YAZILMADI:\n - " + hatalar.join("\n - "));
  process.exit(1);
}

// ---------- YAZ ----------
fs.writeFileSync(ARSIV, arsiv);
fs.writeFileSync(CP, cp);
console.log("YAZILDI: " + ARSIV + " + " + CP + " (görsel onay kapandı, publish iddiası YOK)");