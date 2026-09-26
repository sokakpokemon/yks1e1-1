/* ks-dongu27.mjs — DÖNGÜ-27 süiti: GRUP ÜYELERİ WHATSAPP AKIŞI DOĞRULAMASI
   Fixture: PAZAR Emir(ana)+Yusuf(ek) grup dersi + Yusuf'un Çarşamba tekli dersi
   (Çarşamba mesajı tekli dersin kanıtıdır; Pazar grup dersi ayrı gerçek fixture).
   Kapsam: (A) waAc alıcı listesi — iki üye ayrı satır, doğru ders sayıları,
   telefonu olmayan üye davranışı; (B) ogrenciMesajMetni — Emir ve Yusuf'un
   mesajlarında kendi dersleri + Pazar grup dersi, üçüncü öğrenciye sızma YOK;
   (C) tekli regresyon: birebir mesaj birebir aynı, waAc tekli satır.
   Desen: ks-dongu26.mjs ile aynı boot + gerçek DOM id kayıt defteri. */
let __kosan = 0;
process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 31) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-dongu27.mjs kosan=" + __kosan + " beklenen=30"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-dongu27.mjs:" + __kosan + ":31"); } });
import { readFileSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
const scripts = [readFileSync("app.js", "utf8"), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");

const store = {};
globalThis.tailwind = {};
global.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open: () => {}, location: { hostname: "x" } };
const elStub = () => ({ options: [], getContext: () => null, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, innerHTML: "", textContent: "", value: "", appendChild() {}, remove() {}, click() {}, scrollIntoView() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] });
global.document = {
  getElementById: () => elStub(),
  addEventListener() {}, removeEventListener() {},
  createElement: () => elStub(),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll: () => []
};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };

let fail = 0;
const t = (name, cond, extra) => { __kosan++; console.log((cond ? "  ✓" : "  ✗") + " " + name); if (!cond) { fail = 1; if (extra) console.log("     ↳ " + extra); } };

/* boot + gerçek DOM id kayıt defteri (ks-dongu26.mjs deseni) */
const reg = {};
const el = (id) => {
  if (reg[id]) return reg[id];
  const e = { id, textContent: "", value: "", checked: false, style: {}, dataset: {}, options: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, insertAdjacentHTML(_p, h) { e.innerHTML = e.innerHTML + h; }, appendChild() {}, remove() {}, click() {}, focus() {}, addEventListener() {}, scrollIntoView() {}, querySelectorAll: () => [], getContext: () => null };
  let _html = "";
  Object.defineProperty(e, "innerHTML", {
    get() { return _html; },
    set(v) { _html = String(v); [..._html.matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg[m[1]]) reg[m[1]] = el(m[1]); }); }
  });
  reg[id] = e;
  return e;
};
for (const m of html.matchAll(/id="([^"]+)"/g)) el(m[1]);
global.document = {
  getElementById: (i) => reg[i] || null,
  addEventListener() {}, removeEventListener() {},
  createElement: () => el("anon" + Math.random()),
  body: { appendChild() {}, removeChild() {} },
  querySelectorAll() { return []; }
};
let P;
try {
  P = new Function(scripts + "\n return { DB, ui, waAc, ogrenciMesajMetni, dersOgrenciIds, penceredeDersler };\n")();
  t("boot hatasız", true);
} catch (e) {
  console.error(e.stack ? e.stack.split("\n").slice(0, 6).join("\n") : e);
  throw e;
}
const { DB, ui, waAc, ogrenciMesajMetni, dersOgrenciIds, penceredeDersler } = P;

