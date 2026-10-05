/* ks-yedek-guvenlik.mjs — D58-YEDEK-GUVENLIK süiti (salt-okuma sözleşme kapıları)
   Kapsam: (A) boot kurtarma sözleşmesi (bozuk kayıt → kurtarma anahtarı + uyarı modalı; boş kayıt → sessiz seed)
   (B) yedekOku: asama bayrağı + koşullu hata toast'u + zarf kontrolü (eski ham yedekler geriye-uyumlu)
   (C) saveDB tek-setItem sözleşmesi + index.html damga/metin.
   SUITE_DONE kapısı: tam 1 marker, kosan === beklenen === 15. app.js/index.html'e YAZMAZ. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

let __kosan = 0;
let fail = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 15) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-yedek-guvenlik.mjs kosan=" + __kosan + " beklenen=15"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-yedek-guvenlik.mjs:" + __kosan + ":15"); } });

const appKaynak = readFileSync("app.js", "utf8");
const html = readFileSync("index.html", "utf8");
const appSha = createHash("sha256").update(readFileSync("app.js")).digest("hex").slice(0, 16);

/* ================= A) Boot kurtarma sözleşmesi ================= */
console.log("A) Boot kurtarma:");
t("D58: boot kurtarma marker 3 bölgede (LS_KEY + boot IIFE + modal)", (appKaynak.match(/D58-YEDEK-GUVENLIK/g) || []).length === 3, String((appKaynak.match(/D58-YEDEK-GUVENLIK/g) || []).length));
t("LS_KEY_KURTARMA tanımı VAR + değer birebir", appKaynak.includes('var LS_KEY_KURTARMA = "yksOto_arsiv_kurtarma_v1";'));
t("eski boot satırı KALDIRILDI ('loadDB() || seedDB()' literal YOK)", !appKaynak.includes("var DB = loadDB() || seedDB();"));
t("kurtarma IIFE: kopya LS_KEY_KURTARMA'ya + durum global'i kurulur", appKaynak.includes("localStorage.setItem(LS_KEY_KURTARMA, _raw)") && appKaynak.includes("globalThis.__kurtarmaDurumu = { varMi: true, kurtarildi: _kurtarildi, boyut: _raw.length, raw: _raw };"));
t("BOŞ kayıt → sessiz seedDB (uyarı YOK — sağlıklı boot davranışı korunur)", appKaynak.includes("if (!_raw) return seedDB(); /* boş kurulum — normal yol, uyarı YOK */"));
t("kopyalama BAŞARISIZ olsa bile durum kurulur (kopya-yok dalı)", /catch \(_e\) \{\}\s*\n\s*globalThis\.__kurtarmaDurumu/.test(appKaynak));
t("uyarı modalı YALNIZ kurtarma durumunda açılır (koşullu)", appKaynak.includes("if (globalThis.__kurtarmaDurumu) {"));
t("modal: indirme aksiyonu + dosya adı + hamVeri alanı", appKaynak.includes("'Kurtarma kopyasını indir'") && appKaynak.includes("yks-kurtarma-' + todayKey()") && appKaynak.includes("hamVeri: _kd.raw"));
t("modal metni: 'silinmedi' güvencesi VAR (panik önleyici)", appKaynak.includes("İçeriği <b>silinmedi</b>"));

/* ================= B) yedekOku sözleşmesi ================= */
console.log("B) yedekOku:");
t("asama bayrağı: 'okuma' → 'onay' (yanıltıcı mesaj kökten çözüldü)", appKaynak.includes("var asama = 'okuma';") && appKaynak.includes("asama = 'onay';"));
t("hata toast'u koşullu (onay-DOM hatası 'Dosya okunamadı' DEMEZ)", appKaynak.includes("asama === 'okuma'") && appKaynak.includes("onay adımı başarısız"));
t("zarf kontrolü: uygulama/sürüm uyuşmazsa RED + return", appKaynak.includes("p.uygulama !== 'YKS Birebir Takip' || p.surum !== 1") && appKaynak.includes("sürümü desteklenmiyor"));
t("GERİYE-UYUM: sarmalayıcı açma satırı korundu (zarfsız eski ham yedek hâlâ kabul)", appKaynak.includes("var v = p.veri && p.veri.dersler ? p.veri : p;"));

/* ================= C) Genel sözleşmeler ================= */
console.log("C) Genel:");
const _ls = appKaynak.match(/localStorage\.setItem\(LS_KEY, JSON\.stringify\(DB\)\)/g) || [];
t("saveDB tek-setItem sözleşmesi korundu (LS_KEY'e yazan TAM 1 nokta)", _ls.length === 1, "bulunan LS_KEY setItem sayısı: " + _ls.length);
t("index.html: bayat 'Ayarlar sekmesi' YOK + 'Yedek Al / Yedek Yükle' VAR + damga = app.js SHA16", !html.includes("Ayarlar sekmesi") && html.includes("Yedek Al / Yedek Yükle") && html.includes("app.js?v=" + appSha));

process.exit(fail ? 1 : 0);
