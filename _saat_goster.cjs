const fs = require("fs");
const P = "index.html";
let s = fs.readFileSync(P, "utf8");
function must(c, m) { if (!c) { console.error("FAIL: " + m); process.exit(1); } }
function rep(o, n, m) { must(s.indexOf(o) >= 0, m); s = s.split(o).join(n); }

// 1) saatGoster helper (slot index → "08:50-09:30")
must(s.indexOf("function slotIndexFromBilgi(slot)") >= 0, "helper anchor");
s = s.replace("function slotIndexFromBilgi(slot) { return SLOT_BILGI.indexOf(slot); }",
`function slotIndexFromBilgi(slot) { return SLOT_BILGI.indexOf(slot); }
// Kayıtlı slot indexini okunur saat aralığına çevirir ("0" → "08:50-09:30")
function saatGoster(v) {
  var raw = String(v == null ? "" : v);
  var i = raw.indexOf(":") >= 0 ? eskiSaatToSlot(v) : parseInt(raw, 10);
  var b = SLOT_BILGI[i];
  if (!b) return raw;
  return b.s + "-" + b.e;
}`);

// 2) düzenleme bannerı
rep('esc(l.ogrenciAd) + " · " + fmtTR(l.tarih) + " " + l.saat;',
    'esc(l.ogrenciAd) + " · " + fmtTR(l.tarih) + " " + saatGoster(l.saat);', "banner");

// 3) ana ders tablosu saat hücresi
rep(String.raw`style="font-variant-numeric:tabular-nums">' + esc(l.saat) + "</td>" +`,
    String.raw`style="font-variant-numeric:tabular-nums">' + esc(saatGoster(l.saat)) + "</td>" +`, "main table");

// 4) silme onay metni
rep('fmtTR(l.tarih) + " " + l.saat + " kaydı arşivden kaldırılacak."',
    'fmtTR(l.tarih) + " " + saatGoster(l.saat) + " kaydı arşivden kaldırılacak."', "delete dialog");

// 5) listeyi kopyala
rep('return fmtTR(l.tarih) + " " + l.saat + " | " + l.ogrenciAd + " | " + D.ad + " | "',
    'return fmtTR(l.tarih) + " " + saatGoster(l.saat) + " | " + l.ogrenciAd + " | " + D.ad + " | "', "copy list");

// 6) WhatsApp mesajı
rep('GUNLER[dowIdx(l.tarih)] + " • " + l.saat + " • " + l.ogretmenAd + durum;',
    'GUNLER[dowIdx(l.tarih)] + " • " + saatGoster(l.saat) + " • " + l.ogretmenAd + durum;', "whatsapp");

// 7) PNG raporu saat hücresi
rep(String.raw`'padding:7px 10px;font-size:11px;color:#475569;white-space:nowrap">' + l.saat + "</td>" +`,
    String.raw`'padding:7px 10px;font-size:11px;color:#475569;white-space:nowrap">' + saatGoster(l.saat) + "</td>" +`, "png report");

// 8) istekBurak toast'ları (saat parametresi slot index)
rep('toast("Ders taşındı ✓ " + o.ad + " · " + fmtTR(tarih) + " " + saat);',
    'toast("Ders taşındı ✓ " + o.ad + " · " + fmtTR(tarih) + " " + saatGoster(saat));', "toast tasi");
rep('toast("İstek takvime planlandı ✓ " + o.ad + " · " + fmtTR(tarih) + " " + saat);',
    'toast("İstek takvime planlandı ✓ " + o.ad + " · " + fmtTR(tarih) + " " + saatGoster(saat));', "toast burak");

fs.writeFileSync(P, s);
console.log("saatGoster patch OK");
