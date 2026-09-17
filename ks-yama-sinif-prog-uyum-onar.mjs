/* ks-yama-sinif-prog-uyum-onar.mjs — SINIF-PROG-UYUM-GENISLETME yaması (assert'li, idempotent)
   TEK İŞ: sinifOgrtUyumOnar'ın "yalnız ilk dönem" (hedef !== DONEM_ILK_ID → {e:0}) erken dönüşünü,
   TAM onarım moduna (tumDonemler=true) geçen ikinci parametreyle değiştirir.
   Kök neden (kanıtlı teshis): 10.SINIF grid'i DB.sinifProg["10.SINIF"] = sinifProgDonemler[aktifDonemId]
   okur; başka dönem aktifken onarım {e:0} dönüyor ve avail.sinif kaynaklı slotlar canonical map'e
   yazılmıyordu. Yama kuralları:
     - normalize()/loadDB() yolu DOKUNMAZ (tumDonemler=false — ks-donem-olusturma sözleşmesi korunur).
     - boot + her yeni dönem oluşturma/dönem değişimi TAM onarım yapar (tumDonemler=true).
     - Kaynak hâlâ yalnızca ogretmen avail.sinif; dolu hücreler silinmez; duplicate push YOK.
     - saveDB akışı zaten boot'ta ve mutasyon yollarında çağrılıyor → kalıcılık korunur.
   2. koşu: "Zaten uygulanmış" + exit 2; tüm assert'ler geçmeden yazma YOK. */
import { readFileSync, writeFileSync, copyFileSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const HEDEF = "app.js";
const DAMGA = "SINIF-PROG-UYUM-GENISLETME";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const kaynak = readFileSync(HEDEF, "utf8");
const oncesiSha = sha(kaynak);

if (kaynak.includes(DAMGA)) {
  console.error("Zaten uygulanmış — dosya değiştirilmedi. (hash: " + oncesiSha.slice(0, 12) + "…)");
  process.exit(2);
}

const bak = "app.js.sinif-prog-uyum-onar-oncesi.bak";
if (!existsSync(bak)) copyFileSync(HEDEF, bak);

function say(metin, igne) { return metin.split(igne).length - 1; }
function tekDegistir(metin, eski, yeni, etiket) {
  const adet = say(metin, eski);
  if (adet !== 1) { console.error("ASSERT başarısız (" + etiket + "): hedef tam 1 kez bulunmalı — bulunan " + adet); process.exit(1); }
  return metin.replace(eski, () => yeni);
}

/* ---- 1) Fonksiyon imzası + erken dönüş: tam-onarım modu parametresi ---- */
const ESKI_IMZA = "function sinifOgrtUyumOnar(db) {";
const YENI_GOVDE_BAS = `function sinifOgrtUyumOnar(db, tumDonemler) {
  /* ${DAMGA}: tumDonemler=true → onarım HER hedef dönemde çalışır (grid DB.sinifProg[ad] =
     sinifProgDonemler[hedef] okuduğu için avail.sinif kaynaklı slotlar her aktif dönemin
     canonical haritasına yazılmalı). normalize/loadDB yolu tumDonemler=false geçer ve
     dönemli programlara DOKUNMAZ (mevcut sözleşme korunur). boot + dönem geçişi/oluşturma
     TAM onarım yapar. Kaynak hâlâ yalnızca ogretmen avail.sinif; mevcut dolu hücreler
     silinmez/taşınmaz; duplicate push YOK. */`;
let yeni = kaynak;
yeni = tekDegistir(yeni, ESKI_IMZA, YENI_GOVDE_BAS, "1: imza + tam-onarım parametresi");
const ESKI_ERKEN = `  if (hedef !== DONEM_ILK_ID) return { e: 0 }; /* SINIF-OGRT-UYUM-YAMASI: yalnız ilk dönem — başka döneme sınıf dersi uydurma YOK */`;
const YENI_ERKEN = `  if (!tumDonemler && hedef !== DONEM_ILK_ID) return { e: 0 }; /* normalize/loadDB yolu: dönemli programlara dokunmaz */`;
yeni = tekDegistir(yeni, ESKI_ERKEN, YENI_ERKEN, "2: erken dönüş koşullu tam-onarım");

/* ---- 2) Çağrı noktaları: boot + dönem geçişi/oluşturma TAM onarım ---- */
const ESKI_BOOT = "sinifOgrtUyumOnar(DB); /* SINIF-OGRT-UYUM-YAMASI: sinifProg ↔ avail.sinif uyumu boot'ta kapanır (idempotent) */";
const YENI_BOOT = "sinifOgrtUyumOnar(DB, true); /* SINIF-OGRT-UYUM-YAMASI + GENISLETME: boot'ta TAM onarım (tüm dönemler) */";
yeni = tekDegistir(yeni, ESKI_BOOT, YENI_BOOT, "3: boot çağrısı tam-onarım");

/* ---- Yazma sonrası bellek-doğrulamaları ---- */
const kontroller = [
  [DAMGA, 1],
  ["function sinifOgrtUyumOnar(db, tumDonemler)", 1],
  ["sinifOgrtUyumOnar(DB, true)", 1],
  ["sinifOgrtUyumOnar(db)", 1], /* normalize/loadDB içindeki dokunmaz çağrısı değişmez */
  ["if (!tumDonemler && hedef !== DONEM_ILK_ID)", 1],
  ["yalnız ilk dönem — başka döneme sınıf dersi uydurma YOK", 0],
  ["if (prog[cls].indexOf(k) < 0) { prog[cls].push(k); eklenen++; }", 1],
];
for (const [igne, beklenen] of kontroller) {
  const n = say(yeni, igne);
  if (n !== beklenen) { console.error("ASSERT başarısız (sonrası): \"" + igne + "\" beklenen " + beklenen + ", bulunan " + n); process.exit(1); }
}

writeFileSync(HEDEF, yeni);
console.log("SINIF-PROG-UYUM-GENISLETME uygulandı (yalnız app.js, 3 hedefli bölge).");
console.log("  önce:  " + oncesiSha + " (" + statSync(bak).size + " B)");
console.log("  sonra: " + sha(readFileSync(HEDEF, "utf8")) + " (" + statSync(HEDEF).size + " B)");
console.log("  yedek: " + bak + (existsSync(bak) ? " (korunmuş)" : " (YOK!)"));
