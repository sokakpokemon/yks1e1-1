      var sinifOgrt = null;
      if (tip === "sinif" && durum === "var" && sinifOgrtMap) sinifOgrt = sinifOgrtMap[k] || null;
      if (tip === "ogretmen" && durum === "sinif" && sinifOgrtMap) sinifOgrt = sinifOgrtMap[k] || null;
      var cls = "hucreBtn border ";
      var baslik = GUN_KISA[g2] + " " + bil.no + ". Ders (" + slotAralikYazi(bil) + ")";
      if (mola) { cls += "bg-emerald-100 border-emerald-200 cursor-not-allowed"; baslik = "Öğle Molası 12:00-13:00 — ders eklenemez"; }
      else if (durum === "sinif") { cls += "bg-amber-200 border-amber-300" + (kilitli ? "" : " hover:bg-amber-300"); baslik += " · Sınıf Dersi"; }
      else if (durum === "musait") { cls += "bg-rose-200 border-rose-300" + (kilitli ? "" : " hover:bg-rose-300"); baslik += " · Müsait Değil"; }
      else if (durum === "var") { cls += "bg-blue-200 border-blue-300" + (kilitli ? "" : " hover:bg-blue-300"); baslik += " · Toplu ders"; }
      else { cls += "bg-white border-slate-200" + (kilitli ? " cursor-not-allowed" : " hover:border-teal-300 hover:bg-teal-50"); baslik += kilitli ? " · Düzenleme kapalı" : " · Boş"; }
      var icerik = "";
      if (mola) icerik = '<span class="text-[8.5px] font-extrabold text-emerald-600/80">MOLA</span>';
      else if (durum === "sinif") {
        icerik = sinifOgrt
          ? '<div class="leading-tight"><span class="block text-[7px] font-extrabold text-amber-800/90 whitespace-nowrap">' + esc(String(sinifOgrt.ad).substring(0, 12)) + '</span><span class="block text-[6.5px] font-bold text-amber-600/80 whitespace-nowrap">' + esc(String(sinifOgrt.dersAd).substring(0, 10)) + '</span></div>'
          : '<span class="text-[7.5px] font-extrabold text-amber-700/80 leading-tight whitespace-nowrap">' + esc(String((avail.sinif && avail.sinif[k]) || "Sınıf Dersi").substring(0, 14)) + '</span>';
      }
      else if (durum === "musait") icerik = '<span class="text-[8.5px] font-extrabold text-rose-500/70">MD</span>';
      else if (durum === "var") {
        icerik = sinifOgrt
          ? '<div class="rounded-md bg-white/70 border border-blue-300 px-1 py-0.5 leading-tight"><span class="block text-[7px] font-extrabold text-blue-800/90 whitespace-nowrap">' + esc(String(sinifOgrt.ad).substring(0, 12)) + '</span><span class="block text-[6.5px] font-bold text-blue-600/80 whitespace-nowrap">' + esc(String(sinifOgrt.dersAd).substring(0, 10)) + '</span></div>'
          : '<span class="text-[8.5px] font-extrabold text-blue-600/60">DV</span>';
      }
      var disable = kilitli || mola ? "disabled " : "";
      h += '<td class="p-0.5"><button ' + disable + 'class="' + cls + '" title="' + baslik + '"' +
        (!kilitli && !mola ? ' onclick="' + onclickOnce + "," + g2 + "," + key + ')"' : "") + ">" + icerik + "</button></td>";
    }
    h += "</tr>";
  });
  h += "</tbody>";
  return '<div class="overflow-x-auto rounded-xl border border-slate-100"><table class="w-full min-w-[700px] text-center border-separate border-spacing-0.5">' + h + "</table></div>";
}
function ogretmenEkle() {
  var ad = $("y-ad").value.trim();
  var brans = $("y-brans").value;
  if (!ad) { toast("Öğretmen adı boş olamaz.", "hata"); return; }
  // Düzenleme modunda
  if (ui.ogrDuzenleId) {
    var mevcut = DB.ogretmenler.find(function(t){return t.id === ui.ogrDuzenleId;});
    if (mevcut) {
      // Başka biriyle aynı isim kontrolü (kendisi hariç)
      var cakisiyor = DB.ogretmenler.some(function(t){ return t.id !== ui.ogrDuzenleId && kucuk(t.ad) === kucuk(ad); });
      if (cakisiyor) { toast("Bu isimde başka bir öğretmen zaten var.", "hata"); return; }
      mevcut.ad = ad;
      mevcut.brans = brans;
      ui.ogrId = mevcut.id;
      ui.ogrDuzenleId = null;
      toast("Öğretmen güncellendi: " + ad);
      renderYonetim(); renderFormDestek();
      return;
    }
  }
  // Yeni ekleme modunda
  var varMi = DB.ogretmenler.some(function (t) { return kucuk(t.ad) === kucuk(ad); });
  if (varMi) { toast("Bu öğretmen zaten kayıtlı.", "uyari"); return; }
  var yeni = { id: uid(), ad: ad, brans: brans, avail: { sinif: {}, musait: [] } };
  DB.ogretmenler.push(yeni);
  ui.ogrId = yeni.id;
  toast("Öğretmen eklendi: " + ad);
  renderYonetim(); renderFormDestek();
}
function sinifOgretmenHaritasi() {
  // her "gün-saat" anahtarı için o saatte sınıf dersi olan öğretmen + branş
  var map = {};
  DB.ogretmenler.forEach(function (t) {
    if (!t.avail || !t.avail.sinif) return;
    Object.keys(t.avail.sinif).forEach(function (k) {
      if (!map[k]) map[k] = { ad: t.ad, dersAd: DERS[t.brans] ? DERS[t.brans].ad : "Ders" };
    });
  });
  return map;
}
function kilidAnahtariHtml() {
  var acik = !!ui.duzenlemeAcik;
  return '<label class="inline-flex items-center gap-2 ml-auto cursor-pointer select-none shrink-0">' +
    '<span class="text-[10.5px] font-bold uppercase tracking-wide ' + (acik ? "text-emerald-600" : "text-slate-400") + '">' +
    (acik ? '<i class="fa-solid fa-lock-open mr-1"></i>Düzenleme Açık' : '<i class="fa-solid fa-lock mr-1"></i>Düzenleme Kilidi') + '</span>' +
    '<span class="relative inline-block w-9 h-5 rounded-full transition-colors ' + (acik ? "bg-emerald-500" : "bg-slate-300") + '">' +
      '<span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ' + (acik ? "translate-x-4" : "") + '"></span>' +
    '</span>' +
    '<input type="checkbox" class="sr-only" ' + (acik ? "checked" : "") + ' onchange="duzenlemeTik(this.checked)" />' +
    '</label>';
}
function duzenlemeTik(v) { ui.duzenlemeAcik = !!v; toast(v ? "Düzenleme kilidi açıldı — takvimler üzerinde sürükleyebilirsiniz." : "Düzenleme kilidi kapatıldı — takvimler salt-okunur."); renderYonetim(); renderDersler(); }
function secOgr(id) { ui.ogrId = id; renderYonetim(); }
function togOgr(tid, di, sIdx) {
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — değişiklik için üstteki kilidi açın.", "uyari"); return; }
  if (parseInt(sIdx, 10) === MOLA_SLOT) { toast("Öğle molasına (12:00-13:00) ders eklenemez.", "hata"); return; }
  var t = DB.ogretmenler.find(function (x) { return x.id === tid; });
  if (!t) return;
  var k = di + "-" + sIdx;
  if (t.avail.musait.indexOf(k) >= 0) {
    t.avail.musait = t.avail.musait.filter(function (x) { return x !== k; });
  } else if (t.avail.sinif[k]) {
    var mevcut = t.avail.sinif[k];
    var val = prompt("Sınıf / Grup adı düzenleyin (boş bırakırsanız Musait Değil olur):", mevcut);
    if (val === null) return;
    val = val.trim();
    if (val === "") { delete t.avail.sinif[k]; t.avail.musait.push(k); }
    else t.avail.sinif[k] = val;
  } else {
    var snf = tumSiniflar();
    var ornek = snf.slice(0, 5).join(", ");
    var val2 = prompt("Sınıf / Grup adı yazın\n\nMevcut sınıflar: " + ornek + (snf.length > 5 ? " ..." : ""), snf[0] || "");
    if (val2 === null) return;
    val2 = val2.trim();
    if (val2 !== "") t.avail.sinif[k] = val2;
  }
  yenile();
}
// Öğretmen düzenleme
function ogrDuzenle(id) {
  ui.ogrDuzenleId = id;
  renderYonetim();
  var el = document.getElementById('y-ad'); if (el) el.focus();
}
function ogrDuzenleIptal() {
  ui.ogrDuzenleId = null;
  renderYonetim();
}
// Öğretmen düzenleme
function ogrSil(id) {
  var t = DB.ogretmenler.find(function (x) { return x.id === id; });
  if (!t) return;
  onayAc({
    baslik: "Öğretmen silinsin mi?",
    metin: "<b>" + esc(t.ad) + "</b> öğretmeni listeden kaldırılacak. Geçmiş ders kayıtları (öğretmen adıyla birlikte) arşivde kalır.",
    onay: "Evet, Sil", tehlikeli: true
  }, function () {
    DB.ogretmenler = DB.ogretmenler.filter(function (x) { return x.id !== id; });
    if (ui.ogrId === id) ui.ogrId = DB.ogretmenler.length ? DB.ogretmenler[0].id : null;
    toast("Öğretmen silindi.");
    yenile();
  });
}

