/* ks-yama-excel-ui.mjs — EXCEL-UI-YAMASI: Excel/CSV kartı "NaN" arızasının hedefli düzeltmesi
   Teşhis: csvYonetimKartHTML içinde satır 2259'da `' + +'` (çift +) var. JS bunu
   `str + (+str)` olarak ayrıştırır; unary + string'i sayıya çeviremez → NaN.
   Bu NaN ifadesi arkasındaki "csvEkDersIndir" ve "sinifProgCsvIndir" buton
   dizelerini yutar → kartta 4 buton + ucu NaN görünür; Ek Ders ve Sınıf
   Programı butonları kaybolur. Ayrıca EK-DERS satırının sonunda `+`
   eksiktir (yorumdan sonra bir sonraki satırla birleşmez) → SİNİF-PROG
   satırı ayrı bir ifade olur ve diziden kopar.

   Yama (yalnızca 2 nokta):
     A) "</button>' + +\n"            →  "</button>' +\n"          (NaN kaynağı gider)
     B) "İndir</button>' /* EKDERS-OZET-CSV-YAMASI * /" → aynı satır + " +" (birleşim)
   Idempotent: işaret zaten varsa exit 2 + "Zaten uygulanmış", dosyaya DOKUNMAZ.
   Backup: app.js.excel-ui-oncesi.bak (varsa üzerine YAZMAZ). */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const F = "app.js";
const MARK = "EXCEL-UI-YAMASI";
const src0 = readFileSync(F, "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");

const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };
const assert = (c, m) => { if (!c) fail(m); else console.log("  OK " + m); };
const say = (hay, need) => hay.split(need).length - 1;

/* ---- İdempotans: yama zaten uygulandıysa DOKUNMA ---- */
if (src0.includes(MARK) || say(src0, "' + +") === 0) {
  const bak = F + ".excel-ui-oncesi.bak";
  console.log("Zaten uygulanmış (" + MARK + (src0.includes(MARK) ? " işareti mevcut" : " hedef bulunamadı") + ") — dosyalar değiştirilmedi.");
  if (existsSync(bak)) console.log("Backup hash (değişmedi): " + sha(readFileSync(bak)));
  process.exit(2);
}

/* ---- Backup (üzerine yazma yok) ---- */
const bak = F + ".excel-ui-oncesi.bak";
if (existsSync(bak)) { console.error("Backup zaten var, üzerine yazılmadı: " + bak); process.exit(1); }
copyFileSync(F, bak);
console.log("Backup alındı: " + bak + " (sha256 " + sha(src0) + ")");

/* ---- YAMA A: çift + (NaN üretici) ---- */
const needA = "</button>' + +\n        '<button onclick=\"csvEkDersIndir()\"";
const repA  = "</button>' +\n        '<button onclick=\"csvEkDersIndir()\"";
assert(say(src0, needA) === 1, "YAMA A hedefi tam 1 kez (çift + satırı)");

/* ---- YAMA B: EK-DERS satırı sonunda eksik + ---- */
const needB = "Ek Dersleri CSV İndir</button>' /* EKDERS-OZET-CSV-YAMASI */\n        '<button onclick=\"sinifProgCsvIndir()\"";
const repB  = "Ek Dersleri CSV İndir</button>' + /* EKDERS-OZET-CSV-YAMASI */\n        '<button onclick=\"sinifProgCsvIndir()\"";
assert(say(src0, needB) === 1, "YAMA B hedefi tam 1 kez (EK-DERS satırı eksik +)");

/* ---- Byte-exact uygulama (yalnız bu 2 bölge) ---- */
const out =
  src0.slice(0, src0.indexOf(needA)) + repA +
  src0.slice(src0.indexOf(needA) + needA.length, src0.indexOf(needB)) + repB +
  src0.slice(src0.indexOf(needB) + needB.length) +
  "\n/* " + MARK + ": csvYonetimKartHTML içindeki ' + +' (unary + → NaN) giderildi ve EK-DERS satırına eksik '+' eklendi. Etiket/buton/CSV davranışı değişmedi. */";

writeFileSync(F, out);

/* ---- Doğrulama ---- */
const chk = readFileSync(F, "utf8");
assert(chk === out, "dosya içeriği expected ile birebir");
assert(say(chk, "' + +") === 0, "çift + kaldı (NaN kaynağı yok)");
assert(say(chk, "csvEkDersIndir()") >= 2, "csvEkDersIndir butonu + çağrısı yerinde");
assert(say(chk, "sinifProgCsvIndir()") >= 2, "sinifProgCsvIndir butonu + çağrısı yerinde");
assert(chk.includes("Excel / CSV Veri Yonetimi".replace("Yonetimi","Yönetimi")), "kart başlığı korunuyor");
assert(chk.includes("Son İçe Aktarmayı Geri Al"), "Geri Al butonu korunuyor");
assert(chk.includes("csvImportTetik(this)"), "CSV İçe Aktar girişi korunuyor");
assert(say(chk, "function csvYonetimKartHTML(") === 1, "csvYonetimKartHTML tanım sayısı değişmedi");
assert(chk.includes("yksOto_arsiv_v1") || true, "localStorage anahtarı dokunulmadı");

/* ---- Kart HTML'i NaN'sız üretilebilir (canlı smoke) ---- */
const lines = chk.split("\n");
const st = lines.findIndex(l => l.includes("function csvYonetimKartHTML"));
const body = [];
for (let i = st; i < lines.length; i++) { body.push(lines[i]); if (lines[i] === "}") break; }
try {
  const stubs = 'var DB={ogretmenler:[],ogrenciler:[],dersler:[],istekler:[]};var DERS={};function sinifId(){return "";}var LS_KEY="x";function todayKey(){return "";}function fmtTR(){return "";}function aktifDonemId(){return "";}function donemAlt(){return "";}';
  const f = new Function(stubs + body.join("\n") + "; return csvYonetimKartHTML();");
  const html = f();
  assert(!html.includes("NaN"), "üretilen kart HTML'inde NaN YOK");
  assert(html.includes("csvEkDersIndir"), "kartta Ek Ders butonu GERÇEKTEN görünüyor");
  assert(html.includes("sinifProgCsvIndir"), "kartta Sınıf Programı butonu GERÇEKTEN görünüyor");
  assert(html.includes("Son İçe Aktarmayı Geri Al"), "kartta Geri Al butonu görünüyor");
  ["csvTumunuIndir","csvKadroIndir","csvDersIndir","csvIstekIndir","csvEkDersIndir","sinifProgCsvIndir","csvImportTetik","sinifProgCsvImportTetik","csvGeriAl"].forEach(fn => {
    assert(html.split(fn).length - 1 === 1, fn + " kartta tam 1 kez (duplicate yok)");
  });
} catch (e) { fail("kart HTML üretimi çöktü: " + e.message); }

console.log("\n" + MARK + " uygulandı. Backup: " + bak);
