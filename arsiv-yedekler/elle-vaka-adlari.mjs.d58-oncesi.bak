/* elle-vaka-adlari.mjs — ELLE YAZILMIŞ VAKA AD MANİFESTİ (AD BAZLI)
   Kaynak: elle-vaka-adlari-base.mjs (manuel derlenmiş tam liste). Bu sarmalayıcı
   liste üzerinde YALNIZ D30-CACHE'te kayması gereken İKİ statik byte-offset vaka adını
   hedefli olarak düzeltir; başka hiçbir ad/sıra/sayı değişmez.

   Neden: DÖNGÜ-30-CACHE'te index.html'deki ek-ders.js/app.js script referanslarına
   ?v=6dd3188 damgası eklendi. Damga, ek-ders.js etiketinin (index.html satır ~13)
   uzunluğunu +10 artırdığı için kendisinden SONRAKİ tüm statik offsetler +10 kaydı.
   ks-kart-sirasi ve ks-kart-kolon süitleri adlarında bu ham offsetleri taşıyor.
   Düzeltme ELLE yapılır (koşumdan türetme YOK); hedef bulunamazsa yüksek sesle hata verir. */
import { elleVakaAdlari as taban } from "./elle-vaka-adlari-base.mjs";

export const elleVakaAdlari = structuredClone(taban);

/* D58-YEDEK-GUVENLIK: ks-yedek-guvenlik.mjs 15 assertion (ELLE yazıldı — koşumdan türetilmedi) */
elleVakaAdlari["ks-yedek-guvenlik.mjs"] = [
  "D58: boot kurtarma marker 3 bölgede (LS_KEY + boot IIFE + modal)",
  "D58: LS_KEY_KURTARMA tanımı VAR + değer birebir (yksOto_arsiv_kurtarma_v1)",
  "D58: eski boot satırı KALDIRILDI (var DB = loadDB() || seedDB() literal YOK)",
  "D58: kurtarma IIFE kopya LS_KEY_KURTARMA + durum global (kurtarildi, boyut, raw)",
  "D58: boş kayıt sessiz seedDB (uyarı YOK — sağlıklı boot korunur)",
  "D58: kopyalama başarısız olsa bile durum global kurulur (catch boş => durum kurulur)",
  "D58: uyarı modalı yalnız kurtarma durumunda açılır (koşullu if (globalThis.__kurtarmaDurumu))",
  "D58: modal indirme aksiyonu + yks-kurtarma-<todayKey>.json + hamVeri: _kd.raw",
  "D58: modal metni silinmedi güvencesi (İçeriği <b>silinmedi</b>)",
  "D58: yedekOku asama bayrağı (okuma → onay); onay-DOM hatası yanlış mesaj demez",
  "D58: hata toast koşullu (asama === okuma mi?)",
  "D58: zarf kontrolü RED + return (uygulama !== YKS Birebir Takip || surum !== 1)",
  "D58: geriye-uyum: sarmalayıcı açma var v = p.veri && p.veri.dersler ? p.veri : p korundu",
  "D58: saveDB tek-setItem sözleşmesi korundu (LS_KEY, JSON.stringify(DB)) TAM 1",
  "D58: index.html bayat Ayarlar sekmesi gibi bir şey YOK + Yedek Al / Yedek Yükle + damga=SHA16",
];

function offsetDuzelt(suit, eski, yeni) {
  const liste = elleVakaAdlari[suit];
  if (!Array.isArray(liste)) throw new Error("D30-CACHE offset düzeltmesi: süit yok: " + suit);
  const i = liste.indexOf(eski);
  if (i < 0) throw new Error("D30-CACHE offset düzeltmesi: hedef ad bulunamadı: " + suit + " :: " + eski);
  liste[i] = yeni;
}

offsetDuzelt(
  "ks-kart-sirasi.mjs",
  "index.html'de planKart havuzBolum'den ÖNCE (statik sıra) → plan=9491 havuz=15402",
  "index.html'de planKart havuzBolum'den ÖNCE (statik sıra) → plan=9510 havuz=15421",
);
offsetDuzelt(
  "ks-kart-kolon.mjs",
  "Plan kartı ÜST panelde (statik parent) → sol=9435 plan=9491 sag=15293",
  "Plan kartı ÜST panelde (statik parent) → sol=9454 plan=9510 sag=15312",
);
offsetDuzelt(
  "ks-kart-kolon.mjs",
  "İstek havuzu ALT panelde (statik parent) → sag=15293 havuz=15402 kapa=19790",
  "İstek havuzu ALT panelde (statik parent) → sag=15312 havuz=15421 kapa=19809",
);
/* D56-WA-GUN-FILTRE: index.html'e waGunBar bloğu (128 karakter) eklendi. Ek blok
   sol/sag/havuz işaretlerinden SONRA düştüğü için o offsetler DEĞİŞMEDİ; yalnız
   kapanış (kapa) offseti +128 kaydı. Sayı/sıra değişmedi. */
