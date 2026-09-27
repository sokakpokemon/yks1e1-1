/* ks-yama-d31-logo.mjs — D33: ders kartı logosu MASTER kod BİREBİR (yalnız 2 değişiklik:
   gömülü font ailesi + ölçek).
   Kapsam: app.js (canonical) + byte-aynı kopyaları (dist/, isolate/), vaka listeleri,
   index.html önbellek damgası, önizleme sayfası (isolate/logo-onizleme.html).
   Yöntem: SATIR TABANLI (app.js ~376 KB; geniş metin eşleştirmesi güvenilir değil).

   MASTER YAPI (aynen):
     logo-wrapper   inline-flex · flex-direction:column · align-items:flex-end
     brand-container position:relative · display:flex · align-items:flex-start
     brand-name     "formul" · #d31d24 · 900 · italic · line-height 0.85
     SVG id=fk-logo position:absolute · viewBox 0 0 100 40 · height:auto ·
                   (M15 10 L95 10) + (M14 29 L94 29) · stroke-width 14 · round · #f29222 literal
     sub-text       "kurs merkezi" · #1a1a1a · 900 · italic
   DEĞİŞİKLİK 1 (font): Montserrat → gömülü 'MontsKart' (italic 900, base64 data-URI @font-face).
        CDN YOK, sistem fallback YOK.
   DEĞİŞİKLİK 2 (ölçek, master 8.5rem × 0.2647):
        marka 2.25rem · -1.05px · lh 0.85 · SVG width 21px · right 8 · top 0.5 · stroke-width 14 ·
        alt yazı 0.74rem · -0.4px · margin-right 14px · sarmalayıcı padding 5px
   ÇAKIŞMA KURALI: "kurs merkezi" markanın üstüne biniyordu (D31'de -2.8px → siyah şerit);
        bu yüzden margin-top 0'a ÇEKİLDİ (master -3px kullanılmıyor).
   NOT: kart markup'ında class= YASAK (Tailwind bağımsızlık kapısı) → SVG yalnız id ile
        etiketlenir; class="u-to-ü-lines" eklenmez.
   İDEMPOTENT: blok zaten D33 ise dokunulmaz. --ters ile master öncesi hâle döner. */
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
  '\'<div style="position:relative;display:flex;align-items:flex-start;white-space:nowrap">\' +',
  '\'<div style="font-family:MontsKart,serif;font-size:2.25rem;font-weight:900;font-style:italic;letter-spacing:-1.05px;color:#d31d24;line-height:0.85;white-space:nowrap">formul</div>\' +',
  '\'<svg id="fk-logo" width="21" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" style="position:absolute;right:8px;top:0.5px;height:auto;display:block;overflow:visible;z-index:1"><path d="M15 10 L95 10" fill="none" stroke="#f29222" stroke-width="14" stroke-linecap="round"/><path d="M14 29 L94 29" fill="none" stroke="#f29222" stroke-width="14" stroke-linecap="round"/></svg>\' +',
  '\'<div style="font-family:MontsKart,serif;font-size:0.74rem;font-weight:900;font-style:italic;letter-spacing:-0.4px;margin-top:0;margin-right:14px;color:#1a1a1a;white-space:nowrap">kurs merkezi</div>\' +',
  '\'</div>\' +',
].map((l) => I + l);

const WRAP_D33 = I + '\'<div style="display:inline-flex;flex-direction:column;align-items:flex-end;padding:5px;white-space:nowrap;flex-shrink:0;margin-left:12px">\' +';
const baslikEski = I + '\'<div><div style="font-size:16px;font-weight:800;color:#0f172a">Birebir Ders Kartı</div></div>\' +';
const baslikYeni = I + '\'<div style="min-width:0"><div style="font-size:16px;font-weight:800;color:#0f172a">Birebir Ders Kartı</div></div>\' +';
/* önceki sarmalayıcı varyantları da "eski" sayılır (yeniden uygulanabilir olsun) */
const sarmaEskiler = [
  I + '\'<div style="padding:7px">\' +',
  I + '\'<div style="padding:7px;white-space:nowrap;flex-shrink:0">\' +',
  I + '\'<div style="padding:4px 0;white-space:nowrap;flex-shrink:0;margin-left:12px">\' +',
];
const blokSonu = I + '\'</div></div>\' +';
const isaret = (l) =>
  l.includes(">formul kurs</div>") ||
  l.includes("position:relative;white-space:nowrap") ||
  (l.includes("position:relative") && l.includes("align-items:flex-start"));

