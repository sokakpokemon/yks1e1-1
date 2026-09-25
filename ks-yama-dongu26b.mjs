/* ks-yama-dongu26b.mjs — DÖNGÜ-26 ek yama (gunlukTablo üye satırı TAM AD)
   2. koşu: "Zaten uygulanmış" (exit 2). */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const oncekiSha = sha(readFileSync("app.js"));
if (sha(readFileSync("app.js")) === sha(readFileSync("app.js.dongu26-oncesi.bak"))) { console.error("HATA: app.js yama-a hâlinde görünüyor — önce ks-yama-dongu26.mjs koşmalı"); process.exit(1); }

let src = readFileSync("app.js", "utf8");
const eski = `          if (grupUyelerG.length) html += '<div class="text-[8.5px] text-slate-400 mt-0.5">' + grupUyelerG.map(function (a) { return ilkHarfler(a); }).join(" · ") + '</div>';`;
const yeni = `          if (grupUyelerG.length) html += '<div class="text-[9px] font-semibold text-slate-500 leading-snug break-words mt-0.5" title="Grup üyeleri">' + grupUyelerG.map(function (a) { return esc(a); }).join(", ") + '</div>'; /* DÖNGÜ-26: üyeler TAM AD (baş harf yerine) */`;
if (src.includes(yeni)) { console.error("Zaten uygulanmış (DÖNGÜ-26b)."); process.exit(2); }
if (!src.includes(eski)) { console.error("ASSERT: gunlukTablo eski üye satırı bulunamadı"); process.exit(1); }
src = src.replace(eski, yeni);
writeFileSync("app.js", src);
console.log("DÖNGÜ-26b yaması uygulandı. app.js:", sha(readFileSync("app.js")));
