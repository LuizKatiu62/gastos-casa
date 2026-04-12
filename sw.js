var CACHE = 'gastos-v1';

// Ao instalar, não pré-carrega nada — sempre busca da rede
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Apaga caches antigos
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Network-first: tenta sempre a rede, cai no cache só se offline
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(response) {
      var clone = response.clone();
      caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
