    }
  } else {
    // Havuzdan yeni planlama: pastel yeşil taşınabilir kart olarak yerleşir
    DB.dersler.push({
      id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: r.dersId, konu: r.konu || "",
      ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat,
      durum: "planlandi", olusturma: todayKey(), kaynak: "takvim"
    });
    DB.istekler = DB.istekler.filter(function (x) { return x.id !== istekId; });
    ui.aktifIstekId = null;
    toast("İstek takvime planlandı ✓ " + o.ad + " · " + fmtTR(tarih) + " " + saatGoster(saat));
  }

  saveDB();
  renderHavuz();
  renderFormDestek();
  renderDersler();
  renderOzet();
  renderAnaliz();
}

function slotIndexFromBilgi(slot) { return SLOT_BILGI.indexOf(slot); }
// Kayıtlı slot indexini okunur saat aralığına çevirir ("0" → "08:50-09:30")
function saatGoster(v) {
  var raw = String(v == null ? "" : v);
  var i = raw.indexOf(":") >= 0 ? eskiSaatToSlot(v) : parseInt(raw, 10);
  var b = SLOT_BILGI[i];
  if (!b) return raw;
  return b.s + "-" + b.e;
}
function gunlukTablo() {
  var gunKey = ui.gunSecim || ui.anchor;
  var gun = new Date(gunKey + "T12:00:00");
  var gunAdlari = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
  var gunAdi = gunAdlari[gun.getDay()];

  // O güne ait aktif dersleri al
  var gunDersler = DB.dersler.filter(function (l) {
    return l.tarih === gunKey && l.durum !== "iptal";
  });

  // Öğretmene göre grupla: ogrtAd -> { saat -> ders }
  var ogrtMap = {};
  gunDersler.forEach(function (l) {
    var k = l.ogretmenAd || "Bilinmiyor";
    if (!ogrtMap[k]) ogrtMap[k] = {};
    var sIdx = String(l.saat).indexOf(":") >= 0 ? eskiSaatToSlot(l.saat) : parseInt(l.saat, 10);
    if (sIdx == null || isNaN(sIdx)) sIdx = 0;
    ogrtMap[k][sIdx] = l; // slot index
  });

  var ogrtSirasi = Object.keys(ogrtMap).sort();
  if (!ogrtSirasi.length) {
    return '<div class="rounded-2xl border border-slate-100 overflow-hidden mb-4 bg-white">' +
      '<div class="text-center py-3 border-b border-slate-100 bg-slate-50"><h3 class="text-[15px] font-black text-slate-800 uppercase tracking-wide">' + gunAdi + '</h3></div>' +
      '<div class="py-12 text-center"><div class="text-3xl mb-2">\u{1F5D3}\uFE0F</div><p class="text-[13px] font-semibold text-slate-500">' + gunAdi + ' günü birebir ders yok</p><p class="text-[11.5px] text-slate-400 mt-1">Bu güne ders planlanmamış.</p></div></div>';
  }

  // Saat slotları: yeni çizelge (11 ders + 12:00-13:00 kilitli öğle molası)
  var SAAT_SLOTLARI = SLOT_BILGI.map(function (b, i) {
    return { s: b.s, e: b.e, no: b.no, mola: i === MOLA_SLOT };
  });

  // Tablo başlığı
  var html = '<div class="rounded-2xl border border-slate-200 overflow-hidden mb-4 bg-white">' +
    // Gün başlığı
    '<div class="text-center py-3 border-b-2 border-slate-200 bg-slate-50">' +
      '<h3 class="text-[16px] font-black text-slate-800 tracking-wide uppercase">' + gunAdi + '</h3>' +
    '</div>' +
    '<div class="overflow-x-auto"><table class="w-full border-collapse text-center" style="min-width:800px">';

  // Üst satır: numaralar ve saatler
  html += '<thead><tr class="border-b-2 border-slate-200">';
  html += '<th class="px-3 py-2 border-r border-slate-200 bg-slate-50" style="min-width:120px"></th>';
  SAAT_SLOTLARI.forEach(function (slot) {
    var bg = slot.mola ? 'bg-emerald-200' : 'bg-slate-50';
    var textColor = slot.mola ? 'text-emerald-700' : 'text-slate-600';
    html += '<th class="px-2 py-2 border-r border-slate-200 ' + bg + '" style="min-width:72px">' +
      '<div class="text-[11px] font-black ' + textColor + '">' + (slot.mola ? "☕" : slot.no) + '</div>' +
      '<div class="text-[8.5px] font-semibold text-slate-400">' + String(slot.s).padStart(2,"0") + ":00</div>" +
      '<div class="text-[8.5px] font-semibold text-slate-400">' + String(slot.e).padStart(2,"0") + ":00</div>" +
      '</th>';
  });
  html += '</tr></thead>';

  // Satırlar: her öğretmen
  html += '<tbody>';
  ogrtSirasi.forEach(function (ogrtAd, oi) {
    var saatMap = ogrtMap[ogrtAd];
    var bg = oi % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';

    html += '<tr class="border-b border-slate-200 ' + bg + '">';
    // Öğretmen adı
    html += '<td class="px-3 py-3 border-r border-slate-200 text-left">' +
      '<div class="text-[12px] font-black text-slate-800 uppercase leading-tight">' + esc(ogrtAd) + '</div></td>';

    SAAT_SLOTLARI.forEach(function (slot) {
      if (slot.mola) {
        // Mola hücresi
        html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-emerald-50">' +
          '<div class="text-[10px] font-bold text-emerald-600">Mola</div>' +
          '<div class="text-[9px] text-emerald-500">' + String(slot.s).padStart(2,"0") + ':00-' + String(slot.e).padStart(2,"0") + ':00</div></td>';
      } else {
        var ders = saatMap[slotIndexFromBilgi(slot)];
        if (ders) {
          var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
          var sinif = ders.sinif || (ogrenci ? ogrenci.sinif : "");
          var dersBilgi = DERS[ders.dersId];

          html += '<td class="px-1.5 py-2 border-r border-slate-200 hover:bg-blue-50 transition-colors">' +
            '<div class="text-[10.5px] font-bold ' + (ders.durum === "tamamlandi" ? "text-emerald-600" : "text-slate-700") + ' leading-tight">' + esc(ders.ogrenciAd || (ogrenci ? ogrenci.ad : "—")) + '</div>' +
            (sinif ? '<div class="text-[8.5px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (ders.konu ? '<div class="text-[8px] text-slate-400 leading-tight mt-0.5 truncate">' + esc(ders.konu) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[7.5px] font-bold mt-0.5 ' + dersBilgi.tx + '">' + dersBilgi.ad + '</div>' : '') +
            '</td>';
        } else {
          html += '<td class="px-1.5 py-2 border-r border-slate-200"></td>';
        }
      }
    });
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  return html;
}


function renderDersler() {
  var liste = penceredeDersler();
  var cumle = pencereAdi();
  var ok = GUNLER[dowIdx(todayKey())];
  var p = pencere();
  var aralikYazi = p.start ? fmtTR(p.start) + " – " + fmtTR(p.end) : "Tüm arşiv";

  var oklar = "";
  if (ui.filtre !== "tumu") {
    oklar = '<button onclick="navGit(-1)" class="w-8 h-8 rounded-full border border-slate-200 hover:border-teal-300 hover:text-teal-600 text-slate-400 transition-colors"><i class="fa-solid fa-chevron-left text-[11px]"></i></button>' +
      '<span class="px-1 font-bold text-[13px] text-slate-800 whitespace-nowrap" style="font-variant-numeric:tabular-nums">' + cumle + "</span>" +
      '<button onclick="navGit(1)" class="w-8 h-8 rounded-full border border-slate-200 hover:border-teal-300 hover:text-teal-600 text-slate-400 transition-colors"><i class="fa-solid fa-chevron-right text-[11px]"></i></button>';
  } else {
    oklar = '<span class="px-1 font-bold text-[13px] text-slate-800">Tüm arşiv</span>';
  }
  if (!guncelMi()) oklar += '<button onclick="buguneDon()" class="text-[11px] font-bold text-teal-600 hover:bg-teal-50 border border-teal-200 rounded-full px-3 py-1.5 transition-colors"><i class="fa-solid fa-rotate-left mr-1"></i>Bugüne dön</button>';

  var aksiyon =
    '<button onclick="window.print()" class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-600 px-3.5 py-2 transition-colors"><i class="fa-solid fa-print text-slate-400"></i><span class="hidden md:inline">Yazdır / PDF Al</span></button>' +
    '<button onclick="pngAc()" class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-600 px-3.5 py-2 transition-colors"><i class="fa-solid fa-image text-violet-400"></i><span class="hidden md:inline">Rapor Görseli (PNG)</span></button>' +
    '<button onclick="waAc()" class="inline-flex items-center gap-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-[12px] font-bold px-3.5 py-2 shadow-sm transition-colors"><i class="fa-brands fa-whatsapp"></i><span class="hidden md:inline">WhatsApp Bilgilendirmesi</span></button>' +
    '<button onclick="kopyala()" class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-600 px-3.5 py-2 transition-colors"><i class="fa-regular fa-copy text-slate-400"></i><span class="hidden md:inline">Listeyi Kopyala</span></button>';

  var satirlar = "";

  // Haftalık öğretmen seçici
  var ogrSecici = '<div class="flex items-center gap-2">' +
    '<label class="text-[11px] font-bold text-slate-500 uppercase tracking-wide"><i class="fa-solid fa-chalkboard-user text-violet-500 mr-1"></i>Haftalık:</label>' +
    '<select onchange="haftalikOgrtSec(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400/40">' +
    '<option value="">Öğretmen seç...</option>' +
    DB.ogretmenler.map(function(t){ return '<option value="' + t.id + '"' + (t.id === ui.haftalikOgrtId ? " selected" : "") + '>' + esc(t.ad) + '</option>'; }).join("") +
    '</select>';
  if (ui.haftalikOgrtId) ogrSecici += '<button onclick="ui.haftalikOgrtId=null; renderDersler();" class="w-6 h-6 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50"><i class="fa-solid fa-xmark text-[10px]"></i></button>';
  ogrSecici += '</div>';

  if (!liste.length) {
    satirlar = '<tr><td colspan="8"><div class="py-14 text-center"><div class="text-3xl mb-2">🗓️</div><p class="text-[13px] font-semibold text-slate-500">Bu dönemde ders yok</p><p class="text-[11.5px] text-slate-400 mt-1">Yukarıdaki formdan yeni bir birebir ders planlayın</p></div></td></tr>';
  }
  liste.forEach(function (l) {
    var D = DERS[l.dersId] || DERS.tur;
    var durum = l.durum || "planlandi";
    var durumEtiket = { planlandi: ["Planlandı", "bg-sky-100 text-sky-700"], tamamlandi: ["Tamamlandı", "bg-emerald-100 text-emerald-700"], iptal: ["İptal", "bg-rose-100 text-rose-500"] }[durum];
    var gunAd = GUN_KISA[dowIdx(l.tarih)];
    satirlar += '<tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">' +
      '<td class="px-4 py-3 whitespace-nowrap"><div class="text-[13px] font-semibold text-slate-700" style="font-variant-numeric:tabular-nums">' + fmtTR(l.tarih) + '</div><div class="text-[10px] text-slate-400 font-semibold">' + gunAd + "</div></td>" +
      '<td class="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap" style="font-variant-numeric:tabular-nums">' + esc(saatGoster(l.saat)) + "</td>" +
      '<td class="px-4 py-3"><div class="flex items-center gap-2">' + avatar(l.ogrenciAd, 0) + '<span class="text-[13px] font-semibold text-slate-700 truncate max-w-[140px]">' + esc(l.ogrenciAd) + "</span></div></td>" +
      '<td class="px-4 py-3"><span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ' + D.bg + " " + D.tx + '">' + D.ad + "</span></td>" +
      '<td class="px-4 py-3 text-[12.5px] text-slate-500 max-w-[180px] truncate">' + (l.konu ? esc(l.konu) : '<span class="italic text-slate-300">Genel tekrar</span>') + "</td>" +
      '<td class="px-4 py-3 text-[12.5px] font-semibold text-slate-600 truncate max-w-[140px]">' + esc(l.ogretmenAd) + "</td>" +
      '<td class="px-4 py-3"><div class="flex items-center gap-1">' +
        '<button title="Tamamlandı işaretle" onclick="durumTik(\'' + l.id + '\',\'tamamlandi\')" class="w-7 h-7 rounded-full flex items-center justify-center border transition-colors ' + (durum === "tamamlandi" ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" : "border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-500") + '"><i class="fa-solid fa-check text-[11px]"></i></button>' +
        '<button title="İptal et" onclick="durumTik(\'' + l.id + '\',\'iptal\')" class="w-7 h-7 rounded-full flex items-center justify-center border transition-colors ' + (durum === "iptal" ? "bg-rose-500 border-rose-500 text-white shadow-sm" : "border-slate-200 text-slate-300 hover:border-rose-300 hover:text-rose-400") + '"><i class="fa-solid fa-xmark text-[11px]"></i></button>' +
        '<span class="ml-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold whitespace-nowrap ' + durumEtiket[1] + '">' + durumEtiket[0] + "</span></div></td>" +
      '<td class="px-4 py-3"><div class="flex items-center gap-1">' +
        '<button title="Öğrenciye WhatsApp bilgilendirmesi" onclick="waSatir(\'' + l.id + '\')" class="w-8 h-8 rounded-full text-green-400 hover:bg-green-50 transition-colors"><i class="fa-brands fa-whatsapp text-[14px]"></i></button>' +
        '<button title="Dersi düzenle" onclick="duzenle(\'' + l.id + '\')" class="w-8 h-8 rounded-full text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"><i class="fa-solid fa-pen text-[12px]"></i></button>' +
        '<button title="Dersi sil" onclick="silOnay(\'' + l.id + '\')" class="w-8 h-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"><i class="fa-solid fa-trash-can text-[12px]"></i></button>' +
        "</div></td></tr>";
  });

  var say1 = liste.filter(function (l) { return l.durum === "planlandi"; }).length;
  var say2 = liste.filter(function (l) { return l.durum === "tamamlandi"; }).length;
  var say3 = liste.filter(function (l) { return l.durum === "iptal"; }).length;

  var tekGun = ui.filtre === "gun" || !!ui.gunSecim;
  var gunChips = "";
  if (ui.filtre === "hafta" && p.start) {
    gunChips = '<div class="no-print flex flex-wrap items-center gap-1.5 px-5 pb-3 -mt-1">';
    for (var cd = 0; cd < 7; cd++) {
      var ck = addDaysKey(p.start, cd);
      var cAkt = ui.gunSecim === ck;
      var cBug = ck === todayKey();
      var cLbl = GUN_KISA[cd] + " " + String(fromKey(ck).getDate());
      gunChips += '<button onclick="gunSec(\'' + ck + '\')" title="' + fmtTR(ck) + '" class="rounded-full px-3 py-1.5 text-[11px] font-bold border transition-all ' + (cAkt ? "bg-teal-500 border-teal-500 text-white shadow-sm" : cBug ? "border-teal-300 text-teal-600 hover:bg-teal-50 bg-white" : "border-slate-200 text-slate-500 hover:bg-slate-100 bg-white") + '">' + cLbl + '</button>';
    }
    gunChips += '<button onclick="gunSec(\'\')" title="Haftalık listeye dön" class="rounded-full px-3 py-1.5 text-[11px] font-bold border border-slate-100 text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all bg-white ' + (ui.gunSecim ? "" : "opacity-70") + '"><i class="fa-solid fa-list-ul mr-1"></i>Hafta</button>';
    gunChips += '</div>';
  }

  $("derslerBolum").innerHTML =
    '<div class="kart overflow-hidden">' +
      '<div class="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">' +
        '<div class="flex items-center gap-2 flex-wrap">' + oklar + "</div>" +
        (ogrSecici && !tekGun ? '<div class="flex items-center gap-2 mt-2 flex-wrap">' + ogrSecici + '</div>' : '') +
        '<div class="flex items-center gap-2 flex-wrap">' + aksiyon + "</div>" +
      "</div>" +
      '<div id="yazdir" class="bg-white">' +
        '<div class="print-goster px-6 pt-6 pb-2 flex items-center justify-between">' +
          '<div><h2 class="text-lg font-extrabold text-slate-900">YKS Birebir Takip</h2>' +
          '<p class="text-[11px] text-slate-500 mt-0.5">Birebir Ders ve Öğrenci Eksik Takip Otomasyonu</p></div>' +
          '<div class="text-right"><div class="text-[12px] font-bold text-slate-500">Ders Raporu</div>' +
          '<div class="text-[11px] text-slate-400">' + aralikYazi + " · Yazdırma: " + fmtTR(todayKey()) + " " + ok + "</div></div>" +
        "</div>" +
        '<div class="print-goster px-6 py-3"><div class="border-b-2 border-slate-200"></div></div>' +
        (gunChips ? gunChips : "") +
        (tekGun ? gunlukTablo() : "") +
        (ui.haftalikOgrtId && !tekGun ? haftalikOgrtTablo() : "") +
        (tekGun ? "" : 
      '<div class="overflow-x-auto">' +
          '<table class="w-full min-w-[980px] text-left border-collapse">' +
            '<thead><tr class="bg-slate-50/80 border-b border-slate-100">' +
              "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Tarih</th>" +
              "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Saat</th>" +
              "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Öğrenci</th>" +
              "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Ders</th>" +
              "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Eksik Konu</th>" +
              "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Öğretmen</th>" +
              "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Durum</th>" +
              "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>İşlem</th>" +
            "</tr></thead><tbody>" + satirlar + "</tbody>" +
          "</table>" +
        "</div>" +
        '<div class="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">' +
          '<span class="no-print"><i class="fa-regular fa-calendar mr-1"></i>' + cumle + " · " + aralikYazi + "</span>" +
          '<span class="hidden print:inline">📅 ' + cumle + " · " + aralikYazi + "</span>" +
          '<span class="mx-1">•</span>' + liste.length + " ders" +
          '<span class="rounded-full bg-sky-100 text-sky-700 px-2 py-0.5">' + say1 + " planlandı</span>" +
          '<span class="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">' + say2 + " tamamlandı</span>" +
          (say3 ? '<span class="rounded-full bg-rose-100 text-rose-500 px-2 py-0.5">' + say3 + " iptal</span>" : "") +
        "</div>") +
      "</div>" +
    "</div>";
}
function durumTik(id, durum) {
  var l = DB.dersler.find(function (x) { return x.id === id; });
  if (!l) return;
  if (l.durum === durum) l.durum = "planlandi";
  else l.durum = durum;
  var ad = durum === "tamamlandi" ? "Tamamlandı olarak işaretlendi ✓" : durum === "iptal" ? "Ders iptal edildi." : "";
  if (ad) toast(ad);
  yenile();
}
function silOnay(id) {
  var l = DB.dersler.find(function (x) { return x.id === id; });
  if (!l) return;
  var D = DERS[l.dersId] || DERS.tur;
  onayAc({
    baslik: "Ders silinsin mi?",
    metin: "<b>" + esc(l.ogrenciAd) + "</b> · " + D.ad + (l.konu ? " (" + esc(l.konu) + ")" : "") + " · " + fmtTR(l.tarih) + " " + saatGoster(l.saat) + " kaydı arşivden kaldırılacak.",
    onay: "Evet, Sil", tehlikeli: true
  }, function () {
    DB.dersler = DB.dersler.filter(function (x) { return x.id !== id; });
    toast("Ders silindi.");
    yenile();
  });
}
function duzenle(id) {
  var l = DB.dersler.find(function (x) { return x.id === id; });
  if (!l) return;
  ui.editId = id; ui.aktifIstekId = null;
  $("f-ogrenci").value = l.ogrenciAd;
  $("f-ders").value = l.dersId;
  $("f-konu").value = l.konu || "";
  $("f-ogretmen").value = l.ogretmenAd;
  $("f-tarih").value = l.tarih;
  fSaatDoldur(l.saat); $("f-saat").value = String(l.saat);
  $("f-yoksay").checked = false;
  $("cakismaUyari").classList.add("hidden");
  duzenleBannerGuncelle();
  $("planKart").scrollIntoView({ behavior: "smooth", block: "start" });
  $("planKart").classList.add("ring-2", "ring-amber-300");
  setTimeout(function () { $("planKart").classList.remove("ring-2", "ring-amber-300"); }, 2000);
}

/* ---- Kopyala ---- */
function listeMetni() {
  var liste = penceredeDersler();
  var baslik = "YKS Birebir Takip — Ders Listesi (" + pencereAdi() + ")\n" + new Date().toLocaleDateString("tr-TR") + "\n\n";
  if (!liste.length) return baslik + "Bu dönemde ders yok.";
  var satir = liste.map(function (l) {
    var D = DERS[l.dersId] || DERS.tur;
    return fmtTR(l.tarih) + " " + saatGoster(l.saat) + " | " + l.ogrenciAd + " | " + D.ad + " | " + (l.konu || "Genel tekrar") + " | " + l.ogretmenAd + " | " + l.durum;
  }).join("\n");
  return baslik + satir;
}
function kopyala() {
  var metin = listeMetni();
  function basarili() { toast("Ders listesi kopyalandı ✓"); }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(metin).then(basarili).catch(function () { geciciKopyala(metin, basarili); });
  } else geciciKopyala(metin, basarili);
}
function geciciKopyala(metin, cb) {
  var ta = document.createElement("textarea");
  ta.value = metin; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); cb(); } catch (e) { toast("Kopyalanamadı.", "hata"); }
  ta.remove();
}

