/* ks-yama-union.mjs — dersOgrenciIds yardımcısını birleşim anlambilimine taşır:
   grup kaydında ana öğrenci (ogrenciId) + ek öğrenciler (ogrenciIds) = TÜM katılımcılar.
   Böylece mevcut grup dersinin ana öğrencisi de çakışma kontrolünde "meşgul" sayılır.
   Assert'li, idempotent: ikinci çalıştırmada güvenli şekilde reddeder. */
import { readFileSync, writeFileSync } from "node:fs";

const F = "app.js";
const src = readFileSync(F, "utf8");
const say = (h, n) => h.split(n).length - 1;
const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };

/* Zaten uygulanmış mı? */
if (src.includes("var _tum = [ders.ogrenciId].concat(ders.ogrenciIds);")) {
  console.log("SKIP: birleşim anlambilimi zaten uygulanmış");
  process.exit(0);
}

const need =
  '  if (ders.ogrenciIds != null) {\n' +
  '    if (!Array.isArray(ders.ogrenciIds)) return [];\n' +
  '    return ders.ogrenciIds.filter(function (v, i) { return v != null && ders.ogrenciIds.indexOf(v) === i; });\n' +
  '  }\n';
if (say(src, need) !== 1) fail("yardimci govdesi tam 1 kez bulunamadi (bulunan: " + say(src, need) + ")");

const rep =
  '  if (ders.ogrenciIds != null) {\n' +
  '    if (!Array.isArray(ders.ogrenciIds)) return [];\n' +
  '    var _tum = [ders.ogrenciId].concat(ders.ogrenciIds); /* ana öğrenci + ek öğrenciler = tüm katılımcılar */\n' +
  '    return _tum.filter(function (v, i) { return v != null && _tum.indexOf(v) === i; });\n' +
  '  }\n';

const docOld = "   - ders.ogrenciIds (dizi) varsa → benzersiz, sırasını koruyan dizi\n";
const docNew = "   - ders.ogrenciIds (dizi) varsa → [ogrenciId, ...ogrenciIds] benzersiz, sırasını koruyan (tüm katılımcılar)\n";
let out = src.replace(need, rep);
if (out === src) fail("govde degisikligi uretilemedi");
if (say(out, docOld) !== 1) fail("doc satiri tam 1 kez bulunamadi");
out = out.replace(docOld, docNew);
if (out === src) fail("doc degisikligi uretilemedi");
writeFileSync(F, out);

/* Doğrulama */
const chk = readFileSync(F, "utf8");
if (!chk.includes("var _tum = [ders.ogrenciId].concat(ders.ogrenciIds);")) fail("birlesim satiri yazilmadi");
if (!chk.includes("(tüm katılımcılar)")) fail("doc guncellenmedi");
if (say(chk, "function dersOgrenciIds(ders) {") !== 1) fail("yardimci tekrarlandi");
if (chk.includes("ders.ogrenciIds.indexOf(v) === i")) fail("eski govde duruyor");
/* Eski-kayıt dalı korunmalı (birleşim dalına girmeden): */
if (!chk.includes('if (ders.ogrenciId != null && ders.ogrenciId !== "") return [ders.ogrenciId];')) fail("eski kayit dali etkilendi");
console.log("OK: dersOgrenciIds artık tüm katılımcıları (ogrenciId + ogrenciIds birleşimi) döndürüyor");
