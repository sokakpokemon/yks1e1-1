/* mutasyon-dongu13.mjs — DÖNGÜ-13 kanıt zinciri
   YALNIZ app.js geçici kopya üzerinden değiştirilir; test dosyaları/manifestler ASLA dokunulmaz
   (önce/sonra SHA'ları kanıt bloğunda basılır).
   MUT-A: sınıf kartı segmentine MATEMATİK sızdır → denetim süiti E2 KIRMIZI
   MUT-B: PNG tablosu saat başlık üretimini boz → denetim süiti E4 KIRMIZI
   MUT-C: ad hücresinde buton 2× çiz → denetim süiti B1 KIRMIZI
   MUT-D: rozet üretimine " (n)" sayı eki ekle → denetim süiti A3/A4/A6 KIRMIZI
          (bu mutasyon kırmızı vermezse A-serisi sayı-eki yasağını ZORLAMIYOR → DUR raporu)
   A-SERİSİ CANLI KANIT: gerçek DB fixture → gerçek dersKartiOgrtGunlukHTML → rozet
   HTML'DEN AYRIŞTIRILARAK (koddan değil) yazdırılır. */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const BEFORE = sha("app.js");
copyFileSync("app.js", "/tmp/app-d13-oncesi.js");

/* ---- 0) Mutasyon ÖNCESİ test-tarafı SHA kanıtı ---- */
const testTarafi = ["ks-ogrt-denetim.mjs", "suit-manifest.mjs", "elle-vaka-adlari.mjs", "elle-vaka-manifesti.mjs", "suit-vakalar/ks-ogrt-denetim.mjs.txt", "ks-ogrt-ders-karti.mjs", "suit-vakalar/ks-ogrt-ders-karti.mjs.txt"];
const onceSha = Object.fromEntries(testTarafi.map(f => [f, sha(f)]));
console.log("=== MUTASYON ÖNCESİ test-tarafı SHA-256 ===");
for (const [f, s] of Object.entries(onceSha)) console.log(s + "  " + f);

const mutasyonlar = [
  {
    ad: "MUT-A: sınıf kartı segmentine MATEMATİK sızdırılır",
    uygula: (s) => s.replace('esc(r.sinif) + "</div>" + cakismaRozeti + "</div>";', 'esc(r.sinif) + " MATEMATİK</div>" + cakismaRozeti + "</div>";'),
    hedefAdlar: ["E2"],
  },
  {
    ad: "MUT-B: PNG tablosu saat başlık üretimi bozulur (08:50 → 08:51, ayraç boşluğu silinir)",
    uygula: (s) => s.replace(
      "'<div style=\"font-size:11px;font-weight:800;color:#475569\">' + k.no + \" \\u00b7 \" + k.b + \"</div>\" +",
      "'<div style=\"font-size:11px;font-weight:800;color:#475569\">' + k.no + \" \\\\u00b7\" + (k.b === \"08:50\" ? \"08:51\" : k.b) + \"</div>\" +"
    ),
    hedefAdlar: ["E4"],
  },
  {
    ad: "MUT-C: ad hücresinde buton iki kez çizilir",
    uygula: (s) => s.replace(
      "(ogrtId && ogrtGunlukSatirVar ? dersKartiOgrtGunlukBtnHTML(ogrtId, gunKey) : \"\") + '</td>';",
      "(ogrtId && ogrtGunlukSatirVar ? dersKartiOgrtGunlukBtnHTML(ogrtId, gunKey) + dersKartiOgrtGunlukBtnHTML(ogrtId, gunKey) : \"\") + '</td>';"
    ),
    hedefAdlar: ["B1"],
  },
  {
    ad: "MUT-D: rozet metnine ' (n)' sayı eki eklenir (eski format geri gelir)",
    uygula: (s) => s.replace(
      'var rozet = !satirlar.length ? "Planlandı" : (tamam === satirlar.length ? "Yapıldı" : (tamam > 0 ? "Kısmen tamamlandı" : "Planlandı"));',
      'var rozet = !satirlar.length ? "Planlandı (0)" : (tamam === satirlar.length ? "Yapıldı (" + tamam + ")" : (tamam > 0 ? "Kısmen tamamlandı (" + tamam + ")" : "Planlandı (" + satirlar.length + ")"));'
    ),
    hedefAdlar: ["A1", "A3", "A4", "A6"],
  },
];

