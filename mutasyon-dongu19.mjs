/* DÖNGÜ-19 MUTASYON KANITLARI — yalnız geçici kopya; canonical app.js SHA birebir korunur.
   Hedefler:
   M1 ortak formatter birebirEtiketHTML değiştirilir → tüm formatter-host assertion'ları kırmızı
   M2 yalnız havuz ana kartı eski stile döner (birebir-etiket kaldırılır) → yalnız havuz kartı kırmızı
   M3 sınıf yanlış kaynaktan (istek kaydındaki uydurma alan) alınır → kırmızı
   M4 serbest metin isteğinde "Sınıf belirtilmemiş" eklenirse (sinif null → "") → kırmızı
   M5 chip'e sınıf etiketi eklenirse (gorselAd → birebirEtiketHTML) → kırmızı
   M6 konu satırına truncate geri gelirse → kırmızı
   M7 D18 min-w/flex-wrap düzeltmeleri sökülür (liste min-w kaldırılır) → kırmızı
   M8 metadata eski büyük stile döner (ders 11px/600 → 13px) → kırmızı */
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

const calisma = mkdtempSync(join(tmpdir(), "d19-mut-"));
let hepsi = true;

function kos(suitAd, mutasyon, beklenenAd) {
  cpSync(process.cwd(), calisma, { recursive: true, filter: (s) => !s.includes("node_modules") && !s.includes("/.git") });
  const appYolu = join(calisma, "app.js");
  let s = readFileSync(appYolu, "utf8");
  const sonra = mutasyon(s);
  if (sonra === s) { hepsi = false; console.log("FAIL | (mutasyon uygulanmadı) | " + beklenenAd); return; }
  writeFileSync(appYolu, sonra);
  const r = spawnSync(process.execPath, [join(calisma, suitAd)], { encoding: "utf8", timeout: 120000, cwd: calisma });
  const cikti = (r.stdout || "") + (r.stderr || "");
  const kotu = (cikti.match(/✗/g) || []).length;
  const pass = r.status === 1 && kotu > 0 && cikti.includes(beklenenAd);
  hepsi = hepsi && pass;
  console.log((pass ? "PASS" : "FAIL") + " | " + suitAd + " | " + beklenenAd + " | kirmizi=" + (r.status === 1) + " kotu=" + kotu + (pass ? "" : "\n--- çıktı (son 400):\n" + cikti.slice(-400)));
}

/* M1: ortak formatter birebirEtiketHTML bozulur (12px/600 + kırpmasız gövde eski stile döner) */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace('return \'<span class="birebir-etiket inline-flex items-baseline gap-2 min-w-0 flex-wrap"><span class="text-[12px] font-semibold normal-case tracking-normal text-slate-800 whitespace-normal break-words leading-snug">\' + esc(gorselAd(ad)) + "</span>" + snfSpan + "</span>";',
                   'return \'<span class="birebir-etiket"><span class="text-[13px] text-slate-800 truncate">\' + esc(ad) + "</span>" + snfSpan + "</span>";'),
  "D19 havuz adı ortak formatter'dan (birebir-etiket) + kırpmasız + sınıf etiketi VAR");

/* M2: yalnız havuz ana kartı eski stile döner (formatter çağrısı kaldırılır → inline eski markup) */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace("(o ? birebirEtiketHTML(o.ad, o.sinif || \"\") : birebirEtiketHTML(r.ogrenciAd, null))",
                   '(o ? \'<b class="text-[13px] text-slate-800 truncate">\' + esc(o.ad) + "</b>" : \'<b class="text-[13px] text-slate-800 truncate">\' + esc(r.ogrenciAd) + "</b>")'),
  "D18 havuz adı eski 13px değil");

/* M3: sınıf yanlış kaynaktan — gerçek DB öğrencisinin sınıfı renderer'da sabit kodla değiştirilir (DB → uydurma).
   birebirEtiketHTML imzası değiştirilir; çağıran hostların 'o.sinif' argümanı yok sayılıp formatter içinde sabit '9-C' üretilir.
   Formatter-contract assertion'ı (D19 sinif dolu → sınıf adın yanında) ve havuz kartı assertion'ı kırmızı olur. */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace("if (sinif !== null) snfSpan = '<span class=\"text-[10px] font-medium text-slate-400 shrink-0\">' + esc(sinif ? sinif : \"Sınıf belirtilmemiş\") + \"</span>\";",
                   "if (sinif !== null) snfSpan = '<span class=\"text-[10px] font-medium text-slate-400 shrink-0\">' + esc(\"9-C\") + \"</span>\";"),
  "D19 sinif dolu → sınıf adın yanında (gap-2 wrapper)");

/* M4: serbest metin isteğinde "Sınıf belirtilmemiş" eklenir (null → "") */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace("birebirEtiketHTML(r.ogrenciAd, null)", "birebirEtiketHTML(r.ogrenciAd, \"\")"),
  "D19 sinif=null → sınıf spanı YOK ('Sınıf belirtilmemiş' üretilmez)");

/* M5: havuz özet chip'ine sınıf etiketi eklenir (gorselAd chip → sınıf spanı) → istekGrupOzetHTML DOM assertion'ı kırmızı */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace("esc(o ? gorselAd(o.ad) : \"?\") + (i === 0 ? ' <span class=\"opacity-70\">(Ana)</span>' : \"\")",
                   "esc(o ? gorselAd(o.ad) : \"?\") + (o && o.sinif ? ' <span class=\"text-[10px] font-medium text-slate-400\">' + esc(o.sinif) + \"</span>\" : \"\") + (i === 0 ? ' <span class=\"opacity-70\">(Ana)</span>' : \"\")"),
  "D19 öğretmen suggestion satırı 12px/600 + sınıf spanı YOK; chip+banner gorselAd (sınıfsız)");

/* M6: konu satırına truncate geri gelir (yalnız havuz kartı konu div'i) */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace('<div class="text-[10px] font-medium text-slate-500 whitespace-normal break-words mt-0.5">',
                   '<div class="text-[10px] font-medium text-slate-500 truncate mt-0.5">'),
  "D19 havuz kartı metadata ölçeği kompakt (ders 11px/600 · konu truncate YOK)");

/* M7: D18 panel liste düzeltmesi sökülür (min-w-[280px] kaldırılır) */
kos("ks-panel-secim.mjs",
  (s) => s.replace('divide-slate-100 min-w-[280px]"', 'divide-slate-100"'),
  "D18 liste satırı tam ad + sınıf + kırpmasız düzen");

/* M8: havuz metadata ders rozeti eski büyük stile döner (11px/600 → 13px) */
kos("ks-grup-gorunum.mjs",
  (s) => s.replace("(D2 ? '<span class=\"rounded-full px-2 py-0.5 text-[11px] font-semibold ' + D2.bg",
                   "(D2 ? '<span class=\"rounded-full px-2 py-0.5 text-[13px] ' + D2.bg"),
  "D19 havuz kartı metadata ölçeği kompakt (ders 11px/600 · konu truncate YOK)");

rmSync(calisma, { recursive: true, force: true });
const son = sha(CANON);
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
console.log("canonical app.js son SHA: " + (son === CANON_SHA ? "BİREBİR OK" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "8/8 AYNI" : "BOZULDU"));
process.exit(hepsi && son === CANON_SHA && donmusOk ? 0 : 1);
