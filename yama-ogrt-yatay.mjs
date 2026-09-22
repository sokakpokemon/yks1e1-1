import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

let src = readFileSync("app.js", "utf8");
const origLen = src.length;
const origSha = createHash("sha256").update(src).digest("hex");
let degisiklik = 0;

function bir(adaylar, to, label) {
  const liste = Array.isArray(adaylar) ? adaylar : [adaylar];
  for (const from of liste) {
    const say = src.split(from).length - 1;
    if (say === 1) { src = src.replace(from, to); console.log("OK  [" + label + "]"); degisiklik++; return; }
    if (say > 1) { console.error("HATA [" + label + "]: ankor sayısı " + say + " (beklenen 1)"); process.exit(1); }
  }
  console.error("HATA [" + label + "]: ankor HİÇBULUNAMADI"); process.exit(1);
}

/* 1) Gün anahtarı: getDay() (Paz=0) → dowIdx (Pzt=0) — avail.sinif yazarlarıyla aynı kural */
bir(`  var gunNo = new Date(gunKey + "T12:00:00").getDay(); /* 0=Pazar … 6=Cumartesi; KISA_KOD GUN_KISA ile aynı sıra */`,
`  var gunNo = dowIdx(gunKey); /* avail.sinif anahtarları Pzt=0 (gridTablo/togOgr yazımıyla aynı) */`,
"gün anahtarı dowIdx");

/* 2) K (mola) slotu satır üretmez — bilinmeyen slotla aynı uydurmaz kapsamında */
bir(`    if (p[1] === "K") return; /* mola gösterilmez */
    var slot = KISA_KOD.filter(function (x) { return x.no === p[1]; })[0];
    if (!slot) return; /* bilinmeyen slot uydurulmaz */`,
`    var slot = KISA_KOD.filter(function (x) { return x.no === p[1]; })[0];
    if (!slot) return; /* mola (K) ve bilinmeyen slot uydurulmaz */`,
"K/bilinmeyen slot uydurmaz");

/* 3) Sınıf dersi saatYazi ekranla aynı: saatEtiket(slot.b) = "no · b-e" */
bir([`saatYazi: slot.no + " · " + slot.b + "-" + slot.e, tur: "Sınıf dersi",`,
     `saatYazi: slot.no + " \\u00b7 " + slot.b + "-" + slot.e, tur: "Sınıf dersi",`],
`saatYazi: saatEtiket(slot.b), tur: "Sınıf dersi",`,
"sınıf saatYazi saatEtiket");

