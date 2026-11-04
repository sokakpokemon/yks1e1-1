/* depo-indexeddb.js — D67-OTOMATIK-YEDEK: IndexedDB tabanlı otomatik yerel yedek.
   ---------------------------------------------------------------------------
   SÖZLEŞME
   - Konum: index.html'de takip-sistem.js'ten SONRA yüklenir → sarmalayıcı
     D66 (takip-sistem.js:4303+) katmanının EN DIŞINDA kalır. D66'ya DOKUNULMAZ.
   - `saveDB` çağrıldıktan SONRA localStorage'daki GÜNCEL değer okunur (D66 merge
     sırası: LS → DB → saveDB). Böylece IDB yedeği ile LS içeriği ayrışmaz.
   - `saveDB` her render'da çağrılır (yenile() → saveDB). Bu yüzden yazım
     trailing debounce (1500 ms) + "payload değişmediyse yazma" kapısından geçer.
   - Değişiklik tespiti TAM string karşılaştırmasıdır (length + ilk/son 100 karakter
     hash'i DEĞİL): ortadaki tek karakterlik değişiklik (ör. tarih 04 → 05) kaçmaz.
   - Her yedek TAM arşiv kopyasıdır → depo sınırsız büyümesin diye en yeni
     EN_FAZLA kayıt tutulur, fazlası aynı transaction içinde silinir.
   - FALLBACK: `window.indexedDB` yoksa (file:// kısıtı, gizli mod) sarmalayıcı
     HİÇ kurulmaz; uygulama eskisi gibi yalnız localStorage ile çalışır.
   - Geri yükleme UI'ı app.js'tedir (otomatikYedektenYukle); bu dosya YALNIZ yazar.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";

  var YEDEK_DB = "yksOto_yedekDB";
  var YEDEK_SURUM = 1;
  var YEDEK_STORE = "yedekler";
  var LS_KEY = "yksOto_arsiv_v1";
  var BEKLEME_MS = 1500;
  var EN_FAZLA = 10; /* döngüsel yedek: en yeni 10 tam kopya */

  function bilgi(metin) {
    try { console.warn("[D67-YEDEK] " + metin); } catch (e) {}
  }
  function hataBildir(metin) {
    try { if (typeof window.toast === "function") window.toast(metin, "hata"); } catch (e) {}
  }

  /* FALLBACK: IndexedDB yok → sarmalayıcı KURULMAZ (yalnız localStorage). */
  if (!window.indexedDB) {
    bilgi("IndexedDB yok — otomatik yedek kapalı (yalnız localStorage).");
    return;
  }
  if (typeof window.saveDB !== "function") {
    bilgi("saveDB bulunamadı — otomatik yedek kurulmadı.");
    return;
  }
  if (window.saveDB.__d67Sarmal) return; /* idempotent: iki kez sarmalanmaz */
  if (!window.saveDB.__d66Sarmal) {
    bilgi("D66 sarmalayıcısı görülmedi — script sırası: takip-sistem.js → depo-indexeddb.js olmalı.");
  }

  var orijinalSaveDB = window.saveDB;
  var yedekTimer = null;
  var sonPayload = null; /* en son YAZILAN payload'ın tam metni */
  var sonTarihMs = 0; /* MONOTONİK ANAHTAR: aynı ms'de iki yazım öncekini EZMESİN */
  var kotaUyarisiVerildi = false;

  /* Ortak açılış: store yoksa oluşturur (ilk kurulum + boş profil). */
  function yedekDepoAc() {
    var req = window.indexedDB.open(YEDEK_DB, YEDEK_SURUM);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(YEDEK_STORE)) {
        db.createObjectStore(YEDEK_STORE, { keyPath: "tarih" });
      }
    };
    return req;
  }

  function yedekYaz(payload) {
    var veri;
    try { veri = JSON.parse(payload); } catch (e) {
      bilgi("Arşiv JSON çözülemedi — yedek yazılmadı.");
      return;
    }
    var simdi = Date.now();
    if (simdi <= sonTarihMs) simdi = sonTarihMs + 1;
    sonTarihMs = simdi;
    var paket = {
      uygulama: "YKS Birebir Takip",
      surum: 1,
      tarih: new Date(simdi).toISOString(),
      boyut: payload.length,
      ozet: {
        ders: Array.isArray(veri.dersler) ? veri.dersler.length : 0,
        ogrenci: Array.isArray(veri.ogrenciler) ? veri.ogrenciler.length : 0,
        ogretmen: Array.isArray(veri.ogretmenler) ? veri.ogretmenler.length : 0
      },
      veri: veri
    };

    var req = yedekDepoAc();
    req.onerror = function () { bilgi("Yedek deposu açılamadı."); };
    req.onsuccess = function (e) {
      var db = e.target.result;
      var tx;
      try { tx = db.transaction(YEDEK_STORE, "readwrite"); }
      catch (hata) {
        try { db.close(); } catch (e2) {}
        bilgi("İşlem açılamadı: " + (hata && hata.message));
        return;
      }
      try {
        var depo = tx.objectStore(YEDEK_STORE);
        depo.put(paket);
        /* BUDAMA: her kayıt tam arşiv kopyası → en yeni EN_FAZLA kayıt kalır. */
        var anahtarlar = depo.getAllKeys();
        anahtarlar.onsuccess = function () {
          var liste = (anahtarlar.result || []).slice().sort();
          var fazla = liste.length - EN_FAZLA;
          if (fazla <= 0) return;
          liste.slice(0, fazla).forEach(function (k) { depo.delete(k); });
        };
      } catch (hata2) {
        bilgi("Yedek yazılamadı: " + (hata2 && hata2.message));
      }
      tx.oncomplete = function () { try { db.close(); } catch (e3) {} };
      tx.onabort = function () {
        try { db.close(); } catch (e4) {}
        if (!kotaUyarisiVerildi) {
          kotaUyarisiVerildi = true;
          hataBildir("Otomatik yerel yedek yazılamadı (depolama dolu olabilir). Dosya yedeği alın.");
        }
      };
    };
  }

  window.saveDB = function () {
    var sonuc = orijinalSaveDB.apply(this, arguments);
    try {
      if (yedekTimer) clearTimeout(yedekTimer);
      yedekTimer = setTimeout(function () {
        yedekTimer = null;
        var payload = null;
        try { payload = localStorage.getItem(LS_KEY); } catch (e) { return; }
        if (!payload) return;
        if (payload === sonPayload) return; /* değişiklik yok → yazma yok */
        sonPayload = payload;
        yedekYaz(payload);
      }, BEKLEME_MS);
    } catch (e) {
      bilgi("Yedek zamanlayıcısı kurulamadı: " + (e && e.message));
    }
    return sonuc;
  };
  window.saveDB.__d67Sarmal = true;
})();
