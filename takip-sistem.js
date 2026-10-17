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
})();