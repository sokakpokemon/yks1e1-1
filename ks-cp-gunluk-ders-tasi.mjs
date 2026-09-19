/* ks-cp-gunluk-ders-tasi.mjs — CHECKPOINT.md'ye GUNLUK-DERS-TASI-YAMASI bölümünü EKLER (idempotent).
   CHECKPOINT.md ~1.8k+ satır olduğu için dosya araçları tümünü eşleştiremiyor; bu yüzden append
   repo'nun kendi ks-yama-*.mjs konvansiyonuyla yapılır. Tüm testler YEŞİL olduktan sonra koşulur. */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const CP = "CHECKPOINT.md";
const MARK = "## GUNLUK-DERS-TASI-YAMASI";
const sha = (s) => createHash("sha256").update(s).digest("hex");

if (!existsSync(CP)) { console.error("YOK: " + CP); process.exit(1); }
const cp = readFileSync(CP, "utf8");
if (cp.includes(MARK)) { console.log(CP + ": " + MARK + " bölümü ZATEN var → dokunulmadı (idempotent)."); process.exit(0); }

const app = readFileSync("app.js", "utf8");
const yedek = "app.js.gunluk-ders-tasi-oncesi.bak";
const bolum = [
  "",
  "---",
  "",
  MARK + " (2026-09-19): Günlük tabloda birebir ders kartını AYNI SATIRDA başka boş saate taşıma",
  "",
  "**Uygulama:** `node ks-yama-gunluk-ders-tasi.mjs` (assert'li, exact-anchor, fail-closed, İDEMPOTENT).",
  "Yamalanan dosyalar: `app.js` (GUNLUK-DERS-TASI-YAMASI blokları) · `test.mjs` (`ks-gunluk-ders-tasi.mjs` TAM 1 KEZ) ·",
  "`ks-ders-tasi.mjs` (günlük tablo artık draggable olduğu için 2 STALE assert güncellendi; assertion sayısı SABİT: 60).",
  "`node ks-cp-gunluk-ders-tasi.mjs` bu bölümü ekler (idempotent).",
  "",
  "**Yedek (statSync byte + SHA-256):** `" + yedek + "` · " + statSync(yedek).size + " bayt · SHA-256 `" + sha(readFileSync(yedek)) + "`",
  "— mevcut backup'ların ÜZERİNE YAZILMADI; yedek yoksa oluşturulur, varsa dokunulmaz.",
  "**app.js:** yama öncesi 290.213 B / 4.457 satır · SHA-256 `2f36752acf15622c29dd507b0ed56775bdca71b6e0591688481687829aafcff6`",
  "→ yama sonrası " + Buffer.byteLength(app, "utf8") + " B / " + app.split("\n").length + " satır · SHA-256 `" + sha(app) + "` (+2.368 B).",
  "",
  "**AÇIK KARAR (v1):** YALNIZ AYNI ÖĞRETMEN SATIRINDA saat değişikliği. Başka satıra bırakma RED — öğretmen",
  "otomatik değişmez. Gün değişikliği bu tabloda YOK; seçili gün sabit kalır. Dersin öğretmen/tarih alanları",
  "DEĞİŞMEZ; yalnız `saat/kod` değişir.",
  "",
  "**Yapılan İş (app.js — baştan yazma YOK; `gunlukTablo()` içine 5 hedefli yama):**",
  "1. **Satır öğretmen kimliği:** yeni `ogrtIdMap` (ad → `ogretmenId`), iki döngüde (dersler + ek dersler) doldurulur;",
  "   eksikse ad üzerinden TEK eşleme ile tamamlanır, çözülemezse `\"\"` kalır ve o satırda drop-zone ÇİZİLMEZ (ölü hedef yok).",
  "2. **Kaynak:** `gunlukTablo()` birebir hücresi YALNIZ AKTİF (`durum !== \"iptal\"`) TEK ÖĞRENCİLİ (`dersOgrenciIds(ders).length === 1`)",
  "   derste `draggable=\"true\" style=\"cursor:grab\"` + `ondragstart=\"dersDrag(event, '<dersId>')\"` + `ondragend=\"dersDropHedef=null; ...\"`.",
  "   Grup / iptal / Sınıf Dersi (rose) / Ek Ders (amber) / Kapalı (gri) kartlar draggable DEĞİL.",
  "3. **Hedef:** günlük boş hücre MEVCUT drop-zone yoluna bağlandı — aynı `class=\"dnd-bos ...\"`, `data-drop-ogrt/gun/saat`,",
  "   `ondragover=\"istekDragOver(event, this)\"`, `ondragleave=\"istekDragLeave(this)\"`, `ondrop=\"istekBurak(event, this, ...)\"`.",
  "   Mola hücresi (`slot.mola` dalı) bu yola HİÇ girmez → mola KESİNLİKLE drop edilemez. Saat MEVCUT `SAAT_SLOTLARI`/`KISA_KOD`",
  "   (`slot.b`), gün MEVCUT `dowIdx(gunKey)` ile bulunur; index/sabit kolon varsayımı YOK. Hedef gün SABİT (`gunKey`).",
  "4. **ÜÇÜNCÜ paralel sistem YOK:** yeni drag/drop fonksiyonu, yeni dragover, yeni global EKLENMEDİ. Haftalık dilimde kurulan",
  "   `dersDrag` / `dersBurak` / `dersDropHedef` + tek `istekDragOver/istekDragLeave/istekBurak → dersBurak` devri AYNEN yeniden kullanıldı",
  "   (`ondrop=\"istekBurak(event, this,` toplam 2 yol: haftalık + günlük). Mevcut istek-kartı akışı DEĞİŞMEDİ.",
  "5. **Doğrulama/atomiklik (mevcut `dersBurak`):** kaynak ders `staged.id` ile hariç tutularak MEVCUT `duzeltmeBul` yeniden kullanılır;",
  "   ayrıca dolu slot, Ek Ders, Kapalı (`avail.musait`), Sınıf Dersi (`avail.sinif`), Pazar ve kısa kodda karşılığı olmayan saat (12:00 mola dahil) RED.",
  "   Karar staging kopyası (`JSON.parse(JSON.stringify(l))`) üzerinde verilir: RED'de DB'ye tek alan yazılmaz, `saveDB()` HİÇ çağrılmaz →",
  "   localStorage byte-birebir korunur. Başarıda yalnız `tarih/saat/kod` güncellenir → TEK `saveDB()` → render.",
  "",
  "**RED senaryoları (hepsinde toast + sıfır DB yazımı + localStorage byte-birebir):** cross-row (başka öğretmen satırı),",
  "Mola (12:00), dolu hedef, Kapalı (`avail.musait`), Sınıf Dersi (`avail.sinif`), Ek Ders (amber) hedefi, öğretmen çakışması,",
  "öğrenci çakışması (başka öğretmenle aynı slot), toplu ders (sınıf programı), grup ders kaynağı. Kaynak = hedef → no-op (sessiz).",
  "",
  "**Görünüm tutarlılığı:** Günlük tablo, gün sekmesi ve haftalık tablo AYNI DB kaydını okur; taşıma sonrası üçünde de aynı konum görünür.",
  "",
  "**Test:** `ks-gunluk-ders-tasi.mjs` — **115/115** (test.mjs sayımı 115; süit kendi satırında 116 assert raporlar).",
  "Doğrulama: `node --check app.js` OK · `node test.mjs` → **2028/2028 OK** (43 süit).",
  "**SUITE BAZINDA (test.mjs koşusu):** harness 34 · test-render 14 · durum-fn 20 · grup-uyum 41 · panel-secim 32 · grup-gorunum 28 ·",
  "istekten-grup 32 · grup-istegi 68 · benzersiz-id 46 · gercek-kadro 80 · donem-ilk 47 · donem-damga 50 · donem-secici 77 · excel-csv 85 ·",
  "donem-olusturma 87 · donem-secici-gorunum 44 · donem-secici-dom 22 · sinifprog-csv 57 · sablon-kopya 72 · render-sahipligi 30 ·",
  "d1-render-refactor 44 · kadro-siralama 27 · kapali-gorunum 19 · ek-ders-donem 59 · ekders-gorunum 50 · ekders-ozet-csv 46 ·",
  "birebir-gorunum 34 · sinif-ogretmen-uyum 35 · sinif-prog-uyum-onar 36 · sinif-prog-etiket 21 · kart-sirasi 33 · kart-kolon 51 ·",
  "brans-ders-kurali 54 · excel-ui-kontrol 34 · wa-sablon 47 · wa-onizleme 36 · wa-durum 36 · wa-alici 47 · excel-k-import 24 ·",
  "kadro-kolon 62 · kadro-telefon3 57 · **ders-tasi 91** · **gunluk-ders-tasi 115 (YENİ)**.",
  "Baseline 1912/1912 (42 süit) → 2028/2028 (43 süit): **eski süitelerde DÜŞÜŞ SIFIR** (`ks-ders-tasi.mjs` 91/91 sabit).",
  "",
  "**İdempotans:** `ks-yama-gunluk-ders-tasi.mjs` 2. koşuda app.js'e DOKUNMAZ, test.mjs kaydını ve `ks-ders-tasi.mjs`",
  "düzeltmesini tekrar uygulamaz (exit 0, hash birebir aynı). Yedek oluşturma yalnız dosya YOKKEN çalışır.",
  "",
  "**Kalan Riskler / notlar:**",
  "- Günlük tablo GÖRÜNÜM değişikliği: boş hücreler artık `dnd-bos` (görünür `+` ipucu) — haftalık drop-zone'larla tutarlı.",
  "  `index.html` (`.dnd-bos`/`.dnd-uygun` CSS) DEĞİŞMEDİ; hash `7ee493bae3d1396cafd2e102dce2a10c6f70b6170a17ab35d699d3870e04c2d5`.",
  "- `ks-ders-tasi.mjs`'teki eski kapsam kararı (\"günlük tablo draggable DEĞİL\") bu TEK İŞ'in AÇIK KARARIYLA geçersiz kaldı;",
  "  2 assert güncellendi (kapsam yeni karara göre; assertion sayısı artmadı/azalmadı).",
  "- Günlük ve haftalık tablo aynı `istekBurak` yolunu paylaştığı için havuz istek kartı artık günlük boş hücreye de bırakılabilir",
  "  (mevcut kurallarla; istek akışı bozulmadı, süitte doğrulandı).",
  "- Haftalar arası / günler arası taşıma bu tabloda bilinçli olarak YOK (v1).",
  "- Tarayıcıda ilk açılışta eski `app.js` önbellekten gelebilir → **sert yenileme: Ctrl+Shift+R (Cmd+Shift+R)**.",
  ""
].join("\n");

writeFileSync(CP, cp + bolum);
console.log(CP + ": " + MARK + " bölümü eklendi (+" + Buffer.byteLength(bolum) + " B).");
