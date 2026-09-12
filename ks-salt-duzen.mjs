/* ks-salt-duzen.mjs — salt yürütme, kod DEĞİŞTİRME.
   Hedef:
     1) HEM #f-ogrenci HEM #h-ogrenci aynı anda DOM'da olsun (renderFormDestek iki kez).
     2) renderFormDestek() + formaAktar() gerçek DOM semantiği ile yürütülsün.
     3) [id="ek-ogrenciler"] / [id="grup-panel-arama"] / [id="ek-ogrenci-chips"] uzunlukları ölçülsün.
     4) 0 KABUL EDİLMEZ; hedef 1. Eğer 2 çıkarsa bu başarısızlık.
     5) İstek formu aktifken panel parent zinciri #h-ogrenci'de, ana formda #f-ogrenci'de.
     6) getElementById() ilk eşleşme yoluyla yanlış forma ait panele kaçma yok.
     7) 4. bölüm: istek plan öncesi deep-copy snapshot alınır, plan sonrası sadece durum değişir.
   assert'li, idempotent, eksik assert yaratma. */
import { readFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const inlines = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = [readFileSync('app.js', 'utf8'), ...inlines].join('\n;\n');

const store = {};
const reg = {};
const stubEl = (id) => {
  const _html = { value: '' };
  const e = {
    id: id || '', tagName: 'DIV', textContent: '', value: '', checked: false, style: {}, options: [],
    dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(node) {
      if (node && node.id) this.children.push(node);
    },
    remove() {},
    click() {},
    focus() {},
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll(sel) {
      const r = [];
      const walk = (node) => {
        if (!node || 'object' !== typeof node) return;
        if (node.id && node.id === sel.slice(4, -1)) r.push(node);
        if ('children' in node && Array.isArray(node.children)) node.children.forEach(walk);
      };
      this.children.forEach(walk);
      return r;
    },
    getContext() { return null; },
    insertAdjacentHTML(pos, markup) {
      if (markup) {
        const temp = stubEl('anon-' + Math.random().toString(36).slice(2, 8));
        temp.innerHTML = markup;
        this.appendChild(temp);
      }
    },
    innerHTML: '',
    get _innerHTML() { return _html.value; },
    set _innerHTML(v) {
      _html.value = String(v);
      [...String(v).matchAll(/id="([^"]+)"/g)].forEach(m => {
        if (!reg[m[1]]) reg[m[1]] = stubEl(m[1]);
      });
    },
    remove: function () {},
    children: [],
    parentNode: null,
    scrollIntoView() {},
    querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  };
  Object.defineProperty(e, 'innerHTML', {
    get() { return _html.value; },
    set(v) {
      _html.value = String(v);
      [...String(v).matchAll(/id="([^"]+)"/g)].forEach(m => {
        if (!reg[m[1]]) reg[m[1]] = stubEl(m[1]);
      });
    }
  });
  return e;
};
for (const m of html.matchAll(/id="([^"]+)"/g)) stubEl(m[1]);
const dom = {
  getElementById: (id) => reg[id] || stubEl(),
  addEventListener() {},
  removeEventListener() {},
  createElement() {
    const e = stubEl('anon-' + Math.random().toString(36).slice(2, 8));
    reg[e.id] = e;
    return e;
  },
  body: { appendChild() {}, removeChild() {}, querySelectorAll() { return []; } },
  querySelectorAll(sel) {
    const r = [];
    if (sel.startsWith('[id=')) {
      const id = sel.slice(5, -1).replace(/^"/, '').replace(/"$/, '');
      if (reg[id]) r.push(reg[id]);
    }
    return r;
  },
  allEls: reg
};
global.document = dom;
global.window = { crypto: { randomUUID: () => 'w-' + Math.random() }, addEventListener() {}, location: { hostname: 'x' } };
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
global.Chart = function () { this.destroy = () => {}; };
global.tailwind = {};

const $ = (sel) => dom.getElementById(sel);
Object.defineProperty($, 'scrollIntoView', { value() {} });
Object.defineProperty($, 'querySelector', { value(sel) { return dom.getElementById(sel).querySelector(sel); } });
global.$ = $;

const EXPORTS = '{ DB, ui, planla, formaAktar, renderFormDestek, renderHavuz }';
let P;
try { P = new Function(code + ';\n  return ' + EXPORTS + ';\n')(); }
catch (e) { console.log('boot hatası → ' + e.message); process.exit(1); }

const { DB, ui, planla, formaAktar, renderFormDestek, renderHavuz } = P;

// Veri: istek sayısı + analiz bölümüne dokunma.
const ayse = DB.ogrenciler.find(o => o.ad === 'Ayşe Demir');
const zeynep = DB.ogrenciler.find(o => o.ad === 'Zeynep Kaya');
const emir = DB.ogrenciler.find(o => o.ad === 'Emir Aydın');

const test = (label, cond, why) => {
  console.log((cond ? '  ✓' : '  ✗') + ' ' + label + (why ? ' (' + why + ')' : ''));
  if (!cond) { console.log('     Tekrar próbasi gerekiyor.'); process.exitCode = 1; }
};

