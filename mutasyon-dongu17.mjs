/* DÖNGÜ-17 MUTASYON KANITLARI — yalnız geçici kopya; canonical app.js SHA birebir korunur.
   Hedefler (onaylı spec-ek kapılar):
   M1 haftalık gövdeden Mola hücresi çıkarılırsa → kırmızı
   M2 Mola 4-5 arasından başka yere taşınırsa → kırmızı
   M3 5. ders bir kolon kaydırılırsa → kırmızı
   M4 bir gövde satırı 12 yerine 11 hücre üretirse → kırmızı
   M5 Mola'ya drop/+ istek eklenirse → kırmızı
   M6 PNG footer'ı geri gelirse → kırmızı
   M7 marka "YKS Birebir Takip" olursa → kırmızı
   M8 tarih/gün font büyütmesi geri alınırsa → kırmızı
   M9 saatEtiket değiştirilirse → koruma testi kırmızı */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, rmSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANON = "app.js";
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const CANON_SHA = sha(CANON);

const donmus = ["ks-ders-karti.mjs", "ks-ders-karti-tasima.mjs", "ks-ogrt-ders-karti.mjs", "ks-ogrt-denetim.mjs",
  "ks-ekders-ozet-csv.mjs", "suit-manifest.mjs", "elle-vaka-manifesti.mjs", "elle-vaka-adlari.mjs", "statik-eksiksizlik.mjs",
  "suit-vakalar/ks-ogrt-ders-karti.mjs.txt", "suit-vakalar/ks-ders-karti.mjs.txt"];
const once = {};
for (const f of donmus) once[f] = sha(f);

const calisma = mkdtempSync(join(tmpdir(), "d17-mut-"));
let n = 0, hepsi = true;

function koş(mutasyon) {
  n++;
  cpSync(process.cwd(), calisma, { recursive: true, filter: (s) => !s.includes("node_modules") && !s.includes("/.git") && !s.includes("olay-dongu15-kilit") });
  const appYolu = join(calisma, "app.js");
  let s = readFileSync(appYolu, "utf8");
  const sonra = mutasyon(s);
  if (sonra === s) return { kirmizi: false, kotu: 0, cikti: "(mutasyon uygulanmadı)" };
  writeFileSync(appYolu, sonra);
  const r = spawnSync(process.execPath, [join(calisma, "ks-ogrt-ders-karti.mjs")], { encoding: "utf8", timeout: 120000, cwd: calisma });
  const cikti = (r.stdout || "") + (r.stderr || "");
  const kotu = (cikti.match(/✗/g) || []).length;
  return { kirmizi: r.status === 1 && kotu > 0, kotu, cikti };
}
function kontrol(ad, mutasyon, beklenenAd) {
  const r = koş(mutasyon);
  const pass = r.kirmizi && r.cikti.includes(beklenenAd);
  hepsi = hepsi && pass;
  console.log((pass ? "PASS" : "FAIL") + " | " + ad + " | kirmizi=" + !!r.kirmizi + " kotu=" + r.kotu + (pass ? "" : "\n--- çıktı (son 500):\n" + r.cikti.slice(-500)));
}

/* M1: haftalık gövdeden Mola çıkarılır */
kontrol("M1 haftalık gövde Mola hücresi çıkarıldı",
  (s) => s.replace("      if (slotH.mola) { /* DÖNGÜ-17: Mola hücresi — ders/öğrenci/sınıf/+istek/sürükleme/drop DEĞİL (günlüktekiyle aynı emerald biçim) */\n        satirlar += '<td class=\"px-1.5 py-1.5 text-center border-l border-slate-100 bg-emerald-50\">' +\n          '<div class=\"text-[10px] font-bold text-emerald-600\">Mola</div>' +\n          '<div class=\"text-[9px] text-emerald-500\">' + slotH.b + '-' + slotH.e + '</div></td>';\n        continue;\n      }", "      if (slotH.mola) { continue; }"),
  "D17-2 haftalık her gövde satırında 12 hücre");

/* M2: Mola SAAT_SLOTLARI'da yanlış yere taşınır (2. konum) */
kontrol("M2 Mola yanlış kolona taşındı",
  (s) => s.replace('var HAFTA_SLOTLARI = KISA_KOD.slice(0, 4).concat([{ no: "Mola", b: "12:00", e: "13:00", mola: true }], KISA_KOD.slice(4));',
                   'var HAFTA_SLOTLARI = KISA_KOD.slice(0, 2).concat([{ no: "Mola", b: "12:00", e: "13:00", mola: true }], KISA_KOD.slice(2));'),
  "D17-3 haftalık görsel sıra 1,2,3,4,Mola,5..11");

