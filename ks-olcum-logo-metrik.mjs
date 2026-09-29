/* ks-olcum-logo-metrik.mjs — LOGO METRİK ÖLÇÜMÜ (D49 ADIM 1 kanıt aracı · SALT-OKUMA).
   Hiçbir proje dosyasını yazmaz/değiştirmez; yalnız okur ve sayı basar.

   NEDEN: ortamda tarayıcı/renderer YOK (chromium/chrome/firefox yok; jsdom/happy-dom/puppeteer/
   playwright node_modules'te yok) → gerçek getBoundingClientRect alınamaz. Bunun yerine logo
   geometrisi FONTUN KENDİSİNDEN ölçülür: kartın gömülü @font-face base64'ü ile
   vendor/fonts/montserrat-900-italic.woff2 birebir aynı dosyadır (sha16 7084156f0b371b85);
   WOFF2 (hmtx dönüşsüz) + head/hhea/maxp/cmap burada elle çözülür, 'formul' advance'ları
   ve turuncu çift çizginin / 'u' harfinin gerçek px konumları hesaplanır.

   D49 SONUCU: master × 0.2647 = kart eşitliği TÜM noktalarda ≤ 0.17 px → turuncu çizgiler
   ölçek-tutarlı, kanıtlanmış kusur YOK (bu yüzden D49'da çizgilere dokunulmadı). */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import zlib from "node:zlib";

