/* ks-yama-kart-sirasi.mjs — KART-SIRASI-YAMASI (idempotent, assert'li)
   İş: Planlama ekranındaki iki kartın görünen sırasını değiştir:
     1) Üstte: Birebir Ders Planla (#planKart — index.html statik)
     2) Altta: Öğrenci Birebir İstek Havuzu (#havuzBolum — boş section, renderHavuz() innerHTML yazar)
   Yöntem: index.html'de havuz bölümünün yorum+section bloğu planKart'ın kapanışından
   hemen sonraya taşınır. Hiçbir fonksiyon, id, handler, veri modeli değişmez.
   2. koşu: dosyaya dokunmadan exit 2 + "Zaten uygulanmış". */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const F = "index.html";
const once = readFileSync(F, "utf8");

const fail = (m) => { console.error("HATA: " + m); process.exit(1); };

const satir = '  <section id="havuzBolum" class="no-print"></section>';
const yorum = '  <!-- ============ 3) İSTEK HAVUZU ============ -->';
const blok = yorum + "\n" + satir;

if (once.split(satir).length - 1 !== 1) fail("havuzBolum satırı tam 1 kez bulunmalı");
if (!once.includes(blok)) fail("havuz bloğu (yorum+section) exact bulunamadı");

/* planKart kapanışı: <section id="planKart" başlangıcından sonraki ilk </section> */
const planBas = once.indexOf('<section id="planKart"');
const cakismaIdx = once.indexOf('id="cakismaUyari"');
if (planBas === -1 || cakismaIdx === -1) fail("planKart/cakismaUyari bulunamadı");
const planBlok = once.slice(planBas, once.indexOf("</section>", cakismaIdx) + "</section>".length);
const pk = planBas + planBlok.length; /* planKart bloğunun biti (absolute) */

/* İdempotans: yama zaten uygulanmışsa reddet */
const havuzIdx = once.indexOf(satir);
if (havuzIdx > pk) {
  console.log("Zaten uygulanmış — havuzBolum zaten planKart'tan sonra. Dosyaya dokunulmadı.");
  process.exit(2);
}

/* Yama: "\n\n" + blok + "\n\n" çevresinde bloğu kes, planKart kapanışından sonra ekle */
const blokBas = once.indexOf(blok);
const blokSon = blokBas + blok.length;
/* blok + öncesindeki "\n" (öncesinde zaten bir "\n" var: "\n\n  <!--" → ilk \n kalsın) */
const silinecek = once.slice(blokBas - 1, blokSon); /* "\n" + blok */
if (once[blokBas - 1] !== "\n") fail("blok öncesi \\n bekleniyordu");
const silinmis = once.slice(0, blokBas - 1) + once.slice(blokSon);
if (silinmis.includes(satir)) fail("silme eksik");

/* ekleme noktası: silinmiş metinde planKart kapanışı */
const planBas2 = silinmis.indexOf('<section id="planKart"');
const ci2 = silinmis.indexOf('id="cakismaUyari"');
const pk2 = silinmis.indexOf("</section>", ci2) + "</section>".length;
const sonuc = silinmis.slice(0, pk2) + "\n\n" + blok + silinmis.slice(pk2);

/* Assert'ler */
if (sonuc.split(satir).length - 1 !== 1) fail("sonuçta havuzBolum tam 1 kez");
const hi = sonuc.indexOf(satir);
if (!(hi > pk2)) fail("havuzBolum planKart kapanışından sonra değil");
if (!sonuc.includes(blok)) fail("blok birebir taşınmadı");
/* planKart içerik baytları değişmedi */
const planBlokYeni = sonuc.slice(planBas2, pk2);
if (planBlok !== planBlokYeni) fail("planKart içerik baytları değişti");
/* sıralama kanıtı: planKart < havuzBolum < derslerBolum */
const derslerIdx = sonuc.indexOf('<section id="derslerBolum"');
if (!(sonuc.indexOf('<section id="planKart"') < hi && hi < derslerIdx)) fail("beklenen sıra planKart → havuzBolum → derslerBolum değil");

writeFileSync(F, sonuc);
console.log("KART-SIRASI-YAMASI uygulandı.");
console.log("  öncesi SHA-256:", createHash("sha256").update(once).digest("hex"), "(" + once.length + " B)");
console.log("  sonrası SHA-256:", createHash("sha256").update(sonuc).digest("hex"), "(" + sonuc.length + " B)");
console.log("  yeni sıra: planKart (üstte) → havuzBolum (altta)");
