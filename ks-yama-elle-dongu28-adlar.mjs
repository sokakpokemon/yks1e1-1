/* ks-yama-elle-dongu28-adlar.mjs — ELLE VAKA ADLARI (donmuş beşli) güncellemesi.
   Marker: ELLE-DONGU28-SINIF-CHIP → ikinci koşumda exit 2 (yazmaz).
   Neden script: elle-vaka-adlari-base.mjs 2000+ satır (str_replace o bölgeye ulaşmıyor).
   Kapsam: ks-dongu28.mjs'in 6 yeni sınıf-chip vakası, koşum sırasıyla doğru konuma eklenir. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const F = "elle-vaka-adlari-base.mjs";
const MARKER = "ELLE-DONGU28-SINIF-CHIP";
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
let src = readFileSync(F, "utf8");
if (src.includes(MARKER)) { console.error("ZATEN UYGULANMIŞ — yazmadan çıkılıyor."); process.exit(2); }
console.log("ÖNCE : " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));

const ESKI = `    "Pazar günü 'Boş' satır YOK",\n    "istekBurak tanımı tam 1 (paralel sistem YOK)",`;
const n = src.split(ESKI).length - 1;
if (n !== 1) { console.error("ANCHOR HATASI: beklenen 1, bulunan " + n); process.exit(1); }
const YENI = `    /* SINIF-CHIP-ORTAK-YAMASI (${MARKER}; elle yazıldı, koşum sırasıyla birebir): günlük sınıf dersi\n       hücresi haftalıkla AYNI pembe chip + GERÇEK sınıf adı; literal "Sınıf" kaldırıldı. */\n    "günlük Boş satırında sınıf dersi hücresi GERÇEK sınıf adı chip'i (haftalıkla birebir markup)",\n    "günlükte literal 'Sınıf' etiketi YOK; sınıf slotu KİLİTLİ (dnd-bos/drop hedefi DEĞİL)",\n    "haftalık pembe chip DEĞİŞMEDİ (aynı td frame + aynı chip; chip sayısı = sınıf slotu sayısı)",\n    "tek üretici: sinifChipHTML tanımı 1 · chip markup literali 1 · çağrı 2 (haftalık+günlük)",\n    "boş sınıf adı → chip YOK, uydurma etiket YOK (mevcut 'Kapalı' gri hücresi kalır)",\n    "mola + dolu birebir hücreleri DEĞİŞMEDİ (günlük: Mola hücresi, draggable birebir, 'Boş' etiketi)",\n    "Pazar günü 'Boş' satır YOK",\n    "istekBurak tanımı tam 1 (paralel sistem YOK)",`;
src = src.split(ESKI).join(YENI);
writeFileSync(F, src, "utf8");
console.log("SONRA: " + Buffer.byteLength(src, "utf8") + " B · sha256=" + sha256(src));
const liste = src.slice(src.indexOf('"ks-dongu28.mjs": ['), src.indexOf('"ks-dongu28.mjs": [') + 4000);
const adet = (liste.match(/^\s*"/gm) || []).length;
console.log("ks-dongu28 ad sayısı (kaba): " + adet);
