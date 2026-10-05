/* ks-yama-d58-yedek-guvenlik.mjs — D58-YEDEK-GUVENLIK
   (1) Boot kurtarma: bozuk LS kaydı sessiz seed'e gitmez → kurtarma anahtarı + bellek kopyası + uyarı modalı (indirme aksiyonlu)
   (2) yedekOku: 'asama' bayrağı — onay-DOM hatası artık 'Dosya okunamadı' demez
   (3) yedekOku: zarflı yedekte uygulama/sürüm kontrolü (eski ham yedekler uyumlu kalır)
   (4) index.html L286 bayat 'Ayarlar sekmesi' metni
   Idempotent: marker varsa exit 2. Anchor yoksa YAZMADAN exit 1 + bağlam. */
import { readFileSync, writeFileSync, copyFileSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha16 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);
const MARK = "D58-YEDEK-GUVENLIK";

const appOnceRaw = readFileSync("app.js", "utf8");
const idxOnceRaw = readFileSync("index.html", "utf8");

if (appOnceRaw.includes(MARK)) { console.log("Zaten uygulanmış — no-op"); process.exit(2); }

console.log("ÖNCE app.js", statSync("app.js").size + "B", sha16("app.js"));
console.log("ÖNCE index.html", statSync("index.html").size + "B", sha16("index.html"));

const tek = (t, s, ad) => { const n = t.split(s).length - 1; if (n !== 1) { console.error("ANCHOR FAIL: '" + ad + "' " + n + " kez (1 bekleniyordu)"); process.exit(1); } return t.indexOf(s); };

const app = appOnceRaw;
let i = tek(app, 'LS_KEY = "yksOto_arsiv_v1"', "LS_KEY tanımı");
const iNokta = app.indexOf(";", i);
if (iNokta < 0) { console.error("ANCHOR A1: ';' yok — around LS_KEY"); process.exit(1); }
const ekle1 = '; /* D58-YEDEK-GUVENLIK: bozuk kayıt kurtarma alanı */\n  var LS_KEY_KURTARMA = "yksOto_arsiv_kurtarma_v1";';
const app2 = app.slice(0, iNokta) + ekle1 + app.slice(iNokta + 1);

const BOOT_ESKI = "var DB = loadDB() || seedDB();";
const BOOT_YENI = [
"/* D58-YEDEK-GUVENLIK: bozuk kayıt sessiz seed'e YOL YOK — kurtar, sonra uyar */",
"var DB = (function () {",
"  var _d = loadDB();",
"  if (_d) return _d;",
"  var _raw = '';",
"  try { _raw = localStorage.getItem(LS_KEY) || ''; } catch (_e) { _raw = ''; }",
"  if (!_raw) return seedDB(); /* boş kurulum — normal yol, uyarı YOK */",
"  var _kurtarildi = false;",
"  try { localStorage.setItem(LS_KEY_KURTARMA, _raw); _kurtarildi = true; } catch (_e) {}",
"  globalThis.__kurtarmaDurumu = { varMi: true, kurtarildi: _kurtarildi, boyut: _raw.length, raw: _raw };",
"  return seedDB();",
"})();",
].join("\n");
const idxBoot = tek(app2, BOOT_ESKI, "boot satırı");
const app3 = app2.slice(0, idxBoot) + BOOT_YENI + app2.slice(idxBoot + BOOT_ESKI.length);

