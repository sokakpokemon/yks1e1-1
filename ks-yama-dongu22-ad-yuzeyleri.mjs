/* DÖNGÜ-22: öğrenci adı yüzeylerini ortak formatter'a taşı (ad+gerçek DB sınıfı).
   Yalnız bu betik çalıştırılır; başka dosyaya dokunmaz. */
import { readFileSync, writeFileSync } from "node:fs";

let s = readFileSync("app.js", "utf8");
let n = 0;
const degi = (etiket, eski, yeni) => {
  if (!s.includes(eski)) { console.log(etiket, "BULUNAMADI"); process.exit(1); }
  s = s.replace(eski, yeni); n++; console.log(etiket, "OK");
};

// Yüzey 1: havuz üye chipleri (istekGrupOzetHTML)
degi("L733 havuz chip",
  `'">' + esc(o ? gorselAd(o.ad) : "?") + (i === 0 ? ' <span class="opacity-70">(Ana)</span>' : "") + "</span>";`,
  `'">' + (o ? birebirEtiketHTML(o.ad, o.sinif || "") : "?") + (i === 0 ? ' <span class="opacity-70">(Ana)</span>' : "") + "</span>";`);

// Yüzey 2: üye badge (havuz kartı içindeki üyeler)
degi("L2917 üye badge",
  `'">' + esc(gorselAd(mo.ad)) + "</span>" : "";`,
  `'">' + birebirEtiketHTML(mo.ad, mo.sinif || "") + "</span>" : "";`);

// Yüzey 3: plan chipleri (grupPanelOzetCiz çıkarılabilir chip)
degi("L3266 plan chip",
  `'">' + esc(o ? gorselAd(o.ad) : "?") +`,
  `'">' + (o ? birebirEtiketHTML(o.ad, o.sinif || "") : "?") +`);

// Yüzey 4: banner — serbest metin istekte sınıf UYDURULMAZ (null); DB eşleşmesi varsa sınıf
degi("L3313 banner",
  "'Ders düzenleniyor: ' + esc(gorselAd(l.ogrenciAd))",
  "'Ders düzenleniyor: ' + (function(){ var _o=DB.ogrenciler.find(function(x){return x.ad===l.ogrenciAd;}); return birebirEtiketHTML(l.ogrenciAd, _o ? (_o.sinif||\"\") : null); })()");

writeFileSync("app.js", s);
console.log("TOPLAM", n);
