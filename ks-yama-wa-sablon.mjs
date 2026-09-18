/* ks-yama-wa-sablon.mjs — WhatsApp Mesaj Şablonu yaması (idempotent, assert'li)
   - DB.ayarlar.whatsappSablon: { baslik, giris, kapanis, imza } TEK şablon nesnesi.
   - Ayarlar & Yedekleme ekranına "WhatsApp Mesaj Şablonu" bölümü (ayarTab içinde).
   - ogrenciMesajMetni: ders listesi + 👥 satırı KODDAN üretilmeye devam eder;
     yalnızca açılış (giris), pencere başlığı (baslik), kapanış ve imza ayarlardan gelir.
   - Boş/null/undefined ayar alanında bugünkü hardcoded metin byte-birebir varsayılan.
   - waUrl/waAc/waGonder/waSatir/waKopyalaMesaj akışı KORUNUR; listeMetni/ekListeMetni DOKUNULMAZ. */
import { readFileSync, writeFileSync } from "node:fs";

const F = "app.js";
const src = readFileSync(F, "utf8");
const say = (h, n) => h.split(n).length - 1;
const fail = (m) => { console.error("ASSERT FAIL: " + m); process.exit(1); };

const MARK = "WA-SABLON-YAMASI";
if (src.includes(MARK)) { console.log("Zaten uygulanmış"); process.exit(2); }

/* ---- 1) Eski dönüş satırı tam 1 kez ---- */
const eskiDonus =
  '  return "Merhaba " + o.ad + "! 👋\\n\\n📚 " + pencereAdi() + " birebir ders programın:\\n\\n" + satirlar.join("\\n") + "\\n\\nDerslerimize zamanında katılmayı unutma. İyi çalışmalar! 🎓\\n— YKS Birebir Takip";\n';
if (say(src, eskiDonus) !== 1) fail("ogrenciMesajMetni dönüş satırı tam 1 kez bulunamadı");

const yeniDonus =
  "  /* " + MARK + ": metin parçaları DB.ayarlar.whatsappSablon'dan; boşsa bugünkü varsayılan byte-birebir. */\n" +
  '  var sab = (DB.ayarlar && DB.ayarlar.whatsappSablon && typeof DB.ayarlar.whatsappSablon === "object") ? DB.ayarlar.whatsappSablon : {};\n' +
  '  function sabDeger(alan, varsayilan) { var v = sab[alan]; return (v == null ? "" : String(v)).trim() !== "" ? v : varsayilan; }\n' +
  '  var giris = sabDeger("giris", "Merhaba " + o.ad + "! 👋");\n' +
  '  var baslik = sabDeger("baslik", "📚 " + pencereAdi() + " birebir ders programın:");\n' +
  '  var kapanis = sabDeger("kapanis", "Derslerimize zamanında katılmayı unutma. İyi çalışmalar! 🎓");\n' +
  '  var imza = sabDeger("imza", "— YKS Birebir Takip");\n' +
  '  var dersSayisi = satirlar.length;\n' +
  '  function yerTutucu(metin) {\n' +
  '    return String(metin).replace(/\\{(ogrenciAdi|pencereAdi|dersSayisi)\\}/g, function (_, ad) {\n' +
  '      if (ad === "ogrenciAdi") return o.ad;\n' +
  '      if (ad === "pencereAdi") return pencereAdi();\n' +
  '      return String(dersSayisi);\n' +
  '    });\n' +
  '  }\n' +
  '  return yerTutucu(giris) + "\\n\\n" + yerTutucu(baslik) + "\\n\\n" + satirlar.join("\\n") + "\\n\\n" + yerTutucu(kapanis) + "\\n" + yerTutucu(imza);\n';
let out = src.replace(eskiDonus, yeniDonus);
if (out === src) fail("dönüş değişikliği üretilemedi");
if (say(out, eskiDonus) !== 0) fail("eski dönüş satırı hâlâ duruyor");

/* ---- 2) ayarTab içine şablon bölümü: bilinen son kart kapanışından önce ---- */
const eskiKart =
  '      \'<p class="text-[10.5px] text-slate-400 mt-3"><i class="fa-solid fa-shield-halved mr-1"></i>Sıfırlamadan önce mutlaka yedek alın.</p>\' +\n' +
  '    "</div>" + csvYonetimKartHTML() + "</div>";\n';
if (say(src, eskiKart) !== 1) fail("ayarTab hedef bloğu tam 1 kez bulunamadı");

const yeniKart =
  '      \'<p class="text-[10.5px] text-slate-400 mt-3"><i class="fa-solid fa-shield-halved mr-1"></i>Sıfırlamadan önce mutlaka yedek alın.</p>\' +\n' +
  '    "</div>" + waSablonKartHTML() + csvYonetimKartHTML() + "</div>";\n';
let out2 = out.replace(eskiKart, yeniKart);
if (out2 === out) fail("ayarTab değişikliği üretilemedi");

