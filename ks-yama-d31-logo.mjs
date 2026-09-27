/* ks-yama-d31-logo.mjs — D31: ders kartı logo bloğu MASTER yapı + orantılı küçültme.
   Kapsam: app.js (canonical) + byte-aynı kopyaları (dist/, isolate/).
   Yöntem: SATIR TABANLI (app.js ~376 KB; geniş metin eşleştirmesi güvenilir değil).

   ESKİ → YENİ (master 8.5rem tabanı × ~0.235 çarpanı):
     marka metni       "formul kurs" (3rem)  → "formul" TEK SATIR (2rem)
     marka letter-sp.  -1.4px                 → -0.95px
     marka line-height 1                      → 0.85
     marka rengi       #0f172a (koyu)         → #d31d24 (KIRMIZI)
     SVG               27.5×27.5 üçgen        → 18×6 ÇİFT TURUNCU ÇİZGİ (right:7 · top:0.5)
     SVG stroke        #f29222 literal korunur (var() YOK)
     alt metin         "merkezi" turuncu 1rem → "kurs merkezi" koyu #1a1a1a 0.7rem
     alt letter-sp.    -0.5px                 → -0.35px
     alt margin        -4.2px 0 0 18px        → margin-top:-2.8px; margin-right:12px
     sarmalama         —                      → logo kutusu nowrap · header logo flex-shrink:0
                                            · başlık bloğu min-width:0
   İDEMPOTENT: yeni blok zaten varsa dokunulmaz. --ters ile geri alınır. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const TERS = process.argv.includes("--ters");
const I = "        ";

const ESKI = [
  '\'<div style="font-family:MontsKart,serif;font-size:3rem;font-weight:900;font-style:italic;letter-spacing:-1.4px;color:#0f172a;line-height:1">formul kurs</div>\' +',
  '\'<svg id="fk-logo" width="27.5" height="27.5" viewBox="0 0 27.5 27.5" xmlns="http://www.w3.org/2000/svg" style="display:block;margin-right:10.5px;margin-top:0.7px"><path d="M4 23.5 L13.75 4 L23.5 23.5" fill="none" stroke="#f29222" stroke-width="3" stroke-linecap="round"/></svg>\' +',
  '\'<div style="font-family:MontsKart,serif;font-size:1rem;font-style:italic;letter-spacing:-0.5px;margin:-4.2px 0 0 18px;color:#f29222;font-weight:900">merkezi</div>\' +',
].map((l) => I + l);

const YENI = [
  '\'<div style="position:relative;white-space:nowrap">\' +',
  '\'<svg id="fk-logo" width="18" height="6" viewBox="0 0 18 6" xmlns="http://www.w3.org/2000/svg" style="position:absolute;right:7px;top:0.5px;display:block"><path d="M0 1.6 L18 1.6" fill="none" stroke="#f29222" stroke-width="1.6" stroke-linecap="round"/><path d="M0 4.4 L18 4.4" fill="none" stroke="#f29222" stroke-width="1.6" stroke-linecap="round"/></svg>\' +',
  '\'<div style="font-family:MontsKart,serif;font-size:2rem;font-weight:900;font-style:italic;letter-spacing:-0.95px;color:#d31d24;line-height:0.85;white-space:nowrap">formul</div>\' +',
  '\'<div style="font-family:MontsKart,serif;font-size:0.7rem;font-weight:900;font-style:italic;letter-spacing:-0.35px;margin-top:-2.8px;margin-right:12px;color:#1a1a1a;white-space:nowrap">kurs merkezi</div>\' +',
  '\'</div>\' +',
].map((l) => I + l);

const baslikEski = I + '\'<div><div style="font-size:16px;font-weight:800;color:#0f172a">Birebir Ders Kartı</div></div>\' +';
const baslikYeni = I + '\'<div style="min-width:0"><div style="font-size:16px;font-weight:800;color:#0f172a">Birebir Ders Kartı</div></div>\' +';
const sarmaEski = I + '\'<div style="padding:7px">\' +';
const sarmaYeni = I + '\'<div style="padding:7px;white-space:nowrap;flex-shrink:0">\' +';

let yazan = 0;
for (const yol of ["app.js", "dist/app.js", "isolate/app.js"]) {
  if (!existsSync(yol)) { console.log("ATLANDI (yok): " + yol); continue; }
  const sat = readFileSync(yol, "utf8").split("\n");
  const bas0 = sat.length;

  /* 1) sarmalama kademeleri (başlık + logo kutusu) */
  for (let i = 0; i < sat.length; i++) {
    if (sat[i] === (TERS ? baslikYeni : baslikEski)) sat[i] = TERS ? baslikEski : baslikYeni;
    if (sat[i] === (TERS ? sarmaYeni : sarmaEski)) sat[i] = TERS ? sarmaEski : sarmaYeni;
  }

  /* 2) ara (yarım) durum normalizasyonu: yeni bloğun HEMEN ÜSTÜNDE eski marka+svg
        satırları kalmışsa atılır (eski 3 satırın yalnız ilk ikisi). */
  for (let nb = sat.findIndex((l) => l.includes("position:relative;white-space:nowrap")); nb >= 0;) {
    if (nb >= 2 && sat[nb - 2].includes(">formul kurs</div>") && sat[nb - 1].includes('id="fk-logo"')) sat.splice(nb - 2, 2);
    else break;
  }

  /* 3) logo bloğu: yön --ters'e göre AÇIK (bulunan durumdan çıkarılmaz) */
  const yeniBas = sat.findIndex((l) => l.includes("position:relative;white-space:nowrap"));
  if (TERS) {
    if (yeniBas >= 0) sat.splice(yeniBas, YENI.length, ...ESKI);
  } else if (yeniBas < 0) {
    const eskiBas = sat.findIndex((l) => l.includes(">formul kurs</div>"));
    if (eskiBas < 0) { console.log("ATLANDI (logo bloğu yok): " + yol); continue; }
    const merkezi = sat.findIndex((l, k) => k > eskiBas && l.includes(">merkezi</div>"));
    if (merkezi < 0 || merkezi - eskiBas !== 2) {
      console.error("BLOK BEKLENENDEN FARKLI (satır " + eskiBas + "): elde dokunulmadı → " + yol);
      process.exit(1);
    }
    sat.splice(eskiBas, 3, ...YENI);
  }

  if (sat.length === bas0 && !sat.some((l, i) => l !== readFileSync(yol, "utf8").split("\n")[i])) {
    console.log("ATLANDI (zaten güncel): " + yol); continue;
  }

  /* 4) güvenlik: master yapı bütünlüğü */
  const kaynak = sat.join("\n");
  const beklenen = TERS
    ? [baslikEski, sarmaEski, ">formul kurs</div>", ">merkezi</div>"]
    : [baslikYeni, sarmaYeni, ">formul</div>", ">kurs merkezi</div>", 'id="fk-logo"', 'stroke="#f29222"', "white-space:nowrap", "flex-shrink:0", "min-width:0", "color:#d31d24", "color:#1a1a1a", "font-size:2rem", "font-size:0.7rem"];
  const eksik = beklenen.filter((k) => !kaynak.includes(k));
  if (eksik.length) { console.error("GÜVENLİK: eksik → " + yol + ": " + eksik.join(" | ")); process.exit(1); }

  writeFileSync(yol, kaynak);
  yazan++;
  console.log((TERS ? "GERİ ALINDI" : "YAZILDI (master + ölçek)") + ": " + yol);
}
console.log("D31 yama: " + yazan + " dosya.");

