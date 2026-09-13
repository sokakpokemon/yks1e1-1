/* ks-yama-donem-damga.mjs — DONEM-DAMGA yaması (idempotent, assert'li, hedefli bölgesel)
   TEK İŞ: yeni oluşturulan ders ve istek kayıtlarına aktif dönemin ID'sini DOĞRUDAN yaz.
   - aktifDonemId(): DB.aktifDonemId doluysa onu; yoksa/boşsa/geçersizse "donem-2026-2027".
   - planla() YENİ ders dalları (birebir + grup) → donemId: aktifDonemId()
   - istekEkle() tekli istek → donemId: aktifDonemId()
   - istekGrupEkle() grup istek → donemId: aktifDonemId()
   - Düzenleme dalları DEĞİŞMEZ (mevcut donemId korunur); normalize/backfill değişmez.
   Kurallar: tüm assert'ler geçmeden yazma YOK; 2. koşu "Zaten uygulanmış" (exit 2), dosyaya dokunmaz. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const HEDEF = "app.js";
const FALLBACK = "donem-2026-2027";
const kaynak = readFileSync(HEDEF, "utf8");

function eslesmeAdet(kaynak, hedef) {
  if (!hedef) return 0;
  let n = 0, i = 0;
  while ((i = kaynak.indexOf(hedef, i)) !== -1) { n++; i += hedef.length; }
  return n;
}
function assertKere(kaynak, hedef, beklenen, etiket) {
  const n = eslesmeAdet(kaynak, hedef);
  if (n !== beklenen) {
    console.error(`✗ ASSERT (${etiket}): "${hedef.slice(0, 80)}…" için ${n} eşleşme, beklenen ${beklenen}`);
    process.exit(1);
  }
}
/* idempotentlik: zaten uygulanmış mı? (bu yamaya özgü işaret) */
if (kaynak.includes("DONEM-DAMGA-YAMASI")) {
  console.log("Zaten uygulanmış (DONEM-DAMGA-YAMASI işareti mevcut) — dosyaya dokunulmadı. (exit 2)");
  process.exit(2);
}

/* ---- YAMA 0: aktifDonemId() yardımcısı (donemleriBaslat'tan hemen sonra) ---- */
const H0_ESKI = `  return say;
}
function bosDB() {`;
const H0_YENI = `  return say;
}
/* DONEM-DAMGA-YAMASI: yeni kayıt damgası için güvenli aktif dönem ID'si.
   DB.aktifDonemId doluysa O KULLANILIR; yoksa/boşsa/geçersizse "${FALLBACK}".
   Yeni kayda asla undefined/null/boş donemId yazılmaz. */
function aktifDonemId() {
  return (typeof DB !== "undefined" && DB && typeof DB.aktifDonemId === "string" && DB.aktifDonemId.trim() !== "") ? DB.aktifDonemId : "${FALLBACK}";
}
function bosDB() {`;
assertKere(kaynak, H0_ESKI, 1, "Y0 aktifDonemId bağlantı noktası");
let sonuc = kaynak.replace(H0_ESKI, H0_YENI);

/* ---- YAMA 1: planla() YENİ birebir ders kaydı ---- */
const H1_ESKI = `  } else {
    DB.dersler.push({
      id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: dersId, konu: konu,
      ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
      durum: "planlandi", olusturma: todayKey()
    });
    if (ui.aktifIstekId) {`;
const H1_YENI = `  } else {
    DB.dersler.push({
      id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: dersId, konu: konu,
      ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
      durum: "planlandi", olusturma: todayKey(),
      donemId: aktifDonemId() /* DONEM-DAMGA-YAMASI: yeni ders aktif döneme damgalanır */
    });
    if (ui.aktifIstekId) {`;
assertKere(kaynak, H1_ESKI, 1, "Y1 planla birebir yeni ders");
sonuc = sonuc.replace(H1_ESKI, H1_YENI);

/* ---- YAMA 2: planla() YENİ grup ders kaydı ---- */
const H2_ESKI = `    } else {
      DB.dersler.push({
        id: uid(), ogrenciId: o.id, ogrenciIds: grupOgrenciIds.slice(), ogrenciAd: o.ad, dersId: dersId, konu: konu,
        ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
        durum: "planlandi", olusturma: todayKey()
      });
      toast("Grup dersi planlandı 🎉 "`;
