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
      btnSinav.onclick = function() { 
        document.querySelectorAll(".takip-alt-btn").forEach(function(b){ b.classList.remove("aktif"); });
        btnSinav.classList.add("aktif");
        if(window.gosterAlt) window.gosterAlt("sinav"); 
      };
      btnSinav.textContent = "Sınav Yoklaması";
      btnKutuphane.parentNode.insertBefore(btnSinav, btnKutuphane.nextSibling);
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
})();