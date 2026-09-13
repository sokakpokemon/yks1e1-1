/* ks-yama-kimlik.mjs — KİMLİK-YAMASI bölge 2: sınıf kimliği yaşam döngüsü.
   sinifEkle → yeni sınıfa kalıcı sinifIds girdisi; sinifAdiDegistir → kimlik taşınır (ada değil kayda bağlı);
   sinifSil → kimlik arşivden kalkar. Assert'li + idempotent: 2. koşuda "zaten uygulanmış" der (exit 2), dosyayı değiştirmez. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const DOSYA = "app.js";
const MARK = "KİMLİK-YAMASI-BÖLGE2";
const YEDEK = "app.js.kimlik-bolge2-oncesi.bak";

let src = readFileSync(DOSYA, "utf8");
if (src.includes(MARK)) {
  console.log("Zaten uygulanmış — değişiklik yapılmadı.");
  process.exit(2);
}

const degistir = (ad, eski, yeni) => {
  const n = src.split(eski).length - 1;
  if (n !== 1) { console.error(`ASSERT BAŞARISIZ [${ad}]: ${n} eşleşme (beklenen 1)`); process.exit(1); }
  src = src.replace(eski, yeni);
  console.log(`OK: ${ad}`);
};

/* 1) sinifEkle: yeni sınıfa kalıcı kimlik */
degistir(
  "sinifEkle kimlik",
  "  DB.sinifProg[ad] = [];\n  ui.sinifAd = ad;\n",
  "  DB.sinifProg[ad] = [];\n" +
  "  /* " + MARK + ": yeni sınıfa kalıcı kimlik (sinifIds) */\n" +
  '  if (!DB.sinifIds || typeof DB.sinifIds !== "object") DB.sinifIds = {};\n' +
  '  if (DB.sinifIds[ad] == null || DB.sinifIds[ad] === "") DB.sinifIds[ad] = kimlikUret("snf", Object.keys(DB.sinifIds).length);\n' +
  "  ui.sinifAd = ad;\n"
);

/* 2) sinifAdiDegistir: kimlik yeniden adlandırmada taşınır */
degistir(
  "sinifAdiDegistir kimlik taşıma",
  "  if (DB.sinifProg[eski]) { DB.sinifProg[yeni] = DB.sinifProg[eski]; delete DB.sinifProg[eski]; }\n",
  "  if (DB.sinifProg[eski]) { DB.sinifProg[yeni] = DB.sinifProg[eski]; delete DB.sinifProg[eski]; }\n" +
  "  /* " + MARK + ": sınıf kimliği ada değil kayda bağlı — yeniden adlandırmada KORUNUR */\n" +
  '  if (DB.sinifIds && typeof DB.sinifIds === "object") {\n' +
  '    if (DB.sinifIds[eski] != null && DB.sinifIds[eski] !== "" && (DB.sinifIds[yeni] == null || DB.sinifIds[yeni] === "")) DB.sinifIds[yeni] = DB.sinifIds[eski];\n' +
  "    if (yeni !== eski) delete DB.sinifIds[eski];\n" +
  "  }\n"
);

/* 3) sinifSil: kimlik arşivden kalkar */
degistir(
  "sinifSil kimlik temizliği",
  "    delete DB.sinifProg[s];\n    ui.sinifAd = tumSiniflar()[0] || null;\n",
  "    delete DB.sinifProg[s];\n" +
  "    /* " + MARK + ": silinen sınıfın kimliği de arşivden kalkar */\n" +
  "    if (DB.sinifIds) delete DB.sinifIds[s];\n" +
  "    ui.sinifAd = tumSiniflar()[0] || null;\n"
);

copyFileSync(DOSYA, YEDEK);
writeFileSync(DOSYA, src);
console.log("KİMLİK-YAMASI bölge 2 uygulandı. Geri dönüş: " + YEDEK);
