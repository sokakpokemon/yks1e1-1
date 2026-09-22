/* YAMA: OGRT-YATAY-KART (v3 sözleşme)
   P1) gunlukTablo: aynı slotta çok ders kaydı EZİLMEZ (dizi + alt alta birebirHucreHTML)
   P2) ogrtGunlukSatirlar → ogrtGunlukHucreler (dowIdx convention + KISA_KOD 1..11 yatay)
       + ogrtGunlukHucreHTML (mevcut ekran kartlarının birebir markup'ı)
       + dersKartiOgrtGunlukHTML (yatay saat şeridi PNG gövdesi)
       + dersKartiOgrtGunlukAc (satır-varlık koşulu yeni yardımcıyla)
   Her yama: tam 1 eşleşme zorunlu — eşleşmezse DUR (sessiz bozulma yok). */
import { readFileSync, writeFileSync } from "node:fs";

const dosya = "app.js";
let s = readFileSync(dosya, "utf8");
const basUzunluk = s.length;
let yamaSay = 0;
function degistir(ad, eski, yeni) {
  const ilk = s.indexOf(eski);
  if (ilk < 0) { console.error("YAMA HATASI (bulunamadı): " + ad); process.exit(1); }
  if (s.indexOf(eski, ilk + 1) >= 0) { console.error("YAMA HATASI (çok eşleşme): " + ad); process.exit(1); }
  s = s.slice(0, ilk) + yeni + s.slice(ilk + eski.length);
  yamaSay++;
  console.log("✓ yama: " + ad);
}

/* ---------- P1a: ders kayıtları diziye ---------- */
degistir("P1a ogrtMap dersler dizi",
`    if (!ogrtMap[k]) ogrtMap[k] = {};
    ogrtMap[k][l.saat] = l;
    if (!ogrtIdMap[k] && l.ogretmenId) ogrtIdMap[k] = l.ogretmenId;
  });`,
`    if (!ogrtMap[k]) ogrtMap[k] = {};
    /* OGR-YATAY-KART: aynı slotta çok kayıt EZİLMEZ — diziye yazılır (ekran da alt alta basar) */
    if (!Array.isArray(ogrtMap[k][l.saat])) ogrtMap[k][l.saat] = [];
    ogrtMap[k][l.saat].push(l);
    if (!ogrtIdMap[k] && l.ogretmenId) ogrtIdMap[k] = l.ogretmenId;
  });`);

/* ---------- P1b: ek ders kayıtları diziye ---------- */
degistir("P1b ogrtMap ekDersler dizi",
`      if (!ogrtMap[k]) ogrtMap[k] = {};
      ogrtMap[k][l.saat] = l;
      if (!ogrtIdMap[k] && l.ogretmenId) ogrtIdMap[k] = l.ogretmenId;
    }`,
`      if (!ogrtMap[k]) ogrtMap[k] = {};
      /* OGR-YATAY-KART: aynı slotta çok kayıt EZİLMEZ — diziye yazılır */
      if (!Array.isArray(ogrtMap[k][l.saat])) ogrtMap[k][l.saat] = [];
      ogrtMap[k][l.saat].push(l);
      if (!ogrtIdMap[k] && l.ogretmenId) ogrtIdMap[k] = l.ogretmenId;
    }`);

