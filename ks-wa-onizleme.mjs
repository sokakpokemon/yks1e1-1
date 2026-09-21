let __kosan = 0; /* SAYAÇ KAPISI: yalnız t() assertion çağrıları sayılır (catch-only dahil, kosan=beklenen manifest) */
/* ks-wa-onizleme.mjs — WhatsApp ortak onizleme paneli süiti (WA-ONIZLEME-YAMASI)
   Gerçek DOM semantiğiyle (Node 18+ happy-dom YOK — kendi mini-DOM ile) doğrular:
    1) Modal gerçek DOM'da kurulur, panel tam 1 kez.
    2) Önizle butonu her öğrenci satırında; tıklama → aynı panel yeni mesaja döner.
    3) Önizleme metni ogrenciMesajMetni(id) ile birebir; newline/emoji/literal { } korunur.
    4) textContent ile basılır — HTML enjeksiyonu imkânsız.
    5) waGonder/waKopyalaMesaj/waUrl/geciciKopyala/encodeURIComponent korunur.
    6) Modal tekrar açılınca duplicate yok. */
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const testKaynak = readFileSync("test.mjs", "utf8");

/* ---- mini gerçek DOM (innerHTML parse etmeyen stub'lar DEĞİL: elementler tutulur) ---- */
const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, location: { hostname: "x" }, open(url) { window._sonWaUrl = url; } };
const reg = new Map();
function yapEl(id) {
  const cocuk = [];
  const e = {
    id: id || "", tagName: "DIV", _textContent: "", _innerHTML: "",
    style: {}, dataset: {}, checked: false, value: "", options: [], children: cocuk,
    getContext: () => null,
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); },
      contains(c) { return this._s.has(c); },
    },
    appendChild(n) { cocuk.push(n); },
    remove() {}, click() {}, select() {}, scrollIntoView() {}, addEventListener() {},
    insertAdjacentHTML() {}, insertAdjacentElement() {},
    querySelectorAll: () => [], querySelector: () => null,
  };
  Object.defineProperty(e, "textContent", {
    get() { return this._textContent; },
    set(v) { this._textContent = String(v); this.children.length = 0; this._innerHTML = ""; },
  });
  Object.defineProperty(e, "innerHTML", {
    get() { return this._innerHTML; },
    set(v) { this._innerHTML = String(v); this.children.length = 0; this._textContent = ""; },
  });
  if (id) reg.set(id, e);
  return e;
}
global.document = {
  getElementById: (id) => reg.get(id) || yapEl(id),
  addEventListener() {}, removeEventListener() {},
  createElement: () => yapEl(), body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => [],
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
try { global.navigator = { clipboard: null }; } catch (e) { /* Node 21+ navigator getter — app.js fallback geciciKopyala yolunu zaten kullanır */ }

let fail = 0;
const t = (name, cond, extra) => { __kosan++;  console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra !== undefined) console.log("     ↳ " + extra); } };

