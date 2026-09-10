/* ks-check-durum.mjs — Takvim düzenleme: durum seçici çubuğu + görünen etiket değişimi
   Ek işlemler: gridTablo "musait"→"kapali" dalı, MD çipi, çakışma uyarı metinleri, prompt metni.
   Tüm değişimler assert'lidir; hiçbir fonksiyon silinmez/değiştirilmez (sadece ek + görünür etiket). */
import { readFileSync, writeFileSync } from "node:fs";

let fail = 0;
const ok = (name, cond) => { console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) fail = 1; };
const rep = (src, from, to, name) => {
  const i = src.indexOf(from);
  ok(name + " (hedef bulundu)", i >= 0);
  if (i < 0) return src;
  ok(name + " (tek eşleşme)", src.indexOf(from, i + 1) < 0);
  return src.slice(0, i) + to + src.slice(i + from.length);
};

/* ---------- app.js ---------- */
let app = readFileSync("app.js", "utf8");

// 1) gridTablo: "musait" dalı → "kapali" (görünen başlık "Kapalı")
app = rep(app,
  'else if (durum === "musait") { cls += "bg-rose-200 border-rose-300 hover:bg-rose-300"; baslik += " · Müsait Değil"; }',
  'else if (durum === "kapali") { cls += "bg-rose-200 border-rose-300 hover:bg-rose-300"; baslik += " · Kapalı"; }',
  "gridTablo: musait dalı → kapali/Kapalı");

// 2) MD çipi → K çipi
app = rep(app,
  'durum === "musait" ? \'<span class="text-[8.5px] font-extrabold text-rose-500/70">MD</span>\' :',
  'durum === "kapali" ? \'<span class="text-[8.5px] font-extrabold text-rose-500/70">K</span>\' :',
  "gridTablo: MD çipi → K çipi");

// 3) Çakışma uyarısı: "Müsait Değil" → "Kapalı"
app = rep(app,
  'uyari.push(ogr.ad + " öğretmeni o saat için <b>Müsait Değil</b> olarak işaretli.");',
  'uyari.push(ogr.ad + " öğretmeni o saat için <b>Kapalı</b> olarak işaretli.");',
  "app.js çakışma uyarısı → Kapalı");

// 4) togOgr prompt metni (yedek akış; fonksiyonun kendisi korunur)
app = rep(app,
  '(boş bırakırsanız Musait Değil olur):',
  '(boş bırakırsanız Kapalı olur):',
  "togOgr prompt metni → Kapalı");

writeFileSync("app.js", app);

/* ---------- ek-ders.js ---------- */
let ek = readFileSync("ek-ders.js", "utf8");
ek = rep(ek,
  'uyari.push(ogr.ad + " öğretmeni o saat için <b>Müsait Değil</b> olarak işaretli.");',
  'uyari.push(ogr.ad + " öğretmeni o saat için <b>Kapalı</b> olarak işaretli.");',
  "ek-ders.js çakışma uyarısı → Kapalı");
writeFileSync("ek-ders.js", ek);

/* ---------- Post-asserts ---------- */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
const app2 = readFileSync("app.js", "utf8");
const ek2 = readFileSync("ek-ders.js", "utf8");

ok("app.js: kodda (yorum dışı) 'Müsait Değil' kalmadı", !stripComments(app2).includes("Müsait Değil"));
ok("ek-ders.js: kodda (yorum dışı) 'Müsait Değil' kalmadı", !stripComments(ek2).includes("Müsait Değil"));
ok("app.js: togOgr hâlâ var (silinmedi)", /function togOgr\(/.test(app2));
ok("app.js: togOgrSecili eklendi", /function togOgrSecili\(/.test(app2));
ok("app.js: durumSec eklendi", /function durumSec\(/.test(app2));
ok("app.js: durumSeciciHTML eklendi", /function durumSeciciHTML\(/.test(app2));
ok("app.js: ui.seciliDurum eklendi", app2.includes("seciliDurum: null"));
ok("app.js: çubuk takvime bağlandı (durumSeciciHTML çağrısı)", (app2.match(/durumSeciciHTML\(\)/g) || []).length >= 1);
ok("app.js: grid onclick artık togOgrSecili", app2.includes('gridTablo("togOgrSecili(\'"'));
ok("app.js: legend dinamik sınıf adları + Kapalı içeriyor", app2.includes("bg-amber-200 border border-amber-300 inline-block") && app2.includes("> Kapalı</span>"));
ok("app.js: gridTablo 'kapali' dalı", app2.includes('durum === "kapali"') && app2.includes(" · Kapalı"));
ok("app.js: 'Sınıf Dersi' görünen etiket korundu (gridTablo + uyarı)", app2.includes('baslik += " · Sınıf Dersi"') && app2.includes("<b>Sınıf Dersi</b>"));
ok("ek-ders.js: çakışma mantığı korundu (tip === 'musait')", ek2.includes('tip === "musait"'));

console.log(fail ? "BAŞARISIZ" : "HEPSİ GEÇTİ");
process.exit(fail);
