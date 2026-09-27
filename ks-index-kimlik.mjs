/* ks-index-kimlik.mjs — index.html statik kimlik kapısı (TEK ortak DİNAMİK kontrol).
   Amaç: index.html'e elle SABİT SHA-256 pini koymayı KALDIRIP korumayı burada
   semantik olarak tutmak. app.js/ek-ders.js her değiştiğinde index.html'deki
   ?v= damgası = dosya SHA-256 ilk 16 hane olduğu CANLI doğrulanır; elle pin
   güncellemesi gerekmez. Ayrıca script src listesi ve kritik id'ler varlığını denetler. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const BEKLENEN = 8;
let __kosan = 0;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== BEKLENEN) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-index-kimlik.mjs kosan=" + __kosan + " beklenen=" + BEKLENEN); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-index-kimlik.mjs:" + __kosan + ":" + BEKLENEN); } });
const sha16 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const html = readFileSync("index.html", "utf8");
const appSha = sha16(readFileSync("app.js", "utf8"));
const ekSha = sha16(readFileSync("ek-ders.js", "utf8"));
let fail = 0;
const t = (name, cond) => { __kosan++; console.log("  " + (cond ? "✓" : "✗") + " " + name); if (!cond) fail = 1; };

console.log("1) Statik varlık damgası = dosya SHA-256 ilk 16 hane (DİNAMİK):");
t("index.html app.js?v= damgası = app.js SHA-256 ilk 16 hane (bayat kalırsa KIRMIZI)", html.includes('src="app.js?v=' + appSha + '"'));
t("index.html ek-ders.js?v= damgası = ek-ders.js SHA-256 ilk 16 hane (bayat kalırsa KIRMIZI)", html.includes('src="ek-ders.js?v=' + ekSha + '"'));
t("her iki statik varlıkta ?v= 16 haneli SHA biçiminde (damga kaybolur/bozulursa KIRMIZI)", /app\.js\?v=[0-9a-f]{16}"/.test(html) && /ek-ders\.js\?v=[0-9a-f]{16}"/.test(html));

console.log("2) index.html script src listesi:");
t("app.js script src'i index.html'de TAM 1 kez", (html.match(/<script src="app\.js\?v=/g) || []).length === 1);
t("ek-ders.js script src'i index.html'de TAM 1 kez (defer'li)", (html.match(/<script src="ek-ders\.js\?v=[0-9a-f]{16}" defer><\/script>/g) || []).length === 1);

console.log("3) Kritik id'ler index.html'de VAR:");
t("index.html planKart id'si VAR", html.includes('id="planKart"'));
t("index.html havuzBolum id'si VAR", html.includes('id="havuzBolum"'));
t("index.html ks-kart-kolon id'si VAR", html.includes('id="ks-kart-kolon"'));

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail ? 1 : 0);