/* ---- PAZAR fixture tarihleri: gelecek haftanın Pazar'ı + bir sonraki Çarşamba ---- */
const gelecekPazar = (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const gelecekCarsamba = (() => { const d = new Date(gelecekPazar + "T00:00:00"); d.setDate(d.getDate() + 3); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const pazarGun = 6, carsambaGun = 3;

/* ================= A) Gerçek fixture: Pazar Emir+Yusuf grup dersi ================= */
console.log("A) Fixture kurulumu (Pazar Emir+Yusuf grup + Çarşamba Yusuf tekli):");
/* Öğrenciler: gerçek DB'den üç öğrenci; roller Emir=ana, Yusuf=ek, üçüncü=sızma kanıtı */
const [emir, yusuf, ucuncu] = DB.ogrenciler.slice(0, 3);
const ogrt = DB.ogretmenler[0];
/* Hedef pencere izole edilir: seed dersleri tamamen kaldırılır (sayı/sızma kanıtı deterministik) */
DB.dersler = [];
/* Pazar grup dersi: ogrenciId=Emir, ogrenciIds=[Yusuf] */
DB.dersler.push({ id: "d27-pazar-grup", ogrenciId: emir.id, ogrenciIds: [yusuf.id], ogrenciAd: emir.ad, dersId: ogrt.brans, konu: "Pazar grup konusu", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: gelecekPazar, saat: "09:40", kod: "2", durum: "planlandi", olusturma: "2026-09-26", donemId: DB.aktifDonemId });
/* Çarşamba Yusuf TEKLİ dersi (ekrandaki mesajın karşılığı; grup kanıtı DEĞİL) */
DB.dersler.push({ id: "d27-carsamba-tekli", ogrenciId: yusuf.id, ogrenciAd: yusuf.ad, dersId: ogrt.brans, konu: "Çarşamba tekli konu", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: gelecekCarsamba, saat: "13:00", kod: "6", durum: "planlandi", olusturma: "2026-09-26", donemId: DB.aktifDonemId });
t("Pazar ders kaydı: TEK kayıt, ogrenciId=Emir, ogrenciIds=[Yusuf]", (() => { const l = DB.dersler.filter(x => x.tarih === gelecekPazar); return l.length === 1 && l[0].ogrenciId === emir.id && Array.isArray(l[0].ogrenciIds) && l[0].ogrenciIds.join("|") === yusuf.id; })());
t("dersOgrenciIds(Pazar dersi) = [Emir, Yusuf]", JSON.stringify(dersOgrenciIds(DB.dersler.find(x => x.id === "d27-pazar-grup"))) === JSON.stringify([emir.id, yusuf.id]));

/* ================= B) waAc: alıcı listesi + ders sayıları ================= */
console.log("B) waAc alıcı listesi:");
/* pencere: tüm zamanlar penceresine sabitlenir (tarih penceresi bağımsızlığı) */
ui.filtre = "tumu";
/* waAc render'ı reg üzerinden okunur: waIcerik innerHTML'de her üye için ayrı satır (waGonder id'li butonlar) */
waAc();
const waHTML = reg["waIcerik"] ? reg["waIcerik"].innerHTML : "";
const gonderBtnler = [...waHTML.matchAll(/waGonder\('([^']+)'\)/g)].map(m => m[1]);
t("alıcı listesinde Emir satırı VAR", gonderBtnler.includes(emir.id));
t("alıcı listesinde Yusuf satırı VAR (DÖNGÜ-27 öncesi YOKTU)", gonderBtnler.includes(yusuf.id));
t("alıcı listesinde üçüncü öğrenci YOK (sızma yok)", !gonderBtnler.includes(ucuncu.id));
t("alıcı satırları benzersiz (grup dersi kişi başı 1 kez)", gonderBtnler.filter(i => i === emir.id).length === 1 && gonderBtnler.filter(i => i === yusuf.id).length === 1);
/* Ders sayıları: Emir=1 (Pazar), Yusuf=2 (Pazar+Çarşamba) */
const satir = (id) => { const idx = waHTML.indexOf("waGonder('" + id + "')"); return idx === -1 ? "" : waHTML.slice(Math.max(0, idx - 400), idx + 100); };
const emirN = (satir(emir.id).match(/(\d+) ders/) || [])[1];
const yusufN = (satir(yusuf.id).match(/(\d+) ders/) || [])[1];
t("Emir ders sayacı = 1 (yalnız Pazar grup dersi)", emirN === "1", emirN);
t("Yusuf ders sayacı = 2 (Çarşamba + Pazar grup dersi)", yusufN === "2", yusufN);
/* waAlt özeti: 2 öğrenci */
const waAlt = reg["waAlt"] ? reg["waAlt"].textContent : "";
t("waAlt özeti '2 öğrenci' der", waAlt.includes("2 öğrenci"), waAlt);

/* Telefon: her üye kendi kaydından — Yusuf'un telefonu silinirse satır yine VAR ama waGonder
   uyarı verir (varMi=false fallback YOK). Burada liste-düzeyi davranış kanıtlanır: */
const yusufTel = yusuf.tel; yusuf.tel = "";
waAc();
const waHTML2 = reg["waIcerik"] ? reg["waIcerik"].innerHTML : "";
t("telefonsuz üye (Yusuf) alıcı listesinde YİNE VAR (liste dışına atılmaz)", [...waHTML2.matchAll(/waGonder\('([^']+)'\)/g)].map(m => m[1]).includes(yusuf.id));
yusuf.tel = yusufTel;
t("telefonu olmayan üye davranışı: waGonder varMi=false fallback YOK (kaynak kanıtı)", waGonderKaynakKaniti());

function waGonderKaynakKaniti() {
  const src = readFileSync("app.js", "utf8");
  const m = src.match(/function waGonder\(ogrenciId\) \{[\s\S]*?\n\}/);
  return !!m && m[0].includes("a.varMi") && m[0].includes("telefonu kayitli degil");
}

/* ================= C) ogrenciMesajMetni: üye mesajları ================= */
console.log("C) WA mesaj içerikleri:");
const emirMetin = ogrenciMesajMetni(emir.id);
const yusufMetin = ogrenciMesajMetni(yusuf.id);
const ucuncuMetin = ogrenciMesajMetni(ucuncu.id);
t("Emir mesajı üretildi", typeof emirMetin === "string" && emirMetin.length > 0);
t("Emir mesajında PAZAR grup dersi VAR (gün adı)", !!emirMetin && emirMetin.includes("Pazar"));
t("Emir mesajında Çarşamba tekli dersi YOK", !!emirMetin && !emirMetin.includes("Çarşamba"));
t("Yusuf mesajı üretildi (DÖNGÜ-27 öncesi null/boştu)", typeof yusufMetin === "string" && yusufMetin.length > 0);
t("Yusuf mesajında Çarşamba TEKLİ dersi VAR", !!yusufMetin && yusufMetin.includes("Çarşamba"));
t("Yusuf mesajında PAZAR grup dersi VAR", !!yusufMetin && yusufMetin.includes("Pazar"));
t("Yusuf mesajında 2 ders bölümü VAR", !!yusufMetin && (yusufMetin.match(/\n1\. /g) || []).length === 1 && (yusufMetin.match(/\n2\. /g) || []).length === 1, yusufMetin);
t("üçüncü öğrenciye ders SIZMAZ (mesaj null)", ucuncuMetin === null);
t("D25 şablonu korundu: imza satırı her iki mesajda", !!emirMetin && !!yusufMetin && emirMetin.includes("— FORMÜL KURS REHBERLİK SERVİSİ") && yusufMetin.includes("— FORMÜL KURS REHBERLİK SERVİSİ"));
t("D25 saat aralığı korundu: Yusuf Çarşamba 13:00-13:40", !!yusufMetin && yusufMetin.includes("13:00 - 13:40"), yusufMetin);
/* İptal filtresi (DÖNGÜ-25'ten devralınan): iptal ders üye mesajına sızamaz */
DB.dersler.push({ id: "d27-iptal", ogrenciId: yusuf.id, ogrenciAd: yusuf.ad, dersId: ogrt.brans, konu: "İptal konu", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: (() => { const d = new Date(gelecekPazar + "T00:00:00"); d.setDate(d.getDate() + 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })(), saat: "15:30", kod: "8", durum: "iptal", olusturma: "2026-09-26", donemId: DB.aktifDonemId });
const yusufIptalMetin = ogrenciMesajMetni(yusuf.id);
t("iptal dersi üye mesajına SIZMAZ (iptal filtresi korundu)", !!yusufIptalMetin && !yusufIptalMetin.includes("İptal konu"));
t("iptal dersi üye mesajına saat/tarihiyle de girmez (tam filtre)", !!yusufIptalMetin && !yusufIptalMetin.includes("15:30"));
DB.dersler = DB.dersler.filter(x => x.id !== "d27-iptal");

/* ================= D) Tekli regresyon ================= */
console.log("D) Tekli regresyon:");
/* waAc tekli: grup temizlenir, yalnız Yusuf'un Çarşamba dersi kalır */
DB.dersler = DB.dersler.filter(x => x.id !== "d27-pazar-grup");
waAc();
const waHTML3 = reg["waIcerik"] ? reg["waIcerik"].innerHTML : "";
const btnler3 = [...waHTML3.matchAll(/waGonder\('([^']+)'\)/g)].map(m => m[1]);
t("tekli-only: alıcı listesinde yalnız Yusuf VAR", btnler3.length === 1 && btnler3[0] === yusuf.id);
const yusufN3 = (waHTML3.match(/(\d+) ders/) || [])[1];
t("tekli-only: Yusuf sayacı = 1", yusufN3 === "1", yusufN3);
const yusufTek = ogrenciMesajMetni(yusuf.id);
t("tekli mesaj: yalnız Çarşamba bölümü, Pazar YOK", !!yusufTek && (yusufTek.match(/\n1\. /g) || []).length === 1 && !yusufTek.includes("\n2\. "));
t("tekli mesaj: grup olmayan ders sayısı bozulmaz (penceredeDersler 1 kayıt)", penceredeDersler().filter(x => x.durum !== "iptal").length === 1);
const emirTek = ogrenciMesajMetni(emir.id);
t("tekli-only: Emir mesajı null (dersi yok — eski davranış)", emirTek === null);
t("waAc kaynak kanıtı: dersOgrenciIds kullanımı VAR", (() => { const s = waAc.toString(); return s.includes("dersOgrenciIds(l)") && s.includes("uyeIds"); })());
t("ogrenciMesajMetni kaynak kanıtı: dersOgrenciIds filtresi VAR", (() => { const s = ogrenciMesajMetni.toString(); return s.includes("dersOgrenciIds(l).indexOf"); })());

process.exit(fail ? 1 : 0);