/* ---- 3) Şablon bölümü + kaydet fonksiyonu: ayarTab'dan hemen önce ---- */
const sablonBlogu = [
  "/* " + MARK + ": WhatsApp Mesaj Şablonu — TEK nesne DB.ayarlar.whatsappSablon; yeni localStorage anahtarı YOK. */",
  "var WA_SABLON_ALANLAR = [",
  "  [\"baslik\", \"Pencere başlığı\", \"Ders listesinden önceki başlık satırı. Yer tutucular: {pencereAdi}, {dersSayisi}\"],",
  "  [\"giris\", \"Açılış\", \"Öğrenciye hitap. Yer tutucular: {ogrenciAdi}, {pencereAdi}, {dersSayisi}\"],",
  "  [\"kapanis\", \"Kapanış\", \"Ders listesinden sonraki kapanış cümlesi. Yer tutucular: {ogrenciAdi}, {pencereAdi}, {dersSayisi}\"],",
  "  [\"imza\", \"İmza\", \"Son satır. Yer tutucular: {ogrenciAdi}, {pencereAdi}, {dersSayisi}\"]",
  "];",
  "function waSablonVarsayilan() { return { baslik: \"\", giris: \"\", kapanis: \"\", imza: \"\" }; }",
  "function waSablonKaydet() {",
  "  if (!DB.ayarlar || typeof DB.ayarlar !== \"object\") DB.ayarlar = {};",
  "  var sab = {};",
  "  WA_SABLON_ALANLAR.forEach(function (a) {",
  "    var el = document.getElementById(\"wa-sablon-\" + a[0]);",
  "    sab[a[0]] = el && el.value != null ? el.value : \"\";",
  "  });",
  "  DB.ayarlar.whatsappSablon = sab;",
  "  saveDB();",
  "  toast(\"WhatsApp mesaj şablonu kaydedildi ✓\");",
  "}",
  "function waSablonKartHTML() {",
  "  var sab = (DB.ayarlar && DB.ayarlar.whatsappSablon && typeof DB.ayarlar.whatsappSablon === \"object\") ? DB.ayarlar.whatsappSablon : {};",
  "  var deger = function (alan) {",
  "    var v = sab[alan];",
  "    return v == null ? \"\" : String(v).replace(/&/g, \"&amp;\").replace(/\"/g, \"&quot;\").replace(/</g, \"&lt;\");",
  "  };",
  "  var kutular = WA_SABLON_ALANLAR.map(function (a) {",
  "    return '<div><label for=\"wa-sablon-' + a[0] + '\" class=\"text-[11.5px] font-bold text-slate-600 block mb-1\">' + a[1] + '</label>' +",
  "      '<textarea id=\"wa-sablon-' + a[0] + '\" rows=\"2\" class=\"w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px] text-slate-700 focus:border-teal-400 focus:outline-none\">' + deger(a[0]) + '</textarea>' +",
  "      '<p class=\"text-[10px] text-slate-400 mt-1\">' + a[2] + '</p></div>';",
  "  }).join(\"\");",
  "  return '<div class=\"rounded-2xl border border-slate-100 p-5 mb-4\">' +",
  "    '<div class=\"w-11 h-11 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center text-lg mb-3\"><i class=\"fa-brands fa-whatsapp\"></i></div>' +",
  "    '<h4 class=\"text-[14px] font-bold text-slate-900\">WhatsApp Mesaj Şablonu</h4>' +",
  "    '<p class=\"text-[12px] text-slate-500 mt-1.5 leading-relaxed\">Öğrenci bilgilendirme mesajının metin parçalarını düzenleyebilirsiniz. Ders listesi ve grup üyeleri (&#128101;) koddan otomatik üretilir. <b>Yer tutucular:</b> {ogrenciAdi}, {pencereAdi}, {dersSayisi} — bilinmeyen yer tutucular olduğu gibi kalır. Bir alanı <b>boş bırakırsanız varsayılan metin</b> kullanılır.</p>' +",
  "    '<div class=\"grid grid-cols-1 md:grid-cols-2 gap-3 mt-4\">' + kutular + '</div>' +",
  "    '<button onclick=\"waSablonKaydet()\" class=\"rounded-full bg-green-500 hover:bg-green-600 text-white text-[13px] font-bold px-5 py-2.5 shadow-sm transition-colors mt-4\"><i class=\"fa-solid fa-floppy-disk mr-1.5\"></i>Şablonu Kaydet</button>' +",
  "    '<span id=\"waSablonMesaj\" class=\"text-[11.5px] text-slate-400 ml-3\"></span>' +",
  "  '</div>';",
  "}",
  "",
].join("\n");

const eskiBaslik = "/* ---- Ayarlar & Yedekleme ---- */\nfunction ayarTab() {";
if (say(out2, eskiBaslik) !== 1) fail("ayarTab başlığı tam 1 kez bulunamadı");
const out3 = out2.replace(eskiBaslik, sablonBlogu + eskiBaslik);

writeFileSync(F, out3);

/* ---- Doğrulama ---- */
const chk = readFileSync(F, "utf8");
[ "function waSablonKartHTML()", "function waSablonKaydet()", "DB.ayarlar.whatsappSablon", MARK ].forEach((n) => { if (!chk.includes(n)) fail("yazılmadı: " + n); });
if (say(chk, "function ogrenciMesajMetni(ogrenciId)") !== 1) fail("ogrenciMesajMetni etkilendi");
if (say(chk, "function waUrl(") !== 1 || say(chk, "function waGonder(") !== 1 || say(chk, "function waSatir(") !== 1 || say(chk, "function waKopyalaMesaj(") !== 1) fail("wa akışı etkilendi");
if (say(chk, "function listeMetni(") !== 1) fail("listeMetni etkilendi");
if (!chk.includes('"\\n   👥 " + uyeler.join(", ")')) fail("👥 satırı etkilendi");
console.log("OK: WhatsApp Mesaj Şablonu yaması uygulandı");