offsetDuzelt(
  "ks-kart-kolon.mjs",
  "İstek havuzu ALT panelde (statik parent) → sag=15312 havuz=15421 kapa=19809",
  "İstek havuzu ALT panelde (statik parent) → sag=15312 havuz=15421 kapa=19959",
);

/* DÖNGÜ-30-CACHE (SHA16 damgası): ks-donem-ilk damga assertion'ı KALDIRILDI;
   damga artık DİNAMİK olarak ks-index-kimlik.mjs süitinde doğrulanır.
   D35-DUZELTME: ks-kart-kolon damga vakasının ADINDAN gömülü SHA-16 pini KALDIRILDI;
   kontrol hâlâ DİNAMİK (index.html ?v= ↔ dosya SHA-16), adı ise app.js her değiştiğinde
   elle güncelleme GEREKTİRMEZ. */
elleVakaAdlari["ks-kart-kolon.mjs"].push(
  "index.html damgası = app.js/ek-ders.js SHA-256 ilk 16 hane (DİNAMİK karşılaştırma — ada gömülü elle pin YOK)",
);

/* D34-GRUP-UYE-YAZ: ADIM-4 istek.ogrenciIds SENKRON davranışı nedeniyle ks-grup-istegi.mjs'te
   4 assertion adı ELLE güncellendi (koşumdan otomatik üretim YOK; sayı/sıra değişmedi: 68). */
offsetDuzelt("ks-grup-istegi.mjs", "istekte yalnızca 'durum' alanı değişti", "istekte 'durum' + 'ogrenciIds' SENKRON değişti (ADIM-4)");
offsetDuzelt("ks-grup-istegi.mjs", "ogrenciId/ogrenciIds/konu/dersId/olusturma KORUNDU", "ogrenciId/konu/dersId/olusturma KORUNDU; ogrenciIds SENKRON (ADIM-4)");
offsetDuzelt("ks-grup-istegi.mjs", "ogrenciIds eksiksiz (2 üye — planlama ek üyeyi isteğe yazmaz; süit 9 ile tutarlı)", "ogrenciIds eksiksiz (3 üye — planlama ile SENKRON; ADIM-4)");
offsetDuzelt("ks-grup-istegi.mjs", "loadDB de grup isteğini korur", "loadDB de grup isteğini korur (SENKRON üyeler)");

/* KALICI DÜZELTME: index.html SABİT SHA-256 pinleri ve literal damga assertion'ı KALDIRILDI.
   Koruma kaybolmaz: damga/script/id denetimi artık TEK yerde, ks-index-kimlik.mjs'de DİNAMİK. */
