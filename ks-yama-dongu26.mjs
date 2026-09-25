/* ks-yama-dongu26.mjs — DÖNGÜ-26 hedefli yama (idempotent, assert'li)
   Yama 1: haftalikOgrtTablo — ölü hucreUst (baş harf, hiç kullanılmıyordu) kaldırılır;
           grup üyeleri TAM AD olarak hücre alt satırına eklenir (birebirde eklenmez).
   Yama 2: istekBurak — grup istekte (r.ogrenciIds) üyeler ders kaydına taşınır;
           tekli istekte akış birebir eski hâl (ogrenciIds YAZILMAZ).
   Yama 3: formaAktar — renderHavuz() çağrısı eklenir (havuz kartı anında tazelenir).
   2. koşu: "Zaten uygulanmış" der, dosyayı değiştirmez (exit 2). */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const oncekiSha = sha(readFileSync("app.js"));
if (oncekiSha === "fbb03eb4e0a91a33454763f3825545744bb39da267f472ac28e564b1a4945f7f9") {
  console.error("Zaten uygulanmış (DÖNGÜ-26). Dosya değişmedi.");
  process.exit(2);
}

/* --- Yedek: yama öncesi birebir (idempotent guard'dan sonra, yazımdan önce) --- */
copyFileSync("app.js", "app.js.dongu26-oncesi.bak");
const bakSha = sha(readFileSync("app.js.dongu26-oncesi.bak"));
if (bakSha !== oncekiSha) { console.error("Yedek SHA uyuşmaz"); process.exit(1); }

let src = readFileSync("app.js", "utf8");
const assert = (cond, msg) => { if (!cond) { console.error("ASSERT: " + msg); process.exit(1); } };

/* --- Yama 1a: ölü hucreUst baş-harf üreticisi kaldırılır (grupUyeler korunur) --- */
const y1aEski = `        /* GRUP: grid hücresi dar → grup dersinde üye baş harfleri satırı (birebirde eski görünüm) */
        var grupUyeler = grupUyeEtiketleri(ders);
        var hucreUst = grupUyeler.length ? '<span class="text-[8.5px] font-bold text-slate-400">' + grupUyeler.map(function (a) { return esc(ilkHarfler(a)); }).join(" · ") + "</span>" : (sinif ? esc(sinif) : '');`;
const y1aYeni = `        /* DÖNGÜ-26: grup dersinde TÜM üye tam adları hücrede okunur (hover gerektirmez);
           birebirde eski görünüm birebir korunur. Eski ölü hucreUst (baş harf, hiç kullanılmıyordu) kaldırıldı. */
        var grupUyeler = grupUyeEtiketleri(ders);`;
assert(src.includes(y1aEski), "Yama 1a eski blok bulunamadı");
src = src.replace(y1aEski, y1aYeni);

/* --- Yama 1b: hücre yazımına üye satırı eklenir (yalnız grupUyeler.length'te) --- */
const y1bEski = `          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) + '</td>'; /* DERS-KARTI-TASIMA-YAMASI: haftalik hücreden kart butonu kaldırıldı — ders listesi ISLEM alanına taşındı */`;
const y1bYeni = `          birebirHucreHTML(ders, ogrenci, ogrenciAd, sinif, durumRenk) +
          (grupUyeler.length ? '<div class="text-[9px] font-semibold text-slate-500 leading-snug break-words mt-0.5" title="Grup üyeleri">' + grupUyeler.map(function (a) { return esc(a); }).join(", ") + '</div>' : '') + '</td>'; /* DÖNGÜ-26: grup üyeleri TAM AD, alt satır sarımlı; birebirde eklenmez. DERS-KARTI-TASIMA-YAMASI: haftalik hücreden kart butonu kaldırıldı — ders listesi ISLEM alanına taşındı */`;
assert(src.includes(y1bEski), "Yama 1b eski blok bulunamadı");
src = src.replace(y1bEski, y1bYeni);

/* --- Yama 2: istekBurak — grup üyeleri ders kaydına taşınır --- */
const y2Eski = `  // Dersi planla
  DB.dersler.push({
    id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: r.dersId, konu: r.konu || "",
    ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
    durum: "planlandi", olusturma: todayKey()
  });`;
const y2Yeni = `  // Dersi planla
  /* DÖNGÜ-26: GRUP istekte tüm üyeler ders kaydına taşınır (ogrenciIds = ana dışı ek üyeler);
     tekli istekte akış birebir eski hâl — ogrenciIds YAZILMAZ. İstek sahibi (ogrenciId) ve diğer alanlar aynen. */
  var _d26Ekler = (Array.isArray(r.ogrenciIds) ? r.ogrenciIds.slice() : []);
  var _d26Yeni = {
    id: uid(), ogrenciId: o.id, ogrenciAd: o.ad, dersId: r.dersId, konu: r.konu || "",
    ogretmenId: t.id, ogretmenAd: t.ad, tarih: tarih, saat: saat, kod: ksKodOf(saat),
    durum: "planlandi", olusturma: todayKey()
  };
  if (_d26Ekler.length) _d26Yeni.ogrenciIds = _d26Ekler;
  DB.dersler.push(_d26Yeni);`;
assert(src.includes(y2Eski), "Yama 2 eski blok bulunamadı");
src = src.replace(y2Eski, y2Yeni);

/* --- Yama 3: formaAktar sonuna renderHavuz() --- */
const y3Eski = `  toast("İstek planlama formuna aktarıldı. Tarih ve saati seçip kaydedin.");
}`;
assert(src.includes(y3Eski), "Yama 3 eski blok bulunamadı");
src = src.replace(y3Eski, `  toast("İstek planlama formuna aktarıldı. Tarih ve saati seçip kaydedin.");
  renderHavuz(); /* DÖNGÜ-26: havuz kartı anında tazelenir — eski hâliyle takılı kalmaz */
}`);

writeFileSync("app.js", src);
const yeniSha = sha(readFileSync("app.js"));
console.log("DÖNGÜ-26 yaması uygulandı.");
console.log("app.js  önce: " + oncekiSha);
console.log("app.js  sonra: " + yeniSha);
console.log("yedek: app.js.dongu26-oncesi.bak (" + bakSha + ")");
