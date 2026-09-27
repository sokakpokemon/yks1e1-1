/* ks-yama-d31-logo.mjs — D31/D32: ders kartı logo bloğu MASTER yapı + ölçek/boşluk/konum.
   Kapsam: app.js (canonical) + byte-aynı kopyaları (dist/, isolate/), vaka listeleri,
   index.html önbellek damgası.
   Yöntem: SATIR TABANLI (app.js ~376 KB; geniş metin eşleştirmesi güvenilir değil).

   ESKİ (master öncesi) → YENİ (master + ölçek):
     marka metni       "formul kurs" 3rem koyu  → "formul" TEK SATIR 2rem KIRMIZI #d31d24 italik 900
     marka letter-sp.  -1.4px                  → -0.95px
     marka line-height 1                       → 0.95   (0.85 fazla sıkışıktı)
     SVG               27.5×27.5 üçgen         → 20×8 ÇİFT TURUNCU ÇİZGİ (viewBox 0 0 100 40,
                                               stroke-width 14 LİTERAL korunur → ~2.8px),
                                               right:8px · top:0 · overflow:visible · z-index:1
     alt metin         "merkezi" turuncu 1rem  → "kurs merkezi" koyu #1a1a1a 0.72rem
     alt letter-sp.    -0.5px                  → -0.35px
     alt margin        -4.2px 0 0 18px         → margin-top:1px (NEGATİF YOK) · margin-right:14px
     sarmalama         —                       → logo kutusu nowrap · flex-shrink:0 ·
                                               margin-left:12px · başlık min-width:0
   İDEMPOTENT: blok zaten YENI ise dokunulmaz. --ters ile master öncesi hâle döner. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const TERS = process.argv.includes("--ters");
const I = "        ";

const ESKI = [
  '\'<div style="font-family:MontsKart,serif;font-size:3rem;font-weight:900;font-style:italic;letter-spacing:-1.4px;color:#0f172a;line-height:1">formul kurs</div>\' +',
  '\'<svg id="fk-logo" width="27.5" height="27.5" viewBox="0 0 27.5 27.5" xmlns="http://www.w3.org/2000/svg" style="display:block;margin-right:10.5px;margin-top:0.7px"><path d="M4 23.5 L13.75 4 L23.5 23.5" fill="none" stroke="#f29222" stroke-width="3" stroke-linecap="round"/></svg>\' +',
  '\'<div style="font-family:MontsKart,serif;font-size:1rem;font-style:italic;letter-spacing:-0.5px;margin:-4.2px 0 0 18px;color:#f29222;font-weight:900">merkezi</div>\' +',
].map((l) => I + l);

const YENI = [
  '\'<div style="position:relative;white-space:nowrap">\' +',
  '\'<div style="font-family:MontsKart,serif;font-size:2rem;font-weight:900;font-style:italic;letter-spacing:-0.95px;color:#d31d24;line-height:0.95;white-space:nowrap">formul</div>\' +',
  '\'<svg id="fk-logo" width="20" height="8" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" style="position:absolute;right:8px;top:0;display:block;overflow:visible;z-index:1"><path d="M8 12 L92 12" fill="none" stroke="#f29222" stroke-width="14" stroke-linecap="round"/><path d="M8 28 L92 28" fill="none" stroke="#f29222" stroke-width="14" stroke-linecap="round"/></svg>\' +',
  '\'<div style="font-family:MontsKart,serif;font-size:0.72rem;font-weight:900;font-style:italic;letter-spacing:-0.35px;margin-top:1px;margin-right:14px;color:#1a1a1a;white-space:nowrap">kurs merkezi</div>\' +',
  '\'</div>\' +',
].map((l) => I + l);

const baslikEski = I + '\'<div><div style="font-size:16px;font-weight:800;color:#0f172a">Birebir Ders Kartı</div></div>\' +';
const baslikYeni = I + '\'<div style="min-width:0"><div style="font-size:16px;font-weight:800;color:#0f172a">Birebir Ders Kartı</div></div>\' +';
/* önceki D31 sarmalaması da geçerli "eski" sayılır (yeniden uygulanabilir olsun) */
const sarmaEskiler = [
  I + '\'<div style="padding:7px">\' +',
  I + '\'<div style="padding:7px;white-space:nowrap;flex-shrink:0">\' +',
];
const sarmaYeni = I + '\'<div style="padding:4px 0;white-space:nowrap;flex-shrink:0;margin-left:12px">\' +';