function adSil(suit, ad) {
  const liste = elleVakaAdlari[suit];
  if (!Array.isArray(liste)) throw new Error("adSil: süit yok: " + suit);
  const i = liste.indexOf(ad);
  if (i < 0) throw new Error("adSil: hedef ad bulunamadı: " + suit + " :: " + ad);
  liste.splice(i, 1);
}
function adSonrasiEkle(suit, sonraAd, yeniAdlar) {
  const liste = elleVakaAdlari[suit];
  if (!Array.isArray(liste)) throw new Error("adSonrasiEkle: süit yok: " + suit);
  const i = liste.indexOf(sonraAd);
  if (i < 0) throw new Error("adSonrasiEkle: çapa ad bulunamadı: " + suit + " :: " + sonraAd);
  liste.splice(i + 1, 0, ...yeniAdlar);
}
adSil("ks-birebir-gorunum.mjs", "index.html değişmedi (bilinen hash)");
adSil("ks-ders-tasi.mjs", "index.html değişmedi (bilinen hash)");
adSil("ks-donem-ilk.mjs", "index.html SHA-256 değişmedi");
adSil("ks-donem-ilk.mjs", "index.html statik varlık ?v=6dd3188 damgası VAR (app.js + ek-ders.js) — damga kaldırılırsa KIRMIZI");
adSil("ks-donem-olusturma.mjs", "index.html SHA-256 değişmedi");
adSil("ks-ek-ders-donem.mjs", "index.html değişmedi");
adSil("ks-ekders-ozet-csv.mjs", "index.html değişmedi");
adSil("ks-gunluk-ders-tasi.mjs", "index.html değişmedi (bilinen hash)");
adSil("ks-sinif-ogretmen-uyum.mjs", "index.html dokunulmadı (bu dilim)");
adSonrasiEkle("ks-wa-alici.mjs", "waUrl imzası değişmedi (metin, tel)", [
  "waUrl idempotent: '905321234567' DEĞİŞMEZ (zaten tam uluslararası)",
  "waUrl '+90 532 123 45 67' → '905321234567' (rakam + baştaki 0 yok)",
  "waUrl '0532 123 45 67' → '905321234567' (baştaki 0 atılır + 90 eklenir)",
]);
elleVakaAdlari["ks-index-kimlik.mjs"] = [
  "index.html app.js?v= damgası = app.js SHA-256 ilk 16 hane (bayat kalırsa KIRMIZI)",
  "index.html ek-ders.js?v= damgası = ek-ders.js SHA-256 ilk 16 hane (bayat kalırsa KIRMIZI)",
  "her iki statik varlıkta ?v= 16 haneli SHA biçiminde (damga kaybolur/bozulursa KIRMIZI)",
  "app.js script src'i index.html'de TAM 1 kez",
  "ek-ders.js script src'i index.html'de TAM 1 kez (defer'li)",
  "index.html planKart id'si VAR",
  "index.html havuzBolum id'si VAR",
  "index.html ks-kart-kolon id'si VAR",
];

/* D32-GRUP-2UYE: plan formunda ana + 1 ek artık GRUP kaydıdır (havuz ortak grup isteğiyle hizalandı).
   ks-grup-uyum Senaryo C'nin iki assertion adı bu davranış değişikliği için ELLE güncellendi
   (koşumdan otomatik üretim YOK; sayı/sıra değişmedi: 41). */
offsetDuzelt(
  "ks-grup-uyum.mjs",
  "C: eski davranış: ogrenciIds alanı YOK",
  "C: iki öğrencili grup: ogrenciIds = [ek]",
);
offsetDuzelt(
  "ks-grup-uyum.mjs",
  "C: dersOgrenciIds tek kimlik verir",
  "C: dersOgrenciIds iki kimlik verir (ana + ek)",
);

/* D32-GRUP-2UYE sonrası toplam süit 52 → 53; D34-GRUP-UYE-YAZ sonrası 53 → 54;
   D35-AD-SINIF sonrası 54 → 55 (yeni kalıcı süit ks-d35-ad-sinif.mjs);
   yazdığa gömülü sayı ELLE güncellendi (koşumdan otomatik üretim YOK). */
offsetDuzelt("ks-kart-sirasi.mjs", "süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) → 51", "süit toplam sayısı önceki sayıdan AŞAĞI DÜŞMÜYOR (min 33) — liste.length extra");

/* D35-AD-SINIF: çizelge hücresinde "Ad Soyad + Sınıf" (havuz tipografisi) + uzun soyad kısaltma.
   6 assertion adı ELLE güncellendi (koşumdan otomatik üretim YOK; her süitte sayı/sıra DEĞİŞMEDİ). */
offsetDuzelt("ks-birebir-gorunum.mjs", "uzun ad truncate + min-w-0 taşıyor", "uzun ad + sınıf kırpmasız (break-words) + min-w-0 + havuz formatter'ı (D35)");
offsetDuzelt("ks-birebir-gorunum.mjs", "grup üye etiketleri yardımcısı yerinde", "grup üyeleri hücre İÇİNDE tek formatter'dan (D35: ayrı grupUyeEtiketleri satırı kaldırıldı)");
offsetDuzelt("ks-ekders-gorunum.mjs", "gunlukTablo grup satırı (grupUyelerG) aynen", "gunlukTablo grup üyeleri ortak hücreden (D35: ayrı grupUyelerG satırı kaldırıldı)");
offsetDuzelt("ks-ekders-gorunum.mjs", "haftalik grup satırı (grupUyeler) aynen", "haftalik grup üyeleri ortak hücreden (D35: ayrı grupUyeler satırı kaldırıldı)");
offsetDuzelt("ks-ekders-gorunum.mjs", "haftalik grup üye satırı hücrede kullanılıyor (DÖNGÜ-26: ölü hucreUst kaldırıldı)", "haftalik grup üyeleri hücre İÇİNDE kendi satırında (D35: virgüllü alt satır kaldırıldı)");
offsetDuzelt("ks-ekders-ozet-csv.mjs", "haftalikOgrtTablo grup üye satırı KORUNDU", "haftalikOgrtTablo grup üyeleri ortak hücreden (D35: ayrı grupUyeEtiketleri satırı kaldırıldı)");

