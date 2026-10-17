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

  // === KÜTÜPHANE: TÜMÜNÜ GİRİŞ YAP BUTONU ===
  setInterval(function() {
    var ktListe = document.getElementById("__ktListe");
    if (ktListe && !document.getElementById("__ktTopluGirisBtn")) {

      // Butonu oluştur
      var btn = document.createElement("button");
      btn.id = "__ktTopluGirisBtn";
      btn.className = "rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-bold text-teal-700 hover:bg-teal-100 mb-3";
      btn.style.marginRight = "8px";
      btn.textContent = "✅ Tümünü Giriş Yap";

      btn.onclick = function() {
        if(!confirm("Bugün kütüphaneye gelen tüm öğrencileri 'Giriş' olarak işaretlemek istiyor musunuz? (Zaten işaretli olanlara dokunulmaz)")) return;

        var LS_K = "yksOto_arsiv_v1";
        var veri = JSON.parse(localStorage.getItem(LS_K) || "{}");

        // Tarihi input'tan al (sayfadaki tarih seçici)
        var tarihInput = document.getElementById("yoklamaTarih") || document.getElementById("__ktTarihInput");
        var tarih = tarihInput ? tarihInput.value : new Date().toISOString().slice(0,10);

        var d = new Date();
        var saat = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");

        if (!veri.kutuphane) veri.kutuphane = {};
        if (!veri.kutuphane[tarih]) veri.kutuphane[tarih] = {};

        var ogrenciler = veri.ogrenciler || [];
        var sayac = 0;

        ogrenciler.forEach(function(o) {
           var mevcut = veri.kutuphane[tarih][o.id];
           // Eğer kayıt yoksa veya "gelmedi" ise giriş yap
           if (!mevcut || mevcut === "gelmedi") {
               veri.kutuphane[tarih][o.id] = { giris: saat };
               sayac++;
           }
        });

        localStorage.setItem(LS_K, JSON.stringify(veri));

        // Ekranı yenile
        if (window.__ktListeCiz) {
            window.__ktListeCiz();
        } else {
            window.location.reload();
        }

        alert(sayac + " öğrenci için giriş kaydı oluşturuldu.");
      };

      // Butonu listenin en üstüne (arama çubuğundan hemen sonraya) ekle
      var aramaKutusu = document.getElementById("__ktArama");
      if(aramaKutusu && aramaKutusu.parentNode) {
         aramaKutusu.parentNode.parentNode.insertBefore(btn, aramaKutusu.parentNode.nextSibling);
      } else {
         ktListe.insertBefore(btn, ktListe.firstChild);
      }
    }
  }, 500);

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
      btnSinav.onclick = function() { window.gosterAlt('sinav'); };
      btnSinav.textContent = "Sınav Yoklaması";
      btnKutuphane.parentNode.insertBefore(btnSinav, btnKutuphane.nextSibling);
    }
  }, 200);

  window.gosterAlt = function (alt) {
    var btn = document.querySelectorAll(".takip-alt-btn");
    btn.forEach(function (b) { if (b.getAttribute("data-alt") === alt) b.classList.add("aktif"); else b.classList.remove("aktif"); });
    var icerik = document.getElementById("takipIcerik"); if (!icerik) return;
    if (alt === "yoklama") icerik.innerHTML = window.__sysYoklamaEkran();
    else if (alt === "odevler") icerik.innerHTML = window.__sysOdevEkran();
    else if (alt === "kutuphane") icerik.innerHTML = window.__sysKutuphaneEkran();
    else if (alt === "sinav") icerik.innerHTML = window.__sysSinavEkran();
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
})();