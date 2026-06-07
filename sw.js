const CACHE = 'gastos-v182';

const CORE_ASSETS = [
  './index.html',
  './manifest.json',
];

const EXT_URLS = [
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(CORE_ASSETS);
      await Promise.allSettled(
        EXT_URLS.map(url =>
          fetch(url, { cache: 'force-cache' })
            .then(res => { if (res.ok) c.put(url, res); })
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => {
      return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(clients => clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' })));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // version.json — sempre da rede, nunca do cache
  if (url.includes('version.json')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => new Response('{"v":0}', { status: 200 })));
    return;
  }

  // travel.html — sempre da rede; se vier com ?_nc= passa o query para bustar CDN
  if (url.includes('travel.html')) {
    const fetchUrl = url.includes('_nc=') ? url : url.split('?')[0] + '?_sw=' + CACHE;
    e.respondWith(
      fetch(new Request(fetchUrl, { cache: 'no-store' }))
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put('./travel.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./travel.html'))
    );
    return;
  }

  // Firebase / auth APIs — sempre rede
  if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('firebaseapp.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // HTML — network-first para sempre pegar versão mais nova
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // External CDN — cache-first
  const isExt = url.includes('gstatic.com') || url.includes('cloudflare.com');
  if (isExt) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // Todo o resto — cache-first
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