/* D35-AD-SINIF KALICI SÜİT (ks-d35-ad-sinif.mjs): 26 assertion (D35 DÜZELTME + RİSK turu) — çizelge
   hücresinde her üye kendi satırında ad+sınıf (havuz tipografisi), kisaAdlik eşikleri (10/22),
   sınıf yer tutucusunun KALDIRILMASI (hücrede span YOK), nowrap kapsamı (yalnız hücre SINIF spanı;
   sarmalayıcı serbest), dar hücre fixture'ı (RISK A) ve havuz chip'i boş-sınıf davranışı (RISK B,
   DOKUNULMAZ) + etki sınırı (WA/PNG/havuz TAM ad) + statik sözleşme. Adlar ELLE yazılır (koşumdan türetme YOK). */
elleVakaAdlari["ks-d35-ad-sinif.mjs"] = [
  "boot hatasız",
  "kisaAdlik: 'Ahmet Kızılırmak' → 'Ahmet K.'",
  "kisaAdlik: 'Mehmet Ali Kızılırmak' → 'Mehmet Ali K.'",
  "kisaAdlik: 'Hasan Hüseyin Taşkın' DEĞİŞMEZ (eşik altı — soyadı 6 < 10, toplam 18 < 22)",
  "kisaAdlik: tek kelimeli ad DEĞİŞMEZ ('Ecrin' · 'Yusuf Can')",
  "kisaAdlik: gorselAd normalizasyonundan geçer (HAM 'AHMET KIZILIRMAK' → 'Ahmet K.')",
  "kisaAdlik: normal soyadlar KISALMAZ ('Ahmet Karabulut' 9 < 10 · 'Ahmet Demirci' 7 < 10)",
  "eşikler tek yerde: MAX_SOYAD_HARF = 10 · MAX_AD_UZUNLUK = 22",
  "adHarfSayisi: boşluk/tire/kesme işareti sayılmaz, Türkçe harf TEK sayılır",
  "haftalık grup hücresi: ana + ek üyeler TAM ad ve sınıf AYNI hücrede",
  "haftalık grup hücresi: HER üye KENDİ satırında (5 üye → 5 satır)",
  "haftalık grup hücresi: uzun soyadlı üye 'Ahmet K.' görünür — tam soyadı GÖRÜNMEZ",
  "haftalık grup hücresi: sınıfı BOŞ üye → hücrede sınıf metni YOK (yer tutucu YOK)",
  "haftalık grup hücresi: kaydı silinmiş üye hücreye YAZILMAZ (uydurma ad/sınıf YOK)",
  "haftalık TEKLİ hücre: sınıf VAR + tek kelimeli ad DEĞİŞMEZ",
  "günlük grup hücresi: TAM ad + sınıf AYNI hücrede + 'Ahmet K.' kısaltması",
  "günlük grup hücresi = haftalık grup hücresi (üye satırları BİREBİR aynı)",
  "günlük TEKLİ hücre: sınıf VAR (tek öğrencili ders de sınıfı gösterir)",
  "ETKİ SINIRI: WhatsApp mesajı TAM ad (kısaltma sızmadı)",
  "ETKİ SINIRI: PNG/rapor kartı TAM ad (kısaltma sızmadı)",
  "ETKİ SINIRI: havuz chip'i TAM ad (kısaltma yok)",
  "nowrap kapsamı: havuz chip'i + hücre üye SARMALAYICISI sarma SERBEST · nowrap YALNIZ hücre SINIF spanında",
  "RİSK A dar hücre fixture (uzun ad + sınıf): sarmalayıcı nowrap YOK · AD spanı whitespace-normal break-words · SINIF spanı nowrap · truncate/overflow-hidden YOK",
  "RİSK B hücre: sınıfı BOŞ üyede sınıf spanı HİÇ basılmaz (text-slate-400 spanı YOK)",
  "RİSK B havuz chip'i: sınıfı boş DB öğrencisi → 'Sınıf belirtilmemiş' (chip davranışı KORUNDU — DOKUNULMAZ)",
  "statik: ad/sınıf için İKİNCİ formatter YOK (kisaAdlik tek tanım · hücre birebirEtiketHTML · çizelge hücrelerinde ayrı üye satırı kalmadı)",
];

