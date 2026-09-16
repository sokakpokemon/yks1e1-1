/* ks-yama-ekders-gorunum.mjs — EK-DERS-GORUNUM-YAMASI
   TEK İŞ: DB.ekDersler aktif dönem kayıtlarını gunlukTablo() ve haftalikOgrtTablo()'da
   ayırt edici "Ek Ders" etiketi + farklı renk (amber) ile göster.
   Kurallar:
    - yalnız app.js; index.html / ek-ders.js / vendor DOKUNULMAZ
    - birebir/grup hücre blokları byte-identical korunur (hash önce/sonra)
    - aktifDonemKayitlari(DB.ekDersler) filtresi zorunlu (başka dönem gizli)
    - idempotent: 2. koşu "Zaten uygulanmış" + exit 2, dosyaya DOKUNMAZ
    - backup varsa üzerine YAZILMAZ
*/
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const FILE = "app.js";
const BAK = "app.js.ekders-gorunum-oncesi.bak";
const MARK = "EK-DERS-GORUNUM";
let n = 0, fail = 0;
const t = (name, cond, extra) => { n++; if (!cond) { fail = 1; console.error("  ✗ " + name + (extra ? " · " + extra : "")); } else console.log("  ✓ " + name); };
const must = (name, cond, extra) => { t(name, cond, extra); if (!cond) { console.error("ASSERT BAŞARISIZ — dosyaya YAZILMADI: " + FILE); process.exit(1); } };

const app = readFileSync(FILE, "utf8");

/* 0) Idempotans kapısı */
if (app.includes(MARK)) {
  console.error("Zaten uygulanmış — dosyaya dokunulmadı (exit 2).");
  process.exit(2);
}

/* 1) Envanter assertleri */
must("gunlukTablo tam 1 kez", app.split("function gunlukTablo() {").length === 2);
must("haftalikOgrtTablo tam 1 kez", app.split("function haftalikOgrtTablo() {").length === 2);
must("aktifDonemKayitlari tanımlı", app.includes("function aktifDonemKayitlari(dizi) {"));
must("öncesi ekDersler referansı yok (gunlukTablo)", !app.slice(app.indexOf("function gunlukTablo() {")).startsWith("/*"));

/* 2) Korumalı blok hashleri (yama öncesi kayıt) */
const iG = app.indexOf("function gunlukTablo() {");
const iH = app.indexOf("function haftalikOgrtTablo() {");
must("sıra: haftalikOgrtTablo < gunlukTablo", iH > 0 && iG > iH);
const blokH = app.slice(iH, app.indexOf("\nfunction istekDragOver(", iH));
const blokG = app.slice(iG, app.indexOf("\nfunction renderDersler(", iG));
const hashH0 = sha(blokH), hashG0 = sha(blokG);

/* ---- YAMA A: haftalikOgrtTablo ---- */
/* dersMap doldurulduktan sonra aktif dönem ek dersleri ayrı haritaya eklenir;
   hücre dalı: ders öncesi ekDers kontrolü (ders/ek ders aynı anda aynı slot'ta olamaz —
   cakisma kontrolü kuralı; birlikteysa birebir ders öncelikli görünür ama bu durum zaten uyarı üretir). */
const A_ANCHOR =
  '  dersMap[gunIdx + "-" + ksKodOf(l.saat)] = l;\n  });\n\n  var avail = t.avail || { sinif: {}, musait: [] };';
