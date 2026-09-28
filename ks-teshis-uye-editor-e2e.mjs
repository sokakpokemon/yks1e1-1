/* ks-teshis-uye-editor-e2e.mjs — UÇTAN UCA DOM TESTİ (fixture; app.js'e YAZMAZ, kullanıcı verisine DOKUNMAZ)
   KAPSAM (gerçek render çıktısı — havuzBolum / derslerBolum innerHTML okunur):
     A) Havuz istek kartında "Grup üyelerini ekle/çıkar" butonu HANGİ koşulda render edilir/gizlenir
     B) Buton → editör açılışı → checkbox listesi → Kaydet zinciri → istek.ogrenciIds + renderHavuz() chip tazeleme
     C) duzenle() mevcut ogrenciIds yüklemesi → üye ekle → Kaydet (planla) → ders.ogrenciIds + haftalık/günlük tablo tazeleme
   İKİ HEDEF: 1) YEREL kök dosyalar (index.html + app.js)
              2) CANLI dağıtım (https://yksbirebir.freebuff.app) — gerçek tarayıcının indirdiği BAYTLAR
   Çıkış kodu: herhangi bir kontrol kırmızıysa 1. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const CANLI = "https://yksbirebir.freebuff.app";
const sha16 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const YEREL_HTML = readFileSync("index.html", "utf8");
const YEREL_APP = readFileSync("app.js", "utf8");

const BUTON = "Grup üyelerini ekle/çıkar";
const EDITOR_BASLIK = "Grup Üyelerini Ekle/Çıkar";
const EXPORTS = "{ DB, ui, planla, duzenle, grupPanelSec, istekUyeAc, istekUyeSec, istekUyeIptal, istekUyeKaydet, renderHavuz, yenile, istekOgrenciIds, dersOgrenciIds, gorselAd }";

function kos(etiket, html, appKaynak) {
  const store = {};
  const reg = {};
  const el = (id) => {
    const e = {
      id, textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], files: null,
      classList: { _s: new Set(), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, toggle() {}, contains(c) { return this._s.has(c); } },
      insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; },
      appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, addEventListener() {}, removeEventListener() {},
      querySelectorAll: () => [], getContext: () => null
    };
    let _html = "";
    Object.defineProperty(e, "innerHTML", {
      get() { return _html; },
      set(v) { _html = String(v); [..._html.matchAll(/id="([^"]+)"/g)].forEach((m) => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }
    });
    reg[id] = e;
    return e;
  };
  for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
  globalThis.tailwind = {};
  global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
  global.window.html2canvas = function () { return Promise.reject(new Error("stub")); };
  if (!globalThis.navigator) globalThis.navigator = {};
  global.document = {
    getElementById: (i) => reg[i] || null, addEventListener() {}, removeEventListener() {},
    createElement: () => el("anon" + Math.random()), body: { appendChild() {}, removeChild() {} }, querySelectorAll() { return []; }
  };
  global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
  global.Chart = function () { this.destroy = () => {}; };

  const sonuc = [];
  let fail = 0;
  const t = (name, cond, extra) => { sonuc.push({ name, cond: !!cond }); if (!cond) { fail = 1; if (extra !== undefined) sonuc.push({ ek: "↳ " + extra }); } };

  const scripts = [appKaynak,
    ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])].join("\n;\n");

  let P;
  try {
    P = new Function(scripts + "\n  yenile();\n  return " + EXPORTS + ";\n")();
    t("boot hatasız (app.js + inline script değerlendirildi)", true);
  } catch (e) {
    console.error(e.stack ? e.stack.split("\n").slice(0, 8).join("\n") : e);
    return { fail: 1, sonuc: [{ name: "BOOT HATASI", cond: false }] };
  }
  const { DB, ui, planla, duzenle, grupPanelSec, istekUyeAc, istekUyeSec, istekUyeIptal, istekUyeKaydet, renderHavuz, yenile, istekOgrenciIds, dersOgrenciIds, gorselAd } = P;

  /* ---------- FIXTURE (mevcut demo öğrencileri; kullanıcı verisi DEĞİL) ---------- */
  const adG = (o) => gorselAd(o.ad);
  const ana = DB.ogrenciler.find((o) => o.ad === "Ayşe Demir");
  const ek1 = DB.ogrenciler.find((o) => o.ad === "Zeynep Kaya");
  const ek2 = DB.ogrenciler.find((o) => o.ad === "Emir Aydın");
  const yeni = DB.ogrenciler.find((o) => o.ad === "Elif Koç");
  [ana, ek1, ek2, yeni].forEach((o) => { o.sinif = ""; }); /* sınıf-programı çakışma sinyalini kapat */
  const ogr = DB.ogretmenler.find((x) => x.ad === "SONER AÇIKGÖZ") || DB.ogretmenler[0];
  ogr.avail = { sinif: {}, musait: [] };
  const DERSID = ogr.brans || "mat";

  DB.dersler = [];
  const w1 = { id: "fx-w1", ogrenciId: ana.id, ogrenciAd: ana.ad, ogrenciIds: [ek1.id], dersId: DERSID, konu: "", durum: "bekliyor", olusturma: "2026-09-01", donemId: DB.aktifDonemId };
  const w2 = { id: "fx-w2", ogrenciId: ek2.id, ogrenciAd: ek2.ad, dersId: DERSID, konu: "", durum: "bekliyor", olusturma: "2026-09-02", donemId: DB.aktifDonemId };
  const p1 = { id: "fx-p1", ogrenciId: ana.id, ogrenciAd: ana.ad, dersId: DERSID, konu: "", durum: "planlandi", olusturma: "2026-09-03", donemId: DB.aktifDonemId };
  const w3 = { id: "fx-w3", ogrenciId: ana.id, ogrenciAd: ana.ad, dersId: DERSID, konu: "", durum: "bekliyor", olusturma: "2026-09-04", donemId: "donem-yok-boyle" };
  DB.istekler = [w1, w2, p1, w3];
  ui.istekFiltre = "";

  const kartBlok = (h, id) => { const i = h.indexOf('data-istek="' + id + '"'); if (i < 0) return ""; const j = h.indexOf('data-istek="', i + 12); return h.slice(i, j < 0 ? h.length : j); };
  const kutu = (h, rid, oid) => { const k = 'onchange="istekUyeSec(\'' + rid + '\',\'' + oid + '\')"'; const i = h.indexOf(k); if (i < 0) return null; const j = h.lastIndexOf("<input", i); return h.slice(j, i); };

  /* ================= A) BUTON GÖRÜNÜRLÜK KOŞULU ================= */
  let h = "";
  try { renderHavuz(); h = reg["havuzBolum"].innerHTML; } catch (e) { t("renderHavuz() hatasız çalışır", false, String(e)); }
  t("A1 renderHavuz() havuzBolum markup'ı üretir", h.length > 0);
  t("A2 durum=bekliyor kartında \"" + BUTON + "\" butonu DOM'da VAR", h.includes(BUTON));
  t("A3 buton onclick'i istekUyeAc('" + w1.id + "') ile bağlı", h.includes('istekUyeAc(\'' + w1.id + '\')'));
  t("A4 buton etiketinde üye sayısı doğru (" + BUTON + " (2))", h.includes(BUTON + " (2)"));
  const sayiAc = (h.match(/istekUyeAc\(/g) || []).length;
  t("A5 ogrenciIds YOK/BOŞ bekleyen istek de butonu GÖRÜR ⇒ gizlenme koşulu DEĞİL (istekUyeAc sayısı = 2)", sayiAc === 2, "sayı=" + sayiAc);
  t("A6 durum=planlandi kartında buton YOK (kart render edilir ama buton eklenmez)", h.includes('data-istek="' + p1.id + '"') && !h.includes('istekUyeAc(\'' + p1.id + '\')'));
  t("A7 aktif dönem dışı istek hiç render edilmez (butonu da yok)", !h.includes('data-istek="' + w3.id + '"') && !h.includes('istekUyeAc(\'' + w3.id + '\')'));

  /* ================= B) EDİTÖR + KAYDET ZİNCİRİ ================= */
  istekUyeAc(w1.id);
  t("B1 istekUyeAc editörü açar + taslak = mevcut üyeler", ui.istekUyeId === w1.id && JSON.stringify(ui.istekUyeTaslak) === JSON.stringify([ana.id, ek1.id]));
  h = reg["havuzBolum"].innerHTML;
  t("B2 açık editör markup'ı DOM'da (başlık + Kaydet + İptal)", h.includes(EDITOR_BASLIK) && h.includes('istekUyeKaydet(\'' + w1.id + '\')') && h.includes("istekUyeIptal()"));
  const kutuSayi = (h.match(new RegExp('onchange="istekUyeSec\\(\'' + w1.id + '\'', "g")) || []).length;
  t("B3 checkbox listesi: her öğrenci için 1 satır (" + DB.ogrenciler.length + ")", kutuSayi === DB.ogrenciler.length, "satır=" + kutuSayi);
  const kAna = kutu(h, w1.id, ana.id), kEk1 = kutu(h, w1.id, ek1.id), kYeni = kutu(h, w1.id, yeni.id);
  t("B4 taslaktaki üyeler (ana + ek) checkbox'ta checked", !!kAna && kAna.includes("checked") && !!kEk1 && kEk1.includes("checked"));
  t("B5 taslakta olmayan üye unchecked", !!kYeni && !kYeni.includes("checked"));

  istekUyeSec(w1.id, yeni.id); /* ÜYE EKLE */
  h = reg["havuzBolum"].innerHTML;
  t("B6 istekUyeSec ekle → taslak büyür + DOM'da checkbox checked tazelenir", ui.istekUyeTaslak.length === 3 && ui.istekUyeTaslak.includes(yeni.id) && (kutu(h, w1.id, yeni.id) || "").includes("checked"));
  istekUyeSec(w1.id, ek1.id); /* ÜYE ÇIKAR */
  h = reg["havuzBolum"].innerHTML;
  t("B7 istekUyeSec çıkar → taslak küçülür + DOM'da checkbox unchecked tazelenir", ui.istekUyeTaslak.indexOf(ek1.id) === -1 && !(kutu(h, w1.id, ek1.id) || "x").includes("checked"));

  istekUyeKaydet(w1.id);
  t("B8 Kaydet → istek.ogrenciIds GERÇEKTEN güncellendi (ana hariç, sıra korunur)", JSON.stringify(w1.ogrenciIds) === JSON.stringify([yeni.id]) && w1.ogrenciId === ana.id, "ogrenciIds=" + JSON.stringify(w1.ogrenciIds));
  t("B9 Kaydet → istekOgrenciIds = [ana, yeni]", JSON.stringify(istekOgrenciIds(w1)) === JSON.stringify([ana.id, yeni.id]));
  h = reg["havuzBolum"].innerHTML;
  const blok = kartBlok(h, w1.id);
  t("B10 Kaydet sonrası renderHavuz() chipleri tazeledi: YENİ üye chip'te", blok.includes(adG(yeni)));
  t("B11 Kaydet sonrası ÇIKARILAN üye chip'ten düştü", !blok.includes(adG(ek1)));
  t("B12 Kaydet sonrası buton etiketi güncellendi (" + BUTON + " (2))", blok.includes(BUTON + " (2)"));
  t("B13 Kaydet sonrası editör KAPANDI (ui.istekUyeId = null, taslak boş)", ui.istekUyeId === null && ui.istekUyeTaslak.length === 0);

  const oncekiIds = JSON.stringify(w1.ogrenciIds);
  istekUyeAc(w1.id); ui.istekUyeTaslak = []; istekUyeKaydet(w1.id);
  t("B14 boş taslakla Kaydet → istek.ogrenciIds DEĞİŞMEZ (guard)", JSON.stringify(w1.ogrenciIds) === oncekiIds);
  istekUyeIptal();
  istekUyeAc(p1.id);
  t("B15 planlandi istekte istekUyeAc editörü AÇMAZ", ui.istekUyeId === null);

  /* ================= C) duzenle() + HAFTALIK/GÜNLÜK TABLO ================= */
  const pzt = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
  const SLOT = "15:30";
  const formKur = (ekler) => {
    ui.grupPanelBaglam = "plan"; ui.panelSecim = { acik: false, arama: "", sinif: "", anaId: ana.id };
    ui.editId = null; ui.aktifIstekId = null; ui.uyeDegisti = false;
    reg["f-ogrenci"].value = ana.ad; reg["f-ders"].value = DERSID; reg["f-konu"].value = "Ortak konu";
    reg["f-ogretmen"].value = ogr.ad; reg["f-tarih"].value = pzt; reg["f-saat"].value = SLOT; reg["f-yoksay"].checked = false;
    ui.ekOgrenciIds = ekler.slice();
  };
  ui.filtre = "hafta"; ui.gunSecim = ""; ui.haftalikOgrtId = ogr.id;

  DB.dersler = [];
  formKur([ek1.id]);
  planla();
  const L = DB.dersler[DB.dersler.length - 1];
  t("C1 planla() yeni grup dersi: ogrenciIds = [ek]", !!L && JSON.stringify(L.ogrenciIds) === JSON.stringify([ek1.id]), L ? JSON.stringify(L.ogrenciIds) : "kayıt yok");

  duzenle(L.id);
  t("C2 duzenle() mevcut ogrenciIds'i panele YÜKLER + panel açık", JSON.stringify(ui.ekOgrenciIds) === JSON.stringify([ek1.id]) && !!ui.panelSecim && ui.panelSecim.acik === true);
  const ozet = reg["grup-ozet"] ? reg["grup-ozet"].innerHTML : "";
  t("C3 düzenleme DOM kanıtı: grup özeti \"2 öğrenci seçildi\" + ek üye chip'i", ozet.includes("2 öğrenci seçildi") && ozet.includes(adG(ek1)));

  grupPanelSec(yeni.id);
  t("C4 panelden üye ekle → ui.ekOgrenciIds = [ek, yeni] + uyeDegisti", JSON.stringify(ui.ekOgrenciIds) === JSON.stringify([ek1.id, yeni.id]) && ui.uyeDegisti === true);

  planla(); /* Değişiklikleri Kaydet */
  t("C5 Kaydet → ders.ogrenciIds = [ek, yeni] (kalıcı)", JSON.stringify(dersOgrenciIds(L)) === JSON.stringify([ana.id, ek1.id, yeni.id]), JSON.stringify(dersOgrenciIds(L)));
  const dHafta = reg["derslerBolum"].innerHTML;
  t("C6 HAFTALIK tablo tazelendi + İKİ üye TAM ad", dHafta.includes(adG(ek1)) && dHafta.includes(adG(yeni)));
  ui.filtre = "gun"; ui.gunSecim = pzt; yenile();
  const dGun = reg["derslerBolum"].innerHTML;
  t("C7 GÜNLÜK tablo tazelendi + İKİ üye TAM ad", dGun.includes(adG(ek1)) && dGun.includes(adG(yeni)));

  return { fail, sonuc };
}