/* D32-GRUP-2UYE KALICI SÜİT (ks-d32-grup-birebir-e2e.mjs): gerçek form akışı + eşik regresyonu.
   20 assertion — ana öğrenci + 1 ek üye PAZAR grup birebir dersi; K1..K6 + 0/1/2 ek eşikleri. */
elleVakaAdlari["ks-d32-grup-birebir-e2e.mjs"] = [
  "boot hatasız",
  "eşik 0 ek (tekli): ogrenciIds YAZILMAZ, ogrenciId = ana",
  "eşik 2 ek (grup-3): ogrenciIds = [ek, üçüncü]",
  "eşik 1 ek (grup-2): ogrenciIds = [ek]",
  "K1 kayıt: ogrenciId = ana + ogrenciIds = [ek] BİRLİKTE",
  "K1 dersOgrenciIds = [ana, ek] (tüm katılımcı)",
  "K2 haftalık çizelgede ANA üye TAM ad",
  "K2 haftalık çizelgede EK üye TAM ad",
  "K3 günlük çizelgede ANA üye TAM ad",
  "K3 günlük çizelgede EK üye TAM ad",
  "K4 alıcı listesinde ana üye AYRI satır",
  "K4 alıcı listesinde ek üye AYRI satır",
  "K4 üçüncü öğrenci sızmaz",
  "K4 ana sayaç = 1 (grup dersi BİR kez)",
  "K4 ek sayaç = 1 (grup dersi BİR kez)",
  "K5 ana ve ek mesajı üretildi (ikisi de null değil)",
  "K5 ana mesajında ortak grup dersi VAR (Pazar)",
  "K5 ek mesajında ortak grup dersi VAR (Pazar)",
  "K6 ders silindi + TEK istek oluştu (+1)",
  "K6 istek: ogrenciId = ana + ogrenciIds = [ek] + bekliyor",
];

/* D34-GRUP-UYE-YAZ KALICI SÜİT (ks-grup-uye-yaz.mjs): "ek öğrenci > 0 ⇒ ogrenciIds ZORUNLU" TEK KAPI kapısı.
   25 assertion — 4 yazım yolu (yeni/düzenleme · istekBurak · formaAktar+planla · havuza geri) × (0/1 ek),
   düzenleme üye koruması, havuz istek kartı üye editörü, WhatsApp ve statik sözleşme.
   D37-HUCRE-GRUP +6 assertion → 31 (havuz kartı DOM yerleşimi: kart + buton + editör TEK dış grid hücresi; ELLE yazılır).
   D38-UYE-BUTON-TOGGLE +5 assertion → 36 (buton aç/kapa: "Kapat" metni · aynı butona 2. tıklama kapatır · TEK açık editör; ELLE yazılır).
   D39-UYE-ARAMA +13 assertion → 49 (editörde öğrenci arama: NFC+tr-TR normalize · SEÇİLİ üye filtre dışında da görünür/İŞARETLİ ·
   taslak korunur · odak/imleç korunur (yalnız liste konteyneri tazelenir) · "Sonuç yok" · kapanış/İptal/kart değişimi/Kaydet'te arama temizlenir; ELLE yazılır). */
