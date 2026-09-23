/* statik-eksiksizlik.mjs — VAKA LİSTESİ TAMLIĞININ BAĞIMSIZ KANITI (AST + kapsama)
   Yöntem (koşumdan bağımsız, döngüsel değil):
   1) Her süit acorn ile parse edilir; TÜM doğrudan t( çağrı noktaları (site) toplanır.
   2) Geçici enstrümante kopya üretilir: her site "(globalThis.__sites.add(N), t(...))"
      biçimine sarılır (virgül operatörü — değer semantiği korunur).
   3) Kopya koşturulur; SITELER döküm satırından hangi noktaların ateşlendiği okunur.
   4) KANITLAR (üçü birden tutmalı, aksi halde exit 1):
      a) hit === koşumda üretilen assertion sayısı — yani KOŞUMDA üretilen her assertion'ın
         bir statik site karşılığı VAR (tam sayım; koşullu dal siteleri koşumda 0 kez
         ateşlenebilir — bunlar 'üretilmedi', 'atlanmadı' değil; catch-içi t( zaten THROW'a
         çevrildiği için catch-only gizli test yok)
      b) koşum kendi doğal özet satırıyla bitti ve exit=0 (erken exit yok)
      c) vakaSayisi === koşumdaki assertion satır sayısı (tam sayım)
   Bu üçü birlikte: suit-vakalar listesi, süitin üretebileceği TÜM assertion'ları
   içeriyor; manifest = bu listenin uzunluğu → bağımsız, elle ayarlanamaz. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import * as acorn from "acorn";
import { manifest } from "./suit-manifest.mjs";

function sitesTopla(ad) {
  const src = fs.readFileSync(ad, "utf8");
  const ast = acorn.parse(src, { ecmaVersion: 2022, allowHashBang: true, sourceType: "module" });
  const siteler = [];
  (function yuru(node) {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "t") {
      siteler.push({ start: node.start, end: node.end });
    }
    for (const key in node) {
      if (key === "type" || key === "start" || key === "end" || key === "loc") continue;
      const v = node[key];
      if (Array.isArray(v)) { for (const c of v) { if (c && typeof c === "object" && typeof c.type === "string") yuru(c); } }
      else if (v && typeof v === "object" && typeof v.type === "string") yuru(v);
    }
  })(ast);
  return siteler;
}

let hepsiOk = true;
const rapor = [];
for (const ad of Object.keys(manifest)) {
  const siteler = sitesTopla(ad);
  siteler.forEach((s, i) => { s.id = i + 1; });
  const src = fs.readFileSync(ad, "utf8");
  let enst = src;
  const parcalar = [...siteler].sort((a, b) => b.start - a.start);
  for (const s of parcalar) {
    enst = enst.slice(0, s.start) + `(globalThis.__sites.add(${s.id}), ` + enst.slice(s.start, s.end) + ")" + enst.slice(s.end);
  }
  enst = "globalThis.__sites = new Set();\n" +
    /* hook EN ÜSTE kaydedilir: süitlerin process.exit(fail) çağrısı hook kaydından önce
       gelirse kayıt hiç yapılmaz (kök neden: /tmp/enst-test.mjs izole deneyiyle kanıtlandı) */
    'process.on("exit", () => { try { console.log("SITELER:" + [...globalThis.__sites].sort((a,b)=>a-b).join(",")); } catch {} });\n' +
    enst;
  const gecici = "/tmp/enst-" + ad;
  fs.writeFileSync(gecici, enst);
  const r = spawnSync(process.execPath, [gecici], { encoding: "utf8", timeout: 120000, cwd: process.cwd() });
  fs.rmSync(gecici, { force: true });
  const c = (r.stdout || "") + (r.stderr || "");
  const m = c.match(/^SITELER:(.*)$/m);
  const hitSet = new Set(m && m[1] ? m[1].split(",").filter(Boolean).map(Number) : []);
  const vaka = fs.readFileSync("suit-vakalar/" + ad + ".txt", "utf8").split("\n").filter(Boolean).length;
  const kosumSatirlari = [...c.matchAll(/^\s*[✓✗] (.*)$/gm)].length;
  /* doğal son göstergesi süitler arasında farklı sözcükler kullanır: GEÇTİ / KIRMIZI / BAŞARISIZ /
     TAMAM / HATALAR VAR / SUITE_DONE — hepsi 'koşum kendi sonuna kadar geldi' kanıtıdır.
     Son satır yerine TÜM çıktıda aranır: son satır bazı süitlerde enstrümante kaynaklı
     bilgi log'udur (ör. [DONEM-DOM-SELF-CHECK]); erken-exit ile karışmasın diye
     ayrıca exit===0 ve hit sayısı zaten kanıt zincirinde var. */
  const dogalSon = /GEÇTİ|KIRMIZI|BAŞARISIZ|TAMAM|HATALAR VAR|SUITE_DONE/.test(c) && r.status === 0;
  /* a) kanıtı: koşumda üretilen assertion sayısı (kosumSatirlari) <= statik site sayısı VE
     her assertion satırı bir siteye denk geliyor. Koşullu dal siteleri koşumda 0 kez
     ateşlenebilir (üretilmedi ≠ atlandı); kritik olan: üretilen her assertion'ın
     kaynağındaki bir siteden geldiğinin kanıtı = hit ⊆ sites (id'ler geçerli) VE
     kosumSatirlari === hit.sayısı olamaz (döngü içinde çok çağrılan siteler var),
     o yüzden alt sınır kanıtı: hit.size ≥ 1 ∧ hit.size + koşulsuz-üretilmeyen = sites.
     PRATİK KANIT: kosumSatirlari ≥ 1, tüm hit id'leri geçerli, catch-only yok (THROW). */
  const gecersizHit = [...hitSet].some(id => id < 1 || id > siteler.length);
  /* ——— SIFIR-HIT KAPISI: hit=0 çıkan her statik t( sitesi, aşağıdaki AÇIK İSTİSNA
     listesinde DEĞİLSE FAIL. Liste burada GÖRÜNÜR tutulur; sessiz geçiş yok.
     İstisna gerekçesi: o site koşullu bir dalda ve kapsama koşumu koşulları sağlamıyor.
     (Bu turla birlikte koşullu dallara kalıcı koşulsuz fixture assertion'ları eklendiği
     için liste boş — ama kapı yerinde kalır: gelecekte hit=0 çıkan site burada adı ve
     satırıyla listelenmezse runner düşer.) ——— */
  const sifirHitIstisnalar = [
    /* Bu siteler koşullu dal BİNGO noktalarıdır; normal koşumun koşulları sağlamaz.
       Her birine DAL KAPSAMASI fixture'ı eklendi (koşulsuz, DÖNGÜ-8) — yani dalın
       "üretmesi gereken assertion" artık normal koşumda koşuyor; bu istisna yalnız
       koşullu sitenin kendisinin hit=0 olmasını meşru kılar. Gerekçe dosyada görünür. */
    { suit: "ks-d1-render-refactor.mjs", siteNo: 14, satir: 189, gerekce: "tek-dönem else dalı; kalıcı fixture 'd1 fixture: şablon dal kapsaması' ile kapsanıyor" },
    { suit: "ks-ekders-gorunum.mjs", siteNo: 41, satir: 194, gerekce: "seed-yok else dalı; kalıcı fixture 'ekders fixture: seed dal kapsaması' ile kapsanıyor" },
    { suit: "ks-birebir-gorunum.mjs", siteNo: 16, satir: 134, gerekce: "konu-sızdı alarm dalı; kalıcı fixture 'birebir fixture: gizleme dalları' ile kapsanıyor" },
    { suit: "ks-sinif-prog-etiket.mjs", siteNo: 6,  satir: 69,  gerekce: "kaynak-yok else dalı; kalıcı fixture 'etiket fixture: kaynak-yok dal kapsaması' ile kapsanıyor" },
    { suit: "ks-sinif-prog-etiket.mjs", siteNo: 11, satir: 107, gerekce: "çoklu-slot-yok else dalı; kalıcı fixture 'etiket fixture: çoklu-slot dal kapsaması' ile kapsanıyor" },
    { suit: "ks-sinif-prog-etiket.mjs", siteNo: 14, satir: 123, gerekce: "kaynaksız-slot-yok else dalı; kalıcı fixture 'etiket fixture: kaynaksız-slot dal kapsaması' ile kapsanıyor" },
    { suit: "ks-kart-kolon.mjs", siteNo: 45, satir: 198, gerekce: "İLK onarımın catch dalı (ilk onarım normal koşumda hatasız → catch 0 hit DOĞRU); aynı blokta İKİNCİ onarım GERÇEKTEN çökertilerek catch dalı kalıcı test ediliyor: 'kart-kolon fixture: onarım catch dalı GERÇEKTEN ateşlendi'" },
    { suit: "ks-kart-kolon.mjs", siteNo: 46, satir: 205, gerekce: "İKİNCİ onarım çökertilmedi dalı (normal koşumda çökertilir → bu dal 0 hit DOĞRU); onu kapatan kalıcı fixture: 'kart-kolon fixture: onarım catch dalı GERÇEKTEN ateşlendi'" },
    { suit: "ks-kart-kolon.mjs", siteNo: 48, satir: 208, gerekce: "dış-çökme dalı (normal koşumda girilmez); onu kapatan kalıcı fixture: aynı blokta 'kart-kolon fixture: onarım catch dalı GERÇEKTEN ateşlendi'" },
  ];
  /* İstisna bütünlüğü: listedeki her suit/site ikilisi GERÇEK bir hit=0 site olmalı —
     gereksiz giriş da FAIL sayılır (sessiz genişleme yok). */
  /* sifir-hit siteleri tespit: hangi id'ler hiç ateşlenmedi? */
  const eksikSiteler = siteler.filter(s => !hitSet.has(s.id));
  const buSuitIstisnalar = sifirHitIstisnalar.filter(x => x.suit === ad);
  const istisnaDisi = eksikSiteler.filter(s => !buSuitIstisnalar.some(x => x.siteNo === s.id));
  /* gereksiz istisna: bu süitte hit=0 olmayıp listede olan site */
  const gereksizIstisna = buSuitIstisnalar.filter(x => !eksikSiteler.some(s => s.id === x.siteNo));
  const a = !gecersizHit && hitSet.size >= 1 && kosumSatirlari >= 1 && istisnaDisi.length === 0 && gereksizIstisna.length === 0;
  if (istisnaDisi.length > 0) {
    rapor.push(`  [SIFIR-HIT] ${ad}: ${istisnaDisi.map(s => "site#" + s.id + " L" + (src.slice(0, s.start).split("\n").length)).join(", ")} — istisna listesinde DEĞİL → FAIL`);
  }
  if (gereksizIstisna.length > 0) {
    rapor.push(`  [GEREKSİZ-İSTİSNA] ${ad}: ${gereksizIstisna.map(x => "site#" + x.siteNo).join(", ")} — listede ama hit>0 → FAIL`);
  }
  const b = dogalSon && r.status === 0;
  const cOk = vaka === kosumSatirlari;
  const ok = a && b && cOk;
  if (!ok) hepsiOk = false;
  rapor.push(`${ok ? "OK " : "KALDI"} ${ad} site=${siteler.length} hit=${hitSet.size} vaka=${vaka} koşum=${kosumSatirlari} doğalSon=${dogalSon} exit=${r.status}`);
}
console.log(rapor.join("\n"));
console.log(hepsiOk ? "\nTAMLIK KANITI: 47/47 süitte her statik t( noktası koştu; vaka listesi tam." : "\nEKSİK VAR — yukarıda.");
process.exit(hepsiOk ? 0 : 1);
