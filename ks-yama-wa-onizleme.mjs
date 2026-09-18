/* ks-yama-wa-onizleme.mjs — WA-ONIZLEME-YAMASI
   Tek iş: WhatsApp modalına ORTAK TEK mesaj onizleme paneli ekle.
   - Her öğrenci satırına "Önizle" butonu (waAc içindeki satır üretimine).
   - Modal içinde TEK panel: id="waOnizlemePanel" + <pre id="waOnizlemeMetin">.
   - waOnizle(ogrenciId): metni yalnızca ogrenciMesajMetni() ile alır, textContent ile basar.
   - Sıfırlama waAc()'de: placeholder "Önizlemek için bir öğrenci seçin".
   - waUrl/waGonder/waKopyalaMesaj/geciciKopyala/newline davranışı DEĞİŞMEZ.
   Idempotent: 2. koşuda "Zaten uygulanmış" der, exit 2, dosyaları değiştirmez. */
import { readFileSync, writeFileSync, copyFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const boy = (f) => statSync(f).size;

const ISARET = "WA-ONIZLEME-YAMASI";
let degisen = [];

/* --- idempotans kontrolü --- */
if (readFileSync("app.js", "utf8").includes(ISARET)) {
  console.log("Zaten uygulanmış (" + ISARET + " app.js'te mevcut) — hiçbir dosya değiştirilmedi.");
  process.exit(2);
}

function assertOk(kosul, mesaj) { if (!kosul) { console.error("ASSERT BAŞARISIZ: " + mesaj); process.exit(1); } }

/* --- yedekler (üzerine yazma: cp -n zaten yapıldı; burada yoksa al) --- */
for (const f of ["app.js", "index.html", "test.mjs"]) {
  const bak = f + ".wa-onizleme-oncesi.bak";
  if (!existsSync(bak)) copyFileSync(f, bak);
  console.log("Yedek:", bak, boy(bak) + " B", "sha256=" + sha(bak));
}

/* ================= app.js ================= */
let app = readFileSync("app.js", "utf8");

/* 1) waAc içindeki öğrenci satır üretimine Önizle butonu ekle
      (kopyala butonundan hemen önce; exact anchor). */
const kopyalaAnchor = "'<button onclick=\"waKopyalaMesaj(\\'' + s.id + '\\')\" title=\"Mesaj metnini kopyala\"";
assertOk(app.includes(kopyalaAnchor), "waAc kopyala butonu anchor bulunamadı");
const onizleBtn = "'<button onclick=\"waOnizle(\\'' + s.id + '\\')\" title=\"Mesaj önizlemesi\" class=\"w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors\"><i class=\"fa-regular fa-eye text-[12px]\"></i></button>' +\n        ";
app = app.replace(kopyalaAnchor, onizleBtn + kopyalaAnchor);
assertOk(app.includes(onizleBtn), "Önizle butonu eklenemedi");

/* 2) waAc sonunda panel sıfırlama: innerHTML yazımından hemen sonra */
const waAcSon = '  $("waIcerik").innerHTML = icerik;\n  $("waModal").classList.remove("hidden");\n}';
assertOk(app.includes(waAcSon), "waAc kapanış anchor bulunamadı");
app = app.replace(waAcSon,
  '  $("waIcerik").innerHTML = icerik;\n  /* ' + ISARET + ': modal her açılışta onizleme panelini placeholder\'a sıfırla (duplicate yok, tek panel) */\n  waOnizlemeSifirla();\n  $("waModal").classList.remove("hidden");\n}');

/* 3) Yeni fonksiyonlar: waKapat'tan hemen sonra ekle */
const waKapatAnchor = 'function waKapat() { $("waModal").classList.add("hidden"); }';
assertOk(app.includes(waKapatAnchor), "waKapat anchor bulunamadı");
const yeniFn = waKapatAnchor + `

/* ${ISARET}: Ortak tekil onizleme paneli (id sabit; mesaj metni ASLA burada yeniden üretilmez,
   yalnızca ogrenciMesajMetni(ogrenciId) çağrısıyla alınır ve textContent ile basılır —
   böylece emoji, satır sonları ve literal { } karakterleri birebir, HTML enjeksiyonu imkânsız). */
function waOnizle(ogrenciId) {
  var panel = document.getElementById("waOnizlemePanel");
  var metinKutu = document.getElementById("waOnizlemeMetin");
  var baslik = document.getElementById("waOnizlemeBaslik");
  if (!panel || !metinKutu) return;
  var o = DB.ogrenciler.find(function (x) { return x.id === ogrenciId; });
  var metin = ogrenciMesajMetni(ogrenciId); /* waGonder/waKopyalaMesaj ile BİREBİR aynı kaynak */
  if (baslik) baslik.textContent = o ? o.ad : "";
  if (!metin) {
    metinKutu.textContent = "Bu öğrencinin seçili dönemde dersi yok.";
    return;
  }
  metinKutu.textContent = metin; /* innerHTML KULLANILMAZ */
}
function waOnizlemeSifirla() {
  var panel = document.getElementById("waOnizlemePanel");
  var metinKutu = document.getElementById("waOnizlemeMetin");
  var baslik = document.getElementById("waOnizlemeBaslik");
  if (!panel || !metinKutu) return;
  if (baslik) baslik.textContent = "";
  metinKutu.textContent = "Önizlemek için bir öğrenci seçin";
}`;
app = app.replace(waKapatAnchor, yeniFn);
assertOk(app.includes("function waOnizle(ogrenciId)"), "waOnizle eklenemedi");

writeFileSync("app.js", app);
degisen.push("app.js");

/* ================= index.html: panel markup (waIcerik'tan hemen sonra, TEK yer) ================= */
let html = readFileSync("index.html", "utf8");
const waIcerikAnchor = '<div id="waIcerik" class="p-3 max-h-[60vh] overflow-y-auto"></div>';
assertOk(html.includes(waIcerikAnchor), "index.html waIcerik anchor bulunamadı");
const panelHTML = waIcerikAnchor + `
      <!-- ${ISARET}: ortak TEK onizleme paneli (id'ler sabit ve tekillik sırasında korunur) -->
      <div id="waOnizlemePanel" class="mx-3 mb-3 rounded-xl border border-indigo-100 bg-indigo-50/60">
        <div class="flex items-center justify-between px-3.5 pt-2.5 pb-1.5">
          <span class="text-[10.5px] font-extrabold uppercase tracking-wide text-indigo-500"><i class="fa-regular fa-eye mr-1"></i>Mesaj Önizlemesi</span>
          <span id="waOnizlemeBaslik" class="text-[11px] font-bold text-indigo-700 truncate max-w-[60%]"></span>
        </div>
        <pre id="waOnizlemeMetin" class="mx-3 mb-3 rounded-lg bg-white border border-indigo-100 px-3 py-2.5 text-[11.5px] leading-relaxed text-slate-700 whitespace-pre-wrap font-sans overflow-x-auto">Önizlemek için bir öğrenci seçin</pre>
      </div>`;
html = html.replace(waIcerikAnchor, panelHTML);
writeFileSync("index.html", html);
degisen.push("index.html");

/* ================= test.mjs: süit kaydı (tam 1 kez) ================= */
let tm = readFileSync("test.mjs", "utf8");
const suiteAd = "ks-wa-onizleme.mjs";
assertOk(!tm.includes(suiteAd), "test.mjs'te süit zaten var (beklenmedik — idempotans bozuldu)");
const waSablonSuit = '"ks-wa-sablon.mjs"';
assertOk(tm.includes(waSablonSuit), "test.mjs ks-wa-sablon.mjs girdisi bulunamadı");
tm = tm.replace(waSablonSuit, waSablonSuit + ', "' + suiteAd + '"');
writeFileSync("test.mjs", tm);
degisen.push("test.mjs");

/* ================= doğrulama ================= */
for (const f of ["app.js", "ek-ders.js"]) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  assertOk(r.status === 0, f + " sözdizimi hatası: " + (r.stderr || ""));
}
console.log("Yama uygulandı:", degisen.join(", "));
for (const f of degisen) console.log("  " + f, "→", boy(f) + " B", "sha256=" + sha(f));