elleVakaAdlari["ks-grup-uye-yaz.mjs"] = [
  "boot hatasız",
  "grupUyeYaz: ek>0 ⇒ ogrenciIds = [ek] (ana yazılır)",
  "grupUyeYaz: ek=0 ⇒ ogrenciIds SİLİNİR",
  "grupUyeYaz: ana ek listesinde tekrar etmez + kopya elenir",
  "grupUyeYaz: mevcut ogrenciIds ÜZERİNE yazılır (bayat kayıt kalmaz)",
  "planla() yeni 0 ek: ogrenciIds YAZILMAZ, ogrenciId = ana",
  "planla() yeni 1 ek: ogrenciIds = [ek]",
  "düzenleme 1 ek: grup üyesi KORUNUR",
  "düzenleme 2→1 ek: ogrenciIds = [kalan]",
  "düzenleme tüm ekler çıkarıldı: ogrenciIds SİLİNİR, ogrenciId = ana",
  "düzenleme panel dokunulmadı: mevcut üyeler KORUNUR (silinmez)",
  "istekBurak tekil istek: ogrenciIds YAZILMAZ",
  "istekBurak grup istek: ogrenciIds = [ek]",
  "formaAktar grup istek: ek üyeler panele yüklenir",
  "planla sonrası ilgili istek ogrenciIds SENKRON",
  "WA alıcı listesinde ana üye AYRI satır",
  "WA alıcı listesinde ek üye AYRI satır",
  "WA mesajlarında ortak grup dersi VAR (ikisi)",
  "havuza geri: ders silinir + TEK istek",
  "havuza geri istek: ogrenciId = ana + ogrenciIds = [ek, uc]",
  "istekUyeAc: editör açılır + taslak mevcut üyeler",
  "istekUyeSec: üye ekle/çıkar taslağı değiştirir",
  "istekUyeKaydet: istek.ogrenciIds SENKRON + durum bekliyor",
  "app.js'te grupUyeYaz TEK tanım",
  "5 yazım yolu grupUyeYaz'dan geçer (elle ogrenciIds ataması YOK)",
  /* D37-HUCRE-GRUP: havuz kartı DOM yerleşimi — koşum sırasıyla birebir, otomatik üretim YOK. */
  "ayırıcı grid'in İLK çocuğu + hücreler ONDAN sonra (auto-placement bozulmadı → 1-sol/2-sağ zigzag korunur)",
  "her istek TEK dış grid hücresinde gruplanır (istek-hucre sayısı = istek-kart sayısı; hücre col-span DEĞİL)",
  "buton kart DOM'unun İÇİNDE (kart açılışından SONRA, editör panelinden ÖNCE) — ayrı grid öğesi DEĞİL",
  "editör paneli kartın ALTINDA ve AYNI dış grid hücresinde (hücre sarmalayıcı kart + editörü kapsar)",
  "editör paneli kart genişliğinde taşmaz: hücre min-w-0 + yalnız dikey kaydırma (overflow-x YOK) + dar ekranda 1 sütun",
  "boş-havuz mesajı md:col-span-2 kuralı kaynakta korunur",
  /* D38-UYE-BUTON-TOGGLE: buton aç/kapa — koşum sırasıyla birebir, otomatik üretim YOK. */
  "editör AÇIKKEN buton etiketi 'Kapat' (üye sayaç metni yerine) + vurgu rengi (text-slate-400 DEĞİL)",
  "AYNI butona 2. tıklama editörü KAPATIR (ui.istekUyeId = null · taslak boş · panel DOM'da YOK)",
  "editör KAPALIYKEN buton metni eski hâline döner: 'Grup üyelerini ekle/çıkar (N)' (sayaç + soluk renk geri gelir)",
  "başka kartın butonu → önceki editör KAPANIR, hedef AÇILIR (ui.istekUyeId = hedef · taslak hedefin üyeleri)",
  "DOM'da TEK editör paneli + TEK 'Kapat' etiketi; ikisi de HEDEF kartın hücresinde (önceki kartta editör YOK)",
  /* D39-UYE-ARAMA: editörde öğrenci arama — koşum sırasıyla birebir, otomatik üretim YOK. */
  "editörde 'Öğrenci ara…' arama kutusu VAR (id=istek-uye-arama + placeholder + oninput=istekUyeAra(this.value))",
  "arama normalize kuralı TEK fonksiyonda: normalize(\"NFC\") + toLocaleLowerCase(\"tr-TR\"); hem sorguya hem ada uygulanır (1 tanım + 2 kullanım)",
  "sorgu BOŞKEN görünür liste bugünkü hâliyle BİREBİR (tüm öğrenciler + satır markup'ı aynı, filtre YOK)",
  "SORGU: eşleşen SEÇİLMEMİŞ öğrenci görünür · eşleşmeyen SEÇİLMEMİŞ öğrenci GİZLİ (ecr → Ecrin VAR, Yusuf YOK)",
  "eşleşmeyen SEÇİLİ üyeler listede KALIR ve İŞARETLİ kalır (zzz → 4 seçili satır + 4 checked)",
  "filtre değişince ui.istekUyeTaslak SIFIRLANMAZ (4 üye aynen korunur)",
  "yazarken TÜM editör yeniden çizilmez: istekUyeAra gövdesi YALNIZ #istek-uye-liste içeriğini tazeler (renderHavuz() ÇAĞRISI YOK)",
  "tazeleme SADECE liste konteynerinde: liste DIŞINDAKİ editör DOM'u byte-birebir AYNI (arama input'u yeniden ÜRETİLMEZ → odak/imleç korunur)",
  "'N üye seçili' sayacı SEÇİLİ TOPLAMI gösterir, filtreyi YOK SAYAR (ecr → görünür 5 satır, sayaç 4)",
  "eşleşme yok ve SEÇİLİ de yok → listenin yerine 'Sonuç yok' satırı",
  "İptal'de arama TEMİZLENİR (ui.istekUyeArama = \"\" + editör kapanır)",
  "toggle kapanışta VE kart değişiminde arama TEMİZLENİR (bayat sorgu taşınmaz)",
  "Kaydet sonrası chip sayısı doğru + arama TEMİZLENDİ + editör kapandı (sorgu dışı seçili üye de kaydedilir)",
];

