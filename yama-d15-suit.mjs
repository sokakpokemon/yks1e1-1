/* DÖNGÜ-15: geçici script — kalıcı dosyaya yazılacak DEĞİL. */
import { readFileSync, writeFileSync } from "node:fs";

/* 1) ks-ders-karti.mjs: exit-hook fail durumunda da marker basar (sayı birebir; fail yine exit=1) */
let s = readFileSync("ks-ders-karti.mjs", "utf8");
const O = 'process.on("exit", (c) => { if (c !== 0) return; if (__kosan !== 69) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ders-karti.mjs kosan=" + __kosan + " beklenen=69"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ders-karti.mjs:" + __kosan + ":69"); } });';
const N = 'process.on("exit", (c) => { if (c !== 0) { console.log("SUITE_DONE:ks-ders-karti.mjs:" + __kosan + ":69"); return; } if (__kosan !== 69) { console.error("SUITE_DONE UYUŞMAZLIĞI: ks-ders-karti.mjs kosan=" + __kosan + " beklenen=69"); process.exitCode = 1; } else { console.log("SUITE_DONE:ks-ders-karti.mjs:" + __kosan + ":69"); } });';
if (s.split(O).length - 1 !== 1) { console.error("eslesme hatasi 1: " + (s.split(O).length - 1)); process.exit(1); }
s = s.replace(O, N);
writeFileSync("ks-ders-karti.mjs", s);
console.log("YAMA-1 OK (ks-ders-karti.mjs exit-hook)");
