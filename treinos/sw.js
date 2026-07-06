const CACHE = 'treinos-v74';
const CORE = ['./manifest.json']; // HTML never cached — always fetched fresh

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Always bypass cache for the service worker itself.
  if (url.includes('/sw.js')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  // HTML: NEVER cache — always go to network
  if (e.request.destination === 'document' ||
      (e.request.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  // Firebase / external CDNs: always network
  if (url.includes('firebaseio.com') || url.includes('firebase.googleapis.com') ||
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('gstatic.com') || url.includes('cdnjs.cloudflare.com') ||
      url.includes('strava.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Other static assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});