/* D36-ANA-SATIR: günlük çizelge ANA satırında sınıf dersi hücresi (avail.sinif) artık drop-zone "+"
   değil, TEK üreticiden (sinifChipHTML) GERÇEK sınıf adı chip'i + hücre kilitli (drop reddi MEVCUT
   istekBurak/dersBurak kuralıyla). Adlar ELLE yazılır (koşumdan türetme YOK);
   ks-gunluk-ders-tasi.mjs 114 → 120 (6 yeni + 4 ad güncellendi), ks-dongu28.mjs 26 (1 ad güncellendi). */
offsetDuzelt(
  "ks-dongu28.mjs",
  "tek üretici: sinifChipHTML tanımı 1 · chip markup literali 1 · çağrı 2 (haftalık+günlük)",
  "tek üretici: sinifChipHTML tanımı 1 · chip markup literali 1 · çağrı 3 (haftalık + günlük Boş satırı + günlük ANA satır)",
);
const d36Red = (x) => offsetDuzelt(
  "ks-gunluk-ders-tasi.mjs",
  "Sınıf Dersi hedefi (avail.sinif) → RED: " + x,
  "D36 ana satır sınıf chip hücresi (avail.sinif) → RED: " + x,
);
d36Red("localStorage byte-birebir aynı");
d36Red("DB birebir aynı + saveDB çağrılmadı (0)");
d36Red("toast gösterildi");
d36Red("ders yerinde kaldı");
adSonrasiEkle("ks-gunluk-ders-tasi.mjs", "Kapalı hedef (avail.musait) → RED: ders yerinde kaldı", [
  "D36 ana satır: sınıf dersi hücresi GERÇEK sınıf adı chip'i (haftalıkla AYNI üretici + AYNI markup)",
  "D36 ana satır: chip hücresi KİLİTLİ — dnd-bos/drop-zone/draggable YOK, literal 'Sınıf' YOK",
]);
adSonrasiEkle("ks-gunluk-ders-tasi.mjs", "D36 ana satır sınıf chip hücresi (avail.sinif) → RED: ders yerinde kaldı", [
  "D36 ana satır: bırakma REDDİ sonrası ders 6. slotta kaldı (tek kayıt, kopya YOK)",
  "D36 ana satır: boş sınıf adı → T satırında chip YOK + literal 'Sınıf' YOK + mevcut '+' drop-zone korunur",
  "D36 regresyon: mola hücresi hâlâ drop-zone DEĞİL, birebir hücresi hâlâ draggable (ana satır chip'i bunları değiştirmedi)",
  "D36 tek üretici korunuyor: chip markup literali kaynakta TAM 1 · sinifChipHTML çağrısı 3 (haftalık + günlük Boş satırı + günlük ANA satır)",
]);

/* D36-BOS-AD-KILIT: kilit koşulu "anahtar VAR" tabanlı (ad DOLU mu değil) + chip yalnız ad DOLUYSA.
   ks-gunluk-ders-tasi.mjs'te 1 ad güncellendi + 1 yeni ad eklendi (120 → 121). ELLE yazıldı. */
offsetDuzelt(
  "ks-gunluk-ders-tasi.mjs",
  "D36 ana satır: boş sınıf adı → T satırında chip YOK + literal 'Sınıf' YOK + mevcut '+' drop-zone korunur",
  "D36 ana satır boş ad: anahtar VAR + ad BOŞ → hücre KİLİTLİ (dnd-bos/drop/draggable YOK), chip YOK, literal 'Sınıf' YOK",
);
adSonrasiEkle(
  "ks-gunluk-ders-tasi.mjs",
  "D36 ana satır boş ad: anahtar VAR + ad BOŞ → hücre KİLİTLİ (dnd-bos/drop/draggable YOK), chip YOK, literal 'Sınıf' YOK",
  ["D36 haftalık boş ad: anahtar VAR + ad BOŞ → KİLİTLİ hücre (chip YOK, literal 'Sınıf' YOK); adlı slot chip'i DEĞİŞMEDİ"],
);