/* ---------- RAPOR ---------- */
let kirik = 0;
function yazdir(etiket, r) {
  console.log("\n=== " + etiket + " ===");
  r.sonuc.forEach((s) => { if (s.ek) console.log("     " + s.ek); else console.log((s.cond ? "  ✓ " : "  ✗ ") + s.name); });
  const top = r.sonuc.filter((s) => !s.ek).length, kac = r.sonuc.filter((s) => !s.ek && !s.cond).length;
  console.log("→ " + (top - kac) + "/" + top + (kac ? " KIRMIZI: " + kac : " YEŞİL"));
  if (r.fail) kirik = 1;
}

const yerelSha = sha16(YEREL_APP);
yazdir("1) YEREL KÖK (app.js sha16 " + yerelSha + ")", kos("yerel", YEREL_HTML, YEREL_APP));

let canliOk = false;
try {
  const yh = await (await fetch(CANLI + "/index.html", { redirect: "follow" })).text();
  const ya = await (await fetch(CANLI + "/app.js", { redirect: "follow" })).text();
  canliOk = true;
  const canliSha = sha16(ya);
  console.log("\n[i] CANLI app.js sha16 = " + canliSha + " (" + ya.length + " B) · YEREL = " + yerelSha + " (" + YEREL_APP.length + " B)");
  console.log("[i] CANLI index.html damgası app.js?v=" + canliSha + " içeriyor mu: " + yh.includes("app.js?v=" + canliSha));
  yazdir("2) CANLI DAĞITIM (" + CANLI + " — tarayıcının indirdiği baytlar)", kos("canli", yh, ya));
} catch (e) {
  console.log("\n[!] CANLI dağıtıma erişilemedi (" + e.message + ") — yalnız yerel koşuldu.");
}

console.log("\n" + (kirik ? "SONUÇ: KIRIK VAR (yukarıdaki ✗ satırlarına bak)" : "SONUÇ: TÜM KONTROLLER YEŞİL — editör uçtan uca çalışıyor"));
process.exit(kirik);