/* 5) vaka adı senkronu: elle-vaka-adlari-base.mjs (büyük dosya → satır tabanlı).
      Süit adı değişmediği için manifest/sayaçlar ETKİLENMEZ (109 korunur). */
const VAKA_ESKI = '"D30 logo kademe değerleri (3rem · -1.4px · 27.5 · 0.7px · 10.5px · 1rem · -0.5px · -4.2px · 18px · 7px)",';
const VAKA_YENI = '"D31 logo master kademe: \'formul\' (2rem · -0.95px · 0.85 · #d31d24) + çift #f29222 çizgi (18 · right 7 · top 0.5) + \'kurs merkezi\' (0.7rem · -0.35px · -2.8px · 12px · #1a1a1a) + nowrap/flex-shrink:0/min-width:0",';
for (const yol of ["elle-vaka-adlari-base.mjs"]) {
  if (!existsSync(yol)) continue;
  const sat = readFileSync(yol, "utf8").split("\n");
  const i = sat.findIndex((l) => l.trim() === VAKA_ESKI);
  if (i < 0) { console.log("VAKA ADI: zaten güncel (" + yol + ")"); continue; }
  sat[i] = sat[i].replace(VAKA_ESKI, VAKA_YENI);
  writeFileSync(yol, sat.join("\n"));
  console.log("VAKA ADI güncellendi (" + sat.length + " satır): " + yol);
}
