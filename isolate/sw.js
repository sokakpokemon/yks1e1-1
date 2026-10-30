/* sw.js — YKS Birebir Takip · PWA service worker (çevrimdışı çalışma)
   Strateji:
   - Kurulumda PRECACHE listesi önbelleğe alınır (tek dosya 404 olsa bile kurulum düşmez;
     her URL ayrı ayrı denenir, hata konsola yazılır).
   - ?v=<sha16> damgalı uygulama script'leri (app.js · takip-sistem.js · ek-ders.js)
     NETWORK-FIRST: önce ağ; ağ yoksa Cache API'den ignoreSearch:true ile bulunur.
     (Damga her build'de değiştiği için doğrudan precache listesine yazılmaz.)
   - Sayfa gezinmeleri (navigation) network-first: çevrimiçiyken taze index.html gelir
     (bayat ?v= damgası önbellekte kilitlenmesin), çevrimdışıyken son kopya verilir.
   - Diğer statik varlıklar cache-first.
   Cache adı değişirse (yks-takip-v2) activate eski cache'leri siler. */

const CACHE = 'yks-takip-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vendor/xlsx.full.min.js',
  '/vendor/chart.js',
  '/vendor/html2canvas.js',
  '/vendor/fonts.css',
  '/vendor/fontawesome.css',
  '/vendor/fonts/montserrat-900-italic.woff2'
];

/* ?v=hash ile çağrılan, precache'e yazılamayan uygulama script'leri */
const DAMGALI_SCRIPTLER = ['app.js', 'takip-sistem.js', 'ek-ders.js'];

const damgaliMi = (pathname) => DAMGALI_SCRIPTLER.some((ad) => pathname === '/' + ad || pathname.endsWith('/' + ad));

/* ——— KURULUM: precache ——— */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const sonuc = await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const yanit = await fetch(new Request(url, { cache: 'no-store' }));
            if (!yanit || !yanit.ok) throw new Error('HTTP ' + (yanit ? yanit.status : 'yok'));
            await cache.put(url, yanit.clone());
            return true;
          } catch (err) {
            console.log('SW precache atlandı:', url, err && err.message);
            return false;
          }
        })
      );
      console.log('SW kuruldu: ' + sonuc.filter(Boolean).length + '/' + PRECACHE.length + ' dosya önbellekte (' + CACHE + ')');
      await self.skipWaiting();
    })()
  );
});

/* ——— ETKİNLEŞME: eski cache temizliği ——— */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const adlar = await caches.keys();
      await Promise.all(adlar.filter((ad) => ad !== CACHE).map((ad) => caches.delete(ad)));
      await self.clients.claim();
    })()
  );
});

/* ——— STRATEJİLER ——— */

/* Network-first: ?v= damgalı uygulama script'leri. Ağ yoksa ignoreSearch ile cache. */
async function agOnce(istek) {
  try {
    const yanit = await fetch(istek);
    if (yanit && yanit.ok) {
      const cache = await caches.open(CACHE);
      const anahtar = new URL(istek.url);
      anahtar.search = ''; /* kanonik anahtar: /app.js — damga değişse de tek kopya tutulur */
      try { await cache.put(new Request(anahtar.href), yanit.clone()); } catch (e) { /* kota */ }
    }
    return yanit;
  } catch (err) {
    const cacheli = await caches.match(istek, { ignoreSearch: true });
    if (cacheli) return cacheli;
    return new Response('', { status: 504, statusText: 'Çevrimdışı — dosya önbellekte yok' });
  }
}

/* Navigation: önce ağ (taze index.html + taze ?v= damgası), sonra önbellek. */
async function gezinme(istek) {
  try {
    const yanit = await fetch(istek);
    if (yanit && yanit.ok) {
      const cache = await caches.open(CACHE);
      try { await cache.put('/index.html', yanit.clone()); } catch (e) { /* kota */ }
    }
    return yanit;
  } catch (err) {
    const cacheli = (await caches.match('/index.html', { ignoreSearch: true })) || (await caches.match('/'));
    if (cacheli) return cacheli;
    return new Response('', { status: 504, statusText: 'Çevrimdışı' });
  }
}

/* Cache-first: diğer statik varlıklar. */
async function onbellekOnce(istek) {
  const cacheli = await caches.match(istek, { ignoreSearch: true });
  if (cacheli) return cacheli;
  try {
    const yanit = await fetch(istek);
    if (yanit && (yanit.ok || yanit.type === 'opaque')) {
      const cache = await caches.open(CACHE);
      try { await cache.put(istek, yanit.clone()); } catch (e) { /* kota */ }
    }
    return yanit;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Çevrimdışı' });
  }
}

self.addEventListener('fetch', (event) => {
  const istek = event.request;
  if (istek.method !== 'GET') return;

  let url;
  try { url = new URL(istek.url); } catch (e) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) return; /* harici kaynaklara karışma */
  if (url.pathname === '/sw.js') return;           /* SW'nin kendisi cache'lenmez */

  if (istek.mode === 'navigate') { event.respondWith(gezinme(istek)); return; }
  if (damgaliMi(url.pathname)) { event.respondWith(agOnce(istek)); return; }
  event.respondWith(onbellekOnce(istek));
});