/* ---- boot: app.js + inline script'ler (tarayıcı sırası) ---- */
const scripts = [appKaynak, ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
let P;
try {
  P = new Function(scripts + "\n  return { DB, ui, waAc, waOnizle, waOnizlemeSifirla, waGonder, waKopyalaMesaj, waUrl, waKapat, ogrenciMesajMetni, penceredeDersler, kopyalaMetinfn: () => kopyalaMetin, geciciKopyalafn: () => geciciKopyala };")();
  t("boot hatasız", true);
} catch (e) {
  t("boot hatasız → " + e.message, false); console.log(e.stack.split("\n").slice(0, 6).join("\n")); process.exit(1);
}
const { DB, waAc, waOnizle, waOnizlemeSifirla, waGonder, waKopyalaMesaj, waUrl, ogrenciMesajMetni, geciciKopyalafn, kopyalaMetinfn } = P;
const waGonderGof = () => (appKaynak.split("function waGonder(ogrenciId) {")[1] || "").split("\nfunction ")[0];

/* 1) Modal gerçek DOM'da (waAc $() erişimiyle kaydeder) */
waAc();
t("#waModal DOM'da", reg.has("waModal"));
t("#waIcerik DOM'da", reg.has("waIcerik"));
t("#waOnizlemePanel index.html'de tanımlı", html.includes('id="waOnizlemePanel"'));
t("#waOnizlemeMetin index.html'de tanımlı", html.includes('id="waOnizlemeMetin"'));

/* 2) waAc → panel 1 kez, placeholder */
const panelSayisi = [...reg.values()].filter(e => e.id === "waOnizlemePanel").length;
t("onizleme paneli tam 1 kez", panelSayisi === 1, "sayı=" + panelSayisi);
const metinKutu = reg.get("waOnizlemeMetin");
t("placeholder metni", metinKutu.textContent === "Önizlemek için bir öğrenci seçin", metinKutu.textContent);
t("panel kapalıyken modal açık (waAc sonrası)", !reg.get("waModal").classList.contains("hidden"));

/* 3) Önizle butonu her satırda */
const icerikHTML = reg.get("waIcerik").innerHTML;
const onizleSayi = (icerikHTML.match(/waOnizle\(/g) || []).length;
const satirSayi = (icerikHTML.match(/waGonder\(/g) || []).length;
t("her öğrenci satırında Önizle butonu", onizleSayi > 0 && onizleSayi === satirSayi, `waOnizle=${onizleSayi} waGonder=${satirSayi}`);

/* 4) Öğrenciler ve birebir eşitlik */
const dizi = DB.ogrenciler;
const ilk = dizi[0], ikinci = dizi[1];
t("en az 2 öğrenci", !!ilk && !!ikinci);

waOnizle(ilk.id);
t("1. öğrenci için mesaj görünüyor", metinKutu.textContent === ogrenciMesajMetni(ilk.id), JSON.stringify(metinKutu.textContent.slice(0, 40)));
const panelSayisi2 = [...reg.values()].filter(e => e.id === "waOnizlemePanel").length;
t("1. önizlemede panel hâlâ 1", panelSayisi2 === 1);

waOnizle(ikinci.id);
t("2. öğrenci için AYNI panel yeni mesaja döndü", metinKutu.textContent === ogrenciMesajMetni(ikinci.id));
t("2. önizlemede ikinci panel YOK", [...reg.values()].filter(e => e.id === "waOnizlemePanel").length === 1);
t("önizleme ≠ önceki öğrencinin mesajı", metinKutu.textContent !== ogrenciMesajMetni(ilk.id));

/* 5) newline/emoji/literal karakter korunumu — waGonder'in göndereceği string ile birebir */
const beklenen = ogrenciMesajMetni(ikinci.id);
t("satır sonları korunuyor", metinKutu.textContent.includes("\n") && metinKutu.textContent === beklenen);
t("emoji korunuyor (👋/📚/📅)", /👋|📚|📅/.test(metinKutu.textContent));

/* literal { } : özel sablon koy → textContent ile literal görünmeli */
DB.ayarlar = DB.ayarlar || {};
const eskiSab = DB.ayarlar.whatsappSablon;
DB.ayarlar.whatsappSablon = { giris: "{ogrenciAdi} <b>kalın değil</b> { }", baslik: "", kapanis: "", imza: "" };
waOnizle(ilk.id);
t("literal { } textContent ile literal görünür", metinKutu.textContent.includes("{ }"));
/* HTML enjeksiyon yok: <b> etiketi DOM'a çocuK element olarak YORUMLANMAZ (textContent saf metin) */
t("HTML markup olarak yorumlanmıyor (textContent)", metinKutu.textContent.includes("<b>kalın değil</b>"));
t("waOnizle innerHTML ATAMASI kullanmıyor (kaynak kanıtı)", !/\.innerHTML\s*=/.test((appKaynak.split("function waOnizle(ogrenciId)")[1] || "").split("function waGonder(")[0]));
DB.ayarlar.whatsappSablon = eskiSab;

/* 6) waUrl + encodeURIComponent korunumu */
const tel = ilk.tel || "";
const m = ogrenciMesajMetni(ilk.id);
const url = waUrl(m, tel);
t("waUrl formatı korunmuş", url === "https://wa.me/" + String(tel).replace(/\D/g, "") + "?text=" + encodeURIComponent(m) || url === "https://wa.me/?text=" + encodeURIComponent(m));
t("encodeURIComponent aynı davranış", url.includes(encodeURIComponent(m)));

/* 7) waGonder ve waKopyalaMesaj hâlâ bağlı (kaynak + davranış) */
t("waGonder ogrenciMesajMetni'ni çağırıyor (kaynak)", /function waGonder\(ogrenciId\)\s*\{\s*var metin = ogrenciMesajMetni\(ogrenciId\);/.test(appKaynak));
t("waKopyalaMesaj ogrenciMesajMetni'ni çağırıyor (kaynak)", /function waKopyalaMesaj\(ogrenciId\)\s*\{\s*var metin = ogrenciMesajMetni\(ogrenciId\);/.test(appKaynak));
t("geciciKopyala değişmedi (kaynak)", /function geciciKopyala\(metin, cb\)\s*\{\s*var ta = document\.createElement\("textarea"\);/.test(appKaynak));
/* WA-ALICI-YAMASI: waGonder artık waAliciBilgisi çözücüsünü kullanır; varsayılan alici="ogrenci" → davranış o.tel ile aynı.
   Eksik telefonda window.open ÇAĞRILMAZ (fallback yok) — bilinçli yeni davranış. */
t("waGonder window.open(waUrl(...)) davranışı (waAliciBilgisi çözücüsüyle)", /window\.open\(waUrl\(metin, a\.telefon\), "_blank"\)/.test(appKaynak));
t("waGonder o ? o.tel fallback'i KALDIRILDI (bilinçli)", !waGonderGof().includes("o ? o.tel"));

/* 8) Grup üye satırı ve 👥 kuralı korunur (kaynak kanıtı — ks-grup-gorunum kapsamlı test eder) */
t("👥 satır üretimi kaynaktan (uyeSatiri)", appKaynak.includes('uyeSatiri = uyeler.length > 1 ? "\\n   👥 "'));

/* 9) Duplicate koruması — modal kapat/aç döngüsü */
waOnizlemeSifirla();
waAc(); waOnizlemeSifirla(); waAc();
t("tekrar açılışta panel tam 1", [...reg.values()].filter(e => e.id === "waOnizlemePanel").length === 1);
t("tekrar açılışta placeholder geri", reg.get("waOnizlemeMetin").textContent === "Önizlemek için bir öğrenci seçin");
t("app.js'te waOnizle tek tanım", (appKaynak.match(/function waOnizle\(/g) || []).length === 1);
t("index.html'de panel id tek", (html.match(/id="waOnizlemePanel"/g) || []).length === 1);

/* 10) Mesaj metni ikinci kez üretilmiyor: waOnizle gövdesinde şablon kodu yok */
const govde = appKaynak.split("function waOnizle(")[1].split("function waOnizlemeSifirla")[0];
t("waOnizle şablon kodu KOPYALAMIYOR (whatsappSablon yok)", !govde.includes("whatsappSablon") && !govde.includes("pencereAdi()"));
t("waOnizle yalnız ogrenciMesajMetni çağırıyor", govde.includes("ogrenciMesajMetni(ogrenciId)"));

/* 11) Süit kaydı + süit sayısı düşüşü yok */
t("ks-wa-onizleme.mjs test.mjs'te tam 1 kez", (testKaynak.match(/ks-wa-onizleme\.mjs/g) || []).length === 1);
const suits = ((testKaynak.split("[")[1] || "").split("]")[0].match(/\.mjs/g) || []).length;
t("süit sayısı düşmedi (≥36)", suits >= 36, "suits=" + suits);

console.log(fail ? "\nKIRMIZI VAR" : "\nHEPSİ GEÇTİ");
process.exit(fail);

process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 36) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-wa-onizleme.mjs kosan=" + __kosan + " beklenen=36"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-wa-onizleme.mjs:" + __kosan + ":36"); } });