let hepsiKirmizi = true;
for (const m of mutasyonlar) {
  const orijinal = readFileSync("/tmp/app-d13-oncesi.js", "utf8");
  const mut = m.uygula(orijinal);
  if (mut === orijinal) { console.error("MUTASYON ANKORU BULUNAMADI: " + m.ad); hepsiKirmizi = false; continue; }
  writeFileSync("app.js", mut);
  const r = spawnSync(process.execPath, ["ks-ogrt-denetim.mjs"], { encoding: "utf8" });
  const cikti = r.stdout || "";
  const kirmizilar = cikti.split("\n").filter(l => l.includes("✗"));
  const hedefKirmizi = m.hedefAdlar.every(a => kirmizilar.some(l => l.includes("✗ " + a)));
  const exit1 = r.status === 1;
  console.log("\n=== " + m.ad + " ===");
  console.log("hedef(" + m.hedefAdlar.join("+") + ") kırmızı=" + hedefKirmizi + " · exit=" + r.status);
  for (const k of kirmizilar) console.log("  HAM: " + k.trim());
  if (!hedefKirmizi || !exit1) { hepsiKirmizi = false; console.log("  !! BEKLENMEDİK SONUÇ"); }
  copyFileSync("/tmp/app-d13-oncesi.js", "app.js");
  const shaRestore = sha("app.js");
  console.log("restore SHA=" + shaRestore + (shaRestore === BEFORE ? " (BİREBİR)" : " (UYUŞMAZLIK!)"));
  if (shaRestore !== BEFORE) hepsiKirmizi = false;
}

/* ---- 1) Mutasyon SONRASI test-tarafı SHA kanıtı ---- */
console.log("\n=== MUTASYON SONRASI test-tarafı SHA-256 (önceyle birebir olmalı) ===");
let testTarafiDegismedi = true;
for (const f of testTarafi) {
  const s = sha(f);
  const ok = s === onceSha[f];
  if (!ok) testTarafiDegismedi = false;
  console.log(s + "  " + f + (ok ? "  ✓ aynı" : "  ✗ DEĞİŞTİ"));
}
console.log("Test tarafı değişmedi: " + (testTarafiDegismedi ? "KANITLANDI" : "İHLAL!"));

