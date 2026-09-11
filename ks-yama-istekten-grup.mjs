/* ks-yama-istekten-grup.mjs — İSTEKTEN PLANLAMA → GRUP SEÇİMİ (hedefli, idempotent yama)
   1) renderFormDestek: #ek-ogrenciler paneli #h-ogrenci (havuz girişi) altına da eklenir (aynı markup, idempotent).
   2) planla(): grupModu kayıtı istek durumunu da "planlandi" yapar (birebir dal birebir aynı kalır).
   3) yama sonrası işaretlenir — 2. koşuda uygulanmış bulur ve reddeder (dosyayı bozmaz).
   Kullanım: node ks-yama-istekten-grup.mjs   (CHECKPOINT'e kayıt amaçlı; yama zaten uygulandıysa hata verir) */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const KAYNAK = "app.js";
let kod = readFileSync(KAYNAK, "utf8");
copyFileSync(KAYNAK, "app.js.istekten-grup-oncesi.bak"); /* yama ÖNCESİ hâl (geri dönüş için) */

/* idempotentlik işareti — Yama 1 ile birlikte eklenir; 2. koşuda reddeder */
const MARK = "/* ISTEK-GRUP-YAMASI v1";
if (kod.includes(MARK)) { console.log("Zaten uygulanmış — değişiklik yapılmadı (dosya korundu)."); process.exit(2); }

let adet = 0;
function degistir(eski, yeni, etiket) {
  const i = kod.indexOf(eski);
  if (i === -1) { console.error("HATA: hedef bulunamadı → " + etiket); process.exit(1); }
  if (kod.indexOf(eski, i + 1) !== -1) { console.error("HATA: hedef birden fazla → " + etiket); process.exit(1); }
  kod = kod.slice(0, i) + yeni + kod.slice(i + eski.length);
  adet++;
  console.log("✓ " + etiket);
}

/* --- Yama 1: paneli havuz öğrenci girişinin altına da ekle (aynı markup, idempotent DOM guard) --- */
const esk1 =
`  /* Paneli yalnızca bir kez ekle (idempotent; stub DOM'larda da güvenli) */
  if (!document.getElementById("ek-ogrenciler")) {
    var fOgrEl = $("f-ogrenci");
    if (fOgrEl && fOgrEl.insertAdjacentHTML) fOgrEl.insertAdjacentHTML("afterend", ekPanel);
  }`;
const yeni1 =
`  /* Paneli yalnızca bir kez ekle (idempotent; stub DOM'larda da güvenli) */
  if (!document.getElementById("ek-ogrenciler")) {
    var fOgrEl = $("f-ogrenci");
    if (fOgrEl && fOgrEl.insertAdjacentHTML) fOgrEl.insertAdjacentHTML("afterend", ekPanel);
  }
  /* ISTEK-GRUP-YAMASI v1 — havuz giriş satırının altına da aynı paneli ekle (isteği aktarılmış formda grup seçimi görünsün) */
  if (!document.getElementById("ek-ogrenciler")) {
    var hOgrEl = $("h-ogrenci");
    if (hOgrEl && hOgrEl.insertAdjacentHTML) hOgrEl.insertAdjacentHTML("afterend", ekPanel);
  }`;
degistir(esk1, yeni1, "Yama 1: renderFormDestek → panel #h-ogrenci altına da");
if (!kod.includes(MARK)) { console.error("HATA: yama işareti eklenmedi"); process.exit(1); }

/* --- Yama 2: planla() grup dalı → istek kaydını planlandı yap (birebir dal eski hâli) --- */
const esk2 =
`      toast("Grup dersi planlandı 🎉 " + toplam + " öğrenci · " + fmtTR(tarih) + " " + saatEtiket(saat));
    }
  } else if (ui.editId) {`;
const yeni2 =
`      toast("Grup dersi planlandı 🎉 " + toplam + " öğrenci · " + fmtTR(tarih) + " " + saatEtiket(saat));
      /* ISTEK-GRUP: istekten planlandıysa istek kaydının SAHİBİ (ogrenciId) ve diğer alanları değişmez; yalnızca durum güncellenir */
      if (ui.aktifIstekId) {
        var _r2 = DB.istekler.find(function (x) { return x.id === ui.aktifIstekId; });
        if (_r2) { _r2.durum = "planlandi"; }
        ui.aktifIstekId = null;
      }
    }
  } else if (ui.editId) {`;
degistir(esk2, yeni2, "Yama 2: planla grup dalı → istek durumunu planlandı yap");

/* --- Yama 3: formaAktar → panel state'ini temiz başlat (ardışık isteklerde eski seçim taşınmasın) --- */
const esk3 =
`  ui.aktifIstekId = r.id;
  ui.editId = null;
  duzenleBannerGuncelle();`;
const yeni3 =
`  ui.aktifIstekId = r.id;
  ui.editId = null;
  /* ISTEK-GRUP: grup panel seçimini temizle — sahibi ANA öğrenci olarak yüklü, kilidi panelde (checkbox disabled) */
  ui.ekOgrenciIds = [];
  if (ui.panelSecim) { ui.panelSecim.acik = false; ui.panelSecim.arama = ""; ui.panelSecim.sinif = ""; }
  duzenleBannerGuncelle();`;
degistir(esk3, yeni3, "Yama 3: formaAktar → panel state temiz başlangıç");

writeFileSync(KAYNAK, kod);
copyFileSync(KAYNAK, "app.js.istekten-grup-sonrasi.bak");
console.log("Yama tamam: " + adet + " değişiklik · app.js güncellendi · yedek: app.js.istekten-grup-sonrasi.bak");