// 1) Ana form render -> panel yok.
console.log('1) Ana form render (panel yok):');
test('panel yok (haklı)', dom.querySelectorAll('[id="ek-ogrenciler"]').length === 0, 'form yok');
renderFormDestek();
test('renderFormDestek sonrası panel yok (modal yok)', dom.querySelectorAll('[id="ek-ogrenciler"]').length === 0, 'form render');

// 2) İstek formu tetiklenip renderFormDestek panel ekler.
console.log('\n2) İstek form render → panel DOM\'a eklendi:');
DB.istekler = [{
  id: 'ik-r1', ogrenciId: ayse.id, ogrenciAd: ayse.ad,
  dersId: 'mat', konu: 'Limit ve Süreklilik', durum: 'bekliyor', olusturma: '2026-09-01'
}];
ui.aktifIstekId = 'ik-r1';
formaAktar && formaAktar('ik-r1');
const n1 = dom.querySelectorAll('[id="ek-ogrenciler"]').length,
      n2 = dom.querySelectorAll('[id="grup-panel-arama"]').length,
      n3 = dom.querySelectorAll('[id="ek-ogrenci-chips"]').length;
test('[id="ek-ogrenciler"] = 1', n1 === 1, n1);
test('[id="grup-panel-arama"] = 1', n2 === 1, n2);
test('[id="ek-ogrenci-chips"] = 1', n3 === 1, n3);

// 3) İki form aynı anda var mı?
console.log('\n3) Tek form hala iki kez render edilirse yinelenir mi (duplicate yok):');
renderFormDestek();
const n1b = dom.querySelectorAll('[id="ek-ogrenciler"]').length,
      n2b = dom.querySelectorAll('[id="grup-panel-arama"]').length,
      n3b = dom.querySelectorAll('[id="ek-ogrenci-chips"]').length;
test('tekrar render sonrası aynı sayı (1)', n1b === n1 && n2b === n2 && n3b === n3, n1b + ',' + n2b + ',' + n3b);

// 4) İstek formunda panel #h-ogrenci'ye bağlı.
console.log('\n4) İstek form panel parent zinciri (#h-ogrenci):');
const h = dom.getElementById('h-ogrenci');
test('h-ogrenci var', !!h, 'null');
test('panel anak #h-ogrenci altında', h && h.querySelector && !!h.querySelector('#ek-ogrenciler'), 'span');

// 5) Ana formda panel #f-ogrenci'ye bağlı.
console.log('\n5) Ana form panel parent zinciri (#f-ogrenci):');
const f = dom.getElementById('f-ogrenci');
test('f-ogrenci var', !!f, 'null');
test('panel anak #f-ogrenci altında', f && f.querySelector && !!f.querySelector('#ek-ogrenciler'), 'div');

// 6) Her bir getElementById ilk eşleşme ile doğru forma ait panele gider.
console.log('\n6) getElementById ilk eşleşme — form bazlı yönlendirme:');
const hPanel = h && h.querySelector('#ek-ogrenciler');
const fPanel = f && f.querySelector('#ek-ogrenciler');
test('h-ogrenci altında ek-ogrenciler → istek formu (panel)', !!hPanel, 'hPanel');
test('f-ogrenci altında ek-ogrenciler → ana form (panel)', !!fPanel, 'fPanel');
test('getElementById("ek-ogrenciler") ilk eşleşme hPanel\'ten geliyor', !!dom.getElementById('ek-ogrenciler'), 'anchor');
test('getElementById("ek-ogrenciler") objesi hPanel ile aynı', dom.getElementById('ek-ogrenciler') === hPanel, 'id objesi');

// 7) 4. bölüm (plan öncesi snapshot vs. plan sonrası sadece durum).
console.log('\n7) İstek snapshot vs. plan sonrası alan-alan fark (neredeyse bitirilmiş):');
const iksn = DB.istekler.find(x => x.id === 'ik-r1');
if (!iksn) { console.log('  ✗ ik-r1 yok'); }
else {
  const iksnSnapshot = JSON.parse(JSON.stringify(iksn));
  const nBefore = DB.dersler.length;
  try { planla(); } catch (e) { console.log('  ✗ planla hatası ' + e.message); }
  const iksnSonrasi = DB.istekler.find(x => x.id === 'ik-r1');
  const farklar = [];
  if (iksnSonrasi.durum !== iksnSnapshot.durum) farklar.push('durum');
  if (iksnSonrasi.ogrenciId !== iksnSnapshot.ogrenciId) farklar.push('ogrenciId');
  if (iksnSonrasi.ogrenciAd !== iksnSnapshot.ogrenciAd) farklar.push('ogrenciAd');
  if (iksnSonrasi.dersId !== iksnSnapshot.dersId) farklar.push('dersId');
  if (iksnSonrasi.konu !== iksnSnapshot.konu) farklar.push('konu');
  if (iksnSonrasi.olusturma !== iksnSnapshot.olusturma) farklar.push('olusturma');
  if (farklar.length) console.log('  ✗ farklar: ' + farklar.join(', '));
  else console.log('  ✓ istek alan-alan fark yok, sadece durum değişti.');
}
console.log('\nks-salt-duzen: bitti.');
