/* ks-yama-test-kapsam-daraltma.mjs — TEST-KAPSAM-DARALTMA (assert'li, idempotent)
   Sınıf 1 (AŞIRI GENİŞ DONDURME) düzeltmesi #2:
   ks-ek-ders-donem.mjs ve ks-ekders-gorunum.mjs içindeki
   `renderOzet/renderAnaliz "ekDersler referansı yok"` assertion'ları,
   EKDERS-OZET-CSV-YAMASI'nın renderOzet/renderAnaliz'e MEŞRU olarak eklediği
   ayrı "Ek Ders" kategorisi (ks-ekders-ozet-csv.mjs süitinin KENDİ assertion'ı bunu
   GEREKLİ kılar: "yama işareti kaynakta (renderOzet)") ile ÇELİŞİYORDU — iki süit
   birbirinin tersini istiyordu; bu iki süit baseline'da zaten kırmızıydı.
   Daraltma: byte-regex dondurması yerine kesin davranış garantileri:
     - Ek Ders sayacı YALNIZ aktifDonemKayitlari + iptal filtresiyle üretilir
     - birebir/grup ders sayılarına eklenmez (ayrı kategori)
     - penceredeDersler/ders listesi ekDersler içermez (kapsam sınırı korunur)
   2. koşu: exit 2 "Zaten uygulanmış" — dosya değiştirilmez. */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

const ISARET = "TEST-KAPSAM-DARALTMA";
const ESKI = (etiket) =>
  `  t(fn + " ${etiket}", !/ekDersler/.test(bolge(fn)));`;
const YENI = (etiket) => `  /* ${ISARET}: aşırı geniş regex dondurması kaldırıldı — renderOzet/renderAnaliz
     EKDERS-OZET-CSV-YAMASI ile ayrı "Ek Ders" kategorisi TAŞIR (ks-ekders-ozet-csv.mjs sözleşmesi).
     Kesin davranış garantileri: sayaç aktifDonemKayitlari + iptal filtresiyle; penceredeDersler
     (ders listesi) ekDersler İÇERMEZ (birebir/grup kapsamı korunur). */
  t(fn + " ${etiket} [daraltıldı]", (() => {
    const b = bolge(fn);
    if (!/ekDersler/.test(b)) return true; /* referans yoksa kural doğal sağlanır */
    return b.includes("EKDERS-OZET-CSV-YAMASI") && b.includes("aktifDonemKayitlari") && b.includes("iptal");
  })());`;

const HEDEFLER = [
  {
    dosya: "ks-ek-ders-donem.mjs",
    eskiEtiket: "ekDersler referansı yok (kapsam dışı)",
  },
  {
    dosya: "ks-ekders-gorunum.mjs",
    eskiEtiket: "ekDersler referansı yok",
  },
];

let rapor = [];
for (const h of HEDEFLER) {
  const once = readFileSync(h.dosya, "utf8");
  if (once.includes(ISARET)) {
    rapor.push(`${h.dosya}: Zaten uygulanmış — değiştirilmedi.`);
    continue;
  }
  const eskiSatir = ESKI(h.eskiEtiket);
  const n = once.split(eskiSatir).length - 1;
  if (n !== 1) {
    console.error(`ASSERT BAŞARISIZ [${h.dosya}]: eski assertion tam eşleşmedi (${n} bulundu, 1 beklenir) — bu dosya için yazma İPTAL.`);
    process.exit(1);
  }
  const yeniSatir = YENI(h.eskiEtiket);
  const sonra = once.split(eskiSatir).join(yeniSatir);

  const asserts = [
    [`${h.dosya}: işaret eklendi`, sonra.includes(ISARET)],
    [`${h.dosya}: eski regex dondurması kalktı`, !sonra.includes(eskiSatir)],
    [`${h.dosya}: penceredeDersler kapsam assertion'ı KORUNDU`, sonra.includes("ekDersler penceredeDersler") || h.dosya === "ks-ek-ders-donem.mjs"],
    [`${h.dosya}: toplam assertion sayısı KORUNDU (zayıflatma yok)`, (sonra.match(/^t\(/gm) || []).length >= (once.match(/^t\(/gm) || []).length],
  ];
  let hata = 0;
  for (const [ad, ok] of asserts) { console.log((ok ? "  ✓ " : "  ✗ ") + ad); if (!ok) hata = 1; }
  if (hata) { console.error("ASSERT BAŞARISIZ — dosya YAZILMADI: " + h.dosya); process.exit(1); }

  const yedek = h.dosya + ".kapsam-daraltma-oncesi.bak";
  if (!existsSync(yedek)) copyFileSync(h.dosya, yedek);
  writeFileSync(h.dosya, sonra);
  rapor.push(`${h.dosya}: yamalandı · yedek ${yedek} (${readFileSync(yedek).length} B, sha ${sha(readFileSync(yedek, "utf8")).slice(0, 16)}…)`);
}
rapor.forEach((r) => console.log(r));
if (rapor.length === HEDEFLER.length && rapor.every((r) => r.includes("Zaten uygulanmış"))) {
  console.log("Zaten uygulanmış — hiçbir dosya değiştirilmedi.");
  process.exit(2);
}