/* ---- Öğrenciler & Sınıf programı ---- */
function tumSiniflar() {
  var set = {};
  Object.keys(DB.sinifProg).forEach(function (s) { set[s] = 1; });
  DB.ogrenciler.forEach(function (o) { if (o.sinif) set[o.sinif] = 1; });
  return Object.keys(set).sort();
}
function ogrenciTab() {
  var siniflar = tumSiniflar();
  if (!ui.sinifAd || siniflar.indexOf(ui.sinifAd) < 0) ui.sinifAd = siniflar[0] || null;

  var dlSinif = '<datalist id="dl-sinif">' + siniflar.map(function (s) { return '<option value="' + esc(s) + '"></option>'; }).join("") + "</datalist>";

  // ─── Öğrenci listesi ───
  var listeHtml = '<div class="space-y-2 max-h-[260px] overflow-y-auto pr-1">';
  DB.ogrenciler.forEach(function (o, i) {
    var dersSay = DB.dersler.filter(function (l) { return (l.ogrenciId === o.id || l.ogrenciAd === o.ad) && l.durum !== "iptal"; }).length;
    listeHtml += '<div class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">' +
      avatar(o.ad, i) +
      '<div class="flex-1 min-w-0"><div class="text-[13px] font-bold text-slate-700 truncate">' + esc(o.ad) + "</div>" +
      '<div class="text-[10.5px] text-slate-400 flex items-center gap-1.5 flex-wrap">' +
      (o.sinif ? '<span class="bg-slate-100 text-slate-500 font-bold rounded-full px-1.5 py-px">' + esc(o.sinif) + "</span>" : "") +
      (o.tel ? '<span class="font-medium">' + esc(o.tel) + "</span>" : "") +
      '<span>· ' + dersSay + " ders</span></div></div>" +
      '<button onclick="waGonder(\'' + o.id + '\')" title="WhatsApp bilgilendirmesi" class="w-7 h-7 rounded-full text-green-400 hover:bg-green-50 shrink-0"><i class="fa-brands fa-whatsapp"></i></button>' +
      '<button onclick="ogrenciDuzenle(\'' + o.id + '\')" title="Öğrenciyi düzenle" class="w-7 h-7 rounded-full text-slate-300 hover:text-amber-500 hover:bg-amber-50 shrink-0"><i class="fa-solid fa-pen text-[11px]"></i></button>' +
      '<button onclick="oSil(\'' + o.id + '\')" title="Öğrenciyi sil" class="w-7 h-7 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 shrink-0"><i class="fa-solid fa-trash-can text-[12px]"></i></button></div>';
  });
  listeHtml += "</div>";
  if (!DB.ogrenciler.length) listeHtml = '<p class="text-[12px] text-slate-400 text-center py-6">Henüz öğrenci yok.</p>';

  // ─── Öğrenciyi Düzenle formu (sadece düzenleme modunda görünür) ───
  var duzO = ui.ogrenciDuzenleId ? DB.ogrenciler.find(function(x){return x.id===ui.ogrenciDuzenleId;}) : null;
  var duzForm = "";
  if (duzO) {
    duzForm = '<div class="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 mt-3">' +
      '<h4 class="text-[12px] font-bold text-amber-600 uppercase tracking-wide mb-3"><i class="fa-solid fa-pen mr-1"></i>Öğrenciyi Düzenle — ' + esc(duzO.ad) + '</h4>' +
      '<div class="space-y-2.5">' +
        '<input id="d-ad" value="' + esc(duzO.ad) + '" placeholder="Ad Soyad" class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400/40" />' +
        '<input id="d-sinif" list="dl-sinif2" value="' + esc(duzO.sinif || "") + '" placeholder="Sınıf" class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400/40" />' +
        '<datalist id="dl-sinif2">' + siniflar.map(function (s) { return '<option value="' + esc(s) + '"></option>'; }).join("") + '</datalist>' +
        '<input id="d-tel" value="' + esc(duzO.tel || "") + '" placeholder="Telefon" inputmode="tel" class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400/40" />' +
        '<div class="flex gap-2">' +
          '<button onclick="ogrenciGuncelle()" class="flex-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-bold py-2.5 shadow-sm transition-colors"><i class="fa-solid fa-check mr-1.5"></i>Güncelle</button>' +
          '<button onclick="ogrenciDuzenleIptal()" class="rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-[13px] font-bold px-4 py-2.5 shadow-sm transition-colors">İptal</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ─── Sınıf ekleme alanı ───
  var sinifEkleHtml = '<div class="flex gap-2 mb-3">' +
    '<input id="yeniSinifAd" placeholder="Yeni sınıf adı (örn. 11-B)" class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400/40" />' +
    '<button onclick="sinifEkle()" class="rounded-full bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-bold px-4 py-2 shadow-sm transition-colors whitespace-nowrap"><i class="fa-solid fa-plus mr-1"></i>Ekle</button>' +
  '</div>';

  // ─── Sınıf seçici + düzenle + sil ───
  var sinifSecHtml = '<div class="flex items-center gap-2 flex-wrap">' +
    '<label class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Sınıf:</label>' +
    '<select id="sinifSec" onchange="sinifDegistir(this.value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400/40">' +
    siniflar.map(function (s) { return '<option value="' + esc(s) + '"' + (s === ui.sinifAd ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select>" +
    '<button onclick="sinifAdiDegistir()" title="Sınıf adını değiştir" class="w-8 h-8 rounded-full text-slate-300 hover:text-amber-500 hover:bg-amber-50 border border-slate-100"><i class="fa-solid fa-pen text-[10px]"></i></button>' +
    '<button onclick="sinifSil()" title="Sınıf programını sil" class="w-8 h-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-slate-100"><i class="fa-solid fa-trash-can text-[11px]"></i></button></div>';

  // ─── Sınıf programı ───
  var prog = "";
  if (ui.sinifAd) {
    var program = DB.sinifProg[ui.sinifAd] || [];
    prog = '<div class="rounded-2xl border border-slate-100 p-4 md:p-5">' +
      '<div class="flex flex-wrap items-center justify-between gap-3 mb-4">' +
        '<div><h4 class="text-[14px] font-bold text-slate-900">Sınıf Toplu Ders Programı — ' + esc(ui.sinifAd) + "</h4>" +
        '<p class="text-[11px] text-slate-400 mt-0.5">Bu saatlerde sınıf derste olduğu için öğrencilere birebir ders planlanamaz</p></div>' +
        '<span class="flex items-center gap-3 text-[10.5px] font-semibold text-slate-500">' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border border-slate-200 bg-white inline-block"></span> Boş</span>' +
          '<span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-200 border border-blue-300 inline-block"></span> Toplu ders var</span></span>' +
        kilidAnahtariHtml() + '</div>' +
      gridTablo("togSinif('" + esc(ui.sinifAd).replace(/'/g, "\'") + "'", program, "sinif", sinifOgretmenHaritasi()) + "</div>";
  } else {
    prog = '<div class="rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[12.5px] text-slate-400 py-16 text-center px-6">Henüz sınıf yok.<br>Yukarıdaki alandan yeni sınıf ekleyin.</div>';
  }

  return '<div class="grid grid-cols-1 xl:grid-cols-12 gap-4">' +
    '<div class="xl:col-span-4 rounded-2xl border border-slate-100 p-4">' +
      // ── Yeni Öğrenci ──
      '<h4 class="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-3"><i class="fa-solid fa-plus text-blue-500 mr-1"></i>Yeni Öğrenci</h4>' +
      '<div class="space-y-2.5">' +
        '<input id="o-ad" placeholder="Ad Soyad (örn. Ayşe Demir)" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />' +
        '<input id="o-sinif" list="dl-sinif" placeholder="Sınıf / Grup (örn. MEZUN SAY 1)" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />' + dlSinif +
        '<input id="o-tel" placeholder="Telefon (WhatsApp için, isteğe bağlı)" inputmode="tel" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />' +
        '<button onclick="ogrenciEkle()" class="w-full rounded-full bg-blue-500 hover:bg-blue-600 text-white text-[13px] font-bold py-2.5 shadow-sm transition-colors"><i class="fa-solid fa-plus mr-1.5"></i>Öğrenciyi Kaydet</button>' +
      "</div>" +
      // ── Düzenleme formu (koşullu) ──
      duzForm +
      // ── Kayıtlı Öğrenciler ──
      '<h4 class="text-[12px] font-bold text-slate-500 uppercase tracking-wide mt-4 mb-2"><i class="fa-solid fa-list-ul text-blue-500 mr-1"></i>Kayıtlı Öğrenciler <span class="text-slate-300">(' + DB.ogrenciler.length + ')</span></h4>' +
      listeHtml +
    "</div>" +
    '<div class="xl:col-span-8">' +
      '<div class="flex items-center justify-between gap-3 mb-2 flex-wrap px-1"><h4 class="text-[12px] font-bold text-slate-500 uppercase tracking-wide"><i class="fa-solid fa-calendar-week text-blue-500 mr-1"></i>Sınıf Programı</h4>' + sinifSecHtml + "</div>" +
      sinifEkleHtml +
      prog +
    "</div></div>";
}
function ogrenciEkle() {
  var ad = $("o-ad").value.trim();
  var sinif = $("o-sinif").value.trim();
  var tel = $("o-tel").value.trim();
  if (!ad) { toast("Öğrenci adı boş olamaz.", "hata"); return; }
  var varMi = DB.ogrenciler.some(function (o) { return kucuk(o.ad) === kucuk(ad); });
  if (varMi) { toast("Bu öğrenci zaten kayıtlı.", "uyari"); return; }
  var yeni = { id: uid(), ad: ad, sinif: sinif, tel: tel };
  DB.ogrenciler.push(yeni);
  if (sinif && !DB.sinifProg[sinif]) DB.sinifProg[sinif] = [];
  ui.sinifAd = sinif || ui.sinifAd;
  toast("Öğrenci eklendi: " + ad);
  $("o-ad").value = "";
  $("o-sinif").value = "";
  $("o-tel").value = "";
  renderYonetim(); renderFormDestek();
}
// Öğrenci düzenleme

// Öğrenci düzenleme
function ogrenciDuzenle(id) {
  ui.ogrenciDuzenleId = id;
  renderYonetim();
}
function ogrenciDuzenleIptal() {
  ui.ogrenciDuzenleId = null;
  renderYonetim();
}
function ogrenciGuncelle() {
  var id = ui.ogrenciDuzenleId;
  if (!id) return;
  var mevcut = DB.ogrenciler.find(function(o){return o.id === id;});
  if (!mevcut) return;
  var ad = $("d-ad").value.trim();
  var sinif = $("d-sinif").value.trim();
  var tel = $("d-tel").value.trim();
  if (!ad) { toast("Öğrenci adı boş olamaz.", "hata"); return; }
  var cakisiyor = DB.ogrenciler.some(function(o){ return o.id !== id && kucuk(o.ad) === kucuk(ad); });
  if (cakisiyor) { toast("Bu isimde başka bir öğrenci zaten var.", "hata"); return; }
  var eskiAd = mevcut.ad;
  mevcut.ad = ad;
  mevcut.sinif = sinif;
  mevcut.tel = tel;
  // Ders kayıtlarındaki öğrenci adını güncelle
  DB.dersler.forEach(function(l){
    if (l.ogrenciAd === eskiAd) l.ogrenciAd = ad;
    if (l.ogrenciId === id) l.ogrenciAd = ad;
  });
  // İsteklerdeki öğrenci adını güncelle
  if (DB.istekler) DB.istekler.forEach(function(r){
    if (r.ogrenciAd === eskiAd) r.ogrenciAd = ad;
    if (r.ogrenciId === id) r.ogrenciAd = ad;
  });
  if (sinif && !DB.sinifProg[sinif]) DB.sinifProg[sinif] = [];
  ui.sinifAd = sinif || ui.sinifAd;
  ui.ogrenciDuzenleId = null;
  toast("Öğrenci güncellendi: " + ad);
  renderYonetim(); renderFormDestek();
}
// Öğrenci düzenleme

// Öğrenci düzenleme
function oSil(id) {
  var o = DB.ogrenciler.find(function (x) { return x.id === id; });
  if (!o) return;
  onayAc({
    baslik: "Öğrenci silinsin mi?",
    metin: "<b>" + esc(o.ad) + "</b> öğrencisi listeden kaldırılacak. Geçmiş ders kayıtları arşivde kalır.",
    onay: "Evet, Sil", tehlikeli: true
  }, function () {
    DB.ogrenciler = DB.ogrenciler.filter(function (x) { return x.id !== id; });
    toast("Öğrenci silindi.");
    yenile();
  });
}
function sinifEkle() {
  var ad = $("yeniSinifAd").value.trim();
  if (!ad) { toast("Sınıf adı boş olamaz.", "hata"); return; }
  if (DB.sinifProg[ad]) { toast("\"" + ad + "\" adında bir sınıf zaten var.", "uyari"); return; }
  DB.sinifProg[ad] = [];
  ui.sinifAd = ad;
  toast("Sınıf eklendi: " + ad);
  renderYonetim(); renderFormDestek();
}
function sinifDegistir(s) { ui.sinifAd = s; renderYonetim(); }
function sinifAdiDegistir() {
  if (!ui.sinifAd) return;
  var eski = ui.sinifAd;
  var yeni = prompt('Sınıf adını değiştirin:', eski);
  if (!yeni || yeni.trim() === '' || yeni.trim() === eski) return;
  yeni = yeni.trim();
  if (DB.sinifProg[yeni]) { toast('"' + yeni + '" adında bir sınıf zaten var.', 'hata'); return; }
  // Sınıf programını taşı
  if (DB.sinifProg[eski]) { DB.sinifProg[yeni] = DB.sinifProg[eski]; delete DB.sinifProg[eski]; }
  // Bu sınıftaki öğrencilerin sınıf bilgisini güncelle
  DB.ogrenciler.forEach(function(o){ if (o.sinif === eski) o.sinif = yeni; });
  // Bu sınıftaki planlanmış derslerin öğrenci sınıf bilgisini güncelle
  DB.dersler.forEach(function(l){
    var o = DB.ogrenciler.find(function(x){return x.id === l.ogrenciId;});
    if (o && o.sinif === yeni) l.sinif = yeni;
  });
  ui.sinifAd = yeni;
  toast('Sınıf adı değiştirildi: ' + eski + ' → ' + yeni);
  yenile();
}
function sinifSil() {
  if (!ui.sinifAd) return;
  var s = ui.sinifAd;
  onayAc({
    baslik: "Sınıf programı silinsin mi?",
    metin: "<b>" + esc(s) + "</b> sınıfının toplu ders programı kaldırılacak. Öğrenciler silinmez.",
    onay: "Evet, Sil", tehlikeli: true
  }, function () {
    delete DB.sinifProg[s];
    ui.sinifAd = tumSiniflar()[0] || null;
    toast("Sınıf programı silindi.");
    yenile();
  });
}
function togSinif(sinifAd, di, sIdx) {
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — değişiklik için üstteki kilidi açın.", "uyari"); return; }
  if (parseInt(sIdx, 10) === MOLA_SLOT) { toast("Öğle molasına (12:00-13:00) ders eklenemez.", "hata"); return; }
  if (!DB.sinifProg[sinifAd]) DB.sinifProg[sinifAd] = [];
  var key = di + "-" + sIdx;
  var prog = DB.sinifProg[sinifAd];
  if (prog.indexOf(key) >= 0) DB.sinifProg[sinifAd] = prog.filter(function (k) { return k !== key; });
  else prog.push(key);
  yenile();
}

/* ---- Ayarlar & Yedekleme ---- */
function ayarTab() {
  var boyut = 0;
  try { boyut = (localStorage.getItem(LS_KEY) || "").length; } catch (e) {}
  return '<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">' +
    '<div class="lg:col-span-1 rounded-2xl border border-slate-100 p-5">' +
      '<div class="w-11 h-11 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center text-lg mb-3"><i class="fa-solid fa-database"></i></div>' +
      '<h4 class="text-[14px] font-bold text-slate-900">Arşiv Güvenliği</h4>' +
      '<p class="text-[12px] text-slate-500 mt-1.5 leading-relaxed">Öğretmenler, öğrenciler, istekler ve <b>tüm ders geçmişi</b> bu bilgisayarın tarayıcısında saklanır. Bilgisayar değişirse veya tarayıcı verisi temizlenirse kaybolmaması için düzenli yedek alın.</p>' +
      '<div class="flex flex-col gap-2 mt-4">' +
        '<button onclick="yedekAl()" class="rounded-full bg-teal-500 hover:bg-teal-600 text-white text-[13px] font-bold px-5 py-2.5 shadow-sm transition-colors"><i class="fa-solid fa-download mr-1.5"></i>Sistem Verilerini Bilgisayara Yedekle (.json)</button>' +
        '<button onclick="document.getElementById(\'dosyaYukle\').click()" class="rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 text-[13px] font-bold px-5 py-2.5 transition-colors"><i class="fa-solid fa-upload mr-1.5"></i>Yedekten Veri Yükle</button>' +
      "</div>" +
      '<p class="text-[10.5px] text-slate-400 mt-3"><i class="fa-solid fa-circle-info mr-1"></i>Yedek dosyası tek bir .json dosyasıdır; USB belleğe veya buluta kopyalayabilirsiniz.</p>' +
    "</div>" +
    '<div class="lg:col-span-1 rounded-2xl border border-slate-100 p-5">' +
      '<div class="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg mb-3"><i class="fa-solid fa-layer-group"></i></div>' +
      '<h4 class="text-[14px] font-bold text-slate-900">Arşiv Durumu</h4>' +
      '<div class="grid grid-cols-2 gap-2.5 mt-3">' +
        '<div class="bg-slate-50 rounded-xl px-3 py-2.5"><div class="text-[18px] font-extrabold text-slate-800" style="font-variant-numeric:tabular-nums">' + DB.ogretmenler.length + '</div><div class="text-[10.5px] text-slate-400 font-semibold">Öğretmen</div></div>' +
        '<div class="bg-slate-50 rounded-xl px-3 py-2.5"><div class="text-[18px] font-extrabold text-slate-800" style="font-variant-numeric:tabular-nums">' + DB.ogrenciler.length + '</div><div class="text-[10.5px] text-slate-400 font-semibold">Öğrenci</div></div>' +
        '<div class="bg-slate-50 rounded-xl px-3 py-2.5"><div class="text-[18px] font-extrabold text-slate-800" style="font-variant-numeric:tabular-nums">' + Object.keys(DB.sinifProg).length + '</div><div class="text-[10.5px] text-slate-400 font-semibold">Sınıf programı</div></div>' +
        '<div class="bg-slate-50 rounded-xl px-3 py-2.5"><div class="text-[18px] font-extrabold text-slate-800" style="font-variant-numeric:tabular-nums">' + DB.dersler.length + '</div><div class="text-[10.5px] text-slate-400 font-semibold">Ders kaydı</div></div>' +
      "</div>" +
      '<div class="text-[10.5px] text-slate-400 mt-3"><i class="fa-solid fa-hard-drive mr-1"></i>Yerel depolama: ~' + Math.max(1, Math.round(boyut / 1024)) + " KB · Kuruluş: " + fmtTR(DB.kurulus || todayKey()) + "</div>" +
    "</div>" +
    '<div class="lg:col-span-1 rounded-2xl border border-slate-100 p-5">' +
      '<div class="w-11 h-11 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center text-lg mb-3"><i class="fa-solid fa-rotate-left"></i></div>' +
      '<h4 class="text-[14px] font-bold text-slate-900">Bakım</h4>' +
      '<p class="text-[12px] text-slate-500 mt-1.5 leading-relaxed">Programı denemek için örnek veriler yükleyebilir ya da tüm arşivi sıfırlayabilirsiniz.</p>' +
      '<div class="flex flex-col gap-2 mt-4">' +
        '<button onclick="ornekYukle()" class="rounded-full border-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold px-5 py-2 transition-colors"><i class="fa-solid fa-wand-magic-sparkles mr-1.5"></i>Örnek Verileri Yükle</button>' +
        '<button onclick="tumunuSil()" class="rounded-full border-2 border-rose-200 text-rose-500 hover:bg-rose-50 text-[13px] font-bold px-5 py-2 transition-colors"><i class="fa-solid fa-trash-can mr-1.5"></i>Tüm Verileri Sıfırla</button>' +
      "</div>" +
      '<p class="text-[10.5px] text-slate-400 mt-3"><i class="fa-solid fa-shield-halved mr-1"></i>Sıfırlamadan önce mutlaka yedek alın.</p>' +
    "</div></div>";
}
function yedekAl() {
  var paket = { uygulama: "YKS Birebir Takip", surum: 2, tarih: new Date().toISOString(), veri: DB };
  var blob = new Blob([JSON.stringify(paket, null, 2)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "yks-birebir-yedek-" + todayKey() + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  toast("Yedek dosyası indirildi ✓");
}
function yedekOku(input) {
  var f = input.files && input.files[0];
  input.value = "";
  if (!f) return;
  var oku = new FileReader();
  oku.onload = function () {
    try {
      var p = JSON.parse(oku.result);
      var v = p.veri && p.veri.dersler ? p.veri : p;
      if (!v || !Array.isArray(v.dersler)) throw new Error("format");
      // eski saat-bazlı yedek tespiti: ders saatlerinde ":" varsa veya avail/sinifProg key'leri saat formundaysa
      var eskiFormat = v.dersler.some(function (l) { return String(l.saat || "").indexOf(":") >= 0; });
      if (!eskiFormat) {
        var yeniKanıt = false, eskiKanıt = false;
        function anahtarTara(k) {
          var h = parseInt(String(k).split("-").pop(), 10);
          if (isNaN(h)) return;
          if (h <= 7) yeniKanıt = true;       // eski saat modelinde 0..7 yoktu
          else if (h >= 12) eskiKanıt = true; // yeni slot modelinde 12..20 yok
        }
        Object.keys(v.sinifProg || {}).forEach(function (sn) { (v.sinifProg[sn] || []).forEach(anahtarTara); });
        (v.ogretmenler || []).forEach(function (t) {
          if (!t.avail) return;
          if (t.avail.sinif && typeof t.avail.sinif === "object") Object.keys(t.avail.sinif).forEach(anahtarTara);
          (t.avail.musait || []).forEach(anahtarTara);
        });
        eskiFormat = !yeniKanıt && eskiKanıt;
      }
      if (eskiFormat) { v = migrateEski(v); toast("Eski saat-bazlı yedek algılandı — yeni ders saatlerine otomatik dönüştürüldü."); }
      onayAc({
        baslik: "Yedekten veri yüklensin mi?",
        metin: "Dosyadaki arşiv (<b>" + esc(f.name) + "</b>) yüklenecek ve <b>mevcut tüm veriler</b> bununla değiştirilecek. Bu işlem geri alınamaz.",
        onay: "Evet, Yükle", tehlikeli: true
      }, function () {
        DB = normalize(v);
        saveDB();
        ui.editId = null; ui.ogrId = null; ui.sinifAd = null;
        yenile();
        toast("Arşiv başarıyla yüklendi ✓ (" + DB.dersler.length + " ders kaydı)");
      });
    } catch (e) {
      toast("Dosya okunamadı — geçerli bir YKS Birebir Takip yedek dosyası seçin.", "hata");
    }
  };
  oku.readAsText(f);
}
function ornekYukle() {
  onayAc({
    baslik: "Örnek veriler yüklensin mi?",
    metin: "Demo için hazır öğretmen, öğrenci ve ders arşivi yüklenecek. Mevcut veriler silinir.",
    onay: "Yükle", tehlikeli: true
  }, function () {
    DB = seedDB(); saveDB();
    ui.editId = null; ui.ogrId = null; ui.sinifAd = null;
    yenile();
    toast("Örnek veriler yüklendi ✓");
  });
}
function tumunuSil() {
  onayAc({
    baslik: "Tüm veriler silinsin mi?",
    metin: "Bütün arşiv (öğretmenler, öğrenciler, istekler, dersler) kalıcı olarak silinecek. Bu işlem geri alınamaz!",
    onay: "Evet, Sıfırla", tehlikeli: true
  }, function () {
    DB = bosDB(); saveDB();
    ui.editId = null; ui.ogrId = null; ui.sinifAd = null; ui.anchor = todayKey();
    yenile();
    toast("Tüm veriler sıfırlandı.", "uyari");
  });
}

/* ================================================================
   3) ÖĞRENCİ BİREBİR İSTEK HAVUZU
   ================================================================ */
function renderHavuz() {
  var bekleyen = DB.istekler.filter(function (r) { return r.durum === "bekliyor"; }).length;
  var dersOps = '<option value="" disabled>Ders seçin</option>';
  DERSLER.forEach(function (d) { dersOps += '<option value="' + d.id + '">' + d.ad + "</option>"; });

  // -- Ders filtresi çipleri: Tüm Dersler + her ders için ayrı anlık filtre --
  var aktif = ui.istekFiltre || "";
  var gosterilen = DB.istekler.filter(function (r) { return !aktif || r.dersId === aktif; });
  var chips = '<div class="flex flex-wrap items-center gap-1.5 mb-3">' +
    '<span class="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide mr-1"><i class="fa-solid fa-filter mr-1"></i>İstek Filtresi:</span>';
  chips += '<button onclick="istekFiltrele(\'\')" class="rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ' + (!aktif ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200") + '">Tüm Dersler <span class="opacity-60">(' + DB.istekler.length + ")</span></button>";
  DERSLER.forEach(function (d) {
    var n = DB.istekler.filter(function (r) { return r.dersId === d.id; }).length;
    if (!n) return;
    chips += '<button onclick="istekFiltrele(\'' + d.id + '\')" class="rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ' + (aktif === d.id ? d.bg + " " + d.tx + " ring-2 ring-offset-1 ring-slate-300" : d.bg + " " + d.tx + " opacity-60 hover:opacity-100") + '">' + d.ad + " (" + n + ")</button>";
  });
  chips += "</div>";

  // -- Kronolojik sıralama: tarih + saat, eskiden yeniye --
  var sirali = gosterilen.slice().sort(function (a, b) {
    var ka = (a.olusturma || "9999") + " " + String(a.saat || "00:00");
    var kb = (b.olusturma || "9999") + " " + String(b.saat || "00:00");
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  var liste = '<div class="space-y-2">';
  if (!sirali.length) {
    liste += '<div class="border border-dashed border-slate-200 rounded-2xl py-10 text-center"><p class="text-[12px] text-slate-400">' + (aktif ? "Bu derse ait istek yok." : "Havuz boş — rehberlik servisinin öğrenci talepleri burada toplanır.") + "</p></div>";
  }
  sirali.forEach(function (r, i) {
    var o = DB.ogrenciler.find(function (x) { return x.id === r.ogrenciId; });
    var D2 = DERS[r.dersId];
    var bekliyor = r.durum === "bekliyor";
    liste += '<div draggable="' + bekliyor + '" data-istek="' + r.id + '" class="istek-kart flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ' + (bekliyor ? "border-slate-100 hover:border-teal-300 transition-colors cursor-grab active:cursor-grabbing" : "border-green-100 bg-green-50/40") + '"' +
      (bekliyor ? ' ondragstart="istekDrag(event, \'' + r.id + '\'); this.style.opacity=\'0.45\'" ondragend="istekDropHedef=null; this.style.opacity=\'\'"' : "") + ">" +
      avatar((o ? o.ad : r.ogrenciAd), i) +
      '<div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><b class="text-[13px] text-slate-800">' + esc(o ? o.ad : r.ogrenciAd) + "</b>" +
      (D2 ? '<span class="rounded-full px-2 py-0.5 text-[10.5px] font-bold ' + D2.bg + " " + D2.tx + '">' + D2.ad + "</span>" : "") +
      '<span class="text-[10px] font-bold rounded-full px-2 py-0.5 ' + (bekliyor ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700") + '">' + (bekliyor ? "Bekliyor" : "Planlandı") + "</span></div>" +
      '<div class="text-[11.5px] text-slate-500 truncate mt-0.5">' + (r.konu ? "<i>Eksik konu:</i> " + esc(r.konu) : '<span class="italic text-slate-300">Konu belirtilmedi</span>') + "</div>" +
      '<div class="text-[10px] text-slate-400 font-semibold mt-0.5"><i class="fa-regular fa-calendar mr-1"></i>' + fmtTR(r.olusturma) + (r.saat ? " · <i class=\'fa-regular fa-clock ml-1 mr-1\'></i>" + r.saat : "") + "</div></div>" +
      (bekliyor
        ? '<button onclick="formaAktar(\'' + r.id + '\')" title="Sürükleyip planlama formuna bırakın veya tıklayın" class="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-[11.5px] font-bold px-3.5 py-2 shadow-sm transition-colors"><i class="fa-solid fa-arrow-right-arrow-left"></i>Eşleştir &amp; Planla</button>'
        : '<span class="text-[10.5px] text-emerald-600 font-bold shrink-0"><i class="fa-solid fa-check mr-1"></i>Derse dönüştürüldü</span>') +
      '<button onclick="istekSil(\'' + r.id + '\')" class="w-7 h-7 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 shrink-0"><i class="fa-solid fa-trash-can text-[12px]"></i></button></div>';
  });
  liste += "</div>";

  $("havuzBolum").innerHTML =
    '<div class="kart p-5">' +
      '<div class="flex flex-wrap items-center justify-between gap-3 mb-4">' +
        '<div><h2 class="text-[15px] font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-inbox text-slate-300"></i> Öğrenci Birebir İstek Havuzu</h2>' +
        '<p class="text-[11.5px] text-slate-400 font-medium">Kronolojik sıralı · Kartları sürükleyip planlama formuna bırakabilirsiniz</p></div>' +
        '<span class="rounded-full px-3 py-1.5 text-[11.5px] font-bold ' + (bekleyen ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400") + '">' + bekleyen + " bekleyen istek</span></div>" +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">' +
        '<input id="h-ogrenci" list="dl-ogrenci" placeholder="Öğrenci adı" autocomplete="off" class="rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />' +
        '<select id="h-ders" class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40">' + dersOps + "</select>" +
        '<input id="h-konu" placeholder="Eksik konu (örn. Paragraf)" autocomplete="off" class="lg:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-400/40" />' +
        '<button onclick="istekEkle()" class="rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 text-[13px] font-bold px-4 py-2 transition-colors"><i class="fa-solid fa-plus mr-1.5"></i>İsteği Havuza Ekle</button>' +
      "</div>" +
      chips + liste + "</div>";
}
function istekFiltrele(id) { ui.istekFiltre = id || ""; renderHavuz(); }
function istekDrag(ev, id) { istekDropHedef = id; if (ev.dataTransfer) { ev.dataTransfer.effectAllowed = "copy"; try { ev.dataTransfer.setData("text/plain", id); } catch (e) {} } }

function istekEkle() {
  var ad = $("h-ogrenci").value.trim();
  var dersId = $("h-ders").value;
  var konu = $("h-konu").value.trim();
  if (!ad) { toast("Öğrenci adı girin.", "hata"); return; }
  if (!dersId) { toast("Ders seçin.", "hata"); return; }
  var o = DB.ogrenciler.find(function (x) { return kucuk(x.ad) === kucuk(ad); });
  if (!o) {
    o = { id: uid(), ad: ad, sinif: "", tel: "" };
    DB.ogrenciler.push(o);
  }
  DB.istekler.push({ id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: dersId, konu: konu, durum: "bekliyor", olusturma: todayKey() });
  toast("İstek havuza eklendi ✓");
  renderHavuz(); renderFormDestek();
}
function formaAktar(id) {
  var r = DB.istekler.find(function (x) { return x.id === id; });
  if (!r || r.durum !== "bekliyor") return;
  var o = DB.ogrenciler.find(function (x) { return x.id === r.ogrenciId; });
  $("f-ogrenci").value = o ? o.ad : r.ogrenciAd;
  $("f-ders").value = r.dersId;
  $("f-konu").value = r.konu;
  ui.aktifIstekId = r.id;
  ui.editId = null;
  duzenleBannerGuncelle();
  $("f-tarih").value = todayKey();
  if (!gecerliSlot(parseInt($("f-saat").value, 10))) $("f-saat").value = "5";
  $("planKart").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(function () { $("planKart").classList.add("ring-2", "ring-teal-300"); }, 500);
  setTimeout(function () { $("planKart").classList.remove("ring-2", "ring-teal-300"); }, 2600);
  toast("İstek planlama formuna aktarıldı. Tarih ve saati seçip kaydedin.");
}
function istekSil(id) {
  DB.istekler = DB.istekler.filter(function (r) { return r.id !== id; });
  toast("İstek silindi.");
  renderHavuz();
}


// -- Havuz kartı, planlama formu kartına sürüklenip bırakıldığında isteği forma aktar --
document.addEventListener("DOMContentLoaded", function () {
  var pk = $("planKart");
  if (!pk) return;
  pk.addEventListener("dragover", function (e) {
    if (!istekDropHedef) return;
    e.preventDefault();
    if (ev_dnd) ev_dnd.dataTransfer.dropEffect = "copy";
    pk.classList.add("ring-2", "ring-teal-300");
  });
  pk.addEventListener("dragleave", function () { pk.classList.remove("ring-2", "ring-teal-300"); });
  pk.addEventListener("drop", function (e) {
    pk.classList.remove("ring-2", "ring-teal-300");
    if (!istekDropHedef) return;
    e.preventDefault();
    formaAktar(istekDropHedef);
    istekDropHedef = null;
  });
});
var ev_dnd = null, istekDropHedef = null;
document.addEventListener("dragstart", function (e) { ev_dnd = e; });
document.addEventListener("dragend", function () { ev_dnd = null; });

/* ================================================================
   4) PLAN FORMU — hızlı öğretmen, liste destekleri, banner
   ================================================================ */
function dersOpsi() {
  var s = "";
  DERSLER.forEach(function (d) { s += '<option value="' + d.id + '">' + d.ad + "</option>"; });
  return s;
}
function renderFormDestek() {
  var dlO = '<option value=""></option>';
  DB.ogrenciler.forEach(function (o) { dlO += '<option value="' + esc(o.ad) + '"></option>'; });
  $("dl-ogrenci").innerHTML = dlO;

  var dlT = '<option value=""></option>';
  DB.ogretmenler.forEach(function (t) { dlT += '<option value="' + esc(t.ad) + '"></option>'; });
  $("dl-ogretmen").innerHTML = dlT;

  var dersSec = $("f-ders");
  if (!dersSec.innerHTML.trim()) dersSec.innerHTML = dersOpsi();

  var sayac = {};
  DB.dersler.filter(function (l) { return l.durum !== "iptal"; }).forEach(function (l) {
    sayac[l.ogretmenId || l.ogretmenAd] = (sayac[l.ogretmenId || l.ogretmenAd] || 0) + 1;
  });
  var hizli = DB.ogretmenler.slice().sort(function (a, b) { return (sayac[b.id] || 0) - (sayac[a.id] || 0); }).slice(0, 5);
  var pill = "";
  hizli.forEach(function (t) {
    pill += '<button onclick="hizliSec(\'' + esc(t.ad).replace(/'/g, "\\'") + '\')" class="rounded-full border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-[11.5px] font-semibold text-slate-600 px-3 py-1 transition-colors">' + esc(t.ad) + "</button>";
  });
  if (!hizli.length) pill = '<span class="text-[11px] text-slate-300 italic">Öğretmen eklemek için Öğretmenler sekmesini kullanın</span>';
  $("hizliOgr").innerHTML = pill;

  duzenleBannerGuncelle();
}
function hizliSec(ad) { $("f-ogretmen").value = ad; }
function bugunTarih() { $("f-tarih").value = todayKey(); }
function yarinTarih() { $("f-tarih").value = addDaysKey(todayKey(), 1); }
function duzenleBannerGuncelle() {
  var banner = $("duzenleBanner");
  if (ui.editId) {
    var l = DB.dersler.find(function (x) { return x.id === ui.editId; });
    if (l) {
      banner.className = "inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-[11.5px] font-bold text-amber-700";
      banner.innerHTML = '<i class="fa-solid fa-pen"></i>Ders düzenleniyor: ' + esc(l.ogrenciAd) + " · " + fmtTR(l.tarih) + " " + saatGoster(l.saat);
      banner.classList.remove("hidden");
      $("btnBaslik").textContent = "Dersi Düzenle";
      $("btnPlanYazi").textContent = "Değişiklikleri Kaydet";
      $("btnVazgec").classList.remove("hidden");
      $("btnPlan").classList.remove("from-teal-500", "to-emerald-500");
      $("btnPlan").classList.add("from-amber-500", "to-orange-500");
      return;
    }
    ui.editId = null;
  }
  banner.className = "hidden";
  $("btnBaslik").textContent = "Birebir Ders Planla";
  $("btnPlanYazi").textContent = "Birebir Dersi Planla";
  $("btnVazgec").classList.add("hidden");
  $("btnPlan").classList.add("from-teal-500", "to-emerald-500");
  $("btnPlan").classList.remove("from-amber-500", "to-orange-500");
}
function vazgec() {
  ui.editId = null; ui.aktifIstekId = null;
  temizleForm();
  duzenleBannerGuncelle();
  toast("Düzenleme iptal edildi.");
}
function saatSecenekleri() {
  var ops = '<option value="" disabled>Ders saati seçin</option>';
  SLOT_BILGI.forEach(function (b, i) {
    if (i === MOLA_SLOT) {
      ops += '<option value="' + i + '" disabled>☕ Öğle Molası (12:00-13:00) — kilitli</option>';
    } else {
      ops += '<option value="' + i + '">' + b.no + ". Ders — " + b.s + " - " + b.e + "</option>";
    }
  });
  return ops;
}
function fSaatDoldur(secili) {
  var el = $("f-saat"); if (!el) return;
  el.innerHTML = saatSecenekleri();
  el.value = secili != null ? String(secili) : "5"; // varsayılan 5. ders (13:00)
}
fSaatDoldur();
function temizleForm() {
  $("f-ogrenci").value = "";
  $("f-konu").value = "";
  $("f-ogretmen").value = "";
  $("f-tarih").value = "";
  fSaatDoldur("5");
  $("f-yoksay").checked = false;
  $("cakismaUyari").classList.add("hidden");
}
function hataKart(liste) {
  $("cakismaUyari").classList.remove("hidden");
  $("cakismaUyari").innerHTML =
    '<div class="flex items-start gap-3.5 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3.5 belir">' +
    '<span class="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5"><i class="fa-solid fa-triangle-exclamation"></i></span>' +
    '<div class="flex-1"><b class="text-[13px] text-rose-700 block">Çakışma tespit edildi — ders kaydedilmedi</b>' +
    '<ul class="text-[12.5px] text-rose-600/90 mt-1.5 space-y-1 list-disc list-inside">' + liste.map(function (m) { return "<li>" + m + "</li>"; }).join("") + "</ul>" +
    '<p class="text-[11px] text-rose-400 mt-2">Gerçekten planlamak istiyorsanız <b>“Çakışmayı Yoksay / Ekstra Kontenjan”</b> kutusunu işaretleyip tekrar kaydedin.</p></div></div>';
  $("cakismaUyari").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function duzeltmeBul(adet, yokSay) {
  var saatNum = String(adet.saat).indexOf(":") >= 0 ? eskiSaatToSlot(adet.saat) : parseInt(adet.saat, 10); // slot index (eski "SS:DD" ise dönüşüm)
  var di = dowIdx(adet.tarih);
  var key = di + "-" + saatNum;
  var uyari = [];
  var ogr = DB.ogretmenler.find(function (t) { return t.id === adet.ogretmenId; });
  if (ogr) {
    var tip = (ogr.avail.sinif && key in ogr.avail.sinif) ? "sinif" : (ogr.avail.musait.indexOf(key) >= 0) ? "musait" : "";
    if (tip === "sinif") uyari.push(ogr.ad + " öğretmeninin o saatte <b>Sınıf Dersi</b> var (" + GUN_KISA[di] + " " + slotEtiket(saatNum) + ").");
    else if (tip === "musait") uyari.push(ogr.ad + " öğretmeni o saat için <b>Müsait Değil</b> olarak işaretli.");
    var cakisan = DB.dersler.find(function (l) {
      return l.ogretmenId === ogr.id && l.tarih === adet.tarih && l.saat === adet.saat && l.durum !== "iptal" && l.id !== (adet.id || "");
    });
    if (cakisan) uyari.push("Aynı saatte " + ogr.ad + " öğretmeninin <b>" + cakisan.ogrenciAd + "</b> ile başka bir dersi var (" + fmtTR(cakisan.tarih) + " " + cakisan.saat + ").");
  }
  var o = DB.ogrenciler.find(function (s) { return s.id === adet.ogrenciId; });
  if (o && o.sinif && (DB.sinifProg[o.sinif] || []).indexOf(key) >= 0) {
    uyari.push(o.ad + " öğrencisinin sınıfı (<b>" + o.sinif + "</b>) o saatte toplu derste.");
  }
  return uyari;
}
function planla() {
  var ogrenciAd = $("f-ogrenci").value.trim();
  var dersId = $("f-ders").value;
  var konu = $("f-konu").value.trim();
  var ogretmenAd = $("f-ogretmen").value.trim();
  var tarih = $("f-tarih").value;
  var saat = $("f-saat").value;
  var yoksay = $("f-yoksay").checked;
  var hatalar = [];
  if (!ogrenciAd) hatalar.push("Öğrenci adı yazın (yeni öğrenci otomatik kaydedilir).");
  if (!dersId) hatalar.push("Ders seçin.");
  if (!ogretmenAd) hatalar.push("Öğretmen adı yazın veya hızlı öğretmen seçin.");
  if (!tarih) hatalar.push("Tarih seçin.");
  if (!saat) hatalar.push("Saat seçin.");
  else {
    var sNum = parseInt(String(saat).indexOf(":") >= 0 ? saat.split(":")[0] : saat, 10);
    if (isNaN(sNum)) hatalar.push("Ders slotu seçin.");
    else if (sNum === MOLA_SLOT) hatalar.push("Öğle molası (12:00-13:00) slotuna ders eklenemez.");
    else if (!gecerliSlot(sNum)) hatalar.push("Geçersiz ders slotu — lütfen listeden bir ders saati seçin.");
  }
  if (hatalar.length) { hataKart(hatalar); return; }
  if (tarih < todayKey()) {
    hataKart(["Seçilen tarih geçmişte. Geçmişe ders planlamak için listeden dersi düzenleyebilirsiniz."]);
    return;
  }

  var o = DB.ogrenciler.find(function (x) { return kucuk(x.ad) === kucuk(ogrenciAd); });
  if (!o) {
    o = { id: uid(), ad: ogrenciAd, sinif: "", tel: "" };
    DB.ogrenciler.push(o);
    toast("Yeni öğrenci kaydedildi: " + ogrenciAd);
  }
  var t = DB.ogretmenler.find(function (x) { return kucuk(x.ad) === kucuk(ogretmenAd); });
  if (!t) {
    t = { id: uid(), ad: ogretmenAd, brans: dersId, avail: { sinif: {}, musait: [] } };
    DB.ogretmenler.push(t);
    toast("Yeni öğretmen kaydedildi: " + ogretmenAd);
  }

  var cakisma = duzeltmeBul({ ogrenciId: o.id, ogretmenId: t.id, tarih: tarih, saat: saat, id: ui.editId || "" }, yoksay);
  if (cakisma.length && !yoksay) { hataKart(cakisma); return; }
  $("cakismaUyari").classList.add("hidden");

  if (ui.editId) {
    var mevcut = DB.dersler.find(function (x) { return x.id === ui.editId; });
    if (mevcut) {
      mevcut.ogrenciId = o.id; mevcut.ogrenciAd = o.ad;
      mevcut.dersId = dersId; mevcut.konu = konu;
      mevcut.ogretmenId = t.id; mevcut.ogretmenAd = t.ad;
      mevcut.tarih = tarih; mevcut.saat = saat;
      toast("Ders güncellendi ✓");
    }
    ui.editId = null;
  } else {
    DB.dersler.push({
      id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: dersId, konu: konu,
      ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat,
      durum: "planlandi", olusturma: todayKey()
    });
    if (ui.aktifIstekId) {
      var r = DB.istekler.find(function (x) { return x.id === ui.aktifIstekId; });
      if (r) { r.durum = "planlandi"; }
      ui.aktifIstekId = null;
    }
    toast("Ders planlandı 🎉 " + o.ad + " · " + fmtTR(tarih) + " " + saat);
  }
  temizleForm();
  ui.anchor = haftaBaslangiciD(tarih);
  duzenleBannerGuncelle();
  yenile();
  $("planKart").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function haftaBaslangiciD(k) { return addDaysKey(k, -dowIdx(k)); }

/* ================================================================
   5) DERSLER TABLOSU + AKSİYON ÇUBUĞU
   ================================================================ */
function setFiltre(f) {
  ui.filtre = f;
  istekDropHedef = null;
  if (f === "tumu") { /* anchor kullanılmaz */ }
  else if (f === "hafta") ui.anchor = haftaBaslangiciD(ui.anchor);
  else if (f === "ay") ui.anchor = ui.anchor.slice(0, 7) + "-01";
  else ui.anchor = ui.anchor.slice(0, 4) + "-01-01";
  if (f !== "hafta" && f !== "gun") ui.gunSecim = null;
  renderOzet(); renderAnaliz(); renderDersler();
}
function haftalikOgrtSec(id) { ui.haftalikOgrtId = id || null; renderDersler(); }
function gunSec(k) {
  if (!k || ui.gunSecim === k) ui.gunSecim = null;
  else ui.gunSecim = k;
  renderDersler();
}
function navGit(yon) {
  if (ui.filtre === "tumu") return;
  istekDropHedef = null;
  var a = ui.anchor;
  if (ui.filtre === "gun") ui.anchor = addDaysKey(a, yon);
  else if (ui.filtre === "hafta") {
    ui.anchor = addDaysKey(a, yon * 7);
    var _wp = pencere();
    if (ui.gunSecim && (ui.gunSecim < _wp.start || ui.gunSecim > _wp.end)) ui.gunSecim = null;
  }
  else if (ui.filtre === "ay") {
    var d = fromKey(a.slice(0, 7) + "-01");
    ui.anchor = toKey(new Date(d.getFullYear(), d.getMonth() + yon, 1));
  } else {
    ui.anchor = (parseInt(a.slice(0, 4), 10) + yon) + "-01-01";
  }
  renderOzet(); renderAnaliz(); renderDersler();
}
function buguneDon() {
  ui.anchor = todayKey();
  istekDropHedef = null;
  if (ui.gunSecim) { var _w2 = pencere(); if (ui.gunSecim < _w2.start || ui.gunSecim > _w2.end) ui.gunSecim = null; }
  renderOzet(); renderAnaliz(); renderDersler();
}
function guncelMi() {
  var t = todayKey();
  if (ui.filtre === "gun") return ui.anchor === t;
  if (ui.filtre === "hafta") return haftaBaslangiciD(ui.anchor) === haftaBaslangiciD(t);
  if (ui.filtre === "ay") return ui.anchor.slice(0, 7) === t.slice(0, 7);
  if (ui.filtre === "yil") return ui.anchor.slice(0, 4) === t.slice(0, 4);
  return true;
}
// ═══════════════════════════════════════════════════════════════
// HAFTALIK ÖĞRETMEN TABLOSU — Bir öğretmenin haftalık programı
// ═══════════════════════════════════════════════════════════════
function haftalikOgrtTablo() {
  var ogrtId = ui.haftalikOgrtId;
  if (!ogrtId) return "";
  var t = DB.ogretmenler.find(function(x){ return x.id === ogrtId; });
  if (!t) return "";
  var brans = DERS[t.brans];

  // Bu öğretmenin bu dönemin derslerini slot bazında eşle (key: "gün-slot")
  var p = pencere();
  var dersMap = {};
  DB.dersler.forEach(function (l) {
    if (l.ogretmenId !== t.id && (l.ogretmenAd || "") !== t.ad) return;
    if (l.durum === "iptal") return;
    if (p.start && (l.tarih < p.start || l.tarih > p.end)) return;
    var d = new Date(l.tarih + "T12:00:00");
    var gunIdx = (d.getDay() + 6) % 7;
    var sIdx = parseInt(String(l.saat).indexOf(":") >= 0 ? eskiSaatToSlot(l.saat) : l.saat, 10);
    if (isNaN(sIdx)) sIdx = parseInt(l.saat, 10) || 0;
    dersMap[gunIdx + "-" + sIdx] = l;
  });

  var avail = t.avail || { sinif: {}, musait: [] };
  var kilitKapa = !ui.duzenlemeAcik; // Düzenleme Kilidi kapalıysa sürükleme yok

  // Saat başlıkları: 11 ders slottu + kilitli öğle molası
  var saatBaslik = "";
  SLOT_BILGI.forEach(function (bil, bi) {
    if (bi === MOLA_SLOT) {
      saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100 bg-emerald-100' style='min-width:58px'>" +
        '<div class="text-[9.5px] font-extrabold text-emerald-600">☕ MOLA</div>' +
        '<div class="text-[8px] text-emerald-500">12:00-13:00</div></th>';
    } else {
      saatBaslik += "<th class='px-2 py-2 text-center border-l border-slate-100' style='min-width:76px'>" +
        '<div class="text-[10px] font-extrabold text-slate-600">' + bil.no + ". Ders</div>" +
        '<div class="text-[8.5px] text-slate-400">' + slotAralikYazi(bil) + '</div></th>';
    }
  });

  var gunAdlari = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
  var satirlar = "";
  for (var g = 0; g < 7; g++) {
    var gunAd = gunAdlari[g];
    var isPazar = g === 6;
    var bg = g % 2 === 0 ? "bg-white" : "bg-slate-50/50";

    satirlar += '<tr class="border-b border-slate-100 ' + bg + '">';
    satirlar += '<td class="px-3 py-2 border-r border-slate-100 text-[11.5px] font-bold text-slate-600 whitespace-nowrap" style="min-width:100px">' + gunAd + '</td>';

    SLOT_BILGI.forEach(function (bil, sIdx) {
      var key = g + "-" + sIdx;
      if (sIdx === MOLA_SLOT) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-emerald-50"><span class="text-[9px] font-bold text-emerald-500">Mola</span></td>';
        return;
      }
      var ders = dersMap[key];
      var sinifVar = avail.sinif && (key in avail.sinif);
      var musaitDegil = avail.musait.indexOf(key) >= 0;

      if (isPazar || musaitDegil) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100 bg-slate-100"><span class="text-[9px] text-slate-400">' + (isPazar ? "Pazar" : "—") + '</span></td>';
      } else if (sinifVar) {
        satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg bg-rose-100 border border-rose-200 px-1 py-1.5" title="Sınıf dersi — kilitli">' +
          '<div class="text-[8px] font-bold text-rose-700 leading-tight truncate whitespace-nowrap">' + esc(String(avail.sinif[key] || "Sınıf").substring(0, 14)) + '</div></div></td>';
      } else if (ders) {
        var ogrenci = DB.ogrenciler.find(function(x){ return x.id === ders.ogrenciId; });
        var ogrenciAd = ders.ogrenciAd || (ogrenci ? ogrenci.ad : "");
        var sinif = ders.sinif || (ogrenci ? ogrenci.sinif : "");
        var dersBilgi = DERS[ders.dersId];
        var hareketli = ders.kaynak === "takvim" && !kilitKapa;
        if (hareketli) {
          satirlar += '<td class="px-1.5 py-1.5 text-center border-l border-slate-100">' +
            '<div draggable="true" ondragstart="istekDrag(event, \'' + ders.id + '\')" title="Sürükleyip başka boş saate taşıyabilirsin" class="dnd-kart rounded-lg border border-emerald-200 bg-emerald-50 px-1 py-1.5">' +
            '<div class="text-[10px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd) + '</div>' +
            (sinif ? '<div class="text-[8.5px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (ders.konu ? '<div class="text-[8px] text-slate-500 leading-tight mt-0.5" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(ders.konu) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[7.5px] font-bold mt-0.5 text-emerald-700">' + dersBilgi.ad + '</div>' : '') +
            '</div></td>';
        } else {
          var durumRenk = ders.durum === "tamamlandi" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
          satirlar += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-l border-slate-100"><div class="rounded-lg border ' + durumRenk + ' px-1 py-1.5" title="Dolu — düzenleme kilidi açıkken yeşil kartlar taşınabilir">' +
            '<div class="text-[10px] font-bold text-slate-800 leading-tight">' + esc(ogrenciAd) + '</div>' +
            (sinif ? '<div class="text-[8.5px] font-semibold text-slate-500">' + esc(sinif) + '</div>' : '') +
            (ders.konu ? '<div class="text-[8px] text-slate-500 leading-tight mt-0.5" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(ders.konu) + '</div>' : '') +
            (dersBilgi ? '<div class="text-[7.5px] font-bold mt-0.5 ' + dersBilgi.tx + '">' + dersBilgi.ad + '</div>' : '') +
            '</div></td>';
        }
      } else {
        // BOŞ HÜCRE → DROP ZONE (yalnızca düzenleme kilidi açıkken aktif)
        var suruklenebilir = kilitKapa ? ' draggable="false"' : "";
        var bosCls = kilitKapa ? "dnd-bos dnd-kapali" : "dnd-bos";
        satirlar += '<td class="' + bosCls + ' px-1.5 py-1.5 text-center border-l border-slate-100 transition-colors"' + suruklenebilir +
          ' data-drop-ogrt="' + esc(t.id) + '" data-drop-gun="' + g + '" data-drop-saat="' + sIdx + '"' +
          ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)" ondrop="istekBurak(event, this, \'' + esc(t.id) + '\', \'' + addDaysKey(p.start, g) + '\', \'' + sIdx + '\')" title="' + (kilitKapa ? "Boş saat — düzenleme kilidi açık değil" : "Boş saat — havuzdan istek kartı sürükleyip bırakın") + '">' +
          '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
      }
    });
    satirlar += "</tr>";
  }

  return '<div class="rounded-2xl border border-slate-100 overflow-hidden mb-4">' +
    '<div class="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-slate-100">' +
      '<div class="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-sm shrink-0"><i class="fa-solid fa-calendar-week text-sm"></i></div>' +
      '<div><h3 class="text-[14px] font-extrabold text-slate-800">ÖĞRETMEN — ' + esc(t.ad.toUpperCase()) + '</h3>' +
      '<p class="text-[11px] text-slate-400">' + (brans ? brans.ad : 'Branş yok') + " · " + pencereAdi() + '</p></div>' +
      kilidAnahtariHtml() +
    '</div>' +
    '<div class="overflow-x-auto"><table class="w-full border-collapse">' +
      '<thead><tr class="bg-slate-50/80 border-b border-slate-100">' +
        '<th class="px-3 py-2 text-left border-r border-slate-100 text-[10.5px] font-extrabold text-slate-400 uppercase" style="min-width:100px">Gün</th>' +
        saatBaslik +
      '</tr></thead><tbody>' + satirlar + '</tbody></table></div></div>';
}

function istekDragOver(ev, el) {
  if (!istekDropHedef) return;               // havuzdan sürüklenen kart yoksa tepki verme
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
  el.classList.add("dnd-uygun");
}
function istekDragLeave(el) { el.classList.remove("dnd-uygun"); }
function istekBurak(ev, el, ogrtId, tarih, saat) {
  ev.preventDefault();
  el.classList.remove("dnd-uygun");
  var istekId = istekDropHedef; istekDropHedef = null;
  if (!istekId) return;

  // Kaynağı belirle: havuzdaki istek mi, takvimdeki taşınan kart mı?
  var kaynak = "havuz";
  var r = DB.istekler.find(function (x) { return x.id === istekId; });
  if (!r) {
    var d = DB.dersler.find(function (x) { return x.id === istekId; });
    if (d && d.kaynak === "takvim") {
      kaynak = "takvim";
      r = { ogrenciId: d.ogrenciId, ogrenciAd: d.ogrenciAd, dersId: d.dersId, konu: d.konu };
    }
  }
  if (!r) return;

  var t = DB.ogretmenler.find(function (x) { return x.id === ogrtId; });
  if (!t) { toast("Öğretmen bulunamadı.", "hata"); return; }

  // AKILLI BRANŞ KONTROLÜ (ZORUNLU): ders yalnızca kendi branşındaki öğretmene bırakılabilir
  var IB = DERS[r.dersId], TB = DERS[t.brans];
  if (!t.brans || !TB || r.dersId !== t.brans) {
    toast("Branş uyuşmuyor: " + (IB ? IB.ad : "Bu ders") + " yalnızca " + (TB ? TB.ad.toLowerCase("tr") : "aynı branştaki") + " öğretmene planlanabilir — " + t.ad + " (" + (TB ? TB.ad : "branşsız") + ").", "hata");
    return;
  }

  // Düzenleme Kilidi: kapalıysa hiçbir bırakma yapılamaz
  if (!ui.duzenlemeAcik) { toast("Düzenleme kilidi kapalı — takvimlere sürükle-bırak için kilidi açın.", "hata"); renderDersler(); return; }

  // Kilit kontrolü: hücre bu arada dolmuşsa veya öğretmen o saatte kilitliyse bırakmayı reddet
  var di = dowIdx(tarih), sIdx = parseInt(saat, 10);
  var key = di + "-" + sIdx;
  var dolu = DB.dersler.some(function (l) { return l.ogretmenId === ogrtId && l.tarih === tarih && String(l.saat) === String(saat) && l.durum !== "iptal" && l.id !== istekId; });
  var pazar = di === 6; // Pazar: kurum tamamen kapalı
  var molaSaati = sIdx === MOLA_SLOT; // Öğle molası: 12:00-13:00 kilitli
  var kilitli = dolu || pazar || molaSaati || (t.avail && ((t.avail.sinif && key in t.avail.sinif) || t.avail.musait.indexOf(key) >= 0));
  if (kilitli) { toast(molaSaati ? "Öğle molası (12:00-13:00) kilitli — bu saate ders bırakılamaz." : "Bu saat kilitli ya da dolu — kart bırakılamadı.", "hata"); renderDersler(); return; }

  // Öğrenciyi bul/oluştur
  var o = DB.ogrenciler.find(function (x) { return x.id === r.ogrenciId; });
  if (!o) {
    o = { id: uid(), ad: r.ogrenciAd || "İsimsiz Öğrenci", sinif: "", tel: "" };
    DB.ogrenciler.push(o);
  }

  if (kaynak === "takvim") {
    // Takvim içinde taşıma: mevcut ders kaydının yeri değişir
    var eski = DB.dersler.find(function (x) { return x.id === istekId; });
    if (eski) {
      eski.tarih = tarih; eski.saat = saat;
      eski.ogretmenId = t.id; eski.ogretmenAd = t.ad;
      toast("Ders taşındı ✓ " + o.ad + " · " + fmtTR(tarih) + " " + saatGoster(saat));