const K = ["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];

function woff2(buf) {
  if (buf.toString("latin1", 0, 4) !== "wOF2") throw new Error("wOF2 değil");
  const numTables = buf.readUInt16BE(12), totalCompressedSize = buf.readUInt32BE(20);
  let p = 48;
  const oku = () => { let v = 0; for (let i = 0; i < 5; i++) { const b = buf[p++]; v = (v << 7) | (b & 0x7f); if (!(b & 0x80)) return v; } throw new Error("UIntBase128"); };
  const tab = [];
  for (let i = 0; i < numTables; i++) {
    const f = buf[p++];
    let tag;
    if ((f & 0x3f) === 0x3f) { tag = buf.toString("latin1", p, p + 4); p += 4; } else tag = K[f & 0x3f];
    const origLength = oku(), tv = (f >> 6) & 3;
    const gl = tag === "glyf" || tag === "loca";
    const donusumVar = gl ? tv === 0 : tv !== 0;
    const transformLength = donusumVar ? oku() : origLength;
    tab.push({ tag, origLength, transformLength, tv });
  }
  const ham = zlib.brotliDecompressSync(buf.subarray(p, p + totalCompressedSize));
  let off = 0; const H = {};
  for (const t of tab) { t.data = ham.subarray(off, off + t.transformLength); off += t.transformLength; H[t.tag] = t; }
  H.__dizin = tab;
  return H;
}

const app = readFileSync("app.js", "utf8");
const b64 = app.match(/@font-face\{font-family:MontsKart;[^}]*base64,([A-Za-z0-9+/=]+)/)[1];
const kartFont = Buffer.from(b64, "base64");
const vendorFont = readFileSync("vendor/fonts/montserrat-900-italic.woff2");
const sha = (b) => createHash("sha256").update(b).digest("hex").slice(0, 16);
console.log("KART fontu  :", kartFont.length, "B  sha16", sha(kartFont));
console.log("VENDOR fontu:", vendorFont.length, "B  sha16", sha(vendorFont), "| AYNI:", sha(kartFont) === sha(vendorFont));

const T = woff2(vendorFont);
console.log("dizin:", T.__dizin.map((t) => t.tag + "(" + t.origLength + ")").join(" "));
const unitsPerEm = T.head.data.readUInt16BE(18);
const numGlyphs = T.maxp.data.readUInt16BE(4);
const numberOfHMetrics = T.hhea.data.readUInt16BE(34);
console.log("unitsPerEm", unitsPerEm, "| numGlyphs", numGlyphs, "| numberOfHMetrics", numberOfHMetrics, "| hmtx tv", T.hmtx.tv);

const hmtx = T.hmtx.data, adv = [];
for (let i = 0; i < numberOfHMetrics; i++) adv.push(hmtx.readUInt16BE(i * 4));
while (adv.length < numGlyphs) adv.push(adv[adv.length - 1] || 0);

/* cmap */
const cmap = T.cmap.data, nSub = cmap.readUInt16BE(2);
let esles = null, secilen = "";
for (let i = 0; i < nSub; i++) {
  const off = cmap.readUInt32BE(4 + i * 8 + 4), fmt = cmap.readUInt16BE(off);
  if (fmt === 12 && !esles) {
    const nG = cmap.readUInt32BE(off + 12);
    esles = (c) => { let lo = 0, hi = nG - 1; while (lo <= hi) { const mid = (lo + hi) >> 1, o = off + 16 + mid * 12, s = cmap.readUInt32BE(o), e = cmap.readUInt32BE(o + 4), g = cmap.readUInt32BE(o + 8); if (c < s) hi = mid - 1; else if (c > e) lo = mid + 1; else return g + (c - s); } return 0; };
    secilen = "fmt12";
  } else if (fmt === 4 && !esles) {
    const segX2 = cmap.readUInt16BE(off + 6), seg = segX2 / 2, endO = off + 14, startO = endO + segX2 + 2, deltaO = startO + segX2, rangeO = deltaO + segX2;
    esles = (c) => { for (let s = 0; s < seg; s++) { const end = cmap.readUInt16BE(endO + s * 2); if (c > end) continue; const start = cmap.readUInt16BE(startO + s * 2); if (c < start) return 0; const delta = cmap.readInt16BE(deltaO + s * 2), ro = cmap.readUInt16BE(rangeO + s * 2); if (ro === 0) return (c + delta) & 0xffff; const gi = cmap.readUInt16BE(rangeO + s * 2 + ro + (c - start) * 2); return gi === 0 ? 0 : (gi + delta) & 0xffff; } return 0; };
    secilen = "fmt4";
  }
}
console.log("cmap:", secilen);

const metin = "formul";
const gid = [...metin].map((c) => esles(c.codePointAt(0)));
const advFu = gid.map((g) => adv[g] || 0);
const em = (v) => v / unitsPerEm;
console.log("\nharf → gid/advance(fu/em):", gid.map((g, i) => metin[i] + "=" + g + "/" + adv[g] + "(" + em(adv[g]).toFixed(4) + "em)").join("  "));
const cumFu = []; { let s = 0; for (const v of advFu) { cumFu.push(s); s += v; } }
console.log("toplam advance:", advFu.reduce((a, b) => a + b, 0), "fu =", em(advFu.reduce((a, b) => a + b, 0)).toFixed(4), "em");

/* 'u' = 5. harf (index 4) */
const uSolEm = em(cumFu[4]), uGenEm = em(advFu[4]);
console.log("'u' yatay aralık (em, layout advance tabanlı): sol", uSolEm.toFixed(4), "genişlik", uGenEm.toFixed(4), "sağ", (uSolEm + uGenEm).toFixed(4));

function geometri(ad, fsPx, lsPx, svgW, rightPx, topPx, pathler) {
  const emTop = em(advFu.reduce((a, b) => a + b, 0));
  const metinGen = emTop * fsPx;                     /* saf ilerleme genişliği (ink ~ aynı) */
  const divGen = metinGen + 6 * lsPx;                /* letter-spacing her harften SONRA */
  const olc = svgW / unitsPerEm * unitsPerEm / 100 * (100 / 100) * (svgW / 100) / (svgW / 100) * (svgW / 100); /* = svgW/100 */
  const k = svgW / 100;
  const svgSol = divGen - rightPx - svgW;
  const svgSag = divGen - rightPx;
  const u_sol = uSolEm * fsPx + 4 * lsPx;            /* 'u' öncesi 4 harf → 4 letter-spacing */
  const u_sag = u_sol + uGenEm * fsPx + lsPx;        /* 'u' advance + kendi letter-spacing'i */
  const cizgi = pathler.map(([x1, x2]) => [svgSol + x1 * k, svgSol + x2 * k]);
  const y = pathler ? [10 * k + topPx, 29 * k + topPx] : null;
  return { ad, fsPx, divGen: divGen.toFixed(2), svgSol: svgSol.toFixed(2), svgSag: svgSag.toFixed(2),
    u_sol: u_sol.toFixed(2), u_sag: u_sag.toFixed(2),
    cizgi1: cizgi[0].map((v) => v.toFixed(2)), cizgi2: cizgi[1].map((v) => v.toFixed(2)), y_cizgi: y, k: k.toFixed(4) };
}

const P = [[15, 95], [14, 94]];
const master = geometri("MASTER (8.5rem/136px, ls -4px, svgW 80, right 30, top 2)", 8.5 * 16, -4, 80, 30, 2, P);
const kart = geometri("KART   (2.25rem/36px, ls -1.05px, svgW 21, right 8, top 0.5)", 2.25 * 16, -1.05, 21, 8, 0.5, P);

console.log("\n=== " + master.ad + " ===");
console.log(JSON.stringify(master, null, 1));
console.log("\n=== " + kart.ad + " ===");
console.log(JSON.stringify(kart, null, 1));

/* ÖLÇEK TUTARLILIĞI: kart değerleri = master değerleri × 0.2647 ? */
const OLC = 0.2647;
console.log("\n=== MASTER × 0.2647 vs KART (px) ===");
const cift = [["div genişlik", +master.divGen, +kart.divGen], ["svg sol", +master.svgSol, +kart.svgSol], ["svg sağ", +master.svgSag, +kart.svgSag],
  ["'u' sol", +master.u_sol, +kart.u_sol], ["'u' sağ", +master.u_sag, +kart.u_sag],
  ["çizgi1 sol", +master.cizgi1[0], +kart.cizgi1[0]], ["çizgi1 sağ", +master.cizgi1[1], +kart.cizgi1[1]],
  ["çizgi2 sol", +master.cizgi2[0], +kart.cizgi2[0]], ["çizgi2 sağ", +master.cizgi2[1], +kart.cizgi2[1]]];
for (const [n, m, k] of cift) console.log(n.padEnd(12), "master", m.toFixed(2).padStart(8), "×0.2647 =", (m * OLC).toFixed(2).padStart(8), "| kart", k.toFixed(2).padStart(8), "| fark", (k - m * OLC).toFixed(2));

/* çizgiler 'u' üzerinde mi? */
console.log("\n=== ÇİZGİ ↔ 'u' KONUMU (kart, px) ===");
console.log("'u' aralığı      :", kart.u_sol, "→", kart.u_sag, " (genişlik", (+kart.u_sag - +kart.u_sol).toFixed(2) + ")");
console.log("çizgi1 (üst)     :", kart.cizgi1[0], "→", kart.cizgi1[1]);
console.log("çizgi2 (alt)     :", kart.cizgi2[0], "→", kart.cizgi2[1]);
console.log("çizgi1 sol farkı : ", (+kart.cizgi1[0] - +kart.u_sol).toFixed(2), "px  (0 = u'nun sol kenarında)");
console.log("çizgi1 sağ farkı : ", (+kart.cizgi1[1] - +kart.u_sag).toFixed(2), "px  (0 = u'nun sağ kenarında)");
console.log("çizgi uzunlukları: ", (+kart.cizgi1[1] - +kart.cizgi1[0]).toFixed(2), "/", (+kart.cizgi2[1] - +kart.cizgi2[0]).toFixed(2), "px");
console.log("dikey: çizgi1 y =", kart.y_cizgi[0], "çizgi2 y =", kart.y_cizgi[1], "px (marka kutusu tepesinden)");