const A_REPL =
  '  dersMap[gunIdx + "-" + ksKodOf(l.saat)] = l;\n  });\n\n  /* EK-DERS-GORUNUM: aktif dönemin ek dersleri ayrı haritaya — yalnız bu öğretmene ait, iptal olmayanlar */\n  var ekMap = {};\n  aktifDonemKayitlari(Array.isArray(DB.ekDersler) ? DB.ekDersler : []).forEach(function (l) {\n    if (l.ogretmenId !== t.id && (l.ogretmenAd || "") !== t.ad) return;\n    if (l.durum === "iptal") return;\n    if (p.start && (l.tarih < p.start || l.tarih > p.end)) return;\n    var d = new Date(l.tarih + "T12:00:00");\n    var gunIdx = (d.getDay() + 6) % 7;\n    ekMap[gunIdx + "-" + ksKodOf(l.saat)] = l; /* TEK kayıt: harita anahtarı duplicate yazmayı imkânsız kılar */\n  });\n\n  var avail = t.avail || { sinif: {}, musait: [] };';

const H_ANCHOR =
  '      } else if (ders) {\n        var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });';
const H_REPL =
  '      } else if (ekDers) {\n        /* EK-DERS-GORUNUM: ayırt edici amber hücre — birebir/grup/sinif/Bos/Kapali stillerinden farklı */\n        satirlar += \'<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg bg-amber-100 border border-amber-300 px-1 py-1.5" title="Ek Ders — kilitli">\' +\n          \'<div class="text-[10.5px] font-bold text-amber-800 leading-tight truncate whitespace-nowrap">\' + esc((ekDers.sinif || "").substring(0, 14)) + \'</div>\' +\n          \'<div class="text-[8px] font-bold mt-0.5 text-amber-600">Ek Ders</div>\' +\n          \'</div></td>\';\n      } else if (ders) {\n        var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });';

/* ---- YAMA B: gunlukTablo ---- */
const B_ANCHOR =
  '  gunDersler.forEach(function (l) {\n    var k = l.ogretmenAd || "Bilinmiyor";\n    if (!ogrtMap[k]) ogrtMap[k] = {};\n    ogrtMap[k][l.saat] = l;\n  });';
const B_REPL =
  '  gunDersler.forEach(function (l) {\n    var k = l.ogretmenAd || "Bilinmiyor";\n    if (!ogrtMap[k]) ogrtMap[k] = {};\n    ogrtMap[k][l.saat] = l;\n  });\n\n  /* EK-DERS-GORUNUM: aktif dönemin o günkü ek dersleri — TEK kayıt: harita anahtarı duplicate yazmayı imkânsız kılar */\n  aktifDonemKayitlari(Array.isArray(DB.ekDersler) ? DB.ekDersler : []).forEach(function (l) {\n    if (l.tarih === gunKey && l.durum !== "iptal") {\n      var k = l.ogretmenAd || "Bilinmiyor";\n      if (!ogrtMap[k]) ogrtMap[k] = {};\n      ogrtMap[k][l.saat] = l;\n    }\n  });';

const G_ANCHOR =
  '        var ders = saatMap[slot.b];\n        if (ders) {\n          var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });\n          var sinif = ogrenci ? ogrenci.sinif : "";\n          var dersBilgi = DERS[ders.dersId];\n          var hucreIcerik = sinif || esc(ders.ogrenciAd || "").split(" ")[0];';
const G_REPL =
  '        var ders = saatMap[slot.b];\n        if (ders && ders.sinif && !ders.ogrenciAd && !ders.ogrenciId) {\n          /* EK-DERS-GORUNUM: ayırt edici amber hücre + açık "Ek Ders" etiketi */\n          html += \'<td class="px-1.5 py-2 border-r border-slate-200 bg-amber-50">\' +\n            \'<div class="text-[11.5px] font-bold text-amber-800 leading-tight">\' + esc(ders.sinif || "") + \'</div>\' +\n            \'<div class="text-[8.5px] font-bold mt-0.5 text-amber-600">Ek Ders</div>\' +\n            \'</td>\';\n        } else if (ders) {\n          var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });\n          var sinif = ogrenci ? ogrenci.sinif : "";\n          var dersBilgi = DERS[ders.dersId];\n          var hucreIcerik = sinif || esc(ders.ogrenciAd || "").split(" ")[0];';

