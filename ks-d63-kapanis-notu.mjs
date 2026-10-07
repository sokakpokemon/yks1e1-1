/* ks-d63-kapanis-notu.mjs — D63-CAKISMA-RAPORU kapanış kaydı (İDEMPOTENT).
   CHECKPOINT.md + CHECKPOINT-ARSIV-2.md içine D63 bloğunu YALNIZ bir kez ekler:
   marker zaten varsa hiçbir şey yazmaz. İki kez koşmak dosyayı değiştirmez. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const IMZA = "D63-CAKISMA-RAPORU";
const sha16 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);

const blok = "\n## " + IMZA + " — KAPANIS (Öğrenci Saat Çakışma Raporu · SALT-OKUMA)\n" +
  "- app.js SHA16: " + sha16("app.js") + "\n" +
  "- `cakismaRaporuBul()`: aktifDonemKayitlari(DB.dersler) (iptal hariç) · katılımcı = dersOgrenciIds (ana + grup üyeleri) · anahtar = ogrenciId|tarih|ksKodOf(saat) · 2+ kayıt → çakışma (öğretmen aynı olsa bile) · ek dersler (DB.ekDersler) rapora GİRMEZ · dönüş [{ ogrenciId, ad, tarih, saatKod, kayitlar }] · tarih↑ sonra ad↑ · DB'ye YAZMAZ\n" +
  "- `cakismaRaporuHTML()`: csvYonetimKartHTML() görsel diliyle aynı kart · başlık 'Öğrenci Saat Çakışma Raporu' · alt not birebir 'Salt-okuma ekran — hiçbir kaydı silmez veya değiştirmez.' · özet 'N çakışma · M öğrenci' (N=0 → yeşil 'Çakışma yok') · tüm adlar esc() · buton yok\n" +
  "- Kart, ayarTab() içinde csvYonetimKartHTML() çağrısının HEMEN SONRASINA eklendi (aynı '+' zinciri)\n" +
  "- Yeni suit: ks-cakisma-raporu.mjs 33 assertion (a-j davranışları + HTML sözleşmesi + ayarTab entegrasyonu) · toplam 58 suit / 2711\n" +
  "- Kanıt: node --check SYNTAX OK · copy-static 0 · guard 0 · --tam TAM_EXIT=0 (MANIFEST = RUNNER = donmuş = ELLE = 2711, BİREBİR)\n" +
  "- Damga/senkron: app.js?v=" + sha16("app.js") + " (index.html + dist/index.html + isolate/index.html) · kök = dist = public = isolate byte-birebir\n";

let yazilan = 0;
["CHECKPOINT.md", "CHECKPOINT-ARSIV-2.md"].forEach((f) => {
  if (!existsSync(f)) { console.log("ATLA (yok): " + f); return; }
  const s = readFileSync(f, "utf8");
  if (s.includes(IMZA)) { console.log("(zaten isaretli — atla) " + f); return; }
  writeFileSync(f, s.replace(/\s*$/, "") + "\n" + blok);
  yazilan++;
  console.log("+ kayit: " + f);
});
console.log("YAZILAN=" + yazilan + " · PAKET_EXIT=0");