const ONAR = "sinifOgrtUyumOnar(DB, true);";
i = tek(app3, ONAR, "sinifOgrtUyumOnar(DB, true)");
const MODAL = [
ONAR,
"",
"/* D58-YEDEK-GUVENLIK: bozuk kayıt uyarısı — yalnız kurtarma yolu tetiklendiyse */",
"if (globalThis.__kurtarmaDurumu) {",
"  var _kd = globalThis.__kurtarmaDurumu;",
"  onayAc({ baslik: 'Veri kurtarma uyarısı',",
"    metin: 'Kayıtlı veriniz (<b>' + _kd.boyut + ' bayt</b>) okunamadı — hasarlı görünüyor. ' +",
"      (_kd.kurtarildi ? 'İçeriği <b>silinmedi</b>: kopyası kurtarma alanına alındı (yksOto_arsiv_kurtarma_v1). ' : 'Kopyalama alanı yazılamadı, ancak veri hâlâ yerinde. ') +",
"      'Uygulama şimdilik boş/demo veriyle açıldı. Kurtarma kopyasını dosya olarak indirmek için onaylayın.',",
"    onay: 'Kurtarma kopyasını indir', tehlikeli: true },",
"    function () {",
"      try {",
"        var _paket = JSON.stringify({ uygulama: 'YKS Birebir Takip', kurtarma: true, surum: 1, tarih: new Date().toISOString(), hamVeri: _kd.raw });",
"        var _b = new Blob([_paket], { type: 'application/json' });",
"        var _u = URL.createObjectURL(_b);",
"        var _a = document.createElement('a');",
"        _a.href = _u; _a.download = 'yks-kurtarma-' + todayKey() + '.json';",
"        document.body.appendChild(_a); _a.click(); _a.remove();",
"        setTimeout(function () { URL.revokeObjectURL(_u); }, 4000);",
"        toast('Kurtarma kopyası indirildi ✓');",
"      } catch (e) { toast('Kurtarma kopyası indirilemedi: ' + e.message, 'hata'); }",
"    });",
"}",
].join("\n");
const app4 = app3.slice(0, i) + MODAL + app3.slice(i + ONAR.length);

const V_ESKI = "var v = p.veri && p.veri.dersler ? p.veri : p;";
const V_YENI = V_ESKI + "\n      if (p.veri && p.veri.dersler && (p.uygulama !== 'YKS Birebir Takip' || p.surum !== 1)) { toast('Bu yedek dosyası bu uygulamaya ait değil veya sürümü desteklenmiyor — yüklenmedi.', 'hata'); return; }";
i = tek(app4, V_ESKI, "yedekOku sarmalayıcı açma");
const app5 = app4.slice(0, i) + V_YENI + app4.slice(i + V_ESKI.length);

const IF_ESKI = "if (!f) return;";
i = tek(app5, IF_ESKI, "yedekOku if (!f)");
const app6 = app5.slice(0, i) + IF_ESKI + " var asama = 'okuma';" + app5.slice(i + IF_ESKI.length);

const ONAY_AC = 'onayAc({\n        baslik: "Yedekten veri yüklensin mi?",';
i = tek(app6, ONAY_AC, "yedekOku onayAc");
const app7 = app6.slice(0, i) + "asama = 'onay'; " + app6.slice(i + ONAY_AC.length);

const TOAST_ESKI = 'toast("Dosya okunamadı — geçerli bir YKS Birebir Takip yedek dosyası seçin.", "hata");';
const TOAST_YENI = 'toast(asama === \'okuma\' ? "Dosya okunamadı — geçerli bir YKS Birebir Takip yedek dosyası seçin." : "Beklenmeyen bir hata oluştu (dosya okundu, onay adımı başarısız) — sayfayı yenileyip tekrar deneyin.", "hata");';
i = tek(app7, TOAST_ESKI, "yedekOku hata toast'u");
const app8 = app7.slice(0, i) + TOAST_YENI + app7.slice(i + TOAST_ESKI.length);

const IDX_ESKI = "Yedekleme &gt; Ayarlar";
i = tek(idxOnceRaw, IDX_ESKI, "index.html bayat metin");
const IDX_YENI = idxOnceRaw.replace(IDX_ESKI, "Sağ üstteki Yedek Al / Yedek Yükle butonları");

if (!existsSync("app.js.d58-oncesi.bak")) copyFileSync("app.js", "app.js.d58-oncesi.bak");
if (!existsSync("index.html.d58-oncesi.bak")) copyFileSync("index.html", "index.html.d58-oncesi.bak");
writeFileSync("app.js", app8);
writeFileSync("index.html", IDX_YENI);
for (const k of ["public/app.js", "dist/app.js", "isolate/app.js"]) writeFileSync(k, app8);
for (const k of ["dist/index.html", "isolate/index.html"]) writeFileSync(k, IDX_YENI);

console.log("Yeni app.js SHA16:", sha16("app.js"), "· byte:", statSync("app.js").size);
console.log("marker sayıları: app.js=" + (app8.split(MARK).length - 1) + " · index.html=" + (IDX_YENI.split("D58").length - 1));
console.log("Damga:", (IDX_YENI.match(/app\.js\?v=[0-9a-f]{16}/g) || []).join(" "));
console.log("ek-ders.js DOKUNULMADI:", sha16("ek-ders.js"));
console.log("Yedek: app.js.d58-oncesi.bak · index.html.d58-oncesi.bak");
