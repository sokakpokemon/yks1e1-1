(function () {
  // === ÜST MENÜ TIKLAMA DÜZELTMESİ ===
  function menuTiklama() {
    var butonlar = document.querySelectorAll(".atlama-btn");
    butonlar.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var hedefId = this.getAttribute("data-hedef");
        if (!hedefId) return;
        var hedef = document.getElementById(hedefId);
        if (hedef) {
          hedef.scrollIntoView({ behavior: "smooth", block: "start" });
          // Aktif sınıfını güncelle
          butonlar.forEach(function (b) { b.classList.remove("aktif"); });
          this.classList.add("aktif");
        }
      });
    });
  }

  // Sayfa yüklendiğinde menüyü ve başlığı bağla
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", menuTiklama);
  } else {
    menuTiklama();
  }

  // === TAKİP SEKME BAŞLIĞI EKLE ===
  setTimeout(function() {
    var takipBolum = document.getElementById("takipBolum");
    if (takipBolum && !document.getElementById("__takipBaslikEklendi")) {
      var baslikHTML = '<div class="kart p-5 mb-4" id="__takipBaslikEklendi" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">' +
        '<div style="display:flex; align-items:center; gap:10px;">' +
          '<div style="width:40px; height:40px; border-radius:10px; background:#ccfbf1; display:flex; align-items:center; justify-content:center; font-size:20px;">📋</div>' +
          '<div>' +
            '<h2 style="margin:0; font-size:16px; font-weight:800; color:#0f172a;">Öğrenci Takip Merkezi</h2>' +
            '<p style="margin:2px 0 0; font-size:12px; color:#64748b;">Yoklama, ödev ve kütüphane işlemlerini buradan yönetin.</p>' +
          '</div>' +
        '</div>' +
      '</div>';
      takipBolum.insertAdjacentHTML('afterbegin', baslikHTML);
    }
  }, 150);

  // Kütüphane listesi dosya sonundaki sınıf bazlı modülden gelir; giriş/çıkış
  // saati tutan eski "Tümünü Giriş Yap" bloğu tamamen kaldırıldı.

  // === ALT SEKMELERİ GÜNCELLE ===
  setInterval(function() {
    var btnYoklama = document.querySelector('.takip-alt-btn[data-alt="yoklama"]');
    var btnOdevler = document.querySelector('.takip-alt-btn[data-alt="odevler"]');
    var btnKutuphane = document.querySelector('.takip-alt-btn[data-alt="kutuphane"]');
    
    // İsim değiştirme
    if (btnYoklama && btnYoklama.textContent !== "Ders Yoklaması") {
      btnYoklama.textContent = "Ders Yoklaması";
    }
    
    // Sıra değiştirme: Ödevler'i Ders Yoklaması'nın önüne al
    if (btnYoklama && btnOdevler && btnYoklama.previousElementSibling !== btnOdevler) {
        btnYoklama.parentNode.insertBefore(btnOdevler, btnYoklama);
    }
    
    // Sınav Yoklaması ekleme
    if (btnKutuphane && !document.querySelector('.takip-alt-btn[data-alt="sinav"]')) {
      var btnSinav = document.createElement("button");
      btnSinav.type = "button";
      btnSinav.className = "takip-alt-btn";
      btnSinav.setAttribute("data-alt", "sinav");
      btnSinav.onclick = function() { 
        document.querySelectorAll(".takip-alt-btn").forEach(function(b){ b.classList.remove("aktif"); });
        btnSinav.classList.add("aktif");
        if(window.gosterAlt) window.gosterAlt("sinav"); 
      };
      btnSinav.textContent = "Sınav Yoklaması";
      btnKutuphane.parentNode.insertBefore(btnSinav, btnKutuphane.nextSibling);
    }
    
    // Görüşmeler Butonu Ekle (Sınav Yoklaması ile Analiz arasına)
    if (btnKutuphane && !document.querySelector('.takip-alt-btn[data-alt="gorusmeler"]')) {
      var btnGorusme = document.createElement("button");
      btnGorusme.type = "button";
      btnGorusme.className = "takip-alt-btn";
      btnGorusme.setAttribute("data-alt", "gorusmeler");
      btnGorusme.textContent = "📞 Görüşmeler";
      btnGorusme.onclick = function() {
        document.querySelectorAll(".takip-alt-btn").forEach(function(b){ b.classList.remove("aktif"); });
        btnGorusme.classList.add("aktif");
        if(window.gosterAlt) window.gosterAlt("gorusmeler");
      };
      // Sınav butonunun hemen ardına; yoksa Kütüphane'nin yanına ekle
      var btnSinavKardes = document.querySelector('.takip-alt-btn[data-alt="sinav"]');
      if(btnSinavKardes) btnSinavKardes.parentNode.insertBefore(btnGorusme, btnSinavKardes.nextSibling);
      else btnKutuphane.parentNode.insertBefore(btnGorusme, btnKutuphane.nextSibling);
    }

    // Analiz Butonu Ekle
    if (btnKutuphane && !document.querySelector('.takip-alt-btn[data-alt="analiz"]')) {
      var btnAnaliz = document.createElement("button");
      btnAnaliz.type = "button";
      btnAnaliz.className = "takip-alt-btn";
      btnAnaliz.setAttribute("data-alt", "analiz");
      btnAnaliz.textContent = "📊 Analiz";
      btnAnaliz.onclick = function() {
        document.querySelectorAll(".takip-alt-btn").forEach(function(b){ b.classList.remove("aktif"); });
        btnAnaliz.classList.add("aktif");
        if(window.gosterAlt) window.gosterAlt("analiz");
      };
      // Görüşmeler butonundan hemen sonra (yoksa Sınav'ın, o da yoksa Kütüphane'nin yanına) ekle
      // Sıra: … [Sınav Yoklaması] [📞 Görüşmeler] [📊 Analiz]
      var btnSinavEl = document.querySelector('.takip-alt-btn[data-alt="sinav"]');
      var btnGorusmeEl = document.querySelector('.takip-alt-btn[data-alt="gorusmeler"]');
      if(btnGorusmeEl) btnGorusmeEl.parentNode.insertBefore(btnAnaliz, btnGorusmeEl.nextSibling);
      else if(btnSinavEl) btnSinavEl.parentNode.insertBefore(btnAnaliz, btnSinavEl.nextSibling);
      else btnKutuphane.parentNode.insertBefore(btnAnaliz, btnKutuphane.nextSibling);
    }

    // ÇİFT YEŞİL DÜZELTMESİ: index.html'in kendi gosterAlt'ı, sayfa yüklendikten sonra
    // eklenen sınav butonunu listesinde (altButonlar) tutmadığı için diğer alt sekmelere
    // tıklanınca "Sınav Yoklaması" yeşil kalıyordu; burada elle temizlenir (idempotent).
    var btnSinavMevcut = document.querySelector('.takip-alt-btn[data-alt="sinav"]');
    if (btnSinavMevcut) {
      document.querySelectorAll('.takip-alt-btn:not([data-alt="sinav"])').forEach(function(b) {
        if (b.__sinavAktifTemiz) return;
        b.__sinavAktifTemiz = true;
        b.addEventListener("click", function() { btnSinavMevcut.classList.remove("aktif"); });
      });
    }

    // Aynı neden Görüşmeler butonu için de geçerli: index.html'in altButonlar listesinde
    // olmadığı için başka bir sekmeye geçilince yeşil kalırdı; burada elle temizlenir.
    var btnGorusmeMevcut = document.querySelector('.takip-alt-btn[data-alt="gorusmeler"]');
    if (btnGorusmeMevcut) {
      document.querySelectorAll('.takip-alt-btn:not([data-alt="gorusmeler"])').forEach(function(b) {
        if (b.__gorusmeAktifTemiz) return;
        b.__gorusmeAktifTemiz = true;
        b.addEventListener("click", function() { btnGorusmeMevcut.classList.remove("aktif"); });
      });
    }
  }, 200);

  window.gosterAlt = function (alt) {
    var btn = document.querySelectorAll(".takip-alt-btn");
    btn.forEach(function (b) { 
        if (b.getAttribute("data-alt") === alt) {
            b.classList.add("aktif"); 
        } else {
            b.classList.remove("aktif"); 
        }
    });
    var icerik = document.getElementById("takipIcerik"); if (!icerik) return;
    if (alt === "yoklama") icerik.innerHTML = window.__sysYoklamaEkran();
    else if (alt === "odevler") icerik.innerHTML = window.__sysOdevEkran();
    else if (alt === "kutuphane") icerik.innerHTML = window.__sysKutuphaneEkran();
    else if (alt === "sinav") icerik.innerHTML = window.__sysSinavEkran();
    else if (alt === "analiz") icerik.innerHTML = window.__sysAnalizEkran();
    else if (alt === "gorusmeler") icerik.innerHTML = window.__sysGorusmelerEkran();
  };

  // === SINAV YOKLAMASI (BAĞIMSIZ MODÜL) ===
  var sinavSeciliTarih = null;
  var sinavSeciliSinif = null;
  var sinavDURUMLAR = ["girdi", "girmedi"];
  var sinavRENKLER = { 
    girdi: { bg: "#22c55e", label: "Girdi" }, 
    girmedi: { bg: "#ef4444", label: "Girmedi" } 
  };

  function sinavVeriOku() {
    try { return JSON.parse(localStorage.getItem("yksOto_arsiv_v1") || "{}"); } catch(e) { return {}; }
  }
  function sinavVeriYaz(v) { localStorage.setItem("yksOto_arsiv_v1", JSON.stringify(v)); }
  function sinavBugunKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  }
  function sinavEsc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
    });
  }
  function sinavTarihGunIdx(tarih) {
    var p = tarih.split("-");
    var d = new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]));
    return (d.getDay() + 6) % 7;
  }
  function sinavOGunSiniflar(tarih) {
    var veri = sinavVeriOku();
    var prog = veri.sinifProg || {};
    var gunIdx = sinavTarihGunIdx(tarih);
    var sonuc = [];
    Object.keys(prog).forEach(function(sinifAd) {
      var slotlar = prog[sinifAd];
      if (!Array.isArray(slotlar)) return;
      if (slotlar.some(function(s){ return String(s).indexOf(gunIdx+"-") === 0; })) sonuc.push(sinifAd);
    });
    return sonuc.sort();
  }
  function sinavSinifOgrencileri(sinifAd) {
    var veri = sinavVeriOku();
    return (veri.ogrenciler || []).filter(function(o){ return o.sinif === sinifAd; });
  }
  function sinavGetY(veri, tarih, sinifAd, ogrId) {
    try { return veri.sinavYoklamalari[tarih][sinifAd][ogrId] || null; } catch(e) { return null; }
  }
  function sinavSetY(tarih, sinifAd, ogrId, durum, aciklama) {
    var veri = sinavVeriOku();
    if (!veri.sinavYoklamalari) veri.sinavYoklamalari = {};
    if (!veri.sinavYoklamalari[tarih]) veri.sinavYoklamalari[tarih] = {};
    if (!veri.sinavYoklamalari[tarih][sinifAd]) veri.sinavYoklamalari[tarih][sinifAd] = {};
    if (!durum) {
      delete veri.sinavYoklamalari[tarih][sinifAd][ogrId];
    } else if (durum === "girmedi" && aciklama) {
      veri.sinavYoklamalari[tarih][sinifAd][ogrId] = { durum: durum, aciklama: aciklama };
    } else {
      veri.sinavYoklamalari[tarih][sinifAd][ogrId] = durum;
    }
    sinavVeriYaz(veri);
  }
  function sinavDStr(y) { if (!y) return ""; return typeof y === 'string' ? y : (y.durum || ""); }
  function sinavDAcik(y) { if (!y || typeof y === 'string') return ""; return y.aciklama || ""; }
  function sinavOgrAd(ogr) {
    return ogr.adSoyad || (ogr.ad && ogr.soyad ? ogr.ad + ' ' + ogr.soyad : '') || ogr.ad || ogr.isim || 'Öğrenci';
  }
  function sinavChipHTML(ogr, y) {
    var d = sinavDStr(y);
    var acik = sinavDAcik(y);
    var stil = d 
      ? 'background:' + sinavRENKLER[d].bg + ';color:#fff;border-color:' + sinavRENKLER[d].bg + ';' 
      : 'background:#fff;color:#475569;border-color:#cbd5e1;';
    var h = '<button type="button" class="rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors" style="' + stil + '" onclick="window.__sinavChip(\'' + ogr.id + '\')">' 
      + sinavEsc(sinavOgrAd(ogr)) + (d ? ' · ' + sinavRENKLER[d].label : '') + '</button>';
    if (d === "girmedi") {
      h += '<button type="button" class="rounded-full border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-600" onclick="window.__sinavNot(\'' + ogr.id + '\')">📝' 
        + (acik ? '<span class="ml-1">' + sinavEsc(acik) + '</span>' : '') + '</button>';
    }
    return h;
  }

  window.__sysSinavEkran = function () {
    if (!sinavSeciliTarih) sinavSeciliTarih = sinavBugunKey();
    var tarih = sinavSeciliTarih;
    var html = '<div class="flex flex-wrap items-center gap-2 mb-4">' +
      '<label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sınav Tarihi:</label>' +
      '<input type="date" id="sinavTarih" value="' + tarih + '" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/40" onchange="window.__sinavTarih(this.value)" /></div>';
    
    var siniflar = sinavOGunSiniflar(tarih);
    if (!siniflar.length) {
      return html + '<div class="rounded-xl border border-slate-200 bg-white p-6 text-center"><p class="text-slate-500 text-[14px] font-medium">Bu tarihte sınavı olan sınıf yok.</p></div>';
    }
    if (!sinavSeciliSinif || siniflar.indexOf(sinavSeciliSinif) === -1) sinavSeciliSinif = siniflar[0];
    window.__sinavSeciliSinif = sinavSeciliSinif; /* TOPLU MESAJ: aktif sınıf global'e yansıtılır */
    
    html += '<div class="flex flex-wrap gap-2 mb-4">';
    siniflar.forEach(function (s) {
      var a = s === sinavSeciliSinif;
      var st = a ? 'background:#14b8a6;color:#fff;border-color:#14b8a6;' : 'background:#fff;color:#0f766e;border-color:#99f6e4;';
      html += '<button type="button" class="rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors" style="' + st + '" onclick="window.__sinavSinif(\'' + s + '\')">' + sinavEsc(s) + '</button>';
    });
    html += '</div>';
    
    var ogrenciler = sinavSinifOgrencileri(sinavSeciliSinif);
    var veri = sinavVeriOku();
    
    html += '<div class="rounded-xl border border-slate-200 bg-white p-4">';
    html += '<div class="flex flex-wrap items-center justify-between gap-2 mb-3"><div class="font-bold text-slate-800 text-[14px]">' + sinavEsc(sinavSeciliSinif) + ' — ' + ogrenciler.length + ' öğrenci</div>' +
      '<button type="button" class="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-bold text-teal-700 hover:bg-teal-100" onclick="window.__sinavTumu()">Tümü Girdi</button></div>';
    
    if (!ogrenciler.length) {
      html += '<p class="text-slate-500 text-[13px]">Bu sınıfta kayıtlı öğrenci yok.</p>';
    } else {
      html += '<div class="flex flex-wrap gap-2">';
      ogrenciler.forEach(function (ogr) { html += sinavChipHTML(ogr, sinavGetY(veri, tarih, sinavSeciliSinif, ogr.id)); });
      html += '</div>';
    }
    html += '</div>';
    return html;
  };

  window.__sinavTarih = function (v) { sinavSeciliTarih = v; sinavSeciliSinif = null; window.gosterAlt("sinav"); };
  window.__sinavSinif = function (s) { sinavSeciliSinif = s; window.gosterAlt("sinav"); };
  window.__sinavChip = function (ogrId) {
    var veri = sinavVeriOku();
    var y = sinavGetY(veri, sinavSeciliTarih, sinavSeciliSinif, ogrId);
    var d = sinavDStr(y);
    var idx = sinavDURUMLAR.indexOf(d);
    var yeni = idx === -1 ? sinavDURUMLAR[0] : (idx === sinavDURUMLAR.length - 1 ? "" : sinavDURUMLAR[idx + 1]);
    sinavSetY(sinavSeciliTarih, sinavSeciliSinif, ogrId, yeni, sinavDAcik(y));
    window.gosterAlt("sinav");
  };
  window.__sinavNot = function (ogrId) {
    var veri = sinavVeriOku();
    var y = sinavGetY(veri, sinavSeciliTarih, sinavSeciliSinif, ogrId);
    var yeni = prompt("Girmedi açıklaması:", sinavDAcik(y) || "");
    if (yeni === null) return;
    sinavSetY(sinavSeciliTarih, sinavSeciliSinif, ogrId, "girmedi", yeni.trim());
    window.gosterAlt("sinav");
  };
  window.__sinavTumu = function () {
    sinavSinifOgrencileri(sinavSeciliSinif).forEach(function (ogr) {
      sinavSetY(sinavSeciliTarih, sinavSeciliSinif, ogr.id, "girdi");
    });
    window.gosterAlt("sinav");
  };

  // === WHATSAPP TASLAK VE GÖNDERİM SİSTEMİ ===
  // Taslak kategorileri ve her kategorinin olumlu/olumsuz durum anahtarları
  var __waTaslakKategorileri = ["yoklama", "odev", "kutuphane", "sinav", "birebir"];
  var __waTaslakSekmeAdlari = {
    yoklama: "Ders Yoklaması",
    odev: "Ödev",
    kutuphane: "Kütüphane",
    sinav: "Sınav",
    birebir: "Birebir Ders Planı"
  };
  var __waTaslakDurumlari = {
    yoklama: ["geldi", "gelmedi", "gec"],
    odev: ["yapildi", "yapmadi", "eksik", "gec"],
    kutuphane: ["geldi", "gelmedi", "gec"],
    sinav: ["girdi", "girmedi"],
    birebir: ["plan"]
  };
  var __waTaslakDurumAdlari = {
    yoklama: { geldi: "✅ Geldi", gelmedi: "❌ Gelmedi", gec: "⏰ Geç Kaldı" },
    odev: { yapildi: "✅ Yapıldı", yapmadi: "❌ Yapmadı", eksik: "⚠️ Eksik", gec: "⏰ Geç Teslim" },
    kutuphane: { geldi: "✅ Geldi", gelmedi: "❌ Gelmedi", gec: "⏰ Geç Kaldı" },
    sinav: { girdi: "✅ Girdi", girmedi: "❌ Girmedi" },
    birebir: { plan: "Ders Planı Bildirimi" }
  };

  var varsayilanTaslaklar = {
    yoklama: {
      geldi: "Sayın Veli, öğrenciniz {ad} bugünkü {sinif} sınıfı dersine katılmıştır. Başarılar dileriz.",
      gelmedi: "Sayın Veli, öğrenciniz {ad} bugünkü {sinif} sınıfı dersine katılmamıştır. Bilgilerinize sunarız.",
      gec: "Sayın Veli, öğrenciniz {ad} bugünkü {sinif} sınıfı dersine geç katılmıştır. Bilgilerinize sunarız."
    },
    odev: {
      yapildi: "Sayın Veli, öğrenciniz {ad}'ın {ders} dersinden aldığı ödevi başarıyla tamamlamıştır. Tebrik ederiz!",
      yapmadi: "Sayın Veli, öğrenciniz {ad}'ın {ders} dersinden aldığı ödevi yapmadığı tespit edilmiştir. Bilgilerinize sunarız.",
      eksik: "Sayın Veli, öğrenciniz {ad}'ın {ders} dersinden aldığı ödevi eksik yaptığı tespit edilmiştir. Bilgilerinize sunarız.",
      gec: "Sayın Veli, öğrenciniz {ad}'ın {ders} dersinden aldığı ödevi geç teslim ettiği tespit edilmiştir. Bilgilerinize sunarız."
    },
    kutuphane: {
      geldi: "Sayın Veli, öğrenciniz {ad} bugünkü kütüphane çalışmasına katılmıştır. Başarılar dileriz.",
      gelmedi: "Sayın Veli, öğrenciniz {ad} bugünkü kütüphane çalışmasına katılmamıştır. Bilgilerinize sunarız.",
      gec: "Sayın Veli, öğrenciniz {ad} bugünkü kütüphane çalışmasına geç katılmıştır. Bilgilerinize sunarız."
    },
    sinav: {
      girdi: "Sayın Veli, öğrenciniz {ad} bugünkü sınava girmiştir. Başarılar dileriz.",
      girmedi: "Sayın Veli, öğrenciniz {ad} bugünkü sınava girmemiştir. Bilgilerinize sunarız."
    },
    /* BIREBIR-TASLAK: tek durum (plan) — {ad}, {sinif}, {dersler} doldurulur. */
    birebir: {
      plan: "Değerli öğrencimiz {ad},\n\nBirebir ders programın aşağıdaki gibidir:\n\n{dersler}\n\nBu dersler, eksiklerini tamamlaman ve hedeflerine biraz daha yaklaşman için planlandı.\nDers saatinden birkaç dakika önce hazır olman yeterli. Anlamadığın veya zorlandığın konuları öğretmeninle paylaşmayı unutma.\nSen çalışmaya devam et, biz de bu süreçte yanında olalım.\nGüzel çalışmalar, başarılar dileriz.\n— FORMÜL KURS REHBERLİK SERVİSİ"
    }
  };

  function __waOlumsuzDurum(kat) {
    return kat === "odev" ? "yapmadi" : kat === "sinav" ? "girmedi" : "gelmedi";
  }

  function taslakOku() {
    var kayit = {};
    try { kayit = JSON.parse(localStorage.getItem("yksOto_taslaklar") || "{}") || {}; } catch(e) { kayit = {}; }
    var t = {};
    __waTaslakKategorileri.forEach(function (kat) {
      var varsayilan = varsayilanTaslaklar[kat] || {};
      var kayitli = kayit[kat];
      t[kat] = {};
      // Eski sürümde her kategori tek bir düz metin olarak saklanıyordu → olumsuz duruma taşınır.
      if (typeof kayitli === "string") t[kat][__waOlumsuzDurum(kat)] = kayitli;
      else if (kayitli && typeof kayitli === "object") {
        Object.keys(kayitli).forEach(function (durum) {
          t[kat][durum] = String(kayitli[durum] == null ? "" : kayitli[durum]);
        });
      }
      __waTaslakDurumlari[kat].forEach(function (durum) {
        if (typeof t[kat][durum] !== "string") t[kat][durum] = varsayilan[durum] || "";
      });
    });
    return t;
  }
  function taslakYaz(t) { localStorage.setItem("yksOto_taslaklar", JSON.stringify(t)); }
  /* D66-BIREBIR-WA: birebir WhatsApp sarmalaması yeni taslak sistemini kullanabilsin diye dışa açılır.
     (app.js'e dokunulmaz; taslaklar yalnız bu dosyada yönetilir.) */
  window.taslakOku = taslakOku;

  var __waTaslakGecici = null;

  function __waTaslakEsc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function __waTaslakSekmelerHTML() {
    var aktif = window.__waTaslakAktifSekme || "yoklama";
    var html = "";
    __waTaslakKategorileri.forEach(function (kat) {
      var secili = kat === aktif;
      html += '<button type="button" onclick="window.__waTaslakSekme(\'' + kat + '\')" style="border:1px solid ' + (secili ? "#14b8a6" : "#cbd5e1") + ';background:' + (secili ? "#14b8a6" : "#fff") + ';color:' + (secili ? "#fff" : "#475569") + ';padding:7px 11px;border-radius:99px;font-size:12px;font-weight:700;cursor:pointer;">' + __waTaslakSekmeAdlari[kat] + '</button>';
    });
    return html;
  }

  // Sekmedeki textarea değerlerini toplar; sekme değişiminde kaydedilmemiş düzenlemeler korunur.
  function __waTaslakDegerleriTopla() {
    var t = __waTaslakGecici || taslakOku();
    __waTaslakKategorileri.forEach(function (kat) {
      __waTaslakDurumlari[kat].forEach(function (durum) {
        var el = document.getElementById("__t_" + kat + "_" + durum);
        if (el) t[kat][durum] = el.value;
      });
    });
    return t;
  }

  function __waTaslakCiz() {
    var kat = window.__waTaslakAktifSekme || "yoklama";
    var t = __waTaslakDegerleriTopla();
    __waTaslakGecici = t;
    var govde = document.getElementById("__waTaslakGovde");
    if (!govde) return;
    var html;
    /* BIREBIR-TASLAK: bu sekmede tek uzun textarea (plan) + {dersler} değişkeni notu. */
    if (kat === "birebir") {
      html = '<div style="font-size:11px;color:#64748b;margin-bottom:12px;">Değişkenler: {ad} (Öğrenci Adı), {sinif}, {dersler} (ders listesi). Bu değişkenler gönderim anında otomatik doldurulur.</div>' +
        '<label style="display:block;font-size:11px;font-weight:700;color:#0f766e;margin-bottom:4px;">' + __waTaslakDurumAdlari.birebir.plan + '</label>' +
        '<textarea id="__t_birebir_plan" style="width:100%;height:200px;margin-bottom:10px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-family:inherit;font-size:12px;resize:vertical;">' + __waTaslakEsc((t.birebir && t.birebir.plan) || "") + '</textarea>';
    } else {
      html = '<div style="font-size:11px;color:#64748b;margin-bottom:12px;">Değişkenler: {ad} (Öğrenci Adı), {sinif}, {ders}. Bu değişkenler gönderim anında otomatik doldurulur.</div>';
      __waTaslakDurumlari[kat].forEach(function (durum) {
        html += '<label style="display:block;font-size:11px;font-weight:700;color:#0f766e;margin-bottom:4px;">' + __waTaslakDurumAdlari[kat][durum] + '</label>' +
          '<textarea id="__t_' + kat + '_' + durum + '" style="width:100%;height:64px;margin-bottom:10px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-family:inherit;font-size:12px;resize:vertical;">' + __waTaslakEsc(t[kat][durum]) + '</textarea>';
      });
    }
    govde.innerHTML = html;
  }

  window.__waTaslakModal = function() {
    var eski = document.getElementById("__waTaslakOverlay");
    if (eski) eski.remove();
    __waTaslakGecici = null;
    window.__waTaslakAktifSekme = "yoklama";

    var html = '<div style="font-family:system-ui;padding:6px;">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:12px;color:#0f172a;">📱 WhatsApp Mesaj Taslakları</div>' +
      '<div id="__waTaslakSekmeler" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">' + __waTaslakSekmelerHTML() + '</div>' +
      '<div id="__waTaslakGovde"></div>' +
      '<button type="button" onclick="window.__waTaslakKaydet()" style="width:100%;background:#14b8a6;color:#fff;padding:10px;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-bottom:6px;">💾 Taslakları Kaydet</button>' +
      '<button type="button" onclick="document.getElementById(\'__waTaslakOverlay\').remove()" style="width:100%;background:#f1f5f9;color:#64748b;padding:10px;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Kapat</button>' +
    '</div>';

    var ov = document.createElement("div");
    ov.id = "__waTaslakOverlay";
    ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";
    var k = document.createElement("div");
    k.style.cssText = "background:#fff;border-radius:16px;padding:20px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);";
    k.innerHTML = html;
    ov.appendChild(k);
    document.body.appendChild(ov);
    __waTaslakCiz();
  };

  window.__waTaslakSekme = function(kat) {
    if (__waTaslakKategorileri.indexOf(kat) === -1) return;
    __waTaslakGecici = __waTaslakDegerleriTopla();
    window.__waTaslakAktifSekme = kat;
    var sekmeler = document.getElementById("__waTaslakSekmeler");
    if (sekmeler) sekmeler.innerHTML = __waTaslakSekmelerHTML();
    __waTaslakCiz();
  };

  window.__waTaslakKaydet = function() {
    var t = __waTaslakDegerleriTopla();
    /* BIREBIR-TASLAK: birebir sekmesi açıkken tek textarea'dan okunur (diğer sekmelerde dokunulmaz). */
    var birebirEl = document.getElementById("__t_birebir_plan");
    if (birebirEl) t.birebir = { plan: birebirEl.value };
    __waTaslakKategorileri.forEach(function (kat) {
      __waTaslakDurumlari[kat].forEach(function (durum) {
        if (typeof t[kat][durum] !== "string") t[kat][durum] = varsayilanTaslaklar[kat][durum] || "";
      });
    });
    taslakYaz(t);
    __waTaslakGecici = null;
    alert("✅ Taslaklar başarıyla kaydedildi.");
    var ov = document.getElementById("__waTaslakOverlay");
    if (ov) ov.remove();
  };

  window.__waGonder = function(ogrId, tip, dersAdi) {
    // veriOku index.html'in IIFE içinde kaldığı için bu dosyada erişilemez;
    // aynı localStorage anahtarını (yksOto_arsiv_v1) okuyan sinavVeriOku kullanılır.
    var veri = (typeof veriOku === "function") ? veriOku() : sinavVeriOku();
    var ogr = (veri.ogrenciler || []).filter(function(o){ return o.id === ogrId; })[0];
    if(!ogr) return alert("Öğrenci bulunamadı.");

    var tel = ogr.veliTelefon || ogr.veliTel || ogr.veliTelefonu || ogr.anneTel || ogr.babaTel || "";
    tel = String(tel).replace(/\D/g, ""); // Sadece rakamlar
    if(tel.length === 10 && tel.startsWith("5")) tel = "90" + tel;
    else if(tel.length === 11 && tel.startsWith("05")) tel = "9" + tel;
    
    if(tel.length < 10) return alert("Veli telefon numarası geçersiz veya eksik: " + tel);

    var t = taslakOku();
    var mesaj = (t[tip] && t[tip][__waOlumsuzDurum(tip)]) || "";
    mesaj = mesaj.replace(/{ad}/g, (ogr.adSoyad || ogr.ad || "Öğrenci"))
                 .replace(/{sinif}/g, (ogr.sinif || ""))
                 .replace(/{ders}/g, (dersAdi || ""));

    var url = "https://wa.me/" + tel + "?text=" + encodeURIComponent(mesaj);
    window.open(url, "_blank");
  };

  // Taslak butonunu Takip başlığına ekle
  setInterval(function(){
    var header = document.getElementById("__takipBaslikEklendi");
    if(header && !document.getElementById("__waTaslakBtn")) {
      var btn = document.createElement("button");
      btn.id = "__waTaslakBtn";
      btn.innerHTML = "⚙️ Mesaj Taslakları";
      btn.style.cssText = "position:absolute;right:16px;top:16px;background:#f8fafc;border:1px solid #e2e8f0;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;color:#475569;cursor:pointer;z-index:5;";
      btn.onclick = window.__waTaslakModal;
      header.style.position = "relative"; // butonun konumlanması için
      header.appendChild(btn);
    }
  }, 500);

  // === ESKİ "WhatsApp Mesaj Şablonu" PANELİ → MESAJ TASLAKLARI YÖNLENDİRMESİ ===
  // Ayarlar & Yedekleme sekmesindeki eski kart (app.js › waSablonKartHTML) gizlenir;
  // yerine Takip sekmesindeki yeni "Mesaj Taslakları" modalını açan bir kart konur.
  // DİKKAT: eski kartın kapsayıcısı .kart DEĞİL — <div class="rounded-2xl border border-slate-100 p-5 mb-4">.
  // Bu kart, ayarlar grid'inin doğrudan çocuğudur; parentNode.parentNode tüm ayar
  // bölümünü gizlerdi. Bu yüzden kapsayıcı, kartın kendi alanlarından (textarea/buton) çözülür.
  function __eskiSablonKartiBul() {
    var basliklar = document.querySelectorAll("h1, h2, h3, h4, h5, div, span");
    for (var i = 0; i < basliklar.length; i++) {
      if (basliklar[i].textContent && basliklar[i].textContent.trim() === "WhatsApp Mesaj Şablonu") {
        return basliklar[i];
      }
    }
    return null;
  }

  function __eskiSablonKapsayici(baslik) {
    var dugum = baslik;
    for (var adim = 0; dugum && adim < 6; adim++) {
      if (dugum.querySelector &&
          dugum.querySelector("#wa-sablon-baslik, #wa-sablon-giris, button[onclick*='waSablonKaydet']")) {
        return dugum;
      }
      dugum = dugum.parentNode;
    }
    return baslik.parentNode;
  }

  setInterval(function() {
    var eskiPanelBasligi = __eskiSablonKartiBul();
    if (!eskiPanelBasligi) return;

    var eskiKart = __eskiSablonKapsayici(eskiPanelBasligi);
    if (!eskiKart || !eskiKart.parentNode) return;

    // Eski kartı gizle
    eskiKart.style.display = "none";

    // Yönlendirme kartı zaten varsa tekrar ekleme
    if (document.getElementById("__yeniMesajTaslakYonlendirme")) return;

    var yeniKart = document.createElement("div");
    yeniKart.id = "__yeniMesajTaslakYonlendirme";
    yeniKart.className = "kart p-5";
    yeniKart.style.cssText = "background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin-top:16px;";
    yeniKart.innerHTML =
      '<div style="display:flex; align-items:flex-start; gap:16px;">' +
        '<div style="flex-shrink:0; width:48px; height:48px; border-radius:12px; background:#ccfbf1; display:flex; align-items:center; justify-content:center; font-size:24px;">📱</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:6px;">WhatsApp Mesaj Taslakları</div>' +
          '<div style="font-size:13px; color:#475569; line-height:1.5; margin-bottom:14px;">' +
            'Mesaj şablonlarını düzenlemek için artık <b>Takip</b> sekmesindeki ' +
            '<b>⚙️ Mesaj Taslakları</b> butonunu kullanın. Her durum (Geldi/Gelmedi/Yapıldı/Eksik/Geç) için ayrı taslak oluşturabilirsiniz.' +
          '</div>' +
          '<button type="button" onclick="window.__eskiTaslakPaneliniAc()" ' +
            'style="background:#14b8a6; color:#fff; padding:10px 20px; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px;">' +
            '⚙️ Mesaj Taslaklarını Aç' +
          '</button>' +
        '</div>' +
      '</div>';

    eskiKart.parentNode.insertBefore(yeniKart, eskiKart.nextSibling);
  }, 500);

  // Yönlendirme butonu: Takip sekmesine geç, ardından yeni taslak modalını aç.
  window.__eskiTaslakPaneliniAc = function() {
    var takipBtn = document.querySelector('.atlama-btn[data-hedef="takipBolum"]');
    if (takipBtn) takipBtn.click();

    setTimeout(function() {
      if (typeof window.__waTaslakModal === "function") {
        window.__waTaslakModal();
      }
    }, 300);
  };

  // === TOPLU WHATSAPP MESAJ SİSTEMİ ===
  // Not: Öğrenci başına tekil WhatsApp butonları (yoklama çip enjektörü + sınav çipindeki 📱)
  // kaldırıldı; her sekme için tek "📱 Toplu Mesaj" butonu kullanılır.
  function __waDerin(kok, a, b) {
    try { return (kok && kok[a] && kok[a][b]) || {}; } catch (e) { return {}; }
  }
  function __waTarihBul(tip) {
    var id = tip === "yoklama" ? "yoklamaTarih" : tip === "sinav" ? "sinavTarih" : tip === "kutuphane" ? "__ktTarihInput" : "";
    var inp = id ? document.getElementById(id) : null;
    if (inp && inp.value) return inp.value;
    return new Date().toISOString().slice(0,10);
  }
  function __waYoklamaSinifi() {
    // index.html'in seciliSinif değişkeni bu dosyanın kapsamı dışında → DOM'dan aktif sınıf rozeti okunur
    var btnler = document.querySelectorAll('#takipIcerik button[onclick*="__ykSinif"]');
    for (var i = 0; i < btnler.length; i++) {
      if ((btnler[i].getAttribute("style") || "").indexOf("#14b8a6") !== -1) {
        var m = (btnler[i].getAttribute("onclick") || "").match(/__ykSinif\('([^']+)'\)/);
        if (m) return m[1];
      }
    }
    return "";
  }

  // === TOPLU MESAJ FİLTRESİ ===
  // Kategori → olası durumlar. "olumlu" olanlar varsayılan görünümde gizlenir.
  var __waTopluDurumlar = {
    yoklama: [
      { kod: "gelmedi", etiket: "❌ Gelmedi", olumlu: false },
      { kod: "gec", etiket: "⏰ Geç", olumlu: false },
      { kod: "geldi", etiket: "✅ Geldi", olumlu: true }
    ],
    odevler: [
      { kod: "yapmadi", etiket: "❌ Yapmadı", olumlu: false },
      { kod: "eksik", etiket: "⚠️ Eksik", olumlu: false },
      { kod: "gec", etiket: "⏰ Geç", olumlu: false },
      { kod: "yapildi", etiket: "✅ Yaptı", olumlu: true }
    ],
    kutuphane: [
      { kod: "gelmedi", etiket: "❌ Gelmedi", olumlu: false },
      { kod: "gec", etiket: "⏰ Geç", olumlu: false },
      { kod: "geldi", etiket: "✅ Geldi", olumlu: true }
    ],
    sinav: [
      { kod: "girmedi", etiket: "❌ Girmedi", olumlu: false },
      { kod: "girdi", etiket: "✅ Girdi", olumlu: true }
    ]
  };

  function __waKtDurum(v) {
    if (v === "geldi" || v === "gelmedi" || v === "gec") return v;
    if (v && typeof v === "object" && v.giris) return "geldi";
    return "";
  }

  function __waKayit(veri, tip, id, sinifAd, durumKod, ders) {
    var durumlar = __waTopluDurumlar[tip] || [];
    var meta = null;
    for (var i = 0; i < durumlar.length; i++) if (durumlar[i].kod === durumKod) { meta = durumlar[i]; break; }
    var ogrenciler = veri.ogrenciler || [];
    var ogr = null;
    for (var j = 0; j < ogrenciler.length; j++) if (ogrenciler[j].id === id) { ogr = ogrenciler[j]; break; }
    return {
      id: id,
      sinifAd: sinifAd || (ogr && ogr.sinif) || "-",
      durumKod: durumKod,
      durumEtiket: meta ? meta.etiket : durumKod,
      olumlu: meta ? !!meta.olumlu : false,
      ders: ders || ""
    };
  }

  window.__waTopluModal = function(tip) {
    var veri = (typeof veriOku === "function") ? veriOku() : sinavVeriOku();
    var tarih = new Date().toISOString().slice(0,10);
    var tId = tip === "yoklama" ? "yoklamaTarih" : tip === "sinav" ? "sinavTarih" : tip === "kutuphane" ? "__ktTarihInput" : "";
    var tInput = tId ? document.getElementById(tId) : null;
    if (tInput && tInput.value) tarih = tInput.value;

    var liste = [];

    // 1. DERS YOKLAMASI (Tüm sınıflar, tüm durumlar)
    if (tip === "yoklama") {
        var tumYoklamalar = (veri.yoklamalar && veri.yoklamalar[tarih]) ? veri.yoklamalar[tarih] : {};
        Object.keys(tumYoklamalar).forEach(function(sinifAd) {
            var sinifYok = tumYoklamalar[sinifAd] || {};
            Object.keys(sinifYok).forEach(function(id) {
                var kayit = sinifYok[id];
                var d = typeof kayit === 'string' ? kayit : (kayit && kayit.durum) || "";
                if (d === "geldi" || d === "gelmedi" || d === "gec") liste.push(__waKayit(veri, tip, id, sinifAd, d, ""));
            });
        });
    }
    // 2. SINAV YOKLAMASI (Tüm sınıflar, tüm durumlar)
    else if (tip === "sinav") {
        var tumSinavlar = (veri.sinavYoklamalari && veri.sinavYoklamalari[tarih]) ? veri.sinavYoklamalari[tarih] : {};
        Object.keys(tumSinavlar).forEach(function(sinifAd) {
            var sinifSnv = tumSinavlar[sinifAd] || {};
            Object.keys(sinifSnv).forEach(function(id) {
                var kayit = sinifSnv[id];
                var d = typeof kayit === 'string' ? kayit : (kayit && kayit.durum) || "";
                if (d === "girdi" || d === "girmedi") liste.push(__waKayit(veri, tip, id, sinifAd, d, ""));
            });
        });
    }
    // 3. KÜTÜPHANE (Genel tarama, kütüphane verisinde sınıf yok)
    else if (tip === "kutuphane") {
        var tumKt = (veri.kutuphane && veri.kutuphane[tarih]) ? veri.kutuphane[tarih] : {};
        Object.keys(tumKt).forEach(function(id) {
            var d = __waKtDurum(tumKt[id]);
            if (!d) return;
            liste.push(__waKayit(veri, tip, id, "", d, ""));
        });
    }
    // 4. ÖDEVLER (Tüm ödevler, tüm durumlar)
    else if (tip === "odevler") {
        var odevler = veri.odevler || [];
        odevler.forEach(function(odev) {
            Object.keys(odev.durumlar || {}).forEach(function(id) {
                var d = odev.durumlar[id];
                if (d !== "yapildi" && d !== "yapmadi" && d !== "eksik" && d !== "gec") return;
                liste.push(__waKayit(veri, tip, id, "", d, odev.ders || ""));
            });
        });
    }

    if (liste.length === 0) return alert("Seçili tarihte/tüm sınıflarda mesaj gönderilecek öğrenci bulunmuyor.");

    window.__waTopluDurum = { tip: tip, filtre: "olumsuz", veri: veri, liste: liste };
    var eski = document.getElementById("__waTopluOverlay");
    if (eski) eski.remove();
    var ov = document.createElement("div");
    ov.id = "__waTopluOverlay";
    ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";
    var k = document.createElement("div");
    k.id = "__waTopluKart";
    k.style.cssText = "background:#fff;border-radius:16px;padding:20px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);";
    ov.appendChild(k);
    document.body.appendChild(ov);
    __waTopluCiz();
  };

  window.__waTopluFiltreSec = function(filtre) {
    if (!window.__waTopluDurum) return;
    window.__waTopluDurum.filtre = filtre;
    __waTopluCiz();
  };

  function __waTopluFiltreHTML(tip, filtre) {
    var secenekler = [{ kod: "olumsuz", etiket: "❗ Olumsuz" }, { kod: "tumu", etiket: "Tümü" }].concat(__waTopluDurumlar[tip] || []);
    var html = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
    secenekler.forEach(function(s) {
      var aktif = s.kod === filtre;
      html += '<button type="button" onclick="window.__waTopluFiltreSec(\'' + s.kod + '\')" style="border:1px solid ' + (aktif ? "#14b8a6" : "#e2e8f0") + ';background:' + (aktif ? "#14b8a6" : "#fff") + ';color:' + (aktif ? "#fff" : "#475569") + ';padding:5px 10px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;">' + s.etiket + '</button>';
    });
    return html + '</div>';
  }

  function __waTopluCiz() {
    var durum = window.__waTopluDurum;
    var kart = document.getElementById("__waTopluKart");
    if (!durum || !kart) return;
    var tip = durum.tip;
    var filtre = durum.filtre || "olumsuz";
    var veri = durum.veri || ((typeof veriOku === "function") ? veriOku() : sinavVeriOku());
    var tumListe = durum.liste || [];
    var liste = filtre === "tumu" ? tumListe
      : filtre === "olumsuz" ? tumListe.filter(function(i) { return !i.olumlu; })
      : tumListe.filter(function(i) { return i.durumKod === filtre; });

    var kat = tip === "odevler" ? "odev" : tip;
    var taslaklar = taslakOku();
    var html = '<div style="font-family:system-ui;padding:6px;">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:4px;color:#0f172a;">📱 Tüm Sınıflar - Toplu Bilgilendirme</div>' +
      '<div style="font-size:11px;color:#64748b;margin-bottom:12px;">' + liste.length + ' / ' + tumListe.length + ' kayıt — varsayılan görünüm yalnızca olumsuz durumlar.</div>' +
      __waTopluFiltreHTML(tip, filtre) +
      '<div style="max-height:340px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:14px;">';

    if (!liste.length) {
      html += '<div style="padding:16px;text-align:center;font-size:12px;color:#64748b;">Bu filtreye uygun öğrenci bulunmuyor.</div>';
    }

    liste.forEach(function(item, index) {
        var ogr = (veri.ogrenciler || []).filter(function(o) { return o.id === item.id; })[0];
        if (!ogr) return;
        var ad = ogr.adSoyad || ogr.ad || "Öğrenci";
        var tel = ogr.veliTelefon || ogr.veliTel || ogr.veliTelefonu || "";
        tel = String(tel).replace(/\D/g, "");
        if(tel.length === 10 && tel.startsWith("5")) tel = "90" + tel;
        else if(tel.length === 11 && tel.startsWith("05")) tel = "9" + tel;

        // İlgili durumun kendi taslağı kullanılır (örn. odev.yapmadi / odev.gec)
        var mesaj = (taslaklar[kat] && taslaklar[kat][item.durumKod]) || "";
        mesaj = mesaj.replace(/{ad}/g, ad).replace(/{sinif}/g, ogr.sinif || "").replace(/{ders}/g, item.ders || "");
        var url = tel.length >= 10 ? "https://wa.me/" + tel + "?text=" + encodeURIComponent(mesaj) : "#";
        var durumYazi = (tip === "odevler" && item.ders ? "Ödev (" + item.ders + "): " : "") + item.durumEtiket;

        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border-bottom:1px solid #f1f5f9;' + (index === liste.length - 1 ? 'border-bottom:none;' : '') + '">' +
          '<div>' +
             '<div style="font-weight:700;font-size:13px;color:#1e293b;">' + sinavEsc(ad) + '</div>' +
             '<div style="font-size:11px;color:#0f766e;font-weight:600;">' + sinavEsc(item.sinifAd) + ' Sınıfı</div>' +
             '<div style="font-size:11px;color:' + (item.olumlu ? "#16a34a" : "#ef4444") + ';margin-top:2px;">' + sinavEsc(durumYazi) + '</div>' +
          '</div>' +
          (tel.length >= 10
            ? '<a href="' + url + '" target="_blank" style="background:#dcfce7;color:#166534;padding:6px 12px;border-radius:99px;text-decoration:none;font-size:11px;font-weight:700;">WhatsApp ➔</a>'
            : '<span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:6px 12px;border-radius:99px;">Numara Yok</span>') +
        '</div>';
    });

    html += '</div>' +
      '<button type="button" onclick="document.getElementById(\'__waTopluOverlay\').remove()" style="width:100%;background:#f1f5f9;color:#64748b;padding:10px;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Kapat</button>' +
    '</div>';
    kart.innerHTML = html;
  }

  // Her sekmenin üstüne Toplu Mesaj butonu ekle
  setInterval(function() {
    // Ders Yoklaması
    var ykTarih = document.getElementById("yoklamaTarih");
    if (ykTarih && !document.getElementById("__waBtnYoklama")) {
        var b = document.createElement("button");
        b.id = "__waBtnYoklama"; b.innerHTML = "📱 Toplu Mesaj"; b.className = "rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-[12px] font-bold text-green-700 hover:bg-green-100 ml-2";
        b.onclick = function() { window.__waTopluModal("yoklama"); };
        ykTarih.parentNode.appendChild(b);
    }
    // Sınav Yoklaması
    var snTarih = document.getElementById("sinavTarih");
    if (snTarih && !document.getElementById("__waBtnSinav")) {
        var b = document.createElement("button");
        b.id = "__waBtnSinav"; b.innerHTML = "📱 Toplu Mesaj"; b.className = "rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-[12px] font-bold text-green-700 hover:bg-green-100 ml-2";
        b.onclick = function() { window.__waTopluModal("sinav"); };
        snTarih.parentNode.appendChild(b);
    }
    // Kütüphane
    var ktArama = document.getElementById("__ktArama");
    if (ktArama && !document.getElementById("__waBtnKutuphane")) {
        var b = document.createElement("button");
        b.id = "__waBtnKutuphane"; b.innerHTML = "📱 Toplu Mesaj"; b.className = "rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-[12px] font-bold text-green-700 hover:bg-green-100 ml-2";
        b.onclick = function() { window.__waTopluModal("kutuphane"); };
        ktArama.parentNode.appendChild(b); // Arama kutusunun hemen sağına
        // flex ayarı için
        ktArama.parentNode.style.display = "flex";
        ktArama.parentNode.style.gap = "8px";
        ktArama.style.flex = "1";
    }
    // Ödevler ("her sekme için tek buton" ilkesi — sekme başlığındaki sekmelerin sağına)
    var odTab = document.getElementById("__odTabSinif");
    if (odTab && odTab.parentNode && !document.getElementById("__waBtnOdevler")) {
        var bo = document.createElement("button");
        bo.id = "__waBtnOdevler"; bo.innerHTML = "📱 Toplu Mesaj"; bo.className = "rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-[12px] font-bold text-green-700 hover:bg-green-100 ml-2";
        bo.onclick = function() { window.__waTopluModal("odevler"); };
        odTab.parentNode.appendChild(bo);
    }
  }, 500);

  // === EXCEL ONİZLEME YAMASI (index.html HİÇ DOKUNULMADAN — ADIM 1 + ADIM 3) ===
  // window.__ykExcelOnizle, index.html'in inline scripti içinde tanımlanır; takip-sistem.js
  // ondan SONRA yüklendiği için fonksiyon burada sarılır:
  //   ADIM 3 → window.__sonExcelRows = rows; (önizleme açılır açılmaz)
  //   ADIM 1 → "Kaydet" butonu, sarı uyarının ALTINA / Kapat'ın HEMEN ÜSTÜNE eklenir.
  if (!window.__ykExcelSarildi) {
    window.__ykExcelSarildi = true;
    (function ykExcelOnizleSar() {
      var orijinal = window.__ykExcelOnizle;
      if (typeof orijinal !== "function") {
        // Henüz tanımlanmadıysa kısa bir süre sonra tekrar dene
        if ((ykExcelOnizleSar.d = (ykExcelOnizleSar.d || 0) + 1) < 100) setTimeout(ykExcelOnizleSar, 50);
        return;
      }
      window.__ykExcelOnizle = function (rows, dosyaAdi) {
        window.__sonExcelRows = rows; // ADIM 3
        var sonuc = orijinal(rows, dosyaAdi);
        ykKaydetButonuEkle(); // ADIM 1
        return sonuc;
      };
    })();
  }

  // Önizleme kutusundaki sarı uyarının altına, "Kapat" butonunun HEMEN ÜSTÜNE kaydet butonu
  function ykKaydetButonuEkle() {
    var ov = document.getElementById("__ykExcelOverlay");
    if (!ov) return;
    var kapat = null;
    var btnler = ov.querySelectorAll("button");
    for (var i = 0; i < btnler.length; i++) {
      var oc = btnler[i].getAttribute("onclick") || "";
      if (oc.indexOf("__ykExcelKaydet") !== -1) return; // zaten eklenmiş
      if (oc.indexOf("__ykExcelKapat") !== -1) kapat = btnler[i];
    }
    if (!kapat) return;
    kapat.insertAdjacentHTML("beforebegin",
      '<button type="button" onclick="window.__ykExcelKaydet()" style="width:100%;background:#14b8a6;color:#fff;padding:12px;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-bottom:8px;font-size:14px;">✅ Excel\'i Sisteme Kaydet</button>');
  }

  // === EXCEL KAYDETME SİSTEMİ ===
  window.__ykExcelKaydet = function() {
    var rows = window.__sonExcelRows;
    if (!rows || !rows.length) return alert("Excel verisi bulunamadı. Lütfen dosyayı tekrar yükleyin.");

    var veri = JSON.parse(localStorage.getItem("yksOto_arsiv_v1") || "{}");
    if (!veri.yoklamalar) veri.yoklamalar = {};
    var ogrenciler = veri.ogrenciler || [];
    
    function normalize(s) {
        return String(s || "").toLowerCase().replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/\u0307/g, "").trim();
    }

    var basarili = 0;
    var bulunamayan = [];
    var aktifTarih = null;

    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || r.length === 0) continue;

        var colA = String(r[0] || "").trim();
        var colB = String(r[1] || "").trim();

        // Tarih Okuma (Örn: 14.Eki veya 15.Eki)
        if (colA && colA.match(/\d/) && !colB) {
            var tLower = colA.toLowerCase();
            var ayMap = {"oca":"01", "şub":"02", "sub":"02", "mar":"03", "nis":"04", "may":"05", "haz":"06", "tem":"07", "ağu":"08", "agu":"08", "eyl":"09", "eki":"10", "kas":"11", "ara":"12"};
            
            if (tLower.match(/^\d{4}-\d{2}-\d{2}$/)) {
                aktifTarih = tLower;
            } else {
                // Nokta, tire, boşluk gibi ayraçlara göre böl (14.Eki -> ["14", "Eki"])
                var parcalar = tLower.split(/[\s\-\.]+/);
                var gun = "01", ay = "01", yil = "2026";
                
                parcalar.forEach(function(p) {
                    if (p.match(/^\d{1,2}$/)) gun = p.padStart(2, "0");
                    else if (p.match(/^\d{4}$/)) yil = p;
                    else {
                        var kisaAy = p.substring(0, 3);
                        if (ayMap[kisaAy]) ay = ayMap[kisaAy];
                    }
                });
                aktifTarih = yil + "-" + ay + "-" + gun;
            }
            continue; 
        }

        // Öğrenci Okuma (A sütununda isim varsa)
        if (colA && aktifTarih && !colA.match(/^\d{4}-\d{2}-\d{2}$/)) {
            var ogrAdi = colA;
            var aciklama = colB;

            var excelAd = normalize(ogrAdi);
            var ogr = ogrenciler.find(function(o) {
                var sysAd = normalize(o.adSoyad || o.ad);
                return sysAd === excelAd || sysAd.includes(excelAd) || excelAd.includes(sysAd);
            });

            if (ogr) {
                if (!veri.yoklamalar[aktifTarih]) veri.yoklamalar[aktifTarih] = {};
                if (!veri.yoklamalar[aktifTarih][ogr.sinif]) veri.yoklamalar[aktifTarih][ogr.sinif] = {};
                
                veri.yoklamalar[aktifTarih][ogr.sinif][ogr.id] = { 
                    durum: "gelmedi", 
                    aciklama: aciklama || "" 
                };
                basarili++;
            } else {
                bulunamayan.push(ogrAdi);
            }
        }
    }

    localStorage.setItem("yksOto_arsiv_v1", JSON.stringify(veri));
    
    var mesaj = "✅ " + basarili + " kayıt başarıyla yüklendi.";
    if (bulunamayan.length > 0) {
        mesaj += "\n\n⚠ Sistemde bulunamayan " + bulunamayan.length + " öğrenci var:\n" + bulunamayan.slice(0, 10).join(", ");
        if (bulunamayan.length > 10) mesaj += "...";
    }
    alert(mesaj);
    
    var ov = document.getElementById("__ykExcelOverlay");
    if (ov) ov.remove();
    
    if (window.gosterAlt) window.gosterAlt("yoklama");
};

  // === GÖRÜŞMELER MODÜLÜ ===
  // Kayıtlar app.js'in DB'sinde "gorusmeler" dizisinde tutulur (anahtar: yksOto_arsiv_v1).
  // Kayıt biçimi: { id, ogrId, tur, tarih: "YYYY-MM-DD", veliAd, not, olusturma }
  // ÖNEMLİ: app.js DB'yi bellekte tutup her kayıtta tamamını yazdığı için yazma yolu
  // önce DB + saveDB()'dir; aksi halde sonraki kayıt görüşmeleri ezerdi.
  var GORUSME_TUR = {
    ogrenci: { ad: "Rehberlik", ikon: "🧠", bg: "#dcfce7", tx: "#166534" },
    veli: { ad: "Veli", ikon: "👨‍👩‍👧", bg: "#dbeafe", tx: "#1e40af" },
    sikayet: { ad: "Şikayet", ikon: "⚠️", bg: "#fee2e2", tx: "#991b1b" }
  };

  function gorusmeTur(t) {
    return GORUSME_TUR[t] || { ad: "Diğer", ikon: "📞", bg: "#f1f5f9", tx: "#475569" };
  }

  // === ÖNCELİK SINIFLANDIRMASI ===
  // Kayıt alan: oncelik = "acil" | "onemli" | "genel" (yoksa/genel-seçilmezse "genel").
  var GORUSME_ONCELK = {
    acil:   { ad: "Acil",   ikon: "🔴", renk: "#ef4444", bg: "#fee2e2", tx: "#991b1b", doldurTx: "#ffffff" },
    onemli: { ad: "Önemli", ikon: "🟡", renk: "#eab308", bg: "#fef9c3", tx: "#854d0e", doldurTx: "#713f12" },
    genel:  { ad: "Genel",  ikon: "🔵", renk: "#3b82f6", bg: "#dbeafe", tx: "#1e40af", doldurTx: "#ffffff" }
  };
  var GORUSME_ONCELK_SIRA = ["acil", "onemli", "genel"];

  function gorusmeOncelik(k) {
    return GORUSME_ONCELK[k] || GORUSME_ONCELK.genel;
  }

  // Türkçe karakter duyarlı normalizasyon: "İ" / "I" / "ı" hepsi "i"ye,
  // böylece "i" sorgusu "İ" ve "ı" içeren adlarla eşleşir.
  function gorusmeTRKucuk(s) {
    return String(s == null ? "" : s)
      .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
      .replace(/Ğ/g, "g").replace(/ğ/g, "g")
      .replace(/Ü/g, "u").replace(/ü/g, "u")
      .replace(/Ş/g, "s").replace(/ş/g, "s")
      .replace(/Ö/g, "o").replace(/ö/g, "o")
      .replace(/Ç/g, "c").replace(/ç/g, "c")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function oncelikEtiketHTML(k, n) {
    if (!n) return "";
    var b = gorusmeOncelik(k);
    return '<span style="background:' + b.bg + '; color:' + b.tx + '; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">' + b.ikon + " " + n + " " + b.ad + "</span>";
  }

  function oncelikEtiketGrubu(s) {
    var d = s || {};
    return oncelikEtiketHTML("acil", d.acil) + oncelikEtiketHTML("onemli", d.onemli) + oncelikEtiketHTML("genel", d.genel);
  }

  // Seçili buton kendi renginde dolu görünür; seçili olmayan beyaz zeminli.
  function oncelikButonStil(k, aktif) {
    var b = gorusmeOncelik(k);
    return "border:1px solid " + (aktif ? b.renk : "#cbd5e1") + "; background:" + (aktif ? b.renk : "#ffffff") +
      "; color:" + (aktif ? b.doldurTx : b.tx) + "; padding:6px 12px; border-radius:999px; font-size:11px; font-weight:700; cursor:pointer;";
  }

  function gorusmeleriOku() {
    try {
      if (window.DB) {
        if (!Array.isArray(window.DB.gorusmeler)) window.DB.gorusmeler = [];
        return window.DB.gorusmeler.slice();
      }
    } catch (e) {}
    var veri = sinavVeriOku();
    return Array.isArray(veri.gorusmeler) ? veri.gorusmeler.slice() : [];
  }

  function gorusmeleriYaz(liste) {
    var yazildi = false;
    try {
      if (window.DB) {
        window.DB.gorusmeler = liste;
        if (typeof window.saveDB === "function") { window.saveDB(); yazildi = true; }
      }
    } catch (e) {}
    if (!yazildi) {
      var veri = sinavVeriOku();
      veri.gorusmeler = liste;
      sinavVeriYaz(veri);
    }
  }

  function gorusmeOgrListe(ogrId) {
    return gorusmeleriOku().filter(function (g) { return g && g.ogrId === ogrId; })
      .sort(function (a, b) {
        var t = String(b.tarih || "").localeCompare(String(a.tarih || ""));
        // Aynı tarihte son eklenen kayıt üstte kalsın (en yeni en üstte)
        return t !== 0 ? t : String(b.olusturma || "").localeCompare(String(a.olusturma || ""));
      });
  }

  function gorusmeEtiketHTML(tur, n) {
    if (!n) return "";
    var t = gorusmeTur(tur);
    return '<span style="background:' + t.bg + '; color:' + t.tx + '; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">' + t.ikon + " " + n + " " + t.ad + "</span>";
  }

  function gorusmeEtiketGrubu(s) {
    var d = s || { ogrenci: 0, veli: 0, sikayet: 0 };
    return gorusmeEtiketHTML("sikayet", d.sikayet) + gorusmeEtiketHTML("veli", d.veli) + gorusmeEtiketHTML("ogrenci", d.ogrenci);
  }

  // Inline onclick içine giden kimlikler yalnız güvenli karakterlere indirgenir.
  function gorusmeGuvenliId(v) {
    return String(v == null ? "" : v).replace(/[^A-Za-z0-9_\-]/g, "");
  }

  function gorusmeListeHTML(ogrId, liste) {
    if (!liste.length) return '<div style="padding:10px; color:#94a3b8; font-size:12px; text-align:center;">Henüz görüşme kaydı yok.</div>';
    var h = '<div style="max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">';
    liste.forEach(function (g) {
      var t = gorusmeTur(g.tur);
      var o = gorusmeOncelik(g.oncelik);
      h += '<div style="display:flex; align-items:flex-start; gap:8px; padding:8px; background:#f8fafc; border-radius:6px; font-size:12px;">' +
        '<div style="width:4px; align-self:stretch; background:' + o.renk + '; border-radius:4px; flex:none;"></div>' +
        '<div style="flex:1; min-width:0;">' +
          '<div style="font-weight:700; color:#1e293b;">' + sinavEsc(g.tarih || "-") +
            ' <span style="background:' + o.bg + '; color:' + o.tx + '; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">' + o.ikon + " " + o.ad + '</span>' +
            ' <span style="background:' + t.bg + '; color:' + t.tx + '; padding:2px 6px; border-radius:4px; font-size:10px;">' + t.ikon + " " + t.ad +
            (g.veliAd ? " · " + sinavEsc(g.veliAd) : "") + '</span>' +
          '</div>' +
          '<div style="color:#475569; margin-top:2px; white-space:pre-wrap;">' + sinavEsc(g.not || "") + '</div>' +
        '</div>' +
        '<button type="button" title="Kaydı sil" onclick="window.__gorusmeSil(\'' + gorusmeGuvenliId(g.id) + '\',\'' + gorusmeGuvenliId(ogrId) + '\')" style="border:none; background:#fee2e2; color:#991b1b; border-radius:6px; width:22px; height:22px; font-size:11px; font-weight:800; cursor:pointer; flex:none;">✕</button>' +
      '</div>';
    });
    h += '</div>';
    return h;
  }

  window.__gorusmeFormAc = function (ogrId) {
    var alan = document.getElementById("__gorusmeFormAlan");
    if (!alan) return;
    if (alan.style.display !== "none") { alan.style.display = "none"; alan.innerHTML = ""; return; }

    var secenekler = Object.keys(GORUSME_TUR).map(function (k) {
      var t = GORUSME_TUR[k];
      return '<option value="' + k + '">' + t.ikon + " " + t.ad + '</option>';
    }).join("");
    var stil = "border:1px solid #cbd5e1; border-radius:6px; padding:6px 8px; font-size:12px; background:#fff;";

    alan.innerHTML = '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:10px; display:flex; flex-direction:column; gap:6px;">' +
        '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
          '<select id="__g_tur" style="' + stil + '">' + secenekler + '</select>' +
          '<input type="date" id="__g_tarih" value="' + sinavBugunKey() + '" style="' + stil + '">' +
          '<input type="text" id="__g_veli" placeholder="Veli adı (opsiyonel)" style="' + stil + ' flex:1; min-width:120px;">' +
        '</div>' +
        '<textarea id="__g_not" rows="2" placeholder="Görüşme notu..." style="' + stil + ' resize:vertical;"></textarea>' +
        '<div style="display:flex; gap:6px; justify-content:flex-end;">' +
          '<button type="button" onclick="window.__gorusmeFormAc(\'' + gorusmeGuvenliId(ogrId) + '\')" style="border:1px solid #e2e8f0; background:#fff; color:#475569; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Vazgeç</button>' +
          '<button type="button" onclick="window.__gorusmeKaydet(\'' + gorusmeGuvenliId(ogrId) + '\')" style="border:none; background:#0d9488; color:#fff; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Kaydet</button>' +
        '</div>' +
      '</div>';
    alan.style.display = "block";
    var notEl = document.getElementById("__g_not");
    if (notEl) notEl.focus();
  };

  window.__gorusmeKaydet = function (ogrId) {
    var turEl = document.getElementById("__g_tur");
    var tarihEl = document.getElementById("__g_tarih");
    var veliEl = document.getElementById("__g_veli");
    var notEl = document.getElementById("__g_not");
    var not = notEl ? String(notEl.value || "").trim() : "";
    if (!not) { alert("Görüşme notu boş olamaz."); if (notEl) notEl.focus(); return; }

    var liste = gorusmeleriOku();
    liste.push({
      id: "g_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
      ogrId: ogrId,
      tur: (turEl && GORUSME_TUR[turEl.value]) ? turEl.value : "ogrenci",
      tarih: (tarihEl && tarihEl.value) ? tarihEl.value : sinavBugunKey(),
      veliAd: veliEl ? String(veliEl.value || "").trim() : "",
      not: not,
      olusturma: new Date().toISOString()
    });
    gorusmeleriYaz(liste);
    window.__ogrDetayGoster(ogrId); // pencere yeniden çizilir (sayılar/liste güncel)
  };

  window.__gorusmeSil = function (id, ogrId) {
    if (!confirm("Bu görüşme kaydı silinsin mi?")) return;
    gorusmeleriYaz(gorusmeleriOku().filter(function (g) { return !g || g.id !== id; }));
    // Kayıt hangi yüzeyde görünüyorsa orası tazelenir: detay penceresi açıksa detay,
    // değilse Görüşmeler sekmesi.
    if (document.getElementById("__ogrDetayOverlay")) window.__ogrDetayGoster(ogrId);
    else if (typeof window.gosterAlt === "function" && document.getElementById("takipIcerik")) window.gosterAlt("gorusmeler");
  };

  window.__ogrDetayKapat = function () {
    var ov = document.getElementById("__ogrDetayOverlay");
    if (ov) ov.remove();
    // Karne listesindeki görüşme etiketleri tazelensin
    if (typeof window.gosterAlt === "function") window.gosterAlt("analiz");
  };

  // === ANALİZ EKRANI (AŞAMA 1) ===
  window.__sysAnalizEkran = function () {
    var veri = (typeof veriOku === "function") ? veriOku() : sinavVeriOku();
    var ogrenciler = veri.ogrenciler || [];
    var yoklamalar = veri.yoklamalar || {};
    var odevler = veri.odevler || [];
    var kutuphane = veri.kutuphane || {};

    var toplamOgr = ogrenciler.length;
    var toplamDers = 0, gelinenDers = 0;
    var toplamOdev = 0, yapilanOdev = 0;
    var toplamKtGun = 0;

    var bugun = new Date();
    var limitTarih = new Date();
    limitTarih.setDate(bugun.getDate() - 30);
    var limitKey = limitTarih.toISOString().slice(0,10);

    Object.keys(yoklamalar).forEach(function(tarih) {
        if (tarih < limitKey) return;
        var gun = yoklamalar[tarih];
        Object.keys(gun).forEach(function(sinif) {
            Object.keys(gun[sinif]).forEach(function(ogrId) {
                var d = typeof gun[sinif][ogrId] === 'string' ? gun[sinif][ogrId] : gun[sinif][ogrId].durum;
                if (d === 'iptal') return;
                toplamDers++;
                if (d === 'geldi' || d === 'gec') gelinenDers++;
            });
        });
    });

    odevler.forEach(function(o) {
        if (o.olusturmaTarihi < limitKey) return;
        Object.keys(o.durumlar || {}).forEach(function(id) {
            var d = o.durumlar[id];
            if (d === 'bekliyor') return;
            toplamOdev++;
            if (d === 'yapildi') yapilanOdev++;
        });
    });

    Object.keys(kutuphane).forEach(function(tarih) {
        if (tarih < limitKey) return;
        var gun = kutuphane[tarih];
        Object.keys(gun).forEach(function(id) {
            var d = ktDurum(gun[id]);
            if (d === "geldi" || d === "gec") toplamKtGun++;
        });
    });

    var katilimOrani = toplamDers > 0 ? Math.round((gelinenDers / toplamDers) * 100) : 0;
    var odevOrani = toplamOdev > 0 ? Math.round((yapilanOdev / toplamOdev) * 100) : 0;

    var html = '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px;">';
    var katilimRenk = katilimOrani >= 80 ? '#22c55e' : (katilimOrani >= 60 ? '#f59e0b' : '#ef4444');
    var odevRenk = odevOrani >= 80 ? '#22c55e' : (odevOrani >= 60 ? '#f59e0b' : '#ef4444');
    
    html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; position:relative; overflow:hidden;">' +
      '<div style="position:absolute; right:10px; top:10px; font-size:24px; opacity:0.2;">👥</div>' +
      '<div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Aktif Öğrenci</div>' +
      '<div style="font-size:28px; font-weight:800; color:#0f172a; margin-top:4px;">' + toplamOgr + '</div></div>';

    html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; position:relative; overflow:hidden;">' +
      '<div style="position:absolute; right:10px; top:10px; font-size:24px; opacity:0.2;">🏫</div>' +
      '<div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Ders Katılımı (30 Gün)</div>' +
      '<div style="font-size:28px; font-weight:800; color:' + katilimRenk + '; margin-top:4px;">%' + katilimOrani + '</div></div>';

    html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; position:relative; overflow:hidden;">' +
      '<div style="position:absolute; right:10px; top:10px; font-size:24px; opacity:0.2;">📝</div>' +
      '<div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Ödev Tamamlama</div>' +
      '<div style="font-size:28px; font-weight:800; color:' + odevRenk + '; margin-top:4px;">%' + odevOrani + '</div></div>';

    html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; position:relative; overflow:hidden;">' +
      '<div style="position:absolute; right:10px; top:10px; font-size:24px; opacity:0.2;">📚</div>' +
      '<div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Kütüphane (30 Gün)</div>' +
      '<div style="font-size:28px; font-weight:800; color:#3b82f6; margin-top:4px;">' + toplamKtGun + ' <span style="font-size:14px; font-weight:600;">Gün</span></div></div>';
    html += '</div>';

    // YENİ: GRAFİKLER
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:16px; margin-bottom:20px;">';
    html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">' +
      '<h3 style="margin:0 0 12px; font-size:14px; font-weight:800; color:#0f172a;">Son 7 Günün Katılımı</h3>' +
      '<div style="position:relative; height:200px; width:100%;"><canvas id="__anChartLine"></canvas></div></div>';
    html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">' +
      '<h3 style="margin:0 0 12px; font-size:14px; font-weight:800; color:#0f172a;">Bugünün Yoklama Dağılımı</h3>' +
      '<div style="position:relative; height:200px; width:100%;"><canvas id="__anChartDoughnut"></canvas></div></div>';
    html += '</div>';

    // Görüşme sayıları tek geçişte öğrenci bazında toplanır (liste başına tek okuma).
    // Tür sayıları (ogrenci/veli/sikayet) + öncelik sayıları (acil/onemli/genel):
    // karne rozetleri ve "Acil Müdahale" kriteri de burayı kullanır.
    var gorusmeSayac = {};
    gorusmeleriOku().forEach(function(g) {
        if (!g || !g.ogrId) return;
        if (!gorusmeSayac[g.ogrId]) gorusmeSayac[g.ogrId] = { ogrenci: 0, veli: 0, sikayet: 0, acil: 0, onemli: 0, genel: 0 };
        if (gorusmeSayac[g.ogrId][g.tur] != null) gorusmeSayac[g.ogrId][g.tur]++;
        var onc = (g.oncelik && GORUSME_ONCELK[g.oncelik]) ? g.oncelik : "genel";
        gorusmeSayac[g.ogrId][onc] = (gorusmeSayac[g.ogrId][onc] || 0) + 1;
    });

    // 2. Riskli Öğrenciler
    var riskliOgr = [];
    ogrenciler.forEach(function(ogr) {
        var devamsizlik = 0, odevSorun = 0;
        var dersGecmisi = [], odevGecmisi = [];
        
        Object.keys(yoklamalar).sort().reverse().forEach(function(tarih) {
            if (yoklamalar[tarih][ogr.sinif] && yoklamalar[tarih][ogr.sinif][ogr.id]) {
                var d = yoklamalar[tarih][ogr.sinif][ogr.id];
                dersGecmisi.push(typeof d === 'string' ? d : d.durum);
            }
        });
        if (dersGecmisi.slice(0, 3).length === 3 && dersGecmisi.slice(0, 3).every(function(d){ return d === 'gelmedi'; })) devamsizlik = 1;

        odevler.slice().reverse().forEach(function(o) {
            if (o.durumlar && o.durumlar[ogr.id]) {
                var d = o.durumlar[ogr.id];
                if (d !== 'bekliyor') odevGecmisi.push(d);
            }
        });
        if (odevGecmisi.slice(0, 3).length === 3 && odevGecmisi.slice(0, 3).every(function(d){ return d === 'yapmadi' || d === 'eksik'; })) odevSorun = 1;

        var gAcil = (gorusmeSayac[ogr.id] && gorusmeSayac[ogr.id].acil) || 0;

        if (devamsizlik || odevSorun || gAcil > 0) {
            var nedenler = [];
            if (devamsizlik) nedenler.push("Son 3 ders gelmedi");
            if (odevSorun) nedenler.push("Son 3 ödev yapılmadı");
            if (gAcil > 0) nedenler.push("Acil görüşmesi var");
            riskliOgr.push({ ad: ogr.adSoyad || ogr.ad, sinif: ogr.sinif, neden: nedenler.join(", ") });
        }
    });

    html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-top:16px;">';
    html += '<div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">' +
      '<div style="width:8px; height:24px; background:#ef4444; border-radius:4px;"></div>' +
      '<h3 style="margin:0; font-size:15px; font-weight:800; color:#0f172a;">Acil Müdahale Gerektirenler (' + riskliOgr.length + ')</h3></div>';

    if (riskliOgr.length === 0) {
        html += '<div style="text-align:center; padding:20px; color:#22c55e; font-weight:600; font-size:13px;">🎉 Harika! Şu an riskli öğrenci bulunmuyor.</div>';
    } else {
        html += '<div style="display:flex; flex-direction:column; gap:8px;">';
        riskliOgr.forEach(function(r) {
            html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;">' +
              '<div><div style="font-weight:700; font-size:13px; color:#991b1b;">' + sinavEsc(r.ad) + '</div>' +
              '<div style="font-size:11px; color:#b91c1c;">' + sinavEsc(r.neden) + '</div></div>' +
              '<span style="font-size:11px; font-weight:700; background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:6px;">' + sinavEsc(r.sinif) + '</span>' +
            '</div>';
        });
        html += '</div>';
    }
    html += '</div>';

    // 3. Öğrenci Karneleri
    var karneler = [];
    // Görüşme sayıları (tür + öncelik) riskli liste öncesinde tek geçişte toplandı.
    ogrenciler.forEach(function(ogr) {
        var ogrToplamDers = 0, ogrGelinenDers = 0;
        var ogrToplamOdev = 0, ogrYapilanOdev = 0;
        var ogrKtGun = 0;

        Object.keys(yoklamalar).forEach(function(t) {
            if (t < limitKey) return;
            if (yoklamalar[t][ogr.sinif] && yoklamalar[t][ogr.sinif][ogr.id]) {
                var d = typeof yoklamalar[t][ogr.sinif][ogr.id] === 'string' ? yoklamalar[t][ogr.sinif][ogr.id] : yoklamalar[t][ogr.sinif][ogr.id].durum;
                if (d !== 'iptal') { ogrToplamDers++; if (d === 'geldi' || d === 'gec') ogrGelinenDers++; }
            }
        });
        odevler.forEach(function(o) {
            if (o.olusturmaTarihi < limitKey) return;
            if (o.durumlar && o.durumlar[ogr.id]) {
                var d = o.durumlar[ogr.id];
                if (d !== 'bekliyor') { ogrToplamOdev++; if (d === 'yapildi') ogrYapilanOdev++; }
            }
        });
        Object.keys(kutuphane).forEach(function(t) {
            if (t < limitKey) return;
            var kd = ktDurum(kutuphane[t][ogr.id]);
            if (kd === "geldi" || kd === "gec") ogrKtGun++;
        });

        var oKatilim = ogrToplamDers > 0 ? Math.round((ogrGelinenDers / ogrToplamDers) * 100) : 0;
        var oOdev = ogrToplamOdev > 0 ? Math.round((ogrYapilanOdev / ogrToplamOdev) * 100) : 0;
        
        var ktPuan = Math.min(ogrKtGun, 20) / 20 * 100;
        var genelPuan = Math.round((oKatilim * 0.5) + (oOdev * 0.3) + (ktPuan * 0.2));

        // Birebir ders sayisi (yalniz tamamlananlar) - tek kaynak: veri.dersler
        var birebirSayisi = (veri.dersler || []).filter(function(d) {
            return d && d.ogrenciId === ogr.id && d.durum === 'tamamlandi';
        }).length;

        karneler.push({
            id: ogr.id, ad: String(ogr.adSoyad || ogr.ad || ""), sinif: String(ogr.sinif || ""),
            katilim: oKatilim, odev: oOdev, kt: ogrKtGun, puan: genelPuan,
            gorusme: gorusmeSayac[ogr.id] || null, birebir: birebirSayisi
        });
    });

    var siniflar = Array.from(new Set(ogrenciler.map(function(o){ return o.sinif; }))).sort();

    html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-top:16px;">';
    html += '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:12px;">' +
      '<div style="display:flex; align-items:center; gap:8px;">' +
        '<div style="width:8px; height:24px; background:#3b82f6; border-radius:4px;"></div>' +
        '<h3 style="margin:0; font-size:15px; font-weight:800; color:#0f172a;">Öğrenci Karneleri</h3>' +
      '</div>' +
      '<div style="display:flex; gap:8px;">' +
        '<input type="text" id="__anArama" placeholder="🔍 Öğrenci ara..." oninput="window.__sysAnalizAra()" style="border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px; font-size:12px; width:150px;">' +
        '<select id="__anSinif" onchange="window.__sysAnalizAra()" style="border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px; font-size:12px;">' +
          '<option value="">Tüm Sınıflar</option>' +
          siniflar.map(function(s){ return '<option value="'+sinavEsc(s)+'">'+sinavEsc(s)+'</option>'; }).join('') +
        '</select>' +
      '</div>' +
    '</div>';

    html += '<div id="__anListe" style="display:flex; flex-direction:column; gap:6px; max-height:400px; overflow-y:auto;">';
    
    karneler.sort(function(a,b){ return b.puan - a.puan; }).forEach(function(k) {
        var renk = k.puan >= 80 ? '#22c55e' : (k.puan >= 60 ? '#f59e0b' : '#ef4444');
        var gEtiketler = gorusmeEtiketGrubu(k.gorusme);
        var oEtiketler = oncelikEtiketGrubu(k.gorusme);
        var bEtiket = (k.birebir > 0) ? '<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">📚 ' + k.birebir + ' Birebir</span>' : '';
        var rozetSatir = (bEtiket || oEtiketler || gEtiketler) ? '<div style="display:flex; gap:4px; flex-wrap:wrap; max-width:250px;">' + bEtiket + oEtiketler + gEtiketler + '</div>' : '';
        // En az 1 Acil görüşmesi olan öğrencinin karne kartının sol kenarında kırmızı şerit
        var acilMi = !!(k.gorusme && k.gorusme.acil > 0);
        var kartStil = 'cursor:pointer; display:flex; align-items:center; justify-content:space-between; padding:10px; border:1px solid #f1f5f9; border-radius:8px; background:#f8fafc; hover:background:#f1f5f9;' + (acilMi ? ' border-left:4px solid #ef4444;' : '');
        html += '<div class="an-kart" onclick="window.__ogrDetayGoster(\''+k.id+'\')" data-sinif="'+sinavEsc(k.sinif)+'" data-ad="'+sinavEsc(k.ad.toLowerCase())+'" style="' + kartStil + '">' +
          '<div>' +
            '<div style="font-weight:700; font-size:13px; color:#1e293b;">' + sinavEsc(k.ad) + '</div>' +
            '<div style="font-size:11px; color:#64748b; margin-bottom:' + (rozetSatir ? '3px' : '0') + ';">' + sinavEsc(k.sinif) + '</div>' +
            rozetSatir +
          '</div>' +
          '<div style="display:flex; gap:12px; align-items:center;">' +
            '<div style="text-align:center;"><div style="font-size:10px; color:#64748b;">Katılım</div><div style="font-size:12px; font-weight:700;">%' + k.katilim + '</div></div>' +
            '<div style="text-align:center;"><div style="font-size:10px; color:#64748b;">Ödev</div><div style="font-size:12px; font-weight:700;">%' + k.odev + '</div></div>' +
            '<div style="text-align:center;"><div style="font-size:10px; color:#64748b;">Kütüphane</div><div style="font-size:12px; font-weight:700;">' + k.kt + 'g</div></div>' +
            '<div style="background:'+renk+'; color:#fff; font-weight:800; font-size:14px; padding:6px 12px; border-radius:8px; min-width:50px; text-align:center;">' + k.puan + '</div>' +
          '</div>' +
        '</div>';
    });

    html += '</div></div>';

    // Grafik çizimini geciktirerek çağır (DOM'un oluşması için)
    setTimeout(function() {
        if (typeof Chart === 'undefined') return; // Chart.js yüklü değilse atla

        // --- 1. Çizgi Grafik: Son 7 Gün ---
        var son7Gun = [];
        var son7Ders = [];
        var son7Gelinen = [];
        for (var i = 6; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var t = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
            son7Gun.push(t.substring(5)); // Sadece AA-GG
            
            var toplam = 0, gelinen = 0;
            if (yoklamalar[t]) {
                Object.keys(yoklamalar[t]).forEach(function(s) {
                    Object.keys(yoklamalar[t][s]).forEach(function(id) {
                        var st = typeof yoklamalar[t][s][id] === 'string' ? yoklamalar[t][s][id] : yoklamalar[t][s][id].durum;
                        if (st !== 'iptal') { toplam++; if (st === 'geldi' || st === 'gec') gelinen++; }
                    });
                });
            }
            son7Ders.push(toplam);
            son7Gelinen.push(gelinen);
        }

        var ctxLine = document.getElementById('__anChartLine');
        if (ctxLine && Chart.getChart(ctxLine)) Chart.getChart(ctxLine).destroy();
        if (ctxLine) {
            new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: son7Gun,
                    datasets: [{
                        label: 'Gelen Öğrenci',
                        data: son7Gelinen,
                        borderColor: '#14b8a6',
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        }

        // --- 2. Pasta Grafik: Bugünün Dağılımı ---
        var bugunT = sinavBugunKey(); // Yerel "bugün": yoklama anahtarları yerel tarih (index.html bugunKey)
        var bugunGeldi = 0, bugunGelmedi = 0, bugunGec = 0;
        if (yoklamalar[bugunT]) {
            Object.keys(yoklamalar[bugunT]).forEach(function(s) {
                Object.keys(yoklamalar[bugunT][s]).forEach(function(id) {
                    var st = typeof yoklamalar[bugunT][s][id] === 'string' ? yoklamalar[bugunT][s][id] : yoklamalar[bugunT][s][id].durum;
                    if (st === 'geldi') bugunGeldi++;
                    else if (st === 'gelmedi') bugunGelmedi++;
                    else if (st === 'gec') bugunGec++;
                });
            });
        }

        var ctxDough = document.getElementById('__anChartDoughnut');
        if (ctxDough && Chart.getChart(ctxDough)) Chart.getChart(ctxDough).destroy();
        if (ctxDough) {
            new Chart(ctxDough, {
                type: 'doughnut',
                data: {
                    labels: ['Geldi', 'Gelmedi', 'Geç'],
                    datasets: [{
                        data: [bugunGeldi, bugunGelmedi, bugunGec],
                        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
            });
        }
    }, 100);

    return html;
};

window.__sysAnalizAra = function() {
    var aramaEl = document.getElementById("__anArama");
    var sinifEl = document.getElementById("__anSinif");
    if (!aramaEl || !sinifEl) return;
    
    var arama = (aramaEl.value || "").toLowerCase();
    var seciliSinif = sinifEl.value;
    var kartlar = document.querySelectorAll(".an-kart");
    
    kartlar.forEach(function(kart) {
        var ad = kart.getAttribute("data-ad");
        var sinif = kart.getAttribute("data-sinif");
        var uygunAd = ad.includes(arama);
        var uygunSinif = !seciliSinif || sinif === seciliSinif;
        
        if (uygunAd && uygunSinif) kart.style.display = "flex";
        else kart.style.display = "none";
    });
};

window.__sysAnalizAra = function() {
    var aramaAlani = document.getElementById("__anArama");
    var sinifAlani = document.getElementById("__anSinif");
    if (!aramaAlani || !sinifAlani) return;
    var arama = (aramaAlani.value || "").toLowerCase();
    var seciliSinif = sinifAlani.value;
    var kartlar = document.querySelectorAll(".an-kart");
    
    kartlar.forEach(function(kart) {
        var ad = kart.getAttribute("data-ad");
        var sinif = kart.getAttribute("data-sinif");
        var uygunAd = ad.includes(arama);
        var uygunSinif = !seciliSinif || sinif === seciliSinif;
        
        if (uygunAd && uygunSinif) kart.style.display = "flex";
        else kart.style.display = "none";
    });
};


  // === ÖĞRENCİ DETAY MODALI ===
  window.__ogrDetayGoster = function(ogrId) {
    var veri = (typeof veriOku === "function") ? veriOku() : sinavVeriOku();
    var ogr = (veri.ogrenciler || []).find(function(o){ return o.id === ogrId; });
    if(!ogr) return alert("Öğrenci bulunamadı.");

    // Yeniden çizimde (görüşme ekle/sil) üst üste pencere açılmasın
    var eskiOverlay = document.getElementById("__ogrDetayOverlay");
    if (eskiOverlay) eskiOverlay.remove();

    var ad = ogr.adSoyad || ogr.ad || "Öğrenci";
    var sinif = ogr.sinif || "-";
    var tel = ogr.veliTelefon || ogr.veliTel || "-";

    // Verileri topla
    var dersler = [];
    Object.keys(veri.yoklamalar || {}).forEach(function(t) {
        if(veri.yoklamalar[t][sinif] && veri.yoklamalar[t][sinif][ogrId]) {
            var d = veri.yoklamalar[t][sinif][ogrId];
            dersler.push({ tarih: t, durum: typeof d === 'string' ? d : d.durum, aciklama: typeof d === 'object' ? d.aciklama : "" });
        }
    });
    dersler.sort(function(a,b){ return b.tarih.localeCompare(a.tarih); });

    var sinavlar = [];
    Object.keys(veri.sinavYoklamalari || {}).forEach(function(t) {
        if(veri.sinavYoklamalari[t][sinif] && veri.sinavYoklamalari[t][sinif][ogrId]) {
            var d = veri.sinavYoklamalari[t][sinif][ogrId];
            sinavlar.push({ tarih: t, durum: typeof d === 'string' ? d : d.durum, aciklama: typeof d === 'object' ? d.aciklama : "" });
        }
    });
    sinavlar.sort(function(a,b){ return b.tarih.localeCompare(a.tarih); });

    var kutuphane = [];
    Object.keys(veri.kutuphane || {}).forEach(function(t) {
        var k = ktDurum((veri.kutuphane[t] || {})[ogrId]);
        if (k === "geldi") kutuphane.push({ tarih: t, durum: "Geldi" });
        else if (k === "gelmedi") kutuphane.push({ tarih: t, durum: "Gelmedi" });
        else if (k === "gec") kutuphane.push({ tarih: t, durum: "Geç" });
    });
    kutuphane.sort(function(a,b){ return b.tarih.localeCompare(a.tarih); });

    var odevler = [];
    (veri.odevler || []).forEach(function(o) {
        if(o.durumlar && o.durumlar[ogrId]) {
            odevler.push({ tarih: o.olusturmaTarihi, ders: o.ders, konu: o.konu, durum: o.durumlar[ogrId] });
        }
    });
    odevler.sort(function(a,b){ return b.tarih.localeCompare(a.tarih); });

    // Görüşmeler (en yeni üstte) — modül: veri.gorusmeler
    var gorusmeler = gorusmeOgrListe(ogrId);

    // Birebir dersler (en yeni üstte) — tek kaynak: veri.dersler
    var birebirDersler = (veri.dersler || []).filter(function(d) { return d && d.ogrenciId === ogrId; });
    birebirDersler.sort(function(a,b){
        return String(b.tarih || "").localeCompare(String(a.tarih || "")) ||
               String(b.olusturma || "").localeCompare(String(a.olusturma || ""));
    });

    // Tamamlanan birebir derslerin öğretmen bazlı özeti
    var birebirOgrSayac = {};
    birebirDersler.forEach(function(d) {
        if (d.durum === 'tamamlandi' && d.ogretmenAd) {
            birebirOgrSayac[d.ogretmenAd] = (birebirOgrSayac[d.ogretmenAd] || 0) + 1;
        }
    });
    var birebirOgrOzet = Object.keys(birebirOgrSayac).map(function(k){ return k + ': ' + birebirOgrSayac[k]; }).join(', ');

    function birebirDersAdi(d) {
        var D = (typeof DERS === "object" && DERS && DERS[d.dersId]) ? DERS[d.dersId] : null;
        return sinavEsc(D ? D.ad : (d.dersId || "Ders"));
    }

    function birebirListeHTML() {
        if (birebirDersler.length === 0) return '<div style="padding:10px; color:#94a3b8; font-size:12px; text-align:center;">Kayıt yok.</div>';
        var h = '<div style="max-height:200px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">';
        birebirDersler.slice(0, 15).forEach(function(d) { // Son 15 kaydı göster
            var durumRenk = { 'tamamlandi': '#22c55e', 'iptal': '#ef4444', 'planlandi': '#3b82f6' }[d.durum] || '#64748b';
            var durumLbl = { 'tamamlandi': 'Tamamlandı', 'iptal': 'İptal', 'planlandi': 'Planlandı' }[d.durum] || String(d.durum || "-");
            h += '<div style="display:flex; justify-content:space-between; gap:8px; padding:8px; background:#f8fafc; border-radius:6px; font-size:12px;">' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-weight:700; color:#1e293b;">' + sinavEsc(String(d.tarih || "-")) +
                        ' <span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:10px; color:#475569;">' + birebirDersAdi(d) + '</span></div>' +
                    '<div style="color:#64748b; font-size:11px; margin-top:2px;">' + sinavEsc(String(d.konu || 'Genel tekrar')) + ' · ' + sinavEsc(String(d.ogretmenAd || '')) + '</div>' +
                '</div>' +
                '<div style="font-weight:700; color:' + durumRenk + '; display:flex; align-items:center; white-space:nowrap;">' + durumLbl + '</div>' +
                '</div>';
        });
        h += '</div>';
        return h;
    }

    // HTML Oluşturma
    function makeList(arr, type) {
        if(arr.length === 0) return '<div style="padding:10px; color:#94a3b8; font-size:12px; text-align:center;">Kayıt yok.</div>';
        var h = '<div style="max-height:200px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">';
        arr.slice(0, 15).forEach(function(item) { // Son 15 kaydı göster
            var renk = "#64748b";
            if(item.durum === "geldi" || item.durum === "girdi" || item.durum === "yapildi") renk = "#22c55e";
            else if(item.durum === "gelmedi" || item.durum === "girmedi" || item.durum === "yapmadi") renk = "#ef4444";
            else if(item.durum === "gec") renk = "#f59e0b";

            h += '<div style="display:flex; justify-content:space-between; padding:8px; background:#f8fafc; border-radius:6px; font-size:12px;">' +
                '<div><span style="font-weight:700;">' + item.tarih + '</span>';
            if(type === 'odev') h += ' <span style="color:#64748b;">(' + item.ders + ' - ' + item.konu + ')</span>';
            h += '</div><div style="font-weight:700; color:' + renk + ';">' + item.durum.toUpperCase();
            if(item.aciklama) h += ' <span style="font-size:10px; font-weight:normal; color:#64748b;">(' + item.aciklama + ')</span>';
            h += '</div></div>';
        });
        h += '</div>';
        return h;
    }

    var html = '<div style="font-family:system-ui; padding:6px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">' +
            '<div>' +
                '<div style="font-size:18px; font-weight:800; color:#0f172a;">' + sinavEsc(ad) + '</div>' +
                '<div style="font-size:13px; color:#0f766e; font-weight:600; margin-top:2px;">' + sinavEsc(sinif) + ' Sınıfı</div>' +
                '<div style="font-size:12px; color:#64748b; margin-top:4px;">📞 Veli: ' + sinavEsc(tel) + '</div>' +
            '</div>' +
        '</div>' +
        
        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">' +
            '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">' +
                '<div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">📚 Ders Yoklaması</div>' +
                makeList(dersler, 'ders') +
            '</div>' +
            '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">' +
                '<div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">📝 Sınav Yoklaması</div>' +
                makeList(sinavlar, 'sinav') +
            '</div>' +
            '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">' +
                '<div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">📖 Kütüphane</div>' +
                makeList(kutuphane, 'kutuphane') +
            '</div>' +
            '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">' +
                '<div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">📋 Ödevler</div>' +
                makeList(odevler, 'odev') +
            '</div>' +
            '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; grid-column:1 / -1;">' +
                '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">' +
                    '<div style="font-size:12px; font-weight:800; color:#0f172a;">📞 Görüşmeler (' + gorusmeler.length + ')</div>' +
                    '<button type="button" onclick="window.__gorusmeFormAc(\'' + gorusmeGuvenliId(ogrId) + '\')" style="border:none; background:#0d9488; color:#fff; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">+ Görüşme Ekle</button>' +
                '</div>' +
                '<div id="__gorusmeFormAlan" style="display:none;"></div>' +
                gorusmeListeHTML(ogrId, gorusmeler) +
            '</div>' +
            '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; grid-column:1 / -1;">' +
                '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:4px; flex-wrap:wrap;">' +
                    '<div style="font-size:12px; font-weight:800; color:#0f172a;">📚 Birebir Dersler (' + birebirDersler.length + ')</div>' +
                    (birebirOgrOzet ? '<div style="font-size:10px; color:#0369a1; font-weight:700; background:#e0f2fe; padding:2px 6px; border-radius:4px;">Öğretmenler: ' + sinavEsc(birebirOgrOzet) + '</div>' : '') +
                '</div>' +
                birebirListeHTML() +
            '</div>' +
        '</div>' +
        '<button type="button" onclick="window.__ogrDetayKapat()" style="width:100%; margin-top:16px; background:#f1f5f9; color:#475569; padding:10px; border:none; border-radius:8px; font-weight:700; cursor:pointer;">Kapat</button>' +
    '</div>';

    var ov = document.createElement("div");
    ov.id = "__ogrDetayOverlay";
    ov.style.cssText = "position:fixed; inset:0; background:rgba(15,23,42,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;";
    var k = document.createElement("div");
    k.style.cssText = "background:#fff; border-radius:16px; padding:20px; max-width:600px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.3); max-height:90vh; overflow-y:auto;";
    k.innerHTML = html;
    ov.appendChild(k);
    document.body.appendChild(ov);
  };

  // === YÖNETİM › ÖĞRENCİ & SINIF: ARAMA KUTUSU VE SINIF FİLTRESİ ===
  // index.html'e HİÇ dokunulmadan, renderYonetim() içindeki "Kayıtlı Öğrenciler"
  // başlığının altına enjekte edilir. Yönetim sekmesi her yeniden çizimde içeriği
  // innerHTML ile yeniden kurduğu için kutu 1 saniyelik setInterval ile korunur:
  //   - kutu yoksa eklenir, son arama/filtre değerleri geri yüklenir
  //   - filtre her turda tekrar uygulanır (liste yeniden çizilince gizlenmeler kaybolmaz)
  var yonetimSonArama = "";
  var yonetimSonSinif = "";

  function yonetimKucuk(s) {
    var v = String(s == null ? "" : s);
    return typeof kucuk === "function" ? kucuk(v) : v.toLocaleLowerCase("tr-TR");
  }

  function yonetimOgrVeri() {
    return (typeof DB !== "undefined" && DB && DB.ogrenciler) ? DB.ogrenciler : [];
  }

  // "Kayıtlı Öğrenciler (N)" başlığını bul (CSS uppercase değil, gerçek metin "Kayıtlı"dır)
  function yonetimOgrBasligi() {
    var h = document.querySelectorAll("#yonetimBolum h4");
    for (var i = 0; i < h.length; i++) {
      var t = (h[i].textContent || "").replace(/\s+/g, " ").trim();
      if (t.indexOf("Kayıtlı Öğrenciler") >= 0) return h[i];
    }
    return null;
  }

  function yonetimOgrSiniflar() {
    var set = {};
    yonetimOgrVeri().forEach(function (o) { if (o && o.sinif) set[o.sinif] = 1; });
    return Object.keys(set).sort();
  }

  // Başlığın altındaki liste kapsayıcısı ve öğrenci satırları (doğrudan çocuk DIV'ler)
  function yonetimOgrSatirlar(baslik) {
    var kutu = document.getElementById("__yonetimAramaKutusu");
    var liste = kutu ? kutu.nextElementSibling : baslik.nextElementSibling;
    if (!liste || liste.tagName !== "DIV") return []; // boş liste "<p>Henüz öğrenci yok.", satır yok
    var satirlar = [];
    for (var i = 0; i < liste.children.length; i++) {
      if (liste.children[i].tagName === "DIV") satirlar.push(liste.children[i]);
    }
    return satirlar;
  }

  window.__yonetimFiltrele = function () {
    var aramaEl = document.getElementById("__yAramaInput");
    var sinifEl = document.getElementById("__ySinifSelect");
    var baslik = yonetimOgrBasligi();
    if (!aramaEl || !sinifEl || !baslik) return;

    var arama = yonetimKucuk(String(aramaEl.value || "").trim());
    var seciliSinif = sinifEl.value || "";
    var ogrenciler = yonetimOgrVeri();
    var satirlar = yonetimOgrSatirlar(baslik);
    // Satır sayısı öğrenci sayısıyla aynıysa satır i ↔ öğrenci i eşleşmesi kesindir;
    // sınıf eşleşmesi o zaman metin içeriğine değil, kaydın kendisine bakılır.
    var birebir = satirlar.length === ogrenciler.length;

    for (var i = 0; i < satirlar.length; i++) {
      var satir = satirlar[i];
      var metin = yonetimKucuk(satir.textContent || "");
      var ogr = birebir ? ogrenciler[i] : null;
      var uygunAd = !arama || metin.indexOf(arama) >= 0;
      var uygunSinif = !seciliSinif ||
        (ogr ? (ogr.sinif || "") === seciliSinif : metin.indexOf(yonetimKucuk(seciliSinif)) >= 0);
      satir.style.display = (uygunAd && uygunSinif) ? "" : "none";
    }
  };

  setInterval(function () {
    var baslik = yonetimOgrBasligi();
    if (!baslik) return; // Yönetim › Öğrenci & Sınıf sekmesi açık değil

    var kutu = document.getElementById("__yonetimAramaKutusu");
    if (!kutu) {
      kutu = document.createElement("div");
      kutu.id = "__yonetimAramaKutusu";
      kutu.style.cssText = "display:flex; gap:8px; align-items:center; margin:10px 0 12px;";

      var aramaEl = document.createElement("input");
      aramaEl.type = "text";
      aramaEl.id = "__yAramaInput";
      aramaEl.placeholder = "🔍 Öğrenci ara (ad, sınıf, telefon)…";
      aramaEl.style.cssText = "flex:1; min-width:0; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13px; outline:none;";
      aramaEl.value = yonetimSonArama;
      aramaEl.addEventListener("input", function () {
        yonetimSonArama = aramaEl.value;
        window.__yonetimFiltrele();
      });

      var sinifEl = document.createElement("select");
      sinifEl.id = "__ySinifSelect";
      sinifEl.style.cssText = "border:1px solid #cbd5e1; border-radius:8px; padding:8px 10px; font-size:13px; font-weight:600; background:#fff; max-width:45%;";
      sinifEl.addEventListener("change", function () {
        yonetimSonSinif = sinifEl.value;
        window.__yonetimFiltrele();
      });

      kutu.appendChild(aramaEl);
      kutu.appendChild(sinifEl);
      baslik.parentNode.insertBefore(kutu, baslik.nextSibling);
    }

    // Sınıf seçenekleri DB değiştikçe tazelenir; seçili değer korunur
    var siniflar = yonetimOgrSiniflar();
    var anahtar = siniflar.join("|");
    if (kutu.__sinifAnahtar !== anahtar) {
      kutu.__sinifAnahtar = anahtar;
      var sel = document.getElementById("__ySinifSelect");
      if (sel) {
        var mevcut = sel.value || yonetimSonSinif;
        sel.innerHTML = '<option value="">Tüm Sınıflar</option>' +
          siniflar.map(function (s) { return '<option value="' + sinavEsc(s) + '">' + sinavEsc(s) + "</option>"; }).join("");
        sel.value = (mevcut && siniflar.indexOf(mevcut) >= 0) ? mevcut : "";
        yonetimSonSinif = sel.value;
      }
    }

    window.__yonetimFiltrele();
  }, 1000);

  // === GÖRÜŞMELER SEKMESİ (📞) ===
  // Sekme içeriği: üstte yeni görüşme formu, altta tüm öğrencilerin geçmiş görüşmeleri.
  // Kayıtlar Görüşmeler modülünün (veri.gorusmeler) aynı yardımcılarıyla okunur/yazılır.
  window.__sysGorusmelerEkran = function () {
    var veri = (typeof veriOku === "function") ? veriOku() : sinavVeriOku();
    var ogrenciler = (veri.ogrenciler || []).slice().sort(function (a, b) {
      return String(a.adSoyad || a.ad || "").localeCompare(String(b.adSoyad || b.ad || ""), "tr");
    });
    var ogrMap = {};
    ogrenciler.forEach(function (o) { ogrMap[o.id] = o; });

    var liste = gorusmeleriOku().sort(function (a, b) {
      var t = String(b.tarih || "").localeCompare(String(a.tarih || ""));
      return t !== 0 ? t : String(b.olusturma || "").localeCompare(String(a.olusturma || ""));
    });

    var say = { ogrenci: 0, veli: 0, sikayet: 0 };
    liste.forEach(function (g) { if (g && say[g.tur] != null) say[g.tur]++; });

    var stil = "border:1px solid #cbd5e1; border-radius:6px; padding:6px 8px; font-size:12px; background:#fff;";
    var turSecenek = Object.keys(GORUSME_TUR).map(function (k) {
      var t = GORUSME_TUR[k];
      return '<option value="' + k + '">' + t.ikon + " " + t.ad + "</option>";
    }).join("");
    // Öğrenci arama kaynağı (yazdıkça açılan liste) + öncelik/filtre durumu
    ggOgrHazirla(ogrenciler);
    if (!GORUSME_ONCELK[window.__ggOncelik]) window.__ggOncelik = "genel";
    if (["tumu", "acil", "onemli", "genel"].indexOf(window.__ggFiltre) < 0) window.__ggFiltre = "tumu";

    var filtreButon = function (k, etiket) {
      var aktif = window.__ggFiltre === k;
      return '<button type="button" data-filt="' + k + '" onclick="window.__gorusmeOncelikFiltre(\'' + k + '\')" style="' + filtreButonStil(k, aktif) + '">' + etiket + '</button>';
    };
    var oncelikButon = function (k) {
      var b = gorusmeOncelik(k);
      var aktif = window.__ggOncelik === k;
      return '<button type="button" class="gg-onc-btn" data-oncelik="' + k + '" onclick="window.__gorusmeOncelikSec(\'' + k + '\')" style="' + oncelikButonStil(k, aktif) + '">' + b.ikon + ' ' + b.ad + '</button>';
    };

    var html = '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-top:16px;">' +
      '<div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">' +
        '<div style="width:8px; height:24px; background:#0d9488; border-radius:4px;"></div>' +
        '<h3 style="margin:0; font-size:15px; font-weight:800; color:#0f172a;">📞 Görüşmeler (' + liste.length + ')</h3>' +
      '</div>' +
      '<div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:12px;">' +
        gorusmeEtiketHTML("sikayet", say.sikayet) + gorusmeEtiketHTML("veli", say.veli) + gorusmeEtiketHTML("ogrenci", say.ogrenci) +
      '</div>' +

      // Öncelik filtresi — formun üstünde
      '<div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin-bottom:12px;">' +
        '<span style="font-size:11px; font-weight:800; color:#64748b;">Öncelik Filtresi:</span>' +
        filtreButon("tumu", "Tümü") +
        filtreButon("acil", "🔴 Acil") +
        filtreButon("onemli", "🟡 Önemli") +
        filtreButon("genel", "🔵 Genel") +
      '</div>' +

      '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:6px;">' +
        '<div style="font-size:12px; font-weight:800; color:#0f172a;">Yeni Görüşme Ekle</div>' +
        // Öğrenci seçimi: yazdıkça arama + altında açılan liste (select kutusu kaldırıldı)
        '<div style="position:relative;">' +
          '<input type="text" id="__gg_ogrAra" placeholder="🔍 Öğrenci ara (yazdıkça listelenir)..." autocomplete="off" oninput="window.__gorusmeOgrAra()" onfocus="window.__gorusmeOgrAra()" onblur="window.__gorusmeOgrKapat()" style="' + stil + ' width:100%; box-sizing:border-box;">' +
          '<input type="hidden" id="__gg_ogr">' +
          '<div id="__gg_ogrListe" style="display:none; position:absolute; z-index:40; left:0; right:0; top:100%; margin-top:4px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; max-height:190px; overflow-y:auto; box-shadow:0 12px 28px rgba(15,23,42,0.14);"></div>' +
        '</div>' +
        '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
          '<select id="__gg_tur" style="' + stil + '">' + turSecenek + '</select>' +
          '<input type="date" id="__gg_tarih" value="' + sinavBugunKey() + '" style="' + stil + '">' +
          '<input type="text" id="__gg_veli" placeholder="Veli adı (opsiyonel)" style="' + stil + ' flex:1; min-width:140px;">' +
        '</div>' +
        // Öncelik seçimi: 🔴 Acil · 🟡 Önemli · 🔵 Genel (varsayılan: Genel)
        '<div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">' +
          '<span style="font-size:11px; font-weight:800; color:#64748b;">Öncelik:</span>' +
          oncelikButon("acil") + oncelikButon("onemli") + oncelikButon("genel") +
        '</div>' +
        '<textarea id="__gg_not" rows="2" placeholder="Görüşme notu..." style="' + stil + ' resize:vertical;"></textarea>' +
        '<div style="display:flex; justify-content:flex-end;">' +
          '<button type="button" onclick="window.__gorusmeEkleGlobal()" style="border:none; background:#0d9488; color:#fff; padding:6px 14px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Kaydet</button>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin:14px 0 8px;">' +
        '<div style="font-size:12px; font-weight:800; color:#0f172a;">Geçmiş Görüşmeler</div>' +
        '<input type="text" id="__ggAra" placeholder="🔍 Öğrenci / not ara..." oninput="window.__gorusmeTabAra()" style="' + stil + ' width:200px;">' +
      '</div>';

    if (!liste.length) {
      html += '<div style="padding:16px; color:#94a3b8; font-size:12px; text-align:center; border:1px dashed #e2e8f0; border-radius:8px;">Henüz görüşme kaydı yok. Yukarıdaki formdan ekleyebilirsiniz.</div>';
    } else {
      html += '<div id="__ggListe" style="display:flex; flex-direction:column; gap:6px; max-height:440px; overflow-y:auto;">';
      liste.forEach(function (g) {
        var t = gorusmeTur(g.tur);
        var ogr = ogrMap[g.ogrId];
        var ad = ogr ? String(ogr.adSoyad || ogr.ad || "") : "(silinmiş öğrenci)";
        var sinif = ogr ? String(ogr.sinif || "") : "";
        var oncKey = (g.oncelik && GORUSME_ONCELK[g.oncelik]) ? g.oncelik : "genel";
        var onc = GORUSME_ONCELK[oncKey];
        var aranacak = gorusmeTRKucuk(ad + " " + sinif + " " + (g.not || "") + " " + t.ad + " " + (g.veliAd || "") + " " + onc.ad);
        html += '<div class="gorusme-satir" data-oncelik="' + oncKey + '" data-ara="' + sinavEsc(aranacak) + '" style="display:flex; align-items:flex-start; gap:8px; padding:10px; background:#f8fafc; border:1px solid #f1f5f9; border-radius:8px; font-size:12px;">' +
          '<div style="width:4px; align-self:stretch; background:' + onc.renk + '; border-radius:4px; flex:none;"></div>' +
          '<div style="flex:1; min-width:0;">' +
            '<div style="font-weight:700; color:#1e293b;">' + sinavEsc(ad) +
              (sinif ? ' <span style="color:#64748b; font-size:11px; font-weight:600;">' + sinavEsc(sinif) + '</span>' : '') +
              ' <span style="background:' + onc.bg + '; color:' + onc.tx + '; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">' + onc.ikon + ' ' + onc.ad + '</span>' +
              ' <span style="background:' + t.bg + '; color:' + t.tx + '; padding:2px 6px; border-radius:4px; font-size:10px;">' + t.ikon + " " + t.ad +
              (g.veliAd ? " · " + sinavEsc(g.veliAd) : "") + '</span>' +
            '</div>' +
            '<div style="color:#475569; margin-top:2px; white-space:pre-wrap;">' + sinavEsc(g.not || "") + '</div>' +
            '<div style="color:#94a3b8; font-size:11px; margin-top:2px;">' + sinavEsc(g.tarih || "-") + '</div>' +
          '</div>' +
          '<button type="button" title="Kaydı sil" onclick="window.__gorusmeSil(\'' + gorusmeGuvenliId(g.id) + '\',\'' + gorusmeGuvenliId(g.ogrId) + '\')" style="border:none; background:#fee2e2; color:#991b1b; border-radius:6px; width:22px; height:22px; font-size:11px; font-weight:800; cursor:pointer; flex:none;">✕</button>' +
        '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    // Filtre durumu DOM enjekte edildikten sonra uygulanır (kaydet/sil sonrası korunur)
    setTimeout(function () {
      if (document.getElementById("__ggListe")) window.__gorusmeSatirFiltre();
    }, 0);
    return html;
  };

  window.__gorusmeEkleGlobal = function (oncelik) {
    var ogrEl = document.getElementById("__gg_ogr");
    var turEl = document.getElementById("__gg_tur");
    var tarihEl = document.getElementById("__gg_tarih");
    var veliEl = document.getElementById("__gg_veli");
    var notEl = document.getElementById("__gg_not");

    var ogrId = ogrEl ? String(ogrEl.value || "") : "";
    var not = notEl ? String(notEl.value || "").trim() : "";
    if (!ogrId) {
      alert("Görüşme için bir öğrenci seçin.");
      var araEl = document.getElementById("__gg_ogrAra");
      if (araEl) araEl.focus(); else if (ogrEl) ogrEl.focus();
      return;
    }
    if (!not) { alert("Görüşme notu boş olamaz."); if (notEl) notEl.focus(); return; }

    // Öncelik: parametre yoksa formdaki seçili buton; o da yoksa varsayılan "genel".
    var onc = (oncelik && GORUSME_ONCELK[oncelik]) ? oncelik
      : ((window.__ggOncelik && GORUSME_ONCELK[window.__ggOncelik]) ? window.__ggOncelik : "genel");

    var liste = gorusmeleriOku();
    liste.push({
      id: "g_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
      ogrId: ogrId,
      tur: (turEl && GORUSME_TUR[turEl.value]) ? turEl.value : "ogrenci",
      tarih: (tarihEl && tarihEl.value) ? tarihEl.value : sinavBugunKey(),
      veliAd: veliEl ? String(veliEl.value || "").trim() : "",
      not: not,
      oncelik: onc,
      olusturma: new Date().toISOString()
    });
    gorusmeleriYaz(liste);
    if (typeof window.gosterAlt === "function") window.gosterAlt("gorusmeler");
  };

  window.__gorusmeTabAra = function () {
    window.__gorusmeSatirFiltre();
  };

  // Metin araması + öncelik filtresi birlikte uygulanır.
  window.__gorusmeSatirFiltre = function () {
    var inp = document.getElementById("__ggAra");
    var q = gorusmeTRKucuk(inp ? inp.value : "");
    var f = (window.__ggFiltre && window.__ggFiltre !== "tumu") ? window.__ggFiltre : "tumu";
    document.querySelectorAll(".gorusme-satir").forEach(function (r) {
      var aranacak = gorusmeTRKucuk(r.getAttribute("data-ara") || "");
      var onc = r.getAttribute("data-oncelik") || "genel";
      var uygun = (!q || aranacak.indexOf(q) >= 0) && (f === "tumu" || onc === f);
      r.style.display = uygun ? "flex" : "none";
    });
  };

  // Liste filtre butonları: Tümü / 🔴 Acil / 🟡 Önemli / 🔵 Genel
  window.__gorusmeOncelikFiltre = function (k) {
    window.__ggFiltre = (["tumu", "acil", "onemli", "genel"].indexOf(k) >= 0) ? k : "tumu";
    document.querySelectorAll("[data-filt]").forEach(function (b) {
      var bk = b.getAttribute("data-filt");
      b.setAttribute("style", filtreButonStil(bk, bk === window.__ggFiltre));
    });
    window.__gorusmeSatirFiltre();
  };

  // Form içi öncelik seçimi (varsayılan: Genel); seçili buton kendi renginde dolu.
  window.__gorusmeOncelikSec = function (k) {
    window.__ggOncelik = GORUSME_ONCELK[k] ? k : "genel";
    document.querySelectorAll(".gg-onc-btn").forEach(function (b) {
      var bk = b.getAttribute("data-oncelik");
      b.setAttribute("style", oncelikButonStil(bk, bk === window.__ggOncelik));
    });
  };

  function filtreButonStil(k, aktif) {
    var renk = (k === "tumu") ? "#0d9488" : gorusmeOncelik(k).renk;
    var tx = (k === "tumu") ? "#0d9488" : gorusmeOncelik(k).tx;
    var doldurTx = (k === "tumu") ? "#ffffff" : gorusmeOncelik(k).doldurTx;
    return "border:1px solid " + (aktif ? renk : "#cbd5e1") + "; background:" + (aktif ? renk : "#ffffff") +
      "; color:" + (aktif ? doldurTx : tx) + "; padding:6px 12px; border-radius:999px; font-size:11px; font-weight:700; cursor:pointer;";
  }

  // --- Öğrenci araması: yazdıkça açılan liste (Türkçe karakter duyarlı) ---
  var ggOgrKaynak = [];

  function ggOgrHazirla(ogrenciler) {
    ggOgrKaynak = (ogrenciler || []).map(function (o) {
      var ad = String(o.adSoyad || o.ad || "");
      return {
        id: o.id,
        etiket: ad + (o.sinif ? " (" + o.sinif + ")" : ""),
        aranacak: gorusmeTRKucuk(ad + " " + String(o.sinif || ""))
      };
    });
  }

  window.__gorusmeOgrAra = function () {
    var inp = document.getElementById("__gg_ogrAra");
    var kutu = document.getElementById("__gg_ogrListe");
    var gizli = document.getElementById("__gg_ogr");
    if (!inp || !kutu) return;
    // Yazmaya başlandıysa eski seçim geçersiz olur
    if (gizli) gizli.value = "";
    var q = gorusmeTRKucuk(inp.value);
    var bulunan = [];
    for (var i = 0; i < ggOgrKaynak.length && bulunan.length < 50; i++) {
      if (!q || ggOgrKaynak[i].aranacak.indexOf(q) >= 0) bulunan.push({ idx: i, k: ggOgrKaynak[i] });
    }
    if (!bulunan.length) {
      kutu.innerHTML = '<div style="padding:10px; font-size:12px; color:#94a3b8; text-align:center;">Eşleşen öğrenci yok.</div>';
    } else {
      kutu.innerHTML = bulunan.map(function (b) {
        return '<div class="gg-ogr-satir" onmousedown="event.preventDefault();" onclick="window.__gorusmeOgrSec(' + b.idx + ')" style="padding:8px 10px; font-size:12px; color:#334155; cursor:pointer; border-bottom:1px solid #f1f5f9;">' + sinavEsc(b.k.etiket) + '</div>';
      }).join("");
    }
    kutu.style.display = "block";
  };

  window.__gorusmeOgrSec = function (idx) {
    var k = ggOgrKaynak[idx];
    if (!k) return;
    var gizli = document.getElementById("__gg_ogr");
    var inp = document.getElementById("__gg_ogrAra");
    var kutu = document.getElementById("__gg_ogrListe");
    if (gizli) gizli.value = String(k.id == null ? "" : k.id);
    if (inp) inp.value = k.etiket;
    if (kutu) kutu.style.display = "none";
  };

  window.__gorusmeOgrKapat = function () {
    // onmousedown.preventDefault sayesinde satıra tıklamada blur olmaz; yine de güvenli kapanış
    setTimeout(function () {
      var kutu = document.getElementById("__gg_ogrListe");
      if (kutu) kutu.style.display = "none";
    }, 150);
  };

  // === KÜTÜPHANE: SINIF BAZLI LİSTE ===
  // index.html'deki window.__ktListeCiz'i devralır (index.html değiştirilmez).
  // 200 öğrenci tek listede karmaşa yaratıyordu; Ders Yoklaması gibi sınıf
  // sınıf ayrılır. Tarih, arama ve gün ayarı index.html'in mevcut
  // __ktTarih / __ktAra / __ktEkran yardımcılarıyla uyumlu çalışır.
  var KT_GUN_KOD = ["paz", "pzt", "sal", "car", "per", "cum", "cmt"];
  var KT_SINIFSIZ = "Sınıfsız";

  function ktGunKodu(tarih) {
    var p = String(tarih || "").split("-");
    if (p.length !== 3) return "";
    var d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    return KT_GUN_KOD[d.getDay()] || "";
  }

  function ktAktifTarih() {
    return window.__ktSeciliTarih || sinavBugunKey();
  }

  // Eski { giris, cikis } kayıtları "Geldi" sayılır; saat/süre artık tutulmaz.
  function ktDurum(v) {
    if (v === "geldi" || v === "gelmedi" || v === "gec") return v;
    if (v && typeof v === "object" && v.giris) return "geldi";
    return "";
  }

  function ktSinifAdi(ogr) {
    return String((ogr && ogr.sinif) || KT_SINIFSIZ);
  }

  function ktOgrAd(ogr) {
    return ogr.adSoyad || ogr.ad || ogr.isim || "Öğrenci";
  }

  function ktSiniflar(ogrenciler) {
    var gorulen = {};
    ogrenciler.forEach(function (o) { gorulen[ktSinifAdi(o)] = true; });
    return Object.keys(gorulen).sort(function (a, b) {
      return a.localeCompare(b, "tr", { numeric: true });
    });
  }

  window.__ktSeciliSinif = window.__ktSeciliSinif || null;

  window.__ktSinifSec = function (sinif) {
    window.__ktSeciliSinif = sinif;
    window.__ktAramaMetni = "";
    window.__ktAramaHam = "";
    window.__ktListeCiz();
  };

  // Arama her tuşta listeyi yeniden çizer; imleç konumu korunur.
  window.__ktAra = function (v) {
    var once = document.getElementById("__ktArama");
    var imlec = once ? once.selectionStart : null;
    window.__ktAramaMetni = String(v || "").toLowerCase().trim();
    window.__ktAramaHam = String(v || "");
    window.__ktListeCiz();
    var inp = document.getElementById("__ktArama");
    if (inp) {
      inp.focus();
      if (imlec != null) {
        try { inp.setSelectionRange(imlec, imlec); } catch (e) {}
      }
    }
  };

  window.__ktListeCiz = function () {
    var el = document.getElementById("__ktListe");
    if (!el) return;

    var tarih = ktAktifTarih();
    var veri = sinavVeriOku();
    var gunler = veri.kutuphaneGunleri || {};
    var acikMi = gunler[ktGunKodu(tarih)] !== false;

    var html = '<div class="rounded-xl border border-slate-200 bg-white p-4">';

    // Tarih seçici
    html += '<div class="flex flex-wrap items-center gap-2 mb-4">';
    html += '<label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tarih:</label>';
    html += '<input type="date" id="__ktTarihInput" value="' + sinavEsc(tarih) + '" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/40" onchange="window.__ktTarih(this.value)" />';
    html += '</div>';

    if (!acikMi) {
      html += '<div class="text-center py-6"><p class="text-slate-500 text-[14px] font-medium">Bu gün kütüphane kapalı. Yukarıdaki gün ayarından açabilirsiniz.</p></div>';
      html += '</div>';
      el.innerHTML = html;
      return;
    }

    var tumOgrenciler = veri.ogrenciler || [];
    var siniflar = ktSiniflar(tumOgrenciler);
    if (siniflar.indexOf(window.__ktSeciliSinif) === -1) {
      window.__ktSeciliSinif = siniflar[0] || null;
    }
    var secili = window.__ktSeciliSinif;

    // Sınıf seçimi — Ders Yoklaması ile aynı desen
    if (siniflar.length > 0) {
      html += '<div class="flex flex-wrap gap-2 mb-4">';
      siniflar.forEach(function (s) {
        var a = s === secili;
        var st = a
          ? "background:#14b8a6;color:#fff;border-color:#14b8a6;"
          : "background:#fff;color:#0f766e;border-color:#99f6e4;";
        html += '<button type="button" class="rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors" style="' + st + '" data-sinif="' + sinavEsc(s) + '" onclick="window.__ktSinifSec(this.getAttribute(\'data-sinif\'))">' + sinavEsc(s) + '</button>';
      });
      html += '</div>';
    }

    // Arama (yalnızca seçili sınıf içinde)
    html += '<div class="mb-3">';
    html += '<input type="text" id="__ktArama" placeholder="🔍 Bu sınıfta öğrenci ara..." value="' + sinavEsc(window.__ktAramaHam || "") + '" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/40" oninput="window.__ktAra(this.value)" />';
    html += '</div>';

    if (!siniflar.length) {
      html += '<p class="text-slate-500 text-[13px] text-center py-4">Henüz kayıtlı öğrenci yok.</p>';
      html += '</div>';
      el.innerHTML = html;
      return;
    }

    var sinifOgrencileri = tumOgrenciler.filter(function (o) {
      return ktSinifAdi(o) === secili;
    }).sort(function (a, b) {
      return ktOgrAd(a).localeCompare(ktOgrAd(b), "tr", { numeric: true });
    });

    var arama = window.__ktAramaMetni || "";
    var ogrenciler = arama
      ? sinifOgrencileri.filter(function (o) { return ktOgrAd(o).toLowerCase().indexOf(arama) !== -1; })
      : sinifOgrencileri;

    // Özet yalnızca seçili sınıfı sayar (giriş/çıkış ve süre yok)
    var kayitlar = (veri.kutuphane && veri.kutuphane[tarih]) || {};
    var geldi = 0, gelmedi = 0, gec = 0;
    sinifOgrencileri.forEach(function (o) {
      var d = ktDurum(kayitlar[o.id]);
      if (d === "geldi") geldi++;
      else if (d === "gelmedi") gelmedi++;
      else if (d === "gec") gec++;
    });

    // Sınıf başlığı + sınıfın tümünü işaretle
    html += '<div class="flex flex-wrap items-center justify-between gap-2 mb-3">';
    html += '<div class="font-bold text-slate-800 text-[14px]">' + sinavEsc(secili || "-") + " — " + sinifOgrencileri.length + ' öğrenci' +
      (arama ? ' <span class="font-semibold text-slate-400 text-[12px]">(' + ogrenciler.length + ' sonuç)</span>' : '') + '</div>';
    if (sinifOgrencileri.length > 0) {
      html += '<div class="flex flex-wrap gap-2">';
      html += '<button type="button" class="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-bold text-teal-700 hover:bg-teal-100" onclick="window.__ktSinifToplu(\'geldi\')">✅ Tüm Sınıfı Geldi</button>';
      html += '<button type="button" class="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-700 hover:bg-red-100" onclick="window.__ktSinifToplu(\'gelmedi\')">❌ Tüm Sınıfı Gelmedi</button>';
      html += '</div>';
    }
    html += '</div>';

    // Özet
    html += '<div class="flex flex-wrap gap-2 mb-3 text-[11px]">';
    html += '<span style="padding:2px 8px;border-radius:99px;background:#dcfce7;color:#166534;font-weight:700;">Geldi: ' + geldi + '</span>';
    html += '<span style="padding:2px 8px;border-radius:99px;background:#fee2e2;color:#991b1b;font-weight:700;">Gelmedi: ' + gelmedi + '</span>';
    html += '<span style="padding:2px 8px;border-radius:99px;background:#fef3c7;color:#92400e;font-weight:700;">Geç: ' + gec + '</span>';
    html += '</div>';

    // Chip listesi
    if (!ogrenciler.length) {
      html += '<p class="text-slate-500 text-[13px] text-center py-4">Aramanıza uygun öğrenci bulunamadı.</p>';
    } else {
      html += '<div class="flex flex-wrap gap-2">';
      ogrenciler.forEach(function (o) {
        var ad = ktOgrAd(o);
        var durum = ktDurum(kayitlar[o.id]);
        var stil, etiket;
        if (durum === "geldi") {
          stil = "background:#22c55e;color:#fff;border-color:#22c55e;";
          etiket = " · Geldi";
        } else if (durum === "gelmedi") {
          stil = "background:#ef4444;color:#fff;border-color:#ef4444;";
          etiket = " · Gelmedi";
        } else if (durum === "gec") {
          stil = "background:#f59e0b;color:#fff;border-color:#f59e0b;";
          etiket = " · Geç";
        } else {
          stil = "background:#fff;color:#475569;border-color:#cbd5e1;";
          etiket = "";
        }
        html += '<button type="button" class="rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors" style="' + stil + '" data-ogr="' + sinavEsc(o.id) + '" onclick="window.__ktChip(this.getAttribute(\'data-ogr\'))">' + sinavEsc(ad) + etiket + '</button>';
      });
      html += '</div>';
    }

    html += '</div>';
    el.innerHTML = html;
  };

  // Chip döngüsü: Boş -> Geldi -> Gelmedi -> Geç -> Boş
  window.__ktChip = function (ogrId) {
    var tarih = ktAktifTarih();
    var veri = sinavVeriOku();
    if (!veri.kutuphane) veri.kutuphane = {};
    if (!veri.kutuphane[tarih]) veri.kutuphane[tarih] = {};

    var sira = ["", "geldi", "gelmedi", "gec"];
    var idx = sira.indexOf(ktDurum(veri.kutuphane[tarih][ogrId]));
    var yeni = sira[(idx + 1) % sira.length];

    if (yeni === "") delete veri.kutuphane[tarih][ogrId];
    else veri.kutuphane[tarih][ogrId] = yeni;

    sinavVeriYaz(veri);
    window.__ktListeCiz();
  };

  // Sınıfın tamamını tek tuşla işaretle
  window.__ktSinifToplu = function (durum) {
    var sinif = window.__ktSeciliSinif;
    if (!sinif || (durum !== "geldi" && durum !== "gelmedi")) return;
    var etiket = durum === "geldi" ? "Geldi" : "Gelmedi";
    if (!confirm("«" + sinif + "» sınıfının tamamını '" + etiket + "' olarak işaretlemek istiyor musunuz?")) return;

    var tarih = ktAktifTarih();
    var veri = sinavVeriOku();
    if (!veri.kutuphane) veri.kutuphane = {};
    if (!veri.kutuphane[tarih]) veri.kutuphane[tarih] = {};

    var sayac = 0;
    (veri.ogrenciler || []).forEach(function (o) {
      if (ktSinifAdi(o) !== sinif) return;
      veri.kutuphane[tarih][o.id] = durum;
      sayac++;
    });

    sinavVeriYaz(veri);
    window.__ktListeCiz();
    alert(sayac + " öğrenci '" + etiket + "' olarak işaretlendi.");
  };

  // === YÖNETİM KAYIT KALICILIĞI (KRİTİK DÜZELTME) ===
  // app.js'te ogrenciEkle / ogretmenEkle / ogrenciGuncelle bellekte değişiklik yapıp
  // saveDB() çağırmıyor; eklenen kayıt sayfa yenilenince kayboluyordu. Bu sarmalayıcı
  // yalnızca gerçek bir değişiklik olduğunda yazar (doğrulama hatasında yazmaz).
  (function yonetimKayitKaliciligi() {
    function sar(ad, dizi) {
      var orijinal = window[ad];
      if (typeof orijinal !== "function" || orijinal.__ksKaliciSarmal) return;
      var sarmal = function () {
        var once = "";
        try { once = JSON.stringify(DB[dizi] || []); } catch (e) { once = ""; }
        var sonuc = orijinal.apply(this, arguments);
        var sonra = "";
        try { sonra = JSON.stringify(DB[dizi] || []); } catch (e) { sonra = ""; }
        if (sonra !== once && typeof saveDB === "function") saveDB();
        return sonuc;
      };
      sarmal.__ksKaliciSarmal = true;
      window[ad] = sarmal;
    }
    sar("ogrenciEkle", "ogrenciler");
    sar("ogretmenEkle", "ogretmenler");
    sar("ogrenciGuncelle", "ogrenciler");
  })();

  // === AKILLI SEÇİM KUTULARI (OTOMATİK TAMAMLAMA) ===
  // Kapsam: yalnızca Birebir Ders Planla (#f-ogrenci, #f-ogretmen) ve İstek Havuzu (#h-ogrenci).
  // Öğrenci/öğretmen ekleme-düzenleme modallarındaki ad alanlarına (y-ad, o-ad, d-ad) DOKUNULMAZ.
  (function akilliSecimBaslat() {
    var OGRENCI_SEC = "#f-ogrenci, #h-ogrenci";
    var OGRETMEN_SEC = "#f-ogretmen";

    function trNorm(s) {
      return String(s == null ? "" : s).toLowerCase()
        .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
        .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
        .replace(/\s+/g, " ").trim();
    }
    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function ogrAd(o) { return String((o && (o.adSoyad || o.ad)) || "").trim(); }
    function veri() { return (typeof veriOku === "function") ? veriOku() : sinavVeriOku(); }
    function bildir(input) {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    var acikListe = null;
    document.addEventListener("click", function (e) {
      if (!acikListe) return;
      if (acikListe.contains(e.target) || acikListe.__arama === e.target) return;
      acikListe.style.display = "none";
      acikListe = null;
    });

    // --- 1. ÖĞRETMEN: AÇILIR LİSTE ---
    function ogretmenKur(input) {
      input.style.display = "none";
      var select = document.createElement("select");
      select.className = input.className;
      input.parentNode.insertBefore(select, input.nextSibling);
      select.addEventListener("change", function () {
        input.value = select.value;
        bildir(input);
      });
      return select;
    }

    function ogretmenDoldur(input, select, ogretmenler) {
      var mevcut = input.value || "";
      var opts = ['<option value="">Öğretmen seçin...</option>'];
      var varMi = false;
      ogretmenler.forEach(function (o) {
        var ad = String((o && o.ad) || "").trim();
        if (!ad) return;
        if (trNorm(ad) === trNorm(mevcut)) varMi = true;
        opts.push('<option value="' + esc(ad) + '">' + esc(ad) + (o.brans ? " (" + esc(o.brans) + ")" : "") + "</option>");
      });
      if (mevcut && !varMi) {
        // Listede olmayan ad serbest metindir: temizle (yalnızca listeden seçim)
        input.value = "";
        mevcut = "";
        bildir(input);
      }
      var imza = opts.join("");
      if (select.getAttribute("data-imza") !== imza && document.activeElement !== select) {
        select.innerHTML = imza;
        select.setAttribute("data-imza", imza);
      }
      select.value = mevcut;
    }

    // --- 2. ÖĞRENCİ: ARAMALI SEÇİM ---
    function ogrenciKur(input) {
      input.style.display = "none";
      var sarmal = document.createElement("div");
      sarmal.style.position = "relative";
      sarmal.style.width = "100%";

      var arama = document.createElement("input");
      arama.type = "text";
      arama.className = input.className;
      arama.placeholder = "🔍 Öğrenci ara...";
      arama.autocomplete = "off";
      arama.style.width = "100%";
      arama.style.boxSizing = "border-box";
      arama.value = input.value || "";
      arama.setAttribute("data-son", input.value || "");

      var liste = document.createElement("div");
      liste.style.position = "absolute";
      liste.style.top = "100%";
      liste.style.left = "0";
      liste.style.right = "0";
      liste.style.background = "#fff";
      liste.style.border = "1px solid #e2e8f0";
      liste.style.borderRadius = "8px";
      liste.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      liste.style.maxHeight = "200px";
      liste.style.overflowY = "auto";
      liste.style.zIndex = "9999";
      liste.style.display = "none";
      liste.__arama = arama;
      liste.__sonuclar = [];

      arama.addEventListener("input", function () { ogrenciAra(input, arama, liste); });
      arama.addEventListener("focus", function () { if (arama.value.trim()) ogrenciAra(input, arama, liste); });
      arama.addEventListener("blur", function () { setTimeout(function () { liste.style.display = "none"; }, 160); });

      liste.addEventListener("mouseover", function (e) {
        var s = e.target && e.target.closest ? e.target.closest("[data-idx]") : null;
        if (s) s.style.background = "#f8fafc";
      });
      liste.addEventListener("mouseout", function (e) {
        var s = e.target && e.target.closest ? e.target.closest("[data-idx]") : null;
        if (s) s.style.background = "#fff";
      });
      liste.addEventListener("click", function (e) {
        var satir = e.target && e.target.closest ? e.target.closest("[data-idx]") : null;
        if (!satir) return;
        ogrenciSec(input, arama, liste, liste.__sonuclar[parseInt(satir.getAttribute("data-idx"), 10)]);
      });
      arama.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        ogrenciSec(input, arama, liste, liste.__sonuclar[0]);
      });

      sarmal.appendChild(arama);
      sarmal.appendChild(liste);
      input.parentNode.insertBefore(sarmal, input.nextSibling);
      return { arama: arama, liste: liste };
    }

    // Değer YALNIZCA listeden seçimle yazılır (serbest metin gizli input'a geçmez)
    function ogrenciSec(input, arama, liste, o) {
      if (!o) return;
      var ad = ogrAd(o);
      input.value = ad;
      arama.value = ad;
      arama.setAttribute("data-son", ad);
      liste.style.display = "none";
      acikListe = null;
      bildir(input);
    }

    function ogrenciAra(input, arama, liste) {
      var kaynak = input.__akilliOgrenciler || [];
      var q = trNorm(arama.value);
      var sonuc = [];
      if (q) {
        sonuc = kaynak.filter(function (o) {
          return trNorm(ogrAd(o)).indexOf(q) !== -1 || trNorm(o && o.sinif).indexOf(q) !== -1;
        }).slice(0, 10);
      }
      liste.__sonuclar = sonuc;
      if (!sonuc.length) {
        liste.innerHTML = '<div style="padding:10px; color:#94a3b8; font-size:12px; text-align:center;">' + (q ? "Öğrenci bulunamadı." : "Yazmaya başlayın...") + "</div>";
      } else {
        liste.innerHTML = sonuc.map(function (o, i) {
          return '<div data-idx="' + i + '" style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #f1f5f9; font-size:13px; background:#fff;">' +
            '<div style="font-weight:700; color:#0f172a;">' + esc(ogrAd(o)) + "</div>" +
            '<div style="font-size:11px; color:#64748b;">' + esc(o.sinif) + "</div></div>";
        }).join("");
      }
      liste.style.display = q ? "block" : "none";
      if (q) acikListe = liste; else if (acikListe === liste) acikListe = null;

      // SERBEST METİN YOK: yazılan metin seçili addan farklıysa gizli input temizlenir;
      // böylece app.js'in planla() içindeki "bulunamazsa yeni kayıt aç" dalı tetiklenmez.
      if (input.value && trNorm(input.value) !== q) {
        input.value = "";
        arama.setAttribute("data-son", "");
        bildir(input);
      }
    }

    // app.js'in programatik yazdığı değerler (düzenleme, forma aktarma, hızlı seçim) listeye karşı doğrulanır
    function ogrenciEsitle(input, kutu, ogrenciler) {
      var deger = input.value || "";
      if (deger) {
        var varMi = ogrenciler.some(function (o) { return trNorm(ogrAd(o)) === trNorm(deger); });
        if (!varMi) { input.value = ""; deger = ""; bildir(input); }
      }
      var son = kutu.arama.getAttribute("data-son") || "";
      if (deger !== son && document.activeElement !== kutu.arama) {
        kutu.arama.value = deger;
        kutu.arama.setAttribute("data-son", deger);
      }
    }

    function tik() {
      var v = veri() || {};
      var ogrenciler = Array.isArray(v.ogrenciler) ? v.ogrenciler : [];
      var ogretmenler = Array.isArray(v.ogretmenler) ? v.ogretmenler : [];

      document.querySelectorAll(OGRETMEN_SEC).forEach(function (input) {
        if (input.tagName !== "INPUT") return;
        if (!input.__akilliSelect) input.__akilliSelect = ogretmenKur(input);
        ogretmenDoldur(input, input.__akilliSelect, ogretmenler);
      });

      document.querySelectorAll(OGRENCI_SEC).forEach(function (input) {
        if (input.tagName !== "INPUT" || input.type === "hidden") return;
        input.__akilliOgrenciler = ogrenciler;
        if (!input.__akilliKutu) input.__akilliKutu = ogrenciKur(input);
        ogrenciEsitle(input, input.__akilliKutu, ogrenciler);
      });
    }

    tik();
    setInterval(tik, 500);
  })();

  // === SINIF-SAATI-SAYIM-YAMASI ===
  // app.js'te öğretmen listesindeki sayaç "(t.avail.sinif || []).length" ile hesaplanıyor.
  // Oysa avail.sinif bir NESNE (slot → sınıf adı); nesnenin .length'i yoktur, bu yüzden her
  // öğretmenin altında "undefined sınıf saati" yazıyordu. Nesneye sayılamayan (enumerable
  // olmayan) bir length getter'ı tanımlanır: doğru sayı = anahtar adedi, veri yoksa 0.
  // Non-enumerable olduğu için Object.keys/for-in/JSON.stringify davranışı değişmez; slot
  // erişimleri (sinif["0-1"], "0-1" in sinif) aynen çalışır.
  function sinifSayisiHazirla() {
    try {
      var liste = (window.DB && Array.isArray(window.DB.ogretmenler)) ? window.DB.ogretmenler : [];
      liste.forEach(function (t) {
        if (!t || !t.avail || !t.avail.sinif) return;
        var s = t.avail.sinif;
        if (typeof s !== "object" || Array.isArray(s)) return; // dizi ise length zaten doğru
        if (Object.prototype.hasOwnProperty.call(s, "length")) return;
        Object.defineProperty(s, "length", {
          configurable: true,
          get: function () { return Object.keys(this).length; }
        });
      });
    } catch (e) { /* sayaç yalnız görünüm içindir; hata render'ı engellemesin */ }
  }
  // === ETIKET-YAMASI ===
  // Öğretmen kartı alt satırı: "4 sınıf saati · 2 kapalı" → "4 ders saati · 2 saat boş".
  // Değişim, HTML üretildiği ANDA (her ogretmenTab render'ında) yapılır; bu yüzden ayrıca
  // setInterval veya MutationObserver ile DOM'u taramaya gerek yoktur — yeniden render
  // edilen her kart aynı sarmalayıcıdan geçtiği için etiket kalıcı olarak düzeltilmiş olur.
  // Desendeki "· " öneki yalnız bu sayaç satırını hedefler (ör. çizelgedeki "Kapalı"
  // açıklaması veya başka metinler etkilenmez).
  function etiketleriDuzelt(html) {
    if (typeof html !== "string") return html;
    return html
      .replace(/· (\d+) sınıf saati/g, "· $1 ders saati")
      .replace(/· (\d+) kapalı/g, "· $1 saat boş");
  }

  // === BOS-SAAT-YAMASI ===
  // Kart alt satırındaki eski sayı KAPALI (musait) saat sayısıydı; istenen, gerçekten BOŞ
  // olan saat sayısıdır. Toplam slot, çizelgenin kendi başlıklarından türetilir:
  //   GUNLER (7 gün) × KISA_KOD (11 ders saati) = 77 slot.
  // Boş = toplam − (sınıf dersi + kapalı) saatler. Anahtarlar tekilleştirilir ve yalnız
  // çizelgede gerçekten çizilen geçerli slotlar sayılır (eski/bozuk anahtarlar sayılmaz).
  function haftalikToplamSaat() {
    var gun = (window.GUNLER && window.GUNLER.length) ? window.GUNLER.length : 7;
    var kod = (window.KISA_KOD && window.KISA_KOD.length) ? window.KISA_KOD.length : 11;
    return gun * kod;
  }
  function slotGecerliMi(k) {
    var p = String(k).split("-");
    if (p.length < 2) return false;
    var g = parseInt(p[0], 10);
    var gun = (window.GUNLER && window.GUNLER.length) ? window.GUNLER.length : 7;
    if (isNaN(g) || g < 0 || g >= gun) return false;
    var kodlar = window.KISA_KOD;
    if (!Array.isArray(kodlar) || !kodlar.length) return true;
    for (var i = 0; i < kodlar.length; i++) {
      if (String(kodlar[i].no) === String(p[1])) return true;
    }
    return false;
  }
  function bosSaatSayisi(t) {
    var toplam = haftalikToplamSaat();
    if (!t || !t.avail) return toplam;
    var dolu = {};
    var ekle = function (k) { if (slotGecerliMi(k)) dolu[String(k)] = 1; };
    var s = t.avail.sinif;
    if (Array.isArray(s)) s.forEach(ekle);
    else if (s && typeof s === "object") Object.keys(s).forEach(ekle);
    if (Array.isArray(t.avail.musait)) t.avail.musait.forEach(ekle);
    var bos = toplam - Object.keys(dolu).length;
    return bos < 0 ? 0 : bos;
  }
  // app.js çıktısı: "· 4 ders saati · 2 saat boş". Her öğretmen satırında "ders saati"
  // bölümü DAİMA vardır (kapalı sayısı 0 ise ikinci bölüm hiç basılmaz); bu yüzden
  // eşleşmeler öğretmen listesiyle birebir hizalıdır ve sayaç sırayla eşlenir.
  function bosSaatEtiketleri(html) {
    if (typeof html !== "string") return html;
    var liste = (window.DB && Array.isArray(window.DB.ogretmenler)) ? window.DB.ogretmenler : null;
    if (!liste) return html;
    var i = 0;
    return html.replace(/· (\d+) ders saati(?: · \d+ saat boş)?/g, function (m, ders) {
      var t = liste[i++];
      if (!t) return m;
      return "· " + ders + " ders saati · " + bosSaatSayisi(t) + " saat boş";
    });
  }
  (function () {
    sinifSayisiHazirla();
    var orijinal = window.ogretmenTab;
    if (typeof orijinal !== "function" || orijinal.__sinifSayisiYamasi) return;
    var sarmal = function () {
      // Excel içe aktarma / yeni kayıt sonrası oluşan nesneler için her render'da tazele
      sinifSayisiHazirla();
      return bosSaatEtiketleri(etiketleriDuzelt(orijinal.apply(this, arguments)));
    };
    sarmal.__sinifSayisiYamasi = true;
    window.ogretmenTab = sarmal;
  })();

  // === BRANS-DERS-CIFT-YON ===
  // Birebir Ders Planla formunda "Ders" (#f-ders) ile "Öğretmen" (#f-ogretmen) alanını
  // çift yönlü bağlar:
  //   ders değişimi     → öğretmen listesi yalnız o dersi verebilen branşlarla doldurulur
  //   öğretmen değişimi → ders, öğretmenin branşının ilk ders koduna ayarlanır
  // NOT: #f-ogretmen index.html'de bir INPUT'tur; görünen kutu akilliSecimBaslat modülünün
  // ürettiği select'tir (input.__akilliSelect). Bu yüzden filtre o select üzerinde yapılır.
  // app.js yenile() sırasında bu alanları yeniden doldurabildiği için bağ 500 ms'lik
  // interval ile idempotent biçimde tazelenir. Periyodik kontrolde kullanıcının seçimi
  // ZORLA değiştirilmez; yalnızca seçenekler filtrelenir ve uyumsuz eşleşme uyarılır.
  (function () {
    // Ders kodu → o dersi verebilecek branşlar (mat öğretmeni mat+geo, tur öğretmeni tur+edb)
    var HARITA = {
      mat: ["mat", "geo"],
      geo: ["geo", "mat"],
      fiz: ["fiz"],
      kim: ["kim"],
      biy: ["biy"],
      tur: ["tur", "edb"],
      edb: ["edb", "tur"],
      cgr: ["cgr"],
      tar: ["tar"],
      ing: ["ing"]
    };
    // Branş adı uzun yazılmışsa kanonik koda indirgenir ("Matematik" → "mat")
    var AD_ES = { matematik: "mat", geometri: "geo", fizik: "fiz", kimya: "kim", biyoloji: "biy", turkce: "tur", edebiyat: "edb", cografya: "cgr", tarih: "tar", ingilizce: "ing" };

    function norm(v) {
      var m = { "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u", "ş": "s", "Ş": "s", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c" };
      return String(v == null ? "" : v).replace(/[ıİğĞüÜşŞöÖçÇ]/g, function (c) { return m[c]; })
        .replace(/[Iİ]/g, "i").toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    /* ÇAKIŞMA GÖSTERGESİ: aynı branş-ders haritası dosya sonundaki sürükle-bırak modülünde
       de kullanılır; ikinci bir kopya (drift) oluşmasın diye buradan SALT-OKUMA yayınlanır. */
    window.__ksBransHarita = HARITA;
    window.__ksBransNorm = norm;
    window.__ksBransKodu = bransKodu; /* norm + AD_ES: "Türkçe" → "tur", "Kimya" → "kim" */
    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function ogretmenAd(t) { return String((t && (t.ad || t.adSoyad)) || "").trim(); }
    function ogretmenler() {
      if (window.DB && Array.isArray(window.DB.ogretmenler)) return window.DB.ogretmenler;
      var v = (typeof veriOku === "function") ? veriOku() : sinavVeriOku();
      return (v && Array.isArray(v.ogretmenler)) ? v.ogretmenler : [];
    }
    function dersAdi(id) {
      var d = (window.DERS || {})[id];
      return d && d.ad ? d.ad : String(id || "");
    }
    function bransKodu(t) {
      var b = norm(t && t.brans);
      if (AD_ES[b]) b = AD_ES[b];
      return b;
    }
    function dersKodu(v) { return norm(v); }
    function dersBranslari(dersId) {
      var d = dersKodu(dersId);
      return HARITA[d] ? HARITA[d].slice() : (d ? [d] : []);
    }
    function uygunMu(t, dersId) {
      var b = bransKodu(t);
      if (!b || !dersId) return false; // FAIL-CLOSED: branşsız öğretmen hiçbir derse atanamaz
      return dersBranslari(dersId).indexOf(b) >= 0;
    }
    function ogretmenBul(ad) {
      var a = norm(ad);
      if (!a) return null;
      return ogretmenler().filter(function (t) { return norm(ogretmenAd(t)) === a; })[0] || null;
    }
    // Branşın haritadaki ilk ders kodu: önce birebir anahtar (geo→geo, edb→edb),
    // yoksa branşı içeren ilk anahtar.
    function bransinIlkDersi(b) {
      if (!b) return "";
      if (HARITA[b]) return b;
      var anahtarlar = Object.keys(HARITA);
      for (var i = 0; i < anahtarlar.length; i++) {
        if (HARITA[anahtarlar[i]].indexOf(b) >= 0) return anahtarlar[i];
      }
      return "";
    }

    // Uyarı bandı: form grid'inin hemen altında, bir kez oluşturulur (idempotent)
    function uyariKutu() {
      var el = document.getElementById("__ksBransUyari");
      if (el) return el;
      var ogrt = document.getElementById("f-ogretmen");
      if (!ogrt) return null;
      var grid = ogrt.closest ? ogrt.closest(".grid") : null;
      var hedef = grid || (ogrt.parentNode && ogrt.parentNode.parentNode);
      if (!hedef || !hedef.insertAdjacentHTML) return null;
      hedef.insertAdjacentHTML("afterend",
        '<div id="__ksBransUyari" style="display:none;margin-top:12px;padding:10px 12px;border:1px solid #fcd34d;background:#fffbeb;color:#92400e;border-radius:10px;font-size:12px;font-weight:600;line-height:1.5;"></div>');
      return document.getElementById("__ksBransUyari");
    }
    function uyariYaz(ders, mevcutAd, mevcutT, uygunDegil, uygunlar) {
      var el = uyariKutu();
      if (!el) return;
      var mesaj = "";
      if (ders && mevcutAd && uygunDegil) {
        var alternatif = "";
        if (mevcutT) {
          var b = bransKodu(mevcutT);
          alternatif = (HARITA[b] || (b ? [b] : [])).map(dersAdi).join(", ");
        }
        mesaj = "⚠️ <b>" + esc(mevcutAd) + "</b> öğretmeninin branşı <b>" + esc(dersAdi(ders)) + "</b> dersine uygun değil; bu ders kaydedilemez." +
          (alternatif ? " Bu öğretmenin verebileceği dersler: <b>" + esc(alternatif) + "</b>." : "");
      } else if (ders && !uygunlar.length) {
        mesaj = "ℹ️ <b>" + esc(dersAdi(ders)) + "</b> dersini verebilecek branşta kayıtlı öğretmen yok.";
      }
      if (!mesaj) {
        if (el.style.display !== "none") { el.style.display = "none"; el.innerHTML = ""; }
        return;
      }
      if (el.innerHTML !== mesaj) el.innerHTML = mesaj;
      el.style.display = "block";
    }

    // #f-ders select'ini istenen koda ayarlar; seçenek yoksa DERSLER'den ekler
    function dersAyarla(kod) {
      var dersEl = document.getElementById("f-ders");
      if (!dersEl || !kod) return;
      var varMi = false;
      for (var i = 0; i < dersEl.options.length; i++) {
        if (String(dersEl.options[i].value) === String(kod)) { varMi = true; break; }
      }
      if (!varMi && window.DERS && window.DERS[kod]) {
        var opt = document.createElement("option");
        opt.value = kod;
        opt.textContent = window.DERS[kod].ad || kod;
        dersEl.appendChild(opt);
      }
      dersEl.value = kod;
    }

    // Öğretmen select'inin seçeneklerini derse göre filtreler.
    // zorlaSec=true → ders değişimi: seçili öğretmen uymuyorsa ilk uygun (yoksa boş).
    // zorlaSec=false → periyodik kontrol: seçim korunur, yalnız seçenekler + uyarı tazelenir.
    function ogretmenTazele(zorlaSec) {
      var input = document.getElementById("f-ogretmen");
      var dersEl = document.getElementById("f-ders");
      if (!input || !dersEl) return;
      var sec = input.__akilliSelect;
      if (!sec || !sec.parentNode) return; // akilliSecimBaslat select'i henüz kurmadı

      var ders = String(dersEl.value || "").trim();
      var tumu = ogretmenler();
      var uygunlar = ders ? tumu.filter(function (t) { return uygunMu(t, ders); }) : tumu.slice();
      var mevcutAd = String(input.value || "").trim();
      var mevcutT = mevcutAd ? ogretmenBul(mevcutAd) : null;

      // Ders değişiminde uyumsuz seçim ilk uygun öğretmene (yoksa boş) çekilir.
      // app.js'in olay dinleyicisi yok; değer doğrudan yazılır (planla() bu değeri okur).
      // Olay dispatch edilmediği için kendi change dinleyicimiz tetiklenmez (döngü yok).
      if (zorlaSec && ders && mevcutAd && (!mevcutT || !uygunMu(mevcutT, ders))) {
        var ilk = uygunlar[0] || null;
        mevcutAd = ilk ? ogretmenAd(ilk) : "";
        mevcutT = ilk;
        input.value = mevcutAd;
      }

      var opts = ['<option value="">Öğretmen seçin...</option>'];
      uygunlar.forEach(function (t) {
        var ad = ogretmenAd(t);
        if (!ad) return;
        opts.push('<option value="' + esc(ad) + '">' + esc(ad) + (t.brans ? " (" + esc(t.brans) + ")" : "") + "</option>");
      });
      // Uyarı yalnız KAYITLI ve branşı uymayan öğretmen için: kayıtsız ad planla() sırasında
      // dersin branşıyla yeni öğretmen olarak açılır (app.js), bu yüzden uyumsuz sayılmaz.
      var uygunDegil = !!(ders && mevcutT && !uygunMu(mevcutT, ders));
      var listede = uygunlar.some(function (t) { return norm(ogretmenAd(t)) === norm(mevcutAd); });
      if (mevcutAd && !listede) {
        // Seçim zorla değiştirilmez; uyumsuz/eksik kayıt listede kalır ki kutu boşalmasın
        opts.push('<option value="' + esc(mevcutAd) + '">' + esc(mevcutAd) + (uygunDegil ? " ⚠ branş uyumsuz" : "") + "</option>");
      }
      var imza = opts.join("");
      if (sec.innerHTML !== imza && document.activeElement !== sec) {
        var tamImza = sec.getAttribute("data-imza");
        sec.innerHTML = imza;
        sec.value = mevcutAd;
        // akilliSecimBaslat'ın 500 ms'lik doldurucusu aynı (tam) listeyi tekrar yazmasın:
        // imza karşılaştırması bu değere bakar; değer korununca yeniden yazma olmaz.
        if (tamImza) sec.setAttribute("data-imza", tamImza);
      } else if (document.activeElement !== sec && sec.value !== mevcutAd) {
        sec.value = mevcutAd;
      }

      uyariYaz(ders, mevcutAd, mevcutT, uygunDegil, uygunlar);
    }

    function dersDegisti() {
      ogretmenTazele(true);
    }

    function ogretmenDegisti() {
      var input = document.getElementById("f-ogretmen");
      var dersEl = document.getElementById("f-ders");
      if (!input || !dersEl) return;
      var t = ogretmenBul(String(input.value || "").trim());
      if (t) {
        var hedef = bransinIlkDersi(bransKodu(t));
        if (hedef) dersAyarla(hedef);
      }
      ogretmenTazele(false); // yeni derse göre liste + uyarı tazelenir
    }

    function tik() {
      var dersEl = document.getElementById("f-ders");
      var input = document.getElementById("f-ogretmen");
      if (!dersEl || !input) return;
      if (!dersEl.__ksCiftYonBagli) {
        dersEl.__ksCiftYonBagli = true;
        dersEl.addEventListener("change", dersDegisti);
      }
      if (!input.__ksCiftYonBagli) {
        input.__ksCiftYonBagli = true;
        input.addEventListener("change", ogretmenDegisti);
      }
      if (!input.__akilliSelect) return; // akilliSecimBaslat kurana kadar bekle
      ogretmenTazele(false);
    }

    tik();
    setInterval(tik, 500);

    /* === ODEV-BRANS-CIFT-YON ===
       Ödev formuna (index.html: __odEkran) birebir formun çift yönlü kuralını uygular:
         Sınıf/Öğrenci  → o sınıfta dersi olan öğretmenler (avail.sinif slot→sınıf kaydı)
         Ders           → yalnız o dersi verebilen branşlar (uygunMu)
         Öğretmen       → branşın ilk dersi otomatik seçilir (bransinIlkDersi)
       Ders listesi tüm dersleri içerir (birebir form #f-ders gibi); böylece ders
       değiştirilerek sınıftaki her branşa ulaşılabilir ve öğretmen listesi her zaman
       görünen dersle uyumlu kalır.
       Bağlanan alanlar:
         Sınıfa Ödev   : #__odSinif → #__odOgretmen → #__odDers
         Bireysel Ödev : #__odOgr   → #__odOgretmenB → #__odDersB
       index.html'deki select onchange nitelikleri window.__od*Degisti fonksiyonlarını
       çağırdığı için o fonksiyonlar burada sarılır; ayrıca aynı select'lere change
       listener eklenir (form her yeniden çizildiğinde yeniden bağlanır).
       Tüm yazımlar data-od-imza karşılaştırmalıdır: periyodik tazeleme kullanıcının
       seçimini bozmaz, yalnızca seçenek listelerini tutarlı tutar. */
    (function () {
      var FORMLAR = {
        sinif: { kaynak: "__odSinif", ogretmen: "__odOgretmen", ders: "__odDers" },
        bireysel: { kaynak: "__odOgr", ogretmen: "__odOgretmenB", ders: "__odDersB" }
      };
      var DERSLERI = window.DERS || {};

      function eleman(id) { return id ? document.getElementById(id) : null; }

      function odVeri() {
        if (window.DB && typeof window.DB === "object") return window.DB;
        try {
          return JSON.parse(localStorage.getItem(window.LS_KEY || "yksOto_arsiv_v1") || "{}");
        } catch (e) { return {}; }
      }

      // Ders değeri iki biçimde gelebilir: kod ("mat") veya ad ("MATEMATİK").
      function odDersKodu(ham) {
        var x = String(ham == null ? "" : ham).trim();
        if (!x) return "";
        var n = norm(x);
        if (DERSLERI[n]) return n;
        var anahtarlar = Object.keys(DERSLERI);
        for (var i = 0; i < anahtarlar.length; i++) {
          var d = DERSLERI[anahtarlar[i]];
          if (d && norm(d.ad) === n) return anahtarlar[i];
        }
        if (AD_ES[n]) return AD_ES[n];
        return HARITA[n] ? n : "";
      }

      function odDersAdi(kod) {
        var d = DERSLERI[kod];
        return d && d.ad ? d.ad : String(kod || "");
      }

      // Formun sınıfı: Sınıfa Ödev'de seçili sınıf, Bireysel'de öğrencinin sınıfı.
      function odSinifAdi(form) {
        var f = FORMLAR[form];
        if (!f) return "";
        var kaynak = eleman(f.kaynak);
        if (!kaynak) return "";
        if (form === "sinif") return String(kaynak.value || "").trim();
        var id = String(kaynak.value || "");
        if (!id) return "";
        var liste = odVeri().ogrenciler || [];
        for (var i = 0; i < liste.length; i++) {
          if (liste[i] && String(liste[i].id) === id) return String(liste[i].sinif || "").trim();
        }
        return "";
      }

      // "10. SINIF" ≡ "10.SINIF" — norm aksan/boşluk/noktalama duyarsızdır.
      function odSiniftaMi(t, sinif) {
        if (!sinif) return true;
        var av = t && t.avail && t.avail.sinif;
        if (!av || typeof av !== "object" || Array.isArray(av)) return false;
        var hedef = norm(sinif);
        var anahtarlar = Object.keys(av);
        for (var i = 0; i < anahtarlar.length; i++) {
          var v = av[anahtarlar[i]];
          if (v && norm(v) === hedef) return true;
        }
        return false;
      }

      function odSinifOgretmenleri(sinif) {
        var tum = ogretmenler();
        if (!sinif) return tum.slice();
        return tum.filter(function (t) { return odSiniftaMi(t, sinif); });
      }

      function odOgretmenBul(id) {
        if (!id) return null;
        var liste = ogretmenler();
        for (var i = 0; i < liste.length; i++) {
          if (String(liste[i] && liste[i].id) === String(id)) return liste[i];
        }
        return null;
      }

      function odSecenekYaz(sel, html, deger) {
        if (!sel) return;
        var imza = sel.getAttribute ? sel.getAttribute("data-od-imza") : null;
        if (imza !== html) {
          sel.innerHTML = html;
          if (sel.setAttribute) sel.setAttribute("data-od-imza", html);
        }
        if (deger != null && sel.value !== deger) sel.value = deger;
      }

      function odDersHtml(kodlar) {
        var html = "";
        for (var i = 0; i < kodlar.length; i++) {
          var ad = odDersAdi(kodlar[i]);
          html += '<option value="' + esc(ad) + '">' + esc(ad) + "</option>";
        }
        return html;
      }

      // Etiket biçimi index.html'deki __odKaydet ile uyumlu olmalı: "AD — BRANŞ".
      function odOgretmenHtml(liste) {
        var html = "";
        for (var i = 0; i < liste.length; i++) {
          var t = liste[i];
          var ad = ogretmenAd(t);
          if (!ad) continue;
          var b = bransKodu(t);
          var etiket = DERSLERI[b] && DERSLERI[b].ad ? DERSLERI[b].ad : String((t && t.brans) || "");
          var deger = (t.id != null && t.id !== "") ? String(t.id) : ad;
          html += '<option value="' + esc(deger) + '" data-brans="' + esc(b) + '">' +
            esc(ad + (etiket ? " — " + etiket : "")) + "</option>";
        }
        return html;
      }

      // mod: "ilk" (sınıf/öğrenci değişti), "ders", "ogretmen", "taze" (periyodik)
      function odTazele(form, mod) {
        var f = FORMLAR[form];
        if (!f) return;
        var ogretmenSel = eleman(f.ogretmen);
        var dersSel = eleman(f.ders);
        if (!ogretmenSel || !dersSel) return;

        var sinif = odSinifAdi(form);
        var havuz = odSinifOgretmenleri(sinif);
        var mevcutT = odOgretmenBul(String(ogretmenSel.value || ""));
        var dersKod = odDersKodu(dersSel.value);

        // 1) Sınıf/öğrenci veya öğretmen değiştiyse: branşın ilk dersi otomatik seçilir.
        var seciliT = null;
        if (mod === "ilk" || mod === "ogretmen") {
          seciliT = (mevcutT && havuz.indexOf(mevcutT) >= 0) ? mevcutT : (havuz[0] || null);
          if (seciliT) {
            var ilk = bransinIlkDersi(bransKodu(seciliT));
            if (ilk) dersKod = ilk;
          }
        }

        // 2) Öğretmen havuzu: sınıf ve ders uyumu (uygunMu). Liste asla uyumsuz branş göstermez.
        if (dersKod) {
          havuz = havuz.filter(function (t) { return uygunMu(t, dersKod); });
        }
        if (!seciliT && mevcutT && havuz.indexOf(mevcutT) >= 0) seciliT = mevcutT;
        if (!seciliT || havuz.indexOf(seciliT) < 0) seciliT = havuz[0] || null;

        // 3) Ders seçenekleri: tüm dersler (birebir formdaki gibi). Seçim varsa korunur.
        var tumDersler = Object.keys(DERSLERI);
        if (!tumDersler.length) {
          odSecenekYaz(dersSel, '<option value="">(Ders bulunamadı)</option>', "");
        } else {
          var hedefKod = (dersKod && tumDersler.indexOf(dersKod) >= 0) ? dersKod : tumDersler[0];
          dersKod = hedefKod;
          odSecenekYaz(dersSel, odDersHtml(tumDersler), odDersAdi(hedefKod));
        }

        // 4) Öğretmen listesi: yalnız bu sınıfta dersi olan ve dersi verebilen branşlar.
        if (!havuz.length) {
          odSecenekYaz(ogretmenSel,
            '<option value="">' + (sinif ? "(Bu sınıfta uygun öğretmen yok)" : "(Öğretmen bulunamadı)") + "</option>", "");
          return;
        }
        var seciliId = seciliT ? String((seciliT.id != null && seciliT.id !== "") ? seciliT.id : ogretmenAd(seciliT)) : "";
        odSecenekYaz(ogretmenSel, odOgretmenHtml(havuz), seciliId);
      }

      function odBagla(form) {
        var f = FORMLAR[form];
        if (!f) return;
        var kaynak = eleman(f.kaynak);
        var ogretmenSel = eleman(f.ogretmen);
        var dersSel = eleman(f.ders);
        if (kaynak && !kaynak.__ksOdBag) {
          kaynak.__ksOdBag = true;
          kaynak.addEventListener("change", function () { odTazele(form, "ilk"); });
        }
        if (dersSel && !dersSel.__ksOdBag) {
          dersSel.__ksOdBag = true;
          dersSel.addEventListener("change", function () { odTazele(form, "ders"); });
        }
        if (ogretmenSel && !ogretmenSel.__ksOdBag) {
          ogretmenSel.__ksOdBag = true;
          ogretmenSel.addEventListener("change", function () { odTazele(form, "ogretmen"); });
        }
      }

      // index.html'deki onchange nitelikleri bu global fonksiyonları çağırır.
      window.__odSinifDegisti = function () { odTazele("sinif", "ilk"); };
      window.__odOgretmenDegisti = function () { odTazele("sinif", "ogretmen"); };
      window.__odOgrDegisti = function () { odTazele("bireysel", "ilk"); };
      window.__odOgretmenDegistiB = function () { odTazele("bireysel", "ogretmen"); };

      function odTik() {
        var formlar = Object.keys(FORMLAR);
        for (var i = 0; i < formlar.length; i++) {
          var form = formlar[i];
          var f = FORMLAR[form];
          var ogretmenSel = eleman(f.ogretmen);
          var dersSel = eleman(f.ders);
          if (!ogretmenSel || !dersSel) continue;
          odBagla(form);
          // Form yeni çizildiyse select'ler boştur → ilk doldurma; aksi halde seçimi koru.
          var bos = !ogretmenSel.options || !ogretmenSel.options.length || !dersSel.options || !dersSel.options.length;
          odTazele(form, bos ? "ilk" : "taze");
        }
      }
      odTik();
      setInterval(odTik, 500);
    })();
  })();

  /* ============================================================
     D64 — ÖĞRENCİ & SINIF / SINIF PROGRAMI DÜZELTMELERİ
     1) Sınıf adlarını standartlaştır (boşluk/nokta/tire kaldır, BÜYÜK)
     2) Öğrencisi ve dersi olmayan boş sınıfları temizle
     3) Sınıf Toplu Ders Programı hücrelerini derse göre renklendir
     4) Boş hücrelere tıkla → "Kapalı" işareti (kalıcı)
     ============================================================ */
  var D64_RENKLER = {
    "MATEMATİK": "#ef4444",
    "FİZİK": "#3b82f6",
    "KİMYA": "#22c55e",
    "BİYOLOJİ": "#eab308",
    "TÜRKÇE": "#f97316",
    "EDEBİYAT": "#ec4899",
    "COĞRAFYA": "#8b5cf6",
    "TARİH": "#78350f",
    "GEOMETRİ": "#0ea5e9",
    "İNGİLİZCE": "#64748b"
  };
  var D64_KAPALI_ARKA = "#9ca3af";
  var D64_KAPALI_BASLIK_EK = " · Kapalı";
  var D64_NORM_CALISTI = false;
  var D64_KAPALI_MOD = false; /* D66: Sınıf programı "Kapalı" modu (varsayılan kapalı) */

  function d64Buyuk(s) {
    s = String(s == null ? "" : s);
    try { return s.toLocaleUpperCase("tr-TR"); } catch (e) { return s.toUpperCase(); }
  }

  /* "MEZUN SAY 1" → "MEZUNSAY1", "10. SINIF" → "10SINIF", "11 EA DİL" → "11EADİL" */
  function d64SinifAnahtar(ad) {
    var s = String(ad == null ? "" : ad);
    s = s.replace(/\s+/g, "").replace(/[.\-–—_]/g, "");
    return d64Buyuk(s);
  }

  function d64Veri() {
    try {
      if (typeof window !== "undefined" && window.DB && typeof window.DB === "object") return window.DB;
    } catch (e0) {}
    try {
      var v = JSON.parse(localStorage.getItem("yksOto_arsiv_v1") || "{}");
      /* D65-KALICILIK: localStorage'dan parse edilen obje sonradan window.DB'ye
         memoize edilir ki app.js saveDB() aynı referansı yazsın; sinifKapali
         sonradan kaybolmasın. */
      try {
        if (typeof window !== "undefined" && v && typeof v === "object" && (!window.DB || typeof window.DB !== "object")) {
          window.DB = v;
          return window.DB;
        }
      } catch (eMemo) {}
      return v;
    } catch (e1) { return null; }
  }

  function d64Kaydet(veri) {
    if (!veri) return;
    try {
      if (typeof window !== "undefined" && veri === window.DB && typeof window.saveDB === "function") {
        window.saveDB();
        return;
      }
    } catch (e0) {}
    try { localStorage.setItem("yksOto_arsiv_v1", JSON.stringify(veri)); } catch (e1) {}
    /* D65-KALICILIK: app.js saveDB() kendi DB global'ini yazar; sinifKapali oraya
       da kopyalanmazsa sonraki kayıt onu siler. window.DB ile senkronize et. */
    try {
      if (typeof window !== "undefined" && veri !== window.DB && window.DB && typeof window.DB === "object" && veri.sinifKapali) {
        window.DB.sinifKapali = veri.sinifKapali;
      }
    } catch (e2) {}
  }

  function d64DiziBirlestir(a, b) {
    var out = [];
    function ekle(d) {
      if (!Array.isArray(d)) return;
      d.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
    }
    ekle(a); ekle(b);
    return out;
  }

  /* Eski sınıf adı → standart ad eşlemesi. Öğrenci/öğretmen kimlikleri ve
     "Sınıf Dersi" yer tutucusu sınıf adı sanılıp bozulmaz. */
  function d64EslemeKur(veri) {
    var esle = {};
    var yasak = {};
    function idYasak(x) { if (x != null && x !== "") yasak[String(x)] = 1; }
    (veri.ogrenciler || []).forEach(function (o) { if (o) idYasak(o.id); });
    (veri.ogretmenler || []).forEach(function (t) { if (t) idYasak(t.id); });

    function ekle(ad) {
      if (ad == null) return;
      var s = String(ad).trim();
      if (!s || yasak[s]) return;
      if (s === "Sınıf Dersi" || s === "SD") return;
      var yeni = d64SinifAnahtar(s);
      if (!yeni || yeni === s) return;
      if (!esle[s]) esle[s] = yeni;
    }

    (veri.ogrenciler || []).forEach(function (o) { if (o && o.sinif) ekle(o.sinif); });
    Object.keys(veri.sinifProg || {}).forEach(ekle);
    Object.keys(veri.sinifIds || {}).forEach(ekle);
    Object.keys(veri.sinifProgDonemler || {}).forEach(function (d) {
      Object.keys(veri.sinifProgDonemler[d] || {}).forEach(ekle);
    });
    (veri.ogretmenler || []).forEach(function (t) {
      var av = t && t.avail && t.avail.sinif;
      if (!av || typeof av !== "object" || Array.isArray(av)) return;
      Object.keys(av).forEach(function (k) { ekle(av[k]); });
    });
    ["dersler", "ekDersler", "istekler", "gorusmeler", "odevler"].forEach(function (alan) {
      (veri[alan] || []).forEach(function (k) { if (k && k.sinif) ekle(k.sinif); });
    });
    ["sinavYoklamalari", "yoklamalar"].forEach(function (alan) {
      Object.keys(veri[alan] || {}).forEach(function (tarih) {
        Object.keys(veri[alan][tarih] || {}).forEach(ekle);
      });
    });
    return esle;
  }

  function d64DiziAnahtariTasi(obje, eski, yeni) {
    if (!obje || typeof obje !== "object" || eski === yeni) return false;
    if (!(eski in obje)) return false;
    var kaynak = obje[eski];
    var hedef = obje[yeni];
    delete obje[eski];
    if (Array.isArray(hedef) || Array.isArray(kaynak)) obje[yeni] = d64DiziBirlestir(hedef, kaynak);
    else if (hedef == null) obje[yeni] = kaynak;
    else if (typeof hedef === "object" && typeof kaynak === "object") {
      Object.keys(kaynak).forEach(function (k) { if (!(k in hedef)) hedef[k] = kaynak[k]; });
    }
    return true;
  }

  /* Tarih → sınıf → öğrenci biçimindeki yoklama haritalarında sınıf anahtarını taşır. */
  function d64TarihliSinifHaritasiTasi(harita, eski, yeni) {
    if (!harita || typeof harita !== "object") return false;
    var degisti = false;
    Object.keys(harita).forEach(function (tarih) {
      var gun = harita[tarih];
      if (!gun || typeof gun !== "object" || !(eski in gun)) return;
      var kaynak = gun[eski];
      if (yeni in gun) {
        var hedef = gun[yeni];
        if (hedef && kaynak && typeof hedef === "object" && typeof kaynak === "object") {
          Object.keys(kaynak).forEach(function (ogrId) { if (!(ogrId in hedef)) hedef[ogrId] = kaynak[ogrId]; });
        }
        delete gun[eski];
      } else {
        gun[yeni] = kaynak;
        delete gun[eski];
      }
      degisti = true;
    });
    return degisti;
  }

  function d64SinifIdTasi(veri, eski, yeni) {
    if (!veri.sinifIds || typeof veri.sinifIds !== "object" || !(eski in veri.sinifIds)) return false;
    if (veri.sinifIds[yeni] == null || veri.sinifIds[yeni] === "") veri.sinifIds[yeni] = veri.sinifIds[eski];
    delete veri.sinifIds[eski];
    return true;
  }

  function d64KapaliAnahtariTasi(veri, eski, yeni) {
    if (!veri.sinifKapali || typeof veri.sinifKapali !== "object" || !(eski in veri.sinifKapali)) return false;
    var kaynak = (veri.sinifKapali[eski] && typeof veri.sinifKapali[eski] === "object") ? veri.sinifKapali[eski] : {};
    var hedef = (veri.sinifKapali[yeni] && typeof veri.sinifKapali[yeni] === "object") ? veri.sinifKapali[yeni] : {};
    Object.keys(kaynak).forEach(function (k) { if (!(k in hedef)) hedef[k] = kaynak[k]; });
    veri.sinifKapali[yeni] = hedef;
    delete veri.sinifKapali[eski];
    return true;
  }

  /* GÖREV 1 — tüm sınıf referanslarını standart forma taşır (idempotent). */
  function d64SiniflariStandartlastir(veri) {
    if (!veri || typeof veri !== "object") return false;
    var esle = d64EslemeKur(veri);
    var anahtarlar = Object.keys(esle);
    if (!anahtarlar.length) return false;
    var degisti = false;

    (veri.ogrenciler || []).forEach(function (o) {
      if (o && o.sinif && esle[o.sinif]) { o.sinif = esle[o.sinif]; degisti = true; }
    });

    ["dersler", "ekDersler", "istekler", "gorusmeler", "odevler"].forEach(function (alan) {
      (veri[alan] || []).forEach(function (k) {
        if (k && k.sinif && esle[k.sinif]) { k.sinif = esle[k.sinif]; degisti = true; }
      });
    });

    anahtarlar.forEach(function (eski) {
      var yeni = esle[eski];
      if (d64DiziAnahtariTasi(veri.sinifProg, eski, yeni)) degisti = true;
      if (d64SinifIdTasi(veri, eski, yeni)) degisti = true;
      if (d64KapaliAnahtariTasi(veri, eski, yeni)) degisti = true;

      if (veri.sinifProgDonemler && typeof veri.sinifProgDonemler === "object") {
        Object.keys(veri.sinifProgDonemler).forEach(function (donem) {
          if (d64DiziAnahtariTasi(veri.sinifProgDonemler[donem], eski, yeni)) degisti = true;
        });
      }

      if (d64TarihliSinifHaritasiTasi(veri.sinavYoklamalari, eski, yeni)) degisti = true;
      if (d64TarihliSinifHaritasiTasi(veri.yoklamalar, eski, yeni)) degisti = true;
    });

    (veri.ogretmenler || []).forEach(function (t) {
      var av = t && t.avail && t.avail.sinif;
      if (!av || typeof av !== "object" || Array.isArray(av)) return;
      Object.keys(av).forEach(function (k) {
        var v = av[k];
        if (typeof v === "string" && esle[v]) { av[k] = esle[v]; degisti = true; }
      });
    });

    try {
      if (typeof ui !== "undefined" && ui) {
        if (ui.sinifAd && esle[ui.sinifAd]) { ui.sinifAd = esle[ui.sinifAd]; degisti = true; }
        if (ui.panelSecim && ui.panelSecim.sinif && esle[ui.panelSecim.sinif]) { ui.panelSecim.sinif = esle[ui.panelSecim.sinif]; degisti = true; }
        if (ui.seciliDurum === "sinif" && ui.seciliOgrId && esle[ui.seciliOgrId]) { ui.seciliOgrId = esle[ui.seciliOgrId]; degisti = true; }
      }
    } catch (eUi) {}
    return degisti;
  }

  function d64ProgramDoluMu(deger) {
    if (Array.isArray(deger)) {
      return deger.some(function (k) { return k != null && String(k).trim() !== ""; });
    }
    if (deger && typeof deger === "object") {
      return Object.keys(deger).some(function (k) { return deger[k] != null && deger[k] !== false && deger[k] !== ""; });
    }
    return false;
  }

  /* GÖREV 2 — öğrencisi yok + dersi yok (hiçbir dönemde) olan sınıfları siler. */
  function d64BosSiniflariTemizle(veri) {
    if (!veri || !veri.sinifProg || typeof veri.sinifProg !== "object") return false;
    var ogrenciVar = {};
    (veri.ogrenciler || []).forEach(function (o) { if (o && o.sinif) ogrenciVar[o.sinif] = true; });

    var silinecek = [];
    Object.keys(veri.sinifProg).forEach(function (s) {
      if (!s || ogrenciVar[s]) return;
      if (d64ProgramDoluMu(veri.sinifProg[s])) return;

      var baskaDonemdeVar = false;
      if (veri.sinifProgDonemler && typeof veri.sinifProgDonemler === "object") {
        Object.keys(veri.sinifProgDonemler).forEach(function (d) {
          var p = veri.sinifProgDonemler[d];
          if (p && typeof p === "object" && d64ProgramDoluMu(p[s])) baskaDonemdeVar = true;
        });
      }
      if (!baskaDonemdeVar) silinecek.push(s);
    });

    if (!silinecek.length) return false;
    silinecek.forEach(function (s) {
      delete veri.sinifProg[s];
      if (veri.sinifProgDonemler && typeof veri.sinifProgDonemler === "object") {
        Object.keys(veri.sinifProgDonemler).forEach(function (d) {
          var p = veri.sinifProgDonemler[d];
          if (p && typeof p === "object") delete p[s];
        });
      }
      if (veri.sinifIds && typeof veri.sinifIds === "object") delete veri.sinifIds[s];
      if (veri.sinifKapali && typeof veri.sinifKapali === "object") delete veri.sinifKapali[s];
    });

    try {
      if (typeof ui !== "undefined" && ui) {
        if (ui.sinifAd && silinecek.indexOf(ui.sinifAd) >= 0) ui.sinifAd = null;
        if (ui.panelSecim && silinecek.indexOf(ui.panelSecim.sinif) >= 0) ui.panelSecim.sinif = "";
      }
    } catch (eUi2) {}
    return true;
  }

  function d64TabloyuBul() {
    if (typeof document === "undefined" || !document.querySelectorAll) return null;
    var basliklar = document.querySelectorAll("h4");
    for (var i = 0; i < basliklar.length; i++) {
      var b = basliklar[i];
      var txt = b.textContent || "";
      if (txt.indexOf("Sınıf Toplu Ders Programı") < 0) continue;
      var tablo = null;
      var dugum = b.parentNode;
      for (var j = 0; j < 8 && dugum && !tablo; j++) {
        tablo = dugum.querySelector ? dugum.querySelector("table") : null;
        dugum = dugum.parentNode;
      }
      if (tablo) return { tablo: tablo, baslik: b };
    }
    return null;
  }

  function d64TablodakiSinif(bilgi) {
    try {
      var sec = document.getElementById ? document.getElementById("sinifSec") : null;
      if (sec && sec.value) return String(sec.value).trim();
    } catch (e0) {}
    var t = bilgi && bilgi.baslik ? (bilgi.baslik.textContent || "") : "";
    var p = t.indexOf("—");
    if (p < 0) p = t.indexOf("–");
    if (p < 0) p = t.indexOf("-");
    return p >= 0 ? t.slice(p + 1).trim() : "";
  }

  function d64HucreSlot(btn) {
    var td = btn && btn.closest ? btn.closest("td") : null;
    var tr = btn && btn.closest ? btn.closest("tr") : null;
    if (!td || !tr || !tr.parentNode) return "";
    var satirlar = tr.parentNode.children || [];
    var satir = -1;
    for (var i = 0; i < satirlar.length; i++) { if (satirlar[i] === tr) { satir = i; break; } }
    if (satir < 0) return "";
    var kolon = td.cellIndex - 1;
    if (kolon < 0) return "";
    var kod = (typeof window !== "undefined" && window.KISA_KOD && window.KISA_KOD[satir])
      ? window.KISA_KOD[satir].no : String(satir + 1);
    return kolon + "-" + kod;
  }

  function d64Program(veri, sinif) {
    var p = veri && veri.sinifProg ? veri.sinifProg[sinif] : null;
    if (Array.isArray(p)) return p;
    if (p && typeof p === "object") return Object.keys(p).filter(function (k) { return p[k]; });
    return [];
  }

  function d64KapaliHaritasi(veri, sinif) {
    var k = veri && veri.sinifKapali ? veri.sinifKapali[sinif] : null;
    return (k && typeof k === "object") ? k : {};
  }

  function d64DersBul(metin) {
    var buyuk = d64Buyuk(metin);
    if (!buyuk) return null;
    var adlar = Object.keys(D64_RENKLER);
    for (var i = 0; i < adlar.length; i++) {
      if (buyuk.indexOf(adlar[i]) >= 0) return adlar[i];
    }
    return null;
  }

  function d64RenkUygula(btn, metin) {
    if (btn.getAttribute("data-d64-kapali") === "1") d64BosHucre(btn, false);
    var ders = d64DersBul(metin);
    if (!ders) {
      if (btn.getAttribute("data-d64-renk")) {
        btn.removeAttribute("data-d64-renk");
        btn.style.backgroundColor = "";
        btn.style.borderColor = "";
        btn.style.color = "";
      }
      return;
    }
    if (btn.getAttribute("data-d64-renk") === ders) return;
    var renk = D64_RENKLER[ders];
    btn.setAttribute("data-d64-renk", ders);
    btn.style.backgroundColor = renk;
    btn.style.borderColor = renk;
    btn.style.color = "#ffffff";
    var parcalar = btn.querySelectorAll ? btn.querySelectorAll("span") : [];
    for (var i = 0; i < parcalar.length; i++) {
      parcalar[i].style.color = "#ffffff";
      parcalar[i].style.opacity = "1";
    }
  }

  /* D66 — eski sürümden kalan "Kapalı"/"KAPALI" yazısını temizler; yalnız renk kalır. */
  function d64KapaliYazisiniTemizle(btn) {
    if (!btn) return;
    var t = String(btn.textContent == null ? "" : btn.textContent).replace(/\s+/g, " ").trim();
    if (t && d64Buyuk(t) === "KAPALI") btn.textContent = "";
  }

  function d64BosHucre(btn, isaretli) {
    if (!isaretli) {
      d64KapaliYazisiniTemizle(btn);
      if (btn.getAttribute("data-d64-kapali") !== "1") return;
      btn.removeAttribute("data-d64-kapali");
      btn.textContent = "";
      var eskiBaslik = btn.getAttribute("data-d64-baslik");
      if (eskiBaslik != null) {
        btn.title = eskiBaslik;
        btn.removeAttribute("data-d64-baslik");
      } else if ((btn.title || "").indexOf(D64_KAPALI_BASLIK_EK) >= 0) {
        btn.title = btn.title.replace(D64_KAPALI_BASLIK_EK, "");
      }
      btn.style.backgroundColor = "";
      btn.style.borderColor = "";
      btn.style.color = "";
      btn.style.fontSize = "";
      btn.style.fontWeight = "";
      btn.style.lineHeight = "";
      btn.style.letterSpacing = "";
      btn.style.cursor = "";
      return;
    }
    /* D66: hücreye "Kapalı" YAZISI yazılmaz — sadece gri arka plan. */
    d64KapaliYazisiniTemizle(btn);
    if (btn.getAttribute("data-d64-kapali") === "1") {
      btn.style.backgroundColor = D64_KAPALI_ARKA;
      return;
    }
    btn.setAttribute("data-d64-baslik", btn.title || "");
    btn.setAttribute("data-d64-kapali", "1");
    if ((btn.title || "").indexOf(D64_KAPALI_BASLIK_EK) < 0) btn.title = (btn.title || "") + D64_KAPALI_BASLIK_EK;
    btn.textContent = "";
    btn.style.backgroundColor = D64_KAPALI_ARKA;
    btn.style.borderColor = D64_KAPALI_ARKA;
    btn.style.color = "";
    btn.style.fontSize = "";
    btn.style.fontWeight = "";
    btn.style.lineHeight = "";
    btn.style.letterSpacing = "";
    btn.style.cursor = "pointer";
  }

  /* GÖREV 3 + 4 — tabloyu her render sonrası tarar; renkleri ve
     kalıcı "Kapalı" işaretlerini yeniden uygular. */
  function d64TabloSusle() {
    var bilgi;
    try { bilgi = d64TabloyuBul(); } catch (e0) { return; }
    if (!bilgi) return;
    try { d64KapaliModDugmesi(bilgi); } catch (eMod) {} /* D66: mod butonu */
    var sinif = d64TablodakiSinif(bilgi);
    if (!sinif) return;
    var veri = d64Veri();
    if (!veri) return;
    var prog = d64Program(veri, sinif);
    var kapali = d64KapaliHaritasi(veri, sinif);
    var degisti = false;
    var butonlar = bilgi.tablo.querySelectorAll ? bilgi.tablo.querySelectorAll(".hucreBtn") : [];

    for (var i = 0; i < butonlar.length; i++) {
      var btn = butonlar[i];
      var slot = d64HucreSlot(btn);
      if (!slot) continue;
      if (prog.indexOf(slot) >= 0) {
        if (kapali[slot]) { delete kapali[slot]; degisti = true; }
        d64RenkUygula(btn, btn.textContent || "");
      } else {
        d64BosHucre(btn, !!kapali[slot]);
      }
    }

    if (degisti) {
      if (!Object.keys(kapali).length && veri.sinifKapali && veri.sinifKapali[sinif]) delete veri.sinifKapali[sinif];
      d64Kaydet(veri);
    }
  }

  /* GÖREV 4 — dolu hücrede hiçbir şey yapmaz; boş hücrede "Kapalı"yı açar/kapatır.
     app.js'in inline togSinif() tıklaması capture aşamasında engellenir. */
  if (typeof document !== "undefined" && document.addEventListener) {
    /* D65-TEKIL-HANDLER: aynı tıklama handler'ı iki kez bağlanmasın (ör. script çift yüklenirse). */
    if (!window.__d64ClickHandlerBound) {
      window.__d64ClickHandlerBound = true;
      document.addEventListener("click", function (e) {
        /* D65-REENTRANS: aynı tıklama 100ms içinde ikinci kez işlenmesin. */
        if (window.__d64KapaliIslemde) return;
        window.__d64KapaliIslemde = true;
        setTimeout(function () { window.__d64KapaliIslemde = false; }, 100);
      var hedef = e.target;
      var btn = hedef && hedef.closest ? hedef.closest(".hucreBtn") : null;
      if (!btn) return;
      var bilgi = d64TabloyuBul();
      if (!bilgi || !bilgi.tablo.contains || !bilgi.tablo.contains(btn)) return;
      var sinif = d64TablodakiSinif(bilgi);
      var slot = d64HucreSlot(btn);
      if (!sinif || !slot) return;
      var veri = d64Veri();
      if (!veri) return;

      /* D69: dolu hücre koruması moddan BAĞIMSIZDIR. Öğretmen çizelgesiyle
         (D68) BİREBİR aynı metin ve turuncu uyarı; tıklama her zaman engellenir
         ve ders ataması silinmez. */
      if (d64Program(veri, sinif).indexOf(slot) >= 0) { /* ders atanmış: dokunma */
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.toast === "function") {
          window.toast("Bu hücrede ders var, değiştirilemez", "uyari");
        } else {
          alert("Bu hücrede ders var, değiştirilemez");
        }
        return;
      }

      /* D70: mod PASİFKEN de tıklama yutulur; app.js'in togSinif() çağrısı
         (mavi "Toplu ders var") çalışmaz ve hiçbir görsel değişiklik olmaz. */
      e.preventDefault();
      e.stopPropagation();

      /* "Kapalı" işaretleme yalnız mod AKTİFKEN yapılır. */
      if (!D64_KAPALI_MOD) return;

      if (!veri.sinifKapali || typeof veri.sinifKapali !== "object") veri.sinifKapali = {};
      if (!veri.sinifKapali[sinif] || typeof veri.sinifKapali[sinif] !== "object") veri.sinifKapali[sinif] = {};
      if (veri.sinifKapali[sinif][slot] === "KAPALI") delete veri.sinifKapali[sinif][slot];
      else veri.sinifKapali[sinif][slot] = "KAPALI";
      if (!Object.keys(veri.sinifKapali[sinif]).length) delete veri.sinifKapali[sinif];

      window.DB = veri; /* D65-KAYDETME-GARANTISI: yazım her zaman canonical DB üzerinden */
      d64Kaydet(veri);
      d64TabloSusle();
      }, true);
    }
  }

  function d64Baslat() {
    if (D64_NORM_CALISTI) return;
    D64_NORM_CALISTI = true;
    var veri = d64Veri();
    if (!veri) return;

    var degisti = false;
    try { if (d64SiniflariStandartlastir(veri)) degisti = true; } catch (e0) {}
    try { if (d64BosSiniflariTemizle(veri)) degisti = true; } catch (e1) {}

    if (degisti) {
      var yenilendi = false;
      try {
        if (typeof window !== "undefined" && veri === window.DB && typeof window.yenile === "function") {
          window.yenile();
          yenilendi = true;
        }
      } catch (e2) { yenilendi = false; }
      if (!yenilendi) d64Kaydet(veri);
    }
    d64TabloSusle();
  }

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", d64Baslat);
  } else {
    setTimeout(d64Baslat, 0);
  }
  setInterval(d64TabloSusle, 500);

  /* ============================================================
     D66 — SINIF TOPLU DERS PROGRAMI "KAPALI" MODU
     Tablo başlığındaki lejantın yanına "Kapalı" mod butonu ekler.
     Mod açıkken boş hücreye tıklama veriye
     sinifKapali[sinif][slot] = "KAPALI" yazar; hücreye YAZI yazılmaz,
     yalnız gri arka plan (#9ca3af) uygulanır. Tekrar tıklama işareti
     kaldırır. İşaretler d64Kaydet ile kalıcıdır.
     ============================================================ */
  function d64KapaliModDugmesi(bilgi) {
    if (!bilgi || !bilgi.baslik || typeof document === "undefined" || !document.createElement) return;
    var bas = bilgi.baslik;
    var kapsayici = bas.parentNode && bas.parentNode.parentNode ? bas.parentNode.parentNode : null;
    if (!kapsayici || !kapsayici.querySelector) return;

    var btn = kapsayici.querySelector("#d64KapaliModBtn");
    if (!btn) {
      /* Lejant: "Toplu ders var" yazısını içeren span. */
      var spanlar = kapsayici.querySelectorAll("span");
      var lejant = null;
      for (var i = 0; i < spanlar.length; i++) {
        var t = spanlar[i].textContent || "";
        if (t.indexOf("Toplu ders var") >= 0) { lejant = spanlar[i]; break; }
      }
      if (!lejant) return;

      btn = document.createElement("button");
      btn.id = "d64KapaliModBtn";
      btn.type = "button";
      btn.textContent = "Kapalı";
      /* Title'da "Kapalı" geçmesin: [title*="Kapalı"] CSS'i butonu sürekli gri yapar. */
      btn.title = "Hücre işaretleme modu: açıkken boş hücreye tıklayınca gri işaretlenir";
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        D64_KAPALI_MOD = !D64_KAPALI_MOD;
        d64KapaliModDugmesi(bilgi);
        try { d64TabloSusle(); } catch (eT) {}
      });
      lejant.appendChild(btn);
    }

    var aktif = !!D64_KAPALI_MOD;
    btn.setAttribute("aria-pressed", aktif ? "true" : "false");
    btn.style.cssText = "display:inline-flex;align-items:center;gap:4px;border-radius:9999px;" +
      "padding:4px 10px;font-size:10.5px;font-weight:800;line-height:1;cursor:pointer;" +
      "border:1px solid " + (aktif ? D64_KAPALI_ARKA : "#e2e8f0") + ";" +
      "background:" + (aktif ? D64_KAPALI_ARKA : "#ffffff") + ";" +
      "color:" + (aktif ? "#ffffff" : "#64748b") + ";";
  }

  /* ============================================================
     D68 — ÖĞRETMEN ÇİZELGESİ DOLU HÜCRE KORUMASI
     Öğretmen Tanımlama çizelgesindeki hücreler onclick ile
     app.js'in togOgrSecili() fonksiyonunu çağırır. Sarı
     (Sınıf Dersi = ders atanmış) hücrelerde bu çağrı ders
     atamasını silebiliyor / başka sınıfla değiştirebiliyordu.
     Capture aşamasında tıklama engellenir: dolu hücre değişmez.
     Boş ve Kapalı hücrelerin mevcut davranışı korunur.
     ============================================================ */
  (function () {
    if (typeof document === "undefined" || !document.addEventListener) return;
    if (window.__d68OgrKilitHandlerBound) return;
    window.__d68OgrKilitHandlerBound = true;

    var D68_UYARI = "Bu hücrede ders var, değiştirilemez";

    /* Yalnız öğretmen çizelgesi hücresi: inline tıklaması togOgrSecili(...) */
    function d68OgrHucresiMi(btn) {
      var oc = btn.getAttribute ? (btn.getAttribute("onclick") || "") : "";
      return oc.indexOf("togOgrSecili(") >= 0;
    }

    /* Dolu = sarı "Sınıf Dersi" hücresi (avail.sinif kaydı). */
    function d68DoluMu(btn) {
      var cls = " " + String(btn.className || "") + " ";
      if (cls.indexOf("bg-amber-200") >= 0) return true;
      var t = btn.getAttribute ? (btn.getAttribute("title") || "") : (btn.title || "");
      return t.indexOf("Sınıf Dersi") >= 0;
    }

    document.addEventListener("click", function (e) {
      var hedef = e.target;
      var btn = hedef && hedef.closest ? hedef.closest(".hucreBtn") : null;
      if (!btn || !d68OgrHucresiMi(btn) || !d68DoluMu(btn)) return;

      /* Dolu hücre: app.js'in inline togOgrSecili() çağrısı hiç çalışmasın. */
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      var eski = btn.getAttribute ? (btn.getAttribute("title") || "") : "";
      if (eski.indexOf(D68_UYARI) < 0) btn.title = D68_UYARI + (eski ? " — " + eski : "");
      try {
        if (typeof window.toast === "function") window.toast(D68_UYARI, "uyari");
      } catch (eT) {}
    }, true);
  })();

  /* ============================================================
     D65 — "KAPALI" SAAT KONTROLÜ: planla() sarmalayıcısı
     Sınıf programında "Kapalı" işaretli slota birebir ders
     yazılmasını engeller. "Çakışmayı Yoksay" (#f-yoksay)
     işaretliyse orijinal planla() çalışır.
     ============================================================ */
  (function () {
    var orijinalPlanla = window.planla;
    if (typeof orijinalPlanla !== "function" || orijinalPlanla.__d64KapaliSarmal) return;

    function eleman(id) {
      try { return document.getElementById ? document.getElementById(id) : null; } catch (e) { return null; }
    }

    /* #f-tarih gerçekte type=date → YYYY-MM-DD üretir. ISO'nun yanında
       "YYYY-MM-DDTHH:MM" ve tarayıcının parse ettiği diğer biçimler de kabul edilir. */
    function tarihParcala(deger) {
      var s = String(deger == null ? "" : deger).trim();
      if (!s) return null;

      // ISO format: YYYY-MM-DD (veya YYYY-MM-DDTHH:MM)
      var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) {
        var yil = parseInt(m[1], 10);
        var ay = parseInt(m[2], 10);
        var gun = parseInt(m[3], 10);
        var d = new Date(yil, ay - 1, gun);
        if (d.getFullYear() === yil && d.getMonth() === ay - 1 && d.getDate() === gun) {
          return d;
        }
      }

      // Fallback: tarayıcının kendi Date parser'ı
      try {
        var d2 = new Date(s);
        if (!isNaN(d2.getTime())) return d2;
      } catch (e) {}

      return null;
    }

    /* #f-saat value'su "8" değil "15:30" gibi başlangıç saatidir; ksKodOf ile koda çevrilir. */
    function saatKodu(deger) {
      var s = String(deger == null ? "" : deger).trim();
      if (/^\d{1,2}$/.test(s)) {
        var no = parseInt(s, 10);
        if (no >= 1 && no <= 11) return String(no);
      }
      try { if (typeof ksKodOf === "function") { var k = ksKodOf(s); if (k) return String(k); } } catch (e0) {}
      try {
        if (typeof KISA_KOD !== "undefined" && KISA_KOD) {
          for (var i = 0; i < KISA_KOD.length; i++) {
            if (KISA_KOD[i] && KISA_KOD[i].b === s) return String(KISA_KOD[i].no);
          }
        }
      } catch (e1) {}
      return "";
    }

    /* Kapalı saat uyarısını formun altında kırmızı bant olarak gösterir. */
    function kapaliUyariGoster(mesaj) {
      // Önce varsa eski uyarıyı kaldır
      var eski = document.getElementById("__kapaliUyariBandi");
      if (eski) eski.remove();

      // Yeni uyarı bandı oluştur
      var bant = document.createElement("div");
      bant.id = "__kapaliUyariBandi";
      bant.style.cssText = "display:flex; align-items:flex-start; gap:10px; padding:12px 16px; background:#fef2f2; border:1px solid #fecaca; border-left:4px solid #ef4444; border-radius:8px; margin:12px 0; font-family:system-ui;";
      bant.innerHTML =
        '<div style="flex-shrink:0; width:20px; height:20px; border-radius:50%; background:#ef4444; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px;">!</div>' +
        '<div style="flex:1;">' +
          '<div style="font-weight:700; color:#991b1b; font-size:13px;">Bu saat dilimi kapalıdır</div>' +
          '<div style="color:#b91c1c; font-size:12px; margin-top:2px;">' + mesaj + '</div>' +
        '</div>' +
        '<button onclick="this.parentNode.remove()" style="flex-shrink:0; background:none; border:none; color:#991b1b; cursor:pointer; font-size:16px; padding:0 4px;">×</button>';

      // Formun altına ekle (Birebir Ders Planla formunu bul)
      var formKart = document.querySelector('button[onclick*="planla"]');
      var parent = null;
      if (formKart) {
        // Butonun içinde olduğu en yakın kart/div'i bul
        parent = formKart.parentNode;
        while (parent && !parent.querySelector('#f-ogrenci')) {
          parent = parent.parentNode;
          if (!parent || parent === document.body) break;
        }
      }
      if (parent && parent !== document.body) {
        parent.parentNode.insertBefore(bant, parent.nextSibling);
      } else if (formKart) {
        // Fallback: butonun hemen üstüne ekle
        formKart.parentNode.insertBefore(bant, formKart);
      } else {
        // Hiç bulunamazsa body'nin en üstüne ekle
        document.body.insertBefore(bant, document.body.firstChild);
      }

      // 8 saniye sonra otomatik kaldır
      setTimeout(function () {
        if (bant && bant.parentNode) bant.remove();
      }, 8000);
    }

    /* true → kapalı nedeniyle planlama engellendi. false → orijinal akış devam eder. */
    function kapaliKontrol() {
      var ogrEl = eleman("f-ogrenci");
      var tarihEl = eleman("f-tarih");
      var saatEl = eleman("f-saat");
      if (!ogrEl || !tarihEl || !saatEl) { return false; }

      var ogrenciAd = String(ogrEl.value || "").trim();
      if (!ogrenciAd) { return false; }

      var veri = d64Veri();
      if (!veri || !Array.isArray(veri.ogrenciler)) { return false; }

      var kuc = (typeof kucuk === "function") ? kucuk : function (x) {
        return String(x == null ? "" : x).trim().toLocaleLowerCase("tr-TR");
      };
      var aranan = kuc(ogrenciAd);
      var ogr = null;
      for (var i = 0; i < veri.ogrenciler.length; i++) {
        var o = veri.ogrenciler[i];
        if (!o) continue;
        var ad = o.ad != null ? o.ad : (o.adSoyad != null ? o.adSoyad : "");
        if (kuc(ad) === aranan) { ogr = o; break; }
      }
      if (!ogr || !ogr.sinif) { return false; }

      var tarih = tarihParcala(tarihEl.value);
      if (!tarih) { return false; }
      var gunIdx = (tarih.getDay() + 6) % 7; /* Pazartesi=0 … Pazar=6 */

      var kod = saatKodu(saatEl.value);
      if (!kod) { return false; }

      var slot = gunIdx + "-" + kod;
      var harita = veri.sinifKapali && veri.sinifKapali[ogr.sinif];
      if (!harita || harita[slot] !== "KAPALI") { return false; }

      var yoksayEl = eleman("f-yoksay");
      if (yoksayEl && yoksayEl.checked) { return false; }

      kapaliUyariGoster("Bu saat dilimi kapalıdır. Ders planlanamaz. Yine de planlamak için 'Çakışmayı Yoksay' seçeneğini işaretleyin.");
      return true;
    }

    function planlaKapaliSarmal() {
      if (kapaliKontrol()) return;
      return orijinalPlanla.apply(this, arguments);
    }
    planlaKapaliSarmal.__d64KapaliSarmal = true;

    window.planla = planlaKapaliSarmal;
  })();

  /* === DERS PLANLA › HAFTA GÜN ÇİPLERİ: GÜN ADI DOĞRULAMA ===
     Çip etiketi tarihten bağımsız olarak yeniden hesaplanır; ekrandaki metne güvenilmez.
     Tarih kaynağı: onclick="gunSec('YYYY-MM-DD')" ya da title="GG.AA.YYYY".
     Takvim kuralı app.js ile aynı: Pazartesi=0 … Pazar=6 (dowIdx). */
  var GUN_ADI_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]; /* Date.getDay() sırası */

  function gunKisaAdi(tarihKey) {
    var p = String(tarihKey).split("-");
    var y = parseInt(p[0], 10), m = parseInt(p[1], 10), g = parseInt(p[2], 10);
    if (!y || !m || !g) return "";
    return GUN_ADI_KISA[new Date(y, m - 1, g).getDay()] || "";
  }

  function gunCipTarihi(chip) {
    var m = String(chip.getAttribute("onclick") || "").match(/gunSec\(\s*['"](\d{4})-(\d{2})-(\d{2})['"]\s*\)/);
    if (m) return m[1] + "-" + m[2] + "-" + m[3];
    m = String(chip.getAttribute("title") || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) return m[3] + "-" + m[2] + "-" + m[1];
    return "";
  }

  function gunCipleriDuzelt() {
    var cipler = document.querySelectorAll('button[onclick*="gunSec("]');
    for (var i = 0; i < cipler.length; i++) {
      var chip = cipler[i];
      var metin = String(chip.textContent || "").replace(/\s+/g, " ").trim();
      if (!/^(Pzt|Sal|Çar|Per|Cum|Cmt|Paz) \d{1,2}$/.test(metin)) continue;
      var key = gunCipTarihi(chip);
      if (!key) continue;
      var dogru = gunKisaAdi(key) + " " + String(parseInt(key.slice(8, 10), 10));
      if (metin !== dogru) chip.textContent = dogru;
    }
  }

  /* dowIdx global ise ve bozulmuşsa kanonik formülü geri koy (Pzt=0 … Paz=6). */
  if (typeof window.dowIdx === "function" && window.dowIdx("2026-10-21") !== 2) {
    window.dowIdx = function (key) {
      var p = String(key).split("-");
      var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      return (d.getDay() + 6) % 7;
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gunCipleriDuzelt);
  gunCipleriDuzelt();
  setInterval(gunCipleriDuzelt, 500);

  // === VERİ KAYBI ÖNLEME (saveDB SARMALAMASI) ===
  (function() {
    var orijinalSaveDB = window.saveDB;
    if (!orijinalSaveDB || orijinalSaveDB.__d66Sarmal) return;

    // Önce localStorage'daki güncel veriyi okuyup DB'ye merge eden yardımcı
    function lsDenDBYeMerge() {
      try {
        var lsVeri = JSON.parse(localStorage.getItem("yksOto_arsiv_v1") || "{}");
        if (!window.DB || !lsVeri) return;

        // Sadece sorunlu alanları merge et (app.js'in kendi yönettiği alanlara dokunma)
        var sorunluAlanlar = ["yoklamalar", "sinavYoklamalari", "kutuphane", "kutuphaneGunleri", "odevler"];
        sorunluAlanlar.forEach(function(alan) {
          if (lsVeri[alan] !== undefined) {
            window.DB[alan] = lsVeri[alan];
          }
        });

        // gorusmeler zaten DB'de tutuluyor, ama yine de merge edelim
        if (lsVeri.gorusmeler !== undefined) window.DB.gorusmeler = lsVeri.gorusmeler;
        /* D66-KALICILIK: sinifKapali için DB kanoniktir. localStorage'daki eski
           kopya buraya yazılırsa yeni "Kapalı" işaretleri (veya kaldırılanlar)
           her saveDB çağrısında kaybolur. Bu alan merge EDİLMEZ. */
      } catch(e) {
        console.warn("[D66-MERGE] Hata:", e);
      }
    }

    // Orijinal saveDB'yi sarmala
    window.saveDB = function() {
      lsDenDBYeMerge(); // Önce merge et
      return orijinalSaveDB.apply(this, arguments); // Sonra orijinali çağır
    };

    window.saveDB.__d66Sarmal = true;
  })();

  // === BİREBİR WHATSAPP TASLAK SARMALAMASI ===
  // app.js'deki birebir ders satırının yeşil WhatsApp butonu onclick="waSatir('<id>')" ile
  // eski waGonder()/ogrenciMesajMetni() akışını (bozuk imza + sabit metin) çağırıyor.
  // app.js DEĞİŞMEZ: waSatir burada sarmalanır ve yeni "Birebir Ders Planı" taslağını kullanır.
  (function() {
    if (typeof window.waSatir !== "function" || window.waSatir.__d66Sarmal) return;
    var orijinalWaSatir = window.waSatir;

    function dersAdi(dersId) {
      if (window.DERS && window.DERS[dersId] && window.DERS[dersId].ad) return window.DERS[dersId].ad;
      var liste = window.DERSLER || [];
      for (var i = 0; i < liste.length; i++) {
        if (liste[i] && liste[i].id === dersId) return liste[i].ad;
      }
      return dersId || "Ders";
    }
    function tarihYaz(t) {
      if (t && typeof window.fmtTR === "function") return window.fmtTR(t);
      return t || "";
    }
    /* D66-KUSUR1: mesaja yalnız başlangıç-bitiş aralığı yazılır; ders kodu ("11", "2", "6")
       metne GİRMEZ. KISA_KOD "saat" alanı için iki biçimi de çözebilir:
         • başlangıç saati ("18:00", "09:40") → ksKodOf ile koda çevrilir
         • eski kayıtlarda doğrudan kod ("11", 2, "6") → doğrudan eşleşir */
    function saatAraligi(s) {
      var kodlar = window.KISA_KOD || [];
      var metin = s == null ? "" : String(s).trim();
      var i;
      for (i = 0; i < kodlar.length; i++) {
        if (kodlar[i] && kodlar[i].no === metin) return kodlar[i].b + "-" + kodlar[i].e;
      }
      var no = (typeof window.ksKodOf === "function") ? window.ksKodOf(metin) : "";
      for (i = 0; i < kodlar.length; i++) {
        if (kodlar[i] && no && kodlar[i].no === no) return kodlar[i].b + "-" + kodlar[i].e;
      }
      return metin;
    }

    window.waSatir = function(id) {
      try {
        var db = window.DB;
        // ID'den ders kaydını bul
        var ders = db && db.dersler ? db.dersler.filter(function(d){ return d.id === id; })[0] : null;
        if (!ders) return orijinalWaSatir.apply(this, arguments);

        // Öğrenciyi bul (grup/ada düşmüş eski kayıtlar için ada göre yedek)
        var ogr = null;
        if (db.ogrenciler) {
          ogr = db.ogrenciler.filter(function(o){ return o.id === ders.ogrenciId; })[0] || null;
          if (!ogr && ders.ogrenciAd) {
            var aranan = String(ders.ogrenciAd).trim().toLocaleLowerCase("tr-TR");
            ogr = db.ogrenciler.filter(function(o){
              return String(o.ad == null ? "" : o.ad).trim().toLocaleLowerCase("tr-TR") === aranan;
            })[0] || null;
          }
        }
        if (!ogr) return orijinalWaSatir.apply(this, arguments);

        // Taslağı oku (modalda kaydedilen güncel "Birebir Ders Planı" metni)
        var t = (typeof window.taslakOku === "function") ? window.taslakOku() : null;
        if (!t || !t.birebir || !t.birebir.plan) return orijinalWaSatir.apply(this, arguments);

        var mesaj = t.birebir.plan;
        mesaj = mesaj.replace(/{ad}/g, ogr.adSoyad || ogr.ad || "Öğrenci");
        mesaj = mesaj.replace(/{sinif}/g, ogr.sinif || "");

        // Ders bilgilerini topla ({dersler} değişkeni için): öğrencinin planlı birebir dersleri
        var ogrDersleri = db.dersler.filter(function(d){
          return d.ogrenciId === ogr.id && (d.durum || "planlandi") === "planlandi";
        }).sort(function(a, b) {
          var s = String(a.tarih || "").localeCompare(String(b.tarih || ""));
          return s !== 0 ? s : String(a.saat || "").localeCompare(String(b.saat || ""));
        });
        if (!ogrDersleri.length) ogrDersleri = [ders]; /* liste asla boş kalmasın */

        var dersListesi = "";
        ogrDersleri.forEach(function(d, i) {
          dersListesi += (i + 1) + ". " + dersAdi(d.dersId) +
            (d.ogretmenAd ? " (" + d.ogretmenAd + ")" : "") + "\n" +
            tarihYaz(d.tarih) + " · " + saatAraligi(d.saat) + "\n";
        });
        dersListesi = dersListesi.replace(/\s+$/, "");
        mesaj = mesaj.replace(/{dersler}/g, dersListesi);
        /* D66-KUSUR2: yerleştirme sonrası metnin sonunda kalan fazladan tire/boşluk temizlenir;
           taslağın kendi metni aynen korunur (ör. "… REHBERLİK SERVİSİ—" → "… REHBERLİK SERVİSİ"). */
        mesaj = mesaj.replace(/[\s\-–—]+$/, "");

        // Alıcı: app.js'in alıcı çözümleyicisi (seçili tip korunur), yoksa öğrenci/veli alanları
        var alici = (typeof window.waAliciBilgisi === "function")
          ? window.waAliciBilgisi(ogr.id, typeof window.waAliciTipi === "string" ? window.waAliciTipi : "ogrenci")
          : null;
        var tel = (alici && alici.telefon) || ogr.veliTel || ogr.anneTel || ogr.babaTel || ogr.tel || "";
        tel = String(tel).replace(/\D/g, "");
        if (tel.length < 10) {
          var uyari = (alici && alici.etiket ? alici.etiket : "Veli") + " telefonu kayitli degil";
          if (typeof window.toast === "function") window.toast(uyari, "uyari");
          else alert("Veli telefon numarası kayıtlı değil.");
          return;
        }

        /* waUrl varsa app.js'in normalize kuralı kullanılır; yoksa aynı kural burada uygulanır. */
        var no = tel.replace(/^0+/, "");
        if (no.slice(0, 2) !== "90") no = "90" + no;
        var url = (typeof window.waUrl === "function")
          ? window.waUrl(mesaj, tel)
          : ("https://wa.me/" + no + "?text=" + encodeURIComponent(mesaj));
        window.open(url, "_blank");
      } catch (e) {
        console.warn("[D66-BİREBİR-WA] Hata:", e);
        return orijinalWaSatir.apply(this, arguments);
      }
    };
    window.waSatir.__d66Sarmal = true;
  })();

  // === ÖĞRETMEN ÇİZELGESİ "KAPALI" HÜCRE KOYULAŞTIRMA ===
  (function() {
    function stilEkle() {
      if (document.getElementById("__koyuKapaliStil")) return;
      var style = document.createElement("style");
      style.id = "__koyuKapaliStil";
      style.textContent =
        // Öğretmen çizelgesindeki Kapalı hücreler (title içinde "Kapalı" geçer)
        '[title*="Kapalı"] {' +
          'background-color: #9ca3af !important;' +
          'color: #1e293b !important;' +
          'opacity: 1 !important;' +
          'border-color: #0f172a !important;' +
        '}' +
        // Lejanttaki küçük "Kapalı" karesi
        '.bg-slate-100.border-slate-300 {' +
          'background-color: #9ca3af !important;' +
          'border-color: #0f172a !important;' +
        '}';
      document.head.appendChild(style);
      console.log("[KOYU-KAPALI] Stil eklendi");
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", stilEkle);
    } else {
      stilEkle();
    }
    setInterval(stilEkle, 1000);
  })();

  // === "KAPALI-GORUNUM-YAMASI" YORUM METNİNİ GİZLE ===
  setInterval(function() {
    var tumElementler = document.querySelectorAll("div, span, p, small");
    tumElementler.forEach(function(el) {
      if (el.textContent && el.textContent.indexOf("KAPALI-GORUNUM-YAMASI") !== -1) {
        if (el.textContent.trim() === "/* KAPALI-GORUNUM-YAMASI */" ||
            el.textContent.trim() === "/* KAPALI-GORUNUM-YAMASI */") {
          el.style.display = "none";
        } else {
          el.innerHTML = el.innerHTML.replace(/\/\*\s*KAPALI-GORUNUM-YAMASI\s*\*\//g, "");
        }
      }
    });
  }, 1000);

  setTimeout(function() {
    var kapalilar = document.querySelectorAll('[title*="Kapalı"]');
    console.log("[KOYU-KAPALI] Bulunan Kapalı hücre sayısı:", kapalilar.length);
    if (kapalilar.length > 0) {
      var ilk = kapalilar[0];
      console.log("[KOYU-KAPALI] İlk hücre className:", ilk.className);
      console.log("[KOYU-KAPALI] İlk hücre title:", ilk.title);
      console.log("[KOYU-KAPALI] İlk hücre arka plan:", window.getComputedStyle(ilk).backgroundColor);
    }
  }, 3000);

  // === GÜVENLİ YEDEK YÜKLEME SARMALAMASI ===
  (function() {
    var orijinalYedekOku = window.yedekOku;
    if (!orijinalYedekOku || orijinalYedekOku.__d67Sarmal) return;

    window.yedekOku = function(input) {
      var f = input.files && input.files[0];
      if (!f) return;
      input.value = ""; /* aynı dosya tekrar seçilebilsin (app.js davranışı) */

      // Dosyayı oku ve eksik alanları kontrol et
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var p = JSON.parse(e.target.result);
          var v = p.veri && p.veri.dersler ? p.veri : p;

          /* Geçersiz/başka uygulamaya ait dosya: mevcut veri hiç değişmez, yedek de indirilmez.
             (app.js yedekOku'nun zarf + dersler kontrolü korunur — bozuk dosya DB'ye yazılmaz.) */
          if (p.veri && p.veri.dersler && (p.uygulama !== "YKS Birebir Takip" || p.surum !== 1)) {
            alert("Bu yedek dosyası bu uygulamaya ait değil veya sürümü desteklenmiyor — yüklenmedi.");
            return;
          }
          if (!v || !Array.isArray(v.dersler)) {
            alert("Dosya okunamadı — geçerli bir YKS Birebir Takip yedek dosyası seçin.");
            return;
          }

          // Yeni alanları kontrol et
          var eksikler = [];
          if (!v.gorusmeler) eksikler.push("Görüşmeler");
          if (!v.sinifKapali) eksikler.push("Sınıf Kapalıları");
          if (!v.kutuphaneGunleri) eksikler.push("Kütüphane Günleri");
          if (!v.yoklamalar) eksikler.push("Ders Yoklamaları");
          if (!v.odevler) eksikler.push("Ödevler");

          var uyariMetni = "";
          if (eksikler.length > 0) {
            uyariMetni = "DİKKAT: Bu yedek dosyasında şu yeni alanlar eksik: " +
                         eksikler.join(", ") + ". Yükleme yaparsanız mevcut verilerinizdeki bu alanlar silinecek!";
          }

          // 1. Önce mevcut veriyi otomatik yedekle
          var mevcutVeri = localStorage.getItem("yksOto_arsiv_v1");
          if (mevcutVeri) {
            var yedekPaket = {
              uygulama: "YKS Birebir Takip OTOMATİK YEDEK",
              tarih: new Date().toISOString(),
              veri: JSON.parse(mevcutVeri)
            };
            var blob = new Blob([JSON.stringify(yedekPaket, null, 2)], { type: "application/json" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "OTO-YEDEK-" + new Date().toISOString().slice(0, 10) + ".json";
            document.body.appendChild(a); a.click(); a.remove();
            console.log("[GÜVENLİ-YEDEK] Mevcut veriler otomatik indirildi.");
          }

          // 2. Uyarı göster ve yükle
          var mesaj = "Yedek dosyası yüklenecek ve mevcut verileriniz bununla değiştirilecek.\n\n";
          if (uyariMetni) mesaj += uyariMetni + "\n\n";
          mesaj += mevcutVeri
            ? "Mevcut verileriniz otomatik olarak indirildi (OTO-YEDEK dosyası).\n\nDevam etmek istiyor musunuz?"
            : "Devam etmek istiyor musunuz?";

          if (confirm(mesaj)) {
            // Onaylandı, orijinal yüklemeyi yap (app.js yedekOku ile aynı adımlar)
            var vNormalized = (typeof window.normalize === "function") ? window.normalize(v) : v;
            window.DB = vNormalized;
            if (typeof window.ksGec === "function") window.ksGec();
            if (window.ui && typeof window.ui === "object") {
              window.ui.editId = null; window.ui.ogrId = null; window.ui.sinifAd = null;
            }
            if (typeof window.saveDB === "function") window.saveDB();
            if (typeof window.yenile === "function") window.yenile();
            if (typeof window.toast === "function") window.toast("Arşiv başarıyla yüklendi ✓");
            else alert("Arşiv başarıyla yüklendi.");
          }
        } catch(err) {
          console.warn("[GÜVENLİ-YEDEK] Hata:", err);
          alert("Dosya okunamadı veya geçersiz.");
        }
      };
      reader.readAsText(f);
    };

    window.yedekOku.__d67Sarmal = true;
  })();

  /* ===== HAVUZ-3-KOLON-YAMASI v1 =====
     Yalnız bu dosyadan: <style> inject + DOM manipülasyonu.
     app.js'teki renderHavuz() ve index.html DEĞİŞMEDİ.
     - Havuz kart grid'i: masaüstü 4 EŞİT sütun, tablet 2, mobil 1 sütun (gap 8px)
     - KOMPAKT kart: kare değil, 110-140px yükseklik; dikey flex (ad+sınıf | ders | konu | tarih·saat | Planla)
     - Avatar, grup sayacı ve sil ikonu sağ üstte küçük; Planla butonu en altta tam genişlik
     - Ders renkli 3px sol şerit
     ===== */
  (function () {
    var STIL_ID = "yk-havuz-3kolon-stil";
    var KOK_ID = "havuzBolum";
    var DERS_RENK = {
      "MATEMATİK": "#ef4444",
      "FİZİK": "#3b82f6",
      "KİMYA": "#22c55e",
      "BİYOLOJİ": "#eab308",
      "TÜRKÇE": "#f97316",
      "EDEBİYAT": "#ec4899",
      "COĞRAFYA": "#8b5cf6",
      "TARİH": "#78350f",
      "GEOMETRİ": "#0ea5e9",
      "İNGİLİZCE": "#64748b"
    };
    /* STANDART PALET (pastel): filtre çipleri + karttaki ders etiketi + Planla butonu aynı ailede.
       Ders → [arka plan, yazı, kenar] */
    var PALET = {
      "MATEMATİK": ["#fee2e2", "#b91c1c", "#fca5a5"],
      "FİZİK": ["#dbeafe", "#1d4ed8", "#93c5fd"],
      "KİMYA": ["#dcfce7", "#15803d", "#86efac"],
      "BİYOLOJİ": ["#fef9c3", "#a16207", "#fde047"],
      "TÜRKÇE": ["#ffedd5", "#c2410c", "#fdba74"],
      "EDEBİYAT": ["#fce7f3", "#be185d", "#f9a8d4"],
      "COĞRAFYA": ["#f3e8ff", "#6b21a8", "#d8b4fe"],
      "TARİH": ["#f5e0c3", "#78350f", "#e8c99c"],
      "GEOMETRİ": ["#e0f2fe", "#0369a1", "#7dd3fc"],
      "İNGİLİZCE": ["#f1f5f9", "#334155", "#cbd5e1"]
    };
    var CSS_METIN = [
      "/* GRID: >=1024px 4 EŞİT sütun (kompakt kart), >=640px 2 sütun, mobil 1 sütun. gap 8px */",
      "#havuzBolum .relative.md\\:grid.space-y-2{display:grid!important;grid-template-columns:repeat(1,minmax(0,1fr))!important;column-gap:.5rem!important;row-gap:.5rem!important;}",
      "#havuzBolum .relative.md\\:grid.space-y-2>*{margin-top:0!important;}",
      "#havuzBolum .relative.md\\:grid>.md\\:col-span-2{grid-column:1/-1!important;}",
      "@media (min-width:640px){#havuzBolum .relative.md\\:grid.space-y-2{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}",
      "@media (min-width:1024px){#havuzBolum .relative.md\\:grid.space-y-2{grid-template-columns:repeat(4,minmax(0,1fr))!important;column-gap:.5rem!important;row-gap:.5rem!important;}",
      "#havuzBolum .havuz-ayirici{display:none!important;}}",
      "/* ===== KOMPAKT KART: kare zorunluluğu YOK — 110-140px sabit yükseklik, dikey flex ===== */",
      "#havuzBolum .istek-kart{min-height:110px!important;max-height:140px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;gap:2px!important;padding:8px!important;overflow:hidden!important;position:relative!important;min-width:0!important;border-radius:.75rem!important;}",
      "/* Kart gövdesi + başlık satırı dikey flex akışına açılır: her parça kart flex'inde ayrı sıra olur */",
      "#havuzBolum .istek-kart>div.flex-1{display:contents!important;}",
      "#havuzBolum .istek-kart>div.flex-1>div:first-child{display:contents!important;}",
      "/* SATIR 1 (sol): AD + SINIF yan yana, tek satır, taşarsa ellipsis */",
      "#havuzBolum .istek-kart>div.flex-1>div:first-child>span:first-child{order:1!important;flex:0 0 auto!important;width:100%!important;padding:0 72px 0 0!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;background:none!important;border:0!important;line-height:1.2!important;}",
      "/* Ad + sınıf flex-wrap: sığmazsa sınıf ALT SATIRA iner (JS yok) */",
      "#havuzBolum .istek-kart .birebir-etiket{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:2px 4px!important;min-width:0!important;overflow:hidden!important;}",
      "#havuzBolum .istek-kart .birebir-etiket>span:first-child{font-size:12.5px!important;font-weight:700!important;color:#0f172a!important;line-height:1.2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;min-width:0!important;}",
      "#havuzBolum .istek-kart .birebir-etiket>span+span{font-size:9.5px!important;color:#64748b!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important;}",
      "/* Grup üye adları kartta gizli: sağ üstteki sayaç ikonunun title'ında durur */",
      "#havuzBolum .istek-kart .grup-istek-uyeler{display:none!important;}",
      "/* SATIR 2: ders etiketi (renkli pill) tek satır */",
      "#havuzBolum .istek-kart>div.flex-1>div:first-child>[data-havuz-ders-etiket]{order:2!important;align-self:flex-start!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:9px!important;line-height:1.5!important;padding:0 .375rem!important;white-space:nowrap!important;}",
      "/* SATIR 3: konu metni — 'Eksik konu' başlığı yok, en fazla 2 satır (clamp + ellipsis) */",
      "#havuzBolum .istek-kart>div.flex-1>div:nth-child(2){order:3!important;flex:1 1 auto!important;width:100%!important;min-height:0!important;align-self:stretch!important;margin:0!important;font-size:10px!important;font-weight:500!important;line-height:1.3!important;color:#475569!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important;text-overflow:ellipsis!important;word-break:break-word!important;overflow-wrap:anywhere!important;}",
      "#havuzBolum .istek-kart>div.flex-1>div:nth-child(2)>i{display:none!important;}",
      "/* SATIR 4: tarih · saat TEK satır (ikonlar gizli, yıl JS'te kırpılır) */",
      "#havuzBolum .istek-kart>div.flex-1>div:nth-child(3){order:4!important;width:100%!important;align-self:stretch!important;margin:0!important;font-size:9px!important;line-height:1.3!important;color:#94a3b8!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}",
      "#havuzBolum .istek-kart>div.flex-1>div:nth-child(3) i{display:none!important;}",
      "/* SON SIRA: Planla butonu en altta, TAM GENİŞLİK */",
      "#havuzBolum .istek-kart>button[onclick^=\"formaAktar\"]{order:5!important;width:100%!important;margin-top:auto!important;justify-content:center!important;gap:.25rem!important;font-size:10.5px!important;padding:.3rem .5rem!important;border-radius:.5rem!important;flex:0 0 auto!important;background-color:#ccfbf1!important;color:#0f766e!important;border:1px solid #99f6e4!important;font-weight:600!important;box-shadow:none!important;transition:all .2s ease!important;}",
      "#havuzBolum .istek-kart>button[onclick^=\"formaAktar\"]:hover,#havuzBolum .istek-kart>button[onclick^=\"formaAktar\"]:focus{background-color:#99f6e4!important;color:#0f766e!important;border-color:#5eead4!important;}",
      "/* ===== PLANLA BUTONU: derse göre pastel renk (data-havuz-ders) ===== */",
      "#havuzBolum .istek-kart[data-havuz-ders=\"MATEMATİK\"]>button[onclick^=\"formaAktar\"]{background-color:#fee2e2!important;color:#b91c1c!important;border-color:#fca5a5!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"FİZİK\"]>button[onclick^=\"formaAktar\"]{background-color:#dbeafe!important;color:#1d4ed8!important;border-color:#93c5fd!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"KİMYA\"]>button[onclick^=\"formaAktar\"]{background-color:#dcfce7!important;color:#15803d!important;border-color:#86efac!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"BİYOLOJİ\"]>button[onclick^=\"formaAktar\"]{background-color:#fef9c3!important;color:#a16207!important;border-color:#fde047!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"TÜRKÇE\"]>button[onclick^=\"formaAktar\"]{background-color:#ffedd5!important;color:#c2410c!important;border-color:#fdba74!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"EDEBİYAT\"]>button[onclick^=\"formaAktar\"]{background-color:#fce7f3!important;color:#be185d!important;border-color:#f9a8d4!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"COĞRAFYA\"]>button[onclick^=\"formaAktar\"]{background-color:#f3e8ff!important;color:#6b21a8!important;border-color:#d8b4fe!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"TARİH\"]>button[onclick^=\"formaAktar\"]{background-color:#f5e0c3!important;color:#78350f!important;border-color:#e8c99c!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"GEOMETRİ\"]>button[onclick^=\"formaAktar\"]{background-color:#e0f2fe!important;color:#0369a1!important;border-color:#7dd3fc!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"İNGİLİZCE\"]>button[onclick^=\"formaAktar\"]{background-color:#f1f5f9!important;color:#334155!important;border-color:#cbd5e1!important;}",
      "/* Planla hover: ders rengi bir ton koyulaşır */",
      "#havuzBolum .istek-kart[data-havuz-ders=\"MATEMATİK\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#fecaca!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"FİZİK\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#bfdbfe!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"KİMYA\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#bbf7d0!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"BİYOLOJİ\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#fef08a!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"TÜRKÇE\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#fed7aa!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"EDEBİYAT\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#fbcfe8!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"COĞRAFYA\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#e9d5ff!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"TARİH\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#ebd2ad!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"GEOMETRİ\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#bae6fd!important;}",
      "#havuzBolum .istek-kart[data-havuz-ders=\"İNGİLİZCE\"]>button[onclick^=\"formaAktar\"]:hover{background-color:#e2e8f0!important;}",
      "#havuzBolum .istek-kart>span[class*=\"text-emerald\"]{order:5!important;margin-top:auto!important;align-self:center!important;font-size:9.5px!important;white-space:nowrap!important;}",
      "/* Avatar: sağ üst köşede mutlak konumlu küçük ikon (32px -> 18px) */",
      "#havuzBolum .istek-kart>div.rounded-full{position:absolute!important;top:8px!important;right:8px!important;width:18px!important;height:18px!important;font-size:7px!important;line-height:1!important;}",
      "/* Grup üyeleri: sağ üst köşede mutlak konumlu küçük ikon + sayı */",
      "#havuzBolum .istek-kart>.istek-uye-buton{position:absolute!important;top:6px!important;right:30px!important;width:auto!important;padding:0!important;}",
      "#havuzBolum .istek-kart>.istek-uye-buton button{font-size:9.5px!important;gap:2px!important;padding:0 .2rem!important;line-height:1!important;}",
      "#havuzBolum .istek-kart .istek-uye-sayi{font-size:9.5px!important;font-weight:700!important;opacity:.85;}",
      "/* Sil butonu: sağ üstte minik ikon (grup ikonunun yanında) */",
      "#havuzBolum .istek-kart>button[onclick^=\"istekSil\"]{position:absolute!important;top:9px!important;right:50px!important;width:16px!important;height:16px!important;padding:0!important;line-height:1!important;opacity:.55;}",
      "#havuzBolum .istek-kart>button[onclick^=\"istekSil\"]:hover{opacity:1;}",
      "#havuzBolum .istek-kart>button[onclick^=\"istekSil\"] i{font-size:9px!important;}",
      "#havuzBolum .istek-kart span.text-amber-700{display:none!important;}",
      "/* DERS RENKLİ SOL ŞERİT: 3px border-left (renk JS'ten) */",
      "#havuzBolum .istek-kart[data-havuz-ders]{border-left:3px solid var(--havuz-ders-renk,#cbd5e1)!important;}",
      ""
    ].join("\n");

    function stilEkle() {
      if (document.getElementById(STIL_ID)) return;
      var st = document.createElement("style");
      st.id = STIL_ID;
      st.textContent = CSS_METIN;
      (document.head || document.documentElement).appendChild(st);
    }

    function metinDugumleriniTemizle(el) {
      for (var i = el.childNodes.length - 1; i >= 0; i--) {
        if (el.childNodes[i].nodeType === 3) el.removeChild(el.childNodes[i]);
      }
    }

    /* Ders etiketini METNE göre bulur (class/token bağımlılığı yok) */
    function dersEtiketiBul(kart) {
      var spanlar = kart.querySelectorAll("span");
      for (var i = 0; i < spanlar.length; i++) {
        var t = (spanlar[i].textContent || "").trim();
        if (t && Object.prototype.hasOwnProperty.call(DERS_RENK, t)) return spanlar[i];
      }
      return null;
    }
    function kartIsle(kart) {
      /* 1) Ders renkli 3px sol şerit */
      var etiket = dersEtiketiBul(kart);
      if (etiket) {
        var ders = (etiket.textContent || "").trim();
        etiket.setAttribute("data-havuz-ders-etiket", ders);
        if (kart.getAttribute("data-havuz-ders") !== ders) {
          kart.setAttribute("data-havuz-ders", ders);
          kart.style.setProperty("--havuz-ders-renk", DERS_RENK[ders]);
        }
      }

      /* 2) "Eşleştir & Planla" -> "Planla" (ikon korunur) */
      var planBtn = kart.querySelector('button[onclick^="formaAktar"]');
      if (planBtn && planBtn.getAttribute("data-havuz-kisa") !== "1") {
        metinDugumleriniTemizle(planBtn);
        planBtn.appendChild(document.createTextNode("Planla"));
        planBtn.setAttribute("data-havuz-kisa", "1");
        planBtn.setAttribute("title", "Eşleştir & Planla");
      }

      /* 3) Grup üye rozeti: içeriği SIFIRDAN yazılır — butonda yalnız ikon + TEK sayı kalır.
         (Daha önce yazılmış/artmış her metin düğümü innerHTML ile silinir.) */
      var uyeBtn = kart.querySelector(".istek-uye-buton button");
      if (uyeBtn) {
        var yazi = (uyeBtn.textContent || "").trim();
        var uyeAcikMi = /^kapat$/i.test(yazi);
        var sayi = (yazi.match(/\((\d+)\)/) || [])[1] || "";
        var uyeSayi = parseInt(sayi, 10);
        if (!uyeSayi || uyeSayi < 1) uyeSayi = 1; /* tekli istek = 1 üye */
        var imza = uyeAcikMi ? "kapat" : "rozet:" + uyeSayi;
        if (uyeBtn.getAttribute("data-havuz-uye") !== imza) {
          uyeBtn.setAttribute("data-havuz-uye", imza);
          if (yazi) uyeBtn.setAttribute("title", yazi);
          uyeBtn.innerHTML = '<i class="fa-solid fa-user-group"></i>' +
            (uyeAcikMi ? "" : '<span class="istek-uye-sayi">' + uyeSayi + "</span>");
        }
      }

      /* 3b) Kart gövdesinde başıboş SAYI metni kalmasın (ör. "18" gibi tek başına yazılmış sayılar) */
      for (var si = kart.childNodes.length - 1; si >= 0; si--) {
        var sn = kart.childNodes[si];
        if (sn.nodeType === 3) {
          var sv = sn.nodeValue || "";
          if (/\d/.test(sv) && /^[\s\d.,:;·-]+$/.test(sv)) kart.removeChild(sn);
        }
      }

      /* 3c) Avatar yalnızca BAŞ HARFLERİ taşır: içine sayı sızmışsa baş harflerle düzeltilir */
      var av = null;
      for (var ai = 0; ai < kart.children.length; ai++) {
        var ace = kart.children[ai];
        if (ace.tagName === "DIV" && (ace.className || "").indexOf("rounded-full") >= 0) { av = ace; break; }
      }
      if (av) {
        var avT = (av.textContent || "").trim();
        if (!avT || /^[\d\s.,:;-]+$/.test(avT)) {
          var adSpan = kart.querySelector(".birebir-etiket>span");
          var adT = adSpan ? (adSpan.textContent || "").trim() : "";
          if (adT) {
            var adPar = adT.split(/\s+/);
            av.textContent = ((adPar[0] || "?")[0] + (adPar.length > 1 ? adPar[adPar.length - 1][0] : "")).toLocaleUpperCase("tr-TR");
          } else if (!avT) {
            av.textContent = "?";
          }
        }
      }

      /* 4) Tarih + saat TEK satır: yıl kırpılır -> "19.10 · 7 · 14:40-15:20"
         Yalnız takvim ikonunu taşıyan satır hedeflenir (kart içi, başka metne dokunulmaz). */
      var govde = kart.querySelector("div.flex-1");
      var tarihDiv = null;
      if (govde) {
        for (var k = 0; k < govde.children.length; k++) {
          var c = govde.children[k];
          if (c.querySelector && c.querySelector(".fa-calendar")) { tarihDiv = c; break; }
        }
      }
      if (tarihDiv && tarihDiv.getAttribute("data-havuz-tarih") !== "1") {
        var ham = (tarihDiv.textContent || "").replace(/\s+/g, " ").trim();
        if (ham) {
          /* Okunaklı tarih/saat: "19.10.2026 · 8 · 15:30-16:10" -> "19 Ekim saat 15:30"
             - Gün korunur ("05" -> "05"), ay SAYISAL yerine TÜRKÇE adıyla yazılır
             - Ders saati kodu (tırnaksız sayı) ve bitiş saati atlanır; yalnız BAŞLANGIÇ saati kalır
             - Saatsiz metin "19 Ekim", tarihsiz metin "saat 15:30" olarak bozulmadan çıkar */
          var AYLAR_HAVUZ = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
          var gunAy = ham.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
          var saatEs = ham.match(/(\d{1,2}:\d{2})/);
          var parcalar = [];
          if (gunAy) {
            var ayNo = parseInt(gunAy[2], 10);
            parcalar.push(gunAy[1] + " " + (AYLAR_HAVUZ[ayNo] || gunAy[2]));
          }
          if (saatEs) parcalar.push("saat " + saatEs[1]);
          if (parcalar.length) {
            tarihDiv.textContent = parcalar.join(" ");
            tarihDiv.setAttribute("data-havuz-tarih", "1");
          }
        }
      }

      /* 5) Grup üyeleri sağ üstte ikon: üye adları buton title'ında */
      var uyeKap = kart.querySelector(".istek-uye-buton");
      var uyeGrup = kart.querySelector(".grup-istek-uyeler");
      if (uyeKap && uyeGrup && uyeKap.getAttribute("data-havuz-uye-ad") !== "1") {
        var adlar = (uyeGrup.textContent || "").replace(/\s+/g, " ").trim();
        var uyeB = uyeKap.querySelector("button");
        if (uyeB && adlar) uyeB.setAttribute("title", "Grup üyeleri: " + adlar);
        uyeKap.setAttribute("data-havuz-uye-ad", "1");
      }
    }
    /* HAVUZ-FORM-KORUMA: bu blok input/select/textarea'lara değer veya placeholder YAZMAZ;
       kart DOM'u dışına çıkmaz. Yalnızca bir alan yanlışlıkla "null" metnine düşmüşse
       orijinaline geri alınır (asla başka bir değer atanmaz). */
    var FORM_ORIJINAL = {
      "h-ogrenci": { placeholder: "Öğrenci adı" },
      "h-konu": { placeholder: "Eksik konu (örn. Paragraf)" },
      "h-ders": { ilkSecenek: "Ders seçin" }
    };

    function formlariKoru(kok) {
      var alanlar = kok.querySelectorAll("input, select, textarea");
      for (var i = 0; i < alanlar.length; i++) {
        var el = alanlar[i];
        var orig = FORM_ORIJINAL[el.id] || {};
        if (el.tagName === "SELECT") {
          var secili = (el.options && el.selectedIndex >= 0) ? el.options[el.selectedIndex] : null;
          var ilk = el.options && el.options[0] ? el.options[0] : null;
          if (ilk && (ilk.textContent || "").trim() === "null" && orig.ilkSecenek) ilk.textContent = orig.ilkSecenek;
          if ((secili && (secili.textContent || "").trim() === "null") || String(el.value) === "null") el.selectedIndex = 0;
        } else {
          if (String(el.value) === "null") el.value = "";
          var ph = el.getAttribute("placeholder");
          if (ph && ph !== "null") {
            el.__havuzPh = ph; /* sağlam placeholder'ı hatırla (id'siz alanlar dahil) */
          } else if (ph === "null") {
            var yedek = orig.placeholder || el.__havuzPh;
            if (yedek) el.setAttribute("placeholder", yedek);
            else el.removeAttribute("placeholder");
          }
        }
      }
    }

    /* FİLTRE ÇİPLERİ + DERS ETİKETİ: tek pastel palet.
       app.js çip/etiket renkleri dersle tutarsız kalabiliyor (ör. İNGİLİZCE turuncu çıkıyor);
       burada çipler ve karttaki ders etiketi PALET'e zorlanır — Planla butonu ve sol şeritle aynı aile.
       CSS :contains() geçersiz olduğu için JS ile metinden ders adı okunur. */
    function cipleriBoya() {
      var kok = document.getElementById(KOK_ID);
      if (!kok) return;

      /* 1) Üst filtre çipleri (onclick="istekFiltrele(...)") */
      var dugmeler = kok.querySelectorAll('button[onclick^="istekFiltrele"]');
      for (var i = 0; i < dugmeler.length; i++) {
        var b = dugmeler[i];
        var t = (b.textContent || "").replace(/\s+/g, " ").trim();
        if (!t || /^Tüm Dersler/i.test(t)) continue; /* "Tüm Dersler" nötr kalır */
        var ad = null;
        for (var k in PALET) {
          if (!Object.prototype.hasOwnProperty.call(PALET, k)) continue;
          if (t.indexOf(k) === 0) { ad = k; break; }
        }
        if (!ad || b.getAttribute("data-havuz-cip") === ad) continue;
        var r = PALET[ad];
        b.setAttribute("data-havuz-cip", ad);
        b.style.setProperty("background-color", r[0], "important");
        b.style.setProperty("color", r[1], "important");
        b.style.setProperty("border", "1px solid " + r[2], "important");
      }

      /* 2) Kart içindeki ders etiketi (pill) da aynı paletle boyanır */
      var etiketler = kok.querySelectorAll(".istek-kart [data-havuz-ders-etiket]");
      for (var j = 0; j < etiketler.length; j++) {
        var e = etiketler[j];
        var dAd = (e.getAttribute("data-havuz-ders-etiket") || "").trim();
        var p = Object.prototype.hasOwnProperty.call(PALET, dAd) ? PALET[dAd] : null;
        if (!p || e.getAttribute("data-havuz-palet") === dAd) continue;
        e.setAttribute("data-havuz-palet", dAd);
        e.style.setProperty("background-color", p[0], "important");
        e.style.setProperty("color", p[1], "important");
      }
    }

    function uygula() {
      var kok = document.getElementById(KOK_ID);
      if (!kok) return;
      formlariKoru(kok);
      /* YALNIZCA kartlar: form alanlarına (input/select/textarea) hiç dokunulmaz */
      var kartlar = kok.querySelectorAll(".istek-kart");
      for (var i = 0; i < kartlar.length; i++) kartIsle(kartlar[i]);
      cipleriBoya();
    }

    var bekliyor = false;
    function planla() {
      if (bekliyor) return;
      bekliyor = true;
      var calistir = function () { bekliyor = false; uygula(); };
      if (window.requestAnimationFrame) window.requestAnimationFrame(calistir);
      else setTimeout(calistir, 16);
    }

    /* renderHavuz() #havuzBolum.innerHTML'i baştan yazar; DOM'u izleyip yeniden uygularız */
    function baglan() {
      stilEkle();
      uygula();
      var kok = document.getElementById(KOK_ID);
      if (!kok) return false;
      if (!kok.__havuz3KolonIzle) {
        kok.__havuz3KolonIzle = true;
        if (window.MutationObserver) {
          new MutationObserver(function () { planla(); }).observe(kok, { childList: true, subtree: true });
        }
        /* Form alanları kart render'ından bağımsız olarak da "null"a düşmesin:
           yalnızca bozuk alanı onarır, sağlam alanlara dokunmaz. */
        kok.__havuzFormKoru = setInterval(function () {
          var k = document.getElementById(KOK_ID);
          if (k) formlariKoru(k);
        }, 800);
        /* Filtre çipleri her render'da yeniden çizilir: 500ms'lik boyama turu renkleri kalıcı tutar
           (data-havuz-cip damgası sayesinde aynı çip tekrar boyanmaz). */
        kok.__havuzCipBoya = setInterval(cipleriBoya, 500);
      }
      return true;
    }

    function baslat() {
      if (baglan()) return;
      var deneme = 0;
      var zaman = setInterval(function () {
        deneme++;
        if (baglan() || deneme > 40) clearInterval(zaman);
      }, 150);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat);
    else baslat();
  })();

  /* ================================================================
     SÜRÜKLE-BIRAK ÇAKIŞMA GÖSTERGESİ (yalnız bu dosya — app.js DEĞİŞMEZ)
     app.js'teki iki mevcut fonksiyon SARMALANIR:
       window.istekDragOver → hedef hücre yeşil (uygun) / kırmızı (çakışma) boyanır
       window.istekBurak    → bırakmadan ÖNCE çakışma kontrolü; çakışmada kayıt ENGELLENİR
     Orijinal fonksiyonlar her durumda çağrılmaya devam eder (preventDefault + mevcut
     kilit/kayıt akışı korunur). Gösterge kodundaki bir hata sürüklemeyi ASLA bozmaz:
     tüm kontrol try/catch içinde, hata hâlinde orijinal akış aynen sürer.
     ================================================================ */

  /* app.js global yardımcıları — yoksa güvenli yerel karşılıkları kullanılır */
  function cakismaDb() {
    return (typeof window.DB === "object" && window.DB) ? window.DB : null;
  }
  function cakismaKod(saat) {
    if (typeof window.ksKodOf === "function") return window.ksKodOf(saat);
    return String(saat == null ? "" : saat);
  }
  function cakismaGunIdx(tarih) {
    if (typeof window.dowIdx === "function") return window.dowIdx(tarih);
    var d = new Date(String(tarih) + "T12:00:00");
    return isNaN(d.getTime()) ? -1 : (d.getDay() + 6) % 7;
  }
  function cakismaDersOgrenciler(ders) {
    if (typeof window.dersOgrenciIds === "function") return window.dersOgrenciIds(ders) || [];
    var tum = [ders && ders.ogrenciId].concat((ders && Array.isArray(ders.ogrenciIds)) ? ders.ogrenciIds : []);
    return tum.filter(function (v, i, a) { return v != null && v !== "" && a.indexOf(v) === i; });
  }

  /* GÖREV 3 — çakışma sebebi (dizi) / çakışma var mı (boolean)
     TEK ÇEKİRDEK (cakismaSebepDizisi) iki kaynağı da besler:
       cakismaSebebi      → havuz isteği (öğrenciler istekten)
       dersCakismaSebebi  → planlı ders kartı (öğrenciler DB.dersler'den, kendi kaydı hariç)
     Kontroller: (0) Pazar günü (kurum kapalı), (1) öğretmen o saatte başka derste,
     (2) öğretmenin aynı saatte ek dersi, (3) öğrenci/grup o saatte başka derste,
     (4) öğrencinin sınıfının o gün+saat slotunda toplu dersi var. */
  function cakismaSebepDizisi(uyeler, haricId, tarih, saat, ogretmenId) {
    var sebepler = [];
    var db = cakismaDb();
    if (!db || !tarih || !saat) return sebepler;
    /* 0) PAZAR — app.js'teki istekBurak "pazar" (di === 6) guard'ıyla AYNI kural: kurum kapalı.
       Gün bağımsız bir yasak olduğu için diğer kontrollere bakılmadan dönülür. */
    if (cakismaGunIdx(tarih) === 6) {
      sebepler.push("Pazar günü ders yapılamaz");
      return sebepler;
    }
    var dersler = Array.isArray(db.dersler) ? db.dersler : [];
    var kod = cakismaKod(saat);
    if (!kod) return sebepler; /* kısa kodda karşılığı olmayan saat (mola vb.) → kontrol yok */
    var anahtar = cakismaGunIdx(tarih) + "-" + kod;
    var haric = haricId || "";            /* kendi kaydı kendisiyle çakışmasın */
    var katilimcilar = Array.isArray(uyeler) ? uyeler : [];

    /* 1) Öğretmen dolu (taşınan dersin kendi kaydı hariç) */
    var ogretmenDolu = dersler.some(function (l) {
      return l && l.id !== haric && l.ogretmenId === ogretmenId && l.tarih === tarih &&
        cakismaKod(l.saat) === kod && l.durum !== "iptal";
    });
    if (ogretmenDolu) sebepler.push("Öğretmen dolu");

    /* 2) Ek ders var — aynı öğretmenin aynı tarih + aynı saat kodundaki ek dersi
       (DB.ekDersler); app.js'teki dersBurak "ekDolu" kontrolüyle aynı eşleşme. */
    var ekDersler = Array.isArray(db.ekDersler) ? db.ekDersler : [];
    var ekDersVar = ekDersler.some(function (l) {
      return l && l.ogretmenId === ogretmenId && l.tarih === tarih &&
        cakismaKod(l.saat) === kod && l.durum !== "iptal";
    });
    if (ekDersVar) sebepler.push("Ek ders var");

    /* 3) Öğrenci dolu (taşınan dersin kendi kaydı hariç) */
    var ogrenciDolu = katilimcilar.some(function (oid) {
      return dersler.some(function (l) {
        return l && l.id !== haric && l.tarih === tarih && cakismaKod(l.saat) === kod &&
          l.durum !== "iptal" && cakismaDersOgrenciler(l).indexOf(oid) >= 0;
      });
    });
    if (ogrenciDolu) sebepler.push("Öğrenci dolu");

    /* 4) Sınıf dolu (öğrencinin sınıfının toplu dersi: DB.sinifProg[sinif] = ["0-3", …]) */
    var prog = (db.sinifProg && typeof db.sinifProg === "object") ? db.sinifProg : {};
    var ogrenciler = Array.isArray(db.ogrenciler) ? db.ogrenciler : [];
    var sinifDolu = katilimcilar.some(function (oid) {
      var o = ogrenciler.filter(function (x) { return x && x.id === oid; })[0];
      return !!(o && o.sinif && Array.isArray(prog[o.sinif]) && prog[o.sinif].indexOf(anahtar) >= 0);
    });
    if (sinifDolu) sebepler.push("Sınıf dolu");

    return sebepler;
  }

  /* Havuz isteği → sebep dizisi (öğrenciler istekten: ana + grup üyeleri)
     BRANŞ KONTROLÜ: hedef öğretmen isteğin dersini VEREMİYORSA "Farklı branş (X)" sebebi
     eklenir. Kaynak ders kartı taşımayla AYNI: hedefBransUygun() + window.__ksBransHarita
     (ders kodu → o dersi verebilecek branş kodları; ör. biy: ["biy"]). Burada İKİNCİ bir
     harita KOPYALANMAZ. Kontrol istekler için ATLANMAZ; hedef öğretmen kimliği ya da
     isteğin dersId'si yoksa (branş kuralı uygulanamaz) yanlış kırmızı üretmemek için geçilir. */
  function cakismaSebebi(istekId, tarih, saat, ogretmenId) {
    var db = cakismaDb();
    var uyeler = [];
    var istek = null;
    if (db) {
      istek = (Array.isArray(db.istekler) ? db.istekler : []).filter(function (x) {
        return x && x.id === istekId;
      })[0] || null;
      if (istek) {
        uyeler = (typeof window.istekOgrenciIds === "function") ? (window.istekOgrenciIds(istek) || []) : [];
        if (!uyeler.length && istek.ogrenciId) uyeler = [istek.ogrenciId];
      }
    }
    var sebepler = [];
    /* 5) BRANŞ — hedef öğretmenin branşı isteğin dersini verebiliyor mu?
       Ders kartında bunu dersCakismaSebebi yapıyor; havuz isteğinde AYNI kural burada. */
    if (db && istek && istek.dersId && ogretmenId) {
      var hedefOgretmen = (Array.isArray(db.ogretmenler) ? db.ogretmenler : []).filter(function (o) {
        return o && o.id === ogretmenId;
      })[0] || null;
      if (hedefOgretmen && !hedefBransUygun(istek, hedefOgretmen)) {
        sebepler.push("Farklı branş (" + bransEtiketi(hedefOgretmen.brans) + ")");
      }
    }
    return sebepler.concat(cakismaSebepDizisi(uyeler, "", tarih, saat, ogretmenId));
  }

  /* BRANŞ KURALI — TEK KAYNAK takip-sistem.js'teki HARITA (ders kodu → o dersi verebilecek
     branş kodları; ör. kim: ["kim"], mat: ["mat", "geo"], geo: ["geo", "mat"]).
     Harita yukarıdaki BRANS-DERS-CIFT-YON bloğunda window.__ksBransHarita olarak yayınlanır;
     burada KOPYALANMAZ. Branş adı normalizasyonu da ("Kimya" → "kim") aynı bloktan gelir.
     Haritada hiç geçmeyen bir ders için varsayılan: yalnız kendi kodundaki branş verir.
     Harita hiç yoksa app.js'in bransDersUygun() kaydetme kuralına düşer. */
  function bransEtiketi(brans) {
    var ham = String(brans || "");
    var kod = ham;
    /* Branş alanı "matematik" / "Kimya" gibi uzun yazılmış olabilir → kanonik ders kodu */
    if (typeof window.bransDersNorm === "function") kod = window.bransDersNorm(ham);
    var es = window.BRANS_AD_ES;
    if (es && es[kod]) kod = es[kod];
    var D = window.DERS;
    if (D && D[kod] && D[kod].ad) return String(D[kod].ad);
    return ham || "?";
  }
  function hedefBransUygun(ders, hedefOgretmen) {
    if (!ders || !ders.dersId) return true;
    var harita = window.__ksBransHarita;
    var kodla = window.__ksBransKodu;
    var norm = window.__ksBransNorm;
    if (harita && typeof harita === "object" && (typeof kodla === "function" || typeof norm === "function")) {
      var brans = (typeof kodla === "function") ? kodla(hedefOgretmen) : norm(hedefOgretmen && hedefOgretmen.brans);
      if (!brans) return true; /* branşsız öğretmen: kural uygulanamaz, yanlış kırmızı üretme */
      var izinli = harita[ders.dersId];
      if (!Array.isArray(izinli)) izinli = [ders.dersId]; /* haritada olmayan ders → kendi branşı */
      return izinli.indexOf(brans) >= 0;
    }
    /* Yedek 1: app.js'in kaydetme kuralı (bransDersUygun) */
    if (typeof window.bransDersUygun === "function" && hedefOgretmen && hedefOgretmen.id) {
      return !!window.bransDersUygun(hedefOgretmen.id, ders.dersId, ders.konu);
    }
    /* Yedek 2: app.js global haritası (ders kodu → branş kodları) */
    var yedekHarita = window.BRANS_DERS_HARITA;
    if (yedekHarita && typeof yedekHarita === "object" && Array.isArray(yedekHarita[ders.dersId])) {
      var ham = String((hedefOgretmen && hedefOgretmen.brans) || "");
      return yedekHarita[ders.dersId].some(function (b) { return String(b) === ham; });
    }
    return true; /* kural okunamıyorsa yanlış kırmızı üretmeyiz */
  }

  /* GÖREV 2 — planlı ders kartı → sebep dizisi.
     Hedef öğretmen dersi VEREMİYORSA yalnız branş sebebi döner (diğer kontroller anlamsız).
     Veriyorsa öğretmen dolu / ek ders / öğrenci dolu / sınıf dolu / Pazar kontrolleri ortak
     çekirdekten gelir; öğrenci bilgisi DB.dersler'den (ana + grup üyeleri), dersin KENDİ
     kaydı tüm kontrollerden hariç tutulur. */
  function dersCakismaSebebi(dersId, hedefTarih, hedefSaat, hedefOgretmenId) {
    var db = cakismaDb();
    if (!db) return ["Ders bulunamadı"];
    var dersler = Array.isArray(db.dersler) ? db.dersler : [];
    var ders = dersler.filter(function (l) { return l && l.id === dersId; })[0] || null;
    if (!ders) return ["Ders bulunamadı"];
    if (!ders.dersId) return ["Ders kodu bulunamadı"];
    var hedefOgretmen = (Array.isArray(db.ogretmenler) ? db.ogretmenler : []).filter(function (o) {
      return o && o.id === hedefOgretmenId;
    })[0] || null;
    if (!hedefOgretmen) return ["Hedef öğretmen bulunamadı"];

    /* Yapısal engeller (app.js dersBurak): iptal/tamamlanmış ve grup ders çizelgede taşınamaz */
    var yapisal = [];
    if (ders.durum === "iptal" || ders.durum === "tamamlandi") yapisal.push("Ders taşınamaz");
    if (cakismaDersOgrenciler(ders).length !== 1) yapisal.push("Grup ders taşınamaz");
    if (yapisal.length) return yapisal;

    /* Branş: aynı branştaki başka öğretmen GEÇERLİ (Elif Koç'un Kimya dersi → Selina Kutlu) */
    if (!hedefBransUygun(ders, hedefOgretmen)) {
      return ["Farklı branş (" + bransEtiketi(hedefOgretmen.brans) + ")"];
    }

    return cakismaSebepDizisi(cakismaDersOgrenciler(ders), ders.id, hedefTarih, hedefSaat, hedefOgretmenId);
  }

  function cakismaVarMi(istekId, tarih, saat, ogretmenId) {
    return cakismaSebebi(istekId, tarih, saat, ogretmenId).length > 0;
  }

  /* Hücre boyama (GÖREV 2) — hücrenin özgün arka planı, kenarlığı, position'ı, title'ı ve
     İÇERİĞİ saklanır; sürükleme bitince hepsi birebir geri konur. */
  var cakismaIsaretli = [];
  function cakismaYedekle(el) {
    if (el.__ckYedek) return;
    el.__ckYedek = {
      bg: el.style.backgroundColor || "",
      golge: el.style.boxShadow || "",
      pozisyon: el.style.position || "",
      icerik: (typeof el.innerHTML === "string") ? el.innerHTML : null,
      baslik: el.getAttribute("title")
    };
  }
  /* Hücre içi sebep etiketi. Mutlak konumlu: hücrenin mevcut içeriği ("+") korunur, satır
     yüksekliği değişmez (sürükleme sırasında tablo zıplamaz). Aynı etiket tekrar tekrar
     üretilmez; yalnız metni/rengi tazelenir (dragover saniyede birçok kez çalışır). */
  function cakismaEtiketYaz(el, sebepler) {
    var metin = sebepler.length ? sebepler.join(" · ") : "Uygun";
    var renk = sebepler.length ? "#b91c1c" : "#15803d";
    var s = el.querySelector ? el.querySelector(".ck-cakisma-etiket") : null;
    if (!s) {
      s = document.createElement("span");
      s.className = "ck-cakisma-etiket";
      s.setAttribute("style", "position:absolute;left:1px;right:1px;bottom:1px;font-size:8px;font-weight:800;line-height:1.1;text-align:center;white-space:normal;word-break:break-word;pointer-events:none;");
      el.style.position = "relative";
      if (el.appendChild) el.appendChild(s);
    }
    if (s.textContent !== metin) s.textContent = metin;
    if (s.style) s.style.color = renk;
  }
  function cakismaHucreTemizle(el) {
    if (!el || !el.__ckYedek) return;
    var y = el.__ckYedek;
    /* Önce yalnız bizim eklediğimiz etiket kaldırılır; içerik gerçekten bizim tarafımızdan
       değiştirildiyse (etiket vardı) özgün innerHTML birebir geri yazılır. */
    var rozet = el.querySelector ? el.querySelector(".ck-cakisma-etiket") : null;
    if (rozet) {
      if (rozet.parentNode) rozet.parentNode.removeChild(rozet);
      if (y.icerik !== null && typeof y.icerik === "string") el.innerHTML = y.icerik;
    }
    el.style.backgroundColor = y.bg || "";
    el.style.boxShadow = y.golge || "";
    el.style.position = y.pozisyon || "";
    if (y.baslik === null || typeof y.baslik === "undefined") el.removeAttribute("title");
    else el.setAttribute("title", y.baslik);
    el.__ckYedek = null;
  }
  function cakismaBoya(el, sebepler) {
    if (!el || !el.style) return;
    cakismaYedekle(el);
    if (cakismaIsaretli.indexOf(el) < 0) cakismaIsaretli.push(el);
    if (sebepler.length) {
      el.style.backgroundColor = "#fee2e2";
      el.style.boxShadow = "inset 0 0 0 2px #ef4444";
      el.setAttribute("title", "Çakışma: " + sebepler.join(" · "));
    } else {
      el.style.backgroundColor = "#dcfce7";
      el.style.boxShadow = "inset 0 0 0 2px #22c55e";
      el.setAttribute("title", "Uygun");
    }
    cakismaEtiketYaz(el, sebepler); /* GÖREV 2: hücre içinde "Uygun" / "Öğrenci dolu" … */
  }
  function cakismaHepsiniTemizle() {
    for (var i = 0; i < cakismaIsaretli.length; i++) cakismaHucreTemizle(cakismaIsaretli[i]);
    cakismaIsaretli = [];
  }

  /* Hedef hücrenin TARİHİ: hücrenin kendi ondrop çağrısındaki tarih literali (haftalık ve
     günlük tabloda tek doğru kaynak); yoksa görüntülenen pencere başlangıcı + gün indeksi. */
  function cakismaHucreTarihi(el, gunIdx) {
    var od = (el && el.getAttribute) ? (el.getAttribute("ondrop") || "") : "";
    var m = od.match(/'([0-9]{4}-[0-9]{2}-[0-9]{2})'/);
    if (m) return m[1];
    var p = (typeof window.pencere === "function") ? window.pencere() : null;
    if (p && p.start && typeof window.addDaysKey === "function") {
      return window.addDaysKey(p.start, Number(gunIdx) || 0);
    }
    return "";
  }

  /* GÖREV 1 — istek havuzu kartı için TÜM HARİTA bir kez boyandı mı?
     dragstart kaçırılsa bile ilk dragover'da harita boyanır (aşağıdaki sarmal). */
  var cakismaHaritaBoyandi = false;

  /* GÖREV 1 — istekDragOver sarmalı: hücreyi anında yeşil/kırmızı boyar.
     GÖREV 2 — istekBurak sarmalı: çakışma varsa bırakmayı engeller, yoksa orijinali çağırır.
     İKİ SARMAL TEK KURUCUDA (cakismaIstekSarmallariniKur) ve İDEMPOTENT: her çağrıda
     window.istekDragOver / window.istekBurak'ın o anki gerçek fonksiyonu sarılır; zaten
     sarmal takılıysa (__ckSarmal) ikinci kez sarılmaz. Kurucu açılışta bir kez, ayrıca HER
     dragstart'ta çağrılır: app.js globali sonradan yeniden atasa ya da bu dosya app.js'ten
     ÖNCE yüklense bile istek havuzu kartları çizelgedeki ders kartlarıyla AYNI
     (cakismaSebebi / cakismaVarMi / cakismaHedefHucreler) kurallardan geçer. */
  function cakismaIstekSarmallariniKur() {
    /* GÖREV 1 — istekDragOver sarmalı */
    var cakismaAsilDragOver = window.istekDragOver;
    if (typeof cakismaAsilDragOver === "function" && !cakismaAsilDragOver.__ckSarmal) {
      var cakismaDragOverSarmal = function (ev, el) {
        var sonuc = cakismaAsilDragOver.apply(this, arguments); /* preventDefault + mevcut teal vurgu */
        try {
          var istekId = window.istekDropHedef;
          var dersId = window.dersDropHedef;
          /* dragstart hiç ulaşmadıysa (ya da harita boyanamadıysa) burada bir kez boyanır:
             havuz isteği sürüklenirken tüm drop-zone hücreleri aynı anda yeşil/kırmızı olur. */
          if (!cakismaHaritaBoyandi) {
            cakismaHaritaBoyandi = true;
            if (dersId) window.__ckSonBoya = cakismaTumHucreleriBoyaDers(dersId);
            else if (istekId) window.__ckSonBoya = cakismaTumHucreleriBoya(istekId);
          }
          if (!istekId || dersId || !el || !el.getAttribute) return sonuc; /* ders kartı taşıma → dokunma */
          var saat = el.getAttribute("data-drop-saat") || "";
          var ogrtId = el.getAttribute("data-drop-ogrt") || "";
          var tarih = cakismaHucreTarihi(el, el.getAttribute("data-drop-gun"));
          if (!tarih || !saat) return sonuc;
          cakismaBoya(el, cakismaSebebi(istekId, tarih, saat, ogrtId));
        } catch (e) { /* gösterge hatası sürüklemeyi bozmaz */ }
        return sonuc;
      };
      cakismaDragOverSarmal.__ckSarmal = true;
      window.istekDragOver = cakismaDragOverSarmal;
    }

    /* GÖREV 2 — istekBurak sarmalı: çakışma varsa bırakmayı engeller, yoksa orijinali çağırır */
    var cakismaAsilBurak = window.istekBurak;
    if (typeof cakismaAsilBurak === "function" && !cakismaAsilBurak.__ckSarmal) {
      var cakismaBurakSarmal = function (ev, el, ogrtId, tarih, saat) {
        try {
          var istekId = window.istekDropHedef;
          var dersId = window.dersDropHedef;
          if (istekId && !dersId) {
            /* Hedef öğretmen kimliği inline ondrop'tan gelir; boş gelirse hücrenin kendi
               data-drop-ogrt niteliğinden okunur — branş kontrolü hedefsiz çalışamaz. */
            var hedefId = ogrtId || ((el && el.getAttribute) ? (el.getAttribute("data-drop-ogrt") || "") : "");
            var sebepler = cakismaSebebi(istekId, tarih, saat, hedefId);
            if (sebepler.length) {
              if (ev && ev.preventDefault) ev.preventDefault();
              if (ev && ev.stopPropagation) ev.stopPropagation();
              if (el && el.classList) el.classList.remove("dnd-uygun");
              if (typeof window.toast === "function") {
                window.toast("Çakışma var: " + sebepler.join(" · "), "hata");
              }
              window.istekDropHedef = null; /* bırakma tüketildi: bayat hedef kalmasın */
              cakismaHaritaBoyandi = false;
              cakismaHepsiniTemizle();
              return;
            }
          }
        } catch (e) { /* kontrol hatasında orijinal akış engellenmez */ }
        return cakismaAsilBurak.apply(this, arguments);
      };
      cakismaBurakSarmal.__ckSarmal = true;
      window.istekBurak = cakismaBurakSarmal;
    }
  }
  cakismaIstekSarmallariniKur();

  /* GÖREV 2 — dersBurak sarmalı: AYNI BRANŞTAKİ BAŞKA ÖĞRETMENE TAŞIMA.
     app.js'in dersBurak'ı yalnız "hedef öğretmen = dersin öğretmeni" iken taşımaya izin verir
     (satır 4416: "Bu ders hedef öğretmene ait değil"). Burada, hedef öğretmen dersi verebiliyorsa
     dersin öğretmen alanları GEÇİCİ olarak hedefe çevrilir, orijinal çağrılır; orijinal taşımayı
     reddederse alanlar birebir geri yüklenir (DB'ye hiçbir şey yazılmaz). app.js değişmez.
     Çağrı yolu: inline ondrop → istekBurak → dersBurak (global binding) → bu sarmal. */
  var cakismaAsilDersBurak = window.dersBurak;
  var dersBurak_sarmal = function dersBurak_sarmal(ogrtId, tarih, saat) {
    var asil = cakismaAsilDersBurak;
    if (typeof asil !== "function") return;
    var dersId = window.dersDropHedef;
    if (!dersId) return asil.apply(this, arguments);

    var db = cakismaDb();
    var dersler = (db && Array.isArray(db.dersler)) ? db.dersler : [];
    var ders = dersler.filter(function (l) { return l && l.id === dersId; })[0] || null;
    var hedef = (db && Array.isArray(db.ogretmenler) ? db.ogretmenler : []).filter(function (o) {
      return o && o.id === ogrtId;
    })[0] || null;
    if (!ders || !hedef) return asil.apply(this, arguments); /* bilgi eksik → app.js akışı */

    /* Hedef zaten dersin öğretmeni → normal taşıma, dokunma */
    var ayniOgretmen = (ders.ogretmenId && ders.ogretmenId === hedef.id) ||
      (!ders.ogretmenId && !!ders.ogretmenAd && ders.ogretmenAd === hedef.ad);
    if (ayniOgretmen) return asil.apply(this, arguments);

    /* Farklı branş → dokunma; app.js kendi guard'ıyla reddeder (gösterge zaten kırmızı) */
    if (!hedefBransUygun(ders, hedef)) return asil.apply(this, arguments);

    var eski = { id: ders.ogretmenId, ad: ders.ogretmenAd, tarih: ders.tarih, saat: ders.saat, kod: ders.kod };
    var geriAl = function () {
      ders.ogretmenId = eski.id;
      ders.ogretmenAd = eski.ad;
      ders.tarih = eski.tarih;
      ders.saat = eski.saat;
      ders.kod = eski.kod;
    };
    var hedefAd = hedef.ad || hedef.adSoyad || "";

    /* AYNI gün+saat, yalnız öğretmen değişiyor: app.js bu durumda no-op döner (saveDB yok).
       Bu yüzden taşıma burada tamamlanır — önce MEVCUT çakışma motoruyla doğrulanır
       (iptal/tamamlanmış, grup ders, Pazar, dolu saat, sınıf programı…). */
    if (ders.tarih === tarih && cakismaKod(ders.saat) === cakismaKod(saat)) {
      var engeller = dersCakismaSebebi(ders.id, tarih, saat, hedef.id);
      if (engeller.length) {
        if (typeof window.toast === "function") window.toast("Çakışma var: " + engeller.join(" · "), "hata");
        return;
      }
      ders.ogretmenId = hedef.id;
      ders.ogretmenAd = hedefAd;
      try {
        if (typeof window.saveDB === "function") window.saveDB();
        if (typeof window.renderDersler === "function") window.renderDersler();
        if (typeof window.renderOzet === "function") window.renderOzet();
        if (typeof window.renderAnaliz === "function") window.renderAnaliz();
        if (typeof window.toast === "function") window.toast("Ders " + hedefAd + " öğretmenine aktarıldı ✓");
      } catch (hata) {
        geriAl();
        throw hata;
      }
      return;
    }

    /* Normal taşıma: öğretmen alanlarını geçici olarak hedefe çevir, orijinali çağır */
    ders.ogretmenId = hedef.id;
    ders.ogretmenAd = hedefAd;
    var sonuc;
    try {
      sonuc = asil.apply(this, arguments);
    } catch (hata) {
      geriAl();
      throw hata;
    }
    /* Başarı ölçütü: orijinal taşımayı yazdı mı? (tarih+saat hedefe eşit ve öğretmen hedefte)
       Değilse orijinal guard'lardan biri reddetti → alanları geri al, DB'de değişiklik yok. */
    var tasindi = (ders.tarih === tarih && cakismaKod(ders.saat) === cakismaKod(saat) && ders.ogretmenId === hedef.id);
    if (!tasindi) {
      geriAl();
      return sonuc;
    }
    /* Başarılı: orijinal zaten saveDB + renderDersler + renderOzet + renderAnaliz yaptı */
    return sonuc;
  };
  if (typeof cakismaAsilDersBurak === "function" && !cakismaAsilDersBurak.__ckSarmal) {
    dersBurak_sarmal.__ckSarmal = true;
    window.dersBurak = dersBurak_sarmal;
  }

  /* GÖREV 1 — dragstart yakalayıcı: sürükleme başladığı ANDA çizelgedeki TÜM drop-zone
     hücreleri boyanır (yeşil = uygun, kırmızı = çakışma + sebep etiketi).
     app.js'in inline ondrop attribute'u taşıyan ve data-drop-* nitelikleri olan hücreleri
     hedefler; plan formu / havuz gibi diğer drop hedefleri kapsam dışıdır. */
  function cakismaHedefHucreler() {
    var liste = [];
    var dugumler = document.querySelectorAll("[ondrop], [data-drop-saat], .dnd-uygun");
    for (var i = 0; i < dugumler.length; i++) {
      var el = dugumler[i];
      if (!el || !el.getAttribute) continue;
      if (!el.getAttribute("data-drop-saat") || !el.getAttribute("data-drop-ogrt")) continue;
      if (liste.indexOf(el) >= 0) continue;
      liste.push(el);
    }
    return liste;
  }
  function cakismaTumHucreleriBoya(istekId) {
    var hucreler = cakismaHedefHucreler();
    var sayac = { toplam: 0, uygun: 0, cakisan: 0 };
    for (var i = 0; i < hucreler.length; i++) {
      var el = hucreler[i];
      var saat = el.getAttribute("data-drop-saat") || "";
      var ogrtId = el.getAttribute("data-drop-ogrt") || "";
      var tarih = cakismaHucreTarihi(el, el.getAttribute("data-drop-gun"));
      if (!tarih || !saat) continue;
      var varMi = cakismaVarMi(istekId, tarih, saat, ogrtId);
      var sebepler = varMi ? cakismaSebebi(istekId, tarih, saat, ogrtId) : [];
      cakismaBoya(el, sebepler);
      sayac.toplam++;
      if (sebepler.length) sayac.cakisan++; else sayac.uygun++;
    }
    return sayac;
  }
  /* GÖREV 1 — ders kartı sürükleniyorsa: aynı harita, ders kurallarıyla.
     Dersin KENDİ hücresi (aynı öğretmen + tarih + saat kodu) boyanmaz: orası zaten dolu,
     taşıma anlamsız. Diğer tüm drop-zone'lar yeşil/kırmızı + sebep etiketiyle işaretlenir. */
  function cakismaTumHucreleriBoyaDers(dersId) {
    var sayac = { toplam: 0, uygun: 0, cakisan: 0 };
    var db = cakismaDb();
    var ders = (db && Array.isArray(db.dersler) ? db.dersler : []).filter(function (l) {
      return l && l.id === dersId;
    })[0] || null;
    if (!ders) return sayac; /* kayıt yoksa hiçbir hücre boyanmaz */
    var kaynakKod = cakismaKod(ders.saat);
    var hucreler = cakismaHedefHucreler();
    for (var i = 0; i < hucreler.length; i++) {
      var el = hucreler[i];
      var saat = el.getAttribute("data-drop-saat") || "";
      var ogrtId = el.getAttribute("data-drop-ogrt") || "";
      var tarih = cakismaHucreTarihi(el, el.getAttribute("data-drop-gun"));
      if (!tarih || !saat) continue;
      /* KENDİ hücresi → boyama yok */
      if (ders.ogretmenId && ogrtId === ders.ogretmenId && tarih === ders.tarih && cakismaKod(saat) === kaynakKod) continue;
      var sebepler = dersCakismaSebebi(dersId, tarih, saat, ogrtId);
      cakismaBoya(el, sebepler);
      sayac.toplam++;
      if (sebepler.length) sayac.cakisan++; else sayac.uygun++;
    }
    return sayac;
  }

  /* Sürükleme başladığı ANDA tüm alanlar işaretlenir: havuz isteği veya ders kartı.
     istekDropHedef/dersDropHedef inline ondragstart'ta dolduğu için listener bubble
     fazındadır (app.js'in kendi dragstart listener'ı gibi); istek için kart DOM'undan
     (data-istek) yedek okunur. */
  document.addEventListener("dragstart", function (e) {
    /* Sarmallar her sürüklemede tazelenir: app.js globali yeniden atadıysa ya da bu dosya
       app.js'ten önce yüklendiyse istek havuzu kartı da ders kartı gibi çakışma kontrolünden geçer. */
    cakismaIstekSarmallariniKur();
    cakismaHaritaBoyandi = false; /* yeni sürükleme: harita yeniden boyanacak */
    try {
      var dersId = window.dersDropHedef;
      if (dersId) { /* ders kartı taşıma: aynı görsel harita, ders kurallarıyla */
        window.__ckSonBoya = cakismaTumHucreleriBoyaDers(dersId);
        cakismaHaritaBoyandi = true;
        return;
      }
      var istekId = window.istekDropHedef;
      /* Sürükleme kartın İÇİNDEKİ bir öğeden başladıysa data-istek en yakın karttan okunur;
         inline ondragstart (istekDrag) her durumda bu yedeğin önünde çalışır. */
      if (!istekId && e && e.target) {
        var kaynak = e.target;
        if (kaynak.closest) kaynak = kaynak.closest("[data-istek]") || kaynak;
        if (kaynak.getAttribute) istekId = kaynak.getAttribute("data-istek") || "";
      }
      if (!istekId) return;
      window.__ckSonBoya = cakismaTumHucreleriBoya(istekId); /* {toplam, uygun, cakisan} */
      cakismaHaritaBoyandi = true;
    } catch (err) { cakismaHaritaBoyandi = false; /* dragover'da yeniden denenir */ }
  });

  /* GÖREV 3 — Boyama kalıcı kalmasın: sürükleme bitişi / bırakma / hücreden çıkışta
     özgün stil + title + hücre içeriği geri konur. */
  function cakismaSuruklemeBitti() {
    cakismaHaritaBoyandi = false; /* sonraki sürüklemede harita yeniden boyanır */
    cakismaHepsiniTemizle();
  }
  document.addEventListener("dragend", cakismaSuruklemeBitti, true);
  document.addEventListener("drop", cakismaSuruklemeBitti, true);
  /* dragstart'ta TÜM harita boyandığı için bir hücreden çıkış boyamayı SİLMEZ (harita
     sürükleme boyunca görünür kalır; temizlik dragend/drop'ta yapılır). Yalnız aktif bir
     sürükleme yokken kalmış artık boyama varsa o hücre temizlenir. */
  document.addEventListener("dragleave", function (e) {
    if (window.istekDropHedef) return;
    var el = e.target;
    while (el && el !== document && !el.__ckYedek) el = el.parentNode;
    if (!el || el === document || !el.__ckYedek) return;
    if (e.relatedTarget && el.contains && el.contains(e.relatedTarget)) return;
    cakismaHucreTemizle(el);
    var i = cakismaIsaretli.indexOf(el);
    if (i >= 0) cakismaIsaretli.splice(i, 1);
  }, true);

  /* === GÜN HESAPLAMA KAYNAK DÜZELTMESİ (GUVENLI-GUN-IDX) ===
     "2026-10-24" 2026'da CUMARTESİ'dir (dowIdx = 5). Chips/etiketler bir gün geriye
     kayıyorsa kaynak, tarihin saat dilimine duyarlı biçimde çözülmesidir (UTC gece yarısı
     → yerel saatte önceki gün). Bu blok app.js'in kendi tarih yardımcılarını GLOBAL olarak
     override eder; tüm gün hesapları YEREL öğlen (12:00) üzerinden yapılır:
       fromKey   → YYYY-MM-DD'yi yerel 12:00 Date'e çevirir (saat dilimi kayması yok)
       dowIdx    → Pazartesi=0 … Pazar=6 (kanonik)
       GUN_KISA  → ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"]
       GUNLER    → uzun adlar (Pazartesi=0)
       gunAdi    → "Cumartesi, 24 Ekim 2026" biçimi korunur
     app.js/index.html değişmez; sadece çalışma zamanı global fonksiyonları düzeltilir. */
  (function () {
    var KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]; /* Pazartesi=0 */
    var UZUN = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    var GETDAY_ADI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]; /* Date.getDay() sırası */
    var AYLAR_VARSAYILAN = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    function guvenliFromKey(tarih) {
      if (tarih instanceof Date) {
        var dd = new Date(tarih.getFullYear(), tarih.getMonth(), tarih.getDate(), 12, 0, 0);
        return isNaN(dd.getTime()) ? new Date(NaN) : dd;
      }
      var p = String(tarih == null ? "" : tarih).split("-");
      var y = parseInt(p[0], 10), m = parseInt(p[1], 10), g = parseInt(p[2], 10);
      if (y && m && g) {
        var d = new Date(y, m - 1, g, 12, 0, 0); /* YEREL öğlen: DST/saat dilimi kayması yok */
        if (!isNaN(d.getTime())) return d;
      }
      var d2 = new Date(String(tarih));
      return isNaN(d2.getTime()) ? new Date(NaN) : d2;
    }

    function guvenliGunIdx(tarih) {
      var d = guvenliFromKey(tarih);
      if (!d || isNaN(d.getTime())) return -1;
      return (d.getDay() + 6) % 7; /* Pazartesi=0, Pazar=6 */
    }

    /* app.js'in global bağlarını düzelt (var/function global → window ataması etkilidir) */
    window.fromKey = guvenliFromKey;
    window.dowIdx = guvenliGunIdx;
    window.GUN_KISA = KISA.slice();
    window.GUNLER = UZUN.slice();

    /* ===== KÖKTEN TARİH DÜZELTMESİ (TEK KAYNAK) =====
       Tüm gün/tarih hesapları YEREL öğlen (12:00) + Pazartesi=0 kuralıyla yapılır.
       app.js ve index.html DEĞİŞMEZ; yalnız çalışma zamanı global yardımcıları sabitlenir. */
    function guvenliToKey(d) {
      if (d == null || d === "") return "";
      if (typeof d === "string") return d;
      if (typeof d.getTime !== "function" || isNaN(d.getTime())) return "";
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    function guvenliAddDaysKey(k, n) {
      var d = guvenliFromKey(k);
      if (!d || isNaN(d.getTime())) return String(k == null ? "" : k);
      d.setDate(d.getDate() + Number(n || 0));
      return guvenliToKey(d);
    }
    function guvenliHaftaBaslangici(k) { return guvenliAddDaysKey(k, -guvenliGunIdx(k)); }

    window.toKey = guvenliToKey;
    window.addDaysKey = guvenliAddDaysKey;
    window.todayKey = function () { return guvenliToKey(new Date()); };
    window.haftaBaslangiciD = guvenliHaftaBaslangici;
    window.fmtTR = function (k) {
      if (!k) return "";
      var p = String(k).split("-");
      return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : String(k);
    };

    /* === HAFTA PENCERESİ: başlangıç HER ZAMAN Pazartesi ===
       app.js pencere() haftayı anchor - dowIdx(anchor) ile kurar. Takvim yardımcıları
       herhangi bir sebeple kaysa bile pencere Pazartesi'ye sabitlenir. */
    (function () {
      if (typeof window.pencere !== "function" || window.pencere.__gunPencere) return;
      var orijinalPencere = window.pencere;
      var pencereSabit = function () {
        var p = orijinalPencere.apply(this, arguments) || {};
        try {
          var u = window.ui || {};
          if (u.filtre === "hafta" && u.anchor) {
            var bas = guvenliHaftaBaslangici(u.anchor);
            return { start: bas, end: guvenliAddDaysKey(bas, 6) };
          }
        } catch (e) { /* hesap yapılamazsa orijinal pencere korunur */ }
        return p;
      };
      pencereSabit.__gunPencere = true;
      window.pencere = pencereSabit;
    })();

    /* === GÜN ÇİPLERİ: etiket ÇİPİN KENDİ tarihinden türetilir ===
       app.js çip etiketini GUN_KISA[cd] (pencere başlangıcına göre SIRA) ile yazıyor;
       pencere bir gün kayarsa TÜM etiketler bir gün kayar → "Paz 19" (19 Ekim Pazartesi).
       Burada her çipin onclick'inden tarih okunur; gün adı o tarihten hesaplanır. */
    function gunCipAnahtari(chip) {
      var m = String(chip.getAttribute("onclick") || "").match(/gunSec\(\s*'(\d{4}-\d{2}-\d{2})'\s*\)/);
      if (m) return m[1];
      m = String(chip.getAttribute("title") || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (m) return m[3] + "-" + m[2] + "-" + m[1];
      return "";
    }
    function gunCipleriTazele() {
      var cipler = document.querySelectorAll('button[onclick*="gunSec("]');
      for (var i = 0; i < cipler.length; i++) {
        var chip = cipler[i];
        var key = gunCipAnahtari(chip);
        if (!key) continue;
        var gi = guvenliGunIdx(key);
        var d = guvenliFromKey(key);
        if (gi < 0 || isNaN(d.getTime())) continue;
        var dogru = KISA[gi] + " " + d.getDate();
        if (String(chip.textContent || "").replace(/\s+/g, " ").trim() !== dogru) chip.textContent = dogru;
      }
    }
    window.__gunCipleriTazele = gunCipleriTazele;

    /* renderDersler: çipler her render'da ANINDA düzeltilir (500 ms beklenmez). */
    (function () {
      if (typeof window.renderDersler !== "function" || window.renderDersler.__gunCip) return;
      var orijinalRenderDersler = window.renderDersler;
      var sarmal = function () {
        var cikti = orijinalRenderDersler.apply(this, arguments);
        try { gunCipleriTazele(); } catch (e) { /* DOM hazır değilse sessiz */ }
        return cikti;
      };
      sarmal.__gunCip = true;
      window.renderDersler = sarmal;
    })();

    /* gunAdi: app.js ile AYNI çıktı biçimi, fakat güvenli tarih çözümlemesiyle. */
    window.gunAdi = function (key) {
      var d = guvenliFromKey(key);
      if (!d || isNaN(d.getTime())) return String(key == null ? "" : key);
      var aylar = (Array.isArray(window.AYLAR) && window.AYLAR.length === 12) ? window.AYLAR : AYLAR_VARSAYILAN;
      return GETDAY_ADI[d.getDay()] + ", " + d.getDate() + " " + aylar[d.getMonth()] + " " + d.getFullYear();
    };

    /* Yeni hesaplamayla chip'leri/tabloyu yeniden üret. */
    function gunleriTazele() {
      try {
        if (typeof window.renderDersler === "function") window.renderDersler();
        if (typeof window.renderOzet === "function") window.renderOzet();
        if (typeof window.renderAnaliz === "function") window.renderAnaliz();
        if (typeof window.renderDersler !== "function" && typeof window.yenile === "function") window.yenile();
      } catch (e) { /* render hazır değilse sonraki render doğru değerleri kullanır */ }
      try { gunCipleriTazele(); } catch (e2) {}
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gunleriTazele);
    else gunleriTazele();
    /* Geç render'lar için kısa tekrarlar (kalıcı interval YOK). */
    setTimeout(gunleriTazele, 100);
    setTimeout(gunleriTazele, 400);
    setTimeout(gunleriTazele, 1200);
  })();

  /* === BOŞ GÜN › NORMAL DERS PROGRAMI TABLOSU (BOS-GUN-TABLO-YAMASI) ===
     app.js gunlukTablo(), o gün hiç birebir/ek ders yoksa erken dönüp
     "… günü birebir ders yok / Bu güne ders planlanmamış." kartını basıyor ve
     tablo HİÇ üretilmiyor. Bu sarmalayıcı yalnız o empty-state çıktısında devreye girer
     ve AYNI günlük tablo iskeletini üretir: gün başlığı, saat + Mola sütunları,
     öğretmen satırları, boş hücrelerde MEVCUT dnd-bos drop-zone'u.
     Dolu günlerde orijinal HTML AYNEN döner; app.js/index.html değişmez.
     Sınıf Dersi (avail.sinif) ve Kapalı (avail.musait) hücreleri kilitli çizilir;
     boş hücreye tıklamak mevcut Birebir Ders Planla formunu öğretmen+tarih+saatle doldurur. */
  (function () {
    if (typeof window.gunlukTablo !== "function" || window.gunlukTablo.__bosGunSarmal) return;
    var orijinalGunlukTablo = window.gunlukTablo;

    function escY(x) {
      if (typeof window.esc === "function") return window.esc(x);
      return String(x == null ? "" : x)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function gunIndeksi(key) {
      var p = String(key || "").split("-");
      var y = parseInt(p[0], 10), m = parseInt(p[1], 10), g = parseInt(p[2], 10);
      if (!y || !m || !g) return -1;
      return (new Date(y, m - 1, g).getDay() + 6) % 7; /* Pazartesi=0 … Pazar=6 */
    }

    function gunKisa(key) {
      var adlar = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
      var p = String(key || "").split("-");
      var y = parseInt(p[0], 10), m = parseInt(p[1], 10), g = parseInt(p[2], 10);
      if (!y || !m || !g) return "";
      return adlar[new Date(y, m - 1, g).getDay()] || "";
    }

    /* app.js ile AYNI görsel slot sırası: 1-4, Mola (12:00-13:00), 5-11. */
    function slotListesi() {
      var k = Array.isArray(window.KISA_KOD) ? window.KISA_KOD : [];
      return k.slice(0, 4).concat([{ no: "Mola", b: "12:00", e: "13:00", mola: true }], k.slice(4));
    }

    function sinifChip(ad) {
      if (typeof window.sinifChipHTML === "function") return window.sinifChipHTML(ad);
      return '<span class="inline-flex rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 border border-amber-200">' + escY(ad) + '</span>';
    }

    /* app.js'in günlük boş hücresiyle BİREBİR aynı drop-zone + tıklama ile form doldurma. */
    function bosHucre(ogrtId, tarih, slot, gi) {
      return '<td class="dnd-bos px-1.5 py-2 border-r border-slate-200 transition-colors"' +
        ' data-drop-ogrt="' + escY(ogrtId) + '" data-drop-gun="' + gi + '" data-drop-saat="' + slot.b + '"' +
        ' ondragover="istekDragOver(event, this)" ondragleave="istekDragLeave(this)"' +
        ' ondrop="istekBurak(event, this, \'' + escY(ogrtId) + '\', \'' + tarih + '\', \'' + slot.b + '\')"' +
        ' onclick="__bosGunHucreSec(\'' + escY(ogrtId) + '\', \'' + tarih + '\', \'' + slot.b + '\')"' +
        ' title="Boş saat — tıklayın ya da ders kartını/havuz isteğini bırakın" style="cursor:pointer">' +
        '<span class="text-[9px] text-slate-300 select-none">+</span></td>';
    }

    function bosGunTabloHTML() {
      var db = window.DB;
      var u = window.ui;
      var tarih = u ? String(u.gunSecim || u.anchor || "") : "";
      if (!db || !Array.isArray(db.ogretmenler) || !tarih) return "";
      var gi = gunIndeksi(tarih);
      if (gi < 0) return "";

      var ogretmenler = db.ogretmenler.filter(function (t) { return t && t.ad; });
      ogretmenler.sort(function (a, b) { return String(a.ad).localeCompare(String(b.ad), "tr"); });
      var slotlar = slotListesi();

      var html = '<div class="rounded-2xl border border-slate-200 overflow-hidden mb-4 bg-white">' +
        '<div class="text-center py-3 border-b-2 border-slate-200 bg-slate-50">' +
          '<h3 class="text-[16px] font-black text-slate-800 tracking-wide uppercase">' + escY(gunKisa(tarih)) + '</h3>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="w-full border-collapse text-center" style="min-width:800px">' +
        '<thead><tr class="border-b-2 border-slate-200">' +
          '<th class="px-3 py-2 border-r border-slate-200 bg-slate-50" style="min-width:120px"></th>';

      slotlar.forEach(function (slot) {
        var bg = slot.mola ? "bg-emerald-200" : "bg-slate-50";
        var tx = slot.mola ? "text-emerald-700" : "text-slate-600";
        var alt = slot.mola ? "text-emerald-500" : "text-slate-400";
        html += '<th class="px-2 py-2 border-r border-slate-200 ' + bg + '" style="min-width:72px">' +
          '<div class="text-[12px] font-black ' + tx + '">' + slot.no + '</div>' +
          '<div class="text-[9px] font-semibold ' + alt + '">' + slot.b + '</div>' +
          '<div class="text-[9px] font-semibold ' + alt + '">' + slot.e + '</div>' +
          '</th>';
      });
      html += '</tr></thead><tbody>';

      ogretmenler.forEach(function (t) {
        var av = t.avail || {};
        var sinif = (av.sinif && typeof av.sinif === "object" && !Array.isArray(av.sinif)) ? av.sinif : {};
        var kapali = Array.isArray(av.musait) ? av.musait : [];
        html += '<tr class="border-b border-slate-200 bg-white">' +
          '<td class="px-3 py-3 border-r border-slate-200 text-left">' +
            '<div class="text-[12px] font-black text-slate-500 uppercase leading-tight">' + escY(t.ad) + '</div>' +
            '<span class="inline-block mt-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">Boş</span>' +
          '</td>';

        slotlar.forEach(function (slot) {
          if (slot.mola) {
            html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-emerald-50/60">' +
              '<div class="text-[10px] font-bold text-emerald-400">Mola</div>' +
              '<div class="text-[9px] text-emerald-300">' + slot.b + '-' + slot.e + '</div></td>';
            return;
          }
          var key = gi + "-" + slot.no;
          var sinifAd = Object.prototype.hasOwnProperty.call(sinif, key) ? sinif[key] : "";
          if (sinifAd || Object.prototype.hasOwnProperty.call(sinif, key)) {
            /* Sınıf Dersi: normal tablodaki gibi kilitli chip (ad boşsa hücre yine kilitli) */
            html += '<td class="dnd-kilit px-1.5 py-1.5 text-center border-r border-slate-200">' + (sinifAd ? sinifChip(sinifAd) : "") + '</td>';
          } else if (kapali.indexOf(key) >= 0) {
            html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-slate-100/70" title="Kilitli — bu saatte ders veremez">' +
              '<span class="text-[9px] font-bold text-slate-400 select-none">Kapalı</span></td>';
          } else if (gi === 6) {
            /* Pazar: app.js istekBurak bu günü reddediyor — çalışmayan drop-zone çizilmez. */
            html += '<td class="px-1.5 py-2 border-r border-slate-200 bg-slate-100/70" title="Pazar — kurum kapalı">' +
              '<span class="text-[9px] font-bold text-slate-400 select-none">Kapalı</span></td>';
          } else if (t.id) {
            html += bosHucre(t.id, tarih, slot, gi);
          } else {
            html += '<td class="px-1.5 py-2 border-r border-slate-200"></td>'; /* kimliksiz öğretmen: ölü hedef yok */
          }
        });
        html += '</tr>';
      });

      return html + '</tbody></table></div></div>';
    }

    /* Boş hücre tıklaması: MEVCUT Birebir Ders Planla formunu doldurur (yeni form/akış yok). */
    window.__bosGunHucreSec = function (ogrtId, tarih, saat) {
      try {
        var db = window.DB;
        var t = (db && Array.isArray(db.ogretmenler)) ? db.ogretmenler.filter(function (x) { return x.id === ogrtId; })[0] : null;
        var ogrInp = document.getElementById("f-ogretmen");
        var tarihInp = document.getElementById("f-tarih");
        var saatInp = document.getElementById("f-saat");
        if (ogrInp && t) {
          ogrInp.value = t.ad;
          try { ogrInp.dispatchEvent(new Event("input", { bubbles: true })); } catch (e1) {}
          try { ogrInp.dispatchEvent(new Event("change", { bubbles: true })); } catch (e2) {}
        }
        if (tarihInp) tarihInp.value = tarih;
        if (saatInp) saatInp.value = saat;
        var form = document.getElementById("planKart");
        if (form && form.scrollIntoView) {
          try { form.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e3) {}
        }
        if (ogrInp && ogrInp.focus) {
          try { ogrInp.focus({ preventScroll: true }); } catch (e4) {}
        }
      } catch (e) { /* form yoksa sessiz geç */ }
    };

    window.gunlukTablo = function () {
      var cikti = orijinalGunlukTablo.apply(this, arguments);
      /* Yalnız empty state çıktısında devreye gir: tablo İÇERMEYEN + boş gün metnini taşıyan HTML.
         Dolu gün HTML'i (<table> var) AYNEN korunur; ders konusu metni yanlış eşleşme üretmez. */
      if (typeof cikti !== "string" || cikti.indexOf("<table") >= 0 || cikti.indexOf("Bu güne ders planlanmamış") < 0) return cikti;
      var tablo = bosGunTabloHTML();
      return tablo || cikti; /* öğretmen/tarih çözülemezse eski davranış korunur */
    };
    window.gunlukTablo.__bosGunSarmal = true;

    /* app.js açılışta bir kez render etti — empty state görünmesin diye tabloyu hemen tazele. */
    if (typeof window.renderDersler === "function") {
      try { window.renderDersler(); } catch (e5) {}
    }
  })();

})();

// === KESİN TARİH DÜZELTMESİ (12:00 öğlen) ===
(function() {
  function guvenliDate(k) {
    if (k instanceof Date) return new Date(k.getTime());
    var s = String(k);
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]), 12, 0, 0);
    m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (m) return new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]), 12, 0, 0);
    return new Date(s);
  }
  window.fromKey = function(k) { return guvenliDate(k); };
  window.toKey = function(d) {
    if (typeof d === "string") return d;
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  };
  window.addDaysKey = function(k, n) {
    var d = guvenliDate(k);
    d.setDate(d.getDate() + n);
    return window.toKey(d);
  };
  window.dowIdx = function(k) {
    var d = guvenliDate(k);
    return (d.getDay() + 6) % 7;
  };
  window.gunAdi = function(key) {
    var d = guvenliDate(key);
    var i = (d.getDay() + 6) % 7;
    var gunler = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
    var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    return gunler[i] + ", " + d.getDate() + " " + aylar[d.getMonth()] + " " + d.getFullYear();
  };
  window.todayKey = function() {
    var d = new Date();
    return window.toKey(d);
  };
  window.fmtTR = function(k) {
    if (!k) return "";
    var p = String(k).split("-");
    if (p.length === 3) return p[2] + "." + p[1] + "." + p[0];
    return k;
  };
})();

// === ÇİP TARİH ETİKETLERİ + TİTRENMESİNİ DURDURMA (sadece metin farklıysa güncellenir) ===
(function() {
  // Sabit genişlik + ortalama ile çip genişliğinin metne göre değişip titremesini önle
  if (!document.getElementById("__gunSecChipCSS")) {
    var st = document.createElement("style");
    st.id = "__gunSecChipCSS";
    st.textContent = 'button[onclick*="gunSec("] { min-width: 62px !important; text-align: center !important; display: inline-block !important; }';
    document.head.appendChild(st);
  }

  function gunSecChipDuzelt() {
    if (!document.querySelector) return;
    var cipler = document.querySelectorAll('button[onclick*="gunSec("]');
    for (var i = 0; i < cipler.length; i++) {
      var c = cipler[i];
      var attr = String(c.getAttribute("onclick") || "").match(/gunSec\('([^']+)'\)/);
      if (!attr) continue;
      var key = attr[1];
      var raw = String(c.textContent || "").replace(/\s+/g, " ").trim();
      var d = window.fromKey(key);
      if (isNaN(d.getTime())) continue;
      var idx = (d.getDay() + 6) % 7;
      var gunKisa = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][idx];
      var yeni = gunKisa + " " + d.getDate();
      if (raw !== yeni) {
        c.textContent = yeni;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", gunSecChipDuzelt);
  } else {
    gunSecChipDuzelt();
  }
})();

// === MODERN GÖRÜNÜM: PLUS JAKARTA SANS + AÇIK ARKA PLAN (D1) ===
// Font Google Fonts'tan çekilir ve tüm arayüze uygulanır; arka plan #f8fafc
// yapılır, kart gölgeleri yumuşatılır. Font Awesome ikonları (i etiketleri ve
// ::before sözde elemanları) kapsam dışında bırakıldı ki ikonlar bozulmasın.
(function () {
  if (typeof document === "undefined") return;

  // --- GÖREV 1: Modern font (Plus Jakarta Sans) ---
  if (!document.getElementById("__fontPlusJakarta")) {
    var link = document.createElement("link");
    link.id = "__fontPlusJakarta";
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  if (!document.getElementById("__fontPlusJakartaCSS")) {
    var fontStil = document.createElement("style");
    fontStil.id = "__fontPlusJakartaCSS";
    fontStil.textContent =
      "body, button, input, select, textarea, div, span, p, h1, h2, h3, h4," +
      " a, label, li, table, th, td, option { font-family: 'Plus Jakarta Sans', sans-serif !important; }";
    document.head.appendChild(fontStil);
  }

  // --- GÖREV 2: Arka plan ve kartlar ---
  if (!document.getElementById("__genelModernStil")) {
    var genelStil = document.createElement("style");
    genelStil.id = "__genelModernStil";
    genelStil.textContent =
      "body { background-color: #f8fafc !important; }" +
      ".kart, [class*='kart'], .rounded-2xl.border { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important; border-color: #e2e8f0 !important; }" +
      "button, input, select, textarea { border-radius: 10px !important; }";
    document.head.appendChild(genelStil);
  }
})();

// === MODERN GÖRÜNÜM: İKONLAR (D2) ===
var ikonStil = document.createElement("style");
ikonStil.id = "__ikonModernStil";
ikonStil.textContent =
  "i.fa-solid, i.fa-regular, i.fa-brands, .fa { " +
  "  color: #64748b !important; " +
  "  transition: all 0.2s ease !important; " +
  "  font-size: 1.05em !important; " +
  "}" +
  "button:hover i.fa-solid, button:hover .fa, a:hover i.fa-solid { " +
  "  color: #0f766e !important; " +
  "  transform: scale(1.1) !important; " +
  "}";
document.head.appendChild(ikonStil);

// === MODERN GÖRÜNÜM: BUTONLAR VE FORM ELEMANLARI (D3) ===
var butonStil = document.createElement("style");
butonStil.id = "__butonFormModernStil";
butonStil.textContent =
  "button, .btn { " +
  "  border-radius: 12px !important; " +
  "  font-weight: 600 !important; " +
  "  transition: all 0.2s ease !important; " +
  "  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; " +
  "}" +
  "button:hover:not(:disabled), .btn:hover:not(:disabled) { " +
  "  transform: translateY(-1px) !important; " +
  "  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; " +
  "}" +
  "button:active:not(:disabled), .btn:active:not(:disabled) { " +
  "  transform: translateY(0) !important; " +
  "  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; " +
  "}" +
  "input, select, textarea { " +
  "  border-radius: 10px !important; " +
  "  border: 1px solid #cbd5e1 !important; " +
  "  padding: 10px 14px !important; " +
  "  transition: all 0.2s ease !important; " +
  "  background-color: #ffffff !important; " +
  "  color: #0f172a !important; " +
  "}" +
  "input:focus, select:focus, textarea:focus { " +
  "  border-color: #14b8a6 !important; " +
  "  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2) !important; " +
  "  outline: none !important; " +
  "}";
document.head.appendChild(butonStil);
