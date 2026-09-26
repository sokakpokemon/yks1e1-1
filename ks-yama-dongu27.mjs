/* DÖNGÜ-27 yaması — assert'li, idempotent (2. koşu "Zaten uygulanmış" + exit 2, dosyaya dokunmaz).
   Yama 1: waAc() — sayac dersOgrenciIds(l) üzerinden tüm katılımcılara dağıtılır.
   Yama 2: ogrenciMesajMetni() — ders filtresi dersOgrenciIds kapsayıcı. */
import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";

const dosya = "app.js";
const once = readFileSync(dosya, "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");

if (once.includes("DONGU-27")) {
  console.error("Zaten uygulanmış (DÖNGÜ-27)");
  process.exit(2);
}

/* ---- Yama 1: waAc sayacı ---- */
const ESKI1 =
`    var k = l.ogrenciId || l.ogrenciAd;
    if (!sayac[k]) sayac[k] = { id: l.ogrenciId || "", ad: l.ogrenciAd, n: 0 };
    sayac[k].n++;`;
const YENI1 =
`    /* DONGU-27: grup dersinde sayaç yalnız ana öğrenciye giderdi; artık dersOgrenciIds(l)
       ile TÜM katılımcılar aynı dersi kendi hesabına BİR kez sayar. Tekli derste
       dersOgrenciIds [ogrenciId] döner → eski davranış birebir korunur. Ad DB'den çözülür. */
    var uyeIds = dersOgrenciIds(l);
    if (!uyeIds.length) uyeIds = [l.ogrenciId || ""];
    uyeIds.forEach(function (oid) {
      var k = oid || l.ogrenciAd;
      if (!sayac[k]) {
        var uye = oid ? DB.ogrenciler.find(function (x) { return x.id === oid; }) : null;
        sayac[k] = { id: oid || "", ad: (uye && uye.ad) || l.ogrenciAd, n: 0 };
      }
      sayac[k].n++;
    });`;
if (!once.includes(ESKI1)) { console.error("YAMA1 anchor bulunamadı"); process.exit(1); }
if (once.split(ESKI1).length !== 2) { console.error("YAMA1 anchor tek değil"); process.exit(1); }

/* ---- Yama 2: ogrenciMesajMetni filtresi ---- */
const ESKI2 =
`  var liste = penceredeDersler().filter(function (l) {
    return (l.ogrenciId === o.id || l.ogrenciAd === o.ad) && l.durum !== "iptal";
  });`;
const YENI2 =
`  /* DONGU-27: ek grup üyesi için grup dersi (l.ogrenciId = ana) bu filtrede görünmüyordu;
     dersOgrenciIds(l) ana + tüm ek üyeleri döner → her üyenin mesajında grup dersi VAR.
     Tekli derste [ogrenciId] döner → eski eşleşme birebir korunur. İptal filtresi aynen. */
  var liste = penceredeDersler().filter(function (l) {
    return (dersOgrenciIds(l).indexOf(o.id) !== -1 || l.ogrenciAd === o.ad) && l.durum !== "iptal";
  });`;
if (!once.includes(ESKI2)) { console.error("YAMA2 anchor bulunamadı"); process.exit(1); }
if (once.split(ESKI2).length !== 2) { console.error("YAMA2 anchor tek değil"); process.exit(1); }

const sonra = once.replace(ESKI1, YENI1).replace(ESKI2, YENI2);
console.log("DÖNGÜ-27 yaması uygulandı (2 bölge).");
console.log("app.js SHA önce:", sha(once));
console.log("app.js SHA sonra:", sha(sonra));
writeFileSync(dosya, sonra);
console.log("OK");