let yazan = 0;
for (const yol of ["app.js", "dist/app.js", "isolate/app.js"]) {
  if (!existsSync(yol)) { console.log("ATLANDI (yok): " + yol); continue; }
  const onceki = readFileSync(yol, "utf8");
  const sat = onceki.split("\n");

  /* 1) sarmalama + başlık kademeleri */
  for (let i = 0; i < sat.length; i++) {
    if (sat[i] === (TERS ? baslikYeni : baslikEski)) sat[i] = TERS ? baslikEski : baslikYeni;
    if (TERS && sat[i] === WRAP_D33) sat[i] = sarmaEskiler[0];
    if (!TERS && sarmaEskiler.includes(sat[i])) sat[i] = WRAP_D33;
  }

  /* 2) ara (yarım) durum normalizasyonu: logonun hemen üstünde eski marka/svg satırları */
  let m = sat.findIndex(isaret);
  while (m >= 2 && sat[m - 2].includes(">formul kurs</div>") && sat[m - 1].includes('id="fk-logo"')) {
    sat.splice(m - 2, 2);
    m = sat.findIndex(isaret);
  }

  /* 3) logo bloğu: yön --ters'e AÇIK; zaten D33 ise dokunulmaz (idempotans) */
  m = sat.findIndex(isaret);
  if (TERS) {
    if (m >= 0) {
      const e = sat.findIndex((l, k) => k > m && l === blokSonu);
      if (e < 0) { console.error("BLOK SONU BULUNAMADI: " + yol); process.exit(1); }
      sat.splice(m, sat[m].includes(">formul kurs</div>") ? 3 : e - m, ...ESKI);
    }
  } else if (m < 0) {
    console.log("ATLANDI (logo bloğu yok): " + yol); continue;
  } else {
    const e = sat.findIndex((l, k) => k > m && l === blokSonu);
    const mevcut = sat.slice(m, e > 0 ? e : m + YENI.length);
    if (mevcut.join("\n") !== YENI.join("\n")) {
      sat.splice(m, sat[m].includes(">formul kurs</div>") ? 3 : (e > 0 ? e : m + 5) - m, ...YENI);
    }
  }

  const kaynak = sat.join("\n");
  if (kaynak === onceki) { console.log("ATLANDI (zaten güncel): " + yol); continue; }

  /* 4) güvenlik: master yapı + kademe bütünlüğü */
  const beklenen = TERS
    ? [baslikEski, sarmaEskiler[0], ">formul kurs</div>", ">merkezi</div>"]
    : [baslikYeni, WRAP_D33, "display:inline-flex", "flex-direction:column", "align-items:flex-end",
       "padding:5px", "align-items:flex-start", ">formul</div>", ">kurs merkezi</div>",
       "font-size:2.25rem", "letter-spacing:-1.05px", "line-height:0.85", "color:#d31d24",
       'width="21"', 'viewBox="0 0 100 40"', "height:auto", "right:8px", "top:0.5px",
       'd="M15 10 L95 10"', 'd="M14 29 L94 29"', 'stroke-width="14"', 'stroke-linecap="round"',
       'stroke="#f29222"', "font-size:0.74rem", "letter-spacing:-0.4px", "margin-top:0",
       "margin-right:14px", "color:#1a1a1a", "font-family:MontsKart,serif", "white-space:nowrap",
       "flex-shrink:0", "min-width:0", "margin-left:12px", "@font-face", "data:font/woff2;base64,"];
  const eksik = beklenen.filter((k) => !kaynak.includes(k));
  if (eksik.length) { console.error("GÜVENLİK: eksik → " + yol + ": " + eksik.join(" | ")); process.exit(1); }
  if (!TERS) {
    if (kaynak.includes("Montserrat")) { console.error("GÜVENLİK: 'Montserrat' referansı kaldı → " + yol); process.exit(1); }
    const binen = sat.filter((l) => l.includes("kurs merkezi") && /margin-top:-/.test(l));
    if (binen.length) { console.error("ÇAKIŞMA KURALI: negatif margin-top kaldı → " + yol); process.exit(1); }
  }

  writeFileSync(yol, kaynak);
  yazan++;
  console.log((TERS ? "GERİ ALINDI" : "YAZILDI (master + MontsKart + ölçek)") + ": " + yol);
}
console.log("D33 yama: " + yazan + " dosya.");