let yazan = 0;
for (const yol of ["app.js", "dist/app.js", "isolate/app.js"]) {
  if (!existsSync(yol)) { console.log("ATLANDI (yok): " + yol); continue; }
  const onceki = readFileSync(yol, "utf8");
  const sat = onceki.split("\n");

  /* 1) sarmalama kademeleri (başlık + logo kutusu) */
  for (let i = 0; i < sat.length; i++) {
    if (sat[i] === (TERS ? baslikYeni : baslikEski)) sat[i] = TERS ? baslikEski : baslikYeni;
    if (TERS && sat[i] === sarmaYeni) sat[i] = sarmaEskiler[0];
    if (!TERS && sarmaEskiler.includes(sat[i])) sat[i] = sarmaYeni;
  }

  /* 2) ara (yarım) durum normalizasyonu: logonun hemen üstünde eski marka/svg satırları */
  for (let nb = sat.findIndex((l) => l.includes("position:relative;white-space:nowrap")); nb >= 0;) {
    if (nb >= 2 && sat[nb - 2].includes(">formul kurs</div>") && sat[nb - 1].includes('id="fk-logo"')) sat.splice(nb - 2, 2);
    else break;
  }

  /* 3) logo bloğu: yön --ters'e AÇIK; blok zaten YENI ise dokunulmaz (idempotans) */
  const yeniBas = sat.findIndex((l) => l.includes("position:relative;white-space:nowrap"));
  if (TERS) {
    if (yeniBas >= 0) sat.splice(yeniBas, YENI.length, ...ESKI);
  } else if (yeniBas >= 0) {
    const mevcut = sat.slice(yeniBas, yeniBas + YENI.length);
    if (mevcut.join("\n") !== YENI.join("\n")) {
      /* eski D31 varyantı 5 satırdı; farklıysa yine 5 satırlık alan değiştirilir */
      sat.splice(yeniBas, YENI.length, ...YENI);
    }
  } else {
    const eskiBas = sat.findIndex((l) => l.includes(">formul kurs</div>"));
    if (eskiBas < 0) { console.log("ATLANDI (logo bloğu yok): " + yol); continue; }
    const merkezi = sat.findIndex((l, k) => k > eskiBas && l.includes(">merkezi</div>"));
    if (merkezi < 0 || merkezi - eskiBas !== 2) {
      console.error("BLOK BEKLENENDEN FARKLI (satır " + eskiBas + "): elde dokunulmadı → " + yol);
      process.exit(1);
    }
    sat.splice(eskiBas, 3, ...YENI);
  }

  const kaynak = sat.join("\n");
  if (kaynak === onceki) { console.log("ATLANDI (zaten güncel): " + yol); continue; }

  /* 4) güvenlik: master yapı + kademe bütünlüğü */
  const beklenen = TERS
    ? [baslikEski, sarmaEskiler[0], ">formul kurs</div>", ">merkezi</div>"]
    : [baslikYeni, sarmaYeni, ">formul</div>", ">kurs merkezi</div>", 'id="fk-logo"', 'stroke="#f29222"',
       'width="20"', 'height="8"', "overflow:visible", "stroke-width=\"14\"", "right:8px", "top:0",
       "white-space:nowrap", "flex-shrink:0", "min-width:0", "margin-left:12px", "padding:4px 0",
       "color:#d31d24", "color:#1a1a1a", "font-size:2rem", "line-height:0.95", "font-size:0.72rem",
       "margin-top:1px", "margin-right:14px"];
  const eksik = beklenen.filter((k) => !kaynak.includes(k));
  if (eksik.length) { console.error("GÜVENLİK: eksik → " + yol + ": " + eksik.join(" | ")); process.exit(1); }
  if (!TERS) {
    const negatif = kaynak.split("\n").filter((l) => l.includes("MontsKart") && l.includes("margin-top:-"));
    if (negatif.length) { console.error("GÜVENLİK: negatif margin kaldı → " + yol); process.exit(1); }
  }

  writeFileSync(yol, kaynak);
  yazan++;
  console.log((TERS ? "GERİ ALINDI" : "YAZILDI (master + ölçek/boşluk)") + ": " + yol);
}
console.log("D32 yama: " + yazan + " dosya.");

