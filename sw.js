var CACHE = 'gastos-v3';

// Nunca cacheia o HTML principal — sempre busca da rede
var NO_CACHE = ['/gastos-casa/', '/gastos-casa/index.html'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Apaga TODOS os caches antigos ao ativar nova versão
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // HTML principal: sempre da rede, sem cache
  if (url.pathname === '/gastos-casa/' || url.pathname === '/gastos-casa/index.html') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Demais recursos (Firebase SDK, etc): network-first com cache de fallback
  e.respondWith(
    fetch(e.request).then(function(response) {
      var clone = response.clone();
      caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
