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
  var varsayilanTaslaklar = {
    yoklama: "Sayın Veli, öğrenciniz {ad} bugünkü {sinif} sınıfı dersine katılmamıştır. Bilgilerinize sunarız.",
    odev: "Sayın Veli, öğrenciniz {ad}'ın {ders} dersinden almış olduğu ödevi yapmadığı tespit edilmiştir. Bilgilerinize sunarız.",
    kutuphane: "Sayın Veli, öğrenciniz {ad} bugünkü kütüphane çalışmasına katılmamıştır. Bilgilerinize sunarız.",
    sinav: "Sayın Veli, öğrenciniz {ad} bugünkü sınava girmemiştir. Bilgilerinize sunarız."
  };

  function taslakOku() {
    try {
      var t = JSON.parse(localStorage.getItem("yksOto_taslaklar") || "{}");
      return Object.assign({}, varsayilanTaslaklar, t);
    } catch(e) { return varsayilanTaslaklar; }
  }
  function taslakYaz(t) { localStorage.setItem("yksOto_taslaklar", JSON.stringify(t)); }

  window.__waTaslakModal = function() {
    var t = taslakOku();
    var html = '<div style="font-family:system-ui;padding:6px;">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:14px;color:#0f172a;">📱 WhatsApp Mesaj Taslakları</div>' +
      '<div style="font-size:11px;color:#64748b;margin-bottom:12px;">Değişkenler: {ad} (Öğrenci Adı), {sinif}, {ders}. Bu değişkenler gönderim anında otomatik doldurulur.</div>' +
      
      '<label style="font-size:11px;font-weight:700;color:#0f766e;">Ders Yoklaması (Gelmedi)</label>' +
      '<textarea id="__t_yoklama" style="width:100%;height:60px;margin-bottom:10px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-family:inherit;font-size:12px;">' + t.yoklama + '</textarea>' +
      
      '<label style="font-size:11px;font-weight:700;color:#0f766e;">Ödev (Yapmadı)</label>' +
      '<textarea id="__t_odev" style="width:100%;height:60px;margin-bottom:10px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-family:inherit;font-size:12px;">' + t.odev + '</textarea>' +
      
      '<label style="font-size:11px;font-weight:700;color:#0f766e;">Kütüphane (Gelmedi)</label>' +
      '<textarea id="__t_kutuphane" style="width:100%;height:60px;margin-bottom:10px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-family:inherit;font-size:12px;">' + t.kutuphane + '</textarea>' +
      
      '<label style="font-size:11px;font-weight:700;color:#0f766e;">Sınav (Girmedi)</label>' +
      '<textarea id="__t_sinav" style="width:100%;height:60px;margin-bottom:14px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-family:inherit;font-size:12px;">' + t.sinav + '</textarea>' +

      '<button type="button" onclick="window.__waTaslakKaydet()" style="width:100%;background:#14b8a6;color:#fff;padding:10px;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-bottom:6px;">💾 Taslakları Kaydet</button>' +
      '<button type="button" onclick="document.getElementById(\'__waTaslakOverlay\').remove()" style="width:100%;background:#f1f5f9;color:#64748b;padding:10px;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Kapat</button>' +
    '</div>';

    var ov = document.createElement("div");
    ov.id = "__waTaslakOverlay";
    ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";
    var k = document.createElement("div");
    k.style.cssText = "background:#fff;border-radius:16px;padding:20px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);";
    k.innerHTML = html;
    ov.appendChild(k);
    document.body.appendChild(ov);
  };

  window.__waTaslakKaydet = function() {
    var t = {
      yoklama: document.getElementById("__t_yoklama").value,
      odev: document.getElementById("__t_odev").value,
      kutuphane: document.getElementById("__t_kutuphane").value,
      sinav: document.getElementById("__t_sinav").value
    };
    taslakYaz(t);
    alert("✅ Taslaklar başarıyla kaydedildi.");
    document.getElementById("__waTaslakOverlay").remove();
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
    var mesaj = t[tip] || "";
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

  window.__waTopluModal = function(tip) {
    var veri = (typeof veriOku === "function") ? veriOku() : sinavVeriOku();
    var tarih = new Date().toISOString().slice(0,10); // Varsayılan bugün
    // Ekrandaki tarihi bulmaya çalış
    var tInput = document.getElementById("yoklamaTarih") || document.getElementById("sinavTarih") || document.getElementById("__ktTarihInput");
    if (tInput && tInput.value) tarih = tInput.value;

    var liste = [];

    // 1. DERS YOKLAMASI (Tüm sınıflar)
    if (tip === "yoklama") {
        var tumYoklamalar = (veri.yoklamalar && veri.yoklamalar[tarih]) ? veri.yoklamalar[tarih] : {};
        Object.keys(tumYoklamalar).forEach(function(sinifAd) {
            var sinifYok = tumYoklamalar[sinifAd];
            Object.keys(sinifYok).forEach(function(id) {
                var d = typeof sinifYok[id] === 'string' ? sinifYok[id] : sinifYok[id].durum;
                if (d === "gelmedi" || d === "gec") {
                    liste.push({ id: id, durum: d === "gelmedi" ? "Gelmedi" : "Geç Kaldı", sinifAd: sinifAd });
                }
            });
        });
    } 
    // 2. SINAV YOKLAMASI (Tüm sınıflar)
    else if (tip === "sinav") {
        var tumSinavlar = (veri.sinavYoklamalari && veri.sinavYoklamalari[tarih]) ? veri.sinavYoklamalari[tarih] : {};
        Object.keys(tumSinavlar).forEach(function(sinifAd) {
            var sinifSnv = tumSinavlar[sinifAd];
            Object.keys(sinifSnv).forEach(function(id) {
                var d = typeof sinifSnv[id] === 'string' ? sinifSnv[id] : sinifSnv[id].durum;
                if (d === "girmedi") {
                    liste.push({ id: id, durum: "Sınava Girmedi", sinifAd: sinifAd });
                }
            });
        });
    } 
    // 3. KÜTÜPHANE (Genel tarama, çünkü kütüphane verisinde sınıf yok)
    else if (tip === "kutuphane") {
        var tumKt = (veri.kutuphane && veri.kutuphane[tarih]) ? veri.kutuphane[tarih] : {};
        Object.keys(tumKt).forEach(function(id) {
            if (tumKt[id] === "gelmedi") {
                var ogr = (veri.ogrenciler || []).find(function(o){ return o.id === id; });
                liste.push({ id: id, durum: "Kütüphaneye Gelmedi", sinifAd: ogr ? ogr.sinif : "-" });
            }
        });
    } 
    // 4. ÖDEVLER (Tüm ödevleri tarayıp yapmayanları bul)
    else if (tip === "odevler") {
        var odevler = veri.odevler || [];
        // Her ödev için yapmayanları listeye ekle (yinelenenleri önlemek için bir obje kullanabiliriz ama şimdilik düz ekleyelim)
        odevler.forEach(function(odev) {
            Object.keys(odev.durumlar || {}).forEach(function(id) {
                var d = odev.durumlar[id];
                if (d === "yapmadi" || d === "eksik" || d === "gec") {
                    var ogr = (veri.ogrenciler || []).find(function(o){ return o.id === id; });
                    if(ogr) {
                        // Aynı öğrenci birden fazla ödevden kalmışsa tek satırda göster veya hepsini listele (şimdilik hepsini)
                        liste.push({ id: id, durum: "Ödev (" + odev.ders + "): " + (d === "yapmadi" ? "Yapmadı" : d === "eksik" ? "Eksik" : "Geç"), sinifAd: ogr.sinif || "-" });
                    }
                }
            });
        });
    }

    if (liste.length === 0) return alert("Seçili tarihte/tüm sınıflarda mesaj gönderilecek (olumsuz durumdaki) öğrenci bulunmuyor.");

    var t = taslakOku();
    var html = '<div style="font-family:system-ui;padding:6px;">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:14px;color:#0f172a;">📱 Tüm Sınıflar - Toplu Bilgilendirme</div>' +
      '<div style="max-height:350px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:14px;">';
    
    liste.forEach(function(item, index) {
        var ogr = (veri.ogrenciler || []).find(function(o) { return o.id === item.id; });
        if (!ogr) return;
        var ad = ogr.adSoyad || ogr.ad || "Öğrenci";
        var tel = ogr.veliTelefon || ogr.veliTel || ogr.veliTelefonu || "";
        tel = String(tel).replace(/\D/g, "");
        if(tel.length === 10 && tel.startsWith("5")) tel = "90" + tel;
        else if(tel.length === 11 && tel.startsWith("05")) tel = "9" + tel;
        
        var mesaj = t[tip === "odevler" ? "odev" : tip] || "";
        mesaj = mesaj.replace(/{ad}/g, ad).replace(/{sinif}/g, ogr.sinif || "").replace(/{ders}/g, "");
        var url = tel.length >= 10 ? "https://wa.me/" + tel + "?text=" + encodeURIComponent(mesaj) : "#";

        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border-bottom:1px solid #f1f5f9;' + (index === liste.length - 1 ? 'border-bottom:none;' : '') + '">' +
          '<div>' +
             '<div style="font-weight:700;font-size:13px;color:#1e293b;">' + ad + '</div>' +
             '<div style="font-size:11px;color:#0f766e;font-weight:600;">' + item.sinifAd + ' Sınıfı</div>' +
             '<div style="font-size:11px;color:#ef4444;margin-top:2px;">' + item.durum + '</div>' +
          '</div>' +
          (tel.length >= 10 
            ? '<a href="' + url + '" target="_blank" style="background:#dcfce7;color:#166534;padding:6px 12px;border-radius:99px;text-decoration:none;font-size:11px;font-weight:700;">WhatsApp ➔</a>'
            : '<span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:6px 12px;border-radius:99px;">Numara Yok</span>') +
        '</div>';
    });

    html += '</div>' +
      '<button type="button" onclick="document.getElementById(\'__waTopluOverlay\').remove()" style="width:100%;background:#f1f5f9;color:#64748b;padding:10px;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Kapat</button>' +
    '</div>';

    var ov = document.createElement("div");
    ov.id = "__waTopluOverlay";
    ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";
    var k = document.createElement("div");
    k.style.cssText = "background:#fff;border-radius:16px;padding:20px;max-width:450px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);";
    k.innerHTML = html;
    ov.appendChild(k);
    document.body.appendChild(ov);
  };

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
})();