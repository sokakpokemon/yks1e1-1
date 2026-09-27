/* D32-GRUP-2UYE yaması — İKİ ÖĞRENCİLİ grup (ana + 1 ek) birebir ders kaydı.
   KÖK NEDEN (kanıtlı): planla() grup eşiği `grupOgrenciIds.length >= 2` = ANA DIŞINDA en az 2 ek
   ister (3 katılımcı). Havuz "Ortak Grup İsteği" ise en az 2 TOPLAM üye kabul eder (uyeler.length < 2
   guard'ı). Form ile havuz ASİMETRİK: formda ana + 1 ek seçilince kayıt SESSİZCE birebir olur ve 2. üye
   DÜŞER (ogrenciIds yazılmaz).
   YAMA: eşik >=2 → >=1. Ana çıkarıldıktan sonra ≥1 ek = ≥2 katılımcı = grup. 0 ek → eski birebir akış
   BİREBİR korunur (mesaj/form/çakışma akışları değişmez).
   İdempotent: uygulanmışsa "Zaten uygulanmış" + exit 2, dosyaya dokunmaz. */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { createHash } from "crypto";

const dosya = "app.js";
const once = readFileSync(dosya, "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");

if (once.includes("D32-GRUP-2UYE")) {
  console.error("Zaten uygulanmış (D32-GRUP-2UYE)");
  process.exit(2);
}

/* ---- Yedek (yalnız bir kez) ---- */
const yedek = "app.js.d32-grup2uye-oncesi.bak";
if (!existsSync(yedek)) { copyFileSync(dosya, yedek); console.log("Yedek alındı:", yedek); }

/* ---- Yama 1: ilk eşik (ana çıkarılmadan ÖNCE) ---- */
const ESKI1 =
`  /* Grup modu: 2+ ek öğrenci seçiliyse tek kayıt ogrenciIds dizisiyle; aksi hâlde birebir akış aynen */
  var grupOgrenciIds = Array.isArray(ui.ekOgrenciIds) ? ui.ekOgrenciIds.filter(function (oid, i) {
    return oid != null && ui.ekOgrenciIds.indexOf(oid) === i;
  }) : [];`;
const YENI1 =
`  /* D32-GRUP-2UYE: İKİ öğrencili grup (ana + 1 ek) form kaydı da grup olmalı — havuz ortak grup
     isteği en az 2 TOPLAM üye kabul ediyor; form eşiği >=2 EK ile asimetrik kalıp 2. üyeyi düşürüyordu.
     0 ek → eski birebir akış AYNEN. */
  var grupOgrenciIds = Array.isArray(ui.ekOgrenciIds) ? ui.ekOgrenciIds.filter(function (oid, i) {
    return oid != null && ui.ekOgrenciIds.indexOf(oid) === i;
  }) : [];`;
if (!once.includes(ESKI1)) { console.error("YAMA1 anchor bulunamadı"); process.exit(1); }
if (once.split(ESKI1).length !== 2) { console.error("YAMA1 anchor tek değil"); process.exit(1); }

/* ---- Yama 2: eşik satırı (ana çıkarılmadan ÖNCE) ---- */
const ESKI2 =
`  var grupModu = grupOgrenciIds.length >= 2 || (grupIstekAktif && grupOgrenciIds.length >= 1);
  if (grupModu) {`;
const YENI2 =
`  var grupModu = grupOgrenciIds.length >= 1; /* D32-GRUP-2UYE: ≥1 ek = ≥2 katılımcı = grup */
  if (grupModu) {`;
if (!once.includes(ESKI2)) { console.error("YAMA2 anchor bulunamadı"); process.exit(1); }
if (once.split(ESKI2).length !== 2) { console.error("YAMA2 anchor tek değil"); process.exit(1); }

/* ---- Yama 3: ana çıkarıldıktan SONRA yeniden hesaplanan eşik ---- */
const ESKI3 =
`  grupOgrenciIds = grupOgrenciIds.filter(function (oid) { return oid !== o.id; });
  grupModu = grupOgrenciIds.length >= 2 || (grupIstekAktif && grupOgrenciIds.length >= 1);`;
const YENI3 =
`  grupOgrenciIds = grupOgrenciIds.filter(function (oid) { return oid !== o.id; });
  grupModu = grupOgrenciIds.length >= 1; /* D32-GRUP-2UYE: ana çıkarıldıktan sonra ≥1 ek = grup */`;
if (!once.includes(ESKI3)) { console.error("YAMA3 anchor bulunamadı"); process.exit(1); }
if (once.split(ESKI3).length !== 2) { console.error("YAMA3 anchor tek değil"); process.exit(1); }

const sonra = once.replace(ESKI1, YENI1).replace(ESKI2, YENI2).replace(ESKI3, YENI3);
if (sonra === once) { console.error("Değişiklik üretilemedi"); process.exit(1); }

console.log("D32-GRUP-2UYE yaması uygulandı (3 bölge).");
console.log("app.js SHA önce :", sha(once));
console.log("app.js SHA sonra:", sha(sonra));
writeFileSync(dosya, sonra);
console.log("OK");