/* ---------- P1c: günlük hücre dalları — çok kayıt alt alta ---------- */
degistir("P1c gunluk hücre dalları",
`        var ders = saatMap[slot.b];
        if (ders && ders.sinif && !ders.ogrenciAd && !ders.ogrenciId) {
          /* EK-DERS-GORUNUM: ayırt edici amber hücre + açık "Ek Ders" etiketi */
          html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-amber-50">' +
            '<div class="text-[11.5px] font-bold text-amber-800 leading-tight">' + esc(ders.sinif || "") + '</div>' +
            '<div class="text-[8.5px] font-bold mt-0.5 text-amber-600">Ek Ders</div>' +
            '</td>';
        } else if (ders) {
          var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
          var sinif = ogrenci ? ogrenci.sinif : "";
          /* GRUP: günlük tabloda üye baş harfleri alt satırda (birebirde eklenmez) */
          var grupUyelerG = grupUyeEtiketleri(ders);
          var durumRenkG = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
          /* BIREBIR-GORUNUM-ORTAK-YAMASI: haftalik tablo ile AYNI hücre (tam ad + gerçek konu + sınıf; ders adı yok) */
          /* GUNLUK-DERS-TASI-YAMASI: yalnız AKTİF TEK ÖĞRENCİLİ birebir ders draggable'dır;
             grup / iptal / Sınıf Dersi (rose) / Ek Ders (amber) / Kapalı (gri) sürüklenemez.
             Taşıma MEVCUT dersDrag/dersBurak yoluyla yapılır — paralel DnD sistemi kurulmaz. */
          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors"' +
            (ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ? ' draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \\'' + esc(ders.id) + '\\'); this.style.opacity=\\'0.45\\'" ondragend="dersDropHedef=null; this.style.opacity=\\'\\'"' : '') + '>' +
            birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || "", sinif, durumRenkG); /* DERS-KARTI-TASIMA-YAMASI: gunluk hücreden kart butonu kaldırıldı */

          if (grupUyelerG.length) html += '<div class="text-[8.5px] text-slate-400 mt-0.5">' + grupUyelerG.map(function (a) { return ilkHarfler(a); }).join(" · ") + '</div>';
          html += '</td>';
        } else if (ogrtId) {`,
`        var slotKayitlari = Array.isArray(saatMap[slot.b]) ? saatMap[slot.b] : (saatMap[slot.b] ? [saatMap[slot.b]] : []);
        var ders = slotKayitlari[0];
        if (ders && ders.sinif && !ders.ogrenciAd && !ders.ogrenciId) {
          /* EK-DERS-GORUNUM: ayırt edici amber hücre + açık "Ek Ders" etiketi */
          html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-amber-50">' +
            '<div class="text-[11.5px] font-bold text-amber-800 leading-tight">' + esc(ders.sinif || "") + '</div>' +
            '<div class="text-[8.5px] font-bold mt-0.5 text-amber-600">Ek Ders</div>' +
            '</td>';
        } else if (ders) {
          /* OGR-YATAY-KART: aynı slotta çok kayıt EZİLMEZ — her kayıt kendi hücre kartıyla ALT ALTA basılır */
          var hucreIci = "";
          slotKayitlari.forEach(function (ders) {
            var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
            var sinif = ogrenci ? ogrenci.sinif : "";
            var durumRenkG = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
            /* BIREBIR-GORUNUM-ORTAK-YAMASI: haftalik tablo ile AYNI hücre (tam ad + gerçek konu + sınıf; ders adı yok) */
            hucreIci += birebirHucreHTML(ders, ogrenci, ders.ogrenciAd || "", sinif, durumRenkG); /* DERS-KARTI-TASIMA-YAMASI: gunluk hücreden kart butonu kaldırıldı */
            var grupUyelerG = grupUyeEtiketleri(ders);
            if (grupUyelerG.length) hucreIci += '<div class="text-[8.5px] text-slate-400 mt-0.5">' + grupUyelerG.map(function (a) { return ilkHarfler(a); }).join(" · ") + '</div>';
          });
          /* GUNLUK-DERS-TASI-YAMASI: yalnız AKTİF TEK ÖĞRENCİLİ birebir ders draggable'dır;
             grup / iptal / Sınıf Dersi (rose) / Ek Ders (amber) / Kapalı (gri) sürüklenemez.
             Taşıma MEVCUT dersDrag/dersBurak yoluyla yapılır — paralel DnD sistemi kurulmaz. */
          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors"' +
            (slotKayitlari.length === 1 && ders.durum !== "iptal" && dersOgrenciIds(ders).length === 1 ? ' draggable="true" style="cursor:grab" ondragstart="dersDrag(event, \\'' + esc(ders.id) + '\\'); this.style.opacity=\\'0.45\\'" ondragend="dersDropHedef=null; this.style.opacity=\\'\\'"' : '') + '>' +
            hucreIci + '</td>';
        } else if (ogrtId) {`);

/* ---------- P2a: buton koşulu yeni yardımcıya ---------- */
degistir("P2a gunlukTablo buton koşulu",
`    var ogrtGunlukSatirVar = ogrtGunlukSatirlar(ogrtId, gunKey).length > 0;`,
`    /* OGRT-YATAY-KART: satır VARSA buton — sınıf dersi VEYA birebir (yalnız ek ders buton vermez) */
    var ogrtGunlukSatirVar = ogrtGunlukHucreler(ogrtId, gunKey).some(function (h) { return h.ogeler.some(function (o) { return o.tip === "sinif" || o.tip === "birebir"; }); });`);