/* D41-TELEFON: ks-wa-alici'ye 7 assertion eklendi (telefonsuz satır rozeti + Gönder disabled;
   koşum sırasıyla ELLE yazıldı, otomatik üretim YOK); 49 → 56. */
elleVakaAdlari["ks-wa-alici.mjs"].push(
  "D41: waAliciSatirHTML telefonsuz satırda 'Telefon kayıtlı değil' rozeti üretir",
  "D41: telefonsuz satırın Gönder butonu disabled (waGonder bağı korunur, tıklama engelli)",
  "D41: telefonlu satırda rozet YOK + Gönder butonu ETKİN (disabled değil)",
  "D41: liste satırları TEK üreticiden (waAliciSatirHTML tanım 1 · waAc çağrısı 1)",
  "D41: waAc satırı telefonsuz üyeyi listede TUTAR (waGonder bağı kalır)",
  "D41: rozet sayısı = devre dışı Gönder sayısı (birebir)",
  "D41: telefonsuz satır yalnız KENDİ gönderimini kapatır (diğer satırlar etkin)",
);

/* D42-WA-ALICI-TIP: D41 satır-üreticisi assertion'ı D42 mimarisine göre YENİDEN ADLANDIRILDI
   (aynı konum, sayı DEĞİŞMEDİ): waAc artık satırları waAliciListeHTML üzerinden üretir. ELLE. */
offsetDuzelt(
  "ks-wa-alici.mjs",
  "D41: liste satırları TEK üreticiden (waAliciSatirHTML tanım 1 · waAc çağrısı 1)",
  "D41/D42: satır markup'ı TEK üreticiden (waAliciSatirHTML tanım 1 · tek çağrı waAliciListeHTML içinde)",
);

/* D42-WA-ALICI-TIP: ks-wa-alici'ye 6 assertion eklendi (satır durumu SEÇİLİ ALICIYA göre +
   alıcı değişince liste TEK kez tazelenir). Koşum sırasıyla ELLE yazıldı; 56 → 62. */
elleVakaAdlari["ks-wa-alici.mjs"].push(
  "D42: öğrenci teli BOŞ + veli teli VAR → alıcı=Öğrenci'de 'Telefon kayıtlı değil' + disabled",
  "D42: aynı kayıt alıcı=Anne → satır ETKİN (rozet yok, Gönder açık; D41 regresyonu onarıldı)",
  "D42: ters yön — öğrenci teli VAR + veli teli BOŞ → Öğrenci etkin, Anne seçiliyken disabled + rozet",
  "D42: waAliciDegistir listeyi TEK kez yeniler (waAliciListeTazele · tek innerHTML)",
  "D42: tazeleme ÇİFT SATIR üretmez (satır sayısı sabit)",
  "D42: waGonder çözücü yolu korunur (!a.varMi → toast; fallback yok)",
);

/* D56-WA-GUN-FILTRE: ks-wa-alici'ye 7 assertion eklendi (Bugün/Yarın/Tümü alıcı filtresi:
   waGunKaynak gün daraltması + waGunBarHTML üretimi + waAc bar'ı yeniden çizimi).
   Koşum sırasıyla ELLE yazıldı; 62 → 69. D41/D42 push'larINDAN SONRA gelir. */
elleVakaAdlari["ks-wa-alici.mjs"].push(
  "D56: index.html'de waGunBar kapsayıcısı tam 1 kez (tek üretici)",
  "D56: waGunKaynak 'tumu' seçiminde null döner (pencere genişletilmez)",
  "D56: waGunBarHTML tam 3 seçenek üretir (Tümü/Bugün/Yarın)",
  "D56: waGunBarHTML tam 1 aktif düğme gösterir ve ui.waGun'a uyar",
  "D56: waAc her açılışta #waGunBar'ı yeniden çizer (3 düğme)",
  "D56: Bugün filtresi yalnız bugünün planlı dersini verir (iptal elenir)",
  "D56: Yarın filtresi yalnız yarının planlı dersini verir (iptal elenir)",
);
