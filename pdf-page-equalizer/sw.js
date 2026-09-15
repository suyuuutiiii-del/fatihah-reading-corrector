const CACHE = 'pdf-page-equalizer-v3';
const CORE = [
  './app.html',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];
const EXTERNAL = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    for (const url of EXTERNAL) {
      try {
        const response = await fetch(url, { mode: 'no-cors', cache: 'reload' });
        await cache.put(url, response);
      } catch (e) {
        // The app can still finish caching these resources on first normal use.
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('pdf-page-equalizer-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      const url = new URL(event.request.url);
      const shouldCache = url.origin === self.location.origin || EXTERNAL.includes(event.request.url);
      if (shouldCache && response) {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (e) {
      if (event.request.mode === 'navigate') {
        return (await caches.match('./app.html')) || (await caches.match('./index.html'));
      }
      throw e;
    }
  })());
});