/* 5) vaka adı senkronu (süit adı/sayaç değişmez → manifest 109 korunur) */
const VAKA_ESKILER = [
  '"D30 logo kademe değerleri (3rem · -1.4px · 27.5 · 0.7px · 10.5px · 1rem · -0.5px · -4.2px · 18px · 7px)",',
  '"D31 logo master kademe: \'formul\' (2rem · -0.95px · 0.85 · #d31d24) + çift #f29222 çizgi (18 · right 7 · top 0.5) + \'kurs merkezi\' (0.7rem · -0.35px · -2.8px · 12px · #1a1a1a) + nowrap/flex-shrink:0/min-width:0",',
  '"D32 logo görünürlük: çift #f29222 çizgi 20×8 · viewBox 0 0 100 40 · stroke-width 14 · overflow:visible · right 8 · top 0 · z-index:1; \'formul\' 2rem · 0.95 · #d31d24; \'kurs merkezi\' 0.72rem · #1a1a1a · negatif margin YOK (+1px) · margin-right:14px; sarmalama padding 4px 0 · margin-left:12px · nowrap · flex-shrink:0 · min-width:0",',
];
const VAKA_YENI_BIR = "D33 logo master birebir: inline-flex sarmalayıcı · relative/flex marka kutusu · 'formul' 2.25rem · -1.05px · 0.85 · #d31d24 · çift #f29222 çizgi width 21 · right 8 · top 0.5 · viewBox 0 0 100 40 · stroke-width 14 · 'kurs merkezi' 0.74rem · -0.4px · margin-top 0 (çakışma) · margin-right 14 · #1a1a1a · padding 5px · nowrap/flex-shrink:0/min-width:0/margin-left:12px";
const VAKA_YENI_FONT = "D33 gömülü font ailesi = MontsKart (italic 900 base64 @font-face) · Montserrat/CDN referansı YOK";
const cikar = (s) => s.replace(/^"/, "").replace(/"$/, "").replace(/,$/, "").replace(/:"/, ":");
for (const yol of ["elle-vaka-adlari-base.mjs", "suit-vakalar/ks-ders-karti.mjs.txt"]) {
  if (!existsSync(yol)) continue;
  const sat = readFileSync(yol, "utf8").split("\n");
  const eskiAdlar = ["D30 logo kademe", "D31 logo master", "D32 logo görünürlük"];
  const duz = (l) => l.trim().replace(/^"/, "").replace(/",?$/, "").replace(/,$/, "");
  let degisti = 0;
  for (let i = 0; i < sat.length; i++) {
    const t = duz(sat[i]);
    if (!eskiAdlar.some((a) => t.startsWith(a))) continue;
    const yeni = VAKA_YENI_BIR;
    sat[i] = yol.endsWith(".txt") ? yeni : "    \"" + yeni + "\",";
    degisti++;
    break;
  }
  if (!degisti) { console.log("VAKA ADI: zaten güncel (" + yol + ")"); continue; }
  writeFileSync(yol, sat.join("\n"));
  console.log("VAKA ADI güncellendi: " + yol);
}
/* font vaka adı (D30 "Montserrat" adlı assertion) */
for (const yol of ["elle-vaka-adlari-base.mjs", "suit-vakalar/ks-ders-karti.mjs.txt"]) {
  if (!existsSync(yol)) continue;
  const sat = readFileSync(yol, "utf8").split("\n");
  const i = sat.findIndex((l) => /Montserrat base64 data-URI @font-face/.test(l));
  if (i < 0) continue;
  sat[i] = yol.endsWith(".txt") ? VAKA_YENI_FONT : "    \"" + VAKA_YENI_FONT + "\",";
  writeFileSync(yol, sat.join("\n"));
  console.log("FONT VAKA ADI güncellendi: " + yol);
}

/* 6) önbellek damgası: index.html app.js?v=<app.js SHA-256 ilk 16 hane> */
const damga = createHash("sha256").update(readFileSync("app.js")).digest("hex").slice(0, 16);
for (const yol of ["index.html", "dist/index.html", "isolate/index.html"]) {
  if (!existsSync(yol)) continue;
  const s = readFileSync(yol, "utf8");
  const m = s.match(/app\.js\?v=([0-9a-f]{16})/);
  if (!m || m[1] === damga) continue;
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

/* 7) ÖNİZLEME: karttaki GERÇEK markup'tan üretilir (birebir aynı string) →
      tarayıcıda MontsKart fontuyla aynı görünüm, publish/PNG beklemeden bakılabilir. */
if (!TERS) {
  const sat = readFileSync("app.js", "utf8").split("\n");
  const html = (l) => l.trim().replace(/^'/, "").replace(/' \+$/, "");
  const w = sat.findIndex((l) => l.includes("display:inline-flex;flex-direction:column"));
  const st = sat.findIndex((l) => l.includes("<style>@font-face"));
  const b = sat.findIndex(isaret);
  const e = sat.findIndex((l, k) => k > b && l === blokSonu);
  if (w < 0 || st < 0 || b < 0 || e < 0) { console.error("ÖNİZLEME: blok bulunamadı"); process.exit(1); }
  const fontCss = html(sat[st]);
  const logoHtml = sat.slice(w, st).concat(sat.slice(b, e)).map(html).join("\n        ");
  const sayfa = [
    "<!doctype html>",
    '<html lang="tr">',
    "<head>",
    '<meta charset="utf-8" />',
    "<title>Formül Kurs — ders kartı başlığı önizleme (D33 master)</title>",
    "<!-- Bu sayfa app.js:dersKartiHTML içindeki GERÇEK logo markup'ından üretildi (birebir aynı string).",
    "     Kartta gömülü base64 font geldiği için burada da kartla AYNI font tanımı kullanılır. -->",
    "<style>",
    fontCss,
    "  body { margin:0; padding:32px; background:#eef1f6; font-family:Inter, system-ui, sans-serif; }",
    "  .cerceve { width:1200px; }",
    "  .ust { display:flex; justify-content:space-between; align-items:center; gap:12px; }",
    "  .sol { display:flex; gap:12px; align-items:center; }",
    "  .rozet { background:#ecfdf5; color:#047857; font-size:11px; font-weight:800; padding:4px 12px; border-radius:99px; }",
    "  .not { margin-top:18px; font-size:12px; color:#475569; line-height:1.6; }",
    "  code { background:#fff; padding:1px 5px; border-radius:4px; }",
    "</style>",
    "</head>",
    "<body>",
    '<div class="cerceve">',
    '  <div style="background:#f4f6fa;padding:24px;border-radius:16px">',
    '    <div style="background:#fff;border-radius:14px;padding:24px 26px">',
    '      <div class="ust">',
    '        <div class="sol">',
    '          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="12" fill="#6366f1"/><rect x="11" y="12" width="18" height="16" rx="2" fill="none" stroke="#ffffff" stroke-width="2"/><line x1="11" y1="17" x2="29" y2="17" stroke="#ffffff" stroke-width="2"/><line x1="17" y1="10" x2="17" y2="14" stroke="#ffffff" stroke-width="2"/><line x1="23" y1="10" x2="23" y2="14" stroke="#ffffff" stroke-width="2"/></svg>',
    '          <div style="min-width:0"><div style="font-size:16px;font-weight:800;color:#0f172a">Birebir Ders Kartı</div></div>',
    "        " + logoHtml,
    "        </div>",
    '        <span class="rozet">Planlandı</span>',
    "      </div>",
    "    </div>",
    "  </div>",
    '  <div class="not">',
    "    D33 kademeleri: marka 2.25rem · -1.05px · line-height 0.85 · #d31d24 · çift #f29222 çizgi width 21px (viewBox 0 0 100 40, stroke-width 14) · right 8px · top 0.5px · alt yazı 0.74rem · -0.4px · margin-top 0 (çakışma kuralı) · margin-right 14px · sarmalayıcı padding 5px + margin-left 12px · font: gömülü MontsKart (italic 900).",
    "  </div>",
    "</div>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
  writeFileSync("isolate/logo-onizleme.html", sayfa);
  console.log("ÖNİZLEME üretildi (gerçek markup'tan): isolate/logo-onizleme.html");
}