/* 4) Birebir döngüsü → saatMap (gunlukTablo ile aynı tek-kayıt haritası) + Ek Ders hariç + konu kuralı */
bir(`  /* Birebirler: o gün o öğretmenin aktif (iptal değil) ders kayıtları; grup hariç tutulmaz — TAM program görselidir */
  aktifDonemKayitlari(DB.dersler).forEach(function (l) {
    if (l.tarih !== gunKey || l.durum === "iptal") return;
    if (l.ogretmenId !== ogrtId) return;
    if (!l.saat) return;
    var slot = KISA_KOD.filter(function (x) { return x.b === l.saat; })[0] || KISA_KOD.filter(function (x) { return l.saat >= x.b && l.saat < x.e; })[0];
    if (!slot) return; /* mola/çıkmaz saat uydurulmaz */
    var o = DB.ogrenciler.find(function (x) { return x.id === l.ogrenciId; });
    var grupUyeler = (typeof grupOgrenciAdlari === "function") ? grupOgrenciAdlari(l) : [];
    var adYazi = grupUyeler.length > 1 ? grupUyeler.join(", ") : (o ? o.ad : (l.ogrenciAd || "—"));
    var D = DERS[l.dersId] || DERS.tur;
    satirlar.push({ slot: parseInt(slot.no, 10), saatYazi: saatEtiket(l.saat), tur: "Birebir", ogrenci: adYazi, sinif: (o && o.sinif) ? o.sinif : "Sınıf belirtilmemiş", ders: (D && D.ad) ? D.ad : "—", konu: l.konu || "Genel tekrar", durum: l.durum === "tamamlandi" ? "Yapıldı" : "Planlandı", cakisma: false, dersRef: l.id });
  });`,
`  /* Birebirler: o gün o öğretmenin kayıtları — gunlukTablo ile AYNI tek-kayıt saat haritası
     (harita anahtarı duplicate ezme imkânsız kılar); Ek Ders HARİÇ (ekran ölçütü); grup hariç tutulmaz — TAM program görselidir */
  var saatMap = {};
  aktifDonemKayitlari(DB.dersler).forEach(function (l) {
    if (l.tarih !== gunKey || l.durum === "iptal") return;
    if (l.ogretmenId !== ogrtId && (l.ogretmenAd || "") !== t.ad) return;
    if (!l.saat) return;
    if (l.sinif && !l.ogrenciAd && !l.ogrenciId) return; /* ek ders görselleşmez (ekranla aynı) */
    saatMap[l.saat] = l;
  });
  Object.keys(saatMap).forEach(function (saat) {
    var l = saatMap[saat];
    var slot = KISA_KOD.filter(function (x) { return x.b === saat; })[0];
    if (!slot) return; /* mola/çıkmaz saat uydurulmaz (ekran da göstermez) */
    var o = DB.ogrenciler.find(function (x) { return x.id === l.ogrenciId; });
    var grupUyeler = (typeof grupOgrenciAdlari === "function") ? grupOgrenciAdlari(l) : [];
    var adYazi = grupUyeler.length > 1 ? grupUyeler.join(", ") : (o ? o.ad : (l.ogrenciAd || "—"));
    var D = DERS[l.dersId] || DERS.tur;
    var dersAdi = (D && D.ad) ? D.ad : "";
    var konu = (typeof l.konu === "string" ? l.konu : "").trim();
    /* birebirHucreHTML konu-kurallarıyla AYNI geçerlilik: boş/derse-eşit/sınıfa-eşit/ad-eşit → "Genel tekrar" */
    var konuGecerli = konu.length > 0 && konu !== dersAdi && konu !== ((o && o.sinif) || "") && konu !== adYazi;
    satirlar.push({ slot: parseInt(slot.no, 10), saatYazi: saatEtiket(l.saat), tur: "Birebir", ogrenci: adYazi, sinif: (o && o.sinif) ? o.sinif : "Sınıf belirtilmemiş", ders: (D && D.ad) ? D.ad : "—", konu: konuGecerli ? konu : "Genel tekrar", durum: l.durum === "tamamlandi" ? "Yapıldı" : "Planlandı", cakisma: false, dersRef: l.id });
  });`,
"birebir saatMap + ek-ders hariç + konu kuralı");

/* 5) ogrtGunlukSlotlari yardımcısı: yatay şeridin kolon modeli (KISA_KOD 11 slot, ÖĞLE kolonu yok) */
const TAIL = `  satirlar.forEach(function (r) { if (slotSay[r.slot] > 1) r.cakisma = true; });
  return satirlar;
}
`;
bir(TAIL, TAIL + `/* Yatay şeridin kolon modeli: KISA_KOD'un 11 slottu (ÖĞLE kolonu yok); her kolon alt-alta öge listesi taşır */
function ogrtGunlukSlotlari(ogrtId, gunKey) {
  var satirlar = ogrtGunlukSatirlar(ogrtId, gunKey);
  return KISA_KOD.map(function (k) {
    return { no: k.no, b: k.b, e: k.e, ogeler: satirlar.filter(function (r) { return r.slot === parseInt(k.no, 10); }) };
  });
}
`,
"ogrtGunlukSlotlari ekle");

