import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const MARK = "D59-TEST-UYUM";

if (!readFileSync("app.js", "utf8").includes("D59-OGRENCI-SLOT-KURALI"))
  console.warn("UYARI: app.js'te D59 sert-kural yaması görünmüyor!");

function yama(dosya, esk, yen) {
  if (!existsSync(dosya)) { console.error("YOK: " + dosya); process.exit(1); }
  let s = readFileSync(dosya, "utf8");
  if (s.includes(MARK)) { console.log("  (zaten uygulanmis) " + dosya); return; }
  const n = s.split(esk).length - 1;
  if (n !== 1) { console.error("ANCHOR FAIL [" + dosya + "]: " + n + " kez (1 bekleniyor)\n----\n" + esk + "\n----"); process.exit(1); }
  if (!existsSync(dosya + ".d59-test.bak")) copyFileSync(dosya, dosya + ".d59-test.bak");
  writeFileSync(dosya, s.replace(esk, yen));
  console.log("  + " + dosya);
}

yama("ks-istekten-grup.mjs",
  "const nOnce4 = DB.dersler.length;",
  "/* " + MARK + ": ayni ogrenci-slot cift kaydi engellenir; tekli akisi izole et */\n" +
  "DB.dersler = DB.dersler.filter(l => l !== tekKayit);\n" +
  "const nOnce4 = DB.dersler.length;");

yama("ks-grup-istegi.mjs",
  "const nOnce3 = DB.dersler.length;\nplanla();\nconst tek = DB.dersler[nOnce3];",
  "/* " + MARK + ": test-8 grup kaydi slotu tutuyor; tekli akisi izole et */\n" +
  "DB.dersler = DB.dersler.filter(l => l !== ders);\n" +
  "const nOnce3 = DB.dersler.length;\nplanla();\nconst tek = DB.dersler[nOnce3];");

console.log("\n== --tam ==");
const r = spawnSync("node", ["hizli-test.mjs", "--tam"], { encoding: "utf8", maxBuffer: 1 << 28 });
const out = (r.stdout || "") + (r.stderr || "");
console.log(out.split("\n").slice(-16).join("\n"));
console.log("TAM_EXIT=" + r.status);
