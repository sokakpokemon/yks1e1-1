/* ================================================================
   ek-ders.js — EK DERS SEKMESİ
   Birebir ders sisteminin birebir aynısı; TEK farkı: dersler
   öğrencilere değil SINIFLARA atanır, öğretmenler sınıflara atanır.
   Veriler mevcut DB (localStorage "yksOto_arsiv_v1") içindeki
   DB.ekDersler dizisinde saklanır → Yedek Al / Yedek Yüke otomatik dahildir.
   Mevcut hiçbir fonksiyon değiştirilmedi; yalnızca renderYonetim,
   sekmeleri de içeren aynı arayüzle (Ek Ders sekmesi eklenerek)
   yeniden çizilir. Öğretmen müsaitlik takvimi, çakışma kontrolleri
   ve onay akışı birebir sistemdeki fonksiyonlarla/verilerle çalışır.
   ================================================================ */

if (
  typeof DB !== "undefined" && typeof ui !== "undefined" &&
  typeof $ === "function" && typeof renderYonetim === "function" &&
  typeof document !== "undefined"
) {

  /* ---------- Veri katmanı (yeni, ayrı fonksiyonlar) ---------- */

  var ekDersler = function () {
    if (!DB.ekDersler || !Array.isArray(DB.ekDersler)) DB.ekDersler = [];
    return DB.ekDersler;
  };

  if (!ui.ekForm) ui.ekForm = { sinif: "", dersId: "", konu: "", ogretmen: "", tarih: "", saat: "15:30", yoksay: false };
  if (ui.ekEditId === undefined || ui.ekEditId === null) ui.ekEditId = null;

  /* ---------- Form durumu yardımcıları ---------- */

  var ekFormSet = function (alan, deger) { ui.ekForm[alan] = deger; };
  var ekBugun = function () { ui.ekForm.tarih = todayKey(); var el = $("ek-tarih"); if (el) el.value = ui.ekForm.tarih; };
  var ekYarin = function () { ui.ekForm.tarih = addDaysKey(todayKey(), 1); var el = $("ek-tarih"); if (el) el.value = ui.ekForm.tarih; };
  var ekHizliSec = function (ad) { ui.ekForm.ogretmen = ad; var el = $("ek-ogretmen"); if (el) el.value = ad; };

  var ekTemizleForm = function () {
    ui.ekForm.sinif = ""; ui.ekForm.dersId = ""; ui.ekForm.konu = "";
    ui.ekForm.ogretmen = ""; ui.ekForm.tarih = ""; ui.ekForm.saat = "15:30";
    ui.ekForm.yoksay = false;
    var u = $("ek-cakismaUyari"); if (u) u.classList.add("hidden");
  };

  var ekVazgec = function () {
    ui.ekEditId = null;
    ekTemizleForm();
    toast("Düzenleme iptal edildi.");
    renderYonetim();
  };

  /* Sınıf ekleme alanı — mevcut DB.sinifProg yapısını kullanır (sinifEkle kopyası) */
  var ekSinifEkle = function () {
    var el = $("ek-sinif-yeni");
    var ad = el ? el.value.trim() : "";
    if (!ad) { toast("Sınıf adı boş olamaz.", "hata"); return; }
    if (tumSiniflar().some(function (s) { return kucuk(s) === kucuk(ad); })) { toast("\u201C" + ad + "\u201D adında bir sınıf zaten var.", "uyari"); return; }
    DB.sinifProg[ad] = [];
    ui.ekForm.sinif = ad;
    toast("Sınıf eklendi: " + ad);
    renderYonetim(); renderFormDestek();
  };

  /* ---------- Çakışma uyarı kartı (hataKart kopyası) ---------- */

  var ekHataKart = function (liste) {
    var kutu = $("ek-cakismaUyari");
    if (!kutu) return;
    kutu.classList.remove("hidden");
    kutu.innerHTML =
      '<div class="flex items-start gap-3.5 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3.5 belir">' +
      '<span class="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5"><i class="fa-solid fa-triangle-exclamation"></i></span>' +
      '<div class="flex-1"><b class="text-[13px] text-rose-700 block">Çakışma tespit edildi — ek ders kaydedilmedi</b>' +
      '<ul class="text-[12.5px] text-rose-600/90 mt-1.5 space-y-1 list-disc list-inside">' + liste.map(function (m) { return "<li>" + m + "</li>"; }).join("") + "</ul>" +
      '<p class="text-[11px] text-rose-400 mt-2">Gerçekten planlamak istiyorsanız <b>\u201CÇakışmayı Yoksay / Ekstra Kontenjan\u201D</b> kutusunu işaretleyip tekrar kaydedin.</p></div></div>';
    kutu.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /* ---------- Çakışma kontrolü (duzeltmeBul kopyası — sınıfa uyarlanmış) ----------
     1) Öğretmen müsaitlik takvimi: o saatte Sınıf Dersi / Müsait Değil ise uyarı
     2) Öğretmenin aynı saatte birebir dersi varsa uyarı
     3) Öğretmenin aynı saatte başka bir ek dersi varsa uyarı
     4) Sınıfın aynı saatte başka bir ek dersi varsa uyarı
     5) Sınıfın normal toplu ders programı (Sınıf Programı) o saatteyse uyarı   */

  var ekDuzeltmeBul = function (adet) {
    var saatKod = ksKodOf(adet.saat);
    var di = dowIdx(adet.tarih);
    var key = di + "-" + saatKod;
    var uyari = [];
    var ogr = DB.ogretmenler.find(function (t) { return t.id === adet.ogretmenId; });
    if (ogr) {
      var tip = (ogr.avail.sinif && key in ogr.avail.sinif) ? "sinif" : (ogr.avail.musait.indexOf(key) >= 0) ? "musait" : "";
      if (tip === "sinif") uyari.push(ogr.ad + " öğretmeninin o saatte <b>Sınıf Dersi</b> var (" + GUN_KISA[di] + " " + saatEtiket(adet.saat) + ").");
      else if (tip === "musait") uyari.push(ogr.ad + " öğretmeni o saat için <b>Kapalı</b> olarak işaretli.");
      var cakisanBirebir = DB.dersler.find(function (l) {
        return l.ogretmenId === ogr.id && l.tarih === adet.tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal";
      });
      if (cakisanBirebir) uyari.push("Aynı saatte " + ogr.ad + " öğretmeninin <b>" + esc(cakisanBirebir.ogrenciAd) + "</b> ile bir birebir dersi var (" + fmtTR(cakisanBirebir.tarih) + " " + saatEtiket(cakisanBirebir.saat) + ").");
      var cakisanEk = ekDersler().find(function (l) {
        return l.ogretmenId === ogr.id && l.tarih === adet.tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal" && l.id !== (adet.id || "");
      });
      if (cakisanEk) uyari.push("Aynı saatte " + ogr.ad + " öğretmeninin <b>" + esc(cakisanEk.sinif) + "</b> sınıfıyla bir ek dersi var (" + fmtTR(cakisanEk.tarih) + " " + saatEtiket(cakisanEk.saat) + ").");
    }
    var cakisanSinif = ekDersler().find(function (l) {
      return l.sinif === adet.sinif && l.tarih === adet.tarih && ksKodOf(l.saat) === saatKod && l.durum !== "iptal" && l.id !== (adet.id || "");
    });
    if (cakisanSinif) uyari.push("<b>" + esc(adet.sinif) + "</b> sınıfının aynı saatte başka bir ek dersi var (" + fmtTR(cakisanSinif.tarih) + " " + saatEtiket(cakisanSinif.saat) + ").");
    if ((DB.sinifProg[adet.sinif] || []).indexOf(key) >= 0) {
      uyari.push("<b>" + esc(adet.sinif) + "</b> sınıfı o saatte zaten toplu derste (Sınıf Programı).");
    }
    return uyari;
  };

  /* ---------- Planlama (planla kopyası — Öğrenci yerine Sınıf) ---------- */

  var ekPlanla = function () {
    var f = ui.ekForm;
    var sinif = (f.sinif || "").trim();
    var dersId = f.dersId || "";
    var konu = (f.konu || "").trim();
    var ogretmenAd = (f.ogretmen || "").trim();
    var tarih = f.tarih || "";
    var saat = f.saat || "";
    var yoksay = !!f.yoksay;
    var hatalar = [];
    if (!sinif) hatalar.push("Sınıf seçin — listede sınıf yoksa formun altındaki küçük alandan yeni sınıf ekleyin.");
    if (!dersId) hatalar.push("Ders seçin.");
    if (!ogretmenAd) hatalar.push("Öğretmen adı yazın veya hızlı öğretmen seçin.");
    if (!tarih) hatalar.push("Tarih seçin.");
    if (!saat) hatalar.push("Saat seçin.");
    else {
      var k = KISA_KOD.filter(function (x) { return x.b === saat; })[0];
      if (!k) hatalar.push("Ders saati kısa kod saatlerinden biri olmalı (örn. 8 · 15:30-16:10).");
    }
    if (hatalar.length) { ekHataKart(hatalar); return; }
    if (tarih < todayKey()) {
      ekHataKart(["Seçilen tarih geçmişte. Geçmişe ek ders planlamak için listeden dersi düzenleyebilirsiniz."]);
      return;
    }

    /* Sınıf mevcut değilse otomatik kaydet (birebirde yeni öğrenci otomatik kaydediliyordu) */
    if (tumSiniflar().indexOf(sinif) < 0) {
      DB.sinifProg[sinif] = [];
      toast("Yeni sınıf kaydedildi: " + sinif);
    }

    /* Öğretmeni bul / yeni öğretmeni kaydet (birebir ile aynı) */
    var t = DB.ogretmenler.find(function (x) { return kucuk(x.ad) === kucuk(ogretmenAd); });
    if (!t) {
      t = { id: uid(), ad: ogretmenAd, brans: dersId, avail: { sinif: {}, musait: [] } };
      DB.ogretmenler.push(t);
      toast("Yeni öğretmen kaydedildi: " + ogretmenAd);
    }

    var cakisma = ekDuzeltmeBul({ sinif: sinif, ogretmenId: t.id, tarih: tarih, saat: saat, id: ui.ekEditId || "" });
    if (cakisma.length && !yoksay) { ekHataKart(cakisma); return; }
    var kutu = $("ek-cakismaUyari"); if (kutu) kutu.classList.add("hidden");

    if (ui.ekEditId) {
      var mevcut = ekDersler().find(function (x) { return x.id === ui.ekEditId; });
      if (mevcut) {
        mevcut.sinif = sinif; mevcut.dersId = dersId; mevcut.konu = konu;
        mevcut.ogretmenId = t.id; mevcut.ogretmenAd = t.ad;
        mevcut.tarih = tarih; mevcut.saat = saat; mevcut.kod = ksKodOf(saat);
        toast("Ek ders güncellendi ✓");
      }
      ui.ekEditId = null;
    } else {
      ekDersler().push({
        id: uid(), sinif: sinif, dersId: dersId, konu: konu,
        ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
        durum: "planlandi", olusturma: todayKey()
      });
      toast("Ek ders planlandı 🎉 " + sinif + " · " + fmtTR(tarih) + " " + saatEtiket(saat));
    }
    ekTemizleForm();
    ui.anchor = haftaBaslangiciD(tarih);
    yenile();
    var k = $("ek-formKart");
    if (k) k.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /* ---------- Liste aksiyonları (durumTik / duzenle / silOnay kopyaları) ---------- */

  var ekDurumTik = function (id, durum) {
    var l = ekDersler().find(function (x) { return x.id === id; });
    if (!l) return;
    if (l.durum === durum) l.durum = "planlandi";
    else l.durum = durum;
    var ad = durum === "tamamlandi" ? "Ek ders tamamlandı olarak işaretlendi ✓" : durum === "iptal" ? "Ek ders iptal edildi." : "";
    if (ad) toast(ad);
    yenile();
  };

  var ekDuzenle = function (id) {
    var l = ekDersler().find(function (x) { return x.id === id; });
    if (!l) return;
    ui.ekEditId = id;
    ui.ekForm.sinif = l.sinif; ui.ekForm.dersId = l.dersId; ui.ekForm.konu = l.konu || "";
    ui.ekForm.ogretmen = l.ogretmenAd; ui.ekForm.tarih = l.tarih; ui.ekForm.saat = l.saat;
    ui.ekForm.yoksay = false;
    var u = $("ek-cakismaUyari"); if (u) u.classList.add("hidden");
    renderYonetim();
    var k = $("ek-formKart");
    if (k) {
      k.scrollIntoView({ behavior: "smooth", block: "start" });
      k.classList.add("ring-2", "ring-amber-300");
      setTimeout(function () { k.classList.remove("ring-2", "ring-amber-300"); }, 2000);
    }
  };

  var ekSilOnay = function (id) {
    var l = ekDersler().find(function (x) { return x.id === id; });
    if (!l) return;
    var D = DERS[l.dersId] || DERS.tur;
    onayAc({
      baslik: "Ek ders silinsin mi?",
      metin: "<b>" + esc(l.sinif) + "</b> sınıfı · " + D.ad + (l.konu ? " (" + esc(l.konu) + ")" : "") + " · " + fmtTR(l.tarih) + " " + saatEtiket(l.saat) + " kaydı arşivden kaldırılacak.",
      onay: "Evet, Sil", tehlikeli: true
    }, function () {
      DB.ekDersler = ekDersler().filter(function (x) { return x.id !== id; });
      toast("Ek ders silindi.");
      yenile();
    });
  };

  /* ---------- Kopyala (listeMetni / kopyala kopyası) ---------- */

  var ekListeMetni = function () {
    var liste = ekDersler().slice().sort(function (a, b) { return a.tarih === b.tarih ? (a.saat < b.saat ? -1 : 1) : (a.tarih < b.tarih ? -1 : 1); });
    var baslik = "YKS Birebir Takip — Ek Ders Listesi (Sınıflara Atanan)\n" + new Date().toLocaleDateString("tr-TR") + "\n\n";
    if (!liste.length) return baslik + "Ek ders kaydı yok.";
    var satir = liste.map(function (l) {
      var D = DERS[l.dersId] || DERS.tur;
      return fmtTR(l.tarih) + " " + saatEtiket(l.saat) + " | " + l.sinif + " | " + D.ad + " | " + (l.konu || "Genel tekrar") + " | " + l.ogretmenAd + " | " + l.durum;
    }).join("\n");
    return baslik + satir;
  };

  var ekKopyala = function () {
    var metin = ekListeMetni();
    function basarili() { toast("Ek ders listesi kopyalandı ✓"); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(basarili).catch(function () { geciciKopyala(metin, basarili); });
    else geciciKopyala(metin, basarili);
  };

  /* ---------- Sekme içeriği (planKart + ders tablosu kopyası — Sınıf seçimi ile) ---------- */

  var ekDersTab = function () {
    var siniflar = tumSiniflar();
    var duzenlenen = ui.ekEditId ? ekDersler().find(function (x) { return x.id === ui.ekEditId; }) : null;
    if (!duzenlenen && (!ui.ekForm.sinif || siniflar.indexOf(ui.ekForm.sinif) < 0)) ui.ekForm.sinif = siniflar[0] || "";

    var sinifListe = siniflar.slice();
    if (duzenlenen && ui.ekForm.sinif && sinifListe.indexOf(ui.ekForm.sinif) < 0) sinifListe.push(ui.ekForm.sinif);

    var sinifOps = '<option value="" disabled>Sınıf seçin</option>';
    sinifListe.forEach(function (s) { sinifOps += '<option value="' + esc(s) + '"' + (ui.ekForm.sinif === s ? " selected" : "") + ">" + esc(s) + "</option>"; });

    var dersOps = '<option value="" disabled>Ders seçin</option>';
    DERSLER.forEach(function (d) { dersOps += '<option value="' + d.id + '"' + (ui.ekForm.dersId === d.id ? " selected" : "") + ">" + d.ad + "</option>"; });

    var dlT = '<datalist id="dl-ek-ogretmen"><option value=""></option>';
    DB.ogretmenler.forEach(function (t) { dlT += '<option value="' + esc(t.ad) + '"></option>'; });
    dlT += "</datalist>";

    var sayac = {};
    DB.dersler.filter(function (l) { return l.durum !== "iptal"; }).forEach(function (l) {
      sayac[l.ogretmenId || l.ogretmenAd] = (sayac[l.ogretmenId || l.ogretmenAd] || 0) + 1;
    });
    var hizli = DB.ogretmenler.slice().sort(function (a, b) { return (sayac[b.id] || 0) - (sayac[a.id] || 0); }).slice(0, 5);
    var pill = "";
    hizli.forEach(function (t) {
      var seciliMi = kucuk(ui.ekForm.ogretmen) === kucuk(t.ad);
      pill += '<button onclick="ekHizliSec(\'' + esc(t.ad).replace(/'/g, "\\'") + '\')" class="rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-colors ' +
        (seciliMi ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-slate-600") + '">' + esc(t.ad) + "</button>";
    });
    if (!hizli.length) pill = '<span class="text-[11px] text-slate-300 italic">Öğretmen eklemek için Öğretmen Tanımlama sekmesini kullanın</span>';

    var inp = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400";
    var lbl = "text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5";

    var banner = "";
    if (duzenlenen) {
      banner = '<span class="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-[11.5px] font-bold text-amber-700"><i class="fa-solid fa-pen"></i>Ek ders düzenleniyor: ' + esc(duzenlenen.sinif) + " · " + fmtTR(duzenlenen.tarih) + " " + saatEtiket(duzenlenen.saat) + "</span>";
    }

    var form =
      '<div id="ek-formKart" class="rounded-2xl border border-slate-200 bg-white p-5">' +
        '<div class="flex flex-wrap items-center justify-between gap-3 mb-5">' +
          '<div class="flex items-center gap-3">' +
            '<span class="inline-flex items-center gap-2 bg-indigo-600 text-white text-[13px] font-bold rounded-full px-4 py-2 shadow-sm"><i class="fa-solid fa-layer-group"></i> <span id="ek-btnBaslik">' + (duzenlenen ? "Ek Dersi Düzenle" : "Ek Ders Planla") + "</span></span>" +
            banner +
          "</div>" +
          '<span class="text-[11px] text-slate-400 font-medium"><i class="fa-regular fa-clock mr-1"></i>Dersler 40 dakikadır, kısa kod saatlerine göre işler</span>' +
        "</div>" +
        '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">' +
          /* Sınıf (birebirde Öğrenci alanı) */
          '<div class="lg:col-span-1">' +
            '<label class="' + lbl + '"><i class="fa-solid fa-users-rectangle text-teal-500"></i> Sınıf</label>' +
            '<select id="ek-sinif" onchange="ekFormSet(\'sinif\', this.value)" class="' + inp + '">' + sinifOps + "</select>" +
            '<div class="flex gap-1.5 mt-1.5">' +
              '<input id="ek-sinif-yeni" placeholder="Yeni sınıf (örn. 11-B)" autocomplete="off" class="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-teal-400/30" />' +
              '<button onclick="ekSinifEkle()" title="Yeni sınıf ekle" class="text-[10px] font-bold text-teal-600 hover:bg-teal-50 border border-teal-200 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"><i class="fa-solid fa-plus mr-0.5"></i>Ekle</button>' +
            "</div>" +
          "</div>" +
          /* Ders */
          '<div class="lg:col-span-1">' +
            '<label class="' + lbl + '"><i class="fa-solid fa-book-open text-blue-500"></i> Ders</label>' +
            '<select id="ek-ders" onchange="ekFormSet(\'dersId\', this.value)" class="' + inp + '">' + dersOps + "</select>" +
          "</div>" +
          /* Eksik Konu */
          '<div class="lg:col-span-1">' +
            '<label class="' + lbl + '"><i class="fa-solid fa-file-lines text-amber-500"></i> Eksik Konu</label>' +
            '<input id="ek-konu" value="' + esc(ui.ekForm.konu) + '" oninput="ekFormSet(\'konu\', this.value)" placeholder="Konu başlığı (opsiyonel)" autocomplete="off" class="' + inp + '" />' +
          "</div>" +
          /* Öğretmen */
          '<div class="lg:col-span-1">' +
            '<label class="' + lbl + '"><i class="fa-solid fa-chalkboard-user text-violet-500"></i> Öğretmen</label>' +
            '<input id="ek-ogretmen" value="' + esc(ui.ekForm.ogretmen) + '" oninput="ekFormSet(\'ogretmen\', this.value)" list="dl-ek-ogretmen" placeholder="Öğretmen adı" autocomplete="off" class="' + inp + '" />' + dlT +
          "</div>" +
          /* Tarih */
          '<div class="lg:col-span-1">' +
            '<label class="' + lbl + '"><i class="fa-solid fa-calendar-days text-amber-500"></i> Tarih</label>' +
            '<input id="ek-tarih" type="date" value="' + esc(ui.ekForm.tarih) + '" onchange="ekFormSet(\'tarih\', this.value)" oninput="ekFormSet(\'tarih\', this.value)" class="' + inp + '" />' +
            '<div class="flex gap-1 mt-1.5">' +
              '<button onclick="ekBugun()" class="text-[10px] font-semibold text-teal-600 hover:bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 transition-colors">Bugün</button>' +
              '<button onclick="ekYarin()" class="text-[10px] font-semibold text-teal-600 hover:bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 transition-colors">Yarın</button>' +
            "</div>" +
          "</div>" +
          /* Saat */
          '<div class="lg:col-span-1">' +
            '<label class="' + lbl + '"><i class="fa-regular fa-clock text-cyan-500"></i> Ders Saati</label>' +
            '<select id="ek-saat" onchange="ekFormSet(\'saat\', this.value)" class="' + inp + '">' + ksSeceneklerHTML(ui.ekForm.saat) + "</select>" +
          "</div>" +
        "</div>" +
        '<div class="flex flex-wrap items-center justify-between gap-3 mt-4">' +
          '<div class="flex flex-wrap items-center gap-1.5 text-[12px] text-slate-500"><span class="font-semibold mr-1">Hızlı öğretmen:</span><span id="ek-hizliOgr" class="inline-flex flex-wrap gap-1.5">' + pill + "</span></div>" +
          '<label class="inline-flex items-center gap-2 text-[12px] text-slate-500 cursor-pointer select-none"><input id="ek-yoksay" type="checkbox"' + (ui.ekForm.yoksay ? " checked" : "") + ' onchange="ekFormSet(\'yoksay\', this.checked)" class="w-4 h-4 rounded border-slate-300 text-teal-500 accent-teal-500" /><span><b class="text-slate-700">Çakışmayı Yoksay</b> / Ekstra Kontenjan</span></label>' +
        "</div>" +
        '<div class="flex items-end justify-end mt-4 gap-2">' +
          '<button id="ek-btnVazgec" onclick="ekVazgec()" class="' + (duzenlenen ? "" : "hidden ") + 'rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Vazgeç</button>' +
          '<button onclick="ekPlanla()" class="inline-flex items-center gap-2 text-white text-sm font-bold rounded-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-md shadow-indigo-500/30 transition-all hover:shadow-lg hover:-translate-y-px"><i class="fa-solid fa-calendar-plus"></i> <span id="ek-btnPlanYazi">' + (duzenlenen ? "Değişiklikleri Kaydet" : "Ek Dersi Planla") + "</span></button>" +
        "</div>" +
        '<div id="ek-cakismaUyari" class="hidden mt-4"></div>' +
      "</div>";

    /* ---- Ek ders listesi (ders tablosu kopyası — Öğrenci yerine Sınıf) ---- */
    var satirlar = "";
    var liste = ekDersler().slice().sort(function (a, b) { return a.tarih === b.tarih ? (a.saat < b.saat ? -1 : 1) : (a.tarih < b.tarih ? -1 : 1); });
    if (!liste.length) {
      satirlar = '<tr><td colspan="8"><div class="py-12 text-center"><div class="text-3xl mb-2">🗓️</div><p class="text-[13px] font-semibold text-slate-500">Henüz ek ders yok</p><p class="text-[11.5px] text-slate-400 mt-1">Yukarıdaki formdan bir sınıfa ek ders planlayın</p></div></td></tr>';
    }
    liste.forEach(function (l) {
      var D = DERS[l.dersId] || DERS.tur;
      var durum = l.durum || "planlandi";
      var durumEtiket = { planlandi: ["Planlandı", "bg-sky-100 text-sky-700"], tamamlandi: ["Tamamlandı", "bg-emerald-100 text-emerald-700"], iptal: ["İptal", "bg-rose-100 text-rose-500"] }[durum];
      var gunAd = GUN_KISA[dowIdx(l.tarih)];
      satirlar += '<tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">' +
        '<td class="px-4 py-3 whitespace-nowrap"><div class="text-[13px] font-semibold text-slate-700" style="font-variant-numeric:tabular-nums">' + fmtTR(l.tarih) + '</div><div class="text-[10px] text-slate-400 font-semibold">' + gunAd + "</div></td>" +
        '<td class="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap" style="font-variant-numeric:tabular-nums">' + esc(saatEtiket(l.saat)) + "</td>" +
        '<td class="px-4 py-3"><div class="flex items-center gap-2">' + avatar(l.sinif, 0) + '<span class="text-[13px] font-semibold text-slate-700 truncate max-w-[140px]">' + esc(l.sinif) + "</span></div></td>" +
        '<td class="px-4 py-3"><span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ' + D.bg + " " + D.tx + '">' + D.ad + "</span></td>" +
        '<td class="px-4 py-3 text-[12.5px] text-slate-500 max-w-[180px] truncate">' + (l.konu ? esc(l.konu) : '<span class="italic text-slate-300">Genel tekrar</span>') + "</td>" +
        '<td class="px-4 py-3 text-[12.5px] font-semibold text-slate-600 truncate max-w-[140px]">' + esc(l.ogretmenAd) + "</td>" +
        '<td class="px-4 py-3"><div class="flex items-center gap-1">' +
          '<button title="Tamamlandı işaretle" onclick="ekDurumTik(\'' + l.id + '\',\'tamamlandi\')" class="w-7 h-7 rounded-full flex items-center justify-center border transition-colors ' + (durum === "tamamlandi" ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" : "border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-500") + '"><i class="fa-solid fa-check text-[11px]"></i></button>' +
          '<button title="İptal et" onclick="ekDurumTik(\'' + l.id + '\',\'iptal\')" class="w-7 h-7 rounded-full flex items-center justify-center border transition-colors ' + (durum === "iptal" ? "bg-rose-500 border-rose-500 text-white shadow-sm" : "border-slate-200 text-slate-300 hover:border-rose-300 hover:text-rose-400") + '"><i class="fa-solid fa-xmark text-[11px]"></i></button>' +
          '<span class="ml-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold whitespace-nowrap ' + durumEtiket[1] + '">' + durumEtiket[0] + "</span></div></td>" +
        '<td class="px-4 py-3"><div class="flex items-center gap-1">' +
          '<button title="Dersi düzenle" onclick="ekDuzenle(\'' + l.id + '\')" class="w-8 h-8 rounded-full text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"><i class="fa-solid fa-pen text-[12px]"></i></button>' +
          '<button title="Dersi sil" onclick="ekSilOnay(\'' + l.id + '\')" class="w-8 h-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"><i class="fa-solid fa-trash-can text-[12px]"></i></button>' +
          "</div></td></tr>";
    });

    var say1 = liste.filter(function (l) { return l.durum === "planlandi"; }).length;
    var say2 = liste.filter(function (l) { return l.durum === "tamamlandi"; }).length;
    var say3 = liste.filter(function (l) { return l.durum === "iptal"; }).length;

    var tablo =
      '<div class="rounded-2xl border border-slate-200 bg-white overflow-hidden mt-5">' +
        '<div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">' +
          '<div><h3 class="text-[15px] font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-layer-group text-indigo-400"></i> Ek Ders Listesi <span class="text-slate-300 font-semibold text-[12px]">(sınıflara atanan)</span></h3>' +
          '<p class="text-[11.5px] text-slate-400 font-medium">Tüm ek ders arşivi · tarih ve saate göre sıralı</p></div>' +
          '<button onclick="ekKopyala()" class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-600 px-3.5 py-2 transition-colors"><i class="fa-regular fa-copy text-slate-400"></i>Listeyi Kopyala</button>' +
        "</div>" +
        '<div class="overflow-x-auto"><table class="w-full min-w-[900px] text-left border-collapse">' +
          '<thead><tr class="bg-slate-50/80 border-b border-slate-100">' +
            "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Tarih</th>" +
            "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Ders Saati</th>" +
            "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Sınıf</th>" +
            "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Ders</th>" +
            "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Eksik Konu</th>" +
            "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Öğretmen</th>" +
            "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>Durum</th>" +
            "<th class='px-4 py-2.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider'>İşlem</th>" +
          "</tr></thead><tbody>" + satirlar + "</tbody></table></div>" +
        '<div class="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">' +
          liste.length + " ek ders" +
          '<span class="rounded-full bg-sky-100 text-sky-700 px-2 py-0.5">' + say1 + " planlandı</span>" +
          '<span class="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">' + say2 + " tamamlandı</span>" +
          (say3 ? '<span class="rounded-full bg-rose-100 text-rose-500 px-2 py-0.5">' + say3 + " iptal</span>" : "") +
        "</div>" +
      "</div>";

    return form + tablo;
  };

  /* ---------- renderYonetim sarmalayıcı ----------
     Orijinal renderYonetim değiştirilmedi; aynı arayüz 4. sekme
     ("Ek Ders") ile birlikte yeniden çizilir. İçerik, diğer
     sekmelerde orijinal tab fonksiyonlarından aynen gelir.        */

  var __orijinalRenderYonetim = renderYonetim;
  renderYonetim = function () {
    var sekmeler = [
      ["ogretmen", "Öğretmen Tanımlama", "fa-chalkboard-user"],
      ["ogrenci", "Öğrenci & Sınıf", "fa-user-graduate"],
      ["ekders", "Ek Ders", "fa-layer-group"],
      ["ayar", "Ayarlar & Yedekleme", "fa-gear"]
    ];
    var pills = '<div class="flex gap-1.5 bg-slate-100 rounded-full p-1 overflow-x-auto">';
    sekmeler.forEach(function (s) {
      var a = ui.sekme === s[0];
      pills += '<button onclick="sec(\'' + s[0] + '\')" class="flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-[12.5px] font-bold transition-all ' +
        (a ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600") + '"><i class="fa-solid ' + s[2] + '"></i>' + s[1] + "</button>";
    });
    pills += "</div>";
    var icerik = ui.sekme === "ogretmen" ? ogretmenTab() : ui.sekme === "ogrenci" ? ogrenciTab() : ui.sekme === "ekders" ? ekDersTab() : ayarTab();
    $("yonetimBolum").innerHTML = '<div class="kart p-5"><div class="flex flex-wrap items-center justify-between gap-3 mb-5">' +
      '<h2 class="text-[15px] font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-sliders text-slate-300"></i> Veri Yönetimi ve Program Tanımlama</h2>' + pills + "</div>" + icerik + "</div>";
  };

  /* Sekme çubuğunun ilk açılışta da Ek Ders sekmesini göstermesi için yeniden çiz */
  renderYonetim();
}