/* 6) dersKartiOgrtGunlukHTML → yatay saat şeridi (ekran hücrelerinin inline-styled aynası) */
const NEW_HTML = `/* PNG tablosu: ekran hücrelerinin INLINE-STYLED aynası (html2canvas offscreen kopyada runtime
   tailwind üretimine bağımlı olamaz). Renk/boyut eşlemesi — haftalikOgrtTablo ile birebir:
   rose kart = bg-rose-100 #ffe4e6 / border-rose-200 #fecdd3 / text-rose-700 #be123c;
   birebir kart = bg-blue-50 #eff6ff / border-blue-200 #bfdbfe, tamamlandi → emerald-50 #ecfdf5 / emerald-200 #a7f3d0;
   kapalı hücre = bg-slate-100 #f1f5f9 / text-slate-400 #94a3b8; boş hücre boş (+ istek kutusu PNG'ye girmez).
   İÇİNDE YOK: buton, işlem ikonu, draggable/drop, "+ istek", TELEFON. */
function dersKartiOgrtGunlukHTML(ogrtId, gunKey) {
  var t = DB.ogretmenler.find(function (x) { return x.id === ogrtId; });
  var satirlar = ogrtGunlukSatirlar(ogrtId, gunKey);
  var ogrAd = t ? String(t.ad || "") : "";
  var gunNo = dowIdx(gunKey);
  var gunAdlari = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
  var gunAdi = gunAdlari[gunNo] || "";
  var brans = t ? DERS[t.brans] : null;
  var tamam = satirlar.filter(function (r) { return r.durum === "Yapıldı"; }).length;
  var rozet = !satirlar.length ? "Planlandı" : (tamam === satirlar.length ? "Yapıldı" : (tamam > 0 ? "Kısmen tamamlandı" : "Planlandı"));
  var rozetBg = rozet === "Yapıldı" ? "#ecfdf5;color:#047857" : rozet === "Kısmen tamamlandı" ? "#fef3c7;color:#b45309" : "#eff6ff;color:#1d4ed8";
  /* Saat başlıkları: haftalikOgrtTablo ile AYNI üretim (KISA_KOD; ÖĞLE kolonu ÇİZİLMEZ) */
  var saatBaslik = "";
  KISA_KOD.forEach(function (k) {
    saatBaslik += '<th style="padding:8px 8px;text-align:center;border-left:1px solid #f1f5f9;min-width:75px">' +
      '<div style="font-size:11px;font-weight:800;color:#475569">' + k.no + " \\u00b7 " + k.b + "</div>" +
      '<div style="font-size:9px;color:#94a3b8">' + k.e + "</div></th>";
  });
  var kapaliMi = function (no) { return (t && t.avail && Array.isArray(t.avail.musait)) ? t.avail.musait.indexOf(gunNo + "-" + no) >= 0 : false; };
  var hcreler = "";
  ogrtGunlukSlotlari(ogrtId, gunKey).forEach(function (s) {
    if (kapaliMi(s.no)) { /* haftalik izgara: Kapalı gri "—" */
      hcreler += '<td style="padding:6px;text-align:center;border-left:1px solid #f1f5f9;background:#f1f5f9"><span style="font-size:9px;color:#94a3b8">—</span></td>';
      return;
    }
    if (!s.ogeler.length) { hcreler += '<td style="padding:6px;border-left:1px solid #f1f5f9"></td>'; return; } /* boş hücre boş kalır */
    var ici = "";
    s.ogeler.forEach(function (r) {
      var cakismaRozeti = r.cakisma ? '<span style="display:inline-block;background:#ffe4e6;color:#e11d48;font-size:7.5px;font-weight:800;padding:1px 6px;border-radius:99px;margin-top:2px">ÇAKIŞMA</span>' : "";
      if (r.tur === "Sınıf dersi") {
        /* haftalikOgrtTablo rose kartı: İÇİNDE YALNIZ sınıf adı (UYDURMA YOK) */
        ici += '<div title="Sınıf dersi — kilitli" style="background:#ffe4e6;border:1px solid #fecdd3;border-radius:8px;padding:4px 4px">' +
          '<div style="font-size:8px;font-weight:700;color:#be123c;line-height:1.25">' + esc(r.sinif) + "</div>" + cakismaRozeti + "</div>";
      } else {
        var kayit = DB.dersler.find(function (x) { return x.id === r.dersRef; });
        var o = kayit ? DB.ogrenciler.find(function (x) { return x.id === kayit.ogrenciId; }) : null;
        var kartBg = kayit && kayit.durum === "tamamlandi" ? "#ecfdf5;border:1px solid #a7f3d0" : "#eff6ff;border:1px solid #bfdbfe";
        /* birebir kartı = EKRANDAKİ birebirHucreHTML ile AYNI üç satır: ad · konu · sınıf (ders adı YOK) */
        ici += '<div title="Birebir" style="background:' + kartBg + ';border-radius:8px;padding:4px 4px">' +
          '<div style="font-size:10px;font-weight:700;color:#1e293b;line-height:1.25">' + esc(r.ogrenci) + "</div>" +
          '<div style="font-size:9px;color:#64748b;line-height:1.25">' + esc(r.konu) + "</div>" +
          '<div style="font-size:8px;font-weight:700;color:#94a3b8;line-height:1.25">' + esc(r.sinif) + "</div>" + cakismaRozeti + "</div>";
      }
    });
    hcreler += '<td style="padding:6px;text-align:center;border-left:1px solid #f1f5f9;vertical-align:top">' + ici + "</td>";
  });
  return '<div id="dersKartiGovde" style="width:1060px;background:#fff;font-family:Inter,system-ui,sans-serif;padding:34px 40px;border-radius:0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div style="display:flex;gap:12px;align-items:center"><div style="width:40px;height:40px;border-radius:13px;background:#14b8a6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px">🎓</div><div><div style="font-size:15px;font-weight:800;color:#0f172a">YKS Birebir Takip</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">Günlük Ders Programı</div></div></div>' +
      '<span style="background:' + rozetBg + ';font-size:11px;font-weight:800;padding:4px 12px;border-radius:99px">' + esc(rozet) + "</span>" +
    "</div>" +
    '<div style="border-bottom:2px solid #e2e8f0;margin:16px 0"></div>' +
    '<div style="font-size:20px;font-weight:800;color:#0f172a">ÖĞRETMEN — ' + esc(ogrAd.toUpperCase()) + "</div>" +
    '<div style="font-size:11px;color:#94a3b8;margin-top:2px">' + esc((brans && brans.ad) ? brans.ad : "Branş yok") + " · " + esc(gunAdi) + " · " + esc(fmtTR(gunKey)) + "</div>" +
    '<div style="border-bottom:1px solid #f1f5f9;margin:12px 0"></div>' +
    '<table style="width:100%;border-collapse:collapse"><tr style="background:#f8fafc">' +
      '<th style="text-align:left;padding:8px 10px;font-size:10.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em;min-width:100px;border-right:1px solid #f1f5f9">GÜN</th>' + saatBaslik +
    "</tr><tr>" +
      '<td style="padding:8px 10px;border-right:1px solid #f1f5f9;font-size:11.5px;font-weight:700;color:#475569;white-space:nowrap">' + esc(gunAdi) + "</td>" + hcreler +
    "</tr></table>" +
    '<div style="border-bottom:1px solid #f1f5f9;margin:14px 0"></div>' +
    '<div style="font-size:9.5px;color:#94a3b8">Bu kart YKS Birebir Takip tarafından oluşturuldu · ' + esc(pencereAdi()) + "</div>" +
  "</div>";
}`;
const htmlRe = /function dersKartiOgrtGunlukHTML\(ogrtId, gunKey\) \{[\s\S]*?\n\}\nfunction dersKartiOgrtGunlukBtnHTML/g;
const htmlEsl = [...src.matchAll(htmlRe)];
if (htmlEsl.length !== 1) { console.error("HATA: HTML blok eşleşme sayısı " + htmlEsl.length + " (beklenen 1)"); process.exit(1); }
if (htmlEsl[0][0].length > 6000) { console.error("HATA: HTML ankoru " + htmlEsl[0][0].length + " karakter — alan ihlali"); process.exit(1); }
src = src.replace(htmlRe, NEW_HTML + "\nfunction dersKartiOgrtGunlukBtnHTML");
console.log("OK  [dersKartiOgrtGunlukHTML yatay]");
degisiklik++;

