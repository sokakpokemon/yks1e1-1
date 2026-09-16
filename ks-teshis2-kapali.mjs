/* ks-teshis2-kapali.mjs — kapali hucre render davranışını birebir simüle eder */
function gridTablo(onclickOnce, avail, tip) {
  var availSinif = {};
  var g2 = 0;
  var key = g2 + "-1";
  var durum = tip === "ogretmen"
    ? ((avail.sinif && key in avail.sinif) ? "sinif" : avail.musait.indexOf(key) >= 0 ? "musait" : "")
    : (avail.indexOf(key) >= 0 ? "var" : "");
  return durum;
}
console.log("ogretmen avail='musait' içeriyor → durum:", JSON.stringify(gridTablo("x", { sinif: {}, musait: ["0-1"] }, "ogretmen")));
console.log("ogretmen avail.musait DİZİ değil (düz dizi) → durum:", JSON.stringify(gridTablo("x", ["0-1"], "ogretmen")));
