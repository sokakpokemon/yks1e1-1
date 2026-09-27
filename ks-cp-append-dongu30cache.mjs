/* ks-cp-append-dongu30cache.mjs — DÖNGÜ-30-CACHE checkpoint ekleyici (assert'li, idempotent).
   Neden ayrı script: CHECKPOINT.md 300 KB+ olduğu için düzenleyici araçların arama
   penceresinin dışında kalıyor; bu script hedefli (TAM 1 eşleşme) değiştirir ve yazar.
   Uygular: (1) CANLI-YAYIM KURALI'na madde (e) ekler, (2) dosya sonuna D30-CACHE bölümünü ekler.
   2. koşuda "Zaten uygulanmış" deyip exit 2 ile reddeder. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const yol = "CHECKPOINT.md";
let s = readFileSync(yol, "utf8");
const sha = (t) => createHash("sha256").update(t).digest("hex");
const onceki = sha(s);

/* ---- 0) İDEMPOTANS KAPISI (önce) ---- */
if (s.includes("# ✅ CHECKPOINT: DÖNGÜ-30-CACHE")) { console.error("Zaten uygulanmış."); process.exit(2); }

/* ---- 1) CANLI-YAYIM KURALI (e) ---- */
const kuralEski = "(canlı app.js SHA = canonical app.js SHA).";
const kuralYeni = "(canlı app.js SHA = canonical app.js SHA); (e) statik varlık güncellemelerinde URL cache'i için `?v=<commit>` damgası güncellenir; publish sonrası canlı SHA teyidi şarttır.";
const kuralSayi = s.split(kuralEski).length - 1;
if (kuralSayi === 1) s = s.replace(kuralEski, kuralYeni);
else if (!s.includes(kuralYeni)) { console.error("KURAL hedefi " + kuralSayi + " kez bulundu ve yeni kural yok — beklenen TAM 1"); process.exit(1); }

/* ---- 2) D30-CACHE bölümü ---- */

