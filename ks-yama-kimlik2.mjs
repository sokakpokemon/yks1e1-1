/* ks-yama-kimlik2.mjs — KİMLİK-YAMası bölge 3: app.js'e sürüm işaretçisi ekler (assert'li, idempotent). */
import { readFileSync, writeFileSync } from "node:fs";

const DOSYA = "app.js";
const MARK = "var KS_KIMLIK = 1;";
let src = readFileSync(DOSYA, "utf8");
if (src.includes(MARK)) { console.log("Zaten uygulanmış — değişiklik yapılmadı."); process.exit(2); }

const CIBLE = "// ===== SECTION: SABİTLER VE KISA KOD (KS) =====";
const n = src.split(CIBLE).length - 1;
if (n !== 1) { console.error("ASSERT BAŞARISIZ: hedef satır " + n + " kez bulundu (beklenen 1)"); process.exit(1); }
src = src.replace(CIBLE, CIBLE + "\nvar KS_KIMLIK = 1; /* KİMLİK-YAMASI şema sürümü */");

writeFileSync(DOSYA, src);
console.log("OK: KS_KIMLIK işaretçisi eklendi.");