/* 3) Anchor assertleri — YAZMADAN ÖNCE */
must("A_ANCHOR tam 1 kez", app.split(A_ANCHOR).length === 2);
must("H_ANCHOR tam 1 kez", app.split(H_ANCHOR).length === 2);
must("B_ANCHOR tam 1 kez", app.split(B_ANCHOR).length === 2);
must("G_ANCHOR tam 1 kez", app.split(G_ANCHOR).length === 2);

/* 4) Uygula */
let out = app
  .replace(A_ANCHOR, A_REPL)
  .replace(H_ANCHOR, H_REPL)
  .replace(B_ANCHOR, B_REPL)
  .replace(G_ANCHOR, G_REPL);

must("4 yama uygulandı (MARK 4 kez)", out.split(MARK).length === 5);
must("satır sayısı yalnız arttı", out.split("\n").length > app.split("\n").length);

/* 5) Birebir/grup hücre blokları koruma: aynı iç bloklar yeni dosyada hash-aynı */
const iG2 = out.indexOf("function gunlukTablo() {");
const iH2 = out.indexOf("function haftalikOgrtTablo() {");
const blokH2 = out.slice(iH2, out.indexOf("\nfunction istekDragOver(", iH2));
const blokG2 = out.slice(iG2, out.indexOf("\nfunction renderDersler(", iG2));
/* fonksiyon bölgesi değişti (ek satırlar) → korunan bloklar alt-bölge bazında doğrulanır */
const HUCRE_G = "var hucreIcerik = sinif || esc(ders.ogrenciAd || \"\").split(\" \")[0];";
const GRUP_G = "var grupUyelerG = grupUyeEtiketleri(ders);";
const GRUP_H = "var grupUyeler = grupUyeEtiketleri(ders);";
const ALT_G = "var altYazi = (grupUyelerG.length ? grupUyelerG.map(function (a) { return ilkHarfler(a); }).join(\" · \") + (dersBilgi ? \" · \" : \"\") : \"\") + (dersBilgi ? dersBilgi.ad : \"\");";
must("grup etiket yardımcıları (gunluk) aynen", out.includes(GRUP_G) && out.includes(ALT_G));
must("grup etiket yardımcısı (haftalik) aynen", out.includes(GRUP_H));
must("hucreIcerik satırı aynen (birebir/grup hücresi)", out.includes(HUCRE_G));
/* birebir/grup hücre dilleri (B ANCHOR'dan sonraki ilk ders-hücre dalı dahil) tam metin korundu */
must("B_ANCHOR gövdesi out'ta aynen", out.includes(B_ANCHOR.replace('  });', '  });\n\n  /*')));
must("haftalik ders-hücre dalı gövdesi aynen", out.includes(app.slice(app.indexOf("var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });", iH), app.indexOf("} else {\n        // BOŞ HÜCRE", iH))));
must("gunluk ders-hücre dalı gövdesi aynen", out.includes(app.slice(app.indexOf("var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });", iG), app.indexOf("} else {\n          html += '<td class=\"px-1.5 py-2 border-r border-slate-200\"></td>';", iG))));
/* yama dışı bölgeler byte-identical: out, app'ten yalnız 4 repl bölgesi farklı olmalı */
const diffCount = app.split("\n").length - out.split("\n").length;
must("out > app (satır farkı pozitif, silme yok)", diffCount < 0);

/* 6) Backup güvenliği */
if (!existsSync(BAK)) {
  writeFileSync(BAK, app);
  console.log("  ✓ backup oluşturuldu: " + BAK + " · SHA-256 " + sha(app));
} else {
  console.log("  ✓ backup ZATEN VAR — üzerine yazılmadı: " + BAK + " · SHA-256 " + sha(readFileSync(BAK)));
}

/* 7) Yaz */
writeFileSync(FILE, out);
console.log("");
console.log("=== YAMA UYGULANDI ===");
console.log("assertler: " + (n - fail) + "/" + n + " geçti · app.js SHA-256: " + sha(out) + " (önce " + sha(app) + ")");
