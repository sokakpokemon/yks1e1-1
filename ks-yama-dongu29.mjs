/* ks-yama-dongu29.mjs — DÖNGÜ-29-YAMASI: idempotent, assert'li hedefli yama (app.js).
   A) Grup dersleri hücrelerde draggable olur (haftalık + günlük draggable guard'ı güncellenir);
      dersBurak çizelge-içi grup taşımayı REDDER (mevcut kural korunur, mesaj netleşir).
   B) havuzBolum drop-zone: planKart listener bloğuna paralel eklenir — dersDropHedef doluysa
      MEVCUT onayAc ile ders + üyeler gösterilir; tarih/saat/öğretmen sıfırlanma bildirimi yapılır.
   C) dersHavuzaGeriBurak: iptal/tamamlanmış/Ek Ders/Sınıf Dersi RED; onaylıysa ders silinir,
      tüm üyeleri + ders + konu ile TEK bekleyen istek oluşur; ui.aktifIstekId/ui.editId temizlenir.
   2. koşu: "Zaten uygulanmış" (exit 2), dosyaya DOKUNMAZ. */
import { readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const kaynak = "app.js";
const once = readFileSync(kaynak, "utf8");

if (once.includes("DÖNGÜ-29-YAMASI")) {
  console.log("Zaten uygulanmış — dosyaya dokunulmadı.");
  process.exit(2);
}

let sonuc = once;

/* ---------- YAMA 1: haftalık draggable guard → grup dahil (planlı birebir; iptal hariç) ---------- */
/* Eski: ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1
   Yeni: ders.durum !== "iptal" && ders.durum !== "tamamlandi" (grup dahil birebir planlı; Ek Ders/Sınıf Dersi zaten bu dalda değil) */
const h1EskiHafta = `(ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ? ' draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \\'' + esc(ders.id) + '\\'); this.style.opacity=\\'0.45\\'\" ondragend="dersDropHedef=null; this.style.opacity=\\'\\'\"' : '')`;
const h1YeniHafta = `/* DÖNGÜ-29-YAMASI: grup birebir dersler de draggable — yalnız havuz hedefi kabul eder (dersBurak reddeder); iptal/tamamlanmış draggable değil */\n          (ders.durum !== "iptal" && ders.durum !== "tamamlandi" ? ' draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \\'' + esc(ders.id) + '\\'); this.style.opacity=\\'0.45\\'\" ondragend="dersDropHedef=null; this.style.opacity=\\'\\'\"' : '')`;
const h1Adet = (sonuc.split(h1EskiHafta).length - 1);
if (h1Adet !== 2) { console.error("HATA: draggable guard tam 2 kez bekleniyordu, bulunan: " + h1Adet + " — fail-closed."); process.exit(1); }
sonuc = sonuc.split(h1EskiHafta).join(h1YeniHafta);

/* ---------- YAMA 2: dersBurak — grup taşıma reddi netleştirilir (çizelge→çizelge grup YASAK) ---------- */
const h2Eski = `  /* Yalnız AKTİF TEK ÖĞRENCİLİ birebir: grup / Sınıf Dersi (rose) / Ek Ders (amber) RED */
  if (l.durum === "iptal") { toast("İptal edilmiş ders taşınamaz.", "hata"); renderDersler(); return; }
  if (dersOgrenciIds(l).length !== 1) { toast("Yalnız tek öğrencili birebir ders taşınabilir.", "hata"); renderDersler(); return; }`;
const h2Yeni = `  /* Yalnız AKTİF TEK ÖĞRENCİLİ birebir: grup / Sınıf Dersi (rose) / Ek Ders (amber) RED */
  /* DÖNGÜ-29-YAMASI: grup birebir dersler draggable olduktan sonra çizelge-içi taşıma YİNE reddedilir;
     grup dersleri yalnız HAVUZ hedefine geri bırakılabilir (dersHavuzaGeriBurak). */
  if (l.durum === "iptal") { toast("İptal edilmiş ders taşınamaz.", "hata"); renderDersler(); return; }
  if (l.durum === "tamamlandi") { toast("Tamamlanmış ders taşınamaz.", "hata"); renderDersler(); return; }
  if (dersOgrenciIds(l).length !== 1) { toast("Grup dersleri çizelgede taşınamaz — havuza geri bırakın.", "hata"); renderDersler(); return; }`;
if (!sonuc.includes(h2Eski)) { console.error("HATA: hedef-2 bulunamadı — fail-closed."); process.exit(1); }
sonuc = sonuc.replace(h2Eski, h2Yeni);

/* ---------- YAMA 3: dersHavuzaGeriBurak — dersBurak'tan hemen sonra ---------- */
const h3Eski = `function dersDrag(ev, id) {
  dersDropHedef = id;                       // kaynak ders ID'si drag boyunca taşınır`;
const h3Yeni = `/* DÖNGÜ-29-YAMASI — ÇİZELGEDEN HAVUZA GERİ BIRAKMA (onaylı)
   Kapsam: planlı birebir dersler (tekli + grup). İptal/tamamlanmış, Ek Ders, Sınıf Dersi RED.
   Akış: havuzBolum drop → onayAc (ders + üyeler + tarih/saat/öğretmen sıfırlanma bildirimi)
   → onaylıysa ders SİLİNİR + tüm üyeleri/ders/konu ile TEK "bekliyor" istek oluşur.
   ui.aktifIstekId ve ui.editId temizlenir; düzenleme formu sıfırlanır. */
function dersHavuzaGeriBurak(dersId) {
  dersDropHedef = null;
  var l = DB.dersler.find(function (x) { return x.id === dersId; });
  if (!l) { toast("Ders bulunamadı — geri bırakma iptal.", "hata"); return; }
  /* RED: iptal / tamamlanmış */
  if (l.durum === "iptal") { toast("İptal edilmiş ders havuza geri bırakılamaz.", "hata"); return; }
  if (l.durum === "tamamlandi") { toast("Tamamlanmış ders havuza geri bırakılamaz.", "hata"); return; }
  /* Ek Ders / Sınıf Dersi guard: birebir ders kaydı olmalı (ogrenciId'li) */
  var uyeIdler = dersOgrenciIds(l);
  if (!l.ogrenciId || !uyeIdler.length) { toast("Bu kayıt birebir ders değil — havuza geri bırakılamaz.", "hata"); return; }
  /* Ek Ders kontrolü: ders ekDersler'de İSE reddet (aynı id'li birebir kaydı olamaz ama savunma katmanı) */
  var ekMi = (Array.isArray(DB.ekDersler) ? DB.ekDersler : []).some(function (x) { return x.id === l.id; });
  if (ekMi) { toast("Ek Ders kaydı havuza geri bırakılamaz.", "hata"); return; }
  /* Sınıf Dersi guard: ogrenciId yoksa zaten yukarıda reddedilir; ayrıca ders.sinif dolu + ogrenciAd boş kombinasyonu engellenir */
  if (!l.ogrenciAd && l.sinif) { toast("Sınıf dersi havuza geri bırakılamaz.", "hata"); return; }

  var anaO = DB.ogrenciler.find(function (x) { return x.id === l.ogrenciId; });
  var ekler = (Array.isArray(l.ogrenciIds) ? l.ogrenciIds.slice() : []);
  var uyeSatir = uyeIdler.map(function (oid) {
    var o = DB.ogrenciler.find(function (x) { return x.id === oid; });
    return o ? o.ad : "Bilinmeyen";
  }).join(", ");
  var D = DERS[l.dersId] || { ad: String(l.dersId) };
  onayAc({
    baslik: "Ders havuza geri alınsın mı?",
    metin: "<b>" + esc(uyeSatir) + "</b>" +
      (uyeIdler.length > 1 ? " <span class='text-[11px] text-slate-400'>(" + uyeIdler.length + " öğrenci — grup)</span>" : "") +
      "<br>" + esc(D.ad) + (l.konu ? " — " + esc(l.konu) : "") +
      "<br><span class='text-[11px] text-amber-600 font-semibold'>Planlama detayları (tarih, saat, öğretmen) sıfırlanır; istek yeniden planlamanız için havuza bekler.</span>",
    onay: "Havuza Geri Al"
  }, function () {
    /* Onaylı: ders silinir → TEK bekleyen istek */
    DB.dersler = DB.dersler.filter(function (x) { return x.id !== l.id; });
    var yeniIstek = {
      id: uid(), ogrenciId: l.ogrenciId, ogrenciAd: (anaO ? anaO.ad : (l.ogrenciAd || "")),
      dersId: l.dersId, konu: l.konu || "", durum: "bekliyor",
      olusturma: l.olusturma || todayKey(), donemId: aktifDonemId()
    };
    if (ekler.length) yeniIstek.ogrenciIds = ekler; /* üyelik aynen korunur */
    DB.istekler.push(yeniIstek);
    /* State temizliği: düzenleme/istek bağlantıları düşürülür */
    ui.aktifIstekId = null;
    if (ui.editId === l.id) {
      ui.editId = null;
      ["f-ogrenci", "f-ders", "f-konu", "f-ogretmen", "f-tarih", "f-saat"].forEach(function (id) { try { var el2 = $(id); if (el2) el2.value = ""; } catch (e) {} });
      try { var yk2 = $("f-yoksay"); if (yk2) yk2.checked = false; } catch (e2) {}
      try { duzenleBannerGuncelle(); } catch (e3) {}
    }
    toast("Ders havuza geri alındı ✓ " + uyeSatir);
    saveDB();
    renderHavuz();
    renderFormDestek();
    renderDersler();
    renderOzet();
    renderAnaliz();
  });
}

function dersDrag(ev, id) {
  dersDropHedef = id;                       // kaynak ders ID'si drag boyunca taşınır`;
if (!sonuc.includes(h3Eski)) { console.error("HATA: hedef-3 bulunamadı — fail-closed."); process.exit(1); }
sonuc = sonuc.replace(h3Eski, h3Yeni);

/* ---------- YAMA 4: havuzBolum drop-zone (planKart listener bloğuna paralel) ---------- */
const h4Eski = `  pk.addEventListener("drop", function (e) {
    pk.classList.remove("ring-2", "ring-teal-300");
    if (!istekDropHedef) return;
    e.preventDefault();
    formaAktar(istekDropHedef);
    istekDropHedef = null;
  });
});`;
const h4Yeni = `  pk.addEventListener("drop", function (e) {
    pk.classList.remove("ring-2", "ring-teal-300");
    if (!istekDropHedef) return;
    e.preventDefault();
    formaAktar(istekDropHedef);
    istekDropHedef = null;
  });
  /* DÖNGÜ-29-YAMASI: havuzBolum drop-zone — çizelgeden sürüklenen birebir dersi geri alır.
     Yalnız dersDropHedef doluysa aktifleşir; havuz isteği akışına DOKUNMAZ. Geçersiz/boş
     drop'ta veri DEĞİŞMEZ (dersHavuzaGeriBurak guard'ları + onay mekanizması). */
  var hv = $("havuzBolum");
  if (hv && !hv.__geriAlmaBagli) {
    hv.__geriAlmaBagli = true;
    hv.addEventListener("dragover", function (e) {
      if (!dersDropHedef) return;
      e.preventDefault();
      if (ev_dnd) ev_dnd.dataTransfer.dropEffect = "move";
      hv.classList.add("ring-2", "ring-teal-300");
    });
    hv.addEventListener("dragleave", function () { hv.classList.remove("ring-2", "ring-teal-300"); });
    hv.addEventListener("drop", function (e) {
      hv.classList.remove("ring-2", "ring-teal-300");
      if (!dersDropHedef) return;
      e.preventDefault();
      dersHavuzaGeriBurak(dersDropHedef);
    });
  }
});`;
if (!sonuc.includes(h4Eski)) { console.error("HATA: hedef-4 bulunamadı — fail-closed."); process.exit(1); }
sonuc = sonuc.replace(h4Eski, h4Yeni);

/* ---------- assert'ler ---------- */
if ((sonuc.match(/DÖNGÜ-29-YAMASI/g) || []).length < 4) throw new Error("assert: işaret sayısı");
if (!sonuc.includes("function dersHavuzaGeriBurak")) throw new Error("assert: fonksiyon yok");
if ((sonuc.match(/dersHavuzaGeriBurak\(/g) || []).length !== 2) throw new Error("assert: fonksiyon çağrısı tanım+drop = 2 olmalı");
if (!sonuc.includes("__geriAlmaBagli")) throw new Error("assert: idempotent guard yok");
if (sonuc.includes('ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1')) throw new Error("assert: eski guard kalkmadı");
if ((sonuc.match(/ders\.durum !== "iptal" && ders\.durum !== "tamamlandi"/g) || []).length !== 2) throw new Error("assert: yeni guard tam 2 yerde");
if (!sonuc.includes("Havuza Geri Al")) throw new Error("assert: onay butonu yok");
if (!sonuc.includes("Planlama detayları")) throw new Error("assert: sıfırlanma bildirimi yok");

copyFileSync(kaynak, kaynak + ".dongu29-calisma-oncesi.bak");
writeFileSync(kaynak, sonuc);
console.log("Yama uygulandı. Backup: app.js.dongu29-calisma-oncesi.bak");
console.log("app.js boyut:", statSync(kaynak).size, "· SHA-256:", sha(readFileSync(kaynak)));
console.log("Uzunluk:", once.length, "→", sonuc.length, "(+" + (sonuc.length - once.length) + ")");
process.exit(0);