/* 7) Başlık yorumu yeni sözleşmeye */
const NEW_HEADER = `/* OGRT-YATAY-KART: öğretmen günlük program görseli — EKRANDAKİ ÇİZELGEyle birebir YATAY saat şeridi.
   SÖZLEŞME (bu tur): görsel = haftalikOgrtTablo'nun o günkü satırı; hücre içeriği/sırası ekranla aynı;
   hücre markup'ı yeniden yazılmaz: aynı slot modeli (KISA_KOD 1..11), aynı alan kaynakları kullanılır.
   - Ek Ders HARİÇ (ekran ölçütü: l.sinif && !l.ogrenciAd && !l.ogrenciId — gunlukTablo ile aynı).
   - Sınıf dersi: rose kart, içinde YALNIZ sınıf adı (avail.sinif değeri; ders/konu kaynağı yoksa UYDURMA YOK).
   - Birebir: ad · konu (boşsa "Genel tekrar") · öğrencinin sınıfı (boşsa "Sınıf belirtilmemiş"); DERS adı YOK (ekranla aynı).
   - Sıralama KISA_KOD (1..11); ÖĞLE ARASI (mola/K) kolonu ÇİZİLMEZ; boş hücre boş; Kapalı gri "—".
   - Aynı slotta çoklu kayıt ALT ALTA (ezme/birleştirme YOK); çokluysa her iki ögeye "ÇAKIŞMA".
   - Gün anahtarı dowIdx (Pzt=0) — avail.sinif yazarlarıyla (gridTablo/togOgr*) aynı kural; eski getDay() kayması düzeltildi.
   - Rozet: hepsi planlı "Planlandı" · hepsi yapıldı "Yapıldı" · karışık "Kısmen tamamlandı" (sınıf dersi planlı sayılır).
   - TELEFON YOK (görsel + dosya adı); saveDB/localStorage YAZIMI YOK; paylaşım zinciri (canShare → pano → her durumda PNG indir) aynen. */`;
