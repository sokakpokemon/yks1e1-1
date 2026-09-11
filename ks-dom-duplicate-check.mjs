/* ks-dom-duplicate-check.mjs — Windows'a kadar DOM'daki id tekrarlarını sayar
   (planlama formu + istek havuzu formu HER ikisi de render edilincek şekilde boot)
   Mesaj: gerçek `document.querySelectorAll('[id=...]').length` ölçer.
   NOT: ks-panel-secim.mjs'in tam boot desenini kopyalar — çift eval yok; tek
   boot sonrası `document` gerçek DOM kayıt defteridir. */
import { readFileSync } from 'node:fs';
const html = readFileSync('index.html','utf8');
const scripts = [readFileSync('app.js','utf8'), ...[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1])].join(';\n');

const store={};
globalThis.tailwind={};
global.window={
  crypto:{randomUUID:()=>'id-'+(Math.random())},
  addEventListener(){},
  getComputedStyle(){return {}},
  location:{hostname:'x'}
};
function elStub(){
  const e={};
  e.options=[];
  e.getContext=()=>null;
  e.style={};
  e.classList={add(){},remove(){},toggle(){},contains(){return false;}};
  e.innerHTML='';
  e.textContent='';
  e.value='';
  e.appendChild=()=>{};
  e.remove=()=>{};
  e.click=()=>{};
  e.scrollIntoView=()=>{};
  e.addEventListener=()=>{};
  e.dataset={};
  e.querySelectorAll=()=>[];
  e.getContext=()=>null;
  return e;
}
const bodyStub={};
bodyStub.appendChild=()=>{};
bodyStub.removeChild=()=>{};
global.document={
  getElementById:()=>elStub(),
  addEventListener(){},
  createElement:()=>elStub(),
  body:bodyStub,
  querySelectorAll:()=>[]
};
global.localStorage={getItem:(k)=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:(k)=>{delete store[k]}};
global.Chart=function(){this.destroy=()=>{}};

const EXPORTS='{ DB, ui, planla, formaAktar, duzeltmeBul, dersOgrenciIds, renderFormDestek, grupPanelCiz, grupPanelListe, grupPanelSecimler, grupPanelTumSiniflar, grupPanelSec, grupPanelOzetCiz, grupPanelToggle }';
let P;
try{
  P=new Function(scripts+'\n  return '+EXPORTS+';\n')();
}catch(e){
  console.log('boot hatasız → '+e.message);
  console.log(e.stack.split('\n').slice(0,6).join('\n'));
  process.exit(1);
}
const {DB,ui}=P;

const ids=['ek-ogrenciler','grup-panel-arama','ek-ogrenci-chips','ek-panel','grup-panel-govde','grup-panel-uyari'];
console.log('boot sonrası DOM id tekrar sayıları:');
for (const id of ids){
  const n=document.querySelectorAll('[id="'+id+'"]').length;
  console.log('  id="'+id+'" → length='+n);
}
console.log('ok');