/* ---- 2) A-SERİSİ CANLI KANIT: rozet HTML'DEN ayrıştırılır (koddan değil) ---- */
console.log("\n=== A-SERİSİ: fixture → gerçek HTML → HTML'den ayrıştırılmış rozet ===");
const html = readFileSync("index.html", "utf8");
const appKaynak = readFileSync("app.js", "utf8");
const scripts = [appKaynak, ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])].join("\n;\n");
const store = {};
globalThis.tailwind = {};
globalThis.window = { crypto: { randomUUID: () => "id-" + Math.random() }, addEventListener() {}, open() {}, location: { hostname: "x" } };
const reg = new Map();
function yapEl(id) {
  const e = { id: id || "", tagName: "DIV", value: "", options: [], _t: "", style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, remove() {}, click() {}, addEventListener() {}, querySelectorAll: () => [], getContext: () => null };
  Object.defineProperty(e, "innerHTML", { get() { return this._t; }, set(v) { this._t = String(v); [...String(v).matchAll(/id="([^"]+)"/g)].forEach(m => { if (!reg.has(m[1])) yapEl(m[1]); }); } });
  reg.set(id, e); return e;
}
for (const m of html.matchAll(/id="([^"]+)"/g)) yapEl(m[1]);
globalThis.document = { getElementById: i => reg.get(i) || null, addEventListener() {}, createElement: () => yapEl("a" + Math.random()), body: { appendChild() {}, removeChild() {} }, querySelectorAll: () => [] };
globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; }, clear: () => {} };
globalThis.Chart = function () { this.destroy = () => {}; };
if (!globalThis.navigator) globalThis.navigator = {};
const P = new Function(scripts + "\n yenile(); return { DB, dersKartiOgrtGunlukHTML };")();
const { DB, dersKartiOgrtGunlukHTML } = P;
const gelecekGun = (dw) => { const d = new Date(); do { d.setDate(d.getDate() + 1); } while (d.getDay() !== dw); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const gunA = gelecekGun(2);
const gunNoA = (new Date(gunA + "T12:00:00").getDay() + 6) % 7;
const SAAT = { "1": "08:50", "2": "09:40", "3": "10:30", "4": "11:20", "5": "13:00", "6": "13:50", "7": "14:40", "8": "15:30", "9": "16:20", "10": "17:10", "11": "18:00" };
const ogrt = DB.ogretmenler.find(o => o.ad === "SONER AÇIKGÖZ") || DB.ogretmenler[0];
const ogr = DB.ogrenciler.find(o => o.ad === "Ayşe Demir") || DB.ogrenciler[0];
ogrt.avail = ogrt.avail || { sinif: {}, musait: [] };
ogrt.avail.sinif = ogrt.avail.sinif || {};
ogrt.avail.musait = Array.isArray(ogrt.avail.musait) ? ogrt.avail.musait : [];
const SLOT = "1";
const __yedek = Object.assign({}, ogrt.avail.sinif);
const sifirla = () => { for (const k of Object.keys(ogrt.avail.sinif)) delete ogrt.avail.sinif[k]; };
const geri = () => { sifirla(); Object.assign(ogrt.avail.sinif, __yedek); };
const ekle = (over) => DB.dersler.push(Object.assign({ id: "d13-" + Math.random().toString(36).slice(2, 8), donemId: DB.aktifDonemId, ogrenciId: ogr.id, ogrenciAd: ogr.ad, dersId: "mat", konu: "Limit ve Süreklilik", ogretmenId: ogrt.id, ogretmenAd: ogrt.ad, tarih: gunA, saat: SAAT["5"], durum: "planlandi", olusturma: "2026-09-01" }, over));
const ayristir = (h) => { const m = h.match(/border-radius:99px">([^<]+)</); return m ? m[1] : "(AYRIŞTIRILAMADI)"; };
const temizle = () => { DB.dersler = DB.dersler.filter(l => l.tarih !== gunA); };
const senaryolar = [
  ["A3", "yalnız TAMAMLANMIŞ birebir", () => ekle({ durum: "tamamlandi" })],
  ["A4", "SINIF DERSİ + tamamlanmış birebir", () => { ogrt.avail.sinif[gunNoA + "-" + SLOT] = "CANLI-SNF"; ekle({ durum: "tamamlandi" }); }],
  ["A5", "planlı + tamamlanmış birebir", () => { ekle({}); ekle({ durum: "tamamlandi", saat: SAAT["6"] }); }],
  ["A1", "yalnız sınıf dersi", () => { ogrt.avail.sinif[gunNoA + "-" + SLOT] = "CANLI-SNF"; }],
];
for (const [ad, tarifi, kur] of senaryolar) {
  temizle(); sifirla(); kur();
  const h = dersKartiOgrtGunlukHTML(ogrt.id, gunA);
  const rozet = ayristir(h);
  console.log(ad + " [" + tarifi + "]\n  girdi: tarih=" + gunA + " slot=" + SLOT + " satır kurulumu yukarıda\n  HTML → ayrıştırılmış rozet: \"" + rozet + "\"");
  temizle(); sifirla(); geri();
}

/* ---- 3) Son doğrulama ---- */
const r = spawnSync(process.execPath, ["ks-ogrt-denetim.mjs"], { encoding: "utf8" });
const sonuc = r.status === 0 && (r.stdout || "").includes("HEPSİ GEÇTİ");
console.log("\nRestore sonrası normal koşum: exit=" + r.status + " yeşil=" + sonuc);
console.log("app.js final SHA=" + sha("app.js"));
const tamKapatma = hepsiKirmizi && testTarafiDegismedi && sonuc && sha("app.js") === BEFORE;
console.log(tamKapatma ? "\nDÖNGÜ-13 KANIT ZİNCİRİ: TAMAM" : "\nDÖNGÜ-13 KANIT ZİNCİRİ: EKSİK — DUR");
process.exit(tamKapatma ? 0 : 1);