const headRe = /\/\* OGRT-TAMGUN-KART: öğretmen günlük TAM program görseli[\s\S]*?VERİ DEĞİŞTİRMEZ\. \*\//g;
const headEsl = [...src.matchAll(headRe)];
if (headEsl.length !== 1) { console.error("HATA: başlık eşleşme sayısı " + headEsl.length + " (beklenen 1)"); process.exit(1); }
const headOldLen = headEsl[0][0].length;
if (headOldLen > 2200) { console.error("HATA: başlık ankoru " + headOldLen + " karakter — alan ihlali"); process.exit(1); }
const satirlarIdx = src.indexOf("function ogrtGunlukSatirlar");
const headIdx = src.indexOf(headEsl[0][0]);
if (headIdx < 0 || headIdx > satirlarIdx || satirlarIdx - headIdx > 2200) { console.error("HATA: başlık ankoru ogrt bölgesi DIŞINDA (headIdx=" + headIdx + " satirlarIdx=" + satirlarIdx + ")"); process.exit(1); }
src = src.replace(headRe, NEW_HEADER);
console.log("OK  [başlık OGRT-YATAY-KART]");
degisiklik++;

/* Bölge-scope zorunlu/yasak taraması (yeni ogrt bölgesi) */
const bolgeBas = src.indexOf("OGRT-YATAY-KART");
const bolgeSon = src.indexOf("function dersKartiOgrtGunlukBtnHTML");
if (bolgeBas < 0 || bolgeSon < 0 || bolgeSon <= bolgeBas) { console.error("HATA: bölge sınırları"); process.exit(1); }
const bolge = src.slice(bolgeBas, bolgeSon);
const zorunlu = ["function ogrtGunlukSlotlari(", "Kısmen tamamlandı", "ÖĞRETMEN — ", "dowIdx(gunKey)", "saatMap", "Ek Ders HARİÇ", "l.sinif && !l.ogrenciAd && !l.ogrenciId", 'GÜN</th>'];
const yasak = ["OGRT-TAMGUN-KART", 'th("SAAT")', "Yapıldı (", "Planlandı (", 'getDay(); /* 0=Pazar', 'if (p[1] === "K") return;', 'th("KONU")'];
for (const z of zorunlu) if (!bolge.includes(z)) { console.error("ZORUNLU YOK: " + z); process.exit(1); }
for (const y of yasak) if (bolge.includes(y)) { console.error("YASAK VAR: " + y); process.exit(1); }
console.log("OK  [bölge taraması: zorunlu " + zorunlu.length + " / yasak " + yasak.length + "]");

writeFileSync("app.js", src);
const sha = (s) => createHash("sha256").update(s).digest("hex");
console.log("yama sayısı: " + degisiklik);
console.log("byte: " + origLen + " → " + src.length);
console.log("eski SHA: " + origSha);
console.log("yeni SHA: " + sha(Buffer.from(src, "utf8")));