const H2_YENI = `    } else {
      DB.dersler.push({
        id: uid(), ogrenciId: o.id, ogrenciIds: grupOgrenciIds.slice(), ogrenciAd: o.ad, dersId: dersId, konu: konu,
        ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
        durum: "planlandi", olusturma: todayKey(),
        donemId: aktifDonemId() /* DONEM-DAMGA-YAMASI: yeni grup dersi aktif döneme damgalanır */
      });
      toast("Grup dersi planlandı 🎉 "`;
assertKere(kaynak, H2_ESKI, 1, "Y2 planla grup yeni ders");
sonuc = sonuc.replace(H2_ESKI, H2_YENI);

/* ---- YAMA 3: istekEkle() yeni tekli istek ---- */
const H3_ESKI = `  DB.istekler.push({ id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: dersId, konu: konu, durum: "bekliyor", olusturma: todayKey() });
  toast("İstek havuza eklendi ✓");`;
const H3_YENI = `  DB.istekler.push({ id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: dersId, konu: konu, durum: "bekliyor", olusturma: todayKey(), donemId: aktifDonemId() /* DONEM-DAMGA-YAMASI: yeni istek aktif döneme damgalanır */ });
  toast("İstek havuza eklendi ✓");`;
assertKere(kaynak, H3_ESKI, 1, "Y3 istekEkle tekli istek");
sonuc = sonuc.replace(H3_ESKI, H3_YENI);

/* ---- YAMA 4: istekGrupEkle() yeni grup istek ---- */
const H4_ESKI = `  DB.istekler.push({ id: uid(), ogrenciId: anaId, ogrenciIds: ekler, ogrenciAd: anaO ? anaO.ad : "", dersId: dersId, konu: konu, durum: "bekliyor", olusturma: todayKey() });
  /* 10+ seçim engellenmez — yalnızca uyarı */`;
const H4_YENI = `  DB.istekler.push({ id: uid(), ogrenciId: anaId, ogrenciIds: ekler, ogrenciAd: anaO ? anaO.ad : "", dersId: dersId, konu: konu, durum: "bekliyor", olusturma: todayKey(), donemId: aktifDonemId() /* DONEM-DAMGA-YAMASI: yeni grup istek aktif döneme damgalanır */ });
  /* 10+ seçim engellenmez — yalnızca uyarı */`;
assertKere(kaynak, H4_ESKI, 1, "Y4 istekGrupEkle grup istek");
sonuc = sonuc.replace(H4_ESKI, H4_YENI);

/* ---- Son doğrulamalar: 5 damga + düzenleme dalları değişmedi ---- */
assertKere(sonuc, H1_YENI, 1, "son: Y1 birebir dal");
assertKere(sonuc, H2_YENI, 1, "son: Y2 grup dal");
assertKere(sonuc, "donemId: aktifDonemId()", 4, "son: toplam 4 donemId damgası");
assertKere(sonuc, "DONEM-DAMGA-YAMASI", 5, "son: 5 yama işareti (1 helper + 4 damga)");
assertKere(sonuc, "mg.tarih = tarih; mg.saat = saat; mg.kod = ksKodOf(saat);", 1, "koruma: grup düzenleme dalı değişmedi");
assertKere(sonuc, "mevcut.tarih = tarih; mevcut.saat = saat; mevcut.kod = ksKodOf(saat);", 1, "koruma: birebir düzenleme dalı değişmedi");
assertKere(sonuc, "l.donemId = DONEM_ILK_ID", 1, "koruma: normalize backfill aynen");
assertKere(sonuc, "r.donemId = DONEM_ILK_ID", 1, "koruma: istek backfill aynen");

/* ---- tüm assert'ler geçti: yedek + yaz ---- */
copyFileSync(HEDEF, "app.js.donem-damga-oncesi.bak");
writeFileSync(HEDEF, sonuc, "utf8");
console.log("DONEM-DAMGA yaması uygulandı: aktifDonemId() helper + 4 kayıt noktası damgalandı.");
console.log("Geri dönüş: app.js.donem-damga-oncesi.bak");