/* ---------- P2b: dikey akışın tamamı → yatay akış ---------- */
const basIsaret = "/* OGRT-TAMGUN-KART: öğretmen günlük TAM program görseli";
const sonIsaret = "/* ---- PNG raporu ---- */";
const basIdx = s.indexOf(basIsaret);
const sonIdx = s.indexOf(sonIsaret);
if (basIdx < 0 || sonIdx < 0 || sonIdx <= basIdx) { console.error("YAMA HATASI: P2b sınırlar bulunamadı"); process.exit(1); }
if (s.indexOf(basIsaret, basIdx + 1) >= 0) { console.error("YAMA HATASI: P2b baş işareti çok eşleşme"); process.exit(1); }

const yeniBlok = `/* OGRT-YATAY-KART: öğretmen günlük PNG = ekrandaki öğretmen çizelgesinin O GÜNKÜ satırı (yatay saat şeridi).
   SÖZLEŞME (v3): eski tek-gün DİKEY tablo akışı KALDIRILDI. TEMEL KURAL — hücre markup'ı YENİDEN YAZILMAZ:
   mevcut üreticiler (birebirHucreHTML + rose Sınıf hücresi + amber Ek Ders hücresi) ve KISA_KOD AYNEN kullanılır;
   PNG gizli/offscreen kopya düğümden üretilir (ekran ile görsel asla ayrışmaz).
   - Gün convention: uygulamanın TAMAMI 0=Pazartesi (dowIdx) — avail.sinif anahtarları dowIdx(gunKey) ile okunur.
   - Kolonlar: KISA_KOD 1..11; ÖĞLE ARASI (K) kolonu ÇİZİLMEZ; başlıkta gerçek saat aralığı (b-e) korunur.
   - Sınıf dersi hücresi: kısa renkli kart, içinde YALNIZ sınıf adı (ders/konu kaynağı YOK → UYDURMA YOK).
   - Birebir hücresi: birebirHucreHTML (öğrenci adı · gerçek konu · öğrencinin sınıfı, boşsa "Sınıf belirtilmemiş" kuralı hücre kaynağında).
   - Aynı saatte çok kayıt ALT ALTA (ezilme/birleştirme/tek karta indirme YOK); boş hücre boş kalır.
   - PNG'ye GİRMEZ: buton, işlem ikonu, sürükleme tutamağı, "+ istek" kutusu, uygulama butonları, TELEFON (hiçbiri).
   - Kapsam: yalnız seçili günün kayıtları (başka gün sızmaz). saveDB/localStorage YAZIMI YOK (salt görüntü üretimi).
   - Rozet: hepsi yapıldı → "Yapıldı"; karışık → "Kısmen tamamlandı"; değilse "Planlandı" (durumsuz sınıf/ek ders → planlı).
   - Dosya adı: ders-karti-ogretmen-<ogretmen>-<tarih>.png (telefon yok). Paylaşım zinciri aynen (canShare → pano → her durumda PNG indir).
   - WA hedefi "ogretmen" yalnız bu akışta; öğretmen tel yoksa PNG yine iner (öğrenci/anne/baba fallback YASAK). */
function ogrtGunlukHucreler(ogrtId, gunKey) {
  var t = DB.ogretmenler.find(function (x) { return x.id === ogrtId; });
  if (!t || !gunKey) return [];
  var g = dowIdx(gunKey); /* 0=Pzt … 6=Paz — izgara/avail anahtar convention'ı (GUN_KISA ile aynı) */
  var hucreMap = {};
  var hucre = function (no) { if (!hucreMap[no]) hucreMap[no] = { slot: no, ogeler: [] }; return hucreMap[no]; };
  /* Sınıf dersleri: avail.sinif["gun-slot"] = sınıf adı (yalnız string) — ekran rose hücresiyle AYNI kaynak */
  var avail = (t.avail && t.avail.sinif && typeof t.avail.sinif === "object") ? t.avail.sinif : {};
  Object.keys(avail).forEach(function (k) {
    var p = String(k).split("-");
    if (p.length !== 2) return;
    if (parseInt(p[0], 10) !== g) return;
    if (p[1] === "K") return; /* ÖĞLE ARASI kolonu çizilmez */
    if (!KISA_KOD.some(function (x) { return x.no === p[1]; })) return; /* bilinmeyen slot uydurulmaz */
    hucre(parseInt(p[1], 10)).ogeler.push({ tip: "sinif", sinif: String(avail[k] || "Sınıf") });
  });
  /* Birebirler: o günün aktif (iptal değil) ders kayıtları — günlük ekran satırıyla AYNI kapsam (id ya da ad) */
  var gunKaydi = function (l) {
    if (!l || l.tarih !== gunKey || l.durum === "iptal" || !l.saat) return false;
    return l.ogretmenId ? l.ogretmenId === ogrtId : (l.ogretmenAd || "") === t.ad;
  };
  aktifDonemKayitlari(DB.dersler).forEach(function (l) {
    if (!gunKaydi(l)) return;
    var no = ksKodOf(l.saat);
    if (!no) return; /* mola/çıkmaz saat uydurulmaz */
    hucre(parseInt(no, 10)).ogeler.push({ tip: "birebir", ders: l });
  });
  /* Ek dersler: günlük ekran satırının amber hücreleriyle AYNI kapsam */
  aktifDonemKayitlari(Array.isArray(DB.ekDersler) ? DB.ekDersler : []).forEach(function (l) {
    if (!gunKaydi(l)) return;
    var no = ksKodOf(l.saat);
    if (!no) return;
    hucre(parseInt(no, 10)).ogeler.push({ tip: "ek", ders: l });
  });
  return KISA_KOD.map(function (ks) { return hucre(parseInt(ks.no, 10)); }); /* 1..11 sıralı; boşlar ogeler:[] */
}
/* Hücre içeriği: MEVCUT ekran kartlarının BİREBİR markup'ı; çok kayıt alt alta (sarmalayıcı stil yok) */
function ogrtGunlukHucreHTML(h) {
  return h.ogeler.map(function (o) {
    if (o.tip === "sinif") {
      /* Sınıf dersi: haftalık izgaradaki rose hücre kartının aynısı — içinde YALNIZ sınıf adı */
      return '<div class="rounded-lg bg-rose-100 border border-rose-200 px-1 py-1.5" title="Sınıf dersi — kilitli">' +
        '<div class="text-[8px] font-bold text-rose-700 leading-tight truncate whitespace-nowrap">' + esc(o.sinif.substring(0, 14)) + '</div></div>';
    }
    if (o.tip === "ek") {
      /* Ek Ders: günlük ekran amber hücre kartının aynısı */
      return '<div class="rounded-lg bg-amber-100 border border-amber-300 px-1 py-1.5" title="Ek Ders — kilitli">' +
        '<div class="text-[10.5px] font-bold text-amber-800 leading-tight truncate whitespace-nowrap">' + esc((o.ders.sinif || "").substring(0, 14)) + '</div>' +
        '<div class="text-[8px] font-bold mt-0.5 text-amber-600">Ek Ders</div>' +
        '</div>';
    }
    var l = o.ders;
    var ogrenci = DB.ogrenciler.find(function (x) { return x.id === l.ogrenciId; });
    var sinif = ogrenci ? ogrenci.sinif : "";
    var durumRenk = l.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
    return birebirHucreHTML(l, ogrenci, l.ogrenciAd || "", sinif, durumRenk);
  }).join("");
}
function dersKartiOgrtGunlukHTML(ogrtId, gunKey) {
  var t = DB.ogretmenler.find(function (x) { return x.id === ogrtId; });
  var hucreler = ogrtGunlukHucreler(ogrtId, gunKey);
  var ogrAd = t ? String(t.ad || "") : "";
  var brans = (t && DERS[t.brans] && DERS[t.brans].ad) ? DERS[t.brans].ad : "Branş yok";
  var gunAdlari = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
  var gun = new Date(gunKey + "T12:00:00");
  var altSatir = brans + " · " + gunAdlari[gun.getDay()] + " · " + fmtTR(gunKey);
  /* Rozet: birebir durumları gerçek alandan; durumsuz sınıf/ek ders PLANLI sayılır */
  var yapildi = 0, planli = 0;
  hucreler.forEach(function (h) { h.ogeler.forEach(function (o) { if (o.tip === "birebir" && o.ders.durum === "tamamlandi") yapildi++; else planli++; }); });
  var rozet = (yapildi && !planli) ? "Yapıldı" : (yapildi && planli ? "Kısmen tamamlandı" : "Planlandı");
  var th = function (ust, alt) { return '<th style="padding:5px 4px;border:1px solid #e2e8f0;background:#f8fafc;min-width:76px"><div style="font-size:10px;font-weight:800;color:#334155">' + ust + '</div>' + (alt ? '<div style="font-size:8.5px;color:#94a3b8">' + alt + "</div>" : "") + "</th>"; };
  var saatTh = KISA_KOD.map(function (k) { return th(k.no + " · " + k.b, k.e); }).join(""); /* gerçek saat aralığı korunur */
  var hucreTd = hucreler.map(function (h) {
    return '<td style="vertical-align:top;padding:4px;border:1px solid #e2e8f0;background:#ffffff">' + ogrtGunlukHucreHTML(h) + "</td>";
  }).join("");
  return '<div id="dersKartiGovde" style="width:1080px;background:#fff;font-family:Inter,system-ui,sans-serif;padding:34px 40px;border-radius:0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div style="display:flex;gap:12px;align-items:center"><div style="width:40px;height:40px;border-radius:13px;background:#14b8a6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px">🎓</div><div><div style="font-size:15px;font-weight:800;color:#0f172a">YKS Birebir Takip</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">Günlük Ders Programı</div></div></div>' +
      '<span style="background:' + (rozet === "Yapıldı" ? "#d1fae5;color:#047857" : "#e0f2fe;color:#0369a1") + ';font-size:11px;font-weight:800;padding:4px 12px;border-radius:99px">' + esc(rozet) + "</span>" +
    "</div>" +
    '<div style="border-bottom:2px solid #e2e8f0;margin:16px 0"></div>' +
    '<div style="font-size:22px;font-weight:800;color:#0f172a">ÖĞRETMEN — ' + esc(ogrAd) + '</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">' + esc(altSatir) + "</div>" +
    '<div style="border-bottom:1px solid #f1f5f9;margin:12px 0"></div>' +
    '<table style="width:100%;border-collapse:collapse;table-layout:fixed"><tr>' +
      '<th style="padding:5px 6px;border:1px solid #e2e8f0;background:#f8fafc;min-width:96px;text-align:left"><div style="font-size:9px;font-weight:800;color:#94a3b8;letter-spacing:.06em">ÖĞRETMEN</div></th>' + saatTh +
    "</tr><tr>" +
      '<td style="padding:6px;border:1px solid #e2e8f0;background:#ffffff;font-size:11px;font-weight:800;color:#0f172a;white-space:nowrap">' + esc(ogrAd) + "</td>" + hucreTd +
    "</tr></table>" +
    '<div style="border-bottom:1px solid #f1f5f9;margin:14px 0"></div>' +
    '<div style="font-size:9.5px;color:#94a3b8">Bu kart YKS Birebir Takip tarafından oluşturuldu</div>' +
  "</div>";
}
function dersKartiOgrtGunlukBtnHTML(ogrtId, gunKey) {
  return '<button draggable="false" title="Günlük program görseli (PNG) üret" ' +
    'onmousedown="event.stopPropagation()" onclick="event.stopPropagation();event.preventDefault();dersKartiOgrtGunlukAc(\\'' + esc(ogrtId) + '\\', \\'' + esc(gunKey) + '\\')" ' +
    'class="w-6 h-6 rounded-full text-slate-300 hover:text-teal-600 hover:bg-teal-50 transition-colors"><i class="fa-solid fa-calendar-day text-[10px]"></i></button>';
}
function dersKartiOgrtGunlukAc(ogrtId, gunKey) {
  if (!DB.ogretmenler.find(function (x) { return x.id === ogrtId; })) { toast("Öğretmen bulunamadı.", "hata"); return; }
  if (!gunKey) { toast("Tarih bilinmiyor; görsel üretilmedi.", "uyari"); return; }
  /* OGRT-YATAY-KART: satır koşulu butonla AYNI — sınıf dersi VEYA birebir; hiçbiri yoksa PNG üretilmez */
  var hucreler = ogrtGunlukHucreler(ogrtId, gunKey);
  if (!hucreler.some(function (h) { return h.ogeler.some(function (o) { return o.tip === "sinif" || o.tip === "birebir"; }); })) { toast("Bu gun icin paylasilabilir ders yok.", "uyari"); return; }
  if (!window.html2canvas) { toast("Görsel motoru (html2canvas) yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.", "hata"); return; }
  /* OGRT-KART: WA hedefi (ogretmen) yalnız bu akışta okunur; öğretmen tel yoksa PNG yine iner (fallback YASAK). */
  var a = waAliciBilgisi(ogrtId, "ogretmen");
  var guvendemi = !(typeof window.isSecureContext === "boolean" && window.isSecureContext === false);
  var el = document.getElementById("dersKartiRapor");
  if (!el) {
    el = document.createElement("div");
    el.id = "dersKartiRapor";
    el.style.position = "fixed"; el.style.left = "-9999px"; el.style.top = "0";
    document.body.appendChild(el);
  }
  el.innerHTML = dersKartiOgrtGunlukHTML(ogrtId, gunKey);
  function dosyaAdi() {
    /* GIZLILIK: dosya adında TELEFON YOK — öğretmen adı + tarih */
    var t = DB.ogretmenler.find(function (x) { return x.id === ogrtId; });
    return "ders-karti-ogretmen-" + String(t && t.ad ? t.ad : "")
      .replace(/ğ/g, "g").replace(/Ğ/g, "g").replace(/ü/g, "u").replace(/Ü/g, "u")
      .replace(/ş/g, "s").replace(/Ş/g, "s").replace(/ı/g, "i").replace(/İ/g, "i")
      .replace(/ö/g, "o").replace(/Ö/g, "o").replace(/ç/g, "c").replace(/Ç/g, "c")
      .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      .toLowerCase() + "-" + gunKey + ".png";
  }
  html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false })
    .then(function (canvas) {
      canvas.toBlob(function (blob) {
        if (!blob) { toast("Görsel oluşturulamadı.", "hata"); return; }
        var ad = dosyaAdi();
        var adim = { pano: false };
        var bitir = function () {
          if (dersKartiIndirildi) { return; }
          dersKartiIndirildi = true;
          /* Her durumda PNG indir */
          var aEl = document.createElement("a");
          aEl.download = ad; aEl.href = URL.createObjectURL(blob);
          document.body.appendChild(aEl); aEl.click(); aEl.remove();
          setTimeout(function () { URL.revokeObjectURL(aEl.href); }, 500);
          var dosya = new File([blob], ad, { type: "image/png" });
          if (guvendemi && a.varMi && navigator.canShare && navigator.canShare({ files: [dosya] })) {
            navigator.share({ files: [dosya], title: "Ders Kartı" }).catch(function () {});
            adim.paylas = true;
          }
          if (!adim.pano && !adim.paylas) {
            toast(a.varMi ? ("Kart hazır: indirildi (" + ad + ").") : "Öğretmen telefonu kayıtlı değil; görsel indirildi.", "basarili");
          } else {
            toast("Kart hazır: panoya kopyalandı + indirildi. WhatsApp'ta Ctrl+V ile yapıştır veya dosyayı sürükle.", "basarili");
          }
        };
        if (guvendemi && navigator.clipboard && window.ClipboardItem) {
          try {
            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
              .then(function () { adim.pano = true; bitir(); })
              .catch(function () { bitir(); });
            return;
          } catch (e) { /* ClipboardItem desteklenmiyor — indir yolu */ }
        }
        bitir();
      }, "image/png");
    })
    .catch(function () { toast("Görsel oluşturulamadı.", "hata"); });
}

`;
s = s.slice(0, basIdx) + yeniBlok + s.slice(sonIdx);
yamaSay++;
console.log("✓ yama: P2b dikey akış → yatay akış (" + (yeniBlok.length) + " karakter)");

/* Eski yardımcıdan kalıntı referans kalmadığını garanti et */
if (s.includes("ogrtGunlukSatirlar")) { console.error("YAMA HATASI: ogrtGunlukSatirlar kalıntısı kaldı"); process.exit(1); }
if (s.includes("OGRT-TAMGUN-KART")) { console.error("YAMA HATASI: OGRT-TAMGUN-KART kalıntısı kaldı"); process.exit(1); }

writeFileSync(dosya, s);
console.log("YAMA TAMAM: " + yamaSay + " yama · " + basUzunluk + " → " + s.length + " byte");
