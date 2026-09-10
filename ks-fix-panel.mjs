/* ks-fix-panel.mjs — ek-ogrenciler panel eklemesini idempotent + stub-güvenli yapar */
import { readFileSync, writeFileSync } from "node:fs";

const F = "app.js";
const src = readFileSync(F, "utf8");
const say = (h, n) => h.split(n).length - 1;
const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };

const need = '  $("hizliOgr").insertAdjacentHTML("afterend", ekPanel);\n';
if (say(src, need) !== 1) fail("hedef satir tam 1 kez bulunamadi (bulunan: " + say(src, need) + ")");

const rep =
'  /* Paneli yalnizca bir kez ekle (idempotent; stub DOM"larda da guvenli) */\n' +
'  if (!document.getElementById("ek-ogrenciler")) {\n' +
'    var hzEl = $("hizliOgr");\n' +
'    if (hzEl && hzEl.insertAdjacentHTML) hzEl.insertAdjacentHTML("afterend", ekPanel);\n' +
'  }\n';

const out = src.replace(need, rep);
if (out === src) fail("degisiklik uretilemedi");
writeFileSync(F, out);

const chk = readFileSync(F, "utf8");
if (!chk.includes('if (!document.getElementById("ek-ogrenciler")) {')) fail("guard yazilmadi");
if (chk.includes('  $("hizliOgr").insertAdjacentHTML')) fail("eski satir duruyor");
if (say(chk, "function ekOgrenciEkle(") !== 1) fail("ekOgrenciEkle etkilendi");
if (!chk.includes('var ogrenciAd = $("f-ogrenci").value.trim();')) fail("planla akisi etkilendi");
console.log("OK: panel eklemesi idempotent + stub-guvenli hale getirildi");
