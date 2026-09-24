/* DÖNGÜ-18 MUTASYON KANITLARI — yalnız geçici kopya; canonical app.js SHA birebir korunur.
   Not: "uppercase geri eklendi" mutasyonu SENTETİK/kontrat mutasyonudur — büyük harf zaten
   veriden geliyor; asıl davranış kanıtı D18 gorselAd testidir (Türkçe güvenli casing).
   Hedefler:
   M1 havuz adı eski 13px/700'e dönerse → kırmızı
   M2 gorselAd dönüştürücü bozulursa (yanlış Türkçe casing) → kırmızı
   M3 liste eski dar genişliğe dönerse (min-w-[280px] kaldırılır) → kırmızı
   M4 ad span'ından flex-1/min-w-0 kaldırılırsa → kırmızı
   M5 satıra truncate eklenirse → kırmızı
   M6 items-start eski items-center'a dönerse (liste) → kırmızı
   M7 sınıf etiketi kaldırılırsa → kırmızı
   M8 whitespace-normal/break-words kaldırılırsa (havuz adı kırpmaya döner) → kırmızı */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, rmSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANON = "app.js";
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const CANON_SHA = sha(CANON);

const donmus = ["ks-grup-gorunum.mjs", "ks-panel-secim.mjs", "suit-manifest.mjs", "elle-vaka-manifesti.mjs",
  "elle-vaka-adlari.mjs", "suit-vakalar/ks-grup-gorunum.mjs.txt", "suit-vakalar/ks-panel-secim.mjs.txt", "statik-eksiksizlik.mjs"];
const once = {};
for (const f of donmus) once[f] = sha(f);

const calisma = mkdtempSync(join(tmpdir(), "d18-mut-"));
let hepsi = true;

function kos(suitAd, mutasyon, beklenenAd) {
  cpSync(process.cwd(), calisma, { recursive: true, filter: (s) => !s.includes("node_modules") && !s.includes("/.git") && !s.includes("olay-dongu15-kilit") });
  const appYolu = join(calisma, "app.js");
  let s = readFileSync(appYolu, "utf8");
  const sonra = mutasyon(s);
  if (sonra === s) { hepsi = false; console.log("FAIL | (mutasyon uygulanmadı)"); return; }
  writeFileSync(appYolu, sonra);
  const r = spawnSync(process.execPath, [join(calisma, suitAd)], { encoding: "utf8", timeout: 120000, cwd: calisma });
  const cikti = (r.stdout || "") + (r.stderr || "");
  const kotu = (cikti.match(/✗/g) || []).length;
  const pass = r.status === 1 && kotu > 0 && cikti.includes(beklenenAd);
  hepsi = hepsi && pass;
  console.log((pass ? "PASS" : "FAIL") + " | " + suitAd + " | " + beklenenAd + " | kirmizi=" + (r.status === 1) + " kotu=" + kotu + (pass ? "" : "\n--- çıktı (son 400):\n" + cikti.slice(-400)));
}

/* M1: havuz adı eski 13px/700'e döner */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace('<b class="text-[12px] font-semibold normal-case tracking-normal text-slate-800 whitespace-normal break-words">',
                   '<b class="text-[13px] text-slate-800">'),
  "D18 havuz adı eski 13px değil");

/* M2: gorselAd bozuk Türkçe casing (toLocaleLowerCase("tr") yerine tr'siz + baş büyütme yok) */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace(/function gorselAd\(ad\) \{[\s\S]*?\n\}/,
                   'function gorselAd(ad) { return String(ad || "").toLowerCase(); }'),
  "D18 gorselAd('SONER AÇIKGÖZ') → 'Soner Açıkgöz' (Türkçe güvenli)");

/* M3: liste konteyneri eski dar genişlik (min-w-[280px] kaldırılır) */
kos("ks-panel-secim.mjs",
  (s) => s.replace(' id="grup-panel-liste" class="mt-2 max-h-56 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100 min-w-[280px]"',
                   ' id="grup-panel-liste" class="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100"'),
  "D18 liste satırı tam ad + sınıf + kırpmasız düzen");

/* M4: ad span'ından flex-1 min-w-0 kaldırılır */
kos("ks-panel-secim.mjs",
  (s) => s.replace('<span class="flex-1 min-w-0 text-[13px] font-semibold text-slate-700 whitespace-normal break-words leading-snug">',
                   '<span class="text-[13px] font-semibold text-slate-700">'),
  "D18 liste satırı tam ad + sınıf + kırpmasız düzen");

/* M5: satıra truncate eklenir */
kos("ks-panel-secim.mjs",
  (s) => s.replace('<span class="flex-1 min-w-0 text-[13px] font-semibold text-slate-700 whitespace-normal break-words leading-snug">',
                   '<span class="flex-1 min-w-0 text-[13px] font-semibold text-slate-700 truncate whitespace-nowrap">'),
  "D18 liste satırı tam ad + sınıf + kırpmasız düzen");

/* M6: satır items-start → items-center (checkbox ilk satır hizası bozulur) */
kos("ks-panel-secim.mjs",
  (s) => s.replace('return \'<label class="flex items-start gap-3 px-3 py-2 hover:bg-teal-50/50 cursor-pointer\'',
                   'return \'<label class="flex items-center gap-3 px-3 py-2 hover:bg-teal-50/50 cursor-pointer\''),
  "D18 liste satırı tam ad + sınıf + kırpmasız düzen");

/* M7: sınıf etiketi kaldırılır */
kos("ks-panel-secim.mjs",
  (s) => s.replace("var sinifTag = e.o.sinif ? '<span class=\"text-[10px] font-bold text-slate-300 ' + (e.ana ? \"\" : \"ml-auto\") + ' shrink-0\">' + esc(e.o.sinif) + \"</span>\" : \"\";",
                   "var sinifTag = \"\";"),
  "D18 liste satırı tam ad + sınıf + kırpmasız düzen");

/* M8: havuz adı kırpmaya döner (whitespace-normal/break-words → truncate) */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace('<b class="text-[12px] font-semibold normal-case tracking-normal text-slate-800 whitespace-normal break-words">',
                   '<b class="text-[12px] font-semibold normal-case tracking-normal text-slate-800 truncate">'),
  "D18 havuz adı whitespace-normal + break-words (kırpmasız)");

rmSync(calisma, { recursive: true, force: true });
const son = sha(CANON);
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
console.log("canonical app.js son SHA: " + (son === CANON_SHA ? "BİREBİR OK" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "8/8 AYNI" : "BOZULDU"));
process.exit(hepsi && son === CANON_SHA && donmusOk ? 0 : 1);