const BOLUM = [
  "# ✅ CHECKPOINT: DÖNGÜ-30-CACHE — app.js CDN Önbelleğini Aşma (?v= Damgası)",
  "",
  "**Tarih:** 27 Eylül 2026 · **Durum:** ✅ Tamamlandı, `node test.mjs` → **2461/2461 OK** (51 süit, HAM Σ beşli BİREBİR)",
  "",
  "## Teşhis (kullanıcı kanıtı)",
  "- `/vendor/fonts/montserrat-900-italic.woff2` (D30'da eklenen YENİ URL) canlıda gerçek dosya dönerken `/app.js` (ESKİ URL) hâlâ `009d03d7` dönüyordu → sunucudaki app.js yeni olsa da CDN eski URL için eski kopyayı tutuyor.",
  "- Yerel teyit: kök `app.js` `1d509a64…` (D30 yeni, 376774 B); bildirilen canlı eski SHA `009d03d7…` = kök `public/app.js` içeriği (350571 B).",
  "",
  "## Uygulama (yalnız index.html + test pin/offset dosyaları)",
  "1. `index.html` yerel script referanslarına sürüm damgası (`v` = D30 commit HEAD kısa hash `6dd3188`):",
  "   - satır 13: `<script src=\"ek-ders.js\" defer>` → `<script src=\"ek-ders.js?v=6dd3188\" defer>`",
  "   - satır 349: `<script src=\"app.js\">` → `<script src=\"app.js?v=6dd3188\">`",
  "2. **Vite kanıtı:** `bun run build` exit 0; `dist/index.html` damgayı BİREBİR korudu (satır 13/349); postbuild `dist/app.js`'i kökten (`1d509a64…`, 376774 B) kopyaladı.",
  "3. **Donmuş pin güncellemesi (elle, eski→yeni):** `index.html` SHA-256 `244f61c8…` → `608e93d3a9503949946924f5c5789972e99fa61edb59929c65452e95de9072a6` (22.708 → 22.730 B; +22 = 2×`?v=6dd3188`). Güncellenen 8 süit (dosya:satır):",
  "   - ks-birebir-gorunum.mjs:196 · ks-ders-tasi.mjs:415 · ks-donem-ilk.mjs:158 · ks-donem-olusturma.mjs:292 · ks-ek-ders-donem.mjs:213 (beklenen objesi) · ks-ekders-ozet-csv.mjs:189 · ks-gunluk-ders-tasi.mjs:399 · ks-sinif-ogretmen-uyum.mjs:13 (KNOWN_HTML).",
  "4. **Statik offset kayması (damga her offset'i +10 B kaydırdı):** ks-kart-sirasi + ks-kart-kolon vaka ADLARINDAKİ ham offsetler +10; donmuş `suit-vakalar/*.txt` ve ELLE ad listesi hedefli düzeltildi (3 ad): plan 9491→9501 · havuz 15402→15412 · sol 9435→9445 · sag 15293→15303 · kapa 19790→19800.",
  "   - `elle-vaka-adlari.mjs` (133 KB) düzenleyici araç penceresinin dışında kaldığı için: taban liste `elle-vaka-adlari-base.mjs` olarak korundu; yeni `elle-vaka-adlari.mjs` SARMALAYICI yalnız bu 3 adı hedefli düzeltir (hedef yoksa yüksek sesle hata verir). Diğer tüm ad/sıra/sayı DEĞİŞMEZ.",
  "5. **Mutasyon kapısı (yeni assertion):** `ks-donem-ilk.mjs` 47→48 — `index.html statik varlık ?v=6dd3188 damgası VAR (app.js + ek-ders.js) — damga kaldırılırsa KIRMIZI`. Damga geçici kaldırıldığında bu assertion KIRMIZI oldu (kanıt), sonra geri kondu; donmuş dörtlü elle güncellendi (suit-manifest 48 · elle-vaka-manifesti 48 · ELLE ad 48 · suit-vakalar/ks-donem-ilk.mjs.txt 48).",
  "",
  "## Kapılar (tek koşu)",
  "- `node --check app.js` · `node --check ek-ders.js` · `node --check elle-vaka-adlari.mjs` OK",
  "- `node test.mjs` → **2461/2461 OK**, HAM Σ beşli BİREBİR, exit 0",
  "- `node statik-eksiksizlik.mjs` → **TAMLIK KANITI** (sıfır-hit istisna listesi DEĞİŞMEDİ; yeni site koşulsuz ateşlendi)",
  "- **No-drift:** app.js `1d509a6410c8…` (376774 B) · ek-ders.js `3d2dd38ff517…` (30405 B) — DEĞİŞMEDİ. Yalnız `index.html` + test pin/offset dosyaları değişti.",
  "",
  "## Kalıcı kural + sonraki adım",
  "- **CANLI-YAYIM KURALI (e):** statik varlık güncellemelerinde URL cache'i için `?v=<commit>` damgası güncellenir; publish sonrası canlı SHA teyidi şarttır.",
  "- Commit + publish (Vly yönetir). Publish sonrası canlı teyit: `app.js?v=6dd3188` içeriğinde `fk-logo` ≥1 ve `Değerli Öğrencimiz` ≥1.",
  "",
  "## Kalan Risk",
  "- `public/app.js` hâlâ eski (`009d03d7…`, 350571 B) — kök ile birebir DEĞİL. `bun run build` postbuild'i kökten kopyalayıp `dist/app.js`'i düzelttiği için build tabanlı dağıtımda sorun yok; ancak platform postbuild'siz `vite build` koşarsa yeni URL eski `public/app.js`'i servis edebilir. Publish sonrası canlı `app.js?v=6dd3188` SHA'sının `1d509a64…` olduğu teyit edilmeli.",
].join("\n");

s = s.replace(/\s*$/, "") + "\n\n---\n\n" + BOLUM + "\n";
writeFileSync(yol, s);
console.log("CHECKPOINT güncellendi. sha " + onceki.slice(0, 8) + " → " + sha(s).slice(0, 8));