/* ---- WhatsApp ---- */
function ogrenciMesajMetni(ogrenciId) {
  var o = DB.ogrenciler.find(function (s) { return s.id === ogrenciId; });
  if (!o) return null;
  var liste = penceredeDersler().filter(function (l) {
    return (l.ogrenciId === o.id || l.ogrenciAd === o.ad) && l.durum !== "iptal";
  });
  if (!liste.length) return null;
  var satirlar = liste.map(function (l, i) {
    var D = DERS[l.dersId] || DERS.tur;
    var durum = l.durum === "tamamlandi" ? " ✓ Tamamlandı" : "";
    return (i + 1) + ") " + D.ad + (l.konu ? " — " + l.konu : "") + "\n   📅 " + fmtTR(l.tarih) + " " + GUNLER[dowIdx(l.tarih)] + " • " + saatGoster(l.saat) + " • " + l.ogretmenAd + durum;
  });
  return "Merhaba " + o.ad + "! 👋\n\n📚 " + pencereAdi() + " birebir ders programın:\n\n" + satirlar.join("\n") + "\n\nDerslerimize zamanında katılmayı unutma. İyi çalışmalar! 🎓\n— YKS Birebir Takip";
}
function waUrl(metin, tel) {
  var no = String(tel || "").replace(/\D/g, "");
  if (no) return "https://wa.me/" + no + "?text=" + encodeURIComponent(metin);
  return "https://wa.me/?text=" + encodeURIComponent(metin);
}
function waAc() {
  var liste = penceredeDersler().filter(function (l) { return l.durum !== "iptal"; });
  var sayac = {};
  liste.forEach(function (l) {
    var k = l.ogrenciId || l.ogrenciAd;
    if (!sayac[k]) sayac[k] = { id: l.ogrenciId || "", ad: l.ogrenciAd, n: 0 };
    sayac[k].n++;
  });
  var dizi = Object.keys(sayac).map(function (k) { return sayac[k]; }).sort(function (a, b) { return b.n - a.n; });
  $("waAlt").textContent = pencereAdi() + " · " + dizi.length + " öğrenci";
  var icerik = "";
  if (!dizi.length) {
    icerik = '<div class="text-center py-10"><p class="text-3xl mb-2">💬</p><p class="text-[13px] text-slate-400 font-medium">Bu dönemde bilgilendirme yapılacak ders yok.</p></div>';
  } else {
    icerik = dizi.map(function (s) {
      var o = DB.ogrenciler.find(function (x) { return x.id === s.id; });
      var tel = o ? o.tel : "";
      return '<div class="flex items-center gap-3 rounded-xl border border-slate-100 hover:border-green-200 px-3.5 py-2.5 transition-colors">' +
        avatar(s.ad, 0) +
        '<div class="flex-1 min-w-0"><b class="text-[13px] text-slate-800 block truncate">' + esc(s.ad) + "</b>" +
        '<span class="text-[11px] text-slate-400 font-semibold">' + s.n + " ders · " + pencereAdi() + "</span></div>" +
        '<button onclick="waGonder(\'' + s.id + '\')" class="rounded-full bg-green-500 hover:bg-green-600 text-white text-[11.5px] font-bold px-3.5 py-2 shadow-sm transition-colors"><i class="fa-brands fa-whatsapp mr-1"></i>Gönder</button>' +
        '<button onclick="waKopyalaMesaj(\'' + s.id + '\')" title="Mesaj metnini kopyala" class="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-colors"><i class="fa-regular fa-copy text-[12px]"></i></button></div>';
    }).join("");
    var telVarMi = dizi.some(function(x){ var o = DB.ogrenciler.find(function(y){return y.id===x.id;}); return o && o.tel; });
    if (!telVarMi) icerik += '<p class="text-[10.5px] text-slate-300 mt-3 text-center">Öğrenciye telefon kaydedilmedi — WhatsApp’ta göndermek istediğiniz kişiyi seçersiniz. Telefon eklemek için Öğrenciler sekmesini kullanın.</p>';
  }
  $("waIcerik").innerHTML = icerik;
  $("waModal").classList.remove("hidden");
}
function waKapat() { $("waModal").classList.add("hidden"); }
function waGonder(ogrenciId) {
  var metin = ogrenciMesajMetni(ogrenciId);
  if (!metin) { toast("Bu öğrencinin seçili dönemde dersi yok.", "uyari"); return; }
  var o = DB.ogrenciler.find(function (x) { return x.id === ogrenciId; });
  window.open(waUrl(metin, o ? o.tel : ""), "_blank");
  waKapat();
}
function waSatir(lid) {
  var l = DB.dersler.find(function (x) { return x.id === lid; });
  if (!l) return;
  waGonder(l.ogrenciId || "");
  if (!l.ogrenciId) {
    var o2 = DB.ogrenciler.find(function (x) { return kucuk(x.ad) === kucuk(l.ogrenciAd); });
    if (o2) waGonder(o2.id);
  }
}
function waKopyalaMesaj(ogrenciId) {
  var metin = ogrenciMesajMetni(ogrenciId);
  if (!metin) { toast("Mesaj oluşturulamadı.", "uyari"); return; }
  kopyalaMetin(metin);
}
function kopyalaMetin(metin) {
  function basarili() { toast("Mesaj metni kopyalandı ✓"); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(basarili).catch(function () { geciciKopyala(metin, basarili); });
  else geciciKopyala(metin, basarili);
}

/* ---- PNG raporu ---- */
function pngAc() {
  if (!window.html2canvas) { toast("Görsel motoru (html2canvas) yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.", "hata"); return; }
  var liste = penceredeDersler();
  var ak = aktif(liste);
  var win = pencere();
  var aralikYazi = win.start ? fmtTR(win.start) + " – " + fmtTR(win.end) : "Tüm arşiv";
  var dag = {}, sirali = [];
  ak.forEach(function (l) { dag[l.dersId || "?"] = (dag[l.dersId || "?"] || 0) + 1; });
  Object.keys(dag).forEach(function (k) { sirali.push({ id: k, n: dag[k] }); });
  sirali.sort(function (a, b) { return b.n - a.n; });
  function miniKart(renk, baslik, sayi) {
    return '<div style="background:' + renk + ';border-radius:14px;padding:12px 14px;flex:1"><div style="font-size:9px;font-weight:800;letter-spacing:.06em;color:#64748b">' + baslik.toLocaleUpperCase("tr-TR") + '</div><div style="font-size:24px;font-weight:800;color:#0f172a">' + sayi + "</div></div>";
  }
  var ogrSet = {};
  ak.forEach(function (l) { ogrSet[l.ogrenciId || l.ogrenciAd] = 1; });
  var satirlar = "";
  if (!liste.length) satirlar = '<tr><td colspan="6" style="padding:26px;text-align:center;color:#94a3b8;font-size:12px">Bu dönemde ders kaydı yok.</td></tr>';
  liste.forEach(function (l) {
    var D = DERS[l.dersId] || DERS.tur;
    var etk = { planlandi: ["Planlandı", "#e0f2fe", "#0369a1"], tamamlandi: ["Tamamlandı", "#d1fae5", "#047857"], iptal: ["İptal", "#ffe4e6", "#e11d48"] }[l.durum || "planlandi"];
    satirlar += '<tr style="border-bottom:1px solid #f1f5f9">' +
      '<td style="padding:7px 10px;font-size:11px;font-weight:600;color:#334155;white-space:nowrap">' + fmtTR(l.tarih) + "</td>" +
      '<td style="padding:7px 10px;font-size:11px;color:#475569;white-space:nowrap">' + saatGoster(l.saat) + "</td>" +
      '<td style="padding:7px 10px;font-size:11px;font-weight:600;color:#334155">' + esc(l.ogrenciAd) + "</td>" +
      '<td style="padding:7px 10px"><span style="background:' + D.seg + "22;color:#0f172a;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;display:inline-block\">" + D.ad + "</span></td>" +
      '<td style="padding:7px 10px;font-size:11px;color:#64748b">' + (l.konu ? esc(l.konu) : "—") + "</td>" +
      '<td style="padding:7px 10px;font-size:11px;color:#475569">' + esc(l.ogretmenAd) + "</td>" +
      '<td style="padding:7px 10px"><span style="background:" + etk[1] + ";color:" + etk[2] + ";font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;display:inline-block\">' + etk[0] + "</span></td></tr>";
  });
  var lej = "";
  sirali.forEach(function (d) {
    var D = DERS[d.id];
    lej += '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;font-size:11px;border-bottom:1px solid #f8fafc"><span style="font-weight:600;color:#334155;display:flex;align-items:center;gap:7px"><span style="width:9px;height:9px;border-radius:99px;background:' + (D ? D.seg : "#cbd5e1") + ';display:inline-block\"></span>' + (D ? D.ad : d.id) + '</span><span style="color:#94a3b8;font-weight:600">' + d.n + " saat</span></div>";
  });
  if (!sirali.length) lej = '<div style="color:#94a3b8;font-size:11px;padding:8px 0">Veri yok</div>';

  $("pngRapor").innerHTML =
    '<div style="width:900px;background:#fff;font-family:Inter,system-ui,sans-serif;padding:34px 40px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div style="display:flex;gap:12px;align-items:center">' +
          '<div style="width:42px;height:42px;border-radius:14px;background:#14b8a6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px">🎓</div>' +
          '<div><div style="font-size:16px;font-weight:800;color:#0f172a">YKS Birebir Takip</div>' +
          '<div style="font-size:10.5px;color:#94a3b8;margin-top:2px">Birebir Ders ve Öğrenci Eksik Takip Otomasyonu</div></div></div>' +
        '<div style="text-align:right"><div style="font-size:12px;font-weight:800;color:#475569">Ders Raporu</div>' +
        '<div style="font-size:10.5px;color:#94a3b8;margin-top:3px">' + esc(pencereAdi()) + " · " + aralikYazi + "</div>" +
        '<div style="font-size:10.5px;color:#94a3b8;margin-top:1px">Oluşturulma: ' + fmtTR(todayKey()) + "</div></div></div>" +
      '<div style="border-bottom:2px solid #e2e8f0;margin:18px 0"></div>' +
      '<div style="display:flex;gap:10px">' +
        miniKart("#e6fffa", "Toplam Ders", ak.length) +
        miniKart("#ebf8ff", "Aktif Öğrenci", Object.keys(ogrSet).length) +
        miniKart("#fefcbf", "Planlanan", ak.filter(function (l) { return l.durum === "planlandi"; }).length) +
        miniKart("#faf5ff", "Tamamlanan", ak.filter(function (l) { return l.durum === "tamamlandi"; }).length) +
      "</div>" +
      '<div style="display:flex;gap:26px;margin-top:20px">' +
        '<div style="width:210px;height:170px;position:relative;flex-shrink:0"><canvas id="pngDonut" width="420" height="340" style="position:absolute;inset:0;width:210px;height:170px"></canvas>' +
        (sirali.length ? '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none"><div style="font-size:26px;font-weight:800;color:#0f172a">' + ak.length + '</div><div style="font-size:9.5px;color:#94a3b8;font-weight:700">TOPLAM DERS</div></div>' : "") + "</div>" +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:11px;font-weight:800;color:#334155;letter-spacing:.02em;margin-bottom:4px">En Çok Birebir Ders Yazılan Dersler (' + donemAdi() + ")</div>" + lej +
        "</div></div>" +
      '<div style="border-bottom:2px solid #e2e8f0;margin:18px 0"></div>' +
      '<table style="width:100%;border-collapse:collapse">' +
        "<tr style='background:#f8fafc;border-radius:10px'>" +
          "<th style='text-align:left;padding:8px 10px;font-size:9.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em'>TARİH</th>" +
          "<th style='text-align:left;padding:8px 10px;font-size:9.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em'>SAAT</th>" +
          "<th style='text-align:left;padding:8px 10px;font-size:9.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em'>ÖĞRENCİ</th>" +
          "<th style='text-align:left;padding:8px 10px;font-size:9.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em'>DERS</th>" +
          "<th style='text-align:left;padding:8px 10px;font-size:9.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em'>EKSİK KONU</th>" +
          "<th style='text-align:left;padding:8px 10px;font-size:9.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em'>ÖĞRETMEN</th>" +
          "<th style='text-align:left;padding:8px 10px;font-size:9.5px;font-weight:800;color:#94a3b8;letter-spacing:.06em'>DURUM</th>" +
        "</tr>" + satirlar + "</table>" +
      '<div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">' +
        '<div style="font-size:10px;color:#94a3b8">Bu rapor YKS Birebir Takip programı tarafından oluşturuldu.</div>' +
        '<div style="font-size:10px;color:#94a3b8">YKS Birebir Takip · ' + esc(pencereAdi()) + "</div></div>" +
    "</div>";
  $("pngModal").classList.remove("hidden");
  cizPngDonut(sirali);
  setTimeout(function () { pngYakala(); }, 500);
}
function cizPngDonut(sirali) {
  if (pngChart) { pngChart.destroy(); pngChart = null; }
  var cv = $("pngDonut");
  if (!cv || !sirali.length) return;
  pngChart = new Chart(cv, {
    type: "doughnut",
    data: {
      labels: sirali.map(function (d) { var D = DERS[d.id]; return D ? D.ad : d.id; }),
      datasets: [{
        data: sirali.map(function (d) { return d.n; }),
        backgroundColor: sirali.map(function (d) { var D = DERS[d.id]; return D ? D.seg : "#cbd5e1"; }),
        borderColor: "#ffffff", borderWidth: 3
      }]
    },
    options: { responsive: false, cutout: "70%", plugins: { legend: { display: false }, tooltip: { enabled: false } } }
  });
}
function pngYakala() {
  var el = $("pngRapor");
  if (!el || !window.html2canvas) return;
  el.style.pointerEvents = "none";
  toast("Rapor görseli hazırlanıyor…");
  html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false })
    .then(function (canvas) {
      var a = document.createElement("a");
      a.download = "yks-birebir-raporu-" + todayKey() + ".png";
      a.href = canvas.toDataURL("image/png");
      document.body.appendChild(a); a.click(); a.remove();
      toast("PNG rapor indirildi ✓ — veliye WhatsApp’tan gönderebilirsiniz.");
    })
    .catch(function () { toast("Görsel oluşturulamadı.", "hata"); })
    .finally(function () { el.style.pointerEvents = ""; });
}
function pngKapat() {
  if (pngChart) { pngChart.destroy(); pngChart = null; }
  $("pngModal").classList.add("hidden");
}

/* ---- Program dosyasını (index.html) bilgisayara indir ---- */
function indirApp() {
  var ad = "YKS-Birebir-Takip.html";
  var kaydet = function (icerik) {
    var blob = new Blob([icerik], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ad;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast("İndirme başladı. Dosya İndirilenler klasörüne kaydedildi — masaüstüne taşıyıp çift tıklayın.", "basarili");
  };
  var sayfaKaynagi = function () {
    try {
      fetch(window.location.href.split("#")[0], { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw 0; return r.text(); })
        .then(function (t) { kaydet(t); })
        .catch(function () { indirYerelKopya(); });
    } catch (e) { indirYerelKopya(); }
  };
  function indirYerelKopya() {
    try {
      kaydet("<!DOCTYPE html>\n" + document.documentElement.outerHTML);
    } catch (e) {
      toast("Buradan indirme engellendi. Sol taraftaki dosya listesinden index.html dosyasını indirmeyi deneyin.", "hata");
    }
  }
  sayfaKaynagi();
}

/* ---- Başlangıç ---- */
renderFormDestek();
yenile();
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { onayKapat(); waKapat(); pngKapat(); }
});
</script>
</body>