/* 5) vaka adı senkronu (süit adı/sayaç değişmez → manifest 109 korunur) */
const VAKA_ESKILER = [
  '"D30 logo kademe değerleri (3rem · -1.4px · 27.5 · 0.7px · 10.5px · 1rem · -0.5px · -4.2px · 18px · 7px)",',
  '"D31 logo master kademe: \'formul\' (2rem · -0.95px · 0.85 · #d31d24) + çift #f29222 çizgi (18 · right 7 · top 0.5) + \'kurs merkezi\' (0.7rem · -0.35px · -2.8px · 12px · #1a1a1a) + nowrap/flex-shrink:0/min-width:0",',
];
const VAKA_YENI = '"D32 logo görünürlük: çift #f29222 çizgi 20×8 · viewBox 0 0 100 40 · stroke-width 14 · overflow:visible · right 8 · top 0 · z-index:1; \'formul\' 2rem · 0.95 · #d31d24; \'kurs merkezi\' 0.72rem · #1a1a1a · negatif margin YOK (+1px) · margin-right:14px; sarmalama padding 4px 0 · margin-left:12px · nowrap · flex-shrink:0 · min-width:0",';
for (const yol of ["elle-vaka-adlari-base.mjs", "suit-vakalar/ks-ders-karti.mjs.txt"]) {
  if (!existsSync(yol)) continue;
  const sat = readFileSync(yol, "utf8").split("\n");
  const eski = (l) => VAKA_ESKILER.find((v) => {
    const t = l.trim().replace(/,$/, "").replace(/^"/, "").replace(/"$/, "");
    return t === v.replace(/,$/, "").replace(/^"/, "").replace(/"$/, "");
  });
  const i = sat.findIndex((l) => !!eski(l));
  if (i < 0) { console.log("VAKA ADI: zaten güncel (" + yol + ")"); continue; }
  const yeniAd = VAKA_YENI.replace(/,$/, "").replace(/^"/, "").replace(/"$/, "");
  sat[i] = yol.endsWith(".txt")
    ? sat[i].replace(sat[i].trim(), yeniAd)
    : sat[i].replace(eski(sat[i]), '"' + yeniAd + '",');
  writeFileSync(yol, sat.join("\n"));
  console.log("VAKA ADI güncellendi: " + yol);
}

/* 6) önbellek damgası: index.html app.js?v=<app.js SHA-256 ilk 16 hane> */
const damga = createHash("sha256").update(readFileSync("app.js")).digest("hex").slice(0, 16);
const eskiDamgalar = new Set();
for (const yol of ["index.html", "dist/index.html", "isolate/index.html"]) {
  if (!existsSync(yol)) continue;
  const s = readFileSync(yol, "utf8");
  const m = s.match(/app\.js\?v=([0-9a-f]{16})/);
  if (!m) continue;
  eskiDamgalar.add(m[1]);
  if (m[1] === damga) continue;
  writeFileSync(yol, s.replace(m[0], "app.js?v=" + damga));
  console.log("DAMGA " + m[1] + " → " + damga + ": " + yol);
}
if (!TERS) {
  for (const yol of ["elle-vaka-adlari.mjs", "suit-vakalar/ks-kart-kolon.mjs.txt"]) {
    if (!existsSync(yol)) continue;
    const sat = readFileSync(yol, "utf8").split("\n");
    const i = sat.findIndex((l) => /index\.html damga = SHA ilk 16 hane/.test(l));
    if (i < 0) continue;
    const yeni = sat[i].replace(/app\.js\s*\?v=[0-9a-f]{16}/, "app.js ?v=" + damga);
    if (yeni === sat[i]) continue;
    sat[i] = yeni;
    writeFileSync(yol, sat.join("\n"));
    console.log("DAMGA vaka adı senkron: " + yol);
  }
}
