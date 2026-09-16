import fs from "node:fs";
const lines = fs.readFileSync("app.js", "utf8").split("\n");
const L = lines[1243];
/* JS tokenizer simülasyonu: satır başında state null.
   sq: ' ile açılır, \' kaçar, ' kapanır. dq benzer.
   Ama içinde " olan sq string JS'te GEÇERLİ — bu yüzden tokenizer doğru olanda
   '<p class="text-[12.5px] text-slate-600"><b>' sq-string (2 dq içerir, sorun yok),
   sonra " ek ders</b> ... </p> ' + — dq-string AÇILIR ama kapanmadan satır bitiyor.
   Beklenen: dq-string '</p>' den ÖNCE kapanmalı; yani ...kategoridir.</p>" yapılmalı. */
console.log("şüpheli bölge:", JSON.stringify(L.slice(95, 199)));
