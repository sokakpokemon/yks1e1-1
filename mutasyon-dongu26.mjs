/* mutasyon-dongu26.mjs — DÖNGÜ-26 mutasyon testleri: 4 mutasyonun HERBİRİ FAIL etmeli.
   M1: istekBurak grup üyelerini düşür (ogrenciIds yazma satırı kaldırılır)
   M2: havuz isteği tüketilmesin (istekler.filter silme satırı kaldırılır)
   M3: haftalık tablo grup üye satırını hücreye ekleme (hücre yazımından üye satırı çıkarılır)
   M4: formaAktar'dan renderHavuz() kaldır
   Akış: mutate → ks-dongu26.mjs koş (FAIL bekle) → restore. Her adım SHA kanıtlı. */
import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const APP = "app.js";
const temizSha = sha(APP);
const temizKopya = ".mutasyon-dongu26-temiz.app.js";
copyFileSync(APP, temizKopya);
if (sha(temizKopya) !== temizSha) { console.error("kopya SHA uyuşmaz"); process.exit(1); }

const restore = () => { copyFileSync(temizKopya, APP); };
const kos = () => spawnSync(process.execPath, ["ks-dongu26.mjs"], { encoding: "utf8" });
const failGecti = (r, ad) => {
  const marker = /SUITE_DONE:ks-dongu26\.mjs:26:26/.test(r.stdout || "");
  const fail = r.status !== 0 || /✗/.test(r.stdout || "");
  if (fail && !marker) { console.log("  ✓ " + ad + " → süit FAIL etti (beklendi)"); return true; }
  console.log("  ✗ " + ad + " → süit GEÇTİ (mutasyon yakalanmadı!)");
  return false;
};

let fail = 0;
const M = (ad, uygula) => {
  console.log(ad + ":");
  uygula();
  const r = kos();
  if (!failGecti(r, ad)) fail = 1;
  restore();
  if (sha(APP) !== temizSha) { console.error("RESTORE SHA uyuşmaz — durduruluyor"); process.exit(1); }
};

/* M1: grup üyeleri düşer */
M("M1 istekBurak ogrenciIds yazımı kaldırılır", () => {
  const s = readFileSync(APP, "utf8");
  const yeni = s.replace('if (_d26Ekler.length) _d26Yeni.ogrenciIds = _d26Ekler;\n', '');
  if (yeni === s) throw new Error("M1 hedef satır bulunamadı");
  writeFileSync(APP, yeni);
});

/* M2: istek tüketilmez */
M("M2 istekBurak istek silme satırı kaldırılır", () => {
  const s = readFileSync(APP, "utf8");
  const hedef = '  DB.istekler = DB.istekler.filter(function (x) { return x.id !== istekId; });\n  ui.aktifIstekId = null;\n\n  toast("İstek takvime planlandı ✓ "';
  if (!s.includes(hedef)) throw new Error("M2 hedef blok bulunamadı");
  writeFileSync(APP, s.replace(hedef, '  toast("İstek takvime planlandı ✓ "'));
});

/* M3: haftalık tabloda üye satırı çıkarılır (ölü hucreUst durumuna geri dön) */
M("M3 haftalık hücreden grup üye satırı çıkarılır", () => {
  const s = readFileSync(APP, "utf8");
  const i = s.indexOf("          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) +\n          (grupUyeler.length ? '<div");
  if (i === -1) throw new Error("M3 hedef blok bulunamadı");
  const eski = s.slice(i, i + 700);
  const j = eski.indexOf("</td>'; /*");
  const duzeltilmis = s.slice(0, i) + "          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) + '</td>'; /*" + s.slice(i + j + "</td>'; /*".length);
  writeFileSync(APP, duzeltilmis);
});

/* M4: formaAktar renderHavuz kaldırılır */
M("M4 formaAktar renderHavuz() kaldırılır", () => {
  const s = readFileSync(APP, "utf8");
  const hedef = '  renderHavuz(); /* DÖNGÜ-26: havuz kartı anında tazelenir — eski hâliyle takılı kalmaz */\n';
  if (!s.includes(hedef)) throw new Error("M4 hedef satır bulunamadı");
  writeFileSync(APP, s.replace(hedef, ""));
});

unlinkSync(temizKopya);
console.log(fail ? "MUTASYON TESTLERİ BAŞARISIZ — en az bir mutasyon yakalanmadı." : "4/4 mutasyon FAIL etti (hepsi yakalandı) ✓ · restore SHA birebir: " + temizSha.slice(0, 16) + "…");
process.exit(fail);