/* M3: 5. ders kolon kayması — drop hedef saati kaydırılır (hk slotH.b yerine yanlış slot) */
kontrol("M3 5. ders bir kolon kaydırıldı (günlük başlık no'ları kaydırılır → görsel sıra bozulur, drop hedefi 15:30 kaybolur)",
  (s) => s.replace('  var SAAT_SLOTLARI = KISA_KOD.slice(0, 4).concat([{ no: "Mola", b: "12:00", e: "13:00", mola: true }], KISA_KOD.slice(4));',
                   '  var SAAT_SLOTLARI = KISA_KOD.slice(0, 4).concat([{ no: "Mola", b: "12:00", e: "13:00", mola: true }], KISA_KOD.slice(4).map(k => Object.assign({}, k, { no: String(parseInt(k.no, 10) + 1) })));'),
  "D17-5 5. ders Mola'dan SONRA doğru görsel kolonda");

/* M4: gövde satırı 11 hücre üretir (Mola td atlanır) */
kontrol("M4 bir gövde satırı 11 hücre üretir",
  (s) => s.replace("      if (slotH.mola) { /* DÖNGÜ-17: Mola hücresi — ders/öğrenci/sınıf/+istek/sürükleme/drop DEĞİL (günlüktekiyle aynı emerald biçim) */\n        satirlar += '<td class=\"px-1.5 py-1.5 text-center border-l border-slate-100 bg-emerald-50\">' +\n          '<div class=\"text-[10px] font-bold text-emerald-600\">Mola</div>' +\n          '<div class=\"text-[9px] text-emerald-500\">' + slotH.b + '-' + slotH.e + '</div></td>';\n        continue;\n      }", "      if (slotH.mola) { continue; } /* M4 */"),
  "D17-2 haftalık her gövde satırında 12 hücre");

/* M5: Mola hücresine drop/+ eklenir */
kontrol("M5 Mola hücresine drop/+ istek eklendi",
  (s) => s.replace("        satirlar += '<td class=\"px-1.5 py-1.5 text-center border-l border-slate-100 bg-emerald-50\">' +\n          '<div class=\"text-[10px] font-bold text-emerald-600\">Mola</div>' +",
                   "        satirlar += '<td class=\"dnd-bos px-1.5 py-1.5 text-center border-l border-slate-100 bg-emerald-50\" ondrop=\"istekBurak(event, this)\">' +\n          '<span class=\"text-[9px] text-slate-300\">+</span><div class=\"text-[10px] font-bold text-emerald-600\">Mola</div>' +"),
  "D17-4a haftalıkta 7 Mola hücresi ve hiçbiri drop/drag içermiyor");

/* M6: PNG footer geri */
kontrol("M6 PNG footer geri eklendi",
  (s) => s.replace("    /* DÖNGÜ-17: öğretmen günlük PNG footer KALDIRILDI */",
                   "    '<div style=\"font-size:9.5px;color:#94a3b8\">Bu kart YKS Birebir Takip tarafından oluşturuldu</div>' +"),
  "D17-9b PNG footer YOK");

/* M7: marka geri */
kontrol("M7 PNG marka 'YKS Birebir Takip' geri geldi",
  (s) => s.replace('<div style="font-size:15px;font-weight:800;color:#0f172a">Formül Kurs</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">Günlük Ders Programı</div>',
                   '<div style="font-size:15px;font-weight:800;color:#0f172a">YKS Birebir Takip</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">Günlük Ders Programı</div>'),
  "D17-9 PNG marka 'Formül Kurs'");

/* M8: tarih/gün font büyütmesi geri alındı */
kontrol("M8 tarih/gün satırı font büyütmesi geri alındı",
  (s) => s.replace("font-size:14px;font-weight:700;color:#334155;margin-top:4px", "font-size:11px;color:#94a3b8;margin-top:2px"),
  "D17-9c PNG tarih/gün satırı büyütüldü");

/* M9: saatEtiket değiştirilir → koruma testi kırmızı */
kontrol("M9 saatEtiket slot öneki kaldırıldı (koruma)",
  (s) => s.replace('return m ? m.no + " · " + m.b + "-" + m.e : String(saat || "");', 'return m ? m.b + "-" + m.e : String(saat || "");'),
  "D17-11 saatEtiket AYNI");

rmSync(calisma, { recursive: true, force: true });
const son = sha(CANON);
let donmusOk = true;
for (const f of donmus) { if (sha(f) !== once[f]) { console.error("DONMUŞ DEĞİŞTİ: " + f); donmusOk = false; } }
console.log("canonical app.js son SHA: " + (son === CANON_SHA ? "BİREBİR OK" : "BOZUK!") + " · donmuş test tarafı: " + (donmusOk ? "11/11 AYNI" : "BOZULDU"));
process.exit(hepsi && son === CANON_SHA && donmusOk ? 0 : 1);
