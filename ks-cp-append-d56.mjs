/* ks-cp-append-d56.mjs — D56 KAPANIŞ KAYDI (ROLLING: arşiv → doğrula → demote)
   Idempotent: her adım kendi guard'ına sahip; eksik anchor → YAZMADAN exit 1 + bağlam.

   D56-DÜZELTME (2 düzeltme, içerik değişikliği YAPMADAN önce uygulandı):
     (1) D36H eşleşmesi satır-bazlı YAPILDI. Özgün sürüm `say(cp, D36H) === 1`
         diyordu; ama CHECKPOINT.md'de D36H ÜÇ yerde geçiyor (L208 madde işareti,
         L533 gerçek başlık, L662 tablo satırı "L385 | # ✅ ..."), bu yüzden guard
         HİÇ true olmuyor → demote atlanıyor → sondaki "!== 0" doğrulaması exit 1
         veriyor; yani ARSIV-2 ve CHECKPOINT.md YAZILDIKTAN SONRA patlıyordu.
         Artık YALNIZ tam satır (l.trim() === D36H) sayılır → L533 tek eşleşme.
         L208/L662 atıfları korunur (onlar blok değil, referans satırı).
     (2) DOĞRULAMA İDDİALARI DÜZELTİLDİ: özgün metin "publish EDİLDİ / canlı
         görsel kontrol TEMİZ / tarayıcıda gözle doğrulandı" diyordu. Bu turda
         publish YAPILMADI ve ortamda renderer YOK; gözsel doğrulama YAPILAMADI.
         Arşiv yanlış tamamlanma kaydına dönüşmesin diye metin düzeltildi. */
import { readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from "node:fs";

const H56A = "## ✅ KAPANIŞ KAYDI: D56 (WA BUGÜN/YARIN FİLTRESİ) KAPANDI";
const D36H = "# ✅ KAPANIŞ KAYDI: D36-BOS-AD-KILIT KAPANDI";
const OZET = "- **D56** — WA modal Bugün/Yarın/Tümü alıcı filtresi (waGunKaynak/waGunBarHTML/waGunSec · D25/D41/D42 dokunulmadı) · ks-wa-alici 62→69 · toplam 2599→2606 · app.js 9a88f38c→5c76ba2e · kapı zinciri YEŞİL · publish/görsel kontrol YAPILMADI (renderer yok) · Tam kayıt: CHECKPOINT-ARSIV-2.md";

const KAYIT = [
H56A, "",
"**Tarih:** 2026-10-04 · **Durum:** ✅ Kapandı — kapı zinciri tam yeşil; publish EDİLMEDİ, canlı görsel kontrol YAPILAMADI (ortamda renderer yok).",
"",
"### 1) KEŞİF (dosya:satır, salt-okuma)",
"- app.js: todayKey 203 · addDaysKey 205 · penceredeDersler 1046 · waAliciSatirHTML 4661 · waAliciListeHTML 4681 · waAliciListeTazele 4695 · waAc 4702 · bugunTarih/yarinTarih 3479-3480 (mevcut Bugün/Yarın deseni).",
"- index.html: #waModal 309 · #waAlt 317 · #waIcerik 322 · #waOnizlemePanel 324.",
"",
"### 2) UYGULAMA — ks-yama-d56-wa-filtre.mjs (marker D56-WA-GUN-FILTRE · idempotent: 2. koşu no-op exit 2 · 5 anchor fail-fast: tutmazsa YAZMADAN exit 1 + bağlam)",
"- Yeni: waGunKaynak() — bugun: penceredeDersler + durum!=='iptal' + tarih===todayKey(); yarin: addDaysKey(todayKey(),1); tumu: null (pencere genişletilmez).",
"- waAc kaynak: (waGunKaynak() || penceredeDersler()) — sayaç/sıralama/TEK üretici (waAliciListeHTML) AYNI kod.",
"- waGunBarHTML() — 3 buton (Tümü/Bugün/Yarın), aktif teal; waGunSec(g) — ui.waGun + waAc(); waAlt şablonuna ' · Bugün/Yarın' eki.",
"- index.html: #waGunBar boş kapsayıcı (#waIcerik öncesi; waAc her açılışta doldurur) + damga güncelleme.",
"- Kopyalar: public/app.js · dist/app.js · isolate/app.js · dist/index.html · isolate/index.html.",
"- DOKUNULMADI: D25 mesaj şablonu (ogrenciMesajMetni) · D41/D42 alıcı satırı + waAliciBilgisi/waGonder çözücü yolu · TEK önizleme paneli · ek-ders.js · vendor.",
"",
"### 3) KAPI — ks-wa-alici.mjs 62 → 69 (+7 D56 kapısı: waGunBar TEK · tumu→null · 3 seçenek · tam 1 aktif · waAc bar'ı yeniden çizer · Bugün filtre yalnız bugünkü planlı · Yarın filtre)",
"- Toplam: 2599 → 2606 · 55 süit · HAM Σ beşli 2606 BİREBİR · TAMLIK 48/48 · node hizli-test.mjs --tam EXIT 0.",
"- 3 kırılma — hepsi kökten düzeltildi, hiçbiri bastırılmadı: (a) ks-wa-alici regex kapısı gevşetilmedi, D56 biçimine SIKILAŞTIRILDI; (b) ks-kart-kolon donmuş offset kapa 19809 → 19937 (projenin offsetDuzelt mekanizması); (c) ELLE push bloğu sarmalayıcı sonuna taşındı (D41/D42 deseni; base 0 D56 girdisi).",
"",
"### 4) SHA / DAMGA",
"- app.js: 9a88f38c259e076b → 5c76ba2ea685fea9 · damga index.html+dist+isolate app.js?v=5c76ba2ea685fea9 (üçünde 1×) · kök=public=dist=isolate.",
"- ek-ders.js 3d2dd38ff517c64f DEĞİŞMEDİ · publish-guard YEŞİL.",
"",
"### 5) YAN İŞ — vite.config.ts",
"- Ölü manualChunks bloğu kaldırıldı: build ~4.8s → ~1.5s; 6 adet 1-bayt boş chunk ve 'Generated an empty chunk' uyarıları ortadan kalktı. tsc -b --noEmit EXIT 0 · temiz vite build ✓ · postbuild copy-static 8/8 byte-birebir · guard YEŞİL.",
"- Test zinciri (test.mjs/hizli-test/statik/suit-manifest/elle-*) vite.config.ts OKUMUYOR → 2599 kapı sonucu geçerli kaldı. server/hmr bloğu dokunulmadı.",
"- Teşhis notu (dürüst): platform build log'u kesildiği için manualChunks'ın asıl hatayı çözüp çözmediği kanıtlanamadı; ölü konfig temizliği olarak kayda geçti.",
"",
"### 6) CANLI DOĞRULAMA — YAPILAMADI (renderer yok)",
"- Bu turda publish YAPILMADI ve ortamda tarayıcı/renderer BULUNMADI; bar'ın görünümü,",
"  aktif vurgu ve waGunSec TIKLAMASI gözle doğrulanmadı. Kapılar yalnız ÜRETİLEN veriyi",
"  (HTML metni + filtre kümesi) doğrular; tıklama davranışının kalıcı kapısı YOKTUR.",
"- Kapı düzeyinde doğrulanan: 3 buton üretimi, tam 1 aktif düğme, waAc'nin #waGunBar'ı",
"  yeniden çizmesi, Bugün/Yarın filtrelerinin iptal elemesi ve gün eşitliği.",
"- Bu turda kullanıcıya 'göründü/düzeldi' DENMEDİ; publish sonrası görsel onay AÇIK kaldı.",
"",
"### 7) DÜRÜST NOT",
"- (a) elle-vaka-adlari.mjs yedeği ALINMADI (yedek döngüsü dışında elle düzenlendi; değişiklik = dosya sonuna tek D56 push bloğu; geri alma = bloğu silmek). Diğer 5 kapi-dosyasında *.d56-kapi-oncesi.bak VAR.",
"- (b) Tıklama (waGunSec) ve bar görünümü tarayıcıda DOĞRULANMADI (ortamda renderer yok); bu yüzden kalıcı tıklama kapısı da eklenmedi.",
"- (c) bun run build CLI sandbox'ta bloklu → Vite JS API + node node_modules/vite/bin/vite.js ile aynı pipeline doğrulandı.",
"- (d) Bugün/Yarın kapıları takvim günü kullanır (tarih kaymasına dayanıklı; dünü değil bugünü filtreler).",
"- (e) Bu kayıt betiğinin kendisi düzeltildi: D36H artık TAM SATIR eşleşmesiyle sayılıyor",
"      (özgün hâli üç geçişten dolayı guard'ı kaçırıp yazma sonrası exit 1 veriyordu) ve",
"      yayın/görsel-doğrulama iddiaları gerçeğe çevrildi.",
"",
"### AÇIK KALEMLER",
"- (0) D56 publish sonrası GÖRSEL ONAY — renderer yok; kullanıcı publish edip bar'ı ve",
"      tıklama akışını gözle kontrol etmeli.",
"- (a) D57 — WA modal telefonsuz öğrenciler toplu listesi (rozet → düzenlemeye atla).",
"- (b) Yedek/geri yükleme sertleştirme (P0 — veri kaybı korkusu; yedekAl/yedekOku denetimi).",
"- (c) Ders planlama hızlı ekranı (sık kullanılan + son öğrenciler; P1).",
"- (d) LOGO ince ayar (askıda) · (e) eski Pazar grup kaydı (opsiyonel).",
"",
"**Kapı / No-drift:** node hizli-test.mjs --tam EXIT 0 · MANIFEST 55 süit / 2606 · RUNNER 2606/2606 BİREBİR · TAMLIK 48/48 · no-drift app.js 5c76ba2ea685fea9 · ek-ders.js 3d2dd38ff517c64f DEĞİŞMEDİ · damga üç index.html aynı.",
""
].join("\n");

const say = (t, s) => t.split(s).length - 1;
/* D36H için SATIR-BAZLI eşleşme (düzeltme 1): yalnız tam satır sayılır. */
const d36Satir = (l) => l.trim() === D36H;
const d36Tam = (t) => t.split("\n").filter(d36Satir).length;

/* ---- ADIM 1: ARSIV-2 append (SIRA kuralı: ÖNCE ARŞİV) ---- */
const A2 = "CHECKPOINT-ARSIV-2.md";
let a2 = readFileSync(A2, "utf8");
const c56 = say(a2, H56A);
if (c56 > 1) { console.error("ADIM-1 KIRMIZI: ARSIV-2'de D56 başlığı " + c56 + " kez"); process.exit(1); }
if (c56 === 0) {
  if (!existsSync(A2 + ".d56-oncesi.bak")) copyFileSync(A2, A2 + ".d56-oncesi.bak");
  if (!a2.endsWith("\n")) a2 += "\n";
  a2 += "\n" + KAYIT;
  writeFileSync(A2, a2);
}
if (say(readFileSync(A2, "utf8"), H56A) !== 1) { console.error("ADIM-1 KIRMIZI: append sonrası doğrulama"); process.exit(1); }
console.log("ADIM-1 YEŞİL: ARSIV-2 D56 kaydı TAM 1 kez" + (c56 === 0 ? " (yazıldı)" : " (zaten yazılı)"));

/* ---- ADIM 2: CHECKPOINT.md — D56 özet + D36 demote (arşiv DOĞRULANDIKTAN sonra) ---- */
const CP = "CHECKPOINT.md";
const ARS1 = "CHECKPOINT-ARSIV.md";
let cp = readFileSync(CP, "utf8");
const ozetVar = say(cp, OZET) >= 1;
const d36Var = d36Tam(cp) === 1;
console.log("   (D36 tam-satır eşleşmesi: " + d36Tam(cp) + " · ham alt-dize geçişi: " + say(cp, D36H) + ")");
if (ozetVar && !d36Var) { console.log("ADIM-2: rolling zaten uygulanmış — no-op"); process.exit(0); }
if (!ozetVar) {
  if (!existsSync(CP + ".d56-kapanis-oncesi.bak")) copyFileSync(CP, CP + ".d56-kapanis-oncesi.bak");
  const satirlar = cp.split("\n");
  const oi = satirlar.findIndex(l => /^#{1,4} .*ÖZET/.test(l));
  if (oi < 0 || satirlar.filter(l => /^#{1,4} .*ÖZET/.test(l)).length !== 1) {
    console.error("ADIM-2 ANCHOR FAIL: ÖZET başlığı tek değil. Başlıklar:");
    satirlar.forEach((l, i) => { if (/^#{1,4} /.test(l)) console.error("  L" + (i + 1) + " " + l.slice(0, 60)); });
    process.exit(1);
  }
  let ni = oi + 1;
  while (ni < satirlar.length && !/^(# |## ) /.test(satirlar[ni]) && !/^#{1,2} /.test(satirlar[ni])) ni++;
  let li = ni - 1; while (li > oi && satirlar[li].trim() === "") li--;
  satirlar.splice(li + 1, 0, OZET);
  cp = satirlar.join("\n");
  console.log("ADIM-2a YEŞİL: D56 özet satırı ÖZET listesine eklendi (L" + (li + 2) + ")");
}
if (d36Var) {
  if (!existsSync(ARS1)) { console.error("ADIM-2b DUR: CHECKPOINT-ARSIV.md yok — demote YAPILMAZ (SIRA kuralı)"); process.exit(1); }
  if (say(readFileSync(ARS1, "utf8"), D36H) < 1) { console.error("ADIM-2b DUR: D36 tam kaydı arşivde YOK — demote YAPILMAZ"); process.exit(1); }
  const satirlar = cp.split("\n");
  const di = satirlar.findIndex(d36Satir);
  if (di < 0) { console.error("ADIM-2b ANCHOR FAIL: D36 tam satırı bulunamadı"); process.exit(1); }
  let ni = di + 1; while (ni < satirlar.length && !/^#{1,2} /.test(satirlar[ni])) ni++;
  if (ni >= satirlar.length) { console.error("ADIM-2b ANCHOR FAIL: D36 blok sonu yok"); process.exit(1); }
  const kaldirilan = ni - di;
  satirlar.splice(di, kaldirilan);
  cp = satirlar.join("\n");
  console.log("ADIM-2b YEŞİL: D36 TAM bloğu SON TURLAR'dan indirildi (" + kaldirilan + " satır; tam metin CHECKPOINT-ARSIV.md'de güvende)");
}
writeFileSync(CP, cp);
if (d36Tam(readFileSync(CP, "utf8")) !== 0) { console.error("KIRMIZI: D36 hâlâ CHECKPOINT.md'de"); process.exit(1); }
if (say(readFileSync(CP, "utf8"), OZET) !== 1) { console.error("KIRMIZI: D56 özet satırı TEK değil"); process.exit(1); }
console.log("ADIM-2 DOĞRULAMA YEŞİL: D36 tam-blok=0 · D56 özet=1");

for (const f of [CP, A2]) console.log(f, statSync(f).size + "B", readFileSync(f, "utf8").split("\n").length + " satır");